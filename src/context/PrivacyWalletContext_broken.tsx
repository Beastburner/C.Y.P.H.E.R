import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import crypto f// Helper functions - React Native compatible crypto
const generateSecret = (): string => {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
};

const generateCommitmentHash = (amount: string, secret: string, address: string): string => {
  const data = amount + secret + address;
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
};

const generateNullifierHash = (secret: string, commitment: string): string => {
  const data = secret + commitment;
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
};

// Contract ABIs (simplified for MVP)
const SHIELDED_POOL_ABI = [
  'function deposit(bytes32 commitment) external payable',
  'function withdraw(address payable recipient, bytes32 nullifierHash, uint256 amount, bytes32 commitment) external',
  'function privateTransfer(bytes32 nullifierHash, bytes32 newCommitment, bytes32 inputCommitment) external',
  'function getBalance() external view returns (uint256)',
  'function getCommitmentCount() external view returns (uint256)',
  'function isNullifierUsed(bytes32 nullifierHash) external view returns (bool)',
  'event Deposit(bytes32 indexed commitment, uint256 leafIndex, uint256 amount, uint256 timestamp)',
  'event Withdrawal(address indexed recipient, bytes32 indexed nullifierHash, uint256 amount, uint256 timestamp)',
  'event CommitmentAdded(bytes32 indexed commitment, uint256 leafIndex)'
];

const PRIVACY_REGISTRY_ABI = [
  'function updatePrivacyConfig(tuple(bool zkProofsEnabled, uint256 minMixingAmount, uint256 maxMixingAmount, bytes32 merkleRoot, uint256 anonymitySetSize, uint256 mixingRounds, bool crossChainEnabled, uint256 privacyScore, uint256 lastUpdated, bytes32[] trustedCommitments)) external payable',
  'function getUserPrivacyConfig(address user) external view returns (tuple(bool zkProofsEnabled, uint256 minMixingAmount, uint256 maxMixingAmount, bytes32 merkleRoot, uint256 anonymitySetSize, uint256 mixingRounds, bool crossChainEnabled, uint256 privacyScore, uint256 lastUpdated, bytes32[] trustedCommitments))',
  'function acceptsPrivateTransfers(address user) external view returns (bool)',
  'function getAveragePrivacyScore() external view returns (uint256)'
];

const ALIAS_ACCOUNT_ABI = [
  'function createAlias(address aliasAddress, bytes32 commitment, address shieldedPool, string calldata metaData) external payable',
  'function deposit(address aliasAddress, bytes32 newCommitment) external payable',
  'function getAlias(address aliasAddress) external view returns (tuple(bytes32 commitment, address shieldedPool, uint256 createdAt, bool isActive, uint256 totalDeposits, uint256 totalWithdrawals, string metaData))',
  'function getUserAliases(address user) external view returns (address[] memory)'
];

// Smart contract addresses (update with deployed addresses)
const CONTRACT_ADDRESSES = {
  SHIELDED_POOL: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // SimplePrivacyPool deployed locally
  ALIAS_ACCOUNT: '0x0000000000000000000000000000000000000000', // To be deployed
  PRIVACY_REGISTRY: '0x0000000000000000000000000000000000000000', // To be deployed
};

// Privacy wallet state types
interface Note {
  commitment: string;
  nullifier: string;
  amount: string;
  secret: string;
  spent: boolean;
  createdAt: number;
  index: number;
}

interface PrivacySettings {
  zkProofsEnabled: boolean;
  defaultPrivateMode: boolean;
  minMixingAmount: string;
  maxMixingAmount: string;
  anonymitySetSize: number;
  mixingRounds: number;
  autoShield: boolean;
  privacyScore: number;
}

interface PrivacyTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  commitment?: string;
  nullifier?: string;
  recipient?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  txHash?: string;
  isPrivate: boolean;
}

interface PrivacyWalletState {
  isPrivateMode: boolean;
  privateBalance: string;
  publicBalance: string;
  notes: Note[];
  aliases: string[];
  transactions: PrivacyTransaction[];
  privacySettings: PrivacySettings;
  isLoading: boolean;
  error: string | null;
  contracts: {
    shieldedPool: any;
    privacyRegistry: any;
    aliasAccount: any;
  } | null;
}

// Actions
type PrivacyWalletAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRIVATE_MODE'; payload: boolean }
  | { type: 'SET_BALANCES'; payload: { privateBalance: string; publicBalance: string } }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: { index: number; updates: Partial<Note> } }
  | { type: 'ADD_TRANSACTION'; payload: PrivacyTransaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<PrivacyTransaction> } }
  | { type: 'SET_PRIVACY_SETTINGS'; payload: PrivacySettings }
  | { type: 'SET_CONTRACTS'; payload: any }
  | { type: 'SET_ALIASES'; payload: string[] }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: PrivacyWalletState = {
  isPrivateMode: false,
  privateBalance: '0',
  publicBalance: '0',
  notes: [],
  aliases: [],
  transactions: [],
  privacySettings: {
    zkProofsEnabled: true,
    defaultPrivateMode: false,
    minMixingAmount: '0.001',
    maxMixingAmount: '10',
    anonymitySetSize: 100,
    mixingRounds: 3,
    autoShield: false,
    privacyScore: 0,
  },
  isLoading: false,
  error: null,
  contracts: null,
};

// Reducer
const privacyWalletReducer = (state: PrivacyWalletState, action: PrivacyWalletAction): PrivacyWalletState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRIVATE_MODE':
      return { ...state, isPrivateMode: action.payload };
    case 'SET_BALANCES':
      return { 
        ...state, 
        privateBalance: action.payload.privateBalance,
        publicBalance: action.payload.publicBalance 
      };
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((note, index) =>
          index === action.payload.index ? { ...note, ...action.payload.updates } : note
        )
      };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id ? { ...tx, ...action.payload.updates } : tx
        )
      };
    case 'SET_PRIVACY_SETTINGS':
      return { ...state, privacySettings: action.payload };
    case 'SET_CONTRACTS':
      return { ...state, contracts: action.payload };
    case 'SET_ALIASES':
      return { ...state, aliases: action.payload };
    case 'RESET_STATE':
      return { ...initialState };
    default:
      return state;
  }
};

// Context
interface PrivacyWalletContextType {
  state: PrivacyWalletState;
  dispatch: React.Dispatch<PrivacyWalletAction>;
  // Actions
  initializePrivacyWallet: (provider: any, signer: any) => Promise<void>;
  togglePrivateMode: () => void;
  depositToShielded: (amount: string) => Promise<string>;
  withdrawFromShielded: (amount: string, recipient: string) => Promise<string>;
  sendPrivateTransaction: (to: string, amount: string) => Promise<string>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<void>;
  generateCommitment: (amount: string, secret?: string) => Promise<{ commitment: string; secret: string; nullifier: string }>;
  scanForNotes: () => Promise<void>;
  calculatePrivateBalance: () => Promise<string>;
  createAlias: (metaData?: string) => Promise<string>;
  getPrivacyScore: () => Promise<number>;
}

const PrivacyWalletContext = createContext<PrivacyWalletContextType | undefined>(undefined);

// Helper function to get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

// Helper functions
const generateSecret = (): string => {
  return crypto.lib.WordArray.random(256 / 8).toString();
};

const generateCommitmentHash = (amount: string, secret: string, address: string): string => {
  const hash = crypto.SHA256(amount + secret + address).toString();
  return '0x' + hash;
};

const generateNullifier = (secret: string, commitment: string): string => {
  const hash = crypto.SHA256(secret + commitment).toString();
  return '0x' + hash;
};

// Mock ZK proof generation for MVP
const generateMockProof = (inputs: any) => {
  return {
    proof: '0x' + '0'.repeat(128), // Mock proof
    publicSignals: [inputs.nullifier, inputs.commitment, inputs.amount]
  };
};

// Provider component
export const PrivacyWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(privacyWalletReducer, initialState);

  // Initialize privacy wallet
  const initializePrivacyWallet = async (provider: any, signer: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Create contract instances
      const shieldedPool = new ethers.Contract(
        CONTRACT_ADDRESSES.SHIELDED_POOL,
        SHIELDED_POOL_ABI,
        signer
      );
      
      const privacyRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.PRIVACY_REGISTRY,
        PRIVACY_REGISTRY_ABI,
        signer
      );
      
      const aliasAccount = new ethers.Contract(
        CONTRACT_ADDRESSES.ALIAS_ACCOUNT,
        ALIAS_ACCOUNT_ABI,
        signer
      );

      dispatch({ 
        type: 'SET_CONTRACTS', 
        payload: { shieldedPool, privacyRegistry, aliasAccount } 
      });

      // Load saved data
      await loadSavedData();
      
      // Update balances
      await updateBalances(provider, signer.address);
      
      // Scan for notes
      await scanForNotes();
      
    } catch (error) {
      console.error('Failed to initialize privacy wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to initialize privacy wallet' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load saved data from AsyncStorage
  const loadSavedData = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('privacy_notes');
      const savedSettings = await AsyncStorage.getItem('privacy_settings');
      const savedTransactions = await AsyncStorage.getItem('privacy_transactions');
      
      if (savedNotes) {
        const notes: Note[] = JSON.parse(savedNotes);
        notes.forEach((note: Note) => dispatch({ type: 'ADD_NOTE', payload: note }));
      }
      
      if (savedSettings) {
        const settings: PrivacySettings = JSON.parse(savedSettings);
        dispatch({ type: 'SET_PRIVACY_SETTINGS', payload: settings });
      }
      
      if (savedTransactions) {
        const transactions: PrivacyTransaction[] = JSON.parse(savedTransactions);
        transactions.forEach((tx: PrivacyTransaction) => dispatch({ type: 'ADD_TRANSACTION', payload: tx }));
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  };

  // Update balances
  const updateBalances = async (provider: any, address: string) => {
    try {
      // Get public balance
      const publicBalance = await provider.getBalance(address);
      
      // Calculate private balance from notes
      const privateBalance = await calculatePrivateBalance();
      
      dispatch({
        type: 'SET_BALANCES',
        payload: {
          publicBalance: ethers.utils.formatEther(publicBalance),
          privateBalance
        }
      });
    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  };

  // Toggle private mode
  const togglePrivateMode = () => {
    dispatch({ type: 'SET_PRIVATE_MODE', payload: !state.isPrivateMode });
  };

  // Generate commitment
  const generateCommitment = async (amount: string, secret?: string): Promise<{ commitment: string; secret: string; nullifier: string }> => {
    const noteSecret = secret || generateSecret();
    const commitment = generateCommitmentHash(amount, noteSecret, 'user_address'); // Replace with actual address
    const nullifier = generateNullifier(noteSecret, commitment);
    
    return { commitment, secret: noteSecret, nullifier };
  };

  // Deposit to shielded pool
  const depositToShielded = async (amount: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const { commitment, secret, nullifier } = await generateCommitment(amount);
      const amountWei = ethers.utils.parseEther(amount);
      
      // Create transaction
      const tx = await state.contracts!.shieldedPool.deposit(commitment, {
        value: amountWei
      });
      
      // Add transaction to state
      const transaction: PrivacyTransaction = {
        id: crypto.lib.WordArray.random(128 / 8).toString(),
        type: 'deposit',
        amount,
        commitment,
        status: 'pending',
        timestamp: Date.now(),
        txHash: tx.hash,
        isPrivate: true
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      // Create note
      const note: Note = {
        commitment,
        nullifier,
        amount,
        secret,
        spent: false,
        createdAt: Date.now(),
        index: state.notes.length
      };
      
      dispatch({ type: 'ADD_NOTE', payload: note });
      dispatch({ 
        type: 'UPDATE_TRANSACTION', 
        payload: { id: transaction.id, updates: { status: 'confirmed' } } 
      });
      
      // Save to storage
      await AsyncStorage.setItem('privacy_notes', JSON.stringify([...state.notes, note]));
      
      return tx.hash;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to deposit to shielded pool' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Withdraw from shielded pool
  const withdrawFromShielded = async (amount: string, recipient: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Find available note
      const availableNote = state.notes.find(note => 
        !note.spent && parseFloat(note.amount) >= parseFloat(amount)
      );
      
      if (!availableNote) {
        throw new Error('Insufficient private balance');
      }
      
      // Generate mock proof
      const proof = generateMockProof({
        nullifier: availableNote.nullifier,
        commitment: availableNote.commitment,
        amount: ethers.utils.parseEther(amount)
      });
      
      // Withdraw
      const tx = await state.contracts!.shieldedPool.withdraw(
        recipient,
        availableNote.nullifier,
        ethers.utils.parseEther(amount),
        availableNote.commitment
      );
      
      // Update note as spent
      dispatch({
        type: 'UPDATE_NOTE',
        payload: { index: availableNote.index, updates: { spent: true } }
      });
      
      // Add transaction
      const transaction: PrivacyTransaction = {
        id: crypto.lib.WordArray.random(128 / 8).toString(),
        type: 'withdraw',
        amount,
        nullifier: availableNote.nullifier,
        recipient,
        status: 'pending',
        timestamp: Date.now(),
        txHash: tx.hash,
        isPrivate: true
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Wait for confirmation
      await tx.wait();
      dispatch({ 
        type: 'UPDATE_TRANSACTION', 
        payload: { id: transaction.id, updates: { status: 'confirmed' } } 
      });
      
      return tx.hash;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Send private transaction
  const sendPrivateTransaction = async (to: string, amount: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Find available note
      const availableNote = state.notes.find(note => 
        !note.spent && parseFloat(note.amount) >= parseFloat(amount)
      );
      
      if (!availableNote) {
        throw new Error('Insufficient private balance');
      }
      
      // Generate new commitment for recipient
      const { commitment: newCommitment } = await generateCommitment(amount);
      
      // Execute private transfer
      const tx = await state.contracts!.shieldedPool.privateTransfer(
        availableNote.nullifier,
        newCommitment,
        availableNote.commitment
      );
      
      // Update note as spent
      dispatch({
        type: 'UPDATE_NOTE',
        payload: { index: availableNote.index, updates: { spent: true } }
      });
      
      // Add transaction
      const transaction: PrivacyTransaction = {
        id: crypto.lib.WordArray.random(128 / 8).toString(),
        type: 'transfer',
        amount,
        commitment: newCommitment,
        nullifier: availableNote.nullifier,
        recipient: to,
        status: 'pending',
        timestamp: Date.now(),
        txHash: tx.hash,
        isPrivate: true
      };
      
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      
      // Wait for confirmation
      await tx.wait();
      dispatch({ 
        type: 'UPDATE_TRANSACTION', 
        payload: { id: transaction.id, updates: { status: 'confirmed' } } 
      });
      
      return tx.hash;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    try {
      const newSettings = { ...state.privacySettings, ...settings };
      dispatch({ type: 'SET_PRIVACY_SETTINGS', payload: newSettings });
      
      // Save to storage
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
      
      // Update on-chain if contracts are available
      if (state.contracts?.privacyRegistry) {
        const config = {
          zkProofsEnabled: newSettings.zkProofsEnabled,
          minMixingAmount: ethers.utils.parseEther(newSettings.minMixingAmount),
          maxMixingAmount: ethers.utils.parseEther(newSettings.maxMixingAmount),
          merkleRoot: ethers.constants.HashZero,
          anonymitySetSize: newSettings.anonymitySetSize,
          mixingRounds: newSettings.mixingRounds,
          crossChainEnabled: false,
          privacyScore: 0,
          lastUpdated: 0,
          trustedCommitments: []
        };
        
        await state.contracts.privacyRegistry.updatePrivacyConfig(config);
      }
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
    }
  };

  // Scan for notes
  const scanForNotes = async () => {
    // In a real implementation, this would scan the blockchain for commitments
    // For MVP, we'll use locally stored notes
    console.log('Scanning for notes...');
  };

  // Calculate private balance
  const calculatePrivateBalance = async (): Promise<string> => {
    const unspentNotes = state.notes.filter(note => !note.spent);
    const total = unspentNotes.reduce((sum, note) => sum + parseFloat(note.amount), 0);
    return total.toString();
  };

  // Create alias
  const createAlias = async (metaData: string = ''): Promise<string> => {
    try {
      const aliasAddress = ethers.Wallet.createRandom().address;
      const { commitment } = await generateCommitment('0');
      
      const tx = await state.contracts!.aliasAccount.createAlias(
        aliasAddress,
        commitment,
        CONTRACT_ADDRESSES.SHIELDED_POOL,
        metaData,
        { value: ethers.utils.parseEther('0.001') } // Creation fee
      );
      
      await tx.wait();
      
      const newAliases = [...state.aliases, aliasAddress];
      dispatch({ type: 'SET_ALIASES', payload: newAliases });
      
      return aliasAddress;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  // Get privacy score
  const getPrivacyScore = async (): Promise<number> => {
    try {
      if (state.contracts?.privacyRegistry) {
        const score = await state.contracts.privacyRegistry.getAveragePrivacyScore();
        return score.toNumber();
      }
      return state.privacySettings.privacyScore;
    } catch (error) {
      console.error('Failed to get privacy score:', error);
      return 0;
    }
  };

  const value: PrivacyWalletContextType = {
    state,
    dispatch,
    initializePrivacyWallet,
    togglePrivateMode,
    depositToShielded,
    withdrawFromShielded,
    sendPrivateTransaction,
    updatePrivacySettings,
    generateCommitment,
    scanForNotes,
    calculatePrivateBalance,
    createAlias,
    getPrivacyScore,
  };

  return (
    <PrivacyWalletContext.Provider value={value}>
      {children}
    </PrivacyWalletContext.Provider>
  );
};

export const usePrivacyWallet = (): PrivacyWalletContextType => {
  const context = useContext(PrivacyWalletContext);
  if (!context) {
    throw new Error('usePrivacyWallet must be used within a PrivacyWalletProvider');
  }
  return context;
};

export default PrivacyWalletContext;
