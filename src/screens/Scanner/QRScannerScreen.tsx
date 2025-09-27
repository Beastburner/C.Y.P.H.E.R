import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import QRCodeScanner from '../../components/QRCodeScanner';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';

interface QRScannerScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const { colors } = useTheme();
  const [scanMode, setScanMode] = useState<'address' | 'payment' | 'general'>('general');

  const handleScanSuccess = useCallback((data: string) => {
    console.log('📱 QR Scanner received data:', data);
    
    try {
      // Process different types of QR codes
      if (isEthereumAddress(data)) {
        // Ethereum address detected
        Alert.alert(
          'Ethereum Address Detected',
          `Address: ${data}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Send to Address', 
              onPress: () => onNavigate('send', { recipient: data })
            },
            { 
              text: 'Copy Address', 
              onPress: () => {
                // Copy to clipboard functionality would go here
                Alert.alert('Copied', 'Address copied to clipboard');
              }
            }
          ]
        );
      } else if (isBitcoinAddress(data)) {
        // Bitcoin address detected
        Alert.alert(
          'Bitcoin Address Detected',
          `Address: ${data}\n\nNote: This wallet currently supports Ethereum addresses only.`,
          [{ text: 'OK' }]
        );
      } else if (isPaymentURI(data)) {
        // Payment URI detected (BIP21, EIP-681)
        const paymentData = parsePaymentURI(data);
        Alert.alert(
          'Payment Request Detected',
          `To: ${paymentData.address}\nAmount: ${paymentData.amount || 'Not specified'}\nMemo: ${paymentData.memo || 'None'}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Create Transaction', 
              onPress: () => onNavigate('send', paymentData)
            }
          ]
        );
      } else if (isWalletConnectURI(data)) {
        // WalletConnect URI detected
        Alert.alert(
          'WalletConnect Request',
          'Connect to DApp?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Connect', 
              onPress: () => {
                // WalletConnect integration would go here
                Alert.alert('Feature Coming Soon', 'WalletConnect integration will be available in a future update.');
              }
            }
          ]
        );
      } else if (isSeedPhrase(data)) {
        // Seed phrase detected (security warning)
        Alert.alert(
          '⚠️ Security Warning',
          'This appears to be a seed phrase or private key. Never share this with anyone!',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Import Wallet', 
              onPress: () => onNavigate('ImportWallet', { seedPhrase: data })
            }
          ]
        );
      } else if (isURL(data)) {
        // URL detected
        Alert.alert(
          'Website Link Detected',
          `URL: ${data}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open in Browser', 
              onPress: () => onNavigate('Browser', { url: data })
            }
          ]
        );
      } else {
        // Generic text/data
        Alert.alert(
          'QR Code Scanned',
          `Content: ${data}`,
          [
            { text: 'OK' },
            { 
              text: 'Copy', 
              onPress: () => {
                // Copy to clipboard functionality would go here
                Alert.alert('Copied', 'Content copied to clipboard');
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert('Error', 'Failed to process QR code data.');
    }
  }, [onNavigate]);

  const handleClose = useCallback(() => {
    onNavigate('home');
  }, [onNavigate]);

  // Validation functions
  const isEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isBitcoinAddress = (address: string): boolean => {
    // Bitcoin Legacy addresses
    const btcLegacyPattern = /^[13][a-zA-Z0-9]{25,34}$/;
    // Bitcoin SegWit addresses
    const btcSegwitPattern = /^bc1[a-zA-Z0-9]{39,59}$/;
    
    return btcLegacyPattern.test(address) || btcSegwitPattern.test(address);
  };

  const isPaymentURI = (uri: string): boolean => {
    return uri.startsWith('ethereum:') || uri.startsWith('bitcoin:');
  };

  const isWalletConnectURI = (uri: string): boolean => {
    return uri.startsWith('wc:');
  };

  const isSeedPhrase = (text: string): boolean => {
    const words = text.trim().split(/\s+/);
    return words.length === 12 || words.length === 24;
  };

  const isURL = (text: string): boolean => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  // Payment URI parser
  const parsePaymentURI = (uri: string): any => {
    try {
      if (uri.startsWith('ethereum:')) {
        const parts = uri.substring(9).split('?');
        const address = parts[0];
        const params = new URLSearchParams(parts[1] || '');
        
        return {
          address,
          amount: params.get('value'),
          memo: params.get('data') || params.get('message'),
          gas: params.get('gas'),
          gasPrice: params.get('gasPrice'),
        };
      } else if (uri.startsWith('bitcoin:')) {
        const parts = uri.substring(8).split('?');
        const address = parts[0];
        const params = new URLSearchParams(parts[1] || '');
        
        return {
          address,
          amount: params.get('amount'),
          memo: params.get('message') || params.get('label'),
        };
      }
    } catch (error) {
      console.error('Error parsing payment URI:', error);
    }
    
    return { address: uri };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Scan Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'general' && styles.modeButtonActive]}
          onPress={() => setScanMode('general')}
        >
          <Text style={[styles.modeButtonText, scanMode === 'general' && styles.modeButtonTextActive]}>
            General
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'address' && styles.modeButtonActive]}
          onPress={() => setScanMode('address')}
        >
          <Text style={[styles.modeButtonText, scanMode === 'address' && styles.modeButtonTextActive]}>
            Addresses
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.modeButton, scanMode === 'payment' && styles.modeButtonActive]}
          onPress={() => setScanMode('payment')}
        >
          <Text style={[styles.modeButtonText, scanMode === 'payment' && styles.modeButtonTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Component */}
      <QRCodeScanner
        onScanSuccess={handleScanSuccess}
        onClose={handleClose}
        title="Scan QR Code"
        subtitle={
          scanMode === 'address' 
            ? 'Scan cryptocurrency addresses'
            : scanMode === 'payment'
            ? 'Scan payment requests'
            : 'Scan any QR code'
        }
        showGalleryButton={true}
        showFlashButton={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'space-around',
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modeButtonActive: {
    backgroundColor: '#4f46e5',
  },
  modeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});

export default QRScannerScreen;
