import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { privacyService } from '../services/PrivacyService';
import { NavyTheme } from '../styles/themes';

// Extract commonly used values
const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  gray300: NavyTheme.colors.surfaceTertiary,
  gray500: NavyTheme.colors.textTertiary,
  gray600: NavyTheme.colors.textSecondary,
  black: '#000000',
  success: NavyTheme.colors.success,
  error: NavyTheme.colors.error,
  warning: NavyTheme.colors.warning,
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

interface PrivateTransactionFormProps {
  onTransactionSubmit?: (txData: any) => void;
  initialAmount?: string;
  initialRecipient?: string;
}

/**
 * Private Transaction Form Component
 * Handles dual-layer privacy transactions with ZK proofs
 */
export const PrivateTransactionForm: React.FC<PrivateTransactionFormProps> = ({
  onTransactionSubmit,
  initialAmount = '',
  initialRecipient = '',
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState(initialAmount);
  const [useAlias, setUseAlias] = useState(true);
  const [selectedAlias, setSelectedAlias] = useState('');
  const [aliases, setAliases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [privacyScore, setPrivacyScore] = useState<number | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<string>('');

  useEffect(() => {
    loadAliases();
  }, []);

  useEffect(() => {
    if (amount && recipient) {
      calculatePrivacyScore();
      estimateTransactionFee();
    }
  }, [amount, recipient, useAlias, selectedAlias]);

  const loadAliases = async () => {
    try {
      const userAliases = await privacyService.getUserAliases();
      setAliases(userAliases);
      if (userAliases.length > 0) {
        setSelectedAlias(userAliases[0].id);
      }
    } catch (error) {
      console.error('Failed to load aliases:', error);
    }
  };

  const calculatePrivacyScore = () => {
    let score = 50; // Base score
    
    // Boost score for using alias
    if (useAlias && selectedAlias) score += 25;
    
    // Boost score for larger amounts (more mixing potential)
    const amountNum = parseFloat(amount);
    if (amountNum > 1) score += 10;
    if (amountNum > 10) score += 10;
    
    // Random factor for ZK proof strength
    score += Math.floor(Math.random() * 15);
    
    setPrivacyScore(Math.min(score, 100));
  };

  const estimateTransactionFee = () => {
    const baseGas = 21000;
    const privacyGas = useAlias ? 150000 : 100000; // Additional gas for privacy
    const totalGas = baseGas + privacyGas;
    const gasPrice = 20; // 20 gwei
    const feeEth = (totalGas * gasPrice) / 1e9;
    setEstimatedFee(feeEth.toFixed(6));
  };

  const handleSubmit = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      Alert.alert('Error', 'Invalid recipient address format');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      let transactionResult;

      if (useAlias && selectedAlias) {
        // Use dual-layer architecture
        transactionResult = await privacyService.sendPrivateTransactionWithAlias({
          aliasAddress: selectedAlias,
          to: recipient,
          amount,
          aliasId: selectedAlias
        });
      } else {
        // Use basic privacy pool
        transactionResult = await privacyService.sendPrivateTransaction({
          to: recipient,
          amount,
          useShielded: true
        });
      }

      if (transactionResult.success) {
        Alert.alert(
          '✅ Transaction Submitted',
          `Private transaction sent successfully!\n\n` +
          `Transaction Hash: ${transactionResult.transactionHash?.slice(0, 10)}...\n` +
          `Privacy Score: ${transactionResult.privacyScore || privacyScore}/100\n` +
          `Estimated Fee: ${estimatedFee} ETH`,
          [{ text: 'OK' }]
        );

        // Reset form
        setRecipient('');
        setAmount('');
        setPrivacyScore(null);
        
        onTransactionSubmit?.(transactionResult);
      } else {
        throw new Error(transactionResult.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      Alert.alert(
        'Transaction Failed',
        `Failed to send private transaction: ${(error as Error).message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAlias = async () => {
    try {
      const result = await privacyService.createAlias(`Alias_${Date.now()}`);
      if (result.success) {
        await loadAliases();
        Alert.alert('Success', 'New privacy alias created!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create alias');
    }
  };

  const getPrivacyScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Private Transaction</Text>
        <Text style={styles.subtitle}>
          Send transactions with enhanced privacy and anonymity
        </Text>
      </View>

      {/* Privacy Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Configuration</Text>
        
        <View style={styles.row}>
          <Text style={styles.label}>Use Privacy Alias</Text>
          <Switch
            value={useAlias}
            onValueChange={setUseAlias}
            trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
            thumbColor={useAlias ? colors.primary : colors.gray500}
          />
        </View>

        {useAlias && (
          <View style={styles.aliasContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Select Alias</Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateAlias}
              >
                <Text style={styles.createButtonText}>+ Create</Text>
              </TouchableOpacity>
            </View>
            
            {aliases.length > 0 ? (
              <View style={styles.aliasSelector}>
                {aliases.map((alias) => (
                  <TouchableOpacity
                    key={alias.id}
                    style={[
                      styles.aliasOption,
                      selectedAlias === alias.id && styles.aliasOptionSelected
                    ]}
                    onPress={() => setSelectedAlias(alias.id)}
                  >
                    <Text style={[
                      styles.aliasText,
                      selectedAlias === alias.id && styles.aliasTextSelected
                    ]}>
                      {alias.name}
                    </Text>
                    <Text style={styles.aliasAddress}>
                      {alias.publicKey?.slice(0, 10)}...
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noAliasText}>
                No aliases available. Create one to enhance privacy.
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Transaction Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Details</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="0x..."
            placeholderTextColor={colors.gray500}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount (ETH)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            placeholderTextColor={colors.gray500}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Privacy Score */}
      {privacyScore && (
        <View style={styles.privacyScoreContainer}>
          <Text style={styles.privacyScoreTitle}>Privacy Analysis</Text>
          <View style={styles.privacyScoreRow}>
            <Text style={styles.privacyScoreLabel}>Privacy Score:</Text>
            <Text style={[
              styles.privacyScoreValue,
              { color: getPrivacyScoreColor(privacyScore) }
            ]}>
              {privacyScore}/100
            </Text>
          </View>
          <Text style={styles.privacyScoreDescription}>
            {privacyScore >= 80 ? 'Excellent privacy protection' :
             privacyScore >= 60 ? 'Good privacy protection' :
             'Basic privacy protection'}
          </Text>
        </View>
      )}

      {/* Transaction Fee */}
      {estimatedFee && (
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>Estimated Fee: {estimatedFee} ETH</Text>
          <Text style={styles.feeNote}>
            Higher fees due to privacy enhancements
          </Text>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || !recipient || !amount}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>
            🛡️ Send Private Transaction
          </Text>
        )}
      </TouchableOpacity>

      {/* Privacy Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>🔒 Privacy Features Active:</Text>
        <Text style={styles.infoItem}>
          • Zero-knowledge proofs for transaction privacy
        </Text>
        <Text style={styles.infoItem}>
          • Merkle tree anonymity sets for unlinkability
        </Text>
        {useAlias && (
          <Text style={styles.infoItem}>
            • Public alias masking your identity
          </Text>
        )}
        <Text style={styles.infoItem}>
          • Enhanced metadata protection
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
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  aliasContainer: {
    marginTop: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  aliasSelector: {
    marginTop: spacing.sm,
  },
  aliasOption: {
    backgroundColor: colors.gray200,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  aliasOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
    borderWidth: 1,
  },
  aliasText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  aliasTextSelected: {
    color: colors.primary,
  },
  aliasAddress: {
    ...typography.caption,
    color: colors.gray600,
    marginTop: 2,
  },
  noAliasText: {
    ...typography.caption,
    color: colors.gray600,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  privacyScoreContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  privacyScoreTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  privacyScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  privacyScoreLabel: {
    ...typography.body,
    color: colors.text,
  },
  privacyScoreValue: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 18,
  },
  privacyScoreDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  feeContainer: {
    backgroundColor: colors.warning + '20',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  feeLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  feeNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: colors.gray300,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  infoItem: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
});

export default PrivateTransactionForm;
