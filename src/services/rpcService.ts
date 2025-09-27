import { ethers } from 'ethers';
import { Network, GasEstimate, Transaction } from '../types/index';
// Temporarily using placeholder values for API keys
const INFURA_KEY = 'your_infura_project_id_here';
const ALCHEMY_KEY = 'your_alchemy_api_key_here';
const DEFAULT_NETWORK = 'ethereum';
import axios from 'axios';

// Network configurations
export const NETWORKS: { [key: string]: Network } = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    symbol: 'ETH',
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
  },
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    rpcUrl: `https://goerli.infura.io/v3/${INFURA_KEY}`,
    symbol: 'ETH',
    blockExplorerUrl: 'https://goerli.etherscan.io',
    isTestnet: true,
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
    symbol: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    symbol: 'MATIC',
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    symbol: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
    symbol: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
};

class RPCService {
  private providers: Map<number, ethers.providers.JsonRpcProvider> = new Map();
  private currentNetwork: Network;

  constructor() {
    // Initialize with default network
    this.currentNetwork = NETWORKS[DEFAULT_NETWORK || 'mainnet'];
  }

  /**
   * Get provider for a specific network
   */
  getProvider(networkKey?: string): ethers.providers.JsonRpcProvider {
    const network = networkKey ? NETWORKS[networkKey] : this.currentNetwork;
    
    if (!network) {
      throw new Error(`Network ${networkKey} not found`);
    }

    // Check if provider already exists
    if (this.providers.has(network.chainId)) {
      return this.providers.get(network.chainId)!;
    }

    // Create new provider with fallback URLs
    const provider = this.createProviderWithFallback(network);
    this.providers.set(network.chainId, provider);
    
    return provider;
  }

  /**
   * Create provider with fallback URLs
   */
  private createProviderWithFallback(network: Network): ethers.providers.JsonRpcProvider {
    try {
      // Try primary RPC URL
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
      
      // Set up error handling and reconnection
      provider.on('error', (error) => {
        console.error(`Provider error for ${network.name}:`, error);
        // Attempt to reconnect with fallback
        this.reconnectWithFallback(network);
      });

      return provider;
    } catch (error) {
      // Try fallback URLs
      return this.getFallbackProvider(network);
    }
  }

  /**
   * Get fallback provider
   */
  private getFallbackProvider(network: Network): ethers.providers.JsonRpcProvider {
    const fallbackUrls = this.getFallbackUrls(network.chainId);
    
    for (const url of fallbackUrls) {
      try {
        return new ethers.providers.JsonRpcProvider(url);
      } catch {
        continue;
      }
    }
    
    throw new Error(`Failed to connect to ${network.name}`);
  }

  /**
   * Get fallback RPC URLs for a chain
   */
  private getFallbackUrls(chainId: number): string[] {
    const urls: string[] = [];
    
    switch (chainId) {
      case 1: // Mainnet
        urls.push(
          `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
          'https://cloudflare-eth.com',
          'https://rpc.ankr.com/eth'
        );
        break;
      case 5: // Goerli
        urls.push(
          `https://eth-goerli.g.alchemy.com/v2/${ALCHEMY_KEY}`,
          'https://rpc.ankr.com/eth_goerli'
        );
        break;
      case 137: // Polygon
        urls.push(
          'https://polygon-rpc.com',
          'https://rpc.ankr.com/polygon'
        );
        break;
      default:
        break;
    }
    
    return urls.filter(url => url && !url.includes('undefined'));
  }

  /**
   * Reconnect with fallback provider
   */
  private async reconnectWithFallback(network: Network): Promise<void> {
    try {
      const newProvider = this.getFallbackProvider(network);
      this.providers.set(network.chainId, newProvider);
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(networkKey: string): Promise<void> {
    const network = NETWORKS[networkKey];
    
    if (!network) {
      throw new Error(`Network ${networkKey} not found`);
    }
    
    this.currentNetwork = network;
    
    // Ensure provider is initialized for new network
    this.getProvider(networkKey);
  }

  /**
   * Get current network
   */
  getCurrentNetwork(): Network {
    return this.currentNetwork;
  }

  /**
   * Get all available networks
   */
  getAvailableNetworks(): Network[] {
    return Object.values(NETWORKS);
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(address: string, networkKey?: string): Promise<string> {
    try {
      const provider = this.getProvider(networkKey);
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  /**
   * Get transaction count (nonce) for an address
   */
  async getTransactionCount(address: string, networkKey?: string): Promise<number> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.getTransactionCount(address, 'pending');
    } catch (error) {
      throw new Error(`Failed to get transaction count: ${error}`);
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    txParams: ethers.providers.TransactionRequest,
    networkKey?: string
  ): Promise<bigint> {
    try {
      const provider = this.getProvider(networkKey);
      const gasEstimate = await provider.estimateGas(txParams);
      return BigInt(gasEstimate.toString());
    } catch (error) {
      throw new Error(`Failed to estimate gas: ${error}`);
    }
  }

  /**
   * Get current gas prices (EIP-1559)
   */
  async getGasPrices(networkKey?: string): Promise<GasEstimate> {
    try {
      const provider = this.getProvider(networkKey);
      const feeData = await provider.getFeeData();
      
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        throw new Error('Unable to fetch gas prices');
      }

      const baseFee = feeData.maxFeePerGas;
      const priorityFee = feeData.maxPriorityFeePerGas;

      return {
        slow: {
          maxFeePerGas: ethers.utils.formatUnits(baseFee.mul(90).div(100), 'gwei'),
          maxPriorityFeePerGas: ethers.utils.formatUnits(priorityFee.mul(80).div(100), 'gwei'),
          estimatedTime: 60, // seconds
        },
        standard: {
          maxFeePerGas: ethers.utils.formatUnits(baseFee, 'gwei'),
          maxPriorityFeePerGas: ethers.utils.formatUnits(priorityFee, 'gwei'),
          estimatedTime: 30,
        },
        fast: {
          maxFeePerGas: ethers.utils.formatUnits(baseFee.mul(120).div(100), 'gwei'),
          maxPriorityFeePerGas: ethers.utils.formatUnits(priorityFee.mul(150).div(100), 'gwei'),
          estimatedTime: 15,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get gas prices: ${error}`);
    }
  }

  /**
   * Send raw transaction
   */
  async sendTransaction(
    signedTx: string,
    networkKey?: string
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.sendTransaction(signedTx);
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`);
    }
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(
    txHash: string,
    networkKey?: string
  ): Promise<ethers.providers.TransactionResponse | null> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.getTransaction(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error}`);
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(
    txHash: string,
    networkKey?: string
  ): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error}`);
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    networkKey?: string
  ): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      throw new Error(`Failed to wait for transaction: ${error}`);
    }
  }

  /**
   * Get block number
   */
  async getBlockNumber(networkKey?: string): Promise<number> {
    try {
      const provider = this.getProvider(networkKey);
      return await provider.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to get block number: ${error}`);
    }
  }

  /**
   * Subscribe to new blocks
   */
  onBlock(
    callback: (blockNumber: number) => void,
    networkKey?: string
  ): void {
    const provider = this.getProvider(networkKey);
    provider.on('block', callback);
  }

  /**
   * Subscribe to pending transactions
   */
  onPendingTransaction(
    callback: (txHash: string) => void,
    networkKey?: string
  ): void {
    const provider = this.getProvider(networkKey);
    provider.on('pending', callback);
  }

  /**
   * Unsubscribe from all events
   */
  removeAllListeners(networkKey?: string): void {
    const provider = this.getProvider(networkKey);
    provider.removeAllListeners();
  }

  /**
   * Check if address is valid
   */
  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  /**
   * Format address with checksum
   */
  formatAddress(address: string): string {
    return ethers.utils.getAddress(address);
  }

  /**
   * Get ENS name for address
   */
  async getENSName(address: string): Promise<string | null> {
    try {
      const provider = this.getProvider('mainnet');
      return await provider.lookupAddress(address);
    } catch {
      return null;
    }
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENSName(name: string): Promise<string | null> {
    try {
      const provider = this.getProvider('mainnet');
      return await provider.resolveName(name);
    } catch {
      return null;
    }
  }
}

export default new RPCService();
