import { Buffer } from 'buffer';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Poseidon hash for now (in production, use actual circomlib)
const poseidon = (inputs: bigint[]): bigint => {
  const combined = inputs.reduce((acc, input) => acc + input.toString(), '');
  const hash = CryptoJS.SHA256(combined).toString();
  return BigInt('0x' + hash.slice(0, 32));
};

/**
 * @title AdvancedKeyManager
 * @dev Advanced cryptographic key management for shielded transactions
 * @notice Manages multiple key types required for privacy:
 *         - Spending Keys: Control over spending commitments
 *         - Viewing Keys: Ability to decrypt and view notes
 *         - Nullifier Keys: Generate nullifiers for spent notes
 *         - Commitment Keys: Generate commitment randomness
 */

export interface ShieldedKeyPair {
  spendingKey: string;
  viewingKey: string;
  nullifierKey: string;
  commitmentKey: string;
  address: string; // Shielded address derived from keys
}

export interface KeyDerivationParams {
  masterSeed: string;
  accountIndex: number;
  keyIndex: number;
  purpose: 'spending' | 'viewing' | 'nullifier' | 'commitment';
}

export interface PrivacyKeyStore {
  keyPairs: ShieldedKeyPair[];
  masterSeed: string;
  currentKeyIndex: number;
  encryptionKey: string;
}

export class AdvancedKeyManager {
  private keyStore: PrivacyKeyStore | null = null;
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = '@cypher_privacy_keys';
  private readonly KEY_DERIVATION_PATH = "m/44'/60'/0'/0"; // BIP44 path for Ethereum

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the key manager
   */
  private async initialize(): Promise<void> {
    try {
      await this.loadKeyStore();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to load existing key store, will create new one');
      this.isInitialized = true;
    }
  }

  /**
   * Create a new privacy key store from master seed
   */
  async createKeyStore(masterSeed: string, password: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Key manager not initialized');
    }

    // Derive encryption key from password
    const encryptionKey = await this.deriveEncryptionKey(password);
    
    // Generate initial key pair
    const initialKeyPair = await this.generateKeyPair(masterSeed, 0);
    
    this.keyStore = {
      keyPairs: [initialKeyPair],
      masterSeed: masterSeed,
      currentKeyIndex: 0,
      encryptionKey: encryptionKey
    };

    await this.saveKeyStore(password);
  }

  /**
   * Generate a new shielded key pair
   */
  async generateKeyPair(masterSeed: string, keyIndex: number): Promise<ShieldedKeyPair> {
    // Derive spending key from master seed and index
    const spendingKey = await this.deriveKey({
      masterSeed,
      accountIndex: 0,
      keyIndex,
      purpose: 'spending'
    });

    // Derive viewing key from spending key
    const viewingKey = await this.deriveKey({
      masterSeed,
      accountIndex: 0,
      keyIndex,
      purpose: 'viewing'
    });

    // Derive nullifier key from spending key
    const nullifierKey = await this.deriveKey({
      masterSeed,
      accountIndex: 0,
      keyIndex,
      purpose: 'nullifier'
    });

    // Derive commitment key from spending key
    const commitmentKey = await this.deriveKey({
      masterSeed,
      accountIndex: 0,
      keyIndex,
      purpose: 'commitment'
    });

    // Generate shielded address from public keys
    const address = await this.generateShieldedAddress(spendingKey, viewingKey);

    return {
      spendingKey,
      viewingKey,
      nullifierKey,
      commitmentKey,
      address
    };
  }

  /**
   * Derive a key using HKDF (HMAC-based Key Derivation Function)
   */
  private async deriveKey(params: KeyDerivationParams): Promise<string> {
    const { masterSeed, accountIndex, keyIndex, purpose } = params;
    
    // Create derivation path
    const path = `${this.KEY_DERIVATION_PATH}/${accountIndex}/${keyIndex}/${purpose}`;
    
    // Use HMAC-SHA256 for key derivation
    const derivedKey = CryptoJS.HmacSHA256(path, masterSeed).toString();
    
    return derivedKey;
  }

  /**
   * Generate shielded address from keys
   */
  private async generateShieldedAddress(spendingKey: string, viewingKey: string): Promise<string> {
    // Combine spending and viewing keys
    const combinedKeys = Buffer.concat([
      Buffer.from(spendingKey, 'hex'),
      Buffer.from(viewingKey, 'hex')
    ]);

    // Hash using Poseidon (ZK-friendly hash)
    const poseidonHash = poseidon([BigInt('0x' + spendingKey), BigInt('0x' + viewingKey)]);
    
    // Convert to address format
    const addressBytes = Buffer.from(poseidonHash.toString(16).padStart(64, '0'), 'hex');
    const address = '0x' + addressBytes.slice(-20).toString('hex');
    
    return address;
  }

  /**
   * Get current key pair
   */
  getCurrentKeyPair(): ShieldedKeyPair | null {
    if (!this.keyStore || this.keyStore.keyPairs.length === 0) {
      return null;
    }
    
    return this.keyStore.keyPairs[this.keyStore.currentKeyIndex];
  }

  /**
   * Get all key pairs
   */
  getAllKeyPairs(): ShieldedKeyPair[] {
    return this.keyStore?.keyPairs || [];
  }

  /**
   * Generate new key pair and add to store
   */
  async generateNewKeyPair(): Promise<ShieldedKeyPair> {
    if (!this.keyStore) {
      throw new Error('Key store not initialized');
    }

    const newIndex = this.keyStore.keyPairs.length;
    const newKeyPair = await this.generateKeyPair(this.keyStore.masterSeed, newIndex);
    
    this.keyStore.keyPairs.push(newKeyPair);
    await this.saveKeyStore();
    
    return newKeyPair;
  }

  /**
   * Switch to a different key pair
   */
  async switchToKeyPair(index: number): Promise<void> {
    if (!this.keyStore || index >= this.keyStore.keyPairs.length) {
      throw new Error('Invalid key pair index');
    }

    this.keyStore.currentKeyIndex = index;
    await this.saveKeyStore();
  }

  /**
   * Generate nullifier for a commitment
   */
  generateNullifier(commitment: string, nullifierKey: string): string {
    // Use Poseidon hash for nullifier generation
    const nullifierHash = poseidon([BigInt(commitment), BigInt('0x' + nullifierKey)]);
    return '0x' + nullifierHash.toString(16).padStart(64, '0');
  }

  /**
   * Generate commitment randomness
   */
  generateCommitmentRandomness(commitmentKey: string, nonce: number): string {
    const randomnessHash = poseidon([BigInt('0x' + commitmentKey), BigInt(nonce)]);
    return '0x' + randomnessHash.toString(16).padStart(64, '0');
  }

  /**
   * Decrypt note with viewing key
   */
  async decryptNote(encryptedNote: string, viewingKey: string): Promise<any> {
    try {
      // Derive decryption key from viewing key
      const decryptionKey = CryptoJS.SHA256(viewingKey).toString();

      // Decrypt the note using AES
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedNote, decryptionKey);
      const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

      return JSON.parse(decryptedText);
    } catch (error: any) {
      throw new Error('Failed to decrypt note: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Encrypt note with viewing key
   */
  async encryptNote(note: any, viewingKey: string): Promise<string> {
    try {
      // Derive encryption key from viewing key
      const encryptionKey = CryptoJS.SHA256(viewingKey).toString();

      // Encrypt the note using AES
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(note), encryptionKey).toString();

      return encrypted;
    } catch (error: any) {
      throw new Error('Failed to encrypt note: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Derive encryption key from password
   */
  private async deriveEncryptionKey(password: string): Promise<string> {
    const salt = 'cypher_wallet_privacy_salt'; // In production, use random salt
    
    // Use CryptoJS PBKDF2
    const derivedKey = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: 100000
    });
    
    return derivedKey.toString();
  }

  /**
   * Save encrypted key store to storage
   */
  private async saveKeyStore(password?: string): Promise<void> {
    if (!this.keyStore) return;

    try {
      const keyStoreData = JSON.stringify(this.keyStore);
      
      if (password) {
        // Encrypt the key store with password
        const encryptionKey = await this.deriveEncryptionKey(password);
        const encrypted = CryptoJS.AES.encrypt(keyStoreData, encryptionKey).toString();
        
        await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
      } else {
        // Use existing encryption key
        if (this.keyStore.encryptionKey) {
          const encrypted = CryptoJS.AES.encrypt(keyStoreData, this.keyStore.encryptionKey).toString();
          
          await AsyncStorage.setItem(this.STORAGE_KEY, encrypted);
        } else {
          throw new Error('No encryption key available');
        }
      }
    } catch (error: any) {
      throw new Error('Failed to save key store: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Load and decrypt key store from storage
   */
  private async loadKeyStore(password?: string): Promise<void> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        throw new Error('No key store found');
      }

      let decryptionKey: string;
      if (password) {
        decryptionKey = await this.deriveEncryptionKey(password);
      } else {
        // Try to use stored encryption key (for auto-loading)
        throw new Error('Password required for key store decryption');
      }

      const decryptedBytes = CryptoJS.AES.decrypt(encryptedData, decryptionKey);
      const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

      this.keyStore = JSON.parse(decryptedText);
    } catch (error: any) {
      throw new Error('Failed to load key store: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Export key pair for backup
   */
  exportKeyPair(index: number): string {
    if (!this.keyStore || index >= this.keyStore.keyPairs.length) {
      throw new Error('Invalid key pair index');
    }

    const keyPair = this.keyStore.keyPairs[index];
    return JSON.stringify({
      spendingKey: keyPair.spendingKey,
      viewingKey: keyPair.viewingKey,
      nullifierKey: keyPair.nullifierKey,
      commitmentKey: keyPair.commitmentKey,
      address: keyPair.address
    });
  }

  /**
   * Import key pair from backup
   */
  async importKeyPair(keyPairData: string): Promise<void> {
    if (!this.keyStore) {
      throw new Error('Key store not initialized');
    }

    try {
      const importedKeyPair: ShieldedKeyPair = JSON.parse(keyPairData);
      
      // Validate key pair structure
      if (!importedKeyPair.spendingKey || !importedKeyPair.viewingKey || 
          !importedKeyPair.nullifierKey || !importedKeyPair.commitmentKey) {
        throw new Error('Invalid key pair format');
      }

      // Check for duplicates
      const existingIndex = this.keyStore.keyPairs.findIndex(kp => kp.address === importedKeyPair.address);
      if (existingIndex !== -1) {
        throw new Error('Key pair already exists');
      }

      this.keyStore.keyPairs.push(importedKeyPair);
      await this.saveKeyStore();
    } catch (error: any) {
      throw new Error('Failed to import key pair: ' + (error?.message || 'Unknown error'));
    }
  }

  /**
   * Clear all keys (for logout/reset)
   */
  async clearKeyStore(): Promise<void> {
    this.keyStore = null;
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Unlock key store with password
   */
  async unlockKeyStore(password: string): Promise<boolean> {
    try {
      await this.loadKeyStore(password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if key store is locked
   */
  isLocked(): boolean {
    return this.keyStore === null;
  }

  /**
   * Get privacy score based on key usage
   */
  getPrivacyScore(): number {
    if (!this.keyStore) return 0;

    const factors = {
      numberOfKeys: Math.min(this.keyStore.keyPairs.length / 5, 1) * 20, // Up to 20 points for multiple keys
      keyRotation: this.keyStore.currentKeyIndex > 0 ? 20 : 0, // 20 points for key rotation
      secureStorage: 30, // 30 points for encrypted storage
      isolation: 30 // 30 points for key isolation
    };

    return factors.numberOfKeys + factors.keyRotation + factors.secureStorage + factors.isolation;
  }
}

export default AdvancedKeyManager;
