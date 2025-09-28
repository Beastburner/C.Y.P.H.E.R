// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ZKUtils
 * @dev Utility library for zero-knowledge proof operations
 * @notice Provides helper functions for proof verification, nullifier generation,
 *         and commitment creation used in shielded pool operations
 */
library ZKUtils {
    
    // Field size for BN254 curve used in most ZK systems
    uint256 constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    // Maximum value for a field element
    uint256 constant MAX_FIELD_ELEMENT = FIELD_SIZE - 1;

    /**
     * @dev Generate a commitment hash
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param amount The amount being committed
     * @return The commitment hash
     */
    function generateCommitment(
        bytes32 secret,
        bytes32 nullifier,
        uint256 amount
    ) internal pure returns (bytes32) {
        require(amount <= MAX_FIELD_ELEMENT, "Amount too large");
        
        // In production, this would use Poseidon hash
        return keccak256(abi.encodePacked(secret, nullifier, amount));
    }

    /**
     * @dev Generate a nullifier hash
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param merkleRoot The Merkle root
     * @return The nullifier hash
     */
    function generateNullifierHash(
        bytes32 secret,
        bytes32 nullifier,
        bytes32 merkleRoot
    ) internal pure returns (bytes32) {
        // In production, this would use Poseidon hash
        return keccak256(abi.encodePacked(secret, nullifier, merkleRoot));
    }

    /**
     * @dev Validate that a value is within the field
     * @param value The value to validate
     * @return True if the value is valid
     */
    function isValidFieldElement(uint256 value) internal pure returns (bool) {
        return value < FIELD_SIZE;
    }

    /**
     * @dev Convert bytes32 to field element
     * @param input The input bytes
     * @return The field element
     */
    function toFieldElement(bytes32 input) internal pure returns (uint256) {
        uint256 value = uint256(input);
        return value % FIELD_SIZE;
    }

    /**
     * @dev Pack proof elements for verification
     * @param proof The proof array
     * @return packed The packed proof data
     */
    function packProof(uint256[8] memory proof) internal pure returns (bytes memory) {
        return abi.encodePacked(
            proof[0], proof[1], proof[2], proof[3],
            proof[4], proof[5], proof[6], proof[7]
        );
    }

    /**
     * @dev Unpack proof elements from bytes
     * @param packedProof The packed proof data
     * @return proof The unpacked proof array
     */
    function unpackProof(bytes memory packedProof) internal pure returns (uint256[8] memory proof) {
        require(packedProof.length == 256, "Invalid proof length");
        
        for (uint i = 0; i < 8; i++) {
            assembly {
                proof := mload(add(add(packedProof, 0x20), mul(i, 0x20)))
            }
        }
    }

    /**
     * @dev Generate random field element (for testing purposes)
     * @param seed The seed value
     * @return Random field element
     */
    function randomFieldElement(bytes32 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao))) % FIELD_SIZE;
    }

    /**
     * @dev Verify basic proof structure
     * @param proof The proof to verify
     * @return True if the proof structure is valid
     */
    function isValidProofStructure(uint256[8] memory proof) internal pure returns (bool) {
        for (uint i = 0; i < 8; i++) {
            if (!isValidFieldElement(proof[i])) {
                return false;
            }
        }
        return true;
    }
}

/**
 * @title CommitmentUtils
 * @dev Utility library for commitment operations
 * @notice Provides functions for creating and managing commitments
 *         in the shielded pool system
 */
library CommitmentUtils {
    
    struct Commitment {
        bytes32 hash;
        uint256 amount;
        uint256 timestamp;
        bool spent;
    }

    /**
     * @dev Create a new commitment
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param amount The amount
     * @return The commitment struct
     */
    function createCommitment(
        bytes32 secret,
        bytes32 nullifier,
        uint256 amount
    ) internal view returns (Commitment memory) {
        bytes32 hash = ZKUtils.generateCommitment(secret, nullifier, amount);
        
        return Commitment({
            hash: hash,
            amount: amount,
            timestamp: block.timestamp,
            spent: false
        });
    }

    /**
     * @dev Verify commitment parameters
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param amount The amount
     * @return True if parameters are valid
     */
    function verifyCommitmentParameters(
        bytes32 secret,
        bytes32 nullifier,
        uint256 amount
    ) internal pure returns (bool) {
        return secret != bytes32(0) && 
               nullifier != bytes32(0) && 
               amount > 0 && 
               ZKUtils.isValidFieldElement(amount);
    }
}

/**
 * @title ProofUtils
 * @dev Utility library for proof operations
 * @notice Provides functions for proof validation and processing
 */
library ProofUtils {
    
    /**
     * @dev Validate withdrawal proof inputs
     * @param nullifierHash The nullifier hash
     * @param merkleRoot The Merkle root
     * @param recipient The recipient address
     * @param amount The withdrawal amount
     * @return True if inputs are valid
     */
    function validateWithdrawalInputs(
        bytes32 nullifierHash,
        bytes32 merkleRoot,
        address recipient,
        uint256 amount
    ) internal pure returns (bool) {
        return nullifierHash != bytes32(0) &&
               merkleRoot != bytes32(0) &&
               recipient != address(0) &&
               amount > 0 &&
               ZKUtils.isValidFieldElement(amount);
    }

    /**
     * @dev Extract public signals from proof
     * @return signals Array of public signals
     */
    function extractPublicSignals(bytes memory /* proof */) internal pure returns (uint256[] memory signals) {
        // This would extract public signals from the proof in a real implementation
        // For now, return empty array
        return new uint256[](0);
    }

    /**
     * @dev Verify proof format
     * @param proof The proof to verify
     * @return True if format is valid
     */
    function verifyProofFormat(uint256[8] memory proof) internal pure returns (bool) {
        return ZKUtils.isValidProofStructure(proof);
    }
}

/**
 * @title NullifierUtils
 * @dev Utility library for nullifier operations
 * @notice Provides functions for nullifier generation and management
 */
library NullifierUtils {
    
    /**
     * @dev Generate nullifier for withdrawal
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param merkleRoot The Merkle root
     * @return The nullifier hash
     */
    function generateWithdrawalNullifier(
        bytes32 secret,
        bytes32 nullifier,
        bytes32 merkleRoot
    ) internal pure returns (bytes32) {
        return ZKUtils.generateNullifierHash(secret, nullifier, merkleRoot);
    }

    /**
     * @dev Validate nullifier parameters
     * @param secret The secret value
     * @param nullifier The nullifier value
     * @param merkleRoot The Merkle root
     * @return True if parameters are valid
     */
    function validateNullifierParameters(
        bytes32 secret,
        bytes32 nullifier,
        bytes32 merkleRoot
    ) internal pure returns (bool) {
        return secret != bytes32(0) &&
               nullifier != bytes32(0) &&
               merkleRoot != bytes32(0);
    }
}

/**
 * @title PrivacyMath
 * @dev Mathematical utilities for privacy operations
 * @notice Provides cryptographic and mathematical functions
 *         used in zero-knowledge operations
 */
library PrivacyMath {
    
    /**
     * @dev Modular exponentiation
     * @param base The base
     * @param exponent The exponent
     * @param modulus The modulus
     * @return The result
     */
    function modExp(uint256 base, uint256 exponent, uint256 modulus) 
        internal 
        pure 
        returns (uint256) 
    {
        if (modulus == 1) return 0;
        
        uint256 result = 1;
        base = base % modulus;
        
        while (exponent > 0) {
            if (exponent % 2 == 1) {
                result = mulmod(result, base, modulus);
            }
            exponent = exponent >> 1;
            base = mulmod(base, base, modulus);
        }
        
        return result;
    }

    /**
     * @dev Calculate square root modulo p
     * @param a The value
     * @param p The prime modulus
     * @return The square root
     */
    function modSqrt(uint256 a, uint256 p) internal pure returns (uint256) {
        if (a == 0) return 0;
        
        // Tonelli-Shanks algorithm for p ≡ 3 (mod 4)
        if (p % 4 == 3) {
            return modExp(a, (p + 1) / 4, p);
        }
        
        // For other cases, would need full Tonelli-Shanks implementation
        revert("ModSqrt not implemented for this prime");
    }

    /**
     * @dev Check if value is quadratic residue
     * @param a The value
     * @param p The prime modulus
     * @return True if a is a quadratic residue mod p
     */
    function isQuadraticResidue(uint256 a, uint256 p) internal pure returns (bool) {
        if (a == 0) return true;
        return modExp(a, (p - 1) / 2, p) == 1;
    }

    /**
     * @dev Convert to Montgomery form
     * @param a The value
     * @param modulus The modulus
     * @return The Montgomery form
     */
    function toMontgomery(uint256 a, uint256 modulus) internal pure returns (uint256) {
        // Simplified Montgomery conversion - use R = 2^256
        uint256 r = type(uint256).max; // 2^256 - 1, approximation for 2^256
        return mulmod(a, r, modulus);
    }

    /**
     * @dev Convert from Montgomery form
     * @param a The Montgomery form value
     * @param modulus The modulus
     * @return The standard form
     */
    function fromMontgomery(uint256 a, uint256 modulus) internal pure returns (uint256) {
        // Simplified Montgomery conversion
        return a % modulus;
    }
}
