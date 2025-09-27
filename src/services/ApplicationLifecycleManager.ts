/**
 * Application Lifecycle Manager
 * Handles app initialization, authentication, and different startup flows
 */

import { AppState as RNAppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SecureStorageManager from './storage/SecureStorageManager';
import MetadataStorageManager, { AppSettings } from './storage/MetadataStorageManager';
import MultiWalletManager from './MultiWalletManager';

export type AppFlow = 'onboarding' | 'authentication' | 'main';
export type AuthMethod = 'password' | 'pin' | 'biometric' | 'none';

export interface AppLifecycleState {
  isFirstInstall: boolean;
  hasWallets: boolean;
  isAuthenticated: boolean;
  currentFlow: AppFlow;
  authMethod: AuthMethod;
  sessionActive: boolean;
  sessionExpiresAt: number;
  lastBackgroundTime: number;
}

export interface InitializationResult {
  flow: AppFlow;
  state: AppLifecycleState;
}

export class ApplicationLifecycleManager {
  private static instance: ApplicationLifecycleManager;
  private appState: AppLifecycleState = {
    isFirstInstall: true,
    hasWallets: false,
    isAuthenticated: false,
    currentFlow: 'onboarding',
    authMethod: 'none',
    sessionActive: false,
    sessionExpiresAt: 0,
    lastBackgroundTime: 0
  };

  private multiWalletManager: MultiWalletManager;
  private sessionTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    this.multiWalletManager = new MultiWalletManager();
    this.setupAppStateListener();
  }

  public static getInstance(): ApplicationLifecycleManager {
    if (!ApplicationLifecycleManager.instance) {
      ApplicationLifecycleManager.instance = new ApplicationLifecycleManager();
    }
    return ApplicationLifecycleManager.instance;
  }

  /**
   * Initialize the application and determine startup flow
   */
  public async initialize(): Promise<InitializationResult> {
    try {
      // Initialize storage systems
      await SecureStorageManager.initialize();
      await MetadataStorageManager.initialize();
      await this.multiWalletManager.initialize();

      // Check app installation status
      await this.checkInstallationStatus();

      // Determine startup flow
      const flow = await this.determineStartupFlow();
      this.appState.currentFlow = flow;

      return {
        flow,
        state: { ...this.appState }
      };
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw new Error('Application initialization failed');
    }
  }

  /**
   * Handle first-time app setup
   */
  public async handleFirstInstall(): Promise<void> {
    try {
      const now = Date.now();

      // Create initial app settings
      const initialSettings: AppSettings = {
        currentWalletId: null,
        authMethod: 'password',
        autoLockEnabled: true,
        autoLockTimeout: 300000, // 5 minutes
        biometricEnabled: false,
        sessionTimeout: 900000, // 15 minutes
        securityWarningsEnabled: true,
        backupRemindersEnabled: true,
        lastBackupTime: 0,
        appVersion: '1.0.0',
        firstInstallTime: now,
        updatedAt: now
      };

      await MetadataStorageManager.storeAppSettings(initialSettings);
      await AsyncStorage.setItem('FIRST_INSTALL_COMPLETE', 'true');

      this.appState.isFirstInstall = false;
    } catch (error) {
      console.error('Failed to handle first install:', error);
      throw new Error('First install setup failed');
    }
  }

  /**
   * Authenticate user with various methods
   */
  public async authenticate(method: AuthMethod, credential: string): Promise<boolean> {
    try {
      const authData = await SecureStorageManager.getAuthenticationData();
      
      if (!authData) {
        throw new Error('No authentication data found');
      }

      let isValid = false;

      switch (method) {
        case 'password':
        case 'pin':
          // Simple hash comparison (in production, use proper password hashing)
          const crypto = require('crypto-js');
          const hashedCredential = crypto.SHA256(credential + authData.salt).toString();
          isValid = hashedCredential === authData.passwordHash;
          break;

        case 'biometric':
          // Biometric authentication handled by the calling component
          isValid = credential === 'success';
          break;

        default:
          isValid = false;
      }

      if (isValid) {
        await this.startSession();
        this.appState.isAuthenticated = true;
        this.appState.currentFlow = 'main';
      }

      return isValid;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  /**
   * Set up authentication for the first time
   */
  public async setupAuthentication(method: AuthMethod, credential: string): Promise<void> {
    try {
      // Skip 'none' method for authentication setup
      if (method === 'none') {
        throw new Error('Cannot setup authentication with none method');
      }

      const crypto = require('crypto-js');
      const salt = crypto.lib.WordArray.random(128/8).toString(crypto.enc.Hex);
      const passwordHash = crypto.SHA256(credential + salt).toString();

      const authData = {
        passwordHash,
        salt,
        authMethod: method as 'password' | 'pin' | 'biometric',
        createdAt: Date.now(),
        lastUpdated: Date.now()
      };

      await SecureStorageManager.storeAuthenticationData(authData);

      // Update app settings
      const appSettings = await MetadataStorageManager.getAppSettings();
      if (appSettings) {
        appSettings.authMethod = method as 'password' | 'pin' | 'biometric';
        appSettings.updatedAt = Date.now();
        await MetadataStorageManager.storeAppSettings(appSettings);
      }

      this.appState.authMethod = method;
    } catch (error) {
      console.error('Failed to setup authentication:', error);
      throw new Error('Authentication setup failed');
    }
  }

  /**
   * Start authenticated session
   */
  public async startSession(): Promise<void> {
    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      const sessionTimeout = appSettings?.sessionTimeout || 900000; // 15 minutes default

      this.appState.sessionActive = true;
      this.appState.sessionExpiresAt = Date.now() + sessionTimeout;

      // Clear existing timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
      }

      // Set session expiration timer
      this.sessionTimer = setTimeout(async () => {
        await this.endSession();
      }, sessionTimeout);

    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * End authenticated session
   */
  public async endSession(): Promise<void> {
    try {
      this.appState.sessionActive = false;
      this.appState.isAuthenticated = false;
      this.appState.sessionExpiresAt = 0;
      this.appState.currentFlow = 'authentication';

      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      // Clear sensitive data from memory if needed
      // This would trigger a re-authentication flow in the UI
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Extend current session
   */
  public async extendSession(): Promise<void> {
    if (!this.appState.sessionActive) {
      return;
    }

    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      const sessionTimeout = appSettings?.sessionTimeout || 900000;

      this.appState.sessionExpiresAt = Date.now() + sessionTimeout;

      // Reset timer
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
      }

      this.sessionTimer = setTimeout(async () => {
        await this.endSession();
      }, sessionTimeout);

    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }

  /**
   * Handle app update scenarios
   */
  public async handleAppUpdate(newVersion: string): Promise<void> {
    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      
      if (appSettings && appSettings.appVersion !== newVersion) {
        // Perform data migration if needed
        await this.migrateDataForVersion(appSettings.appVersion, newVersion);

        // Update version
        appSettings.appVersion = newVersion;
        appSettings.updatedAt = Date.now();
        await MetadataStorageManager.storeAppSettings(appSettings);
      }
    } catch (error) {
      console.error('Failed to handle app update:', error);
    }
  }

  /**
   * Handle app going to background
   */
  public async handleAppBackground(): Promise<void> {
    try {
      this.appState.lastBackgroundTime = Date.now();

      const appSettings = await MetadataStorageManager.getAppSettings();
      
      // If auto-lock is enabled, end session when app goes to background
      if (appSettings?.autoLockEnabled) {
        await this.endSession();
      }
    } catch (error) {
      console.error('Failed to handle app background:', error);
    }
  }

  /**
   * Handle app returning from background
   */
  public async handleAppForeground(): Promise<AppFlow> {
    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      const backgroundDuration = Date.now() - this.appState.lastBackgroundTime;

      // Check if session should be ended due to background time
      if (appSettings?.autoLockEnabled && backgroundDuration > (appSettings.autoLockTimeout || 300000)) {
        await this.endSession();
      }

      // Check if session has naturally expired
      if (this.appState.sessionActive && Date.now() > this.appState.sessionExpiresAt) {
        await this.endSession();
      }

      return this.appState.currentFlow;
    } catch (error) {
      console.error('Failed to handle app foreground:', error);
      return 'authentication';
    }
  }

  /**
   * Get current app state
   */
  public getAppState(): AppLifecycleState {
    return { ...this.appState };
  }

  /**
   * Get multi-wallet manager instance
   */
  public getMultiWalletManager(): MultiWalletManager {
    return this.multiWalletManager;
  }

  /**
   * Check if user needs to create backup
   */
  public async shouldPromptBackup(): Promise<boolean> {
    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      
      if (!appSettings?.backupRemindersEnabled) {
        return false;
      }

      const lastBackupTime = appSettings.lastBackupTime || 0;
      const daysSinceBackup = (Date.now() - lastBackupTime) / (1000 * 60 * 60 * 24);

      // Prompt backup if no backup for 7 days
      return daysSinceBackup > 7;
    } catch (error) {
      return false;
    }
  }

  /**
   * Record backup completion
   */
  public async recordBackupCompleted(): Promise<void> {
    try {
      const appSettings = await MetadataStorageManager.getAppSettings();
      
      if (appSettings) {
        appSettings.lastBackupTime = Date.now();
        appSettings.updatedAt = Date.now();
        await MetadataStorageManager.storeAppSettings(appSettings);
      }
    } catch (error) {
      console.error('Failed to record backup completion:', error);
    }
  }

  /**
   * Cleanup and shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      if (this.sessionTimer) {
        clearTimeout(this.sessionTimer);
        this.sessionTimer = null;
      }

      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }

      await this.endSession();
    } catch (error) {
      console.error('Failed to shutdown application lifecycle manager:', error);
    }
  }

  // Private methods

  private async checkInstallationStatus(): Promise<void> {
    try {
      const firstInstallComplete = await AsyncStorage.getItem('FIRST_INSTALL_COMPLETE');
      const hasWallets = await this.multiWalletManager.hasWallets();
      const authData = await SecureStorageManager.getAuthenticationData();

      this.appState.isFirstInstall = !firstInstallComplete;
      this.appState.hasWallets = hasWallets;
      this.appState.authMethod = authData?.authMethod || 'none';
    } catch (error) {
      console.error('Failed to check installation status:', error);
    }
  }

  private async determineStartupFlow(): Promise<AppFlow> {
    // First install flow
    if (this.appState.isFirstInstall) {
      return 'onboarding';
    }

    // No wallets exist (somehow lost) - back to onboarding
    if (!this.appState.hasWallets) {
      return 'onboarding';
    }

    // Has wallets but needs authentication
    if (this.appState.authMethod !== 'none') {
      return 'authentication';
    }

    // Ready to go to main app
    return 'main';
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = RNAppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        this.handleAppBackground().catch(console.error);
      } else if (nextAppState === 'active') {
        this.handleAppForeground().catch(console.error);
      }
    });
  }

  private async migrateDataForVersion(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
    
    // Future data migrations will be implemented here
    // For now, no migration needed as this is the initial version
    
    try {
      // Example migration logic:
      // if (fromVersion < '2.0.0' && toVersion >= '2.0.0') {
      //   await this.migrateTo2_0_0();
      // }
    } catch (error) {
      console.error('Data migration failed:', error);
      // Migration failure is not critical, continue with current data
    }
  }
}

export default ApplicationLifecycleManager;
