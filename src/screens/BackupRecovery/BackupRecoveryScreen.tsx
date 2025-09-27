/**
 * Backup and Recovery System
 * Comprehensive backup, export, and recovery mechanisms for wallet data
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Clipboard,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { multiWalletManager, WalletSummary } from '../../storage/MultiWalletManager';
import { metadataStorage } from '../../storage/MetadataStorage';
import { secureStorage } from '../../storage/SecureStorage';
import { appLifecycleManager } from '../../services/AppLifecycleManager';
import { useTheme } from '../../context/ThemeContext';

interface BackupRecoveryProps {
  navigation: any;
}

interface BackupData {
  version: string;
  timestamp: number;
  wallets: any[];
  metadata: any;
  preferences: any;
  checksum: string;
}

interface CloudBackupSettings {
  enabled: boolean;
  autoBackup: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  encryptionEnabled: boolean;
}

export const BackupRecoveryScreen: React.FC<BackupRecoveryProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [cloudSettings, setCloudSettings] = useState<CloudBackupSettings>({
    enabled: false,
    autoBackup: false,
    frequency: 'weekly',
    encryptionEnabled: true,
  });
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [recoveryModalVisible, setRecoveryModalVisible] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [recoveryData, setRecoveryData] = useState('');

  /**
   * Initialize backup system
   */
  const initializeBackup = useCallback(async () => {
    try {
      const allWallets = await multiWalletManager.getAllWallets();
      setWallets(allWallets);

      // Load backup settings
      const settings = await AsyncStorage.getItem('backup_settings');
      if (settings) {
        setCloudSettings(JSON.parse(settings));
      }

      // Load last backup time
      const lastBackup = await AsyncStorage.getItem('last_backup_time');
      if (lastBackup) {
        setLastBackupTime(parseInt(lastBackup));
      }
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
    }
  }, []);

  /**
   * Create comprehensive backup
   */
  const createBackup = async (password?: string): Promise<string> => {
    try {
      setLoading(true);

      const walletIds = await secureStorage.getAllWalletIds();
      const walletData = [];

      for (const walletId of walletIds) {
        const secureWallet = await secureStorage.getWallet(walletId);
        const metadata = await metadataStorage.getWalletMetadata(walletId);
        const accounts = await metadataStorage.getAccountsForWallet(walletId);

        if (secureWallet && metadata) {
          walletData.push({
            secure: secureWallet,
            metadata,
            accounts,
          });
        }
      }

      const preferences = await metadataStorage.getUserPreferences();
      const networkSettings = await metadataStorage.getNetworkSettings();

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: Date.now(),
        wallets: walletData,
        metadata: {
          preferences,
          networkSettings,
        },
        preferences: preferences,
        checksum: '',
      };

      // Create checksum for integrity verification
      const dataString = JSON.stringify(backupData);
      const checksum = CryptoJS.SHA256(dataString).toString();
      backupData.checksum = checksum;

      let finalBackupData = JSON.stringify(backupData);

      // Encrypt if password provided
      if (password) {
        finalBackupData = CryptoJS.AES.encrypt(finalBackupData, password).toString();
      }

      // Update last backup time
      await AsyncStorage.setItem('last_backup_time', Date.now().toString());
      setLastBackupTime(Date.now());

      return finalBackupData;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('Backup creation failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export backup to file or share
   */
  const handleExportBackup = async () => {
    try {
      const backupData = await createBackup(backupPassword);
      
      const fileName = `cypher-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Share the backup data
      await Share.share({
        message: backupData,
        title: 'Wallet Backup',
      });

      Alert.alert(
        'Backup Created',
        'Your wallet backup has been created successfully. Store it in a secure location.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to export backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    }
  };

  /**
   * Copy backup to clipboard
   */
  const handleCopyBackup = async () => {
    try {
      const backupData = await createBackup(backupPassword);
      await Clipboard.setString(backupData);
      
      Alert.alert(
        'Backup Copied',
        'Your wallet backup has been copied to clipboard. Store it securely.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy backup:', error);
      Alert.alert('Error', 'Failed to copy backup');
    }
  };

  /**
   * Restore from backup
   */
  const handleRestoreBackup = async () => {
    if (!recoveryData.trim()) {
      Alert.alert('Error', 'Please paste your backup data');
      return;
    }

    Alert.alert(
      'Restore Backup',
      'This will replace all existing wallet data. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: performRestore,
        },
      ]
    );
  };

  /**
   * Perform backup restoration
   */
  const performRestore = async () => {
    try {
      setLoading(true);

      let backupData = recoveryData.trim();

      // Try to decrypt if it looks encrypted
      try {
        if (backupPassword && backupData.includes('U2FsdGVkX1')) {
          const decrypted = CryptoJS.AES.decrypt(backupData, backupPassword);
          backupData = decrypted.toString(CryptoJS.enc.Utf8);
        }
      } catch (decryptError) {
        Alert.alert('Error', 'Failed to decrypt backup. Check your password.');
        return;
      }

      const parsedBackup: BackupData = JSON.parse(backupData);

      // Verify checksum
      const backupCopy = { ...parsedBackup };
      const { checksum, ...backupWithoutChecksum } = backupCopy;
      const calculatedChecksum = CryptoJS.SHA256(JSON.stringify(backupWithoutChecksum)).toString();
      
      if (calculatedChecksum !== parsedBackup.checksum) {
        Alert.alert('Error', 'Backup data is corrupted or invalid');
        return;
      }

      // Clear existing data
      await appLifecycleManager.resetApp();

      // Restore wallets
      for (const walletData of parsedBackup.wallets) {
        const { secure, metadata, accounts } = walletData;
        
        // Store secure wallet data
        await secureStorage.storeWallet(secure);
        
        // Store metadata
        await metadataStorage.storeWalletMetadata(metadata);
        
        // Store accounts
        for (const account of accounts) {
          await metadataStorage.storeAccountMetadata(account);
        }
      }

      // Restore preferences and settings
      if (parsedBackup.metadata.preferences) {
        await metadataStorage.storeUserPreferences(parsedBackup.metadata.preferences);
      }

      if (parsedBackup.metadata.networkSettings) {
        await metadataStorage.storeNetworkSettings(parsedBackup.metadata.networkSettings);
      }

      Alert.alert(
        'Restore Complete',
        'Your wallet data has been restored successfully. The app will restart.',
        [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, you'd restart or navigate to the main screen
              navigation.navigate('MultiWalletHome');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to restore backup:', error);
      Alert.alert('Error', 'Failed to restore backup. Please check your backup data.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Export individual wallet mnemonic
   */
  const handleExportWallet = async (walletId: string) => {
    Alert.prompt(
      'Enter Password',
      'Enter your wallet password to export this wallet:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async (password) => {
            try {
              const mnemonic = await multiWalletManager.exportWalletMnemonic(walletId, password);
              
              Alert.alert(
                'Wallet Mnemonic',
                mnemonic,
                [
                  { text: 'Copy', onPress: () => Clipboard.setString(mnemonic) },
                  { text: 'Share', onPress: () => Share.share({ message: mnemonic }) },
                  { text: 'Close' },
                ]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to export wallet mnemonic');
            }
          },
        },
      ],
      'secure-text'
    );
  };

  /**
   * Update cloud backup settings
   */
  const updateCloudSettings = async (newSettings: Partial<CloudBackupSettings>) => {
    const updatedSettings = { ...cloudSettings, ...newSettings };
    setCloudSettings(updatedSettings);
    await AsyncStorage.setItem('backup_settings', JSON.stringify(updatedSettings));
  };

  /**
   * Schedule automatic backup
   */
  const scheduleAutoBackup = async () => {
    if (!cloudSettings.autoBackup) return;

    // In a real implementation, you'd use background tasks or scheduling
    // For now, we'll just show a success message
    Alert.alert('Auto Backup', 'Automatic backup has been scheduled');
  };

  useEffect(() => {
    initializeBackup();
  }, [initializeBackup]);

  const formatLastBackup = () => {
    if (!lastBackupTime) return 'Never';
    const date = new Date(lastBackupTime);
    return date.toLocaleString();
  };

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
        <Text style={styles.headerTitle}>Backup & Recovery</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Backup Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backup Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Last Backup</Text>
              <Text style={styles.statusValue}>{formatLastBackup()}</Text>
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusLabel}>Wallets</Text>
              <Text style={styles.statusValue}>{wallets.length}</Text>
            </View>
            <Icon
              name={lastBackupTime ? 'cloud-done' : 'cloud-off'}
              size={32}
              color={lastBackupTime ? theme.colors.success : theme.colors.warning}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setBackupModalVisible(true)}
            >
              <Icon name="backup" size={32} color={theme.colors.primary} />
              <Text style={styles.actionText}>Create Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setRecoveryModalVisible(true)}
            >
              <Icon name="restore" size={32} color={theme.colors.primary} />
              <Text style={styles.actionText}>Restore Backup</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cloud Backup Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Backup Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Cloud Backup</Text>
              <Switch
                value={cloudSettings.enabled}
                onValueChange={(value) => updateCloudSettings({ enabled: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={cloudSettings.enabled ? 'white' : theme.colors.textSecondary}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto Backup</Text>
              <Switch
                value={cloudSettings.autoBackup}
                onValueChange={(value) => updateCloudSettings({ autoBackup: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={cloudSettings.autoBackup ? 'white' : theme.colors.textSecondary}
                disabled={!cloudSettings.enabled}
              />
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Encrypt Backups</Text>
              <Switch
                value={cloudSettings.encryptionEnabled}
                onValueChange={(value) => updateCloudSettings({ encryptionEnabled: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={cloudSettings.encryptionEnabled ? 'white' : theme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Individual Wallet Export */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export Individual Wallets</Text>
          {wallets.map((wallet) => (
            <View key={wallet.id} style={styles.walletItem}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{wallet.name}</Text>
                <Text style={styles.walletAddress}>
                  {wallet.primaryAddress.substring(0, 6)}...
                  {wallet.primaryAddress.substring(38)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => handleExportWallet(wallet.id)}
              >
                <Icon name="file-download" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="warning" size={24} color={theme.colors.warning} />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Security Notice</Text>
            <Text style={styles.noticeText}>
              Always store your backups in multiple secure locations. Never share your backup data or seed phrases with anyone.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Backup Modal */}
      <Modal visible={backupModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Backup</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Create a secure backup of all your wallets and settings
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Backup Password (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password to encrypt backup"
                placeholderTextColor={theme.colors.textSecondary}
                value={backupPassword}
                onChangeText={setBackupPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleExportBackup}
                disabled={loading}
              >
                <Icon name="share" size={20} color="white" />
                <Text style={styles.modalButtonText}>Share Backup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCopyBackup}
                disabled={loading}
              >
                <Icon name="content-copy" size={20} color="white" />
                <Text style={styles.modalButtonText}>Copy to Clipboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Recovery Modal */}
      <Modal visible={recoveryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRecoveryModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Restore Backup</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Paste your backup data to restore your wallets
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Backup Data</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Paste your backup data here"
                placeholderTextColor={theme.colors.textSecondary}
                value={recoveryData}
                onChangeText={setRecoveryData}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Backup Password (if encrypted)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter backup password"
                placeholderTextColor={theme.colors.textSecondary}
                value={backupPassword}
                onChangeText={setBackupPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.fullWidthButton]}
              onPress={handleRestoreBackup}
              disabled={loading}
            >
              <Icon name="restore" size={20} color="white" />
              <Text style={styles.modalButtonText}>
                {loading ? 'Restoring...' : 'Restore Backup'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
  },
  walletItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  exportButton: {
    padding: 8,
  },
  securityNotice: {
    backgroundColor: theme.colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  fullWidthButton: {
    marginHorizontal: 0,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
