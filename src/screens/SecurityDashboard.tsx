/**
 * ECLIPTA Security Dashboard
 * 
 * Revolutionary security monitoring and management interface.
 * Real-time threat detection, security metrics, and advanced protection controls.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { advancedSecurityService, SecurityMetrics, SecurityThreat, SecurityAlert, SecurityConfig } from '../services/AdvancedSecurityService';

const { width, height } = Dimensions.get('window');

interface SecurityCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  onPress?: () => void;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  subtitle, 
  onPress 
}) => (
  <TouchableOpacity 
    style={[styles.securityCard, { borderLeftColor: color }]} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.cardHeader}>
      <Icon name={icon} size={24} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

interface ThreatItemProps {
  threat: SecurityThreat;
  onMitigate: (threatId: string) => void;
}

const ThreatItem: React.FC<ThreatItemProps> = ({ threat, onMitigate }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'medium': return '#FFAA00';
      case 'low': return '#44AA44';
      default: return '#666666';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'warning';
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={[styles.threatItem, { borderLeftColor: getSeverityColor(threat.severity) }]}>
      <View style={styles.threatHeader}>
        <Icon 
          name={getSeverityIcon(threat.severity)} 
          size={20} 
          color={getSeverityColor(threat.severity)} 
        />
        <Text style={styles.threatType}>{threat.type.replace('_', ' ').toUpperCase()}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(threat.severity) }]}>
          <Text style={styles.severityText}>{threat.severity.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.threatDescription}>{threat.description}</Text>
      
      <View style={styles.threatFooter}>
        <Text style={styles.threatTime}>
          {new Date(threat.detectedAt).toLocaleString()}
        </Text>
        
        {threat.status === 'active' && (
          <TouchableOpacity 
            style={styles.mitigateButton}
            onPress={() => onMitigate(threat.id)}
          >
            <Text style={styles.mitigateButtonText}>Mitigate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface SecurityToggleProps {
  title: string;
  description: string;
  icon: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

const SecurityToggle: React.FC<SecurityToggleProps> = ({
  title,
  description,
  icon,
  value,
  onToggle,
  disabled = false
}) => (
  <View style={styles.toggleItem}>
    <View style={styles.toggleIcon}>
      <Icon name={icon} size={24} color={value ? '#4CAF50' : '#666666'} />
    </View>
    
    <View style={styles.toggleContent}>
      <Text style={styles.toggleTitle}>{title}</Text>
      <Text style={styles.toggleDescription}>{description}</Text>
    </View>
    
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: '#767577', true: '#4CAF50' }}
      thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
    />
  </View>
);

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'settings'>('overview');

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      const [securityMetrics, securityConfig, securityAlerts] = await Promise.all([
        advancedSecurityService.getSecurityMetrics(),
        advancedSecurityService.getSecurityConfig(),
        advancedSecurityService.getSecurityAlerts()
      ]);

      setMetrics(securityMetrics);
      setConfig(securityConfig);
      setAlerts(securityAlerts);

    } catch (error) {
      console.error('Failed to load security data:', error);
      Alert.alert('Error', 'Failed to load security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSecurityData();
  };

  const handleThreatMitigation = async (threatId: string) => {
    Alert.alert(
      'Mitigate Threat',
      'Are you sure you want to mark this threat as mitigated?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mitigate', 
          style: 'destructive',
          onPress: async () => {
            // In real implementation, would call mitigation service
            console.log('Mitigating threat:', threatId);
            await loadSecurityData();
          }
        }
      ]
    );
  };

  const handleSecurityToggle = async (key: keyof SecurityConfig, value: boolean) => {
    if (!config) return;

    try {
      const newConfig = { ...config, [key]: value };
      await advancedSecurityService.updateSecurityConfig({ [key]: value });
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to update security config:', error);
      Alert.alert('Error', 'Failed to update security setting');
    }
  };

  const handleBiometricSetup = async () => {
    try {
      const result = await advancedSecurityService.enableBiometric();
      if (result.success) {
        Alert.alert(
          'Biometric Enabled',
          `Successfully enabled biometric authentication with: ${result.supportedTypes.join(', ')}`
        );
        await loadSecurityData();
      } else {
        Alert.alert('Biometric Setup Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to setup biometric authentication');
    }
  };

  const handleEmergencyLockdown = () => {
    Alert.alert(
      '🚨 Emergency Lockdown',
      'This will immediately lock your wallet and clear sensitive data. Only proceed if you suspect a security breach.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Emergency Lock', 
          style: 'destructive',
          onPress: async () => {
            await advancedSecurityService.emergencyLockdown('User initiated emergency lockdown');
            Alert.alert('Lockdown Activated', 'Your wallet has been secured.');
          }
        }
      ]
    );
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'minimal': return '#4CAF50';
      case 'low': return '#8BC34A';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Security Score Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Overview</Text>
        
        <View style={styles.scoreContainer}>
          <LinearGradient
            colors={[getThreatLevelColor(metrics?.threatLevel || 'medium'), 'transparent']}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreValue}>{metrics?.securityScore || 0}</Text>
            <Text style={styles.scoreLabel}>Security Score</Text>
          </LinearGradient>
          
          <View style={styles.threatLevelContainer}>
            <Text style={styles.threatLevelLabel}>Threat Level</Text>
            <Text style={[
              styles.threatLevelValue, 
              { color: getThreatLevelColor(metrics?.threatLevel || 'medium') }
            ]}>
              {metrics?.threatLevel?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>
      </View>

      {/* Security Cards */}
      <View style={styles.section}>
        <View style={styles.cardsGrid}>
          <SecurityCard
            title="Protection Layers"
            value={metrics?.protectionLayers || 0}
            icon="shield-checkmark"
            color="#4CAF50"
            subtitle="Active defenses"
          />
          
          <SecurityCard
            title="Active Threats"
            value={metrics?.detectedThreats.filter(t => t.status === 'active').length || 0}
            icon="warning"
            color="#FF5722"
            subtitle="Requiring attention"
          />
          
          <SecurityCard
            title="Device Integrity"
            value={advancedSecurityService.isDeviceSecure() ? "Secure" : "Compromised"}
            icon="phone-portrait"
            color={advancedSecurityService.isDeviceSecure() ? "#4CAF50" : "#FF5722"}
            subtitle="Device status"
          />
          
          <SecurityCard
            title="Last Scan"
            value="Now"
            icon="scan"
            color="#2196F3"
            subtitle="Real-time monitoring"
          />
        </View>
      </View>

      {/* Active Defenses */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Defenses</Text>
        <View style={styles.defensesContainer}>
          {metrics?.activeDefenses.map((defense, index) => (
            <View key={index} style={styles.defenseItem}>
              <Icon name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.defenseText}>{defense}</Text>
            </View>
          )) || []}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryAction]}
            onPress={handleBiometricSetup}
          >
            <Icon name="finger-print" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Setup Biometric</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.warningAction]}
            onPress={handleEmergencyLockdown}
          >
            <Icon name="lock-closed" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Emergency Lock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderThreatsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Security Threats ({metrics?.detectedThreats.length || 0})
        </Text>
        
        {metrics?.detectedThreats.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="shield-checkmark" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateTitle}>No Threats Detected</Text>
            <Text style={styles.emptyStateSubtitle}>Your wallet is secure</Text>
          </View>
        ) : (
          metrics?.detectedThreats.map((threat) => (
            <ThreatItem
              key={threat.id}
              threat={threat}
              onMitigate={handleThreatMitigation}
            />
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <SecurityToggle
          title="Threat Detection"
          description="Real-time monitoring for security threats"
          icon="search"
          value={config?.enableThreatDetection || false}
          onToggle={(value) => handleSecurityToggle('enableThreatDetection', value)}
        />
        
        <SecurityToggle
          title="Network Protection"
          description="Monitor and protect against network attacks"
          icon="wifi"
          value={config?.enableNetworkProtection || false}
          onToggle={(value) => handleSecurityToggle('enableNetworkProtection', value)}
        />
        
        <SecurityToggle
          title="Device Integrity Check"
          description="Verify device hasn't been compromised"
          icon="shield-checkmark"
          value={config?.enableDeviceIntegrityCheck || false}
          onToggle={(value) => handleSecurityToggle('enableDeviceIntegrityCheck', value)}
        />
        
        <SecurityToggle
          title="Behavioral Analysis"
          description="Detect unusual usage patterns"
          icon="analytics"
          value={config?.enableBehavioralAnalysis || false}
          onToggle={(value) => handleSecurityToggle('enableBehavioralAnalysis', value)}
        />
        
        <SecurityToggle
          title="Require PIN for App"
          description="Always require PIN when opening app"
          icon="keypad"
          value={config?.requirePinForApp || false}
          onToggle={(value) => handleSecurityToggle('requirePinForApp', value)}
        />
        
        <SecurityToggle
          title="Biometric for Transactions"
          description="Require biometric for all transactions"
          icon="finger-print"
          value={config?.requireBiometricForTransactions || false}
          onToggle={(value) => handleSecurityToggle('requireBiometricForTransactions', value)}
        />
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="shield" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading Security Dashboard...</Text>
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
            <Icon name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>Security Center</Text>
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
            size={20} 
            color={activeTab === 'overview' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'threats' && styles.activeTab]}
          onPress={() => setActiveTab('threats')}
        >
          <Icon 
            name="warning" 
            size={20} 
            color={activeTab === 'threats' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'threats' && styles.activeTabText]}>
            Threats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Icon 
            name="settings" 
            size={20} 
            color={activeTab === 'settings' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'threats' && renderThreatsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
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
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666666',
    fontSize: 14,
    marginLeft: 8,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 4,
  },
  threatLevelContainer: {
    flex: 1,
  },
  threatLevelLabel: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 8,
  },
  threatLevelValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  securityCard: {
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
  defensesContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  defenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  defenseText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  warningAction: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  threatItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  threatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  threatType: {
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
  threatDescription: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 12,
  },
  threatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threatTime: {
    color: '#888888',
    fontSize: 12,
  },
  mitigateButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mitigateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toggleIcon: {
    marginRight: 16,
  },
  toggleContent: {
    flex: 1,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  toggleDescription: {
    color: '#CCCCCC',
    fontSize: 14,
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

export default SecurityDashboard;
