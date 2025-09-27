/**
 * Privacy Feature Components Export
 * Dual-Layer Privacy Architecture for C.Y.P.H.E.R Wallet
 */

// Components
export { default as PrivacyToggle } from './PrivacyToggle';
export { default as PrivateTransactionForm } from './PrivateTransactionForm';
export { default as PrivacyDashboard } from './PrivacyDashboard';

// Services
export { privacyService } from '../../services/PrivacyService';
export { privacyEnabledWallet } from '../../services/PrivacyEnabledWallet';

// Types (re-export from PrivacyService)
export type {
  PrivacySettings,
  ShieldedDeposit,
  ZKProofData,
  PrivateAddress,
  MixingResult,
  PrivacyReport,
  AliasAccount,
  PrivacyNote,
  PrivacyTransaction,
} from '../../services/PrivacyService';

/**
 * Usage Examples:
 * 
 * 1. Basic Privacy Toggle:
 * ```tsx
 * import { PrivacyToggle } from './components/privacy';
 * 
 * <PrivacyToggle onToggle={(enabled) => console.log('Privacy:', enabled)} />
 * ```
 * 
 * 2. Private Transaction Form:
 * ```tsx
 * import { PrivateTransactionForm } from './components/privacy';
 * 
 * <PrivateTransactionForm
 *   initialAmount="1.5"
 *   initialRecipient="0x..."
 *   onTransactionSubmit={(tx) => console.log('Transaction:', tx)}
 * />
 * ```
 * 
 * 3. Complete Privacy Dashboard:
 * ```tsx
 * import { PrivacyDashboard } from './components/privacy';
 * 
 * <PrivacyDashboard onNavigateToTransaction={() => navigation.navigate('Transactions')} />
 * ```
 * 
 * 4. Privacy-Enabled Wallet:
 * ```tsx
 * import { privacyEnabledWallet } from './components/privacy';
 * 
 * // Enable privacy mode
 * const result = await privacyEnabledWallet.enablePrivacyMode();
 * 
 * // Send private transaction
 * const tx = await privacyEnabledWallet.sendTransaction({
 *   to: '0x...',
 *   value: '1.0',
 *   usePrivacy: true
 * });
 * ```
 * 
 * 5. Direct Privacy Service Usage:
 * ```tsx
 * import { privacyService } from './components/privacy';
 * 
 * // Create alias
 * const alias = await privacyService.createAlias('MyAlias');
 * 
 * // Send private transaction
 * const result = await privacyService.sendPrivateTransactionWithAlias({
 *   aliasId: alias.aliasId,
 *   recipient: '0x...',
 *   amount: '1.0'
 * });
 * ```
 */
