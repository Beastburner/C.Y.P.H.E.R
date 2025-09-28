// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimplePrivacyPool - Minimal privacy pool for hackathon demo
 * @dev Simplified version for quick deployment and testing
 */
contract SimplePrivacyPool is ReentrancyGuard, Ownable {
    
    struct Commitment {
        bytes32 hash;
        uint256 amount;
        bool nullified;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Commitment) public commitments;
    mapping(bytes32 => bool) public nullifiers;
    
    uint256 public totalDeposits;
    uint256 public constant MIN_DEPOSIT = 0.001 ether;
    uint256 public constant MAX_DEPOSIT = 10 ether;
    
    event Deposit(bytes32 indexed commitment, uint256 amount);
    event Withdrawal(bytes32 indexed nullifier, address recipient, uint256 amount);
    
    constructor() Ownable() {}
    
    function deposit(bytes32 commitment) external payable nonReentrant {
        require(msg.value >= MIN_DEPOSIT && msg.value <= MAX_DEPOSIT, "Invalid amount");
        require(commitment != bytes32(0), "Invalid commitment");
        require(commitments[commitment].hash == bytes32(0), "Commitment exists");
        
        commitments[commitment] = Commitment({
            hash: commitment,
            amount: msg.value,
            nullified: false,
            timestamp: block.timestamp
        });
        
        totalDeposits += msg.value;
        
        emit Deposit(commitment, msg.value);
    }
    
    function withdraw(
        bytes32 nullifier,
        address payable recipient,
        uint256 amount,
        bytes32 commitment
    ) external nonReentrant {
        require(nullifier != bytes32(0), "Invalid nullifier");
        require(recipient != address(0), "Invalid recipient");
        require(!nullifiers[nullifier], "Nullifier used");
        require(commitments[commitment].hash != bytes32(0), "Commitment not found");
        require(!commitments[commitment].nullified, "Already nullified");
        require(commitments[commitment].amount == amount, "Amount mismatch");
        
        // Mark nullifier as used
        nullifiers[nullifier] = true;
        commitments[commitment].nullified = true;
        
        // Transfer funds
        recipient.transfer(amount);
        
        emit Withdrawal(nullifier, recipient, amount);
    }
    
    function hasCommitment(bytes32 commitment) external view returns (bool) {
        return commitments[commitment].hash != bytes32(0);
    }
    
    function getCommitmentAmount(bytes32 commitment) external view returns (uint256) {
        return commitments[commitment].amount;
    }
    
    function isNullified(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier];
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}
