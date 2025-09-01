import { 
  ConfigurationProfile, 
  ContextThread, 
  UserInput, 
  AgentResponse, 
  UserState, 
  AgentState, 
  RelationalDelta,
  AgentRole,
  CognitivePhase
} from './index';

/**
 * Core CognitiveAgent interface - the universal agent class
 * All intelligence in the system is implemented through this single interface
 */
export interface CognitiveAgent {
  /** Unique identifier for this agent instance */
  readonly id: string;
  
  /** Role of this agent in the system */
  readonly role: AgentRole;
  
  /** Configuration profile defining capabilities and constraints */
  readonly configurationProfile: ConfigurationProfile;
  
  /** Context thread providing operational context */
  readonly contextThread: ContextThread;
  
  /** Current phase in the Roundabout cognitive loop */
  currentPhase: CognitivePhase;
  
  /** Current agent state for relational delta calculation */
  currentState: AgentState;
  
  /** Parent agent ID if this is a child agent */
  readonly parentAgentId?: string;
  
  /** Child agents created by this agent */
  readonly childAgents: Map<string, CognitiveAgent>;
  
  /**
   * Process user input through the cognitive pipeline
   * @param input User input to process
   * @returns Promise resolving to agent response
   */
  processInput(input: UserInput): Promise<AgentResponse>;
  
  /**
   * Execute the Roundabout cognitive loop
   * EMERGE -> ADAPT -> INTEGRATE sequence
   * @returns Promise resolving when loop completes
   */
  executeRoundaboutLoop(): Promise<void>;
  
  /**
   * Clone this agent to create a child agent for delegation
   * @param childConfig Configuration for the child agent
   * @param taskDefinition Specific task for the child
   * @returns Promise resolving to new child agent
   */
  clone(childConfig: ConfigurationProfile, taskDefinition: string): Promise<CognitiveAgent>;
  
  /**
   * Calculate relational delta with user state
   * @param userState Current user state
   * @returns Relational delta analysis
   */
  calculateRelationalDelta(userState: UserState): RelationalDelta;
  
  /**
   * Update agent state based on interaction
   * @param newState New agent state
   */
  updateState(newState: Partial<AgentState>): void;
  
  /**
   * Terminate this agent and clean up resources
   */
  terminate(): Promise<void>;
  
  /**
   * Get current status and metrics
   */
  getStatus(): AgentStatus;
  
  /**
   * Get child agent by ID
   */
  getChildAgent(childId: string): CognitiveAgent | null;
  
  /**
   * List all child agents
   */
  listChildAgents(): CognitiveAgent[];
  
  /**
   * Remove completed child agent and get its report
   */
  removeChildAgent(childId: string): Promise<ChildAgentReport | null>;
}

/**
 * Agent status information
 */
export interface AgentStatus {
  /** Agent ID */
  id: string;
  
  /** Current phase */
  phase: CognitivePhase;
  
  /** Is agent active */
  active: boolean;
  
  /** Number of child agents */
  childCount: number;
  
  /** Resource usage */
  resourceUsage: {
    llmCalls: number;
    computeUnits: number;
    storageBytes: number;
    executionTime: number;
  };
  
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * Report from a child agent about its execution
 */
export interface ChildAgentReport {
  /** Child agent ID */
  childId: string;
  
  /** Task definition the child was working on */
  taskDefinition: string;
  
  /** Final status of the child agent */
  status: 'completed' | 'failed' | 'running' | 'error';
  
  /** Result data if completed successfully */
  result: any;
  
  /** Error message if failed */
  error: string | null;
  
  /** Resource usage by the child agent */
  resourceUsage: {
    llmCalls: number;
    computeUnits: number;
    storageBytes: number;
    executionTime: number;
  };
  
  /** Total execution time in milliseconds */
  executionTime: number;
  
  /** Timestamp when report was generated */
  timestamp: Date;
}

/**
 * Agent factory for creating new agent instances
 */
export interface AgentFactory {
  /**
   * Create a new cognitive agent
   * @param role Agent role
   * @param config Configuration profile
   * @param contextThread Context thread
   * @returns New agent instance
   */
  createAgent(
    role: AgentRole,
    config: ConfigurationProfile,
    contextThread: ContextThread
  ): Promise<CognitiveAgent>;
  
  /**
   * Get agent by ID
   * @param id Agent ID
   * @returns Agent instance or null
   */
  getAgent(id: string): CognitiveAgent | null;
  
  /**
   * List all active agents
   * @returns Array of active agents
   */
  listActiveAgents(): CognitiveAgent[];
  
  /**
   * Terminate all agents
   */
  terminateAll(): Promise<void>;
}