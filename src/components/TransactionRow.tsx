import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Transaction } from '../types';
import { useTheme } from '../context/ThemeContext';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction, onPress }) => {
  const { colors, typography, spacing } = useTheme();

  const formatAmount = (amount: string, decimals: number = 18) => {
    try {
      const value = parseFloat(amount) / Math.pow(10, decimals);
      return value.toFixed(4);
    } catch {
      return '0.0000';
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTransactionIcon = () => {
    if (transaction.type === 'send' || transaction.to) {
      return 'arrow-upward';
    } else if (transaction.type === 'receive' || transaction.from) {
      return 'arrow-downward';
    } else {
      return 'swap-horiz';
    }
  };

  const getTransactionColor = () => {
    if (transaction.type === 'send') {
      return colors.error;
    } else if (transaction.type === 'receive') {
      return colors.success;
    } else {
      return colors.primary;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      const date = new Date(timestamp * 1000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return 'Unknown time';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: getTransactionColor() + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    contentContainer: {
      flex: 1,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    transactionType: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.primary,
      fontWeight: typography.fontWeight.semibold,
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    amount: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.primary,
      fontWeight: typography.fontWeight.semibold,
      color: getTransactionColor(),
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    addressText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.primary,
      color: colors.textSecondary,
    },
    timestampText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.primary,
      color: colors.textSecondary,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.primary,
      color: getStatusColor(),
      marginLeft: spacing.xs,
      textTransform: 'capitalize',
    },
    hashText: {
      fontSize: typography.fontSize.sm,
      fontFamily: typography.fontFamily.mono,
      color: colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Icon
          name={getTransactionIcon()}
          size={20}
          color={getTransactionColor()}
        />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.topRow}>
          <Text style={styles.transactionType}>
            {transaction.type || (transaction.to ? 'Send' : 'Receive')}
          </Text>
          <Text style={styles.amount}>
            {transaction.type === 'send' ? '-' : '+'}
            {formatAmount(transaction.value)} ETH
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.addressText}>
              {transaction.type === 'send' 
                ? `To: ${formatAddress(transaction.to || '')}`
                : `From: ${formatAddress(transaction.from || '')}`
              }
            </Text>
            {transaction.hash && (
              <Text style={styles.hashText}>
                {formatAddress(transaction.hash)}
              </Text>
            )}
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.timestampText}>
              {formatTimestamp(transaction.timestamp || Date.now() / 1000)}
            </Text>
            <View style={styles.statusContainer}>
              <Icon
                name={
                  transaction.status === 'confirmed' ? 'check-circle' :
                  transaction.status === 'pending' ? 'schedule' :
                  transaction.status === 'failed' ? 'error' : 'help'
                }
                size={12}
                color={getStatusColor()}
              />
              <Text style={styles.statusText}>
                {transaction.status || 'unknown'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TransactionRow;
