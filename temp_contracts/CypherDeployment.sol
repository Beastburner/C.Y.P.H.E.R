// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "./CypherToken.sol";
import "./CypherDEX.sol";
import "./CypherStaking.sol";
import "./CypherMultiSigWallet.sol";

contract CypherDeployment {
    address public owner;
    bool public deployed;
    
    // Deployed contract addresses
    CypherToken public cypherToken;
    CypherDEX public cypherDEX;
    CypherStaking public cypherStaking;
    CypherMultiSigWallet public multiSigWallet;
    
    // Deployment parameters
    struct DeploymentConfig {
        string tokenName;
        string tokenSymbol;
        uint8 tokenDecimals;
        uint256 tokenMaxSupply;
        uint256 tokenInitialSupply;
        address[] multiSigOwners;
        uint256 multiSigRequired;
        uint256 dexTradingFee;
    }
    
    // Events
    event EcosystemDeployed(
        address token,
        address dex,
        address staking,
        address multiSig,
        address deployer
    );
    
    event ContractUpgraded(
        string contractName,
        address oldAddress,
        address newAddress
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier notDeployed() {
        require(!deployed, "Already deployed");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * Deploy the entire Cypher ecosystem
     */
    function deployEcosystem(DeploymentConfig memory config) 
        external 
        onlyOwner 
        notDeployed 
        returns (
            address tokenAddress,
            address dexAddress,
            address stakingAddress,
            address multiSigAddress
        ) 
    {
        // Deploy CypherToken
        cypherToken = new CypherToken(
            config.tokenName,
            config.tokenSymbol,
            config.tokenDecimals,
            config.tokenMaxSupply,
            config.tokenInitialSupply,
            owner // Treasury wallet initially set to owner
        );
        
        // Deploy CypherDEX
        cypherDEX = new CypherDEX(owner, owner);
        
        // Update trading fee if specified
        if (config.dexTradingFee > 0) {
            cypherDEX.updateTradingFee(config.dexTradingFee);
        }
        
        // Deploy CypherStaking (using ECLP as both staking and reward token)
        cypherStaking = new CypherStaking(
            address(cypherToken),
            address(cypherToken),
            owner
        );
        
        // Deploy MultiSigWallet
        multiSigWallet = new CypherMultiSigWallet(
            config.multiSigOwners,
            config.multiSigRequired
        );
        
        // Mark as deployed
        deployed = true;
        
        emit EcosystemDeployed(
            address(cypherToken),
            address(cypherDEX),
            address(cypherStaking),
            address(multiSigWallet),
            msg.sender
        );
        
        return (
            address(cypherToken),
            address(cypherDEX),
            address(cypherStaking),
            address(multiSigWallet)
        );
    }
    
    /**
     * Initialize ecosystem integrations
     */
    function initializeEcosystem() external onlyOwner {
        require(deployed, "Ecosystem not deployed");
        
        // Approve staking contract to spend tokens from this deployer
        uint256 stakingAllowance = cypherToken.totalSupply() / 10; // 10% for staking rewards
        cypherToken.approve(address(cypherStaking), stakingAllowance);
        
        // Create initial DEX pairs if needed
        // This would require having other tokens deployed first
        
        // Transfer remaining tokens to multiSig for governance
        uint256 remainingBalance = cypherToken.balanceOf(address(this));
        if (remainingBalance > 0) {
            cypherToken.transfer(address(multiSigWallet), remainingBalance);
        }
    }
    
    /**
     * Get all deployed contract addresses
     */
    function getDeployedContracts() external view returns (
        address token,
        address dex,
        address staking,
        address multiSig
    ) {
        return (
            address(cypherToken),
            address(cypherDEX),
            address(cypherStaking),
            address(multiSigWallet)
        );
    }
    
    /**
     * Transfer ownership of all contracts to multiSig
     */
    function transferEcosystemOwnership() external onlyOwner {
        require(deployed, "Ecosystem not deployed");
        require(address(multiSigWallet) != address(0), "MultiSig not deployed");
        
        // Transfer token roles to multiSig (CypherToken uses role-based access)
        // Grant admin role to multiSig and revoke from this contract
        bytes32 DEFAULT_ADMIN_ROLE = 0x00;
        cypherToken.grantRole(DEFAULT_ADMIN_ROLE, address(multiSigWallet));
        cypherToken.revokeRole(DEFAULT_ADMIN_ROLE, address(this));
        
        // Transfer DEX ownership
        cypherDEX.transferOwnership(address(multiSigWallet));
        
        // Transfer staking ownership
        cypherStaking.transferOwnership(address(multiSigWallet));
    }
    
    /**
     * Emergency function to rescue tokens
     */
    function rescueTokens(address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Transfer failed");
    }
    
    /**
     * Transfer ownership of this deployment contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
}

// Deployment script
/*
To deploy the Cypher ecosystem:

1. Deploy CypherDeployment contract first
2. Call deployEcosystem() with configuration:

const deploymentConfig = {
  tokenName: "Cypher Token",
  tokenSymbol: "ECLP",
  tokenDecimals: 18,
  tokenMaxSupply: 1000000, // 1M tokens
  tokenInitialSupply: 100000, // 100K initial
  multiSigOwners: [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901",
    "0x3456789012345678901234567890123456789012"
  ],
  multiSigRequired: 2,
  dexTradingFee: 30 // 0.3%
};

const deployment = await CypherDeployment.deploy();
await deployment.deployEcosystem(deploymentConfig);
await deployment.initializeEcosystem();
await deployment.transferEcosystemOwnership();

This will deploy and configure:
- CypherToken (ECLP)
- CypherDEX (AMM with ECLP pairs)
- CypherStaking (Stake ECLP, earn ECLP)
- CypherMultiSigWallet (Governance)
*/
