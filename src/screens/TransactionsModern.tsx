import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// Import modern components
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernTransactionRow from '../components/ModernTransactionRow';

// Import theme
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw';
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  mode: 'public-to-private' | 'private-to-private' | 'private-to-public' | 'public-to-public';
  hash: string;
  usdValue?: number;
  gasPrice?: number;
  gasUsed?: number;
  category?: string;
}

interface TransactionsModernProps {
  onNavigate: (screen: string, params?: any) => void;
}

const TransactionsModern: React.FC<TransactionsModernProps> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'send',
      amount: 0.5,
      currency: 'ETH',
      from: 'my-wallet.eth',
      to: 'alice.eth',
      timestamp: '2 min ago',
      status: 'confirmed',
      mode: 'public-to-public',
      hash: '0x742d35cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 825.00,
      gasPrice: 20,
      gasUsed: 21000,
      category: 'Transfer'
    },
    {
      id: '2',
      type: 'receive',
      amount: 1.2,
      currency: 'ETH',
      from: 'bob.eth',
      to: 'my-wallet.eth',
      timestamp: '1 hour ago',
      status: 'confirmed',
      mode: 'public-to-public',
      hash: '0x123d35cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 1980.00,
      gasPrice: 18,
      gasUsed: 21000,
      category: 'Transfer'
    },
    {
      id: '3',
      type: 'deposit',
      amount: 0.8,
      currency: 'ETH',
      from: 'my-wallet.eth',
      to: 'Private Vault',
      timestamp: '3 hours ago',
      status: 'confirmed',
      mode: 'public-to-private',
      hash: '0xabc335cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 1320.00,
      gasPrice: 25,
      gasUsed: 85000,
      category: 'Privacy'
    },
    {
      id: '4',
      type: 'send',
      amount: 0.3,
      currency: 'ETH',
      from: 'Private Vault',
      to: 'stealth_addr_1234',
      timestamp: '1 day ago',
      status: 'confirmed',
      mode: 'private-to-private',
      hash: '0xdef335cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 495.00,
      category: 'Privacy'
    },
    {
      id: '5',
      type: 'withdraw',
      amount: 0.6,
      currency: 'ETH',
      from: 'Private Vault',
      to: 'charlie.eth',
      timestamp: '2 days ago',
      status: 'confirmed',
      mode: 'private-to-public',
      hash: '0x987335cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 990.00,
      gasPrice: 22,
      gasUsed: 120000,
      category: 'Privacy'
    },
    {
      id: '6',
      type: 'send',
      amount: 2.1,
      currency: 'ETH',
      from: 'my-wallet.eth',
      to: 'nft-marketplace.eth',
      timestamp: '3 days ago',
      status: 'failed',
      mode: 'public-to-public',
      hash: '0x654335cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 3465.00,
      gasPrice: 30,
      gasUsed: 0,
      category: 'NFT'
    }
  ]);

  const filters = ['All', 'Send', 'Receive', 'Privacy', 'NFT', 'DeFi'];
  const periods = ['1D', '1W', '1M', '3M', '1Y', 'All'];
  
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = selectedFilter === 'All' || 
                         selectedFilter === tx.category ||
                         selectedFilter.toLowerCase() === tx.type;
    const matchesSearch = tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate loading new transactions
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getTransactionStats = () => {
    const totalSent = transactions
      .filter(tx => tx.type === 'send' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalReceived = transactions
      .filter(tx => tx.type === 'receive' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const totalGasFees = transactions
      .filter(tx => tx.status === 'confirmed' && tx.gasPrice && tx.gasUsed)
      .reduce((sum, tx) => sum + ((tx.gasPrice! * tx.gasUsed!) / 1e9), 0);
    
    const privacyTransactions = transactions.filter(tx => tx.category === 'Privacy').length;

    return { totalSent, totalReceived, totalGasFees, privacyTransactions };
  };

  const stats = getTransactionStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <ModernHeader
        title="Transactions"
        subtitle="Transaction History"
        isPrivateMode={isPrivateMode}
        isConnected={true}
        notifications={0}
        onPrivacyToggle={() => setIsPrivateMode(!isPrivateMode)}
        onSettingsPress={() => onNavigate('Settings')}
        showConnectionStatus={true}
        showPrivacyToggle={true}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ModernColors.info}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={ModernColors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={ModernColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="filter" size={20} color={ModernColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Period Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodsContainer}
          contentContainerStyle={styles.periodsContent}
        >
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodChip,
                selectedPeriod === period && styles.periodChipActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodChipText,
                selectedPeriod === period && styles.periodChipTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transaction Stats */}
        <ModernCard variant="glass" padding="medium" margin="medium">
          <Text style={styles.sectionTitle}>📊 Transaction Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ModernColors.transaction.send }]}>
                {stats.totalSent.toFixed(3)} ETH
              </Text>
              <Text style={styles.statLabel}>Total Sent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ModernColors.transaction.receive }]}>
                {stats.totalReceived.toFixed(3)} ETH
              </Text>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.totalGasFees.toFixed(6)} ETH
              </Text>
              <Text style={styles.statLabel}>Gas Fees</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: ModernColors.privacy.enhanced }]}>
                {stats.privacyTransactions}
              </Text>
              <Text style={styles.statLabel}>Private Txs</Text>
            </View>
          </View>
        </ModernCard>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <ModernCard title="Recent Transactions" padding="none" margin="medium">
          <View style={{ paddingHorizontal: ModernSpacing.xl }}>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <ModernTransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onPress={(tx) => onNavigate('TransactionDetail', { transaction: tx })}
                  showMode={true}
                  compact={false}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="inbox" size={48} color={ModernColors.textTertiary} />
                <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
                <Text style={styles.emptyStateDescription}>
                  Try adjusting your search or filter criteria
                </Text>
              </View>
            )}
          </View>
          
          {filteredTransactions.length > 0 && (
            <View style={styles.viewAllContainer}>
              <ModernButton
                title="Load More Transactions"
                onPress={() => {}}
                variant="ghost"
                size="small"
              />
            </View>
          )}
        </ModernCard>

        {/* Quick Actions */}
        <ModernCard padding="medium" margin="medium">
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('SendTransaction')}
            >
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.2)']}
                style={styles.actionGradient}
              >
                <Icon name="arrow-up-right" size={24} color={ModernColors.transaction.send} />
                <Text style={styles.actionTitle}>Send</Text>
                <Text style={styles.actionDescription}>Transfer funds</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('ReceiveTransaction')}
            >
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', 'rgba(16, 185, 129, 0.2)']}
                style={styles.actionGradient}
              >
                <Icon name="arrow-down-left" size={24} color={ModernColors.transaction.receive} />
                <Text style={styles.actionTitle}>Receive</Text>
                <Text style={styles.actionDescription}>Generate QR code</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('PrivacyDashboardModern')}
            >
              <LinearGradient
                colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.2)']}
                style={styles.actionGradient}
              >
                <Icon name="shield" size={24} color={ModernColors.privacy.enhanced} />
                <Text style={styles.actionTitle}>Privacy</Text>
                <Text style={styles.actionDescription}>Shielded transfers</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ModernCard>
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilters(false)}
            >
              <Icon name="x" size={24} color={ModernColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transaction Filters</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Transaction Type</Text>
              <View style={styles.typeFilters}>
                {['All', 'Send', 'Receive', 'Deposit', 'Withdraw'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeFilter,
                      selectedFilter === type && styles.typeFilterActive
                    ]}
                  >
                    <Text style={[
                      styles.typeFilterText,
                      selectedFilter === type && styles.typeFilterTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Status</Text>
              <View style={styles.statusFilters}>
                {['All', 'Confirmed', 'Pending', 'Failed'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusFilter}
                  >
                    <Text style={styles.statusFilterText}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Privacy Mode</Text>
              <View style={styles.privacyFilters}>
                {['All', 'Public', 'Private', 'Mixed'].map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={styles.privacyFilter}
                  >
                    <Text style={styles.privacyFilterText}>{mode}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <ModernButton
              title="Clear All"
              onPress={() => {}}
              variant="ghost"
              size="large"
            />
            <ModernButton
              title="Apply Filters"
              onPress={() => setShowFilters(false)}
              variant="primary"
              gradient={true}
              size="large"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernColors.background,
  },
  
  scrollView: {
    flex: 1,
    paddingTop: ModernSpacing.md,
  },
  
  scrollViewContent: {
    paddingBottom: ModernSpacing.xxxl,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernSpacing.lg,
    marginBottom: ModernSpacing.lg,
    gap: ModernSpacing.md,
  },
  
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.lg,
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    gap: ModernSpacing.sm,
    ...ModernShadows.small,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ModernColors.textPrimary,
  },
  
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ModernShadows.small,
  },
  
  periodsContainer: {
    marginBottom: ModernSpacing.xl,
  },
  
  periodsContent: {
    paddingHorizontal: ModernSpacing.lg,
    gap: ModernSpacing.sm,
  },
  
  periodChip: {
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.surface,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  periodChipActive: {
    backgroundColor: ModernColors.info,
    borderColor: ModernColors.info,
  },
  
  periodChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  periodChipTextActive: {
    color: '#ffffff',
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.lg,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: ModernSpacing.md,
  },
  
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: ModernSpacing.lg,
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: ModernColors.info,
    marginBottom: ModernSpacing.xs,
    textAlign: 'center',
  },
  
  statLabel: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    textAlign: 'center',
  },
  
  filtersContainer: {
    marginBottom: ModernSpacing.xl,
  },
  
  filtersContent: {
    paddingHorizontal: ModernSpacing.lg,
    gap: ModernSpacing.sm,
  },
  
  filterChip: {
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.surface,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  filterChipActive: {
    backgroundColor: ModernColors.info,
    borderColor: ModernColors.info,
  },
  
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  filterChipTextActive: {
    color: '#ffffff',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: ModernSpacing.xxxl,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textSecondary,
    marginTop: ModernSpacing.lg,
    marginBottom: ModernSpacing.sm,
  },
  
  emptyStateDescription: {
    fontSize: 14,
    color: ModernColors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  viewAllContainer: {
    padding: ModernSpacing.lg,
    alignItems: 'center',
  },
  
  quickActions: {
    flexDirection: 'row',
    gap: ModernSpacing.md,
  },
  
  actionCard: {
    flex: 1,
    borderRadius: ModernBorderRadius.lg,
    overflow: 'hidden',
  },
  
  actionGradient: {
    padding: ModernSpacing.lg,
    alignItems: 'center',
    gap: ModernSpacing.sm,
  },
  
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
  },
  
  actionDescription: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: ModernColors.surface,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ModernSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.divider,
  },
  
  modalCloseButton: {
    position: 'absolute',
    left: ModernSpacing.lg,
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ModernColors.textPrimary,
  },
  
  modalContent: {
    flex: 1,
    padding: ModernSpacing.lg,
  },
  
  filterSection: {
    marginBottom: ModernSpacing.xl,
  },
  
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.md,
  },
  
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernSpacing.sm,
  },
  
  typeFilter: {
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.md,
    backgroundColor: ModernColors.background,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  typeFilterActive: {
    backgroundColor: ModernColors.info,
    borderColor: ModernColors.info,
  },
  
  typeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  typeFilterTextActive: {
    color: '#ffffff',
  },
  
  statusFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernSpacing.sm,
  },
  
  statusFilter: {
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.md,
    backgroundColor: ModernColors.background,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  privacyFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernSpacing.sm,
  },
  
  privacyFilter: {
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.md,
    backgroundColor: ModernColors.background,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  privacyFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: ModernSpacing.lg,
    gap: ModernSpacing.md,
    borderTopWidth: 1,
    borderTopColor: ModernColors.divider,
  },
});

export default TransactionsModern;
