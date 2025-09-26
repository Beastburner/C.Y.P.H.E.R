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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import AdvancedDeFiService, { YieldFarm } from '../../services/advancedDeFiService';

interface YieldFarmingScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

/**
 * CYPHER Yield Farming Screen
 * Advanced yield farming interface with detailed analytics
 * Features: Multi-protocol farms, risk analysis, APY tracking
 */
const YieldFarmingScreen: React.FC<YieldFarmingScreenProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [yieldFarms, setYieldFarms] = useState<YieldFarm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<YieldFarm | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'name'>('apy');

  const defiService = AdvancedDeFiService.getInstance();

  useEffect(() => {
    loadYieldFarms();
  }, []);

  const loadYieldFarms = async () => {
    try {
      setLoading(true);
      const farms = await defiService.getAvailableYieldFarms();
      setYieldFarms(farms);
    } catch (error) {
      console.error('Failed to load yield farms:', error);
      Alert.alert('Error', 'Failed to load yield farms');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterFarm = async () => {
    if (!selectedFarm || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid deposit amount');
      return;
    }

    if (selectedFarm.minDeposit && amount < selectedFarm.minDeposit) {
      Alert.alert(
        'Minimum Deposit',
        `Minimum deposit for this farm is ${selectedFarm.minDeposit} ${selectedFarm.depositToken}`
      );
      return;
    }

    try {
      setLoading(true);
      const txHash = await defiService.enterYieldFarm(
        selectedFarm.id, 
        amount, 
        '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E'
      );
      
      Alert.alert(
        'Success! 🌾',
        `Successfully entered ${selectedFarm.name}!\n\nTransaction: ${txHash.slice(0, 10)}...`,
        [{ text: 'Awesome!', onPress: () => {
          setShowDepositModal(false);
          setDepositAmount('');
          setSelectedFarm(null);
        }}]
      );
    } catch (error) {
      console.error('Failed to enter farm:', error);
      Alert.alert('Error', 'Failed to enter yield farm');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedFarms = () => {
    let filtered = yieldFarms;

    // Apply risk filter
    if (filterRisk !== 'all') {
      filtered = filtered.filter(farm => farm.risk === filterRisk);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'apy':
          return b.apy - a.apy;
        case 'tvl':
          return b.tvl - a.tvl;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(2)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getRiskIcon = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lending': return '🏦';
      case 'staking': return '🔒';
      case 'liquidity-pool': return '💧';
      case 'single-asset': return '💰';
      default: return '🌾';
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
            🌾 Yield Farming
          </Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={loadYieldFarms}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Earn passive income through yield farming
        </Text>
      </LinearGradient>

      {/* Filters and Sorting */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filterRisk === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterRisk('all')}
          >
            <Text style={[styles.filterText, filterRisk === 'all' && styles.filterTextActive]}>
              All Farms
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterRisk === 'low' && styles.filterButtonActive]}
            onPress={() => setFilterRisk('low')}
          >
            <Text style={[styles.filterText, filterRisk === 'low' && styles.filterTextActive]}>
              🟢 Low Risk
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterRisk === 'medium' && styles.filterButtonActive]}
            onPress={() => setFilterRisk('medium')}
          >
            <Text style={[styles.filterText, filterRisk === 'medium' && styles.filterTextActive]}>
              🟡 Medium Risk
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterRisk === 'high' && styles.filterButtonActive]}
            onPress={() => setFilterRisk('high')}
          >
            <Text style={[styles.filterText, filterRisk === 'high' && styles.filterTextActive]}>
              🔴 High Risk
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'apy' && styles.sortButtonActive]}
            onPress={() => setSortBy('apy')}
          >
            <Text style={[styles.sortText, sortBy === 'apy' && styles.sortTextActive]}>APY</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'tvl' && styles.sortButtonActive]}
            onPress={() => setSortBy('tvl')}
          >
            <Text style={[styles.sortText, sortBy === 'tvl' && styles.sortTextActive]}>TVL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Yield Farms List */}
        {getFilteredAndSortedFarms().map((farm) => (
          <View key={farm.id} style={[cardStyle, styles.farmCard]}>
            <View style={styles.farmHeader}>
              <View style={styles.farmTitleSection}>
                <View style={styles.farmProtocolBadge}>
                  <Text style={styles.farmProtocolText}>{farm.protocol}</Text>
                </View>
                <Text style={styles.farmName}>{farm.name}</Text>
                <View style={styles.farmTags}>
                  <View style={styles.farmTag}>
                    <Text style={styles.farmTagText}>
                      {getCategoryIcon(farm.category)} {farm.category.replace('-', ' ')}
                    </Text>
                  </View>
                  <View style={[styles.farmRiskTag, { backgroundColor: getRiskColor(farm.risk) + '20' }]}>
                    <Text style={[styles.farmRiskText, { color: getRiskColor(farm.risk) }]}>
                      {getRiskIcon(farm.risk)} {farm.risk.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.farmApySection}>
                <Text style={styles.farmApyValue}>{farm.apy.toFixed(1)}%</Text>
                <Text style={styles.farmApyLabel}>APY</Text>
              </View>
            </View>

            <View style={styles.farmMetrics}>
              <View style={styles.farmMetric}>
                <Text style={styles.farmMetricLabel}>Total Value Locked</Text>
                <Text style={styles.farmMetricValue}>{formatCurrency(farm.tvl)}</Text>
              </View>
              
              <View style={styles.farmMetric}>
                <Text style={styles.farmMetricLabel}>Deposit Token</Text>
                <Text style={styles.farmMetricValue}>{farm.depositToken}</Text>
              </View>
              
              <View style={styles.farmMetric}>
                <Text style={styles.farmMetricLabel}>Rewards</Text>
                <Text style={styles.farmMetricValue}>{farm.rewards.join(', ')}</Text>
              </View>
            </View>

            {farm.lockPeriod && (
              <View style={styles.farmWarning}>
                <Text style={styles.farmWarningText}>
                  ⏱️ Lock Period: {farm.lockPeriod} days
                </Text>
              </View>
            )}

            {farm.minDeposit && (
              <View style={styles.farmInfo}>
                <Text style={styles.farmInfoText}>
                  Minimum Deposit: {farm.minDeposit} {farm.depositToken}
                </Text>
              </View>
            )}

            <View style={styles.farmActions}>
              <TouchableOpacity 
                style={styles.farmViewButton}
                onPress={() => {
                  Alert.alert(
                    farm.name,
                    `Protocol: ${farm.protocol}\nAPY: ${farm.apy}%\nTVL: ${formatCurrency(farm.tvl)}\nRisk: ${farm.risk}\nRewards: ${farm.rewards.join(', ')}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={styles.farmViewButtonText}>View Details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.farmEnterButton}
                onPress={() => {
                  setSelectedFarm(farm);
                  setShowDepositModal(true);
                }}
              >
                <Text style={styles.farmEnterButtonText}>Enter Farm</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {getFilteredAndSortedFarms().length === 0 && (
          <View style={[cardStyle, styles.emptyState]}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyTitle}>No Farms Found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your filters to see more opportunities
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Yield Farm</Text>
            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedFarm && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.farmPreview}>
                <Text style={styles.farmPreviewName}>{selectedFarm.name}</Text>
                <Text style={styles.farmPreviewProtocol}>{selectedFarm.protocol}</Text>
                <View style={styles.farmPreviewMetrics}>
                  <Text style={styles.farmPreviewApy}>{selectedFarm.apy.toFixed(1)}% APY</Text>
                  <Text style={styles.farmPreviewRisk}>
                    {getRiskIcon(selectedFarm.risk)} {selectedFarm.risk} risk
                  </Text>
                </View>
              </View>

              <View style={styles.depositSection}>
                <Text style={styles.depositLabel}>
                  Deposit Amount ({selectedFarm.depositToken})
                </Text>
                <TextInput
                  style={styles.depositInput}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  placeholder={`0.0 ${selectedFarm.depositToken}`}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
                
                {selectedFarm.minDeposit && (
                  <Text style={styles.depositHint}>
                    Minimum deposit: {selectedFarm.minDeposit} {selectedFarm.depositToken}
                  </Text>
                )}
              </View>

              <View style={styles.rewardsInfo}>
                <Text style={styles.rewardsTitle}>Expected Rewards</Text>
                <Text style={styles.rewardsDescription}>
                  You'll earn {selectedFarm.rewards.join(' + ')} tokens for providing liquidity
                </Text>
                
                {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                  <View style={styles.projections}>
                    <Text style={styles.projectionTitle}>Earnings Projection</Text>
                    <Text style={styles.projectionItem}>
                      Daily: ~${((parseFloat(depositAmount) * selectedFarm.apy / 100) / 365).toFixed(2)}
                    </Text>
                    <Text style={styles.projectionItem}>
                      Monthly: ~${((parseFloat(depositAmount) * selectedFarm.apy / 100) / 12).toFixed(2)}
                    </Text>
                    <Text style={styles.projectionItem}>
                      Yearly: ~${(parseFloat(depositAmount) * selectedFarm.apy / 100).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.riskWarning}>
                <Text style={styles.riskWarningTitle}>⚠️ Risk Disclosure</Text>
                <Text style={styles.riskWarningText}>
                  Yield farming involves smart contract risk, impermanent loss (for LP tokens), and potential token price volatility. 
                  Always do your own research and never invest more than you can afford to lose.
                </Text>
              </View>

              <Button
                title="Confirm Deposit"
                onPress={handleEnterFarm}
                loading={loading}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0}
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
  },
  filtersContainer: {
    backgroundColor: '#0F172A',
    paddingVertical: 16,
  },
  filters: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#1E293B',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  sortTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  farmCard: {
    marginBottom: 16,
  },
  farmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  farmTitleSection: {
    flex: 1,
  },
  farmProtocolBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  farmProtocolText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  farmName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  farmTags: {
    flexDirection: 'row',
    gap: 8,
  },
  farmTag: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  farmTagText: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  farmRiskTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  farmRiskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  farmApySection: {
    alignItems: 'flex-end',
  },
  farmApyValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  farmApyLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  farmMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  farmMetric: {
    flex: 1,
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
  farmWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  farmWarningText: {
    fontSize: 12,
    color: '#FCD34D',
  },
  farmInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  farmInfoText: {
    fontSize: 12,
    color: '#93C5FD',
  },
  farmActions: {
    flexDirection: 'row',
    gap: 12,
  },
  farmViewButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  farmViewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  farmEnterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  farmEnterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
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
  },
  // Modal styles
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
  farmPreview: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  farmPreviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  farmPreviewProtocol: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 12,
  },
  farmPreviewMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  farmPreviewApy: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  farmPreviewRisk: {
    fontSize: 14,
    color: '#94A3B8',
  },
  depositSection: {
    marginBottom: 24,
  },
  depositLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  depositInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#F1F5F9',
    marginBottom: 8,
  },
  depositHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rewardsInfo: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  rewardsDescription: {
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
  riskWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  riskWarningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F87171',
    marginBottom: 8,
  },
  riskWarningText: {
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

export default YieldFarmingScreen;
