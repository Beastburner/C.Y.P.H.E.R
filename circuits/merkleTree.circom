pragma circom 2.0.0;

/*
 * Merkle Tree Checker Circuit
 * 
 * Verifies that a given leaf is included in a Merkle tree with a given root
 * Uses Poseidon hash function for better ZK-SNARK performance
 */

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/mux1.circom";

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component selectors[levels];
    component hashers[levels];

    // Hash of current level
    signal currentHash[levels + 1];
    currentHash[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        // Select the correct order of inputs for hashing
        selectors[i] = MultiMux1(2);
        selectors[i].c[0][0] <== currentHash[i];         // left input when pathIndices[i] == 0
        selectors[i].c[0][1] <== pathElements[i];        // right input when pathIndices[i] == 0
        selectors[i].c[1][0] <== pathElements[i];        // left input when pathIndices[i] == 1
        selectors[i].c[1][1] <== currentHash[i];         // right input when pathIndices[i] == 1
        selectors[i].s <== pathIndices[i];
        
        // Hash the pair
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
        
        currentHash[i + 1] <== hashers[i].out;
    }

    // The final hash should equal the root
    root === currentHash[levels];
}

/*
 * Merkle Tree Updater Circuit
 * 
 * Computes new Merkle root after inserting a new leaf
 */
template MerkleTreeUpdater(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    signal output newRoot;
    
    component hashers[levels];
    component selectors[levels];
    
    signal currentHash[levels + 1];
    currentHash[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        selectors[i] = MultiMux1(2);
        selectors[i].c[0][0] <== currentHash[i];
        selectors[i].c[0][1] <== pathElements[i];
        selectors[i].c[1][0] <== pathElements[i];
        selectors[i].c[1][1] <== currentHash[i];
        selectors[i].s <== pathIndices[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0];
        hashers[i].inputs[1] <== selectors[i].out[1];
        
        currentHash[i + 1] <== hashers[i].out;
    }
    
    newRoot <== currentHash[levels];
}

/*
 * Batch Merkle Tree Verification
 * 
 * Verifies multiple leaves efficiently in a single circuit
 */
template BatchMerkleTreeChecker(levels, batchSize) {
    signal input leaves[batchSize];
    signal input root;
    signal input pathElements[batchSize][levels];
    signal input pathIndices[batchSize][levels];
    
    component checkers[batchSize];
    
    for (var i = 0; i < batchSize; i++) {
        checkers[i] = MerkleTreeChecker(levels);
        checkers[i].leaf <== leaves[i];
        checkers[i].root <== root;
        
        for (var j = 0; j < levels; j++) {
            checkers[i].pathElements[j] <== pathElements[i][j];
            checkers[i].pathIndices[j] <== pathIndices[i][j];
        }
    }
}
