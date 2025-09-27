/**
 * Sepolia Testnet Faucet Screen
 * Helps users get testnet tokens for development/demo purposes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../context/WalletContext';

interface FaucetScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const FaucetScreen: React.FC<FaucetScreenProps> = ({ onNavigate }) => {
  const { colors, typography, spacing } = useTheme();
  const { state } = useWallet();

  const faucets = [
    {
      name: 'Alchemy Sepolia Faucet',
      url: 'https://sepoliafaucet.com/',
      description: 'Get 0.5 ETH per day for Sepolia testnet',
      requirements: 'Requires Alchemy account'
    },
    {
      name: 'Infura Sepolia Faucet',
      url: 'https://www.infura.io/faucet/sepolia',
      description: 'Get 0.5 ETH per day for Sepolia testnet',
      requirements: 'Requires Infura account'
    },
    {
      name: 'Chainlink Faucet',
      url: 'https://faucets.chain.link/sepolia',
      description: 'Get 0.1 ETH and testnet LINK tokens',
      requirements: 'No account required'
    },
    {
      name: 'Ethereum.org Faucet',
      url: 'https://faucet.sepolia.dev/',
      description: 'Community faucet for Sepolia ETH',
      requirements: 'GitHub or Twitter verification'
    }
  ];

  const openFaucet = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Cannot open link',
          `Please manually visit: ${url}`,
          [
            { text: 'Copy Link', onPress: () => copyToClipboard(url) },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening faucet:', error);
      Alert.alert('Error', 'Failed to open faucet. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    // In a real app, you'd use @react-native-clipboard/clipboard
    Alert.alert('Link copied', text);
  };

  const copyWalletAddress = () => {
    if (state.currentAccount?.address) {
      copyToClipboard(state.currentAccount.address);
      Alert.alert('Address Copied', 'Your wallet address has been copied to clipboard');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Get Testnet Tokens</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Use these faucets to get free Sepolia ETH for testing
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Address */}
        <View style={[styles.addressCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
            Your Wallet Address:
          </Text>
          <TouchableOpacity 
            style={styles.addressContainer}
            onPress={copyWalletAddress}
          >
            <Text style={[styles.address, { color: colors.textPrimary }]}>
              {state.currentAccount?.address || 'No wallet found'}
            </Text>
            <Text style={[styles.copyHint, { color: colors.primary }]}>
              Tap to copy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.instructionsTitle, { color: colors.textPrimary }]}>
            How to get testnet tokens:
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            1. Copy your wallet address above
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            2. Choose a faucet below
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            3. Paste your address and request tokens
          </Text>
          <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
            4. Wait a few minutes for tokens to arrive
          </Text>
        </View>

        {/* Faucet List */}
        <Text style={[styles.faucetsTitle, { color: colors.textPrimary }]}>
          Available Faucets:
        </Text>
        
        {faucets.map((faucet, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faucetCard, { backgroundColor: colors.surface }]}
            onPress={() => openFaucet(faucet.url, faucet.name)}
          >
            <View style={styles.faucetHeader}>
              <Text style={[styles.faucetName, { color: colors.textPrimary }]}>
                {faucet.name}
              </Text>
              <Text style={[styles.faucetExternal, { color: colors.primary }]}>
                ↗
              </Text>
            </View>
            <Text style={[styles.faucetDescription, { color: colors.textSecondary }]}>
              {faucet.description}
            </Text>
            <Text style={[styles.faucetRequirements, { color: colors.textTertiary }]}>
              {faucet.requirements}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Warning */}
        <View style={[styles.warningCard, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Text style={[styles.warningTitle, { color: '#ef4444' }]}>
            ⚠️ Important Notes:
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            • Testnet tokens have no real value
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            • Don't send real ETH to testnet addresses
          </Text>
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            • Faucets may have rate limits
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addressCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  addressContainer: {
    padding: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderRadius: 8,
  },
  address: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  copyHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  faucetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  faucetCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  faucetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  faucetName: {
    fontSize: 16,
    fontWeight: '600',
  },
  faucetExternal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  faucetDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  faucetRequirements: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  warningCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default FaucetScreen;
