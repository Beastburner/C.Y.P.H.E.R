/**
 * ECLIPTA Navigation Service
 * 
 * Comprehensive navigation management for all revolutionary wallet features.
 * Handles routing to DeFi Dashboard, Advanced Swap, NFT Management, and more.
 */

import { Alert } from 'react-native';

export interface NavigationParams {
  // DeFi Navigation
  DeFiDashboard?: {
    userAddress?: string;
    initialTab?: 'overview' | 'positions' | 'opportunities' | 'analytics';
  };
  SwapScreen?: {
    fromToken?: string;
    toToken?: string;
    amount?: string;
  };
  YieldFarmingScreen?: {
    protocol?: string;
    poolId?: string;
  };
  StakingScreen?: {
    token?: string;
    validator?: string;
  };
  
  // NFT Navigation
  NFTScreen?: {
    initialTab?: 'owned' | 'collections' | 'activity' | 'marketplace';
    collectionId?: string;
  };
  NFTDashboard?: {
    userAddress?: string;
  };
  NFTMarketplaceScreen?: {
    category?: string;
    sortBy?: string;
  };
  
  // Wallet Management
  WalletManagement?: {
    action?: 'create' | 'import' | 'backup' | 'recovery';
  };
  Send?: {
    toAddress?: string;
    amount?: string;
    token?: string;
  };
  Receive?: {
    token?: string;
  };
  
  // Security & Privacy
  Security?: {
    action?: 'backup' | 'recovery' | 'settings';
  };
  Privacy?: {
    feature?: 'shielded' | 'mixer' | 'anonymous';
  };
  
  // Cross-chain
  CrossChain?: {
    fromChain?: string;
    toChain?: string;
    token?: string;
  };
  
  // Settings & Configuration
  Settings?: {
    section?: 'general' | 'security' | 'privacy' | 'networks';
  };
  
  // Authentication
  Authentication?: {
    action?: 'unlock' | 'setup' | 'biometrics';
  };
}

export type ScreenName = keyof NavigationParams;

export class NavigationService {
  private static instance: NavigationService;
  private navigationHandler: ((screen: ScreenName, params?: any) => void) | null = null;

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  setNavigationHandler(handler: (screen: ScreenName, params?: any) => void) {
    this.navigationHandler = handler;
  }

  navigate(screen: ScreenName, params?: NavigationParams[ScreenName]) {
    if (!this.navigationHandler) {
      console.warn('Navigation handler not set');
      return;
    }

    // Validate navigation and handle special cases
    switch (screen) {
      case 'DeFiDashboard':
        this.navigateToDeFi(params as NavigationParams['DeFiDashboard']);
        break;
      
      case 'SwapScreen':
        this.navigateToSwap(params as NavigationParams['SwapScreen']);
        break;
      
      case 'NFTScreen':
        this.navigateToNFT(params as NavigationParams['NFTScreen']);
        break;
      
      case 'WalletManagement':
        this.navigateToWalletManagement(params as NavigationParams['WalletManagement']);
        break;
      
      default:
        this.navigationHandler(screen, params);
        break;
    }
  }

  private navigateToDeFi(params?: NavigationParams['DeFiDashboard']) {
    if (!this.navigationHandler) return;

    // Check if wallet is connected
    if (!this.isWalletConnected()) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to access DeFi features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => this.navigate('Authentication') }
        ]
      );
      return;
    }

    this.navigationHandler('DeFiDashboard', {
      userAddress: params?.userAddress || this.getCurrentWalletAddress(),
      initialTab: params?.initialTab || 'overview'
    });
  }

  private navigateToSwap(params?: NavigationParams['SwapScreen']) {
    if (!this.navigationHandler) return;

    // Check if wallet is connected
    if (!this.isWalletConnected()) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to access swap features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => this.navigate('Authentication') }
        ]
      );
      return;
    }

    this.navigationHandler('SwapScreen', {
      fromToken: params?.fromToken || 'ETH',
      toToken: params?.toToken || 'USDC',
      amount: params?.amount || ''
    });
  }

  private navigateToNFT(params?: NavigationParams['NFTScreen']) {
    if (!this.navigationHandler) return;

    // Check if wallet is connected
    if (!this.isWalletConnected()) {
      Alert.alert(
        'Wallet Required',
        'Please connect your wallet to view your NFT collection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: () => this.navigate('Authentication') }
        ]
      );
      return;
    }

    this.navigationHandler('NFTScreen', {
      initialTab: params?.initialTab || 'owned',
      collectionId: params?.collectionId
    });
  }

  private navigateToWalletManagement(params?: NavigationParams['WalletManagement']) {
    if (!this.navigationHandler) return;

    const action = params?.action || 'create';
    
    switch (action) {
      case 'create':
        this.navigationHandler('WalletManagement', { action: 'create' });
        break;
      
      case 'import':
        this.navigationHandler('WalletManagement', { action: 'import' });
        break;
      
      case 'backup':
        if (!this.isWalletConnected()) {
          Alert.alert('No Wallet', 'Please create or import a wallet first.');
          return;
        }
        this.navigationHandler('WalletManagement', { action: 'backup' });
        break;
      
      case 'recovery':
        this.navigationHandler('WalletManagement', { action: 'recovery' });
        break;
      
      default:
        this.navigationHandler('WalletManagement', params);
        break;
    }
  }

  // Quick navigation methods for common actions
  goToDeFiDashboard(initialTab?: 'overview' | 'positions' | 'opportunities' | 'analytics') {
    this.navigate('DeFiDashboard', { initialTab });
  }

  goToSwap(fromToken?: string, toToken?: string) {
    this.navigate('SwapScreen', { fromToken, toToken });
  }

  goToNFTs(initialTab?: 'owned' | 'collections' | 'activity' | 'marketplace') {
    this.navigate('NFTScreen', { initialTab });
  }

  goToSend(toAddress?: string, amount?: string, token?: string) {
    this.navigate('Send', { toAddress, amount, token });
  }

  goToReceive(token?: string) {
    this.navigate('Receive', { token });
  }

  goToSettings(section?: 'general' | 'security' | 'privacy' | 'networks') {
    this.navigate('Settings', { section });
  }

  // Navigation with confirmation dialogs
  navigateWithConfirmation(
    screen: ScreenName, 
    params?: NavigationParams[ScreenName], 
    title?: string, 
    message?: string
  ) {
    Alert.alert(
      title || 'Confirm Navigation',
      message || `Navigate to ${screen}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => this.navigate(screen, params) }
      ]
    );
  }

  // Feature availability checks
  isDeFiAvailable(): boolean {
    return this.isWalletConnected() && this.isNetworkSupported();
  }

  isNFTAvailable(): boolean {
    return this.isWalletConnected() && this.isNetworkSupported();
  }

  isSwapAvailable(): boolean {
    return this.isWalletConnected() && this.isNetworkSupported();
  }

  isCrossChainAvailable(): boolean {
    return this.isWalletConnected() && this.isNetworkSupported();
  }

  // Helper methods
  private isWalletConnected(): boolean {
    // This would check if a wallet is actually connected
    // For now, return true for development
    return true;
  }

  private isNetworkSupported(): boolean {
    // This would check if the current network supports the feature
    // For now, return true for development
    return true;
  }

  private getCurrentWalletAddress(): string {
    // This would return the actual wallet address
    // For now, return a mock address
    return '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E';
  }

  // Advanced navigation features
  navigateToYieldFarming(protocol?: string, poolId?: string) {
    if (!this.isDeFiAvailable()) {
      Alert.alert('DeFi Unavailable', 'Please connect your wallet and ensure you\'re on a supported network.');
      return;
    }
    this.navigate('YieldFarmingScreen', { protocol, poolId });
  }

  navigateToStaking(token?: string, validator?: string) {
    if (!this.isDeFiAvailable()) {
      Alert.alert('Staking Unavailable', 'Please connect your wallet and ensure you\'re on a supported network.');
      return;
    }
    this.navigate('StakingScreen', { token, validator });
  }

  navigateToNFTMarketplace(category?: string, sortBy?: string) {
    if (!this.isNFTAvailable()) {
      Alert.alert('NFT Marketplace Unavailable', 'Please connect your wallet and ensure you\'re on a supported network.');
      return;
    }
    this.navigate('NFTMarketplaceScreen', { category, sortBy });
  }

  navigateToCrossChain(fromChain?: string, toChain?: string, token?: string) {
    if (!this.isCrossChainAvailable()) {
      Alert.alert('Cross-chain Unavailable', 'Please connect your wallet and ensure you\'re on a supported network.');
      return;
    }
    this.navigate('CrossChain', { fromChain, toChain, token });
  }

  navigateToPrivacy(feature?: 'shielded' | 'mixer' | 'anonymous') {
    if (!this.isWalletConnected()) {
      Alert.alert('Privacy Features Unavailable', 'Please connect your wallet to access privacy features.');
      return;
    }
    this.navigate('Privacy', { feature });
  }

  // Emergency and backup navigation
  navigateToEmergencyBackup() {
    Alert.alert(
      '🚨 Emergency Backup',
      'Create an emergency backup of your wallet now?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Backup Now', onPress: () => this.navigate('WalletManagement', { action: 'backup' }) }
      ]
    );
  }

  navigateToRecovery() {
    Alert.alert(
      '🔑 Wallet Recovery',
      'Start wallet recovery process?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Recover', onPress: () => this.navigate('WalletManagement', { action: 'recovery' }) }
      ]
    );
  }

  // Revolutionary features navigation
  navigateToAIAdvisor() {
    Alert.alert(
      '🤖 AI Trading Advisor',
      'This revolutionary feature is coming soon!\n\nGet personalized trading advice powered by advanced AI.',
      [{ text: 'OK' }]
    );
  }

  navigateToQuantumSecurity() {
    Alert.alert(
      '🔐 Quantum Security',
      'This revolutionary feature is coming soon!\n\nQuantum-resistant encryption for ultimate security.',
      [{ text: 'OK' }]
    );
  }

  navigateToMetaverseIntegration() {
    Alert.alert(
      '🌐 Metaverse Integration',
      'This revolutionary feature is coming soon!\n\nSeamless wallet integration with metaverse platforms.',
      [{ text: 'OK' }]
    );
  }
}

// Export singleton instance
export const navigationService = NavigationService.getInstance();
