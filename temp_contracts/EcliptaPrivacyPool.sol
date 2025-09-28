// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IVerifier.sol";
import "./libraries/PoseidonHash.sol";
import "./libraries/MerkleTree.sol";

/**
 * @title EcliptaPrivacyPool
 * @dev Advanced privacy-preserving pool with comprehensive features:
 *      - Multi-denomination support for enhanced anonymity
 *      - ENS domain integration for privacy-preserving name resolution
 *      - Poseidon hash implementation for ZK-optimized operations
 *      - Compliance features with selective disclosure
 *      - Advanced nullifier schemes and Merkle tree optimizations
 *      - Cross-chain privacy support preparation
 *      - Enhanced security and operational features
 * @notice This contract implements the comprehensive privacy pool system as specified
 *         in the promptmain.txt requirements with advanced cryptographic features
 */
contract EcliptaPrivacyPool is ReentrancyGuard, Ownable, Pausable, Initializable {
    using SafeERC20 for IERC20;
    using PoseidonHash for bytes32[];
    using PoseidonHash for uint256[];

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS AND IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// @dev Maximum number of supported denominations per token
    uint256 private constant MAX_DENOMINATIONS = 10;
    
    /// @dev Maximum withdrawal fee in basis points (10%)
    uint256 private constant MAX_WITHDRAWAL_FEE = 1000;
    
    /// @dev Merkle tree height for commitment storage
    uint256 private constant MERKLE_TREE_HEIGHT = 32;
    
    /// @dev Maximum age for Merkle roots (in blocks)
    uint256 private constant MAX_ROOT_AGE = 100;
    
    /// @dev Compliance levels for regulatory features
    enum ComplianceLevel { None, Basic, Enhanced, Full }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// @dev Zero-knowledge proof verifier contract
    IVerifier public immutable verifier;
    
    /// @dev Merkle tree for storing commitments
    MerkleTree.Tree private commitmentTree;
    
    /// @dev Pool configuration structure
    struct PoolConfig {
        bool isActive;                    // Pool operational status
        uint256 minConfirmations;         // Minimum block confirmations
        uint256 maxDepositsPerBlock;      // Rate limiting for deposits
        uint256 withdrawalDelay;          // Minimum delay between deposit and withdrawal
        ComplianceLevel complianceLevel;  // Required compliance level
        address complianceOracle;         // Oracle for compliance verification
        bool ensIntegrationEnabled;       // ENS domain integration status
        uint256 anonymityPoolThreshold;   // Minimum anonymity set size
    }
    
    PoolConfig public poolConfig;
    
    /// @dev Denomination configuration for each supported token and amount
    struct Denomination {
        address tokenAddress;      // Token contract address (address(0) for ETH)
        uint256 amount;           // Fixed denomination amount
        uint256 withdrawalFee;    // Fee in basis points
        bool isActive;            // Whether this denomination is active
        uint256 totalDeposits;    // Total deposits for this denomination
        uint256 totalWithdrawals; // Total withdrawals for this denomination
        uint256 anonymitySet;     // Current anonymity set size
        uint256 minAnonymitySet;  // Minimum required anonymity set
    }
    
    /// @dev Mapping of denomination ID to configuration
    mapping(bytes32 => Denomination) public denominations;
    
    /// @dev Array of all denomination IDs for enumeration
    bytes32[] public denominationIds;
    
    /// @dev Enhanced commitment tracking with metadata
    struct CommitmentData {
        bool exists;              // Whether commitment exists
        uint256 timestamp;        // Block timestamp of deposit
        uint256 blockNumber;      // Block number of deposit
        bytes32 denominationId;   // Associated denomination
        bytes32 ensHash;          // ENS domain hash (if applicable)
        ComplianceLevel compliance; // Compliance level at deposit
    }
    
    mapping(bytes32 => CommitmentData) public commitments;
    mapping(bytes32 => uint256) public commitmentIndex;
    
    /// @dev Enhanced nullifier tracking with metadata
    struct NullifierData {
        bool isUsed;              // Whether nullifier has been used
        uint256 timestamp;        // Block timestamp of withdrawal
        bytes32 denominationId;   // Associated denomination
        address recipient;        // Withdrawal recipient
        bytes32 merkleRoot;       // Merkle root used for proof
    }
    
    mapping(bytes32 => NullifierData) public nullifiers;
    
    /// @dev Merkle root history management
    struct RootData {
        bytes32 root;             // Root hash
        uint256 timestamp;        // When root was added
        uint256 blockNumber;      // Block number when added
        bool isValid;             // Whether root is still valid for withdrawals
    }
    
    mapping(bytes32 => RootData) public rootHistory;
    bytes32[] public rootList;
    uint256 public currentRootIndex;
    
    /// @dev ENS domain integration
    struct ENSData {
        bytes32 ensHash;          // Poseidon hash of ENS domain
        address owner;            // Domain owner
        bool privacyEnabled;      // Privacy mode for this domain
        mapping(bytes32 => bool) authorizedCommitments; // Authorized commitments
    }
    
    mapping(bytes32 => ENSData) public ensRegistry;
    
    /// @dev Compliance and regulatory features
    struct ComplianceData {
        mapping(address => ComplianceLevel) userComplianceLevel;
        mapping(address => bool) isBlacklisted;
        mapping(address => bytes32) kycHash; // Zero-knowledge KYC proof hash
        mapping(bytes32 => bool) complianceProofs; // Valid compliance proofs
    }
    
    ComplianceData private complianceData;
    
    /// @dev Rate limiting and security
    mapping(address => uint256) public lastDepositBlock;
    mapping(address => uint256) public depositsInBlock;
    mapping(uint256 => uint256) public depositsPerBlock;
    
    /// @dev Pool statistics and analytics
    uint256 public totalUniqueDepositors;
    uint256 public totalOperations;
    uint256 public nextCommitmentIndex;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    event DepositWithMetadata(
        bytes32 indexed commitment,
        bytes32 indexed denominationId,
        uint256 indexed leafIndex,
        uint256 timestamp,
        bytes32 merkleRoot,
        bytes32 ensHash,
        ComplianceLevel complianceLevel
    );
    
    event WithdrawalWithMetadata(
        bytes32 indexed nullifier,
        bytes32 indexed denominationId,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        bytes32 merkleRoot,
        uint256 timestamp
    );
    
    event DenominationAdded(
        bytes32 indexed denominationId,
        address indexed tokenAddress,
        uint256 amount,
        uint256 withdrawalFee
    );
    
    event DenominationUpdated(
        bytes32 indexed denominationId,
        uint256 withdrawalFee,
        bool isActive,
        uint256 minAnonymitySet
    );
    
    event ENSDomainRegistered(
        bytes32 indexed ensHash,
        address indexed owner,
        bool privacyEnabled
    );
    
    event ComplianceLevelUpdated(
        address indexed user,
        ComplianceLevel oldLevel,
        ComplianceLevel newLevel
    );
    
    event MerkleRootUpdated(
        bytes32 indexed oldRoot,
        bytes32 indexed newRoot,
        uint256 blockNumber
    );
    
    event PoolConfigurationUpdated(
        uint256 minConfirmations,
        uint256 maxDepositsPerBlock,
        uint256 withdrawalDelay,
        ComplianceLevel complianceLevel
    );
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════
    
    error InvalidVerifierAddress();
    error InvalidDenominationId();
    error DenominationNotActive();
    error DenominationAlreadyExists();
    error InvalidDepositAmount();
    error InvalidWithdrawalFee();
    error CommitmentAlreadyExists();
    error CommitmentNotFound();
    error NullifierAlreadyUsed();
    error InvalidMerkleRoot();
    error InvalidProof();
    error InsufficientAnonymitySet();
    error WithdrawalTooEarly();
    error RateLimitExceeded();
    error ComplianceCheckFailed();
    error ENSNotAuthorized();
    error InvalidENSHash();
    error BlacklistedAddress();
    error InvalidComplianceLevel();
    error EmergencyModeActive();
    error TreeUpdateFailed();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidRecipient();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR AND INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Initialize the enhanced privacy pool
     * @param _verifier Zero-knowledge proof verifier contract address
     * @param _complianceOracle Oracle contract for compliance verification
     */
    constructor(
        address _verifier,
        address _complianceOracle
    ) Ownable(msg.sender) {
        if (_verifier == address(0)) revert InvalidVerifierAddress();
        
        verifier = IVerifier(_verifier);
        
        // Initialize pool configuration with secure defaults
        poolConfig = PoolConfig({
            isActive: true,
            minConfirmations: 1,
            maxDepositsPerBlock: 100,
            withdrawalDelay: 0, // Can be increased for enhanced security
            complianceLevel: ComplianceLevel.None,
            complianceOracle: _complianceOracle,
            ensIntegrationEnabled: true,
            anonymityPoolThreshold: 10
        });
        
        // Initialize Merkle tree
        commitmentTree.initialize(MERKLE_TREE_HEIGHT);
        
        emit PoolConfigurationUpdated(
            poolConfig.minConfirmations,
            poolConfig.maxDepositsPerBlock,
            poolConfig.withdrawalDelay,
            poolConfig.complianceLevel
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DENOMINATION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Add a new denomination to the pool
     * @param _tokenAddress Token contract address (address(0) for ETH)
     * @param _amount Fixed denomination amount
     * @param _withdrawalFee Withdrawal fee in basis points
     * @param _minAnonymitySet Minimum required anonymity set size
     */
    function addDenomination(
        address _tokenAddress,
        uint256 _amount,
        uint256 _withdrawalFee,
        uint256 _minAnonymitySet
    ) external onlyOwner {
        if (_amount == 0) revert InvalidDepositAmount();
        if (_withdrawalFee > MAX_WITHDRAWAL_FEE) revert InvalidWithdrawalFee();
        if (denominationIds.length >= MAX_DENOMINATIONS) revert RateLimitExceeded();
        
        // Generate denomination ID using Poseidon hash
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = uint256(uint160(_tokenAddress));
        inputs[1] = _amount;
        bytes32 denominationId = bytes32(PoseidonHash.poseidon(inputs));
        
        if (denominations[denominationId].amount != 0) revert DenominationAlreadyExists();
        
        denominations[denominationId] = Denomination({
            tokenAddress: _tokenAddress,
            amount: _amount,
            withdrawalFee: _withdrawalFee,
            isActive: true,
            totalDeposits: 0,
            totalWithdrawals: 0,
            anonymitySet: 0,
            minAnonymitySet: _minAnonymitySet
        });
        
        denominationIds.push(denominationId);
        
        emit DenominationAdded(denominationId, _tokenAddress, _amount, _withdrawalFee);
    }
    
    /**
     * @dev Update denomination parameters
     * @param _denominationId Denomination identifier
     * @param _withdrawalFee New withdrawal fee in basis points
     * @param _isActive Whether denomination should be active
     * @param _minAnonymitySet New minimum anonymity set requirement
     */
    function updateDenomination(
        bytes32 _denominationId,
        uint256 _withdrawalFee,
        bool _isActive,
        uint256 _minAnonymitySet
    ) external onlyOwner {
        if (denominations[_denominationId].amount == 0) revert InvalidDenominationId();
        if (_withdrawalFee > MAX_WITHDRAWAL_FEE) revert InvalidWithdrawalFee();
        
        denominations[_denominationId].withdrawalFee = _withdrawalFee;
        denominations[_denominationId].isActive = _isActive;
        denominations[_denominationId].minAnonymitySet = _minAnonymitySet;
        
        emit DenominationUpdated(_denominationId, _withdrawalFee, _isActive, _minAnonymitySet);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENS INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Register ENS domain for privacy-preserving usage
     * @param _ensName The ENS domain name
     * @param _privacyEnabled Whether to enable privacy features for this domain
     */
    function registerENSDomain(
        string calldata _ensName,
        bool _privacyEnabled
    ) external {
        // Generate ENS hash using Poseidon for ZK compatibility
        bytes32 ensHash = keccak256(abi.encodePacked(_ensName));
        
        // Convert to Poseidon hash for ZK circuit compatibility
        uint256[] memory inputs = new uint256[](1);
        inputs[0] = uint256(ensHash);
        bytes32 zkEnsHash = bytes32(PoseidonHash.poseidon(inputs));
        
        ensRegistry[zkEnsHash].ensHash = zkEnsHash;
        ensRegistry[zkEnsHash].owner = msg.sender;
        ensRegistry[zkEnsHash].privacyEnabled = _privacyEnabled;
        
        emit ENSDomainRegistered(zkEnsHash, msg.sender, _privacyEnabled);
    }
    
    /**
     * @dev Authorize a commitment for ENS domain usage
     * @param _ensHash ENS domain hash
     * @param _commitment Commitment to authorize
     */
    function authorizeENSCommitment(
        bytes32 _ensHash,
        bytes32 _commitment
    ) external {
        if (ensRegistry[_ensHash].owner != msg.sender) revert ENSNotAuthorized();
        
        ensRegistry[_ensHash].authorizedCommitments[_commitment] = true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CORE PRIVACY OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Enhanced deposit function with metadata and privacy features
     * @param _commitment Poseidon commitment hash
     * @param _denominationId Target denomination for this deposit
     * @param _ensHash Optional ENS domain hash for domain-linked deposits
     */
    function depositWithMetadata(
        bytes32 _commitment,
        bytes32 _denominationId,
        bytes32 _ensHash
    ) external payable nonReentrant whenNotPaused {
        if (!poolConfig.isActive) revert EmergencyModeActive();
        
        // Validate denomination
        Denomination storage denomination = denominations[_denominationId];
        if (denomination.amount == 0) revert InvalidDenominationId();
        if (!denomination.isActive) revert DenominationNotActive();
        
        // Check commitment validity
        if (_commitment == bytes32(0)) revert CommitmentAlreadyExists();
        if (commitments[_commitment].exists) revert CommitmentAlreadyExists();
        
        // Rate limiting
        _checkRateLimit(msg.sender);
        
        // Compliance checks
        _performComplianceCheck(msg.sender, _commitment);
        
        // ENS authorization check
        if (_ensHash != bytes32(0)) {
            _validateENSAuthorization(_ensHash, _commitment);
        }
        
        // Handle payment based on denomination
        _processPayment(denomination);
        
        // Add commitment to Merkle tree
        uint256 leafIndex = nextCommitmentIndex;
        bool treeSuccess = commitmentTree.addLeaf(_commitment);
        if (!treeSuccess) revert TreeUpdateFailed();
        
        // Update commitment tracking with enhanced metadata
        commitments[_commitment] = CommitmentData({
            exists: true,
            timestamp: block.timestamp,
            blockNumber: block.number,
            denominationId: _denominationId,
            ensHash: _ensHash,
            compliance: complianceData.userComplianceLevel[msg.sender]
        });
        
        commitmentIndex[_commitment] = leafIndex;
        nextCommitmentIndex++;
        
        // Update denomination statistics
        denomination.totalDeposits++;
        denomination.anonymitySet++;
        
        // Update global statistics
        totalOperations++;
        if (lastDepositBlock[msg.sender] == 0) {
            totalUniqueDepositors++;
        }
        
        // Update Merkle root tracking
        bytes32 newRoot = commitmentTree.getRoot();
        _updateMerkleRoot(newRoot);
        
        emit DepositWithMetadata(
            _commitment,
            _denominationId,
            leafIndex,
            block.timestamp,
            newRoot,
            _ensHash,
            complianceData.userComplianceLevel[msg.sender]
        );
    }
    
    /**
     * @dev Enhanced withdrawal with advanced verification and metadata
     * @param _proof Zero-knowledge proof data
     * @param _merkleRoot Historical Merkle root for proof verification
     * @param _nullifier Unique nullifier to prevent double-spending
     * @param _recipient Withdrawal recipient address
     * @param _denominationId Denomination being withdrawn
     * @param _complianceProof Optional compliance proof for regulated withdrawals
     */
    function withdrawWithVerification(
        bytes calldata _proof,
        bytes32 _merkleRoot,
        bytes32 _nullifier,
        address _recipient,
        bytes32 _denominationId,
        bytes32 _complianceProof
    ) external nonReentrant whenNotPaused {
        if (!poolConfig.isActive) revert EmergencyModeActive();
        if (_recipient == address(0)) revert InvalidRecipient();
        
        // Validate denomination
        Denomination storage denomination = denominations[_denominationId];
        if (denomination.amount == 0) revert InvalidDenominationId();
        if (!denomination.isActive) revert DenominationNotActive();
        
        // Check nullifier usage
        if (nullifiers[_nullifier].isUsed) revert NullifierAlreadyUsed();
        
        // Validate Merkle root
        if (!_isValidMerkleRoot(_merkleRoot)) revert InvalidMerkleRoot();
        
        // Check anonymity set requirement
        if (denomination.anonymitySet < denomination.minAnonymitySet) {
            revert InsufficientAnonymitySet();
        }
        
        // Compliance verification for regulated operations
        if (poolConfig.complianceLevel != ComplianceLevel.None) {
            _verifyComplianceForWithdrawal(_recipient, _complianceProof);
        }
        
        // Verify zero-knowledge proof with enhanced public inputs
        _verifyEnhancedProof(_proof, _merkleRoot, _nullifier, _recipient, _denominationId);
        
        // Mark nullifier as used with metadata
        nullifiers[_nullifier] = NullifierData({
            isUsed: true,
            timestamp: block.timestamp,
            denominationId: _denominationId,
            recipient: _recipient,
            merkleRoot: _merkleRoot
        });
        
        // Calculate fees and withdrawal amount
        uint256 fee = (denomination.amount * denomination.withdrawalFee) / 10000;
        uint256 withdrawalAmount = denomination.amount - fee;
        
        // Execute transfer
        _executeTransfer(denomination.tokenAddress, _recipient, withdrawalAmount, fee);
        
        // Update statistics
        denomination.totalWithdrawals++;
        denomination.anonymitySet = (denomination.anonymitySet > 0) ? denomination.anonymitySet - 1 : 0;
        totalOperations++;
        
        emit WithdrawalWithMetadata(
            _nullifier,
            _denominationId,
            _recipient,
            withdrawalAmount,
            fee,
            _merkleRoot,
            block.timestamp
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Check and enforce rate limiting for deposits
     * @param _user User address to check
     */
    function _checkRateLimit(address _user) internal {
        if (lastDepositBlock[_user] == block.number) {
            depositsInBlock[_user]++;
            if (depositsInBlock[_user] > 5) revert RateLimitExceeded(); // Max 5 deposits per user per block
        } else {
            lastDepositBlock[_user] = block.number;
            depositsInBlock[_user] = 1;
        }
        
        depositsPerBlock[block.number]++;
        if (depositsPerBlock[block.number] > poolConfig.maxDepositsPerBlock) {
            revert RateLimitExceeded();
        }
    }
    
    /**
     * @dev Perform compliance checks for deposits
     * @param _user User address
     * @param _commitment Commitment being deposited
     */
    function _performComplianceCheck(address _user, bytes32 _commitment) internal view {
        if (complianceData.isBlacklisted[_user]) revert BlacklistedAddress();
        
        if (poolConfig.complianceLevel == ComplianceLevel.Enhanced ||
            poolConfig.complianceLevel == ComplianceLevel.Full) {
            if (complianceData.userComplianceLevel[_user] < poolConfig.complianceLevel) {
                revert ComplianceCheckFailed();
            }
        }
    }
    
    /**
     * @dev Validate ENS authorization for commitment
     * @param _ensHash ENS domain hash
     * @param _commitment Commitment to validate
     */
    function _validateENSAuthorization(bytes32 _ensHash, bytes32 _commitment) internal view {
        if (!poolConfig.ensIntegrationEnabled) revert ENSNotAuthorized();
        if (!ensRegistry[_ensHash].authorizedCommitments[_commitment]) {
            revert ENSNotAuthorized();
        }
    }
    
    /**
     * @dev Process payment for denomination
     * @param denomination Denomination configuration
     */
    function _processPayment(Denomination storage denomination) internal {
        if (denomination.tokenAddress == address(0)) {
            // ETH payment
            if (msg.value != denomination.amount) revert InvalidDepositAmount();
        } else {
            // ERC20 payment
            if (msg.value != 0) revert InvalidDepositAmount();
            IERC20(denomination.tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                denomination.amount
            );
        }
    }
    
    /**
     * @dev Update Merkle root tracking
     * @param _newRoot New Merkle root
     */
    function _updateMerkleRoot(bytes32 _newRoot) internal {
        bytes32 oldRoot = (rootList.length > 0) ? rootList[currentRootIndex] : bytes32(0);
        
        rootHistory[_newRoot] = RootData({
            root: _newRoot,
            timestamp: block.timestamp,
            blockNumber: block.number,
            isValid: true
        });
        
        rootList.push(_newRoot);
        currentRootIndex = rootList.length - 1;
        
        // Invalidate old roots beyond max age
        _cleanupOldRoots();
        
        emit MerkleRootUpdated(oldRoot, _newRoot, block.number);
    }
    
    /**
     * @dev Clean up old Merkle roots beyond maximum age
     */
    function _cleanupOldRoots() internal {
        for (uint256 i = 0; i < rootList.length; i++) {
            bytes32 root = rootList[i];
            RootData storage rootData = rootHistory[root];
            
            if (rootData.blockNumber + MAX_ROOT_AGE < block.number) {
                rootData.isValid = false;
            }
        }
    }
    
    /**
     * @dev Check if Merkle root is valid for withdrawals
     * @param _root Root to validate
     * @return Boolean indicating validity
     */
    function _isValidMerkleRoot(bytes32 _root) internal view returns (bool) {
        RootData storage rootData = rootHistory[_root];
        return rootData.isValid && 
               rootData.blockNumber + MAX_ROOT_AGE >= block.number;
    }
    
    /**
     * @dev Verify compliance for withdrawal operations
     * @param _recipient Withdrawal recipient
     * @param _complianceProof Compliance proof data
     */
    function _verifyComplianceForWithdrawal(
        address _recipient,
        bytes32 _complianceProof
    ) internal view {
        if (complianceData.isBlacklisted[_recipient]) revert BlacklistedAddress();
        
        if (_complianceProof != bytes32(0) && 
            !complianceData.complianceProofs[_complianceProof]) {
            revert ComplianceCheckFailed();
        }
    }
    
    /**
     * @dev Verify enhanced zero-knowledge proof with additional public inputs
     * @param _proof Proof data
     * @param _merkleRoot Merkle root
     * @param _nullifier Nullifier
     * @param _recipient Recipient address
     * @param _denominationId Denomination ID
     */
    function _verifyEnhancedProof(
        bytes calldata _proof,
        bytes32 _merkleRoot,
        bytes32 _nullifier,
        address _recipient,
        bytes32 _denominationId
    ) internal view {
        // Prepare public inputs for enhanced verification
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = _merkleRoot;
        publicInputs[1] = _nullifier;
        publicInputs[2] = bytes32(uint256(uint160(_recipient)));
        publicInputs[3] = _denominationId;
        
        bool proofValid = verifier.verifyProof(_proof, publicInputs);
        if (!proofValid) revert InvalidProof();
    }
    
    /**
     * @dev Execute token or ETH transfer with fee handling
     * @param _tokenAddress Token address (address(0) for ETH)
     * @param _recipient Recipient address
     * @param _amount Main transfer amount
     * @param _fee Fee amount
     */
    function _executeTransfer(
        address _tokenAddress,
        address _recipient,
        uint256 _amount,
        uint256 _fee
    ) internal {
        if (_tokenAddress == address(0)) {
            // ETH transfer
            if (address(this).balance < _amount + _fee) revert InsufficientBalance();
            
            (bool recipientSuccess, ) = _recipient.call{value: _amount}("");
            if (!recipientSuccess) revert TransferFailed();
            
            if (_fee > 0) {
                (bool feeSuccess, ) = owner().call{value: _fee}("");
                if (!feeSuccess) revert TransferFailed();
            }
        } else {
            // ERC20 transfer
            IERC20 token = IERC20(_tokenAddress);
            if (token.balanceOf(address(this)) < _amount + _fee) revert InsufficientBalance();
            
            token.safeTransfer(_recipient, _amount);
            if (_fee > 0) {
                token.safeTransfer(owner(), _fee);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS AND GETTERS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Get current Merkle tree root
     * @return Current root hash
     */
    function getMerkleRoot() external view returns (bytes32) {
        return commitmentTree.getRoot();
    }
    
    /**
     * @dev Get denomination configuration
     * @param _denominationId Denomination identifier
     * @return Denomination configuration data
     */
    function getDenomination(bytes32 _denominationId) 
        external 
        view 
        returns (Denomination memory) 
    {
        return denominations[_denominationId];
    }
    
    /**
     * @dev Get all denomination IDs
     * @return Array of denomination identifiers
     */
    function getAllDenominations() external view returns (bytes32[] memory) {
        return denominationIds;
    }
    
    /**
     * @dev Get comprehensive pool statistics
     * @return totalDeposits_ Total deposits across all denominations
     * @return totalWithdrawals_ Total withdrawals across all denominations
     * @return activeCommitments_ Current active commitments
     * @return totalValue_ Total value locked in pool
     */
    function getPoolStatistics() 
        external 
        view 
        returns (
            uint256 totalDeposits_,
            uint256 totalWithdrawals_,
            uint256 activeCommitments_,
            uint256 totalValue_
        ) 
    {
        for (uint256 i = 0; i < denominationIds.length; i++) {
            Denomination storage denom = denominations[denominationIds[i]];
            totalDeposits_ += denom.totalDeposits;
            totalWithdrawals_ += denom.totalWithdrawals;
            activeCommitments_ += denom.anonymitySet;
            
            if (denom.tokenAddress == address(0)) {
                totalValue_ += address(this).balance;
            } else {
                totalValue_ += IERC20(denom.tokenAddress).balanceOf(address(this));
            }
        }
    }
    
    /**
     * @dev Get Merkle path for proof generation
     * @param _commitment Commitment to get path for
     * @return path Array of sibling hashes
     * @return indices Array of path indices
     */
    function getMerklePath(bytes32 _commitment)
        external
        view
        returns (bytes32[] memory path, uint256[] memory indices)
    {
        if (!commitments[_commitment].exists) revert CommitmentNotFound();
        uint256 index = commitmentIndex[_commitment];
        return commitmentTree.getPath(index);
    }
    
    /**
     * @dev Check if nullifier has been used
     * @param _nullifier Nullifier to check
     * @return Boolean indicating usage status
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifiers[_nullifier].isUsed;
    }
    
    /**
     * @dev Get user compliance level
     * @param _user User address
     * @return User's compliance level
     */
    function getUserComplianceLevel(address _user) 
        external 
        view 
        returns (ComplianceLevel) 
    {
        return complianceData.userComplianceLevel[_user];
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ADMINISTRATIVE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Update pool configuration
     * @param _minConfirmations Minimum confirmation requirement
     * @param _maxDepositsPerBlock Maximum deposits per block
     * @param _withdrawalDelay Minimum withdrawal delay
     * @param _complianceLevel Required compliance level
     */
    function updatePoolConfiguration(
        uint256 _minConfirmations,
        uint256 _maxDepositsPerBlock,
        uint256 _withdrawalDelay,
        ComplianceLevel _complianceLevel
    ) external onlyOwner {
        poolConfig.minConfirmations = _minConfirmations;
        poolConfig.maxDepositsPerBlock = _maxDepositsPerBlock;
        poolConfig.withdrawalDelay = _withdrawalDelay;
        poolConfig.complianceLevel = _complianceLevel;
        
        emit PoolConfigurationUpdated(
            _minConfirmations,
            _maxDepositsPerBlock,
            _withdrawalDelay,
            _complianceLevel
        );
    }
    
    /**
     * @dev Set user compliance level
     * @param _user User address
     * @param _level Compliance level to set
     */
    function setUserComplianceLevel(
        address _user,
        ComplianceLevel _level
    ) external onlyOwner {
        ComplianceLevel oldLevel = complianceData.userComplianceLevel[_user];
        complianceData.userComplianceLevel[_user] = _level;
        
        emit ComplianceLevelUpdated(_user, oldLevel, _level);
    }
    
    /**
     * @dev Add compliance proof
     * @param _proofHash Hash of compliance proof
     */
    function addComplianceProof(bytes32 _proofHash) external onlyOwner {
        complianceData.complianceProofs[_proofHash] = true;
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function emergencyPause() external onlyOwner {
        _pause();
        poolConfig.isActive = false;
    }
    
    /**
     * @dev Resume operations after pause
     */
    function resumeOperations() external onlyOwner {
        _unpause();
        poolConfig.isActive = true;
    }
    
    /**
     * @dev Emergency withdrawal (only when paused)
     * @param _tokenAddress Token to withdraw (address(0) for ETH)
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(
        address _tokenAddress,
        uint256 _amount
    ) external onlyOwner whenPaused {
        if (_tokenAddress == address(0)) {
            (bool success, ) = owner().call{value: _amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(_tokenAddress).safeTransfer(owner(), _amount);
        }
    }
    
    /**
     * @dev Receive function for ETH deposits
     */
    receive() external payable {
        // ETH can be sent directly for gas optimization in some scenarios
        // Actual deposits should use depositWithMetadata function
    }
}
