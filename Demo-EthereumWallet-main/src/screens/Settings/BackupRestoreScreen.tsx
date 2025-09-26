/**
 * Backup & Restore Screen for Ultimate Persistent Multi-Wallet System
 * Comprehensive backup management with multiple options
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Share,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import BackupManager from '../../services/BackupManagerSimple';
import { useWallet } from '../../context/WalletContext';

interface BackupItem {
  id: string;
  timestamp: number;
  format: string;
  encrypted: boolean;
  walletsCount: number;
  hasAuthentication: boolean;
}

interface Props {
  navigation?: any;
}

const BackupRestoreScreen: React.FC<Props> = ({ navigation }) => {
  const { state } = useWallet();
  const colors = {
    backgroundPrimary: '#0B1426',
    backgroundSecondary: '#1A2332',
    backgroundTertiary: '#2A3441',
    textPrimary: '#FFFFFF',
    textSecondary: '#B0BEC5',
    textTertiary: '#78909C',
    navy: '#1E3A8A',
    white: '#FFFFFF',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
  };
  const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
  const fontSize = { xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 24 };
  const fontWeight = { normal: '400', medium: '500', bold: '700' };
  
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  
  // Backup creation options
  const [backupPassword, setBackupPassword] = useState('');
  const [useEncryption, setUseEncryption] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  
  // Restore options
  const [restorePassword, setRestorePassword] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [validateIntegrity, setValidateIntegrity] = useState(true);
  const [restoreContent, setRestoreContent] = useState('');

  useEffect(() => {
    loadBackups();
    initializeBackupManager();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      title: 'Backup & Restore',
      headerStyle: {
        backgroundColor: colors.backgroundPrimary,
      },
      headerTintColor: colors.textPrimary,
    });
  }, [navigation, colors]);

  const initializeBackupManager = async () => {
    try {
      await BackupManager.initialize();
    } catch (error) {
      console.error('Failed to initialize BackupManager:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const availableBackups = await BackupManager.getAvailableBackups();
      setBackups(availableBackups.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const createBackup = async () => {
    if (useEncryption && !backupPassword.trim()) {
      Alert.alert('Error', 'Password is required for encrypted backups');
      return;
    }

    setLoading(true);
    try {
      const backupContent = await BackupManager.createBackup({
        includeSettings,
        encryptionPassword: useEncryption ? backupPassword : undefined,
        format: useEncryption ? 'encrypted' : 'json',
      });

      // Share the backup
      await Share.share({
        message: 'Ethereum Wallet Backup - Keep this secure!',
        title: 'Wallet Backup',
        url: `data:application/json;base64,${Buffer.from(backupContent).toString('base64')}`,
      });

      Alert.alert(
        'Backup Created',
        'Your wallet backup has been created and shared. Please store it securely!',
        [{ text: 'OK', onPress: () => setShowCreateModal(false) }]
      );

      await loadBackups();
      setBackupPassword('');
    } catch (error: any) {
      Alert.alert('Error', `Failed to create backup: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = async () => {
    if (!restoreContent.trim()) {
      Alert.alert('Error', 'Please paste your backup content');
      return;
    }

    setLoading(true);
    try {
      // Validate backup first
      const validation = await BackupManager.validateBackup(
        restoreContent,
        restorePassword || undefined
      );

      if (!validation.valid) {
        Alert.alert('Invalid Backup', validation.error || 'Backup validation failed');
        setLoading(false);
        return;
      }

      // Show confirmation with backup details
      Alert.alert(
        'Confirm Restore',
        `This will restore ${validation.walletsCount} wallet(s) from ${formatDate(validation.timestamp)}.\n\n${
          overwriteExisting ? 'WARNING: This will overwrite all existing wallets!' : ''
        }`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await BackupManager.restoreFromBackup(restoreContent, {
                  validateIntegrity,
                  overwriteExisting,
                  decryptionPassword: restorePassword || undefined,
                });

                Alert.alert(
                  'Restore Complete',
                  'Your wallets have been restored successfully. Please restart the app.',
                  [{ text: 'OK', onPress: () => setShowRestoreModal(false) }]
                );

                setRestoreContent('');
                setRestorePassword('');
              } catch (restoreError: any) {
                Alert.alert('Restore Failed', restoreError.message);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', `Backup validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const restoreFromStoredBackup = async (backup: BackupItem) => {
    try {
      const backupContent = await BackupManager.loadBackup(backup.id);
      if (!backupContent) {
        Alert.alert('Error', 'Backup file not found');
        return;
      }

      setRestoreContent(backupContent);
      setSelectedBackup(backup);
      setShowRestoreModal(true);
    } catch (error: any) {
      Alert.alert('Error', `Failed to load backup: ${error.message}`);
    }
  };

  const deleteBackup = (backup: BackupItem) => {
    Alert.alert(
      'Delete Backup',
      `Are you sure you want to delete the backup from ${formatDate(backup.timestamp)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await BackupManager.deleteBackup(backup.id);
              await loadBackups();
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete backup: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const exportWalletSeed = async () => {
    Alert.alert(
      'Export Wallet Seed',
      'This feature allows you to export individual wallet seed phrases. This is extremely sensitive information!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to wallet selection for seed export
            Alert.alert('Info', 'Wallet seed export feature would be implemented here');
          },
        },
      ]
    );
  };

  const styles = createStyles(colors, spacing, fontSize, fontWeight);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Card margin="md" padding="lg">
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.quickActionEmoji}>💾</Text>
              <Text style={styles.quickActionText}>Create Backup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => setShowRestoreModal(true)}
            >
              <Text style={styles.quickActionEmoji}>📥</Text>
              <Text style={styles.quickActionText}>Restore Backup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={exportWalletSeed}
            >
              <Text style={styles.quickActionEmoji}>🔑</Text>
              <Text style={styles.quickActionText}>Export Seeds</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={loadBackups}
            >
              <Text style={styles.quickActionEmoji}>🔄</Text>
              <Text style={styles.quickActionText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Saved Backups */}
        <Card margin="md" padding="lg">
          <Text style={styles.sectionTitle}>Saved Backups</Text>
          {backups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No backups found</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first backup to secure your wallets
              </Text>
            </View>
          ) : (
            backups.map((backup) => (
              <View key={backup.id} style={styles.backupItem}>
                <View style={styles.backupInfo}>
                  <View style={styles.backupHeader}>
                    <Text style={styles.backupDate}>
                      {formatDate(backup.timestamp)}
                    </Text>
                    <View style={styles.backupBadges}>
                      {backup.encrypted && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>🔒</Text>
                        </View>
                      )}
                      <View style={[styles.badge, styles.formatBadge]}>
                        <Text style={styles.badgeText}>{backup.format.toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.backupDetails}>
                    {backup.walletsCount} wallet{backup.walletsCount !== 1 ? 's' : ''} • 
                    {backup.hasAuthentication ? ' With Auth' : ' No Auth'}
                  </Text>
                </View>
                <View style={styles.backupActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => restoreFromStoredBackup(backup)}
                  >
                    <Text style={styles.actionButtonText}>Restore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteBackup(backup)}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Security Notice */}
        <Card margin="md" padding="lg">
          <Text style={styles.warningTitle}>🛡️ Security Notice</Text>
          <Text style={styles.warningText}>
            • Keep your backups secure and private{'\n'}
            • Never share backup files or passwords{'\n'}
            • Store backups in multiple secure locations{'\n'}
            • Verify backups before deleting wallets{'\n'}
            • Use strong encryption passwords
          </Text>
        </Card>
      </ScrollView>

      {/* Create Backup Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Backup</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Backup Settings</Text>
              
              <View style={styles.optionRow}>
                <Text style={styles.optionText}>Include App Settings</Text>
                <Switch
                  value={includeSettings}
                  onValueChange={setIncludeSettings}
                  trackColor={{ false: colors.backgroundTertiary, true: colors.navy }}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={styles.optionText}>Encrypt Backup</Text>
                <Switch
                  value={useEncryption}
                  onValueChange={setUseEncryption}
                  trackColor={{ false: colors.backgroundTertiary, true: colors.navy }}
                />
              </View>
            </View>

            {useEncryption && (
              <View style={styles.optionGroup}>
                <Text style={styles.optionLabel}>Encryption Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter strong password..."
                  secureTextEntry
                  value={backupPassword}
                  onChangeText={setBackupPassword}
                  placeholderTextColor={colors.textTertiary}
                />
                <Text style={styles.helpText}>
                  Use a strong password to encrypt your backup. You'll need this password to restore.
                </Text>
              </View>
            )}

            <Button
              title={loading ? 'Creating...' : 'Create & Share Backup'}
              onPress={createBackup}
              disabled={loading}
              variant="primary"
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Restore Backup Modal */}
      <Modal
        visible={showRestoreModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRestoreModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Restore Backup</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Backup Content</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Paste your backup content here..."
                multiline
                numberOfLines={6}
                value={restoreContent}
                onChangeText={setRestoreContent}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Decryption Password</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password (if encrypted)..."
                secureTextEntry
                value={restorePassword}
                onChangeText={setRestorePassword}
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Restore Options</Text>
              
              <View style={styles.optionRow}>
                <Text style={styles.optionText}>Validate Backup Integrity</Text>
                <Switch
                  value={validateIntegrity}
                  onValueChange={setValidateIntegrity}
                  trackColor={{ false: colors.backgroundTertiary, true: colors.navy }}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={styles.optionText}>Overwrite Existing Data</Text>
                <Switch
                  value={overwriteExisting}
                  onValueChange={setOverwriteExisting}
                  trackColor={{ false: colors.backgroundTertiary, true: colors.error }}
                />
              </View>
            </View>

            {overwriteExisting && (
              <View style={styles.warningBox}>
                <Text style={styles.warningBoxText}>
                  ⚠️ This will permanently delete all existing wallets and replace them with the backup data!
                </Text>
              </View>
            )}

            <Button
              title={loading ? 'Restoring...' : 'Restore Backup'}
              onPress={restoreFromBackup}
              disabled={loading || !restoreContent.trim()}
              variant={overwriteExisting ? 'error' : 'primary'}
              style={styles.restoreButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.navy} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any, spacing: any, fontSize: any, fontWeight: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    scrollView: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickAction: {
      alignItems: 'center',
      width: '48%',
      padding: spacing.md,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      marginBottom: spacing.sm,
    },
    quickActionEmoji: {
      fontSize: fontSize.xxl,
      marginBottom: spacing.xs,
    },
    quickActionText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    backupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundTertiary,
    },
    backupInfo: {
      flex: 1,
    },
    backupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    backupDate: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
    },
    backupBadges: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      backgroundColor: colors.backgroundTertiary,
      borderRadius: 8,
      marginLeft: spacing.xs,
    },
    formatBadge: {
      backgroundColor: colors.navy + '20',
    },
    badgeText: {
      fontSize: fontSize.xs,
      color: colors.textSecondary,
    },
    backupDetails: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    backupActions: {
      flexDirection: 'row',
    },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.navy,
      borderRadius: 8,
      marginLeft: spacing.xs,
    },
    deleteButton: {
      backgroundColor: colors.error,
    },
    actionButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.white,
    },
    deleteButtonText: {
      color: colors.white,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyStateText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    emptyStateSubtext: {
      fontSize: fontSize.sm,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    warningTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.warning,
      marginBottom: spacing.sm,
    },
    warningText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      lineHeight: fontSize.sm * 1.5,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.backgroundPrimary,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundTertiary,
    },
    modalCancel: {
      fontSize: fontSize.md,
      color: colors.navy,
      fontWeight: fontWeight.medium,
    },
    modalTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    optionGroup: {
      marginVertical: spacing.md,
    },
    optionLabel: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    optionText: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.backgroundTertiary,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: fontSize.md,
      color: colors.textPrimary,
      backgroundColor: colors.backgroundSecondary,
    },
    multilineInput: {
      height: 120,
      textAlignVertical: 'top',
    },
    helpText: {
      fontSize: fontSize.sm,
      color: colors.textTertiary,
      marginTop: spacing.xs,
    },
    createButton: {
      marginVertical: spacing.lg,
    },
    restoreButton: {
      marginVertical: spacing.lg,
    },
    warningBox: {
      backgroundColor: colors.error + '15',
      borderRadius: 8,
      padding: spacing.md,
      marginVertical: spacing.md,
    },
    warningBoxText: {
      fontSize: fontSize.sm,
      color: colors.error,
      textAlign: 'center',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.backgroundPrimary + 'CC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
  });

export default BackupRestoreScreen;
