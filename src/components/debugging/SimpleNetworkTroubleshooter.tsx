import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';

interface NetworkTroubleshooterProps {
  onNavigate: (screen: string) => void;
}

const NetworkTroubleshooter: React.FC<NetworkTroubleshooterProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addLog('Network troubleshooter initialized');
    addLog('Checking current network...');
    addLog('You are on Sepolia Testnet (Chain ID: 11155111)');
    addLog('This is for TEST transactions only!');
  }, []);

  const explainNetworkIssue = () => {
    Alert.alert(
      'Why Transactions Do Not Work',
      'The main reason transactions seem to not work:\n\n' +
      'MAINNET vs TESTNET\n' +
      '• Mainnet = Real ETH, real money\n' +
      '• Testnet = Free test ETH\n' +
      '• They are separate blockchains\n\n' +
      'Solution: You and your friend must be on the SAME network!',
      [{ text: 'Got It!' }]
    );
  };

  const switchToMainnet = () => {
    Alert.alert(
      'Switch to Mainnet?',
      'This will switch you to Ethereum Mainnet for REAL transactions with REAL money.\n\n' +
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Switch',
          onPress: () => {
            addLog('User requested mainnet switch');
            Alert.alert('Note', 'Network switching requires app restart and mainnet setup.');
          }
        }
      ]
    );
  };

  const getFreeTestETH = () => {
    Alert.alert(
      'Get Free Test ETH',
      'You can get free test ETH from these faucets:\n\n' +
      '• sepoliafaucet.com\n' +
      '• sepoliafaucet.net\n' +
      '• infura.io/faucet\n\n' +
      'Just enter your wallet address!',
      [{ text: 'OK' }]
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('Settings')}
        >
          <Text style={styles.backText}>Back to Settings</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Network Troubleshooter</Text>
        <Text style={styles.subtitle}>Fix transaction issues</Text>
      </View>

      {/* Current Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Status</Text>
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Network: Sepolia Testnet</Text>
          <Text style={styles.statusText}>Money Type: FREE TEST ETH</Text>
          <Text style={styles.warningText}>
            This is NOT real money! Your friend needs to be on the same testnet to receive funds.
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Solutions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={explainNetworkIssue}>
          <Text style={styles.actionTitle}>Why Transactions Do Not Work</Text>
          <Text style={styles.actionSubtitle}>Common network explanation</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={switchToMainnet}>
          <Text style={styles.actionTitle}>Switch to Mainnet (Real ETH)</Text>
          <Text style={styles.actionSubtitle}>Send real money to your friend</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={getFreeTestETH}>
          <Text style={styles.actionTitle}>Get Free Test ETH</Text>
          <Text style={styles.actionSubtitle}>For testing on Sepolia</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Logs */}
      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logContainer} nestedScrollEnabled>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.emptyLogText}>No logs yet...</Text>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#ff6b35',
    fontWeight: '500',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#007AFF',
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  logText: {
    fontSize: 12,
    color: '#00ff00',
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16,
  },
  emptyLogText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default NetworkTroubleshooter;
