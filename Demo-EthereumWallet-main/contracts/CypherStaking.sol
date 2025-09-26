// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

/**
 * @title CypherStaking
 * @dev Staking contract for ECLP tokens with rewards distribution
 * Features:
 * - Stake ECLP tokens to earn rewards
 * - Flexible staking periods with different reward rates
 * - Early withdrawal penalties
 * - Compound staking rewards
 * - Emergency withdrawal functionality
 */

contract CypherStaking {
    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    address public owner;
    bool public paused;

    // Staking pools with different lock periods and reward rates
    struct StakingPool {
        uint256 lockPeriod;        // Lock period in seconds
        uint256 rewardRate;        // Reward rate per second (in wei per token staked)
        uint256 totalStaked;       // Total tokens staked in this pool
        uint256 minStakeAmount;    // Minimum stake amount
        bool active;               // Pool status
    }

    struct UserStake {
        uint256 amount;            // Staked amount
        uint256 rewardDebt;        // Reward debt for accurate reward calculation
        uint256 stakedAt;          // Timestamp when staked
        uint256 lastClaimedAt;     // Last reward claim timestamp
        uint256 poolId;            // Pool ID
    }

    mapping(uint256 => StakingPool) public stakingPools;
    mapping(address => mapping(uint256 => UserStake)) public userStakes;
    mapping(address => uint256[]) public userActivePools;
    
    uint256 public nextPoolId;
    uint256 public totalRewardsDistributed;
    uint256 public earlyWithdrawalPenalty = 1000; // 10% penalty (basis points)

    // Events
    event Staked(address indexed user, uint256 poolId, uint256 amount, uint256 lockUntil);
    event Unstaked(address indexed user, uint256 poolId, uint256 amount, uint256 penalty);
    event RewardClaimed(address indexed user, uint256 poolId, uint256 reward);
    event PoolCreated(uint256 poolId, uint256 lockPeriod, uint256 rewardRate, uint256 minStakeAmount);
    event PoolUpdated(uint256 poolId, uint256 rewardRate, bool active);
    event EmergencyWithdrawal(address indexed user, uint256 poolId, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier poolExists(uint256 _poolId) {
        require(_poolId < nextPoolId, "Pool does not exist");
        _;
    }

    modifier poolActive(uint256 _poolId) {
        require(stakingPools[_poolId].active, "Pool is not active");
        _;
    }

    constructor(
        address _stakingToken,
        address _rewardToken,
        address _owner
    ) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_owner != address(0), "Invalid owner");

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        owner = _owner;

        // Create default staking pools
        _createPool(0, 10e18, 1000e18);           // No lock, low reward, 1000 ECLP min
        _createPool(30 days, 15e18, 500e18);     // 30 days lock, medium reward, 500 ECLP min
        _createPool(90 days, 25e18, 100e18);     // 90 days lock, high reward, 100 ECLP min
        _createPool(365 days, 50e18, 50e18);     // 1 year lock, highest reward, 50 ECLP min
    }

    function createPool(
        uint256 _lockPeriod,
        uint256 _rewardRate,
        uint256 _minStakeAmount
    ) external onlyOwner returns (uint256) {
        return _createPool(_lockPeriod, _rewardRate, _minStakeAmount);
    }

    function _createPool(
        uint256 _lockPeriod,
        uint256 _rewardRate,
        uint256 _minStakeAmount
    ) internal returns (uint256) {
        uint256 poolId = nextPoolId++;
        
        stakingPools[poolId] = StakingPool({
            lockPeriod: _lockPeriod,
            rewardRate: _rewardRate,
            totalStaked: 0,
            minStakeAmount: _minStakeAmount,
            active: true
        });

        emit PoolCreated(poolId, _lockPeriod, _rewardRate, _minStakeAmount);
        return poolId;
    }

    function stake(uint256 _poolId, uint256 _amount) 
        external 
        poolExists(_poolId) 
        poolActive(_poolId) 
        whenNotPaused 
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(_amount >= stakingPools[_poolId].minStakeAmount, "Amount below minimum");
        
        // Claim existing rewards if any
        if (userStakes[msg.sender][_poolId].amount > 0) {
            _claimReward(_poolId);
        }

        // Transfer tokens from user
        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );

        UserStake storage userStake = userStakes[msg.sender][_poolId];
        StakingPool storage pool = stakingPools[_poolId];

        // Update user stake
        if (userStake.amount == 0) {
            userActivePools[msg.sender].push(_poolId);
            userStake.stakedAt = block.timestamp;
        }
        
        userStake.amount += _amount;
        userStake.lastClaimedAt = block.timestamp;
        userStake.poolId = _poolId;

        // Update pool total
        pool.totalStaked += _amount;

        uint256 lockUntil = block.timestamp + pool.lockPeriod;
        emit Staked(msg.sender, _poolId, _amount, lockUntil);
    }

    function unstake(uint256 _poolId, uint256 _amount) 
        external 
        poolExists(_poolId) 
        whenNotPaused 
    {
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        require(userStake.amount >= _amount, "Insufficient staked amount");

        // Claim pending rewards
        _claimReward(_poolId);

        StakingPool storage pool = stakingPools[_poolId];
        uint256 penalty = 0;
        
        // Check if early withdrawal (apply penalty)
        if (block.timestamp < userStake.stakedAt + pool.lockPeriod) {
            penalty = (_amount * earlyWithdrawalPenalty) / 10000;
        }

        uint256 withdrawAmount = _amount - penalty;

        // Update state
        userStake.amount -= _amount;
        pool.totalStaked -= _amount;

        // Remove from active pools if fully unstaked
        if (userStake.amount == 0) {
            _removeFromActivePools(msg.sender, _poolId);
        }

        // Transfer tokens back to user (minus penalty)
        require(stakingToken.transfer(msg.sender, withdrawAmount), "Transfer failed");

        // Transfer penalty to owner if any
        if (penalty > 0) {
            require(stakingToken.transfer(owner, penalty), "Penalty transfer failed");
        }

        emit Unstaked(msg.sender, _poolId, withdrawAmount, penalty);
    }

    function claimReward(uint256 _poolId) external poolExists(_poolId) whenNotPaused {
        _claimReward(_poolId);
    }

    function _claimReward(uint256 _poolId) internal {
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        require(userStake.amount > 0, "No staked amount");

        uint256 reward = calculateReward(msg.sender, _poolId);
        if (reward > 0) {
            userStake.lastClaimedAt = block.timestamp;
            totalRewardsDistributed += reward;
            
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardClaimed(msg.sender, _poolId, reward);
        }
    }

    function calculateReward(address _user, uint256 _poolId) public view returns (uint256) {
        UserStake memory userStake = userStakes[_user][_poolId];
        if (userStake.amount == 0) return 0;

        StakingPool memory pool = stakingPools[_poolId];
        uint256 timeDiff = block.timestamp - userStake.lastClaimedAt;
        
        return (userStake.amount * pool.rewardRate * timeDiff) / (365 days * 1e18);
    }

    function compoundReward(uint256 _poolId) external poolExists(_poolId) whenNotPaused {
        uint256 reward = calculateReward(msg.sender, _poolId);
        require(reward > 0, "No rewards to compound");

        UserStake storage userStake = userStakes[msg.sender][_poolId];
        StakingPool storage pool = stakingPools[_poolId];

        // Update state
        userStake.amount += reward;
        userStake.lastClaimedAt = block.timestamp;
        pool.totalStaked += reward;
        totalRewardsDistributed += reward;

        emit Staked(msg.sender, _poolId, reward, block.timestamp + pool.lockPeriod);
        emit RewardClaimed(msg.sender, _poolId, reward);
    }

    function emergencyWithdraw(uint256 _poolId) external poolExists(_poolId) {
        UserStake storage userStake = userStakes[msg.sender][_poolId];
        uint256 amount = userStake.amount;
        require(amount > 0, "No staked amount");

        // Reset user stake
        userStake.amount = 0;
        userStake.lastClaimedAt = 0;
        
        // Update pool
        stakingPools[_poolId].totalStaked -= amount;
        
        // Remove from active pools
        _removeFromActivePools(msg.sender, _poolId);

        // Apply maximum penalty (50%)
        uint256 withdrawAmount = amount / 2;
        uint256 penalty = amount - withdrawAmount;

        // Transfer tokens
        require(stakingToken.transfer(msg.sender, withdrawAmount), "Transfer failed");
        require(stakingToken.transfer(owner, penalty), "Penalty transfer failed");

        emit EmergencyWithdrawal(msg.sender, _poolId, withdrawAmount);
    }

    function _removeFromActivePools(address _user, uint256 _poolId) internal {
        uint256[] storage activePools = userActivePools[_user];
        for (uint256 i = 0; i < activePools.length; i++) {
            if (activePools[i] == _poolId) {
                activePools[i] = activePools[activePools.length - 1];
                activePools.pop();
                break;
            }
        }
    }

    // Admin functions
    function updatePool(uint256 _poolId, uint256 _rewardRate, bool _active) 
        external 
        onlyOwner 
        poolExists(_poolId) 
    {
        stakingPools[_poolId].rewardRate = _rewardRate;
        stakingPools[_poolId].active = _active;
        emit PoolUpdated(_poolId, _rewardRate, _active);
    }

    function updateEarlyWithdrawalPenalty(uint256 _penalty) external onlyOwner {
        require(_penalty <= 5000, "Penalty too high"); // Max 50%
        earlyWithdrawalPenalty = _penalty;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }

    function withdrawRewardTokens(uint256 _amount) external onlyOwner {
        require(rewardToken.transfer(owner, _amount), "Transfer failed");
    }

    // View functions
    function getUserStakeInfo(address _user, uint256 _poolId) 
        external 
        view 
        returns (
            uint256 stakedAmount,
            uint256 pendingReward,
            uint256 stakedAt,
            uint256 unlockTime,
            bool isLocked
        ) 
    {
        UserStake memory userStake = userStakes[_user][_poolId];
        StakingPool memory pool = stakingPools[_poolId];
        
        stakedAmount = userStake.amount;
        pendingReward = calculateReward(_user, _poolId);
        stakedAt = userStake.stakedAt;
        unlockTime = userStake.stakedAt + pool.lockPeriod;
        isLocked = block.timestamp < unlockTime;
    }

    function getUserActivePools(address _user) external view returns (uint256[] memory) {
        return userActivePools[_user];
    }

    function getPoolInfo(uint256 _poolId) 
        external 
        view 
        returns (
            uint256 lockPeriod,
            uint256 rewardRate,
            uint256 totalStaked,
            uint256 minStakeAmount,
            bool active
        ) 
    {
        StakingPool memory pool = stakingPools[_poolId];
        return (
            pool.lockPeriod,
            pool.rewardRate,
            pool.totalStaked,
            pool.minStakeAmount,
            pool.active
        );
    }

    function getTotalStaked() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < nextPoolId; i++) {
            total += stakingPools[i].totalStaked;
        }
        return total;
    }
}

// Deployment script for CypherStaking
/*
To deploy this contract:

1. Constructor parameters:
   - _stakingToken: Address of ECLP token contract
   - _rewardToken: Address of reward token (can be same as staking token)
   - _owner: Address of the contract owner

2. Sample deployment code:
   const CypherStaking = await ethers.getContractFactory("CypherStaking");
   const staking = await CypherStaking.deploy(
     "0x1234567890123456789012345678901234567890", // ECLP token address
     "0x1234567890123456789012345678901234567890", // Reward token address (same as ECLP)
     "0x9876543210987654321098765432109876543210"  // Owner address
   );
   await staking.deployed();
   console.log("CypherStaking deployed to:", staking.address);

3. Usage:
   - Users stake tokens using stake(poolId, amount)
   - Rewards are calculated automatically based on time and pool rates
   - Users can unstake with unstake(poolId, amount) or compound with compoundReward(poolId)
   - Early withdrawal incurs penalty based on lock period
*/
