// Core type definitions for the Community Outreach System

/**
 * Configuration profile for a CognitiveAgent instance
 * Defines the agent's capabilities, model, and operational parameters
 */
export interface ConfigurationProfile {
  /** The LLM model to use for this agent */
  llm_model: string;
  
  /** Available tools/functions for this agent */
  toolkit: string[];
  
  /** Memory access scope for this agent */
  memory_scope: string;
  
  /** Initial phase to enter in the Roundabout cognitive loop */
  entry_phase: 'EMERGE' | 'ADAPT' | 'INTEGRATE';
  
  /** Maximum recursion depth for child agent creation */
  max_recursion_depth?: number;
  
  /** Resource budget allocation */
  resource_budget?: ResourceBudget;
}

/**
 * Context thread for maintaining state across agent interactions
 * Provides the complete context for agent operations
 */
export interface ContextThread {
  /** Unique identifier for this context thread */
  id: string;
  
  /** Top-level goal this thread is working towards */
  top_level_goal: string;
  
  /** ID of the parent agent that created this thread */
  parent_agent_id?: string;
  
  /** Specific task definition for this thread */
  task_definition: string;
  
  /** Configuration profile for the agent using this thread */
  configuration_profile: ConfigurationProfile;
  
  /** Memory access scope */
  memory_scope: string;
  
  /** Resource budget for this thread */
  resource_budget: ResourceBudget;
  
  /** Current recursion depth */
  recursion_depth: number;
  
  /** Git workspace branch for this thread */
  workspace_branch: string;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last updated timestamp */
  updated_at: Date;
}

/**
 * Resource budget allocation for agents
 */
export interface ResourceBudget {
  /** Maximum LLM API calls allowed */
  max_llm_calls: number;
  
  /** Maximum compute units */
  max_compute_units: number;
  
  /** Maximum storage usage in bytes */
  max_storage_bytes: number;
  
  /** Maximum execution time in milliseconds */
  max_execution_time: number;
}

/**
 * User state vector representing emotional and cognitive state
 */
export interface UserState {
  /** FIGHT dimension - aggression, confrontation */
  fight: number;
  
  /** FLIGHT dimension - avoidance, withdrawal */
  flight: number;
  
  /** FIXES dimension - problem-solving orientation */
  fixes: number;
  
  /** Timestamp when this state was captured */
  timestamp: Date;
  
  /** Confidence level of this assessment */
  confidence: number;
}

/**
 * Agent state vector for relational delta calculation
 */
export interface AgentState {
  /** Current cognitive phase */
  cognitive_phase: 'EMERGE' | 'ADAPT' | 'INTEGRATE';
  
  /** Emotional resonance with user */
  resonance: number;
  
  /** Problem-solving confidence */
  confidence: number;
  
  /** Timestamp when this state was captured */
  timestamp: Date;
}

/**
 * Relational delta between user and agent states
 */
export interface RelationalDelta {
  /** Asynchronous delta (misunderstanding) */
  asynchronous_delta: number;
  
  /** Synchronous delta (harmony) */
  synchronous_delta: number;
  
  /** Overall delta magnitude */
  magnitude: number;
  
  /** Recommended communication strategy */
  strategy: 'mirror' | 'harmonize' | 'listen';
}

/**
 * User input structure from the interface
 */
export interface UserInput {
  /** Raw text input from user */
  text: string;
  
  /** Input type classification */
  type: 'chat' | 'edit' | 'command';
  
  /** Associated context (page, contact, etc.) */
  context?: Record<string, any>;
  
  /** Timestamp of input */
  timestamp: Date;
}

/**
 * Agent response structure
 */
export interface AgentResponse {
  /** Response text to display to user */
  text: string;
  
  /** Response type */
  type: 'message' | 'action' | 'suggestion';
  
  /** Associated actions to perform */
  actions?: AgentAction[];
  
  /** Updated user state after processing */
  user_state?: UserState;
  
  /** Agent state after processing */
  agent_state?: AgentState;
  
  /** Timestamp of response */
  timestamp: Date;
}

/**
 * Actions that agents can perform
 */
export interface AgentAction {
  /** Action type */
  type: 'create_page' | 'update_memory' | 'send_message' | 'clone_agent';
  
  /** Action parameters */
  parameters: Record<string, any>;
  
  /** Whether this action requires user approval */
  requires_approval: boolean;
}

/**
 * Memory scope definition for agent access control
 */
export interface MemoryScope {
  /** Scope identifier */
  id: string;
  
  /** Accessible user IDs */
  user_ids: string[];
  
  /** Accessible project IDs */
  project_ids: string[];
  
  /** Accessible contact IDs */
  contact_ids: string[];
  
  /** Read/write permissions */
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
}

/**
 * User role definitions
 */
export type UserRole = 'senior' | 'architect';

/**
 * Cognitive loop phases
 */
export type CognitivePhase = 'EMERGE' | 'ADAPT' | 'INTEGRATE';

/**
 * Agent roles in the system
 */
export type AgentRole = 'Coordinator' | 'Conscious' | 'Core';

// Re-export from cognitive-agent module
export type { CognitiveAgent, AgentFactory, AgentStatus, ChildAgentReport } from './cognitive-agent';

// Re-export from memory module
export type { MemoryAssistant, GraphData } from './memory';

// Re-export from editor module
export type { UIStateTree as EditorUIStateTree, TextBlock, ImageBlock, ListBlock, CodeBlock, EditorState, WYSIWYGEditorProps } from './editor';

// Re-export from data models module
export type { User, Contact, ContactGroup, Consent, Project, Asset, GraphNodeType, AssetMetadata, EncryptedContactDetails, ConsentScope } from './data-models';