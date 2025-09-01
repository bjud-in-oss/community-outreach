import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CognitiveAgentImpl } from '@/lib/cognitive-agent';
import { resourceGovernor, ResourceGovernorImpl } from '@/lib/resource-governor';
import type { 
  ConfigurationProfile, 
  ContextThread, 
  ChildAgentReport
} from '@/types';

describe('Agent Hierarchy and Delegation System', () => {
  let parentConfig: ConfigurationProfile;
  let parentContextThread: ContextThread;
  let childConfig: ConfigurationProfile;
  let mockResourceGovernor: ResourceGovernorImpl;

  beforeEach(() => {
    // Reset resource governor
    mockResourceGovernor = new ResourceGovernorImpl({
      maxRecursionDepth: 5,
      maxActiveAgents: 20,
      maxSystemAgents: 50
    });
    
    // Replace the singleton with our mock - use a more permissive approach for testing
    vi.spyOn(resourceGovernor, 'requestApproval').mockResolvedValue({
      approved: true,
      reason: 'Test approval'
    });
    vi.spyOn(resourceGovernor, 'updateResourceUsage').mockResolvedValue();
    vi.spyOn(resourceGovernor, 'recordError').mockImplementation(() => {});
    vi.spyOn(resourceGovernor, 'removeAgent').mockImplementation(() => {});

    parentConfig = {
      llm_model: 'gpt-4',
      toolkit: ['memory', 'search'],
      memory_scope: 'user-123',
      entry_phase: 'EMERGE',
      max_recursion_depth: 3,
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 60000
      }
    };

    parentContextThread = {
      id: 'parent-thread-123',
      top_level_goal: 'Complete complex task with delegation',
      task_definition: 'Parent task requiring child agents',
      configuration_profile: parentConfig,
      memory_scope: 'user-123',
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 60000
      },
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };

    childConfig = {
      llm_model: 'gpt-3.5-turbo',
      toolkit: ['memory'],
      memory_scope: 'child-scope',
      entry_phase: 'EMERGE',
      max_recursion_depth: 2,
      resource_budget: {
        max_llm_calls: 30,
        max_compute_units: 300,
        max_storage_bytes: 256 * 1024,
        max_execution_time: 20000
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Agent Cloning with Resource Governor Integration', () => {
    it('should successfully clone agent with resource governor approval', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const childAgent = await parentAgent.clone(childConfig, 'Child task definition');
      
      expect(childAgent).toBeDefined();
      expect(childAgent.role).toBe('Core');
      expect(childAgent.parentAgentId).toBe(parentAgent.id);
      expect(childAgent.contextThread.recursion_depth).toBe(1);
      expect(childAgent.contextThread.task_definition).toBe('Child task definition');
      expect(parentAgent.childAgents.has(childAgent.id)).toBe(true);
      
      // Verify resource governor was called
      expect(resourceGovernor.requestApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'clone_agent',
          requestingAgentId: parentAgent.id
        })
      );
      expect(resourceGovernor.updateResourceUsage).toHaveBeenCalled();
    });

    it('should reject cloning when resource governor denies approval', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Mock resource governor to deny approval
      vi.spyOn(resourceGovernor, 'requestApproval').mockResolvedValue({
        approved: false,
        reason: 'Insufficient resources'
      });
      
      await expect(parentAgent.clone(childConfig, 'Should fail')).rejects.toThrow(
        'Agent cloning denied: Insufficient resources'
      );
      
      expect(parentAgent.childAgents.size).toBe(0);
      expect(resourceGovernor.recordError).toHaveBeenCalledWith(
        parentAgent.id,
        'Agent cloning denied: Insufficient resources'
      );
    });

    it('should prevent cloning beyond maximum recursion depth', async () => {
      // Create a deep hierarchy
      const level0Agent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const level1ContextThread = { ...parentContextThread, recursion_depth: 1 };
      const level1Agent = new CognitiveAgentImpl('Core', childConfig, level1ContextThread, level0Agent.id);
      
      const level2ContextThread = { ...parentContextThread, recursion_depth: 2 };
      const level2Agent = new CognitiveAgentImpl('Core', childConfig, level2ContextThread, level1Agent.id);
      
      const level3ContextThread = { ...parentContextThread, recursion_depth: 3 };
      const level3Agent = new CognitiveAgentImpl('Core', childConfig, level3ContextThread, level2Agent.id);
      
      // Mock resource governor to reject due to recursion depth for this specific test
      vi.spyOn(resourceGovernor, 'requestApproval').mockResolvedValueOnce({
        approved: false,
        reason: 'Maximum recursion depth (5) exceeded'
      });
      
      // This should be rejected by resource governor due to max recursion depth
      await expect(level3Agent.clone(childConfig, 'Too deep')).rejects.toThrow(
        'Agent cloning denied'
      );
    });

    it('should derive appropriate child resource budget', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Simulate some parent resource usage
      (parentAgent as any)._resourceUsage = {
        llmCalls: 20,
        computeUnits: 200,
        storageBytes: 100 * 1024,
        executionTime: 10000
      };
      
      const childAgent = await parentAgent.clone(childConfig, 'Resource budget test');
      
      // Child should get a portion of remaining parent budget
      const childBudget = childAgent.contextThread.resource_budget;
      expect(childBudget.max_llm_calls).toBeGreaterThan(0);
      expect(childBudget.max_llm_calls).toBeLessThan(parentContextThread.resource_budget.max_llm_calls);
    });
  });

  describe('Child Agent Lifecycle Management', () => {
    it('should track child agents correctly', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const child1 = await parentAgent.clone(childConfig, 'Task 1');
      const child2 = await parentAgent.clone(childConfig, 'Task 2');
      
      expect(parentAgent.childAgents.size).toBe(2);
      expect(parentAgent.listChildAgents()).toHaveLength(2);
      expect(parentAgent.getChildAgent(child1.id)).toBe(child1);
      expect(parentAgent.getChildAgent(child2.id)).toBe(child2);
      expect(parentAgent.getChildAgent('non-existent')).toBeNull();
    });

    it('should generate child agent reports', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await parentAgent.clone(childConfig, 'Reporting test');
      
      const reports = await parentAgent.getChildAgentReports();
      
      expect(reports).toHaveLength(1);
      expect(reports[0]).toMatchObject({
        childId: childAgent.id,
        taskDefinition: 'Reporting test',
        status: expect.stringMatching(/completed|failed|running|error/),
        resourceUsage: expect.any(Object),
        executionTime: expect.any(Number),
        timestamp: expect.any(Date)
      });
    });

    it('should remove child agents and get their reports', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await parentAgent.clone(childConfig, 'Removal test');
      
      expect(parentAgent.childAgents.size).toBe(1);
      
      const report = await parentAgent.removeChildAgent(childAgent.id);
      
      expect(report).toBeDefined();
      expect(report?.childId).toBe(childAgent.id);
      expect(report?.taskDefinition).toBe('Removal test');
      expect(parentAgent.childAgents.size).toBe(0);
    });

    it('should handle child agent removal of non-existent agent', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const report = await parentAgent.removeChildAgent('non-existent');
      
      expect(report).toBeNull();
    });

    it('should terminate all child agents on parent termination', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const child1 = await parentAgent.clone(childConfig, 'Task 1');
      const child2 = await parentAgent.clone(childConfig, 'Task 2');
      
      expect(parentAgent.childAgents.size).toBe(2);
      expect(child1.getStatus().active).toBe(true);
      expect(child2.getStatus().active).toBe(true);
      
      await parentAgent.terminate();
      
      expect(parentAgent.childAgents.size).toBe(0);
      expect(child1.getStatus().active).toBe(false);
      expect(child2.getStatus().active).toBe(false);
      expect(resourceGovernor.removeAgent).toHaveBeenCalledWith(parentAgent.id);
    });
  });

  describe('Multi-Level Agent Hierarchy', () => {
    it('should create and manage multi-level agent hierarchy', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Level 1 children
      const child1 = await rootAgent.clone(childConfig, 'Level 1 Task A');
      const child2 = await rootAgent.clone(childConfig, 'Level 1 Task B');
      
      // Level 2 children (grandchildren of root)
      const grandchild1 = await child1.clone(childConfig, 'Level 2 Task A1');
      const grandchild2 = await child1.clone(childConfig, 'Level 2 Task A2');
      
      // Verify hierarchy structure
      expect(rootAgent.childAgents.size).toBe(2);
      expect(child1.childAgents.size).toBe(2);
      expect(child2.childAgents.size).toBe(0);
      expect(grandchild1.childAgents.size).toBe(0);
      expect(grandchild2.childAgents.size).toBe(0);
      
      // Verify parent-child relationships
      expect(child1.parentAgentId).toBe(rootAgent.id);
      expect(child2.parentAgentId).toBe(rootAgent.id);
      expect(grandchild1.parentAgentId).toBe(child1.id);
      expect(grandchild2.parentAgentId).toBe(child1.id);
      
      // Verify recursion depths
      expect(rootAgent.contextThread.recursion_depth).toBe(0);
      expect(child1.contextThread.recursion_depth).toBe(1);
      expect(child2.contextThread.recursion_depth).toBe(1);
      expect(grandchild1.contextThread.recursion_depth).toBe(2);
      expect(grandchild2.contextThread.recursion_depth).toBe(2);
    });

    it('should cascade termination through hierarchy', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const child = await rootAgent.clone(childConfig, 'Level 1');
      const grandchild = await child.clone(childConfig, 'Level 2');
      
      expect(rootAgent.getStatus().active).toBe(true);
      expect(child.getStatus().active).toBe(true);
      expect(grandchild.getStatus().active).toBe(true);
      
      // Terminate root - should cascade to all descendants
      await rootAgent.terminate();
      
      expect(rootAgent.getStatus().active).toBe(false);
      expect(child.getStatus().active).toBe(false);
      expect(grandchild.getStatus().active).toBe(false);
    });

    it('should collect reports from entire hierarchy', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const child1 = await rootAgent.clone(childConfig, 'Child 1');
      const child2 = await rootAgent.clone(childConfig, 'Child 2');
      const grandchild = await child1.clone(childConfig, 'Grandchild');
      
      // Get reports from root level
      const rootReports = await rootAgent.getChildAgentReports();
      expect(rootReports).toHaveLength(2);
      
      // Get reports from child level
      const child1Reports = await child1.getChildAgentReports();
      expect(child1Reports).toHaveLength(1);
      expect(child1Reports[0].taskDefinition).toBe('Grandchild');
      
      const child2Reports = await child2.getChildAgentReports();
      expect(child2Reports).toHaveLength(0);
    });
  });

  describe('Resource Governor Integration', () => {
    it('should track resource usage across agent hierarchy', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Create multiple child agents
      await rootAgent.clone(childConfig, 'Task 1');
      await rootAgent.clone(childConfig, 'Task 2');
      await rootAgent.clone(childConfig, 'Task 3');
      
      // Verify resource governor was called for each cloning operation
      expect(resourceGovernor.requestApproval).toHaveBeenCalledTimes(3);
      expect(resourceGovernor.updateResourceUsage).toHaveBeenCalledTimes(3);
    });

    it('should handle resource governor errors gracefully', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Mock resource governor to throw error during approval
      vi.spyOn(resourceGovernor, 'requestApproval').mockRejectedValue(
        new Error('Resource governor service unavailable')
      );
      
      await expect(rootAgent.clone(childConfig, 'Should fail')).rejects.toThrow(
        'Resource governor service unavailable'
      );
      
      expect(rootAgent.childAgents.size).toBe(0);
    });

    it('should record errors when child agent operations fail', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Error test');
      
      // Mock child agent termination to throw error
      vi.spyOn(childAgent, 'terminate').mockRejectedValue(new Error('Termination failed'));
      
      // This should not throw, but should record the error
      await rootAgent.terminate();
      
      expect(resourceGovernor.recordError).toHaveBeenCalledWith(
        rootAgent.id,
        expect.stringContaining('Child agent termination failed')
      );
    });

    it('should remove agents from resource governor tracking on termination', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Tracking test');
      
      await rootAgent.terminate();
      
      expect(resourceGovernor.removeAgent).toHaveBeenCalledWith(rootAgent.id);
      expect(resourceGovernor.removeAgent).toHaveBeenCalledWith(childAgent.id);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle child agent creation failures', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      // Mock resource governor to deny approval to simulate creation failure
      vi.spyOn(resourceGovernor, 'requestApproval').mockResolvedValue({
        approved: false,
        reason: 'Simulated creation failure'
      });
      
      await expect(rootAgent.clone(childConfig, 'Should fail')).rejects.toThrow(
        'Agent cloning denied: Simulated creation failure'
      );
      
      expect(resourceGovernor.recordError).toHaveBeenCalledWith(
        rootAgent.id,
        'Agent cloning denied: Simulated creation failure'
      );
    });

    it('should handle child agent report collection errors', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Report error test');
      
      // Mock child agent to throw error when getting status
      vi.spyOn(childAgent, 'getStatus').mockImplementation(() => {
        throw new Error('Status retrieval failed');
      });
      
      // The error should be caught and handled gracefully
      const reports = await rootAgent.getChildAgentReports();
      
      expect(reports).toHaveLength(1);
      expect(reports[0].status).toBe('error');
      expect(reports[0].error).toBe('Status retrieval failed');
    });

    it('should detect and report stuck child agents', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Stuck agent test');
      
      // Mock child agent to appear stuck in ADAPT phase
      vi.spyOn(childAgent, 'getStatus').mockReturnValue({
        id: childAgent.id,
        phase: 'ADAPT',
        active: true,
        childCount: 0,
        resourceUsage: { llmCalls: 0, computeUnits: 0, storageBytes: 0, executionTime: 0 },
        lastActivity: new Date(Date.now() - 120000) // 2 minutes ago
      });
      
      const reports = await rootAgent.getChildAgentReports();
      
      expect(reports[0].status).toBe('failed');
      expect(reports[0].error).toContain('stuck in ADAPT phase');
    });
  });

  describe('Context Thread Management', () => {
    it('should properly inherit context thread properties', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Context inheritance test');
      
      expect(childAgent.contextThread.top_level_goal).toBe(parentContextThread.top_level_goal);
      expect(childAgent.contextThread.parent_agent_id).toBe(rootAgent.id);
      expect(childAgent.contextThread.workspace_branch).toBe(parentContextThread.workspace_branch);
      expect(childAgent.contextThread.recursion_depth).toBe(1);
      expect(childAgent.contextThread.task_definition).toBe('Context inheritance test');
    });

    it('should generate unique context thread IDs', async () => {
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      
      const child1 = await rootAgent.clone(childConfig, 'Task 1');
      const child2 = await rootAgent.clone(childConfig, 'Task 2');
      
      expect(child1.contextThread.id).not.toBe(child2.contextThread.id);
      expect(child1.contextThread.id).not.toBe(rootAgent.contextThread.id);
      expect(child2.contextThread.id).not.toBe(rootAgent.contextThread.id);
    });

    it('should maintain proper timestamps in context threads', async () => {
      const startTime = new Date();
      const rootAgent = new CognitiveAgentImpl('Coordinator', parentConfig, parentContextThread);
      const childAgent = await rootAgent.clone(childConfig, 'Timestamp test');
      const endTime = new Date();
      
      expect(childAgent.contextThread.created_at.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
      expect(childAgent.contextThread.created_at.getTime()).toBeLessThanOrEqual(endTime.getTime());
      expect(childAgent.contextThread.updated_at.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
      expect(childAgent.contextThread.updated_at.getTime()).toBeLessThanOrEqual(endTime.getTime());
    });
  });
});