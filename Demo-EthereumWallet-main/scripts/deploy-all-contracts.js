const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting CYPHER Wallet Smart Contract Deployment on Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  const deployedContracts = {};

  try {
    // 1. Deploy CypherToken (ERC-20)
    console.log("📄 Deploying CypherToken...");
    try {
      const CypherToken = await ethers.getContractFactory("CypherToken");
      const cypherToken = await CypherToken.deploy();
      await cypherToken.deployed();
      deployedContracts.CYPHER_TOKEN = cypherToken.address;
      console.log("✅ CypherToken deployed to:", cypherToken.address);
    } catch (error) {
      console.log("⚠️ CypherToken deployment skipped:", error.message);
      deployedContracts.CYPHER_TOKEN = "NOT_DEPLOYED";
    }

    // 2. Deploy Test Token for testing
    console.log("📄 Deploying TestToken...");
    try {
      const TestToken = await ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy();
      await testToken.deployed();
      deployedContracts.TEST_TOKEN = testToken.address;
      console.log("✅ TestToken deployed to:", testToken.address);
    } catch (error) {
      console.log("⚠️ TestToken deployment skipped:", error.message);
      deployedContracts.TEST_TOKEN = "NOT_DEPLOYED";
    }

    // 3. Deploy CypherDEX
    console.log("📄 Deploying CypherDEX...");
    try {
      const CypherDEX = await ethers.getContractFactory("CypherDEX");
      const cypherDEX = await CypherDEX.deploy();
      await cypherDEX.deployed();
      deployedContracts.CYPHER_DEX = cypherDEX.address;
      console.log("✅ CypherDEX deployed to:", cypherDEX.address);
    } catch (error) {
      console.log("⚠️ CypherDEX deployment skipped:", error.message);
      deployedContracts.CYPHER_DEX = "NOT_DEPLOYED";
    }

    // 4. Deploy CypherStaking (only if CypherToken deployed)
    console.log("📄 Deploying CypherStaking...");
    try {
      if (deployedContracts.CYPHER_TOKEN !== "NOT_DEPLOYED") {
        const CypherStaking = await ethers.getContractFactory("CypherStaking");
        const cypherStaking = await CypherStaking.deploy(deployedContracts.CYPHER_TOKEN);
        await cypherStaking.deployed();
        deployedContracts.CYPHER_STAKING = cypherStaking.address;
        console.log("✅ CypherStaking deployed to:", cypherStaking.address);
      } else {
        throw new Error("CypherToken not available");
      }
    } catch (error) {
      console.log("⚠️ CypherStaking deployment skipped:", error.message);
      deployedContracts.CYPHER_STAKING = "NOT_DEPLOYED";
    }

    // 5. Deploy CypherNFT
    console.log("📄 Deploying CypherNFT...");
    try {
      const CypherNFT = await ethers.getContractFactory("CypherNFT");
      const cypherNFT = await CypherNFT.deploy();
      await cypherNFT.deployed();
      deployedContracts.CYPHER_NFT = cypherNFT.address;
      console.log("✅ CypherNFT deployed to:", cypherNFT.address);
    } catch (error) {
      console.log("⚠️ CypherNFT deployment skipped:", error.message);
      deployedContracts.CYPHER_NFT = "NOT_DEPLOYED";
    }

    // 6. Deploy CypherNFTMarketplace
    console.log("📄 Deploying CypherNFTMarketplace...");
    try {
      const CypherNFTMarketplace = await ethers.getContractFactory("CypherNFTMarketplace");
      const cypherNFTMarketplace = await CypherNFTMarketplace.deploy();
      await cypherNFTMarketplace.deployed();
      deployedContracts.CYPHER_MARKETPLACE = cypherNFTMarketplace.address;
      console.log("✅ CypherNFTMarketplace deployed to:", cypherNFTMarketplace.address);
    } catch (error) {
      console.log("⚠️ CypherNFTMarketplace deployment skipped:", error.message);
      deployedContracts.CYPHER_MARKETPLACE = "NOT_DEPLOYED";
    }

    // 7. Deploy CypherMultiSigWallet
    console.log("📄 Deploying CypherMultiSigWallet...");
    try {
      const owners = [deployer.address]; // Add more owners as needed
      const requiredConfirmations = 1;
      const CypherMultiSigWallet = await ethers.getContractFactory("CypherMultiSigWallet");
      const cypherMultiSigWallet = await CypherMultiSigWallet.deploy(owners, requiredConfirmations);
      await cypherMultiSigWallet.deployed();
      deployedContracts.MULTISIG_WALLET = cypherMultiSigWallet.address;
      console.log("✅ CypherMultiSigWallet deployed to:", cypherMultiSigWallet.address);
    } catch (error) {
      console.log("⚠️ CypherMultiSigWallet deployment skipped:", error.message);
      deployedContracts.MULTISIG_WALLET = "NOT_DEPLOYED";
    }

    // 8. Deploy Privacy Pool (MinimalShieldedPool) - if verifier exists
    console.log("📄 Deploying MinimalShieldedPool (Privacy Pool)...");
    try {
      const MinimalShieldedPool = await ethers.getContractFactory("MinimalShieldedPool");
      const privacyPool = await MinimalShieldedPool.deploy();
      await privacyPool.deployed();
      deployedContracts.PRIVACY_POOL = privacyPool.address;
      console.log("✅ MinimalShieldedPool deployed to:", privacyPool.address);
    } catch (error) {
      console.log("⚠️ MinimalShieldedPool deployment skipped:", error.message);
      deployedContracts.PRIVACY_POOL = "NOT_DEPLOYED";
    }

    // 9. Deploy Groth16Verifier (if exists)
    console.log("📄 Deploying Groth16Verifier...");
    try {
      const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
      const verifier = await Groth16Verifier.deploy();
      await verifier.deployed();
      deployedContracts.GROTH16_VERIFIER = verifier.address;
      console.log("✅ Groth16Verifier deployed to:", verifier.address);
    } catch (error) {
      console.log("⚠️ Groth16Verifier deployment skipped:", error.message);
      deployedContracts.GROTH16_VERIFIER = "NOT_DEPLOYED";
    }

    // 10. Deploy SimpleTest contract for basic testing
    console.log("📄 Deploying SimpleTest...");
    try {
      const SimpleTest = await ethers.getContractFactory("SimpleTest");
      const simpleTest = await SimpleTest.deploy();
      await simpleTest.deployed();
      deployedContracts.SIMPLE_TEST = simpleTest.address;
      console.log("✅ SimpleTest deployed to:", simpleTest.address);
    } catch (error) {
      console.log("⚠️ SimpleTest deployment skipped:", error.message);
      deployedContracts.SIMPLE_TEST = "NOT_DEPLOYED";
    }
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment error:", error);
    process.exit(1);
  });