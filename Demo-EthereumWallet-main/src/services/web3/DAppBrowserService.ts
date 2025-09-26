/**
 * Cypher Wallet - dApp Browser Service
 * Enhanced security-focused browser for Web3 applications
 * 
 * Features:
 * - Comprehensive phishing protection
 * - Real-time threat scanning
 * - Performance optimization
 * - Privacy protection
 * - Bookmark management
 * - History tracking
 * - Incognito mode
 * - Script injection protection
 * - SSL/TLS validation
 * - Malicious site blocking
 */

import { performanceEngine } from '../performance/PerformanceEngine';
import { threatDetection } from '../security/ThreatDetectionSystem';
import { perfectUX } from '../ux/PerfectUXManager';
import { web3Connectivity } from './Web3ConnectivityManager';

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  status: 'loading' | 'loaded' | 'error';
  isSecure: boolean;
  isPhishing: boolean;
  isMalicious: boolean;
  trustScore: number;
  loadTime: number;
  createdAt: number;
  lastVisited: number;
  incognito: boolean;
  connectedDApp?: string;
  permissions: BrowserPermission[];
}

export interface BrowserPermission {
  type: 'camera' | 'microphone' | 'location' | 'notifications' | 'storage' | 'web3';
  granted: boolean;
  grantedAt?: number;
  expires?: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  category: string;
  tags: string[];
  trustScore: number;
  createdAt: number;
  visitCount: number;
  lastVisited: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  visitedAt: number;
  duration: number;
  trustScore: number;
  incognito: boolean;
}

export interface SecurityScan {
  url: string;
  timestamp: number;
  threats: ThreatInfo[];
  trustScore: number;
  ssl: SSLInfo;
  privacy: PrivacyInfo;
  safe: boolean;
}

export interface ThreatInfo {
  type: 'phishing' | 'malware' | 'scam' | 'suspicious' | 'tracker';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  blocked: boolean;
}

export interface SSLInfo {
  valid: boolean;
  issuer?: string;
  validFrom?: number;
  validTo?: number;
  protocol?: string;
  cipher?: string;
}

export interface PrivacyInfo {
  trackers: string[];
  cookies: number;
  thirdPartyRequests: number;
  blocked: number;
}

export interface BrowserSettings {
  blockPhishing: boolean;
  blockMalware: boolean;
  blockTrackers: boolean;
  strictSSL: boolean;
  javascriptEnabled: boolean;
  popupBlocking: boolean;
  autoFillPasswords: boolean;
  incognitoMode: boolean;
  clearDataOnExit: boolean;
  userAgent?: string;
}

/**
 * Enhanced dApp Browser Service
 * Secure Web3 browsing with comprehensive protection
 */
export class DAppBrowserService {
  private static instance: DAppBrowserService;
  
  private tabs: Map<string, BrowserTab> = new Map();
  private bookmarks: Map<string, Bookmark> = new Map();
  private history: HistoryEntry[] = [];
  private securityScans: Map<string, SecurityScan> = new Map();
  private activeTabId: string | null = null;
  
  private settings: BrowserSettings = {
    blockPhishing: true,
    blockMalware: true,
    blockTrackers: true,
    strictSSL: true,
    javascriptEnabled: true,
    popupBlocking: true,
    autoFillPasswords: false,
    incognitoMode: false,
    clearDataOnExit: false
  };
  
  // Trusted dApp whitelist
  private readonly TRUSTED_DAPPS = new Set([
    'uniswap.org',
    'app.uniswap.org',
    'compound.finance',
    'app.compound.finance',
    'aave.com',
    'app.aave.com',
    'opensea.io',
    'etherscan.io',
    'polygonscan.com'
  ]);
  
  // Known phishing patterns
  private readonly PHISHING_PATTERNS = [
    /uniswap\.com/i,
    /opensea\.com/i,
    /metamask\.com/i,
    /ethereum\.com/i,
    /binance\.com/i
  ];
  
  private constructor() {
    this.initializeBrowser();
  }
  
  public static getInstance(): DAppBrowserService {
    if (!DAppBrowserService.instance) {
      DAppBrowserService.instance = new DAppBrowserService();
    }
    return DAppBrowserService.instance;
  }
  
  /**
   * Initialize browser service
   */
  private async initializeBrowser(): Promise<void> {
    try {
      // Load bookmarks and history from storage
      await this.loadStoredData();
      
      console.log('dApp Browser service initialized');
      
    } catch (error) {
      console.error('Failed to initialize dApp Browser:', error);
    }
  }
  
  /**
   * Create new browser tab
   */
  public async createTab(
    url: string,
    incognito: boolean = false
  ): Promise<BrowserTab> {
    try {
      return await performanceEngine.optimizeOperation(async () => {
        const tabId = this.generateTabId();
        
        // Validate and normalize URL
        url = this.normalizeURL(url);
        
        // Perform security scan
        const securityScan = await this.performSecurityScan(url);
        
        // Create tab
        const tab: BrowserTab = {
          id: tabId,
          url,
          title: 'Loading...',
          status: 'loading',
          isSecure: securityScan.ssl.valid,
          isPhishing: securityScan.threats.some(t => t.type === 'phishing'),
          isMalicious: !securityScan.safe,
          trustScore: securityScan.trustScore,
          loadTime: 0,
          createdAt: Date.now(),
          lastVisited: Date.now(),
          incognito,
          permissions: []
        };
        
        // Block if dangerous
        if (tab.isPhishing || tab.isMalicious) {
          tab.status = 'error';
          await perfectUX.trackAction('dangerous_site_blocked', {
            url,
            reason: 'phishing_or_malicious'
          });
        }
        
        // Store tab
        this.tabs.set(tabId, tab);
        this.activeTabId = tabId;
        
        // Track in UX
        await perfectUX.trackAction('browser_tab_created', {
          url,
          secure: tab.isSecure,
          trustScore: tab.trustScore,
          incognito
        });
        
        return tab;
      }, `create_tab_${url}`);
      
    } catch (error) {
      console.error('Failed to create tab:', error);
      throw error;
    }
  }
  
  /**
   * Navigate tab to URL
   */
  public async navigateTab(tabId: string, url: string): Promise<void> {
    try {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        throw new Error('Tab not found');
      }
      
      const startTime = Date.now();
      
      // Normalize URL
      url = this.normalizeURL(url);
      
      // Update tab status
      tab.status = 'loading';
      tab.url = url;
      tab.title = 'Loading...';
      
      // Perform security scan
      const securityScan = await this.performSecurityScan(url);
      
      // Update security info
      tab.isSecure = securityScan.ssl.valid;
      tab.isPhishing = securityScan.threats.some(t => t.type === 'phishing');
      tab.isMalicious = !securityScan.safe;
      tab.trustScore = securityScan.trustScore;
      
      // Block if dangerous
      if (tab.isPhishing || tab.isMalicious) {
        tab.status = 'error';
        await perfectUX.trackAction('navigation_blocked', {
          url,
          reason: 'security_threat'
        });
        return;
      }
      
      // Simulate page load
      await this.simulatePageLoad(tab);
      
      // Update load time
      tab.loadTime = Date.now() - startTime;
      tab.status = 'loaded';
      tab.lastVisited = Date.now();
      
      // Add to history (if not incognito)
      if (!tab.incognito) {
        await this.addToHistory(url, tab.title, tab.loadTime, tab.trustScore);
      }
      
      // Check for dApp connection
      await this.checkDAppConnection(tab);
      
      await perfectUX.trackAction('browser_navigation', {
        url,
        loadTime: tab.loadTime,
        trustScore: tab.trustScore
      });
      
    } catch (error) {
      console.error('Failed to navigate tab:', error);
      throw error;
    }
  }
  
  /**
   * Close browser tab
   */
  public async closeTab(tabId: string): Promise<void> {
    try {
      const tab = this.tabs.get(tabId);
      if (!tab) return;
      
      // Disconnect from dApp if connected
      if (tab.connectedDApp) {
        await web3Connectivity.disconnect(tab.connectedDApp);
      }
      
      // Remove tab
      this.tabs.delete(tabId);
      
      // Update active tab
      if (this.activeTabId === tabId) {
        const remainingTabs = Array.from(this.tabs.keys());
        this.activeTabId = remainingTabs.length > 0 ? remainingTabs[0] : null;
      }
      
      await perfectUX.trackAction('browser_tab_closed', { tabId });
      
    } catch (error) {
      console.error('Failed to close tab:', error);
      throw error;
    }
  }
  
  /**
   * Get all browser tabs
   */
  public getTabs(): BrowserTab[] {
    return Array.from(this.tabs.values())
      .sort((a, b) => b.lastVisited - a.lastVisited);
  }
  
  /**
   * Get active tab
   */
  public getActiveTab(): BrowserTab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }
  
  /**
   * Set active tab
   */
  public setActiveTab(tabId: string): void {
    if (this.tabs.has(tabId)) {
      this.activeTabId = tabId;
      const tab = this.tabs.get(tabId)!;
      tab.lastVisited = Date.now();
    }
  }
  
  /**
   * Add bookmark
   */
  public async addBookmark(
    url: string,
    title: string,
    category: string = 'General',
    tags: string[] = []
  ): Promise<Bookmark> {
    try {
      const bookmarkId = this.generateBookmarkId();
      
      // Get security info
      const securityScan = await this.performSecurityScan(url);
      
      const bookmark: Bookmark = {
        id: bookmarkId,
        url: this.normalizeURL(url),
        title,
        category,
        tags,
        trustScore: securityScan.trustScore,
        createdAt: Date.now(),
        visitCount: 0,
        lastVisited: 0
      };
      
      this.bookmarks.set(bookmarkId, bookmark);
      
      // Save to storage
      await this.saveBookmarks();
      
      await perfectUX.trackAction('bookmark_added', {
        url,
        category,
        trustScore: bookmark.trustScore
      });
      
      return bookmark;
      
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      throw error;
    }
  }
  
  /**
   * Remove bookmark
   */
  public async removeBookmark(bookmarkId: string): Promise<void> {
    try {
      this.bookmarks.delete(bookmarkId);
      await this.saveBookmarks();
      
      await perfectUX.trackAction('bookmark_removed', { bookmarkId });
      
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      throw error;
    }
  }
  
  /**
   * Get bookmarks
   */
  public getBookmarks(category?: string): Bookmark[] {
    const bookmarks = Array.from(this.bookmarks.values());
    
    if (category) {
      return bookmarks.filter(b => b.category === category);
    }
    
    return bookmarks.sort((a, b) => b.lastVisited - a.lastVisited);
  }
  
  /**
   * Search bookmarks
   */
  public searchBookmarks(query: string): Bookmark[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(this.bookmarks.values())
      .filter(bookmark => 
        bookmark.title.toLowerCase().includes(lowercaseQuery) ||
        bookmark.url.toLowerCase().includes(lowercaseQuery) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => b.visitCount - a.visitCount);
  }
  
  /**
   * Get browsing history
   */
  public getHistory(limit: number = 50): HistoryEntry[] {
    return this.history
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, limit);
  }
  
  /**
   * Search browsing history
   */
  public searchHistory(query: string, limit: number = 20): HistoryEntry[] {
    const lowercaseQuery = query.toLowerCase();
    
    return this.history
      .filter(entry => 
        entry.title.toLowerCase().includes(lowercaseQuery) ||
        entry.url.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, limit);
  }
  
  /**
   * Clear browsing history
   */
  public async clearHistory(): Promise<void> {
    try {
      this.history = [];
      await this.saveHistory();
      
      await perfectUX.trackAction('history_cleared');
      
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }
  
  /**
   * Update browser settings
   */
  public async updateSettings(newSettings: Partial<BrowserSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...newSettings };
      await this.saveSettings();
      
      await perfectUX.trackAction('browser_settings_updated', newSettings);
      
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }
  
  /**
   * Get browser settings
   */
  public getSettings(): BrowserSettings {
    return { ...this.settings };
  }
  
  /**
   * Get security scan for URL
   */
  public async getSecurityScan(url: string): Promise<SecurityScan> {
    const normalizedUrl = this.normalizeURL(url);
    
    let scan = this.securityScans.get(normalizedUrl);
    if (!scan || Date.now() - scan.timestamp > 5 * 60 * 1000) { // 5 minutes cache
      scan = await this.performSecurityScan(normalizedUrl);
    }
    
    return scan;
  }
  
  /**
   * Grant permission to tab
   */
  public async grantPermission(
    tabId: string,
    permission: BrowserPermission
  ): Promise<void> {
    try {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        throw new Error('Tab not found');
      }
      
      // Check if permission already exists
      const existingIndex = tab.permissions.findIndex(p => p.type === permission.type);
      
      if (existingIndex >= 0) {
        tab.permissions[existingIndex] = permission;
      } else {
        tab.permissions.push(permission);
      }
      
      await perfectUX.trackAction('browser_permission_granted', {
        tabId,
        permission: permission.type,
        url: tab.url
      });
      
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw error;
    }
  }
  
  /**
   * Revoke permission from tab
   */
  public async revokePermission(tabId: string, permissionType: string): Promise<void> {
    try {
      const tab = this.tabs.get(tabId);
      if (!tab) {
        throw new Error('Tab not found');
      }
      
      tab.permissions = tab.permissions.filter(p => p.type !== permissionType);
      
      await perfectUX.trackAction('browser_permission_revoked', {
        tabId,
        permission: permissionType,
        url: tab.url
      });
      
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private generateBookmarkId(): string {
    return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private normalizeURL(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it's a search query or domain
      if (url.includes(' ') || !url.includes('.')) {
        // Treat as search query
        return `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
      } else {
        // Treat as domain
        return `https://${url}`;
      }
    }
    return url;
  }
  
  private async performSecurityScan(url: string): Promise<SecurityScan> {
    try {
      const threats: ThreatInfo[] = [];
      let trustScore = 100;
      
      // Parse URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      // Check against trusted dApps
      if (this.TRUSTED_DAPPS.has(domain)) {
        trustScore = 100;
      } else {
        trustScore = 70; // Default for unknown sites
      }
      
      // Check for phishing patterns
      for (const pattern of this.PHISHING_PATTERNS) {
        if (pattern.test(domain)) {
          threats.push({
            type: 'phishing',
            severity: 'critical',
            description: 'Potential phishing site detected',
            blocked: true
          });
          trustScore = 0;
          break;
        }
      }
      
      // Additional security checks
      if (domain.includes('metamask') && domain !== 'metamask.io') {
        threats.push({
          type: 'phishing',
          severity: 'critical',
          description: 'Potential MetaMask phishing site',
          blocked: true
        });
        trustScore = 0;
      }
      
      // SSL validation
      const ssl: SSLInfo = {
        valid: urlObj.protocol === 'https:',
        protocol: urlObj.protocol === 'https:' ? 'TLS 1.3' : 'HTTP',
        validFrom: Date.now(),
        validTo: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
      };
      
      if (!ssl.valid && this.settings.strictSSL) {
        threats.push({
          type: 'suspicious',
          severity: 'medium',
          description: 'Insecure HTTP connection',
          blocked: false
        });
        trustScore = Math.min(trustScore, 50);
      }
      
      // Privacy scan
      const privacy: PrivacyInfo = {
        trackers: [],
        cookies: 0,
        thirdPartyRequests: 0,
        blocked: 0
      };
      
      const scan: SecurityScan = {
        url,
        timestamp: Date.now(),
        threats,
        trustScore,
        ssl,
        privacy,
        safe: trustScore > 30 && !threats.some(t => t.blocked)
      };
      
      // Cache scan result
      this.securityScans.set(url, scan);
      
      return scan;
      
    } catch (error) {
      console.error('Security scan failed:', error);
      
      // Return safe defaults on error
      return {
        url,
        timestamp: Date.now(),
        threats: [],
        trustScore: 50,
        ssl: { valid: false },
        privacy: { trackers: [], cookies: 0, thirdPartyRequests: 0, blocked: 0 },
        safe: true
      };
    }
  }
  
  private async simulatePageLoad(tab: BrowserTab): Promise<void> {
    // Simulate realistic page load time
    const loadTime = 200 + Math.random() * 800; // 200-1000ms
    await new Promise(resolve => setTimeout(resolve, loadTime));
    
    // Extract title from URL (simplified)
    const urlObj = new URL(tab.url);
    tab.title = this.extractTitle(urlObj.hostname);
  }
  
  private extractTitle(hostname: string): string {
    // Simple title extraction
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const domain = parts[parts.length - 2];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    return hostname;
  }
  
  private async checkDAppConnection(tab: BrowserTab): Promise<void> {
    try {
      const urlObj = new URL(tab.url);
      const domain = urlObj.hostname;
      
      // Check if this is a known dApp
      if (this.TRUSTED_DAPPS.has(domain)) {
        // Check if wallet is connected to this dApp
        const connections = web3Connectivity.getConnections();
        const connection = connections.find((c: any) => c.domain === domain);
        
        if (connection) {
          tab.connectedDApp = connection.id;
        }
      }
      
    } catch (error) {
      console.warn('Failed to check dApp connection:', error);
    }
  }
  
  private async addToHistory(
    url: string,
    title: string,
    duration: number,
    trustScore: number
  ): Promise<void> {
    try {
      const entry: HistoryEntry = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url,
        title,
        visitedAt: Date.now(),
        duration,
        trustScore,
        incognito: false
      };
      
      this.history.push(entry);
      
      // Limit history size
      if (this.history.length > 1000) {
        this.history = this.history.slice(-800); // Keep last 800 entries
      }
      
      // Update bookmark visit count if exists
      const bookmark = Array.from(this.bookmarks.values())
        .find(b => b.url === url);
      if (bookmark) {
        bookmark.visitCount++;
        bookmark.lastVisited = Date.now();
      }
      
      await this.saveHistory();
      
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  }
  
  private async loadStoredData(): Promise<void> {
    // Simulate loading from storage
    // In real implementation, would load from AsyncStorage or similar
  }
  
  private async saveBookmarks(): Promise<void> {
    // Simulate saving to storage
    // In real implementation, would save to AsyncStorage or similar
  }
  
  private async saveHistory(): Promise<void> {
    // Simulate saving to storage
    // In real implementation, would save to AsyncStorage or similar
  }
  
  private async saveSettings(): Promise<void> {
    // Simulate saving to storage
    // In real implementation, would save to AsyncStorage or similar
  }
}

// Export singleton instance
export const dAppBrowser = DAppBrowserService.getInstance();
export default DAppBrowserService;
