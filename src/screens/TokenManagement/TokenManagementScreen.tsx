import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import tokenService from '../../services/tokenService';
import { useWallet } from '../../context/WalletContext';

interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance?: string;
  balanceFormatted?: string;
  balanceUSD?: number;
  price?: number;
  chainId: number;
}

interface TokenManagementScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

const TokenManagementScreen: React.FC<TokenManagementScreenProps> = ({ onNavigate }) => {
  const { state, currentAccount, selectedNetwork } = useWallet();
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (currentAccount?.address && selectedNetwork?.chainId) {
      loadTokens();
    }
  }, [currentAccount?.address, selectedNetwork?.chainId]);

  const loadTokens = async () => {
    if (!currentAccount?.address || !selectedNetwork?.chainId) return;
    
    try {
      setLoading(true);
      const tokenList = await tokenService.getAllTokenBalances(
        currentAccount.address,
        selectedNetwork.chainId
      );
      setTokens(tokenList);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      Alert.alert('Error', 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!newTokenAddress.trim() || !selectedNetwork?.chainId) {
      Alert.alert('Error', 'Please enter a valid token address');
      return;
    }
    
    try {
      setLoading(true);
      const token = await tokenService.addCustomToken(
        newTokenAddress.trim(),
        selectedNetwork.chainId
      );
      
      if (token) {
        Alert.alert('Success', `Added ${token.symbol} token`);
        setNewTokenAddress('');
        setShowAddForm(false);
        await loadTokens();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  const renderTokenItem = (token: Token, index: number) => {
    const balanceValue = parseFloat(token.balanceFormatted || '0');
    
    return (
      <View key={`${token.address}-${index}`} style={styles.tokenItem}>
        <View style={styles.tokenLeft}>
          <View style={styles.tokenIconPlaceholder}>
            <Text style={styles.tokenIconText}>
              {token.symbol.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.tokenInfo}>
            <Text style={styles.tokenSymbol}>{token.symbol}</Text>
            <Text style={styles.tokenName} numberOfLines={1}>
              {token.name}
            </Text>
            <Text style={styles.tokenAddress} numberOfLines={1}>
              {token.address === 'native' ? 'Native Token' : 
               `${token.address.substring(0, 6)}...${token.address.substring(38)}`}
            </Text>
          </View>
        </View>

        <View style={styles.tokenRight}>
          <Text style={styles.tokenBalance}>
            {balanceValue.toFixed(4)}
          </Text>
          <Text style={styles.tokenSymbolSmall}>{token.symbol}</Text>
          {token.balanceUSD !== undefined && (
            <Text style={styles.tokenBalanceUSD}>
              ${token.balanceUSD.toFixed(2)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onNavigate && (
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => onNavigate('Home')}
            >
              <Text style={styles.homeButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Token Management</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {showAddForm && (
        <View style={styles.addTokenForm}>
          <TextInput
            style={styles.addTokenInput}
            placeholder="Enter token contract address (0x...)"
            value={newTokenAddress}
            onChangeText={setNewTokenAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.addTokenButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.addButton, { opacity: loading ? 0.5 : 1 }]}
              onPress={handleAddToken}
              disabled={loading || !newTokenAddress.trim()}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {loading ? 'Adding...' : 'Add Token'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showAddForm && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ Add Custom Token</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.tokenList}>
        {loading && tokens.length === 0 ? (
          <Text style={styles.loadingText}>Loading tokens...</Text>
        ) : tokens.length === 0 ? (
          <Text style={styles.emptyText}>No tokens found</Text>
        ) : (
          tokens.map((token, index) => renderTokenItem(token, index))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  homeButtonText: {
    fontSize: 18,
    color: '#333',
  },
  placeholder: {
    width: 36,
  },
  addTokenForm: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addTokenButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  controls: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#fff',
  },
  tokenList: {
    padding: 16,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hiddenTokenItem: {
    opacity: 0.6,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  noBalanceItem: {
    opacity: 0.7,
  },
  tokenLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  customBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 4,
  },
  tokenName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  tokenAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  tokenSymbolSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tokenBalanceUSD: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  priceChange: {
    fontSize: 12,
    marginTop: 2,
  },
  priceChangePositive: {
    color: '#4CAF50',
  },
  priceChangeNegative: {
    color: '#f44336',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  addTokenCard: {
    padding: 20,
  },
  addTokenLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  addTokenInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },

  tokenDetailsCard: {
    padding: 20,
  },
  tokenDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenDetailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  tokenDetailIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tokenDetailIconText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  tokenDetailInfo: {
    flex: 1,
  },
  tokenDetailSymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  tokenDetailName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  tokenDetailStats: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  tokenActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  dangerButton: {
    backgroundColor: '#fff0f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
  dangerText: {
    color: '#ff6b6b',
  },
});

export default TokenManagementScreen;
