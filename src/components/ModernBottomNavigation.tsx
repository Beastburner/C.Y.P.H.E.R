import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface ModernBottomNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
  isPrivateMode?: boolean;
}

const ModernBottomNavigation: React.FC<ModernBottomNavigationProps> = ({
  tabs,
  activeTab,
  onTabPress,
  isPrivateMode = false,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradientBackground}
      />
      
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.id)}
              activeOpacity={0.7}
            >
              {/* Active tab background */}
              {isActive && (
                <LinearGradient
                  colors={
                    isPrivateMode 
                      ? ['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.05)']
                      : ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.activeBackground}
                />
              )}

              {/* Icon with badge */}
              <View style={styles.iconContainer}>
                <Icon
                  name={tab.icon}
                  size={22}
                  color={isActive 
                    ? (isPrivateMode ? ModernColors.privacy.enhanced : ModernColors.info)
                    : ModernColors.textTertiary
                  }
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={[
                    styles.badge,
                    { backgroundColor: isActive 
                      ? (isPrivateMode ? ModernColors.privacy.enhanced : ModernColors.info)
                      : ModernColors.error
                    }
                  ]}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 99 ? '99+' : tab.badge.toString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Label */}
              <Text style={[
                styles.tabLabel,
                {
                  color: isActive 
                    ? (isPrivateMode ? ModernColors.privacy.enhanced : ModernColors.info)
                    : ModernColors.textTertiary,
                  fontWeight: isActive ? '600' : '400',
                }
              ]}>
                {tab.label}
              </Text>

              {/* Active indicator dot */}
              {isActive && (
                <View style={[
                  styles.activeDot,
                  {
                    backgroundColor: isPrivateMode 
                      ? ModernColors.privacy.enhanced 
                      : ModernColors.info
                  }
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Privacy mode indicator */}
      {isPrivateMode && (
        <View style={styles.privacyModeIndicator}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privacyGradient}
          />
          <View style={styles.privacyContent}>
            <Icon name="shield" size={12} color={ModernColors.privacy.enhanced} />
            <Text style={styles.privacyText}>Private Mode</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },

  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: ModernBorderRadius.xxl,
    borderTopRightRadius: ModernBorderRadius.xxl,
  },

  tabContainer: {
    flexDirection: 'row',
    paddingTop: ModernSpacing.md,
    paddingBottom: ModernSpacing.xl,
    paddingHorizontal: ModernSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    borderTopLeftRadius: ModernBorderRadius.xxl,
    borderTopRightRadius: ModernBorderRadius.xxl,
    ...ModernShadows.large,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ModernSpacing.sm,
    paddingHorizontal: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.md,
    position: 'relative',
    overflow: 'hidden',
  },

  activeTab: {
    // Additional styles for active tab if needed
  },

  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: ModernBorderRadius.md,
  },

  iconContainer: {
    position: 'relative',
    marginBottom: ModernSpacing.xs,
  },

  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: ModernBorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },

  tabLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: ModernSpacing.xs,
  },

  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 2,
  },

  privacyModeIndicator: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -50 }],
    borderRadius: ModernBorderRadius.full,
    overflow: 'hidden',
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.xs,
    ...ModernShadows.small,
  },

  privacyGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  privacyText: {
    fontSize: 10,
    fontWeight: '600',
    color: ModernColors.privacy.enhanced,
    marginLeft: ModernSpacing.xs,
  },
});

export default ModernBottomNavigation;
