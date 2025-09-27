import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { DualLayerPrivacyService } from '../services/DualLayerPrivacyService';
import { PrivacyService } from '../services/PrivacyService';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

interface PrivacyStats {
  totalShielded: string;
  totalDeposits: number;
  totalWithdrawals: number;
  privacyScore: number;
  aliasAccounts: number;
  activeCommitments: number;
}

const PrivacyDashboard: React.FC = () => {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const privacyService = DualLayerPrivacyService.getInstance();
  const legacyPrivacyService = PrivacyService.getInstance();

  useEffect(() => {
    loadPrivacyStats();
    checkPrivacyMode();
  }, []);

  const loadPrivacyStats = async () => {
    try {
      // Mock data for demonstration
      const mockStats: PrivacyStats = {
        totalShielded: '2.45',
        totalDeposits: 12,
        totalWithdrawals: 8,
        privacyScore: 85,
        aliasAccounts: 3,
        activeCommitments: 15,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading privacy stats:', error);
    }
  };

  const checkPrivacyMode = async () => {
    try {
      const mode = await legacyPrivacyService.getPrivacyMode();
      setIsPrivacyMode(mode === 'private');
    } catch (error) {
      console.error('Error checking privacy mode:', error);
    }
  };

  const togglePrivacyMode = async () => {
    try {
      setIsLoading(true);
      await legacyPrivacyService.togglePrivacyMode();
      const newMode = await legacyPrivacyService.getPrivacyMode();
      const isPrivate = newMode === 'private';
      setIsPrivacyMode(isPrivate);
      Alert.alert(
        'Privacy Mode Updated',
        `Privacy mode is now ${isPrivate ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      console.error('Error toggling privacy mode:', error);
      Alert.alert('Error', 'Failed to toggle privacy mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAliasAccount = async () => {
    try {
      setIsLoading(true);
      const result = await privacyService.createAliasAccount();
      if (result.success && result.aliasAccount) {
        Alert.alert('Success', `Alias account created: ${result.aliasAccount.address}`);
        loadPrivacyStats();
      } else {
        Alert.alert('Error', result.error || 'Failed to create alias account');
      }
    } catch (error) {
      console.error('Error creating alias account:', error);
      Alert.alert('Error', 'Failed to create alias account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionTypeSelection = (type: string) => {
    setSelectedTransactionType(type);
    setShowTransactionModal(true);
  };

  const executeTransaction = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      let result;

      switch (selectedTransactionType) {
        case 'deposit':
          result = await privacyService.depositToShieldedPool({ 
            amount: amount,
            recipient: recipientAddress || undefined
          });
          break;
        case 'withdraw':
          if (!recipientAddress) {
            Alert.alert('Error', 'Please enter recipient address');
            return;
          }
          // For demo purposes, we'll use a mock note ID
          result = await privacyService.withdrawFromShieldedPool({ 
            noteId: 'demo-note-id',
            amount: amount,
            recipient: recipientAddress
          });
          break;
        case 'shielded':
          if (!recipientAddress) {
            Alert.alert('Error', 'Please enter recipient address');
            return;
          }
          // For demo purposes, we'll use mock input notes and create outputs
          result = await privacyService.sendShieldedTransaction({ 
            inputNoteIds: ['demo-input-note'],
            outputs: [{ recipient: recipientAddress, amount: amount }]
          });
          break;
        default:
          Alert.alert('Error', 'Invalid transaction type');
          return;
      }

      if (result.success) {
        const txHash = result.txHash || 'N/A';
        Alert.alert('Success', `Transaction completed: ${txHash}`);
        setShowTransactionModal(false);
        setAmount('');
        setRecipientAddress('');
        loadPrivacyStats();
      } else {
        Alert.alert('Error', result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error executing transaction:', error);
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatsCard = (title: string, value: string | number, icon: string) => (
    <View style={styles.statsCard}>
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderTransactionButton = (
    title: string,
    subtitle: string,
    type: string,
    icon: string,
    color: string[]
  ) => (
    <TouchableOpacity
      style={styles.transactionButton}
      onPress={() => handleTransactionTypeSelection(type)}
    >
      <LinearGradient
        colors={color}
        style={styles.transactionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.transactionIcon}>{icon}</Text>
        <Text style={styles.transactionTitle}>{title}</Text>
        <Text style={styles.transactionSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerTitle}>Privacy Dashboard</Text>
        <Text style={styles.headerSubtitle}>Dual-Layer Privacy Architecture</Text>
        
        <TouchableOpacity
          style={[
            styles.privacyToggle,
            { backgroundColor: isPrivacyMode ? '#4CAF50' : '#757575' }
          ]}
          onPress={togglePrivacyMode}
          disabled={isLoading}
        >
          <Text style={styles.privacyToggleText}>
            Privacy Mode: {isPrivacyMode ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.content}>
        {/* Privacy Statistics */}
        <Text style={styles.sectionTitle}>Privacy Statistics</Text>
        <View style={styles.statsContainer}>
          {stats && (
            <>
              {renderStatsCard('Shielded Balance', `${stats.totalShielded} ETH`, '🛡️')}
              {renderStatsCard('Privacy Score', `${stats.privacyScore}%`, '📊')}
              {renderStatsCard('Alias Accounts', stats.aliasAccounts, '👤')}
              {renderStatsCard('Active Commitments', stats.activeCommitments, '🔒')}
            </>
          )}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCreateAliasAccount}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.actionIcon}>🎭</Text>
              <Text style={styles.actionTitle}>Create Alias</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Transaction Types */}
        <Text style={styles.sectionTitle}>Privacy Transactions</Text>
        <View style={styles.transactionsContainer}>
          {renderTransactionButton(
            'Deposit to Shield',
            'Public → Private',
            'deposit',
            '🔐',
            ['#4CAF50', '#45a049']
          )}
          {renderTransactionButton(
            'Withdraw from Shield',
            'Private → Public',
            'withdraw',
            '🔓',
            ['#2196F3', '#1976D2']
          )}
          {renderTransactionButton(
            'Shielded Transfer',
            'Private → Private',
            'shielded',
            '🔄',
            ['#9C27B0', '#7B1FA2']
          )}
        </View>

        {/* Privacy Features */}
        <Text style={styles.sectionTitle}>Privacy Features</Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🌟</Text>
            <Text style={styles.featureTitle}>Zero-Knowledge Proofs</Text>
            <Text style={styles.featureDescription}>
              Generate ZK proofs for private transactions
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🌳</Text>
            <Text style={styles.featureTitle}>Merkle Tree Privacy</Text>
            <Text style={styles.featureDescription}>
              Advanced commitment schemes for anonymity
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔐</Text>
            <Text style={styles.featureTitle}>Dual-Layer Architecture</Text>
            <Text style={styles.featureDescription}>
              Public aliases with private pools
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction Modal */}
      <Modal
        visible={showTransactionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedTransactionType === 'deposit' && 'Deposit to Shielded Pool'}
              {selectedTransactionType === 'withdraw' && 'Withdraw from Shielded Pool'}
              {selectedTransactionType === 'shielded' && 'Shielded Transfer'}
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Amount (ETH)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            {(selectedTransactionType === 'withdraw' || selectedTransactionType === 'shielded') && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Recipient Address</Text>
                <TextInput
                  style={styles.input}
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder="0x..."
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTransactionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={executeTransaction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Execute</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 20,
  },
  privacyToggle: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'center',
  },
  privacyToggleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: '#fff',
    width: (width - 50) / 2,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statsTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 10,
  },
  actionGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  transactionsContainer: {
    marginBottom: 20,
  },
  transactionButton: {
    marginBottom: 15,
  },
  transactionGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  transactionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  transactionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  featureIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: width - 40,
    padding: 25,
    borderRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 0.45,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PrivacyDashboard;
