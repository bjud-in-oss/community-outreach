/**
 * Legacy Content Creator Component
 * UI for creating "Hälsning till Framtiden" legacy messages
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  LegacyContent,
  LegacyContentType,
  LegacyTriggerType,
  LegacyRecipient,
  TimeBasedTriggerConfig,
  EventBasedTriggerConfig,
  QueryBasedTriggerConfig
} from '../../types/legacy-system';
import { Contact } from '../../types/data-models';

interface LegacyContentCreatorProps {
  /** Available contacts for recipient selection */
  contacts: Contact[];
  
  /** Callback when legacy content is created */
  onContentCreated: (content: Partial<LegacyContent>) => void;
  
  /** Callback when content is saved as draft */
  onSaveDraft: (content: Partial<LegacyContent>) => void;
  
  /** Whether the component is in loading state */
  loading?: boolean;
}

/**
 * Legacy Content Creator Component
 * Implements the UI for creating legacy messages with triggers
 */
export function LegacyContentCreator({
  contacts,
  onContentCreated,
  onSaveDraft,
  loading = false
}: LegacyContentCreatorProps) {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<LegacyContentType>('text_message');
  const [contentText, setContentText] = useState('');
  const [triggerType, setTriggerType] = useState<LegacyTriggerType>('time_based');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  
  // Time-based trigger state
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  
  // Event-based trigger state
  const [eventType, setEventType] = useState('birthday');
  const [eventCriteria, setEventCriteria] = useState('');
  
  // Query-based trigger state
  const [queryPatterns, setQueryPatterns] = useState<string[]>(['']);
  
  const handleAddQueryPattern = useCallback(() => {
    setQueryPatterns(prev => [...prev, '']);
  }, []);

  const handleUpdateQueryPattern = useCallback((index: number, value: string) => {
    setQueryPatterns(prev => prev.map((pattern, i) => i === index ? value : pattern));
  }, []);

  const handleRemoveQueryPattern = useCallback((index: number) => {
    setQueryPatterns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleRecipientToggle = useCallback((contactId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  }, []);

  const createTriggerConfig = useCallback(() => {
    switch (triggerType) {
      case 'time_based': {
        const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`);
        const config: TimeBasedTriggerConfig = {
          delivery_date: deliveryDateTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          respect_recipient_timezone: true
        };
        return config;
      }
      
      case 'event_based': {
        const config: EventBasedTriggerConfig = {
          event_type: eventType as any,
          criteria: eventCriteria ? JSON.parse(eventCriteria) : {}
        };
        return config;
      }
      
      case 'query_based': {
        const config: QueryBasedTriggerConfig = {
          query_patterns: queryPatterns
            .filter(pattern => pattern.trim())
            .map(pattern => ({
              pattern,
              type: 'contains' as const,
              weight: 1.0,
              case_sensitive: false
            })),
          confidence_threshold: 0.8
        };
        return config;
      }
      
      default:
        throw new Error(`Unknown trigger type: ${triggerType}`);
    }
  }, [triggerType, deliveryDate, deliveryTime, eventType, eventCriteria, queryPatterns]);

  const createLegacyContent = useCallback(() => {
    const triggerConfig = createTriggerConfig();
    
    const recipients: LegacyRecipient[] = selectedRecipients.map(contactId => ({
      contact_id: contactId,
      relationship: 'family', // Default - could be made configurable
      delivery_preferences: {
        delivery_method: 'in_app_notification',
        respect_emotional_state: true,
        max_delivery_attempts: 3
      },
      consent_status: 'pending',
      delivery_status: 'scheduled'
    }));

    const content: Partial<LegacyContent> = {
      title: title || 'Untitled Legacy Message',
      type: contentType,
      content: {
        text: contentText,
        metadata: {}
      },
      trigger: {
        id: `trigger_${Date.now()}`,
        type: triggerType,
        config: triggerConfig,
        description: createTriggerDescription(),
        active: true,
        created_at: new Date()
      },
      recipients,
      delivery_settings: {
        tactful_delivery: true,
        check_emotional_state: true,
        max_attempts: 3,
        retry_delay: { amount: 24, unit: 'hours' },
        notify_creator: true
      }
    };

    return content;
  }, [title, contentType, contentText, triggerType, selectedRecipients, createTriggerConfig]);

  const createTriggerDescription = useCallback(() => {
    switch (triggerType) {
      case 'time_based':
        return `Deliver on ${deliveryDate} at ${deliveryTime}`;
      case 'event_based':
        return `Deliver when ${eventType} occurs`;
      case 'query_based':
        return `Deliver when someone asks about: ${queryPatterns.filter(p => p.trim()).join(', ')}`;
      default:
        return 'Custom trigger';
    }
  }, [triggerType, deliveryDate, deliveryTime, eventType, queryPatterns]);

  const handleCreate = useCallback(() => {
    const content = createLegacyContent();
    onContentCreated(content);
  }, [createLegacyContent, onContentCreated]);

  const handleSaveDraft = useCallback(() => {
    const content = createLegacyContent();
    onSaveDraft(content);
  }, [createLegacyContent, onSaveDraft]);

  const isFormValid = title.trim() && contentText.trim() && selectedRecipients.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Skapa Hälsning till Framtiden</h2>
        <p className="text-gray-600">
          Skapa ett meddelande som kommer att levereras till dina nära och kära vid en framtida tidpunkt
        </p>
      </div>

      {/* Content Details */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-medium">Meddelande</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title-input" className="block text-sm font-medium mb-2">Titel</label>
            <Input
              id="title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ge ditt meddelande en titel..."
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="content-type-select" className="block text-sm font-medium mb-2">Typ av meddelande</label>
            <select
              id="content-type-select"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as LegacyContentType)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="text_message">Textmeddelande</option>
              <option value="story">Berättelse</option>
              <option value="video_message">Videomeddelande</option>
              <option value="audio_message">Ljudmeddelande</option>
              <option value="photo_collection">Fotosamling</option>
              <option value="memory_collection">Minnessamling</option>
            </select>
          </div>

          <div>
            <label htmlFor="content-text" className="block text-sm font-medium mb-2">Meddelande</label>
            <Textarea
              id="content-text"
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              placeholder="Skriv ditt meddelande här..."
              rows={6}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Trigger Configuration */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-medium">När ska meddelandet levereras?</h3>
        
        <div>
          <label htmlFor="trigger-type-select" className="block text-sm font-medium mb-2">Leveranstyp</label>
          <select
            id="trigger-type-select"
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as LegacyTriggerType)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="time_based">Vid specifik tid</option>
            <option value="event_based">När något händer</option>
            <option value="query_based">När någon frågar</option>
          </select>
        </div>

        {/* Time-based trigger configuration */}
        {triggerType === 'time_based' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="delivery-date" className="block text-sm font-medium mb-2">Datum</label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="delivery-time" className="block text-sm font-medium mb-2">Tid</label>
                <Input
                  id="delivery-time"
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Event-based trigger configuration */}
        {triggerType === 'event_based' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Händelse</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="birthday">Födelsedag</option>
                <option value="anniversary">Årsdag</option>
                <option value="graduation">Examen</option>
                <option value="marriage">Bröllop</option>
                <option value="retirement">Pension</option>
                <option value="milestone_age">Milstolpe ålder</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kriterier (JSON)</label>
              <Textarea
                value={eventCriteria}
                onChange={(e) => setEventCriteria(e.target.value)}
                placeholder='{"target_age": 65}'
                rows={3}
                className="w-full font-mono text-sm"
              />
            </div>
          </div>
        )}

        {/* Query-based trigger configuration */}
        {triggerType === 'query_based' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Frågemönster</label>
              <div className="space-y-2">
                {queryPatterns.map((pattern, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={pattern}
                      onChange={(e) => handleUpdateQueryPattern(index, e.target.value)}
                      placeholder="t.ex. 'Vad tyckte morfar om...'"
                      className="flex-1"
                    />
                    {queryPatterns.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveQueryPattern(index)}
                      >
                        Ta bort
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQueryPattern}
                >
                  Lägg till frågemönster
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Recipients */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-medium">Mottagare</h3>
        
        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedRecipients.includes(contact.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRecipientToggle(contact.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {contact.contact_details.encrypted_name || 'Unnamed Contact'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contact.relationship_type}
                  </div>
                </div>
                {selectedRecipients.includes(contact.id) && (
                  <Badge variant="default">Vald</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedRecipients.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Välj minst en mottagare för ditt meddelande
          </p>
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={loading || !title.trim()}
        >
          Spara som utkast
        </Button>
        <Button
          onClick={handleCreate}
          disabled={loading || !isFormValid}
        >
          {loading ? 'Skapar...' : 'Skapa hälsning'}
        </Button>
      </div>

      {/* Preview */}
      {title && contentText && (
        <Card className="p-6 bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Förhandsvisning</h3>
          <div className="space-y-2">
            <div><strong>Titel:</strong> {title}</div>
            <div><strong>Typ:</strong> {contentType}</div>
            <div><strong>Leverans:</strong> {createTriggerDescription()}</div>
            <div><strong>Mottagare:</strong> {selectedRecipients.length} personer</div>
            <div className="mt-4">
              <strong>Meddelande:</strong>
              <div className="mt-2 p-3 bg-white border rounded">
                {contentText}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}