/**
 * Real Wallet Service for CYPHER Privacy Wallet
 * Integrates with Ethereum Sepolia testnet and ENS
 * Handles real balance fetching, transaction sending, and privacy operations
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkService } from './NetworkService';

export interface WalletAccount {
  address: string;
  privateKey: string;
  mnemonic?: string;
  derivationPath?: string;
  name: string;
  isImported: boolean;
  createdAt: Date;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  usdValue?: number;
  logoUri?: string;
}

export interface ENSProfile {
  name: string;
  address: string;
  avatar?: string;
  description?: string;
  email?: string;
  url?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  contentHash?: string;
  publicKey?: string;
  timestamp?: number;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  gasUsed?: string;
  blockNumber?: number;
  timestamp?: number;
  status: 'pending' | 'confirmed' | 'failed';
  nonce: number;
  data?: string;
}

class RealWalletService {
  private static instance: RealWalletService;
  private networkService: NetworkService;
  private currentAccount: WalletAccount | null = null;
  private balanceCache = new Map<string, TokenBalance[]>();
  private ensCache = new Map<string, ENSProfile>();
  
  // Sepolia testnet configuration
  private readonly SEPOLIA_CHAIN_ID = 11155111;
  
  // Common ERC-20 tokens on Sepolia for testing
  private readonly SEPOLIA_TOKENS = [
    {
      address: '0x779877A7B0D9E8603169DdbD7836e478b4624789', // LINK on Sepolia
      symbol: 'LINK',
      name: 'Chainlink Token',
      decimals: 18,
      logoUri: 'https://cryptologos.cc/logos/chainlink-link-logo.png'
    },
    {
      address: '0x7af17A48a6336F7dc1beF9D485139f7B6f4FB5C8', // USDC on Sepolia
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      logoUri: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
    }
  ];

  private constructor() {
    this.networkService = NetworkService.getInstance();
    this.initializeWallet();
  }

  public static getInstance(): RealWalletService {
    if (!RealWalletService.instance) {
      RealWalletService.instance = new RealWalletService();
    }
    return RealWalletService.instance;
  }

  /**
   * Initialize wallet service
   */
  private async initializeWallet(): Promise<void> {
    try {
      // Load existing wallet if available
      await this.loadStoredWallet();
      
      // Ensure network service is initialized
      await this.networkService.ensureInitialized();
      
      console.log('✅ Real Wallet Service initialized');
    } catch (error) {
      console.error('Failed to initialize wallet service:', error);
    }
  }

  /**
   * Create new wallet with mnemonic
   */
  public async createWallet(accountName: string = 'Main Account'): Promise<WalletAccount> {
    try {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();
      
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        derivationPath: wallet.mnemonic?.path,
        name: accountName,
        isImported: false,
        createdAt: new Date()
      };

      // Save to storage
      await this.saveWallet(account);
      this.currentAccount = account;

      console.log(`✅ Created new wallet: ${account.address}`);
      return account;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  /**
   * Import wallet from private key
   */
  public async importFromPrivateKey(privateKey: string, accountName: string = 'Imported Account'): Promise<WalletAccount> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        name: accountName,
        isImported: true,
        createdAt: new Date()
      };

      await this.saveWallet(account);
      this.currentAccount = account;

      console.log(`✅ Imported wallet: ${account.address}`);
      return account;
    } catch (error) {
      console.error('Failed to import wallet from private key:', error);
      throw new Error('Invalid private key');
    }
  }

  /**
   * Import wallet from mnemonic
   */
  public async importFromMnemonic(mnemonic: string, accountName: string = 'Restored Account'): Promise<WalletAccount> {
    try {
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      
      const account: WalletAccount = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase,
        derivationPath: wallet.mnemonic?.path,
        name: accountName,
        isImported: false,
        createdAt: new Date()
      };

      await this.saveWallet(account);
      this.currentAccount = account;

      console.log(`✅ Restored wallet from mnemonic: ${account.address}`);
      return account;
    } catch (error) {
      console.error('Failed to import wallet from mnemonic:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  /**
   * Get current wallet account
   */
  public getCurrentAccount(): WalletAccount | null {
    return this.currentAccount;
  }

  /**
   * Get wallet signer for transactions
   */
  public async getWalletSigner(chainId: number = this.SEPOLIA_CHAIN_ID): Promise<ethers.Wallet | null> {
    if (!this.currentAccount) {
      throw new Error('No wallet account available');
    }

    const provider = await this.networkService.getProvider(chainId);
    if (!provider) {
      throw new Error(`No provider available for chain ${chainId}`);
    }

    return new ethers.Wallet(this.currentAccount.privateKey, provider);
  }

  /**
   * Get real ETH balance for current account
   */
  public async getETHBalance(chainId: number = this.SEPOLIA_CHAIN_ID): Promise<string> {
    if (!this.currentAccount) {
      throw new Error('No wallet account available');
    }

    try {
      const provider = await this.networkService.getProvider(chainId);
      if (!provider) {
        throw new Error(`No provider available for chain ${chainId}`);
      }

      const balance = await provider.getBalance(this.currentAccount.address);
      const balanceInEth = ethers.utils.formatEther(balance);
      
      console.log(`💰 ETH Balance: ${balanceInEth} ETH`);
      return balanceInEth;
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      throw new Error('Failed to fetch ETH balance');
    }
  }

  /**
   * Get all token balances including ETH
   */
  public async getAllBalances(chainId: number = this.SEPOLIA_CHAIN_ID): Promise<TokenBalance[]> {
    if (!this.currentAccount) {
      throw new Error('No wallet account available');
    }

    const cacheKey = `${this.currentAccount.address}_${chainId}`;
    
    try {
      const provider = await this.networkService.getProvider(chainId);
      if (!provider) {
        throw new Error(`No provider available for chain ${chainId}`);
      }

      const balances: TokenBalance[] = [];

      // Get ETH balance
      const ethBalance = await provider.getBalance(this.currentAccount.address);
      const ethBalanceFormatted = ethers.utils.formatEther(ethBalance);
      
      balances.push({
        address: ethers.constants.AddressZero,
        symbol: chainId === this.SEPOLIA_CHAIN_ID ? 'SepoliaETH' : 'ETH',
        name: chainId === this.SEPOLIA_CHAIN_ID ? 'Sepolia Ether' : 'Ether',
        decimals: 18,
        balance: ethBalance.toString(),
        balanceFormatted: ethBalanceFormatted,
        logoUri: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      });

      // Get ERC-20 token balances (for Sepolia)
      if (chainId === this.SEPOLIA_CHAIN_ID) {
        for (const token of this.SEPOLIA_TOKENS) {
          try {
            const tokenContract = new ethers.Contract(
              token.address,
              [
                'function balanceOf(address) view returns (uint256)',
                'function decimals() view returns (uint8)',
                'function symbol() view returns (string)',
                'function name() view returns (string)'
              ],
              provider
            );

            const balance = await tokenContract.balanceOf(this.currentAccount.address);
            if (balance.gt(0)) {
              const balanceFormatted = ethers.utils.formatUnits(balance, token.decimals);
              
              balances.push({
                address: token.address,
                symbol: token.symbol,
                name: token.name,
                decimals: token.decimals,
                balance: balance.toString(),
                balanceFormatted: balanceFormatted,
                logoUri: token.logoUri
              });
            }
          } catch (error) {
            console.warn(`Failed to get balance for token ${token.symbol}:`, error);
          }
        }
      }

      // Cache the results
      this.balanceCache.set(cacheKey, balances);
      
      console.log(`💰 Found ${balances.length} token balances`);
      return balances;
    } catch (error) {
      console.error('Failed to get all balances:', error);
      
      // Return cached data if available
      const cached = this.balanceCache.get(cacheKey);
      if (cached) {
        console.log('📋 Returning cached balance data');
        return cached;
      }
      
      throw new Error('Failed to fetch token balances');
    }
  }

  /**
   * Send ETH transaction
   */
  public async sendETH(
    to: string,
    amount: string,
    chainId: number = this.SEPOLIA_CHAIN_ID
  ): Promise<TransactionData> {
    if (!this.currentAccount) {
      throw new Error('No wallet account available');
    }

    try {
      const signer = await this.getWalletSigner(chainId);
      if (!signer) {
        throw new Error('Failed to get wallet signer');
      }

      const value = ethers.utils.parseEther(amount);
      
      // Get gas estimates
      const gasEstimates = await this.networkService.getGasEstimates(chainId);
      const network = this.networkService.getNetwork(chainId);
      
      const txRequest: any = {
        to,
        value,
        gasLimit: 21000
      };

      // Set gas price based on network features
      if (network?.features.eip1559 && gasEstimates?.standard.maxFeePerGas) {
        txRequest.maxFeePerGas = gasEstimates.standard.maxFeePerGas;
        txRequest.maxPriorityFeePerGas = gasEstimates.standard.maxPriorityFeePerGas;
      } else if (gasEstimates?.standard.gasPrice) {
        txRequest.gasPrice = gasEstimates.standard.gasPrice;
      }

      const tx = await signer.sendTransaction(txRequest);
      
      const transactionData: TransactionData = {
        hash: tx.hash,
        from: this.currentAccount.address,
        to,
        value: value.toString(),
        gasPrice: tx.gasPrice?.toString() || '0',
        gasLimit: tx.gasLimit.toString(),
        blockNumber: tx.blockNumber,
        timestamp: Date.now(),
        status: 'pending',
        nonce: tx.nonce,
        data: tx.data
      };

      console.log(`📤 Sent ETH transaction: ${tx.hash}`);
      
      // Wait for confirmation
      tx.wait().then((receipt) => {
        transactionData.status = receipt.status === 1 ? 'confirmed' : 'failed';
        transactionData.blockNumber = receipt.blockNumber;
        transactionData.gasUsed = receipt.gasUsed.toString();
        console.log(`✅ Transaction confirmed: ${tx.hash}`);
      }).catch((error) => {
        console.error(`❌ Transaction failed: ${tx.hash}`, error);
        transactionData.status = 'failed';
      });

      return transactionData;
    } catch (error) {
      console.error('Failed to send ETH:', error);
      throw new Error('Failed to send transaction');
    }
  }

  /**
   * Resolve ENS name to address
   */
  public async resolveENS(ensName: string, chainId: number = 1): Promise<string | null> {
    try {
      // ENS is only on Ethereum mainnet
      const provider = await this.networkService.getProvider(1);
      if (!provider) {
        throw new Error('No provider available for Ethereum mainnet');
      }

      const address = await provider.resolveName(ensName);
      
      if (address) {
        console.log(`🔍 ENS resolved: ${ensName} → ${address}`);
      }
      
      return address;
    } catch (error) {
      console.error(`Failed to resolve ENS name ${ensName}:`, error);
      return null;
    }
  }

  /**
   * Reverse resolve address to ENS name
   */
  public async reverseENS(address: string, chainId: number = 1): Promise<string | null> {
    try {
      // ENS is only on Ethereum mainnet
      const provider = await this.networkService.getProvider(1);
      if (!provider) {
        throw new Error('No provider available for Ethereum mainnet');
      }

      const ensName = await provider.lookupAddress(address);
      
      if (ensName) {
        console.log(`🔍 Reverse ENS resolved: ${address} → ${ensName}`);
      }
      
      return ensName;
    } catch (error) {
      console.error(`Failed to reverse resolve address ${address}:`, error);
      return null;
    }
  }

  /**
   * Get full ENS profile
   */
  public async getENSProfile(ensNameOrAddress: string): Promise<ENSProfile | null> {
    try {
      const provider = await this.networkService.getProvider(1);
      if (!provider) {
        throw new Error('No provider available for Ethereum mainnet');
      }

      let ensName: string | null;
      let address: string;

      // Check if input is an address or ENS name
      if (ethers.utils.isAddress(ensNameOrAddress)) {
        address = ensNameOrAddress;
        ensName = await this.reverseENS(address);
      } else {
        ensName = ensNameOrAddress;
        const resolvedAddress = await this.resolveENS(ensName);
        if (!resolvedAddress) return null;
        address = resolvedAddress;
      }

      if (!ensName) return null;

      // Check cache first
      const cached = this.ensCache.get(ensName);
      if (cached && cached.timestamp && Date.now() - cached.timestamp < 300000) { // 5 minutes cache
        return cached;
      }

      const resolver = await provider.getResolver(ensName);
      if (!resolver) return null;

      // Get ENS text records
      const profile: ENSProfile = {
        name: ensName,
        address: address,
        timestamp: Date.now()
      };

      try {
        // Common ENS text records
        const textRecords = ['avatar', 'description', 'email', 'url', 'com.twitter', 'com.github', 'com.discord', 'org.telegram'];
        
        for (const record of textRecords) {
          try {
            const value = await resolver.getText(record);
            if (value) {
              const key = record.replace('com.', '').replace('org.', '');
              (profile as any)[key] = value;
            }
          } catch (error) {
            // Ignore individual text record failures
          }
        }

        // Get content hash
        try {
          const contentHash = await resolver.getContentHash();
          if (contentHash !== '0x') {
            profile.contentHash = contentHash;
          }
        } catch (error) {
          // Ignore content hash failures
        }

        // Get public key
        try {
          const pubkey = await resolver.getText('vnd.ethereum.pubkey');
          if (pubkey) {
            profile.publicKey = pubkey;
          }
        } catch (error) {
          // Ignore public key failures
        }

      } catch (error) {
        console.warn('Failed to get some ENS text records:', error);
      }

      // Cache the result
      this.ensCache.set(ensName, profile);

      console.log(`👤 Retrieved ENS profile for ${ensName}`);
      return profile;
    } catch (error) {
      console.error(`Failed to get ENS profile for ${ensNameOrAddress}:`, error);
      return null;
    }
  }

  /**
   * Get transaction history from blockchain
   */
  public async getTransactionHistory(chainId: number = this.SEPOLIA_CHAIN_ID, limit: number = 50): Promise<TransactionData[]> {
    if (!this.currentAccount) {
      throw new Error('No wallet account available');
    }

    try {
      const provider = await this.networkService.getProvider(chainId);
      if (!provider) {
        throw new Error(`No provider available for chain ${chainId}`);
      }

      // Note: This is a basic implementation. For production, you'd want to use
      // services like Etherscan API, Alchemy, or Moralis for better transaction history
      const currentBlock = await provider.getBlockNumber();
      const transactions: TransactionData[] = [];

      // Scan recent blocks for transactions (this is inefficient, but works for demo)
      const blocksToScan = Math.min(1000, currentBlock);
      
      for (let i = 0; i < blocksToScan && transactions.length < limit; i++) {
        try {
          const blockNumber = currentBlock - i;
          const block = await provider.getBlockWithTransactions(blockNumber);
          
          for (const tx of block.transactions) {
            if (tx.from === this.currentAccount.address || tx.to === this.currentAccount.address) {
              const receipt = await provider.getTransactionReceipt(tx.hash);
              
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to || '',
                value: tx.value.toString(),
                gasPrice: tx.gasPrice?.toString() || '0',
                gasLimit: tx.gasLimit.toString(),
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: tx.blockNumber,
                timestamp: block.timestamp * 1000,
                status: receipt.status === 1 ? 'confirmed' : 'failed',
                nonce: tx.nonce,
                data: tx.data
              });
              
              if (transactions.length >= limit) break;
            }
          }
        } catch (error) {
          // Continue scanning other blocks
          continue;
        }
      }

      console.log(`📜 Found ${transactions.length} transactions in history`);
      return transactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Save wallet to secure storage
   */
  private async saveWallet(account: WalletAccount): Promise<void> {
    try {
      await AsyncStorage.setItem('cypher_wallet_account', JSON.stringify(account));
      console.log('💾 Wallet saved to storage');
    } catch (error) {
      console.error('Failed to save wallet:', error);
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Load wallet from storage
   */
  private async loadStoredWallet(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('cypher_wallet_account');
      if (stored) {
        this.currentAccount = JSON.parse(stored);
        console.log(`💾 Loaded wallet from storage: ${this.currentAccount?.address}`);
      }
    } catch (error) {
      console.error('Failed to load wallet from storage:', error);
    }
  }

  /**
   * Clear wallet data (logout)
   */
  public async clearWallet(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cypher_wallet_account');
      this.currentAccount = null;
      this.balanceCache.clear();
      this.ensCache.clear();
      console.log('🗑️ Wallet data cleared');
    } catch (error) {
      console.error('Failed to clear wallet:', error);
    }
  }

  /**
   * Check if wallet is available
   */
  public hasWallet(): boolean {
    return this.currentAccount !== null;
  }

  /**
   * Get network info for current chain
   */
  public getNetworkInfo(chainId: number = this.SEPOLIA_CHAIN_ID) {
    return this.networkService.getNetwork(chainId);
  }

  /**
   * Switch network
   */
  public async switchNetwork(chainId: number): Promise<void> {
    await this.networkService.switchNetwork(chainId);
    
    // Clear balance cache when switching networks
    this.balanceCache.clear();
  }
}

export default RealWalletService;
