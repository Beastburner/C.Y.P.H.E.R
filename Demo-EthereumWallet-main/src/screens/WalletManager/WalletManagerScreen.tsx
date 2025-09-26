import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Switch,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { enhancedWalletManager, WalletInfo, WalletAccount } from '../../utils/enhancedWalletManager';
import { hardwareWalletManager, HardwareWallet } from '../../utils/hardwareWalletManager';

/**
 * @title Wallet Management Screen
 * @dev Comprehensive wallet management interface
 * @notice Provides complete wallet lifecycle management including:
 *         - Multiple wallet creation and management
 *         - Account management within wallets
 *         - Hardware wallet integration
 *         - Backup and recovery functionality
 *         - Security settings per wallet
 */

interface WalletManagerScreenProps {
  navigation: any;
}

interface CreateWalletModalData {
  visible: boolean;
  type: 'create' | 'import' | 'hardware';
  name: string;
  mnemonic: string;
  isLoading: boolean;
}

const WalletManagerScreen: React.FC<WalletManagerScreenProps> = ({ navigation }) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletInfo | null>(null);
  const [hardwareWallets, setHardwareWallets] = useState<HardwareWallet[]>([]);
  const [selectedTab, setSelectedTab] = useState<'wallets' | 'hardware' | 'settings'>('wallets');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [createWalletModal, setCreateWalletModal] = useState<CreateWalletModalData>({
    visible: false,
    type: 'create',
    name: '',
    mnemonic: '',
    isLoading: false,
  });

  const [backupModal, setBackupModal] = useState({
    visible: false,
    walletId: '',
    backupData: null as any,
  });

  const [accountModal, setAccountModal] = useState({
    visible: false,
    walletId: '',
    accountName: '',
    isLoading: false,
  });

  useEffect(() => {
    initializeWalletManager();
  }, []);

  const initializeWalletManager = async () => {
    try {
      setLoading(true);
      
      // Initialize wallet managers
      await enhancedWalletManager.initialize();
      await hardwareWalletManager.initialize();
      
      // Load wallets
      await loadWallets();
      await loadHardwareWallets();
      
    } catch (error) {
      console.error('Failed to initialize wallet manager:', error);
      Alert.alert('Error', 'Failed to initialize wallet manager');
    } finally {
      setLoading(false);
    }
  };

  const loadWallets = async () => {
    try {
      const allWallets = enhancedWalletManager.getAllWallets();
      const active = enhancedWalletManager.getActiveWallet();
      
      setWallets(allWallets);
      setActiveWallet(active);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const loadHardwareWallets = async () => {
    try {
      const connected = hardwareWalletManager.getConnectedWallets();
      setHardwareWallets(connected);
    } catch (error) {
      console.error('Failed to load hardware wallets:', error);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setCreateWalletModal(prev => ({ ...prev, isLoading: true }));

      let wallet: WalletInfo;
      
      if (createWalletModal.type === 'create') {
        wallet = await enhancedWalletManager.createWallet({
          name: createWalletModal.name,
        });
      } else if (createWalletModal.type === 'import') {
        wallet = await enhancedWalletManager.importWallet(
          createWalletModal.name,
          createWalletModal.mnemonic
        );
      } else {
        // Hardware wallet connection handled separately
        return;
      }

      await loadWallets();
      setCreateWalletModal({
        visible: false,
        type: 'create',
        name: '',
        mnemonic: '',
        isLoading: false,
      });

      Alert.alert('Success', `Wallet "${wallet.name}" created successfully!`);
    } catch (error) {
      console.error('Failed to create wallet:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create wallet');
    } finally {
      setCreateWalletModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleConnectHardwareWallet = async (type: 'ledger' | 'trezor' | 'keepkey') => {
    try {
      setLoading(true);
      const result = await hardwareWalletManager.connectWallet(type);
      
      if (result.success && result.wallet) {
        await loadHardwareWallets();
        Alert.alert('Success', `Connected to ${result.wallet.name}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to connect hardware wallet');
      }
    } catch (error) {
      console.error('Hardware wallet connection failed:', error);
      Alert.alert('Error', 'Failed to connect hardware wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveWallet = async (walletId: string) => {
    try {
      await enhancedWalletManager.setActiveWallet(walletId);
      await loadWallets();
      Alert.alert('Success', 'Active wallet updated');
    } catch (error) {
      console.error('Failed to set active wallet:', error);
      Alert.alert('Error', 'Failed to set active wallet');
    }
  };

  const handleDeleteWallet = (walletId: string, walletName: string) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${walletName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await enhancedWalletManager.deleteWallet(walletId);
              await loadWallets();
              Alert.alert('Success', 'Wallet deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
      ]
    );
  };

  const handleBackupWallet = async (walletId: string) => {
    try {
      const backupData = await enhancedWalletManager.createBackup(walletId);
      setBackupModal({
        visible: true,
        walletId,
        backupData,
      });
    } catch (error) {
      console.error('Failed to create backup:', error);
      Alert.alert('Error', 'Failed to create wallet backup');
    }
  };

  const handleCreateAccount = async () => {
    try {
      setAccountModal(prev => ({ ...prev, isLoading: true }));
      
      await enhancedWalletManager.createAccount(
        accountModal.walletId,
        accountModal.accountName
      );
      
      await loadWallets();
      setAccountModal({
        visible: false,
        walletId: '',
        accountName: '',
        isLoading: false,
      });
      
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      console.error('Failed to create account:', error);
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setAccountModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const renderWalletItem = ({ item: wallet }: { item: WalletInfo }) => {
    const isActive = activeWallet?.id === wallet.id;
    const totalBalance = wallet.accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || '0'), 0);

    return (
      <View style={[styles.walletItem, isActive && styles.activeWalletItem]}>
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletName}>{wallet.name}</Text>
            <Text style={styles.walletType}>{wallet.type.toUpperCase()}</Text>
            {isActive && <Text style={styles.activeLabel}>ACTIVE</Text>}
          </View>
          <View style={styles.walletActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleBackupWallet(wallet.id)}
            >
              <Icon name="backup" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteWallet(wallet.id, wallet.name)}
            >
              <Icon name="delete" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.walletBalance}>
          Total Balance: {totalBalance.toFixed(4)} ETH
        </Text>
        <Text style={styles.accountCount}>
          {wallet.accounts.length} Account{wallet.accounts.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.accountsList}>
          {wallet.accounts.slice(0, 3).map((account, index) => (
            <View key={account.index} style={styles.accountItem}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountBalance}>{account.balance} ETH</Text>
            </View>
          ))}
          {wallet.accounts.length > 3 && (
            <Text style={styles.moreAccounts}>
              +{wallet.accounts.length - 3} more accounts
            </Text>
          )}
        </View>

        <View style={styles.walletFooter}>
          {!isActive && (
            <TouchableOpacity
              style={styles.setActiveButton}
              onPress={() => handleSetActiveWallet(wallet.id)}
            >
              <Text style={styles.setActiveButtonText}>Set Active</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addAccountButton}
            onPress={() => setAccountModal({
              visible: true,
              walletId: wallet.id,
              accountName: '',
              isLoading: false,
            })}
          >
            <Icon name="add" size={16} color="#007AFF" />
            <Text style={styles.addAccountButtonText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHardwareWalletItem = ({ item: wallet }: { item: HardwareWallet }) => (
    <View style={styles.hardwareWalletItem}>
      <View style={styles.hardwareWalletHeader}>
        <View>
          <Text style={styles.hardwareWalletName}>{wallet.name}</Text>
          <Text style={styles.hardwareWalletType}>{wallet.type.toUpperCase()}</Text>
        </View>
        <View style={[styles.connectionStatus, wallet.connected && styles.connected]}>
          <Text style={styles.connectionStatusText}>
            {wallet.connected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>
      <Text style={styles.hardwareWalletAddress}>{wallet.address}</Text>
      <Text style={styles.hardwareWalletBalance}>Balance: {wallet.balance} ETH</Text>
    </View>
  );

  const renderWalletsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>My Wallets</Text>
        <TouchableOpacity
          style={styles.addWalletButton}
          onPress={() => setCreateWalletModal({ ...createWalletModal, visible: true })}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <FlatList
          data={wallets}
          renderItem={renderWalletItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.walletsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="account-balance-wallet" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No wallets found</Text>
              <Text style={styles.emptyStateSubtext}>Create your first wallet to get started</Text>
            </View>
          }
        />
      )}
    </View>
  );

  const renderHardwareTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Hardware Wallets</Text>
      </View>

      <View style={styles.hardwareConnectButtons}>
        <TouchableOpacity
          style={styles.hardwareButton}
          onPress={() => handleConnectHardwareWallet('ledger')}
        >
          <Text style={styles.hardwareButtonText}>Connect Ledger</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.hardwareButton}
          onPress={() => handleConnectHardwareWallet('trezor')}
        >
          <Text style={styles.hardwareButtonText}>Connect Trezor</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.hardwareButton}
          onPress={() => handleConnectHardwareWallet('keepkey')}
        >
          <Text style={styles.hardwareButtonText}>Connect KeepKey</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={hardwareWallets}
        renderItem={renderHardwareWalletItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.hardwareWalletsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="usb" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No hardware wallets connected</Text>
            <Text style={styles.emptyStateSubtext}>Connect a hardware wallet for enhanced security</Text>
          </View>
        }
      />
    </View>
  );

  const renderSettingsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Wallet Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Auto-lock timeout</Text>
          <Text style={styles.settingValue}>5 minutes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Biometric authentication</Text>
          <Switch value={true} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Advanced</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Custom derivation paths</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingLabel}>Network settings</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing wallet manager...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'wallets' && styles.activeTab]}
          onPress={() => setSelectedTab('wallets')}
        >
          <Icon name="account-balance-wallet" size={24} color={selectedTab === 'wallets' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'wallets' && styles.activeTabText]}>Wallets</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'hardware' && styles.activeTab]}
          onPress={() => setSelectedTab('hardware')}
        >
          <Icon name="usb" size={24} color={selectedTab === 'hardware' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'hardware' && styles.activeTabText]}>Hardware</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'settings' && styles.activeTab]}
          onPress={() => setSelectedTab('settings')}
        >
          <Icon name="settings" size={24} color={selectedTab === 'settings' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, selectedTab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {selectedTab === 'wallets' && renderWalletsTab()}
        {selectedTab === 'hardware' && renderHardwareTab()}
        {selectedTab === 'settings' && renderSettingsTab()}
      </ScrollView>

      {/* Create Wallet Modal */}
      <Modal
        visible={createWalletModal.visible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {createWalletModal.type === 'create' ? 'Create Wallet' : 'Import Wallet'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Wallet name"
              value={createWalletModal.name}
              onChangeText={(text) => setCreateWalletModal(prev => ({ ...prev, name: text }))}
            />

            {createWalletModal.type === 'import' && (
              <TextInput
                style={[styles.input, styles.mnemonicInput]}
                placeholder="Enter mnemonic phrase (12 or 24 words)"
                value={createWalletModal.mnemonic}
                onChangeText={(text) => setCreateWalletModal(prev => ({ ...prev, mnemonic: text }))}
                multiline
                numberOfLines={3}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCreateWalletModal({ ...createWalletModal, visible: false })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateWallet}
                disabled={createWalletModal.isLoading}
              >
                {createWalletModal.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {createWalletModal.type === 'create' ? 'Create' : 'Import'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.walletTypeSelector}>
              <TouchableOpacity
                style={[styles.walletTypeButton, createWalletModal.type === 'create' && styles.activeWalletType]}
                onPress={() => setCreateWalletModal(prev => ({ ...prev, type: 'create' }))}
              >
                <Text style={styles.walletTypeText}>Create New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.walletTypeButton, createWalletModal.type === 'import' && styles.activeWalletType]}
                onPress={() => setCreateWalletModal(prev => ({ ...prev, type: 'import' }))}
              >
                <Text style={styles.walletTypeText}>Import Existing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup Modal */}
      <Modal
        visible={backupModal.visible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wallet Backup</Text>
            <Text style={styles.backupWarning}>
              ⚠️ Keep this backup safe and secure. Anyone with access to this information can access your wallet.
            </Text>
            
            {backupModal.backupData && (
              <ScrollView style={styles.backupData}>
                <Text style={styles.backupLabel}>Mnemonic Phrase:</Text>
                <Text style={styles.backupMnemonic}>{backupModal.backupData.mnemonic}</Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBackupModal({ visible: false, walletId: '', backupData: null })}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        visible={accountModal.visible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Account</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Account name"
              value={accountModal.accountName}
              onChangeText={(text) => setAccountModal(prev => ({ ...prev, accountName: text }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAccountModal({ visible: false, walletId: '', accountName: '', isLoading: false })}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAccount}
                disabled={accountModal.isLoading}
              >
                {accountModal.isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Add Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  addWalletButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginTop: 32,
  },
  walletsList: {
    padding: 16,
  },
  walletItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeWalletItem: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  walletType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 4,
  },
  walletActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  accountCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  accountsList: {
    marginBottom: 12,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  accountName: {
    fontSize: 14,
    color: '#666',
  },
  accountBalance: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  moreAccounts: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  walletFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setActiveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  setActiveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addAccountButtonText: {
    color: '#007AFF',
    fontSize: 14,
    marginLeft: 4,
  },
  hardwareConnectButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  hardwareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  hardwareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  hardwareWalletsList: {
    padding: 16,
  },
  hardwareWalletItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  hardwareWalletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hardwareWalletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  hardwareWalletType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  connectionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  hardwareWalletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  hardwareWalletBalance: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  settingsSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  mnemonicInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  createButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  createButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  walletTypeSelector: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  walletTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f8f8',
  },
  activeWalletType: {
    backgroundColor: '#007AFF',
  },
  walletTypeText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  backupWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  backupData: {
    maxHeight: 200,
    marginBottom: 16,
  },
  backupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  backupMnemonic: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
  },
  closeButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default WalletManagerScreen;
