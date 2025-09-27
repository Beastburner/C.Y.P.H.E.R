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
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { ethers } from 'ethers';
import ShieldedPoolService, { ShieldedNote, DepositParams, WithdrawParams } from '../../services/shieldedPoolService';
import { useWallet } from '../../context/WalletContext';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../../styles/ModernTheme';
import { useTheme } from '../../context/ThemeContext';
import { CypherHeaderLogo } from '../../components/CypherLogo';

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
  // Wallet context and theme
  const { state, getBalance, getTransactions } = useWallet();
  const { colors, typography, spacing, createCardStyle, createButtonStyle, gradients } = useTheme();
  const { width, height } = Dimensions.get('window');
  
  // State management
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'settings'>('balance');
  const [shieldedNotes, setShieldedNotes] = useState<ShieldedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shieldedService, setShieldedService] = useState<ShieldedPoolService | null>(null);
  const [shieldedBalance, setShieldedBalance] = useState('0');
  
  // Real pool stats from blockchain
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

  // Initialize service with real contract data
  useEffect(() => {
    initializeService();
  }, [state.currentNetwork]);

  const initializeService = async () => {
    try {
      if (!state.currentNetwork?.rpcUrl) return;
      
      const provider = new ethers.providers.JsonRpcProvider(state.currentNetwork.rpcUrl);
      
      // Get real deployed contract address from environment or deployment
      let contractAddress = process.env.SHIELDED_POOL_CONTRACT;
      if (!contractAddress && state.currentNetwork.name.includes('Sepolia')) {
        // For demo: use a placeholder that would be replaced with actual deployed address
        contractAddress = '0x0000000000000000000000000000000000000000'; // Replace with actual deployed address
      }
      
      if (contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
        const service = new ShieldedPoolService(provider, contractAddress);
        setShieldedService(service);
        
        await loadShieldedData(service);
      } else {
        // For demo purposes, show empty state instead of mock data
        setPoolStats({
          totalDeposits: '0',
          totalWithdrawals: '0',
          activeCommitments: '0',
          poolBalance: '0'
        });
        setShieldedBalance('0');
        setShieldedNotes([]);
      }
    } catch (error) {
      console.error('Failed to initialize shielded service:', error);
      // Set empty state on error instead of mock data
      setPoolStats({
        totalDeposits: '0',
        totalWithdrawals: '0',
        activeCommitments: '0',
        poolBalance: '0'
      });
      setShieldedBalance('0');
      setShieldedNotes([]);
    }
  };

  const loadShieldedData = async (service?: ShieldedPoolService) => {
    try {
      const serviceToUse = service || shieldedService;
      if (!serviceToUse) return;

      setIsLoading(true);
      
      // Load real balance and notes from blockchain
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
      // On error, show empty state
      setShieldedBalance('0');
      setShieldedNotes([]);
      setPoolStats({
        totalDeposits: '0',
        totalWithdrawals: '0',
        activeCommitments: '0',
        poolBalance: '0'
      });
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

  // Render functions with modern theming
  const renderBalanceTab = () => (
    <ScrollView 
      style={[styles.tabContent, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh}
          tintColor={ModernColors.privacy.enhanced}
          colors={[ModernColors.privacy.enhanced]}
        />
      }
    >
      {/* Shielded Balance Overview with Gradient */}
      <LinearGradient
        colors={[ModernColors.privacy.enhanced, ModernColors.privacy.enhanced + '80']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.balanceHeader}>
          <Icon name="security" size={24} color="#FFF" />
          <Text style={[styles.balanceTitle, { color: '#FFF' }]}>Shielded Balance</Text>
        </View>
        <Text style={[styles.balanceAmount, { color: '#FFF' }]}>{totalShieldedBalance} ETH</Text>
        <Text style={[styles.balanceSubtext, { color: 'rgba(255, 255, 255, 0.8)' }]}>
          {unspentCommitments.length} active note{unspentCommitments.length !== 1 ? 's' : ''}
        </Text>
        
        {/* Pool Statistics */}
        <View style={[styles.poolStats, { borderTopColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFF' }]}>{poolStats.totalDeposits}</Text>
            <Text style={[styles.statLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>Total Deposits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#FFF' }]}>{poolStats.activeCommitments}</Text>
            <Text style={[styles.statLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>Active Notes</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
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
        <View style={[styles.commitmentsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your Notes</Text>
          {unspentCommitments.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceSecondary }]}>
              <Icon name="shield" size={48} color={ModernColors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No active notes</Text>
              <Text style={[styles.emptySubtext, { color: colors.textTertiary }]}>
                Start shielding funds to create private notes
              </Text>
            </View>
          ) : (
            unspentCommitments.map((note: ShieldedNote, index: number) => (
              <View key={index} style={[styles.commitmentItem, { borderBottomColor: colors.border }]}>
                <View style={styles.commitmentInfo}>
                  <Text style={[styles.commitmentAmount, { color: colors.textPrimary }]}>
                    {parseFloat(ethers.utils.formatEther(note.amount)).toFixed(4)} ETH
                  </Text>
                  <Text style={[styles.commitmentHash, { color: colors.textSecondary }]}>
                    {note.commitment.substring(0, 10)}...{note.commitment.substring(56)}
                  </Text>
                </View>
                <View style={styles.commitmentStatus}>
                  <Icon name="verified" size={16} color={ModernColors.success} />
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
    <ScrollView style={[styles.tabContent, { backgroundColor: colors.background }]}>
      {/* Transaction Mode Selector */}
      <View style={[styles.modeSelector, { backgroundColor: colors.surface }]}>
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
              { color: transactionMode === 'deposit' ? '#FFF' : colors.textSecondary }
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
              { color: transactionMode === 'withdraw' ? '#FFF' : colors.textSecondary }
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
              { color: transactionMode === 'transfer' ? '#FFF' : colors.textSecondary }
            ]}
          >
            Private Transfer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Form */}
      <View style={[styles.transactionCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {transactionMode === 'deposit' && 'Shield Funds'}
          {transactionMode === 'withdraw' && 'Unshield Funds'}
          {transactionMode === 'transfer' && 'Private Transfer'}
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Amount (ETH)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {(transactionMode === 'withdraw' || transactionMode === 'transfer') && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              {transactionMode === 'withdraw' ? 'Recipient Address' : 'Transfer To'}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        {transactionMode === 'transfer' && (
          <View style={[styles.privacyOption, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.privacyLabel, { color: colors.textPrimary }]}>Keep transfer private</Text>
            <Switch
              value={isPrivateTransaction}
              onValueChange={setIsPrivateTransaction}
              trackColor={{ false: colors.textTertiary, true: ModernColors.privacy.enhanced }}
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
        <Icon name="info" size={20} color={ModernColors.info} />
        <Text style={[styles.noticeText, { color: ModernColors.info }]}>
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
    <ScrollView style={[styles.tabContent, { backgroundColor: colors.background }]}>
      <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Privacy Settings</Text>

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Auto-Shield</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Automatically shield incoming funds above threshold
            </Text>
          </View>
          <Switch
            value={privacySettings.autoShield}
            onValueChange={(value) => handleSettingChange('autoShield', value)}
            trackColor={{ false: colors.textTertiary, true: ModernColors.privacy.enhanced }}
            thumbColor={privacySettings.autoShield ? '#FFF' : '#f4f3f4'}
          />
        </View>

        {privacySettings.autoShield && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Shield Threshold (ETH)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.border }]}
              value={privacySettings.shieldThreshold}
              onChangeText={(value) => handleSettingChange('shieldThreshold', value)}
              placeholder="0.1"
              keyboardType="numeric"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        )}

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Default Privacy</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Use private transactions by default
            </Text>
          </View>
          <Switch
            value={privacySettings.defaultPrivacy}
            onValueChange={(value) => handleSettingChange('defaultPrivacy', value)}
            trackColor={{ false: colors.textTertiary, true: ModernColors.privacy.enhanced }}
            thumbColor={privacySettings.defaultPrivacy ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Show Balances</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Display shielded balance details
            </Text>
          </View>
          <Switch
            value={privacySettings.showBalances}
            onValueChange={(value) => handleSettingChange('showBalances', value)}
            trackColor={{ false: colors.textTertiary, true: ModernColors.privacy.enhanced }}
            thumbColor={privacySettings.showBalances ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Require Confirmation</Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Ask for confirmation before privacy operations
            </Text>
          </View>
          <Switch
            value={privacySettings.requireConfirmation}
            onValueChange={(value) => handleSettingChange('requireConfirmation', value)}
            trackColor={{ false: colors.textTertiary, true: ModernColors.privacy.enhanced }}
            thumbColor={privacySettings.requireConfirmation ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Privacy Information */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>About Privacy Features</Text>
        <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary }]}>
          <Icon name="security" size={20} color={ModernColors.success} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Zero-knowledge proofs ensure your transactions remain private
          </Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary }]}>
          <Icon name="group" size={20} color={ModernColors.info} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Larger anonymity sets provide better privacy protection
          </Text>
        </View>
        <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary }]}>
          <Icon name="lock" size={20} color={ModernColors.warning} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={ModernColors.primaryGradient[0]} />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={ModernColors.primaryGradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <CypherHeaderLogo color="light" />
            <Text style={[styles.headerTitle, { color: colors.textInverse }]}>Privacy Dashboard</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => onNavigate && onNavigate('PrivacyAnalytics')}
          >
            <Icon name="analytics" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Modern Tab Navigation */}
      <View style={[styles.tabNavigation, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tabButton, 
            activeTab === 'balance' && [styles.activeTab, { borderBottomColor: ModernColors.privacy.enhanced }]
          ]}
          onPress={() => setActiveTab('balance')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'balance' && [styles.activeTabText, { color: ModernColors.privacy.enhanced }],
              { color: colors.textSecondary }
            ]}
          >
            Balance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton, 
            activeTab === 'transactions' && [styles.activeTab, { borderBottomColor: ModernColors.privacy.enhanced }]
          ]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'transactions' && [styles.activeTabText, { color: ModernColors.privacy.enhanced }],
              { color: colors.textSecondary }
            ]}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton, 
            activeTab === 'settings' && [styles.activeTab, { borderBottomColor: ModernColors.privacy.enhanced }]
          ]}
          onPress={() => setActiveTab('settings')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'settings' && [styles.activeTabText, { color: ModernColors.privacy.enhanced }],
              { color: colors.textSecondary }
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
    backgroundColor: ModernColors.background,
  },
  
  // Modern Header Styles
  headerGradient: {
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.md,
    minHeight: 60,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textInverse,
  },
  helpButton: {
    padding: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Modern Tab Navigation
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: ModernColors.surface,
    ...ModernShadows.small,
  },
  tabButton: {
    flex: 1,
    paddingVertical: ModernSpacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: ModernColors.privacy.enhanced,
  },
  tabButtonText: {
    fontSize: 14,
    color: ModernColors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: ModernColors.privacy.enhanced,
    fontWeight: '600',
  },
  
  // Content Area
  tabContent: {
    flex: 1,
    padding: ModernSpacing.lg,
    backgroundColor: ModernColors.background,
  },
  
  // Modern Card Styles
  balanceCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginBottom: ModernSpacing.lg,
    ...ModernShadows.medium,
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernSpacing.md,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginLeft: ModernSpacing.sm,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: ModernColors.privacy.enhanced,
    marginBottom: ModernSpacing.xs,
  },
  balanceSubtext: {
    fontSize: 14,
    color: ModernColors.textSecondary,
  },
  
  // Pool Statistics
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: ModernSpacing.lg,
    paddingTop: ModernSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: ModernColors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    textAlign: 'center',
  },
  
  // Action Cards
  actionsCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginBottom: ModernSpacing.lg,
    ...ModernShadows.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.lg,
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
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.lg,
    borderRadius: ModernBorderRadius.md,
    marginHorizontal: ModernSpacing.xs,
    ...ModernShadows.small,
  },
  depositButton: {
    backgroundColor: ModernColors.success,
  },
  withdrawButton: {
    backgroundColor: ModernColors.warning,
  },
  transferButton: {
    backgroundColor: ModernColors.info,
  },
  actionButtonText: {
    color: ModernColors.textInverse,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: ModernSpacing.xs,
  },
  
  // Commitments List
  commitmentsCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    ...ModernShadows.medium,
  },
  emptyText: {
    textAlign: 'center',
    color: ModernColors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    padding: ModernSpacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    padding: ModernSpacing.xl,
    borderRadius: ModernBorderRadius.md,
  },
  emptySubtext: {
    textAlign: 'center',
    color: ModernColors.textTertiary,
    fontSize: 12,
    marginTop: ModernSpacing.xs,
  },
  commitmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ModernSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.border,
  },
  commitmentInfo: {
    flex: 1,
  },
  commitmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
  },
  commitmentHash: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    fontFamily: 'monospace',
    marginTop: ModernSpacing.xs,
  },
  commitmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernColors.success + '20',
    paddingHorizontal: ModernSpacing.sm,
    paddingVertical: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    color: ModernColors.success,
    marginLeft: ModernSpacing.xs,
    fontWeight: '500',
  },
  
  // Transaction Mode Selector
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xs,
    marginBottom: ModernSpacing.lg,
    ...ModernShadows.medium,
  },
  modeButton: {
    flex: 1,
    paddingVertical: ModernSpacing.md,
    alignItems: 'center',
    borderRadius: ModernBorderRadius.md,
  },
  activeModeButton: {
    backgroundColor: ModernColors.privacy.enhanced,
    ...ModernShadows.small,
  },
  modeButtonText: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    fontWeight: '500',
  },
  activeModeButtonText: {
    color: ModernColors.textInverse,
    fontWeight: '600',
  },
  
  // Transaction Card
  transactionCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginBottom: ModernSpacing.lg,
    ...ModernShadows.medium,
  },
  inputGroup: {
    marginBottom: ModernSpacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.sm,
    fontWeight: '500',
  },
  input: {
    backgroundColor: ModernColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: ModernColors.border,
    borderRadius: ModernBorderRadius.md,
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.md,
    fontSize: 16,
    color: ModernColors.textPrimary,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernSpacing.lg,
    padding: ModernSpacing.md,
    backgroundColor: ModernColors.surfaceSecondary,
    borderRadius: ModernBorderRadius.md,
  },
  privacyLabel: {
    fontSize: 14,
    color: ModernColors.textPrimary,
    fontWeight: '500',
  },
  transactionButton: {
    backgroundColor: ModernColors.privacy.enhanced,
    paddingVertical: ModernSpacing.lg,
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ModernShadows.small,
  },
  disabledButton: {
    backgroundColor: ModernColors.textTertiary,
  },
  transactionButtonText: {
    color: ModernColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Notice Card
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: ModernColors.info + '20',
    borderRadius: ModernBorderRadius.md,
    padding: ModernSpacing.lg,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: ModernColors.info,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: ModernColors.info,
    marginLeft: ModernSpacing.sm,
    lineHeight: 16,
  },
  
  // Settings Card
  settingsCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    marginBottom: ModernSpacing.lg,
    ...ModernShadows.medium,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ModernSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: ModernSpacing.lg,
  },
  settingTitle: {
    fontSize: 14,
    color: ModernColors.textPrimary,
    fontWeight: '500',
    marginBottom: ModernSpacing.xs,
  },
  settingDescription: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    lineHeight: 16,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    padding: ModernSpacing.xl,
    ...ModernShadows.medium,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: ModernSpacing.md,
    padding: ModernSpacing.sm,
    backgroundColor: ModernColors.surfaceSecondary,
    borderRadius: ModernBorderRadius.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: ModernColors.textSecondary,
    marginLeft: ModernSpacing.sm,
    lineHeight: 16,
  },
  educationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ModernColors.info,
    borderRadius: ModernBorderRadius.md,
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.lg,
    marginTop: ModernSpacing.lg,
    ...ModernShadows.small,
  },
  educationButtonText: {
    color: ModernColors.textInverse,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: ModernSpacing.sm,
  },
});

export default PrivacyScreen;
