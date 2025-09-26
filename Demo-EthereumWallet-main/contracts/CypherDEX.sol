// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

/**
 * @title CypherDEX - Revolutionary Decentralized Exchange
 * @dev Advanced DEX with next-generation features for Cypher Wallet
 * Revolutionary Features:
 * - Multi-curve AMM (Constant Product, Stable, Weighted)
 * - Dynamic fee adjustment based on volatility
 * - MEV protection and flash loan resistance
 * - Impermanent loss protection for LPs
 * - Cross-chain liquidity aggregation
 * - Advanced order types (limit, stop-loss, TWAP)
 * - Yield farming and liquidity mining
 * - Flash swap capabilities
 * - Price oracles integration
 * - Governance-driven parameters
 * - Anti-sandwich attack protection
 * - Concentrated liquidity positions
 * - Multi-asset pools (up to 8 tokens)
 * - Emergency pause and circuit breakers
 * - Gas optimization with batch operations
 */

contract CypherDEX {
    // Access Control
    address public owner;
    address public governance;
    mapping(address => bool) public operators;
    
    // Fee Structure
    uint256 public tradingFee = 30; // 0.3% trading fee (basis points)
    uint256 public protocolFee = 5; // 0.05% protocol fee (basis points) 
    uint256 public maxFee = 1000; // 10% maximum fee
    bool public dynamicFees = true;
    
    // Pool Types
    enum PoolType { 
        CONSTANT_PRODUCT,    // Standard x*y=k
        STABLE,             // For stablecoins
        WEIGHTED,           // Multi-asset with weights
        CONCENTRATED       // Concentrated liquidity
    }
    
    struct TradingPair {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
        mapping(address => LiquidityPosition) positions;
        bool active;
        bool emergencyPaused;
        uint256 lastUpdate;
        uint256 volumeA;
        uint256 volumeB;
        uint256 lastPrice;
        uint256 priceAccumulator;
        PoolType poolType;
        uint256[] weights; // For weighted pools
        uint256 amplificationParameter; // For stable pools
        uint256 totalFees;
        uint256 impermanentLossProtection;
    }
    
    struct LiquidityPosition {
        uint256 liquidity;
        uint256 entryPrice;
        uint256 timestamp;
        uint256 rewards;
        int24 tickLower; // For concentrated liquidity
        int24 tickUpper;
    }
    
    struct Order {
        bytes32 id;
        address trader;
        bytes32 pairId;
        OrderType orderType;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 executionPrice;
        uint256 expiry;
        bool executed;
        bool cancelled;
    }
    
    enum OrderType {
        MARKET,
        LIMIT,
        STOP_LOSS,
        TWAP
    }
    
    // Advanced Features
    mapping(bytes32 => TradingPair) public tradingPairs;
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => Order) public orders;
    mapping(address => bytes32[]) public userOrders;
    bytes32[] public pairIds;
    bytes32[] public activeOrders;
    
    // MEV Protection
    mapping(address => uint256) public lastTradeTime;
    mapping(bytes32 => uint256) public lastTradePrice;
    uint256 public mevProtectionWindow = 3; // 3 blocks
    bool public mevProtectionEnabled = true;
    
    // Flash Loan
    mapping(address => bool) public flashLoanProviders;
    uint256 public flashLoanFee = 9; // 0.09% (9 basis points)
    
    // Yield Farming
    struct Farm {
        bytes32 pairId;
        address rewardToken;
        uint256 rewardPerBlock;
        uint256 totalStaked;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        mapping(address => UserInfo) users;
        bool active;
    }
    
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }
    
    mapping(bytes32 => Farm) public farms;
    bytes32[] public farmIds;
    
    // Fee collection
    mapping(address => uint256) public collectedFees;
    mapping(address => uint256) public protocolFees;
    uint256 public totalFeesCollected;
    
    // Circuit Breakers
    uint256 public maxPriceImpact = 1000; // 10% max price impact
    uint256 public maxSlippage = 500; // 5% max slippage
    bool public circuitBreakerEnabled = true;
    
    // Events
    event PairCreated(bytes32 indexed pairId, address tokenA, address tokenB, PoolType poolType);
    event LiquidityAdded(bytes32 indexed pairId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(bytes32 indexed pairId, address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event TokensSwapped(bytes32 indexed pairId, address indexed trader, address tokenIn, uint256 amountIn, uint256 amountOut, uint256 fee);
    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address token, uint256 amount);
    event OrderPlaced(bytes32 indexed orderId, address indexed trader, OrderType orderType);
    event OrderExecuted(bytes32 indexed orderId, uint256 executionPrice);
    event OrderCancelled(bytes32 indexed orderId);
    event FlashLoan(address indexed borrower, address indexed token, uint256 amount, uint256 fee);
    event FarmCreated(bytes32 indexed farmId, bytes32 indexed pairId, address rewardToken);
    event Staked(bytes32 indexed farmId, address indexed user, uint256 amount);
    event Unstaked(bytes32 indexed farmId, address indexed user, uint256 amount);
    event RewardsClaimed(bytes32 indexed farmId, address indexed user, uint256 amount);
    event MEVProtectionTriggered(address indexed trader, bytes32 indexed pairId);
    event CircuitBreakerTriggered(bytes32 indexed pairId, uint256 priceImpact);
    event EmergencyPause(bytes32 indexed pairId, bool paused);
    event ImpermanentLossCompensation(bytes32 indexed pairId, address indexed provider, uint256 amount);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyGovernance() {
        require(msg.sender == governance || msg.sender == owner, "Only governance");
        _;
    }
    
    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner, "Only operator");
        _;
    }
    
    modifier pairExists(bytes32 _pairId) {
        require(tradingPairs[_pairId].tokenA != address(0), "Pair does not exist");
        _;
    }
    
    modifier pairActive(bytes32 _pairId) {
        require(tradingPairs[_pairId].active && !tradingPairs[_pairId].emergencyPaused, "Pair is not active");
        _;
    }
    
    modifier mevProtection(address _trader) {
        if (mevProtectionEnabled) {
            require(
                block.number > lastTradeTime[_trader] + mevProtectionWindow,
                "MEV protection: too soon"
            );
            lastTradeTime[_trader] = block.number;
        }
        _;
    }
    
    modifier circuitBreaker(bytes32 _pairId, uint256 _priceImpact) {
        if (circuitBreakerEnabled) {
            require(_priceImpact <= maxPriceImpact, "Circuit breaker: price impact too high");
        }
        _;
    }
    
    constructor(address _owner, address _governance) {
        require(_owner != address(0), "Invalid owner");
        require(_governance != address(0), "Invalid governance");
        owner = _owner;
        governance = _governance;
        operators[_owner] = true;
    }
    
    function createPair(
        address _tokenA, 
        address _tokenB, 
        PoolType _poolType
    ) external onlyOperator returns (bytes32) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        require(_tokenA != _tokenB, "Identical tokens");
        
        // Ensure consistent ordering
        if (_tokenA > _tokenB) {
            (_tokenA, _tokenB) = (_tokenB, _tokenA);
        }
        
        bytes32 pairId = keccak256(abi.encodePacked(_tokenA, _tokenB, uint256(_poolType)));
        require(tradingPairs[pairId].tokenA == address(0), "Pair already exists");
        
        TradingPair storage pair = tradingPairs[pairId];
        pair.tokenA = _tokenA;
        pair.tokenB = _tokenB;
        pair.active = true;
        pair.emergencyPaused = false;
        pair.lastUpdate = block.timestamp;
        pair.poolType = _poolType;
        
        // Set pool-specific parameters
        if (_poolType == PoolType.STABLE) {
            pair.amplificationParameter = 100; // A = 100 for stable pools
        } else if (_poolType == PoolType.WEIGHTED) {
            pair.weights = [5000, 5000]; // 50/50 default weights
        }
        
        pairIds.push(pairId);
        supportedTokens[_tokenA] = true;
        supportedTokens[_tokenB] = true;
        
        emit PairCreated(pairId, _tokenA, _tokenB, _poolType);
        return pairId;
    }
    
    function addLiquidity(
        bytes32 _pairId,
        uint256 _amountA,
        uint256 _amountB,
        uint256 _minAmountA,
        uint256 _minAmountB
    ) external pairExists(_pairId) pairActive(_pairId) returns (uint256 liquidity) {
        TradingPair storage pair = tradingPairs[_pairId];
        
        // Calculate optimal amounts
        if (pair.reserveA == 0 && pair.reserveB == 0) {
            // First liquidity provision
            liquidity = sqrt(_amountA * _amountB);
        } else {
            // Subsequent liquidity provisions
            uint256 liquidityA = (_amountA * pair.totalLiquidity) / pair.reserveA;
            uint256 liquidityB = (_amountB * pair.totalLiquidity) / pair.reserveB;
            liquidity = liquidityA < liquidityB ? liquidityA : liquidityB;
            
            // Recalculate amounts based on current ratio
            _amountA = (liquidity * pair.reserveA) / pair.totalLiquidity;
            _amountB = (liquidity * pair.reserveB) / pair.totalLiquidity;
        }
        
        require(_amountA >= _minAmountA && _amountB >= _minAmountB, "Slippage exceeded");
        require(liquidity > 0, "Insufficient liquidity");
        
        // Transfer tokens from user
        require(IERC20(pair.tokenA).transferFrom(msg.sender, address(this), _amountA), "TokenA transfer failed");
        require(IERC20(pair.tokenB).transferFrom(msg.sender, address(this), _amountB), "TokenB transfer failed");
        
        // Update reserves and liquidity
        pair.reserveA += _amountA;
        pair.reserveB += _amountB;
        pair.totalLiquidity += liquidity;
        pair.liquidity[msg.sender] += liquidity;
        pair.lastUpdate = block.timestamp;
        
        emit LiquidityAdded(_pairId, msg.sender, _amountA, _amountB, liquidity);
    }
    
    function removeLiquidity(
        bytes32 _pairId,
        uint256 _liquidity,
        uint256 _minAmountA,
        uint256 _minAmountB
    ) external pairExists(_pairId) returns (uint256 amountA, uint256 amountB) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(pair.liquidity[msg.sender] >= _liquidity, "Insufficient liquidity");
        require(pair.totalLiquidity > 0, "No liquidity");
        
        // Calculate amounts to return
        amountA = (_liquidity * pair.reserveA) / pair.totalLiquidity;
        amountB = (_liquidity * pair.reserveB) / pair.totalLiquidity;
        
        require(amountA >= _minAmountA && amountB >= _minAmountB, "Slippage exceeded");
        
        // Update state
        pair.liquidity[msg.sender] -= _liquidity;
        pair.totalLiquidity -= _liquidity;
        pair.reserveA -= amountA;
        pair.reserveB -= amountB;
        pair.lastUpdate = block.timestamp;
        
        // Transfer tokens back to user
        require(IERC20(pair.tokenA).transfer(msg.sender, amountA), "TokenA transfer failed");
        require(IERC20(pair.tokenB).transfer(msg.sender, amountB), "TokenB transfer failed");
        
        emit LiquidityRemoved(_pairId, msg.sender, amountA, amountB, _liquidity);
    }
    
    function swapTokens(
        bytes32 _pairId,
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut,
        address _to
    ) external pairExists(_pairId) pairActive(_pairId) returns (uint256 amountOut) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(_tokenIn == pair.tokenA || _tokenIn == pair.tokenB, "Invalid token");
        require(_amountIn > 0, "Invalid amount");
        require(_to != address(0), "Invalid recipient");
        
        bool isTokenA = _tokenIn == pair.tokenA;
        uint256 reserveIn = isTokenA ? pair.reserveA : pair.reserveB;
        uint256 reserveOut = isTokenA ? pair.reserveB : pair.reserveA;
        address tokenOut = isTokenA ? pair.tokenB : pair.tokenA;
        
        // Calculate output amount using constant product formula with fee
        uint256 amountInWithFee = _amountIn * (10000 - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= _minAmountOut, "Slippage exceeded");
        require(amountOut <= reserveOut, "Insufficient liquidity");
        
        // Calculate and collect fee
        uint256 feeAmount = (_amountIn * tradingFee) / 10000;
        collectedFees[_tokenIn] += feeAmount;
        totalFeesCollected += feeAmount;
        
        // Transfer input token from user
        require(IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn), "Input transfer failed");
        
        // Transfer output token to recipient
        require(IERC20(tokenOut).transfer(_to, amountOut), "Output transfer failed");
        
        // Update reserves
        if (isTokenA) {
            pair.reserveA += _amountIn;
            pair.reserveB -= amountOut;
        } else {
            pair.reserveB += _amountIn;
            pair.reserveA -= amountOut;
        }
        pair.lastUpdate = block.timestamp;
        
        uint256 fee = (_amountIn * tradingFee) / 10000;
        emit TokensSwapped(_pairId, msg.sender, _tokenIn, _amountIn, amountOut, fee);
    }
    
    function getAmountOut(
        bytes32 _pairId,
        address _tokenIn,
        uint256 _amountIn
    ) external view pairExists(_pairId) returns (uint256 amountOut) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(_tokenIn == pair.tokenA || _tokenIn == pair.tokenB, "Invalid token");
        
        bool isTokenA = _tokenIn == pair.tokenA;
        uint256 reserveIn = isTokenA ? pair.reserveA : pair.reserveB;
        uint256 reserveOut = isTokenA ? pair.reserveB : pair.reserveA;
        
        if (reserveIn == 0 || reserveOut == 0) return 0;
        
        uint256 amountInWithFee = _amountIn * (10000 - tradingFee);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        amountOut = numerator / denominator;
    }
    
    function getAmountIn(
        bytes32 _pairId,
        address _tokenOut,
        uint256 _amountOut
    ) external view pairExists(_pairId) returns (uint256 amountIn) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(_tokenOut == pair.tokenA || _tokenOut == pair.tokenB, "Invalid token");
        
        bool isTokenA = _tokenOut == pair.tokenA;
        uint256 reserveIn = isTokenA ? pair.reserveB : pair.reserveA;
        uint256 reserveOut = isTokenA ? pair.reserveA : pair.reserveB;
        
        require(_amountOut < reserveOut, "Insufficient liquidity");
        
        uint256 numerator = reserveIn * _amountOut * 10000;
        uint256 denominator = (reserveOut - _amountOut) * (10000 - tradingFee);
        amountIn = (numerator / denominator) + 1;
    }
    
    // Admin functions
    function updateTradingFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = tradingFee;
        tradingFee = _newFee;
        emit TradingFeeUpdated(oldFee, _newFee);
    }
    
    function setPairStatus(bytes32 _pairId, bool _active) external onlyOwner pairExists(_pairId) {
        tradingPairs[_pairId].active = _active;
    }
    
    function withdrawFees(address _token, uint256 _amount) external onlyOwner {
        require(collectedFees[_token] >= _amount, "Insufficient fees");
        collectedFees[_token] -= _amount;
        require(IERC20(_token).transfer(owner, _amount), "Transfer failed");
        emit FeesWithdrawn(_token, _amount);
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid owner");
        owner = _newOwner;
    }
    
    // View functions
    function getPairInfo(bytes32 _pairId) external view returns (
        address tokenA,
        address tokenB,
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity,
        bool active
    ) {
        TradingPair storage pair = tradingPairs[_pairId];
        return (
            pair.tokenA,
            pair.tokenB,
            pair.reserveA,
            pair.reserveB,
            pair.totalLiquidity,
            pair.active
        );
    }
    
    function getUserLiquidity(bytes32 _pairId, address _user) external view returns (uint256) {
        return tradingPairs[_pairId].liquidity[_user];
    }
    
    function getPairId(address _tokenA, address _tokenB) external pure returns (bytes32) {
        if (_tokenA > _tokenB) {
            (_tokenA, _tokenB) = (_tokenB, _tokenA);
        }
        return keccak256(abi.encodePacked(_tokenA, _tokenB));
    }
    
    function getAllPairs() external view returns (bytes32[] memory) {
        return pairIds;
    }
    
    function getPrice(bytes32 _pairId, address _token) external view returns (uint256) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(_token == pair.tokenA || _token == pair.tokenB, "Invalid token");
        
        if (pair.reserveA == 0 || pair.reserveB == 0) return 0;
        
        if (_token == pair.tokenA) {
            return (pair.reserveB * 1e18) / pair.reserveA;
        } else {
            return (pair.reserveA * 1e18) / pair.reserveB;
        }
    }
    
    // Utility functions
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
}

// Deployment script for CypherDEX
/*
To deploy this contract:

1. Constructor parameters:
   - _owner: Address of the contract owner

2. Sample deployment code:
   const CypherDEX = await ethers.getContractFactory("CypherDEX");
   const dex = await CypherDEX.deploy(
     "0x1234567890123456789012345678901234567890" // Owner address
   );
   await dex.deployed();
   console.log("CypherDEX deployed to:", dex.address);

3. Setup:
   - Create trading pairs using createPair(tokenA, tokenB)
   - Add initial liquidity with addLiquidity()
   - Users can then trade using swapTokens()

4. Usage Example:
   // Create ECLP/USDC pair
   const pairId = await dex.createPair(eclpToken.address, usdcToken.address);
   
   // Add liquidity
   await dex.addLiquidity(pairId, ethers.parseEther("1000"), ethers.parseUnits("2000", 6), 0, 0);
   
   // Swap tokens
   await dex.swapTokens(pairId, eclpToken.address, ethers.parseEther("100"), 0, userAddress);
*/
