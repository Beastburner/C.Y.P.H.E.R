/**
 * Enhanced RPC Service - Revolutionary Network Management
 * Ultra-reliable multi-chain RPC service with intelligent failover and optimization
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

interface RpcEndpoint {
  url: string;
  priority: number;
  latency: number;
  failures: number;
  lastSuccess: number;
  isWorking: boolean;
}

interface NetworkRpcConfig {
  chainId: number;
  name: string;
  symbol: string;
  endpoints: RpcEndpoint[];
  activeEndpointIndex: number;
  provider: ethers.providers.JsonRpcProvider | null;
}

/**
 * Enhanced RPC Service with intelligent failover and performance optimization
 */
export class EnhancedRpcService {
  private static instance: EnhancedRpcService;
  private networks: Map<number, NetworkRpcConfig> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly MAX_FAILURES = 3;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  private constructor() {
    this.initializeNetworks();
    this.startHealthChecking();
  }

  public static getInstance(): EnhancedRpcService {
    if (!EnhancedRpcService.instance) {
      EnhancedRpcService.instance = new EnhancedRpcService();
    }
    return EnhancedRpcService.instance;
  }

  /**
   * Initialize all networks with their RPC endpoints using production API keys
   */
  private async initializeNetworks(): Promise<void> {
    // Get API keys from environment
    const INFURA_PROJECT_ID = Config.INFURA_PROJECT_ID || '18e72f0e085d4f978e259201b7dbfe66';
    const ALCHEMY_API_KEY = Config.ALCHEMY_API_KEY || '19e0f26eec044c3fa043cf82ec34b168';
    const ETHEREUM_RPC_URL = Config.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com';
    const POLYGON_RPC_URL = Config.POLYGON_RPC_URL || 'https://polygon.llamarpc.com';
    const BSC_RPC_URL = Config.BSC_RPC_URL || 'https://bsc.llamarpc.com';

    console.log('🔧 Initializing RPC networks with production API keys...');

    const networkConfigs = [
      {
        chainId: 1,
        name: 'Ethereum Mainnet',
        symbol: 'ETH',
        endpoints: [
          `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
          `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
          ETHEREUM_RPC_URL,
          'https://ethereum.publicnode.com',
          'https://eth.llamarpc.com',
          'https://rpc.flashbots.net'
        ]
      },
      {
        chainId: 137,
        name: 'Polygon',
        symbol: 'MATIC',
        endpoints: [
          `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
          `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          POLYGON_RPC_URL,
          'https://polygon-rpc.com',
          'https://polygon.publicnode.com',
          'https://polygon.llamarpc.com'
        ]
      },
      {
        chainId: 56,
        name: 'BNB Smart Chain',
        symbol: 'BNB',
        endpoints: [
          BSC_RPC_URL,
          'https://bsc-dataseed1.binance.org',
          'https://bsc.publicnode.com',
          'https://bsc.llamarpc.com',
          'https://bsc-dataseed2.binance.org'
        ]
      },
      {
        chainId: 42161,
        name: 'Arbitrum One',
        symbol: 'ETH',
        endpoints: [
          `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
          `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          'https://arb1.arbitrum.io/rpc',
          'https://arbitrum.publicnode.com',
          'https://arbitrum.llamarpc.com'
        ]
      },
      {
        chainId: 10,
        name: 'Optimism',
        symbol: 'ETH',
        endpoints: [
          `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
          `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          'https://mainnet.optimism.io',
          'https://optimism.publicnode.com',
          'https://optimism.llamarpc.com'
        ]
      },
      {
        chainId: 43114,
        name: 'Avalanche C-Chain',
        symbol: 'AVAX',
        endpoints: [
          'https://api.avax.network/ext/bc/C/rpc',
          'https://avalanche-c-chain.publicnode.com',
          'https://avalanche.public-rpc.com'
        ]
      },
      {
        chainId: 11155111,
        name: 'Sepolia Testnet',
        symbol: 'SepoliaETH',
        endpoints: [
          `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
          `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
          'https://ethereum-sepolia.publicnode.com',
          'https://sepolia.gateway.tenderly.co',
          'https://rpc.sepolia.org'
        ]
      }
    ];

    console.log(`📡 Configured ${networkConfigs.length} networks with production endpoints`);

    for (const config of networkConfigs) {
      const rpcEndpoints: RpcEndpoint[] = config.endpoints.map((url, index) => ({
        url,
        priority: index,
        latency: 0,
        failures: 0,
        lastSuccess: 0,
        isWorking: true
      }));

      const networkConfig: NetworkRpcConfig = {
        chainId: config.chainId,
        name: config.name,
        symbol: config.symbol,
        endpoints: rpcEndpoints,
        activeEndpointIndex: 0,
        provider: null
      };

      this.networks.set(config.chainId, networkConfig);
      await this.initializeProvider(config.chainId);
    }

    // Networks initialized silently
  }

  /**
   * Initialize provider for a specific network
   */
  private async initializeProvider(chainId: number): Promise<void> {
    const network = this.networks.get(chainId);
    if (!network) return;

    for (let i = 0; i < network.endpoints.length; i++) {
      const endpoint = network.endpoints[i];
      
      try {
        const provider = new ethers.providers.JsonRpcProvider({
          url: endpoint.url,
          timeout: this.REQUEST_TIMEOUT
        });

        // Test the connection
        const startTime = Date.now();
        const blockNumber = await Promise.race([
          provider.getBlockNumber(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);

        if (blockNumber > 0) {
          endpoint.latency = Date.now() - startTime;
          endpoint.lastSuccess = Date.now();
          endpoint.isWorking = true;
          endpoint.failures = 0;

          network.provider = provider;
          network.activeEndpointIndex = i;

          console.log(`✅ Connected to chain ${chainId}`);
          return;
        }
      } catch (error) {
        // Suppress individual endpoint failures
        endpoint.isWorking = false;
        endpoint.failures++;
      }
    }

    console.error(`❌ All endpoints failed for ${network.name} (${chainId})`);
  }

  /**
   * Get provider with automatic failover
   */
  public async getProvider(chainId: number): Promise<ethers.providers.JsonRpcProvider | null> {
    const network = this.networks.get(chainId);
    if (!network) {
      console.error(`Network ${chainId} not found`);
      return null;
    }

    // If current provider is working, return it
    if (network.provider) {
      try {
        // Quick health check
        await Promise.race([
          network.provider.getBlockNumber(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);
        return network.provider;
      } catch (error) {
        console.warn(`Current provider failed for chain ${chainId}, attempting failover`);
        await this.failoverToNextProvider(chainId);
      }
    }

    return network.provider;
  }

  /**
   * Failover to next available provider
   */
  private async failoverToNextProvider(chainId: number): Promise<void> {
    const network = this.networks.get(chainId);
    if (!network) return;

    const currentEndpoint = network.endpoints[network.activeEndpointIndex];
    currentEndpoint.failures++;
    currentEndpoint.isWorking = false;

    // Find next working endpoint
    for (let i = 0; i < network.endpoints.length; i++) {
      const nextIndex = (network.activeEndpointIndex + 1 + i) % network.endpoints.length;
      const endpoint = network.endpoints[nextIndex];

      if (endpoint.failures < this.MAX_FAILURES) {
        try {
          const provider = new ethers.providers.JsonRpcProvider({
            url: endpoint.url,
            timeout: this.REQUEST_TIMEOUT
          });

          const startTime = Date.now();
          const blockNumber = await Promise.race([
            provider.getBlockNumber(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);

          if (blockNumber > 0) {
            endpoint.latency = Date.now() - startTime;
            endpoint.lastSuccess = Date.now();
            endpoint.isWorking = true;
            endpoint.failures = 0;

            network.provider = provider;
            network.activeEndpointIndex = nextIndex;

            console.log(`🔄 Failover successful for chain ${chainId}: ${endpoint.url}`);
            return;
          }
        } catch (error) {
          endpoint.failures++;
          endpoint.isWorking = false;
        }
      }
    }

    console.error(`❌ All providers failed for chain ${chainId}`);
    network.provider = null;
  }

  /**
   * Get balance for an address with enhanced error handling
   */
  public async getBalance(address: string, chainId: number = 1): Promise<string> {
    const network = this.networks.get(chainId);
    if (!network) {
      console.warn(`Network ${chainId} not found, using fallback balance calculation`);
      return '0';
    }

    // Try to get provider
    const provider = await this.getProvider(chainId);
    if (!provider) {
      console.warn(`No provider available for chain ${chainId}, returning 0 balance`);
      return '0';
    }

    try {
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      // Try failover on error
      await this.failoverToNextProvider(chainId);
      const newProvider = await this.getProvider(chainId);
      
      if (newProvider) {
        const balance = await newProvider.getBalance(address);
        return ethers.utils.formatEther(balance);
      }
      
      throw error;
    }
  }

  /**
   * Get transaction count (nonce)
   */
  public async getTransactionCount(address: string, chainId: number = 1): Promise<number> {
    const provider = await this.getProvider(chainId);
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      return await provider.getTransactionCount(address, 'pending');
    } catch (error) {
      await this.failoverToNextProvider(chainId);
      const newProvider = await this.getProvider(chainId);
      
      if (newProvider) {
        return await newProvider.getTransactionCount(address, 'pending');
      }
      
      throw error;
    }
  }

  /**
   * Send transaction
   */
  public async sendTransaction(signedTx: string, chainId: number = 1): Promise<ethers.providers.TransactionResponse> {
    const provider = await this.getProvider(chainId);
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      return await provider.sendTransaction(signedTx);
    } catch (error) {
      await this.failoverToNextProvider(chainId);
      const newProvider = await this.getProvider(chainId);
      
      if (newProvider) {
        return await newProvider.sendTransaction(signedTx);
      }
      
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  public async getGasPrice(chainId: number = 1): Promise<ethers.BigNumber> {
    const provider = await this.getProvider(chainId);
    if (!provider) {
      throw new Error('Provider not available');
    }

    try {
      return await provider.getGasPrice();
    } catch (error) {
      await this.failoverToNextProvider(chainId);
      const newProvider = await this.getProvider(chainId);
      
      if (newProvider) {
        return await newProvider.getGasPrice();
      }
      
      throw error;
    }
  }

  /**
   * Get network information
   */
  public getNetworkInfo(chainId: number): { name: string; symbol: string } | null {
    const network = this.networks.get(chainId);
    return network ? { name: network.name, symbol: network.symbol } : null;
  }

  /**
   * Get all supported networks
   */
  public getSupportedNetworks(): Array<{ chainId: number; name: string; symbol: string }> {
    return Array.from(this.networks.values()).map(network => ({
      chainId: network.chainId,
      name: network.name,
      symbol: network.symbol
    }));
  }

  /**
   * Get network health status
   */
  public getNetworkHealth(chainId: number): any {
    const network = this.networks.get(chainId);
    if (!network) return null;

    const activeEndpoint = network.endpoints[network.activeEndpointIndex];
    return {
      chainId,
      name: network.name,
      isHealthy: activeEndpoint?.isWorking || false,
      activeEndpoint: activeEndpoint?.url || 'None',
      latency: activeEndpoint?.latency || 0,
      failures: activeEndpoint?.failures || 0,
      lastSuccess: activeEndpoint?.lastSuccess || 0
    };
  }

  /**
   * Start periodic health checking
   */
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Perform health checks on all networks
   */
  private async performHealthChecks(): Promise<void> {
    for (const [chainId, network] of this.networks) {
      if (network.provider) {
        try {
          await Promise.race([
            network.provider.getBlockNumber(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
          
          const activeEndpoint = network.endpoints[network.activeEndpointIndex];
          activeEndpoint.lastSuccess = Date.now();
          activeEndpoint.isWorking = true;
        } catch (error) {
          console.warn(`Health check failed for ${network.name}:`, error);
          await this.failoverToNextProvider(chainId);
        }
      }
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    for (const network of this.networks.values()) {
      if (network.provider) {
        network.provider.removeAllListeners();
      }
    }

    this.networks.clear();
  }
}

// Export singleton instance
export const enhancedRpcService = EnhancedRpcService.getInstance();
export default enhancedRpcService;
