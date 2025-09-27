import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useWallet } from '../../context/WalletContext';
import { useTheme } from '../../context/ThemeContext';
import { Token } from '../../types';

interface TokenDetailScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
  route: {
    params?: {
      token: Token;
    };
  };
  onNavigate: (screen: string, params?: any) => void;
  token?: Token;
}

const TokenDetailScreen: React.FC<TokenDetailScreenProps> = ({
  navigation,
  route,
  onNavigate,
  token: propToken,
}) => {
  const { state } = useWallet();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [tokenStats, setTokenStats] = useState({
    price: '$0.00',
    change24h: '0.00%',
    marketCap: 'N/A',
    volume24h: 'N/A',
    circulatingSupply: 'N/A',
  });

  // Get token from props or route params
  const token = propToken || route?.params?.token;

  const styles = createStyles(colors);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (token) {
      loadTokenData();
    }
  }, [token]);

  const loadTokenData = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      // Mock data for now - in a real app, you'd fetch from CoinGecko, CoinMarketCap, etc.
      const mockPriceHistory = Array.from({ length: 30 }, (_, i) => 
        Math.random() * 100 + 50
      );
      
      setPriceHistory(mockPriceHistory);
      setTokenStats({
        price: typeof token.price === 'string' ? token.price : `$${token.price || '0.00'}`,
        change24h: `${(Math.random() * 20 - 10).toFixed(2)}%`,
        marketCap: '$' + (Math.random() * 1000000000).toFixed(0),
        volume24h: '$' + (Math.random() * 10000000).toFixed(0),
        circulatingSupply: (Math.random() * 1000000000).toFixed(0),
      });
    } catch (error) {
      console.error('Error loading token data:', error);
      Alert.alert('Error', 'Failed to load token data');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (onNavigate) {
      onNavigate('send', { token });
    } else if (navigation) {
      navigation.navigate('send', { token });
    }
  };

  const handleSwap = () => {
    if (onNavigate) {
      onNavigate('swap', { token });
    } else if (navigation) {
      navigation.navigate('swap', { token });
    }
  };

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Token Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Token not found</Text>
        </View>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 2,
    color: (opacity = 1) => colors.primary + Math.floor(opacity * 255).toString(16),
    labelColor: (opacity = 1) => colors.textSecondary + Math.floor(opacity * 255).toString(16),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{token.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Token Info */}
        <View style={styles.tokenInfo}>
          <View style={styles.tokenHeader}>
            <View style={styles.tokenIcon}>
              <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            </View>
            <View style={styles.tokenDetails}>
              <Text style={styles.tokenName}>{token.name}</Text>
              <Text style={styles.tokenSymbolText}>{token.symbol}</Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Your Balance</Text>
            <Text style={styles.balanceAmount}>
              {token.balance || '0'} {token.symbol}
            </Text>
            <Text style={styles.balanceUSD}>
              {typeof token.price === 'string' ? token.price : `$${(parseFloat(token.balance || '0') * (token.price || 0)).toFixed(2)}`}
            </Text>
          </View>
        </View>

        {/* Price Chart - Placeholder */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Price Chart (30D)</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>
              Chart coming soon...
            </Text>
          </View>
        </View>

        {/* Token Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Token Statistics</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Price</Text>
            <Text style={styles.statValue}>{tokenStats.price}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>24h Change</Text>
            <Text style={[
              styles.statValue,
              { color: tokenStats.change24h.startsWith('-') ? colors.error : colors.success }
            ]}>
              {tokenStats.change24h}
            </Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Market Cap</Text>
            <Text style={styles.statValue}>{tokenStats.marketCap}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>24h Volume</Text>
            <Text style={styles.statValue}>{tokenStats.volume24h}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Circulating Supply</Text>
            <Text style={styles.statValue}>{tokenStats.circulatingSupply}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
            <Text style={styles.actionButtonText}>Swap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tokenInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tokenSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.background,
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  tokenSymbolText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  balanceContainer: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  statsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TokenDetailScreen;
