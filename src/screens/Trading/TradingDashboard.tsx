/**
 * CYPHER Trading Dashboard
 * Revolutionary professional trading interface with advanced features
 * Features: Real-time charts, order book, trade execution, portfolio tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import CypherDesignSystem from '../../styles/CypherDesignSystem';
import AdvancedTradingService, {
  TradingPair,
  OrderBook,
  TradingOrder,
  ChartData,
  TradingAnalytics
} from '../../services/AdvancedTradingService';

const { width, height } = Dimensions.get('window');

interface TradingDashboardProps {
  navigation: any;
  route: any;
}

export default function TradingDashboard({ navigation, route }: TradingDashboardProps) {
  const { colors, spacing, typography, shadows } = CypherDesignSystem;
  
  // State management
  const [selectedPair, setSelectedPair] = useState<string>('eth_usdc');
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activeOrders, setActiveOrders] = useState<TradingOrder[]>([]);
  const [analytics, setAnalytics] = useState<TradingAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'orders' | 'analytics'>('trade');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop_loss'>('market');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderAmount, setOrderAmount] = useState<string>('');
  const [orderPrice, setOrderPrice] = useState<string>('');
  const [stopPrice, setStopPrice] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h' | '1d'>('1h');
  const [loading, setLoading] = useState(false);

  const tradingService = AdvancedTradingService.getInstance();

  useEffect(() => {
    loadTradingData();
    const interval = setInterval(loadTradingData, 5000);
    return () => clearInterval(interval);
  }, [selectedPair, timeframe]);

  const loadTradingData = async () => {
    try {
      const pairs = tradingService.getTradingPairs();
      const orderBookData = tradingService.getOrderBook(selectedPair);
      const chartDataResult = tradingService.getChartData(selectedPair, timeframe);
      const ordersData = tradingService.getActiveOrders('user_123'); // Mock user ID
      const analyticsData = await tradingService.getTradingAnalytics('user_123');

      setTradingPairs(pairs);
      setOrderBook(orderBookData || null);
      setChartData(chartDataResult);
      setActiveOrders(ordersData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load trading data:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderAmount || parseFloat(orderAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!orderPrice || parseFloat(orderPrice) <= 0)) {
      Alert.alert('Error', 'Please enter a valid price for limit order');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        userId: 'user_123', // Mock user ID
        pairId: selectedPair,
        type: orderType,
        side: orderSide,
        amount: parseFloat(orderAmount),
        price: orderType === 'limit' ? parseFloat(orderPrice) : undefined,
        stopPrice: orderType === 'stop_loss' ? parseFloat(stopPrice) : undefined,
        fees: {
          trading: 0,
          gas: 0,
          total: 0
        },
        metadata: {
          source: 'dex' as const,
          slippage: 0.5,
          priority: 'medium' as const
        }
      };

      const order = await tradingService.placeOrder(orderData);
      
      Alert.alert(
        'Order Placed',
        `${orderType.toUpperCase()} ${orderSide.toUpperCase()} order for ${orderAmount} ${getTradingPair()?.baseToken} has been placed.`,
        [{ text: 'OK', onPress: () => {
          setOrderAmount('');
          setOrderPrice('');
          setStopPrice('');
          loadTradingData();
        }}]
      );
    } catch (error) {
      console.error('Failed to place order:', error);
      Alert.alert('Error', 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const success = await tradingService.cancelOrder(orderId);
      if (success) {
        Alert.alert('Success', 'Order cancelled successfully');
        loadTradingData();
      } else {
        Alert.alert('Error', 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      Alert.alert('Error', 'Failed to cancel order');
    }
  };

  const getTradingPair = (): TradingPair | undefined => {
    return tradingPairs.find(pair => pair.id === selectedPair);
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const renderPairSelector = () => (
    <View style={[styles.pairSelector, { backgroundColor: colors.backgroundSecondary }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tradingPairs.map((pair) => (
          <TouchableOpacity
            key={pair.id}
            style={[
              styles.pairButton,
              {
                backgroundColor: selectedPair === pair.id ? colors.primary : 'transparent',
                borderColor: colors.border
              }
            ]}
            onPress={() => setSelectedPair(pair.id)}
          >
            <Text style={[
              styles.pairSymbol,
              {
                color: selectedPair === pair.id ? '#FFFFFF' : colors.textPrimary,
                fontSize: typography.fontSize.sm
              }
            ]}>
              {pair.symbol}
            </Text>
            <Text style={[
              styles.pairPrice,
              {
                color: selectedPair === pair.id ? '#FFFFFF' : colors.textSecondary,
                fontSize: typography.fontSize.xs
              }
            ]}>
              ${formatPrice(pair.price)}
            </Text>
            <Text style={[
              styles.pairChange,
              {
                color: pair.priceChange24h >= 0 ? colors.success : colors.error,
                fontSize: typography.fontSize.xs
              }
            ]}>
              {formatPercentage(pair.priceChange24h)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderChart = () => {
    const currentPair = getTradingPair();
    if (!currentPair) return null;

    return (
      <View style={[styles.chartContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
              {currentPair.symbol}
            </Text>
            <Text style={[styles.chartPrice, { color: colors.textPrimary, fontSize: typography.fontSize.xl }]}>
              ${formatPrice(currentPair.price)}
            </Text>
            <Text style={[
              styles.chartChange,
              {
                color: currentPair.priceChange24h >= 0 ? colors.success : colors.error,
                fontSize: typography.fontSize.md
              }
            ]}>
              {formatPercentage(currentPair.priceChange24h)}
            </Text>
          </View>
          
          <View style={styles.timeframeSelector}>
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframeButton,
                  {
                    backgroundColor: timeframe === tf ? colors.primary : 'transparent',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text style={[
                  styles.timeframeText,
                  {
                    color: timeframe === tf ? '#FFFFFF' : colors.textSecondary,
                    fontSize: typography.fontSize.xs
                  }
                ]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mock Chart Area */}
        <View style={[styles.chartArea, { backgroundColor: colors.backgroundTertiary }]}>
          <Text style={[styles.chartPlaceholder, { color: colors.textTertiary }]}>
            📈 Chart Visualization
          </Text>
          <Text style={[styles.chartSubtext, { color: colors.textTertiary }]}>
            Real-time price chart would be rendered here
          </Text>
        </View>
      </View>
    );
  };

  const renderOrderBook = () => {
    if (!orderBook) return null;

    return (
      <View style={[styles.orderBookContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
          Order Book
        </Text>
        
        <View style={styles.orderBookContent}>
          {/* Asks (Sell Orders) */}
          <View style={styles.orderBookSide}>
            <Text style={[styles.orderBookHeader, { color: colors.error }]}>
              Asks (Sell)
            </Text>
            {orderBook.asks.slice(0, 8).reverse().map((ask, index) => (
              <View key={index} style={styles.orderBookRow}>
                <Text style={[styles.orderBookPrice, { color: colors.error, fontSize: typography.fontSize.xs }]}>
                  {formatPrice(ask.price)}
                </Text>
                <Text style={[styles.orderBookQuantity, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  {ask.quantity.toFixed(4)}
                </Text>
              </View>
            ))}
          </View>

          {/* Spread */}
          <View style={styles.spreadContainer}>
            <Text style={[styles.spreadText, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Spread: ${orderBook.spread.toFixed(4)}
            </Text>
          </View>

          {/* Bids (Buy Orders) */}
          <View style={styles.orderBookSide}>
            <Text style={[styles.orderBookHeader, { color: colors.success }]}>
              Bids (Buy)
            </Text>
            {orderBook.bids.slice(0, 8).map((bid, index) => (
              <View key={index} style={styles.orderBookRow}>
                <Text style={[styles.orderBookPrice, { color: colors.success, fontSize: typography.fontSize.xs }]}>
                  {formatPrice(bid.price)}
                </Text>
                <Text style={[styles.orderBookQuantity, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  {bid.quantity.toFixed(4)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderTradePanel = () => (
    <View style={[styles.tradePanelContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
        Place Order
      </Text>

      {/* Order Type Selector */}
      <View style={styles.orderTypeSelector}>
        {(['market', 'limit', 'stop_loss'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.orderTypeButton,
              {
                backgroundColor: orderType === type ? colors.primary : 'transparent',
                borderColor: colors.border
              }
            ]}
            onPress={() => setOrderType(type)}
          >
            <Text style={[
              styles.orderTypeText,
              {
                color: orderType === type ? '#FFFFFF' : colors.textSecondary,
                fontSize: typography.fontSize.xs
              }
            ]}>
              {type.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buy/Sell Selector */}
      <View style={styles.orderSideSelector}>
        <TouchableOpacity
          style={[
            styles.orderSideButton,
            {
              backgroundColor: orderSide === 'buy' ? colors.success : 'transparent',
              borderColor: colors.success
            }
          ]}
          onPress={() => setOrderSide('buy')}
        >
          <Text style={[
            styles.orderSideText,
            {
              color: orderSide === 'buy' ? '#FFFFFF' : colors.success,
              fontSize: typography.fontSize.sm
            }
          ]}>
            BUY
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.orderSideButton,
            {
              backgroundColor: orderSide === 'sell' ? colors.error : 'transparent',
              borderColor: colors.error
            }
          ]}
          onPress={() => setOrderSide('sell')}
        >
          <Text style={[
            styles.orderSideText,
            {
              color: orderSide === 'sell' ? '#FFFFFF' : colors.error,
              fontSize: typography.fontSize.sm
            }
          ]}>
            SELL
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Inputs */}
      <View style={styles.orderInputs}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
            Amount
          </Text>
          <TextInput
            style={[
              styles.orderInput,
              {
                backgroundColor: colors.backgroundTertiary,
                color: colors.textPrimary,
                borderColor: colors.border,
                fontSize: typography.fontSize.md
              }
            ]}
            value={orderAmount}
            onChangeText={setOrderAmount}
            placeholder="0.0"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        {orderType === 'limit' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Price
            </Text>
            <TextInput
              style={[
                styles.orderInput,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  fontSize: typography.fontSize.md
                }
              ]}
              value={orderPrice}
              onChangeText={setOrderPrice}
              placeholder="0.0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        )}

        {orderType === 'stop_loss' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Stop Price
            </Text>
            <TextInput
              style={[
                styles.orderInput,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                  fontSize: typography.fontSize.md
                }
              ]}
              value={stopPrice}
              onChangeText={setStopPrice}
              placeholder="0.0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        )}
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        style={[
          styles.placeOrderButton,
          {
            backgroundColor: orderSide === 'buy' ? colors.success : colors.error,
            opacity: loading ? 0.7 : 1
          }
        ]}
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.placeOrderButtonText, { fontSize: typography.fontSize.md }]}>
            {orderSide === 'buy' ? 'BUY' : 'SELL'} {getTradingPair()?.baseToken}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderActiveOrders = () => (
    <ScrollView style={[styles.ordersContainer, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
        Active Orders ({activeOrders.length})
      </Text>
      
      {activeOrders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.textTertiary }]}>
            No active orders
          </Text>
        </View>
      ) : (
        activeOrders.map((order) => (
          <View key={order.id} style={[styles.orderItem, { backgroundColor: colors.backgroundTertiary, borderColor: colors.border }]}>
            <View style={styles.orderItemHeader}>
              <Text style={[styles.orderPair, { color: colors.textPrimary, fontSize: typography.fontSize.sm }]}>
                {tradingPairs.find(p => p.id === order.pairId)?.symbol}
              </Text>
              <Text style={[
                styles.orderSide,
                {
                  color: order.side === 'buy' ? colors.success : colors.error,
                  fontSize: typography.fontSize.xs
                }
              ]}>
                {order.side.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.orderItemDetails}>
              <Text style={[styles.orderDetail, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Type: {order.type.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={[styles.orderDetail, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                Amount: {order.amount.toFixed(4)}
              </Text>
              {order.price && (
                <Text style={[styles.orderDetail, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
                  Price: ${formatPrice(order.price)}
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.cancelOrderButton, { backgroundColor: colors.error }]}
              onPress={() => handleCancelOrder(order.id)}
            >
              <Text style={[styles.cancelOrderButtonText, { fontSize: typography.fontSize.xs }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <ScrollView style={[styles.analyticsContainer, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.fontSize.md }]}>
          Trading Analytics
        </Text>
        
        <View style={styles.analyticsGrid}>
          <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Portfolio Value
            </Text>
            <Text style={[styles.analyticsValue, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
              ${analytics.portfolio_value.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Total P&L
            </Text>
            <Text style={[
              styles.analyticsValue,
              {
                color: analytics.total_pnl >= 0 ? colors.success : colors.error,
                fontSize: typography.fontSize.lg
              }
            ]}>
              ${analytics.total_pnl.toLocaleString()}
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Win Rate
            </Text>
            <Text style={[styles.analyticsValue, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
              {analytics.win_rate.toFixed(1)}%
            </Text>
          </View>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundTertiary }]}>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary, fontSize: typography.fontSize.xs }]}>
              Sharpe Ratio
            </Text>
            <Text style={[styles.analyticsValue, { color: colors.textPrimary, fontSize: typography.fontSize.lg }]}>
              {analytics.risk_metrics.sharpe_ratio.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

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
          📈 Advanced Trading
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Pair Selector */}
      {renderPairSelector()}

      {/* Tab Selector */}
      <View style={[styles.tabSelector, { backgroundColor: colors.backgroundSecondary }]}>
        {(['trade', 'orders', 'analytics'] as const).map((tab) => (
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'trade' && (
          <>
            {renderChart()}
            <View style={styles.tradingRow}>
              {renderOrderBook()}
              {renderTradePanel()}
            </View>
          </>
        )}
        
        {activeTab === 'orders' && renderActiveOrders()}
        
        {activeTab === 'analytics' && renderAnalytics()}
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
  placeholder: {
    width: 40,
  },
  pairSelector: {
    paddingVertical: CypherDesignSystem.spacing.sm,
  },
  pairButton: {
    paddingHorizontal: CypherDesignSystem.spacing.md,
    paddingVertical: CypherDesignSystem.spacing.sm,
    marginHorizontal: CypherDesignSystem.spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  pairSymbol: {
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  pairPrice: {
    marginBottom: 2,
  },
  pairChange: {
    fontWeight: '500' as const,
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
    marginHorizontal: CypherDesignSystem.spacing.xs,
    borderBottomWidth: 2,
  },
  tabButtonText: {
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
  },
  chartContainer: {
    padding: CypherDesignSystem.spacing.md,
    marginVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  chartTitle: {
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  chartPrice: {
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  chartChange: {
    fontWeight: '500' as const,
  },
  timeframeSelector: {
    flexDirection: 'row' as const,
  },
  timeframeButton: {
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.xs,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeframeText: {
    fontWeight: '500' as const,
  },
  chartArea: {
    height: 200,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chartPlaceholder: {
    fontSize: 32,
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  chartSubtext: {
    fontSize: CypherDesignSystem.typography.fontSize.sm,
  },
  tradingRow: {
    flexDirection: 'row' as const,
    marginVertical: CypherDesignSystem.spacing.sm,
  },
  orderBookContainer: {
    flex: 1,
    marginRight: CypherDesignSystem.spacing.xs,
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
  },
  orderBookContent: {
    marginTop: CypherDesignSystem.spacing.sm,
  },
  orderBookSide: {
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  orderBookHeader: {
    fontWeight: '600' as const,
    marginBottom: CypherDesignSystem.spacing.xs,
    fontSize: CypherDesignSystem.typography.fontSize.xs,
  },
  orderBookRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 2,
  },
  orderBookPrice: {
    fontWeight: '500' as const,
  },
  orderBookQuantity: {
    fontWeight: '400' as const,
  },
  spreadContainer: {
    alignItems: 'center' as const,
    paddingVertical: CypherDesignSystem.spacing.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    marginVertical: CypherDesignSystem.spacing.xs,
  },
  spreadText: {
    fontWeight: '500' as const,
  },
  tradePanelContainer: {
    flex: 1,
    marginLeft: CypherDesignSystem.spacing.xs,
    padding: CypherDesignSystem.spacing.md,
    borderRadius: 12,
  },
  orderTypeSelector: {
    flexDirection: 'row' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.sm,
    marginHorizontal: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  orderTypeText: {
    fontWeight: '500' as const,
  },
  orderSideSelector: {
    flexDirection: 'row' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  orderSideButton: {
    flex: 1,
    paddingVertical: CypherDesignSystem.spacing.md,
    marginHorizontal: CypherDesignSystem.spacing.xs,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center' as const,
  },
  orderSideText: {
    fontWeight: '700' as const,
  },
  orderInputs: {
    marginBottom: CypherDesignSystem.spacing.md,
  },
  inputGroup: {
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  inputLabel: {
    marginBottom: CypherDesignSystem.spacing.xs,
    fontWeight: '500' as const,
  },
  orderInput: {
    paddingHorizontal: CypherDesignSystem.spacing.md,
    paddingVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    fontWeight: '500' as const,
  },
  placeOrderButton: {
    paddingVertical: CypherDesignSystem.spacing.md,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  placeOrderButtonText: {
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  sectionTitle: {
    fontWeight: '700' as const,
    marginBottom: CypherDesignSystem.spacing.md,
  },
  ordersContainer: {
    padding: CypherDesignSystem.spacing.md,
    marginVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: CypherDesignSystem.spacing.xl,
  },
  emptyStateText: {
    fontSize: CypherDesignSystem.typography.fontSize.md,
  },
  orderItem: {
    padding: CypherDesignSystem.spacing.md,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  orderItemHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: CypherDesignSystem.spacing.xs,
  },
  orderPair: {
    fontWeight: '600' as const,
  },
  orderSide: {
    fontWeight: '700' as const,
  },
  orderItemDetails: {
    marginBottom: CypherDesignSystem.spacing.sm,
  },
  orderDetail: {
    marginBottom: 2,
  },
  cancelOrderButton: {
    paddingVertical: CypherDesignSystem.spacing.xs,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    borderRadius: 6,
    alignSelf: 'flex-end' as const,
  },
  cancelOrderButtonText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  analyticsContainer: {
    padding: CypherDesignSystem.spacing.md,
    marginVertical: CypherDesignSystem.spacing.sm,
    borderRadius: 12,
  },
  analyticsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  analyticsCard: {
    width: '48%' as const,
    padding: CypherDesignSystem.spacing.md,
    marginBottom: CypherDesignSystem.spacing.sm,
    borderRadius: 8,
  },
  analyticsLabel: {
    marginBottom: CypherDesignSystem.spacing.xs,
    fontWeight: '500' as const,
  },
  analyticsValue: {
    fontWeight: '700' as const,
  },
};
