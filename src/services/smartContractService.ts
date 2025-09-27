import { ethers } from 'ethers';
import { Network } from '../types';

// Common ABI fragments for smart contract interactions
export const COMMON_ABIS = {
  ERC20: [
    'function name() public view returns (string)',
    'function symbol() public view returns (string)',
    'function decimals() public view returns (uint8)',
    'function totalSupply() public view returns (uint256)',
    'function balanceOf(address owner) public view returns (uint256)',
    'function transfer(address to, uint256 amount) public returns (bool)',
    'function approve(address spender, uint256 amount) public returns (bool)',
    'function allowance(address owner, address spender) public view returns (uint256)',
    'function transferFrom(address from, address to, uint256 amount) public returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],
  
  ERC721: [
    'function name() public view returns (string)',
    'function symbol() public view returns (string)',
    'function tokenURI(uint256 tokenId) public view returns (string)',
    'function balanceOf(address owner) public view returns (uint256)',
    'function ownerOf(uint256 tokenId) public view returns (address)',
    'function approve(address to, uint256 tokenId) public',
    'function getApproved(uint256 tokenId) public view returns (address)',
    'function setApprovalForAll(address operator, bool approved) public',
    'function isApprovedForAll(address owner, address operator) public view returns (bool)',
    'function transferFrom(address from, address to, uint256 tokenId) public',
    'function safeTransferFrom(address from, address to, uint256 tokenId) public',
    'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) public',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
  ],
  
  ERC1155: [
    'function uri(uint256 id) public view returns (string)',
    'function balanceOf(address account, uint256 id) public view returns (uint256)',
    'function balanceOfBatch(address[] accounts, uint256[] ids) public view returns (uint256[])',
    'function setApprovalForAll(address operator, bool approved) public',
    'function isApprovedForAll(address account, address operator) public view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) public',
    'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) public',
    'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
    'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
    'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
    'event URI(string value, uint256 indexed id)'
  ],
  
  // Multisig wallet ABI
  MULTISIG: [
    'function addOwner(address owner) public',
    'function removeOwner(address owner) public',
    'function replaceOwner(address owner, address newOwner) public',
    'function changeRequirement(uint256 required) public',
    'function submitTransaction(address destination, uint256 value, bytes data) public returns (uint256)',
    'function confirmTransaction(uint256 transactionId) public',
    'function revokeConfirmation(uint256 transactionId) public',
    'function executeTransaction(uint256 transactionId) public',
    'function isConfirmed(uint256 transactionId) public view returns (bool)',
    'function getTransactionCount(bool pending, bool executed) public view returns (uint256)',
    'function getOwners() public view returns (address[])',
    'function getConfirmations(uint256 transactionId) public view returns (address[])',
    'function getTransactionIds(uint256 from, uint256 to, bool pending, bool executed) public view returns (uint256[])',
    'event Confirmation(address indexed sender, uint256 indexed transactionId)',
    'event Revocation(address indexed sender, uint256 indexed transactionId)',
    'event Submission(uint256 indexed transactionId)',
    'event Execution(uint256 indexed transactionId)',
    'event ExecutionFailure(uint256 indexed transactionId)',
    'event Deposit(address indexed sender, uint256 value)',
    'event OwnerAddition(address indexed owner)',
    'event OwnerRemoval(address indexed owner)',
    'event RequirementChange(uint256 required)'
  ]
};

// Popular smart contract addresses
export const POPULAR_CONTRACTS = {
  // Ethereum Mainnet
  1: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    UNISWAP_V2_ROUTER: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    UNISWAP_V3_ROUTER: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    COMPOUND_USDC: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    AAVE_LENDING_POOL: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
  },
  // Polygon
  137: {
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
    AAVE_LENDING_POOL: '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf'
  }
};

export interface ContractFunction {
  name: string;
  type: 'function';
  inputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    internalType?: string;
  }>;
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
}

export interface ContractEvent {
  name: string;
  type: 'event';
  inputs: Array<{
    name: string;
    type: string;
    indexed: boolean;
    internalType?: string;
  }>;
  anonymous?: boolean;
}

export interface SmartContract {
  address: string;
  name: string;
  abi: any[];
  functions: ContractFunction[];
  events: ContractEvent[];
  isVerified: boolean;
  network: Network;
}

export interface ContractCall {
  contractAddress: string;
  functionName: string;
  params: any[];
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface ContractTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  data: string;
  nonce: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  contractAddress: string;
  functionName: string;
  decodedInputs?: any;
  decodedLogs?: any[];
}

class SmartContractService {
  private providers: Map<number, ethers.providers.JsonRpcProvider> = new Map();
  private contractCache: Map<string, SmartContract> = new Map();
  private abiCache: Map<string, any[]> = new Map();

  constructor() {
    // Initialize common ABIs
    this.abiCache.set('ERC20', COMMON_ABIS.ERC20);
    this.abiCache.set('ERC721', COMMON_ABIS.ERC721);
    this.abiCache.set('ERC1155', COMMON_ABIS.ERC1155);
    this.abiCache.set('MULTISIG', COMMON_ABIS.MULTISIG);
  }

  /**
   * Get or create provider for network
   */
  private getProvider(network: Network): ethers.providers.JsonRpcProvider {
    if (!this.providers.has(network.chainId)) {
      this.providers.set(network.chainId, new ethers.providers.JsonRpcProvider(network.rpcUrl));
    }
    return this.providers.get(network.chainId)!;
  }

  /**
   * Get contract ABI from Etherscan or other sources
   */
  async getContractABI(contractAddress: string, network: Network): Promise<any[]> {
    const cacheKey = `${network.chainId}-${contractAddress.toLowerCase()}`;
    
    if (this.abiCache.has(cacheKey)) {
      return this.abiCache.get(cacheKey)!;
    }

    try {
      // Try to fetch from Etherscan-like APIs
      let apiUrl: string;
      let apiKey = 'YourApiKeyHere'; // Replace with actual API key
      
      switch (network.chainId) {
        case 1:
          apiUrl = 'https://api.etherscan.io/api';
          break;
        case 5:
          apiUrl = 'https://api-goerli.etherscan.io/api';
          break;
        case 137:
          apiUrl = 'https://api.polygonscan.com/api';
          break;
        default:
          throw new Error('Unsupported network for ABI fetching');
      }

      const response = await fetch(
        `${apiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        const abi = JSON.parse(data.result);
        this.abiCache.set(cacheKey, abi);
        return abi;
      }
      
      throw new Error('Contract ABI not verified or not found');
    } catch (error) {
      console.error('Error fetching contract ABI:', error);
      
      // Fallback: try to detect contract type and use common ABIs
      const contractType = await this.detectContractType(contractAddress, network);
      if (contractType && COMMON_ABIS[contractType as keyof typeof COMMON_ABIS]) {
        const abi = COMMON_ABIS[contractType as keyof typeof COMMON_ABIS];
        this.abiCache.set(cacheKey, abi);
        return abi;
      }
      
      throw new Error('Unable to fetch contract ABI');
    }
  }

  /**
   * Detect contract type (ERC20, ERC721, etc.)
   */
  async detectContractType(contractAddress: string, network: Network): Promise<string | null> {
    const provider = this.getProvider(network);
    
    try {
      // Check for ERC20
      const erc20Contract = new ethers.Contract(contractAddress, COMMON_ABIS.ERC20, provider);
      await erc20Contract.symbol();
      await erc20Contract.decimals();
      return 'ERC20';
    } catch {
      // Not ERC20
    }
    
    try {
      // Check for ERC721
      const erc721Contract = new ethers.Contract(contractAddress, COMMON_ABIS.ERC721, provider);
      await erc721Contract.symbol();
      await erc721Contract.tokenURI(1);
      return 'ERC721';
    } catch {
      // Not ERC721
    }
    
    try {
      // Check for ERC1155
      const erc1155Contract = new ethers.Contract(contractAddress, COMMON_ABIS.ERC1155, provider);
      await erc1155Contract.uri(1);
      return 'ERC1155';
    } catch {
      // Not ERC1155
    }
    
    return null;
  }

  /**
   * Get smart contract details
   */
  async getSmartContract(contractAddress: string, network: Network): Promise<SmartContract> {
    const cacheKey = `${network.chainId}-${contractAddress.toLowerCase()}`;
    
    if (this.contractCache.has(cacheKey)) {
      return this.contractCache.get(cacheKey)!;
    }

    try {
      const abi = await this.getContractABI(contractAddress, network);
      
      // Extract functions and events from ABI
      const functions: ContractFunction[] = [];
      const events: ContractEvent[] = [];
      
      for (const item of abi) {
        if (item.type === 'function') {
          functions.push(item as ContractFunction);
        } else if (item.type === 'event') {
          events.push(item as ContractEvent);
        }
      }

      const contract: SmartContract = {
        address: contractAddress,
        name: await this.getContractName(contractAddress, network, abi),
        abi,
        functions,
        events,
        isVerified: true,
        network
      };

      this.contractCache.set(cacheKey, contract);
      return contract;
    } catch (error) {
      console.error('Error getting smart contract:', error);
      throw error;
    }
  }

  /**
   * Get contract name (try to call name() function or use fallback)
   */
  async getContractName(contractAddress: string, network: Network, abi: any[]): Promise<string> {
    try {
      const provider = this.getProvider(network);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      
      // Try common name functions
      if (contract.name) {
        return await contract.name();
      }
      
      return `Contract ${contractAddress.slice(0, 8)}...`;
    } catch {
      return `Unknown Contract`;
    }
  }

  /**
   * Call contract function (read-only)
   */
  async callContractFunction(
    contractAddress: string,
    functionName: string,
    params: any[],
    network: Network,
    abi?: any[]
  ): Promise<any> {
    try {
      const provider = this.getProvider(network);
      const contractAbi = abi || await this.getContractABI(contractAddress, network);
      const contract = new ethers.Contract(contractAddress, contractAbi, provider);

      if (!contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      const result = await contract[functionName](...params);
      return result;
    } catch (error) {
      console.error('Error calling contract function:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for contract transaction
   */
  async estimateContractGas(
    contractCall: ContractCall,
    fromAddress: string,
    network: Network,
    abi?: any[]
  ): Promise<bigint> {
    try {
      const provider = this.getProvider(network);
      const contractAbi = abi || await this.getContractABI(contractCall.contractAddress, network);
      const contract = new ethers.Contract(contractCall.contractAddress, contractAbi, provider);

      if (!contract[contractCall.functionName]) {
        throw new Error(`Function ${contractCall.functionName} not found in contract`);
      }

      const gasEstimate = await contract[contractCall.functionName].estimateGas(
        ...contractCall.params,
        {
          from: fromAddress,
          value: contractCall.value || '0'
        }
      );

      return gasEstimate;
    } catch (error) {
      console.error('Error estimating contract gas:', error);
      throw error;
    }
  }

  /**
   * Create contract transaction
   */
  async createContractTransaction(
    contractCall: ContractCall,
    fromAddress: string,
    network: Network,
    abi?: any[]
  ): Promise<ethers.providers.TransactionRequest> {
    try {
      const provider = this.getProvider(network);
      const contractAbi = abi || await this.getContractABI(contractCall.contractAddress, network);
      const contract = new ethers.Contract(contractCall.contractAddress, contractAbi, provider);

      if (!contract[contractCall.functionName]) {
        throw new Error(`Function ${contractCall.functionName} not found in contract`);
      }

      // Encode function data
      const data = contract.interface.encodeFunctionData(
        contractCall.functionName,
        contractCall.params
      );

      // Estimate gas if not provided
      let gasLimit = contractCall.gasLimit;
      if (!gasLimit) {
        const gasEstimate = await this.estimateContractGas(contractCall, fromAddress, network, abi);
        const gasEstimateBN = ethers.BigNumber.from(gasEstimate.toString());
        gasLimit = gasEstimateBN.mul(120).div(100).toString(); // Add 20% buffer
      }

      const txRequest: ethers.providers.TransactionRequest = {
        from: fromAddress,
        to: contractCall.contractAddress,
        data,
        value: contractCall.value || '0',
        gasLimit,
        chainId: network.chainId
      };

      if (contractCall.gasPrice) {
        txRequest.gasPrice = ethers.utils.parseUnits(contractCall.gasPrice, 'gwei');
      }

      return txRequest;
    } catch (error) {
      console.error('Error creating contract transaction:', error);
      throw error;
    }
  }

  /**
   * Execute contract transaction
   */
  async executeContractTransaction(
    contractCall: ContractCall,
    privateKey: string,
    network: Network,
    abi?: any[]
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const provider = this.getProvider(network);
      const wallet = new ethers.Wallet(privateKey, provider);
      const contractAbi = abi || await this.getContractABI(contractCall.contractAddress, network);
      const contract = new ethers.Contract(contractCall.contractAddress, contractAbi, wallet);

      if (!contract[contractCall.functionName]) {
        throw new Error(`Function ${contractCall.functionName} not found in contract`);
      }

      const txOptions: any = {};
      
      if (contractCall.value) {
        txOptions.value = contractCall.value;
      }
      
      if (contractCall.gasLimit) {
        txOptions.gasLimit = contractCall.gasLimit;
      }
      
      if (contractCall.gasPrice) {
        txOptions.gasPrice = ethers.utils.parseUnits(contractCall.gasPrice, 'gwei');
      }

      const tx = await contract[contractCall.functionName](
        ...contractCall.params,
        txOptions
      );

      return tx;
    } catch (error) {
      console.error('Error executing contract transaction:', error);
      throw error;
    }
  }

  /**
   * Get contract events
   */
  async getContractEvents(
    contractAddress: string,
    eventName: string,
    network: Network,
    fromBlock: number = -10000,
    toBlock: number | string = 'latest',
    abi?: any[]
  ): Promise<any[]> {
    try {
      const provider = this.getProvider(network);
      const contractAbi = abi || await this.getContractABI(contractAddress, network);
      const contract = new ethers.Contract(contractAddress, contractAbi, provider);

      const filter = contract.filters[eventName]();
      const events = await contract.queryFilter(filter, fromBlock, toBlock);

      return events.map(event => ({
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        address: event.address,
        args: (event as any).args || [],
        event: (event as any).eventName || (event as any).fragment?.name || 'unknown',
        eventSignature: (event as any).eventSignature || (event as any).fragment?.format() || ''
      }));
    } catch (error) {
      console.error('Error getting contract events:', error);
      throw error;
    }
  }

  /**
   * Decode transaction data
   */
  async decodeTransactionData(
    contractAddress: string,
    data: string,
    network: Network,
    abi?: any[]
  ): Promise<{ functionName: string; args: any }> {
    try {
      const contractAbi = abi || await this.getContractABI(contractAddress, network);
      const contract = new ethers.Contract(contractAddress, contractAbi);
      
      const decodedData = contract.interface.parseTransaction({ data });
      
      return {
        functionName: decodedData?.name || 'unknown',
        args: decodedData?.args || []
      };
    } catch (error) {
      console.error('Error decoding transaction data:', error);
      throw error;
    }
  }

  /**
   * Decode event logs
   */
  async decodeEventLogs(
    contractAddress: string,
    logs: any[],
    network: Network,
    abi?: any[]
  ): Promise<any[]> {
    try {
      const contractAbi = abi || await this.getContractABI(contractAddress, network);
      const contract = new ethers.Contract(contractAddress, contractAbi);
      
      return logs.map(log => {
        try {
          const parsedLog = contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          return {
            ...log,
            eventName: parsedLog?.name,
            args: parsedLog?.args
          };
        } catch {
          return log; // Return original if can't decode
        }
      });
    } catch (error) {
      console.error('Error decoding event logs:', error);
      return logs;
    }
  }

  /**
   * Get popular contracts for network
   */
  getPopularContracts(chainId: number): { [key: string]: string } {
    return POPULAR_CONTRACTS[chainId as keyof typeof POPULAR_CONTRACTS] || {};
  }

  /**
   * Validate contract address
   */
  async validateContractAddress(address: string, network: Network): Promise<boolean> {
    try {
      const provider = this.getProvider(network);
      const code = await provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  }

  /**
   * Get contract bytecode
   */
  async getContractBytecode(address: string, network: Network): Promise<string> {
    try {
      const provider = this.getProvider(network);
      return await provider.getCode(address);
    } catch (error) {
      console.error('Error getting contract bytecode:', error);
      throw error;
    }
  }

  /**
   * Batch contract calls
   */
  async batchContractCalls(
    calls: Array<{
      contractAddress: string;
      functionName: string;
      params: any[];
    }>,
    network: Network
  ): Promise<any[]> {
    try {
      const provider = this.getProvider(network);
      const results = [];

      for (const call of calls) {
        try {
          const result = await this.callContractFunction(
            call.contractAddress,
            call.functionName,
            call.params,
            network
          );
          results.push({ success: true, result });
        } catch (error) {
          results.push({ success: false, error: (error as Error)?.message || 'Unknown error' });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in batch contract calls:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.contractCache.clear();
    // Keep common ABIs
    this.abiCache.clear();
    this.abiCache.set('ERC20', COMMON_ABIS.ERC20);
    this.abiCache.set('ERC721', COMMON_ABIS.ERC721);
    this.abiCache.set('ERC1155', COMMON_ABIS.ERC1155);
    this.abiCache.set('MULTISIG', COMMON_ABIS.MULTISIG);
  }
}

export default new SmartContractService();
