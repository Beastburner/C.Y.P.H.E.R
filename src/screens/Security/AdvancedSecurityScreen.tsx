import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { biometricAuthentication } from '../../utils/biometricAuth';
import SecurityManager from '../../utils/securityManager';
import { hardwareWalletManager } from '../../utils/hardwareWalletManager';

/**
 * @title AdvancedSecurityScreen
 * @dev React Native component for managing advanced security features
 * @notice This screen provides:
 *         - Multi-factor authentication setup
 *         - Hardware wallet integration
 *         - Security policy configuration
 *         - Threat detection settings
 *         - Backup and recovery options
 */

interface SecurityScreenProps {
  navigation: any;
  route: any;
}

interface SecuritySettings {
  biometricEnabled: boolean;
  hardwareWalletEnabled: boolean;
  twoFactorEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  transactionLimits: boolean;
  dailyLimit: string;
  suspiciousActivityDetection: boolean;
  vpnDetection: boolean;
  jailbreakDetection: boolean;
  screenRecordingDetection: boolean;
  clipboardProtection: boolean;
  keyloggerProtection: boolean;
}

interface HardwareWallet {
  id: string;
  name: string;
  type: 'ledger' | 'trezor' | 'keepkey';
  connected: boolean;
  address: string;
  balance: string;
}

const AdvancedSecurityScreen: React.FC<SecurityScreenProps> = ({ navigation, route }) => {
  // State management
  const [activeTab, setActiveTab] = useState<'authentication' | 'hardware' | 'policies' | 'monitoring'>('authentication');
  const [isLoading, setIsLoading] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    hardwareWalletEnabled: false,
    twoFactorEnabled: false,
    autoLockEnabled: true,
    autoLockTimeout: 300, // 5 minutes
    transactionLimits: true,
    dailyLimit: '10.0',
    suspiciousActivityDetection: true,
    vpnDetection: false,
    jailbreakDetection: true,
    screenRecordingDetection: true,
    clipboardProtection: true,
    keyloggerProtection: true,
  });

  const [hardwareWallets, setHardwareWallets] = useState<HardwareWallet[]>([]);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);

  // Initialize component
  useEffect(() => {
    initializeSecurity();
  }, []);

  const initializeSecurity = async () => {
    setIsLoading(true);
    try {
      // Check biometric support
      const biometricAvailable = await biometricAuthentication.isSupported();
      setBiometricSupported(biometricAvailable);

      // Load security settings (mock for now)
      const settings: SecuritySettings = {
        biometricEnabled: biometricAvailable,
        hardwareWalletEnabled: false,
        twoFactorEnabled: false,
        autoLockEnabled: true,
        autoLockTimeout: 5,
        transactionLimits: true,
        dailyLimit: '1000.00',
        suspiciousActivityDetection: true,
        vpnDetection: false,
        jailbreakDetection: true,
        screenRecordingDetection: true,
        clipboardProtection: true,
        keyloggerProtection: true,
      };
      setSecuritySettings(settings);

      // Scan for hardware wallets
      const connectedWallets = await hardwareWalletManager.scanForWallets();
      setHardwareWallets(connectedWallets);

      // Calculate security score
      const score = calculateSecurityScore(settings || securitySettings);
      setSecurityScore(score);

    } catch (error) {
      console.error('Failed to initialize security:', error);
      Alert.alert('Error', 'Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSecurityScore = (settings: SecuritySettings): number => {
    let score = 0;
    const maxScore = 100;

    // Biometric authentication (20 points)
    if (settings.biometricEnabled) score += 20;

    // Hardware wallet (25 points)
    if (settings.hardwareWalletEnabled) score += 25;

    // Two-factor authentication (20 points)
    if (settings.twoFactorEnabled) score += 20;

    // Auto lock (10 points)
    if (settings.autoLockEnabled) score += 10;

    // Transaction limits (10 points)
    if (settings.transactionLimits) score += 10;

    // Threat detection (15 points)
    if (settings.suspiciousActivityDetection) score += 5;
    if (settings.jailbreakDetection) score += 5;
    if (settings.screenRecordingDetection) score += 5;

    return Math.min(score, maxScore);
  };

  // Security setting handlers
  const handleSettingChange = async (key: keyof SecuritySettings, value: boolean | string | number) => {
    try {
      const newSettings = { ...securitySettings, [key]: value };
      setSecuritySettings(newSettings);
      
      // Save to secure storage (implement as needed)
      console.log('Saving security settings:', newSettings);
      
      // Update security score
      const newScore = calculateSecurityScore(newSettings);
      setSecurityScore(newScore);

      // Handle specific setting changes
      if (key === 'biometricEnabled' && value === true) {
        await enableBiometricAuth();
      } else if (key === 'hardwareWalletEnabled' && value === true) {
        await enableHardwareWallet();
      } else if (key === 'twoFactorEnabled' && value === true) {
        await enableTwoFactor();
      }

    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      Alert.alert('Error', `Failed to update security setting`);
      // Revert the change
      setSecuritySettings(prev => ({ ...prev, [key]: !value }));
    }
  };

  const enableBiometricAuth = async () => {
    if (!biometricSupported) {
      Alert.alert('Not Supported', 'Biometric authentication is not available on this device');
      return;
    }

    try {
      const result = await biometricAuthentication.authenticate('Enable biometric authentication');
      if (result.success) {
        Alert.alert('Success', 'Biometric authentication enabled');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable biometric authentication');
      setSecuritySettings(prev => ({ ...prev, biometricEnabled: false }));
    }
  };

  const enableHardwareWallet = async () => {
    try {
      Alert.alert(
        'Hardware Wallet Setup',
        'Connect your hardware wallet and follow the setup instructions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => navigation.navigate('HardwareWalletSetup') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize hardware wallet setup');
      setSecuritySettings(prev => ({ ...prev, hardwareWalletEnabled: false }));
    }
  };

  const enableTwoFactor = async () => {
    try {
      Alert.alert(
        'Two-Factor Authentication',
        'Set up 2FA using an authenticator app for enhanced security.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Setup', onPress: () => navigation.navigate('TwoFactorSetup') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize 2FA setup');
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
    }
  };

  const handleHardwareWalletConnect = async (walletType: 'ledger' | 'trezor' | 'keepkey') => {
    setIsLoading(true);
    try {
      const result = await hardwareWalletManager.connectWallet(walletType);
      if (result.success && result.wallet) {
        setHardwareWallets(prev => [...prev, result.wallet!]);
        Alert.alert('Success', `${walletType} connected successfully`);
      } else {
        Alert.alert('Error', result.error || `Failed to connect ${walletType}`);
      }
    } catch (error) {
      console.error('Hardware wallet connection failed:', error);
      Alert.alert('Error', `Failed to connect ${walletType}`);
    } finally {
      setIsLoading(false);
    }
  };

  const performSecurityAudit = async () => {
    // Real security audit implementation
    const checks = [];
    let score = 100;
    
    // Check if biometrics are enabled
    if (!securitySettings.biometricEnabled) {
      checks.push('Consider enabling biometric authentication');
      score -= 15;
    }
    
    // Check auto-lock settings
    if (securitySettings.autoLockTimeout > 1800) { // 30 minutes
      checks.push('Consider shorter auto-lock duration');
      score -= 10;
    }
    
    // Check if 2FA is enabled
    if (!securitySettings.twoFactorEnabled) {
      checks.push('Enable two-factor authentication');
      score -= 20;
    }
    
    return {
      score: Math.max(score, 0),
      recommendations: checks
    };
  };

  const handleSecurityAudit = async () => {
    setIsLoading(true);
    try {
      // Real security audit results
      const auditResults = await performSecurityAudit();
      
      Alert.alert(
        'Security Audit Complete',
        `Security Score: ${auditResults.score}/100\n\nRecommendations:\n${auditResults.recommendations.join('\n')}`,
        [
          { text: 'View Details', onPress: () => navigation.navigate('SecurityAuditResults', { results: auditResults }) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Security audit failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Render functions
  const renderSecurityScore = () => (
    <View style={styles.scoreCard}>
      <View style={styles.scoreHeader}>
        <Icon name="security" size={24} color={getScoreColor(securityScore)} />
        <Text style={styles.scoreTitle}>Security Score</Text>
      </View>
      <View style={styles.scoreDisplay}>
        <Text style={[styles.scoreValue, { color: getScoreColor(securityScore) }]}>
          {securityScore}
        </Text>
        <Text style={styles.scoreMax}>/100</Text>
      </View>
      <View style={styles.scoreBar}>
        <View 
          style={[
            styles.scoreProgress, 
            { 
              width: `${securityScore}%`,
              backgroundColor: getScoreColor(securityScore)
            }
          ]} 
        />
      </View>
      <TouchableOpacity style={styles.auditButton} onPress={handleSecurityAudit}>
        <Text style={styles.auditButtonText}>Run Security Audit</Text>
      </TouchableOpacity>
    </View>
  );

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const renderAuthenticationTab = () => (
    <ScrollView style={styles.tabContent}>
      {renderSecurityScore()}

      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Authentication Methods</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="fingerprint" size={20} color="#4CAF50" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.biometricEnabled}
            onValueChange={(value) => handleSettingChange('biometricEnabled', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.biometricEnabled ? '#FFF' : '#f4f3f4'}
            disabled={!biometricSupported}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="security" size={20} color="#2196F3" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>
                Additional security with authenticator app
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.twoFactorEnabled}
            onValueChange={(value) => handleSettingChange('twoFactorEnabled', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.twoFactorEnabled ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="lock-clock" size={20} color="#FF9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto Lock</Text>
              <Text style={styles.settingDescription}>
                Lock wallet after inactivity
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.autoLockEnabled}
            onValueChange={(value) => handleSettingChange('autoLockEnabled', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.autoLockEnabled ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderHardwareTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.hardwareCard}>
        <Text style={styles.sectionTitle}>Hardware Wallets</Text>
        
        {hardwareWallets.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="device-hub" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No hardware wallets connected</Text>
            <Text style={styles.emptySubtext}>
              Connect a hardware wallet for maximum security
            </Text>
          </View>
        ) : (
          hardwareWallets.map((wallet, index) => (
            <View key={index} style={styles.walletItem}>
              <View style={styles.walletInfo}>
                <Icon 
                  name={wallet.type === 'ledger' ? 'account-balance-wallet' : 'security'} 
                  size={20} 
                  color="#4CAF50" 
                />
                <View style={styles.walletDetails}>
                  <Text style={styles.walletName}>{wallet.name}</Text>
                  <Text style={styles.walletAddress}>
                    {wallet.address.substring(0, 10)}...{wallet.address.substring(32)}
                  </Text>
                </View>
              </View>
              <View style={styles.walletStatus}>
                <View style={[styles.statusDot, { backgroundColor: wallet.connected ? '#4CAF50' : '#F44336' }]} />
                <Text style={styles.statusText}>
                  {wallet.connected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.connectButtons}>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => handleHardwareWalletConnect('ledger')}
            disabled={isLoading}
          >
            <Text style={styles.connectButtonText}>Connect Ledger</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => handleHardwareWalletConnect('trezor')}
            disabled={isLoading}
          >
            <Text style={styles.connectButtonText}>Connect Trezor</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderPoliciesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Transaction Policies</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="account-balance" size={20} color="#FF9800" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Transaction Limits</Text>
              <Text style={styles.settingDescription}>
                Set daily transaction limits
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.transactionLimits}
            onValueChange={(value) => handleSettingChange('transactionLimits', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.transactionLimits ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="vpn-lock" size={20} color="#9C27B0" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>VPN Detection</Text>
              <Text style={styles.settingDescription}>
                Block transactions through VPN
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.vpnDetection}
            onValueChange={(value) => handleSettingChange('vpnDetection', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.vpnDetection ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderMonitoringTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Threat Detection</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="warning" size={20} color="#F44336" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Suspicious Activity Detection</Text>
              <Text style={styles.settingDescription}>
                Monitor for unusual transaction patterns
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.suspiciousActivityDetection}
            onValueChange={(value) => handleSettingChange('suspiciousActivityDetection', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.suspiciousActivityDetection ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="phone-android" size={20} color="#FF5722" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Jailbreak Detection</Text>
              <Text style={styles.settingDescription}>
                Block on rooted/jailbroken devices
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.jailbreakDetection}
            onValueChange={(value) => handleSettingChange('jailbreakDetection', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.jailbreakDetection ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="screen-lock-portrait" size={20} color="#607D8B" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Screen Recording Detection</Text>
              <Text style={styles.settingDescription}>
                Prevent screen recording and screenshots
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.screenRecordingDetection}
            onValueChange={(value) => handleSettingChange('screenRecordingDetection', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.screenRecordingDetection ? '#FFF' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="content-paste" size={20} color="#795548" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Clipboard Protection</Text>
              <Text style={styles.settingDescription}>
                Clear clipboard after copying sensitive data
              </Text>
            </View>
          </View>
          <Switch
            value={securitySettings.clipboardProtection}
            onValueChange={(value) => handleSettingChange('clipboardProtection', value)}
            trackColor={{ false: '#767577', true: '#4CAF50' }}
            thumbColor={securitySettings.clipboardProtection ? '#FFF' : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advanced Security</Text>
        <View style={styles.headerRight}>
          {isLoading && <ActivityIndicator size="small" color="#666" />}
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'authentication' && styles.activeTab]}
          onPress={() => setActiveTab('authentication')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'authentication' && styles.activeTabText]}>
            Auth
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'hardware' && styles.activeTab]}
          onPress={() => setActiveTab('hardware')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'hardware' && styles.activeTabText]}>
            Hardware
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'policies' && styles.activeTab]}
          onPress={() => setActiveTab('policies')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'policies' && styles.activeTabText]}>
            Policies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'monitoring' && styles.activeTab]}
          onPress={() => setActiveTab('monitoring')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'monitoring' && styles.activeTabText]}>
            Monitoring
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'authentication' && renderAuthenticationTab()}
      {activeTab === 'hardware' && renderHardwareTab()}
      {activeTab === 'policies' && renderPoliciesTab()}
      {activeTab === 'monitoring' && renderMonitoringTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 32,
    alignItems: 'center',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  scoreCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  scoreBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 16,
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  auditButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  auditButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  hardwareCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletDetails: {
    marginLeft: 12,
  },
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  walletStatus: {
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
    color: '#666',
  },
  connectButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  connectButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AdvancedSecurityScreen;
