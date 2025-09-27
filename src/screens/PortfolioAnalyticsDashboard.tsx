/**
 * ECLIPTA Portfolio Analytics Dashboard
 * 
 * Comprehensive portfolio analysis interface with AI insights,
 * performance tracking, risk assessment, and investment recommendations.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { 
  portfolioAnalytics, 
  PortfolioAsset, 
  PortfolioMetrics, 
  AIInsights, 
  RiskAnalysis,
  PerformanceAnalysis,
  AssetRecommendation
} from '../services/PortfolioAnalytics';

const { width, height } = Dimensions.get('window');

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => (
  <View style={styles.metricCard}>
    <View style={styles.metricHeader}>
      <Icon name={icon} size={20} color={color} />
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
    
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    
    {change !== undefined && (
      <View style={styles.metricChange}>
        <Icon 
          name={change >= 0 ? 'trending-up' : 'trending-down'} 
          size={12} 
          color={change >= 0 ? '#4CAF50' : '#FF5722'} 
        />
        <Text style={[styles.metricChangeText, { 
          color: change >= 0 ? '#4CAF50' : '#FF5722' 
        }]}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </Text>
      </View>
    )}
  </View>
);

interface AssetRowProps {
  asset: PortfolioAsset;
  onPress: () => void;
}

const AssetRow: React.FC<AssetRowProps> = ({ asset, onPress }) => (
  <TouchableOpacity style={styles.assetRow} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.assetInfo}>
      <View style={styles.assetHeader}>
        <Text style={styles.assetSymbol}>{asset.symbol}</Text>
        <Text style={styles.assetName}>{asset.name}</Text>
      </View>
      
      <View style={styles.assetMetrics}>
        <Text style={styles.assetAmount}>{asset.amount.toFixed(4)}</Text>
        <Text style={styles.assetValue}>${asset.value.toLocaleString()}</Text>
      </View>
    </View>
    
    <View style={styles.assetPerformance}>
      <Text style={[styles.assetPnL, { 
        color: asset.unrealizedPnL >= 0 ? '#4CAF50' : '#FF5722' 
      }]}>
        {asset.unrealizedPnL >= 0 ? '+' : ''}${asset.unrealizedPnL.toFixed(2)}
      </Text>
      
      <Text style={[styles.assetPnLPercent, { 
        color: asset.unrealizedPnLPercentage >= 0 ? '#4CAF50' : '#FF5722' 
      }]}>
        ({asset.unrealizedPnLPercentage >= 0 ? '+' : ''}{asset.unrealizedPnLPercentage.toFixed(2)}%)
      </Text>
    </View>
    
    <Icon name="chevron-forward" size={16} color="#666666" />
  </TouchableOpacity>
);

interface RecommendationCardProps {
  recommendation: AssetRecommendation;
  onPress: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onPress }) => {
  const getActionColor = () => {
    switch (recommendation.action) {
      case 'strong_buy': return '#4CAF50';
      case 'buy': return '#8BC34A';
      case 'hold': return '#FFC107';
      case 'sell': return '#FF8A65';
      case 'strong_sell': return '#FF5722';
      default: return '#666666';
    }
  };

  return (
    <TouchableOpacity style={styles.recommendationCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationAsset}>{recommendation.asset}</Text>
        <View style={[styles.actionBadge, { backgroundColor: getActionColor() }]}>
          <Text style={styles.actionText}>{recommendation.action.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.recommendationReason}>
        {recommendation.reasoning[0]}
      </Text>
      
      <View style={styles.recommendationMetrics}>
        <View style={styles.recommendationMetric}>
          <Text style={styles.metricLabel}>Target</Text>
          <Text style={styles.metricValue}>${recommendation.targetPrice}</Text>
        </View>
        
        <View style={styles.recommendationMetric}>
          <Text style={styles.metricLabel}>R/R</Text>
          <Text style={styles.metricValue}>{recommendation.riskReward.toFixed(1)}</Text>
        </View>
        
        <View style={styles.recommendationMetric}>
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>{recommendation.confidence}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const PortfolioAnalyticsDashboard: React.FC = () => {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [performance, setPerformance] = useState<PerformanceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<AssetRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'performance' | 'risk' | 'ai'>('overview');

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Simulate wallet address
      const walletAddress = '0x742d35Cc6Dd5d87c4C14d7F7BF5B5b5b5b5b5b5b';
      
      // Load portfolio data
      const portfolioAssets = await portfolioAnalytics.getPortfolioAssets(walletAddress);
      setAssets(portfolioAssets);
      
      // Calculate metrics
      const portfolioMetrics = await portfolioAnalytics.getPortfolioMetrics(portfolioAssets);
      setMetrics(portfolioMetrics);
      
      // Get AI insights
      const insights = await portfolioAnalytics.getAIInsights(portfolioAssets, portfolioMetrics);
      setAiInsights(insights);
      
      // Get risk analysis
      const risk = await portfolioAnalytics.getRiskAnalysis(portfolioAssets);
      setRiskAnalysis(risk);
      
      // Get performance analysis
      const perf = await portfolioAnalytics.getPerformanceAnalysis(portfolioAssets);
      setPerformance(perf);
      
      // Get recommendations
      const recs = await portfolioAnalytics.getAssetRecommendations(5);
      setRecommendations(recs);
      
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      Alert.alert('Error', 'Failed to load portfolio data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPortfolioData();
  };

  const handleAssetPress = (asset: PortfolioAsset) => {
    Alert.alert(
      `${asset.name} (${asset.symbol})`,
      `Value: $${asset.value.toLocaleString()}\nP&L: ${asset.unrealizedPnL >= 0 ? '+' : ''}$${asset.unrealizedPnL.toFixed(2)}\nAllocation: ${asset.allocation.toFixed(1)}%`,
      [
        { text: 'View Details' },
        { text: 'Trade', onPress: () => Alert.alert('Trade', 'Trading interface would open here') }
      ]
    );
  };

  const handleRecommendationPress = (rec: AssetRecommendation) => {
    Alert.alert(
      `${rec.asset} Recommendation`,
      `Action: ${rec.action.toUpperCase()}\nTarget: $${rec.targetPrice}\nConfidence: ${rec.confidence}%\n\nReasoning:\n${rec.reasoning.join('\n')}`,
      [
        { text: 'Learn More' },
        { text: 'Execute Trade', onPress: () => Alert.alert('Trade', 'Execute trade functionality') }
      ]
    );
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {metrics && (
        <>
          {/* Portfolio Value */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Portfolio Overview</Text>
            
            <View style={styles.portfolioValueCard}>
              <Text style={styles.portfolioValue}>
                ${metrics.totalValue.toLocaleString()}
              </Text>
              
              <View style={styles.portfolioPnL}>
                <Text style={[styles.pnlValue, { 
                  color: metrics.totalPnL >= 0 ? '#4CAF50' : '#FF5722' 
                }]}>
                  {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString()}
                </Text>
                
                <Text style={[styles.pnlPercent, { 
                  color: metrics.totalPnLPercentage >= 0 ? '#4CAF50' : '#FF5722' 
                }]}>
                  ({metrics.totalPnLPercentage >= 0 ? '+' : ''}{metrics.totalPnLPercentage.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <MetricCard
                title="24h Change"
                value={`$${Math.abs(metrics.dayChange).toLocaleString()}`}
                change={metrics.dayChangePercentage}
                icon="trending-up"
                color="#4CAF50"
              />
              
              <MetricCard
                title="7d Change"
                value={`$${Math.abs(metrics.weekChange).toLocaleString()}`}
                change={metrics.weekChangePercentage}
                icon="analytics"
                color="#2196F3"
              />
              
              <MetricCard
                title="Diversification"
                value={`${metrics.diversificationScore.toFixed(1)}/100`}
                icon="pie-chart"
                color="#FF9800"
              />
              
              <MetricCard
                title="Sharpe Ratio"
                value={metrics.sharpeRatio.toFixed(2)}
                icon="trending-up"
                color="#9C27B0"
              />
            </View>
          </View>
        </>
      )}

      {aiInsights && (
        <>
          {/* AI Grade */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI Portfolio Grade</Text>
            
            <View style={styles.gradeCard}>
              <View style={styles.gradeCircle}>
                <Text style={styles.gradeText}>{aiInsights.portfolioGrade}</Text>
              </View>
              
              <View style={styles.gradeInfo}>
                <Text style={styles.gradeSentiment}>
                  Market Sentiment: {aiInsights.marketSentiment.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={styles.gradeConfidence}>
                  Confidence: {aiInsights.confidenceScore}%
                </Text>
              </View>
            </View>
            
            <View style={styles.strengthsWeaknesses}>
              <View style={styles.strengthsColumn}>
                <Text style={styles.columnTitle}>💪 Strengths</Text>
                {aiInsights.keyStrengths.slice(0, 2).map((strength, index) => (
                  <Text key={index} style={styles.strengthText}>• {strength}</Text>
                ))}
              </View>
              
              <View style={styles.weaknessesColumn}>
                <Text style={styles.columnTitle}>⚠️ Areas to Improve</Text>
                {aiInsights.keyWeaknesses.slice(0, 2).map((weakness, index) => (
                  <Text key={index} style={styles.weaknessText}>• {weakness}</Text>
                ))}
              </View>
            </View>
          </View>

          {/* Top Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
            
            {aiInsights.recommendations.slice(0, 3).map((rec, index) => (
              <View key={index} style={styles.insightRecommendation}>
                <View style={styles.recHeader}>
                  <Text style={styles.recAction}>{rec.action.toUpperCase()}</Text>
                  <Text style={styles.recAsset}>{rec.asset}</Text>
                </View>
                <Text style={styles.recReasoning}>{rec.reasoning}</Text>
                <Text style={styles.recConfidence}>Confidence: {rec.confidence}%</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAssetsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💎 Portfolio Assets</Text>
        
        {assets.map((asset) => (
          <AssetRow
            key={asset.id}
            asset={asset}
            onPress={() => handleAssetPress(asset)}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      {performance && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Performance Analysis</Text>
            
            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>Benchmark Comparison</Text>
              
              <View style={styles.benchmarkRow}>
                <Text style={styles.benchmarkLabel}>vs Bitcoin:</Text>
                <Text style={[styles.benchmarkValue, { 
                  color: performance.benchmarkComparison.outperformance > 0 ? '#4CAF50' : '#FF5722' 
                }]}>
                  {performance.benchmarkComparison.outperformance > 0 ? '+' : ''}{performance.benchmarkComparison.outperformance.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.benchmarkRow}>
                <Text style={styles.benchmarkLabel}>Sharpe Ratio:</Text>
                <Text style={styles.benchmarkValue}>
                  {performance.benchmarkComparison.informationRatio.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔮 Market Cycle Analysis</Text>
            
            <View style={styles.cycleCard}>
              <Text style={styles.cyclePhase}>
                Current Phase: {performance.cycleAnalysis.marketCycle.toUpperCase()}
              </Text>
              
              <View style={styles.cycleProgress}>
                <View style={styles.cycleProgressBar}>
                  <View style={[styles.cycleProgressFill, { 
                    width: `${performance.cycleAnalysis.cyclePosition}%` 
                  }]} />
                </View>
                <Text style={styles.cycleProgressText}>
                  {performance.cycleAnalysis.cyclePosition}% through cycle
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderRiskTab = () => (
    <ScrollView style={styles.tabContent}>
      {riskAnalysis && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Risk Analysis</Text>
            
            <View style={styles.riskOverviewCard}>
              <View style={styles.riskScoreContainer}>
                <Text style={styles.riskScore}>{riskAnalysis.riskScore.toFixed(0)}</Text>
                <Text style={styles.riskScoreLabel}>Risk Score</Text>
              </View>
              
              <Text style={[styles.riskLevel, {
                color: riskAnalysis.portfolioRisk === 'conservative' ? '#4CAF50' :
                      riskAnalysis.portfolioRisk === 'moderate' ? '#FFC107' :
                      riskAnalysis.portfolioRisk === 'aggressive' ? '#FF8A65' : '#FF5722'
              }]}>
                {riskAnalysis.portfolioRisk.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.riskMetricsGrid}>
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Value at Risk</Text>
                <Text style={styles.riskMetricValue}>
                  ${riskAnalysis.valueAtRisk.toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Max Drawdown</Text>
                <Text style={styles.riskMetricValue}>
                  {riskAnalysis.maxDrawdown.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Volatility</Text>
                <Text style={styles.riskMetricValue}>
                  {riskAnalysis.volatility.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Portfolio Beta</Text>
                <Text style={styles.riskMetricValue}>
                  {riskAnalysis.beta.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Risk Factors</Text>
            
            {riskAnalysis.riskFactors.map((factor, index) => (
              <View key={index} style={styles.riskFactor}>
                <Icon name="warning" size={16} color="#FFC107" />
                <Text style={styles.riskFactorText}>{factor}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAITab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 AI Asset Recommendations</Text>
        
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={index}
            recommendation={rec}
            onPress={() => handleRecommendationPress(rec)}
          />
        ))}
      </View>

      {aiInsights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔮 Market Predictions</Text>
          
          {aiInsights.marketPredictions.map((prediction, index) => (
            <View key={index} style={styles.predictionCard}>
              <View style={styles.predictionHeader}>
                <Text style={styles.predictionTimeframe}>{prediction.timeframe}</Text>
                <View style={styles.predictionDirection}>
                  <Icon 
                    name={prediction.priceDirection === 'up' ? 'trending-up' : 
                          prediction.priceDirection === 'down' ? 'trending-down' : 'remove'}
                    size={16}
                    color={prediction.priceDirection === 'up' ? '#4CAF50' : 
                          prediction.priceDirection === 'down' ? '#FF5722' : '#FFC107'}
                  />
                  <Text style={[styles.predictionDirectionText, {
                    color: prediction.priceDirection === 'up' ? '#4CAF50' : 
                          prediction.priceDirection === 'down' ? '#FF5722' : '#FFC107'
                  }]}>
                    {prediction.priceDirection.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.predictionReasoning}>{prediction.reasoning}</Text>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confidence: {prediction.confidence}%</Text>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${prediction.confidence}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="analytics" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Analyzing Portfolio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <LinearGradient colors={['#1A1A1A', '#2A2A2A']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="analytics" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>Portfolio Analytics</Text>
          </View>
          
          {aiInsights && (
            <View style={[styles.gradeBadge, {
              backgroundColor: aiInsights.portfolioGrade.includes('A') ? '#4CAF50' :
                              aiInsights.portfolioGrade.includes('B') ? '#FFC107' :
                              aiInsights.portfolioGrade.includes('C') ? '#FF8A65' : '#FF5722'
            }]}>
              <Text style={styles.gradeBadgeText}>{aiInsights.portfolioGrade}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon 
            name="pie-chart" 
            size={16} 
            color={activeTab === 'overview' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assets' && styles.activeTab]}
          onPress={() => setActiveTab('assets')}
        >
          <Icon 
            name="wallet" 
            size={16} 
            color={activeTab === 'assets' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'assets' && styles.activeTabText]}>
            Assets
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'performance' && styles.activeTab]}
          onPress={() => setActiveTab('performance')}
        >
          <Icon 
            name="trending-up" 
            size={16} 
            color={activeTab === 'performance' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'performance' && styles.activeTabText]}>
            Performance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'risk' && styles.activeTab]}
          onPress={() => setActiveTab('risk')}
        >
          <Icon 
            name="shield" 
            size={16} 
            color={activeTab === 'risk' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'risk' && styles.activeTabText]}>
            Risk
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ai' && styles.activeTab]}
          onPress={() => setActiveTab('ai')}
        >
          <Icon 
            name="brain" 
            size={16} 
            color={activeTab === 'ai' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'ai' && styles.activeTabText]}>
            AI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'assets' && renderAssetsTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'risk' && renderRiskTab()}
      {activeTab === 'ai' && renderAITab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666666',
    fontSize: 10,
    marginLeft: 4,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  portfolioValueCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  portfolioValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  portfolioPnL: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  pnlPercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    color: '#CCCCCC',
    fontSize: 12,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricChangeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  gradeCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  gradeText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  gradeInfo: {
    flex: 1,
  },
  gradeSentiment: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gradeConfidence: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  strengthsWeaknesses: {
    flexDirection: 'row',
  },
  strengthsColumn: {
    flex: 1,
    marginRight: 10,
  },
  weaknessesColumn: {
    flex: 1,
    marginLeft: 10,
  },
  columnTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  strengthText: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 4,
  },
  weaknessText: {
    color: '#FF8A65',
    fontSize: 12,
    marginBottom: 4,
  },
  insightRecommendation: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recAction: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  recAsset: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  recReasoning: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  recConfidence: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  assetRow: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetInfo: {
    flex: 1,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  assetName: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  assetMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assetAmount: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  assetValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assetPerformance: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  assetPnL: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assetPnLPercent: {
    fontSize: 12,
  },
  recommendationCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationAsset: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recommendationReason: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 12,
  },
  recommendationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recommendationMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    marginBottom: 2,
  },
  performanceCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  performanceTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  benchmarkLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  benchmarkValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cycleCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  cyclePhase: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cycleProgress: {
    marginTop: 8,
  },
  cycleProgressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  cycleProgressText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  riskOverviewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  riskScoreContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  riskScore: {
    color: '#FF8A65',
    fontSize: 48,
    fontWeight: 'bold',
  },
  riskScoreLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  riskLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  riskMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  riskMetric: {
    width: (width - 60) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  riskMetricLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  riskMetricValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  riskFactorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  predictionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTimeframe: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  predictionDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionDirectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  predictionReasoning: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 12,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});

export default PortfolioAnalyticsDashboard;
