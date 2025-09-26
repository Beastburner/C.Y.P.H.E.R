import { getValue } from '../utils/storageHelpers';

interface PriceData {
  usd: number;
  usd_24h_change?: number;
  last_updated?: string;
}

interface TokenPrices {
  [key: string]: PriceData;
}

class PriceService {
  private static instance: PriceService;
  private cache = new Map<string, { data: PriceData; timestamp: number }>();
  private readonly CACHE_DURATION = 60000; // 1 minute
  private readonly COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
  
  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  /**
   * Get price for a specific token
   */
  async getPrice(tokenId: string = 'ethereum'): Promise<PriceData> {
    const cacheKey = tokenId.toLowerCase();
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.COINGECKO_API_URL}/simple/price?ids=${tokenId}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const tokenData = data[tokenId];
      
      if (!tokenData) {
        throw new Error(`Price data not found for token: ${tokenId}`);
      }

      const priceData: PriceData = {
        usd: tokenData.usd,
        usd_24h_change: tokenData.usd_24h_change,
        last_updated: tokenData.last_updated_at,
      };

      // Cache the result
      this.cache.set(cacheKey, { data: priceData, timestamp: Date.now() });
      
      return priceData;
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cached price data');
        return cached.data;
      }
      
      // Return 0 when price data is unavailable to show N/A in UI
      return {
        usd: 0, // No fallback price - will show N/A in UI
        usd_24h_change: 0,
        last_updated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(tokenIds: string[]): Promise<TokenPrices> {
    const tokenIdsString = tokenIds.join(',');
    
    try {
      const response = await fetch(
        `${this.COINGECKO_API_URL}/simple/price?ids=${tokenIdsString}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const result: TokenPrices = {};

      for (const tokenId of tokenIds) {
        const tokenData = data[tokenId];
        if (tokenData) {
          const priceData: PriceData = {
            usd: tokenData.usd,
            usd_24h_change: tokenData.usd_24h_change,
            last_updated: tokenData.last_updated_at,
          };
          
          result[tokenId] = priceData;
          // Cache individual token data
          this.cache.set(tokenId.toLowerCase(), { data: priceData, timestamp: Date.now() });
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch multiple price data:', error);
      
      // Return cached data for available tokens
      const result: TokenPrices = {};
      for (const tokenId of tokenIds) {
        const cached = this.cache.get(tokenId.toLowerCase());
        if (cached) {
          result[tokenId] = cached.data;
        }
      }
      
      return result;
    }
  }

  /**
   * Get ETH price (most common use case)
   */
  async getETHPrice(): Promise<number> {
    const priceData = await this.getPrice('ethereum');
    return priceData.usd;
  }

  /**
   * Get network-specific token price
   */
  async getNetworkTokenPrice(networkName: string): Promise<PriceData> {
    const tokenMapping: { [key: string]: string } = {
      'ethereum': 'ethereum',
      'mainnet': 'ethereum',
      'sepolia': 'ethereum',
      'goerli': 'ethereum',
      'polygon': 'matic-network',
      'matic': 'matic-network',
      'bsc': 'binancecoin',
      'binance': 'binancecoin',
      'arbitrum': 'ethereum', // Arbitrum uses ETH
      'optimism': 'ethereum', // Optimism uses ETH
      'avalanche': 'avalanche-2',
      'fantom': 'fantom',
    };

    const tokenId = tokenMapping[networkName.toLowerCase()] || 'ethereum';
    return this.getPrice(tokenId);
  }

  /**
   * Clear cached price data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format price with proper decimals
   */
  formatPrice(price: number, decimals: number = 2): string {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
      });
    }
    
    return price.toFixed(decimals);
  }

  /**
   * Format 24h change with color indication
   */
  formatPriceChange(change: number): { text: string; isPositive: boolean } {
    const isPositive = change >= 0;
    const formatted = Math.abs(change).toFixed(2);
    
    return {
      text: `${isPositive ? '+' : '-'}${formatted}%`,
      isPositive,
    };
  }
}

export default PriceService;
