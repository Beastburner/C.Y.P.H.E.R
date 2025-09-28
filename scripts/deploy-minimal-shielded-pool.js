const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying MinimalShieldedPool to localhost...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  try {
    // Deploy MinimalShieldedPool
    console.log("📄 Deploying MinimalShieldedPool...");
    const MinimalShieldedPool = await ethers.getContractFactory("MinimalShieldedPool");
    const shieldedPool = await MinimalShieldedPool.deploy();
    await shieldedPool.deployed();
    
    console.log("✅ MinimalShieldedPool deployed to:", shieldedPool.address);
    
    // Save deployment info
    const deploymentInfo = {
      network: "localhost",
      chainId: 1337,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        MinimalShieldedPool: shieldedPool.address
      }
    };
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    fs.writeFileSync(
      path.join(deploymentsDir, 'localhost-minimal.json'), 
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("📝 Deployment info saved to deployments/localhost-minimal.json");
    console.log("\n🎉 Deployment completed successfully!");
    console.log(`MinimalShieldedPool: ${shieldedPool.address}`);
    
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
