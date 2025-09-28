// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IVerifier
 * @dev Interface for zero-knowledge proof verification
 */
interface IVerifier {
    /**
     * @dev Verify a zero-knowledge proof
     * @param proof The proof bytes
     * @param publicInputs Array of public inputs for the proof
     * @return True if the proof is valid, false otherwise
     */
    function verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external view returns (bool);
}

/**
 * @title IShieldedPool
 * @dev Interface for shielded pool functionality
 */
interface IShieldedPool {
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

    // Core functions
    function deposit(bytes32 commitment) external payable;
    
    function withdraw(
        bytes calldata proof,
        bytes32 merkleRoot,
        bytes32 nullifier,
        address recipient,
        uint256 fee
    ) external;

    // View functions
    function getMerkleRoot() external view returns (bytes32);
    function hasCommitment(bytes32 commitment) external view returns (bool);
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
    
    function getPoolStats() external view returns (
        uint256 totalDeposits,
        uint256 totalWithdrawals,
        uint256 activeCommitments,
        uint256 poolBalance
    );
}

/**
 * @title IMerkleTree
 * @dev Interface for Merkle tree operations
 */
interface IMerkleTree {
    function getRoot() external view returns (bytes32);
    function addLeaf(bytes32 leaf) external returns (bool);
    function isValidRoot(bytes32 root) external view returns (bool);
    function getPath(uint256 index) external view returns (bytes32[] memory, uint256[] memory);
}
