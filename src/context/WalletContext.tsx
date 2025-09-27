import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { ethers } from 'ethers';
import { WalletState, Transaction, Token, Network, WalletAccount, Portfolio } from '../types';
import { setSecureValue, getSecureValue, setValue, getValue, removeValue, removeSecureValue, getAllKeys } from '../utils/storageHelpers';
import { SUPPORTED_NETWORKS, getDefaultNetwork } from '../config/networks';
import { TransactionService } from '../services/TransactionService';
import SecurityManager from '../utils/securityManager';
import AutoLockManager from '../utils/autoLockManager';
import { walletService } from '../services/WalletService';


interface WalletContextType {
  state: WalletState;
  currentAccount: WalletAccount | null;
  selectedNetwork: Network;
  createWallet: (params: { mnemonic?: string; password?: string; enableBiometrics?: boolean; walletName?: string }) => Promise<void>;
  importWallet: (importData: string, walletName?: string) => Promise<void>;
  sendTransaction: (to: string, amount: string, gasPrice?: string) => Promise<string>;
  getBalance: () => Promise<string>;
  getTransactions: () => Promise<Transaction[]>;
  refreshPortfolio: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  switchNetwork: (network: Network) => Promise<void>;
  addToken: (token: Token) => Promise<void>;
  removeToken: (tokenAddress: string) => Promise<void>;
  exportPrivateKey: () => Promise<string>;
  exportMnemonic: () => Promise<string>;
  lockWallet: () => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  resetWallet: () => Promise<void>;
  isWalletLocked: () => Promise<boolean>;
  authenticateWithBiometrics: () => Promise<boolean>;
  isPasswordSet: () => Promise<boolean>;
  validatePassword: (password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  checkExistingWallet: () => Promise<boolean>;
  // Multi-wallet support
  createAdditionalWallet: (walletName: string, mnemonic?: string) => Promise<WalletAccount>;
  switchWallet: (walletId: string) => Promise<void>;
  removeWallet: (walletId: string) => Promise<void>;
  renameWallet: (walletId: string, newName: string) => Promise<void>;
  getAllWallets: () => Promise<WalletAccount[]>;
  deriveNewAccount: (walletId: string) => Promise<WalletAccount>;
  // Wallet initialization helper
  ensureWalletInitialized: () => Promise<boolean>;
}

type WalletAction = 
  | { type: 'SET_WALLET'; payload: { account: WalletAccount; balance: string; portfolio?: Portfolio } }
  | { type: 'SET_INITIALIZED'; payload: { account: WalletAccount; balance: string; isUnlocked: boolean } }
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'SET_TOKENS'; payload: Token[] }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_UNLOCKED'; payload: boolean }
  | { type: 'SET_PORTFOLIO'; payload: Portfolio }
  | { type: 'SET_WALLETS'; payload: WalletAccount[] }
  | { type: 'SWITCH_WALLET'; payload: WalletAccount }
  | { type: 'RESET_WALLET' };

const initialState: WalletState = {
  isInitialized: false,
  isUnlocked: false,
  accounts: [],
  currentAccount: undefined,
  activeAccount: undefined,
  activeNetwork: getDefaultNetwork(),
  currentNetwork: getDefaultNetwork(),
  portfolio: undefined,
  tokens: [],
  transactions: [],
  balance: '0',
  balanceUSD: 0
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_WALLET':
      console.log('SET_WALLET reducer called with:', {
        account: action.payload.account,
        balance: action.payload.balance
      });
      return {
        ...state,
        accounts: [action.payload.account],
        activeAccount: action.payload.account,
        currentAccount: action.payload.account,
        balance: action.payload.balance,
        portfolio: action.payload.portfolio || state.portfolio,
        isInitialized: true,
        isUnlocked: true
      };
    case 'SET_INITIALIZED':
      console.log('SET_INITIALIZED reducer called with:', {
        account: action.payload.account?.address,
        balance: action.payload.balance,
        isUnlocked: action.payload.isUnlocked
      });
      return {
        ...state,
        accounts: state.accounts.length > 0 ? state.accounts : [action.payload.account],
        activeAccount: action.payload.account,
        currentAccount: action.payload.account,
        balance: action.payload.balance,
        isUnlocked: action.payload.isUnlocked,
        isInitialized: true
      };
    case 'SET_NETWORK':
      return { 
        ...state, 
        activeNetwork: action.payload,
        currentNetwork: action.payload
      };
    case 'SET_TOKENS':
      return { ...state, tokens: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_UNLOCKED':
      return { ...state, isUnlocked: action.payload };
    case 'SET_PORTFOLIO':
      return { ...state, portfolio: action.payload };
    case 'SET_WALLETS':
      return { ...state, accounts: action.payload };
    case 'SWITCH_WALLET':
      return { 
        ...state, 
        currentAccount: action.payload,
        activeAccount: action.payload
      };
    case 'RESET_WALLET':
      console.log('🔄 RESET_WALLET action triggered - resetting to initial state');
      return { ...initialState };
    default:
      return state;
  }
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [hasInitialized, setHasInitialized] = React.useState(false);
  let wallet: ethers.utils.HDNode | ethers.Wallet | null = null;
  let provider: ethers.providers.JsonRpcProvider | null = null;

  useEffect(() => {
    const initializeWallet = async () => {
      // Prevent multiple initializations
      if (isInitializing || hasInitialized) {
        console.log('Wallet already initializing or initialized, skipping...');
        return;
      }

      try {
        setIsInitializing(true);
        console.log('🚀 Initializing wallet context...');
        await initializeProvider();
        
        // Check for existing wallet and update state accordingly
        const hasExistingWallet = await checkExistingWallet();
        console.log('Existing wallet check result:', hasExistingWallet);
        
        await initializeAutoLock();
        console.log('✅ Wallet context initialization complete');
        setHasInitialized(true);
      } catch (error) {
        console.error('❌ Error during wallet initialization:', error);
        // Don't reset state on error - let user handle it
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeWallet();
  }, []);

  // Removed the constant storage integrity check that was causing resets
  // Storage will be validated only during app startup and manual operations

  // Simplified app state recovery - only check lock state when needed
  useEffect(() => {
    if (!hasInitialized || isInitializing) return;

    // Only check lock state occasionally and when there's an inconsistency
    const handleAppStateChange = async () => {
      if (state.currentAccount && !state.isUnlocked) {
        const securityManager = SecurityManager.getInstance();
        const isLocked = await securityManager.isWalletLocked();
        if (!isLocked) {
          console.log('Wallet should be unlocked, updating state...');
          dispatch({ type: 'SET_UNLOCKED', payload: true });
        }
      }
    };

    // Check less frequently to avoid constant state changes
    const interval = setInterval(handleAppStateChange, 30000);
    return () => clearInterval(interval);
  }, [state.currentAccount, state.isUnlocked, hasInitialized, isInitializing]);

  const initializeAutoLock = async () => {
    try {
      const autoLockManager = AutoLockManager.getInstance();
      
      // Set callback to lock wallet when auto-lock triggers
      autoLockManager.setOnLockCallback(() => {
        dispatch({ type: 'SET_UNLOCKED', payload: false });
      });
      
      await autoLockManager.start();
    } catch (error) {
      console.error('Failed to initialize auto-lock:', error);
    }
  };

  useEffect(() => {
    if (state.activeNetwork) {
      initializeProvider();
    }
  }, [state.activeNetwork]);

  const initializeProvider = async () => {
    try {
      // Initialize API configuration first
      const { initializeApis } = await import('../config/apiConfig');
      await initializeApis();
      
      // Initialize enhanced RPC service
      const { enhancedRpcService } = await import('../services/enhancedRpcService');
      
      const currentNetwork = state.activeNetwork || state.currentNetwork;
      const chainId = currentNetwork?.chainId || 11155111; // Default to Sepolia
      
      console.log('🔄 Initializing provider for network:', currentNetwork?.name, `(chainId: ${chainId})`);
      
      // Get provider from enhanced RPC service
      const enhancedProvider = await enhancedRpcService.getProvider(chainId);
      if (enhancedProvider) {
        provider = enhancedProvider;
        console.log('✅ Enhanced provider initialized for network:', currentNetwork?.name);
      } else {
        console.warn('⚠️ Enhanced provider not available, falling back to basic provider');
        
        // Fallback to basic provider with production API keys
        const { getNetworkRpcUrls } = await import('../config/apiConfig');
        const rpcUrls = getNetworkRpcUrls(chainId);
        
        if (rpcUrls.length > 0) {
          provider = new ethers.providers.JsonRpcProvider({
            url: rpcUrls[0], // Use first available production RPC
            timeout: 10000
          });
          console.log('✅ Fallback provider initialized with production RPC');
        } else {
          throw new Error(`No RPC configuration available for chain ${chainId}`);
        }
      }

      // Initialize TransactionService providers
      console.log('Initializing TransactionService providers...');
      const transactionService = TransactionService.getInstance();
      await transactionService.initializeProviders();
      console.log('TransactionService providers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize provider:', error);
    }
  };

  const ensureWalletInitialized = async (): Promise<boolean> => {
    try {
      console.log('Ensuring wallet is initialized...');
      
      // If wallet is already initialized, return true
      if (wallet && state.isUnlocked && state.currentAccount) {
        console.log('Wallet already initialized and unlocked');
        return true;
      }

      // Try to initialize from current account
      if (state.currentAccount?.privateKey && !wallet) {
        console.log('Initializing wallet from current account private key...');
        wallet = new ethers.Wallet(state.currentAccount.privateKey);
        console.log('Wallet initialized from account:', wallet.address);
        return true;
      }

      // Try to load from storage if we have address but no wallet instance
      if (state.currentAccount?.address && !wallet) {
        console.log('Attempting to initialize wallet from stored data...');
        const privateKey = await getSecureValue('privateKey');
        if (privateKey) {
          wallet = new ethers.Wallet(privateKey);
          console.log('Wallet initialized from storage:', wallet.address);
          
          // Update current account with private key if missing
          if (!state.currentAccount.privateKey) {
            const updatedAccount = { ...state.currentAccount, privateKey };
            dispatch({
              type: 'SET_WALLET',
              payload: { account: updatedAccount, balance: state.balance }
            });
          }
          return true;
        }
      }

      console.log('Wallet initialization failed - no valid data found');
      return false;
    } catch (error) {
      console.error('Error ensuring wallet initialization:', error);
      return false;
    }
  };

  const checkExistingWallet = async (): Promise<boolean> => {
    console.log('🔍 Checking for existing wallet...');
    
    try {
      const mnemonicStorageKeys = (await getAllKeys()).filter(key => 
        key.includes('mnemonic') || key.includes('wallet_')
      );
      
      if (mnemonicStorageKeys.length === 0) {
        console.log('❌ No existing wallet found');
        return false;
      }

      console.log('✅ Existing wallet found');
      return true;
    } catch (error) {
      console.error('Error checking for existing wallet:', error);
      return false;
    }
  };

  const createWallet = async (params: { mnemonic?: string; password?: string; enableBiometrics?: boolean }): Promise<void> => {
    try {
      const { mnemonic, password, enableBiometrics } = params;
      
      // Generate or validate mnemonic using WalletService
      const mnemonicPhrase = mnemonic || await walletService.createMnemonic();
      
      if (!walletService.validateMnemonic(mnemonicPhrase)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Derive wallet account using WalletService
      const walletId = `wallet_${Date.now()}`;
      const account = await walletService.deriveAccount(mnemonicPhrase, 0);
      if (account.privateKey) {
        wallet = new ethers.Wallet(account.privateKey);
      }
      
      // Setup security if password provided
      if (password) {
        const securityManager = SecurityManager.getInstance();
        await securityManager.setPassword(password);
        if (enableBiometrics) {
          await securityManager.enableBiometric(password);
        }
        await securityManager.unlockWallet(); // Unlock immediately after setup
        
        // Store encrypted mnemonic using WalletService
        await walletService.encryptAndStoreMnemonic(mnemonicPhrase, password || '');
      } else {
        // Store encrypted mnemonic using WalletService with default encryption
        await walletService.encryptAndStoreMnemonic(mnemonicPhrase, password || '');
      }
      
      // Store wallet data securely
      if (account.privateKey) {
        await setSecureValue('privateKey', account.privateKey);
      }
      await setValue('walletAddress', account.address);
      await setValue('walletInitialized', 'true'); // Mark wallet as initialized
      
      const balance = await getBalance();
      
      const walletAccount: WalletAccount = {
        ...account,
        id: walletId,
        name: 'Account 1',
        isHardware: false,
        isImported: false,
        balance: [],
        nfts: [],
        accountIndex: 0,
        createdAt: Date.now()
      };
      
      dispatch({
        type: 'SET_WALLET',
        payload: { account: walletAccount, balance }
      });

      // Ensure wallet is unlocked after creation
      dispatch({
        type: 'SET_UNLOCKED',
        payload: true
      });
      
      console.log('Wallet created successfully:', account.address);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  };

  const importWallet = async (importData: string): Promise<void> => {
    try {
      const cleanInput = importData.trim().replace(/\s+/g, ' ');
      
      // Determine if it's a private key or mnemonic
      const isPrivateKey = cleanInput.length === 64 || (cleanInput.startsWith('0x') && cleanInput.length === 66);
      
      let account: WalletAccount;
      
      if (isPrivateKey) {
        // Import from private key
        const cleanPrivateKey = cleanInput.startsWith('0x') ? cleanInput : '0x' + cleanInput;
        
        // Validate private key format
        if (!/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
          throw new Error('Invalid private key format');
        }
        
        wallet = new ethers.Wallet(cleanPrivateKey);
        
        account = {
          id: 'account-imported',
          name: 'Imported Account',
          address: wallet.address,
          privateKey: wallet.privateKey,
          publicKey: wallet.address,
          path: "Private Key Import",
          index: 0,
          isHardware: false,
          isImported: true,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now()
        };
        
        // Store wallet data securely (no mnemonic for private key import)
        await setSecureValue('privateKey', wallet.privateKey);
        await setValue('walletAddress', wallet.address);
        await setValue('walletInitialized', 'true');
        
        console.log('✅ Wallet imported from private key:', wallet.address);
        
      } else {
        // Import from mnemonic using WalletService
        const words = cleanInput.split(' ');
        if (words.length !== 12 && words.length !== 24) {
          throw new Error('Recovery phrase must be 12 or 24 words');
        }
        
        // Validate mnemonic using WalletService
        if (!walletService.validateMnemonic(cleanInput)) {
          throw new Error('Invalid recovery phrase');
        }
        
        // Derive account using WalletService
        const derivedAccount = await walletService.deriveAccount(cleanInput, 0);
        console.log('🔍 Derived account data:', derivedAccount);
        
        account = {
          ...derivedAccount,
          id: `account_${Date.now()}`,
          name: 'Imported Account',
          isHardware: false,
          isImported: true,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now()
        };
        
        console.log('🔍 Final account object:', account);
        console.log('🔍 Account address:', account.address);
        
        if (account.privateKey) {
          wallet = new ethers.Wallet(account.privateKey);
        }
        
        // Validate that we have an address before storing
        if (!account.address) {
          throw new Error('Failed to derive wallet address from mnemonic');
        }
        
        // Store encrypted mnemonic using WalletService
        await walletService.encryptAndStoreMnemonic(cleanInput, '');
        if (account.privateKey) {
          await setSecureValue('privateKey', account.privateKey);
        }
        await setValue('walletAddress', account.address);
        await setValue('walletInitialized', 'true');
        
        console.log('✅ Wallet imported from mnemonic:', account.address);
      }
      
      const balance = await getBalance();
      
      dispatch({
        type: 'SET_WALLET',
        payload: { account, balance }
      });

      // Ensure wallet is unlocked after import
      dispatch({
        type: 'SET_UNLOCKED',
        payload: true
      });
      
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    }
  };

  const sendTransaction = async (to: string, amount: string, gasPrice?: string): Promise<string> => {
    try {
      console.log('SendTransaction called with:', { to, amount, gasPrice });
      console.log('Current wallet state:', {
        wallet: !!wallet,
        walletAddress: wallet?.address,
        activeNetwork: state.activeNetwork?.name,
        currentAccount: state.currentAccount?.address,
        isUnlocked: state.isUnlocked
      });

      // Enhanced validation with better error messages
      if (!state.isUnlocked) {
        throw new Error('Wallet is locked. Please unlock your wallet first.');
      }

      // Ensure wallet is properly initialized
      const isWalletReady = await ensureWalletInitialized();
      if (!isWalletReady) {
        throw new Error('Failed to initialize wallet. Please create or import a wallet first.');
      }

      if (!wallet) {
        throw new Error('Wallet not initialized. Please create or import a wallet first.');
      }

      const currentNetwork = state.activeNetwork || state.currentNetwork;
      if (!currentNetwork) {
        throw new Error('Network not configured. Please select a network first.');
      }

      // CRITICAL SECURITY: Validate addresses
      if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address. Please check and try again.');
      }
      if (!ethers.utils.isAddress(wallet.address)) {
        throw new Error('Invalid sender address. Wallet may be corrupted.');
      }

      // CRITICAL SECURITY: Check current balance before transaction
      const currentBalance = await getBalance();
      const currentBalanceNum = parseFloat(currentBalance);
      const sendAmount = parseFloat(amount);
      
      if (sendAmount <= 0) {
        throw new Error('Transaction amount must be greater than 0.');
      }
      
      if (sendAmount > currentBalanceNum) {
        throw new Error(`Insufficient balance. You have ${currentBalance} ETH but trying to send ${amount} ETH.`);
      }

      // Reserve some ETH for gas fees (estimate ~0.001 ETH for gas)
      const gasReserve = 0.001;
      if (sendAmount > (currentBalanceNum - gasReserve)) {
        throw new Error(`Insufficient balance for transaction + gas fees. Please leave at least ${gasReserve} ETH for gas.`);
      }

      console.log('🌐 Using wallet:', wallet.address.slice(0, 10) + '...', 'on network:', currentNetwork.name, 'chainId:', currentNetwork.chainId);
      
      // CRITICAL SECURITY: Show transaction confirmation dialog
      const confirmTransaction = () => {
        return new Promise<boolean>((resolve) => {
          Alert.alert(
            '🔐 Confirm Transaction',
            `Send ${amount} ETH to:\n${to.slice(0, 20)}...${to.slice(-4)}\n\nNetwork: ${currentNetwork.name}\nFrom: ${wallet!.address.slice(0, 20)}...${wallet!.address.slice(-4)}\n\nThis transaction cannot be undone.`,
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: 'Confirm & Sign',
                style: 'default',
                onPress: () => resolve(true)
              }
            ],
            { cancelable: false }
          );
        });
      };

      // CRITICAL SECURITY: Require user confirmation
      const userConfirmed = await confirmTransaction();
      if (!userConfirmed) {
        throw new Error('Transaction cancelled by user.');
      }

      // CRITICAL SECURITY: Show signing dialog
      Alert.alert(
        '🔑 Signing Transaction',
        'Please wait while your transaction is being signed and broadcast...',
        [],
        { cancelable: false }
      );

      console.log('✅ User confirmed transaction, proceeding with signing...');
      
      // Use TransactionService for real transactions
      const transactionService = TransactionService.getInstance();
      
      // Convert amount to wei before sending (parseEther expects string format)
      const valueInWei = ethers.utils.parseEther(amount.toString()).toString();
      
      console.log('💰 Transaction details:', {
        from: wallet.address.slice(0, 10) + '...',
        to: to.slice(0, 10) + '...',
        value: amount + ' ETH (' + valueInWei + ' wei)',
        chainId: currentNetwork.chainId,
        network: currentNetwork.name
      });
      
      const result = await transactionService.sendTransaction({
        from: wallet.address,
        to,
        value: valueInWei,
        gasPrice,
        chainId: currentNetwork.chainId
      }, wallet.privateKey);
      
      console.log('✅ Transaction sent successfully:', result);
      
      // CRITICAL FIX: Immediate balance update with success dialog
      Alert.alert(
        '✅ Transaction Sent Successfully!',
        `Transaction Hash: ${result}\n\nYour balance will be updated shortly.`,
        [{ text: 'OK', onPress: async () => {
          await getBalance();
          await getTransactions();
        }}]
      );

      // Also update balance and transactions automatically
      await getBalance();
      await getTransactions();
      
      return result;
    } catch (error) {
      console.error('Error sending transaction:', error);
      
      // Show user-friendly error dialog
      Alert.alert(
        '❌ Transaction Failed',
        error instanceof Error ? error.message : 'Unknown error occurred during transaction.',
        [{ text: 'OK' }]
      );
      
      throw error;
    }
  };

  const getBalance = async (): Promise<string> => {
    try {
      const address = wallet?.address || state.activeAccount?.address || state.currentAccount?.address;
      if (!address) {
        console.log('No wallet address available for balance check');
        return '0';
      }
      
      // Try enhanced RPC service first
      try {
        const { enhancedRpcService } = await import('../services/enhancedRpcService');
        const currentNetwork = state.activeNetwork || state.currentNetwork;
        const chainId = currentNetwork?.chainId || 11155111; // Default to Sepolia if no network is set
        
        console.log(`🔄 Getting balance for ${address} on network:`, currentNetwork?.name, `(chainId: ${chainId})`);
        
        const balance = await enhancedRpcService.getBalance(address, chainId);
        console.log(`✅ Balance retrieved successfully: ${balance}`);
        
        return balance;
      } catch (enhancedError) {
        console.warn('Enhanced RPC service failed, falling back to TransactionService:', enhancedError);
        
        // Fallback to TransactionService
        const transactionService = TransactionService.getInstance();
        const currentNetwork = state.activeNetwork || state.currentNetwork;
        const chainId = currentNetwork?.chainId || 11155111;
        
        const balance = await transactionService.getBalance(address, chainId);
        console.log(`📦 Fallback: Balance retrieved successfully: ${balance}`);
        
        return balance;
      }
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      
      // Provide more specific error handling
      if (error instanceof Error) {
        if (error.message.includes('Provider not available')) {
          console.error('🚫 All RPC providers are unavailable - check network connection');
        } else if (error.message.includes('network')) {
          console.error('🌐 Network connectivity issue - check internet connection');
        } else if (error.message.includes('timeout')) {
          console.error('⏱️ Request timeout - network may be slow');
        } else if (error.message.includes('invalid')) {
          console.error('❓ Invalid address or network configuration');
        }
      }
      
      // Return 0 but log the error for debugging
      return '0';
    }
  };

  const getTransactions = async (): Promise<Transaction[]> => {
    try {
      const address = wallet?.address || state.activeAccount?.address;
      if (!wallet || !state.activeNetwork || !address) {
        return [];
      }
      
      // Use TransactionService for real transaction history
      const transactionService = TransactionService.getInstance();
      const txHistory = await transactionService.getTransactionHistory(address, state.activeNetwork.chainId);
      
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
        nonce: 0, // Will be filled from actual data
        chainId: state.activeNetwork.chainId
      }));
      
      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  };

  const switchNetwork = async (network: Network): Promise<void> => {
    try {
      dispatch({ type: 'SET_NETWORK', payload: network });
      await setValue('selectedNetwork', network);
    } catch (error) {
      console.error('Error switching network:', error);
      throw error;
    }
  };

  const addToken = async (token: Token): Promise<void> => {
    try {
      const updatedTokens = [...state.tokens, token];
      dispatch({ type: 'SET_TOKENS', payload: updatedTokens });
      await setValue('tokens', updatedTokens);
    } catch (error) {
      console.error('Error adding token:', error);
      throw error;
    }
  };

  const removeToken = async (tokenAddress: string): Promise<void> => {
    try {
      const updatedTokens = state.tokens.filter(token => token.address !== tokenAddress);
      dispatch({ type: 'SET_TOKENS', payload: updatedTokens });
      await setValue('tokens', updatedTokens);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  };

  const exportPrivateKey = async (): Promise<string> => {
    try {
      const privateKey = await getSecureValue('privateKey');
      if (!privateKey) {
        throw new Error('Private key not found');
      }
      return privateKey;
    } catch (error) {
      console.error('Error exporting private key:', error);
      throw error;
    }
  };

  const exportMnemonic = async (): Promise<string> => {
    try {
      // Use WalletService to decrypt and export mnemonic
      const hasWallet = await walletService.hasWallet();
      if (!hasWallet) {
        throw new Error('No wallet found');
      }
      
      // For now, try to decrypt without passcode (will use default encryption key)
      // In a real app, you'd prompt for password/biometric authentication first
      // TODO: Implement proper password/biometric prompt
      const mnemonic = await walletService.decryptMnemonic(''); // Placeholder - needs proper password
      return mnemonic || '';
    } catch (error) {
      console.error('Error exporting mnemonic:', error);
      throw error;
    }
  };

  const lockWallet = async (): Promise<void> => {
    try {
      const securityManager = SecurityManager.getInstance();
      await securityManager.lockWallet();
      await securityManager.logSecurityEvent('wallet_locked');
      wallet = null;
      dispatch({ type: 'SET_UNLOCKED', payload: false });
    } catch (error) {
      console.error('Error locking wallet:', error);
    }
  };

  const unlockWallet = async (password: string): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      
      // Verify password
      const isValidPassword = await securityManager.verifyPassword(password);
      if (!isValidPassword) {
        console.error('Invalid password provided');
        return false;
      }
      
      // Try to decrypt mnemonic with password using WalletService
      let mnemonic: string | null = null;
      try {
        mnemonic = await walletService.decryptMnemonic(password);
      } catch (error) {
        console.error('Failed to decrypt with password, trying fallback:', error);
      }
      
      // If mnemonic decryption failed, try loading private key directly
      let privateKey = await getSecureValue('privateKey');
      const storedAddress = await getValue('walletAddress');
      
      if (mnemonic) {
        // Derive account from mnemonic
        const account = await walletService.deriveAccount(mnemonic, 0);
        privateKey = account.privateKey || null;
        
        // Recreate wallet instance
        if (account.privateKey) {
          wallet = new ethers.Wallet(account.privateKey);
        }
        
        // Update state
        const balance = await getBalance();
        
        const walletAccount: WalletAccount = {
          ...account,
          id: `account_${Date.now()}`,
          name: 'Account 1',
          isHardware: false,
          isImported: false,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now()
        };
        
        dispatch({
          type: 'SET_WALLET',
          payload: { account: walletAccount, balance }
        });

        // Set wallet as unlocked
        dispatch({ type: 'SET_UNLOCKED', payload: true });
        
      } else if (privateKey && storedAddress) {
        // Fallback to direct private key
        const tempWallet = new ethers.Wallet(privateKey);
        wallet = tempWallet;
        
        // Update state
        const balance = await getBalance();
        const account: WalletAccount = {
          id: 'account-0',
          name: 'Account 1',
          address: storedAddress,
          privateKey: privateKey,
          publicKey: tempWallet.address,
          path: "m/44'/60'/0'/0/0",
          index: 0,
          isHardware: false,
          isImported: false,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now()
        };
        
        dispatch({
          type: 'SET_WALLET',
          payload: { account, balance }
        });

        // Set wallet as unlocked
        dispatch({ type: 'SET_UNLOCKED', payload: true });
      } else {
        console.error('No wallet data found');
        return false;
      }
      
      // Unlock the security manager
      await securityManager.unlockWallet();
      
      console.log('Wallet unlocked successfully:', wallet?.address);
      return true;
      
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      return false;
    }
  };

  const refreshPortfolio = async (): Promise<void> => {
    try {
      if (!state.currentAccount?.address) {
        return;
      }
      
      const balance = await getBalance();
      
      // Get real ETH price
      let ethPrice = 0;
      let priceChange = 0;
      try {
        const tokenService = (await import('../services/tokenService')).default;
        ethPrice = await tokenService.getTokenPrice('ethereum');
        // Note: Real price change would require historical data API
        priceChange = 0; // Set to 0 for now, can be implemented with proper API
      } catch (error) {
        console.warn('Failed to get ETH price:', error);
        ethPrice = 0;
      }
      
      const realPortfolio: Portfolio = {
        totalBalance: parseFloat(balance),
        totalBalanceFormatted: ethPrice > 0 ? `$${(parseFloat(balance) * ethPrice).toFixed(2)}` : 'N/A',
        tokens: state.tokens,
        nativeBalance: balance,
        nativeBalanceFormatted: `${parseFloat(balance).toFixed(4)} ETH`,
        priceChange24h: priceChange
      };
      
      // Update state with portfolio
      dispatch({
        type: 'SET_WALLET',
        payload: { 
          account: state.currentAccount,
          balance,
          portfolio: realPortfolio
        }
      });
    } catch (error) {
      console.error('Error refreshing portfolio:', error);
    }
  };

  const refreshTransactions = async (): Promise<void> => {
    try {
      await getTransactions();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  };

  const resetWallet = async (): Promise<void> => {
    try {
      const securityManager = SecurityManager.getInstance();
      await securityManager.logSecurityEvent('wallet_reset');
      
      // Clear wallet instance
      wallet = null;
      
      // Clear all stored data - use removeValue instead of empty strings
      await removeValue('walletAddress');
      await removeValue('walletInitialized');
      await removeValue('tokens');
      await removeValue('selectedNetwork');
      await removeValue('wallets');
      await removeValue('currentWalletId');
      
      // Clear secure data - use removeSecureValue instead of empty strings
      await removeSecureValue('mnemonic');
      await removeSecureValue('privateKey');
      
      // Clear any wallet-specific keys that might exist
      try {
        const allKeys = await getAllKeys();
        const walletKeys = allKeys.filter(key => 
          key.startsWith('wallet_') || 
          key.startsWith('mnemonic_') || 
          key.startsWith('privateKey_') ||
          key.startsWith('secure_')
        );
        
        for (const key of walletKeys) {
          if (key.startsWith('secure_')) {
            await removeSecureValue(key.replace('secure_', ''));
          } else {
            await removeValue(key);
          }
        }
      } catch (error) {
        console.warn('Failed to clear some wallet keys:', error);
      }
      
      // Reset state
      dispatch({ type: 'RESET_WALLET' });
      
      console.log('Wallet reset successfully');
    } catch (error) {
      console.error('Error resetting wallet:', error);
      throw error;
    }
  };

  const isWalletLocked = async (): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      return await securityManager.isWalletLocked();
    } catch (error) {
      console.error('Error checking wallet lock status:', error);
      return true;
    }
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      
      // Check if biometric is enabled and available
      const isBiometricEnabled = await securityManager.isBiometricEnabled();
      if (!isBiometricEnabled) {
        console.error('Biometric authentication not enabled');
        return false;
      }
      
      const biometricResult = await securityManager.authenticateWithBiometrics({
        promptMessage: 'Authenticate to access your wallet'
      });
      
      if (biometricResult) {
        console.log('Biometric authentication successful, unlocking wallet...');
        
        // For biometric authentication, we need to retrieve the stored password
        // that was encrypted and stored during biometric setup
        let storedPassword: string | null = null;
        try {
          storedPassword = await getSecureValue('biometric_password');
        } catch (error) {
          console.warn('No biometric password found, trying direct key access:', error);
        }
        
        let success = false;
        
        if (storedPassword) {
          // Use the stored password to unlock the wallet normally
          console.log('Using stored password for biometric unlock');
          try {
            success = await unlockWallet(storedPassword);
            if (!success) {
              console.error('Biometric password failed, clearing stored password');
              await setSecureValue('biometric_password', '');
            }
          } catch (error) {
            console.error('Failed to decrypt with password, trying fallback:', error);
            await setSecureValue('biometric_password', '');
          }
        } else {
          // Fallback: try to unlock with direct private key access
          console.log('Using direct private key access for biometric unlock');
          let privateKey = await getSecureValue('privateKey');
          const storedAddress = await getValue('walletAddress');
          
          if (privateKey && storedAddress) {
            // Create wallet from private key
            wallet = new ethers.Wallet(privateKey);
            
            const balance = await getBalance();
            const account: WalletAccount = {
              id: 'biometric-account-0',
              name: 'Account 1',
              address: storedAddress,
              privateKey: privateKey,
              publicKey: wallet.address,
              path: "m/44'/60'/0'/0/0",
              index: 0,
              isHardware: false,
              isImported: false,
              balance: [],
              nfts: [],
              accountIndex: 0,
              createdAt: Date.now()
            };
            
            dispatch({
              type: 'SET_WALLET',
              payload: { account, balance }
            });
            
            // Set wallet as unlocked
            dispatch({ type: 'SET_UNLOCKED', payload: true });
            
            await securityManager.unlockWallet();
            success = true;
          } else {
            console.error('No wallet data found for biometric authentication');
          }
        }
        
        if (success) {
          console.log('Wallet successfully unlocked with biometrics');
          // Reset auto-lock timer
          try {
            const autoLockManager = AutoLockManager.getInstance();
            autoLockManager.resetUserActivity();
          } catch (error) {
            console.warn('Failed to reset auto-lock timer:', error);
          }
        }
        
        return success;
      }
      
      return false;
    } catch (error) {
      console.error('Error with biometric authentication:', error);
      return false;
    }
  };

  const isPasswordSet = async (): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      return await securityManager.isPasswordSet();
    } catch (error) {
      console.error('Error checking password status:', error);
      return false;
    }
  };

  const validatePassword = async (password: string): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      return await securityManager.verifyPassword(password);
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const securityManager = SecurityManager.getInstance();
      
      // First verify the old password
      const isValidOldPassword = await securityManager.verifyPassword(oldPassword);
      if (!isValidOldPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = securityManager.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`New password is too weak: ${passwordValidation.suggestions.join(', ')}`);
      }

      // Set the new password
      const success = await securityManager.setPassword(newPassword);
      if (!success) {
        throw new Error('Failed to update password');
      }

      // Re-encrypt sensitive data with new password if needed
      try {
        const mnemonic = await walletService.decryptMnemonic(oldPassword);
        if (mnemonic) {
          await walletService.encryptAndStoreMnemonic(mnemonic, newPassword);
        }
      } catch (error) {
        console.warn('Could not re-encrypt mnemonic with new password:', error);
        // Don't fail the password change if mnemonic re-encryption fails
      }

      // Log security event
      await securityManager.logSecurityEvent('password_changed', {
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };

  // Multi-wallet functions
  const createAdditionalWallet = async (walletName: string, mnemonic?: string): Promise<WalletAccount> => {
    try {
      const mnemonicPhrase = mnemonic || await walletService.createMnemonic();
      
      if (!walletService.validateMnemonic(mnemonicPhrase)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      const walletId = `wallet_${Date.now()}`;
      const account = await walletService.deriveAccount(mnemonicPhrase, 0);
      
      const walletAccount: WalletAccount = {
        ...account,
        id: walletId,
        name: walletName,
        isHardware: false,
        isImported: false,
        balance: [],
        nfts: [],
        accountIndex: 0,
        createdAt: Date.now()
      };
      
      // Store wallet data
      await setSecureValue(`mnemonic_${walletId}`, mnemonicPhrase);
      if (account.privateKey) {
        await setSecureValue(`privateKey_${walletId}`, account.privateKey);
      }
      
      // Update wallets list
      const currentWallets = state.accounts || [];
      const updatedWallets = [...currentWallets, walletAccount];
      await setValue('wallets', JSON.stringify(updatedWallets.map(w => ({ 
        id: w.id, 
        name: w.name, 
        address: w.address,
        path: w.path,
        index: w.index
      }))));
      
      dispatch({ type: 'SET_WALLETS', payload: updatedWallets });
      
      return walletAccount;
    } catch (error) {
      console.error('Error creating additional wallet:', error);
      throw error;
    }
  };

  const switchWallet = async (walletId: string): Promise<void> => {
    try {
      const wallets = state.accounts || [];
      const targetWallet = wallets.find(w => w.id === walletId);
      
      if (!targetWallet) {
        throw new Error('Wallet not found');
      }
      
      // Load private key for the wallet
      const privateKey = await getSecureValue(`privateKey_${walletId}`);
      if (!privateKey) {
        throw new Error('Wallet private key not found');
      }
      
      // Update wallet instance
      wallet = new ethers.Wallet(privateKey);
      
      // Update current account
      const updatedAccount = { ...targetWallet, privateKey };
      dispatch({ type: 'SWITCH_WALLET', payload: updatedAccount });
      
      // Update stored current wallet
      await setValue('currentWalletId', walletId);
      
      console.log('Switched to wallet:', targetWallet.name);
    } catch (error) {
      console.error('Error switching wallet:', error);
      throw error;
    }
  };

  const removeWallet = async (walletId: string): Promise<void> => {
    try {
      const wallets = state.accounts || [];
      
      if (wallets.length <= 1) {
        throw new Error('Cannot remove the last wallet');
      }
      
      // Remove wallet data
      await setSecureValue(`mnemonic_${walletId}`, '');
      await setSecureValue(`privateKey_${walletId}`, '');
      
      // Update wallets list
      const updatedWallets = wallets.filter(w => w.id !== walletId);
      await setValue('wallets', JSON.stringify(updatedWallets.map(w => ({ 
        id: w.id, 
        name: w.name, 
        address: w.address,
        path: w.path,
        index: w.index
      }))));
      
      dispatch({ type: 'SET_WALLETS', payload: updatedWallets });
      
      // If removed wallet was current, switch to first available
      if (state.currentAccount?.id === walletId) {
        await switchWallet(updatedWallets[0].id!);
      }
      
      console.log('Wallet removed:', walletId);
    } catch (error) {
      console.error('Error removing wallet:', error);
      throw error;
    }
  };

  const renameWallet = async (walletId: string, newName: string): Promise<void> => {
    try {
      const wallets = state.accounts || [];
      
      const updatedWallets = wallets.map(wallet => 
        wallet.id === walletId ? { ...wallet, name: newName } : wallet
      );
      
      await setValue('wallets', JSON.stringify(updatedWallets.map(w => ({ 
        id: w.id, 
        name: w.name, 
        address: w.address,
        path: w.path,
        index: w.index
      }))));
      
      dispatch({ type: 'SET_WALLETS', payload: updatedWallets });
      
      // Update current account if it's the renamed one
      if (state.currentAccount?.id === walletId) {
        const updatedAccount = { ...state.currentAccount, name: newName };
        dispatch({ type: 'SWITCH_WALLET', payload: updatedAccount });
      }
      
      console.log('Wallet renamed:', walletId, newName);
    } catch (error) {
      console.error('Error renaming wallet:', error);
      throw error;
    }
  };

  const getAllWallets = async (): Promise<WalletAccount[]> => {
    try {
      return state.accounts || [];
    } catch (error) {
      console.error('Error getting all wallets:', error);
      return [];
    }
  };

  const deriveNewAccount = async (walletId: string): Promise<WalletAccount> => {
    try {
      // Get the mnemonic for the wallet
      const mnemonic = await getSecureValue(`mnemonic_${walletId}`);
      if (!mnemonic) {
        throw new Error('Wallet mnemonic not found');
      }
      
      const wallets = state.accounts || [];
      const parentWallet = wallets.find(w => w.id === walletId);
      if (!parentWallet) {
        throw new Error('Parent wallet not found');
      }
      
      // Find the next account index for this wallet
      const walletsFromSameMnemonic = wallets.filter(w => w.id?.startsWith(walletId.split('_')[0]));
      const nextIndex = walletsFromSameMnemonic.length;
      
      // Derive new account
      const account = await walletService.deriveAccount(mnemonic, nextIndex);
      
      const newWalletId = `${walletId}_${nextIndex}`;
      const newAccount: WalletAccount = {
        ...account,
        id: newWalletId,
        name: `${parentWallet.name} Account ${nextIndex + 1}`,
        isHardware: false,
        isImported: false,
        balance: [],
        nfts: [],
        accountIndex: nextIndex,
        createdAt: Date.now()
      };
      
      // Store new account data
      if (account.privateKey) {
        await setSecureValue(`privateKey_${newWalletId}`, account.privateKey);
      }
      
      // Update wallets list
      const updatedWallets = [...wallets, newAccount];
      await setValue('wallets', JSON.stringify(updatedWallets.map(w => ({ 
        id: w.id, 
        name: w.name, 
        address: w.address,
        path: w.path,
        index: w.index
      }))));
      
      dispatch({ type: 'SET_WALLETS', payload: updatedWallets });
      
      return newAccount;
    } catch (error) {
      console.error('Error deriving new account:', error);
      throw error;
    }
  };

  const value: WalletContextType = {
    state,
    currentAccount: state.currentAccount || null,
    selectedNetwork: state.currentNetwork,
    createWallet,
    importWallet,
    sendTransaction,
    getBalance,
    getTransactions,
    refreshPortfolio,
    refreshTransactions,
    switchNetwork,
    addToken,
    removeToken,
    exportPrivateKey,
    exportMnemonic,
    lockWallet,
    unlockWallet,
    resetWallet,
    isWalletLocked,
    authenticateWithBiometrics,
    isPasswordSet,
    validatePassword,
    changePassword,
    checkExistingWallet,
    // Multi-wallet functions
    createAdditionalWallet,
    switchWallet,
    removeWallet,
    renameWallet,
    getAllWallets,
    deriveNewAccount,
    // Wallet initialization helper
    ensureWalletInitialized
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
