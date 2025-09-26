// Environment configuration for Cypher Wallet
declare module '@env' {
  // RPC Provider Keys
  export const INFURA_KEY: string;
  export const ALCHEMY_KEY: string;
  export const ETHERSCAN_API_KEY: string;
  
  // Swap APIs
  export const ZEROX_API_KEY: string;
  export const ONEINCH_API_KEY: string;
  
  // Wallet Connection
  export const WALLETCONNECT_PROJECT_ID: string;
  
  // Price API
  export const COINGECKO_API_KEY: string;
  export const COINGECKO_API_URL: string;
  export const COINMARKETCAP_API_URL: string;
  
  // Configuration
  export const DEFAULT_NETWORK: string;
  export const DEV_MODE: string;
  export const ENABLE_BIOMETRICS: string;
  export const PIN_ATTEMPTS_LIMIT: string;
  export const ENABLE_WALLETCONNECT: string;
  export const ENABLE_SWAP: string;
  export const ENABLE_TESTNET: string;
  
  // Public RPC Endpoints
  export const ETHEREUM_RPC_URL: string;
  export const POLYGON_RPC_URL: string;
  export const BSC_RPC_URL: string;
}

// Global type definitions
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      [key: string]: string | undefined;
    }
  }

  interface Window {
    ethereum?: EthereumProvider;
    web3?: any;
    cypher?: CypherWalletProvider;
  }

  interface EthereumProvider {
    isCypher?: boolean;
    isMetaMask?: boolean;
    chainId: string;
    selectedAddress: string | null;
    networkVersion: string;
    
    // Core EIP-1193 methods
    request(args: { method: string; params?: any[] }): Promise<any>;
    enable(): Promise<string[]>;
    send(method: string, params?: any[]): Promise<any>;
    sendAsync(request: any, callback: (error: any, response: any) => void): void;
    
    // Event emitters
    on(event: string, handler: (...args: any[]) => void): void;
    removeListener(event: string, handler: (...args: any[]) => void): void;
    
    // Legacy compatibility
    isConnected(): boolean;
    _metamask?: {
      isUnlocked(): Promise<boolean>;
    };
  }

  interface CypherWalletProvider extends EthereumProvider {
    isCypher: true;
    version: string;
    
    // Advanced Cypher features
    getPortfolioValue(): Promise<number>;
    getDeFiPositions(): Promise<any[]>;
    getNFTs(): Promise<any[]>;
    getTransactionHistory(): Promise<any[]>;
    estimateOptimalGas(): Promise<any>;
    enableMEVProtection(): Promise<void>;
    switchToOptimalNetwork(): Promise<void>;
    
    // Security features
    enableBiometricAuth(): Promise<boolean>;
    enableTwoFactorAuth(): Promise<boolean>;
    checkTransactionSecurity(tx: any): Promise<any>;
    validateContract(address: string): Promise<any>;
  }
}
