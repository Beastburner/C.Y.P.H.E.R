import { ethers, Contract, BigNumber } from 'ethers';
import { TransactionService } from './TransactionService';
import rpcService from './rpcService';

/**
 * ECLIPTA Staking Service
 * Handles all staking operations including ETH staking, token staking, and rewards
 */

export interface StakeParams {
  amount: string;
  duration?: number; // in seconds
  poolId?: string;
}

export interface UnstakeParams {
  amount: string;
  poolId?: string;
}

export interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: string;
  totalStaked: string;
  userStaked: string;
  rewardsEarned: string;
  lockPeriod: number; // in seconds
  isActive: boolean;
}

export interface StakingRewards {
  totalRewards: string;
  claimableRewards: string;
  stakingPools: StakingPool[];
}

class StakingService {
  private static instance: StakingService;
  private contractAddress: string = '';
  private contract: Contract | null = null;

  private constructor() {}

  static getInstance(): StakingService {
    if (!StakingService.instance) {
      StakingService.instance = new StakingService();
    }
    return StakingService.instance;
  }

  async initialize(contractAddress: string, chainId: number = 1) {
    try {
      this.contractAddress = contractAddress;
      const provider = rpcService.getProvider(chainId.toString());
      
      // Staking contract ABI
      const stakingABI = [
        'function stake(uint256 amount) external payable',
        'function stake(uint256 amount, uint256 poolId) external',
        'function unstake(uint256 amount) external',
        'function unstake(uint256 amount, uint256 poolId) external',
        'function claimRewards() external',
        'function claimRewards(uint256 poolId) external',
        'function getStakedAmount(address user) external view returns (uint256)',
        'function getStakedAmount(address user, uint256 poolId) external view returns (uint256)',
        'function getRewardsEarned(address user) external view returns (uint256)',
        'function getRewardsEarned(address user, uint256 poolId) external view returns (uint256)',
        'function getTotalStaked() external view returns (uint256)',
        'function getTotalStaked(uint256 poolId) external view returns (uint256)',
        'function getPoolInfo(uint256 poolId) external view returns (address token, uint256 apy, uint256 totalStaked, uint256 lockPeriod, bool isActive)',
        'function getPoolCount() external view returns (uint256)',
        'function compound() external',
        'function compound(uint256 poolId) external',
        'event Staked(address indexed user, uint256 amount, uint256 poolId)',
        'event Unstaked(address indexed user, uint256 amount, uint256 poolId)',
        'event RewardsClaimed(address indexed user, uint256 amount, uint256 poolId)'
      ];

      this.contract = new Contract(contractAddress, stakingABI, provider);
      console.log('✅ Staking Service initialized for contract:', contractAddress);
    } catch (error) {
      console.error('❌ Failed to initialize Staking service:', error);
      throw error;
    }
  }

  async stake(params: StakeParams, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Staking tokens...');
      
      let tx;
      if (params.poolId) {
        // Stake in specific pool
        tx = await contractWithSigner.stake(params.amount, params.poolId);
      } else {
        // Stake ETH or default pool
        tx = await contractWithSigner.stake(params.amount, {
          value: params.amount // For ETH staking
        });
      }

      console.log('✅ Stake transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Staking failed:', error);
      throw error;
    }
  }

  async unstake(params: UnstakeParams, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Unstaking tokens...');
      
      let tx;
      if (params.poolId) {
        tx = await contractWithSigner.unstake(params.amount, params.poolId);
      } else {
        tx = await contractWithSigner.unstake(params.amount);
      }

      console.log('✅ Unstake transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Unstaking failed:', error);
      throw error;
    }
  }

  async claimRewards(poolId?: string, privateKey?: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      if (!privateKey) {
        throw new Error('Private key required for claiming rewards');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Claiming rewards...');
      
      let tx;
      if (poolId) {
        tx = await contractWithSigner.claimRewards(poolId);
      } else {
        tx = await contractWithSigner.claimRewards();
      }

      console.log('✅ Claim rewards transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Claim rewards failed:', error);
      throw error;
    }
  }

  async getStakedAmount(userAddress: string, poolId?: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      let stakedAmount;
      if (poolId) {
        stakedAmount = await this.contract.getStakedAmount(userAddress, poolId);
      } else {
        stakedAmount = await this.contract.getStakedAmount(userAddress);
      }

      return stakedAmount.toString();
    } catch (error) {
      console.error('❌ Failed to get staked amount:', error);
      return '0';
    }
  }

  async getRewardsEarned(userAddress: string, poolId?: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      let rewards;
      if (poolId) {
        rewards = await this.contract.getRewardsEarned(userAddress, poolId);
      } else {
        rewards = await this.contract.getRewardsEarned(userAddress);
      }

      return rewards.toString();
    } catch (error) {
      console.error('❌ Failed to get rewards earned:', error);
      return '0';
    }
  }

  async getTotalStaked(poolId?: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      let totalStaked;
      if (poolId) {
        totalStaked = await this.contract.getTotalStaked(poolId);
      } else {
        totalStaked = await this.contract.getTotalStaked();
      }

      return totalStaked.toString();
    } catch (error) {
      console.error('❌ Failed to get total staked:', error);
      return '0';
    }
  }

  async getStakingPools(): Promise<StakingPool[]> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      const poolCount = await this.contract.getPoolCount();
      const pools: StakingPool[] = [];

      for (let i = 0; i < poolCount.toNumber(); i++) {
        try {
          const poolInfo = await this.contract.getPoolInfo(i);
          
          pools.push({
            id: i.toString(),
            name: `Pool ${i + 1}`,
            token: poolInfo.token,
            apy: poolInfo.apy.toString(),
            totalStaked: poolInfo.totalStaked.toString(),
            userStaked: '0', // Will be populated separately
            rewardsEarned: '0', // Will be populated separately
            lockPeriod: poolInfo.lockPeriod.toNumber(),
            isActive: poolInfo.isActive
          });
        } catch (poolError) {
          console.warn(`Failed to get info for pool ${i}:`, poolError);
        }
      }

      return pools;
    } catch (error) {
      console.error('❌ Failed to get staking pools:', error);
      return [];
    }
  }

  async getUserStakingInfo(userAddress: string): Promise<StakingRewards> {
    try {
      const pools = await this.getStakingPools();
      let totalRewards = BigNumber.from(0);
      let claimableRewards = BigNumber.from(0);

      // Populate user-specific data for each pool
      for (const pool of pools) {
        try {
          const [userStaked, rewardsEarned] = await Promise.all([
            this.getStakedAmount(userAddress, pool.id),
            this.getRewardsEarned(userAddress, pool.id)
          ]);

          pool.userStaked = userStaked;
          pool.rewardsEarned = rewardsEarned;

          totalRewards = totalRewards.add(rewardsEarned);
          claimableRewards = claimableRewards.add(rewardsEarned);
        } catch (poolError) {
          console.warn(`Failed to get user data for pool ${pool.id}:`, poolError);
        }
      }

      return {
        totalRewards: totalRewards.toString(),
        claimableRewards: claimableRewards.toString(),
        stakingPools: pools
      };
    } catch (error) {
      console.error('❌ Failed to get user staking info:', error);
      return {
        totalRewards: '0',
        claimableRewards: '0',
        stakingPools: []
      };
    }
  }

  async compound(poolId: string, privateKey: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Staking service not initialized');
      }

      const signer = new ethers.Wallet(privateKey, this.contract.provider);
      const contractWithSigner = this.contract.connect(signer);

      console.log('🔄 Compounding rewards...');
      
      let tx;
      if (poolId) {
        tx = await contractWithSigner.compound(poolId);
      } else {
        tx = await contractWithSigner.compound();
      }

      console.log('✅ Compound transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('❌ Compound failed:', error);
      throw error;
    }
  }

  async estimateReturns(amount: string, duration: number, apy: string): Promise<{
    totalReturn: string;
    rewardsEarned: string;
    effectiveAPY: string;
  }> {
    try {
      const principal = parseFloat(amount);
      const annualRate = parseFloat(apy) / 100;
      const durationYears = duration / (365 * 24 * 60 * 60);

      // Compound interest calculation (assuming daily compounding)
      const totalReturn = principal * Math.pow(1 + annualRate / 365, 365 * durationYears);
      const rewardsEarned = totalReturn - principal;
      const effectiveAPY = ((totalReturn / principal) ** (1 / durationYears) - 1) * 100;

      return {
        totalReturn: totalReturn.toFixed(6),
        rewardsEarned: rewardsEarned.toFixed(6),
        effectiveAPY: effectiveAPY.toFixed(2)
      };
    } catch (error) {
      console.error('❌ Failed to estimate returns:', error);
      return {
        totalReturn: '0',
        rewardsEarned: '0',
        effectiveAPY: '0'
      };
    }
  }

  async getOptimalStakingStrategy(amount: string, riskTolerance: 'low' | 'medium' | 'high'): Promise<{
    recommendedPools: StakingPool[];
    allocation: { [poolId: string]: string };
    expectedAPY: string;
  }> {
    try {
      const pools = await this.getStakingPools();
      const activePoolsWithAPY = pools
        .filter(pool => pool.isActive && parseFloat(pool.apy) > 0)
        .sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));

      let recommendedPools: StakingPool[] = [];
      const allocation: { [poolId: string]: string } = {};

      switch (riskTolerance) {
        case 'low':
          // Conservative: lower APY but stable pools
          recommendedPools = activePoolsWithAPY.slice(0, 2);
          break;
        case 'medium':
          // Balanced: mix of stable and higher yield
          recommendedPools = activePoolsWithAPY.slice(0, 3);
          break;
        case 'high':
          // Aggressive: highest APY pools
          recommendedPools = activePoolsWithAPY.slice(0, 4);
          break;
      }

      // Simple equal allocation for now
      const allocationPerPool = parseFloat(amount) / recommendedPools.length;
      recommendedPools.forEach(pool => {
        allocation[pool.id] = allocationPerPool.toString();
      });

      // Calculate weighted average APY
      const totalAPY = recommendedPools.reduce((sum, pool) => {
        return sum + (parseFloat(pool.apy) * allocationPerPool);
      }, 0);
      const expectedAPY = (totalAPY / parseFloat(amount)).toFixed(2);

      return {
        recommendedPools,
        allocation,
        expectedAPY
      };
    } catch (error) {
      console.error('❌ Failed to get optimal staking strategy:', error);
      return {
        recommendedPools: [],
        allocation: {},
        expectedAPY: '0'
      };
    }
  }
}

export default StakingService;
