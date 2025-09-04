import { 
  CognitiveAgent,
  AgentStatus,
  ConfigurationProfile, 
  ContextThread, 
  UserInput, 
  AgentResponse, 
  UserState, 
  AgentState, 
  RelationalDelta,
  AgentRole,
  CognitivePhase,
  ResourceBudget
} from '@/types';
import { 
  resourceGovernor, 
  ResourceApprovalRequest,
  ResourceApprovalResponse 
} from './resource-governor';
import { llmService, LLMRequest } from './llm-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Universal CognitiveAgent implementation
 * All intelligence in the system flows through this single class
 */
export class CognitiveAgentImpl implements CognitiveAgent {
  public readonly id: string;
  public readonly role: AgentRole;
  public readonly configurationProfile: ConfigurationProfile;
  public readonly contextThread: ContextThread;
  public currentPhase: CognitivePhase;
  public currentState: AgentState;
  public readonly parentAgentId?: string;
  public readonly childAgents: Map<string, CognitiveAgent>;
  
  private _active: boolean = true;
  private _resourceUsage = {
    llmCalls: 0,
    computeUnits: 0,
    storageBytes: 0,
    executionTime: 0
  };
  private _lastActivity: Date;

  constructor(
    role: AgentRole,
    configurationProfile: ConfigurationProfile,
    contextThread: ContextThread,
    parentAgentId?: string
  ) {
    this.id = uuidv4();
    this.role = role;
    this.configurationProfile = configurationProfile;
    this.contextThread = contextThread;
    this.parentAgentId = parentAgentId;
    this.childAgents = new Map();
    
    // Initialize with entry phase from configuration
    this.currentPhase = configurationProfile.entry_phase;
    
    // Initialize agent state
    this.currentState = {
      cognitive_phase: this.currentPhase,
      resonance: 0.5, // Neutral starting resonance
      confidence: 0.7, // Moderate starting confidence
      timestamp: new Date()
    };
    
    this._lastActivity = new Date();
  }

  /**
   * Process user input through the cognitive pipeline
   */
  async processInput(input: UserInput): Promise<AgentResponse> {
    this._updateActivity();
    
    try {
      // Execute the Roundabout cognitive loop
      await this.executeRoundaboutLoop();
      
      // Calculate relational delta if we have user state context
      let relationalDelta: RelationalDelta | undefined;
      if (input.context?.userState) {
        relationalDelta = this.calculateRelationalDelta(input.context.userState);
      }
      
      // Generate response based on current phase and role
      const response = await this._generateResponse(input, relationalDelta);
      
      // Update resource usage
      this._resourceUsage.llmCalls++;
      this._resourceUsage.computeUnits += this._estimateComputeUnits(input);
      
      return response;
    } catch (error) {
      // Failure triggers ADAPT phase
      this.currentPhase = 'ADAPT';
      this._updateAgentState();
      
      throw error;
    }
  }

  /**
   * Execute the Roundabout cognitive loop
   * EMERGE -> ADAPT -> INTEGRATE sequence
   */
  async executeRoundaboutLoop(): Promise<void> {
    this._updateActivity();
    
    try {
      switch (this.currentPhase) {
        case 'EMERGE':
          await this._executeEmergePhase();
          break;
        case 'ADAPT':
          await this._executeAdaptPhase();
          break;
        case 'INTEGRATE':
          await this._executeIntegratePhase();
          break;
      }
    } catch (error) {
      // Any failure in the loop triggers ADAPT phase (unless already in ADAPT)
      if (this.currentPhase !== 'ADAPT') {
        this.currentPhase = 'ADAPT';
        this._updateAgentState();
      }
      throw error;
    }
    
    this._updateAgentState();
  }

  /**
   * Clone this agent to create a child agent for delegation
   */
  async clone(childConfig: ConfigurationProfile, taskDefinition: string): Promise<CognitiveAgent> {
    this._updateActivity();
    
    // Create child context thread first for resource estimation
    const childContextThread: ContextThread = {
      id: uuidv4(),
      top_level_goal: this.contextThread.top_level_goal,
      parent_agent_id: this.id,
      task_definition: taskDefinition,
      configuration_profile: childConfig,
      memory_scope: childConfig.memory_scope,
      resource_budget: childConfig.resource_budget || this._deriveChildResourceBudget(),
      recursion_depth: this.contextThread.recursion_depth + 1,
      workspace_branch: this.contextThread.workspace_branch,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Request approval from Resource Governor
    const approvalRequest: ResourceApprovalRequest = {
      operation: 'clone_agent',
      requestingAgentId: this.id,
      estimatedCost: {
        llmCalls: 10, // Estimated LLM calls for child agent
        computeUnits: 50, // Estimated compute units
        storageBytes: 1024, // Estimated storage usage
        executionTime: 30000 // Estimated execution time (30 seconds)
      },
      contextThread: childContextThread,
      parameters: {
        childRole: 'Core',
        taskDefinition
      }
    };
    
    const approval = await resourceGovernor.requestApproval(approvalRequest);
    
    if (!approval.approved) {
      const error = new Error(`Agent cloning denied: ${approval.reason}`);
      resourceGovernor.recordError(this.id, error.message);
      throw error;
    }
    
    try {
      // Create child agent
      const childAgent = new CognitiveAgentImpl(
        'Core', // Child agents are typically Core role
        childConfig,
        childContextThread,
        this.id
      );
      
      // Register child agent
      this.childAgents.set(childAgent.id, childAgent);
      
      // Update resource usage
      await resourceGovernor.updateResourceUsage(this.id, {
        max_llm_calls: approvalRequest.estimatedCost.llmCalls || 0,
        max_compute_units: approvalRequest.estimatedCost.computeUnits || 0,
        max_storage_bytes: approvalRequest.estimatedCost.storageBytes || 0,
        max_execution_time: approvalRequest.estimatedCost.executionTime || 0
      });
      
      this._logChildAgentCreated(childAgent.id, taskDefinition);
      
      return childAgent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown cloning error';
      resourceGovernor.recordError(this.id, errorMessage);
      throw error;
    }
  }

  /**
   * Calculate relational delta with user state
   */
  calculateRelationalDelta(userState: UserState): RelationalDelta {
    const timeDiff = Math.abs(this.currentState.timestamp.getTime() - userState.timestamp.getTime());
    const temporalWeight = Math.exp(-timeDiff / (1000 * 60 * 5)); // 5-minute decay
    
    // Calculate asynchronous delta (misunderstanding)
    const cognitiveAlignment = this._calculateCognitiveAlignment(userState);
    const asynchronous_delta = (1 - cognitiveAlignment) * temporalWeight;
    
    // Calculate synchronous delta (harmony)
    const emotionalResonance = this.currentState.resonance;
    const synchronous_delta = emotionalResonance * temporalWeight;
    
    // Overall magnitude
    const magnitude = Math.sqrt(asynchronous_delta ** 2 + synchronous_delta ** 2);
    
    // Determine strategy
    let strategy: 'mirror' | 'harmonize' | 'listen';
    if (userState.fight > 0.7 || userState.flight > 0.7) {
      strategy = 'listen';
    } else if (asynchronous_delta > 0.6) {
      strategy = 'mirror';
    } else {
      strategy = 'harmonize';
    }
    
    return {
      asynchronous_delta,
      synchronous_delta,
      magnitude,
      strategy
    };
  }

  /**
   * Update agent state based on interaction
   */
  updateState(newState: Partial<AgentState>): void {
    this.currentState = {
      ...this.currentState,
      ...newState,
      timestamp: new Date()
    };
    this._updateActivity();
  }

  /**
   * Terminate this agent and clean up resources
   */
  async terminate(): Promise<void> {
    this._active = false;
    
    // Terminate all child agents and collect their reports
    const childAgentArray = Array.from(this.childAgents.values());
    const childReports: ChildAgentReport[] = [];
    
    for (const childAgent of childAgentArray) {
      try {
        const report = await this._collectChildAgentReport(childAgent);
        childReports.push(report);
        await childAgent.terminate();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown termination error';
        resourceGovernor.recordError(this.id, `Child agent termination failed: ${errorMessage}`);
      }
    }
    
    this.childAgents.clear();
    
    // Report to parent if this is a child agent
    if (this.parentAgentId) {
      await this._reportToParent(childReports);
    }
    
    // Remove from resource governor tracking
    resourceGovernor.removeAgent(this.id);
    
    this._logAgentTerminated(childReports);
  }

  /**
   * Get child agent by ID
   */
  getChildAgent(childId: string): CognitiveAgent | null {
    return this.childAgents.get(childId) || null;
  }

  /**
   * List all child agents
   */
  listChildAgents(): CognitiveAgent[] {
    return Array.from(this.childAgents.values());
  }

  /**
   * Get child agent status reports
   */
  async getChildAgentReports(): Promise<ChildAgentReport[]> {
    const reports: ChildAgentReport[] = [];
    
    for (const childAgent of Array.from(this.childAgents.values())) {
      try {
        const report = await this._collectChildAgentReport(childAgent);
        reports.push(report);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reports.push({
          childId: childAgent.id,
          taskDefinition: childAgent.contextThread.task_definition,
          status: 'error',
          result: null,
          error: errorMessage,
          resourceUsage: childAgent.getStatus().resourceUsage,
          executionTime: Date.now() - childAgent.contextThread.created_at.getTime(),
          timestamp: new Date()
        });
      }
    }
    
    return reports;
  }

  /**
   * Remove completed child agent and get its report
   */
  async removeChildAgent(childId: string): Promise<ChildAgentReport | null> {
    const childAgent = this.childAgents.get(childId);
    if (!childAgent) {
      return null;
    }
    
    try {
      const report = await this._collectChildAgentReport(childAgent);
      await childAgent.terminate();
      this.childAgents.delete(childId);
      
      this._logChildAgentRemoved(childId, report);
      
      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      resourceGovernor.recordError(this.id, `Child agent removal failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get current status and metrics
   */
  getStatus(): AgentStatus {
    return {
      id: this.id,
      phase: this.currentPhase,
      active: this._active,
      childCount: this.childAgents.size,
      resourceUsage: { ...this._resourceUsage },
      lastActivity: this._lastActivity
    };
  }

  // Private helper methods

  private async _executeEmergePhase(): Promise<void> {
    // EMERGE phase: Attempt to achieve closure
    const emergenceResult = await this._attemptClosure();
    
    if (!emergenceResult.success) {
      // Failure triggers mandatory ADAPT phase transition
      this.currentPhase = 'ADAPT';
      this._logFailure('EMERGE', emergenceResult.error || 'Unknown error');
      throw new Error(`EMERGE phase failed: ${emergenceResult.error || 'Unknown error'}`);
    }
    
    // Success: remain in EMERGE phase for next iteration
    this._logSuccess('EMERGE', emergenceResult.result || 'Success');
  }

  private async _executeAdaptPhase(): Promise<void> {
    // ADAPT phase: Analyze failure and make strategic decision
    const failureAnalysis = await this._analyzeFailure();
    const strategicDecision = await this._makeStrategicDecision(failureAnalysis);
    
    this._logAdaptDecision(strategicDecision, failureAnalysis);
    
    if (strategicDecision.decision === 'PROCEED') {
      this.currentPhase = 'INTEGRATE';
      this._storeAdaptationContext(strategicDecision.context);
    } else {
      // HALT_AND_REPORT_FAILURE
      const errorMessage = `Agent halted: ${strategicDecision.reason}`;
      this._logFailure('ADAPT', errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async _executeIntegratePhase(): Promise<void> {
    // INTEGRATE phase: Create new tactical plan based on adaptation context
    const adaptationContext = this._getAdaptationContext();
    const newTacticalPlan = await this._createTacticalPlan(adaptationContext);
    
    if (!newTacticalPlan.isValid) {
      throw new Error(`Failed to create valid tactical plan: ${newTacticalPlan.error}`);
    }
    
    // Store the new plan and return to EMERGE phase
    this._storeTacticalPlan(newTacticalPlan);
    this.currentPhase = 'EMERGE';
    this._logSuccess('INTEGRATE', 'New tactical plan created successfully');
  }



  private async _makeStrategicDecision(failureAnalysis: FailureAnalysis): Promise<StrategicDecision> {
    // Strategic decision logic: HALT_AND_REPORT_FAILURE vs PROCEED
    const resourcesRemaining = this._checkResourcesRemaining();
    const failureHistory = this._getFailureHistory();
    
    // Decision factors
    const factors = {
      resourcesAvailable: resourcesRemaining,
      failureCount: failureHistory.length,
      failureSeverity: failureAnalysis.severity,
      failureType: failureAnalysis.type,
      recursionDepth: this.contextThread.recursion_depth,
      timeElapsed: Date.now() - this.contextThread.created_at.getTime()
    };
    
    // Strategic decision rules
    if (!factors.resourcesAvailable) {
      return {
        decision: 'HALT_AND_REPORT_FAILURE',
        reason: 'Insufficient resources remaining',
        context: factors
      };
    }
    
    if (factors.failureCount >= 3 && failureAnalysis.severity === 'critical') {
      return {
        decision: 'HALT_AND_REPORT_FAILURE',
        reason: 'Multiple critical failures detected',
        context: factors
      };
    }
    
    if (factors.recursionDepth >= (this.configurationProfile.max_recursion_depth || 5) - 1) {
      return {
        decision: 'HALT_AND_REPORT_FAILURE',
        reason: 'Near maximum recursion depth',
        context: factors
      };
    }
    
    if (factors.timeElapsed > (this.contextThread.resource_budget.max_execution_time * 0.8)) {
      return {
        decision: 'HALT_AND_REPORT_FAILURE',
        reason: 'Approaching execution time limit',
        context: factors
      };
    }
    
    // Proceed if we can adapt
    return {
      decision: 'PROCEED',
      reason: 'Failure is recoverable with new approach',
      context: factors
    };
  }

  private async _createTacticalPlan(adaptationContext?: any): Promise<TacticalPlan> {
    // Create new tactical plan based on failure analysis and adaptation context
    this._resourceUsage.computeUnits += 5;
    
    try {
      const currentPlan = this._getCurrentTacticalPlan();
      const failureHistory = this._getFailureHistory();
      
      // Generate new approach based on previous failures
      const newApproach = this._generateNewApproach(currentPlan, failureHistory, adaptationContext);
      
      return {
        id: uuidv4(),
        approach: newApproach,
        createdAt: new Date(),
        isValid: true,
        confidence: this._calculatePlanConfidence(newApproach, failureHistory)
      };
    } catch (error) {
      return {
        id: uuidv4(),
        approach: null,
        createdAt: new Date(),
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error creating tactical plan'
      };
    }
  }

  private async _generateResponse(input: UserInput, relationalDelta?: RelationalDelta): Promise<AgentResponse> {
    // Generate response based on role and current state
    let responseText = '';
    
    switch (this.role) {
      case 'Coordinator':
        responseText = `Coordinator agent processing: ${input.text}`;
        break;
      case 'Conscious':
        responseText = this._generateConsciousResponse(input, relationalDelta);
        break;
      case 'Core':
        responseText = `Core agent executing task: ${input.text}`;
        break;
    }
    
    return {
      text: responseText,
      type: 'message',
      agent_state: { ...this.currentState },
      timestamp: new Date()
    };
  }

  private _generateConsciousResponse(input: UserInput, relationalDelta?: RelationalDelta): string {
    if (relationalDelta) {
      switch (relationalDelta.strategy) {
        case 'mirror':
          return `I understand you're feeling ${this._interpretUserEmotion(input)}. Let me reflect that back to you.`;
        case 'listen':
          return `I'm here to listen. Please tell me more about what you're experiencing.`;
        case 'harmonize':
          return `I hear you, and I'd like to help guide us toward a solution together.`;
      }
    }
    
    return `I'm processing your input: ${input.text}`;
  }

  private _interpretUserEmotion(input: UserInput): string {
    // Simple emotion interpretation based on input
    if (input.text.toLowerCase().includes('angry') || input.text.includes('!')) {
      return 'frustrated';
    } else if (input.text.toLowerCase().includes('sad') || input.text.toLowerCase().includes('worried')) {
      return 'concerned';
    } else {
      return 'engaged';
    }
  }

  private _calculateCognitiveAlignment(userState: UserState): number {
    // Calculate how well agent's cognitive phase aligns with user needs
    const userProblemSolving = userState.fixes;
    const agentProblemSolving = this.currentState.confidence;
    
    return 1 - Math.abs(userProblemSolving - agentProblemSolving);
  }

  private _checkResourcesRemaining(): boolean {
    const budget = this.contextThread.resource_budget;
    return (
      this._resourceUsage.llmCalls < budget.max_llm_calls &&
      this._resourceUsage.computeUnits < budget.max_compute_units &&
      this._resourceUsage.storageBytes < budget.max_storage_bytes
    );
  }

  private _estimateComputeUnits(input: UserInput): number {
    // Estimate compute units based on input complexity
    return Math.max(1, Math.floor(input.text.length / 100));
  }

  private _updateActivity(): void {
    this._lastActivity = new Date();
  }

  private _updateAgentState(): void {
    this.currentState = {
      ...this.currentState,
      cognitive_phase: this.currentPhase,
      timestamp: new Date()
    };
  }

  // Enhanced Roundabout loop support methods

  private async _attemptClosure(): Promise<EmergenceResult> {
    try {
      // Role-specific emergence logic
      switch (this.role) {
        case 'Coordinator':
          return await this._coordinatorEmerge();
        case 'Conscious':
          return await this._consciousEmerge();
        case 'Core':
          return await this._coreEmerge();
        default:
          throw new Error(`Unknown agent role: ${this.role}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown emergence error'
      };
    }
  }

  private async _coordinatorEmerge(): Promise<EmergenceResult> {
    // Coordinator-specific emergence logic using LLM
    this._resourceUsage.computeUnits += 10;
    
    try {
      // Use fast, free LLM for coordination tasks
      const provider = llmService.getBestProvider({ 
        speed: 'ultra-fast', 
        cost: 'free', 
        capability: 'chat' 
      });

      const llmRequest: LLMRequest = {
        messages: [
          {
            role: 'system',
            content: `You are a Coordinator cognitive agent. Your task is to coordinate and manage sub-tasks effectively. 
                     Current context: ${this.contextThread.task_definition}
                     Goal: ${this.contextThread.top_level_goal}
                     
                     Analyze the current situation and determine if coordination tasks can be completed successfully.
                     Respond with either "SUCCESS: [brief explanation]" or "FAILURE: [brief explanation]"`
          },
          {
            role: 'user',
            content: `Please coordinate the following task: ${this.contextThread.task_definition}`
          }
        ],
        maxTokens: 150,
        temperature: 0.3,
        provider
      };

      const response = await llmService.chat(llmRequest);
      this._resourceUsage.llmCalls++;

      if (response.content.toUpperCase().startsWith('SUCCESS')) {
        return {
          success: true,
          result: response.content.replace(/^SUCCESS:\s*/i, '')
        };
      } else {
        return {
          success: false,
          error: response.content.replace(/^FAILURE:\s*/i, '')
        };
      }
    } catch (error) {
      // Fallback to simple logic if LLM fails
      const successProbability = this._calculateSuccessProbability();
      if (Math.random() < successProbability) {
        return {
          success: true,
          result: 'Coordination tasks completed successfully'
        };
      } else {
        return {
          success: false,
          error: 'Failed to coordinate sub-tasks effectively'
        };
      }
    }
  }

  private async _consciousEmerge(): Promise<EmergenceResult> {
    // Conscious-specific emergence logic
    this._resourceUsage.computeUnits += 5;
    
    const successProbability = this._calculateSuccessProbability();
    if (Math.random() < successProbability) {
      return {
        success: true,
        result: 'User interaction handled successfully'
      };
    } else {
      return {
        success: false,
        error: 'Failed to establish proper user connection'
      };
    }
  }

  private async _coreEmerge(): Promise<EmergenceResult> {
    // Core-specific emergence logic
    this._resourceUsage.computeUnits += 3;
    
    const successProbability = this._calculateSuccessProbability();
    if (Math.random() < successProbability) {
      return {
        success: true,
        result: 'Core task executed successfully'
      };
    } else {
      return {
        success: false,
        error: 'Core task execution failed'
      };
    }
  }

  private async _analyzeFailure(): Promise<FailureAnalysis> {
    const failureHistory = this._getFailureHistory();
    const lastFailure = failureHistory[failureHistory.length - 1];
    
    // Analyze failure patterns and severity
    let severity: 'minor' | 'moderate' | 'critical' = 'minor';
    let type: 'resource' | 'logic' | 'external' | 'timeout' = 'logic';
    
    if (failureHistory.length >= 3) {
      severity = 'critical';
    } else if (failureHistory.length >= 2) {
      severity = 'moderate';
    }
    
    // Determine failure type based on error patterns
    if (lastFailure?.error.includes('resource') || lastFailure?.error.includes('quota')) {
      type = 'resource';
    } else if (lastFailure?.error.includes('timeout') || lastFailure?.error.includes('time')) {
      type = 'timeout';
    } else if (lastFailure?.error.includes('external') || lastFailure?.error.includes('API')) {
      type = 'external';
    }
    
    return {
      severity,
      type,
      pattern: this._identifyFailurePattern(failureHistory),
      recommendation: this._generateFailureRecommendation(severity, type)
    };
  }

  private _calculateSuccessProbability(): number {
    const failureHistory = this._getFailureHistory();
    const baseSuccess = 0.7; // 70% base success rate
    const failurePenalty = failureHistory.length * 0.1; // 10% penalty per failure
    const resourceBonus = this._checkResourcesRemaining() ? 0.1 : -0.2;
    
    return Math.max(0.1, Math.min(0.9, baseSuccess - failurePenalty + resourceBonus));
  }

  private _getFailureHistory(): FailureRecord[] {
    // In a real implementation, this would retrieve from persistent storage
    // For now, simulate based on resource usage as a proxy
    const failures: FailureRecord[] = [];
    const failureCount = Math.floor(this._resourceUsage.llmCalls / 10); // Simulate failures
    
    for (let i = 0; i < failureCount; i++) {
      failures.push({
        phase: 'EMERGE',
        error: `Simulated failure ${i + 1}`,
        timestamp: new Date(Date.now() - (failureCount - i) * 60000) // 1 minute apart
      });
    }
    
    return failures;
  }

  private _identifyFailurePattern(failures: FailureRecord[]): string {
    if (failures.length === 0) return 'none';
    if (failures.length === 1) return 'isolated';
    
    // Check for recurring patterns
    const phases = failures.map(f => f.phase);
    const uniquePhases = new Set(phases);
    
    if (uniquePhases.size === 1) {
      return `recurring-${phases[0].toLowerCase()}`;
    } else {
      return 'mixed-phase';
    }
  }

  private _generateFailureRecommendation(severity: string, type: string): string {
    const recommendations = {
      'minor-logic': 'Retry with adjusted parameters',
      'minor-resource': 'Optimize resource usage',
      'minor-external': 'Implement retry with backoff',
      'minor-timeout': 'Increase timeout limits',
      'moderate-logic': 'Revise approach strategy',
      'moderate-resource': 'Request additional resources',
      'moderate-external': 'Switch to alternative service',
      'moderate-timeout': 'Break task into smaller chunks',
      'critical-logic': 'Escalate to parent agent',
      'critical-resource': 'Halt and report resource exhaustion',
      'critical-external': 'Activate fallback mode',
      'critical-timeout': 'Abort current approach'
    };
    
    return recommendations[`${severity}-${type}` as keyof typeof recommendations] || 'Unknown recommendation';
  }

  private _logFailure(phase: string, error: string): void {
    // In a real implementation, this would log to persistent storage
    console.log(`[${this.id}] FAILURE in ${phase}: ${error}`);
  }

  private _logSuccess(phase: string, result: string): void {
    // In a real implementation, this would log to persistent storage
    console.log(`[${this.id}] SUCCESS in ${phase}: ${result}`);
  }

  private _logAdaptDecision(decision: StrategicDecision, analysis: FailureAnalysis): void {
    console.log(`[${this.id}] ADAPT decision: ${decision.decision} - ${decision.reason}`);
    console.log(`[${this.id}] Failure analysis: ${analysis.severity} ${analysis.type} - ${analysis.recommendation}`);
  }

  private _storeAdaptationContext(context: any): void {
    // Store context for use in INTEGRATE phase
    (this as any)._adaptationContext = context;
  }

  private _getAdaptationContext(): any {
    return (this as any)._adaptationContext || {};
  }

  private _storeTacticalPlan(plan: TacticalPlan): void {
    (this as any)._currentTacticalPlan = plan;
  }

  private _getCurrentTacticalPlan(): TacticalPlan | null {
    return (this as any)._currentTacticalPlan || null;
  }

  private _generateNewApproach(currentPlan: TacticalPlan | null, failures: FailureRecord[], context: any): string {
    // Generate new approach based on failure analysis
    const failureTypes = failures.map(f => f.error);
    const hasResourceFailures = failureTypes.some(e => e.includes('resource'));
    const hasLogicFailures = failureTypes.some(e => e.includes('logic') || e.includes('execution'));
    
    if (hasResourceFailures) {
      return 'resource-optimized-approach';
    } else if (hasLogicFailures) {
      return 'alternative-logic-approach';
    } else {
      return 'conservative-retry-approach';
    }
  }

  private _calculatePlanConfidence(approach: string, failures: FailureRecord[]): number {
    const baseConfidence = 0.6;
    const failurePenalty = failures.length * 0.1;
    const approachBonus = approach.includes('optimized') ? 0.2 : 0.1;
    
    return Math.max(0.1, Math.min(0.9, baseConfidence - failurePenalty + approachBonus));
  }

  // Child agent lifecycle management methods

  private _deriveChildResourceBudget(): ResourceBudget {
    // Allocate a portion of parent's remaining budget to child
    const parentBudget = this.contextThread.resource_budget;
    const parentUsage = this._resourceUsage;
    
    const remainingBudget = {
      max_llm_calls: Math.max(0, parentBudget.max_llm_calls - parentUsage.llmCalls),
      max_compute_units: Math.max(0, parentBudget.max_compute_units - parentUsage.computeUnits),
      max_storage_bytes: Math.max(0, parentBudget.max_storage_bytes - parentUsage.storageBytes),
      max_execution_time: Math.max(0, parentBudget.max_execution_time - parentUsage.executionTime)
    };
    
    // Allocate 30% of remaining budget to child
    const allocationRatio = 0.3;
    
    return {
      max_llm_calls: Math.floor(remainingBudget.max_llm_calls * allocationRatio),
      max_compute_units: Math.floor(remainingBudget.max_compute_units * allocationRatio),
      max_storage_bytes: Math.floor(remainingBudget.max_storage_bytes * allocationRatio),
      max_execution_time: Math.floor(remainingBudget.max_execution_time * allocationRatio)
    };
  }

  private async _collectChildAgentReport(childAgent: CognitiveAgent): Promise<ChildAgentReport> {
    try {
      const status = childAgent.getStatus();
      const executionTime = Date.now() - childAgent.contextThread.created_at.getTime();
      
      // Determine child agent status
      let reportStatus: 'completed' | 'failed' | 'running' | 'error';
      let result: any = null;
      let error: string | null = null;
      
      if (!status.active) {
        reportStatus = 'completed';
        result = await this._extractChildAgentResult(childAgent);
      } else if (status.phase === 'ADAPT' && this._hasRepeatedFailures(childAgent)) {
        reportStatus = 'failed';
        error = 'Child agent stuck in ADAPT phase with repeated failures';
      } else if (status.active) {
        reportStatus = 'running';
      } else {
        reportStatus = 'error';
        error = 'Child agent in unknown state';
      }
      
      return {
        childId: childAgent.id,
        taskDefinition: childAgent.contextThread.task_definition,
        status: reportStatus,
        result,
        error,
        resourceUsage: status.resourceUsage,
        executionTime,
        timestamp: new Date()
      };
    } catch (error) {
      // Handle errors in status retrieval
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        childId: childAgent.id,
        taskDefinition: childAgent.contextThread.task_definition,
        status: 'error',
        result: null,
        error: errorMessage,
        resourceUsage: { llmCalls: 0, computeUnits: 0, storageBytes: 0, executionTime: 0 },
        executionTime: Date.now() - childAgent.contextThread.created_at.getTime(),
        timestamp: new Date()
      };
    }
  }

  private async _extractChildAgentResult(childAgent: CognitiveAgent): Promise<any> {
    // In a real implementation, this would extract the actual result
    // For now, return a summary based on the agent's final state
    const status = childAgent.getStatus();
    
    return {
      finalPhase: status.phase,
      resourcesUsed: status.resourceUsage,
      taskCompleted: !status.active,
      summary: `Child agent completed task: ${childAgent.contextThread.task_definition}`
    };
  }

  private _hasRepeatedFailures(childAgent: CognitiveAgent): boolean {
    // Simple heuristic: if agent has been in ADAPT phase for too long
    const status = childAgent.getStatus();
    const timeSinceLastActivity = Date.now() - status.lastActivity.getTime();
    
    return status.phase === 'ADAPT' && timeSinceLastActivity > 60000; // 1 minute
  }

  private async _reportToParent(childReports: ChildAgentReport[]): Promise<void> {
    // In a real implementation, this would send a report to the parent agent
    // For now, just log the report
    this._logParentReport(childReports);
  }

  // Logging methods for child agent lifecycle

  private _logChildAgentCreated(childId: string, taskDefinition: string): void {
    console.log(`[${this.id}] Created child agent ${childId} for task: ${taskDefinition}`);
  }

  private _logChildAgentRemoved(childId: string, report: ChildAgentReport): void {
    console.log(`[${this.id}] Removed child agent ${childId}, status: ${report.status}`);
  }

  private _logAgentTerminated(childReports: ChildAgentReport[]): void {
    console.log(`[${this.id}] Agent terminated with ${childReports.length} child reports`);
  }

  private _logParentReport(childReports: ChildAgentReport[]): void {
    console.log(`[${this.id}] Reporting to parent: ${childReports.length} child agent results`);
  }
}

// Supporting interfaces for enhanced Roundabout loop
interface EmergenceResult {
  success: boolean;
  result?: string;
  error?: string;
}

interface FailureAnalysis {
  severity: 'minor' | 'moderate' | 'critical';
  type: 'resource' | 'logic' | 'external' | 'timeout';
  pattern: string;
  recommendation: string;
}

interface StrategicDecision {
  decision: 'PROCEED' | 'HALT_AND_REPORT_FAILURE';
  reason: string;
  context: any;
}

interface TacticalPlan {
  id: string;
  approach: string | null;
  createdAt: Date;
  isValid: boolean;
  confidence?: number;
  error?: string;
}

interface FailureRecord {
  phase: 'EMERGE' | 'ADAPT' | 'INTEGRATE';
  error: string;
  timestamp: Date;
}

/**
 * Report from a child agent about its execution
 */
interface ChildAgentReport {
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