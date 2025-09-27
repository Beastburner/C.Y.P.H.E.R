import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import AdvancedAnalyticsService, {
  PerformanceMetrics,
  AssetAnalytics,
  TransactionAnalytics,
  RiskAnalytics,
  PredictiveInsights,
  PortfolioSnapshot
} from '../../services/advancedAnalyticsService';

interface AnalyticsDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

const { width } = Dimensions.get('window');

// Simple line chart component
const MiniChart: React.FC<{
  data: number[];
  positive: boolean;
  width: number;
  height: number;
}> = ({ data, positive, width, height }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={{ width, height }}>
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        <polyline
          points={points}
          fill="none"
          stroke={positive ? '#10B981' : '#EF4444'}
          strokeWidth="2"
        />
      </svg>
    </View>
  );
};

/**
 * CYPHER Advanced Analytics Dashboard
 * Comprehensive portfolio analytics with performance metrics, risk analysis, and predictive insights
 * Features: Real-time metrics, advanced charts, risk management, AI-powered recommendations
 */
const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'risk' | 'insights'>('overview');
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [loading, setLoading] = useState(false);
  
  // Analytics data state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [transactionAnalytics, setTransactionAnalytics] = useState<TransactionAnalytics | null>(null);
  const [riskAnalytics, setRiskAnalytics] = useState<RiskAnalytics | null>(null);
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsights | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioSnapshot[]>([]);
  const [assetAnalytics, setAssetAnalytics] = useState<{ [key: string]: AssetAnalytics }>({});

  const analyticsService = AdvancedAnalyticsService.getInstance();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    loadPortfolioHistory();
  }, [timeframe]);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);
      
      // Initialize analytics service
      await analyticsService.initialize('0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E');
      
      // Load all analytics data
      const [performance, transactions, risk, insights] = await Promise.all([
        analyticsService.getPerformanceMetrics(),
        analyticsService.getTransactionAnalytics(),
        analyticsService.getRiskAnalytics(),
        analyticsService.getPredictiveInsights()
      ]);

      setPerformanceMetrics(performance);
      setTransactionAnalytics(transactions);
      setRiskAnalytics(risk);
      setPredictiveInsights(insights);

      // Load asset analytics for major assets
      const assets = ['ETH', 'BTC', 'USDC', 'LINK'];
      const assetData: { [key: string]: AssetAnalytics } = {};
      
      for (const asset of assets) {
        assetData[asset] = await analyticsService.getAssetAnalytics(asset);
      }
      
      setAssetAnalytics(assetData);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioHistory = () => {
    const history = analyticsService.getPortfolioHistory(timeframe);
    setPortfolioHistory(history);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? colors.success : colors.error;
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return colors.success;
    if (score <= 60) return colors.warning;
    return colors.error;
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'Low';
    if (score <= 60) return 'Medium';
    return 'High';
  };

  const cardStyle = createCardStyle('elevated');

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Portfolio Performance Summary */}
      <View style={[cardStyle, styles.summaryCard]}>
        <Text style={styles.cardTitle}>Portfolio Performance</Text>
        
        {performanceMetrics && (
          <>
            <View style={styles.performanceHeader}>
              <View>
                <Text style={styles.portfolioValue}>
                  {formatCurrency(portfolioHistory[portfolioHistory.length - 1]?.totalValue || 0)}
                </Text>
                <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
              </View>
              
              <View style={styles.performanceChange}>
                <Text style={[styles.changeValue, { color: getChangeColor(performanceMetrics.dayChangePercentage) }]}>
                  {formatPercentage(performanceMetrics.dayChangePercentage)}
                </Text>
                <Text style={styles.changeLabel}>24h Change</Text>
              </View>
            </View>

            <View style={styles.performanceGrid}>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {formatPercentage(performanceMetrics.weekChangePercentage)}
                </Text>
                <Text style={styles.performanceLabel}>7D</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {formatPercentage(performanceMetrics.monthChangePercentage)}
                </Text>
                <Text style={styles.performanceLabel}>30D</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {formatPercentage(performanceMetrics.yearChangePercentage)}
                </Text>
                <Text style={styles.performanceLabel}>1Y</Text>
              </View>
              <View style={styles.performanceItem}>
                <Text style={styles.performanceValue}>
                  {formatPercentage(performanceMetrics.totalReturnPercentage)}
                </Text>
                <Text style={styles.performanceLabel}>All Time</Text>
              </View>
            </View>

            {/* Portfolio Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.timeframeSelector}>
                {(['1d', '7d', '30d', '90d', '1y', 'all'] as const).map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={[styles.timeframeButton, timeframe === period && styles.activeTimeframe]}
                    onPress={() => setTimeframe(period)}
                  >
                    <Text style={[
                      styles.timeframeText,
                      timeframe === period && styles.activeTimeframeText
                    ]}>
                      {period.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {portfolioHistory.length > 1 && (
                <MiniChart
                  data={portfolioHistory.map(h => h.totalValue)}
                  positive={performanceMetrics.dayChangePercentage >= 0}
                  width={width - 80}
                  height={120}
                />
              )}
            </View>
          </>
        )}
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        {performanceMetrics && (
          <>
            <View style={[cardStyle, styles.metricCard]}>
              <Text style={styles.metricLabel}>Volatility</Text>
              <Text style={styles.metricValue}>{performanceMetrics.volatility.toFixed(1)}%</Text>
              <Text style={styles.metricSubtext}>Annualized</Text>
            </View>
            
            <View style={[cardStyle, styles.metricCard]}>
              <Text style={styles.metricLabel}>Sharpe Ratio</Text>
              <Text style={styles.metricValue}>{performanceMetrics.sharpeRatio.toFixed(2)}</Text>
              <Text style={styles.metricSubtext}>Risk-adjusted return</Text>
            </View>
            
            <View style={[cardStyle, styles.metricCard]}>
              <Text style={styles.metricLabel}>Max Drawdown</Text>
              <Text style={[styles.metricValue, { color: colors.error }]}>
                -{performanceMetrics.maxDrawdown.toFixed(1)}%
              </Text>
              <Text style={styles.metricSubtext}>Worst decline</Text>
            </View>
            
            <View style={[cardStyle, styles.metricCard]}>
              <Text style={styles.metricLabel}>Win Rate</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {performanceMetrics.winRate.toFixed(1)}%
              </Text>
              <Text style={styles.metricSubtext}>Profitable periods</Text>
            </View>
          </>
        )}
      </View>

      {/* Top Assets Performance */}
      <View style={[cardStyle, styles.assetsCard]}>
        <Text style={styles.cardTitle}>Top Assets Performance</Text>
        
        {Object.entries(assetAnalytics).slice(0, 4).map(([symbol, analytics]) => (
          <View key={symbol} style={styles.assetRow}>
            <View style={styles.assetInfo}>
              <Text style={styles.assetSymbol}>{symbol}</Text>
              <Text style={styles.assetPrice}>{formatCurrency(analytics.currentPrice)}</Text>
            </View>
            
            <View style={styles.assetMetrics}>
              <Text style={[
                styles.assetChange,
                { color: getChangeColor(analytics.priceChangePercentage24h) }
              ]}>
                {formatPercentage(analytics.priceChangePercentage24h)}
              </Text>
              
              <View style={styles.assetIndicators}>
                <View style={[
                  styles.rsiIndicator,
                  { 
                    backgroundColor: analytics.technicalIndicators.rsi > 70 ? colors.error : 
                                   analytics.technicalIndicators.rsi < 30 ? colors.success : colors.warning
                  }
                ]}>
                  <Text style={styles.rsiText}>RSI {analytics.technicalIndicators.rsi.toFixed(0)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={[cardStyle, styles.actionsCard]}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('risk')}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionText}>Risk Analysis</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('insights')}
          >
            <Text style={styles.actionIcon}>🔮</Text>
            <Text style={styles.actionText}>AI Insights</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onNavigate('DeFi')}
          >
            <Text style={styles.actionIcon}>🌾</Text>
            <Text style={styles.actionText}>DeFi Opportunities</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => alert('Export coming soon!')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Export Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Advanced Performance Metrics */}
      {performanceMetrics && (
        <View style={[cardStyle, styles.performanceCard]}>
          <Text style={styles.cardTitle}>Advanced Performance Metrics</Text>
          
          <View style={styles.advancedMetrics}>
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>All-Time High</Text>
              <Text style={styles.metricRowValue}>{formatCurrency(performanceMetrics.allTimeHigh)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>All-Time Low</Text>
              <Text style={styles.metricRowValue}>{formatCurrency(performanceMetrics.allTimeLow)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Total Return</Text>
              <Text style={[
                styles.metricRowValue,
                { color: getChangeColor(performanceMetrics.totalReturn) }
              ]}>
                {formatCurrency(performanceMetrics.totalReturn)}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Annualized Volatility</Text>
              <Text style={styles.metricRowValue}>{performanceMetrics.volatility.toFixed(2)}%</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricRowLabel}>Sharpe Ratio</Text>
              <Text style={[
                styles.metricRowValue,
                { color: performanceMetrics.sharpeRatio > 1 ? colors.success : colors.warning }
              ]}>
                {performanceMetrics.sharpeRatio.toFixed(3)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Transaction Analytics */}
      {transactionAnalytics && (
        <View style={[cardStyle, styles.transactionCard]}>
          <Text style={styles.cardTitle}>Transaction Analytics</Text>
          
          <View style={styles.transactionGrid}>
            <View style={styles.transactionStat}>
              <Text style={styles.transactionStatValue}>{transactionAnalytics.totalTransactions}</Text>
              <Text style={styles.transactionStatLabel}>Total Transactions</Text>
            </View>
            
            <View style={styles.transactionStat}>
              <Text style={styles.transactionStatValue}>
                {formatCurrency(transactionAnalytics.totalVolume)}
              </Text>
              <Text style={styles.transactionStatLabel}>Total Volume</Text>
            </View>
            
            <View style={styles.transactionStat}>
              <Text style={styles.transactionStatValue}>
                {formatCurrency(transactionAnalytics.totalGasFees)}
              </Text>
              <Text style={styles.transactionStatLabel}>Gas Fees Paid</Text>
            </View>
            
            <View style={styles.transactionStat}>
              <Text style={[styles.transactionStatValue, { color: colors.success }]}>
                {transactionAnalytics.successRate.toFixed(1)}%
              </Text>
              <Text style={styles.transactionStatLabel}>Success Rate</Text>
            </View>
          </View>

          {/* Transaction Types */}
          <View style={styles.transactionTypes}>
            <Text style={styles.sectionTitle}>Transaction Types</Text>
            {Object.entries(transactionAnalytics.transactionTypes).map(([type, count]) => (
              <View key={type} style={styles.transactionTypeRow}>
                <Text style={styles.transactionTypeLabel}>{type}</Text>
                <Text style={styles.transactionTypeValue}>{count}</Text>
              </View>
            ))}
          </View>

          {/* Most Used Tokens */}
          <View style={styles.mostUsedTokens}>
            <Text style={styles.sectionTitle}>Most Used Tokens</Text>
            {transactionAnalytics.mostUsedTokens.map((token, index) => (
              <View key={index} style={styles.tokenRow}>
                <Text style={styles.tokenSymbol}>{token.symbol}</Text>
                <View style={styles.tokenStats}>
                  <Text style={styles.tokenCount}>{token.count} txs</Text>
                  <Text style={styles.tokenVolume}>{formatCurrency(token.volume)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderRiskTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {riskAnalytics && (
        <>
          {/* Overall Risk Score */}
          <View style={[cardStyle, styles.riskOverviewCard]}>
            <Text style={styles.cardTitle}>Risk Assessment</Text>
            
            <View style={styles.riskScoreContainer}>
              <View style={styles.riskScoreCircle}>
                <Text style={[styles.riskScore, { color: getRiskColor(riskAnalytics.overallRiskScore) }]}>
                  {riskAnalytics.overallRiskScore.toFixed(0)}
                </Text>
                <Text style={styles.riskScoreLabel}>Risk Score</Text>
              </View>
              
              <View style={styles.riskLevel}>
                <Text style={[styles.riskLevelText, { color: getRiskColor(riskAnalytics.overallRiskScore) }]}>
                  {getRiskLevel(riskAnalytics.overallRiskScore)} Risk
                </Text>
                <Text style={styles.riskDescription}>
                  {riskAnalytics.overallRiskScore <= 30 ? 'Conservative portfolio with low volatility' :
                   riskAnalytics.overallRiskScore <= 60 ? 'Balanced risk-reward profile' :
                   'High-risk portfolio with potential for large gains/losses'}
                </Text>
              </View>
            </View>
          </View>

          {/* Risk Breakdown */}
          <View style={[cardStyle, styles.riskBreakdownCard]}>
            <Text style={styles.cardTitle}>Risk Breakdown</Text>
            
            <View style={styles.riskMetrics}>
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Diversification</Text>
                <View style={styles.riskBar}>
                  <View 
                    style={[styles.riskBarFill, { 
                      width: `${riskAnalytics.diversificationScore}%`,
                      backgroundColor: colors.success
                    }]} 
                  />
                </View>
                <Text style={styles.riskMetricValue}>{riskAnalytics.diversificationScore.toFixed(0)}%</Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Concentration Risk</Text>
                <View style={styles.riskBar}>
                  <View 
                    style={[styles.riskBarFill, { 
                      width: `${riskAnalytics.concentrationRisk}%`,
                      backgroundColor: getRiskColor(riskAnalytics.concentrationRisk)
                    }]} 
                  />
                </View>
                <Text style={styles.riskMetricValue}>{riskAnalytics.concentrationRisk.toFixed(0)}%</Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Liquidity Risk</Text>
                <View style={styles.riskBar}>
                  <View 
                    style={[styles.riskBarFill, { 
                      width: `${riskAnalytics.liquidityRisk}%`,
                      backgroundColor: getRiskColor(riskAnalytics.liquidityRisk)
                    }]} 
                  />
                </View>
                <Text style={styles.riskMetricValue}>{riskAnalytics.liquidityRisk.toFixed(0)}%</Text>
              </View>
              
              <View style={styles.riskMetric}>
                <Text style={styles.riskMetricLabel}>Smart Contract Risk</Text>
                <View style={styles.riskBar}>
                  <View 
                    style={[styles.riskBarFill, { 
                      width: `${riskAnalytics.smartContractRisk}%`,
                      backgroundColor: getRiskColor(riskAnalytics.smartContractRisk)
                    }]} 
                  />
                </View>
                <Text style={styles.riskMetricValue}>{riskAnalytics.smartContractRisk.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          {/* Value at Risk */}
          <View style={[cardStyle, styles.varCard]}>
            <Text style={styles.cardTitle}>Value at Risk (95% Confidence)</Text>
            
            <View style={styles.varMetrics}>
              <View style={styles.varItem}>
                <Text style={styles.varLabel}>1 Day</Text>
                <Text style={[styles.varValue, { color: colors.error }]}>
                  {formatCurrency(riskAnalytics.valueAtRisk['1d'])}
                </Text>
              </View>
              
              <View style={styles.varItem}>
                <Text style={styles.varLabel}>7 Days</Text>
                <Text style={[styles.varValue, { color: colors.error }]}>
                  {formatCurrency(riskAnalytics.valueAtRisk['7d'])}
                </Text>
              </View>
              
              <View style={styles.varItem}>
                <Text style={styles.varLabel}>30 Days</Text>
                <Text style={[styles.varValue, { color: colors.error }]}>
                  {formatCurrency(riskAnalytics.valueAtRisk['30d'])}
                </Text>
              </View>
            </View>
          </View>

          {/* Risk Factors */}
          <View style={[cardStyle, styles.riskFactorsCard]}>
            <Text style={styles.cardTitle}>Risk Factors & Recommendations</Text>
            
            {riskAnalytics.riskFactors.map((factor, index) => (
              <View key={index} style={styles.riskFactor}>
                <View style={styles.riskFactorHeader}>
                  <Text style={styles.riskFactorName}>{factor.factor}</Text>
                  <Text style={[styles.riskFactorScore, { color: getRiskColor(factor.score) }]}>
                    {factor.score.toFixed(0)}
                  </Text>
                </View>
                <Text style={styles.riskFactorDescription}>{factor.description}</Text>
                <Text style={styles.riskFactorRecommendation}>💡 {factor.recommendation}</Text>
              </View>
            ))}
          </View>

          {/* Stress Test Results */}
          <View style={[cardStyle, styles.stressTestCard]}>
            <Text style={styles.cardTitle}>Stress Test Scenarios</Text>
            
            {riskAnalytics.stressTestResults.map((scenario, index) => (
              <View key={index} style={styles.stressTestRow}>
                <View style={styles.stressTestInfo}>
                  <Text style={styles.stressTestScenario}>{scenario.scenario}</Text>
                  <Text style={styles.stressTestProbability}>
                    Probability: {(scenario.probability * 100).toFixed(1)}%
                  </Text>
                </View>
                <Text style={[styles.stressTestImpact, { color: colors.error }]}>
                  {scenario.portfolioImpact > 0 ? '+' : ''}{scenario.portfolioImpact.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {predictiveInsights && (
        <>
          {/* Opportunity Alerts */}
          <View style={[cardStyle, styles.alertsCard]}>
            <Text style={styles.cardTitle}>🚨 Opportunity Alerts</Text>
            
            {predictiveInsights.opportunityAlerts.map((alert) => (
              <View key={alert.id} style={styles.alert}>
                <View style={styles.alertHeader}>
                  <View style={[styles.alertType, { 
                    backgroundColor: alert.type === 'buy' ? colors.success + '20' : 
                                   alert.type === 'sell' ? colors.error + '20' : colors.warning + '20' 
                  }]}>
                    <Text style={[styles.alertTypeText, {
                      color: alert.type === 'buy' ? colors.success : 
                             alert.type === 'sell' ? colors.error : colors.warning
                    }]}>
                      {alert.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.alertAsset}>{alert.asset}</Text>
                </View>
                
                <Text style={styles.alertReason}>{alert.reason}</Text>
                
                <View style={styles.alertMetrics}>
                  <Text style={styles.alertConfidence}>
                    Confidence: {(alert.confidence * 100).toFixed(0)}%
                  </Text>
                  <Text style={styles.alertImpact}>
                    Impact: +{alert.impact}%
                  </Text>
                  <Text style={styles.alertTimeframe}>
                    Timeframe: {alert.timeframe}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Market Trends */}
          <View style={[cardStyle, styles.trendsCard]}>
            <Text style={styles.cardTitle}>📈 Market Trends</Text>
            
            {predictiveInsights.marketTrends.map((trend, index) => (
              <View key={index} style={styles.trend}>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendName}>{trend.trend}</Text>
                  <View style={styles.trendStrength}>
                    <View style={styles.trendStrengthBar}>
                      <View 
                        style={[styles.trendStrengthFill, { 
                          width: `${trend.strength * 100}%`,
                          backgroundColor: colors.success
                        }]} 
                      />
                    </View>
                    <Text style={styles.trendStrengthText}>
                      {(trend.strength * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.trendDuration}>Duration: {trend.duration}</Text>
                
                <View style={styles.trendAssets}>
                  <Text style={styles.trendAssetsLabel}>Relevant Assets:</Text>
                  <View style={styles.trendAssetsList}>
                    {trend.relevantAssets.map((asset, i) => (
                      <View key={i} style={styles.trendAssetChip}>
                        <Text style={styles.trendAssetText}>{asset}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Portfolio Projections */}
          <View style={[cardStyle, styles.projectionsCard]}>
            <Text style={styles.cardTitle}>🔮 Portfolio Projections</Text>
            
            {predictiveInsights.portfolioProjections.map((projection, index) => (
              <View key={index} style={styles.projection}>
                <View style={styles.projectionHeader}>
                  <Text style={styles.projectionTimeframe}>{projection.timeframe}</Text>
                  <Text style={styles.projectionValue}>
                    {formatCurrency(projection.projectedValue)}
                  </Text>
                </View>
                
                <View style={styles.projectionDetails}>
                  <Text style={styles.projectionConfidence}>
                    Confidence: {(projection.confidence * 100).toFixed(0)}%
                  </Text>
                  
                  <View style={styles.projectionFactors}>
                    <Text style={styles.projectionFactorsLabel}>Key Factors:</Text>
                    {projection.factors.map((factor, i) => (
                      <Text key={i} style={styles.projectionFactor}>• {factor}</Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Price Forecasts */}
          <View style={[cardStyle, styles.forecastsCard]}>
            <Text style={styles.cardTitle}>💰 Price Forecasts</Text>
            
            {predictiveInsights.priceForecasts.slice(0, 3).map((forecast) => (
              <View key={forecast.symbol} style={styles.forecast}>
                <View style={styles.forecastHeader}>
                  <Text style={styles.forecastSymbol}>{forecast.symbol}</Text>
                  <Text style={styles.forecastCurrentPrice}>
                    {formatCurrency(forecast.currentPrice)}
                  </Text>
                </View>
                
                <View style={styles.forecastPredictions}>
                  {forecast.predictions.map((prediction) => (
                    <View key={prediction.timeframe} style={styles.forecastPrediction}>
                      <Text style={styles.forecastTimeframe}>{prediction.timeframe}</Text>
                      <Text style={styles.forecastPrice}>
                        {formatCurrency(prediction.predictedPrice)}
                      </Text>
                      <Text style={styles.forecastConfidence}>
                        {(prediction.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

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
            📊 Analytics Hub
          </Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={initializeAnalytics}
            disabled={loading}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Advanced portfolio analytics and insights
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'performance', 'risk', 'insights'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'risk' && renderRiskTab()}
        {activeTab === 'insights' && renderInsightsTab()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
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
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Card Styles
  summaryCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  portfolioLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  performanceChange: {
    alignItems: 'flex-end',
  },
  changeValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  activeTimeframe: {
    backgroundColor: '#3B82F6',
  },
  timeframeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeTimeframeText: {
    color: '#FFFFFF',
  },
  
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 56) / 2,
    alignItems: 'center',
    paddingVertical: 20,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748B',
  },
  
  // Assets Performance
  assetsCard: {
    marginBottom: 16,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  assetPrice: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  assetMetrics: {
    alignItems: 'flex-end',
  },
  assetChange: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  assetIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  rsiIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rsiText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Actions
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 56) / 2,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  
  // Performance Tab
  performanceCard: {
    marginBottom: 16,
  },
  advancedMetrics: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricRowLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  metricRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  
  // Transaction Analytics
  transactionCard: {
    marginBottom: 16,
  },
  transactionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  transactionStat: {
    width: (width - 56) / 2,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  transactionStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  transactionStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  transactionTypes: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  transactionTypeLabel: {
    fontSize: 14,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  transactionTypeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  mostUsedTokens: {},
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  tokenStats: {
    alignItems: 'flex-end',
  },
  tokenCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tokenVolume: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  
  // Risk Tab
  riskOverviewCard: {
    marginBottom: 16,
  },
  riskScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  riskScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskScore: {
    fontSize: 28,
    fontWeight: '700',
  },
  riskScoreLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  riskLevel: {
    flex: 1,
  },
  riskLevelText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  riskDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  riskBreakdownCard: {
    marginBottom: 16,
  },
  riskMetrics: {
    gap: 16,
  },
  riskMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskMetricLabel: {
    fontSize: 14,
    color: '#94A3B8',
    width: 120,
  },
  riskBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskMetricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    width: 40,
    textAlign: 'right',
  },
  varCard: {
    marginBottom: 16,
  },
  varMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  varItem: {
    alignItems: 'center',
  },
  varLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  varValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskFactorsCard: {
    marginBottom: 16,
  },
  riskFactor: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  riskFactorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  riskFactorScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskFactorDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
  },
  riskFactorRecommendation: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  stressTestCard: {
    marginBottom: 16,
  },
  stressTestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  stressTestInfo: {
    flex: 1,
  },
  stressTestScenario: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  stressTestProbability: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stressTestImpact: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Insights Tab
  alertsCard: {
    marginBottom: 16,
  },
  alert: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  alertType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertAsset: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  alertReason: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 8,
  },
  alertMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  alertConfidence: {
    fontSize: 12,
    color: '#94A3B8',
  },
  alertImpact: {
    fontSize: 12,
    color: '#10B981',
  },
  alertTimeframe: {
    fontSize: 12,
    color: '#94A3B8',
  },
  trendsCard: {
    marginBottom: 16,
  },
  trend: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    flex: 1,
  },
  trendStrength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendStrengthBar: {
    width: 60,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
  },
  trendStrengthFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendStrengthText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  trendDuration: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  trendAssets: {
    marginTop: 8,
  },
  trendAssetsLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  trendAssetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trendAssetChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendAssetText: {
    fontSize: 10,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  projectionsCard: {
    marginBottom: 16,
  },
  projection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  projectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectionTimeframe: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  projectionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  projectionDetails: {
    gap: 8,
  },
  projectionConfidence: {
    fontSize: 12,
    color: '#94A3B8',
  },
  projectionFactors: {},
  projectionFactorsLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  projectionFactor: {
    fontSize: 12,
    color: '#E2E8F0',
    marginLeft: 8,
  },
  forecastsCard: {
    marginBottom: 16,
  },
  forecast: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  forecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forecastSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  forecastCurrentPrice: {
    fontSize: 14,
    color: '#94A3B8',
  },
  forecastPredictions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forecastPrediction: {
    alignItems: 'center',
  },
  forecastTimeframe: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 4,
  },
  forecastPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  forecastConfidence: {
    fontSize: 10,
    color: '#3B82F6',
  },
});

export default AnalyticsDashboard;
