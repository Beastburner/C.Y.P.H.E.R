/**
 * Simple Transaction Test Script
 * 
 * To help debug your transaction issues quickly, you can:
 * 
 * 1. Go to Settings > Advanced Transaction Debugger
 * 2. Or run this test manually:
 */

// Test addresses you can use (these are common test addresses):
export const TEST_ADDRESSES = {
  // Ethereum test address 1 (from your existing code)
  recipient1: '0x742d35Cc6634C0532925a3b8D4f25dC3f0aC8881',
  
  // Ethereum test address 2
  recipient2: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Vitalik's address
  
  // Test address 3 - Ethereum Foundation
  recipient3: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
};

export const TEST_AMOUNTS = {
  tiny: '0.001',    // 0.001 ETH (~$2-4)
  small: '0.01',    // 0.01 ETH (~$20-40)  
  medium: '0.1',    // 0.1 ETH (~$200-400)
};

/**
 * Quick Test Steps:
 * 
 * 1. Make sure you have some test ETH (use a testnet like Sepolia)
 * 2. Go to Settings in your wallet
 * 3. Look for "Advanced Transaction Debugger" 
 * 4. Use one of the test addresses above
 * 5. Use the tiny amount (0.001 ETH) first
 * 6. Run diagnostics to see what's wrong
 * 
 * The debugger will:
 * - Check if your wallet has accounts
 * - Check if accounts have private keys
 * - Check network connectivity
 * - Test gas estimation
 * - Show detailed logs of what's failing
 */

/**
 * Common Issues and Solutions:
 * 
 * 1. "No accounts found" - Create an account first
 * 2. "Network error" - Check your RPC connection
 * 3. "Insufficient funds" - Get test ETH from faucet
 * 4. "Gas estimation failed" - Network might be down
 * 5. "Transaction failed" - Check recipient address format
 */

export default {
  TEST_ADDRESSES,
  TEST_AMOUNTS,
};
