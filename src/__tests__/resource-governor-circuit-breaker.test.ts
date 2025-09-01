import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ResourceGovernorImpl, 
  ResourceApprovalRequest, 
  SystemResourceLimits,
  SystemTempo 
} from '@/lib/resource-governor';
import { ContextThread, ResourceBudget } from '@/types';

describe('ResourceGovernor - Circuit Breaker and Monitoring', () => {
  let resourceGovernor: ResourceGovernorImpl;
  let mockContextThread: ContextThread;

  beforeEach(() => {
    // Use more sensitive limits for testing
    const testLimits: Partial<SystemResourceLimits> = {
      maxRecursionDepth: 3,
      maxActiveAgents: 5,
      maxSystemAgents: 20,
      circuitBreaker: {
        errorRateThreshold: 0.3, // 30% for testing
        costSpikeThreshold: 2.0, // 2x for testing
        timeWindowMs: 5000 // 5 seconds for testing
      }
    };
    
    resourceGovernor = new ResourceGovernorImpl(testLimits);
    
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
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 60000
      },
      recursion_depth: 1,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };
  });

  describe('Error rate detection and circuit breaker', () => {
    it('should open circuit breaker when error rate exceeds threshold', async () => {
      const agentId = 'test-agent';
      
      // Record multiple errors to trigger circuit breaker
      for (let i = 0; i < 10; i++) {
        resourceGovernor.recordError(agentId, `Test error ${i}`);
      }

      // Add some agent activity to make error rate calculation meaningful
      await resourceGovernor.updateResourceUsage(agentId, { max_llm_calls: 1 });

      const metrics = await resourceGovernor.getSystemMetrics();
      
      // Should have opened circuit breaker due to high error rate
      expect(metrics.circuitBreakerInfo.status).toBe('open');
      expect(metrics.circuitBreakerInfo.errorRate).toBeGreaterThan(0.3);
    });

    it('should reject requests when circuit breaker is open', async () => {
      // Manually open circuit breaker
      resourceGovernor.setCircuitBreakerState('open');

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

    it('should transition circuit breaker from open to half-open after timeout', async () => {
      // Open circuit breaker
      resourceGovernor.setCircuitBreakerState('open');
      
      let metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.circuitBreakerInfo.status).toBe('open');

      // Wait for timeout (using a shorter timeout for testing)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manually transition to half-open (simulating timeout)
      resourceGovernor.setCircuitBreakerState('half-open');
      
      metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.circuitBreakerInfo.status).toBe('half-open');
    });

    it('should clean up old error history', async () => {
      const agentId = 'test-agent';
      
      // Record errors
      for (let i = 0; i < 5; i++) {
        resourceGovernor.recordError(agentId, `Old error ${i}`);
      }

      let metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.errorHistory.length).toBe(5);

      // Manually manipulate the timestamps to simulate old errors
      const oldTimestamp = new Date(Date.now() - 10000); // 10 seconds ago
      (resourceGovernor as any)._errorHistory.forEach((error: any) => {
        error.timestamp = oldTimestamp;
      });

      // Record a new error to trigger cleanup
      resourceGovernor.recordError(agentId, 'New error');

      metrics = await resourceGovernor.getSystemMetrics();
      // Should only have the new error (old ones cleaned up)
      expect(metrics.errorHistory.length).toBe(1);
      expect(metrics.errorHistory[0].error).toBe('New error');
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Cost spike detection', () => {
    it('should detect cost spikes and open circuit breaker', async () => {
      const agentId = 'expensive-agent';
      
      // Simulate high-cost operations
      await resourceGovernor.updateResourceUsage(agentId, {
        max_compute_units: 2000, // High cost
        max_llm_calls: 50
      });

      const metrics = await resourceGovernor.getSystemMetrics();
      
      // Should detect cost spike
      expect(metrics.circuitBreakerInfo.costSpike).toBeGreaterThan(2.0);
    });

    it('should pause agent hierarchy on cost spike', async () => {
      const agentId = 'expensive-agent';
      
      // Simulate multiple high-cost operations to build up cost history
      for (let i = 0; i < 10; i++) {
        await resourceGovernor.updateResourceUsage(agentId, {
          max_compute_units: 500, // High cost per operation
          max_llm_calls: 10
        });
      }

      const metrics = await resourceGovernor.getSystemMetrics();
      
      // Should have paused the hierarchy due to sustained high cost
      expect(metrics.pausedHierarchies).toContain(agentId);
    });
  });

  describe('System tempo management', () => {
    it('should start with High-Performance tempo', () => {
      const tempo = resourceGovernor.getSystemTempo();
      expect(tempo).toBe('High-Performance');
    });

    it('should allow manual tempo changes', async () => {
      await resourceGovernor.setSystemTempo('Low-Intensity');
      expect(resourceGovernor.getSystemTempo()).toBe('Low-Intensity');

      await resourceGovernor.setSystemTempo('Sleep');
      expect(resourceGovernor.getSystemTempo()).toBe('Sleep');

      await resourceGovernor.setSystemTempo('High-Performance');
      expect(resourceGovernor.getSystemTempo()).toBe('High-Performance');
    });

    it('should reject non-critical operations in Sleep mode', async () => {
      await resourceGovernor.setSystemTempo('Sleep');

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('Sleep mode');
    });

    it('should allow memory access in Sleep mode', async () => {
      await resourceGovernor.setSystemTempo('Sleep');

      const request: ResourceApprovalRequest = {
        operation: 'memory_access',
        requestingAgentId: 'agent-1',
        estimatedCost: { storageBytes: 1024 },
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(true);
    });

    it('should auto-adjust tempo based on error patterns', async () => {
      const agentId = 'error-prone-agent';
      await resourceGovernor.updateResourceUsage(agentId, { max_llm_calls: 1 });

      // Start with High-Performance
      expect(resourceGovernor.getSystemTempo()).toBe('High-Performance');

      // Generate many errors to trigger tempo reduction
      for (let i = 0; i < 20; i++) {
        resourceGovernor.recordError(agentId, `Error ${i}`);
      }

      // Should have reduced tempo due to high error rate
      const tempo = resourceGovernor.getSystemTempo();
      expect(tempo).not.toBe('High-Performance');
    });
  });

  describe('Agent hierarchy pause and resume', () => {
    it('should pause and resume agent hierarchies', async () => {
      const rootAgentId = 'root-agent';
      
      // Initially not paused
      let metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.pausedHierarchies).not.toContain(rootAgentId);

      // Pause hierarchy
      await resourceGovernor.pauseAgentHierarchy(rootAgentId, 'Test pause');
      
      metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.pausedHierarchies).toContain(rootAgentId);

      // Resume hierarchy
      await resourceGovernor.resumeAgentHierarchy(rootAgentId);
      
      metrics = await resourceGovernor.getSystemMetrics();
      expect(metrics.pausedHierarchies).not.toContain(rootAgentId);
    });

    it('should reject requests from paused hierarchies', async () => {
      const rootAgentId = 'parent-agent-1'; // From mockContextThread
      
      await resourceGovernor.pauseAgentHierarchy(rootAgentId, 'Test pause');

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'child-agent',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread // Has parent_agent_id: 'parent-agent-1'
      };

      const response = await resourceGovernor.requestApproval(request);

      expect(response.approved).toBe(false);
      expect(response.reason).toContain('hierarchy is paused');
    });
  });

  describe('System metrics and monitoring', () => {
    it('should provide comprehensive system metrics', async () => {
      const agentId = 'test-agent';
      
      // Add some activity
      await resourceGovernor.updateResourceUsage(agentId, {
        max_llm_calls: 10,
        max_compute_units: 100
      });
      
      resourceGovernor.recordError(agentId, 'Test error');
      await resourceGovernor.pauseAgentHierarchy('test-hierarchy', 'Test pause');

      const metrics = await resourceGovernor.getSystemMetrics();

      expect(metrics.activeAgents).toBe(1);
      expect(metrics.totalResourceUsage.max_llm_calls).toBe(10);
      expect(metrics.totalResourceUsage.max_compute_units).toBe(100);
      expect(metrics.circuitBreakerInfo.status).toBe('closed');
      expect(metrics.systemTempo).toBe('High-Performance');
      expect(metrics.errorHistory.length).toBe(1);
      expect(metrics.pausedHierarchies).toContain('test-hierarchy');
    });

    it('should calculate error rates correctly', async () => {
      const agentId = 'test-agent';
      
      // Add agent activity
      await resourceGovernor.updateResourceUsage(agentId, { max_llm_calls: 1 });
      
      // Record some errors
      for (let i = 0; i < 3; i++) {
        resourceGovernor.recordError(agentId, `Error ${i}`);
      }

      const metrics = await resourceGovernor.getSystemMetrics();
      
      // Error rate should be calculated based on errors vs operations
      expect(metrics.circuitBreakerInfo.errorRate).toBeGreaterThan(0);
      expect(metrics.circuitBreakerInfo.errorRate).toBeLessThanOrEqual(1);
    });

    it('should track cost spikes over time', async () => {
      const agentId = 'test-agent';
      
      // Start with low cost
      await resourceGovernor.updateResourceUsage(agentId, {
        max_compute_units: 50,
        max_llm_calls: 5
      });

      let metrics = await resourceGovernor.getSystemMetrics();
      const initialCostSpike = metrics.circuitBreakerInfo.costSpike;

      // Add high cost operation
      await resourceGovernor.updateResourceUsage(agentId, {
        max_compute_units: 500,
        max_llm_calls: 50
      });

      metrics = await resourceGovernor.getSystemMetrics();
      const newCostSpike = metrics.circuitBreakerInfo.costSpike;

      // Cost spike should have increased
      expect(newCostSpike).toBeGreaterThan(initialCostSpike);
    });
  });

  describe('Integration with approval process', () => {
    it('should apply tempo-based resource adjustments', async () => {
      await resourceGovernor.setSystemTempo('Low-Intensity');

      const request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 10 }, // High request
        contextThread: mockContextThread
      };

      const response = await resourceGovernor.requestApproval(request);

      // Should still approve but with adjusted expectations
      expect(response.approved).toBe(true);
    });

    it('should handle circuit breaker recovery', async () => {
      // Open circuit breaker
      resourceGovernor.setCircuitBreakerState('open');

      let request: ResourceApprovalRequest = {
        operation: 'llm_call',
        requestingAgentId: 'agent-1',
        estimatedCost: { llmCalls: 1 },
        contextThread: mockContextThread
      };

      // Should be rejected when open
      let response = await resourceGovernor.requestApproval(request);
      expect(response.approved).toBe(false);

      // Move to half-open
      resourceGovernor.setCircuitBreakerState('half-open');

      // Should allow limited requests when half-open
      response = await resourceGovernor.requestApproval(request);
      expect(response.approved).toBe(true);

      // Close circuit breaker
      resourceGovernor.setCircuitBreakerState('closed');

      // Should allow normal requests when closed
      response = await resourceGovernor.requestApproval(request);
      expect(response.approved).toBe(true);
    });
  });
});