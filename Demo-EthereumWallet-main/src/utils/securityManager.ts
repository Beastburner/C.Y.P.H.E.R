import { Alert, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import * as CryptoJS from 'crypto-js';
import { setSecureValue, getSecureValue, removeSecureValue } from './storageHelpers';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: string | null;
  error?: string;
}

export interface AuthenticationOptions {
  promptMessage?: string;
  fallbackPrompt?: string;
  disableDeviceFallback?: boolean;
}

class SecurityManager {
  private static instance: SecurityManager;
  private biometrics: ReactNativeBiometrics;
  private isInitialized = false;

  constructor() {
    this.biometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.checkBiometricCapabilities();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize security manager:', error);
      throw error;
    }
  }

  async checkBiometricCapabilities(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType, error } = await this.biometrics.isSensorAvailable();
      
      return {
        isAvailable: available,
        biometryType: biometryType || null,
        error,
      };
    } catch (error) {
      console.error('Biometric check failed:', error);
      return {
        isAvailable: false,
        biometryType: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createBiometricKeys(): Promise<{ publicKey: string } | null> {
    try {
      const { keysExist } = await this.biometrics.biometricKeysExist();
      
      if (keysExist) {
        await this.biometrics.deleteKeys();
      }
      
      const result = await this.biometrics.createKeys();
      return result;
    } catch (error) {
      console.error('Failed to create biometric keys:', error);
      return null;
    }
  }

  async deleteBiometricKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.biometrics.deleteKeys();
      return keysDeleted;
    } catch (error) {
      console.error('Failed to delete biometric keys:', error);
      return false;
    }
  }

  async authenticateWithBiometrics(options: AuthenticationOptions = {}): Promise<boolean> {
    try {
      const capabilities = await this.checkBiometricCapabilities();
      
      if (!capabilities.isAvailable) {
        console.error('Biometric authentication not available:', capabilities.error);
        throw new Error(`Biometric authentication not available: ${capabilities.error || 'Unknown error'}`);
      }

      console.log('Biometric capabilities:', capabilities);

      const { keysExist } = await this.biometrics.biometricKeysExist();
      console.log('Biometric keys exist:', keysExist);
      
      if (!keysExist) {
        console.log('Creating new biometric keys...');
        const result = await this.createBiometricKeys();
        if (!result) {
          throw new Error('Failed to create biometric keys');
        }
        console.log('Biometric keys created successfully');
      }

      console.log('Attempting biometric authentication...');
      const { success, signature, error } = await this.biometrics.createSignature({
        promptMessage: options.promptMessage || 'Authenticate to access your wallet',
        payload: Date.now().toString(),
        cancelButtonText: 'Cancel',
      });

      console.log('Biometric authentication result:', { success, hasSignature: !!signature, error });

      if (error) {
        console.error('Biometric authentication error:', error);
        throw new Error(`Biometric authentication failed: ${error}`);
      }

      if (success && signature) {
        await this.logSecurityEvent('biometric_auth_success');
        return true;
      } else {
        await this.logSecurityEvent('biometric_auth_failed', { reason: 'No signature generated' });
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      await this.logSecurityEvent('biometric_auth_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  // Password-based authentication
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const passwordSalt = salt || CryptoJS.lib.WordArray.random(256/8).toString();
    const hash = CryptoJS.PBKDF2(password, passwordSalt, {
      keySize: 512/32,
      iterations: 10000
    }).toString();
    
    return { hash, salt: passwordSalt };
  }

  async setPassword(password: string): Promise<boolean> {
    try {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const { hash, salt } = await this.hashPassword(password);
      
      await setSecureValue('wallet_password_hash', hash);
      await setSecureValue('wallet_password_salt', salt);
      await setSecureValue('wallet_lock_enabled', 'true');
      
      return true;
    } catch (error) {
      console.error('Failed to set password:', error);
      return false;
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    try {
      const storedHash = await getSecureValue('wallet_password_hash');
      const salt = await getSecureValue('wallet_password_salt');
      
      if (!storedHash || !salt) {
        return false;
      }

      const { hash } = await this.hashPassword(password, salt);
      return hash === storedHash;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  async isPasswordSet(): Promise<boolean> {
    try {
      const hash = await getSecureValue('wallet_password_hash');
      return !!hash;
    } catch {
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await getSecureValue('biometric_enabled');
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  async enableBiometric(password?: string): Promise<boolean> {
    try {
      const capabilities = await this.checkBiometricCapabilities();
      if (!capabilities.isAvailable) {
        console.error('Cannot enable biometric - not available:', capabilities.error);
        throw new Error(`Biometric authentication not available: ${capabilities.error || 'Unknown error'}`);
      }

      console.log('Enabling biometric authentication...');
      
      // Create biometric keys
      const keyResult = await this.createBiometricKeys();
      if (!keyResult) {
        throw new Error('Failed to create biometric keys');
      }
      console.log('Biometric keys created successfully');

      await setSecureValue('biometric_enabled', 'true');
      
      // Store the password securely for biometric unlock
      if (password) {
        await setSecureValue('biometric_password', password);
        console.log('Password stored for biometric unlock');
      }
      
      await this.logSecurityEvent('biometric_enabled');
      console.log('Biometric authentication enabled successfully');
      return true;
    } catch (error) {
      console.error('Failed to enable biometric:', error);
      await this.logSecurityEvent('biometric_enable_failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async disableBiometric(): Promise<boolean> {
    try {
      await this.deleteBiometricKeys();
      await setSecureValue('biometric_enabled', 'false');
      
      // Clean up stored password
      try {
        await setSecureValue('biometric_password', '');
      } catch (error) {
        console.warn('Failed to clear biometric password:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to disable biometric:', error);
      return false;
    }
  }

  // Wallet locking mechanism
  async isWalletLocked(): Promise<boolean> {
    try {
      const locked = await getSecureValue('wallet_locked');
      const lockEnabled = await getSecureValue('wallet_lock_enabled');
      const lockTimestamp = await getSecureValue('wallet_lock_timestamp');
      
      // If wallet was locked but no timestamp exists, it might be from an old version
      // In this case, check if it's been too long since lock
      if (locked === 'true' && lockTimestamp) {
        const lockTime = parseInt(lockTimestamp);
        const currentTime = Date.now();
        const timeDiff = currentTime - lockTime;
        
        // If locked for more than 1 hour, auto-unlock for better UX
        // This prevents wallet from being permanently locked due to app crashes
        if (timeDiff > 60 * 60 * 1000) { // 1 hour
          console.log('Auto-unlocking wallet after extended lock period');
          await this.unlockWallet();
          return false;
        }
      }
      
      return locked === 'true' && lockEnabled === 'true';
    } catch {
      return true; // Default to locked for security
    }
  }

  async lockWallet(): Promise<void> {
    try {
      await setSecureValue('wallet_locked', 'true');
      // Store lock timestamp for recovery purposes
      await setSecureValue('wallet_lock_timestamp', Date.now().toString());
      console.log('Wallet locked at:', new Date().toISOString());
    } catch (error) {
      console.error('Failed to lock wallet:', error);
    }
  }

  async unlockWallet(): Promise<void> {
    try {
      await setSecureValue('wallet_locked', 'false');
      // Clear lock timestamp
      await setSecureValue('wallet_lock_timestamp', '');
      console.log('Wallet unlocked at:', new Date().toISOString());
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
    }
  }

  // Auto-lock functionality
  async setAutoLockTimeout(minutes: number): Promise<void> {
    try {
      await setSecureValue('auto_lock_timeout', minutes.toString());
    } catch (error) {
      console.error('Failed to set auto-lock timeout:', error);
    }
  }

  async getAutoLockTimeout(): Promise<number> {
    try {
      const timeout = await getSecureValue('auto_lock_timeout');
      return timeout ? parseInt(timeout, 10) : 5; // Default 5 minutes
    } catch {
      return 5;
    }
  }

  // Secure data encryption for sensitive wallet data
  encryptSensitiveData(data: string, password: string): string {
    try {
      return CryptoJS.AES.encrypt(data, password).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  decryptSensitiveData(encryptedData: string, password: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Decryption failed - invalid password or corrupted data');
      }
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // Security validation
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let score = 0;

    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else suggestions.push('Include special characters');

    if (!/(.)\1{2,}/.test(password)) score += 1;
    else suggestions.push('Avoid repeating characters');

    return {
      isValid: score >= 4 && password.length >= 8,
      score,
      suggestions,
    };
  }

  // Emergency recovery
  async createRecoveryCode(): Promise<string> {
    const recoveryCode = CryptoJS.lib.WordArray.random(128/8).toString();
    const { hash } = await this.hashPassword(recoveryCode);
    await setSecureValue('recovery_code_hash', hash);
    return recoveryCode;
  }

  async verifyRecoveryCode(code: string): Promise<boolean> {
    try {
      const storedHash = await getSecureValue('recovery_code_hash');
      if (!storedHash) return false;

      const { hash } = await this.hashPassword(code, '');
      return hash === storedHash;
    } catch {
      return false;
    }
  }

  // Security audit logging
  async logSecurityEvent(event: string, details?: any): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        event,
        details: details || {},
        platform: Platform.OS,
      };
      
      // Store security logs (could be sent to analytics in production)
      const logs = await getSecureValue('security_logs') || '[]';
      let parsedLogs: any[] = [];
      
      try {
        parsedLogs = JSON.parse(logs);
        if (!Array.isArray(parsedLogs)) {
          parsedLogs = [];
        }
      } catch (parseError) {
        console.warn('Invalid security logs format, resetting:', parseError);
        parsedLogs = [];
      }
      parsedLogs.push(logEntry);
      
      // Keep only last 100 entries
      if (parsedLogs.length > 100) {
        parsedLogs.splice(0, parsedLogs.length - 100);
      }
      
      await setSecureValue('security_logs', JSON.stringify(parsedLogs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  async clearSecurityLogs(): Promise<void> {
    try {
      await removeSecureValue('security_logs');
    } catch (error) {
      console.error('Failed to clear security logs:', error);
    }
  }
}

export default SecurityManager;
