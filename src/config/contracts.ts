/**
 * CYPHER WALLET - CONTRACT DEPLOYMENT CONFIGURATION
 * Manages deployed contract addresses across different networks
 */

export interface ContractConfig {
  chainId: number;
  networkName: string;
  contracts: {
    MinimalShieldedPool?: string;
    ShieldedPool?: string;
    CypherToken?: string;
    PrivacyRegistry?: string;
    AliasAccount?: string;
  };
}

/**
 * Contract deployment addresses by network
 * Update these addresses after deploying contracts to each network
 */
export const CONTRACT_DEPLOYMENTS: ContractConfig[] = [
  // Localhost/Hardhat Development Network
  {
    chainId: 1337,
    networkName: 'localhost',
    contracts: {
      MinimalShieldedPool: '0x0165878A594ca255338adfa4d48449f69242Eb8F', // From deployments/localhost.json
      ShieldedPool: undefined, // Not deployed yet
      CypherToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      PrivacyRegistry: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      AliasAccount: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    }
  },

  // Ethereum Sepolia Testnet
  {
    chainId: 11155111,
    networkName: 'sepolia',
    contracts: {
      MinimalShieldedPool: undefined, // Need to deploy first
      ShieldedPool: undefined,
      CypherToken: undefined, 
      PrivacyRegistry: undefined,
      AliasAccount: undefined,
    }
  },

  // Add more networks as needed
  // Arbitrum Sepolia
  {
    chainId: 421614,
    networkName: 'arbitrum-sepolia',
    contracts: {
      MinimalShieldedPool: undefined,
      ShieldedPool: undefined,
      CypherToken: undefined,
      PrivacyRegistry: undefined,
      AliasAccount: undefined,
    }
  },

  // Optimism Sepolia  
  {
    chainId: 11155420,
    networkName: 'optimism-sepolia',
    contracts: {
      MinimalShieldedPool: undefined,
      ShieldedPool: undefined,
      CypherToken: undefined,
      PrivacyRegistry: undefined,
      AliasAccount: undefined,
    }
  }
];

/**
 * Get contract address for specific network and contract type
 */
export const getContractAddress = (
  chainId: number, 
  contractName: keyof ContractConfig['contracts']
): string | undefined => {
  const deployment = CONTRACT_DEPLOYMENTS.find(d => d.chainId === chainId);
  return deployment?.contracts[contractName];
};

/**
 * Check if contracts are deployed on a network
 */
export const hasContractsDeployed = (chainId: number): boolean => {
  const deployment = CONTRACT_DEPLOYMENTS.find(d => d.chainId === chainId);
  if (!deployment) return false;
  
  // Check if at least MinimalShieldedPool is deployed
  return !!deployment.contracts.MinimalShieldedPool;
};

/**
 * Get deployment info for a network
 */
export const getNetworkDeployment = (chainId: number): ContractConfig | undefined => {
  return CONTRACT_DEPLOYMENTS.find(d => d.chainId === chainId);
};

/**
 * Check if running on development/localhost
 */
export const isLocalNetwork = (chainId: number): boolean => {
  return chainId === 1337 || chainId === 31337; // Hardhat default chain IDs
};

/**
 * Get the primary shielded pool contract address for a network
 * Falls back to MinimalShieldedPool if full ShieldedPool is not available
 */
export const getShieldedPoolAddress = (chainId: number): string | undefined => {
  const deployment = getNetworkDeployment(chainId);
  if (!deployment) return undefined;
  
  // Prefer full ShieldedPool over MinimalShieldedPool
  return deployment.contracts.ShieldedPool || deployment.contracts.MinimalShieldedPool;
};

/**
 * Default fallback addresses for development
 */
export const FALLBACK_ADDRESSES = {
  localhost: {
    MinimalShieldedPool: '0x0165878A594ca255338adfa4d48449f69242Eb8F'
  }
};
