import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_NETWORK } from '../config/networks';
import { clearNetworkStorage, forceSepoliaNetwork } from '../utils/clearNetworkStorage';

interface NetworkDebugProps {
  style?: any;
}

export const NetworkDebug: React.FC<NetworkDebugProps> = ({ style }) => {
  const { state, getBalance, switchNetwork } = useWallet();
  const { colors } = useTheme();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const testBalance = async () => {
    setIsLoading(true);
    try {
      console.log('🧪 Testing balance fetch...');
      console.log('Current account:', state.currentAccount?.address);
      console.log('Current network:', state.currentNetwork?.name, state.currentNetwork?.chainId);
      console.log('RPC URL:', state.currentNetwork?.rpcUrl);
      console.log('Default network should be:', DEFAULT_NETWORK.name, DEFAULT_NETWORK.chainId);
      
      const balance = await getBalance();
      console.log('Balance result:', balance);
      
      setDebugInfo({
        account: state.currentAccount?.address,
        network: state.currentNetwork?.name,
        chainId: state.currentNetwork?.chainId,
        rpcUrl: state.currentNetwork?.rpcUrl,
        balance: balance,
        expectedNetwork: DEFAULT_NETWORK.name,
        expectedChainId: DEFAULT_NETWORK.chainId,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Balance test error:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSepolia = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Switching to Sepolia network...');
      console.log('Current network:', state.currentNetwork?.name, 'chainId:', state.currentNetwork?.chainId);
      console.log('Target network:', DEFAULT_NETWORK.name, 'chainId:', DEFAULT_NETWORK.chainId);
      
      await switchNetwork(DEFAULT_NETWORK);
      console.log('✅ Network switch completed');
      Alert.alert('Success', 'Switched to Sepolia network');
      
      // Wait a moment for network to settle, then test balance
      setTimeout(testBalance, 2000);
    } catch (error) {
      console.error('❌ Network switch error:', error);
      Alert.alert('Error', 'Failed to switch network: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.currentAccount?.address) {
      testBalance();
    }
  }, [state.currentNetwork?.chainId, state.currentAccount?.address]);

  const forceNetworkReset = async () => {
    setIsLoading(true);
    try {
      console.log('🚨 Emergency network reset initiated...');
      
      // Show confirmation dialog
      Alert.alert(
        'Network Reset',
        'This will clear all stored network settings and force the app to use Sepolia. The app may need to be restarted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Network',
            style: 'destructive',
            onPress: async () => {
              try {
                await forceSepoliaNetwork();
                Alert.alert(
                  'Network Reset Complete', 
                  'Network storage cleared and forced to Sepolia. Please restart the app to see changes.',
                  [
                    { text: 'OK', onPress: () => testBalance() }
                  ]
                );
              } catch (error) {
                console.error('❌ Network reset failed:', error);
                Alert.alert('Error', 'Network reset failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error in network reset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      padding: 16,
      margin: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    debugText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginBottom: 4,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 8,
      marginTop: 8,
      alignSelf: 'flex-start',
      marginRight: 8,
    },
    buttonText: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
    },
    networkMismatch: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: 'bold',
    },
    buttonRow: {
      flexDirection: 'row',
      marginTop: 8,
    }
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>🧪 Network & Balance Debug</Text>
      
      <Text style={styles.debugText}>Account: {debugInfo.account?.slice(0, 10)}...{debugInfo.account?.slice(-6)}</Text>
      <Text style={styles.debugText}>Network: {debugInfo.network}</Text>
      <Text style={styles.debugText}>Chain ID: {debugInfo.chainId}</Text>
      
      {debugInfo.chainId !== debugInfo.expectedChainId && (
        <Text style={styles.networkMismatch}>
          ⚠️ Wrong Network! Expected: {debugInfo.expectedNetwork} (Chain {debugInfo.expectedChainId})
        </Text>
      )}
      
      <Text style={styles.debugText}>RPC URL: {debugInfo.rpcUrl?.slice(0, 30)}...</Text>
      
      {debugInfo.error ? (
        <Text style={styles.errorText}>Error: {debugInfo.error}</Text>
      ) : (
        <Text style={styles.debugText}>Balance: {debugInfo.balance} ETH</Text>
      )}
      
      <Text style={styles.debugText}>Last Update: {debugInfo.timestamp}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={testBalance} disabled={isLoading}>
          <Text style={styles.buttonText}>
            {isLoading ? 'Testing...' : 'Test Balance'}
          </Text>
        </TouchableOpacity>
        
        {debugInfo.chainId !== debugInfo.expectedChainId && (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.warning }]} onPress={switchToSepolia}>
            <Text style={styles.buttonText}>Switch to Sepolia</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.error }]} onPress={forceNetworkReset}>
          <Text style={styles.buttonText}>🚨 Reset Network</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NetworkDebug;
