/**
 * API Configuration Service
 * Centralizes all external API configurations and keys
 */

import Config from 'react-native-config';

export interface ApiConfig {
  // Blockchain RPC APIs
  infura: {
    projectId: string;
    endpoints: {
      mainnet: string;
      sepolia: string;
      polygon: string;
      arbitrum: string;
      optimism: string;
    };
  };
  
  alchemy: {
    apiKey: string;
    endpoints: {
      mainnet: string;
      sepolia: string;
      polygon: string;
      arbitrum: string;
      optimism: string;
    };
  };

  // Blockchain Data APIs
  etherscan: {
    apiKey: string;
    baseUrl: string;
  };

  // Price APIs
  coingecko: {
    apiKey: string;
    baseUrl: string;
  };

  // Swap APIs
  oneInch: {
    apiKey: string;
    baseUrl: string;
  };

  // WalletConnect
  walletConnect: {
    projectId: string;
  };

  // Fallback RPC endpoints
  fallback: {
    ethereum: string;
    polygon: string;
    bsc: string;
  };
}

/**
 * Get production API configuration from environment variables
 */
export const getApiConfig = (): ApiConfig => {
  const INFURA_PROJECT_ID = Config.INFURA_PROJECT_ID || '18e72f0e085d4f978e259201b7dbfe66';
  const ALCHEMY_API_KEY = Config.ALCHEMY_API_KEY || '19e0f26eec044c3fa043cf82ec34b168';
  const ETHERSCAN_API_KEY = Config.ETHERSCAN_API_KEY || 'JPB3IU7X1CBS6FQYJH1JFQ72GUMN4JH9QY';
  const COINGECKO_API_KEY = Config.COINGECKO_API_KEY || 'CGSStEunEUMoNV5wLz9Vsj9BR3';
  const ONEINCH_API_KEY = Config.ONEINCH_API_KEY || 'ycyrrc4bfE5MEzYXLZMZcVOxvIozzQlL';
  const WALLETCONNECT_PROJECT_ID = Config.WALLETCONNECT_PROJECT_ID || '16cc2d729834f43b8cff2ac272e51c5f';

  return {
    infura: {
      projectId: INFURA_PROJECT_ID,
      endpoints: {
        mainnet: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        sepolia: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
        polygon: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        arbitrum: `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
        optimism: `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      },
    },
    
    alchemy: {
      apiKey: ALCHEMY_API_KEY,
      endpoints: {
        mainnet: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        sepolia: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        polygon: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
        optimism: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      },
    },

    etherscan: {
      apiKey: ETHERSCAN_API_KEY,
      baseUrl: 'https://api.etherscan.io/api',
    },

    coingecko: {
      apiKey: COINGECKO_API_KEY,
      baseUrl: Config.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
    },

    oneInch: {
      apiKey: ONEINCH_API_KEY,
      baseUrl: 'https://api.1inch.dev/swap/v5.2',
    },

    walletConnect: {
      projectId: WALLETCONNECT_PROJECT_ID,
    },

    fallback: {
      ethereum: Config.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      polygon: Config.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      bsc: Config.BSC_RPC_URL || 'https://bsc.llamarpc.com',
    },
  };
};

/**
 * Validate API configuration
 */
export const validateApiConfig = (config: ApiConfig): boolean => {
  const requiredKeys = [
    config.infura.projectId,
    config.alchemy.apiKey,
    config.etherscan.apiKey,
    config.coingecko.apiKey,
    config.walletConnect.projectId,
  ];

  const hasAllKeys = requiredKeys.every(key => key && key.length > 0);
  
  if (!hasAllKeys) {
    console.warn('⚠️ Some API keys are missing or invalid');
    return false;
  }

  console.log('✅ All API keys validated successfully');
  return true;
};

/**
 * Get network-specific RPC URLs with failover
 */
export const getNetworkRpcUrls = (chainId: number): string[] => {
  const config = getApiConfig();
  
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return [
        config.infura.endpoints.mainnet,
        config.alchemy.endpoints.mainnet,
        config.fallback.ethereum,
        'https://ethereum.publicnode.com',
        'https://eth.llamarpc.com'
      ];
      
    case 11155111: // Sepolia Testnet
      return [
        config.infura.endpoints.sepolia,
        config.alchemy.endpoints.sepolia,
        'https://ethereum-sepolia.publicnode.com',
        'https://sepolia.gateway.tenderly.co'
      ];
      
    case 137: // Polygon
      return [
        config.infura.endpoints.polygon,
        config.alchemy.endpoints.polygon,
        config.fallback.polygon,
        'https://polygon-rpc.com',
        'https://polygon.publicnode.com'
      ];
      
    case 42161: // Arbitrum
      return [
        config.infura.endpoints.arbitrum,
        config.alchemy.endpoints.arbitrum,
        'https://arb1.arbitrum.io/rpc',
        'https://arbitrum.publicnode.com'
      ];
      
    case 10: // Optimism
      return [
        config.infura.endpoints.optimism,
        config.alchemy.endpoints.optimism,
        'https://mainnet.optimism.io',
        'https://optimism.publicnode.com'
      ];
      
    case 56: // BSC
      return [
        config.fallback.bsc,
        'https://bsc-dataseed1.binance.org',
        'https://bsc.publicnode.com'
      ];
      
    case 43114: // Avalanche
      return [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain.publicnode.com'
      ];
      
    default:
      console.warn(`⚠️ No RPC configuration for chain ID: ${chainId}`);
      return [];
  }
};

/**
 * Get price API configuration with authentication
 */
export const getPriceApiConfig = () => {
  const config = getApiConfig();
  
  return {
    coingecko: {
      url: config.coingecko.baseUrl,
      headers: config.coingecko.apiKey ? {
        'x-cg-demo-api-key': config.coingecko.apiKey
      } : {},
    },
  };
};

/**
 * Get swap API configuration
 */
export const getSwapApiConfig = () => {
  const config = getApiConfig();
  
  return {
    oneInch: {
      url: config.oneInch.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.oneInch.apiKey}`,
      },
    },
  };
};

/**
 * Initialize and validate all APIs
 */
export const initializeApis = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initializing API configurations...');
    
    const config = getApiConfig();
    const isValid = validateApiConfig(config);
    
    if (!isValid) {
      console.error('❌ API configuration validation failed');
      return false;
    }
    
    // Test critical API endpoints
    console.log('🔍 Testing critical API endpoints...');
    
    // Test Infura
    try {
      const response = await fetch(config.infura.endpoints.mainnet, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1
        })
      });
      
      if (response.ok) {
        console.log('✅ Infura API connection successful');
      } else {
        console.warn('⚠️ Infura API connection failed:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Infura API test failed:', error);
    }
    
    // Test CoinGecko
    try {
      const priceConfig = getPriceApiConfig();
      const headers = Object.keys(priceConfig.coingecko.headers).length > 0 
        ? priceConfig.coingecko.headers 
        : {};
      const response = await fetch(`${priceConfig.coingecko.url}/ping`, {
        headers: headers as HeadersInit
      });
      
      if (response.ok) {
        console.log('✅ CoinGecko API connection successful');
      } else {
        console.warn('⚠️ CoinGecko API connection failed:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ CoinGecko API test failed:', error);
    }
    
    console.log('🎉 API initialization completed');
    return true;
    
  } catch (error) {
    console.error('❌ API initialization failed:', error);
    return false;
  }
};

export default {
  getApiConfig,
  validateApiConfig,
  getNetworkRpcUrls,
  getPriceApiConfig,
  getSwapApiConfig,
  initializeApis,
};
