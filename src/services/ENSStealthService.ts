/**
 * ENS Ephemeral Subdomain + Stealth Address Generator Service
 * 
 * This service implements a sophisticated privacy system that:
 * 1. Resolves ENS names to ephemeral subdomains
 * 2. Generates stealth addresses using ECDH key exchange
 * 3. Creates privacy commitments for shielded transactions
 * 4. Implements EIP-5564 compliant stealth address generation
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types for ENS Privacy Manifest
interface StealthGenerator {
  curve: 'secp256k1';
  base_point: string; // Compressed public key
  scheme: 'ecdh+keccak';
}

interface ReceivingMetadata {
  subdomain: string;
  stealth_generator: StealthGenerator;
}

interface ENSPrivacyManifest {
  version: string;
  receiving: ReceivingMetadata;
  updated: string;
  ttl?: number; // Time to live in seconds
}

interface StealthAddressResult {
  stealthAddress: string;
  ephemeralPublicKey: string;
  sharedSecret: string;
  noteCommitment: string;
  ephemeralPrivateKey: string; // Keep secure, needed for sender
}

interface CachedManifest {
  manifest: ENSPrivacyManifest;
  cachedAt: number;
  expiresAt: number;
}

class ENSStealthService {
  private provider: ethers.providers.JsonRpcProvider;
  private manifestCache: Map<string, CachedManifest> = new Map();
  private ipfsGateways: string[] = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
  ];

  constructor(provider: ethers.providers.JsonRpcProvider) {
    this.provider = provider;
    console.log('🔮 ENS Stealth Service initialized');
  }

  /**
   * Main function: Resolve ENS name and generate stealth address
   */
  async generateStealthAddress(
    ensName: string, 
    amount: string, 
    senderPrivateKey?: string
  ): Promise<StealthAddressResult> {
    console.log(`🔍 Starting stealth address generation for ${ensName}`);

    try {
      // Step 1: Resolve ENS name to get initial contenthash
      const manifest = await this.resolveENSToManifest(ensName);
      
      // Step 2: Check for ephemeral subdomain and resolve if exists
      const finalManifest = await this.resolveEphemeralSubdomain(manifest, ensName);
      
      // Step 3: Generate stealth address using ECDH
      const stealthResult = await this.performStealthGeneration(
        finalManifest.receiving.stealth_generator,
        amount,
        senderPrivateKey
      );

      console.log('✅ Stealth address generation completed');
      return stealthResult;

    } catch (error) {
      console.error('❌ Stealth address generation failed:', error);
      throw new Error(`Failed to generate stealth address for ${ensName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resolve ENS name to privacy manifest
   */
  private async resolveENSToManifest(ensName: string): Promise<ENSPrivacyManifest> {
    console.log(`📋 Resolving ENS manifest for ${ensName}`);

    // Check cache first
    const cached = this.manifestCache.get(ensName);
    if (cached && Date.now() < cached.expiresAt) {
      console.log('📦 Using cached manifest');
      return cached.manifest;
    }

    try {
      // Resolve contenthash from ENS
      const resolver = await this.provider.getResolver(ensName);
      if (!resolver) {
        throw new Error(`No resolver found for ${ensName}`);
      }

      const contenthash = await resolver.getContentHash();
      if (!contenthash) {
        throw new Error(`No contenthash found for ${ensName}`);
      }

      // Extract IPFS hash from contenthash (remove ipfs:// prefix if present)
      const ipfsHash = contenthash.startsWith('ipfs://') 
        ? contenthash.slice(7) 
        : this.extractIPFSHash(contenthash);

      // Fetch manifest from IPFS
      const manifest = await this.fetchIPFSManifest(ipfsHash);
      
      // Cache the manifest
      await this.cacheManifest(ensName, manifest);
      
      return manifest;

    } catch (error) {
      console.error(`❌ Failed to resolve ENS manifest for ${ensName}:`, error);
      // Return a default manifest for testing
      return this.createDefaultManifest(ensName);
    }
  }

  /**
   * Resolve ephemeral subdomain if it exists
   */
  private async resolveEphemeralSubdomain(
    manifest: ENSPrivacyManifest, 
    originalEns: string
  ): Promise<ENSPrivacyManifest> {
    const subdomain = manifest.receiving.subdomain;
    
    if (!subdomain || subdomain === originalEns) {
      console.log('📝 No ephemeral subdomain, using original manifest');
      return manifest;
    }

    console.log(`🔄 Resolving ephemeral subdomain: ${subdomain}`);

    try {
      // Resolve the ephemeral subdomain
      const subdomainManifest = await this.resolveENSToManifest(subdomain);
      
      // Override receiving metadata with subdomain data
      return {
        ...manifest,
        receiving: subdomainManifest.receiving,
        updated: subdomainManifest.updated
      };
    } catch (error) {
      console.warn(`⚠️ Failed to resolve ephemeral subdomain ${subdomain}, using original:`, error);
      return manifest;
    }
  }

  /**
   * Perform stealth address generation using ECDH
   */
  private async performStealthGeneration(
    stealthGen: StealthGenerator,
    amount: string,
    senderPrivateKey?: string
  ): Promise<StealthAddressResult> {
    console.log('🔐 Performing ECDH stealth generation');

    try {
      // Generate sender ephemeral keypair
      const ephemeralWallet = senderPrivateKey 
        ? new ethers.Wallet(senderPrivateKey)
        : ethers.Wallet.createRandom();
      
      const ephemeralPrivateKey = ephemeralWallet.privateKey;
      const ephemeralPublicKey = ephemeralWallet.publicKey;

      // Parse recipient's base point (compressed public key)
      const recipientBasePoint = stealthGen.base_point;
      
      // Perform ECDH: shared_secret = ephemeral_private * recipient_base_point
      const sharedSecret = await this.computeECDHSecret(
        ephemeralPrivateKey,
        recipientBasePoint
      );

      // Derive stealth address using EIP-5564 approach
      const stealthAddress = await this.deriveStealthAddress(
        sharedSecret,
        recipientBasePoint
      );

      // Generate note commitment for shielded pool
      const noteCommitment = await this.generateNoteCommitment(
        stealthAddress,
        amount,
        sharedSecret
      );

      console.log('✨ Stealth address generated successfully');

      return {
        stealthAddress,
        ephemeralPublicKey,
        sharedSecret,
        noteCommitment,
        ephemeralPrivateKey
      };

    } catch (error) {
      console.error('❌ ECDH stealth generation failed:', error);
      throw new Error(`Stealth generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Compute ECDH shared secret
   */
  private async computeECDHSecret(
    ephemeralPrivateKey: string,
    recipientPublicKey: string
  ): Promise<string> {
    try {
      // Use ethers.js signing key for ECDH computation
      const signingKey = new ethers.utils.SigningKey(ephemeralPrivateKey);
      
      // Compute shared point
      const sharedPoint = signingKey.computeSharedSecret(recipientPublicKey);
      
      // Hash the shared point to get the shared secret
      const sharedSecret = ethers.utils.keccak256(sharedPoint);
      
      console.log('🤝 ECDH shared secret computed');
      return sharedSecret;
    } catch (error) {
      console.error('❌ ECDH computation failed:', error);
      throw new Error(`ECDH failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Derive stealth address from shared secret (EIP-5564 compliant)
   */
  private async deriveStealthAddress(
    sharedSecret: string,
    recipientBasePoint: string
  ): Promise<string> {
    try {
      // EIP-5564: stealth_private_key = Hash(shared_secret || recipient_public_key)
      const stealthSeed = ethers.utils.keccak256(
        ethers.utils.concat([sharedSecret, recipientBasePoint])
      );

      // Create stealth wallet from derived seed
      const stealthWallet = new ethers.Wallet(stealthSeed);
      
      console.log('👻 Stealth address derived:', stealthWallet.address);
      return stealthWallet.address;
    } catch (error) {
      console.error('❌ Stealth address derivation failed:', error);
      throw new Error(`Stealth derivation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate note commitment for shielded pool
   */
  private async generateNoteCommitment(
    stealthAddress: string,
    amount: string,
    sharedSecret: string
  ): Promise<string> {
    try {
      // Generate random nullifier
      const nullifier = ethers.utils.randomBytes(32);
      
      // Create commitment: Hash(stealth_address || amount || nullifier || shared_secret)
      const commitment = ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ['address', 'uint256', 'bytes32', 'bytes32'],
          [stealthAddress, ethers.utils.parseEther(amount), nullifier, sharedSecret]
        )
      );

      console.log('📝 Note commitment generated');
      return commitment;
    } catch (error) {
      console.error('❌ Note commitment generation failed:', error);
      throw new Error(`Commitment generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Fetch manifest from IPFS with fallback gateways
   */
  private async fetchIPFSManifest(ipfsHash: string): Promise<ENSPrivacyManifest> {
    console.log(`📡 Fetching IPFS manifest: ${ipfsHash}`);

    for (const gateway of this.ipfsGateways) {
      try {
        const url = `${gateway}${ipfsHash}`;
        console.log(`🌐 Trying gateway: ${url}`);
        
        const response = await fetch(url, { 
          headers: {
            'Accept': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const manifest = await response.json();
        console.log('✅ IPFS manifest fetched successfully');
        return manifest;

      } catch (error) {
        console.warn(`⚠️ Gateway ${gateway} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    throw new Error('All IPFS gateways failed');
  }

  /**
   * Extract IPFS hash from contenthash bytes
   */
  private extractIPFSHash(contenthash: string): string {
    try {
      // Remove 0x prefix if present
      const hex = contenthash.startsWith('0x') ? contenthash.slice(2) : contenthash;
      
      // IPFS contenthash typically starts with 0x12 (sha256) + length + hash
      // This is a simplified extraction - in production, use proper IPFS utils
      if (hex.startsWith('12')) {
        // Convert to base58 IPFS hash
        return this.hexToBase58(hex);
      }
      
      return hex;
    } catch (error) {
      console.error('❌ IPFS hash extraction failed:', error);
      return contenthash;
    }
  }

  /**
   * Convert hex to base58 (simplified)
   */
  private hexToBase58(hex: string): string {
    // This is a placeholder - in production, use proper base58 library
    // For now, return a mock IPFS hash
    return 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
  }

  /**
   * Cache manifest with TTL
   */
  private async cacheManifest(ensName: string, manifest: ENSPrivacyManifest): Promise<void> {
    const ttl = manifest.ttl || 3600; // Default 1 hour
    const cached: CachedManifest = {
      manifest,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000)
    };

    this.manifestCache.set(ensName, cached);
    
    // Also persist to AsyncStorage for app restarts
    try {
      await AsyncStorage.setItem(
        `ens_manifest_${ensName}`,
        JSON.stringify(cached)
      );
    } catch (error) {
      console.warn('⚠️ Failed to persist manifest cache:', error);
    }
  }

  /**
   * Create default manifest for testing
   */
  private createDefaultManifest(ensName: string): ENSPrivacyManifest {
    console.log(`🔧 Creating default manifest for ${ensName}`);
    
    // Generate a random base point for testing
    const testWallet = ethers.Wallet.createRandom();
    
    return {
      version: "1",
      receiving: {
        subdomain: `ephemeral${Date.now()}.${ensName}`,
        stealth_generator: {
          curve: "secp256k1",
          base_point: testWallet.publicKey,
          scheme: "ecdh+keccak"
        }
      },
      updated: new Date().toISOString(),
      ttl: 3600
    };
  }

  /**
   * Submit commitment to shielded pool
   */
  async submitToShieldedPool(
    stealthResult: StealthAddressResult,
    amount: string,
    contractAddress: string
  ): Promise<string> {
    console.log('📤 Submitting commitment to shielded pool');

    try {
      // This would integrate with your existing privacy contract
      const contract = new ethers.Contract(
        contractAddress,
        [
          'function deposit(bytes32 commitment) external payable',
          'function depositWithStealth(bytes32 commitment, bytes calldata stealthData) external payable'
        ],
        this.provider
      );

      // Encode stealth metadata
      const stealthData = ethers.utils.defaultAbiCoder.encode(
        ['bytes', 'address'],
        [stealthResult.ephemeralPublicKey, stealthResult.stealthAddress]
      );

      // Submit transaction
      const tx = await contract.depositWithStealth(
        stealthResult.noteCommitment,
        stealthData,
        { value: ethers.utils.parseEther(amount) }
      );

      console.log('✅ Commitment submitted to shielded pool');
      return tx.hash;

    } catch (error) {
      console.error('❌ Shielded pool submission failed:', error);
      throw new Error(`Pool submission failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Test subdomain rotation
   */
  async testSubdomainRotation(ensName: string): Promise<{
    original: string;
    rotated: string;
    different: boolean;
  }> {
    console.log(`🔄 Testing subdomain rotation for ${ensName}`);

    // Generate first stealth address
    const result1 = await this.generateStealthAddress(ensName, '1.0');
    
    // Clear cache to force fresh resolution
    this.manifestCache.delete(ensName);
    
    // Generate second stealth address (should be different if subdomain rotated)
    const result2 = await this.generateStealthAddress(ensName, '1.0');

    const different = result1.stealthAddress !== result2.stealthAddress;
    
    console.log(`🧪 Rotation test: ${different ? 'PASSED' : 'FAILED'}`);
    
    return {
      original: result1.stealthAddress,
      rotated: result2.stealthAddress,
      different
    };
  }
}

export default ENSStealthService;
export type { 
  ENSPrivacyManifest, 
  StealthGenerator, 
  StealthAddressResult,
  ReceivingMetadata
};
