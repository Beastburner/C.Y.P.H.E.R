import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import AdvancedDeFiService, { 
  DeFiAnalytics, 
  DeFiPosition, 
  YieldFarm, 
  DeFiStrategy,
  ProtocolInfo
} from '../../services/advancedDeFiService';

const { width } = Dimensions.get('window');

interface DeFiDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

/**
 * CYPHER Advanced DeFi Dashboard
 * Comprehensive DeFi portfolio management and analytics
 * Features: Yield farming, liquidity pools, staking, automated strategies
 */
const DeFiDashboard: React.FC<DeFiDashboardProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [analytics, setAnalytics] = useState<DeFiAnalytics | null>(null);
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [yieldFarms, setYieldFarms] = useState<YieldFarm[]>([]);
  const [strategies, setStrategies] = useState<DeFiStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'portfolio' | 'opportunities' | 'strategies'>('portfolio');

  const defiService = AdvancedDeFiService.getInstance();

  useEffect(() => {
    loadDeFiData();
  }, []);

  const loadDeFiData = async () => {
    try {
      setRefreshing(true);
      
      const [analyticsData, farmsData] = await Promise.all([
        defiService.getDeFiAnalytics('0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E'),
        defiService.getAvailableYieldFarms()
      ]);
      
      setAnalytics(analyticsData);
      setPositions(analyticsData.positions);
      setYieldFarms(farmsData);

      // Mock strategies for demonstration
      setStrategies([
        {
          id: 'conservative_yield',
          name: 'Conservative Yield',
          description: 'Low-risk stable coin farming',
          targetApy: 8.5,
          riskLevel: 'conservative',
          positions: [],
          totalValue: 0,
          pnl: 0,
          isActive: true,
          autoRebalance: true,
          rebalanceThreshold: 0.05
        },
        {
          id: 'balanced_growth',
          name: 'Balanced Growth',
          description: 'Diversified moderate risk portfolio',
          targetApy: 15.2,
          riskLevel: 'moderate',
          positions: [],
          totalValue: 0,
          pnl: 0,
          isActive: true,
          autoRebalance: true,
          rebalanceThreshold: 0.1
        }
      ]);
    } catch (error) {
      console.error('Failed to load DeFi data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEnterFarm = async (farmId: string) => {
    Alert.prompt(
      'Enter Yield Farm',
      'How much would you like to deposit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit',
          onPress: async (amount) => {
            if (amount && !isNaN(Number(amount))) {
              try {
                setLoading(true);
                await defiService.enterYieldFarm(farmId, Number(amount), '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E');
                Alert.alert('Success', 'Successfully entered yield farm!');
                loadDeFiData();
              } catch (error) {
                Alert.alert('Error', 'Failed to enter yield farm');
              } finally {
                setLoading(false);
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const renderCircularProgress = (value: number, maxValue: number, color: string, size: number = 80) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (value / maxValue) * circumference;
    const remaining = circumference - progress;

    return (
      <Svg width={size} height={size}>
        <Circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="4"
          fill="transparent"
        />
        <Circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={`${progress} ${remaining}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </Svg>
    );
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const cardStyle = createCardStyle('elevated');

  if (!analytics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading DeFi portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[colors.primary, colors.accent]} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            DeFi Portfolio
          </Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => onNavigate('DeFiStrategies')}
          >
            <Text style={styles.headerButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Advanced yield farming and liquidity management
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {[
          { key: 'portfolio', label: 'Portfolio', icon: '📊' },
          { key: 'opportunities', label: 'Opportunities', icon: '🌾' },
          { key: 'strategies', label: 'Strategies', icon: '🎯' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.tabActive
            ]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.tabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDeFiData} />
        }
      >
        {selectedTab === 'portfolio' && (
          <>
            {/* Portfolio Overview */}
            <View style={[cardStyle, styles.overviewCard]}>
              <Text style={styles.sectionTitle}>Portfolio Overview</Text>
              
              <View style={styles.overviewGrid}>
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{formatCurrency(analytics.totalValue)}</Text>
                  <Text style={styles.overviewLabel}>Total Value</Text>
                </View>
                
                <View style={styles.overviewItem}>
                  <Text style={[styles.overviewValue, { color: colors.success }]}>
                    {formatCurrency(analytics.totalRewards)}
                  </Text>
                  <Text style={styles.overviewLabel}>Total Rewards</Text>
                </View>
                
                <View style={styles.overviewItem}>
                  <Text style={[
                    styles.overviewValue, 
                    { color: analytics.totalPnl >= 0 ? colors.success : colors.error }
                  ]}>
                    {formatPercentage(analytics.totalPnl)}
                  </Text>
                  <Text style={styles.overviewLabel}>P&L</Text>
                </View>
                
                <View style={styles.overviewItem}>
                  <Text style={styles.overviewValue}>{analytics.averageApy.toFixed(1)}%</Text>
                  <Text style={styles.overviewLabel}>Avg APY</Text>
                </View>
              </View>

              {/* Risk & Diversification */}
              <View style={styles.riskSection}>
                <View style={styles.riskItem}>
                  <Text style={styles.riskLabel}>Risk Score</Text>
                  <View style={styles.riskProgress}>
                    {renderCircularProgress(analytics.riskScore, 100, getRiskColor(
                      analytics.riskScore < 30 ? 'low' : 
                      analytics.riskScore < 70 ? 'medium' : 'high'
                    ))}
                    <View style={styles.riskCenter}>
                      <Text style={styles.riskValue}>{analytics.riskScore}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.riskItem}>
                  <Text style={styles.riskLabel}>Diversification</Text>
                  <View style={styles.riskProgress}>
                    {renderCircularProgress(analytics.diversificationScore, 100, colors.accent)}
                    <View style={styles.riskCenter}>
                      <Text style={styles.riskValue}>{analytics.diversificationScore}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Active Positions */}
            <View style={[cardStyle, styles.positionsCard]}>
              <Text style={styles.sectionTitle}>Active Positions</Text>
              
              {positions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🌾</Text>
                  <Text style={styles.emptyTitle}>No Active Positions</Text>
                  <Text style={styles.emptyDescription}>
                    Start earning yield by exploring opportunities below
                  </Text>
                </View>
              ) : (
                positions.map((position) => (
                  <View key={position.id} style={styles.positionItem}>
                    <View style={styles.positionHeader}>
                      <Text style={styles.positionProtocol}>{position.protocol}</Text>
                      <View style={[styles.positionType, { backgroundColor: getRiskColor(position.risk) + '20' }]}>
                        <Text style={[styles.positionTypeText, { color: getRiskColor(position.risk) }]}>
                          {position.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.positionAsset}>{position.asset}</Text>
                    
                    <View style={styles.positionMetrics}>
                      <View style={styles.positionMetric}>
                        <Text style={styles.positionMetricLabel}>Value</Text>
                        <Text style={styles.positionMetricValue}>{formatCurrency(position.value)}</Text>
                      </View>
                      <View style={styles.positionMetric}>
                        <Text style={styles.positionMetricLabel}>APY</Text>
                        <Text style={styles.positionMetricValue}>{position.apy.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.positionMetric}>
                        <Text style={styles.positionMetricLabel}>Rewards</Text>
                        <Text style={[styles.positionMetricValue, { color: colors.success }]}>
                          {formatCurrency(position.rewards)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.positionActions}>
                      <TouchableOpacity style={styles.positionAction}>
                        <Text style={styles.positionActionText}>Manage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.positionAction, styles.positionActionPrimary]}>
                        <Text style={[styles.positionActionText, { color: colors.primary }]}>
                          Claim Rewards
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Recommendations */}
            <View style={[cardStyle, styles.recommendationsCard]}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              
              {analytics.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationIcon}>
                    {rec.type === 'opportunity' ? '💡' : 
                     rec.type === 'risk' ? '⚠️' : '🎯'}
                  </Text>
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    {rec.action && (
                      <Text style={styles.recommendationAction}>💡 {rec.action}</Text>
                    )}
                    {rec.estimatedGain && (
                      <Text style={styles.recommendationGain}>
                        Potential gain: {formatCurrency(rec.estimatedGain)}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'opportunities' && (
          <>
            {/* Top Yield Farms */}
            <View style={[cardStyle, styles.farmsCard]}>
              <Text style={styles.sectionTitle}>Top Yield Farms</Text>
              
              {yieldFarms.slice(0, 5).map((farm) => (
                <View key={farm.id} style={styles.farmItem}>
                  <View style={styles.farmHeader}>
                    <View style={styles.farmInfo}>
                      <Text style={styles.farmProtocol}>{farm.protocol}</Text>
                      <Text style={styles.farmName}>{farm.name}</Text>
                    </View>
                    <View style={[styles.farmRisk, { backgroundColor: getRiskColor(farm.risk) + '20' }]}>
                      <Text style={[styles.farmRiskText, { color: getRiskColor(farm.risk) }]}>
                        {farm.risk.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.farmMetrics}>
                    <View style={styles.farmMetric}>
                      <Text style={styles.farmMetricLabel}>APY</Text>
                      <Text style={styles.farmMetricValue}>{farm.apy.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.farmMetric}>
                      <Text style={styles.farmMetricLabel}>TVL</Text>
                      <Text style={styles.farmMetricValue}>{formatCurrency(farm.tvl)}</Text>
                    </View>
                    <View style={styles.farmMetric}>
                      <Text style={styles.farmMetricLabel}>Rewards</Text>
                      <Text style={styles.farmMetricValue}>{farm.rewards.join(', ')}</Text>
                    </View>
                  </View>

                  <Button
                    title="Enter Farm"
                    onPress={() => handleEnterFarm(farm.id)}
                    loading={loading}
                    style={styles.farmButton}
                  />
                </View>
              ))}
            </View>

            {/* Protocol Rankings */}
            <View style={[cardStyle, styles.protocolsCard]}>
              <Text style={styles.sectionTitle}>Top Protocols</Text>
              
              {analytics.topProtocols.map((protocol, index) => (
                <View key={protocol.id} style={styles.protocolItem}>
                  <View style={styles.protocolRank}>
                    <Text style={styles.protocolRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.protocolInfo}>
                    <Text style={styles.protocolName}>{protocol.name}</Text>
                    <Text style={styles.protocolCategories}>
                      {protocol.categories.join(' • ')}
                    </Text>
                  </View>
                  <View style={styles.protocolMetrics}>
                    <Text style={styles.protocolApy}>{protocol.apy.toFixed(1)}%</Text>
                    <Text style={styles.protocolTvl}>{formatCurrency(protocol.tvl)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {selectedTab === 'strategies' && (
          <>
            {/* Strategy Cards */}
            {strategies.map((strategy) => (
              <View key={strategy.id} style={[cardStyle, styles.strategyCard]}>
                <View style={styles.strategyHeader}>
                  <View style={styles.strategyInfo}>
                    <Text style={styles.strategyName}>{strategy.name}</Text>
                    <Text style={styles.strategyDescription}>{strategy.description}</Text>
                  </View>
                  <View style={[
                    styles.strategyRisk,
                    { backgroundColor: 
                      strategy.riskLevel === 'conservative' ? colors.success + '20' :
                      strategy.riskLevel === 'moderate' ? colors.warning + '20' :
                      colors.error + '20'
                    }
                  ]}>
                    <Text style={[
                      styles.strategyRiskText,
                      { color: 
                        strategy.riskLevel === 'conservative' ? colors.success :
                        strategy.riskLevel === 'moderate' ? colors.warning :
                        colors.error
                      }
                    ]}>
                      {strategy.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.strategyMetrics}>
                  <View style={styles.strategyMetric}>
                    <Text style={styles.strategyMetricLabel}>Target APY</Text>
                    <Text style={styles.strategyMetricValue}>{strategy.targetApy.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.strategyMetric}>
                    <Text style={styles.strategyMetricLabel}>Total Value</Text>
                    <Text style={styles.strategyMetricValue}>{formatCurrency(strategy.totalValue)}</Text>
                  </View>
                  <View style={styles.strategyMetric}>
                    <Text style={styles.strategyMetricLabel}>Auto Rebalance</Text>
                    <Text style={styles.strategyMetricValue}>
                      {strategy.autoRebalance ? '✅' : '❌'}
                    </Text>
                  </View>
                </View>

                <View style={styles.strategyActions}>
                  <Button
                    title={strategy.isActive ? 'Manage Strategy' : 'Activate Strategy'}
                    onPress={() => {
                      Alert.alert(
                        strategy.name,
                        `Would you like to ${strategy.isActive ? 'manage' : 'activate'} this strategy?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: strategy.isActive ? 'Manage' : 'Activate', onPress: () => {} }
                        ]
                      );
                    }}
                    style={strategy.isActive ? styles.strategyButton : styles.strategyButtonActive}
                  />
                </View>
              </View>
            ))}

            {/* Create New Strategy */}
            <View style={[cardStyle, styles.createStrategyCard]}>
              <Text style={styles.createStrategyIcon}>✨</Text>
              <Text style={styles.createStrategyTitle}>Create Custom Strategy</Text>
              <Text style={styles.createStrategyDescription}>
                Build your own automated DeFi strategy tailored to your risk tolerance and goals
              </Text>
              <Button
                title="Create Strategy"
                onPress={() => {
                  Alert.alert(
                    'Create Strategy',
                    'Custom strategy builder coming soon!',
                    [{ text: 'OK' }]
                  );
                }}
                style={styles.createStrategyButton}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0F172A',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#1E293B',
  },
  tabActive: {
    backgroundColor: '#3B82F6',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  overviewCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  positionsCard: {
    marginBottom: 16,
  },
  recommendationsCard: {
    marginBottom: 16,
  },
  farmsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  protocolsCard: {
    marginBottom: 16,
  },
  strategyCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  createStrategyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  overviewItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  riskSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  riskItem: {
    alignItems: 'center',
  },
  riskLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  riskProgress: {
    position: 'relative',
  },
  riskCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  positionItem: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionProtocol: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  positionType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  positionAsset: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  positionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionMetric: {
    alignItems: 'center',
  },
  positionMetricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  positionMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  positionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  positionAction: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  positionActionPrimary: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  positionActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 6,
  },
  recommendationAction: {
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  recommendationGain: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  farmItem: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 12,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  farmInfo: {
    flex: 1,
  },
  farmProtocol: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  farmRisk: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  farmRiskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  farmMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  farmMetric: {
    alignItems: 'center',
  },
  farmMetricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  farmMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  farmButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 10,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 8,
  },
  protocolRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  protocolRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  protocolCategories: {
    fontSize: 12,
    color: '#94A3B8',
  },
  protocolMetrics: {
    alignItems: 'flex-end',
  },
  protocolApy: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  protocolTvl: {
    fontSize: 12,
    color: '#94A3B8',
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  strategyRisk: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  strategyRiskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  strategyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  strategyMetric: {
    alignItems: 'center',
  },
  strategyMetricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  strategyMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  strategyActions: {
    marginTop: 8,
  },
  strategyButton: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 12,
  },
  strategyButtonActive: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
  },
  createStrategyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  createStrategyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  createStrategyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createStrategyButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
});

export default DeFiDashboard;
