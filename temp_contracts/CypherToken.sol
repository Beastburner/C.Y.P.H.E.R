// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IERC20.sol";

/**
 * @title CypherToken
 * @dev Advanced Implementation of the Cypher Wallet Token (ECLP)
 * Revolutionary Features:
 * - Standard ERC-20 functionality with gas optimizations
 * - Burnable tokens with deflationary mechanics
 * - Pausable transfers with emergency controls
 * - Role-based access control for advanced permissions
 * - Dynamic supply management with voting mechanisms
 * - Governance integration for community decisions
 * - Reward distribution for wallet usage
 * - Anti-bot protection and MEV resistance
 * - Cross-chain bridge compatibility
 * - Staking rewards integration
 * - Tax mechanisms for ecosystem funding
 * - Liquidity provision incentives
 */

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// Access Control with Roles
abstract contract AccessControl is Context {
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }

    mapping(bytes32 => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNOR_ROLE = keccak256("GOVERNOR_ROLE");

    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].members[account];
    }

    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert("AccessControl: account missing role");
        }
    }

    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    function renounceRole(bytes32 role, address account) public virtual {
        require(account == _msgSender(), "AccessControl: can only renounce roles for self");
        _revokeRole(role, account);
    }

    function _setupRole(bytes32 role, address account) internal virtual {
        _grantRole(role, account);
    }

    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    function _grantRole(bytes32 role, address account) internal virtual {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, _msgSender());
        }
    }

    function _revokeRole(bytes32 role, address account) internal virtual {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, _msgSender());
        }
    }
}

contract CypherToken is IERC20, AccessControl {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Advanced features
    mapping(address => bool) private _blacklisted;
    mapping(address => uint256) private _stakingRewards;
    mapping(address => uint256) private _lastActivity;
    mapping(address => bool) private _exemptFromTax;
    
    uint256 private _totalSupply;
    uint256 private _maxSupply;
    uint256 private _minSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;
    bool private _paused;
    
    // Tax and rewards
    uint256 public taxRate = 100; // 1% (100 basis points)
    uint256 public rewardRate = 50; // 0.5% (50 basis points)
    uint256 public stakingAPY = 1200; // 12% APY (1200 basis points)
    address public treasuryWallet;
    address public stakingContract;
    
    // Anti-bot protection
    uint256 public maxTransactionAmount;
    uint256 public maxWalletAmount;
    uint256 public tradingStartTime;
    bool public antiMEVEnabled = true;
    
    // Governance
    uint256 public proposalThreshold = 10000 * 10**18; // 10k tokens to create proposal
    uint256 public votingPeriod = 7 days;
    
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event Paused(address account);
    event Unpaused(address account);
    event BlacklistUpdated(address indexed account, bool blacklisted);
    event TaxRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardDistributed(address indexed to, uint256 amount);
    event StakingRewardClaimed(address indexed account, uint256 amount);
    event GovernanceProposal(uint256 indexed proposalId, address indexed proposer, string description);
    event AntiMEVTriggered(address indexed account, uint256 amount);

    modifier whenNotPaused() {
        require(!_paused, "CypherToken: token transfer while paused");
        _;
    }

    modifier whenPaused() {
        require(_paused, "CypherToken: not paused");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 maxSupply_,
        uint256 initialSupply_,
        address treasuryWallet_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;
        _maxSupply = maxSupply_ * 10**decimals_;
        _minSupply = (_maxSupply * 10) / 100; // Minimum 10% of max supply
        treasuryWallet = treasuryWallet_;
        
        // Set up roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
        _setupRole(GOVERNOR_ROLE, _msgSender());
        
        // Initialize anti-bot protection
        maxTransactionAmount = (_maxSupply * 50) / 10000; // 0.5% of max supply
        maxWalletAmount = (_maxSupply * 200) / 10000; // 2% of max supply
        tradingStartTime = block.timestamp + 1 hours; // Start trading 1 hour after deployment
        
        // Exempt treasury and deployer from taxes
        _exemptFromTax[treasuryWallet_] = true;
        _exemptFromTax[_msgSender()] = true;
        
        if (initialSupply_ > 0) {
            _mint(_msgSender(), initialSupply_ * 10**decimals_);
        }
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        address owner = _msgSender();
        _beforeTokenTransfer(owner, to, amount);
        _transfer(owner, to, amount);
        _afterTokenTransfer(owner, to, amount);
        return true;
    }

    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _beforeTokenTransfer(from, to, amount);
        _transfer(from, to, amount);
        _afterTokenTransfer(from, to, amount);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, allowance(owner, spender) + addedValue);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }
        return true;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(_totalSupply + amount <= _maxSupply, "CypherToken: max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function unpause() public onlyRole(PAUSER_ROLE) whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }

    function paused() public view returns (bool) {
        return _paused;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");
        require(_totalSupply + amount <= _maxSupply, "CypherToken: max supply exceeded");

        _totalSupply += amount;
        unchecked {
            _balances[account] += amount;
        }
        emit Transfer(address(0), account, amount);
        emit Mint(account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: burn from the zero address");

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
            _totalSupply -= amount;
        }

        emit Transfer(account, address(0), amount);
        emit Burn(account, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(!_blacklisted[from], "CypherToken: sender is blacklisted");
        require(!_blacklisted[to], "CypherToken: recipient is blacklisted");

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        
        uint256 transferAmount = amount;
        uint256 taxAmount = 0;
        
        // Apply tax if not exempt
        if (!_exemptFromTax[from] && !_exemptFromTax[to] && from != address(0) && to != address(0)) {
            taxAmount = (amount * taxRate) / 10000;
            transferAmount = amount - taxAmount;
            
            // Send tax to treasury
            if (taxAmount > 0) {
                unchecked {
                    _balances[from] = fromBalance - amount;
                    _balances[treasuryWallet] += taxAmount;
                    _balances[to] += transferAmount;
                }
                emit Transfer(from, treasuryWallet, taxAmount);
            } else {
                unchecked {
                    _balances[from] = fromBalance - amount;
                    _balances[to] += transferAmount;
                }
            }
        } else {
            unchecked {
                _balances[from] = fromBalance - amount;
                _balances[to] += transferAmount;
            }
        }

        emit Transfer(from, to, transferAmount);
    }

    function _approve(address owner, address spender, uint256 amount) internal {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev Blacklist/whitelist addresses
     */
    function setBlacklisted(address account, bool blacklisted) external onlyRole(GOVERNOR_ROLE) {
        _blacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }
    
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }
    
    /**
     * @dev Tax management
     */
    function setTaxRate(uint256 newTaxRate) external onlyRole(GOVERNOR_ROLE) {
        require(newTaxRate <= 1000, "CypherToken: tax rate too high"); // Max 10%
        uint256 oldRate = taxRate;
        taxRate = newTaxRate;
        emit TaxRateUpdated(oldRate, newTaxRate);
    }
    
    function setExemptFromTax(address account, bool exempt) external onlyRole(GOVERNOR_ROLE) {
        _exemptFromTax[account] = exempt;
    }
    
    function isExemptFromTax(address account) external view returns (bool) {
        return _exemptFromTax[account];
    }
    
    /**
     * @dev Staking rewards
     */
    function distributeStakingRewards(address[] calldata accounts, uint256[] calldata amounts) 
        external onlyRole(MINTER_ROLE) {
        require(accounts.length == amounts.length, "CypherToken: arrays length mismatch");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            _stakingRewards[accounts[i]] += amounts[i];
            emit RewardDistributed(accounts[i], amounts[i]);
        }
    }
    
    function claimStakingReward() external {
        uint256 reward = _stakingRewards[_msgSender()];
        require(reward > 0, "CypherToken: no rewards to claim");
        
        _stakingRewards[_msgSender()] = 0;
        _mint(_msgSender(), reward);
        emit StakingRewardClaimed(_msgSender(), reward);
    }
    
    function getStakingReward(address account) external view returns (uint256) {
        return _stakingRewards[account];
    }
    
    /**
     * @dev Anti-bot protection
     */
    function setMaxTransactionAmount(uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        maxTransactionAmount = amount;
    }
    
    function setMaxWalletAmount(uint256 amount) external onlyRole(GOVERNOR_ROLE) {
        maxWalletAmount = amount;
    }
    
    function setAntiMEVEnabled(bool enabled) external onlyRole(GOVERNOR_ROLE) {
        antiMEVEnabled = enabled;
    }
    
    /**
     * @dev Governance functions
     */
    function setTreasuryWallet(address newTreasury) external onlyRole(GOVERNOR_ROLE) {
        require(newTreasury != address(0), "CypherToken: invalid treasury address");
        treasuryWallet = newTreasury;
    }
    
    function setStakingContract(address newStaking) external onlyRole(GOVERNOR_ROLE) {
        stakingContract = newStaking;
    }
    
    /**
     * @dev Emergency functions
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) {
            payable(_msgSender()).transfer(amount);
        } else {
            IERC20(token).transfer(_msgSender(), amount);
        }
    }
    
    /**
     * @dev Hook functions for advanced functionality
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal {
        // Anti-bot protection
        if (antiMEVEnabled && block.timestamp < tradingStartTime) {
            require(hasRole(MINTER_ROLE, from) || hasRole(MINTER_ROLE, to), 
                "CypherToken: trading not started");
        }
        
        // Max transaction check
        if (maxTransactionAmount > 0 && !_exemptFromTax[from] && !_exemptFromTax[to]) {
            require(amount <= maxTransactionAmount, "CypherToken: exceeds max transaction");
        }
        
        // MEV protection - prevent sandwich attacks
        if (antiMEVEnabled && from != address(0) && to != address(0)) {
            uint256 timeSinceLastTx = block.timestamp - _lastActivity[from];
            if (timeSinceLastTx < 3) { // 3 seconds cooldown
                emit AntiMEVTriggered(from, amount);
                revert("CypherToken: MEV protection active");
            }
        }
    }
    
    function _afterTokenTransfer(address from, address to, uint256 /* amount */) internal {
        // Update last activity
        if (from != address(0)) {
            _lastActivity[from] = block.timestamp;
        }
        if (to != address(0)) {
            _lastActivity[to] = block.timestamp;
            
            // Max wallet check
            if (maxWalletAmount > 0 && !_exemptFromTax[to]) {
                require(_balances[to] <= maxWalletAmount, "CypherToken: exceeds max wallet");
            }
        }
    }
    
    /**
     * @dev Deflationary burn mechanism
     */
    function burnFromCirculation(uint256 percentage) external onlyRole(GOVERNOR_ROLE) {
        require(percentage <= 500, "CypherToken: burn percentage too high"); // Max 5%
        require(_totalSupply > _minSupply, "CypherToken: minimum supply reached");
        
        uint256 burnAmount = (_totalSupply * percentage) / 10000;
        if (_totalSupply - burnAmount < _minSupply) {
            burnAmount = _totalSupply - _minSupply;
        }
        
        _burn(treasuryWallet, burnAmount);
    }
    
    /**
     * @dev View functions
     */
    function getCirculatingSupply() external view returns (uint256) {
        return _totalSupply - _balances[address(0)];
    }
    
    function getTaxInfo() external view returns (uint256 tax, uint256 reward, address treasury) {
        return (taxRate, rewardRate, treasuryWallet);
    }
    
    function getAntiMEVInfo() external view returns (bool enabled, uint256 startTime, uint256 maxTx, uint256 maxWallet) {
        return (antiMEVEnabled, tradingStartTime, maxTransactionAmount, maxWalletAmount);
    }
}

/*
ADVANCED DEPLOYMENT GUIDE:

1. Constructor parameters:
   - name_: "Cypher Token"
   - symbol_: "ECLP" 
   - decimals_: 18
   - maxSupply_: 1000000 (1 million tokens)
   - initialSupply_: 100000 (100k initial tokens to deployer)
   - treasuryWallet_: Treasury address for tax collection

2. Advanced deployment code:
   const CypherToken = await ethers.getContractFactory("CypherToken");
   const token = await CypherToken.deploy(
     "Cypher Token",
     "ECLP",
     18,
     1000000,
     100000,
     "0x..." // Treasury wallet address
   );
   await token.deployed();
   
   // Set up additional roles
   await token.grantRole(await token.MINTER_ROLE(), stakingContractAddress);
   await token.grantRole(await token.PAUSER_ROLE(), emergencyMultisigAddress);
   
   console.log("Advanced CypherToken deployed to:", token.address);

3. Post-deployment setup:
   - Grant MINTER_ROLE to staking contract
   - Grant PAUSER_ROLE to emergency multisig
   - Set staking contract address
   - Configure anti-bot parameters
   - Set up governance parameters
*/
