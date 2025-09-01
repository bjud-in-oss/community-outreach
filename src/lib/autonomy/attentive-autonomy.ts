import { CognitiveAgent } from '@/types';
import { resourceGovernor } from '../resource-governor';

/**
 * System operating modes
 */
export type SystemMode = 'Attentive' | 'Autonomous';

/**
 * Creative exploration ("Lek") process configuration
 */
export interface LekConfiguration {
  /** Maximum exploration time in milliseconds */
  max_exploration_time: number;
  
  /** Resource budget for exploration */
  resource_budget: {
    max_llm_calls: number;
    max_compute_units: number;
  };
  
  /** Exploration focus areas */
  focus_areas: string[];
  
  /** Whether to generate new associations */
  generate_associations: boolean;
}

/**
 * User activity detection interface
 */
export interface UserActivityDetector {
  /** Check if user input has been detected */
  hasUserInput(): Promise<boolean>;
  
  /** Get the latest user input if available */
  getLatestInput(): Promise<any>;
  
  /** Register callback for user input detection */
  onUserInput(callback: (input: any) => void): void;
  
  /** Clear user input detection */
  clearUserInput(): void;
}

/**
 * Attentive Autonomy System
 * Manages automatic mode switching between Autonomous and Attentive modes
 * Implements Creative Exploration ("Lek") process for autonomous operation
 */
export class AttentiveAutonomySystem {
  private currentMode: SystemMode = 'Attentive';
  private coordinatorAgent: CognitiveAgent | null = null;
  private userActivityDetector: UserActivityDetector;
  private autonomousTaskInterrupted = false;
  private lekProcess: LekProcess | null = null;
  private modeChangeCallbacks: ((mode: SystemMode) => void)[] = [];
  
  constructor(userActivityDetector: UserActivityDetector) {
    this.userActivityDetector = userActivityDetector;
    this.setupUserInputDetection();
  }

  /**
   * Get current system mode
   */
  getCurrentMode(): SystemMode {
    return this.currentMode;
  }

  /**
   * Set the coordinator agent for autonomous operations
   */
  setCoordinatorAgent(agent: CognitiveAgent): void {
    this.coordinatorAgent = agent;
  }

  /**
   * Switch to Autonomous mode and start Creative Exploration
   */
  async switchToAutonomousMode(lekConfig?: Partial<LekConfiguration>): Promise<void> {
    if (this.currentMode === 'Autonomous') {
      return; // Already in autonomous mode
    }

    // Validate that we have a coordinator agent
    if (!this.coordinatorAgent) {
      throw new Error('Cannot switch to Autonomous mode: No coordinator agent available');
    }

    // Check resource availability with Resource Governor
    const resourceApproval = await resourceGovernor.requestApproval({
      operation: 'autonomous_mode',
      requestingAgentId: this.coordinatorAgent.id,
      estimatedCost: {
        llmCalls: lekConfig?.resource_budget?.max_llm_calls || 20,
        computeUnits: lekConfig?.resource_budget?.max_compute_units || 100,
        storageBytes: 1024,
        executionTime: lekConfig?.max_exploration_time || 300000 // 5 minutes default
      },
      contextThread: this.coordinatorAgent.contextThread,
      parameters: {
        mode: 'autonomous',
        lekConfig
      }
    });

    if (!resourceApproval.approved) {
      throw new Error(`Autonomous mode denied: ${resourceApproval.reason}`);
    }

    // Switch mode
    this.currentMode = 'Autonomous';
    this.autonomousTaskInterrupted = false;
    
    // Start Creative Exploration process
    await this.startLekProcess(lekConfig);
    
    // Notify mode change
    this.notifyModeChange('Autonomous');
    
    console.log('[AttentiveAutonomy] Switched to Autonomous mode with Creative Exploration');
  }

  /**
   * Switch to Attentive mode and interrupt any autonomous tasks
   */
  async switchToAttentiveMode(): Promise<void> {
    if (this.currentMode === 'Attentive') {
      return; // Already in attentive mode
    }

    // Interrupt any ongoing autonomous tasks
    await this.interruptAutonomousTasks();
    
    // Switch mode
    this.currentMode = 'Attentive';
    this.autonomousTaskInterrupted = false;
    
    // Notify mode change
    this.notifyModeChange('Attentive');
    
    console.log('[AttentiveAutonomy] Switched to Attentive mode - autonomous tasks interrupted');
  }

  /**
   * Register callback for mode changes
   */
  onModeChange(callback: (mode: SystemMode) => void): void {
    this.modeChangeCallbacks.push(callback);
  }

  /**
   * Check if autonomous tasks were interrupted
   */
  wasAutonomousTaskInterrupted(): boolean {
    return this.autonomousTaskInterrupted;
  }

  /**
   * Get current Lek process status
   */
  getLekProcessStatus(): LekProcessStatus | null {
    return this.lekProcess?.getStatus() || null;
  }

  /**
   * Manually trigger mode evaluation (for testing)
   */
  async evaluateMode(): Promise<void> {
    const hasInput = await this.userActivityDetector.hasUserInput();
    
    if (hasInput && this.currentMode === 'Autonomous') {
      await this.switchToAttentiveMode();
    }
  }

  // Private methods

  private setupUserInputDetection(): void {
    this.userActivityDetector.onUserInput(async (input) => {
      if (this.currentMode === 'Autonomous') {
        console.log('[AttentiveAutonomy] User input detected - switching to Attentive mode');
        await this.switchToAttentiveMode();
      }
    });
  }

  private async startLekProcess(config?: Partial<LekConfiguration>): Promise<void> {
    if (!this.coordinatorAgent) {
      throw new Error('Cannot start Lek process: No coordinator agent available');
    }

    const lekConfig: LekConfiguration = {
      max_exploration_time: config?.max_exploration_time || 300000, // 5 minutes
      resource_budget: {
        max_llm_calls: config?.resource_budget?.max_llm_calls || 20,
        max_compute_units: config?.resource_budget?.max_compute_units || 100
      },
      focus_areas: config?.focus_areas || ['memory_associations', 'thematic_connections', 'creative_insights'],
      generate_associations: config?.generate_associations ?? true
    };

    this.lekProcess = new LekProcess(this.coordinatorAgent, lekConfig);
    await this.lekProcess.start();
  }

  private async interruptAutonomousTasks(): Promise<void> {
    this.autonomousTaskInterrupted = true;
    
    // Stop Lek process if running
    if (this.lekProcess) {
      await this.lekProcess.interrupt();
      this.lekProcess = null;
    }
    
    // Interrupt any child agents of the coordinator
    if (this.coordinatorAgent) {
      const childAgents = this.coordinatorAgent.listChildAgents();
      for (const childAgent of childAgents) {
        try {
          await childAgent.terminate();
        } catch (error) {
          console.error(`[AttentiveAutonomy] Error terminating child agent ${childAgent.id}:`, error);
        }
      }
    }
  }

  private notifyModeChange(mode: SystemMode): void {
    this.modeChangeCallbacks.forEach(callback => {
      try {
        callback(mode);
      } catch (error) {
        console.error('[AttentiveAutonomy] Error in mode change callback:', error);
      }
    });
  }
}

/**
 * Creative Exploration ("Lek") Process
 * Implements autonomous exploration of RAGs to generate new associative ideas
 */
export class LekProcess {
  private agent: CognitiveAgent;
  private config: LekConfiguration;
  private status: LekProcessStatus;
  private startTime: Date;
  private explorationResults: ExplorationResult[] = [];
  private interrupted = false;

  constructor(agent: CognitiveAgent, config: LekConfiguration) {
    this.agent = agent;
    this.config = config;
    this.status = 'idle';
    this.startTime = new Date();
  }

  /**
   * Start the Lek exploration process
   */
  async start(): Promise<void> {
    if (this.status !== 'idle') {
      throw new Error('Lek process already started');
    }

    this.status = 'running';
    this.startTime = new Date();
    
    console.log('[Lek] Starting Creative Exploration process');
    
    try {
      // Run exploration within time and resource limits
      await this.runExploration();
      
      if (!this.interrupted) {
        this.status = 'completed';
        console.log(`[Lek] Exploration completed with ${this.explorationResults.length} results`);
      }
    } catch (error) {
      this.status = 'error';
      console.error('[Lek] Exploration failed:', error);
      throw error;
    }
  }

  /**
   * Interrupt the exploration process
   */
  async interrupt(): Promise<void> {
    this.interrupted = true;
    this.status = 'interrupted';
    console.log('[Lek] Exploration process interrupted');
  }

  /**
   * Get current process status
   */
  getStatus(): LekProcessStatus {
    return this.status;
  }

  /**
   * Get exploration results
   */
  getResults(): ExplorationResult[] {
    return [...this.explorationResults];
  }

  // Private methods

  private async runExploration(): Promise<void> {
    const endTime = this.startTime.getTime() + this.config.max_exploration_time;
    let llmCallsUsed = 0;
    let computeUnitsUsed = 0;

    while (
      Date.now() < endTime && 
      !this.interrupted &&
      llmCallsUsed < this.config.resource_budget.max_llm_calls &&
      computeUnitsUsed < this.config.resource_budget.max_compute_units
    ) {
      try {
        // Explore each focus area
        for (const focusArea of this.config.focus_areas) {
          if (this.interrupted) break;
          
          const result = await this.exploreArea(focusArea);
          if (result) {
            this.explorationResults.push(result);
            llmCallsUsed += result.resourceUsage.llmCalls;
            computeUnitsUsed += result.resourceUsage.computeUnits;
          }
          
          // Check if we should continue
          if (this.interrupted || 
              llmCallsUsed >= this.config.resource_budget.max_llm_calls ||
              computeUnitsUsed >= this.config.resource_budget.max_compute_units) {
            break;
          }
          
          // Small delay between explorations (shorter for testing)
          await this.sleep(100);
        }
        
        // Check limits again before next cycle
        if (llmCallsUsed >= this.config.resource_budget.max_llm_calls ||
            computeUnitsUsed >= this.config.resource_budget.max_compute_units) {
          break;
        }
        
        // Shorter delay between exploration cycles
        await this.sleep(500);
      } catch (error) {
        console.error('[Lek] Error during exploration cycle:', error);
        // Continue with next cycle unless interrupted
        if (this.interrupted) break;
      }
    }
  }

  private async exploreArea(focusArea: string): Promise<ExplorationResult | null> {
    const startTime = Date.now();
    
    try {
      // Simulate exploration based on focus area
      let insight: string;
      let associations: string[] = [];
      
      switch (focusArea) {
        case 'memory_associations':
          insight = await this.exploreMemoryAssociations();
          associations = ['memory_link_1', 'memory_link_2'];
          break;
        case 'thematic_connections':
          insight = await this.exploreThematicConnections();
          associations = ['theme_connection_1', 'theme_connection_2'];
          break;
        case 'creative_insights':
          insight = await this.exploreCreativeInsights();
          associations = ['creative_pattern_1', 'creative_pattern_2'];
          break;
        default:
          insight = `Explored ${focusArea}`;
          break;
      }
      
      const executionTime = Date.now() - startTime;
      
      return {
        focusArea,
        insight,
        associations,
        confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0 confidence
        resourceUsage: {
          llmCalls: 1,
          computeUnits: Math.ceil(executionTime / 1000),
          executionTime
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`[Lek] Error exploring ${focusArea}:`, error);
      return null;
    }
  }

  private async exploreMemoryAssociations(): Promise<string> {
    // Simulate memory association exploration (shorter for testing)
    await this.sleep(50); // Simulate processing time
    return 'Discovered new connections between recent conversations and stored memories';
  }

  private async exploreThematicConnections(): Promise<string> {
    // Simulate thematic connection exploration (shorter for testing)
    await this.sleep(50);
    return 'Identified recurring themes across different user interactions';
  }

  private async exploreCreativeInsights(): Promise<string> {
    // Simulate creative insight generation (shorter for testing)
    await this.sleep(50);
    return 'Generated novel perspective on user patterns and preferences';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Lek process status
 */
export type LekProcessStatus = 'idle' | 'running' | 'completed' | 'interrupted' | 'error';

/**
 * Result from exploration process
 */
export interface ExplorationResult {
  /** Focus area that was explored */
  focusArea: string;
  
  /** Generated insight */
  insight: string;
  
  /** New associations discovered */
  associations: string[];
  
  /** Confidence in the result */
  confidence: number;
  
  /** Resource usage for this exploration */
  resourceUsage: {
    llmCalls: number;
    computeUnits: number;
    executionTime: number;
  };
  
  /** Timestamp of result */
  timestamp: Date;
}

/**
 * Simple user activity detector implementation
 */
export class SimpleUserActivityDetector implements UserActivityDetector {
  private hasInput = false;
  private latestInput: any = null;
  private callbacks: ((input: any) => void)[] = [];

  async hasUserInput(): Promise<boolean> {
    return this.hasInput;
  }

  async getLatestInput(): Promise<any> {
    return this.latestInput;
  }

  onUserInput(callback: (input: any) => void): void {
    this.callbacks.push(callback);
  }

  clearUserInput(): void {
    this.hasInput = false;
    this.latestInput = null;
  }

  // Method to simulate user input (for testing)
  simulateUserInput(input: any): void {
    this.hasInput = true;
    this.latestInput = input;
    
    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(input);
      } catch (error) {
        console.error('Error in user input callback:', error);
      }
    });
  }
}

// Export singleton instance
export const attentiveAutonomySystem = new AttentiveAutonomySystem(
  new SimpleUserActivityDetector()
);