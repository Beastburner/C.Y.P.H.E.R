/**
 * Wallet Import Test Utility
 * Tests the wallet import functionality to ensure addresses are properly derived
 */

import { cryptoService } from '../services/crypto/CryptographicService.native';
import { walletService } from '../services/WalletService';

export class WalletImportTester {
  static async testMnemonicImport(mnemonic: string): Promise<{
    success: boolean;
    address?: string;
    error?: string;
    debugInfo?: any;
  }> {
    try {
      console.log('🧪 Testing mnemonic import...');
      console.log('📝 Mnemonic:', mnemonic);

      // Step 1: Validate mnemonic
      const isValidMnemonic = cryptoService.validateMnemonic(mnemonic);
      console.log('✅ Mnemonic valid:', isValidMnemonic);
      
      if (!isValidMnemonic) {
        return {
          success: false,
          error: 'Invalid mnemonic phrase'
        };
      }

      // Step 2: Test discoverAccounts directly
      console.log('🔍 Testing direct account discovery...');
      const discoveredAccounts = cryptoService.discoverAccounts(mnemonic, 1);
      console.log('🔍 Discovered accounts:', discoveredAccounts);

      if (!discoveredAccounts || discoveredAccounts.length === 0) {
        return {
          success: false,
          error: 'No accounts discovered',
          debugInfo: { discoveredAccounts }
        };
      }

      const firstAccount = discoveredAccounts[0];
      console.log('🔍 First account structure:', firstAccount);

      // Step 3: Test deriveAccount from WalletService
      console.log('🔧 Testing WalletService.deriveAccount...');
      const derivedAccount = await walletService.deriveAccount(mnemonic, 0);
      console.log('🔧 Derived account:', derivedAccount);

      if (!derivedAccount) {
        return {
          success: false,
          error: 'WalletService failed to derive account',
          debugInfo: { firstAccount, derivedAccount }
        };
      }

      // Step 4: Check if address exists
      const address = derivedAccount.address;
      console.log('📍 Final address:', address);

      if (!address) {
        return {
          success: false,
          error: 'No address in derived account',
          debugInfo: { firstAccount, derivedAccount }
        };
      }

      return {
        success: true,
        address,
        debugInfo: {
          firstAccount,
          derivedAccount,
          isValidMnemonic
        }
      };

    } catch (error) {
      console.error('❌ Wallet import test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        debugInfo: { error }
      };
    }
  }

  static async testPrivateKeyImport(privateKey: string): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> {
    try {
      console.log('🧪 Testing private key import...');
      
      // Clean the private key
      const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
      
      // Validate format
      if (!/^0x[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
        return {
          success: false,
          error: 'Invalid private key format'
        };
      }

      // Test with ethers directly
      const { ethers } = require('ethers');
      const wallet = new ethers.Wallet(cleanPrivateKey);
      
      return {
        success: true,
        address: wallet.address
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default WalletImportTester;
