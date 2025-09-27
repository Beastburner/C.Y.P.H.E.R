import { ethers } from 'ethers';

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate amount string
 */
export function isValidAmount(amount: string): boolean {
  try {
    const parsed = ethers.utils.parseEther(amount);
    return parsed.gt(0);
  } catch {
    return false;
  }
}

/**
 * Validate private key
 */
export function isValidPrivateKey(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate hex string
 */
export function isValidHex(hex: string): boolean {
  return /^0x[0-9a-fA-F]*$/.test(hex);
}

/**
 * Validate transaction hash
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(hash);
}

/**
 * Validate chain ID
 */
export function isValidChainId(chainId: number): boolean {
  return Number.isInteger(chainId) && chainId > 0;
}

/**
 * Validate gas price (in Gwei)
 */
export function isValidGasPrice(gasPrice: string): boolean {
  try {
    const parsed = parseFloat(gasPrice);
    return parsed > 0 && parsed < 1000; // Reasonable gas price range
  } catch {
    return false;
  }
}

/**
 * Validate gas limit
 */
export function isValidGasLimit(gasLimit: string): boolean {
  try {
    const parsed = parseInt(gasLimit);
    return parsed >= 21000 && parsed <= 10000000; // Reasonable gas limit range
  } catch {
    return false;
  }
}

/**
 * Validate nonce
 */
export function isValidNonce(nonce: number): boolean {
  return Number.isInteger(nonce) && nonce >= 0;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate RPC URL
 */
export function isValidRpcUrl(url: string): boolean {
  return isValidUrl(url) && (url.startsWith('http://') || url.startsWith('https://'));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate PIN (4-6 digits)
 */
export function isValidPin(pin: string): boolean {
  const pinRegex = /^\d{4,6}$/;
  return pinRegex.test(pin);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
} {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = score >= 4 && requirements.minLength;

  return {
    isValid,
    score,
    requirements,
  };
}

/**
 * Validate token contract address
 */
export function isValidTokenAddress(address: string): boolean {
  return isValidAddress(address) && address !== ethers.constants.AddressZero;
}

/**
 * Validate ENS name
 */
export function isValidENSName(name: string): boolean {
  const ensRegex = /^[a-z0-9-]+\.eth$/;
  return ensRegex.test(name.toLowerCase());
}

/**
 * Validate slippage percentage
 */
export function isValidSlippage(slippage: number): boolean {
  return slippage >= 0.01 && slippage <= 50; // 0.01% to 50%
}

/**
 * Validate deadline (in minutes)
 */
export function isValidDeadline(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 60; // 1 to 60 minutes
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate and sanitize amount input
 */
export function validateAndSanitizeAmount(amount: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  const sanitized = amount.trim().replace(/[^0-9.]/g, '');
  
  if (!sanitized) {
    return { isValid: false, sanitized: '', error: 'Amount is required' };
  }

  // Check for multiple decimal points
  const decimalCount = (sanitized.match(/\./g) || []).length;
  if (decimalCount > 1) {
    return { isValid: false, sanitized, error: 'Invalid amount format' };
  }

  // Check if it's a valid number
  const parsed = parseFloat(sanitized);
  if (isNaN(parsed) || parsed <= 0) {
    return { isValid: false, sanitized, error: 'Amount must be greater than 0' };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig(config: {
  chainId: number;
  name: string;
  rpcUrl: string;
  symbol: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isValidChainId(config.chainId)) {
    errors.push('Invalid chain ID');
  }

  if (!config.name || config.name.trim().length < 3) {
    errors.push('Network name must be at least 3 characters');
  }

  if (!isValidRpcUrl(config.rpcUrl)) {
    errors.push('Invalid RPC URL');
  }

  if (!config.symbol || config.symbol.trim().length < 2) {
    errors.push('Symbol must be at least 2 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate swap parameters
 */
export function validateSwapParams(params: {
  fromAmount: string;
  toAmount: string;
  slippage: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!isValidAmount(params.fromAmount)) {
    errors.push('Invalid from amount');
  }

  if (!isValidAmount(params.toAmount)) {
    errors.push('Invalid to amount');
  }

  if (!isValidSlippage(params.slippage)) {
    errors.push('Invalid slippage percentage');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate address with detailed result
 */
export function validateAddress(address: string): { isValid: boolean; error?: string } {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  if (!isValidAddress(address)) {
    if (isValidENSName(address)) {
      return { isValid: true }; // ENS names are valid
    }
    return { isValid: false, error: 'Invalid Ethereum address' };
  }

  return { isValid: true };
}

/**
 * Format currency amount with proper decimals
 */
export function formatCurrency(amount: string | number, decimals: number = 6): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  // For very small amounts, use more decimals
  if (num < 0.001) {
    return num.toFixed(8);
  }
  
  // For amounts less than 1, show more precision
  if (num < 1) {
    return num.toFixed(6);
  }
  
  // For larger amounts, use fewer decimals
  if (num < 1000) {
    return num.toFixed(4);
  }
  
  // For very large amounts, use 2 decimals with K/M notation
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  
  return num.toFixed(decimals);
}

/**
 * Format Ethereum address for display
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format gas fee for display
 */
export function formatGasFee(gasPrice: string, gasLimit: string): string {
  try {
    const gasPriceBN = ethers.utils.parseUnits(gasPrice, 'gwei');
    const gasLimitBN = ethers.BigNumber.from(gasLimit);
    const gasFee = gasPriceBN.mul(gasLimitBN);
    const gasFeeEth = ethers.utils.formatEther(gasFee);
    return parseFloat(gasFeeEth).toFixed(6);
  } catch (error) {
    return '0';
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format USD value
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string): string {
  return formatAddress(hash, 8, 8);
}
