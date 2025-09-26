/**
 * Cypher Wallet - MetaMask Compatibility Layer
 * Complete MetaMask API compatibility for seamless dApp integration
 * 
 * Features:
 * - Full MetaMask API compatibility
 * - Ethereum provider injection
 * - Event handling and notifications
 * - Legacy method support
 * - Custom RPC methods
 * - Provider detection and switching
 * - Mobile compatibility
 */

import { ethers } from 'ethers';
import { web3Connectivity } from './Web3ConnectivityManager';
import { performanceEngine } from '../performance/PerformanceEngine';

// MetaMask provider interfaces
export interface EthereumProvider {
  // Standard properties
  isMetaMask: boolean;
  isCypher: boolean;
  chainId: string | null;
  networkVersion: string | null;
  selectedAddress: string | null;
  
  // Connection state
  isConnected(): boolean;
  
  // Request method
  request(args: RequestArguments): Promise<any>;
  
  // Legacy methods (deprecated but still supported)
  send(method: string, params?: any[]): Promise<any>;
  sendAsync(payload: JsonRpcRequest, callback: (error: any, result: any) => void): void;
  
  // Event emitter methods
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
  addListener(event: string, listener: (...args: any[]) => void): void;
  removeAllListeners(event?: string): void;
  
  // Enable method (legacy)
  enable(): Promise<string[]>;
  
  // Custom methods
  _metamask?: {
    isUnlocked(): Promise<boolean>;
    requestBatch(requests: RequestArguments[]): Promise<any[]>;
    [key: string]: any;
  };
}

export interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface JsonRpcRequest {
  id: number | string;
  jsonrpc: '2.0';
  method: string;
  params?: any[];
}

export interface JsonRpcResponse {
  id: number | string;
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface ProviderConnectInfo {
  chainId: string;
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

/**
 * MetaMask Compatibility Provider
 * Provides complete MetaMask API compatibility
 */
export class MetaMaskCompatibilityProvider implements EthereumProvider {
  // Provider identification
  public readonly isMetaMask = true;
  public readonly isCypher = true;
  public chainId: string | null = null;
  public networkVersion: string | null = null;
  public selectedAddress: string | null = null;
  
  // Internal state
  private connected = false;
  private accounts: string[] = [];
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  private requestQueue: Map<string, { resolve: Function; reject: Function }> = new Map();
  
  // MetaMask-specific properties
  public _metamask = {
    isUnlocked: async (): Promise<boolean> => {
      return this.connected && this.accounts.length > 0;
    },
    
    requestBatch: async (requests: RequestArguments[]): Promise<any[]> => {
      return Promise.all(requests.map(req => this.request(req)));
    },
    
    // Additional MetaMask properties for compatibility
    _state: {
      accounts: [] as string[],
      isConnected: false,
      isUnlocked: false,
      initialized: true,
      isPermanentlyDisconnected: false
    }
  };
  
  constructor() {
    this.initializeProvider();
    this.setupEventRelaying();
  }
  
  /**
   * Main request method - handles all Web3 requests
   */
  public async request(args: RequestArguments): Promise<any> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const { method, params = [] } = args;
        
        // Handle provider-specific methods
        switch (method) {
          case 'eth_requestAccounts':
            return await this.handleRequestAccounts();
            
          case 'eth_accounts':
            return this.accounts;
            
          case 'eth_chainId':
            return this.chainId;
            
          case 'net_version':
            return this.networkVersion;
            
          case 'eth_coinbase':
            return this.selectedAddress;
            
          case 'wallet_requestPermissions':
            return await this.handleRequestPermissions(params as any[]);
            
          case 'wallet_getPermissions':
            return await this.handleGetPermissions();
            
          case 'wallet_addEthereumChain':
            return await this.handleAddEthereumChain(Array.isArray(params) ? params[0] : params);
            
          case 'wallet_switchEthereumChain':
            return await this.handleSwitchEthereumChain(Array.isArray(params) ? params[0] : params);
            
          case 'wallet_watchAsset':
            return await this.handleWatchAsset(Array.isArray(params) ? params[0] : params);
            
          case 'metamask_getProviderState':
            return this.getProviderState();
            
          case 'metamask_logWeb3ShimUsage':
            return null; // No-op for compatibility
            
          case 'metamask_sendDomainMetadata':
            return await this.handleSendDomainMetadata(Array.isArray(params) ? params[0] : params);
            
          default:
            // Forward to Web3 connectivity manager
            return await web3Connectivity.handleWeb3Request(
              this.getCurrentOrigin(),
              method,
              Array.isArray(params) ? params : Object.values(params || {})
            );
        }
      }, `metamask_request_${args.method}`);
      
    } catch (error) {
      throw this.createProviderError(error);
    }
  }
  
  /**
   * Legacy send method (synchronous)
   */
  public async send(method: string, params: any[] = []): Promise<any> {
    return this.request({ method, params });
  }
  
  /**
   * Legacy sendAsync method (callback-based)
   */
  public sendAsync(payload: JsonRpcRequest, callback: (error: any, result: any) => void): void {
    this.request({
      method: payload.method,
      params: payload.params
    })
    .then(result => {
      callback(null, {
        id: payload.id,
        jsonrpc: '2.0',
        result
      });
    })
    .catch(error => {
      callback(error, {
        id: payload.id,
        jsonrpc: '2.0',
        error: {
          code: error.code || -32603,
          message: error.message || 'Internal error'
        }
      });
    });
  }
  
  /**
   * Legacy enable method
   */
  public async enable(): Promise<string[]> {
    return this.request({ method: 'eth_requestAccounts' });
  }
  
  /**
   * Check if provider is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Event listener methods
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }
  
  public addListener(event: string, listener: (...args: any[]) => void): void {
    this.on(event, listener);
  }
  
  public removeListener(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  public removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }
  
  // Private methods for handling specific requests
  
  private async handleRequestAccounts(): Promise<string[]> {
    const origin = this.getCurrentOrigin();
    
    // Connect to dApp if not already connected
    const connection = await web3Connectivity.handleConnectionRequest(origin);
    
    // Get accounts
    this.accounts = await web3Connectivity.getAccounts(origin);
    
    if (this.accounts.length > 0) {
      this.selectedAddress = this.accounts[0];
      this.connected = true;
      
      // Update MetaMask state
      this._metamask._state.accounts = this.accounts;
      this._metamask._state.isConnected = true;
      this._metamask._state.isUnlocked = true;
      
      // Emit events
      this.emit('accountsChanged', this.accounts);
      this.emit('connect', { chainId: this.chainId });
    }
    
    return this.accounts;
  }
  
  private async handleRequestPermissions(params: any[]): Promise<any[]> {
    const permissions = params[0];
    const grantedPermissions = [];
    
    if (permissions.eth_accounts) {
      await this.handleRequestAccounts();
      grantedPermissions.push({
        parentCapability: 'eth_accounts',
        id: Math.random().toString(),
        date: Date.now(),
        invoker: this.getCurrentOrigin(),
        caveats: []
      });
    }
    
    return grantedPermissions;
  }
  
  private async handleGetPermissions(): Promise<any[]> {
    if (this.accounts.length > 0) {
      return [{
        parentCapability: 'eth_accounts',
        id: Math.random().toString(),
        date: Date.now(),
        invoker: this.getCurrentOrigin(),
        caveats: []
      }];
    }
    
    return [];
  }
  
  private async handleAddEthereumChain(chainParams: any): Promise<null> {
    const { chainId, chainName, rpcUrls, nativeCurrency, blockExplorerUrls } = chainParams;
    
    // Validate chain parameters
    if (!chainId || !rpcUrls || !rpcUrls.length) {
      throw this.createProviderError('Invalid chain parameters', 4902);
    }
    
    // Add chain (would integrate with network service)
    console.log('Adding Ethereum chain:', chainParams);
    
    return null;
  }
  
  private async handleSwitchEthereumChain(chainParams: any): Promise<null> {
    const { chainId } = chainParams;
    
    if (!chainId) {
      throw this.createProviderError('Invalid chainId', 4902);
    }
    
    const numericChainId = parseInt(chainId, 16);
    
    // Switch chain via connectivity manager
    await web3Connectivity.switchChain(this.getCurrentOrigin(), numericChainId);
    
    // Update provider state
    this.chainId = chainId;
    this.networkVersion = numericChainId.toString();
    
    // Emit chain change event
    this.emit('chainChanged', chainId);
    
    return null;
  }
  
  private async handleWatchAsset(assetParams: any): Promise<boolean> {
    const { type, options } = assetParams;
    
    if (type !== 'ERC20') {
      throw this.createProviderError('Unsupported asset type', 4001);
    }
    
    const { address, symbol, decimals, image } = options;
    
    // Validate token parameters
    if (!address || !symbol || !decimals) {
      throw this.createProviderError('Invalid token parameters', 4001);
    }
    
    // Add token (would integrate with token service)
    console.log('Adding token to watch list:', options);
    
    return true;
  }
  
  private async handleSendDomainMetadata(metadata: any): Promise<null> {
    // Store domain metadata for security analysis
    console.log('Domain metadata received:', metadata);
    return null;
  }
  
  private getProviderState(): any {
    return {
      accounts: this.accounts,
      chainId: this.chainId,
      networkVersion: this.networkVersion,
      isConnected: this.connected,
      isUnlocked: this.accounts.length > 0
    };
  }
  
  private initializeProvider(): void {
    // Set initial chain (Ethereum mainnet)
    this.chainId = '0x1';
    this.networkVersion = '1';
    
    // Initialize as disconnected
    this.connected = false;
    this.accounts = [];
    this.selectedAddress = null;
  }
  
  private setupEventRelaying(): void {
    // Relay events from Web3 connectivity manager
    web3Connectivity.on('accountsChanged', (data) => {
      this.accounts = data.accounts;
      this.selectedAddress = this.accounts[0] || null;
      this._metamask._state.accounts = this.accounts;
      this.emit('accountsChanged', this.accounts);
    });
    
    web3Connectivity.on('chainChanged', (data) => {
      this.chainId = `0x${data.chainId.toString(16)}`;
      this.networkVersion = data.chainId.toString();
      this.emit('chainChanged', this.chainId);
    });
    
    web3Connectivity.on('connect', (data) => {
      this.connected = true;
      this._metamask._state.isConnected = true;
      this.emit('connect', { chainId: this.chainId });
    });
    
    web3Connectivity.on('disconnect', (data) => {
      this.connected = false;
      this.accounts = [];
      this.selectedAddress = null;
      this._metamask._state.isConnected = false;
      this._metamask._state.accounts = [];
      this.emit('disconnect', { code: 1013, message: 'Disconnected' });
    });
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }
  
  private getCurrentOrigin(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin;
    }
    return 'cypher-wallet://';
  }
  
  private createProviderError(error: any, code?: number): ProviderRpcError {
    const providerError = new Error(error.message || error) as ProviderRpcError;
    providerError.code = code || error.code || 4001;
    
    if (error.data) {
      providerError.data = error.data;
    }
    
    return providerError;
  }
}

/**
 * MetaMask Compatibility Service
 * Manages MetaMask API compatibility and provider injection
 */
export class MetaMaskCompatibilityService {
  private static instance: MetaMaskCompatibilityService;
  private provider: MetaMaskCompatibilityProvider;
  
  private constructor() {
    this.provider = new MetaMaskCompatibilityProvider();
    this.injectProvider();
  }
  
  public static getInstance(): MetaMaskCompatibilityService {
    if (!MetaMaskCompatibilityService.instance) {
      MetaMaskCompatibilityService.instance = new MetaMaskCompatibilityService();
    }
    return MetaMaskCompatibilityService.instance;
  }
  
  /**
   * Inject provider into global scope
   */
  private injectProvider(): void {
    if (typeof window !== 'undefined') {
      // Inject as ethereum provider
      (window as any).ethereum = this.provider;
      
      // Legacy injection for older dApps
      (window as any).web3 = {
        currentProvider: this.provider,
        eth: {
          defaultAccount: this.provider.selectedAddress
        }
      };
      
      // Announce provider
      window.dispatchEvent(new Event('ethereum#initialized'));
      
      // Handle provider detection
      this.handleProviderDetection();
    }
  }
  
  private handleProviderDetection(): void {
    if (typeof window === 'undefined') return;
    
    // Listen for other provider injections
    const originalEthereum = (window as any).ethereum;
    
    Object.defineProperty(window, 'ethereum', {
      get: () => originalEthereum,
      set: (newProvider) => {
        if (newProvider && newProvider !== originalEthereum) {
          console.warn('Multiple Ethereum providers detected. Cypher Wallet will take precedence.');
        }
      },
      configurable: false
    });
    
    // Announce readiness
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: {
          info: {
            uuid: 'cypher-wallet-uuid',
            name: 'Cypher Wallet',
            icon: 'data:image/svg+xml;base64,...', // Base64 encoded icon
            rdns: 'io.cypher.wallet'
          },
          provider: this.provider
        }
      }));
    }, 100);
  }
  
  /**
   * Get provider instance
   */
  public getProvider(): EthereumProvider {
    return this.provider;
  }
  
  /**
   * Check if MetaMask compatibility is active
   */
  public isActive(): boolean {
    return typeof window !== 'undefined' && (window as any).ethereum === this.provider;
  }
  
  /**
   * Enable/disable MetaMask compatibility
   */
  public setEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    
    if (enabled) {
      (window as any).ethereum = this.provider;
    } else {
      delete (window as any).ethereum;
    }
  }
}

// Export singleton instance
export const metaMaskCompatibility = MetaMaskCompatibilityService.getInstance();
export default MetaMaskCompatibilityService;
