/**
 * Tests for data retention service
 * Requirement 16.1.4: Write security tests for automatic data deletion
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DataRetentionService,
  DEFAULT_RETENTION_POLICIES,
  dataRetention
} from '../../lib/security/data-retention';

describe('DataRetentionService', () => {
  let service: DataRetentionService;
  
  beforeEach(() => {
    service = new DataRetentionService(DEFAULT_RETENTION_POLICIES);
  });
  
  describe('Data Registration', () => {
    it('should register data for retention tracking', () => {
      const record = service.registerData('ConversationLog', 'log_123', 'user_123');
      
      expect(record.id).toBeDefined();
      expect(record.data_type).toBe('ConversationLog');
      expect(record.data_id).toBe('log_123');
      expect(record.user_id).toBe('user_123');
      expect(record.status).toBe('active');
      expect(record.policy_name).toBe('conversation_logs');
      expect(record.expires_at).toBeInstanceOf(Date);
    });
    
    it('should calculate correct expiration date', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z');
      const record = service.registerData('ConversationLog', 'log_123', 'user_123', createdAt);
      
      const expectedExpiry = new Date('2024-03-01T00:00:00Z'); // 60 days later
      expect(record.expires_at.getTime()).toBe(expectedExpiry.getTime());
    });
    
    it('should throw error for unknown data type', () => {
      expect(() => {
        service.registerData('UnknownType', 'data_123', 'user_123');
      }).toThrow('No retention policy found for data type: UnknownType');
    });
  });
  
  describe('Expired Data Processing', () => {
    it('should identify expired data', async () => {
      // Register data that expired yesterday
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000); // 60 days before yesterday
      
      service.registerData('ConversationLog', 'expired_log', 'user_123', expiredCreationDate);
      
      const result = await service.processExpiredData();
      
      expect(result.expired.length).toBe(1);
      expect(result.expired[0].data_id).toBe('expired_log');
      // Status should be 'scheduled_for_deletion' since auto_delete is true for ConversationLog
      expect(result.expired[0].status).toBe('scheduled_for_deletion');
    });
    
    it('should schedule auto-deletion for expired data', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      service.registerData('ConversationLog', 'expired_log', 'user_123', expiredCreationDate);
      
      const result = await service.processExpiredData();
      
      expect(result.scheduled.length).toBe(1);
      expect(result.scheduled[0].status).toBe('scheduled_for_deletion');
      expect(result.scheduled[0].deletion_scheduled_at).toBeInstanceOf(Date);
    });
    
    it('should generate notifications for deletion', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      service.registerData('ConversationLog', 'expired_log', 'user_123', expiredCreationDate);
      
      const result = await service.processExpiredData();
      
      expect(result.notifications.length).toBe(1);
      expect(result.notifications[0].user_id).toBe('user_123');
      expect(result.notifications[0].data_type).toBe('ConversationLog');
      expect(result.notifications[0].message).toContain('conversation history');
    });
    
    it('should not schedule deletion for non-auto-delete policies', async () => {
      // Add a policy that doesn't auto-delete
      service.setRetentionPolicy({
        name: 'manual_cleanup',
        data_type: 'ManualData',
        retention_days: 30,
        auto_delete: false,
        grace_period_days: 7,
        notify_before_deletion: true,
        notification_days: 7
      });
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      service.registerData('ManualData', 'manual_data', 'user_123', expiredCreationDate);
      
      const result = await service.processExpiredData();
      
      const manualRecord = result.expired.find(r => r.data_type === 'ManualData');
      expect(manualRecord?.status).toBe('expiring');
      expect(manualRecord?.deletion_scheduled_at).toBeUndefined();
    });
  });
  
  describe('Retention Extension', () => {
    it('should extend retention period', () => {
      const record = service.registerData('ConversationLog', 'log_123', 'user_123');
      const originalExpiry = record.expires_at;
      
      const success = service.extendRetention(record.id, 30); // Extend by 30 days
      
      expect(success).toBe(true);
      expect(record.expires_at.getTime()).toBe(originalExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    });
    
    it('should reset scheduled deletion when extending retention', async () => {
      // Create expired data that gets scheduled for deletion
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const record = service.registerData('ConversationLog', 'log_123', 'user_123', expiredCreationDate);
      
      await service.processExpiredData();
      expect(record.status).toBe('scheduled_for_deletion');
      
      // Extend retention
      service.extendRetention(record.id, 30);
      
      expect(record.status).toBe('active');
      expect(record.deletion_scheduled_at).toBeUndefined();
    });
    
    it('should return false for non-existent record', () => {
      const success = service.extendRetention('non_existent_id', 30);
      expect(success).toBe(false);
    });
  });
  
  describe('Deletion Cancellation', () => {
    it('should cancel scheduled deletion', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const record = service.registerData('ConversationLog', 'log_123', 'user_123', expiredCreationDate);
      
      await service.processExpiredData();
      expect(record.status).toBe('scheduled_for_deletion');
      
      const success = service.cancelDeletion(record.id);
      
      expect(success).toBe(true);
      expect(record.status).toBe('expiring');
      expect(record.deletion_scheduled_at).toBeUndefined();
    });
    
    it('should return false for non-scheduled record', () => {
      const record = service.registerData('ConversationLog', 'log_123', 'user_123');
      
      const success = service.cancelDeletion(record.id);
      expect(success).toBe(false);
    });
  });
  
  describe('Data Queries', () => {
    it('should get retention records for user', () => {
      service.registerData('ConversationLog', 'log_1', 'user_123');
      service.registerData('ConversationLog', 'log_2', 'user_123');
      service.registerData('ConversationLog', 'log_3', 'user_456');
      
      const userRecords = service.getUserRetentionRecords('user_123');
      
      expect(userRecords.length).toBe(2);
      expect(userRecords.every(r => r.user_id === 'user_123')).toBe(true);
    });
    
    it('should get records by data type', () => {
      service.registerData('ConversationLog', 'log_1', 'user_123');
      service.registerData('TempFile', 'file_1', 'user_123');
      service.registerData('ConversationLog', 'log_2', 'user_456');
      
      const logRecords = service.getRecordsByDataType('ConversationLog');
      
      expect(logRecords.length).toBe(2);
      expect(logRecords.every(r => r.data_type === 'ConversationLog')).toBe(true);
    });
  });
  
  describe('Policy Management', () => {
    it('should set and get retention policies', () => {
      const customPolicy = {
        name: 'custom_policy',
        data_type: 'CustomData',
        retention_days: 90,
        auto_delete: true,
        grace_period_days: 14,
        notify_before_deletion: true,
        notification_days: 14
      };
      
      service.setRetentionPolicy(customPolicy);
      
      const retrievedPolicy = service.getRetentionPolicy('CustomData');
      expect(retrievedPolicy).toEqual(customPolicy);
    });
    
    it('should return undefined for non-existent policy', () => {
      const policy = service.getRetentionPolicy('NonExistentType');
      expect(policy).toBeUndefined();
    });
  });
  
  describe('Statistics', () => {
    it('should provide retention statistics', async () => {
      service.registerData('ConversationLog', 'log_1', 'user_123');
      service.registerData('TempFile', 'file_1', 'user_123');
      
      // Create expired data
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      service.registerData('ConversationLog', 'expired_log', 'user_123', expiredCreationDate);
      
      await service.processExpiredData();
      
      const stats = service.getRetentionStatistics();
      
      expect(stats.total_records).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.scheduled_for_deletion).toBe(1);
      expect(stats.by_data_type['ConversationLog']).toBe(2);
      expect(stats.by_data_type['TempFile']).toBe(1);
    });
  });
  
  describe('Default Policies', () => {
    it('should have conversation log policy', () => {
      const policy = service.getRetentionPolicy('ConversationLog');
      
      expect(policy).toBeDefined();
      expect(policy?.retention_days).toBe(60);
      expect(policy?.auto_delete).toBe(true);
    });
    
    it('should have temp file policy', () => {
      const policy = service.getRetentionPolicy('TempFile');
      
      expect(policy).toBeDefined();
      expect(policy?.retention_days).toBe(7);
      expect(policy?.auto_delete).toBe(true);
    });
    
    it('should have session data policy', () => {
      const policy = service.getRetentionPolicy('SessionData');
      
      expect(policy).toBeDefined();
      expect(policy?.retention_days).toBe(30);
      expect(policy?.auto_delete).toBe(true);
    });
  });
  
  describe('Notification Messages', () => {
    it('should generate appropriate deletion messages', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiredCreationDate = new Date(yesterday.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      service.registerData('ConversationLog', 'log_123', 'user_123', expiredCreationDate);
      
      const result = await service.processExpiredData();
      
      expect(result.notifications[0].message).toContain('conversation history');
      expect(result.notifications[0].message).toContain('days');
    });
  });
  
  describe('Global Instance', () => {
    it('should provide global data retention instance', () => {
      const record = dataRetention.registerData('ConversationLog', 'global_log', 'user_123');
      
      expect(record.data_type).toBe('ConversationLog');
      expect(record.data_id).toBe('global_log');
    });
  });
});