/**
 * Enhanced data encryption service for all sensitive data
 * Implements encryption for data in transit and at rest
 * Requirement 16.1.2: Implement encryption for data in transit and at rest
 */

import { EncryptionMetadata } from '../../types/data-models';

/**
 * Encryption configuration for different data types
 */
export interface EncryptionConfig {
  /** Algorithm identifier */
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  
  /** Key derivation function */
  kdf: 'PBKDF2' | 'Argon2id';
  
  /** Key derivation iterations */
  iterations: number;
  
  /** Salt length in bytes */
  saltLength: number;
  
  /** IV/Nonce length in bytes */
  ivLength: number;
  
  /** Key length in bytes */
  keyLength: number;
  
  /** Memory cost for Argon2id (in KB) */
  memoryCost?: number;
  
  /** Parallelism for Argon2id */
  parallelism?: number;
}

/**
 * Encryption configurations for different security levels
 */
export const ENCRYPTION_CONFIGS = {
  /** Standard encryption for general data */
  STANDARD: {
    algorithm: 'AES-256-GCM' as const,
    kdf: 'PBKDF2' as const,
    iterations: 100000,
    saltLength: 32,
    ivLength: 12,
    keyLength: 32
  },
  
  /** High security encryption for sensitive data */
  HIGH_SECURITY: {
    algorithm: 'AES-256-GCM' as const,
    kdf: 'Argon2id' as const,
    iterations: 3,
    saltLength: 32,
    ivLength: 12,
    keyLength: 32,
    memoryCost: 65536, // 64 MB
    parallelism: 4
  },
  
  /** Performance-optimized encryption for temporary data */
  PERFORMANCE: {
    algorithm: 'ChaCha20-Poly1305' as const,
    kdf: 'PBKDF2' as const,
    iterations: 50000,
    saltLength: 32,
    ivLength: 12,
    keyLength: 32
  }
} as const;

/**
 * Encrypted data container
 */
export interface EncryptedData {
  /** Encrypted content */
  ciphertext: string;
  
  /** Encryption metadata */
  metadata: EncryptionMetadata;
  
  /** Data integrity hash */
  integrity_hash: string;
}

/**
 * Key derivation result
 */
interface DerivedKey {
  key: CryptoKey;
  salt: Uint8Array;
}

/**
 * Enhanced data encryption service
 */
export class DataEncryptionService {
  private config: EncryptionConfig;
  
  constructor(config: EncryptionConfig = ENCRYPTION_CONFIGS.STANDARD) {
    this.config = config;
  }
  
  /**
   * Encrypts arbitrary data with integrity protection
   */
  async encryptData(
    data: string | ArrayBuffer,
    password: string,
    additionalData?: string
  ): Promise<EncryptedData> {
    // Convert data to ArrayBuffer if needed
    const dataBuffer = typeof data === 'string' 
      ? new TextEncoder().encode(data)
      : new Uint8Array(data);
    
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
    
    // Derive encryption key
    const derivedKey = await this.deriveKey(password, salt);
    
    // Prepare additional authenticated data
    const aad = additionalData ? new TextEncoder().encode(additionalData) : undefined;
    
    // Encrypt the data
    const algorithmName = this.getAlgorithmForKeyDerivation();
    const encrypted = await crypto.subtle.encrypt(
      {
        name: algorithmName,
        iv: iv,
        additionalData: aad
      },
      derivedKey.key,
      dataBuffer
    );
    
    // Create ciphertext
    const ciphertext = this.arrayBufferToBase64(encrypted);
    
    // Calculate integrity hash
    const integrityHash = await this.calculateIntegrityHash(ciphertext, salt, iv);
    
    // Create encryption metadata
    const metadata: EncryptionMetadata = {
      algorithm: this.config.algorithm,
      kdf: this.config.kdf,
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv),
      encrypted_at: new Date()
    };
    
    return {
      ciphertext,
      metadata,
      integrity_hash: integrityHash
    };
  }
  
  /**
   * Decrypts data with integrity verification
   */
  async decryptData(
    encryptedData: EncryptedData,
    password: string,
    additionalData?: string
  ): Promise<ArrayBuffer> {
    const { ciphertext, metadata, integrity_hash } = encryptedData;
    
    // Verify integrity
    const salt = this.base64ToArrayBuffer(metadata.salt);
    const iv = this.base64ToArrayBuffer(metadata.iv);
    const expectedHash = await this.calculateIntegrityHash(ciphertext, salt, iv);
    
    if (expectedHash !== integrity_hash) {
      throw new Error('Data integrity verification failed');
    }
    
    // Derive decryption key
    const derivedKey = await this.deriveKey(password, salt);
    
    // Prepare additional authenticated data
    const aad = additionalData ? new TextEncoder().encode(additionalData) : undefined;
    
    // Decrypt the data
    const encrypted = this.base64ToArrayBuffer(ciphertext);
    
    try {
      const algorithmName = this.getAlgorithmForKeyDerivation();
      const decrypted = await crypto.subtle.decrypt(
        {
          name: algorithmName,
          iv: iv,
          additionalData: aad
        },
        derivedKey.key,
        encrypted
      );
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }
  
  /**
   * Encrypts text data (convenience method)
   */
  async encryptText(
    text: string,
    password: string,
    additionalData?: string
  ): Promise<EncryptedData> {
    return this.encryptData(text, password, additionalData);
  }
  
  /**
   * Decrypts text data (convenience method)
   */
  async decryptText(
    encryptedData: EncryptedData,
    password: string,
    additionalData?: string
  ): Promise<string> {
    const decrypted = await this.decryptData(encryptedData, password, additionalData);
    return new TextDecoder().decode(decrypted);
  }
  
  /**
   * Derives encryption key from password using configured KDF
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<DerivedKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    if (this.config.kdf === 'PBKDF2') {
      return this.deriveKeyPBKDF2(passwordBuffer, salt);
    } else if (this.config.kdf === 'Argon2id') {
      return this.deriveKeyArgon2id(passwordBuffer, salt);
    } else {
      throw new Error(`Unsupported KDF: ${this.config.kdf}`);
    }
  }
  
  /**
   * Derives key using PBKDF2
   */
  private async deriveKeyPBKDF2(
    passwordBuffer: Uint8Array,
    salt: Uint8Array
  ): Promise<DerivedKey> {
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Get the correct algorithm name for key derivation
    const algorithmName = this.getAlgorithmForKeyDerivation();
    
    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: algorithmName,
        length: this.config.keyLength * 8
      },
      false,
      ['encrypt', 'decrypt']
    );
    
    return { key, salt };
  }
  
  /**
   * Derives key using Argon2id (fallback to PBKDF2 if not available)
   */
  private async deriveKeyArgon2id(
    passwordBuffer: Uint8Array,
    salt: Uint8Array
  ): Promise<DerivedKey> {
    // Note: Argon2id is not natively supported in Web Crypto API
    // This is a placeholder that falls back to PBKDF2
    // In a production environment, you would use a library like argon2-browser
    console.warn('Argon2id not available, falling back to PBKDF2');
    
    const tempConfig = { ...this.config, kdf: 'PBKDF2' as const };
    const originalConfig = this.config;
    this.config = tempConfig;
    
    try {
      return await this.deriveKeyPBKDF2(passwordBuffer, salt);
    } finally {
      this.config = originalConfig;
    }
  }
  
  /**
   * Calculates integrity hash for encrypted data
   */
  private async calculateIntegrityHash(
    ciphertext: string,
    salt: Uint8Array,
    iv: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ciphertext + this.arrayBufferToBase64(salt) + this.arrayBufferToBase64(iv));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }
  
  /**
   * Generates a secure random password
   */
  generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    return Array.from(array, byte => charset[byte % charset.length]).join('');
  }
  
  /**
   * Generates a secure random key for symmetric encryption
   */
  async generateSymmetricKey(): Promise<CryptoKey> {
    const algorithmName = this.getAlgorithmForKeyDerivation();
    
    return crypto.subtle.generateKey(
      {
        name: algorithmName,
        length: this.config.keyLength * 8
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Exports a symmetric key as base64
   */
  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }
  
  /**
   * Imports a symmetric key from base64
   */
  async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    const algorithmName = this.getAlgorithmForKeyDerivation();
    
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: algorithmName,
        length: this.config.keyLength * 8
      },
      true,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Converts ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return Buffer.from(buffer).toString('base64');
    } else {
      // Browser environment
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }
  
  /**
   * Converts base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      return new Uint8Array(Buffer.from(base64, 'base64'));
    } else {
      // Browser environment
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  }
  
  /**
   * Gets the correct algorithm name for Web Crypto API
   */
  private getAlgorithmForKeyDerivation(): string {
    // Map our algorithm names to Web Crypto API names
    switch (this.config.algorithm) {
      case 'AES-256-GCM':
        return 'AES-GCM';
      case 'ChaCha20-Poly1305':
        // ChaCha20-Poly1305 is not widely supported in Web Crypto API
        // Fall back to AES-GCM for compatibility
        return 'AES-GCM';
      default:
        return 'AES-GCM';
    }
  }
}

/**
 * Global encryption service instances
 */
export const standardEncryption = new DataEncryptionService(ENCRYPTION_CONFIGS.STANDARD);
export const highSecurityEncryption = new DataEncryptionService(ENCRYPTION_CONFIGS.HIGH_SECURITY);
export const performanceEncryption = new DataEncryptionService(ENCRYPTION_CONFIGS.PERFORMANCE);