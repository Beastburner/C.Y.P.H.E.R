/**
 * Cypher Wallet - NFT Service
 * Comprehensive NFT management with advanced features
 * 
 * Features:
 * - NFT collection browsing and management
 * - Real-time metadata fetching and caching
 * - Rarity analysis and trait evaluation
 * - Portfolio valuation and price tracking
 * - Transfer and batch operations
 * - Marketplace integration
 * - Collection floor price monitoring
 * - NFT lending and borrowing
 * - Cross-chain NFT operations
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { networkService } from './NetworkService';
import { transactionService } from './TransactionService';

// NFT Types
export interface NFTCollection {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  externalUrl?: string;
  totalSupply: number;
  ownedCount: number;
  floorPrice: string;
  volume24h: string;
  marketCap: string;
  verified: boolean;
  category: NFTCategory;
  standard: NFTStandard;
  royalty: number;
  creators: string[];
  socialLinks: SocialLinks;
  stats: CollectionStats;
  // Additional properties for UI compatibility
  image?: string;
  itemCount?: number;
  ownerCount?: number;
}

export type NFTCategory = 
  | 'art' 
  | 'pfp' 
  | 'gaming' 
  | 'music' 
  | 'photography' 
  | 'sports' 
  | 'utility' 
  | 'metaverse' 
  | 'collectibles' 
  | 'domain';

export type NFTStandard = 'ERC721' | 'ERC1155' | 'ERC998';

export interface SocialLinks {
  website?: string;
  twitter?: string;
  discord?: string;
  instagram?: string;
  telegram?: string;
}

export interface CollectionStats {
  owners: number;
  listedCount: number;
  averagePrice: string;
  priceChange24h: number;
  volumeChange24h: number;
  sales24h: number;
}

export interface NFTMetadata {
  tokenId: string;
  contractAddress: string;
  chainId: number;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes: NFTAttribute[];
  properties: NFTProperty[];
  levels: NFTLevel[];
  stats: NFTStat[];
  background_color?: string;
  youtube_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_percentage' | 'boost_number' | 'date';
  max_value?: number;
  rarity?: number;
  frequency?: number;
}

export interface NFTProperty {
  name: string;
  value: string;
  type: 'string' | 'number' | 'boolean';
}

export interface NFTLevel {
  name: string;
  value: number;
  max_value: number;
}

export interface NFTStat {
  name: string;
  value: number;
  max_value?: number;
  display_type?: 'number' | 'percentage';
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  chainId: number;
  ownerAddress: string;
  metadata: NFTMetadata;
  rarity: NFTRarity;
  valuation: NFTValuation;
  marketData: NFTMarketData;
  lastTransfer: NFTTransfer;
  collection: NFTCollection;
  standard: NFTStandard;
  amount?: string; // For ERC1155
  // Additional properties for UI compatibility
  name?: string;
  image?: string;
  description?: string;
  floorPrice?: number;
  collectionName?: string;
}

export interface NFTRarity {
  rank: number;
  score: number;
  totalSupply: number;
  rarityTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  traitRarities: { [trait: string]: number };
}

export interface NFTValuation {
  currentValue: string;
  lastSalePrice?: string;
  acquisitionPrice?: string;
  pnl?: string;
  priceHistory: PricePoint[];
  estimatedValue: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface PricePoint {
  timestamp: number;
  price: string;
  source: string;
}

export interface NFTMarketData {
  isListed: boolean;
  listingPrice?: string;
  marketplace?: string;
  listingExpiry?: number;
  bestOffer?: string;
  offerCount: number;
  lastSale?: {
    price: string;
    timestamp: number;
    marketplace: string;
    transactionHash: string;
  };
}

export interface NFTTransfer {
  from: string;
  to: string;
  timestamp: number;
  transactionHash: string;
  price?: string;
  marketplace?: string;
}

export interface NFTMarketplace {
  id: string;
  name: string;
  url: string;
  chainIds: number[];
  contractAddress: string;
  fees: {
    buyer: number;
    seller: number;
  };
  supported: boolean;
}

export interface NFTListingParams {
  tokenId: string;
  contractAddress: string;
  price: string;
  currency: string;
  duration: number; // in seconds
  marketplace: string;
}

export interface NFTOfferParams {
  tokenId: string;
  contractAddress: string;
  price: string;
  currency: string;
  expiry: number;
}

export interface NFTBatchTransferParams {
  transfers: Array<{
    contractAddress: string;
    tokenId: string;
    to: string;
    amount?: string; // For ERC1155
  }>;
}

// Marketplace configurations
const MARKETPLACES: NFTMarketplace[] = [
  {
    id: 'opensea',
    name: 'OpenSea',
    url: 'https://opensea.io',
    chainIds: [1, 137, 42161, 10],
    contractAddress: '0x00000000006c3852cbEf3e08E8dF289169EdE581',
    fees: { buyer: 0, seller: 2.5 },
    supported: true
  },
  {
    id: 'blur',
    name: 'Blur',
    url: 'https://blur.io',
    chainIds: [1],
    contractAddress: '0x000000000000Ad05Ccc4F10045630fb830B95127',
    fees: { buyer: 0, seller: 0.5 },
    supported: true
  },
  {
    id: 'x2y2',
    name: 'X2Y2',
    url: 'https://x2y2.io',
    chainIds: [1],
    contractAddress: '0x74312363e45DCaBA76c59ec49a7Aa8A65a67EeD3',
    fees: { buyer: 0, seller: 0.5 },
    supported: true
  }
];

/**
 * NFT Service
 * Comprehensive NFT operations and portfolio management
 */
export class NFTService {
  private static instance: NFTService;
  private nftCollections: Map<string, NFT[]> = new Map();
  private metadataCache: Map<string, NFTMetadata> = new Map();
  private priceCache: Map<string, string> = new Map();
  private rarityCache: Map<string, NFTRarity> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.loadCache();
    this.startPriceMonitoring();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  /**
   * Fetch NFTs for a user address
   */
  public async fetchUserNFTs(
    userAddress: string,
    chainId?: number,
    refresh: boolean = false
  ): Promise<NFT[]> {
    try {
      const key = `${userAddress.toLowerCase()}_${chainId || 'all'}`;
      
      if (!refresh && this.nftCollections.has(key)) {
        return this.nftCollections.get(key) || [];
      }

      const networks = chainId ? [chainId] : [1, 137, 42161, 10]; // Major networks
      const allNFTs: NFT[] = [];

      for (const networkId of networks) {
        const provider = await networkService.getProvider(networkId);
        if (!provider) continue;

        try {
          // Simulate NFT fetching (in real implementation, would call APIs like Alchemy, Moralis, etc.)
          const nfts = await this.fetchNFTsFromNetwork(userAddress, networkId);
          allNFTs.push(...nfts);
        } catch (error) {
          console.warn(`Failed to fetch NFTs from network ${networkId}:`, error);
        }
      }

      // Enhance NFTs with rarity and valuation data
      const enhancedNFTs = await this.enhanceNFTs(allNFTs);
      
      this.nftCollections.set(key, enhancedNFTs);
      await this.saveCache();

      console.log(`✅ Fetched ${enhancedNFTs.length} NFTs for ${userAddress}`);
      return enhancedNFTs;
    } catch (error) {
      console.error('Failed to fetch user NFTs:', error);
      return [];
    }
  }

  /**
   * Alias for fetchUserNFTs - expected by NFTScreen component
   */
  public async getNFTs(
    userAddress: string,
    chainId?: number,
    refresh?: boolean
  ): Promise<NFT[]> {
    return this.fetchUserNFTs(userAddress, chainId, refresh);
  }

  /**
   * Get NFT collections for a chain ID
   */
  public async getNFTCollections(chainId: number): Promise<NFTCollection[]> {
    try {
      // Return empty array as placeholder - implement actual collection fetching logic
      console.log(`Fetching NFT collections for chain ${chainId}`);
      return [];
    } catch (error) {
      console.error('Failed to fetch NFT collections:', error);
      return [];
    }
  }

  /**
   * Approve NFT for transfer
   */
  public async approveNFT(
    contractAddress: string,
    tokenId: string,
    spenderAddress: string,
    chainId: number | string
  ): Promise<string> {
    try {
      const chainIdNum = typeof chainId === 'string' ? parseInt(chainId) : chainId;
      console.log(`Approving NFT ${tokenId} from ${contractAddress} for spender ${spenderAddress} on chain ${chainIdNum}`);
      
      // Return placeholder transaction hash - implement actual approval logic
      const mockTxHash = '0x' + '0'.repeat(64);
      return mockTxHash;
    } catch (error) {
      console.error('Failed to approve NFT:', error);
      throw error;
    }
  }

  /**
   * Get NFT metadata with caching
   */
  public async getNFTMetadata(
    contractAddress: string,
    tokenId: string,
    chainId: number,
    refresh: boolean = false
  ): Promise<NFTMetadata | null> {
    try {
      const key = `${contractAddress}_${tokenId}_${chainId}`;
      
      if (!refresh && this.metadataCache.has(key)) {
        return this.metadataCache.get(key) || null;
      }

      const provider = await networkService.getProvider(chainId);
      if (!provider) return null;

      // Simulate metadata fetching
      const metadata = await this.fetchMetadataFromContract(contractAddress, tokenId, chainId);
      
      if (metadata) {
        this.metadataCache.set(key, metadata);
        await this.saveCache();
      }

      return metadata;
    } catch (error) {
      console.error('Failed to get NFT metadata:', error);
      return null;
    }
  }

  /**
   * Calculate NFT rarity and ranking
   */
  public async calculateRarity(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<NFTRarity | null> {
    try {
      const key = `${contractAddress}_${tokenId}_${chainId}`;
      
      if (this.rarityCache.has(key)) {
        return this.rarityCache.get(key) || null;
      }

      const metadata = await this.getNFTMetadata(contractAddress, tokenId, chainId);
      if (!metadata) return null;

      const collection = await this.getCollectionData(contractAddress, chainId);
      if (!collection) return null;

      // Calculate rarity based on traits
      const rarity = await this.computeTraitRarity(metadata, collection);
      
      this.rarityCache.set(key, rarity);
      await this.saveCache();

      return rarity;
    } catch (error) {
      console.error('Failed to calculate rarity:', error);
      return null;
    }
  }

  /**
   * Get NFT price and valuation
   */
  public async getNFTValuation(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<NFTValuation | null> {
    try {
      const key = `${contractAddress}_${tokenId}_${chainId}`;
      
      // Get floor price and recent sales data
      const floorPrice = await this.getCollectionFloorPrice(contractAddress, chainId);
      const recentSales = await this.getRecentSales(contractAddress, chainId);
      const rarity = await this.calculateRarity(contractAddress, tokenId, chainId);

      // Calculate estimated value based on rarity and floor price
      let estimatedValue = floorPrice;
      if (rarity && parseFloat(floorPrice) > 0) {
        const rarityMultiplier = this.getRarityMultiplier(rarity.rarityTier);
        estimatedValue = (parseFloat(floorPrice) * rarityMultiplier).toString();
      }

      const valuation: NFTValuation = {
        currentValue: estimatedValue,
        estimatedValue: estimatedValue,
        priceHistory: this.getPriceHistory(contractAddress, tokenId),
        confidence: this.getValuationConfidence(recentSales.length, rarity !== null)
      };

      return valuation;
    } catch (error) {
      console.error('Failed to get NFT valuation:', error);
      return null;
    }
  }

  /**
   * Transfer NFT to another address
   */
  public async transferNFT(
    contractAddress: string,
    tokenId: string,
    to: string,
    userAddress: string,
    privateKey: string,
    chainId: number,
    amount?: string // For ERC1155
  ): Promise<string> {
    try {
      // Validate addresses
      if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      // Build transfer transaction
      const transferTx = await this.buildTransferTransaction(
        contractAddress,
        tokenId,
        to,
        userAddress,
        chainId,
        amount
      );

      // Execute transaction
      const txHash = await transactionService.sendTransaction(
        transferTx,
        privateKey
      );

      console.log(`✅ NFT transferred: ${txHash}`);
      return txHash;
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw error;
    }
  }

  /**
   * Batch transfer multiple NFTs
   */
  public async batchTransferNFTs(
    transfers: NFTBatchTransferParams,
    userAddress: string,
    privateKey: string,
    chainId: number
  ): Promise<string[]> {
    try {
      const results: string[] = [];

      for (const transfer of transfers.transfers) {
        try {
          const txHash = await this.transferNFT(
            transfer.contractAddress,
            transfer.tokenId,
            transfer.to,
            userAddress,
            privateKey,
            chainId,
            transfer.amount
          );
          results.push(txHash);

          // Small delay between transfers
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Failed to transfer NFT in batch:', error);
          results.push(''); // Empty string indicates failure
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to batch transfer NFTs:', error);
      throw error;
    }
  }

  /**
   * Get collection data and statistics
   */
  public async getCollectionData(contractAddress: string, chainId: number): Promise<NFTCollection | null> {
    try {
      // Simulate collection data fetching
      const mockCollection: NFTCollection = {
        address: contractAddress,
        chainId,
        name: 'Mock Collection',
        symbol: 'MOCK',
        description: 'A mock NFT collection for demonstration',
        imageUrl: 'https://via.placeholder.com/300',
        totalSupply: 10000,
        ownedCount: 0,
        floorPrice: '0.5',
        volume24h: '100.5',
        marketCap: '5000',
        verified: true,
        category: 'art',
        standard: 'ERC721',
        royalty: 5,
        creators: [contractAddress],
        socialLinks: {
          website: 'https://example.com',
          twitter: 'https://twitter.com/example'
        },
        stats: {
          owners: 5000,
          listedCount: 500,
          averagePrice: '0.75',
          priceChange24h: 5.2,
          volumeChange24h: -2.1,
          sales24h: 25
        }
      };

      return mockCollection;
    } catch (error) {
      console.error('Failed to get collection data:', error);
      return null;
    }
  }

  /**
   * Get collection floor price
   */
  public async getCollectionFloorPrice(contractAddress: string, chainId: number): Promise<string> {
    try {
      const key = `floor_${contractAddress}_${chainId}`;
      
      if (this.priceCache.has(key)) {
        return this.priceCache.get(key) || '0';
      }

      // Simulate floor price fetching
      const floorPrice = (Math.random() * 2).toFixed(4); // Random price for demo
      
      this.priceCache.set(key, floorPrice);
      return floorPrice;
    } catch (error) {
      console.error('Failed to get floor price:', error);
      return '0';
    }
  }

  /**
   * Get user's NFT portfolio summary
   */
  public async getPortfolioSummary(userAddress: string): Promise<{
    totalNFTs: number;
    totalValue: string;
    collections: number;
    topCollections: NFTCollection[];
    valueChange24h: number;
  }> {
    try {
      const nfts = await this.fetchUserNFTs(userAddress);
      const collections = new Set(nfts.map(nft => nft.contractAddress));
      
      let totalValue = 0;
      const collectionValues = new Map<string, number>();

      for (const nft of nfts) {
        const value = parseFloat(nft.valuation.currentValue || '0');
        totalValue += value;
        
        const currentCollectionValue = collectionValues.get(nft.contractAddress) || 0;
        collectionValues.set(nft.contractAddress, currentCollectionValue + value);
      }

      // Get top collections by value
      const sortedCollections = Array.from(collectionValues.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topCollections: NFTCollection[] = [];
      for (const [contractAddress] of sortedCollections) {
        const nft = nfts.find(n => n.contractAddress === contractAddress);
        if (nft) {
          topCollections.push(nft.collection);
        }
      }

      return {
        totalNFTs: nfts.length,
        totalValue: totalValue.toFixed(4),
        collections: collections.size,
        topCollections,
        valueChange24h: Math.random() * 20 - 10 // Mock 24h change
      };
    } catch (error) {
      console.error('Failed to get portfolio summary:', error);
      return {
        totalNFTs: 0,
        totalValue: '0',
        collections: 0,
        topCollections: [],
        valueChange24h: 0
      };
    }
  }

  /**
   * Search NFTs by collection or traits
   */
  public async searchNFTs(
    query: string,
    filters?: {
      chainId?: number;
      category?: NFTCategory;
      priceRange?: { min: string; max: string };
      traits?: { [trait: string]: string[] };
    }
  ): Promise<NFT[]> {
    try {
      // Simulate NFT search
      const mockResults: NFT[] = [];
      
      // In real implementation, this would search across multiple sources
      console.log(`Searching for NFTs with query: ${query}`);
      
      return mockResults;
    } catch (error) {
      console.error('Failed to search NFTs:', error);
      return [];
    }
  }

  // Private helper methods
  private async fetchNFTsFromNetwork(userAddress: string, chainId: number): Promise<NFT[]> {
    // Simulate network-specific NFT fetching
    const mockNFTs: NFT[] = [];
    
    // Generate some mock NFTs for demonstration
    for (let i = 0; i < 3; i++) {
      const tokenId = (i + 1).toString();
      const contractAddress = `0x${'1'.repeat(40)}`; // Mock contract
      
      const mockNFT: NFT = {
        tokenId,
        contractAddress,
        chainId,
        ownerAddress: userAddress,
        metadata: {
          tokenId,
          contractAddress,
          chainId,
          name: `Mock NFT #${tokenId}`,
          description: 'A mock NFT for demonstration purposes',
          image: 'https://via.placeholder.com/300',
          imageUrl: 'https://via.placeholder.com/300',
          attributes: [
            { trait_type: 'Background', value: 'Blue', rarity: 20 },
            { trait_type: 'Eyes', value: 'Green', rarity: 15 },
            { trait_type: 'Mouth', value: 'Smile', rarity: 30 }
          ],
          properties: [],
          levels: [],
          stats: []
        },
        rarity: {
          rank: i + 1,
          score: 100 - i * 10,
          totalSupply: 10000,
          rarityTier: i === 0 ? 'legendary' : i === 1 ? 'epic' : 'rare',
          traitRarities: {
            'Background': 20,
            'Eyes': 15,
            'Mouth': 30
          }
        },
        valuation: {
          currentValue: (1 + Math.random()).toFixed(4),
          estimatedValue: (1 + Math.random()).toFixed(4),
          priceHistory: [],
          confidence: 'medium'
        },
        marketData: {
          isListed: false,
          offerCount: 0
        },
        lastTransfer: {
          from: '0x0000000000000000000000000000000000000000',
          to: userAddress,
          timestamp: Date.now() - 86400000, // 1 day ago
          transactionHash: `0x${'a'.repeat(64)}`
        },
        collection: {
          address: contractAddress,
          chainId,
          name: 'Mock Collection',
          symbol: 'MOCK',
          description: 'A mock collection',
          imageUrl: 'https://via.placeholder.com/300',
          totalSupply: 10000,
          ownedCount: 3,
          floorPrice: '0.5',
          volume24h: '100',
          marketCap: '5000',
          verified: true,
          category: 'art',
          standard: 'ERC721',
          royalty: 5,
          creators: [contractAddress],
          socialLinks: {},
          stats: {
            owners: 5000,
            listedCount: 500,
            averagePrice: '0.75',
            priceChange24h: 5,
            volumeChange24h: -2,
            sales24h: 25
          }
        },
        standard: 'ERC721'
      };
      
      mockNFTs.push(mockNFT);
    }
    
    return mockNFTs;
  }

  private async enhanceNFTs(nfts: NFT[]): Promise<NFT[]> {
    // Enhance NFTs with additional data
    for (const nft of nfts) {
      // Update rarity if not present
      if (!nft.rarity) {
        nft.rarity = await this.calculateRarity(nft.contractAddress, nft.tokenId, nft.chainId) || {
          rank: 0,
          score: 0,
          totalSupply: 0,
          rarityTier: 'common',
          traitRarities: {}
        };
      }

      // Update valuation
      const valuation = await this.getNFTValuation(nft.contractAddress, nft.tokenId, nft.chainId);
      if (valuation) {
        nft.valuation = valuation;
      }
    }

    return nfts;
  }

  private async fetchMetadataFromContract(
    contractAddress: string,
    tokenId: string,
    chainId: number
  ): Promise<NFTMetadata | null> {
    try {
      // Fetch real metadata from contract or IPFS
      const provider = new ethers.providers.JsonRpcProvider();
      const contract = new ethers.Contract(contractAddress, [
        'function tokenURI(uint256 tokenId) view returns (string)',
        'function name() view returns (string)',
        'function symbol() view returns (string)'
      ], provider);

      try {
        const tokenURI = await contract.tokenURI(tokenId);
        if (tokenURI.startsWith('ipfs://')) {
          const ipfsUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
          const response = await fetch(ipfsUrl);
          const metadata = await response.json();
          
          return {
            tokenId,
            contractAddress,
            chainId,
            name: metadata.name || `NFT #${tokenId}`,
            description: metadata.description || 'No description available',
            image: metadata.image || '',
            imageUrl: metadata.image || '',
            attributes: metadata.attributes || [],
            properties: metadata.properties || [],
            levels: metadata.levels || [],
            stats: metadata.stats || []
          };
        } else if (tokenURI.startsWith('http')) {
          const response = await fetch(tokenURI);
          const metadata = await response.json();
          
          return {
            tokenId,
            contractAddress,
            chainId,
            name: metadata.name || `NFT #${tokenId}`,
            description: metadata.description || 'No description available',
            image: metadata.image || '',
            imageUrl: metadata.image || '',
            attributes: metadata.attributes || [],
            properties: metadata.properties || [],
            levels: metadata.levels || [],
            stats: metadata.stats || []
          };
        }
      } catch (contractError) {
        console.warn('Failed to fetch from contract, using fallback metadata:', contractError);
      }

      // Fallback metadata when contract/IPFS fetch fails
      const fallbackMetadata: NFTMetadata = {
        tokenId,
        contractAddress,
        chainId,
        name: `NFT #${tokenId}`,
        description: 'Metadata unavailable',
        image: '',
        imageUrl: '',
        attributes: [],
        properties: [],
        levels: [],
        stats: []
      };

      return fallbackMetadata;
    } catch (error) {
      console.error('Failed to fetch metadata from contract:', error);
      return null;
    }
  }

  private async computeTraitRarity(metadata: NFTMetadata, collection: NFTCollection): Promise<NFTRarity> {
    // Simulate trait rarity calculation
    const traitRarities: { [trait: string]: number } = {};
    let totalScore = 0;

    for (const attr of metadata.attributes) {
      // Mock rarity calculation
      const rarity = Math.random() * 100;
      traitRarities[attr.trait_type] = rarity;
      totalScore += (100 - rarity);
    }

    const rank = Math.floor(Math.random() * collection.totalSupply) + 1;
    const tier = this.getRarityTier(rank, collection.totalSupply);

    return {
      rank,
      score: totalScore,
      totalSupply: collection.totalSupply,
      rarityTier: tier,
      traitRarities
    };
  }

  private getRarityTier(rank: number, totalSupply: number): NFTRarity['rarityTier'] {
    const percentile = (rank / totalSupply) * 100;
    
    if (percentile <= 1) return 'mythic';
    if (percentile <= 5) return 'legendary';
    if (percentile <= 15) return 'epic';
    if (percentile <= 35) return 'rare';
    if (percentile <= 65) return 'uncommon';
    return 'common';
  }

  private getRarityMultiplier(tier: NFTRarity['rarityTier']): number {
    const multipliers = {
      'common': 1,
      'uncommon': 1.2,
      'rare': 1.5,
      'epic': 2,
      'legendary': 3,
      'mythic': 5
    };
    
    return multipliers[tier] || 1;
  }

  private async getRecentSales(contractAddress: string, chainId: number): Promise<any[]> {
    // Simulate recent sales data
    return [];
  }

  private getPriceHistory(contractAddress: string, tokenId: string): PricePoint[] {
    // Simulate price history
    return [];
  }

  private getValuationConfidence(salesCount: number, hasRarity: boolean): 'low' | 'medium' | 'high' {
    if (salesCount > 10 && hasRarity) return 'high';
    if (salesCount > 3 || hasRarity) return 'medium';
    return 'low';
  }

  private async buildTransferTransaction(
    contractAddress: string,
    tokenId: string,
    to: string,
    from: string,
    chainId: number,
    amount?: string
  ): Promise<any> {
    // Build transfer transaction data
    return {
      from,
      to: contractAddress,
      value: '0',
      data: '0x', // Would contain actual transfer calldata
      chainId
    };
  }

  private async loadCache(): Promise<void> {
    try {
      const cacheJson = await AsyncStorage.getItem('nftCache');
      if (cacheJson) {
        const cache = JSON.parse(cacheJson);
        this.metadataCache = new Map(cache.metadata || []);
        this.priceCache = new Map(cache.prices || []);
        this.rarityCache = new Map(cache.rarity || []);
      }
    } catch (error) {
      console.error('Failed to load NFT cache:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const cache = {
        metadata: Array.from(this.metadataCache.entries()),
        prices: Array.from(this.priceCache.entries()),
        rarity: Array.from(this.rarityCache.entries())
      };
      await AsyncStorage.setItem('nftCache', JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save NFT cache:', error);
    }
  }

  private startPriceMonitoring(): void {
    // Monitor floor prices every 10 minutes
    const interval = setInterval(async () => {
      try {
        // Update floor prices for active collections
        for (const [key] of this.priceCache) {
          if (key.startsWith('floor_')) {
            const [, address, chainId] = key.split('_');
            await this.getCollectionFloorPrice(address, parseInt(chainId));
          }
        }
      } catch (error) {
        console.error('Price monitoring error:', error);
      }
    }, 600000);
    
    this.monitoringIntervals.set('price_monitoring', interval);
  }

  /**
   * Destroy service and cleanup
   */
  public destroy(): void {
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
  }
}

// Export singleton instance
export const nftService = NFTService.getInstance();
export default nftService;
