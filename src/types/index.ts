/**
 * Cypher Wallet - Ultimate Type Definitions
 * The most comprehensive Ethereum wallet type system
 */

// ====================
// CORE WALLET TYPES
// ====================

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  encryptedSeed?: string;
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  settings: WalletSettings;
  createdAt: number;
  lastAccessedAt: number;
  version: string;
}

export type WalletType = 'hd' | 'imported' | 'hardware' | 'multisig' | 'social';

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  privateKey?: string; // Optional for hardware wallets
  publicKey: string;
  path: string;
  index: number;
  isHardware: boolean;
  isImported: boolean;
  hardwareDevice?: HardwareDevice;
  balance: TokenBalance[];
  nfts: NFT[];
  accountIndex: number;
  createdAt: number;
}

// ====================
// HARDWARE WALLET TYPES
// ====================

export interface HardwareDevice {
  id: string;
  type: HardwareDeviceType;
  name: string;
  isConnected: boolean;
  firmwareVersion: string;
  serialNumber?: string;
  features: HardwareFeature[];
}

export type HardwareDeviceType = 'ledger' | 'trezor' | 'keepkey' | 'coldcard';

export interface HardwareFeature {
  type: string;
  supported: boolean;
  version?: string;
}

// ====================
// TOKEN TYPES
// ====================

export interface Token {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  logoUrl?: string;
  coingeckoId?: string;
  marketData?: TokenMarketData;
  verified: boolean;
  tags: TokenTag[];
  balance?: string;
  balanceFormatted?: string;
  balanceUSD?: number;
  price?: number;
  isNative?: boolean;
  change24h?: number;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  balanceUSD: number;
  price: number;
  priceChange24h: number;
  lastUpdated: number;
}

export interface TokenMarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  rank: number;
  totalSupply: string;
  circulatingSupply: string;
}

export type TokenTag = 'defi' | 'stablecoin' | 'wrapped' | 'governance' | 'meme' | 'layer1' | 'layer2';

// ====================
// NFT TYPES
// ====================

export interface NFT {
  contract: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  owner: string;
  balance?: string;
  tokenUri?: string;
  metadata?: NFTMetadata;
  collection?: NFTCollection;
  lastSale?: NFTSale;
  floorPrice?: number;
  rarity?: NFTRarity;
}

export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  imageData?: string;
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  attributes?: NFTAttribute[];
}

export interface NFTAttribute {
  traitType: string;
  value: string | number;
  displayType?: string;
  rarity?: number;
}

export interface NFTCollection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  externalUrl?: string;
  discordUrl?: string;
  twitterUsername?: string;
  instagramUsername?: string;
  telegramUrl?: string;
  stats: NFTCollectionStats;
  traits: NFTTrait[];
}

export interface NFTCollectionStats {
  floorPrice: number;
  floorPriceSymbol: string;
  marketCap: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  volumeTotal: number;
  sales24h: number;
  averagePrice: number;
  numOwners: number;
  totalSupply: number;
  count: number;
}

export interface NFTTrait {
  traitType: string;
  values: Array<{
    value: string;
    count: number;
    rarity: number;
  }>;
}

export interface NFTSale {
  price: number;
  priceSymbol: string;
  priceUSD: number;
  marketplace: string;
  buyer: string;
  seller: string;
  timestamp: number;
  transactionHash: string;
}

export interface NFTRarity {
  rank: number;
  score: number;
  totalSupply: number;
  rarityTier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
  nonce: number;
  data?: string;
  chainId: number;
  timestamp?: number;
  blockNumber?: number;
  status?: 'pending' | 'confirmed' | 'failed';
  type?: 'send' | 'receive' | 'swap' | 'contract';
  token?: Token;
}

export interface Network {
  chainId: number;
  name: string;
  rpcUrl: string;
  symbol: string;
  blockExplorerUrl?: string;
  isTestnet?: boolean;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  price: number;
  priceImpact: number;
  estimatedGas: string;
  allowanceTarget?: string;
  to?: string;
  data?: string;
  value?: string;
  sources?: Array<{ name: string; proportion: number }>;
}

export interface WalletState {
  isInitialized: boolean;
  isUnlocked: boolean;
  accounts: WalletAccount[];
  activeAccount?: WalletAccount;
  currentAccount?: WalletAccount | null;
  activeNetwork: Network;
  currentNetwork: Network;
  portfolio?: Portfolio | null;
  tokens: Token[];
  transactions: Transaction[];
  balance: string;
  balanceUSD: number;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface SecureStorageOptions {
  accessible?: string;
  accessGroup?: string;
  authenticationPrompt?: string;
  authenticatePrompt?: string;
}

export type DerivationPath = 
  | "m/44'/60'/0'/0/0" // Default Ethereum
  | "m/44'/60'/0'/0" // Ledger Live
  | "m/44'/60'/0'" // Ledger Legacy
  | string; // Custom path

export interface WalletConfig {
  defaultDerivationPath: DerivationPath;
  supportedNetworks: Network[];
  defaultNetwork: Network;
  securityOptions: {
    requireBiometrics: boolean;
    pinLength: number;
    maxPinAttempts: number;
    sessionTimeout: number; // in milliseconds
  };
}

export interface GasEstimate {
  slow: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
  };
  standard: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
  };
  fast: {
    maxFeePerGas: string;
    maxPriorityFeePerGas: string;
    estimatedTime: number;
  };
}

export interface GasSettings {
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface TransactionParams {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
}

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface DAppSession {
  peerId: string;
  peerMeta: {
    name: string;
    description?: string;
    url: string;
    icons: string[];
  };
  chainId: number;
  accounts: string[];
  connected: boolean;
  approved: boolean;
}

export interface SignMessageRequest {
  message: string;
  address: string;
  type?: 'personal_sign' | 'eth_sign' | 'eth_signTypedData' | 'eth_signTypedData_v4';
  typedData?: any;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
}

// Additional Types for Complete Wallet Functionality

export interface Portfolio {
  totalBalance: number;
  totalBalanceFormatted: string;
  tokens: Token[];
  nativeBalance: string;
  nativeBalanceFormatted: string;
  priceChange24h?: number;
}

export interface WalletSettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  biometricsEnabled: boolean;
  testnetEnabled: boolean;
  autoLockTime: number; // minutes
  theme: 'light' | 'dark' | 'auto';
  language: string;
  showTestTokens: boolean;
  defaultGasPrice: 'slow' | 'standard' | 'fast';
  notifications: boolean;
  analyticsEnabled: boolean;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  biometricsEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTime: number;
  requirePinForTransactions: boolean;
  requireBiometricsForTransactions: boolean;
  maxPinAttempts: number;
  lockAfterFailedAttempts: boolean;
}

export interface AppState {
  isUnlocked: boolean;
  isInitialized: boolean;
  currentNetwork: Network;
  currentAccount: WalletAccount | null;
  portfolio: Portfolio | null;
  transactions: Transaction[];
  settings: WalletSettings;
  securitySettings: SecuritySettings;
  isLoading: boolean;
  error: string | null;
  walletConnectSessions: DAppSession[];
}

export interface CreateWalletParams {
  mnemonic?: string;
  password?: string;
  enableBiometrics?: boolean;
  derivationPath?: DerivationPath;
}

export interface ImportWalletParams {
  mnemonic: string;
  password?: string;
  enableBiometrics?: boolean;
  derivationPath?: DerivationPath;
}

export interface SendTransactionParams {
  to: string;
  amount: string;
  token?: Token;
  gasPrice?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  data?: string;
  type?: number; // EIP-1559 type
}

export interface ApprovalParams {
  spender: string;
  amount: string;
  token: Token;
}

export interface SwapParams {
  fromToken: Token;
  toToken: Token;
  amount: string;
  slippage: number;
  recipient?: string;
}

// Error Types
export interface WalletError {
  code: string;
  message: string;
  details?: any;
}

export const ErrorCodes = {
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  USER_DENIED: 'USER_DENIED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  KEYCHAIN_ERROR: 'KEYCHAIN_ERROR',
  BIOMETRIC_ERROR: 'BIOMETRIC_ERROR',
  PIN_ERROR: 'PIN_ERROR',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  SWAP_FAILED: 'SWAP_FAILED',
  INSUFFICIENT_ALLOWANCE: 'INSUFFICIENT_ALLOWANCE',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  WALLET_LOCKED: 'WALLET_LOCKED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
} as const;

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  CreateWallet: undefined;
  ImportWallet: undefined;
  ConfirmMnemonic: { mnemonic: string };
  SetupSecurity: { mnemonic: string; isImport?: boolean };
  Main: undefined;
  Send: { token?: Token };
  Receive: undefined;
  Swap: undefined;
  Transactions: undefined;
  Settings: undefined;
  Security: undefined;
  Networks: undefined;
  About: undefined;
  TransactionDetail: { transaction: Transaction };
  TokenDetail: { token: Token };
  QRScanner: { onScan: (data: string) => void };
  DAppRequest: { request: SignMessageRequest };
  WalletConnect: undefined;
  AddToken: undefined;
  ExportWallet: undefined;
  BackupWallet: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Settings: undefined;
  Swap: undefined;
};

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    white: string;
    black: string;
    transparent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string };
    h2: { fontSize: number; fontWeight: string };
    h3: { fontSize: number; fontWeight: string };
    body1: { fontSize: number; fontWeight: string };
    body2: { fontSize: number; fontWeight: string };
    caption: { fontSize: number; fontWeight: string };
  };
  shadows: {
    sm: any;
    md: any;
    lg: any;
  };
}

// Constants for derivation paths
export const DERIVATION_PATHS = {
  ETHEREUM_DEFAULT: "m/44'/60'/0'/0/0",
  ETHEREUM_LEDGER: "m/44'/60'/0'/0",
  ETHEREUM_METAMASK: "m/44'/60'/0'/0/0",
  ETHEREUM_TREZOR: "m/44'/60'/0'/0/0",
  ETHEREUM_LEDGER_LIVE: "m/44'/60'/0'/0",
} as const;

export type DerivationPathType = keyof typeof DERIVATION_PATHS;

// Token List Types
export interface TokenList {
  name: string;
  logoURI: string;
  keywords: string[];
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: Token[];
}

// Price Data Types
export interface PriceData {
  [tokenAddress: string]: {
    usd: number;
    usd_24h_change: number;
    last_updated_at: number;
  };
}

export interface TokenBalance {
  address: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
  symbol: string;
  name: string;
  logoURI?: string;
}

export interface TokenPrice {
  address: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: string;
}

// Network Configuration
export interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  gasMultiplier: number;
  supported?: boolean;
  default?: boolean;
  testnetEnabled?: boolean;
}

export interface GasPrice {
  slow: {
    gasPrice: number;
    estimatedTime: number;
  };
  standard: {
    gasPrice: number;
    estimatedTime: number;
  };
  fast: {
    gasPrice: number;
    estimatedTime: number;
  };
  instant: {
    gasPrice: number;
    estimatedTime: number;
  };
  maxFeePerGas?: number;
  maxPriorityFeePerGas?: number;
}

export interface NetworkStatus {
  networkName: string;
  chainId: number;
  blockNumber: number;
  blockTime: number;
  latency: number;
  isHealthy: boolean;
  lastChecked: number;
  error?: string;
}

// WalletConnect Types
export interface WalletConnectRequest {
  id: number;
  method: string;
  params: any[];
  metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  };
}

// Notification Types
export interface NotificationConfig {
  transactionComplete: boolean;
  priceAlerts: boolean;
  walletConnectRequests: boolean;
  securityAlerts: boolean;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

// Feature Flags
export interface FeatureFlags {
  swapEnabled: boolean;
  walletConnectEnabled: boolean;
  biometricsEnabled: boolean;
  testnetEnabled: boolean;
  analyticsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

// Storage Keys
export const STORAGE_KEYS = {
  ENCRYPTED_MNEMONIC: 'encrypted_mnemonic',
  WALLET_SETTINGS: 'wallet_settings',
  SECURITY_SETTINGS: 'security_settings',
  CUSTOM_TOKENS: 'custom_tokens',
  TRANSACTION_HISTORY: 'transaction_history',
  PRICE_CACHE: 'price_cache',
  NETWORK_CONFIG: 'network_config',
  FEATURE_FLAGS: 'feature_flags',
  LAST_UNLOCK_TIME: 'last_unlock_time',
  FAILED_PIN_ATTEMPTS: 'failed_pin_attempts',
} as const;
