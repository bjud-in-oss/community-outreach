/**
 * Encryption utilities for contact details and sensitive data
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 */

import { EncryptedContactDetails, EncryptionMetadata } from '../../types/data-models';

/**
 * Raw contact details before encryption
 */
export interface RawContactDetails {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Key derivation iterations */
  iterations: number;
  
  /** Salt length in bytes */
  saltLength: number;
  
  /** IV length in bytes */
  ivLength: number;
  
  /** Key length in bytes */
  keyLength: number;
  
  /** Algorithm identifier */
  algorithm: string;
}

/**
 * Default encryption configuration
 */
const DEFAULT_CONFIG: EncryptionConfig = {
  iterations: 100000,
  saltLength: 32,
  ivLength: 12,
  keyLength: 32,
  algorithm: 'AES-256-GCM'
};

/**
 * Encrypts contact details using AES-256-GCM
 * Requirement 10.2: Implement encrypted contact details storage
 */
export class ContactEncryption {
  private config: EncryptionConfig;
  
  constructor(config: EncryptionConfig = DEFAULT_CONFIG) {
    this.config = config;
  }
  
  /**
   * Encrypts raw contact details
   */
  async encryptContactDetails(
    details: RawContactDetails,
    password: string
  ): Promise<EncryptedContactDetails> {
    // Generate salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.config.saltLength));
    const iv = crypto.getRandomValues(new Uint8Array(this.config.ivLength));
    
    // Derive key from password
    const key = await this.deriveKey(password, salt);
    
    // Encrypt each field
    const encrypted_name = await this.encryptField(details.name, key, iv);
    const encrypted_email = details.email ? 
      await this.encryptField(details.email, key, iv) : undefined;
    const encrypted_phone = details.phone ? 
      await this.encryptField(details.phone, key, iv) : undefined;
    const encrypted_address = details.address ? 
      await this.encryptField(details.address, key, iv) : undefined;
    const encrypted_notes = details.notes ? 
      await this.encryptField(details.notes, key, iv) : undefined;
    
    // Create encryption metadata
    const encryption_metadata: EncryptionMetadata = {
      algorithm: this.config.algorithm,
      kdf: 'PBKDF2',
      salt: this.arrayBufferToBase64(salt),
      iv: this.arrayBufferToBase64(iv),
      encrypted_at: new Date()
    };
    
    return {
      encrypted_name,
      encrypted_email,
      encrypted_phone,
      encrypted_address,
      encrypted_notes,
      encryption_metadata
    };
  }
  
  /**
   * Decrypts contact details
   */
  async decryptContactDetails(
    encryptedDetails: EncryptedContactDetails,
    password: string
  ): Promise<RawContactDetails> {
    const { encryption_metadata } = encryptedDetails;
    
    // Reconstruct salt and IV
    const salt = this.base64ToArrayBuffer(encryption_metadata.salt);
    const iv = this.base64ToArrayBuffer(encryption_metadata.iv);
    
    // Derive key from password
    const key = await this.deriveKey(password, salt);
    
    // Decrypt each field
    const name = await this.decryptField(encryptedDetails.encrypted_name, key, iv);
    const email = encryptedDetails.encrypted_email ? 
      await this.decryptField(encryptedDetails.encrypted_email, key, iv) : undefined;
    const phone = encryptedDetails.encrypted_phone ? 
      await this.decryptField(encryptedDetails.encrypted_phone, key, iv) : undefined;
    const address = encryptedDetails.encrypted_address ? 
      await this.decryptField(encryptedDetails.encrypted_address, key, iv) : undefined;
    const notes = encryptedDetails.encrypted_notes ? 
      await this.decryptField(encryptedDetails.encrypted_notes, key, iv) : undefined;
    
    return {
      name,
      email,
      phone,
      address,
      notes
    };
  }
  
  /**
   * Derives encryption key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derive key using PBKDF2
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: this.config.keyLength * 8
      },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypts a single field
   */
  private async encryptField(
    plaintext: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );
    
    return this.arrayBufferToBase64(encrypted);
  }
  
  /**
   * Decrypts a single field
   */
  private async decryptField(
    ciphertext: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const encrypted = this.base64ToArrayBuffer(ciphertext);
    
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
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
}

/**
 * Global encryption instance
 */
export const contactEncryption = new ContactEncryption();