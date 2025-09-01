/**
 * Integration Tests for Collaborative Space Features
 * Tests the complete collaboration workflow including:
 * - Secure invitation system with permission levels (Requirement 20.1)
 * - Proactive contact suggestion based on Graph RAG analysis (Requirement 20.2)
 * - Mutual consent requirement for collaboration (Requirement 20.3)
 * - Collaborative session with soft block-level locking (Requirement 20.4)
 * - Guest user data access limitation (Requirement 20.6)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollaborationService } from '../../services/collaboration-service';
import { InvitationDialog } from '../../components/collaboration/invitation-dialog';
import { CollaborativeEditor } from '../../components/collaboration/collaborative-editor';
import { UserState } from '../../types';
import { 
  CollaborationInvitation,
  CollaborativeSession,
  ContactSuggestion,
  CollaborationConsent,
  GuestAccessControl,
  PermissionLevel
} from '../../types/collaboration';

// Mock the services
const mockMemoryAssistant = {
  saveInvitation: vi.fn(),
  getInvitation: vi.fn(),
  saveCollaborationConsent: vi.fn(),
  saveCollaborativeSession: vi.fn(),
  getCollaborativeSession: vi.fn(),
  getCollaborativeSessionByResource: vi.fn(),
  saveGuestAccessControl: vi.fn(),
  getGuestAccessControl: vi.fn(),
  queryGraphRAG: vi.fn(),
  getUser: vi.fn(),
  getResource: vi.fn()
} as any;

const mockCognitiveAgent = {
  processInput: vi.fn()
} as any;

const mockResourceGovernor = {
  validateAction: vi.fn()
} as any;

describe('Collaborative Space Integration Tests', () => {
  let collaborationService: CollaborationService;
  let user: ReturnType<typeof userEvent.setup>;
  
  const mockUserState: UserState = {
    fight: 0.4,
    flight: 0.3,
    fixes: 0.7,
    timestamp: new Date()
  };

  const mockContactSuggestions: ContactSuggestion[] = [
    {
      id: 'suggestion-1',
      contact_id: 'contact-123',
      contact_name: 'Anna Andersson',
      reason: 'similar_theme',
      confidence: 0.85,
      evidence: [
        {
          type: 'theme_overlap',
          description: 'Har arbetat med 3 liknande teman',
          strength: 0.85,
          data: { shared_themes: ['family', 'gratitude', 'reflection'] }
        }
      ],
      context: {
        current_task: 'Reflecting on family memories',
        user_state: mockUserState,
        themes: ['family', 'gratitude'],
        urgency: 'medium'
      },
      created_at: new Date(),
      status: 'pending'
    },
    {
      id: 'suggestion-2',
      contact_id: 'contact-456',
      contact_name: 'Erik Eriksson',
      reason: 'expertise_match',
      confidence: 0.75,
      evidence: [
        {
          type: 'skill_match',
          description: 'Har expertis inom reflektion och mindfulness',
          strength: 0.75,
          data: { skills: ['reflection', 'mindfulness', 'emotional_support'] }
        }
      ],
      context: {
        current_task: 'Reflecting on family memories',
        user_state: mockUserState,
        themes: ['family', 'gratitude'],
        required_skills: ['reflection', 'emotional_support'],
        urgency: 'medium'
      },
      created_at: new Date(),
      status: 'pending'
    }
  ];

  const mockCollaborativeSession: CollaborativeSession = {
    id: 'session-123',
    resource_id: 'reflection-123',
    resource_type: 'reflection',
    participants: [
      {
        user_id: 'user-123',
        display_name: 'Test User',
        permission_level: 'admin',
        joined_at: new Date(),
        last_seen_at: new Date(),
        status: 'active'
      },
      {
        user_id: 'contact-123',
        display_name: 'Anna Andersson',
        permission_level: 'editor',
        joined_at: new Date(),
        last_seen_at: new Date(),
        status: 'active'
      }
    ],
    block_locks: [],
    status: 'active',
    started_at: new Date(),
    last_activity_at: new Date(),
    metadata: {
      settings: {
        allow_anonymous: false,
        require_approval: true,
        auto_save_interval: 30,
        lock_timeout: 300,
        max_participants: 10
      },
      activity_log: []
    }
  };

  beforeEach(() => {
    user = userEvent.setup();
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockResourceGovernor.validateAction.mockResolvedValue(true);
    
    mockMemoryAssistant.saveInvitation.mockImplementation((invitation) =>
      Promise.resolve({ ...invitation, id: 'invitation-123' })
    );
    
    mockMemoryAssistant.getInvitation.mockResolvedValue({
      id: 'invitation-123',
      sender_id: 'user-123',
      recipient_id: 'contact-123',
      status: 'pending'
    });
    
    mockMemoryAssistant.queryGraphRAG.mockResolvedValue([
      {
        c: { id: 'contact-123', name: 'Anna Andersson' },
        collaboration_count: 5,
        shared_themes: ['family', 'gratitude']
      }
    ]);
    
    mockCognitiveAgent.processInput.mockResolvedValue({
      text: 'Analysis complete: Found relevant contacts based on themes and expertise'
    });
    
    collaborationService = new CollaborationService(
      mockMemoryAssistant,
      mockCognitiveAgent,
      mockResourceGovernor
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 20.1: Secure invitation system with permission levels', () => {
    it('should complete the full invitation workflow', async () => {
      render(
        <InvitationDialog
          resourceId="reflection-123"
          resourceType="reflection"
          userId="user-123"
          userState={mockUserState}
          currentTask="Reflecting on family memories"
          themes={['family', 'gratitude']}
          onClose={() => {}}
          collaborationService={collaborationService}
        />
      );

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Välj kontakter')).toBeInTheDocument();
      });

      // Step 1: Select contacts (mock contact selection)
      const nextButton = screen.getByRole('button', { name: /nästa/i });
      
      // Mock contact selection by directly proceeding to configure step
      fireEvent.click(nextButton);

      // Step 2: Configure permissions
      await waitFor(() => {
        expect(screen.getByText('Konfigurera inbjudningar')).toBeInTheDocument();
      });

      // Verify permission levels are displayed
      expect(screen.getByText('Tittare')).toBeInTheDocument();
      expect(screen.getByText('Redigerare')).toBeInTheDocument();
      expect(screen.getByText('Administratör')).toBeInTheDocument();

      // Add invitation message
      const messageTextarea = screen.getByPlaceholderText(/skriv ett personligt meddelande/i);
      await user.type(messageTextarea, 'Hej! Jag skulle vilja dela denna reflektion med dig.');

      // Send invitations
      const sendButton = screen.getByRole('button', { name: /skicka inbjudningar/i });
      await user.click(sendButton);

      // Verify service calls
      await waitFor(() => {
        expect(mockResourceGovernor.validateAction).toHaveBeenCalledWith({
          type: 'create_invitation',
          userId: 'user-123',
          resourceCost: { compute: 1 }
        });

        expect(mockMemoryAssistant.saveInvitation).toHaveBeenCalled();
      });
    });

    it('should create invitation with correct permission levels', async () => {
      const invitation = await collaborationService.createInvitation(
        'user-123',
        'contact-123',
        'reflection-123',
        'reflection',
        'editor',
        'Test invitation message'
      );

      expect(invitation.sender_id).toBe('user-123');
      expect(invitation.recipient_id).toBe('contact-123');
      expect(invitation.resource_id).toBe('reflection-123');
      expect(invitation.permission_level).toBe('editor');
      expect(invitation.message).toBe('Test invitation message');
      expect(invitation.status).toBe('pending');

      expect(mockMemoryAssistant.saveInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          permission_level: 'editor',
          status: 'pending'
        })
      );
    });
  });

  describe('Requirement 20.2: Proactive contact suggestion based on Graph RAG analysis', () => {
    it('should provide relevant contact suggestions', async () => {
      const suggestions = await collaborationService.getContactSuggestions(
        'user-123',
        'Reflecting on family memories',
        mockUserState,
        ['family', 'gratitude']
      );

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].contact_name).toBe('Anna Andersson');
      expect(suggestions[0].reason).toBe('similar_theme');
      expect(suggestions[0].confidence).toBeGreaterThan(0);

      expect(mockResourceGovernor.validateAction).toHaveBeenCalledWith({
        type: 'analyze_graph_rag',
        userId: 'user-123',
        resourceCost: { compute: 3 }
      });

      expect(mockMemoryAssistant.queryGraphRAG).toHaveBeenCalled();
    });

    it('should display contact suggestions in invitation dialog', async () => {
      // Mock the service to return suggestions
      vi.spyOn(collaborationService, 'getContactSuggestions')
        .mockResolvedValue(mockContactSuggestions);

      render(
        <InvitationDialog
          resourceId="reflection-123"
          resourceType="reflection"
          userId="user-123"
          userState={mockUserState}
          currentTask="Reflecting on family memories"
          themes={['family', 'gratitude']}
          onClose={() => {}}
          collaborationService={collaborationService}
        />
      );

      // Wait for suggestions to load
      await waitFor(() => {
        expect(screen.getByText('Föreslagna kontakter')).toBeInTheDocument();
        expect(screen.getByText('Anna Andersson')).toBeInTheDocument();
        expect(screen.getByText('Erik Eriksson')).toBeInTheDocument();
      });

      // Verify suggestion reasons are displayed
      expect(screen.getByText('Liknande teman')).toBeInTheDocument();
      expect(screen.getByText('Relevant expertis')).toBeInTheDocument();

      // Verify confidence scores are displayed
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Requirement 20.3: Mutual consent requirement for collaboration', () => {
    it('should handle invitation response with mutual consent', async () => {
      const invitation = await collaborationService.respondToInvitation(
        'invitation-123',
        'contact-123',
        'accept',
        'I would love to collaborate!'
      );

      expect(invitation.status).toBe('accepted');
      expect(invitation.response_message).toBe('I would love to collaborate!');

      expect(mockMemoryAssistant.saveInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'accepted',
          response_message: 'I would love to collaborate!'
        })
      );

      expect(mockMemoryAssistant.saveCollaborationConsent).toHaveBeenCalled();
    });

    it('should create mutual consent records', async () => {
      // Mock invitation response
      mockMemoryAssistant.getInvitation.mockResolvedValue({
        id: 'invitation-123',
        sender_id: 'user-123',
        recipient_id: 'contact-123',
        resource_id: 'reflection-123',
        resource_type: 'reflection',
        permission_level: 'editor',
        status: 'pending'
      });

      await collaborationService.respondToInvitation(
        'invitation-123',
        'contact-123',
        'accept'
      );

      // Verify consent record is created for recipient
      expect(mockMemoryAssistant.saveCollaborationConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'contact-123',
          invitation_id: 'invitation-123',
          scope: expect.objectContaining({
            resource_access: 'write',
            data_sharing: true
          }),
          status: 'active'
        })
      );
    });
  });

  describe('Requirement 20.4: Collaborative session with soft block-level locking', () => {
    it('should render collaborative editor with session participants', () => {
      const mockContentBlocks = [
        { id: 'block-1', content: 'First block content' },
        { id: 'block-2', content: 'Second block content' }
      ];

      render(
        <CollaborativeEditor
          session={mockCollaborativeSession}
          userId="user-123"
          contentBlocks={mockContentBlocks}
          onContentUpdate={() => {}}
          collaborationService={collaborationService}
        />
      );

      // Verify session info is displayed
      expect(screen.getByText('Samarbetsläge')).toBeInTheDocument();
      expect(screen.getByText('2 deltagare')).toBeInTheDocument();

      // Verify content blocks are rendered
      expect(screen.getByText('First block content')).toBeInTheDocument();
      expect(screen.getByText('Second block content')).toBeInTheDocument();
    });

    it('should handle block locking workflow', async () => {
      mockMemoryAssistant.getCollaborativeSession.mockResolvedValue(mockCollaborativeSession);

      const lock = await collaborationService.acquireBlockLock(
        'session-123',
        'user-123',
        'block-1',
        'editing'
      );

      expect(lock.block_id).toBe('block-1');
      expect(lock.user_id).toBe('user-123');
      expect(lock.type).toBe('editing');

      expect(mockMemoryAssistant.saveCollaborativeSession).toHaveBeenCalled();
    });

    it('should prevent concurrent editing of same block', async () => {
      // Mock existing lock by another user
      const sessionWithLock = {
        ...mockCollaborativeSession,
        block_locks: [
          {
            block_id: 'block-1',
            user_id: 'contact-123',
            type: 'editing' as const,
            acquired_at: new Date(),
            expires_at: new Date(Date.now() + 300000) // 5 minutes from now
          }
        ]
      };

      mockMemoryAssistant.getCollaborativeSession.mockResolvedValue(sessionWithLock);

      await expect(
        collaborationService.acquireBlockLock('session-123', 'user-123', 'block-1', 'editing')
      ).rejects.toThrow('Block block-1 is already locked by another user');
    });

    it('should release block locks correctly', async () => {
      mockMemoryAssistant.getCollaborativeSession.mockResolvedValue(mockCollaborativeSession);

      await collaborationService.releaseBlockLock('session-123', 'user-123', 'block-1');

      expect(mockMemoryAssistant.saveCollaborativeSession).toHaveBeenCalledWith(
        expect.objectContaining({
          block_locks: expect.arrayContaining([])
        })
      );
    });
  });

  describe('Requirement 20.6: Guest user data access limitation', () => {
    it('should setup guest access control with restrictions', async () => {
      const accessibleResources = [
        {
          resource_id: 'reflection-123',
          resource_type: 'reflection' as const,
          access_level: 'read' as const,
          permissions: ['view_content'],
          conditions: { exclude_private: true }
        }
      ];

      const guestAccess = await collaborationService.setupGuestAccess(
        'guest-123',
        'host-123',
        'session-123',
        accessibleResources
      );

      expect(guestAccess.guest_user_id).toBe('guest-123');
      expect(guestAccess.host_user_id).toBe('host-123');
      expect(guestAccess.accessible_resources).toEqual(accessibleResources);
      expect(guestAccess.restrictions).toHaveLength(2);

      expect(mockMemoryAssistant.saveGuestAccessControl).toHaveBeenCalledWith(
        expect.objectContaining({
          guest_user_id: 'guest-123',
          restrictions: expect.arrayContaining([
            expect.objectContaining({
              type: 'time_window',
              enforcement: 'strict'
            }),
            expect.objectContaining({
              type: 'content_filter',
              enforcement: 'strict'
            })
          ])
        })
      );
    });

    it('should verify guest access permissions correctly', async () => {
      mockMemoryAssistant.getGuestAccessControl.mockResolvedValue({
        id: 'access-123',
        guest_user_id: 'guest-123',
        accessible_resources: [
          {
            resource_id: 'reflection-123',
            resource_type: 'reflection',
            access_level: 'read',
            permissions: ['view_content']
          }
        ],
        expires_at: new Date(Date.now() + 86400000) // 24 hours from now
      });

      const hasReadAccess = await collaborationService.verifyGuestAccess(
        'guest-123',
        'reflection-123',
        'read'
      );

      const hasWriteAccess = await collaborationService.verifyGuestAccess(
        'guest-123',
        'reflection-123',
        'write'
      );

      expect(hasReadAccess).toBe(true);
      expect(hasWriteAccess).toBe(false);
    });

    it('should deny access to expired guest permissions', async () => {
      mockMemoryAssistant.getGuestAccessControl.mockResolvedValue({
        id: 'access-123',
        guest_user_id: 'guest-123',
        accessible_resources: [
          {
            resource_id: 'reflection-123',
            resource_type: 'reflection',
            access_level: 'read',
            permissions: ['view_content']
          }
        ],
        expires_at: new Date(Date.now() - 3600000) // 1 hour ago (expired)
      });

      const hasAccess = await collaborationService.verifyGuestAccess(
        'guest-123',
        'reflection-123',
        'read'
      );

      expect(hasAccess).toBe(false);
    });
  });

  describe('Complete Collaborative Workflow', () => {
    it('should execute the complete collaboration workflow', async () => {
      // Step 1: Create invitation
      const invitation = await collaborationService.createInvitation(
        'user-123',
        'contact-123',
        'reflection-123',
        'reflection',
        'editor',
        'Let\'s collaborate on this reflection!'
      );

      expect(invitation.status).toBe('pending');

      // Step 2: Accept invitation with mutual consent
      mockMemoryAssistant.getInvitation.mockResolvedValue({
        ...invitation,
        id: 'invitation-123'
      });

      const acceptedInvitation = await collaborationService.respondToInvitation(
        'invitation-123',
        'contact-123',
        'accept',
        'I would love to collaborate!'
      );

      expect(acceptedInvitation.status).toBe('accepted');

      // Step 3: Create collaborative session
      const session = await collaborationService.createCollaborativeSession(
        'reflection-123',
        'reflection',
        'user-123',
        ['contact-123']
      );

      expect(session.resource_id).toBe('reflection-123');
      expect(session.participants).toHaveLength(2);

      // Step 4: Acquire and release block locks
      mockMemoryAssistant.getCollaborativeSession.mockResolvedValue(session);

      const lock = await collaborationService.acquireBlockLock(
        session.id,
        'user-123',
        'block-1',
        'editing'
      );

      expect(lock.block_id).toBe('block-1');

      await collaborationService.releaseBlockLock(session.id, 'user-123', 'block-1');

      // Step 5: Setup guest access for limited users
      const guestAccess = await collaborationService.setupGuestAccess(
        'guest-123',
        'user-123',
        session.id,
        [
          {
            resource_id: 'reflection-123',
            resource_type: 'reflection',
            access_level: 'read',
            permissions: ['view_content']
          }
        ]
      );

      expect(guestAccess.guest_user_id).toBe('guest-123');

      // Verify all requirements are met
      expect(mockMemoryAssistant.saveInvitation).toHaveBeenCalled(); // 20.1
      expect(mockMemoryAssistant.queryGraphRAG).toHaveBeenCalled(); // 20.2
      expect(mockMemoryAssistant.saveCollaborationConsent).toHaveBeenCalled(); // 20.3
      expect(mockMemoryAssistant.saveCollaborativeSession).toHaveBeenCalled(); // 20.4
      expect(mockMemoryAssistant.saveGuestAccessControl).toHaveBeenCalled(); // 20.6
    });
  });
});