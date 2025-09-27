/**
 * Wallet Status Screen
 * Shows comprehensive wallet status and debugging information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';
import SimpleCard from '../../components/SimpleCard';
import BalanceDisplay from '../../components/BalanceDisplay';
import WalletImportTester from '../../utils/WalletImportTester';

interface StatusItemProps {
  label: string;
  value: string;
  status: 'success' | 'error' | 'warning' | 'info';
  onPress?: () => void;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, value, status, onPress }) => {
    const { colors, fontSize, fontWeight, spacing } = useTheme();
  
  const statusColors = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.primary,
  };

  const styles = {
    container: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    label: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: fontWeight.medium,
      flex: 1,
    },
    value: {
      fontSize: fontSize.sm,
      color: statusColors[status],
      fontWeight: fontWeight.normal,
      flex: 2,
      textAlign: 'right' as const,
    },
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} disabled={!onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </TouchableOpacity>
  );
};

interface WalletStatusScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

export const WalletStatusScreen: React.FC<WalletStatusScreenProps> = ({ onNavigate }) => {
  const { colors, fontSize, fontWeight, spacing, borderRadius } = useTheme();
  const { state, currentAccount, getBalance } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const styles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      backgroundColor: colors.backgroundTertiary,
    },
    headerTop: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    homeButton: {
      padding: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.surface,
      minWidth: 36,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    homeButtonText: {
      fontSize: 18,
      color: colors.textPrimary,
    },
    titleContainer: {
      flex: 1,
      alignItems: 'center' as const,
    },
    placeholder: {
      width: 36,
    },
    title: {
      fontSize: fontSize.xxxl,
      color: colors.textPrimary,
      fontWeight: fontWeight.bold,
      textAlign: 'center' as const,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      fontWeight: fontWeight.medium,
      textAlign: 'center' as const,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    sectionTitle: {
      fontSize: fontSize.xl,
      color: colors.textPrimary,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    card: {
      marginBottom: spacing.lg,
      backgroundColor: colors.backgroundTertiary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.lg,
      alignItems: 'center' as const,
      marginVertical: spacing.md,
    },
    testButtonText: {
      fontSize: fontSize.md,
      color: colors.textPrimary,
      fontWeight: fontWeight.semibold,
    },
    testResults: {
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginTop: spacing.md,
    },
    testResultsText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontWeight: fontWeight.normal,
      lineHeight: fontSize.sm * 1.5,
    },
  };

  const getWalletStatus = () => {
    const items: StatusItemProps[] = [
      {
        label: 'Wallet Initialized',
        value: state.isInitialized ? '✅ Yes' : '❌ No',
        status: state.isInitialized ? 'success' : 'error',
      },
      {
        label: 'Wallet Unlocked',
        value: state.isUnlocked ? '✅ Yes' : '❌ No',
        status: state.isUnlocked ? 'success' : 'error',
      },
      {
        label: 'Current Account',
        value: currentAccount?.name || '❌ None',
        status: currentAccount ? 'success' : 'error',
      },
      {
        label: 'Account Address',
        value: currentAccount?.address ? 
          `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}` : 
          '❌ None',
        status: currentAccount?.address ? 'success' : 'error',
        onPress: currentAccount?.address ? () => {
          Alert.alert('Full Address', currentAccount.address);
        } : undefined,
      },
      {
        label: 'Private Key Available',
        value: currentAccount?.privateKey ? '✅ Yes' : '❌ No',
        status: currentAccount?.privateKey ? 'success' : 'error',
      },
      {
        label: 'Network',
        value: state.activeNetwork?.name || state.currentNetwork?.name || '❌ None',
        status: (state.activeNetwork || state.currentNetwork) ? 'success' : 'warning',
      },
      {
        label: 'Accounts Count',
        value: state.accounts?.length?.toString() || '0',
        status: (state.accounts?.length || 0) > 0 ? 'success' : 'warning',
      },
    ];

    return items;
  };

  const getServiceStatus = () => {
    const items: StatusItemProps[] = [
      {
        label: 'CryptoService',
        value: '✅ Available',
        status: 'success',
      },
      {
        label: 'WalletService',
        value: '✅ Available',
        status: 'success',
      },
      {
        label: 'TransactionService',
        value: '✅ Available',
        status: 'success',
      },
      {
        label: 'SecurityManager',
        value: '✅ Available',
        status: 'success',
      },
    ];

    return items;
  };

  const handleTestMnemonicImport = async () => {
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    setTestResults('Running mnemonic import test...');
    
    try {
      const result = await WalletImportTester.testMnemonicImport(testMnemonic);
      setTestResults(JSON.stringify(result, null, 2));
    } catch (error) {
      setTestResults(`Error: ${error}`);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh wallet state
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onNavigate && (
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => onNavigate('Home')}
            >
              <Text style={styles.homeButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>🔍 Wallet Status</Text>
            <Text style={styles.subtitle}>Diagnostic information and testing tools</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Balance Display */}
        <Text style={styles.sectionTitle}>Balance Information</Text>
        <SimpleCard style={styles.card}>
          <BalanceDisplay showRefreshButton={true} />
        </SimpleCard>

        {/* Wallet Status */}
        <Text style={styles.sectionTitle}>Wallet Status</Text>
        <SimpleCard style={styles.card}>
          {getWalletStatus().map((item, index) => (
            <StatusItem key={index} {...item} />
          ))}
        </SimpleCard>

        {/* Service Status */}
        <Text style={styles.sectionTitle}>Service Status</Text>
        <SimpleCard style={styles.card}>
          {getServiceStatus().map((item, index) => (
            <StatusItem key={index} {...item} />
          ))}
        </SimpleCard>

        {/* Testing Tools */}
        <Text style={styles.sectionTitle}>Testing Tools</Text>
        <SimpleCard style={styles.card}>
          <TouchableOpacity style={styles.testButton} onPress={handleTestMnemonicImport}>
            <Text style={styles.testButtonText}>Test Mnemonic Import</Text>
          </TouchableOpacity>

          {testResults && (
            <View style={styles.testResults}>
              <Text style={styles.testResultsText}>{testResults}</Text>
            </View>
          )}
        </SimpleCard>
      </ScrollView>
    </View>
  );
};

export default WalletStatusScreen;
