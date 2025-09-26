import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';

/**
 * Secure Storage Manager for Ultimate Persistent Multi-Wallet System
 * Handles wallet seeds, authentication data, and sensitive information
 * Uses device's most secure storage layer (Keychain/Android Keystore) with AsyncStorage fallback
 */

export interface WalletSeedData {
  id: string;
  name: string;
  seedPhrase: string;
  createdAt: number;
  derivationPath: string;
  encryptionVersion: number;
}

export interface AuthenticationData {
  passwordHash: string;
  salt: string;
  authMethod: 'password' | 'pin' | 'biometric';
  createdAt: number;
  lastUpdated: number;
}

export class SecureStorageManager {
  private static readonly MASTER_KEY = 'ETHEREUM_WALLET_MASTER_KEY';
  private static readonly WALLETS_KEY = 'ENCRYPTED_WALLET_SEEDS';
  private static readonly AUTH_KEY = 'AUTHENTICATION_DATA';
  private static readonly STORAGE_VERSION = '1.0.0';

  private static masterKey: string | null = null;

  /**
   * Initialize secure storage system
   */
  public static async initialize(): Promise<void> {
    try {
      await this.ensureMasterKey();
      await this.migrateIfNeeded();
      console.log('✅ SecureStorageManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw new Error('Secure storage initialization failed');
    }
  }

  /**
   * Check if app has been initialized (has any wallet data)
   */
  public static async isAppInitialized(): Promise<boolean> {
    try {
      const wallets = await this.getAllWalletSeeds();
      return wallets.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Store encrypted wallet seed data
   */
  public static async storeWalletSeed(walletData: WalletSeedData): Promise<void> {
    try {
      const existingWallets = await this.getAllWalletSeeds();
      existingWallets.push(walletData);
      
      const encryptedData = await this.encryptData(JSON.stringify(existingWallets));
      
      // Try Keychain first, fallback to AsyncStorage
      try {
        await Keychain.setInternetCredentials(
          this.WALLETS_KEY,
          'wallets',
          encryptedData,
          {
            service: 'EthereumWallet',
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          }
        );
      } catch (keychainError) {
        console.warn('Failed to store wallets in Keychain, using AsyncStorage:', keychainError);
        await AsyncStorage.setItem(this.WALLETS_KEY, encryptedData);
      }
    } catch (error) {
      console.error('Failed to store wallet seed:', error);
      throw new Error('Failed to store secure wallet data');
    }
  }

  /**
   * Retrieve all wallet seed data
   */
  public static async getAllWalletSeeds(): Promise<WalletSeedData[]> {
    try {
      let encryptedData: string | null = null;
      
      // Try Keychain first
      try {
        const keychainResult = await Keychain.getInternetCredentials(this.WALLETS_KEY);
        if (keychainResult && keychainResult.password) {
          encryptedData = keychainResult.password;
        }
      } catch (keychainError) {
        console.warn('Failed to get wallets from Keychain, trying AsyncStorage:', keychainError);
      }
      
      // Fallback to AsyncStorage
      if (!encryptedData) {
        encryptedData = await AsyncStorage.getItem(this.WALLETS_KEY);
      }
      
      if (!encryptedData) {
        return [];
      }

      const decryptedData = await this.decryptData(encryptedData);
      return JSON.parse(decryptedData) as WalletSeedData[];
    } catch (error) {
      console.error('Failed to retrieve wallet seeds:', error);
      return [];
    }
  }

  /**
   * Get specific wallet seed data
   */
  public static async getWalletSeed(walletId: string): Promise<WalletSeedData | null> {
    try {
      const allWallets = await this.getAllWalletSeeds();
      return allWallets.find(w => w.id === walletId) || null;
    } catch (error) {
      console.error('Failed to get wallet seed:', error);
      return null;
    }
  }

  /**
   * Delete wallet seed data
   */
  public static async deleteWalletSeed(walletId: string): Promise<void> {
    try {
      const existingWallets = await this.getAllWalletSeeds();
      const filteredWallets = existingWallets.filter(w => w.id !== walletId);
      
      const encryptedData = await this.encryptData(JSON.stringify(filteredWallets));
      
      if (filteredWallets.length === 0) {
        // Remove from both storage locations
        try {
          await Keychain.resetInternetCredentials(this.WALLETS_KEY);
        } catch (error) {
          console.warn('Failed to remove from Keychain:', error);
        }
        await AsyncStorage.removeItem(this.WALLETS_KEY);
      } else {
        // Store updated list
        try {
          await Keychain.setInternetCredentials(this.WALLETS_KEY, 'wallets', encryptedData);
        } catch (keychainError) {
          await AsyncStorage.setItem(this.WALLETS_KEY, encryptedData);
        }
      }
    } catch (error) {
      console.error('Failed to delete wallet seed:', error);
      throw new Error('Failed to delete wallet data');
    }
  }

  /**
   * Store authentication data
   */
  public static async storeAuthenticationData(authData: AuthenticationData): Promise<void> {
    try {
      const encryptedData = await this.encryptData(JSON.stringify(authData));
      
      // Try Keychain first, fallback to AsyncStorage
      try {
        await Keychain.setInternetCredentials(
          this.AUTH_KEY,
          'auth',
          encryptedData,
          {
            service: 'EthereumWallet',
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          }
        );
      } catch (keychainError) {
        console.warn('Failed to store auth in Keychain, using AsyncStorage:', keychainError);
        await AsyncStorage.setItem(this.AUTH_KEY, encryptedData);
      }
    } catch (error) {
      console.error('Failed to store authentication data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Retrieve authentication data
   */
  public static async getAuthenticationData(): Promise<AuthenticationData | null> {
    try {
      let encryptedData: string | null = null;
      
      // Try Keychain first
      try {
        const keychainResult = await Keychain.getInternetCredentials(this.AUTH_KEY);
        if (keychainResult && keychainResult.password) {
          encryptedData = keychainResult.password;
        }
      } catch (keychainError) {
        console.warn('Failed to get auth from Keychain, trying AsyncStorage:', keychainError);
      }
      
      // Fallback to AsyncStorage
      if (!encryptedData) {
        encryptedData = await AsyncStorage.getItem(this.AUTH_KEY);
      }
      
      if (!encryptedData) {
        return null;
      }

      const decryptedData = await this.decryptData(encryptedData);
      return JSON.parse(decryptedData) as AuthenticationData;
    } catch (error) {
      console.error('Failed to retrieve authentication data:', error);
      return null;
    }
  }

  /**
   * Clear all secure data (complete reset)
   */
  public static async clearAllData(): Promise<void> {
    try {
      // Clear from Keychain
      try {
        await Keychain.resetInternetCredentials(this.MASTER_KEY);
        await Keychain.resetInternetCredentials(this.WALLETS_KEY);
        await Keychain.resetInternetCredentials(this.AUTH_KEY);
      } catch (error) {
        console.warn('Failed to clear some Keychain data:', error);
      }
      
      // Clear from AsyncStorage
      await AsyncStorage.multiRemove([
        this.WALLETS_KEY,
        this.AUTH_KEY,
        this.MASTER_KEY,
        'STORAGE_VERSION'
      ]);
      
      this.masterKey = null;
      console.log('🚨 All secure data cleared');
    } catch (error) {
      console.error('Failed to clear secure data:', error);
      throw new Error('Failed to clear secure data');
    }
  }

  /**
   * Create backup of all secure data
   */
  public static async createSecureBackup(): Promise<string> {
    try {
      const wallets = await this.getAllWalletSeeds();
      const auth = await this.getAuthenticationData();
      
      const backupData = {
        version: this.STORAGE_VERSION,
        timestamp: Date.now(),
        wallets,
        auth,
        platform: Platform.OS
      };

      return await this.encryptData(JSON.stringify(backupData));
    } catch (error) {
      console.error('Failed to create secure backup:', error);
      throw new Error('Failed to create backup');
    }
  }

  /**
   * Restore from secure backup
   */
  public static async restoreFromBackup(encryptedBackup: string): Promise<void> {
    try {
      const decryptedData = await this.decryptData(encryptedBackup);
      const backupData = JSON.parse(decryptedData);

      if (backupData.wallets && Array.isArray(backupData.wallets)) {
        const encryptedWallets = await this.encryptData(JSON.stringify(backupData.wallets));
        try {
          await Keychain.setInternetCredentials(this.WALLETS_KEY, 'wallets', encryptedWallets);
        } catch (keychainError) {
          await AsyncStorage.setItem(this.WALLETS_KEY, encryptedWallets);
        }
      }

      if (backupData.auth) {
        const encryptedAuth = await this.encryptData(JSON.stringify(backupData.auth));
        try {
          await Keychain.setInternetCredentials(this.AUTH_KEY, 'auth', encryptedAuth);
        } catch (keychainError) {
          await AsyncStorage.setItem(this.AUTH_KEY, encryptedAuth);
        }
      }
      
      console.log('✅ Successfully restored from backup');
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw new Error('Failed to restore backup');
    }
  }

  // Private methods

  private static async ensureMasterKey(): Promise<void> {
    if (this.masterKey) return;

    try {
      // Try to get master key from Keychain (most secure)
      const keychainResult = await Keychain.getInternetCredentials(this.MASTER_KEY);
      
      if (keychainResult && keychainResult.password) {
        this.masterKey = keychainResult.password;
        return;
      }

      // Fallback to AsyncStorage for older installations
      let storedKey = await AsyncStorage.getItem(this.MASTER_KEY);
      
      if (!storedKey) {
        // Generate new master key
        storedKey = CryptoJS.lib.WordArray.random(256/8).toString(CryptoJS.enc.Hex);
        
        // Store in Keychain (preferred)
        try {
          await Keychain.setInternetCredentials(
            this.MASTER_KEY,
            'master',
            storedKey,
            {
              service: 'EthereumWallet',
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
            }
          );
        } catch (keychainError) {
          console.warn('Failed to store key in Keychain, using AsyncStorage:', keychainError);
          await AsyncStorage.setItem(this.MASTER_KEY, storedKey);
        }
      } else {
        // Migrate from AsyncStorage to Keychain
        try {
          await Keychain.setInternetCredentials(
            this.MASTER_KEY,
            'master',
            storedKey,
            {
              service: 'EthereumWallet',
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
            }
          );
          // Remove from AsyncStorage after successful migration
          await AsyncStorage.removeItem(this.MASTER_KEY);
        } catch (keychainError) {
          console.warn('Failed to migrate to Keychain:', keychainError);
        }
      }

      this.masterKey = storedKey;
    } catch (error) {
      console.error('Failed to ensure master key:', error);
      throw new Error('Master key generation failed');
    }
  }

  private static async encryptData(data: string): Promise<string> {
    if (!this.masterKey) {
      await this.ensureMasterKey();
    }

    try {
      const encrypted = CryptoJS.AES.encrypt(data, this.masterKey!).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  private static async decryptData(encryptedData: string): Promise<string> {
    if (!this.masterKey) {
      await this.ensureMasterKey();
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey!);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption resulted in empty string');
      }
      
      return decryptedString;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  private static async migrateIfNeeded(): Promise<void> {
    try {
      const currentVersion = await AsyncStorage.getItem('STORAGE_VERSION');
      
      if (!currentVersion || currentVersion !== this.STORAGE_VERSION) {
        await this.performDataMigration(currentVersion);
        await AsyncStorage.setItem('STORAGE_VERSION', this.STORAGE_VERSION);
      }
    } catch (error) {
      console.warn('Data migration failed:', error);
      // Migration failure is not critical, continue with current data
    }
  }

  private static async performDataMigration(fromVersion: string | null): Promise<void> {
    console.log(`Migrating data from version ${fromVersion} to ${this.STORAGE_VERSION}`);
    
    // Future migrations will be implemented here
    // For now, no migration needed as this is the initial version
  }

  /**
   * Get storage system status
   */
  public static async getStorageStatus(): Promise<{
    keychainAvailable: boolean;
    masterKeyExists: boolean;
    walletsCount: number;
    authDataExists: boolean;
  }> {
    let keychainAvailable = false;
    let masterKeyExists = false;
    let authDataExists = false;
    let walletsCount = 0;

    try {
      await Keychain.getSupportedBiometryType();
      keychainAvailable = true;
    } catch (error) {
      keychainAvailable = false;
    }

    try {
      const wallets = await this.getAllWalletSeeds();
      walletsCount = wallets.length;
    } catch (error) {
      walletsCount = 0;
    }

    try {
      const auth = await this.getAuthenticationData();
      authDataExists = !!auth;
    } catch (error) {
      authDataExists = false;
    }

    try {
      const keychainResult = await Keychain.getInternetCredentials(this.MASTER_KEY);
      masterKeyExists = !!(keychainResult && keychainResult.password);
    } catch (error) {
      // Check fallback
      const fallbackKey = await AsyncStorage.getItem(this.MASTER_KEY);
      masterKeyExists = !!fallbackKey;
    }

    return {
      keychainAvailable,
      masterKeyExists,
      walletsCount,
      authDataExists,
    };
  }
}

export default SecureStorageManager;
