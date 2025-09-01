/**
 * Data retention and automatic deletion service
 * Requirement 16.1.4: Code automatic deletion of temporary data (60-day policy)
 */

/**
 * Data retention policies
 */
export interface DataRetentionPolicy {
  /** Policy name */
  name: string;
  
  /** Data type this policy applies to */
  data_type: string;
  
  /** Retention period in days */
  retention_days: number;
  
  /** Whether to automatically delete expired data */
  auto_delete: boolean;
  
  /** Grace period before deletion in days */
  grace_period_days: number;
  
  /** Whether to notify before deletion */
  notify_before_deletion: boolean;
  
  /** Notification period in days before deletion */
  notification_days: number;
}

/**
 * Data retention record
 */
export interface DataRetentionRecord {
  /** Unique record ID */
  id: string;
  
  /** Data type */
  data_type: string;
  
  /** Data identifier */
  data_id: string;
  
  /** User ID who owns the data */
  user_id: string;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Expiration timestamp */
  expires_at: Date;
  
  /** Deletion scheduled timestamp */
  deletion_scheduled_at?: Date;
  
  /** Deletion notification sent timestamp */
  notification_sent_at?: Date;
  
  /** Actual deletion timestamp */
  deleted_at?: Date;
  
  /** Retention policy applied */
  policy_name: string;
  
  /** Current status */
  status: 'active' | 'expiring' | 'scheduled_for_deletion' | 'deleted';
}

/**
 * Deletion notification
 */
export interface DeletionNotification {
  /** User ID to notify */
  user_id: string;
  
  /** Data type being deleted */
  data_type: string;
  
  /** Data identifier */
  data_id: string;
  
  /** Scheduled deletion date */
  deletion_date: Date;
  
  /** Days until deletion */
  days_until_deletion: number;
  
  /** Notification message */
  message: string;
}

/**
 * Default retention policies
 */
export const DEFAULT_RETENTION_POLICIES: DataRetentionPolicy[] = [
  {
    name: 'conversation_logs',
    data_type: 'ConversationLog',
    retention_days: 60,
    auto_delete: true,
    grace_period_days: 7,
    notify_before_deletion: true,
    notification_days: 7
  },
  {
    name: 'temporary_files',
    data_type: 'TempFile',
    retention_days: 7,
    auto_delete: true,
    grace_period_days: 1,
    notify_before_deletion: false,
    notification_days: 0
  },
  {
    name: 'session_data',
    data_type: 'SessionData',
    retention_days: 30,
    auto_delete: true,
    grace_period_days: 0,
    notify_before_deletion: false,
    notification_days: 0
  },
  {
    name: 'audit_logs',
    data_type: 'AuditLog',
    retention_days: 365,
    auto_delete: false,
    grace_period_days: 30,
    notify_before_deletion: true,
    notification_days: 30
  },
  {
    name: 'error_logs',
    data_type: 'ErrorLog',
    retention_days: 90,
    auto_delete: true,
    grace_period_days: 7,
    notify_before_deletion: false,
    notification_days: 0
  },
  {
    name: 'cache_data',
    data_type: 'CacheData',
    retention_days: 1,
    auto_delete: true,
    grace_period_days: 0,
    notify_before_deletion: false,
    notification_days: 0
  }
];

/**
 * Data retention service
 */
export class DataRetentionService {
  private policies: Map<string, DataRetentionPolicy> = new Map();
  private retentionRecords: Map<string, DataRetentionRecord> = new Map();
  
  constructor(policies: DataRetentionPolicy[] = DEFAULT_RETENTION_POLICIES) {
    policies.forEach(policy => {
      this.policies.set(policy.data_type, policy);
    });
  }
  
  /**
   * Registers data for retention tracking
   */
  registerData(
    dataType: string,
    dataId: string,
    userId: string,
    createdAt: Date = new Date()
  ): DataRetentionRecord {
    const policy = this.policies.get(dataType);
    if (!policy) {
      throw new Error(`No retention policy found for data type: ${dataType}`);
    }
    
    const expiresAt = new Date(createdAt.getTime() + policy.retention_days * 24 * 60 * 60 * 1000);
    
    const record: DataRetentionRecord = {
      id: this.generateRecordId(),
      data_type: dataType,
      data_id: dataId,
      user_id: userId,
      created_at: createdAt,
      expires_at: expiresAt,
      policy_name: policy.name,
      status: 'active'
    };
    
    this.retentionRecords.set(record.id, record);
    return record;
  }
  
  /**
   * Checks for expired data and schedules deletion
   */
  async processExpiredData(): Promise<{
    expired: DataRetentionRecord[];
    scheduled: DataRetentionRecord[];
    notifications: DeletionNotification[];
  }> {
    const now = new Date();
    const expired: DataRetentionRecord[] = [];
    const scheduled: DataRetentionRecord[] = [];
    const notifications: DeletionNotification[] = [];
    
    for (const record of this.retentionRecords.values()) {
      if (record.status === 'deleted') {
        continue;
      }
      
      const policy = this.policies.get(record.data_type);
      if (!policy) {
        continue;
      }
      
      // Check if data has expired
      if (record.expires_at <= now && record.status === 'active') {
        record.status = 'expiring';
        expired.push(record);
        
        // Schedule for deletion if auto-delete is enabled
        if (policy.auto_delete) {
          const deletionDate = new Date(now.getTime() + policy.grace_period_days * 24 * 60 * 60 * 1000);
          record.deletion_scheduled_at = deletionDate;
          record.status = 'scheduled_for_deletion';
          scheduled.push(record);
          
          // Send notification if required
          if (policy.notify_before_deletion && !record.notification_sent_at) {
            const notification = this.createDeletionNotification(record, policy, deletionDate);
            notifications.push(notification);
            record.notification_sent_at = now;
          }
        }
      }
      
      // Check if scheduled deletion time has arrived
      if (record.deletion_scheduled_at && record.deletion_scheduled_at <= now && record.status === 'scheduled_for_deletion') {
        await this.deleteData(record);
      }
      
      // Check if notification should be sent
      if (policy.notify_before_deletion && record.deletion_scheduled_at && !record.notification_sent_at) {
        const notificationDate = new Date(record.deletion_scheduled_at.getTime() - policy.notification_days * 24 * 60 * 60 * 1000);
        if (now >= notificationDate) {
          const notification = this.createDeletionNotification(record, policy, record.deletion_scheduled_at);
          notifications.push(notification);
          record.notification_sent_at = now;
        }
      }
    }
    
    return { expired, scheduled, notifications };
  }
  
  /**
   * Deletes data and marks record as deleted
   */
  private async deleteData(record: DataRetentionRecord): Promise<void> {
    try {
      // Here you would implement the actual data deletion logic
      // This could involve calling different services based on data_type
      await this.performDataDeletion(record);
      
      record.deleted_at = new Date();
      record.status = 'deleted';
    } catch (error) {
      console.error(`Failed to delete data ${record.data_id} of type ${record.data_type}:`, error);
      // Optionally reschedule deletion or handle error
    }
  }
  
  /**
   * Performs the actual data deletion (to be implemented by specific services)
   */
  private async performDataDeletion(record: DataRetentionRecord): Promise<void> {
    // This is a placeholder - in a real implementation, you would:
    // 1. Determine the appropriate service/repository for the data type
    // 2. Call the deletion method on that service
    // 3. Handle any cascading deletions
    // 4. Update related records
    
    console.log(`Deleting ${record.data_type} with ID ${record.data_id}`);
    
    // Example implementation:
    // switch (record.data_type) {
    //   case 'ConversationLog':
    //     await conversationService.delete(record.data_id);
    //     break;
    //   case 'TempFile':
    //     await fileService.delete(record.data_id);
    //     break;
    //   // ... other cases
    // }
  }
  
  /**
   * Creates a deletion notification
   */
  private createDeletionNotification(
    record: DataRetentionRecord,
    policy: DataRetentionPolicy,
    deletionDate: Date
  ): DeletionNotification {
    const daysUntilDeletion = Math.ceil((deletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    return {
      user_id: record.user_id,
      data_type: record.data_type,
      data_id: record.data_id,
      deletion_date: deletionDate,
      days_until_deletion: daysUntilDeletion,
      message: this.generateDeletionMessage(record.data_type, daysUntilDeletion)
    };
  }
  
  /**
   * Generates a user-friendly deletion message
   */
  private generateDeletionMessage(dataType: string, daysUntilDeletion: number): string {
    const typeDisplayName = this.getDataTypeDisplayName(dataType);
    
    if (daysUntilDeletion <= 0) {
      return `Your ${typeDisplayName} is scheduled for deletion today as part of our data retention policy.`;
    } else if (daysUntilDeletion === 1) {
      return `Your ${typeDisplayName} will be automatically deleted tomorrow as part of our data retention policy.`;
    } else {
      return `Your ${typeDisplayName} will be automatically deleted in ${daysUntilDeletion} days as part of our data retention policy.`;
    }
  }
  
  /**
   * Gets user-friendly display name for data type
   */
  private getDataTypeDisplayName(dataType: string): string {
    const displayNames: Record<string, string> = {
      'ConversationLog': 'conversation history',
      'TempFile': 'temporary files',
      'SessionData': 'session data',
      'AuditLog': 'audit logs',
      'ErrorLog': 'error logs',
      'CacheData': 'cached data'
    };
    
    return displayNames[dataType] || dataType.toLowerCase();
  }
  
  /**
   * Extends retention period for specific data
   */
  extendRetention(recordId: string, additionalDays: number): boolean {
    const record = this.retentionRecords.get(recordId);
    if (!record || record.status === 'deleted') {
      return false;
    }
    
    record.expires_at = new Date(record.expires_at.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    
    // Reset deletion scheduling if it was scheduled
    if (record.status === 'scheduled_for_deletion') {
      record.status = 'active';
      record.deletion_scheduled_at = undefined;
      record.notification_sent_at = undefined;
    }
    
    return true;
  }
  
  /**
   * Cancels scheduled deletion
   */
  cancelDeletion(recordId: string): boolean {
    const record = this.retentionRecords.get(recordId);
    if (!record || record.status === 'deleted') {
      return false;
    }
    
    if (record.status === 'scheduled_for_deletion') {
      record.status = 'expiring';
      record.deletion_scheduled_at = undefined;
      record.notification_sent_at = undefined;
      return true;
    }
    
    return false;
  }
  
  /**
   * Gets retention records for a user
   */
  getUserRetentionRecords(userId: string): DataRetentionRecord[] {
    return Array.from(this.retentionRecords.values())
      .filter(record => record.user_id === userId);
  }
  
  /**
   * Gets retention records by data type
   */
  getRecordsByDataType(dataType: string): DataRetentionRecord[] {
    return Array.from(this.retentionRecords.values())
      .filter(record => record.data_type === dataType);
  }
  
  /**
   * Adds or updates a retention policy
   */
  setRetentionPolicy(policy: DataRetentionPolicy): void {
    this.policies.set(policy.data_type, policy);
  }
  
  /**
   * Gets retention policy for data type
   */
  getRetentionPolicy(dataType: string): DataRetentionPolicy | undefined {
    return this.policies.get(dataType);
  }
  
  /**
   * Generates a unique record ID
   */
  private generateRecordId(): string {
    return `ret_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Gets statistics about data retention
   */
  getRetentionStatistics(): {
    total_records: number;
    active: number;
    expiring: number;
    scheduled_for_deletion: number;
    deleted: number;
    by_data_type: Record<string, number>;
  } {
    const stats = {
      total_records: this.retentionRecords.size,
      active: 0,
      expiring: 0,
      scheduled_for_deletion: 0,
      deleted: 0,
      by_data_type: {} as Record<string, number>
    };
    
    for (const record of this.retentionRecords.values()) {
      stats[record.status as keyof typeof stats]++;
      stats.by_data_type[record.data_type] = (stats.by_data_type[record.data_type] || 0) + 1;
    }
    
    return stats;
  }
}

/**
 * Global data retention service instance
 */
export const dataRetention = new DataRetentionService();