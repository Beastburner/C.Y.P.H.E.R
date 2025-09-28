/**
 * Minimal TextEncoder Polyfill for React Native
 */

console.log('🔧 Loading minimal TextEncoder polyfill...');

// Essential crypto polyfill first
require('react-native-get-random-values');

// Buffer polyfill
if (!global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

// TextEncoder/TextDecoder polyfill - Simple implementation
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    constructor() {
      this.encoding = 'utf-8';
    }
    
    encode(input) {
      if (input === null || input === undefined) {
        input = '';
      }
      return new Uint8Array(Buffer.from(String(input), 'utf8'));
    }
  };
  
  global.TextDecoder = class TextDecoder {
    constructor(encoding = 'utf-8') {
      this.encoding = encoding;
    }
    
    decode(input) {
      if (!input) {
        return '';
      }
      
      if (input instanceof Uint8Array) {
        return Buffer.from(input).toString('utf8');
      }
      
      if (input instanceof ArrayBuffer) {
        return Buffer.from(input).toString('utf8');
      }
      
      return Buffer.from(input).toString('utf8');
    }
  };
  
  console.log('✅ TextEncoder/TextDecoder polyfill loaded');
}

// Basic polyfills for web APIs
global.atob = global.atob || function(str) {
  return Buffer.from(str, 'base64').toString('binary');
};

global.btoa = global.btoa || function(str) {
  return Buffer.from(str, 'binary').toString('base64');
};

console.log('✅ Minimal polyfills loaded successfully');
