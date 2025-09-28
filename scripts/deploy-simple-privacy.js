const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SimplePrivacyPool for hackathon demo...");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.utils.formatEther(await deployer.getBalance()));

  // Deploy SimplePrivacyPool
  console.log("\nDeploying SimplePrivacyPool...");
  const SimplePrivacyPool = await ethers.getContractFactory("SimplePrivacyPool");
  const simplePool = await SimplePrivacyPool.deploy();
  await simplePool.deployed();

  console.log("SimplePrivacyPool deployed to:", simplePool.address);
  
  // Verify deployment
  console.log("\nVerifying deployment...");
  const totalDeposits = await simplePool.totalDeposits();
  console.log("Initial total deposits:", ethers.utils.formatEther(totalDeposits));
  
  const owner = await simplePool.owner();
  console.log("Contract owner:", owner);

  // Create deployment info for frontend
  const deployment = {
    simplePrivacyPool: {
      address: simplePool.address,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      network: "hardhat", // Will be updated for actual testnet
      minDeposit: "0.001",
      maxDeposit: "10.0"
    }
  };

  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("Copy these addresses to your frontend:");
  console.log(JSON.stringify(deployment, null, 2));
  
  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
