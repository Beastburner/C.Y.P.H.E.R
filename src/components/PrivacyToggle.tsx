import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { privacyService } from '../services/PrivacyService';
import { NavyTheme } from '../styles/themes';

// Extract commonly used values
const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  gray200: NavyTheme.colors.surfaceSecondary,
  gray300: NavyTheme.colors.surfaceTertiary,
  gray500: NavyTheme.colors.textTertiary,
  gray600: NavyTheme.colors.textSecondary,
  black: '#000000',
  success: NavyTheme.colors.success,
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
};

interface PrivacyToggleProps {
  onToggle?: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Privacy Toggle Component
 * Enables/disables dual-layer privacy architecture
 */
export const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  onToggle,
  disabled = false,
}) => {
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [privacyScore, setPrivacyScore] = useState<number | null>(null);

  useEffect(() => {
    loadPrivacyState();
  }, []);

  const loadPrivacyState = async () => {
    try {
      const state = await privacyService.getPrivacyState();
      setIsPrivacyEnabled(state.isPrivacyEnabled);
      setPrivacyScore(state.privacyScore);
    } catch (error) {
      console.error('Failed to load privacy state:', error);
    }
  };

  const handleToggle = async (value: boolean) => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    
    try {
      if (value) {
        // Enable dual-layer privacy
        const result = await privacyService.enableDualLayerMode();
        
        if (result.success) {
          setIsPrivacyEnabled(true);
          setPrivacyScore(result.privacyScore || null);
          
          Alert.alert(
            '🔐 Privacy Enabled',
            `Dual-layer privacy architecture is now active.${
              result.privacyScore ? `\nPrivacy Score: ${result.privacyScore}/100` : ''
            }`,
            [{ text: 'OK' }]
          );
        } else {
          throw new Error(result.error || 'Failed to enable privacy mode');
        }
      } else {
        // Disable privacy mode
        await privacyService.disablePrivacyMode();
        setIsPrivacyEnabled(false);
        setPrivacyScore(null);
        
        Alert.alert(
          '🔓 Privacy Disabled',
          'Privacy mode has been turned off. Your transactions will be public.',
          [{ text: 'OK' }]
        );
      }
      
      onToggle?.(value);
    } catch (error) {
      console.error('Privacy toggle error:', error);
      Alert.alert(
        'Privacy Error',
        `Failed to ${value ? 'enable' : 'disable'} privacy mode: ${(error as Error).message}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfoPress = () => {
    Alert.alert(
      'Privacy Mode Information',
      'Dual-Layer Privacy Architecture:\n\n' +
      '• Public Layer: Creates public aliases for your transactions\n' +
      '• Private Layer: Uses ZK-SNARKs to hide transaction details\n' +
      '• Enhanced Anonymity: Breaks transaction linkability\n' +
      '• Privacy Score: Measures your transaction privacy level\n\n' +
      'Note: Privacy mode may increase transaction fees and processing time.',
      [{ text: 'Got it' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Privacy Mode</Text>
        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={handleInfoPress}
        >
          <Text style={styles.infoText}>ⓘ</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.subtitle}>
            {isPrivacyEnabled ? 'Privacy Enabled' : 'Privacy Disabled'}
          </Text>
          <Text style={styles.description}>
            {isPrivacyEnabled 
              ? 'Transactions use dual-layer privacy architecture'
              : 'Transactions are public and linkable'
            }
          </Text>
          {privacyScore && (
            <Text style={styles.privacyScore}>
              Privacy Score: {privacyScore}/100
            </Text>
          )}
        </View>
        
        <View style={styles.toggleContainer}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Switch
              value={isPrivacyEnabled}
              onValueChange={handleToggle}
              disabled={disabled}
              trackColor={{
                false: colors.gray300,
                true: colors.primary + '40',
              }}
              thumbColor={isPrivacyEnabled ? colors.primary : colors.gray500}
              ios_backgroundColor={colors.gray300}
            />
          )}
        </View>
      </View>
      
      {isPrivacyEnabled && (
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>🎭 Public Alias</Text>
            <Text style={styles.statusValue}>Active</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>🔐 Private Vault</Text>
            <Text style={styles.statusValue}>Secured</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>🛡️ ZK Protection</Text>
            <Text style={styles.statusValue}>Enabled</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  infoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: colors.gray600,
    fontSize: 12,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    color: colors.gray600,
    marginBottom: 4,
  },
  privacyScore: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  toggleContainer: {
    alignItems: 'flex-end',
  },
  statusContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.gray600,
  },
  statusValue: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
});

export default PrivacyToggle;
