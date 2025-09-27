import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { privacyEnabledWallet } from '../../services/PrivacyEnabledWallet';
import { NavyTheme } from '../../styles/themes';

// Theme setup
const colors = {
  primary: NavyTheme.colors.primary,
  white: NavyTheme.colors.surface,
  text: NavyTheme.colors.textPrimary,
  textSecondary: NavyTheme.colors.textSecondary,
  gray200: NavyTheme.colors.surfaceSecondary,
  gray300: NavyTheme.colors.surfaceTertiary,
  gray500: NavyTheme.colors.textTertiary,
  success: NavyTheme.colors.success,
  warning: NavyTheme.colors.warning,
  error: NavyTheme.colors.error,
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

interface RoutingPreference {
  defaultRouting: 'auto' | 'public_only' | 'private_only';
  acceptsPrivatePayments: boolean;
  minPrivateAmount: number;
  maxPrivateAmount: number;
  autoShieldLargeAmounts: boolean;
  shieldThreshold: number;
}

interface RoutingPreferencesProps {
  onPreferencesChange?: (preferences: RoutingPreference) => void;
  initialPreferences?: Partial<RoutingPreference>;
}

/**
 * Routing Preferences Component
 * Allows users to configure transaction routing behavior
 */
export const RoutingPreferences: React.FC<RoutingPreferencesProps> = ({
  onPreferencesChange,
  initialPreferences = {},
}) => {
  const [preferences, setPreferences] = useState<RoutingPreference>({
    defaultRouting: 'auto',
    acceptsPrivatePayments: false,
    minPrivateAmount: 0.001,
    maxPrivateAmount: 10.0,
    autoShieldLargeAmounts: true,
    shieldThreshold: 1.0,
    ...initialPreferences,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentPreferences();
  }, []);

  const loadCurrentPreferences = async () => {
    try {
      // In production, this would load from the privacy service
      console.log('Loading current routing preferences...');
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update privacy preferences through the wallet
      await privacyEnabledWallet.updatePrivacyPreferences({
        acceptsPrivatePayments: preferences.acceptsPrivatePayments,
        minPrivateAmount: preferences.minPrivateAmount,
        maxPrivateAmount: preferences.maxPrivateAmount,
      });

      onPreferencesChange?.(preferences);
      Alert.alert('Success', 'Routing preferences updated successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = <K extends keyof RoutingPreference>(
    key: K,
    value: RoutingPreference[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔀 Privacy & Routing Preferences</Text>
        <Text style={styles.subtitle}>
          Configure how your transactions are automatically routed
        </Text>
      </View>

      {/* Default Routing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Transaction Routing</Text>
        
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              preferences.defaultRouting === 'auto' && styles.radioOptionSelected
            ]}
            onPress={() => updatePreference('defaultRouting', 'auto')}
          >
            <View style={[
              styles.radioCircle,
              preferences.defaultRouting === 'auto' && styles.radioCircleSelected
            ]} />
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>🤖 Automatic (Recommended)</Text>
              <Text style={styles.radioDescription}>
                Automatically chooses optimal privacy level based on recipient preferences
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              preferences.defaultRouting === 'public_only' && styles.radioOptionSelected
            ]}
            onPress={() => updatePreference('defaultRouting', 'public_only')}
          >
            <View style={[
              styles.radioCircle,
              preferences.defaultRouting === 'public_only' && styles.radioCircleSelected
            ]} />
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>👁️ Public Only</Text>
              <Text style={styles.radioDescription}>
                All transactions use standard public routing
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioOption,
              preferences.defaultRouting === 'private_only' && styles.radioOptionSelected
            ]}
            onPress={() => updatePreference('defaultRouting', 'private_only')}
          >
            <View style={[
              styles.radioCircle,
              preferences.defaultRouting === 'private_only' && styles.radioCircleSelected
            ]} />
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>🛡️ Private Only</Text>
              <Text style={styles.radioDescription}>
                Force all transactions through privacy pools
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incoming Private Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Incoming Private Payments</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>Accept Private Payments</Text>
            <Text style={styles.switchDescription}>
              Allow others to send you privacy-protected transactions
            </Text>
          </View>
          <Switch
            value={preferences.acceptsPrivatePayments}
            onValueChange={(value) => updatePreference('acceptsPrivatePayments', value)}
            trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
            thumbColor={preferences.acceptsPrivatePayments ? colors.primary : colors.gray500}
          />
        </View>

        {preferences.acceptsPrivatePayments && (
          <View style={styles.amountRange}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum Amount (ETH)</Text>
              <TextInput
                style={styles.input}
                value={preferences.minPrivateAmount.toString()}
                onChangeText={(text) => updatePreference('minPrivateAmount', parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                placeholder="0.001"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Maximum Amount (ETH)</Text>
              <TextInput
                style={styles.input}
                value={preferences.maxPrivateAmount.toString()}
                onChangeText={(text) => updatePreference('maxPrivateAmount', parseFloat(text) || 0)}
                keyboardType="decimal-pad"
                placeholder="10.0"
              />
            </View>
          </View>
        )}
      </View>

      {/* Auto-Shield Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Shield Settings</Text>
        
        <View style={styles.switchRow}>
          <View style={styles.switchContent}>
            <Text style={styles.switchLabel}>Auto-Shield Large Amounts</Text>
            <Text style={styles.switchDescription}>
              Automatically move large incoming amounts to privacy pools
            </Text>
          </View>
          <Switch
            value={preferences.autoShieldLargeAmounts}
            onValueChange={(value) => updatePreference('autoShieldLargeAmounts', value)}
            trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
            thumbColor={preferences.autoShieldLargeAmounts ? colors.primary : colors.gray500}
          />
        </View>

        {preferences.autoShieldLargeAmounts && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shield Threshold (ETH)</Text>
            <TextInput
              style={styles.input}
              value={preferences.shieldThreshold.toString()}
              onChangeText={(text) => updatePreference('shieldThreshold', parseFloat(text) || 0)}
              keyboardType="decimal-pad"
              placeholder="1.0"
            />
            <Text style={styles.inputHint}>
              Amounts above this threshold will be automatically shielded
            </Text>
          </View>
        )}
      </View>

      {/* Privacy Impact */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔒 Privacy Impact</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoHighlight}>Automatic routing</Text> provides optimal privacy with convenience
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoHighlight}>Private payments</Text> use ZK-SNARKs for transaction privacy
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoHighlight}>Auto-shielding</Text> protects large amounts automatically
        </Text>
        <Text style={styles.infoText}>
          • Higher privacy settings may increase transaction fees and processing time
        </Text>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>💾 Save Preferences</Text>
        )}
      </TouchableOpacity>
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
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
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
  radioGroup: {
    gap: spacing.sm,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.gray500,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioContent: {
    flex: 1,
  },
  radioLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  radioDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  switchContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchLabel: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  switchDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  amountRange: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.gray200,
    borderRadius: 8,
    padding: spacing.sm,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  inputHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  infoSection: {
    backgroundColor: colors.gray300,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  infoHighlight: {
    color: colors.primary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    ...typography.body,
    fontWeight: 'bold',
  },
});

export default RoutingPreferences;
