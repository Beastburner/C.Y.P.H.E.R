import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import SecurityManager from '../../utils/securityManager';

interface BiometricTestResult {
  isAvailable: boolean;
  biometryType: string | null;
  error?: string;
}

const BiometricTestScreen: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const securityManager = SecurityManager.getInstance();

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`
    ]);
  };

  const checkBiometricCapabilities = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Checking biometric capabilities...');
      
      const capabilities = await securityManager.checkBiometricCapabilities();
      setBiometricCapabilities(capabilities);
      
      if (capabilities.isAvailable) {
        addTestResult(`✅ Biometric available: ${capabilities.biometryType}`);
      } else {
        addTestResult(`❌ Biometric not available: ${capabilities.error || 'Unknown reason'}`);
      }
    } catch (error) {
      addTestResult(`❌ Error checking capabilities: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBiometricAuthentication = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔐 Testing biometric authentication...');
      
      const result = await securityManager.authenticateWithBiometrics({
        promptMessage: 'Test biometric authentication',
        fallbackPrompt: 'Use password',
      });
      
      if (result) {
        addTestResult('✅ Biometric authentication successful!');
        Alert.alert('Success', 'Biometric authentication worked!');
      } else {
        addTestResult('❌ Biometric authentication failed');
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      addTestResult(`❌ Authentication error: ${error}`);
      Alert.alert('Error', `Authentication error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createBiometricKeys = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔑 Creating biometric keys...');
      
      const result = await securityManager.createBiometricKeys();
      
      if (result) {
        addTestResult('✅ Biometric keys created successfully');
        addTestResult(`Public key: ${result.publicKey.substring(0, 50)}...`);
      } else {
        addTestResult('❌ Failed to create biometric keys');
      }
    } catch (error) {
      addTestResult(`❌ Key creation error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testBiometricEnable = async () => {
    try {
      setIsLoading(true);
      addTestResult('⚙️ Testing biometric enable/disable...');
      
      const enableResult = await securityManager.enableBiometric('test123');
      addTestResult(`Enable result: ${enableResult ? '✅ Success' : '❌ Failed'}`);
      
      const isEnabled = await securityManager.isBiometricEnabled();
      addTestResult(`Is enabled: ${isEnabled ? '✅ Yes' : '❌ No'}`);
      
      if (enableResult) {
        const disableResult = await securityManager.disableBiometric();
        addTestResult(`Disable result: ${disableResult ? '✅ Success' : '❌ Failed'}`);
      }
    } catch (error) {
      addTestResult(`❌ Enable/disable error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Biometric Test Screen</Text>
        <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
      </View>

      <View style={styles.capabilitiesSection}>
        <Text style={styles.sectionTitle}>Capabilities</Text>
        {biometricCapabilities && (
          <View style={styles.capabilityItem}>
            <Text style={styles.capabilityText}>
              Available: {biometricCapabilities.isAvailable ? '✅ Yes' : '❌ No'}
            </Text>
            <Text style={styles.capabilityText}>
              Type: {biometricCapabilities.biometryType || 'None'}
            </Text>
            {biometricCapabilities.error && (
              <Text style={styles.errorText}>
                Error: {biometricCapabilities.error}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={checkBiometricCapabilities}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Check Capabilities</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={createBiometricKeys}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Create Keys</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testBiometricAuthentication}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Authentication</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testBiometricEnable}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Enable/Disable</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        <View style={styles.resultsContainer}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
          {testResults.length === 0 && (
            <Text style={styles.noResultsText}>
              No test results yet. Run some tests above.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 4,
  },
  capabilitiesSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  capabilityItem: {
    marginTop: 8,
  },
  capabilityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    marginBottom: 4,
  },
  buttonsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  clearButton: {
    backgroundColor: '#ff9800',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsSection: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
  },
  resultsContainer: {
    flex: 1,
  },
  resultText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
});

export default BiometricTestScreen;
