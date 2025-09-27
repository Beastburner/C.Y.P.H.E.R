/**
 * Cypher Wallet - Transaction Management Screen
 * Advanced transaction interface with real-time monitoring and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Dimensions,
  StyleSheet
} from 'react-native';
import { transactionService, TransactionRecord, TransactionStatus } from '../../services/TransactionService';
import { useWallet } from '../../context/WalletContext';

const { width, height } = Dimensions.get('window');

interface TransactionManagementScreenProps {
  navigation: any;
}

const TransactionManagementScreen: React.FC<TransactionManagementScreenProps> = ({ navigation }) => {
  const { state } = useWallet();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<TransactionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      if (!state.currentAccount) return;

      const history = await transactionService.getTransactionHistory(
        state.currentAccount.address,
        state.activeNetwork.chainId
      );
      
      const pending = transactionService.getPendingTransactions();
      
      setTransactions(history);
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      Alert.alert('Error', 'Failed to load transaction data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [state.currentAccount, state.activeNetwork]);

  useEffect(() => {
    loadTransactions();
    
    // Set up periodic refresh
    const interval = setInterval(loadTransactions, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [loadTransactions]);

  const handleSpeedUpTransaction = async (transaction: TransactionRecord) => {
    try {
      if (!state.currentAccount) return;

      Alert.alert(
        'Speed Up Transaction',
        'This will create a new transaction with higher gas fees to replace the pending one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Speed Up',
            onPress: async () => {
              try {
                setLoading(true);
                // In a real implementation, you'd need the private key
                // For now, we'll show a placeholder
                Alert.alert('Feature Coming Soon', 'Speed up functionality will be available after wallet unlocking is implemented.');
                // const newTxHash = await transactionService.speedUpTransaction(
                //   transaction.hash,
                //   newGasPrice,
                //   privateKey
                // );
                // Alert.alert('Success', `Transaction sped up! New hash: ${newTxHash}`);
                loadTransactions();
              } catch (error) {
                Alert.alert('Error', 'Failed to speed up transaction');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Speed up transaction error:', error);
    }
  };

  const handleCancelTransaction = async (transaction: TransactionRecord) => {
    try {
      if (!state.currentAccount) return;

      Alert.alert(
        'Cancel Transaction',
        'This will create a new transaction to cancel the pending one. You will pay gas fees.',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Cancel Transaction',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                // In a real implementation, you'd need the private key
                Alert.alert('Feature Coming Soon', 'Cancel functionality will be available after wallet unlocking is implemented.');
                // const cancelTxHash = await transactionService.cancelTransaction(
                //   transaction.hash,
                //   privateKey
                // );
                // Alert.alert('Success', `Transaction cancelled! Cancel hash: ${cancelTxHash}`);
                loadTransactions();
              } catch (error) {
                Alert.alert('Error', 'Failed to cancel transaction');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Cancel transaction error:', error);
    }
  };

  const formatAmount = (value: string, symbol: string = 'ETH'): string => {
    try {
      const num = parseFloat(value) / Math.pow(10, 18);
      return `${num.toFixed(6)} ${symbol}`;
    } catch {
      return `0 ${symbol}`;
    }
  };

  const formatGas = (gasUsed?: string, gasPrice?: string): string => {
    if (!gasUsed || !gasPrice) return 'N/A';
    try {
      const gas = parseFloat(gasUsed);
      const price = parseFloat(gasPrice) / Math.pow(10, 9); // Convert to Gwei
      return `${gas.toLocaleString()} (${price.toFixed(2)} Gwei)`;
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return '#00ff9f';
      case 'pending': return '#ffaa00';
      case 'failed': return '#ff4444';
      case 'cancelled': return '#999999';
      default: return '#ffffff';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      case 'cancelled': return '⊘';
      default: return '?';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'send': return '↗️';
      case 'receive': return '↙️';
      case 'swap': return '🔄';
      case 'approve': return '✅';
      case 'stake': return '🔒';
      case 'unstake': return '🔓';
      case 'claim': return '🎁';
      case 'mint': return '⚡';
      case 'burn': return '🔥';
      case 'bridge': return '🌉';
      default: return '📄';
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString();
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>Transaction History & Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff9f" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <Text style={styles.headerSubtitle}>
          {transactions.length} Total • {pendingTransactions.length} Pending
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTransactions();
            }}
            tintColor="#00ff9f"
          />
        }
      >
        {/* Pending Transactions Section */}
        {pendingTransactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Transactions</Text>
            {pendingTransactions.map((tx) => (
              <View key={tx.hash} style={[styles.transactionCard, styles.pendingCard]}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionHash}>
                      {tx.hash.substring(0, 10)}...{tx.hash.substring(tx.hash.length - 8)}
                    </Text>
                    <Text style={styles.transactionTime}>
                      {formatDate(tx.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusIcon, { color: getStatusColor(tx.status) }]}>
                      {getStatusIcon(tx.status)}
                    </Text>
                    <Text style={[styles.statusText, { color: getStatusColor(tx.status) }]}>
                      {tx.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.pendingActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.speedUpButton]}
                    onPress={() => {
                      const txRecord = transactions.find(t => t.hash === tx.hash);
                      if (txRecord) handleSpeedUpTransaction(txRecord);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Speed Up</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {
                      const txRecord = transactions.find(t => t.hash === tx.hash);
                      if (txRecord) handleCancelTransaction(txRecord);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Your transactions will appear here</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.hash}
                style={styles.transactionCard}
                onPress={() => {
                  setSelectedTransaction(transaction);
                  setShowDetailsModal(true);
                }}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <View style={styles.transactionTitleRow}>
                      <Text style={styles.categoryIcon}>
                        {getCategoryIcon(transaction.metadata.category)}
                      </Text>
                      <Text style={styles.transactionCategory}>
                        {transaction.metadata.category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.transactionHash}>
                      {transaction.hash.substring(0, 10)}...{transaction.hash.substring(transaction.hash.length - 8)}
                    </Text>
                    <Text style={styles.transactionTime}>
                      {formatDate(transaction.timestamp)}
                    </Text>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionAmount}>
                      {formatAmount(transaction.value)}
                    </Text>
                    <View style={styles.statusContainer}>
                      <Text style={[styles.statusIcon, { color: getStatusColor(transaction.status) }]}>
                        {getStatusIcon(transaction.status)}
                      </Text>
                      <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                        {transaction.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.transactionMeta}>
                  <Text style={styles.metaText}>
                    Gas: {formatGas(transaction.gasUsed, transaction.effectiveGasPrice)}
                  </Text>
                  <Text style={styles.metaText}>
                    Block: {transaction.blockNumber || 'Pending'}
                  </Text>
                  <Text style={styles.metaText}>
                    Confirmations: {transaction.confirmations}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            
            {selectedTransaction && (
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hash:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.hash}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedTransaction.status) }]}>
                    {selectedTransaction.status.toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>From:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.from}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.to}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Value:</Text>
                  <Text style={styles.detailValue}>{formatAmount(selectedTransaction.value)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gas Limit:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.gasLimit}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gas Used:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.gasUsed || 'N/A'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Block Number:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.blockNumber || 'Pending'}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Confirmations:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.confirmations}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Timestamp:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedTransaction.timestamp)}</Text>
                </View>
                
                {selectedTransaction.metadata.mevProtection && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>MEV Protection:</Text>
                    <Text style={[styles.detailValue, { color: '#00ff9f' }]}>ENABLED</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff9f',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pendingCard: {
    borderColor: '#ffaa00',
    backgroundColor: '#1a1a00',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff9f',
  },
  transactionHash: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 10,
    color: '#666666',
  },
  transactionDetails: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 10,
    color: '#666666',
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  speedUpButton: {
    backgroundColor: '#00ff9f',
  },
  cancelButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00ff9f',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00ff9f',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScrollView: {
    maxHeight: height * 0.6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  detailLabel: {
    fontSize: 14,
    color: '#999999',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#ffffff',
    flex: 2,
    textAlign: 'right',
  },
  closeButton: {
    backgroundColor: '#00ff9f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TransactionManagementScreen;
