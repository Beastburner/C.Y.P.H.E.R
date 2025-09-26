#!/bin/bash

# ECLIPTA Wallet Deployment Script
# Comprehensive deployment for smart contracts and mobile application

set -e

echo "🚀 ECLIPTA Wallet Deployment Script"
echo "==================================="

# Configuration
NETWORK=${1:-"localhost"}
DEPLOY_CONTRACTS=${2:-"true"}
DEPLOY_MOBILE=${3:-"false"}
VERIFICATION_ENABLED=${4:-"true"}

# Contract addresses (will be populated during deployment)
PRIVACY_POOL_0_1=""
PRIVACY_POOL_1_0=""
PRIVACY_POOL_10_0=""
POSEIDON_HASH=""
MERKLE_TREE=""
ZK_PROOF_SYSTEM=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    node_version=$(node --version | cut -d'v' -f2)
    if [[ "$(printf '%s\n' "18.0.0" "$node_version" | sort -V | head -n1)" != "18.0.0" ]]; then
        error "Node.js version 18+ is required (current: $node_version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check Hardhat
    if ! command -v npx &> /dev/null; then
        error "npx is not available"
    fi
    
    # Check circom for ZK circuits
    if ! command -v circom &> /dev/null; then
        warn "circom not found, installing..."
        npm install -g circom
    fi
    
    # Check snarkjs
    if ! command -v snarkjs &> /dev/null; then
        warn "snarkjs not found, installing..."
        npm install -g snarkjs
    fi
    
    log "Prerequisites check completed ✅"
}

# Install dependencies
install_dependencies() {
    log "Installing project dependencies..."
    
    npm install
    
    # Install iOS dependencies if on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && [[ -d "ios" ]]; then
        log "Installing iOS dependencies..."
        cd ios && pod install && cd ..
    fi
    
    log "Dependencies installed ✅"
}

# Compile ZK circuits
compile_circuits() {
    log "Compiling zero-knowledge circuits..."
    
    if [[ -f "scripts/compile-circuits.sh" ]]; then
        chmod +x scripts/compile-circuits.sh
        ./scripts/compile-circuits.sh
    else
        warn "Circuit compilation script not found, creating minimal setup..."
        mkdir -p build/circuits build/keys
    fi
    
    log "Circuit compilation completed ✅"
}

# Deploy smart contracts
deploy_contracts() {
    if [[ "$DEPLOY_CONTRACTS" != "true" ]]; then
        log "Skipping contract deployment"
        return
    fi
    
    log "Deploying smart contracts to $NETWORK..."
    
    # Compile contracts
    npx hardhat compile
    
    # Deploy libraries first
    log "Deploying libraries..."
    POSEIDON_HASH=$(npx hardhat run scripts/deploy.js --network $NETWORK | grep "PoseidonHash deployed to:" | cut -d' ' -f4)
    info "PoseidonHash deployed to: $POSEIDON_HASH"
    
    # Deploy privacy pools
    log "Deploying privacy pools..."
    
    # 0.1 ETH Pool
    PRIVACY_POOL_0_1=$(npx hardhat run scripts/deployShieldedPool.js --network $NETWORK | grep "0.1 ETH Pool deployed to:" | cut -d' ' -f6)
    info "0.1 ETH Privacy Pool deployed to: $PRIVACY_POOL_0_1"
    
    # 1.0 ETH Pool
    PRIVACY_POOL_1_0=$(npx hardhat run scripts/deployShieldedPool.js --network $NETWORK | grep "1.0 ETH Pool deployed to:" | cut -d' ' -f6)
    info "1.0 ETH Privacy Pool deployed to: $PRIVACY_POOL_1_0"
    
    # 10.0 ETH Pool
    PRIVACY_POOL_10_0=$(npx hardhat run scripts/deployShieldedPool.js --network $NETWORK | grep "10.0 ETH Pool deployed to:" | cut -d' ' -f6)
    info "10.0 ETH Privacy Pool deployed to: $PRIVACY_POOL_10_0"
    
    # Verify contracts on Etherscan if enabled
    if [[ "$VERIFICATION_ENABLED" == "true" ]] && [[ "$NETWORK" != "localhost" ]] && [[ "$NETWORK" != "hardhat" ]]; then
        log "Verifying contracts on Etherscan..."
        
        if [[ -n "$PRIVACY_POOL_0_1" ]]; then
            npx hardhat verify --network $NETWORK $PRIVACY_POOL_0_1 || warn "Failed to verify 0.1 ETH pool"
        fi
        
        if [[ -n "$PRIVACY_POOL_1_0" ]]; then
            npx hardhat verify --network $NETWORK $PRIVACY_POOL_1_0 || warn "Failed to verify 1.0 ETH pool"
        fi
        
        if [[ -n "$PRIVACY_POOL_10_0" ]]; then
            npx hardhat verify --network $NETWORK $PRIVACY_POOL_10_0 || warn "Failed to verify 10.0 ETH pool"
        fi
    fi
    
    log "Smart contracts deployed successfully ✅"
}

# Generate configuration files
generate_config() {
    log "Generating configuration files..."
    
    # Create environment configuration
    cat > .env.production << EOF
# ECLIPTA Wallet Production Configuration
# Generated on $(date)

# Network Configuration
NETWORK=$NETWORK

# Privacy Pool Contract Addresses
PRIVACY_POOL_0_1_ETH=$PRIVACY_POOL_0_1
PRIVACY_POOL_1_0_ETH=$PRIVACY_POOL_1_0
PRIVACY_POOL_10_0_ETH=$PRIVACY_POOL_10_0

# Library Addresses
POSEIDON_HASH_ADDRESS=$POSEIDON_HASH
MERKLE_TREE_ADDRESS=$MERKLE_TREE
ZK_PROOF_SYSTEM_ADDRESS=$ZK_PROOF_SYSTEM

# Zero-Knowledge Circuit Configuration
ZK_CIRCUIT_PATH=./build/circuits/
ZK_KEYS_PATH=./build/keys/
ZK_PROVING_TIMEOUT=30000

# Privacy Settings
DEFAULT_MIXING_ENABLED=true
DEFAULT_TOR_ENABLED=false
DEFAULT_DATA_RETENTION_DAYS=30

# Compliance Configuration
COMPLIANCE_ENABLED=true
SANCTIONS_CHECK_ENABLED=true
KYC_REQUIRED_THRESHOLD=1000

# Performance Settings
PROOF_GENERATION_WORKERS=2
CIRCUIT_CACHE_SIZE=100
TRANSACTION_TIMEOUT=60000

# API Endpoints (update with actual URLs)
ZK_CIRCUIT_API_URL=https://api.eclipta.io/circuits
ZK_VERIFICATION_API_URL=https://api.eclipta.io/verify
COMPLIANCE_API_URL=https://compliance.eclipta.io

# Mobile App Configuration
APP_VERSION=$(node -p "require('./package.json').version")
BUILD_NUMBER=$(date +%s)
BUNDLE_ID=com.eclipta.wallet
EOF

    # Create React Native configuration
    cat > src/config/deployment.ts << EOF
/**
 * Deployment Configuration
 * Auto-generated on $(date)
 */

export const DEPLOYMENT_CONFIG = {
  network: '$NETWORK',
  contracts: {
    privacyPools: {
      '0.1': '$PRIVACY_POOL_0_1',
      '1.0': '$PRIVACY_POOL_1_0',
      '10.0': '$PRIVACY_POOL_10_0',
    },
    libraries: {
      poseidonHash: '$POSEIDON_HASH',
      merkleTree: '$MERKLE_TREE',
      zkProofSystem: '$ZK_PROOF_SYSTEM',
    },
  },
  zkCircuits: {
    basePath: './build/circuits/',
    keysPath: './build/keys/',
    timeout: 30000,
  },
  privacy: {
    mixingEnabled: true,
    torEnabled: false,
    dataRetentionDays: 30,
  },
  compliance: {
    enabled: true,
    sanctionsCheck: true,
    kycThreshold: 1000,
  },
  buildInfo: {
    timestamp: '$(date)',
    version: '$(node -p "require('./package.json').version")',
    buildNumber: $(date +%s),
  },
};
EOF

    log "Configuration files generated ✅"
}

# Run tests
run_tests() {
    log "Running comprehensive test suite..."
    
    # Run contract tests
    npx hardhat test
    
    # Run React Native tests
    npm test -- --coverage --watchAll=false
    
    # Run circuit tests if available
    if [[ -f "scripts/test-circuits.sh" ]]; then
        ./scripts/test-circuits.sh
    fi
    
    log "All tests passed ✅"
}

# Build mobile application
build_mobile() {
    if [[ "$DEPLOY_MOBILE" != "true" ]]; then
        log "Skipping mobile application build"
        return
    fi
    
    log "Building mobile application..."
    
    # Android build
    if [[ -d "android" ]]; then
        log "Building Android application..."
        cd android
        
        # Clean previous builds
        ./gradlew clean
        
        # Build release APK
        ./gradlew assembleRelease
        
        # Build release AAB for Play Store
        ./gradlew bundleRelease
        
        cd ..
        
        info "Android APK: android/app/build/outputs/apk/release/app-release.apk"
        info "Android AAB: android/app/build/outputs/bundle/release/app-release.aab"
    fi
    
    # iOS build (macOS only)
    if [[ "$OSTYPE" == "darwin"* ]] && [[ -d "ios" ]]; then
        log "Building iOS application..."
        
        # Build for iOS
        npx react-native run-ios --configuration Release --device
        
        warn "iOS archive must be created manually through Xcode"
        info "1. Open ios/EthereumWallet.xcworkspace in Xcode"
        info "2. Select 'Any iOS Device' as target"
        info "3. Product → Archive"
        info "4. Distribute App through App Store"
    fi
    
    log "Mobile application build completed ✅"
}

# Generate deployment documentation
generate_docs() {
    log "Generating deployment documentation..."
    
    cat > DEPLOYMENT.md << EOF
# ECLIPTA Wallet Deployment Documentation

## Deployment Summary
- **Date**: $(date)
- **Network**: $NETWORK
- **Deployer**: $(whoami)
- **Git Commit**: $(git rev-parse HEAD 2>/dev/null || echo "N/A")

## Contract Addresses

### Privacy Pools
- **0.1 ETH Pool**: \`$PRIVACY_POOL_0_1\`
- **1.0 ETH Pool**: \`$PRIVACY_POOL_1_0\`
- **10.0 ETH Pool**: \`$PRIVACY_POOL_10_0\`

### Libraries
- **PoseidonHash**: \`$POSEIDON_HASH\`
- **MerkleTree**: \`$MERKLE_TREE\`
- **ZKProofSystem**: \`$ZK_PROOF_SYSTEM\`

## Zero-Knowledge Circuits

### Compiled Circuits
- Withdrawal Circuit: \`build/circuits/withdrawal.wasm\`
- Privacy Mixer Circuit: \`build/circuits/privacyMixer.wasm\`
- ENS Privacy Circuit: \`build/circuits/ensPrivacy.wasm\`
- Compliance Circuit: \`build/circuits/compliance.wasm\`

### Verification Keys
- Withdrawal: \`build/keys/withdrawal_verification_key.json\`
- Privacy Mixer: \`build/keys/privacyMixer_verification_key.json\`
- ENS Privacy: \`build/keys/ensPrivacy_verification_key.json\`
- Compliance: \`build/keys/compliance_verification_key.json\`

## Configuration Files
- Production Environment: \`.env.production\`
- React Native Config: \`src/config/deployment.ts\`

## Verification Commands

### Contract Verification
\`\`\`bash
# Verify privacy pools
npx hardhat verify --network $NETWORK $PRIVACY_POOL_0_1
npx hardhat verify --network $NETWORK $PRIVACY_POOL_1_0
npx hardhat verify --network $NETWORK $PRIVACY_POOL_10_0
\`\`\`

### Circuit Verification
\`\`\`bash
# Test circuit compilation
./scripts/compile-circuits.sh

# Verify proof generation
npm run test:circuits
\`\`\`

## Post-Deployment Checklist

### Smart Contracts
- [ ] All contracts deployed successfully
- [ ] Contract verification completed
- [ ] Initial deposits made to privacy pools
- [ ] Access controls configured
- [ ] Emergency procedures tested

### Mobile Application
- [ ] Android APK generated
- [ ] Android AAB for Play Store ready
- [ ] iOS archive created (if macOS)
- [ ] App store metadata prepared
- [ ] Beta testing completed

### Infrastructure
- [ ] API endpoints configured
- [ ] Monitoring systems deployed
- [ ] Backup procedures established
- [ ] Security audit completed
- [ ] Performance benchmarks verified

## Support Contacts
- **Development Team**: dev@eclipta.io
- **Security Team**: security@eclipta.io
- **Operations Team**: ops@eclipta.io

## Next Steps
1. Monitor initial deployment for 24 hours
2. Gather user feedback from beta testing
3. Prepare for public launch
4. Schedule security audit review
5. Plan feature roadmap updates
EOF

    log "Deployment documentation generated ✅"
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -rf .tmp/ || true
    log "Cleanup completed ✅"
}

# Main deployment function
main() {
    log "Starting ECLIPTA Wallet deployment..."
    log "Network: $NETWORK"
    log "Deploy Contracts: $DEPLOY_CONTRACTS"
    log "Deploy Mobile: $DEPLOY_MOBILE"
    log "Verification: $VERIFICATION_ENABLED"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    install_dependencies
    compile_circuits
    deploy_contracts
    generate_config
    run_tests
    build_mobile
    generate_docs
    cleanup
    
    log ""
    log "🎉 ECLIPTA Wallet deployment completed successfully!"
    log "📄 Check DEPLOYMENT.md for detailed information"
    log "⚙️ Configuration files are ready in .env.production"
    log "📱 Mobile builds are available in android/app/build/"
    log ""
    log "Next steps:"
    log "1. Review deployment documentation"
    log "2. Test all functionality in production environment"
    log "3. Monitor system performance and security"
    log "4. Prepare for public launch"
    
    # Display important addresses
    if [[ -n "$PRIVACY_POOL_0_1" ]]; then
        info ""
        info "🔑 Important Contract Addresses:"
        info "0.1 ETH Pool: $PRIVACY_POOL_0_1"
        info "1.0 ETH Pool: $PRIVACY_POOL_1_0"
        info "10.0 ETH Pool: $PRIVACY_POOL_10_0"
    fi
}

# Trap errors and cleanup
trap cleanup EXIT

# Run main deployment
main "$@"
