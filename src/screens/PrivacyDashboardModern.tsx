import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// Import modern components
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernBalanceDisplay from '../components/ModernBalanceDisplay';
import ModernTransactionRow from '../components/ModernTransactionRow';

// Import theme and services
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';
import { PrivacyService } from '../services/PrivacyService';

const { width } = Dimensions.get('window');

interface PrivacyDashboardModernProps {
  onNavigate: (screen: string, params?: any) => void;
}

const PrivacyDashboardModern: React.FC<PrivacyDashboardModernProps> = ({ onNavigate }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(2);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'public-to-private' | 'private-to-private' | 'private-to-public'>('private-to-private');
  
  // Privacy state
  const [privacyStats, setPrivacyStats] = useState({
    totalPrivateTransactions: 127,
    shieldedBalance: 1.847,
    activeAliases: 3,
    privacyScore: 94,
  });

  // Balance with privacy layers
  const [balance, setBalance] = useState({
    public: 2.5,
    private: 1.8,
    currency: 'ETH',
    usdValue: {
      public: 4125.50,
      private: 2970.00,
    }
  });

  // Privacy transactions
  const [privacyTransactions, setPrivacyTransactions] = useState([
    { 
      id: '1', 
      type: 'deposit' as const, 
      amount: 0.5, 
      currency: 'ETH',
      from: 'alice.eth', 
      to: 'Private Vault', 
      timestamp: '2 min ago', 
      status: 'confirmed' as const, 
      mode: 'public-to-private' as const,
      hash: '0x742d35cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 825.00
    },
    { 
      id: '2', 
      type: 'send' as const, 
      amount: 0.3, 
      currency: 'ETH',
      from: 'Private Vault', 
      to: 'stealth_addr_1234', 
      timestamp: '1 hour ago', 
      status: 'confirmed' as const, 
      mode: 'private-to-private' as const,
      hash: '0x123d35cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 495.00
    },
    { 
      id: '3', 
      type: 'withdraw' as const, 
      amount: 0.8, 
      currency: 'ETH',
      from: 'Private Vault', 
      to: 'my-alias.eth', 
      timestamp: '1 day ago', 
      status: 'confirmed' as const, 
      mode: 'private-to-public' as const,
      hash: '0xabc335cc4d8f8b8c5f2a9c8d7e3f4a5b6c7d8e9f',
      usdValue: 1320.00
    },
  ]);

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      // Load privacy state from service
      const privacyService = PrivacyService.getInstance();
      const privacyState = await privacyService.getPrivacyState();
      setIsPrivateMode(privacyState.enabled);
      
      // Update stats based on real data
      // This would typically come from your privacy service
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPrivacyData();
    setRefreshing(false);
  };

  const togglePrivacyMode = async () => {
    try {
      const privacyService = PrivacyService.getInstance();
      if (isPrivateMode) {
        await privacyService.disablePrivacyMode();
      } else {
        await privacyService.enablePrivacyMode();
      }
      setIsPrivateMode(!isPrivateMode);
    } catch (error) {
      console.error('Failed to toggle privacy mode:', error);
      Alert.alert('Error', 'Failed to toggle privacy mode');
    }
  };

  const handlePrivateTransaction = () => {
    setShowTransactionModal(true);
  };

  const executePrivateTransaction = async () => {
    // This would integrate with your privacy service
    Alert.alert('Privacy Transaction', 'Transaction initiated with enhanced privacy');
    setShowTransactionModal(false);
  };

  const getPrivacyScoreColor = (score: number) => {
    if (score >= 90) return ModernColors.success;
    if (score >= 70) return ModernColors.warning;
    return ModernColors.error;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <ModernHeader
        title="Privacy Dashboard"
        subtitle="Enhanced Security Mode"
        isPrivateMode={isPrivateMode}
        isConnected={true}
        notifications={notifications}
        onPrivacyToggle={togglePrivacyMode}
        onSettingsPress={() => onNavigate('Settings')}
        onNotificationPress={() => setNotifications(0)}
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
            tintColor={ModernColors.privacy.enhanced}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Statistics */}
        <ModernCard variant="privacy" padding="medium" margin="medium">
          <Text style={styles.sectionTitle}>🛡️ Privacy Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{privacyStats.totalPrivateTransactions}</Text>
              <Text style={styles.statLabel}>Private Transactions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{privacyStats.shieldedBalance} ETH</Text>
              <Text style={styles.statLabel}>Shielded Balance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{privacyStats.activeAliases}</Text>
              <Text style={styles.statLabel}>Active Aliases</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: getPrivacyScoreColor(privacyStats.privacyScore) }]}>
                {privacyStats.privacyScore}%
              </Text>
              <Text style={styles.statLabel}>Privacy Score</Text>
            </View>
          </View>
        </ModernCard>

        {/* Enhanced Balance Display */}
        <ModernBalanceDisplay
          balance={balance}
          isPrivateMode={isPrivateMode}
          onToggleVisibility={() => {}}
          loading={refreshing}
          showUSD={true}
        />

        {/* Privacy Actions */}
        <ModernCard padding="medium" margin="medium">
          <Text style={styles.sectionTitle}>Privacy Actions</Text>
          <View style={styles.privacyActions}>
            <ModernButton
              title="Shield Funds"
              onPress={() => setTransactionType('public-to-private')}
              variant="primary"
              gradient={true}
              leftIcon={<Icon name="shield" size={20} color="#ffffff" />}
              fullWidth={true}
            />
            <ModernButton
              title="Private Transfer"
              onPress={handlePrivateTransaction}
              variant="secondary"
              leftIcon={<Icon name="eye-off" size={20} color={ModernColors.info} />}
              fullWidth={true}
            />
            <ModernButton
              title="Create Alias"
              onPress={() => Alert.alert('Create Alias', 'New privacy alias creation')}
              variant="ghost"
              leftIcon={<Icon name="user-plus" size={20} color={ModernColors.privacy.enhanced} />}
              fullWidth={true}
            />
          </View>
        </ModernCard>

        {/* Privacy Transactions */}
        <ModernCard title="Privacy Transactions" padding="none" margin="medium">
          <View style={{ paddingHorizontal: ModernSpacing.xl }}>
            {privacyTransactions.map((tx) => (
              <ModernTransactionRow
                key={tx.id}
                transaction={tx}
                onPress={(transaction) => onNavigate('TransactionDetail', { transaction })}
                showMode={true}
                compact={false}
              />
            ))}
          </View>
          <View style={styles.viewAllContainer}>
            <ModernButton
              title="View All Privacy Transactions"
              onPress={() => onNavigate('Transactions', { filter: 'privacy' })}
              variant="ghost"
              size="small"
            />
          </View>
        </ModernCard>

        {/* Privacy Settings */}
        <ModernCard title="Privacy Configuration" padding="medium" margin="medium">
          <View style={styles.privacySettings}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enhanced Privacy Mode</Text>
                <Text style={styles.settingDescription}>Enable maximum privacy protection</Text>
              </View>
              <Switch
                value={isPrivateMode}
                onValueChange={togglePrivacyMode}
                trackColor={{ false: ModernColors.border, true: ModernColors.privacy.enhanced }}
                thumbColor={isPrivateMode ? '#ffffff' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-Shield Large Amounts</Text>
                <Text style={styles.settingDescription}>Automatically shield amounts over 1 ETH</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: ModernColors.border, true: ModernColors.privacy.enhanced }}
                thumbColor="#ffffff"
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>ENS Privacy Mode</Text>
                <Text style={styles.settingDescription}>Use stealth addresses for ENS</Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: ModernColors.border, true: ModernColors.privacy.enhanced }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>
        </ModernCard>

        {/* Privacy Education */}
        <ModernCard title="Privacy Education" variant="glass" padding="medium" margin="medium">
          <View style={styles.educationContent}>
            <View style={styles.educationItem}>
              <Icon name="shield" size={24} color={ModernColors.privacy.enhanced} />
              <View style={styles.educationText}>
                <Text style={styles.educationTitle}>Dual-Layer Privacy</Text>
                <Text style={styles.educationDescription}>
                  Your transactions are protected by both alias accounts and shielded pools
                </Text>
              </View>
            </View>
            
            <View style={styles.educationItem}>
              <Icon name="eye-off" size={24} color={ModernColors.privacy.enhanced} />
              <View style={styles.educationText}>
                <Text style={styles.educationTitle}>Zero-Knowledge Proofs</Text>
                <Text style={styles.educationDescription}>
                  Prove transaction validity without revealing sensitive information
                </Text>
              </View>
            </View>
            
            <View style={styles.educationItem}>
              <Icon name="users" size={24} color={ModernColors.privacy.enhanced} />
              <View style={styles.educationText}>
                <Text style={styles.educationTitle}>Stealth Addresses</Text>
                <Text style={styles.educationDescription}>
                  Generate unique addresses for each transaction to break linkability
                </Text>
              </View>
            </View>
          </View>
        </ModernCard>
      </ScrollView>

      {/* Private Transaction Modal */}
      <Modal
        visible={showTransactionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient
            colors={ModernColors.privateMode.background}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTransactionModal(false)}
            >
              <Icon name="x" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Private Transaction</Text>
          </LinearGradient>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.transactionForm}>
              <Text style={styles.formLabel}>Transaction Type</Text>
              <View style={styles.transactionTypes}>
                <TouchableOpacity
                  style={[
                    styles.transactionTypeButton,
                    transactionType === 'private-to-private' && styles.transactionTypeActive
                  ]}
                  onPress={() => setTransactionType('private-to-private')}
                >
                  <Text style={styles.transactionTypeText}>Private → Private</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.transactionTypeButton,
                    transactionType === 'private-to-public' && styles.transactionTypeActive
                  ]}
                  onPress={() => setTransactionType('private-to-public')}
                >
                  <Text style={styles.transactionTypeText}>Private → Public</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.formLabel}>Recipient</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ENS name or stealth address"
                placeholderTextColor={ModernColors.textTertiary}
              />
              
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00 ETH"
                placeholderTextColor={ModernColors.textTertiary}
                keyboardType="numeric"
              />
              
              <Text style={styles.formLabel}>Privacy Note (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Encrypted memo for recipient"
                placeholderTextColor={ModernColors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <ModernButton
              title="Cancel"
              onPress={() => setShowTransactionModal(false)}
              variant="ghost"
              size="large"
            />
            <ModernButton
              title="Send Privately"
              onPress={executePrivateTransaction}
              variant="primary"
              gradient={true}
              size="large"
              leftIcon={<Icon name="shield" size={20} color="#ffffff" />}
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: ModernSpacing.lg,
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ModernColors.privacy.enhanced,
    marginBottom: ModernSpacing.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    textAlign: 'center',
  },
  
  privacyActions: {
    gap: ModernSpacing.md,
  },
  
  viewAllContainer: {
    padding: ModernSpacing.lg,
    alignItems: 'center',
  },
  
  privacySettings: {
    gap: ModernSpacing.xl,
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  settingInfo: {
    flex: 1,
    marginRight: ModernSpacing.md,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 4,
  },
  
  settingDescription: {
    fontSize: 14,
    color: ModernColors.textSecondary,
    lineHeight: 20,
  },
  
  educationContent: {
    gap: ModernSpacing.xl,
  },
  
  educationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ModernSpacing.md,
  },
  
  educationText: {
    flex: 1,
  },
  
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 4,
  },
  
  educationDescription: {
    fontSize: 14,
    color: ModernColors.textSecondary,
    lineHeight: 20,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: ModernColors.surface,
  },
  
  modalHeader: {
    paddingTop: 60,
    paddingBottom: ModernSpacing.xl,
    paddingHorizontal: ModernSpacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalCloseButton: {
    position: 'absolute',
    left: ModernSpacing.xl,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  
  modalContent: {
    flex: 1,
    paddingHorizontal: ModernSpacing.xl,
    paddingTop: ModernSpacing.xl,
  },
  
  transactionForm: {
    gap: ModernSpacing.xl,
  },
  
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.sm,
  },
  
  transactionTypes: {
    flexDirection: 'row',
    gap: ModernSpacing.md,
  },
  
  transactionTypeButton: {
    flex: 1,
    padding: ModernSpacing.md,
    borderRadius: ModernBorderRadius.md,
    borderWidth: 1,
    borderColor: ModernColors.border,
    alignItems: 'center',
  },
  
  transactionTypeActive: {
    backgroundColor: ModernColors.privacy.enhanced,
    borderColor: ModernColors.privacy.enhanced,
  },
  
  transactionTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textPrimary,
  },
  
  textInput: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.md,
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.md,
    borderWidth: 1,
    borderColor: ModernColors.border,
    fontSize: 16,
    color: ModernColors.textPrimary,
  },
  
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: ModernSpacing.xl,
    gap: ModernSpacing.md,
    borderTopWidth: 1,
    borderTopColor: ModernColors.divider,
  },
});

export default PrivacyDashboardModern;
