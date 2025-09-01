/**
 * Consent verification service for data sharing operations
 * Requirement 16.1.1: Create consent verification before data sharing operations
 */

import { 
  Consent, 
  ConsentScope, 
  ConsentTarget, 
  DataAccessPermissions,
  CommunicationPermissions,
  SharingPermissions,
  MemoryPermissions
} from '../../types/data-models';

/**
 * Data sharing operation types
 */
export type DataSharingOperation = 
  | 'read_content'
  | 'read_contacts'
  | 'read_projects'
  | 'read_memories'
  | 'send_messages'
  | 'initiate_collaboration'
  | 'suggest_contacts'
  | 'send_legacy_messages'
  | 'share_with_others'
  | 'export_data'
  | 'create_public_links'
  | 'memory_discovery'
  | 'link_memories'
  | 'suggest_conversations';

/**
 * Consent verification request
 */
export interface ConsentVerificationRequest {
  /** User ID requesting the operation */
  requesting_user_id: string;
  
  /** Target user ID whose data is being accessed */
  target_user_id: string;
  
  /** Operation being performed */
  operation: DataSharingOperation;
  
  /** Target of the operation (contact, group, project, etc.) */
  target: ConsentTarget;
  
  /** Additional context for the operation */
  context?: string;
  
  /** Timestamp of the request */
  requested_at: Date;
}

/**
 * Consent verification result
 */
export interface ConsentVerificationResult {
  /** Whether consent is granted */
  granted: boolean;
  
  /** Reason for denial (if not granted) */
  denial_reason?: string;
  
  /** Applicable consent record */
  consent?: Consent;
  
  /** Verification timestamp */
  verified_at: Date;
  
  /** Expiration time for this verification */
  expires_at?: Date;
}

/**
 * Consent verification error types
 */
export class ConsentVerificationError extends Error {
  constructor(
    message: string,
    public code: 'NO_CONSENT' | 'EXPIRED_CONSENT' | 'REVOKED_CONSENT' | 'INSUFFICIENT_PERMISSIONS' | 'INVALID_TARGET',
    public details?: any
  ) {
    super(message);
    this.name = 'ConsentVerificationError';
  }
}

/**
 * Consent verification service
 */
export class ConsentVerificationService {
  private consentCache = new Map<string, ConsentVerificationResult>();
  private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  
  /**
   * Verifies consent for a data sharing operation
   */
  async verifyConsent(
    request: ConsentVerificationRequest,
    consents: Consent[]
  ): Promise<ConsentVerificationResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.consentCache.get(cacheKey);
    
    if (cached && cached.expires_at && cached.expires_at > new Date()) {
      return cached;
    }
    
    // Find applicable consents
    const applicableConsents = this.findApplicableConsents(request, consents);
    
    if (applicableConsents.length === 0) {
      const result: ConsentVerificationResult = {
        granted: false,
        denial_reason: 'No applicable consent found',
        verified_at: new Date()
      };
      
      this.cacheResult(cacheKey, result);
      return result;
    }
    
    // Check each applicable consent
    for (const consent of applicableConsents) {
      const verification = await this.verifySpecificConsent(request, consent);
      
      if (verification.granted) {
        this.cacheResult(cacheKey, verification);
        return verification;
      }
    }
    
    // No valid consent found
    const result: ConsentVerificationResult = {
      granted: false,
      denial_reason: 'No valid consent for this operation',
      verified_at: new Date()
    };
    
    this.cacheResult(cacheKey, result);
    return result;
  }
  
  /**
   * Verifies consent and throws error if not granted
   */
  async requireConsent(
    request: ConsentVerificationRequest,
    consents: Consent[]
  ): Promise<Consent> {
    const result = await this.verifyConsent(request, consents);
    
    if (!result.granted) {
      throw new ConsentVerificationError(
        result.denial_reason || 'Consent verification failed',
        'NO_CONSENT',
        { request, result }
      );
    }
    
    return result.consent!;
  }
  
  /**
   * Finds consents that might apply to the request
   */
  private findApplicableConsents(
    request: ConsentVerificationRequest,
    consents: Consent[]
  ): Consent[] {
    return consents.filter(consent => {
      // Must be active
      if (consent.status !== 'active') {
        return false;
      }
      
      // Must not be expired
      if (consent.expires_at && consent.expires_at <= new Date()) {
        return false;
      }
      
      // Must apply to the target
      if (!this.doesConsentApplyToTarget(consent, request.target)) {
        return false;
      }
      
      // Must have permission for the operation
      return this.hasPermissionForOperation(consent.scope, request.operation);
    });
  }
  
  /**
   * Verifies a specific consent record
   */
  private async verifySpecificConsent(
    request: ConsentVerificationRequest,
    consent: Consent
  ): Promise<ConsentVerificationResult> {
    // Check if consent is still active
    if (consent.status !== 'active') {
      return {
        granted: false,
        denial_reason: `Consent is ${consent.status}`,
        consent,
        verified_at: new Date()
      };
    }
    
    // Check expiration
    if (consent.expires_at && consent.expires_at <= new Date()) {
      return {
        granted: false,
        denial_reason: 'Consent has expired',
        consent,
        verified_at: new Date()
      };
    }
    
    // Check if consent applies to target
    if (!this.doesConsentApplyToTarget(consent, request.target)) {
      return {
        granted: false,
        denial_reason: 'Consent does not apply to this target',
        consent,
        verified_at: new Date()
      };
    }
    
    // Check permissions
    if (!this.hasPermissionForOperation(consent.scope, request.operation)) {
      return {
        granted: false,
        denial_reason: 'Insufficient permissions for this operation',
        consent,
        verified_at: new Date()
      };
    }
    
    // All checks passed
    return {
      granted: true,
      consent,
      verified_at: new Date(),
      expires_at: consent.expires_at
    };
  }
  
  /**
   * Checks if consent applies to the target
   */
  private doesConsentApplyToTarget(consent: Consent, target: ConsentTarget): boolean {
    // Exact match
    if (consent.applies_to.type === target.type && consent.applies_to.target_id === target.target_id) {
      return true;
    }
    
    // System-wide consent applies to everything
    if (consent.applies_to.type === 'system') {
      return true;
    }
    
    // Contact group consent applies to individual contacts in the group
    if (consent.applies_to.type === 'contact_group' && target.type === 'contact') {
      // This would require checking if the contact is in the group
      // For now, we'll return false and require explicit implementation
      return false;
    }
    
    return false;
  }
  
  /**
   * Checks if consent scope includes permission for the operation
   */
  private hasPermissionForOperation(scope: ConsentScope, operation: DataSharingOperation): boolean {
    switch (operation) {
      // Data access permissions
      case 'read_content':
        return scope.data_access.read_content;
      case 'read_contacts':
        return scope.data_access.read_contacts;
      case 'read_projects':
        return scope.data_access.read_projects;
      case 'read_memories':
        return scope.data_access.read_memories;
      
      // Communication permissions
      case 'send_messages':
        return scope.communication.send_messages;
      case 'initiate_collaboration':
        return scope.communication.initiate_collaboration;
      case 'suggest_contacts':
        return scope.communication.suggest_contacts;
      case 'send_legacy_messages':
        return scope.communication.send_legacy_messages;
      
      // Sharing permissions
      case 'share_with_others':
        return scope.sharing.share_with_others;
      case 'export_data':
        return scope.sharing.export_data;
      case 'create_public_links':
        return scope.sharing.create_public_links;
      
      // Memory permissions
      case 'memory_discovery':
        return scope.memory.memory_discovery;
      case 'link_memories':
        return scope.memory.link_memories;
      case 'suggest_conversations':
        return scope.memory.suggest_conversations;
      
      default:
        return false;
    }
  }
  
  /**
   * Generates cache key for consent verification
   */
  private generateCacheKey(request: ConsentVerificationRequest): string {
    return `${request.requesting_user_id}:${request.target_user_id}:${request.operation}:${request.target.type}:${request.target.target_id}`;
  }
  
  /**
   * Caches verification result
   */
  private cacheResult(key: string, result: ConsentVerificationResult): void {
    const expiresAt = new Date(Date.now() + this.cacheExpiryMs);
    this.consentCache.set(key, {
      ...result,
      expires_at: result.expires_at ? 
        (result.expires_at < expiresAt ? result.expires_at : expiresAt) : 
        expiresAt
    });
  }
  
  /**
   * Clears consent cache
   */
  clearCache(): void {
    this.consentCache.clear();
  }
  
  /**
   * Clears expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, result] of this.consentCache.entries()) {
      if (result.expires_at && result.expires_at <= now) {
        this.consentCache.delete(key);
      }
    }
  }
  
  /**
   * Creates a comprehensive consent scope with all permissions
   */
  static createFullAccessScope(): ConsentScope {
    return {
      data_access: {
        read_content: true,
        read_contacts: true,
        read_projects: true,
        read_memories: true
      },
      communication: {
        send_messages: true,
        initiate_collaboration: true,
        suggest_contacts: true,
        send_legacy_messages: true
      },
      sharing: {
        share_with_others: true,
        export_data: true,
        create_public_links: true
      },
      memory: {
        memory_discovery: true,
        link_memories: true,
        suggest_conversations: true
      }
    };
  }
  
  /**
   * Creates a minimal consent scope with basic permissions
   */
  static createMinimalScope(): ConsentScope {
    return {
      data_access: {
        read_content: false,
        read_contacts: false,
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
    };
  }
}

/**
 * Global consent verification service instance
 */
export const consentVerification = new ConsentVerificationService();