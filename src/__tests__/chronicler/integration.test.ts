/**
 * Integration test for Personal Chronicler functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { ChroniclerService } from '../../services/chronicler-service';
import { UserState } from '../../types';

describe('Personal Chronicler Integration', () => {
  it('demonstrates the complete chronicler workflow', async () => {
    // Mock dependencies
    const mockMemoryAssistant = {
      saveReflection: vi.fn().mockImplementation((reflection) => 
        Promise.resolve({ ...reflection, id: 'test-reflection-id' })
      ),
      storeEmotionalContext: vi.fn().mockResolvedValue(true),
      getReflection: vi.fn().mockImplementation((id) => Promise.resolve({
        id,
        user_id: 'test-user',
        privacy_level: 'shareable',
        content: { 
          text: 'Test reflection',
          blocks: [],
          metadata: {
            word_count: 2,
            reading_time_minutes: 1,
            dominant_emotions: [],
            themes: [],
            language: 'sv'
          }
        },
        emotional_context: { fight: 0.3, flight: 0.4, fixes: 0.6, timestamp: new Date() },
        assets: [],
        tags: [],
        shareable: true,
        created_at: new Date(),
        updated_at: new Date(),
        status: 'saved',
        title: 'Test Reflection'
      })),
      saveTransformation: vi.fn().mockResolvedValue(true),
      saveExternalIntegration: vi.fn().mockImplementation((integration) =>
        Promise.resolve({ ...integration, id: 'test-integration-id' })
      ),
      getUser: vi.fn().mockResolvedValue({ id: 'recipient-id', profile: { preferences: {} } }),
      getRelationship: vi.fn().mockResolvedValue({ type: 'friend' }),
      getExternalIntegration: vi.fn().mockResolvedValue({
        id: 'test-integration-id',
        status: 'connected',
        settings: { auto_sync: true }
      })
    } as any;

    const mockCognitiveAgent = {
      processInCortexMode: vi.fn().mockResolvedValue({
        text: 'Transformed message',
        tone: 'warm',
        adaptations: [],
        delivery_method: 'direct_message'
      })
    } as any;

    const mockResourceGovernor = {
      validateAction: vi.fn().mockResolvedValue(true),
      validateCortexMode: vi.fn().mockResolvedValue(true)
    } as any;

    const chroniclerService = new ChroniclerService(
      mockMemoryAssistant,
      mockCognitiveAgent,
      mockResourceGovernor
    );

    const emotionalContext: UserState = {
      fight: 0.3,
      flight: 0.4,
      fixes: 0.6,
      timestamp: new Date()
    };

    // Test 1: Create reflection with emotional context
    const reflection = await chroniclerService.createReflection(
      'test-user',
      {
        text: 'Today was a meaningful day.',
        blocks: [],
        metadata: {
          word_count: 5,
          reading_time_minutes: 1,
          dominant_emotions: ['gratitude'],
          themes: ['reflection'],
          language: 'sv'
        }
      },
      emotionalContext
    );

    expect(reflection.id).toMatch(/^chr_\d+_[a-z0-9]+$/);
    expect(reflection.emotional_context).toEqual(emotionalContext);

    // Test 2: Transform for recipient
    const transformation = await chroniclerService.transformForRecipient(
      reflection.id,
      'recipient-id',
      'personal_message',
      {
        relationship_type: 'friend',
        emotional_impact: 'warm',
        formality_level: 'casual',
        include_emotional_context: true
      }
    );

    expect(transformation.status).toBe('completed');
    expect(transformation.transformed_content.text).toBe('Transformed message');

    // Test 3: Setup external integration
    const integration = await chroniclerService.setupExternalIntegration(
      'test-user',
      'google_photos',
      'test-token',
      {
        auto_sync: true,
        sync_frequency_hours: 24,
        asset_types: ['image']
      }
    );

    expect(integration.id).toMatch(/^chr_\d+_[a-z0-9]+$/);
    expect(integration.provider).toBe('google_photos');

    // Verify all core functions were called
    expect(mockMemoryAssistant.saveReflection).toHaveBeenCalled();
    expect(mockMemoryAssistant.storeEmotionalContext).toHaveBeenCalled();
    expect(mockCognitiveAgent.processInCortexMode).toHaveBeenCalled();
    expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalled();
  });
});