/**
 * CYPHER Bridge Interface
 * Revolutionary cross-chain bridge interface for seamless asset transfers
 * Features: Multi-protocol support, optimal route finding, real-time gas estimation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import CrossChainService, { 
  BlockchainNetwork, 
  BridgeProtocol, 
  CrossChainTransaction,
  CrossChainSwapQuote
} from '../../services/CrossChainService';

const { width } = Dimensions.get('window');

interface BridgeInterfaceProps {
  navigation: any;
  route: any;
}

export default function BridgeInterface({ navigation, route }: BridgeInterfaceProps) {
  const { colors, typography, createCardStyle } = useTheme();
  const [fromChain, setFromChain] = useState<string>('ethereum');
  const [toChain, setToChain] = useState<string>('polygon');
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('hop');
  const [quote, setQuote] = useState<CrossChainSwapQuote | null>(null);
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [protocols, setProtocols] = useState<BridgeProtocol[]>([]);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [showNetworkSelector, setShowNetworkSelector] = useState<'from' | 'to' | null>(null);
  const [showProtocolSelector, setShowProtocolSelector] = useState(false);

  const crossChainService = CrossChainService.getInstance();

  useEffect(() => {
    loadBridgeData();
  }, []);

  useEffect(() => {
    if (amount && fromChain && toChain && selectedAsset) {
      generateQuote();
    }
  }, [amount, fromChain, toChain, selectedAsset, selectedProtocol]);

  const loadBridgeData = async () => {
    try {
      const networksData = crossChainService.getSupportedNetworks();
      const protocolsData = crossChainService.getBridgeProtocols();
      
      setNetworks(networksData);
      setProtocols(protocolsData);
    } catch (error) {
      console.error('Failed to load bridge data:', error);
    }
  };

  const generateQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    try {
      setQuoteLoading(true);
      const quoteData = await crossChainService.getCrossChainSwapQuote(
        selectedAsset,
        selectedAsset,
        fromChain,
        toChain,
        amount
      );
      setQuote(quoteData);
    } catch (error) {
      console.error('Failed to generate quote:', error);
      Alert.alert('Error', 'Failed to generate bridge quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const executeBridge = async () => {
    if (!quote || !amount) return;

    try {
      setLoading(true);
      
      const transaction = await crossChainService.executeBridgeTransaction(
        fromChain,
        toChain,
        selectedAsset,
        amount,
        selectedProtocol
      );

      Alert.alert(
        'Bridge Initiated',
        `Transaction ${transaction.id} has been initiated. You can track its progress in the dashboard.`,
        [
          {
            text: 'Track Transaction',
            onPress: () => navigation.navigate('TransactionDetail', { transaction })
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Failed to execute bridge:', error);
      Alert.alert('Error', 'Failed to execute bridge transaction');
    } finally {
      setLoading(false);
    }
  };

  const getChainIcon = (chainId: string): string => {
    const icons: { [key: string]: string } = {
      'ethereum': '⟠',
      'polygon': '⬢',
      'bsc': '🔸',
      'arbitrum': '🔷',
      'avalanche': '🔺'
    };
    return icons[chainId] || '⚡';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const renderNetworkSelector = (type: 'from' | 'to') => {
    const selectedChain = type === 'from' ? fromChain : toChain;
    const setChain = type === 'from' ? setFromChain : setToChain;

    return (
      <View style={[createCardStyle('elevated'), styles.selectorModal]}>
        <Text style={[styles.selectorTitle, { color: colors.textPrimary }]}>
          Select {type === 'from' ? 'Source' : 'Destination'} Chain
        </Text>
        {networks.map((network) => (
          <TouchableOpacity
            key={network.id}
            style={[
              styles.networkOption,
              selectedChain === network.id && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setChain(network.id);
              setShowNetworkSelector(null);
            }}
          >
            <Text style={styles.chainIcon}>{getChainIcon(network.id)}</Text>
            <View style={styles.networkOptionInfo}>
              <Text style={[styles.networkOptionName, { color: colors.textPrimary }]}>
                {network.name}
              </Text>
              <Text style={[styles.networkOptionGas, { color: colors.textSecondary }]}>
                Gas: {network.gas_settings.standard} gwei
              </Text>
            </View>
            {selectedChain === network.id && (
              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.error }]}
          onPress={() => setShowNetworkSelector(null)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProtocolSelector = () => {
    const availableProtocols = protocols.filter(protocol =>
      protocol.supported_chains.includes(fromChain) &&
      protocol.supported_chains.includes(toChain)
    );

    return (
      <View style={[createCardStyle('elevated'), styles.selectorModal]}>
        <Text style={[styles.selectorTitle, { color: colors.textPrimary }]}>
          Select Bridge Protocol
        </Text>
        {availableProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[
              styles.protocolOption,
              selectedProtocol === protocol.id && { backgroundColor: colors.primary + '20' }
            ]}
            onPress={() => {
              setSelectedProtocol(protocol.id);
              setShowProtocolSelector(false);
            }}
          >
            <View style={styles.protocolOptionInfo}>
              <Text style={[styles.protocolOptionName, { color: colors.textPrimary }]}>
                {protocol.name}
              </Text>
              <Text style={[styles.protocolOptionFee, { color: colors.textSecondary }]}>
                Fee: {protocol.fees.percentage_fee}% + ${protocol.fees.fixed_fee}
              </Text>
              <Text style={[styles.protocolOptionTime, { color: colors.textSecondary }]}>
                Time: {protocol.processing_time.min_minutes}-{protocol.processing_time.max_minutes} min
              </Text>
            </View>
            <View style={styles.protocolStats}>
              <Text style={[styles.protocolTvl, { color: colors.textPrimary }]}>
                TVL: {formatCurrency(protocol.tvl / 1000000)}M
              </Text>
              <View style={styles.securityRating}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Text
                    key={i}
                    style={[
                      styles.star,
                      { color: i < protocol.security_rating / 2 ? colors.warning : colors.textTertiary }
                    ]}
                  >
                    ⭐
                  </Text>
                ))}
              </View>
            </View>
            {selectedProtocol === protocol.id && (
              <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.error }]}
          onPress={() => setShowProtocolSelector(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (showNetworkSelector) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderNetworkSelector(showNetworkSelector)}
      </View>
    );
  }

  if (showProtocolSelector) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderProtocolSelector()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundSecondary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          🌉 Cross-Chain Bridge
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bridge Configuration */}
        <View style={[createCardStyle('elevated'), styles.bridgeConfig]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Bridge Configuration
          </Text>

          {/* From Chain */}
          <View style={styles.configRow}>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>From</Text>
            <TouchableOpacity
              style={[styles.chainSelector, { backgroundColor: colors.backgroundTertiary }]}
              onPress={() => setShowNetworkSelector('from')}
            >
              <Text style={styles.chainIcon}>{getChainIcon(fromChain)}</Text>
              <Text style={[styles.chainName, { color: colors.textPrimary }]}>
                {networks.find(n => n.id === fromChain)?.name || fromChain}
              </Text>
              <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <View style={styles.swapContainer}>
            <TouchableOpacity
              style={[styles.swapButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const temp = fromChain;
                setFromChain(toChain);
                setToChain(temp);
              }}
            >
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
          </View>

          {/* To Chain */}
          <View style={styles.configRow}>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>To</Text>
            <TouchableOpacity
              style={[styles.chainSelector, { backgroundColor: colors.backgroundTertiary }]}
              onPress={() => setShowNetworkSelector('to')}
            >
              <Text style={styles.chainIcon}>{getChainIcon(toChain)}</Text>
              <Text style={[styles.chainName, { color: colors.textPrimary }]}>
                {networks.find(n => n.id === toChain)?.name || toChain}
              </Text>
              <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Asset Selection */}
          <View style={styles.configRow}>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Asset</Text>
            <View style={[styles.assetSelector, { backgroundColor: colors.backgroundTertiary }]}>
              <Text style={[styles.assetSymbol, { color: colors.textPrimary }]}>
                {selectedAsset}
              </Text>
            </View>
          </View>

          {/* Amount Input */}
          <View style={styles.configRow}>
            <Text style={[styles.configLabel, { color: colors.textSecondary }]}>Amount</Text>
            <TextInput
              style={[
                styles.amountInput,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.textPrimary,
                  borderColor: colors.border
                }
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Bridge Protocol Selection */}
        <View style={[createCardStyle('elevated'), styles.protocolSelection]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Bridge Protocol
          </Text>
          <TouchableOpacity
            style={[styles.protocolSelector, { backgroundColor: colors.backgroundTertiary }]}
            onPress={() => setShowProtocolSelector(true)}
          >
            <View style={styles.protocolInfo}>
              <Text style={[styles.protocolName, { color: colors.textPrimary }]}>
                {protocols.find(p => p.id === selectedProtocol)?.name || 'Select Protocol'}
              </Text>
              <Text style={[styles.protocolFee, { color: colors.textSecondary }]}>
                {protocols.find(p => p.id === selectedProtocol)?.fees.percentage_fee}% fee
              </Text>
            </View>
            <Text style={[styles.arrow, { color: colors.textSecondary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Quote Display */}
        {(quote || quoteLoading) && (
          <View style={[createCardStyle('elevated'), styles.quoteDisplay]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Bridge Quote
            </Text>
            
            {quoteLoading ? (
              <View style={styles.quoteLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Calculating best route...
                </Text>
              </View>
            ) : quote && (
              <View>
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>
                    You'll receive
                  </Text>
                  <Text style={[styles.quoteValue, { color: colors.textPrimary }]}>
                    ~{quote.amount_out} {selectedAsset}
                  </Text>
                </View>
                
                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>
                    Price Impact
                  </Text>
                  <Text style={[styles.quoteValue, { color: colors.warning }]}>
                    {quote.price_impact.toFixed(2)}%
                  </Text>
                </View>

                <View style={styles.quoteRow}>
                  <Text style={[styles.quoteLabel, { color: colors.textSecondary }]}>
                    Total Fees
                  </Text>
                  <Text style={[styles.quoteValue, { color: colors.textPrimary }]}>
                    {formatCurrency(quote.fees.total_usd)}
                  </Text>
                </View>

                <View style={styles.feeBreakdown}>
                  <Text style={[styles.feeTitle, { color: colors.textSecondary }]}>
                    Fee Breakdown:
                  </Text>
                  <Text style={[styles.feeItem, { color: colors.textTertiary }]}>
                    • Bridge: {formatCurrency(quote.fees.breakdown.bridge_fees)}
                  </Text>
                  <Text style={[styles.feeItem, { color: colors.textTertiary }]}>
                    • Swap: {formatCurrency(quote.fees.breakdown.swap_fees)}
                  </Text>
                  <Text style={[styles.feeItem, { color: colors.textTertiary }]}>
                    • Gas: {formatCurrency(quote.fees.breakdown.gas_fees)}
                  </Text>
                </View>

                <View style={styles.routeInfo}>
                  <Text style={[styles.routeTitle, { color: colors.textSecondary }]}>
                    Route ({quote.route.steps.length} steps):
                  </Text>
                  {quote.route.steps.map((step, index) => (
                    <View key={index} style={styles.routeStep}>
                      <Text style={[styles.stepNumber, { color: colors.primary }]}>
                        {index + 1}
                      </Text>
                      <Text style={[styles.stepDescription, { color: colors.textTertiary }]}>
                        {step.action === 'bridge' ? 'Bridge' : 'Swap'} via {step.protocol}
                      </Text>
                      <Text style={[styles.stepTime, { color: colors.textTertiary }]}>
                        ~{step.estimated_time}min
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Execute Button */}
        <TouchableOpacity
          style={[
            styles.executeButton,
            {
              backgroundColor: quote && !loading ? colors.primary : colors.textTertiary,
              opacity: quote && !loading ? 1 : 0.5
            }
          ]}
          onPress={executeBridge}
          disabled={!quote || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.executeButtonText}>
              Execute Bridge Transaction
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  bridgeConfig: {
    padding: 20,
    marginBottom: 16,
  },
  configRow: {
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  chainSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
  },
  chainIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  chainName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  arrow: {
    fontSize: 12,
  },
  swapContainer: {
    alignItems: 'center' as const,
    marginVertical: 10,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  swapIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  assetSelector: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  amountInput: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600' as const,
    borderWidth: 1,
  },
  protocolSelection: {
    padding: 20,
    marginBottom: 16,
  },
  protocolSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  protocolFee: {
    fontSize: 14,
  },
  quoteDisplay: {
    padding: 20,
    marginBottom: 16,
  },
  quoteLoading: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
  },
  quoteRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  quoteLabel: {
    fontSize: 16,
  },
  quoteValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  feeBreakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  feeTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  feeItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  routeInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  routeStep: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  stepNumber: {
    width: 20,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
  },
  stepTime: {
    fontSize: 12,
  },
  executeButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginVertical: 20,
  },
  executeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  selectorModal: {
    flex: 1,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  selectorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  networkOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  networkOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  networkOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  networkOptionGas: {
    fontSize: 14,
  },
  protocolOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  protocolOptionInfo: {
    flex: 1,
  },
  protocolOptionName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  protocolOptionFee: {
    fontSize: 14,
    marginBottom: 2,
  },
  protocolOptionTime: {
    fontSize: 14,
  },
  protocolStats: {
    alignItems: 'flex-end' as const,
  },
  protocolTvl: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  securityRating: {
    flexDirection: 'row' as const,
  },
  star: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginLeft: 12,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
};
