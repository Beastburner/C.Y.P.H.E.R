import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import ShieldedPoolService from '../../services/shieldedPoolService';
import AdvancedKeyManager from '../../services/advancedKeyManager';

const { width } = Dimensions.get('window');

interface PrivacyAnalyticsProps {
  onNavigate: (screen: string) => void;
}

interface PrivacyMetrics {
  privacyScore: number;
  anonymitySet: number;
  totalDeposits: number;
  totalWithdrawals: number;
  shieldedBalance: string;
  activeNotes: number;
  networkPrivacy: number;
  timeSpentShielded: number;
}

interface TransactionHistory {
  date: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: string;
  privacyLevel: number;
}

interface NetworkStats {
  totalUsers: number;
  totalVolume: string;
  averageAnonymitySet: number;
  dailyTransactions: number;
}

/**
 * @title PrivacyAnalyticsDashboard
 * @dev Comprehensive analytics dashboard for privacy features
 * @notice Provides detailed metrics about:
 *         - Personal privacy score and statistics
 *         - Network-wide anonymity metrics
 *         - Transaction history analysis
 *         - Privacy trends and recommendations
 */
const PrivacyAnalyticsDashboard: React.FC<PrivacyAnalyticsProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const { colors } = useTheme();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'network'>('overview');
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetrics>({
    privacyScore: 0,
    anonymitySet: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    shieldedBalance: '0',
    activeNotes: 0,
    networkPrivacy: 0,
    timeSpentShielded: 0
  });
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalUsers: 0,
    totalVolume: '0',
    averageAnonymitySet: 0,
    dailyTransactions: 0
  });

  // Services
  const [shieldedService, setShieldedService] = useState<ShieldedPoolService | null>(null);
  const [keyManager] = useState(new AdvancedKeyManager());

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      setLoading(true);
      
      if (state.currentNetwork?.rpcUrl) {
        // Initialize services (mock for demo)
        await loadPrivacyMetrics();
        await loadTransactionHistory();
        await loadNetworkStats();
      }
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPrivacyMetrics = async () => {
    // Simulate loading privacy metrics
    const mockMetrics: PrivacyMetrics = {
      privacyScore: 85, // Out of 100
      anonymitySet: 1247, // Number of users in anonymity set
      totalDeposits: 12,
      totalWithdrawals: 8,
      shieldedBalance: '2.45',
      activeNotes: 4,
      networkPrivacy: 78,
      timeSpentShielded: 67 // Percentage of time funds were shielded
    };
    
    setPrivacyMetrics(mockMetrics);
  };

  const loadTransactionHistory = async () => {
    // Simulate loading transaction history
    const mockHistory: TransactionHistory[] = [
      { date: '2025-09-19', type: 'deposit', amount: '0.5', privacyLevel: 95 },
      { date: '2025-09-18', type: 'withdraw', amount: '0.3', privacyLevel: 90 },
      { date: '2025-09-17', type: 'deposit', amount: '1.0', privacyLevel: 88 },
      { date: '2025-09-16', type: 'transfer', amount: '0.2', privacyLevel: 92 },
      { date: '2025-09-15', type: 'withdraw', amount: '0.8', privacyLevel: 87 },
      { date: '2025-09-14', type: 'deposit', amount: '0.6', privacyLevel: 93 },
      { date: '2025-09-13', type: 'deposit', amount: '0.4', privacyLevel: 89 },
    ];
    
    setTransactionHistory(mockHistory);
  };

  const loadNetworkStats = async () => {
    // Simulate loading network statistics
    const mockNetworkStats: NetworkStats = {
      totalUsers: 15847,
      totalVolume: '284,592',
      averageAnonymitySet: 2341,
      dailyTransactions: 1876
    };
    
    setNetworkStats(mockNetworkStats);
  };

  // Privacy score calculation
  const privacyScoreBreakdown = useMemo(() => {
    return [
      { name: 'Anonymity Set', value: privacyMetrics.anonymitySet > 1000 ? 25 : Math.floor(privacyMetrics.anonymitySet / 40) },
      { name: 'Time Shielded', value: Math.floor(privacyMetrics.timeSpentShielded / 4) },
      { name: 'Transaction Mix', value: privacyMetrics.totalDeposits > 5 ? 20 : privacyMetrics.totalDeposits * 4 },
      { name: 'Key Management', value: 15 }, // From key manager
      { name: 'Network Effect', value: Math.floor(privacyMetrics.networkPrivacy / 5) },
    ];
  }, [privacyMetrics]);

  // Transaction volume data for charts
  const volumeData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return {
      labels: last7Days.map(date => date.split('-')[2]),
      data: [0.5, 1.2, 0.8, 1.5, 0.3, 0.9, 0.6] // Mock data
    };
  }, [transactionHistory]);

  // Simple chart component using View and styles
  const SimpleChart = ({ data, labels }: { data: number[], labels: string[] }) => {
    const maxValue = Math.max(...data);
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartBars}>
          {data.map((value, index) => (
            <View key={index} style={styles.chartBarContainer}>
              <View style={styles.chartBarBackground}>
                <View 
                  style={[
                    styles.chartBar, 
                    { height: `${(value / maxValue) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.chartLabel}>{labels[index]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Privacy Score Card */}
      <View style={styles.scoreCard}>
        <LinearGradient
          colors={[colors.success, colors.successLight]}
          style={styles.scoreGradient}
        >
          <View style={styles.scoreHeader}>
            <Icon name="security" size={24} color="white" />
            <Text style={styles.scoreTitle}>Privacy Score</Text>
          </View>
          
          <View style={styles.scoreMain}>
            <Text style={styles.scoreValue}>{privacyMetrics.privacyScore}</Text>
            <Text style={styles.scoreOutOf}>/100</Text>
          </View>
          
          <View style={styles.scoreBar}>
            <View style={[styles.scoreProgress, { width: `${privacyMetrics.privacyScore}%` }]} />
          </View>
          
          <Text style={styles.scoreDescription}>
            Excellent privacy level! Your transactions are well-protected.
          </Text>
        </LinearGradient>
      </View>

      {/* Privacy Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Icon name="group" size={20} color={colors.primary} />
          <Text style={styles.metricValue}>{privacyMetrics.anonymitySet.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Anonymity Set</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="account-balance-wallet" size={20} color={colors.accent} />
          <Text style={styles.metricValue}>{privacyMetrics.shieldedBalance} ETH</Text>
          <Text style={styles.metricLabel}>Shielded Balance</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="note-add" size={20} color={colors.warning} />
          <Text style={styles.metricValue}>{privacyMetrics.activeNotes}</Text>
          <Text style={styles.metricLabel}>Active Notes</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Icon name="timeline" size={20} color={colors.success} />
          <Text style={styles.metricValue}>{privacyMetrics.timeSpentShielded}%</Text>
          <Text style={styles.metricLabel}>Time Shielded</Text>
        </View>
      </View>

      {/* Privacy Score Breakdown */}
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Privacy Score Breakdown</Text>
        {privacyScoreBreakdown.map((item, index) => (
          <View key={index} style={styles.breakdownItem}>
            <Text style={styles.breakdownName}>{item.name}</Text>
            <View style={styles.breakdownBar}>
              <View style={[
                styles.breakdownProgress,
                { width: `${(item.value / 25) * 100}%` }
              ]} />
            </View>
            <Text style={styles.breakdownValue}>{item.value}/25</Text>
          </View>
        ))}
      </View>

      {/* Transaction Volume Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>7-Day Transaction Volume</Text>
        <SimpleChart data={volumeData.data} labels={volumeData.labels} />
      </View>
    </ScrollView>
  );

  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Transaction History */}
      <View style={styles.historyCard}>
        <Text style={styles.cardTitle}>Recent Privacy Transactions</Text>
        {transactionHistory.map((tx, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={styles.historyIcon}>
              <Icon 
                name={
                  tx.type === 'deposit' ? 'lock' : 
                  tx.type === 'withdraw' ? 'lock-open' : 
                  'swap-horiz'
                } 
                size={20} 
                color={
                  tx.type === 'deposit' ? colors.success : 
                  tx.type === 'withdraw' ? colors.warning : 
                  colors.primary
                }
              />
            </View>
            
            <View style={styles.historyDetails}>
              <Text style={styles.historyType}>
                {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
              </Text>
              <Text style={styles.historyDate}>{tx.date}</Text>
            </View>
            
            <View style={styles.historyAmount}>
              <Text style={styles.historyValue}>{tx.amount} ETH</Text>
              <View style={styles.privacyLevel}>
                <Text style={styles.privacyText}>{tx.privacyLevel}% private</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Privacy Trends */}
      <View style={styles.trendsCard}>
        <Text style={styles.cardTitle}>Privacy Trends</Text>
        
        <View style={styles.trendItem}>
          <Icon name="trending-up" size={20} color={colors.success} />
          <View style={styles.trendInfo}>
            <Text style={styles.trendTitle}>Anonymity Set Growing</Text>
            <Text style={styles.trendDescription}>
              Your anonymity set has increased by 23% this week
            </Text>
          </View>
        </View>
        
        <View style={styles.trendItem}>
          <Icon name="schedule" size={20} color={colors.accent} />
          <View style={styles.trendInfo}>
            <Text style={styles.trendTitle}>Optimal Shielding Time</Text>
            <Text style={styles.trendDescription}>
              Best privacy window: 2-4 PM UTC (highest activity)
            </Text>
          </View>
        </View>
        
        <View style={styles.trendItem}>
          <Icon name="security" size={20} color={colors.primary} />
          <View style={styles.trendInfo}>
            <Text style={styles.trendTitle}>Privacy Score Improving</Text>
            <Text style={styles.trendDescription}>
              Your privacy habits are getting better over time
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderNetworkTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Network Overview */}
      <View style={styles.networkCard}>
        <Text style={styles.cardTitle}>Network Privacy Statistics</Text>
        
        <View style={styles.networkGrid}>
          <View style={styles.networkStat}>
            <Text style={styles.networkValue}>{networkStats.totalUsers.toLocaleString()}</Text>
            <Text style={styles.networkLabel}>Total Users</Text>
          </View>
          
          <View style={styles.networkStat}>
            <Text style={styles.networkValue}>{networkStats.totalVolume} ETH</Text>
            <Text style={styles.networkLabel}>Total Volume</Text>
          </View>
          
          <View style={styles.networkStat}>
            <Text style={styles.networkValue}>{networkStats.averageAnonymitySet.toLocaleString()}</Text>
            <Text style={styles.networkLabel}>Avg Anonymity Set</Text>
          </View>
          
          <View style={styles.networkStat}>
            <Text style={styles.networkValue}>{networkStats.dailyTransactions.toLocaleString()}</Text>
            <Text style={styles.networkLabel}>Daily Transactions</Text>
          </View>
        </View>
      </View>

      {/* Privacy Health */}
      <View style={styles.healthCard}>
        <Text style={styles.cardTitle}>Network Privacy Health</Text>
        
        <View style={styles.healthMeter}>
          <View style={styles.healthIndicator}>
            <View style={[styles.healthBar, { width: '78%' }]} />
          </View>
          <Text style={styles.healthScore}>78% Healthy</Text>
        </View>
        
        <View style={styles.healthFactors}>
          <View style={styles.healthFactor}>
            <Icon name="people" size={16} color={colors.success} />
            <Text style={styles.healthText}>Active user growth: +12%</Text>
          </View>
          
          <View style={styles.healthFactor}>
            <Icon name="trending-up" size={16} color={colors.success} />
            <Text style={styles.healthText}>Transaction volume: +18%</Text>
          </View>
          
          <View style={styles.healthFactor}>
            <Icon name="security" size={16} color={colors.warning} />
            <Text style={styles.healthText}>Average anonymity: Moderate</Text>
          </View>
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.recommendationsCard}>
        <Text style={styles.cardTitle}>Privacy Recommendations</Text>
        
        <View style={styles.recommendation}>
          <Icon name="lightbulb-outline" size={20} color={colors.accent} />
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>Increase Transaction Mix</Text>
            <Text style={styles.recommendationDescription}>
              Vary your transaction amounts and timing for better privacy
            </Text>
          </View>
        </View>
        
        <View style={styles.recommendation}>
          <Icon name="schedule" size={20} color={colors.accent} />
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>Optimal Timing</Text>
            <Text style={styles.recommendationDescription}>
              Transact during peak hours for larger anonymity sets
            </Text>
          </View>
        </View>
        
        <View style={styles.recommendation}>
          <Icon name="refresh" size={20} color={colors.accent} />
          <View style={styles.recommendationText}>
            <Text style={styles.recommendationTitle}>Key Rotation</Text>
            <Text style={styles.recommendationDescription}>
              Generate new keys periodically for enhanced privacy
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Privacy')}
          >
            <Icon name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Analytics</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'network' && styles.activeTab]}
          onPress={() => setActiveTab('network')}
        >
          <Text style={[styles.tabText, activeTab === 'network' && styles.activeTabText]}>
            Network
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'network' && renderNetworkTab()}
        </>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scoreCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreGradient: {
    padding: 24,
    borderRadius: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreOutOf: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  scoreBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginBottom: 16,
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownName: {
    fontSize: 14,
    color: colors.textPrimary,
    width: 120,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  breakdownProgress: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  breakdownValue: {
    fontSize: 12,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  chartContainer: {
    marginVertical: 8,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 20,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  chartBarBackground: {
    width: 24,
    height: 100,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  privacyLevel: {
    marginTop: 2,
  },
  privacyText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },
  trendsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  trendDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  networkCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  networkStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  networkValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  networkLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  healthMeter: {
    alignItems: 'center',
    marginBottom: 16,
  },
  healthIndicator: {
    width: '100%',
    height: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 6,
    marginBottom: 8,
  },
  healthBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 6,
  },
  healthScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
  },
  healthFactors: {
    marginTop: 8,
  },
  healthFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  recommendationsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recommendationText: {
    flex: 1,
    marginLeft: 12,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recommendationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default PrivacyAnalyticsDashboard;
