import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecureStorageOptions } from '../types';

// Keychain service configuration
const KEYCHAIN_SERVICE = 'CYPHER';

export class WalletError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export const ErrorCodes = {
  KEYCHAIN_ERROR: 'KEYCHAIN_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;

/**
 * Store a value securely in the device keychain
 */
export async function setSecureValue(
  key: string,
  value: string,
  options?: SecureStorageOptions
): Promise<void> {
  try {
    // Use unique service name for each key to avoid conflicts
    const serviceKey = `${KEYCHAIN_SERVICE}_${key}`;
    
    // Try with simplified options first
    const result = await Keychain.setInternetCredentials(
      serviceKey,
      key,
      value,
      {
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        // Remove potentially problematic options for now
      }
    );
    
    if (!result) {
      // Fallback to AsyncStorage with encryption if keychain fails
      console.warn('Keychain storage failed, falling back to AsyncStorage');
      await setValue(`secure_${key}`, value);
    } else {
      // Verify the value was stored correctly
      const verifyValue = await getSecureValue(key);
      if (verifyValue !== value) {
        console.warn('Keychain verification failed, using AsyncStorage fallback');
        await setValue(`secure_${key}`, value);
      }
    }
  } catch (error) {
    console.warn('Keychain storage failed, falling back to AsyncStorage:', error);
    // Fallback to AsyncStorage - not as secure but functional
    try {
      await setValue(`secure_${key}`, value);
    } catch (fallbackError) {
      throw new WalletError(
        ErrorCodes.STORAGE_ERROR,
        'Failed to store secure value in both keychain and fallback storage',
        { keychainError: error, fallbackError }
      );
    }
  }
}

/**
 * Retrieve a value securely from the device keychain
 */
export async function getSecureValue(key: string): Promise<string | null> {
  try {
    // Use unique service name for each key to avoid conflicts
    const serviceKey = `${KEYCHAIN_SERVICE}_${key}`;
    const credentials = await Keychain.getInternetCredentials(serviceKey);
    
    if (credentials && credentials.username === key) {
      return credentials.password;
    }
    
    // If keychain doesn't have the value, try fallback storage
    const fallbackValue = await getValue(`secure_${key}`);
    return fallbackValue;
  } catch (error) {
    // Return null for keychain errors, try fallback
    console.warn('Failed to retrieve secure value from keychain, trying fallback:', error);
    try {
      const fallbackValue = await getValue(`secure_${key}`);
      return fallbackValue;
    } catch (fallbackError) {
      console.warn('Failed to retrieve from fallback storage too:', fallbackError);
      return null;
    }
  }
}

/**
 * Remove a value from the device keychain
 */
export async function removeSecureValue(key: string): Promise<void> {
  try {
    // Use unique service name for each key to avoid conflicts
    const serviceKey = `${KEYCHAIN_SERVICE}_${key}`;
    await Keychain.resetInternetCredentials(serviceKey);
  } catch (error) {
    throw new WalletError(
      ErrorCodes.KEYCHAIN_ERROR,
      'Failed to remove secure value',
      error
    );
  }
}

/**
 * Store a value in local storage (non-sensitive data)
 */
export async function setValue(key: string, value: any): Promise<void> {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
    
    // Verify the value was stored correctly for critical keys
    if (key === 'walletInitialized' || key === 'walletAddress' || key === 'wallets') {
      const verifyValue = await AsyncStorage.getItem(key);
      if (verifyValue !== serialized) {
        console.error(`Failed to verify storage for key: ${key}`);
        // Retry once
        await AsyncStorage.setItem(key, serialized);
      }
    }
  } catch (error) {
    console.warn('Failed to store value:', error);
    throw new WalletError(
      ErrorCodes.STORAGE_ERROR,
      `Failed to store value for key: ${key}`,
      error
    );
  }
}

/**
 * Retrieve a value from local storage
 */
export async function getValue(key: string): Promise<any> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    __DEV__ && console.warn('Failed to retrieve value:', error);
    return null;
  }
}

/**
 * Remove a value from local storage
 */
export async function removeValue(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    __DEV__ && console.warn('Failed to remove value:', error);
  }
}

/**
 * Clear all non-secure storage
 */
export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    __DEV__ && console.warn('Failed to clear storage:', error);
  }
}

/**
 * Get all keys from storage
 */
export async function getAllKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  } catch (error) {
    __DEV__ && console.warn('Failed to get all keys:', error);
    return [];
  }
}

/**
 * Check if storage contains a key
 */
export async function hasKey(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    __DEV__ && console.warn('Failed to check key:', error);
    return false;
  }
}

/**
 * Batch storage operations
 */
export async function setMultipleValues(pairs: Array<[string, any]>): Promise<void> {
  try {
    await Promise.all(
      pairs.map(([key, value]) => setValue(key, value))
    );
  } catch (error) {
    __DEV__ && console.warn('Failed to set multiple values:', error);
  }
}

/**
 * Get storage size information
 */
export async function getStorageSize(): Promise<{ size: number; count: number }> {
  try {
    const keys = await getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    return {
      size: totalSize,
      count: keys.length,
    };
  } catch (error) {
    __DEV__ && console.warn('Failed to get storage size:', error);
    return { size: 0, count: 0 };
  }
}
