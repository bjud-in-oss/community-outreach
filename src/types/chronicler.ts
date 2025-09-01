/**
 * Personal Chronicler application types
 * Implements private reflection saving with emotional context and message transformation
 */

import { UserState, Asset } from './index';

/**
 * Personal reflection entry with emotional context
 * Requirement 19.1: Private reflection saving with emotional context
 */
export interface ReflectionEntry {
  /** Unique reflection identifier */
  id: string;
  
  /** User who created this reflection */
  user_id: string;
  
  /** Reflection title */
  title: string;
  
  /** Reflection content in UIStateTree format */
  content: ReflectionContent;
  
  /** Emotional context when reflection was created */
  emotional_context: UserState;
  
  /** Privacy level */
  privacy_level: PrivacyLevel;
  
  /** Associated assets (photos, documents, etc.) */
  assets: Asset[];
  
  /** Tags for categorization */
  tags: string[];
  
  /** Location where reflection was created */
  location?: ReflectionLocation;
  
  /** Whether this reflection can be transformed for sharing */
  shareable: boolean;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
  
  /** Reflection status */
  status: ReflectionStatus;
}

/**
 * Reflection content structure
 */
export interface ReflectionContent {
  /** Main text content */
  text: string;
  
  /** Structured content blocks */
  blocks: ReflectionBlock[];
  
  /** Content metadata */
  metadata: ReflectionMetadata;
}

/**
 * Individual content block in a reflection
 */
export interface ReflectionBlock {
  /** Block identifier */
  id: string;
  
  /** Block type */
  type: ReflectionBlockType;
  
  /** Block content */
  content: any;
  
  /** Block metadata */
  metadata?: Record<string, any>;
}

/**
 * Types of content blocks in reflections
 */
export type ReflectionBlockType = 
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'location'
  | 'mood'
  | 'memory'
  | 'quote'
  | 'list';

/**
 * Reflection content metadata
 */
export interface ReflectionMetadata {
  /** Word count */
  word_count: number;
  
  /** Estimated reading time in minutes */
  reading_time_minutes: number;
  
  /** Dominant emotions detected */
  dominant_emotions: string[];
  
  /** Key themes identified */
  themes: string[];
  
  /** Language of the content */
  language: string;
}

/**
 * Privacy levels for reflections
 */
export type PrivacyLevel = 
  | 'private'      // Only visible to the user
  | 'protected'    // Can be shared with explicit consent
  | 'shareable';   // Can be transformed and shared

/**
 * Reflection status
 */
export type ReflectionStatus = 
  | 'draft'
  | 'saved'
  | 'archived'
  | 'deleted';

/**
 * Location information for reflections
 */
export interface ReflectionLocation {
  /** Latitude */
  latitude: number;
  
  /** Longitude */
  longitude: number;
  
  /** Location name */
  name?: string;
  
  /** Address */
  address?: string;
  
  /** Location significance */
  significance?: string;
}

/**
 * Cortex-mode message transformation
 * Requirement 19.2: Message transformation for recipients
 */
export interface CortexTransformation {
  /** Transformation identifier */
  id: string;
  
  /** Original reflection ID */
  source_reflection_id: string;
  
  /** Target recipient user ID */
  recipient_id: string;
  
  /** Transformation type */
  type: TransformationType;
  
  /** Original content */
  original_content: ReflectionContent;
  
  /** Transformed content */
  transformed_content: TransformedContent;
  
  /** Transformation parameters */
  parameters: TransformationParameters;
  
  /** Transformation status */
  status: TransformationStatus;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Completion timestamp */
  completed_at?: Date;
  
  /** Error information if transformation failed */
  error?: TransformationError;
}

/**
 * Types of content transformation
 */
export type TransformationType = 
  | 'personal_message'    // Transform into personal message
  | 'memory_share'        // Share as memory
  | 'story_adaptation'    // Adapt story for recipient
  | 'emotional_summary'   // Create emotional summary
  | 'legacy_message';     // Transform into legacy message

/**
 * Transformed content structure
 */
export interface TransformedContent {
  /** Transformed text */
  text: string;
  
  /** Transformation tone */
  tone: MessageTone;
  
  /** Recipient-specific adaptations */
  adaptations: ContentAdaptation[];
  
  /** Suggested delivery method */
  delivery_method: DeliveryMethod;
  
  /** Emotional context for recipient */
  recipient_emotional_context?: UserState;
}

/**
 * Message tone for transformations
 */
export type MessageTone = 
  | 'warm'
  | 'formal'
  | 'casual'
  | 'heartfelt'
  | 'encouraging'
  | 'nostalgic'
  | 'celebratory';

/**
 * Content adaptations for specific recipients
 */
export interface ContentAdaptation {
  /** Adaptation type */
  type: 'language' | 'cultural' | 'relationship' | 'emotional';
  
  /** Adaptation description */
  description: string;
  
  /** Original content */
  original: string;
  
  /** Adapted content */
  adapted: string;
}

/**
 * Delivery methods for transformed content
 */
export type DeliveryMethod = 
  | 'direct_message'
  | 'email'
  | 'shared_memory'
  | 'scheduled_delivery'
  | 'legacy_trigger';

/**
 * Transformation parameters
 */
export interface TransformationParameters {
  /** Target relationship type */
  relationship_type: string;
  
  /** Desired emotional impact */
  emotional_impact: string;
  
  /** Cultural considerations */
  cultural_context?: string;
  
  /** Language preferences */
  language_preferences?: string[];
  
  /** Formality level */
  formality_level: 'casual' | 'semi_formal' | 'formal';
  
  /** Include emotional context */
  include_emotional_context: boolean;
}

/**
 * Transformation status
 */
export type TransformationStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Transformation error information
 */
export interface TransformationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error details */
  details?: Record<string, any>;
  
  /** Retry count */
  retry_count: number;
  
  /** Whether error is retryable */
  retryable: boolean;
}

/**
 * External asset integration
 * Requirement 19.3: External asset integration (Google Photos, Gmail)
 */
export interface ExternalAssetIntegration {
  /** Integration identifier */
  id: string;
  
  /** User ID */
  user_id: string;
  
  /** External service provider */
  provider: ExternalProvider;
  
  /** Integration status */
  status: IntegrationStatus;
  
  /** Authentication information */
  auth: ExternalAuth;
  
  /** Integration settings */
  settings: IntegrationSettings;
  
  /** Last sync timestamp */
  last_sync_at?: Date;
  
  /** Sync statistics */
  sync_stats?: SyncStatistics;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * External service providers
 */
export type ExternalProvider = 
  | 'google_photos'
  | 'gmail'
  | 'google_drive'
  | 'icloud_photos'
  | 'dropbox'
  | 'onedrive';

/**
 * Integration status
 */
export type IntegrationStatus = 
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'syncing'
  | 'rate_limited';

/**
 * External authentication information
 */
export interface ExternalAuth {
  /** Access token (encrypted) */
  access_token: string;
  
  /** Refresh token (encrypted) */
  refresh_token?: string;
  
  /** Token expiration timestamp */
  expires_at?: Date;
  
  /** Granted scopes */
  scopes: string[];
  
  /** Authentication method */
  method: 'oauth2' | 'api_key' | 'service_account';
}

/**
 * Integration settings
 */
export interface IntegrationSettings {
  /** Auto-sync enabled */
  auto_sync: boolean;
  
  /** Sync frequency in hours */
  sync_frequency_hours: number;
  
  /** Asset types to sync */
  asset_types: string[];
  
  /** Date range for sync */
  date_range?: {
    start_date: Date;
    end_date?: Date;
  };
  
  /** Folder/album filters */
  filters?: IntegrationFilters;
  
  /** Privacy settings */
  privacy: IntegrationPrivacy;
}

/**
 * Integration filters
 */
export interface IntegrationFilters {
  /** Include specific folders/albums */
  include_folders?: string[];
  
  /** Exclude specific folders/albums */
  exclude_folders?: string[];
  
  /** Minimum file size in bytes */
  min_file_size?: number;
  
  /** Maximum file size in bytes */
  max_file_size?: number;
  
  /** File type filters */
  file_types?: string[];
}

/**
 * Integration privacy settings
 */
export interface IntegrationPrivacy {
  /** Encrypt synced assets */
  encrypt_assets: boolean;
  
  /** Store metadata only */
  metadata_only: boolean;
  
  /** Require consent for each asset */
  require_consent: boolean;
  
  /** Auto-delete after sync */
  auto_delete_after_sync: boolean;
}

/**
 * Sync statistics
 */
export interface SyncStatistics {
  /** Total assets synced */
  total_synced: number;
  
  /** Assets added in last sync */
  last_sync_added: number;
  
  /** Assets updated in last sync */
  last_sync_updated: number;
  
  /** Assets failed in last sync */
  last_sync_failed: number;
  
  /** Total sync time in milliseconds */
  total_sync_time_ms: number;
  
  /** Average sync time per asset */
  avg_sync_time_per_asset_ms: number;
}

/**
 * External asset reference
 */
export interface ExternalAsset {
  /** External asset identifier */
  external_id: string;
  
  /** Provider */
  provider: ExternalProvider;
  
  /** Asset URL on external service */
  external_url: string;
  
  /** Local asset ID (if synced) */
  local_asset_id?: string;
  
  /** Asset metadata from external service */
  external_metadata: ExternalAssetMetadata;
  
  /** Sync status */
  sync_status: 'pending' | 'synced' | 'failed' | 'skipped';
  
  /** Last sync attempt */
  last_sync_attempt?: Date;
  
  /** Sync error if failed */
  sync_error?: string;
}

/**
 * External asset metadata
 */
export interface ExternalAssetMetadata {
  /** Original filename */
  filename: string;
  
  /** File size in bytes */
  size_bytes: number;
  
  /** MIME type */
  mime_type: string;
  
  /** Creation date on external service */
  created_at: Date;
  
  /** Last modified date on external service */
  modified_at: Date;
  
  /** External service specific metadata */
  provider_metadata: Record<string, any>;
}

/**
 * Chronicler workflow state
 */
export interface ChroniclerWorkflow {
  /** Workflow identifier */
  id: string;
  
  /** User ID */
  user_id: string;
  
  /** Current workflow step */
  current_step: WorkflowStep;
  
  /** Workflow data */
  data: WorkflowData;
  
  /** Workflow status */
  status: WorkflowStatus;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Completion timestamp */
  completed_at?: Date;
  
  /** Error information */
  error?: WorkflowError;
}

/**
 * Workflow steps
 */
export type WorkflowStep = 
  | 'create_reflection'
  | 'capture_emotional_context'
  | 'add_assets'
  | 'set_privacy'
  | 'save_reflection'
  | 'transform_for_sharing'
  | 'schedule_delivery'
  | 'complete';

/**
 * Workflow data
 */
export interface WorkflowData {
  /** Reflection being created/edited */
  reflection?: Partial<ReflectionEntry>;
  
  /** Transformation being processed */
  transformation?: Partial<CortexTransformation>;
  
  /** External assets being integrated */
  external_assets?: ExternalAsset[];
  
  /** User selections and preferences */
  user_selections: Record<string, any>;
  
  /** Workflow metadata */
  metadata: Record<string, any>;
}

/**
 * Workflow status
 */
export type WorkflowStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Workflow error
 */
export interface WorkflowError {
  /** Error step */
  step: WorkflowStep;
  
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error details */
  details?: Record<string, any>;
  
  /** Whether workflow can be retried */
  retryable: boolean;
}