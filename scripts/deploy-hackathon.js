const { ethers } = require("hardhat");

async function deploy() {
    console.log("🚀 Deploying SimplePrivacyPool for CYPHER Privacy Wallet...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    
    const balance = await deployer.getBalance();
    console.log("Balance:", ethers.utils.formatEther(balance), "ETH");
    
    // Deploy SimplePrivacyPool
    const SimplePrivacyPool = await ethers.getContractFactory("SimplePrivacyPool");
    console.log("Deploying contract...");
    
    const pool = await SimplePrivacyPool.deploy();
    await pool.deployed();
    
    console.log("✅ SimplePrivacyPool deployed at:", pool.address);
    
    // Test basic functionality
    const minDeposit = await pool.MIN_DEPOSIT();
    const maxDeposit = await pool.MAX_DEPOSIT();
    console.log("Min deposit:", ethers.utils.formatEther(minDeposit), "ETH");
    console.log("Max deposit:", ethers.utils.formatEther(maxDeposit), "ETH");
    
    return pool.address;
}

if (require.main === module) {
    deploy()
        .then((address) => {
            console.log("\n📋 COPY THIS ADDRESS TO YOUR FRONTEND:");
            console.log(address);
            console.log("\n🎉 Ready for hackathon demo!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Deployment failed:", error);
            process.exit(1);
        });
}

module.exports = { deploy };
