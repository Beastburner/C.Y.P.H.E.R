/**
 * ENS Stealth Address Hook
 * 
 * React hook to integrate ENS ephemeral subdomain + stealth address generation
 * into the CYPHER wallet UI seamlessly.
 */

import { useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import ENSStealthService, { StealthAddressResult } from '../services/ENSStealthService';

interface UseENSStealthResult {
  // State
  isResolving: boolean;
  isGenerating: boolean;
  error: string | null;
  lastResult: StealthAddressResult | null;

  // Actions
  generateStealthForENS: (ensName: string, amount: string) => Promise<StealthAddressResult | null>;
  testSubdomainRotation: (ensName: string) => Promise<any>;
  clearError: () => void;
  reset: () => void;

  // Utilities
  isValidENS: (name: string) => boolean;
  formatStealthAddress: (address: string) => string;
}

export const useENSStealth = (provider?: ethers.providers.JsonRpcProvider): UseENSStealthResult => {
  const [isResolving, setIsResolving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<StealthAddressResult | null>(null);

  // Create service instance
  const serviceRef = useRef<ENSStealthService | null>(null);
  
  if (!serviceRef.current && provider) {
    serviceRef.current = new ENSStealthService(provider);
  }

  /**
   * Generate stealth address for ENS name
   */
  const generateStealthForENS = useCallback(async (
    ensName: string, 
    amount: string
  ): Promise<StealthAddressResult | null> => {
    if (!provider) {
      setError('No network provider available. Please check your network connection.');
      return null;
    }

    if (!serviceRef.current) {
      setError('ENS Stealth Service not initialized');
      return null;
    }

    if (!isValidENS(ensName)) {
      setError('Invalid ENS name format');
      return null;
    }

    setIsResolving(true);
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`🎯 Generating stealth address for ${ensName} (${amount} ETH)`);
      
      const result = await serviceRef.current.generateStealthAddress(
        ensName,
        amount
      );

      setLastResult(result);
      console.log('✅ Stealth generation completed:', {
        stealth: result.stealthAddress,
        ephemeral: result.ephemeralPublicKey.slice(0, 10) + '...',
        commitment: result.noteCommitment.slice(0, 10) + '...'
      });

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Stealth generation failed:', errorMessage);
      setError(errorMessage);
      return null;

    } finally {
      setIsResolving(false);
      setIsGenerating(false);
    }
  }, [provider]);

  /**
   * Test subdomain rotation
   */
  const testSubdomainRotation = useCallback(async (ensName: string) => {
    if (!provider) {
      setError('No network provider available. Please check your network connection.');
      return null;
    }

    if (!serviceRef.current) {
      setError('ENS Stealth Service not initialized');
      return null;
    }

    setError(null);

    try {
      console.log(`🔄 Testing subdomain rotation for ${ensName}`);
      return await serviceRef.current.testSubdomainRotation(ensName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rotation test failed';
      setError(errorMessage);
      return null;
    }
  }, [provider]);

  /**
   * Validate ENS name format
   */
  const isValidENS = useCallback((name: string): boolean => {
    if (!name || typeof name !== 'string') return false;
    
    // Basic ENS validation
    return /^[a-zA-Z0-9-]+\.eth$/.test(name) || 
           /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.eth$/.test(name);
  }, []);

  /**
   * Format stealth address for display
   */
  const formatStealthAddress = useCallback((address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setIsResolving(false);
    setIsGenerating(false);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    // State
    isResolving,
    isGenerating,
    error,
    lastResult,

    // Actions
    generateStealthForENS,
    testSubdomainRotation,
    clearError,
    reset,

    // Utilities
    isValidENS,
    formatStealthAddress,
  };
};

export default useENSStealth;
