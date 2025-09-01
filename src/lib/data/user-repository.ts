/**
 * User repository for managing user data and relationships
 * Implements CRUD operations with encryption and consent validation
 */

import { 
  User, 
  Contact, 
  ContactGroup, 
  Consent, 
  RawContactDetails,
  ConsentScope,
  ConsentTarget,
  ConsentDetails,
  RelationshipType,
  GraphNode,
  GraphRelationship
} from '../../types/data-models';
import { contactEncryption } from './encryption';

/**
 * User creation data
 */
export interface CreateUserData {
  user_role: 'senior' | 'architect';
  display_name: string;
  email: string;
  language: string;
  timezone: string;
}

/**
 * Contact creation data
 */
export interface CreateContactData {
  contact_details: RawContactDetails;
  relationship_type: RelationshipType;
  password: string; // For encryption
}

/**
 * Contact group creation data
 */
export interface CreateContactGroupData {
  name: string;
  description?: string;
  color: string;
}

/**
 * Consent creation data
 */
export interface CreateConsentData {
  scope: ConsentScope;
  applies_to: ConsentTarget;
  details: ConsentDetails;
  expires_at?: Date;
}

/**
 * User repository implementation
 * Requirement 10.1: Create User node in Graph RAG with required properties
 */
export class UserRepository {
  private users: Map<string, User> = new Map();
  private contacts: Map<string, Contact> = new Map();
  private contactGroups: Map<string, ContactGroup> = new Map();
  private consents: Map<string, Consent> = new Map();
  
  /**
   * Creates a new user
   * Requirement 10.1: Create User node with all required properties
   */
  async createUser(data: CreateUserData): Promise<User> {
    const id = this.generateId();
    const now = new Date();
    
    const user: User = {
      id,
      user_role: data.user_role,
      profile: {
        display_name: data.display_name,
        email: data.email,
        language: data.language,
        timezone: data.timezone,
        preferences: {
          theme: 'auto',
          layout: 'auto',
          notifications: {
            email_enabled: true,
            push_enabled: true,
            collaboration_enabled: true,
            memory_discovery_enabled: true
          },
          privacy: {
            allow_memory_discovery: true,
            allow_contact_suggestions: true,
            data_retention_days: 365
          }
        }
      },
      contacts: [],
      consents: [],
      created_at: now,
      updated_at: now,
      status: 'active'
    };
    
    this.users.set(id, user);
    return user;
  }
  
  /**
   * Gets a user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
  
  /**
   * Gets a user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.profile.email === email) {
        return user;
      }
    }
    return null;
  }
  
  /**
   * Updates a user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      updated_at: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  /**
   * Creates a new contact for a user
   * Requirement 10.2: Create Contact node with encrypted contactDetails
   */
  async createContact(
    userId: string, 
    data: CreateContactData
  ): Promise<Contact | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const id = this.generateId();
    const now = new Date();
    
    // Encrypt contact details
    const encryptedDetails = await contactEncryption.encryptContactDetails(
      data.contact_details,
      data.password
    );
    
    const contact: Contact = {
      id,
      owner_id: userId,
      contact_details: encryptedDetails,
      groups: [],
      relationship_type: data.relationship_type,
      created_at: now,
      updated_at: now,
      status: 'active'
    };
    
    this.contacts.set(id, contact);
    
    // Add to user's contacts
    user.contacts.push(contact);
    user.updated_at = now;
    
    return contact;
  }
  
  /**
   * Gets a contact by ID
   */
  async getContactById(id: string): Promise<Contact | null> {
    return this.contacts.get(id) || null;
  }
  
  /**
   * Gets all contacts for a user
   */
  async getContactsByUserId(userId: string): Promise<Contact[]> {
    const user = this.users.get(userId);
    return user ? user.contacts : [];
  }
  
  /**
   * Decrypts contact details
   */
  async decryptContactDetails(
    contactId: string, 
    password: string
  ): Promise<RawContactDetails | null> {
    const contact = this.contacts.get(contactId);
    if (!contact) return null;
    
    try {
      return await contactEncryption.decryptContactDetails(
        contact.contact_details,
        password
      );
    } catch (error) {
      console.error('Failed to decrypt contact details:', error);
      return null;
    }
  }
  
  /**
   * Creates a new contact group
   * Requirement 10.3: Create ContactGroup node
   */
  async createContactGroup(
    userId: string,
    data: CreateContactGroupData
  ): Promise<ContactGroup | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const id = this.generateId();
    const now = new Date();
    
    const group: ContactGroup = {
      id,
      owner_id: userId,
      name: data.name,
      description: data.description,
      color: data.color,
      members: [],
      created_at: now,
      updated_at: now
    };
    
    this.contactGroups.set(id, group);
    return group;
  }
  
  /**
   * Adds a contact to a group
   * Requirement 10.3: IS_MEMBER_OF relationship
   */
  async addContactToGroup(
    contactId: string,
    groupId: string
  ): Promise<boolean> {
    const contact = this.contacts.get(contactId);
    const group = this.contactGroups.get(groupId);
    
    if (!contact || !group) return false;
    
    // Check if contact is already in group
    if (contact.groups.some(g => g.id === groupId)) return true;
    
    // Add contact to group
    group.members.push(contact);
    contact.groups.push(group);
    
    // Update timestamps
    const now = new Date();
    group.updated_at = now;
    contact.updated_at = now;
    
    return true;
  }
  
  /**
   * Creates a new consent
   * Requirement 10.4: Create Consent node with specific scope and status
   */
  async createConsent(
    userId: string,
    data: CreateConsentData
  ): Promise<Consent | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const id = this.generateId();
    const now = new Date();
    
    const consent: Consent = {
      id,
      user_id: userId,
      scope: data.scope,
      status: 'active',
      applies_to: data.applies_to,
      details: data.details,
      granted_at: now,
      expires_at: data.expires_at,
      updated_at: now
    };
    
    this.consents.set(id, consent);
    
    // Add to user's consents
    user.consents.push(consent);
    user.updated_at = now;
    
    return consent;
  }
  
  /**
   * Validates consent for a specific action
   * Requirement 10.5: Verify active consent chain before data sharing
   */
  async validateConsent(
    userId: string,
    targetType: 'contact' | 'contact_group' | 'project' | 'system',
    targetId: string,
    requiredPermissions: string[]
  ): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // Find applicable consents
    const applicableConsents = user.consents.filter(consent => 
      consent.status === 'active' &&
      consent.applies_to.type === targetType &&
      consent.applies_to.target_id === targetId &&
      (!consent.expires_at || consent.expires_at > new Date())
    );
    
    if (applicableConsents.length === 0) return false;
    
    // Check if any consent covers all required permissions
    return applicableConsents.some(consent => 
      this.consentCoversPermissions(consent, requiredPermissions)
    );
  }
  
  /**
   * Revokes a consent
   */
  async revokeConsent(consentId: string): Promise<boolean> {
    const consent = this.consents.get(consentId);
    if (!consent) return false;
    
    consent.status = 'revoked';
    consent.revoked_at = new Date();
    consent.updated_at = new Date();
    
    return true;
  }
  
  /**
   * Gets all consents for a user
   */
  async getConsentsByUserId(userId: string): Promise<Consent[]> {
    const user = this.users.get(userId);
    return user ? user.consents : [];
  }
  
  /**
   * Gets active consents for a specific target
   */
  async getActiveConsentsForTarget(
    userId: string,
    targetType: string,
    targetId: string
  ): Promise<Consent[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    return user.consents.filter(consent =>
      consent.status === 'active' &&
      consent.applies_to.type === targetType &&
      consent.applies_to.target_id === targetId &&
      (!consent.expires_at || consent.expires_at > new Date())
    );
  }
  
  /**
   * Checks if a consent covers the required permissions
   */
  private consentCoversPermissions(
    consent: Consent,
    requiredPermissions: string[]
  ): boolean {
    const scope = consent.scope;
    
    return requiredPermissions.every(permission => {
      const [category, action] = permission.split('.');
      
      switch (category) {
        case 'data_access':
          return (scope.data_access as any)[action] === true;
        case 'communication':
          return (scope.communication as any)[action] === true;
        case 'sharing':
          return (scope.sharing as any)[action] === true;
        case 'memory':
          return (scope.memory as any)[action] === true;
        default:
          return false;
      }
    });
  }
  
  /**
   * Generates a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Clears all data (for testing)
   */
  async clear(): Promise<void> {
    this.users.clear();
    this.contacts.clear();
    this.contactGroups.clear();
    this.consents.clear();
  }
}

/**
 * Global user repository instance
 */
export const userRepository = new UserRepository();