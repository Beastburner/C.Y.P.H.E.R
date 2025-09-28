/**
 * ENS Privacy Demo Screen
 * Showcases the ENS Ephemeral Subdomain + Stealth Address Generator functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ethers } from 'ethers';

// Import our services
import ENSPrivacyService, { StealthAddressResult } from '../services/ensPrivacyService';
import ENSPrivacyPoolService from '../services/ensPrivacyPoolService';
import ShieldedPoolService from '../services/shieldedPoolService';

interface DemoState {
  ensName: string;
  amount: string;
  loading: boolean;
  stealthResult: StealthAddressResult | null;
  paymentMetadata: any | null;
  scanResults: any[] | null;
}

const ENSPrivacyDemoScreen: React.FC = () => {
  const [state, setState] = useState<DemoState>({
    ensName: 'vitalik.eth',
    amount: '0.1',
    loading: false,
    stealthResult: null,
    paymentMetadata: null,
    scanResults: null,
  });

  const [services, setServices] = useState<{
    ensService: ENSPrivacyService | null;
    privacyPoolService: ENSPrivacyPoolService | null;
  }>({
    ensService: null,
    privacyPoolService: null,
  });

  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize provider (mock for demo)
      const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
      
      // Initialize services
      const ensService = new ENSPrivacyService(provider);
      const shieldedPoolService = new ShieldedPoolService(provider, '0x1234567890123456789012345678901234567890'); // Mock contract address
      const privacyPoolService = new ENSPrivacyPoolService(
        provider, 
        shieldedPoolService,
        ethers.Wallet.createRandom().connect(provider) // Mock signer for demo
      );

      setServices({
        ensService,
        privacyPoolService,
      });

      console.log('✅ ENS Privacy services initialized');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
    }
  };

  const handleENSStealthResolution = async () => {
    if (!services.ensService || !state.ensName) {
      Alert.alert('Error', 'Please enter an ENS name and wait for services to load');
      return;
    }

    setState(prev => ({ ...prev, loading: true, stealthResult: null, paymentMetadata: null }));

    try {
      console.log('🚀 Starting ENS stealth resolution demo...');
      
      // Step 1: Resolve ENS with stealth address generation
      const stealthResult = await services.ensService.resolveWithStealth(state.ensName);
      
      // Step 2: Generate payment metadata
      const paymentMetadata = await services.ensService.generatePaymentMetadata(
        stealthResult, 
        ethers.utils.parseEther(state.amount).toString()
      );

      setState(prev => ({
        ...prev,
        stealthResult,
        paymentMetadata,
        loading: false,
      }));

      Alert.alert(
        '✅ Success', 
        `Stealth address generated for ${state.ensName}!\n\nStealth Address: ${stealthResult.stealthAddress.slice(0, 20)}...\n\nCheck the details below.`
      );

    } catch (error: any) {
      console.error('❌ ENS stealth resolution failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('❌ Error', `ENS stealth resolution failed: ${error.message}`);
    }
  };

  const handlePrivacyPoolDeposit = async () => {
    if (!services.privacyPoolService || !state.ensName) {
      Alert.alert('Error', 'Please resolve an ENS name first');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      console.log('🚀 Starting privacy pool deposit demo...');
      
      const result = await services.privacyPoolService.depositWithENSPrivacy({
        ensName: state.ensName,
        amount: state.amount,
        useStealthAddress: true,
        recipientNote: 'Demo privacy deposit'
      });

      setState(prev => ({ ...prev, loading: false }));

      if (result.success) {
        Alert.alert(
          '✅ Privacy Deposit Success', 
          `Deposit completed!\n\nTransaction: ${result.txHash?.slice(0, 20)}...\n\nStealth Address: ${result.stealthResult?.stealthAddress.slice(0, 20)}...`
        );
      } else {
        Alert.alert('❌ Deposit Failed', result.error || 'Unknown error occurred');
      }

    } catch (error: any) {
      console.error('❌ Privacy deposit failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('❌ Error', `Privacy deposit failed: ${error.message}`);
    }
  };

  const handleStealthPaymentScan = async () => {
    if (!services.privacyPoolService) {
      Alert.alert('Error', 'Privacy pool service not initialized');
      return;
    }

    setState(prev => ({ ...prev, loading: true, scanResults: null }));

    try {
      console.log('🚀 Starting stealth payment scan demo...');
      
      const results = await services.privacyPoolService.scanForStealthPayments(
        ethers.Wallet.createRandom().privateKey // Mock private key for demo
      );

      setState(prev => ({
        ...prev,
        scanResults: results.payments,
        loading: false,
      }));

      Alert.alert(
        '✅ Scan Complete', 
        `Found ${results.totalFound} stealth payments!\n\nCheck the results below.`
      );

    } catch (error: any) {
      console.error('❌ Stealth payment scan failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('❌ Error', `Stealth payment scan failed: ${error.message}`);
    }
  };

  const handleAllowlistCheck = async () => {
    if (!services.ensService || !state.ensName) {
      Alert.alert('Error', 'Please enter an ENS name and wait for services to load');
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const mockSenderAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const result = await services.ensService.checkSenderAllowlist(state.ensName, mockSenderAddress);

      setState(prev => ({ ...prev, loading: false }));

      Alert.alert(
        '🔒 Allowlist Check', 
        `Sender: ${mockSenderAddress.slice(0, 20)}...\n\nAllowed: ${result.allowed ? '✅ Yes' : '❌ No'}\nRequires Proof: ${result.requiresProof ? '✅ Yes' : '❌ No'}`
      );

    } catch (error: any) {
      console.error('❌ Allowlist check failed:', error);
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('❌ Error', `Allowlist check failed: ${error.message}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🎭 ENS Privacy Demo</Text>
        <Text style={styles.subtitle}>
          Ephemeral Subdomain + Stealth Address Generator
        </Text>
      </View>

      {/* Input Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Configuration</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>ENS Name:</Text>
          <TextInput
            style={styles.input}
            value={state.ensName}
            onChangeText={(text) => setState(prev => ({ ...prev, ensName: text }))}
            placeholder="vitalik.eth"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (ETH):</Text>
          <TextInput
            style={styles.input}
            value={state.amount}
            onChangeText={(text) => setState(prev => ({ ...prev, amount: text }))}
            placeholder="0.1"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎮 Demo Actions</Text>
        
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleENSStealthResolution}
          disabled={state.loading}
        >
          <Text style={styles.buttonText}>
            {state.loading ? '🔄 Processing...' : '🎭 Generate Stealth Address'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={handleAllowlistCheck}
          disabled={state.loading}
        >
          <Text style={styles.buttonText}>🔒 Check Allowlist</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]} 
          onPress={handlePrivacyPoolDeposit}
          disabled={state.loading}
        >
          <Text style={styles.buttonText}>💰 Privacy Pool Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.warningButton]} 
          onPress={handleStealthPaymentScan}
          disabled={state.loading}
        >
          <Text style={styles.buttonText}>🔍 Scan Stealth Payments</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {state.loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing ENS Privacy Operation...</Text>
        </View>
      )}

      {/* Stealth Result Display */}
      {state.stealthResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 Stealth Address Result</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Stealth Address:</Text>
            <Text style={styles.resultValue}>{state.stealthResult.stealthAddress}</Text>
            
            <Text style={styles.resultLabel}>Ephemeral Public Key:</Text>
            <Text style={styles.resultValue}>{state.stealthResult.ephemeralPublicKey.slice(0, 40)}...</Text>
            
            <Text style={styles.resultLabel}>Note Commitment:</Text>
            <Text style={styles.resultValue}>{state.stealthResult.noteCommitment.slice(0, 40)}...</Text>
          </View>
        </View>
      )}

      {/* Payment Metadata Display */}
      {state.paymentMetadata && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Payment Metadata</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Stealth Tag:</Text>
            <Text style={styles.resultValue}>{state.paymentMetadata.stealthTag}</Text>
            
            <Text style={styles.resultLabel}>Encrypted Amount:</Text>
            <Text style={styles.resultValue}>{state.paymentMetadata.encryptedAmount.slice(0, 40)}...</Text>
          </View>
        </View>
      )}

      {/* Scan Results Display */}
      {state.scanResults && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Stealth Payment Scan Results</Text>
          {state.scanResults.map((payment, index) => (
            <View key={index} style={styles.resultCard}>
              <Text style={styles.resultLabel}>Payment #{index + 1}:</Text>
              <Text style={styles.resultValue}>Address: {payment.stealthAddress.slice(0, 20)}...</Text>
              <Text style={styles.resultValue}>Amount: {payment.amount} ETH</Text>
              <Text style={styles.resultValue}>Tag: {payment.stealthTag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🚀 Advanced ENS Privacy Features for C.Y.P.H.E.R Hackathon Demo
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00D4FF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8A8A',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1E2A3A',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  button: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  warningButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#8A8A8A',
    fontSize: 14,
    marginTop: 10,
  },
  resultCard: {
    backgroundColor: '#1E2A3A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A3A4A',
  },
  resultLabel: {
    fontSize: 14,
    color: '#00D4FF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultValue: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
    paddingBottom: 50,
  },
  footerText: {
    fontSize: 12,
    color: '#8A8A8A',
    textAlign: 'center',
  },
});

export default ENSPrivacyDemoScreen;
