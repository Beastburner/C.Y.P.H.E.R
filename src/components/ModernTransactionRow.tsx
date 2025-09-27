import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernTypography } from '../styles/ModernTheme';

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'deposit' | 'withdraw' | 'swap';
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  mode: 'public-to-public' | 'public-to-private' | 'private-to-private' | 'private-to-public';
  hash?: string;
  fee?: number;
  usdValue?: number;
}

interface ModernTransactionRowProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
  showMode?: boolean;
  compact?: boolean;
}

const ModernTransactionRow: React.FC<ModernTransactionRowProps> = ({
  transaction,
  onPress,
  showMode = true,
  compact = false,
}) => {
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'send':
        return <Icon name="arrow-up-right" size={20} color={ModernColors.transaction.send} />;
      case 'receive':
        return <Icon name="arrow-down-left" size={20} color={ModernColors.transaction.receive} />;
      case 'deposit':
        return <Icon name="shield" size={20} color={ModernColors.transaction.deposit} />;
      case 'withdraw':
        return <Icon name="unlock" size={20} color={ModernColors.transaction.withdraw} />;
      case 'swap':
        return <Icon name="refresh-cw" size={20} color={ModernColors.info} />;
      default:
        return <Icon name="activity" size={20} color={ModernColors.textTertiary} />;
    }
  };

  const getModeStyles = () => {
    switch (transaction.mode) {
      case 'public-to-public':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue
          color: '#1e40af', // blue-800
          borderColor: 'rgba(59, 130, 246, 0.2)',
        };
      case 'public-to-private':
        return {
          backgroundColor: 'rgba(139, 92, 246, 0.1)', // violet
          color: '#6b21a8', // violet-800
          borderColor: 'rgba(139, 92, 246, 0.2)',
        };
      case 'private-to-private':
        return {
          backgroundColor: 'rgba(139, 92, 246, 0.15)', // violet stronger
          color: '#581c87', // violet-900
          borderColor: 'rgba(139, 92, 246, 0.3)',
        };
      case 'private-to-public':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.1)', // emerald
          color: '#047857', // emerald-800
          borderColor: 'rgba(16, 185, 129, 0.2)',
        };
      default:
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.1)', // gray
          color: '#374151', // gray-700
          borderColor: 'rgba(107, 114, 128, 0.2)',
        };
    }
  };

  const getStatusStyles = () => {
    switch (transaction.status) {
      case 'confirmed':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.1)', // emerald
          color: '#047857', // emerald-800
        };
      case 'pending':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)', // amber
          color: '#92400e', // amber-800
        };
      case 'failed':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)', // red
          color: '#991b1b', // red-800
        };
      default:
        return {
          backgroundColor: ModernColors.border,
          color: ModernColors.textTertiary,
        };
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'send' || type === 'withdraw' ? '-' : '+';
    return `${sign}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })}`;
  };

  const modeStyles = getModeStyles();
  const statusStyles = getStatusStyles();

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer]}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>
        <View style={[styles.icon, { backgroundColor: `${getTransactionIcon().props.color}20` }]}>
          {getTransactionIcon()}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.mainRow}>
          <View style={styles.leftContent}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Text>
              {showMode && (
                <View style={[styles.modeBadge, { backgroundColor: modeStyles.backgroundColor, borderColor: modeStyles.borderColor }]}>
                  <Text style={[styles.modeText, { color: modeStyles.color }]}>
                    {transaction.mode.replace('-', ' → ')}
                  </Text>
                </View>
              )}
            </View>
            
            {!compact && (
              <View style={styles.addressRow}>
                <Text style={styles.addressText}>
                  {formatAddress(transaction.from)} → {formatAddress(transaction.to)}
                </Text>
              </View>
            )}
            
            <View style={styles.timestampRow}>
              <Text style={styles.timestamp}>{transaction.timestamp}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
                <Text style={[styles.statusText, { color: statusStyles.color }]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rightContent}>
            <Text style={[
              styles.amount,
              { 
                color: transaction.type === 'send' || transaction.type === 'withdraw' 
                  ? ModernColors.transaction.send 
                  : ModernColors.transaction.receive 
              }
            ]}>
              {formatAmount(transaction.amount, transaction.type)} {transaction.currency}
            </Text>
            {transaction.usdValue && (
              <Text style={styles.usdAmount}>
                ≈ ${transaction.usdValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Privacy Mode Indicator */}
      {(transaction.mode === 'private-to-private' || 
        transaction.mode === 'public-to-private' || 
        transaction.mode === 'private-to-public') && (
        <View style={styles.privacyIndicator}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.05)', 'rgba(139, 92, 246, 0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privacyOverlay}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ModernSpacing.lg,
    paddingHorizontal: ModernSpacing.xl,
    backgroundColor: ModernColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.divider,
    position: 'relative',
    overflow: 'hidden',
  },

  compactContainer: {
    paddingVertical: ModernSpacing.md,
  },

  iconContainer: {
    marginRight: ModernSpacing.md,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
  },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  leftContent: {
    flex: 1,
    marginRight: ModernSpacing.md,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernSpacing.xs,
  },

  title: {
    ...ModernTypography.bodyLarge,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginRight: ModernSpacing.sm,
  },

  modeBadge: {
    paddingHorizontal: ModernSpacing.sm,
    paddingVertical: 2,
    borderRadius: ModernBorderRadius.sm,
    borderWidth: 1,
  },

  modeText: {
    fontSize: 10,
    fontWeight: '500',
  },

  addressRow: {
    marginBottom: ModernSpacing.xs,
  },

  addressText: {
    ...ModernTypography.bodySmall,
    color: ModernColors.textSecondary,
    fontFamily: 'monospace',
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timestamp: {
    ...ModernTypography.caption,
    color: ModernColors.textTertiary,
    marginRight: ModernSpacing.sm,
  },

  statusBadge: {
    paddingHorizontal: ModernSpacing.sm,
    paddingVertical: 2,
    borderRadius: ModernBorderRadius.sm,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },

  rightContent: {
    alignItems: 'flex-end',
  },

  amount: {
    ...ModernTypography.bodyLarge,
    fontWeight: '600',
    fontFamily: 'monospace',
  },

  usdAmount: {
    ...ModernTypography.bodySmall,
    color: ModernColors.textSecondary,
    marginTop: 2,
  },

  privacyIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  privacyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ModernTransactionRow;
