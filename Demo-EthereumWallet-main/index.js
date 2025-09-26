/**
 * CYPHER Wallet Entry Point - CommonJS version
 * @format
 */

// Crypto polyfill MUST be first
require('react-native-get-random-values');

// Use CommonJS require instead of ES6 imports to avoid bundling issues
const { AppRegistry } = require('react-native');
const { name: appName } = require('./app.json');

// Simple polyfills first
if (!global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

if (!global.process) {
  global.process = require('process');
}

// Base64 polyfills
global.atob = global.atob || function(str) {
  return global.Buffer.from(str, 'base64').toString('binary');
};

global.btoa = global.btoa || function(str) {
  return global.Buffer.from(str, 'binary').toString('base64');
};

// Require App after polyfills
const App = require('./App').default || require('./App');

// Register app
AppRegistry.registerComponent(appName, () => App);

console.log('✅ CYPHER Wallet registered with CommonJS and crypto polyfills');
