# CYPHER Wallet

A secure, privacy-focused React Native Ethereum wallet with advanced features for self-custody and decentralized finance.

## About CYPHER Wallet

CYPHER Wallet is a production-ready mobile cryptocurrency wallet designed for the Ethereum ecosystem. Built with security-first principles, it provides users with complete control over their digital assets while offering cutting-edge privacy technologies.

### Key Features

- **HD Wallet Support**: BIP39/BIP44 hierarchical deterministic wallets
- **Biometric Authentication**: Face ID, Touch ID, and fingerprint support
- **Zero-Knowledge Proofs**: Privacy pools with Groth16-based ZK-SNARKs
- **Multi-Network Support**: Ethereum, Polygon, BSC, Arbitrum, Optimism
- **Shielded Transactions**: Send and receive ETH with complete privacy
- **Hardware Wallet Integration**: Ledger and Trezor compatibility
- **Cross-Platform**: iOS and Android support

## Home Page

The home page provides an intuitive dashboard showing:
- Account balance across all networks
- Recent transactions
- Quick access to send/receive functions
- Privacy pool status
- Security settings overview

## Core Functionalities

### Wallet Management
- Create new wallets with secure seed phrase generation
- Import existing wallets via seed phrase or private key
- Multiple account support within a single wallet

### Transactions
- Send ETH and ERC-20 tokens
- Receive payments with QR code generation
- Transaction history with detailed status tracking
- Gas fee optimization and transaction speed controls

### Privacy Features
- Deposit to privacy pools for anonymous transactions
- Withdraw from pools with zero-knowledge proofs
- Multi-denomination pools (0.1, 1.0, 10.0 ETH)
- ENS privacy controls

### Security
- Auto-lock with configurable timeouts
- Biometric authentication for transactions
- Secure key storage using platform keychains
- Transaction confirmation dialogs

## Getting Started

### Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Yarn or npm package manager

### Installation

```bash
git clone https://github.com/Beastburner/C.Y.P.H.E.R.git
cd Demo-EthereumWallet-main
npm install
```

### Running the App

#### For Android
```bash
npm run android
```

#### For iOS (macOS only)
```bash
npm run ios
```

#### Start Metro Bundler
```bash
npm start
```

### Build Commands

#### Clean Start
```bash
npm run start-clean
```

#### Build Production Bundle for Android
```bash
npm run build-production-bundle
```

#### Build Clean Release for Android
```bash
npm run build-clean-release
```

## Project Structure

```
Demo-EthereumWallet-main/
├── android/                    # Android native code
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   ├── config/                 # Configuration files
│   │   ├── apiConfig.ts
│   │   ├── contracts.json
│   │   ├── CypherNetworks.ts
│   │   └── networks.ts
│   ├── context/                # React contexts for state management
│   │   ├── EnhancedWalletContext.tsx
│   │   └── WalletContext.tsx
│   ├── navigation/             # Navigation configuration
│   │   └── CypherNavigation.tsx
│   ├── performance/            # Performance optimization utilities
│   │   ├── LightningPerformanceManager.ts
│   │   └── PerformanceOptimizer.ts
│   ├── screens/                # App screens
│   │   ├── Auth/
│   │   │   └── AuthenticationScreen.tsx
│   │   ├── BackupRecovery/
│   │   │   └── BackupRecoveryScreen.tsx
│   │   ├── Browser/
│   │   │   └── BrowserScreen.tsx
│   │   ├── DApp/
│   │   │   └── DAppBrowserScreen.tsx
│   │   ├── Home/
│   │   │   └── HomeNew.tsx
│   │   ├── NFT/
│   │   │   ├── NFTCollectionScreen.tsx
│   │   │   ├── NFTDashboard.tsx
│   │   │   ├── NFTMarketplaceScreen.tsx
│   │   │   ├── NFTPortfolioScreen.tsx
│   │   │   └── NFTScreen.tsx
│   │   ├── Onboarding/
│   │   │   ├── CreateWallet.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── Settings/
│   │   │   ├── BackupRestoreScreen.tsx
│   │   │   ├── ChangePasswordScreen.tsx
│   │   │   ├── NetworkManagementScreen.tsx
│   │   │   ├── NetworkSelector.tsx
│   │   │   ├── SecuritySettings.tsx
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── WalletManagementScreen.tsx
│   │   ├── Swap/
│   │   │   ├── SwapScreen.tsx
│   │   │   └── SwapScreenCypher.tsx
│   │   ├── TokenDetail/
│   │   │   └── TokenDetailScreen.tsx
│   │   ├── TokenManagement/
│   │   │   └── TokenManagementScreen.tsx
│   │   ├── Transactions/
│   │   │   ├── TransactionManagementScreen.tsx
│   │   │   └── TransactionsScreen.tsx
│   │   └── WalletManager/
│   │       └── WalletManagerScreen.tsx
│   ├── theme/                  # Theme and styling
│   │   ├── animations.ts
│   │   ├── colors.ts
│   │   ├── darkTheme.ts
│   │   ├── index.ts
│   │   ├── layout.ts
│   │   ├── ThemeProvider.tsx
│   │   └── typography.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── cypherTypes.ts
│   │   ├── ecliptaTypes.ts
│   │   ├── env.d.ts
│   │   └── index.ts
│   └── utils/                  # Utility functions
│       ├── autoLockManager.ts
│       ├── bigNumberUtils.ts
│       ├── biometricAuth.ts
│       ├── bip39Helpers.ts
│       ├── circuitOptimizer.ts
│       ├── cryptoUtils.ts
│       ├── DataLoader.ts
│       ├── enhancedWalletManager.ts
│       ├── ethersHelpers.ts
│       ├── hardwareWalletManager.ts
│       ├── keyboardManager.ts
│       ├── logger.ts
│       ├── polyfills.ts
│       ├── secureStorage.ts
│       ├── securityManager.ts
│       ├── simpleCrypto.ts
│       ├── storageHelpers.ts
│       ├── transactionValidator.ts
│       ├── validators.ts
│       ├── WalletImportTester.ts
│       └── zkProofGenerator.ts
├── App.tsx                     # Main app component
├── index.js                    # App entry point
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler configuration
├── .eslintrc.js                # ESLint configuration
├── .prettierrc.js              # Prettier configuration
└── README.md                   # This file
```

## Key Dependencies

### Core Libraries
- **React Native**: 0.73.11 - Mobile app framework
- **React**: 18.2.0 - UI library
- **Redux Toolkit**: State management
- **React Navigation**: Navigation library

### Ethereum/Web3
- **ethers**: Ethereum wallet and utilities
- **@openzeppelin/contracts**: Smart contract library
- **bip39**: BIP39 mnemonic generation
- **ethereumjs-util**: Ethereum utilities

### Security & Storage
- **react-native-keychain**: Secure key storage
- **expo-local-authentication**: Biometric authentication
- **react-native-biometrics**: Biometric support

### UI & Styling
- **styled-components**: CSS-in-JS styling
- **react-native-vector-icons**: Icon library
- **react-native-linear-gradient**: Gradient backgrounds

### Additional Features
- **qrcode**: QR code generation
- **axios**: HTTP client
- **big.js**: Big number arithmetic
- **circom**: Zero-knowledge proof circuits
- **hardhat**: Ethereum development environment

## Contributing

We welcome contributions! Please read our contributing guidelines and submit pull requests for any improvements.

## License

MIT License - see LICENSE file for details.

## Contact

For support or questions, please open an issue on GitHub or contact the development team.
