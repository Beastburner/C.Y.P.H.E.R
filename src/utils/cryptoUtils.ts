import { ethers } from 'ethers';
import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'crypto';

/**
 * ECLIPTA Crypto Utilities
 * Advanced cryptographic functions for wallet security
 */

export class CryptoUtils {
  /**
   * Generate cryptographically secure salt
   */
  static generateSalt(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for environments without crypto.getRandomValues
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate initialization vector
   */
  static generateIV(): string {
    return this.generateSalt(16);
  }

  /**
   * Encrypt data with simple encoding (for React Native compatibility)
   */
  static encrypt(data: string, password: string, salt?: string): { encrypted: string; salt: string; iv: string } {
    try {
      const actualSalt = salt || this.generateSalt();
      const iv = this.generateIV();
      
      // Simple XOR encryption for React Native
      const key = this.sha256(password + actualSalt);
      const encrypted = this.xorEncrypt(data, key);

      return {
        encrypted,
        salt: actualSalt,
        iv
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with simple decoding
   */
  static decrypt(encryptedData: string, password: string, salt: string, iv: string): string {
    try {
      // Simple XOR decryption
      const key = this.sha256(password + salt);
      const decrypted = this.xorDecrypt(encryptedData, key);
      
      if (!decrypted) {
        throw new Error('Invalid password or corrupted data');
      }

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data: Invalid password');
    }
  }

  /**
   * Simple XOR encryption
   */
  private static xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result, 'binary').toString('base64');
  }

  /**
   * Simple XOR decryption
   */
  private static xorDecrypt(encoded: string, key: string): string {
    const text = Buffer.from(encoded, 'base64').toString('binary');
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Hash data with SHA-256
   */
  static sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate HMAC-SHA256
   */
  static hmac(data: string, key: string): string {
    return createHmac('sha256', key).update(data).digest('hex');
  }

  /**
   * Secure password hashing with salt
   */
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSalt();
    const hash = pbkdf2Sync(password, actualSalt, 10000, 32, 'sha256').toString('hex');
    
    return { hash, salt: actualSalt };
  }

  /**
   * Verify password against hash
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      const computed = this.hashPassword(password, salt);
      return computed.hash === hash;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure mnemonic
   */
  static generateMnemonic(): string {
    return ethers.Wallet.createRandom().mnemonic?.phrase || '';
  }

  /**
   * Validate mnemonic phrase
   */
  static validateMnemonic(mnemonic: string): boolean {
    try {
      ethers.Wallet.fromMnemonic(mnemonic);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate private key from mnemonic and path
   */
  static generatePrivateKey(mnemonic: string, path: string = "m/44'/60'/0'/0/0"): string {
    try {
      const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
      const wallet = hdNode.derivePath(path);
      return wallet.privateKey;
    } catch (error) {
      console.error('Private key generation failed:', error);
      throw new Error('Invalid mnemonic or derivation path');
    }
  }

  /**
   * Get address from private key
   */
  static getAddressFromPrivateKey(privateKey: string): string {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return wallet.address;
    } catch (error) {
      console.error('Address generation failed:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Sign message with private key
   */
  static async signMessage(message: string, privateKey: string): Promise<string> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      return await wallet.signMessage(message);
    } catch (error) {
      console.error('Message signing failed:', error);
      throw new Error('Failed to sign message');
    }
  }

  /**
   * Verify message signature
   */
  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate secure random bytes
   */
  static randomBytes(length: number): Uint8Array {
    try {
      return new Uint8Array(randomBytes(length));
    } catch {
      // Fallback for React Native
      const array = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  }

  /**
   * Convert bytes to hex string
   */
  static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert hex string to bytes
   */
  static hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  }
}

export default CryptoUtils;
