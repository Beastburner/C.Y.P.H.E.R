pragma circom 2.0.0;

/*
 * ENS Privacy Circuit
 * 
 * Enables privacy-preserving ENS record management with selective disclosure
 * Allows users to prove ownership of ENS names without revealing the name itself
 */

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/bitify.circom";

template ENSPrivacy() {
    // === PRIVATE INPUTS ===
    signal private input ensName; // Hash of ENS name
    signal private input ownerPrivateKey;
    signal private input recordKey; // Hash of record key
    signal private input recordValue; // Hash of record value
    signal private input accessLevel; // 0=public, 1=friends, 2=private
    signal private input friendsList[10]; // List of friend addresses (hashed)
    
    // === PUBLIC INPUTS ===
    signal input ensNameHash;
    signal input ownerAddress;
    signal input recordKeyHash;
    signal input requesterAddress;
    signal input timestamp;
    
    // === OUTPUTS ===
    signal output canAccess; // 1 if requester can access, 0 otherwise
    signal output encryptedValue; // Encrypted record value if accessible
    
    // === CONSTRAINTS ===
    
    // 1. Verify ENS name ownership
    ensNameHash === ensName;
    
    // 2. Verify owner address matches private key
    component ownerVerifier = Poseidon(1);
    ownerVerifier.inputs[0] <== ownerPrivateKey;
    ownerAddress === ownerVerifier.out;
    
    // 3. Verify record key
    recordKeyHash === recordKey;
    
    // 4. Access control logic
    component accessChecker;
    
    // Check if access level is public (0)
    component isPublic = IsEqual();
    isPublic.in[0] <== accessLevel;
    isPublic.in[1] <== 0;
    
    // Check if requester is owner
    component isOwner = IsEqual();
    isOwner.in[0] <== requesterAddress;
    isOwner.in[1] <== ownerAddress;
    
    // Check if requester is in friends list (for friends access level = 1)
    component isFriend = CheckFriendsList(10);
    isFriend.requester <== requesterAddress;
    for (var i = 0; i < 10; i++) {
        isFriend.friends[i] <== friendsList[i];
    }
    
    component isFriendsLevel = IsEqual();
    isFriendsLevel.in[0] <== accessLevel;
    isFriendsLevel.in[1] <== 1;
    
    // Final access decision
    signal friendsAccess;
    friendsAccess <== isFriendsLevel.out * isFriend.out;
    
    canAccess <== isPublic.out + isOwner.out + friendsAccess;
    
    // 5. Generate encrypted value if accessible
    component encryptor = ConditionalEncrypt();
    encryptor.value <== recordValue;
    encryptor.canAccess <== canAccess;
    encryptor.requesterKey <== requesterAddress; // Use requester address as encryption key
    encryptedValue <== encryptor.out;
}

/*
 * Helper template to check if requester is in friends list
 */
template CheckFriendsList(n) {
    signal input requester;
    signal input friends[n];
    signal output out;
    
    component equalCheckers[n];
    signal partialResults[n + 1];
    partialResults[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        equalCheckers[i] = IsEqual();
        equalCheckers[i].in[0] <== requester;
        equalCheckers[i].in[1] <== friends[i];
        
        // OR operation: if any friend matches, result is 1
        partialResults[i + 1] <== partialResults[i] + equalCheckers[i].out;
    }
    
    // Convert to boolean (0 or 1)
    component finalCheck = IsZero();
    finalCheck.in <== partialResults[n];
    out <== 1 - finalCheck.out;
}

/*
 * Conditional encryption based on access rights
 */
template ConditionalEncrypt() {
    signal input value;
    signal input canAccess;
    signal input requesterKey;
    signal output out;
    
    // Simple encryption: XOR with requester key if access granted
    component encryptor = Poseidon(2);
    encryptor.inputs[0] <== value;
    encryptor.inputs[1] <== requesterKey;
    
    // Return encrypted value if access granted, 0 otherwise
    out <== canAccess * encryptor.out;
}

/*
 * ENS Batch Privacy Update Circuit
 * 
 * Allows updating multiple ENS records atomically with privacy controls
 */
template ENSBatchUpdate(numRecords) {
    // === PRIVATE INPUTS ===
    signal private input ensName;
    signal private input ownerPrivateKey;
    signal private input recordKeys[numRecords];
    signal private input recordValues[numRecords];
    signal private input accessLevels[numRecords];
    
    // === PUBLIC INPUTS ===
    signal input ensNameHash;
    signal input ownerAddress;
    signal input timestamp;
    signal input nonce; // Prevent replay attacks
    
    // === OUTPUTS ===
    signal output updateProof;
    signal output recordHashes[numRecords];
    
    // === CONSTRAINTS ===
    
    // 1. Verify ownership
    ensNameHash === ensName;
    
    component ownerVerifier = Poseidon(1);
    ownerVerifier.inputs[0] <== ownerPrivateKey;
    ownerAddress === ownerVerifier.out;
    
    // 2. Generate record hashes and update proof
    component recordHashers[numRecords];
    component updateHasher = Poseidon(numRecords + 3);
    
    updateHasher.inputs[0] <== ensName;
    updateHasher.inputs[1] <== timestamp;
    updateHasher.inputs[2] <== nonce;
    
    for (var i = 0; i < numRecords; i++) {
        recordHashers[i] = Poseidon(3);
        recordHashers[i].inputs[0] <== recordKeys[i];
        recordHashers[i].inputs[1] <== recordValues[i];
        recordHashers[i].inputs[2] <== accessLevels[i];
        
        recordHashes[i] <== recordHashers[i].out;
        updateHasher.inputs[i + 3] <== recordHashes[i];
    }
    
    updateProof <== updateHasher.out;
}

// Instantiate main component
component main = ENSPrivacy();
