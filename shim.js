/**
 * CYPHER Wallet - React Native Polyfills
 * Essential polyfills for crypto operations and web3 compatibility
 */

console.log('🔧 Starting CYPHER polyfills...');

try {
  // Crypto polyfill - MUST be first
  require('react-native-get-random-values');
  console.log('✅ react-native-get-random-values loaded');
} catch (error) {
  console.error('❌ Failed to load react-native-get-random-values:', error);
}

try {
  // Buffer polyfill
  const { Buffer } = require('buffer');
  global.Buffer = global.Buffer || Buffer;
  console.log('✅ Buffer polyfill loaded');
} catch (error) {
  console.error('❌ Failed to load Buffer polyfill:', error);
}

try {
  // Process polyfill
  const process = require('process');
  global.process = global.process || process;
  console.log('✅ Process polyfill loaded');
} catch (error) {
  console.error('❌ Failed to load process polyfill:', error);
}

try {
  // Stream polyfill
  const { Readable } = require('readable-stream');
  global.stream = global.stream || { Readable };
  console.log('✅ Stream polyfill loaded');
} catch (error) {
  console.error('❌ Failed to load readable-stream polyfill:', error);
}

try {
  // URL polyfill for React Native
  const { URL } = require('whatwg-url');
  global.URL = global.URL || URL;
  console.log('✅ URL polyfill loaded');
} catch (error) {
  // Fallback if whatwg-url is not available
  console.warn('⚠️ whatwg-url not available, URL polyfill skipped');
}

// TextEncoder/TextDecoder polyfills - Multiple fallback strategies
if (typeof global.TextEncoder === 'undefined') {
  console.log('🔧 Adding TextEncoder/TextDecoder polyfills...');
  
  try {
    // Try text-encoding-polyfill first
    const textEncodingPolyfill = require('text-encoding-polyfill');
    if (textEncodingPolyfill.TextEncoder) {
      global.TextEncoder = textEncodingPolyfill.TextEncoder;
      global.TextDecoder = textEncodingPolyfill.TextDecoder;
      console.log('✅ Using text-encoding-polyfill for TextEncoder/TextDecoder');
    } else {
      throw new Error('text-encoding-polyfill not available');
    }
  } catch (error) {
    try {
      // Fallback to text-encoding
      const { TextEncoder, TextDecoder } = require('text-encoding');
      global.TextEncoder = TextEncoder;
      global.TextDecoder = TextDecoder;
      console.log('✅ Using text-encoding for TextEncoder/TextDecoder');
    } catch (error2) {
      // Ultimate fallback - basic implementation
      global.TextEncoder = class TextEncoder {
        constructor(encoding = 'utf-8') {
          this.encoding = encoding;
        }
        
        encode(input = '') {
          if (typeof input !== 'string') {
            input = String(input);
          }
          return Buffer.from(input, 'utf8');
        }
      };
      
      global.TextDecoder = class TextDecoder {
        constructor(encoding = 'utf-8', options = {}) {
          this.encoding = encoding;
          this.fatal = options.fatal || false;
        }
        
        decode(input, options = {}) {
          if (!input) return '';
          const stream = options.stream || false;
          
          try {
            if (input instanceof ArrayBuffer) {
              return Buffer.from(input).toString('utf8');
            } else if (input instanceof Uint8Array) {
              return Buffer.from(input).toString('utf8');
            } else if (Buffer.isBuffer(input)) {
              return input.toString('utf8');
            }
            return String(input);
          } catch (error) {
            if (this.fatal) {
              throw new TypeError('Invalid character in decode operation');
            }
            return '';
          }
        }
      };
      
      console.warn('⚠️ Using fallback TextEncoder/TextDecoder implementation');
    }
  }
} else {
  console.log('✅ TextEncoder/TextDecoder already available');
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
