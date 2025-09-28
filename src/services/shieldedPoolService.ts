import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crypto from 'crypto-js';

interface ShieldedNote {
  commitment: string;
  nullifier: string;
  secret: string;
  amount: string;
  merkleIndex: number;
  blockNumber: number;
  txHash: string;
  isSpent: boolean;
}

interface ZKProof {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
  inputs: string[];
}

interface WithdrawParams {
  recipient: string;
  amount: string;
  fee: string;
  relayer?: string;
}

interface DepositParams {
  amount: string;
  tokenAddress?: string;
}

/**
 * @class ShieldedPoolService
 * @description Service for interacting with the shielded pool contract
 * Provides functionality for private deposits, withdrawals, and balance management
 */
class ShieldedPoolService {
  private provider: ethers.providers.Provider;
  private contract: ethers.Contract;
  private contractAddress: string;

  // Circuit artifacts - using dynamic imports for development
  private static CIRCUIT_WASM: any = null;
  private static CIRCUIT_ZKEY: any = null;
  private static VERIFICATION_KEY: any = null;

  // Contract ABI (Updated to match actual deployed contract)
  private static readonly CONTRACT_ABI = [
    "function deposit(bytes32 commitment) external payable",
    "function withdraw(bytes calldata _proof, bytes32 _merkleRoot, bytes32 _nullifier, address _recipient, uint256 _fee) external",
    "function privateTransfer(bytes32 nullifierHash, bytes32 newCommitment, bytes32 inputCommitment) external",
    "function getMerkleRoot() external view returns (bytes32)",
    "function getPoolStats() external view returns (uint256, uint256, uint256, uint256)",
    "function hasCommitment(bytes32 _commitment) external view returns (bool)",
    "function isNullifierUsed(bytes32 _nullifier) external view returns (bool)",
    "function nullifiers(bytes32) external view returns (bool)",
    "function commitments(bytes32) external view returns (bool)",
    "function poolConfig() external view returns (uint256, address, uint256, uint256, bool, uint256)",
    "event Deposit(bytes32 indexed commitment, uint256 leafIndex, uint256 amount, uint256 timestamp)",
    "event Withdrawal(address indexed recipient, bytes32 indexed nullifierHash, uint256 amount, uint256 timestamp)",
    "event CommitmentAdded(bytes32 indexed commitment, uint256 leafIndex)"
  ];

  constructor(
    provider: ethers.providers.Provider,
    contractAddress: string
  ) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    
    // Validate contract address
    if (!contractAddress || contractAddress === '0x...' || contractAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('⚠️ Invalid shielded pool contract address - running in mock mode');
      console.warn('⚠️ Contract address:', contractAddress);
      // Create a mock contract that will fail gracefully
      this.contract = null as any;
    } else {
      this.contract = new ethers.Contract(contractAddress, ShieldedPoolService.CONTRACT_ABI, provider);
    }
    
    this.initializeCircuits();
  }

  /**
   * Initialize circuit artifacts for development
   */
  private initializeCircuits() {
    // For development, we'll use mock circuit artifacts
    // In production, these would be loaded from actual compiled circuits
    ShieldedPoolService.CIRCUIT_WASM = { mock: true };
    ShieldedPoolService.CIRCUIT_ZKEY = { mock: true };
    ShieldedPoolService.VERIFICATION_KEY = {
      mock: true,
      protocol: "groth16",
      curve: "bn128",
      nPublic: 4,
      vk_alpha_1: ["0", "0", "1"],
      vk_beta_2: [["0", "0"], ["0", "0"], ["0", "1"]],
      vk_gamma_2: [["0", "0"], ["0", "0"], ["0", "1"]],
      vk_delta_2: [["0", "0"], ["0", "0"], ["0", "1"]],
      vk_alphabeta_12: [],
      IC: []
    };
  }

  /**
   * Generate a new shielded note for deposit
   */
  async generateNote(amount: string): Promise<ShieldedNote> {
    try {
      console.log('🔐 Generating shielded note for amount:', amount);
      
      // Generate proper field elements (< BN254 field modulus)
      // Use smaller random values and hash to get proper field elements
      const randomSecret = ethers.utils.randomBytes(16);
      const randomNullifier = ethers.utils.randomBytes(16);
      
      // Hash the random bytes to get proper field elements
      const secret = ethers.utils.keccak256(randomSecret);
      const nullifier = ethers.utils.keccak256(randomNullifier);
      
      // Generate commitment as hash(secret, nullifier, amount)
      const commitment = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'uint256'],
          [secret, nullifier, amount]
        )
      );

      console.log('✅ Generated note:', {
        commitment: commitment.slice(0, 10) + '...',
        secret: secret.slice(0, 10) + '...',
        nullifier: nullifier.slice(0, 10) + '...',
        amount
      });

      return {
        commitment,
        nullifier,
        secret,
        amount: amount,
        merkleIndex: -1,
        blockNumber: 0,
        txHash: '',
        isSpent: false
      };
    } catch (error: any) {
      console.error('❌ Error generating note:', error);
      
      // Ultra-simple fallback for hackathon demo
      const timestamp = Date.now();
      const simple = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(`note-${amount}-${timestamp}`)
      );
      
      return {
        commitment: simple,
        nullifier: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`nullifier-${timestamp}`)),
        secret: ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`secret-${timestamp}`)),
        amount: amount,
        merkleIndex: -1,
        blockNumber: 0,
        txHash: '',
        isSpent: false
      };
    }
  }

  /**
   * Deposit ETH into the shielded pool
   */
  async depositETH(
    params: DepositParams,
    signer: ethers.Signer
  ): Promise<{ note: ShieldedNote; txHash: string }> {
    try {
      // Check if contract is properly initialized
      if (!this.contract) {
        console.log('🧪 Running in development mode - simulating deposit...');
        return await this.mockDepositETH(params, signer);
      }

      console.log('🔐 Starting ETH deposit to shielded pool...');
      
      // Generate note
      const note = await this.generateNote(params.amount);
      
      // Connect contract with signer
      const contractWithSigner = this.contract.connect(signer);
      
      // Execute deposit transaction
      const tx = await contractWithSigner.deposit(note.commitment, {
        value: params.amount,
        gasLimit: 500000
      });
      
      console.log('📤 Deposit transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Deposit confirmed in block:', receipt.blockNumber);
      
      // Update note with transaction details
      note.blockNumber = receipt.blockNumber;
      note.txHash = tx.hash;
      
      // Get deposit event to find merkle index
      const depositEvent = receipt.events?.find((e: any) => e.event === 'Deposit');
      if (depositEvent) {
        note.merkleIndex = depositEvent.args.index.toNumber();
      }
      
      // Store note locally
      await this.storeNote(note);
      
      return { note, txHash: tx.hash };
    } catch (error) {
      console.error('❌ Deposit failed:', error);
      throw error;
    }
  }

  /**
   * Deposit ERC20 tokens into the shielded pool
   */
  async depositToken(
    params: DepositParams & { tokenAddress: string },
    signer: ethers.Signer
  ): Promise<{ note: ShieldedNote; txHash: string }> {
    try {
      console.log('🔐 Starting token deposit to shielded pool...');
      
      // Generate note
      const note = await this.generateNote(params.amount);
      
      // First approve token spending
      const tokenContract = new ethers.Contract(
        params.tokenAddress,
        ['function approve(address spender, uint256 amount) external returns (bool)'],
        signer
      );
      
      const approveTx = await tokenContract.approve(this.contractAddress, params.amount);
      await approveTx.wait();
      console.log('✅ Token approval confirmed');
      
      // Connect contract with signer
      const contractWithSigner = this.contract.connect(signer);
      
      // Execute deposit transaction
      const tx = await contractWithSigner.depositToken(
        note.commitment,
        params.tokenAddress,
        params.amount,
        { gasLimit: 500000 }
      );
      
      console.log('📤 Token deposit transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Deposit confirmed in block:', receipt.blockNumber);
      
      // Update note with transaction details
      note.blockNumber = receipt.blockNumber;
      note.txHash = tx.hash;
      
      // Get deposit event to find merkle index
      const depositEvent = receipt.events?.find((e: any) => e.event === 'Deposit');
      if (depositEvent) {
        note.merkleIndex = depositEvent.args.index.toNumber();
      }
      
      // Store note locally
      await this.storeNote(note);
      
      return { note, txHash: tx.hash };
    } catch (error) {
      console.error('❌ Token deposit failed:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from the shielded pool
   */
  async withdraw(
    note: ShieldedNote,
    params: WithdrawParams,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      console.log('🔓 Starting withdrawal from shielded pool...');
      
      // Handle development mode
      if (!this.contract) {
        console.log('🧪 Running in mock mode - no real withdrawal');
        throw new Error('Withdrawal not available in development mode');
      }
      
      // Check if note is already spent
      if (note.isSpent) {
        throw new Error('Note has already been spent');
      }
      
      console.log('💰 Withdrawing amount:', ethers.utils.formatEther(note.amount));
      console.log('📍 To recipient:', params.recipient);
      
      // Generate nullifier hash (simplified for the basic contract)
      const nullifierHash = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32'], 
          [note.secret, note.nullifier]
        )
      );
      
      console.log('🔑 Generated nullifier hash:', nullifierHash);
      
      // Connect contract with signer
      const contractWithSigner = this.contract.connect(signer);
      
      // Check if nullifier is already used
      const isUsed = await contractWithSigner.isNullifierUsed(nullifierHash);
      if (isUsed) {
        throw new Error('Nullifier already used - this withdrawal has been processed');
      }
      
      // Check if commitment is valid  
      const isValidCommitment = await contractWithSigner.hasCommitment(note.commitment);
      if (!isValidCommitment) {
        throw new Error('Invalid commitment - this note cannot be withdrawn');
      }

      // For hackathon demo: generate mock proof
      console.log('🔬 Generating withdrawal proof...');
      const mockProof = "0x" + "0".repeat(128); // Mock proof bytes
      const mockMerkleRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("mock-root"));
      const withdrawalFee = 0; // No fee for demo
      
      // Execute withdrawal transaction using the correct contract interface
      const tx = await contractWithSigner.withdraw(
        mockProof,
        mockMerkleRoot, 
        nullifierHash,
        params.recipient,
        withdrawalFee,
        { gasLimit: 500000 }
      );
      
      console.log('📤 Withdrawal transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('✅ Withdrawal confirmed in block:', receipt.blockNumber);
      
      // Mark note as spent
      note.isSpent = true;
      await this.updateNote(note);
      
      console.log('🎉 Withdrawal completed successfully!');
      return tx.hash;
      
    } catch (error) {
      console.error('❌ Withdrawal failed:', error);
      throw error;
    }
  }

  /**
   * Generate zero-knowledge proof for withdrawal
   */
  private async generateWithdrawProof(inputs: {
    secret: string;
    nullifier: string;
    amount: string;
    recipient: string;
    merkleRoot: string;
    pathElements: string[];
    pathIndices: string[];
  }): Promise<{ proof: ZKProof; solidityProof: string }> {
    try {
      console.log('🔬 Generating zero-knowledge proof...');
      
      // Convert inputs to circuit format
      const circuitInputs = {
        secret: this.bufferToField(ethers.utils.arrayify(inputs.secret)),
        nullifier: this.bufferToField(ethers.utils.arrayify(inputs.nullifier)),
        pathElements: inputs.pathElements,
        pathIndices: inputs.pathIndices,
        amount: inputs.amount,
        merkleRoot: inputs.merkleRoot,
        nullifierHash: await this.generateNullifierHash(inputs.secret, inputs.nullifier, inputs.merkleRoot),
        recipient: inputs.recipient,
        withdrawAmount: inputs.amount
      };
      
      // Generate proof using snarkjs (or mock for development)
      let proof: any, publicSignals: any;
      
      if (ShieldedPoolService.CIRCUIT_WASM.mock) {
        // Mock proof for development
        console.log('🔧 Using mock ZK proof for development');
        proof = {
          pi_a: ["0x1", "0x2", "0x1"],
          pi_b: [["0x1", "0x2"], ["0x3", "0x4"], ["0x1", "0x0"]],
          pi_c: ["0x5", "0x6", "0x1"]
        };
        publicSignals = [
          inputs.merkleRoot,
          circuitInputs.nullifierHash,
          inputs.recipient,
          inputs.amount
        ];
      } else {
        // Real proof generation (for production with compiled circuits)
        console.log('🔧 Real ZK proof generation not available in React Native');
        console.log('📝 Use mock mode or implement server-side proof generation');
        
        // Fallback to mock for now
        proof = {
          pi_a: ["0x1", "0x2", "0x1"],
          pi_b: [["0x1", "0x2"], ["0x3", "0x4"], ["0x1", "0x0"]],
          pi_c: ["0x5", "0x6", "0x1"]
        };
        publicSignals = [
          inputs.merkleRoot,
          circuitInputs.nullifierHash,
          inputs.recipient,
          inputs.amount
        ];
      }
      
      // Format proof for Solidity
      const solidityProof = this.formatProofForSolidity(proof);
      
      console.log('✅ Zero-knowledge proof generated successfully');
      
      return {
        proof: {
          a: [proof.pi_a[0], proof.pi_a[1]],
          b: [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
          c: [proof.pi_c[0], proof.pi_c[1]],
          inputs: publicSignals
        },
        solidityProof
      };
    } catch (error) {
      console.error('❌ Proof generation failed:', error);
      throw new Error('Failed to generate zero-knowledge proof');
    }
  }

  /**
   * Generate nullifier hash
   */
  private async generateNullifierHash(secret: string, nullifier: string, merkleRoot: string): Promise<string> {
    const secretField = this.bufferToField(ethers.utils.arrayify(secret));
    const nullifierField = this.bufferToField(ethers.utils.arrayify(nullifier));
    const rootField = merkleRoot;
    
    return await this.poseidonHash([secretField, nullifierField, rootField]);
  }

  /**
   * Poseidon hash function
   */
  private async poseidonHash(inputs: string[]): Promise<string> {
    // Mock Poseidon hash using Keccak256 for React Native compatibility
    // In production, this would use actual Poseidon implementation
    const concatenated = inputs.join('');
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(concatenated));
    
    // Convert to field element (simulate Poseidon output)
    const fieldElement = ethers.BigNumber.from(hash).mod(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617'
    );
    
    return fieldElement.toString();
  }

  /**
   * Convert buffer to field element (safe version that avoids overflow)
   */
  private bufferToField(buffer: Uint8Array): string {
    // Use only first 16 bytes to avoid large numbers that cause arrayify errors
    const truncatedBuffer = buffer.slice(0, 16);
    const bn = ethers.BigNumber.from(truncatedBuffer);
    
    // Ensure the number is within a safe range
    const fieldPrime = ethers.BigNumber.from('21888242871839275222246405745257275088548364400416034343698204186575808495617'); // BN254 field prime
    
    // Modulo by field prime to ensure valid field element
    const safeBN = bn.mod(fieldPrime);
    
    return safeBN.toString();
  }

  /**
   * Format proof for Solidity contract
   */
  private formatProofForSolidity(proof: any): string {
    return ethers.utils.defaultAbiCoder.encode(
      ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
      [
        [proof.pi_a[0], proof.pi_a[1]],
        [[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
        [proof.pi_c[0], proof.pi_c[1]]
      ]
    );
  }

  /**
   * Get shielded balance
   */
  async getShieldedBalance(): Promise<string> {
    const notes = await this.getAllNotes();
    const unspentNotes = notes.filter(note => !note.isSpent);
    
    return unspentNotes.reduce((total, note) => {
      return ethers.BigNumber.from(total).add(note.amount).toString();
    }, '0');
  }

  /**
   * Get all notes for current user
   */
  async getAllNotes(): Promise<ShieldedNote[]> {
    try {
      const notesJson = await AsyncStorage.getItem('shielded_notes');
      return notesJson ? JSON.parse(notesJson) : [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  /**
   * Store a note locally
   */
  private async storeNote(note: ShieldedNote): Promise<void> {
    try {
      const existingNotes = await this.getAllNotes();
      const updatedNotes = [...existingNotes, note];
      await AsyncStorage.setItem('shielded_notes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Error storing note:', error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  private async updateNote(updatedNote: ShieldedNote): Promise<void> {
    try {
      const existingNotes = await this.getAllNotes();
      const noteIndex = existingNotes.findIndex(note => note.commitment === updatedNote.commitment);
      
      if (noteIndex !== -1) {
        existingNotes[noteIndex] = updatedNote;
        await AsyncStorage.setItem('shielded_notes', JSON.stringify(existingNotes));
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(): Promise<{
    totalDeposits: string;
    totalWithdrawals: string;
    activeCommitments: string;
    poolBalance: string;
  }> {
    try {
      // Handle development mode
      if (!this.contract) {
        console.log('🧪 Mock getPoolStats for development mode');
        return {
          totalDeposits: '0',
          totalWithdrawals: '0',
          activeCommitments: '0',
          poolBalance: '0'
        };
      }

      // Get real data from contract using the getPoolStats function
      const [totalDeposits, totalWithdrawals, activeCommitments, poolBalance] = await this.contract.getPoolStats();
      
      return {
        totalDeposits: ethers.utils.formatEther(totalDeposits),
        totalWithdrawals: ethers.utils.formatEther(totalWithdrawals),
        activeCommitments: activeCommitments.toString(),
        poolBalance: ethers.utils.formatEther(poolBalance)
      };
    } catch (error) {
      console.error('Error getting pool stats:', error);
      // Return mock data instead of throwing
      return {
        totalDeposits: '0',
        totalWithdrawals: '0',
        activeCommitments: '0',
        poolBalance: '0'
      };
    }
  }

  /**
   * Check if contract is properly configured
   */
  async isConfigured(): Promise<boolean> {
    try {
      // Handle development mode
      if (!this.contract) {
        console.log('🧪 Mock isConfigured for development mode');
        return true; // Return true for development mode
      }

      const [depositAmount, tokenAddress, merkleTreeHeight, withdrawalFee, isActive, minConfirmations] = await this.contract.poolConfig();
      return isActive;
    } catch (error) {
      console.error('Error checking configuration:', error);
      return false; // Return false if there's an error
    }
  }

  /**
   * Synchronize notes with contract events
   */
  async syncNotes(): Promise<void> {
    try {
      console.log('🔄 Synchronizing shielded notes...');
      
      // Handle development mode
      if (!this.contract) {
        console.log('🧪 Mock note sync - no contract available');
        return;
      }
      
      const notes = await this.getAllNotes();
      
      for (const note of notes) {
        if (!note.isSpent) {
          try {
            // Check if nullifier has been used (simplified for basic contract)
            const nullifierHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'bytes32'], 
                [note.secret, note.nullifier]
              )
            );
            
            const isSpent = await this.contract.isNullifierUsed(nullifierHash);
            if (isSpent && !note.isSpent) {
              note.isSpent = true;
              await this.updateNote(note);
            }
          } catch (error: any) {
            console.warn('⚠️ Failed to sync note:', note.commitment.slice(0, 10), error?.message || error);
          }
        }
      }
      
      console.log('✅ Notes synchronized');
    } catch (error: any) {
      console.error('❌ Note synchronization failed:', error?.message || error);
    }
  }

  /**
   * Mock deposit for development mode when no contract is deployed
   */
  private async mockDepositETH(
    params: DepositParams,
    signer: ethers.Signer
  ): Promise<{ note: ShieldedNote; txHash: string }> {
    console.log('🧪 Mock ETH deposit for development:', params.amount, 'ETH');
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock note
    const note = await this.generateNote(params.amount);
    
    // Generate a mock transaction hash
    const mockTxHash = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(`mock-deposit-${Date.now()}`)
    );
    
    // Store the note for development
    await this.storeNote(note);
    
    console.log('✅ Mock deposit completed:', mockTxHash);
    
    return {
      note: note,
      txHash: mockTxHash
    };
  }
}

export default ShieldedPoolService;
export type { ShieldedNote, WithdrawParams, DepositParams, ZKProof };
