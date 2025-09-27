/**
 * Updated Home Screen for CYPHER Wallet
 * Integrates with real blockchain data and ENS
 * Uses RealWalletService for actual balance fetching and transactions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ethers } from 'ethers';

// Import services
import RealWalletService, { TokenBalance, TransactionData, WalletAccount } from '../../services/RealWalletService';
import RealPrivacyService, { PrivacyMetrics } from '../../services/RealPrivacyService';
import { NetworkService, NetworkConfig } from '../../services/NetworkService';

// Import modern components and theme
import { ModernColors, ModernSpacing, ModernBorderRadius } from '../../styles/ModernTheme';

// Create theme object for easier usage
const ModernTheme = {
  colors: {
    primary: '#0f172a',
    accent: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    white: '#ffffff',
    black: '#000000',
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    background: '#f1f5f9',
    surface: '#ffffff',
    privacy: '#8b5cf6',
  },
  gradients: {
    primary: ['#0f172a', '#6b46c1', '#0f172a'],
  },
  shadows: {
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
import ModernHeader from '../../components/ModernHeader';
import ModernCard from '../../components/ModernCard';
import ModernBalanceDisplay from '../../components/ModernBalanceDisplay';
import ModernButton from '../../components/ModernButton';
import ModernTransactionRow from '../../components/ModernTransactionRow';

interface HomeScreenProps {
  navigation: any;
}

const HomeUpdatedScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  // Services
  const [walletService] = useState(() => RealWalletService.getInstance());
  const [privacyService] = useState(() => RealPrivacyService.getInstance());
  const [networkService] = useState(() => NetworkService.getInstance());

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkConfig | null>(null);
  const [privacyMetrics, setPrivacyMetrics] = useState<PrivacyMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBalanceValue, setShowBalanceValue] = useState(true);

  /**
   * Load wallet data from blockchain
   */
  const loadWalletData = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Loading wallet data...');

      // Check if wallet exists
      if (!walletService.hasWallet()) {
        setError('No wallet found. Please create or import a wallet.');
        setIsLoading(false);
        return;
      }

      // Get current account
      const account = walletService.getCurrentAccount();
      setCurrentAccount(account);

      if (!account) {
        setError('Failed to get wallet account');
        setIsLoading(false);
        return;
      }

      console.log(`👤 Using wallet: ${account.address}`);

      // Load data in parallel
      const [
        balanceData,
        transactionData,
        networkData,
        privacyData
      ] = await Promise.allSettled([
        walletService.getAllBalances(),
        walletService.getTransactionHistory(),
        networkService.getCurrentNetwork(),
        privacyService.getPrivacyMetrics()
      ]);

      // Process balances
      if (balanceData.status === 'fulfilled') {
        setBalances(balanceData.value);
        console.log(`💰 Loaded ${balanceData.value.length} token balances`);
      } else {
        console.warn('Failed to load balances:', balanceData.reason);
        setError('Failed to load balances');
      }

      // Process transactions
      if (transactionData.status === 'fulfilled') {
        setTransactions(transactionData.value);
        console.log(`📜 Loaded ${transactionData.value.length} transactions`);
      } else {
        console.warn('Failed to load transactions:', transactionData.reason);
      }

      // Process network info
      if (networkData.status === 'fulfilled') {
        setNetworkInfo(networkData.value);
        console.log(`🌐 Connected to: ${networkData.value?.name || 'Unknown'}`);
      } else {
        console.warn('Failed to load network info:', networkData.reason);
      }

      // Process privacy metrics
      if (privacyData.status === 'fulfilled') {
        setPrivacyMetrics(privacyData.value);
        console.log(`🔒 Privacy metrics loaded`);
      } else {
        console.warn('Failed to load privacy metrics:', privacyData.reason);
      }

    } catch (error: any) {
      console.error('Failed to load wallet data:', error);
      setError(`Failed to load wallet data: ${error.message}`);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [walletService, privacyService, networkService]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadWalletData();
  }, [loadWalletData]);

  /**
   * Create wallet if none exists
   */
  const handleCreateWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      const account = await walletService.createWallet('Main Account');
      Alert.alert(
        'Wallet Created Successfully! 🎉',
        `Your new CYPHER wallet has been created.\n\nAddress: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
        [{ text: 'Start Using Wallet', onPress: () => loadWalletData() }]
      );
    } catch (error: any) {
      Alert.alert('Error', `Failed to create wallet: ${error.message}`);
      setIsLoading(false);
    }
  }, [walletService, loadWalletData]);

  /**
   * Handle send transaction
   */
  const handleSend = useCallback(() => {
    if (!currentAccount) {
      Alert.alert('Error', 'No wallet account available');
      return;
    }
    navigation.navigate('Send');
  }, [navigation, currentAccount]);

  /**
   * Handle receive
   */
  const handleReceive = useCallback(() => {
    if (!currentAccount) {
      Alert.alert('Error', 'No wallet account available');
      return;
    }
    navigation.navigate('Receive', { address: currentAccount.address });
  }, [navigation, currentAccount]);

  /**
   * Handle swap
   */
  const handleSwap = useCallback(() => {
    if (!currentAccount) {
      Alert.alert('Error', 'No wallet account available');
      return;
    }
    navigation.navigate('Swap');
  }, [navigation, currentAccount]);

  /**
   * Get total portfolio value in ETH
   */
  const getTotalValue = useCallback(() => {
    return balances.reduce((total, balance) => {
      const value = parseFloat(balance.balanceFormatted) || 0;
      return total + value;
    }, 0);
  }, [balances]);

  /**
   * Get main ETH balance
   */
  const getMainBalance = useCallback(() => {
    const ethBalance = balances.find(b => 
      b.symbol === 'ETH' || b.symbol === 'SepoliaETH'
    );
    return ethBalance ? parseFloat(ethBalance.balanceFormatted) : 0;
  }, [balances]);

  /**
   * Format address for display
   */
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Format transaction for display
   */
  const formatTransactionForDisplay = useCallback((tx: TransactionData) => {
    const transactionType = tx.from === currentAccount?.address ? 'send' : 'receive';
    return {
      id: tx.hash || `tx_${Date.now()}`,
      type: transactionType as 'send' | 'receive',
      amount: parseFloat(ethers.utils.formatEther(tx.value || '0')),
      currency: networkInfo?.symbol || 'ETH',
      from: tx.from,
      to: tx.to,
      address: tx.from === currentAccount?.address ? tx.to : tx.from,
      timestamp: new Date(tx.timestamp || Date.now()).toLocaleString(),
      status: tx.status,
      mode: 'public-to-public' as const,
      hash: tx.hash,
      fee: tx.gasUsed ? 
        parseFloat(ethers.utils.formatEther(
          ethers.BigNumber.from(tx.gasUsed).mul(tx.gasPrice || '0')
        )) : undefined,
      usdValue: parseFloat(ethers.utils.formatEther(tx.value || '0')) * 2000 // Mock USD price
    };
  }, [currentAccount, networkInfo]);

  // Load data on screen focus
  useFocusEffect(
    useCallback(() => {
      loadWalletData();
    }, [loadWalletData])
  );

  // Show create wallet screen if no wallet
  if (!isLoading && error?.includes('No wallet found')) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={ModernTheme.gradients.primary}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <Icon name="wallet-outline" size={80} color={ModernTheme.colors.white} />
            <Text style={styles.welcomeTitle}>Welcome to CYPHER</Text>
            <Text style={styles.welcomeSubtitle}>
              Your privacy-focused Ethereum wallet with real blockchain integration
            </Text>
            
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="shield-check" size={20} color={ModernTheme.colors.success} />
                <Text style={styles.featureText}>Real blockchain data</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="web" size={20} color={ModernTheme.colors.info} />
                <Text style={styles.featureText}>ENS integration</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="lightning-bolt" size={20} color={ModernTheme.colors.warning} />
                <Text style={styles.featureText}>Sepolia testnet ready</Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <ModernButton
                title="Create New Wallet"
                onPress={handleCreateWallet}
                style={styles.button}
              />
              
              <ModernButton
                title="Import Wallet"
                onPress={() => navigation.navigate('ImportWallet')}
                variant="secondary"
                style={styles.button}
              />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={ModernTheme.gradients.primary}
          style={styles.gradient}
        >
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={ModernTheme.colors.white} />
            <Text style={styles.loadingText}>Loading wallet data...</Text>
            <Text style={styles.loadingSubtext}>Connecting to blockchain...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={ModernTheme.gradients.primary}
        style={styles.gradient}
      >
        <ModernHeader
          title="CYPHER Wallet"
          subtitle={networkInfo?.name || 'Sepolia Testnet'}
          onSettingsPress={() => navigation.navigate('Settings')}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={ModernTheme.colors.white}
              colors={[ModernTheme.colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Error Display */}
          {error && !error.includes('No wallet found') && (
            <ModernCard style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Icon name="alert-circle" size={20} color={ModernTheme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => loadWalletData()}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            </ModernCard>
          )}

          {/* Balance Display */}
          <ModernBalanceDisplay
            balance={{
              public: getMainBalance(),
              private: 0, // No private balance yet
              currency: networkInfo?.symbol || 'ETH',
              usdValue: {
                public: getTotalValue() * 2000,
                private: 0
              }
            }}
            isPrivateMode={false}
            onToggleVisibility={() => setShowBalanceValue(!showBalanceValue)}
            loading={isRefreshing}
            showUSD={true}
          />

          {/* Network Status */}
          {networkInfo && (
            <ModernCard style={styles.networkCard}>
              <View style={styles.networkStatus}>
                <View style={styles.networkInfo}>
                  <Icon name="web" size={16} color={ModernTheme.colors.success} />
                  <Text style={styles.networkText}>{networkInfo.name}</Text>
                  <View style={styles.networkDot} />
                </View>
                <Text style={styles.chainId}>Chain ID: {networkInfo.chainId}</Text>
              </View>
            </ModernCard>
          )}

          {/* Quick Actions */}
          <ModernCard title="Quick Actions" style={styles.actionsCard}>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
                <LinearGradient
                  colors={[ModernTheme.colors.primary, ModernTheme.colors.accent]}
                  style={styles.actionIconContainer}
                >
                  <Icon name="send" size={24} color={ModernTheme.colors.white} />
                </LinearGradient>
                <Text style={styles.actionText}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
                <LinearGradient
                  colors={[ModernTheme.colors.success, '#34D399']}
                  style={styles.actionIconContainer}
                >
                  <Icon name="qrcode" size={24} color={ModernTheme.colors.white} />
                </LinearGradient>
                <Text style={styles.actionText}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
                <LinearGradient
                  colors={[ModernTheme.colors.warning, '#F59E0B']}
                  style={styles.actionIconContainer}
                >
                  <Icon name="swap-horizontal" size={24} color={ModernTheme.colors.white} />
                </LinearGradient>
                <Text style={styles.actionText}>Swap</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('PrivacyDashboard')}
              >
                <LinearGradient
                  colors={[ModernTheme.colors.privacy, '#8B5CF6']}
                  style={styles.actionIconContainer}
                >
                  <Icon name="shield-check" size={24} color={ModernTheme.colors.white} />
                </LinearGradient>
                <Text style={styles.actionText}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </ModernCard>

          {/* Token Balances */}
          {balances.length > 0 && (
            <ModernCard title="Token Balances" style={styles.section}>
              {balances.map((token, index) => (
                <TouchableOpacity
                  key={token.address || index}
                  style={styles.tokenRow}
                  onPress={() => navigation.navigate('TokenDetails', { token })}
                >
                  <View style={styles.tokenInfo}>
                    <View style={styles.tokenIcon}>
                      <Text style={styles.tokenSymbol}>
                        {token.symbol.slice(0, 2)}
                      </Text>
                    </View>
                    <View style={styles.tokenDetails}>
                      <Text style={styles.tokenName}>{token.name}</Text>
                      <Text style={styles.tokenSymbolText}>{token.symbol}</Text>
                      {token.address !== ethers.constants.AddressZero && (
                        <Text style={styles.tokenAddress}>
                          {formatAddress(token.address)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.tokenBalance}>
                    <Text style={styles.tokenAmount}>
                      {parseFloat(token.balanceFormatted).toFixed(4)}
                    </Text>
                    <Text style={styles.tokenValue}>
                      ${(parseFloat(token.balanceFormatted) * (token.usdValue || 2000)).toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ModernCard>
          )}

          {/* Privacy Metrics */}
          {privacyMetrics && (
            <ModernCard title="Privacy Status" style={styles.section}>
              <View style={styles.privacyMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Anonymity Score</Text>
                  <Text style={[styles.metricValue, { color: getScoreColor(privacyMetrics.anonymityScore) }]}>
                    {privacyMetrics.anonymityScore}/100
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Active Notes</Text>
                  <Text style={styles.metricValue}>{privacyMetrics.activeNotes}</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Mixed</Text>
                  <Text style={styles.metricValue}>{privacyMetrics.totalDeposits} ETH</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={() => navigation.navigate('PrivacyDashboard')}
              >
                <Text style={styles.privacyButtonText}>Open Privacy Dashboard</Text>
                <Icon name="arrow-right" size={16} color={ModernTheme.colors.accent} />
              </TouchableOpacity>
            </ModernCard>
          )}

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <ModernCard title="Recent Transactions" style={styles.section}>
              {transactions.slice(0, 5).map((tx, index) => (
                <ModernTransactionRow
                  key={tx.hash || index}
                  transaction={formatTransactionForDisplay(tx)}
                  onPress={() => navigation.navigate('TransactionDetails', { transaction: tx })}
                />
              ))}
              
              {transactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('Transactions')}
                >
                  <Text style={styles.viewAllText}>View All Transactions</Text>
                  <Icon name="chevron-right" size={16} color={ModernTheme.colors.accent} />
                </TouchableOpacity>
              )}
            </ModernCard>
          )}

          {/* No Transactions State */}
          {transactions.length === 0 && !isLoading && (
            <ModernCard style={styles.section}>
              <View style={styles.emptyState}>
                <Icon name="history" size={48} color={ModernTheme.colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
                <Text style={styles.emptyStateText}>
                  Your transaction history will appear here once you start using your wallet
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={handleSend}
                >
                  <Text style={styles.emptyStateButtonText}>Send Your First Transaction</Text>
                </TouchableOpacity>
              </View>
            </ModernCard>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

/**
 * Get color for privacy score
 */
function getScoreColor(score: number): string {
  if (score >= 80) return ModernTheme.colors.success;
  if (score >= 60) return ModernTheme.colors.warning;
  return ModernTheme.colors.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernTheme.colors.background,
  },
  gradient: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: ModernTheme.colors.white,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  featureList: {
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: ModernTheme.colors.white,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernTheme.colors.white,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: ModernTheme.colors.error,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: ModernTheme.colors.error,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: ModernTheme.colors.error,
    borderRadius: 6,
  },
  retryText: {
    fontSize: 12,
    color: ModernTheme.colors.white,
    fontWeight: '600',
  },
  networkCard: {
    marginBottom: 16,
  },
  networkStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkText: {
    fontSize: 14,
    color: ModernTheme.colors.text,
    fontWeight: '500',
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ModernTheme.colors.success,
  },
  chainId: {
    fontSize: 12,
    color: ModernTheme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  actionsCard: {
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...ModernTheme.shadows.medium,
  },
  actionText: {
    fontSize: 12,
    color: ModernTheme.colors.text,
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ModernTheme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: ModernTheme.colors.text,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '500',
    color: ModernTheme.colors.text,
    marginBottom: 2,
  },
  tokenSymbolText: {
    fontSize: 12,
    color: ModernTheme.colors.textSecondary,
    fontWeight: '500',
  },
  tokenAddress: {
    fontSize: 10,
    color: ModernTheme.colors.textTertiary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernTheme.colors.text,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 12,
    color: ModernTheme.colors.textSecondary,
  },
  privacyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: ModernTheme.colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ModernTheme.colors.text,
  },
  privacyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ModernTheme.colors.privacy,
  },
  privacyButtonText: {
    fontSize: 14,
    color: ModernTheme.colors.privacy,
    fontWeight: '500',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: ModernTheme.colors.accent,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernTheme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: ModernTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: ModernTheme.colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: ModernTheme.colors.white,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 32,
  },
});

export default HomeUpdatedScreen;
