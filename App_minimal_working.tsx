import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { PrivacyWalletProvider, usePrivacyWallet } from './src/context/PrivacyWalletContext';

console.log('🚀 Privacy App.tsx loaded');
console.log('✅ CYPHER Wallet registered with CommonJS and crypto polyfills');

function PrivacyWalletApp() {
  const { 
    state,
    togglePrivateMode, 
    generatePrivateAddress, 
    createAlias,
    shieldFunds 
  } = usePrivacyWallet();
  
  const [shieldedAddress, setShieldedAddress] = useState<string>('');
  const [status, setStatus] = useState<string>('Ready');

  const handleGenerateAddress = async () => {
    try {
      setStatus('Generating shielded address...');
      const address = await generatePrivateAddress();
      setShieldedAddress(address);
      setStatus('Address generated!');
      setTimeout(() => setStatus('Ready'), 2000);
    } catch (error) {
      console.error('Error generating address:', error);
      setStatus('Error generating address');
    }
  };

  const handleDeposit = async () => {
    try {
      setStatus('Shielding 0.1 ETH...');
      const result = await shieldFunds('0.1');
      setStatus('Funds shielded successfully!');
      setTimeout(() => setStatus('Ready'), 3000);
    } catch (error) {
      console.error('Error shielding funds:', error);
      setStatus('Shield failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CYPHER Privacy Wallet</Text>
        <Text style={styles.subtitle}>Dual-Layer Privacy Demo</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      <View style={styles.privacyToggle}>
        <Text style={styles.label}>Privacy Mode:</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, state.isPrivateMode && styles.toggleButtonActive]}
          onPress={togglePrivateMode}
        >
          <Text style={styles.toggleText}>
            {state.isPrivateMode ? 'PRIVATE' : 'PUBLIC'}
          </Text>
        </TouchableOpacity>
      </View>

      {state.aliases.length > 0 && (
        <View style={styles.aliasContainer}>
          <Text style={styles.label}>Current Alias:</Text>
          <Text style={styles.alias}>{state.aliases[state.aliases.length - 1]}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleGenerateAddress}>
        <Text style={styles.buttonText}>Generate Shielded Address</Text>
      </TouchableOpacity>

      {shieldedAddress && (
        <View style={styles.addressContainer}>
          <Text style={styles.label}>Shielded Address:</Text>
          <Text style={styles.address}>{shieldedAddress}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleDeposit}>
        <Text style={styles.buttonText}>Test Privacy Deposit (0.1 ETH)</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          🔒 Privacy features working with deployed SimplePrivacyPool contract
        </Text>
        <Text style={styles.infoText}>
          📱 Ready for hackathon demo
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <PrivacyWalletProvider>
      <PrivacyWalletApp />
    </PrivacyWalletProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  status: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '500',
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  toggleButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  aliasContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  alias: {
    fontSize: 14,
    color: '#00ff88',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addressContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  address: {
    fontSize: 12,
    color: '#00ff88',
    fontFamily: 'monospace',
  },
  infoContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 5,
  },
});
