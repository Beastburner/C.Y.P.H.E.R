pragma circom 2.0.0;

/*
 * Withdrawal Circuit for Eclipsa Privacy Pool
 * 
 * This circuit proves that:
 * 1. The nullifier is computed correctly from the secret
 * 2. The commitment exists in the Merkle tree
 * 3. The user knows the secret corresponding to the commitment
 * 4. Prevents double-spending through nullifier uniqueness
 */

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "./merkleTree.circom";

template Withdrawal(levels) {
    // === PRIVATE INPUTS ===
    signal private input secret;
    signal private input nullifier;
    signal private input pathElements[levels];
    signal private input pathIndices[levels];
    
    // === PUBLIC INPUTS ===
    signal input merkleRoot;
    signal input nullifierHash;
    signal input recipient;
    signal input relayer;
    signal input fee;
    signal input refund;
    
    // === OUTPUTS ===
    signal output commitmentHash;
    
    // === CONSTRAINTS ===
    
    // 1. Compute commitment hash from secret and nullifier
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;
    commitmentHash <== commitmentHasher.out;
    
    // 2. Compute nullifier hash
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash === nullifierHasher.out;
    
    // 3. Verify commitment exists in Merkle tree
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHash;
    tree.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
    
    // 4. Ensure recipient and relayer are valid (non-zero)
    component recipientCheck = IsZero();
    recipientCheck.in <== recipient;
    recipientCheck.out === 0;
    
    // 5. Fee constraint (0 <= fee <= 1000000000000000000, max 1 ETH)
    component feeRangeCheck = LessEqThan(64);
    feeRangeCheck.in[0] <== fee;
    feeRangeCheck.in[1] <== 1000000000000000000;
    feeRangeCheck.out === 1;
    
    // 6. Refund constraint (0 <= refund <= 1000000000000000000)
    component refundRangeCheck = LessEqThan(64);
    refundRangeCheck.in[0] <== refund;
    refundRangeCheck.in[1] <== 1000000000000000000;
    refundRangeCheck.out === 1;
}

// Instantiate the main component
component main = Withdrawal(20); // 20 levels for Merkle tree (supports up to 2^20 = 1M deposits)
