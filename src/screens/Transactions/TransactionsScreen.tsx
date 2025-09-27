import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useWallet } from '../../context/WalletContext';
import Card from '../../components/Card';
import { Transaction, TransactionStatus } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';
import { formatCurrency, formatAddress } from '../../utils/validators';

const getStatusBadgeStyle = (status: TransactionStatus) => {
  switch (status) {
    case 'confirmed':
      return { backgroundColor: colors.success + '20', borderColor: colors.success + '40' };
    case 'pending':
      return { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' };
    case 'failed':
      return { backgroundColor: colors.error + '20', borderColor: colors.error + '40' };
    default:
      return { backgroundColor: colors.surface, borderColor: colors.surfaceBorder };
  }
};

const getStatusTextColor = (status: TransactionStatus) => {
  switch (status) {
    case 'confirmed': return colors.success;
    case 'pending': return colors.warning;
    case 'failed': return colors.error;
    default: return colors.textSecondary;
  }
};

const getAmountColor = (type: string) => {
  if (type === 'send') return colors.error;
  if (type === 'receive') return colors.success;
  return colors.textSecondary;
};

// Real transaction data will be fetched from the wallet context

type FilterType = 'all' | 'send' | 'receive' | 'swap';

interface TransactionsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ onNavigate }) => {
  const { state, getTransactions } = useWallet();

  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real transaction data
  useEffect(() => {
    loadTransactions();
  }, [state.activeAccount?.address, state.activeNetwork?.chainId]);

  const loadTransactions = async () => {
    if (!state.activeAccount?.address) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const txHistory = await getTransactions();
      setTransactions(txHistory || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const displayTransactions = transactions;

  const filteredTransactions = displayTransactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTransactions();
    } catch (error) {
      console.error('Failed to refresh transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    onNavigate('TransactionDetail', { transaction });
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'send': return 'Sent';
      case 'receive': return 'Received';
      case 'swap': return 'Swapped';
      default: return 'Transaction';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderTransaction = ({ item: tx }: { item: Transaction }) => (
    <TouchableOpacity onPress={() => handleTransactionPress(tx)} style={styles.transactionContainer}>
      <Card variant="glass" style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionType}>
            {formatTransactionType(tx.type || 'unknown')} {tx.token?.symbol || 'ETH'}
          </Text>
          <Text style={[styles.transactionAmount, { color: getAmountColor(tx.type || 'unknown') }]}>
            {tx.type === 'send' ? '-' : '+'}
            {formatCurrency(tx.value)} {tx.token?.symbol || 'ETH'}
          </Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionAddress}>
            {tx.type === 'send' ? `To: ${formatAddress(tx.to)}` : `From: ${formatAddress(tx.from)}`}
          </Text>
          <Text style={styles.transactionTime}>{formatTime(tx.timestamp || 0)}</Text>
        </View>
        
        <View style={styles.transactionFooter}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(tx.status || 'pending')]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(tx.status || 'pending') }]}>
              {(tx.status || 'pending').charAt(0).toUpperCase() + (tx.status || 'pending').slice(1)}
            </Text>
          </View>
          
          {tx.gasPrice && (
            <Text style={styles.feeText}>
              Fee: {formatCurrency((Number('21000') * Number(tx.gasPrice) / 1e9).toString())} ETH
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading transactions...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No transactions yet</Text>
        <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Activity</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]} 
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'send' && styles.filterButtonActive]} 
            onPress={() => setFilter('send')}
          >
            <Text style={[styles.filterText, filter === 'send' && styles.filterTextActive]}>Sent</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'receive' && styles.filterButtonActive]} 
            onPress={() => setFilter('receive')}
          >
            <Text style={[styles.filterText, filter === 'receive' && styles.filterTextActive]}>Received</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterButton, filter === 'swap' && styles.filterButtonActive]} 
            onPress={() => setFilter('swap')}
          >
            <Text style={[styles.filterText, filter === 'swap' && styles.filterTextActive]}>Swaps</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.hash}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 36,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  transactionContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
  },
  transactionCard: {
    padding: spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionType: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  transactionAmount: {
    ...typography.number,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  transactionAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  transactionTime: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  feeText: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default TransactionsScreen;
