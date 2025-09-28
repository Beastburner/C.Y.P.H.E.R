// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PoseidonHash - Mock Implementation for Hackathon
 * @dev Simplified version using keccak256 instead of real Poseidon hash
 */
library PoseidonHash {
    /**
     * @dev Mock Poseidon hash using keccak256 for hackathon demo
     */
    function poseidon(uint256[] memory inputs) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(inputs)));
    }
    
    /**
     * @dev Mock Poseidon hash for bytes32 array
     */
    function poseidon(bytes32[] memory inputs) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(inputs)));
    }
    
    /**
     * @dev Hash two values together
     */
    function hash(uint256 left, uint256 right) internal pure returns (uint256) {
        uint256[] memory inputs = new uint256[](2);
        inputs[0] = left;
        inputs[1] = right;
        return poseidon(inputs);
    }
}
