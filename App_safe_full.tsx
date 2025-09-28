import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Animated, BackHandler, Alert, Text } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PrivacyWalletProvider } from './src/context/PrivacyWalletContext';

console.log('🚀 CYPHER Wallet App.tsx loaded');
console.log('✅ Full wallet functionality with privacy features');

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>CYPHER Wallet</Text>
          <Text style={errorStyles.message}>Something went wrong</Text>
          <Text style={errorStyles.subMessage}>
            {this.state.error?.message || 'Please restart the app'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

// Screen components - load them safely
let components: any = {};

const loadComponents = () => {
  try {
    // Core screens that should always work
    components.HomeNew = require('./src/screens/Home/HomeNew').default;
    components.BottomNavigation = require('./src/components/BottomNavigation').default;
    console.log('✅ Core components loaded');

    // Try to load other screens one by one
    try {
      components.SendScreen = require('./src/screens/Send/SendScreen').default;
      console.log('✅ Send screen loaded');
    } catch (e) { console.warn('Send screen failed to load:', e); }

    try {
      components.ReceiveScreen = require('./src/screens/Receive/ReceiveScreen').default;
      console.log('✅ Receive screen loaded');
    } catch (e) { console.warn('Receive screen failed to load:', e); }

    try {
      components.SwapScreenCypher = require('./src/screens/Swap/SwapScreenCypher').default;
      console.log('✅ Swap screen loaded');
    } catch (e) { console.warn('Swap screen failed to load:', e); }

    try {
      components.TransactionsScreen = require('./src/screens/Transactions/TransactionsScreen').default;
      console.log('✅ Transactions screen loaded');
    } catch (e) { console.warn('Transactions screen failed to load:', e); }

    try {
      components.SettingsScreen = require('./src/screens/Settings/SettingsScreen').default;
      console.log('✅ Settings screen loaded');
    } catch (e) { console.warn('Settings screen failed to load:', e); }

    // Optional screens
    try {
      components.OnboardingScreen = require('./src/screens/Onboarding/OnboardingScreen').default;
    } catch (e) { console.warn('Onboarding screen failed to load:', e); }

    try {
      components.CreateWalletScreen = require('./src/screens/Onboarding/CreateWallet').default;
    } catch (e) { console.warn('Create wallet screen failed to load:', e); }

    try {
      components.AuthenticationScreen = require('./src/screens/Auth/AuthenticationScreen').default;
    } catch (e) { console.warn('Auth screen failed to load:', e); }

    try {
      components.PrivacyScreen = require('./src/screens/Privacy/PrivacyScreen').default;
    } catch (e) { console.warn('Privacy screen failed to load:', e); }

    try {
      components.DeFiDashboard = require('./src/screens/DeFi/DeFiDashboard').default;
    } catch (e) { console.warn('DeFi screen failed to load:', e); }

    try {
      components.NFTScreen = require('./src/screens/NFT/NFTScreen').default;
    } catch (e) { console.warn('NFT screen failed to load:', e); }

    try {
      components.BrowserScreen = require('./src/screens/Browser/BrowserScreen').default;
    } catch (e) { console.warn('Browser screen failed to load:', e); }

  } catch (error) {
    console.error('❌ Critical error loading components:', error);
  }
};

// Load components
loadComponents();

type Screen = 'home' | 'send' | 'receive' | 'swap' | 'transactions' | 'settings' | 'privacy' | 'defi' | 'nft' | 'browser' | 'onboarding' | 'auth' | 'createWallet';

function AppContent() {
  const { colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isWalletReady, setIsWalletReady] = useState(true); // Mock wallet state for now

  const handleNavigation = (screen: string, params?: any) => {
    console.log('🧭 Navigation to:', screen);
    const validScreen = screen.toLowerCase() as Screen;
    setCurrentScreen(validScreen);
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'home') {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Exit', onPress: () => BackHandler.exitApp() }
          ]
        );
        return true;
      } else {
        setCurrentScreen('home');
        return true;
      }
    });

    return () => backHandler.remove();
  }, [currentScreen]);

  const renderScreen = () => {
    console.log('🖥️ Rendering screen:', currentScreen);

    const fallbackView = (screenName: string) => (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Loading {screenName}...</Text>
      </View>
    );

    switch (currentScreen) {
      case 'home':
        return components.HomeNew ? 
          <components.HomeNew onNavigate={handleNavigation} /> : 
          fallbackView('Home');

      case 'send':
        return components.SendScreen ? 
          <components.SendScreen onNavigate={handleNavigation} /> : 
          fallbackView('Send');

      case 'receive':
        return components.ReceiveScreen ? 
          <components.ReceiveScreen onNavigate={handleNavigation} /> : 
          fallbackView('Receive');

      case 'swap':
        return components.SwapScreenCypher ? 
          <components.SwapScreenCypher onNavigate={handleNavigation} /> : 
          fallbackView('Swap');

      case 'transactions':
        return components.TransactionsScreen ? 
          <components.TransactionsScreen onNavigate={handleNavigation} /> : 
          fallbackView('Transactions');

      case 'settings':
        return components.SettingsScreen ? 
          <components.SettingsScreen onNavigate={handleNavigation} /> : 
          fallbackView('Settings');

      case 'privacy':
        return components.PrivacyScreen ? 
          <components.PrivacyScreen 
            navigation={{ navigate: handleNavigation, goBack: () => handleNavigation('home') }} 
            route={{}} 
          /> : 
          fallbackView('Privacy');

      case 'defi':
        return components.DeFiDashboard ? 
          <components.DeFiDashboard onNavigate={handleNavigation} /> : 
          fallbackView('DeFi');

      case 'nft':
        return components.NFTScreen ? 
          <components.NFTScreen onNavigate={handleNavigation} /> : 
          fallbackView('NFT');

      case 'browser':
        return components.BrowserScreen ? 
          <components.BrowserScreen onNavigate={handleNavigation} /> : 
          fallbackView('Browser');

      case 'onboarding':
        return components.OnboardingScreen ? 
          <components.OnboardingScreen onNavigate={handleNavigation} /> : 
          fallbackView('Onboarding');

      case 'auth':
        return components.AuthenticationScreen ? 
          <components.AuthenticationScreen 
            mode="login"
            onAuthSuccess={() => handleNavigation('home')}
          /> : 
          fallbackView('Authentication');

      case 'createWallet':
        return components.CreateWalletScreen ? 
          <components.CreateWalletScreen onNavigate={handleNavigation} /> : 
          fallbackView('Create Wallet');

      default:
        return components.HomeNew ? 
          <components.HomeNew onNavigate={handleNavigation} /> : 
          fallbackView('Home');
    }
  };

  const showBottomNav = isWalletReady && ['home', 'send', 'receive', 'swap', 'transactions', 'settings', 'privacy', 'defi', 'nft', 'browser'].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#1a1a1a' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors?.primary || '#1a1a1a'} />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      
      {/* Bottom Navigation */}
      {showBottomNav && components.BottomNavigation && (
        <components.BottomNavigation 
          activeTab={currentScreen} 
          onTabPress={handleNavigation} 
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PrivacyWalletProvider>
          <AppContent />
        </PrivacyWalletProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  screenContainer: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  fallbackText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
