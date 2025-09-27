import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { privacyEnabledWallet } from '../../services/PrivacyEnabledWallet';
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
  h2: { fontSize: 20 },
  h3: { fontSize: 18 },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
};

const { width } = Dimensions.get('window');

interface PrivacyAnalytics {
  totalShieldedAmount: string;
  totalPrivateTransactions: number;
  averagePrivacyLatency: number;
  privacyScoreBreakdown: {
    anonymitySet: number;
    transactionMixing: number;
    temporalPrivacy: number;
    networkPrivacy: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
}) => (
  <View style={[styles.metricCard, { borderTopColor: color }]}>
    <View style={styles.metricHeader}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
  </View>
);

interface ScoreBarProps {
  label: string;
  score: number;
  color?: string;
}

const ScoreBar: React.FC<ScoreBarProps> = ({
  label,
  score,
  color = colors.primary,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const barColor = getScoreColor(score);

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color: barColor }]}>
          {score}/100
        </Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            {
              width: `${score}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

/**
 * Privacy Analytics Dashboard
 * Displays comprehensive privacy metrics and insights
 */
export const PrivacyAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<PrivacyAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await privacyEnabledWallet.getPrivacyAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load privacy analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => loadAnalytics(true);

  const getOverallPrivacyScore = () => {
    if (!analytics) return 0;
    const { privacyScoreBreakdown } = analytics;
    return Math.round(
      (privacyScoreBreakdown.anonymitySet +
        privacyScoreBreakdown.transactionMixing +
        privacyScoreBreakdown.temporalPrivacy +
        privacyScoreBreakdown.networkPrivacy) / 4
    );
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: colors.success };
    if (score >= 80) return { grade: 'A', color: colors.success };
    if (score >= 70) return { grade: 'B', color: colors.warning };
    if (score >= 60) return { grade: 'C', color: colors.warning };
    return { grade: 'D', color: colors.error };
  };

  if (isLoading || !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>📊 Loading Privacy Analytics...</Text>
      </View>
    );
  }

  const overallScore = getOverallPrivacyScore();
  const scoreGrade = getScoreGrade(overallScore);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Privacy Analytics</Text>
        <Text style={styles.subtitle}>
          Your privacy performance and insights
        </Text>
      </View>

      {/* Overall Privacy Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.scoreCardTitle}>Overall Privacy Score</Text>
        <View style={styles.scoreDisplay}>
          <Text style={[styles.scoreNumber, { color: scoreGrade.color }]}>
            {overallScore}
          </Text>
          <Text style={[styles.scoreGrade, { color: scoreGrade.color }]}>
            {scoreGrade.grade}
          </Text>
        </View>
        <Text style={styles.scoreDescription}>
          Based on anonymity, mixing, temporal, and network privacy factors
        </Text>
      </View>

      {/* Metrics Overview */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Shielded"
          value={`${analytics.totalShieldedAmount} ETH`}
          subtitle="Protected in privacy pools"
          icon="🛡️"
          color={colors.success}
        />
        <MetricCard
          title="Private Transactions"
          value={analytics.totalPrivateTransactions.toString()}
          subtitle="ZK-SNARK protected"
          icon="🔐"
          color={colors.primary}
        />
      </View>

      <View style={styles.metricsRow}>
        <MetricCard
          title="Avg. Privacy Latency"
          value={`${analytics.averagePrivacyLatency}s`}
          subtitle="ZK proof generation time"
          icon="⚡"
          color={colors.warning}
        />
      </View>

      {/* Privacy Score Breakdown */}
      <View style={styles.scoreBreakdown}>
        <Text style={styles.sectionTitle}>Privacy Score Breakdown</Text>
        
        <ScoreBar
          label="Anonymity Set Size"
          score={analytics.privacyScoreBreakdown.anonymitySet}
        />
        <Text style={styles.scoreExplanation}>
          How many users your transactions mix with
        </Text>

        <ScoreBar
          label="Transaction Mixing"
          score={analytics.privacyScoreBreakdown.transactionMixing}
        />
        <Text style={styles.scoreExplanation}>
          Effectiveness of transaction obfuscation
        </Text>

        <ScoreBar
          label="Temporal Privacy"
          score={analytics.privacyScoreBreakdown.temporalPrivacy}
        />
        <Text style={styles.scoreExplanation}>
          Timing analysis resistance
        </Text>

        <ScoreBar
          label="Network Privacy"
          score={analytics.privacyScoreBreakdown.networkPrivacy}
        />
        <Text style={styles.scoreExplanation}>
          IP and network-level protection
        </Text>
      </View>

      {/* Privacy Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Privacy Enhancement Tips</Text>
        
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🕐 Vary Transaction Timing</Text>
          <Text style={styles.tipDescription}>
            Avoid regular transaction patterns to improve temporal privacy
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💰 Use Different Amounts</Text>
          <Text style={styles.tipDescription}>
            Varying transaction amounts makes analysis more difficult
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🔄 Enable Auto-Mixing</Text>
          <Text style={styles.tipDescription}>
            Regular mixing increases your anonymity set size
          </Text>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>🌐 Use Privacy Networks</Text>
          <Text style={styles.tipDescription}>
            Connect through Tor or VPN for better network privacy
          </Text>
        </View>
      </View>

      {/* Recent Activity Summary */}
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
        
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <Text style={styles.activityLabel}>Last 7 days:</Text>
            <Text style={styles.activityValue}>12 private transactions</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityLabel}>Last 30 days:</Text>
            <Text style={styles.activityValue}>45 private transactions</Text>
          </View>
          <View style={styles.activityItem}>
            <Text style={styles.activityLabel}>Privacy improvement:</Text>
            <Text style={[styles.activityValue, { color: colors.success }]}>
              +8% this month
            </Text>
          </View>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray200,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
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
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  scoreCardTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  scoreGrade: {
    ...typography.h2,
    fontWeight: 'bold',
  },
  scoreDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metricsRow: {
    marginBottom: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    flex: 0.48,
    borderTopWidth: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  metricIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  metricTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metricValue: {
    ...typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  scoreBreakdown: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  scoreBarContainer: {
    marginBottom: spacing.md,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  scoreBarLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  scoreBarValue: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: colors.gray300,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreExplanation: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  tipsSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tipCard: {
    padding: spacing.sm,
    backgroundColor: colors.gray200,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  tipDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  activitySection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  activityCard: {
    gap: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  activityLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  activityValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
});

export default PrivacyAnalyticsDashboard;
