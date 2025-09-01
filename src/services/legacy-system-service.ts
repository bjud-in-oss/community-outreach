/**
 * Legacy System Service for "Hälsning till Framtiden" Application
 * Implements future message delivery with tactful delivery process
 */

import {
  LegacyContent,
  LegacyTrigger,
  LegacyTriggerType,
  LegacyTriggerConfig,
  TimeBasedTriggerConfig,
  EventBasedTriggerConfig,
  QueryBasedTriggerConfig,
  LegacyRecipient,
  DeliveryAttempt,
  DeliveryResult,
  LegacyContentStatus,
  DeliveryStatus,
  ConsentStatus,
  UserState,
  DigitalExecutor,
  LegacySystemConfig
} from '../types/legacy-system';
import { User, Contact, Consent } from '../types/data-models';

/**
 * Service for managing legacy content and delivery
 * Requirement 23.1-23.4: Complete legacy system implementation
 */
export class LegacySystemService {
  private config: LegacySystemConfig;
  
  constructor(config: LegacySystemConfig) {
    this.config = config;
  }

  /**
   * Create new legacy content
   * Requirement 23.1: Implement LegacyContent creation and trigger definition
   */
  async createLegacyContent(
    creatorId: string,
    contentData: Partial<LegacyContent>
  ): Promise<LegacyContent> {
    // Validate creator permissions
    await this.validateCreatorPermissions(creatorId);
    
    // Check user limits
    await this.checkUserLimits(creatorId);
    
    const legacyContent: LegacyContent = {
      id: this.generateId(),
      creator_id: creatorId,
      title: contentData.title || 'Untitled Legacy Message',
      type: contentData.type || 'text_message',
      content: contentData.content || { text: '' },
      trigger: contentData.trigger || this.createDefaultTrigger(),
      recipients: contentData.recipients || [],
      delivery_settings: contentData.delivery_settings || this.getDefaultDeliverySettings(),
      status: 'draft',
      created_at: new Date(),
      updated_at: new Date(),
      delivery_attempts: []
    };

    // Validate trigger configuration
    await this.validateTrigger(legacyContent.trigger);
    
    // Validate recipients and consent
    await this.validateRecipients(legacyContent.recipients, creatorId);
    
    // Calculate scheduled delivery time if applicable
    if (legacyContent.trigger.type === 'time_based') {
      legacyContent.scheduled_delivery_at = this.calculateDeliveryTime(legacyContent.trigger);
    }
    
    // Save to database (mock implementation)
    await this.saveLegacyContent(legacyContent);
    
    return legacyContent;
  }

  /**
   * Create legacy trigger
   * Requirement 23.2: Create time-based, event-based, and query-based trigger types
   */
  async createTrigger(
    type: LegacyTriggerType,
    config: LegacyTriggerConfig,
    description: string
  ): Promise<LegacyTrigger> {
    const trigger: LegacyTrigger = {
      id: this.generateId(),
      type,
      config,
      description,
      active: true,
      created_at: new Date()
    };

    // Validate trigger configuration
    await this.validateTrigger(trigger);
    
    // Set next evaluation time
    trigger.next_evaluation_at = this.calculateNextEvaluation(trigger);
    
    return trigger;
  }

  /**
   * Create time-based trigger
   * Requirement 23.3: Time-based triggers (specific date)
   */
  createTimeBasedTrigger(
    deliveryDate: Date,
    timezone: string = 'UTC',
    respectRecipientTimezone: boolean = true
  ): LegacyTrigger {
    const config: TimeBasedTriggerConfig = {
      delivery_date: deliveryDate,
      timezone,
      respect_recipient_timezone: respectRecipientTimezone
    };

    return {
      id: this.generateId(),
      type: 'time_based',
      config,
      description: `Deliver on ${deliveryDate.toLocaleDateString()}`,
      active: true,
      created_at: new Date(),
      next_evaluation_at: deliveryDate
    };
  }

  /**
   * Create event-based trigger
   * Requirement 23.3: Event-based triggers (milestone achieved by recipient)
   */
  createEventBasedTrigger(
    eventType: string,
    criteria: Record<string, any>,
    description: string
  ): LegacyTrigger {
    const config: EventBasedTriggerConfig = {
      event_type: eventType as any,
      criteria
    };

    return {
      id: this.generateId(),
      type: 'event_based',
      config,
      description,
      active: true,
      created_at: new Date(),
      next_evaluation_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Check daily
    };
  }

  /**
   * Create query-based trigger
   * Requirement 23.3: Query-based triggers (specific question asked by future user)
   */
  createQueryBasedTrigger(
    queryPatterns: Array<{ pattern: string; type: string; weight: number }>,
    confidenceThreshold: number = 0.8,
    description: string
  ): LegacyTrigger {
    const config: QueryBasedTriggerConfig = {
      query_patterns: queryPatterns.map(p => ({
        pattern: p.pattern,
        type: p.type as any,
        weight: p.weight,
        case_sensitive: false
      })),
      confidence_threshold: confidenceThreshold
    };

    return {
      id: this.generateId(),
      type: 'query_based',
      config,
      description,
      active: true,
      created_at: new Date(),
      next_evaluation_at: new Date(Date.now() + 60 * 60 * 1000) // Check hourly
    };
  }

  /**
   * Evaluate triggers and initiate delivery
   * Requirement 23.4: Tactful delivery process with recipient permission
   */
  async evaluateTriggersAndDeliver(): Promise<void> {
    const activeLegacyContent = await this.getActiveLegacyContent();
    
    for (const content of activeLegacyContent) {
      if (await this.shouldTriggerDelivery(content)) {
        await this.initiateDelivery(content);
      }
    }
  }

  /**
   * Initiate tactful delivery process
   * Requirement 23.4: Tactful delivery process respecting recipient's emotional state
   */
  private async initiateDelivery(content: LegacyContent): Promise<void> {
    for (const recipient of content.recipients) {
      if (recipient.delivery_status === 'delivered') {
        continue; // Already delivered to this recipient
      }

      // Check consent status
      if (recipient.consent_status !== 'granted') {
        await this.requestDeliveryConsent(content, recipient);
        continue;
      }

      // Check recipient's emotional state if required
      if (content.delivery_settings.check_emotional_state) {
        const emotionalState = await this.getRecipientEmotionalState(recipient.contact_id);
        if (!this.isEmotionalStateSuitable(emotionalState)) {
          await this.deferDelivery(content, recipient, 'emotional_state_unsuitable');
          continue;
        }
      }

      // Attempt delivery
      await this.attemptDelivery(content, recipient);
    }
  }

  /**
   * Attempt delivery to recipient
   */
  private async attemptDelivery(
    content: LegacyContent,
    recipient: LegacyRecipient
  ): Promise<void> {
    const attemptNumber = content.delivery_attempts.filter(
      a => a.recipient_id === recipient.contact_id
    ).length + 1;

    if (attemptNumber > recipient.delivery_preferences.max_delivery_attempts) {
      recipient.delivery_status = 'failed';
      return;
    }

    const attempt: DeliveryAttempt = {
      attempt_number: attemptNumber,
      recipient_id: recipient.contact_id,
      delivery_method: recipient.delivery_preferences.delivery_method,
      attempted_at: new Date(),
      result: 'success' // Will be updated based on actual delivery
    };

    try {
      // Get recipient's current emotional state
      attempt.recipient_emotional_state = await this.getRecipientEmotionalState(recipient.contact_id);
      
      // Perform tactful delivery
      const deliveryResult = await this.performTactfulDelivery(content, recipient);
      attempt.result = deliveryResult;

      if (deliveryResult === 'success') {
        recipient.delivery_status = 'delivered';
        content.delivered_at = new Date();
      } else if (deliveryResult === 'refused') {
        recipient.delivery_status = 'refused';
      } else {
        // Schedule retry
        attempt.next_retry_at = this.calculateRetryTime(content.delivery_settings.retry_delay);
      }

    } catch (error) {
      attempt.result = 'failed';
      attempt.error_message = error instanceof Error ? error.message : 'Unknown error';
      
      // Schedule retry if attempts remaining
      if (attemptNumber < recipient.delivery_preferences.max_delivery_attempts) {
        attempt.next_retry_at = this.calculateRetryTime(content.delivery_settings.retry_delay);
      } else {
        recipient.delivery_status = 'failed';
      }
    }

    content.delivery_attempts.push(attempt);
    await this.updateLegacyContent(content);
  }

  /**
   * Perform tactful delivery with permission seeking
   * Requirement 23.4: Tactful, permission-seeking delivery process
   */
  private async performTactfulDelivery(
    content: LegacyContent,
    recipient: LegacyRecipient
  ): Promise<DeliveryResult> {
    // First, send a gentle notification asking for permission
    const permissionGranted = await this.requestDeliveryPermission(content, recipient);
    
    if (!permissionGranted) {
      return 'refused';
    }

    // Deliver the actual content
    const deliverySuccess = await this.deliverContent(content, recipient);
    
    return deliverySuccess ? 'success' : 'failed';
  }

  /**
   * Request permission to deliver legacy content
   */
  private async requestDeliveryPermission(
    content: LegacyContent,
    recipient: LegacyRecipient
  ): Promise<boolean> {
    // Mock implementation - in real system, this would send a tactful message
    // asking if the recipient is ready to receive a message from the creator
    
    const permissionMessage = this.createPermissionRequestMessage(content);
    
    // Send permission request (mock)
    const response = await this.sendPermissionRequest(recipient.contact_id, permissionMessage);
    
    return response === 'granted';
  }

  /**
   * Create tactful permission request message
   */
  private createPermissionRequestMessage(content: LegacyContent): string {
    const creatorName = "your loved one"; // Would get actual name from creator profile
    
    return `${creatorName} has prepared a special message for you. ` +
           `Would you like to receive it now? You can always choose to receive it later if this isn't a good time.`;
  }

  /**
   * Check if recipient's emotional state is suitable for delivery
   */
  private isEmotionalStateSuitable(emotionalState: UserState): boolean {
    // Avoid delivery if user is in high FIGHT or FLIGHT state
    const highStressThreshold = 0.7;
    
    return emotionalState.fight < highStressThreshold && 
           emotionalState.flight < highStressThreshold;
  }

  /**
   * Defer delivery due to unsuitable conditions
   */
  private async deferDelivery(
    content: LegacyContent,
    recipient: LegacyRecipient,
    reason: string
  ): Promise<void> {
    const attempt: DeliveryAttempt = {
      attempt_number: content.delivery_attempts.filter(a => a.recipient_id === recipient.contact_id).length + 1,
      recipient_id: recipient.contact_id,
      delivery_method: recipient.delivery_preferences.delivery_method,
      attempted_at: new Date(),
      result: 'deferred',
      error_message: reason,
      next_retry_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Retry in 24 hours
    };

    content.delivery_attempts.push(attempt);
    await this.updateLegacyContent(content);
  }

  /**
   * Check if trigger should fire
   */
  private async shouldTriggerDelivery(content: LegacyContent): Promise<boolean> {
    const trigger = content.trigger;
    
    switch (trigger.type) {
      case 'time_based':
        return this.evaluateTimeBasedTrigger(trigger.config as TimeBasedTriggerConfig);
      
      case 'event_based':
        return await this.evaluateEventBasedTrigger(trigger.config as EventBasedTriggerConfig, content.recipients);
      
      case 'query_based':
        return await this.evaluateQueryBasedTrigger(trigger.config as QueryBasedTriggerConfig, content.recipients);
      
      default:
        return false;
    }
  }

  /**
   * Evaluate time-based trigger
   */
  private evaluateTimeBasedTrigger(config: TimeBasedTriggerConfig): boolean {
    const now = new Date();
    return now >= config.delivery_date;
  }

  /**
   * Evaluate event-based trigger
   */
  private async evaluateEventBasedTrigger(
    config: EventBasedTriggerConfig,
    recipients: LegacyRecipient[]
  ): Promise<boolean> {
    // Mock implementation - would check for actual events in the system
    for (const recipient of recipients) {
      const hasEvent = await this.checkForEvent(recipient.contact_id, config.event_type, config.criteria);
      if (hasEvent) {
        return true;
      }
    }
    return false;
  }

  /**
   * Evaluate query-based trigger
   */
  private async evaluateQueryBasedTrigger(
    config: QueryBasedTriggerConfig,
    recipients: LegacyRecipient[]
  ): Promise<boolean> {
    // Mock implementation - would check recent queries from recipients
    for (const recipient of recipients) {
      const matchingQuery = await this.checkForMatchingQuery(recipient.contact_id, config);
      if (matchingQuery) {
        return true;
      }
    }
    return false;
  }

  // Helper methods (mock implementations)
  
  private generateId(): string {
    return `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createDefaultTrigger(): LegacyTrigger {
    return this.createTimeBasedTrigger(
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      'UTC'
    );
  }

  private getDefaultDeliverySettings() {
    return {
      tactful_delivery: true,
      check_emotional_state: true,
      max_attempts: 3,
      retry_delay: { amount: 24, unit: 'hours' as const },
      notify_creator: true
    };
  }

  private async validateCreatorPermissions(creatorId: string): Promise<void> {
    // Mock validation
  }

  private async checkUserLimits(creatorId: string): Promise<void> {
    // Mock limit checking
  }

  private async validateTrigger(trigger: LegacyTrigger): Promise<void> {
    // Mock trigger validation
  }

  private async validateRecipients(recipients: LegacyRecipient[], creatorId: string): Promise<void> {
    // Mock recipient validation
  }

  private calculateDeliveryTime(trigger: LegacyTrigger): Date {
    if (trigger.type === 'time_based') {
      const config = trigger.config as TimeBasedTriggerConfig;
      return config.delivery_date;
    }
    return new Date();
  }

  private calculateNextEvaluation(trigger: LegacyTrigger): Date {
    switch (trigger.type) {
      case 'time_based':
        return (trigger.config as TimeBasedTriggerConfig).delivery_date;
      case 'event_based':
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // Check daily
      case 'query_based':
        return new Date(Date.now() + 60 * 60 * 1000); // Check hourly
      default:
        return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }

  private calculateRetryTime(retryDelay: { amount: number; unit: string }): Date {
    const multiplier = {
      'minutes': 60 * 1000,
      'hours': 60 * 60 * 1000,
      'days': 24 * 60 * 60 * 1000,
      'weeks': 7 * 24 * 60 * 60 * 1000,
      'months': 30 * 24 * 60 * 60 * 1000
    };
    
    const delay = retryDelay.amount * (multiplier[retryDelay.unit as keyof typeof multiplier] || multiplier.hours);
    return new Date(Date.now() + delay);
  }

  // Mock database operations
  private async saveLegacyContent(content: LegacyContent): Promise<void> {
    // Mock save operation
  }

  private async updateLegacyContent(content: LegacyContent): Promise<void> {
    content.updated_at = new Date();
    // Mock update operation
  }

  private async getActiveLegacyContent(): Promise<LegacyContent[]> {
    // Mock retrieval - would get from database
    return [];
  }

  private async getRecipientEmotionalState(contactId: string): Promise<UserState> {
    // Mock emotional state retrieval
    return {
      fight: 0.3,
      flight: 0.2,
      fixes: 0.7,
      timestamp: new Date(),
      confidence: 0.8
    };
  }

  private async requestDeliveryConsent(content: LegacyContent, recipient: LegacyRecipient): Promise<void> {
    // Mock consent request
  }

  private async sendPermissionRequest(contactId: string, message: string): Promise<string> {
    // Mock permission request - would integrate with messaging system
    return 'granted'; // Mock response
  }

  private async deliverContent(content: LegacyContent, recipient: LegacyRecipient): Promise<boolean> {
    // Mock content delivery
    return true;
  }

  private async checkForEvent(contactId: string, eventType: string, criteria: any): Promise<boolean> {
    // Mock event checking
    return false;
  }

  private async checkForMatchingQuery(contactId: string, config: QueryBasedTriggerConfig): Promise<boolean> {
    // Mock query matching
    return false;
  }
}