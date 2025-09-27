/**
 * CYPHER AI Insights Dashboard
 * Revolutionary AI-powered market analysis and intelligent recommendations
 * Features: Real-time sentiment, price predictions, trading signals, market anomalies
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import CypherDesignSystem from '../../styles/CypherDesignSystem';
import AIAnalyticsService, {
  MarketSentiment,
  PricePrediction,
  TradingSignal,
  MarketInsight,
  PortfolioRecommendation,
  MarketAnomaly,
  AIModelPerformance
} from '../../services/AIAnalyticsService';

const { width } = Dimensions.get('window');

interface AIInsightsDashboardProps {
  navigation: any;
  route: any;
}

export default function AIInsightsDashboard({ navigation, route }: AIInsightsDashboardProps) {
  const { colors, spacing, typography } = CypherDesignSystem;
  
  const [activeTab, setActiveTab] = useState<'insights' | 'signals' | 'predictions' | 'sentiment'>('insights');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // AI Data State
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [pricePredictions, setPricePredictions] = useState<PricePrediction[]>([]);
  const [marketSentiment, setMarketSentiment] = useState<MarketSentiment[]>([]);
  const [portfolioRecommendations, setPortfolioRecommendations] = useState<PortfolioRecommendation[]>([]);
  const [marketAnomalies, setMarketAnomalies] = useState<MarketAnomaly[]>([]);
  const [modelPerformance, setModelPerformance] = useState<AIModelPerformance[]>([]);

  const aiService = AIAnalyticsService.getInstance();

  useEffect(() => {
    loadAIData();
    const interval = setInterval(loadAIData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAIData = async () => {
    try {
      const insights = aiService.getMarketInsights();
      const signals = aiService.getTradingSignals();
      const predictions = aiService.getPricePredictions();
      const sentiment = aiService.getMarketSentiment();
      const recommendations = aiService.getPortfolioRecommendations();
      const anomalies = aiService.getMarketAnomalies();
      const performance = aiService.getModelPerformance();

      setMarketInsights(insights);
      setTradingSignals(signals);
      setPricePredictions(predictions);
      setMarketSentiment(sentiment);
      setPortfolioRecommendations(recommendations);
      setMarketAnomalies(anomalies);
      setModelPerformance(performance);
    } catch (error) {
      console.error('Failed to load AI data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIData();
  };

  const handleSignalAction = async (signalId: string, action: 'use' | 'dismiss') => {
    try {
      if (action === 'use') {
        await aiService.markSignalAsUsed(signalId);
        Alert.alert(
          'Signal Applied',
          'Trading signal has been marked as used. Consider executing the recommended trade.',
          [
            {
              text: 'Open Trading',
              onPress: () => navigation.navigate('TradingDashboard')
            },
            { text: 'OK' }
          ]
        );
      }
      loadAIData();
    } catch (error) {
      console.error('Failed to handle signal action:', error);
    }
  };

  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment) {
      case 'bullish': return colors.success;
      case 'bearish': return colors.error;
      default: return colors.warning;
    }
  };

  const getSignalColor = (signalType: string): string => {
    switch (signalType) {
      case 'buy': return colors.success;
      case 'sell': return colors.error;
      default: return colors.warning;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const renderInsightsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Portfolio Recommendations */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          🎯 Portfolio Recommendations
        </Text>
        
        {portfolioRecommendations.slice(0, 3).map((rec) => (
          <View key={rec.id} style={[styles.recommendationCard, { backgroundColor: colors.backgroundTertiary, borderLeftColor: getPriorityColor(rec.priority) }]}>
            <View style={styles.recommendationHeader}>
              <Text style={[styles.recommendationTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
                {rec.type.replace('_', ' ').toUpperCase()}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(rec.priority) }]}>
                <Text style={[styles.priorityText, { fontSize: typography.fontSize.xs }]}>
                  {rec.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.recommendationDescription, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
              {rec.description}
            </Text>
            
            <View style={styles.impactMetrics}>
              <View style={styles.impactItem}>
                <Text style={[styles.impactLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Risk Reduction
                </Text>
                <Text style={[styles.impactValue, { color: colors.success, fontSize: typography.fontSize.sm }]}>
                  {formatPercentage(rec.expected_impact.risk_reduction)}
                </Text>
              </View>
              <View style={styles.impactItem}>
                <Text style={[styles.impactLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Return Potential
                </Text>
                <Text style={[styles.impactValue, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  {formatPercentage(rec.expected_impact.return_potential)}
                </Text>
              </View>
            </View>
            
            <View style={styles.recommendationActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('PortfolioStrategyManager')}
              >
                <Text style={[styles.actionButtonText, { fontSize: typography.fontSize.sm }]}>
                  Apply Recommendation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Market Insights */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          💡 Market Insights
        </Text>
        
        {marketInsights.slice(0, 5).map((insight) => (
          <View key={insight.id} style={[styles.insightCard, { backgroundColor: colors.backgroundTertiary }]}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
                {insight.title}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
                <Text style={[styles.categoryText, { fontSize: typography.fontSize.xs }]}>
                  {insight.category.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.insightDescription, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
              {insight.description}
            </Text>
            
            <View style={styles.insightMetrics}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Impact Score
                </Text>
                <Text style={[styles.metricValue, { color: colors.warning, fontSize: typography.fontSize.sm }]}>
                  {insight.impact_score.toFixed(1)}/10
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={[styles.metricLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Relevance
                </Text>
                <Text style={[styles.metricValue, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  {insight.relevance_score.toFixed(1)}/10
                </Text>
              </View>
            </View>
            
            {insight.actionable && (
              <View style={styles.actionableActions}>
                <Text style={[styles.actionableLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Recommended Actions:
                </Text>
                {insight.recommended_actions.slice(0, 2).map((action, index) => (
                  <Text key={index} style={[styles.actionItem, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                    • {action}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Market Anomalies */}
      {marketAnomalies.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
            ⚠️ Market Anomalies
          </Text>
          
          {marketAnomalies.slice(0, 3).map((anomaly) => (
            <View key={anomaly.id} style={[styles.anomalyCard, { backgroundColor: colors.backgroundTertiary, borderLeftColor: colors.error }]}>
              <View style={styles.anomalyHeader}>
                <Text style={[styles.anomalyTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
                  {anomaly.type.replace('_', ' ').toUpperCase()} - {anomaly.symbol}
                </Text>
                <View style={[styles.severityBadge, { backgroundColor: colors.error }]}>
                  <Text style={[styles.severityText, { fontSize: typography.fontSize.xs }]}>
                    {anomaly.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.anomalyDescription, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                {anomaly.description}
              </Text>
              
              <View style={styles.anomalyMetrics}>
                <Text style={[styles.anomalyMetric, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Deviation: {anomaly.metrics.deviation_from_norm.toFixed(1)}σ
                </Text>
                <Text style={[styles.anomalyMetric, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                  Z-Score: {anomaly.metrics.z_score.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderSignalsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          📊 Active Trading Signals ({tradingSignals.length})
        </Text>
        
        {tradingSignals.map((signal) => (
          <View key={signal.id} style={[styles.signalCard, { backgroundColor: colors.backgroundTertiary, borderLeftColor: getSignalColor(signal.type) }]}>
            <View style={styles.signalHeader}>
              <View>
                <Text style={[styles.signalSymbol, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
                  {signal.symbol}
                </Text>
                <Text style={[styles.signalType, { color: getSignalColor(signal.type), fontSize: typography.fontSize.sm }]}>
                  {signal.type.toUpperCase()} • {signal.strength.toUpperCase()}
                </Text>
              </View>
              <View style={styles.signalMetrics}>
                <Text style={[styles.confidenceText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Confidence
                </Text>
                <Text style={[styles.confidenceValue, { color: colors.primary, fontSize: typography.fontSize.md }]}>
                  {(signal.confidence * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.signalPrices}>
              <View style={styles.priceItem}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Entry
                </Text>
                <Text style={[styles.priceValue, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                  {formatPrice(signal.entry_price)}
                </Text>
              </View>
              {signal.target_price && (
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                    Target
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.success, fontSize: typography.fontSize.sm }]}>
                    {formatPrice(signal.target_price)}
                  </Text>
                </View>
              )}
              {signal.stop_loss && (
                <View style={styles.priceItem}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                    Stop Loss
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.error, fontSize: typography.fontSize.sm }]}>
                    {formatPrice(signal.stop_loss)}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.signalReasoning}>
              <Text style={[styles.reasoningLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Reasoning:
              </Text>
              {signal.reasoning.slice(0, 2).map((reason, index) => (
                <Text key={index} style={[styles.reasoningItem, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                  • {reason}
                </Text>
              ))}
            </View>
            
            <View style={styles.signalActions}>
              <TouchableOpacity
                style={[styles.signalActionButton, { backgroundColor: colors.success }]}
                onPress={() => handleSignalAction(signal.id, 'use')}
              >
                <Text style={[styles.signalActionText, { fontSize: typography.fontSize.sm }]}>
                  Use Signal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.signalActionButton, { backgroundColor: colors.textTertiary }]}
                onPress={() => handleSignalAction(signal.id, 'dismiss')}
              >
                <Text style={[styles.signalActionText, { fontSize: typography.fontSize.sm }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderPredictionsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          🔮 Price Predictions
        </Text>
        
        {pricePredictions.map((prediction) => (
          <View key={prediction.symbol} style={[styles.predictionCard, { backgroundColor: colors.backgroundTertiary }]}>
            <View style={styles.predictionHeader}>
              <Text style={[styles.predictionSymbol, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
                {prediction.symbol}
              </Text>
              <Text style={[styles.currentPrice, { color: colors.textSecondary, fontSize: typography.fontSize.md }]}>
                Current: {formatPrice(prediction.current_price)}
              </Text>
            </View>
            
            <View style={styles.predictionTimelines}>
              {prediction.predictions.map((pred, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineHeader}>
                    <Text style={[styles.timeframe, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                      {pred.timeframe}
                    </Text>
                    <Text style={[styles.confidence, { color: colors.primary, fontSize: typography.fontSize.xs }]}>
                      {(pred.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>
                  
                  <View style={styles.predictionDetails}>
                    <Text style={[
                      styles.predictedPrice,
                      {
                        color: pred.predicted_price > prediction.current_price ? colors.success : colors.error,
                        fontSize: typography.fontSize.md
                      }
                    ]}>
                      {formatPrice(pred.predicted_price)}
                    </Text>
                    <Text style={[
                      styles.priceChange,
                      {
                        color: pred.predicted_price > prediction.current_price ? colors.success : colors.error,
                        fontSize: typography.fontSize.sm
                      }
                    ]}>
                      {formatPercentage(((pred.predicted_price - prediction.current_price) / prediction.current_price) * 100)}
                    </Text>
                  </View>
                  
                  <View style={styles.supportResistance}>
                    <View style={styles.levelGroup}>
                      <Text style={[styles.levelLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                        Support
                      </Text>
                      <Text style={[styles.levelValue, { color: colors.success, fontSize: typography.fontSize.xs }]}>
                        {formatPrice(pred.support_levels[0])}
                      </Text>
                    </View>
                    <View style={styles.levelGroup}>
                      <Text style={[styles.levelLabel, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                        Resistance
                      </Text>
                      <Text style={[styles.levelValue, { color: colors.error, fontSize: typography.fontSize.xs }]}>
                        {formatPrice(pred.resistance_levels[0])}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={styles.modelAccuracy}>
              <Text style={[styles.accuracyLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Model Accuracy: 
              </Text>
              <Text style={[styles.accuracyValue, { color: colors.primary, fontSize: typography.fontSize.xs }]}>
                {(prediction.model_accuracy * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSentimentTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          💭 Market Sentiment Analysis
        </Text>
        
        {marketSentiment.map((sentiment) => (
          <View key={sentiment.symbol} style={[styles.sentimentCard, { backgroundColor: colors.backgroundTertiary, borderLeftColor: getSentimentColor(sentiment.sentiment) }]}>
            <View style={styles.sentimentHeader}>
              <Text style={[styles.sentimentSymbol, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
                {sentiment.symbol}
              </Text>
              <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor(sentiment.sentiment) }]}>
                <Text style={[styles.sentimentLabel, { fontSize: typography.fontSize.xs }]}>
                  {sentiment.sentiment.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={styles.sentimentScore}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                Sentiment Score
              </Text>
              <Text style={[
                styles.scoreValue,
                {
                  color: sentiment.score > 0 ? colors.success : sentiment.score < 0 ? colors.error : colors.warning,
                  fontSize: typography.fontSize.xl
                }
              ]}>
                {sentiment.score.toFixed(2)}
              </Text>
              <Text style={[styles.confidenceText, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
                Confidence: {(sentiment.confidence * 100).toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.sentimentFactors}>
              <Text style={[styles.factorsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
                Contributing Factors:
              </Text>
              
              {Object.entries(sentiment.factors).map(([factor, value]) => (
                <View key={factor} style={styles.factorItem}>
                  <Text style={[styles.factorName, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                    {factor.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.factorBar}>
                    <View
                      style={[
                        styles.factorFill,
                        {
                          width: `${Math.abs(value) * 50}%`,
                          backgroundColor: value > 0 ? colors.success : colors.error
                        }
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.factorValue,
                    {
                      color: value > 0 ? colors.success : colors.error,
                      fontSize: typography.fontSize.xs
                    }
                  ]}>
                    {value.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.sentimentSources}>
              <Text style={[styles.sourcesLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Data Sources: {sentiment.sources.join(', ')}
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      {/* AI Model Performance */}
      <View style={[styles.section, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          🤖 AI Model Performance
        </Text>
        
        {modelPerformance.map((model) => (
          <View key={model.model_name} style={[styles.modelCard, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.modelName, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
              {model.model_name}
            </Text>
            
            <View style={styles.modelMetrics}>
              <View style={styles.modelMetricItem}>
                <Text style={[styles.modelMetricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Accuracy
                </Text>
                <Text style={[styles.modelMetricValue, { color: colors.success, fontSize: typography.fontSize.sm }]}>
                  {(model.accuracy * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.modelMetricItem}>
                <Text style={[styles.modelMetricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Precision
                </Text>
                <Text style={[styles.modelMetricValue, { color: colors.primary, fontSize: typography.fontSize.sm }]}>
                  {(model.precision * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.modelMetricItem}>
                <Text style={[styles.modelMetricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  F1 Score
                </Text>
                <Text style={[styles.modelMetricValue, { color: colors.warning, fontSize: typography.fontSize.sm }]}>
                  {(model.f1_score * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
            
            <Text style={[styles.modelStats, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
              {model.correct_predictions.toLocaleString()} / {model.total_predictions.toLocaleString()} predictions correct
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: typography.fontSize.md }]}>
          Loading AI Insights...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
          🧠 AI Insights
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={[styles.refreshIcon, { color: colors.primary }]}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={[styles.tabSelector, { backgroundColor: colors.backgroundSecondary }]}>
        {(['insights', 'signals', 'predictions', 'sentiment'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab ? colors.primary : 'transparent',
                borderBottomColor: activeTab === tab ? colors.primary : 'transparent'
              }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabButtonText,
              {
                color: activeTab === tab ? '#FFFFFF' : colors.textSecondary,
                fontSize: typography.fontSize.sm
              }
            ]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'signals' && renderSignalsTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
        {activeTab === 'sentiment' && renderSentimentTab()}
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    marginTop: CypherDesignSystem.spacing.md,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: CypherDesignSystem.spacing.md,
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingTop: 50,
  },
  backButton: {
    padding: CypherDesignSystem.spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  title: {
    fontWeight: '700' as const,
  },
  refreshButton: {
    padding: CypherDesignSystem.spacing.xs,
  },
  refreshIcon: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  tabSelector: {
    flexDirection: 'row' as const,
    paddingHorizontal: CypherDesignSystem.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.md,
    alignItems: 'center' as const,
    borderRadius: 8,
    marginHorizontal: 2,
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: CypherDesignSystem.spacing.md,
  },
  section: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
    marginVertical: CypherDesignSystem.spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  
  // Recommendation Card Styles
  recommendationCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderLeftWidth: 4,
  },
  recommendationHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  recommendationTitle: {
    fontWeight: '700' as const,
  },
  priorityBadge: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  recommendationDescription: {
    marginBottom: CypherDesignSystem.spacing.md,
    lineHeight: 20,
  },
  impactMetrics: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  impactItem: {
    alignItems: 'center' as const,
  },
  impactLabel: {
    marginBottom: 4,
  },
  impactValue: {
    fontWeight: '600' as const,
  },
  recommendationActions: {
    alignItems: 'center' as const,
  },
  actionButton: {
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingHorizontal: CypherDesignSystem.spacing.md,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  
  // Insight Card Styles
  insightCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  insightHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  insightTitle: {
    flex: 1,
    fontWeight: '700' as const,
    marginRight: CypherDesignSystem.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 12,
  },
  categoryText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  insightDescription: {
    marginBottom: CypherDesignSystem.spacing.md,
    lineHeight: 20,
  },
  insightMetrics: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  metricItem: {
    alignItems: 'center' as const,
  },
  metricLabel: {
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: '600' as const,
  },
  actionableActions: {
    marginTop: CypherDesignSystem.spacing.sm,
  },
  actionableLabel: {
    marginBottom: CypherDesignSystem.spacing.xs,
    fontWeight: '500' as const,
  },
  actionItem: {
    marginBottom: 4,
  },
  
  // Signal Card Styles
  signalCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderLeftWidth: 4,
  },
  signalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  signalSymbol: {
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  signalType: {
    fontWeight: '600' as const,
  },
  signalMetrics: {
    alignItems: 'flex-end' as const,
  },
  confidenceText: {
    marginBottom: 4,
  },
  confidenceValue: {
    fontWeight: '700' as const,
  },
  signalPrices: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  priceItem: {
    alignItems: 'center' as const,
  },
  priceLabel: {
    marginBottom: 4,
  },
  priceValue: {
    fontWeight: '600' as const,
  },
  signalReasoning: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  reasoningLabel: {
    marginBottom: CypherDesignSystem.spacing.xs,
    fontWeight: '500' as const,
  },
  reasoningItem: {
    marginBottom: 4,
  },
  signalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  signalActionButton: {
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingHorizontal: CypherDesignSystem.spacing.md,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: CypherDesignSystem.spacing.xs,
    alignItems: 'center' as const,
  },
  signalActionText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  
  // Prediction Card Styles
  predictionCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  predictionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  predictionSymbol: {
    fontWeight: '700' as const,
  },
  currentPrice: {
    fontWeight: '500' as const,
  },
  predictionTimelines: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  timelineItem: {
    marginBottom: CypherDesignSystem.spacing.md,
    paddingBottom: CypherDesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  timelineHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  timeframe: {
    fontWeight: '600' as const,
  },
  confidence: {
    fontWeight: '500' as const,
  },
  predictionDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  predictedPrice: {
    fontWeight: '700' as const,
  },
  priceChange: {
    fontWeight: '600' as const,
  },
  supportResistance: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  levelGroup: {
    alignItems: 'center' as const,
  },
  levelLabel: {
    marginBottom: 4,
  },
  levelValue: {
    fontWeight: '500' as const,
  },
  modelAccuracy: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  accuracyLabel: {
    marginRight: CypherDesignSystem.spacing.xs,
  },
  accuracyValue: {
    fontWeight: '600' as const,
  },
  
  // Sentiment Card Styles
  sentimentCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderLeftWidth: 4,
  },
  sentimentHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  sentimentSymbol: {
    fontWeight: '700' as const,
  },
  sentimentBadge: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 12,
  },
  sentimentLabel: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  sentimentScore: {
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  scoreLabel: {
    marginBottom: CypherDesignSystem.spacing.xs,
  },
  scoreValue: {
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sentimentFactors: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  factorsLabel: {
    marginBottom: CypherDesignSystem.spacing.sm,
    fontWeight: '600' as const,
  },
  factorItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  factorName: {
    width: 120,
    fontWeight: '500' as const,
  },
  factorBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    marginHorizontal: CypherDesignSystem.spacing.sm,
    overflow: 'hidden' as const,
  },
  factorFill: {
    height: '100%' as const,
    borderRadius: 4,
  },
  factorValue: {
    width: 40,
    textAlign: 'right' as const,
    fontWeight: '500' as const,
  },
  sentimentSources: {
    marginTop: CypherDesignSystem.spacing.sm,
    paddingTop: CypherDesignSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sourcesLabel: {
    fontStyle: 'italic' as const,
  },
  
  // Anomaly Card Styles
  anomalyCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderLeftWidth: 4,
  },
  anomalyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  anomalyTitle: {
    flex: 1,
    fontWeight: '700' as const,
    marginRight: CypherDesignSystem.spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 12,
  },
  severityText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  anomalyDescription: {
    marginBottom: CypherDesignSystem.spacing.md,
    lineHeight: 20,
  },
  anomalyMetrics: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  anomalyMetric: {
    fontWeight: '500' as const,
  },
  
  // Model Performance Styles
  modelCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  modelName: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  modelMetrics: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  modelMetricItem: {
    alignItems: 'center' as const,
  },
  modelMetricLabel: {
    marginBottom: 4,
  },
  modelMetricValue: {
    fontWeight: '600' as const,
  },
  modelStats: {
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
};
