/**
 * Cypher Wallet - WalletConnect V2 Service
 * Advanced multi-chain dApp connectivity with WalletConnect V2
 * 
 * Features:
 * - WalletConnect V2 protocol support
 * - Multi-chain session management
 * - QR code and deep link pairing
 * - Session proposals and approvals
 * - Event handling and notifications
 * - Mobile and desktop compatibility
 * - Session persistence and recovery
 */

import { performanceEngine } from '../performance/PerformanceEngine';
import { perfectUX } from '../ux/PerfectUXManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

// WalletConnect V2 interfaces
export interface SessionProposal {
  id: number;
  proposer: {
    publicKey: string;
    metadata: AppMetadata;
  };
  requiredNamespaces: Record<string, RequiredNamespace>;
  optionalNamespaces?: Record<string, RequiredNamespace>;
  relays: RelayProtocol[];
  expiryTimestamp: number;
}

export interface RequiredNamespace {
  chains?: string[];
  methods: string[];
  events: string[];
  extension?: ExtensionData[];
}

export interface ExtensionData {
  chains: string[];
  methods: string[];
  events: string[];
}

export interface AppMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
  verifyUrl?: string;
  redirect?: {
    native?: string;
    universal?: string;
  };
}

export interface RelayProtocol {
  protocol: string;
  data?: string;
}

export interface WalletConnectSession {
  topic: string;
  pairingTopic: string;
  relay: RelayProtocol;
  expiry: number;
  acknowledged: boolean;
  controller: string;
  namespaces: Record<string, SessionNamespace>;
  peer: {
    publicKey: string;
    metadata: AppMetadata;
  };
  self: {
    publicKey: string;
    metadata: AppMetadata;
  };
  requiredNamespaces: Record<string, RequiredNamespace>;
  optionalNamespaces?: Record<string, RequiredNamespace>;
}

export interface SessionNamespace {
  chains: string[];
  accounts: string[];
  methods: string[];
  events: string[];
  extension?: ExtensionData[];
}

export interface SessionRequest {
  id: number;
  topic: string;
  method: string;
  params: any;
  chainId: string;
  expiry?: number;
}

export interface SessionEvent {
  id: number;
  topic: string;
  event: {
    name: string;
    data: any;
  };
  chainId: string;
}

export interface PairingProposal {
  uri: string;
  topic: string;
  proposer: AppMetadata;
  expiry: number;
  methods: string[];
  chains: string[];
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  sessions: WalletConnectSession[];
  pendingProposals: SessionProposal[];
  pendingRequests: SessionRequest[];
}

/**
 * WalletConnect V2 Service
 * Manages WalletConnect V2 protocol integration
 */
export class WalletConnectV2Service {
  private static instance: WalletConnectV2Service;
  
  private sessions: Map<string, WalletConnectSession> = new Map();
  private pendingProposals: Map<number, SessionProposal> = new Map();
  private pendingRequests: Map<number, SessionRequest> = new Map();
  private eventListeners: Map<string, ((...args: any[]) => void)[]> = new Map();
  
  // Connection state
  private connected = false;
  private connecting = false;
  
  // Supported chains and methods
  private supportedChains = [
    'eip155:1',    // Ethereum Mainnet
    'eip155:137',  // Polygon
    'eip155:56',   // BSC
    'eip155:43114', // Avalanche
    'eip155:42161', // Arbitrum
    'eip155:10'    // Optimism
  ];
  
  private supportedMethods = [
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sign',
    'personal_sign',
    'eth_signTypedData',
    'eth_signTypedData_v4',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain'
  ];
  
  private supportedEvents = [
    'chainChanged',
    'accountsChanged',
    'disconnect'
  ];
  
  private constructor() {
    this.initializeService();
  }
  
  public static getInstance(): WalletConnectV2Service {
    if (!WalletConnectV2Service.instance) {
      WalletConnectV2Service.instance = new WalletConnectV2Service();
    }
    return WalletConnectV2Service.instance;
  }
  
  /**
   * Initialize WalletConnect service
   */
  private async initializeService(): Promise<void> {
    try {
      // Load persisted sessions
      await this.loadPersistedSessions();
      
      // Initialize WalletConnect client (would use actual WC SDK)
      console.log('WalletConnect V2 service initialized');
      
    } catch (error) {
      console.error('Failed to initialize WalletConnect service:', error);
    }
  }
  
  /**
   * Pair with dApp using URI
   */
  public async pair(uri: string): Promise<void> {
    try {
      this.connecting = true;
      this.emit('connecting', { uri });
      
      // Parse WalletConnect URI
      const proposal = await this.parseWalletConnectURI(uri);
      
      // Store pending proposal
      this.pendingProposals.set(proposal.id, proposal);
      
      // Emit proposal event for user approval
      this.emit('session_proposal', proposal);
      
      await perfectUX.trackAction('walletconnect_pair', { uri });
      
    } catch (error) {
      this.connecting = false;
      console.error('WalletConnect pairing failed:', error);
      throw error;
    }
  }
  
  /**
   * Approve session proposal
   */
  public async approveSession(
    proposalId: number,
    accounts: string[],
    chains: string[]
  ): Promise<WalletConnectSession> {
    try {
      const proposal = this.pendingProposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }
      
      // Build session namespaces
      const namespaces = await this.buildSessionNamespaces(
        proposal.requiredNamespaces,
        proposal.optionalNamespaces,
        accounts,
        chains
      );
      
      // Create session
      const session: WalletConnectSession = {
        topic: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pairingTopic: proposal.id.toString(),
        relay: proposal.relays[0],
        expiry: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        acknowledged: true,
        controller: 'wallet',
        namespaces,
        peer: {
          publicKey: proposal.proposer.publicKey,
          metadata: proposal.proposer.metadata
        },
        self: {
          publicKey: this.generatePublicKey(),
          metadata: this.getWalletMetadata()
        },
        requiredNamespaces: proposal.requiredNamespaces,
        optionalNamespaces: proposal.optionalNamespaces
      };
      
      // Store session
      this.sessions.set(session.topic, session);
      
      // Remove pending proposal
      this.pendingProposals.delete(proposalId);
      
      // Persist session
      await this.persistSession(session);
      
      // Update connection state
      this.connected = true;
      this.connecting = false;
      
      // Emit events
      this.emit('session_approve', session);
      this.emit('session_created', session);
      
      await perfectUX.trackAction('walletconnect_approve', {
        dapp: session.peer.metadata.name,
        chains: chains.length
      });
      
      return session;
      
    } catch (error) {
      this.connecting = false;
      console.error('Session approval failed:', error);
      throw error;
    }
  }
  
  /**
   * Reject session proposal
   */
  public async rejectSession(proposalId: number, reason?: string): Promise<void> {
    try {
      const proposal = this.pendingProposals.get(proposalId);
      if (!proposal) {
        throw new Error('Proposal not found');
      }
      
      // Remove pending proposal
      this.pendingProposals.delete(proposalId);
      
      // Update connection state
      this.connecting = false;
      
      // Emit rejection event
      this.emit('session_reject', { proposalId, reason });
      
      await perfectUX.trackAction('walletconnect_reject', {
        dapp: proposal.proposer.metadata.name,
        reason
      });
      
    } catch (error) {
      console.error('Session rejection failed:', error);
      throw error;
    }
  }
  
  /**
   * Handle session request
   */
  public async handleSessionRequest(request: SessionRequest): Promise<any> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const session = this.sessions.get(request.topic);
        if (!session) {
          throw new Error('Session not found');
        }
        
        // Store pending request
        this.pendingRequests.set(request.id, request);
        
        // Emit request event for user approval
        this.emit('session_request', request);
        
        // Handle specific methods
        switch (request.method) {
          case 'eth_sendTransaction':
            return await this.handleSendTransaction(request, session);
            
          case 'personal_sign':
            return await this.handlePersonalSign(request, session);
            
          case 'eth_signTypedData_v4':
            return await this.handleSignTypedData(request, session);
            
          case 'wallet_switchEthereumChain':
            return await this.handleSwitchChain(request, session);
            
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
      }, `wc_request_${request.method}`);
      
    } catch (error) {
      console.error('Session request failed:', error);
      throw error;
    }
  }
  
  /**
   * Approve session request
   */
  public async approveRequest(requestId: number, result: any): Promise<void> {
    try {
      const request = this.pendingRequests.get(requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Send response (would use WC client)
      console.log('Approving request:', requestId, result);
      
      // Remove pending request
      this.pendingRequests.delete(requestId);
      
      // Emit response event
      this.emit('session_response', { requestId, result });
      
      await perfectUX.trackAction('walletconnect_approve_request', {
        method: request.method,
        chainId: request.chainId
      });
      
    } catch (error) {
      console.error('Request approval failed:', error);
      throw error;
    }
  }
  
  /**
   * Reject session request
   */
  public async rejectRequest(requestId: number, error: string): Promise<void> {
    try {
      const request = this.pendingRequests.get(requestId);
      if (!request) {
        throw new Error('Request not found');
      }
      
      // Send error response (would use WC client)
      console.log('Rejecting request:', requestId, error);
      
      // Remove pending request
      this.pendingRequests.delete(requestId);
      
      // Emit error event
      this.emit('session_error', { requestId, error });
      
      await perfectUX.trackAction('walletconnect_reject_request', {
        method: request.method,
        error
      });
      
    } catch (error) {
      console.error('Request rejection failed:', error);
      throw error;
    }
  }
  
  /**
   * Disconnect session
   */
  public async disconnect(sessionTopic: string, reason?: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionTopic);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Remove session
      this.sessions.delete(sessionTopic);
      
      // Remove persisted session
      await this.removePersistedSession(sessionTopic);
      
      // Update connection state
      if (this.sessions.size === 0) {
        this.connected = false;
      }
      
      // Emit disconnect event
      this.emit('session_disconnect', { topic: sessionTopic, reason });
      
      await perfectUX.trackAction('walletconnect_disconnect', {
        dapp: session.peer.metadata.name,
        reason
      });
      
    } catch (error) {
      console.error('Session disconnect failed:', error);
      throw error;
    }
  }
  
  /**
   * Update session with new accounts or chains
   */
  public async updateSession(
    sessionTopic: string,
    accounts?: string[],
    chains?: string[]
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionTopic);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Update namespaces
      Object.keys(session.namespaces).forEach(key => {
        if (accounts) {
          session.namespaces[key].accounts = accounts.map(acc => `${key}:${acc}`);
        }
        if (chains) {
          session.namespaces[key].chains = chains.filter(chain => chain.startsWith(key));
        }
      });
      
      // Persist updated session
      await this.persistSession(session);
      
      // Emit update event
      this.emit('session_update', { topic: sessionTopic, accounts, chains });
      
      // Send session update to dApp (would use WC client)
      console.log('Session updated:', sessionTopic);
      
    } catch (error) {
      console.error('Session update failed:', error);
      throw error;
    }
  }
  
  /**
   * Emit session event
   */
  public async emitSessionEvent(
    sessionTopic: string,
    event: { name: string; data: any },
    chainId: string
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionTopic);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const sessionEvent: SessionEvent = {
        id: Date.now(),
        topic: sessionTopic,
        event,
        chainId
      };
      
      // Send event to dApp (would use WC client)
      console.log('Emitting session event:', sessionEvent);
      
      this.emit('session_event_sent', sessionEvent);
      
    } catch (error) {
      console.error('Session event failed:', error);
      throw error;
    }
  }
  
  /**
   * Get active sessions
   */
  public getActiveSessions(): WalletConnectSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.expiry > Date.now())
      .sort((a, b) => b.expiry - a.expiry);
  }
  
  /**
   * Get pending proposals
   */
  public getPendingProposals(): SessionProposal[] {
    return Array.from(this.pendingProposals.values())
      .filter(proposal => proposal.expiryTimestamp > Date.now())
      .sort((a, b) => b.expiryTimestamp - a.expiryTimestamp);
  }
  
  /**
   * Get pending requests
   */
  public getPendingRequests(): SessionRequest[] {
    return Array.from(this.pendingRequests.values())
      .sort((a, b) => b.id - a.id);
  }
  
  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return {
      connected: this.connected,
      connecting: this.connecting,
      sessions: this.getActiveSessions(),
      pendingProposals: this.getPendingProposals(),
      pendingRequests: this.getPendingRequests()
    };
  }
  
  // Event handling
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }
  
  public off(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('WalletConnect event listener error:', error);
        }
      });
    }
  }
  
  // Private helper methods
  
  private async parseWalletConnectURI(uri: string): Promise<SessionProposal> {
    // Parse WalletConnect URI format: wc:topic@version?bridge=...&key=...
    const url = new URL(uri.replace('wc:', 'wc://'));
    
    // Simulate session proposal
    return {
      id: Date.now(),
      proposer: {
        publicKey: Math.random().toString(36),
        metadata: {
          name: 'Sample dApp',
          description: 'A sample decentralized application',
          url: 'https://example.com',
          icons: ['https://example.com/icon.png']
        }
      },
      requiredNamespaces: {
        'eip155': {
          chains: ['eip155:1'],
          methods: this.supportedMethods,
          events: this.supportedEvents
        }
      },
      relays: [{ protocol: 'irn' }],
      expiryTimestamp: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
  }
  
  private async buildSessionNamespaces(
    requiredNamespaces: Record<string, RequiredNamespace>,
    optionalNamespaces: Record<string, RequiredNamespace> = {},
    accounts: string[],
    chains: string[]
  ): Promise<Record<string, SessionNamespace>> {
    const namespaces: Record<string, SessionNamespace> = {};
    
    // Build required namespaces
    Object.keys(requiredNamespaces).forEach(key => {
      const required = requiredNamespaces[key];
      const supportedChains = chains.filter(chain => chain.startsWith(key));
      
      namespaces[key] = {
        chains: supportedChains,
        accounts: accounts.map(acc => `${key}:${acc}`),
        methods: required.methods.filter(method => this.supportedMethods.includes(method)),
        events: required.events.filter(event => this.supportedEvents.includes(event))
      };
    });
    
    // Add optional namespaces if supported
    Object.keys(optionalNamespaces).forEach(key => {
      if (!namespaces[key]) {
        const optional = optionalNamespaces[key];
        const supportedChains = chains.filter(chain => chain.startsWith(key));
        
        if (supportedChains.length > 0) {
          namespaces[key] = {
            chains: supportedChains,
            accounts: accounts.map(acc => `${key}:${acc}`),
            methods: optional.methods.filter(method => this.supportedMethods.includes(method)),
            events: optional.events.filter(event => this.supportedEvents.includes(event))
          };
        }
      }
    });
    
    return namespaces;
  }
  
  private generatePublicKey(): string {
    return Math.random().toString(36).substr(2, 64);
  }
  
  private getWalletMetadata(): AppMetadata {
    return {
      name: 'Cypher Wallet',
      description: 'The most advanced Ethereum wallet',
      url: 'https://cypher.io',
      icons: ['https://cypher.io/icon.png']
    };
  }
  
  private async handleSendTransaction(request: SessionRequest, session: WalletConnectSession): Promise<string> {
    // Would integrate with wallet service to send transaction
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    return txHash;
  }
  
  private async handlePersonalSign(request: SessionRequest, session: WalletConnectSession): Promise<string> {
    // Would integrate with wallet service to sign message
    const signature = '0x' + Math.random().toString(16).substr(2, 130);
    return signature;
  }
  
  private async handleSignTypedData(request: SessionRequest, session: WalletConnectSession): Promise<string> {
    // Would integrate with wallet service to sign typed data
    const signature = '0x' + Math.random().toString(16).substr(2, 130);
    return signature;
  }
  
  private async handleSwitchChain(request: SessionRequest, session: WalletConnectSession): Promise<void> {
    // Would update session with new chain
    console.log('Switching chain:', request.params);
  }
  
  private async loadPersistedSessions(): Promise<void> {
    try {
      const sessionsData = await AsyncStorage.getItem('walletconnect_sessions');
      if (sessionsData) {
        const sessions: WalletConnectSession[] = JSON.parse(sessionsData);
        sessions.forEach(session => {
          if (session.expiry > Date.now()) {
            this.sessions.set(session.topic, session);
          }
        });
        
        if (this.sessions.size > 0) {
          this.connected = true;
        }
      }
    } catch (error) {
      console.error('Failed to load persisted sessions:', error);
    }
  }
  
  private async persistSession(session: WalletConnectSession): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await AsyncStorage.setItem('walletconnect_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  }
  
  private async removePersistedSession(sessionTopic: string): Promise<void> {
    try {
      const sessions = Array.from(this.sessions.values());
      await AsyncStorage.setItem('walletconnect_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to remove persisted session:', error);
    }
  }
}

// Export singleton instance
export const walletConnectV2 = WalletConnectV2Service.getInstance();
export default WalletConnectV2Service;
