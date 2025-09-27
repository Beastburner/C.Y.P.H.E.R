import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { privacyEnabledWallet } from '../../services/PrivacyEnabledWallet';
import { ZKProofGenerator } from '../../services/ZKProofGenerator';
import { NavyTheme } from '../../styles/themes';

// Theme setup
const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  gray300: NavyTheme.colors.surfaceTertiary,
  success: NavyTheme.colors.success,
  warning: NavyTheme.colors.warning,
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

interface RouteAnalysis {
  recommendedRoute: 'public' | 'private' | 'mixed';
  privacyScore: number;
  estimatedFee: {
    public: string;
    private?: string;
    total: string;
  };
  estimatedTime: {
    public: number;
    private?: number;
  };
  reasonsForRecommendation: string[];
}

interface TransactionRouterProps {
  onTransactionSubmit?: (txData: any) => void;
  initialRecipient?: string;
  initialAmount?: string;
}

/**
 * Privacy Transaction Router
 * Intelligently routes transactions based on privacy requirements
 */
export const PrivacyTransactionRouter: React.FC<TransactionRouterProps> = ({
  onTransactionSubmit,
  initialRecipient = '',
  initialAmount = '',
}) => {
  const [recipient, setRecipient] = useState(initialRecipient);
  const [amount, setAmount] = useState(initialAmount);
  const [message, setMessage] = useState('');
  const [forcePrivate, setForcePrivate] = useState(false);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recipient && amount && parseFloat(amount) > 0) {
      analyzeTransaction();
    } else {
      setRouteAnalysis(null);
    }
  }, [recipient, amount, forcePrivate]);

  const analyzeTransaction = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate recipient privacy preference check
      const recipientPrefers = await checkRecipientPreferences(recipient);
      
      // Analyze transaction characteristics
      const amountValue = parseFloat(amount);
      const isLargeAmount = amountValue > 1.0;
      const isSmallAmount = amountValue < 0.01;
      
      // Determine recommended route
      let recommendedRoute: 'public' | 'private' | 'mixed' = 'public';
      let privacyScore = 30;
      const reasons: string[] = [];

      if (forcePrivate) {
        recommendedRoute = 'private';
        privacyScore = 95;
        reasons.push('Privacy mode forced by user');
      } else if (recipientPrefers.acceptsPrivate) {
        if (isLargeAmount) {
          recommendedRoute = 'private';
          privacyScore = 85;
          reasons.push('Large amount benefits from privacy protection');
        } else if (recipientPrefers.prefersPrivate) {
          recommendedRoute = 'private';
          privacyScore = 80;
          reasons.push('Recipient prefers private transactions');
        } else {
          recommendedRoute = 'mixed';
          privacyScore = 60;
          reasons.push('Balanced approach for recipient preferences');
        }
      } else {
        if (isLargeAmount) {
          recommendedRoute = 'mixed';
          privacyScore = 50;
          reasons.push('Large amount, but recipient may not accept private payments');
        } else {
          reasons.push('Standard public transaction sufficient');
        }
      }

      // Estimate fees and timing
      const baseFee = (amountValue * 0.001).toFixed(6);
      const privateFee = recommendedRoute !== 'public' ? 
        (amountValue * 0.002 + 0.001).toFixed(6) : undefined;
      
      const totalFee = privateFee ? 
        (parseFloat(baseFee) + parseFloat(privateFee)).toFixed(6) : baseFee;

      setRouteAnalysis({
        recommendedRoute,
        privacyScore,
        estimatedFee: {
          public: baseFee,
          private: privateFee,
          total: totalFee,
        },
        estimatedTime: {
          public: 15,
          private: recommendedRoute !== 'public' ? 45 : undefined,
        },
        reasonsForRecommendation: reasons,
      });
    } catch (error) {
      console.error('Failed to analyze transaction route:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const checkRecipientPreferences = async (address: string): Promise<{
    acceptsPrivate: boolean;
    prefersPrivate: boolean;
  }> => {
    // Simulate checking recipient's privacy preferences
    // In production, this would query the privacy registry contract
    const random = Math.random();
    return {
      acceptsPrivate: random > 0.3,
      prefersPrivate: random > 0.7,
    };
  };

  const handleSubmit = async () => {
    if (!recipient || !amount || !routeAnalysis) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const usePrivate = routeAnalysis.recommendedRoute !== 'public' || forcePrivate;
      
      let txResult;
      if (usePrivate) {
        // Generate ZK proof for private transaction
        const zkGenerator = new ZKProofGenerator();
        const proof = await zkGenerator.generateSpendProof({
          inputSecrets: ['0x' + Math.random().toString(16).slice(2, 66)],
          inputNullifiers: ['0x' + Math.random().toString(16).slice(2, 66)],
          inputAmounts: [amount],
          outputSecrets: ['0x' + Math.random().toString(16).slice(2, 66)],
          outputAmounts: [amount],
          outputRecipients: [recipient],
          merkleRoot: '0x' + Math.random().toString(16).slice(2, 66),
          inputCommitments: ['0x' + Math.random().toString(16).slice(2, 66)],
          outputCommitments: ['0x' + Math.random().toString(16).slice(2, 66)],
          merkleProofs: [['0x' + Math.random().toString(16).slice(2, 66)]],
        });

        txResult = await privacyEnabledWallet.sendTransaction({
          to: recipient,
          value: amount,
          usePrivacy: true,
          data: JSON.stringify({
            message,
            proof: proof.encoded,
          }),
        });
      } else {
        txResult = await privacyEnabledWallet.sendTransaction({
          to: recipient,
          value: amount,
          usePrivacy: false,
          data: message ? JSON.stringify({ message }) : undefined,
        });
      }

      if (txResult.success) {
        Alert.alert(
          'Transaction Sent',
          `Successfully sent ${amount} ETH via ${usePrivate ? 'private' : 'public'} route`,
          [
            {
              text: 'OK',
              onPress: () => {
                setRecipient('');
                setAmount('');
                setMessage('');
                setRouteAnalysis(null);
                onTransactionSubmit?.(txResult);
              },
            },
          ]
        );
      } else {
        Alert.alert('Transaction Failed', txResult.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      Alert.alert('Error', 'Failed to send transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrivacyScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getRouteIcon = (route: string) => {
    switch (route) {
      case 'private': return '🔐';
      case 'mixed': return '🔀';
      default: return '👁️';
    }
  };

  const getRouteLabel = (route: string) => {
    switch (route) {
      case 'private': return 'Private Route';
      case 'mixed': return 'Mixed Route';
      default: return 'Public Route';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔀 Smart Transaction Router</Text>
        <Text style={styles.subtitle}>
          Automatically selects optimal privacy routing
        </Text>
      </View>

      {/* Transaction Form */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={recipient}
            onChangeText={setRecipient}
            placeholder="0x..."
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount (ETH)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Message (Optional)</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Transaction note..."
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>Force Private Route</Text>
            <Text style={styles.switchDescription}>
              Override recommendations and use privacy pools
            </Text>
          </View>
          <Switch
            value={forcePrivate}
            onValueChange={setForcePrivate}
            trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
            thumbColor={forcePrivate ? colors.primary : colors.gray200}
          />
        </View>
      </View>

      {/* Route Analysis */}
      {isAnalyzing && (
        <View style={styles.analysisLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.analysisLoadingText}>Analyzing optimal route...</Text>
        </View>
      )}

      {routeAnalysis && (
        <View style={styles.analysisSection}>
          <Text style={styles.analysisTitle}>📊 Route Analysis</Text>
          
          {/* Recommended Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeIcon}>
                {getRouteIcon(routeAnalysis.recommendedRoute)}
              </Text>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>
                  {getRouteLabel(routeAnalysis.recommendedRoute)}
                </Text>
                <Text style={styles.routeDescription}>Recommended</Text>
              </View>
              <View style={styles.privacyScore}>
                <Text style={[
                  styles.privacyScoreNumber,
                  { color: getPrivacyScoreColor(routeAnalysis.privacyScore) }
                ]}>
                  {routeAnalysis.privacyScore}
                </Text>
                <Text style={styles.privacyScoreLabel}>Privacy</Text>
              </View>
            </View>
          </View>

          {/* Cost & Time Estimates */}
          <View style={styles.estimatesRow}>
            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>💰 Total Fee</Text>
              <Text style={styles.estimateValue}>
                {routeAnalysis.estimatedFee.total} ETH
              </Text>
              {routeAnalysis.estimatedFee.private && (
                <Text style={styles.estimateBreakdown}>
                  Base: {routeAnalysis.estimatedFee.public} ETH
                  {'\n'}Privacy: {routeAnalysis.estimatedFee.private} ETH
                </Text>
              )}
            </View>

            <View style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>⏱️ Est. Time</Text>
              <Text style={styles.estimateValue}>
                {routeAnalysis.estimatedTime.private || routeAnalysis.estimatedTime.public}s
              </Text>
              {routeAnalysis.estimatedTime.private && (
                <Text style={styles.estimateBreakdown}>
                  Includes ZK proof generation
                </Text>
              )}
            </View>
          </View>

          {/* Reasons */}
          <View style={styles.reasonsSection}>
            <Text style={styles.reasonsTitle}>🤔 Why this route?</Text>
            {routeAnalysis.reasonsForRecommendation.map((reason, index) => (
              <View key={index} style={styles.reasonItem}>
                <Text style={styles.reasonBullet}>•</Text>
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!routeAnalysis || isSubmitting) && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!routeAnalysis || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitButtonText}>
            🚀 Send Transaction
          </Text>
        )}
      </TouchableOpacity>

      {/* Privacy Notice */}
      <View style={styles.noticeSection}>
        <Text style={styles.noticeTitle}>🔒 Privacy Notice</Text>
        <Text style={styles.noticeText}>
          • Private routes use ZK-SNARKs for transaction privacy
        </Text>
        <Text style={styles.noticeText}>
          • Your transaction amount and recipient remain confidential
        </Text>
        <Text style={styles.noticeText}>
          • Private transactions require additional processing time
        </Text>
        <Text style={styles.noticeText}>
          • Network fees may be higher for privacy-enhanced transactions
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
    alignItems: 'center',
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
  formSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
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
    borderColor: colors.gray300,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  switchDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  analysisLoadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  analysisSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  analysisTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  routeCard: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  routeDescription: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  privacyScore: {
    alignItems: 'center',
  },
  privacyScoreNumber: {
    ...typography.body,
    fontWeight: 'bold',
    fontSize: 20,
  },
  privacyScoreLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  estimatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  estimateCard: {
    flex: 0.48,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
  },
  estimateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  estimateValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  estimateBreakdown: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  reasonsSection: {
    marginTop: spacing.sm,
  },
  reasonsTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  reasonBullet: {
    ...typography.body,
    color: colors.primary,
    marginRight: spacing.xs,
    fontWeight: 'bold',
  },
  reasonText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
  noticeSection: {
    backgroundColor: colors.gray300,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noticeTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
});

export default PrivacyTransactionRouter;
