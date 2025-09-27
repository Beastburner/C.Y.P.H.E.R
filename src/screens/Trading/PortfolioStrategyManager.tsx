/**
 * CYPHER Portfolio Strategy Manager
 * Revolutionary automated trading strategies with advanced portfolio management
 * Features: DCA, Grid trading, AI-powered strategies, risk management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import CypherDesignSystem from '../../styles/CypherDesignSystem';
import AdvancedTradingService, {
  TradingStrategy,
  TradingPair
} from '../../services/AdvancedTradingService';

interface PortfolioStrategyManagerProps {
  navigation: any;
  route: any;
}

export default function PortfolioStrategyManager({ navigation, route }: PortfolioStrategyManagerProps) {
  const { colors, spacing, typography } = CypherDesignSystem;
  
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [showCreateStrategy, setShowCreateStrategy] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Strategy creation form
  const [strategyName, setStrategyName] = useState('');
  const [strategyType, setStrategyType] = useState<'dca' | 'grid' | 'momentum' | 'mean_reversion' | 'arbitrage'>('dca');
  const [selectedPairs, setSelectedPairs] = useState<string[]>([]);
  const [allocation, setAllocation] = useState<{ [key: string]: number }>({});
  const [riskSettings, setRiskSettings] = useState({
    maxDrawdown: 20,
    stopLoss: 10,
    takeProfit: 25,
    positionSize: 10
  });
  const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('daily');
  const [conditions, setConditions] = useState({
    rsiThreshold: 30,
    maCross: false,
    volumeThreshold: 1000000,
    priceChange: 5
  });

  const tradingService = AdvancedTradingService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const strategiesData = tradingService.getTradingStrategies();
      const pairsData = tradingService.getTradingPairs();
      
      setStrategies(strategiesData);
      setTradingPairs(pairsData);
    } catch (error) {
      console.error('Failed to load strategy data:', error);
    }
  };

  const handleCreateStrategy = async () => {
    if (!strategyName.trim()) {
      Alert.alert('Error', 'Please enter a strategy name');
      return;
    }

    if (selectedPairs.length === 0) {
      Alert.alert('Error', 'Please select at least one trading pair');
      return;
    }

    try {
      setLoading(true);
      
      const strategyData = {
        name: strategyName,
        type: strategyType,
        isActive: true,
        config: {
          pairs: selectedPairs,
          allocation,
          risk_management: {
            max_drawdown: riskSettings.maxDrawdown,
            stop_loss: riskSettings.stopLoss,
            take_profit: riskSettings.takeProfit,
            position_size: riskSettings.positionSize
          },
          frequency,
          conditions: {
            rsi_threshold: conditions.rsiThreshold,
            ma_cross: conditions.maCross,
            volume_threshold: conditions.volumeThreshold,
            price_change: conditions.priceChange
          }
        },
        performance: {
          total_return: 0,
          sharpe_ratio: 0,
          max_drawdown: 0,
          win_rate: 0,
          total_trades: 0,
          avg_trade_duration: 0
        }
      };

      const newStrategy = tradingService.createTradingStrategy(strategyData);
      
      Alert.alert(
        'Strategy Created',
        `${strategyName} strategy has been created and activated.`,
        [{ text: 'OK', onPress: () => {
          setShowCreateStrategy(false);
          resetForm();
          loadData();
        }}]
      );
    } catch (error) {
      console.error('Failed to create strategy:', error);
      Alert.alert('Error', 'Failed to create strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStrategy = async (strategyId: string, isActive: boolean) => {
    try {
      const updatedStrategy = tradingService.updateTradingStrategy(strategyId, { isActive });
      if (updatedStrategy) {
        loadData();
        Alert.alert(
          'Strategy Updated',
          `Strategy has been ${isActive ? 'activated' : 'deactivated'}.`
        );
      }
    } catch (error) {
      console.error('Failed to toggle strategy:', error);
      Alert.alert('Error', 'Failed to update strategy');
    }
  };

  const resetForm = () => {
    setStrategyName('');
    setStrategyType('dca');
    setSelectedPairs([]);
    setAllocation({});
    setRiskSettings({
      maxDrawdown: 20,
      stopLoss: 10,
      takeProfit: 25,
      positionSize: 10
    });
    setFrequency('daily');
    setConditions({
      rsiThreshold: 30,
      maCross: false,
      volumeThreshold: 1000000,
      priceChange: 5
    });
  };

  const handlePairSelection = (pairId: string) => {
    const isSelected = selectedPairs.includes(pairId);
    if (isSelected) {
      setSelectedPairs(selectedPairs.filter(id => id !== pairId));
      const newAllocation = { ...allocation };
      delete newAllocation[pairId];
      setAllocation(newAllocation);
    } else {
      setSelectedPairs([...selectedPairs, pairId]);
      setAllocation({
        ...allocation,
        [pairId]: Math.floor(100 / (selectedPairs.length + 1))
      });
    }
  };

  const handleAllocationChange = (pairId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocation({
      ...allocation,
      [pairId]: Math.min(100, Math.max(0, numValue))
    });
  };

  const getTotalAllocation = (): number => {
    return Object.values(allocation).reduce((sum, value) => sum + value, 0);
  };

  const getStrategyTypeDescription = (type: string): string => {
    const descriptions = {
      dca: 'Dollar Cost Averaging - Regular purchases regardless of price',
      grid: 'Grid Trading - Buy low, sell high within price ranges',
      momentum: 'Momentum Trading - Follow price trends and market momentum',
      mean_reversion: 'Mean Reversion - Buy oversold, sell overbought assets',
      arbitrage: 'Arbitrage - Exploit price differences across markets'
    };
    return descriptions[type as keyof typeof descriptions] || '';
  };

  const formatPerformance = (value: number, isPercentage: boolean = false): string => {
    if (isPercentage) {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    return value.toLocaleString();
  };

  const renderStrategyCard = (strategy: TradingStrategy) => (
    <View
      key={strategy.id}
      style={[
        styles.strategyCard,
        {
          backgroundColor: colors.backgroundSecondary,
          borderColor: colors.border,
          borderLeftColor: strategy.isActive ? colors.success : colors.textTertiary
        }
      ]}
    >
      <View style={styles.strategyHeader}>
        <View style={styles.strategyInfo}>
          <Text style={[styles.strategyName, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
            {strategy.name}
          </Text>
          <Text style={[styles.strategyType, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
            {strategy.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.strategyControls}>
          <Switch
            value={strategy.isActive}
            onValueChange={(value) => handleToggleStrategy(strategy.id, value)}
            trackColor={{ false: colors.textTertiary, true: colors.success }}
            thumbColor={strategy.isActive ? '#FFFFFF' : colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.strategyMetrics}>
        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Total Return
            </Text>
            <Text style={[
              styles.metricValue,
              {
                color: strategy.performance.total_return >= 0 ? colors.success : colors.error,
                fontSize: typography.fontSize.sm
              }
            ]}>
              {formatPerformance(strategy.performance.total_return, true)}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Sharpe Ratio
            </Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
              {strategy.performance.sharpe_ratio.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Win Rate
            </Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
              {formatPerformance(strategy.performance.win_rate, true)}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Max Drawdown
            </Text>
            <Text style={[styles.metricValue, { color: colors.error, fontSize: typography.fontSize.sm }]}>
              {formatPerformance(strategy.performance.max_drawdown, true)}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Total Trades
            </Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
              {formatPerformance(strategy.performance.total_trades)}
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Frequency
            </Text>
            <Text style={[styles.metricValue, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
              {strategy.config.frequency.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.strategyPairs}>
        <Text style={[styles.pairsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
          Trading Pairs:
        </Text>
        <Text style={[styles.pairsText, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
          {strategy.config.pairs.map(pairId => 
            tradingPairs.find(p => p.id === pairId)?.symbol
          ).join(', ')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('StrategyDetails', { strategy })}
      >
        <Text style={[styles.viewDetailsButtonText, { fontSize: typography.fontSize.sm }]}>
          View Details
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCreateStrategyForm = () => (
    <View style={[styles.createForm, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.formTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
        Create New Strategy
      </Text>

      {/* Strategy Name */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          Strategy Name
        </Text>
        <TextInput
          style={[
            styles.formInput,
            {
              backgroundColor: colors.backgroundTertiary,
              color: colors.textPrimary,
              borderColor: colors.border,
              fontSize: typography.fontSize.md
            }
          ]}
          value={strategyName}
          onChangeText={setStrategyName}
          placeholder="Enter strategy name"
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {/* Strategy Type */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          Strategy Type
        </Text>
        <View style={styles.typeSelector}>
          {(['dca', 'grid', 'momentum', 'mean_reversion', 'arbitrage'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                {
                  backgroundColor: strategyType === type ? colors.primary : colors.backgroundTertiary,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setStrategyType(type)}
            >
              <Text style={[
                styles.typeButtonText,
                {
                  color: strategyType === type ? '#FFFFFF' : colors.textPrimary,
                  fontSize: typography.fontSize.xs
                }
              ]}>
                {type.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.typeDescription, { color: colors.textTertiary, fontSize: typography.fontSize.xs }]}>
          {getStrategyTypeDescription(strategyType)}
        </Text>
      </View>

      {/* Trading Pairs Selection */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          Trading Pairs
        </Text>
        <View style={styles.pairsList}>
          {tradingPairs.map((pair) => (
            <TouchableOpacity
              key={pair.id}
              style={[
                styles.pairItem,
                {
                  backgroundColor: selectedPairs.includes(pair.id) ? colors.primary + '20' : colors.backgroundTertiary,
                  borderColor: selectedPairs.includes(pair.id) ? colors.primary : colors.border
                }
              ]}
              onPress={() => handlePairSelection(pair.id)}
            >
              <Text style={[
                styles.pairItemText,
                {
                  color: selectedPairs.includes(pair.id) ? colors.primary : colors.textPrimary,
                  fontSize: typography.fontSize.sm
                }
              ]}>
                {pair.symbol}
              </Text>
              {selectedPairs.includes(pair.id) && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Allocation Settings */}
      {selectedPairs.length > 0 && (
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
            Portfolio Allocation ({getTotalAllocation().toFixed(1)}%)
          </Text>
          {selectedPairs.map((pairId) => {
            const pair = tradingPairs.find(p => p.id === pairId);
            return (
              <View key={pairId} style={styles.allocationRow}>
                <Text style={[styles.allocationLabel, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                  {pair?.symbol}
                </Text>
                <TextInput
                  style={[
                    styles.allocationInput,
                    {
                      backgroundColor: colors.backgroundTertiary,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                      fontSize: typography.fontSize.sm
                    }
                  ]}
                  value={allocation[pairId]?.toString() || '0'}
                  onChangeText={(value) => handleAllocationChange(pairId, value)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={[styles.percentageSymbol, { color: colors.textSecondary }]}>%</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Risk Management */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          Risk Management
        </Text>
        
        <View style={styles.riskRow}>
          <Text style={[styles.riskLabel, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
            Max Drawdown
          </Text>
          <TextInput
            style={[
              styles.riskInput,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textPrimary,
                borderColor: colors.border,
                fontSize: typography.fontSize.sm
              }
            ]}
            value={riskSettings.maxDrawdown.toString()}
            onChangeText={(value) => setRiskSettings({
              ...riskSettings,
              maxDrawdown: parseFloat(value) || 0
            })}
            keyboardType="numeric"
          />
          <Text style={[styles.percentageSymbol, { color: colors.textSecondary }]}>%</Text>
        </View>

        <View style={styles.riskRow}>
          <Text style={[styles.riskLabel, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
            Stop Loss
          </Text>
          <TextInput
            style={[
              styles.riskInput,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textPrimary,
                borderColor: colors.border,
                fontSize: typography.fontSize.sm
              }
            ]}
            value={riskSettings.stopLoss.toString()}
            onChangeText={(value) => setRiskSettings({
              ...riskSettings,
              stopLoss: parseFloat(value) || 0
            })}
            keyboardType="numeric"
          />
          <Text style={[styles.percentageSymbol, { color: colors.textSecondary }]}>%</Text>
        </View>

        <View style={styles.riskRow}>
          <Text style={[styles.riskLabel, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
            Take Profit
          </Text>
          <TextInput
            style={[
              styles.riskInput,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textPrimary,
                borderColor: colors.border,
                fontSize: typography.fontSize.sm
              }
            ]}
            value={riskSettings.takeProfit.toString()}
            onChangeText={(value) => setRiskSettings({
              ...riskSettings,
              takeProfit: parseFloat(value) || 0
            })}
            keyboardType="numeric"
          />
          <Text style={[styles.percentageSymbol, { color: colors.textSecondary }]}>%</Text>
        </View>
      </View>

      {/* Frequency Selection */}
      <View style={styles.formGroup}>
        <Text style={[styles.formLabel, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
          Execution Frequency
        </Text>
        <View style={styles.frequencySelector}>
          {(['hourly', 'daily', 'weekly', 'monthly'] as const).map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                {
                  backgroundColor: frequency === freq ? colors.primary : colors.backgroundTertiary,
                  borderColor: colors.border
                }
              ]}
              onPress={() => setFrequency(freq)}
            >
              <Text style={[
                styles.frequencyButtonText,
                {
                  color: frequency === freq ? '#FFFFFF' : colors.textPrimary,
                  fontSize: typography.fontSize.sm
                }
              ]}>
                {freq.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.formActions}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.error }]}
          onPress={() => {
            setShowCreateStrategy(false);
            resetForm();
          }}
        >
          <Text style={[styles.cancelButtonText, { fontSize: typography.fontSize.sm }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            {
              backgroundColor: colors.success,
              opacity: loading ? 0.7 : 1
            }
          ]}
          onPress={handleCreateStrategy}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.createButtonText, { fontSize: typography.fontSize.sm }]}>
              Create Strategy
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showCreateStrategy) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowCreateStrategy(false)}
          >
            <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
            Create Strategy
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCreateStrategyForm()}
        </ScrollView>
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
          🎯 Strategy Manager
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateStrategy(true)}
        >
          <Text style={[styles.addIcon, { color: colors.primary }]}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Stats */}
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
            Portfolio Summary
          </Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Active Strategies
              </Text>
              <Text style={[styles.summaryValue, { color: colors.success, fontSize: typography.fontSize.lg }]}>
                {strategies.filter(s => s.isActive).length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Total Strategies  
              </Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
                {strategies.length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Avg. Performance
              </Text>
              <Text style={[styles.summaryValue, { color: colors.warning, fontSize: typography.fontSize.lg }]}>
                +12.5%
              </Text>
            </View>
          </View>
        </View>

        {/* Strategy List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
          Your Strategies ({strategies.length})
        </Text>

        {strategies.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.emptyStateIcon, { color: colors.textTertiary }]}>📊</Text>
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
              No Strategies Yet
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: typography.fontSize.sm }]}>
              Create your first automated trading strategy to start building your portfolio.
            </Text>
            <TouchableOpacity
              style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateStrategy(true)}
            >
              <Text style={[styles.createFirstButtonText, { fontSize: typography.fontSize.sm }]}>
                Create First Strategy
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          strategies.map(renderStrategyCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
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
  addButton: {
    padding: CypherDesignSystem.spacing.xs,
  },
  addIcon: {
    fontSize: 28,
    fontWeight: '600' as const,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: CypherDesignSystem.spacing.md,
  },
  summaryCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  summaryTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
  },
  summaryItem: {
    alignItems: 'center' as const,
  },
  summaryLabel: {
    fontWeight: '500' as const,
    marginBottom: CypherDesignSystem.spacing.xs,
  },
  summaryValue: {
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  strategyCard: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
    marginBottom: CypherDesignSystem.spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  strategyHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  strategyInfo: {
    flex: 1,
  },
  strategyName: {
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  strategyType: {
    fontWeight: '500' as const,
  },
  strategyControls: {
    alignItems: 'flex-end' as const,
  },
  strategyMetrics: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  metricRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: 'center' as const,
  },
  metricLabel: {
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  metricValue: {
    fontWeight: '600' as const,
  },
  strategyPairs: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  pairsLabel: {
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  pairsText: {
    fontWeight: '400' as const,
  },
  viewDetailsButton: {
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingHorizontal: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  emptyState: {
    padding: CypherDesignSystem.spacing.xl,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  emptyStateTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  emptyStateText: {
    textAlign: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.md,
    lineHeight: 20,
  },
  createFirstButton: {
    paddingVertical: CypherDesignSystem.spacing.md,
    paddingHorizontal: CypherDesignSystem.spacing.lg,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  createForm: {
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  formTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.lg,
    textAlign: 'center' as const,
  },
  formGroup: {
    marginBottom: CypherDesignSystem.spacing.lg,
  },
  formLabel: {
    fontWeight: '600' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  formInput: {
    paddingHorizontal: CypherDesignSystem.spacing.md,
    paddingVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    fontWeight: '500' as const,
  },
  typeSelector: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  typeButton: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: CypherDesignSystem.spacing.xs,
    marginBottom: CypherDesignSystem.spacing.xs,
  },
  typeButtonText: {
    fontWeight: '600' as const,
  },
  typeDescription: {
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  pairsList: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
  },
  pairItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: CypherDesignSystem.spacing.xs,
    marginBottom: CypherDesignSystem.spacing.xs,
  },
  pairItemText: {
    fontWeight: '500' as const,
    marginRight: CypherDesignSystem.spacing.xs,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  allocationRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  allocationLabel: {
    flex: 1,
    fontWeight: '500' as const,
  },
  allocationInput: {
    width: 80,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    marginRight: CypherDesignSystem.spacing.xs,
  },
  percentageSymbol: {
    width: 20,
    fontSize: CypherDesignSystem.typography.fontSize.sm,
  },
  riskRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  riskLabel: {
    flex: 1,
    fontWeight: '500' as const,
  },
  riskInput: {
    width: 80,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
    marginRight: CypherDesignSystem.spacing.xs,
  },
  frequencySelector: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center' as const,
    marginHorizontal: 2,
  },
  frequencyButtonText: {
    fontWeight: '600' as const,
  },
  formActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: CypherDesignSystem.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
    marginRight: CypherDesignSystem.spacing.sm,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  createButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: CypherDesignSystem.spacing.sm,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
};
