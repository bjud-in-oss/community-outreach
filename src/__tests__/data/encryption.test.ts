/**
 * Unit tests for contact encryption functionality
 * Tests AES-256-GCM encryption with PBKDF2 key derivation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContactEncryption } from '../../lib/data/encryption';
import type { RawContactDetails } from '../../lib/data/encryption';

describe('ContactEncryption', () => {
  let encryption: ContactEncryption;
  
  beforeEach(() => {
    encryption = new ContactEncryption();
  });
  
  const sampleContactDetails: RawContactDetails = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main St, Anytown, USA',
    notes: 'Met at conference 2023'
  };
  
  const password = 'secure-password-123';
  
  describe('encryptContactDetails', () => {
    it('should encrypt all contact fields', async () => {
      const encrypted = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      expect(encrypted.encrypted_name).toBeDefined();
      expect(encrypted.encrypted_email).toBeDefined();
      expect(encrypted.encrypted_phone).toBeDefined();
      expect(encrypted.encrypted_address).toBeDefined();
      expect(encrypted.encrypted_notes).toBeDefined();
      
      // Encrypted data should be different from original
      expect(encrypted.encrypted_name).not.toBe(sampleContactDetails.name);
      expect(encrypted.encrypted_email).not.toBe(sampleContactDetails.email);
    });
    
    it('should include encryption metadata', async () => {
      const encrypted = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      expect(encrypted.encryption_metadata).toBeDefined();
      expect(encrypted.encryption_metadata.algorithm).toBe('AES-256-GCM');
      expect(encrypted.encryption_metadata.kdf).toBe('PBKDF2');
      expect(encrypted.encryption_metadata.salt).toBeDefined();
      expect(encrypted.encryption_metadata.iv).toBeDefined();
      expect(encrypted.encryption_metadata.encrypted_at).toBeInstanceOf(Date);
    });
    
    it('should handle optional fields correctly', async () => {
      const minimalDetails: RawContactDetails = {
        name: 'Jane Smith'
      };
      
      const encrypted = await encryption.encryptContactDetails(
        minimalDetails,
        password
      );
      
      expect(encrypted.encrypted_name).toBeDefined();
      expect(encrypted.encrypted_email).toBeUndefined();
      expect(encrypted.encrypted_phone).toBeUndefined();
      expect(encrypted.encrypted_address).toBeUndefined();
      expect(encrypted.encrypted_notes).toBeUndefined();
    });
  });
  
  describe('decryptContactDetails', () => {
    it('should decrypt contact details correctly', async () => {
      const encrypted = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      const decrypted = await encryption.decryptContactDetails(
        encrypted,
        password
      );
      
      expect(decrypted).toEqual(sampleContactDetails);
    });
    
    it('should handle optional fields in decryption', async () => {
      const minimalDetails: RawContactDetails = {
        name: 'Jane Smith'
      };
      
      const encrypted = await encryption.encryptContactDetails(
        minimalDetails,
        password
      );
      
      const decrypted = await encryption.decryptContactDetails(
        encrypted,
        password
      );
      
      expect(decrypted).toEqual(minimalDetails);
    });
    
    it('should fail with wrong password', async () => {
      const encrypted = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      await expect(
        encryption.decryptContactDetails(encrypted, 'wrong-password')
      ).rejects.toThrow();
    });
  });
  
  describe('encryption consistency', () => {
    it('should produce different ciphertext for same input', async () => {
      const encrypted1 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      const encrypted2 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      // Different IV should produce different ciphertext
      expect(encrypted1.encrypted_name).not.toBe(encrypted2.encrypted_name);
      expect(encrypted1.encryption_metadata.iv).not.toBe(
        encrypted2.encryption_metadata.iv
      );
    });
    
    it('should maintain data integrity through encrypt/decrypt cycle', async () => {
      const testCases = [
        { name: 'Simple Name' },
        { name: 'Name with émojis 🎉', email: 'test@example.com' },
        { 
          name: 'Full Contact',
          email: 'full@example.com',
          phone: '+1-555-999-8888',
          address: '456 Oak Ave\nSuite 200\nBig City, ST 12345',
          notes: 'Very long notes with special characters: !@#$%^&*()_+-=[]{}|;:,.<>?'
        }
      ];
      
      for (const testCase of testCases) {
        const encrypted = await encryption.encryptContactDetails(
          testCase,
          password
        );
        
        const decrypted = await encryption.decryptContactDetails(
          encrypted,
          password
        );
        
        expect(decrypted).toEqual(testCase);
      }
    });
  });
  
  describe('security properties', () => {
    it('should use different salts for each encryption', async () => {
      const encrypted1 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      const encrypted2 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      expect(encrypted1.encryption_metadata.salt).not.toBe(
        encrypted2.encryption_metadata.salt
      );
    });
    
    it('should use different IVs for each encryption', async () => {
      const encrypted1 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      const encrypted2 = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      expect(encrypted1.encryption_metadata.iv).not.toBe(
        encrypted2.encryption_metadata.iv
      );
    });
    
    it('should produce base64-encoded output', async () => {
      const encrypted = await encryption.encryptContactDetails(
        sampleContactDetails,
        password
      );
      
      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      
      expect(base64Pattern.test(encrypted.encrypted_name)).toBe(true);
      expect(base64Pattern.test(encrypted.encryption_metadata.salt)).toBe(true);
      expect(base64Pattern.test(encrypted.encryption_metadata.iv)).toBe(true);
    });
  });
});