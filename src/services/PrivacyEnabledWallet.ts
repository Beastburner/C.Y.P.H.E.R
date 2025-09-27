import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { privacyService } from '../services/PrivacyService';
import { WalletService } from '../services/WalletService';
import { NetworkService } from '../services/NetworkService';

/**
 * Privacy-Enhanced Wallet Class
 * Extends standard wallet functionality with dual-layer privacy architecture
 */
export class PrivacyEnabledWallet {
  private walletService: WalletService;
  private networkService: NetworkService;
  private isPrivacyModeEnabled: boolean = false;
  private currentAlias: string | null = null;

  constructor() {
    this.walletService = WalletService.getInstance();
    this.networkService = NetworkService.getInstance();
  }

  /**
   * Initialize privacy-enabled wallet
   */
  public async initialize(): Promise<void> {
    try {
      // Check if privacy mode is enabled
      const privacyState = await privacyService.getPrivacyState();
      this.isPrivacyModeEnabled = privacyState.isPrivacyEnabled;

      console.log('🔐 Privacy-enabled wallet initialized');
    } catch (error) {
      console.error('Failed to initialize privacy wallet:', error);
      throw error;
    }
  }

  /**
   * Enable dual-layer privacy architecture
   */
  public async enablePrivacyMode(): Promise<{ success: boolean; aliasId?: string; error?: string }> {
    try {
      // Enable dual-layer privacy
      const result = await privacyService.enableDualLayerMode();
      
      if (result.success) {
        this.isPrivacyModeEnabled = true;
        this.currentAlias = result.aliasId || null;
        
        console.log('✅ Privacy mode enabled with alias:', this.currentAlias);
        return { success: true, aliasId: this.currentAlias || undefined };
      } else {
        throw new Error(result.error || 'Failed to enable privacy mode');
      }
    } catch (error) {
      console.error('❌ Failed to enable privacy mode:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Disable privacy mode
   */
  public async disablePrivacyMode(): Promise<void> {
    await privacyService.disablePrivacyMode();
    this.isPrivacyModeEnabled = false;
    this.currentAlias = null;
    console.log('🔓 Privacy mode disabled');
  }

  /**
   * Send transaction with enhanced error handling and logging
   */
  public async sendTransaction(params: {
    to: string;
    value: string;
    data?: string;
    usePrivacy?: boolean;
    aliasId?: string;
  }): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    const { to, value, data, usePrivacy = false, aliasId } = params;
    
    try {
      console.log('🚀 Starting transaction:', {
        to,
        value,
        usePrivacy,
        privacyMode: this.isPrivacyModeEnabled
      });

      // Validate inputs
      if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      if (!value || parseFloat(value) <= 0) {
        throw new Error('Invalid transaction amount');
      }

      // Get current account
      const accounts = await this.walletService.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No active accounts found');
      }

      const currentAccount = accounts[0];
      console.log('📄 Using account:', currentAccount.address);

      // Check balance before sending
      const balanceResult = await this.walletService.getEthereumBalance(currentAccount.address);
      const currentBalance = parseFloat(balanceResult.balance);
      const sendAmount = parseFloat(value);
      
      console.log('💰 Current balance:', currentBalance, 'ETH');
      console.log('💸 Sending amount:', sendAmount, 'ETH');

      if (currentBalance < sendAmount) {
        throw new Error(`Insufficient balance. You have ${currentBalance} ETH but trying to send ${sendAmount} ETH`);
      }

      // Check if privacy should be used
      if (usePrivacy && this.isPrivacyModeEnabled) {
        console.log('🔒 Using privacy-enhanced transaction');
        // Use privacy-enhanced transaction
        if (aliasId || this.currentAlias) {
          // Dual-layer architecture with alias
          return await privacyService.sendPrivateTransactionWithAlias({
            aliasId: aliasId || this.currentAlias!,
            recipient: to,
            amount: value,
            useZKProof: true,
          });
        } else {
          // Basic privacy pool
          return await privacyService.sendPrivateTransaction({
            recipient: to,
            amount: value,
            useZKProof: true,
          });
        }
      } else {
        console.log('👁️ Using standard transaction');
        // Standard transaction
        return await this.sendStandardTransaction({
          from: currentAccount.address,
          to,
          value,
          data,
        });
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send standard (non-private) transaction
   */
  private async sendStandardTransaction(params: {
    from: string;
    to: string;
    value: string;
    data?: string;
  }): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Sending standard transaction:', {
        from: params.from,
        to: params.to,
        amount: params.value,
      });

      // Use the actual transferEthereum method from WalletService
      const result = await this.walletService.transferEthereum({
        fromAddress: params.from,
        toAddress: params.to,
        amount: params.value,
        // Optional: add gas settings
        gasLimit: '21000', // Standard ETH transfer
      });

      console.log('✅ Transaction sent successfully:', result.transactionHash);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
      };
    } catch (error) {
      console.error('❌ Standard transaction failed:', error);
      
      // Provide more specific error messages
      let errorMessage = (error as Error).message;
      if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance to send this transaction';
      } else if (errorMessage.includes('invalid address')) {
        errorMessage = 'Invalid recipient address';
      } else if (errorMessage.includes('network')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Get wallet balance with privacy considerations
   */
  public async getBalance(includePrivateBalance: boolean = true): Promise<{
    publicBalance: string;
    privateBalance?: string;
    totalBalance: string;
  }> {
    try {
      const accounts = await this.walletService.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No active accounts found');
      }

      const currentAccount = accounts[0];
      
      // Get fresh public balance from blockchain
      console.log('🔄 Refreshing balance for account:', currentAccount.address);
      const balanceResult = await this.walletService.getEthereumBalance(currentAccount.address);
      const publicBalance = balanceResult.balance;
      
      // Update the account balance in storage
      currentAccount.balance = publicBalance;
      currentAccount.lastBalanceUpdate = Date.now();

      let privateBalance = '0';
      
      if (includePrivateBalance && this.isPrivacyModeEnabled) {
        try {
          // Get private balance from shielded pools
          const privacyStats = await privacyService.getPrivacyPoolStats();
          // Use total deposits as approximation for private balance
          privateBalance = (privacyStats.totalDeposits / 100).toString(); // Assume user has small portion
        } catch (error) {
          console.warn('Failed to get private balance:', error);
        }
      }

      const totalBalance = (
        parseFloat(publicBalance) + parseFloat(privateBalance)
      ).toString();

      console.log('💰 Balance refreshed:', {
        public: publicBalance,
        private: privateBalance,
        total: totalBalance
      });

      return {
        publicBalance,
        privateBalance: includePrivateBalance ? privateBalance : undefined,
        totalBalance,
      };
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Force refresh balance from blockchain
   */
  public async refreshBalance(): Promise<{
    publicBalance: string;
    privateBalance?: string;
    totalBalance: string;
  }> {
    console.log('🔄 Force refreshing balance...');
    return await this.getBalance(true);
  }

  /**
   * Create new privacy alias
   */
  public async createAlias(name?: string): Promise<{
    success: boolean;
    aliasId?: string;
    error?: string;
  }> {
    const aliasName = name || `Alias_${Date.now()}`;
    return await privacyService.createAlias(aliasName);
  }

  /**
   * Get user's privacy aliases
   */
  public async getAliases(): Promise<any[]> {
    return await privacyService.getUserAliases();
  }

  /**
   * Switch to different privacy alias
   */
  public async switchAlias(aliasId: string): Promise<void> {
    const aliases = await this.getAliases();
    const alias = aliases.find(a => a.id === aliasId);
    
    if (!alias) {
      throw new Error('Alias not found');
    }

    if (!alias.isActive) {
      throw new Error('Alias is not active');
    }

    this.currentAlias = aliasId;
    console.log('🎭 Switched to alias:', aliasId);
  }

  /**
   * Get current privacy status
   */
  public getPrivacyStatus(): {
    isPrivacyEnabled: boolean;
    currentAlias: string | null;
    dualLayerMode: boolean;
  } {
    return {
      isPrivacyEnabled: this.isPrivacyModeEnabled,
      currentAlias: this.currentAlias,
      dualLayerMode: this.isPrivacyModeEnabled && !!this.currentAlias,
    };
  }

  /**
   * Get transaction history with privacy filtering
   */
  public async getTransactionHistory(options: {
    includePrivate?: boolean;
    aliasId?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const { includePrivate = true, aliasId, limit = 50 } = options;
      
      // Get standard transaction history
      const accounts = await this.walletService.getAllAccounts();
      if (!accounts || accounts.length === 0) {
        return [];
      }

      const currentAccount = accounts[0];
      const network = this.networkService.getCurrentNetwork();
      
      // This would integrate with the transaction service to get history
      // For now, return empty array as it's a complex integration
      const publicHistory: any[] = [];

      let privateHistory: any[] = [];
      
      if (includePrivate && this.isPrivacyModeEnabled) {
        // Get private transaction history
        // This would query privacy pools and shielded transactions
        privateHistory = []; // Placeholder
      }

      const allTransactions = [...publicHistory, ...privateHistory];
      
      // Filter by alias if specified
      if (aliasId) {
        return allTransactions.filter(tx => tx.aliasId === aliasId);
      }

      return allTransactions.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get transaction history:', error);
      return [];
    }
  }

  /**
   * Estimate transaction fee with privacy overhead
   */
  public async estimateTransactionFee(params: {
    to: string;
    value: string;
    usePrivacy?: boolean;
    aliasId?: string;
  }): Promise<{
    baseFee: string;
    privacyFee?: string;
    totalFee: string;
  }> {
    try {
      const { usePrivacy = true, aliasId } = params;
      
      // Base transaction fee
      const baseGasLimit = 21000;
      const gasPrice = 20e9; // 20 gwei
      const baseFee = ((baseGasLimit * gasPrice) / 1e18).toFixed(6);

      let privacyFee = '0';
      
      if (usePrivacy && this.isPrivacyModeEnabled) {
        // Additional gas for privacy features
        const privacyGas = aliasId || this.currentAlias ? 150000 : 100000;
        privacyFee = ((privacyGas * gasPrice) / 1e18).toFixed(6);
      }

      const totalFee = (parseFloat(baseFee) + parseFloat(privacyFee)).toFixed(6);

      return {
        baseFee,
        privacyFee: usePrivacy ? privacyFee : undefined,
        totalFee,
      };
    } catch (error) {
      console.error('❌ Failed to estimate transaction fee:', error);
      throw error;
    }
  }

  /**
   * Update privacy preferences
   */
  async updatePrivacyPreferences(preferences: {
    acceptsPrivatePayments: boolean;
    minPrivateAmount: number;
    maxPrivateAmount: number;
    autoShieldLargeAmounts?: boolean;
    shieldThreshold?: number;
  }): Promise<void> {
    try {
      // In production, this would update user preferences in the privacy service
      console.log('Updating privacy preferences:', preferences);
      
      // Store preferences locally for now
      await AsyncStorage.setItem(
        'privacyPreferences',
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Failed to update privacy preferences:', error);
      throw error;
    }
  }

  /**
   * Get privacy analytics data
   */
  async getPrivacyAnalytics(): Promise<{
    totalShieldedAmount: string;
    totalPrivateTransactions: number;
    averagePrivacyLatency: number;
    privacyScoreBreakdown: {
      anonymitySet: number;
      transactionMixing: number;
      temporalPrivacy: number;
      networkPrivacy: number;
    };
  }> {
    try {
      // In production, calculate from actual transaction data
      return {
        totalShieldedAmount: '12.5',
        totalPrivateTransactions: 45,
        averagePrivacyLatency: 2.3,
        privacyScoreBreakdown: {
          anonymitySet: 85,
          transactionMixing: 78,
          temporalPrivacy: 92,
          networkPrivacy: 76,
        },
      };
    } catch (error) {
      console.error('Failed to get privacy analytics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const privacyEnabledWallet = new PrivacyEnabledWallet();
export default privacyEnabledWallet;
