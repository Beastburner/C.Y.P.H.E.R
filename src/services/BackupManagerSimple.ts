/**
 * Backup Manager for Ultimate Persistent Multi-Wallet System
 * Handles comprehensive backup and restore operations
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import * as bip39 from 'bip39';
import SecureStorageManager from './storage/SecureStorageManager';
import MetadataStorageManager from './storage/MetadataStorageManager';

export interface BackupData {
  version: string;
  timestamp: number;
  platform: string;
  appVersion: string;
  wallets: any[];
  authentication: any;
  metadata: any[];
  settings: any;
  checksum: string;
}

export interface BackupOptions {
  includeSettings?: boolean;
  encryptionPassword?: string;
  format: 'json' | 'encrypted';
}

export interface RestoreOptions {
  validateIntegrity?: boolean;
  overwriteExisting?: boolean;
  decryptionPassword?: string;
}

export class BackupManager {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly APP_VERSION = '1.0.0';
  private static readonly BACKUP_STORAGE_KEY = '@wallet_backup_list';

  /**
   * Initialize backup system
   */
  public static async initialize(): Promise<void> {
    try {
      console.log('✅ BackupManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BackupManager:', error);
      throw new Error('Backup system initialization failed');
    }
  }

  /**
   * Create comprehensive backup of all wallet data
   */
  public static async createBackup(options: BackupOptions): Promise<string> {
    try {
      console.log('🔄 Creating comprehensive backup...');

      // Gather all data
      const wallets = await SecureStorageManager.getAllWalletSeeds();
      const authentication = await SecureStorageManager.getAuthenticationData();
      const metadata = await MetadataStorageManager.getAllWalletMetadata();
      const settings = await MetadataStorageManager.getAppSettings();

      // Create backup data structure
      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        platform: Platform.OS,
        appVersion: this.APP_VERSION,
        wallets: wallets || [],
        authentication: authentication || null,
        metadata: metadata || [],
        settings: settings || {},
        checksum: '',
      };

      // Generate checksum for integrity verification
      const dataString = JSON.stringify({
        wallets: backupData.wallets,
        authentication: backupData.authentication,
        metadata: backupData.metadata,
        settings: backupData.settings,
      });
      backupData.checksum = CryptoJS.SHA256(dataString).toString();

      // Process backup based on format
      let backupContent: string;

      switch (options.format) {
        case 'json':
          backupContent = JSON.stringify(backupData, null, 2);
          break;

        case 'encrypted':
          if (!options.encryptionPassword) {
            throw new Error('Encryption password required for encrypted backup');
          }
          const encryptedData = CryptoJS.AES.encrypt(
            JSON.stringify(backupData),
            options.encryptionPassword
          ).toString();
          backupContent = JSON.stringify({
            encrypted: true,
            data: encryptedData,
            version: this.BACKUP_VERSION,
            timestamp: Date.now(),
          }, null, 2);
          break;

        default:
          throw new Error(`Unsupported backup format: ${options.format}`);
      }

      // Store backup with timestamp as key
      const backupId = `backup_${Date.now()}`;
      await AsyncStorage.setItem(`@backup_${backupId}`, backupContent);

      // Update backup list
      await this.addToBackupList(backupId, {
        id: backupId,
        timestamp: Date.now(),
        format: options.format,
        encrypted: options.format === 'encrypted',
        walletsCount: backupData.wallets.length,
        hasAuthentication: !!backupData.authentication,
      });

      console.log('✅ Backup created successfully:', backupId);
      return backupContent;
    } catch (error: any) {
      console.error('Failed to create backup:', error);
      throw new Error(`Backup creation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Restore wallet data from backup
   */
  public static async restoreFromBackup(
    backupContent: string,
    options: RestoreOptions = {}
  ): Promise<void> {
    try {
      console.log('🔄 Restoring from backup...');

      let backupData: BackupData;

      // Parse backup content
      try {
        const parsedData = JSON.parse(backupContent);

        // Handle encrypted backups
        if (parsedData.encrypted) {
          if (!options.decryptionPassword) {
            throw new Error('Decryption password required for encrypted backup');
          }
          const decryptedBytes = CryptoJS.AES.decrypt(parsedData.data, options.decryptionPassword);
          const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedData) {
            throw new Error('Invalid decryption password');
          }
          backupData = JSON.parse(decryptedData);
        } else {
          backupData = parsedData;
        }
      } catch (parseError) {
        throw new Error('Invalid backup file format');
      }

      // Validate backup version compatibility
      if (!backupData.version || backupData.version !== this.BACKUP_VERSION) {
        console.warn('Backup version mismatch, attempting migration...');
      }

      // Verify integrity if requested
      if (options.validateIntegrity && backupData.checksum) {
        const dataString = JSON.stringify({
          wallets: backupData.wallets,
          authentication: backupData.authentication,
          metadata: backupData.metadata,
          settings: backupData.settings,
        });
        const calculatedChecksum = CryptoJS.SHA256(dataString).toString();
        
        if (calculatedChecksum !== backupData.checksum) {
          throw new Error('Backup integrity verification failed');
        }
        console.log('✅ Backup integrity verified');
      }

      // Confirm overwrite if existing data found
      if (!options.overwriteExisting) {
        const existingWallets = await SecureStorageManager.getAllWalletSeeds();
        if (existingWallets.length > 0) {
          throw new Error('Existing wallet data found. Set overwriteExisting to true to proceed.');
        }
      }

      // Clear existing data if overwriting
      if (options.overwriteExisting) {
        await SecureStorageManager.clearAllData();
        await MetadataStorageManager.clearAllMetadata();
        console.log('🧹 Cleared existing data');
      }

      // Restore data in order
      console.log('🔄 Restoring wallet data...');

      // Restore authentication data first
      if (backupData.authentication) {
        await SecureStorageManager.storeAuthenticationData(backupData.authentication);
        console.log('✅ Authentication data restored');
      }

      // Restore wallets
      if (backupData.wallets && backupData.wallets.length > 0) {
        for (const walletData of backupData.wallets) {
          await SecureStorageManager.storeWalletSeed(walletData);
        }
        console.log(`✅ Restored ${backupData.wallets.length} wallets`);
      }

      // Restore metadata
      if (backupData.metadata && backupData.metadata.length > 0) {
        for (const metadata of backupData.metadata) {
          await MetadataStorageManager.storeWalletMetadata(metadata);
        }
        console.log(`✅ Restored metadata for ${backupData.metadata.length} wallets`);
      }

      // Restore settings
      if (backupData.settings) {
        await MetadataStorageManager.storeAppSettings(backupData.settings);
        console.log('✅ App settings restored');
      }

      console.log('🎉 Backup restore completed successfully!');
    } catch (error: any) {
      console.error('Failed to restore backup:', error);
      throw new Error(`Backup restore failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Get list of available backup files
   */
  public static async getAvailableBackups(): Promise<Array<{
    id: string;
    timestamp: number;
    format: string;
    encrypted: boolean;
    walletsCount: number;
    hasAuthentication: boolean;
  }>> {
    try {
      const backupListJson = await AsyncStorage.getItem(this.BACKUP_STORAGE_KEY);
      if (!backupListJson) {
        return [];
      }
      return JSON.parse(backupListJson);
    } catch (error) {
      console.error('Failed to get available backups:', error);
      return [];
    }
  }

  /**
   * Load backup content by ID
   */
  public static async loadBackup(backupId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@backup_${backupId}`);
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  /**
   * Delete backup by ID
   */
  public static async deleteBackup(backupId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@backup_${backupId}`);
      await this.removeFromBackupList(backupId);
      console.log('✅ Backup deleted:', backupId);
    } catch (error: any) {
      console.error('Failed to delete backup:', error);
      throw new Error(`Backup deletion failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Validate backup file without restoring
   */
  public static async validateBackup(
    backupContent: string,
    decryptionPassword?: string
  ): Promise<{
    valid: boolean;
    version: string;
    timestamp: number;
    walletsCount: number;
    hasAuthentication: boolean;
    error?: string;
  }> {
    try {
      let backupData: BackupData;

      const parsedData = JSON.parse(backupContent);

      // Handle encrypted backups
      if (parsedData.encrypted) {
        if (!decryptionPassword) {
          return {
            valid: false,
            version: 'unknown',
            timestamp: 0,
            walletsCount: 0,
            hasAuthentication: false,
            error: 'Decryption password required',
          };
        }

        try {
          const decryptedBytes = CryptoJS.AES.decrypt(parsedData.data, decryptionPassword);
          const decryptedData = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedData) {
            throw new Error('Invalid decryption password');
          }
          backupData = JSON.parse(decryptedData);
        } catch (decryptError) {
          return {
            valid: false,
            version: 'unknown',
            timestamp: 0,
            walletsCount: 0,
            hasAuthentication: false,
            error: 'Decryption failed',
          };
        }
      } else {
        backupData = parsedData;
      }

      // Validate required fields
      if (!backupData.version || !backupData.timestamp) {
        return {
          valid: false,
          version: backupData.version || 'unknown',
          timestamp: backupData.timestamp || 0,
          walletsCount: 0,
          hasAuthentication: false,
          error: 'Invalid backup format',
        };
      }

      return {
        valid: true,
        version: backupData.version,
        timestamp: backupData.timestamp,
        walletsCount: backupData.wallets ? backupData.wallets.length : 0,
        hasAuthentication: !!backupData.authentication,
      };
    } catch (error: any) {
      return {
        valid: false,
        version: 'unknown',
        timestamp: 0,
        walletsCount: 0,
        hasAuthentication: false,
        error: error?.message || 'Unknown error',
      };
    }
  }

  /**
   * Export single wallet seed phrase
   */
  public static async exportWalletSeed(walletId: string): Promise<string> {
    try {
      const walletData = await SecureStorageManager.getWalletSeed(walletId);
      if (!walletData) {
        throw new Error('Wallet not found');
      }

      return walletData.seedPhrase;
    } catch (error: any) {
      console.error('Failed to export wallet seed:', error);
      throw new Error(`Wallet seed export failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Import wallet from seed phrase
   */
  public static async importWalletFromSeed(
    seedPhrase: string,
    walletName: string,
    walletId?: string
  ): Promise<string> {
    try {
      // Validate seed phrase
      if (!bip39.validateMnemonic(seedPhrase)) {
        throw new Error('Invalid seed phrase');
      }

      const walletData = {
        id: walletId || `wallet_${Date.now()}`,
        name: walletName,
        seedPhrase: seedPhrase,
        createdAt: Date.now(),
        derivationPath: "m/44'/60'/0'/0/0",
        encryptionVersion: 1,
      };

      await SecureStorageManager.storeWalletSeed(walletData);
      console.log('✅ Wallet imported from seed phrase');
      return walletData.id;
    } catch (error: any) {
      console.error('Failed to import wallet from seed:', error);
      throw new Error(`Wallet import failed: ${error?.message || 'Unknown error'}`);
    }
  }

  // Private helper methods

  private static async addToBackupList(backupId: string, backupInfo: any): Promise<void> {
    try {
      const existingListJson = await AsyncStorage.getItem(this.BACKUP_STORAGE_KEY);
      const existingList = existingListJson ? JSON.parse(existingListJson) : [];
      existingList.push(backupInfo);
      await AsyncStorage.setItem(this.BACKUP_STORAGE_KEY, JSON.stringify(existingList));
    } catch (error) {
      console.error('Failed to add to backup list:', error);
    }
  }

  private static async removeFromBackupList(backupId: string): Promise<void> {
    try {
      const existingListJson = await AsyncStorage.getItem(this.BACKUP_STORAGE_KEY);
      if (existingListJson) {
        const existingList = JSON.parse(existingListJson);
        const filteredList = existingList.filter((backup: any) => backup.id !== backupId);
        await AsyncStorage.setItem(this.BACKUP_STORAGE_KEY, JSON.stringify(filteredList));
      }
    } catch (error) {
      console.error('Failed to remove from backup list:', error);
    }
  }

  /**
   * Clear all backups
   */
  public static async clearAllBackups(): Promise<void> {
    try {
      const backups = await this.getAvailableBackups();
      for (const backup of backups) {
        await AsyncStorage.removeItem(`@backup_${backup.id}`);
      }
      await AsyncStorage.removeItem(this.BACKUP_STORAGE_KEY);
      console.log('✅ All backups cleared');
    } catch (error) {
      console.error('Failed to clear all backups:', error);
    }
  }
}

export default BackupManager;
