/**
 * ENS Stealth Address Demo Component
 * 
 * Demonstrates the ENS ephemeral subdomain + stealth address generation
 * feature in a user-friendly interface.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Clipboard
} from 'react-native';
import { ethers } from 'ethers';
import { useENSStealth } from '../hooks/useENSStealth';

interface ENSStealthDemoProps {
  provider?: ethers.providers.JsonRpcProvider;
  onBack?: () => void;
}

const ENSStealthDemo: React.FC<ENSStealthDemoProps> = ({ 
  provider, 
  onBack 
}) => {
  const [ensName, setEnsName] = useState('alice.eth');
  const [amount, setAmount] = useState('1.0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  console.log('🔮 ENSStealthDemo mounted with provider:', !!provider);

  const {
    isResolving,
    isGenerating,
    error,
    lastResult,
    generateStealthForENS,
    testSubdomainRotation,
    clearError,
    reset,
    isValidENS,
    formatStealthAddress
  } = useENSStealth(provider);

  const handleGenerateStealthAddress = useCallback(async () => {
    if (!ensName.trim()) {
      Alert.alert('Error', 'Please enter an ENS name');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    await generateStealthForENS(ensName.trim(), amount.trim());
  }, [ensName, amount, generateStealthForENS]);

  const handleTestRotation = useCallback(async () => {
    const result = await testSubdomainRotation(ensName.trim());
    if (result) {
      Alert.alert(
        'Subdomain Rotation Test',
        `Original: ${formatStealthAddress(result.original)}\n` +
        `Rotated: ${formatStealthAddress(result.rotated)}\n` +
        `Different: ${result.different ? 'Yes ✅' : 'No ❌'}`,
        [{ text: 'OK' }]
      );
    }
  }, [ensName, testSubdomainRotation, formatStealthAddress]);

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔮 ENS Stealth Generator</Text>
        <Text style={styles.subtitle}>
          Generate ephemeral stealth addresses from ENS names
        </Text>
        
        {/* Network Status Indicator */}
        <View style={styles.networkStatus}>
          <Text style={[styles.networkText, { color: provider ? '#00ff88' : '#ff4444' }]}>
            {provider ? '🟢 Network Connected' : '🔴 No Network Provider'}
          </Text>
        </View>
        
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Input Form */}
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ENS Name</Text>
          <TextInput
            style={[
              styles.input,
              !isValidENS(ensName) && ensName.length > 0 && styles.inputError
            ]}
            value={ensName}
            onChangeText={setEnsName}
            placeholder="alice.eth"
            placeholderTextColor="#666"
            autoCapitalize="none"
          />
          {!isValidENS(ensName) && ensName.length > 0 && (
            <Text style={styles.errorText}>Invalid ENS format</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (ETH)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="1.0"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              (isGenerating || !isValidENS(ensName)) && styles.buttonDisabled
            ]}
            onPress={handleGenerateStealthAddress}
            disabled={isGenerating || !isValidENS(ensName)}
          >
            <Text style={styles.buttonText}>
              {isResolving ? 'Resolving ENS...' : 
               isGenerating ? 'Generating...' : 
               '🎯 Generate Stealth Address'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.secondaryButtonText}>
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advanced Options */}
      {showAdvanced && (
        <View style={styles.advanced}>
          <Text style={styles.sectionTitle}>Advanced Options</Text>
          
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestRotation}
            disabled={isGenerating}
          >
            <Text style={styles.buttonText}>🔄 Test Subdomain Rotation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={reset}
          >
            <Text style={styles.buttonText}>🔄 Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
            <Text style={styles.clearErrorText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Display */}
      {lastResult && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>✨ Stealth Generation Results</Text>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Stealth Address</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(lastResult.stealthAddress, 'Stealth Address')}
              style={styles.resultValueContainer}
            >
              <Text style={styles.resultValue}>{lastResult.stealthAddress}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Ephemeral Public Key</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(lastResult.ephemeralPublicKey, 'Ephemeral Key')}
              style={styles.resultValueContainer}
            >
              <Text style={styles.resultValueSmall}>{lastResult.ephemeralPublicKey}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Note Commitment</Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(lastResult.noteCommitment, 'Note Commitment')}
              style={styles.resultValueContainer}
            >
              <Text style={styles.resultValueSmall}>{lastResult.noteCommitment}</Text>
              <Text style={styles.copyHint}>Tap to copy</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              🔒 This stealth address is unique and can only be detected by the recipient using their private key and the ephemeral public key.
            </Text>
          </View>
        </View>
      )}

      {/* How It Works */}
      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>🔍 How It Works</Text>
        <View style={styles.stepContainer}>
          <Text style={styles.step}>1. Resolve ENS name → IPFS manifest</Text>
          <Text style={styles.step}>2. Check for ephemeral subdomain</Text>
          <Text style={styles.step}>3. Perform ECDH key exchange</Text>
          <Text style={styles.step}>4. Generate stealth address (EIP-5564)</Text>
          <Text style={styles.step}>5. Create privacy commitment</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    color: '#00ff88',
    fontSize: 14,
  },
  networkStatus: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  networkText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 25,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 5,
  },
  buttons: {
    gap: 12,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#00ff88',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  testButton: {
    backgroundColor: '#007acc',
  },
  resetButton: {
    backgroundColor: '#666',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  advanced: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 15,
  },
  errorContainer: {
    backgroundColor: '#3a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorMessage: {
    color: '#ffaaaa',
    fontSize: 14,
    marginBottom: 10,
  },
  clearErrorButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearErrorText: {
    color: '#fff',
    fontSize: 12,
  },
  results: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultLabel: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultValueContainer: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
  },
  resultValue: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  resultValueSmall: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyHint: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
  infoBox: {
    backgroundColor: '#1a3a1a',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
  },
  infoText: {
    color: '#aaffaa',
    fontSize: 14,
  },
  howItWorks: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 25,
  },
  stepContainer: {
    paddingLeft: 10,
  },
  step: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ENSStealthDemo;
