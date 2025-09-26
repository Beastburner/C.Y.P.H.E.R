/**
 * Simple Contract Deployment Script for CYPHER Wallet
 * Deploys essential contracts for hackathon demo
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying contracts with the account:", deployer.address);
  
  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", ethers.utils.formatEther(balance), "ETH");

  try {
    // 1. Deploy Test Token for demo purposes
    console.log("\n📝 Deploying TestToken...");
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = await TestToken.deploy();
    await testToken.deployed();
    console.log("✅ TestToken deployed to:", testToken.address);

    // 2. Deploy CYPHER Token
    console.log("\n📝 Deploying CypherToken...");
    const CypherToken = await ethers.getContractFactory("CypherToken");
    const cypherToken = await CypherToken.deploy();
    await cypherToken.deployed();
    console.log("✅ CypherToken deployed to:", cypherToken.address);

    // 3. Deploy Simple DEX for swapping
    console.log("\n📝 Deploying CypherDEX...");
    const CypherDEX = await ethers.getContractFactory("CypherDEX");
    const cypherDex = await CypherDEX.deploy();
    await cypherDex.deployed();
    console.log("✅ CypherDEX deployed to:", cypherDex.address);

    // 4. Deploy Multi-Sig Wallet
    console.log("\n📝 Deploying CypherMultiSigWallet...");
    const CypherMultiSig = await ethers.getContractFactory("CypherMultiSigWallet");
    const owners = [deployer.address]; // Add more owners as needed
    const cypherMultiSig = await CypherMultiSig.deploy(owners, 1); // 1 of 1 multisig for demo
    await cypherMultiSig.deployed();
    console.log("✅ CypherMultiSigWallet deployed to:", cypherMultiSig.address);

    // 5. Deploy Staking Contract
    console.log("\n📝 Deploying CypherStaking...");
    const CypherStaking = await ethers.getContractFactory("CypherStaking");
    const cypherStaking = await CypherStaking.deploy(cypherToken.address);
    await cypherStaking.deployed();
    console.log("✅ CypherStaking deployed to:", cypherStaking.address);

    // Store deployment addresses
    const deploymentInfo = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      contracts: {
        TestToken: testToken.address,
        CypherToken: cypherToken.address,
        CypherDEX: cypherDex.address,
        CypherMultiSigWallet: cypherMultiSig.address,
        CypherStaking: cypherStaking.address
      }
    };

    console.log("\n🎉 All contracts deployed successfully!");
    console.log("📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // Mint some test tokens for testing
    console.log("\n🪙 Minting test tokens...");
    const mintAmount = ethers.utils.parseEther("1000");
    await testToken.mint(deployer.address, mintAmount);
    await cypherToken.mint(deployer.address, mintAmount);
    console.log("✅ Minted 1000 tokens each for testing");

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then((deploymentInfo) => {
    console.log("🎯 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Deployment script failed:", error);
    process.exit(1);
  });
