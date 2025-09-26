/**
 * Tier 1 - Critical Encrypted Data Storage
 * Uses AsyncStorage with AES encryption for secure data persistence
 * Survives app updates, deleted only on complete uninstall
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { Alert } from 'react-native';

export interface SecureWalletData {
  id: string;
  name: string;
  mnemonic: string;
  privateKey: string;
  createdAt: number;
  lastUsed: number;
  accounts: SecureAccountData[];
}

export interface SecureAccountData {
  id: string;
  address: string;
  privateKey: string;
  derivationPath: string;
  name: string;
  createdAt: number;
}

export interface AuthenticationData {
  passwordHash: string;
  salt: string;
  biometricEnabled: boolean;
  lastAuthenticated: number;
  sessionTimeout: number;
}

class SecureStorageManager {
  private readonly WALLET_PREFIX = 'secure_wallet_';
  private readonly AUTH_KEY = 'secure_authentication_data';
  private readonly MASTER_KEY = 'secure_master_encryption_key';
  private readonly APP_INITIALIZED_KEY = 'secure_app_initialized';
  private readonly WALLET_INDEX_KEY = 'secure_wallet_index';

  private masterKey: string | null = null;

  /**
   * Initialize secure storage and generate master encryption key
   */
  async initialize(): Promise<void> {
    try {
      // Check if master key exists, if not generate one
      this.masterKey = await this.getMasterKey();
      if (!this.masterKey) {
        await this.generateMasterKey();
      }
    } catch (error) {
      console.error('Failed to initialize secure storage:', error);
      throw new Error('Secure storage initialization failed');
    }
  }

  /**
   * Generate and store master encryption key
   */
  private async generateMasterKey(): Promise<void> {
    const masterKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const encryptedKey = CryptoJS.AES.encrypt(masterKey, 'cypher_secure_key_salt').toString();
    await AsyncStorage.setItem(this.MASTER_KEY, encryptedKey);
    this.masterKey = masterKey;
  }

  /**
   * Get master encryption key
   */
  private async getMasterKey(): Promise<string | null> {
    try {
      const encryptedKey = await AsyncStorage.getItem(this.MASTER_KEY);
      if (!encryptedKey) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encryptedKey, 'cypher_secure_key_salt');
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Failed to get master key:', error);
      return null;
    }
  }

  /**
   * Encrypt data using master key
   */
  private async encryptData(data: any): Promise<string> {
    if (!this.masterKey) {
      this.masterKey = await this.getMasterKey();
    }
    
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }
    
    const jsonData = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonData, this.masterKey).toString();
    return encrypted;
  }

  /**
   * Decrypt data using master key
   */
  private async decryptData<T>(encryptedData: string): Promise<T> {
    if (!this.masterKey) {
      this.masterKey = await this.getMasterKey();
    }
    
    if (!this.masterKey) {
      throw new Error('Master key not available');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
      const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Store wallet data securely
   */
  async storeWallet(walletData: SecureWalletData): Promise<void> {
    try {
      const encryptedData = await this.encryptData(walletData);
      const keyName = `${this.WALLET_PREFIX}${walletData.id}`;
      
      await AsyncStorage.setItem(keyName, encryptedData);
      
      // Update wallet index
      await this.updateWalletIndex(walletData.id);
    } catch (error) {
      console.error('Failed to store wallet:', error);
      throw new Error('Wallet storage failed');
    }
  }

  /**
   * Update wallet index for fast retrieval
   */
  private async updateWalletIndex(walletId: string): Promise<void> {
    try {
      const existingIndex = await AsyncStorage.getItem(this.WALLET_INDEX_KEY);
      let walletIds: string[] = existingIndex ? JSON.parse(existingIndex) : [];
      
      if (!walletIds.includes(walletId)) {
        walletIds.push(walletId);
        await AsyncStorage.setItem(this.WALLET_INDEX_KEY, JSON.stringify(walletIds));
      }
    } catch (error) {
      console.error('Failed to update wallet index:', error);
    }
  }

  /**
   * Retrieve wallet data
   */
  async getWallet(walletId: string): Promise<SecureWalletData | null> {
    try {
      const keyName = `${this.WALLET_PREFIX}${walletId}`;
      const encryptedData = await AsyncStorage.getItem(keyName);
      
      if (!encryptedData) {
        return null;
      }

      const walletData = await this.decryptData<SecureWalletData>(encryptedData);
      return walletData;
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }

  /**
   * Get all stored wallet IDs
   */
  async getAllWalletIds(): Promise<string[]> {
    try {
      const indexData = await AsyncStorage.getItem(this.WALLET_INDEX_KEY);
      return indexData ? JSON.parse(indexData) : [];
    } catch (error) {
      console.error('Failed to get wallet IDs:', error);
      return [];
    }
  }

  /**
   * Clear all secure storage (for reset)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const secureKeys = keys.filter(key => 
        key.startsWith('secure_') || 
        key.startsWith(this.WALLET_PREFIX)
      );
      
      await AsyncStorage.multiRemove(secureKeys);
      this.masterKey = null;
      
      console.log('Cleared all secure storage');
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw new Error('Secure storage clearing failed');
    }
  }

  /**
   * Delete wallet data
   */
  async deleteWallet(walletId: string): Promise<void> {
    try {
      const keyName = `${this.WALLET_PREFIX}${walletId}`;
      await AsyncStorage.removeItem(keyName);
      
      // Remove from index
      await this.removeFromWalletIndex(walletId);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      throw new Error('Wallet deletion failed');
    }
  }

  /**
   * Remove wallet from index
   */
  private async removeFromWalletIndex(walletId: string): Promise<void> {
    try {
      const existingIndex = await AsyncStorage.getItem(this.WALLET_INDEX_KEY);
      if (existingIndex) {
        let walletIds: string[] = JSON.parse(existingIndex);
        walletIds = walletIds.filter(id => id !== walletId);
        await AsyncStorage.setItem(this.WALLET_INDEX_KEY, JSON.stringify(walletIds));
      }
    } catch (error) {
      console.error('Failed to remove from wallet index:', error);
    }
  }

  /**
   * Store authentication data
   */
  async storeAuthenticationData(authData: AuthenticationData): Promise<void> {
    try {
      const encryptedData = await this.encryptData(authData);
      await AsyncStorage.setItem(this.AUTH_KEY, encryptedData);
    } catch (error) {
      console.error('Failed to store authentication data:', error);
      throw new Error('Authentication data storage failed');
    }
  }

  /**
   * Get authentication data
   */
  async getAuthenticationData(): Promise<AuthenticationData | null> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.AUTH_KEY);
      if (!encryptedData) {
        return null;
      }

      const authData = await this.decryptData<AuthenticationData>(encryptedData);
      return authData;
    } catch (error) {
      console.error('Failed to get authentication data:', error);
      return null;
    }
  }

  /**
   * Check if app is initialized (has been set up before)
   */
  async isAppInitialized(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(this.APP_INITIALIZED_KEY);
      return value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark app as initialized
   */
  async setAppInitialized(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.APP_INITIALIZED_KEY, 'true');
    } catch (error) {
      console.error('Failed to set app initialized:', error);
    }
  }

  /**
   * Check if device supports biometric authentication
   */
  async supportsBiometrics(): Promise<boolean> {
    // For now, assume biometrics are supported
    // In a real implementation, check device capabilities
    return true;
  }

  /**
   * Get supported biometry type
   */
  async getBiometryType(): Promise<string | null> {
    // Return mock biometry type
    return 'TouchID';
  }

  /**
   * Clear all secure storage (for complete reset)
   */
  async clearAllData(): Promise<void> {
    try {
      const walletIds = await this.getAllWalletIds();
      
      // Remove all wallets
      for (const walletId of walletIds) {
        await this.deleteWallet(walletId);
      }
      
      // Remove authentication data
      await AsyncStorage.removeItem(this.AUTH_KEY);
      
      // Remove master key
      await AsyncStorage.removeItem(this.MASTER_KEY);
      
      // Remove initialization flag
      await AsyncStorage.removeItem(this.APP_INITIALIZED_KEY);
      
      // Remove wallet index
      await AsyncStorage.removeItem(this.WALLET_INDEX_KEY);
      
      // Clear master key from memory
      this.masterKey = null;
    } catch (error) {
      console.error('Failed to clear all secure storage:', error);
      throw new Error('Storage clearing failed');
    }
  }
}

export const secureStorage = new SecureStorageManager();
