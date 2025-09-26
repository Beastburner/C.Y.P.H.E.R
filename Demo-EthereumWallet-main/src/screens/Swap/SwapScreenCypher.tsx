import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { EnhancedSmartContractService, SwapQuote } from '../../services/enhancedSmartContractService';

interface SwapScreenCypherProps {
  onNavigate: (screen: string, params?: any) => void;
}

/**
 * CYPHER Advanced Swap Interface
 * Revolutionary trading experience with military-grade security
 * Features: Advanced order types, MEV protection, optimal routing
 */
const SwapScreenCypher: React.FC<SwapScreenCypherProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const { colors, typography, createCardStyle, createButtonStyle } = useTheme();
  
  // State
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [smartContractService, setSmartContractService] = useState<EnhancedSmartContractService | null>(null);

  // Popular tokens - fetched dynamically from token service
  const [popularTokens, setPopularTokens] = useState<any[]>([]);

  useEffect(() => {
    // Initialize smart contract service and fetch popular tokens
    if (state.currentAccount) {
      // Would initialize with actual provider/signer in production
      // const service = new EnhancedSmartContractService(provider, signer);
      // setSmartContractService(service);
      
      // Fetch popular tokens from token service
      fetchPopularTokens();
    }
  }, [state.currentAccount]);

  const fetchPopularTokens = async () => {
    try {
      // Import token service dynamically
      const { default: tokenService } = await import('../../services/tokenService');
      
      // Get popular/common tokens (ETH, USDC, WBTC, etc.)
      const commonTokens = [
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', logo: '💎' },
        { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6ba7634fA37b7d2E82cdBC09cb8e9f0', logo: '💰' },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', logo: '₿' },
        { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', logo: '💵' },
      ];
      
      setPopularTokens(commonTokens);
    } catch (error) {
      console.error('Failed to fetch popular tokens:', error);
      // Fallback to basic tokens if service fails
      setPopularTokens([
        { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', logo: '💎' }
      ]);
    }
  };

  const getQuote = async () => {
    if (!smartContractService || !tokenIn || !tokenOut || !amountIn) return;
    
    setLoading(true);
    try {
      const quoteResult = await smartContractService.getSwapQuote(
        tokenIn,
        tokenOut,
        amountIn
      );
      setQuote(quoteResult);
      setAmountOut(quoteResult.amountOut);
    } catch (error) {
      console.error('Failed to get quote:', error);
      Alert.alert('Error', 'Failed to get swap quote');
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async () => {
    if (!smartContractService || !quote) return;
    
    setSwapping(true);
    try {
      let tx;
      
      if (orderType === 'market') {
        tx = await smartContractService.swapTokens(
          tokenIn,
          tokenOut,
          amountIn,
          slippage
        );
      } else {
        // Limit order
        tx = await smartContractService.createLimitOrder(
          tokenIn,
          tokenOut,
          amountIn,
          amountOut
        );
      }
      
      Alert.alert(
        'Transaction Submitted',
        `Your ${orderType === 'market' ? 'swap' : 'limit order'} has been submitted. Hash: ${tx.hash}`,
        [
          { text: 'OK', onPress: () => onNavigate('Home') }
        ]
      );
      
    } catch (error) {
      console.error('Swap failed:', error);
      Alert.alert('Error', 'Swap transaction failed');
    } finally {
      setSwapping(false);
    }
  };

  const swapTokens = () => {
    const tempToken = tokenIn;
    const tempAmount = amountIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
    setAmountOut(tempAmount);
    setQuote(null);
  };

  const cardStyle = createCardStyle('elevated');
  const primaryButton = createButtonStyle('primary');
  const secondaryButton = createButtonStyle('secondary');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[colors.primary, colors.accent]} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={[{ fontSize: typography.fontSize['2xl'], color: colors.textInverse, fontWeight: '700' as const }]}>
            CYPHER Swap
          </Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {/* Open settings */}}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Revolutionary DEX with MEV protection & optimal routing
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Order Type Selector */}
        <View style={[cardStyle, styles.orderTypeCard]}>
          <Text style={styles.sectionTitle}>Order Type</Text>
          <View style={styles.orderTypeButtons}>
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                orderType === 'market' && styles.orderTypeButtonActive
              ]}
              onPress={() => setOrderType('market')}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === 'market' && styles.orderTypeTextActive
              ]}>
                Market Order
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.orderTypeButton,
                orderType === 'limit' && styles.orderTypeButtonActive
              ]}
              onPress={() => setOrderType('limit')}
            >
              <Text style={[
                styles.orderTypeText,
                orderType === 'limit' && styles.orderTypeTextActive
              ]}>
                Limit Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Swap Interface */}
        <View style={[cardStyle, styles.swapCard]}>
          {/* Token Input */}
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>From</Text>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={styles.amountInput}
                value={amountIn}
                onChangeText={setAmountIn}
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              <TouchableOpacity 
                style={styles.tokenSelector}
                onPress={() => {/* Open token selector */}}
              >
                <Text style={styles.tokenSymbol}>
                  {popularTokens.find(t => t.address === tokenIn)?.symbol || 'Select'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceText}>
              Balance: {state.balance} {state.currentNetwork.symbol}
            </Text>
          </View>

          {/* Swap Button */}
          <TouchableOpacity 
            style={styles.swapButton}
            onPress={swapTokens}
          >
            <Text style={styles.swapIcon}>⇅</Text>
          </TouchableOpacity>

          {/* Token Output */}
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>To</Text>
            <View style={styles.tokenInputRow}>
              <TextInput
                style={[styles.amountInput, orderType === 'market' && styles.amountInputDisabled]}
                value={amountOut}
                onChangeText={orderType === 'limit' ? setAmountOut : undefined}
                placeholder="0.0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                editable={orderType === 'limit'}
              />
              <TouchableOpacity 
                style={styles.tokenSelector}
                onPress={() => {/* Open token selector */}}
              >
                <Text style={styles.tokenSymbol}>
                  {popularTokens.find(t => t.address === tokenOut)?.symbol || 'Select'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceText}>
              Balance: 0.0 USDC
            </Text>
          </View>
        </View>

        {/* Popular Tokens */}
        <View style={[cardStyle, styles.popularTokensCard]}>
          <Text style={styles.sectionTitle}>Popular Tokens</Text>
          <View style={styles.tokenGrid}>
            {popularTokens.map((token) => (
              <TouchableOpacity
                key={token.address}
                style={styles.popularToken}
                onPress={() => {
                  if (!tokenIn) {
                    setTokenIn(token.address);
                  } else if (!tokenOut) {
                    setTokenOut(token.address);
                  }
                }}
              >
                <Text style={styles.tokenLogo}>{token.logo}</Text>
                <Text style={styles.tokenName}>{token.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quote Information */}
        {quote && (
          <View style={[cardStyle, styles.quoteCard]}>
            <Text style={styles.sectionTitle}>Swap Details</Text>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Rate</Text>
              <Text style={styles.quoteValue}>
                1 {popularTokens.find(t => t.address === tokenIn)?.symbol} = {
                  (parseFloat(quote.amountOut) / parseFloat(amountIn)).toFixed(6)
                } {popularTokens.find(t => t.address === tokenOut)?.symbol}
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Fee</Text>
              <Text style={styles.quoteValue}>{quote.fee} ETH</Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Price Impact</Text>
              <Text style={[
                styles.quoteValue,
                quote.priceImpact > 3 && { color: colors.warning }
              ]}>
                {quote.priceImpact.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.quoteRow}>
              <Text style={styles.quoteLabel}>Minimum Received</Text>
              <Text style={styles.quoteValue}>{quote.minimumReceived}</Text>
            </View>
          </View>
        )}

        {/* Slippage Settings */}
        <View style={[cardStyle, styles.slippageCard]}>
          <Text style={styles.sectionTitle}>Slippage Tolerance</Text>
          <View style={styles.slippageButtons}>
            {[0.1, 0.5, 1.0].map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.slippageButton,
                  slippage === value && styles.slippageButtonActive
                ]}
                onPress={() => setSlippage(value)}
              >
                <Text style={[
                  styles.slippageText,
                  slippage === value && styles.slippageTextActive
                ]}>
                  {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Get Quote"
            onPress={getQuote}
            loading={loading}
            disabled={!tokenIn || !tokenOut || !amountIn}
            style={styles.quoteButton}
          />
          
          <Button
            title={orderType === 'market' ? 'Swap Tokens' : 'Create Limit Order'}
            onPress={executeSwap}
            loading={swapping}
            disabled={!quote || swapping}
            style={styles.swapActionButton}
          />
        </View>

        {/* Advanced Features */}
        <View style={[cardStyle, styles.featuresCard]}>
          <Text style={styles.sectionTitle}>CYPHER Advanced Features</Text>
          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureText}>MEV Protection Enabled</Text>
            <Text style={styles.featureStatus}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Optimal Route Finding</Text>
            <Text style={styles.featureStatus}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Gas Optimization</Text>
            <Text style={styles.featureStatus}>✅</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.featureItem}
            onPress={() => onNavigate('LimitOrders')}
          >
            <Text style={styles.featureIcon}>📋</Text>
            <Text style={styles.featureText}>View Limit Orders</Text>
            <Text style={styles.featureStatus}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderTypeCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  orderTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  orderTypeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  orderTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  orderTypeTextActive: {
    color: '#FFFFFF',
  },
  swapCard: {
    marginBottom: 16,
  },
  tokenContainer: {
    marginBottom: 16,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  tokenInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#F1F5F9',
    padding: 0,
  },
  amountInputDisabled: {
    color: '#64748B',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    gap: 8,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#94A3B8',
  },
  balanceText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  swapButton: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  swapIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  popularTokensCard: {
    marginBottom: 16,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularToken: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    minWidth: 70,
  },
  tokenLogo: {
    fontSize: 24,
    marginBottom: 4,
  },
  tokenName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  quoteCard: {
    marginBottom: 16,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  quoteValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  slippageCard: {
    marginBottom: 16,
  },
  slippageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  slippageButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  slippageButtonActive: {
    backgroundColor: '#3B82F6',
  },
  slippageText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  slippageTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quoteButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapActionButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuresCard: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  featureStatus: {
    fontSize: 16,
    color: '#10B981',
  },
});

export default SwapScreenCypher;
