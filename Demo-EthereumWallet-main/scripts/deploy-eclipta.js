const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Deploying EcliptaPrivacyPool...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Poseidon libraries
  const PoseidonT3 = await ethers.getContractFactory("PoseidonT3");
  const poseidonT3 = await PoseidonT3.deploy();
  await poseidonT3.deployed();
  console.log("PoseidonT3 deployed to:", poseidonT3.address);

  const PoseidonT6 = await ethers.getContractFactory("PoseidonT6");
  const poseidonT6 = await PoseidonT6.deploy();
  await poseidonT6.deployed();
  console.log("PoseidonT6 deployed to:", poseidonT6.address);

  // Deploy Verifiers
  const DepositVerifier = await ethers.getContractFactory("DepositVerifier");
  const depositVerifier = await DepositVerifier.deploy();
  await depositVerifier.deployed();
  console.log("DepositVerifier deployed to:", depositVerifier.address);

  const WithdrawVerifier = await ethers.getContractFactory("WithdrawVerifier");
  const withdrawVerifier = await WithdrawVerifier.deploy();
  await withdrawVerifier.deployed();
  console.log("WithdrawVerifier deployed to:", withdrawVerifier.address);

  // Deploy EcliptaPrivacyPool
  const EcliptaPrivacyPool = await ethers.getContractFactory("EcliptaPrivacyPool", {
    libraries: {
      PoseidonT3: poseidonT3.address,
      PoseidonT6: poseidonT6.address,
    },
  });

  const merkleTreeHeight = 20;
  const denomination = ethers.utils.parseEther("0.1");

  const ecliptaPrivacyPool = await EcliptaPrivacyPool.deploy(
    depositVerifier.address,
    withdrawVerifier.address,
    merkleTreeHeight,
    denomination
  );
  await ecliptaPrivacyPool.deployed();

  console.log("✅ EcliptaPrivacyPool deployed to:", ecliptaPrivacyPool.address);

  // Update frontend config
  const configPath = path.join(__dirname, '../src/config/contracts.json');
  const config = JSON.parse(fs.readFileSync(configPath));

  config.ECLIPTA_PRIVACY_POOL_ADDRESS = ecliptaPrivacyPool.address;

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log("✅ Updated src/config/contracts.json with the new address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
