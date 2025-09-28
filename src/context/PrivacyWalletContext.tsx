import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Smart contract addresses (update with deployed addresses)
const CONTRACT_ADDRESSES = {
  SHIELDED_POOL: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // SimplePrivacyPool deployed locally
  ALIAS_ACCOUNT: '0x0000000000000000000000000000000000000000', // To be deployed
  PRIVACY_REGISTRY: '0x0000000000000000000000000000000000000000', // To be deployed
};

// Contract ABIs (simplified for MVP)
const SHIELDED_POOL_ABI = [
  'function deposit(bytes32 commitment) external payable',
  'function withdraw(bytes32 nullifierHash, address payable recipient, uint256 amount, bytes32 commitment) external',
  'function hasCommitment(bytes32 commitment) external view returns (bool)',
  'function getCommitmentAmount(bytes32 commitment) external view returns (uint256)',
  'function isNullified(bytes32 nullifier) external view returns (bool)',
  'function totalDeposits() external view returns (uint256)',
  'event Deposit(bytes32 indexed commitment, uint256 amount)',
  'event Withdrawal(bytes32 indexed nullifier, address recipient, uint256 amount)'
];

// Types
interface PrivacyNote {
  id: string;
  commitment: string;
  nullifier: string;
  amount: string;
  secret: string;
  isSpent: boolean;
  timestamp: number;
}

interface PrivacyTransaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  commitment?: string;
  nullifier?: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  timestamp: number;
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

interface PrivacyWalletState {
  isPrivateMode: boolean;
  privateBalance: string;
  publicBalance: string;
  notes: PrivacyNote[];
  aliases: string[];
  transactions: PrivacyTransaction[];
  privacySettings: PrivacySettings;
  isLoading: boolean;
  error: string | null;
  contracts: any;
}

type PrivacyWalletAction =
  | { type: 'SET_PRIVATE_MODE'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_BALANCES'; payload: { privateBalance: string; publicBalance: string } }
  | { type: 'ADD_NOTE'; payload: PrivacyNote }
  | { type: 'SPEND_NOTE'; payload: string }
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

// Helper functions - React Native compatible
const generateSecret = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const generateCommitmentHash = (amount: string, secret: string, address: string): string => {
  const data = amount + secret + address;
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
};

const generateNullifierHash = (secret: string, commitment: string): string => {
  const data = secret + commitment;
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(data));
};

const generateRandomId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Helper function to handle errors
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
};

// Reducer
const privacyWalletReducer = (state: PrivacyWalletState, action: PrivacyWalletAction): PrivacyWalletState => {
  switch (action.type) {
    case 'SET_PRIVATE_MODE':
      return { ...state, isPrivateMode: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'UPDATE_BALANCES':
      return { 
        ...state, 
        privateBalance: action.payload.privateBalance,
        publicBalance: action.payload.publicBalance
      };
    case 'ADD_NOTE':
      return { ...state, notes: [...state.notes, action.payload] };
    case 'SPEND_NOTE':
      return { 
        ...state, 
        notes: state.notes.map(note => 
          note.id === action.payload ? { ...note, isSpent: true } : note
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
      return initialState;
    default:
      return state;
  }
};

// Context interface
interface PrivacyWalletContextType {
  state: PrivacyWalletState;
  // Mode controls
  togglePrivateMode: () => void;
  setPrivateMode: (enabled: boolean) => void;
  
  // Privacy operations
  generatePrivateAddress: () => Promise<string>;
  createAlias: (commitment: string) => Promise<string>;
  shieldFunds: (amount: string) => Promise<string>;
  unshieldFunds: (noteId: string, recipient: string) => Promise<string>;
  privateTransfer: (amount: string, recipient: string) => Promise<string>;
  
  // Balance and notes management
  refreshBalances: () => Promise<void>;
  getNotes: () => PrivacyNote[];
  getSpendableBalance: () => string;
  
  // Privacy settings
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  
  // Aliases management
  getAliases: () => string[];
  
  // Error handling
  clearError: () => void;
}

// Create context
const PrivacyWalletContext = createContext<PrivacyWalletContextType | undefined>(undefined);

// Provider component
export const PrivacyWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(privacyWalletReducer, initialState);

  // Initialize privacy wallet
  useEffect(() => {
    initializePrivacyWallet();
  }, []);

  const initializePrivacyWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize ethers provider for local network
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Create contract instance
      const shieldedPoolContract = new ethers.Contract(
        CONTRACT_ADDRESSES.SHIELDED_POOL,
        SHIELDED_POOL_ABI,
        provider
      );
      
      dispatch({ type: 'SET_CONTRACTS', payload: { shieldedPoolContract, provider } });
      
      // Load saved settings
      const savedSettings = await AsyncStorage.getItem('privacySettings');
      if (savedSettings) {
        dispatch({ type: 'SET_PRIVACY_SETTINGS', payload: JSON.parse(savedSettings) });
      }

      // Load saved notes
      const savedNotes = await AsyncStorage.getItem('privacyNotes');
      if (savedNotes) {
        const notes = JSON.parse(savedNotes);
        notes.forEach((note: PrivacyNote) => {
          dispatch({ type: 'ADD_NOTE', payload: note });
        });
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
    }
  };

  // Mode controls
  const togglePrivateMode = () => {
    dispatch({ type: 'SET_PRIVATE_MODE', payload: !state.isPrivateMode });
  };

  const setPrivateMode = (enabled: boolean) => {
    dispatch({ type: 'SET_PRIVATE_MODE', payload: enabled });
  };

  // Privacy operations
  const generatePrivateAddress = async (): Promise<string> => {
    try {
      const secret = generateSecret();
      const commitment = generateCommitmentHash('0', secret, 'private');
      return commitment;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  const createAlias = async (commitment: string): Promise<string> => {
    try {
      const aliasId = generateRandomId();
      const aliases = [...state.aliases, aliasId];
      dispatch({ type: 'SET_ALIASES', payload: aliases });
      
      // Save to storage
      await AsyncStorage.setItem('privacyAliases', JSON.stringify(aliases));
      return aliasId;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  const shieldFunds = async (amount: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const secret = generateSecret();
      const commitment = generateCommitmentHash(amount, secret, 'shield');
      const nullifier = generateNullifierHash(secret, commitment);
      
      // Create note
      const note: PrivacyNote = {
        id: generateRandomId(),
        commitment,
        nullifier,
        amount,
        secret,
        isSpent: false,
        timestamp: Date.now(),
      };

      // Create transaction record
      const transaction: PrivacyTransaction = {
        id: generateRandomId(),
        type: 'deposit',
        amount,
        commitment,
        status: 'pending',
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_NOTE', payload: note });
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

      // Save note to storage
      const notes = [...state.notes, note];
      await AsyncStorage.setItem('privacyNotes', JSON.stringify(notes));

      // Simulate successful transaction
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_TRANSACTION', 
          payload: { 
            id: transaction.id, 
            updates: { status: 'confirmed', txHash: '0x' + generateRandomId() } 
          } 
        });
      }, 2000);

      dispatch({ type: 'SET_LOADING', payload: false });
      return commitment;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  const unshieldFunds = async (noteId: string, recipient: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const note = state.notes.find(n => n.id === noteId && !n.isSpent);
      if (!note) throw new Error('Note not found or already spent');

      // Create withdrawal transaction
      const transaction: PrivacyTransaction = {
        id: generateRandomId(),
        type: 'withdraw',
        amount: note.amount,
        nullifier: note.nullifier,
        status: 'pending',
        timestamp: Date.now(),
      };

      dispatch({ type: 'SPEND_NOTE', payload: noteId });
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

      // Update storage
      const updatedNotes = state.notes.map(n => 
        n.id === noteId ? { ...n, isSpent: true } : n
      );
      await AsyncStorage.setItem('privacyNotes', JSON.stringify(updatedNotes));

      // Simulate successful transaction
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_TRANSACTION', 
          payload: { 
            id: transaction.id, 
            updates: { status: 'confirmed', txHash: '0x' + generateRandomId() } 
          } 
        });
      }, 2000);

      dispatch({ type: 'SET_LOADING', payload: false });
      return transaction.id;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  const privateTransfer = async (amount: string, recipient: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Find sufficient notes
      const availableNotes = state.notes.filter(n => !n.isSpent);
      // Simplified - just use first available note for demo
      const sourceNote = availableNotes[0];
      if (!sourceNote) throw new Error('No available notes for transfer');

      // Create new note for recipient (simplified)
      const newSecret = generateSecret();
      const newCommitment = generateCommitmentHash(amount, newSecret, recipient);
      const newNullifier = generateNullifierHash(newSecret, newCommitment);

      const newNote: PrivacyNote = {
        id: generateRandomId(),
        commitment: newCommitment,
        nullifier: newNullifier,
        amount,
        secret: newSecret,
        isSpent: false,
        timestamp: Date.now(),
      };

      // Create transaction record
      const transaction: PrivacyTransaction = {
        id: generateRandomId(),
        type: 'transfer',
        amount,
        status: 'pending',
        timestamp: Date.now(),
      };

      dispatch({ type: 'SPEND_NOTE', payload: sourceNote.id });
      dispatch({ type: 'ADD_NOTE', payload: newNote });
      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

      // Simulate successful transaction
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_TRANSACTION', 
          payload: { 
            id: transaction.id, 
            updates: { status: 'confirmed', txHash: '0x' + generateRandomId() } 
          } 
        });
      }, 2000);

      dispatch({ type: 'SET_LOADING', payload: false });
      return transaction.id;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
      throw error;
    }
  };

  // Balance management
  const refreshBalances = async () => {
    try {
      const spendableBalance = getSpendableBalance();
      dispatch({ 
        type: 'UPDATE_BALANCES', 
        payload: { 
          privateBalance: spendableBalance,
          publicBalance: '0' // Placeholder
        } 
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: getErrorMessage(error) });
    }
  };

  const getNotes = (): PrivacyNote[] => {
    return state.notes;
  };

  const getSpendableBalance = (): string => {
    const spendableNotes = state.notes.filter(note => !note.isSpent);
    const total = spendableNotes.reduce((sum, note) => {
      return sum + parseFloat(note.amount);
    }, 0);
    return total.toString();
  };

  // Privacy settings
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    const newSettings = { ...state.privacySettings, ...settings };
    dispatch({ type: 'SET_PRIVACY_SETTINGS', payload: newSettings });
    await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
  };

  // Aliases management
  const getAliases = (): string[] => {
    return state.aliases;
  };

  // Error handling
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: PrivacyWalletContextType = {
    state,
    togglePrivateMode,
    setPrivateMode,
    generatePrivateAddress,
    createAlias,
    shieldFunds,
    unshieldFunds,
    privateTransfer,
    refreshBalances,
    getNotes,
    getSpendableBalance,
    updatePrivacySettings,
    getAliases,
    clearError,
  };

  return (
    <PrivacyWalletContext.Provider value={contextValue}>
      {children}
    </PrivacyWalletContext.Provider>
  );
};

// Hook to use privacy wallet
export const usePrivacyWallet = (): PrivacyWalletContextType => {
  const context = useContext(PrivacyWalletContext);
  if (!context) {
    throw new Error('usePrivacyWallet must be used within PrivacyWalletProvider');
  }
  return context;
};

export default PrivacyWalletProvider;
