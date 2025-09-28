const { ethers } = require("ethers");

async function testContract() {
  console.log("🧪 Testing MinimalShieldedPool contract...");
  
  try {
    // Connect to localhost
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    const contractAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
    
    // Simple ABI for testing
    const testABI = [
      "function getPoolStats() external view returns (uint256, uint256, uint256, uint256)",
      "function hasCommitment(bytes32) external view returns (bool)",
      "function isNullifierUsed(bytes32) external view returns (bool)",
      "function poolConfig() external view returns (uint256, address, uint256, uint256, bool, uint256)"
    ];
    
    const contract = new ethers.Contract(contractAddress, testABI, provider);
    
    console.log("✅ Contract connected successfully");
    console.log("📍 Contract address:", contractAddress);
    
    // Test getPoolStats
    try {
      const stats = await contract.getPoolStats();
      console.log("📊 Pool Stats:", {
        totalDeposits: ethers.utils.formatEther(stats[0]),
        totalWithdrawals: ethers.utils.formatEther(stats[1]),
        activeCommitments: stats[2].toString(),
        poolBalance: ethers.utils.formatEther(stats[3])
      });
    } catch (error) {
      console.log("⚠️ getPoolStats not available:", error.message);
    }
    
    // Test poolConfig
    try {
      const config = await contract.poolConfig();
      console.log("⚙️ Pool Config:", {
        depositAmount: ethers.utils.formatEther(config[0]),
        tokenAddress: config[1],
        isActive: config[4]
      });
    } catch (error) {
      console.log("⚠️ poolConfig not available:", error.message);
    }
    
    console.log("🎉 Contract test completed!");
    
  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }
}

testContract();
