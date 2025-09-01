/**
 * Legacy Content Manager Component
 * UI for viewing and managing existing legacy messages
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  LegacyContent,
  LegacyContentStatus,
  DeliveryStatus,
  DeliveryAttempt
} from '../../types/legacy-system';

interface LegacyContentManagerProps {
  /** List of legacy content items */
  legacyContent: LegacyContent[];
  
  /** Callback when content is edited */
  onEditContent: (contentId: string) => void;
  
  /** Callback when content is cancelled */
  onCancelContent: (contentId: string) => void;
  
  /** Callback when delivery is retried */
  onRetryDelivery: (contentId: string, recipientId: string) => void;
  
  /** Whether operations are loading */
  loading?: boolean;
}

/**
 * Legacy Content Manager Component
 * Displays and manages existing legacy messages
 */
export function LegacyContentManager({
  legacyContent,
  onEditContent,
  onCancelContent,
  onRetryDelivery,
  loading = false
}: LegacyContentManagerProps) {
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [filter, setFilter] = useState<LegacyContentStatus | 'all'>('all');

  const filteredContent = legacyContent.filter(content => 
    filter === 'all' || content.status === filter
  );

  const getStatusBadgeVariant = (status: LegacyContentStatus) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'scheduled': return 'default';
      case 'active': return 'default';
      case 'delivered': return 'success' as any;
      case 'cancelled': return 'destructive';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  const getDeliveryStatusBadgeVariant = (status: DeliveryStatus) => {
    switch (status) {
      case 'scheduled': return 'secondary';
      case 'pending': return 'default';
      case 'delivered': return 'success' as any;
      case 'failed': return 'destructive';
      case 'refused': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatTriggerDescription = (content: LegacyContent) => {
    const trigger = content.trigger;
    switch (trigger.type) {
      case 'time_based':
        return `Levereras ${content.scheduled_delivery_at?.toLocaleDateString('sv-SE')}`;
      case 'event_based':
        return `Levereras när händelse inträffar`;
      case 'query_based':
        return `Levereras när någon frågar`;
      default:
        return 'Anpassad utlösare';
    }
  };

  const getLastDeliveryAttempt = (content: LegacyContent, recipientId: string): DeliveryAttempt | null => {
    const attempts = content.delivery_attempts.filter(a => a.recipient_id === recipientId);
    return attempts.length > 0 ? attempts[attempts.length - 1] : null;
  };

  const canRetryDelivery = (content: LegacyContent, recipientId: string): boolean => {
    const recipient = content.recipients.find(r => r.contact_id === recipientId);
    if (!recipient) return false;
    
    const attempts = content.delivery_attempts.filter(a => a.recipient_id === recipientId);
    return attempts.length < recipient.delivery_preferences.max_delivery_attempts &&
           recipient.delivery_status === 'failed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Mina Hälsningar till Framtiden</h2>
          <p className="text-gray-600">
            Hantera dina schemalagda meddelanden
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LegacyContentStatus | 'all')}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">Alla</option>
            <option value="draft">Utkast</option>
            <option value="scheduled">Schemalagda</option>
            <option value="active">Aktiva</option>
            <option value="delivered">Levererade</option>
            <option value="cancelled">Avbrutna</option>
            <option value="expired">Utgångna</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="space-y-4">
        {filteredContent.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Du har inga hälsningar till framtiden än.'
                : `Inga hälsningar med status "${filter}".`
              }
            </p>
          </Card>
        ) : (
          filteredContent.map((content) => (
            <Card key={content.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">{content.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusBadgeVariant(content.status)}>
                        {content.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatTriggerDescription(content)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {content.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditContent(content.id)}
                        disabled={loading}
                      >
                        Redigera
                      </Button>
                    )}
                    {(content.status === 'scheduled' || content.status === 'active') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onCancelContent(content.id)}
                        disabled={loading}
                      >
                        Avbryt
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content Preview */}
                <div className="bg-gray-50 p-3 rounded border">
                  <p className="text-sm line-clamp-3">
                    {content.content.text || 'Inget textinnehåll'}
                  </p>
                </div>

                {/* Recipients Status */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Mottagare ({content.recipients.length})</h4>
                  <div className="space-y-2">
                    {content.recipients.map((recipient) => {
                      const lastAttempt = getLastDeliveryAttempt(content, recipient.contact_id);
                      const canRetry = canRetryDelivery(content, recipient.contact_id);
                      
                      return (
                        <div
                          key={recipient.contact_id}
                          className="flex items-center justify-between p-3 bg-white border rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              Kontakt {recipient.contact_id.slice(-8)}
                            </div>
                            <Badge variant={getDeliveryStatusBadgeVariant(recipient.delivery_status)}>
                              {recipient.delivery_status}
                            </Badge>
                            {lastAttempt && (
                              <span className="text-xs text-gray-500">
                                Senaste försök: {lastAttempt.attempted_at.toLocaleDateString('sv-SE')}
                              </span>
                            )}
                          </div>
                          
                          {canRetry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRetryDelivery(content.id, recipient.contact_id)}
                              disabled={loading}
                            >
                              Försök igen
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery Attempts (if any failures) */}
                {content.delivery_attempts.some(a => a.result === 'failed') && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-red-600">Leveransförsök</h4>
                    <div className="space-y-1">
                      {content.delivery_attempts
                        .filter(a => a.result === 'failed')
                        .slice(-3) // Show last 3 failed attempts
                        .map((attempt, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-red-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>Försök {attempt.attempt_number}</span>
                              <span>{attempt.attempted_at.toLocaleString('sv-SE')}</span>
                            </div>
                            {attempt.error_message && (
                              <div className="mt-1 text-red-600">
                                Fel: {attempt.error_message}
                              </div>
                            )}
                            {attempt.next_retry_at && (
                              <div className="mt-1">
                                Nästa försök: {attempt.next_retry_at.toLocaleString('sv-SE')}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
                  <span>Skapad: {content.created_at.toLocaleDateString('sv-SE')}</span>
                  <span>Uppdaterad: {content.updated_at.toLocaleDateString('sv-SE')}</span>
                  {content.delivered_at && (
                    <span>Levererad: {content.delivered_at.toLocaleDateString('sv-SE')}</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Statistics */}
      {legacyContent.length > 0 && (
        <Card className="p-6 bg-blue-50">
          <h3 className="text-lg font-medium mb-4">Statistik</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {legacyContent.filter(c => c.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Schemalagda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {legacyContent.filter(c => c.status === 'delivered').length}
              </div>
              <div className="text-sm text-gray-600">Levererade</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {legacyContent.filter(c => c.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Utkast</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {legacyContent.reduce((sum, c) => sum + c.recipients.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Totala mottagare</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}