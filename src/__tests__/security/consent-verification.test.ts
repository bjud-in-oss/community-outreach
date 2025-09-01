/**
 * Tests for consent verification service
 * Requirement 16.1.1: Write security tests for consent verification
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ConsentVerificationService,
  ConsentVerificationError,
  consentVerification
} from '../../lib/security/consent-verification';
import { Consent, ConsentScope } from '../../types/data-models';

describe('ConsentVerificationService', () => {
  let service: ConsentVerificationService;
  
  beforeEach(() => {
    service = new ConsentVerificationService();
    service.clearCache();
  });
  
  const createTestConsent = (overrides: Partial<Consent> = {}): Consent => ({
    id: 'consent_123',
    user_id: 'user_123',
    scope: {
      data_access: {
        read_content: true,
        read_contacts: true,
        read_projects: false,
        read_memories: false
      },
      communication: {
        send_messages: true,
        initiate_collaboration: false,
        suggest_contacts: false,
        send_legacy_messages: false
      },
      sharing: {
        share_with_others: false,
        export_data: false,
        create_public_links: false
      },
      memory: {
        memory_discovery: false,
        link_memories: false,
        suggest_conversations: false
      }
    },
    status: 'active',
    applies_to: {
      type: 'contact',
      target_id: 'contact_123',
      target_name: 'Test Contact'
    },
    details: {
      description: 'Test consent',
      legal_basis: 'consent',
      purpose: 'testing'
    },
    granted_at: new Date(),
    updated_at: new Date(),
    ...overrides
  });
  
  const createTestRequest = (overrides: any = {}) => ({
    requesting_user_id: 'user_123',
    target_user_id: 'target_user_123',
    operation: 'read_content' as const,
    target: {
      type: 'contact' as const,
      target_id: 'contact_123',
      target_name: 'Test Contact'
    },
    requested_at: new Date(),
    ...overrides
  });
  
  describe('Consent Verification', () => {
    it('should grant access with valid consent', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(true);
      expect(result.consent).toBe(consent);
      expect(result.denial_reason).toBeUndefined();
    });
    
    it('should deny access without consent', async () => {
      const request = createTestRequest();
      
      const result = await service.verifyConsent(request, []);
      
      expect(result.granted).toBe(false);
      expect(result.denial_reason).toBe('No applicable consent found');
      expect(result.consent).toBeUndefined();
    });
    
    it('should deny access with revoked consent', async () => {
      const consent = createTestConsent({ status: 'revoked' });
      const request = createTestRequest();
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(false);
      expect(result.denial_reason).toBe('No applicable consent found');
    });
    
    it('should deny access with expired consent', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const consent = createTestConsent({ expires_at: expiredDate });
      const request = createTestRequest();
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(false);
      expect(result.denial_reason).toBe('No applicable consent found');
    });
    
    it('should deny access for insufficient permissions', async () => {
      const consent = createTestConsent({
        scope: {
          data_access: {
            read_content: false, // No permission for read_content
            read_contacts: true,
            read_projects: false,
            read_memories: false
          },
          communication: {
            send_messages: false,
            initiate_collaboration: false,
            suggest_contacts: false,
            send_legacy_messages: false
          },
          sharing: {
            share_with_others: false,
            export_data: false,
            create_public_links: false
          },
          memory: {
            memory_discovery: false,
            link_memories: false,
            suggest_conversations: false
          }
        }
      });
      const request = createTestRequest({ operation: 'read_content' });
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(false);
      expect(result.denial_reason).toBe('No applicable consent found');
    });
  });
  
  describe('Target Matching', () => {
    it('should match exact target', async () => {
      const consent = createTestConsent({
        applies_to: {
          type: 'contact',
          target_id: 'contact_123',
          target_name: 'Test Contact'
        }
      });
      const request = createTestRequest({
        target: {
          type: 'contact',
          target_id: 'contact_123',
          target_name: 'Test Contact'
        }
      });
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(true);
    });
    
    it('should match system-wide consent', async () => {
      const consent = createTestConsent({
        applies_to: {
          type: 'system',
          target_id: 'system',
          target_name: 'System'
        }
      });
      const request = createTestRequest({
        target: {
          type: 'contact',
          target_id: 'any_contact',
          target_name: 'Any Contact'
        }
      });
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(true);
    });
    
    it('should not match different targets', async () => {
      const consent = createTestConsent({
        applies_to: {
          type: 'contact',
          target_id: 'contact_123',
          target_name: 'Test Contact'
        }
      });
      const request = createTestRequest({
        target: {
          type: 'contact',
          target_id: 'contact_456',
          target_name: 'Different Contact'
        }
      });
      
      const result = await service.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(false);
    });
  });
  
  describe('Permission Checking', () => {
    it('should check data access permissions correctly', async () => {
      const consent = createTestConsent({
        scope: {
          data_access: {
            read_content: true,
            read_contacts: false,
            read_projects: true,
            read_memories: false
          },
          communication: {
            send_messages: false,
            initiate_collaboration: false,
            suggest_contacts: false,
            send_legacy_messages: false
          },
          sharing: {
            share_with_others: false,
            export_data: false,
            create_public_links: false
          },
          memory: {
            memory_discovery: false,
            link_memories: false,
            suggest_conversations: false
          }
        }
      });
      
      // Should allow read_content
      const contentRequest = createTestRequest({ operation: 'read_content' });
      const contentResult = await service.verifyConsent(contentRequest, [consent]);
      expect(contentResult.granted).toBe(true);
      
      // Should deny read_contacts
      const contactsRequest = createTestRequest({ operation: 'read_contacts' });
      const contactsResult = await service.verifyConsent(contactsRequest, [consent]);
      expect(contactsResult.granted).toBe(false);
      
      // Should allow read_projects
      const projectsRequest = createTestRequest({ operation: 'read_projects' });
      const projectsResult = await service.verifyConsent(projectsRequest, [consent]);
      expect(projectsResult.granted).toBe(true);
    });
    
    it('should check communication permissions correctly', async () => {
      const consent = createTestConsent({
        scope: {
          data_access: {
            read_content: false,
            read_contacts: false,
            read_projects: false,
            read_memories: false
          },
          communication: {
            send_messages: true,
            initiate_collaboration: false,
            suggest_contacts: true,
            send_legacy_messages: false
          },
          sharing: {
            share_with_others: false,
            export_data: false,
            create_public_links: false
          },
          memory: {
            memory_discovery: false,
            link_memories: false,
            suggest_conversations: false
          }
        }
      });
      
      // Should allow send_messages
      const messagesRequest = createTestRequest({ operation: 'send_messages' });
      const messagesResult = await service.verifyConsent(messagesRequest, [consent]);
      expect(messagesResult.granted).toBe(true);
      
      // Should deny initiate_collaboration
      const collaborationRequest = createTestRequest({ operation: 'initiate_collaboration' });
      const collaborationResult = await service.verifyConsent(collaborationRequest, [consent]);
      expect(collaborationResult.granted).toBe(false);
      
      // Should allow suggest_contacts
      const suggestRequest = createTestRequest({ operation: 'suggest_contacts' });
      const suggestResult = await service.verifyConsent(suggestRequest, [consent]);
      expect(suggestResult.granted).toBe(true);
    });
  });
  
  describe('Caching', () => {
    it('should cache verification results', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      // First call
      const result1 = await service.verifyConsent(request, [consent]);
      
      // Second call should use cache (we can't directly test this, but we can verify the result)
      const result2 = await service.verifyConsent(request, [consent]);
      
      expect(result1.granted).toBe(result2.granted);
      expect(result1.consent?.id).toBe(result2.consent?.id);
    });
    
    it('should clear cache when requested', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      await service.verifyConsent(request, [consent]);
      service.clearCache();
      
      // Should still work after cache clear
      const result = await service.verifyConsent(request, [consent]);
      expect(result.granted).toBe(true);
    });
    
    it('should clear expired cache entries', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      await service.verifyConsent(request, [consent]);
      service.clearExpiredCache();
      
      // Should still work after expired cache clear
      const result = await service.verifyConsent(request, [consent]);
      expect(result.granted).toBe(true);
    });
  });
  
  describe('RequireConsent Method', () => {
    it('should return consent when granted', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      const result = await service.requireConsent(request, [consent]);
      
      expect(result).toBe(consent);
    });
    
    it('should throw error when consent denied', async () => {
      const request = createTestRequest();
      
      await expect(
        service.requireConsent(request, [])
      ).rejects.toThrow(ConsentVerificationError);
    });
    
    it('should throw error with correct code', async () => {
      const request = createTestRequest();
      
      try {
        await service.requireConsent(request, []);
      } catch (error) {
        expect(error).toBeInstanceOf(ConsentVerificationError);
        expect((error as ConsentVerificationError).code).toBe('NO_CONSENT');
      }
    });
  });
  
  describe('Consent Scope Helpers', () => {
    it('should create full access scope', () => {
      const scope = ConsentVerificationService.createFullAccessScope();
      
      expect(scope.data_access.read_content).toBe(true);
      expect(scope.data_access.read_contacts).toBe(true);
      expect(scope.communication.send_messages).toBe(true);
      expect(scope.sharing.share_with_others).toBe(true);
      expect(scope.memory.memory_discovery).toBe(true);
    });
    
    it('should create minimal scope', () => {
      const scope = ConsentVerificationService.createMinimalScope();
      
      expect(scope.data_access.read_content).toBe(false);
      expect(scope.data_access.read_contacts).toBe(false);
      expect(scope.communication.send_messages).toBe(false);
      expect(scope.sharing.share_with_others).toBe(false);
      expect(scope.memory.memory_discovery).toBe(false);
    });
  });
  
  describe('Global Instance', () => {
    it('should provide global consent verification instance', async () => {
      const consent = createTestConsent();
      const request = createTestRequest();
      
      const result = await consentVerification.verifyConsent(request, [consent]);
      
      expect(result.granted).toBe(true);
    });
  });
});