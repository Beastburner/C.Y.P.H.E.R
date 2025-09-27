import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// Import modern components
import ModernHeader from '../../components/ModernHeader';
import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';
import ModernBalanceDisplay from '../../components/ModernBalanceDisplay';
import ModernTransactionRow from '../../components/ModernTransactionRow';
import ModernBottomNavigation from '../../components/ModernBottomNavigation';
import RealBalanceTest from '../../components/RealBalanceTest';
import { CypherHeaderLogo } from '../../components/CypherLogo';

// Import theme and utilities
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../../styles/ModernTheme';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { Token, Transaction } from '../../types';
import { walletService } from '../../services/WalletService';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

/**
 * ECLIPTA WALLET - Revolutionary Landing Screen
 * The most advanced Ethereum wallet that dominates MetaMask and Phantom
 * 
 * Implements prompt.txt specifications:
 * Landing page with three options: 
 * - "Create New Wallet"
 * - "Import Existing Wallet" 
 * - "Connect Hardware Wallet"
 * 
 * Features:
 * - BIP39/BIP44 standard implementation
 * - Military-grade security with WebCrypto API
 * - Perfect UX with zero technical jargon
 * - Intuitive navigation requiring zero tutorials
 */
const HomeNew: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { state, refreshPortfolio, refreshTransactions, getBalance, getTransactions, createWallet, importWallet, checkExistingWallet } = useWallet();
  const { colors, typography, spacing, createCardStyle, createButtonStyle, gradients } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [activeTab, setActiveTab] = useState('wallet');
  
  // Balance state with modern structure - UPDATED TO USE REAL DATA
  const [balance, setBalance] = useState({
    public: 0,
    private: 0,
    currency: 'ETH',
    usdValue: {
      public: 0,
      private: 0,
    }
  });
  
  // Transaction data - UPDATED TO USE REAL DATA
  const [transactions, setTransactions] = useState<any[]>([]);

  // Bottom navigation tabs
  const bottomTabs = [
    { id: 'wallet', label: 'Wallet', icon: 'home', badge: 0 },
    { id: 'activity', label: 'Activity', icon: 'activity', badge: 0 },
    { id: 'ens', label: 'ENS', icon: 'globe', badge: 0 },
    { id: 'privacy', label: 'Privacy', icon: 'shield', badge: 0 },
    { id: 'scanner', label: 'Scanner', icon: 'search', badge: 0 }
  ];
  
  // ECLIPTA Wallet Creation/Import Modal States (prompt.txt specifications)
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'importSeed' | 'importPrivateKey' | 'importKeystore' | 'hardware'>('create');
  const [walletName, setWalletName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [keystoreJson, setKeystoreJson] = useState('');
  const [keystorePassword, setKeystorePassword] = useState('');
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState<string[]>([]);
  const [seedPhraseVisible, setSeedPhraseVisible] = useState(false);
  const [seedVerificationWords, setSeedVerificationWords] = useState<{word: string, index: number}[]>([]);
  const [verificationInput, setVerificationInput] = useState<string[]>([]);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSecurityEducation, setShowSecurityEducation] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [generatedMnemonic, setGeneratedMnemonic] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    initializeWalletCheck();
    loadBalanceVisibility();
  }, []);

  useEffect(() => {
    if (state.isUnlocked && state.currentAccount && hasWallet) {
      loadData();
    }
  }, [state.isUnlocked, state.currentAccount, state.currentNetwork, hasWallet]);

  const initializeWalletCheck = async () => {
    try {
      setIsLoading(true);
      const walletExists = await checkExistingWallet();
      setHasWallet(walletExists);
      
      if (!walletExists) {
        // No wallet exists, show welcome screen
        console.log('No wallet found - showing welcome screen');
      }
    } catch (error) {
      console.error('Failed to check wallet existence:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBalanceVisibility = async () => {
    try {
      const { getValue } = await import('../../utils/storageHelpers');
      const savedVisibility = await getValue('balance_visibility');
      if (savedVisibility !== null) {
        setShowBalance(savedVisibility === 'true');
      }
    } catch (error) {
      console.log('Failed to load balance visibility preference:', error);
      // Default to true if loading fails
      setShowBalance(true);
    }
  };

  const toggleBalanceVisibility = async () => {
    try {
      const newVisibility = !showBalance;
      setShowBalance(newVisibility);
      
      const { setValue } = await import('../../utils/storageHelpers');
      await setValue('balance_visibility', newVisibility.toString());
    } catch (error) {
      console.error('Failed to save balance visibility preference:', error);
    }
  };

  const loadData = async () => {
    try {
      await Promise.all([
        refreshPortfolio(),
        refreshTransactions(),
      ]);
      
      // Update local balance state with real blockchain data
      const realBalance = await getBalance();
      const realTransactions = await getTransactions();
      
      console.log('🔍 Real balance from blockchain:', realBalance);
      console.log('🔍 WalletContext state.balance:', state.balance);
      console.log('🔍 Current network:', state.currentNetwork?.name);
      
      // Update balance with real data from blockchain
      setBalance(prev => ({
        ...prev,
        public: parseFloat(realBalance || state.balance || '0'),
        currency: state.currentNetwork?.symbol || 'ETH',
        usdValue: {
          public: state.portfolio?.totalBalance || 0,
          private: prev.usdValue.private // Keep private balance for now
        }
      }));
      
      // Update transactions with real data
      setTransactions(realTransactions.map((tx: any) => ({
        id: tx.hash || tx.id,
        type: tx.type || 'send',
        amount: parseFloat(tx.value || tx.amount || '0'),
        currency: state.currentNetwork?.symbol || 'ETH',
        from: tx.from || 'Unknown',
        to: tx.to || 'Unknown',
        timestamp: new Date(tx.timestamp || Date.now()).toLocaleString(),
        status: tx.status || 'confirmed',
        mode: 'public-to-public',
        hash: tx.hash || tx.id,
        usdValue: 0 // Will be calculated if needed
      })));
      
      console.log('✅ Balance updated to:', parseFloat(realBalance || state.balance || '0'), state.currentNetwork?.symbol);
      
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ===================
  // PASSWORD VALIDATION FUNCTIONS (prompt.txt Section 1 Requirements)
  // ===================

  const validatePasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const strength = score < 3 ? 'Weak' : score < 5 ? 'Medium' : 'Strong';
    
    return {
      requirements,
      score,
      strength,
      isValid: score >= 5, // All requirements must be met
    };
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Weak': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Strong': return '#10B981';
      default: return '#9CA3AF';
    }
  };

  // ===================
  // SEED PHRASE GENERATION (BIP39 Implementation)
  // ===================

  const generateSecureSeedPhrase = (wordCount: 12 | 24 = 12) => {
    try {
      // Generate cryptographically secure entropy
      const entropyBits = wordCount === 12 ? 128 : 256;
      const entropyBytes = entropyBits / 8;
      
      // Use crypto.getRandomValues for secure randomness
      const entropy = new Uint8Array(entropyBytes);
      crypto.getRandomValues(entropy);
      
      // Generate mnemonic using the WalletService
      const mnemonic = walletService.generateSeedPhrase(entropyBits);
      
      // Validate the generated mnemonic
      if (!walletService.validateSeedPhrase(mnemonic)) {
        throw new Error('Generated mnemonic failed validation');
      }
      
      return mnemonic.split(' ');
    } catch (error) {
      console.error('Seed phrase generation error:', error);
      Alert.alert('Error', 'Failed to generate secure seed phrase. Please try again.');
      return [];
    }
  };

  const generateSeedVerificationWords = (seedPhrase: string[]) => {
    if (seedPhrase.length === 0) return [];
    
    // Select 3-6 random words for verification (prompt.txt requirement)
    const verificationCount = Math.min(Math.max(3, Math.floor(seedPhrase.length / 4)), 6);
    const selectedWords: {word: string, index: number}[] = [];
    const usedIndices = new Set<number>();
    
    while (selectedWords.length < verificationCount) {
      const randomIndex = Math.floor(Math.random() * seedPhrase.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedWords.push({
          word: seedPhrase[randomIndex],
          index: randomIndex + 1 // 1-based index for user display
        });
      }
    }
    
    return selectedWords.sort((a, b) => a.index - b.index);
  };

  // ===================
  // WALLET CREATION/IMPORT FUNCTIONS (From prompt.txt Section 1)
  // ===================

  const handleCreateWallet = () => {
    setModalType('create');
    setShowWalletModal(true);
    setCurrentStep(1); // Start with password creation
    setWalletName('My ECLIPTA Wallet');
    setPassword('');
    setConfirmPassword('');
    setGeneratedSeedPhrase([]);
    setSeedVerificationWords([]);
    setVerificationInput([]);
    setShowSecurityEducation(false);
  };

  // ===================
  // STEP-BY-STEP WALLET CREATION PROCESS (prompt.txt Requirements)
  // ===================

  const proceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Password Creation
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
          Alert.alert(
            'Password Requirements Not Met',
            'Password must contain:\n• At least 8 characters\n• Uppercase letter\n• Lowercase letter\n• Number\n• Special character'
          );
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }
        setCurrentStep(2);
        setShowSecurityEducation(true);
        break;
        
      case 2: // Security Education
        setShowSecurityEducation(false);
        setCurrentStep(3);
        // Generate seed phrase when moving to step 3
        const newSeedPhrase = generateSecureSeedPhrase(12);
        setGeneratedSeedPhrase(newSeedPhrase);
        setSeedPhraseVisible(false);
        break;
        
      case 3: // Seed Phrase Display
        if (!seedPhraseVisible) {
          Alert.alert('Important', 'Please reveal and write down your seed phrase before continuing');
          return;
        }
        setCurrentStep(4);
        // Generate verification words
        const verificationWords = generateSeedVerificationWords(generatedSeedPhrase);
        setSeedVerificationWords(verificationWords);
        setVerificationInput(new Array(verificationWords.length).fill(''));
        break;
        
      case 4: // Seed Phrase Verification
        // Validate verification input
        const isVerificationCorrect = seedVerificationWords.every((word, index) => 
          verificationInput[index]?.toLowerCase().trim() === word.word.toLowerCase()
        );
        
        if (!isVerificationCorrect) {
          Alert.alert('Verification Failed', 'The words you entered do not match your seed phrase. Please try again.');
          return;
        }
        
        setCurrentStep(5);
        executeWalletCreation();
        break;
        
      default:
        break;
    }
  };

  const goBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) {
        setShowSecurityEducation(true);
      }
    }
  };

  const executeWalletCreation = async () => {
    try {
      setIsCreating(true);
      
      // Validate all requirements one more time
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new Error('Password does not meet security requirements');
      }
      
      if (generatedSeedPhrase.length === 0) {
        throw new Error('No seed phrase generated');
      }
      
      // Create wallet using WalletService with proper BIP39/BIP44 implementation
      const seedPhraseString = generatedSeedPhrase.join(' ');
      
      await walletService.createWalletFromSeed({
        mnemonicPhrase: seedPhraseString, // Fix: use correct parameter name
        password: password,
        walletName: walletName,
        passphrase: '' // Optional passphrase
      });

      // Success - wallet created
      Alert.alert(
        'Wallet Created Successfully! 🎉',
        'Your ECLIPTA wallet has been created with military-grade security. Your first Ethereum address has been generated and is ready to use.',
        [{ 
          text: 'Start Using Wallet', 
          onPress: () => {
            setShowWalletModal(false);
            setHasWallet(true);
            resetWalletCreationState();
          }
        }]
      );
      
    } catch (error) {
      console.error('Wallet creation error:', error);
      Alert.alert(
        'Wallet Creation Failed',
        `Failed to create wallet: ${(error as Error).message}. Please try again.`
      );
    } finally {
      setIsCreating(false);
    }
  };

  const resetWalletCreationState = () => {
    setCurrentStep(1);
    setPassword('');
    setConfirmPassword('');
    setGeneratedSeedPhrase([]);
    setSeedVerificationWords([]);
    setVerificationInput([]);
    setShowSecurityEducation(false);
    setSeedPhraseVisible(false);
  };

  const handleImportWallet = () => {
    // Show import options selection (prompt.txt: "Import with Seed Phrase", "Import with Private Key", "Import Keystore File")
    Alert.alert(
      'Import Existing Wallet',
      'Choose your import method:',
      [
        { text: 'Seed Phrase', onPress: () => { setModalType('importSeed'); setShowWalletModal(true); } },
        { text: 'Private Key', onPress: () => { setModalType('importPrivateKey'); setShowWalletModal(true); } },
        { text: 'Keystore File', onPress: () => { setModalType('importKeystore'); setShowWalletModal(true); } },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
    setWalletName('Imported Wallet');
    setPassword('');
    setConfirmPassword('');
    setMnemonic('');
  };

  const handleImportPrivateKey = () => {
    setModalType('importPrivateKey');
    setShowWalletModal(true);
    setWalletName('Imported Account');
    setPassword('');
    setConfirmPassword('');
    setPrivateKey('');
  };

  // ECLIPTA Import Options Handlers (prompt.txt specifications)
  const handleImportKeystore = () => {
    setModalType('importKeystore');
    setShowWalletModal(true);
    setWalletName('Keystore Wallet');
    setPassword('');
    setConfirmPassword('');
    setKeystoreJson('');
    setKeystorePassword('');
  };

  const handleConnectHardware = () => {
    setModalType('hardware');
    setShowWalletModal(true);
    // Note: Hardware wallet integration requires WebHID/WebUSB APIs
    Alert.alert(
      'Hardware Wallet Support',
      'Connect your Ledger or Trezor device to continue.\n\nSupported:\n• Ledger (WebHID)\n• Trezor (WebUSB)\n• WebAuthn compatible devices',
      [{ text: 'Continue', onPress: () => {} }]
    );
  };

  const generateNewSeedPhrase = () => {
    try {
      // Implementation as per prompt.txt Section 1.1
      const newMnemonic = walletService.generateSeedPhrase(128);
      setGeneratedMnemonic(newMnemonic);
    } catch (error) {
      console.error('Seed phrase generation error:', error);
      Alert.alert('Error', `Failed to generate seed phrase: ${(error as Error).message}`);
    }
  };

  const validatePassword = (pwd: string): boolean => {
    // Enhanced password validation as per prompt.txt
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[^A-Za-z0-9]/.test(pwd)) return false;
    return true;
  };

  // ===================
  // RENDER WALLET MODAL HELPER FUNCTIONS
  // ===================

  const renderStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Create Password';
      case 2: return 'Security Education';
      case 3: return 'Your Seed Phrase';
      case 4: return 'Verify Seed Phrase';
      case 5: return 'Creating Wallet...';
      default: return 'Create New Wallet';
    }
  };

  const getNextButtonText = () => {
    switch (currentStep) {
      case 1: return 'Continue';
      case 2: return 'I Understand';
      case 3: return 'I Have Saved It';
      case 4: return 'Verify & Create';
      case 5: return 'Creating...';
      default: return 'Next';
    }
  };

  const renderCreateWalletSteps = () => {
    switch (currentStep) {
      case 1:
        return renderPasswordCreationStep();
      case 2:
        return renderSecurityEducationStep();
      case 3:
        return renderSeedPhraseDisplayStep();
      case 4:
        return renderSeedVerificationStep();
      case 5:
        return renderWalletCreationStep();
      default:
        return null;
    }
  };

  const renderPasswordCreationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Create a Strong Password</Text>
        <Text style={styles.stepDescription}>
          Your password protects your wallet. Make it strong and unique.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Wallet Name</Text>
        <TextInput
          style={styles.textInput}
          value={walletName}
          onChangeText={setWalletName}
          placeholder="Enter wallet name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setShowPasswordStrength(text.length > 0);
          }}
          placeholder="Create a strong password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />
        {showPasswordStrength && (
          <View style={styles.passwordStrength}>
            <Text style={[styles.strengthLabel, { color: getPasswordStrengthColor(validatePasswordStrength(password).strength) }]}>
              Strength: {validatePasswordStrength(password).strength}
            </Text>
            <View style={styles.strengthRequirements}>
              {Object.entries(validatePasswordStrength(password).requirements).map(([key, met]) => (
                <Text key={key} style={[styles.requirement, met ? styles.requirementMet : styles.requirementUnmet]}>
                  {met ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.textInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />
      </View>
    </View>
  );

  const renderSecurityEducationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.educationHeader}>
        <Text style={styles.educationIcon}>🎓</Text>
        <Text style={styles.stepTitle}>Wallet Security Education</Text>
        <Text style={styles.stepDescription}>
          Understanding these concepts will help keep your crypto safe
        </Text>
      </View>

      <View style={styles.educationContent}>
        <View style={styles.educationCard}>
          <Text style={styles.educationCardIcon}>🔑</Text>
          <Text style={styles.educationCardTitle}>Seed Phrase</Text>
          <Text style={styles.educationCardText}>
            Your seed phrase is a 12-word backup that can restore your entire wallet. 
            Never share it with anyone and store it safely offline.
          </Text>
        </View>

        <View style={styles.educationCard}>
          <Text style={styles.educationCardIcon}>🛡️</Text>
          <Text style={styles.educationCardTitle}>Private Keys</Text>
          <Text style={styles.educationCardText}>
            Your private keys prove ownership of your crypto. ECLIPTA encrypts them 
            with military-grade security using your password.
          </Text>
        </View>

        <View style={styles.educationCard}>
          <Text style={styles.educationCardIcon}>⚠️</Text>
          <Text style={styles.educationCardTitle}>Security Best Practices</Text>
          <Text style={styles.educationCardText}>
            • Never enter your seed phrase on suspicious websites
            • Always verify contract addresses before transactions  
            • Use strong, unique passwords
            • Enable 2FA when available
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSeedPhraseDisplayStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Your Secret Recovery Phrase</Text>
        <Text style={styles.stepDescription}>
          Write down these 12 words in order. This is the ONLY way to recover your wallet.
        </Text>
      </View>

      <View style={styles.seedPhraseContainer}>
        <View style={styles.seedPhraseGrid}>
          {generatedSeedPhrase.map((word, index) => (
            <View key={index} style={[styles.seedWord, !seedPhraseVisible && styles.seedWordHidden]}>
              <Text style={styles.seedWordNumber}>{index + 1}</Text>
              <Text style={styles.seedWordText}>
                {seedPhraseVisible ? word : '••••••'}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.revealButton}
          onPress={() => setSeedPhraseVisible(!seedPhraseVisible)}
        >
          <Text style={styles.revealButtonText}>
            {seedPhraseVisible ? '👁️ Hide Phrase' : '👁️ Reveal Phrase'}
          </Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Never share your seed phrase. Anyone with access to it can steal your crypto. 
            ECLIPTA will never ask for your seed phrase.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSeedVerificationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Verify Your Seed Phrase</Text>
        <Text style={styles.stepDescription}>
          Enter the requested words to confirm you've saved your seed phrase correctly.
        </Text>
      </View>

      <View style={styles.verificationContainer}>
        {seedVerificationWords.map((wordData, index) => (
          <View key={index} style={styles.verificationInput}>
            <Text style={styles.verificationLabel}>Word #{wordData.index}</Text>
            <TextInput
              style={styles.textInput}
              value={verificationInput[index] || ''}
              onChangeText={(text) => {
                const newInput = [...verificationInput];
                newInput[index] = text;
                setVerificationInput(newInput);
              }}
              placeholder={`Enter word #${wordData.index}`}
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        ))}
      </View>
    </View>
  );

  const renderWalletCreationStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.creationProgress}>
        <Text style={styles.creationIcon}>⚡</Text>
        <Text style={styles.stepTitle}>Creating Your ECLIPTA Wallet</Text>
        <Text style={styles.stepDescription}>
          Generating cryptographic keys and setting up military-grade security...
        </Text>
        <View style={styles.progressIndicator}>
          <View style={styles.progressBar} />
        </View>
      </View>
    </View>
  );

  const renderImportWalletContent = () => (
    <View style={styles.stepContainer}>
      {/* Wallet Name Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Wallet Name</Text>
        <TextInput
          style={styles.textInput}
          value={walletName}
          onChangeText={setWalletName}
          placeholder="Enter wallet name"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Password Inputs */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Create a strong password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.textInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
        />
      </View>

      {/* Import Method Specific Inputs */}
      {modalType === 'importSeed' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Seed Phrase</Text>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={mnemonic}
            onChangeText={setMnemonic}
            placeholder="Enter your 12 or 24 word seed phrase"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      )}

      {modalType === 'importPrivateKey' && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Private Key</Text>
          <TextInput
            style={styles.textInput}
            value={privateKey}
            onChangeText={setPrivateKey}
            placeholder="Enter your private key (64 characters)"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
          />
        </View>
      )}

      {modalType === 'importKeystore' && (
        <View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Keystore JSON</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={keystoreJson}
              onChangeText={setKeystoreJson}
              placeholder="Paste your keystore JSON content here"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Keystore Password</Text>
            <TextInput
              style={styles.textInput}
              value={keystorePassword}
              onChangeText={setKeystorePassword}
              placeholder="Enter your keystore password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
            />
          </View>
        </View>
      )}

      {modalType === 'hardware' && (
        <View style={styles.inputGroup}>
          <View style={styles.hardwareWalletInfo}>
            <Text style={styles.hardwareTitle}>🔐 Hardware Wallet Connection</Text>
            <Text style={styles.hardwareDescription}>
              Connect your hardware wallet to continue. ECLIPTA supports:
            </Text>
            <View style={styles.hardwareList}>
              <Text style={styles.hardwareItem}>• Ledger (WebHID API)</Text>
              <Text style={styles.hardwareItem}>• Trezor (WebUSB API)</Text>
              <Text style={styles.hardwareItem}>• WebAuthn compatible devices</Text>
            </View>
            <Text style={styles.hardwareNote}>
              💡 Make sure your device is unlocked and the Ethereum app is open
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // ===================
  // RENDER WALLET MODAL (Implements prompt.txt UI flows)
  // ===================
  
  const renderWalletModal = () => {
    return (
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient 
            colors={[colors.primary, colors.accent]} 
            style={styles.modalHeader}
          >
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                setShowWalletModal(false);
                resetWalletCreationState();
              }}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            
            {/* Dynamic Title Based on Current Step */}
            <Text style={styles.modalTitle}>
              {modalType === 'create' ? renderStepTitle() : 
               modalType === 'importSeed' ? 'Import with Seed Phrase' : 
               modalType === 'importPrivateKey' ? 'Import with Private Key' :
               modalType === 'importKeystore' ? 'Import with Keystore' : 'Connect Hardware Wallet'}
            </Text>
            
            {/* Step Progress Indicator for Create Wallet */}
            {modalType === 'create' && (
              <View style={styles.stepIndicator}>
                {[1, 2, 3, 4, 5].map((step) => (
                  <View 
                    key={step}
                    style={[
                      styles.stepDot,
                      currentStep >= step ? styles.stepDotActive : styles.stepDotInactive
                    ]}
                  />
                ))}
              </View>
            )}
          </LinearGradient>
          
          <ScrollView style={styles.modalContent}>
            {modalType === 'create' ? renderCreateWalletSteps() : renderImportWalletContent()}
          </ScrollView>
          
          {/* Navigation Buttons */}
          <View style={styles.modalFooter}>
            {modalType === 'create' && currentStep > 1 && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryActionButton]}
                onPress={goBackStep}
              >
                <Text style={styles.secondaryActionButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.primaryActionButton,
                isCreating && styles.disabledButton
              ]}
              onPress={modalType === 'create' ? proceedToNextStep : executeWalletCreation}
              disabled={isCreating}
            >
              <Text style={styles.primaryActionButtonText}>
                {isCreating ? 'Processing...' : 
                 modalType === 'create' ? getNextButtonText() : 'Import Wallet'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // ===================
  // HELPER FUNCTIONS
  // ===================

  const formatBalance = (balance: string): string => {
    try {
      if (!balance || balance === undefined || balance === null) {
        return '0.000000';
      }
      const balanceNum = parseFloat(balance);
      if (isNaN(balanceNum)) {
        return '0.000000';
      }
      return balanceNum.toFixed(6);
    } catch (error) {
      console.warn('Error formatting balance:', error);
      return '0.000000';
    }
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // ===================
  // MAIN COMPONENT LOGIC
  // ===================

  // ===================
  // COMPONENT LOGIC
  // ===================

  const cardStyle = createCardStyle('elevated');
  const primaryButtonStyle = createButtonStyle('primary');
  const secondaryButtonStyle = createButtonStyle('secondary');

  // Loading state with modern design
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.modernLoadingContainer}
        >
          <View style={styles.modernLoadingContent}>
            <View style={styles.modernLogoContainer}>
              <View style={styles.modernLogo}>
                <Text style={styles.logoText}>C</Text>
              </View>
              <Text style={styles.modernLoadingTitle}>CYPHER Wallet</Text>
              <Text style={styles.modernLoadingSubtitle}>Initializing secure vault...</Text>
            </View>
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, styles.loadingDot2]} />
              <View style={[styles.loadingDot, styles.loadingDot3]} />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // No wallet exists - show ECLIPTA landing screen (implements prompt.txt specifications)
  if (hasWallet === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        
        <LinearGradient 
          colors={[colors.primary, colors.accent]} 
          style={styles.welcomeContainer}
          angle={45}
        >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeIcon}>⚡</Text>
            <Text style={styles.welcomeTitle}>Welcome to ECLIPTA</Text>
            <Text style={styles.welcomeSubtitle}>The Most Revolutionary Ethereum Wallet</Text>
            <Text style={styles.welcomeDescription}>
              Redefining Web3 user experience with features that don't exist in any other wallet. 
              Built to dominate MetaMask and Phantom.
            </Text>
            
            <View style={styles.welcomeFeatures}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <Text style={styles.featureText}>Military-Grade Security</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Lightning Performance</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌐</Text>
                <Text style={styles.featureText}>Advanced DeFi Integration</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💎</Text>
                <Text style={styles.featureText}>Zero Technical Jargon</Text>
              </View>
            </View>
            
            {/* ECLIPTA Landing Page with Three Options (prompt.txt specifications) */}
            <View style={styles.welcomeActions}>
              <TouchableOpacity
                style={[styles.ecliptaButton, styles.primaryButton]}
                onPress={handleCreateWallet}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>✨</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Create New Wallet</Text>
                    <Text style={styles.buttonSubtitle}>Generate secure BIP39 seed phrase</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ecliptaButton, styles.secondaryButton]}
                onPress={handleImportWallet}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>📥</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Import Existing Wallet</Text>
                    <Text style={styles.buttonSubtitle}>Use seed phrase, private key or keystore</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.ecliptaButton, styles.tertiaryButton]}
                onPress={() => {
                  setModalType('hardware');
                  setShowWalletModal(true);
                }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonIcon}>🔐</Text>
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>Connect Hardware Wallet</Text>
                    <Text style={styles.buttonSubtitle}>Ledger, Trezor & WebHID support</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Security education reminder */}
            <View style={styles.securityReminder}>
              <Text style={styles.securityText}>
                💡 We'll guide you through securing your wallet with industry-leading practices
              </Text>
            </View>
          </View>
        </LinearGradient>
        
        {/* Wallet Creation/Import Modal */}
        {renderWalletModal()}
      </SafeAreaView>
    );
  }  if (!state.isUnlocked) {
    return (
      <SafeAreaView style={modernStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={ModernColors.primaryGradient[0]} />
        <View style={modernStyles.lockedContainer}>
          <Text style={modernStyles.lockedText}>Please unlock your wallet</Text>
          <ModernButton 
            title="Unlock Wallet" 
            onPress={() => onNavigate('auth')}
            variant="primary"
            gradient={true}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={modernStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <ModernHeader
        title="CYPHER Wallet"
        isPrivateMode={isPrivateMode}
        isConnected={true}
        notifications={notifications}
        onPrivacyToggle={() => setIsPrivateMode(!isPrivateMode)}
        onSettingsPress={() => onNavigate('Settings')}
        onNotificationPress={() => setNotifications(0)}
        showConnectionStatus={true}
        showPrivacyToggle={true}
      />

      <ScrollView 
        style={modernStyles.scrollView}
        contentContainerStyle={modernStyles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ModernColors.info}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Render content based on active tab */}
        {activeTab === 'wallet' && (
          <>
            {/* Real Balance Test Component */}
            <RealBalanceTest />
            
            {/* Modern Balance Display */}
            <ModernBalanceDisplay
              balance={{
                public: parseFloat(state.balance || '0'),
                private: balance.private,
                currency: state.currentNetwork?.symbol || 'ETH',
                usdValue: {
                  public: state.portfolio?.totalBalance || 0,
                  private: balance.usdValue.private
                }
              }}
              isPrivateMode={isPrivateMode}
              onToggleVisibility={toggleBalanceVisibility}
              loading={refreshing}
              showUSD={true}
            />

            {/* Action Buttons */}
            <ModernCard padding="medium" margin="medium">
              <Text style={modernStyles.sectionTitle}>Quick Actions</Text>
              <View style={modernStyles.actionButtonsGrid}>
                <ModernButton
                  title="Send"
                  onPress={() => onNavigate('Send')}
                  variant="primary"
                  gradient={true}
                  leftIcon={<Icon name="arrow-up-right" size={20} color="#ffffff" />}
                />
                <ModernButton
                  title="Receive"
                  onPress={() => onNavigate('Receive')}
                  variant="success"
                  leftIcon={<Icon name="arrow-down-left" size={20} color="#ffffff" />}
                />
              </View>
              <View style={[modernStyles.actionButtonsGrid, { marginTop: ModernSpacing.md }]}>
                <ModernButton
                  title="Swap"
                  onPress={() => onNavigate('Swap')}
                  variant="secondary"
                  leftIcon={<Icon name="refresh-cw" size={20} color={ModernColors.info} />}
                />
                <ModernButton
                  title="DeFi"
                  onPress={() => onNavigate('DeFiDashboard')}
                  variant="warning"
                  leftIcon={<Icon name="star" size={20} color="#ffffff" />}
                />
              </View>
            </ModernCard>

            {/* Recent Transactions */}
            <ModernCard title="Recent Activity" padding="none" margin="medium">
              <View style={{ paddingHorizontal: ModernSpacing.xl }}>
                {transactions.slice(0, 3).map((tx, index) => (
                  <ModernTransactionRow
                    key={tx.id}
                    transaction={tx}
                    onPress={(transaction) => onNavigate('TransactionDetail', { transaction })}
                    showMode={true}
                    compact={false}
                  />
                ))}
              </View>
              <View style={modernStyles.viewAllContainer}>
                <ModernButton
                  title="View All Transactions"
                  onPress={() => setActiveTab('activity')}
                  variant="ghost"
                  size="small"
                />
              </View>
            </ModernCard>

            {/* Portfolio Overview */}
            <ModernCard title="Portfolio" padding="medium" margin="medium">
              {state.tokens && state.tokens.length > 0 ? (
                <>
                  {state.tokens.slice(0, 3).map((token: Token, index: number) => (
                    <TouchableOpacity
                      key={token.address || index}
                      style={modernStyles.tokenRow}
                      onPress={() => onNavigate('TokenDetail', { token })}
                    >
                      <View style={modernStyles.tokenIcon}>
                        <Text style={modernStyles.tokenIconText}>
                          {token.symbol?.charAt(0) || 'T'}
                        </Text>
                      </View>
                      <View style={modernStyles.tokenInfo}>
                        <Text style={modernStyles.tokenName}>{token.name || 'Unknown Token'}</Text>
                        <Text style={modernStyles.tokenSymbol}>{token.symbol || 'N/A'}</Text>
                      </View>
                      <View style={modernStyles.tokenBalance}>
                        <Text style={modernStyles.tokenAmount}>
                          {token.balance || '0.00'}
                        </Text>
                        <Text style={modernStyles.tokenValue}>$0.00</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <View style={modernStyles.viewAllContainer}>
                    <ModernButton
                      title="Manage Tokens"
                      onPress={() => onNavigate('TokenManagement')}
                      variant="ghost"
                      size="small"
                    />
                  </View>
                </>
              ) : (
                <View style={modernStyles.emptyState}>
                  <Icon name="pie-chart" size={48} color={ModernColors.textTertiary} />
                  <Text style={modernStyles.emptyStateText}>No tokens found</Text>
                  <Text style={modernStyles.emptyStateSubtext}>Add tokens to see your portfolio</Text>
                </View>
              )}
            </ModernCard>
          </>
        )}

        {activeTab === 'activity' && (
          <ModernCard title="Transaction History" padding="none" margin="medium">
            <ScrollView style={{ maxHeight: 400 }}>
              {transactions.map((tx) => (
                <ModernTransactionRow
                  key={tx.id}
                  transaction={tx}
                  onPress={(transaction) => onNavigate('TransactionDetail', { transaction })}
                  showMode={true}
                  compact={false}
                />
              ))}
            </ScrollView>
          </ModernCard>
        )}

        {activeTab === 'privacy' && (
          <ModernCard title="Privacy Dashboard" variant="privacy" padding="medium" margin="medium">
            <View style={modernStyles.privacyControls}>
              <View style={modernStyles.privacyModeToggle}>
                <Text style={modernStyles.privacyLabel}>Privacy Mode</Text>
                <TouchableOpacity
                  onPress={() => setIsPrivateMode(!isPrivateMode)}
                  style={[
                    modernStyles.toggleButton,
                    isPrivateMode ? modernStyles.toggleActive : modernStyles.toggleInactive
                  ]}
                >
                  <Icon 
                    name={isPrivateMode ? "shield" : "eye"} 
                    size={16} 
                    color="#ffffff" 
                  />
                  <Text style={modernStyles.toggleText}>
                    {isPrivateMode ? 'Private' : 'Public'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={modernStyles.privacyStats}>
                <View style={modernStyles.statItem}>
                  <Text style={modernStyles.statValue}>{transactions.length}</Text>
                  <Text style={modernStyles.statLabel}>Private Transactions</Text>
                </View>
                <View style={modernStyles.statItem}>
                  <Text style={modernStyles.statValue}>{balance.private.toFixed(2)} {state.currentNetwork?.symbol || 'ETH'}</Text>
                  <Text style={modernStyles.statLabel}>Shielded Balance</Text>
                </View>
              </View>
              
              <ModernButton
                title="Open Full Privacy Dashboard"
                onPress={() => onNavigate('Privacy')}
                variant="primary"
                gradient={true}
                leftIcon={<Icon name="shield" size={20} color="#ffffff" />}
                fullWidth={true}
              />
            </View>
          </ModernCard>
        )}

        {activeTab === 'ens' && (
          <ModernCard title="ENS Management" padding="medium" margin="medium">
            <View style={modernStyles.ensInfo}>
              <View style={modernStyles.ensProfile}>
                <View style={modernStyles.ensAvatar}>
                  <Text style={modernStyles.ensAvatarText}>M</Text>
                </View>
                <View>
                  <Text style={modernStyles.ensName}>my-alias.eth</Text>
                  <Text style={modernStyles.ensAddress}>0x742d...8f2a</Text>
                </View>
              </View>
              
              <ModernButton
                title="Manage ENS Profile"
                onPress={() => onNavigate('Privacy')}
                variant="secondary"
                leftIcon={<Icon name="edit-3" size={20} color={ModernColors.info} />}
                fullWidth={true}
              />
            </View>
          </ModernCard>
        )}

        {activeTab === 'scanner' && (
          <ModernCard title="Blockchain Scanner" padding="medium" margin="medium">
            <View style={modernStyles.scannerInfo}>
              <Icon name="search" size={64} color={ModernColors.textTertiary} />
              <Text style={modernStyles.scannerTitle}>Chain Scanner</Text>
              <Text style={modernStyles.scannerDescription}>
                Scanning for encrypted memos and private transactions...
              </Text>
              
              <View style={modernStyles.scanResults}>
                <View style={modernStyles.scanResult}>
                  <Text style={modernStyles.scanResultLabel}>Last Scan</Text>
                  <Text style={modernStyles.scanResultValue}>Block 18,234,567 • 2 min ago</Text>
                </View>
                <View style={modernStyles.scanResult}>
                  <Text style={modernStyles.scanResultLabel}>Notes Detected</Text>
                  <Text style={modernStyles.scanResultValue}>3 encrypted memos found</Text>
                </View>
              </View>
            </View>
          </ModernCard>
        )}

        {/* Privacy Mode Features */}
        {isPrivateMode && (
          <ModernCard variant="privacy" padding="medium" margin="medium">
            <Text style={modernStyles.sectionTitle}>🛡️ Privacy Features Active</Text>
            <View style={modernStyles.privacyFeatures}>
              <View style={modernStyles.privacyFeature}>
                <Icon name="shield" size={20} color={ModernColors.privacy.enhanced} />
                <Text style={modernStyles.privacyFeatureText}>Enhanced Privacy Mode</Text>
              </View>
              <View style={modernStyles.privacyFeature}>
                <Icon name="eye-off" size={20} color={ModernColors.privacy.enhanced} />
                <Text style={modernStyles.privacyFeatureText}>Shielded Transactions</Text>
              </View>
              <View style={modernStyles.privacyFeature}>
                <Icon name="key" size={20} color={ModernColors.privacy.enhanced} />
                <Text style={modernStyles.privacyFeatureText}>Stealth Addresses</Text>
              </View>
            </View>
          </ModernCard>
        )}
      </ScrollView>

      {/* Modern Bottom Navigation */}
      <ModernBottomNavigation
        tabs={bottomTabs}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        isPrivateMode={isPrivateMode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Navy background
    overflow: 'hidden', // Prevent any content from overflowing
  },
  // Modern Loading styles
  modernLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernLoadingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modernLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  modernLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  modernLoadingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  modernLoadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 4,
  },
  loadingDot2: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingDot3: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  // Legacy Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  // Modern Header styles
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 15, // Increased elevation to ensure it stays above content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 10, // Add explicit z-index
  },
  modernHeaderContent: {
    flex: 1,
  },
  modernWalletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  logoAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  miniLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modernWalletTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
    marginRight: 6,
  },
  modernNetworkBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modernSettingsButton: {
    padding: 8,
    zIndex: 20, // Ensure settings button stays on top
  },
  settingsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5, // Add elevation to ensure visibility
  },
  modernSettingsIcon: {
    fontSize: 18,
  },
  modernBalanceContainer: {
    alignItems: 'center',
    zIndex: 15, // Ensure balance stays visible above scroll content
    marginBottom: 10, // Add some bottom margin for better separation
  },
  modernBalanceLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernBalanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginRight: 12,
  },
  balanceVisibilityIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  modernBalanceUSD: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeIcon: {
    fontSize: 80,
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  welcomeFeatures: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  welcomeActions: {
    alignSelf: 'stretch',
    gap: 16,
    marginTop: 20,
  },
  welcomeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  importPrivateKeyButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  importPrivateKeyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#334155',
  },
  textAreaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
  },
  seedWarning: {
    fontSize: 14,
    color: '#F59E0B',
    marginTop: 12,
    lineHeight: 18,
  },
  biometricsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  biometricsLabel: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  biometricsStatus: {
    fontSize: 20,
  },
  modalActions: {
    gap: 12,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  // Existing styles
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  walletInfo: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  networkBadgeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20, // Add top padding to prevent overlap
  },
  scrollViewContent: {
    paddingBottom: 100, // Extra bottom padding for better scrolling experience
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  quickActionsCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionEmoji: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tokensCard: {
    marginBottom: 16,
  },
  transactionsCard: {
    marginBottom: 16,
  },
  featuresCard: {
    marginBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#475569',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionEmoji: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  transactionAddress: {
    fontSize: 14,
    color: '#94A3B8',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: 12,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  
  // ECLIPTA Landing Page Button Styles (prompt.txt specifications)
  ecliptaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  secondaryButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  tertiaryButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '400',
  },
  securityReminder: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  securityText: {
    fontSize: 14,
    color: '#34D399',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // ===================
  // NEW MULTI-STEP WALLET CREATION STYLES
  // ===================
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  stepDotActive: {
    backgroundColor: '#34D399',
  },
  stepDotInactive: {
    backgroundColor: '#1E293B',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  passwordStrength: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  strengthRequirements: {
    gap: 5,
  },
  requirement: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementMet: {
    color: '#10B981',
  },
  requirementUnmet: {
    color: '#EF4444',
  },
  educationHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  educationIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  educationContent: {
    gap: 20,
  },
  educationCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  educationCardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  educationCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  educationCardText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  seedPhraseContainer: {
    flex: 1,
  },
  seedPhraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  seedWord: {
    width: '30%',
    backgroundColor: '#1E293B',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  seedWordHidden: {
    backgroundColor: '#334155',
  },
  seedWordNumber: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 5,
  },
  seedWordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  revealButton: {
    backgroundColor: '#34D39920',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  revealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34D399',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  verificationContainer: {
    gap: 20,
  },
  verificationInput: {
    gap: 8,
  },
  verificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  creationProgress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creationIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  progressIndicator: {
    width: '80%',
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34D399',
    borderRadius: 2,
  },
  hardwareWalletInfo: {
    alignItems: 'center',
    padding: 20,
  },
  hardwareTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  hardwareDescription: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  hardwareList: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  hardwareItem: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  hardwareNote: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },

  // Button styles for modal footer
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  primaryActionButton: {
    backgroundColor: '#34D399',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  defiActionText: {
    color: '#10B981',
    fontWeight: '700',
  },
  // Modern Quick Actions Styles
  modernQuickActionsCard: {
    backgroundColor: '#1E293B', // Surface color
    borderRadius: 20,
    padding: 20,
    marginTop: 8, // Add top margin to ensure proper spacing
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5, // Reduced elevation to avoid z-index conflicts
    zIndex: 1, // Ensure it's above other elements but below header
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  modernQuickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    zIndex: 2, // Ensure buttons are above other elements
  },
  modernQuickAction: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8, // Add padding to increase touch area
    minHeight: 80, // Ensure minimum touch target size
  },
  modernQuickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modernQuickActionEmoji: {
    fontSize: 24,
  },
  modernQuickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  privacyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.2)',
  },
  privacyQuickAction: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8, // Add padding to increase touch area
    minHeight: 70, // Ensure minimum touch target size
  },
  privacyActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  privacyActionEmoji: {
    fontSize: 20,
  },
  privacyActionText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 12,
  },
});

// Modern Styles
const modernStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernColors.background,
  },
  
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernSpacing.xxxl,
  },
  
  lockedText: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textSecondary,
    marginBottom: ModernSpacing.xxxl,
    textAlign: 'center',
  },
  
  scrollView: {
    flex: 1,
    paddingTop: ModernSpacing.md,
  },
  
  scrollViewContent: {
    paddingBottom: 120, // Space for bottom navigation
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.lg,
  },
  
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: ModernSpacing.md,
  },
  
  viewAllContainer: {
    padding: ModernSpacing.lg,
    alignItems: 'center',
  },
  
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ModernSpacing.md,
    paddingHorizontal: ModernSpacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.divider,
  },
  
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ModernSpacing.md,
  },
  
  tokenIconText: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textInverse,
  },
  
  tokenInfo: {
    flex: 1,
  },
  
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 2,
  },
  
  tokenSymbol: {
    fontSize: 14,
    color: ModernColors.textSecondary,
  },
  
  tokenBalance: {
    alignItems: 'flex-end',
  },
  
  tokenAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 2,
  },
  
  tokenValue: {
    fontSize: 14,
    color: ModernColors.textSecondary,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: ModernSpacing.xxxl,
  },
  
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: ModernColors.textSecondary,
    marginTop: ModernSpacing.lg,
    marginBottom: ModernSpacing.xs,
  },
  
  emptyStateSubtext: {
    fontSize: 14,
    color: ModernColors.textTertiary,
    textAlign: 'center',
  },
  
  privacyControls: {
    gap: ModernSpacing.xl,
  },
  
  privacyModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: ModernColors.textPrimary,
  },
  
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.full,
    gap: ModernSpacing.sm,
  },
  
  toggleActive: {
    backgroundColor: ModernColors.privacy.enhanced,
  },
  
  toggleInactive: {
    backgroundColor: ModernColors.textTertiary,
  },
  
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textInverse,
  },
  
  privacyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: ModernSpacing.lg,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: ModernBorderRadius.md,
  },
  
  statItem: {
    alignItems: 'center',
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ModernColors.privacy.enhanced,
    marginBottom: ModernSpacing.xs,
  },
  
  statLabel: {
    fontSize: 12,
    color: ModernColors.textSecondary,
  },
  
  ensInfo: {
    gap: ModernSpacing.xl,
  },
  
  ensProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernSpacing.md,
  },
  
  ensAvatar: {
    width: 48,
    height: 48,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  ensAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: ModernColors.textInverse,
  },
  
  ensName: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 2,
  },
  
  ensAddress: {
    fontSize: 14,
    color: ModernColors.textSecondary,
    fontFamily: 'monospace',
  },
  
  scannerInfo: {
    alignItems: 'center',
    gap: ModernSpacing.lg,
  },
  
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textPrimary,
  },
  
  scannerDescription: {
    fontSize: 14,
    color: ModernColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  scanResults: {
    alignSelf: 'stretch',
    gap: ModernSpacing.md,
  },
  
  scanResult: {
    backgroundColor: ModernColors.surfaceSecondary,
    padding: ModernSpacing.md,
    borderRadius: ModernBorderRadius.md,
  },
  
  scanResultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.xs,
  },
  
  scanResultValue: {
    fontSize: 12,
    color: ModernColors.textSecondary,
  },
  
  privacyFeatures: {
    gap: ModernSpacing.md,
  },
  
  privacyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernSpacing.md,
  },
  
  privacyFeatureText: {
    fontSize: 16,
    color: ModernColors.textPrimary,
    fontWeight: '500',
  },
});

export default HomeNew;
