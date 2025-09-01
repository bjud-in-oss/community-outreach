/**
 * Legacy System Types for "Hälsning till Framtiden" Application
 * Implements future message delivery with time-based, event-based, and query-based triggers
 */

/**
 * Legacy content that can be delivered in the future
 * Requirement 23.1: Implement LegacyContent creation and trigger definition
 */
export interface LegacyContent {
  /** Unique identifier for the legacy content */
  id: string;
  
  /** User who created this legacy content */
  creator_id: string;
  
  /** Title of the legacy content */
  title: string;
  
  /** Content type */
  type: LegacyContentType;
  
  /** The actual content */
  content: LegacyContentData;
  
  /** Trigger that determines when this content is delivered */
  trigger: LegacyTrigger;
  
  /** Recipients of this legacy content */
  recipients: LegacyRecipient[];
  
  /** Delivery settings */
  delivery_settings: DeliverySettings;
  
  /** Current status */
  status: LegacyContentStatus;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
  
  /** Scheduled delivery timestamp (calculated from trigger) */
  scheduled_delivery_at?: Date;
  
  /** Actual delivery timestamp */
  delivered_at?: Date;
  
  /** Delivery attempts */
  delivery_attempts: DeliveryAttempt[];
}

/**
 * Types of legacy content
 */
export type LegacyContentType = 
  | 'text_message'
  | 'story'
  | 'video_message'
  | 'audio_message'
  | 'photo_collection'
  | 'app_view'
  | 'memory_collection';

/**
 * Legacy content data structure
 */
export interface LegacyContentData {
  /** Main content text */
  text?: string;
  
  /** Associated assets */
  assets?: string[]; // Asset IDs
  
  /** UIStateTree for app views */
  ui_state_tree?: string; // JSON string of UIStateTree
  
  /** Memory references */
  memory_references?: string[]; // Memory node IDs
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Legacy trigger definition
 * Requirement 23.2: Support time-based, event-based, and query-based trigger types
 */
export interface LegacyTrigger {
  /** Unique trigger identifier */
  id: string;
  
  /** Trigger type */
  type: LegacyTriggerType;
  
  /** Trigger configuration */
  config: LegacyTriggerConfig;
  
  /** Human-readable description */
  description: string;
  
  /** Whether this trigger is active */
  active: boolean;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last evaluation timestamp */
  last_evaluated_at?: Date;
  
  /** Next evaluation timestamp */
  next_evaluation_at?: Date;
}

/**
 * Types of legacy triggers
 * Requirement 23.3: Time-based, event-based, and query-based trigger types
 */
export type LegacyTriggerType = 
  | 'time_based'
  | 'event_based'
  | 'query_based';

/**
 * Legacy trigger configuration
 */
export type LegacyTriggerConfig = 
  | TimeBasedTriggerConfig
  | EventBasedTriggerConfig
  | QueryBasedTriggerConfig;

/**
 * Time-based trigger configuration
 * Requirement 23.3: Time-based triggers (specific date)
 */
export interface TimeBasedTriggerConfig {
  /** Specific date and time for delivery */
  delivery_date: Date;
  
  /** Timezone for delivery */
  timezone: string;
  
  /** Whether to respect recipient's timezone */
  respect_recipient_timezone: boolean;
  
  /** Recurring pattern (optional) */
  recurring?: RecurringPattern;
}

/**
 * Recurring pattern for time-based triggers
 */
export interface RecurringPattern {
  /** Recurrence type */
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  
  /** Interval (e.g., every 2 weeks) */
  interval: number;
  
  /** End date for recurrence */
  end_date?: Date;
  
  /** Maximum number of occurrences */
  max_occurrences?: number;
}

/**
 * Event-based trigger configuration
 * Requirement 23.3: Event-based triggers (milestone achieved by recipient)
 */
export interface EventBasedTriggerConfig {
  /** Event type to watch for */
  event_type: EventType;
  
  /** Event criteria */
  criteria: EventCriteria;
  
  /** Delay after event occurs */
  delay_after_event?: DelayConfig;
}

/**
 * Event types that can trigger legacy content delivery
 */
export type EventType = 
  | 'birthday'
  | 'anniversary'
  | 'graduation'
  | 'marriage'
  | 'new_job'
  | 'retirement'
  | 'milestone_age'
  | 'project_completion'
  | 'memory_creation'
  | 'first_login'
  | 'system_event';

/**
 * Event criteria for matching
 */
export interface EventCriteria {
  /** Specific criteria based on event type */
  [key: string]: any;
  
  /** For milestone_age events */
  target_age?: number;
  
  /** For anniversary events */
  anniversary_type?: string;
  
  /** For project_completion events */
  project_type?: string;
  
  /** For memory_creation events */
  memory_theme?: string;
}

/**
 * Delay configuration for event-based triggers
 */
export interface DelayConfig {
  /** Delay amount */
  amount: number;
  
  /** Delay unit */
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
}

/**
 * Query-based trigger configuration
 * Requirement 23.3: Query-based triggers (specific question asked by future user)
 */
export interface QueryBasedTriggerConfig {
  /** Query patterns to match */
  query_patterns: QueryPattern[];
  
  /** Minimum confidence threshold for matching */
  confidence_threshold: number;
  
  /** Context requirements */
  context_requirements?: ContextRequirement[];
}

/**
 * Query pattern for matching user questions
 */
export interface QueryPattern {
  /** Pattern text or regex */
  pattern: string;
  
  /** Pattern type */
  type: 'exact' | 'contains' | 'regex' | 'semantic';
  
  /** Weight for this pattern */
  weight: number;
  
  /** Case sensitive matching */
  case_sensitive: boolean;
}

/**
 * Context requirements for query-based triggers
 */
export interface ContextRequirement {
  /** Required context type */
  type: 'user_state' | 'time_of_day' | 'location' | 'recent_activity';
  
  /** Context criteria */
  criteria: Record<string, any>;
}

/**
 * Legacy content recipient
 */
export interface LegacyRecipient {
  /** Recipient contact ID */
  contact_id: string;
  
  /** Recipient role in relation to creator */
  relationship: string;
  
  /** Delivery preferences for this recipient */
  delivery_preferences: RecipientDeliveryPreferences;
  
  /** Consent status */
  consent_status: ConsentStatus;
  
  /** When consent was given */
  consent_given_at?: Date;
  
  /** Delivery status for this recipient */
  delivery_status: DeliveryStatus;
}

/**
 * Recipient delivery preferences
 */
export interface RecipientDeliveryPreferences {
  /** Preferred delivery method */
  delivery_method: DeliveryMethod;
  
  /** Preferred time of day */
  preferred_time?: TimeOfDay;
  
  /** Preferred days of week */
  preferred_days?: DayOfWeek[];
  
  /** Whether to respect emotional state */
  respect_emotional_state: boolean;
  
  /** Maximum delivery attempts */
  max_delivery_attempts: number;
}

/**
 * Delivery methods
 */
export type DeliveryMethod = 
  | 'in_app_notification'
  | 'email'
  | 'push_notification'
  | 'system_message';

/**
 * Time of day preferences
 */
export interface TimeOfDay {
  /** Start hour (24-hour format) */
  start_hour: number;
  
  /** End hour (24-hour format) */
  end_hour: number;
  
  /** Timezone */
  timezone: string;
}

/**
 * Days of the week
 */
export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * Consent status for legacy content
 */
export type ConsentStatus = 
  | 'pending'
  | 'granted'
  | 'denied'
  | 'revoked'
  | 'expired';

/**
 * Delivery status
 */
export type DeliveryStatus = 
  | 'scheduled'
  | 'pending'
  | 'delivered'
  | 'failed'
  | 'refused'
  | 'cancelled';

/**
 * Legacy content status
 */
export type LegacyContentStatus = 
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'delivered'
  | 'cancelled'
  | 'expired';

/**
 * Delivery settings
 */
export interface DeliverySettings {
  /** Whether to use tactful delivery process */
  tactful_delivery: boolean;
  
  /** Whether to check recipient's emotional state */
  check_emotional_state: boolean;
  
  /** Maximum delivery attempts */
  max_attempts: number;
  
  /** Retry delay configuration */
  retry_delay: DelayConfig;
  
  /** Fallback delivery method */
  fallback_method?: DeliveryMethod;
  
  /** Whether to notify creator of delivery status */
  notify_creator: boolean;
}

/**
 * Delivery attempt record
 */
export interface DeliveryAttempt {
  /** Attempt number */
  attempt_number: number;
  
  /** Recipient contact ID */
  recipient_id: string;
  
  /** Delivery method used */
  delivery_method: DeliveryMethod;
  
  /** Attempt timestamp */
  attempted_at: Date;
  
  /** Attempt result */
  result: DeliveryResult;
  
  /** Error message if failed */
  error_message?: string;
  
  /** Recipient's emotional state at time of attempt */
  recipient_emotional_state?: UserState;
  
  /** Next retry timestamp */
  next_retry_at?: Date;
}

/**
 * Delivery result
 */
export type DeliveryResult = 
  | 'success'
  | 'failed'
  | 'refused'
  | 'deferred'
  | 'recipient_unavailable'
  | 'emotional_state_unsuitable';

/**
 * Digital executor configuration
 * Requirement 23.7: Digital executor for legacy management
 */
export interface DigitalExecutor {
  /** Executor contact ID */
  executor_id: string;
  
  /** Executor permissions */
  permissions: DigitalExecutorPermissions;
  
  /** When executor role was assigned */
  assigned_at: Date;
  
  /** Executor status */
  status: 'active' | 'inactive' | 'revoked';
  
  /** Notification preferences */
  notification_preferences: ExecutorNotificationPreferences;
}

/**
 * Digital executor permissions
 */
export interface DigitalExecutorPermissions {
  /** Can view all legacy content */
  view_legacy_content: boolean;
  
  /** Can modify delivery schedules */
  modify_schedules: boolean;
  
  /** Can cancel deliveries */
  cancel_deliveries: boolean;
  
  /** Can add new recipients */
  add_recipients: boolean;
  
  /** Can access creator's account */
  access_account: boolean;
  
  /** Can export legacy content */
  export_content: boolean;
}

/**
 * Executor notification preferences
 */
export interface ExecutorNotificationPreferences {
  /** Notify on delivery failures */
  delivery_failures: boolean;
  
  /** Notify on successful deliveries */
  successful_deliveries: boolean;
  
  /** Notify on recipient refusals */
  recipient_refusals: boolean;
  
  /** Notify on system issues */
  system_issues: boolean;
}

/**
 * Legacy system configuration
 */
export interface LegacySystemConfig {
  /** Maximum legacy content per user */
  max_legacy_content_per_user: number;
  
  /** Maximum recipients per content */
  max_recipients_per_content: number;
  
  /** Default delivery attempt limit */
  default_max_delivery_attempts: number;
  
  /** Minimum delay between delivery attempts */
  min_retry_delay_hours: number;
  
  /** Maximum future delivery date */
  max_future_delivery_years: number;
  
  /** Whether to require mutual consent */
  require_mutual_consent: boolean;
}

/**
 * User state for emotional state checking
 * Re-exported from main types for convenience
 */
export interface UserState {
  fight: number;
  flight: number;
  fixes: number;
  timestamp: Date;
  confidence: number;
}