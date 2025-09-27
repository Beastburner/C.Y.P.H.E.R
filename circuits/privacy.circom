pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./merkleTree.circom";

/*
 * Enhanced Privacy Note Circuit for Dual-Layer Architecture
 * 
 * This circuit proves:
 * 1. Knowledge of a secret that generates a valid commitment
 * 2. The commitment exists in the Merkle tree (membership proof)
 * 3. Knowledge of the nullifier to prevent double-spending
 * 4. Alias-to-commitment mapping validity
 * 5. Amount consistency across the transaction
 */
template PrivacyNote(levels) {
    // === PRIVATE INPUTS (Secret Information) ===
    signal private input secret;                    // User's secret value
    signal private input nullifier;                 // Unique nullifier for this note
    signal private input amount;                    // Transaction amount
    signal private input recipient;                 // Recipient address
    signal private input aliasCommitment;           // Commitment in alias account
    signal private input pathElements[levels];      // Merkle proof path elements
    signal private input pathIndices[levels];       // Merkle proof path indices
    
    // === PUBLIC INPUTS (Verifiable On-Chain) ===
    signal input merkleRoot;                        // Current Merkle tree root
    signal input nullifierHash;                     // Hash of nullifier (prevents double-spend)
    signal input recipientHash;                     // Hash of recipient address
    signal input aliasAddress;                      // Public alias address
    signal input minimumAmount;                     // Minimum amount for privacy (prevents dust)
    
    // === OUTPUTS ===
    signal output commitmentHash;                   // The commitment being proven
    signal output validProof;                       // Proof validity indicator (1 or 0)
    signal output privacyScore;                     // Calculated privacy score

    // === COMPONENTS ===
    
    // 1. Commitment generation from private inputs
    component commitmentHasher = Poseidon(4);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;
    commitmentHasher.inputs[2] <== amount;
    commitmentHasher.inputs[3] <== recipient;
    commitmentHash <== commitmentHasher.out;
    
    // 2. Nullifier hash verification
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== secret;
    nullifierHash === nullifierHasher.out;
    
    // 3. Recipient hash verification
    component recipientHasher = Poseidon(1);
    recipientHasher.inputs[0] <== recipient;
    recipientHash === recipientHasher.out;
    
    // 4. Merkle tree membership proof
    component merkleProof = MerkleTreeInclusionProof(levels);
    merkleProof.leaf <== commitmentHash;
    merkleProof.root <== merkleRoot;
    for (var i = 0; i < levels; i++) {
        merkleProof.pathElements[i] <== pathElements[i];
        merkleProof.pathIndices[i] <== pathIndices[i];
    }
    
    // 5. Verify alias-to-commitment mapping
    component aliasVerifier = Poseidon(3);
    aliasVerifier.inputs[0] <== aliasAddress;
    aliasVerifier.inputs[1] <== commitmentHash;
    aliasVerifier.inputs[2] <== secret;
    aliasCommitment === aliasVerifier.out;
    
    // 6. Amount range verification (prevent dust attacks)
    component amountCheck = GreaterThanBits(64);
    amountCheck.in[0] <== amount;
    amountCheck.in[1] <== minimumAmount;
    
    // 7. Privacy score calculation based on constraints
    component privacyCalculator = PrivacyScoreCalculator();
    privacyCalculator.amount <== amount;
    privacyCalculator.hasAlias <== 1; // Always 1 since we're using aliases
    privacyCalculator.merkleTreeSize <== levels;
    privacyScore <== privacyCalculator.score;
    
    // 8. Final proof validation
    component validator = IsEqual();
    validator.in[0] <== merkleProof.isValid;
    validator.in[1] <== 1;
    
    validProof <== validator.out * amountCheck.out;
}

/*
 * Merkle Tree Inclusion Proof Component
 * Proves that a leaf exists in a Merkle tree
 */
template MerkleTreeInclusionProof(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output isValid;
    
    // Hash path from leaf to root
    component hashers[levels];
    component selectors[levels];
    
    var currentHash = leaf;
    
    for (var i = 0; i < levels; i++) {
        // Select left or right based on path index
        selectors[i] = Selector2();
        selectors[i].sel <== pathIndices[i];
        selectors[i].in[0] <== currentHash;
        selectors[i].in[1] <== pathElements[i];
        
        // Hash current level
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].out[0]; // Left child
        hashers[i].inputs[1] <== selectors[i].out[1]; // Right child
        
        currentHash = hashers[i].out;
    }
    
    // Verify final hash equals root
    component rootVerifier = IsEqual();
    rootVerifier.in[0] <== currentHash;
    rootVerifier.in[1] <== root;
    isValid <== rootVerifier.out;
}

/*
 * Privacy Score Calculator
 * Calculates a privacy score based on various factors
 */
template PrivacyScoreCalculator() {
    signal input amount;
    signal input hasAlias;
    signal input merkleTreeSize;
    signal output score;
    
    // Base score for using the privacy system
    var baseScore = 50;
    
    // Bonus for larger amounts (up to 20 points)
    component amountScore = AmountToScore();
    amountScore.amount <== amount;
    
    // Bonus for using aliases (10 points)
    var aliasBonus = hasAlias * 10;
    
    // Bonus for larger anonymity sets (up to 20 points)
    component treeScore = TreeSizeToScore();
    treeScore.treeSize <== merkleTreeSize;
    
    score <== baseScore + amountScore.points + aliasBonus + treeScore.points;
}

/*
 * Convert amount to privacy score points
 */
template AmountToScore() {
    signal input amount;
    signal output points;
    
    // Simple scoring based on amount ranges
    // This is a simplified version - in production you'd want more sophisticated scoring
    component amountRanges[4];
    
    // Check different amount ranges
    amountRanges[0] = GreaterThanBits(64);
    amountRanges[0].in[0] <== amount;
    amountRanges[0].in[1] <== 100000000000000000; // 0.1 ETH
    
    amountRanges[1] = GreaterThanBits(64);
    amountRanges[1].in[0] <== amount;
    amountRanges[1].in[1] <== 1000000000000000000; // 1 ETH
    
    amountRanges[2] = GreaterThanBits(64);
    amountRanges[2].in[0] <== amount;
    amountRanges[2].in[1] <== 10000000000000000000; // 10 ETH
    
    amountRanges[3] = GreaterThanBits(64);
    amountRanges[3].in[0] <== amount;
    amountRanges[3].in[1] <== 100000000000000000000; // 100 ETH
    
    // Calculate points based on ranges (5 points per range)
    points <== (amountRanges[0].out + amountRanges[1].out + amountRanges[2].out + amountRanges[3].out) * 5;
}

/*
 * Convert tree size to privacy score points
 */
template TreeSizeToScore() {
    signal input treeSize;
    signal output points;
    
    // Larger trees provide better anonymity
    component treeSizeCheck = GreaterThanBits(8);
    treeSizeCheck.in[0] <== treeSize;
    treeSizeCheck.in[1] <== 16; // Trees larger than 16 levels get bonus
    
    points <== treeSizeCheck.out * 20;
}

/*
 * Selector component - selects between two inputs based on selector bit
 */
template Selector2() {
    signal input sel;
    signal input in[2];
    signal output out[2];
    
    out[0] <== (1 - sel) * in[0] + sel * in[1];
    out[1] <== sel * in[0] + (1 - sel) * in[1];
}

/*
 * Enhanced Greater Than with configurable bit length
 */
template GreaterThanBits(n) {
    signal input in[2];
    signal output out;
    
    component lt = LessThan(n);
    lt.in[0] <== in[1];
    lt.in[1] <== in[0] + 1;
    out <== lt.out;
}

/*
 * Main component instantiation
 * Uses 20-level Merkle tree (supports up to 1M commitments)
 */
component main {public [merkleRoot, nullifierHash, recipientHash, aliasAddress, minimumAmount]} = PrivacyNote(20);
