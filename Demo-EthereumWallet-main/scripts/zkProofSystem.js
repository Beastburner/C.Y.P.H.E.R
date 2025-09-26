const path = require('path');
const fs = require('fs');
const circomlib = require('circomlib');
const snarkjs = require('snarkjs');
const crypto = require('crypto');

/**
 * @title Circuit Builder and Proof Generator
 * @dev Utilities for building circuits and generating zero-knowledge proofs
 * @notice This module provides functions to:
 *         - Compile Circom circuits
 *         - Generate proving and verification keys
 *         - Create proofs for deposits and withdrawals
 *         - Verify proofs
 */

class ZKProofSystem {
    constructor() {
        this.circuits = new Map();
        this.keys = new Map();
        this.circuitPath = path.join(__dirname, '../circuits');
        this.buildPath = path.join(__dirname, '../build/circuits');
        
        // Ensure build directory exists
        if (!fs.existsSync(this.buildPath)) {
            fs.mkdirSync(this.buildPath, { recursive: true });
        }
    }

    /**
     * @dev Compile a Circom circuit
     * @param {string} circuitName - Name of the circuit file (without .circom)
     * @param {number} levels - Tree levels for Merkle circuits
     * @returns {Promise<boolean>} Success status
     */
    async compileCircuit(circuitName, levels = 20) {
        try {
            console.log(`Compiling circuit: ${circuitName}`);
            
            const circuitPath = path.join(this.circuitPath, `${circuitName}.circom`);
            const outputPath = path.join(this.buildPath, circuitName);
            
            if (!fs.existsSync(circuitPath)) {
                throw new Error(`Circuit file not found: ${circuitPath}`);
            }

            // Compile circuit using circom
            const { exec } = require('child_process');
            const compileCommand = `circom ${circuitPath} --r1cs --wasm --sym -o ${outputPath}`;
            
            await new Promise((resolve, reject) => {
                exec(compileCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Circuit compilation error:', error);
                        reject(error);
                    } else {
                        console.log('Circuit compiled successfully');
                        console.log(stdout);
                        resolve();
                    }
                });
            });

            this.circuits.set(circuitName, {
                r1cs: path.join(outputPath, `${circuitName}.r1cs`),
                wasm: path.join(outputPath, `${circuitName}_js`, `${circuitName}.wasm`),
                sym: path.join(outputPath, `${circuitName}.sym`),
                levels: levels
            });

            return true;
        } catch (error) {
            console.error(`Failed to compile circuit ${circuitName}:`, error);
            return false;
        }
    }

    /**
     * @dev Generate proving and verification keys using Powers of Tau ceremony
     * @param {string} circuitName - Name of the circuit
     * @returns {Promise<Object>} Key generation result
     */
    async generateKeys(circuitName) {
        try {
            console.log(`Generating keys for circuit: ${circuitName}`);
            
            const circuit = this.circuits.get(circuitName);
            if (!circuit) {
                throw new Error(`Circuit ${circuitName} not found. Compile it first.`);
            }

            const ptauPath = path.join(this.buildPath, 'powersOfTau28_hez_final_15.ptau');
            const zkeyPath = path.join(this.buildPath, `${circuitName}.zkey`);
            const vkeyPath = path.join(this.buildPath, `${circuitName}_verification_key.json`);

            // Download Powers of Tau if not exists
            if (!fs.existsSync(ptauPath)) {
                console.log('Downloading Powers of Tau ceremony file...');
                // In production, download from trusted source
                // For now, generate a smaller ceremony file
                await this.generatePowerOfTau(ptauPath);
            }

            // Generate zkey
            console.log('Generating zkey...');
            await snarkjs.zKey.newZKey(circuit.r1cs, ptauPath, zkeyPath);

            // Export verification key
            console.log('Exporting verification key...');
            const vKey = await snarkjs.zKey.exportVerificationKey(zkeyPath);
            fs.writeFileSync(vkeyPath, JSON.stringify(vKey, null, 2));

            this.keys.set(circuitName, {
                zkey: zkeyPath,
                vkey: vkeyPath,
                verificationKey: vKey
            });

            console.log(`Keys generated successfully for ${circuitName}`);
            return { success: true, zkeyPath, vkeyPath };

        } catch (error) {
            console.error(`Failed to generate keys for ${circuitName}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * @dev Generate a small Powers of Tau ceremony for testing
     * @param {string} outputPath - Output path for ptau file
     * @returns {Promise<void>}
     */
    async generatePowerOfTau(outputPath) {
        try {
            console.log('Generating Powers of Tau ceremony...');
            
            // Start new ceremony
            await snarkjs.powersOfTau.newAccumulator(
                curve.bn128,
                15, // 2^15 constraints
                outputPath + '.tmp'
            );

            // Contribute to ceremony
            await snarkjs.powersOfTau.contribute(
                outputPath + '.tmp',
                outputPath,
                'test contribution',
                crypto.randomBytes(32)
            );

            // Clean up temporary file
            if (fs.existsSync(outputPath + '.tmp')) {
                fs.unlinkSync(outputPath + '.tmp');
            }

            console.log('Powers of Tau ceremony generated');
        } catch (error) {
            console.error('Failed to generate Powers of Tau:', error);
            throw error;
        }
    }

    /**
     * @dev Generate a withdrawal proof
     * @param {Object} inputs - Proof inputs
     * @returns {Promise<Object>} Proof and public signals
     */
    async generateWithdrawalProof(inputs) {
        try {
            const {
                secret,
                nullifier,
                amount,
                pathElements,
                pathIndices,
                merkleRoot,
                recipient
            } = inputs;

            // Validate inputs
            if (!secret || !nullifier || !amount || !pathElements || !pathIndices || !merkleRoot || !recipient) {
                throw new Error('Missing required inputs for withdrawal proof');
            }

            // Generate nullifier hash
            const nullifierHash = this.poseidonHash([secret, nullifier, merkleRoot]);

            // Prepare circuit inputs
            const circuitInputs = {
                secret: secret,
                nullifier: nullifier,
                pathElements: pathElements,
                pathIndices: pathIndices,
                amount: amount,
                merkleRoot: merkleRoot,
                nullifierHash: nullifierHash,
                recipient: recipient,
                withdrawAmount: amount
            };

            // Generate witness
            const circuit = this.circuits.get('withdraw');
            if (!circuit) {
                throw new Error('Withdraw circuit not compiled');
            }

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInputs,
                circuit.wasm,
                this.keys.get('withdraw').zkey
            );

            return {
                success: true,
                proof: this.formatProofForSolidity(proof),
                publicSignals: publicSignals,
                nullifierHash: nullifierHash
            };

        } catch (error) {
            console.error('Failed to generate withdrawal proof:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * @dev Generate a deposit proof
     * @param {Object} inputs - Proof inputs
     * @returns {Promise<Object>} Proof and public signals
     */
    async generateDepositProof(inputs) {
        try {
            const { secret, nullifier, amount } = inputs;

            // Validate inputs
            if (!secret || !nullifier || !amount) {
                throw new Error('Missing required inputs for deposit proof');
            }

            // Generate commitment
            const commitment = this.poseidonHash([secret, nullifier, amount]);

            // Prepare circuit inputs
            const circuitInputs = {
                secret: secret,
                nullifier: nullifier,
                amount: amount,
                commitment: commitment,
                depositAmount: amount
            };

            // Generate witness
            const circuit = this.circuits.get('deposit');
            if (!circuit) {
                throw new Error('Deposit circuit not compiled');
            }

            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                circuitInputs,
                circuit.wasm,
                this.keys.get('deposit').zkey
            );

            return {
                success: true,
                proof: this.formatProofForSolidity(proof),
                publicSignals: publicSignals,
                commitment: commitment
            };

        } catch (error) {
            console.error('Failed to generate deposit proof:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * @dev Verify a proof
     * @param {Array} proof - The proof array
     * @param {Array} publicSignals - Public signals
     * @param {string} circuitName - Circuit name
     * @returns {Promise<boolean>} Verification result
     */
    async verifyProof(proof, publicSignals, circuitName) {
        try {
            const keys = this.keys.get(circuitName);
            if (!keys) {
                throw new Error(`Keys for circuit ${circuitName} not found`);
            }

            const formattedProof = this.formatProofFromSolidity(proof);
            const result = await snarkjs.groth16.verify(
                keys.verificationKey,
                publicSignals,
                formattedProof
            );

            return result;
        } catch (error) {
            console.error('Failed to verify proof:', error);
            return false;
        }
    }

    /**
     * @dev Format proof for Solidity contract
     * @param {Object} proof - snarkjs proof object
     * @returns {Array} Formatted proof array
     */
    formatProofForSolidity(proof) {
        return [
            proof.pi_a[0], proof.pi_a[1],
            proof.pi_b[0][1], proof.pi_b[0][0],
            proof.pi_b[1][1], proof.pi_b[1][0],
            proof.pi_c[0], proof.pi_c[1]
        ];
    }

    /**
     * @dev Format proof from Solidity format
     * @param {Array} solidityProof - Proof array from Solidity
     * @returns {Object} snarkjs proof object
     */
    formatProofFromSolidity(solidityProof) {
        return {
            pi_a: [solidityProof[0], solidityProof[1], "1"],
            pi_b: [
                [solidityProof[3], solidityProof[2]],
                [solidityProof[5], solidityProof[4]],
                ["1", "0"]
            ],
            pi_c: [solidityProof[6], solidityProof[7], "1"]
        };
    }

    /**
     * @dev Compute Poseidon hash
     * @param {Array} inputs - Array of inputs to hash
     * @returns {string} Hash result
     */
    poseidonHash(inputs) {
        // Use circomlib's Poseidon implementation
        const poseidon = circomlib.poseidon;
        return poseidon(inputs).toString();
    }

    /**
     * @dev Generate random field element
     * @returns {string} Random field element
     */
    randomFieldElement() {
        const randomBytes = crypto.randomBytes(32);
        const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
        const randomBigInt = BigInt('0x' + randomBytes.toString('hex'));
        return (randomBigInt % fieldSize).toString();
    }

    /**
     * @dev Create commitment
     * @param {string} secret - Secret value
     * @param {string} nullifier - Nullifier value
     * @param {string} amount - Amount value
     * @returns {string} Commitment hash
     */
    createCommitment(secret, nullifier, amount) {
        return this.poseidonHash([secret, nullifier, amount]);
    }

    /**
     * @dev Create nullifier hash
     * @param {string} secret - Secret value
     * @param {string} nullifier - Nullifier value
     * @param {string} merkleRoot - Merkle root
     * @returns {string} Nullifier hash
     */
    createNullifierHash(secret, nullifier, merkleRoot) {
        return this.poseidonHash([secret, nullifier, merkleRoot]);
    }

    /**
     * @dev Get circuit info
     * @param {string} circuitName - Circuit name
     * @returns {Object} Circuit information
     */
    getCircuitInfo(circuitName) {
        return {
            circuit: this.circuits.get(circuitName),
            keys: this.keys.get(circuitName)
        };
    }

    /**
     * @dev List available circuits
     * @returns {Array} Array of circuit names
     */
    listCircuits() {
        return Array.from(this.circuits.keys());
    }

    /**
     * @dev Initialize the proof system with default circuits
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing ZK proof system...');
            
            // Compile main circuits
            await this.compileCircuit('withdraw', 20);
            await this.compileCircuit('deposit');
            
            // Generate keys
            await this.generateKeys('withdraw');
            await this.generateKeys('deposit');
            
            console.log('ZK proof system initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ZK proof system:', error);
            throw error;
        }
    }
}

module.exports = {
    ZKProofSystem
};
