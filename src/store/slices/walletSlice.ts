import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WalletAccount, Network, Token, Portfolio } from '../../types';

export interface WalletState {
  // Core wallet state
  isInitialized: boolean;
  isUnlocked: boolean;
  currentAccount: WalletAccount | null;
  accounts: WalletAccount[];
  
  // Network and blockchain state
  activeNetwork: Network;
  supportedNetworks: Network[];
  
  // Token and balance state
  balance: string;
  balanceUSD: number;
  tokens: Token[];
  portfolio: Portfolio | null;
  
  // Loading states
  isLoading: boolean;
  isBalanceLoading: boolean;
  isTransactionLoading: boolean;
  
  // Error states
  error: string | null;
  lastError: string | null;
}

const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  currentAccount: null,
  accounts: [],
  activeNetwork: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    symbol: 'SepoliaETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'SepoliaETH',
      decimals: 18,
    },
  },
  supportedNetworks: [],
  balance: '0',
  balanceUSD: 0,
  tokens: [],
  portfolio: null,
  isLoading: false,
  isBalanceLoading: false,
  isTransactionLoading: false,
  error: null,
  lastError: null,
};

// Async thunks
export const initializeWallet = createAsyncThunk(
  'wallet/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Import wallet service dynamically to avoid circular dependencies
      const { walletService } = await import('../../services/WalletService');
      const { getValue } = await import('../../utils/storageHelpers');
      
      const hasWallet = await walletService.hasWallet();
      const walletAddress = await getValue('walletAddress');
      
      if (hasWallet && walletAddress) {
        // Try to initialize from storage
        const account: WalletAccount = {
          id: 'account-0',
          name: 'Account 1',
          address: walletAddress,
          privateKey: '', // Will be loaded when unlocked
          publicKey: walletAddress,
          path: "m/44'/60'/0'/0/0",
          index: 0,
          isHardware: false,
          isImported: false,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now(),
        };
        
        return { 
          isInitialized: true, 
          account,
          isUnlocked: false // Will be determined by security manager
        };
      }
      
      return { isInitialized: false, account: null, isUnlocked: false };
    } catch (error) {
      console.error('Failed to initialize wallet:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to initialize wallet');
    }
  }
);

export const loadBalance = createAsyncThunk(
  'wallet/loadBalance',
  async (address: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { wallet: WalletState };
      const chainId = state.wallet.activeNetwork.chainId;
      
      // Import service dynamically
      const { enhancedRpcService } = await import('../../services/enhancedRpcService');
      const balance = await enhancedRpcService.getBalance(address, chainId);
      
      return balance;
    } catch (error) {
      console.error('Failed to load balance:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load balance');
    }
  }
);

export const loadPortfolio = createAsyncThunk(
  'wallet/loadPortfolio',
  async (address: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { wallet: WalletState };
      const balance = state.wallet.balance;
      
      // Import token service dynamically
      const tokenService = (await import('../../services/tokenService')).default;
      let ethPrice = 0;
      
      try {
        ethPrice = await tokenService.getTokenPrice('ethereum');
      } catch (error) {
        console.warn('Failed to get ETH price:', error);
      }
      
      const portfolio: Portfolio = {
        totalBalance: parseFloat(balance),
        totalBalanceFormatted: ethPrice > 0 ? `$${(parseFloat(balance) * ethPrice).toFixed(2)}` : 'N/A',
        tokens: state.wallet.tokens,
        nativeBalance: balance,
        nativeBalanceFormatted: `${parseFloat(balance).toFixed(4)} ETH`,
        priceChange24h: 0, // Can be implemented with proper API
      };
      
      return portfolio;
    } catch (error) {
      console.error('Failed to load portfolio:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load portfolio');
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWallet: (state, action: PayloadAction<{ account: WalletAccount; balance: string; portfolio?: Portfolio }>) => {
      state.currentAccount = action.payload.account;
      state.accounts = [action.payload.account];
      state.balance = action.payload.balance;
      state.portfolio = action.payload.portfolio || state.portfolio;
      state.isInitialized = true;
      state.isUnlocked = true;
      state.error = null;
    },
    
    setUnlocked: (state, action: PayloadAction<boolean>) => {
      state.isUnlocked = action.payload;
      if (!action.payload) {
        // Clear sensitive data when locked
        if (state.currentAccount) {
          state.currentAccount.privateKey = '';
        }
      }
    },
    
    setNetwork: (state, action: PayloadAction<Network>) => {
      state.activeNetwork = action.payload;
    },
    
    setTokens: (state, action: PayloadAction<Token[]>) => {
      state.tokens = action.payload;
    },
    
    addToken: (state, action: PayloadAction<Token>) => {
      const existingIndex = state.tokens.findIndex(token => 
        token.address.toLowerCase() === action.payload.address.toLowerCase()
      );
      
      if (existingIndex >= 0) {
        state.tokens[existingIndex] = action.payload;
      } else {
        state.tokens.push(action.payload);
      }
    },
    
    removeToken: (state, action: PayloadAction<string>) => {
      state.tokens = state.tokens.filter(token => 
        token.address.toLowerCase() !== action.payload.toLowerCase()
      );
    },
    
    setBalance: (state, action: PayloadAction<string>) => {
      state.balance = action.payload;
    },
    
    setPortfolio: (state, action: PayloadAction<Portfolio>) => {
      state.portfolio = action.payload;
    },
    
    setAccounts: (state, action: PayloadAction<WalletAccount[]>) => {
      state.accounts = action.payload;
    },
    
    switchAccount: (state, action: PayloadAction<WalletAccount>) => {
      state.currentAccount = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setBalanceLoading: (state, action: PayloadAction<boolean>) => {
      state.isBalanceLoading = action.payload;
    },
    
    setTransactionLoading: (state, action: PayloadAction<boolean>) => {
      state.isTransactionLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.lastError = action.payload;
      }
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    resetWallet: (state) => {
      return {
        ...initialState,
        activeNetwork: state.activeNetwork, // Keep network selection
        supportedNetworks: state.supportedNetworks,
      };
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize wallet
      .addCase(initializeWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = action.payload.isInitialized;
        state.isUnlocked = action.payload.isUnlocked;
        if (action.payload.account) {
          state.currentAccount = action.payload.account;
          state.accounts = [action.payload.account];
        }
      })
      .addCase(initializeWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isInitialized = false;
        state.isUnlocked = false;
      })
      
      // Load balance
      .addCase(loadBalance.pending, (state) => {
        state.isBalanceLoading = true;
      })
      .addCase(loadBalance.fulfilled, (state, action) => {
        state.isBalanceLoading = false;
        state.balance = action.payload;
      })
      .addCase(loadBalance.rejected, (state, action) => {
        state.isBalanceLoading = false;
        state.error = action.payload as string;
      })
      
      // Load portfolio
      .addCase(loadPortfolio.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload;
      })
      .addCase(loadPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setWallet,
  setUnlocked,
  setNetwork,
  setTokens,
  addToken,
  removeToken,
  setBalance,
  setPortfolio,
  setAccounts,
  switchAccount,
  setLoading,
  setBalanceLoading,
  setTransactionLoading,
  setError,
  clearError,
  resetWallet,
} = walletSlice.actions;

export default walletSlice.reducer;
