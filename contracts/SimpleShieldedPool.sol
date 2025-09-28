// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleShieldedPool - HACKATHON MVP VERSION
 * @dev Ultra-simplified privacy pool for demo purposes
 */
contract SimpleShieldedPool {
    
    // Pool state
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;
    uint256 public totalDeposits;
    uint256 public totalWithdrawals; 
    uint256 public activeCommitments;
    
    // Events
    event Deposit(bytes32 indexed commitment, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed recipient, bytes32 indexed nullifierHash, uint256 amount, uint256 timestamp);
    
    /**
     * @dev Deposit ETH into the shielded pool
     * @param commitment The commitment hash for this deposit
     */
    function deposit(bytes32 commitment) external payable {
        require(msg.value > 0, "Must deposit some ETH");
        require(!commitments[commitment], "Commitment already exists");
        
        commitments[commitment] = true;
        totalDeposits += msg.value;
        activeCommitments++;
        
        emit Deposit(commitment, msg.value, block.timestamp);
    }
    
    /**
     * @dev Withdraw ETH from the shielded pool (simplified version)
     * @param _proof Mock proof bytes (ignored for demo)
     * @param _merkleRoot Mock merkle root (ignored for demo) 
     * @param _nullifier Nullifier to prevent double-spending
     * @param _recipient Address to receive the funds
     * @param _fee Withdrawal fee (ignored for demo)
     */
    function withdraw(
        bytes calldata _proof,
        bytes32 _merkleRoot, 
        bytes32 _nullifier,
        address _recipient,
        uint256 _fee
    ) external {
        require(_recipient != address(0), "Invalid recipient");
        require(!nullifiers[_nullifier], "Nullifier already used");
        require(address(this).balance > 0, "No funds to withdraw");
        
        // Mark nullifier as used
        nullifiers[_nullifier] = true;
        
        // For demo: withdraw a fixed amount (0.01 ETH)
        uint256 withdrawAmount = 0.01 ether;
        if (address(this).balance < withdrawAmount) {
            withdrawAmount = address(this).balance;
        }
        
        totalWithdrawals += withdrawAmount;
        activeCommitments = activeCommitments > 0 ? activeCommitments - 1 : 0;
        
        // Send ETH to recipient
        payable(_recipient).transfer(withdrawAmount);
        
        emit Withdrawal(_recipient, _nullifier, withdrawAmount, block.timestamp);
    }
    
    /**
     * @dev Check if a commitment exists in the pool
     */
    function hasCommitment(bytes32 _commitment) external view returns (bool) {
        return commitments[_commitment];
    }
    
    /**
     * @dev Check if a nullifier has been used
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifiers[_nullifier];
    }
    
    /**
     * @dev Get pool statistics
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
        poolBalance = address(this).balance;
    }
    
    /**
     * @dev Get mock merkle root for demo
     */
    function getMerkleRoot() external pure returns (bytes32) {
        return keccak256("mock-merkle-root");
    }
    
    /**
     * @dev Get mock pool config for demo
     */
    function poolConfig() external pure returns (
        uint256 depositAmount,
        address tokenAddress,
        uint256 merkleTreeHeight,
        uint256 withdrawalFee,
        bool isActive,
        uint256 minConfirmations
    ) {
        depositAmount = 0.01 ether;
        tokenAddress = address(0); // ETH
        merkleTreeHeight = 20;
        withdrawalFee = 0;
        isActive = true;
        minConfirmations = 1;
    }
    
    /**
     * @dev Emergency withdrawal for contract owner (hackathon safety)
     */
    function emergencyWithdraw() external {
        require(msg.sender != address(0), "Invalid sender");
        payable(msg.sender).transfer(address(this).balance);
    }
    
    receive() external payable {
        // Allow direct ETH deposits
    }
}
