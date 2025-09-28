// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerkleTree - Simplified Implementation for Hackathon
 * @dev Basic Merkle tree functionality for demo purposes
 */
library MerkleTree {
    struct Tree {
        mapping(uint256 => bytes32) nodes;
        uint256 levels;
        uint256 nextLeafIndex;
        bytes32[] roots;
    }
    
    /**
     * @dev Initialize tree with given levels
     */
    function initialize(Tree storage tree, uint256 _levels) internal {
        tree.levels = _levels;
        tree.nextLeafIndex = 0;
    }
    
    /**
     * @dev Insert a new leaf into the tree
     */
    function insert(Tree storage tree, bytes32 leaf) internal returns (uint256) {
        uint256 leafIndex = tree.nextLeafIndex;
        tree.nodes[leafIndex] = leaf;
        tree.nextLeafIndex++;
        
        // Update root (simplified - just hash all leaves)
        bytes32 newRoot = keccak256(abi.encodePacked(leaf, leafIndex, block.timestamp));
        tree.roots.push(newRoot);
        
        return leafIndex;
    }
    
    /**
     * @dev Get current root
     */
    function getCurrentRoot(Tree storage tree) internal view returns (bytes32) {
        if (tree.roots.length == 0) {
            return bytes32(0);
        }
        return tree.roots[tree.roots.length - 1];
    }
    
    /**
     * @dev Check if root is valid (exists in history)
     */
    function isValidRoot(Tree storage tree, bytes32 root) internal view returns (bool) {
        for (uint256 i = 0; i < tree.roots.length; i++) {
            if (tree.roots[i] == root) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get leaf count
     */
    function getLeafCount(Tree storage tree) internal view returns (uint256) {
        return tree.nextLeafIndex;
    }
}
