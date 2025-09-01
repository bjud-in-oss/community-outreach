import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ResourceGovernorImpl, 
  ResourceApprovalRequest, 
  ResourceApprovalResponse,
  SystemResourceLimits 
} from '@/lib/resource-governor';
import { ContextThread, ResourceBudget } from '@/types';

describe('ResourceGovernor - Centralized Resource Approval System', () => {
  let resourceGovernor: ResourceGovernorImpl;
  let mockContextThread: ContextThread;
  let mockResourceBudget: ResourceBudget;

  beforeEach(() => {
    // Reset the resource governor with test-friendly limits
    const testLimits: Partial<SystemResourceLimits> = {
      maxRecursionDepth: 3,
      maxActiveAgents: 5,
      maxSystemAgents: 20,
      circuitBreaker: {
        errorRateThreshold: 0.5, // 50% for testing
        costSpikeThreshold: 2.0, // 2x for testing
        timeWindowMs: 10000 // 10 seconds for testing
      }
    };
    
    resourceGovernor = new ResourceGovernorImpl(testLimits);
    
    mockResourceBudget = {
      max_llm_calls: 100,
      max_compute_units: 1000,
      max_storage_bytes: 1024 * 1024, // 1MB
      max_execution_time: 60000 // 1 minute
    };

    mockContextThread = {
      id: 'test-thread-1',
      top_level_goal: 'Test goal',
      parent_agent_id: 'parent-agent-1',
      task_definition: 'Test task',
      configuration_profile: {
        llm_model: 'gpt-4',
        toolkit: ['basic'],
        memory_scope: 'user:test',
        entry_phase: 'EMERGE'
      },
      memory_scope: 'user:test',
      resource_budget: mockResourceBudget,
      recursion_depth: 1,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };
  });

  describe('Resource-intensive action validation and approval', () => {
    it('should approve valid agent cloning request', async () => {
      const request: ResourceApprovalRequest = {
        operation: 'clone_agent',
        requestingAgentId: 'agent-1',
        estimatedCost: {
          llmCalls: 10,
          computeUnits: 50,
          storageBytes: 1024,
          executionTime: 5000
        },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(true);
      expect(response.reason).toContain('approved');
      expect(response.updatedBudget).toBeDefined();
    });

    it('should reject agent cloning when recursion depth exceeded', async () => {
      const deepContextThread = {
        ...mockContextThread,
        recursion_depth: 5 // Exceeds maxRecursionDepth of 3
      };

      const request: ResourceApprovalRequest = {
        operation: 'clone_agent',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 1 },
        contextThread: deepContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Maximum recursion depth');
    });

    it('should approve valid LLM call request', async () => {
      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 5 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(true);
      expect(response.reason).toContain('approved');
    });

    it('should reject LLM call when quota exceeded', async () => {
      const agentId = 'agent-1';
      
      // First, use up most of the LLM quota (keep compute units low to avoid cost spike)
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 95, // Close to the 100 limit
        max_compute_units: 10 // Keep very low to avoid cost spike detection
      });

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: agentId,
        estimatedCost: { llmCalls: 20 }, // Would exceed quota even after tempo adjustment (95 + 10 = 105 > 100)
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);
      
      expect(response.approved).toBe(false);
      expect(response.reason).toContain('quota exceeded');
    });

    it('should approve memory access requests', async () => {
      const request: ResourceApprovalRequest = {
        operation: 'memory_access',
        requestingAgentId: 'agent-1',
        estimatedCost: { storageBytes: 1024 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(true);
      expect(response.reason).toContain('approved');
    });

    it('should approve external API requests', async () => {
      const request: ResourceApprovalRequest = {
        operation: 'external_api',
        requestingAgentId: 'agent-1',
        estimatedCost: { computeUnits: 10 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(true);
      expect(response.reason).toContain('approved');
    });

    it('should reject unknown operation types', async () => {
      const request: ResourceApprovalRequest = {
        operation: 'unknown_operation' as any,
        requestingAgentId: 'agent-1',
        estimatedCost: {},
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Unknown operation type');
    });
  });

  describe('User-specific quota enforcement', () => {
    it('should track and enforce LLM usage quotas', async () => {
      const agentId = 'agent-1';
      
      // Update usage to near limit
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 90
      });

      // Check if within limits
      const withinLimits = await resourceGovernor.checkResourceLimits(agentId, mockContextThread);
      expect(withinLimits).toBe(true);

      // Push over limit
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 20 // Total would be 110, over the 100 limit
      });

      const overLimits = await resourceGovernor.checkResourceLimits(agentId, mockContextThread);
      expect(overLimits).toBe(false);
    });

    it('should track and enforce compute unit quotas', async () => {
      const agentId = 'agent-1';
      
      await resourceGovernor.updateResourceUsage(agentId, {
        max_compute_units: 1500 // Over the 1000 limit
      });

      const withinLimits = await resourceGovernor.checkResourceLimits(agentId, mockContextThread);
      expect(withinLimits).toBe(false);
    });

    it('should track and enforce storage quotas', async () => {
      const agentId = 'agent-1';
      
      await resourceGovernor.updateResourceUsage(agentId, {
        max_storage_bytes: 2 * 1024 * 1024 // 2MB, over the 1MB limit
      });

      const withinLimits = await resourceGovernor.checkResourceLimits(agentId, mockContextThread);
      expect(withinLimits).toBe(false);
    });

    it('should track and enforce execution time quotas', async () => {
      const agentId = 'agent-1';
      
      await resourceGovernor.updateResourceUsage(agentId, {
        max_execution_time: 120000 // 2 minutes, over the 1 minute limit
      });

      const withinLimits = await resourceGovernor.checkResourceLimits(agentId, mockContextThread);
      expect(withinLimits).toBe(false);
    });

    it('should handle agents with no usage history', async () => {
      const newAgentId = 'new-agent';
      
      const withinLimits = await resourceGovernor.checkResourceLimits(newAgentId, mockContextThread);
      expect(withinLimits).toBe(true);
    });
  });

  describe('System-wide safety limits', () => {
    it('should enforce maximum recursion depth', async () => {
      const deepContextThread = {
        ...mockContextThread,
        recursion_depth: 4 // Exceeds maxRecursionDepth of 3
      };

      const request: ResourceApprovalRequest = {
        operation: 'clone_agent',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 1 },
        contextThread: deepContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Maximum recursion depth');
    });

    it('should enforce maximum active agents limit', async () => {
      // Create multiple agents to reach the limit (maxSystemAgents = 20 in test config)
      const agentIds = Array.from({ length: 20 }, (_, i) => `agent-${i + 1}`);
      
      // Add agents to reach the maxSystemAgents limit of 20
      for (const agentId of agentIds) {
        await resourceGovernor.updateResourceUsage(agentId, { max_llm_calls: 1 });
      }

      // Try to create one more agent (would be the 21st)
      const request: ResourceApprovalRequest = {
        operation: 'clone_agent',
        requestingAgentId: 'agent-21',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Maximum system agents');
    });

    it('should provide system status information', async () => {
      // Add some agents and usage
      await resourceGovernor.updateResourceUsage('agent-1', { 
        max_llm_calls: 10,
        max_compute_units: 100 
      });
      await resourceGovernor.updateResourceUsage('agent-2', { 
        max_llm_calls: 5,
        max_compute_units: 50 
      });

      const status = await resourceGovernor.getSystemStatus();

      expect(status.activeAgents).toBe(2);
      expect(status.totalResourceUsage.max_llm_calls).toBe(15);
      expect(status.totalResourceUsage.max_compute_units).toBe(150);
      expect(status.circuitBreakerStatus).toBe('closed');
    });

    it('should reject requests when agent hierarchy is paused', async () => {
      const rootAgentId = 'parent-agent-1'; // Use the parent agent ID from mockContextThread
      
      // Pause the hierarchy
      await resourceGovernor.pauseAgentHierarchy(rootAgentId, 'Test pause');

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'child-agent',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread // This has parent_agent_id: 'parent-agent-1'
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('hierarchy is paused');
    });

    it('should reject requests when circuit breaker is open', async () => {
      // Manually set circuit breaker to open
      (resourceGovernor as any)._circuitBreakerStatus = 'open';

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('circuit breaker is open');
    });
  });

  describe('Resource usage tracking and management', () => {
    it('should track cumulative resource usage', async () => {
      const agentId = 'agent-1';
      
      // Add usage in multiple updates
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 10,
        max_compute_units: 100
      });
      
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 5,
        max_storage_bytes: 1024
      });

      const status = await resourceGovernor.getSystemStatus();
      expect(status.totalResourceUsage.max_llm_calls).toBe(15);
      expect(status.totalResourceUsage.max_compute_units).toBe(100);
      expect(status.totalResourceUsage.max_storage_bytes).toBe(1024);
    });

    it('should remove agents from tracking when terminated', async () => {
      const agentId = 'agent-1';
      
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 10
      });

      let status = await resourceGovernor.getSystemStatus();
      expect(status.activeAgents).toBe(1);

      resourceGovernor.removeAgent(agentId);

      status = await resourceGovernor.getSystemStatus();
      expect(status.activeAgents).toBe(0);
      expect(status.totalResourceUsage.max_llm_calls).toBe(0);
    });

    it('should handle resource budget validation for agent cloning', async () => {
      const agentId = 'parent-agent';
      
      // Use up most of the parent's budget (but keep compute units very low to avoid cost spike)
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 95, // Close to budget limit
        max_compute_units: 5 // Keep very low to avoid cost spike detection
      });

      const request: ResourceApprovalRequest = {
        operation: 'clone_agent',
        requestingAgentId: agentId,
        estimatedCost: {
          llmCalls: 10, // Would push over 90% threshold
          computeUnits: 5 // Keep very low
        },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Insufficient resource budget');
    });
  });
});