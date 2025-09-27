import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows, ModernTypography } from '../styles/ModernTheme';

interface Balance {
  public: number;
  private: number;
  currency?: string;
  usdValue?: {
    public: number;
    private: number;
  };
}

interface ModernBalanceDisplayProps {
  balance: Balance;
  isPrivateMode: boolean;
  onToggleVisibility?: () => void;
  loading?: boolean;
  showUSD?: boolean;
}

const ModernBalanceDisplay: React.FC<ModernBalanceDisplayProps> = ({
  balance,
  isPrivateMode,
  onToggleVisibility,
  loading = false,
  showUSD = true,
}) => {
  const currency = balance.currency || 'ETH';
  
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatUSD = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const totalBalance = balance.public + balance.private;
  const totalUSD = balance.usdValue 
    ? balance.usdValue.public + balance.usdValue.private 
    : 0;

  return (
    <View style={styles.container}>
      {/* Public Balance Section */}
      <View style={[
        styles.balanceSection,
        !isPrivateMode ? styles.activeModeSection : styles.inactiveModeSection
      ]}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceTypeInfo}>
            <Icon 
              name="eye" 
              size={20} 
              color={!isPrivateMode ? ModernColors.info : ModernColors.textTertiary} 
            />
            <Text style={[
              styles.balanceLabel,
              { color: !isPrivateMode ? ModernColors.info : ModernColors.textTertiary }
            ]}>
              Public Balance
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onToggleVisibility}
            style={styles.visibilityButton}
            activeOpacity={0.7}
          >
            <Icon 
              name="eye" 
              size={16} 
              color={ModernColors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceAmount}>
          <Text style={[
            styles.balanceValue,
            { color: !isPrivateMode ? ModernColors.textPrimary : ModernColors.textSecondary }
          ]}>
            {loading ? '••••••' : `${formatCurrency(balance.public)} ${currency}`}
          </Text>
          {showUSD && balance.usdValue && (
            <Text style={styles.usdValue}>
              ≈ {loading ? '$••••••' : formatUSD(balance.usdValue.public)}
            </Text>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Private Balance Section */}
      <View style={[
        styles.balanceSection,
        isPrivateMode ? styles.activeModeSection : styles.inactiveModeSection
      ]}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceTypeInfo}>
            <Icon 
              name="shield" 
              size={20} 
              color={isPrivateMode ? ModernColors.privacy.enhanced : ModernColors.textTertiary} 
            />
            <Text style={[
              styles.balanceLabel,
              { color: isPrivateMode ? ModernColors.privacy.enhanced : ModernColors.textTertiary }
            ]}>
              Private Vault
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onToggleVisibility}
            style={styles.visibilityButton}
            activeOpacity={0.7}
          >
            <Icon 
              name={isPrivateMode ? "eye" : "eye-off"} 
              size={16} 
              color={ModernColors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceAmount}>
          <Text style={[
            styles.balanceValue,
            { color: isPrivateMode ? ModernColors.textPrimary : ModernColors.textSecondary }
          ]}>
            {loading ? '••••••' : (
              isPrivateMode 
                ? `${formatCurrency(balance.private)} ${currency}` 
                : '••••••••'
            )}
          </Text>
          {showUSD && balance.usdValue && (
            <Text style={styles.usdValue}>
              {loading ? '$••••••' : (
                isPrivateMode 
                  ? `≈ ${formatUSD(balance.usdValue.private)}`
                  : 'Switch to Private Mode to view'
              )}
            </Text>
          )}
        </View>
      </View>

      {/* Total Balance Section */}
      <View style={styles.totalSection}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(139, 92, 246, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.totalGradient}
        />
        <View style={styles.totalContent}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalValue}>
            {loading ? '••••••••' : (
              isPrivateMode 
                ? `${formatCurrency(totalBalance)} ${currency}`
                : `${formatCurrency(balance.public)} ${currency} + Hidden`
            )}
          </Text>
          {showUSD && balance.usdValue && (
            <Text style={styles.totalUsdValue}>
              {loading ? '$••••••••' : (
                isPrivateMode 
                  ? `≈ ${formatUSD(totalUSD)}`
                  : `≈ ${formatUSD(balance.usdValue.public)} + Hidden`
              )}
            </Text>
          )}
        </View>
      </View>

      {/* Privacy Mode Indicator */}
      {isPrivateMode && (
        <View style={styles.privacyIndicator}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.privacyOverlay}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.xl,
    marginHorizontal: ModernSpacing.lg,
    marginVertical: ModernSpacing.sm,
    overflow: 'hidden',
    position: 'relative',
    ...ModernShadows.medium,
  },

  balanceSection: {
    padding: ModernSpacing.xl,
  },

  activeModeSection: {
    opacity: 1,
  },

  inactiveModeSection: {
    opacity: 0.5,
  },

  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ModernSpacing.md,
  },

  balanceTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  balanceLabel: {
    ...ModernTypography.bodyMedium,
    fontWeight: '500',
    marginLeft: ModernSpacing.sm,
  },

  visibilityButton: {
    padding: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
  },

  balanceAmount: {
    alignItems: 'flex-start',
  },

  balanceValue: {
    ...ModernTypography.h1,
    fontWeight: '700',
    marginBottom: ModernSpacing.xs,
  },

  usdValue: {
    ...ModernTypography.bodyMedium,
    color: ModernColors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: ModernColors.divider,
    marginHorizontal: ModernSpacing.xl,
  },

  totalSection: {
    position: 'relative',
    padding: ModernSpacing.xl,
    borderTopWidth: 1,
    borderTopColor: ModernColors.divider,
  },

  totalGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  totalContent: {
    alignItems: 'center',
  },

  totalLabel: {
    ...ModernTypography.bodyMedium,
    color: ModernColors.textSecondary,
    fontWeight: '500',
    marginBottom: ModernSpacing.sm,
  },

  totalValue: {
    ...ModernTypography.h3,
    color: ModernColors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
  },

  totalUsdValue: {
    ...ModernTypography.bodyMedium,
    color: ModernColors.textSecondary,
    marginTop: ModernSpacing.xs,
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
    borderRadius: ModernBorderRadius.xl,
  },
});

export default ModernBalanceDisplay;
