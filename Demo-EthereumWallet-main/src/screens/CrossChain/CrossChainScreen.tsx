/**
 * ECLIPTA Cross-Chain Bridge Screen
 * 
 * Revolutionary cross-chain interface that doesn't exist in any other wallet.
 * Seamless multi-chain operations with optimal routing and arbitrage detection.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { 
  crossChainBridgeService, 
  SupportedChain, 
  BridgeRoute, 
  CrossChainTransaction,
  CrossChainOpportunity,
  BridgeAnalytics
} from '../../services/CrossChainBridgeService';

const { width } = Dimensions.get('window');

interface CrossChainScreenProps {
  onNavigate: (screen: string) => void;
}

const CrossChainScreen: React.FC<CrossChainScreenProps> = ({ onNavigate }) => {
  // State Management
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [fromChain, setFromChain] = useState<SupportedChain | null>(null);
  const [toChain, setToChain] = useState<SupportedChain | null>(null);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [bridgeRoutes, setBridgeRoutes] = useState<BridgeRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [selectingChain, setSelectingChain] = useState<'from' | 'to'>('from');
  const [activeTab, setActiveTab] = useState<'bridge' | 'opportunities' | 'history' | 'analytics'>('bridge');
  const [opportunities, setOpportunities] = useState<CrossChainOpportunity[]>([]);
  const [transactions, setTransactions] = useState<CrossChainTransaction[]>([]);
  const [analytics, setAnalytics] = useState<BridgeAnalytics | null>(null);

  const popularTokens = [
    { symbol: 'ETH', name: 'Ethereum', icon: '⟠' },
    { symbol: 'USDC', name: 'USD Coin', icon: '💎' },
    { symbol: 'USDT', name: 'Tether', icon: '💵' },
    { symbol: 'MATIC', name: 'Polygon', icon: '🔷' },
    { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
    { symbol: 'BNB', name: 'BNB', icon: '🟡' },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (fromChain && toChain && amount && parseFloat(amount) > 0) {
      findBridgeRoutes();
    } else {
      setBridgeRoutes([]);
      setSelectedRoute(null);
    }
  }, [fromChain, toChain, fromToken, toToken, amount]);

  const initializeData = async () => {
    try {
      const chains = crossChainBridgeService.getSupportedChains();
      setSupportedChains(chains);
      
      // Set default chains
      setFromChain(chains.find(c => c.chainId === 1) || chains[0]); // Ethereum
      setToChain(chains.find(c => c.chainId === 137) || chains[1]); // Polygon
      
      // Load opportunities and analytics
      const [opps, analyticsData, userTxs] = await Promise.all([
        crossChainBridgeService.findCrossChainOpportunities(),
        crossChainBridgeService.getBridgeAnalytics(),
        crossChainBridgeService.getUserTransactions('0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E')
      ]);
      
      setOpportunities(opps);
      setAnalytics(analyticsData);
      setTransactions(userTxs);
      
    } catch (error) {
      console.error('Failed to initialize cross-chain data:', error);
    }
  };

  const findBridgeRoutes = async () => {
    if (!fromChain || !toChain || !amount) return;
    
    try {
      setLoading(true);
      const routes = await crossChainBridgeService.findOptimalBridgeRoutes(
        fromChain.chainId,
        toChain.chainId,
        fromToken,
        toToken,
        amount
      );
      
      setBridgeRoutes(routes);
      setSelectedRoute(routes[0] || null);
      
    } catch (error) {
      console.error('Failed to find bridge routes:', error);
      Alert.alert('Error', 'Failed to find bridge routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeBridge = async () => {
    if (!selectedRoute) {
      Alert.alert('Error', 'Please select a bridge route');
      return;
    }

    Alert.alert(
      'Confirm Bridge Transaction',
      `Bridge ${amount} ${fromToken} from ${fromChain?.name} to ${toChain?.name} via ${selectedRoute.bridgeName}?\n\nEstimated time: ${Math.round(selectedRoute.estimatedTime / 60)} minutes\nTotal fees: ${selectedRoute.fees.totalFee} ${fromToken}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: performBridge }
      ]
    );
  };

  const performBridge = async () => {
    if (!selectedRoute) return;
    
    try {
      setBridging(true);
      
      const transaction = await crossChainBridgeService.executeBridge(
        selectedRoute,
        '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E'
      );
      
      setTransactions(prev => [transaction, ...prev]);
      
      Alert.alert(
        'Bridge Transaction Initiated! 🌉',
        `Your cross-chain bridge transaction has been started.\n\nTransaction ID: ${transaction.id.slice(0, 16)}...\n\nYou can track progress in the History tab.`,
        [{ text: 'OK', onPress: () => setActiveTab('history') }]
      );
      
      setAmount('');
      
    } catch (error) {
      Alert.alert('Bridge Failed', 'The bridge transaction failed. Please try again.');
    } finally {
      setBridging(false);
    }
  };

  const swapChains = () => {
    const tempChain = fromChain;
    setFromChain(toChain);
    setToChain(tempChain);
  };

  const selectChain = (chain: SupportedChain) => {
    if (selectingChain === 'from') {
      setFromChain(chain);
    } else {
      setToChain(chain);
    }
    setShowChainSelector(false);
  };

  const getChainIcon = (chainId: number) => {
    const icons: { [key: number]: string } = {
      1: '⟠',      // Ethereum
      137: '🔷',   // Polygon
      42161: '🔵', // Arbitrum
      10: '🔴',    // Optimism
      43114: '🔺', // Avalanche
      56: '🟡',    // BSC
    };
    return icons[chainId] || '⚪';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  const getStatusColor = (status: CrossChainTransaction['status']) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'confirmed': return '#3B82F6';
      case 'bridging': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: CrossChainTransaction['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'bridging': return '🌉';
      case 'completed': return '🎉';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🌉 Cross-Chain Bridge</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'bridge', label: 'Bridge', icon: '🌉' },
            { key: 'opportunities', label: 'Opportunities', icon: '💎' },
            { key: 'history', label: 'History', icon: '📋' },
            { key: 'analytics', label: 'Analytics', icon: '📊' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'bridge' && (
            <>
              {/* Bridge Interface */}
              <View style={styles.bridgeContainer}>
                {/* From Chain */}
                <View style={styles.chainContainer}>
                  <Text style={styles.chainLabel}>From</Text>
                  <TouchableOpacity 
                    style={styles.chainSelector}
                    onPress={() => {
                      setSelectingChain('from');
                      setShowChainSelector(true);
                    }}
                  >
                    <Text style={styles.chainIcon}>{fromChain ? getChainIcon(fromChain.chainId) : '⚪'}</Text>
                    <View style={styles.chainInfo}>
                      <Text style={styles.chainName}>{fromChain?.name || 'Select Chain'}</Text>
                      <Text style={styles.chainSymbol}>{fromChain?.symbol}</Text>
                    </View>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.tokenInputContainer}>
                    <TextInput
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0.0"
                      placeholderTextColor="#64748B"
                      keyboardType="numeric"
                    />
                    <TouchableOpacity style={styles.tokenSelector}>
                      <Text style={styles.tokenText}>{fromToken}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Swap Button */}
                <TouchableOpacity style={styles.swapButton} onPress={swapChains}>
                  <LinearGradient colors={['#34D399', '#10B981']} style={styles.swapButtonGradient}>
                    <Text style={styles.swapButtonIcon}>⇅</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* To Chain */}
                <View style={styles.chainContainer}>
                  <Text style={styles.chainLabel}>To</Text>
                  <TouchableOpacity 
                    style={styles.chainSelector}
                    onPress={() => {
                      setSelectingChain('to');
                      setShowChainSelector(true);
                    }}
                  >
                    <Text style={styles.chainIcon}>{toChain ? getChainIcon(toChain.chainId) : '⚪'}</Text>
                    <View style={styles.chainInfo}>
                      <Text style={styles.chainName}>{toChain?.name || 'Select Chain'}</Text>
                      <Text style={styles.chainSymbol}>{toChain?.symbol}</Text>
                    </View>
                    <Text style={styles.dropdownIcon}>▼</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.outputContainer}>
                    <Text style={styles.outputAmount}>
                      {loading ? 'Finding routes...' : 
                       selectedRoute ? selectedRoute.outputAmount : '0.0'}
                    </Text>
                    <Text style={styles.outputToken}>{toToken}</Text>
                  </View>
                </View>
              </View>

              {/* Bridge Routes */}
              {bridgeRoutes.length > 0 && (
                <View style={styles.routesContainer}>
                  <Text style={styles.routesTitle}>🎯 Optimal Bridge Routes</Text>
                  {bridgeRoutes.map((route, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.routeCard,
                        selectedRoute === route && styles.routeCardSelected
                      ]}
                      onPress={() => setSelectedRoute(route)}
                    >
                      <View style={styles.routeHeader}>
                        <Text style={styles.routeBridge}>{route.bridgeName}</Text>
                        <View style={styles.securityScore}>
                          <Text style={styles.securityText}>Security: {route.securityScore}/100</Text>
                        </View>
                      </View>
                      
                      <View style={styles.routeDetails}>
                        <View style={styles.routeDetail}>
                          <Text style={styles.routeDetailLabel}>Output</Text>
                          <Text style={styles.routeDetailValue}>
                            {parseFloat(route.outputAmount).toFixed(4)} {toToken}
                          </Text>
                        </View>
                        <View style={styles.routeDetail}>
                          <Text style={styles.routeDetailLabel}>Time</Text>
                          <Text style={styles.routeDetailValue}>
                            {formatTime(route.estimatedTime)}
                          </Text>
                        </View>
                        <View style={styles.routeDetail}>
                          <Text style={styles.routeDetailLabel}>Fees</Text>
                          <Text style={styles.routeDetailValue}>
                            {parseFloat(route.fees.totalFee).toFixed(4)} {fromToken}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Bridge Button */}
              <TouchableOpacity
                style={[
                  styles.bridgeButton,
                  (!selectedRoute || !amount || bridging) && styles.bridgeButtonDisabled
                ]}
                onPress={executeBridge}
                disabled={!selectedRoute || !amount || bridging}
              >
                <LinearGradient 
                  colors={
                    (!selectedRoute || !amount || bridging) 
                      ? ['#374151', '#374151'] 
                      : ['#34D399', '#10B981']
                  } 
                  style={styles.bridgeButtonGradient}
                >
                  {bridging ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.bridgeButtonText}>
                      {!amount ? 'Enter Amount' : 
                       !selectedRoute ? 'Select Route' : 
                       'Bridge Tokens'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {activeTab === 'opportunities' && (
            <View style={styles.opportunitiesContainer}>
              <Text style={styles.sectionTitle}>💎 Cross-Chain Opportunities</Text>
              {opportunities.map((opp, index) => (
                <View key={index} style={styles.opportunityCard}>
                  <View style={styles.opportunityHeader}>
                    <View style={styles.opportunityInfo}>
                      <Text style={styles.opportunityType}>
                        {opp.type.charAt(0).toUpperCase() + opp.type.slice(1)}
                      </Text>
                      <Text style={styles.opportunityChains}>
                        {opp.fromChain.name} → {opp.toChain.name}
                      </Text>
                    </View>
                    <View style={styles.profitContainer}>
                      <Text style={styles.profitAmount}>+{opp.expectedProfit}</Text>
                      <Text style={styles.profitPercentage}>({opp.profitPercentage.toFixed(1)}%)</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.opportunityDescription}>{opp.description}</Text>
                  
                  <View style={styles.opportunityDetails}>
                    <View style={styles.opportunityDetail}>
                      <Text style={styles.opportunityDetailLabel}>Required</Text>
                      <Text style={styles.opportunityDetailValue}>{opp.requiredAmount} {opp.token}</Text>
                    </View>
                    <View style={styles.opportunityDetail}>
                      <Text style={styles.opportunityDetailLabel}>Risk</Text>
                      <Text style={[
                        styles.opportunityDetailValue,
                        { color: getRiskColor(opp.riskLevel) }
                      ]}>
                        {opp.riskLevel.charAt(0).toUpperCase() + opp.riskLevel.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.opportunityDetail}>
                      <Text style={styles.opportunityDetailLabel}>Time</Text>
                      <Text style={styles.opportunityDetailValue}>
                        {formatTime(opp.timeToExecute)}
                      </Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.executeOpportunityButton}>
                    <Text style={styles.executeOpportunityText}>Execute</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'history' && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionTitle}>📋 Bridge History</Text>
              {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>🌉</Text>
                  <Text style={styles.emptyStateTitle}>No Bridge Transactions</Text>
                  <Text style={styles.emptyStateText}>
                    Your cross-chain bridge transactions will appear here
                  </Text>
                </View>
              ) : (
                transactions.map((tx) => (
                  <View key={tx.id} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionAmount}>
                          {tx.amount} {tx.fromToken}
                        </Text>
                        <Text style={styles.transactionRoute}>
                          {tx.fromChain.name} → {tx.toChain.name}
                        </Text>
                      </View>
                      <View style={styles.transactionStatus}>
                        <Text style={styles.statusIcon}>{getStatusIcon(tx.status)}</Text>
                        <Text style={[
                          styles.statusText,
                          { color: getStatusColor(tx.status) }
                        ]}>
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionBridge}>
                        via {tx.bridgeRoute.bridgeName}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    {tx.fromTxHash && (
                      <TouchableOpacity style={styles.viewTransactionButton}>
                        <Text style={styles.viewTransactionText}>View on Explorer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'analytics' && analytics && (
            <View style={styles.analyticsContainer}>
              <Text style={styles.sectionTitle}>📊 Bridge Analytics</Text>
              
              {/* Overview Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{analytics.totalVolume24h}</Text>
                  <Text style={styles.statLabel}>24h Volume</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{analytics.totalTransactions24h.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>24h Transactions</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatTime(analytics.averageTime)}</Text>
                  <Text style={styles.statLabel}>Avg Time</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{analytics.successRate.toFixed(1)}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
              </View>

              {/* Popular Routes */}
              <View style={styles.popularRoutesContainer}>
                <Text style={styles.subsectionTitle}>Popular Routes</Text>
                {analytics.popularRoutes.map((route, index) => (
                  <View key={index} style={styles.popularRouteCard}>
                    <Text style={styles.popularRouteText}>
                      {route.fromChain} → {route.toChain}
                    </Text>
                    <View style={styles.popularRouteStats}>
                      <Text style={styles.popularRouteVolume}>{route.volume}</Text>
                      <Text style={styles.popularRouteCount}>{route.count} txs</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Chain Selector Modal */}
        <Modal
          visible={showChainSelector}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChainSelector(false)}
        >
          <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.modalContainer}>
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowChainSelector(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Chain</Text>
                <View style={styles.placeholder} />
              </View>
              
              <ScrollView style={styles.chainList}>
                {supportedChains.map((chain) => (
                  <TouchableOpacity
                    key={chain.chainId}
                    style={styles.chainListItem}
                    onPress={() => selectChain(chain)}
                  >
                    <Text style={styles.chainListIcon}>{getChainIcon(chain.chainId)}</Text>
                    <View style={styles.chainListInfo}>
                      <Text style={styles.chainListName}>{chain.name}</Text>
                      <Text style={styles.chainListSymbol}>{chain.symbol}</Text>
                    </View>
                    {chain.isTestnet && (
                      <View style={styles.testnetBadge}>
                        <Text style={styles.testnetText}>Testnet</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#1E293B',
  },
  activeTab: {
    backgroundColor: '#34D399',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  bridgeContainer: {
    marginBottom: 24,
  },
  chainContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  chainLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '500',
  },
  chainSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chainIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  chainInfo: {
    flex: 1,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chainSymbol: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  tokenInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
    paddingVertical: 8,
  },
  tokenSelector: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outputAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outputToken: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  swapButton: {
    alignSelf: 'center',
    marginVertical: -4,
    zIndex: 1,
  },
  swapButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#0F172A',
  },
  swapButtonIcon: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  routesContainer: {
    marginBottom: 24,
  },
  routesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  routeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  routeCardSelected: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeBridge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securityScore: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routeDetail: {
    alignItems: 'center',
  },
  routeDetailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  routeDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bridgeButton: {
    marginBottom: 40,
  },
  bridgeButtonGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bridgeButtonDisabled: {
    opacity: 0.5,
  },
  bridgeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  opportunitiesContainer: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  opportunityCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
    marginBottom: 4,
  },
  opportunityChains: {
    fontSize: 14,
    color: '#94A3B8',
  },
  profitContainer: {
    alignItems: 'flex-end',
  },
  profitAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 2,
  },
  profitPercentage: {
    fontSize: 12,
    color: '#10B981',
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 20,
  },
  opportunityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  opportunityDetail: {
    alignItems: 'center',
  },
  opportunityDetailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  opportunityDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  executeOpportunityButton: {
    backgroundColor: '#34D399',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  executeOpportunityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  historyContainer: {
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionRoute: {
    fontSize: 14,
    color: '#94A3B8',
  },
  transactionStatus: {
    alignItems: 'flex-end',
  },
  statusIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  transactionBridge: {
    fontSize: 12,
    color: '#64748B',
  },
  transactionTime: {
    fontSize: 12,
    color: '#64748B',
  },
  viewTransactionButton: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  viewTransactionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  analyticsContainer: {
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34D399',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  popularRoutesContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  popularRouteCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  popularRouteText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  popularRouteStats: {
    alignItems: 'flex-end',
  },
  popularRouteVolume: {
    fontSize: 14,
    color: '#34D399',
    fontWeight: '600',
  },
  popularRouteCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalCloseButton: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 18,
  },
  chainList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chainListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  chainListIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  chainListInfo: {
    flex: 1,
  },
  chainListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chainListSymbol: {
    fontSize: 12,
    color: '#94A3B8',
  },
  testnetBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testnetText: {
    fontSize: 10,
    color: '#F59E0B',
    fontWeight: '600',
  },
});

export default CrossChainScreen;
