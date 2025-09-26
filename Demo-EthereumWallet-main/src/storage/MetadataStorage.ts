/**
 * Tier 2 - Wallet Metadata and Settings Storage
 * Encrypted SQLite-like storage for wallet metadata, settings, and user preferences
 * Persists through app restarts and updates, can be recreated from Tier 1 data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

export interface WalletMetadata {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  category: string;
  isActive: boolean;
  totalValue: string;
  lastSynced: number;
  accountCount: number;
  primaryAccountAddress: string;
}

export interface AccountMetadata {
  id: string;
  walletId: string;
  address: string;
  name: string;
  balance: string;
  derivationPath: string;
  order: number;
  isHidden: boolean;
  lastActivity: number;
}

export interface NetworkSettings {
  chainId: number;
  name: string;
  rpcUrl: string;
  isCustom: boolean;
  isActive: boolean;
  gasSettings: {
    slow: string;
    standard: string;
    fast: string;
  };
}

export interface UserPreferences {
  currency: string;
  language: string;
  theme: 'dark' | 'light';
  autoLockTimeout: number;
  biometricsEnabled: boolean;
  showTestnets: boolean;
  defaultGasOption: 'slow' | 'standard' | 'fast';
  notifications: {
    transactions: boolean;
    priceAlerts: boolean;
    news: boolean;
  };
}

export interface TransactionMetadata {
  hash: string;
  walletId: string;
  accountId: string;
  type: 'send' | 'receive' | 'swap' | 'contract';
  amount: string;
  token: string;
  to: string;
  from: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  nonce?: number;
  blockNumber?: number;
}

export interface AppState {
  currentWalletId: string | null;
  currentAccountId: string | null;
  currentNetworkId: number;
  isLocked: boolean;
  lastUnlockTime: number;
  sessionExpires: number;
}

class MetadataStorageManager {
  private readonly WALLET_METADATA_PREFIX = 'metadata_wallet_';
  private readonly ACCOUNT_METADATA_PREFIX = 'metadata_account_';
  private readonly NETWORK_SETTINGS_KEY = 'metadata_network_settings';
  private readonly USER_PREFERENCES_KEY = 'metadata_user_preferences';
  private readonly TRANSACTION_METADATA_PREFIX = 'metadata_transaction_';
  private readonly APP_STATE_KEY = 'metadata_app_state';
  private readonly WALLET_ORDER_KEY = 'metadata_wallet_order';
  private readonly BACKUP_METADATA_KEY = 'metadata_backup_info';

  private encryptionKey: string;

  constructor() {
    // Use a consistent key for metadata encryption (less secure than Tier 1)
    this.encryptionKey = 'cypher_metadata_encryption_key_v1';
  }

  /**
   * Encrypt metadata
   */
  private encrypt(data: any): string {
    const jsonData = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonData, this.encryptionKey).toString();
  }

  /**
   * Decrypt metadata
   */
  private decrypt<T>(encryptedData: string): T {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonData);
    } catch (error) {
      throw new Error('Failed to decrypt metadata');
    }
  }

  /**
   * Store wallet metadata
   */
  async storeWalletMetadata(metadata: WalletMetadata): Promise<void> {
    try {
      const encryptedData = this.encrypt(metadata);
      const key = `${this.WALLET_METADATA_PREFIX}${metadata.id}`;
      await AsyncStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Failed to store wallet metadata:', error);
      throw new Error('Wallet metadata storage failed');
    }
  }

  /**
   * Get wallet metadata
   */
  async getWalletMetadata(walletId: string): Promise<WalletMetadata | null> {
    try {
      const key = `${this.WALLET_METADATA_PREFIX}${walletId}`;
      const encryptedData = await AsyncStorage.getItem(key);
      
      if (!encryptedData) return null;
      
      return this.decrypt<WalletMetadata>(encryptedData);
    } catch (error) {
      console.error('Failed to get wallet metadata:', error);
      return null;
    }
  }

  /**
   * Get all wallet metadata
   */
  async getAllWalletMetadata(): Promise<WalletMetadata[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const walletKeys = keys.filter(key => key.startsWith(this.WALLET_METADATA_PREFIX));
      
      const metadataPromises = walletKeys.map(async (key) => {
        const encryptedData = await AsyncStorage.getItem(key);
        return encryptedData ? this.decrypt<WalletMetadata>(encryptedData) : null;
      });
      
      const results = await Promise.all(metadataPromises);
      return results.filter(Boolean) as WalletMetadata[];
    } catch (error) {
      console.error('Failed to get all wallet metadata:', error);
      return [];
    }
  }

  /**
   * Delete wallet metadata
   */
  async deleteWalletMetadata(walletId: string): Promise<void> {
    try {
      const key = `${this.WALLET_METADATA_PREFIX}${walletId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete wallet metadata:', error);
    }
  }

  /**
   * Store account metadata
   */
  async storeAccountMetadata(metadata: AccountMetadata): Promise<void> {
    try {
      const encryptedData = this.encrypt(metadata);
      const key = `${this.ACCOUNT_METADATA_PREFIX}${metadata.id}`;
      await AsyncStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Failed to store account metadata:', error);
      throw new Error('Account metadata storage failed');
    }
  }

  /**
   * Get account metadata
   */
  async getAccountMetadata(accountId: string): Promise<AccountMetadata | null> {
    try {
      const key = `${this.ACCOUNT_METADATA_PREFIX}${accountId}`;
      const encryptedData = await AsyncStorage.getItem(key);
      
      if (!encryptedData) return null;
      
      return this.decrypt<AccountMetadata>(encryptedData);
    } catch (error) {
      console.error('Failed to get account metadata:', error);
      return null;
    }
  }

  /**
   * Get accounts for wallet
   */
  async getAccountsForWallet(walletId: string): Promise<AccountMetadata[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const accountKeys = keys.filter(key => key.startsWith(this.ACCOUNT_METADATA_PREFIX));
      
      const accountPromises = accountKeys.map(async (key) => {
        const encryptedData = await AsyncStorage.getItem(key);
        return encryptedData ? this.decrypt<AccountMetadata>(encryptedData) : null;
      });
      
      const results = await Promise.all(accountPromises);
      const allAccounts = results.filter(Boolean) as AccountMetadata[];
      
      return allAccounts.filter(account => account.walletId === walletId);
    } catch (error) {
      console.error('Failed to get accounts for wallet:', error);
      return [];
    }
  }

  /**
   * Store user preferences
   */
  async storeUserPreferences(preferences: UserPreferences): Promise<void> {
    try {
      const encryptedData = this.encrypt(preferences);
      await AsyncStorage.setItem(this.USER_PREFERENCES_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store user preferences:', error);
      throw new Error('User preferences storage failed');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.USER_PREFERENCES_KEY);
      
      if (!encryptedData) {
        // Return default preferences
        return {
          currency: 'USD',
          language: 'en',
          theme: 'dark',
          autoLockTimeout: 5, // 5 minutes
          biometricsEnabled: true,
          showTestnets: false,
          defaultGasOption: 'standard',
          notifications: {
            transactions: true,
            priceAlerts: true,
            news: false,
          },
        };
      }
      
      return this.decrypt<UserPreferences>(encryptedData);
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  /**
   * Store network settings
   */
  async storeNetworkSettings(networks: NetworkSettings[]): Promise<void> {
    try {
      const encryptedData = this.encrypt(networks);
      await AsyncStorage.setItem(this.NETWORK_SETTINGS_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store network settings:', error);
      throw new Error('Network settings storage failed');
    }
  }

  /**
   * Get network settings
   */
  async getNetworkSettings(): Promise<NetworkSettings[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.NETWORK_SETTINGS_KEY);
      
      if (!encryptedData) {
        // Return default networks
        return [
          {
            chainId: 1,
            name: 'Ethereum Mainnet',
            rpcUrl: 'https://ethereum.publicnode.com',
            isCustom: false,
            isActive: true,
            gasSettings: {
              slow: '20',
              standard: '25',
              fast: '30',
            },
          },
          {
            chainId: 11155111,
            name: 'Ethereum Sepolia',
            rpcUrl: 'https://ethereum-sepolia.publicnode.com',
            isCustom: false,
            isActive: false,
            gasSettings: {
              slow: '1',
              standard: '2',
              fast: '3',
            },
          },
        ];
      }
      
      return this.decrypt<NetworkSettings[]>(encryptedData);
    } catch (error) {
      console.error('Failed to get network settings:', error);
      return [];
    }
  }

  /**
   * Store app state
   */
  async storeAppState(state: AppState): Promise<void> {
    try {
      const encryptedData = this.encrypt(state);
      await AsyncStorage.setItem(this.APP_STATE_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store app state:', error);
    }
  }

  /**
   * Get app state
   */
  async getAppState(): Promise<AppState | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.APP_STATE_KEY);
      
      if (!encryptedData) return null;
      
      return this.decrypt<AppState>(encryptedData);
    } catch (error) {
      console.error('Failed to get app state:', error);
      return null;
    }
  }

  /**
   * Store wallet order
   */
  async storeWalletOrder(walletIds: string[]): Promise<void> {
    try {
      const encryptedData = this.encrypt(walletIds);
      await AsyncStorage.setItem(this.WALLET_ORDER_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store wallet order:', error);
    }
  }

  /**
   * Get wallet order
   */
  async getWalletOrder(): Promise<string[]> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.WALLET_ORDER_KEY);
      
      if (!encryptedData) return [];
      
      return this.decrypt<string[]>(encryptedData);
    } catch (error) {
      console.error('Failed to get wallet order:', error);
      return [];
    }
  }

  /**
   * Store transaction metadata
   */
  async storeTransactionMetadata(transaction: TransactionMetadata): Promise<void> {
    try {
      const encryptedData = this.encrypt(transaction);
      const key = `${this.TRANSACTION_METADATA_PREFIX}${transaction.hash}`;
      await AsyncStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('Failed to store transaction metadata:', error);
    }
  }

  /**
   * Get transaction metadata
   */
  async getTransactionMetadata(hash: string): Promise<TransactionMetadata | null> {
    try {
      const key = `${this.TRANSACTION_METADATA_PREFIX}${hash}`;
      const encryptedData = await AsyncStorage.getItem(key);
      
      if (!encryptedData) return null;
      
      return this.decrypt<TransactionMetadata>(encryptedData);
    } catch (error) {
      console.error('Failed to get transaction metadata:', error);
      return null;
    }
  }

  /**
   * Get transactions for wallet
   */
  async getTransactionsForWallet(walletId: string, limit: number = 50): Promise<TransactionMetadata[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const transactionKeys = keys.filter(key => key.startsWith(this.TRANSACTION_METADATA_PREFIX));
      
      const transactionPromises = transactionKeys.map(async (key) => {
        const encryptedData = await AsyncStorage.getItem(key);
        return encryptedData ? this.decrypt<TransactionMetadata>(encryptedData) : null;
      });
      
      const results = await Promise.all(transactionPromises);
      const allTransactions = results.filter(Boolean) as TransactionMetadata[];
      
      const walletTransactions = allTransactions
        .filter(tx => tx.walletId === walletId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
      
      return walletTransactions;
    } catch (error) {
      console.error('Failed to get transactions for wallet:', error);
      return [];
    }
  }

  /**
   * Delete account metadata
   */
  async deleteAccountMetadata(accountId: string): Promise<void> {
    try {
      const key = `${this.ACCOUNT_METADATA_PREFIX}${accountId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete account metadata:', error);
    }
  }

  /**
   * Clear all metadata (for reset)
   */
  async clearAllMetadata(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metadataKeys = keys.filter(key => 
        key.startsWith('metadata_') || 
        key.startsWith(this.WALLET_METADATA_PREFIX) ||
        key.startsWith(this.ACCOUNT_METADATA_PREFIX) ||
        key.startsWith(this.TRANSACTION_METADATA_PREFIX)
      );
      
      await AsyncStorage.multiRemove(metadataKeys);
    } catch (error) {
      console.error('Failed to clear all metadata:', error);
      throw new Error('Metadata clearing failed');
    }
  }
}

export const metadataStorage = new MetadataStorageManager();
