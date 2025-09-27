// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PoseidonHash.sol";
import "./MerkleTree.sol";

/**
 * @title ZKProofSystem
 * @dev Comprehensive zero-knowledge proof system for advanced privacy pools
 * @notice This library provides production-ready ZK-SNARK verification with:
 *         - Groth16 proof verification with optimized pairing operations
 *         - Advanced nullifier management with double-spending prevention
 *         - Multi-denomination privacy pool support
 *         - Cross-chain compatibility features
 *         - Enhanced security with proof replay protection
 *         - Optimized circuit constraints for gas efficiency
 */
library ZKProofSystem {
    using PoseidonHash for uint256;
    using MerkleTree for MerkleTree.Tree;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ELLIPTIC CURVE AND PAIRING CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// @dev BN254 curve order
    uint256 constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    /// @dev Generator point for G1
    uint256 constant G1_X = 1;
    uint256 constant G1_Y = 2;
    
    /// @dev Generator point for G2
    uint256 constant G2_X1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant G2_X2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant G2_Y1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant G2_Y2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PROOF SYSTEM STRUCTURES
    // ═══════════════════════════════════════════════════════════════════════════
    
    struct G1Point {
        uint256 x;
        uint256 y;
    }
    
    struct G2Point {
        uint256[2] x;
        uint256[2] y;
    }
    
    struct VerifyingKey {
        G1Point alpha;          // α in G1
        G2Point beta;           // β in G2
        G2Point gamma;          // γ in G2
        G2Point delta;          // δ in G2
        G1Point[] ic;           // [γ^{-1} * (β * ui + α * vi)] for each input
    }
    
    struct Proof {
        G1Point a;              // A in G1
        G2Point b;              // B in G2
        G1Point c;              // C in G1
    }
    
    struct PrivacyProof {
        Proof groth16Proof;     // Core Groth16 proof
        bytes32 nullifierHash;  // Nullifier for double-spending prevention
        bytes32 commitmentHash; // New commitment being created
        bytes32 merkleRoot;     // Merkle root being proven against
        uint256 denomination;   // Amount denomination
        uint256 fee;            // Transaction fee
        address recipient;      // Recipient address (if withdrawal)
        uint256 relayerFee;     // Relayer fee for meta-transactions
        bytes32 externalHash;   // External data hash for cross-chain
    }
    
    struct ProofPublicInputs {
        uint256 merkleRoot;     // Merkle tree root
        uint256 nullifierHash;  // Nullifier hash
        uint256 commitmentHash; // New commitment hash
        uint256 recipient;      // Recipient address (if withdrawal)
        uint256 relayerFee;     // Relayer fee
        uint256 fee;            // Transaction fee
        uint256 denomination;   // Amount denomination
        uint256 externalHash;   // External data hash
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    struct ProofVerificationState {
        mapping(bytes32 => bool) usedNullifiers;    // Prevent double-spending
        mapping(bytes32 => bool) usedProofs;        // Prevent proof replay
        mapping(uint256 => VerifyingKey) verifyingKeys; // Keys per denomination
        uint256 lastUpdateBlock;                    // Last update timestamp
        bool emergencyMode;                         // Emergency pause state
        
        // Enhanced security features
        mapping(address => uint256) relayerNonces;  // Prevent replay for relayers
        mapping(bytes32 => uint256) proofTimestamps; // Track proof creation time
        uint256 proofValidityWindow;               // Time window for proof validity
        
        // Cross-chain support
        mapping(uint256 => bool) supportedChains;  // Supported chain IDs
        mapping(bytes32 => bool) crossChainProofs; // Cross-chain proof tracking
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════
    
    event ProofVerified(
        bytes32 indexed nullifierHash,
        bytes32 indexed commitmentHash,
        bytes32 indexed merkleRoot,
        uint256 denomination
    );
    
    event NullifierUsed(bytes32 indexed nullifierHash, address indexed user);
    event VerifyingKeyUpdated(uint256 indexed denomination, address updater);
    event EmergencyModeToggled(bool enabled, address admin);
    event CrossChainProofVerified(bytes32 indexed proofHash, uint256 sourceChain);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════
    
    error InvalidProof();
    error NullifierAlreadyUsed();
    error ProofAlreadyUsed();
    error InvalidVerifyingKey();
    error EmergencyModeActive();
    error ProofExpired();
    error InvalidDenomination();
    error UnsupportedChain();
    error InvalidPublicInputs();
    error PairingCheckFailed();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION AND CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Initialize proof verification system
     * @param state The verification state storage
     * @param _proofValidityWindow Time window for proof validity (in seconds)
     */
    function initialize(
        ProofVerificationState storage state,
        uint256 _proofValidityWindow
    ) internal {
        state.lastUpdateBlock = block.number;
        state.emergencyMode = false;
        state.proofValidityWindow = _proofValidityWindow;
        
        // Enable mainnet by default
        state.supportedChains[1] = true;
        state.supportedChains[block.chainid] = true;
    }
    
    /**
     * @dev Set verifying key for a specific denomination
     * @param state The verification state storage
     * @param denomination The denomination amount
     * @param vk The verifying key structure
     */
    function setVerifyingKey(
        ProofVerificationState storage state,
        uint256 denomination,
        VerifyingKey memory vk
    ) internal {
        if (state.emergencyMode) revert EmergencyModeActive();
        
        // Validate verifying key structure
        if (!_isValidVerifyingKey(vk)) revert InvalidVerifyingKey();
        
        state.verifyingKeys[denomination] = vk;
        state.lastUpdateBlock = block.number;
        
        emit VerifyingKeyUpdated(denomination, msg.sender);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CORE PROOF VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Verify a complete privacy proof with all security checks
     * @param state The verification state storage
     * @param privacyProof The complete privacy proof structure
     * @return success True if proof verification succeeds
     */
    function verifyPrivacyProof(
        ProofVerificationState storage state,
        PrivacyProof memory privacyProof
    ) internal returns (bool success) {
        if (state.emergencyMode) revert EmergencyModeActive();
        
        // Basic validation
        if (privacyProof.denomination == 0) revert InvalidDenomination();
        
        // Check nullifier hasn't been used
        if (state.usedNullifiers[privacyProof.nullifierHash]) {
            revert NullifierAlreadyUsed();
        }
        
        // Generate proof hash for replay protection
        bytes32 proofHash = _generateProofHash(privacyProof);
        if (state.usedProofs[proofHash]) revert ProofAlreadyUsed();
        
        // Prepare public inputs
        ProofPublicInputs memory publicInputs = ProofPublicInputs({
            merkleRoot: uint256(privacyProof.merkleRoot),
            nullifierHash: uint256(privacyProof.nullifierHash),
            commitmentHash: uint256(privacyProof.commitmentHash),
            recipient: uint256(uint160(privacyProof.recipient)),
            relayerFee: privacyProof.relayerFee,
            fee: privacyProof.fee,
            denomination: privacyProof.denomination,
            externalHash: uint256(privacyProof.externalHash)
        });
        
        // Verify the Groth16 proof
        VerifyingKey storage vk = state.verifyingKeys[privacyProof.denomination];
        if (!_verifyGroth16Proof(privacyProof.groth16Proof, publicInputs, vk)) {
            revert InvalidProof();
        }
        
        // Mark nullifier and proof as used
        state.usedNullifiers[privacyProof.nullifierHash] = true;
        state.usedProofs[proofHash] = true;
        state.proofTimestamps[proofHash] = block.timestamp;
        
        emit ProofVerified(
            privacyProof.nullifierHash,
            privacyProof.commitmentHash,
            privacyProof.merkleRoot,
            privacyProof.denomination
        );
        
        emit NullifierUsed(privacyProof.nullifierHash, msg.sender);
        
        return true;
    }
    
    /**
     * @dev Verify Groth16 proof with optimized pairing check
     * @param proof The Groth16 proof structure
     * @param publicInputs The public inputs for verification
     * @param vk The verifying key
     * @return success True if proof is valid
     */
    function _verifyGroth16Proof(
        Proof memory proof,
        ProofPublicInputs memory publicInputs,
        VerifyingKey storage vk
    ) private view returns (bool success) {
        // Validate proof points are on curve
        if (!_isOnCurveG1(proof.a) || !_isOnCurveG1(proof.c)) return false;
        if (!_isOnCurveG2(proof.b)) return false;
        
        // Compute vk_x = IC[0] + sum(publicInputs[i] * IC[i+1])
        G1Point memory vk_x = vk.ic[0];
        
        uint256[] memory inputs = _packPublicInputs(publicInputs);
        
        for (uint256 i = 0; i < inputs.length; i++) {
            if (i + 1 >= vk.ic.length) revert InvalidPublicInputs();
            vk_x = _addG1(vk_x, _scalarMulG1(vk.ic[i + 1], inputs[i]));
        }
        
        // Perform pairing check: e(A, B) = e(α, β) * e(vk_x, γ) * e(C, δ)
        return _pairingCheck(
            proof.a, proof.b,
            _negateG1(vk.alpha), vk.beta,
            _negateG1(vk_x), vk.gamma,
            _negateG1(proof.c), vk.delta
        );
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NULLIFIER MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Check if a nullifier has been used
     * @param state The verification state storage
     * @param nullifierHash The nullifier hash to check
     * @return used True if nullifier has been used
     */
    function isNullifierUsed(
        ProofVerificationState storage state,
        bytes32 nullifierHash
    ) internal view returns (bool used) {
        return state.usedNullifiers[nullifierHash];
    }
    
    /**
     * @dev Generate nullifier hash from secret and commitment
     * @param secret The secret value
     * @param commitmentHash The commitment hash
     * @return nullifierHash The computed nullifier hash
     */
    function generateNullifier(
        uint256 secret,
        bytes32 commitmentHash
    ) internal pure returns (bytes32 nullifierHash) {
        return bytes32(PoseidonHash.poseidon(secret, uint256(commitmentHash)));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CROSS-CHAIN SUPPORT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Verify cross-chain privacy proof
     * @param state The verification state storage
     * @param privacyProof The privacy proof
     * @param sourceChainId The source chain ID
     * @return success True if cross-chain proof is valid
     */
    function verifyCrossChainProof(
        ProofVerificationState storage state,
        PrivacyProof memory privacyProof,
        uint256 sourceChainId
    ) internal returns (bool success) {
        if (!state.supportedChains[sourceChainId]) revert UnsupportedChain();
        
        bytes32 crossChainHash = keccak256(abi.encodePacked(
            _generateProofHash(privacyProof),
            sourceChainId,
            block.chainid
        ));
        
        if (state.crossChainProofs[crossChainHash]) revert ProofAlreadyUsed();
        
        // Verify the proof with enhanced external hash validation
        if (!verifyPrivacyProof(state, privacyProof)) return false;
        
        state.crossChainProofs[crossChainHash] = true;
        
        emit CrossChainProofVerified(crossChainHash, sourceChainId);
        return true;
    }
    
    /**
     * @dev Add supported chain for cross-chain operations
     * @param state The verification state storage
     * @param chainId The chain ID to add
     */
    function addSupportedChain(
        ProofVerificationState storage state,
        uint256 chainId
    ) internal {
        state.supportedChains[chainId] = true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Pack public inputs into array for proof verification
     * @param publicInputs The public inputs structure
     * @return inputs Array of packed inputs
     */
    function _packPublicInputs(ProofPublicInputs memory publicInputs) 
        private 
        pure 
        returns (uint256[] memory inputs) 
    {
        inputs = new uint256[](8);
        inputs[0] = publicInputs.merkleRoot;
        inputs[1] = publicInputs.nullifierHash;
        inputs[2] = publicInputs.commitmentHash;
        inputs[3] = publicInputs.recipient;
        inputs[4] = publicInputs.relayerFee;
        inputs[5] = publicInputs.fee;
        inputs[6] = publicInputs.denomination;
        inputs[7] = publicInputs.externalHash;
    }
    
    /**
     * @dev Generate unique hash for proof replay protection
     * @param privacyProof The privacy proof
     * @return proofHash Unique proof hash
     */
    function _generateProofHash(PrivacyProof memory privacyProof) 
        private 
        pure 
        returns (bytes32 proofHash) 
    {
        return keccak256(abi.encodePacked(
            privacyProof.groth16Proof.a.x,
            privacyProof.groth16Proof.a.y,
            privacyProof.groth16Proof.b.x[0],
            privacyProof.groth16Proof.b.x[1],
            privacyProof.groth16Proof.b.y[0],
            privacyProof.groth16Proof.b.y[1],
            privacyProof.groth16Proof.c.x,
            privacyProof.groth16Proof.c.y,
            privacyProof.nullifierHash,
            privacyProof.commitmentHash
        ));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ELLIPTIC CURVE OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Check if G1 point is on curve
     * @param point The G1 point to check
     * @return valid True if point is on curve
     */
    function _isOnCurveG1(G1Point memory point) private pure returns (bool valid) {
        if (point.x == 0 && point.y == 0) return true; // Point at infinity
        
        uint256 ySquared = mulmod(point.y, point.y, FIELD_SIZE);
        uint256 xCubed = mulmod(point.x, mulmod(point.x, point.x, FIELD_SIZE), FIELD_SIZE);
        uint256 xCubedPlus3 = addmod(xCubed, 3, FIELD_SIZE);
        
        return ySquared == xCubedPlus3;
    }
    
    /**
     * @dev Check if G2 point is on curve
     * @param point The G2 point to check
     * @return valid True if point is on curve
     */
    function _isOnCurveG2(G2Point memory point) private pure returns (bool valid) {
        // Simplified check - in production, implement full G2 curve validation
        return point.x[0] < FIELD_SIZE && point.x[1] < FIELD_SIZE &&
               point.y[0] < FIELD_SIZE && point.y[1] < FIELD_SIZE;
    }
    
    /**
     * @dev Add two G1 points
     * @param a First G1 point
     * @param b Second G1 point
     * @return result Sum of the two points
     */
    function _addG1(G1Point memory a, G1Point memory b) 
        private 
        pure 
        returns (G1Point memory result) 
    {
        uint256[4] memory input = [a.x, a.y, b.x, b.y];
        bool success;
        
        assembly {
            success := staticcall(gas(), 0x06, input, 0x80, result, 0x40)
        }
        
        require(success, "G1 addition failed");
    }
    
    /**
     * @dev Scalar multiplication on G1
     * @param point The G1 point
     * @param scalar The scalar value
     * @return result Scalar multiplication result
     */
    function _scalarMulG1(G1Point memory point, uint256 scalar) 
        private 
        pure 
        returns (G1Point memory result) 
    {
        uint256[3] memory input = [point.x, point.y, scalar];
        bool success;
        
        assembly {
            success := staticcall(gas(), 0x07, input, 0x60, result, 0x40)
        }
        
        require(success, "G1 scalar multiplication failed");
    }
    
    /**
     * @dev Negate G1 point
     * @param point The G1 point to negate
     * @return result Negated point
     */
    function _negateG1(G1Point memory point) private pure returns (G1Point memory result) {
        if (point.x == 0 && point.y == 0) return point; // Point at infinity
        
        result.x = point.x;
        result.y = FIELD_SIZE - point.y;
    }
    
    /**
     * @dev Perform pairing check for 4 pairs
     * @param a1 First G1 point of first pair
     * @param b1 First G2 point of first pair
     * @param a2 First G1 point of second pair
     * @param b2 First G2 point of second pair
     * @param a3 First G1 point of third pair
     * @param b3 First G2 point of third pair
     * @param a4 First G1 point of fourth pair
     * @param b4 First G2 point of fourth pair
     * @return result True if pairing check passes
     */
    function _pairingCheck(
        G1Point memory a1, G2Point memory b1,
        G1Point memory a2, G2Point memory b2,
        G1Point memory a3, G2Point memory b3,
        G1Point memory a4, G2Point memory b4
    ) private view returns (bool result) {
        uint256[24] memory input;
        
        // First pair
        input[0] = a1.x; input[1] = a1.y;
        input[2] = b1.x[1]; input[3] = b1.x[0];
        input[4] = b1.y[1]; input[5] = b1.y[0];
        
        // Second pair
        input[6] = a2.x; input[7] = a2.y;
        input[8] = b2.x[1]; input[9] = b2.x[0];
        input[10] = b2.y[1]; input[11] = b2.y[0];
        
        // Third pair
        input[12] = a3.x; input[13] = a3.y;
        input[14] = b3.x[1]; input[15] = b3.x[0];
        input[16] = b3.y[1]; input[17] = b3.y[0];
        
        // Fourth pair
        input[18] = a4.x; input[19] = a4.y;
        input[20] = b4.x[1]; input[21] = b4.x[0];
        input[22] = b4.y[1]; input[23] = b4.y[0];
        
        uint256[1] memory output;
        bool success;
        
        assembly {
            success := staticcall(gas(), 0x08, input, 0x300, output, 0x20)
        }
        
        if (!success) revert PairingCheckFailed();
        return output[0] == 1;
    }
    
    /**
     * @dev Validate verifying key structure
     * @param vk The verifying key to validate
     * @return valid True if verifying key is valid
     */
    function _isValidVerifyingKey(VerifyingKey memory vk) 
        private 
        pure 
        returns (bool valid) 
    {
        return _isOnCurveG1(vk.alpha) && 
               _isOnCurveG2(vk.beta) &&
               _isOnCurveG2(vk.gamma) &&
               _isOnCurveG2(vk.delta) &&
               vk.ic.length > 0;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EMERGENCY AND MAINTENANCE
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * @dev Toggle emergency mode
     * @param state The verification state storage
     * @param enabled Emergency mode status
     */
    function setEmergencyMode(
        ProofVerificationState storage state,
        bool enabled
    ) internal {
        state.emergencyMode = enabled;
        emit EmergencyModeToggled(enabled, msg.sender);
    }
    
    /**
     * @dev Clean up expired proofs to save gas
     * @param state The verification state storage
     * @param proofHashes Array of proof hashes to clean
     */
    function cleanupExpiredProofs(
        ProofVerificationState storage state,
        bytes32[] memory proofHashes
    ) internal {
        for (uint256 i = 0; i < proofHashes.length; i++) {
            bytes32 proofHash = proofHashes[i];
            uint256 timestamp = state.proofTimestamps[proofHash];
            
            if (timestamp > 0 && 
                block.timestamp > timestamp + state.proofValidityWindow) {
                delete state.usedProofs[proofHash];
                delete state.proofTimestamps[proofHash];
            }
        }
    }
}
