/**
 * Unit tests for Legacy System Service
 * Tests the core functionality of the "Hälsning till Framtiden" system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LegacySystemService } from '../../services/legacy-system-service';
import {
  LegacyContent,
  LegacySystemConfig,
  TimeBasedTriggerConfig,
  EventBasedTriggerConfig,
  QueryBasedTriggerConfig
} from '../../types/legacy-system';

describe('LegacySystemService', () => {
  let service: LegacySystemService;
  let mockConfig: LegacySystemConfig;

  beforeEach(() => {
    mockConfig = {
      max_legacy_content_per_user: 50,
      max_recipients_per_content: 10,
      default_max_delivery_attempts: 3,
      min_retry_delay_hours: 24,
      max_future_delivery_years: 50,
      require_mutual_consent: true
    };
    
    service = new LegacySystemService(mockConfig);
  });

  describe('createLegacyContent', () => {
    it('should create legacy content with default values', async () => {
      // Requirement 23.1: Implement LegacyContent creation and trigger definition
      const creatorId = 'user_123';
      const contentData = {
        title: 'Test Legacy Message',
        type: 'text_message' as const,
        content: { text: 'Hello from the past!' }
      };

      const result = await service.createLegacyContent(creatorId, contentData);

      expect(result).toBeDefined();
      expect(result.creator_id).toBe(creatorId);
      expect(result.title).toBe('Test Legacy Message');
      expect(result.type).toBe('text_message');
      expect(result.content.text).toBe('Hello from the past!');
      expect(result.status).toBe('draft');
      expect(result.delivery_settings.tactful_delivery).toBe(true);
      expect(result.delivery_settings.check_emotional_state).toBe(true);
    });

    it('should create legacy content with custom trigger', async () => {
      const creatorId = 'user_123';
      const deliveryDate = new Date('2030-12-25');
      
      const trigger = service.createTimeBasedTrigger(deliveryDate, 'Europe/Stockholm');
      
      const contentData = {
        title: 'Christmas Message',
        trigger
      };

      const result = await service.createLegacyContent(creatorId, contentData);

      expect(result.trigger.type).toBe('time_based');
      expect(result.scheduled_delivery_at).toEqual(deliveryDate);
    });
  });

  describe('createTimeBasedTrigger', () => {
    it('should create time-based trigger with correct configuration', () => {
      // Requirement 23.3: Time-based triggers (specific date)
      const deliveryDate = new Date('2025-06-15T10:00:00Z');
      const timezone = 'Europe/Stockholm';

      const trigger = service.createTimeBasedTrigger(deliveryDate, timezone, true);

      expect(trigger.type).toBe('time_based');
      expect(trigger.active).toBe(true);
      
      const config = trigger.config as TimeBasedTriggerConfig;
      expect(config.delivery_date).toEqual(deliveryDate);
      expect(config.timezone).toBe(timezone);
      expect(config.respect_recipient_timezone).toBe(true);
      expect(trigger.next_evaluation_at).toEqual(deliveryDate);
    });

    it('should create trigger with default timezone', () => {
      const deliveryDate = new Date('2025-06-15T10:00:00Z');

      const trigger = service.createTimeBasedTrigger(deliveryDate);

      const config = trigger.config as TimeBasedTriggerConfig;
      expect(config.timezone).toBe('UTC');
      expect(config.respect_recipient_timezone).toBe(true);
    });
  });

  describe('createEventBasedTrigger', () => {
    it('should create event-based trigger with correct configuration', () => {
      // Requirement 23.3: Event-based triggers (milestone achieved by recipient)
      const eventType = 'birthday';
      const criteria = { target_age: 65 };
      const description = 'Deliver on 65th birthday';

      const trigger = service.createEventBasedTrigger(eventType, criteria, description);

      expect(trigger.type).toBe('event_based');
      expect(trigger.description).toBe(description);
      expect(trigger.active).toBe(true);
      
      const config = trigger.config as EventBasedTriggerConfig;
      expect(config.event_type).toBe(eventType);
      expect(config.criteria).toEqual(criteria);
      
      // Should check daily for events
      expect(trigger.next_evaluation_at).toBeDefined();
      expect(trigger.next_evaluation_at!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle different event types', () => {
      const eventTypes = ['graduation', 'marriage', 'retirement', 'milestone_age'];
      
      eventTypes.forEach(eventType => {
        const trigger = service.createEventBasedTrigger(eventType, {}, `Test ${eventType}`);
        
        expect(trigger.type).toBe('event_based');
        const config = trigger.config as EventBasedTriggerConfig;
        expect(config.event_type).toBe(eventType);
      });
    });
  });

  describe('createQueryBasedTrigger', () => {
    it('should create query-based trigger with correct configuration', () => {
      // Requirement 23.3: Query-based triggers (specific question asked by future user)
      const queryPatterns = [
        { pattern: 'What did grandpa think about', type: 'contains', weight: 1.0 },
        { pattern: 'Tell me about grandpa', type: 'contains', weight: 0.8 }
      ];
      const confidenceThreshold = 0.75;
      const description = 'Deliver when asked about grandpa';

      const trigger = service.createQueryBasedTrigger(queryPatterns, confidenceThreshold, description);

      expect(trigger.type).toBe('query_based');
      expect(trigger.description).toBe(description);
      expect(trigger.active).toBe(true);
      
      const config = trigger.config as QueryBasedTriggerConfig;
      expect(config.query_patterns).toHaveLength(2);
      expect(config.confidence_threshold).toBe(confidenceThreshold);
      expect(config.query_patterns[0].pattern).toBe('What did grandpa think about');
      expect(config.query_patterns[0].case_sensitive).toBe(false);
      
      // Should check hourly for queries
      expect(trigger.next_evaluation_at).toBeDefined();
    });

    it('should use default confidence threshold', () => {
      const queryPatterns = [
        { pattern: 'test pattern', type: 'contains', weight: 1.0 }
      ];

      const trigger = service.createQueryBasedTrigger(queryPatterns, undefined, 'Test');

      const config = trigger.config as QueryBasedTriggerConfig;
      expect(config.confidence_threshold).toBe(0.8);
    });
  });

  describe('evaluateTriggersAndDeliver', () => {
    it('should process active legacy content', async () => {
      // Mock the private methods for testing
      const mockGetActiveLegacyContent = vi.spyOn(service as any, 'getActiveLegacyContent')
        .mockResolvedValue([]);
      
      await service.evaluateTriggersAndDeliver();

      expect(mockGetActiveLegacyContent).toHaveBeenCalled();
    });
  });

  describe('trigger evaluation', () => {
    it('should evaluate time-based trigger correctly', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const pastTrigger = service.createTimeBasedTrigger(pastDate);
      const futureTrigger = service.createTimeBasedTrigger(futureDate);

      // Access private method for testing
      const evaluateTimeBasedTrigger = (service as any).evaluateTimeBasedTrigger.bind(service);
      
      expect(evaluateTimeBasedTrigger(pastTrigger.config)).toBe(true);
      expect(evaluateTimeBasedTrigger(futureTrigger.config)).toBe(false);
    });
  });

  describe('tactful delivery process', () => {
    it('should implement tactful delivery with permission seeking', async () => {
      // Requirement 23.4: Tactful delivery process with recipient permission
      const mockContent: Partial<LegacyContent> = {
        id: 'test_content',
        title: 'Test Message',
        delivery_settings: {
          tactful_delivery: true,
          check_emotional_state: true,
          max_attempts: 3,
          retry_delay: { amount: 24, unit: 'hours' },
          notify_creator: true
        },
        recipients: [{
          contact_id: 'recipient_1',
          relationship: 'family',
          delivery_preferences: {
            delivery_method: 'in_app_notification',
            respect_emotional_state: true,
            max_delivery_attempts: 3
          },
          consent_status: 'granted',
          delivery_status: 'scheduled'
        }]
      };

      // Mock private methods
      const mockRequestDeliveryPermission = vi.spyOn(service as any, 'requestDeliveryPermission')
        .mockResolvedValue(true);
      const mockDeliverContent = vi.spyOn(service as any, 'deliverContent')
        .mockResolvedValue(true);

      const performTactfulDelivery = (service as any).performTactfulDelivery.bind(service);
      const result = await performTactfulDelivery(mockContent, mockContent.recipients![0]);

      expect(mockRequestDeliveryPermission).toHaveBeenCalled();
      expect(mockDeliverContent).toHaveBeenCalled();
      expect(result).toBe('success');
    });

    it('should respect recipient refusal', async () => {
      const mockContent: Partial<LegacyContent> = {
        recipients: [{
          contact_id: 'recipient_1',
          relationship: 'family',
          delivery_preferences: {
            delivery_method: 'in_app_notification',
            respect_emotional_state: true,
            max_delivery_attempts: 3
          },
          consent_status: 'granted',
          delivery_status: 'scheduled'
        }]
      };

      // Mock permission refusal
      const mockRequestDeliveryPermission = vi.spyOn(service as any, 'requestDeliveryPermission')
        .mockResolvedValue(false);

      const performTactfulDelivery = (service as any).performTactfulDelivery.bind(service);
      const result = await performTactfulDelivery(mockContent, mockContent.recipients![0]);

      expect(mockRequestDeliveryPermission).toHaveBeenCalled();
      expect(result).toBe('refused');
    });
  });

  describe('emotional state checking', () => {
    it('should check emotional state suitability', () => {
      const suitableState = {
        fight: 0.3,
        flight: 0.2,
        fixes: 0.7,
        timestamp: new Date(),
        confidence: 0.8
      };

      const unsuitableState = {
        fight: 0.8, // High stress
        flight: 0.7, // High avoidance
        fixes: 0.2,
        timestamp: new Date(),
        confidence: 0.8
      };

      const isEmotionalStateSuitable = (service as any).isEmotionalStateSuitable.bind(service);
      
      expect(isEmotionalStateSuitable(suitableState)).toBe(true);
      expect(isEmotionalStateSuitable(unsuitableState)).toBe(false);
    });
  });

  describe('permission request message creation', () => {
    it('should create tactful permission request message', () => {
      const mockContent: Partial<LegacyContent> = {
        title: 'Birthday Message',
        creator_id: 'creator_123'
      };

      const createPermissionRequestMessage = (service as any).createPermissionRequestMessage.bind(service);
      const message = createPermissionRequestMessage(mockContent);

      expect(message).toContain('special message');
      expect(message).toContain('Would you like to receive it now');
      expect(message).toContain('choose to receive it later');
    });
  });

  describe('retry delay calculation', () => {
    it('should calculate retry times correctly', () => {
      const calculateRetryTime = (service as any).calculateRetryTime.bind(service);
      
      const hourDelay = { amount: 2, unit: 'hours' };
      const dayDelay = { amount: 1, unit: 'days' };
      
      const hourRetry = calculateRetryTime(hourDelay);
      const dayRetry = calculateRetryTime(dayDelay);
      
      expect(hourRetry.getTime()).toBeGreaterThan(Date.now() + 1.5 * 60 * 60 * 1000); // > 1.5 hours
      expect(hourRetry.getTime()).toBeLessThan(Date.now() + 2.5 * 60 * 60 * 1000); // < 2.5 hours
      
      expect(dayRetry.getTime()).toBeGreaterThan(Date.now() + 20 * 60 * 60 * 1000); // > 20 hours
      expect(dayRetry.getTime()).toBeLessThan(Date.now() + 28 * 60 * 60 * 1000); // < 28 hours
    });
  });

  describe('configuration validation', () => {
    it('should use provided configuration', () => {
      const customConfig: LegacySystemConfig = {
        max_legacy_content_per_user: 100,
        max_recipients_per_content: 20,
        default_max_delivery_attempts: 5,
        min_retry_delay_hours: 12,
        max_future_delivery_years: 25,
        require_mutual_consent: false
      };

      const customService = new LegacySystemService(customConfig);
      expect(customService).toBeDefined();
    });
  });
});