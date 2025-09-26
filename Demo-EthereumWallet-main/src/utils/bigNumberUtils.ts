/**
 * BigNumber Utility Functions
 * Safe conversion utilities for handling both wei and ether formats
 */

import { ethers } from 'ethers';

/**
 * Safely convert value to BigNumber, handling both wei and ether formats
 * @param value - Value in either wei (string) or ether (decimal string) format
 * @returns BigNumber representation
 */
export function safeValueToBigNumber(value: string | number): ethers.BigNumber {
  if (!value || value === '0') {
    return ethers.BigNumber.from('0');
  }

  const valueStr = typeof value === 'number' ? value.toString() : value;

  try {
    // If it's a large integer (likely wei), parse directly
    if (!valueStr.includes('.') && valueStr.length > 10) {
      try {
        return ethers.BigNumber.from(valueStr);
      } catch {
        // If BigNumber.from fails, try parseEther
        return ethers.utils.parseEther(valueStr);
      }
    }
    
    // If it contains decimal point, it's likely ether format
    if (valueStr.includes('.')) {
      return ethers.utils.parseEther(valueStr);
    }

    // For small integers, assume ether format
    return ethers.utils.parseEther(valueStr);
  } catch (error) {
    console.error('Error converting value to BigNumber:', error, 'Value:', valueStr);
    throw new Error(`Invalid value format: ${valueStr}`);
  }
}

/**
 * Safely convert ether amount to wei string
 * @param etherAmount - Amount in ether format
 * @returns Wei amount as string
 */
export function etherToWei(etherAmount: string | number): string {
  try {
    const valueStr = typeof etherAmount === 'number' ? etherAmount.toString() : etherAmount;
    return ethers.utils.parseEther(valueStr).toString();
  } catch (error) {
    console.error('Error converting ether to wei:', error, 'Amount:', etherAmount);
    throw new Error(`Invalid ether amount: ${etherAmount}`);
  }
}

/**
 * Safely convert wei amount to ether string
 * @param weiAmount - Amount in wei format
 * @returns Ether amount as string
 */
export function weiToEther(weiAmount: string | ethers.BigNumber): string {
  try {
    const bigNumberValue = typeof weiAmount === 'string' 
      ? ethers.BigNumber.from(weiAmount)
      : weiAmount;
      
    return ethers.utils.formatEther(bigNumberValue);
  } catch (error) {
    console.error('Error converting wei to ether:', error, 'Amount:', weiAmount);
    return '0';
  }
}

/**
 * Check if a value string is in wei format (no decimals, large number)
 * @param value - Value to check
 * @returns True if likely wei format
 */
export function isWeiFormat(value: string): boolean {
  if (!value || value.includes('.')) {
    return false;
  }
  
  try {
    const bigNum = ethers.BigNumber.from(value);
    // If it's larger than 1 ETH in wei (10^18), likely wei format
    return bigNum.gt(ethers.utils.parseEther('1'));
  } catch {
    return false;
  }
}

/**
 * Format amount for display (handles both wei and ether formats)
 * @param amount - Amount in any format
 * @param decimals - Number of decimal places to show
 * @returns Formatted ether amount string
 */
export function formatAmount(amount: string | ethers.BigNumber, decimals: number = 6): string {
  try {
    if (!amount || amount === '0') {
      return '0';
    }

    if (typeof amount === 'string' && isWeiFormat(amount)) {
      return parseFloat(weiToEther(amount)).toFixed(decimals);
    }

    if (ethers.BigNumber.isBigNumber(amount)) {
      return parseFloat(weiToEther(amount)).toFixed(decimals);
    }

    // Assume it's already in ether format
    return parseFloat(amount.toString()).toFixed(decimals);
  } catch (error) {
    console.error('Error formatting amount:', error, 'Amount:', amount);
    return '0';
  }
}
