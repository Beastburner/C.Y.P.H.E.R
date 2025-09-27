/**
 * Wallet Management Screen
 * Comprehensive interface for organizing, editing, and managing all wallets
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { multiWalletManager, WalletSummary } from '../../storage/MultiWalletManager';
import { metadataStorage, WalletMetadata } from '../../storage/MetadataStorage';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

interface WalletManagementProps {
  navigation: any;
  route?: any;
}

interface EditWalletModalProps {
  visible: boolean;
  wallet: WalletSummary | null;
  onClose: () => void;
  onSave: (updates: Partial<WalletMetadata>) => void;
}

const WALLET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#10B981', '#06B6D4', '#3B82F6'
];

const WALLET_ICONS = [
  'wallet', 'account-balance-wallet', 'savings', 'payment',
  'credit-card', 'attach-money', 'monetization-on', 'account-balance',
  'card-giftcard', 'local-atm'
];

const WALLET_CATEGORIES = [
  'personal', 'business', 'trading', 'savings', 'defi', 'nft', 'gaming', 'other'
];

const EditWalletModal: React.FC<EditWalletModalProps> = ({ visible, wallet, onClose, onSave }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [selectedIcon, setSelectedIcon] = useState('wallet');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setSelectedColor(wallet.color);
      setSelectedIcon(wallet.icon);
      setSelectedCategory(wallet.category);
      setIsActive(wallet.isActive);
    }
  }, [wallet]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Wallet name cannot be empty');
      return;
    }

    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
      category: selectedCategory,
      isActive,
    });
    onClose();
  };

  if (!wallet) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Wallet</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Wallet Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter wallet name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          {/* Wallet Color */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <View style={styles.colorGrid}>
              {WALLET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Icon name="check" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Wallet Icon */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Icon</Text>
            <View style={styles.iconGrid}>
              {WALLET_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.selectedIconOption,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Icon
                    name={icon}
                    size={24}
                    color={selectedIcon === icon ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {WALLET_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryOption,
                    selectedCategory === category && styles.selectedCategoryOption,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.selectedCategoryText,
                    ]}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Active Status */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.sectionTitle}>Active Wallet</Text>
                <Text style={styles.sectionSubtitle}>
                  Inactive wallets are hidden from the main interface
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={isActive ? 'white' : theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={[styles.previewCard, { backgroundColor: selectedColor }]}>
              <View style={styles.previewHeader}>
                <View>
                  <Text style={styles.previewName}>{name || 'Wallet Name'}</Text>
                  <Text style={styles.previewCategory}>{selectedCategory}</Text>
                </View>
                <View style={styles.previewIcon}>
                  <Icon name={selectedIcon} size={24} color="white" />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export const WalletManagementScreen: React.FC<WalletManagementProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletSummary | null>(null);
  const [dragMode, setDragMode] = useState(false);

  // Animation values
  const slideAnim = new Animated.Value(0);

  /**
   * Load all wallets
   */
  const loadWallets = useCallback(async () => {
    try {
      const allWallets = await multiWalletManager.getAllWallets();
      setWallets(allWallets);
      
      // Animate entrance
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to load wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [slideAnim]);

  /**
   * Handle wallet edit
   */
  const handleEditWallet = useCallback((wallet: WalletSummary) => {
    setSelectedWallet(wallet);
    setEditModalVisible(true);
  }, []);

  /**
   * Handle wallet update
   */
  const handleWalletUpdate = useCallback(async (updates: Partial<WalletMetadata>) => {
    if (!selectedWallet) return;

    try {
      await multiWalletManager.updateWalletMetadata(selectedWallet.id, updates);
      await loadWallets();
      Alert.alert('Success', 'Wallet updated successfully');
    } catch (error) {
      console.error('Failed to update wallet:', error);
      Alert.alert('Error', 'Failed to update wallet');
    }
  }, [selectedWallet, loadWallets]);

  /**
   * Handle wallet deletion
   */
  const handleDeleteWallet = useCallback((wallet: WalletSummary) => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.prompt(
              'Confirm Deletion',
              'Type "DELETE" to confirm wallet deletion:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (confirmation) => {
                    try {
                      await multiWalletManager.deleteWallet(wallet.id, confirmation || '');
                      await loadWallets();
                      Alert.alert('Success', 'Wallet deleted successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete wallet');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  }, [loadWallets]);

  /**
   * Handle wallet switching
   */
  const handleSwitchWallet = useCallback(async (wallet: WalletSummary) => {
    try {
      await multiWalletManager.switchToWallet(wallet.id);
      navigation.navigate('MultiWalletHome');
    } catch (error) {
      Alert.alert('Error', 'Failed to switch wallet');
    }
  }, [navigation]);

  /**
   * Handle create new wallet
   */
  const handleCreateWallet = useCallback(() => {
    navigation.navigate('CreateWalletNew');
  }, [navigation]);

  /**
   * Handle import wallet
   */
  const handleImportWallet = useCallback(() => {
    navigation.navigate('ImportWallet');
  }, [navigation]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Wallets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Wallets</Text>
        <TouchableOpacity
          style={styles.dragButton}
          onPress={() => setDragMode(!dragMode)}
        >
          <Icon
            name={dragMode ? "check" : "drag-handle"}
            size={24}
            color={dragMode ? theme.colors.primary : theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Section */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: slideAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{wallets.length}</Text>
            <Text style={styles.statLabel}>Total Wallets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {wallets.reduce((sum, w) => sum + w.accountCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              ${wallets.reduce((sum, w) => sum + parseFloat(w.totalValue || '0'), 0).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateWallet}>
            <Icon name="add" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>Create Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleImportWallet}>
            <Icon name="file-download" size={24} color={theme.colors.primary} />
            <Text style={styles.actionText}>Import Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Wallets List */}
        <View style={styles.walletsSection}>
          <Text style={styles.sectionTitle}>Your Wallets</Text>
          
          {wallets.map((wallet, index) => (
            <Animated.View
              key={wallet.id}
              style={[
                styles.walletItem,
                {
                  opacity: slideAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [100, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.walletContent}
                onPress={() => handleSwitchWallet(wallet)}
              >
                <View style={[styles.walletColorBar, { backgroundColor: wallet.color }]} />
                
                <View style={styles.walletInfo}>
                  <View style={styles.walletHeader}>
                    <Text style={styles.walletName}>{wallet.name}</Text>
                    <View style={styles.walletBadge}>
                      <Text style={styles.badgeText}>{wallet.category}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.walletDetails}>
                    <Text style={styles.walletValue}>${wallet.totalValue}</Text>
                    <Text style={styles.walletAccounts}>
                      {wallet.accountCount} account{wallet.accountCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <Text style={styles.walletAddress}>
                    {wallet.primaryAddress.substring(0, 6)}...
                    {wallet.primaryAddress.substring(38)}
                  </Text>
                </View>

                <View style={styles.walletIcon}>
                  <Icon name={wallet.icon} size={24} color={wallet.color} />
                </View>
              </TouchableOpacity>

              <View style={styles.walletActions}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleEditWallet(wallet)}
                >
                  <Icon name="edit" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleDeleteWallet(wallet)}
                >
                  <Icon name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Empty State */}
        {wallets.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="account-balance-wallet" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Wallets Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first wallet to get started
            </Text>
            <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateWallet}>
              <Text style={styles.createFirstText}>Create Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <EditWalletModal
        visible={editModalVisible}
        wallet={selectedWallet}
        onClose={() => setEditModalVisible(false)}
        onSave={handleWalletUpdate}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  dragButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginTop: 8,
    fontWeight: '600',
  },
  walletsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  walletItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  walletContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  walletColorBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  walletBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  walletDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginRight: 12,
  },
  walletAccounts: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  walletAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  walletActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionIcon: {
    padding: 8,
    marginVertical: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  saveButton: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  textInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
  },
  selectedIconOption: {
    backgroundColor: theme.colors.primary + '20',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    backgroundColor: theme.colors.cardBackground,
  },
  selectedCategoryOption: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  selectedCategoryText: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  previewCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
