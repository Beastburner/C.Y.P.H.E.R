import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { privacyEnabledWallet } from '../../services/PrivacyEnabledWallet';
import { walletService } from '../../services/WalletService';
import { NavyTheme } from '../../styles/themes';

const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  success: NavyTheme.colors.success,
  error: NavyTheme.colors.error,
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

const typography = {
  h3: { fontSize: 18 },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
};

/**
 * Advanced Transaction Debugger
 * Deep debugging of the entire transaction pipeline
 */
export const AdvancedTransactionDebugger: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugLog(prev => [...prev, logMessage]);
  };

  const runDiagnostics = async () => {
    setIsLoading(true);
    setDebugLog([]);
    
    try {
      addLog('🔍 Starting comprehensive diagnostics...');
      
      // 1. Check wallet service status
      addLog('1️⃣ Checking WalletService status...');
      const hasWallet = walletService.hasWallet();
      addLog(`✅ Has wallet: ${hasWallet}`);
      
      const isLocked = walletService.isWalletLocked();
      addLog(`🔒 Wallet locked: ${isLocked}`);
      
      // 2. Get current wallet
      const currentWallet = walletService.getCurrentWallet();
      if (currentWallet) {
        addLog(`📄 Current wallet: ${currentWallet.name} (${currentWallet.id})`);
        addLog(`📊 Accounts count: ${currentWallet.accounts.length}`);
        setWalletInfo(currentWallet);
      } else {
        addLog('❌ No current wallet found');
        Alert.alert('Error', 'No wallet found. Please create or import a wallet first.');
        setIsLoading(false);
        return;
      }
      
      // 3. Check accounts
      addLog('2️⃣ Checking accounts...');
      const allAccounts = await walletService.getAllAccounts();
      setAccounts(allAccounts);
      
      if (allAccounts.length === 0) {
        addLog('❌ No accounts found in wallet');
        Alert.alert('Error', 'No accounts found. Please create an account first.');
        setIsLoading(false);
        return;
      }
      
      const firstAccount = allAccounts[0];
      addLog(`👤 First account: ${firstAccount.address}`);
      addLog(`🔑 Has private key: ${!!firstAccount.privateKey}`);
      addLog(`💰 Stored balance: ${firstAccount.balance} ETH`);
      
      // 4. Test network connectivity
      addLog('3️⃣ Testing network connectivity...');
      try {
        const balance = await walletService.getEthereumBalance(firstAccount.address);
        addLog(`✅ Network connection OK`);
        addLog(`💰 Live balance: ${balance.balance} ETH`);
        addLog(`💵 USD value: $${balance.usdValue.toFixed(2)}`);
      } catch (networkError) {
        addLog(`❌ Network error: ${networkError}`);
      }
      
      // 5. Check privacy wallet integration
      addLog('4️⃣ Checking PrivacyEnabledWallet...');
      try {
        const privacyBalance = await privacyEnabledWallet.getBalance();
        addLog(`✅ Privacy wallet integration OK`);
        addLog(`💰 Privacy balance: ${privacyBalance.publicBalance} ETH`);
      } catch (privacyError) {
        addLog(`❌ Privacy wallet error: ${privacyError}`);
      }
      
      // 6. Test transaction estimation
      if (recipient && amount) {
        addLog('5️⃣ Testing transaction estimation...');
        try {
          const gasEstimate = await walletService.estimateTransactionFee({
            from: firstAccount.address,
            to: recipient,
            value: amount,
          });
          addLog(`✅ Gas estimation successful`);
          addLog(`⛽ Gas limit: ${gasEstimate.gasLimit}`);
          addLog(`💸 Standard fee: ${gasEstimate.gasPrices.standard.totalFee} ETH`);
        } catch (gasError) {
          addLog(`❌ Gas estimation error: ${gasError}`);
        }
      }
      
      addLog('🎉 Diagnostics complete!');
      
    } catch (error) {
      addLog(`💥 Fatal error during diagnostics: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectTransaction = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in recipient and amount');
      return;
    }

    setIsLoading(true);
    addLog('🚀 Testing DIRECT WalletService transaction...');
    
    try {
      const accounts = await walletService.getAllAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }
      
      const fromAccount = accounts[0];
      addLog(`📤 Sending from: ${fromAccount.address}`);
      addLog(`📥 Sending to: ${recipient}`);
      addLog(`💰 Amount: ${amount} ETH`);
      
      const result = await walletService.transferEthereum({
        fromAddress: fromAccount.address,
        toAddress: recipient,
        amount: amount,
      });
      
      if (result.transactionHash) {
        addLog(`✅ Direct transaction SUCCESS!`);
        addLog(`📝 Transaction hash: ${result.transactionHash}`);
        addLog(`⏳ Status: ${result.status}`);
        Alert.alert(
          'Transaction Sent! ✅',
          `Direct WalletService transaction successful!\n\nHash: ${result.transactionHash}\n\nCheck your balance in 1-2 minutes.`
        );
      } else {
        addLog(`❌ Direct transaction failed - no hash returned`);
      }
    } catch (error) {
      addLog(`❌ Direct transaction error: ${error}`);
      Alert.alert('Direct Transaction Failed', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrivacyTransaction = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in recipient and amount');
      return;
    }

    setIsLoading(true);
    addLog('🔒 Testing PrivacyEnabledWallet transaction...');
    
    try {
      const result = await privacyEnabledWallet.sendTransaction({
        to: recipient,
        value: amount,
        usePrivacy: false, // Test standard transaction first
      });
      
      if (result.success) {
        addLog(`✅ Privacy wallet transaction SUCCESS!`);
        addLog(`📝 Transaction hash: ${result.transactionHash}`);
        Alert.alert(
          'Privacy Transaction Sent! ✅',
          `PrivacyEnabledWallet transaction successful!\n\nHash: ${result.transactionHash}`
        );
      } else {
        addLog(`❌ Privacy transaction failed: ${result.error}`);
        Alert.alert('Privacy Transaction Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      addLog(`❌ Privacy transaction error: ${error}`);
      Alert.alert('Privacy Transaction Error', `Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setDebugLog([]);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Advanced Transaction Debugger</Text>
        <Text style={styles.subtitle}>Deep diagnosis of transaction issues</Text>
      </View>

      {/* Quick Info */}
      {walletInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Info</Text>
          <Text style={styles.infoText}>Name: {walletInfo.name}</Text>
          <Text style={styles.infoText}>Accounts: {accounts.length}</Text>
          {accounts.length > 0 && (
            <>
              <Text style={styles.infoText}>Address: {accounts[0].address}</Text>
              <Text style={styles.infoText}>Balance: {accounts[0].balance} ETH</Text>
            </>
          )}
        </View>
      )}

      {/* Transaction Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Transaction</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="0x..."
            autoCapitalize="none"
            multiline
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount (ETH)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.001"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={testDirectTransaction}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔗 Test Direct</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={testPrivacyTransaction}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔒 Test Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.section}>
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={[styles.button, styles.diagnosticButton]}
            onPress={runDiagnostics}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>🔍 Run Diagnostics</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearLogs}
          >
            <Text style={styles.buttonText}>🗑️ Clear Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Logs ({debugLog.length})</Text>
        <ScrollView style={styles.logContainer} nestedScrollEnabled>
          {debugLog.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
          {debugLog.length === 0 && (
            <Text style={styles.emptyLogText}>No logs yet. Run diagnostics to start.</Text>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray200,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontFamily: 'monospace',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.success,
  },
  diagnosticButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#757575',
  },
  buttonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: spacing.sm,
    maxHeight: 300,
  },
  logText: {
    ...typography.caption,
    color: '#00ff00',
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
    lineHeight: 16,
  },
  emptyLogText: {
    ...typography.caption,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
});

export default AdvancedTransactionDebugger;
