import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import SecurityManager from '../../utils/securityManager';
import { setSecureValue, getSecureValue, removeSecureValue } from '../../utils/storageHelpers';

const BiometricDebugScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testPassword] = useState('test123456');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    addLog('Biometric Debug Screen Loaded');
  }, []);

  const checkStoredBiometricData = async () => {
    try {
      addLog('🔍 Checking stored biometric data...');
      
      const biometricEnabled = await getSecureValue('biometric_enabled');
      addLog(`Biometric enabled: ${biometricEnabled}`);
      
      const biometricPassword = await getSecureValue('biometric_password');
      addLog(`Biometric password exists: ${!!biometricPassword}`);
      if (biometricPassword) {
        addLog(`Password length: ${biometricPassword.length}`);
      }
      
      const walletPasswordHash = await getSecureValue('wallet_password_hash');
      addLog(`Wallet password hash exists: ${!!walletPasswordHash}`);
      
      const walletPasswordSalt = await getSecureValue('wallet_password_salt');
      addLog(`Wallet password salt exists: ${!!walletPasswordSalt}`);
      
    } catch (error) {
      addLog(`❌ Error checking data: ${error}`);
    }
  };

  const testPasswordVerification = async () => {
    try {
      addLog('🔐 Testing password verification...');
      
      const securityManager = SecurityManager.getInstance();
      
      // Test with stored biometric password
      const biometricPassword = await getSecureValue('biometric_password');
      if (biometricPassword) {
        const isValidBiometric = await securityManager.verifyPassword(biometricPassword);
        addLog(`Biometric password valid: ${isValidBiometric}`);
      } else {
        addLog('❌ No biometric password stored');
      }
      
      // Test with test password
      const isValidTest = await securityManager.verifyPassword(testPassword);
      addLog(`Test password valid: ${isValidTest}`);
      
    } catch (error) {
      addLog(`❌ Password verification error: ${error}`);
    }
  };

  const resetBiometricSetup = async () => {
    try {
      addLog('🔄 Resetting biometric setup...');
      
      const securityManager = SecurityManager.getInstance();
      
      // Disable biometric
      await securityManager.disableBiometric();
      addLog('✅ Biometric disabled');
      
      // Clear stored biometric password
      await removeSecureValue('biometric_password');
      addLog('✅ Biometric password cleared');
      
      // Set a new password
      await securityManager.setPassword(testPassword);
      addLog('✅ New password set');
      
      // Re-enable biometric with the password
      const enableResult = await securityManager.enableBiometric(testPassword);
      addLog(`✅ Biometric re-enabled: ${enableResult}`);
      
      // Verify the setup
      const biometricPassword = await getSecureValue('biometric_password');
      addLog(`New biometric password stored: ${!!biometricPassword}`);
      
      if (biometricPassword) {
        const isValid = await securityManager.verifyPassword(biometricPassword);
        addLog(`New biometric password valid: ${isValid}`);
      }
      
    } catch (error) {
      addLog(`❌ Reset error: ${error}`);
    }
  };

  const testBiometricAuth = async () => {
    try {
      addLog('👆 Testing biometric authentication...');
      
      const securityManager = SecurityManager.getInstance();
      
      const authResult = await securityManager.authenticateWithBiometrics({
        promptMessage: 'Test biometric authentication',
      });
      
      addLog(`Biometric auth result: ${authResult}`);
      
      if (authResult) {
        // Try to get the stored password and verify it
        const storedPassword = await getSecureValue('biometric_password');
        if (storedPassword) {
          const isValid = await securityManager.verifyPassword(storedPassword);
          addLog(`Stored password after auth is valid: ${isValid}`);
        }
      }
      
    } catch (error) {
      addLog(`❌ Biometric auth error: ${error}`);
    }
  };

  const clearAllSecurityData = async () => {
    Alert.alert(
      'Clear All Security Data',
      'This will clear all security data including passwords and biometric setup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              addLog('🗑️ Clearing all security data...');
              
              await removeSecureValue('biometric_enabled');
              await removeSecureValue('biometric_password');
              await removeSecureValue('wallet_password_hash');
              await removeSecureValue('wallet_password_salt');
              await removeSecureValue('wallet_locked');
              
              const securityManager = SecurityManager.getInstance();
              await securityManager.deleteBiometricKeys();
              
              addLog('✅ All security data cleared');
              
            } catch (error) {
              addLog(`❌ Clear error: ${error}`);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Biometric Debug</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={checkStoredBiometricData}>
          <Text style={styles.buttonText}>Check Stored Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testPasswordVerification}>
          <Text style={styles.buttonText}>Test Password Verification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testBiometricAuth}>
          <Text style={styles.buttonText}>Test Biometric Auth</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={resetBiometricSetup}>
          <Text style={styles.buttonText}>Reset Biometric Setup</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllSecurityData}>
          <Text style={styles.buttonText}>Clear All Security Data</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Debug Logs:</Text>
        <ScrollView style={styles.logScroll}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
        </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  warningButton: {
    backgroundColor: '#ff9800',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});

export default BiometricDebugScreen;
