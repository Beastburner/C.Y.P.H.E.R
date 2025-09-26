const { ethers } = require('hardhat');
const { ZKProofSystem } = require('./zkProofSystem');

/**
 * @title Smart Contract Deployment Script
 * @dev Deploy shielded pool contracts and configure zero-knowledge system
 */

async function main() {
    console.log('Starting shielded pool deployment...');
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    try {
        // Deploy Groth16Verifier first
        console.log('\n1. Deploying Groth16Verifier...');
        const Groth16Verifier = await ethers.getContractFactory('Groth16Verifier');
        const verifier = await Groth16Verifier.deploy(deployer.address);
        await verifier.deployed();
        console.log('Groth16Verifier deployed to:', verifier.address);

        // Deploy MinimalShieldedPool
        console.log('\n2. Deploying MinimalShieldedPool...');
        const MinimalShieldedPool = await ethers.getContractFactory('MinimalShieldedPool');
        
        // Constructor parameters
        const treeHeight = 20; // Support up to 2^20 commitments (1M+)
        const denomination = ethers.utils.parseEther('0.1'); // 0.1 ETH denomination
        
        const shieldedPool = await MinimalShieldedPool.deploy(
            verifier.address,
            treeHeight,
            denomination
        );
        await shieldedPool.deployed();
        console.log('MinimalShieldedPool deployed to:', shieldedPool.address);

        // Initialize ZK proof system
        console.log('\n3. Initializing ZK proof system...');
        const zkSystem = new ZKProofSystem();
        
        // This would compile circuits and generate keys in a real deployment
        // For now, we'll set up the basic structure
        console.log('Setting up circuit compilation environment...');
        
        // Add withdrawal circuit to verifier
        console.log('\n4. Configuring circuits...');
        
        // In a real deployment, you would:
        // 1. Compile the withdraw.circom circuit
        // 2. Generate proving and verification keys
        // 3. Add the verification key to the Groth16Verifier contract
        
        // For demonstration, we'll show the process:
        console.log('Note: In production deployment:');
        console.log('- Compile circuits using: npx circom circuits/withdraw.circom --r1cs --wasm --sym');
        console.log('- Generate keys using powers of tau ceremony');
        console.log('- Add verification key to Groth16Verifier contract');
        
        // Verify deployment
        console.log('\n5. Verifying deployment...');
        
        // Check verifier
        const verifierOwner = await verifier.owner();
        console.log('Verifier owner:', verifierOwner);
        
        // Check shielded pool
        const poolVerifier = await shieldedPool.verifier();
        const poolHeight = await shieldedPool.merkleTreeHeight();
        const poolDenomination = await shieldedPool.denomination();
        
        console.log('Pool verifier:', poolVerifier);
        console.log('Pool tree height:', poolHeight.toString());
        console.log('Pool denomination:', ethers.utils.formatEther(poolDenomination), 'ETH');
        
        // Test basic functionality
        console.log('\n6. Testing basic functionality...');
        
        // Check if pool accepts deposits
        const minDeposit = await shieldedPool.denomination();
        console.log('Minimum deposit:', ethers.utils.formatEther(minDeposit), 'ETH');
        
        // Check tree state
        const currentRoot = await shieldedPool.getCurrentRoot();
        const leafCount = await shieldedPool.getLeafCount();
        
        console.log('Current Merkle root:', currentRoot);
        console.log('Current leaf count:', leafCount.toString());

        // Output deployment summary
        console.log('\n=== DEPLOYMENT SUMMARY ===');
        console.log('Network:', (await ethers.provider.getNetwork()).name);
        console.log('Deployer:', deployer.address);
        console.log('Groth16Verifier:', verifier.address);
        console.log('MinimalShieldedPool:', shieldedPool.address);
        console.log('Tree Height:', treeHeight);
        console.log('Denomination:', ethers.utils.formatEther(denomination), 'ETH');
        console.log('========================');

        // Save deployment info
        const deploymentInfo = {
            network: (await ethers.provider.getNetwork()).name,
            deployer: deployer.address,
            contracts: {
                groth16Verifier: verifier.address,
                minimalShieldedPool: shieldedPool.address
            },
            parameters: {
                treeHeight: treeHeight,
                denomination: denomination.toString(),
                denominationETH: ethers.utils.formatEther(denomination)
            },
            deployedAt: new Date().toISOString()
        };

        // Write deployment info to file
        const fs = require('fs');
        const path = require('path');
        
        const deploymentPath = path.join(__dirname, '../deployments');
        if (!fs.existsSync(deploymentPath)) {
            fs.mkdirSync(deploymentPath, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(deploymentPath, 'shielded-pool-deployment.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        console.log('\nDeployment info saved to deployments/shielded-pool-deployment.json');
        
        return {
            verifier: verifier.address,
            shieldedPool: shieldedPool.address,
            deploymentInfo
        };

    } catch (error) {
        console.error('Deployment failed:', error);
        throw error;
    }
}

/**
 * @dev Test deployment with sample transactions
 */
async function testDeployment(shieldedPoolAddress, verifierAddress) {
    console.log('\nTesting deployed contracts...');
    
    try {
        const [deployer] = await ethers.getSigners();
        
        // Get contract instances
        const shieldedPool = await ethers.getContractAt('MinimalShieldedPool', shieldedPoolAddress);
        const verifier = await ethers.getContractAt('Groth16Verifier', verifierAddress);
        
        // Test 1: Check contract state
        console.log('Test 1: Contract state');
        const isActive = await shieldedPool.isActive();
        const denomination = await shieldedPool.denomination();
        console.log('Pool active:', isActive);
        console.log('Denomination:', ethers.utils.formatEther(denomination), 'ETH');
        
        // Test 2: Try to make a deposit (will fail without proper proof)
        console.log('\nTest 2: Testing deposit interface');
        try {
            // This will fail since we don't have a real proof, but it tests the interface
            const dummyCommitment = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('test'));
            await shieldedPool.estimateGas.deposit(dummyCommitment, {
                value: denomination
            });
            console.log('Deposit interface accessible');
        } catch (error) {
            if (error.message.includes('Invalid commitment')) {
                console.log('Deposit validation working (expected error)');
            } else {
                console.log('Deposit error:', error.message);
            }
        }
        
        // Test 3: Check verifier interface
        console.log('\nTest 3: Testing verifier interface');
        const isWithdrawSupported = await verifier.isCircuitSupported('withdrawal');
        console.log('Withdrawal circuit supported:', isWithdrawSupported);
        
        console.log('\nBasic deployment tests completed successfully!');
        
    } catch (error) {
        console.error('Testing failed:', error);
    }
}

// Main execution
if (require.main === module) {
    main()
        .then((result) => {
            console.log('Deployment completed successfully!');
            return testDeployment(result.shieldedPool, result.verifier);
        })
        .catch((error) => {
            console.error('Deployment error:', error);
            process.exitCode = 1;
        });
}

module.exports = {
    main,
    testDeployment
};
