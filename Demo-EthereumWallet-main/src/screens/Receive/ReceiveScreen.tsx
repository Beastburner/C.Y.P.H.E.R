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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import Button from '../../components/Button';
// import { QuickIcon } from '../../components/AppIcon'; // Temporarily disabled
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface ReceiveScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [qrSize, setQrSize] = useState(200);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [qrData, setQrData] = useState('');
  const [qrRef, setQrRef] = useState<any>(null);

  useEffect(() => {
    // Calculate optimal QR code size based on screen width
    const optimalSize = Math.min(screenWidth * 0.6, 250);
    setQrSize(optimalSize);
    
    // Generate QR data based on current settings
    generateQRData();
  }, [state.activeAccount?.address, amount, memo]);

  const generateQRData = () => {
    if (!state.activeAccount?.address) return;

    let data = state.activeAccount.address;

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
      
      data = `ethereum:${state.activeAccount.address}?${params.toString()}`;
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
          <Text style={styles.headerTitle}>Receive {state.currentNetwork.symbol}</Text>
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
            Scan this code to send {state.currentNetwork.symbol} to your wallet
          </Text>
          
          <View style={styles.qrContainer}>
            {state.activeAccount?.address && (
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
