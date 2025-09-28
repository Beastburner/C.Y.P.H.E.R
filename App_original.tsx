// import './shim'; // Temporarily disabled to isolate issue
import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Animated, BackHandler, Alert, Text } from 'react-native';
// import { WalletProvider, useWallet } from './src/context/WalletContext'; // Temporarily disabled
// import { PrivacyWalletProvider } from './src/context/PrivacyWalletContext'; // Temporarily disabled
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import SecurityManager from './src/utils/securityManager';
import { getSecureValue } from './src/utils/storageHelpers';

console.log('🚀 App.tsx loaded - starting CYPHER Wallet with polyfills');

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
    components.TransactionDebugger = require('./src/components/debugging/AdvancedTransactionDebugger').default;
    components.NetworkTroubleshooter = require('./src/components/debugging/SimpleNetworkTroubleshooter').default;
    
    // DeFi components
    try {
      components.DeFiDashboard = require('./src/screens/DeFi/DeFiDashboard').default;
      components.YieldFarmingScreen = require('./src/screens/DeFi/YieldFarmingScreen').default;
      components.StakingScreen = require('./src/screens/DeFi/StakingScreen').default;
    } catch (error) {
      console.warn('DeFi components failed to load:', error);
    }

    // NFT components
    try {
      components.NFTScreen = require('./src/screens/NFT/NFTScreen').default;
    } catch (error) {
      console.warn('NFT components failed to load:', error);
    }

    // Optional components
    try {
      components.QRScannerScreen = require('./src/screens/Scanner/QRScannerScreen').default;
      components.PrivacyScreen = require('./src/screens/Privacy/PrivacyScreen').default;
      components.TokenDetailScreen = require('./src/screens/TokenDetail/TokenDetailScreen').default;
      components.WalletStatusScreen = require('./src/screens/Debug/WalletStatusScreen').default;
      components.BiometricTestScreen = require('./src/screens/Debug/BiometricTestScreen').default;
      components.BiometricDebugScreen = require('./src/screens/Debug/BiometricDebugScreen').default;
      components.TokenManagementScreen = require('./src/screens/TokenManagement/TokenManagementScreen').default;
      components.BrowserScreen = require('./src/screens/Browser/BrowserScreen').default;
    } catch (error) {
      console.warn('Some optional components failed to load:', error);
    }
    
    console.log('✅ All core components loaded successfully');
  } catch (error) {
    console.error('❌ Error loading wallet components:', error);
  }
};

// Load components immediately
loadComponents();

type Screen = 'home' | 'send' | 'receive' | 'swap' | 'transactions' | 'settings' | 'Send' | 'Receive' | 'Swap' | 'Transactions' | 'Settings' | 'Security' | 'SecuritySettings' | 'ChangePassword' | 'auth' | 'Authentication' | 'onboarding' | 'CreateWallet' | 'ImportWallet' | 'Home' | 'MultiWalletHome' | 'WalletManagement' | 'EnhancedAuth' | 'BackupRecovery' | 'browser' | 'Browser' | 'NFT' | 'NFTScreen' | 'DApp' | 'DeFi' | 'defi' | 'DeFiDashboard' | 'YieldFarmingScreen' | 'YieldFarming' | 'StakingScreen' | 'Staking' | 'Status' | 'Debug' | 'TokenManagement' | 'BiometricTest' | 'BiometricDebug' | 'QRScanner' | 'Privacy' | 'TokenDetail' | 'TransactionDebugger' | 'NetworkTroubleshooter';

function AppContent() {
  const { state, authenticateWithBiometrics, unlockWallet } = useWallet();
  const { colors } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [showStartupAnimation, setShowStartupAnimation] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastActiveScreen, setLastActiveScreen] = useState<Screen>('home'); // Store the last screen before auth
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Debug wallet state changes
  useEffect(() => {
    console.log('🔍 Wallet state debug:', {
      isInitialized: state.isInitialized,
      isUnlocked: state.isUnlocked,
      hasCurrentAccount: !!state.currentAccount,
      currentAccountAddress: state.currentAccount?.address,
      currentScreen: currentScreen,
      showStartupAnimation: showStartupAnimation,
      isInitializing: isInitializing
    });
  }, [state.isInitialized, state.isUnlocked, state.currentAccount, currentScreen, showStartupAnimation, isInitializing]);

  const handleNavigation = (screen: string, params?: any) => {
    console.log('🧭 Navigation requested:', {
      from: currentScreen,
      to: screen,
      walletState: {
        isInitialized: state.isInitialized,
        isUnlocked: state.isUnlocked,
        hasAccount: !!state.currentAccount
      }
    });

    // Check if wallet is required for certain screens
    const protectedScreens = ['send', 'receive', 'swap', 'transactions', 'settings', 'defi', 'defidashboard', 'yieldfarmingscreen', 'stakingscreen', 'nftscreen', 'nft'];
    
    if (protectedScreens.includes(screen.toLowerCase())) {
      if (!state.isInitialized) {
        console.log('⚠️ Navigation blocked: Wallet not initialized, redirecting to onboarding');
        setCurrentScreen('onboarding');
        return;
      }
      if (!state.isUnlocked) {
        console.log('⚠️ Navigation blocked: Wallet locked, redirecting to auth');
        setCurrentScreen('auth');
        return;
      }
    }

    console.log('✅ Navigation allowed - setting screen to:', screen);
    setCurrentScreen(screen as Screen);
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('Back button pressed on screen:', currentScreen);
      
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
      } else if (currentScreen === 'onboarding') {
        if (!state.isInitialized) {
          BackHandler.exitApp();
        } else {
          if (state.isUnlocked) {
            setCurrentScreen('home');
          } else {
            setCurrentScreen('auth');
          }
        }
        return true;
      } else if (currentScreen === 'auth') {
        if (state.isInitialized) {
          Alert.alert(
            'Authentication Required',
            'Please authenticate to continue or use biometric authentication.',
            [{ text: 'OK' }]
          );
          return true;
        } else {
          setCurrentScreen('onboarding');
          return true;
        }
      }
      
      // Default navigation for other screens
      if (state.isInitialized && state.isUnlocked) {
        setCurrentScreen('home');
        return true;
      } else if (state.isInitialized && !state.isUnlocked) {
        setCurrentScreen('auth');
        return true;
      } else {
        setCurrentScreen('onboarding');
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
        
        console.log('Determining initial screen. Wallet state:', {
          isInitialized: state.isInitialized,
          isUnlocked: state.isUnlocked,
          hasCurrentAccount: !!state.currentAccount,
          currentScreen: currentScreen,
        });

        // Determine initial screen based on wallet state
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

  // Handle critical wallet state changes only (reset/lock/unlock)
  useEffect(() => {
    // Only handle state changes AFTER initialization is complete
    if (!isInitializing && !showStartupAnimation) {
      console.log('Wallet state changed after initialization:', {
        isInitialized: state.isInitialized,
        isUnlocked: state.isUnlocked,
        hasCurrentAccount: !!state.currentAccount,
        currentScreen: currentScreen,
      });

      // 1. Wallet was completely reset while user is on main screens
      if (!state.isInitialized && !state.currentAccount && 
          ['home', 'send', 'receive', 'swap', 'transactions', 'settings', 'NFTScreen', 'DeFi', 'DeFiDashboard', 'Browser'].includes(currentScreen)) {
        console.log('🔄 Wallet was reset - redirecting to onboarding');
        setCurrentScreen('onboarding');
      }
      // 2. User successfully authenticated and is still on auth screen
      else if (state.isInitialized && state.isUnlocked && state.currentAccount && 
               (currentScreen === 'auth' || currentScreen === 'Authentication')) {
        console.log('✅ Authentication successful - redirecting to:', lastActiveScreen);
        setCurrentScreen(lastActiveScreen); // Return to the screen they were on before
      }
      // 3. Wallet got locked while user is on any main screen
      else if (state.isInitialized && !state.isUnlocked && 
               ['home', 'send', 'receive', 'swap', 'transactions', 'settings', 'NFTScreen', 'DeFi', 'DeFiDashboard', 'Browser', 'YieldFarmingScreen', 'StakingScreen'].includes(currentScreen) && 
               state.currentAccount) {
        console.log('🔐 Wallet locked on screen:', currentScreen, '- redirecting to auth');
        setLastActiveScreen(currentScreen); // Remember the screen we're leaving
        setCurrentScreen('auth');
      }
      // 4. Edge case: User navigated to auth/Authentication but wallet is already unlocked
      else if (state.isInitialized && state.isUnlocked && state.currentAccount && 
               (currentScreen === 'auth' || currentScreen === 'Authentication') && 
               !showStartupAnimation) {
        console.log('⚡ Wallet already unlocked, unnecessary auth screen - redirecting to home');
        setCurrentScreen('home');
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
            ChangePasswordScreen, AuthenticationScreen, QRScannerScreen, PrivacyScreen,
            TokenDetailScreen, TokenManagementScreen, BiometricTestScreen, BiometricDebugScreen,
            WalletStatusScreen, BrowserScreen, DeFiDashboard, YieldFarmingScreen, StakingScreen, 
            NFTScreen, TransactionDebugger, NetworkTroubleshooter, BottomNavigation } = components;

    // Add debug info to each screen
    console.log('🖥️ Rendering screen:', currentScreen, 'with wallet state:', {
      isInitialized: state.isInitialized,
      isUnlocked: state.isUnlocked,
      hasAccount: !!state.currentAccount
    });

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
        // If wallet is already unlocked, redirect immediately
        if (state.isInitialized && state.isUnlocked && state.currentAccount) {
          console.log('🔄 Already authenticated, redirecting to:', lastActiveScreen);
          setCurrentScreen(lastActiveScreen);
          return <View style={styles.fallback}><Text style={styles.fallbackText}>Redirecting...</Text></View>;
        }
        return AuthenticationScreen ? 
          <AuthenticationScreen
            mode="login"
            onAuthSuccess={async () => {
              console.log('🔓 Authentication successful, unlocking wallet...');
              try {
                // Since biometric authentication succeeded, we need to unlock the wallet
                // First try to get the stored biometric password
                const securityManager = SecurityManager.getInstance();
                let storedPassword: string | null = null;
                
                try {
                  storedPassword = await getSecureValue('biometric_password');
                } catch (error) {
                  console.warn('No biometric password found:', error);
                }
                
                let success = false;
                if (storedPassword) {
                  // Use stored password to unlock
                  success = await unlockWallet(storedPassword);
                } else {
                  // Try the biometric authentication method as fallback
                  success = await authenticateWithBiometrics();
                }
                
                if (success) {
                  console.log('✅ Wallet unlocked successfully, navigating to:', lastActiveScreen);
                  setCurrentScreen(lastActiveScreen);
                } else {
                  console.error('❌ Failed to unlock wallet after authentication');
                }
              } catch (error) {
                console.error('❌ Error during wallet unlock:', error);
              }
            }}
          /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Auth...</Text></View>;
      
      case 'send':
      case 'Send':
        console.log('📤 Rendering Send screen');
        return SendScreen ? <SendScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Send...</Text></View>;
      
      case 'receive':
      case 'Receive':
        console.log('📥 Rendering Receive screen');
        return ReceiveScreen ? <ReceiveScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Receive...</Text></View>;
      
      case 'swap':
      case 'Swap':
        console.log('🔄 Rendering Swap screen');
        return SwapScreenCypher ? <SwapScreenCypher onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Swap...</Text></View>;
      
      case 'transactions':
      case 'Transactions':
        console.log('📊 Rendering Transactions screen');
        return TransactionsScreen ? <TransactionsScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Transactions...</Text></View>;
      
      case 'settings':
      case 'Settings':
        console.log('⚙️ Rendering Settings screen');
        return SettingsScreen ? <SettingsScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Settings...</Text></View>;
      
      case 'Security':
      case 'SecuritySettings':
        return SecuritySettings ? <SecuritySettings onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Security...</Text></View>;
      
      case 'ChangePassword':
        return ChangePasswordScreen ? <ChangePasswordScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading...</Text></View>;
      
      case 'QRScanner':
        return QRScannerScreen ? <QRScannerScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Scanner...</Text></View>;
      
      case 'Privacy':
        return PrivacyScreen ? <PrivacyScreen navigation={{ navigate: handleNavigation, goBack: () => handleNavigation('home') }} route={{}} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Privacy...</Text></View>;
      
      case 'TokenDetail':
        return TokenDetailScreen ? <TokenDetailScreen onNavigate={handleNavigation} navigation={{ navigate: handleNavigation, goBack: () => handleNavigation('home') }} route={{}} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Token Detail...</Text></View>;
      
      case 'TokenManagement':
        return TokenManagementScreen ? <TokenManagementScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Token Management...</Text></View>;
      
      case 'BiometricTest':
        return BiometricTestScreen ? <BiometricTestScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Biometric Test...</Text></View>;
      
      case 'BiometricDebug':
        return BiometricDebugScreen ? <BiometricDebugScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Biometric Debug...</Text></View>;
      
      case 'TransactionDebugger':
        return TransactionDebugger ? <TransactionDebugger onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Transaction Debugger...</Text></View>;
      
      case 'NetworkTroubleshooter':
        return NetworkTroubleshooter ? <NetworkTroubleshooter onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Network Troubleshooter...</Text></View>;
      
      case 'Status':
        return WalletStatusScreen ? <WalletStatusScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Status...</Text></View>;
      
      case 'Browser':
      case 'browser':
        console.log('🌐 Rendering Browser screen');
        return BrowserScreen ? <BrowserScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Browser...</Text></View>;
      
      case 'DeFi':
      case 'defi':
      case 'DeFiDashboard':
        console.log('🏦 Rendering DeFi Dashboard screen');
        return DeFiDashboard ? <DeFiDashboard onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading DeFi Dashboard...</Text></View>;
      
      case 'YieldFarmingScreen':
      case 'YieldFarming':
        console.log('🌾 Rendering Yield Farming screen');
        return YieldFarmingScreen ? <YieldFarmingScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Yield Farming...</Text></View>;
      
      case 'StakingScreen':
      case 'Staking':
        console.log('💰 Rendering Staking screen');
        return StakingScreen ? <StakingScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading Staking...</Text></View>;
      
      case 'NFTScreen':
      case 'NFT':
        console.log('🎨 Rendering NFT screen');
        return NFTScreen ? <NFTScreen onNavigate={handleNavigation} /> :
          <View style={styles.fallback}><Text style={styles.fallbackText}>Loading NFT...</Text></View>;
      
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
      {state.isInitialized && state.isUnlocked && ['home', 'send', 'receive', 'swap', 'browser', 'settings', 'DeFi', 'DeFiDashboard', 'NFTScreen', 'NFT'].includes(currentScreen) && components.BottomNavigation && (
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
          {/* <PrivacyWalletProvider> Temporarily disabled */}
            <AppContent />
          {/* </PrivacyWalletProvider> */}
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
