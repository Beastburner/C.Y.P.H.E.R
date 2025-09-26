/**
 * Performance Manager for Ultimate Persistent Multi-Wallet System
 * Handles app startup optimization, background sync, memory management, and smooth UX
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import CacheStorageManager from './storage/CacheStorageManager';
import MetadataStorageManager from './storage/MetadataStorageManager';
import SecureStorageManager from './storage/SecureStorageManager';

export interface PerformanceMetrics {
  startupTime: number;
  lastSyncTime: number;
  cacheHitRate: number;
  backgroundSyncCount: number;
  memoryUsage: number;
  walletsCount: number;
  lastOptimization: number;
}

export interface OptimizationConfig {
  maxCacheSize: number; // MB
  cacheExpiryMinutes: number;
  backgroundSyncIntervalMinutes: number;
  preloadCriticalData: boolean;
  enableMemoryOptimization: boolean;
  maxPreloadedAccounts: number;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private appStateSubscription: any;
  private backgroundSyncTimer: NodeJS.Timeout | null = null;
  private startupTimestamp: number = Date.now();
  private isInitialized: boolean = false;
  // Using CacheStorageManager static methods directly
  
  private config: OptimizationConfig = {
    maxCacheSize: 50, // 50MB
    cacheExpiryMinutes: 30,
    backgroundSyncIntervalMinutes: 5,
    preloadCriticalData: true,
    enableMemoryOptimization: true,
    maxPreloadedAccounts: 10,
  };

  private metrics: PerformanceMetrics = {
    startupTime: 0,
    lastSyncTime: 0,
    cacheHitRate: 0,
    backgroundSyncCount: 0,
    memoryUsage: 0,
    walletsCount: 0,
    lastOptimization: 0,
  };

  private constructor() {}

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  /**
   * Initialize performance optimization system
   */
  public async initialize(): Promise<void> {
    try {
      this.startupTimestamp = Date.now();
      console.log('🚀 Initializing Performance Manager...');

      // Load configuration
      await this.loadConfiguration();
      
      // Setup app state monitoring
      this.setupAppStateMonitoring();
      
      // Preload critical data if enabled
      if (this.config.preloadCriticalData) {
        await this.preloadCriticalData();
      }

      // Setup background sync
      this.setupBackgroundSync();
      
      // Load existing metrics
      await this.loadMetrics();
      
      // Record startup time
      this.metrics.startupTime = Date.now() - this.startupTimestamp;
      
      this.isInitialized = true;
      console.log(`✅ Performance Manager initialized in ${this.metrics.startupTime}ms`);
      
      // Schedule maintenance
      this.schedulePerformanceMaintenance();
      
    } catch (error) {
      console.error('Failed to initialize Performance Manager:', error);
      throw new Error('Performance Manager initialization failed');
    }
  }

  /**
   * Preload critical data for faster app experience
   */
  private async preloadCriticalData(): Promise<void> {
    try {
      console.log('⚡ Preloading critical data...');
      const preloadStartTime = Date.now();

      // Preload authentication status
      const authData = await SecureStorageManager.getAuthenticationData();
      if (authData) {
        await CacheStorageManager.storeApiCache('auth_status', { authenticated: true }, 60 * 1000);
      }

      // Preload wallet count and basic metadata
      const wallets = await SecureStorageManager.getAllWalletSeeds();
      this.metrics.walletsCount = wallets.length;
      await CacheStorageManager.storeApiCache('wallets_count', wallets.length, 30 * 1000);

      // Preload app settings
      const settings = await MetadataStorageManager.getAppSettings();
      if (settings) {
        await CacheStorageManager.storeApiCache('app_settings', settings, 60 * 60 * 1000);
      }

      // Preload first few wallet metadata for quick access
      const metadataList = await MetadataStorageManager.getAllWalletMetadata();
      const priorityMetadata = metadataList.slice(0, this.config.maxPreloadedAccounts);
      for (const metadata of priorityMetadata) {
        await CacheStorageManager.storeApiCache(`wallet_meta_${metadata.id}`, metadata, 30 * 60 * 1000);
      }

      const preloadTime = Date.now() - preloadStartTime;
      console.log(`✅ Critical data preloaded in ${preloadTime}ms`);
      
    } catch (error) {
      console.warn('Failed to preload critical data:', error);
    }
  }

  /**
   * Setup background sync for data freshness
   */
  private setupBackgroundSync(): void {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }

    const intervalMs = this.config.backgroundSyncIntervalMinutes * 60 * 1000;
    this.backgroundSyncTimer = setInterval(() => {
      this.performBackgroundSync();
    }, intervalMs);

    console.log(`🔄 Background sync scheduled every ${this.config.backgroundSyncIntervalMinutes} minutes`);
  }

  /**
   * Perform background data synchronization
   */
  private async performBackgroundSync(): Promise<void> {
    try {
      if (AppState.currentState !== 'active') {
        return; // Skip sync when app is not active
      }

      console.log('🔄 Performing background sync...');
      const syncStartTime = Date.now();

      // Update wallet counts
      const wallets = await SecureStorageManager.getAllWalletSeeds();
      if (wallets.length !== this.metrics.walletsCount) {
        this.metrics.walletsCount = wallets.length;
        await CacheStorageManager.storeApiCache('wallets_count', wallets.length, 30 * 60 * 1000);
      }

      // Update app settings cache
      const settings = await MetadataStorageManager.getAppSettings();
      if (settings) {
        await CacheStorageManager.storeApiCache('app_settings', settings, 60 * 60 * 1000);
      }

      // Clean expired cache entries
      await CacheStorageManager.cleanupExpiredCache();

      this.metrics.lastSyncTime = Date.now();
      this.metrics.backgroundSyncCount++;

      const syncTime = Date.now() - syncStartTime;
      console.log(`✅ Background sync completed in ${syncTime}ms`);

    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }

  /**
   * Setup app state monitoring for optimization triggers
   */
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * Handle app state changes for performance optimization
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log(`📱 App state changed to: ${nextAppState}`);

    switch (nextAppState) {
      case 'active':
        // App became active - refresh critical data
        this.onAppBecameActive();
        break;
      
      case 'background':
        // App went to background - optimize memory
        this.onAppWentToBackground();
        break;
      
      case 'inactive':
        // App became inactive - pause non-critical operations
        this.onAppBecameInactive();
        break;
    }
  }

  /**
   * Optimize performance when app becomes active
   */
  private async onAppBecameActive(): Promise<void> {
    try {
      // Check if critical data needs refresh
      const lastSync = this.metrics.lastSyncTime;
      const timeSinceSync = Date.now() - lastSync;
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeSinceSync > refreshThreshold) {
        await this.performBackgroundSync();
      }

      // Resume background sync
      this.setupBackgroundSync();
      
    } catch (error) {
      console.warn('Failed to optimize for active state:', error);
    }
  }

  /**
   * Optimize memory when app goes to background
   */
  private async onAppWentToBackground(): Promise<void> {
    try {
      if (this.config.enableMemoryOptimization) {
        // Clear non-critical cache entries
        await this.clearNonCriticalCache();
        
        // Save current metrics
        await this.saveMetrics();
        
        console.log('🧹 Memory optimized for background state');
      }
    } catch (error) {
      console.warn('Failed to optimize for background state:', error);
    }
  }

  /**
   * Handle inactive state
   */
  private onAppBecameInactive(): void {
    // Pause background sync to save resources
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
  }

  /**
   * Clear non-critical cache data to free memory
   */
  private async clearNonCriticalCache(): Promise<void> {
    try {
      // Keep essential data, clear the rest
      const criticalKeys = [
        'auth_status',
        'wallets_count',
        'app_settings',
      ];

      // This would require extending CacheStorageManager with selective clearing
      // For now, we'll clean expired entries
      await CacheStorageManager.cleanupExpiredCache();
      
    } catch (error) {
      console.warn('Failed to clear non-critical cache:', error);
    }
  }

  /**
   * Get cached data with performance tracking
   */
  public async getCachedData<T>(key: string, fallbackFn?: () => Promise<T>): Promise<T | null> {
    try {
      // Try cache first
      const cached = await CacheStorageManager.getApiCache(key);
      
      if (cached !== null) {
        // Cache hit
        this.updateCacheHitRate(true);
        return cached;
      }

      // Cache miss
      this.updateCacheHitRate(false);

      // Use fallback if provided
      if (fallbackFn) {
        const data = await fallbackFn();
        if (data !== null) {
          // Cache the result for future use
          await CacheStorageManager.storeApiCache(key, data, this.config.cacheExpiryMinutes * 60 * 1000);
        }
        return data;
      }

      return null;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Update cache hit rate metrics
   */
  private updateCacheHitRate(hit: boolean): void {
    // Simple hit rate calculation (could be more sophisticated)
    const currentRate = this.metrics.cacheHitRate;
    const newRate = hit ? Math.min(currentRate + 0.01, 1.0) : Math.max(currentRate - 0.01, 0.0);
    this.metrics.cacheHitRate = newRate;
  }

  /**
   * Optimize wallet switching performance
   */
  public async optimizeWalletSwitch(targetWalletId: string): Promise<void> {
    try {
      console.log(`⚡ Optimizing switch to wallet: ${targetWalletId}`);

      // Preload target wallet data
      const walletData = await SecureStorageManager.getWalletSeed(targetWalletId);
      if (walletData) {
        await CacheStorageManager.storeApiCache(`wallet_seed_${targetWalletId}`, walletData, 10 * 60 * 1000);
      }

      // Preload metadata
      const metadata = await MetadataStorageManager.getWalletMetadata(targetWalletId);
      if (metadata) {
        await CacheStorageManager.storeApiCache(`wallet_meta_${targetWalletId}`, metadata, 15 * 60 * 1000);
      }

      console.log('✅ Wallet switch optimized');
      
    } catch (error) {
      console.warn('Failed to optimize wallet switch:', error);
    }
  }

  /**
   * Schedule periodic performance maintenance
   */
  private schedulePerformanceMaintenance(): void {
    // Run maintenance every hour
    setInterval(() => {
      this.performMaintenance();
    }, 60 * 60 * 1000);
  }

  /**
   * Perform periodic performance maintenance
   */
  private async performMaintenance(): Promise<void> {
    try {
      console.log('🔧 Performing performance maintenance...');

      // Clean expired cache
      await CacheStorageManager.cleanupExpiredCache();
      
      // Update metrics
      this.metrics.lastOptimization = Date.now();
      
      // Save metrics
      await this.saveMetrics();
      
      console.log('✅ Performance maintenance completed');
      
    } catch (error) {
      console.warn('Performance maintenance failed:', error);
    }
  }

  /**
   * Load configuration from storage
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const savedConfig = await AsyncStorage.getItem('@performance_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsedConfig };
      }
    } catch (error) {
      console.warn('Failed to load performance configuration:', error);
    }
  }

  /**
   * Save configuration to storage
   */
  public async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('@performance_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save performance configuration:', error);
    }
  }

  /**
   * Load metrics from storage
   */
  private async loadMetrics(): Promise<void> {
    try {
      const savedMetrics = await AsyncStorage.getItem('@performance_metrics');
      if (savedMetrics) {
        const parsedMetrics = JSON.parse(savedMetrics);
        this.metrics = { ...this.metrics, ...parsedMetrics };
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error);
    }
  }

  /**
   * Save metrics to storage
   */
  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('@performance_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save performance metrics:', error);
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public async updateConfiguration(newConfig: Partial<OptimizationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfiguration();
    
    // Restart background sync with new interval if changed
    if (newConfig.backgroundSyncIntervalMinutes) {
      this.setupBackgroundSync();
    }
    
    console.log('✅ Performance configuration updated');
  }

  /**
   * Force immediate optimization
   */
  public async forceOptimization(): Promise<void> {
    try {
      console.log('🚀 Forcing immediate optimization...');
      
      // Clean expired cache
      await CacheStorageManager.cleanupExpiredCache();
      
      // Refresh critical data
      await this.preloadCriticalData();
      
      // Perform background sync
      await this.performBackgroundSync();
      
      // Update metrics
      this.metrics.lastOptimization = Date.now();
      await this.saveMetrics();
      
      console.log('✅ Forced optimization completed');
      
    } catch (error) {
      console.error('Forced optimization failed:', error);
      throw error;
    }
  }

  /**
   * Get performance status
   */
  public getPerformanceStatus(): {
    initialized: boolean;
    lastOptimization: string;
    cacheHitRate: string;
    backgroundSyncStatus: string;
    startupTime: string;
  } {
    return {
      initialized: this.isInitialized,
      lastOptimization: new Date(this.metrics.lastOptimization).toLocaleString(),
      cacheHitRate: `${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
      backgroundSyncStatus: this.backgroundSyncTimer ? 'Active' : 'Inactive',
      startupTime: `${this.metrics.startupTime}ms`,
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
    
    console.log('🧹 Performance Manager cleaned up');
  }
}

export default PerformanceManager;
