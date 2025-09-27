// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./libraries/PoseidonHash.sol";

/**
 * @title PrivacyRegistry - Manages privacy metadata and user configurations
 * @dev Central registry for privacy settings, commitment tracking, and user configurations
 * @notice This contract provides:
 *         - User privacy configuration management
 *         - Commitment registration and validation
 *         - Privacy pool metadata tracking
 *         - Cross-pool coordination
 *         - Privacy score calculation
 */
contract PrivacyRegistry is Ownable, ReentrancyGuard, Pausable {
    using PoseidonHash for bytes32[];

    // Privacy configuration for users
    struct PrivacyConfig {
        bool zkProofsEnabled;           // Whether user has ZK proofs enabled
        uint256 minMixingAmount;        // Minimum amount for mixing (in wei)
        uint256 maxMixingAmount;        // Maximum amount for mixing (in wei)
        bytes32 merkleRoot;             // User's current merkle root preference
        uint256 anonymitySetSize;       // Preferred anonymity set size
        uint256 mixingRounds;           // Number of mixing rounds preferred
        bool crossChainEnabled;         // Whether cross-chain privacy is enabled
        uint256 privacyScore;           // Calculated privacy score (0-100)
        uint256 lastUpdated;            // Last configuration update timestamp
        bytes32[] trustedCommitments;   // Array of trusted commitments
    }

    // Pool information for privacy tracking
    struct PoolInfo {
        address poolAddress;            // Address of the privacy pool
        string poolType;               // Type of pool (shielded, mixing, etc.)
        uint256 totalCommitments;      // Total commitments in this pool
        uint256 anonymitySet;          // Current anonymity set size
        uint256 tvl;                   // Total value locked
        bool isActive;                 // Whether pool is active
        uint256 createdAt;             // Pool creation timestamp
        bytes32 merkleRoot;            // Current merkle root
        mapping(bytes32 => bool) commitments; // commitment => exists
    }

    // Privacy metrics for analysis
    struct PrivacyMetrics {
        uint256 totalUsers;            // Total users with privacy config
        uint256 totalCommitments;      // Total registered commitments
        uint256 totalPools;            // Total registered pools
        uint256 averageAnonymitySet;   // Average anonymity set across pools
        uint256 totalPrivacyScore;     // Sum of all privacy scores
        uint256 lastUpdated;           // Last metrics update
    }

    // Mappings
    mapping(address => PrivacyConfig) public userConfigs;
    mapping(address => PoolInfo) public poolInfo;
    mapping(bytes32 => bool) public validCommitments;
    mapping(bytes32 => address) public commitmentOwner;
    mapping(bytes32 => uint256) public commitmentTimestamp;
    mapping(address => address[]) public userPools;          // user => pools they've used
    mapping(address => bytes32[]) public userCommitments;    // user => their commitments
    
    // Registry state
    PrivacyMetrics public globalMetrics;
    address[] public registeredPools;
    bytes32[] public allCommitments;
    
    // Configuration
    uint256 public constant MAX_PRIVACY_SCORE = 100;
    uint256 public constant MIN_ANONYMITY_SET = 10;
    uint256 public registrationFee = 0;
    bool public commitmentRegistrationRequired = false;

    // Events
    event PrivacyConfigUpdated(
        address indexed user,
        bool zkProofsEnabled,
        uint256 minMixingAmount,
        uint256 maxMixingAmount,
        uint256 privacyScore
    );

    event CommitmentRegistered(
        bytes32 indexed commitment,
        address indexed owner,
        address indexed pool,
        uint256 timestamp
    );

    event PoolRegistered(
        address indexed pool,
        string poolType,
        uint256 timestamp
    );

    event PrivacyScoreUpdated(
        address indexed user,
        uint256 oldScore,
        uint256 newScore,
        string reason
    );

    event MetricsUpdated(
        uint256 totalUsers,
        uint256 totalCommitments,
        uint256 totalPools,
        uint256 averageAnonymitySet
    );

    // Errors
    error InvalidPrivacyConfig();
    error CommitmentAlreadyExists();
    error PoolNotRegistered();
    error UnauthorizedAccess();
    error InvalidCommitment();
    error InsufficientFee();
    error RegistrationNotRequired();
    error InvalidPoolType();

    constructor() Ownable(msg.sender) {
        globalMetrics = PrivacyMetrics({
            totalUsers: 0,
            totalCommitments: 0,
            totalPools: 0,
            averageAnonymitySet: 0,
            totalPrivacyScore: 0,
            lastUpdated: block.timestamp
        });
    }

    /**
     * @dev Update user privacy configuration
     * @param config The new privacy configuration
     */
    function updatePrivacyConfig(PrivacyConfig calldata config) external payable whenNotPaused {
        if (msg.value < registrationFee) revert InsufficientFee();
        if (config.minMixingAmount > config.maxMixingAmount) revert InvalidPrivacyConfig();
        if (config.mixingRounds == 0 || config.mixingRounds > 10) revert InvalidPrivacyConfig();

        PrivacyConfig storage userConfig = userConfigs[msg.sender];
        uint256 oldScore = userConfig.privacyScore;
        
        // Calculate new privacy score
        uint256 newScore = calculatePrivacyScore(config);
        
        // Update configuration
        userConfig.zkProofsEnabled = config.zkProofsEnabled;
        userConfig.minMixingAmount = config.minMixingAmount;
        userConfig.maxMixingAmount = config.maxMixingAmount;
        userConfig.merkleRoot = config.merkleRoot;
        userConfig.anonymitySetSize = config.anonymitySetSize;
        userConfig.mixingRounds = config.mixingRounds;
        userConfig.crossChainEnabled = config.crossChainEnabled;
        userConfig.privacyScore = newScore;
        userConfig.lastUpdated = block.timestamp;

        // Update global metrics if new user
        if (oldScore == 0 && newScore > 0) {
            globalMetrics.totalUsers++;
        }
        
        // Update total privacy score
        globalMetrics.totalPrivacyScore = globalMetrics.totalPrivacyScore - oldScore + newScore;
        globalMetrics.lastUpdated = block.timestamp;

        // Refund excess payment
        if (msg.value > registrationFee) {
            (bool success, ) = msg.sender.call{value: msg.value - registrationFee}("");
            require(success, "Refund failed");
        }

        emit PrivacyConfigUpdated(
            msg.sender,
            config.zkProofsEnabled,
            config.minMixingAmount,
            config.maxMixingAmount,
            newScore
        );

        if (oldScore != newScore) {
            emit PrivacyScoreUpdated(msg.sender, oldScore, newScore, "Config updated");
        }
    }

    /**
     * @dev Register a new commitment
     * @param commitment The commitment hash to register
     * @param poolAddress The pool where this commitment exists
     */
    function registerCommitment(
        bytes32 commitment,
        address poolAddress
    ) external whenNotPaused {
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (validCommitments[commitment]) revert CommitmentAlreadyExists();
        if (!isPoolRegistered(poolAddress)) revert PoolNotRegistered();

        // Register commitment
        validCommitments[commitment] = true;
        commitmentOwner[commitment] = msg.sender;
        commitmentTimestamp[commitment] = block.timestamp;
        
        // Add to user's commitments
        userCommitments[msg.sender].push(commitment);
        
        // Add to pool's commitments
        poolInfo[poolAddress].commitments[commitment] = true;
        poolInfo[poolAddress].totalCommitments++;
        
        // Update global metrics
        globalMetrics.totalCommitments++;
        allCommitments.push(commitment);
        globalMetrics.lastUpdated = block.timestamp;

        // Update user's privacy score based on commitment activity
        _updateUserPrivacyScore(msg.sender, "New commitment registered");

        emit CommitmentRegistered(commitment, msg.sender, poolAddress, block.timestamp);
    }

    /**
     * @dev Register a new privacy pool
     * @param poolAddress Address of the pool to register
     * @param poolType Type of pool (e.g., "shielded", "mixing", "tornado")
     * @param merkleRoot Initial merkle root of the pool
     */
    function registerPool(
        address poolAddress,
        string calldata poolType,
        bytes32 merkleRoot
    ) external onlyOwner {
        require(poolAddress != address(0), "Invalid pool address");
        require(bytes(poolType).length > 0, "Invalid pool type");
        
        PoolInfo storage pool = poolInfo[poolAddress];
        require(pool.createdAt == 0, "Pool already registered");

        // Register pool
        pool.poolAddress = poolAddress;
        pool.poolType = poolType;
        pool.totalCommitments = 0;
        pool.anonymitySet = 0;
        pool.tvl = 0;
        pool.isActive = true;
        pool.createdAt = block.timestamp;
        pool.merkleRoot = merkleRoot;

        registeredPools.push(poolAddress);
        globalMetrics.totalPools++;
        globalMetrics.lastUpdated = block.timestamp;

        emit PoolRegistered(poolAddress, poolType, block.timestamp);
    }

    /**
     * @dev Calculate privacy score for a user configuration
     * @param config The privacy configuration
     * @return The calculated privacy score (0-100)
     */
    function calculatePrivacyScore(PrivacyConfig calldata config) public pure returns (uint256) {
        uint256 score = 0;
        
        // Base score for having ZK proofs enabled
        if (config.zkProofsEnabled) {
            score += 30;
        }
        
        // Score based on mixing amounts (higher range = higher score)
        if (config.maxMixingAmount > config.minMixingAmount) {
            uint256 rangeFactor = (config.maxMixingAmount - config.minMixingAmount) / 1e18;
            score += (rangeFactor > 10) ? 15 : rangeFactor * 1.5;
        }
        
        // Score based on anonymity set size preference
        if (config.anonymitySetSize >= MIN_ANONYMITY_SET) {
            score += (config.anonymitySetSize >= 100) ? 20 : 
                     (config.anonymitySetSize >= 50) ? 15 : 10;
        }
        
        // Score based on mixing rounds
        if (config.mixingRounds > 1) {
            score += (config.mixingRounds > 5) ? 15 : config.mixingRounds * 3;
        }
        
        // Bonus for cross-chain privacy
        if (config.crossChainEnabled) {
            score += 10;
        }
        
        return score > MAX_PRIVACY_SCORE ? MAX_PRIVACY_SCORE : score;
    }

    /**
     * @dev Update user's privacy score based on activity
     * @param user User address
     * @param reason Reason for score update
     */
    function _updateUserPrivacyScore(address user, string memory reason) internal {
        PrivacyConfig storage config = userConfigs[user];
        if (config.lastUpdated == 0) return; // User has no config
        
        uint256 oldScore = config.privacyScore;
        uint256 commitmentCount = userCommitments[user].length;
        uint256 poolCount = userPools[user].length;
        
        // Bonus points for activity
        uint256 activityBonus = 0;
        if (commitmentCount >= 10) activityBonus += 5;
        if (commitmentCount >= 50) activityBonus += 5;
        if (poolCount >= 3) activityBonus += 3;
        if (poolCount >= 5) activityBonus += 2;
        
        uint256 newScore = calculatePrivacyScore(config) + activityBonus;
        newScore = newScore > MAX_PRIVACY_SCORE ? MAX_PRIVACY_SCORE : newScore;
        
        if (newScore != oldScore) {
            config.privacyScore = newScore;
            globalMetrics.totalPrivacyScore = globalMetrics.totalPrivacyScore - oldScore + newScore;
            emit PrivacyScoreUpdated(user, oldScore, newScore, reason);
        }
    }

    /**
     * @dev Check if commitment is valid/registered
     * @param commitment The commitment to check
     * @return Boolean indicating validity
     */
    function isValidCommitment(bytes32 commitment) external view returns (bool) {
        return validCommitments[commitment];
    }

    /**
     * @dev Check if pool is registered
     * @param poolAddress The pool address to check
     * @return Boolean indicating if pool is registered
     */
    function isPoolRegistered(address poolAddress) public view returns (bool) {
        return poolInfo[poolAddress].createdAt > 0;
    }

    /**
     * @dev Get user's privacy configuration
     * @param user User address
     * @return The user's privacy configuration
     */
    function getUserPrivacyConfig(address user) external view returns (PrivacyConfig memory) {
        return userConfigs[user];
    }

    /**
     * @dev Get user's commitments
     * @param user User address
     * @return Array of user's commitments
     */
    function getUserCommitments(address user) external view returns (bytes32[] memory) {
        return userCommitments[user];
    }

    /**
     * @dev Get user's privacy pools
     * @param user User address
     * @return Array of pools user has interacted with
     */
    function getUserPools(address user) external view returns (address[] memory) {
        return userPools[user];
    }

    /**
     * @dev Get pool information
     * @param poolAddress Pool address
     * @return Pool information struct (excluding commitment mapping)
     */
    function getPoolInfo(address poolAddress) external view returns (
        address,
        string memory,
        uint256,
        uint256,
        uint256,
        bool,
        uint256,
        bytes32
    ) {
        PoolInfo storage pool = poolInfo[poolAddress];
        return (
            pool.poolAddress,
            pool.poolType,
            pool.totalCommitments,
            pool.anonymitySet,
            pool.tvl,
            pool.isActive,
            pool.createdAt,
            pool.merkleRoot
        );
    }

    /**
     * @dev Get global privacy metrics
     * @return Global metrics struct
     */
    function getGlobalMetrics() external view returns (PrivacyMetrics memory) {
        return globalMetrics;
    }

    /**
     * @dev Get commitment ownership info
     * @param commitment Commitment hash
     * @return owner Owner address
     * @return timestamp Registration timestamp
     */
    function getCommitmentInfo(bytes32 commitment) external view returns (
        address owner,
        uint256 timestamp
    ) {
        return (commitmentOwner[commitment], commitmentTimestamp[commitment]);
    }

    /**
     * @dev Calculate average privacy score
     * @return Average privacy score across all users
     */
    function getAveragePrivacyScore() external view returns (uint256) {
        if (globalMetrics.totalUsers == 0) return 0;
        return globalMetrics.totalPrivacyScore / globalMetrics.totalUsers;
    }

    /**
     * @dev Get all registered pools
     * @return Array of registered pool addresses
     */
    function getRegisteredPools() external view returns (address[] memory) {
        return registeredPools;
    }

    // Admin functions

    /**
     * @dev Set registration fee (only owner)
     * @param fee New registration fee in wei
     */
    function setRegistrationFee(uint256 fee) external onlyOwner {
        registrationFee = fee;
    }

    /**
     * @dev Set whether commitment registration is required (only owner)
     * @param required Whether registration is required
     */
    function setCommitmentRegistrationRequired(bool required) external onlyOwner {
        commitmentRegistrationRequired = required;
    }

    /**
     * @dev Update pool status (only owner)
     * @param poolAddress Pool to update
     * @param isActive New active status
     */
    function updatePoolStatus(address poolAddress, bool isActive) external onlyOwner {
        if (!isPoolRegistered(poolAddress)) revert PoolNotRegistered();
        poolInfo[poolAddress].isActive = isActive;
    }

    /**
     * @dev Emergency pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Update global metrics manually (only owner)
     */
    function updateGlobalMetrics() external onlyOwner {
        uint256 totalAnonymity = 0;
        uint256 activePools = 0;
        
        for (uint256 i = 0; i < registeredPools.length; i++) {
            PoolInfo storage pool = poolInfo[registeredPools[i]];
            if (pool.isActive) {
                totalAnonymity += pool.anonymitySet;
                activePools++;
            }
        }
        
        globalMetrics.averageAnonymitySet = activePools > 0 ? totalAnonymity / activePools : 0;
        globalMetrics.lastUpdated = block.timestamp;
        
        emit MetricsUpdated(
            globalMetrics.totalUsers,
            globalMetrics.totalCommitments,
            globalMetrics.totalPools,
            globalMetrics.averageAnonymitySet
        );
    }

    /**
     * @dev Receive function for fee payments
     */
    receive() external payable {
        // Accept ETH for registration fees
    }
}
