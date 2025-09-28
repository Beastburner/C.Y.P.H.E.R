#!/bin/bash

# CYPHER WALLET - CONTRACT DEPLOYMENT HELPER
# This script helps deploy contracts to different networks

set -e

echo "🚀 CYPHER Privacy Pool Deployment Helper"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "hardhat.config.js" ]; then
    echo "❌ Error: hardhat.config.js not found. Please run this script from the project root."
    exit 1
fi

# Function to deploy to localhost
deploy_localhost() {
    echo "🔧 Deploying to localhost (Hardhat Network)..."
    echo ""
    
    # Check if node is running
    if ! curl -s http://127.0.0.1:8545 > /dev/null 2>&1; then
        echo "❌ Local Hardhat node is not running!"
        echo "   Please start it first with: npx hardhat node"
        echo ""
        echo "   Or start both node and deploy:"
        echo "   Terminal 1: npx hardhat node"
        echo "   Terminal 2: npm run deploy:localhost"
        exit 1
    fi
    
    echo "✅ Local node is running"
    echo "📦 Deploying MinimalShieldedPool contract..."
    
    npx hardhat run scripts/deploy-minimal-shielded-pool.js --network localhost
    
    echo ""
    echo "✅ Deployment complete!"
    echo "💡 The contract address has been saved to deployments/localhost.json"
    echo "📱 Your app will automatically use the deployed contract on localhost"
}

# Function to deploy to Sepolia
deploy_sepolia() {
    echo "🌐 Deploying to Sepolia Testnet..."
    echo ""
    
    # Check if environment variables are set
    if [ -z "$SEPOLIA_PRIVATE_KEY" ] || [ -z "$INFURA_PROJECT_ID" ]; then
        echo "❌ Missing environment variables!"
        echo "   Please set:"
        echo "   export SEPOLIA_PRIVATE_KEY=your_private_key_here"
        echo "   export INFURA_PROJECT_ID=your_infura_project_id"
        echo ""
        echo "   Or create a .env file with:"
        echo "   SEPOLIA_PRIVATE_KEY=your_private_key_here"
        echo "   INFURA_PROJECT_ID=your_infura_project_id"
        exit 1
    fi
    
    echo "✅ Environment variables found"
    echo "📦 Deploying MinimalShieldedPool to Sepolia..."
    
    npx hardhat run scripts/deploy-minimal-shielded-pool.js --network sepolia
    
    echo ""
    echo "✅ Deployment complete!"
    echo "💡 Update src/config/contracts.ts with the new Sepolia address"
}

# Main menu
echo "Select deployment target:"
echo "1) Localhost (Hardhat Network) - Recommended for development"
echo "2) Sepolia Testnet - Requires testnet ETH"
echo "3) Check deployment status"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        deploy_localhost
        ;;
    2)
        deploy_sepolia
        ;;
    3)
        echo ""
        echo "📊 Checking deployment status..."
        echo ""
        
        # Check localhost
        if [ -f "deployments/localhost.json" ]; then
            echo "✅ Localhost deployments found:"
            cat deployments/localhost.json | head -10
        else
            echo "❌ No localhost deployments found"
        fi
        
        echo ""
        echo "🔍 Contract addresses in config:"
        grep -A 10 -B 2 "MinimalShieldedPool" src/config/contracts.ts || echo "❌ Config file not found"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Done! Your privacy pools are ready to use."
echo "📱 Restart your app to see the changes."
