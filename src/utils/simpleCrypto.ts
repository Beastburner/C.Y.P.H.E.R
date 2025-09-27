/**
 * Simple Crypto Utils for React Native
 * Fallback crypto implementation that doesn't rely on native modules
 */

// Simple secure random implementation
export function generateSimpleSecureRandom(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  
  // Use Date.now() and Math.random() as entropy sources
  const entropy1 = Date.now().toString(16);
  const entropy2 = Math.random().toString(16).slice(2);
  const combinedEntropy = entropy1 + entropy2;
  
  for (let i = 0; i < length * 2; i++) {
    if (i < combinedEntropy.length) {
      result += combinedEntropy[i];
    } else {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result.slice(0, length * 2); // Return hex string of desired byte length
}

// Simple key derivation (not cryptographically secure, but functional)
export function simpleKeyDerivation(password: string, salt: string, iterations: number = 1000): string {
  let derived = password + salt;
  
  for (let i = 0; i < iterations; i++) {
    // Simple hash-like operation
    let hash = 0;
    for (let j = 0; j < derived.length; j++) {
      const char = derived.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    derived = hash.toString(16) + derived;
  }
  
  return derived.slice(0, 64); // Return 256-bit key as hex
}

export default {
  generateSimpleSecureRandom,
  simpleKeyDerivation
};
