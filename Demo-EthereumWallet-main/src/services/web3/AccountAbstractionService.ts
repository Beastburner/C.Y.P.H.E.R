/**
 * Cypher Wallet - Account Abstraction Service (EIP-4337)
 * Gasless transactions and social recovery with smart accounts
 * 
 * Features:
 * - EIP-4337 Account Abstraction support
 * - Smart contract wallets
 * - Gasless transactions with paymasters
 * - Social recovery mechanisms
 * - Batch transactions
 * - Custom validation logic
 * - Upgradeable account contracts
 * - Multi-signature support
 */

import { ethers } from 'ethers';
import { performanceEngine } from '../performance/PerformanceEngine';
import { perfectUX } from '../ux/PerfectUXManager';
import { networkService } from '../NetworkService';

// Account Abstraction interfaces
export interface SmartAccount {
  address: string;
  owner: string;
  factory: string;
  implementation: string;
  initCode: string;
  accountType: 'simple' | 'multisig' | 'social_recovery' | 'custom';
  features: AccountFeature[];
  deployed: boolean;
  nonce: number;
  balance: string;
  guardians?: string[];
  signers?: string[];
  threshold?: number;
  recovery: RecoveryConfig;
  paymaster?: string;
  createdAt: number;
}

export interface AccountFeature {
  name: string;
  enabled: boolean;
  config: any;
}

export interface RecoveryConfig {
  enabled: boolean;
  guardians: Guardian[];
  threshold: number;
  delay: number; // seconds
  pendingRecovery?: PendingRecovery;
}

export interface Guardian {
  address: string;
  name?: string;
  type: 'eoa' | 'contract' | 'hardware' | 'social';
  weight: number;
  addedAt: number;
  verified: boolean;
}

export interface PendingRecovery {
  id: string;
  newOwner: string;
  initiatedBy: string;
  approvals: string[];
  requiredApprovals: number;
  executeAfter: number;
  executed: boolean;
}

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface UserOperationRequest {
  target: string;
  value: string;
  data: string;
  operation?: number; // 0 = call, 1 = delegatecall
}

export interface PaymasterInfo {
  address: string;
  name: string;
  type: 'verifying' | 'deposit' | 'token' | 'sponsored';
  supportedTokens?: string[];
  policies: PaymasterPolicy[];
  balance: string;
  trusted: boolean;
  active: boolean;
  reliability: number;
}

export interface PaymasterPolicy {
  type: 'gas_limit' | 'user_limit' | 'token_rate' | 'whitelist';
  value: any;
  enabled: boolean;
}

export interface BundlerInfo {
  url: string;
  chainId: number;
  entryPoint: string;
  active: boolean;
  supportedMethods: string[];
  gasPrice: string;
  reliability: number;
}

export interface AccountDeployment {
  id: string;
  accountType: string;
  salt: string;
  initCode: string;
  predictedAddress: string;
  deployed: boolean;
  deploymentTx?: string;
  createdAt: number;
}

/**
 * Account Abstraction Service
 * Manages EIP-4337 smart accounts and operations
 */
export class AccountAbstractionService {
  private static instance: AccountAbstractionService;
  
  private smartAccounts: Map<string, SmartAccount> = new Map();
  private paymasters: Map<string, PaymasterInfo> = new Map();
  private bundlers: Map<number, BundlerInfo> = new Map();
  private pendingDeployments: Map<string, AccountDeployment> = new Map();
  
  // Account factory contracts
  private readonly ACCOUNT_FACTORIES = {
    simple: '0x9406Cc6185a346906296840746125a0E44976454',
    multisig: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    social_recovery: '0x0576a174D229E3cFA37253523E645A78A0C91B57'
  };
  
  // EntryPoint contract address (EIP-4337)
  private readonly ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';
  
  private constructor() {
    this.initializeService();
  }
  
  public static getInstance(): AccountAbstractionService {
    if (!AccountAbstractionService.instance) {
      AccountAbstractionService.instance = new AccountAbstractionService();
    }
    return AccountAbstractionService.instance;
  }
  
  /**
   * Initialize account abstraction service
   */
  private async initializeService(): Promise<void> {
    try {
      // Initialize bundlers for supported chains
      await this.initializeBundlers();
      
      // Initialize paymasters
      await this.initializePaymasters();
      
      console.log('Account Abstraction service initialized');
      
    } catch (error) {
      console.error('Failed to initialize Account Abstraction service:', error);
    }
  }
  
  /**
   * Create smart account
   */
  public async createSmartAccount(
    owner: string,
    accountType: 'simple' | 'multisig' | 'social_recovery' | 'custom' = 'simple',
    config: any = {}
  ): Promise<SmartAccount> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const salt = ethers.utils.id(Date.now().toString() + Math.random().toString());
        const factory = (this.ACCOUNT_FACTORIES as any)[accountType] || this.ACCOUNT_FACTORIES.simple;
        
        // Generate init code
        const initCode = await this.generateInitCode(accountType, owner, salt, config);
        
        // Predict account address
        const predictedAddress = await this.predictAccountAddress(factory, initCode, salt);
        
        // Create smart account
        const smartAccount: SmartAccount = {
          address: predictedAddress,
          owner,
          factory,
          implementation: await this.getImplementationAddress(accountType),
          initCode,
          accountType,
          features: this.getDefaultFeatures(accountType),
          deployed: false,
          nonce: 0,
          balance: '0',
          recovery: {
            enabled: accountType === 'social_recovery',
            guardians: config.guardians ? this.formatGuardians(config.guardians) : [],
            threshold: config.threshold || 1,
            delay: config.delay || 24 * 60 * 60 // 24 hours
          },
          createdAt: Date.now()
        };
        
        // Add multi-sig specific fields
        if (accountType === 'multisig') {
          smartAccount.signers = config.signers || [owner];
          smartAccount.threshold = config.threshold || 1;
        }
        
        // Store account
        this.smartAccounts.set(predictedAddress, smartAccount);
        
        // Track deployment
        const deployment: AccountDeployment = {
          id: salt,
          accountType,
          salt,
          initCode,
          predictedAddress,
          deployed: false,
          createdAt: Date.now()
        };
        
        this.pendingDeployments.set(salt, deployment);
        
        await perfectUX.trackAction('smart_account_created', {
          type: accountType,
          address: predictedAddress
        });
        
        return smartAccount;
      }, `create_account_${accountType}`);
      
    } catch (error) {
      console.error('Failed to create smart account:', error);
      throw error;
    }
  }
  
  /**
   * Deploy smart account
   */
  public async deploySmartAccount(
    accountAddress: string,
    paymaster?: string
  ): Promise<string> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account) {
        throw new Error('Smart account not found');
      }
      
      if (account.deployed) {
        throw new Error('Account already deployed');
      }
      
      // Create deployment user operation
      const userOp = await this.createDeploymentUserOperation(account, paymaster);
      
      // Submit to bundler
      const userOpHash = await this.submitUserOperation(userOp, 1); // Assume mainnet
      
      // Update account status
      account.deployed = true;
      account.nonce = 1;
      
      // Update deployment status
      const deployment = Array.from(this.pendingDeployments.values())
        .find(d => d.predictedAddress === accountAddress);
      
      if (deployment) {
        deployment.deployed = true;
        deployment.deploymentTx = userOpHash;
      }
      
      await perfectUX.trackAction('smart_account_deployed', {
        address: accountAddress,
        type: account.accountType
      });
      
      return userOpHash;
      
    } catch (error) {
      console.error('Failed to deploy smart account:', error);
      throw error;
    }
  }
  
  /**
   * Execute transaction through smart account
   */
  public async executeTransaction(
    accountAddress: string,
    requests: UserOperationRequest[],
    paymaster?: string
  ): Promise<string> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const account = this.smartAccounts.get(accountAddress);
        if (!account) {
          throw new Error('Smart account not found');
        }
        
        // Create user operation
        const userOp = await this.createUserOperation(account, requests, paymaster);
        
        // Submit to bundler
        const userOpHash = await this.submitUserOperation(userOp, 1);
        
        // Update account nonce
        account.nonce++;
        
        await perfectUX.trackAction('smart_account_transaction', {
          address: accountAddress,
          operations: requests.length,
          gasless: !!paymaster
        });
        
        return userOpHash;
      }, `execute_tx_${accountAddress}`);
      
    } catch (error) {
      console.error('Failed to execute transaction:', error);
      throw error;
    }
  }
  
  /**
   * Execute batch transactions
   */
  public async executeBatchTransactions(
    accountAddress: string,
    transactions: Array<{
      to: string;
      value: string;
      data: string;
    }>,
    paymaster?: string
  ): Promise<string> {
    try {
      const requests: UserOperationRequest[] = transactions.map(tx => ({
        target: tx.to,
        value: tx.value,
        data: tx.data,
        operation: 0 // CALL
      }));
      
      return await this.executeTransaction(accountAddress, requests, paymaster);
      
    } catch (error) {
      console.error('Failed to execute batch transactions:', error);
      throw error;
    }
  }
  
  /**
   * Initiate social recovery
   */
  public async initiateSocialRecovery(
    accountAddress: string,
    newOwner: string,
    guardian: string
  ): Promise<string> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account || !account.recovery.enabled) {
        throw new Error('Social recovery not enabled for this account');
      }
      
      // Verify guardian
      const guardianInfo = account.recovery.guardians.find(g => g.address === guardian);
      if (!guardianInfo) {
        throw new Error('Invalid guardian');
      }
      
      // Create recovery request
      const recoveryId = ethers.utils.id(Date.now().toString());
      const pendingRecovery: PendingRecovery = {
        id: recoveryId,
        newOwner,
        initiatedBy: guardian,
        approvals: [guardian],
        requiredApprovals: account.recovery.threshold,
        executeAfter: Date.now() + (account.recovery.delay * 1000),
        executed: false
      };
      
      account.recovery.pendingRecovery = pendingRecovery;
      
      // Create user operation for recovery initiation
      const callData = this.encodeRecoveryInitiation(newOwner, guardian);
      const userOp = await this.createUserOperation(account, [{
        target: account.address,
        value: '0',
        data: callData
      }]);
      
      const userOpHash = await this.submitUserOperation(userOp, 1);
      
      await perfectUX.trackAction('social_recovery_initiated', {
        account: accountAddress,
        guardian
      });
      
      return userOpHash;
      
    } catch (error) {
      console.error('Failed to initiate social recovery:', error);
      throw error;
    }
  }
  
  /**
   * Approve social recovery
   */
  public async approveSocialRecovery(
    accountAddress: string,
    recoveryId: string,
    guardian: string
  ): Promise<void> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account || !account.recovery.pendingRecovery) {
        throw new Error('No pending recovery found');
      }
      
      const recovery = account.recovery.pendingRecovery;
      if (recovery.id !== recoveryId) {
        throw new Error('Invalid recovery ID');
      }
      
      // Verify guardian
      const guardianInfo = account.recovery.guardians.find(g => g.address === guardian);
      if (!guardianInfo) {
        throw new Error('Invalid guardian');
      }
      
      // Add approval if not already approved
      if (!recovery.approvals.includes(guardian)) {
        recovery.approvals.push(guardian);
      }
      
      await perfectUX.trackAction('social_recovery_approved', {
        account: accountAddress,
        guardian,
        totalApprovals: recovery.approvals.length
      });
      
    } catch (error) {
      console.error('Failed to approve social recovery:', error);
      throw error;
    }
  }
  
  /**
   * Execute social recovery
   */
  public async executeSocialRecovery(accountAddress: string): Promise<string> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account || !account.recovery.pendingRecovery) {
        throw new Error('No pending recovery found');
      }
      
      const recovery = account.recovery.pendingRecovery;
      
      // Check if enough approvals
      if (recovery.approvals.length < recovery.requiredApprovals) {
        throw new Error('Insufficient approvals');
      }
      
      // Check if delay period passed
      if (Date.now() < recovery.executeAfter) {
        throw new Error('Recovery delay period not passed');
      }
      
      // Create user operation for recovery execution
      const callData = this.encodeRecoveryExecution(recovery.newOwner);
      const userOp = await this.createUserOperation(account, [{
        target: account.address,
        value: '0',
        data: callData
      }]);
      
      const userOpHash = await this.submitUserOperation(userOp, 1);
      
      // Update account owner
      account.owner = recovery.newOwner;
      recovery.executed = true;
      
      await perfectUX.trackAction('social_recovery_executed', {
        account: accountAddress,
        newOwner: recovery.newOwner
      });
      
      return userOpHash;
      
    } catch (error) {
      console.error('Failed to execute social recovery:', error);
      throw error;
    }
  }
  
  /**
   * Get smart accounts for owner
   */
  public getSmartAccounts(owner: string): SmartAccount[] {
    return Array.from(this.smartAccounts.values())
      .filter(account => account.owner === owner)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  
  /**
   * Get account info
   */
  public async getAccountInfo(accountAddress: string): Promise<SmartAccount | null> {
    const account = this.smartAccounts.get(accountAddress);
    if (!account) return null;
    
    // Update balance
    try {
      const provider = await networkService.getProvider(1);
      const balance = await provider?.getBalance(accountAddress);
      if (balance) {
        account.balance = ethers.utils.formatEther(balance);
      }
    } catch (error) {
      console.warn('Failed to update account balance:', error);
    }
    
    return account;
  }
  
  /**
   * Get available paymasters
   */
  public getAvailablePaymasters(chainId: number = 1): PaymasterInfo[] {
    return Array.from(this.paymasters.values())
      .filter(paymaster => paymaster.active)
      .sort((a, b) => b.reliability - a.reliability);
  }
  
  /**
   * Estimate user operation gas
   */
  public async estimateUserOperationGas(
    userOp: Partial<UserOperation>,
    chainId: number = 1
  ): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
  }> {
    try {
      const bundler = this.bundlers.get(chainId);
      if (!bundler) {
        throw new Error('No bundler available for chain');
      }
      
      // Simulate gas estimation (would use actual bundler)
      return {
        callGasLimit: '100000',
        verificationGasLimit: '50000',
        preVerificationGas: '21000'
      };
      
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  private async initializeBundlers(): Promise<void> {
    // Initialize bundlers for supported chains
    const bundlers: Array<[number, BundlerInfo]> = [
      [1, {
        url: 'https://bundler.mainnet.example.com',
        chainId: 1,
        entryPoint: this.ENTRY_POINT,
        active: true,
        supportedMethods: ['eth_sendUserOperation', 'eth_estimateUserOperationGas'],
        gasPrice: '20000000000',
        reliability: 0.99
      }],
      [137, {
        url: 'https://bundler.polygon.example.com',
        chainId: 137,
        entryPoint: this.ENTRY_POINT,
        active: true,
        supportedMethods: ['eth_sendUserOperation', 'eth_estimateUserOperationGas'],
        gasPrice: '30000000000',
        reliability: 0.97
      }]
    ];
    
    bundlers.forEach(([chainId, bundler]) => {
      this.bundlers.set(chainId, bundler);
    });
  }
  
  private async initializePaymasters(): Promise<void> {
    // Initialize common paymasters
    const paymasters: PaymasterInfo[] = [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Gasless Paymaster',
        type: 'sponsored',
        policies: [
          { type: 'gas_limit', value: '500000', enabled: true },
          { type: 'user_limit', value: '10', enabled: true }
        ],
        balance: '10.0',
        trusted: true,
        active: true,
        reliability: 0.99
      },
      {
        address: '0x2345678901234567890123456789012345678901',
        name: 'Token Paymaster',
        type: 'token',
        supportedTokens: ['0xA0b86a33E6441bc0b291a2cd5d74b1F8B71EDC3B'], // USDC
        policies: [
          { type: 'token_rate', value: '1.1', enabled: true }
        ],
        balance: '5.0',
        trusted: true,
        active: true,
        reliability: 0.95
      }
    ];
    
    paymasters.forEach(paymaster => {
      this.paymasters.set(paymaster.address, paymaster);
    });
  }
  
  private async generateInitCode(
    accountType: string,
    owner: string,
    salt: string,
    config: any
  ): Promise<string> {
    // Generate init code based on account type
    switch (accountType) {
      case 'simple':
        return this.generateSimpleAccountInitCode(owner, salt);
      case 'multisig':
        return this.generateMultiSigInitCode(config.signers || [owner], config.threshold || 1, salt);
      case 'social_recovery':
        return this.generateSocialRecoveryInitCode(owner, config.guardians || [], salt);
      default:
        return this.generateSimpleAccountInitCode(owner, salt);
    }
  }
  
  private generateSimpleAccountInitCode(owner: string, salt: string): string {
    // Encode factory call for simple account creation
    const factory = this.ACCOUNT_FACTORIES.simple;
    const initCode = ethers.utils.solidityPack(
      ['address', 'bytes'],
      [factory, ethers.utils.defaultAbiCoder.encode(['address', 'uint256'], [owner, salt])]
    );
    return initCode;
  }
  
  private generateMultiSigInitCode(signers: string[], threshold: number, salt: string): string {
    // Encode factory call for multi-sig account creation
    const factory = this.ACCOUNT_FACTORIES.multisig;
    const initCode = ethers.utils.solidityPack(
      ['address', 'bytes'],
      [factory, ethers.utils.defaultAbiCoder.encode(
        ['address[]', 'uint256', 'uint256'],
        [signers, threshold, salt]
      )]
    );
    return initCode;
  }
  
  private generateSocialRecoveryInitCode(owner: string, guardians: string[], salt: string): string {
    // Encode factory call for social recovery account creation
    const factory = this.ACCOUNT_FACTORIES.social_recovery;
    const initCode = ethers.utils.solidityPack(
      ['address', 'bytes'],
      [factory, ethers.utils.defaultAbiCoder.encode(
        ['address', 'address[]', 'uint256'],
        [owner, guardians, salt]
      )]
    );
    return initCode;
  }
  
  private async predictAccountAddress(factory: string, initCode: string, salt: string): Promise<string> {
    // Predict CREATE2 address
    const hash = ethers.utils.solidityKeccak256(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', factory, salt, ethers.utils.keccak256(initCode)]
    );
    
    return ethers.utils.getAddress(ethers.utils.hexDataSlice(hash, 12));
  }
  
  private async getImplementationAddress(accountType: string): Promise<string> {
    // Get implementation contract address for account type
    return (this.ACCOUNT_FACTORIES as any)[accountType] || this.ACCOUNT_FACTORIES.simple;
  }
  
  private getDefaultFeatures(accountType: string): AccountFeature[] {
    const features: AccountFeature[] = [
      { name: 'eip1271_signatures', enabled: true, config: {} },
      { name: 'batch_transactions', enabled: true, config: {} },
      { name: 'gasless_transactions', enabled: true, config: {} }
    ];
    
    if (accountType === 'social_recovery') {
      features.push({ name: 'social_recovery', enabled: true, config: {} });
    }
    
    if (accountType === 'multisig') {
      features.push({ name: 'multisig', enabled: true, config: {} });
    }
    
    return features;
  }
  
  private formatGuardians(guardians: any[]): Guardian[] {
    return guardians.map(guardian => ({
      address: guardian.address || guardian,
      name: guardian.name,
      type: guardian.type || 'eoa',
      weight: guardian.weight || 1,
      addedAt: Date.now(),
      verified: false
    }));
  }
  
  private async createDeploymentUserOperation(
    account: SmartAccount,
    paymaster?: string
  ): Promise<UserOperation> {
    const gasEstimate = await this.estimateUserOperationGas({
      sender: account.address,
      initCode: account.initCode
    });
    
    return {
      sender: account.address,
      nonce: '0x0',
      initCode: account.initCode,
      callData: '0x',
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1000000000',
      paymasterAndData: paymaster || '0x',
      signature: '0x'
    };
  }
  
  private async createUserOperation(
    account: SmartAccount,
    requests: UserOperationRequest[],
    paymaster?: string
  ): Promise<UserOperation> {
    // Encode call data for requests
    let callData: string;
    if (requests.length === 1) {
      callData = this.encodeSingleCall(requests[0]);
    } else {
      callData = this.encodeBatchCall(requests);
    }
    
    const gasEstimate = await this.estimateUserOperationGas({
      sender: account.address,
      callData
    });
    
    return {
      sender: account.address,
      nonce: `0x${account.nonce.toString(16)}`,
      initCode: account.deployed ? '0x' : account.initCode,
      callData,
      callGasLimit: gasEstimate.callGasLimit,
      verificationGasLimit: gasEstimate.verificationGasLimit,
      preVerificationGas: gasEstimate.preVerificationGas,
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1000000000',
      paymasterAndData: paymaster || '0x',
      signature: '0x'
    };
  }
  
  private encodeSingleCall(request: UserOperationRequest): string {
    // Encode single function call
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes'],
      [request.target, request.value, request.data]
    );
  }
  
  private encodeBatchCall(requests: UserOperationRequest[]): string {
    // Encode batch function call
    const targets = requests.map(r => r.target);
    const values = requests.map(r => r.value);
    const datas = requests.map(r => r.data);
    
    return ethers.utils.defaultAbiCoder.encode(
      ['address[]', 'uint256[]', 'bytes[]'],
      [targets, values, datas]
    );
  }
  
  private async submitUserOperation(userOp: UserOperation, chainId: number): Promise<string> {
    const bundler = this.bundlers.get(chainId);
    if (!bundler) {
      throw new Error('No bundler available for chain');
    }
    
    // Submit to bundler (would use actual HTTP request)
    const userOpHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256', 'bytes32'],
        [userOp.sender, userOp.nonce, ethers.utils.keccak256(userOp.callData)]
      )
    );
    
    return userOpHash;
  }
  
  private encodeRecoveryInitiation(newOwner: string, guardian: string): string {
    // Encode social recovery initiation call
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'address'],
      [newOwner, guardian]
    );
  }
  
  private encodeRecoveryExecution(newOwner: string): string {
    // Encode social recovery execution call
    return ethers.utils.defaultAbiCoder.encode(
      ['address'],
      [newOwner]
    );
  }
  
  /**
   * Add guardian to social recovery account
   */
  public async addGuardian(
    accountAddress: string,
    guardian: Guardian
  ): Promise<string> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account || !account.recovery.enabled) {
        throw new Error('Social recovery not enabled');
      }
      
      // Add guardian to local state
      account.recovery.guardians.push(guardian);
      
      // Create user operation to add guardian on-chain
      const callData = ethers.utils.defaultAbiCoder.encode(
        ['address', 'uint256'],
        [guardian.address, guardian.weight]
      );
      
      const userOp = await this.createUserOperation(account, [{
        target: account.address,
        value: '0',
        data: callData
      }]);
      
      return await this.submitUserOperation(userOp, 1);
      
    } catch (error) {
      console.error('Failed to add guardian:', error);
      throw error;
    }
  }
  
  /**
   * Remove guardian from social recovery account
   */
  public async removeGuardian(
    accountAddress: string,
    guardianAddress: string
  ): Promise<string> {
    try {
      const account = this.smartAccounts.get(accountAddress);
      if (!account || !account.recovery.enabled) {
        throw new Error('Social recovery not enabled');
      }
      
      // Remove guardian from local state
      account.recovery.guardians = account.recovery.guardians.filter(
        g => g.address !== guardianAddress
      );
      
      // Create user operation to remove guardian on-chain
      const callData = ethers.utils.defaultAbiCoder.encode(
        ['address'],
        [guardianAddress]
      );
      
      const userOp = await this.createUserOperation(account, [{
        target: account.address,
        value: '0',
        data: callData
      }]);
      
      return await this.submitUserOperation(userOp, 1);
      
    } catch (error) {
      console.error('Failed to remove guardian:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const accountAbstraction = AccountAbstractionService.getInstance();
export default AccountAbstractionService;
