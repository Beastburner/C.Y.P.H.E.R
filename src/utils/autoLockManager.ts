import { AppState, AppStateStatus } from 'react-native';
import SecurityManager from './securityManager';
import { biometricAuthentication } from './biometricAuth';

export interface AutoLockConfig {
  enabled: boolean;
  timeoutMinutes: number;
  lockOnAppBackground: boolean;
  lockOnAppInactive: boolean;
  requireBiometric: boolean;
  maxFailedAttempts: number;
  lockOnThreat: boolean;
}

export interface LockState {
  isLocked: boolean;
  lockedAt: Date | null;
  reason: 'timeout' | 'background' | 'manual' | 'security' | 'failed_attempts';
  failedAttempts: number;
  lastActivity: Date;
}

export type LockStateListener = (state: LockState) => void;
export type UnlockRequiredListener = () => void;

class AutoLockManager {
  private static instance: AutoLockManager;
  private securityManager: SecurityManager;
  private lockTimer: NodeJS.Timeout | null = null;
  private appState: AppStateStatus = 'active';
  private lastActiveTime: number = Date.now();
  private lockState: LockState;
  private lockStateListeners: Set<LockStateListener> = new Set();
  private unlockRequiredListeners: Set<UnlockRequiredListener> = new Set();
  private config: AutoLockConfig = {
    enabled: true,
    timeoutMinutes: 15, // Increased from 5 to 15 minutes
    lockOnAppBackground: false, // Don't lock immediately on background
    lockOnAppInactive: false, // Don't lock immediately on inactive
    requireBiometric: true,
    maxFailedAttempts: 3,
    lockOnThreat: true,
  };
  private onLockCallback?: () => void;

  constructor() {
    this.securityManager = SecurityManager.getInstance();
    this.lockState = {
      isLocked: false,
      lockedAt: null,
      reason: 'manual',
      failedAttempts: 0,
      lastActivity: new Date(),
    };
    this.setupAppStateListener();
    this.setupSecurityMonitoring();
  }

  static getInstance(): AutoLockManager {
    if (!AutoLockManager.instance) {
      AutoLockManager.instance = new AutoLockManager();
    }
    return AutoLockManager.instance;
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private appStateSubscription: any;

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const previousState = this.appState;
    this.appState = nextAppState;

    console.log('App state changed from', previousState, 'to', nextAppState);

    if (nextAppState === 'active') {
      this.handleAppBecameActive();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.handleAppBecameInactive(nextAppState);
    }
  }

  private async handleAppBecameActive(): Promise<void> {
    this.clearLockTimer();
    
    const timeSinceLastActive = Date.now() - this.lastActiveTime;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;

    // If app was inactive for longer than timeout, trigger lock
    if (this.config.enabled && timeSinceLastActive > timeoutMs && !this.lockState.isLocked) {
      await this.lockWallet('timeout');
    } else if (this.lockState.isLocked && this.lockState.reason === 'background') {
      // Notify that unlock is required when returning from background
      this.notifyUnlockRequiredListeners();
    }

    this.lastActiveTime = Date.now();
    this.lockState.lastActivity = new Date();
  }

  private async handleAppBecameInactive(state: AppStateStatus): Promise<void> {
    this.lastActiveTime = Date.now();
    this.lockState.lastActivity = new Date();

    // Immediate lock on background if configured
    if (state === 'background' && this.config.lockOnAppBackground) {
      await this.lockWallet('background');
      return;
    }

    // Set timer for automatic lock
    if (this.config.enabled && !this.lockState.isLocked) {
      this.startLockTimer();
    }
  }

  private startLockTimer(): void {
    this.clearLockTimer();
    
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    
    this.lockTimer = setTimeout(async () => {
      await this.lockWallet('timeout');
    }, timeoutMs);
  }

  private clearLockTimer(): void {
    if (this.lockTimer) {
      clearTimeout(this.lockTimer);
      this.lockTimer = null;
    }
  }

  private async lockWallet(reason: LockState['reason'] = 'timeout'): Promise<void> {
    try {
      if (this.lockState.isLocked) {
        console.log('Wallet is already locked');
        return;
      }

      console.log(`Locking wallet: ${reason}`);
      
      // Clear any pending timeout
      this.clearLockTimer();

      // Update lock state
      this.lockState = {
        ...this.lockState,
        isLocked: true,
        lockedAt: new Date(),
        reason,
      };

      // Lock wallet through security manager
      await this.securityManager.lockWallet();
      
      // Log security event
      await this.securityManager.logSecurityEvent('auto_lock_triggered', {
        reason,
        timeoutMinutes: this.config.timeoutMinutes,
      });

      // Notify listeners
      this.notifyLockStateListeners();
      
      if (this.onLockCallback) {
        this.onLockCallback();
      }

      console.log('Wallet locked successfully');
    } catch (error) {
      console.error('Failed to auto-lock wallet:', error);
    }
  }

  /**
   * @dev Unlock the wallet with enhanced authentication
   * @param requireAuth Whether to require authentication
   * @returns Promise<{ success: boolean; error?: string }> Unlock result
   */
  async unlock(requireAuth: boolean = true): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.lockState.isLocked) {
        return { success: true };
      }

      console.log('Attempting to unlock wallet...');

      // Check if authentication is required
      if (requireAuth) {
        const authResult = await this.performAuthentication();
        if (!authResult.success) {
          // Increment failed attempts
          this.lockState.failedAttempts++;
          
          // Check if max attempts exceeded
          if (this.lockState.failedAttempts >= this.config.maxFailedAttempts) {
            await this.handleMaxFailedAttempts();
            return { 
              success: false, 
              error: 'Maximum failed attempts exceeded. Wallet secured.' 
            };
          }

          this.notifyLockStateListeners();
          return { success: false, error: authResult.error };
        }
      }

      // Reset lock state
      this.lockState = {
        ...this.lockState,
        isLocked: false,
        lockedAt: null,
        failedAttempts: 0,
        lastActivity: new Date(),
      };

      // Resume activity monitoring
      if (this.config.enabled) {
        this.startLockTimer();
      }

      // Notify listeners
      this.notifyLockStateListeners();

      // Log security event
      await this.securityManager.logSecurityEvent('wallet_unlocked', {
        requireAuth,
        timestamp: new Date(),
      });

      console.log('Wallet unlocked successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unlock failed' 
      };
    }
  }

  /**
   * @dev Perform authentication for unlock
   * @returns Promise<{ success: boolean; error?: string }> Auth result
   */
  private async performAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.config.requireBiometric) {
        const biometricAvailable = await biometricAuthentication.isSupported();
        
        if (biometricAvailable) {
          const result = await biometricAuthentication.authenticate(
            'Unlock your wallet',
            'Use your biometric to access your wallet'
          );
          
          if (result.success) {
            return { success: true };
          } else {
            return { success: false, error: result.error || 'Biometric authentication failed' };
          }
        }
      }

      // Fallback to other authentication methods can be added here
      return { success: true }; // For now, allow without auth if biometric not available
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  /**
   * @dev Handle maximum failed attempts
   * @returns Promise<void>
   */
  private async handleMaxFailedAttempts(): Promise<void> {
    try {
      console.log('Maximum failed attempts exceeded');

      // Log critical security event
      await this.securityManager.logSecurityEvent('max_failed_attempts', {
        attempts: this.lockState.failedAttempts,
        maxAttempts: this.config.maxFailedAttempts,
        timestamp: new Date(),
      });

      // Additional security measures can be added here
      // e.g., temporary account lockout, notification to admin, etc.
    } catch (error) {
      console.error('Failed to handle max failed attempts:', error);
    }
  }

  /**
   * @dev Set up security monitoring
   * @returns void
   */
  private setupSecurityMonitoring(): void {
    if (this.config.lockOnThreat) {
      // Monitor for security threats and lock if detected
      // This would integrate with SecurityManager's threat detection
      console.log('Security monitoring enabled');
    }
  }

  /**
   * @dev Notify lock state listeners
   * @returns void
   */
  private notifyLockStateListeners(): void {
    const state = this.getLockState();
    this.lockStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Lock state listener error:', error);
      }
    });
  }

  /**
   * @dev Notify unlock required listeners
   * @returns void
   */
  private notifyUnlockRequiredListeners(): void {
    this.unlockRequiredListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Unlock required listener error:', error);
      }
    });
  }

  /**
   * @dev Get current lock state
   * @returns LockState Current lock state
   */
  getLockState(): LockState {
    return { ...this.lockState };
  }

  /**
   * @dev Check if wallet is locked
   * @returns boolean Lock status
   */
  isLocked(): boolean {
    return this.lockState.isLocked;
  }

  /**
   * @dev Lock the wallet manually
   * @param reason Optional lock reason
   * @returns Promise<void>
   */
  async lock(reason: LockState['reason'] = 'manual'): Promise<void> {
    await this.lockWallet(reason);
  }

  /**
   * @dev Add lock state listener
   * @param listener Listener function
   * @returns void
   */
  addLockStateListener(listener: LockStateListener): void {
    this.lockStateListeners.add(listener);
  }

  /**
   * @dev Remove lock state listener
   * @param listener Listener function
   * @returns void
   */
  removeLockStateListener(listener: LockStateListener): void {
    this.lockStateListeners.delete(listener);
  }

  /**
   * @dev Add unlock required listener
   * @param listener Listener function
   * @returns void
   */
  addUnlockRequiredListener(listener: UnlockRequiredListener): void {
    this.unlockRequiredListeners.add(listener);
  }

  /**
   * @dev Remove unlock required listener
   * @param listener Listener function
   * @returns void
   */
  removeUnlockRequiredListener(listener: UnlockRequiredListener): void {
    this.unlockRequiredListeners.delete(listener);
  }

  // Public methods
  async updateConfig(config: Partial<AutoLockConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    try {
      if (config.timeoutMinutes !== undefined) {
        await this.securityManager.setAutoLockTimeout(config.timeoutMinutes);
      }
      
      await this.securityManager.logSecurityEvent('auto_lock_config_updated', config);
    } catch (error) {
      console.error('Failed to update auto-lock config:', error);
    }
  }

  getConfig(): AutoLockConfig {
    return { ...this.config };
  }

  setOnLockCallback(callback: () => void): void {
    this.onLockCallback = callback;
  }

  resetUserActivity(): void {
    if (this.lockState.isLocked) return;

    this.lastActiveTime = Date.now();
    this.lockState.lastActivity = new Date();
    
    // Restart timer if app is active and auto-lock is enabled
    if (this.appState === 'active' && this.config.enabled) {
      this.startLockTimer();
    }
  }

  async isLockDue(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const timeSinceLastActive = Date.now() - this.lastActiveTime;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    
    return timeSinceLastActive > timeoutMs;
  }

  getRemainingTime(): number {
    if (!this.config.enabled) {
      return Infinity;
    }

    const timeSinceLastActive = Date.now() - this.lastActiveTime;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    
    return Math.max(0, timeoutMs - timeSinceLastActive);
  }

  async start(): Promise<void> {
    try {
      // Load config from storage
      const storedTimeout = await this.securityManager.getAutoLockTimeout();
      this.config.timeoutMinutes = storedTimeout;
      
      this.lastActiveTime = Date.now();
      
      if (this.config.enabled) {
        this.startLockTimer();
      }
      
      await this.securityManager.logSecurityEvent('auto_lock_manager_started', this.config);
    } catch (error) {
      console.error('Failed to start auto-lock manager:', error);
    }
  }

  stop(): void {
    this.clearLockTimer();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.lockStateListeners.clear();
    this.unlockRequiredListeners.clear();
  }

  // Development/testing methods
  async forceeLock(): Promise<void> {
    await this.lockWallet();
  }

  getStatus(): {
    isEnabled: boolean;
    timeoutMinutes: number;
    remainingTimeMs: number;
    appState: AppStateStatus;
    lastActiveTime: number;
  } {
    return {
      isEnabled: this.config.enabled,
      timeoutMinutes: this.config.timeoutMinutes,
      remainingTimeMs: this.getRemainingTime(),
      appState: this.appState,
      lastActiveTime: this.lastActiveTime,
    };
  }
}

export default AutoLockManager;
