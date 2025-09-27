/**
 * CYPHER Wallet - React Native Polyfills
 * Essential polyfills for crypto operations and web3 compatibility
 */

// Crypto polyfill - MUST be first
import 'react-native-get-random-values';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

// Process polyfill
import process from 'process';
global.process = global.process || process;

// Stream polyfill
import { Readable } from 'readable-stream';
global.stream = global.stream || { Readable };

// URL polyfill for React Native
global.URL = global.URL || require('whatwg-url').URL;

// TextEncoder/TextDecoder polyfills
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('text-encoding');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (error) {
    // Fallback implementation for TextEncoder/TextDecoder
    global.TextEncoder = class {
      encode(input) {
        return Buffer.from(input, 'utf8');
      }
    };
    
    global.TextDecoder = class {
      decode(input) {
        return Buffer.from(input).toString('utf8');
      }
    };
    console.warn('Using fallback TextEncoder/TextDecoder implementation');
  }
}

// Base64 encoding/decoding polyfills
global.atob = global.atob || function(str) {
  return Buffer.from(str, 'base64').toString('binary');
};

global.btoa = global.btoa || function(str) {
  return Buffer.from(str, 'binary').toString('base64');
};

// Crypto polyfill for secure random number generation
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    getRandomValues: function(array) {
      // This should work with react-native-get-random-values
      if (typeof require !== 'undefined') {
        const getRandomValues = require('react-native-get-random-values').default;
        return getRandomValues(array);
      }
      // Fallback (not cryptographically secure)
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }
  };
}

// Console polyfill improvements
if (typeof global.console === 'undefined') {
  global.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {}
  };
}

console.log('✅ CYPHER Wallet polyfills loaded successfully');
