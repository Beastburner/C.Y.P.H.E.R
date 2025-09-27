/**
 * Tier 3 - Cache Storage
 * Fast access storage for balances, prices, temporary data
 * Cleared on app restart, used for performance optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue: string;
  lastUpdated: number;
}

export interface TokenPrice {
  symbol: string;
  address: string;
  price: number;
  change24h: number;
  lastUpdated: number;
}

export interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  lastUpdated: number;
}

export interface GasEstimate {
  chainId: number;
  slow: {
    gasPrice: string;
    estimatedTime: number;
  };
  standard: {
    gasPrice: string;
    estimatedTime: number;
  };
  fast: {
    gasPrice: string;
    estimatedTime: number;
  };
  lastUpdated: number;
}

export interface DAppMetadata {
  url: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  isConnected: boolean;
  connectedAccounts: string[];
  permissions: string[];
  lastVisited: number;
  lastUpdated: number;
}

export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  route: string[];
  gasEstimate: string;
  slippage: number;
  provider: string;
  validUntil: number;
}

class CacheStorageManager {
  private readonly TOKEN_BALANCE_PREFIX = 'cache_balance_';
  private readonly TOKEN_PRICE_PREFIX = 'cache_price_';
  private readonly NFT_METADATA_PREFIX = 'cache_nft_';
  private readonly GAS_ESTIMATE_PREFIX = 'cache_gas_';
  private readonly DAPP_METADATA_PREFIX = 'cache_dapp_';
  private readonly SWAP_QUOTE_PREFIX = 'cache_swap_';
  private readonly SEARCH_HISTORY_KEY = 'cache_search_history';
  private readonly RECENT_ADDRESSES_KEY = 'cache_recent_addresses';
  private readonly PRICE_ALERTS_KEY = 'cache_price_alerts';

  private readonly CACHE_EXPIRY = {
    TOKEN_BALANCE: 30 * 1000, // 30 seconds
    TOKEN_PRICE: 60 * 1000, // 1 minute
    NFT_METADATA: 5 * 60 * 1000, // 5 minutes
    GAS_ESTIMATE: 15 * 1000, // 15 seconds
    DAPP_METADATA: 24 * 60 * 60 * 1000, // 24 hours
    SWAP_QUOTE: 30 * 1000, // 30 seconds
  };

  /**
   * Check if cached data is expired
   */
  private isExpired(lastUpdated: number, expiry: number): boolean {
    return Date.now() - lastUpdated > expiry;
  }

  /**
   * Store token balance
   */
  async storeTokenBalance(accountAddress: string, chainId: number, balance: TokenBalance): Promise<void> {
    try {
      const key = `${this.TOKEN_BALANCE_PREFIX}${chainId}_${accountAddress}_${balance.address}`;
      const data = {
        ...balance,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store token balance:', error);
    }
  }

  /**
   * Get token balance
   */
  async getTokenBalance(accountAddress: string, chainId: number, tokenAddress: string): Promise<TokenBalance | null> {
    try {
      const key = `${this.TOKEN_BALANCE_PREFIX}${chainId}_${accountAddress}_${tokenAddress}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const balance = JSON.parse(data) as TokenBalance;
      
      // Check if expired
      if (this.isExpired(balance.lastUpdated, this.CACHE_EXPIRY.TOKEN_BALANCE)) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return balance;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  }

  /**
   * Get all token balances for account
   */
  async getTokenBalancesForAccount(accountAddress: string, chainId: number): Promise<TokenBalance[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefix = `${this.TOKEN_BALANCE_PREFIX}${chainId}_${accountAddress}_`;
      const balanceKeys = keys.filter(key => key.startsWith(prefix));
      
      const balancePromises = balanceKeys.map(async (key) => {
        const data = await AsyncStorage.getItem(key);
        if (!data) return null;
        
        const balance = JSON.parse(data) as TokenBalance;
        
        // Check if expired
        if (this.isExpired(balance.lastUpdated, this.CACHE_EXPIRY.TOKEN_BALANCE)) {
          await AsyncStorage.removeItem(key);
          return null;
        }
        
        return balance;
      });
      
      const results = await Promise.all(balancePromises);
      return results.filter(Boolean) as TokenBalance[];
    } catch (error) {
      console.error('Failed to get token balances for account:', error);
      return [];
    }
  }

  /**
   * Store token price
   */
  async storeTokenPrice(price: TokenPrice): Promise<void> {
    try {
      const key = `${this.TOKEN_PRICE_PREFIX}${price.address || price.symbol}`;
      const data = {
        ...price,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store token price:', error);
    }
  }

  /**
   * Get token price
   */
  async getTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
    try {
      const key = `${this.TOKEN_PRICE_PREFIX}${tokenAddress}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const price = JSON.parse(data) as TokenPrice;
      
      // Check if expired
      if (this.isExpired(price.lastUpdated, this.CACHE_EXPIRY.TOKEN_PRICE)) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return price;
    } catch (error) {
      console.error('Failed to get token price:', error);
      return null;
    }
  }

  /**
   * Store NFT metadata
   */
  async storeNFTMetadata(nft: NFTMetadata): Promise<void> {
    try {
      const key = `${this.NFT_METADATA_PREFIX}${nft.contractAddress}_${nft.tokenId}`;
      const data = {
        ...nft,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store NFT metadata:', error);
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(contractAddress: string, tokenId: string): Promise<NFTMetadata | null> {
    try {
      const key = `${this.NFT_METADATA_PREFIX}${contractAddress}_${tokenId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const nft = JSON.parse(data) as NFTMetadata;
      
      // Check if expired
      if (this.isExpired(nft.lastUpdated, this.CACHE_EXPIRY.NFT_METADATA)) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return nft;
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  /**
   * Store gas estimates
   */
  async storeGasEstimate(chainId: number, estimate: GasEstimate): Promise<void> {
    try {
      const key = `${this.GAS_ESTIMATE_PREFIX}${chainId}`;
      const data = {
        ...estimate,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store gas estimate:', error);
    }
  }

  /**
   * Get gas estimates
   */
  async getGasEstimate(chainId: number): Promise<GasEstimate | null> {
    try {
      const key = `${this.GAS_ESTIMATE_PREFIX}${chainId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const estimate = JSON.parse(data) as GasEstimate;
      
      // Check if expired
      if (this.isExpired(estimate.lastUpdated, this.CACHE_EXPIRY.GAS_ESTIMATE)) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return estimate;
    } catch (error) {
      console.error('Failed to get gas estimate:', error);
      return null;
    }
  }

  /**
   * Store DApp metadata
   */
  async storeDAppMetadata(dapp: DAppMetadata): Promise<void> {
    try {
      const key = `${this.DAPP_METADATA_PREFIX}${dapp.url}`;
      const data = {
        ...dapp,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store DApp metadata:', error);
    }
  }

  /**
   * Get DApp metadata
   */
  async getDAppMetadata(url: string): Promise<DAppMetadata | null> {
    try {
      const key = `${this.DAPP_METADATA_PREFIX}${url}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const dapp = JSON.parse(data) as DAppMetadata;
      
      // Check if expired
      if (this.isExpired(dapp.lastUpdated, this.CACHE_EXPIRY.DAPP_METADATA)) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return dapp;
    } catch (error) {
      console.error('Failed to get DApp metadata:', error);
      return null;
    }
  }

  /**
   * Store swap quote
   */
  async storeSwapQuote(quote: SwapQuote): Promise<void> {
    try {
      const key = `${this.SWAP_QUOTE_PREFIX}${quote.fromToken}_${quote.toToken}_${quote.fromAmount}`;
      await AsyncStorage.setItem(key, JSON.stringify(quote));
    } catch (error) {
      console.error('Failed to store swap quote:', error);
    }
  }

  /**
   * Get swap quote
   */
  async getSwapQuote(fromToken: string, toToken: string, fromAmount: string): Promise<SwapQuote | null> {
    try {
      const key = `${this.SWAP_QUOTE_PREFIX}${fromToken}_${toToken}_${fromAmount}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return null;
      
      const quote = JSON.parse(data) as SwapQuote;
      
      // Check if quote is still valid
      if (Date.now() > quote.validUntil) {
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      return quote;
    } catch (error) {
      console.error('Failed to get swap quote:', error);
      return null;
    }
  }

  /**
   * Store search history
   */
  async storeSearchHistory(queries: string[]): Promise<void> {
    try {
      // Keep only last 50 searches
      const limitedQueries = queries.slice(0, 50);
      await AsyncStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(limitedQueries));
    } catch (error) {
      console.error('Failed to store search history:', error);
    }
  }

  /**
   * Get search history
   */
  async getSearchHistory(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(this.SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * Add search query
   */
  async addSearchQuery(query: string): Promise<void> {
    try {
      const history = await this.getSearchHistory();
      // Remove if already exists
      const filteredHistory = history.filter(q => q !== query);
      // Add to beginning
      const newHistory = [query, ...filteredHistory];
      await this.storeSearchHistory(newHistory);
    } catch (error) {
      console.error('Failed to add search query:', error);
    }
  }

  /**
   * Store recent addresses
   */
  async storeRecentAddresses(addresses: Array<{address: string; name?: string; lastUsed: number}>): Promise<void> {
    try {
      // Keep only last 20 addresses
      const limitedAddresses = addresses.slice(0, 20);
      await AsyncStorage.setItem(this.RECENT_ADDRESSES_KEY, JSON.stringify(limitedAddresses));
    } catch (error) {
      console.error('Failed to store recent addresses:', error);
    }
  }

  /**
   * Get recent addresses
   */
  async getRecentAddresses(): Promise<Array<{address: string; name?: string; lastUsed: number}>> {
    try {
      const data = await AsyncStorage.getItem(this.RECENT_ADDRESSES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get recent addresses:', error);
      return [];
    }
  }

  /**
   * Add recent address
   */
  async addRecentAddress(address: string, name?: string): Promise<void> {
    try {
      const addresses = await this.getRecentAddresses();
      // Remove if already exists
      const filteredAddresses = addresses.filter(a => a.address !== address);
      // Add to beginning
      const newAddresses = [{
        address,
        name,
        lastUsed: Date.now(),
      }, ...filteredAddresses];
      await this.storeRecentAddresses(newAddresses);
    } catch (error) {
      console.error('Failed to add recent address:', error);
    }
  }

  /**
   * Clear expired cache items
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      const expiredKeys: string[] = [];
      
      for (const key of cacheKeys) {
        try {
          const data = await AsyncStorage.getItem(key);
          if (!data) continue;
          
          const parsed = JSON.parse(data);
          const lastUpdated = parsed.lastUpdated || 0;
          
          let isExpired = false;
          
          if (key.includes('balance_')) {
            isExpired = this.isExpired(lastUpdated, this.CACHE_EXPIRY.TOKEN_BALANCE);
          } else if (key.includes('price_')) {
            isExpired = this.isExpired(lastUpdated, this.CACHE_EXPIRY.TOKEN_PRICE);
          } else if (key.includes('nft_')) {
            isExpired = this.isExpired(lastUpdated, this.CACHE_EXPIRY.NFT_METADATA);
          } else if (key.includes('gas_')) {
            isExpired = this.isExpired(lastUpdated, this.CACHE_EXPIRY.GAS_ESTIMATE);
          } else if (key.includes('dapp_')) {
            isExpired = this.isExpired(lastUpdated, this.CACHE_EXPIRY.DAPP_METADATA);
          } else if (key.includes('swap_')) {
            const validUntil = parsed.validUntil || 0;
            isExpired = Date.now() > validUntil;
          }
          
          if (isExpired) {
            expiredKeys.push(key);
          }
        } catch (error) {
          // If we can't parse the data, consider it expired
          expiredKeys.push(key);
        }
      }
      
      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        console.log(`Cleared ${expiredKeys.length} expired cache items`);
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        console.log(`Cleared ${cacheKeys.length} cache items`);
      }
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalItems: number;
    balances: number;
    prices: number;
    nfts: number;
    gasEstimates: number;
    dapps: number;
    swapQuotes: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      return {
        totalItems: cacheKeys.length,
        balances: cacheKeys.filter(key => key.includes('balance_')).length,
        prices: cacheKeys.filter(key => key.includes('price_')).length,
        nfts: cacheKeys.filter(key => key.includes('nft_')).length,
        gasEstimates: cacheKeys.filter(key => key.includes('gas_')).length,
        dapps: cacheKeys.filter(key => key.includes('dapp_')).length,
        swapQuotes: cacheKeys.filter(key => key.includes('swap_')).length,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalItems: 0,
        balances: 0,
        prices: 0,
        nfts: 0,
        gasEstimates: 0,
        dapps: 0,
        swapQuotes: 0,
      };
    }
  }
}

export const cacheStorage = new CacheStorageManager();
