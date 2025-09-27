/**
 * App Lifecycle Manager
 * Handles first launch, updates, authentication flows, and session management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { multiWalletManager } from '../storage/MultiWalletManager';
import { metadataStorage } from '../storage/MetadataStorage';
import { cacheStorage } from '../storage/CacheStorage';
import { secureStorage } from '../storage/SecureStorage';

export interface AppInitializationState {
  isFirstLaunch: boolean;
  isAppInitialized: boolean;
  hasWallets: boolean;
  isLocked: boolean;
  currentVersion: string;
  lastLaunchVersion: string;
  needsUpdate: boolean;
}

class AppLifecycleManager {
  private readonly APP_VERSION_KEY = 'app_version';
  private readonly FIRST_LAUNCH_KEY = 'first_launch_completed';
  private readonly INITIALIZATION_KEY = 'app_initialized';
  private readonly CURRENT_VERSION = '1.0.0'; // Should come from package.json

  private initializationState: AppInitializationState | null = null;

  /**
   * Initialize the app lifecycle system
   */
  async initialize(): Promise<AppInitializationState> {
    try {
      console.log('Initializing app lifecycle...');

      // Check app version and update status
      const lastVersion = await AsyncStorage.getItem(this.APP_VERSION_KEY);
      const needsUpdate = lastVersion !== this.CURRENT_VERSION;

      // Check if this is the first launch
      const firstLaunchCompleted = await AsyncStorage.getItem(this.FIRST_LAUNCH_KEY);
      const isFirstLaunch = firstLaunchCompleted === null;

      // Check if app is initialized
      const appInitialized = await AsyncStorage.getItem(this.INITIALIZATION_KEY);
      const isAppInitialized = appInitialized === 'true';

      // Initialize multi-wallet system
      await multiWalletManager.initialize();

      // Check if we have wallets
      const hasWallets = !(await multiWalletManager.isFirstLaunch());

      // Check if system is locked
      const isLocked = multiWalletManager.isLocked();

      this.initializationState = {
        isFirstLaunch,
        isAppInitialized,
        hasWallets,
        isLocked,
        currentVersion: this.CURRENT_VERSION,
        lastLaunchVersion: lastVersion || '0.0.0',
        needsUpdate,
      };

      // Handle version updates
      if (needsUpdate) {
        await this.handleVersionUpdate(lastVersion || '0.0.0');
      }

      console.log('App lifecycle initialized:', this.initializationState);
      return this.initializationState;
    } catch (error) {
      console.error('Failed to initialize app lifecycle:', error);
      
      // Return safe defaults on error
      return {
        isFirstLaunch: true,
        isAppInitialized: false,
        hasWallets: false,
        isLocked: true,
        currentVersion: this.CURRENT_VERSION,
        lastLaunchVersion: '0.0.0',
        needsUpdate: false,
      };
    }
  }

  /**
   * Complete first launch setup
   */
  async completeFirstLaunch(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FIRST_LAUNCH_KEY, 'true');
      await AsyncStorage.setItem(this.INITIALIZATION_KEY, 'true');
      await AsyncStorage.setItem(this.APP_VERSION_KEY, this.CURRENT_VERSION);
      
      if (this.initializationState) {
        this.initializationState.isFirstLaunch = false;
        this.initializationState.isAppInitialized = true;
      }
      
      console.log('First launch completed');
    } catch (error) {
      console.error('Failed to complete first launch:', error);
    }
  }

  /**
   * Handle app version updates
   */
  private async handleVersionUpdate(fromVersion: string): Promise<void> {
    try {
      console.log(`Updating app from version ${fromVersion} to ${this.CURRENT_VERSION}`);

      // Clear cache on major updates
      if (this.isMajorUpdate(fromVersion)) {
        await cacheStorage.clearAllCache();
        console.log('Cleared cache for major update');
      }

      // Run migration scripts based on version
      await this.runMigrations(fromVersion);

      // Update version
      await AsyncStorage.setItem(this.APP_VERSION_KEY, this.CURRENT_VERSION);
      
      console.log('Version update completed');
    } catch (error) {
      console.error('Failed to handle version update:', error);
    }
  }

  /**
   * Check if this is a major version update
   */
  private isMajorUpdate(fromVersion: string): boolean {
    const fromMajor = parseInt(fromVersion.split('.')[0]) || 0;
    const currentMajor = parseInt(this.CURRENT_VERSION.split('.')[0]) || 0;
    return currentMajor > fromMajor;
  }

  /**
   * Run migration scripts for version updates
   */
  private async runMigrations(fromVersion: string): Promise<void> {
    try {
      // Example migrations
      if (fromVersion < '1.0.0') {
        // Migration logic for pre-1.0.0 versions
        console.log('Running migrations for pre-1.0.0');
      }

      // Add more migrations as needed
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  /**
   * Get current initialization state
   */
  getInitializationState(): AppInitializationState | null {
    return this.initializationState;
  }

  /**
   * Determine which screen to show on app launch
   */
  getInitialScreen(): 'onboarding' | 'authentication' | 'home' | 'multiWalletHome' {
    if (!this.initializationState) {
      return 'onboarding';
    }

    const { isFirstLaunch, hasWallets, isLocked } = this.initializationState;

    if (isFirstLaunch || !hasWallets) {
      return 'onboarding';
    }

    if (isLocked) {
      return 'authentication';
    }

    // Use multi-wallet home if multiple wallets exist
    return 'multiWalletHome';
  }

  /**
   * Handle app backgrounding
   */
  async handleAppBackground(): Promise<void> {
    try {
      // Auto-lock after timeout
      const preferences = await metadataStorage.getUserPreferences();
      if (preferences?.autoLockTimeout) {
        setTimeout(async () => {
          await multiWalletManager.lock();
        }, preferences.autoLockTimeout * 60 * 1000); // Convert minutes to milliseconds
      }

      // Clear sensitive cache
      await cacheStorage.clearExpiredCache();
    } catch (error) {
      console.error('Failed to handle app background:', error);
    }
  }

  /**
   * Handle app foreground
   */
  async handleAppForeground(): Promise<void> {
    try {
      // Check if session expired
      const appState = await metadataStorage.getAppState();
      if (appState && Date.now() > appState.sessionExpires) {
        await multiWalletManager.lock();
      }

      // Refresh data if needed
      await cacheStorage.clearExpiredCache();
    } catch (error) {
      console.error('Failed to handle app foreground:', error);
    }
  }

  /**
   * Reset entire app (for testing or factory reset)
   */
  async resetApp(): Promise<void> {
    try {
      console.log('Resetting entire app...');

      // Clear all storage tiers
      await secureStorage.clearAll();
      await metadataStorage.clearAllMetadata();
      await cacheStorage.clearAllCache();

      // Clear app lifecycle data
      await AsyncStorage.multiRemove([
        this.APP_VERSION_KEY,
        this.FIRST_LAUNCH_KEY,
        this.INITIALIZATION_KEY,
      ]);

      // Reset initialization state
      this.initializationState = null;

      console.log('App reset completed');
    } catch (error) {
      console.error('Failed to reset app:', error);
      throw new Error('App reset failed');
    }
  }

  /**
   * Get app statistics for debugging
   */
  async getAppStats(): Promise<{
    version: string;
    firstLaunch: boolean;
    initialized: boolean;
    walletCount: number;
    storageStats: any;
  }> {
    try {
      const storageStats = await multiWalletManager.getStorageStats();
      
      return {
        version: this.CURRENT_VERSION,
        firstLaunch: this.initializationState?.isFirstLaunch || false,
        initialized: this.initializationState?.isAppInitialized || false,
        walletCount: storageStats.secureWallets,
        storageStats,
      };
    } catch (error) {
      console.error('Failed to get app stats:', error);
      return {
        version: this.CURRENT_VERSION,
        firstLaunch: true,
        initialized: false,
        walletCount: 0,
        storageStats: null,
      };
    }
  }
}

export const appLifecycleManager = new AppLifecycleManager();
