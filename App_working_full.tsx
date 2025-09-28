// No shim import - avoid slice errors
import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Animated, BackHandler, Alert, Text } from 'react-native';
import { WalletProvider, useWallet } from './src/context/WalletContext';
import { PrivacyWalletProvider } from './src/context/PrivacyWalletContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import SecurityManager from './src/utils/securityManager';
import { getSecureValue } from './src/utils/storageHelpers';

console.log('🚀 Full CYPHER Wallet App.tsx loaded');
console.log('✅ CYPHER Wallet with full UI and privacy features');

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
          <Text style={errorStyles.message}>Loading components...</Text>
          <Text style={errorStyles.subMessage}>
            {this.state.error?.message || 'Please wait'}
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

// Screen components - dynamic loading to handle missing files
let components: any = {};

// Load components dynamically with error handling
const loadComponents = () => {
  try {
    components.OnboardingScreen = require('./src/screens/Onboarding/OnboardingScreen').default;
    components.HomeNew = require('./src/screens/Home/HomeNew').default;
    components.SendScreen = require('./src/screens/Send/SendScreen').default;
    components.ReceiveScreen = require('./src/screens/Receive/ReceiveScreen').default;
    components.SwapScreenCypher = require('./src/screens/Swap/SwapScreenCypher').default;
    components.TransactionsScreen = require('./src/screens/Transactions/TransactionsScreen').default;
    components.SettingsScreen = require('./src/screens/Settings/SettingsScreen').default;
    components.SecuritySettings = require('./src/screens/Settings/SecuritySettings').default;
    components.ChangePasswordScreen = require('./src/screens/Settings/ChangePasswordScreen').default;
    components.AuthenticationScreen = require('./src/screens/Auth/AuthenticationScreen').default;
    components.CreateWalletScreen = require('./src/screens/Onboarding/CreateWallet').default;
    components.BottomNavigation = require('./src/components/BottomNavigation').default;
    components.SimpleStartupAnimation = require('./src/components/SimpleStartupAnimation').default;
    
    console.log('✅ Core wallet components loaded successfully');
  } catch (error) {
    console.warn('❌ Some wallet components failed to load:', error);
  }
};

// Load components immediately
loadComponents();

type Screen = 'home' | 'send' | 'receive' | 'swap' | 'transactions' | 'settings' | 'Send' | 'Receive' | 'Swap' | 'Transactions' | 'Settings' | 'Security' | 'SecuritySettings' | 'ChangePassword' | 'auth' | 'Authentication' | 'onboarding' | 'CreateWallet' | 'ImportWallet' | 'Home';

function AppContent() {
  const { state, authenticateWithBiometrics, unlockWallet } = useWallet();
  const { colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [showStartupAnimation, setShowStartupAnimation] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastActiveScreen, setLastActiveScreen] = useState<Screen>('home');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Debug wallet state changes
  useEffect(() => {
    console.log('🔍 Wallet state debug:', {
      isInitialized: state.isInitialized,
      isUnlocked: state.isUnlocked,
      hasCurrentAccount: !!state.currentAccount,
      currentScreen: currentScreen,
    });
  }, [state.isInitialized, state.isUnlocked, state.currentAccount, currentScreen]);

  const handleNavigation = (screen: string, params?: any) => {
    console.log('🧭 Navigation requested:', screen);
    setCurrentScreen(screen as Screen);
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
        if (state.isInitialized && state.isUnlocked) {
          setCurrentScreen('home');
        } else if (state.isInitialized && !state.isUnlocked) {
          setCurrentScreen('auth');
        } else {
          setCurrentScreen('onboarding');
        }
        return true;
      }
    });

    return () => backHandler.remove();
  }, [currentScreen, state.isInitialized, state.isUnlocked]);

  const handleStartupComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowStartupAnimation(false);
    });
  };

  // Handle initial screen based on wallet state
  useEffect(() => {
    const determineInitialScreen = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isInitializing) {
          if (state.isInitialized && state.isUnlocked && state.currentAccount) {
            console.log('✅ Wallet ready: showing home');
            setCurrentScreen('home');
          } else if (state.isInitialized && !state.isUnlocked) {
            console.log('🔐 Wallet locked: showing auth');
            setCurrentScreen('auth');
          } else {
            console.log('📝 No wallet: showing onboarding');
            setCurrentScreen('onboarding');
          }
          setIsInitializing(false);
        }
      } catch (error) {
        console.error('Error determining initial screen:', error);
        setCurrentScreen('onboarding');
        setIsInitializing(false);
      }
    };

    if (isInitializing) {
      determineInitialScreen();
    }
  }, [state.isInitialized, state.isUnlocked, state.currentAccount, isInitializing]);

  // Handle wallet state changes
  useEffect(() => {
    if (!isInitializing && !showStartupAnimation) {
      if (state.isInitialized && state.isUnlocked && state.currentAccount && currentScreen === 'auth') {
        console.log('✅ Authentication successful - redirecting to:', lastActiveScreen);
        setCurrentScreen(lastActiveScreen);
      } else if (state.isInitialized && !state.isUnlocked && 
                 ['home', 'send', 'receive', 'swap', 'transactions', 'settings'].includes(currentScreen)) {
        console.log('🔐 Wallet locked - redirecting to auth');
        setLastActiveScreen(currentScreen);
        setCurrentScreen('auth');
      }
    }
  }, [state.isInitialized, state.isUnlocked, state.currentAccount?.address, currentScreen]);

  // Show startup animation for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleStartupComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const renderScreen = () => {
    const { OnboardingScreen, CreateWalletScreen, HomeNew, SendScreen, ReceiveScreen, 
            SwapScreenCypher, TransactionsScreen, SettingsScreen, SecuritySettings,
            ChangePasswordScreen, AuthenticationScreen, BottomNavigation } = components;

    console.log('🖥️ Rendering screen:', currentScreen);

    switch (currentScreen) {
      case 'onboarding':
        return OnboardingScreen ? <OnboardingScreen onNavigate={handleNavigation} /> : 
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading...</Text></View>;
      
      case 'CreateWallet':
        return CreateWalletScreen ? <CreateWalletScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading...</Text></View>;
      
      case 'ImportWallet':
        return CreateWalletScreen ? <CreateWalletScreen onNavigate={handleNavigation} initialMode="import" /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading...</Text></View>;
      
      case 'Home':
      case 'home':
        return HomeNew ? <HomeNew onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Home...</Text></View>;
      
      case 'auth':
      case 'Authentication':
        if (state.isInitialized && state.isUnlocked && state.currentAccount) {
          setCurrentScreen(lastActiveScreen);
          return <View style={styles.fallback}><Text style={styles.fallbackText}>Redirecting...</Text></View>;
        }
        return AuthenticationScreen ? 
          <AuthenticationScreen
            mode="login"
            onAuthSuccess={async () => {
              console.log('🔓 Authentication successful');
              try {
                const securityManager = SecurityManager.getInstance();
                let storedPassword: string | null = null;
                
                try {
                  storedPassword = await getSecureValue('biometric_password');
                } catch (error) {
                  console.warn('No biometric password found:', error);
                }
                
                let success = false;
                if (storedPassword) {
                  success = await unlockWallet(storedPassword);
                } else {
                  success = await authenticateWithBiometrics();
                }
                
                if (success) {
                  console.log('✅ Wallet unlocked successfully');
                  setCurrentScreen(lastActiveScreen);
                }
              } catch (error) {
                console.error('❌ Error during wallet unlock:', error);
              }
            }}
          /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Auth...</Text></View>;
      
      case 'send':
      case 'Send':
        return SendScreen ? <SendScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Send...</Text></View>;
      
      case 'receive':
      case 'Receive':
        return ReceiveScreen ? <ReceiveScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Receive...</Text></View>;
      
      case 'swap':
      case 'Swap':
        return SwapScreenCypher ? <SwapScreenCypher onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Swap...</Text></View>;
      
      case 'transactions':
      case 'Transactions':
        return TransactionsScreen ? <TransactionsScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Transactions...</Text></View>;
      
      case 'settings':
      case 'Settings':
        return SettingsScreen ? <SettingsScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Settings...</Text></View>;
      
      case 'Security':
      case 'SecuritySettings':
        return SecuritySettings ? <SecuritySettings onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Security...</Text></View>;
      
      case 'ChangePassword':
        return ChangePasswordScreen ? <ChangePasswordScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading...</Text></View>;
      
      default:
        return OnboardingScreen ? <OnboardingScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Default...</Text></View>;
    }
  };

  if (showStartupAnimation && components.SimpleStartupAnimation) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <components.SimpleStartupAnimation onComplete={handleStartupComplete} />
      </Animated.View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#1a1a1a' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors?.primary || '#1a1a1a'} />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      {/* Show bottom navigation for main screens when wallet is unlocked */}
      {state.isInitialized && state.isUnlocked && ['home', 'send', 'receive', 'swap', 'settings'].includes(currentScreen) && components.BottomNavigation && (
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
        <WalletProvider>
          <PrivacyWalletProvider>
            <AppContent />
          </PrivacyWalletProvider>
        </WalletProvider>
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
