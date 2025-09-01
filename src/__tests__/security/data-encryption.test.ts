/**
 * Tests for data encryption service
 * Requirement 16.1.2: Write security tests for encryption and access control
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DataEncryptionService, 
  ENCRYPTION_CONFIGS,
  standardEncryption,
  highSecurityEncryption,
  performanceEncryption
} from '../../lib/security/data-encryption';

describe('DataEncryptionService', () => {
  let encryptionService: DataEncryptionService;
  const testPassword = 'test_password_123!@#';
  const testData = 'This is sensitive test data that needs to be encrypted';
  
  beforeEach(() => {
    encryptionService = new DataEncryptionService(ENCRYPTION_CONFIGS.STANDARD);
  });
  
  describe('Text Encryption/Decryption', () => {
    it('should encrypt and decrypt text data successfully', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.metadata).toBeDefined();
      expect(encrypted.integrity_hash).toBeDefined();
      expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
      expect(encrypted.metadata.kdf).toBe('PBKDF2');
      
      const decrypted = await encryptionService.decryptText(encrypted, testPassword);
      expect(decrypted).toBe(testData);
    });
    
    it('should fail decryption with wrong password', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      await expect(
        encryptionService.decryptText(encrypted, 'wrong_password')
      ).rejects.toThrow('Decryption failed');
    });
    
    it('should fail decryption with corrupted data', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      // Corrupt the ciphertext
      encrypted.ciphertext = encrypted.ciphertext.slice(0, -5) + 'XXXXX';
      
      await expect(
        encryptionService.decryptText(encrypted, testPassword)
      ).rejects.toThrow(); // Should throw either integrity or decryption error
    });
    
    it('should fail integrity verification with tampered data', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      // Tamper with integrity hash
      encrypted.integrity_hash = 'tampered_hash';
      
      await expect(
        encryptionService.decryptText(encrypted, testPassword)
      ).rejects.toThrow('Data integrity verification failed');
    });
  });
  
  describe('Binary Data Encryption/Decryption', () => {
    it('should encrypt and decrypt binary data successfully', async () => {
      const binaryData = new TextEncoder().encode(testData);
      
      const encrypted = await encryptionService.encryptData(binaryData, testPassword);
      const decrypted = await encryptionService.decryptData(encrypted, testPassword);
      
      const decryptedText = new TextDecoder().decode(decrypted);
      expect(decryptedText).toBe(testData);
    });
    
    it('should handle empty data', async () => {
      const emptyData = '';
      
      const encrypted = await encryptionService.encryptText(emptyData, testPassword);
      const decrypted = await encryptionService.decryptText(encrypted, testPassword);
      
      expect(decrypted).toBe(emptyData);
    });
  });
  
  describe('Additional Authenticated Data (AAD)', () => {
    it('should encrypt and decrypt with additional authenticated data', async () => {
      const additionalData = 'user_id:12345';
      
      const encrypted = await encryptionService.encryptText(testData, testPassword, additionalData);
      const decrypted = await encryptionService.decryptText(encrypted, testPassword, additionalData);
      
      expect(decrypted).toBe(testData);
    });
    
    it('should fail decryption with wrong additional authenticated data', async () => {
      const additionalData = 'user_id:12345';
      const wrongAdditionalData = 'user_id:67890';
      
      const encrypted = await encryptionService.encryptText(testData, testPassword, additionalData);
      
      await expect(
        encryptionService.decryptText(encrypted, testPassword, wrongAdditionalData)
      ).rejects.toThrow('Decryption failed');
    });
  });
  
  describe('Key Management', () => {
    it('should generate secure random passwords', () => {
      const password1 = encryptionService.generateSecurePassword(32);
      const password2 = encryptionService.generateSecurePassword(32);
      
      expect(password1).toHaveLength(32);
      expect(password2).toHaveLength(32);
      expect(password1).not.toBe(password2);
      
      // Should contain mix of characters
      expect(password1).toMatch(/[A-Z]/);
      expect(password1).toMatch(/[a-z]/);
      expect(password1).toMatch(/[0-9]/);
    });
    
    it('should generate and export/import symmetric keys', async () => {
      const key = await encryptionService.generateSymmetricKey();
      const exportedKey = await encryptionService.exportKey(key);
      const importedKey = await encryptionService.importKey(exportedKey);
      
      expect(exportedKey).toBeDefined();
      expect(typeof exportedKey).toBe('string');
      expect(importedKey).toBeDefined();
    });
  });
  
  describe('Encryption Configurations', () => {
    it('should use standard encryption configuration', async () => {
      const encrypted = await standardEncryption.encryptText(testData, testPassword);
      
      expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
      expect(encrypted.metadata.kdf).toBe('PBKDF2');
    });
    
    it('should use high security encryption configuration', async () => {
      const encrypted = await highSecurityEncryption.encryptText(testData, testPassword);
      
      expect(encrypted.metadata.algorithm).toBe('AES-256-GCM');
      expect(encrypted.metadata.kdf).toBe('Argon2id'); // Falls back to PBKDF2 in test environment
    });
    
    it('should use performance encryption configuration', async () => {
      const encrypted = await performanceEncryption.encryptText(testData, testPassword);
      
      expect(encrypted.metadata.algorithm).toBe('ChaCha20-Poly1305');
      expect(encrypted.metadata.kdf).toBe('PBKDF2');
    });
  });
  
  describe('Security Properties', () => {
    it('should generate different ciphertexts for same plaintext', async () => {
      const encrypted1 = await encryptionService.encryptText(testData, testPassword);
      const encrypted2 = await encryptionService.encryptText(testData, testPassword);
      
      expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
      expect(encrypted1.metadata.salt).not.toBe(encrypted2.metadata.salt);
      expect(encrypted1.metadata.iv).not.toBe(encrypted2.metadata.iv);
    });
    
    it('should include proper metadata', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      expect(encrypted.metadata.algorithm).toBeDefined();
      expect(encrypted.metadata.kdf).toBeDefined();
      expect(encrypted.metadata.salt).toBeDefined();
      expect(encrypted.metadata.iv).toBeDefined();
      expect(encrypted.metadata.encrypted_at).toBeInstanceOf(Date);
    });
    
    it('should produce base64-encoded outputs', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(encrypted.ciphertext).toMatch(base64Regex);
      expect(encrypted.metadata.salt).toMatch(base64Regex);
      expect(encrypted.metadata.iv).toMatch(base64Regex);
      expect(encrypted.integrity_hash).toMatch(base64Regex);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid base64 data gracefully', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      encrypted.ciphertext = 'invalid_base64_!@#$%';
      
      await expect(
        encryptionService.decryptText(encrypted, testPassword)
      ).rejects.toThrow();
    });
    
    it('should handle missing metadata gracefully', async () => {
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      // @ts-ignore - Intentionally corrupt metadata for testing
      encrypted.metadata = null;
      
      await expect(
        encryptionService.decryptText(encrypted, testPassword)
      ).rejects.toThrow();
    });
  });
  
  describe('Performance', () => {
    it('should encrypt and decrypt within reasonable time', async () => {
      const startTime = Date.now();
      
      const encrypted = await encryptionService.encryptText(testData, testPassword);
      const decrypted = await encryptionService.decryptText(encrypted, testPassword);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(decrypted).toBe(testData);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
    
    it('should handle large data efficiently', async () => {
      const largeData = 'x'.repeat(100000); // 100KB of data
      
      const startTime = Date.now();
      const encrypted = await encryptionService.encryptText(largeData, testPassword);
      const decrypted = await encryptionService.decryptText(encrypted, testPassword);
      const endTime = Date.now();
      
      expect(decrypted).toBe(largeData);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});