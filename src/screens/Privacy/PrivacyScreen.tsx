import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ethers } from 'ethers';
import ShieldedPoolService, { ShieldedNote, DepositParams, WithdrawParams } from '../../services/shieldedPoolService';
import { useWallet } from '../../context/WalletContext';

/**
 * @title PrivacyScreen
 * @dev React Native component for managing privacy features in the wallet
 * @notice This screen provides:
 *         - Shielded balance management
 *         - Private transaction creation
 *         - Privacy settings configuration
 *         - Shielded pool interactions
 */

interface PrivacyScreenProps {
  navigation: any;
  route: any;
  onNavigate?: (screen: string) => void;
}

// Use ShieldedNote from service instead of local interface

interface PrivacySettings {
  autoShield: boolean;
  shieldThreshold: string;
  defaultPrivacy: boolean;
  showBalances: boolean;
  requireConfirmation: boolean;
}

const PrivacyScreen: React.FC<PrivacyScreenProps> = ({ navigation, route, onNavigate }) => {
  // Wallet context
  const { state } = useWallet();
  
  // State management
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'settings'>('balance');
  const [shieldedNotes, setShieldedNotes] = useState<ShieldedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shieldedService, setShieldedService] = useState<ShieldedPoolService | null>(null);
  const [shieldedBalance, setShieldedBalance] = useState('0');
  const [poolStats, setPoolStats] = useState({
    totalDeposits: '0',
    totalWithdrawals: '0',
    activeCommitments: '0',
    poolBalance: '0'
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    autoShield: false,
    shieldThreshold: '0.1',
    defaultPrivacy: false,
    showBalances: true,
    requireConfirmation: true,
  });

  // Transaction state
  const [transactionMode, setTransactionMode] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isPrivateTransaction, setIsPrivateTransaction] = useState(true);

  // Computed values
  const totalShieldedBalance = useMemo(() => {
    try {
      return parseFloat(ethers.utils.formatEther(shieldedBalance)).toFixed(4);
    } catch {
      return '0.0000';
    }
  }, [shieldedBalance]);

  const unspentCommitments = useMemo(() => {
    return shieldedNotes.filter((note: ShieldedNote) => !note.isSpent);
  }, [shieldedNotes]);

  // Initialize service
  useEffect(() => {
    initializeService();
  }, [state.currentNetwork]);

  const initializeService = async () => {
    try {
      if (!state.currentNetwork?.rpcUrl) return;
      
      const provider = new ethers.providers.JsonRpcProvider(state.currentNetwork.rpcUrl);
      // Replace with actual deployed contract address
      const contractAddress = '0x1234567890123456789012345678901234567890'; // TODO: Replace with real address
      
      const service = new ShieldedPoolService(provider, contractAddress);
      setShieldedService(service);
      
      await loadShieldedData(service);
    } catch (error) {
      console.error('Failed to initialize shielded service:', error);
    }
  };

  const loadShieldedData = async (service?: ShieldedPoolService) => {
    try {
      const serviceToUse = service || shieldedService;
      if (!serviceToUse) return;

      setIsLoading(true);
      
      // Load balance and notes
      const [balance, notes, stats] = await Promise.all([
        serviceToUse.getShieldedBalance(),
        serviceToUse.getAllNotes(),
        serviceToUse.getPoolStats()
      ]);
      
      setShieldedBalance(balance);
      setShieldedNotes(notes);
      setPoolStats(stats);
      
      // Sync notes with contract
      await serviceToUse.syncNotes();
      
    } catch (error) {
      console.error('Failed to load shielded data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadShieldedData();
    } finally {
      setRefreshing(false);
    }
  };

  // Privacy operations
  const handleDeposit = async () => {
    try {
      if (!shieldedService || !state.activeAccount) {
        Alert.alert('Error', 'Wallet not connected');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      setIsLoading(true);

      // Create signer
      const provider = new ethers.providers.JsonRpcProvider(state.currentNetwork?.rpcUrl);
      if (!state.activeAccount?.privateKey) {
        throw new Error('No private key available');
      }
      const wallet = new ethers.Wallet(state.activeAccount.privateKey, provider);

      const params: DepositParams = {
        amount: ethers.utils.parseEther(amount).toString()
      };

      const { note, txHash } = await shieldedService.depositETH(params, wallet);

      Alert.alert(
        'Deposit Successful! 🔐',
        `Your funds have been shielded.\n\nTransaction: ${txHash.slice(0, 10)}...`,
        [
          {
            text: 'View Transaction',
            onPress: () => navigation.navigate('Transactions'),
          },
          { text: 'OK', onPress: () => setAmount('') },
        ]
      );

      await loadShieldedData();
    } catch (error: any) {
      console.error('Deposit failed:', error);
      Alert.alert('Deposit Failed', error.message || 'Failed to deposit funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      if (!shieldedService || !state.activeAccount) {
        Alert.alert('Error', 'Wallet not connected');
        return;
      }

      if (!recipient || !ethers.utils.isAddress(recipient)) {
        Alert.alert('Error', 'Please enter a valid recipient address');
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Select first available note (in real app, let user select)
      const availableNote = unspentCommitments[0];
      if (!availableNote) {
        Alert.alert('Error', 'No available notes to withdraw');
        return;
      }

      setIsLoading(true);

      // Create signer
      const provider = new ethers.providers.JsonRpcProvider(state.currentNetwork?.rpcUrl);
      if (!state.activeAccount?.privateKey) {
        throw new Error('No private key available');
      }
      const wallet = new ethers.Wallet(state.activeAccount.privateKey, provider);

      const params: WithdrawParams = {
        recipient: recipient,
        amount: ethers.utils.parseEther(amount).toString(),
        fee: ethers.utils.parseEther('0.01').toString() // 0.01 ETH fee
      };

      const txHash = await shieldedService.withdraw(availableNote, params, wallet);

      Alert.alert(
        'Withdrawal Successful! 🔓',
        `Your funds have been withdrawn privately.\n\nTransaction: ${txHash.slice(0, 10)}...`,
        [
          {
            text: 'View Transaction',
            onPress: () => navigation.navigate('Transactions'),
          },
          { 
            text: 'OK', 
            onPress: () => {
              setAmount('');
              setRecipient('');
            }
          }
        ]
      );

      await loadShieldedData();
    } catch (error: any) {
      console.error('Withdrawal failed:', error);
      Alert.alert('Withdrawal Failed', error.message || 'Failed to withdraw funds');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateTransfer = async () => {
    Alert.alert(
      'Private Transfer',
      'Private transfers within the shielded pool are not yet implemented in this demo.',
      [{ text: 'OK' }]
    );
  };

  // Utility functions
  const generateRandomSecret = (): string => {
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
  };

  const generateRandomNullifier = (): string => {
    return ethers.utils.hexlify(ethers.utils.randomBytes(32));
  };

  const generateCommitment = (secret: string, nullifier: string, amount: string): string => {
    // Simplified commitment generation - in production, use Poseidon hash
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32', 'uint256'],
        [secret, nullifier, ethers.utils.parseEther(amount)]
      )
    );
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Render functions
  const renderBalanceTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Shielded Balance Overview */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Icon name="security" size={24} color="#4CAF50" />
          <Text style={styles.balanceTitle}>Shielded Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>{totalShieldedBalance} ETH</Text>
        <Text style={styles.balanceSubtext}>
          {unspentCommitments.length} active note{unspentCommitments.length !== 1 ? 's' : ''}
        </Text>
        
        {/* Pool Statistics */}
        <View style={styles.poolStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{poolStats.totalDeposits}</Text>
            <Text style={styles.statLabel}>Total Deposits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{poolStats.activeCommitments}</Text>
            <Text style={styles.statLabel}>Active Notes</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.depositButton]}
            onPress={() => setTransactionMode('deposit')}
          >
            <Icon name="lock" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Shield</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => setTransactionMode('withdraw')}
          >
            <Icon name="lock-open" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Unshield</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.transferButton]}
            onPress={() => setTransactionMode('transfer')}
          >
            <Icon name="swap-horiz" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Transfer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Commitments List */}
      {privacySettings.showBalances && (
        <View style={styles.commitmentsCard}>
          <Text style={styles.sectionTitle}>Your Notes</Text>
          {unspentCommitments.length === 0 ? (
            <Text style={styles.emptyText}>No active notes</Text>
          ) : (
            unspentCommitments.map((note: ShieldedNote, index: number) => (
              <View key={index} style={styles.commitmentItem}>
                <View style={styles.commitmentInfo}>
                  <Text style={styles.commitmentAmount}>
                    {parseFloat(ethers.utils.formatEther(note.amount)).toFixed(4)} ETH
                  </Text>
                  <Text style={styles.commitmentHash}>
                    {note.commitment.substring(0, 10)}...{note.commitment.substring(56)}
                  </Text>
                </View>
                <View style={styles.commitmentStatus}>
                  <Icon name="verified" size={16} color="#4CAF50" />
                  <Text style={styles.statusText}>
                    {note.isSpent ? 'Spent' : 'Active'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderTransactionsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Transaction Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            transactionMode === 'deposit' && styles.activeModeButton,
          ]}
          onPress={() => setTransactionMode('deposit')}
        >
          <Text
            style={[
              styles.modeButtonText,
              transactionMode === 'deposit' && styles.activeModeButtonText,
            ]}
          >
            Shield Funds
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            transactionMode === 'withdraw' && styles.activeModeButton,
          ]}
          onPress={() => setTransactionMode('withdraw')}
        >
          <Text
            style={[
              styles.modeButtonText,
              transactionMode === 'withdraw' && styles.activeModeButtonText,
            ]}
          >
            Unshield Funds
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            transactionMode === 'transfer' && styles.activeModeButton,
          ]}
          onPress={() => setTransactionMode('transfer')}
        >
          <Text
            style={[
              styles.modeButtonText,
              transactionMode === 'transfer' && styles.activeModeButtonText,
            ]}
          >
            Private Transfer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Form */}
      <View style={styles.transactionCard}>
        <Text style={styles.sectionTitle}>
          {transactionMode === 'deposit' && 'Shield Funds'}
          {transactionMode === 'withdraw' && 'Unshield Funds'}
          {transactionMode === 'transfer' && 'Private Transfer'}
        </Text>

        <View style={styles.inputGroup}>
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

        {(transactionMode === 'withdraw' || transactionMode === 'transfer') && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {transactionMode === 'withdraw' ? 'Recipient Address' : 'Transfer To'}
            </Text>
            <TextInput
              style={styles.input}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x..."
              placeholderTextColor="#999"
            />
          </View>
        )}

        {transactionMode === 'transfer' && (
          <View style={styles.privacyOption}>
            <Text style={styles.privacyLabel}>Keep transfer private</Text>
            <Switch
              value={isPrivateTransaction}
              onValueChange={setIsPrivateTransaction}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={isPrivateTransaction ? '#FFF' : '#f4f3f4'}
            />
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.transactionButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={() => {
            if (transactionMode === 'deposit') handleDeposit();
            else if (transactionMode === 'withdraw') handleWithdraw();
            else handlePrivateTransfer();
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.transactionButtonText}>
              {transactionMode === 'deposit' && 'Shield Funds'}
              {transactionMode === 'withdraw' && 'Unshield Funds'}
              {transactionMode === 'transfer' && 'Send Privately'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Privacy Notice */}
      <View style={styles.noticeCard}>
        <Icon name="info" size={20} color="#2196F3" />
        <Text style={styles.noticeText}>
          {transactionMode === 'deposit' &&
            'Shielding funds provides privacy by breaking the link between your address and the funds.'}
          {transactionMode === 'withdraw' &&
            'Unshielding reveals the destination but keeps the source private.'}
          {transactionMode === 'transfer' &&
            'Private transfers keep both sender and receiver anonymous within the shielded pool.'}
        </Text>
      </View>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Privacy Settings</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Auto-Shield</Text>
            <Text style={styles.settingDescription}>
              Automatically shield incoming funds above threshold
            </Text>
          </View>
          <Switch
            value={privacySettings.autoShield}
            onValueChange={(value) => handleSettingChange('autoShield', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={privacySettings.autoShield ? '#FFF' : '#f4f3f4'}
          />
        </View>

        {privacySettings.autoShield && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shield Threshold (ETH)</Text>
            <TextInput
              style={styles.input}
              value={privacySettings.shieldThreshold}
              onChangeText={(value) => handleSettingChange('shieldThreshold', value)}
              placeholder="0.1"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        )}

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Default Privacy</Text>
            <Text style={styles.settingDescription}>
              Use private transactions by default
            </Text>
          </View>
          <Switch
            value={privacySettings.defaultPrivacy}
            onValueChange={(value) => handleSettingChange('defaultPrivacy', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={privacySettings.defaultPrivacy ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Show Balances</Text>
            <Text style={styles.settingDescription}>
              Display shielded balance details
            </Text>
          </View>
          <Switch
            value={privacySettings.showBalances}
            onValueChange={(value) => handleSettingChange('showBalances', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={privacySettings.showBalances ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Require Confirmation</Text>
            <Text style={styles.settingDescription}>
              Ask for confirmation before privacy operations
            </Text>
          </View>
          <Switch
            value={privacySettings.requireConfirmation}
            onValueChange={(value) => handleSettingChange('requireConfirmation', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={privacySettings.requireConfirmation ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Privacy Information */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>About Privacy Features</Text>
        <View style={styles.infoItem}>
          <Icon name="security" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Zero-knowledge proofs ensure your transactions remain private
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="group" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Larger anonymity sets provide better privacy protection
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="lock" size={20} color="#FF9800" />
          <Text style={styles.infoText}>
            Your keys never leave your device during proof generation
          </Text>
        </View>
        
        {/* Education Button */}
        <TouchableOpacity 
          style={styles.educationButton}
          onPress={() => onNavigate && onNavigate('PrivacyEducation')}
        >
          <Icon name="school" size={20} color="#FFF" />
          <Text style={styles.educationButtonText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => onNavigate && onNavigate('PrivacyAnalytics')}
        >
          <Icon name="analytics" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'balance' && styles.activeTab]}
          onPress={() => setActiveTab('balance')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'balance' && styles.activeTabText,
            ]}
          >
            Balance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'transactions' && styles.activeTab]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'transactions' && styles.activeTabText,
            ]}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'settings' && styles.activeTabText,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'balance' && renderBalanceTab()}
      {activeTab === 'transactions' && renderTransactionsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  helpButton: {
    padding: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#666',
  },
  actionsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  depositButton: {
    backgroundColor: '#4CAF50',
  },
  withdrawButton: {
    backgroundColor: '#FF9800',
  },
  transferButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  commitmentsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  commitmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  commitmentInfo: {
    flex: 1,
  },
  commitmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  commitmentHash: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  commitmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeButton: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  privacyLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  transactionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCC',
  },
  transactionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#1976D2',
    marginLeft: 8,
    lineHeight: 16,
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 16,
  },
  educationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  educationButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default PrivacyScreen;
