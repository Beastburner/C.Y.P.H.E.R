/**
 * Secure Storage Wrapper
 * Replaces expo-secure-store with react-native-keychain for better React Native compatibility
 */

import * as Keychain from 'react-native-keychain';

export class SecureStorage {
  /**
   * Store a key-value pair securely
   */
  static async setItemAsync(key: string, value: string): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        key,
        key, // username - we use key as both service and username
        value // password - this is our actual data
      );
    } catch (error) {
      throw new Error(`Failed to store item: ${error}`);
    }
  }

  /**
   * Retrieve a stored value by key
   */
  static async getItemAsync(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(key);
      if (credentials && typeof credentials !== 'boolean') {
        return credentials.password; // Our data is stored as the password
      }
      return null;
    } catch (error) {
      // If the key doesn't exist, keychain throws an error
      return null;
    }
  }

  /**
   * Delete a stored key-value pair
   */
  static async deleteItemAsync(key: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(key);
    } catch (error) {
      // If the key doesn't exist, it's okay - we wanted to delete it anyway
    }
  }

  /**
   * Check if a key exists
   */
  static async hasItemAsync(key: string): Promise<boolean> {
    try {
      const item = await this.getItemAsync(key);
      return item !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export as default for compatibility with expo-secure-store API
export default SecureStorage;

// Named exports for flexibility
export const setItemAsync = SecureStorage.setItemAsync;
export const getItemAsync = SecureStorage.getItemAsync;
export const deleteItemAsync = SecureStorage.deleteItemAsync;
export const hasItemAsync = SecureStorage.hasItemAsync;
