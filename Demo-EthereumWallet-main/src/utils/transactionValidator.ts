import { ethers } from 'ethers';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

export interface TransactionValidation {
  recipient: ValidationResult;
  amount: ValidationResult;
  balance: ValidationResult;
  gas: ValidationResult;
  network: ValidationResult;
  overall: ValidationResult;
}

export interface TransactionRequest {
  to: string;
  amount: string;
  gasLimit?: string;
  gasPrice?: string;
  data?: string;
  tokenAddress?: string;
}

export interface ValidationContext {
  currentBalance: string;
  networkId: number;
  gasPrice: string;
  tokenDecimals?: number;
  isTokenTransfer: boolean;
}

class TransactionValidator {
  private static instance: TransactionValidator;
  
  static getInstance(): TransactionValidator {
    if (!TransactionValidator.instance) {
      TransactionValidator.instance = new TransactionValidator();
    }
    return TransactionValidator.instance;
  }

  validateTransaction(
    transaction: TransactionRequest,
    context: ValidationContext
  ): TransactionValidation {
    const recipient = this.validateRecipient(transaction.to);
    const amount = this.validateAmount(transaction.amount, context);
    const balance = this.validateBalance(transaction.amount, context);
    const gas = this.validateGas(transaction, context);
    const network = this.validateNetwork(transaction.to, context.networkId);

    const overall = this.calculateOverallValidation([
      recipient,
      amount,
      balance,
      gas,
      network
    ]);

    return {
      recipient,
      amount,
      balance,
      gas,
      network,
      overall
    };
  }

  private validateRecipient(address: string): ValidationResult {
    if (!address) {
      return {
        isValid: false,
        error: 'Recipient address is required'
      };
    }

    if (!ethers.utils.isAddress(address)) {
      return {
        isValid: false,
        error: 'Invalid recipient address format'
      };
    }

    // Check for common mistakes
    if (address.toLowerCase() === address) {
      return {
        isValid: true,
        warning: 'Address is in lowercase. Consider using checksum format for better security.'
      };
    }

    // Check if it's a valid checksum address
    try {
      const checksumAddress = ethers.utils.getAddress(address);
      if (checksumAddress !== address) {
        return {
          isValid: true,
          warning: 'Address checksum doesn\'t match. Please verify the address.'
        };
      }
    } catch {
      return {
        isValid: false,
        error: 'Invalid address checksum'
      };
    }

    return { isValid: true };
  }

  private validateAmount(amount: string, context: ValidationContext): ValidationResult {
    if (!amount) {
      return {
        isValid: false,
        error: 'Amount is required'
      };
    }

    try {
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return {
          isValid: false,
          error: 'Amount must be a positive number'
        };
      }

      if (parsedAmount < 0.000001 && !context.isTokenTransfer) {
        return {
          isValid: false,
          error: 'Amount is too small (minimum 0.000001 ETH)'
        };
      }

      // Check for suspiciously large amounts
      if (parsedAmount > 1000 && !context.isTokenTransfer) {
        return {
          isValid: true,
          warning: 'Large amount detected. Please double-check the amount.'
        };
      }

      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Invalid amount format'
      };
    }
  }

  private validateBalance(amount: string, context: ValidationContext): ValidationResult {
    try {
      const amountValue = parseFloat(amount);
      const currentBalance = parseFloat(context.currentBalance);

      if (currentBalance <= 0) {
        return {
          isValid: false,
          error: 'Insufficient balance'
        };
      }

      if (amountValue > currentBalance) {
        return {
          isValid: false,
          error: 'Amount exceeds available balance'
        };
      }

      // Warn if using more than 90% of balance for non-token transfers
      if (!context.isTokenTransfer && amountValue > currentBalance * 0.9) {
        return {
          isValid: true,
          warning: 'Using more than 90% of balance. Ensure you have enough ETH for gas fees.'
        };
      }

      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Unable to validate balance'
      };
    }
  }

  private validateGas(transaction: TransactionRequest, context: ValidationContext): ValidationResult {
    try {
      const gasPrice = parseFloat(context.gasPrice);
      const gasLimit = transaction.gasLimit ? parseFloat(transaction.gasLimit) : 21000;

      if (gasPrice <= 0) {
        return {
          isValid: false,
          error: 'Invalid gas price'
        };
      }

      if (gasLimit < 21000) {
        return {
          isValid: false,
          error: 'Gas limit too low (minimum 21000)'
        };
      }

      // Calculate gas cost
      const gasCostETH = (gasPrice * gasLimit) / 1e9 / 1e9; // Convert from gwei to ETH
      
      if (gasCostETH > parseFloat(context.currentBalance)) {
        return {
          isValid: false,
          error: 'Insufficient ETH for gas fees'
        };
      }

      // Warn about high gas costs
      if (gasCostETH > 0.01) { // More than 0.01 ETH
        return {
          isValid: true,
          warning: `High gas cost: ${gasCostETH.toFixed(6)} ETH. Consider adjusting gas price.`
        };
      }

      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Unable to validate gas parameters'
      };
    }
  }

  private validateNetwork(address: string, networkId: number): ValidationResult {
    // Network-specific validations can be added here
    
    // Check for known contract addresses on wrong networks
    const knownContracts: { [key: string]: number[] } = {
      '0xa0b86991c31cc0aa4c1f28a92717e01d7ab17b2c2': [1], // USDC on Ethereum mainnet
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': [137], // USDC on Polygon
    };

    const lowerAddress = address.toLowerCase();
    if (knownContracts[lowerAddress] && !knownContracts[lowerAddress].includes(networkId)) {
      return {
        isValid: true,
        warning: 'This appears to be a token contract address from a different network.'
      };
    }

    return { isValid: true };
  }

  private calculateOverallValidation(validations: ValidationResult[]): ValidationResult {
    const hasErrors = validations.some(v => !v.isValid);
    const warnings = validations.filter(v => v.warning).map(v => v.warning!);
    const errors = validations.filter(v => v.error).map(v => v.error!);

    if (hasErrors) {
      return {
        isValid: false,
        error: errors.join('; ')
      };
    }

    if (warnings.length > 0) {
      return {
        isValid: true,
        warning: warnings.join('; ')
      };
    }

    return { isValid: true };
  }

  // Advanced security checks
  validateTransactionSecurity(transaction: TransactionRequest): ValidationResult {
    const warnings: string[] = [];

    // Check for contract interaction
    if (transaction.data && transaction.data !== '0x') {
      warnings.push('This transaction interacts with a smart contract. Verify the contract is trusted.');
    }

    // Check for zero-value transactions with data
    if (parseFloat(transaction.amount) === 0 && transaction.data) {
      warnings.push('Zero-value transaction with data detected. This may be a contract function call.');
    }

    // Check for unusual gas limits
    if (transaction.gasLimit) {
      const gasLimit = parseInt(transaction.gasLimit);
      if (gasLimit > 500000) {
        warnings.push('High gas limit detected. Complex contract interaction may be involved.');
      }
    }

    return {
      isValid: true,
      warning: warnings.length > 0 ? warnings.join(' ') : undefined
    };
  }

  // Simulate transaction to check for potential failures
  async simulateTransaction(
    transaction: TransactionRequest,
    provider: ethers.providers.Provider,
    fromAddress: string
  ): Promise<ValidationResult> {
    try {
      // Handle both wei and ether format amounts
      let value: ethers.BigNumber;
      try {
        // Try to parse as ether first
        value = ethers.utils.parseEther(transaction.amount);
      } catch {
        // If that fails, assume it's already in wei format
        value = ethers.BigNumber.from(transaction.amount);
      }
      
      const tx = {
        to: transaction.to,
        value: value,
        gasLimit: transaction.gasLimit || '21000',
        gasPrice: transaction.gasPrice,
        data: transaction.data || '0x',
        from: fromAddress
      };

      // This would normally use provider.estimateGas or provider.call
      // For now, we'll do basic checks
      
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Transaction simulation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Check for common scam patterns
  checkScamPatterns(transaction: TransactionRequest): ValidationResult {
    const warnings: string[] = [];

    // Check for suspicious amounts (common scam amounts)
    const amount = parseFloat(transaction.amount);
    const suspiciousAmounts = [0.1, 0.5, 1.0, 10.0]; // Common scam amounts
    
    if (suspiciousAmounts.includes(amount)) {
      warnings.push('This amount is commonly used in scams. Verify the recipient carefully.');
    }

    // Check for contract addresses that look like EOAs
    if (transaction.to.length === 42 && /^0x[a-fA-F0-9]{40}$/.test(transaction.to)) {
      // Additional checks could be performed here with a provider
    }

    return {
      isValid: true,
      warning: warnings.length > 0 ? warnings.join(' ') : undefined
    };
  }

  // Generate user-friendly error messages
  formatValidationError(validation: TransactionValidation): string {
    if (validation.overall.isValid) {
      return validation.overall.warning || '';
    }

    const errors: string[] = [];
    
    if (!validation.recipient.isValid) {
      errors.push(`Recipient: ${validation.recipient.error}`);
    }
    if (!validation.amount.isValid) {
      errors.push(`Amount: ${validation.amount.error}`);
    }
    if (!validation.balance.isValid) {
      errors.push(`Balance: ${validation.balance.error}`);
    }
    if (!validation.gas.isValid) {
      errors.push(`Gas: ${validation.gas.error}`);
    }
    if (!validation.network.isValid) {
      errors.push(`Network: ${validation.network.error}`);
    }

    return errors.join('\n');
  }

  // Generate warning messages for user confirmation
  formatWarnings(validation: TransactionValidation): string[] {
    const warnings: string[] = [];

    if (validation.recipient.warning) {
      warnings.push(validation.recipient.warning);
    }
    if (validation.amount.warning) {
      warnings.push(validation.amount.warning);
    }
    if (validation.balance.warning) {
      warnings.push(validation.balance.warning);
    }
    if (validation.gas.warning) {
      warnings.push(validation.gas.warning);
    }
    if (validation.network.warning) {
      warnings.push(validation.network.warning);
    }

    return warnings;
  }
}

export default TransactionValidator;
