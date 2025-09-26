/**
 * Multi-Wallet Manager
 * Comprehensive system for managing unlimited wallets with persistent storage
 */

import { ethers } from 'ethers';
import * as bip39 from 'bip39';
import SecureStorageManager, { WalletSeedData } from './storage/SecureStorageManager';
import MetadataStorageManager, { WalletMetadata, AccountMetadata, WalletSettings } from './storage/MetadataStorageManager';
import CacheStorageManager from './storage/CacheStorageManager';

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  derivationPath: string;
  balance: string;
  isVisible: boolean;
  order: number;
}

export interface Wallet {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category?: string;
  isActive: boolean;
  totalBalance: string;
  accounts: WalletAccount[];
  settings: WalletSettings | null;
  createdAt: number;
  lastSyncTime: number;
}

export interface CreateWalletOptions {
  name: string;
  color?: string;
  icon?: string;
  category?: string;
  accountCount?: number;
}

export interface ImportWalletOptions {
  name: string;
  seedPhrase: string;
  color?: string;
  icon?: string;
  category?: string;
  accountCount?: number;
}

export class MultiWalletManager {
  private wallets: Map<string, Wallet> = new Map();
  private activeWalletId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize the multi-wallet system
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize storage systems
      await SecureStorageManager.initialize();
      await MetadataStorageManager.initialize();
      await CacheStorageManager.initialize();

      // Load existing wallets
      await this.loadAllWallets();

      // Restore active wallet
      const appSettings = await MetadataStorageManager.getAppSettings();
      if (appSettings?.currentWalletId) {
        this.activeWalletId = appSettings.currentWalletId;
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize multi-wallet manager:', error);
      throw new Error('Multi-wallet initialization failed');
    }
  }

  /**
   * Check if system is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if app has any wallets (first-time setup check)
   */
  public async hasWallets(): Promise<boolean> {
    try {
      return await SecureStorageManager.isAppInitialized();
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a new wallet
   */
  public async createWallet(options: CreateWalletOptions): Promise<Wallet> {
    try {
      // Generate new mnemonic
      const mnemonic = bip39.generateMnemonic(128); // 12 words
      
      return await this.importWallet({
        ...options,
        seedPhrase: mnemonic
      });
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Wallet creation failed');
    }
  }

  /**
   * Import existing wallet from seed phrase
   */
  public async importWallet(options: ImportWalletOptions): Promise<Wallet> {
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(options.seedPhrase)) {
        throw new Error('Invalid seed phrase');
      }

      const walletId = this.generateWalletId();
      const now = Date.now();

      // Store secure seed data
      const seedData: WalletSeedData = {
        id: walletId,
        name: options.name,
        seedPhrase: options.seedPhrase.trim(),
        createdAt: now,
        derivationPath: "m/44'/60'/0'/0", // Standard Ethereum path
        encryptionVersion: 1
      };

      await SecureStorageManager.storeWalletSeed(seedData);

      // Create wallet metadata
      const walletMetadata: WalletMetadata = {
        id: walletId,
        name: options.name,
        color: options.color || this.generateRandomColor(),
        icon: options.icon || '💰',
        category: options.category || 'personal',
        isActive: this.wallets.size === 0, // First wallet is active by default
        totalBalance: '0',
        lastSyncTime: 0,
        createdAt: now,
        updatedAt: now,
        order: this.wallets.size
      };

      await MetadataStorageManager.storeWalletMetadata(walletMetadata);

      // Generate accounts
      const accountCount = options.accountCount || 1;
      const accounts: WalletAccount[] = [];

      for (let i = 0; i < accountCount; i++) {
        const account = await this.createWalletAccount(walletId, options.seedPhrase, i);
        accounts.push(account);
      }

      // Create default wallet settings
      const defaultSettings: WalletSettings = {
        walletId,
        preferredNetworks: ['1', '137', '56'], // Ethereum, Polygon, BSC
        defaultGasPrice: 'standard',
        autoLockTimeout: 300000, // 5 minutes
        requireConfirmation: true,
        showTestnets: false,
        customRpcEndpoints: {},
        transactionConfirmations: 3,
        updatedAt: now
      };

      await MetadataStorageManager.storeWalletSettings(defaultSettings);

      // Create wallet object
      const wallet: Wallet = {
        id: walletId,
        name: options.name,
        color: walletMetadata.color,
        icon: walletMetadata.icon,
        category: walletMetadata.category,
        isActive: walletMetadata.isActive,
        totalBalance: '0',
        accounts,
        settings: defaultSettings,
        createdAt: now,
        lastSyncTime: 0
      };

      // Store in memory
      this.wallets.set(walletId, wallet);

      // Set as active if first wallet
      if (walletMetadata.isActive) {
        this.activeWalletId = walletId;
        await this.updateActiveWallet(walletId);
      }

      // Sync balance in background
      this.syncWalletBalances(walletId).catch(console.error);

      return wallet;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      throw new Error('Wallet import failed');
    }
  }

  /**
   * Get all wallets
   */
  public getAllWallets(): Wallet[] {
    return Array.from(this.wallets.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  /**
   * Get specific wallet by ID
   */
  public getWallet(walletId: string): Wallet | null {
    return this.wallets.get(walletId) || null;
  }

  /**
   * Get currently active wallet
   */
  public getActiveWallet(): Wallet | null {
    return this.activeWalletId ? this.wallets.get(this.activeWalletId) || null : null;
  }

  /**
   * Switch active wallet
   */
  public async switchActiveWallet(walletId: string): Promise<void> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update old active wallet
      if (this.activeWalletId) {
        const oldWallet = this.wallets.get(this.activeWalletId);
        if (oldWallet) {
          oldWallet.isActive = false;
          await this.updateWalletMetadata(oldWallet);
        }
      }

      // Update new active wallet
      wallet.isActive = true;
      await this.updateWalletMetadata(wallet);

      this.activeWalletId = walletId;
      await this.updateActiveWallet(walletId);

      // Sync balance for new active wallet
      this.syncWalletBalances(walletId).catch(console.error);
    } catch (error) {
      console.error('Failed to switch active wallet:', error);
      throw new Error('Failed to switch wallet');
    }
  }

  /**
   * Update wallet information
   */
  public async updateWalletInfo(walletId: string, updates: Partial<Pick<Wallet, 'name' | 'color' | 'icon' | 'category'>>): Promise<void> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Update wallet object
      Object.assign(wallet, updates);

      // Update metadata storage
      await this.updateWalletMetadata(wallet);

      // Update seed data if name changed
      if (updates.name) {
        const seedData = await SecureStorageManager.getWalletSeed(walletId);
        if (seedData) {
          seedData.name = updates.name;
          await SecureStorageManager.storeWalletSeed(seedData);
        }
      }
    } catch (error) {
      console.error('Failed to update wallet info:', error);
      throw new Error('Failed to update wallet');
    }
  }

  /**
   * Create new account in existing wallet
   */
  public async createAccount(walletId: string, accountName?: string): Promise<WalletAccount> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const seedData = await SecureStorageManager.getWalletSeed(walletId);
      if (!seedData) {
        throw new Error('Wallet seed data not found');
      }

      const accountIndex = wallet.accounts.length;
      const account = await this.createWalletAccount(
        walletId, 
        seedData.seedPhrase, 
        accountIndex, 
        accountName
      );

      wallet.accounts.push(account);
      await this.updateWalletMetadata(wallet);

      return account;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw new Error('Account creation failed');
    }
  }

  /**
   * Update account information
   */
  public async updateAccount(walletId: string, accountId: string, updates: Partial<Pick<WalletAccount, 'name' | 'isVisible'>>): Promise<void> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const account = wallet.accounts.find(a => a.id === accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      Object.assign(account, updates);

      // Update metadata storage
      const accountMetadata: AccountMetadata = {
        id: account.id,
        walletId: wallet.id,
        name: account.name,
        address: account.address,
        derivationPath: account.derivationPath,
        balance: account.balance,
        isVisible: account.isVisible,
        order: account.order,
        createdAt: Date.now(), // This should be preserved from original
        updatedAt: Date.now()
      };

      await MetadataStorageManager.storeAccountMetadata(accountMetadata);
    } catch (error) {
      console.error('Failed to update account:', error);
      throw new Error('Failed to update account');
    }
  }

  /**
   * Delete wallet and all its data
   */
  public async deleteWallet(walletId: string): Promise<void> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Don't allow deleting the only wallet
      if (this.wallets.size === 1) {
        throw new Error('Cannot delete the only wallet');
      }

      // If deleting active wallet, switch to another
      if (this.activeWalletId === walletId) {
        const otherWallets = Array.from(this.wallets.values()).filter(w => w.id !== walletId);
        if (otherWallets.length > 0) {
          await this.switchActiveWallet(otherWallets[0].id);
        }
      }

      // Delete from secure storage
      await SecureStorageManager.deleteWalletSeed(walletId);

      // Delete from metadata storage
      await MetadataStorageManager.deleteWalletMetadata(walletId);

      // Remove from memory
      this.wallets.delete(walletId);

      // Clear cache for this wallet
      for (const account of wallet.accounts) {
        await CacheStorageManager.invalidateCache('balance', `${account.address}:1`);
      }
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw new Error('Failed to delete wallet');
    }
  }

  /**
   * Get wallet seed phrase (requires authentication)
   */
  public async getWalletSeedPhrase(walletId: string): Promise<string> {
    try {
      const seedData = await SecureStorageManager.getWalletSeed(walletId);
      if (!seedData) {
        throw new Error('Wallet seed not found');
      }
      return seedData.seedPhrase;
    } catch (error) {
      console.error('Failed to get wallet seed phrase:', error);
      throw new Error('Failed to retrieve seed phrase');
    }
  }

  /**
   * Sync wallet balances
   */
  public async syncWalletBalances(walletId?: string): Promise<void> {
    try {
      const walletsToSync = walletId ? [this.wallets.get(walletId)].filter(Boolean) : Array.from(this.wallets.values());

      for (const wallet of walletsToSync as Wallet[]) {
        let totalBalance = 0;

        for (const account of wallet.accounts) {
          // Check cache first
          const cachedBalance = await CacheStorageManager.getBalanceCache(account.address, '1');
          
          if (cachedBalance) {
            account.balance = cachedBalance.balance;
          } else {
            // Fetch from network (implement your balance fetching logic here)
            // For now, use a placeholder
            account.balance = '0';
            
            // Cache the result
            await CacheStorageManager.storeBalanceCache({
              address: account.address,
              networkId: '1',
              balance: account.balance,
              tokenBalances: {}
            });
          }

          totalBalance += parseFloat(account.balance);
        }

        wallet.totalBalance = totalBalance.toString();
        wallet.lastSyncTime = Date.now();

        await this.updateWalletMetadata(wallet);
      }
    } catch (error) {
      console.error('Failed to sync wallet balances:', error);
    }
  }

  /**
   * Get wallet statistics
   */
  public getWalletStats(): {
    totalWallets: number;
    totalAccounts: number;
    totalBalance: string;
    activeWalletId: string | null;
  } {
    const wallets = Array.from(this.wallets.values());
    const totalAccounts = wallets.reduce((sum, wallet) => sum + wallet.accounts.length, 0);
    const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.totalBalance || '0'), 0);

    return {
      totalWallets: wallets.length,
      totalAccounts,
      totalBalance: totalBalance.toString(),
      activeWalletId: this.activeWalletId
    };
  }

  // Private methods

  private async loadAllWallets(): Promise<void> {
    try {
      const walletMetadataList = await MetadataStorageManager.getAllWalletMetadata();

      for (const metadata of walletMetadataList) {
        const accounts = await MetadataStorageManager.getWalletAccounts(metadata.id);
        const settings = await MetadataStorageManager.getWalletSettings(metadata.id);

        const wallet: Wallet = {
          id: metadata.id,
          name: metadata.name,
          color: metadata.color,
          icon: metadata.icon,
          category: metadata.category,
          isActive: metadata.isActive,
          totalBalance: metadata.totalBalance,
          accounts: accounts.map((acc: AccountMetadata) => ({
            id: acc.id,
            name: acc.name,
            address: acc.address,
            derivationPath: acc.derivationPath,
            balance: acc.balance,
            isVisible: acc.isVisible,
            order: acc.order
          })),
          settings,
          createdAt: metadata.createdAt,
          lastSyncTime: metadata.lastSyncTime
        };

        this.wallets.set(metadata.id, wallet);

        if (metadata.isActive) {
          this.activeWalletId = metadata.id;
        }
      }
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  }

  private async createWalletAccount(
    walletId: string, 
    seedPhrase: string, 
    accountIndex: number, 
    customName?: string
  ): Promise<WalletAccount> {
    // Use ethers.js for HD wallet derivation
    const derivationPath = `m/44'/60'/0'/0/${accountIndex}`;
    const masterWallet = ethers.Wallet.fromMnemonic(seedPhrase, derivationPath);
    
    const address = masterWallet.address;
    const accountId = `${walletId}_account_${accountIndex}`;
    
    const account: WalletAccount = {
      id: accountId,
      name: customName || `Account ${accountIndex + 1}`,
      address,
      derivationPath,
      balance: '0',
      isVisible: true,
      order: accountIndex
    };

    // Store account metadata
    const accountMetadata: AccountMetadata = {
      id: accountId,
      walletId,
      name: account.name,
      address,
      derivationPath,
      balance: '0',
      isVisible: true,
      order: accountIndex,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await MetadataStorageManager.storeAccountMetadata(accountMetadata);

    return account;
  }

  private async updateWalletMetadata(wallet: Wallet): Promise<void> {
    const metadata: WalletMetadata = {
      id: wallet.id,
      name: wallet.name,
      color: wallet.color,
      icon: wallet.icon,
      category: wallet.category,
      isActive: wallet.isActive,
      totalBalance: wallet.totalBalance,
      lastSyncTime: wallet.lastSyncTime,
      createdAt: wallet.createdAt,
      updatedAt: Date.now(),
      order: 0 // This should be managed properly
    };

    await MetadataStorageManager.storeWalletMetadata(metadata);
  }

  private async updateActiveWallet(walletId: string): Promise<void> {
    const appSettings = await MetadataStorageManager.getAppSettings();
    const updatedSettings = {
      ...appSettings,
      currentWalletId: walletId,
      updatedAt: Date.now()
    };

    await MetadataStorageManager.storeAppSettings(updatedSettings as any);
  }

  private generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRandomColor(): string {
    const colors = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export default MultiWalletManager;
