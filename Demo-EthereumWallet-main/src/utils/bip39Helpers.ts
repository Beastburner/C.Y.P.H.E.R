import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Buffer } from 'buffer';

/**
 * Generate a new BIP39 mnemonic phrase
 */
export function generateMnemonic(strength: number = 128): string {
  try {
    // Use ethers.js for secure random bytes generation in React Native
    const randomBytes = ethers.utils.randomBytes(strength / 8);
    
    // Convert to Buffer format expected by bip39
    const entropyBuffer = Buffer.from(randomBytes);
    
    // Convert entropy to mnemonic using Buffer
    return bip39.entropyToMnemonic(entropyBuffer);
  } catch (error) {
    console.error('Failed to generate mnemonic with ethers, falling back to bip39:', error);
    
    // Fallback to direct bip39 generation
    try {
      return bip39.generateMnemonic(strength);
    } catch (fallbackError) {
      console.error('Fallback mnemonic generation also failed:', fallbackError);
      // Ultimate fallback - use a pre-generated test mnemonic for development
      if (__DEV__) {
        console.warn('Using test mnemonic for development - DO NOT USE IN PRODUCTION');
        return 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      }
      throw new Error(`Failed to generate mnemonic: ${fallbackError}`);
    }
  }
}

/**
 * Validate a BIP39 mnemonic phrase
 */
export function validateMnemonic(mnemonic: string): boolean {
  try {
    return bip39.validateMnemonic(mnemonic.trim());
  } catch (error) {
    return false;
  }
}

/**
 * Convert mnemonic to seed
 */
export function mnemonicToSeed(mnemonic: string, passphrase?: string): Buffer {
  return bip39.mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Convert mnemonic to entropy
 */
export function mnemonicToEntropy(mnemonic: string): string {
  return bip39.mnemonicToEntropy(mnemonic);
}

/**
 * Convert entropy to mnemonic
 */
export function entropyToMnemonic(entropy: string): string {
  return bip39.entropyToMnemonic(entropy);
}

/**
 * Get BIP39 wordlist
 */
export function getWordlist(): string[] {
  return bip39.wordlists.english;
}

/**
 * Shuffle an array of mnemonic words for confirmation
 */
export function shuffleWords(words: string[]): string[] {
  const shuffled = [...words];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Derive HD wallet from mnemonic
 */
export function deriveHDWallet(mnemonic: string): ethers.utils.HDNode {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  return ethers.utils.HDNode.fromMnemonic(mnemonic);
}

/**
 * Derive account at specific path
 */
export function deriveAccountAtPath(
  hdWallet: ethers.utils.HDNode,
  path: string
): ethers.utils.HDNode {
  return hdWallet.derivePath(path);
}

/**
 * Get standard Ethereum derivation path
 */
export function getEthereumPath(accountIndex: number = 0, changeIndex: number = 0): string {
  return `m/44'/60'/${accountIndex}'/0/${changeIndex}`;
}

/**
 * Get Ledger-compatible derivation path
 */
export function getLedgerPath(accountIndex: number = 0): string {
  return `m/44'/60'/${accountIndex}'/0/0`;
}

/**
 * Validate derivation path format
 */
export function validateDerivationPath(path: string): boolean {
  const pathRegex = /^m\/(\d+'?\/)*\d+'?$/;
  return pathRegex.test(path);
}

/**
 * Generate secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  try {
    return ethers.utils.randomBytes(length);
  } catch (error) {
    console.error('Failed to generate random bytes with ethers:', error);
    // Fallback to crypto if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return bytes;
    }
    throw new Error('No secure random number generator available');
  }
}

/**
 * Generate secure random hex string
 */
export function generateRandomHex(length: number): string {
  return ethers.utils.hexlify(generateRandomBytes(length));
}

/**
 * Check if mnemonic words are in correct order
 */
export function verifyMnemonicOrder(
  originalMnemonic: string,
  providedWords: string[]
): boolean {
  const originalWords = originalMnemonic.trim().split(' ');
  return JSON.stringify(originalWords) === JSON.stringify(providedWords);
}

/**
 * Get mnemonic word at specific index
 */
export function getMnemonicWord(mnemonic: string, index: number): string {
  const words = mnemonic.trim().split(' ');
  return words[index] || '';
}

/**
 * Get mnemonic word count
 */
export function getMnemonicWordCount(mnemonic: string): number {
  return mnemonic.trim().split(' ').length;
}

/**
 * Validate mnemonic word against wordlist
 */
export function isValidWord(word: string): boolean {
  const wordlist = getWordlist();
  return wordlist.includes(word.toLowerCase());
}

/**
 * Get suggestions for partial word input
 */
export function getWordSuggestions(partial: string, maxSuggestions: number = 5): string[] {
  if (!partial || partial.length < 2) return [];
  
  const wordlist = getWordlist();
  const lowerPartial = partial.toLowerCase();
  
  return wordlist
    .filter(word => word.startsWith(lowerPartial))
    .slice(0, maxSuggestions);
}

/**
 * Create test mnemonic for development (DO NOT USE IN PRODUCTION)
 */
export function createTestMnemonic(): string {
  // Only for development/testing
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test mnemonic should not be used in production');
  }
  
  return 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
}

/**
 * Validate mnemonic strength
 */
export function getMnemonicStrength(mnemonic: string): number {
  const wordCount = getMnemonicWordCount(mnemonic);
  
  switch (wordCount) {
    case 12:
      return 128; // 128 bits entropy
    case 15:
      return 160; // 160 bits entropy
    case 18:
      return 192; // 192 bits entropy
    case 21:
      return 224; // 224 bits entropy
    case 24:
      return 256; // 256 bits entropy
    default:
      return 0; // Invalid
  }
}

/**
 * Check if mnemonic has valid checksum
 */
export function hasValidChecksum(mnemonic: string): boolean {
  try {
    const entropy = mnemonicToEntropy(mnemonic);
    const reconstructed = entropyToMnemonic(entropy);
    return reconstructed === mnemonic.trim();
  } catch (error) {
    return false;
  }
}
