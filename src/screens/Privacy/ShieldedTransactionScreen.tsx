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
  Modal,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface ShieldedTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  recipient?: string;
  sender?: string;
  status: 'pending' | 'generating_proof' | 'confirmed' | 'failed';
  timestamp: Date;
  proofGenerationTime?: number;
  anonymitySet?: number;
  fee: string;
  zkProofHash?: string;
}

interface ContactMethod {
  id: string;
  name: string;
  address: string;
  ensName?: string;
  isShielded: boolean;
  trustLevel: 'high' | 'medium' | 'low';
}

const ShieldedTransactionScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'history'>('send');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<ShieldedTransaction[]>([]);
  const [contacts, setContacts] = useState<ContactMethod[]>([]);
  
  // Send form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customFee, setCustomFee] = useState('');
  const [delayedSend, setDelayedSend] = useState(false);
  const [sendDelay, setSendDelay] = useState('1');
  
  // Receive state
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveNote, setReceiveNote] = useState('');
  const [shieldedAddress, setShieldedAddress] = useState('');
  
  // Modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);

  // Initialize mock data
  useEffect(() => {
    const initializeData = () => {
      setContacts([
        {
          id: '1',
          name: 'Alice Cooper',
          address: '0x742d35cc6665c0532cb5d8c533f98cb8b5d9ccb8',
          ensName: 'alice.eth',
          isShielded: true,
          trustLevel: 'high',
        },
        {
          id: '2',
          name: 'Bob Wilson',
          address: '0x8ba1f109551bd432803012645hac136c0c8b5d9cc',
          ensName: 'bob.eth',
          isShielded: true,
          trustLevel: 'medium',
        },
        {
          id: '3',
          name: 'Charlie Brown',
          address: '0x9ca2f209661cd542904023656iad246d1d9d5d8dd',
          isShielded: false,
          trustLevel: 'low',
        },
      ]);

      setTransactions([
        {
          id: '1',
          type: 'send',
          amount: '0.5 ETH',
          recipient: '0x742d35cc6665c0532cb5d8c533f98cb8b5d9ccb8',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 86400000),
          proofGenerationTime: 45,
          anonymitySet: 1247,
          fee: '0.001 ETH',
          zkProofHash: '0xabc123def456...',
        },
        {
          id: '2',
          type: 'receive',
          amount: '1.2 ETH',
          sender: '0x8ba1f109551bd432803012645hac136c0c8b5d9cc',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 3600000),
          anonymitySet: 892,
          fee: '0.0008 ETH',
          zkProofHash: '0xdef456abc123...',
        },
      ]);

      // Generate shielded address
      setShieldedAddress('shield_0x' + Math.random().toString(16).substr(2, 40));
    };

    initializeData();
  }, []);

  const generateZKProof = useCallback(async () => {
    setShowProofModal(true);
    setProofProgress(0);
    
    const steps = [
      'Initializing circuit...',
      'Generating witness...',
      'Computing proof...',
      'Verifying proof...',
      'Submitting transaction...',
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProofProgress((i + 1) / steps.length * 100);
    }
    
    setShowProofModal(false);
    return `0x${Math.random().toString(16).substr(2, 16)}...`;
  }, []);

  const handleSendShielded = useCallback(async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      // Generate ZK proof
      const zkProofHash = await generateZKProof();
      
      const newTransaction: ShieldedTransaction = {
        id: Date.now().toString(),
        type: 'send',
        amount: `${amount} ETH`,
        recipient,
        status: 'pending',
        timestamp: new Date(),
        proofGenerationTime: Math.floor(Math.random() * 60) + 30,
        anonymitySet: Math.floor(Math.random() * 1000) + 500,
        fee: customFee || '0.001 ETH',
        zkProofHash,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      // Reset form
      setRecipient('');
      setAmount('');
      setMemo('');
      setSelectedContactId(null);
      setCustomFee('');
      
      Alert.alert('Success', 'Shielded transaction initiated! Your funds are being sent privately.');
      setActiveTab('history');
    } catch (error) {
      Alert.alert('Error', 'Failed to send shielded transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [recipient, amount, customFee, generateZKProof]);

  const selectContact = useCallback((contact: ContactMethod) => {
    setRecipient(contact.address);
    setSelectedContactId(contact.id);
    setShowContactModal(false);
  }, []);

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#FF5722';
      default: return '#888';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderSend = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.actionCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="send" size={40} color="#FFFFFF" style={styles.actionIcon} />
        <Text style={styles.actionTitle}>Send Shielded Transaction</Text>
        <Text style={styles.actionSubtitle}>
          Send ETH privately using zero-knowledge proofs
        </Text>
      </LinearGradient>

      <View style={styles.form}>
        <Text style={styles.formLabel}>Recipient</Text>
        <View style={styles.recipientContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, selectedContactId ? styles.inputWithContact : null]}
              value={recipient}
              onChangeText={setRecipient}
              placeholder="0x... or ENS name"
              placeholderTextColor="#888"
            />
            {selectedContactId && (
              <View style={styles.selectedContact}>
                <Text style={styles.contactName}>
                  {contacts.find(c => c.id === selectedContactId)?.name}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => setShowContactModal(true)}
          >
            <Icon name="contacts" size={20} color="#667eea" />
          </TouchableOpacity>
        </View>

        <Text style={styles.formLabel}>Amount (ETH)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.inputSuffix}>ETH</Text>
        </View>

        <Text style={styles.formLabel}>Private Memo (Optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="Encrypted message for recipient"
            multiline
            numberOfLines={3}
            placeholderTextColor="#888"
          />
        </View>

        {/* Advanced Options */}
        <TouchableOpacity 
          style={styles.advancedToggle}
          onPress={() => setAdvancedMode(!advancedMode)}
        >
          <Text style={styles.advancedToggleText}>Advanced Options</Text>
          <Icon 
            name={advancedMode ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#667eea" 
          />
        </TouchableOpacity>

        {advancedMode && (
          <View style={styles.advancedOptions}>
            <Text style={styles.formLabel}>Custom Fee (ETH)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={customFee}
                onChangeText={setCustomFee}
                placeholder="0.001"
                keyboardType="numeric"
                placeholderTextColor="#888"
              />
              <Text style={styles.inputSuffix}>ETH</Text>
            </View>

            <View style={styles.delayOption}>
              <Text style={styles.formLabel}>Delayed Send</Text>
              <View style={styles.delayControls}>
                <TouchableOpacity
                  style={[styles.delayButton, delayedSend && styles.delayButtonActive]}
                  onPress={() => setDelayedSend(!delayedSend)}
                >
                  <Icon 
                    name={delayedSend ? 'check-box' : 'check-box-outline-blank'} 
                    size={20} 
                    color={delayedSend ? '#4CAF50' : '#888'} 
                  />
                  <Text style={styles.delayButtonText}>Enable</Text>
                </TouchableOpacity>
                {delayedSend && (
                  <View style={styles.delayInput}>
                    <TextInput
                      style={styles.input}
                      value={sendDelay}
                      onChangeText={setSendDelay}
                      placeholder="1"
                      keyboardType="numeric"
                      placeholderTextColor="#888"
                    />
                    <Text style={styles.inputSuffix}>hours</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSendShielded}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="shield" size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Send Privately</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReceive = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#11998e', '#38ef7d']}
        style={styles.actionCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="qr-code" size={40} color="#FFFFFF" style={styles.actionIcon} />
        <Text style={styles.actionTitle}>Receive Shielded Funds</Text>
        <Text style={styles.actionSubtitle}>
          Generate a private address for receiving anonymous payments
        </Text>
      </LinearGradient>

      <View style={styles.receiveContainer}>
        <Text style={styles.formLabel}>Your Shielded Address</Text>
        <View style={styles.addressContainer}>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{shieldedAddress}</Text>
            <TouchableOpacity style={styles.copyButton}>
              <Icon name="content-copy" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Icon name="qr-code" size={80} color="#888" />
            <Text style={styles.qrText}>QR Code</Text>
          </View>
        </View>

        <Text style={styles.formLabel}>Expected Amount (Optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={receiveAmount}
            onChangeText={setReceiveAmount}
            placeholder="0.0"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
          <Text style={styles.inputSuffix}>ETH</Text>
        </View>

        <Text style={styles.formLabel}>Note for Sender (Optional)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, styles.memoInput]}
            value={receiveNote}
            onChangeText={setReceiveNote}
            placeholder="Add a note for the sender"
            multiline
            numberOfLines={3}
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.receiveActions}>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share" size={20} color="#667eea" />
            <Text style={styles.shareButtonText}>Share Address</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.regenerateButton}>
            <Icon name="refresh" size={20} color="#FF9800" />
            <Text style={styles.regenerateButtonText}>New Address</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Shielded Transaction History</Text>
      
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="history" size={60} color="#888" />
          <Text style={styles.emptyStateText}>No shielded transactions yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.transactionsList}>
          {transactions.map(tx => (
            <View key={tx.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionType}>
                  <LinearGradient
                    colors={tx.type === 'send' ? ['#667eea', '#764ba2'] : ['#11998e', '#38ef7d']}
                    style={styles.transactionIcon}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Icon 
                      name={tx.type === 'send' ? 'send' : 'get-app'} 
                      size={20} 
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTypeText}>
                      {tx.type === 'send' ? 'Shielded Send' : 'Shielded Receive'}
                    </Text>
                    <Text style={styles.transactionAddress}>
                      {tx.type === 'send' ? 
                        `To: ${formatAddress(tx.recipient!)}` : 
                        `From: ${formatAddress(tx.sender!)}`
                      }
                    </Text>
                  </View>
                </View>
                
                <View style={[
                  styles.transactionStatus,
                  { backgroundColor: 
                    tx.status === 'confirmed' ? '#4CAF50' : 
                    tx.status === 'generating_proof' ? '#2196F3' :
                    tx.status === 'pending' ? '#FF9800' : '#FF5722' 
                  }
                ]}>
                  <Text style={styles.transactionStatusText}>
                    {tx.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.transactionAmount}>
                  <Text style={styles.amountText}>{tx.amount}</Text>
                  <Text style={styles.feeText}>Fee: {tx.fee}</Text>
                </View>
                
                <Text style={styles.transactionTime}>
                  {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString()}
                </Text>
              </View>

              {tx.status === 'confirmed' && (
                <View style={styles.privacyMetrics}>
                  <View style={styles.metric}>
                    <Icon name="group" size={16} color="#4CAF50" />
                    <Text style={styles.metricText}>
                      Anonymity Set: {tx.anonymitySet?.toLocaleString()}
                    </Text>
                  </View>
                  
                  <View style={styles.metric}>
                    <Icon name="timer" size={16} color="#2196F3" />
                    <Text style={styles.metricText}>
                      Proof Gen: {tx.proofGenerationTime}s
                    </Text>
                  </View>
                </View>
              )}

              {tx.zkProofHash && (
                <View style={styles.proofHash}>
                  <Icon name="verified" size={16} color="#4CAF50" />
                  <Text style={styles.hashText}>
                    ZK Proof: {tx.zkProofHash}
                  </Text>
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
          <Text style={styles.headerTitle}>Shielded Transactions</Text>
          <Text style={styles.headerSubtitle}>Private transfers with zero-knowledge proofs</Text>
        </View>
        
        <TouchableOpacity style={styles.infoButton}>
          <Icon name="info-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'send', label: 'Send', icon: 'send' },
          { key: 'receive', label: 'Receive', icon: 'qr-code' },
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
        {activeTab === 'send' && renderSend()}
        {activeTab === 'receive' && renderReceive()}
        {activeTab === 'history' && renderHistory()}
      </ScrollView>

      {/* Contact Selection Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Contact</Text>
              <TouchableOpacity onPress={() => setShowContactModal(false)}>
                <Icon name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.contactsList}>
              {contacts.map(contact => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => selectContact(contact)}
                >
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactAddress}>
                      {contact.ensName || formatAddress(contact.address)}
                    </Text>
                  </View>
                  
                  <View style={styles.contactBadges}>
                    {contact.isShielded && (
                      <View style={styles.shieldedBadge}>
                        <Icon name="shield" size={12} color="#FFFFFF" />
                        <Text style={styles.shieldedText}>Shielded</Text>
                      </View>
                    )}
                    
                    <View style={[
                      styles.trustBadge,
                      { backgroundColor: getTrustLevelColor(contact.trustLevel) }
                    ]}>
                      <Text style={styles.trustText}>
                        {contact.trustLevel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ZK Proof Generation Modal */}
      <Modal
        visible={showProofModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.proofModalOverlay}>
          <View style={styles.proofModalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.proofModalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="security" size={40} color="#FFFFFF" />
              <Text style={styles.proofModalTitle}>Generating ZK Proof</Text>
              <Text style={styles.proofModalSubtitle}>
                Creating zero-knowledge proof for your transaction
              </Text>
            </LinearGradient>
            
            <View style={styles.proofProgress}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${proofProgress}%` }
                ]} />
              </View>
              <Text style={styles.progressText}>{Math.round(proofProgress)}%</Text>
            </View>
            
            <Text style={styles.proofNote}>
              This process ensures your transaction is completely private and anonymous.
            </Text>
          </View>
        </View>
      </Modal>
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
  recipientContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  inputWithContact: {
    paddingBottom: 8,
  },
  selectedContact: {
    position: 'absolute',
    bottom: 4,
    left: 16,
  },
  contactName: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  contactButton: {
    padding: 16,
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputSuffix: {
    paddingRight: 16,
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingVertical: 8,
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  advancedOptions: {
    marginBottom: 16,
  },
  delayOption: {
    marginTop: 16,
  },
  delayControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  delayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  delayButtonActive: {
    // Add active styles if needed
  },
  delayButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  delayInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  receiveContainer: {
    flex: 1,
  },
  addressContainer: {
    marginBottom: 20,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  qrText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  receiveActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    gap: 8,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  regenerateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FF9800',
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  transactionAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'monospace',
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
    marginBottom: 12,
  },
  transactionAmount: {
    alignItems: 'flex-start',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  feeText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
  },
  privacyMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  proofHash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  hashText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    flex: 1,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  contactsList: {
    maxHeight: height * 0.5,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  contactInfo: {
    flex: 1,
  },
  contactAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  contactBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  shieldedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  shieldedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trustBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trustText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ZK Proof Modal styles
  proofModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofModalContent: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  proofModalHeader: {
    padding: 30,
    alignItems: 'center',
  },
  proofModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  proofModalSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  proofProgress: {
    padding: 30,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  proofNote: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
});

export default ShieldedTransactionScreen;
