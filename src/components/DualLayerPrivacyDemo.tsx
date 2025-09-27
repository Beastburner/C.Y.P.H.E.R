/**
 * Dual-Layer Privacy Workflow Demo
 * 
 * This component demonstrates the complete dual-layer privacy workflow:
 * 1. Public → Public: Normal Ethereum transfer
 * 2. Public → Private: Deposit via alias to shielded pool
 * 3. Private → Private: Shielded spend with ZK proofs  
 * 4. Private → Public: Withdrawal with ZK proof to public
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { privacyService } from '../services/PrivacyService';
import { dualLayerPrivacyService } from '../services/DualLayerPrivacyService';

interface TransactionFlowInfo {
  currentMode: 'public' | 'private';
  availableFlows: Array<{
    type: string;
    description: string;
    privacyScore: number;
  }>;
}

interface PrivacyStats {
  privateBalance: string;
  unspentNotes: number;
  aliasAccounts: number;
  transactionHistory: number;
}

export const DualLayerPrivacyDemo: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'public' | 'private'>('public');
  const [flowInfo, setFlowInfo] = useState<TransactionFlowInfo | null>(null);
  const [privacyStats, setPrivacyStats] = useState<PrivacyStats | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form states for different transaction types
  const [depositAmount, setDepositAmount] = useState('0.1');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('0.05');
  const [transferRecipient, setTransferRecipient] = useState('');

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      // Get current mode
      const mode = privacyService.getPrivacyMode();
      setCurrentMode(mode);

      // Get transaction flow info
      const flowData = await privacyService.getTransactionFlowInfo();
      setFlowInfo(flowData);

      // Get privacy stats
      const privateBalance = await privacyService.getPrivateBalance();
      const unspentNotes = await dualLayerPrivacyService.getUnspentNotes();
      const aliasAccounts = await dualLayerPrivacyService.getAliasAccounts();
      const transactionHistory = await dualLayerPrivacyService.getPrivacyTransactionHistory();

      setPrivacyStats({
        privateBalance,
        unspentNotes: unspentNotes.length,
        aliasAccounts: aliasAccounts.length,
        transactionHistory: transactionHistory.length
      });
    } catch (error) {
      console.error('❌ Failed to load privacy data:', error);
    }
  };

  const togglePrivacyMode = async () => {
    setLoading(true);
    try {
      const result = await privacyService.togglePrivacyMode();
      if (result.success) {
        setCurrentMode(result.mode);
        await loadPrivacyData();
        Alert.alert(
          'Privacy Mode Updated',
          `Switched to ${result.mode} mode. Balance ${result.balanceVisible ? 'visible' : 'hidden'}.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle privacy mode');
    } finally {
      setLoading(false);
    }
  };

  const createAliasAccount = async () => {
    setLoading(true);
    try {
      const result = await dualLayerPrivacyService.createAliasAccount();
      if (result.success && result.aliasAccount) {
        Alert.alert(
          'Alias Account Created',
          `New alias created: ${result.aliasAccount.address.substring(0, 10)}...`
        );
        await loadPrivacyData();
      } else {
        Alert.alert('Error', result.error || 'Failed to create alias account');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create alias account');
    } finally {
      setLoading(false);
    }
  };

  const depositToShieldedPool = async () => {
    if (!depositAmount) {
      Alert.alert('Error', 'Please enter deposit amount');
      return;
    }

    setLoading(true);
    try {
      const result = await dualLayerPrivacyService.depositToShieldedPool({
        amount: depositAmount,
      });

      if (result.success) {
        Alert.alert(
          'Deposit Successful',
          `Deposited ${depositAmount} ETH to shielded pool\nCommitment: ${result.commitment?.substring(0, 20)}...`
        );
        await loadPrivacyData();
      } else {
        Alert.alert('Error', result.error || 'Deposit failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to deposit to shielded pool');
    } finally {
      setLoading(false);
    }
  };

  const withdrawFromShieldedPool = async () => {
    if (!withdrawRecipient) {
      Alert.alert('Error', 'Please enter recipient address');
      return;
    }

    setLoading(true);
    try {
      const unspentNotes = await dualLayerPrivacyService.getUnspentNotes();
      if (unspentNotes.length === 0) {
        Alert.alert('Error', 'No unspent notes available');
        setLoading(false);
        return;
      }

      const note = unspentNotes[0]; // Use first available note
      const result = await dualLayerPrivacyService.withdrawFromShieldedPool({
        noteId: note.id,
        recipient: withdrawRecipient,
        amount: note.amount
      });

      if (result.success) {
        Alert.alert(
          'Withdrawal Successful',
          `Withdrew ${note.amount} ETH to ${withdrawRecipient.substring(0, 10)}...`
        );
        await loadPrivacyData();
      } else {
        Alert.alert('Error', result.error || 'Withdrawal failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to withdraw from shielded pool');
    } finally {
      setLoading(false);
    }
  };

  const sendShieldedTransaction = async () => {
    if (!transferAmount || !transferRecipient) {
      Alert.alert('Error', 'Please enter amount and recipient');
      return;
    }

    setLoading(true);
    try {
      const unspentNotes = await dualLayerPrivacyService.getUnspentNotes();
      if (unspentNotes.length === 0) {
        Alert.alert('Error', 'No unspent notes available');
        setLoading(false);
        return;
      }

      const result = await dualLayerPrivacyService.sendShieldedTransaction({
        inputNoteIds: [unspentNotes[0].id],
        outputs: [{
          recipient: transferRecipient,
          amount: transferAmount
        }]
      });

      if (result.success) {
        Alert.alert(
          'Shielded Transaction Successful',
          `Sent ${transferAmount} ETH privately to ${transferRecipient.substring(0, 10)}...`
        );
        await loadPrivacyData();
      } else {
        Alert.alert('Error', result.error || 'Transaction failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send shielded transaction');
    } finally {
      setLoading(false);
    }
  };

  const renderTransactionFlow = (flow: any) => {
    const getFlowColor = (score: number) => {
      if (score >= 90) return '#00ff88';
      if (score >= 70) return '#ffaa00';
      if (score >= 50) return '#ff8800';
      return '#ff4444';
    };

    return (
      <View key={flow.type} style={styles.flowItem}>
        <View style={styles.flowHeader}>
          <Text style={styles.flowType}>{flow.type}</Text>
          <View style={[styles.privacyScore, { backgroundColor: getFlowColor(flow.privacyScore) }]}>
            <Text style={styles.scoreText}>{flow.privacyScore}</Text>
          </View>
        </View>
        <Text style={styles.flowDescription}>{flow.description}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dual-Layer Privacy Workflow</Text>

      {/* Current Mode Display */}
      <View style={styles.modeContainer}>
        <Text style={styles.modeLabel}>Current Mode:</Text>
        <TouchableOpacity
          style={[
            styles.modeButton,
            { backgroundColor: currentMode === 'private' ? '#00ff88' : '#4285f4' }
          ]}
          onPress={togglePrivacyMode}
          disabled={loading}
        >
          <Text style={styles.modeButtonText}>
            {currentMode.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Stats */}
      {privacyStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Privacy Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{privacyStats.privateBalance}</Text>
              <Text style={styles.statLabel}>Private Balance</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{privacyStats.unspentNotes}</Text>
              <Text style={styles.statLabel}>Unspent Notes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{privacyStats.aliasAccounts}</Text>
              <Text style={styles.statLabel}>Alias Accounts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{privacyStats.transactionHistory}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </View>
      )}

      {/* Available Transaction Flows */}
      {flowInfo && (
        <View style={styles.flowsContainer}>
          <Text style={styles.sectionTitle}>Available Transaction Flows</Text>
          {flowInfo.availableFlows.map(renderTransactionFlow)}
        </View>
      )}

      {/* Transaction Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Privacy Actions</Text>

        {/* Create Alias Account */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={createAliasAccount}
          disabled={loading}
        >
          <Text style={styles.actionButtonText}>Create Alias Account</Text>
        </TouchableOpacity>

        {/* Public → Private (Deposit) */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionTitle}>Public → Private (Deposit)</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (ETH)"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={depositToShieldedPool}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Deposit to Shielded Pool</Text>
          </TouchableOpacity>
        </View>

        {/* Private → Public (Withdraw) */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionTitle}>Private → Public (Withdraw)</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipient Address"
            value={withdrawRecipient}
            onChangeText={setWithdrawRecipient}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={withdrawFromShieldedPool}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Withdraw from Shielded Pool</Text>
          </TouchableOpacity>
        </View>

        {/* Private → Private (Shielded Transfer) */}
        <View style={styles.actionGroup}>
          <Text style={styles.actionTitle}>Private → Private (Shielded Transfer)</Text>
          <TextInput
            style={styles.input}
            placeholder="Amount (ETH)"
            value={transferAmount}
            onChangeText={setTransferAmount}
          />
          <TextInput
            style={styles.input}
            placeholder="Recipient Address"
            value={transferRecipient}
            onChangeText={setTransferRecipient}
          />
          <TouchableOpacity
            style={styles.actionButton}
            onPress={sendShieldedTransaction}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>Send Shielded Transaction</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modeLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginRight: 10,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  statLabel: {
    fontSize: 12,
    color: '#cccccc',
  },
  flowsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  flowItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
    paddingBottom: 10,
    marginBottom: 10,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  flowType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  privacyScore: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flowDescription: {
    fontSize: 14,
    color: '#cccccc',
  },
  actionsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
  },
  actionGroup: {
    marginBottom: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#3a3a3a',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default DualLayerPrivacyDemo;
