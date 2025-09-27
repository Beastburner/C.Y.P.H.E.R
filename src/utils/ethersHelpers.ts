/**
 * Ethers.js Helper Utilities
 * Common utilities for working with ethers.js BigNumber and unit conversions
 */

import { ethers } from 'ethers';

/**
 * Safely convert ETH amount to Wei
 * Handles decimal strings and ensures proper BigNumber conversion
 */
export function parseEtherValue(value: string | number): string {
  try {
    // If it's already a string and looks like wei (no decimal), return as-is
    if (typeof value === 'string' && !value.includes('.') && ethers.BigNumber.from(value).gt(ethers.utils.parseEther('1000'))) {
      return value;
    }
    
    // Convert to string for consistent handling
    const valueStr = typeof value === 'number' ? value.toString() : value;
    
    // Handle empty or zero values
    if (!valueStr || valueStr === '0' || valueStr === '') {
      return '0';
    }
    
    // If value is already in wei format (very large number), return as-is
    if (!valueStr.includes('.') && valueStr.length > 10) {
      try {
        ethers.BigNumber.from(valueStr);
        return valueStr;
      } catch {
        // If it fails, treat as ether
      }
    }
    
    // Parse as ether amount
    const parsed = ethers.utils.parseEther(valueStr);
    return parsed.toString();
  } catch (error) {
    console.error('Error parsing ether value:', error, 'Value:', value);
    throw new Error(`Invalid ether value: ${value}`);
  }
}

/**
 * Safely convert Wei to ETH string
 */
export function formatEtherValue(weiValue: string | ethers.BigNumber): string {
  try {
    if (!weiValue || weiValue === '0') {
      return '0';
    }
    
    const bigNumberValue = typeof weiValue === 'string' 
      ? ethers.BigNumber.from(weiValue)
      : weiValue;
      
    return ethers.utils.formatEther(bigNumberValue);
  } catch (error) {
    console.error('Error formatting ether value:', error, 'Value:', weiValue);
    return '0';
  }
}

/**
 * Validate if a value is a valid BigNumber-compatible string
 */
export function isValidBigNumberString(value: string): boolean {
  try {
    ethers.BigNumber.from(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert gas price from Gwei to Wei
 */
export function parseGweiValue(gweiValue: string | number): string {
  try {
    const valueStr = typeof gweiValue === 'number' ? gweiValue.toString() : gweiValue;
    const parsed = ethers.utils.parseUnits(valueStr, 'gwei');
    return parsed.toString();
  } catch (error) {
    console.error('Error parsing gwei value:', error, 'Value:', gweiValue);
    throw new Error(`Invalid gwei value: ${gweiValue}`);
  }
}

/**
 * Format gas price from Wei to Gwei
 */
export function formatGweiValue(weiValue: string | ethers.BigNumber): string {
  try {
    const bigNumberValue = typeof weiValue === 'string'
      ? ethers.BigNumber.from(weiValue)
      : weiValue;
      
    return ethers.utils.formatUnits(bigNumberValue, 'gwei');
  } catch (error) {
    console.error('Error formatting gwei value:', error, 'Value:', weiValue);
    return '0';
  }
}

/**
 * Safely add two BigNumber values
 */
export function addBigNumbers(a: string, b: string): string {
  try {
    const aBN = ethers.BigNumber.from(a);
    const bBN = ethers.BigNumber.from(b);
    return aBN.add(bBN).toString();
  } catch (error) {
    console.error('Error adding big numbers:', error, 'Values:', a, b);
    throw new Error('Invalid BigNumber values for addition');
  }
}

/**
 * Safely subtract two BigNumber values
 */
export function subtractBigNumbers(a: string, b: string): string {
  try {
    const aBN = ethers.BigNumber.from(a);
    const bBN = ethers.BigNumber.from(b);
    return aBN.sub(bBN).toString();
  } catch (error) {
    console.error('Error subtracting big numbers:', error, 'Values:', a, b);
    throw new Error('Invalid BigNumber values for subtraction');
  }
}

/**
 * Compare two BigNumber values
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareBigNumbers(a: string, b: string): number {
  try {
    const aBN = ethers.BigNumber.from(a);
    const bBN = ethers.BigNumber.from(b);
    
    if (aBN.lt(bBN)) return -1;
    if (aBN.gt(bBN)) return 1;
    return 0;
  } catch (error) {
    console.error('Error comparing big numbers:', error, 'Values:', a, b);
    throw new Error('Invalid BigNumber values for comparison');
  }
}

/**
 * Check if BigNumber value is zero
 */
export function isZeroBigNumber(value: string): boolean {
  try {
    return ethers.BigNumber.from(value).isZero();
  } catch {
    return false;
  }
}

/**
 * Get maximum BigNumber value between two
 */
export function maxBigNumber(a: string, b: string): string {
  try {
    const aBN = ethers.BigNumber.from(a);
    const bBN = ethers.BigNumber.from(b);
    return aBN.gt(bBN) ? a : b;
  } catch (error) {
    console.error('Error finding max big number:', error, 'Values:', a, b);
    throw new Error('Invalid BigNumber values for max comparison');
  }
}

/**
 * Get minimum BigNumber value between two
 */
export function minBigNumber(a: string, b: string): string {
  try {
    const aBN = ethers.BigNumber.from(a);
    const bBN = ethers.BigNumber.from(b);
    return aBN.lt(bBN) ? a : b;
  } catch (error) {
    console.error('Error finding min big number:', error, 'Values:', a, b);
    throw new Error('Invalid BigNumber values for min comparison');
  }
}
