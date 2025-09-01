/**
 * Collaborative Space types
 * Implements secure invitation system and collaborative editing
 */

import { UserState } from './index';

/**
 * Collaboration invitation
 * Requirement 20.1: Secure invitation system with permission levels
 */
export interface CollaborationInvitation {
  /** Invitation identifier */
  id: string;
  
  /** User who sent the invitation */
  sender_id: string;
  
  /** User or group being invited */
  recipient_id: string;
  
  /** Type of recipient */
  recipient_type: 'user' | 'contact_group';
  
  /** Resource being shared */
  resource_id: string;
  
  /** Type of resource */
  resource_type: 'reflection' | 'project' | 'page';
  
  /** Permission level granted */
  permission_level: PermissionLevel;
  
  /** Invitation message */
  message?: string;
  
  /** Invitation status */
  status: InvitationStatus;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Expiration timestamp */
  expires_at?: Date;
  
  /** Response timestamp */
  responded_at?: Date;
  
  /** Response message */
  response_message?: string;
}

/**
 * Permission levels for collaboration
 */
export type PermissionLevel = 
  | 'viewer'     // Can view content only
  | 'commenter'  // Can view and add comments
  | 'editor'     // Can view and edit content
  | 'admin';     // Full control including inviting others

/**
 * Invitation status
 */
export type InvitationStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'revoked';

/**
 * Collaborative session
 * Requirement 20.4: Collaborative session with soft block-level locking
 */
export interface CollaborativeSession {
  /** Session identifier */
  id: string;
  
  /** Resource being collaborated on */
  resource_id: string;
  
  /** Resource type */
  resource_type: 'reflection' | 'project' | 'page';
  
  /** Active participants */
  participants: SessionParticipant[];
  
  /** Current locks on content blocks */
  block_locks: BlockLock[];
  
  /** Session status */
  status: SessionStatus;
  
  /** Session start time */
  started_at: Date;
  
  /** Last activity timestamp */
  last_activity_at: Date;
  
  /** Session metadata */
  metadata: SessionMetadata;
}

/**
 * Session participant
 */
export interface SessionParticipant {
  /** User ID */
  user_id: string;
  
  /** User display name */
  display_name: string;
  
  /** Permission level in this session */
  permission_level: PermissionLevel;
  
  /** Join timestamp */
  joined_at: Date;
  
  /** Last seen timestamp */
  last_seen_at: Date;
  
  /** Current status */
  status: ParticipantStatus;
  
  /** Current cursor position */
  cursor_position?: CursorPosition;
}

/**
 * Participant status
 */
export type ParticipantStatus = 
  | 'active'
  | 'idle'
  | 'away'
  | 'disconnected';

/**
 * Content block lock
 * Implements soft block-level locking
 */
export interface BlockLock {
  /** Block identifier */
  block_id: string;
  
  /** User who has the lock */
  user_id: string;
  
  /** Lock type */
  type: LockType;
  
  /** Lock acquired timestamp */
  acquired_at: Date;
  
  /** Lock expiration timestamp */
  expires_at: Date;
  
  /** Lock metadata */
  metadata?: Record<string, any>;
}

/**
 * Lock types
 */
export type LockType = 
  | 'editing'    // User is actively editing
  | 'viewing'    // User is viewing (soft lock)
  | 'reserved';  // Block is reserved for user

/**
 * Session status
 */
export type SessionStatus = 
  | 'active'
  | 'paused'
  | 'ended';

/**
 * Session metadata
 */
export interface SessionMetadata {
  /** Session title */
  title?: string;
  
  /** Session description */
  description?: string;
  
  /** Session settings */
  settings: SessionSettings;
  
  /** Activity log */
  activity_log: SessionActivity[];
}

/**
 * Session settings
 */
export interface SessionSettings {
  /** Allow anonymous participants */
  allow_anonymous: boolean;
  
  /** Require approval for new participants */
  require_approval: boolean;
  
  /** Auto-save interval in seconds */
  auto_save_interval: number;
  
  /** Lock timeout in seconds */
  lock_timeout: number;
  
  /** Maximum participants */
  max_participants: number;
}

/**
 * Session activity
 */
export interface SessionActivity {
  /** Activity ID */
  id: string;
  
  /** User who performed the activity */
  user_id: string;
  
  /** Activity type */
  type: ActivityType;
  
  /** Activity description */
  description: string;
  
  /** Activity timestamp */
  timestamp: Date;
  
  /** Activity metadata */
  metadata?: Record<string, any>;
}

/**
 * Activity types
 */
export type ActivityType = 
  | 'joined'
  | 'left'
  | 'edited'
  | 'commented'
  | 'locked'
  | 'unlocked'
  | 'invited'
  | 'permission_changed';

/**
 * Cursor position for real-time collaboration
 */
export interface CursorPosition {
  /** Block ID where cursor is located */
  block_id: string;
  
  /** Character offset within block */
  offset: number;
  
  /** Selection range */
  selection?: {
    start: number;
    end: number;
  };
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * Contact suggestion
 * Requirement 20.2: Proactive contact suggestion based on Graph RAG analysis
 */
export interface ContactSuggestion {
  /** Suggestion ID */
  id: string;
  
  /** Suggested contact */
  contact_id: string;
  
  /** Contact display name */
  contact_name: string;
  
  /** Suggestion reason */
  reason: SuggestionReason;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Supporting evidence */
  evidence: SuggestionEvidence[];
  
  /** Suggestion context */
  context: SuggestionContext;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Suggestion status */
  status: SuggestionStatus;
}

/**
 * Suggestion reasons
 */
export type SuggestionReason = 
  | 'similar_theme'      // Worked on similar themes before
  | 'expertise_match'    // Has expertise in relevant area
  | 'frequent_collaborator' // Collaborates frequently with user
  | 'emotional_support'  // Good at providing emotional support
  | 'recent_interaction' // Recent positive interaction
  | 'mutual_connection'; // Connected through mutual contacts

/**
 * Suggestion evidence
 */
export interface SuggestionEvidence {
  /** Evidence type */
  type: 'theme_overlap' | 'skill_match' | 'collaboration_history' | 'emotional_compatibility';
  
  /** Evidence description */
  description: string;
  
  /** Evidence strength (0-1) */
  strength: number;
  
  /** Supporting data */
  data?: Record<string, any>;
}

/**
 * Suggestion context
 */
export interface SuggestionContext {
  /** Current task or problem */
  current_task: string;
  
  /** User's current emotional state */
  user_state: UserState;
  
  /** Relevant themes */
  themes: string[];
  
  /** Required skills or expertise */
  required_skills?: string[];
  
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high';
}

/**
 * Suggestion status
 */
export type SuggestionStatus = 
  | 'pending'
  | 'presented'
  | 'accepted'
  | 'declined'
  | 'expired';

/**
 * Consent record for collaboration
 * Requirement 20.3: Mutual consent requirement for collaboration
 */
export interface CollaborationConsent {
  /** Consent ID */
  id: string;
  
  /** User giving consent */
  user_id: string;
  
  /** Collaboration invitation ID */
  invitation_id: string;
  
  /** Consent scope */
  scope: ConsentScope;
  
  /** Consent status */
  status: ConsentStatus;
  
  /** Consent granted timestamp */
  granted_at: Date;
  
  /** Consent expiration */
  expires_at?: Date;
  
  /** Consent conditions */
  conditions?: ConsentCondition[];
  
  /** Revocation timestamp */
  revoked_at?: Date;
  
  /** Revocation reason */
  revocation_reason?: string;
}

/**
 * Consent scope
 */
export interface ConsentScope {
  /** Resource access */
  resource_access: 'read' | 'write' | 'admin';
  
  /** Data sharing permissions */
  data_sharing: boolean;
  
  /** Notification permissions */
  notifications: boolean;
  
  /** Analytics permissions */
  analytics: boolean;
  
  /** Third-party sharing */
  third_party_sharing: boolean;
}

/**
 * Consent status
 */
export type ConsentStatus = 
  | 'active'
  | 'revoked'
  | 'expired'
  | 'suspended';

/**
 * Consent condition
 */
export interface ConsentCondition {
  /** Condition type */
  type: 'time_limit' | 'usage_limit' | 'purpose_restriction' | 'data_retention';
  
  /** Condition description */
  description: string;
  
  /** Condition parameters */
  parameters: Record<string, any>;
}

/**
 * Guest user access control
 * Requirement 20.6: Guest user data access limitation
 */
export interface GuestAccessControl {
  /** Access control ID */
  id: string;
  
  /** Guest user ID */
  guest_user_id: string;
  
  /** Host user ID */
  host_user_id: string;
  
  /** Accessible resources */
  accessible_resources: AccessibleResource[];
  
  /** Access restrictions */
  restrictions: AccessRestriction[];
  
  /** Access session */
  session_id: string;
  
  /** Access granted timestamp */
  granted_at: Date;
  
  /** Access expiration */
  expires_at: Date;
  
  /** Last access timestamp */
  last_access_at?: Date;
}

/**
 * Accessible resource for guest users
 */
export interface AccessibleResource {
  /** Resource ID */
  resource_id: string;
  
  /** Resource type */
  resource_type: 'reflection' | 'project' | 'page' | 'asset';
  
  /** Access level */
  access_level: 'read' | 'write';
  
  /** Specific permissions */
  permissions: string[];
  
  /** Access conditions */
  conditions?: Record<string, any>;
}

/**
 * Access restriction for guest users
 */
export interface AccessRestriction {
  /** Restriction type */
  type: 'ip_address' | 'time_window' | 'usage_quota' | 'content_filter';
  
  /** Restriction description */
  description: string;
  
  /** Restriction parameters */
  parameters: Record<string, any>;
  
  /** Enforcement level */
  enforcement: 'strict' | 'warning' | 'log_only';
}

/**
 * Collaboration workflow state
 */
export interface CollaborationWorkflow {
  /** Workflow ID */
  id: string;
  
  /** Workflow type */
  type: 'invitation' | 'session_management' | 'consent_verification';
  
  /** Current step */
  current_step: CollaborationWorkflowStep;
  
  /** Workflow data */
  data: CollaborationWorkflowData;
  
  /** Workflow status */
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Completion timestamp */
  completed_at?: Date;
}

/**
 * Collaboration workflow steps
 */
export type CollaborationWorkflowStep = 
  | 'select_contacts'
  | 'set_permissions'
  | 'compose_invitation'
  | 'verify_consent'
  | 'send_invitation'
  | 'await_response'
  | 'setup_session'
  | 'complete';

/**
 * Collaboration workflow data
 */
export interface CollaborationWorkflowData {
  /** Selected contacts */
  selected_contacts?: string[];
  
  /** Permission settings */
  permissions?: Record<string, PermissionLevel>;
  
  /** Invitation message */
  invitation_message?: string;
  
  /** Consent records */
  consent_records?: string[];
  
  /** Session configuration */
  session_config?: Partial<SessionSettings>;
  
  /** User selections */
  user_selections: Record<string, any>;
  
  /** Workflow metadata */
  metadata: Record<string, any>;
}