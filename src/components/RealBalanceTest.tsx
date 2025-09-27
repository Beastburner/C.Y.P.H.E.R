/**
 * Real Balance Test Component
 * Tests real balance fetching from Sepolia testnet
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import RealWalletService from '../services/RealWalletService';
import { useWallet } from '../context/WalletContext';

export const RealBalanceTest: React.FC = () => {
  const { state } = useWallet();
  const [realBalance, setRealBalance] = useState<string>('Loading...');
  const [contextBalance, setContextBalance] = useState<string>('Loading...');
  const [isLoading, setIsLoading] = useState(false);

  const testRealBalance = async () => {
    setIsLoading(true);
    try {
      if (!state.currentAccount?.address) {
        Alert.alert('Error', 'No wallet account found');
        return;
      }

      console.log('🧪 Testing real balance for address:', state.currentAccount.address);
      
      // Test RealWalletService
      const realWalletService = RealWalletService.getInstance();
      
      // Import wallet using current private key
      if (state.currentAccount?.privateKey) {
        await realWalletService.importFromPrivateKey(
          state.currentAccount.privateKey, 
          'Test Account'
        );
      } else {
        throw new Error('No private key available in current account');
      }

      // Get real balance from Sepolia
      const balance = await realWalletService.getETHBalance();
      setRealBalance(balance);
      
      console.log('✅ Real balance from Sepolia:', balance);
      
    } catch (error) {
      console.error('❌ Failed to get real balance:', error);
      setRealBalance('Error: ' + (error as Error).message);
      Alert.alert('Error', 'Failed to fetch real balance: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setContextBalance(state.balance || '0');
  }, [state.balance]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Real Balance Test</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>WalletContext Balance:</Text>
        <Text style={styles.value}>{contextBalance} ETH</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Real Sepolia Balance:</Text>
        <Text style={styles.value}>{realBalance} ETH</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Wallet Address:</Text>
        <Text style={styles.addressValue}>
          {state.currentAccount?.address ? 
            `${state.currentAccount.address.slice(0, 10)}...${state.currentAccount.address.slice(-8)}` : 
            'No Address'
          }
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testRealBalance}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Real Balance'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default RealBalanceTest;
