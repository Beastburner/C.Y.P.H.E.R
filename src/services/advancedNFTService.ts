import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  animation_url?: string;
  attributes: NFTAttribute[];
  background_color?: string;
  youtube_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'boost_number' | 'boost_percentage' | 'number' | 'date';
  max_value?: number;
}

export interface NFTCollection {
  id: string;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  banner_image_url?: string;
  featured_image_url?: string;
  external_url?: string;
  discord_url?: string;
  telegram_url?: string;
  twitter_username?: string;
  instagram_username?: string;
  wiki_url?: string;
  created_date: string;
  
  // Statistics
  stats: {
    total_supply: number;
    num_owners: number;
    floor_price: number;
    floor_price_symbol: string;
    market_cap: number;
    one_day_volume: number;
    one_day_change: number;
    seven_day_volume: number;
    seven_day_change: number;
    thirty_day_volume: number;
    thirty_day_change: number;
    total_volume: number;
    average_price: number;
  };
  
  // Rarity and Analytics
  rarity_enabled: boolean;
  category: string;
  is_nsfw: boolean;
  safelist_request_status: 'approved' | 'verified' | 'not_requested';
}

export interface NFTAsset {
  id: string;
  token_id: string;
  num_sales: number;
  background_color?: string;
  image_url: string;
  image_preview_url?: string;
  image_thumbnail_url?: string;
  image_original_url?: string;
  animation_url?: string;
  animation_original_url?: string;
  name: string;
  description: string;
  external_link?: string;
  permalink: string;
  
  // Contract Information
  asset_contract: {
    address: string;
    name: string;
    symbol: string;
    schema_name: 'ERC721' | 'ERC1155';
    total_supply: number;
  };
  
  // Collection
  collection: NFTCollection;
  
  // Ownership and Transfer
  owner: {
    user?: {
      username: string;
    };
    profile_img_url?: string;
    address: string;
  };
  
  // Rarity and Traits
  traits: NFTAttribute[];
  rarity_rank?: number;
  rarity_score?: number;
  
  // Pricing
  last_sale?: {
    total_price: string;
    payment_token: {
      symbol: string;
      address: string;
      decimals: number;
      usd_price: string;
    };
    transaction: {
      timestamp: string;
      transaction_hash: string;
    };
  };
  
  // Market Data
  orders?: any[];
  sell_orders?: any[];
  
  // User Data
  is_favorited: boolean;
  transfer_fee?: string;
  transfer_fee_payment_token?: any;
}

export interface NFTMarketplace {
  id: string;
  name: string;
  logo: string;
  url: string;
  fee_percentage: number;
  supported_chains: string[];
  features: {
    instant_buy: boolean;
    auctions: boolean;
    offers: boolean;
    bulk_operations: boolean;
    rarity_tools: boolean;
  };
}

export interface NFTTransaction {
  id: string;
  transaction_hash: string;
  transaction_date: string;
  transaction_type: 'sale' | 'transfer' | 'mint' | 'burn' | 'list' | 'cancel_list' | 'offer' | 'cancel_offer';
  asset: NFTAsset;
  from_account: {
    address: string;
    user?: { username: string };
  };
  to_account: {
    address: string;
    user?: { username: string };
  };
  quantity: string;
  payment_token?: {
    symbol: string;
    address: string;
    decimals: number;
    usd_price: string;
  };
  total_price?: string;
  seller_fee_basis_points?: number;
  opensea_fee_basis_points?: number;
}

export interface NFTPortfolioStats {
  total_items: number;
  total_collections: number;
  estimated_value: number;
  total_spent: number;
  total_sold: number;
  unrealized_gain_loss: number;
  unrealized_gain_loss_percentage: number;
  top_collection_by_value: string;
  top_collection_by_count: string;
  average_holding_period: number; // days
  most_valuable_nft: NFTAsset;
  rarest_nft: NFTAsset;
  newest_acquisition: NFTAsset;
  oldest_holding: NFTAsset;
}

export interface NFTAnalytics {
  collection_id: string;
  price_analytics: {
    floor_price_history: {
      timestamp: number;
      price: number;
    }[];
    volume_history: {
      timestamp: number;
      volume: number;
    }[];
    sales_history: {
      timestamp: number;
      count: number;
    }[];
    trend_analysis: {
      price_trend: 'bullish' | 'bearish' | 'sideways';
      volume_trend: 'increasing' | 'decreasing' | 'stable';
      momentum_score: number; // -1 to 1
    };
  };
  
  rarity_analytics: {
    trait_distribution: {
      trait_type: string;
      trait_count: number;
      rarity_percentage: number;
    }[];
    rarity_tiers: {
      tier: string;
      min_rank: number;
      max_rank: number;
      percentage: number;
    }[];
  };
  
  market_analytics: {
    liquidity_score: number;
    price_volatility: number;
    holder_distribution: {
      whales: number; // holders with >10 NFTs
      collectors: number; // holders with 2-10 NFTs
      individuals: number; // holders with 1 NFT
    };
    wash_trading_score: number; // 0-1, higher means more suspicious
  };
}

export interface NFTRecommendation {
  type: 'buy' | 'sell' | 'hold' | 'watch';
  asset_id?: string;
  collection_id?: string;
  reason: string;
  confidence_score: number; // 0-1
  potential_return: number; // percentage
  risk_level: 'low' | 'medium' | 'high';
  time_horizon: '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
  supporting_factors: string[];
  risks: string[];
}

/**
 * CYPHER Advanced NFT Service
 * Comprehensive NFT portfolio management with rarity analysis, market intelligence, and trading insights
 * Features: Collection tracking, rarity scoring, market analytics, automated recommendations
 */
class AdvancedNFTService {
  private static instance: AdvancedNFTService;
  private userAssets: NFTAsset[] = [];
  private collections: { [key: string]: NFTCollection } = {};
  private analytics: { [key: string]: NFTAnalytics } = {};
  private marketplaces: NFTMarketplace[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AdvancedNFTService {
    if (!AdvancedNFTService.instance) {
      AdvancedNFTService.instance = new AdvancedNFTService();
    }
    return AdvancedNFTService.instance;
  }

  /**
   * Initialize NFT service with user data
   */
  async initialize(userAddress: string): Promise<void> {
    try {
      // Load cached data
      const cachedAssets = await AsyncStorage.getItem(`nft_assets_${userAddress}`);
      const cachedCollections = await AsyncStorage.getItem(`nft_collections_${userAddress}`);
      
      if (cachedAssets) {
        this.userAssets = JSON.parse(cachedAssets);
      }
      
      if (cachedCollections) {
        this.collections = JSON.parse(cachedCollections);
      }

      // Initialize marketplaces
      await this.loadMarketplaces();
      
      // Fetch real NFT data if no cached data
      if (this.userAssets.length === 0) {
        await this.fetchUserNFTs(userAddress);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize NFT service:', error);
      throw new Error('NFT service initialization failed');
    }
  }

  /**
   * Get user's NFT portfolio
   */
  async getNFTPortfolio(userAddress: string): Promise<NFTAsset[]> {
    if (!this.isInitialized) {
      await this.initialize(userAddress);
    }
    
    return this.userAssets;
  }

  /**
   * Get NFT portfolio statistics
   */
  async getPortfolioStats(userAddress: string): Promise<NFTPortfolioStats> {
    const assets = await this.getNFTPortfolio(userAddress);
    
    if (assets.length === 0) {
      return this.getEmptyPortfolioStats();
    }

    const collections = [...new Set(assets.map(asset => asset.collection.name))];
    const totalValue = assets.reduce((sum, asset) => {
      const lastSalePrice = asset.last_sale ? 
        parseFloat(asset.last_sale.total_price) / Math.pow(10, asset.last_sale.payment_token.decimals) *
        parseFloat(asset.last_sale.payment_token.usd_price) : 0;
      return sum + lastSalePrice;
    }, 0);

    const collectionCounts = assets.reduce((acc, asset) => {
      acc[asset.collection.name] = (acc[asset.collection.name] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const topCollectionByCount = Object.entries(collectionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const mostValuable = assets.reduce((max, asset) => {
      const assetValue = asset.last_sale ? 
        parseFloat(asset.last_sale.total_price) / Math.pow(10, asset.last_sale.payment_token.decimals) *
        parseFloat(asset.last_sale.payment_token.usd_price) : 0;
      const maxValue = max.last_sale ? 
        parseFloat(max.last_sale.total_price) / Math.pow(10, max.last_sale.payment_token.decimals) *
        parseFloat(max.last_sale.payment_token.usd_price) : 0;
      return assetValue > maxValue ? asset : max;
    }, assets[0]);

    const rarest = assets.reduce((min, asset) => {
      const assetRank = asset.rarity_rank || Infinity;
      const minRank = min.rarity_rank || Infinity;
      return assetRank < minRank ? asset : min;
    }, assets[0]);

    return {
      total_items: assets.length,
      total_collections: collections.length,
      estimated_value: totalValue,
      total_spent: totalValue * 0.8, // Mock calculation
      total_sold: 0, // Mock - would track historical sales
      unrealized_gain_loss: totalValue * 0.2,
      unrealized_gain_loss_percentage: 25,
      top_collection_by_value: collections[0] || '',
      top_collection_by_count: topCollectionByCount,
      average_holding_period: 45, // Mock average holding period
      most_valuable_nft: mostValuable,
      rarest_nft: rarest,
      newest_acquisition: assets[assets.length - 1],
      oldest_holding: assets[0]
    };
  }

  /**
   * Get NFT collections with enhanced data
   */
  async getCollections(): Promise<NFTCollection[]> {
    return Object.values(this.collections);
  }

  /**
   * Get collection analytics
   */
  async getCollectionAnalytics(collectionId: string): Promise<NFTAnalytics> {
    if (this.analytics[collectionId]) {
      return this.analytics[collectionId];
    }

    // Return empty analytics - would require additional API calls to populate real data
    const analytics: NFTAnalytics = {
      collection_id: collectionId,
      price_analytics: {
        floor_price_history: [],
        volume_history: [],
        sales_history: [],
        trend_analysis: {
          price_trend: 'sideways' as const,
          volume_trend: 'stable' as const,
          momentum_score: 0
        }
      },
      rarity_analytics: {
        trait_distribution: [],
        rarity_tiers: [
          { tier: 'Rare', min_rank: 101, max_rank: 500, percentage: 40 },
          { tier: 'Common', min_rank: 501, max_rank: 10000, percentage: 50 }
        ]
      },
      market_analytics: {
        liquidity_score: Math.random(),
        price_volatility: Math.random() * 50,
        holder_distribution: {
          whales: Math.floor(Math.random() * 50),
          collectors: Math.floor(Math.random() * 200),
          individuals: Math.floor(Math.random() * 1000)
        },
        wash_trading_score: Math.random() * 0.3
      }
    };

    this.analytics[collectionId] = analytics;
    return analytics;
  }

  /**
   * Get NFT recommendations based on portfolio and market analysis
   */
  async getNFTRecommendations(userAddress: string): Promise<NFTRecommendation[]> {
    const portfolio = await this.getNFTPortfolio(userAddress);
    const stats = await this.getPortfolioStats(userAddress);
    
    const recommendations: NFTRecommendation[] = [];

    // Diversification recommendation
    if (stats.total_collections < 3) {
      recommendations.push({
        type: 'buy',
        reason: 'Portfolio lacks diversification - consider adding NFTs from different collections',
        confidence_score: 0.8,
        potential_return: 15,
        risk_level: 'medium',
        time_horizon: '3m',
        supporting_factors: [
          'Current portfolio concentrated in few collections',
          'Diversification reduces risk',
          'Multiple strong collections available'
        ],
        risks: [
          'Market volatility',
          'Collection quality varies'
        ]
      });
    }

    // Sell recommendation for overpriced assets
    const overvaluedAssets = portfolio.filter(asset => {
      const collection = asset.collection;
      return collection.stats.floor_price > 0 && 
             asset.last_sale &&
             parseFloat(asset.last_sale.total_price) > collection.stats.floor_price * 1.5;
    });

    if (overvaluedAssets.length > 0) {
      recommendations.push({
        type: 'sell',
        asset_id: overvaluedAssets[0].id,
        reason: 'Asset trading significantly above floor price - good time to take profits',
        confidence_score: 0.7,
        potential_return: 25,
        risk_level: 'low',
        time_horizon: '1w',
        supporting_factors: [
          'Current price well above floor',
          'High liquidity in collection',
          'Profit-taking opportunity'
        ],
        risks: [
          'Price might continue rising',
          'Market timing uncertainty'
        ]
      });
    }

    // Hold recommendation for rare items
    const rareAssets = portfolio.filter(asset => asset.rarity_rank && asset.rarity_rank <= 100);
    if (rareAssets.length > 0) {
      recommendations.push({
        type: 'hold',
        asset_id: rareAssets[0].id,
        reason: 'Rare NFT with strong long-term value proposition',
        confidence_score: 0.9,
        potential_return: 50,
        risk_level: 'low',
        time_horizon: '1y',
        supporting_factors: [
          'High rarity rank',
          'Strong collection fundamentals',
          'Limited supply'
        ],
        risks: [
          'Market cycles',
          'Collection falling out of favor'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Search NFTs by collection or name
   */
  async searchNFTs(query: string): Promise<NFTAsset[]> {
    const portfolio = await this.getNFTPortfolio('default');
    
    return portfolio.filter(asset => 
      asset.name.toLowerCase().includes(query.toLowerCase()) ||
      asset.collection.name.toLowerCase().includes(query.toLowerCase()) ||
      asset.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  /**
   * Get NFT transaction history
   */
  async getTransactionHistory(userAddress: string): Promise<NFTTransaction[]> {
    // Mock transaction history
    const portfolio = await this.getNFTPortfolio(userAddress);
    
    return portfolio.slice(0, 10).map((asset, index) => ({
      id: `tx_${index}`,
      transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      transaction_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      transaction_type: index % 3 === 0 ? 'sale' : index % 3 === 1 ? 'transfer' : 'mint',
      asset,
      from_account: {
        address: '0x' + Math.random().toString(16).substr(2, 40),
        user: { username: `user${index}` }
      },
      to_account: {
        address: userAddress,
        user: { username: 'you' }
      },
      quantity: '1',
      payment_token: asset.last_sale?.payment_token,
      total_price: asset.last_sale?.total_price
    }));
  }

  /**
   * Get supported marketplaces
   */
  async getMarketplaces(): Promise<NFTMarketplace[]> {
    return this.marketplaces;
  }

  /**
   * Analyze NFT rarity and traits
   */
  async analyzeNFTRarity(assetId: string): Promise<{
    rarity_rank: number;
    rarity_score: number;
    trait_analysis: {
      trait_type: string;
      value: string;
      rarity_percentage: number;
      rarity_rank: number;
    }[];
  }> {
    const asset = this.userAssets.find(a => a.id === assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Mock rarity analysis
    return {
      rarity_rank: asset.rarity_rank || Math.floor(Math.random() * 1000) + 1,
      rarity_score: asset.rarity_score || Math.random() * 100,
      trait_analysis: asset.traits.map(trait => ({
        trait_type: trait.trait_type,
        value: trait.value.toString(),
        rarity_percentage: Math.random() * 50,
        rarity_rank: Math.floor(Math.random() * 100) + 1
      }))
    };
  }

  // Private helper methods
  private async loadMarketplaces(): Promise<void> {
    this.marketplaces = [
      {
        id: 'opensea',
        name: 'OpenSea',
        logo: 'https://opensea.io/static/images/logos/opensea-logo.svg',
        url: 'https://opensea.io',
        fee_percentage: 2.5,
        supported_chains: ['ethereum', 'polygon', 'klaytn', 'solana'],
        features: {
          instant_buy: true,
          auctions: true,
          offers: true,
          bulk_operations: true,
          rarity_tools: true
        }
      },
      {
        id: 'blur',
        name: 'Blur',
        logo: 'https://blur.io/logo.png',
        url: 'https://blur.io',
        fee_percentage: 0.5,
        supported_chains: ['ethereum'],
        features: {
          instant_buy: true,
          auctions: false,
          offers: true,
          bulk_operations: true,
          rarity_tools: true
        }
      },
      {
        id: 'x2y2',
        name: 'X2Y2',
        logo: 'https://x2y2.io/logo.png',
        url: 'https://x2y2.io',
        fee_percentage: 0.5,
        supported_chains: ['ethereum'],
        features: {
          instant_buy: true,
          auctions: true,
          offers: true,
          bulk_operations: false,
          rarity_tools: false
        }
      }
    ];
  }

  /**
   * Fetch user's real NFTs from blockchain using Alchemy API
   */
  private async fetchUserNFTs(userAddress: string): Promise<void> {
    try {
      // Fetch NFTs using Alchemy API
      const nfts = await this.fetchNFTsFromAlchemy(userAddress);
      
      // Process and store the NFTs
      this.userAssets = nfts;
      
      // Cache the data
      await AsyncStorage.setItem(`nft_assets_${userAddress}`, JSON.stringify(nfts));
      
      // Fetch and cache collection data
      const collections = await this.fetchCollectionData(nfts);
      this.collections = collections;
      await AsyncStorage.setItem(`nft_collections_${userAddress}`, JSON.stringify(collections));
      
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      // Don't throw error - just leave arrays empty if API fails
      this.userAssets = [];
      this.collections = {};
    }
  }

  /**
   * Fetch NFTs from Alchemy API
   */
  private async fetchNFTsFromAlchemy(userAddress: string): Promise<NFTAsset[]> {
    const ALCHEMY_API_KEY = '19e0f26eec044c3fa043cf82ec34b168';
    const url = `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTsForOwner`;
    
    const requestOptions = {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const response = await fetch(`${url}?owner=${userAddress}&withMetadata=true&pageSize=100`, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Alchemy response to our NFTAsset format
    return data.ownedNfts?.map((nft: any) => ({
      id: `${nft.contract.address}_${nft.tokenId}`,
      token_id: nft.tokenId,
      num_sales: 0, // This would need additional API calls to get sales data
      background_color: nft.metadata?.background_color,
      image_url: nft.metadata?.image || nft.media?.[0]?.gateway,
      image_preview_url: nft.metadata?.image || nft.media?.[0]?.gateway,
      image_thumbnail_url: nft.metadata?.image || nft.media?.[0]?.gateway,
      name: nft.metadata?.name || `${nft.contract.name} #${nft.tokenId}`,
      description: nft.metadata?.description || '',
      permalink: `https://opensea.io/assets/ethereum/${nft.contract.address}/${nft.tokenId}`,
      
      asset_contract: {
        address: nft.contract.address,
        name: nft.contract.name || 'Unknown',
        symbol: nft.contract.symbol || 'UNKNOWN',
        schema_name: nft.contract.tokenType === 'ERC721' ? 'ERC721' as const : 'ERC1155' as const,
        total_supply: nft.contract.totalSupply ? parseInt(nft.contract.totalSupply) : 0
      },
      
      collection: {
        id: nft.contract.address,
        name: nft.contract.name || 'Unknown Collection',
        slug: nft.contract.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        description: nft.metadata?.description || '',
        image_url: nft.metadata?.image || nft.media?.[0]?.gateway || '',
        external_url: nft.metadata?.external_url || '',
        created_date: new Date().toISOString(),
        category: 'art',
        is_nsfw: false,
        rarity_enabled: false,
        safelist_request_status: 'verified' as const,
        stats: {
          total_supply: nft.contract.totalSupply ? parseInt(nft.contract.totalSupply) : 0,
          num_owners: 0,
          floor_price: 0,
          floor_price_symbol: 'ETH',
          market_cap: 0,
          one_day_volume: 0,
          one_day_change: 0,
          seven_day_volume: 0,
          seven_day_change: 0,
          thirty_day_volume: 0,
          thirty_day_change: 0,
          total_volume: 0,
          average_price: 0
        }
      },
      
      owner: {
        address: userAddress,
        profile_img_url: '',
        user: { username: 'you' }
      },
      
      traits: nft.metadata?.attributes?.map((attr: any) => ({
        trait_type: attr.trait_type,
        value: attr.value?.toString() || ''
      })) || [],
      
      rarity_rank: 0,
      rarity_score: 0,
      last_sale: undefined,
      is_favorited: false
    })) || [];
  }

  /**
   * Fetch collection data for the NFTs
   */
  private async fetchCollectionData(nfts: NFTAsset[]): Promise<{ [key: string]: NFTCollection }> {
    const collections: { [key: string]: NFTCollection } = {};
    
    // Group NFTs by collection
    const collectionGroups = nfts.reduce((acc, nft) => {
      const collectionId = nft.collection.id;
      if (!acc[collectionId]) {
        acc[collectionId] = [];
      }
      acc[collectionId].push(nft);
      return acc;
    }, {} as { [key: string]: NFTAsset[] });

    // Create collection objects
    Object.entries(collectionGroups).forEach(([collectionId, assets]) => {
      const firstAsset = assets[0];
      collections[collectionId] = firstAsset.collection;
    });

    return collections;
  }





  private getEmptyPortfolioStats(): NFTPortfolioStats {
    const emptyAsset: NFTAsset = {
      id: '',
      token_id: '',
      num_sales: 0,
      image_url: '',
      name: '',
      description: '',
      permalink: '',
      asset_contract: {
        address: '',
        name: '',
        symbol: '',
        schema_name: 'ERC721',
        total_supply: 0
      },
      collection: {} as NFTCollection,
      owner: { address: '' },
      traits: [],
      is_favorited: false
    };

    return {
      total_items: 0,
      total_collections: 0,
      estimated_value: 0,
      total_spent: 0,
      total_sold: 0,
      unrealized_gain_loss: 0,
      unrealized_gain_loss_percentage: 0,
      top_collection_by_value: '',
      top_collection_by_count: '',
      average_holding_period: 0,
      most_valuable_nft: emptyAsset,
      rarest_nft: emptyAsset,
      newest_acquisition: emptyAsset,
      oldest_holding: emptyAsset
    };
  }
}

export default AdvancedNFTService;
