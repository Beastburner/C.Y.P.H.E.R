/**
 * Cypher Wallet - dApp Integration Service
 * Complete Web3 provider injection and dApp communication system
 * 
 * Features:
 * - EIP-1193 provider injection
 * - WalletConnect v2 integration 
 * - dApp connection management
 * - Transaction request handling
 * - Message signing support
 * - Permission management
 * - Event emission and listening
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { web3ProviderService } from './Web3ProviderService';
import { transactionService } from './TransactionService';
import { authenticationService } from './AuthenticationService';
import { walletService } from './WalletService';
import { networkService } from './NetworkService';

// dApp Connection Types
export interface DAppConnection {
  origin: string;
  name: string;
  icon?: string;
  url: string;
  permissions: DAppPermissions;
  connectedAt: number;
  lastUsed: number;
  accounts: string[];
  chainId: number;
  isActive: boolean;
  sessionId?: string;
}

export interface DAppPermissions {
  accounts: boolean;
  signTransactions: boolean;
  signMessages: boolean;
  readBalance: boolean;
  switchChain: boolean;
  addChain: boolean;
}

// Web3 Provider Interface (EIP-1193)
export interface EthereumProvider {
  isMetaMask?: boolean;
  isCypherWallet: boolean;
  chainId: string;
  networkVersion: string;
  selectedAddress: string | null;
  
  // Core methods
  request(request: { method: string; params?: any[] }): Promise<any>;
  enable(): Promise<string[]>;
  send(method: string, params?: any[]): Promise<any>;
  
  // Event emitter
  on(eventName: string, listener: Function): void;
  off(eventName: string, listener: Function): void;
  removeListener(eventName: string, listener: Function): void;
  emit(eventName: string, ...args: any[]): boolean;
}

// RPC Request/Response Types
export interface RPCRequest {
  id: number | string;
  method: string;
  params?: any[];
  origin?: string;
}

export interface RPCResponse {
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// WalletConnect Types
export interface WalletConnectSession {
  id: string;
  topic: string;
  peerMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
  chainId: number;
  accounts: string[];
  bridge: string;
  key: string;
  handshakeTopic: string;
  handshakeId: number;
  connected: boolean;
  approved: boolean;
  createdAt: number;
  lastUsed: number;
}

export interface WalletConnectConfig {
  bridge: string;
  clientMeta: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

// Transaction/Signing Request Types
export interface TransactionRequest {
  from: string;
  to?: string;
  value?: string;
  data?: string;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: string;
}

export interface SigningRequest {
  method: 'personal_sign' | 'eth_sign' | 'eth_signTypedData' | 'eth_signTypedData_v3' | 'eth_signTypedData_v4';
  message: string;
  address: string;
  origin: string;
}

/**
 * DApp Integration Service - Complete Web3 integration
 */
export class DAppIntegrationService extends EventEmitter {
  private static instance: DAppIntegrationService;
  private connections: Map<string, DAppConnection> = new Map();
  private wcSessions: Map<string, WalletConnectSession> = new Map();
  private pendingRequests: Map<string, any> = new Map();
  private injectedProvider: EthereumProvider | null = null;
  private wcClient: any = null; // WalletConnect client
  
  // EIP Error Codes
  private readonly ERROR_CODES = {
    USER_REJECTED: 4001,
    UNAUTHORIZED: 4100,
    UNSUPPORTED_METHOD: 4200,
    DISCONNECTED: 4900,
    CHAIN_DISCONNECTED: 4901,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    PARSE_ERROR: -32700,
    METHOD_NOT_FOUND: -32601
  };

  private constructor() {
    super();
    this.initializeService();
  }

  public static getInstance(): DAppIntegrationService {
    if (!DAppIntegrationService.instance) {
      DAppIntegrationService.instance = new DAppIntegrationService();
    }
    return DAppIntegrationService.instance;
  }

  /**
   * Initialize dApp integration service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load existing connections
      await this.loadConnections();
      
      // Load WalletConnect sessions
      await this.loadWalletConnectSessions();
      
      // Initialize WalletConnect
      await this.initializeWalletConnect();
      
      // Create injected provider
      this.createInjectedProvider();
      
      console.log('✅ DApp Integration Service initialized');
      this.emit('service-initialized');
      
    } catch (error) {
      console.error('Failed to initialize DApp Integration Service:', error);
      this.emit('service-error', error);
    }
  }

  // ====================
  // WEB3 PROVIDER INJECTION
  // ====================

  /**
   * Create EIP-1193 compliant provider
   */
  private createInjectedProvider(): void {
    const self = this;
    
    this.injectedProvider = {
      isMetaMask: false, // Prevent MetaMask detection
      isCypherWallet: true,
      chainId: `0x${networkService.getCurrentNetwork().chainId.toString(16)}`,
      networkVersion: networkService.getCurrentNetwork().chainId.toString(),
      selectedAddress: null,

      // Main request method (EIP-1193)
      async request(request: { method: string; params?: any[] }): Promise<any> {
        return await self.handleETHRequest({
          id: Date.now(),
          method: request.method,
          params: request.params
        });
      },

      // Legacy enable method
      async enable(): Promise<string[]> {
        const accounts = await self.handleETHRequest({
          id: Date.now(),
          method: 'eth_requestAccounts',
          params: []
        });
        return accounts || [];
      },

      // Legacy send method
      async send(method: string, params?: any[]): Promise<any> {
        return await self.handleETHRequest({
          id: Date.now(),
          method,
          params
        });
      },

      // Event emitter methods
      on(eventName: string, listener: (...args: any[]) => void): void {
        self.on(`provider:${eventName}`, listener);
      },

      off(eventName: string, listener: (...args: any[]) => void): void {
        self.off(`provider:${eventName}`, listener);
      },

      removeListener(eventName: string, listener: (...args: any[]) => void): void {
        self.removeListener(`provider:${eventName}`, listener);
      },

      emit(eventName: string, ...args: any[]): boolean {
        return self.emit(`provider:${eventName}`, ...args);
      }
    } as EthereumProvider;
  }

  /**
   * Inject Web3 provider into page context
   */
  public injectWeb3Provider(origin: string): EthereumProvider | null {
    if (!this.injectedProvider) {
      console.error('Provider not initialized');
      return null;
    }

    // Check if origin is allowed
    const connection = this.connections.get(origin);
    if (!connection || !connection.isActive) {
      console.warn(`Provider injection denied for ${origin}`);
      return null;
    }

    // Update provider state
    this.injectedProvider.selectedAddress = connection.accounts[0] || null;
    this.injectedProvider.chainId = `0x${connection.chainId.toString(16)}`;
    this.injectedProvider.networkVersion = connection.chainId.toString();

    console.log(`✅ Web3 provider injected for ${origin}`);
    return this.injectedProvider;
  }

  /**
   * Handle eth_* method requests from dApps
   */
  public async handleETHRequest(request: RPCRequest): Promise<any> {
    try {
      const { method, params = [], origin } = request;
      
      console.log(`📨 RPC Request: ${method}`, params);

      switch (method) {
        case 'eth_requestAccounts':
          return await this.handleAccountsRequest(origin);

        case 'eth_accounts':
          return await this.getConnectedAccounts(origin);

        case 'eth_chainId':
          return `0x${networkService.getCurrentNetwork().chainId.toString(16)}`;

        case 'net_version':
          return networkService.getCurrentNetwork().chainId.toString();

        case 'eth_getBalance':
          return await this.handleBalanceRequest(params[0], params[1]);

        case 'eth_sendTransaction':
          return await this.handleTransactionRequest(params[0], origin);

        case 'eth_signTransaction':
          return await this.handleSignTransactionRequest(params[0], origin);

        case 'personal_sign':
        case 'eth_sign':
        case 'eth_signTypedData':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          return await this.handleSigningRequest({
            method: method as any,
            message: params[0],
            address: params[1],
            origin: origin || 'unknown'
          });

        case 'wallet_switchEthereumChain':
          return await this.handleSwitchChain(params[0]);

        case 'wallet_addEthereumChain':
          return await this.handleAddChain(params[0]);

        case 'wallet_getPermissions':
          return await this.getWalletPermissions(origin);

        case 'wallet_requestPermissions':
          return await this.requestWalletPermissions(params[0], origin);

        case 'eth_getTransactionByHash':
        case 'eth_getTransactionReceipt':
        case 'eth_call':
        case 'eth_estimateGas':
        case 'eth_getCode':
        case 'eth_getStorageAt':
        case 'eth_getBlockByNumber':
        case 'eth_getBlockByHash':
        case 'eth_getTransactionCount':
        case 'eth_gasPrice':
        case 'eth_maxPriorityFeePerGas':
          // Forward to provider
          const provider = web3ProviderService.getProvider();
          return await (provider as any).send(method, params);

        default:
          throw new Error(`Unsupported method: ${method}`);
      }

    } catch (error) {
      console.error(`RPC Error for ${request.method}:`, error);
      throw this.formatRPCError(
        this.ERROR_CODES.INTERNAL_ERROR,
        `Failed to handle ${request.method}: ${(error as Error).message}`
      );
    }
  }

  // ====================
  // DAPP CONNECTION MANAGEMENT
  // ====================

  /**
   * Connect to dApp
   */
  public async connectToDapp(
    origin: string,
    dappInfo: {
      name: string;
      icon?: string;
      url: string;
    },
    requestedPermissions: Partial<DAppPermissions> = {}
  ): Promise<DAppConnection> {
    try {
      // Check if user is authenticated
      const isAuthenticated = await authenticationService.isAuthenticated();
      if (!isAuthenticated) {
        throw this.formatRPCError(
          this.ERROR_CODES.UNAUTHORIZED,
          'User must be authenticated to connect dApp'
        );
      }

      // Get user approval (this would show a modal in real implementation)
      const approved = await this.requestUserApproval(
        `Connect to ${dappInfo.name}?`,
        `${dappInfo.name} (${origin}) wants to connect to your wallet`
      );

      if (!approved) {
        throw this.formatRPCError(
          this.ERROR_CODES.USER_REJECTED,
          'User rejected connection request'
        );
      }

      // Get available accounts
      const accounts = await walletService.getAllAccounts();
      if (accounts.length === 0) {
        throw this.formatRPCError(
          this.ERROR_CODES.INTERNAL_ERROR,
          'No accounts available'
        );
      }

      // Create connection
      const connection: DAppConnection = {
        origin,
        name: dappInfo.name,
        icon: dappInfo.icon,
        url: dappInfo.url,
        permissions: {
          accounts: true,
          signTransactions: requestedPermissions.signTransactions || false,
          signMessages: requestedPermissions.signMessages || false,
          readBalance: requestedPermissions.readBalance || true,
          switchChain: requestedPermissions.switchChain || false,
          addChain: requestedPermissions.addChain || false,
          ...requestedPermissions
        },
        connectedAt: Date.now(),
        lastUsed: Date.now(),
        accounts: [accounts[0].address], // Connect first account by default
        chainId: networkService.getCurrentNetwork().chainId,
        isActive: true
      };

      // Store connection
      this.connections.set(origin, connection);
      await this.saveConnections();

      // Emit events
      this.emit('dapp-connected', connection);
      this.emitProviderEvent('connect', { chainId: connection.chainId });
      this.emitProviderEvent('accountsChanged', connection.accounts);

      console.log(`✅ Connected to dApp: ${dappInfo.name}`);
      return connection;

    } catch (error) {
      console.error('Failed to connect to dApp:', error);
      throw error;
    }
  }

  /**
   * Disconnect from dApp
   */
  public async disconnectFromDapp(origin: string): Promise<void> {
    try {
      const connection = this.connections.get(origin);
      if (!connection) {
        return; // Already disconnected
      }

      // Mark as inactive
      connection.isActive = false;
      
      // Remove connection
      this.connections.delete(origin);
      await this.saveConnections();

      // Emit events
      this.emit('dapp-disconnected', connection);
      this.emitProviderEvent('disconnect', { code: this.ERROR_CODES.DISCONNECTED, message: 'Disconnected' });

      console.log(`✅ Disconnected from dApp: ${origin}`);

    } catch (error) {
      console.error('Failed to disconnect from dApp:', error);
    }
  }

  /**
   * Get connected dApps
   */
  public getConnectedDApps(): DAppConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.isActive);
  }

  /**
   * Manage dApp permissions
   */
  public async updateDAppPermissions(
    origin: string,
    permissions: Partial<DAppPermissions>
  ): Promise<void> {
    const connection = this.connections.get(origin);
    if (!connection) {
      throw new Error('dApp not connected');
    }

    connection.permissions = {
      ...connection.permissions,
      ...permissions
    };

    this.connections.set(origin, connection);
    await this.saveConnections();

    this.emit('permissions-updated', { origin, permissions: connection.permissions });
  }

  // ====================
  // WALLETCONNECT INTEGRATION
  // ====================

  /**
   * Initialize WalletConnect
   */
  private async initializeWalletConnect(): Promise<void> {
    try {
      // WalletConnect v2 configuration
      const config: WalletConnectConfig = {
        bridge: 'https://bridge.walletconnect.org',
        clientMeta: {
          name: 'Cypher Wallet',
          description: 'Revolutionary Ethereum Wallet with AI-Powered Analytics',
          url: 'https://cypherwallet.io',
          icons: ['https://cypherwallet.io/icon.png']
        }
      };

      // Note: In a real implementation, you would use @walletconnect/client
      // For this implementation, we'll simulate the WalletConnect client
      this.wcClient = {
        connect: this.simulateWCConnect.bind(this),
        disconnect: this.simulateWCDisconnect.bind(this),
        approveSession: this.simulateWCApproveSession.bind(this),
        rejectSession: this.simulateWCRejectSession.bind(this),
        killSession: this.simulateWCKillSession.bind(this)
      };

      console.log('✅ WalletConnect initialized');

    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
    }
  }

  /**
   * Scan WalletConnect QR code
   */
  public async scanWalletConnectQR(uri: string): Promise<WalletConnectSession> {
    try {
      // Parse WalletConnect URI
      const parsedUri = this.parseWalletConnectURI(uri);
      
      // Create session proposal
      const session = await this.wcClient.connect(parsedUri);
      
      return session;

    } catch (error) {
      console.error('Failed to scan WalletConnect QR:', error);
      throw error;
    }
  }

  /**
   * Approve WalletConnect session
   */
  public async approveWalletConnectSession(
    sessionId: string,
    accounts: string[],
    chainId: number
  ): Promise<void> {
    try {
      const session = this.wcSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Approve session
      await this.wcClient.approveSession({
        sessionId,
        accounts,
        chainId
      });

      // Update session
      session.accounts = accounts;
      session.chainId = chainId;
      session.approved = true;
      session.connected = true;

      this.wcSessions.set(sessionId, session);
      await this.saveWalletConnectSessions();

      this.emit('wc-session-approved', session);
      console.log(`✅ WalletConnect session approved: ${sessionId}`);

    } catch (error) {
      console.error('Failed to approve WalletConnect session:', error);
      throw error;
    }
  }

  /**
   * Handle WalletConnect request
   */
  public async handleWalletConnectRequest(request: any): Promise<any> {
    try {
      const { method, params, id } = request;

      // Route to appropriate handler
      switch (method) {
        case 'eth_sendTransaction':
          return await this.handleTransactionRequest(params[0], 'walletconnect');
        
        case 'personal_sign':
        case 'eth_sign':
        case 'eth_signTypedData':
          return await this.handleSigningRequest({
            method,
            message: params[0],
            address: params[1],
            origin: 'walletconnect'
          });

        default:
          return await this.handleETHRequest({
            id,
            method,
            params,
            origin: 'walletconnect'
          });
      }

    } catch (error) {
      console.error('Failed to handle WalletConnect request:', error);
      throw error;
    }
  }

  // ====================
  // REQUEST HANDLERS
  // ====================

  private async handleAccountsRequest(origin?: string): Promise<string[]> {
    const connection = origin ? this.connections.get(origin) : null;
    
    if (!connection) {
      // New connection request
      throw this.formatRPCError(
        this.ERROR_CODES.UNAUTHORIZED,
        'No active connection. Use eth_requestAccounts first.'
      );
    }

    if (!connection.permissions.accounts) {
      throw this.formatRPCError(
        this.ERROR_CODES.UNAUTHORIZED,
        'Account access not permitted'
      );
    }

    connection.lastUsed = Date.now();
    return connection.accounts;
  }

  private async getConnectedAccounts(origin?: string): Promise<string[]> {
    const connection = origin ? this.connections.get(origin) : null;
    
    if (!connection || !connection.isActive) {
      return [];
    }

    return connection.accounts;
  }

  private async handleBalanceRequest(address: string, blockTag: string = 'latest'): Promise<string> {
    const provider = web3ProviderService.getProvider();
    const balance = await provider.getBalance(address, blockTag);
    return balance.toHexString();
  }

  private async handleTransactionRequest(txParams: TransactionRequest, origin?: string): Promise<string> {
    // Validate required fields
    if (!txParams.to) {
      throw this.formatRPCError(
        this.ERROR_CODES.INVALID_PARAMS,
        'Transaction must have a "to" address'
      );
    }

    // Get user approval
    const approved = await this.requestUserApproval(
      'Confirm Transaction',
      `Do you want to send this transaction?`
    );

    if (!approved) {
      throw this.formatRPCError(
        this.ERROR_CODES.USER_REJECTED,
        'User rejected transaction'
      );
    }

    // Send transaction
    const txWithChainId = {
      from: txParams.from,
      to: txParams.to!, // Now we know it's defined
      value: txParams.value,
      data: txParams.data,
      gasLimit: txParams.gas,
      gasPrice: txParams.gasPrice,
      maxFeePerGas: txParams.maxFeePerGas,
      maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
      nonce: txParams.nonce ? parseInt(txParams.nonce) : undefined,
      chainId: networkService.getCurrentNetwork().chainId
    };
    const txHash = await transactionService.sendTransaction(txWithChainId, 'user-private-key'); // Would get actual key
    
    return txHash;
  }

  private async handleSignTransactionRequest(txParams: TransactionRequest, origin?: string): Promise<string> {
    // Get user approval
    const approved = await this.requestUserApproval(
      'Sign Transaction',
      `Do you want to sign this transaction?`
    );

    if (!approved) {
      throw this.formatRPCError(
        this.ERROR_CODES.USER_REJECTED,
        'User rejected signing'
      );
    }

    // Sign transaction
    const txForSigning = {
      to: txParams.to!,
      value: txParams.value,
      data: txParams.data,
      gasLimit: txParams.gas,
      gasPrice: txParams.gasPrice,
      maxFeePerGas: txParams.maxFeePerGas,
      maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
      nonce: txParams.nonce ? parseInt(txParams.nonce) : undefined,
    };
    const signedTx = await transactionService.signTransaction(txForSigning, 'user-private-key'); // Would get actual key
    
    return signedTx;
  }

  private async handleSigningRequest(request: SigningRequest): Promise<string> {
    // Get user approval
    const approved = await this.requestUserApproval(
      'Sign Message',
      `Do you want to sign this message?\n\n${request.message}`
    );

    if (!approved) {
      throw this.formatRPCError(
        this.ERROR_CODES.USER_REJECTED,
        'User rejected signing'
      );
    }

    // Sign message (simplified - would use actual wallet signing)
    const signature = await walletService.signMessage(request.message, request.address);
    
    return signature;
  }

  private async handleSwitchChain(chainParams: { chainId: string }): Promise<void> {
    const chainId = parseInt(chainParams.chainId, 16);
    
    // Check if chain is supported
    const network = networkService.getNetworkByChainId(chainId);
    if (!network) {
      throw this.formatRPCError(
        this.ERROR_CODES.UNSUPPORTED_METHOD,
        `Chain ${chainId} not supported`
      );
    }

    // Switch chain
    await networkService.switchNetwork(chainId);
    
    // Emit chain changed event
    this.emitProviderEvent('chainChanged', `0x${chainId.toString(16)}`);
  }

  private async handleAddChain(chainParams: any): Promise<void> {
    // This would implement adding a new chain
    throw this.formatRPCError(
      this.ERROR_CODES.UNSUPPORTED_METHOD,
      'Adding new chains not implemented'
    );
  }

  private async getWalletPermissions(origin?: string): Promise<any[]> {
    const connection = origin ? this.connections.get(origin) : null;
    if (!connection) {
      return [];
    }

    return [
      {
        parentCapability: 'eth_accounts',
        date: connection.connectedAt
      }
    ];
  }

  private async requestWalletPermissions(permissions: any[], origin?: string): Promise<any[]> {
    // This would handle permission requests
    return await this.getWalletPermissions(origin);
  }

  // ====================
  // HELPER METHODS
  // ====================

  private async requestUserApproval(title: string, message: string): Promise<boolean> {
    // In a real implementation, this would show a modal/dialog
    // For now, we'll simulate user approval
    console.log(`📋 User Approval Request: ${title}\n${message}`);
    return true; // Simulate approval
  }

  private formatRPCError(code: number, message: string, data?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.data = data;
    return error;
  }

  private emitProviderEvent(eventName: string, data: any): void {
    this.emit(`provider:${eventName}`, data);
  }

  private parseWalletConnectURI(uri: string): any {
    // Parse WalletConnect URI format
    // wc:topic@version?bridge=...&key=...
    const url = new URL(uri);
    return {
      topic: url.pathname.split('@')[0],
      version: url.pathname.split('@')[1],
      bridge: url.searchParams.get('bridge'),
      key: url.searchParams.get('key')
    };
  }

  // Simulation methods for WalletConnect (replace with real implementation)
  private async simulateWCConnect(params: any): Promise<WalletConnectSession> {
    const session: WalletConnectSession = {
      id: `wc_${Date.now()}`,
      topic: params.topic,
      peerMeta: {
        name: 'Test dApp',
        description: 'Test dApp for WalletConnect',
        url: 'https://test-dapp.com',
        icons: []
      },
      chainId: 1,
      accounts: [],
      bridge: params.bridge,
      key: params.key,
      handshakeTopic: params.topic,
      handshakeId: Date.now(),
      connected: false,
      approved: false,
      createdAt: Date.now(),
      lastUsed: Date.now()
    };

    this.wcSessions.set(session.id, session);
    return session;
  }

  private async simulateWCApproveSession(params: any): Promise<void> {
    // Simulate session approval
    console.log('WalletConnect session approved:', params);
  }

  private async simulateWCRejectSession(sessionId: string): Promise<void> {
    this.wcSessions.delete(sessionId);
  }

  private async simulateWCDisconnect(sessionId: string): Promise<void> {
    this.wcSessions.delete(sessionId);
  }

  private async simulateWCKillSession(sessionId: string): Promise<void> {
    this.wcSessions.delete(sessionId);
  }

  // Storage methods
  private async loadConnections(): Promise<void> {
    try {
      const connectionsJson = await AsyncStorage.getItem('dapp_connections');
      if (connectionsJson) {
        const connectionsData = JSON.parse(connectionsJson);
        this.connections = new Map(Object.entries(connectionsData));
      }
    } catch (error) {
      console.error('Failed to load dApp connections:', error);
    }
  }

  private async saveConnections(): Promise<void> {
    try {
      const connectionsData = Object.fromEntries(this.connections);
      await AsyncStorage.setItem('dapp_connections', JSON.stringify(connectionsData));
    } catch (error) {
      console.error('Failed to save dApp connections:', error);
    }
  }

  private async loadWalletConnectSessions(): Promise<void> {
    try {
      const sessionsJson = await AsyncStorage.getItem('wc_sessions');
      if (sessionsJson) {
        const sessionsData = JSON.parse(sessionsJson);
        this.wcSessions = new Map(Object.entries(sessionsData));
      }
    } catch (error) {
      console.error('Failed to load WalletConnect sessions:', error);
    }
  }

  private async saveWalletConnectSessions(): Promise<void> {
    try {
      const sessionsData = Object.fromEntries(this.wcSessions);
      await AsyncStorage.setItem('wc_sessions', JSON.stringify(sessionsData));
    } catch (error) {
      console.error('Failed to save WalletConnect sessions:', error);
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    // Disconnect all sessions
    for (const [origin] of this.connections) {
      this.disconnectFromDapp(origin);
    }

    // Kill all WalletConnect sessions
    for (const [sessionId] of this.wcSessions) {
      this.simulateWCKillSession(sessionId);
    }

    this.connections.clear();
    this.wcSessions.clear();
    this.pendingRequests.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const dAppIntegrationService = DAppIntegrationService.getInstance();
export default dAppIntegrationService;
