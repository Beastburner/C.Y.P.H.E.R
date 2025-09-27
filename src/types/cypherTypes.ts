/**
 * Cypher Wallet - Ultimate Type Definitions
 * The most comprehensive and advanced Ethereum wallet type system
 * Implements all features from the three comprehensive specifications
 */

import { ethers } from 'ethers';

// ====================
// BASIC FOUNDATION TYPES
// ====================

export interface PricePoint {
  timestamp: number;
  price: number;
  volume?: number;
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
  fdv?: number;
  ath?: number;
  atl?: number;
  lastUpdated: number;
}

export interface TokenBalance {
  token: EnhancedToken;
  balance: string;
  balanceFormatted: string;
  balanceUSD: number;
  priceChange24h: number;
  allocation: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  logoURI?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  whitepaper?: string;
  social?: SocialData;
}

export interface TokenCompliance {
  isRegulated: boolean;
  jurisdiction: string[];
  restrictions: string[];
  requiresKYC: boolean;
  blacklisted: boolean;
  sanctions: boolean;
}

export interface PriceAlert {
  id: string;
  token: string;
  type: 'above' | 'below' | 'change';
  value: number;
  enabled: boolean;
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
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
  properties?: Record<string, any>;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
  max_value?: number;
  rarity?: number;
}

export interface NFTMarketData {
  floorPrice?: number;
  lastSale?: NFTSale;
  estimatedValue?: number;
  priceHistory?: PricePoint[];
  volume24h?: number;
  trades24h?: number;
}

export interface NFTSale {
  price: string;
  currency: EnhancedToken;
  timestamp: number;
  marketplace: string;
  transactionHash: string;
  buyer?: string;
  seller?: string;
}

export interface NFTProvenance {
  previousOwner: string;
  timestamp: number;
  transactionHash: string;
  transferType: 'mint' | 'sale' | 'transfer' | 'burn';
  price?: string;
  marketplace?: string;
}

export interface EnhancedNFTRarity {
  rank: number;
  score: number;
  total: number;
  percentile: number;
  tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface NFTFraction {
  id: string;
  totalFractions: number;
  ownedFractions: number;
  fractionPrice: string;
  fractionToken: EnhancedToken;
  tradeable: boolean;
}

export interface SocialData {
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  reddit?: string;
  github?: string;
  medium?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
}

export interface CommunityMetrics {
  followers: number;
  engagement: number;
  activity: number;
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  growth: number;
  
  // Platform-specific metrics
  twitterFollowers?: number;
  discordMembers?: number;
  telegramMembers?: number;
  redditSubscribers?: number;
  githubStars?: number;
}

// ====================
// WALLET FOUNDATION TYPES
// ====================

export interface WalletSettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY';
  language: string;
  theme: 'light' | 'dark' | 'auto' | 'high_contrast';
  
  // Display preferences
  hideBalances: boolean;
  showTestTokens: boolean;
  compactMode: boolean;
  
  // Notifications
  notifications: NotificationSettings;
  
  // Security preferences
  biometricsEnabled: boolean;
  autoLockTime: number; // minutes
  requireAuthForTransactions: boolean;
  requireAuthForExport: boolean;
  
  // Network preferences
  defaultGasPrice: 'slow' | 'standard' | 'fast' | 'custom';
  customGasPrice?: string;
  rpcTimeout: number;
  
  // Privacy
  analyticsEnabled: boolean;
  crashReporting: boolean;
  ipfsGateway: string;
  
  // Advanced
  expertMode: boolean;
  testnetEnabled: boolean;
  developerMode: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  transactions: boolean;
  priceAlerts: boolean;
  news: boolean;
  defi: boolean;
  nft: boolean;
  governance: boolean;
  security: boolean;
  
  // Delivery methods
  push: boolean;
  email: boolean;
  sms: boolean;
  
  // Frequency
  frequency: 'immediate' | 'batched' | 'daily_digest';
  quietHours: boolean;
  quietStart?: string; // HH:MM format
  quietEnd?: string; // HH:MM format
}

export interface BackupConfig {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupLocation: 'local' | 'cloud' | 'both';
  encryptBackups: boolean;
  
  // Cloud backup settings
  cloudProvider?: 'icloud' | 'google_drive' | 'dropbox' | 'onedrive';
  cloudEncryption: boolean;
  
  // Backup verification
  verifyBackups: boolean;
  lastBackup?: number;
  lastVerification?: number;
  
  // Recovery settings
  seedPhraseBackup: boolean;
  paperBackup: boolean;
  metalBackup: boolean;
  
  // Backup history
  backupHistory: BackupRecord[];
}

export interface BackupRecord {
  id: string;
  timestamp: number;
  type: 'manual' | 'automatic' | 'recovery_test';
  location: string;
  encrypted: boolean;
  verified: boolean;
  size: number;
  checksum: string;
}

export interface RecoveryConfig {
  methods: RecoveryMethod[];
  socialRecovery: SocialRecoveryConfig;
  multisigRecovery: MultisigRecoveryConfig;
  
  // Recovery testing
  testRecovery: boolean;
  lastRecoveryTest?: number;
  recoveryTestFrequency: 'monthly' | 'quarterly' | 'annually';
  
  // Emergency settings
  emergencyContacts: EmergencyContact[];
  emergencyInstructions: string;
  deadmanSwitch: boolean;
  deadmanSwitchPeriod: number; // days
}

export interface RecoveryMethod {
  type: 'seed_phrase' | 'private_key' | 'keystore' | 'hardware' | 'social' | 'multisig';
  enabled: boolean;
  configured: boolean;
  tested: boolean;
  lastTest?: number;
  securityLevel: 'low' | 'medium' | 'high' | 'maximum';
  description: string;
}

export interface SocialRecoveryConfig {
  enabled: boolean;
  threshold: number;
  guardians: Guardian[];
  recoveryDelay: number; // hours
  recoveryWindow: number; // hours
}

export interface MultisigRecoveryConfig {
  enabled: boolean;
  threshold: number;
  signers: MultisigSigner[];
  timelock: number; // hours
}

export interface Guardian {
  id: string;
  address: string;
  name: string;
  email?: string;
  phone?: string;
  verified: boolean;
  active: boolean;
  addedAt: number;
  lastActive?: number;
  
  // Guardian metadata
  relationship: 'family' | 'friend' | 'colleague' | 'service' | 'other';
  trustLevel: number;
  location?: string;
  
  // Communication preferences
  notifications: GuardianNotifications;
}

export interface GuardianNotifications {
  email: boolean;
  sms: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface MultisigSigner {
  id: string;
  address: string;
  name: string;
  publicKey: string;
  role: 'owner' | 'guardian' | 'operator';
  weight: number;
  addedAt: number;
  lastSigned?: number;
  active: boolean;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  instructions: string;
}

export interface WalletAnalytics {
  // Usage statistics
  totalTransactions: number;
  totalVolume: number;
  averageTransactionValue: number;
  transactionFrequency: number;
  
  // Asset analysis
  portfolioValue: number;
  portfolioGrowth: number;
  bestPerformingAsset: string;
  worstPerformingAsset: string;
  
  // Network usage
  networkUsage: Record<string, number>;
  gasSpent: Record<string, string>;
  
  // DeFi activity
  defiProtocolsUsed: string[];
  yieldEarned: string;
  stakingRewards: string;
  
  // Risk metrics
  riskScore: number;
  diversificationScore: number;
  concentrationRisk: number;
  
  // Time-based metrics
  monthlyVolume: MonthlyVolumeData[];
  weeklyActivity: WeeklyActivityData[];
  
  // Behavioral insights
  tradingPatterns: TradingPattern[];
  preferredTokens: string[];
  preferredProtocols: string[];
  
  // Performance benchmarks
  vsMarketPerformance: number;
  vsHodlPerformance: number;
  sharpeRatio: number;
}

export interface MonthlyVolumeData {
  month: string;
  volume: number;
  transactions: number;
  uniqueTokens: number;
  gasSpent: string;
}

export interface WeeklyActivityData {
  week: string;
  transactions: number;
  volume: number;
  activeProtocols: number;
}

export interface TradingPattern {
  type: 'day_trading' | 'swing_trading' | 'hodling' | 'defi_farming' | 'arbitrage';
  frequency: number;
  profitability: number;
  riskLevel: number;
  timeframe: string;
}

export interface ComplianceData {
  kyc: KYCData;
  aml: AMLData;
  tax: TaxData;
  reporting: ReportingData;
  
  // Jurisdictional compliance
  jurisdiction: string;
  regulations: string[];
  
  // Risk assessment
  riskRating: 'low' | 'medium' | 'high' | 'prohibited';
  riskFactors: string[];
  
  // Monitoring
  monitoring: boolean;
  alerts: ComplianceAlert[];
  
  // Reporting obligations
  reportingRequired: boolean;
  reportingFrequency?: 'monthly' | 'quarterly' | 'annually';
  nextReportDue?: number;
}

export interface KYCData {
  level: 'none' | 'basic' | 'enhanced' | 'institutional';
  status: 'not_started' | 'pending' | 'approved' | 'rejected' | 'expired';
  provider?: string;
  documents: KYCDocument[];
  verifiedAt?: number;
  expiresAt?: number;
  
  // Identity information
  identity: IdentityData;
  
  // Risk assessment
  riskScore: number;
  isPEP: boolean; // Politically Exposed Person
  sanctions: boolean;
  
  // Limits
  limits: TransactionLimits;
}

export interface KYCDocument {
  type: 'passport' | 'drivers_license' | 'national_id' | 'utility_bill' | 'bank_statement';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: number;
  verifiedAt?: number;
  expiresAt?: number;
  rejectionReason?: string;
}

export interface IdentityData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  
  // Address
  address: AddressData;
  
  // Contact
  email: string;
  phone?: string;
  
  // Additional information
  occupation?: string;
  sourceOfFunds?: string;
}

export interface AddressData {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface AMLData {
  screeningLevel: 'basic' | 'enhanced' | 'comprehensive';
  lastScreening: number;
  nextScreening: number;
  
  // Screening results
  watchlistHits: WatchlistHit[];
  sanctionsHits: SanctionHit[];
  pepStatus: boolean;
  
  // Risk scoring
  amlScore: number;
  riskRating: 'low' | 'medium' | 'high' | 'prohibited';
  
  // Transaction monitoring
  monitoringEnabled: boolean;
  suspiciousActivity: SuspiciousActivity[];
  alerts: AMLAlert[];
}

export interface WatchlistHit {
  list: string;
  name: string;
  matchScore: number;
  reason: string;
  falsePositive: boolean;
}

export interface SanctionHit {
  list: string;
  entity: string;
  country: string;
  reason: string;
  severity: 'warning' | 'blocking';
}

export interface SuspiciousActivity {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  detectedAt: number;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  transactions: string[];
}

export interface AMLAlert {
  id: string;
  type: 'large_transaction' | 'unusual_pattern' | 'high_risk_country' | 'sanctions_hit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface TaxData {
  enabled: boolean;
  jurisdiction: string;
  taxYear: number;
  method: 'fifo' | 'lifo' | 'specific_id' | 'average_cost';
  
  // Tax calculations
  transactions: TaxTransaction[];
  gainLoss: TaxGainLoss[];
  summary: TaxSummary;
  
  // Reporting
  reports: TaxReport[];
  forms: TaxForm[];
}

export interface TaxTransaction {
  hash: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'trade' | 'income' | 'gift' | 'loss' | 'fork' | 'mining' | 'staking';
  asset: string;
  amount: string;
  price: number;
  feeAsset?: string;
  feeAmount?: string;
  
  // Tax-specific data
  costBasis?: number;
  proceeds?: number;
  gainLoss?: number;
  taxable: boolean;
  category: string;
}

export interface TaxGainLoss {
  asset: string;
  shortTermGain: number;
  longTermGain: number;
  totalGain: number;
  costBasis: number;
  proceeds: number;
}

export interface TaxSummary {
  totalGainLoss: number;
  shortTermGainLoss: number;
  longTermGainLoss: number;
  totalIncome: number;
  totalDeductions: number;
  taxableGain: number;
  estimatedTax: number;
}

export interface TaxReport {
  year: number;
  type: 'summary' | 'detailed' | 'form8949' | 'schedule_d';
  generatedAt: number;
  data: any;
  exported: boolean;
}

export interface TaxForm {
  form: string;
  year: number;
  data: any;
  generated: boolean;
  exported: boolean;
}

export interface ReportingData {
  required: boolean;
  frequency: 'monthly' | 'quarterly' | 'annually';
  reports: ComplianceReport[];
  nextDue?: number;
  overdue: boolean;
}

export interface ComplianceReport {
  id: string;
  type: string;
  period: string;
  generatedAt: number;
  submittedAt?: number;
  status: 'draft' | 'submitted' | 'accepted' | 'rejected';
  data: any;
}

export interface ComplianceAlert {
  id: string;
  type: 'kyc_expiring' | 'report_due' | 'limit_exceeded' | 'suspicious_activity';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface TransactionLimits {
  daily: LimitInfo;
  weekly: LimitInfo;
  monthly: LimitInfo;
  annual: LimitInfo;
  
  // Transaction-specific limits
  singleTransaction: LimitInfo;
  
  // Asset-specific limits
  assetLimits: Record<string, LimitInfo>;
}

export interface LimitInfo {
  amount: string;
  currency: string;
  used: string;
  remaining: string;
  resetAt: number;
}

export interface ComplianceStatus {
  level: 'none' | 'basic' | 'enhanced' | 'institutional';
  verified: boolean;
  restricted: boolean;
  suspended: boolean;
  
  // Status details
  kycStatus: 'not_started' | 'pending' | 'approved' | 'rejected' | 'expired';
  amlStatus: 'clear' | 'under_review' | 'flagged' | 'blocked';
  
  // Restrictions
  restrictions: string[];
  
  // Requirements
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  type: string;
  description: string;
  required: boolean;
  completed: boolean;
  dueDate?: number;
}

// ====================
// DEFI & STAKING TYPES
// ====================

export interface DeFiPosition {
  id: string;
  protocol: string;
  type: 'lending' | 'borrowing' | 'liquidity' | 'staking' | 'farming' | 'derivatives';
  
  // Position details
  asset: string;
  amount: string;
  amountUSD: number;
  
  // Performance
  currentValue: string;
  currentValueUSD: number;
  pnl: number;
  pnlPercentage: number;
  
  // Yield information
  apy: number;
  rewards: DeFiReward[];
  
  // Timing
  openedAt: number;
  lastUpdated: number;
  
  // Risk metrics
  riskLevel: 'low' | 'medium' | 'high';
  liquidationRisk?: number;
  impermanentLoss?: number;
  
  // Status
  status: 'active' | 'closed' | 'liquidated';
  
  // Automation
  autoCompound: boolean;
  stopLoss?: number;
  takeProfit?: number;
}

export interface DeFiReward {
  token: EnhancedToken;
  amount: string;
  amountUSD: number;
  apr: number;
  claimable: boolean;
  vested: boolean;
  vestingEnd?: number;
}

export interface StakingPosition {
  id: string;
  validator?: string;
  network: string;
  
  // Staking details
  asset: string;
  stakedAmount: string;
  stakedAmountUSD: number;
  
  // Rewards
  rewards: string;
  rewardsUSD: number;
  apy: number;
  
  // Status
  status: 'active' | 'unbonding' | 'withdrawn';
  
  // Timing
  stakedAt: number;
  unbondingAt?: number;
  withdrawableAt?: number;
  
  // Slashing risk
  slashingRisk: number;
  slashingEvents: SlashingEvent[];
  
  // Delegation info
  isDelegated: boolean;
  delegatedTo?: string;
  commission?: number;
}

export interface SlashingEvent {
  validator: string;
  amount: string;
  reason: string;
  timestamp: number;
  recovered: boolean;
}

export interface GovernancePosition {
  id: string;
  protocol: string;
  token: string;
  
  // Voting power
  votingPower: string;
  delegatedPower?: string;
  delegatedTo?: string;
  
  // Participation
  proposalsVoted: number;
  participationRate: number;
  
  // Rewards
  governanceRewards: string;
  
  // Status
  active: boolean;
  locked: boolean;
  lockExpiry?: number;
}

// ====================
// CORE SECURITY TYPES
// ====================

export interface SecurityConfig {
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2' | 'Argon2id' | 'scrypt';
  iterations: number;
  saltLength: number;
  biometricEnabled: boolean;
  hardwareSecurityModule: boolean;
  zeroKnowledgeProofs: boolean;
  quantumResistant: boolean;
}

export interface BiometricConfig {
  touchId: boolean;
  faceId: boolean;
  voiceId: boolean;
  irisId: boolean;
  requireLiveness: boolean;
  maxAttempts: number;
  timeoutSeconds: number;
}

export interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | 'hardware' | 'push';
  backupCodes: string[];
  secret?: string;
  qrCode?: string;
}

export interface SecurityMetrics {
  securityScore: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  threatVector: SecurityThreat[];
  complianceLevel: 'basic' | 'enhanced' | 'military' | 'quantum';
  auditTrail: SecurityEvent[];
  lastSecurityCheck: number;
  vulnerabilities: Vulnerability[];
}

export interface SecurityThreat {
  id: string;
  type: 'phishing' | 'malware' | 'social_engineering' | 'replay_attack' | 'man_in_middle' | 'quantum_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  detected: number;
  resolved?: number;
}

export interface Vulnerability {
  cve?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected: string[];
  patch?: string;
  status: 'open' | 'patched' | 'mitigated';
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'transaction' | 'backup' | 'recovery' | 'config_change' | 'threat_detected';
  timestamp: number;
  user: string;
  device: DeviceInfo;
  location?: LocationInfo;
  riskScore: number;
  details: any;
}

// ====================
// ADVANCED WALLET TYPES
// ====================

export interface CypherWallet {
  id: string;
  name: string;
  type: WalletType;
  version: string;
  encryptedSeed: string;
  seedHash: string;
  salt: string;
  iv: string;
  accounts: CypherAccount[];
  settings: WalletSettings;
  security: SecurityConfig;
  backup: BackupConfig;
  recovery: RecoveryConfig;
  analytics: WalletAnalytics;
  compliance: ComplianceData;
  createdAt: number;
  lastAccessedAt: number;
  lastBackupAt: number;
  isLocked: boolean;
  lockTimeout: number;
}

export type WalletType = 
  | 'hd_bip39' 
  | 'hd_bip44' 
  | 'imported_private_key' 
  | 'imported_keystore' 
  | 'hardware_ledger' 
  | 'hardware_trezor' 
  | 'hardware_keystone'
  | 'multisig_gnosis'
  | 'social_recovery'
  | 'smart_contract'
  | 'quantum_resistant';

export interface CypherAccount {
  id: string;
  walletId: string;
  name: string;
  address: string;
  publicKey: string;
  privateKey?: string; // Only for software wallets
  encryptedPrivateKey?: string;
  path: string;
  index: number;
  chainId: number;
  isHardware: boolean;
  isImported: boolean;
  isMultisig: boolean;
  isSocialRecovery: boolean;
  balance: TokenBalance[];
  nfts: EnhancedNFT[];
  defiPositions: DeFiPosition[];
  stakingPositions: StakingPosition[];
  governance: GovernancePosition[];
  transactions: EnhancedTransaction[];
  labels: string[];
  avatar: string;
  theme: string;
  createdAt: number;
  lastUsed: number;
  riskScore: number;
  complianceStatus: ComplianceStatus;
}

// ====================
// ENHANCED TOKEN SYSTEM
// ====================

export interface EnhancedToken {
  // Basic token info
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  logoUrl?: string;
  
  // Market data
  marketData: TokenMarketData;
  priceHistory: PricePoint[];
  
  // Security & compliance
  security: TokenSecurity;
  compliance: TokenCompliance;
  
  // Metadata
  metadata: TokenMetadata;
  
  // Social & community
  social: SocialData;
  
  // Technical analysis
  technicalIndicators: TechnicalIndicators;
  
  // DeFi integration
  defiProtocols: string[];
  liquidityPools: LiquidityPool[];
  
  // User data
  balance?: string;
  balanceFormatted?: string;
  balanceUSD?: number;
  isWatched: boolean;
  isFavorite: boolean;
  alerts: PriceAlert[];
  notes?: string;
  tags: string[];
}

export interface TokenSecurity {
  isVerified: boolean;
  auditReports: AuditReport[];
  securityScore: number;
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: string[];
  honeypotCheck: HoneypotResult;
  rugPullRisk: number;
  liquidityLocked: boolean;
  mintFunction: boolean;
  proxyContract: boolean;
  blacklistFunction: boolean;
  whitelistFunction: boolean;
}

export interface AuditReport {
  auditor: string;
  date: number;
  report: string;
  score: number;
  findings: AuditFinding[];
}

export interface AuditFinding {
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  fixed: boolean;
}

export interface HoneypotResult {
  isHoneypot: boolean;
  reason?: string;
  confidence: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: MACD;
  bollinger: BollingerBands;
  movingAverages: MovingAverages;
  support: number[];
  resistance: number[];
  trend: 'bullish' | 'bearish' | 'neutral';
  signals: TradingSignal[];
}

export interface MACD {
  value: number;
  signal: number;
  histogram: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface MovingAverages {
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
}

export interface TradingSignal {
  type: 'buy' | 'sell' | 'hold';
  strength: number;
  indicator: string;
  timestamp: number;
}

// ====================
// ADVANCED NFT SYSTEM
// ====================

export interface EnhancedNFT {
  // Basic NFT info
  contract: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155' | 'ERC998';
  owner: string;
  balance?: string;
  
  // Metadata
  metadata: NFTMetadata;
  
  // Collection data
  collection: EnhancedNFTCollection;
  
  // Market data
  marketData: NFTMarketData;
  
  // Provenance & history
  provenance: NFTProvenance[];
  
  // Utility & gaming
  utility: NFTUtility;
  
  // Rarity & traits
  rarity: EnhancedNFTRarity;
  
  // Fractionalization
  fractionalized: boolean;
  fractions?: NFTFraction[];
  
  // IP rights
  intellectualProperty: IPRights;
  
  // User data
  acquired: number;
  notes?: string;
  isStaked: boolean;
  stakingRewards?: TokenBalance[];
}

export interface NFTCollectionStats {
  totalSupply: number;
  owners: number;
  floorPrice: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  marketCap: number;
  averagePrice: number;
  sales24h: number;
  sales7d: number;
  sales30d: number;
}

export interface NFTTrait {
  trait_type: string;
  value: string | number;
  rarity: number;
  count: number;
  percentage: number;
}

export interface RoadmapItem {
  phase: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  date?: string;
  progress?: number;
}

export interface TeamMember {
  name: string;
  role: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export interface EnhancedNFTCollection {
  address: string;
  name: string;
  symbol: string;
  description?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  externalUrl?: string;
  
  // Social links
  social: SocialData;
  
  // Market stats
  stats: NFTCollectionStats;
  
  // Traits analysis
  traits: NFTTrait[];
  
  // Roadmap & utility
  roadmap: RoadmapItem[];
  utilities: string[];
  
  // Team & verification
  team: TeamMember[];
  verified: boolean;
  blueCheck: boolean;
  
  // Community
  community: CommunityMetrics;
}

export interface NFTUtility {
  gaming: boolean;
  staking: boolean;
  governance: boolean;
  access: boolean;
  membership: boolean;
  pfp: boolean;
  art: boolean;
  music: boolean;
  virtual_world: boolean;
  augmented_reality: boolean;
  utilities: string[];
}

export interface IPRights {
  commercial: boolean;
  derivative: boolean;
  exclusive: boolean;
  transferable: boolean;
  license?: string;
  royalties?: number;
}

// ====================
// MISSING TYPE DEFINITIONS
// ====================

export interface DeFiRisk {
  level: 'low' | 'medium' | 'high' | 'extreme';
  factors: string[];
  score: number;
  assessment: string;
  mitigation?: string[];
}

export interface DeFiAnalytics {
  tvl: number;
  apy: number;
  volume24h: number;
  users: number;
  transactions24h: number;
  fees24h: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
}

export interface ContractInfo {
  address: string;
  name: string;
  version: string;
  verified: boolean;
  abi?: any[];
  source?: string;
  compiler?: string;
  audit?: AuditInfo;
}

export interface AuditInfo {
  auditor: string;
  date: string;
  reportUrl: string;
  score?: number;
  findings?: number;
}

export interface GovernanceInfo {
  token: string;
  votingPower: number;
  proposals: number;
  participation: number;
  treasury: number;
  timelock?: number;
}

export interface Tokenomics {
  totalSupply: string;
  circulatingSupply: string;
  maxSupply?: string;
  burnRate?: number;
  inflationRate?: number;
  distribution: TokenDistribution[];
  vesting?: VestingSchedule[];
}

export interface TokenDistribution {
  category: string;
  percentage: number;
  amount: string;
  locked: boolean;
  releaseDate?: string;
}

export interface VestingSchedule {
  beneficiary: string;
  amount: string;
  cliff: number;
  duration: number;
  released: string;
  revocable: boolean;
}

export interface TokenAllowance {
  spender: string;
  amount: string;
  token: string;
  protocol?: string;
  lastUpdated: number;
}

export interface PerformanceData {
  timestamp: number;
  value: number;
  change: number;
  volume?: number;
  marketCap?: number;
  dominance?: number;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled' | 'replaced';
  confirmations: number;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
  error?: string;
}

export interface EnhancedTokenTransfer {
  from: string;
  to: string;
  value: string;
  token: string;
  tokenSymbol: string;
  tokenDecimals: number;
  logIndex: number;
  transactionHash: string;
  blockNumber: number;
}

export interface NFTTransfer {
  from: string;
  to: string;
  tokenId: string;
  contract: string;
  collection: string;
  logIndex: number;
  transactionHash: string;
  blockNumber: number;
}

export interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

export interface DecodedEvent {
  name: string;
  signature: string;
  params: EventParam[];
  address: string;
  blockNumber: number;
  transactionHash: string;
}

export interface EventParam {
  name: string;
  type: string;
  value: any;
  indexed: boolean;
}

export interface RPCEndpoint {
  url: string;
  name?: string;
  priority: number;
  weight?: number;
  maxRequestsPerSecond?: number;
  isHealthy: boolean;
  latency: number;
  reliability: number;
  lastChecked: number;
}

export interface NetworkDeFi {
  protocols: string[];
  tvl: number;
  topProtocols: DeFiProtocolInfo[];
  yields: YieldOpportunity[];
}

export interface DeFiProtocolInfo {
  name: string;
  tvl: number;
  apy: number;
  category: string;
  risk: 'low' | 'medium' | 'high';
}

export interface YieldOpportunity {
  protocol: string;
  pool: string;
  apy: number;
  tvl: number;
  risk: 'low' | 'medium' | 'high';
  tokens: string[];
}

export interface NetworkInfrastructure {
  blockTime: number;
  tps: number;
  finality: number;
  gasLimit: string;
  nodes: number;
  validators?: number;
}

export interface NetworkGovernance {
  type: 'DAO' | 'foundation' | 'company';
  token?: string;
  votingPower?: number;
  proposals?: number;
  participation?: number;
}

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
  baseFee?: string;
  priorityFee?: string;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippage: number;
  recipient?: string;
  deadline?: number;
}

export interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  fee: string;
  route: SwapRoute[];
  gasEstimate: string;
  minimumAmountOut: string;
}

export interface SwapRoute {
  protocol: string;
  percentage: number;
  hops: SwapHop[];
}

export interface ExecuteSwapParams extends SwapParams {
  route: SwapRoute[];
  amountOutMin: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  supply: string;
  dominance?: number;
}

export interface LiquidityInfo {
  total: number;
  available: number;
  utilization: number;
  providers: number;
  apy: number;
}

// ====================
// COMPREHENSIVE DEFI SYSTEM
// ====================

export interface DeFiEcosystem {
  protocols: DeFiProtocol[];
  positions: DeFiPosition[];
  yields: YieldOpportunity[];
  strategies: YieldStrategy[];
  risks: DeFiRisk[];
  analytics: DeFiAnalytics;
}

export interface DeFiProtocol {
  id: string;
  name: string;
  category: DeFiCategory;
  description: string;
  logoUrl: string;
  website: string;
  
  // Financial metrics
  tvl: number;
  volume24h: number;
  fees24h: number;
  revenue24h: number;
  
  // Yield information
  baseApy: number;
  boostedApy?: number;
  rewardApy: number;
  totalApy: number;
  
  // Risk metrics
  riskScore: number;
  auditScore: number;
  codeScore: number;
  teamScore: number;
  
  // Technical details
  contracts: ContractInfo[];
  governance: GovernanceInfo;
  tokenomics: Tokenomics;
  
  // Integration
  supported: boolean;
  integrated: boolean;
  features: string[];
  
  // User interaction
  positions: DeFiPosition[];
  allowances: TokenAllowance[];
  
  // Social proof
  social: SocialData;
  community: CommunityMetrics;
}

export type DeFiCategory = 
  | 'dex' 
  | 'lending' 
  | 'borrowing' 
  | 'yield_farming' 
  | 'staking' 
  | 'derivatives' 
  | 'insurance' 
  | 'synthetics'
  | 'options'
  | 'perpetuals'
  | 'structured_products'
  | 'dao'
  | 'nft_fi'
  | 'real_world_assets'
  | 'cross_chain';

export interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  category: 'conservative' | 'moderate' | 'aggressive' | 'degen';
  
  // Performance
  apy: number;
  historicalPerformance: PerformanceData[];
  
  // Risk
  riskLevel: number;
  maxDrawdown: number;
  volatility: number;
  
  // Composition
  allocations: StrategyAllocation[];
  rebalanceFrequency: number;
  
  // Requirements
  minAmount: string;
  maxAmount?: string;
  lockPeriod?: number;
  
  // Fees
  managementFee: number;
  performanceFee: number;
  
  // Automation
  automated: boolean;
  autoCompound: boolean;
  autoRebalance: boolean;
}

export interface StrategyAllocation {
  protocol: string;
  percentage: number;
  token: EnhancedToken;
  position: DeFiPosition;
}

// ====================
// ADVANCED TRANSACTION SYSTEM
// ====================

export interface EnhancedTransaction {
  // Basic transaction info
  hash: string;
  from: string;
  to: string;
  value: string;
  
  // Gas & fees
  gasPrice?: string;
  gasLimit?: string;
  gasUsed?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  
  // Block information
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  
  // Status & timing
  status: TransactionStatus;
  timestamp: number;
  confirmations: number;
  
  // Network
  chainId: number;
  network: EnhancedNetwork;
  
  // Transaction data
  data?: string;
  nonce: number;
  type?: number; // EIP-1559 type
  
  // Enhanced metadata
  metadata: TransactionMetadata;
  
  // Token transfers
  tokenTransfers: EnhancedTokenTransfer[];
  
  // NFT transfers
  nftTransfers: NFTTransfer[];
  
  // Logs & events
  logs: TransactionLog[];
  events: DecodedEvent[];
  
  // MEV analysis
  mev: MEVAnalysis;
  
  // Risk analysis
  risk: TransactionRisk;
  
  // User annotations
  labels: string[];
  notes?: string;
  category?: string;
  isBookmarked: boolean;
}

export interface TransactionMetadata {
  method?: string;
  methodId?: string;
  decodedInput?: any;
  description?: string;
  category: TransactionCategory;
  subcategory?: string;
  protocol?: string;
  dapp?: string;
  isInternal: boolean;
  isMined: boolean;
  isReplaced: boolean;
  replacedBy?: string;
  speedUp?: boolean;
  cancel?: boolean;
  batchId?: string;
  
  // EIP-1559 gas fields
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  baseFee?: string;
  priorityFee?: string;
}

export type TransactionCategory = 
  | 'send'
  | 'receive'
  | 'swap'
  | 'approve'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'deposit'
  | 'withdraw'
  | 'mint'
  | 'burn'
  | 'bridge'
  | 'vote'
  | 'create'
  | 'cancel'
  | 'contract_interaction'
  | 'nft_mint'
  | 'nft_transfer'
  | 'defi'
  | 'gaming'
  | 'other';

export interface MEVAnalysis {
  hasMev: boolean;
  mevType?: 'arbitrage' | 'liquidation' | 'sandwich' | 'frontrun' | 'backrun';
  mevValue?: string;
  bundlePosition?: number;
  gasPrice: string;
  priorityFee: string;
  tips?: string;
}

export interface TransactionRisk {
  riskScore: number;
  riskFactors: string[];
  warnings: string[];
  isHighRisk: boolean;
  requiresApproval: boolean;
  requiresManualReview: boolean;
}

// ====================
// COMPREHENSIVE NETWORK SYSTEM
// ====================

export interface EnhancedNetwork {
  // Basic network info
  chainId: number;
  name: string;
  shortName: string;
  symbol: string;
  decimals: number;
  
  // URLs & endpoints
  rpcUrls: RPCEndpoint[];
  explorerUrls: string[];
  faucetUrls?: string[];
  
  // Network characteristics
  type: NetworkType;
  layer: 1 | 2;
  consensus: 'PoW' | 'PoS' | 'PoA' | 'DPoS' | 'PoH';
  finalityTime: number; // in seconds
  
  // Performance metrics
  performance: NetworkPerformance;
  
  // Economic model
  economics: NetworkEconomics;
  
  // Security
  security: NetworkSecurity;
  
  // DeFi ecosystem
  defi: NetworkDeFi;
  
  // Infrastructure
  infrastructure: NetworkInfrastructure;
  
  // Governance
  governance?: NetworkGovernance;
  
  // User preferences
  isEnabled: boolean;
  isDefault: boolean;
  customRpc?: string;
  priority: number;
}

export type NetworkType = 
  | 'mainnet' 
  | 'testnet' 
  | 'layer2' 
  | 'sidechain' 
  | 'parachain' 
  | 'rollup' 
  | 'state_channel' 
  | 'plasma';

export interface NetworkPerformance {
  tps: number;
  blockTime: number;
  latency: number;
  uptime: number;
  gasPrice: GasPrice;
  congestion: 'low' | 'medium' | 'high';
  healthScore: number;
}

export interface NetworkEconomics {
  marketCap: number;
  totalSupply: string;
  circulatingSupply: string;
  inflation: number;
  feesBurned?: string;
  stakingRewards?: number;
  validatorCount?: number;
}

export interface NetworkSecurity {
  hashRate?: number;
  stakeAmount?: string;
  decentralization: number;
  auditReports: AuditReport[];
  bugBounty?: number;
  incidentHistory: SecurityIncident[];
}

export interface SecurityIncident {
  date: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolved: boolean;
  impact?: string;
}

// ====================
// ADVANCED DEX & SWAP SYSTEM
// ====================

export interface DEXAggregator {
  name: string;
  version: string;
  supportedNetworks: number[];
  supportedProtocols: string[];
  
  // Routing
  findBestRoute: (params: SwapParams) => Promise<SwapRoute[]>;
  getQuote: (params: SwapParams) => Promise<SwapQuote>;
  executeSwap: (route: SwapRoute, params: ExecuteSwapParams) => Promise<string>;
  
  // Analytics
  getMarketData: () => Promise<MarketData>;
  getPriceImpact: (params: SwapParams) => Promise<number>;
  getLiquidity: (tokenA: string, tokenB: string) => Promise<LiquidityInfo>;
}

export interface SwapRoute {
  id: string;
  protocols: ProtocolRoute[];
  amountIn: string;
  amountOut: string;
  minAmountOut: string;
  priceImpact: number;
  gasEstimate: string;
  gasEstimateUSD: number;
  executionTime: number;
  confidence: number;
  tags: string[];
}

export interface ProtocolRoute {
  name: string;
  percentage: number;
  hops: SwapHop[];
  gas: string;
  fee: number;
}

export interface SwapHop {
  protocol: string;
  pool: string;
  tokenIn: EnhancedToken;
  tokenOut: EnhancedToken;
  amountIn: string;
  amountOut: string;
  fee: number;
  liquidity: string;
}

export interface LiquidityPool {
  id: string;
  protocol: string;
  name: string;
  tokens: EnhancedToken[];
  reserves: string[];
  totalSupply: string;
  liquidity: string;
  volume24h: string;
  fees24h: string;
  apy: number;
  fee: number;
  
  // User position
  userLiquidity?: string;
  userShare?: number;
  earned?: TokenBalance[];
  
  // Farming
  farmingAvailable: boolean;
  farmingApy?: number;
  farmingRewards?: EnhancedToken[];
}

// ====================
// ADVANCED PORTFOLIO & ANALYTICS
// ====================

export interface AdvancedPortfolio {
  // Overview
  totalValue: number;
  totalValueFormatted: string;
  netWorth: number;
  
  // Performance
  performance: PerformanceMetrics;
  
  // Asset allocation
  allocations: AssetAllocation[];
  
  // Positions
  tokens: TokenPosition[];
  nfts: NFTPosition[];
  defi: DeFiPosition[];
  
  // Risk metrics
  risk: PortfolioRisk;
  
  // Diversification
  diversification: DiversificationMetrics;
  
  // Yield generation
  yield: YieldMetrics;
  
  // Historical data
  history: PortfolioSnapshot[];
  
  // Benchmarking
  benchmarks: BenchmarkComparison[];
  
  // Tax optimization
  tax: TaxOptimization;
  
  // Rebalancing
  rebalancing: RebalancingSuggestions;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  alpha: number;
  beta: number;
  
  // Time-based returns
  returns: {
    '1d': number;
    '7d': number;
    '30d': number;
    '90d': number;
    '1y': number;
    ytd: number;
    all: number;
  };
}

export interface PortfolioRisk {
  totalRisk: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive' | 'speculative';
  concentrationRisk: number;
  liquidityRisk: number;
  smartContractRisk: number;
  impermanentLossRisk: number;
  correlationRisk: number;
  
  // VaR calculations
  valueAtRisk: {
    '1d': { '95%': number; '99%': number };
    '7d': { '95%': number; '99%': number };
    '30d': { '95%': number; '99%': number };
  };
}

// ====================
// ADVANCED SECURITY & COMPLIANCE
// ====================

export interface ComplianceFramework {
  // Regulatory compliance
  kyc: KYCData;
  aml: AMLData;
  
  // Jurisdictional compliance
  jurisdiction: string[];
  regulations: RegulationCompliance[];
  
  // Tax compliance
  tax: TaxCompliance;
  
  // Privacy compliance
  privacy: PrivacyCompliance;
  
  // Reporting
  reporting: ComplianceReporting;
}

export interface KYCData {
  level: 'none' | 'basic' | 'enhanced' | 'institutional';
  verified: boolean;
  documents: KYCDocument[];
  limits: TransactionLimits;
  riskRating: 'low' | 'medium' | 'high';
  lastUpdate: number;
  expiryDate?: number;
}

export interface AMLData {
  screeningLevel: 'basic' | 'enhanced' | 'comprehensive';
  watchlistCheck: boolean;
  pep: boolean; // Politically Exposed Person
  sanctions: SanctionCheck[];
  riskScore: number;
  monitoringEnabled: boolean;
  alerts: AMLAlert[];
}

export interface TaxCompliance {
  enabled: boolean;
  jurisdiction: string;
  taxYear: number;
  costBasis: CostBasisMethod;
  transactions: TaxTransaction[];
  reports: TaxReport[];
  optimization: TaxOptimization;
}

export type CostBasisMethod = 'fifo' | 'lifo' | 'specific_identification' | 'average_cost';

// ====================
// HARDWARE WALLET INTEGRATION
// ====================

export interface HardwareWalletIntegration {
  devices: HardwareDevice[];
  supported: HardwareWalletType[];
  activeDevice?: HardwareDevice;
  
  // Connection management
  connect: (type: HardwareWalletType) => Promise<HardwareDevice>;
  disconnect: (deviceId: string) => Promise<void>;
  
  // Account management
  getAccounts: (deviceId: string, derivationPath: string, count: number) => Promise<CypherAccount[]>;
  
  // Transaction signing
  signTransaction: (deviceId: string, transaction: TransactionRequest) => Promise<string>;
  signMessage: (deviceId: string, message: string, account: string) => Promise<string>;
}

export type HardwareWalletType = 
  | 'ledger_nano_s' 
  | 'ledger_nano_x' 
  | 'ledger_nano_s_plus'
  | 'trezor_one' 
  | 'trezor_model_t'
  | 'keystone_pro'
  | 'coldcard'
  | 'bitbox02'
  | 'safePal'
  | 'arculus';

export interface HardwareDevice {
  id: string;
  type: HardwareWalletType;
  name: string;
  model: string;
  manufacturer: string;
  isConnected: boolean;
  
  // Device information
  deviceInfo: DeviceInfo;
  
  // Capabilities
  capabilities: HardwareCapabilities;
  
  // Security features
  security: HardwareSecurity;
  
  // Accounts
  accounts: CypherAccount[];
  
  // Status
  status: DeviceStatus;
}

export interface HardwareCapabilities {
  bluetooth: boolean;
  usb: boolean;
  nfc: boolean;
  touchscreen: boolean;
  camera: boolean;
  
  // Crypto capabilities
  curves: string[];
  algorithms: string[];
  features: string[];
  
  // App support
  supportedApps: HardwareApp[];
}

export interface HardwareApp {
  name: string;
  version: string;
  installed: boolean;
  required: boolean;
  size: number;
}

// ====================
// SOCIAL RECOVERY & MULTISIG
// ====================

export interface SocialRecoveryWallet {
  address: string;
  guardians: Guardian[];
  threshold: number;
  recoveryDelay: number;
  
  // Recovery process
  activeRecovery?: RecoveryProcess;
  
  // Guardian management
  addGuardian: (guardian: Guardian) => Promise<string>;
  removeGuardian: (guardianAddress: string) => Promise<string>;
  updateThreshold: (newThreshold: number) => Promise<string>;
  
  // Recovery
  initiateRecovery: (newOwner: string) => Promise<string>;
  supportRecovery: (recoveryId: string) => Promise<string>;
  executeRecovery: (recoveryId: string) => Promise<string>;
  cancelRecovery: (recoveryId: string) => Promise<string>;
}

export interface Guardian {
  address: string;
  name: string;
  email?: string;
  phone?: string;
  verified: boolean;
  active: boolean;
  addedAt: number;
  lastActive?: number;
  
  // Guardian metadata
  relationship: 'family' | 'friend' | 'colleague' | 'service' | 'other';
  trustLevel: number;
  location?: string;
  
  // Communication preferences
  notifications: GuardianNotifications;
}

export interface GuardianNotifications {
  email: boolean;
  sms: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface RecoveryProcess {
  id: string;
  initiator: string;
  newOwner: string;
  threshold: number;
  supporters: string[];
  startTime: number;
  executeTime: number;
  status: 'pending' | 'active' | 'executed' | 'cancelled';
  votes: RecoveryVote[];
}

export interface RecoveryVote {
  guardian: string;
  vote: 'support' | 'oppose';
  timestamp: number;
  signature: string;
}

// ====================
// ADVANCED DAPP INTEGRATION
// ====================

export interface DAppEcosystem {
  connectedDApps: ConnectedDApp[];
  favoritesDApps: DApp[];
  recentDApps: DApp[];
  categories: DAppCategory[];
  
  // Session management
  sessions: DAppSession[];
  
  // Permission management
  permissions: DAppPermissions;
  
  // Analytics
  usage: DAppUsageAnalytics;
}

export interface ConnectedDApp {
  id: string;
  name: string;
  description: string;
  url: string;
  iconUrl: string;
  category: string;
  
  // Connection details
  connectedAt: number;
  lastUsed: number;
  sessionCount: number;
  
  // Permissions
  permissions: DAppPermission[];
  
  // Security
  security: DAppSecurity;
  
  // Usage stats
  transactionCount: number;
  volumeTransacted: string;
  gasSpent: string;
  
  // User preferences
  autoApprove: boolean;
  spendingLimit?: string;
  trusted: boolean;
}

export interface DAppSecurity {
  verified: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  securityScore: number;
  auditReports: AuditReport[];
  certifications: string[];
  warnings: SecurityWarning[];
}

export interface SecurityWarning {
  type: 'phishing' | 'malicious' | 'suspicious' | 'unverified';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

// ====================
// YIELD FARMING & STRATEGIES
// ====================

export interface YieldFarmingEcosystem {
  opportunities: YieldOpportunity[];
  activePositions: YieldPosition[];
  strategies: YieldStrategy[];
  automation: YieldAutomation;
  analytics: YieldAnalytics;
}

export interface EnhancedYieldOpportunity {
  id: string;
  protocol: string;
  name: string;
  description: string;
  
  // Yield metrics
  apy: number;
  baseApy: number;
  rewardApy: number;
  boostedApy?: number;
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  riskFactors: string[];
  impermanentLoss: number;
  
  // Requirements
  tokens: EnhancedToken[];
  minDeposit: string;
  lockPeriod?: number;
  
  // Rewards
  rewardTokens: EnhancedToken[];
  claimFrequency: 'block' | 'daily' | 'weekly' | 'manual';
  
  // Historical performance
  performance: PerformanceData[];
  
  // Pool information
  tvl: number;
  utilizationRate: number;
  
  // User eligibility
  eligible: boolean;
  requirements: string[];
}

export interface YieldPosition {
  id: string;
  opportunity: YieldOpportunity;
  amount: string;
  amountUSD: number;
  
  // Performance
  currentValue: string;
  currentValueUSD: number;
  pnl: number;
  pnlPercentage: number;
  realizedPnl: number;
  unrealizedPnl: number;
  
  // Rewards
  earnedRewards: TokenBalance[];
  pendingRewards: TokenBalance[];
  
  // Timing
  entryTime: number;
  lastHarvest?: number;
  unlockTime?: number;
  
  // Management
  autoCompound: boolean;
  autoHarvest: boolean;
  stopLoss?: number;
  takeProfit?: number;
}

// ====================
// ADVANCED ANALYTICS & AI
// ====================

export interface AIAnalytics {
  // Portfolio optimization
  optimization: PortfolioOptimization;
  
  // Risk analysis
  riskAnalysis: AIRiskAnalysis;
  
  // Market predictions
  predictions: MarketPredictions;
  
  // Behavioral insights
  behavioral: BehavioralInsights;
  
  // Automated strategies
  strategies: AIStrategy[];
  
  // Anomaly detection
  anomalies: Anomaly[];
}

export interface PortfolioOptimization {
  recommendations: OptimizationRecommendation[];
  rebalancing: RebalancingSuggestions;
  taxOptimization: TaxOptimization;
  riskAdjustment: RiskAdjustment[];
}

export interface OptimizationRecommendation {
  type: 'diversify' | 'consolidate' | 'rebalance' | 'harvest' | 'compound';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number;
  estimatedGas: string;
  deadline?: number;
  
  // Action details
  actions: RecommendedAction[];
}

export interface RecommendedAction {
  type: 'buy' | 'sell' | 'stake' | 'unstake' | 'claim' | 'approve';
  token: EnhancedToken;
  amount: string;
  protocol?: string;
  reason: string;
  urgency: number;
}

// ====================
// CROSS-CHAIN & BRIDGE SYSTEM
// ====================

export interface CrossChainBridge {
  id: string;
  name: string;
  type: BridgeType;
  description: string;
  
  // Supported networks
  supportedNetworks: EnhancedNetwork[];
  
  // Routes
  routes: BridgeRoute[];
  
  // Security
  security: BridgeSecurity;
  
  // Performance
  performance: BridgePerformance;
  
  // Integration
  integrated: boolean;
  apiEndpoint?: string;
}

export type BridgeType = 
  | 'lock_mint' 
  | 'burn_mint' 
  | 'liquidity_pool' 
  | 'atomic_swap' 
  | 'wrapped_token' 
  | 'state_channel' 
  | 'rollup';

export interface BridgeRoute {
  id: string;
  fromNetwork: EnhancedNetwork;
  toNetwork: EnhancedNetwork;
  fromToken: EnhancedToken;
  toToken: EnhancedToken;
  
  // Costs
  fee: string;
  feePercentage: number;
  gasEstimate: string;
  
  // Timing
  estimatedTime: number;
  confirmations: number;
  
  // Limits
  minAmount: string;
  maxAmount: string;
  dailyLimit: string;
  
  // Status
  available: boolean;
  maintenance: boolean;
  
  // Steps
  steps: BridgeStep[];
}

export interface BridgeStep {
  id: string;
  type: 'deposit' | 'lock' | 'mint' | 'burn' | 'release' | 'withdraw';
  network: EnhancedNetwork;
  contract: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  estimatedTime: number;
  actualTime?: number;
}

// ====================
// GOVERNANCE & DAO INTEGRATION
// ====================

export interface DAOEcosystem {
  memberships: DAOMembership[];
  proposals: GovernanceProposal[];
  delegations: VotingDelegation[];
  voting: VotingPower[];
  treasury: DAOTreasury[];
}

export interface DAOMembership {
  dao: DAO;
  memberSince: number;
  role: 'member' | 'contributor' | 'council' | 'founder';
  contributions: Contribution[];
  reputation: number;
  votingPower: string;
  delegatedPower?: string;
  
  // Rewards & incentives
  rewards: TokenBalance[];
  claimableRewards: TokenBalance[];
  
  // Participation
  proposalsCreated: number;
  proposalsVoted: number;
  participationRate: number;
}

export interface DAO {
  id: string;
  name: string;
  description: string;
  category: DAOCategory;
  
  // Governance
  governanceToken: EnhancedToken;
  votingStrategy: VotingStrategy;
  quorum: number;
  
  // Treasury
  treasury: DAOTreasury;
  
  // Members
  memberCount: number;
  activeMembers: number;
  
  // Activity
  proposalCount: number;
  activeProposals: number;
  
  // Social
  social: SocialData;
  community: CommunityMetrics;
}

export type DAOCategory = 
  | 'defi' 
  | 'nft' 
  | 'gaming' 
  | 'social' 
  | 'investment' 
  | 'grants' 
  | 'protocol' 
  | 'service' 
  | 'media' 
  | 'education';

// ====================
// GAMING & METAVERSE INTEGRATION
// ====================

export interface GameFiEcosystem {
  games: Game[];
  characters: GameCharacter[];
  items: GameItem[];
  guilds: Guild[];
  tournaments: Tournament[];
  rewards: GameReward[];
}

export interface Game {
  id: string;
  name: string;
  description: string;
  genre: GameGenre[];
  
  // Game mechanics
  playToEarn: boolean;
  freeToPlay: boolean;
  tokenEconomy: TokenEconomy;
  
  // NFT integration
  nftAssets: GameNFT[];
  
  // DeFi integration
  defiFeatures: string[];
  
  // Community
  playerCount: number;
  community: CommunityMetrics;
  
  // Performance
  performance: GamePerformance;
}

export type GameGenre = 
  | 'mmorpg' 
  | 'strategy' 
  | 'simulation' 
  | 'card' 
  | 'puzzle' 
  | 'racing' 
  | 'fighting' 
  | 'adventure' 
  | 'casual';

// ====================
// BACKUP & RECOVERY SYSTEM
// ====================

export interface BackupSystem {
  backups: WalletBackup[];
  recoveryMethods: RecoveryMethod[];
  seedPhraseBackup: SeedPhraseBackup;
  cloudBackup?: CloudBackup;
  hardwareBackup?: HardwareBackup;
  
  // Backup scheduling
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackup: number;
  nextBackup: number;
  
  // Verification
  verificationTests: BackupTest[];
}

export interface WalletBackup {
  id: string;
  type: BackupType;
  timestamp: number;
  encrypted: boolean;
  verified: boolean;
  size: number;
  
  // Metadata
  walletVersion: string;
  accountCount: number;
  networkCount: number;
  
  // Storage
  storageLocation: string;
  storageProvider?: string;
  
  // Security
  checksum: string;
  encryptionMethod?: string;
}

export type BackupType = 
  | 'full' 
  | 'incremental' 
  | 'differential' 
  | 'seed_only' 
  | 'settings_only' 
  | 'transactions_only';



export type RecoveryType = 
  | 'seed_phrase' 
  | 'private_key' 
  | 'keystore' 
  | 'hardware_wallet' 
  | 'social_recovery' 
  | 'multisig' 
  | 'cloud_backup' 
  | 'paper_backup' 
  | 'metal_backup';

// ====================
// UTILITY TYPES & HELPERS
// ====================

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'hardware';
  os: string;
  version: string;
  userAgent?: string;
  fingerprint: string;
  
  // Security features
  hasSecureEnclave: boolean;
  hasBiometrics: boolean;
  hasNFC: boolean;
  hasCamera: boolean;
  
  // Network
  ipAddress?: string;
  location?: LocationInfo;
}

export interface LocationInfo {
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone: string;
}

export interface SocialData {
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  reddit?: string;
  github?: string;
  medium?: string;
  youtube?: string;
  linkedin?: string;
  facebook?: string;
}

export interface CommunityMetrics {
  followers: number;
  engagement: number;
  activity: number;
  sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  growth: number;
  
  // Platform-specific metrics
  twitterFollowers?: number;
  discordMembers?: number;
  telegramMembers?: number;
  redditSubscribers?: number;
  githubStars?: number;
}

// ====================
// API & SERVICE TYPES
// ====================

export interface APIService {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number;
  timeout: number;
  retries: number;
  
  // Health monitoring
  isHealthy: boolean;
  lastCheck: number;
  uptime: number;
  latency: number;
  
  // Usage tracking
  requestCount: number;
  errorCount: number;
  successRate: number;
}

export interface PaginatedAPIResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: any;
}

// ====================
// CONFIGURATION TYPES
// ====================

export interface CypherWalletConfig {
  // Version
  version: string;
  buildNumber: number;
  
  // Environment
  environment: 'development' | 'staging' | 'production';
  debug: boolean;
  testnet: boolean;
  
  // Security
  security: SecurityConfig;
  
  // Networks
  networks: EnhancedNetwork[];
  defaultNetwork: number;
  
  // Features
  features: FeatureFlags;
  
  // APIs
  apis: APIService[];
  
  // UI/UX
  theme: ThemeConfig;
  
  // Performance
  performance: PerformanceConfig;
  
  // Analytics
  analytics: AnalyticsConfig;
}

export interface FeatureFlags {
  // Core features
  multiWallet: boolean;
  hardwareWallet: boolean;
  socialRecovery: boolean;
  biometrics: boolean;
  
  // DeFi features
  defiIntegration: boolean;
  yieldFarming: boolean;
  staking: boolean;
  lending: boolean;
  
  // Trading features
  dexAggregation: boolean;
  limitOrders: boolean;
  portfolioTracking: boolean;
  priceAlerts: boolean;
  
  // NFT features
  nftSupport: boolean;
  nftMarketplace: boolean;
  nftStaking: boolean;
  
  // Advanced features
  crossChain: boolean;
  aiAnalytics: boolean;
  governance: boolean;
  gameFi: boolean;
  
  // Compliance
  kycIntegration: boolean;
  taxReporting: boolean;
  
  // Experimental
  quantumResistance: boolean;
  zeroKnowledge: boolean;
  homomorphicEncryption: boolean;
}

// ====================
// ERROR HANDLING & LOGGING
// ====================

export interface CypherError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  
  // Context
  context: ErrorContext;
  
  // Stack trace
  stack?: string;
  
  // User-friendly message
  userMessage?: string;
  
  // Recovery suggestions
  recovery?: RecoverySuggestion[];
  
  // Metrics
  frequency: number;
  firstOccurrence: number;
  lastOccurrence: number;
}

export type ErrorCategory = 
  | 'network' 
  | 'blockchain' 
  | 'security' 
  | 'validation' 
  | 'authentication' 
  | 'authorization' 
  | 'storage' 
  | 'ui' 
  | 'integration' 
  | 'performance' 
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  component: string;
  method: string;
  params?: any;
  state?: any;
  user?: string;
  network?: string;
  device?: DeviceInfo;
}

export interface RecoverySuggestion {
  action: string;
  description: string;
  automatic: boolean;
}

// Missing type definitions (placeholders for advanced features)
export interface AssetAllocation {
  asset: string;
  percentage: number;
  value: string;
}

export interface TokenPosition {
  token: EnhancedToken;
  balance: string;
  value: string;
}

export interface NFTPosition {
  collection: string;
  tokenId: string;
  value: string;
}

export interface DiversificationMetrics {
  score: number;
  recommendation: string;
}

export interface YieldMetrics {
  apy: number;
  earnings: string;
}

export interface PortfolioSnapshot {
  timestamp: number;
  value: string;
  assets: AssetAllocation[];
}

export interface BenchmarkComparison {
  benchmark: string;
  performance: number;
}

export interface TaxOptimization {
  taxLoss: string;
  recommendations: string[];
}

export interface RebalancingSuggestions {
  suggestions: string[];
  urgency: 'low' | 'medium' | 'high';
}

export interface RegulationCompliance {
  region: string;
  compliant: boolean;
  requirements: string[];
}

export interface PrivacyCompliance {
  level: 'basic' | 'enhanced' | 'maximum';
  features: string[];
}

export interface ComplianceReporting {
  reports: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface SanctionCheck {
  address: string;
  sanctioned: boolean;
  reason?: string;
}

export interface TransactionRequest {
  to: string;
  value: string;
  data?: string;
}

export interface HardwareSecurity {
  encrypted: boolean;
  biometric: boolean;
}

export interface DeviceStatus {
  connected: boolean;
  battery?: number;
}

export interface DApp {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface DAppCategory {
  name: string;
  dapps: DApp[];
}

export interface DAppSession {
  id: string;
  dapp: DApp;
  startTime: number;
}

export interface DAppPermissions {
  dapp: string;
  permissions: string[];
}

export interface DAppUsageAnalytics {
  dapp: string;
  usage: number;
}

export interface DAppPermission {
  permission: string;
  granted: boolean;
}

export interface YieldAutomation {
  enabled: boolean;
  strategy: string;
}

export interface YieldAnalytics {
  totalYield: string;
  apy: number;
}

export interface AIRiskAnalysis {
  score: number;
  factors: string[];
}

export interface MarketPredictions {
  token: string;
  prediction: number;
}

export interface BehavioralInsights {
  patterns: string[];
  suggestions: string[];
}

export interface AIStrategy {
  name: string;
  description: string;
}

export interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high';
}

export interface RiskAdjustment {
  level: number;
  recommendation: string;
}

export interface BridgeSecurity {
  protocol: string;
  securityScore: number;
}

export interface BridgePerformance {
  protocol: string;
  avgTime: number;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
}

export interface VotingDelegation {
  delegate: string;
  power: string;
}

export interface VotingPower {
  amount: string;
  token: string;
}

export interface DAOTreasury {
  value: string;
  tokens: string[];
}

export interface Contribution {
  type: string;
  amount: string;
}

export interface VotingStrategy {
  name: string;
  criteria: string[];
}

export interface GameCharacter {
  id: string;
  name: string;
  level: number;
}

export interface GameItem {
  id: string;
  name: string;
  rarity: string;
}

export interface Guild {
  id: string;
  name: string;
  members: number;
}

export interface Tournament {
  id: string;
  name: string;
  prize: string;
}

export interface GameReward {
  type: string;
  amount: string;
}

export interface TokenEconomy {
  token: string;
  circulation: string;
}

export interface GameNFT {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

export interface GamePerformance {
  score: number;
  rank: number;
}

export interface SeedPhraseBackup {
  encrypted: string;
  timestamp: number;
}

export interface CloudBackup {
  provider: string;
  encrypted: boolean;
}

export interface HardwareBackup {
  device: string;
  verified: boolean;
}

export interface BackupTest {
  passed: boolean;
  timestamp: number;
}

export interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
}

export interface PerformanceConfig {
  caching: boolean;
  preloading: boolean;
}

export interface AnalyticsConfig {
  enabled: boolean;
  anonymous: boolean;
}

// Export all types for easy importing
export * from './index';
