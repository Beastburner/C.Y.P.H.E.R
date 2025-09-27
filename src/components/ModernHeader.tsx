import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernTypography } from '../styles/ModernTheme';
import { CypherLogo } from './CypherLogo';

interface ModernHeaderProps {
  title: string;
  subtitle?: string;
  isPrivateMode?: boolean;
  isConnected?: boolean;
  notifications?: number;
  onPrivacyToggle?: () => void;
  onSettingsPress?: () => void;
  onNotificationPress?: () => void;
  rightActions?: React.ReactNode;
  showConnectionStatus?: boolean;
  showPrivacyToggle?: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  isPrivateMode = false,
  isConnected = true,
  notifications = 0,
  onPrivacyToggle,
  onSettingsPress,
  onNotificationPress,
  rightActions,
  showConnectionStatus = true,
  showPrivacyToggle = true,
}) => {
  const gradientColors = isPrivateMode 
    ? ModernColors.privateMode.background 
    : ModernColors.publicMode.background;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        {/* Left side - Logo and title */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <CypherLogo 
              size="small" 
              variant="logo-only" 
              color="light"
              style={styles.logo}
            />
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            {showConnectionStatus && (
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: isConnected ? ModernColors.success : ModernColors.error }
                ]} />
                <Text style={styles.statusText}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            )}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>

        {/* Right side - Actions */}
        <View style={styles.rightSection}>
          {rightActions || (
            <>
              {onNotificationPress && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onNotificationPress}
                  activeOpacity={0.7}
                >
                  <Icon name="bell" size={20} color="#ffffff" />
                  {notifications > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationText}>
                        {notifications > 99 ? '99+' : notifications}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              
              {onSettingsPress && (
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onSettingsPress}
                  activeOpacity={0.7}
                >
                  <Icon name="settings" size={20} color="#ffffff" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Privacy mode toggle */}
      {showPrivacyToggle && onPrivacyToggle && (
        <View style={styles.privacySection}>
          <View style={styles.privacyInfo}>
            <Text style={styles.privacyLabel}>Mode:</Text>
            <TouchableOpacity
              style={[
                styles.privacyToggle,
                isPrivateMode ? styles.privacyToggleActive : styles.privacyToggleInactive
              ]}
              onPress={onPrivacyToggle}
              activeOpacity={0.8}
            >
              <Icon 
                name={isPrivateMode ? "lock" : "unlock"} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.privacyToggleText}>
                {isPrivateMode ? 'Private' : 'Public'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 60, // Account for status bar
    paddingBottom: ModernSpacing.xl,
    paddingHorizontal: ModernSpacing.xl,
    borderBottomLeftRadius: ModernBorderRadius.xxl,
    borderBottomRightRadius: ModernBorderRadius.xxl,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ModernSpacing.lg,
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  logoContainer: {
    marginRight: ModernSpacing.md,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleSection: {
    flex: 1,
  },

  title: {
    ...ModernTypography.h2,
    color: '#ffffff',
    fontWeight: '700',
  },

  subtitle: {
    ...ModernTypography.bodyMedium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: ModernSpacing.sm,
  },

  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ModernSpacing.sm,
    position: 'relative',
  },

  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: ModernColors.error,
    borderRadius: ModernBorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  notificationText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },

  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  privacyLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    marginRight: ModernSpacing.md,
  },

  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  privacyToggleActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)', // violet with opacity
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  privacyToggleInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  privacyToggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: ModernSpacing.sm,
  },
});

export default ModernHeader;
