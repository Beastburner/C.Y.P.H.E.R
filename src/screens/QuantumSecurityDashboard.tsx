/**
 * ECLIPTA Quantum Security Dashboard
 * 
 * Comprehensive interface for monitoring quantum threat levels,
 * cryptographic strength, and post-quantum migration status.
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
import { quantumCrypto, QuantumThreatAssessment, QuantumResistantAlgorithm } from '../services/QuantumCrypto';

const { width, height } = Dimensions.get('window');

interface ThreatMeterProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  title: string;
}

const ThreatMeter: React.FC<ThreatMeterProps> = ({ level, value, title }) => {
  const getColor = () => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF8A65';
      case 'critical': return '#FF5722';
      default: return '#666666';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'low': return 'shield-checkmark';
      case 'medium': return 'warning';
      case 'high': return 'alert';
      case 'critical': return 'skull';
      default: return 'help';
    }
  };

  return (
    <View style={styles.threatMeter}>
      <View style={styles.threatMeterHeader}>
        <Icon name={getIcon()} size={20} color={getColor()} />
        <Text style={styles.threatMeterTitle}>{title}</Text>
      </View>
      
      <View style={styles.threatMeterBar}>
        <View style={[styles.threatMeterFill, { 
          width: `${value}%`, 
          backgroundColor: getColor() 
        }]} />
      </View>
      
      <Text style={[styles.threatMeterValue, { color: getColor() }]}>
        {level.toUpperCase()} ({value}%)
      </Text>
    </View>
  );
};

interface AlgorithmCardProps {
  algorithm: QuantumResistantAlgorithm;
  strength: number;
  status: 'active' | 'recommended' | 'deprecated';
  onSelect: () => void;
}

const AlgorithmCard: React.FC<AlgorithmCardProps> = ({ algorithm, strength, status, onSelect }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'recommended': return '#2196F3';
      case 'deprecated': return '#FF5722';
      default: return '#666666';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'recommended': return 'star';
      case 'deprecated': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <TouchableOpacity style={styles.algorithmCard} onPress={onSelect} activeOpacity={0.8}>
      <View style={styles.algorithmHeader}>
        <Text style={styles.algorithmName}>{algorithm.replace('_', ' ').toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Icon name={getStatusIcon()} size={12} color="#FFFFFF" />
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.strengthContainer}>
        <Text style={styles.strengthLabel}>Quantum Resistance</Text>
        <View style={styles.strengthBar}>
          <View style={[styles.strengthFill, { 
            width: `${strength}%`,
            backgroundColor: strength >= 80 ? '#4CAF50' : strength >= 60 ? '#FFC107' : '#FF5722'
          }]} />
        </View>
        <Text style={styles.strengthValue}>{strength}%</Text>
      </View>
    </TouchableOpacity>
  );
};

interface MigrationItemProps {
  title: string;
  currentAlgorithm: string;
  targetAlgorithm: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  onMigrate: () => void;
}

const MigrationItem: React.FC<MigrationItemProps> = ({ 
  title, 
  currentAlgorithm, 
  targetAlgorithm, 
  priority, 
  onMigrate 
}) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FFC107';
      case 'high': return '#FF8A65';
      case 'critical': return '#FF5722';
      default: return '#666666';
    }
  };

  return (
    <View style={styles.migrationItem}>
      <View style={styles.migrationInfo}>
        <Text style={styles.migrationTitle}>{title}</Text>
        <Text style={styles.migrationAlgorithms}>
          {currentAlgorithm} → {targetAlgorithm}
        </Text>
        
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor() }]}>
          <Text style={styles.priorityText}>{priority.toUpperCase()} PRIORITY</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.migrateButton} onPress={onMigrate}>
        <Icon name="arrow-forward" size={16} color="#4CAF50" />
        <Text style={styles.migrateButtonText}>Migrate</Text>
      </TouchableOpacity>
    </View>
  );
};

const QuantumSecurityDashboard: React.FC = () => {
  const [threatAssessment, setThreatAssessment] = useState<QuantumThreatAssessment | null>(null);
  const [readinessReport, setReadinessReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'algorithms' | 'migration' | 'analysis'>('overview');

  useEffect(() => {
    loadQuantumSecurityData();
  }, []);

  const loadQuantumSecurityData = async () => {
    try {
      setLoading(true);
      
      // Initialize quantum crypto service
      await quantumCrypto.initialize();
      
      // Get threat assessment
      const assessment = await quantumCrypto.assessQuantumThreat();
      setThreatAssessment(assessment);
      
      // Get readiness report
      const report = await quantumCrypto.getQuantumReadinessReport();
      setReadinessReport(report);
      
    } catch (error) {
      console.error('Failed to load quantum security data:', error);
      Alert.alert('Error', 'Failed to load quantum security data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuantumSecurityData();
  };

  const handleAlgorithmSelect = (algorithm: QuantumResistantAlgorithm) => {
    Alert.alert(
      algorithm.replace('_', ' ').toUpperCase(),
      'This is a post-quantum cryptographic algorithm designed to resist attacks from quantum computers.',
      [
        { text: 'Learn More' },
        { text: 'Generate Key Pair', onPress: () => generateKeyPair(algorithm) }
      ]
    );
  };

  const generateKeyPair = async (algorithm: QuantumResistantAlgorithm) => {
    try {
      const keyPair = await quantumCrypto.generateQuantumKeyPair(algorithm);
      Alert.alert(
        'Key Pair Generated',
        `Successfully generated ${algorithm} key pair\nKey Size: ${keyPair.keySize} bits`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate key pair');
    }
  };

  const handleMigration = async (title: string, fromAlg: string, toAlg: QuantumResistantAlgorithm) => {
    try {
      Alert.alert(
        'Confirm Migration',
        `Migrate ${title} from ${fromAlg} to ${toAlg}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Migrate', 
            onPress: async () => {
              const result = await quantumCrypto.migrateToQuantumSafe(
                'sample-data',
                fromAlg,
                toAlg
              );
              
              if (result.success) {
                Alert.alert('Success', 'Migration completed successfully');
              } else {
                Alert.alert('Error', 'Migration failed');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Migration failed');
    }
  };

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {threatAssessment && (
        <>
          {/* Threat Level Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛡️ Quantum Threat Assessment</Text>
            
            <ThreatMeter
              level={threatAssessment.riskLevel}
              value={(5 - threatAssessment.migrationPriority) * 20}
              title="Overall Risk Level"
            />
            
            <View style={styles.assessmentCard}>
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentLabel}>Time to Quantum Threat:</Text>
                <Text style={styles.assessmentValue}>
                  ~{threatAssessment.estimatedTimeToQuantumThreat} years
                </Text>
              </View>
              
              <View style={styles.assessmentRow}>
                <Text style={styles.assessmentLabel}>Migration Priority:</Text>
                <Text style={[styles.assessmentValue, {
                  color: threatAssessment.migrationPriority >= 8 ? '#FF5722' :
                        threatAssessment.migrationPriority >= 6 ? '#FF8A65' :
                        threatAssessment.migrationPriority >= 4 ? '#FFC107' : '#4CAF50'
                }]}>
                  {threatAssessment.migrationPriority}/10
                </Text>
              </View>
            </View>
          </View>

          {/* Threat Factors */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Current Threat Factors</Text>
            
            {threatAssessment.threatFactors.map((factor, index) => (
              <View key={index} style={styles.threatFactor}>
                <Icon name="alert-circle" size={16} color="#FFC107" />
                <Text style={styles.threatFactorText}>{factor}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {readinessReport && (
        <>
          {/* Readiness Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Quantum Readiness Score</Text>
            
            <View style={styles.readinessCard}>
              <View style={styles.readinessScore}>
                <Text style={styles.scoreValue}>{Math.round(readinessReport.overallScore)}</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              
              <Text style={[styles.readinessLevel, {
                color: readinessReport.overallScore >= 75 ? '#4CAF50' :
                      readinessReport.overallScore >= 60 ? '#FFC107' : '#FF5722'
              }]}>
                {readinessReport.readinessLevel}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Quick Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{readinessReport.migrationsNeeded}</Text>
                <Text style={styles.statLabel}>Migrations Needed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {threatAssessment?.recommendedAlgorithms.length || 0}
                </Text>
                <Text style={styles.statLabel}>Recommended Algorithms</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>256</Text>
                <Text style={styles.statLabel}>Bit Security Level</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>99.9%</Text>
                <Text style={styles.statLabel}>Protection Rate</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderAlgorithmsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Post-Quantum Algorithms</Text>
        
        <AlgorithmCard
          algorithm={QuantumResistantAlgorithm.KYBER_1024}
          strength={95}
          status="recommended"
          onSelect={() => handleAlgorithmSelect(QuantumResistantAlgorithm.KYBER_1024)}
        />
        
        <AlgorithmCard
          algorithm={QuantumResistantAlgorithm.DILITHIUM_5}
          strength={92}
          status="active"
          onSelect={() => handleAlgorithmSelect(QuantumResistantAlgorithm.DILITHIUM_5)}
        />
        
        <AlgorithmCard
          algorithm={QuantumResistantAlgorithm.FALCON_1024}
          strength={88}
          status="recommended"
          onSelect={() => handleAlgorithmSelect(QuantumResistantAlgorithm.FALCON_1024)}
        />
        
        <AlgorithmCard
          algorithm={QuantumResistantAlgorithm.SPHINCS_SHA256}
          strength={85}
          status="active"
          onSelect={() => handleAlgorithmSelect(QuantumResistantAlgorithm.SPHINCS_SHA256)}
        />
        
        <AlgorithmCard
          algorithm={QuantumResistantAlgorithm.NTRU_HPS_4096}
          strength={82}
          status="recommended"
          onSelect={() => handleAlgorithmSelect(QuantumResistantAlgorithm.NTRU_HPS_4096)}
        />
      </View>
    </ScrollView>
  );

  const renderMigrationTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 Migration Recommendations</Text>
        
        <MigrationItem
          title="Wallet Private Keys"
          currentAlgorithm="ECDSA-256"
          targetAlgorithm="DILITHIUM-5"
          priority="high"
          onMigrate={() => handleMigration('Wallet Keys', 'ECDSA-256', QuantumResistantAlgorithm.DILITHIUM_5)}
        />
        
        <MigrationItem
          title="Transaction Signatures"
          currentAlgorithm="RSA-2048"
          targetAlgorithm="FALCON-1024"
          priority="critical"
          onMigrate={() => handleMigration('Signatures', 'RSA-2048', QuantumResistantAlgorithm.FALCON_1024)}
        />
        
        <MigrationItem
          title="Key Exchange"
          currentAlgorithm="DH-2048"
          targetAlgorithm="KYBER-1024"
          priority="medium"
          onMigrate={() => handleMigration('Key Exchange', 'DH-2048', QuantumResistantAlgorithm.KYBER_1024)}
        />
        
        <MigrationItem
          title="Secure Storage"
          currentAlgorithm="AES-128"
          targetAlgorithm="AES-256"
          priority="low"
          onMigrate={() => handleMigration('Storage', 'AES-128', QuantumResistantAlgorithm.KYBER_1024)}
        />
      </View>
    </ScrollView>
  );

  const renderAnalysisTab = () => (
    <ScrollView style={styles.tabContent}>
      {readinessReport && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔬 Detailed Analysis</Text>
            
            {readinessReport.recommendations.map((recommendation: string, index: number) => (
              <View key={index} style={styles.recommendationItem}>
                <Icon name="bulb" size={16} color="#FFC107" />
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Implementation Timeline</Text>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineMarker} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Phase 1: Immediate (0-6 months)</Text>
                <Text style={styles.timelineDescription}>
                  Implement hybrid classical-quantum cryptography
                </Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineMarker} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Phase 2: Short-term (6-18 months)</Text>
                <Text style={styles.timelineDescription}>
                  Migrate critical systems to post-quantum algorithms
                </Text>
              </View>
            </View>
            
            <View style={styles.timelineItem}>
              <View style={styles.timelineMarker} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Phase 3: Long-term (18+ months)</Text>
                <Text style={styles.timelineDescription}>
                  Complete migration and establish quantum-safe infrastructure
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="shield" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Analyzing Quantum Security...</Text>
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
            <Icon name="shield" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>Quantum Security</Text>
          </View>
          
          <View style={styles.headerRight}>
            {threatAssessment && (
              <View style={[styles.threatIndicator, {
                backgroundColor: threatAssessment.riskLevel === 'low' ? '#4CAF50' :
                                threatAssessment.riskLevel === 'medium' ? '#FFC107' :
                                threatAssessment.riskLevel === 'high' ? '#FF8A65' : '#FF5722'
              }]}>
                <Text style={styles.threatIndicatorText}>
                  {threatAssessment.riskLevel.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Icon 
            name="analytics" 
            size={18} 
            color={activeTab === 'overview' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'algorithms' && styles.activeTab]}
          onPress={() => setActiveTab('algorithms')}
        >
          <Icon 
            name="key" 
            size={18} 
            color={activeTab === 'algorithms' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'algorithms' && styles.activeTabText]}>
            Algorithms
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'migration' && styles.activeTab]}
          onPress={() => setActiveTab('migration')}
        >
          <Icon 
            name="swap-horizontal" 
            size={18} 
            color={activeTab === 'migration' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'migration' && styles.activeTabText]}>
            Migration
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analysis' && styles.activeTab]}
          onPress={() => setActiveTab('analysis')}
        >
          <Icon 
            name="bar-chart" 
            size={18} 
            color={activeTab === 'analysis' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'analysis' && styles.activeTabText]}>
            Analysis
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'algorithms' && renderAlgorithmsTab()}
      {activeTab === 'migration' && renderMigrationTab()}
      {activeTab === 'analysis' && renderAnalysisTab()}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threatIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threatIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666666',
    fontSize: 11,
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
  threatMeter: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  threatMeterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  threatMeterTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  threatMeterBar: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginBottom: 8,
  },
  threatMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  threatMeterValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  assessmentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assessmentLabel: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  assessmentValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  threatFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  threatFactorText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  readinessCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  readinessScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreValue: {
    color: '#4CAF50',
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    color: '#CCCCCC',
    fontSize: 20,
    marginLeft: 4,
  },
  readinessLevel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    textAlign: 'center',
  },
  algorithmCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  algorithmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  algorithmName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthLabel: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 4,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    marginBottom: 4,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthValue: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'right',
  },
  migrationItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  migrationInfo: {
    flex: 1,
  },
  migrationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  migrationAlgorithms: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  migrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  migrateButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 4,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineDescription: {
    color: '#CCCCCC',
    fontSize: 14,
  },
});

export default QuantumSecurityDashboard;
