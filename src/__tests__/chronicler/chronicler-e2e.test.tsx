/**
 * End-to-End Tests for Personal Chronicler Application
 * Tests the complete chronicler workflow including:
 * - Private reflection saving with emotional context (Requirement 19.1)
 * - Cortex-mode message transformation for recipients (Requirement 19.2)  
 * - External asset integration (Google Photos, Gmail) (Requirement 19.3)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChroniclerDashboard } from '../../components/chronicler/chronicler-dashboard';
import { ChroniclerService } from '../../services/chronicler-service';
import { UserState, Asset } from '../../types';
import { 
  ReflectionEntry, 
  CortexTransformation,
  ExternalAssetIntegration,
  TransformationType 
} from '../../types/chronicler';

// Mock the services
const mockMemoryAssistant = {
  saveReflection: vi.fn(),
  storeEmotionalContext: vi.fn(),
  getReflection: vi.fn(),
  getUserReflections: vi.fn(),
  saveTransformation: vi.fn(),
  saveExternalIntegration: vi.fn(),
  getExternalIntegration: vi.fn(),
  getUser: vi.fn(),
  getRelationship: vi.fn(),
  searchReflections: vi.fn(),
  saveWorkflow: vi.fn(),
  getWorkflow: vi.fn()
} as any;

const mockCognitiveAgent = {
  processInput: vi.fn(),
  processInCortexMode: vi.fn()
} as any;

const mockResourceGovernor = {
  validateAction: vi.fn(),
  validateCortexMode: vi.fn()
} as any;

describe('Personal Chronicler E2E Workflow', () => {
  let chroniclerService: ChroniclerService;
  let user: ReturnType<typeof userEvent.setup>;
  
  const mockEmotionalContext: UserState = {
    fight: 0.3,
    flight: 0.4,
    fixes: 0.6,
    timestamp: new Date()
  };

  const mockReflection: ReflectionEntry = {
    id: 'reflection-123',
    user_id: 'user-123',
    title: 'A Beautiful Day',
    content: {
      text: 'Today was filled with gratitude and joy. I spent time with family and felt deeply connected.',
      blocks: [],
      metadata: {
        word_count: 15,
        reading_time_minutes: 1,
        dominant_emotions: ['gratitude', 'joy'],
        themes: ['family', 'connection'],
        language: 'sv'
      }
    },
    emotional_context: mockEmotionalContext,
    privacy_level: 'shareable',
    assets: [],
    tags: ['family', 'gratitude', 'joy'],
    shareable: true,
    created_at: new Date(),
    updated_at: new Date(),
    status: 'saved'
  };

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockMemoryAssistant.getUserReflections.mockResolvedValue({
      reflections: [mockReflection],
      total: 1
    });
    
    mockMemoryAssistant.saveReflection.mockImplementation((reflection) =>
      Promise.resolve({ ...reflection, id: 'new-reflection-id' })
    );
    
    mockMemoryAssistant.storeEmotionalContext.mockResolvedValue(true);
    
    mockResourceGovernor.validateAction.mockResolvedValue(true);
    mockResourceGovernor.validateCortexMode.mockResolvedValue(true);
    
    chroniclerService = new ChroniclerService(
      mockMemoryAssistant,
      mockCognitiveAgent,
      mockResourceGovernor
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 19.1: Private reflection saving with emotional context', () => {
    it('should complete the full reflection creation workflow', async () => {
      render(
        <ChroniclerDashboard
          userId="user-123"
          emotionalContext={mockEmotionalContext}
          chroniclerService={chroniclerService}
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Personlig Krönikör')).toBeInTheDocument();
      });

      // Step 1: Click "Ny reflektion" button
      const newReflectionButton = screen.getByRole('button', { name: /ny reflektion/i });
      await user.click(newReflectionButton);

      // Step 2: Verify reflection editor opens
      await waitFor(() => {
        expect(screen.getByText('Ny reflektion')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Titel för din reflektion...')).toBeInTheDocument();
      });

      // Step 3: Fill in reflection details
      const titleInput = screen.getByPlaceholderText('Titel för din reflektion...');
      await user.type(titleInput, 'My Test Reflection');

      const contentTextarea = screen.getByPlaceholderText('Skriv dina tankar här...');
      await user.type(contentTextarea, 'This is a test reflection with emotional context.');

      // Step 4: Verify emotional context is displayed
      const emotionalContextButton = screen.getByRole('button', { name: /känslomässigt sammanhang/i });
      await user.click(emotionalContextButton);

      await waitFor(() => {
        expect(screen.getByText('Ditt känslomässiga tillstånd')).toBeInTheDocument();
        expect(screen.getByText('30%')).toBeInTheDocument(); // fight: 0.3
        expect(screen.getByText('40%')).toBeInTheDocument(); // flight: 0.4
        expect(screen.getByText('60%')).toBeInTheDocument(); // fixes: 0.6
      });

      // Step 5: Add tags
      const tagInput = screen.getByPlaceholderText('Lägg till tagg...');
      await user.type(tagInput, 'test');
      
      const addTagButton = screen.getByRole('button', { name: '' }); // Plus icon button
      await user.click(addTagButton);

      // Step 6: Set privacy level to shareable
      const privacySelect = screen.getByDisplayValue('🔒 Privat');
      await user.selectOptions(privacySelect, '🔗 Delbar');

      // Step 7: Save reflection
      const saveButton = screen.getByRole('button', { name: /spara reflektion/i });
      await user.click(saveButton);

      // Step 8: Verify service calls
      await waitFor(() => {
        expect(mockResourceGovernor.validateAction).toHaveBeenCalledWith({
          type: 'create_reflection',
          userId: 'user-123',
          resourceCost: expect.any(Object)
        });

        expect(mockMemoryAssistant.saveReflection).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My Test Reflection',
            content: expect.objectContaining({
              text: 'This is a test reflection with emotional context.'
            }),
            emotional_context: mockEmotionalContext,
            privacy_level: 'shareable',
            tags: ['test'],
            shareable: true
          })
        );

        expect(mockMemoryAssistant.storeEmotionalContext).toHaveBeenCalledWith(
          expect.any(String),
          mockEmotionalContext,
          'reflection_creation'
        );
      });
    });

    it('should save reflection with correct emotional context metadata', async () => {
      const reflection = await chroniclerService.createReflection(
        'user-123',
        {
          text: 'A reflection about my day',
          blocks: [],
          metadata: {
            word_count: 5,
            reading_time_minutes: 1,
            dominant_emotions: [],
            themes: [],
            language: 'sv'
          }
        },
        mockEmotionalContext
      );

      expect(reflection.emotional_context).toEqual(mockEmotionalContext);
      expect(mockMemoryAssistant.storeEmotionalContext).toHaveBeenCalledWith(
        reflection.id,
        mockEmotionalContext,
        'reflection_creation'
      );
    });
  });

  describe('Requirement 19.2: Cortex-mode message transformation for recipients', () => {
    beforeEach(() => {
      mockMemoryAssistant.getReflection.mockResolvedValue(mockReflection);
      mockMemoryAssistant.getUser.mockResolvedValue({
        id: 'recipient-123',
        profile: { preferences: { communication_style: 'warm' } }
      });
      mockMemoryAssistant.getRelationship.mockResolvedValue({
        type: 'family',
        closeness: 0.8
      });
      
      mockCognitiveAgent.processInCortexMode.mockResolvedValue({
        text: 'Kära mamma, jag ville dela denna vackra dag med dig. Idag kände jag så mycket tacksamhet...',
        tone: 'warm',
        adaptations: [
          {
            type: 'relationship',
            description: 'Anpassad för familjerelation',
            original: 'Today was filled with gratitude',
            adapted: 'Idag kände jag så mycket tacksamhet'
          }
        ],
        delivery_method: 'direct_message'
      });
    });

    it('should complete the full message transformation workflow', async () => {
      render(
        <ChroniclerDashboard
          userId="user-123"
          emotionalContext={mockEmotionalContext}
          chroniclerService={chroniclerService}
        />
      );

      // Wait for reflections to load
      await waitFor(() => {
        expect(screen.getByText('A Beautiful Day')).toBeInTheDocument();
      });

      // Step 1: Click "Dela" button on a reflection
      const shareButton = screen.getByRole('button', { name: /dela/i });
      await user.click(shareButton);

      // Step 2: Verify transformation dialog opens
      await waitFor(() => {
        expect(screen.getByText('Välj mottagare')).toBeInTheDocument();
      });

      // Step 3: Fill in recipient information
      const recipientNameInput = screen.getByPlaceholderText('Ange namn...');
      await user.type(recipientNameInput, 'Mamma');

      const recipientIdInput = screen.getByPlaceholderText('Ange ID eller e-post...');
      await user.type(recipientIdInput, 'recipient-123');

      // Step 4: Select transformation type
      const personalMessageOption = screen.getByText('Personligt meddelande');
      await user.click(personalMessageOption);

      // Step 5: Continue to configuration
      const nextButton = screen.getByRole('button', { name: /nästa/i });
      await user.click(nextButton);

      // Step 6: Configure transformation parameters
      await waitFor(() => {
        expect(screen.getByText('Anpassa meddelandet')).toBeInTheDocument();
      });

      const relationSelect = screen.getByDisplayValue('Vän');
      await user.selectOptions(relationSelect, 'Familj');

      const emotionalImpactInput = screen.getByPlaceholderText(/uppmuntrande.*nostalgisk.*inspirerande/);
      await user.clear(emotionalImpactInput);
      await user.type(emotionalImpactInput, 'kärleksfull och varm');

      // Step 7: Start transformation
      const startTransformButton = screen.getByRole('button', { name: /starta transformation/i });
      await user.click(startTransformButton);

      // Step 8: Verify processing state
      await waitFor(() => {
        expect(screen.getByText('Transformerar din reflektion')).toBeInTheDocument();
        expect(screen.getByText(/Cortex-läget analyserar/)).toBeInTheDocument();
      });

      // Step 9: Verify completion and transformed content
      await waitFor(() => {
        expect(screen.getByText('Transformation klar!')).toBeInTheDocument();
        expect(screen.getByText(/Kära mamma.*tacksamhet/)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 10: Verify service calls
      expect(mockResourceGovernor.validateCortexMode).toHaveBeenCalledWith({
        userId: 'user-123',
        operation: 'message_transformation',
        complexity: 'high'
      });

      expect(mockCognitiveAgent.processInCortexMode).toHaveBeenCalledWith({
        task: 'transform_reflection_for_recipient',
        input: expect.objectContaining({
          original_content: mockReflection.content,
          emotional_context: mockReflection.emotional_context,
          transformation_type: 'personal_message'
        })
      });

      expect(mockMemoryAssistant.saveTransformation).toHaveBeenCalled();
    });

    it('should handle different transformation types correctly', async () => {
      const transformationTypes: TransformationType[] = [
        'personal_message',
        'memory_share', 
        'story_adaptation',
        'emotional_summary',
        'legacy_message'
      ];

      for (const type of transformationTypes) {
        const transformation = await chroniclerService.transformForRecipient(
          'reflection-123',
          'recipient-123',
          type,
          {
            relationship_type: 'family',
            emotional_impact: 'warm',
            formality_level: 'casual',
            include_emotional_context: true
          }
        );

        expect(transformation.type).toBe(type);
        expect(transformation.status).toBe('completed');
        expect(mockCognitiveAgent.processInCortexMode).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              transformation_type: type
            })
          })
        );
      }
    });
  });

  describe('Requirement 19.3: External asset integration (Google Photos, Gmail)', () => {
    beforeEach(() => {
      mockMemoryAssistant.saveExternalIntegration.mockImplementation((integration) =>
        Promise.resolve({ ...integration, id: 'integration-123' })
      );
      
      mockMemoryAssistant.getExternalIntegration.mockResolvedValue({
        id: 'integration-123',
        status: 'connected',
        settings: { auto_sync: true }
      });
    });

    it('should complete the full external integration workflow', async () => {
      render(
        <ChroniclerDashboard
          userId="user-123"
          emotionalContext={mockEmotionalContext}
          chroniclerService={chroniclerService}
        />
      );

      // Step 1: Open integrations panel
      const integrationsButton = screen.getByRole('button', { name: /integrationer/i });
      await user.click(integrationsButton);

      // Step 2: Verify integration panel opens
      await waitFor(() => {
        expect(screen.getByText('Externa integrationer')).toBeInTheDocument();
      });

      // Step 3: Add new integration
      const addIntegrationButton = screen.getByRole('button', { name: /lägg till integration/i });
      await user.click(addIntegrationButton);

      // Step 4: Select Google Photos
      await waitFor(() => {
        expect(screen.getByText('Google Photos')).toBeInTheDocument();
      });

      const googlePhotosOption = screen.getByText('Google Photos').closest('div');
      await user.click(googlePhotosOption!);

      // Step 5: Enter authentication token
      await waitFor(() => {
        expect(screen.getByText(/Anslut till Google Photos/)).toBeInTheDocument();
      });

      const tokenInput = screen.getByPlaceholderText('Ange din token...');
      await user.type(tokenInput, 'mock-google-photos-token');

      // Step 6: Connect integration
      const connectButton = screen.getByRole('button', { name: /anslut/i });
      await user.click(connectButton);

      // Step 7: Verify service calls
      await waitFor(() => {
        expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 'user-123',
            provider: 'google_photos',
            status: 'connected',
            settings: expect.objectContaining({
              auto_sync: true,
              asset_types: ['image', 'video'],
              privacy: expect.objectContaining({
                encrypt_assets: true,
                require_consent: true
              })
            })
          })
        );
      });
    });

    it('should setup Google Photos integration correctly', async () => {
      const integration = await chroniclerService.setupExternalIntegration(
        'user-123',
        'google_photos',
        'test-token',
        {
          auto_sync: true,
          sync_frequency_hours: 24,
          asset_types: ['image', 'video']
        }
      );

      expect(integration.provider).toBe('google_photos');
      expect(integration.status).toBe('connected');
      expect(integration.settings.auto_sync).toBe(true);
      expect(integration.settings.privacy.encrypt_assets).toBe(true);
      
      expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'google_photos',
          auth: expect.objectContaining({
            scopes: ['https://www.googleapis.com/auth/photoslibrary.readonly']
          })
        })
      );
    });

    it('should setup Gmail integration correctly', async () => {
      const integration = await chroniclerService.setupExternalIntegration(
        'user-123',
        'gmail',
        'test-gmail-token',
        {
          auto_sync: false,
          sync_frequency_hours: 168, // Weekly
          asset_types: ['document', 'image']
        }
      );

      expect(integration.provider).toBe('gmail');
      expect(integration.settings.auto_sync).toBe(false);
      
      expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'gmail',
          auth: expect.objectContaining({
            scopes: ['https://www.googleapis.com/auth/gmail.readonly']
          })
        })
      );
    });

    it('should handle asset synchronization workflow', async () => {
      // Setup integration first
      const integration = await chroniclerService.setupExternalIntegration(
        'user-123',
        'google_photos',
        'test-token',
        { auto_sync: true, sync_frequency_hours: 24, asset_types: ['image'] }
      );

      // Mock sync results
      const mockSyncResults = {
        total_synced: 25,
        last_sync_added: 5,
        last_sync_updated: 2,
        last_sync_failed: 1,
        total_sync_time_ms: 5000,
        avg_sync_time_per_asset_ms: 200
      };

      // Mock the sync process
      vi.spyOn(chroniclerService as any, 'performExternalSync')
        .mockResolvedValue(mockSyncResults);

      // Trigger sync
      await chroniclerService.syncExternalAssets(integration.id);

      // Verify sync was called and integration updated
      expect(mockMemoryAssistant.getExternalIntegration).toHaveBeenCalledWith(integration.id);
      expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'connected',
          last_sync_at: expect.any(Date),
          sync_stats: mockSyncResults
        })
      );
    });
  });

  describe('Complete End-to-End Chronicler Workflow', () => {
    it('should execute the complete chronicler workflow from creation to sharing', async () => {
      // Mock all necessary service responses
      mockMemoryAssistant.getReflection.mockResolvedValue(mockReflection);
      mockCognitiveAgent.processInCortexMode.mockResolvedValue({
        text: 'Transformed message for sharing',
        tone: 'warm',
        adaptations: [],
        delivery_method: 'direct_message'
      });

      // Step 1: Create reflection with emotional context
      const reflection = await chroniclerService.createReflection(
        'user-123',
        {
          text: 'A meaningful reflection about my day',
          blocks: [],
          metadata: {
            word_count: 7,
            reading_time_minutes: 1,
            dominant_emotions: ['gratitude'],
            themes: ['reflection'],
            language: 'sv'
          }
        },
        mockEmotionalContext
      );

      expect(reflection.emotional_context).toEqual(mockEmotionalContext);

      // Step 2: Transform for recipient using Cortex-mode
      const transformation = await chroniclerService.transformForRecipient(
        reflection.id,
        'recipient-123',
        'personal_message',
        {
          relationship_type: 'family',
          emotional_impact: 'warm',
          formality_level: 'casual',
          include_emotional_context: true
        }
      );

      expect(transformation.status).toBe('completed');
      expect(transformation.transformed_content.text).toBe('Transformed message for sharing');

      // Step 3: Setup external integration
      const integration = await chroniclerService.setupExternalIntegration(
        'user-123',
        'google_photos',
        'test-token',
        {
          auto_sync: true,
          sync_frequency_hours: 24,
          asset_types: ['image']
        }
      );

      expect(integration.provider).toBe('google_photos');

      // Verify all requirements are met
      expect(mockMemoryAssistant.saveReflection).toHaveBeenCalled(); // 19.1
      expect(mockMemoryAssistant.storeEmotionalContext).toHaveBeenCalled(); // 19.1
      expect(mockCognitiveAgent.processInCortexMode).toHaveBeenCalled(); // 19.2
      expect(mockMemoryAssistant.saveExternalIntegration).toHaveBeenCalled(); // 19.3
    });
  });
});