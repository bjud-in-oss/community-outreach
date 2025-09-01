/**
 * Integration tests for Legacy System
 * Tests the complete workflow of the "Hälsning till Framtiden" system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LegacyContentCreator, LegacyContentManager } from '../../components/legacy-system';
import { useLegacySystem } from '../../hooks/use-legacy-system';
import { Contact } from '../../types/data-models';
import { LegacyContent } from '../../types/legacy-system';

// Mock the hook
vi.mock('../../hooks/use-legacy-system');

describe('Legacy System Integration', () => {
  const mockContacts: Contact[] = [
    {
      id: 'contact_1',
      owner_id: 'user_123',
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
      owner_id: 'user_123',
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

  const mockLegacyContent: LegacyContent[] = [
    {
      id: 'legacy_1',
      creator_id: 'user_123',
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

  let mockHookReturn: any;

  beforeEach(() => {
    mockHookReturn = {
      legacyContent: mockLegacyContent,
      contacts: mockContacts,
      loading: false,
      error: null,
      createLegacyContent: vi.fn(),
      updateLegacyContent: vi.fn(),
      cancelLegacyContent: vi.fn(),
      retryDelivery: vi.fn(),
      saveDraft: vi.fn(),
      refresh: vi.fn()
    };

    (useLegacySystem as any).mockReturnValue(mockHookReturn);
  });

  describe('LegacyContentCreator Component', () => {
    it('should render the legacy content creation form', () => {
      // Requirement 23.1: Implement LegacyContent creation and trigger definition
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      expect(screen.getByText('Skapa Hälsning till Framtiden')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ge ditt meddelande en titel...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Skriv ditt meddelande här...')).toBeInTheDocument();
    });

    it('should allow selecting time-based trigger', async () => {
      // Requirement 23.3: Time-based triggers (specific date)
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      const triggerSelect = screen.getByDisplayValue('Vid specifik tid');
      expect(triggerSelect).toBeInTheDocument();

      // Should show date and time inputs for time-based trigger
      expect(screen.getByLabelText('Datum')).toBeInTheDocument();
      expect(screen.getByLabelText('Tid')).toBeInTheDocument();
    });

    it('should allow selecting event-based trigger', async () => {
      // Requirement 23.3: Event-based triggers (milestone achieved by recipient)
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      const triggerSelect = screen.getByDisplayValue('Vid specifik tid');
      fireEvent.change(triggerSelect, { target: { value: 'event_based' } });

      await waitFor(() => {
        expect(screen.getByDisplayValue('När något händer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Födelsedag')).toBeInTheDocument();
      });
    });

    it('should allow selecting query-based trigger', async () => {
      // Requirement 23.3: Query-based triggers (specific question asked by future user)
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      const triggerSelect = screen.getByDisplayValue('Vid specifik tid');
      fireEvent.change(triggerSelect, { target: { value: 'query_based' } });

      await waitFor(() => {
        expect(screen.getByDisplayValue('När någon frågar')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('t.ex. \'Vad tyckte morfar om...\'')).toBeInTheDocument();
      });
    });

    it('should allow selecting recipients', async () => {
      const onContentCreated = vi.fn();
      
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={onContentCreated}
          onSaveDraft={vi.fn()}
        />
      );

      // Click on first contact
      const firstContact = screen.getByText('Anna Andersson');
      fireEvent.click(firstContact);

      await waitFor(() => {
        expect(screen.getByText('Vald')).toBeInTheDocument();
      });
    });

    it('should create legacy content with all required fields', async () => {
      const onContentCreated = vi.fn();
      
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={onContentCreated}
          onSaveDraft={vi.fn()}
        />
      );

      // Fill in the form
      fireEvent.change(screen.getByPlaceholderText('Ge ditt meddelande en titel...'), {
        target: { value: 'Test Legacy Message' }
      });
      
      fireEvent.change(screen.getByPlaceholderText('Skriv ditt meddelande här...'), {
        target: { value: 'This is a test message for the future.' }
      });

      // Set delivery date
      fireEvent.change(screen.getByLabelText('Datum'), {
        target: { value: '2030-12-25' }
      });
      
      fireEvent.change(screen.getByLabelText('Tid'), {
        target: { value: '10:00' }
      });

      // Select recipient
      fireEvent.click(screen.getByText('Anna Andersson'));

      // Submit
      const createButton = screen.getByText('Skapa hälsning');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(onContentCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Test Legacy Message',
            type: 'text_message',
            content: {
              text: 'This is a test message for the future.',
              metadata: {}
            },
            trigger: expect.objectContaining({
              type: 'time_based',
              config: expect.objectContaining({
                delivery_date: new Date('2030-12-25T10:00')
              })
            }),
            recipients: expect.arrayContaining([
              expect.objectContaining({
                contact_id: 'contact_1'
              })
            ])
          })
        );
      });
    });

    it('should save as draft', async () => {
      const onSaveDraft = vi.fn();
      
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={onSaveDraft}
        />
      );

      // Fill in title
      fireEvent.change(screen.getByPlaceholderText('Ge ditt meddelande en titel...'), {
        target: { value: 'Draft Message' }
      });

      // Save as draft
      const draftButton = screen.getByText('Spara som utkast');
      fireEvent.click(draftButton);

      await waitFor(() => {
        expect(onSaveDraft).toHaveBeenCalled();
      });
    });

    it('should show preview when content is filled', async () => {
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      // Fill in form
      fireEvent.change(screen.getByPlaceholderText('Ge ditt meddelande en titel...'), {
        target: { value: 'Preview Test' }
      });
      
      fireEvent.change(screen.getByPlaceholderText('Skriv ditt meddelande här...'), {
        target: { value: 'Preview message content' }
      });

      await waitFor(() => {
        expect(screen.getByText('Förhandsvisning')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Preview Test')).toBeInTheDocument(); // In input field
        expect(screen.getByText('Preview Test')).toBeInTheDocument(); // In preview
        expect(screen.getAllByText('Preview message content')).toHaveLength(2); // In textarea and preview
      });
    });
  });

  describe('LegacyContentManager Component', () => {
    it('should render legacy content list', () => {
      render(
        <LegacyContentManager
          legacyContent={mockLegacyContent}
          onEditContent={vi.fn()}
          onCancelContent={vi.fn()}
          onRetryDelivery={vi.fn()}
        />
      );

      expect(screen.getByText('Mina Hälsningar till Framtiden')).toBeInTheDocument();
      expect(screen.getByText('Brev till barnbarnen')).toBeInTheDocument();
      expect(screen.getAllByText('scheduled')).toHaveLength(2); // One in badge, one in recipient status
    });

    it('should filter content by status', async () => {
      render(
        <LegacyContentManager
          legacyContent={mockLegacyContent}
          onEditContent={vi.fn()}
          onCancelContent={vi.fn()}
          onRetryDelivery={vi.fn()}
        />
      );

      const filterSelect = screen.getByDisplayValue('Alla');
      fireEvent.change(filterSelect, { target: { value: 'scheduled' } });

      await waitFor(() => {
        expect(screen.getByText('Brev till barnbarnen')).toBeInTheDocument();
      });

      // Filter to drafts (should show no content)
      fireEvent.change(filterSelect, { target: { value: 'draft' } });

      await waitFor(() => {
        expect(screen.getByText('Inga hälsningar med status "draft".')).toBeInTheDocument();
      });
    });

    it('should show statistics', () => {
      render(
        <LegacyContentManager
          legacyContent={mockLegacyContent}
          onEditContent={vi.fn()}
          onCancelContent={vi.fn()}
          onRetryDelivery={vi.fn()}
        />
      );

      expect(screen.getByText('Statistik')).toBeInTheDocument();
      expect(screen.getAllByText('Schemalagda')).toHaveLength(2); // One in filter, one in statistics
      expect(screen.getAllByText('Levererade')).toHaveLength(2); // One in filter, one in statistics
      expect(screen.getByText('Totala mottagare')).toBeInTheDocument();
    });

    it('should handle cancel content action', async () => {
      const onCancelContent = vi.fn();
      
      render(
        <LegacyContentManager
          legacyContent={mockLegacyContent}
          onEditContent={vi.fn()}
          onCancelContent={onCancelContent}
          onRetryDelivery={vi.fn()}
        />
      );

      const cancelButton = screen.getByText('Avbryt');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(onCancelContent).toHaveBeenCalledWith('legacy_1');
      });
    });

    it('should show recipient delivery status', () => {
      render(
        <LegacyContentManager
          legacyContent={mockLegacyContent}
          onEditContent={vi.fn()}
          onCancelContent={vi.fn()}
          onRetryDelivery={vi.fn()}
        />
      );

      expect(screen.getByText('Mottagare (1)')).toBeInTheDocument();
      expect(screen.getAllByText('scheduled')).toHaveLength(2); // One in content status, one in recipient status
    });
  });

  describe('End-to-End Legacy System Workflow', () => {
    it('should complete full legacy content creation and management workflow', async () => {
      // Requirement 23.4: Write end-to-end tests for legacy message delivery
      const TestWorkflow = () => {
        const {
          legacyContent,
          contacts,
          createLegacyContent,
          cancelLegacyContent,
          loading,
          error
        } = useLegacySystem({ userId: 'user_123' });

        return (
          <div>
            <LegacyContentCreator
              contacts={contacts}
              onContentCreated={createLegacyContent}
              onSaveDraft={vi.fn()}
              loading={loading}
            />
            <LegacyContentManager
              legacyContent={legacyContent}
              onEditContent={vi.fn()}
              onCancelContent={cancelLegacyContent}
              onRetryDelivery={vi.fn()}
              loading={loading}
            />
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<TestWorkflow />);

      // Verify both components are rendered
      expect(screen.getByText('Skapa Hälsning till Framtiden')).toBeInTheDocument();
      expect(screen.getByText('Mina Hälsningar till Framtiden')).toBeInTheDocument();

      // Verify existing content is shown
      expect(screen.getByText('Brev till barnbarnen')).toBeInTheDocument();

      // Verify contacts are available for selection
      expect(screen.getByText('Anna Andersson')).toBeInTheDocument();
      expect(screen.getByText('Erik Eriksson')).toBeInTheDocument();
    });

    it('should handle loading states', () => {
      mockHookReturn.loading = true;

      const TestComponent = () => {
        const hookReturn = useLegacySystem({ userId: 'user_123' });
        return (
          <LegacyContentCreator
            contacts={hookReturn.contacts}
            onContentCreated={hookReturn.createLegacyContent}
            onSaveDraft={hookReturn.saveDraft}
            loading={hookReturn.loading}
          />
        );
      };

      render(<TestComponent />);

      const createButton = screen.getByText('Skapar...');
      expect(createButton).toBeDisabled();
    });

    it('should handle error states', () => {
      mockHookReturn.error = 'Failed to load legacy content';

      const TestComponent = () => {
        const hookReturn = useLegacySystem({ userId: 'user_123' });
        return (
          <div>
            {hookReturn.error && <div data-testid="error">{hookReturn.error}</div>}
            <LegacyContentManager
              legacyContent={hookReturn.legacyContent}
              onEditContent={vi.fn()}
              onCancelContent={hookReturn.cancelLegacyContent}
              onRetryDelivery={hookReturn.retryDelivery}
            />
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load legacy content');
    });
  });

  describe('Accessibility and Usability', () => {
    it('should have proper form labels and accessibility attributes', () => {
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      // Check for proper labels with associated form controls
      expect(screen.getByLabelText('Titel')).toBeInTheDocument();
      expect(screen.getByLabelText('Meddelande')).toBeInTheDocument();
      expect(screen.getByLabelText('Datum')).toBeInTheDocument();
      expect(screen.getByLabelText('Tid')).toBeInTheDocument();
      expect(screen.getByLabelText('Leveranstyp')).toBeInTheDocument();
      expect(screen.getByLabelText('Typ av meddelande')).toBeInTheDocument();
    });

    it('should provide helpful placeholder text', () => {
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText('Ge ditt meddelande en titel...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Skriv ditt meddelande här...')).toBeInTheDocument();
    });

    it('should show validation messages', () => {
      render(
        <LegacyContentCreator
          contacts={mockContacts}
          onContentCreated={vi.fn()}
          onSaveDraft={vi.fn()}
        />
      );

      expect(screen.getByText('Välj minst en mottagare för ditt meddelande')).toBeInTheDocument();
    });
  });
});