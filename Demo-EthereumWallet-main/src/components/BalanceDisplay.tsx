/**
 * Enhanced Balance Display Component
 * Shows wallet balance with loading states and error handling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';

interface BalanceDisplayProps {
  address?: string;
  showRefreshButton?: boolean;
  style?: any;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  address,
  showRefreshButton = true,
  style
}) => {
  const { colors, fontSize, fontWeight, spacing, borderRadius } = useTheme();
  const { getBalance, currentAccount } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = address || currentAccount?.address;

  const loadBalance = useCallback(async () => {
    if (!walletAddress) {
      setError('No wallet address available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Loading balance for address:', walletAddress);
      const balanceResult = await getBalance();
      console.log('✅ Balance loaded:', balanceResult);
      setBalance(balanceResult || '0');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load balance';
      console.error('❌ Balance loading error:', errorMessage);
      setError(errorMessage);
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, getBalance]);

  useEffect(() => {
    if (walletAddress) {
      loadBalance();
    }
  }, [loadBalance, walletAddress]);

  const formatBalance = (balance: string): string => {
    try {
      const numBalance = parseFloat(balance);
      if (numBalance === 0) return '0.00';
      if (numBalance < 0.0001) return '< 0.0001';
      if (numBalance >= 1000000) {
        return (numBalance / 1000000).toFixed(2) + 'M';
      }
      if (numBalance >= 1000) {
        return (numBalance / 1000).toFixed(2) + 'K';
      }
      return numBalance.toFixed(4);
    } catch {
      return '0.00';
    }
  };

  const styles = {
    container: {
      alignItems: 'center' as const,
      ...style,
    },
    balanceContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
    },
    balanceText: {
      fontSize: fontSize.xxxl,
      color: colors.textPrimary,
      fontWeight: fontWeight.bold,
      marginRight: spacing.sm,
    },
    currencyText: {
      fontSize: fontSize.lg,
      color: colors.textSecondary,
      fontWeight: fontWeight.medium,
    },
    addressText: {
      fontSize: fontSize.sm,
      color: colors.textTertiary,
      fontWeight: fontWeight.normal,
      marginBottom: spacing.sm,
    },
    loadingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    loadingText: {
      fontSize: fontSize.md,
      color: colors.textSecondary,
      fontWeight: fontWeight.medium,
      marginLeft: spacing.sm,
    },
    errorContainer: {
      backgroundColor: colors.error + '20',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.error,
      fontWeight: fontWeight.medium,
      textAlign: 'center' as const,
    },
    refreshButton: {
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.sm,
    },
    refreshButtonText: {
      fontSize: fontSize.sm,
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
  };

  if (!walletAddress) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No wallet address available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Wallet Address */}
      <Text style={styles.addressText}>
        {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
      </Text>

      {/* Balance Display */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading balance...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceText}>{formatBalance(balance)}</Text>
          <Text style={styles.currencyText}>ETH</Text>
        </View>
      )}

      {/* Refresh Button */}
      {showRefreshButton && !isLoading && (
        <TouchableOpacity style={styles.refreshButton} onPress={loadBalance}>
          <Text style={styles.refreshButtonText}>
            {error ? 'Retry' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default BalanceDisplay;
