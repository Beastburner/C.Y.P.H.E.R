/**
 * CYPHER Privacy Service - Legacy Wrapper
 * 
 * This provides backward compatibility while using the new dual-layer privacy architecture.
 * 
 * The dual-layer privacy workflow includes:
 * 1. Public Layer (Alias Accounts) - Normal Ethereum interactions
 * 2. Private Layer (Shielded Pool) - ZK commitments and nullifiers
 * 3. Transaction Flow Types:
 *    - Public → Public: Normal Ethereum transfer
 *    - Public → Private: Deposit via alias to shielded pool
 *    - Private → Private: Shielded spend with ZK proofs
 *    - Private → Public: Withdrawal with ZK proof to public
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { dualLayerPrivacyService } from './DualLayerPrivacyService';

// Re-export types from the dual-layer service
export {
  type AliasAccount,
  type PrivacyNote,
  type PrivacyTransaction,
  type PrivacySettings
} from './DualLayerPrivacyService';

// Legacy types for backward compatibility
export interface PrivacyPoolConfig {
  denomination: string;
  contractAddress: string;
  merkleTreeHeight: number;
  anonymitySetSize: number;
  isActive: boolean;
  apy: string;
  network: string;
}

export interface ShieldedDeposit {
  id: string;
  amount: string;
  commitment: string;
  nullifier: string;
  secret: string;
  leafIndex: number;
  timestamp: Date;
  poolAddress: string;
  merkleRoot: string;
  txHash: string;
}

export interface ZKProofData {
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicInputs: string[];
  verificationKey?: any;
  privacyScore?: number;
}

export interface ShieldedWithdrawal {
  id: string;
  amount: string;
  recipient: string;
  nullifierHash: string;
  zkProof: ZKProofData;
  merkleRoot: string;
  fee: string;
  relayerAddress?: string;
  timestamp: Date;
}

export interface ENSPrivacyProfile {
  ensName: string;
  encryptedRecords: Record<string, string>;
  accessControls: Record<string, 'public' | 'friends' | 'private'>;
  encryptionKey: string;
  isPrivacyEnabled: boolean;
  friendsList: string[];
  lastUpdated: Date;
}

/**
 * Legacy Privacy Service Wrapper
 * Maintains backward compatibility while using dual-layer architecture
 */
export class PrivacyService {
  private static instance: PrivacyService;

  private constructor() {
    // Initialize the dual-layer service
    dualLayerPrivacyService;
  }

  public static getInstance(): PrivacyService {
    if (!PrivacyService.instance) {
      PrivacyService.instance = new PrivacyService();
    }
    return PrivacyService.instance;
  }

  /**
   * Enable privacy mode - implements the dual-layer workflow
   */
  public async enablePrivacyMode(settings?: any): Promise<{
    success: boolean;
    privacyModeStatus: string;
    enabledFeatures: string[];
  }> {
    try {
      const result = await dualLayerPrivacyService.togglePrivacyMode();
      
      return {
        success: result.success,
        privacyModeStatus: result.mode,
        enabledFeatures: result.mode === 'private' ? 
          ['Dual-Layer Privacy', 'Shielded Pool', 'ZK Proofs', 'Alias Accounts'] : 
          ['Public Mode']
      };
    } catch (error) {
      console.error('❌ Failed to enable privacy mode:', error);
      return {
        success: false,
        privacyModeStatus: 'disabled',
        enabledFeatures: []
      };
    }
  }

  /**
   * Create alias account - Public Layer component
   */
  public async createAliasAccount(): Promise<{
    success: boolean;
    aliasAccount?: any;
    error?: string;
  }> {
    console.log('🏗️ Creating alias account (Public Layer)');
    return await dualLayerPrivacyService.createAliasAccount();
  }

  /**
   * Deposit to shielded pool - Public → Private transaction
   */
  public async depositToPool(params: {
    amount: string;
    poolAddress?: string;
  }): Promise<{
    success: boolean;
    deposit?: any;
    txHash?: string;
    error?: string;
  }> {
    console.log('💰 Depositing to shielded pool (Public → Private)');
    
    const result = await dualLayerPrivacyService.depositToShieldedPool({
      amount: params.amount,
      recipient: params.poolAddress
    });

    return {
      success: result.success,
      deposit: result.note ? {
        id: result.note.id,
        amount: result.note.amount,
        commitment: result.commitment,
        nullifier: result.note.nullifier,
        secret: result.note.secret,
        leafIndex: result.note.merkleIndex,
        timestamp: result.note.createdAt,
        poolAddress: params.poolAddress || '',
        merkleRoot: '0x' + '0'.repeat(64),
        txHash: result.txHash || ''
      } : undefined,
      txHash: result.txHash,
      error: result.error
    };
  }

  /**
   * Withdraw from shielded pool - Private → Public transaction
   */
  public async withdrawFromPool(params: {
    depositId: string;
    recipient: string;
    fee?: string;
  }): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    console.log('🏧 Withdrawing from shielded pool (Private → Public)');
    
    const notes = await dualLayerPrivacyService.getUnspentNotes();
    const note = notes.find(n => n.id === params.depositId);
    
    if (!note) {
      return { success: false, error: 'Deposit not found' };
    }

    return await dualLayerPrivacyService.withdrawFromShieldedPool({
      noteId: params.depositId,
      recipient: params.recipient,
      amount: note.amount,
      fee: params.fee
    });
  }

  /**
   * Send shielded transaction - Private → Private transaction
   */
  public async sendShieldedTransaction(params: {
    inputNoteIds: string[];
    outputs: Array<{ recipient: string; amount: string }>;
    fee?: string;
  }): Promise<{
    success: boolean;
    outputNotes?: any[];
    txHash?: string;
    error?: string;
  }> {
    console.log('🔒 Sending shielded transaction (Private → Private)');
    return await dualLayerPrivacyService.sendShieldedTransaction(params);
  }

  /**
   * Get user's shielded deposits - Legacy compatibility
   */
  public async getUserShieldedDeposits(): Promise<ShieldedDeposit[]> {
    const notes = await dualLayerPrivacyService.getUnspentNotes();
    
    return notes.map(note => ({
      id: note.id,
      amount: note.amount,
      commitment: note.commitment,
      nullifier: note.nullifier,
      secret: note.secret,
      leafIndex: note.merkleIndex,
      timestamp: note.createdAt,
      poolAddress: '',
      merkleRoot: '0x' + '0'.repeat(64),
      txHash: '0x' + '1234567890abcdef'.repeat(8)
    }));
  }

  /**
   * Get privacy pools configuration
   */
  public async getPrivacyPools(): Promise<PrivacyPoolConfig[]> {
    return [{
      denomination: '0.1',
      contractAddress: '0x' + '1'.repeat(40),
      merkleTreeHeight: 20,
      anonymitySetSize: 1000,
      isActive: true,
      apy: '5.2%',
      network: 'ethereum'
    }];
  }

  /**
   * Generate ZK proof - Mock implementation for legacy compatibility
   */
  public async generateZKProof(
    deposit: ShieldedDeposit,
    recipient: string,
    relayerFee: string = '0'
  ): Promise<ZKProofData> {
    return {
      proof: {
        a: ['0x' + '1'.repeat(64), '0x' + '2'.repeat(64)],
        b: [
          ['0x' + '3'.repeat(64), '0x' + '4'.repeat(64)],
          ['0x' + '5'.repeat(64), '0x' + '6'.repeat(64)]
        ],
        c: ['0x' + '7'.repeat(64), '0x' + '8'.repeat(64)],
      },
      publicInputs: [
        '0x' + '9'.repeat(64), // merkle root
        '0x' + 'a'.repeat(64), // nullifier hash
        recipient,
        relayerFee,
      ],
      privacyScore: 85,
    };
  }

  /**
   * Get current privacy mode
   */
  public getPrivacyMode(): 'public' | 'private' {
    return dualLayerPrivacyService.getPrivacyMode();
  }

  /**
   * Toggle privacy mode
   */
  public async togglePrivacyMode(): Promise<{
    success: boolean;
    mode: 'public' | 'private';
    balanceVisible: boolean;
  }> {
    console.log('🔄 Toggling privacy mode');
    return await dualLayerPrivacyService.togglePrivacyMode();
  }

  /**
   * Get alias accounts (Public Layer)
   */
  public async getAliasAccounts(): Promise<any[]> {
    return await dualLayerPrivacyService.getAliasAccounts();
  }

  /**
   * Get privacy transaction history
   */
  public async getPrivacyTransactionHistory(): Promise<any[]> {
    return await dualLayerPrivacyService.getPrivacyTransactionHistory();
  }

  /**
   * Get private balance
   */
  public async getPrivateBalance(): Promise<string> {
    return await dualLayerPrivacyService.getPrivateBalance();
  }

  /**
   * Get available transaction types - Dual-layer workflow
   */
  public async getAvailableTransactionTypes(): Promise<{
    publicToPublic: boolean;
    publicToPrivate: boolean;
    privateToPrivate: boolean;
    privateToPublic: boolean;
  }> {
    return await dualLayerPrivacyService.getAvailableTransactionTypes();
  }

  /**
   * Get workflow transaction flow information
   */
  public async getTransactionFlowInfo(): Promise<{
    currentMode: 'public' | 'private';
    availableFlows: Array<{
      type: string;
      description: string;
      privacyScore: number;
    }>;
  }> {
    const mode = this.getPrivacyMode();
    const availableTypes = await this.getAvailableTransactionTypes();
    
    const flows = [];
    
    if (availableTypes.publicToPublic) {
      flows.push({
        type: 'Public → Public',
        description: 'Normal Ethereum transfer (Alias Account)',
        privacyScore: 10
      });
    }
    
    if (availableTypes.publicToPrivate) {
      flows.push({
        type: 'Public → Private',
        description: 'Deposit to Shielded Pool via Alias',
        privacyScore: 70
      });
    }
    
    if (availableTypes.privateToPrivate) {
      flows.push({
        type: 'Private → Private',
        description: 'Shielded transaction with ZK proofs',
        privacyScore: 95
      });
    }
    
    if (availableTypes.privateToPublic) {
      flows.push({
        type: 'Private → Public',
        description: 'Withdrawal from Shielded Pool with ZK proof',
        privacyScore: 80
      });
    }
    
    return {
      currentMode: mode,
      availableFlows: flows
    };
  }

  /**
   * Scan for incoming private payments (view key scanning)
   */
  public async scanForIncomingPayments(): Promise<any[]> {
    console.log('🔍 Scanning for incoming private payments');
    // In real implementation, this would scan chain events and decrypt memos
    return [];
  }

  /**
   * Legacy methods for backward compatibility
   */

  public async getPrivacySettings(): Promise<any> {
    return {
      enablePrivacyMode: this.getPrivacyMode() === 'private',
      hideBalances: true,
      defaultMode: this.getPrivacyMode()
    };
  }

  public async saveSettings(): Promise<void> {
    // Settings are automatically saved by the dual-layer service
    console.log('✅ Settings saved');
  }

  public async clearPrivacyData(): Promise<{
    success: boolean;
    clearedItems: string[];
  }> {
    try {
      await AsyncStorage.multiRemove([
        'privacy_alias_accounts',
        'privacy_notes', 
        'privacy_transactions',
        'privacy_mode',
        'privacy_spend_key'
      ]);

      return {
        success: true,
        clearedItems: ['Alias Accounts', 'Privacy Notes', 'Transactions', 'Keys']
      };
    } catch (error) {
      console.error('❌ Failed to clear privacy data:', error);
      return {
        success: false,
        clearedItems: []
      };
    }
  }

  public getDefaultSettings(): any {
    return {
      enablePrivacyMode: false,
      hideBalances: false,
      defaultMode: 'public',
      autoCreateAliases: true,
      maxAliasesPerUser: 5,
      zkProofsEnabled: true,
      crossChainPrivacy: false,
    };
  }

  public async verifyZKProof(proof: ZKProofData): Promise<boolean> {
    // Mock verification for legacy compatibility
    return true;
  }

  public async getPrivacyPoolStats(): Promise<{
    totalDeposits: number;
    totalAnonymitySet: number;
    activeUsers: number;
    averageApy: string;
  }> {
    const notes = await this.getUserShieldedDeposits();
    
    return {
      totalDeposits: notes.length,
      totalAnonymitySet: 1000,
      activeUsers: Math.floor(Math.random() * 5000) + 1000,
      averageApy: '5.2%',
    };
  }

  /**
   * Get privacy state (legacy compatibility)
   */
  public async getPrivacyState(): Promise<{
    enabled: boolean;
    mode: 'public' | 'private';
    aliases: any[];
    shieldedBalance: string;
  }> {
    const aliases = await this.getUserAliases();
    const deposits = await this.getUserShieldedDeposits();
    const totalBalance = deposits.reduce((sum, deposit) => 
      sum + parseFloat(deposit.amount), 0
    );

    return {
      enabled: this.getPrivacyMode() === 'private',
      mode: this.getPrivacyMode(),
      aliases: aliases,
      shieldedBalance: totalBalance.toString()
    };
  }

  /**
   * Get user aliases (backward compatibility)
   */
  public async getUserAliases(): Promise<any[]> {
    try {
      const aliasAccounts = await dualLayerPrivacyService.getAliasAccounts();
      return Object.values(aliasAccounts).map(alias => ({
        address: alias.address,
        commitment: alias.commitment,
        isActive: alias.isActive,
        createdAt: alias.createdAt
      }));
    } catch (error) {
      console.error('Error getting user aliases:', error);
      return [];
    }
  }

  /**
   * Create alias (legacy method name)
   */
  public async createAlias(): Promise<{
    success: boolean;
    aliasAddress?: string;
    error?: string;
  }> {
    const result = await this.createAliasAccount();
    return {
      success: result.success,
      aliasAddress: result.aliasAccount?.address,
      error: result.error
    };
  }

  /**
   * Send private transaction (legacy compatibility)
   */
  public async sendPrivateTransaction(params: {
    to: string;
    amount: string;
    useShielded?: boolean;
  }): Promise<any> {
    try {
      if (params.useShielded) {
        return await this.sendShieldedTransaction({
          inputNoteIds: ['demo-note'],
          outputs: [{ recipient: params.to, amount: params.amount }]
        });
      } else {
        return await this.depositToPool({
          amount: params.amount,
          poolAddress: params.to // Use poolAddress instead of recipient
        });
      }
    } catch (error) {
      console.error('Error sending private transaction:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Send private transaction with alias (legacy compatibility)
   */
  public async sendPrivateTransactionWithAlias(params: {
    aliasAddress: string;
    to: string;
    amount: string;
  }): Promise<any> {
    return await this.sendPrivateTransaction({
      to: params.to,
      amount: params.amount,
      useShielded: true
    });
  }

  /**
   * Enable dual layer mode (legacy compatibility)
   */
  public async enableDualLayerMode(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.enablePrivacyMode();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Disable privacy mode (legacy compatibility)
   */
  public async disablePrivacyMode(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Update internal state by setting to public mode
      await AsyncStorage.setItem('privacy_mode', 'public');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

// Export singleton instance for backward compatibility
export const privacyService = PrivacyService.getInstance();

// Also export the class as default
export default PrivacyService;
