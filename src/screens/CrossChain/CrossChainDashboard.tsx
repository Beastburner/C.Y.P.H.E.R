/**
 * CYPHER Cross-Chain Dashboard
 * Revolutionary multi-blockchain portfolio management interface
 * Features: Unified portfolio view, bridge operations, chain analytics, cross-chain swaps
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Image
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import CrossChainService, { 
  UnifiedPortfolio, 
  CrossChainAsset, 
  BlockchainNetwork,
  BridgeProtocol,
  CrossChainTransaction
} from '../../services/CrossChainService';

const { width } = Dimensions.get('window');

interface CrossChainDashboardProps {
  navigation: any;
}

export default function CrossChainDashboard({ navigation }: CrossChainDashboardProps) {
  const { colors, typography, createCardStyle } = useTheme();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'bridge' | 'analytics'>('portfolio');
  const [portfolio, setPortfolio] = useState<UnifiedPortfolio | null>(null);
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [bridgeProtocols, setBridgeProtocols] = useState<BridgeProtocol[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<CrossChainTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const crossChainService = CrossChainService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [portfolioData, networksData, protocolsData, transactionsData] = await Promise.all([
        crossChainService.getUnifiedPortfolio(),
        Promise.resolve(crossChainService.getSupportedNetworks()),
        Promise.resolve(crossChainService.getBridgeProtocols()),
        Promise.resolve(crossChainService.getActiveBridgeTransactions())
      ]);

      setPortfolio(portfolioData);
      setNetworks(networksData);
      setBridgeProtocols(protocolsData);
      setActiveTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load cross-chain dashboard:', error);
      Alert.alert('Error', 'Failed to load cross-chain data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getChainIcon = (chainId: string): string => {
    const icons: { [key: string]: string } = {
      'ethereum': '⟠',
      'polygon': '⬢',
      'bsc': '🔸',
      'arbitrum': '🔷',
      'avalanche': '🔺'
    };
    return icons[chainId] || '⚡';
  };

  const renderTabBar = () => (
    <View style={[createCardStyle('elevated'), styles.tabBar]}>
      {[
        { key: 'portfolio', label: 'Portfolio', icon: '💼' },
        { key: 'bridge', label: 'Bridge', icon: '🌉' },
        { key: 'analytics', label: 'Analytics', icon: '📊' }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && { backgroundColor: colors.primary + '20' }
          ]}
          onPress={() => setActiveTab(tab.key as any)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.primary : colors.textSecondary }
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPortfolioOverview = () => {
    if (!portfolio) return null;

    return (
      <View>
        {/* Total Portfolio Value */}
        <View style={[createCardStyle('elevated'), styles.portfolioHeader]}>
          <Text style={styles.portfolioTitle}>Total Portfolio Value</Text>
          <Text style={styles.portfoliValue}>
            {formatCurrency(portfolio.total_value_usd)}
          </Text>
          <View style={styles.portfolioChange}>
            <Text
              style={[
                styles.changeText,
                {
                  color: portfolio.total_change_24h >= 0 ? colors.success : colors.error
                }
              ]}
            >
              {formatPercentage(portfolio.total_change_24h)} (24h)
            </Text>
          </View>
        </View>

        {/* Chain Distribution */}
        <View style={[createCardStyle('elevated'), styles.chainDistribution]}>
          <Text style={styles.sectionTitle}>Chain Distribution</Text>
          {Object.entries(portfolio.chains).map(([chainId, chainData]) => (
            <View key={chainId} style={styles.chainRow}>
              <View style={styles.chainInfo}>
                <Text style={styles.chainIcon}>{getChainIcon(chainId)}</Text>
                <Text style={styles.chainName}>{networks.find(n => n.id === chainId)?.name || chainId}</Text>
              </View>
              <View style={styles.chainValue}>
                <Text style={styles.chainAmount}>{formatCurrency(chainData.value_usd)}</Text>
                <Text style={styles.chainPercentage}>{chainData.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Assets */}
        <View style={[createCardStyle('elevated'), styles.assetsSection]}>
          <Text style={styles.sectionTitle}>Cross-Chain Assets</Text>
          {portfolio.assets.map((asset) => (
            <TouchableOpacity
              key={asset.asset_id}
              style={styles.assetRow}
              onPress={() => navigation.navigate('AssetDetail', { asset })}
            >
              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetName}>{asset.name}</Text>
                <View style={styles.networkBadges}>
                  {Object.keys(asset.networks).map((networkId) => (
                    <Text key={networkId} style={styles.networkBadge}>
                      {getChainIcon(networkId)}
                    </Text>
                  ))}
                </View>
              </View>
              <View style={styles.assetValue}>
                <Text style={styles.assetAmount}>
                  {formatCurrency(asset.total_balance_usd)}
                </Text>
                <Text
                  style={[
                    styles.assetChange,
                    { color: asset.price_24h_change >= 0 ? colors.success : colors.error }
                  ]}
                >
                  {formatPercentage(asset.price_24h_change)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Risk Metrics */}
        <View style={[createCardStyle('elevated'), styles.riskMetrics]}>
          <Text style={styles.sectionTitle}>Portfolio Risk Analysis</Text>
          <View style={styles.riskGrid}>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Diversification Score</Text>
              <Text style={[styles.riskValue, { color: colors.success }]}>
                {portfolio.diversification_score}/100
              </Text>
            </View>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Chain Risk</Text>
              <Text style={[styles.riskValue, { color: colors.warning }]}>
                {(portfolio.risk_metrics.chain_risk * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.riskItem}>
              <Text style={styles.riskLabel}>Bridge Exposure</Text>
              <Text style={[styles.riskValue, { color: colors.info }]}>
                {(portfolio.risk_metrics.bridge_exposure * 100).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderBridgeSection = () => (
    <View>
      {/* Bridge Protocols */}
      <View style={[createCardStyle('elevated'), styles.bridgeProtocols]}>
        <Text style={styles.sectionTitle}>Bridge Protocols</Text>
        {bridgeProtocols.slice(0, 4).map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={styles.protocolRow}
            onPress={() => navigation.navigate('BridgeInterface', { protocol })}
          >
            <View style={styles.protocolInfo}>
              <Text style={styles.protocolName}>{protocol.name}</Text>
              <Text style={styles.protocolChains}>
                {protocol.supported_chains.length} chains
              </Text>
            </View>
            <View style={styles.protocolStats}>
              <Text style={styles.protocolTvl}>
                TVL: {formatCurrency(protocol.tvl / 1000000)}M
              </Text>
              <View style={styles.securityRating}>
                <Text style={styles.ratingText}>Security:</Text>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.star,
                      { color: i < protocol.security_rating / 2 ? colors.warning : colors.textTertiary }
                    ]}
                  >
                    ⭐
                  </Text>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Transactions */}
      {activeTransactions.length > 0 && (
        <View style={[createCardStyle('elevated'), styles.activeTransactions]}>
          <Text style={styles.sectionTitle}>Active Bridge Transactions</Text>
          {activeTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.transactionRow}
              onPress={() => navigation.navigate('TransactionDetail', { transaction: tx })}
            >
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionAsset}>{tx.asset}</Text>
                <Text style={styles.transactionRoute}>
                  {getChainIcon(tx.from_chain)} → {getChainIcon(tx.to_chain)}
                </Text>
              </View>
              <View style={styles.transactionStatus}>
                <Text style={styles.transactionAmount}>{tx.amount}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        tx.status === 'completed'
                          ? colors.success + '20'
                          : tx.status === 'failed'
                          ? colors.error + '20'
                          : colors.warning + '20'
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          tx.status === 'completed'
                            ? colors.success
                            : tx.status === 'failed'
                            ? colors.error
                            : colors.warning
                      }
                    ]}
                  >
                    {tx.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Bridge Actions */}
      <View style={[createCardStyle('elevated'), styles.quickActions]}>
        <Text style={styles.sectionTitle}>Quick Bridge</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('BridgeInterface')}
          >
            <Text style={styles.actionButtonText}>🌉 Bridge Assets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('CrossChainSwap')}
          >
            <Text style={styles.actionButtonText}>🔄 Cross-Chain Swap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAnalyticsSection = () => (
    <View>
      {/* Bridge Analytics */}
      <View style={[createCardStyle('elevated'), styles.analyticsCard]}>
        <Text style={styles.sectionTitle}>Bridge Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>$45.2K</Text>
            <Text style={styles.analyticsLabel}>Total Bridged</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>4</Text>
            <Text style={styles.analyticsLabel}>Active Chains</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>$342</Text>
            <Text style={styles.analyticsLabel}>Gas Saved</Text>
          </View>
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsValue}>98.7%</Text>
            <Text style={styles.analyticsLabel}>Success Rate</Text>
          </View>
        </View>
      </View>

      {/* Network Performance */}
      <View style={[createCardStyle('elevated'), styles.networkPerformance]}>
        <Text style={styles.sectionTitle}>Network Performance</Text>
        {networks.slice(0, 5).map((network) => (
          <View key={network.id} style={styles.networkRow}>
            <View style={styles.networkInfo}>
              <Text style={styles.networkIcon}>{getChainIcon(network.id)}</Text>
              <Text style={styles.networkName}>{network.name}</Text>
            </View>
            <View style={styles.networkStats}>
              <Text style={styles.networkGas}>
                Gas: {network.gas_settings.standard} gwei
              </Text>
              <Text style={styles.networkTime}>
                ~{network.average_block_time}s blocks
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Chain Recommendations */}
      <View style={[createCardStyle('elevated'), styles.recommendations]}>
        <Text style={styles.sectionTitle}>Chain Recommendations</Text>
        <View style={styles.recommendationItem}>
          <Text style={styles.recommendationTitle}>💡 Move to Arbitrum</Text>
          <Text style={styles.recommendationDescription}>
            Save up to 90% on gas fees for frequent transactions
          </Text>
          <Text style={styles.recommendationSavings}>
            Potential savings: $125.50/month
          </Text>
        </View>
        <View style={styles.recommendationItem}>
          <Text style={styles.recommendationTitle}>🌾 Polygon DeFi</Text>
          <Text style={styles.recommendationDescription}>
            Access higher yields with 12% APY on USDC pools
          </Text>
          <Text style={styles.recommendationSavings}>
            Potential earnings: $89.20/month
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textPrimary }]}>
            Loading Cross-Chain Dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          🌐 Cross-Chain Portfolio
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('CrossChainSettings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'portfolio' && renderPortfolioOverview()}
        {activeTab === 'bridge' && renderBridgeSection()}
        {activeTab === 'analytics' && renderAnalyticsSection()}
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
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  tabBar: {
    flexDirection: 'row' as const,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  portfolioHeader: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    marginBottom: 16,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
    marginBottom: 8,
  },
  portfoliValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  portfolioChange: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  changeText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chainDistribution: {
    padding: 20,
    marginBottom: 16,
  },
  chainRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
  },
  chainInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  chainIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  chainValue: {
    alignItems: 'flex-end' as const,
  },
  chainAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  chainPercentage: {
    fontSize: 14,
    color: '#64748B',
  },
  assetsSection: {
    padding: 20,
    marginBottom: 16,
  },
  assetRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assetName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  networkBadges: {
    flexDirection: 'row' as const,
  },
  networkBadge: {
    fontSize: 14,
    marginRight: 6,
  },
  assetValue: {
    alignItems: 'flex-end' as const,
  },
  assetAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  assetChange: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  riskMetrics: {
    padding: 20,
    marginBottom: 20,
  },
  riskGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  riskItem: {
    alignItems: 'center' as const,
  },
  riskLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  riskValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  bridgeProtocols: {
    padding: 20,
    marginBottom: 16,
  },
  protocolRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  protocolChains: {
    fontSize: 14,
    color: '#64748B',
  },
  protocolStats: {
    alignItems: 'flex-end' as const,
  },
  protocolTvl: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  securityRating: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  star: {
    fontSize: 12,
  },
  activeTransactions: {
    padding: 20,
    marginBottom: 16,
  },
  transactionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionAsset: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionRoute: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionStatus: {
    alignItems: 'flex-end' as const,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  quickActions: {
    padding: 20,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center' as const,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  analyticsCard: {
    padding: 20,
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  analyticsItem: {
    width: '48%' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center' as const,
  },
  networkPerformance: {
    padding: 20,
    marginBottom: 16,
  },
  networkRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
  },
  networkInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  networkIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#FFFFFF',
  },
  networkStats: {
    alignItems: 'flex-end' as const,
  },
  networkGas: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  networkTime: {
    fontSize: 12,
    color: '#64748B',
  },
  recommendations: {
    padding: 20,
    marginBottom: 20,
  },
  recommendationItem: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationSavings: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#10B981',
  },
};
