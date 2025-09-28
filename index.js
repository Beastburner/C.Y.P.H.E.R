/**
 * CYPHER Wallet Entry Point - CommonJS version
 * @format
 */

// Import minimal polyfills FIRST
require('./minimal-shim');

// Use CommonJS require instead of ES6 imports to avoid bundling issues
const { AppRegistry } = require('react-native');
const { name: appName } = require('./app.json');

// Require App after polyfills
const App = require('./App').default || require('./App');

// Register app
AppRegistry.registerComponent(appName, () => App);

console.log('✅ CYPHER Wallet registered with comprehensive polyfills from shim.js');
