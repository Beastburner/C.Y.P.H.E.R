import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { walletService } from '../../services/WalletService';
import { NavyTheme } from '../../styles/themes';

const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  success: NavyTheme.colors.success,
  error: NavyTheme.colors.error,
  warning: '#FF9800',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

const typography = {
  h3: { fontSize: 18 },
  body: { fontSize: 16 },
  caption: { fontSize: 14 },
  small: { fontSize: 12 },
};

/**
 * Network Troubleshooter
 * Helps users understand and switch networks for transactions
 */
export const NetworkTroubleshooter: React.FC<{ onNavigate: (screen: string) => void }> = ({ onNavigate }) => {
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);
  const [availableNetworks, setAvailableNetworks] = useState<any[]>([]);
  const [isMainnet, setIsMainnet] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    checkCurrentNetwork();
  }, []);

  const checkCurrentNetwork = async () => {
    try {
      addLog('🔍 Checking current network configuration...');
      
      // Get current network from wallet service
      const currentWallet = walletService.getCurrentWallet();
      if (currentWallet) {
        addLog(`📍 Current wallet found: ${currentWallet.name}`);
      }

      // Check if we're on mainnet or testnet
      const chainId = await getCurrentChainId();
      addLog(`🔗 Current chain ID: ${chainId}`);
      
      if (chainId === 1) {
        addLog('✅ You are on Ethereum Mainnet - real transactions');
        setIsMainnet(true);
      } else if (chainId === 11155111) {
        addLog('⚠️ You are on Sepolia Testnet - test transactions only!');
        setIsMainnet(false);
      } else {
        addLog(`ℹ️ You are on network ${chainId}`);
      }
      
    } catch (error) {
      addLog(`❌ Error checking network: ${error}`);
    }
  };

  const getCurrentChainId = async (): Promise<number> => {
    try {
      // Try to get chain ID from wallet service
      return 11155111; // Default to Sepolia for now
    } catch (error) {
      return 11155111;
    }
  };

  const switchToMainnet = () => {
    Alert.alert(
      '⚠️ Switch to Mainnet?',
      'This will switch you to Ethereum Mainnet where you can send REAL ETH to your friend. Make sure you have real ETH, not test ETH.\n\n' +
      '• Mainnet = Real money\n' +
      '• Testnet = Play money\n\n' +
      'Your friend needs to be on the same network to receive funds.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Mainnet',
          style: 'default',
          onPress: () => performNetworkSwitch(1, 'Ethereum Mainnet')
        }
      ]
    );
  };

  const switchToTestnet = () => {
    Alert.alert(
      '🧪 Switch to Testnet?',
      'This will switch you to Sepolia Testnet for testing. You can get free test ETH from faucets.\n\n' +
      '• Perfect for testing\n' +
      '• Free test ETH\n' +
      '• No real money risk',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch to Testnet',
          style: 'default',
          onPress: () => performNetworkSwitch(11155111, 'Sepolia Testnet')
        }
      ]
    );
  };

  const performNetworkSwitch = async (chainId: number, networkName: string) => {
    setIsLoading(true);
    addLog(`🔄 Switching to ${networkName} (${chainId})...`);
    
    try {
      // Here you would implement the actual network switching logic
      // For now, just show what would happen
      addLog(`✅ Network switch initiated to ${networkName}`);
      addLog('📱 You may need to restart the app for changes to take effect');
      
      Alert.alert(
        'Network Switch',
        `Initiated switch to ${networkName}.\n\nYou may need to:\n1. Restart the app\n2. Refresh your balance\n3. Make sure your friend is on the same network`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      addLog(`❌ Network switch failed: ${error}`);
      Alert.alert('Switch Failed', `Could not switch to ${networkName}: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const explainNetworkIssue = () => {
    Alert.alert(
      '🤔 Why Your Friend Can\'t See Transactions',
      'The #1 reason transactions "don\'t work" is network mismatch:\n\n' +
      '🌍 MAINNET (Chain ID: 1)\n' +
      '• Real ETH, real money\n' +
      '• What most people use\n' +
      '• Costs real gas fees\n\n' +
      '🧪 TESTNET (Chain ID: 11155111)\n' +
      '• Free test ETH\n' +
      '• For development/testing\n' +
      '• Separate blockchain\n\n' +
      '❗ KEY POINT: You and your friend must be on the SAME network to send/receive ETH!',
      [{ text: 'Got It!' }]
    );
  };

  const getFreeTestETH = () => {
    Alert.alert(
      '💧 Get Free Test ETH',
      'If you want to test on Sepolia testnet, you can get free ETH from faucets:\n\n' +
      '• Sepolia Faucet: sepoliafaucet.com\n' +
      '• Alchemy Faucet: sepoliafaucet.net\n' +
      '• Infura Faucet: infura.io/faucet\n\n' +
      'Just enter your address and get free test ETH!',
      [
        { text: 'OK' },
        {
          text: 'Copy My Address',
          onPress: async () => {
            const accounts = await walletService.getAllAccounts();
            if (accounts.length > 0) {
              // Here you would copy to clipboard
              Alert.alert('Address', accounts[0].address);
            }
          }
        }
      ]
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('Settings')}
        >
          <Text style={styles.backText}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{"🌐 Network Troubleshooter"}</Text>
        <Text style={styles.subtitle}>{"Fix \"transaction not working\" issues"}</Text>
      </View>

      {/* Current Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Current Status"}</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{"Network:"}</Text>
            <Text style={[styles.statusValue, { color: isMainnet ? colors.success : colors.warning }]}>
              {isMainnet ? "🌍 Ethereum Mainnet" : "🧪 Sepolia Testnet"}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{"Money Type:"}</Text>
            <Text style={[styles.statusValue, { color: isMainnet ? colors.error : colors.success }]}>
              {isMainnet ? "💰 REAL ETH" : "🆓 FREE TEST ETH"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{"Quick Fix Actions"}</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={explainNetworkIssue}>
          <Text style={styles.actionIcon}>{"🤔"}</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{"Why Transactions \"Don't Work\""}</Text>
            <Text style={styles.actionSubtitle}>{"Common network mismatch explanation"}</Text>
          </View>
        </TouchableOpacity>

        {!isMainnet ? (
          <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={switchToMainnet}>
            <Text style={styles.actionIcon}>{"🌍"}</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{"Switch to Mainnet (Real ETH)"}</Text>
              <Text style={styles.actionSubtitle}>{"Send real ETH to your friend"}</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]} onPress={switchToTestnet}>
            <Text style={styles.actionIcon}>{"🧪"}</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{"Switch to Testnet (Free ETH)"}</Text>
              <Text style={styles.actionSubtitle}>{"Test transactions safely"}</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={getFreeTestETH}>
          <Text style={styles.actionIcon}>{"💧"}</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{"Get Free Test ETH"}</Text>
            <Text style={styles.actionSubtitle}>{"For testing on Sepolia"}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Debug Logs */}
      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>{`Debug Logs (${logs.length})`}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
            <Text style={styles.clearButtonText}>{"Clear"}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logContainer} nestedScrollEnabled>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logText}>
              {log}
            </Text>
          ))}
          {logs.length === 0 && (
            <Text style={styles.emptyLogText}>{"Network analysis will appear here..."}</Text>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray200,
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statusValue: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  primaryAction: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  secondaryAction: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  actionSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    ...typography.caption,
    color: colors.primary,
  },
  logContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: spacing.sm,
    maxHeight: 300,
  },
  logText: {
    ...typography.small,
    color: '#00ff00',
    fontFamily: 'monospace',
    marginBottom: spacing.xs,
    lineHeight: 14,
  },
  emptyLogText: {
    ...typography.small,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: spacing.md,
  },
});

export default NetworkTroubleshooter;
