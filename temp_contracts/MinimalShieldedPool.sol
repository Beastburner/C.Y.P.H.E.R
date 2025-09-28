// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IVerifier.sol";
import "./libraries/MerkleTree.sol";

/**
 * @title MinimalShieldedPool
 * @dev A privacy-preserving pool that allows users to deposit and withdraw assets
 *      while maintaining anonymity through zero-knowledge proofs
 * @notice This contract implements a shielded pool with the following features:
 *         - Anonymous deposits with commitment generation
 *         - Private withdrawals using zero-knowledge proofs
 *         - Merkle tree for efficient commitment tracking
 *         - Nullifier tracking to prevent double-spending
 *         - Support for both ETH and ERC20 tokens
 */
contract MinimalShieldedPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using MerkleTree for MerkleTree.Tree;
    using PoseidonHash for bytes32[];

    // Circuit and proof verification
    IVerifier public immutable verifier;
    
    // Merkle tree for commitment tracking
    MerkleTree.Tree private commitmentTree;
    
    // Pool configuration
    struct PoolConfig {
        uint256 depositAmount;      // Fixed deposit amount (in wei for ETH, in tokens for ERC20)
        address tokenAddress;       // Address of the token (address(0) for ETH)
        uint256 merkleTreeHeight;   // Height of the Merkle tree
        uint256 withdrawalFee;      // Fee charged on withdrawal (in basis points)
        bool isActive;              // Whether the pool is active
        uint256 minConfirmations;   // Minimum confirmations required
    }
    
    PoolConfig public poolConfig;
    
    // Commitment and nullifier tracking
    mapping(bytes32 => bool) public commitments;        // commitment => exists
    mapping(bytes32 => bool) public nullifiers;         // nullifier => spent
    mapping(bytes32 => uint256) public commitmentIndex;  // commitment => tree index
    
    // Pool statistics
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public activeCommitments;
    uint256 public nextCommitmentIndex;
    
    // Events
    event Deposit(
        bytes32 indexed commitment, 
        uint256 indexed index, 
        uint256 timestamp,
        bytes32 merkleRoot
    );
    
    event Withdrawal(
        bytes32 indexed nullifier,
        address indexed recipient,
        uint256 amount,
        uint256 fee,
        bytes32 merkleRoot
    );
    
    event PoolConfigUpdated(
        uint256 depositAmount,
        address tokenAddress,
        uint256 withdrawalFee,
        bool isActive
    );
    
    event MerkleRootUpdated(bytes32 indexed oldRoot, bytes32 indexed newRoot);
    
    // Errors
    error InvalidProof();
    error CommitmentAlreadyExists();
    error NullifierAlreadyUsed();
    error InvalidMerkleRoot();
    error InsufficientBalance();
    error PoolInactive();
    error InvalidDepositAmount();
    error InvalidWithdrawalFee();
    error InvalidRecipient();
    error TransferFailed();
    error InvalidCommitment();
    error TreeUpdateFailed();

    /**
     * @dev Constructor
     * @param _verifier Address of the zero-knowledge proof verifier contract
     * @param _depositAmount Fixed amount for deposits
     * @param _tokenAddress Token address (address(0) for ETH)
     * @param _merkleTreeHeight Height of the Merkle tree
     * @param _withdrawalFee Withdrawal fee in basis points (e.g., 100 = 1%)
     */
    constructor(
        address _verifier,
        uint256 _depositAmount,
        address _tokenAddress,
        uint256 _merkleTreeHeight,
        uint256 _withdrawalFee
    ) Ownable(msg.sender) {
        require(_verifier != address(0), "Invalid verifier address");
        require(_depositAmount > 0, "Invalid deposit amount");
        require(_merkleTreeHeight >= 10 && _merkleTreeHeight <= 32, "Invalid tree height");
        require(_withdrawalFee <= 1000, "Fee too high"); // Max 10%
        
        verifier = IVerifier(_verifier);
        
        poolConfig = PoolConfig({
            depositAmount: _depositAmount,
            tokenAddress: _tokenAddress,
            merkleTreeHeight: _merkleTreeHeight,
            withdrawalFee: _withdrawalFee,
            isActive: true,
            minConfirmations: 1
        });
        
        // Initialize Merkle tree
        commitmentTree.initialize(_merkleTreeHeight);
        
        emit PoolConfigUpdated(_depositAmount, _tokenAddress, _withdrawalFee, true);
    }

    /**
     * @dev Deposit assets into the shielded pool
     * @param _commitment The commitment hash (Poseidon hash of secret and nullifier)
     * @notice The commitment is added to the Merkle tree and the deposit is tracked
     *         For ETH deposits, send the exact deposit amount with the transaction
     *         For ERC20 deposits, approve the contract first, then call this function
     */
    function deposit(bytes32 _commitment) external payable nonReentrant {
        if (!poolConfig.isActive) revert PoolInactive();
        if (_commitment == bytes32(0)) revert InvalidCommitment();
        if (commitments[_commitment]) revert CommitmentAlreadyExists();
        
        // Handle payment
        if (poolConfig.tokenAddress == address(0)) {
            // ETH deposit
            if (msg.value != poolConfig.depositAmount) revert InvalidDepositAmount();
        } else {
            // ERC20 deposit
            if (msg.value != 0) revert InvalidDepositAmount();
            IERC20(poolConfig.tokenAddress).safeTransferFrom(
                msg.sender, 
                address(this), 
                poolConfig.depositAmount
            );
        }
        
        // Add commitment to tree
        uint256 index = nextCommitmentIndex;
        bool success = commitmentTree.addLeaf(_commitment);
        if (!success) revert TreeUpdateFailed();
        
        // Update tracking
        commitments[_commitment] = true;
        commitmentIndex[_commitment] = index;
        nextCommitmentIndex++;
        totalDeposits++;
        activeCommitments++;
        
        emit Deposit(_commitment, index, block.timestamp, commitmentTree.getRoot());
        emit MerkleRootUpdated(bytes32(0), commitmentTree.getRoot());
    }

    /**
     * @dev Withdraw assets from the shielded pool using zero-knowledge proof
     * @param _proof The zero-knowledge proof
     * @param _merkleRoot The Merkle tree root at the time of proof generation
     * @param _nullifier The nullifier to prevent double-spending
     * @param _recipient The recipient address for withdrawal
     * @param _fee The fee amount to pay (must match calculated fee)
     * @notice The proof must demonstrate:
     *         1. Knowledge of a valid commitment in the tree
     *         2. Knowledge of the secret that generates the nullifier
     *         3. That the nullifier hasn't been used before
     */
    function withdraw(
        bytes calldata _proof,
        bytes32 _merkleRoot,
        bytes32 _nullifier,
        address _recipient,
        uint256 _fee
    ) external nonReentrant {
        if (!poolConfig.isActive) revert PoolInactive();
        if (_recipient == address(0)) revert InvalidRecipient();
        if (nullifiers[_nullifier]) revert NullifierAlreadyUsed();
        if (!commitmentTree.isValidRoot(_merkleRoot)) revert InvalidMerkleRoot();
        
        // Calculate expected fee
        uint256 expectedFee = (poolConfig.depositAmount * poolConfig.withdrawalFee) / 10000;
        if (_fee != expectedFee) revert InvalidWithdrawalFee();
        
        // Verify the zero-knowledge proof
        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = _merkleRoot;
        publicInputs[1] = _nullifier;
        publicInputs[2] = bytes32(uint256(uint160(_recipient)));
        
        bool proofValid = verifier.verifyProof(_proof, publicInputs);
        if (!proofValid) revert InvalidProof();
        
        // Mark nullifier as used
        nullifiers[_nullifier] = true;
        activeCommitments--;
        totalWithdrawals++;
        
        // Calculate withdrawal amount (deposit amount minus fee)
        uint256 withdrawAmount = poolConfig.depositAmount - _fee;
        
        // Transfer funds
        if (poolConfig.tokenAddress == address(0)) {
            // ETH withdrawal
            if (address(this).balance < poolConfig.depositAmount) revert InsufficientBalance();
            
            (bool recipientSuccess, ) = _recipient.call{value: withdrawAmount}("");
            if (!recipientSuccess) revert TransferFailed();
            
            if (_fee > 0) {
                (bool feeSuccess, ) = owner().call{value: _fee}("");
                if (!feeSuccess) revert TransferFailed();
            }
        } else {
            // ERC20 withdrawal
            IERC20 token = IERC20(poolConfig.tokenAddress);
            if (token.balanceOf(address(this)) < poolConfig.depositAmount) revert InsufficientBalance();
            
            token.safeTransfer(_recipient, withdrawAmount);
            if (_fee > 0) {
                token.safeTransfer(owner(), _fee);
            }
        }
        
        emit Withdrawal(_nullifier, _recipient, withdrawAmount, _fee, _merkleRoot);
    }

    /**
     * @dev Get the current Merkle tree root
     * @return The current root hash
     */
    function getMerkleRoot() external view returns (bytes32) {
        return commitmentTree.getRoot();
    }

    /**
     * @dev Get Merkle tree root history
     * @return Array of recent root hashes
     */
    function getRootHistory() external view returns (bytes32[] memory) {
        return commitmentTree.getRootHistory();
    }

    /**
     * @dev Check if a commitment exists in the tree
     * @param _commitment The commitment to check
     * @return Boolean indicating if commitment exists
     */
    function hasCommitment(bytes32 _commitment) external view returns (bool) {
        return commitments[_commitment];
    }

    /**
     * @dev Check if a nullifier has been used
     * @param _nullifier The nullifier to check
     * @return Boolean indicating if nullifier has been used
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifiers[_nullifier];
    }

    /**
     * @dev Get pool statistics
     * @return totalDeposits_ Total number of deposits
     * @return totalWithdrawals_ Total number of withdrawals
     * @return activeCommitments_ Current number of active commitments
     * @return poolBalance Current balance of the pool
     */
    function getPoolStats() external view returns (
        uint256 totalDeposits_,
        uint256 totalWithdrawals_,
        uint256 activeCommitments_,
        uint256 poolBalance
    ) {
        totalDeposits_ = totalDeposits;
        totalWithdrawals_ = totalWithdrawals;
        activeCommitments_ = activeCommitments;
        
        if (poolConfig.tokenAddress == address(0)) {
            poolBalance = address(this).balance;
        } else {
            poolBalance = IERC20(poolConfig.tokenAddress).balanceOf(address(this));
        }
    }

    /**
     * @dev Get Merkle path for a commitment (for proof generation)
     * @param _commitment The commitment to get path for
     * @return path Array of sibling hashes
     * @return indices Array of path indices (0 for left, 1 for right)
     */
    function getMerklePath(bytes32 _commitment) 
        external 
        view 
        returns (bytes32[] memory path, uint256[] memory indices) 
    {
        require(commitments[_commitment], "Commitment not found");
        uint256 index = commitmentIndex[_commitment];
        return commitmentTree.getPath(index);
    }

    // Admin functions

    /**
     * @dev Update pool configuration (only owner)
     * @param _depositAmount New deposit amount
     * @param _withdrawalFee New withdrawal fee in basis points
     * @param _isActive Whether the pool should be active
     */
    function updatePoolConfig(
        uint256 _depositAmount,
        uint256 _withdrawalFee,
        bool _isActive
    ) external onlyOwner {
        require(_depositAmount > 0, "Invalid deposit amount");
        require(_withdrawalFee <= 1000, "Fee too high"); // Max 10%
        
        poolConfig.depositAmount = _depositAmount;
        poolConfig.withdrawalFee = _withdrawalFee;
        poolConfig.isActive = _isActive;
        
        emit PoolConfigUpdated(_depositAmount, poolConfig.tokenAddress, _withdrawalFee, _isActive);
    }

    /**
     * @dev Emergency pause/unpause (only owner)
     * @param _active Whether the pool should be active
     */
    function setPoolActive(bool _active) external onlyOwner {
        poolConfig.isActive = _active;
        emit PoolConfigUpdated(
            poolConfig.depositAmount, 
            poolConfig.tokenAddress, 
            poolConfig.withdrawalFee, 
            _active
        );
    }

    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(!poolConfig.isActive, "Pool must be inactive");
        
        if (poolConfig.tokenAddress == address(0)) {
            require(address(this).balance >= _amount, "Insufficient balance");
            (bool success, ) = owner().call{value: _amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(poolConfig.tokenAddress).safeTransfer(owner(), _amount);
        }
    }

    /**
     * @dev Receive function for ETH deposits
     */
    receive() external payable {
        // Only accept ETH if this is an ETH pool
        require(poolConfig.tokenAddress == address(0), "Not an ETH pool");
    }
}
