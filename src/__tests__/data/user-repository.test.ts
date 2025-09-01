/**
 * Unit tests for user repository functionality
 * Tests CRUD operations, encryption, and consent validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserRepository } from '../../lib/data/user-repository';
import type { 
  CreateUserData, 
  CreateContactData, 
  CreateContactGroupData,
  CreateConsentData,
  ConsentScope,
  ConsentTarget,
  ConsentDetails
} from '../../lib/data/user-repository';

describe('UserRepository', () => {
  let repository: UserRepository;
  
  beforeEach(async () => {
    repository = new UserRepository();
    await repository.clear();
  });
  
  describe('User Management', () => {
    const sampleUserData: CreateUserData = {
      user_role: 'senior',
      display_name: 'John Doe',
      email: 'john.doe@example.com',
      language: 'en',
      timezone: 'America/New_York'
    };
    
    it('should create a new user with all required properties', async () => {
      const user = await repository.createUser(sampleUserData);
      
      expect(user.id).toBeDefined();
      expect(user.user_role).toBe('senior');
      expect(user.profile.display_name).toBe('John Doe');
      expect(user.profile.email).toBe('john.doe@example.com');
      expect(user.contacts).toEqual([]);
      expect(user.consents).toEqual([]);
      expect(user.status).toBe('active');
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
    
    it('should set default preferences for new users', async () => {
      const user = await repository.createUser(sampleUserData);
      
      expect(user.profile.preferences.theme).toBe('auto');
      expect(user.profile.preferences.layout).toBe('auto');
      expect(user.profile.preferences.notifications.email_enabled).toBe(true);
      expect(user.profile.preferences.privacy.allow_memory_discovery).toBe(true);
    });
    
    it('should retrieve user by ID', async () => {
      const user = await repository.createUser(sampleUserData);
      const retrieved = await repository.getUserById(user.id);
      
      expect(retrieved).toEqual(user);
    });
    
    it('should retrieve user by email', async () => {
      const user = await repository.createUser(sampleUserData);
      const retrieved = await repository.getUserByEmail(user.profile.email);
      
      expect(retrieved).toEqual(user);
    });
    
    it('should return null for non-existent user', async () => {
      const retrieved = await repository.getUserById('non-existent');
      expect(retrieved).toBeNull();
    });
    
    it('should update user properties', async () => {
      const user = await repository.createUser(sampleUserData);
      const originalUpdatedAt = user.updated_at;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await repository.updateUser(user.id, {
        status: 'inactive'
      });
      
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('inactive');
      expect(updated!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
  
  describe('Contact Management', () => {
    let userId: string;
    
    beforeEach(async () => {
      const user = await repository.createUser({
        user_role: 'senior',
        display_name: 'Test User',
        email: 'test@example.com',
        language: 'en',
        timezone: 'UTC'
      });
      userId = user.id;
    });
    
    const sampleContactData: CreateContactData = {
      contact_details: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-123-4567'
      },
      relationship_type: 'friend',
      password: 'encryption-password'
    };
    
    it('should create a contact with encrypted details', async () => {
      const contact = await repository.createContact(userId, sampleContactData);
      
      expect(contact).not.toBeNull();
      expect(contact!.id).toBeDefined();
      expect(contact!.owner_id).toBe(userId);
      expect(contact!.relationship_type).toBe('friend');
      expect(contact!.status).toBe('active');
      
      // Contact details should be encrypted
      expect(contact!.contact_details.encrypted_name).toBeDefined();
      expect(contact!.contact_details.encrypted_name).not.toBe('Jane Smith');
      expect(contact!.contact_details.encryption_metadata).toBeDefined();
    });
    
    it('should add contact to user\'s contact list', async () => {
      const contact = await repository.createContact(userId, sampleContactData);
      const user = await repository.getUserById(userId);
      
      expect(user!.contacts).toHaveLength(1);
      expect(user!.contacts[0].id).toBe(contact!.id);
    });
    
    it('should decrypt contact details with correct password', async () => {
      const contact = await repository.createContact(userId, sampleContactData);
      const decrypted = await repository.decryptContactDetails(
        contact!.id,
        'encryption-password'
      );
      
      expect(decrypted).toEqual(sampleContactData.contact_details);
    });
    
    it('should fail to decrypt with wrong password', async () => {
      const contact = await repository.createContact(userId, sampleContactData);
      const decrypted = await repository.decryptContactDetails(
        contact!.id,
        'wrong-password'
      );
      
      expect(decrypted).toBeNull();
    });
    
    it('should retrieve contacts by user ID', async () => {
      await repository.createContact(userId, sampleContactData);
      await repository.createContact(userId, {
        ...sampleContactData,
        contact_details: { name: 'Bob Wilson' },
        relationship_type: 'colleague'
      });
      
      const contacts = await repository.getContactsByUserId(userId);
      expect(contacts).toHaveLength(2);
    });
  });
  
  describe('Contact Group Management', () => {
    let userId: string;
    let contactId: string;
    
    beforeEach(async () => {
      const user = await repository.createUser({
        user_role: 'senior',
        display_name: 'Test User',
        email: 'test@example.com',
        language: 'en',
        timezone: 'UTC'
      });
      userId = user.id;
      
      const contact = await repository.createContact(userId, {
        contact_details: { name: 'Test Contact' },
        relationship_type: 'friend',
        password: 'password'
      });
      contactId = contact!.id;
    });
    
    const sampleGroupData: CreateContactGroupData = {
      name: 'Family',
      description: 'Family members',
      color: '#ff0000'
    };
    
    it('should create a contact group', async () => {
      const group = await repository.createContactGroup(userId, sampleGroupData);
      
      expect(group).not.toBeNull();
      expect(group!.id).toBeDefined();
      expect(group!.owner_id).toBe(userId);
      expect(group!.name).toBe('Family');
      expect(group!.description).toBe('Family members');
      expect(group!.color).toBe('#ff0000');
      expect(group!.members).toEqual([]);
    });
    
    it('should add contact to group', async () => {
      const group = await repository.createContactGroup(userId, sampleGroupData);
      const success = await repository.addContactToGroup(contactId, group!.id);
      
      expect(success).toBe(true);
      
      const updatedContact = await repository.getContactById(contactId);
      expect(updatedContact!.groups).toHaveLength(1);
      expect(updatedContact!.groups[0].id).toBe(group!.id);
    });
    
    it('should not add contact to group twice', async () => {
      const group = await repository.createContactGroup(userId, sampleGroupData);
      
      await repository.addContactToGroup(contactId, group!.id);
      const success = await repository.addContactToGroup(contactId, group!.id);
      
      expect(success).toBe(true);
      
      const updatedContact = await repository.getContactById(contactId);
      expect(updatedContact!.groups).toHaveLength(1);
    });
  });
  
  describe('Consent Management', () => {
    let userId: string;
    let contactId: string;
    
    beforeEach(async () => {
      const user = await repository.createUser({
        user_role: 'senior',
        display_name: 'Test User',
        email: 'test@example.com',
        language: 'en',
        timezone: 'UTC'
      });
      userId = user.id;
      
      const contact = await repository.createContact(userId, {
        contact_details: { name: 'Test Contact' },
        relationship_type: 'friend',
        password: 'password'
      });
      contactId = contact!.id;
    });
    
    const sampleConsentScope: ConsentScope = {
      data_access: {
        read_content: true,
        read_contacts: false,
        read_projects: true,
        read_memories: false
      },
      communication: {
        send_messages: true,
        initiate_collaboration: true,
        suggest_contacts: false,
        send_legacy_messages: false
      },
      sharing: {
        share_with_others: false,
        export_data: false,
        create_public_links: false
      },
      memory: {
        memory_discovery: true,
        link_memories: true,
        suggest_conversations: true
      }
    };
    
    const sampleConsentTarget: ConsentTarget = {
      type: 'contact',
      target_id: '',
      target_name: 'Test Contact'
    };
    
    const sampleConsentDetails: ConsentDetails = {
      description: 'Permission to access content and collaborate',
      legal_basis: 'Consent',
      purpose: 'Collaboration and content sharing',
      retention_period_days: 365
    };
    
    it('should create a consent', async () => {
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails
      };
      
      const consent = await repository.createConsent(userId, consentData);
      
      expect(consent).not.toBeNull();
      expect(consent!.id).toBeDefined();
      expect(consent!.user_id).toBe(userId);
      expect(consent!.status).toBe('active');
      expect(consent!.scope).toEqual(sampleConsentScope);
      expect(consent!.applies_to.target_id).toBe(contactId);
    });
    
    it('should validate consent for allowed permissions', async () => {
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails
      };
      
      await repository.createConsent(userId, consentData);
      
      const isValid = await repository.validateConsent(
        userId,
        'contact',
        contactId,
        ['data_access.read_content', 'communication.send_messages']
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should reject consent for disallowed permissions', async () => {
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails
      };
      
      await repository.createConsent(userId, consentData);
      
      const isValid = await repository.validateConsent(
        userId,
        'contact',
        contactId,
        ['data_access.read_contacts'] // This is set to false in sampleConsentScope
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should reject consent for non-existent target', async () => {
      const isValid = await repository.validateConsent(
        userId,
        'contact',
        'non-existent-contact',
        ['data_access.read_content']
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should revoke consent', async () => {
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails
      };
      
      const consent = await repository.createConsent(userId, consentData);
      const success = await repository.revokeConsent(consent!.id);
      
      expect(success).toBe(true);
      
      const isValid = await repository.validateConsent(
        userId,
        'contact',
        contactId,
        ['data_access.read_content']
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should handle expired consents', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails,
        expires_at: expiredDate
      };
      
      await repository.createConsent(userId, consentData);
      
      const isValid = await repository.validateConsent(
        userId,
        'contact',
        contactId,
        ['data_access.read_content']
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should get active consents for target', async () => {
      const consentData: CreateConsentData = {
        scope: sampleConsentScope,
        applies_to: { ...sampleConsentTarget, target_id: contactId },
        details: sampleConsentDetails
      };
      
      await repository.createConsent(userId, consentData);
      
      const activeConsents = await repository.getActiveConsentsForTarget(
        userId,
        'contact',
        contactId
      );
      
      expect(activeConsents).toHaveLength(1);
      expect(activeConsents[0].status).toBe('active');
    });
  });
  
  describe('Data Validation', () => {
    it('should handle invalid user creation gracefully', async () => {
      const invalidData = {
        user_role: 'invalid' as any,
        display_name: '',
        email: 'invalid-email',
        language: '',
        timezone: ''
      };
      
      // Repository should still create user but with invalid data
      // In a real implementation, this would include validation
      const user = await repository.createUser(invalidData);
      expect(user.user_role).toBe('invalid');
    });
    
    it('should handle contact creation for non-existent user', async () => {
      const contact = await repository.createContact('non-existent', {
        contact_details: { name: 'Test' },
        relationship_type: 'friend',
        password: 'password'
      });
      
      expect(contact).toBeNull();
    });
    
    it('should handle consent creation for non-existent user', async () => {
      const consent = await repository.createConsent('non-existent', {
        scope: {} as any,
        applies_to: { type: 'contact', target_id: 'test', target_name: 'test' },
        details: {} as any
      });
      
      expect(consent).toBeNull();
    });
  });
});