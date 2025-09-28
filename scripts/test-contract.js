const { ethers } = require("hardhat");

async function testContract() {
    console.log("🧪 Testing SimplePrivacyPool contract...");
    
    const [signer] = await ethers.getSigners();
    console.log("Testing with account:", signer.address);
    
    // Connect to deployed contract
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const SimplePrivacyPool = await ethers.getContractFactory("SimplePrivacyPool");
    const pool = SimplePrivacyPool.attach(contractAddress);
    
    console.log("Connected to contract at:", contractAddress);
    
    // Test basic reads
    const minDeposit = await pool.MIN_DEPOSIT();
    const maxDeposit = await pool.MAX_DEPOSIT();
    const totalDeposits = await pool.totalDeposits();
    
    console.log("Min deposit:", ethers.utils.formatEther(minDeposit), "ETH");
    console.log("Max deposit:", ethers.utils.formatEther(maxDeposit), "ETH");
    console.log("Total deposits:", ethers.utils.formatEther(totalDeposits), "ETH");
    
    // Test deposit
    console.log("\n💰 Testing deposit...");
    const commitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("test_commitment_123"));
    const depositAmount = ethers.utils.parseEther("0.1");
    
    console.log("Commitment:", commitment);
    console.log("Deposit amount:", ethers.utils.formatEther(depositAmount), "ETH");
    
    try {
        const tx = await pool.deposit(commitment, { value: depositAmount });
        console.log("Transaction sent:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ Deposit successful! Block:", receipt.blockNumber);
        
        // Check updated balance
        const newTotalDeposits = await pool.totalDeposits();
        console.log("New total deposits:", ethers.utils.formatEther(newTotalDeposits), "ETH");
        
        // Check commitment exists
        const hasCommitment = await pool.hasCommitment(commitment);
        console.log("Commitment exists:", hasCommitment);
        
        const commitmentAmount = await pool.getCommitmentAmount(commitment);
        console.log("Commitment amount:", ethers.utils.formatEther(commitmentAmount), "ETH");
        
    } catch (error) {
        console.error("❌ Deposit failed:", error.message);
    }
    
    console.log("\n🎉 Contract test complete!");
}

testContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Test failed:", error);
        process.exit(1);
    });
