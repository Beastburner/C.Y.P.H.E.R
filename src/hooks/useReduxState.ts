import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { 
  setWallet, 
  setUnlocked, 
  setNetwork, 
  setTokens, 
  addToken, 
  removeToken, 
  setBalance,
  setPortfolio,
  resetWallet,
  loadBalance,
  loadPortfolio,
  initializeWallet
} from '../store/slices/walletSlice';
import { 
  setAuthenticated, 
  setPasswordSet, 
  setBiometricEnabled, 
  setLocked, 
  resetAuth 
} from '../store/slices/authSlice';
import { 
  navigateToScreen, 
  setAppLoading, 
  addNotification, 
  setActiveTab 
} from '../store/slices/uiSlice';
import { 
  loadTransactions, 
  sendTransaction, 
  setCurrentTransaction,
  resetTransactionState
} from '../store/slices/transactionSlice';
import type { WalletAccount, Network, Token, Portfolio } from '../types';

// Wallet Hook
export const useWalletState = () => {
  const dispatch = useAppDispatch();
  const walletState = useAppSelector((state: any) => state.wallet);
  const authState = useAppSelector((state: any) => state.auth);

  const createWallet = useCallback(async (params: { 
    mnemonic?: string; 
    password?: string; 
    enableBiometrics?: boolean; 
    walletName?: string 
  }) => {
    try {
      dispatch(setAppLoading(true));
      
      // Import wallet service
      const { walletService } = await import('../services/WalletService');
      const { setSecureValue, setValue } = await import('../utils/storageHelpers');
      
      // Generate or validate mnemonic
      const mnemonicPhrase = params.mnemonic || await walletService.createMnemonic();
      
      if (!walletService.validateMnemonic(mnemonicPhrase)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      // Derive wallet account
      const account = await walletService.deriveAccount(mnemonicPhrase, 0);
      
      // Setup security if password provided
      if (params.password) {
        const securityManager = (await import('../utils/securityManager')).default.getInstance();
        await securityManager.setPassword(params.password);
        if (params.enableBiometrics) {
          dispatch(setBiometricEnabled(true));
        }
        dispatch(setPasswordSet(true));
        dispatch(setAuthenticated({ isAuthenticated: true, method: 'password' }));
      }
      
      // Store wallet data
      if (account.privateKey) {
        await setSecureValue('privateKey', account.privateKey);
      }
      await setValue('walletAddress', account.address);
      await setValue('walletInitialized', 'true');
      
      // Create wallet account object
      const walletAccount: WalletAccount = {
        ...account,
        id: `wallet_${Date.now()}`,
        name: params.walletName || 'Account 1',
        isHardware: false,
        isImported: false,
        balance: [],
        nfts: [],
        accountIndex: 0,
        createdAt: Date.now(),
      };
      
      // Update state
      dispatch(setWallet({ account: walletAccount, balance: '0' }));
      dispatch(setAuthenticated({ isAuthenticated: true, method: 'password' }));
      
      // Load balance
      dispatch(loadBalance(account.address));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Wallet Created',
        message: 'Your wallet has been created successfully!'
      }));
      
      return walletAccount;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Wallet Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to create wallet'
      }));
      throw error;
    } finally {
      dispatch(setAppLoading(false));
    }
  }, [dispatch]);

  const importWallet = useCallback(async (importData: string, walletName?: string) => {
    try {
      dispatch(setAppLoading(true));
      
      const cleanInput = importData.trim().replace(/\s+/g, ' ');
      const isPrivateKey = cleanInput.length === 64 || (cleanInput.startsWith('0x') && cleanInput.length === 66);
      
      let account: WalletAccount;
      
      if (isPrivateKey) {
        // Import from private key
        const { ethers } = await import('ethers');
        const cleanPrivateKey = cleanInput.startsWith('0x') ? cleanInput : '0x' + cleanInput;
        
        if (!/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
          throw new Error('Invalid private key format');
        }
        
        const wallet = new ethers.Wallet(cleanPrivateKey);
        
        account = {
          id: 'account-imported',
          name: walletName || 'Imported Account',
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
          createdAt: Date.now(),
        };
      } else {
        // Import from mnemonic
        const { walletService } = await import('../services/WalletService');
        
        const words = cleanInput.split(' ');
        if (words.length !== 12 && words.length !== 24) {
          throw new Error('Recovery phrase must be 12 or 24 words');
        }
        
        if (!walletService.validateMnemonic(cleanInput)) {
          throw new Error('Invalid recovery phrase');
        }
        
        const derivedAccount = await walletService.deriveAccount(cleanInput, 0);
        
        account = {
          ...derivedAccount,
          id: `account_${Date.now()}`,
          name: walletName || 'Imported Account',
          isHardware: false,
          isImported: true,
          balance: [],
          nfts: [],
          accountIndex: 0,
          createdAt: Date.now(),
        };
      }
      
      // Store wallet data
      const { setSecureValue, setValue } = await import('../utils/storageHelpers');
      if (account.privateKey) {
        await setSecureValue('privateKey', account.privateKey);
      }
      await setValue('walletAddress', account.address);
      await setValue('walletInitialized', 'true');
      
      // Update state
      dispatch(setWallet({ account, balance: '0' }));
      dispatch(setAuthenticated({ isAuthenticated: true }));
      
      // Load balance
      dispatch(loadBalance(account.address));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Wallet Imported',
        message: 'Your wallet has been imported successfully!'
      }));
      
      return account;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Failed to import wallet'
      }));
      throw error;
    } finally {
      dispatch(setAppLoading(false));
    }
  }, [dispatch]);

  const unlockWallet = useCallback(async (password: string) => {
    try {
      const securityManager = (await import('../utils/securityManager')).default.getInstance();
      
      const isValidPassword = await securityManager.verifyPassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }
      
      dispatch(setAuthenticated({ isAuthenticated: true, method: 'password' }));
      dispatch(setUnlocked(true));
      
      // Initialize wallet if needed
      if (!walletState.isInitialized) {
        await dispatch(initializeWallet()).unwrap();
      }
      
      dispatch(addNotification({
        type: 'success',
        title: 'Wallet Unlocked',
        message: 'Welcome back!'
      }));
      
      return true;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Unlock Failed',
        message: error instanceof Error ? error.message : 'Failed to unlock wallet'
      }));
      return false;
    }
  }, [dispatch, walletState.isInitialized]);

  const lockWallet = useCallback(async () => {
    try {
      const securityManager = (await import('../utils/securityManager')).default.getInstance();
      await securityManager.lockWallet();
      
      dispatch(setUnlocked(false));
      dispatch(setAuthenticated({ isAuthenticated: false }));
      
      dispatch(addNotification({
        type: 'info',
        title: 'Wallet Locked',
        message: 'Your wallet has been locked for security'
      }));
    } catch (error) {
      console.error('Error locking wallet:', error);
    }
  }, [dispatch]);

  const switchNetwork = useCallback(async (network: Network) => {
    try {
      dispatch(setNetwork(network));
      
      // Reload balance for new network
      if (walletState.currentAccount?.address) {
        dispatch(loadBalance(walletState.currentAccount.address));
      }
      
      dispatch(addNotification({
        type: 'success',
        title: 'Network Switched',
        message: `Switched to ${network.name}`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Network Switch Failed',
        message: error instanceof Error ? error.message : 'Failed to switch network'
      }));
    }
  }, [dispatch, walletState.currentAccount?.address]);

  const refreshBalance = useCallback(() => {
    if (walletState.currentAccount?.address) {
      dispatch(loadBalance(walletState.currentAccount.address));
    }
  }, [dispatch, walletState.currentAccount?.address]);

  const refreshPortfolio = useCallback(() => {
    if (walletState.currentAccount?.address) {
      dispatch(loadPortfolio(walletState.currentAccount.address));
    }
  }, [dispatch, walletState.currentAccount?.address]);

  return {
    // State
    ...walletState,
    isAuthenticated: authState.isAuthenticated,
    isLocked: authState.isLocked,
    
    // Actions
    createWallet,
    importWallet,
    unlockWallet,
    lockWallet,
    switchNetwork,
    refreshBalance,
    refreshPortfolio,
    
    // Redux actions (for direct use when needed)
    setWallet: (payload: { account: WalletAccount; balance: string; portfolio?: Portfolio }) => 
      dispatch(setWallet(payload)),
    addToken: (token: Token) => dispatch(addToken(token)),
    removeToken: (address: string) => dispatch(removeToken(address)),
    resetWallet: () => dispatch(resetWallet()),
  };
};

// Navigation Hook
export const useNavigation = () => {
  const dispatch = useAppDispatch();
  const currentScreen = useAppSelector((state: any) => state.ui.currentScreen);
  const activeTab = useAppSelector((state: any) => state.ui.activeTab);

  const navigate = useCallback((screen: string, params?: any) => {
    dispatch(navigateToScreen({ screen, params }));
  }, [dispatch]);

  const setTab = useCallback((tab: string) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  return {
    currentScreen,
    activeTab,
    navigate,
    setTab,
  };
};

// Transaction Hook
export const useTransactions = () => {
  const dispatch = useAppDispatch();
  const transactionState = useAppSelector((state: any) => state.transaction);
  const walletState = useAppSelector((state: any) => state.wallet);

  const sendEther = useCallback(async (to: string, amount: string, gasPrice?: string) => {
    try {
      if (!walletState.currentAccount?.privateKey) {
        throw new Error('No private key available');
      }

      dispatch(setCurrentTransaction({ to, amount, gasPrice }));
      
      const txHash = await dispatch(sendTransaction({
        to,
        amount,
        gasPrice,
        privateKey: walletState.currentAccount.privateKey,
        chainId: walletState.activeNetwork.chainId,
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        title: 'Transaction Sent',
        message: `Transaction submitted: ${txHash.slice(0, 10)}...`
      }));

      // Refresh balance after transaction
      setTimeout(() => {
        if (walletState.currentAccount?.address) {
          dispatch(loadBalance(walletState.currentAccount.address));
        }
      }, 2000);

      return txHash;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Transaction Failed',
        message: error instanceof Error ? error.message : 'Failed to send transaction'
      }));
      throw error;
    }
  }, [dispatch, walletState.currentAccount, walletState.activeNetwork]);

  const loadTransactionHistory = useCallback(() => {
    if (walletState.currentAccount?.address) {
      dispatch(loadTransactions({
        address: walletState.currentAccount.address,
        chainId: walletState.activeNetwork.chainId,
      }));
    }
  }, [dispatch, walletState.currentAccount?.address, walletState.activeNetwork.chainId]);

  return {
    ...transactionState,
    sendEther,
    loadTransactionHistory,
    resetTransactionState: () => dispatch(resetTransactionState()),
  };
};

// Notifications Hook
export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state: any) => state.ui.notifications);

  const showNotification = useCallback((notification: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }) => {
    dispatch(addNotification(notification));
  }, [dispatch]);

  return {
    notifications,
    showNotification,
  };
};
