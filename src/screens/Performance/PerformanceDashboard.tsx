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
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import LightningPerformanceManager, { PerformanceMetrics, PerformanceReport } from '../../performance/LightningPerformanceManager';

const { width } = Dimensions.get('window');

interface PerformanceDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

/**
 * CYPHER Performance Dashboard
 * Real-time performance monitoring and optimization controls
 * Features: Lightning mode, performance metrics, optimization insights
 */
const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [lightningMode, setLightningMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const performanceManager = LightningPerformanceManager.getInstance();

  useEffect(() => {
    loadPerformanceData();
    
    // Set up real-time updates
    const interval = setInterval(loadPerformanceData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      setRefreshing(true);
      
      const [report, currentMetrics] = await Promise.all([
        performanceManager.getPerformanceReport(),
        performanceManager.getCurrentMetrics()
      ]);
      
      setPerformanceReport(report);
      setMetrics(currentMetrics);
      setLightningMode(performanceManager.isLightningModeEnabled());
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleLightningMode = async () => {
    try {
      setLoading(true);
      
      if (lightningMode) {
        await performanceManager.disableLightningMode();
        setLightningMode(false);
        Alert.alert('Lightning Mode Disabled', 'Performance optimizations have been turned off.');
      } else {
        await performanceManager.enableLightningMode();
        setLightningMode(true);
        Alert.alert(
          '⚡ Lightning Mode Activated!',
          'CYPHER performance optimizations enabled. Experience lightning-fast transactions and seamless navigation.',
          [{ text: 'Amazing!' }]
        );
      }
      
      // Refresh data
      setTimeout(loadPerformanceData, 1000);
    } catch (error) {
      console.error('Failed to toggle lightning mode:', error);
      Alert.alert('Error', 'Failed to toggle Lightning Mode');
    } finally {
      setLoading(false);
    }
  };

  const optimizePerformance = async () => {
    try {
      setLoading(true);
      
      await performanceManager.optimizePerformance();
      
      Alert.alert(
        '🚀 Performance Optimized!',
        'Your CYPHER wallet has been optimized for maximum performance.',
        [{ text: 'Excellent!' }]
      );
      
      // Refresh data
      setTimeout(loadPerformanceData, 1000);
    } catch (error) {
      console.error('Failed to optimize performance:', error);
      Alert.alert('Error', 'Failed to optimize performance');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      setLoading(true);
      
      await performanceManager.clearCache();
      
      Alert.alert(
        '🧹 Cache Cleared!',
        'All cached data has been cleared. Performance may be slower temporarily while cache rebuilds.',
        [{ text: 'OK' }]
      );
      
      // Refresh data
      setTimeout(loadPerformanceData, 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      Alert.alert('Error', 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const renderCircularProgress = (value: number, maxValue: number, color: string, size: number = 120) => {
    const radius = (size - 10) / 2;
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
            strokeWidth="8"
            fill="transparent"
          />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={`${progress} ${remaining}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
      </Svg>
    );
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const cardStyle = createCardStyle('elevated');

  if (!performanceReport || !metrics) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading performance data...</Text>
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
            onPress={() => onNavigate('Settings')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            ⚡ Performance
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={loadPerformanceData}
          >
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Lightning-fast wallet performance
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Performance Score */}
        <View style={[cardStyle, styles.scoreCard]}>
          <View style={styles.scoreHeader}>
            <Text style={styles.sectionTitle}>Overall Performance</Text>
            <View style={[styles.gradeBadge, { backgroundColor: getPerformanceColor(performanceReport.score) }]}>
              <Text style={styles.gradeText}>{getPerformanceGrade(performanceReport.score)}</Text>
            </View>
          </View>
          
          <View style={styles.scoreContainer}>
            <View style={styles.circularProgress}>
              {renderCircularProgress(
                performanceReport.score, 
                100, 
                getPerformanceColor(performanceReport.score),
                140
              )}
              <View style={styles.scoreCenter}>
                <Text style={styles.scoreValue}>{performanceReport.score}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
            
            <View style={styles.scoreDetails}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>Transaction Speed</Text>
                <Text style={styles.scoreItemValue}>
                  {formatDuration(performanceReport.averageTransactionTime)}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>API Response</Text>
                <Text style={styles.scoreItemValue}>
                  {formatDuration(performanceReport.averageApiResponseTime)}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>Screen Load</Text>
                <Text style={styles.scoreItemValue}>
                  {formatDuration(performanceReport.averageScreenLoadTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Lightning Mode Control */}
        <View style={[cardStyle, styles.lightningCard]}>
          <View style={styles.lightningHeader}>
            <View style={styles.lightningInfo}>
              <Text style={styles.lightningTitle}>⚡ Lightning Mode</Text>
              <Text style={styles.lightningDescription}>
                {lightningMode 
                  ? 'Maximum performance optimizations active'
                  : 'Enable for lightning-fast performance'
                }
              </Text>
            </View>
            <View style={[
              styles.lightningToggle,
              lightningMode && styles.lightningToggleActive
            ]}>
              <TouchableOpacity
                style={[
                  styles.lightningSwitch,
                  lightningMode && styles.lightningSwitchActive
                ]}
                onPress={toggleLightningMode}
                disabled={loading}
              >
                <Text style={styles.lightningSwitchText}>
                  {lightningMode ? '⚡' : '○'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {lightningMode && (
            <View style={styles.lightningFeatures}>
              <Text style={styles.featuresTitle}>Active Optimizations:</Text>
              <Text style={styles.featureText}>• Intelligent caching system</Text>
              <Text style={styles.featureText}>• Predictive content loading</Text>
              <Text style={styles.featureText}>• Optimized API batching</Text>
              <Text style={styles.featureText}>• Advanced memory management</Text>
            </View>
          )}
        </View>

        {/* Real-time Metrics */}
        <View style={[cardStyle, styles.metricsCard]}>
          <Text style={styles.sectionTitle}>Real-time Metrics</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatBytes(metrics.memoryUsage)}</Text>
              <Text style={styles.metricLabel}>Memory Usage</Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricProgress,
                    { 
                      width: `${Math.min((metrics.memoryUsage / (100 * 1024 * 1024)) * 100, 100)}%`,
                      backgroundColor: metrics.memoryUsage > 50 * 1024 * 1024 ? colors.warning : colors.success
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.cacheHitRate.toFixed(1)}%</Text>
              <Text style={styles.metricLabel}>Cache Hit Rate</Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricProgress,
                    { 
                      width: `${metrics.cacheHitRate}%`,
                      backgroundColor: metrics.cacheHitRate > 80 ? colors.success : colors.warning
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{metrics.activeConnections}</Text>
              <Text style={styles.metricLabel}>Active Connections</Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricProgress,
                    { 
                      width: `${Math.min((metrics.activeConnections / 10) * 100, 100)}%`,
                      backgroundColor: metrics.activeConnections < 5 ? colors.success : colors.warning
                    }
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{formatDuration(metrics.averageResponseTime)}</Text>
              <Text style={styles.metricLabel}>Avg Response Time</Text>
              <View style={styles.metricBar}>
                <View 
                  style={[
                    styles.metricProgress,
                    { 
                      width: `${Math.max(100 - (metrics.averageResponseTime / 10), 10)}%`,
                      backgroundColor: metrics.averageResponseTime < 500 ? colors.success : colors.warning
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={[cardStyle, styles.insightsCard]}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
          
          {performanceReport.insights.length > 0 ? (
            performanceReport.insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Text style={styles.insightIcon}>
                  {insight.type === 'optimization' ? '💡' :
                   insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                </Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightText}>{insight.message}</Text>
                  {insight.action && (
                    <Text style={styles.insightAction}>💡 {insight.action}</Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noInsights}>
              <Text style={styles.noInsightsIcon}>🚀</Text>
              <Text style={styles.noInsightsText}>
                Your wallet is running at optimal performance!
              </Text>
            </View>
          )}
        </View>

        {/* Performance Actions */}
        <View style={[cardStyle, styles.actionsCard]}>
          <Text style={styles.sectionTitle}>Performance Actions</Text>
          
          <Button
            title="🚀 Optimize Performance"
            onPress={optimizePerformance}
            loading={loading}
            style={styles.actionButton}
          />
          
          <Button
            title="🧹 Clear Cache"
            onPress={clearCache}
            loading={loading}
            style={{ ...styles.actionButton, backgroundColor: '#1E293B' }}
          />
          
          <View style={styles.cacheInfo}>
            <Text style={styles.cacheInfoText}>
              Cache Size: {formatBytes(metrics.cacheSize)}
            </Text>
            <Text style={styles.cacheInfoText}>
              Last Optimized: {performanceReport.lastOptimized 
                ? new Date(performanceReport.lastOptimized).toLocaleString()
                : 'Never'
              }
            </Text>
          </View>
        </View>

        {/* CYPHER Performance Features */}
        <View style={[cardStyle, styles.featuresCard]}>
          <Text style={styles.sectionTitle}>CYPHER Performance Features</Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureTitle}>Lightning Mode</Text>
              <Text style={styles.featureDescription}>
                Sub-second transaction processing
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🧠</Text>
              <Text style={styles.featureTitle}>Intelligent Caching</Text>
              <Text style={styles.featureDescription}>
                Smart data prefetching and storage
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureTitle}>Predictive Loading</Text>
              <Text style={styles.featureDescription}>
                Pre-load likely user actions
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🔄</Text>
              <Text style={styles.featureTitle}>API Optimization</Text>
              <Text style={styles.featureDescription}>
                Batched requests and response caching
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💾</Text>
              <Text style={styles.featureTitle}>Memory Management</Text>
              <Text style={styles.featureDescription}>
                Automatic garbage collection optimization
              </Text>
            </View>
          </View>
        </View>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scoreCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  lightningCard: {
    marginBottom: 16,
  },
  metricsCard: {
    marginBottom: 16,
  },
  insightsCard: {
    marginBottom: 16,
  },
  actionsCard: {
    marginBottom: 16,
  },
  featuresCard: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularProgress: {
    position: 'relative',
    marginRight: 24,
  },
  scoreCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  scoreDetails: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scoreItemLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  scoreItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  lightningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  lightningInfo: {
    flex: 1,
  },
  lightningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  lightningDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  lightningToggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    padding: 2,
    justifyContent: 'center',
  },
  lightningToggleActive: {
    backgroundColor: '#3B82F6',
  },
  lightningSwitch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightningSwitchActive: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
  },
  lightningSwitchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lightningFeatures: {
    padding: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricItem: {
    flex: 1,
    minWidth: (width - 64) / 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  metricBar: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
  },
  metricProgress: {
    height: '100%',
    borderRadius: 2,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 20,
    marginBottom: 4,
  },
  insightAction: {
    fontSize: 13,
    color: '#3B82F6',
    fontStyle: 'italic',
  },
  noInsights: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noInsightsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noInsightsText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
  },
  cacheInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  cacheInfoText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 32,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
    flex: 1,
  },
  featureDescription: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 2,
  },
});

export default PerformanceDashboard;
