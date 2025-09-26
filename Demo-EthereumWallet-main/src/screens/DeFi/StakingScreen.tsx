import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import AdvancedDeFiService, { StakingPosition } from '../../services/advancedDeFiService';

interface StakingScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const { width } = Dimensions.get('window');

/**
 * CYPHER Advanced Staking Screen
 * Comprehensive staking interface with multi-protocol support
 * Features: ETH 2.0, liquid staking, governance tokens, rewards tracking
 */
const StakingScreen: React.FC<StakingScreenProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [availableStaking, setAvailableStaking] = useState<any[]>([]);
  const [selectedStaking, setSelectedStaking] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-stakes' | 'opportunities'>('my-stakes');
  const [totalStaked, setTotalStaked] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);

  const defiService = AdvancedDeFiService.getInstance();

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    try {
      setLoading(true);
      // Mock staking positions for now
      const mockPositions: StakingPosition[] = [
        {
          id: 'stake-1',
          protocol: 'Ethereum',
          token: 'ETH',
          amount: 2.5,
          apy: 5.2,
          rewards: 0.05,
          status: 'active',
          startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          lockPeriod: 365, // days
          autoCompound: true
        },
        {
          id: 'stake-2',
          protocol: 'Lido',
          token: 'stETH',
          amount: 1.2,
          apy: 4.8,
          rewards: 0.02,
          status: 'active',
          startDate: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
          lockPeriod: 0, // no lock period
          autoCompound: false
        }
      ];
      
      const opportunities = await getAvailableStakingOpportunities();
      
      setStakingPositions(mockPositions);
      setAvailableStaking(opportunities);
      
      // Calculate totals
      const total = mockPositions.reduce((sum: number, pos: StakingPosition) => sum + pos.amount, 0);
      const rewards = mockPositions.reduce((sum: number, pos: StakingPosition) => sum + pos.rewards, 0);
      setTotalStaked(total);
      setTotalRewards(rewards);
    } catch (error) {
      console.error('Failed to load staking data:', error);
      Alert.alert('Error', 'Failed to load staking data');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStakingOpportunities = async () => {
    // Mock staking opportunities with different protocols
    return [
      {
        id: 'eth2-staking',
        name: 'Ethereum 2.0 Staking',
        protocol: 'Ethereum',
        token: 'ETH',
        apy: 5.2,
        type: 'validator',
        minStake: 0.01,
        maxStake: 32,
        lockPeriod: 'Until ETH 2.0 merge',
        risk: 'medium',
        description: 'Direct ETH 2.0 validator staking with slashing risk',
        icon: '🔒',
        color: '#627EEA'
      },
      {
        id: 'lido-steth',
        name: 'Lido Liquid Staking',
        protocol: 'Lido',
        token: 'ETH',
        apy: 4.8,
        type: 'liquid',
        minStake: 0.001,
        maxStake: null,
        lockPeriod: null,
        risk: 'low',
        description: 'Liquid staking with stETH tokens, no lock period',
        icon: '💧',
        color: '#00A3FF'
      },
      {
        id: 'rocket-pool',
        name: 'Rocket Pool rETH',
        protocol: 'Rocket Pool',
        token: 'ETH',
        apy: 4.9,
        type: 'liquid',
        minStake: 0.01,
        maxStake: null,
        lockPeriod: null,
        risk: 'low',
        description: 'Decentralized liquid staking protocol',
        icon: '🚀',
        color: '#FF6B35'
      },
      {
        id: 'compound-comp',
        name: 'COMP Governance Staking',
        protocol: 'Compound',
        token: 'COMP',
        apy: 12.4,
        type: 'governance',
        minStake: 1,
        maxStake: null,
        lockPeriod: null,
        risk: 'high',
        description: 'Stake COMP for governance rewards and voting power',
        icon: '🏛️',
        color: '#00D395'
      },
      {
        id: 'aave-staking',
        name: 'AAVE Safety Module',
        protocol: 'AAVE',
        token: 'AAVE',
        apy: 8.7,
        type: 'safety-module',
        minStake: 0.1,
        maxStake: null,
        lockPeriod: '10 days cooldown',
        risk: 'medium',
        description: 'Stake AAVE to secure the protocol and earn rewards',
        icon: '🛡️',
        color: '#B6509E'
      },
      {
        id: 'curve-crv',
        name: 'Curve veCRV Locking',
        protocol: 'Curve',
        token: 'CRV',
        apy: 15.3,
        type: 'vote-escrow',
        minStake: 1,
        maxStake: null,
        lockPeriod: 'Up to 4 years',
        risk: 'high',
        description: 'Lock CRV for boosted rewards and governance power',
        icon: '🔐',
        color: '#40E0D0'
      }
    ];
  };

  const handleStake = async () => {
    if (!selectedStaking || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid stake amount');
      return;
    }

    if (selectedStaking.minStake && amount < selectedStaking.minStake) {
      Alert.alert(
        'Minimum Stake',
        `Minimum stake for ${selectedStaking.name} is ${selectedStaking.minStake} ${selectedStaking.token}`
      );
      return;
    }

    if (selectedStaking.maxStake && amount > selectedStaking.maxStake) {
      Alert.alert(
        'Maximum Stake',
        `Maximum stake for ${selectedStaking.name} is ${selectedStaking.maxStake} ${selectedStaking.token}`
      );
      return;
    }

    try {
      setLoading(true);
      
      // Mock staking transaction
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      Alert.alert(
        'Staking Successful! 🎉',
        `Successfully staked ${amount} ${selectedStaking.token} in ${selectedStaking.name}!\n\nTransaction: ${txHash.slice(0, 10)}...`,
        [{ text: 'Great!', onPress: () => {
          setShowStakeModal(false);
          setStakeAmount('');
          setSelectedStaking(null);
          loadStakingData();
        }}]
      );
    } catch (error) {
      console.error('Failed to stake:', error);
      Alert.alert('Error', 'Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async (position: StakingPosition) => {
    Alert.alert(
      'Unstake Tokens',
      `Are you sure you want to unstake ${position.amount} ${position.token}?\n\nNote: ${position.lockPeriod ? 'There may be a cooldown period.' : 'This action is immediate.'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unstake', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Mock unstaking
              const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
              Alert.alert('Unstaking Initiated', `Transaction: ${txHash.slice(0, 10)}...`);
              loadStakingData();
            } catch (error) {
              Alert.alert('Error', 'Failed to unstake tokens');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleClaimRewards = async (position: StakingPosition) => {
    if (position.rewards <= 0) {
      Alert.alert('No Rewards', 'No rewards available to claim');
      return;
    }

    try {
      setLoading(true);
      // Mock claim transaction
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      Alert.alert(
        'Rewards Claimed! 💰',
        `Successfully claimed ${position.rewards.toFixed(4)} ${position.token} rewards!\n\nTransaction: ${txHash.slice(0, 10)}...`
      );
      loadStakingData();
    } catch (error) {
      Alert.alert('Error', 'Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'validator': return '🔒';
      case 'liquid': return '💧';
      case 'governance': return '🏛️';
      case 'safety-module': return '🛡️';
      case 'vote-escrow': return '🔐';
      default: return '💰';
    }
  };

  const cardStyle = createCardStyle('elevated');

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
            onPress={() => onNavigate('DeFi')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            🔒 Staking Hub
          </Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={loadStakingData}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Earn rewards by securing networks
        </Text>

        {/* Portfolio Summary */}
        <View style={styles.portfolioSummary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Staked</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalStaked * 2000)}</Text>
            <Text style={styles.summarySubtext}>{totalStaked.toFixed(4)} tokens</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Rewards</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalRewards * 2000)}</Text>
            <Text style={styles.summarySubtext}>{totalRewards.toFixed(4)} tokens</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-stakes' && styles.activeTab]}
          onPress={() => setActiveTab('my-stakes')}
        >
          <Text style={[styles.tabText, activeTab === 'my-stakes' && styles.activeTabText]}>
            My Stakes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opportunities' && styles.activeTab]}
          onPress={() => setActiveTab('opportunities')}
        >
          <Text style={[styles.tabText, activeTab === 'opportunities' && styles.activeTabText]}>
            Opportunities
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'my-stakes' ? (
          /* My Staking Positions */
          <>
            {stakingPositions.length > 0 ? (
              stakingPositions.map((position) => (
                <View key={position.id} style={[cardStyle, styles.positionCard]}>
                  <View style={styles.positionHeader}>
                    <View style={styles.positionTitleSection}>
                      <View style={[styles.protocolBadge, { backgroundColor: position.protocol === 'Ethereum' ? '#627EEA' : '#3B82F6' }]}>
                        <Text style={styles.protocolText}>{position.protocol}</Text>
                      </View>
                      <Text style={styles.positionName}>{position.protocol} Staking</Text>
                      <Text style={styles.positionType}>
                        {getTypeIcon('validator')} Validator Staking
                      </Text>
                    </View>
                    
                    <View style={styles.positionValueSection}>
                      <Text style={styles.positionValue}>
                        {position.amount.toFixed(4)} {position.token}
                      </Text>
                      <Text style={styles.positionValueUsd}>
                        {formatCurrency(position.amount * 2000)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.positionMetrics}>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>APY</Text>
                      <Text style={styles.metricValue}>{position.apy.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Rewards</Text>
                      <Text style={styles.metricValue}>{position.rewards.toFixed(4)}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Text style={styles.metricLabel}>Status</Text>
                      <Text style={[styles.metricValue, { color: position.status === 'active' ? '#10B981' : '#F59E0B' }]}>
                        {position.status}
                      </Text>
                    </View>
                  </View>

                  {position.lockPeriod > 0 && (
                    <View style={styles.lockInfo}>
                      <Text style={styles.lockText}>
                        🔒 Lock Period: {position.lockPeriod} days
                      </Text>
                    </View>
                  )}

                  <View style={styles.positionActions}>
                    <TouchableOpacity 
                      style={styles.claimButton}
                      onPress={() => handleClaimRewards(position)}
                      disabled={position.rewards <= 0}
                    >
                      <Text style={[styles.claimButtonText, position.rewards <= 0 && styles.disabledText]}>
                        Claim Rewards
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.unstakeButton}
                      onPress={() => handleUnstake(position)}
                    >
                      <Text style={styles.unstakeButtonText}>Unstake</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={[cardStyle, styles.emptyState]}>
                <Text style={styles.emptyIcon}>🔒</Text>
                <Text style={styles.emptyTitle}>No Active Stakes</Text>
                <Text style={styles.emptyDescription}>
                  Start staking to earn passive rewards and secure networks
                </Text>
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => setActiveTab('opportunities')}
                >
                  <Text style={styles.exploreButtonText}>Explore Opportunities</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* Staking Opportunities */
          <>
            {availableStaking.map((opportunity) => (
              <View key={opportunity.id} style={[cardStyle, styles.opportunityCard]}>
                <View style={styles.opportunityHeader}>
                  <View style={styles.opportunityIcon}>
                    <Text style={styles.opportunityIconText}>{opportunity.icon}</Text>
                  </View>
                  <View style={styles.opportunityTitleSection}>
                    <View style={[styles.protocolBadge, { backgroundColor: opportunity.color }]}>
                      <Text style={styles.protocolText}>{opportunity.protocol}</Text>
                    </View>
                    <Text style={styles.opportunityName}>{opportunity.name}</Text>
                    <Text style={styles.opportunityType}>
                      {getTypeIcon(opportunity.type)} {opportunity.type.replace('-', ' ')}
                    </Text>
                  </View>
                  
                  <View style={styles.opportunityApySection}>
                    <Text style={styles.opportunityApy}>{opportunity.apy.toFixed(1)}%</Text>
                    <Text style={styles.opportunityApyLabel}>APY</Text>
                  </View>
                </View>

                <Text style={styles.opportunityDescription}>
                  {opportunity.description}
                </Text>

                <View style={styles.opportunityDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Token:</Text>
                    <Text style={styles.detailValue}>{opportunity.token}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Min Stake:</Text>
                    <Text style={styles.detailValue}>
                      {opportunity.minStake} {opportunity.token}
                    </Text>
                  </View>
                  
                  {opportunity.maxStake && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Max Stake:</Text>
                      <Text style={styles.detailValue}>
                        {opportunity.maxStake} {opportunity.token}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Lock Period:</Text>
                    <Text style={styles.detailValue}>
                      {opportunity.lockPeriod || 'None'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Risk Level:</Text>
                    <Text style={[styles.detailValue, { color: getRiskColor(opportunity.risk) }]}>
                      {opportunity.risk.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.stakeButton}
                  onPress={() => {
                    setSelectedStaking(opportunity);
                    setShowStakeModal(true);
                  }}
                >
                  <Text style={styles.stakeButtonText}>Stake Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Stake Modal */}
      <Modal
        visible={showStakeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStakeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Stake Tokens</Text>
            <TouchableOpacity onPress={() => setShowStakeModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedStaking && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.stakingPreview}>
                <Text style={styles.stakingPreviewIcon}>{selectedStaking.icon}</Text>
                <Text style={styles.stakingPreviewName}>{selectedStaking.name}</Text>
                <Text style={styles.stakingPreviewProtocol}>{selectedStaking.protocol}</Text>
                <View style={styles.stakingPreviewMetrics}>
                  <Text style={styles.stakingPreviewApy}>{selectedStaking.apy.toFixed(1)}% APY</Text>
                  <Text style={[styles.stakingPreviewRisk, { color: getRiskColor(selectedStaking.risk) }]}>
                    {selectedStaking.risk.toUpperCase()} RISK
                  </Text>
                </View>
              </View>

              <View style={styles.stakeSection}>
                <Text style={styles.stakeLabel}>
                  Stake Amount ({selectedStaking.token})
                </Text>
                <TextInput
                  style={styles.stakeInput}
                  value={stakeAmount}
                  onChangeText={setStakeAmount}
                  placeholder={`0.0 ${selectedStaking.token}`}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
                
                <View style={styles.stakeLimits}>
                  <Text style={styles.stakeLimitText}>
                    Min: {selectedStaking.minStake} {selectedStaking.token}
                  </Text>
                  {selectedStaking.maxStake && (
                    <Text style={styles.stakeLimitText}>
                      Max: {selectedStaking.maxStake} {selectedStaking.token}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.stakingInfo}>
                <Text style={styles.stakingInfoTitle}>Staking Details</Text>
                <Text style={styles.stakingInfoDescription}>
                  {selectedStaking.description}
                </Text>
                
                {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                  <View style={styles.projections}>
                    <Text style={styles.projectionTitle}>Rewards Projection</Text>
                    <Text style={styles.projectionItem}>
                      Daily: ~{((parseFloat(stakeAmount) * selectedStaking.apy / 100) / 365).toFixed(6)} {selectedStaking.token}
                    </Text>
                    <Text style={styles.projectionItem}>
                      Monthly: ~{((parseFloat(stakeAmount) * selectedStaking.apy / 100) / 12).toFixed(4)} {selectedStaking.token}
                    </Text>
                    <Text style={styles.projectionItem}>
                      Yearly: ~{(parseFloat(stakeAmount) * selectedStaking.apy / 100).toFixed(4)} {selectedStaking.token}
                    </Text>
                  </View>
                )}
              </View>

              {selectedStaking.lockPeriod && (
                <View style={styles.lockWarning}>
                  <Text style={styles.lockWarningTitle}>🔒 Lock Period Notice</Text>
                  <Text style={styles.lockWarningText}>
                    Your tokens will be locked for: {selectedStaking.lockPeriod}
                  </Text>
                </View>
              )}

              <View style={styles.riskDisclosure}>
                <Text style={styles.riskDisclosureTitle}>⚠️ Risk Disclosure</Text>
                <Text style={styles.riskDisclosureText}>
                  Staking involves risks including but not limited to slashing, smart contract bugs, and token price volatility. 
                  {selectedStaking.risk === 'high' && ' This is a high-risk opportunity with potential for significant losses.'}
                  {selectedStaking.risk === 'medium' && ' This carries moderate risk with some potential for losses.'}
                  {selectedStaking.risk === 'low' && ' This is considered low risk but not risk-free.'}
                </Text>
              </View>

              <Button
                title="Confirm Stake"
                onPress={handleStake}
                loading={loading}
                disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
                style={styles.confirmButton}
              />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
    marginBottom: 20,
  },
  portfolioSummary: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  summarySubtext: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
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
  // Position Card Styles
  positionCard: {
    marginBottom: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  positionTitleSection: {
    flex: 1,
  },
  protocolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  protocolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  positionType: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  positionValueSection: {
    alignItems: 'flex-end',
  },
  positionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  positionValueUsd: {
    fontSize: 12,
    color: '#94A3B8',
  },
  positionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  lockInfo: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lockText: {
    fontSize: 12,
    color: '#FCD34D',
  },
  positionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  claimButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledText: {
    color: '#94A3B8',
  },
  unstakeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  unstakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Opportunity Card Styles
  opportunityCard: {
    marginBottom: 16,
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  opportunityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  opportunityIconText: {
    fontSize: 24,
  },
  opportunityTitleSection: {
    flex: 1,
  },
  opportunityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  opportunityType: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  opportunityApySection: {
    alignItems: 'flex-end',
  },
  opportunityApy: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  opportunityApyLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 16,
  },
  opportunityDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  stakeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  stakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
    marginBottom: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  modalClose: {
    fontSize: 24,
    color: '#94A3B8',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  stakingPreview: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  stakingPreviewIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  stakingPreviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  stakingPreviewProtocol: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 12,
  },
  stakingPreviewMetrics: {
    flexDirection: 'row',
    gap: 20,
  },
  stakingPreviewApy: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  stakingPreviewRisk: {
    fontSize: 14,
    fontWeight: '500',
  },
  stakeSection: {
    marginBottom: 24,
  },
  stakeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  stakeInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#F1F5F9',
    marginBottom: 8,
  },
  stakeLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stakeLimitText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stakingInfo: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  stakingInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  stakingInfoDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 16,
  },
  projections: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  projectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 8,
  },
  projectionItem: {
    fontSize: 13,
    color: '#E2E8F0',
    marginBottom: 4,
  },
  lockWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  lockWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FCD34D',
    marginBottom: 8,
  },
  lockWarningText: {
    fontSize: 12,
    color: '#FCD34D',
    lineHeight: 18,
  },
  riskDisclosure: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  riskDisclosureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 8,
  },
  riskDisclosureText: {
    fontSize: 12,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
  },
});

export default StakingScreen;
