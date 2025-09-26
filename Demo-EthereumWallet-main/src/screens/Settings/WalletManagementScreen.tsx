/**
 * Wallet Management Screen
 * Comprehensive wallet management interface for organizing, editing, and managing multiple wallets
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import ApplicationLifecycleManager from '../../services/ApplicationLifecycleManager';
import { Wallet } from '../../services/MultiWalletManager';
import LinearGradient from '../../components/LinearGradient';

interface WalletManagementScreenProps {
  navigation: any;
  route?: {
    params?: {
      wallets?: Wallet[];
    };
  };
}

interface EditWalletModalProps {
  visible: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onSave: (walletId: string, updates: Partial<Wallet>) => void;
}

const WALLET_ICONS = ['💰', '🏦', '💳', '💎', '🎯', '🚀', '⭐', '🔥', '💡', '🎪'];
const WALLET_CATEGORIES = ['personal', 'business', 'trading', 'savings', 'defi', 'gaming'];

const EditWalletModal: React.FC<EditWalletModalProps> = ({ visible, wallet, onClose, onSave }) => {
  const { colors, spacing, fontSize, fontWeight, borderRadius } = useTheme();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [category, setCategory] = useState('personal');
  const [isBackupEnabled, setIsBackupEnabled] = useState(true);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setIcon(wallet.icon || '💰');
      setCategory(wallet.category || 'personal');
      setIsBackupEnabled(true); // Default to true as isBackupEnabled not in Wallet interface
    }
  }, [wallet]);

  const handleSave = () => {
    if (!wallet || !name.trim()) return;

    onSave(wallet.id, {
      name: name.trim(),
      icon,
      category,
    });
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.md,
      color: colors.textPrimary,
    },
    iconSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    iconOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    iconOptionSelected: {
      backgroundColor: colors.primary,
    },
    iconText: {
      fontSize: fontSize.lg,
    },
    categorySelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryOption: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
      minWidth: 80,
      alignItems: 'center',
    },
    categoryOptionSelected: {
      backgroundColor: colors.primary,
    },
    categoryText: {
      fontSize: fontSize.sm,
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    switchLabel: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginHorizontal: spacing.sm,
    },
    cancelButton: {
      backgroundColor: colors.backgroundSecondary,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Wallet</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Wallet Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter wallet name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconSelector}>
              {WALLET_ICONS.map((iconOption) => (
                <TouchableOpacity
                  key={iconOption}
                  style={[
                    styles.iconOption,
                    icon === iconOption && styles.iconOptionSelected,
                  ]}
                  onPress={() => setIcon(iconOption)}
                >
                  <Text style={styles.iconText}>{iconOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categorySelector}>
              {WALLET_CATEGORIES.map((categoryOption) => (
                <TouchableOpacity
                  key={categoryOption}
                  style={[
                    styles.categoryOption,
                    category === categoryOption && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setCategory(categoryOption)}
                >
                  <Text style={styles.categoryText}>{categoryOption}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Auto Backup</Text>
            <Switch
              value={isBackupEnabled}
              onValueChange={setIsBackupEnabled}
              trackColor={{ false: colors.backgroundSecondary, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const WalletManagementScreen: React.FC<WalletManagementScreenProps> = ({ navigation, route }) => {
  const { colors, spacing, fontSize, fontWeight, borderRadius, shadows } = useTheme();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const lifecycleManager = ApplicationLifecycleManager.getInstance();
  const multiWalletManager = lifecycleManager.getMultiWalletManager();

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = useCallback(async () => {
    try {
      setIsLoading(true);
      const allWallets = multiWalletManager.getAllWallets();
      const active = multiWalletManager.getActiveWallet();
      
      setWallets(allWallets);
      setActiveWallet(active);
    } catch (error) {
      console.error('Failed to load wallets:', error);
      Alert.alert('Error', 'Failed to load wallets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditWallet = useCallback((wallet: Wallet) => {
    setSelectedWallet(wallet);
    setEditModalVisible(true);
  }, []);

  const handleSaveWallet = useCallback(async (walletId: string, updates: Partial<Wallet>) => {
    try {
      await multiWalletManager.updateWalletInfo(walletId, updates);
      await loadWallets();
      Alert.alert('Success', 'Wallet updated successfully');
    } catch (error) {
      console.error('Failed to update wallet:', error);
      Alert.alert('Error', 'Failed to update wallet');
    }
  }, [multiWalletManager, loadWallets]);

  const handleDeleteWallet = useCallback(async (wallet: Wallet) => {
    if (wallets.length === 1) {
      Alert.alert('Cannot Delete', 'You must have at least one wallet');
      return;
    }

    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await multiWalletManager.deleteWallet(wallet.id);
              await loadWallets();
              Alert.alert('Success', 'Wallet deleted successfully');
            } catch (error) {
              console.error('Failed to delete wallet:', error);
              Alert.alert('Error', 'Failed to delete wallet');
            }
          },
        },
      ]
    );
  }, [wallets.length, multiWalletManager, loadWallets]);

  const handleExportWallet = useCallback(async (wallet: Wallet) => {
    try {
      // For security, we'll navigate to a separate export screen
      Alert.alert(
        'Export Wallet',
        'This will show your wallet\'s seed phrase. Only proceed if you\'re in a secure location.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => {
              navigation.navigate('ExportWallet', { walletId: wallet.id });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to export wallet:', error);
      Alert.alert('Error', 'Failed to export wallet');
    }
  }, [navigation]);

  const handleSetActive = useCallback(async (walletId: string) => {
    try {
      await multiWalletManager.switchActiveWallet(walletId);
      await loadWallets();
      Alert.alert('Success', 'Active wallet changed');
    } catch (error) {
      console.error('Failed to switch wallet:', error);
      Alert.alert('Error', 'Failed to switch wallet');
    }
  }, [multiWalletManager, loadWallets]);

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.01) return '< 0.01';
    return num.toFixed(2);
  };

  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    },
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
    },
    addButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
    },
    scrollContainer: {
      flex: 1,
      padding: spacing.lg,
    },
    walletCard: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      ...shadows.medium,
    },
    activeWalletCard: {
      borderColor: colors.primary,
    },
    walletHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    walletInfo: {
      flex: 1,
    },
    walletName: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    walletCategory: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    walletIcon: {
      fontSize: fontSize.xl,
      marginRight: spacing.md,
    },
    walletDetails: {
      marginBottom: spacing.md,
    },
    walletBalance: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    walletAddress: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    walletActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.md,
    },
    actionButton: {
      flex: 1,
      backgroundColor: colors.backgroundTertiary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      marginHorizontal: spacing.xs,
    },
    activeButton: {
      backgroundColor: colors.primary,
    },
    dangerButton: {
      backgroundColor: colors.error,
    },
    actionButtonText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
    },
    activeBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    activeBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    },
    emptyState: {
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyStateText: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.title}>Loading wallets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Wallets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateWalletNew')}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {wallets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No wallets found</Text>
          </View>
        ) : (
          wallets.map((wallet) => (
            <View
              key={wallet.id}
              style={[
                styles.walletCard,
                wallet.isActive && styles.activeWalletCard,
              ]}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletInfo}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  {wallet.category && (
                    <Text style={styles.walletCategory}>{wallet.category}</Text>
                  )}
                  {wallet.isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.walletIcon}>{wallet.icon || '💰'}</Text>
              </View>

              <View style={styles.walletDetails}>
                <Text style={styles.walletBalance}>
                  ${formatBalance(wallet.totalBalance || '0')} USD
                </Text>
                <Text style={styles.walletAddress}>
                  {wallet.accounts.length} account{wallet.accounts.length !== 1 ? 's' : ''}
                  {wallet.accounts.length > 0 && (
                    <Text> • {shortenAddress(wallet.accounts[0].address)}</Text>
                  )}
                </Text>
              </View>

              <View style={styles.walletActions}>
                {!wallet.isActive && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activeButton]}
                    onPress={() => handleSetActive(wallet.id)}
                  >
                    <Text style={styles.actionButtonText}>Set Active</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditWallet(wallet)}
                >
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleExportWallet(wallet)}
                >
                  <Text style={styles.actionButtonText}>Export</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleDeleteWallet(wallet)}
                >
                  <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <EditWalletModal
        visible={editModalVisible}
        wallet={selectedWallet}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedWallet(null);
        }}
        onSave={handleSaveWallet}
      />
    </SafeAreaView>
  );
};

export default WalletManagementScreen;
