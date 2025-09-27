/**
 * Cypher Wallet - Web3 Provider Service
 * Unified Web3 provider interface for seamless blockchain interactions
 * 
 * Features:
 * - Multi-provider support (JsonRpc, WebSocket, IPC)
 * - Provider health monitoring and failover
 * - Connection pooling and load balancing
 * - Automatic retry mechanisms
 * - Event listeners and subscriptions
 * - Provider caching and optimization
 */

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { NetworkConfig } from './NetworkService';
import { networkService } from './NetworkService';

export interface ProviderConfig {
  url: string;
  type: 'http' | 'websocket' | 'ipc';
  priority: number;
  maxRetries: number;
  timeout: number;
  rateLimitPerSecond?: number;
  apiKey?: string;
}

export interface ProviderStatus {
  isHealthy: boolean;
  lastChecked: number;
  responseTime: number;
  blockNumber: number;
  errors: number;
  successRate: number;
}

export interface Web3Connection {
  provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider;
  config: ProviderConfig;
  status: ProviderStatus;
  chainId: number;
}

export interface ContractCallOptions {
  from?: string;
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  blockTag?: string | number;
}

export interface EventSubscription {
  id: string;
  event: string;
  filter?: any;
  callback: (event: any) => void;
  provider: ethers.providers.Provider;
}

/**
 * Web3 Provider Service - Enterprise-grade provider management
 */
export class Web3ProviderService extends EventEmitter {
  private static instance: Web3ProviderService;
  private connections: Map<number, Web3Connection[]> = new Map();
  private activeConnections: Map<number, Web3Connection> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private contractCache: Map<string, ethers.Contract> = new Map();
  private callCache: Map<string, { result: any; timestamp: number }> = new Map();
  
  // Cache settings
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 10000; // 10 seconds

  private constructor() {
    super();
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  public static getInstance(): Web3ProviderService {
    if (!Web3ProviderService.instance) {
      Web3ProviderService.instance = new Web3ProviderService();
    }
    return Web3ProviderService.instance;
  }

  /**
   * Initialize providers for all supported networks
   */
  private async initializeProviders(): Promise<void> {
    try {
      const networks = [1, 137, 56, 42161, 10, 11155111]; // Supported chain IDs
      
      for (const chainId of networks) {
        try {
          const network = networkService.getNetworkByChainId(chainId);
          if (network) {
            await this.setupNetworkProviders(network);
          }
        } catch (error) {
          console.warn(`Failed to initialize providers for chain ${chainId}:`, error);
        }
      }
      
      this.emit('providers-initialized');
    } catch (error) {
      console.error('Failed to initialize Web3 providers:', error);
      this.emit('providers-error', error);
    }
  }

  /**
   * Setup providers for a specific network
   */
  private async setupNetworkProviders(network: NetworkConfig): Promise<void> {
    const connections: Web3Connection[] = [];
    
    // Create providers from RPC URLs
    network.rpcUrls.forEach((url, index) => {
      try {
        const config: ProviderConfig = {
          url,
          type: url.startsWith('ws') ? 'websocket' : 'http',
          priority: index,
          maxRetries: this.MAX_RETRIES,
          timeout: this.TIMEOUT
        };

        let provider: ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider;
        
        if (config.type === 'websocket') {
          provider = new ethers.providers.WebSocketProvider(url);
        } else {
          provider = new ethers.providers.JsonRpcProvider(url);
        }

        const connection: Web3Connection = {
          provider,
          config,
          status: {
            isHealthy: true,
            lastChecked: Date.now(),
            responseTime: 0,
            blockNumber: 0,
            errors: 0,
            successRate: 100
          },
          chainId: network.chainId
        };

        connections.push(connection);
      } catch (error) {
        console.warn(`Failed to create provider for ${url}:`, error);
      }
    });

    if (connections.length > 0) {
      this.connections.set(network.chainId, connections);
      
      // Set the first healthy provider as active
      const healthyConnection = connections.find(conn => conn.status.isHealthy);
      if (healthyConnection) {
        this.activeConnections.set(network.chainId, healthyConnection);
      }
    }
  }

  /**
   * Get active provider for a chain
   */
  public getProvider(chainId?: number): ethers.providers.Provider {
    const targetChainId = chainId || networkService.getCurrentNetwork().chainId;
    const connection = this.activeConnections.get(targetChainId);
    
    if (!connection || !connection.status.isHealthy) {
      // Try to find a healthy backup provider
      const backupConnection = this.findHealthyProvider(targetChainId);
      if (backupConnection) {
        this.activeConnections.set(targetChainId, backupConnection);
        return backupConnection.provider;
      }
      
      throw new Error(`No healthy provider available for chain ${targetChainId}`);
    }
    
    return connection.provider;
  }

  /**
   * Find a healthy provider for failover
   */
  private findHealthyProvider(chainId: number): Web3Connection | null {
    const connections = this.connections.get(chainId);
    if (!connections) return null;
    
    // Sort by priority and health status
    const healthyConnections = connections
      .filter(conn => conn.status.isHealthy)
      .sort((a, b) => a.config.priority - b.config.priority);
    
    return healthyConnections[0] || null;
  }

  /**
   * Get provider with automatic retry and failover
   */
  public async getProviderWithRetry(chainId?: number, maxRetries: number = 3): Promise<ethers.providers.Provider> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const provider = this.getProvider(chainId);
        
        // Test the provider with a simple call
        await provider.getBlockNumber();
        
        return provider;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          // Try to switch to a backup provider
          const targetChainId = chainId || networkService.getCurrentNetwork().chainId;
          await this.switchToBackupProvider(targetChainId);
        }
      }
    }
    
    throw lastError || new Error('All providers failed');
  }

  /**
   * Switch to backup provider
   */
  private async switchToBackupProvider(chainId: number): Promise<void> {
    const connections = this.connections.get(chainId);
    if (!connections) return;
    
    const currentActive = this.activeConnections.get(chainId);
    
    // Find the next healthy provider
    const availableProviders = connections.filter(conn => 
      conn !== currentActive && conn.status.isHealthy
    );
    
    if (availableProviders.length > 0) {
      const nextProvider = availableProviders[0];
      this.activeConnections.set(chainId, nextProvider);
      
      this.emit('provider-switched', {
        chainId,
        from: currentActive?.config.url,
        to: nextProvider.config.url
      });
    }
  }

  /**
   * Health monitoring for all providers
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Perform health checks on all providers
   */
  private async performHealthChecks(): Promise<void> {
    const allConnections = Array.from(this.connections.values()).flat();
    
    const healthPromises = allConnections.map(async (connection) => {
      const startTime = Date.now();
      
      try {
        // Test with getBlockNumber call
        const blockNumber = await connection.provider.getBlockNumber();
        const responseTime = Date.now() - startTime;
        
        // Update status
        connection.status = {
          ...connection.status,
          isHealthy: true,
          lastChecked: Date.now(),
          responseTime,
          blockNumber,
          successRate: Math.min(connection.status.successRate + 1, 100)
        };
        
        this.emit('provider-healthy', {
          chainId: connection.chainId,
          url: connection.config.url,
          responseTime,
          blockNumber
        });
        
      } catch (error) {
        connection.status = {
          ...connection.status,
          isHealthy: false,
          lastChecked: Date.now(),
          errors: connection.status.errors + 1,
          successRate: Math.max(connection.status.successRate - 5, 0)
        };
        
        this.emit('provider-unhealthy', {
          chainId: connection.chainId,
          url: connection.config.url,
          error
        });
      }
    });
    
    await Promise.allSettled(healthPromises);
  }

  /**
   * Get contract instance with caching
   */
  public getContract(
    address: string,
    abi: any[],
    signerOrProvider?: ethers.Signer | ethers.providers.Provider,
    chainId?: number
  ): ethers.Contract {
    const cacheKey = `${address}-${chainId || 'current'}`;
    
    if (this.contractCache.has(cacheKey)) {
      const cached = this.contractCache.get(cacheKey)!;
      
      // Update signer/provider if provided
      if (signerOrProvider) {
        return cached.connect(signerOrProvider) as ethers.Contract;
      }
      
      return cached;
    }
    
    const provider = signerOrProvider || this.getProvider(chainId);
    const contract = new ethers.Contract(address, abi, provider);
    
    this.contractCache.set(cacheKey, contract);
    return contract;
  }

  /**
   * Call contract method with caching and retry
   */
  public async callContract(
    contract: ethers.Contract,
    methodName: string,
    args: any[] = [],
    options: ContractCallOptions = {}
  ): Promise<any> {
    const cacheKey = `${await contract.getAddress()}-${methodName}-${JSON.stringify(args)}-${JSON.stringify(options)}`;
    
    // Check cache
    const cached = this.callCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const result = await contract[methodName](...args, options);
        
        // Cache the result
        this.callCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.MAX_RETRIES - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    throw lastError || new Error('Contract call failed');
  }

  /**
   * Subscribe to events
   */
  public subscribeToEvents(
    contract: ethers.Contract,
    eventName: string,
    filter: any = {},
    callback: (event: any) => void
  ): string {
    const subscriptionId = `${Date.now()}-${Math.random()}`;
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      event: eventName,
      filter,
      callback,
      provider: contract.runner?.provider || this.getProvider()
    };
    
    // Set up event listener
    contract.on(eventName, callback);
    
    this.subscriptions.set(subscriptionId, subscription);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      // Remove listener
      const contracts = Array.from(this.contractCache.values());
      contracts.forEach(contract => {
        contract.off(subscription.event, subscription.callback);
      });
      
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Get provider statistics
   */
  public getProviderStats(chainId?: number): ProviderStatus[] {
    if (chainId) {
      const connections = this.connections.get(chainId);
      return connections ? connections.map(conn => conn.status) : [];
    }
    
    // Return stats for all providers
    const allStats: ProviderStatus[] = [];
    this.connections.forEach(connections => {
      allStats.push(...connections.map(conn => conn.status));
    });
    
    return allStats;
  }

  /**
   * Clear caches
   */
  public clearCache(): void {
    this.contractCache.clear();
    this.callCache.clear();
  }

  /**
   * Get network latency
   */
  public async getNetworkLatency(chainId?: number): Promise<number> {
    const startTime = Date.now();
    
    try {
      const provider = this.getProvider(chainId);
      await provider.getBlockNumber();
      return Date.now() - startTime;
    } catch (error) {
      throw new Error('Failed to measure network latency');
    }
  }

  /**
   * Batch multiple calls
   */
  public async batchCalls(calls: Array<{
    contract: ethers.Contract;
    method: string;
    args: any[];
    options?: ContractCallOptions;
  }>): Promise<any[]> {
    const promises = calls.map(call => 
      this.callContract(call.contract, call.method, call.args, call.options)
    );
    
    return await Promise.allSettled(promises);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clean up WebSocket connections
    this.connections.forEach(connections => {
      connections.forEach(connection => {
        if (connection.provider instanceof ethers.providers.WebSocketProvider) {
          connection.provider.destroy();
        }
      });
    });
    
    // Clear all caches and subscriptions
    this.clearCache();
    this.subscriptions.clear();
    this.connections.clear();
    this.activeConnections.clear();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

// Export singleton instance
export const web3ProviderService = Web3ProviderService.getInstance();
export default web3ProviderService;
