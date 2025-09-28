const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying privacy wallet contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy libraries first
    console.log("\n=== Deploying Libraries ===");
    
    // Deploy PoseidonHash library
    const PoseidonHash = await ethers.getContractFactory("PoseidonHash");
    const poseidonHash = await PoseidonHash.deploy();
    await poseidonHash.deployed();
    console.log("PoseidonHash library deployed to:", poseidonHash.address);

    // Deploy ZKUtils library
    const ZKUtils = await ethers.getContractFactory("ZKUtils");
    const zkUtils = await ZKUtils.deploy();
    await zkUtils.deployed();
    console.log("ZKUtils library deployed to:", zkUtils.address);

    // Deploy MerkleTree library
    const MerkleTree = await ethers.getContractFactory("MerkleTree");
    const merkleTree = await MerkleTree.deploy();
    await merkleTree.deployed();
    console.log("MerkleTree library deployed to:", merkleTree.address);

    console.log("\n=== Deploying Core Contracts ===");

    // Deploy ShieldedPool
    const ShieldedPool = await ethers.getContractFactory("ShieldedPool");
    const shieldedPool = await ShieldedPool.deploy();
    await shieldedPool.deployed();
    console.log("ShieldedPool deployed to:", shieldedPool.address);

    // Deploy PrivacyRegistry
    const PrivacyRegistry = await ethers.getContractFactory("PrivacyRegistry");
    const privacyRegistry = await PrivacyRegistry.deploy();
    await privacyRegistry.deployed();
    console.log("PrivacyRegistry deployed to:", privacyRegistry.address);

    // Deploy AliasAccount with ShieldedPool address
    const AliasAccount = await ethers.getContractFactory("AliasAccount", {
        libraries: {
            PoseidonHash: poseidonHash.address,
        },
    });
    const aliasCreationFee = ethers.utils.parseEther("0.001"); // 0.001 ETH fee
    const aliasAccount = await AliasAccount.deploy(aliasCreationFee);
    await aliasAccount.deployed();
    console.log("AliasAccount deployed to:", aliasAccount.address);

    // Deploy MinimalShieldedPool if exists
    try {
        const MinimalShieldedPool = await ethers.getContractFactory("MinimalShieldedPool", {
            libraries: {
                ZKUtils: zkUtils.address,
                MerkleTree: merkleTree.address,
            },
        });
        const minimalShieldedPool = await MinimalShieldedPool.deploy();
        await minimalShieldedPool.deployed();
        console.log("MinimalShieldedPool deployed to:", minimalShieldedPool.address);
        
        // Authorize the minimal shielded pool in AliasAccount
        await aliasAccount.authorizePool(minimalShieldedPool.address);
        console.log("MinimalShieldedPool authorized in AliasAccount");
    } catch (error) {
        console.log("MinimalShieldedPool not found, skipping...");
    }

    // Deploy Verifier if exists
    try {
        const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
        const verifier = await Groth16Verifier.deploy();
        await verifier.deployed();
        console.log("Groth16Verifier deployed to:", verifier.address);
    } catch (error) {
        console.log("Groth16Verifier not found, skipping...");
    }

    console.log("\n=== Contract Configuration ===");
    
    // Register the shielded pool in privacy registry
    await privacyRegistry.registerPool(
        shieldedPool.address,
        "shielded",
        ethers.constants.HashZero
    );
    console.log("ShieldedPool registered in PrivacyRegistry");

    // Set up some initial privacy configurations
    const initialConfig = {
        zkProofsEnabled: true,
        minMixingAmount: ethers.utils.parseEther("0.001"),
        maxMixingAmount: ethers.utils.parseEther("10"),
        merkleRoot: ethers.constants.HashZero,
        anonymitySetSize: 100,
        mixingRounds: 3,
        crossChainEnabled: false,
        privacyScore: 0,
        lastUpdated: 0,
        trustedCommitments: []
    };

    // Register deployer with initial privacy config
    await privacyRegistry.updatePrivacyConfig(initialConfig);
    console.log("Deployer registered with initial privacy config");

    console.log("\n=== Deployment Complete ===");
    console.log("Summary of deployed contracts:");
    console.log("┌─────────────────────────┬────────────────────────────────────────────┐");
    console.log("│ Contract                │ Address                                    │");
    console.log("├─────────────────────────┼────────────────────────────────────────────┤");
    console.log(`│ PoseidonHash            │ ${poseidonHash.address}                     │`);
    console.log(`│ ZKUtils                 │ ${zkUtils.address}                     │`);
    console.log(`│ MerkleTree              │ ${merkleTree.address}                     │`);
    console.log(`│ ShieldedPool            │ ${shieldedPool.address}                     │`);
    console.log(`│ PrivacyRegistry         │ ${privacyRegistry.address}                     │`);
    console.log(`│ AliasAccount            │ ${aliasAccount.address}                     │`);
    console.log("└─────────────────────────┴────────────────────────────────────────────┘");

    // Save addresses to deployment file
    const deployment = {
        network: await ethers.provider.getNetwork(),
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            libraries: {
                PoseidonHash: poseidonHash.address,
                ZKUtils: zkUtils.address,
                MerkleTree: merkleTree.address
            },
            core: {
                ShieldedPool: shieldedPool.address,
                PrivacyRegistry: privacyRegistry.address,
                AliasAccount: aliasAccount.address
            }
        },
        configuration: {
            aliasCreationFee: aliasCreationFee.toString(),
            minMixingAmount: initialConfig.minMixingAmount.toString(),
            maxMixingAmount: initialConfig.maxMixingAmount.toString()
        }
    };

    const fs = require('fs');
    const deploymentPath = './deployments/privacy-wallet.json';
    fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
    console.log(`\nDeployment info saved to: ${deploymentPath}`);

    console.log("\n=== Next Steps ===");
    console.log("1. Update frontend with contract addresses");
    console.log("2. Verify contracts on block explorer");
    console.log("3. Test deposit/withdraw flows");
    console.log("4. Configure privacy settings");
    
    console.log("\n=== Test Commands ===");
    console.log(`# Test deposit to shielded pool`);
    console.log(`npx hardhat run scripts/test-deposit.js --network ${(await ethers.provider.getNetwork()).name}`);
    console.log(`# Test privacy registry`);
    console.log(`npx hardhat run scripts/test-privacy.js --network ${(await ethers.provider.getNetwork()).name}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
