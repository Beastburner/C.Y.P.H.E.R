import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface PrivacyPool {
  id: string;
  denomination: string;
  balance: string;
  anonymitySet: number;
  apy: string;
  isActive: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  nullifierHash?: string;
  commitmentHash?: string;
}

const PrivacyPoolScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [privacyPools, setPrivacyPools] = useState<PrivacyPool[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedPool, setSelectedPool] = useState<string>('1');

  // Mock data initialization
  useEffect(() => {
    const initializeData = () => {
      setPrivacyPools([
        {
          id: '1',
          denomination: '0.1 ETH',
          balance: '2.3 ETH',
          anonymitySet: 1247,
          apy: '4.2%',
          isActive: true,
        },
        {
          id: '2',
          denomination: '1 ETH',
          balance: '8.0 ETH',
          anonymitySet: 892,
          apy: '5.1%',
          isActive: true,
        },
        {
          id: '3',
          denomination: '10 ETH',
          balance: '20.0 ETH',
          anonymitySet: 345,
          apy: '6.3%',
          isActive: true,
        },
      ]);

      setTransactions([
        {
          id: '1',
          type: 'deposit',
          amount: '1.0 ETH',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 86400000),
          commitmentHash: '0xabc123...',
        },
        {
          id: '2',
          type: 'withdrawal',
          amount: '0.1 ETH',
          status: 'pending',
          timestamp: new Date(Date.now() - 3600000),
          nullifierHash: '0xdef456...',
        },
      ]);
    };

    initializeData();
  }, []);

  const handleDeposit = useCallback(async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate deposit process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: `${depositAmount} ETH`,
        status: 'pending',
        timestamp: new Date(),
        commitmentHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setDepositAmount('');
      
      Alert.alert('Success', 'Deposit initiated! Your transaction is being processed.');
      setActiveTab('history');
    } catch (error) {
      Alert.alert('Error', 'Failed to process deposit. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [depositAmount]);

  const handleWithdraw = useCallback(async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid withdrawal amount');
      return;
    }

    if (!recipientAddress) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate withdrawal process with ZK proof generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'withdrawal',
        amount: `${withdrawAmount} ETH`,
        status: 'pending',
        timestamp: new Date(),
        nullifierHash: `0x${Math.random().toString(16).substr(2, 8)}...`,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setWithdrawAmount('');
      setRecipientAddress('');
      
      Alert.alert('Success', 'Withdrawal initiated! Zero-knowledge proof is being generated.');
      setActiveTab('history');
    } catch (error) {
      Alert.alert('Error', 'Failed to process withdrawal. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [withdrawAmount, recipientAddress]);

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.statsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.statsTitle}>Total Privacy Balance</Text>
        <Text style={styles.statsValue}>30.3 ETH</Text>
        <Text style={styles.statsSubtitle}>≈ $54,540 USD</Text>
      </LinearGradient>

      <View style={styles.poolsList}>
        <Text style={styles.sectionTitle}>Privacy Pools</Text>
        {privacyPools.map(pool => (
          <View key={pool.id} style={styles.poolCard}>
            <View style={styles.poolHeader}>
              <Text style={styles.poolDenomination}>{pool.denomination}</Text>
              <View style={styles.poolStatus}>
                <View style={[styles.statusDot, { backgroundColor: pool.isActive ? '#4CAF50' : '#FF5722' }]} />
                <Text style={styles.statusText}>{pool.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            
            <View style={styles.poolStats}>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>Balance</Text>
                <Text style={styles.poolStatValue}>{pool.balance}</Text>
              </View>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>Anonymity Set</Text>
                <Text style={styles.poolStatValue}>{pool.anonymitySet.toLocaleString()}</Text>
              </View>
              <View style={styles.poolStat}>
                <Text style={styles.poolStatLabel}>APY</Text>
                <Text style={[styles.poolStatValue, { color: '#4CAF50' }]}>{pool.apy}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderDeposit = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#11998e', '#38ef7d']}
        style={styles.actionCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="lock" size={40} color="#FFFFFF" style={styles.actionIcon} />
        <Text style={styles.actionTitle}>Shield Your Funds</Text>
        <Text style={styles.actionSubtitle}>
          Deposit ETH into privacy pools to enhance anonymity
        </Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.formLabel}>Select Pool</Text>
        <View style={styles.poolSelector}>
          {privacyPools.map(pool => (
            <TouchableOpacity
              key={pool.id}
              style={[
                styles.poolOption,
                selectedPool === pool.id && styles.poolOptionSelected
              ]}
              onPress={() => setSelectedPool(pool.id)}
            >
              <Text style={[
                styles.poolOptionText,
                selectedPool === pool.id && styles.poolOptionTextSelected
              ]}>
                {pool.denomination}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Deposit Amount (ETH)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={depositAmount}
            onChangeText={setDepositAmount}
            placeholder="0.0"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.inputSuffix}>ETH</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={handleDeposit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="security" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Deposit & Shield</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWithdraw = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#ee9ca7', '#ffdde1']}
        style={styles.actionCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="visibility-off" size={40} color="#FFFFFF" style={styles.actionIcon} />
        <Text style={styles.actionTitle}>Anonymous Withdrawal</Text>
        <Text style={styles.actionSubtitle}>
          Withdraw funds privately using zero-knowledge proofs
        </Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.formLabel}>Select Pool</Text>
        <View style={styles.poolSelector}>
          {privacyPools.filter(pool => parseFloat(pool.balance) > 0).map(pool => (
            <TouchableOpacity
              key={pool.id}
              style={[
                styles.poolOption,
                selectedPool === pool.id && styles.poolOptionSelected
              ]}
              onPress={() => setSelectedPool(pool.id)}
            >
              <Text style={[
                styles.poolOptionText,
                selectedPool === pool.id && styles.poolOptionTextSelected
              ]}>
                {pool.denomination}
              </Text>
              <Text style={styles.poolBalance}>Balance: {pool.balance}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.formLabel}>Withdrawal Amount (ETH)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            placeholder="0.0"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.inputSuffix}>ETH</Text>
        </View>

        <Text style={styles.formLabel}>Recipient Address</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={recipientAddress}
            onChangeText={setRecipientAddress}
            placeholder="0x..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.inputButton}>
            <Icon name="qr-code-scanner" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          onPress={handleWithdraw}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="visibility-off" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Generate ZK Proof & Withdraw</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="history" size={60} color="#888" />
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionsList}>
          {transactions.map(tx => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionType}>
                  <Icon 
                    name={tx.type === 'deposit' ? 'lock' : 'visibility-off'} 
                    size={24} 
                    color={tx.type === 'deposit' ? '#4CAF50' : '#FF9800'}
                  />
                  <Text style={styles.transactionTypeText}>
                    {tx.type === 'deposit' ? 'Shielded Deposit' : 'Private Withdrawal'}
                  </Text>
                </View>
                <View style={[
                  styles.transactionStatus,
                  { backgroundColor: tx.status === 'confirmed' ? '#4CAF50' : 
                                    tx.status === 'pending' ? '#FF9800' : '#FF5722' }
                ]}>
                  <Text style={styles.transactionStatusText}>
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionAmount}>{tx.amount}</Text>
                <Text style={styles.transactionTime}>
                  {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                </Text>
              </View>

              {(tx.commitmentHash || tx.nullifierHash) && (
                <View style={styles.transactionHashes}>
                  {tx.commitmentHash && (
                    <Text style={styles.hashText}>
                      Commitment: {tx.commitmentHash}
                    </Text>
                  )}
                  {tx.nullifierHash && (
                    <Text style={styles.hashText}>
                      Nullifier: {tx.nullifierHash}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Privacy Pools</Text>
          <Text style={styles.headerSubtitle}>Enhanced anonymity through zero-knowledge</Text>
        </View>
        
        <TouchableOpacity style={styles.infoButton}>
          <Icon name="info-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'dashboard' },
          { key: 'deposit', label: 'Deposit', icon: 'lock' },
          { key: 'withdraw', label: 'Withdraw', icon: 'visibility-off' },
          { key: 'history', label: 'History', icon: 'history' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? '#667eea' : '#888'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'deposit' && renderDeposit()}
        {activeTab === 'withdraw' && renderWithdraw()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  infoButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  statsCard: {
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  poolsList: {
    flex: 1,
  },
  poolCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  poolDenomination: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  poolStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  poolStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  poolStat: {
    alignItems: 'center',
  },
  poolStatLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  poolStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  actionCard: {
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  poolSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  poolOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  poolOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  poolOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  poolOptionTextSelected: {
    color: '#FFFFFF',
  },
  poolBalance: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputSuffix: {
    paddingRight: 16,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  inputButton: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  transactionsList: {
    flex: 1,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  transactionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  transactionTime: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  transactionHashes: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  hashText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
  },
});

export default PrivacyPoolScreen;
