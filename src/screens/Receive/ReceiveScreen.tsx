import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Clipboard,
  Share,
  TextInput,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import Button from '../../components/Button';
// import { QuickIcon } from '../../components/AppIcon'; // Temporarily disabled
import { useWallet } from '../../context/WalletContext';
import { usePrivacyWallet } from '../../context/PrivacyWalletContext';
import { useTheme } from '../../context/ThemeContext';
import NetworkDebug from '../../components/NetworkDebug';

const { width: screenWidth } = Dimensions.get('window');

interface ReceiveScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const { state: privacyState, togglePrivateMode, createAlias } = usePrivacyWallet();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);        
  const [qrSize, setQrSize] = useState(200);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [qrData, setQrData] = useState('');
  const [qrRef, setQrRef] = useState<any>(null);
  const [usePrivateMode, setUsePrivateMode] = useState(privacyState.isPrivateMode);
  const [isGeneratingAlias, setIsGeneratingAlias] = useState(false);

  useEffect(() => {
    // Calculate optimal QR code size based on screen width
    const optimalSize = Math.min(screenWidth * 0.6, 250);
    setQrSize(optimalSize);
    
    // Generate QR data based on current settings
    generateQRData();
  }, [state.activeAccount?.address, amount, memo]);

  const generateQRData = async () => {
    if (!state.activeAccount?.address) return;

    let data = state.activeAccount.address;

    // If using private mode, generate a commitment-based address
    if (usePrivateMode && privacyState.aliases.length > 0) {
      // Use the first available alias for privacy
      data = privacyState.aliases[0];
    } else if (usePrivateMode) {
      // Show privacy address placeholder
      data = 'cypher://private-receive?commitment=pending';
    }

    // If amount or memo is specified, create EIP-681 payment URI
    if (amount || memo) {
      const params = new URLSearchParams();
      if (amount) {
        // Convert amount to wei (multiply by 10^18)
        const amountInWei = (parseFloat(amount) * Math.pow(10, 18)).toString();
        params.append('value', amountInWei);
      }
      if (memo) {
        params.append('message', memo);
      }
      if (usePrivateMode) {
        params.append('privacy', 'true');
      }
      
      const protocol = usePrivateMode ? 'cypher' : 'ethereum';
      data = `${protocol}:${data}?${params.toString()}`;
    }

    setQrData(data);
  };

  const copyAddress = async () => {
    if (state.activeAccount?.address) {
      await Clipboard.setString(state.activeAccount.address);
      setCopied(true);
      Alert.alert('Copied!', 'Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyQRData = async () => {
    if (qrData) {
      await Clipboard.setString(qrData);
      Alert.alert('Copied!', 'Payment request copied to clipboard');
    }
  };

  const shareAddress = async () => {
    if (state.activeAccount?.address) {
      try {
        const message = amount || memo 
          ? `CYPHER Payment Request:\n${qrData}`
          : `My CYPHER Wallet Address: ${state.activeAccount.address}`;
          
        await Share.share({
          message,
          title: 'CYPHER Wallet',
        });
      } catch (error) {
        Alert.alert('Error', 'Could not share address');
      }
    }
  };

  const openQRScanner = () => {
    onNavigate('QRScanner');
  };

  const handleCreateAlias = async () => {
    try {
      setIsGeneratingAlias(true);
      const aliasAddress = await createAlias(`Receive alias for ${state.activeAccount?.address}`);
      Alert.alert(
        'Privacy Alias Created',
        `New privacy alias created: ${aliasAddress.slice(0, 10)}...${aliasAddress.slice(-8)}`,
        [{ text: 'OK', onPress: generateQRData }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create privacy alias. Please try again.');
      console.error('Failed to create alias:', error);
    } finally {
      setIsGeneratingAlias(false);
    }
  };

  const togglePrivacyMode = () => {
    setUsePrivateMode(!usePrivateMode);
    generateQRData();
  };

  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Receive {state.currentNetwork.symbol}</Text>
            <View style={styles.privacyModeContainer}>
              <Text style={styles.privacyModeLabel}>
                {usePrivateMode ? '🔒 Private' : '🌐 Public'}
              </Text>
              <Switch
                value={usePrivateMode}
                onValueChange={togglePrivacyMode}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={usePrivateMode ? colors.textPrimary : colors.textSecondary}
                style={styles.privacySwitch}
              />
            </View>
          </View>
          <TouchableOpacity 
            style={styles.scanButton}
            onPress={openQRScanner}
          >
            <Text style={styles.scanIcon}>📱</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Code Section */}
        <View style={styles.qrCard}>
          <Text style={styles.cardTitle}>QR Code</Text>
          <Text style={styles.cardSubtitle}>
            {usePrivateMode ? 
              'Scan this code to send private payments to your shielded address' : 
              `Scan this code to send ${state.currentNetwork.symbol} to your wallet`
            }
          </Text>
          
          <View style={styles.qrContainer}>
            {usePrivateMode && privacyState.aliases.length === 0 ? (
              <View style={styles.privacyPlaceholder}>
                <Text style={styles.privacyPlaceholderIcon}>🔒</Text>
                <Text style={styles.privacyPlaceholderText}>
                  Create a privacy alias to receive anonymous payments
                </Text>
                <TouchableOpacity 
                  style={styles.createAliasButton}
                  onPress={handleCreateAlias}
                  disabled={isGeneratingAlias}
                >
                  <Text style={styles.createAliasButtonText}>
                    {isGeneratingAlias ? 'Creating...' : 'Create Privacy Alias'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : state.activeAccount?.address && (
              <QRCode
                value={qrData || state.activeAccount.address}
                size={qrSize}
                color="#000000"
                backgroundColor="#ffffff"
                quietZone={10}
                getRef={(c) => setQrRef(c)}
              />
            )}
          </View>

          <View style={styles.qrActions}>
            <TouchableOpacity 
              style={styles.qrActionButton}
              onPress={copyQRData}
            >
              <Text style={styles.qrActionText}>Copy Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.qrActionButton}
              onPress={shareAddress}
            >
              <Text style={styles.qrActionText}>Share QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advanced Payment Request */}
        <View style={styles.advancedCard}>
          <TouchableOpacity 
            style={styles.advancedHeader}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <Text style={styles.advancedTitle}>Payment Request</Text>
            <Text style={styles.chevron}>{showAdvanced ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          
          {showAdvanced && (
            <View style={styles.advancedContent}>
              <Text style={styles.advancedSubtitle}>
                Create a payment request with specific amount and memo
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount ({state.currentNetwork.symbol})</Text>
                <TextInput
                  style={styles.textInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Memo (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={memo}
                  onChangeText={setMemo}
                  placeholder="Payment description..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={2}
                />
              </View>
              
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={generateQRData}
              >
                <Text style={styles.generateButtonText}>Update QR Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Address Details */}
        <View style={styles.addressCard}>
          <Text style={styles.cardTitle}>Your Wallet Address</Text>
          <Text style={styles.cardSubtitle}>
            Manual address for transactions
          </Text>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressText}>
              {state.activeAccount?.address || 'Loading...'}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.copyButton}
            onPress={copyAddress}
          >
            <Text style={styles.copyButtonText}>
              {copied ? '✓ Copied' : 'Copy Address'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Information */}
        {usePrivateMode && (
          <View style={styles.privacyInfoCard}>
            <View style={styles.privacyInfoHeader}>
              <Text style={styles.privacyInfoIcon}>🔒</Text>
              <Text style={styles.privacyInfoTitle}>Privacy Mode Active</Text>
            </View>
            <Text style={styles.privacyInfoText}>
              • Payments to this address will be shielded using zero-knowledge proofs
            </Text>
            <Text style={styles.privacyInfoText}>
              • Transaction amounts and sender details are hidden on the blockchain
            </Text>
            <Text style={styles.privacyInfoText}>
              • Only you can view the true balance and transaction history
            </Text>
            {privacyState.aliases.length > 0 && (
              <View style={styles.aliasInfo}>
                <Text style={styles.aliasInfoTitle}>Active Privacy Aliases: {privacyState.aliases.length}</Text>
                <Text style={styles.aliasInfoText}>Privacy Score: {privacyState.privacySettings.privacyScore}/100</Text>
              </View>
            )}
          </View>
        )}

        {/* Security Warning */}
        <View style={styles.warningCard}>
          <View style={styles.warningTitleContainer}>
            <Text style={[styles.warningIcon, { color: colors.warning }]}>⚠️</Text>
            <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>Security Notice</Text>
          </View>
          <Text style={styles.warningText}>
            • Only send {state.currentNetwork.name} ({state.currentNetwork.symbol}) and ERC-20 tokens to this address
          </Text>
          <Text style={styles.warningText}>
            • Always verify the address before sending funds
          </Text>
          <Text style={styles.warningText}>
            • Keep your recovery phrase secure and private
          </Text>
        </View>

        {/* Network Debug Info */}
        <NetworkDebug />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  privacyModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  privacyModeLabel: {
    fontSize: 12,
    color: colors.textPrimary,
    marginRight: 8,
    fontWeight: '600',
  },
  privacySwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    ...colors.shadows?.medium,
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...colors.shadows?.small,
  },
  qrActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  qrActionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  qrActionText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  privacyPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  privacyPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  privacyPlaceholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  createAliasButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  createAliasButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  privacyInfoCard: {
    backgroundColor: colors.success + '20',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  privacyInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyInfoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  privacyInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  privacyInfoText: {
    fontSize: 14,
    color: colors.success,
    lineHeight: 20,
    marginBottom: 4,
  },
  aliasInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aliasInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  aliasInfoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  advancedCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...colors.shadows?.medium,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  advancedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  advancedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  advancedSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    ...colors.shadows?.medium,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addressContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressText: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  copyButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  warningTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning,
    lineHeight: 18,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default ReceiveScreen;
