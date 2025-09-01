/**
 * Data models for the Community Outreach System
 * Implements user, contact, and relationship management with encryption and consent
 */

/**
 * User profile and authentication data
 * Requirement 10.1: Create User node in Graph RAG with required properties
 */
export interface User {
  /** Unique user identifier */
  id: string;
  
  /** User role determining access level */
  user_role: 'senior' | 'architect';
  
  /** User profile information */
  profile: UserProfile;
  
  /** Owned contacts */
  contacts: Contact[];
  
  /** Given consents */
  consents: Consent[];
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
  
  /** Account status */
  status: 'active' | 'inactive' | 'suspended';
}

/**
 * User profile information
 */
export interface UserProfile {
  /** Display name */
  display_name: string;
  
  /** Email address */
  email: string;
  
  /** Preferred language */
  language: string;
  
  /** Timezone */
  timezone: string;
  
  /** User preferences */
  preferences: UserPreferences;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  /** UI theme preference */
  theme: 'light' | 'dark' | 'auto';
  
  /** Layout preference */
  layout: 'arbetsläget' | 'flik-läget' | 'auto';
  
  /** Notification settings */
  notifications: NotificationSettings;
  
  /** Privacy settings */
  privacy: PrivacySettings;
}

/**
 * Notification preferences
 */
export interface NotificationSettings {
  /** Email notifications enabled */
  email_enabled: boolean;
  
  /** Push notifications enabled */
  push_enabled: boolean;
  
  /** Collaboration notifications */
  collaboration_enabled: boolean;
  
  /** Memory discovery notifications */
  memory_discovery_enabled: boolean;
}

/**
 * Privacy settings
 */
export interface PrivacySettings {
  /** Allow memory discovery */
  allow_memory_discovery: boolean;
  
  /** Allow contact suggestions */
  allow_contact_suggestions: boolean;
  
  /** Data retention period in days */
  data_retention_days: number;
}

/**
 * Contact information with encrypted details
 * Requirement 10.2: Create Contact node with encrypted contactDetails
 */
export interface Contact {
  /** Unique contact identifier */
  id: string;
  
  /** Owner user ID */
  owner_id: string;
  
  /** Encrypted contact details */
  contact_details: EncryptedContactDetails;
  
  /** Contact groups this contact belongs to */
  groups: ContactGroup[];
  
  /** Relationship type */
  relationship_type: RelationshipType;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
  
  /** Contact status */
  status: 'active' | 'inactive' | 'blocked';
}

/**
 * Raw contact details before encryption
 */
export interface RawContactDetails {
  /** Contact name */
  name: string;
  
  /** Email address */
  email?: string;
  
  /** Phone number */
  phone?: string;
  
  /** Physical address */
  address?: string;
  
  /** Additional notes */
  notes?: string;
}

/**
 * Encrypted contact details
 * Requirement 10.2: Implement encrypted contact details storage
 */
export interface EncryptedContactDetails {
  /** Encrypted display name */
  encrypted_name: string;
  
  /** Encrypted email address */
  encrypted_email?: string;
  
  /** Encrypted phone number */
  encrypted_phone?: string;
  
  /** Encrypted physical address */
  encrypted_address?: string;
  
  /** Encrypted notes */
  encrypted_notes?: string;
  
  /** Encryption metadata */
  encryption_metadata: EncryptionMetadata;
}

/**
 * Encryption metadata for contact details
 */
export interface EncryptionMetadata {
  /** Encryption algorithm used */
  algorithm: string;
  
  /** Key derivation function */
  kdf: string;
  
  /** Salt for key derivation */
  salt: string;
  
  /** Initialization vector */
  iv: string;
  
  /** Encryption timestamp */
  encrypted_at: Date;
}

/**
 * Contact group for organizing contacts
 * Requirement 10.3: Create ContactGroup node with IS_MEMBER_OF relationships
 */
export interface ContactGroup {
  /** Unique group identifier */
  id: string;
  
  /** Owner user ID */
  owner_id: string;
  
  /** Group name */
  name: string;
  
  /** Group description */
  description?: string;
  
  /** Group color for UI */
  color: string;
  
  /** Group members */
  members: Contact[];
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * Consent management with granular permissions
 * Requirement 10.4: Create Consent node with specific scope and status
 */
export interface Consent {
  /** Unique consent identifier */
  id: string;
  
  /** User who gave the consent */
  user_id: string;
  
  /** Specific scope of the consent */
  scope: ConsentScope;
  
  /** Consent status */
  status: 'active' | 'revoked' | 'expired';
  
  /** What the consent applies to */
  applies_to: ConsentTarget;
  
  /** Consent details */
  details: ConsentDetails;
  
  /** Creation timestamp */
  granted_at: Date;
  
  /** Expiration timestamp */
  expires_at?: Date;
  
  /** Revocation timestamp */
  revoked_at?: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * Consent scope definition
 * Requirement 10.5: Granular consent permissions
 */
export interface ConsentScope {
  /** Data access permissions */
  data_access: DataAccessPermissions;
  
  /** Communication permissions */
  communication: CommunicationPermissions;
  
  /** Sharing permissions */
  sharing: SharingPermissions;
  
  /** Memory permissions */
  memory: MemoryPermissions;
}

/**
 * Data access permissions
 */
export interface DataAccessPermissions {
  /** Can read user's content */
  read_content: boolean;
  
  /** Can read user's contacts */
  read_contacts: boolean;
  
  /** Can read user's projects */
  read_projects: boolean;
  
  /** Can read user's memories */
  read_memories: boolean;
}

/**
 * Communication permissions
 */
export interface CommunicationPermissions {
  /** Can send messages */
  send_messages: boolean;
  
  /** Can initiate collaboration */
  initiate_collaboration: boolean;
  
  /** Can suggest contacts */
  suggest_contacts: boolean;
  
  /** Can send legacy messages */
  send_legacy_messages: boolean;
  
  /** Can use Empatibryggan communication coaching */
  enable_empathy_bridge: boolean;
}

/**
 * Sharing permissions
 */
export interface SharingPermissions {
  /** Can share with others */
  share_with_others: boolean;
  
  /** Can export data */
  export_data: boolean;
  
  /** Can create public links */
  create_public_links: boolean;
}

/**
 * Memory permissions
 */
export interface MemoryPermissions {
  /** Can access memory discovery */
  memory_discovery: boolean;
  
  /** Can link memories */
  link_memories: boolean;
  
  /** Can suggest conversation starters */
  suggest_conversations: boolean;
}

/**
 * Consent target - what the consent applies to
 */
export interface ConsentTarget {
  /** Target type */
  type: 'contact' | 'contact_group' | 'project' | 'system';
  
  /** Target ID */
  target_id: string;
  
  /** Target name for display */
  target_name: string;
}

/**
 * Consent details and metadata
 */
export interface ConsentDetails {
  /** Human-readable consent description */
  description: string;
  
  /** Legal basis for consent */
  legal_basis: string;
  
  /** Purpose of data processing */
  purpose: string;
  
  /** Data retention period */
  retention_period_days?: number;
  
  /** Third parties involved */
  third_parties?: string[];
}

/**
 * Relationship types between users and contacts
 */
export type RelationshipType = 
  | 'family'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'professional'
  | 'other';

/**
 * Graph database node types for Neo4j
 */
export type GraphNodeType = 
  | 'User'
  | 'Contact'
  | 'ContactGroup'
  | 'Consent'
  | 'Project'
  | 'Asset'
  | 'Event'
  | 'Theme'
  | 'Trigger';

/**
 * Graph database relationship types for Neo4j
 */
export type GraphRelationshipType =
  | 'OWNS_CONTACT'
  | 'IS_MEMBER_OF'
  | 'HAS_GIVEN'
  | 'APPLIES_TO'
  | 'PARTICIPATED_IN'
  | 'RELATES_TO'
  | 'TRIGGERS_ON'
  | 'COLLABORATES_WITH'
  | 'HAS_ACCESS_TO';

/**
 * Graph database node structure
 */
export interface GraphNode {
  /** Node ID */
  id: string;
  
  /** Node type */
  type: GraphNodeType;
  
  /** Node properties */
  properties: Record<string, any>;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * Graph database relationship structure
 */
export interface GraphRelationship {
  /** Relationship ID */
  id: string;
  
  /** Relationship type */
  type: GraphRelationshipType;
  
  /** Source node ID */
  from_node_id: string;
  
  /** Target node ID */
  to_node_id: string;
  
  /** Relationship properties */
  properties: Record<string, any>;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}
/**

 * Project data models with hybrid Git integration
 * Requirement 11.1: Implement hybrid Project data model with Git integration
 */

/**
 * Project metadata stored in Graph RAG
 * Requirement 11.1: Create Project node in Graph RAG to store metadata
 */
export interface Project {
  /** Unique project identifier */
  id: string;
  
  /** Project owner user ID */
  owner_id: string;
  
  /** Project name */
  name: string;
  
  /** Project description */
  description?: string;
  
  /** Project type */
  type: ProjectType;
  
  /** Project status */
  status: ProjectStatus;
  
  /** Git repository URL for this project */
  git_repository_url: string;
  
  /** Default branch name */
  default_branch: string;
  
  /** Project settings */
  settings: ProjectSettings;
  
  /** Associated assets */
  assets: Asset[];
  
  /** Collaborators */
  collaborators: ProjectCollaborator[];
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
  
  /** Last activity timestamp */
  last_activity_at: Date;
}

/**
 * Project types
 */
export type ProjectType = 
  | 'personal_chronicle'
  | 'collaborative_space'
  | 'memory_book'
  | 'legacy_content'
  | 'general';

/**
 * Project status
 */
export type ProjectStatus = 
  | 'active'
  | 'archived'
  | 'deleted'
  | 'template';

/**
 * Project settings and configuration
 */
export interface ProjectSettings {
  /** Visibility settings */
  visibility: ProjectVisibility;
  
  /** Collaboration settings */
  collaboration: CollaborationSettings;
  
  /** Backup settings */
  backup: BackupSettings;
  
  /** Notification settings */
  notifications: ProjectNotificationSettings;
}

/**
 * Project visibility settings
 */
export interface ProjectVisibility {
  /** Who can view this project */
  view_access: 'owner' | 'collaborators' | 'public';
  
  /** Who can edit this project */
  edit_access: 'owner' | 'collaborators';
  
  /** Whether project appears in search */
  searchable: boolean;
  
  /** Whether project can be forked */
  forkable: boolean;
}

/**
 * Collaboration settings
 */
export interface CollaborationSettings {
  /** Allow real-time collaboration */
  real_time_editing: boolean;
  
  /** Require approval for changes */
  require_approval: boolean;
  
  /** Allow comments */
  allow_comments: boolean;
  
  /** Allow suggestions */
  allow_suggestions: boolean;
  
  /** Maximum number of collaborators */
  max_collaborators: number;
}

/**
 * Backup settings
 */
export interface BackupSettings {
  /** Enable automatic backups */
  auto_backup: boolean;
  
  /** Backup frequency in hours */
  backup_frequency_hours: number;
  
  /** Number of backups to retain */
  backup_retention_count: number;
  
  /** Include assets in backups */
  include_assets: boolean;
}

/**
 * Project notification settings
 */
export interface ProjectNotificationSettings {
  /** Notify on new collaborators */
  new_collaborators: boolean;
  
  /** Notify on content changes */
  content_changes: boolean;
  
  /** Notify on comments */
  comments: boolean;
  
  /** Notify on asset uploads */
  asset_uploads: boolean;
}

/**
 * Project collaborator
 */
export interface ProjectCollaborator {
  /** User ID of collaborator */
  user_id: string;
  
  /** Collaborator role */
  role: CollaboratorRole;
  
  /** Permissions */
  permissions: CollaboratorPermissions;
  
  /** Invitation status */
  status: 'invited' | 'accepted' | 'declined' | 'removed';
  
  /** When they were added */
  added_at: Date;
  
  /** When they joined */
  joined_at?: Date;
  
  /** Last activity timestamp */
  last_activity_at?: Date;
}

/**
 * Collaborator roles
 */
export type CollaboratorRole = 
  | 'owner'
  | 'editor'
  | 'viewer'
  | 'commenter';

/**
 * Collaborator permissions
 */
export interface CollaboratorPermissions {
  /** Can read content */
  read: boolean;
  
  /** Can edit content */
  edit: boolean;
  
  /** Can delete content */
  delete: boolean;
  
  /** Can manage assets */
  manage_assets: boolean;
  
  /** Can invite others */
  invite_others: boolean;
  
  /** Can manage settings */
  manage_settings: boolean;
  
  /** Can view history */
  view_history: boolean;
}

/**
 * Asset model with cloud storage references
 * Requirement 11.3: Create Asset model with cloud storage references
 */
export interface Asset {
  /** Unique asset identifier */
  id: string;
  
  /** Project this asset belongs to */
  project_id: string;
  
  /** Asset owner user ID */
  owner_id: string;
  
  /** Original filename */
  filename: string;
  
  /** Asset type */
  type: AssetType;
  
  /** MIME type */
  mime_type: string;
  
  /** File size in bytes */
  size_bytes: number;
  
  /** Cloud storage URL */
  storage_url: string;
  
  /** Storage provider */
  storage_provider: StorageProvider;
  
  /** Asset metadata */
  metadata: AssetMetadata;
  
  /** Asset status */
  status: AssetStatus;
  
  /** Upload timestamp */
  uploaded_at: Date;
  
  /** Last accessed timestamp */
  last_accessed_at?: Date;
  
  /** Expiration timestamp (for temporary assets) */
  expires_at?: Date;
}

/**
 * Asset types
 */
export type AssetType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other';

/**
 * Storage providers
 */
export type StorageProvider = 
  | 'aws_s3'
  | 'google_cloud'
  | 'azure_blob'
  | 'local';

/**
 * Asset status
 */
export type AssetStatus = 
  | 'uploading'
  | 'available'
  | 'processing'
  | 'error'
  | 'deleted';

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** Asset description */
  description?: string;
  
  /** Asset tags */
  tags: string[];
  
  /** Image/video dimensions */
  dimensions?: {
    width: number;
    height: number;
  };
  
  /** Audio/video duration in seconds */
  duration_seconds?: number;
  
  /** Thumbnail URL */
  thumbnail_url?: string;
  
  /** Alt text for accessibility */
  alt_text?: string;
  
  /** Copyright information */
  copyright?: string;
  
  /** Location where asset was created */
  location?: AssetLocation;
  
  /** Camera/device information */
  device_info?: DeviceInfo;
}

/**
 * Asset location information
 */
export interface AssetLocation {
  /** Latitude */
  latitude: number;
  
  /** Longitude */
  longitude: number;
  
  /** Location name */
  name?: string;
  
  /** Address */
  address?: string;
}

/**
 * Device information for assets
 */
export interface DeviceInfo {
  /** Device make */
  make?: string;
  
  /** Device model */
  model?: string;
  
  /** Software version */
  software?: string;
  
  /** Camera settings */
  camera_settings?: CameraSettings;
}

/**
 * Camera settings for photos/videos
 */
export interface CameraSettings {
  /** ISO setting */
  iso?: number;
  
  /** Aperture (f-stop) */
  aperture?: string;
  
  /** Shutter speed */
  shutter_speed?: string;
  
  /** Focal length */
  focal_length?: string;
  
  /** Flash setting */
  flash?: boolean;
}

/**
 * Git integration data models
 * Requirement 11.2: Store and version files in Git repository
 */

/**
 * Git repository information
 */
export interface GitRepository {
  /** Repository URL */
  url: string;
  
  /** Repository provider */
  provider: GitProvider;
  
  /** Default branch */
  default_branch: string;
  
  /** Repository status */
  status: 'active' | 'archived' | 'error';
  
  /** Last sync timestamp */
  last_sync_at?: Date;
  
  /** Repository size in bytes */
  size_bytes?: number;
}

/**
 * Git providers
 */
export type GitProvider = 
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'local';

/**
 * Git commit information
 * Requirement 11.5: Retrieve version history from Git repositories
 */
export interface GitCommit {
  /** Commit SHA */
  sha: string;
  
  /** Commit message */
  message: string;
  
  /** Author information */
  author: GitAuthor;
  
  /** Committer information */
  committer: GitAuthor;
  
  /** Commit timestamp */
  timestamp: Date;
  
  /** Parent commit SHAs */
  parents: string[];
  
  /** Files changed in this commit */
  files_changed: GitFileChange[];
  
  /** Commit stats */
  stats: GitCommitStats;
}

/**
 * Git author/committer information
 */
export interface GitAuthor {
  /** Name */
  name: string;
  
  /** Email */
  email: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Git file change information
 */
export interface GitFileChange {
  /** File path */
  path: string;
  
  /** Change type */
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  
  /** Previous path (for renames) */
  previous_path?: string;
  
  /** Lines added */
  additions: number;
  
  /** Lines deleted */
  deletions: number;
}

/**
 * Git commit statistics
 */
export interface GitCommitStats {
  /** Total files changed */
  files_changed: number;
  
  /** Total lines added */
  additions: number;
  
  /** Total lines deleted */
  deletions: number;
}

/**
 * Project version history
 * Requirement 11.5: Version history retrieval from Git repositories
 */
export interface ProjectVersion {
  /** Version identifier (commit SHA or tag) */
  id: string;
  
  /** Version name/tag */
  name?: string;
  
  /** Version description */
  description?: string;
  
  /** Associated Git commit */
  commit: GitCommit;
  
  /** Version type */
  type: 'commit' | 'tag' | 'release';
  
  /** Whether this is the current version */
  is_current: boolean;
  
  /** Creation timestamp */
  created_at: Date;
}

/**
 * UIStateTree structure for project content
 * Requirement 11.4: Store UIStateTree.json in Git repository
 */
export interface UIStateTree {
  /** Tree version */
  version: string;
  
  /** Root node */
  root: UINode;
  
  /** Metadata */
  metadata: UITreeMetadata;
  
  /** Last modified timestamp */
  last_modified: Date;
}

/**
 * UI node in the state tree
 */
export interface UINode {
  /** Node ID */
  id: string;
  
  /** Node type */
  type: UINodeType;
  
  /** Node properties */
  properties: Record<string, any>;
  
  /** Child nodes */
  children: UINode[];
  
  /** Node metadata */
  metadata?: UINodeMetadata;
}

/**
 * UI node types
 */
export type UINodeType = 
  | 'page'
  | 'section'
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'list_item'
  | 'image'
  | 'video'
  | 'audio'
  | 'link'
  | 'table'
  | 'code'
  | 'quote'
  | 'divider';

/**
 * UI tree metadata
 */
export interface UITreeMetadata {
  /** Project ID */
  project_id: string;
  
  /** Created by user ID */
  created_by: string;
  
  /** Last modified by user ID */
  last_modified_by: string;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Schema version */
  schema_version: string;
}

/**
 * UI node metadata
 */
export interface UINodeMetadata {
  /** Created by user ID */
  created_by?: string;
  
  /** Last modified by user ID */
  last_modified_by?: string;
  
  /** Creation timestamp */
  created_at?: Date;
  
  /** Last modified timestamp */
  last_modified_at?: Date;
  
  /** Node-specific metadata */
  custom?: Record<string, any>;
}