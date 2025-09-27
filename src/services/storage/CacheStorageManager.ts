/**
 * Tier 3 - Cache Storage Manager
 * Handles temporary cache data like balances, prices, and API responses
 * Optimized for fast access and automatic cleanup
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BalanceCache {
  address: string;
  networkId: string;
  balance: string;
  tokenBalances: { [tokenAddress: string]: string };
  lastUpdated: number;
  expiresAt: number;
}

export interface PriceCache {
  symbol: string;
  priceUsd: number;
  change24h: number;
  lastUpdated: number;
  expiresAt: number;
}

export interface NetworkCache {
  networkId: string;
  blockNumber: number;
  gasPrice: string;
  lastUpdated: number;
  expiresAt: number;
}

export interface ApiResponseCache {
  key: string;
  data: any;
  lastUpdated: number;
  expiresAt: number;
}

export class CacheStorageManager {
  private static readonly BALANCE_CACHE_KEY = 'BALANCE_CACHE';
  private static readonly PRICE_CACHE_KEY = 'PRICE_CACHE';
  private static readonly NETWORK_CACHE_KEY = 'NETWORK_CACHE';
  private static readonly API_CACHE_KEY = 'API_RESPONSE_CACHE';
  
  // Cache durations in milliseconds
  private static readonly BALANCE_CACHE_DURATION = 30 * 1000; // 30 seconds
  private static readonly PRICE_CACHE_DURATION = 60 * 1000; // 1 minute
  private static readonly NETWORK_CACHE_DURATION = 15 * 1000; // 15 seconds
  private static readonly API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize cache storage and cleanup expired data
   */
  public static async initialize(): Promise<void> {
    try {
      await this.cleanupExpiredCache();
      
      // Set up periodic cleanup
      setInterval(() => {
        this.cleanupExpiredCache().catch(console.error);
      }, 5 * 60 * 1000); // Cleanup every 5 minutes
    } catch (error) {
      console.error('Failed to initialize cache storage:', error);
    }
  }

  /**
   * Store balance cache
   */
  public static async storeBalanceCache(cache: Omit<BalanceCache, 'lastUpdated' | 'expiresAt'>): Promise<void> {
    try {
      const now = Date.now();
      const balanceCache: BalanceCache = {
        ...cache,
        lastUpdated: now,
        expiresAt: now + this.BALANCE_CACHE_DURATION
      };

      const existingCache = await this.getAllBalanceCache();
      const updatedCache = existingCache.filter(
        c => !(c.address === cache.address && c.networkId === cache.networkId)
      );
      updatedCache.push(balanceCache);

      await AsyncStorage.setItem(this.BALANCE_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to store balance cache:', error);
    }
  }

  /**
   * Get balance cache
   */
  public static async getBalanceCache(address: string, networkId: string): Promise<BalanceCache | null> {
    try {
      const allCache = await this.getAllBalanceCache();
      const cache = allCache.find(c => c.address === address && c.networkId === networkId);
      
      if (!cache || cache.expiresAt < Date.now()) {
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Failed to get balance cache:', error);
      return null;
    }
  }

  /**
   * Get all balance cache (internal use)
   */
  private static async getAllBalanceCache(): Promise<BalanceCache[]> {
    try {
      const data = await AsyncStorage.getItem(this.BALANCE_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Store price cache
   */
  public static async storePriceCache(symbol: string, priceUsd: number, change24h: number): Promise<void> {
    try {
      const now = Date.now();
      const priceCache: PriceCache = {
        symbol: symbol.toLowerCase(),
        priceUsd,
        change24h,
        lastUpdated: now,
        expiresAt: now + this.PRICE_CACHE_DURATION
      };

      const existingCache = await this.getAllPriceCache();
      const updatedCache = existingCache.filter(c => c.symbol !== symbol.toLowerCase());
      updatedCache.push(priceCache);

      await AsyncStorage.setItem(this.PRICE_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to store price cache:', error);
    }
  }

  /**
   * Get price cache
   */
  public static async getPriceCache(symbol: string): Promise<PriceCache | null> {
    try {
      const allCache = await this.getAllPriceCache();
      const cache = allCache.find(c => c.symbol === symbol.toLowerCase());
      
      if (!cache || cache.expiresAt < Date.now()) {
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Failed to get price cache:', error);
      return null;
    }
  }

  /**
   * Get all price cache (internal use)
   */
  private static async getAllPriceCache(): Promise<PriceCache[]> {
    try {
      const data = await AsyncStorage.getItem(this.PRICE_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Store network cache
   */
  public static async storeNetworkCache(networkId: string, blockNumber: number, gasPrice: string): Promise<void> {
    try {
      const now = Date.now();
      const networkCache: NetworkCache = {
        networkId,
        blockNumber,
        gasPrice,
        lastUpdated: now,
        expiresAt: now + this.NETWORK_CACHE_DURATION
      };

      const existingCache = await this.getAllNetworkCache();
      const updatedCache = existingCache.filter(c => c.networkId !== networkId);
      updatedCache.push(networkCache);

      await AsyncStorage.setItem(this.NETWORK_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to store network cache:', error);
    }
  }

  /**
   * Get network cache
   */
  public static async getNetworkCache(networkId: string): Promise<NetworkCache | null> {
    try {
      const allCache = await this.getAllNetworkCache();
      const cache = allCache.find(c => c.networkId === networkId);
      
      if (!cache || cache.expiresAt < Date.now()) {
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Failed to get network cache:', error);
      return null;
    }
  }

  /**
   * Get all network cache (internal use)
   */
  private static async getAllNetworkCache(): Promise<NetworkCache[]> {
    try {
      const data = await AsyncStorage.getItem(this.NETWORK_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Store generic API response cache
   */
  public static async storeApiCache(key: string, data: any, customDuration?: number): Promise<void> {
    try {
      const now = Date.now();
      const duration = customDuration || this.API_CACHE_DURATION;
      
      const apiCache: ApiResponseCache = {
        key,
        data,
        lastUpdated: now,
        expiresAt: now + duration
      };

      const existingCache = await this.getAllApiCache();
      const updatedCache = existingCache.filter(c => c.key !== key);
      updatedCache.push(apiCache);

      await AsyncStorage.setItem(this.API_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to store API cache:', error);
    }
  }

  /**
   * Get API cache
   */
  public static async getApiCache(key: string): Promise<any | null> {
    try {
      const allCache = await this.getAllApiCache();
      const cache = allCache.find(c => c.key === key);
      
      if (!cache || cache.expiresAt < Date.now()) {
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('Failed to get API cache:', error);
      return null;
    }
  }

  /**
   * Get all API cache (internal use)
   */
  private static async getAllApiCache(): Promise<ApiResponseCache[]> {
    try {
      const data = await AsyncStorage.getItem(this.API_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Invalidate specific cache
   */
  public static async invalidateCache(type: 'balance' | 'price' | 'network' | 'api', key?: string): Promise<void> {
    try {
      switch (type) {
        case 'balance':
          if (key) {
            const [address, networkId] = key.split(':');
            const cache = await this.getAllBalanceCache();
            const filtered = cache.filter(c => !(c.address === address && c.networkId === networkId));
            await AsyncStorage.setItem(this.BALANCE_CACHE_KEY, JSON.stringify(filtered));
          } else {
            await AsyncStorage.removeItem(this.BALANCE_CACHE_KEY);
          }
          break;
          
        case 'price':
          if (key) {
            const cache = await this.getAllPriceCache();
            const filtered = cache.filter(c => c.symbol !== key.toLowerCase());
            await AsyncStorage.setItem(this.PRICE_CACHE_KEY, JSON.stringify(filtered));
          } else {
            await AsyncStorage.removeItem(this.PRICE_CACHE_KEY);
          }
          break;
          
        case 'network':
          if (key) {
            const cache = await this.getAllNetworkCache();
            const filtered = cache.filter(c => c.networkId !== key);
            await AsyncStorage.setItem(this.NETWORK_CACHE_KEY, JSON.stringify(filtered));
          } else {
            await AsyncStorage.removeItem(this.NETWORK_CACHE_KEY);
          }
          break;
          
        case 'api':
          if (key) {
            const cache = await this.getAllApiCache();
            const filtered = cache.filter(c => c.key !== key);
            await AsyncStorage.setItem(this.API_CACHE_KEY, JSON.stringify(filtered));
          } else {
            await AsyncStorage.removeItem(this.API_CACHE_KEY);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  }

  /**
   * Clear all cache data
   */
  public static async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.BALANCE_CACHE_KEY,
        this.PRICE_CACHE_KEY,
        this.NETWORK_CACHE_KEY,
        this.API_CACHE_KEY
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public static async getCacheStats(): Promise<{
    balanceCacheSize: number;
    priceCacheSize: number;
    networkCacheSize: number;
    apiCacheSize: number;
    totalCacheSize: number;
  }> {
    try {
      const [balanceCache, priceCache, networkCache, apiCache] = await Promise.all([
        this.getAllBalanceCache(),
        this.getAllPriceCache(),
        this.getAllNetworkCache(),
        this.getAllApiCache()
      ]);

      return {
        balanceCacheSize: balanceCache.length,
        priceCacheSize: priceCache.length,
        networkCacheSize: networkCache.length,
        apiCacheSize: apiCache.length,
        totalCacheSize: balanceCache.length + priceCache.length + networkCache.length + apiCache.length
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        balanceCacheSize: 0,
        priceCacheSize: 0,
        networkCacheSize: 0,
        apiCacheSize: 0,
        totalCacheSize: 0
      };
    }
  }

  /**
   * Cleanup expired cache entries
   */
  public static async cleanupExpiredCache(): Promise<void> {
    try {
      const now = Date.now();

      // Cleanup balance cache
      const balanceCache = await this.getAllBalanceCache();
      const validBalanceCache = balanceCache.filter(c => c.expiresAt > now);
      await AsyncStorage.setItem(this.BALANCE_CACHE_KEY, JSON.stringify(validBalanceCache));

      // Cleanup price cache
      const priceCache = await this.getAllPriceCache();
      const validPriceCache = priceCache.filter(c => c.expiresAt > now);
      await AsyncStorage.setItem(this.PRICE_CACHE_KEY, JSON.stringify(validPriceCache));

      // Cleanup network cache
      const networkCache = await this.getAllNetworkCache();
      const validNetworkCache = networkCache.filter(c => c.expiresAt > now);
      await AsyncStorage.setItem(this.NETWORK_CACHE_KEY, JSON.stringify(validNetworkCache));

      // Cleanup API cache
      const apiCache = await this.getAllApiCache();
      const validApiCache = apiCache.filter(c => c.expiresAt > now);
      await AsyncStorage.setItem(this.API_CACHE_KEY, JSON.stringify(validApiCache));

    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }
}

export default CacheStorageManager;
