import React, { useState } from 'react';
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
 * Transaction Debugger Component
 * Helps debug transaction sending issues
 */
export const TransactionDebugger: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>('');
  const [lastTxHash, setLastTxHash] = useState<string>('');

  const refreshBalance = async () => {
    try {
      setIsLoading(true);
      const balanceResult = await privacyEnabledWallet.refreshBalance();
      setBalance(balanceResult.publicBalance);
    } catch (error) {
      Alert.alert('Error', `Failed to refresh balance: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestTransaction = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in recipient and amount');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Starting test transaction...');
      
      const result = await privacyEnabledWallet.sendTransaction({
        to: recipient,
        value: amount,
        usePrivacy: false, // Start with standard transactions
      });

      if (result.success) {
        setLastTxHash(result.transactionHash || '');
        Alert.alert(
          'Transaction Sent! ✅',
          `Transaction Hash: ${result.transactionHash}\n\nThis transaction will take a few minutes to confirm on the blockchain. Your balance will update automatically once confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setRecipient('');
                setAmount('');
                // Refresh balance after a few seconds
                setTimeout(refreshBalance, 3000);
              },
            },
          ]
        );
      } else {
        Alert.alert('Transaction Failed ❌', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', `Transaction failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestData = () => {
    setRecipient('0x742d35Cc6634C0532925a3b8D4f25dC3f0aC8881'); // Example address
    setAmount('0.001'); // Small test amount
  };

  React.useEffect(() => {
    refreshBalance();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Transaction Debugger</Text>
        <Text style={styles.subtitle}>Test and debug transaction sending</Text>
      </View>

      {/* Balance Section */}
      <View style={styles.section}>
        <View style={styles.balanceRow}>
          <Text style={styles.sectionTitle}>Current Balance</Text>
          <TouchableOpacity onPress={refreshBalance} disabled={isLoading}>
            <Text style={styles.refreshButton}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>
        {balance ? (
          <Text style={styles.balanceText}>{balance} ETH</Text>
        ) : (
          <Text style={styles.loadingText}>Loading balance...</Text>
        )}
      </View>

      {/* Transaction Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Test Transaction</Text>
        
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

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={fillTestData}
          >
            <Text style={styles.secondaryButtonText}>📝 Fill Test Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={sendTestTransaction}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>🚀 Send Transaction</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Transaction */}
      {lastTxHash && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Transaction</Text>
          <Text style={styles.txHashText}>{lastTxHash}</Text>
          <Text style={styles.txNote}>
            ⏳ Transaction sent! It may take 1-2 minutes to confirm on the blockchain.
            Your balance will update automatically once confirmed.
          </Text>
        </View>
      )}

      {/* Debug Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔍 Debug Info</Text>
        <Text style={styles.infoText}>
          • If transaction fails with "insufficient balance", refresh your balance first
        </Text>
        <Text style={styles.infoText}>
          • Transactions take 1-2 minutes to confirm on blockchain
        </Text>
        <Text style={styles.infoText}>
          • Balance updates automatically after confirmation
        </Text>
        <Text style={styles.infoText}>
          • Use small amounts (0.001 ETH) for testing
        </Text>
        <Text style={styles.infoText}>
          • Check console logs for detailed transaction info
        </Text>
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  refreshButton: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  balanceText: {
    ...typography.h3,
    color: colors.success,
    fontWeight: 'bold',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
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
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.body,
    fontWeight: '500',
  },
  txHashText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    backgroundColor: colors.gray200,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  txNote: {
    ...typography.caption,
    color: colors.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  infoSection: {
    backgroundColor: colors.gray200,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
});

export default TransactionDebugger;
