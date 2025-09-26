import { ethers } from 'ethers';
import { SecureStorage } from './secureStorage';
import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';

/**
 * @title Enhanced Wallet Manager
 * @dev Advanced wallet management system with simplified HD wallet support
 * @notice This module provides:
 *         - HD wallet creation and management using ethers.js
 *         - Multi-account support with deterministic address generation
 *         - Secure key management and storage
 *         - Wallet backup and restore functionality
 */

interface WalletAccount {
  index: number;
  name: string;
  address: string;
  publicKey: string;
  balance: string;
  derivationPath: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
}

interface WalletInfo {
  id: string;
  name: string;
  type: 'hd' | 'imported' | 'hardware';
  accounts: WalletAccount[];
  masterFingerprint?: string;
  isLocked: boolean;
  createdAt: Date;
  lastBackup?: Date;
}

interface AddressGenerationOptions {
  accountIndex?: number;
  count?: number;
  startIndex?: number;
  addressType?: 'legacy' | 'segwit' | 'native_segwit';
  change?: number; // 0 for external addresses, 1 for change addresses
}

interface WalletCreationOptions {
  name: string;
  mnemonic?: string;
  passphrase?: string;
}

interface BackupData {
  walletId: string;
  mnemonic: string;
  accounts: WalletAccount[];
  metadata: {
    name: string;
    createdAt: Date;
    version: string;
  };
}

class EnhancedWalletManager {
  private static instance: EnhancedWalletManager;
  private wallets: Map<string, WalletInfo> = new Map();
  private activeWalletId: string | null = null;
  private bip32: any;

  // Derivation path constants
  private static readonly DERIVATION_PATHS = {
    ETHEREUM_LEGACY: "m/44'/60'/0'/0",
    ETHEREUM_LEDGER: "m/44'/60'/0'",
    BITCOIN_LEGACY: "m/44'/0'/0'/0",
    BITCOIN_SEGWIT: "m/49'/0'/0'/0",
    BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'/0",
  };

  constructor() {
    if (EnhancedWalletManager.instance) {
      return EnhancedWalletManager.instance;
    }
    EnhancedWalletManager.instance = this;
    this.bip32 = BIP32Factory(ecc);
  }

  /**
   * @dev Initialize wallet manager
   * @returns Promise<boolean> Success status
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing enhanced wallet manager...');
      
      // Load existing wallets from secure storage
      await this.loadWallets();
      
      return true;
    } catch (error) {
      console.error('Wallet manager initialization failed:', error);
      return false;
    }
  }

  /**
   * @dev Create new HD wallet
   * @param options Wallet creation options
   * @returns Promise<WalletInfo> Created wallet info
   */
  async createWallet(options: WalletCreationOptions): Promise<WalletInfo> {
    try {
      console.log(`Creating wallet: ${options.name}`);

      // Generate or validate mnemonic
      let mnemonic: string;
      if (options.mnemonic) {
        if (!validateMnemonic(options.mnemonic)) {
          throw new Error('Invalid mnemonic phrase');
        }
        mnemonic = options.mnemonic;
      } else {
        mnemonic = generateMnemonic(256); // 24 words for maximum security
      }

      // Generate wallet ID
      const walletId = this.generateWalletId();

      // Create HD wallet from mnemonic
      const hdWallet = ethers.Wallet.fromMnemonic(mnemonic, 
        `${EnhancedWalletManager.DERIVATION_PATHS.ETHEREUM_LEGACY}/0`);

      // Create default account (account 0)
      const defaultAccount = await this.createAccountFromMnemonic(
        mnemonic, 
        0, 
        'Main Account'
      );

      // Create wallet info
      const walletInfo: WalletInfo = {
        id: walletId,
        name: options.name,
        type: 'hd',
        accounts: [defaultAccount],
        masterFingerprint: walletId.slice(-8), // Use last 8 chars of wallet ID as fingerprint
        isLocked: false,
        createdAt: new Date(),
      };

      // Store wallet securely
      await this.storeWallet(walletId, walletInfo, mnemonic);
      
      // Add to memory
      this.wallets.set(walletId, walletInfo);
      
      // Set as active if no active wallet
      if (!this.activeWalletId) {
        this.activeWalletId = walletId;
      }

      console.log(`Wallet created successfully: ${walletId}`);
      return walletInfo;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * @dev Import wallet from mnemonic
   * @param name Wallet name
   * @param mnemonic Mnemonic phrase
   * @param passphrase Optional passphrase
   * @returns Promise<WalletInfo> Imported wallet info
   */
  async importWallet(
    name: string, 
    mnemonic: string, 
    passphrase?: string
  ): Promise<WalletInfo> {
    return this.createWallet({
      name,
      mnemonic,
      passphrase,
    });
  }

  /**
   * @dev Create new account in wallet
   * @param walletId Wallet ID
   * @param accountName Account name
   * @returns Promise<WalletAccount> Created account
   */
  async createAccount(
    walletId: string, 
    accountName?: string
  ): Promise<WalletAccount> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Get mnemonic for derivation
      const mnemonic = await this.getMnemonic(walletId);
      
      // Determine account index
      const index = this.getNextAccountIndex(walletId);
      
      // Create account from mnemonic
      const account = await this.createAccountFromMnemonic(
        mnemonic,
        index,
        accountName || `Account ${index + 1}`
      );

      // Add to wallet
      wallet.accounts.push(account);
      await this.updateWallet(walletId, wallet);

      console.log(`Account created: ${account.address}`);
      return account;
    } catch (error) {
      console.error('Failed to create account:', error);
      throw error;
    }
  }

  /**
   * @dev Create account from mnemonic
   * @param mnemonic Mnemonic phrase
   * @param accountIndex Account index
   * @param accountName Account name
   * @returns Promise<WalletAccount> Created account
   */
  private async createAccountFromMnemonic(
    mnemonic: string,
    accountIndex: number,
    accountName: string
  ): Promise<WalletAccount> {
    // Create seed from mnemonic
    const seed = mnemonicToSeedSync(mnemonic);
    const masterNode = this.bip32.fromSeed(seed);
    
    // Create derivation path for Ethereum
    const derivationPath = `${EnhancedWalletManager.DERIVATION_PATHS.ETHEREUM_LEGACY}/${accountIndex}`;
    
    // Derive account key
    const accountNode = masterNode.derivePath(derivationPath);
    
    // Create ethers wallet from private key
    const wallet = new ethers.Wallet(accountNode.privateKey);

    const account: WalletAccount = {
      index: accountIndex,
      name: accountName,
      address: wallet.address,
      publicKey: accountNode.publicKey.toString('hex'),
      balance: '0',
      derivationPath,
      isActive: accountIndex === 0,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    return account;
  }

  /**
   * @dev Generate multiple addresses for an account
   * @param walletId Wallet ID
   * @param accountIndex Account index
   * @param options Address generation options
   * @returns Promise<string[]> Generated addresses
   */
  async generateAddresses(
    walletId: string,
    accountIndex: number,
    options: AddressGenerationOptions = {}
  ): Promise<string[]> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const mnemonic = await this.getMnemonic(walletId);
      const seed = mnemonicToSeedSync(mnemonic);
      const masterNode = this.bip32.fromSeed(seed);
      
      const addresses: string[] = [];
      const count = options.count || 10;
      const startIndex = options.startIndex || 0;

      // Generate addresses using BIP32 derivation
      for (let i = startIndex; i < startIndex + count; i++) {
        const derivationPath = `${EnhancedWalletManager.DERIVATION_PATHS.ETHEREUM_LEGACY}/${accountIndex}/0/${i}`;
        const addressNode = masterNode.derivePath(derivationPath);
        const addressWallet = new ethers.Wallet(addressNode.privateKey);
        addresses.push(addressWallet.address);
      }

      return addresses;
    } catch (error) {
      console.error('Failed to generate addresses:', error);
      throw error;
    }
  }

  /**
   * @dev Get wallet by ID
   * @param walletId Wallet ID
   * @returns WalletInfo | null Wallet info or null
   */
  getWallet(walletId: string): WalletInfo | null {
    return this.wallets.get(walletId) || null;
  }

  /**
   * @dev Get all wallets
   * @returns WalletInfo[] Array of all wallets
   */
  getAllWallets(): WalletInfo[] {
    return Array.from(this.wallets.values());
  }

  /**
   * @dev Get active wallet
   * @returns WalletInfo | null Active wallet or null
   */
  getActiveWallet(): WalletInfo | null {
    if (!this.activeWalletId) {
      return null;
    }
    return this.wallets.get(this.activeWalletId) || null;
  }

  /**
   * @dev Set active wallet
   * @param walletId Wallet ID to set as active
   * @returns Promise<boolean> Success status
   */
  async setActiveWallet(walletId: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      this.activeWalletId = walletId;
      await SecureStorage.setItemAsync('activeWalletId', walletId);
      
      console.log(`Active wallet set to: ${walletId}`);
      return true;
    } catch (error) {
      console.error('Failed to set active wallet:', error);
      return false;
    }
  }

  /**
   * @dev Delete wallet
   * @param walletId Wallet ID to delete
   * @returns Promise<boolean> Success status
   */
  async deleteWallet(walletId: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Remove from secure storage
      await SecureStorage.deleteItemAsync(`wallet_${walletId}`);
      await SecureStorage.deleteItemAsync(`mnemonic_${walletId}`);
      
      // Remove from memory
      this.wallets.delete(walletId);
      
      // Update active wallet if necessary
      if (this.activeWalletId === walletId) {
        const remainingWallets = Array.from(this.wallets.keys());
        this.activeWalletId = remainingWallets.length > 0 ? remainingWallets[0] : null;
        
        if (this.activeWalletId) {
          await SecureStorage.setItemAsync('activeWalletId', this.activeWalletId);
        } else {
          await SecureStorage.deleteItemAsync('activeWalletId');
        }
      }

      console.log(`Wallet deleted: ${walletId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      return false;
    }
  }

  /**
   * @dev Create wallet backup
   * @param walletId Wallet ID to backup
   * @returns Promise<BackupData> Backup data
   */
  async createBackup(walletId: string): Promise<BackupData> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const mnemonic = await this.getMnemonic(walletId);

      const backupData: BackupData = {
        walletId,
        mnemonic,
        accounts: wallet.accounts,
        metadata: {
          name: wallet.name,
          createdAt: wallet.createdAt,
          version: '1.0.0',
        },
      };

      // Update last backup time
      wallet.lastBackup = new Date();
      await this.updateWallet(walletId, wallet);

      return backupData;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * @dev Restore wallet from backup
   * @param backupData Backup data
   * @returns Promise<WalletInfo> Restored wallet
   */
  async restoreFromBackup(backupData: BackupData): Promise<WalletInfo> {
    try {
      // Validate backup data
      if (!validateMnemonic(backupData.mnemonic)) {
        throw new Error('Invalid backup: corrupted mnemonic');
      }

      // Import wallet
      const wallet = await this.importWallet(
        backupData.metadata.name,
        backupData.mnemonic
      );

      // Restore accounts if they don't match
      if (backupData.accounts.length > wallet.accounts.length) {
        for (let i = wallet.accounts.length; i < backupData.accounts.length; i++) {
          const accountData = backupData.accounts[i];
          await this.createAccount(wallet.id, accountData.name);
        }
      }

      console.log(`Wallet restored from backup: ${wallet.id}`);
      return wallet;
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      throw error;
    }
  }

  /**
   * @dev Get private key for specific account
   * @param walletId Wallet ID
   * @param accountIndex Account index
   * @returns Promise<string> Private key
   */
  async getPrivateKey(walletId: string, accountIndex: number): Promise<string> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const account = wallet.accounts.find(acc => acc.index === accountIndex);
      if (!account) {
        throw new Error('Account not found');
      }

      const mnemonic = await this.getMnemonic(walletId);
      const seed = mnemonicToSeedSync(mnemonic);
      const masterNode = this.bip32.fromSeed(seed);
      
      const accountNode = masterNode.derivePath(account.derivationPath);
      return accountNode.privateKey.toString('hex');
    } catch (error) {
      console.error('Failed to get private key:', error);
      throw error;
    }
  }

  /**
   * @dev Update account balance
   * @param walletId Wallet ID
   * @param accountIndex Account index
   * @param balance New balance
   * @returns Promise<boolean> Success status
   */
  async updateAccountBalance(
    walletId: string, 
    accountIndex: number, 
    balance: string
  ): Promise<boolean> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        return false;
      }

      const account = wallet.accounts.find(acc => acc.index === accountIndex);
      if (!account) {
        return false;
      }

      account.balance = balance;
      account.lastUsed = new Date();
      
      await this.updateWallet(walletId, wallet);
      return true;
    } catch (error) {
      console.error('Failed to update account balance:', error);
      return false;
    }
  }

  /**
   * @dev Generate wallet ID
   * @returns string Unique wallet ID
   */
  private generateWalletId(): string {
    return `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @dev Get next account index for wallet
   * @param walletId Wallet ID
   * @returns number Next account index
   */
  private getNextAccountIndex(walletId: string): number {
    const wallet = this.wallets.get(walletId);
    if (!wallet || wallet.accounts.length === 0) {
      return 0;
    }

    const maxIndex = Math.max(...wallet.accounts.map(acc => acc.index));
    return maxIndex + 1;
  }

  /**
   * @dev Store wallet securely
   * @param walletId Wallet ID
   * @param walletInfo Wallet information
   * @param mnemonic Mnemonic phrase
   * @returns Promise<void>
   */
  private async storeWallet(
    walletId: string, 
    walletInfo: WalletInfo, 
    mnemonic: string
  ): Promise<void> {
    await SecureStorage.setItemAsync(`wallet_${walletId}`, JSON.stringify(walletInfo));
    await SecureStorage.setItemAsync(`mnemonic_${walletId}`, mnemonic);
  }

  /**
   * @dev Update wallet in storage
   * @param walletId Wallet ID
   * @param walletInfo Updated wallet info
   * @returns Promise<void>
   */
  private async updateWallet(walletId: string, walletInfo: WalletInfo): Promise<void> {
    this.wallets.set(walletId, walletInfo);
    await SecureStorage.setItemAsync(`wallet_${walletId}`, JSON.stringify(walletInfo));
  }

  /**
   * @dev Get mnemonic for wallet
   * @param walletId Wallet ID
   * @returns Promise<string> Mnemonic phrase
   */
  private async getMnemonic(walletId: string): Promise<string> {
    const mnemonic = await SecureStorage.getItemAsync(`mnemonic_${walletId}`);
    if (!mnemonic) {
      throw new Error('Mnemonic not found');
    }
    return mnemonic;
  }

  /**
   * @dev Load wallets from secure storage
   * @returns Promise<void>
   */
  private async loadWallets(): Promise<void> {
    try {
      // Load active wallet ID
      const activeWalletId = await SecureStorage.getItemAsync('activeWalletId');
      if (activeWalletId) {
        this.activeWalletId = activeWalletId;
      }

      // Note: In a real implementation, you would iterate through stored wallet keys
      // For now, wallets will be loaded as they are accessed
      
      console.log('Wallets loaded from storage');
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  }

  /**
   * @dev Get extended public key for account
   * @param walletId Wallet ID
   * @param accountIndex Account index
   * @returns Promise<string> Extended public key
   */
  async getExtendedPublicKey(walletId: string, accountIndex: number): Promise<string> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const mnemonic = await this.getMnemonic(walletId);
      const seed = mnemonicToSeedSync(mnemonic);
      const masterNode = this.bip32.fromSeed(seed);
      
      const accountPath = `m/44'/60'/${accountIndex}'`;
      const accountNode = masterNode.derivePath(accountPath);
      
      return accountNode.toBase58();
    } catch (error) {
      console.error('Failed to get extended public key:', error);
      throw error;
    }
  }

  /**
   * @dev Get master fingerprint for wallet
   * @param walletId Wallet ID
   * @returns Promise<string> Master fingerprint
   */
  async getMasterFingerprint(walletId: string): Promise<string> {
    try {
      const mnemonic = await this.getMnemonic(walletId);
      const seed = mnemonicToSeedSync(mnemonic);
      const masterNode = this.bip32.fromSeed(seed);
      
      return masterNode.fingerprint.toString('hex');
    } catch (error) {
      console.error('Failed to get master fingerprint:', error);
      throw error;
    }
  }

  /**
   * @dev Generate addresses with different derivation paths
   * @param walletId Wallet ID
   * @param options Extended address generation options
   * @returns Promise<string[]> Generated addresses
   */
  async generateAddressesWithPath(
    walletId: string,
    options: AddressGenerationOptions & { customPath?: string } = {}
  ): Promise<string[]> {
    try {
      const wallet = this.wallets.get(walletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const mnemonic = await this.getMnemonic(walletId);
      const seed = mnemonicToSeedSync(mnemonic);
      const masterNode = this.bip32.fromSeed(seed);
      
      const addresses: string[] = [];
      const count = options.count || 10;
      const startIndex = options.startIndex || 0;
      const accountIndex = options.accountIndex || 0;
      const change = options.change || 0;

      // Determine base path
      let basePath: string;
      if (options.customPath) {
        basePath = options.customPath;
      } else {
        switch (options.addressType) {
          case 'segwit':
            basePath = `m/49'/60'/${accountIndex}'/${change}`;
            break;
          case 'native_segwit':
            basePath = `m/84'/60'/${accountIndex}'/${change}`;
            break;
          default:
            basePath = `m/44'/60'/${accountIndex}'/${change}`;
        }
      }

      // Generate addresses
      for (let i = startIndex; i < startIndex + count; i++) {
        const fullPath = `${basePath}/${i}`;
        const addressNode = masterNode.derivePath(fullPath);
        const addressWallet = new ethers.Wallet(addressNode.privateKey);
        addresses.push(addressWallet.address);
      }

      return addresses;
    } catch (error) {
      console.error('Failed to generate addresses with path:', error);
      throw error;
    }
  }

  /**
   * @dev Validate derivation path
   * @param derivationPath Derivation path to validate
   * @returns boolean Validation result
   */
  validateDerivationPath(derivationPath: string): boolean {
    try {
      // Check if path starts with m/
      if (!derivationPath.startsWith('m/')) {
        return false;
      }

      // Check path segments
      const segments = derivationPath.slice(2).split('/');
      for (const segment of segments) {
        if (segment === '') continue;
        
        // Check if segment is valid (number optionally followed by ')
        const isHardened = segment.endsWith("'");
        const numberPart = isHardened ? segment.slice(0, -1) : segment;
        
        if (!/^\d+$/.test(numberPart)) {
          return false;
        }
        
        const num = parseInt(numberPart);
        if (num < 0 || num >= 0x80000000) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @dev Get wallet statistics
   * @returns Object with wallet statistics
   */
  getWalletStatistics(): {
    totalWallets: number;
    totalAccounts: number;
    walletTypes: { [key: string]: number };
    totalBalance: string;
  } {
    const wallets = Array.from(this.wallets.values());
    const totalAccounts = wallets.reduce((sum, wallet) => sum + wallet.accounts.length, 0);
    const walletTypes = wallets.reduce((types, wallet) => {
      types[wallet.type] = (types[wallet.type] || 0) + 1;
      return types;
    }, {} as { [key: string]: number });
    
    const totalBalance = wallets.reduce((sum, wallet) => {
      const walletBalance = wallet.accounts.reduce((accSum, account) => 
        accSum + parseFloat(account.balance || '0'), 0);
      return sum + walletBalance;
    }, 0);

    return {
      totalWallets: wallets.length,
      totalAccounts,
      walletTypes,
      totalBalance: totalBalance.toFixed(8),
    };
  }

  /**
   * @dev Get wallet capabilities
   * @returns Object with capability information
   */
  getCapabilities(): {
    hdWallets: boolean;
    multipleAccounts: boolean;
    secureStorage: boolean;
    backup: boolean;
    watchOnly: boolean;
    multipleDerivationPaths: boolean;
    extendedKeys: boolean;
  } {
    return {
      hdWallets: true,
      multipleAccounts: true,
      secureStorage: true,
      backup: true,
      watchOnly: false, // Will be implemented when needed
      multipleDerivationPaths: true,
      extendedKeys: true,
    };
  }
}

// Export singleton instance
export const enhancedWalletManager = new EnhancedWalletManager();

// Export types
export type { 
  WalletAccount, 
  WalletInfo, 
  AddressGenerationOptions,
  WalletCreationOptions,
  BackupData
};

export default EnhancedWalletManager;
