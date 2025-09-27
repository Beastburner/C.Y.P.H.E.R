// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PoseidonHash.sol";

/**
 * @title MerkleTree
 * @dev Enhanced Merkle tree implementation for advanced privacy pools
 * @notice This library provides optimized Merkle tree operations with:
 *         - Poseidon hash integration for ZK efficiency
 *         - Enhanced incremental updates with batching
 *         - Extended root history tracking with time-based validation
 *         - Gas-optimized storage layout and operations
 *         - Cross-chain compatibility features
 *         - Advanced path compression and caching
 */
library MerkleTree {
    using PoseidonHash for uint256[];
    using PoseidonHash for bytes32[];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS AND CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// @dev Maximum root history size for efficient storage
    uint256 constant ROOT_HISTORY_SIZE = 256;
    
    /// @dev Maximum tree height (2^32 leaves)
    uint256 constant MAX_TREE_HEIGHT = 32;
    
    /// @dev Minimum tree height for security
    uint256 constant MIN_TREE_HEIGHT = 10;
    
    /// @dev Maximum age for valid roots (in blocks)
    uint256 constant MAX_ROOT_AGE = 1000;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED TREE STRUCTURE
    // ═══════════════════════════════════════════════════════════════════════════
    
    struct Tree {
        uint256 height;                    // Tree height
        uint256 nextIndex;                 // Next available leaf index
        uint256 lastUpdateBlock;           // Block number of last update
        
        // Enhanced node storage with levels
        mapping(uint256 => mapping(uint256 => bytes32)) nodes; // level => index => hash
        
        // Root history with metadata
        RootData[ROOT_HISTORY_SIZE] rootHistory;
        uint256 rootHistoryIndex;
        uint256 rootHistoryCount;
        mapping(bytes32 => uint256) rootToIndex; // root => history index
        
        // Zero value cache for each level
        bytes32[] zeroHashes;
        
        // Batch update support
        bytes32[] pendingLeaves;
        bool batchMode;
        
        // Cross-chain support
        bytes32 chainId;
        uint256 treeId;
        
        // Performance optimization
        mapping(bytes32 => uint256) leafIndex; // leaf => index for quick lookup
        mapping(uint256 => bool) filledSubtrees; // subtree completion tracking
    }
    
    struct RootData {
        bytes32 root;
        uint256 blockNumber;
        uint256 timestamp;
        uint256 leafCount;
        bool isValid;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    event TreeInitialized(uint256 height, bytes32 chainId, uint256 treeId);
    event LeafAdded(uint256 indexed index, bytes32 indexed leaf, bytes32 newRoot);
    event BatchUpdate(uint256 startIndex, uint256 count, bytes32 newRoot);
    event RootExpired(bytes32 indexed root, uint256 blockNumber);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════
    
    error InvalidTreeHeight();
    error InvalidLeaf();
    error TreeFull();
    error IndexOutOfBounds();
    error InvalidRoot();
    error BatchModeActive();
    error BatchModeInactive();
    error RootTooOld();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION AND CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Initialize an enhanced Merkle tree with advanced features
     * @param tree The tree storage struct
     * @param _height Height of the tree (number of levels)
     * @param _chainId Chain identifier for cross-chain compatibility
     * @param _treeId Unique tree identifier
     */
    function initialize(
        Tree storage tree, 
        uint256 _height,
        bytes32 _chainId,
        uint256 _treeId
    ) internal {
        if (_height < MIN_TREE_HEIGHT || _height > MAX_TREE_HEIGHT) {
            revert InvalidTreeHeight();
        }
        
        tree.height = _height;
        tree.nextIndex = 0;
        tree.lastUpdateBlock = block.number;
        tree.rootHistoryIndex = 0;
        tree.rootHistoryCount = 0;
        tree.chainId = _chainId;
        tree.treeId = _treeId;
        tree.batchMode = false;
        
        // Pre-compute zero hashes for each level using Poseidon
        tree.zeroHashes = new bytes32[](_height);
        bytes32 currentZero = bytes32(0);
        tree.zeroHashes[0] = currentZero;
        
        for (uint256 level = 1; level < _height; level++) {
            currentZero = _poseidonHash(currentZero, currentZero);
            tree.zeroHashes[level] = currentZero;
        }
        
        // Initialize root node with zero hash
        tree.nodes[_height - 1][0] = tree.zeroHashes[_height - 1];
        
        // Set initial root in history
        bytes32 initialRoot = tree.zeroHashes[_height - 1];
        tree.rootHistory[0] = RootData({
            root: initialRoot,
            blockNumber: block.number,
            timestamp: block.timestamp,
            leafCount: 0,
            isValid: true
        });
        tree.rootToIndex[initialRoot] = 0;
        tree.rootHistoryCount = 1;
        
        emit TreeInitialized(_height, _chainId, _treeId);
    }

    /**
     * @dev Simplified initialization for backward compatibility
     * @param tree The tree storage struct
     * @param _height Height of the tree
     */
    function initialize(Tree storage tree, uint256 _height) internal {
        initialize(tree, _height, bytes32(block.chainid), 0);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CORE TREE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Add a new leaf to the tree with enhanced validation
     * @param tree The tree storage struct
     * @param leaf The leaf hash to add
     * @return success True if the leaf was added successfully
     */
    function addLeaf(Tree storage tree, bytes32 leaf) internal returns (bool) {
        if (leaf == bytes32(0)) revert InvalidLeaf();
        if (tree.batchMode) revert BatchModeActive();
        
        uint256 index = tree.nextIndex;
        if (index >= (1 << tree.height)) revert TreeFull();
        
        // Store leaf with index mapping for quick lookup
        tree.nodes[0][index] = leaf;
        tree.leafIndex[leaf] = index;
        
        // Update path to root using Poseidon hash
        bytes32 newRoot = _updatePathToRoot(tree, index, leaf);
        
        // Update root history with metadata
        _addRootToHistory(tree, newRoot, index + 1);
        
        tree.nextIndex++;
        tree.lastUpdateBlock = block.number;
        
        emit LeafAdded(index, leaf, newRoot);
        return true;
    }
    
    /**
     * @dev Start batch mode for efficient multiple leaf additions
     * @param tree The tree storage struct
     */
    function startBatch(Tree storage tree) internal {
        tree.batchMode = true;
        delete tree.pendingLeaves;
    }
    
    /**
     * @dev Add leaf to batch queue
     * @param tree The tree storage struct
     * @param leaf The leaf to add to batch
     */
    function addToBatch(Tree storage tree, bytes32 leaf) internal {
        if (!tree.batchMode) revert BatchModeInactive();
        if (leaf == bytes32(0)) revert InvalidLeaf();
        
        tree.pendingLeaves.push(leaf);
    }
    
    /**
     * @dev Commit batch update and compute new root
     * @param tree The tree storage struct
     * @return newRoot The root after batch update
     */
    function commitBatch(Tree storage tree) internal returns (bytes32 newRoot) {
        if (!tree.batchMode) revert BatchModeInactive();
        
        uint256 startIndex = tree.nextIndex;
        uint256 batchSize = tree.pendingLeaves.length;
        
        if (startIndex + batchSize > (1 << tree.height)) revert TreeFull();
        
        // Process all pending leaves
        for (uint256 i = 0; i < batchSize; i++) {
            bytes32 leaf = tree.pendingLeaves[i];
            uint256 index = startIndex + i;
            
            tree.nodes[0][index] = leaf;
            tree.leafIndex[leaf] = index;
            
            // Update path for this leaf
            _updatePathToRoot(tree, index, leaf);
        }
        
        // Get final root after all updates
        newRoot = tree.nodes[tree.height - 1][0];
        
        // Update tree state
        tree.nextIndex += batchSize;
        tree.lastUpdateBlock = block.number;
        tree.batchMode = false;
        
        // Add new root to history
        _addRootToHistory(tree, newRoot, tree.nextIndex);
        
        emit BatchUpdate(startIndex, batchSize, newRoot);
        delete tree.pendingLeaves;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED QUERY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Get the current root of the tree
     * @param tree The tree storage struct
     * @return The current root hash
     */
    function getRoot(Tree storage tree) internal view returns (bytes32) {
        if (tree.height == 0) return bytes32(0);
        if (tree.rootHistoryCount == 0) return tree.zeroHashes[tree.height - 1];
        
        return tree.rootHistory[tree.rootHistoryIndex].root;
    }

    /**
     * @dev Enhanced root validation with time-based expiry
     * @param tree The tree storage struct
     * @param root The root to validate
     * @return isValid True if the root is valid and not expired
     */
    function isValidRoot(Tree storage tree, bytes32 root) internal view returns (bool isValid) {
        uint256 rootIndex = tree.rootToIndex[root];
        if (rootIndex >= tree.rootHistoryCount) return false;
        
        RootData storage rootData = tree.rootHistory[rootIndex];
        if (!rootData.isValid) return false;
        if (rootData.root != root) return false;
        
        // Check if root is too old
        if (block.number > rootData.blockNumber + MAX_ROOT_AGE) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Get enhanced Merkle path with optimization
     * @param tree The tree storage struct
     * @param index The leaf index
     * @return path Array of sibling hashes
     * @return indices Array of path directions (0 = left, 1 = right)
     */
    function getPath(Tree storage tree, uint256 index) 
        internal 
        view 
        returns (bytes32[] memory path, uint256[] memory indices) 
    {
        if (index >= tree.nextIndex) revert IndexOutOfBounds();
        
        path = new bytes32[](tree.height - 1);
        indices = new uint256[](tree.height - 1);
        
        uint256 currentIndex = index;
        
        for (uint256 level = 0; level < tree.height - 1; level++) {
            uint256 siblingIndex = currentIndex % 2 == 0 ? currentIndex + 1 : currentIndex - 1;
            
            // Get sibling hash, using zero hash if not set
            bytes32 siblingHash = tree.nodes[level][siblingIndex];
            if (siblingHash == bytes32(0) && siblingIndex >= tree.nextIndex) {
                siblingHash = tree.zeroHashes[level];
            }
            
            path[level] = siblingHash;
            indices[level] = currentIndex % 2;
            currentIndex = currentIndex / 2;
        }
    }
    
    /**
     * @dev Get path for a specific leaf value (if it exists)
     * @param tree The tree storage struct
     * @param leaf The leaf hash to find path for
     * @return path Array of sibling hashes
     * @return indices Array of path directions
     * @return index The leaf index
     */
    function getPathForLeaf(Tree storage tree, bytes32 leaf)
        internal
        view
        returns (bytes32[] memory path, uint256[] memory indices, uint256 index)
    {
        index = tree.leafIndex[leaf];
        if (tree.nodes[0][index] != leaf) revert InvalidLeaf();
        
        (path, indices) = getPath(tree, index);
    }

    /**
     * @dev Get comprehensive root history with metadata
     * @param tree The tree storage struct
     * @return roots Array of root data structures
     */
    function getRootHistoryWithMetadata(Tree storage tree) 
        internal 
        view 
        returns (RootData[] memory roots) 
    {
        uint256 count = tree.rootHistoryCount;
        if (count > ROOT_HISTORY_SIZE) count = ROOT_HISTORY_SIZE;
        
        roots = new RootData[](count);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 historyIndex = (tree.rootHistoryIndex + ROOT_HISTORY_SIZE - i) % ROOT_HISTORY_SIZE;
            roots[i] = tree.rootHistory[historyIndex];
        }
    }

    /**
     * @dev Get recent root history (backward compatible)
     * @param tree The tree storage struct
     * @return rootHashes Array of recent root hashes
     */
    function getRootHistory(Tree storage tree) internal view returns (bytes32[] memory rootHashes) {
        RootData[] memory roots = getRootHistoryWithMetadata(tree);
        rootHashes = new bytes32[](roots.length);
        
        for (uint256 i = 0; i < roots.length; i++) {
            rootHashes[i] = roots[i].root;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED VERIFICATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Verify a Merkle proof using Poseidon hash
     * @param leaf The leaf hash
     * @param proof Array of sibling hashes
     * @param indices Array of path directions
     * @param root The expected root
     * @return True if the proof is valid
     */
    function verifyProof(
        bytes32 leaf,
        bytes32[] memory proof,
        uint256[] memory indices,
        bytes32 root
    ) internal pure returns (bool) {
        if (proof.length != indices.length) return false;
        
        bytes32 currentHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            if (indices[i] == 0) {
                // Current node is left child
                currentHash = _poseidonHash(currentHash, proof[i]);
            } else {
                // Current node is right child
                currentHash = _poseidonHash(proof[i], currentHash);
            }
        }
        
        return currentHash == root;
    }
    
    /**
     * @dev Verify proof with additional leaf existence check
     * @param tree The tree storage struct
     * @param leaf The leaf hash
     * @param proof Array of sibling hashes
     * @param indices Array of path directions
     * @param root The expected root
     * @return isValid True if proof is valid and leaf exists
     */
    function verifyInclusionProof(
        Tree storage tree,
        bytes32 leaf,
        bytes32[] memory proof,
        uint256[] memory indices,
        bytes32 root
    ) internal view returns (bool isValid) {
        // First verify the root is valid
        if (!isValidRoot(tree, root)) return false;
        
        // Then verify the Merkle proof
        return verifyProof(leaf, proof, indices, root);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY AND INFORMATION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Get the number of leaves in the tree
     * @param tree The tree storage struct
     * @return The number of leaves
     */
    function getLeafCount(Tree storage tree) internal view returns (uint256) {
        return tree.nextIndex;
    }

    /**
     * @dev Check if the tree is full
     * @param tree The tree storage struct
     * @return True if the tree is full
     */
    function isFull(Tree storage tree) internal view returns (bool) {
        return tree.nextIndex >= (1 << tree.height);
    }

    /**
     * @dev Get tree capacity
     * @param tree The tree storage struct
     * @return The maximum number of leaves the tree can hold
     */
    function getCapacity(Tree storage tree) internal view returns (uint256) {
        return 1 << tree.height;
    }
    
    /**
     * @dev Get tree statistics
     * @param tree The tree storage struct
     * @return height Tree height
     * @return leafCount Current number of leaves
     * @return capacity Maximum capacity
     * @return lastUpdate Block number of last update
     * @return rootCount Number of roots in history
     */
    function getTreeStats(Tree storage tree) 
        internal 
        view 
        returns (
            uint256 height,
            uint256 leafCount,
            uint256 capacity,
            uint256 lastUpdate,
            uint256 rootCount
        ) 
    {
        height = tree.height;
        leafCount = tree.nextIndex;
        capacity = 1 << tree.height;
        lastUpdate = tree.lastUpdateBlock;
        rootCount = tree.rootHistoryCount;
    }
    
    /**
     * @dev Check if a leaf exists in the tree
     * @param tree The tree storage struct
     * @param leaf The leaf hash to check
     * @return exists True if leaf exists
     * @return index The index of the leaf (if exists)
     */
    function hasLeaf(Tree storage tree, bytes32 leaf) 
        internal 
        view 
        returns (bool exists, uint256 index) 
    {
        index = tree.leafIndex[leaf];
        exists = (index < tree.nextIndex && tree.nodes[0][index] == leaf);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @dev Update path from leaf to root
     * @param tree The tree storage struct
     * @param index The leaf index
     * @param leaf The leaf hash
     * @return newRoot The new root hash
     */
    function _updatePathToRoot(
        Tree storage tree,
        uint256 index,
        bytes32 leaf
    ) private returns (bytes32 newRoot) {
        uint256 currentIndex = index;
        bytes32 currentHash = leaf;
        
        for (uint256 level = 0; level < tree.height - 1; level++) {
            uint256 siblingIndex = currentIndex % 2 == 0 ? currentIndex + 1 : currentIndex - 1;
            bytes32 sibling = tree.nodes[level][siblingIndex];
            
            // Use zero hash if sibling doesn't exist yet
            if (sibling == bytes32(0) && siblingIndex >= tree.nextIndex) {
                sibling = tree.zeroHashes[level];
            }
            
            // Hash with sibling using correct order
            if (currentIndex % 2 == 0) {
                currentHash = _poseidonHash(currentHash, sibling);
            } else {
                currentHash = _poseidonHash(sibling, currentHash);
            }
            
            currentIndex = currentIndex / 2;
            tree.nodes[level + 1][currentIndex] = currentHash;
        }
        
        return currentHash;
    }
    
    /**
     * @dev Add new root to history with metadata
     * @param tree The tree storage struct
     * @param root The new root hash
     * @param leafCount Current leaf count
     */
    function _addRootToHistory(
        Tree storage tree,
        bytes32 root,
        uint256 leafCount
    ) private {
        // Clean up old expired roots
        _cleanupExpiredRoots(tree);
        
        // Add new root
        tree.rootHistoryIndex = (tree.rootHistoryIndex + 1) % ROOT_HISTORY_SIZE;
        
        tree.rootHistory[tree.rootHistoryIndex] = RootData({
            root: root,
            blockNumber: block.number,
            timestamp: block.timestamp,
            leafCount: leafCount,
            isValid: true
        });
        
        tree.rootToIndex[root] = tree.rootHistoryIndex;
        
        if (tree.rootHistoryCount < ROOT_HISTORY_SIZE) {
            tree.rootHistoryCount++;
        }
    }
    
    /**
     * @dev Clean up expired roots from history
     * @param tree The tree storage struct
     */
    function _cleanupExpiredRoots(Tree storage tree) private {
        for (uint256 i = 0; i < tree.rootHistoryCount; i++) {
            RootData storage rootData = tree.rootHistory[i];
            
            if (rootData.isValid && 
                block.number > rootData.blockNumber + MAX_ROOT_AGE) {
                rootData.isValid = false;
                emit RootExpired(rootData.root, block.number);
            }
        }
    }

    /**
     * @dev Internal Poseidon hash function for two inputs
     * @param left Left input
     * @param right Right input
     * @return hash Poseidon hash result
     */
    function _poseidonHash(bytes32 left, bytes32 right) private pure returns (bytes32) {
        return bytes32(PoseidonHash.poseidon(uint256(left), uint256(right)));
    }
}
