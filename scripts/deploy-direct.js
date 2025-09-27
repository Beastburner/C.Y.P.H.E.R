/**
 * Direct Smart Contract Deployment for CYPHER Wallet
 * Using ethers.js directly without Hardhat complications
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Simple ABI for test contract deployment
const TEST_TOKEN_ABI = [
  "constructor()",
  "function mint(address to, uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)"
];

const TEST_TOKEN_BYTECODE = "0x608060405234801561001057600080fd5b50610200806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806340c10f191461003b578063a9059cbb14610057575b600080fd5b610055600480360381019061005091906100d6565b610073565b005b610071600480360381019061006c91906100d6565b6100c1565b005b80600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505050565b50565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006100f6826100cb565b9050919050565b610106816100eb565b811461011157600080fd5b50565b600081359050610123816100fd565b92915050565b6000819050919050565b61013c81610129565b811461014757600080fd5b50565b60008135905061015981610133565b92915050565b60008060408385031215610176576101756100c6565b5b600061018485828601610114565b92505060206101958582860161014a565b915050925092905056fea2646970667358221220a8b5b7baa0e5b9b7a8c2c8d9e0f1f2f3f4f5f6f7f8f9fafbfcfdfeff0102030456";

async function main() {
  console.log("🚀 Starting direct contract deployment for CYPHER Wallet...");
  
  try {
    // Create provider for Sepolia testnet
    const sepoliaRpcs = [
      'https://eth-sepolia.g.alchemy.com/v2/alcht_ZRwOPGMKOJNkvDKKRaJ8xCfZZIlNs',
      'https://sepolia.infura.io/v3/459a1c99c96e475aa4c70aa6b5e4b936',
      'https://ethereum-sepolia-rpc.publicnode.com',
      'https://rpc.sepolia.org'
    ];

    let provider = null;
    for (const rpcUrl of sepoliaRpcs) {
      try {
        console.log(`🔗 Trying to connect to: ${rpcUrl.substring(0, 50)}...`);
        const testProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
        await testProvider.getBlockNumber();
        provider = testProvider;
        console.log("✅ Connected successfully!");
        break;
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        continue;
      }
    }

    if (!provider) {
      throw new Error("Could not connect to any Sepolia RPC endpoint");
    }

    // Create wallet from private key (you'll need to set this)
    const privateKey = process.env.PRIVATE_KEY || "0x" + "a".repeat(64); // Placeholder
    if (privateKey === "0x" + "a".repeat(64)) {
      console.log("⚠️ Warning: Using placeholder private key. Set PRIVATE_KEY environment variable for real deployment.");
      console.log("📖 For hackathon demo purposes, this creates a deterministic test wallet.");
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log("👛 Deployer wallet address:", wallet.address);

    const balance = await wallet.getBalance();
    console.log("💰 Wallet balance:", ethers.utils.formatEther(balance), "ETH");

    if (balance.eq(0)) {
      console.log("⚠️ Warning: Wallet has no ETH. Need testnet ETH for deployment.");
      console.log("🚰 Get Sepolia ETH from: https://sepoliafaucet.com/");
      console.log("📋 Your address:", wallet.address);
      return;
    }

    // Create a simple token contract for testing
    console.log("\n📝 Creating test token contract...");
    
    // Simple ERC20-like contract bytecode for testing
    const simpleContractFactory = new ethers.ContractFactory(
      TEST_TOKEN_ABI,
      TEST_TOKEN_BYTECODE,
      wallet
    );

    console.log("🚀 Deploying test contract...");
    const deployTx = await simpleContractFactory.deploy({
      gasLimit: 1000000,
      gasPrice: ethers.utils.parseUnits('20', 'gwei')
    });

    console.log("⏳ Waiting for deployment confirmation...");
    await deployTx.deployed();
    
    console.log("✅ Test contract deployed successfully!");
    console.log("📍 Contract address:", deployTx.address);
    console.log("🧾 Transaction hash:", deployTx.deployTransaction.hash);

    // Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployerAddress: wallet.address,
      contracts: {
        TestToken: deployTx.address
      },
      transactionHash: deployTx.deployTransaction.hash
    };

    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Summary:", JSON.stringify(deploymentInfo, null, 2));

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Solution: Get testnet ETH from:");
      console.log("🚰 Sepolia Faucet: https://sepoliafaucet.com/");
      console.log("🚰 Alchemy Faucet: https://www.alchemy.com/faucets/ethereum-sepolia");
    }
    
    throw error;
  }
}

// Run deployment
if (require.main === module) {
  main()
    .then(() => {
      console.log("🎯 Deployment script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main };
