const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      'crypto': 'crypto-browserify',
      'stream': 'readable-stream',
      'buffer': 'buffer',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
