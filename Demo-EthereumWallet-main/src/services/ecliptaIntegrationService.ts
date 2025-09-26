import { ethers } from 'ethers';
import { Network } from '../types';
import smartContractService from './smartContractService';
import { DeFiService } from './DeFiService';
import contracts from '../config/contracts.json';

export interface CypherEcosystem {
  token: string;
  dex: string;
  staking: string;
  multiSig: string;
  nft: string;
  marketplace: string;
}

export interface ContractConfig {
  tokenSymbol: string;
  tokenDecimals: number;
  dexTradingFee: number;
  marketplaceFee: number;
  nftBaseURI: string;
}

class CypherIntegrationService {
  private static instance: CypherIntegrationService;
  private providers: Map<number, ethers.providers.JsonRpcProvider> = new Map();
  private initialized = false;
  
  // Contract addresses by network
  private ecosystemContracts: { [chainId: number]: CypherEcosystem } = {};
  
  // Contract configurations
  private contractConfig: ContractConfig = {
    tokenSymbol: 'ECLP',
    tokenDecimals: 18,
    dexTradingFee: 30,
    marketplaceFee: 250,
    nftBaseURI: 'https://api.cypher.io/nft/metadata/'
  };

  static getInstance(): CypherIntegrationService {
    if (!CypherIntegrationService.instance) {
      CypherIntegrationService.instance = new CypherIntegrationService();
    }
    return CypherIntegrationService.instance;
  }

  private constructor() {
    this.loadContractAddresses();
  }

  /**
   * Load contract addresses from configuration
   */
  private loadContractAddresses(): void {
    try {
      const config = contracts as any;
      
      if (config.contracts && config.network) {
        const chainId = config.network.chainId || 31337;
        
        this.ecosystemContracts[chainId] = {
          token: config.contracts.CypherToken || '',
          dex: config.contracts.CypherDEX || '',
          staking: config.contracts.CypherStaking || '',
          multiSig: config.contracts.CypherMultiSigWallet || '',
          nft: config.contracts.CypherNFT || '',
          marketplace: config.contracts.CypherNFTMarketplace || ''
        };

        if (config.config) {
          this.contractConfig = {
            tokenSymbol: config.config.tokenSymbol || 'ECLP',
            tokenDecimals: config.config.tokenDecimals || 18,
            dexTradingFee: config.config.dexTradingFee || 30,
            marketplaceFee: config.config.marketplaceFee || 250,
            nftBaseURI: config.config.nftBaseURI || 'https://api.cypher.io/nft/metadata/'
          };
        }

        console.log(`Loaded Cypher contracts for network ${chainId}:`, this.ecosystemContracts[chainId]);
        this.initialized = true;
      }
    } catch (error) {
      console.error('Error loading contract addresses:', error);
    }
  }

  /**
   * Initialize the ecosystem with deployed contract addresses
   */
  initializeEcosystem(chainId: number, contracts: CypherEcosystem): void {
    this.ecosystemContracts[chainId] = contracts;
    
    // Initialize DeFi service with contract addresses
    const defiService = DeFiService.getInstance();
    // TODO: Add setCypherContracts method to DeFiService or handle contract integration differently
    console.log('DeFi service initialized with contracts:', contracts);
    
    this.initialized = true;
    console.log(`Cypher ecosystem initialized for network ${chainId}`);
  }

  /**
   * Get contract addresses for network
   */
  getContracts(chainId: number): CypherEcosystem | null {
    return this.ecosystemContracts[chainId] || null;
  }

  /**
   * Get contract configuration
   */
  getConfig(): ContractConfig {
    return this.contractConfig;
  }

  /**
   * Check if ecosystem is deployed on network
   */
  isDeployed(chainId: number): boolean {
    const contracts = this.ecosystemContracts[chainId];
    return !!(contracts?.token && contracts?.dex && contracts?.staking);
  }

  /**
   * Get provider for network
   */
  private getProvider(network: Network): ethers.providers.JsonRpcProvider {
    if (!this.providers.has(network.chainId)) {
      this.providers.set(network.chainId, new ethers.providers.JsonRpcProvider(network.rpcUrl));
    }
    return this.providers.get(network.chainId)!;
  }

  /**
   * Get ECLP token balance
   */
  async getECLPBalance(userAddress: string, network: Network): Promise<string> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.token) return '0';

      const balance = await smartContractService.callContractFunction(
        contracts.token,
        'balanceOf',
        [userAddress],
        network
      );

      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error getting ECLP balance:', error);
      return '0';
    }
  }

  /**
   * Get ECLP token details
   */
  async getTokenDetails(network: Network): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    maxSupply: string;
  } | null> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.token) return null;

      const [name, symbol, decimals, totalSupply, maxSupply] = await Promise.all([
        smartContractService.callContractFunction(contracts.token, 'name', [], network),
        smartContractService.callContractFunction(contracts.token, 'symbol', [], network),
        smartContractService.callContractFunction(contracts.token, 'decimals', [], network),
        smartContractService.callContractFunction(contracts.token, 'totalSupply', [], network),
        smartContractService.callContractFunction(contracts.token, 'maxSupply', [], network)
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatEther(totalSupply),
        maxSupply: ethers.utils.formatEther(maxSupply)
      };
    } catch (error) {
      console.error('Error getting token details:', error);
      return null;
    }
  }

  /**
   * Transfer ECLP tokens
   */
  async transferECLP(
    to: string,
    amount: string,
    privateKey: string,
    network: Network
  ): Promise<ethers.providers.TransactionResponse> {
    const contracts = this.getContracts(network.chainId);
    if (!contracts?.token) {
      throw new Error('ECLP token not deployed on this network');
    }

    const contractCall = {
      contractAddress: contracts.token,
      functionName: 'transfer',
      params: [to, ethers.utils.parseEther(amount)]
    };

    return await smartContractService.executeContractTransaction(
      contractCall,
      privateKey,
      network
    );
  }

  /**
   * Approve ECLP tokens for spending
   */
  async approveECLP(
    spender: string,
    amount: string,
    privateKey: string,
    network: Network
  ): Promise<ethers.providers.TransactionResponse> {
    const contracts = this.getContracts(network.chainId);
    if (!contracts?.token) {
      throw new Error('ECLP token not deployed on this network');
    }

    const contractCall = {
      contractAddress: contracts.token,
      functionName: 'approve',
      params: [spender, ethers.utils.parseEther(amount)]
    };

    return await smartContractService.executeContractTransaction(
      contractCall,
      privateKey,
      network
    );
  }

  /**
   * Get DEX pairs with ECLP
   */
  async getECLPPairs(network: Network): Promise<Array<{
    pairId: string;
    tokenA: string;
    tokenB: string;
    reserveA: string;
    reserveB: string;
    price: number;
  }>> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.dex || !contracts?.token) return [];

      const allPairs = await smartContractService.callContractFunction(
        contracts.dex,
        'getAllPairs',
        [],
        network
      );

      const pairs = [];
      for (const pairId of allPairs) {
        try {
          const pairInfo = await smartContractService.callContractFunction(
            contracts.dex,
            'getPairInfo',
            [pairId],
            network
          );

          // Check if pair contains ECLP token
          if (pairInfo.tokenA === contracts.token || pairInfo.tokenB === contracts.token) {
            const price = await smartContractService.callContractFunction(
              contracts.dex,
              'getPrice',
              [pairId, contracts.token],
              network
            );

            pairs.push({
              pairId,
              tokenA: pairInfo.tokenA,
              tokenB: pairInfo.tokenB,
              reserveA: ethers.utils.formatEther(pairInfo.reserveA),
              reserveB: ethers.utils.formatEther(pairInfo.reserveB),
              price: parseFloat(ethers.utils.formatEther(price))
            });
          }
        } catch (error) {
          console.error(`Error getting pair ${pairId}:`, error);
        }
      }

      return pairs;
    } catch (error) {
      console.error('Error getting ECLP pairs:', error);
      return [];
    }
  }

  /**
   * Get user's staking positions
   */
  async getStakingPositions(userAddress: string, network: Network): Promise<Array<{
    poolId: number;
    stakedAmount: string;
    pendingRewards: string;
    lockPeriod: number;
    unlockTime: number;
    apy: number;
  }>> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.staking) return [];

      const activePools = await smartContractService.callContractFunction(
        contracts.staking,
        'getUserActivePools',
        [userAddress],
        network
      );

      const positions = [];
      for (const poolId of activePools) {
        try {
          const stakeInfo = await smartContractService.callContractFunction(
            contracts.staking,
            'getUserStakeInfo',
            [userAddress, poolId],
            network
          );

          const poolInfo = await smartContractService.callContractFunction(
            contracts.staking,
            'getPoolInfo',
            [poolId],
            network
          );

          positions.push({
            poolId: parseInt(poolId.toString()),
            stakedAmount: ethers.utils.formatEther(stakeInfo.stakedAmount),
            pendingRewards: ethers.utils.formatEther(stakeInfo.pendingReward),
            lockPeriod: parseInt(poolInfo.lockPeriod.toString()),
            unlockTime: parseInt(stakeInfo.unlockTime.toString()),
            apy: this.calculateAPY(poolInfo.rewardRate, poolInfo.lockPeriod)
          });
        } catch (error) {
          console.error(`Error getting stake info for pool ${poolId}:`, error);
        }
      }

      return positions;
    } catch (error) {
      console.error('Error getting staking positions:', error);
      return [];
    }
  }

  /**
   * Calculate APY from reward rate and lock period
   */
  private calculateAPY(rewardRate: ethers.BigNumber, lockPeriod: ethers.BigNumber): number {
    try {
      const rewardRateNum = parseFloat(ethers.utils.formatEther(rewardRate));
      const lockPeriodSeconds = parseInt(lockPeriod.toString());
      
      if (lockPeriodSeconds === 0) return rewardRateNum * 0.1;
      
      const yearSeconds = 365 * 24 * 60 * 60;
      const periodsPerYear = yearSeconds / lockPeriodSeconds;
      
      return rewardRateNum * periodsPerYear;
    } catch {
      return 0;
    }
  }

  /**
   * Get user's NFTs from Cypher collection
   */
  async getUserNFTs(userAddress: string, network: Network): Promise<Array<{
    tokenId: string;
    tokenURI: string;
    owner: string;
  }>> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.nft) return [];

      const balance = await smartContractService.callContractFunction(
        contracts.nft,
        'balanceOf',
        [userAddress],
        network
      );

      const nfts = [];
      const balanceNum = parseInt(balance.toString());

      for (let i = 0; i < balanceNum; i++) {
        try {
          const tokenId = await smartContractService.callContractFunction(
            contracts.nft,
            'tokenOfOwnerByIndex',
            [userAddress, i],
            network
          );

          const tokenURI = await smartContractService.callContractFunction(
            contracts.nft,
            'tokenURI',
            [tokenId],
            network
          );

          nfts.push({
            tokenId: tokenId.toString(),
            tokenURI,
            owner: userAddress
          });
        } catch (error) {
          console.error(`Error getting NFT ${i}:`, error);
        }
      }

      return nfts;
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }

  /**
   * Get marketplace listings
   */
  async getMarketplaceListings(network: Network): Promise<Array<{
    listingId: string;
    seller: string;
    nftContract: string;
    tokenId: string;
    price: string;
    paymentToken: string;
    active: boolean;
  }>> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts?.marketplace) return [];

      const activeListings = await smartContractService.callContractFunction(
        contracts.marketplace,
        'getActiveListings',
        [],
        network
      );

      const listings = [];
      for (const listingId of activeListings) {
        try {
          const listing = await smartContractService.callContractFunction(
            contracts.marketplace,
            'listings',
            [listingId],
            network
          );

          listings.push({
            listingId,
            seller: listing.seller,
            nftContract: listing.nftContract,
            tokenId: listing.tokenId.toString(),
            price: ethers.utils.formatEther(listing.price),
            paymentToken: listing.paymentToken,
            active: listing.active
          });
        } catch (error) {
          console.error(`Error getting listing ${listingId}:`, error);
        }
      }

      return listings;
    } catch (error) {
      console.error('Error getting marketplace listings:', error);
      return [];
    }
  }

  /**
   * Get ecosystem statistics
   */
  async getEcosystemStats(network: Network): Promise<{
    tokenStats: {
      totalSupply: string;
      circulatingSupply: string;
      holders: number;
    };
    dexStats: {
      totalLiquidity: number;
      volume24h: number;
      pairCount: number;
    };
    stakingStats: {
      totalStaked: string;
      totalRewardsDistributed: string;
      activeStakers: number;
    };
    nftStats: {
      totalSupply: number;
      totalVolume: number;
      floorPrice: string;
    };
  } | null> {
    try {
      const contracts = this.getContracts(network.chainId);
      if (!contracts || !this.isDeployed(network.chainId)) return null;

      // Get token stats
      const [totalSupply, totalStaked, totalRewardsDistributed] = await Promise.all([
        smartContractService.callContractFunction(contracts.token, 'totalSupply', [], network),
        smartContractService.callContractFunction(contracts.staking, 'getTotalStaked', [], network),
        smartContractService.callContractFunction(contracts.staking, 'totalRewardsDistributed', [], network)
      ]);

      // Get DEX stats
      const allPairs = await smartContractService.callContractFunction(
        contracts.dex,
        'getAllPairs',
        [],
        network
      );

      let totalLiquidity = 0;
      for (const pairId of allPairs) {
        try {
          const pairInfo = await smartContractService.callContractFunction(
            contracts.dex,
            'getPairInfo',
            [pairId],
            network
          );
          // Simplified TVL calculation
          totalLiquidity += parseFloat(ethers.utils.formatEther(pairInfo.reserveA)) * 2;
        } catch (error) {
          console.error(`Error calculating liquidity for pair ${pairId}:`, error);
        }
      }

      // Get NFT stats
      const nftTotalSupply = await smartContractService.callContractFunction(
        contracts.nft,
        'totalSupply',
        [],
        network
      );

      return {
        tokenStats: {
          totalSupply: ethers.utils.formatEther(totalSupply),
          circulatingSupply: ethers.utils.formatEther(totalSupply), // Simplified
          holders: 0 // Would need indexing service
        },
        dexStats: {
          totalLiquidity,
          volume24h: 0, // Would need historical data
          pairCount: allPairs.length
        },
        stakingStats: {
          totalStaked: ethers.utils.formatEther(totalStaked),
          totalRewardsDistributed: ethers.utils.formatEther(totalRewardsDistributed),
          activeStakers: 0 // Would need indexing service
        },
        nftStats: {
          totalSupply: parseInt(nftTotalSupply.toString()),
          totalVolume: 0, // Would need marketplace event indexing
          floorPrice: '0' // Would need marketplace analysis
        }
      };
    } catch (error) {
      console.error('Error getting ecosystem stats:', error);
      return null;
    }
  }

  /**
   * Deploy entire ecosystem (for development/testing)
   */
  async deployEcosystem(
    privateKey: string,
    network: Network,
    config?: Partial<ContractConfig>
  ): Promise<CypherEcosystem> {
    // This would be used for development/testing
    // In production, contracts would be deployed via deployment script
    throw new Error('Use deployment script for production deployment');
  }

  /**
   * Verify all contracts are properly integrated
   */
  async verifyIntegration(network: Network): Promise<{
    token: boolean;
    dex: boolean;
    staking: boolean;
    multiSig: boolean;
    nft: boolean;
    marketplace: boolean;
  }> {
    const contracts = this.getContracts(network.chainId);
    const results = {
      token: false,
      dex: false,
      staking: false,
      multiSig: false,
      nft: false,
      marketplace: false
    };

    if (!contracts) return results;

    try {
      // Verify token
      if (contracts.token) {
        await smartContractService.callContractFunction(contracts.token, 'symbol', [], network);
        results.token = true;
      }

      // Verify DEX
      if (contracts.dex) {
        await smartContractService.callContractFunction(contracts.dex, 'owner', [], network);
        results.dex = true;
      }

      // Verify staking
      if (contracts.staking) {
        await smartContractService.callContractFunction(contracts.staking, 'stakingToken', [], network);
        results.staking = true;
      }

      // Verify multiSig
      if (contracts.multiSig) {
        await smartContractService.callContractFunction(contracts.multiSig, 'getOwners', [], network);
        results.multiSig = true;
      }

      // Verify NFT
      if (contracts.nft) {
        await smartContractService.callContractFunction(contracts.nft, 'name', [], network);
        results.nft = true;
      }

      // Verify marketplace
      if (contracts.marketplace) {
        await smartContractService.callContractFunction(contracts.marketplace, 'owner', [], network);
        results.marketplace = true;
      }
    } catch (error) {
      console.error('Error verifying contracts:', error);
    }

    return results;
  }
}

export default CypherIntegrationService;
