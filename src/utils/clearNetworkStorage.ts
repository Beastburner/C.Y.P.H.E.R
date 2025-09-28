import { removeValue, setValue } from './storageHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_NETWORK } from '../config/networks';

/**
 * Clear all stored network state to force app to use DEFAULT_NETWORK
 * This is useful when the app is stuck connecting to the wrong network
 */
export const clearNetworkStorage = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing stored network state...');
    
    // Clear WalletContext stored network
    await removeValue('selectedNetwork');
    console.log('✅ Cleared selectedNetwork from storage');
    
    // Clear NetworkService stored network
    await AsyncStorage.removeItem('current_network');
    console.log('✅ Cleared current_network from AsyncStorage');
    
    // Clear any other potential network storage keys
    const networkKeys = [
      'activeNetwork',
      'preferredNetwork',
      'lastNetwork',
      'currentNetwork',
      'networkConfig',
      'wallet_network',
      'default_network',
    ];
    
    for (const key of networkKeys) {
      try {
        await removeValue(key);
        await AsyncStorage.removeItem(key);
      } catch (error) {
        // Ignore errors for keys that don't exist
      }
    }
    
    console.log('✅ Network storage cleared successfully');
    console.log('🎯 App should now use DEFAULT_NETWORK:', DEFAULT_NETWORK.name, DEFAULT_NETWORK.chainId);
    
  } catch (error) {
    console.error('❌ Error clearing network storage:', error);
    throw error;
  }
};

/**
 * Force set the network to Sepolia by clearing storage and setting explicit values
 */
export const forceSepoliaNetwork = async (): Promise<void> => {
  try {
    console.log('🎯 Force setting network to Sepolia...');
    
    // First clear all stored network state
    await clearNetworkStorage();
    
    // Force set Sepolia as the selected network
    await setValue('selectedNetwork', DEFAULT_NETWORK);
    await AsyncStorage.setItem('current_network', JSON.stringify({
      chainId: DEFAULT_NETWORK.chainId,
      name: DEFAULT_NETWORK.name
    }));
    
    // Also set it with different key formats that might be used
    await setValue('activeNetwork', DEFAULT_NETWORK);
    await setValue('currentNetwork', DEFAULT_NETWORK);
    
    console.log('✅ Forced network to Sepolia');
    console.log('📱 Please restart the app for changes to take full effect');
    
  } catch (error) {
    console.error('❌ Error forcing Sepolia network:', error);
    throw error;
  }
};
