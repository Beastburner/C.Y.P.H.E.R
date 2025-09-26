/**
 * Bottom Navigation Component
 * Beautiful bottom navigation with all main features
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons'; // Temporarily disabled
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: '🏠', screen: 'home' },
  { id: 'defi', label: 'DeFi', icon: '🏦', screen: 'DeFiDashboard' },
  { id: 'nft', label: 'NFTs', icon: '🎨', screen: 'NFTScreen' },
  { id: 'browser', label: 'Browser', icon: '🌐', screen: 'Browser' },
  { id: 'settings', label: 'Settings', icon: '⚙️', screen: 'settings' },
];

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const { colors, spacing, fontSize, fontWeight, borderRadius, shadows } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.backgroundSecondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      ...shadows.large,
    },
    tabsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.md,
      minWidth: (width - spacing.md * 2) / TABS.length,
    },
    activeTab: {
      backgroundColor: colors.primary + '20',
    },
    tabIcon: {
      marginBottom: spacing.xs,
    },
    tabLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
    },
    activeTabLabel: {
      color: colors.primary,
      fontWeight: fontWeight.semibold,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id || activeTab === tab.screen;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.screen)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.tabIcon,
                  { 
                    fontSize: 22,
                    color: isActive ? colors.primary : colors.textSecondary,
                  }
                ]}
              >
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNavigation;
