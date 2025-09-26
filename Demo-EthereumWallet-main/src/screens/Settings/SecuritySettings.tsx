import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import SecurityManager from '../../utils/securityManager';
import AutoLockManager from '../../utils/autoLockManager';

interface SecuritySettingsProps {
  onNavigate: (screen: string) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({ onNavigate }) => {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockTimeout, setAutoLockTimeout] = useState(5);
  const [lockOnBackground, setLockOnBackground] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const securityManager = SecurityManager.getInstance();
  const autoLockManager = AutoLockManager.getInstance();

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const [
        biometricEnabledStatus,
        biometricCapabilities,
        autoLockConfig
      ] = await Promise.all([
        securityManager.isBiometricEnabled(),
        securityManager.checkBiometricCapabilities(),
        autoLockManager.getConfig()
      ]);

      setBiometricEnabled(biometricEnabledStatus);
      setBiometricAvailable(biometricCapabilities.isAvailable);
      setBiometricType(biometricCapabilities.biometryType || 'biometric');
      setAutoLockEnabled(autoLockConfig.enabled);
      setAutoLockTimeout(autoLockConfig.timeoutMinutes);
      setLockOnBackground(autoLockConfig.lockOnAppBackground);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device.');
      return;
    }

    setIsLoading(true);

    try {
      if (enabled) {
        const success = await securityManager.enableBiometric();
        if (success) {
          setBiometricEnabled(true);
          Alert.alert('Success', 'Biometric authentication has been enabled.');
        } else {
          Alert.alert('Failed', 'Failed to enable biometric authentication.');
        }
      } else {
        const success = await securityManager.disableBiometric();
        if (success) {
          setBiometricEnabled(false);
          Alert.alert('Success', 'Biometric authentication has been disabled.');
        } else {
          Alert.alert('Failed', 'Failed to disable biometric authentication.');
        }
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
      Alert.alert('Error', 'An error occurred while changing biometric settings.');
    }

    setIsLoading(false);
  };

  const updateAutoLockTimeout = async (minutes: number) => {
    try {
      await autoLockManager.updateConfig({ timeoutMinutes: minutes });
      setAutoLockTimeout(minutes);
      await securityManager.logSecurityEvent('auto_lock_timeout_changed', { minutes });
    } catch (error) {
      console.error('Failed to update auto-lock timeout:', error);
      Alert.alert('Error', 'Failed to update auto-lock timeout.');
    }
  };

  const toggleAutoLock = async (enabled: boolean) => {
    try {
      await autoLockManager.updateConfig({ enabled });
      setAutoLockEnabled(enabled);
      await securityManager.logSecurityEvent('auto_lock_toggled', { enabled });
    } catch (error) {
      console.error('Failed to toggle auto-lock:', error);
      Alert.alert('Error', 'Failed to update auto-lock setting.');
    }
  };

  const toggleLockOnBackground = async (enabled: boolean) => {
    try {
      await autoLockManager.updateConfig({ lockOnAppBackground: enabled });
      setLockOnBackground(enabled);
      await securityManager.logSecurityEvent('lock_on_background_toggled', { enabled });
    } catch (error) {
      console.error('Failed to toggle lock on background:', error);
      Alert.alert('Error', 'Failed to update background lock setting.');
    }
  };

  const changePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be asked to enter your current password and then set a new password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => onNavigate('ChangePassword') }
      ]
    );
  };

  const viewSecurityLogs = () => {
    onNavigate('SecurityLogs');
  };

  const clearSecurityLogs = async () => {
    Alert.alert(
      'Clear Security Logs',
      'This will permanently delete all security event logs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await securityManager.clearSecurityLogs();
              Alert.alert('Success', 'Security logs have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear security logs.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('settings')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Biometric Authentication */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>
                {biometricType.includes('Face') ? 'Face ID' : 'Fingerprint'}
              </Text>
              <Text style={styles.settingDescription}>
                {biometricAvailable 
                  ? `Use ${biometricType} to unlock your wallet` 
                  : 'Not available on this device'
                }
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={toggleBiometric}
              disabled={!biometricAvailable || isLoading}
              trackColor={{ false: '#f3f4f6', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Auto Lock Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto Lock</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Auto Lock</Text>
              <Text style={styles.settingDescription}>
                Automatically lock wallet after inactivity
              </Text>
            </View>
            <Switch
              value={autoLockEnabled}
              onValueChange={toggleAutoLock}
              trackColor={{ false: '#f3f4f6', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Lock on Background</Text>
              <Text style={styles.settingDescription}>
                Lock when app goes to background
              </Text>
            </View>
            <Switch
              value={lockOnBackground}
              onValueChange={toggleLockOnBackground}
              trackColor={{ false: '#f3f4f6', true: '#4f46e5' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.timeoutSection}>
            <Text style={styles.settingTitle}>Auto Lock Timeout</Text>
            <View style={styles.timeoutButtons}>
              {[1, 5, 15, 30].map(minutes => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.timeoutButton,
                    autoLockTimeout === minutes && styles.timeoutButtonActive
                  ]}
                  onPress={() => updateAutoLockTimeout(minutes)}
                >
                  <Text style={[
                    styles.timeoutButtonText,
                    autoLockTimeout === minutes && styles.timeoutButtonTextActive
                  ]}>
                    {minutes}min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Password Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={changePassword}>
            <Text style={styles.actionButtonText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Security Monitoring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Monitoring</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={viewSecurityLogs}>
            <Text style={styles.actionButtonText}>View Security Events</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerButton} onPress={clearSecurityLogs}>
            <Text style={styles.dangerButtonText}>Clear Security Logs</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Security Tips</Text>
          <Text style={styles.tipsText}>
            • Use biometric authentication when available{'\n'}
            • Enable auto-lock to protect your wallet{'\n'}
            • Change your password regularly{'\n'}
            • Never share your password or seed phrase{'\n'}
            • Always verify transaction details before sending
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeoutSection: {
    marginTop: 16,
  },
  timeoutButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  timeoutButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  timeoutButtonActive: {
    backgroundColor: '#4f46e5',
  },
  timeoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeoutButtonTextActive: {
    color: '#ffffff',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
  chevron: {
    fontSize: 18,
    color: '#9ca3af',
  },
  tipsSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    marginBottom: 32,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});

export default SecuritySettings;
