import { ethers } from 'ethers';
import tokenService from '../services/tokenService';
import { TransactionService } from '../services/TransactionService';
import { WalletAccount, Token, Transaction } from '../types';

/**
 * ECLIPTA Wallet Data Loader
 * Comprehensive data loading utility for wallet initialization
 */

export interface WalletDataLoadResult {
  tokens: Token[];
  transactions: Transaction[];
  balance: string;
  success: boolean;
  errors: string[];
}

class DataLoader {
  private static instance: DataLoader;

  static getInstance(): DataLoader {
    if (!DataLoader.instance) {
      DataLoader.instance = new DataLoader();
    }
    return DataLoader.instance;
  }

  /**
   * Load all wallet data comprehensively
   */
  async loadWalletData(
    account: WalletAccount,
    chainId: number = 1
  ): Promise<WalletDataLoadResult> {
    const result: WalletDataLoadResult = {
      tokens: [],
      transactions: [],
      balance: '0',
      success: false,
      errors: []
    };

    console.log('🔄 Starting comprehensive wallet data load for:', account.address);

    try {
      // Load balance, tokens, and transactions in parallel
      const [balanceResult, tokensResult, transactionsResult] = await Promise.allSettled([
        this.loadBalance(account.address, chainId),
        this.loadTokens(account.address, chainId),
        this.loadTransactions(account.address, chainId)
      ]);

      // Process balance result
      if (balanceResult.status === 'fulfilled') {
        result.balance = balanceResult.value;
        console.log('✅ Balance loaded:', result.balance);
      } else {
        result.errors.push(`Balance loading failed: ${balanceResult.reason}`);
        console.error('❌ Balance loading failed:', balanceResult.reason);
      }

      // Process tokens result
      if (tokensResult.status === 'fulfilled') {
        result.tokens = tokensResult.value;
        console.log('✅ Tokens loaded:', result.tokens.length);
      } else {
        result.errors.push(`Token loading failed: ${tokensResult.reason}`);
        console.error('❌ Token loading failed:', tokensResult.reason);
      }

      // Process transactions result
      if (transactionsResult.status === 'fulfilled') {
        result.transactions = transactionsResult.value;
        console.log('✅ Transactions loaded:', result.transactions.length);
      } else {
        result.errors.push(`Transaction loading failed: ${transactionsResult.reason}`);
        console.error('❌ Transaction loading failed:', transactionsResult.reason);
      }

      // If at least balance or tokens loaded successfully, consider it a success
      result.success = result.balance !== '0' || result.tokens.length > 0;

      console.log('🎉 Wallet data loading completed:', {
        success: result.success,
        tokensCount: result.tokens.length,
        transactionsCount: result.transactions.length,
        balance: result.balance,
        errors: result.errors.length
      });

      return result;
    } catch (error) {
      result.errors.push(`Unexpected error: ${error}`);
      console.error('❌ Unexpected wallet data loading error:', error);
      return result;
    }
  }

  /**
   * Load ETH balance
   */
  private async loadBalance(address: string, chainId: number): Promise<string> {
    try {
      console.log('🔍 Loading balance for:', address);
      
      // Try multiple approaches to get balance
      const provider = new ethers.providers.JsonRpcProvider(this.getRpcUrl(chainId));
      const balance = await provider.getBalance(address);
      const balanceEth = ethers.utils.formatEther(balance);
      
      console.log('✅ Balance retrieved:', balanceEth, 'ETH');
      return balanceEth;
    } catch (error) {
      console.error('❌ Balance loading error:', error);
      throw error;
    }
  }

  /**
   * Load all tokens including ETH
   */
  private async loadTokens(address: string, chainId: number): Promise<Token[]> {
    try {
      console.log('🔍 Loading tokens for:', address);
      
      // Use the existing token service
      const tokens = await tokenService.getAllTokenBalances(address, chainId);
      
      // Always create ETH token as fallback
      if (tokens.length === 0) {
        console.log('⚠️ No tokens from service, creating ETH token manually');
        const balance = await this.loadBalance(address, chainId);
        
        // Always create ETH token, even with 0 balance for better UX
        const ethToken: Token = {
          address: 'native',
          symbol: 'ETH',
          name: 'Ethereum',
          decimals: 18,
          balance: balance || '0',
          price: 0, // Will be fetched separately
          balanceUSD: 0,
          chainId,
          logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
          verified: true,
          tags: ['layer1']
        };
        
        tokens.push(ethToken);
        console.log('✅ Created fallback ETH token with balance:', balance);
      }

      // Ensure ETH token exists in the list
      const hasEthToken = tokens.some(token => token.symbol === 'ETH' || token.address === 'native');
      if (!hasEthToken) {
        console.log('⚠️ Adding missing ETH token to list');
        try {
          const balance = await this.loadBalance(address, chainId);
          const ethToken: Token = {
            address: 'native',
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            balance: balance || '0',
            price: 0,
            balanceUSD: 0,
            chainId,
            logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            verified: true,
            tags: ['layer1']
          };
          tokens.unshift(ethToken); // Add ETH as first token
        } catch (balanceError) {
          console.warn('Failed to load ETH balance:', balanceError);
        }
      }
      
      console.log('✅ Tokens loaded:', tokens.length, 'tokens');
      tokens.forEach(token => {
        console.log(`  - ${token.symbol}: ${token.balance}`);
      });
      
      return tokens;
    } catch (error) {
      console.error('❌ Token loading error:', error);
      throw error;
    }
  }

  /**
   * Load transaction history
   */
  private async loadTransactions(address: string, chainId: number): Promise<Transaction[]> {
    try {
      console.log('🔍 Loading transactions for:', address);
      
      // Use existing transaction service
      const transactionService = TransactionService.getInstance();
      const transactionRecords = await transactionService.getTransactionHistory(address, chainId);
      
      // Convert to compatible format
      const transactions: Transaction[] = transactionRecords.map(record => ({
        hash: record.hash,
        from: record.from,
        to: record.to,
        value: record.value,
        gasLimit: record.gasLimit,
        gasPrice: record.gasPrice,
        nonce: record.nonce,
        timestamp: record.timestamp,
        status: record.status === 'cancelled' || record.status === 'replaced' ? 'failed' : record.status,
        type: record.to.toLowerCase() === address.toLowerCase() ? 'receive' : 'send',
        chainId: record.chainId,
        data: record.data
      }));
      
      console.log('✅ Transactions loaded:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('❌ Transaction loading error:', error);
      throw error;
    }
  }

  /**
   * Get RPC URL for chain
   */
  private getRpcUrl(chainId: number): string {
    const rpcUrls: { [key: number]: string } = {
      1: 'https://eth-mainnet.g.alchemy.com/v2/demo', // Ethereum Mainnet
      5: 'https://eth-goerli.g.alchemy.com/v2/demo', // Goerli Testnet
      137: 'https://polygon-mainnet.g.alchemy.com/v2/demo', // Polygon
      80001: 'https://polygon-mumbai.g.alchemy.com/v2/demo', // Mumbai
    };
    
    return rpcUrls[chainId] || rpcUrls[1];
  }

  /**
   * Quick balance check for instant feedback
   */
  async quickBalanceCheck(address: string, chainId: number = 1): Promise<string> {
    try {
      console.log('⚡ Quick balance check for:', address);
      const balance = await this.loadBalance(address, chainId);
      console.log('⚡ Quick balance result:', balance, 'ETH');
      return balance;
    } catch (error) {
      console.error('❌ Quick balance check failed:', error);
      return '0';
    }
  }

  /**
   * Create default ETH token for display
   */
  createDefaultETHToken(balance: string, chainId: number = 1): Token {
    return {
      address: 'native',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      balance,
      price: 0,
      balanceUSD: 0,
      chainId,
      logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
      verified: true,
      tags: ['layer1']
    };
  }

  /**
   * Validate wallet address
   */
  validateAddress(address: string): boolean {
    try {
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  }
}

export default DataLoader;
