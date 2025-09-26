/**
 * CYPHER Wallet Main Navigation
 * Revolutionary multi-tab navigation with intelligent routing
 * Features: Cross-chain portfolio, Advanced Trading, AI Insights, Professional Analytics
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity } from 'react-native';
import CypherDesignSystem from '../styles/CypherDesignSystem';

// Import all CYPHER screens
import HomeNew from '../screens/Home/HomeNew';
import CrossChainDashboard from '../screens/CrossChain/CrossChainDashboard';
import TradingDashboard from '../screens/Trading/TradingDashboard';
import PortfolioStrategyManager from '../screens/Trading/PortfolioStrategyManager';
import BridgeInterface from '../screens/CrossChain/BridgeInterface';
import AIInsightsDashboard from '../screens/AI/AIInsightsDashboard';
import AnalyticsDashboard from '../screens/Analytics/AnalyticsDashboard';
import NFTScreen from '../screens/NFT/NFTScreen';
import SendScreen from '../screens/Send/SendScreen';
import ReceiveScreen from '../screens/Receive/ReceiveScreen';
import SwapScreenClean from '../screens/Swap/SwapScreenClean';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import NetworkSelector from '../screens/Settings/NetworkSelector';
import SecuritySettings from '../screens/Settings/SecuritySettings';
import BrowserScreen from '../screens/Browser/BrowserScreen';
import DAppBrowserScreen from '../screens/DApp/DAppBrowserScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Navigation wrapper components to handle props properly
const HomeWrapper = ({ navigation, route }: any) => (
  <HomeNew onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const AnalyticsWrapper = ({ navigation, route }: any) => (
  <AnalyticsDashboard onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const SendWrapper = ({ navigation, route }: any) => (
  <SendScreen onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const ReceiveWrapper = ({ navigation, route }: any) => (
  <ReceiveScreen onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const NetworkSelectorWrapper = ({ navigation, route }: any) => (
  <NetworkSelector onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const SettingsWrapper = ({ navigation, route }: any) => (
  <SettingsScreen onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const SecuritySettingsWrapper = ({ navigation, route }: any) => (
  <SecuritySettings onNavigate={(screen: string) => navigation.navigate(screen)} />
);

const BrowserWrapper = ({ navigation, route }: any) => (
  <BrowserScreen onNavigate={(screen: string) => navigation.navigate(screen)} />
);

// Custom Tab Bar Component
interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar = ({ state, descriptors, navigation }: TabBarProps) => {
  const { colors, spacing, typography } = CypherDesignSystem;

  const getTabIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? colors.primary : colors.textSecondary;
    
    switch (routeName) {
      case 'Portfolio':
        return { icon: '💼', color: iconColor };
      case 'Trading':
        return { icon: '📊', color: iconColor };
      case 'CrossChain':
        return { icon: '🌐', color: iconColor };
      case 'AI':
        return { icon: '🧠', color: iconColor };
      case 'More':
        return { icon: '⚙️', color: iconColor };
      default:
        return { icon: '•', color: iconColor };
    }
  };

  return (
    <View style={[styles.tabBar, { backgroundColor: colors.backgroundSecondary }]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;
        const { icon, color } = getTabIcon(route.name, isFocused);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={[
              styles.tabButton,
              {
                backgroundColor: isFocused ? colors.primaryLight : 'transparent',
                borderRadius: isFocused ? 12 : 0,
              }
            ]}
          >
            <Text style={[styles.tabIcon, { color }]}>{icon}</Text>
            <Text style={[
              styles.tabLabel,
              {
                color: isFocused ? colors.primary : colors.textSecondary,
                fontSize: typography.fontSize.xs,
                fontWeight: isFocused ? '700' : '500'
              }
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// Portfolio Stack Navigator
const PortfolioStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: CypherDesignSystem.colors.background }
    }}
  >
    <Stack.Screen name="PortfolioHome" component={HomeWrapper} />
    <Stack.Screen name="Analytics" component={AnalyticsWrapper} />
    <Stack.Screen name="NFT" component={NFTScreen} />
    <Stack.Screen name="Send" component={SendWrapper} />
    <Stack.Screen name="Receive" component={ReceiveWrapper} />
    <Stack.Screen name="Swap" component={SwapScreenClean} />
  </Stack.Navigator>
);

// Trading Stack Navigator
const TradingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: CypherDesignSystem.colors.background }
    }}
  >
    <Stack.Screen name="TradingMain" component={TradingDashboard} />
    <Stack.Screen name="PortfolioStrategy" component={PortfolioStrategyManager} />
    <Stack.Screen name="Analytics" component={AnalyticsWrapper} />
  </Stack.Navigator>
);

// Cross-Chain Stack Navigator
const CrossChainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: CypherDesignSystem.colors.background }
    }}
  >
    <Stack.Screen name="CrossChainMain" component={CrossChainDashboard} />
    <Stack.Screen name="Bridge" component={BridgeInterface} />
    <Stack.Screen name="NetworkSelector" component={NetworkSelectorWrapper} />
  </Stack.Navigator>
);

// AI Stack Navigator
const AIStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: CypherDesignSystem.colors.background }
    }}
  >
    <Stack.Screen name="AIMain" component={AIInsightsDashboard} />
    <Stack.Screen name="TradingDashboard" component={TradingDashboard} />
    <Stack.Screen name="PortfolioStrategyManager" component={PortfolioStrategyManager} />
    <Stack.Screen name="Analytics" component={AnalyticsWrapper} />
  </Stack.Navigator>
);

// More/Settings Stack Navigator
const MoreStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: CypherDesignSystem.colors.background }
    }}
  >
    <Stack.Screen name="Settings" component={SettingsWrapper} />
    <Stack.Screen name="NetworkSelector" component={NetworkSelectorWrapper} />
    <Stack.Screen name="SecuritySettings" component={SecuritySettingsWrapper} />
    <Stack.Screen name="Browser" component={BrowserWrapper} />
    <Stack.Screen name="DAppBrowser" component={DAppBrowserScreen} />
  </Stack.Navigator>
);

// Main Tab Navigator
const MainTabs = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen
      name="Portfolio"
      component={PortfolioStack}
      options={{
        tabBarLabel: 'Portfolio',
      }}
    />
    <Tab.Screen
      name="Trading"
      component={TradingStack}
      options={{
        tabBarLabel: 'Trading',
      }}
    />
    <Tab.Screen
      name="CrossChain"
      component={CrossChainStack}
      options={{
        tabBarLabel: 'Cross-Chain',
      }}
    />
    <Tab.Screen
      name="AI"
      component={AIStack}
      options={{
        tabBarLabel: 'AI Insights',
      }}
    />
    <Tab.Screen
      name="More"
      component={MoreStack}
      options={{
        tabBarLabel: 'More',
      }}
    />
  </Tab.Navigator>
);

// Root Navigator
export default function CypherNavigation() {
  const { colors } = CypherDesignSystem;

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.backgroundSecondary,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.warning,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background }
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        
        {/* Modal/Overlay screens */}
        <Stack.Screen
          name="TradingDashboard"
          component={TradingDashboard}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="PortfolioStrategyManager"
          component={PortfolioStrategyManager}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="BridgeInterface"
          component={BridgeInterface}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AIInsightsDashboard"
          component={AIInsightsDashboard}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="AnalyticsDashboard"
          component={AnalyticsWrapper}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="SwapScreenClean"
          component={SwapScreenClean}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="SendScreen"
          component={SendWrapper}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="ReceiveScreen"
          component={ReceiveWrapper}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = {
  tabBar: {
    flexDirection: 'row' as const,
    paddingHorizontal: CypherDesignSystem.spacing.sm,
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingBottom: 30, // Account for safe area
    borderTopWidth: 1,
    borderTopColor: CypherDesignSystem.colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: CypherDesignSystem.spacing.sm,
    paddingHorizontal: CypherDesignSystem.spacing.xs,
    marginHorizontal: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    textAlign: 'center' as const,
    lineHeight: 14,
  },
};
