// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MinimalShieldedPool.sol";
import "./libraries/PoseidonHash.sol";

/**
 * @title AliasAccount - Public-facing accounts for privacy vault interaction
 * @dev Dual-layer architecture: Public aliases map to private shielded vault
 * @notice Users create public aliases that link to private commitments in shielded pools
 *         This provides a public interface while maintaining privacy through ZK proofs
 */
contract AliasAccount is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using PoseidonHash for bytes32[];

    // Alias management
    struct Alias {
        bytes32 commitment;           // Links to shielded pool commitment
        address shieldedPool;         // Address of linked shielded pool
        uint256 createdAt;           // Creation timestamp
        bool isActive;               // Whether alias is active
        uint256 totalDeposits;       // Total deposited through this alias
        uint256 totalWithdrawals;    // Total withdrawn through this alias
        string metaData;             // Optional metadata (IPFS hash, etc.)
    }

    // Mappings
    mapping(address => Alias) public aliases;                    // address => alias data
    mapping(bytes32 => address) public commitmentToAlias;       // commitment => alias address
    mapping(address => bool) public isValidAlias;               // quick validity check
    mapping(address => address[]) public userAliases;           // user => array of alias addresses
    mapping(address => bool) public authorizedPools;            // authorized shielded pools

    // Global settings
    uint256 public aliasCreationFee;
    uint256 public maxAliasesPerUser = 10;
    bool public aliasCreationEnabled = true;
    
    // Events
    event AliasCreated(
        address indexed user,
        address indexed alias, 
        bytes32 indexed commitment,
        address shieldedPool
    );
    
    event DepositToShielded(
        address indexed alias,
        address indexed user,
        uint256 amount,
        bytes32 commitment
    );
    
    event WithdrawFromShielded(
        address indexed alias,
        address indexed recipient,
        uint256 amount,
        bytes32 nullifier
    );
    
    event PoolLinked(
        address indexed alias,
        address indexed oldPool,
        address indexed newPool
    );

    event AliasStatusChanged(address indexed alias, bool isActive);
    
    // Errors
    error AliasAlreadyExists();
    error InvalidCommitment();
    error UnauthorizedPool();
    error AliasNotFound();
    error AliasInactive();
    error InvalidProof();
    error InsufficientFee();
    error TooManyAliases();
    error CreationDisabled();
    error InvalidAmount();
    error TransferFailed();

    constructor(uint256 _aliasCreationFee) Ownable(msg.sender) {
        aliasCreationFee = _aliasCreationFee;
    }

    /**
     * @dev Create a new alias linked to a shielded pool commitment
     * @param aliasAddress The address to use as public alias
     * @param commitment The commitment hash in the shielded pool
     * @param shieldedPool Address of the shielded pool to link to
     * @param metaData Optional metadata (IPFS hash, description, etc.)
     */
    function createAlias(
        address aliasAddress,
        bytes32 commitment,
        address shieldedPool,
        string calldata metaData
    ) external payable nonReentrant {
        if (!aliasCreationEnabled) revert CreationDisabled();
        if (msg.value < aliasCreationFee) revert InsufficientFee();
        if (isValidAlias[aliasAddress]) revert AliasAlreadyExists();
        if (commitment == bytes32(0)) revert InvalidCommitment();
        if (!authorizedPools[shieldedPool]) revert UnauthorizedPool();
        if (userAliases[msg.sender].length >= maxAliasesPerUser) revert TooManyAliases();

        // Verify commitment exists in the shielded pool
        require(
            MinimalShieldedPool(shieldedPool).hasCommitment(commitment),
            "Commitment not found in pool"
        );

        // Create alias
        aliases[aliasAddress] = Alias({
            commitment: commitment,
            shieldedPool: shieldedPool,
            createdAt: block.timestamp,
            isActive: true,
            totalDeposits: 0,
            totalWithdrawals: 0,
            metaData: metaData
        });

        // Update mappings
        isValidAlias[aliasAddress] = true;
        commitmentToAlias[commitment] = aliasAddress;
        userAliases[msg.sender].push(aliasAddress);

        // Transfer creation fee to owner
        if (aliasCreationFee > 0) {
            (bool success, ) = owner().call{value: aliasCreationFee}("");
            if (!success) revert TransferFailed();
        }

        // Refund excess ETH
        if (msg.value > aliasCreationFee) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - aliasCreationFee}("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit AliasCreated(msg.sender, aliasAddress, commitment, shieldedPool);
    }

    /**
     * @dev Link an existing alias to a different shielded pool
     * @param aliasAddress The alias to update
     * @param newShieldedPool New shielded pool address
     * @param newCommitment New commitment in the new pool
     */
    function linkToShieldedPool(
        address aliasAddress,
        address newShieldedPool,
        bytes32 newCommitment
    ) external nonReentrant {
        Alias storage alias = aliases[aliasAddress];
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        if (!alias.isActive) revert AliasInactive();
        if (!authorizedPools[newShieldedPool]) revert UnauthorizedPool();
        if (newCommitment == bytes32(0)) revert InvalidCommitment();

        // Verify new commitment exists in the new pool
        require(
            MinimalShieldedPool(newShieldedPool).hasCommitment(newCommitment),
            "Commitment not found in new pool"
        );

        address oldPool = alias.shieldedPool;
        
        // Update alias
        alias.shieldedPool = newShieldedPool;
        alias.commitment = newCommitment;
        
        // Update commitment mapping
        commitmentToAlias[newCommitment] = aliasAddress;

        emit PoolLinked(aliasAddress, oldPool, newShieldedPool);
    }

    /**
     * @dev Deposit ETH to shielded pool through alias
     * @param aliasAddress The alias to deposit through
     * @param newCommitment New commitment for the deposit
     */
    function deposit(
        address aliasAddress, 
        bytes32 newCommitment
    ) external payable nonReentrant {
        Alias storage alias = aliases[aliasAddress];
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        if (!alias.isActive) revert AliasInactive();
        if (msg.value == 0) revert InvalidAmount();

        // Deposit to linked shielded pool
        MinimalShieldedPool shieldedPool = MinimalShieldedPool(alias.shieldedPool);
        shieldedPool.deposit{value: msg.value}(newCommitment);

        // Update alias statistics
        alias.totalDeposits += msg.value;

        emit DepositToShielded(aliasAddress, msg.sender, msg.value, newCommitment);
    }

    /**
     * @dev Withdraw from shielded pool through alias using ZK proof
     * @param aliasAddress The alias to withdraw through
     * @param proof The zero-knowledge proof
     * @param merkleRoot The Merkle tree root
     * @param nullifier The nullifier hash
     * @param recipient The withdrawal recipient
     * @param amount The withdrawal amount
     * @param fee The withdrawal fee
     */
    function withdraw(
        address aliasAddress,
        bytes calldata proof,
        bytes32 merkleRoot,
        bytes32 nullifier,
        address recipient,
        uint256 amount,
        uint256 fee
    ) external nonReentrant {
        Alias storage alias = aliases[aliasAddress];
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        if (!alias.isActive) revert AliasInactive();

        // Execute withdrawal through shielded pool
        MinimalShieldedPool shieldedPool = MinimalShieldedPool(alias.shieldedPool);
        shieldedPool.withdraw(proof, merkleRoot, nullifier, recipient, fee);

        // Update alias statistics
        alias.totalWithdrawals += amount;

        emit WithdrawFromShielded(aliasAddress, recipient, amount, nullifier);
    }

    /**
     * @dev Batch deposit to multiple aliases
     * @param aliasAddresses Array of alias addresses
     * @param commitments Array of new commitments
     * @param amounts Array of deposit amounts
     */
    function batchDeposit(
        address[] calldata aliasAddresses,
        bytes32[] calldata commitments,
        uint256[] calldata amounts
    ) external payable nonReentrant {
        require(
            aliasAddresses.length == commitments.length && 
            commitments.length == amounts.length,
            "Array length mismatch"
        );

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(msg.value == totalAmount, "Insufficient ETH sent");

        for (uint256 i = 0; i < aliasAddresses.length; i++) {
            _depositToAlias(aliasAddresses[i], commitments[i], amounts[i]);
        }
    }

    /**
     * @dev Internal function to handle individual alias deposits
     */
    function _depositToAlias(
        address aliasAddress,
        bytes32 commitment,
        uint256 amount
    ) internal {
        Alias storage alias = aliases[aliasAddress];
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        if (!alias.isActive) revert AliasInactive();

        // Deposit to linked shielded pool
        MinimalShieldedPool shieldedPool = MinimalShieldedPool(alias.shieldedPool);
        shieldedPool.deposit{value: amount}(commitment);

        // Update alias statistics
        alias.totalDeposits += amount;

        emit DepositToShielded(aliasAddress, msg.sender, amount, commitment);
    }

    /**
     * @dev Get alias information
     * @param aliasAddress The alias address to query
     * @return Alias struct data
     */
    function getAlias(address aliasAddress) external view returns (Alias memory) {
        require(isValidAlias[aliasAddress], "Alias not found");
        return aliases[aliasAddress];
    }

    /**
     * @dev Get all aliases for a user
     * @param user The user address
     * @return Array of alias addresses
     */
    function getUserAliases(address user) external view returns (address[] memory) {
        return userAliases[user];
    }

    /**
     * @dev Get alias statistics
     * @param aliasAddress The alias address
     * @return totalDeposits Total deposited through alias
     * @return totalWithdrawals Total withdrawn through alias  
     * @return netBalance Current net balance
     * @return isActive Whether alias is active
     */
    function getAliasStats(address aliasAddress) external view returns (
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 netBalance,
        bool isActive
    ) {
        Alias memory alias = aliases[aliasAddress];
        totalDeposits = alias.totalDeposits;
        totalWithdrawals = alias.totalWithdrawals;
        netBalance = totalDeposits > totalWithdrawals ? totalDeposits - totalWithdrawals : 0;
        isActive = alias.isActive;
    }

    /**
     * @dev Check if an address is a valid alias
     * @param aliasAddress Address to check
     * @return Boolean indicating validity
     */
    function isValidAliasAddress(address aliasAddress) external view returns (bool) {
        return isValidAlias[aliasAddress];
    }

    // Admin functions

    /**
     * @dev Add authorized shielded pool (only owner)
     * @param poolAddress Address of shielded pool to authorize
     */
    function authorizePool(address poolAddress) external onlyOwner {
        authorizedPools[poolAddress] = true;
    }

    /**
     * @dev Remove authorized shielded pool (only owner)
     * @param poolAddress Address of shielded pool to deauthorize
     */
    function deauthorizePool(address poolAddress) external onlyOwner {
        authorizedPools[poolAddress] = false;
    }

    /**
     * @dev Update alias creation fee (only owner)
     * @param newFee New creation fee in wei
     */
    function setAliasCreationFee(uint256 newFee) external onlyOwner {
        aliasCreationFee = newFee;
    }

    /**
     * @dev Enable/disable alias creation (only owner)
     * @param enabled Whether alias creation should be enabled
     */
    function setAliasCreationEnabled(bool enabled) external onlyOwner {
        aliasCreationEnabled = enabled;
    }

    /**
     * @dev Update maximum aliases per user (only owner)
     * @param maxAliases New maximum number of aliases per user
     */
    function setMaxAliasesPerUser(uint256 maxAliases) external onlyOwner {
        maxAliasesPerUser = maxAliases;
    }

    /**
     * @dev Deactivate an alias (only owner - emergency function)
     * @param aliasAddress Alias to deactivate
     */
    function deactivateAlias(address aliasAddress) external onlyOwner {
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        aliases[aliasAddress].isActive = false;
        emit AliasStatusChanged(aliasAddress, false);
    }

    /**
     * @dev Reactivate an alias (only owner)
     * @param aliasAddress Alias to reactivate
     */
    function reactivateAlias(address aliasAddress) external onlyOwner {
        if (!isValidAlias[aliasAddress]) revert AliasNotFound();
        aliases[aliasAddress].isActive = true;
        emit AliasStatusChanged(aliasAddress, true);
    }

    /**
     * @dev Withdraw accumulated fees (only owner)
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @dev Receive function for fee payments
     */
    receive() external payable {
        // Accept ETH for fees
    }
}
