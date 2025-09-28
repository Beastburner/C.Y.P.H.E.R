/**
 * ENS Ephemeral Subdomain + Stealth Address Generator
 * Privacy-preserving ENS resolution with automatic stealth address generation
 * Simplified implementation for hackathon demo
 */

import { ethers } from 'ethers';

export interface StealthGeneratorConfig {
  curve: string;
  base_point: string;
  scheme: string;
}

export interface ENSPrivacyManifest {
  version: string;
  receiving: {
    subdomain?: string;
    stealth_generator: StealthGeneratorConfig;
  };
  updated: string;
  ttl?: number;
}

export interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
  sharedSecret: string;
  noteCommitment: string;
}

export interface ENSAllowlistManifest {
  merkle_root: string;
  expiry: string;
  version?: string;
}

/**
 * ENS Privacy Service for ephemeral subdomains and stealth addresses
 */
export class ENSPrivacyService {
  private provider: ethers.providers.Provider;
  private manifestCache: Map<string, { manifest: ENSPrivacyManifest; expires: number }>;
  private allowlistCache: Map<string, { manifest: ENSAllowlistManifest; expires: number }>;

  constructor(provider: ethers.providers.Provider) {
    this.provider = provider;
    this.manifestCache = new Map();
    this.allowlistCache = new Map();
  }

  /**
   * Resolve ENS name with ephemeral subdomain support and stealth address generation
   */
  async resolveWithStealth(ensName: string): Promise<StealthAddressResult> {
    try {
      console.log('🔍 Resolving ENS with stealth generation:', ensName);

      // Step 1: Resolve primary ENS name
      const ensAddress = await this.provider.resolveName(ensName);
      if (!ensAddress) {
        throw new Error(`Cannot resolve ENS name: ${ensName}`);
      }

      // Step 2: Generate stealth address (simplified for demo)
      const stealthResult = await this.generateBasicStealth(ensName, ensAddress);

      console.log('✅ ENS stealth resolution completed:', {
        ensName,
        resolvedAddress: ensAddress,
        stealthAddress: stealthResult.stealthAddress.slice(0, 10) + '...',
        noteCommitment: stealthResult.noteCommitment.slice(0, 10) + '...'
      });

      return stealthResult;

    } catch (error: any) {
      console.error('❌ ENS stealth resolution failed:', error);
      
      // Fallback to mock stealth generation for demo
      return await this.generateBasicStealth(ensName, ethers.constants.AddressZero);
    }
  }

  /**
   * Generate basic stealth address (simplified implementation for demo)
   */
  private async generateBasicStealth(ensName: string, resolvedAddress: string): Promise<StealthAddressResult> {
    try {
      // Generate ephemeral keypair (simplified using random wallet)
      const ephemeralWallet = ethers.Wallet.createRandom();
      const ephemeralPublicKey = ephemeralWallet.publicKey;
      
      console.log('🔑 Generated ephemeral keypair for', ensName);

      // Generate shared secret using keccak256 of ephemeral private key + resolved address
      const sharedSecret = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'address', 'string'],
          [ephemeralWallet.privateKey, resolvedAddress, ensName]
        )
      );

      // Derive stealth address using shared secret
      const stealthWallet = new ethers.Wallet(sharedSecret);
      const stealthAddress = stealthWallet.address;

      // Generate note commitment
      const noteCommitment = await this.constructNoteCommitment({
        stealthAddress,
        ephemeralPublicKey,
        sharedSecret
      });

      console.log('🎭 Generated stealth address:', stealthAddress);

      return {
        stealthAddress,
        ephemeralPublicKey,
        sharedSecret,
        noteCommitment
      };

    } catch (error: any) {
      throw new Error(`Basic stealth generation failed: ${error.message}`);
    }
  }

  /**
   * Get privacy manifest (mock implementation for demo)
   */
  private async getPrivacyManifest(ensName: string): Promise<ENSPrivacyManifest> {
    // Check cache first
    const cached = this.manifestCache.get(ensName);
    if (cached && Date.now() < cached.expires) {
      return cached.manifest;
    }

    // Mock manifest for demo
    const manifest: ENSPrivacyManifest = {
      version: '1',
      receiving: {
        subdomain: `ephemeral-${Date.now()}.${ensName}`,
        stealth_generator: {
          curve: 'secp256k1',
          base_point: '0x0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
          scheme: 'ecdh+keccak'
        }
      },
      updated: new Date().toISOString(),
      ttl: 300000 // 5 minutes
    };

    // Cache the manifest
    this.manifestCache.set(ensName, {
      manifest,
      expires: Date.now() + (manifest.ttl || 300000)
    });

    console.log('📋 Generated mock privacy manifest for:', ensName);
    return manifest;
  }

  /**
   * Resolve ephemeral subdomain (simplified for demo)
   */
  private async resolveEphemeralSubdomain(manifest: ENSPrivacyManifest, originalName: string): Promise<ENSPrivacyManifest> {
    if (!manifest.receiving.subdomain) {
      return manifest;
    }

    console.log('🔄 Simulating ephemeral subdomain resolution:', manifest.receiving.subdomain);
    
    // For demo, generate a new manifest with rotated subdomain
    const rotatedManifest: ENSPrivacyManifest = {
      ...manifest,
      receiving: {
        ...manifest.receiving,
        subdomain: `ephemeral-${Date.now()}.${originalName}` // Rotate subdomain
      },
      updated: new Date().toISOString()
    };

    return rotatedManifest;
  }

  /**
   * Construct note commitment using stealth address
   */
  private async constructNoteCommitment(stealthResult: Omit<StealthAddressResult, 'noteCommitment'>): Promise<string> {
    try {
      // Generate random values for the note
      const secret = ethers.utils.randomBytes(32);
      const nullifier = ethers.utils.randomBytes(32);
      
      // Create commitment: hash(secret, nullifier, stealth_address, ephemeral_pubkey)
      const commitment = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'bytes32', 'address', 'string'],
          [secret, nullifier, stealthResult.stealthAddress, stealthResult.ephemeralPublicKey]
        )
      );

      return commitment;

    } catch (error: any) {
      throw new Error(`Note commitment construction failed: ${error.message}`);
    }
  }

  /**
   * Check ENS-based allowlist for sender authorization
   */
  async checkSenderAllowlist(ensName: string, senderAddress: string): Promise<{ allowed: boolean; requiresProof: boolean }> {
    try {
      console.log('🔒 Checking sender allowlist for:', ensName, 'from:', senderAddress.slice(0, 10) + '...');

      // Simulate allowlist lookup (in production would use ENS text records)
      const hasAllowlist = Math.random() > 0.7; // 30% chance of having allowlist
      
      if (!hasAllowlist) {
        console.log('✅ No allowlist found, allowing all senders');
        return { allowed: true, requiresProof: false };
      }

      // Simulate allowlist check
      const allowedAddresses = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
      ];

      const isAllowed = allowedAddresses.includes(senderAddress);
      
      if (isAllowed) {
        console.log('✅ Sender authorized by allowlist');
      } else {
        console.log('❌ Sender not in allowlist');
      }

      return { 
        allowed: isAllowed, 
        requiresProof: true 
      };

    } catch (error: any) {
      console.warn('⚠️ Allowlist check failed, defaulting to allow:', error.message);
      return { allowed: true, requiresProof: false };
    }
  }

  /**
   * Generate stealth payment metadata for recipient detection
   */
  async generatePaymentMetadata(stealthResult: StealthAddressResult, amount: string): Promise<{
    ephemeralPublicKey: string;
    encryptedAmount: string;
    stealthTag: string;
  }> {
    try {
      // Create stealth tag for recipient scanning
      const stealthTag = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['string', 'address'],
          [stealthResult.ephemeralPublicKey, stealthResult.stealthAddress]
        )
      ).slice(0, 18); // First 8 bytes as tag

      // Encrypt amount using shared secret (simplified)
      const encryptedAmount = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['bytes32', 'uint256'],
          [stealthResult.sharedSecret, amount]
        )
      );

      console.log('📦 Generated stealth payment metadata:', {
        stealthTag: stealthTag,
        ephemeralKey: stealthResult.ephemeralPublicKey.slice(0, 10) + '...'
      });

      return {
        ephemeralPublicKey: stealthResult.ephemeralPublicKey,
        encryptedAmount,
        stealthTag
      };

    } catch (error: any) {
      throw new Error(`Payment metadata generation failed: ${error.message}`);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, value] of this.manifestCache.entries()) {
      if (now >= value.expires) {
        this.manifestCache.delete(key);
      }
    }

    for (const [key, value] of this.allowlistCache.entries()) {
      if (now >= value.expires) {
        this.allowlistCache.delete(key);
      }
    }

    console.log('🧹 Cleared expired cache entries');
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): { manifests: number; allowlists: number } {
    return {
      manifests: this.manifestCache.size,
      allowlists: this.allowlistCache.size
    };
  }
}

export default ENSPrivacyService;
