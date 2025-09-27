#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting professional cleanup of C.Y.P.H.E.R wallet...\n');

// Files to remove from root directory
const filesToRemove = [
  // Emergency recovery and cleanup scripts
  'comprehensive-recovery.js',
  'emergency-recovery.js',
  'fix-autolock-jsdoc.js',
  'fix-jsdoc.js',
  'fix-unclosed-jsdoc.js',
  
  // Backup files
  'metro.config.js.backup',
  'react-native.config.js.backup',
  
  // Temporary and summary files
  'CLEANUP_SUMMARY.md',
  'TRANSACTION_FIX_GUIDE.md',
  'TYPESCRIPT_FIXES.md',
  'PRIVACY_IMPLEMENTATION.md',
  'PRIVACY_INTEGRATION.md',
  
  // Extra hardhat configs (keep only the main one)
  'hardhat.config.simple.js',
  'hardhat.config.minimal.cjs',
  'hardhat.config.cjs',
  
  // Extra metro config
  'metro.config.cjs',
];

// Remove unwanted files
filesToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.log(`❌ Failed to remove ${file}: ${error.message}`);
    }
  }
});

// Clean up scripts directory - remove deployment test files but keep essential ones
const scriptsToRemove = [
  'scripts/deploy-mock.js',
  'scripts/deploy-mock.cjs',
  'scripts/deploy-direct.js',
  'scripts/deploy-simple.js',
  'scripts/deployShieldedPool.js', // duplicate
];

scriptsToRemove.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${file}`);
    } catch (error) {
      console.log(`❌ Failed to remove ${file}: ${error.message}`);
    }
  }
});

console.log('\n🎉 Professional cleanup completed!');
console.log('\n📁 Remaining professional structure:');
console.log('├── 📱 src/ (main application code)');
console.log('├── 📱 android/ & ios/ (mobile platforms)');
console.log('├── ⚡ contracts/ (smart contracts)');
console.log('├── 🔒 circuits/ (zero-knowledge circuits)');
console.log('├── 📝 scripts/ (deployment scripts)');
console.log('├── 🧪 __tests__/ (test suite)');
console.log('├── 📚 docs/ (documentation)');
console.log('├── 🖼️ assets/ (images and resources)');
console.log('└── ⚙️ Configuration files');
