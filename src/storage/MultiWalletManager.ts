/**
 * Multi-Wallet Management System
 * Orchestrates all three storage tiers for seamless wallet management
 * Supports unlimited wallets with persistent authentication and smooth switching
 */

import { secureStorage, SecureWalletData, SecureAccountData } from './SecureStorage';
import { metadataStorage, WalletMetadata, AccountMetadata, AppState, UserPreferences } from './MetadataStorage';
import { cacheStorage } from './CacheStorage';
import { ethers } from 'ethers';

export interface CreateWalletParams {
  name: string;
  color?: string;
  icon?: string;
  category?: string;
  password?: string;
  mnemonic?: string; // If importing existing wallet
}

export interface WalletSummary {
  id: string;
  name: string;
  color: string;
  icon: string;
  category: string;
  isActive: boolean;
  totalValue: string;
  accountCount: number;
  primaryAddress: string;
  lastSynced: number;
}

export interface AccountSummary {
  id: string;
  address: string;
  name: string;
  balance: string;
  derivationPath: string;
  isHidden: boolean;
  lastActivity: number;
}

export interface WalletWithAccounts {
  wallet: WalletSummary;
  accounts: AccountSummary[];
}

class MultiWalletManager {
  private currentWalletId: string | null = null;
  private currentAccountId: string | null = null;
  private isInitialized: boolean = false;
  private sessionActive: boolean = false;

  /**
   * Initialize the multi-wallet system
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing multi-wallet system...');
      
      // Clear expired cache
      await cacheStorage.clearExpiredCache();
      
      // Load app state
      const appState = await metadataStorage.getAppState();
      if (appState) {
        this.currentWalletId = appState.currentWalletId;
        this.currentAccountId = appState.currentAccountId;
        this.sessionActive = !appState.isLocked && Date.now() < appState.sessionExpires;
      }
      
      this.isInitialized = true;
      console.log('Multi-wallet system initialized');
    } catch (error) {
      console.error('Failed to initialize multi-wallet system:', error);
      throw new Error('Multi-wallet initialization failed');
    }
  }

  /**
   * Check if this is the first time the app is launched
   */
  async isFirstLaunch(): Promise<boolean> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.length === 0;
    } catch (error) {
      console.error('Failed to check first launch:', error);
      return true;
    }
  }

  /**
   * Create a new wallet
   */
  async createWallet(params: CreateWalletParams): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate or use provided mnemonic
      let mnemonic = params.mnemonic;
      if (!mnemonic) {
        const wallet = ethers.Wallet.createRandom();
        mnemonic = wallet.mnemonic?.phrase || '';
      }

      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      // Validate mnemonic
      if (!ethers.utils.isValidMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Create first account (derivation path m/44'/60'/0'/0/0)
      const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      const derivationPath = "m/44'/60'/0'/0/0";
      const accountNode = hdNode.derivePath(derivationPath);
      const accountId = `account_${walletId}_0`;

      // Store secure wallet data (Tier 1)
      const secureWalletData: SecureWalletData = {
        id: walletId,
        name: params.name,
        mnemonic,
        privateKey: accountNode.privateKey, // Primary account private key
        createdAt: Date.now(),
        lastUsed: Date.now(),
        accounts: [{
          id: accountId,
          address: accountNode.address,
          privateKey: accountNode.privateKey,
          derivationPath,
          name: 'Account 1',
          createdAt: Date.now(),
        }],
      };

      await secureStorage.storeWallet(secureWalletData);

      // Store wallet metadata (Tier 2)
      const walletMetadata: WalletMetadata = {
        id: walletId,
        name: params.name,
        color: params.color || '#6366F1',
        icon: params.icon || 'wallet',
        order: 0,
        category: params.category || 'personal',
        isActive: true,
        totalValue: '0',
        lastSynced: Date.now(),
        accountCount: 1,
        primaryAccountAddress: accountNode.address,
      };

      await metadataStorage.storeWalletMetadata(walletMetadata);

      // Store account metadata (Tier 2)
      const accountMetadata: AccountMetadata = {
        id: accountId,
        walletId,
        address: accountNode.address,
        name: 'Account 1',
        balance: '0',
        derivationPath,
        order: 0,
        isHidden: false,
        lastActivity: Date.now(),
      };

      await metadataStorage.storeAccountMetadata(accountMetadata);

      // Update wallet order
      const currentOrder = await metadataStorage.getWalletOrder();
      await metadataStorage.storeWalletOrder([walletId, ...currentOrder]);

      // Set as current wallet if it's the first one
      if (await this.isFirstLaunch()) {
        await this.switchToWallet(walletId, accountId);
      }

      console.log(`Created wallet: ${walletId}`);
      return walletId;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Wallet creation failed');
    }
  }

  /**
   * Import wallet from mnemonic
   */
  async importWallet(name: string, mnemonic: string, password?: string): Promise<string> {
    return this.createWallet({
      name,
      mnemonic,
      password,
      category: 'imported',
    });
  }

  /**
   * Get all wallets summary
   */
  async getAllWallets(): Promise<WalletSummary[]> {
    try {
      const walletMetadata = await metadataStorage.getAllWalletMetadata();
      const walletOrder = await metadataStorage.getWalletOrder();
      
      // Sort wallets by order
      const sortedWallets = walletMetadata.sort((a, b) => {
        const aIndex = walletOrder.indexOf(a.id);
        const bIndex = walletOrder.indexOf(b.id);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });

      return sortedWallets.map(metadata => ({
        id: metadata.id,
        name: metadata.name,
        color: metadata.color,
        icon: metadata.icon,
        category: metadata.category,
        isActive: metadata.isActive,
        totalValue: metadata.totalValue,
        accountCount: metadata.accountCount,
        primaryAddress: metadata.primaryAccountAddress,
        lastSynced: metadata.lastSynced,
      }));
    } catch (error) {
      console.error('Failed to get all wallets:', error);
      return [];
    }
  }

  /**
   * Get wallet with all accounts
   */
  async getWalletWithAccounts(walletId: string): Promise<WalletWithAccounts | null> {
    try {
      const walletMetadata = await metadataStorage.getWalletMetadata(walletId);
      if (!walletMetadata) return null;

      const accounts = await metadataStorage.getAccountsForWallet(walletId);
      
      const wallet: WalletSummary = {
        id: walletMetadata.id,
        name: walletMetadata.name,
        color: walletMetadata.color,
        icon: walletMetadata.icon,
        category: walletMetadata.category,
        isActive: walletMetadata.isActive,
        totalValue: walletMetadata.totalValue,
        accountCount: walletMetadata.accountCount,
        primaryAddress: walletMetadata.primaryAccountAddress,
        lastSynced: walletMetadata.lastSynced,
      };

      const accountSummaries: AccountSummary[] = accounts.map(account => ({
        id: account.id,
        address: account.address,
        name: account.name,
        balance: account.balance,
        derivationPath: account.derivationPath,
        isHidden: account.isHidden,
        lastActivity: account.lastActivity,
      }));

      return { wallet, accounts: accountSummaries };
    } catch (error) {
      console.error('Failed to get wallet with accounts:', error);
      return null;
    }
  }

  /**
   * Switch to a specific wallet and account
   */
  async switchToWallet(walletId: string, accountId?: string): Promise<void> {
    try {
      const walletMetadata = await metadataStorage.getWalletMetadata(walletId);
      if (!walletMetadata) {
        throw new Error('Wallet not found');
      }

      // If no account specified, use the first account
      let targetAccountId = accountId;
      if (!targetAccountId) {
        const accounts = await metadataStorage.getAccountsForWallet(walletId);
        if (accounts.length === 0) {
          throw new Error('No accounts found for wallet');
        }
        targetAccountId = accounts[0].id;
      }

      // Verify account exists
      const accountMetadata = await metadataStorage.getAccountMetadata(targetAccountId);
      if (!accountMetadata || accountMetadata.walletId !== walletId) {
        throw new Error('Account not found or does not belong to wallet');
      }

      this.currentWalletId = walletId;
      this.currentAccountId = targetAccountId;

      // Update app state
      const appState: AppState = {
        currentWalletId: walletId,
        currentAccountId: targetAccountId,
        currentNetworkId: 1, // Default to Ethereum mainnet
        isLocked: false,
        lastUnlockTime: Date.now(),
        sessionExpires: Date.now() + (5 * 60 * 1000), // 5 minutes
      };

      await metadataStorage.storeAppState(appState);
      this.sessionActive = true;

      console.log(`Switched to wallet: ${walletId}, account: ${targetAccountId}`);
    } catch (error) {
      console.error('Failed to switch wallet:', error);
      throw new Error('Wallet switching failed');
    }
  }

  /**
   * Get current wallet and account
   */
  getCurrentWallet(): { walletId: string | null; accountId: string | null } {
    return {
      walletId: this.currentWalletId,
      accountId: this.currentAccountId,
    };
  }

  /**
   * Create new account in existing wallet
   */
  async createAccount(walletId: string, name?: string): Promise<string> {
    try {
      // Get secure wallet data
      const secureWallet = await secureStorage.getWallet(walletId);
      if (!secureWallet) {
        throw new Error('Wallet not found');
      }

      // Get current accounts to determine next derivation path
      const currentAccounts = await metadataStorage.getAccountsForWallet(walletId);
      const accountIndex = currentAccounts.length;
      const derivationPath = `m/44'/60'/0'/0/${accountIndex}`;

      // Generate new account
      const hdNode = ethers.utils.HDNode.fromMnemonic(secureWallet.mnemonic);
      const accountNode = hdNode.derivePath(derivationPath);
      const accountId = `account_${walletId}_${accountIndex}`;

      // Update secure wallet data
      const newSecureAccount: SecureAccountData = {
        id: accountId,
        address: accountNode.address,
        privateKey: accountNode.privateKey,
        derivationPath,
        name: name || `Account ${accountIndex + 1}`,
        createdAt: Date.now(),
      };

      secureWallet.accounts.push(newSecureAccount);
      await secureStorage.storeWallet(secureWallet);

      // Store account metadata
      const accountMetadata: AccountMetadata = {
        id: accountId,
        walletId,
        address: accountNode.address,
        name: name || `Account ${accountIndex + 1}`,
        balance: '0',
        derivationPath,
        order: accountIndex,
        isHidden: false,
        lastActivity: Date.now(),
      };

      await metadataStorage.storeAccountMetadata(accountMetadata);

      // Update wallet metadata
      const walletMetadata = await metadataStorage.getWalletMetadata(walletId);
      if (walletMetadata) {
        walletMetadata.accountCount += 1;
        await metadataStorage.storeWalletMetadata(walletMetadata);
      }

      console.log(`Created account: ${accountId} for wallet: ${walletId}`);
      return accountId;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw new Error('Account creation failed');
    }
  }

  /**
   * Delete wallet (with confirmation)
   */
  async deleteWallet(walletId: string, confirmation: string): Promise<void> {
    try {
      if (confirmation !== 'DELETE') {
        throw new Error('Invalid confirmation');
      }

      // Get wallet metadata to verify it exists
      const walletMetadata = await metadataStorage.getWalletMetadata(walletId);
      if (!walletMetadata) {
        throw new Error('Wallet not found');
      }

      // Get all accounts for this wallet
      const accounts = await metadataStorage.getAccountsForWallet(walletId);

      // Delete secure wallet data (Tier 1)
      await secureStorage.deleteWallet(walletId);

      // Delete wallet metadata (Tier 2)
      await metadataStorage.deleteWalletMetadata(walletId);

      // Delete all account metadata (Tier 2)
      for (const account of accounts) {
        await metadataStorage.deleteAccountMetadata(account.id);
      }

      // Update wallet order
      const currentOrder = await metadataStorage.getWalletOrder();
      const newOrder = currentOrder.filter(id => id !== walletId);
      await metadataStorage.storeWalletOrder(newOrder);

      // If this was the current wallet, switch to another one
      if (this.currentWalletId === walletId) {
        const remainingWallets = await this.getAllWallets();
        if (remainingWallets.length > 0) {
          await this.switchToWallet(remainingWallets[0].id);
        } else {
          this.currentWalletId = null;
          this.currentAccountId = null;
          
          // Update app state
          const appState: AppState = {
            currentWalletId: null,
            currentAccountId: null,
            currentNetworkId: 1,
            isLocked: true,
            lastUnlockTime: 0,
            sessionExpires: 0,
          };
          await metadataStorage.storeAppState(appState);
        }
      }

      console.log(`Deleted wallet: ${walletId}`);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw new Error('Wallet deletion failed');
    }
  }

  /**
   * Update wallet metadata
   */
  async updateWalletMetadata(walletId: string, updates: Partial<WalletMetadata>): Promise<void> {
    try {
      const currentMetadata = await metadataStorage.getWalletMetadata(walletId);
      if (!currentMetadata) {
        throw new Error('Wallet not found');
      }

      const updatedMetadata = { ...currentMetadata, ...updates };
      await metadataStorage.storeWalletMetadata(updatedMetadata);
    } catch (error) {
      console.error('Failed to update wallet metadata:', error);
      throw new Error('Wallet metadata update failed');
    }
  }

  /**
   * Update account metadata
   */
  async updateAccountMetadata(accountId: string, updates: Partial<AccountMetadata>): Promise<void> {
    try {
      const currentMetadata = await metadataStorage.getAccountMetadata(accountId);
      if (!currentMetadata) {
        throw new Error('Account not found');
      }

      const updatedMetadata = { ...currentMetadata, ...updates };
      await metadataStorage.storeAccountMetadata(updatedMetadata);
    } catch (error) {
      console.error('Failed to update account metadata:', error);
      throw new Error('Account metadata update failed');
    }
  }

  /**
   * Get private key for current account (requires authentication)
   */
  async getCurrentAccountPrivateKey(password?: string): Promise<string> {
    try {
      if (!this.currentWalletId || !this.currentAccountId) {
        throw new Error('No active wallet or account');
      }

      if (!this.sessionActive) {
        throw new Error('Session expired, authentication required');
      }

      const secureWallet = await secureStorage.getWallet(this.currentWalletId);
      if (!secureWallet) {
        throw new Error('Wallet not found');
      }

      // Note: Password verification would be implemented at the authentication layer

      const account = secureWallet.accounts.find(acc => acc.id === this.currentAccountId);
      if (!account) {
        throw new Error('Account not found');
      }

      return account.privateKey;
    } catch (error) {
      console.error('Failed to get private key:', error);
      throw new Error('Private key access denied');
    }
  }

  /**
   * Lock the wallet system
   */
  async lock(): Promise<void> {
    try {
      this.sessionActive = false;
      
      const appState = await metadataStorage.getAppState();
      if (appState) {
        appState.isLocked = true;
        appState.sessionExpires = 0;
        await metadataStorage.storeAppState(appState);
      }

      // Clear sensitive cache
      await cacheStorage.clearAllCache();

      console.log('Wallet system locked');
    } catch (error) {
      console.error('Failed to lock wallet system:', error);
    }
  }

  /**
   * Unlock the wallet system
   */
  async unlock(password?: string): Promise<boolean> {
    try {
      // For now, just activate the session
      // In a full implementation, you'd verify the master password
      this.sessionActive = true;
      
      const appState = await metadataStorage.getAppState();
      if (appState) {
        appState.isLocked = false;
        appState.lastUnlockTime = Date.now();
        appState.sessionExpires = Date.now() + (5 * 60 * 1000); // 5 minutes
        await metadataStorage.storeAppState(appState);
      }

      console.log('Wallet system unlocked');
      return true;
    } catch (error) {
      console.error('Failed to unlock wallet system:', error);
      return false;
    }
  }

  /**
   * Check if system is locked
   */
  isLocked(): boolean {
    return !this.sessionActive;
  }

  /**
   * Export wallet mnemonic (requires authentication)
   */
  async exportWalletMnemonic(walletId: string, password?: string): Promise<string> {
    try {
      if (!this.sessionActive) {
        throw new Error('Session expired, authentication required');
      }

      const secureWallet = await secureStorage.getWallet(walletId);
      if (!secureWallet) {
        throw new Error('Wallet not found');
      }

      // Note: Password verification would be implemented at the authentication layer

      return secureWallet.mnemonic;
    } catch (error) {
      console.error('Failed to export wallet mnemonic:', error);
      throw new Error('Mnemonic export denied');
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    secureWallets: number;
    totalAccounts: number;
    metadataSize: number;
    cacheStats: any;
  }> {
    try {
      const wallets = await this.getAllWallets();
      let totalAccounts = 0;
      
      for (const wallet of wallets) {
        totalAccounts += wallet.accountCount;
      }

      const cacheStats = await cacheStorage.getCacheStats();

      return {
        secureWallets: wallets.length,
        totalAccounts,
        metadataSize: wallets.length, // Simplified
        cacheStats,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        secureWallets: 0,
        totalAccounts: 0,
        metadataSize: 0,
        cacheStats: null,
      };
    }
  }
}

export const multiWalletManager = new MultiWalletManager();
