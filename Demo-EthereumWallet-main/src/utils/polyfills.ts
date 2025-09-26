// React Native polyfills for crypto and other APIs
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import process from 'process';
import { Buffer } from 'buffer';

// Polyfills for React Native environment
(global as any).process = process;

if (typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

// TextEncoder/TextDecoder polyfill for React Native
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = class TextEncoder {
    encode(str: string): Uint8Array {
      const buffer = Buffer.from(str, 'utf8');
      return new Uint8Array(buffer);
    }
  };
}

if (typeof (global as any).TextDecoder === 'undefined') {
  (global as any).TextDecoder = class TextDecoder {
    private encoding: string;
    
    constructor(encoding: string = 'utf-8') {
      this.encoding = encoding;
    }
    
    decode(buffer: Uint8Array | ArrayBuffer): string {
      if (buffer instanceof ArrayBuffer) {
        buffer = new Uint8Array(buffer);
      }
      return Buffer.from(buffer).toString(this.encoding as BufferEncoding);
    }
  };
}

// Console is available in React Native
if (typeof console === 'undefined') {
  (global as any).console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
  };
}

// setTimeout is available in React Native
if (typeof setTimeout === 'undefined') {
  (global as any).setTimeout = (callback: () => void, delay: number) => {
    return requestAnimationFrame(callback);
  };
}

export {};
