import { ethers, Contract } from 'ethers';
import { TransactionService } from './TransactionService';
import rpcService from './rpcService';

/**
 * ECLIPTA DEX Service
 * Handles all decentralized exchange operations
 */

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  to: string;
  deadline: number;
}

export interface LiquidityParams {
  tokenA: string;
  tokenB: string;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  to: string;
  deadline: number;
}

export interface PoolInfo {
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: string;
}

class DexService {
  private static instance: DexService;
  private contractAddress: string = '';
  private contract: Contract | null = null;

  private constructor() {}

  static getInstance(): DexService {
    if (!DexService.instance) {
      DexService.instance = new DexService();
    }
    return DexService.instance;
  }

  async initialize(contractAddress: string, chainId: number = 1) {
    try {
      this.contractAddress = contractAddress;
      const provider = rpcService.getProvider(chainId.toString());
      
      // DEX ABI (simplified)
      const dexABI = [
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)',
        'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)',
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
        'function getPair(address tokenA, address tokenB) external view returns (address pair)',
        'function factory() external view returns (address)',
        'function WETH() external view returns (address)'
      ];

      this.contract = new Contract(contractAddress, dexABI, provider);
      console.log('✅ DEX Service initialized for contract:', contractAddress);
    } catch (error) {
      console.error('❌ Failed to initialize DEX service:', error);
      throw error;
    }
  }

  async swapExactTokensForTokens(params: SwapParams, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      // Build path for swap
      const path = [params.tokenIn, params.tokenOut];

      console.log('🔄 Executing token swap...');
      const tx = await contractWithSigner.swapExactTokensForTokens(
        params.amountIn,
        params.amountOutMin,
        path,
        params.to,
        params.deadline
      );

      console.log('✅ Swap transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Token swap failed:', error);
      throw error;
    }
  }

  async addLiquidity(params: LiquidityParams, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Adding liquidity...');
      const tx = await contractWithSigner.addLiquidity(
        params.tokenA,
        params.tokenB,
        params.amountADesired,
        params.amountBDesired,
        params.amountAMin,
        params.amountBMin,
        params.to,
        params.deadline
      );

      console.log('✅ Add liquidity transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Add liquidity failed:', error);
      throw error;
    }
  }

  async removeLiquidity(params: LiquidityParams & { liquidity: string }, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Removing liquidity...');
      const tx = await contractWithSigner.removeLiquidity(
        params.tokenA,
        params.tokenB,
        params.liquidity,
        params.amountAMin,
        params.amountBMin,
        params.to,
        params.deadline
      );

      console.log('✅ Remove liquidity transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Remove liquidity failed:', error);
      throw error;
    }
  }

  async getAmountsOut(amountIn: string, path: string[]): Promise<string[]> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const amounts = await this.contract.getAmountsOut(amountIn, path);
      return amounts.map((amount: any) => amount.toString());
    } catch (error) {
      console.error('❌ Failed to get amounts out:', error);
      throw error;
    }
  }

  async getQuote(tokenA: string, tokenB: string, amountIn: string): Promise<string> {
    try {
      const path = [tokenA, tokenB];
      const amounts = await this.getAmountsOut(amountIn, path);
      return amounts[amounts.length - 1];
    } catch (error) {
      console.error('❌ Failed to get quote:', error);
      throw error;
    }
  }

  async getPairAddress(tokenA: string, tokenB: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const pairAddress = await this.contract.getPair(tokenA, tokenB);
      return pairAddress;
    } catch (error) {
      console.error('❌ Failed to get pair address:', error);
      throw error;
    }
  }

  async getPoolInfo(tokenA: string, tokenB: string): Promise<PoolInfo | null> {
    try {
      const pairAddress = await this.getPairAddress(tokenA, tokenB);
      
      if (pairAddress === ethers.constants.AddressZero) {
        return null;
      }

      // Pair contract ABI (simplified)
      const pairABI = [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'function token1() external view returns (address)',
        'function totalSupply() external view returns (uint)'
      ];

      const pairContract = new Contract(pairAddress, pairABI, this.contract!.provider);
      
      const [reserves, token0, token1, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1(),
        pairContract.totalSupply()
      ]);

      return {
        token0,
        token1,
        reserve0: reserves.reserve0.toString(),
        reserve1: reserves.reserve1.toString(),
        totalSupply: totalSupply.toString(),
        fee: '0.3' // 0.3% fee for most DEXs
      };
    } catch (error) {
      console.error('❌ Failed to get pool info:', error);
      return null;
    }
  }

  async estimateGasForSwap(params: SwapParams): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('DEX service not initialized');
      }

      const path = [params.tokenIn, params.tokenOut];
      const gasEstimate = await this.contract.estimateGas.swapExactTokensForTokens(
        params.amountIn,
        params.amountOutMin,
        path,
        params.to,
        params.deadline
      );

      return gasEstimate.toString();
    } catch (error) {
      console.error('❌ Failed to estimate gas for swap:', error);
      throw error;
    }
  }

  async getBestRoute(tokenIn: string, tokenOut: string, amountIn: string): Promise<{
    path: string[];
    expectedOutput: string;
    priceImpact: string;
  }> {
    try {
      // Simple direct route for now - can be enhanced with multi-hop routing
      const path = [tokenIn, tokenOut];
      const amounts = await this.getAmountsOut(amountIn, path);
      const expectedOutput = amounts[amounts.length - 1];

      // Calculate price impact (simplified)
      const poolInfo = await this.getPoolInfo(tokenIn, tokenOut);
      let priceImpact = '0';
      
      if (poolInfo) {
        const inputReserve = parseFloat(poolInfo.reserve0);
        const outputReserve = parseFloat(poolInfo.reserve1);
        const input = parseFloat(amountIn);
        
        // Simple price impact calculation
        priceImpact = ((input / inputReserve) * 100).toFixed(2);
      }

      return {
        path,
        expectedOutput,
        priceImpact
      };
    } catch (error) {
      console.error('❌ Failed to get best route:', error);
      throw error;
    }
  }
}

export default DexService;
