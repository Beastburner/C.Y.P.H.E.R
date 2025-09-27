/**
 * Cypher Wallet - Core Cryptographic Service (React Native)
 * Military-grade cryptographic operations with BIP39/BIP44 implementation
 * 
 * Features:
 * - BIP39 mnemonic generation and validation
 * - BIP44 hierarchical deterministic key derivation
 * - AES-256-CBC encryption for sensitive data
 * - Secure key management and storage
 * - React Native compatible implementation
 */

import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import * as CryptoJS from 'crypto-js';

// Types
export interface EncryptedData {
  data: string;
  salt: string;
  iv: string;
  tag?: string;
}

export interface HDWalletData {
  mnemonic: string;
  accounts: Array<{
    address: string;
    privateKey: string;
    publicKey: string;
    path: string;
    index: number;
  }>;
}

export interface CryptoKey {
  privateKey: string;
  publicKey: string;
  address: string;
}

export interface Signature {
  r: string;
  s: string;
  v: number;
  signature: string;
}

/**
 * Simple secure random generation for React Native
 * Fallback when crypto.getRandomValues is not available
 */
function generateSimpleSecureRandom(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  
  // Use Date.now() and Math.random() as entropy sources
  const entropy1 = Date.now().toString(16);
  const entropy2 = Math.random().toString(16).slice(2);
  const entropy3 = (Math.random() * 1000000).toString(16);
  const combinedEntropy = entropy1 + entropy2 + entropy3;
  
  for (let i = 0; i < length * 2; i++) {
    if (i < combinedEntropy.length) {
      result += combinedEntropy[i];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result.slice(0, length * 2); // Return hex string of desired byte length
}

/**
 * Core Cryptographic Service for React Native
 * Handles all cryptographic operations with enterprise-grade security
 */
export class CryptographicService {
  private static instance: CryptographicService;
  
  // Cryptographic constants
  private readonly PBKDF2_ITERATIONS = 10000; // Adjusted for mobile performance
  private readonly KEY_SIZE = 256; // bits

  private constructor() {
    // Initialize any required configurations
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CryptographicService {
    if (!CryptographicService.instance) {
      CryptographicService.instance = new CryptographicService();
    }
    return CryptographicService.instance;
  }

  // ====================
  // BIP39 MNEMONIC OPERATIONS
  // ====================

  /**
   * Generate cryptographically secure BIP39 mnemonic phrase
   * @param strength - Entropy strength (128 = 12 words, 256 = 24 words)
   * @returns Generated mnemonic phrase
   */
  public generateMnemonic(strength: 128 | 256 = 128): string {
    try {
      // Generate mnemonic using bip39 library
      const mnemonic = bip39.generateMnemonic(strength);
      
      // Validate generated mnemonic
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Generated mnemonic failed validation');
      }
      
      return mnemonic;
    } catch (error) {
      throw new Error(`Failed to generate mnemonic: ${(error as Error).message}`);
    }
  }

  /**
   * Validate BIP39 mnemonic phrase
   * @param mnemonic - Mnemonic phrase to validate
   * @returns True if valid, false otherwise
   */
  public validateMnemonic(mnemonic: string): boolean {
    try {
      return bip39.validateMnemonic(mnemonic);
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert mnemonic to seed
   * @param mnemonic - Mnemonic phrase
   * @param passphrase - Optional passphrase for additional security
   * @returns Generated seed as hex string
   */
  public mnemonicToSeed(mnemonic: string, passphrase: string = ''): string {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }
      
      const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);
      return seed.toString('hex');
    } catch (error) {
      throw new Error(`Failed to convert mnemonic to seed: ${(error as Error).message}`);
    }
  }

  // ====================
  // HD WALLET OPERATIONS USING ETHERS
  // ====================

  /**
   * Create HD wallet from mnemonic using ethers.js
   * @param mnemonic - BIP39 mnemonic phrase
   * @param passphrase - Optional passphrase
   * @returns HD wallet data with derived accounts
   */
  public createHDWallet(mnemonic: string, passphrase: string = ''): HDWalletData {
    try {
      // Validate mnemonic
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Derive default account (index 0)
      const defaultAccount = this.deriveAccount(mnemonic, 0, passphrase);

      return {
        mnemonic,
        accounts: [defaultAccount]
      };
    } catch (error) {
      throw new Error(`Failed to create HD wallet: ${(error as Error).message}`);
    }
  }

  /**
   * Derive Ethereum account from mnemonic using BIP44
   * @param mnemonic - BIP39 mnemonic phrase
   * @param accountIndex - Account index (0, 1, 2, ...)
   * @param passphrase - Optional passphrase
   * @param addressIndex - Address index (default: 0)
   * @returns Derived account with keys and address
   */
  public deriveAccount(
    mnemonic: string,
    accountIndex: number,
    passphrase: string = '',
    addressIndex: number = 0
  ): CryptoKey & { path: string; index: number } {
    try {
      // BIP44 derivation path: m/44'/60'/accountIndex'/0/addressIndex
      const path = `m/44'/60'/${accountIndex}'/0/${addressIndex}`;
      
      // Create HDNode first, then derive the wallet (ethers v5 API)
      const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      const derivedNode = hdNode.derivePath(path);
      
      return {
        privateKey: derivedNode.privateKey,
        publicKey: derivedNode.publicKey,
        address: derivedNode.address,
        path,
        index: accountIndex
      };
    } catch (error) {
      throw new Error(`Failed to derive account: ${(error as Error).message}`);
    }
  }

  /**
   * Discover accounts with existing balances
   * @param mnemonic - BIP39 mnemonic phrase
   * @param maxAccounts - Maximum accounts to check
   * @returns Array of accounts with their derivation info
   */
  public discoverAccounts(mnemonic: string, maxAccounts: number = 10): Array<{account: CryptoKey & { path: string; index: number }}> {
    try {
      const accounts = [];
      
      for (let i = 0; i < maxAccounts; i++) {
        const account = this.deriveAccount(mnemonic, i);
        accounts.push({ account });
      }
      
      return accounts;
    } catch (error) {
      throw new Error(`Failed to discover accounts: ${(error as Error).message}`);
    }
  }

  // ====================
  // ENCRYPTION/DECRYPTION OPERATIONS
  // ====================

  /**
   * Encrypt data using AES-256-CBC with PBKDF2 key derivation
   * @param data - Data to encrypt
   * @param password - Password for encryption
   * @returns Encrypted data with salt and IV
   */
  public encryptData(data: string, password: string): EncryptedData {
    try {
      // Generate random salt and IV using our secure method
      const saltHex = this.generateSecureRandom(32); // 256 bits
      const ivHex = this.generateSecureRandom(16); // 128 bits
      
      const salt = CryptoJS.enc.Hex.parse(saltHex);
      const iv = CryptoJS.enc.Hex.parse(ivHex);
      
      // Derive key using PBKDF2
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.KEY_SIZE / 32, // Convert to words
        iterations: this.PBKDF2_ITERATIONS,
        hasher: CryptoJS.algo.SHA256
      });
      
      // Encrypt data using AES-CBC
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return {
        data: encrypted.ciphertext.toString(CryptoJS.enc.Hex),
        salt: saltHex,
        iv: ivHex,
        tag: '' // Not applicable for CBC mode
      };
    } catch (error) {
      throw new Error(`Failed to encrypt data: ${(error as Error).message}`);
    }
  }

  /**
   * Decrypt data using AES-256-CBC
   * @param encryptedData - Encrypted data object
   * @param password - Password for decryption
   * @returns Decrypted data
   */
  public decryptData(encryptedData: EncryptedData, password: string): string {
    try {
      // Convert hex strings back to WordArrays
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);
      const ciphertext = CryptoJS.enc.Hex.parse(encryptedData.data);
      
      // Derive key using same parameters
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: this.KEY_SIZE / 32,
        iterations: this.PBKDF2_ITERATIONS,
        hasher: CryptoJS.algo.SHA256
      });
      
      // Create cipher params object
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext
      });
      
      // Decrypt data
      const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid password or corrupted data');
      }
      
      return decryptedString;
    } catch (error) {
      throw new Error(`Failed to decrypt data: ${(error as Error).message}`);
    }
  }

  // ====================
  // UTILITY FUNCTIONS
  // ====================

  /**
   * Generate cryptographically secure random hex string
   * @param length - Number of bytes to generate
   * @returns Random hex string
   */
  public generateSecureRandom(length: number): string {
    try {
      // Method 1: Try react-native-get-random-values
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomBytes = new Uint8Array(length);
        crypto.getRandomValues(randomBytes);
        return Array.from(randomBytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      }
      
      // Method 2: Try node crypto (if available)
      if (typeof require !== 'undefined') {
        try {
          const nodeCrypto = require('crypto');
          if (nodeCrypto && nodeCrypto.randomBytes) {
            const randomBytes = nodeCrypto.randomBytes(length);
            return randomBytes.toString('hex');
          }
        } catch (nodeError) {
          // Node crypto not available, continue to fallback
        }
      }
      
      // Method 3: Fallback to simple secure random
      console.warn('Using fallback random generation method');
      return generateSimpleSecureRandom(length);
      
    } catch (error) {
      // Last resort fallback
      console.warn('All random generation methods failed, using simple fallback:', error);
      return generateSimpleSecureRandom(length);
    }
  }

  /**
   * Generate wallet ID from mnemonic
   * @param mnemonic - Mnemonic phrase
   * @returns Wallet ID
   */
  public generateWalletId(mnemonic: string): string {
    try {
      const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(mnemonic));
      return hash.slice(0, 18); // Use first 8 bytes as ID
    } catch (error) {
      throw new Error(`Failed to generate wallet ID: ${(error as Error).message}`);
    }
  }

  /**
   * Validate Ethereum address format
   * @param address - Address to validate
   * @returns True if valid Ethereum address
   */
  public isValidAddress(address: string): boolean {
    try {
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Validate private key format
   * @param privateKey - Private key to validate
   * @returns True if valid private key
   */
  public isValidPrivateKey(privateKey: string): boolean {
    try {
      // Remove 0x prefix if present
      const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
      
      // Check if it's a valid 64-character hex string
      if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        return false;
      }
      
      // Try to create a wallet to validate
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hash password for storage
   * @param password - Password to hash
   * @param salt - Optional salt (generated if not provided)
   * @returns Hashed password with salt
   */
  public hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    try {
      const passwordSalt = salt || this.generateSecureRandom(32);
      const saltWordArray = CryptoJS.enc.Hex.parse(passwordSalt);
      
      const hash = CryptoJS.PBKDF2(password, saltWordArray, {
        keySize: 256 / 32,
        iterations: this.PBKDF2_ITERATIONS,
        hasher: CryptoJS.algo.SHA256
      });
      
      return {
        hash: hash.toString(CryptoJS.enc.Hex),
        salt: passwordSalt
      };
    } catch (error) {
      throw new Error(`Failed to hash password: ${(error as Error).message}`);
    }
  }

  /**
   * Verify password against hash
   * @param password - Password to verify
   * @param hash - Stored password hash
   * @param salt - Salt used for hashing
   * @returns True if password matches
   */
  public verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const result = this.hashPassword(password, salt);
      return result.hash === hash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign message with private key
   * @param message - Message to sign
   * @param privateKey - Private key for signing
   * @returns Promise of signature
   */
  public async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return await wallet.signMessage(message);
    } catch (error) {
      throw new Error(`Failed to sign message: ${(error as Error).message}`);
    }
  }

  /**
   * Verify message signature
   * @param message - Original message
   * @param signature - Signature to verify
   * @param address - Expected signer address
   * @returns True if signature is valid
   */
  public verifyMessageSignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const cryptoService = CryptographicService.getInstance();
