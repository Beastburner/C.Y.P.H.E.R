import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
// Clipboard functionality removed - use @react-native-clipboard/clipboard package
const Clipboard = {
  getString: async () => '',
  setString: async (content: string) => console.log('Clipboard:', content)
};
import Button from '../../components/Button';
import Card from '../../components/Card';
// import OptimizedTextInput from '../../components/OptimizedTextInput'; // Removed due to theme issues
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { validateMnemonic, shuffleWords } from '../../utils/bip39Helpers';
import { walletService } from '../../services/WalletService';

const { width } = Dimensions.get('window');

type Screen = 'Onboarding' | 'CreateWallet' | 'ImportWallet' | 'Home';

interface CreateWalletScreenProps {
  onNavigate: (screen: Screen) => void;
  initialMode?: 'create' | 'import';
}

const CreateWalletScreen: React.FC<CreateWalletScreenProps> = ({ onNavigate, initialMode }) => {
  const { createWallet, importWallet, state } = useWallet();
  const { colors } = useTheme();
  
  // Determine mode and initial step
  const [mode, setMode] = useState<'create' | 'import'>(initialMode || 'create');
  const [importType, setImportType] = useState<'mnemonic' | 'privatekey'>('mnemonic');
  const [step, setStep] = useState(initialMode ? (initialMode === 'import' ? 2 : 1) : 0);
  const [mnemonic, setMnemonic] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [importPrivateKey, setImportPrivateKey] = useState('');
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode === 'create') {
      generateMnemonic();
    }
  }, [mode]);

  const generateMnemonic = async () => {
    try {
      // Use the proper WalletService to generate a valid BIP39 mnemonic
      const generatedMnemonic = await walletService.createMnemonic();
      const generatedWords = generatedMnemonic.split(' ');
      
      setMnemonic(generatedMnemonic);
      setMnemonicWords(generatedWords);
      console.log('✅ Recovery phrase generated successfully:', generatedWords.length, 'words');
    } catch (error) {
      console.error('Failed to generate mnemonic:', error);
    }
  };

  const handleContinueFromMnemonic = () => {
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }
    
    // Shuffle words for confirmation
    const shuffled = shuffleWords(mnemonicWords);
    setShuffledWords(shuffled);
    setStep(2);
  };

  const handleWordSelect = (word: string) => {
    if (selectedWords.length < mnemonicWords.length) {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleWordRemove = (index: number) => {
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
  };

  const copyToClipboard = (text: string, message: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', message);
  };

  const copyWord = (word: string, index: number) => {
    copyToClipboard(word, `Word ${index + 1} "${word}" copied to clipboard`);
  };

  const copyEntirePhrase = () => {
    copyToClipboard(mnemonic, 'Entire recovery phrase copied to clipboard');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getString();
      if (text.trim()) {
        if (importType === 'mnemonic') {
          setImportMnemonic(text.trim());
        } else {
          setImportPrivateKey(text.trim());
        }
        Alert.alert('Pasted!', 'Content pasted from clipboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  // Optimized callbacks to prevent TextInput re-renders
  const handleMnemonicChange = useCallback((text: string) => {
    setImportMnemonic(text);
  }, []);

  const handlePrivateKeyChange = useCallback((text: string) => {
    setImportPrivateKey(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  const handleConfirmMnemonic = () => {
    const isCorrect = JSON.stringify(selectedWords) === JSON.stringify(mnemonicWords);
    
    if (!isCorrect) {
      Alert.alert(
        'Incorrect Order',
        'The words are not in the correct order. Please try again.',
        [{ text: 'OK', onPress: () => setSelectedWords([]) }]
      );
      return;
    }
    
    setStep(3);
  };

  const handleCreateWallet = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      
      if (mode === 'create') {
        await createWallet({
          mnemonic,
          password,
          enableBiometrics: false,
        });
      } else {
        // Import wallet mode - use the mnemonic or private key from the previous step
        if (importType === 'privatekey') {
          // Import from private key - for now use importWallet but with special handling
          await importWallet(mnemonic); // This will be handled in WalletContext
        } else {
          // Import from mnemonic
          await importWallet(mnemonic);
        }
      }
      
      onNavigate('Home');
    } catch (error) {
      console.error('Wallet creation/import error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create/import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (importType === 'mnemonic') {
      const trimmedMnemonic = importMnemonic.trim();
      
      if (!trimmedMnemonic) {
        Alert.alert('Error', 'Please enter your recovery phrase');
        return;
      }

      // Basic validation - should be 12 words
      const words = trimmedMnemonic.split(' ');
      if (words.length !== 12) {
        Alert.alert('Error', 'Recovery phrase should contain exactly 12 words.');
        return;
      }

      // Move to password step
      setMnemonic(trimmedMnemonic);
      setStep(3);
    } else {
      // Private key import
      const trimmedKey = importPrivateKey.trim();
      
      if (!trimmedKey) {
        Alert.alert('Error', 'Please enter your private key');
        return;
      }

      // Basic validation - should be 64 characters (without 0x) or 66 characters (with 0x)
      if (!(trimmedKey.length === 64 || (trimmedKey.startsWith('0x') && trimmedKey.length === 66))) {
        Alert.alert('Error', 'Private key should be 64 characters long (or 66 with 0x prefix).');
        return;
      }

      // Move to password step  
      setMnemonic(trimmedKey); // Store in mnemonic field for now
      setStep(3);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card padding="lg">
        <Text style={styles.title}>Secure Your Wallet</Text>
        <Text style={styles.subtitle}>
          Write down these 12 words in the exact order shown. Keep them safe and never share them with anyone.
        </Text>

        <View style={styles.mnemonicContainer}>
          {mnemonicWords.map((word, index) => (
            <View key={index} style={styles.wordContainer}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <Text style={styles.word}>{word}</Text>
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={() => copyWord(word, index)}
              >
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.copyAllContainer}>
          <Button
            title="📋 Copy All Words"
            variant="outline"
            onPress={copyEntirePhrase}
            style={styles.copyAllButton}
          />
        </View>

        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            If you lose these words, you will lose access to your wallet forever. 
            Write them down on paper and store them in a safe place.
          </Text>
        </View>

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={[
              styles.checkbox,
              agreedToTerms ? styles.checkboxChecked : null
            ]}
          >
            <Text style={styles.checkboxIcon}>
              {agreedToTerms ? '✓' : ''}
            </Text>
          </TouchableOpacity>
          <Text style={styles.checkboxText}>
            I have written down my recovery phrase in a safe place
          </Text>
        </View>

        <Button
          title="Continue"
          onPress={handleContinueFromMnemonic}
          disabled={!agreedToTerms}
          fullWidth
          style={styles.continueButton}
        />
      </Card>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card padding="lg">
        <Text style={styles.title}>Confirm Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Select the words in the correct order to confirm you've written them down correctly.
        </Text>

        {/* Selected words */}
        <View style={styles.selectedWordsContainer}>
          {selectedWords.map((word, index) => (
            <Button
              key={`selected-${index}`}
              title={`${index + 1}. ${word}`}
              variant="secondary"
              size="small"
              onPress={() => handleWordRemove(index)}
              style={styles.selectedWord}
            />
          ))}
          {Array.from({ length: mnemonicWords.length - selectedWords.length }).map((_, index) => (
            <View key={`empty-${index}`} style={styles.emptySlot}>
              <Text style={styles.emptySlotText}>{selectedWords.length + index + 1}</Text>
            </View>
          ))}
        </View>

        {/* Shuffled words */}
        <View style={styles.shuffledWordsContainer}>
          {shuffledWords
            .filter(word => !selectedWords.includes(word))
            .map((word, index) => (
              <Button
                key={`shuffled-${index}`}
                title={word}
                variant="outline"
                size="small"
                onPress={() => handleWordSelect(word)}
                style={styles.shuffledWord}
              />
            ))}
        </View>

        <Button
          title="Confirm"
          onPress={handleConfirmMnemonic}
          disabled={selectedWords.length !== mnemonicWords.length}
          fullWidth
          style={styles.continueButton}
        />
      </Card>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card padding="lg">
        <Text style={styles.title}>Set Password</Text>
        <Text style={styles.subtitle}>
          Create a password to secure your wallet. You'll need this to unlock your wallet.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry={true}
            placeholder="Enter password"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry={true}
            placeholder="Confirm password"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <Button
          title="Create Wallet"
          onPress={handleCreateWallet}
          loading={isLoading}
          disabled={!password || !confirmPassword || password !== confirmPassword}
          fullWidth
          style={styles.continueButton}
        />
      </Card>
    </ScrollView>
  );

  const renderModeSelection = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card padding="lg">
        <Text style={styles.title}>Setup Your Wallet</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to get started with your Ethereum wallet.
        </Text>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.modeButtonActive]}
            onPress={() => setMode('create')}
          >
            <Text style={styles.modeIcon}>🆕</Text>
            <Text style={[styles.modeTitle, mode === 'create' && styles.modeTextActive]}>
              Create New Wallet
            </Text>
            <Text style={[styles.modeDescription, mode === 'create' && styles.modeTextActive]}>
              Generate a new wallet with a secure recovery phrase
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'import' && styles.modeButtonActive]}
            onPress={() => setMode('import')}
          >
            <Text style={styles.modeIcon}>📥</Text>
            <Text style={[styles.modeTitle, mode === 'import' && styles.modeTextActive]}>
              Import Existing Wallet
            </Text>
            <Text style={[styles.modeDescription, mode === 'import' && styles.modeTextActive]}>
              Restore your wallet using your recovery phrase
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Continue"
          onPress={() => setStep(mode === 'import' ? 2 : 1)}
          fullWidth
          style={styles.continueButton}
        />

        <Button
          title="← Back"
          variant="ghost"
          onPress={() => onNavigate('Onboarding')}
          fullWidth
          style={styles.backButton}
        />
      </Card>
    </ScrollView>
  );

  const renderImportWallet = () => (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card padding="lg">
        <Text style={styles.title}>Import Wallet</Text>
        <Text style={styles.subtitle}>
          Choose how you want to import your existing wallet.
        </Text>

        {/* Import Type Selection */}
        <View style={styles.importTypeContainer}>
          <TouchableOpacity
            style={[styles.importTypeButton, importType === 'mnemonic' && styles.importTypeActive]}
            onPress={() => setImportType('mnemonic')}
          >
            <Text style={[styles.importTypeText, importType === 'mnemonic' && styles.importTypeTextActive]}>
              📝 Recovery Phrase
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.importTypeButton, importType === 'privatekey' && styles.importTypeActive]}
            onPress={() => setImportType('privatekey')}
          >
            <Text style={[styles.importTypeText, importType === 'privatekey' && styles.importTypeTextActive]}>
              🔑 Private Key
            </Text>
          </TouchableOpacity>
        </View>

        {/* Import Input */}
        {importType === 'mnemonic' ? (
          <View style={styles.inputContainer}>
            <View style={styles.inputHeaderContainer}>
              <Text style={styles.inputLabel}>Recovery Phrase (12 words)</Text>
              <TouchableOpacity style={styles.pasteButton} onPress={pasteFromClipboard}>
                <Text style={styles.pasteText}>Paste</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={importMnemonic}
              onChangeText={handleMnemonicChange}
              placeholder="Enter your 12-word recovery phrase separated by spaces"
              placeholderTextColor={colors.textSecondary}
              multiline={true}
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.mnemonicInput]}
            />
            <Text style={styles.inputHint}>
              Enter each word separated by a space. Make sure there are no extra spaces.
            </Text>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputHeaderContainer}>
              <Text style={styles.inputLabel}>Private Key</Text>
              <TouchableOpacity style={styles.pasteButton} onPress={pasteFromClipboard}>
                <Text style={styles.pasteText}>Paste</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={importPrivateKey}
              onChangeText={handlePrivateKeyChange}
              placeholder="Enter your private key (64 characters)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={true}
              style={styles.input}
            />
            <Text style={styles.inputHint}>
              Enter your private key without spaces. Can start with 0x or not.
            </Text>
          </View>
        )}

        <Button
          title="Import Wallet"
          onPress={handleImportWallet}
          disabled={importType === 'mnemonic' ? !importMnemonic.trim() : !importPrivateKey.trim()}
          fullWidth
          style={styles.continueButton}
        />

        <Button
          title="← Back"
          variant="ghost"
          onPress={() => setStep(0)}
          fullWidth
          style={styles.backButton}
        />
      </Card>
    </ScrollView>
  );

  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {step === 0 && renderModeSelection()}
      {step === 1 && mode === 'create' && renderStep1()}
      {step === 2 && mode === 'create' && renderStep2()}
      {step === 2 && mode === 'import' && renderImportWallet()}
      {step === 3 && renderStep3()}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    width: (width - 80) / 2,
  },
  wordNumber: {
    fontSize: 12,
    color: colors.textTertiary,
    marginRight: 8,
    minWidth: 20,
  },
  word: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.border || colors.textTertiary,
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkboxIcon: {
    color: colors.white || '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 16,
  },
  selectedWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedWord: {
    margin: 4,
  },
  emptySlot: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptySlotText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  shuffledWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  shuffledWord: {
    margin: 4,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  modeContainer: {
    gap: 16,
    marginBottom: 32,
  },
  modeButton: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  modeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  modeIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modeTextActive: {
    color: colors.primary,
  },
  backButton: {
    marginTop: 16,
  },
  mnemonicInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 8,
    lineHeight: 16,
  },
  importTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  importTypeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  importTypeActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  importTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  importTypeTextActive: {
    color: colors.primary,
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 4,
    backgroundColor: colors.backgroundSecondary,
  },
  copyIcon: {
    fontSize: 12,
  },
  copyAllContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  copyAllButton: {
    paddingHorizontal: 24,
  },
  inputHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pasteButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pasteText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CreateWalletScreen;
