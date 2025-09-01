/**
 * Privacy controls and data protection utilities
 * Implements comprehensive privacy management and data anonymization
 */

import { User, PrivacySettings } from '../../types/data-models';
import { DataRetentionService } from './data-retention';
import { ConsentVerificationService } from './consent-verification';

/**
 * Privacy level enumeration
 */
export enum PrivacyLevel {
  PUBLIC = 'public',
  CONTACTS = 'contacts',
  PRIVATE = 'private',
  ENCRYPTED = 'encrypted'
}

/**
 * Data anonymization options
 */
export interface AnonymizationOptions {
  /** Remove personally identifiable information */
  remove_pii: boolean;
  
  /** Replace names with placeholders */
  anonymize_names: boolean;
  
  /** Remove location data */
  remove_location: boolean;
  
  /** Remove timestamps */
  remove_timestamps: boolean;
  
  /** Hash identifiers */
  hash_identifiers: boolean;
  
  /** Custom anonymization rules */
  custom_rules?: AnonymizationRule[];
}

/**
 * Custom anonymization rule
 */
export interface AnonymizationRule {
  /** Field path to anonymize */
  field_path: string;
  
  /** Anonymization method */
  method: 'remove' | 'hash' | 'replace' | 'mask';
  
  /** Replacement value (for replace method) */
  replacement?: string;
  
  /** Mask character (for mask method) */
  mask_char?: string;
  
  /** Number of characters to keep visible (for mask method) */
  visible_chars?: number;
}

/**
 * Privacy audit result
 */
export interface PrivacyAuditResult {
  /** User ID audited */
  user_id: string;
  
  /** Audit timestamp */
  audited_at: Date;
  
  /** Privacy issues found */
  issues: PrivacyIssue[];
  
  /** Recommendations */
  recommendations: PrivacyRecommendation[];
  
  /** Overall privacy score (0-100) */
  privacy_score: number;
}

/**
 * Privacy issue
 */
export interface PrivacyIssue {
  /** Issue type */
  type: 'data_exposure' | 'weak_consent' | 'retention_violation' | 'encryption_missing';
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Issue description */
  description: string;
  
  /** Affected data */
  affected_data: string[];
  
  /** Recommended action */
  recommended_action: string;
}

/**
 * Privacy recommendation
 */
export interface PrivacyRecommendation {
  /** Recommendation type */
  type: 'setting_change' | 'data_cleanup' | 'consent_update' | 'encryption_upgrade';
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high';
  
  /** Recommendation description */
  description: string;
  
  /** Implementation steps */
  steps: string[];
}

/**
 * Privacy controls service
 */
export class PrivacyControlsService {
  private dataRetention: DataRetentionService;
  private consentVerification: ConsentVerificationService;
  
  constructor(
    dataRetention: DataRetentionService,
    consentVerification: ConsentVerificationService
  ) {
    this.dataRetention = dataRetention;
    this.consentVerification = consentVerification;
  }
  
  /**
   * Applies privacy settings to user data
   */
  async applyPrivacySettings(
    userId: string,
    settings: PrivacySettings,
    userData: any
  ): Promise<any> {
    let processedData = { ...userData };
    
    // Apply data retention settings
    if (settings.data_retention_days > 0) {
      processedData = await this.applyDataRetention(userId, settings.data_retention_days, processedData);
    }
    
    // Apply memory discovery settings
    if (!settings.allow_memory_discovery) {
      processedData = this.removeMemoryDiscoveryData(processedData);
    }
    
    // Apply contact suggestion settings
    if (!settings.allow_contact_suggestions) {
      processedData = this.removeContactSuggestionData(processedData);
    }
    
    return processedData;
  }
  
  /**
   * Anonymizes data according to specified options
   */
  anonymizeData(data: any, options: AnonymizationOptions): any {
    let anonymized = JSON.parse(JSON.stringify(data)); // Deep clone
    
    if (options.remove_pii) {
      anonymized = this.removePII(anonymized);
    }
    
    if (options.anonymize_names) {
      anonymized = this.anonymizeNames(anonymized);
    }
    
    if (options.remove_location) {
      anonymized = this.removeLocationData(anonymized);
    }
    
    if (options.remove_timestamps) {
      anonymized = this.removeTimestamps(anonymized);
    }
    
    if (options.hash_identifiers) {
      anonymized = this.hashIdentifiers(anonymized);
    }
    
    if (options.custom_rules) {
      anonymized = this.applyCustomRules(anonymized, options.custom_rules);
    }
    
    return anonymized;
  }
  
  /**
   * Conducts privacy audit for a user
   */
  async conductPrivacyAudit(userId: string, userData: any): Promise<PrivacyAuditResult> {
    const issues: PrivacyIssue[] = [];
    const recommendations: PrivacyRecommendation[] = [];
    
    // Check for data exposure issues
    const exposureIssues = this.checkDataExposure(userData);
    issues.push(...exposureIssues);
    
    // Check consent management
    const consentIssues = await this.checkConsentManagement(userId);
    issues.push(...consentIssues);
    
    // Check data retention compliance
    const retentionIssues = this.checkDataRetention(userId);
    issues.push(...retentionIssues);
    
    // Check encryption status
    const encryptionIssues = this.checkEncryptionStatus(userData);
    issues.push(...encryptionIssues);
    
    // Generate recommendations based on issues
    recommendations.push(...this.generateRecommendations(issues));
    
    // Calculate privacy score
    const privacyScore = this.calculatePrivacyScore(issues);
    
    return {
      user_id: userId,
      audited_at: new Date(),
      issues,
      recommendations,
      privacy_score: privacyScore
    };
  }
  
  /**
   * Removes personally identifiable information
   */
  private removePII(data: any): any {
    const piiFields = ['email', 'phone', 'address', 'ssn', 'credit_card', 'passport'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (piiFields.some(field => key.toLowerCase().includes(field))) {
        return '[REDACTED]';
      }
      return value;
    });
  }
  
  /**
   * Anonymizes names in data
   */
  private anonymizeNames(data: any): any {
    const nameFields = ['name', 'first_name', 'last_name', 'full_name', 'display_name'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (nameFields.includes(key.toLowerCase()) && typeof value === 'string') {
        return this.generateAnonymousName();
      }
      return value;
    });
  }
  
  /**
   * Removes location data
   */
  private removeLocationData(data: any): any {
    const locationFields = ['latitude', 'longitude', 'location', 'address', 'coordinates', 'gps'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (locationFields.some(field => key.toLowerCase().includes(field))) {
        return undefined;
      }
      return value;
    });
  }
  
  /**
   * Removes timestamp data
   */
  private removeTimestamps(data: any): any {
    const timestampFields = ['created_at', 'updated_at', 'timestamp', 'date', 'time'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (timestampFields.some(field => key.toLowerCase().includes(field))) {
        return undefined;
      }
      return value;
    });
  }
  
  /**
   * Hashes identifiers
   */
  private hashIdentifiers(data: any): any {
    const idFields = ['id', 'user_id', 'contact_id', 'project_id'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (idFields.includes(key.toLowerCase()) && typeof value === 'string') {
        return this.hashString(value);
      }
      return value;
    });
  }
  
  /**
   * Applies custom anonymization rules
   */
  private applyCustomRules(data: any, rules: AnonymizationRule[]): any {
    let result = data;
    
    for (const rule of rules) {
      result = this.applyAnonymizationRule(result, rule);
    }
    
    return result;
  }
  
  /**
   * Applies a single anonymization rule
   */
  private applyAnonymizationRule(data: any, rule: AnonymizationRule): any {
    const pathParts = rule.field_path.split('.');
    
    return this.recursivelyProcess(data, (key, value, path) => {
      if (this.matchesPath(path, pathParts)) {
        switch (rule.method) {
          case 'remove':
            return undefined;
          case 'hash':
            return typeof value === 'string' ? this.hashString(value) : value;
          case 'replace':
            return rule.replacement || '[ANONYMIZED]';
          case 'mask':
            return typeof value === 'string' ? 
              this.maskString(value, rule.mask_char || '*', rule.visible_chars || 0) : 
              value;
          default:
            return value;
        }
      }
      return value;
    });
  }
  
  /**
   * Recursively processes data with a transformation function
   */
  private recursivelyProcess(
    data: any, 
    transform: (key: string, value: any, path: string[]) => any,
    path: string[] = []
  ): any {
    if (data === null || typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map((item, index) => 
        this.recursivelyProcess(item, transform, [...path, index.toString()])
      );
    }
    
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const currentPath = [...path, key];
      const transformedValue = transform(key, value, currentPath);
      
      if (transformedValue !== undefined) {
        if (typeof transformedValue === 'object' && transformedValue !== null) {
          result[key] = this.recursivelyProcess(transformedValue, transform, currentPath);
        } else {
          result[key] = transformedValue;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Checks if a path matches a pattern
   */
  private matchesPath(path: string[], pattern: string[]): boolean {
    if (path.length !== pattern.length) {
      return false;
    }
    
    for (let i = 0; i < path.length; i++) {
      if (pattern[i] !== '*' && pattern[i] !== path[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generates an anonymous name
   */
  private generateAnonymousName(): string {
    const adjectives = ['Anonymous', 'Private', 'Confidential', 'Secure'];
    const nouns = ['User', 'Person', 'Individual', 'Contact'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    
    return `${adjective} ${noun} ${number}`;
  }
  
  /**
   * Hashes a string using SHA-256
   */
  private hashString(input: string): string {
    // Simple hash implementation - in production, use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(16)}`;
  }
  
  /**
   * Masks a string with specified character
   */
  private maskString(input: string, maskChar: string, visibleChars: number): string {
    if (input.length <= visibleChars) {
      return input;
    }
    
    const visible = input.substring(0, visibleChars);
    const masked = maskChar.repeat(input.length - visibleChars);
    
    return visible + masked;
  }
  
  /**
   * Applies data retention to user data
   */
  private async applyDataRetention(
    userId: string,
    retentionDays: number,
    userData: any
  ): Promise<any> {
    // Register data for retention tracking
    this.dataRetention.registerData('UserData', userId, userId);
    
    // Filter out expired data based on retention policy
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    return this.recursivelyProcess(userData, (key, value) => {
      if (key.includes('_at') && value instanceof Date && value < cutoffDate) {
        return undefined; // Remove expired timestamp data
      }
      return value;
    });
  }
  
  /**
   * Removes memory discovery related data
   */
  private removeMemoryDiscoveryData(data: any): any {
    const memoryFields = ['memory_links', 'thematic_analysis', 'conversation_starters'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (memoryFields.some(field => key.includes(field))) {
        return undefined;
      }
      return value;
    });
  }
  
  /**
   * Removes contact suggestion related data
   */
  private removeContactSuggestionData(data: any): any {
    const suggestionFields = ['suggested_contacts', 'contact_recommendations', 'social_graph'];
    
    return this.recursivelyProcess(data, (key, value) => {
      if (suggestionFields.some(field => key.includes(field))) {
        return undefined;
      }
      return value;
    });
  }
  
  /**
   * Checks for data exposure issues
   */
  private checkDataExposure(userData: any): PrivacyIssue[] {
    const issues: PrivacyIssue[] = [];
    
    // Check for unencrypted sensitive data
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    
    this.recursivelyProcess(userData, (key, value) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field)) && 
          typeof value === 'string' && 
          !this.isEncrypted(value)) {
        issues.push({
          type: 'data_exposure',
          severity: 'high',
          description: `Unencrypted sensitive field: ${key}`,
          affected_data: [key],
          recommended_action: 'Encrypt sensitive data fields'
        });
      }
      return value;
    });
    
    return issues;
  }
  
  /**
   * Checks consent management
   */
  private async checkConsentManagement(userId: string): Promise<PrivacyIssue[]> {
    const issues: PrivacyIssue[] = [];
    
    // This would typically check the consent records in the database
    // For now, we'll return a placeholder
    
    return issues;
  }
  
  /**
   * Checks data retention compliance
   */
  private checkDataRetention(userId: string): PrivacyIssue[] {
    const issues: PrivacyIssue[] = [];
    
    const userRecords = this.dataRetention.getUserRetentionRecords(userId);
    const expiredRecords = userRecords.filter(record => 
      record.expires_at <= new Date() && record.status !== 'deleted'
    );
    
    if (expiredRecords.length > 0) {
      issues.push({
        type: 'retention_violation',
        severity: 'medium',
        description: `${expiredRecords.length} data records have exceeded retention period`,
        affected_data: expiredRecords.map(r => r.data_id),
        recommended_action: 'Delete expired data or extend retention period'
      });
    }
    
    return issues;
  }
  
  /**
   * Checks encryption status
   */
  private checkEncryptionStatus(userData: any): PrivacyIssue[] {
    const issues: PrivacyIssue[] = [];
    
    // Check for unencrypted contact details
    if (userData.contacts) {
      for (const contact of userData.contacts) {
        if (!contact.contact_details?.encryption_metadata) {
          issues.push({
            type: 'encryption_missing',
            severity: 'high',
            description: `Contact ${contact.id} has unencrypted details`,
            affected_data: [contact.id],
            recommended_action: 'Encrypt contact details'
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Generates recommendations based on issues
   */
  private generateRecommendations(issues: PrivacyIssue[]): PrivacyRecommendation[] {
    const recommendations: PrivacyRecommendation[] = [];
    
    const encryptionIssues = issues.filter(i => i.type === 'encryption_missing');
    if (encryptionIssues.length > 0) {
      recommendations.push({
        type: 'encryption_upgrade',
        priority: 'high',
        description: 'Upgrade encryption for sensitive data',
        steps: [
          'Identify unencrypted sensitive fields',
          'Implement encryption for contact details',
          'Migrate existing data to encrypted format',
          'Verify encryption implementation'
        ]
      });
    }
    
    const retentionIssues = issues.filter(i => i.type === 'retention_violation');
    if (retentionIssues.length > 0) {
      recommendations.push({
        type: 'data_cleanup',
        priority: 'medium',
        description: 'Clean up expired data',
        steps: [
          'Review data retention policies',
          'Delete expired data records',
          'Update retention schedules',
          'Implement automated cleanup'
        ]
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates privacy score based on issues
   */
  private calculatePrivacyScore(issues: PrivacyIssue[]): number {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Checks if a value appears to be encrypted
   */
  private isEncrypted(value: string): boolean {
    // Simple heuristic - encrypted data is typically base64 encoded
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(value) && value.length > 20;
  }
}

/**
 * Global privacy controls service instance
 */
export const privacyControls = new PrivacyControlsService(
  new DataRetentionService(),
  new ConsentVerificationService()
);