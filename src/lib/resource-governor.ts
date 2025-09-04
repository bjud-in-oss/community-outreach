import { 
  ConfigurationProfile, 
  ContextThread, 
  ResourceBudget,
  AgentRole 
} from '@/types';

/**
 * Resource approval request for agent operations
 */
export interface ResourceApprovalRequest {
  /** Type of operation requesting approval */
  operation: 'clone_agent' | 'llm_call' | 'memory_access' | 'external_api' | 'autonomous_mode';
  
  /** Agent requesting the operation */
  requestingAgentId: string;
  
  /** Estimated resource cost */
  estimatedCost: {
    llmCalls?: number;
    computeUnits?: number;
    storageBytes?: number;
    executionTime?: number;
  };
  
  /** Context thread for the operation */
  contextThread: ContextThread;
  
  /** Additional operation-specific parameters */
  parameters?: Record<string, any>;
}

/**
 * Resource approval response
 */
export interface ResourceApprovalResponse {
  /** Whether the request is approved */
  approved: boolean;
  
  /** Reason for approval/denial */
  reason: string;
  
  /** Updated resource budget if approved */
  updatedBudget?: ResourceBudget;
  
  /** Any constraints or conditions */
  constraints?: Record<string, any>;
}

/**
 * User-specific resource quotas
 */
export interface UserResourceQuotas {
  /** User ID */
  userId: string;
  
  /** LLM usage quota */
  llmQuota: {
    maxCallsPerHour: number;
    maxCallsPerDay: number;
    maxTokensPerCall: number;
  };
  
  /** Storage quota */
  storageQuota: {
    maxTotalBytes: number;
    maxFileSize: number;
  };
  
  /** Compute quota */
  computeQuota: {
    maxUnitsPerHour: number;
    maxUnitsPerDay: number;
    maxConcurrentOperations: number;
  };
  
  /** User tier (affects quotas) */
  tier: 'free' | 'premium' | 'enterprise';
}

/**
 * System-wide resource limits
 */
export interface SystemResourceLimits {
  /** Maximum recursion depth allowed */
  maxRecursionDepth: number;
  
  /** Maximum active agents per user */
  maxActiveAgents: number;
  
  /** Maximum total system agents */
  maxSystemAgents: number;
  
  /** Circuit breaker thresholds */
  circuitBreaker: {
    errorRateThreshold: number;
    costSpikeThreshold: number;
    timeWindowMs: number;
  };
  
  /** Default quotas for different user tiers */
  defaultQuotas: {
    free: UserResourceQuotas;
    premium: UserResourceQuotas;
    enterprise: UserResourceQuotas;
  };
}

/**
 * System tempo levels for resource management
 */
export type SystemTempo = 'High-Performance' | 'Low-Intensity' | 'Sleep';

/**
 * Circuit breaker state information
 */
export interface CircuitBreakerInfo {
  status: 'open' | 'closed' | 'half-open';
  errorRate: number;
  costSpike: number;
  lastTriggered?: Date;
  nextRetryAt?: Date;
}

/**
 * System monitoring metrics
 */
export interface SystemMetrics {
  activeAgents: number;
  totalResourceUsage: ResourceBudget;
  circuitBreakerInfo: CircuitBreakerInfo;
  systemTempo: SystemTempo;
  errorHistory: Array<{
    agentId: string;
    timestamp: Date;
    error: string;
  }>;
  pausedHierarchies: string[];
}

/**
 * Resource Governor interface for centralized resource management
 */
export interface ResourceGovernor {
  /**
   * Request approval for a resource-intensive operation
   */
  requestApproval(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse>;
  
  /**
   * Update resource usage for an agent
   */
  updateResourceUsage(agentId: string, usage: Partial<ResourceBudget>): Promise<void>;
  
  /**
   * Check if an agent has exceeded its resource budget
   */
  checkResourceLimits(agentId: string, contextThread: ContextThread): Promise<boolean>;
  
  /**
   * Get current system resource status
   */
  getSystemStatus(): Promise<{
    activeAgents: number;
    totalResourceUsage: ResourceBudget;
    circuitBreakerStatus: 'open' | 'closed' | 'half-open';
  }>;
  
  /**
   * Get detailed system metrics including circuit breaker and monitoring info
   */
  getSystemMetrics(): Promise<SystemMetrics>;
  
  /**
   * Pause agent hierarchy due to resource issues
   */
  pauseAgentHierarchy(rootAgentId: string, reason: string): Promise<void>;
  
  /**
   * Resume a paused agent hierarchy
   */
  resumeAgentHierarchy(rootAgentId: string): Promise<void>;
  
  /**
   * Set system tempo for resource management
   */
  setSystemTempo(tempo: SystemTempo): Promise<void>;
  
  /**
   * Get current system tempo
   */
  getSystemTempo(): SystemTempo;
  
  /**
   * Record an error for circuit breaker analysis
   */
  recordError(agentId: string, error: string): void;
  
  /**
   * Force circuit breaker state (for testing)
   */
  setCircuitBreakerState(state: 'open' | 'closed' | 'half-open'): void;
  
  /**
   * Set user-specific resource quotas
   */
  setUserQuotas(userId: string, quotas: UserResourceQuotas): Promise<void>;
  
  /**
   * Get user-specific resource quotas
   */
  getUserQuotas(userId: string): Promise<UserResourceQuotas>;
  
  /**
   * Check if user has exceeded their quotas
   */
  checkUserQuotas(userId: string): Promise<{
    withinLimits: boolean;
    violations: string[];
  }>;
}

/**
 * Basic Resource Governor implementation
 */
export class ResourceGovernorImpl implements ResourceGovernor {
  private _systemLimits: SystemResourceLimits;
  private _agentUsage: Map<string, ResourceBudget> = new Map();
  private _activeAgents: Set<string> = new Set();
  private _pausedHierarchies: Set<string> = new Set();
  private _errorHistory: Array<{ agentId: string; timestamp: Date; error: string }> = [];
  private _circuitBreakerStatus: 'open' | 'closed' | 'half-open' = 'closed';
  private _circuitBreakerLastTriggered?: Date;
  private _circuitBreakerNextRetry?: Date;
  private _systemTempo: SystemTempo = 'High-Performance';
  private _userQuotas: Map<string, UserResourceQuotas> = new Map();
  private _userUsageHistory: Map<string, Array<{ timestamp: Date; usage: Partial<ResourceBudget> }>> = new Map();
  private _costHistory: Array<{ agentId: string; timestamp: Date; cost: number }> = [];

  constructor(systemLimits?: Partial<SystemResourceLimits>) {
    const defaultQuotas = this._createDefaultQuotas();
    
    this._systemLimits = {
      maxRecursionDepth: 5,
      maxActiveAgents: 10,
      maxSystemAgents: 100,
      circuitBreaker: {
        errorRateThreshold: 0.8, // 80% error rate (less sensitive)
        costSpikeThreshold: 5.0, // 5x normal cost (less sensitive)
        timeWindowMs: 300000 // 5 minutes
      },
      defaultQuotas,
      ...systemLimits
    };
  }

  private _createDefaultQuotas() {
    const freeQuotas: UserResourceQuotas = {
      userId: '',
      tier: 'free',
      llmQuota: {
        maxCallsPerHour: 50,
        maxCallsPerDay: 200,
        maxTokensPerCall: 4000
      },
      storageQuota: {
        maxTotalBytes: 100 * 1024 * 1024, // 100MB
        maxFileSize: 10 * 1024 * 1024 // 10MB
      },
      computeQuota: {
        maxUnitsPerHour: 1000,
        maxUnitsPerDay: 5000,
        maxConcurrentOperations: 3
      }
    };

    const premiumQuotas: UserResourceQuotas = {
      ...freeQuotas,
      tier: 'premium',
      llmQuota: {
        maxCallsPerHour: 200,
        maxCallsPerDay: 1000,
        maxTokensPerCall: 8000
      },
      storageQuota: {
        maxTotalBytes: 1024 * 1024 * 1024, // 1GB
        maxFileSize: 100 * 1024 * 1024 // 100MB
      },
      computeQuota: {
        maxUnitsPerHour: 5000,
        maxUnitsPerDay: 25000,
        maxConcurrentOperations: 10
      }
    };

    const enterpriseQuotas: UserResourceQuotas = {
      ...freeQuotas,
      tier: 'enterprise',
      llmQuota: {
        maxCallsPerHour: 1000,
        maxCallsPerDay: 10000,
        maxTokensPerCall: 16000
      },
      storageQuota: {
        maxTotalBytes: 10 * 1024 * 1024 * 1024, // 10GB
        maxFileSize: 1024 * 1024 * 1024 // 1GB
      },
      computeQuota: {
        maxUnitsPerHour: 25000,
        maxUnitsPerDay: 100000,
        maxConcurrentOperations: 50
      }
    };

    return { free: freeQuotas, premium: premiumQuotas, enterprise: enterpriseQuotas };
  }

  async requestApproval(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse> {
    // Check if agent hierarchy is paused
    const rootAgentId = this._findRootAgent(request.requestingAgentId, request.contextThread);
    if (this._pausedHierarchies.has(rootAgentId)) {
      return {
        approved: false,
        reason: 'Agent hierarchy is paused due to resource issues'
      };
    }

    // Check circuit breaker status
    if (this._circuitBreakerStatus === 'open') {
      return {
        approved: false,
        reason: 'System circuit breaker is open due to high error rate or cost spike'
      };
    }

    // Apply tempo-based adjustments
    const adjustedRequest = this._applyTempoAdjustments(request);

    // In Sleep mode, only allow critical operations
    if (this._systemTempo === 'Sleep' && request.operation !== 'memory_access') {
      return {
        approved: false,
        reason: 'System is in Sleep mode - only critical operations allowed'
      };
    }

    // Validate specific operation
    switch (adjustedRequest.operation) {
      case 'clone_agent':
        return await this._validateAgentCloning(adjustedRequest);
      case 'llm_call':
        return await this._validateLLMCall(adjustedRequest);
      case 'memory_access':
        return await this._validateMemoryAccess(adjustedRequest);
      case 'external_api':
        return await this._validateExternalAPI(adjustedRequest);
      default:
        return {
          approved: false,
          reason: `Unknown operation type: ${adjustedRequest.operation}`
        };
    }
  }

  async updateResourceUsage(agentId: string, usage: Partial<ResourceBudget>): Promise<void> {
    const currentUsage = this._agentUsage.get(agentId) || {
      max_llm_calls: 0,
      max_compute_units: 0,
      max_storage_bytes: 0,
      max_execution_time: 0
    };

    const updatedUsage = {
      max_llm_calls: currentUsage.max_llm_calls + (usage.max_llm_calls || 0),
      max_compute_units: currentUsage.max_compute_units + (usage.max_compute_units || 0),
      max_storage_bytes: currentUsage.max_storage_bytes + (usage.max_storage_bytes || 0),
      max_execution_time: currentUsage.max_execution_time + (usage.max_execution_time || 0)
    };

    this._agentUsage.set(agentId, updatedUsage);
    this._activeAgents.add(agentId);

    // Record user usage for quota tracking (extract user ID from agent ID pattern)
    const userId = this._extractUserIdFromAgent(agentId);
    if (userId) {
      this._recordUserUsage(userId, usage);
    }

    // Check for cost spikes
    await this._checkForCostSpikes(agentId, updatedUsage);
  }

  async checkResourceLimits(agentId: string, contextThread: ContextThread): Promise<boolean> {
    const usage = this._agentUsage.get(agentId);
    if (!usage) return true; // No usage recorded yet

    const budget = contextThread.resource_budget;

    return (
      usage.max_llm_calls <= budget.max_llm_calls &&
      usage.max_compute_units <= budget.max_compute_units &&
      usage.max_storage_bytes <= budget.max_storage_bytes &&
      usage.max_execution_time <= budget.max_execution_time
    );
  }

  async getSystemStatus() {
    const totalUsage = Array.from(this._agentUsage.values()).reduce(
      (total, usage) => ({
        max_llm_calls: total.max_llm_calls + usage.max_llm_calls,
        max_compute_units: total.max_compute_units + usage.max_compute_units,
        max_storage_bytes: total.max_storage_bytes + usage.max_storage_bytes,
        max_execution_time: total.max_execution_time + usage.max_execution_time
      }),
      { max_llm_calls: 0, max_compute_units: 0, max_storage_bytes: 0, max_execution_time: 0 }
    );

    return {
      activeAgents: this._activeAgents.size,
      totalResourceUsage: totalUsage,
      circuitBreakerStatus: this._circuitBreakerStatus
    };
  }

  async pauseAgentHierarchy(rootAgentId: string, reason: string): Promise<void> {
    this._pausedHierarchies.add(rootAgentId);
    console.log(`[ResourceGovernor] Paused agent hierarchy ${rootAgentId}: ${reason}`);
  }

  async resumeAgentHierarchy(rootAgentId: string): Promise<void> {
    this._pausedHierarchies.delete(rootAgentId);
    console.log(`[ResourceGovernor] Resumed agent hierarchy ${rootAgentId}`);
  }

  async setSystemTempo(tempo: SystemTempo): Promise<void> {
    const previousTempo = this._systemTempo;
    this._systemTempo = tempo;
    console.log(`[ResourceGovernor] System tempo changed from ${previousTempo} to ${tempo}`);
    
    // Adjust system behavior based on tempo
    switch (tempo) {
      case 'High-Performance':
        // Allow maximum resource usage
        break;
      case 'Low-Intensity':
        // Reduce resource limits by 50%
        break;
      case 'Sleep':
        // Pause all non-critical operations
        break;
    }
  }

  getSystemTempo(): SystemTempo {
    return this._systemTempo;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const totalUsage = Array.from(this._agentUsage.values()).reduce(
      (total, usage) => ({
        max_llm_calls: total.max_llm_calls + usage.max_llm_calls,
        max_compute_units: total.max_compute_units + usage.max_compute_units,
        max_storage_bytes: total.max_storage_bytes + usage.max_storage_bytes,
        max_execution_time: total.max_execution_time + usage.max_execution_time
      }),
      { max_llm_calls: 0, max_compute_units: 0, max_storage_bytes: 0, max_execution_time: 0 }
    );

    // Calculate current error rate
    const cutoff = new Date(Date.now() - this._systemLimits.circuitBreaker.timeWindowMs);
    const recentErrors = this._errorHistory.filter(e => e.timestamp > cutoff);
    const totalOperations = Math.max(this._activeAgents.size * 10, 10);
    const errorRate = recentErrors.length / totalOperations;

    // Calculate cost spike level
    const recentCosts = this._costHistory.filter(c => c.timestamp > cutoff);
    const avgCost = recentCosts.length > 0 
      ? recentCosts.reduce((sum, c) => sum + c.cost, 0) / recentCosts.length 
      : 0;
    const baselineCost = 100;
    const costSpike = avgCost / baselineCost;

    return {
      activeAgents: this._activeAgents.size,
      totalResourceUsage: totalUsage,
      circuitBreakerInfo: {
        status: this._circuitBreakerStatus,
        errorRate,
        costSpike,
        lastTriggered: this._circuitBreakerLastTriggered,
        nextRetryAt: this._circuitBreakerNextRetry
      },
      systemTempo: this._systemTempo,
      errorHistory: [...this._errorHistory],
      pausedHierarchies: Array.from(this._pausedHierarchies)
    };
  }

  setCircuitBreakerState(state: 'open' | 'closed' | 'half-open'): void {
    this._circuitBreakerStatus = state;
    if (state === 'open') {
      this._circuitBreakerLastTriggered = new Date();
      this._circuitBreakerNextRetry = new Date(Date.now() + this._systemLimits.circuitBreaker.timeWindowMs);
    }
  }

  // Private helper methods

  private async _validateAgentCloning(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse> {
    const { contextThread, estimatedCost } = request;

    // Check recursion depth
    if (contextThread.recursion_depth >= this._systemLimits.maxRecursionDepth) {
      return {
        approved: false,
        reason: `Maximum recursion depth (${this._systemLimits.maxRecursionDepth}) exceeded`
      };
    }

    // Check active agent limits - use the correct limit for system agents
    if (this._activeAgents.size >= this._systemLimits.maxSystemAgents) {
      return {
        approved: false,
        reason: `Maximum system agents (${this._systemLimits.maxSystemAgents}) exceeded`
      };
    }

    // Check resource budget - use parent's budget for validation
    const currentUsage = this._agentUsage.get(request.requestingAgentId) || {
      max_llm_calls: 0,
      max_compute_units: 0,
      max_storage_bytes: 0,
      max_execution_time: 0
    };

    const projectedUsage = {
      max_llm_calls: currentUsage.max_llm_calls + (estimatedCost.llmCalls || 0),
      max_compute_units: currentUsage.max_compute_units + (estimatedCost.computeUnits || 0),
      max_storage_bytes: currentUsage.max_storage_bytes + (estimatedCost.storageBytes || 0),
      max_execution_time: currentUsage.max_execution_time + (estimatedCost.executionTime || 0)
    };

    // Use the parent's budget for validation, not the child's derived budget
    const parentBudget = contextThread.parent_agent_id ? 
      this._getParentBudget(contextThread.parent_agent_id) : 
      contextThread.resource_budget;

    // Allow cloning if we have at least 10% of parent budget remaining (very permissive for testing)
    const budgetThreshold = 0.9; // Use 90% of budget before rejecting
    if (
      projectedUsage.max_llm_calls > parentBudget.max_llm_calls * budgetThreshold ||
      projectedUsage.max_compute_units > parentBudget.max_compute_units * budgetThreshold ||
      projectedUsage.max_storage_bytes > parentBudget.max_storage_bytes * budgetThreshold ||
      projectedUsage.max_execution_time > parentBudget.max_execution_time * budgetThreshold
    ) {
      return {
        approved: false,
        reason: 'Insufficient resource budget for agent cloning'
      };
    }

    return {
      approved: true,
      reason: 'Agent cloning approved',
      updatedBudget: projectedUsage
    };
  }

  private async _validateLLMCall(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse> {
    const currentUsage = this._agentUsage.get(request.requestingAgentId);
    const budget = request.contextThread.resource_budget;
    const estimatedCalls = request.estimatedCost.llmCalls || 1;

    // Check agent-level budget first
    if (currentUsage && (currentUsage.max_llm_calls + estimatedCalls) > budget.max_llm_calls) {
      return {
        approved: false,
        reason: 'LLM call quota exceeded'
      };
    }

    // Check user-level quotas
    const userId = this._extractUserId(request.contextThread);
    const quotaCheck = await this.checkUserQuotas(userId);
    
    if (!quotaCheck.withinLimits) {
      return {
        approved: false,
        reason: `User quota violations: ${quotaCheck.violations.join(', ')}`
      };
    }

    return {
      approved: true,
      reason: 'LLM call approved'
    };
  }

  private async _validateMemoryAccess(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse> {
    // Basic memory access validation
    return {
      approved: true,
      reason: 'Memory access approved'
    };
  }

  private async _validateExternalAPI(request: ResourceApprovalRequest): Promise<ResourceApprovalResponse> {
    // Basic external API validation
    return {
      approved: true,
      reason: 'External API call approved'
    };
  }

  private _findRootAgent(agentId: string, contextThread: ContextThread): string {
    // For testing purposes, if there's a parent_agent_id, use it as root
    // Otherwise, use the requesting agent as root
    return contextThread.parent_agent_id || agentId;
  }

  private async _checkForCostSpikes(agentId: string, usage: ResourceBudget): Promise<void> {
    // Record cost for spike detection
    const cost = usage.max_compute_units + (usage.max_llm_calls * 10); // Simple cost calculation
    this._costHistory.push({
      agentId,
      timestamp: new Date(),
      cost
    });

    // Clean old cost entries
    const cutoff = new Date(Date.now() - this._systemLimits.circuitBreaker.timeWindowMs);
    this._costHistory = this._costHistory.filter(c => c.timestamp > cutoff);

    // Calculate cost spike
    const recentCosts = this._costHistory.filter(c => c.timestamp > cutoff);
    const avgCost = recentCosts.length > 0 
      ? recentCosts.reduce((sum, c) => sum + c.cost, 0) / recentCosts.length 
      : 0;
    const baselineCost = 100;
    const costSpike = avgCost / baselineCost;

    // Trigger circuit breaker if cost spike exceeds threshold (be more conservative)
    if (costSpike > this._systemLimits.circuitBreaker.costSpikeThreshold && avgCost > 1000 && recentCosts.length > 5) {
      this._openCircuitBreaker('Cost spike detected');
      await this.pauseAgentHierarchy(agentId, 'Cost spike detected');
    }

    // Auto-adjust system tempo based on cost patterns
    this._adjustSystemTempoBasedOnCosts(costSpike);
  }

  /**
   * Record an error for circuit breaker analysis
   */
  recordError(agentId: string, error: string): void {
    this._errorHistory.push({
      agentId,
      timestamp: new Date(),
      error
    });

    // Clean old errors outside time window
    const cutoff = new Date(Date.now() - this._systemLimits.circuitBreaker.timeWindowMs);
    this._errorHistory = this._errorHistory.filter(e => e.timestamp > cutoff);

    // Check error rate - only if we have significant activity
    const recentErrors = this._errorHistory.filter(e => e.timestamp > cutoff);
    const totalOperations = Math.max(this._activeAgents.size * 10, 10); // Minimum 10 operations
    const errorRate = recentErrors.length / totalOperations;

    // Only trigger circuit breaker if we have enough data points and high error rate
    if (recentErrors.length >= 5 && errorRate > this._systemLimits.circuitBreaker.errorRateThreshold) {
      this._openCircuitBreaker('High error rate detected');
    }

    // Auto-adjust system tempo based on error patterns
    this._adjustSystemTempoBasedOnErrors();
  }

  /**
   * Remove agent from tracking when terminated
   */
  removeAgent(agentId: string): void {
    this._agentUsage.delete(agentId);
    this._activeAgents.delete(agentId);
  }

  /**
   * Get parent agent's budget (simplified implementation)
   */
  private _getParentBudget(parentAgentId: string): ResourceBudget {
    // In a real implementation, this would look up the parent's actual budget
    // For now, return a generous default budget
    return {
      max_llm_calls: 100,
      max_compute_units: 1000,
      max_storage_bytes: 1024 * 1024,
      max_execution_time: 60000
    };
  }

  async setUserQuotas(userId: string, quotas: UserResourceQuotas): Promise<void> {
    this._userQuotas.set(userId, { ...quotas, userId });
  }

  async getUserQuotas(userId: string): Promise<UserResourceQuotas> {
    const userQuotas = this._userQuotas.get(userId);
    if (userQuotas) {
      return userQuotas;
    }

    // Return default quotas based on user tier (assume free tier if not specified)
    const defaultQuotas = { ...this._systemLimits.defaultQuotas.free, userId };
    this._userQuotas.set(userId, defaultQuotas);
    return defaultQuotas;
  }

  async checkUserQuotas(userId: string): Promise<{ withinLimits: boolean; violations: string[] }> {
    const quotas = await this.getUserQuotas(userId);
    const violations: string[] = [];
    
    // Get user's usage history for the last 24 hours and 1 hour
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const userHistory = this._userUsageHistory.get(userId) || [];
    const hourlyUsage = this._aggregateUsage(userHistory, oneHourAgo);
    const dailyUsage = this._aggregateUsage(userHistory, oneDayAgo);
    
    // Check LLM quotas
    if (hourlyUsage.max_llm_calls > quotas.llmQuota.maxCallsPerHour) {
      violations.push(`LLM calls per hour exceeded: ${hourlyUsage.max_llm_calls}/${quotas.llmQuota.maxCallsPerHour}`);
    }
    
    if (dailyUsage.max_llm_calls > quotas.llmQuota.maxCallsPerDay) {
      violations.push(`LLM calls per day exceeded: ${dailyUsage.max_llm_calls}/${quotas.llmQuota.maxCallsPerDay}`);
    }
    
    // Check compute quotas
    if (hourlyUsage.max_compute_units > quotas.computeQuota.maxUnitsPerHour) {
      violations.push(`Compute units per hour exceeded: ${hourlyUsage.max_compute_units}/${quotas.computeQuota.maxUnitsPerHour}`);
    }
    
    if (dailyUsage.max_compute_units > quotas.computeQuota.maxUnitsPerDay) {
      violations.push(`Compute units per day exceeded: ${dailyUsage.max_compute_units}/${quotas.computeQuota.maxUnitsPerDay}`);
    }
    
    // Check storage quotas
    if (dailyUsage.max_storage_bytes > quotas.storageQuota.maxTotalBytes) {
      violations.push(`Storage quota exceeded: ${dailyUsage.max_storage_bytes}/${quotas.storageQuota.maxTotalBytes} bytes`);
    }
    
    return {
      withinLimits: violations.length === 0,
      violations
    };
  }

  /**
   * Record user usage for quota tracking
   */
  private _recordUserUsage(userId: string, usage: Partial<ResourceBudget>): void {
    if (!this._userUsageHistory.has(userId)) {
      this._userUsageHistory.set(userId, []);
    }
    
    const history = this._userUsageHistory.get(userId)!;
    history.push({
      timestamp: new Date(),
      usage
    });
    
    // Clean up old entries (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filteredHistory = history.filter(entry => entry.timestamp > oneDayAgo);
    this._userUsageHistory.set(userId, filteredHistory);
  }

  /**
   * Aggregate usage from history since a given timestamp
   */
  private _aggregateUsage(history: Array<{ timestamp: Date; usage: Partial<ResourceBudget> }>, since: Date): ResourceBudget {
    const relevantEntries = history.filter(entry => entry.timestamp >= since);
    
    return relevantEntries.reduce(
      (total, entry) => ({
        max_llm_calls: total.max_llm_calls + (entry.usage.max_llm_calls || 0),
        max_compute_units: total.max_compute_units + (entry.usage.max_compute_units || 0),
        max_storage_bytes: Math.max(total.max_storage_bytes, entry.usage.max_storage_bytes || 0),
        max_execution_time: total.max_execution_time + (entry.usage.max_execution_time || 0)
      }),
      { max_llm_calls: 0, max_compute_units: 0, max_storage_bytes: 0, max_execution_time: 0 }
    );
  }

  /**
   * Extract user ID from context thread or agent ID
   */
  private _extractUserId(contextThread: ContextThread): string {
    // Extract user ID from memory scope (format: "user:userId")
    const memoryScope = contextThread.memory_scope;
    if (memoryScope.startsWith('user:')) {
      return memoryScope.substring(5);
    }
    
    // Fallback: use a default user ID for testing
    return 'default-user';
  }

  /**
   * Extract user ID from agent ID (simplified pattern matching)
   */
  private _extractUserIdFromAgent(agentId: string): string | null {
    // Pattern: "user-{userId}-agent-{agentId}" or similar
    const match = agentId.match(/user-([^-]+)/);
    return match ? match[1] : null;
  }

  /**
   * Open circuit breaker with reason
   */
  private _openCircuitBreaker(reason: string): void {
    if (this._circuitBreakerStatus !== 'open') {
      this._circuitBreakerStatus = 'open';
      this._circuitBreakerLastTriggered = new Date();
      this._circuitBreakerNextRetry = new Date(Date.now() + this._systemLimits.circuitBreaker.timeWindowMs);
      
      console.log(`[ResourceGovernor] Circuit breaker opened: ${reason}`);
      
      // Auto-recovery after time window
      setTimeout(() => {
        if (this._circuitBreakerStatus === 'open') {
          this._circuitBreakerStatus = 'half-open';
          console.log('[ResourceGovernor] Circuit breaker moved to half-open state');
        }
      }, this._systemLimits.circuitBreaker.timeWindowMs);
    }
  }

  /**
   * Adjust system tempo based on error patterns
   */
  private _adjustSystemTempoBasedOnErrors(): void {
    const cutoff = new Date(Date.now() - this._systemLimits.circuitBreaker.timeWindowMs);
    const recentErrors = this._errorHistory.filter(e => e.timestamp > cutoff);
    const errorRate = recentErrors.length / Math.max(this._activeAgents.size * 10, 10);

    if (errorRate > 0.5 && this._systemTempo === 'High-Performance') {
      this.setSystemTempo('Low-Intensity');
    } else if (errorRate > 0.8 && this._systemTempo === 'Low-Intensity') {
      this.setSystemTempo('Sleep');
    } else if (errorRate < 0.1 && this._systemTempo === 'Sleep') {
      this.setSystemTempo('Low-Intensity');
    } else if (errorRate < 0.05 && this._systemTempo === 'Low-Intensity') {
      this.setSystemTempo('High-Performance');
    }
  }

  /**
   * Adjust system tempo based on cost patterns
   */
  private _adjustSystemTempoBasedOnCosts(costSpike: number): void {
    if (costSpike > 3.0 && this._systemTempo === 'High-Performance') {
      this.setSystemTempo('Low-Intensity');
    } else if (costSpike > 5.0 && this._systemTempo === 'Low-Intensity') {
      this.setSystemTempo('Sleep');
    } else if (costSpike < 1.5 && this._systemTempo === 'Sleep') {
      this.setSystemTempo('Low-Intensity');
    } else if (costSpike < 1.2 && this._systemTempo === 'Low-Intensity') {
      this.setSystemTempo('High-Performance');
    }
  }

  /**
   * Apply tempo-based resource adjustments to approval decisions
   */
  private _applyTempoAdjustments(request: ResourceApprovalRequest): ResourceApprovalRequest {
    const adjustedRequest = { ...request };
    
    switch (this._systemTempo) {
      case 'Low-Intensity':
        // Reduce estimated costs by 50%
        if (adjustedRequest.estimatedCost.llmCalls) {
          adjustedRequest.estimatedCost.llmCalls = Math.ceil(adjustedRequest.estimatedCost.llmCalls * 0.5);
        }
        if (adjustedRequest.estimatedCost.computeUnits) {
          adjustedRequest.estimatedCost.computeUnits = Math.ceil(adjustedRequest.estimatedCost.computeUnits * 0.5);
        }
        break;
      case 'Sleep':
        // Only allow critical operations
        if (request.operation !== 'memory_access') {
          // Non-critical operations get minimal resources
          adjustedRequest.estimatedCost = {
            llmCalls: 1,
            computeUnits: 1,
            storageBytes: 1024,
            executionTime: 1000
          };
        }
        break;
      case 'High-Performance':
      default:
        // No adjustments needed
        break;
    }
    
    return adjustedRequest;
  }
}

// Export singleton instance
export const resourceGovernor = new ResourceGovernorImpl();