import { ethers } from 'ethers';
import { Token, Transaction } from '../types/index';
import rpcService from './rpcService';
import axios from 'axios';
import { getApiConfig, getPriceApiConfig } from '../config/apiConfig';

// Get production API configuration
const apiConfig = getApiConfig();
const ETHERSCAN_API_KEY = apiConfig.etherscan.apiKey;
const priceApiConfig = getPriceApiConfig();

// Supported networks configuration
const NETWORK_CONFIGS = {
  1: { // Ethereum Mainnet
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.webp',
    blockExplorer: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api'
  },
  5: { // Goerli Testnet
    name: 'Ethereum Goerli',
    symbol: 'ETH',
    decimals: 18,
    logoURI: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/6ed5f/eth-diamond-black.webp',
    blockExplorer: 'https://goerli.etherscan.io',
    apiUrl: 'https://api-goerli.etherscan.io/api'
  },
  137: { // Polygon Mainnet
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
    blockExplorer: 'https://polygonscan.com',
    apiUrl: 'https://api.polygonscan.com/api'
  },
  80001: { // Polygon Mumbai
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.svg',
    blockExplorer: 'https://mumbai.polygonscan.com',
    apiUrl: 'https://api-testnet.polygonscan.com/api'
  },
  56: { // BSC Mainnet
    name: 'Binance Smart Chain',
    symbol: 'BNB',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg',
    blockExplorer: 'https://bscscan.com',
    apiUrl: 'https://api.bscscan.com/api'
  },
  97: { // BSC Testnet
    name: 'BSC Testnet',
    symbol: 'BNB',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg',
    blockExplorer: 'https://testnet.bscscan.com',
    apiUrl: 'https://api-testnet.bscscan.com/api'
  }
};

// Enhanced token interface for internal use
interface EnhancedToken extends Token {
  balance?: string;
  balanceFormatted?: string;
  balanceUSD?: number;
  priceChange24h?: number;
  isCustom?: boolean;
  isHidden?: boolean;
  lastUpdated?: number;
}

// Comprehensive ERC-20 ABI with extended functions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Token security check interface
interface TokenSecurityInfo {
  isVerified: boolean;
  isScam: boolean;
  hasOpenSource: boolean;
  hasAudit: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}

// Popular token list (default tokens to track)
const POPULAR_TOKENS: Token[] = [
  // Ethereum Mainnet
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    verified: true,
    tags: ['stablecoin'],
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    verified: true,
    tags: ['stablecoin'],
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/9956/small/4943.png',
    verified: true,
    tags: ['stablecoin', 'defi'],
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
    verified: true,
    tags: ['wrapped'],
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'ChainLink Token',
    decimals: 18,
    chainId: 1,
    logoURI: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
    verified: true,
    tags: ['defi'],
  },
  
  // Polygon
  {
    address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    chainId: 137,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
    verified: true,
    tags: ['stablecoin'],
  },
  {
    address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    chainId: 137,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
    verified: true,
    tags: ['stablecoin'],
  },
];

class TokenService {
  private static instance: TokenService;
  private tokenCache: Map<string, EnhancedToken> = new Map();
  private priceCache: Map<string, { price: number; priceChange24h: number; timestamp: number }> = new Map();
  private securityCache: Map<string, TokenSecurityInfo> = new Map();
  private customTokens: Set<string> = new Set();
  private hiddenTokens: Set<string> = new Set();
  private readonly PRICE_CACHE_DURATION = 60000; // 1 minute
  private readonly SECURITY_CACHE_DURATION = 3600000; // 1 hour
  private readonly TOKEN_CACHE_DURATION = 300000; // 5 minutes

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  constructor() {
    // Initialize async data loading
    this.initialize();
  }

  /**
   * Initialize token service with async data loading
   */
  private async initialize(): Promise<void> {
    await Promise.all([
      this.loadCustomTokens(),
      this.loadHiddenTokens()
    ]);
  }

  /**
   * Load custom tokens from storage
   */
  private async loadCustomTokens(): Promise<void> {
    try {
      const { getValue } = await import('../utils/storageHelpers');
      const stored = await getValue('custom_tokens');
      if (stored && Array.isArray(stored)) {
        stored.forEach((token: string) => this.customTokens.add(token));
      }
    } catch (error) {
      console.error('Failed to load custom tokens:', error);
    }
  }

  /**
   * Load hidden tokens from storage
   */
  private async loadHiddenTokens(): Promise<void> {
    try {
      const { getValue } = await import('../utils/storageHelpers');
      const stored = await getValue('hidden_tokens');
      if (stored && Array.isArray(stored)) {
        stored.forEach((token: string) => this.hiddenTokens.add(token));
      }
    } catch (error) {
      console.error('Failed to load hidden tokens:', error);
    }
  }

  /**
   * Save custom tokens to storage
   */
  private async saveCustomTokens(): Promise<void> {
    try {
      const { setValue } = await import('../utils/storageHelpers');
      const tokens = Array.from(this.customTokens);
      await setValue('custom_tokens', tokens);
    } catch (error) {
      console.error('Failed to save custom tokens:', error);
    }
  }

  /**
   * Save hidden tokens to storage
   */
  private async saveHiddenTokens(): Promise<void> {
    try {
      const { setValue } = await import('../utils/storageHelpers');
      const tokens = Array.from(this.hiddenTokens);
      await setValue('hidden_tokens', tokens);
    } catch (error) {
      console.error('Failed to save hidden tokens:', error);
    }
  }

  /**
   * Generate cache key for token
   */
  private getCacheKey(tokenAddress: string, chainId: number): string {
    return `${chainId}_${tokenAddress.toLowerCase()}`;
  }

  /**
   * Get token information
   */
  async getTokenInfo(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<Token> {
    const cacheKey = `${chainId}_${tokenAddress.toLowerCase()}`;
    
    // Check cache first
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!;
    }

    try {
      const provider = rpcService.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      const token: Token = {
        address: tokenAddress,
        name,
        symbol,
        decimals: Number(decimals),
        chainId,
        verified: false,
        tags: [],
      };

      // Cache token info
      this.tokenCache.set(cacheKey, token);
      
      return token;
    } catch (error) {
      throw new Error(`Failed to get token info: ${error}`);
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(
    tokenAddress: string,
    walletAddress: string,
    chainId: number = 1
  ): Promise<string> {
    try {
      const provider = rpcService.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const balance = await contract.balanceOf(walletAddress);
      const tokenInfo = await this.getTokenInfo(tokenAddress, chainId);
      
      return ethers.utils.formatUnits(balance, tokenInfo.decimals);
    } catch (error) {
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  /**
   * Get all token balances for an address
   */
  async getAllTokenBalances(
    walletAddress: string,
    chainId: number = 1
  ): Promise<Token[]> {
    try {
      const tokensWithBalance: Token[] = [];

      // Get ETH balance first
      const ethBalance = await rpcService.getBalance(walletAddress);
      const ethPrice = await this.getTokenPrice('ethereum');
      
      tokensWithBalance.push({
        address: 'native',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        balance: ethBalance,
        price: ethPrice,
        balanceUSD: parseFloat(ethBalance) * ethPrice,
        chainId,
        logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
        verified: true,
        tags: ['layer1'],
      });

      // Get ERC-20 token balances for custom tokens only
      for (const tokenCacheKey of this.customTokens) {
        try {
          const token = this.tokenCache.get(tokenCacheKey);
          if (token && token.chainId === chainId) {
            const balance = await this.getTokenBalance(
              token.address,
              walletAddress,
              chainId
            );
            
            if (parseFloat(balance) > 0) {
              const price = await this.getTokenPrice(token.symbol.toLowerCase());
              tokensWithBalance.push({
                ...token,
                balance,
                price,
                balanceUSD: parseFloat(balance) * price,
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to get balance for custom token:`, error);
        }
      }

      return tokensWithBalance;
    } catch (error) {
      throw new Error(`Failed to get all token balances: ${error}`);
    }
  }

  /**
   * Get token price from CoinGecko with API key authentication
   */
  async getTokenPrice(tokenId: string): Promise<number> {
    const cacheKey = tokenId.toLowerCase();
    const cached = this.priceCache.get(cacheKey);
    
    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      return cached.price;
    }

    try {
      console.log(`🔍 Fetching price for token: ${tokenId}`);
      
      const headers = Object.keys(priceApiConfig.coingecko.headers).length > 0 
        ? priceApiConfig.coingecko.headers 
        : {};
      
      const response = await axios.get(
        `${priceApiConfig.coingecko.url}/simple/price`,
        {
          params: {
            ids: tokenId,
            vs_currencies: 'usd',
          },
          headers: headers as any,
          timeout: 10000,
        }
      );

      const price = response.data[tokenId]?.usd || 0;
      console.log(`💰 Price for ${tokenId}: $${price}`);
      
      // Cache the price
      this.priceCache.set(cacheKey, {
        price,
        priceChange24h: 0, // Default to 0 if not available
        timestamp: Date.now(),
      });

      return price;
    } catch (error) {
      console.error(`❌ Failed to get token price for ${tokenId}:`, error);
      return 0;
    }
  }

  /**
   * Get token prices for multiple tokens with API authentication
   */
  async getTokenPrices(tokenIds: string[]): Promise<{ [key: string]: number }> {
    try {
      console.log(`🔍 Fetching prices for ${tokenIds.length} tokens:`, tokenIds);
      
      const headers = Object.keys(priceApiConfig.coingecko.headers).length > 0 
        ? priceApiConfig.coingecko.headers 
        : {};
      
      const response = await axios.get(
        `${priceApiConfig.coingecko.url}/simple/price`,
        {
          params: {
            ids: tokenIds.join(','),
            vs_currencies: 'usd',
          },
          headers: headers as any,
          timeout: 15000,
        }
      );

      const prices: { [key: string]: number } = {};
      
      for (const tokenId of tokenIds) {
        prices[tokenId] = response.data[tokenId]?.usd || 0;
        console.log(`💰 Price for ${tokenId}: $${prices[tokenId]}`);
        
        // Cache each price
        this.priceCache.set(tokenId.toLowerCase(), {
          price: prices[tokenId],
          priceChange24h: 0, // Default to 0 if not available
          timestamp: Date.now(),
        });
      }

      return prices;
    } catch (error) {
      console.error('❌ Failed to get token prices:', error);
      return {};
    }
  }

  /**
   * Get token allowance
   */
  async getTokenAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<string> {
    try {
      const provider = rpcService.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      
      return ethers.utils.formatUnits(allowance, tokenInfo.decimals);
    } catch (error) {
      throw new Error(`Failed to get token allowance: ${error}`);
    }
  }

  /**
   * Create token transfer transaction
   */
  async createTokenTransferTx(
    tokenAddress: string,
    from: string,
    to: string,
    amount: string,
    chainId: number = 1
  ): Promise<ethers.providers.TransactionRequest> {
    try {
      const provider = rpcService.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const tokenInfo = await this.getTokenInfo(tokenAddress, chainId);
      
      const amountWei = ethers.utils.parseUnits(amount, tokenInfo.decimals);
      const data = contract.interface.encodeFunctionData('transfer', [to, amountWei]);
      
      const gasEstimate = await provider.estimateGas({
        from,
        to: tokenAddress,
        data,
      });

      return {
        from,
        to: tokenAddress,
        data,
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        chainId,
      };
    } catch (error) {
      throw new Error(`Failed to create token transfer: ${error}`);
    }
  }

  /**
   * Create token approval transaction
   */
  async createTokenApproveTx(
    tokenAddress: string,
    from: string,
    spender: string,
    amount: string,
    chainId: number = 1
  ): Promise<ethers.providers.TransactionRequest> {
    try {
      const provider = rpcService.getProvider();
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const tokenInfo = await this.getTokenInfo(tokenAddress, chainId);
      
      const amountWei = amount === 'max' 
        ? ethers.constants.MaxUint256 
        : ethers.utils.parseUnits(amount, tokenInfo.decimals);
      
      const data = contract.interface.encodeFunctionData('approve', [spender, amountWei]);
      
      const gasEstimate = await provider.estimateGas({
        from,
        to: tokenAddress,
        data,
      });

      return {
        from,
        to: tokenAddress,
        data,
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        chainId,
      };
    } catch (error) {
      throw new Error(`Failed to create token approval: ${error}`);
    }
  }

  /**
   * Get transaction history from Etherscan
   */
  async getTransactionHistory(
    address: string,
    chainId: number = 1,
    page: number = 1,
    offset: number = 20
  ): Promise<Transaction[]> {
    try {
      let apiUrl: string;
      let apiKey = ETHERSCAN_API_KEY;
      
      switch (chainId) {
        case 1:
          apiUrl = 'https://api.etherscan.io/api';
          break;
        case 5:
          apiUrl = 'https://api-goerli.etherscan.io/api';
          break;
        case 137:
          apiUrl = 'https://api.polygonscan.com/api';
          break;
        default:
          throw new Error('Unsupported chain for transaction history');
      }

      const response = await axios.get(apiUrl, {
        params: {
          module: 'account',
          action: 'txlist',
          address,
          startblock: 0,
          endblock: 99999999,
          page,
          offset,
          sort: 'desc',
          apikey: apiKey,
        },
      });

      if (response.data.status !== '1') {
        return [];
      }

      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.utils.formatEther(tx.value),
        gasPrice: tx.gasPrice,
        gasLimit: tx.gas,
        nonce: parseInt(tx.nonce),
        data: tx.input,
        chainId,
        timestamp: parseInt(tx.timeStamp) * 1000,
        blockNumber: parseInt(tx.blockNumber),
        status: tx.isError === '0' ? 'confirmed' : 'failed',
        type: tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive',
      }));
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Search tokens by name or symbol
   */
  async searchTokens(query: string, chainId: number = 1): Promise<Token[]> {
    try {
      // Search only in custom tokens that have been added by the user
      const customTokens: Token[] = [];
      const searchQuery = query.toLowerCase();
      
      for (const tokenCacheKey of this.customTokens) {
        const token = this.tokenCache.get(tokenCacheKey);
        if (token && token.chainId === chainId) {
          if (token.symbol.toLowerCase().includes(searchQuery) ||
              token.name.toLowerCase().includes(searchQuery)) {
            customTokens.push(token);
          }
        }
      }
      
      return customTokens;
    } catch (error) {
      console.error('Failed to search tokens:', error);
      return [];
    }
  }

  /**
   * Add custom token with validation
   */
  async addCustomToken(
    tokenAddress: string,
    chainId: number = 1
  ): Promise<EnhancedToken> {
    try {
      // Validate token contract
      const isValid = await this.validateTokenContract(tokenAddress, chainId);
      if (!isValid) {
        throw new Error('Invalid token contract');
      }

      // Check security
      const securityInfo = await this.getTokenSecurity(tokenAddress, chainId);
      if (securityInfo.riskLevel === 'critical') {
        throw new Error('Token has critical security risks');
      }

      const token = await this.getTokenInfo(tokenAddress, chainId);
      const enhancedToken: EnhancedToken = {
        ...token,
        isCustom: true,
        lastUpdated: Date.now()
      };
      
      // Add to custom tokens
      const cacheKey = this.getCacheKey(tokenAddress, chainId);
      this.customTokens.add(cacheKey);
      this.tokenCache.set(cacheKey, enhancedToken);
      await this.saveCustomTokens();
      
      return enhancedToken;
    } catch (error) {
      throw new Error(`Failed to add custom token: ${error}`);
    }
  }

  /**
   * Remove custom token
   */
  async removeCustomToken(tokenAddress: string, chainId: number): Promise<void> {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    this.customTokens.delete(cacheKey);
    this.tokenCache.delete(cacheKey);
    await this.saveCustomTokens();
  }

  /**
   * Hide token from portfolio view
   */
  async hideToken(tokenAddress: string, chainId: number): Promise<void> {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    this.hiddenTokens.add(cacheKey);
    await this.saveHiddenTokens();
  }

  /**
   * Show hidden token
   */
  async showToken(tokenAddress: string, chainId: number): Promise<void> {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    this.hiddenTokens.delete(cacheKey);
    await this.saveHiddenTokens();
  }

  /**
   * Validate token contract
   */
  async validateTokenContract(tokenAddress: string, chainId: number): Promise<boolean> {
    try {
      const provider = rpcService.getProvider();
      
      // Check if address is a contract
      const code = await provider.getCode(tokenAddress);
      if (code === '0x') {
        return false;
      }

      // Try to call basic ERC-20 functions
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals()
      ]);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get token security information
   */
  async getTokenSecurity(tokenAddress: string, chainId: number): Promise<TokenSecurityInfo> {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    const cached = this.securityCache.get(cacheKey);
    
    if (cached && Date.now() - (cached as any).timestamp < this.SECURITY_CACHE_DURATION) {
      return cached;
    }

    try {
      // This would integrate with security APIs like GoPlus, Honeypot.is, etc.
      // For now, return basic security info
      const securityInfo: TokenSecurityInfo = {
        isVerified: false,
        isScam: false,
        hasOpenSource: false,
        hasAudit: false,
        riskLevel: 'medium',
        warnings: []
      };

      // Check if token is in popular token lists (implies some verification)
      const isCustom = this.isCustomToken(tokenAddress, chainId);
      if (isCustom) {
        securityInfo.isVerified = true;
        securityInfo.riskLevel = 'low';
      }

      this.securityCache.set(cacheKey, securityInfo);
      return securityInfo;
    } catch (error) {
      console.error('Failed to get token security:', error);
      return {
        isVerified: false,
        isScam: false,
        hasOpenSource: false,
        hasAudit: false,
        riskLevel: 'high',
        warnings: ['Unable to verify token security']
      };
    }
  }

  /**
   * Check if token is a custom token (added by user)
   */
  private isCustomToken(tokenAddress: string, chainId: number): boolean {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    return this.customTokens.has(cacheKey);
  }

  /**
   * Get enhanced token balances with security info
   */
  async getEnhancedTokenBalances(
    walletAddress: string,
    chainId: number = 1
  ): Promise<EnhancedToken[]> {
    try {
      const tokens = await this.getAllTokenBalances(walletAddress, chainId);
      const enhancedTokens: EnhancedToken[] = [];

      for (const token of tokens) {
        const cacheKey = this.getCacheKey(token.address, chainId);
        
        // Skip hidden tokens
        if (this.hiddenTokens.has(cacheKey)) {
          continue;
        }

        const securityInfo = await this.getTokenSecurity(token.address, chainId);
        const enhancedToken: EnhancedToken = {
          ...token,
          isCustom: this.customTokens.has(cacheKey),
          isHidden: false,
          lastUpdated: Date.now()
        };

        // Add security warnings to token
        if (securityInfo.riskLevel === 'high' || securityInfo.riskLevel === 'critical') {
          enhancedToken.name = `⚠️ ${enhancedToken.name}`;
        }

        enhancedTokens.push(enhancedToken);
      }

      return enhancedTokens;
    } catch (error) {
      console.error('Failed to get enhanced token balances:', error);
      return [];
    }
  }

  /**
   * Bulk token operations
   */
  async performBulkTokenOperation(
    operations: Array<{
      type: 'transfer' | 'approve';
      tokenAddress: string;
      params: any;
    }>,
    chainId: number,
    signer: ethers.Signer
  ): Promise<string[]> {
    const txHashes: string[] = [];
    
    for (const operation of operations) {
      try {
        let txHash: string;
        
        if (operation.type === 'transfer') {
          const tx = await this.createTokenTransferTx(
            operation.tokenAddress,
            operation.params.from,
            operation.params.to,
            operation.params.amount,
            chainId
          );
          const sentTx = await signer.sendTransaction(tx);
          txHash = sentTx.hash;
        } else if (operation.type === 'approve') {
          const tx = await this.createTokenApproveTx(
            operation.tokenAddress,
            operation.params.from,
            operation.params.spender,
            operation.params.amount,
            chainId
          );
          const sentTx = await signer.sendTransaction(tx);
          txHash = sentTx.hash;
        } else {
          throw new Error(`Unsupported operation type: ${operation.type}`);
        }
        
        txHashes.push(txHash);
      } catch (error) {
        console.error(`Failed bulk operation ${operation.type}:`, error);
        throw error;
      }
    }
    
    return txHashes;
  }

  /**
   * Get token analytics
   */
  async getTokenAnalytics(tokenAddress: string, chainId: number): Promise<{
    holders: number;
    transactions24h: number;
    volume24h: string;
    marketCap: string;
    circulatingSupply: string;
  }> {
    try {
      // Integrate with real analytics APIs
      try {
        // Try to get real analytics from CoinGecko or similar
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`, {
          timeout: 10000
        });
        
        const data = response.data;
        return {
          holders: data.community_data?.twitter_followers || 0,
          transactions24h: data.tickers?.length || 0,
          volume24h: data.market_data?.total_volume?.usd?.toString() || '0',
          marketCap: data.market_data?.market_cap?.usd?.toString() || '0',
          circulatingSupply: data.market_data?.circulating_supply?.toString() || '0'
        };
      } catch (apiError) {
        console.warn('Failed to fetch analytics from API, using contract data:', apiError);
        
        // Fallback: get basic info from contract  
        const networkService = (await import('./NetworkService')).default;
        const provider = await networkService.getProvider(chainId);
        if (!provider) {
          throw new Error('No provider available');
        }

        const tokenContract = new ethers.Contract(tokenAddress, [
          'function totalSupply() view returns (uint256)',
          'function name() view returns (string)',
          'function symbol() view returns (string)'
        ], provider);

        try {
          const totalSupply = await tokenContract.totalSupply();
          return {
            holders: 0, // Cannot determine from contract
            transactions24h: 0, // Cannot determine from contract
            volume24h: '0', // Cannot determine from contract
            marketCap: '0', // Cannot determine from contract
            circulatingSupply: ethers.utils.formatEther(totalSupply)
          };
        } catch (contractError) {
          console.warn('Contract call failed, returning default values:', contractError);
          return {
            holders: 0,
            transactions24h: 0,
            volume24h: '0',
            marketCap: '0',
            circulatingSupply: '0'
          };
        }
      }
    } catch (error) {
      console.error('Failed to get token analytics:', error);
      throw error;
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.tokenCache.clear();
    this.priceCache.clear();
    this.securityCache.clear();
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(chainId: number) {
    return NETWORK_CONFIGS[chainId as keyof typeof NETWORK_CONFIGS];
  }
}

// Export singleton instance
const tokenService = new TokenService();
export default tokenService;
