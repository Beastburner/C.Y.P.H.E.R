import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, StatusBar, Animated, BackHandler, Alert, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { PrivacyWalletProvider } from './src/context/PrivacyWalletContext';
import { WalletProvider, useWallet } from './src/context/WalletContext';

console.log('🚀 CYPHER Wallet App.tsx loaded');
console.log('✅ Full wallet functionality with privacy features');

// Test TextEncoder availability
try {
  const encoder = new TextEncoder();
  const testData = encoder.encode('test');
  console.log('✅ TextEncoder available in App.tsx:', testData.length);
} catch (error) {
  console.error('❌ TextEncoder not available in App.tsx:', error);
}

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

    try {
      components.ENSPrivacyDemoScreen = require('./src/screens/ENSPrivacyDemoScreen').default;
      console.log('✅ ENS Privacy Demo screen loaded');
    } catch (e) { console.warn('ENS Privacy Demo screen failed to load:', e); }

  } catch (error) {
    console.error('❌ Critical error loading components:', error);
  }
};

// Load components
loadComponents();

type Screen = 'home' | 'send' | 'receive' | 'swap' | 'transactions' | 'settings' | 'privacy' | 'defi' | 'nft' | 'browser' | 'onboarding' | 'auth' | 'createWallet' | 'importWallet' | 'ensPrivacy';

function AppContent() {
  const { colors } = useTheme();
  const { state, checkExistingWallet, isWalletLocked } = useWallet();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [isWalletReady, setIsWalletReady] = useState(false);
  const [walletExists, setWalletExists] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [showPrivateAuth, setShowPrivateAuth] = useState(false);
  const [walletPassword, setWalletPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);

  // Check wallet state on app launch
  useEffect(() => {
    initializeApp();
  }, []);

  // Monitor wallet state changes
  useEffect(() => {
    console.log('🔍 Wallet state changed:', {
      isInitialized: state.isInitialized,
      isUnlocked: state.isUnlocked,
      hasAccount: !!state.currentAccount,
      isCheckingWallet
    });
    
    // Only update state after initial check is complete
    if (!isCheckingWallet) {
      if (state.isInitialized && state.isUnlocked && state.currentAccount) {
        console.log('✅ Wallet is ready');
        setIsWalletReady(true);
        setWalletExists(true);
        if (currentScreen === 'auth' || currentScreen === 'onboarding') {
          setCurrentScreen('home');
        }
      } else if (state.isInitialized && !state.isUnlocked) {
        console.log('🔒 Wallet exists but is locked');
        setIsWalletReady(false);
        setWalletExists(true);
        setCurrentScreen('auth');
      } else if (!state.isInitialized) {
        console.log('❓ Wallet not initialized - may need onboarding');
        setIsWalletReady(false);
        // Don't automatically change screen here - let initializeApp handle it
      }
    }
  }, [state.isInitialized, state.isUnlocked, state.currentAccount, isCheckingWallet]);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing app...');
      setIsCheckingWallet(true);
      
            // TEMPORARY: Force onboarding for testing
      const FORCE_ONBOARDING = false; // Set to false to use normal detection
      
      if (FORCE_ONBOARDING) {
        console.log('🔄 FORCE_ONBOARDING enabled - showing onboarding');
        setCurrentScreen('onboarding');
        setIsWalletReady(false);
        setWalletExists(false);
        setIsCheckingWallet(false);
        return;
      }
      
      // First, let's see what storage keys exist
      try {
        const { getAllKeys } = await import('./src/utils/storageHelpers');
        const allKeys = await getAllKeys();
        console.log('🗂️ All storage keys:', allKeys);
        
        const walletKeys = allKeys.filter(key => 
          key.includes('mnemonic') || key.includes('wallet_') || key.includes('privateKey') || key.includes('address')
        );
        console.log('💳 Wallet-related keys:', walletKeys);
      } catch (e) {
        console.log('Could not check storage keys:', e);
      }
      
      // Check if wallet exists
      const exists = await checkExistingWallet();
      console.log('💼 Wallet exists:', exists);
      setWalletExists(exists);
      
      if (exists) {
        console.log('📱 Wallet found, checking lock status...');
        // Check if wallet is locked
        const locked = await isWalletLocked();
        console.log('🔒 Wallet locked:', locked);
        
        if (locked) {
          console.log('🔐 Showing auth screen for locked wallet');
          setCurrentScreen('auth');
          setIsWalletReady(false);
        } else {
          console.log('🔓 Wallet is unlocked, going to home');
          // Wallet exists and is unlocked
          setIsWalletReady(true);
          setCurrentScreen('home');
        }
      } else {
        console.log('🆕 No wallet found, showing onboarding');
        // No wallet exists, show onboarding
        setCurrentScreen('onboarding');
        setIsWalletReady(false);
        setWalletExists(false);
      }
    } catch (error) {
      console.error('❌ App initialization error:', error);
      // Default to onboarding if there's any error
      console.log('🔄 Error occurred, defaulting to onboarding');
      setCurrentScreen('onboarding');
      setIsWalletReady(false);
      setWalletExists(false);
    } finally {
      setIsCheckingWallet(false);
    }
  };

  const handleNavigation = (screen: string, params?: any) => {
    console.log('🧭 Navigation to:', screen, 'params:', params);
    let validScreen = screen.toLowerCase() as Screen;
    
    // Handle case-insensitive navigation
    if (screen === 'CreateWallet') validScreen = 'createWallet';
    if (screen === 'ImportWallet') validScreen = 'importWallet';
    if (screen === 'Home') validScreen = 'home';
    
    console.log('🧭 Normalized screen name:', validScreen);
    
    // Handle wallet creation completion
    if (validScreen === 'home' && !isWalletReady) {
      console.log('🎉 Wallet creation completed, refreshing state');
      // Trigger a state refresh
      setTimeout(() => {
        initializeApp();
      }, 500);
    }
    
    // Don't allow navigation if wallet is not ready (except for setup screens)
    const setupScreens = ['onboarding', 'auth', 'createWallet', 'importWallet'];
    if (!isWalletReady && !setupScreens.includes(validScreen)) {
      console.log('🚫 Navigation blocked - wallet not ready');
      return;
    }
    
    // Check if trying to access private sections
    const privateSections = ['privacy', 'defi', 'nft'];
    if (privateSections.includes(validScreen) && !isPrivateMode) {
      console.log('🔒 Private section access requested - showing auth');
      setShowPrivateAuth(true);
      return;
    }
    
    setCurrentScreen(validScreen);
  };

  const handleAuthSuccess = () => {
    console.log('🎉 Authentication successful');
    setIsWalletReady(true);
    setCurrentScreen('home');
  };

  const refreshWalletState = () => {
    console.log('🔄 Refreshing wallet state');
    initializeApp();
  };

  // Utility function to clear wallet data (for testing/reset)
  const clearWalletData = async () => {
    try {
      console.log('🗑️ Clearing wallet data...');
      const { getAllKeys, removeValue, removeSecureValue } = await import('./src/utils/storageHelpers');
      const allKeys = await getAllKeys();
      
      const walletKeys = allKeys.filter(key => 
        key.includes('mnemonic') || 
        key.includes('wallet_') || 
        key.includes('privateKey') || 
        key.includes('address') ||
        key.includes('account') ||
        key.includes('password')
      );
      
      console.log('🗑️ Removing keys:', walletKeys);
      
      for (const key of walletKeys) {
        try {
          await removeSecureValue(key);
        } catch (e) {
          await removeValue(key);
        }
      }
      
      console.log('✅ Wallet data cleared');
      setWalletExists(false);
      setIsWalletReady(false);
      setCurrentScreen('onboarding');
    } catch (error) {
      console.error('❌ Error clearing wallet data:', error);
    }
  };

  const handlePrivateAuth = async (method: 'password' | 'biometric') => {
    setIsAuthenticating(true);
    console.log(`🔐 Attempting private auth via ${method}`);

    try {
      if (method === 'password') {
        // Simple password check (in real app, this would be more secure)
        if (walletPassword === 'cypher123' || walletPassword.length >= 6) {
          setIsPrivateMode(true);
          setShowPrivateAuth(false);
          setWalletPassword('');
          console.log('✅ Password authentication successful');
        } else {
          Alert.alert('Invalid Password', 'Please enter a valid wallet password');
        }
      } else if (method === 'biometric') {
        // Mock biometric authentication (in real app, use react-native-biometrics)
        const biometricResult = await new Promise(resolve => {
          Alert.alert(
            'Biometric Authentication',
            'Use your fingerprint or face to access private features',
            [
              { text: 'Cancel', onPress: () => resolve(false) },
              { text: 'Authenticate', onPress: () => resolve(true) }
            ]
          );
        });

        if (biometricResult) {
          setIsPrivateMode(true);
          setShowPrivateAuth(false);
          console.log('✅ Biometric authentication successful');
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      Alert.alert('Authentication Failed', 'Please try again');
    }

    setIsAuthenticating(false);
  };

  const handleLogoutPrivate = () => {
    setIsPrivateMode(false);
    setCurrentScreen('home');
    console.log('🔓 Logged out of private mode');
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
    console.log('🖥️ Rendering screen:', currentScreen, 'wallet ready:', isWalletReady);

    // Show loading while checking wallet state
    if (isCheckingWallet) {
      return (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Loading CYPHER...</Text>
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={clearWalletData}
          >
            <Text style={styles.debugButtonText}>🗑️ Clear Wallet Data (Debug)</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const fallbackView = (screenName: string) => (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Loading {screenName}...</Text>
      </View>
    );

    switch (currentScreen) {
      case 'onboarding':
        return components.OnboardingScreen ? 
          <components.OnboardingScreen 
            onNavigate={handleNavigation}
          /> : 
          fallbackView('Onboarding');

      case 'auth':
        return components.AuthenticationScreen ? 
          <components.AuthenticationScreen 
            mode="login"
            onAuthSuccess={handleAuthSuccess}
          /> : 
          fallbackView('Authentication');

      case 'createWallet':
        return components.CreateWalletScreen ? 
          <components.CreateWalletScreen 
            onNavigate={handleNavigation}
            initialMode="create"
          /> : 
          fallbackView('Create Wallet');

      case 'importWallet':
        return components.CreateWalletScreen ? 
          <components.CreateWalletScreen 
            onNavigate={handleNavigation}
            initialMode="import"
          /> : 
          fallbackView('Import Wallet');

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

      case 'ensPrivacy':
        return components.ENSPrivacyDemoScreen ? 
          <components.ENSPrivacyDemoScreen /> : 
          fallbackView('ENS Privacy Demo');

      default:
        // If no wallet exists, show onboarding
        if (!walletExists) {
          return components.OnboardingScreen ? 
            <components.OnboardingScreen 
              onNavigate={handleNavigation}
            /> : 
            fallbackView('Onboarding');
        }
        
        // If wallet exists but not ready, show auth
        if (!isWalletReady) {
          return components.AuthenticationScreen ? 
            <components.AuthenticationScreen 
              mode="login"
              onAuthSuccess={handleAuthSuccess}
            /> : 
            fallbackView('Authentication');
        }
        
        // Default to home
        return components.HomeNew ? 
          <components.HomeNew onNavigate={handleNavigation} /> : 
          fallbackView('Home');
    }
  };

  const showBottomNav = isWalletReady && !isCheckingWallet && ['home', 'send', 'receive', 'swap', 'transactions', 'settings', 'privacy', 'defi', 'nft', 'browser'].includes(currentScreen);

  return (
    <View style={[styles.container, { backgroundColor: colors?.background || '#1a1a1a' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors?.primary || '#1a1a1a'} />
      
      {/* Privacy Mode Indicator */}
      {isPrivateMode && (
        <View style={styles.privacyIndicator}>
          <Text style={styles.privacyText}>🔒 PRIVATE MODE</Text>
          <TouchableOpacity onPress={handleLogoutPrivate} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}
      
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

      {/* Private Authentication Modal */}
      <Modal
        visible={showPrivateAuth}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrivateAuth(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.authModal}>
            <Text style={styles.authTitle}>🔒 Private Section Access</Text>
            <Text style={styles.authSubtitle}>
              Authentication required to access privacy features
            </Text>

            <View style={styles.authInputContainer}>
              <Text style={styles.inputLabel}>Wallet Password</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter wallet password"
                placeholderTextColor="#888"
                secureTextEntry
                value={walletPassword}
                onChangeText={setWalletPassword}
                editable={!isAuthenticating}
              />
            </View>

            <View style={styles.authButtons}>
              <TouchableOpacity
                style={[styles.authButton, styles.passwordButton]}
                onPress={() => handlePrivateAuth('password')}
                disabled={isAuthenticating || walletPassword.length < 6}
              >
                <Text style={styles.authButtonText}>
                  {isAuthenticating ? 'Authenticating...' : 'Use Password'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, styles.biometricButton]}
                onPress={() => handlePrivateAuth('biometric')}
                disabled={isAuthenticating}
              >
                <Text style={styles.authButtonText}>
                  {isAuthenticating ? 'Authenticating...' : '🔐 Use Biometric'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authButton, styles.cancelButton]}
                onPress={() => {
                  setShowPrivateAuth(false);
                  setWalletPassword('');
                }}
                disabled={isAuthenticating}
              >
                <Text style={[styles.authButtonText, { color: '#888' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.authNote}>
              💡 Default password: "cypher123" or any 6+ character password
            </Text>
          </View>
        </View>
      </Modal>
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
  debugButton: {
    marginTop: 20,
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Privacy Mode Indicator
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#00ff88',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  privacyText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  logoutText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Authentication Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authModal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 25,
    margin: 20,
    width: '85%',
    maxWidth: 400,
  },
  authTitle: {
    color: '#00ff88',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  authSubtitle: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  authInputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
  },
  authButtons: {
    gap: 12,
  },
  authButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  passwordButton: {
    backgroundColor: '#00ff88',
  },
  biometricButton: {
    backgroundColor: '#007acc',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#555',
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  authNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
});
