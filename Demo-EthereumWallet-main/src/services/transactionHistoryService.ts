import { getValue } from '../utils/storageHelpers';

interface EtherscanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  confirmations: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTransaction[];
}

interface Transaction {
  id: string;
  hash: string;
  type: 'sent' | 'received' | 'contract';
  amount: string;
  amountFormatted: string;
  from: string;
  to: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
  confirmations?: number;
  network: string;
}

class TransactionHistoryService {
  private static instance: TransactionHistoryService;
  private cache = new Map<string, { data: Transaction[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  
  static getInstance(): TransactionHistoryService {
    if (!TransactionHistoryService.instance) {
      TransactionHistoryService.instance = new TransactionHistoryService();
    }
    return TransactionHistoryService.instance;
  }

  /**
   * Get transaction history for a wallet address
   */
  async getTransactionHistory(
    address: string,
    network: string = 'mainnet',
    page: number = 1,
    pageSize: number = 25
  ): Promise<Transaction[]> {
    const cacheKey = `${address}-${network}-${page}-${pageSize}`;
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      let transactions: Transaction[] = [];

      // Try Etherscan API first
      const etherscanTxs = await this.fetchFromEtherscan(address, network, page, pageSize);
      if (etherscanTxs.length > 0) {
        transactions = etherscanTxs;
      } else {
        // Fallback to public RPC methods
        transactions = await this.fetchFromRPC(address, network, pageSize);
      }

      // Cache the result
      this.cache.set(cacheKey, { data: transactions, timestamp: Date.now() });
      
      return transactions;
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn('Using expired cached transaction data');
        return cached.data;
      }
      
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Fetch transactions from Etherscan API
   */
  private async fetchFromEtherscan(
    address: string,
    network: string,
    page: number,
    pageSize: number
  ): Promise<Transaction[]> {
    try {
      const apiKey = await getValue('ETHERSCAN_API_KEY') || '';
      const baseUrl = this.getEtherscanBaseUrl(network);
      
      if (!baseUrl) {
        return [];
      }

      const url = `${baseUrl}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${pageSize}&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: EtherscanResponse = await response.json();
      
      if (data.status === '0' && data.message !== 'No transactions found') {
        throw new Error(data.message);
      }

      return this.parseEtherscanTransactions(data.result || [], address, network);
    } catch (error) {
      console.error('Etherscan API failed:', error);
      return [];
    }
  }

  /**
   * Fetch transactions using RPC methods (fallback)
   */
  private async fetchFromRPC(
    address: string,
    network: string,
    pageSize: number
  ): Promise<Transaction[]> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use ethers.js or web3.js to query the blockchain
      console.log('RPC fallback not fully implemented yet');
      return [];
    } catch (error) {
      console.error('RPC fetch failed:', error);
      return [];
    }
  }

  /**
   * Parse Etherscan transaction data to our format
   */
  private parseEtherscanTransactions(
    etherscanTxs: EtherscanTransaction[],
    userAddress: string,
    network: string
  ): Transaction[] {
    return etherscanTxs.map((tx) => {
      const isReceived = tx.to.toLowerCase() === userAddress.toLowerCase();
      const isSent = tx.from.toLowerCase() === userAddress.toLowerCase();
      
      let type: 'sent' | 'received' | 'contract' = 'contract';
      if (isReceived && !isSent) {
        type = 'received';
      } else if (isSent && !isReceived) {
        type = 'sent';
      } else if (isSent && isReceived) {
        type = 'sent'; // Self-transaction
      }

      const amountInEth = this.weiToEth(tx.value);
      const status = tx.isError === '0' && tx.txreceipt_status === '1' ? 'confirmed' : 'failed';

      return {
        id: tx.hash,
        hash: tx.hash,
        type,
        amount: amountInEth,
        amountFormatted: `${parseFloat(amountInEth).toFixed(4)} ETH`,
        from: tx.from,
        to: tx.to,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
        status: status as 'confirmed' | 'failed',
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(tx.blockNumber),
        confirmations: parseInt(tx.confirmations),
        network,
      };
    });
  }

  /**
   * Get Etherscan base URL for different networks
   */
  private getEtherscanBaseUrl(network: string): string | null {
    const urls: { [key: string]: string } = {
      'mainnet': 'https://api.etherscan.io',
      'ethereum': 'https://api.etherscan.io',
      'sepolia': 'https://api-sepolia.etherscan.io',
      'goerli': 'https://api-goerli.etherscan.io',
      'polygon': 'https://api.polygonscan.com',
      'matic': 'https://api.polygonscan.com',
      'bsc': 'https://api.bscscan.com',
      'binance': 'https://api.bscscan.com',
      'arbitrum': 'https://api.arbiscan.io',
      'optimism': 'https://api-optimistic.etherscan.io',
    };

    return urls[network.toLowerCase()] || null;
  }

  /**
   * Convert Wei to ETH
   */
  private weiToEth(wei: string): string {
    const weiNum = BigInt(wei);
    const ethNum = Number(weiNum) / 1e18;
    return ethNum.toString();
  }

  /**
   * Get pending transactions (would require WebSocket or frequent polling)
   */
  async getPendingTransactions(address: string, network: string): Promise<Transaction[]> {
    // This would typically connect to a WebSocket or mempool service
    // For now, return empty array
    return [];
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionDetails(hash: string, network: string): Promise<Transaction | null> {
    try {
      const apiKey = await getValue('ETHERSCAN_API_KEY') || '';
      const baseUrl = this.getEtherscanBaseUrl(network);
      
      if (!baseUrl) {
        return null;
      }

      const url = `${baseUrl}/api?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result) {
        // Parse single transaction
        const tx = data.result;
        const amountInEth = this.weiToEth(tx.value);
        
        return {
          id: tx.hash,
          hash: tx.hash,
          type: 'sent', // Would need more logic to determine
          amount: amountInEth,
          amountFormatted: `${parseFloat(amountInEth).toFixed(4)} ETH`,
          from: tx.from,
          to: tx.to,
          timestamp: new Date(), // Would need block timestamp
          status: 'confirmed',
          gasUsed: tx.gas,
          gasPrice: tx.gasPrice,
          network,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get transaction details:', error);
      return null;
    }
  }

  /**
   * Clear cached transaction data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format transaction for display
   */
  formatTransactionForDisplay(tx: Transaction): {
    title: string;
    subtitle: string;
    amount: string;
    amountColor: string;
    icon: string;
    time: string;
  } {
    const isReceived = tx.type === 'received';
    const isSent = tx.type === 'sent';
    
    let title = 'Contract Interaction';
    let icon = 'code';
    let amountColor = '#666';
    
    if (isReceived) {
      title = 'Received';
      icon = 'arrow-down';
      amountColor = '#00C853';
    } else if (isSent) {
      title = 'Sent';
      icon = 'arrow-up';
      amountColor = '#FF5722';
    }

    const subtitle = `${tx.from.slice(0, 6)}...${tx.from.slice(-4)} → ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`;
    const amount = `${isReceived ? '+' : '-'}${tx.amountFormatted}`;
    const time = this.formatRelativeTime(tx.timestamp);

    return {
      title,
      subtitle,
      amount,
      amountColor,
      icon,
      time,
    };
  }

  /**
   * Format relative time
   */
  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }
}

export default TransactionHistoryService;
