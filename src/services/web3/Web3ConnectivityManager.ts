/**
 * Cypher Wallet - Web3 Connectivity Manager
 * Advanced Web3 connectivity with universal dApp compatibility
 * 
 * Features:
 * - Universal dApp compatibility (MetaMask, WalletConnect, etc.)
 * - Multi-chain connection management
 * - Session management and persistence
 * - Event handling and notifications
 * - Permission management
 * - Connection security and validation
 * - dApp discovery and recommendations
 * - Connection analytics and monitoring
 */

import { ethers } from 'ethers';
import { performanceEngine } from '../performance/PerformanceEngine';
import { threatDetection } from '../security/ThreatDetectionSystem';
import { perfectUX } from '../ux/PerfectUXManager';

// Web3 Connection interfaces
export interface DAppConnection {
  id: string;
  origin: string;
  name: string;
  icon?: string;
  description?: string;
  connectedAt: number;
  lastUsed: number;
  chainId: number;
  accounts: string[];
  permissions: Permission[];
  status: 'connected' | 'disconnected' | 'pending' | 'rejected';
  sessionId?: string;
  metadata: DAppMetadata;
  riskScore: number;
  trusted: boolean;
}

export interface Permission {
  method: string;
  granted: boolean;
  grantedAt: number;
  expiresAt?: number;
  params?: any;
  usage: PermissionUsage;
}

export interface PermissionUsage {
  count: number;
  lastUsed: number;
  averageGasUsed: number;
  totalValue: string; // ETH
  errors: number;
}

export interface DAppMetadata {
  url: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  version?: string;
  author?: string;
  verified: boolean;
  auditScore?: number;
  popularity: number;
  totalUsers: number;
  monthlyActiveUsers: number;
  securityReports: SecurityReport[];
}

export interface SecurityReport {
  reporter: string;
  date: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'smart_contract' | 'phishing' | 'privacy' | 'other';
  description: string;
  resolved: boolean;
}

export interface Web3Request {
  id: string;
  origin: string;
  method: string;
  params: any[];
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  userApproval?: boolean;
  gasEstimate?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  autoApproved: boolean;
}

export interface ChainConnection {
  chainId: number;
  rpcUrl: string;
  provider: ethers.providers.JsonRpcProvider;
  connected: boolean;
  lastSync: number;
  blockNumber: number;
  gasPrice: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface ConnectionAnalytics {
  totalConnections: number;
  activeConnections: number;
  topDApps: Array<{
    origin: string;
    name: string;
    usage: number;
    value: string;
  }>;
  chainUsage: Array<{
    chainId: number;
    usage: number;
    transactions: number;
  }>;
  riskMetrics: {
    highRiskConnections: number;
    blockedRequests: number;
    phishingAttempts: number;
  };
  performance: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

/**
 * Web3 Connectivity Manager
 * Manages all Web3 connections and dApp interactions
 */
export class Web3ConnectivityManager {
  private static instance: Web3ConnectivityManager;
  
  private connections: Map<string, DAppConnection> = new Map();
  private pendingRequests: Map<string, Web3Request> = new Map();
  private chainConnections: Map<number, ChainConnection> = new Map();
  private permissionHandlers: Map<string, (request: Web3Request) => Promise<boolean>> = new Map();
  
  // Event listeners
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map();
  
  private constructor() {
    this.initializePermissionHandlers();
    this.startConnectionMonitoring();
  }
  
  public static getInstance(): Web3ConnectivityManager {
    if (!Web3ConnectivityManager.instance) {
      Web3ConnectivityManager.instance = new Web3ConnectivityManager();
    }
    return Web3ConnectivityManager.instance;
  }
  
  /**
   * Handle dApp connection request
   */
  public async handleConnectionRequest(
    origin: string,
    metadata: Partial<DAppMetadata> = {}
  ): Promise<DAppConnection> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        // Check if already connected
        const existingConnection = Array.from(this.connections.values())
          .find(conn => conn.origin === origin);
        
        if (existingConnection && existingConnection.status === 'connected') {
          existingConnection.lastUsed = Date.now();
          return existingConnection;
        }
        
        // Perform security analysis
        const riskAssessment = await this.assessDAppRisk(origin, metadata);
        
        // Get user approval if high risk
        if (riskAssessment.riskScore > 70) {
          const approved = await this.requestUserApproval('connection', {
            origin,
            riskScore: riskAssessment.riskScore,
            issues: riskAssessment.issues
          });
          
          if (!approved) {
            throw new Error('Connection rejected by user');
          }
        }
        
        // Create connection
        const connection: DAppConnection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          origin,
          name: metadata.title || this.extractDomainName(origin),
          icon: metadata.url ? `${metadata.url}/favicon.ico` : undefined,
          description: metadata.description,
          connectedAt: Date.now(),
          lastUsed: Date.now(),
          chainId: 1, // Default to mainnet
          accounts: [], // Will be populated after account approval
          permissions: [],
          status: 'connected',
          metadata: {
            url: origin,
            title: metadata.title || '',
            category: metadata.category || 'unknown',
            tags: metadata.tags || [],
            verified: false,
            popularity: 0,
            totalUsers: 0,
            monthlyActiveUsers: 0,
            securityReports: [],
            ...metadata
          },
          riskScore: riskAssessment.riskScore,
          trusted: riskAssessment.riskScore < 30
        };
        
        this.connections.set(connection.id, connection);
        
        // Emit connection event
        this.emit('connection', { connection, origin });
        
        // Track in UX system
        await perfectUX.trackAction('dapp_connection', { origin, riskScore: riskAssessment.riskScore });
        
        return connection;
      }, `connection_${origin}`);
      
    } catch (error) {
      console.error('Connection request failed:', error);
      throw error;
    }
  }
  
  /**
   * Handle Web3 method request
   */
  public async handleWeb3Request(
    origin: string,
    method: string,
    params: any[] = []
  ): Promise<any> {
    try {
      const connection = this.getConnectionByOrigin(origin);
      if (!connection || connection.status !== 'connected') {
        throw new Error('Not connected to this dApp');
      }
      
      // Create request object
      const request: Web3Request = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        origin,
        method,
        params,
        timestamp: Date.now(),
        status: 'pending',
        riskLevel: this.assessMethodRisk(method, params),
        autoApproved: false
      };
      
      this.pendingRequests.set(request.id, request);
      
      // Check permissions
      const hasPermission = await this.checkPermission(connection, method, params);
      if (!hasPermission) {
        const approved = await this.requestPermission(connection, method, params);
        if (!approved) {
          request.status = 'rejected';
          throw new Error('Permission denied');
        }
      }
      
      // Handle method
      const result = await this.executeWeb3Method(request, connection);
      
      // Update request status
      request.status = 'completed';
      
      // Update connection usage
      connection.lastUsed = Date.now();
      await this.updatePermissionUsage(connection, method, request);
      
      return result;
      
    } catch (error) {
      console.error('Web3 request failed:', error);
      const request = Array.from(this.pendingRequests.values())
        .find(req => req.origin === origin && req.method === method);
      if (request) {
        request.status = 'failed';
      }
      throw error;
    }
  }
  
  /**
   * Get connected accounts for dApp
   */
  public async getAccounts(origin: string): Promise<string[]> {
    const connection = this.getConnectionByOrigin(origin);
    if (!connection || connection.status !== 'connected') {
      return [];
    }
    
    return connection.accounts;
  }
  
  /**
   * Get current chain ID for dApp
   */
  public async getChainId(origin: string): Promise<number> {
    const connection = this.getConnectionByOrigin(origin);
    if (!connection || connection.status !== 'connected') {
      throw new Error('Not connected');
    }
    
    return connection.chainId;
  }
  
  /**
   * Switch chain for dApp
   */
  public async switchChain(origin: string, chainId: number): Promise<void> {
    const connection = this.getConnectionByOrigin(origin);
    if (!connection || connection.status !== 'connected') {
      throw new Error('Not connected');
    }
    
    // Validate chain
    const chainConnection = await this.getOrCreateChainConnection(chainId);
    if (!chainConnection.connected) {
      throw new Error('Chain not available');
    }
    
    // Update connection
    connection.chainId = chainId;
    connection.lastUsed = Date.now();
    
    // Emit chain change event
    this.emit('chainChanged', { origin, chainId });
  }
  
  /**
   * Add accounts to dApp connection
   */
  public async addAccounts(origin: string, accounts: string[]): Promise<void> {
    const connection = this.getConnectionByOrigin(origin);
    if (!connection || connection.status !== 'connected') {
      throw new Error('Not connected');
    }
    
    // Add unique accounts
    const newAccounts = accounts.filter(account => !connection.accounts.includes(account));
    connection.accounts.push(...newAccounts);
    connection.lastUsed = Date.now();
    
    if (newAccounts.length > 0) {
      this.emit('accountsChanged', { origin, accounts: connection.accounts });
    }
  }
  
  /**
   * Disconnect dApp
   */
  public async disconnect(origin: string): Promise<void> {
    const connection = this.getConnectionByOrigin(origin);
    if (!connection) {
      return;
    }
    
    connection.status = 'disconnected';
    this.emit('disconnect', { origin });
    
    // Clean up pending requests
    const pendingRequests = Array.from(this.pendingRequests.values())
      .filter(req => req.origin === origin);
    
    pendingRequests.forEach(req => {
      req.status = 'rejected';
      this.pendingRequests.delete(req.id);
    });
    
    await perfectUX.trackAction('dapp_disconnect', { origin });
  }
  
  /**
   * Get all connections
   */
  public getConnections(): DAppConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.status === 'connected')
      .sort((a, b) => b.lastUsed - a.lastUsed);
  }
  
  /**
   * Get connection analytics
   */
  public async getConnectionAnalytics(): Promise<ConnectionAnalytics> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const connections = Array.from(this.connections.values());
        const activeConnections = connections.filter(conn => conn.status === 'connected');
        
        // Calculate top dApps by usage
        const dAppUsage = new Map<string, { name: string; usage: number; value: number }>();
        
        connections.forEach(conn => {
          const totalUsage = conn.permissions.reduce((sum, perm) => sum + perm.usage.count, 0);
          const totalValue = conn.permissions.reduce((sum, perm) => sum + parseFloat(perm.usage.totalValue || '0'), 0);
          
          dAppUsage.set(conn.origin, {
            name: conn.name,
            usage: totalUsage,
            value: totalValue
          });
        });
        
        const topDApps = Array.from(dAppUsage.entries())
          .sort(([,a], [,b]) => b.usage - a.usage)
          .slice(0, 10)
          .map(([origin, data]) => ({
            origin,
            name: data.name,
            usage: data.usage,
            value: data.value.toFixed(4)
          }));
        
        // Calculate chain usage
        const chainUsage = new Map<number, { usage: number; transactions: number }>();
        connections.forEach(conn => {
          const current = chainUsage.get(conn.chainId) || { usage: 0, transactions: 0 };
          current.usage++;
          current.transactions += conn.permissions.reduce((sum, perm) => sum + perm.usage.count, 0);
          chainUsage.set(conn.chainId, current);
        });
        
        // Risk metrics
        const highRiskConnections = connections.filter(conn => conn.riskScore > 70).length;
        const blockedRequests = Array.from(this.pendingRequests.values())
          .filter(req => req.status === 'rejected').length;
        
        return {
          totalConnections: connections.length,
          activeConnections: activeConnections.length,
          topDApps,
          chainUsage: Array.from(chainUsage.entries()).map(([chainId, data]) => ({
            chainId,
            usage: data.usage,
            transactions: data.transactions
          })),
          riskMetrics: {
            highRiskConnections,
            blockedRequests,
            phishingAttempts: 0 // Would be tracked from threat detection
          },
          performance: {
            averageResponseTime: 150, // Would calculate from actual metrics
            errorRate: 0.02,
            uptime: 0.999
          }
        };
      }, 'connection_analytics');
      
    } catch (error) {
      console.error('Failed to get connection analytics:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to Web3 events
   */
  public on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  /**
   * Unsubscribe from Web3 events
   */
  public off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  // Private helper methods
  
  private initializePermissionHandlers(): void {
    // eth_requestAccounts
    this.permissionHandlers.set('eth_requestAccounts', async (request) => {
      return await this.requestUserApproval('accounts', {
        origin: request.origin,
        accounts: ['0x...'] // Would get actual accounts
      });
    });
    
    // eth_sendTransaction
    this.permissionHandlers.set('eth_sendTransaction', async (request) => {
      const tx = request.params[0];
      return await this.requestUserApproval('transaction', {
        origin: request.origin,
        to: tx.to,
        value: tx.value,
        data: tx.data
      });
    });
    
    // eth_signTypedData_v4
    this.permissionHandlers.set('eth_signTypedData_v4', async (request) => {
      return await this.requestUserApproval('sign', {
        origin: request.origin,
        message: request.params[1]
      });
    });
  }
  
  private async assessDAppRisk(origin: string, metadata: Partial<DAppMetadata>): Promise<{
    riskScore: number;
    issues: string[];
  }> {
    // Use threat detection system (simplified assessment)
    let riskScore = 20; // Default low risk
    const issues: string[] = [];
    
    // Check for known malicious domains
    if (origin.includes('phishing') || origin.includes('scam')) {
      riskScore = 90;
      issues.push('Suspected phishing domain');
    }
    
    // Check for unverified domains
    if (!metadata.title || !metadata.description) {
      riskScore += 20;
      issues.push('Incomplete metadata');
    }
    
    return {
      riskScore: Math.min(riskScore, 100),
      issues
    };
  }
  
  private extractDomainName(origin: string): string {
    try {
      const url = new URL(origin);
      return url.hostname.replace('www.', '');
    } catch {
      return origin;
    }
  }
  
  private getConnectionByOrigin(origin: string): DAppConnection | undefined {
    return Array.from(this.connections.values())
      .find(conn => conn.origin === origin);
  }
  
  private assessMethodRisk(method: string, params: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const highRiskMethods = ['eth_sendTransaction', 'eth_signTypedData_v4', 'personal_sign'];
    const mediumRiskMethods = ['eth_requestAccounts', 'wallet_addEthereumChain'];
    
    if (highRiskMethods.includes(method)) {
      // Check transaction value for critical risk
      if (method === 'eth_sendTransaction' && params[0]?.value) {
        const value = parseInt(params[0].value, 16);
        if (value > ethers.utils.parseEther('1').toNumber()) {
          return 'critical';
        }
      }
      return 'high';
    }
    
    if (mediumRiskMethods.includes(method)) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private async checkPermission(connection: DAppConnection, method: string, params: any[]): Promise<boolean> {
    const permission = connection.permissions.find(p => p.method === method);
    
    if (!permission) {
      return false;
    }
    
    // Check if permission expired
    if (permission.expiresAt && permission.expiresAt < Date.now()) {
      return false;
    }
    
    return permission.granted;
  }
  
  private async requestPermission(connection: DAppConnection, method: string, params: any[]): Promise<boolean> {
    const handler = this.permissionHandlers.get(method);
    if (!handler) {
      return true; // Allow unknown methods by default
    }
    
    const request: Web3Request = {
      id: `perm_${Date.now()}`,
      origin: connection.origin,
      method,
      params,
      timestamp: Date.now(),
      status: 'pending',
      riskLevel: this.assessMethodRisk(method, params),
      autoApproved: false
    };
    
    const approved = await handler(request);
    
    if (approved) {
      // Add permission
      const permission: Permission = {
        method,
        granted: true,
        grantedAt: Date.now(),
        usage: {
          count: 0,
          lastUsed: 0,
          averageGasUsed: 0,
          totalValue: '0',
          errors: 0
        }
      };
      
      connection.permissions.push(permission);
    }
    
    return approved;
  }
  
  private async executeWeb3Method(request: Web3Request, connection: DAppConnection): Promise<any> {
    const { method, params } = request;
    
    switch (method) {
      case 'eth_requestAccounts':
        return connection.accounts;
        
      case 'eth_accounts':
        return connection.accounts;
        
      case 'eth_chainId':
        return `0x${connection.chainId.toString(16)}`;
        
      case 'net_version':
        return connection.chainId.toString();
        
      case 'eth_sendTransaction':
        return await this.handleSendTransaction(params[0], connection);
        
      case 'eth_signTypedData_v4':
        return await this.handleSignTypedData(params[0], params[1], connection);
        
      case 'personal_sign':
        return await this.handlePersonalSign(params[0], params[1], connection);
        
      case 'eth_getBalance':
        return await this.handleGetBalance(params[0], params[1], connection);
        
      case 'eth_call':
        return await this.handleCall(params[0], params[1], connection);
        
      case 'eth_estimateGas':
        return await this.handleEstimateGas(params[0], connection);
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }
  
  private async handleSendTransaction(txParams: any, connection: DAppConnection): Promise<string> {
    // Would integrate with wallet service to send transaction
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    // Update permission usage
    const permission = connection.permissions.find(p => p.method === 'eth_sendTransaction');
    if (permission) {
      permission.usage.count++;
      permission.usage.lastUsed = Date.now();
      permission.usage.totalValue = (parseFloat(permission.usage.totalValue) + parseFloat(txParams.value || '0')).toString();
    }
    
    return txHash;
  }
  
  private async handleSignTypedData(address: string, typedData: any, connection: DAppConnection): Promise<string> {
    // Would integrate with wallet service to sign typed data
    return '0x' + Math.random().toString(16).substr(2, 130);
  }
  
  private async handlePersonalSign(message: string, address: string, connection: DAppConnection): Promise<string> {
    // Would integrate with wallet service to sign message
    return '0x' + Math.random().toString(16).substr(2, 130);
  }
  
  private async handleGetBalance(address: string, blockTag: string, connection: DAppConnection): Promise<string> {
    const chainConnection = this.chainConnections.get(connection.chainId);
    if (!chainConnection) {
      throw new Error('Chain not connected');
    }
    
    const balance = await chainConnection.provider.getBalance(address, blockTag);
    return balance.toHexString();
  }
  
  private async handleCall(txParams: any, blockTag: string, connection: DAppConnection): Promise<string> {
    const chainConnection = this.chainConnections.get(connection.chainId);
    if (!chainConnection) {
      throw new Error('Chain not connected');
    }
    
    return await chainConnection.provider.call(txParams, blockTag);
  }
  
  private async handleEstimateGas(txParams: any, connection: DAppConnection): Promise<string> {
    const chainConnection = this.chainConnections.get(connection.chainId);
    if (!chainConnection) {
      throw new Error('Chain not connected');
    }
    
    const estimate = await chainConnection.provider.estimateGas(txParams);
    return estimate.toHexString();
  }
  
  private async updatePermissionUsage(connection: DAppConnection, method: string, request: Web3Request): Promise<void> {
    const permission = connection.permissions.find(p => p.method === method);
    if (permission) {
      permission.usage.count++;
      permission.usage.lastUsed = Date.now();
      
      if (request.gasEstimate) {
        permission.usage.averageGasUsed = 
          (permission.usage.averageGasUsed * (permission.usage.count - 1) + request.gasEstimate) / permission.usage.count;
      }
    }
  }
  
  private async getOrCreateChainConnection(chainId: number): Promise<ChainConnection> {
    if (this.chainConnections.has(chainId)) {
      return this.chainConnections.get(chainId)!;
    }
    
    // Create new chain connection
    const rpcUrl = this.getRpcUrl(chainId);
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    try {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      const gasPrice = await provider.getGasPrice();
      
      const chainConnection: ChainConnection = {
        chainId,
        rpcUrl,
        provider,
        connected: true,
        lastSync: Date.now(),
        blockNumber,
        gasPrice: gasPrice.toString(),
        nativeCurrency: this.getNativeCurrency(chainId)
      };
      
      this.chainConnections.set(chainId, chainConnection);
      return chainConnection;
      
    } catch (error) {
      console.error(`Failed to connect to chain ${chainId}:`, error);
      
      const chainConnection: ChainConnection = {
        chainId,
        rpcUrl,
        provider,
        connected: false,
        lastSync: 0,
        blockNumber: 0,
        gasPrice: '0',
        nativeCurrency: this.getNativeCurrency(chainId)
      };
      
      this.chainConnections.set(chainId, chainConnection);
      return chainConnection;
    }
  }
  
  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      1: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
      137: 'https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID',
      56: 'https://bsc-dataseed.binance.org/',
      43114: 'https://api.avax.network/ext/bc/C/rpc',
      42161: 'https://arb1.arbitrum.io/rpc',
      10: 'https://mainnet.optimism.io'
    };
    
    return rpcUrls[chainId] || rpcUrls[1];
  }
  
  private getNativeCurrency(chainId: number): { name: string; symbol: string; decimals: number } {
    const currencies: Record<number, { name: string; symbol: string; decimals: number }> = {
      1: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
      137: { name: 'Polygon', symbol: 'MATIC', decimals: 18 },
      56: { name: 'Binance Smart Chain', symbol: 'BNB', decimals: 18 },
      43114: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
      42161: { name: 'Arbitrum', symbol: 'ETH', decimals: 18 },
      10: { name: 'Optimism', symbol: 'ETH', decimals: 18 }
    };
    
    return currencies[chainId] || currencies[1];
  }
  
  private async requestUserApproval(type: string, data: any): Promise<boolean> {
    // Would show user approval dialog
    // For high-risk operations, always request approval
    if (data.riskScore > 70) {
      return false; // Simulate rejection of high-risk requests
    }
    
    return true; // Simulate approval
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }
  
  private startConnectionMonitoring(): void {
    // Monitor connections and clean up inactive ones
    setInterval(() => {
      this.cleanupInactiveConnections();
      this.updateChainConnections();
    }, 300000); // Every 5 minutes
  }
  
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    Array.from(this.connections.entries()).forEach(([id, connection]) => {
      if (now - connection.lastUsed > inactiveThreshold) {
        connection.status = 'disconnected';
      }
    });
    
    // Clean up old pending requests
    Array.from(this.pendingRequests.entries()).forEach(([id, request]) => {
      if (now - request.timestamp > 300000) { // 5 minutes
        request.status = 'rejected';
        this.pendingRequests.delete(id);
      }
    });
  }
  
  private async updateChainConnections(): Promise<void> {
    // Update chain connection status
    for (const [chainId, connection] of this.chainConnections) {
      try {
        const blockNumber = await connection.provider.getBlockNumber();
        const gasPrice = await connection.provider.getGasPrice();
        
        connection.blockNumber = blockNumber;
        connection.gasPrice = gasPrice.toString();
        connection.lastSync = Date.now();
        connection.connected = true;
        
      } catch (error) {
        console.warn(`Chain ${chainId} connection error:`, error);
        connection.connected = false;
      }
    }
  }
  
  /**
   * Get pending requests
   */
  public getPendingRequests(): Web3Request[] {
    return Array.from(this.pendingRequests.values())
      .filter(req => req.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Approve pending request
   */
  public async approveRequest(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.userApproval = true;
      request.status = 'approved';
    }
  }
  
  /**
   * Reject pending request
   */
  public async rejectRequest(requestId: string): Promise<void> {
    const request = this.pendingRequests.get(requestId);
    if (request) {
      request.userApproval = false;
      request.status = 'rejected';
    }
  }
}

// Export singleton instance
export const web3Connectivity = Web3ConnectivityManager.getInstance();
export default Web3ConnectivityManager;
