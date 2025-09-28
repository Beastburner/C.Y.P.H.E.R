import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { PrivacyWalletProvider, usePrivacyWallet } from './src/context/PrivacyWalletContext';

console.log('🚀 Privacy App.tsx loaded');

const ReceiveScreen: React.FC = () => {
  const { state, togglePrivateMode, generatePrivateAddress, createAlias } = usePrivacyWallet();
  const [address, setAddress] = useState('0x742d35Cc6635C0532925a3b8D6Ac6314d79fac7e');

  const handleTogglePrivacy = async () => {
    togglePrivateMode();
    if (!state.isPrivateMode) {
      // Switching to private mode - generate private address
      const privateAddr = await generatePrivateAddress();
      setAddress(privateAddr);
    } else {
      // Switching to public mode - use regular address
      setAddress('0x742d35Cc6635C0532925a3b8D6Ac6314d79fac7e');
    }
  };

  const handleCreateAlias = async () => {
    try {
      const commitment = await generatePrivateAddress();
      const aliasId = await createAlias(commitment);
      console.log('Alias created:', aliasId);
    } catch (error) {
      console.error('Failed to create alias:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CYPHER Receive</Text>
      
      <View style={styles.privacyToggle}>
        <Text style={styles.label}>Privacy Mode</Text>
        <TouchableOpacity 
          style={[styles.toggleButton, state.isPrivateMode && styles.activeToggle]}
          onPress={handleTogglePrivacy}
        >
          <Text style={styles.toggleText}>
            {state.isPrivateMode ? 'PRIVATE' : 'PUBLIC'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.label}>
          {state.isPrivateMode ? 'Shielded Address:' : 'Public Address:'}
        </Text>
        <Text style={styles.address} numberOfLines={2}>
          {address}
        </Text>
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateAlias}>
        <Text style={styles.buttonText}>Create Privacy Alias</Text>
      </TouchableOpacity>

      <View style={styles.stats}>
        <Text style={styles.statText}>Privacy Score: {state.privacySettings.privacyScore}</Text>
        <Text style={styles.statText}>
          Mode: {state.isPrivateMode ? 'Private' : 'Public'}
        </Text>
        <Text style={styles.statText}>Aliases: {state.aliases.length}</Text>
      </View>
    </View>
  );
};

const AppContent: React.FC = () => {
  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ReceiveScreen />
    </View>
  );
};

const App: React.FC = () => {
  return (
    <PrivacyWalletProvider>
      <AppContent />
    </PrivacyWalletProvider>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  privacyToggle: {
    marginBottom: 30,
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#555',
  },
  activeToggle: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  address: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'monospace',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  stats: {
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
  },
  statText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default App;
