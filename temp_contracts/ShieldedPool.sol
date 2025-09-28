// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract ShieldedPool is ReentrancyGuard, Ownable, Pausable {
    uint256 public constant MERKLE_TREE_HEIGHT = 20;
    uint256 public constant MAX_DEPOSIT_AMOUNT = 100 ether;
    uint256 public constant MIN_DEPOSIT_AMOUNT = 0.001 ether;
    
    // State variables
    uint256 public nextCommitmentIndex;
    uint256 public totalValueLocked;
    
    // Merkle tree for commitments (simplified as array for MVP)
    bytes32[] public commitments;
    mapping(bytes32 => bool) public nullifierHashes;
    mapping(bytes32 => bool) public validCommitments;
    
    // Events
    event Deposit(
        bytes32 indexed commitment,
        uint256 leafIndex,
        uint256 amount,
        uint256 timestamp
    );
    
    event Withdrawal(
        address indexed recipient,
        bytes32 indexed nullifierHash,
        uint256 amount,
        uint256 timestamp
    );
    
    event CommitmentAdded(bytes32 indexed commitment, uint256 leafIndex);
    
    // Errors
    error InvalidDepositAmount();
    error NullifierAlreadyUsed();
    error InvalidCommitment();
    error InsufficientBalance();
    error InvalidProof();
    error TransferFailed();
    
    constructor() {
        // Initialize with empty commitment at index 0
        commitments.push(bytes32(0));
        nextCommitmentIndex = 1;
    }
    
    /**
     * @dev Deposit ETH into the shielded pool
     * @param commitment The commitment hash for the deposit
     */
    function deposit(bytes32 commitment) external payable nonReentrant whenNotPaused {
        if (msg.value < MIN_DEPOSIT_AMOUNT || msg.value > MAX_DEPOSIT_AMOUNT) {
            revert InvalidDepositAmount();
        }
        
        if (commitment == bytes32(0)) {
            revert InvalidCommitment();
        }
        
        // Add commitment to the tree
        uint256 leafIndex = nextCommitmentIndex;
        commitments.push(commitment);
        validCommitments[commitment] = true;
        nextCommitmentIndex++;
        
        totalValueLocked += msg.value;
        
        emit Deposit(commitment, leafIndex, msg.value, block.timestamp);
        emit CommitmentAdded(commitment, leafIndex);
    }
    
    function withdraw(
        address payable recipient,
        bytes32 nullifierHash,
        uint256 amount,
        bytes32 commitment
    ) external nonReentrant whenNotPaused {
        if (nullifierHashes[nullifierHash]) {
            revert NullifierAlreadyUsed();
        }
        
        if (!validCommitments[commitment]) {
            revert InvalidCommitment();
        }
        
        if (address(this).balance < amount) {
            revert InsufficientBalance();
        }
        
        // Mark nullifier as used
        nullifierHashes[nullifierHash] = true;
        totalValueLocked -= amount;
        
        // Transfer funds
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        emit Withdrawal(recipient, nullifierHash, amount, block.timestamp);
    }
    
    function privateTransfer(
        bytes32 nullifierHash,
        bytes32 newCommitment,
        bytes32 inputCommitment
    ) external nonReentrant whenNotPaused {
        if (nullifierHashes[nullifierHash]) {
            revert NullifierAlreadyUsed();
        }
        
        if (!validCommitments[inputCommitment]) {
            revert InvalidCommitment();
        }
        
        if (newCommitment == bytes32(0)) {
            revert InvalidCommitment();
        }
        
        // Mark old nullifier as used
        nullifierHashes[nullifierHash] = true;
        
        // Add new commitment
        uint256 leafIndex = nextCommitmentIndex;
        commitments.push(newCommitment);
        validCommitments[newCommitment] = true;
        nextCommitmentIndex++;
        
        emit CommitmentAdded(newCommitment, leafIndex);
    }
    
    /**
     * @dev Get commitment by index
     * @param index The index of the commitment
     */
    function getCommitment(uint256 index) external view returns (bytes32) {
        require(index < commitments.length, "Index out of bounds");
        return commitments[index];
    }
    
    /**
     * @dev Get total number of commitments
     */
    function getCommitmentCount() external view returns (uint256) {
        return commitments.length;
    }
    
    /**
     * @dev Check if nullifier has been used
     */
    function isNullifierUsed(bytes32 nullifierHash) external view returns (bool) {
        return nullifierHashes[nullifierHash];
    }
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Admin functions
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency withdrawal (admin only)
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Receive function to accept ETH
    receive() external payable {
        // Accept direct ETH transfers
    }
}
