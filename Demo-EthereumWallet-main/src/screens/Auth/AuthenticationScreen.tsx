import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  BackHandler,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AnimatedContainer, ScaleAnimation } from '../../components/Animations';
import SecurityManager from '../../utils/securityManager';
import { biometricAuthentication } from '../../utils/biometricAuth';
import autoLockManager from '../../utils/autoLockManager';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

interface AuthenticationScreenProps {
  onAuthSuccess: () => void;
  mode: 'login' | 'setup';
  lockReason?: string;
  requireBiometric?: boolean;
}

const AuthenticationScreen: React.FC<AuthenticationScreenProps> = ({
  onAuthSuccess,
  mode,
  lockReason,
  requireBiometric = false,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'password' | 'biometric'>('password');
  const [biometricInProgress, setBiometricInProgress] = useState(false);
  const [biometricAutoTriggered, setBiometricAutoTriggered] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, score: 0, suggestions: [] as string[] });
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [lockState, setLockState] = useState<any>({
    isLocked: false,
    lockedAt: null,
    reason: 'manual' as const,
    failedAttempts: 0,
    lastActivity: new Date(),
  });
  
  // Animation values
  const shakeAnim = new Animated.Value(0);

  const { unlockWallet, authenticateWithBiometrics } = useWallet();
  const { colors } = useTheme();
  const securityManager = SecurityManager.getInstance();
  
  const styles = createStyles(colors);

  useEffect(() => {
    initializeSecurity();
    setupSecurityMonitoring();
    
    // Prevent back button if wallet is locked
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode === 'login') {
        return true; // Prevent going back when locked
      }
      return false;
    });
    
    return () => {
      backHandler.remove();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBlocked, blockTimeRemaining]);

  useEffect(() => {
    // Auto-trigger biometric authentication in login mode if available
    if (mode === 'login' && biometricAvailable && !isLoading && !biometricInProgress && !biometricAutoTriggered) {
      console.log('Auto-triggering biometric authentication');
      setBiometricAutoTriggered(true);
      // Small delay to allow UI to settle
      setTimeout(() => {
        handleBiometricAuth();
      }, 1000);
    }
  }, [biometricAvailable, mode]);

  useEffect(() => {
    if (mode === 'setup' && password) {
      const strength = securityManager.validatePasswordStrength(password);
      setPasswordStrength(strength);
    }
  }, [password, mode]);

  const setupSecurityMonitoring = () => {
    try {
      const autoLockInstance = autoLockManager.getInstance();
      
      // Monitor lock state changes
      if (autoLockInstance.addLockStateListener) {
        autoLockInstance.addLockStateListener((state) => {
          setLockState(state);
          setFailedAttempts(state.failedAttempts);
          
          // Check if should block
          const config = autoLockInstance.getConfig();
          if (state.failedAttempts >= config.maxFailedAttempts) {
            setIsBlocked(true);
            setBlockTimeRemaining(300); // 5 minutes
          }
        });
      }
    } catch (error) {
      console.error('Failed to setup security monitoring:', error);
    }
  };

  const initializeSecurity = async () => {
    try {
      await securityManager.initialize();
      
      // Check biometric capabilities
      const biometricSupported = await biometricAuthentication.isSupported();
      setBiometricAvailable(biometricSupported && (mode === 'setup' || !requireBiometric));
      
      if (biometricSupported) {
        // Set a default biometric type
        setBiometricType('Biometric');
      }

      // Get current lock state from auto-lock manager
      const autoLockInstance = autoLockManager.getInstance();
      if (autoLockInstance) {
        const currentLockState = autoLockInstance.getLockState?.() || lockState;
        setLockState(currentLockState);
        setFailedAttempts(currentLockState.failedAttempts);
        
        const config = autoLockInstance.getConfig();
        if (currentLockState.failedAttempts >= config.maxFailedAttempts) {
          setIsBlocked(true);
          setBlockTimeRemaining(300);
        }
      }
      
      console.log('Security initialized for mode:', mode);
    } catch (error) {
      console.error('Failed to initialize security:', error);
    }
  };

  const handlePasswordAuth = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    if (isBlocked) {
      Alert.alert(
        'Account Temporarily Locked',
        `Please wait ${formatTime(blockTimeRemaining)} before trying again.`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'setup') {
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }

        if (!passwordStrength.isValid) {
          Alert.alert('Error', 'Password does not meet security requirements');
          return;
        }

        // Set up new password
        await securityManager.setPassword(password);
        console.log('Password set successfully');
        
        await securityManager.logSecurityEvent('password_setup_success', {
          timestamp: new Date(),
        });
        
        onAuthSuccess();
      } else {
        // Login mode
        const success = await unlockWallet(password);
        if (success) {
          console.log('Wallet unlocked successfully');
          
          // Reset failed attempts
          setFailedAttempts(0);
          await securityManager.logSecurityEvent('authentication_success', {
            method: 'password',
            timestamp: new Date(),
          });
          
          onAuthSuccess();
        } else {
          await handleAuthFailure('Invalid password', 'password');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      await handleAuthFailure(
        error instanceof Error ? error.message : 'Authentication failed',
        'password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAuthFailure = async (errorMessage: string, method: string = 'password') => {
    const newFailedAttempts = failedAttempts + 1;
    setFailedAttempts(newFailedAttempts);

    // Log security event
    await securityManager.logSecurityEvent('authentication_failed', {
      method,
      attempt: newFailedAttempts,
      error: errorMessage,
      timestamp: new Date(),
    });

    // Check if should block
    const autoLockInstance = autoLockManager.getInstance();
    const config = autoLockInstance.getConfig();
    const maxAttempts = config.maxFailedAttempts || 3;
    
    if (newFailedAttempts >= maxAttempts) {
      setIsBlocked(true);
      setBlockTimeRemaining(300); // 5 minutes
      
      await securityManager.logSecurityEvent('authentication_blocked', {
        attempts: newFailedAttempts,
        blockDuration: 300,
        timestamp: new Date(),
      });

      Alert.alert(
        'Too Many Failed Attempts',
        'Your wallet has been temporarily locked for security. Please try again later.',
        [{ text: 'OK' }]
      );
    } else {
      animateError();
      Alert.alert(
        'Authentication Failed',
        `${errorMessage}\n\nAttempts remaining: ${maxAttempts - newFailedAttempts}`,
        [{ text: 'Try Again' }]
      );
    }
  };

  const handleBiometricAuth = async () => {
    if (!biometricAvailable || isBlocked) {
      Alert.alert('Error', 'Biometric authentication is not available');
      setBiometricInProgress(false);
      return;
    }

    setBiometricInProgress(true);
    setIsLoading(true);

    try {
      const result = await biometricAuthentication.authenticate(
        'Unlock your wallet',
        'Use your biometric to access your wallet'
      );
      
      if (result.success) {
        console.log('Biometric authentication successful');
        
        // Reset failed attempts
        setFailedAttempts(0);
        await securityManager.logSecurityEvent('authentication_success', {
          method: 'biometric',
          timestamp: new Date(),
        });
        
        onAuthSuccess();
      } else {
        await handleAuthFailure(result.error || 'Biometric authentication failed', 'biometric');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      await handleAuthFailure(
        error instanceof Error ? error.message : 'Biometric authentication failed',
        'biometric'
      );
    } finally {
      setIsLoading(false);
      setBiometricInProgress(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient colors={[colors.background, colors.backgroundSecondary]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AnimatedContainer delay={300} style={styles.contentContainer}>
              <ScaleAnimation>
                <View style={styles.logoContainer}>
                  <View style={styles.logo}>
                    <Text style={styles.logoText}>E</Text>
                  </View>
                </View>
              </ScaleAnimation>

              <Text style={styles.title}>
                {mode === 'setup' ? 'Set Up Security' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {mode === 'setup' 
                  ? 'Create a secure password to protect your wallet'
                  : lockReason 
                    ? `Wallet locked: ${lockReason}`
                    : 'Enter your password to access your wallet'
                }
              </Text>

              {/* Security Status */}
              {(failedAttempts > 0 || isBlocked) && (
                <View style={styles.securityStatusContainer}>
                  {failedAttempts > 0 && !isBlocked && (
                    <Text style={styles.attemptsText}>
                      ⚠️ Failed attempts: {failedAttempts}
                    </Text>
                  )}
                  
                  {isBlocked && (
                    <Animated.View 
                      style={[
                        styles.blockedContainer,
                        { transform: [{ translateX: shakeAnim }] }
                      ]}
                    >
                      <Text style={styles.blockedTitle}>🚫 Temporarily Blocked</Text>
                      <Text style={styles.blockedText}>
                        Try again in: {formatTime(blockTimeRemaining)}
                      </Text>
                    </Animated.View>
                  )}
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {mode === 'setup' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {mode === 'setup' && passwordStrength.suggestions.length > 0 && !passwordStrength.isValid && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Password Requirements:</Text>
                  {passwordStrength.suggestions.map((suggestion, index) => (
                    <Text key={index} style={styles.suggestionText}>
                      • {suggestion}
                    </Text>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, (!password || isLoading) && styles.buttonDisabled]}
                onPress={handlePasswordAuth}
                disabled={!password || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.buttonText}>
                    {mode === 'setup' ? 'Set Password' : 'Unlock Wallet'}
                  </Text>
                )}
              </TouchableOpacity>

              {biometricAvailable && mode === 'login' && (
                <TouchableOpacity
                  style={[styles.biometricButton, isLoading && styles.buttonDisabled]}
                  onPress={handleBiometricAuth}
                  disabled={isLoading}
                >
                  <Text style={styles.biometricButtonText}>
                    Use {biometricType}
                  </Text>
                </TouchableOpacity>
              )}
            </AnimatedContainer>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  contentContainer: {
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  biometricButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    marginTop: 16,
  },
  biometricButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  suggestionsContainer: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  securityStatusContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  attemptsText: {
    fontSize: 14,
    color: colors.warning,
    marginBottom: 12,
    fontWeight: '600',
  },
  blockedContainer: {
    backgroundColor: colors.error || '#FF1744',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  blockedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  blockedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default AuthenticationScreen;
