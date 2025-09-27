import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { privacyService } from '../services/PrivacyService';
import { privacyEnabledWallet } from '../services/PrivacyEnabledWallet';
import PrivacyToggle from './PrivacyToggle';
import PrivateTransactionForm from './PrivateTransactionForm';
import { NavyTheme } from '../styles/themes';

// Theme setup
const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  gray300: NavyTheme.colors.surfaceTertiary,
  gray500: NavyTheme.colors.textTertiary,
  gray600: NavyTheme.colors.textSecondary,
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
  h2: { fontSize: 24 },
  h3: { fontSize: 18 },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
};

interface PrivacyDashboardProps {
  onNavigateToTransaction?: () => void;
}

interface PrivacyStats {
  isPrivacyEnabled: boolean;
  privacyScore: number | null;
  dualLayerMode: boolean;
  aliasCount: number;
  privateBalance: string;
  publicBalance: string;
  totalTransactions: number;
  privateTransactions: number;
}

/**
 * Privacy Dashboard Component
 * Main interface for privacy features and dual-layer architecture
 */
export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({
  onNavigateToTransaction,
}) => {
  const [stats, setStats] = useState<PrivacyStats>({
    isPrivacyEnabled: false,
    privacyScore: null,
    dualLayerMode: false,
    aliasCount: 0,
    privateBalance: '0',
    publicBalance: '0',
    totalTransactions: 0,
    privateTransactions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  useEffect(() => {
    loadPrivacyStats();
  }, []);

  const loadPrivacyStats = async () => {
    try {
      setIsLoading(true);

      // Initialize privacy wallet
      await privacyEnabledWallet.initialize();

      // Get privacy state
      const privacyState = await privacyService.getPrivacyState();
      
      // Get wallet balances
      const balance = await privacyEnabledWallet.getBalance(true);
      
      // Get user aliases
      const aliases = await privacyService.getUserAliases();
      
      // Get privacy status
      const privacyStatus = privacyEnabledWallet.getPrivacyStatus();

      // Get transaction history
      const transactions = await privacyEnabledWallet.getTransactionHistory({
        includePrivate: true,
        limit: 100,
      });

      const privateTransactions = transactions.filter(tx => tx.isPrivate || tx.aliasId);

      setStats({
        isPrivacyEnabled: privacyState.isPrivacyEnabled,
        privacyScore: privacyState.privacyScore,
        dualLayerMode: privacyStatus.dualLayerMode,
        aliasCount: aliases.length,
        privateBalance: balance.privateBalance || '0',
        publicBalance: balance.publicBalance,
        totalTransactions: transactions.length,
        privateTransactions: privateTransactions.length,
      });
    } catch (error) {
      console.error('Failed to load privacy stats:', error);
      Alert.alert('Error', 'Failed to load privacy statistics');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPrivacyStats();
  };

  const handlePrivacyToggle = (enabled: boolean) => {
    // Refresh stats when privacy mode is toggled
    loadPrivacyStats();
  };

  const handleTransactionSubmit = (txData: any) => {
    // Refresh stats after transaction
    loadPrivacyStats();
    setShowTransactionForm(false);
    
    Alert.alert(
      'Transaction Submitted',
      'Your private transaction has been submitted successfully!',
      [{ text: 'OK' }]
    );
  };

  const handleCreateAlias = async () => {
    try {
      const result = await privacyEnabledWallet.createAlias();
      if (result.success) {
        await loadPrivacyStats();
        Alert.alert('Success', 'New privacy alias created successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to create alias');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create privacy alias');
    }
  };

  const getPrivacyScoreColor = (score: number | null) => {
    if (!score) return colors.gray500;
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getPrivacyScoreDescription = (score: number | null) => {
    if (!score) return 'No privacy protection';
    if (score >= 80) return 'Excellent privacy protection';
    if (score >= 60) return 'Good privacy protection';
    return 'Basic privacy protection';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Privacy Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Privacy Dashboard</Text>
        <Text style={styles.subtitle}>
          Dual-Layer Privacy Architecture for Enhanced Anonymity
        </Text>
      </View>

      {/* Privacy Toggle */}
      <PrivacyToggle onToggle={handlePrivacyToggle} />

      {/* Privacy Score Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Privacy Score</Text>
          <Text style={[
            styles.scoreValue,
            { color: getPrivacyScoreColor(stats.privacyScore) }
          ]}>
            {stats.privacyScore || 0}/100
          </Text>
        </View>
        <Text style={styles.scoreDescription}>
          {getPrivacyScoreDescription(stats.privacyScore)}
        </Text>
        
        {stats.isPrivacyEnabled && (
          <View style={styles.scoreDetails}>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailLabel}>Mode:</Text>
              <Text style={styles.scoreDetailValue}>
                {stats.dualLayerMode ? 'Dual-Layer' : 'Basic Privacy'}
              </Text>
            </View>
            <View style={styles.scoreDetail}>
              <Text style={styles.scoreDetailLabel}>Aliases:</Text>
              <Text style={styles.scoreDetailValue}>{stats.aliasCount}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Balance Overview */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceTitle}>💰 Balance Overview</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Public Balance</Text>
            <Text style={styles.balanceValue}>{stats.publicBalance} ETH</Text>
          </View>
          {stats.isPrivacyEnabled && (
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Private Balance</Text>
              <Text style={styles.balanceValue}>{stats.privateBalance} ETH</Text>
            </View>
          )}
        </View>
      </View>

      {/* Transaction Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>📊 Transaction Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Total Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats.privateTransactions}
            </Text>
            <Text style={styles.statLabel}>Private Transactions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {stats.totalTransactions > 0 
                ? Math.round((stats.privateTransactions / stats.totalTransactions) * 100)
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Privacy Ratio</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>🚀 Privacy Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => setShowTransactionForm(!showTransactionForm)}
        >
          <Text style={styles.actionButtonText}>
            🛡️ Send Private Transaction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleCreateAlias}
        >
          <Text style={styles.secondaryButtonText}>
            🎭 Create Privacy Alias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onNavigateToTransaction}
        >
          <Text style={styles.secondaryButtonText}>
            📜 View Transaction History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Form */}
      {showTransactionForm && (
        <View style={styles.transactionFormContainer}>
          <PrivateTransactionForm
            onTransactionSubmit={handleTransactionSubmit}
          />
          <TouchableOpacity
            style={styles.closeFormButton}
            onPress={() => setShowTransactionForm(false)}
          >
            <Text style={styles.closeFormText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Privacy Features Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔒 Active Privacy Features</Text>
        
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>
            ✓ Zero-knowledge proof transactions
          </Text>
          <Text style={styles.featureItem}>
            ✓ Merkle tree anonymity sets
          </Text>
          <Text style={styles.featureItem}>
            ✓ Encrypted transaction metadata
          </Text>
          {stats.dualLayerMode && (
            <>
              <Text style={styles.featureItem}>
                ✓ Public alias masking
              </Text>
              <Text style={styles.featureItem}>
                ✓ Private shielded vault
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Privacy-first blockchain interactions powered by ZK-SNARKs
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray200,
  },
  loadingText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
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
  scoreCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  scoreTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  scoreValue: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  scoreDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  scoreDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  scoreDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  scoreDetailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreDetailValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
  balanceCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  balanceTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionsTitle: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  actionButton: {
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.gray300,
  },
  actionButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: '500',
  },
  secondaryButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  transactionFormContainer: {
    marginBottom: spacing.md,
  },
  closeFormButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeFormText: {
    color: colors.white,
    ...typography.caption,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: colors.gray300,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  featureList: {
    paddingLeft: spacing.sm,
  },
  featureItem: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default PrivacyDashboard;
