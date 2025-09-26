/**
 * Tier 2 - Wallet Metadata and Settings Manager
 * Handles wallet metadata, settings, account information, and transaction history
 * Uses encrypted SQLite database for structured data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CryptoJS from 'crypto-js';

export interface WalletMetadata {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  category?: string;
  isActive: boolean;
  totalBalance: string;
  lastSyncTime: number;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface AccountMetadata {
  id: string;
  walletId: string;
  name: string;
  address: string;
  derivationPath: string;
  balance: string;
  isVisible: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface WalletSettings {
  walletId: string;
  preferredNetworks: string[];
  defaultGasPrice: string;
  autoLockTimeout: number;
  requireConfirmation: boolean;
  showTestnets: boolean;
  customRpcEndpoints: { [networkId: string]: string[] };
  transactionConfirmations: number;
  updatedAt: number;
}

export interface AppSettings {
  currentWalletId: string | null;
  authMethod: 'password' | 'pin' | 'biometric';
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  biometricEnabled: boolean;
  sessionTimeout: number;
  securityWarningsEnabled: boolean;
  backupRemindersEnabled: boolean;
  lastBackupTime: number;
  appVersion: string;
  firstInstallTime: number;
  updatedAt: number;
  autoBackup?: {
    enabled: boolean;
    lastBackup: number;
    intervalDays: number;
    password?: string;
  };
}

export interface TransactionRecord {
  id: string;
  walletId: string;
  accountId: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  blockHash?: string;
  timestamp: number;
  networkId: string;
  type: 'send' | 'receive' | 'contract';
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  notes?: string;
}

export class MetadataStorageManager {
  private static readonly WALLETS_METADATA_KEY = 'WALLETS_METADATA';
  private static readonly ACCOUNTS_METADATA_KEY = 'ACCOUNTS_METADATA';
  private static readonly WALLET_SETTINGS_KEY = 'WALLET_SETTINGS';
  private static readonly APP_SETTINGS_KEY = 'APP_SETTINGS';
  private static readonly TRANSACTIONS_KEY = 'TRANSACTION_RECORDS';
  private static readonly ENCRYPTION_KEY = 'METADATA_ENCRYPTION_KEY';

  private static encryptionKey: string | null = null;

  /**
   * Initialize metadata storage
   */
  public static async initialize(): Promise<void> {
    try {
      await this.ensureEncryptionKey();
      await this.migrateIfNeeded();
    } catch (error) {
      console.error('Failed to initialize metadata storage:', error);
      throw new Error('Metadata storage initialization failed');
    }
  }

  /**
   * Get all wallet metadata
   */
  public static async getAllWalletMetadata(): Promise<WalletMetadata[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.WALLETS_METADATA_KEY);
      if (!encryptedData) return [];

      const decryptedData = await this.decryptData(encryptedData);
      const wallets = JSON.parse(decryptedData) as WalletMetadata[];
      
      // Sort by order
      return wallets.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Failed to get wallet metadata:', error);
      return [];
    }
  }

  /**
   * Store wallet metadata
   */
  public static async storeWalletMetadata(wallet: WalletMetadata): Promise<void> {
    try {
      const existingWallets = await this.getAllWalletMetadata();
      const updatedWallets = existingWallets.filter(w => w.id !== wallet.id);
      
      updatedWallets.push({
        ...wallet,
        updatedAt: Date.now()
      });

      const encryptedData = await this.encryptData(JSON.stringify(updatedWallets));
      await AsyncStorage.setItem(this.WALLETS_METADATA_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store wallet metadata:', error);
      throw new Error('Failed to store wallet metadata');
    }
  }

  /**
   * Get wallet metadata by ID
   */
  public static async getWalletMetadata(walletId: string): Promise<WalletMetadata | null> {
    try {
      const allWallets = await this.getAllWalletMetadata();
      return allWallets.find(w => w.id === walletId) || null;
    } catch (error) {
      console.error('Failed to get wallet metadata:', error);
      return null;
    }
  }

  /**
   * Delete wallet metadata
   */
  public static async deleteWalletMetadata(walletId: string): Promise<void> {
    try {
      const existingWallets = await this.getAllWalletMetadata();
      const filteredWallets = existingWallets.filter(w => w.id !== walletId);
      
      const encryptedData = await this.encryptData(JSON.stringify(filteredWallets));
      await AsyncStorage.setItem(this.WALLETS_METADATA_KEY, encryptedData);

      // Also delete related data
      await this.deleteWalletAccounts(walletId);
      await this.deleteWalletSettings(walletId);
      await this.deleteWalletTransactions(walletId);
    } catch (error) {
      console.error('Failed to delete wallet metadata:', error);
      throw new Error('Failed to delete wallet metadata');
    }
  }

  /**
   * Get accounts for wallet
   */
  public static async getWalletAccounts(walletId: string): Promise<AccountMetadata[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.ACCOUNTS_METADATA_KEY);
      if (!encryptedData) return [];

      const decryptedData = await this.decryptData(encryptedData);
      const allAccounts = JSON.parse(decryptedData) as AccountMetadata[];
      
      return allAccounts
        .filter(account => account.walletId === walletId)
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Failed to get wallet accounts:', error);
      return [];
    }
  }

  /**
   * Store account metadata
   */
  public static async storeAccountMetadata(account: AccountMetadata): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.ACCOUNTS_METADATA_KEY);
      let allAccounts: AccountMetadata[] = [];
      
      if (encryptedData) {
        const decryptedData = await this.decryptData(encryptedData);
        allAccounts = JSON.parse(decryptedData) as AccountMetadata[];
      }

      const updatedAccounts = allAccounts.filter(a => a.id !== account.id);
      updatedAccounts.push({
        ...account,
        updatedAt: Date.now()
      });

      const newEncryptedData = await this.encryptData(JSON.stringify(updatedAccounts));
      await AsyncStorage.setItem(this.ACCOUNTS_METADATA_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to store account metadata:', error);
      throw new Error('Failed to store account metadata');
    }
  }

  /**
   * Delete wallet accounts
   */
  public static async deleteWalletAccounts(walletId: string): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.ACCOUNTS_METADATA_KEY);
      if (!encryptedData) return;

      const decryptedData = await this.decryptData(encryptedData);
      const allAccounts = JSON.parse(decryptedData) as AccountMetadata[];
      
      const filteredAccounts = allAccounts.filter(a => a.walletId !== walletId);
      
      const newEncryptedData = await this.encryptData(JSON.stringify(filteredAccounts));
      await AsyncStorage.setItem(this.ACCOUNTS_METADATA_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to delete wallet accounts:', error);
    }
  }

  /**
   * Get wallet settings
   */
  public static async getWalletSettings(walletId: string): Promise<WalletSettings | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.WALLET_SETTINGS_KEY);
      if (!encryptedData) return null;

      const decryptedData = await this.decryptData(encryptedData);
      const allSettings = JSON.parse(decryptedData) as WalletSettings[];
      
      return allSettings.find(s => s.walletId === walletId) || null;
    } catch (error) {
      console.error('Failed to get wallet settings:', error);
      return null;
    }
  }

  /**
   * Store wallet settings
   */
  public static async storeWalletSettings(settings: WalletSettings): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.WALLET_SETTINGS_KEY);
      let allSettings: WalletSettings[] = [];
      
      if (encryptedData) {
        const decryptedData = await this.decryptData(encryptedData);
        allSettings = JSON.parse(decryptedData) as WalletSettings[];
      }

      const updatedSettings = allSettings.filter(s => s.walletId !== settings.walletId);
      updatedSettings.push({
        ...settings,
        updatedAt: Date.now()
      });

      const newEncryptedData = await this.encryptData(JSON.stringify(updatedSettings));
      await AsyncStorage.setItem(this.WALLET_SETTINGS_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to store wallet settings:', error);
      throw new Error('Failed to store wallet settings');
    }
  }

  /**
   * Delete wallet settings
   */
  public static async deleteWalletSettings(walletId: string): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.WALLET_SETTINGS_KEY);
      if (!encryptedData) return;

      const decryptedData = await this.decryptData(encryptedData);
      const allSettings = JSON.parse(decryptedData) as WalletSettings[];
      
      const filteredSettings = allSettings.filter(s => s.walletId !== walletId);
      
      const newEncryptedData = await this.encryptData(JSON.stringify(filteredSettings));
      await AsyncStorage.setItem(this.WALLET_SETTINGS_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to delete wallet settings:', error);
    }
  }

  /**
   * Get app settings
   */
  public static async getAppSettings(): Promise<AppSettings | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.APP_SETTINGS_KEY);
      if (!encryptedData) return null;

      const decryptedData = await this.decryptData(encryptedData);
      return JSON.parse(decryptedData) as AppSettings;
    } catch (error) {
      console.error('Failed to get app settings:', error);
      return null;
    }
  }

  /**
   * Store app settings
   */
  public static async storeAppSettings(settings: AppSettings): Promise<void> {
    try {
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: Date.now()
      };

      const encryptedData = await this.encryptData(JSON.stringify(settingsWithTimestamp));
      await AsyncStorage.setItem(this.APP_SETTINGS_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store app settings:', error);
      throw new Error('Failed to store app settings');
    }
  }

  /**
   * Store transaction record
   */
  public static async storeTransactionRecord(transaction: TransactionRecord): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.TRANSACTIONS_KEY);
      let allTransactions: TransactionRecord[] = [];
      
      if (encryptedData) {
        const decryptedData = await this.decryptData(encryptedData);
        allTransactions = JSON.parse(decryptedData) as TransactionRecord[];
      }

      const updatedTransactions = allTransactions.filter(t => t.id !== transaction.id);
      updatedTransactions.push(transaction);

      // Keep only last 10000 transactions to prevent storage bloat
      if (updatedTransactions.length > 10000) {
        updatedTransactions.sort((a, b) => b.timestamp - a.timestamp);
        updatedTransactions.splice(10000);
      }

      const newEncryptedData = await this.encryptData(JSON.stringify(updatedTransactions));
      await AsyncStorage.setItem(this.TRANSACTIONS_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to store transaction record:', error);
      throw new Error('Failed to store transaction record');
    }
  }

  /**
   * Get wallet transactions
   */
  public static async getWalletTransactions(walletId: string, limit?: number): Promise<TransactionRecord[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.TRANSACTIONS_KEY);
      if (!encryptedData) return [];

      const decryptedData = await this.decryptData(encryptedData);
      const allTransactions = JSON.parse(decryptedData) as TransactionRecord[];
      
      let walletTransactions = allTransactions
        .filter(t => t.walletId === walletId)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (limit) {
        walletTransactions = walletTransactions.slice(0, limit);
      }

      return walletTransactions;
    } catch (error) {
      console.error('Failed to get wallet transactions:', error);
      return [];
    }
  }

  /**
   * Delete wallet transactions
   */
  public static async deleteWalletTransactions(walletId: string): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.TRANSACTIONS_KEY);
      if (!encryptedData) return;

      const decryptedData = await this.decryptData(encryptedData);
      const allTransactions = JSON.parse(decryptedData) as TransactionRecord[];
      
      const filteredTransactions = allTransactions.filter(t => t.walletId !== walletId);
      
      const newEncryptedData = await this.encryptData(JSON.stringify(filteredTransactions));
      await AsyncStorage.setItem(this.TRANSACTIONS_KEY, newEncryptedData);
    } catch (error) {
      console.error('Failed to delete wallet transactions:', error);
    }
  }

  /**
   * Clear all metadata
   */
  public static async clearAllMetadata(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.WALLETS_METADATA_KEY,
        this.ACCOUNTS_METADATA_KEY,
        this.WALLET_SETTINGS_KEY,
        this.APP_SETTINGS_KEY,
        this.TRANSACTIONS_KEY,
        this.ENCRYPTION_KEY
      ]);
      this.encryptionKey = null;
    } catch (error) {
      console.error('Failed to clear metadata:', error);
      throw new Error('Failed to clear metadata');
    }
  }

  // Private methods

  private static async ensureEncryptionKey(): Promise<void> {
    if (this.encryptionKey) return;

    try {
      let storedKey = await AsyncStorage.getItem(this.ENCRYPTION_KEY);
      
      if (!storedKey) {
        storedKey = CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Hex);
        await AsyncStorage.setItem(this.ENCRYPTION_KEY, storedKey);
      }

      this.encryptionKey = storedKey;
    } catch (error) {
      console.error('Failed to ensure encryption key:', error);
      throw new Error('Encryption key generation failed');
    }
  }

  private static async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.ensureEncryptionKey();
    }

    try {
      return CryptoJS.AES.encrypt(data, this.encryptionKey!).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  private static async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.ensureEncryptionKey();
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey!);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  private static async migrateIfNeeded(): Promise<void> {
    // Future metadata migrations will be implemented here
    return Promise.resolve();
  }
}

export default MetadataStorageManager;
