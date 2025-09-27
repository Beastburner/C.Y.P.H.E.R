/**
 * ECLIPTA AI Insights Dashboard
 * 
 * Revolutionary AI-powered dashboard showing transaction analysis,
 * fraud detection, behavioral patterns, and market predictions.
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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { aiTransactionAnalyzer, FraudAlert, BehavioralProfile, AIInsights } from '../services/AITransactionAnalyzer';

const { width, height } = Dimensions.get('window');

interface AIMetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onPress?: () => void;
}

const AIMetricCard: React.FC<AIMetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  trend,
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.metricCard, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
      {trend && (
        <Icon 
          name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'} 
          size={16} 
          color={trend === 'up' ? '#4CAF50' : trend === 'down' ? '#FF5722' : '#FFC107'} 
        />
      )}
    </View>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

interface FraudAlertItemProps {
  alert: FraudAlert;
  onAcknowledge: (alertId: string) => void;
}

const FraudAlertItem: React.FC<FraudAlertItemProps> = ({ alert, onAcknowledge }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'danger': return '#FF6B35';
      case 'warning': return '#FFC107';
      case 'info': return '#2196F3';
      default: return '#666666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'warning';
      case 'danger': return 'alert-circle';
      case 'warning': return 'information-circle';
      case 'info': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={[styles.alertItem, { borderLeftColor: getSeverityColor(alert.severity) }]}>
      <View style={styles.alertHeader}>
        <Icon 
          name={getSeverityIcon(alert.severity)} 
          size={20} 
          color={getSeverityColor(alert.severity)} 
        />
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.alertMessage}>{alert.message}</Text>
      
      <View style={styles.alertRisk}>
        <Text style={styles.alertRiskLabel}>Risk Score: </Text>
        <Text style={[styles.alertRiskValue, { color: getSeverityColor(alert.severity) }]}>
          {alert.riskScore}%
        </Text>
      </View>

      {alert.recommendedActions.length > 0 && (
        <View style={styles.alertActions}>
          <Text style={styles.alertActionsTitle}>Recommended Actions:</Text>
          {alert.recommendedActions.slice(0, 2).map((action, index) => (
            <Text key={index} style={styles.alertAction}>• {action}</Text>
          ))}
        </View>
      )}
      
      <View style={styles.alertFooter}>
        <Text style={styles.alertTime}>
          {new Date(alert.timestamp).toLocaleString()}
        </Text>
        
        {!alert.acknowledged && (
          <TouchableOpacity 
            style={styles.acknowledgeButton}
            onPress={() => onAcknowledge(alert.id)}
          >
            <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface BehaviorInsightProps {
  profile: BehavioralProfile;
}

const BehaviorInsight: React.FC<BehaviorInsightProps> = ({ profile }) => (
  <View style={styles.behaviorContainer}>
    <Text style={styles.behaviorTitle}>Behavioral Analysis</Text>
    
    <View style={styles.behaviorMetrics}>
      <View style={styles.behaviorMetric}>
        <Text style={styles.behaviorLabel}>Transactions</Text>
        <Text style={styles.behaviorValue}>{profile.transactionCount}</Text>
      </View>
      
      <View style={styles.behaviorMetric}>
        <Text style={styles.behaviorLabel}>Avg Amount</Text>
        <Text style={styles.behaviorValue}>${profile.averageAmount.toFixed(2)}</Text>
      </View>
      
      <View style={styles.behaviorMetric}>
        <Text style={styles.behaviorLabel}>Risk Tolerance</Text>
        <Text style={[styles.behaviorValue, { 
          color: profile.riskTolerance === 'aggressive' ? '#FF5722' : 
                profile.riskTolerance === 'moderate' ? '#FFC107' : '#4CAF50' 
        }]}>
          {profile.riskTolerance.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.behaviorMetric}>
        <Text style={styles.behaviorLabel}>Learning Status</Text>
        <Text style={[styles.behaviorValue, { color: '#2196F3' }]}>
          {profile.learningStatus.toUpperCase()}
        </Text>
      </View>
    </View>

    <View style={styles.progressContainer}>
      <Text style={styles.progressLabel}>AI Learning Progress</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { 
          width: `${Math.min((profile.transactionCount / 100) * 100, 100)}%` 
        }]} />
      </View>
      <Text style={styles.progressText}>
        {Math.min(profile.transactionCount, 100)}/100 transactions analyzed
      </Text>
    </View>
  </View>
);

interface PredictionItemProps {
  trend: AIInsights['predictedTrends'][0];
}

const PredictionItem: React.FC<PredictionItemProps> = ({ trend }) => (
  <View style={styles.predictionItem}>
    <View style={styles.predictionHeader}>
      <Icon 
        name={trend.direction === 'bullish' ? 'trending-up' : 
              trend.direction === 'bearish' ? 'trending-down' : 'remove'} 
        size={20} 
        color={trend.direction === 'bullish' ? '#4CAF50' : 
               trend.direction === 'bearish' ? '#FF5722' : '#FFC107'} 
      />
      <Text style={styles.predictionTimeframe}>{trend.timeframe}</Text>
      <Text style={[styles.predictionDirection, {
        color: trend.direction === 'bullish' ? '#4CAF50' : 
               trend.direction === 'bearish' ? '#FF5722' : '#FFC107'
      }]}>
        {trend.direction.toUpperCase()}
      </Text>
    </View>
    
    <Text style={styles.predictionReasoning}>{trend.reasoning}</Text>
    
    <View style={styles.confidenceContainer}>
      <Text style={styles.confidenceLabel}>Confidence: </Text>
      <Text style={styles.confidenceValue}>{trend.confidence}%</Text>
      <View style={styles.confidenceBar}>
        <View style={[styles.confidenceFill, { width: `${trend.confidence}%` }]} />
      </View>
    </View>
  </View>
);

const AIInsightsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [behaviorProfile, setBehaviorProfile] = useState<BehavioralProfile | null>(null);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'behavior' | 'predictions'>('overview');

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);
      
      const [analysisStats, profile, alerts, insights] = await Promise.all([
        aiTransactionAnalyzer.getAnalysisStats(),
        aiTransactionAnalyzer.getBehavioralProfile(),
        aiTransactionAnalyzer.getFraudAlerts(),
        aiTransactionAnalyzer.generateAIInsights([]) // Empty portfolio for demo
      ]);

      setStats(analysisStats);
      setBehaviorProfile(profile);
      setFraudAlerts(alerts);
      setAIInsights(insights);

    } catch (error) {
      console.error('Failed to load AI data:', error);
      Alert.alert('Error', 'Failed to load AI insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIData();
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setFraudAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* AI Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Analysis Overview</Text>
        
        <View style={styles.statusContainer}>
          <LinearGradient
            colors={['#4CAF50', 'transparent']}
            style={styles.statusGradient}
          >
            <Icon name="brain" size={32} color="#FFFFFF" />
            <Text style={styles.statusTitle}>AI Engine Active</Text>
            <Text style={styles.statusSubtitle}>Real-time Protection Enabled</Text>
          </LinearGradient>
        </View>
      </View>

      {/* AI Metrics */}
      <View style={styles.section}>
        <View style={styles.metricsGrid}>
          <AIMetricCard
            title="Transactions Analyzed"
            value={stats?.totalAnalyzed || 0}
            icon="analytics"
            color="#2196F3"
            subtitle="AI processed"
            trend="up"
          />
          
          <AIMetricCard
            title="Threats Detected"
            value={stats?.threatsDetected || 0}
            icon="shield-checkmark"
            color="#4CAF50"
            subtitle="Prevented"
            trend="neutral"
          />
          
          <AIMetricCard
            title="Accuracy"
            value={`${stats?.accuracy || 0}%`}
            icon="checkmark-circle"
            color="#4CAF50"
            subtitle="Detection rate"
            trend="up"
          />
          
          <AIMetricCard
            title="Learning Progress"
            value={`${Math.min((stats?.learningProgress || 0), 100)}%`}
            icon="school"
            color="#FF9800"
            subtitle="Model training"
            trend="up"
          />
        </View>
      </View>

      {/* Portfolio Health */}
      {aiInsights && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Health Score</Text>
          
          <View style={styles.healthContainer}>
            <View style={styles.healthScore}>
              <Text style={styles.healthValue}>{Math.round(aiInsights.portfolioHealth)}</Text>
              <Text style={styles.healthLabel}>Health Score</Text>
            </View>
            
            <View style={styles.riskDistribution}>
              <Text style={styles.riskTitle}>Risk Distribution</Text>
              <View style={styles.riskBars}>
                <View style={styles.riskBar}>
                  <Text style={styles.riskLabel}>Conservative</Text>
                  <View style={styles.riskBarContainer}>
                    <View style={[styles.riskBarFill, { 
                      width: `${aiInsights.riskDistribution.conservative}%`,
                      backgroundColor: '#4CAF50'
                    }]} />
                  </View>
                  <Text style={styles.riskPercent}>{Math.round(aiInsights.riskDistribution.conservative)}%</Text>
                </View>
                
                <View style={styles.riskBar}>
                  <Text style={styles.riskLabel}>Moderate</Text>
                  <View style={styles.riskBarContainer}>
                    <View style={[styles.riskBarFill, { 
                      width: `${aiInsights.riskDistribution.moderate}%`,
                      backgroundColor: '#FFC107'
                    }]} />
                  </View>
                  <Text style={styles.riskPercent}>{Math.round(aiInsights.riskDistribution.moderate)}%</Text>
                </View>
                
                <View style={styles.riskBar}>
                  <Text style={styles.riskLabel}>Aggressive</Text>
                  <View style={styles.riskBarContainer}>
                    <View style={[styles.riskBarFill, { 
                      width: `${aiInsights.riskDistribution.aggressive}%`,
                      backgroundColor: '#FF5722'
                    }]} />
                  </View>
                  <Text style={styles.riskPercent}>{Math.round(aiInsights.riskDistribution.aggressive)}%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* AI Suggestions */}
      {aiInsights && aiInsights.suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Suggestions</Text>
          {aiInsights.suggestions.map((suggestion, index) => (
            <View key={index} style={[styles.suggestionItem, {
              borderLeftColor: suggestion.priority === 'high' ? '#FF5722' :
                               suggestion.priority === 'medium' ? '#FFC107' : '#4CAF50'
            }]}>
              <View style={styles.suggestionHeader}>
                <Icon name="bulb" size={16} color="#FFC107" />
                <Text style={styles.suggestionPriority}>
                  {suggestion.priority.toUpperCase()} PRIORITY
                </Text>
              </View>
              <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              <Text style={styles.suggestionBenefit}>Expected: {suggestion.expectedBenefit}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderAlertsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Fraud Alerts ({fraudAlerts.filter(a => !a.acknowledged).length} active)
        </Text>
        
        {fraudAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shield-checkmark" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateTitle}>No Active Alerts</Text>
            <Text style={styles.emptyStateSubtitle}>AI monitoring is protecting your wallet</Text>
          </View>
        ) : (
          fraudAlerts.map((alert) => (
            <FraudAlertItem
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledgeAlert}
            />
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderBehaviorTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        {behaviorProfile ? (
          <BehaviorInsight profile={behaviorProfile} />
        ) : (
          <View style={styles.emptyState}>
            <Icon name="analytics" size={48} color="#2196F3" />
            <Text style={styles.emptyStateTitle}>Building Your Profile</Text>
            <Text style={styles.emptyStateSubtitle}>Make transactions to start AI learning</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderPredictionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Predictions</Text>
        
        {aiInsights && aiInsights.predictedTrends.length > 0 ? (
          aiInsights.predictedTrends.map((trend, index) => (
            <PredictionItem key={index} trend={trend} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="trending-up" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateTitle}>Generating Predictions</Text>
            <Text style={styles.emptyStateSubtitle}>AI is analyzing market data</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="brain" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading AI Insights...</Text>
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
            <Icon name="brain" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>AI Insights</Text>
          </View>
          
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon 
            name="speedometer" 
            size={18} 
            color={activeTab === 'overview' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Icon 
            name="warning" 
            size={18} 
            color={activeTab === 'alerts' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'behavior' && styles.activeTab]}
          onPress={() => setActiveTab('behavior')}
        >
          <Icon 
            name="analytics" 
            size={18} 
            color={activeTab === 'behavior' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'behavior' && styles.activeTabText]}>
            Behavior
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'predictions' && styles.activeTab]}
          onPress={() => setActiveTab('predictions')}
        >
          <Icon 
            name="trending-up" 
            size={18} 
            color={activeTab === 'predictions' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'predictions' && styles.activeTabText]}>
            Predictions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'alerts' && renderAlertsTab()}
      {activeTab === 'behavior' && renderBehaviorTab()}
      {activeTab === 'predictions' && renderPredictionsTab()}
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
  refreshButton: {
    padding: 8,
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
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 6,
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
  statusContainer: {
    marginBottom: 20,
  },
  statusGradient: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
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
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScore: {
    alignItems: 'center',
    marginRight: 30,
  },
  healthValue: {
    color: '#4CAF50',
    fontSize: 32,
    fontWeight: 'bold',
  },
  healthLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
  },
  riskDistribution: {
    flex: 1,
  },
  riskTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskBars: {
    gap: 8,
  },
  riskBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    width: 70,
  },
  riskBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  riskPercent: {
    color: '#FFFFFF',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  suggestionItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionPriority: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  suggestionDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  suggestionBenefit: {
    color: '#4CAF50',
    fontSize: 12,
  },
  alertItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  severityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertMessage: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
  },
  alertRisk: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertRiskLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  alertRiskValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  alertActions: {
    marginBottom: 12,
  },
  alertActionsTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertAction: {
    color: '#CCCCCC',
    fontSize: 12,
    marginLeft: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    color: '#888888',
    fontSize: 12,
  },
  acknowledgeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  behaviorContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  behaviorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  behaviorMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  behaviorMetric: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  behaviorLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  behaviorValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  predictionItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTimeframe: {
    color: '#CCCCCC',
    fontSize: 12,
    marginLeft: 8,
    marginRight: 8,
  },
  predictionDirection: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  predictionReasoning: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  confidenceValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
  },
});

export default AIInsightsDashboard;
