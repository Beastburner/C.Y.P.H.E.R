import React from 'react';
import { Alert, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { SecureStorage } from './secureStorage';

/**
 * @title Biometric Authentication Manager
 * @dev Handles biometric authentication operations across platforms
 * @notice This module provides:
 *         - Biometric availability checking
 *         - Authentication prompts
 *         - Secure key generation and storage
 *         - Cross-platform compatibility
 */

interface BiometricResult {
  success: boolean;
  error?: string;
  signature?: string;
}

interface BiometricCapabilities {
  available: boolean;
  biometryType: string | null;
  error?: string;
}

class BiometricAuthentication {
  private rnBiometrics: ReactNativeBiometrics;
  private isInitialized: boolean = false;

  constructor() {
    this.rnBiometrics = new ReactNativeBiometrics({
      allowDeviceCredentials: true,
    });
  }

  /**
   * @dev Initialize biometric authentication
   * @returns Promise<boolean> Success status
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      const { available, biometryType } = await this.rnBiometrics.isSensorAvailable();
      
      if (available) {
        console.log(`Biometric sensor available: ${biometryType}`);
        this.isInitialized = true;
        return true;
      }

      console.log('Biometric sensor not available');
      return false;
    } catch (error) {
      console.error('Biometric initialization failed:', error);
      return false;
    }
  }

  /**
   * @dev Check if biometric authentication is supported
   * @returns Promise<boolean> Support status
   */
  async isSupported(): Promise<boolean> {
    try {
      const capabilities = await this.getCapabilities();
      return capabilities.available;
    } catch (error) {
      console.error('Biometric support check failed:', error);
      return false;
    }
  }

  /**
   * @dev Get biometric capabilities
   * @returns Promise<BiometricCapabilities> Capability information
   */
  async getCapabilities(): Promise<BiometricCapabilities> {
    try {
      const { available, biometryType, error } = await this.rnBiometrics.isSensorAvailable();
      
      return {
        available,
        biometryType: biometryType || null,
        error,
      };
    } catch (error) {
      return {
        available: false,
        biometryType: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * @dev Authenticate user with biometrics
   * @param promptMessage Message to show in authentication prompt
   * @param subtitle Optional subtitle for the prompt
   * @returns Promise<BiometricResult> Authentication result
   */
  async authenticate(
    promptMessage: string = 'Please authenticate',
    subtitle?: string
  ): Promise<BiometricResult> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return {
            success: false,
            error: 'Biometric authentication not available',
          };
        }
      }

      const result = await this.rnBiometrics.simplePrompt({
        promptMessage,
        cancelButtonText: 'Cancel',
        ...(subtitle && { fallbackPromptMessage: subtitle }),
      });

      if (result.success) {
        console.log('Biometric authentication successful');
        return { success: true };
      } else {
        console.log('Biometric authentication failed:', result.error);
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  }

  /**
   * @dev Create biometric keys for secure operations
   * @param keyAlias Alias for the key
   * @returns Promise<boolean> Success status
   */
  async createBiometricKey(keyAlias: string = 'biometric_key'): Promise<boolean> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        throw new Error('Biometric sensor not available');
      }

      const result = await this.rnBiometrics.createKeys();
      console.log('Biometric keys created successfully:', result);
      await SecureStorage.setItemAsync(`${keyAlias}_created`, 'true');
      return true;
    } catch (error) {
      console.error('Biometric key creation failed:', error);
      return false;
    }
  }

  /**
   * @dev Check if biometric keys exist
   * @param keyAlias Alias for the key
   * @returns Promise<boolean> Key existence status
   */
  async biometricKeysExist(keyAlias: string = 'biometric_key'): Promise<boolean> {
    try {
      const { keysExist } = await this.rnBiometrics.biometricKeysExist();
      const keyCreated = await SecureStorage.getItemAsync(`${keyAlias}_created`);
      
      return keysExist && keyCreated === 'true';
    } catch (error) {
      console.error('Biometric keys check failed:', error);
      return false;
    }
  }

  /**
   * @dev Delete biometric keys
   * @param keyAlias Alias for the key
   * @returns Promise<boolean> Success status
   */
  async deleteBiometricKeys(keyAlias: string = 'biometric_key'): Promise<boolean> {
    try {
      await this.rnBiometrics.deleteKeys();
      await SecureStorage.deleteItemAsync(`${keyAlias}_created`);
      console.log('Biometric keys deleted successfully');
      return true;
    } catch (error) {
      console.error('Biometric key deletion failed:', error);
      return false;
    }
  }

  /**
   * @dev Create signature with biometric authentication
   * @param payload Data to sign
   * @param promptMessage Authentication prompt message
   * @returns Promise<BiometricResult> Signature result
   */
  async createSignature(
    payload: string,
    promptMessage: string = 'Sign transaction'
  ): Promise<BiometricResult> {
    try {
      const keysExist = await this.biometricKeysExist();
      if (!keysExist) {
        const keyCreated = await this.createBiometricKey();
        if (!keyCreated) {
          return {
            success: false,
            error: 'Failed to create biometric keys',
          };
        }
      }

      const result = await this.rnBiometrics.createSignature({
        promptMessage,
        payload,
        cancelButtonText: 'Cancel',
      });

      if (result.success && result.signature) {
        console.log('Biometric signature created successfully');
        return {
          success: true,
          signature: result.signature,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to create signature',
        };
      }
    } catch (error) {
      console.error('Biometric signature creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signature creation error',
      };
    }
  }

  /**
   * @dev Get biometric type string for display
   * @returns Promise<string> Biometric type name
   */
  async getBiometricTypeString(): Promise<string> {
    try {
      const { biometryType } = await this.getCapabilities();
      
      switch (biometryType) {
        case 'TouchID':
          return 'Touch ID';
        case 'FaceID':
          return 'Face ID';
        case 'Biometrics':
          return Platform.OS === 'android' ? 'Fingerprint' : 'Biometrics';
        default:
          return 'Biometric Authentication';
      }
    } catch (error) {
      return 'Biometric Authentication';
    }
  }

  /**
   * @dev Check if user has enrolled biometrics
   * @returns Promise<boolean> Enrollment status
   */
  async hasEnrolledBiometrics(): Promise<boolean> {
    try {
      const { available, biometryType } = await this.getCapabilities();
      return available && biometryType !== null;
    } catch (error) {
      console.error('Biometric enrollment check failed:', error);
      return false;
    }
  }

  /**
   * @dev Show biometric enrollment prompt
   * @returns Promise<void>
   */
  async showEnrollmentPrompt(): Promise<void> {
    const biometricType = await this.getBiometricTypeString();
    
    Alert.alert(
      'Biometric Authentication',
      `${biometricType} is not set up on this device. Please enable it in your device settings for enhanced security.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => {
            // In a real implementation, you would open device settings
            console.log('Open device settings for biometric enrollment');
          }
        },
      ]
    );
  }

  /**
   * @dev Validate biometric authentication setup
   * @returns Promise<{ valid: boolean; message?: string }>
   */
  async validateSetup(): Promise<{ valid: boolean; message?: string }> {
    try {
      const capabilities = await this.getCapabilities();
      
      if (!capabilities.available) {
        return {
          valid: false,
          message: 'Biometric authentication is not available on this device',
        };
      }

      const hasEnrolled = await this.hasEnrolledBiometrics();
      if (!hasEnrolled) {
        return {
          valid: false,
          message: 'Please enroll biometrics in your device settings',
        };
      }

      const keysExist = await this.biometricKeysExist();
      if (!keysExist) {
        const keyCreated = await this.createBiometricKey();
        if (!keyCreated) {
          return {
            valid: false,
            message: 'Failed to create biometric keys',
          };
        }
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }
}

// Export singleton instance
export const biometricAuthentication = new BiometricAuthentication();

// Export types
export type { BiometricResult, BiometricCapabilities };
