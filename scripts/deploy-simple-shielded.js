const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying SimpleShieldedPool to localhost...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  try {
    // Deploy SimpleShieldedPool
    console.log("📄 Deploying SimpleShieldedPool...");
    const SimpleShieldedPool = await ethers.getContractFactory("SimpleShieldedPool");
    const shieldedPool = await SimpleShieldedPool.deploy();
    await shieldedPool.deployed();
    
    console.log("✅ SimpleShieldedPool deployed to:", shieldedPool.address);
    
    // Test the contract
    console.log("🧪 Testing contract functions...");
    const stats = await shieldedPool.getPoolStats();
    console.log("Initial pool stats:", {
      totalDeposits: ethers.utils.formatEther(stats[0]),
      totalWithdrawals: ethers.utils.formatEther(stats[1]),
      activeCommitments: stats[2].toString(),
      poolBalance: ethers.utils.formatEther(stats[3])
    });
    
    // Save deployment info
    const deploymentInfo = {
      network: "localhost",
      chainId: 1337,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        SimpleShieldedPool: shieldedPool.address
      },
      gasUsed: {
        deployment: "estimated"
      }
    };
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    // Update the main deployment file with simple contract
    fs.writeFileSync(
      path.join(deploymentsDir, 'localhost.json'), 
      JSON.stringify({
        ...deploymentInfo,
        contracts: {
          MinimalShieldedPool: shieldedPool.address, // Keep same name for compatibility
          SimpleShieldedPool: shieldedPool.address
        }
      }, null, 2)
    );
    
    console.log("📝 Deployment info saved to deployments/localhost.json");
    console.log("\n🎉 Deployment completed successfully!");
    console.log(`SimpleShieldedPool: ${shieldedPool.address}`);
    console.log("\n🔧 Next steps:");
    console.log("1. Start your React Native app");
    console.log("2. Switch to localhost network");
    console.log("3. Test privacy pool deposits and withdrawals");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
