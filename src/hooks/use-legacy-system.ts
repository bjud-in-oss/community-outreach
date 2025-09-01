/**
 * Legacy System Hook
 * React hook for managing legacy content operations
 */

import { useState, useCallback, useEffect } from 'react';
import {
  LegacyContent,
  LegacyContentStatus,
  LegacySystemConfig
} from '../types/legacy-system';
import { Contact } from '../types/data-models';
import { LegacySystemService } from '../services/legacy-system-service';

interface UseLegacySystemOptions {
  /** User ID for filtering content */
  userId: string;
  
  /** Legacy system configuration */
  config?: Partial<LegacySystemConfig>;
}

interface UseLegacySystemReturn {
  /** List of legacy content items */
  legacyContent: LegacyContent[];
  
  /** Available contacts for recipients */
  contacts: Contact[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Create new legacy content */
  createLegacyContent: (content: Partial<LegacyContent>) => Promise<void>;
  
  /** Update existing legacy content */
  updateLegacyContent: (contentId: string, updates: Partial<LegacyContent>) => Promise<void>;
  
  /** Cancel legacy content */
  cancelLegacyContent: (contentId: string) => Promise<void>;
  
  /** Retry delivery for a specific recipient */
  retryDelivery: (contentId: string, recipientId: string) => Promise<void>;
  
  /** Save content as draft */
  saveDraft: (content: Partial<LegacyContent>) => Promise<void>;
  
  /** Refresh data */
  refresh: () => Promise<void>;
}

/**
 * Hook for managing legacy system operations
 */
export function useLegacySystem({
  userId,
  config = {}
}: UseLegacySystemOptions): UseLegacySystemReturn {
  const [legacyContent, setLegacyContent] = useState<LegacyContent[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize service with configuration
  const [service] = useState(() => {
    const defaultConfig: LegacySystemConfig = {
      max_legacy_content_per_user: 50,
      max_recipients_per_content: 10,
      default_max_delivery_attempts: 3,
      min_retry_delay_hours: 24,
      max_future_delivery_years: 50,
      require_mutual_consent: true,
      ...config
    };
    return new LegacySystemService(defaultConfig);
  });

  /**
   * Load legacy content for the user
   */
  const loadLegacyContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data loading - in real implementation, this would call an API
      const mockContent: LegacyContent[] = [
        {
          id: 'legacy_1',
          creator_id: userId,
          title: 'Brev till barnbarnen',
          type: 'text_message',
          content: {
            text: 'Kära barnbarn, när ni läser detta...',
            metadata: {}
          },
          trigger: {
            id: 'trigger_1',
            type: 'time_based',
            config: {
              delivery_date: new Date('2030-12-24'),
              timezone: 'Europe/Stockholm',
              respect_recipient_timezone: true
            },
            description: 'Deliver on Christmas Eve 2030',
            active: true,
            created_at: new Date('2024-01-01')
          },
          recipients: [
            {
              contact_id: 'contact_1',
              relationship: 'grandchild',
              delivery_preferences: {
                delivery_method: 'in_app_notification',
                respect_emotional_state: true,
                max_delivery_attempts: 3
              },
              consent_status: 'granted',
              delivery_status: 'scheduled'
            }
          ],
          delivery_settings: {
            tactful_delivery: true,
            check_emotional_state: true,
            max_attempts: 3,
            retry_delay: { amount: 24, unit: 'hours' },
            notify_creator: true
          },
          status: 'scheduled',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          scheduled_delivery_at: new Date('2030-12-24'),
          delivery_attempts: []
        }
      ];
      
      setLegacyContent(mockContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load legacy content');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Load available contacts
   */
  const loadContacts = useCallback(async () => {
    try {
      // Mock contacts loading - in real implementation, this would call an API
      const mockContacts: Contact[] = [
        {
          id: 'contact_1',
          owner_id: userId,
          contact_details: {
            encrypted_name: 'Anna Andersson',
            encryption_metadata: {
              algorithm: 'AES-256-GCM',
              kdf: 'PBKDF2',
              salt: 'mock_salt',
              iv: 'mock_iv',
              encrypted_at: new Date()
            }
          },
          groups: [],
          relationship_type: 'family',
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        },
        {
          id: 'contact_2',
          owner_id: userId,
          contact_details: {
            encrypted_name: 'Erik Eriksson',
            encryption_metadata: {
              algorithm: 'AES-256-GCM',
              kdf: 'PBKDF2',
              salt: 'mock_salt',
              iv: 'mock_iv',
              encrypted_at: new Date()
            }
          },
          groups: [],
          relationship_type: 'friend',
          created_at: new Date(),
          updated_at: new Date(),
          status: 'active'
        }
      ];
      
      setContacts(mockContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    }
  }, [userId]);

  /**
   * Create new legacy content
   */
  const createLegacyContent = useCallback(async (content: Partial<LegacyContent>) => {
    try {
      setLoading(true);
      setError(null);
      
      const newContent = await service.createLegacyContent(userId, content);
      setLegacyContent(prev => [...prev, newContent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create legacy content');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  /**
   * Update existing legacy content
   */
  const updateLegacyContent = useCallback(async (
    contentId: string,
    updates: Partial<LegacyContent>
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock update - in real implementation, this would call the service
      setLegacyContent(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, ...updates, updated_at: new Date() }
          : content
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update legacy content');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel legacy content
   */
  const cancelLegacyContent = useCallback(async (contentId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock cancellation - in real implementation, this would call the service
      setLegacyContent(prev => prev.map(content => 
        content.id === contentId 
          ? { ...content, status: 'cancelled' as LegacyContentStatus, updated_at: new Date() }
          : content
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel legacy content');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Retry delivery for a specific recipient
   */
  const retryDelivery = useCallback(async (contentId: string, recipientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock retry - in real implementation, this would call the service
      setLegacyContent(prev => prev.map(content => {
        if (content.id === contentId) {
          const updatedRecipients = content.recipients.map(recipient => 
            recipient.contact_id === recipientId
              ? { ...recipient, delivery_status: 'pending' as const }
              : recipient
          );
          return { ...content, recipients: updatedRecipients, updated_at: new Date() };
        }
        return content;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry delivery');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save content as draft
   */
  const saveDraft = useCallback(async (content: Partial<LegacyContent>) => {
    try {
      setLoading(true);
      setError(null);
      
      const draftContent = await service.createLegacyContent(userId, {
        ...content,
        status: 'draft'
      });
      
      setLegacyContent(prev => [...prev, draftContent]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadLegacyContent(),
      loadContacts()
    ]);
  }, [loadLegacyContent, loadContacts]);

  // Load initial data
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    legacyContent,
    contacts,
    loading,
    error,
    createLegacyContent,
    updateLegacyContent,
    cancelLegacyContent,
    retryDelivery,
    saveDraft,
    refresh
  };
}