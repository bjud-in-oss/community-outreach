/**
 * Collaboration Service
 * Implements secure invitation system, proactive contact suggestions, and collaborative editing
 */

import { 
  CollaborationInvitation,
  CollaborativeSession,
  ContactSuggestion,
  CollaborationConsent,
  GuestAccessControl,
  PermissionLevel,
  InvitationStatus,
  SessionParticipant,
  BlockLock,
  SuggestionReason,
  ConsentScope,
  AccessibleResource
} from '../types/collaboration';
import { UserState, User } from '../types';
import { MemoryAssistant } from '../lib/memory';
import { CognitiveAgent } from '../lib/cognitive-agent';
import { ResourceGovernor } from '../lib/resource-governor';

/**
 * Collaboration Service
 * Handles collaborative spaces, invitations, and consent management
 */
export class CollaborationService {
  private memoryAssistant: MemoryAssistant;
  private cognitiveAgent: CognitiveAgent;
  private resourceGovernor: ResourceGovernor;

  constructor(
    memoryAssistant: MemoryAssistant,
    cognitiveAgent: CognitiveAgent,
    resourceGovernor: ResourceGovernor
  ) {
    this.memoryAssistant = memoryAssistant;
    this.cognitiveAgent = cognitiveAgent;
    this.resourceGovernor = resourceGovernor;
  }

  /**
   * Create and send collaboration invitation
   * Requirement 20.1: Secure invitation system with permission levels
   */
  async createInvitation(
    senderId: string,
    recipientId: string,
    resourceId: string,
    resourceType: 'reflection' | 'project' | 'page',
    permissionLevel: PermissionLevel,
    message?: string
  ): Promise<CollaborationInvitation> {
    // Validate resource usage
    await this.resourceGovernor.validateAction({
      type: 'create_invitation',
      userId: senderId,
      resourceCost: { compute: 1 }
    });

    // Verify sender has permission to invite others to this resource
    const hasPermission = await this.verifyInvitationPermission(senderId, resourceId, resourceType);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to invite others to this resource');
    }

    const invitation: CollaborationInvitation = {
      id: this.generateId(),
      sender_id: senderId,
      recipient_id: recipientId,
      recipient_type: 'user',
      resource_id: resourceId,
      resource_type: resourceType,
      permission_level: permissionLevel,
      message,
      status: 'pending',
      created_at: new Date(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    // Save invitation
    await this.memoryAssistant.saveInvitation(invitation);

    // Create consent requirement for sender
    await this.createConsentRequirement(senderId, invitation.id, 'send_invitation');

    // Send notification to recipient
    await this.sendInvitationNotification(invitation);

    return invitation;
  }

  /**
   * Respond to collaboration invitation
   * Requirement 20.3: Mutual consent requirement for collaboration
   */
  async respondToInvitation(
    invitationId: string,
    recipientId: string,
    response: 'accept' | 'decline',
    responseMessage?: string
  ): Promise<CollaborationInvitation> {
    const invitation = await this.memoryAssistant.getInvitation(invitationId);
    if (!invitation) {
      throw new Error(`Invitation ${invitationId} not found`);
    }

    if (invitation.recipient_id !== recipientId) {
      throw new Error('Unauthorized to respond to this invitation');
    }

    if (invitation.status !== 'pending') {
      throw new Error(`Cannot respond to invitation with status: ${invitation.status}`);
    }

    // Update invitation
    invitation.status = response === 'accept' ? 'accepted' : 'declined';
    invitation.responded_at = new Date();
    invitation.response_message = responseMessage;

    await this.memoryAssistant.saveInvitation(invitation);

    if (response === 'accept') {
      // Create mutual consent records
      await this.createMutualConsent(invitation);
      
      // Setup collaborative session if needed
      await this.setupCollaborativeSession(invitation);
    }

    // Notify sender of response
    await this.sendResponseNotification(invitation);

    return invitation;
  }

  /**
   * Get proactive contact suggestions
   * Requirement 20.2: Proactive contact suggestion based on Graph RAG analysis
   */
  async getContactSuggestions(
    userId: string,
    currentTask: string,
    userState: UserState,
    themes: string[]
  ): Promise<ContactSuggestion[]> {
    // Validate resource usage for Graph RAG analysis
    await this.resourceGovernor.validateAction({
      type: 'analyze_graph_rag',
      userId,
      resourceCost: { compute: 3 }
    });

    const suggestions: ContactSuggestion[] = [];

    // Analyze Graph RAG for relevant contacts
    const analysisResult = await this.cognitiveAgent.processInput({
      text: `Analyze user's contacts and collaboration history to suggest relevant people for task: "${currentTask}" with themes: ${themes.join(', ')}`,
      type: 'command',
      timestamp: new Date()
    });

    // Get contacts with similar theme experience
    const themeMatches = await this.findContactsByTheme(userId, themes);
    for (const contact of themeMatches) {
      suggestions.push({
        id: this.generateId(),
        contact_id: contact.id,
        contact_name: contact.name,
        reason: 'similar_theme',
        confidence: contact.confidence,
        evidence: [
          {
            type: 'theme_overlap',
            description: `Has worked on ${contact.sharedThemes.length} similar themes`,
            strength: contact.confidence,
            data: { shared_themes: contact.sharedThemes }
          }
        ],
        context: {
          current_task: currentTask,
          user_state: userState,
          themes,
          urgency: this.assessUrgency(userState)
        },
        created_at: new Date(),
        status: 'pending'
      });
    }

    // Get contacts with relevant expertise
    const expertiseMatches = await this.findContactsByExpertise(userId, currentTask);
    for (const contact of expertiseMatches) {
      suggestions.push({
        id: this.generateId(),
        contact_id: contact.id,
        contact_name: contact.name,
        reason: 'expertise_match',
        confidence: contact.confidence,
        evidence: [
          {
            type: 'skill_match',
            description: `Has expertise in ${contact.skills.join(', ')}`,
            strength: contact.confidence,
            data: { skills: contact.skills }
          }
        ],
        context: {
          current_task: currentTask,
          user_state: userState,
          themes,
          required_skills: contact.skills,
          urgency: this.assessUrgency(userState)
        },
        created_at: new Date(),
        status: 'pending'
      });
    }

    // Get frequent collaborators
    const frequentCollaborators = await this.findFrequentCollaborators(userId);
    for (const contact of frequentCollaborators) {
      suggestions.push({
        id: this.generateId(),
        contact_id: contact.id,
        contact_name: contact.name,
        reason: 'frequent_collaborator',
        confidence: contact.confidence,
        evidence: [
          {
            type: 'collaboration_history',
            description: `Collaborated ${contact.collaborationCount} times in the past`,
            strength: contact.confidence,
            data: { collaboration_count: contact.collaborationCount }
          }
        ],
        context: {
          current_task: currentTask,
          user_state: userState,
          themes,
          urgency: this.assessUrgency(userState)
        },
        created_at: new Date(),
        status: 'pending'
      });
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Create collaborative session
   * Requirement 20.4: Collaborative session with soft block-level locking
   */
  async createCollaborativeSession(
    resourceId: string,
    resourceType: 'reflection' | 'project' | 'page',
    hostUserId: string,
    participants: string[]
  ): Promise<CollaborativeSession> {
    const session: CollaborativeSession = {
      id: this.generateId(),
      resource_id: resourceId,
      resource_type: resourceType,
      participants: [],
      block_locks: [],
      status: 'active',
      started_at: new Date(),
      last_activity_at: new Date(),
      metadata: {
        settings: {
          allow_anonymous: false,
          require_approval: true,
          auto_save_interval: 30,
          lock_timeout: 300, // 5 minutes
          max_participants: 10
        },
        activity_log: []
      }
    };

    // Add host as first participant
    await this.addParticipant(session.id, hostUserId, 'admin');

    // Add invited participants
    for (const participantId of participants) {
      await this.addParticipant(session.id, participantId, 'editor');
    }

    await this.memoryAssistant.saveCollaborativeSession(session);
    return session;
  }

  /**
   * Acquire block lock for editing
   * Implements soft block-level locking
   */
  async acquireBlockLock(
    sessionId: string,
    userId: string,
    blockId: string,
    lockType: 'editing' | 'viewing' | 'reserved' = 'editing'
  ): Promise<BlockLock> {
    const session = await this.memoryAssistant.getCollaborativeSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if block is already locked
    const existingLock = session.block_locks.find(lock => 
      lock.block_id === blockId && lock.expires_at > new Date()
    );

    if (existingLock && existingLock.user_id !== userId) {
      throw new Error(`Block ${blockId} is already locked by another user`);
    }

    const lock: BlockLock = {
      block_id: blockId,
      user_id: userId,
      type: lockType,
      acquired_at: new Date(),
      expires_at: new Date(Date.now() + session.metadata.settings.lock_timeout * 1000)
    };

    // Add lock to session
    session.block_locks = session.block_locks.filter(l => 
      !(l.block_id === blockId && l.user_id === userId)
    );
    session.block_locks.push(lock);
    session.last_activity_at = new Date();

    await this.memoryAssistant.saveCollaborativeSession(session);

    // Log activity
    await this.logSessionActivity(sessionId, userId, 'locked', `Acquired ${lockType} lock on block ${blockId}`);

    return lock;
  }

  /**
   * Release block lock
   */
  async releaseBlockLock(
    sessionId: string,
    userId: string,
    blockId: string
  ): Promise<void> {
    const session = await this.memoryAssistant.getCollaborativeSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Remove lock
    session.block_locks = session.block_locks.filter(lock => 
      !(lock.block_id === blockId && lock.user_id === userId)
    );
    session.last_activity_at = new Date();

    await this.memoryAssistant.saveCollaborativeSession(session);

    // Log activity
    await this.logSessionActivity(sessionId, userId, 'unlocked', `Released lock on block ${blockId}`);
  }

  /**
   * Setup guest access control
   * Requirement 20.6: Guest user data access limitation
   */
  async setupGuestAccess(
    guestUserId: string,
    hostUserId: string,
    sessionId: string,
    accessibleResources: AccessibleResource[]
  ): Promise<GuestAccessControl> {
    const accessControl: GuestAccessControl = {
      id: this.generateId(),
      guest_user_id: guestUserId,
      host_user_id: hostUserId,
      accessible_resources: accessibleResources,
      restrictions: [
        {
          type: 'time_window',
          description: 'Access limited to session duration',
          parameters: { max_duration_hours: 24 },
          enforcement: 'strict'
        },
        {
          type: 'content_filter',
          description: 'Cannot access private content',
          parameters: { exclude_private: true },
          enforcement: 'strict'
        }
      ],
      session_id: sessionId,
      granted_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    await this.memoryAssistant.saveGuestAccessControl(accessControl);
    return accessControl;
  }

  /**
   * Verify guest access to resource
   */
  async verifyGuestAccess(
    guestUserId: string,
    resourceId: string,
    accessType: 'read' | 'write'
  ): Promise<boolean> {
    const accessControl = await this.memoryAssistant.getGuestAccessControl(guestUserId);
    if (!accessControl || accessControl.expires_at < new Date()) {
      return false;
    }

    const resource = accessControl.accessible_resources.find(r => r.resource_id === resourceId);
    if (!resource) {
      return false;
    }

    return resource.access_level === accessType || 
           (accessType === 'read' && resource.access_level === 'write');
  }

  // Private helper methods

  private generateId(): string {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async verifyInvitationPermission(
    userId: string,
    resourceId: string,
    resourceType: string
  ): Promise<boolean> {
    // Check if user owns or has admin permission on the resource
    const resource = await this.memoryAssistant.getResource(resourceId, resourceType);
    return resource?.owner_id === userId || resource?.permissions?.includes('admin');
  }

  private async createConsentRequirement(
    userId: string,
    invitationId: string,
    action: string
  ): Promise<void> {
    const consent: CollaborationConsent = {
      id: this.generateId(),
      user_id: userId,
      invitation_id: invitationId,
      scope: {
        resource_access: 'write',
        data_sharing: true,
        notifications: true,
        analytics: false,
        third_party_sharing: false
      },
      status: 'active',
      granted_at: new Date()
    };

    await this.memoryAssistant.saveCollaborationConsent(consent);
  }

  private async createMutualConsent(invitation: CollaborationInvitation): Promise<void> {
    // Create consent for recipient
    const recipientConsent: CollaborationConsent = {
      id: this.generateId(),
      user_id: invitation.recipient_id,
      invitation_id: invitation.id,
      scope: {
        resource_access: invitation.permission_level === 'viewer' ? 'read' : 'write',
        data_sharing: true,
        notifications: true,
        analytics: false,
        third_party_sharing: false
      },
      status: 'active',
      granted_at: new Date()
    };

    await this.memoryAssistant.saveCollaborationConsent(recipientConsent);
  }

  private async setupCollaborativeSession(invitation: CollaborationInvitation): Promise<void> {
    // Check if session already exists for this resource
    const existingSession = await this.memoryAssistant.getCollaborativeSessionByResource(
      invitation.resource_id
    );

    if (existingSession) {
      // Add participant to existing session
      await this.addParticipant(existingSession.id, invitation.recipient_id, invitation.permission_level);
    } else {
      // Create new session
      await this.createCollaborativeSession(
        invitation.resource_id,
        invitation.resource_type,
        invitation.sender_id,
        [invitation.recipient_id]
      );
    }
  }

  private async addParticipant(
    sessionId: string,
    userId: string,
    permissionLevel: PermissionLevel
  ): Promise<void> {
    const session = await this.memoryAssistant.getCollaborativeSession(sessionId);
    if (!session) return;

    const user = await this.memoryAssistant.getUser(userId);
    const participant: SessionParticipant = {
      user_id: userId,
      display_name: user?.profile?.display_name || 'Unknown User',
      permission_level: permissionLevel,
      joined_at: new Date(),
      last_seen_at: new Date(),
      status: 'active'
    };

    session.participants.push(participant);
    await this.memoryAssistant.saveCollaborativeSession(session);

    // Log activity
    await this.logSessionActivity(sessionId, userId, 'joined', `Joined session with ${permissionLevel} permissions`);
  }

  private async logSessionActivity(
    sessionId: string,
    userId: string,
    type: 'joined' | 'left' | 'edited' | 'locked' | 'unlocked',
    description: string
  ): Promise<void> {
    const session = await this.memoryAssistant.getCollaborativeSession(sessionId);
    if (!session) return;

    session.metadata.activity_log.push({
      id: this.generateId(),
      user_id: userId,
      type,
      description,
      timestamp: new Date()
    });

    await this.memoryAssistant.saveCollaborativeSession(session);
  }

  private async findContactsByTheme(userId: string, themes: string[]): Promise<any[]> {
    // Query Graph RAG for contacts who have worked on similar themes
    const contacts = await this.memoryAssistant.queryGraphRAG(
      `MATCH (u:User {id: $userId})-[:KNOWS]->(c:Contact)-[:PARTICIPATED_IN]->(e:Event)-[:RELATES_TO]->(t:Theme)
       WHERE t.name IN $themes
       RETURN c, COUNT(e) as collaboration_count, COLLECT(t.name) as shared_themes`,
      { userId, themes }
    );

    return contacts.map((record: any) => ({
      id: record.c.id,
      name: record.c.name,
      confidence: Math.min(record.collaboration_count / 10, 1),
      sharedThemes: record.shared_themes
    }));
  }

  private async findContactsByExpertise(userId: string, task: string): Promise<any[]> {
    // Use cognitive agent to analyze task and find relevant skills
    const skillAnalysis = await this.cognitiveAgent.processInput({
      text: `Analyze this task and identify required skills: "${task}"`,
      type: 'command',
      timestamp: new Date()
    });

    // Query Graph RAG for contacts with relevant skills
    const contacts = await this.memoryAssistant.queryGraphRAG(
      `MATCH (u:User {id: $userId})-[:KNOWS]->(c:Contact)-[:HAS_SKILL]->(s:Skill)
       WHERE s.name CONTAINS $taskKeywords
       RETURN c, COLLECT(s.name) as skills, COUNT(s) as skill_count`,
      { userId, taskKeywords: task }
    );

    return contacts.map((record: any) => ({
      id: record.c.id,
      name: record.c.name,
      confidence: Math.min(record.skill_count / 5, 1),
      skills: record.skills
    }));
  }

  private async findFrequentCollaborators(userId: string): Promise<any[]> {
    // Query Graph RAG for frequent collaborators
    const contacts = await this.memoryAssistant.queryGraphRAG(
      `MATCH (u:User {id: $userId})-[:COLLABORATED_WITH]->(c:Contact)
       RETURN c, COUNT(*) as collaboration_count
       ORDER BY collaboration_count DESC
       LIMIT 10`,
      { userId }
    );

    return contacts.map((record: any) => ({
      id: record.c.id,
      name: record.c.name,
      confidence: Math.min(record.collaboration_count / 20, 1),
      collaborationCount: record.collaboration_count
    }));
  }

  private assessUrgency(userState: UserState): 'low' | 'medium' | 'high' {
    // Assess urgency based on user's emotional state
    const stress = userState.fight + userState.flight;
    if (stress > 0.7) return 'high';
    if (stress > 0.4) return 'medium';
    return 'low';
  }

  private async sendInvitationNotification(invitation: CollaborationInvitation): Promise<void> {
    // Implementation would send actual notification
    console.log(`Invitation sent to ${invitation.recipient_id} for ${invitation.resource_type} ${invitation.resource_id}`);
  }

  private async sendResponseNotification(invitation: CollaborationInvitation): Promise<void> {
    // Implementation would send actual notification
    console.log(`Invitation ${invitation.status} by ${invitation.recipient_id}`);
  }
}