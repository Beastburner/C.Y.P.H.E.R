/**
 * CYPHER WALLET - MAINNET NETWORKS CONFIGURATION
 * Professional multi-chain support with real API integration
 * Supported: ETH, Polygon, BSC, Avalanche, Fantom, Arbitrum, Optimism, Solana, Cardano, Polkadot
 */

export interface NetworkConfig {
  id: string;
  name: string;
  displayName: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  decimals: number;
  blockExplorerUrl: string;
  isTestnet: boolean;
  isActive: boolean;
  icon: string;
  color: string;
  features: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  bridgeSupport?: string[];
  defiProtocols?: string[];
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  // Localhost/Hardhat (Development)
  {
    id: 'localhost',
    name: 'Hardhat Local Network',
    displayName: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 1337,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'http://localhost:8545', // No explorer for local
    isTestnet: true,
    isActive: true,
    icon: '🔧',
    color: '#FFA500',
    features: ['defi', 'nft', 'testnet', 'development'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'http://127.0.0.1:8545',
      'http://localhost:8545'
    ],
    blockExplorerUrls: ['http://localhost:8545'],
    bridgeSupport: [],
    defiProtocols: []
  },

  // Ethereum Sepolia Testnet (Primary for development)
  {
    id: 'sepolia',
    name: 'Ethereum Sepolia Testnet',
    displayName: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
    chainId: 11155111,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
    isActive: true,
    icon: '⟠',
    color: '#627EEA',
    features: ['defi', 'nft', 'testnet', 'l1'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://sepolia.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org',
      'https://rpc2.sepolia.org',
      'https://sepolia.gateway.tenderly.co'
    ],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    bridgeSupport: [],
    defiProtocols: ['uniswap']
  },

  // Ethereum Mainnet
  {
    id: 'ethereum',
    name: 'Ethereum Mainnet',
    displayName: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
    chainId: 1,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://etherscan.io',
    isTestnet: false,
    isActive: true,
    icon: '⟠',
    color: '#627EEA',
    features: ['defi', 'nft', 'staking', 'governance', 'l1'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://mainnet.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth'
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    bridgeSupport: ['polygon', 'arbitrum', 'optimism', 'bsc', 'avalanche'],
    defiProtocols: ['uniswap', 'aave', 'compound', 'curve', 'sushiswap']
  },

  // Polygon Mainnet
  {
    id: 'polygon',
    name: 'Polygon Mainnet',
    displayName: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
    chainId: 137,
    symbol: 'MATIC',
    decimals: 18,
    blockExplorerUrl: 'https://polygonscan.com',
    isTestnet: false,
    isActive: true,
    icon: '⬟',
    color: '#8247E5',
    features: ['defi', 'nft', 'l2', 'low-fees'],
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: [
      'https://polygon-mainnet.infura.io/v3/18e72f0e085d4f978e259201b7dbfe66',
      'https://polygon-rpc.com',
      'https://rpc.ankr.com/polygon'
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    bridgeSupport: ['ethereum', 'bsc', 'avalanche'],
    defiProtocols: ['quickswap', 'aave', 'curve', 'sushiswap']
  },

  // Binance Smart Chain
  {
    id: 'bsc',
    name: 'BNB Smart Chain',
    displayName: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
    chainId: 56,
    symbol: 'BNB',
    decimals: 18,
    blockExplorerUrl: 'https://bscscan.com',
    isTestnet: false,
    isActive: true,
    icon: '⬢',
    color: '#F3BA2F',
    features: ['defi', 'nft', 'low-fees', 'high-throughput'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: [
      'https://bsc-dataseed1.binance.org/',
      'https://bsc-dataseed2.binance.org/',
      'https://rpc.ankr.com/bsc'
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    bridgeSupport: ['ethereum', 'polygon', 'avalanche'],
    defiProtocols: ['pancakeswap', 'venus', 'biswap']
  },

  // Avalanche C-Chain
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    displayName: 'Avalanche',
    rpcUrl: process.env.AVALANCHE_RPC_URL || 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    symbol: 'AVAX',
    decimals: 18,
    blockExplorerUrl: 'https://snowtrace.io',
    isTestnet: false,
    isActive: true,
    icon: '🔺',
    color: '#E84142',
    features: ['defi', 'nft', 'fast-finality', 'subnets'],
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://rpc.ankr.com/avalanche'
    ],
    blockExplorerUrls: ['https://snowtrace.io'],
    bridgeSupport: ['ethereum', 'polygon', 'bsc'],
    defiProtocols: ['traderjoe', 'aave', 'curve', 'pangolin']
  },

  // Fantom Opera
  {
    id: 'fantom',
    name: 'Fantom Opera',
    displayName: 'Fantom',
    rpcUrl: process.env.FANTOM_RPC_URL || 'https://rpc.ftm.tools/',
    chainId: 250,
    symbol: 'FTM',
    decimals: 18,
    blockExplorerUrl: 'https://ftmscan.com',
    isTestnet: false,
    isActive: true,
    icon: '👻',
    color: '#1969FF',
    features: ['defi', 'fast-finality', 'low-fees'],
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: [
      'https://rpc.ftm.tools/',
      'https://rpc.ankr.com/fantom'
    ],
    blockExplorerUrls: ['https://ftmscan.com'],
    bridgeSupport: ['ethereum', 'bsc', 'polygon'],
    defiProtocols: ['spookyswap', 'beethovenx', 'geist']
  },

  // Arbitrum One
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    displayName: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://arbiscan.io',
    isTestnet: false,
    isActive: true,
    icon: '🔵',
    color: '#28A0F0',
    features: ['defi', 'nft', 'l2', 'ethereum-compatible'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://arb1.arbitrum.io/rpc',
      'https://rpc.ankr.com/arbitrum'
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    bridgeSupport: ['ethereum', 'polygon'],
    defiProtocols: ['uniswap', 'sushiswap', 'curve', 'gmx']
  },

  // Optimism
  {
    id: 'optimism',
    name: 'Optimism',
    displayName: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    symbol: 'ETH',
    decimals: 18,
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    isTestnet: false,
    isActive: true,
    icon: '🔴',
    color: '#FF0420',
    features: ['defi', 'nft', 'l2', 'ethereum-compatible'],
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: [
      'https://mainnet.optimism.io',
      'https://rpc.ankr.com/optimism'
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    bridgeSupport: ['ethereum', 'arbitrum'],
    defiProtocols: ['uniswap', 'synthetix', 'curve', 'velodrome']
  },

  // Solana Mainnet
  {
    id: 'solana',
    name: 'Solana Mainnet',
    displayName: 'Solana',
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://solana-api.projectserum.com',
    chainId: 101, // Solana doesn't use chainId like EVM, but we use this for identification
    symbol: 'SOL',
    decimals: 9,
    blockExplorerUrl: 'https://explorer.solana.com',
    isTestnet: false,
    isActive: true,
    icon: '◎',
    color: '#9945FF',
    features: ['defi', 'nft', 'high-speed', 'low-fees'],
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    rpcUrls: [
      'https://solana-api.projectserum.com',
      'https://rpc.ankr.com/solana'
    ],
    blockExplorerUrls: ['https://explorer.solana.com'],
    bridgeSupport: ['ethereum', 'bsc'],
    defiProtocols: ['serum', 'raydium', 'orca', 'jupiter']
  },

  // Cardano Mainnet
  {
    id: 'cardano',
    name: 'Cardano Mainnet',
    displayName: 'Cardano',
    rpcUrl: process.env.CARDANO_RPC_URL || 'https://cardano-mainnet.blockfrost.io/api/v0/',
    chainId: 1815, // Cardano network magic number
    symbol: 'ADA',
    decimals: 6,
    blockExplorerUrl: 'https://cardanoscan.io',
    isTestnet: false,
    isActive: true,
    icon: '₳',
    color: '#0033AD',
    features: ['staking', 'governance', 'sustainability', 'smart-contracts'],
    nativeCurrency: {
      name: 'Cardano',
      symbol: 'ADA',
      decimals: 6
    },
    rpcUrls: [
      'https://cardano-mainnet.blockfrost.io/api/v0/'
    ],
    blockExplorerUrls: ['https://cardanoscan.io'],
    bridgeSupport: ['ethereum'],
    defiProtocols: ['minswap', 'sundaeswap', 'muesliswap']
  },

  // Polkadot
  {
    id: 'polkadot',
    name: 'Polkadot',
    displayName: 'Polkadot',
    rpcUrl: process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io',
    chainId: 0, // Polkadot uses different addressing
    symbol: 'DOT',
    decimals: 10,
    blockExplorerUrl: 'https://polkadot.subscan.io',
    isTestnet: false,
    isActive: true,
    icon: '●',
    color: '#E6007A',
    features: ['parachains', 'staking', 'governance', 'interoperability'],
    nativeCurrency: {
      name: 'Polkadot',
      symbol: 'DOT',
      decimals: 10
    },
    rpcUrls: [
      'wss://rpc.polkadot.io'
    ],
    blockExplorerUrls: ['https://polkadot.subscan.io'],
    bridgeSupport: ['ethereum'],
    defiProtocols: ['acala', 'moonbeam', 'astar']
  }
];

// Default network configuration
export const DEFAULT_NETWORK = SUPPORTED_NETWORKS[0]; // Localhost for hackathon development

// Network by chainId lookup
export const NETWORKS_BY_CHAIN_ID = SUPPORTED_NETWORKS.reduce((acc, network) => {
  acc[network.chainId] = network;
  return acc;
}, {} as Record<number, NetworkConfig>);

// Network by id lookup
export const NETWORKS_BY_ID = SUPPORTED_NETWORKS.reduce((acc, network) => {
  acc[network.id] = network;
  return acc;
}, {} as Record<string, NetworkConfig>);

// EVM compatible networks
export const EVM_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom', 'arbitrum', 'optimism'].includes(network.id)
);

// Non-EVM networks
export const NON_EVM_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  ['solana', 'cardano', 'polkadot'].includes(network.id)
);

// DeFi enabled networks
export const DEFI_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  network.features.includes('defi')
);

// NFT enabled networks
export const NFT_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  network.features.includes('nft')
);

// Staking enabled networks
export const STAKING_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  network.features.includes('staking')
);

// Cross-chain bridge supported networks
export const BRIDGE_NETWORKS = SUPPORTED_NETWORKS.filter(network => 
  network.bridgeSupport && network.bridgeSupport.length > 0
);

// Helper functions for compatibility
export const getDefaultNetwork = () => SUPPORTED_NETWORKS[1]; // Returns Sepolia testnet for development
export const getNetworkByChainId = (chainId: number) => 
  SUPPORTED_NETWORKS.find(network => network.chainId === chainId);
export const getNetworkById = (id: string) => 
  SUPPORTED_NETWORKS.find(network => network.id === id);

// Popular tokens configuration (mainnet only)
export const POPULAR_TOKENS = {
  1: [ // Ethereum
    {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      address: '0xA0b86a33E6441Fa0E93d3B69D7b1C2Bb0C6C29Ba',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
    },
    {
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 6,
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
    },
    {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      logoURI: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
    }
  ],
  137: [ // Polygon
    {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
    }
  ],
  56: [ // BSC
    {
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: 18,
      address: '0x55d398326f99059fF775485246999027B3197955',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
    }
  ]
};

export const getTokensForNetwork = (chainId: number) => 
  POPULAR_TOKENS[chainId as keyof typeof POPULAR_TOKENS] || [];

// Network categories for compatibility
export const MAINNET_NETWORKS = SUPPORTED_NETWORKS; // All are mainnet now
export const TESTNET_NETWORKS: NetworkConfig[] = []; // Empty array - testnets removed

// Network validation
export function validateNetworkConfig(network: any): boolean {
  return !!(
    network.id &&
    network.name &&
    network.symbol &&
    network.chainId &&
    network.rpcUrl &&
    network.blockExplorerUrl &&
    network.nativeCurrency
  );
}

// Gas price configurations for mainnet networks
export const GAS_PRICE_CONFIGS = {
  ethereum: { slow: 20, standard: 35, fast: 50, unit: 'gwei' },
  polygon: { slow: 30, standard: 40, fast: 60, unit: 'gwei' },
  bsc: { slow: 5, standard: 10, fast: 15, unit: 'gwei' },
  avalanche: { slow: 25, standard: 30, fast: 40, unit: 'nAVAX' },
  fantom: { slow: 100, standard: 150, fast: 200, unit: 'gwei' },
  arbitrum: { slow: 0.1, standard: 0.5, fast: 1, unit: 'gwei' },
  optimism: { slow: 0.001, standard: 0.01, fast: 0.1, unit: 'gwei' }
};

export const getGasPriceConfig = (networkId: string) => 
  GAS_PRICE_CONFIGS[networkId as keyof typeof GAS_PRICE_CONFIGS] || 
  { slow: 20, standard: 30, fast: 50, unit: 'gwei' };
