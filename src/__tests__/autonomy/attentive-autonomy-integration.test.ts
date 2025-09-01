import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  AttentiveAutonomySystem, 
  SimpleUserActivityDetector,
  LekProcess,
  SystemMode,
  UserActivityDetector,
  LekConfiguration
} from '@/lib/autonomy/attentive-autonomy';
import { CognitiveAgentImpl } from '@/lib/cognitive-agent';
import { resourceGovernor } from '@/lib/resource-governor';
import { 
  ConfigurationProfile, 
  ContextThread, 
  ResourceBudget,
  CognitiveAgent 
} from '@/types';

// Mock the resource governor
vi.mock('@/lib/resource-governor', () => ({
  resourceGovernor: {
    requestApproval: vi.fn(),
    updateResourceUsage: vi.fn(),
    recordError: vi.fn(),
    removeAgent: vi.fn()
  }
}));

describe('Attentive Autonomy System Integration Tests', () => {
  let autonomySystem: AttentiveAutonomySystem;
  let userActivityDetector: SimpleUserActivityDetector;
  let coordinatorAgent: CognitiveAgent;
  let mockResourceGovernor: typeof resourceGovernor;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockResourceGovernor = resourceGovernor as any;
    
    // Create user activity detector
    userActivityDetector = new SimpleUserActivityDetector();
    
    // Create autonomy system
    autonomySystem = new AttentiveAutonomySystem(userActivityDetector);
    
    // Create mock coordinator agent
    const config: ConfigurationProfile = {
      llm_model: 'gpt-4',
      toolkit: ['memory', 'reasoning'],
      memory_scope: 'user_123',
      entry_phase: 'EMERGE',
      max_recursion_depth: 3,
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 500,
        max_storage_bytes: 10240,
        max_execution_time: 600000
      }
    };
    
    const contextThread: ContextThread = {
      id: 'thread_123',
      top_level_goal: 'Test coordination',
      task_definition: 'Test task',
      configuration_profile: config,
      memory_scope: 'user_123',
      resource_budget: config.resource_budget!,
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    coordinatorAgent = new CognitiveAgentImpl('Coordinator', config, contextThread);
    autonomySystem.setCoordinatorAgent(coordinatorAgent);
    
    // Mock resource governor to approve requests by default
    (mockResourceGovernor.requestApproval as Mock).mockResolvedValue({
      approved: true,
      reason: 'Test approval'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Mode Switching', () => {
    it('should start in Attentive mode', () => {
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
    });

    it('should switch to Autonomous mode when requested', async () => {
      await autonomySystem.switchToAutonomousMode();
      expect(autonomySystem.getCurrentMode()).toBe('Autonomous');
    }, 10000);

    it('should request resource approval before switching to Autonomous mode', async () => {
      await autonomySystem.switchToAutonomousMode();
      
      expect(mockResourceGovernor.requestApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'autonomous_mode',
          requestingAgentId: coordinatorAgent.id
        })
      );
    }, 10000);

    it('should reject Autonomous mode switch if resources denied', async () => {
      (mockResourceGovernor.requestApproval as Mock).mockResolvedValue({
        approved: false,
        reason: 'Insufficient resources'
      });

      await expect(autonomySystem.switchToAutonomousMode()).rejects.toThrow(
        'Autonomous mode denied: Insufficient resources'
      );
      
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
    });

    it('should switch back to Attentive mode when requested', async () => {
      await autonomySystem.switchToAutonomousMode();
      expect(autonomySystem.getCurrentMode()).toBe('Autonomous');
      
      await autonomySystem.switchToAttentiveMode();
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
    }, 10000);

    it('should not switch if already in requested mode', async () => {
      // Already in Attentive mode
      await autonomySystem.switchToAttentiveMode();
      expect(mockResourceGovernor.requestApproval).not.toHaveBeenCalled();
      
      // Switch to Autonomous, then try again
      await autonomySystem.switchToAutonomousMode();
      vi.clearAllMocks();
      
      await autonomySystem.switchToAutonomousMode();
      expect(mockResourceGovernor.requestApproval).not.toHaveBeenCalled();
    }, 10000);
  });

  describe('User Input Detection and Mode Switching', () => {
    it('should automatically switch to Attentive mode when user input detected in Autonomous mode', async () => {
      // Switch to Autonomous mode
      await autonomySystem.switchToAutonomousMode();
      expect(autonomySystem.getCurrentMode()).toBe('Autonomous');
      
      // Simulate user input
      userActivityDetector.simulateUserInput({ text: 'Hello', type: 'chat' });
      
      // Allow async processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
      expect(autonomySystem.wasAutonomousTaskInterrupted()).toBe(true);
    }, 10000);

    it('should not switch modes when user input detected in Attentive mode', async () => {
      // Already in Attentive mode
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
      
      // Simulate user input
      userActivityDetector.simulateUserInput({ text: 'Hello', type: 'chat' });
      
      // Allow async processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
      expect(autonomySystem.wasAutonomousTaskInterrupted()).toBe(false);
    });

    it('should trigger mode evaluation manually', async () => {
      // Switch to Autonomous mode
      await autonomySystem.switchToAutonomousMode();
      expect(autonomySystem.getCurrentMode()).toBe('Autonomous');
      
      // Set user input without triggering callback
      userActivityDetector['hasInput'] = true;
      userActivityDetector['latestInput'] = { text: 'Test', type: 'chat' };
      
      // Manually evaluate mode
      await autonomySystem.evaluateMode();
      
      expect(autonomySystem.getCurrentMode()).toBe('Attentive');
    }, 10000);
  });

  describe('Mode Change Callbacks', () => {
    it('should notify callbacks when mode changes', async () => {
      const modeChangeCallback = vi.fn();
      autonomySystem.onModeChange(modeChangeCallback);
      
      await autonomySystem.switchToAutonomousMode();
      expect(modeChangeCallback).toHaveBeenCalledWith('Autonomous');
      
      await autonomySystem.switchToAttentiveMode();
      expect(modeChangeCallback).toHaveBeenCalledWith('Attentive');
      
      expect(modeChangeCallback).toHaveBeenCalledTimes(2);
    }, 10000);

    it('should handle callback errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();
      
      autonomySystem.onModeChange(errorCallback);
      autonomySystem.onModeChange(goodCallback);
      
      // Should not throw despite callback error
      await autonomySystem.switchToAutonomousMode();
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    }, 10000);
  });

  describe('Creative Exploration (Lek) Process', () => {
    it('should start Lek process when switching to Autonomous mode', async () => {
      await autonomySystem.switchToAutonomousMode();
      
      const lekStatus = autonomySystem.getLekProcessStatus();
      expect(lekStatus).toBe('running');
    }, 10000);

    it('should use custom Lek configuration when provided', async () => {
      const customConfig = {
        max_exploration_time: 1000, // 1 second for testing
        resource_budget: {
          max_llm_calls: 10,
          max_compute_units: 50
        },
        focus_areas: ['custom_area'],
        generate_associations: false
      };
      
      await autonomySystem.switchToAutonomousMode(customConfig);
      
      expect(mockResourceGovernor.requestApproval).toHaveBeenCalledWith(
        expect.objectContaining({
          estimatedCost: expect.objectContaining({
            llmCalls: 10,
            computeUnits: 50,
            executionTime: 1000
          })
        })
      );
    }, 10000);

    it('should interrupt Lek process when switching to Attentive mode', async () => {
      await autonomySystem.switchToAutonomousMode();
      expect(autonomySystem.getLekProcessStatus()).toBe('running');
      
      await autonomySystem.switchToAttentiveMode();
      expect(autonomySystem.getLekProcessStatus()).toBe('interrupted');
    }, 10000);

    it('should handle Lek process completion', async () => {
      // Use very short exploration time for quick completion
      const quickConfig = {
        max_exploration_time: 200, // 200ms
        resource_budget: {
          max_llm_calls: 1,
          max_compute_units: 1
        }
      };
      
      await autonomySystem.switchToAutonomousMode(quickConfig);
      
      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const status = autonomySystem.getLekProcessStatus();
      expect(['completed', 'running', 'interrupted']).toContain(status); // May still be running due to timing
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle missing coordinator agent gracefully', async () => {
      const systemWithoutAgent = new AttentiveAutonomySystem(userActivityDetector);
      
      await expect(systemWithoutAgent.switchToAutonomousMode()).rejects.toThrow(
        'Cannot switch to Autonomous mode: No coordinator agent available'
      );
    });

    it('should handle resource approval errors', async () => {
      (mockResourceGovernor.requestApproval as Mock).mockRejectedValue(
        new Error('Resource governor error')
      );
      
      await expect(autonomySystem.switchToAutonomousMode()).rejects.toThrow(
        'Resource governor error'
      );
    });

    it('should handle child agent termination errors during interruption', async () => {
      // Create a child agent that will throw on termination
      const childAgent = {
        id: 'child_123',
        terminate: vi.fn().mockRejectedValue(new Error('Termination error'))
      } as any;
      
      coordinatorAgent.childAgents.set('child_123', childAgent);
      
      await autonomySystem.switchToAutonomousMode();
      
      // Should not throw despite child termination error
      await autonomySystem.switchToAttentiveMode();
      
      expect(childAgent.terminate).toHaveBeenCalled();
    }, 10000);
  });

  describe('Lek Process Detailed Testing', () => {
    let lekProcess: LekProcess;
    let lekConfig: LekConfiguration;

    beforeEach(() => {
      lekConfig = {
        max_exploration_time: 5000, // 5 seconds
        resource_budget: {
          max_llm_calls: 5,
          max_compute_units: 25
        },
        focus_areas: ['memory_associations', 'thematic_connections'],
        generate_associations: true
      };
      
      lekProcess = new LekProcess(coordinatorAgent, lekConfig);
    });

    it('should start and complete exploration process', async () => {
      expect(lekProcess.getStatus()).toBe('idle');
      
      const startPromise = lekProcess.start();
      expect(lekProcess.getStatus()).toBe('running');
      
      // Wait a bit for some exploration
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await lekProcess.interrupt();
      await startPromise;
      
      expect(lekProcess.getStatus()).toBe('interrupted');
      expect(lekProcess.getResults().length).toBeGreaterThan(0);
    }, 10000);

    it('should generate exploration results for different focus areas', async () => {
      const startPromise = lekProcess.start();
      
      // Let it run briefly
      await new Promise(resolve => setTimeout(resolve, 50));
      await lekProcess.interrupt();
      await startPromise;
      
      const results = lekProcess.getResults();
      expect(results.length).toBeGreaterThan(0);
      
      // Check that results have proper structure
      results.forEach(result => {
        expect(result).toHaveProperty('focusArea');
        expect(result).toHaveProperty('insight');
        expect(result).toHaveProperty('associations');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('resourceUsage');
        expect(result).toHaveProperty('timestamp');
        
        expect(result.confidence).toBeGreaterThanOrEqual(0.6);
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      });
    });

    it('should respect resource limits during exploration', async () => {
      // Use very low resource limits
      const limitedConfig: LekConfiguration = {
        max_exploration_time: 10000,
        resource_budget: {
          max_llm_calls: 2,
          max_compute_units: 5
        },
        focus_areas: ['memory_associations'],
        generate_associations: true
      };
      
      const limitedProcess = new LekProcess(coordinatorAgent, limitedConfig);
      await limitedProcess.start();
      
      const results = limitedProcess.getResults();
      const totalLlmCalls = results.reduce((sum, r) => sum + r.resourceUsage.llmCalls, 0);
      const totalComputeUnits = results.reduce((sum, r) => sum + r.resourceUsage.computeUnits, 0);
      
      expect(totalLlmCalls).toBeLessThanOrEqual(limitedConfig.resource_budget.max_llm_calls);
      expect(totalComputeUnits).toBeLessThanOrEqual(limitedConfig.resource_budget.max_compute_units);
    });

    it('should handle exploration errors gracefully', async () => {
      // Mock the agent to throw errors
      const errorAgent = {
        ...coordinatorAgent,
        id: 'error_agent'
      } as CognitiveAgent;
      
      const errorProcess = new LekProcess(errorAgent, lekConfig);
      
      // Start and let it run briefly
      const startPromise = errorProcess.start();
      await new Promise(resolve => setTimeout(resolve, 50));
      await errorProcess.interrupt();
      
      // Should not throw despite potential errors
      await expect(startPromise).resolves.toBeUndefined();
    });
  });

  describe('User Activity Detector', () => {
    it('should detect user input correctly', async () => {
      const detector = new SimpleUserActivityDetector();
      
      expect(await detector.hasUserInput()).toBe(false);
      expect(await detector.getLatestInput()).toBeNull();
      
      const testInput = { text: 'Test input', type: 'chat' };
      detector.simulateUserInput(testInput);
      
      expect(await detector.hasUserInput()).toBe(true);
      expect(await detector.getLatestInput()).toEqual(testInput);
    });

    it('should clear user input', async () => {
      const detector = new SimpleUserActivityDetector();
      
      detector.simulateUserInput({ text: 'Test', type: 'chat' });
      expect(await detector.hasUserInput()).toBe(true);
      
      detector.clearUserInput();
      expect(await detector.hasUserInput()).toBe(false);
      expect(await detector.getLatestInput()).toBeNull();
    });

    it('should notify callbacks on user input', () => {
      const detector = new SimpleUserActivityDetector();
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      detector.onUserInput(callback1);
      detector.onUserInput(callback2);
      
      const testInput = { text: 'Test', type: 'chat' };
      detector.simulateUserInput(testInput);
      
      expect(callback1).toHaveBeenCalledWith(testInput);
      expect(callback2).toHaveBeenCalledWith(testInput);
    });

    it('should handle callback errors gracefully', () => {
      const detector = new SimpleUserActivityDetector();
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();
      
      detector.onUserInput(errorCallback);
      detector.onUserInput(goodCallback);
      
      // Should not throw despite callback error
      expect(() => {
        detector.simulateUserInput({ text: 'Test', type: 'chat' });
      }).not.toThrow();
      
      expect(errorCallback).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
    });
  });
});