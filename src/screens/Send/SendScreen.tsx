import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import Button from '../../components/Button';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../../styles/ModernTheme';
import { CypherHeaderLogo } from '../../components/CypherLogo';

interface SendScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const SendScreen: React.FC<SendScreenProps> = ({ onNavigate }) => {
  const { sendTransaction, state } = useWallet();
  const { colors, typography, components, createCardStyle, createInputStyle, createButtonStyle } = useTheme();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatBalance = (balance: string): string => {
    try {
      const balanceNum = parseFloat(balance);
      return balanceNum.toFixed(6);
    } catch {
      return '0.000000';
    }
  };

  const handleSend = async () => {
    if (!toAddress.trim()) {
      Alert.alert('Error', 'Please enter a recipient address');
      return;
    }

    if (!amount.trim() || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > parseFloat(state.balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Basic address validation
    if (!toAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      Alert.alert('Error', 'Please enter a valid Ethereum address');
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await sendTransaction(toAddress, amount);
      Alert.alert(
        'Transaction Sent!',
        `Transaction hash: ${txHash.slice(0, 20)}...`,
        [{ text: 'OK', onPress: () => onNavigate('Home') }]
      );
    } catch (error) {
      console.error('Send transaction error:', error);
      Alert.alert('Error', 'Failed to send transaction. Please try again.');
    }
    setIsLoading(false);
  };

  const setMaxAmount = () => {
    // Leave some ETH for gas fees
    const maxAmount = Math.max(0, parseFloat(state.balance) - 0.001);
    setAmount(maxAmount.toString());
  };

  const cardStyle = createCardStyle('elevated');
  const inputStyle = createInputStyle('default');
  const headerButtonStyle = createButtonStyle('ghost');
  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={ModernColors.primaryGradient[0]} />
      
      {/* Modern Header with Gradient */}
      <LinearGradient 
        colors={ModernColors.primaryGradient} 
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Icon name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <CypherHeaderLogo color="light" showText={false} />
            <Text style={[styles.headerTitle, { color: colors.textInverse }]}>
              Send {state.currentNetwork.symbol}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Scan QR', 'QR Scanner coming soon!')}
          >
            <Icon name="maximize" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatBalance(state.balance)} {state.currentNetwork.symbol}
          </Text>
          <Text style={styles.balanceUSD}>
            Network: {state.currentNetwork.name}
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Recipient Address</Text>
            <TextInput
              value={toAddress}
              onChangeText={setToAddress}
              placeholder="0x... or ENS name"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.amountHeader}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TouchableOpacity onPress={setMaxAmount}>
                <Text style={styles.maxButton}>MAX</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.amountInputContainer}>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
              <Text style={styles.currencyLabel}>{state.currentNetwork.symbol}</Text>
            </View>
            <Text style={styles.usdValue}>
              Amount to send: {amount || '0'} {state.currentNetwork.symbol}
            </Text>
          </View>

          <View style={styles.feeContainer}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Network Fee</Text>
              <Text style={styles.feeAmount}>≈ 0.001 ETH</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {(parseFloat(amount || '0') + 0.001).toFixed(6)} ETH
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <Button
          title="Send Transaction"
          onPress={handleSend}
          loading={isLoading}
          disabled={!toAddress.trim() || !amount.trim() || isLoading}
          fullWidth
          style={styles.sendButton}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Modern Header Styles
  headerGradient: {
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.md,
    minHeight: 60,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ModernColors.textInverse,
    marginLeft: ModernSpacing.sm,
  },
  backButton: {
    padding: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    padding: ModernSpacing.xs,
    borderRadius: ModernBorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Legacy styles (keeping for compatibility)
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    ...colors.shadows?.medium,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  formContainer: {
    marginTop: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  maxButton: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 16,
  },
  amountInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  usdValue: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
    textAlign: 'right',
  },
  feeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sendButton: {
    backgroundColor: colors.primary,
  },
});

export default SendScreen;
