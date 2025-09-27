/**
 * Deploy Privacy Contracts to Sepolia Testnet
 * This script deploys the privacy pool contracts and updates the service with real addresses
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🚀 Starting privacy contracts deployment to Sepolia...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deploying with account: ${deployer.address}`);
  
  // Check balance
  const balance = await deployer.getBalance();
  console.log(`💰 Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.lt(ethers.utils.parseEther('0.1'))) {
    console.error('❌ Insufficient balance for deployment. Need at least 0.1 ETH.');
    process.exit(1);
  }

  try {
    // 1. Deploy Verifier Contract
    console.log('\n📝 Deploying Groth16Verifier...');
    const Verifier = await ethers.getContractFactory('Groth16Verifier');
    const verifier = await Verifier.deploy();
    await verifier.deployed();
    console.log(`✅ Groth16Verifier deployed to: ${verifier.address}`);

    // 2. Deploy Poseidon Hasher (if available)
    let hasherAddress = ethers.constants.AddressZero;
    try {
      console.log('\n📝 Deploying PoseidonHash library...');
      const PoseidonHash = await ethers.getContractFactory('PoseidonHash');
      const poseidonHash = await PoseidonHash.deploy();
      await poseidonHash.deployed();
      hasherAddress = poseidonHash.address;
      console.log(`✅ PoseidonHash deployed to: ${hasherAddress}`);
    } catch (error) {
      console.warn('⚠️ PoseidonHash not available, using keccak256');
    }

    // 3. Deploy Privacy Pool Contract
    console.log('\n📝 Deploying MinimalShieldedPool...');
    
    const denomination = ethers.utils.parseEther('0.1'); // 0.1 ETH
    const merkleTreeHeight = 20; // 2^20 = ~1M deposits capacity
    
    let ShieldedPool;
    if (hasherAddress !== ethers.constants.AddressZero) {
      // Deploy with Poseidon hasher
      ShieldedPool = await ethers.getContractFactory('MinimalShieldedPool', {
        libraries: {
          PoseidonHash: hasherAddress
        }
      });
    } else {
      // Deploy without libraries (using keccak256)
      ShieldedPool = await ethers.getContractFactory('MinimalShieldedPool');
    }
    
    const shieldedPool = await ShieldedPool.deploy(
      verifier.address,
      denomination,
      merkleTreeHeight,
      hasherAddress === ethers.constants.AddressZero ? ethers.constants.AddressZero : hasherAddress
    );
    await shieldedPool.deployed();
    console.log(`✅ MinimalShieldedPool deployed to: ${shieldedPool.address}`);

    // 4. Deploy Test Token (optional)
    let testTokenAddress = ethers.constants.AddressZero;
    try {
      console.log('\n📝 Deploying TestToken...');
      const TestToken = await ethers.getContractFactory('TestToken');
      const testToken = await TestToken.deploy();
      await testToken.deployed();
      testTokenAddress = testToken.address;
      console.log(`✅ TestToken deployed to: ${testTokenAddress}`);
    } catch (error) {
      console.warn('⚠️ TestToken not available');
    }

    // 5. Verify contracts are working
    console.log('\n🔍 Verifying contract deployments...');
    
    try {
      const poolDenomination = await shieldedPool.denomination();
      console.log(`✅ Privacy pool denomination: ${ethers.utils.formatEther(poolDenomination)} ETH`);
      
      const poolLevels = await shieldedPool.levels();
      console.log(`✅ Merkle tree levels: ${poolLevels}`);
      
      const verifierAddress = await shieldedPool.verifier();
      console.log(`✅ Verifier address: ${verifierAddress}`);
    } catch (error) {
      console.error('❌ Contract verification failed:', error.message);
    }

    // 6. Save deployment info
    const deploymentInfo = {
      network: 'sepolia',
      chainId: 11155111,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        PRIVACY_POOL: shieldedPool.address,
        VERIFIER: verifier.address,
        HASHER: hasherAddress,
        TOKEN: testTokenAddress
      },
      configuration: {
        denomination: ethers.utils.formatEther(denomination),
        merkleTreeHeight: merkleTreeHeight,
        anonymitySet: Math.pow(2, merkleTreeHeight)
      },
      gasUsed: {
        verifier: (await verifier.deployTransaction.wait()).gasUsed.toString(),
        shieldedPool: (await shieldedPool.deployTransaction.wait()).gasUsed.toString()
      }
    };

    // Save to JSON file
    const deploymentPath = path.join(__dirname, '../deployment-sepolia.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}`);

    // 7. Update RealPrivacyService with new addresses
    console.log('\n🔄 Updating RealPrivacyService with deployed addresses...');
    
    const servicePath = path.join(__dirname, '../src/services/RealPrivacyService.ts');
    if (fs.existsSync(servicePath)) {
      let serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      // Update contract addresses
      serviceContent = serviceContent.replace(
        /PRIVACY_POOL: '[^']*'/,
        `PRIVACY_POOL: '${shieldedPool.address}'`
      );
      serviceContent = serviceContent.replace(
        /VERIFIER: '[^']*'/,
        `VERIFIER: '${verifier.address}'`
      );
      serviceContent = serviceContent.replace(
        /TOKEN: '[^']*'/,
        `TOKEN: '${testTokenAddress}'`
      );
      
      fs.writeFileSync(servicePath, serviceContent);
      console.log('✅ RealPrivacyService updated with deployed addresses');
    }

    // 8. Print summary
    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Contract Addresses:');
    console.log(`   Privacy Pool: ${shieldedPool.address}`);
    console.log(`   Verifier:     ${verifier.address}`);
    console.log(`   Hasher:       ${hasherAddress || 'N/A'}`);
    console.log(`   Test Token:   ${testTokenAddress || 'N/A'}`);
    
    console.log('\n⚠️  IMPORTANT: Save these addresses for your records!');
    console.log('\n🔗 Verify contracts on Etherscan:');
    console.log(`   https://sepolia.etherscan.io/address/${shieldedPool.address}`);
    console.log(`   https://sepolia.etherscan.io/address/${verifier.address}`);

    console.log('\n💡 Next steps:');
    console.log('1. Fund the privacy pool with initial liquidity');
    console.log('2. Test deposit and withdrawal functions');
    console.log('3. Monitor contract events and gas usage');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script execution failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
