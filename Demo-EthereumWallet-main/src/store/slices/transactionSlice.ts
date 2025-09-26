import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types';

export interface TransactionState {
  // Transaction history
  transactions: Transaction[];
  pendingTransactions: Transaction[];
  
  // Transaction states
  isLoadingTransactions: boolean;
  isSendingTransaction: boolean;
  
  // Current transaction being created
  currentTransaction: {
    to: string;
    amount: string;
    gasPrice?: string;
    gasLimit?: string;
    data?: string;
    token?: string;
  } | null;
  
  // Transaction details
  selectedTransaction: Transaction | null;
  
  // Pagination
  transactionOffset: number;
  hasMoreTransactions: boolean;
  
  // Filters
  transactionFilter: 'all' | 'sent' | 'received' | 'pending' | 'failed';
  dateFilter: {
    startDate?: string;
    endDate?: string;
  };
  
  // Errors
  transactionError: string | null;
  lastTransactionHash: string | null;
}

const initialState: TransactionState = {
  transactions: [],
  pendingTransactions: [],
  isLoadingTransactions: false,
  isSendingTransaction: false,
  currentTransaction: null,
  selectedTransaction: null,
  transactionOffset: 0,
  hasMoreTransactions: true,
  transactionFilter: 'all',
  dateFilter: {},
  transactionError: null,
  lastTransactionHash: null,
};

// Async thunks
export const loadTransactions = createAsyncThunk(
  'transaction/loadTransactions',
  async (params: { 
    address: string; 
    chainId: number; 
    offset?: number; 
    limit?: number;
  }, { rejectWithValue }) => {
    try {
      // Import TransactionService dynamically
      const { TransactionService } = await import('../../services/TransactionService');
      const transactionService = TransactionService.getInstance();
      
      const txHistory = await transactionService.getTransactionHistory(
        params.address, 
        params.chainId
      );
      
      // Convert to our Transaction format
      const transactions: Transaction[] = txHistory.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        timestamp: tx.timestamp,
        status: tx.status,
        gasPrice: tx.gasPrice,
        gasLimit: tx.gasLimit,
        nonce: tx.nonce || 0,
        chainId: params.chainId,
      }));
      
      return {
        transactions,
        hasMore: transactions.length >= (params.limit || 20),
      };
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load transactions');
    }
  }
);

export const sendTransaction = createAsyncThunk(
  'transaction/sendTransaction',
  async (params: {
    to: string;
    amount: string;
    gasPrice?: string;
    gasLimit?: string;
    privateKey: string;
    chainId: number;
  }, { rejectWithValue }) => {
    try {
      // Import TransactionService dynamically
      const { TransactionService } = await import('../../services/TransactionService');
      const { ethers } = await import('ethers');
      
      const transactionService = TransactionService.getInstance();
      
      // Convert amount to wei
      const valueInWei = ethers.utils.parseEther(params.amount.toString()).toString();
      
      const txHash = await transactionService.sendTransaction({
        from: '', // Will be derived from private key
        to: params.to,
        value: valueInWei,
        gasPrice: params.gasPrice,
        gasLimit: params.gasLimit,
        chainId: params.chainId,
      }, params.privateKey);
      
      return txHash;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to send transaction');
    }
  }
);

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.transactions = action.payload;
    },
    
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      // Add to the beginning of the array (most recent first)
      state.transactions.unshift(action.payload);
      
      // Remove duplicates based on hash
      const seen = new Set();
      state.transactions = state.transactions.filter(tx => {
        if (seen.has(tx.hash)) {
          return false;
        }
        seen.add(tx.hash);
        return true;
      });
    },
    
    updateTransaction: (state, action: PayloadAction<{ hash: string; updates: Partial<Transaction> }>) => {
      const transaction = state.transactions.find(tx => tx.hash === action.payload.hash);
      if (transaction) {
        Object.assign(transaction, action.payload.updates);
      }
      
      const pendingTransaction = state.pendingTransactions.find(tx => tx.hash === action.payload.hash);
      if (pendingTransaction) {
        Object.assign(pendingTransaction, action.payload.updates);
        
        // Move from pending to confirmed if status changed
        if (action.payload.updates.status === 'confirmed') {
          state.pendingTransactions = state.pendingTransactions.filter(tx => tx.hash !== action.payload.hash);
        }
      }
    },
    
    addPendingTransaction: (state, action: PayloadAction<Transaction>) => {
      state.pendingTransactions.unshift(action.payload);
    },
    
    removePendingTransaction: (state, action: PayloadAction<string>) => {
      state.pendingTransactions = state.pendingTransactions.filter(tx => tx.hash !== action.payload);
    },
    
    setSelectedTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.selectedTransaction = action.payload;
    },
    
    setCurrentTransaction: (state, action: PayloadAction<{
      to: string;
      amount: string;
      gasPrice?: string;
      gasLimit?: string;
      data?: string;
      token?: string;
    } | null>) => {
      state.currentTransaction = action.payload;
    },
    
    setTransactionFilter: (state, action: PayloadAction<'all' | 'sent' | 'received' | 'pending' | 'failed'>) => {
      state.transactionFilter = action.payload;
    },
    
    setDateFilter: (state, action: PayloadAction<{ startDate?: string; endDate?: string }>) => {
      state.dateFilter = action.payload;
    },
    
    setTransactionOffset: (state, action: PayloadAction<number>) => {
      state.transactionOffset = action.payload;
    },
    
    setHasMoreTransactions: (state, action: PayloadAction<boolean>) => {
      state.hasMoreTransactions = action.payload;
    },
    
    setTransactionError: (state, action: PayloadAction<string | null>) => {
      state.transactionError = action.payload;
    },
    
    clearTransactionError: (state) => {
      state.transactionError = null;
    },
    
    resetTransactionState: (state) => {
      state.currentTransaction = null;
      state.selectedTransaction = null;
      state.transactionError = null;
    },
    
    resetTransactions: () => {
      return initialState;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Load transactions
      .addCase(loadTransactions.pending, (state) => {
        state.isLoadingTransactions = true;
        state.transactionError = null;
      })
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.isLoadingTransactions = false;
        
        if (state.transactionOffset === 0) {
          // First load - replace all transactions
          state.transactions = action.payload.transactions;
        } else {
          // Pagination - append transactions
          state.transactions.push(...action.payload.transactions);
        }
        
        state.hasMoreTransactions = action.payload.hasMore;
        state.transactionOffset += action.payload.transactions.length;
      })
      .addCase(loadTransactions.rejected, (state, action) => {
        state.isLoadingTransactions = false;
        state.transactionError = action.payload as string;
      })
      
      // Send transaction
      .addCase(sendTransaction.pending, (state) => {
        state.isSendingTransaction = true;
        state.transactionError = null;
      })
      .addCase(sendTransaction.fulfilled, (state, action) => {
        state.isSendingTransaction = false;
        state.lastTransactionHash = action.payload;
        state.currentTransaction = null;
        
        // Transaction sent successfully but we'll get details from the network later
      })
      .addCase(sendTransaction.rejected, (state, action) => {
        state.isSendingTransaction = false;
        state.transactionError = action.payload as string;
      });
  },
});

export const {
  setTransactions,
  addTransaction,
  updateTransaction,
  addPendingTransaction,
  removePendingTransaction,
  setSelectedTransaction,
  setCurrentTransaction,
  setTransactionFilter,
  setDateFilter,
  setTransactionOffset,
  setHasMoreTransactions,
  setTransactionError,
  clearTransactionError,
  resetTransactionState,
  resetTransactions,
} = transactionSlice.actions;

export default transactionSlice.reducer;
