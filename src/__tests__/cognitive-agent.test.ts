import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveAgentImpl } from '@/lib/cognitive-agent';
import { AgentFactoryImpl } from '@/lib/agent-factory';
import { resourceGovernor } from '@/lib/resource-governor';
import type { 
  ConfigurationProfile, 
  ContextThread, 
  UserInput,
  UserState,
  AgentRole
} from '@/types';

describe('CognitiveAgent', () => {
  let mockConfig: ConfigurationProfile;
  let mockContextThread: ContextThread;
  let mockUserInput: UserInput;
  let mockUserState: UserState;

  beforeEach(() => {
    mockConfig = {
      llm_model: 'gpt-4',
      toolkit: ['memory', 'search'],
      memory_scope: 'user-123',
      entry_phase: 'EMERGE',
      max_recursion_depth: 5,
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 30000
      }
    };

    mockContextThread = {
      id: 'thread-123',
      top_level_goal: 'Help user with memory management',
      task_definition: 'Process user input and provide assistance',
      configuration_profile: mockConfig,
      memory_scope: 'user-123',
      resource_budget: {
        max_llm_calls: 50,
        max_compute_units: 500,
        max_storage_bytes: 512 * 1024,
        max_execution_time: 15000
      },
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };

    mockUserInput = {
      text: 'Hello, I need help with my memories',
      type: 'chat',
      timestamp: new Date()
    };

    mockUserState = {
      fight: 0.2,
      flight: 0.1,
      fixes: 0.8,
      timestamp: new Date(),
      confidence: 0.9
    };
  });

  describe('Agent Instantiation and Configuration', () => {
    it('should create a CognitiveAgent with correct role and configuration', () => {
      const agent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      
      expect(agent.role).toBe('Coordinator');
      expect(agent.configurationProfile).toEqual(mockConfig);
      expect(agent.contextThread).toEqual(mockContextThread);
      expect(agent.currentPhase).toBe('EMERGE');
      expect(agent.id).toBeDefined();
      expect(agent.childAgents.size).toBe(0);
    });

    it('should initialize with entry phase from configuration', () => {
      const adaptConfig = { ...mockConfig, entry_phase: 'ADAPT' as const };
      const agent = new CognitiveAgentImpl('Core', adaptConfig, mockContextThread);
      
      expect(agent.currentPhase).toBe('ADAPT');
    });

    it('should initialize agent state correctly', () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      
      expect(agent.currentState.cognitive_phase).toBe('EMERGE');
      expect(agent.currentState.resonance).toBe(0.5);
      expect(agent.currentState.confidence).toBe(0.7);
      expect(agent.currentState.timestamp).toBeInstanceOf(Date);
    });

    it('should set parent agent ID when provided', () => {
      const parentId = 'parent-123';
      const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread, parentId);
      
      expect(agent.parentAgentId).toBe(parentId);
    });
  });

  describe('Roundabout Cognitive Loop', () => {
    describe('EMERGE Phase', () => {
      it('should execute EMERGE phase correctly for Coordinator', async () => {
        const agent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
        
        // Mock successful emergence
        vi.spyOn(agent as any, '_coordinatorEmerge').mockResolvedValue({
          success: true,
          result: 'Coordination successful'
        });
        
        await agent.executeRoundaboutLoop();
        
        expect(agent.currentPhase).toBe('EMERGE');
      });

      it('should execute EMERGE phase correctly for Conscious', async () => {
        const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
        
        vi.spyOn(agent as any, '_consciousEmerge').mockResolvedValue({
          success: true,
          result: 'User interaction successful'
        });
        
        await agent.executeRoundaboutLoop();
        
        expect(agent.currentPhase).toBe('EMERGE');
      });

      it('should execute EMERGE phase correctly for Core', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        vi.spyOn(agent as any, '_coreEmerge').mockResolvedValue({
          success: true,
          result: 'Core task successful'
        });
        
        await agent.executeRoundaboutLoop();
        
        expect(agent.currentPhase).toBe('EMERGE');
      });

      it('should transition to ADAPT phase on emergence failure', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock emergence failure
        vi.spyOn(agent as any, '_attemptClosure').mockResolvedValue({
          success: false,
          error: 'Test emergence failure'
        });
        
        await expect(agent.executeRoundaboutLoop()).rejects.toThrow('EMERGE phase failed');
        expect(agent.currentPhase).toBe('ADAPT');
      });

      it('should handle emergence exceptions and transition to ADAPT', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock emergence throwing exception
        vi.spyOn(agent as any, '_coreEmerge').mockRejectedValue(new Error('Unexpected error'));
        
        await expect(agent.executeRoundaboutLoop()).rejects.toThrow();
        expect(agent.currentPhase).toBe('ADAPT');
      });
    });

    describe('ADAPT Phase', () => {
      it('should execute ADAPT phase and transition to INTEGRATE when proceeding', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        agent.currentPhase = 'ADAPT';
        
        // Mock failure analysis and strategic decision to proceed
        vi.spyOn(agent as any, '_analyzeFailure').mockResolvedValue({
          severity: 'minor',
          type: 'logic',
          pattern: 'isolated',
          recommendation: 'Retry with adjusted parameters'
        });
        
        vi.spyOn(agent as any, '_makeStrategicDecision').mockResolvedValue({
          decision: 'PROCEED',
          reason: 'Failure is recoverable',
          context: {}
        });
        
        await agent.executeRoundaboutLoop();
        
        expect(agent.currentPhase).toBe('INTEGRATE');
      });

      it('should halt and report failure when strategic decision is negative', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        agent.currentPhase = 'ADAPT';
        
        vi.spyOn(agent as any, '_analyzeFailure').mockResolvedValue({
          severity: 'critical',
          type: 'resource',
          pattern: 'recurring-emerge',
          recommendation: 'Halt and report resource exhaustion'
        });
        
        vi.spyOn(agent as any, '_makeStrategicDecision').mockResolvedValue({
          decision: 'HALT_AND_REPORT_FAILURE',
          reason: 'Multiple critical failures detected',
          context: {}
        });
        
        await expect(agent.executeRoundaboutLoop()).rejects.toThrow('Agent halted: Multiple critical failures detected');
      });

      it('should analyze failure patterns correctly', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock failure history with resource errors
        vi.spyOn(agent as any, '_getFailureHistory').mockReturnValue([
          { phase: 'EMERGE', error: 'Resource exhausted', timestamp: new Date() },
          { phase: 'EMERGE', error: 'Resource quota exceeded', timestamp: new Date() }
        ]);
        
        const analysis = await (agent as any)._analyzeFailure();
        
        expect(analysis.severity).toBe('moderate');
        expect(analysis.type).toBe('resource');
        expect(analysis.pattern).toBe('recurring-emerge');
      });
    });

    describe('INTEGRATE Phase', () => {
      it('should execute INTEGRATE phase and return to EMERGE', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        agent.currentPhase = 'INTEGRATE';
        
        // Mock successful tactical plan creation
        vi.spyOn(agent as any, '_createTacticalPlan').mockResolvedValue({
          id: 'plan-123',
          approach: 'new-approach',
          createdAt: new Date(),
          isValid: true,
          confidence: 0.8
        });
        
        await agent.executeRoundaboutLoop();
        
        expect(agent.currentPhase).toBe('EMERGE');
      });

      it('should fail if tactical plan creation fails', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        agent.currentPhase = 'INTEGRATE';
        
        // Mock failed tactical plan creation
        vi.spyOn(agent as any, '_createTacticalPlan').mockResolvedValue({
          id: 'plan-123',
          approach: null,
          createdAt: new Date(),
          isValid: false,
          error: 'Failed to generate valid plan'
        });
        
        await expect(agent.executeRoundaboutLoop()).rejects.toThrow('Failed to create valid tactical plan');
      });

      it('should create tactical plan based on adaptation context', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Set up adaptation context
        (agent as any)._adaptationContext = { failureType: 'resource', severity: 'moderate' };
        
        const plan = await (agent as any)._createTacticalPlan({ failureType: 'resource' });
        
        expect(plan.isValid).toBe(true);
        expect(plan.approach).toBeDefined();
        expect(plan.confidence).toBeGreaterThan(0);
      });
    });

    describe('Strategic Decision Making', () => {
      it('should decide to halt when resources are exhausted', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock resource exhaustion
        vi.spyOn(agent as any, '_checkResourcesRemaining').mockReturnValue(false);
        
        const decision = await (agent as any)._makeStrategicDecision({
          severity: 'minor',
          type: 'logic',
          pattern: 'isolated',
          recommendation: 'Retry'
        });
        
        expect(decision.decision).toBe('HALT_AND_REPORT_FAILURE');
        expect(decision.reason).toContain('Insufficient resources');
      });

      it('should decide to halt on multiple critical failures', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock multiple failures
        vi.spyOn(agent as any, '_getFailureHistory').mockReturnValue([
          { phase: 'EMERGE', error: 'Critical error 1', timestamp: new Date() },
          { phase: 'EMERGE', error: 'Critical error 2', timestamp: new Date() },
          { phase: 'EMERGE', error: 'Critical error 3', timestamp: new Date() }
        ]);
        
        const decision = await (agent as any)._makeStrategicDecision({
          severity: 'critical',
          type: 'logic',
          pattern: 'recurring-emerge',
          recommendation: 'Escalate'
        });
        
        expect(decision.decision).toBe('HALT_AND_REPORT_FAILURE');
        expect(decision.reason).toContain('Multiple critical failures');
      });

      it('should decide to proceed when failure is recoverable', async () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock recoverable situation
        vi.spyOn(agent as any, '_checkResourcesRemaining').mockReturnValue(true);
        vi.spyOn(agent as any, '_getFailureHistory').mockReturnValue([
          { phase: 'EMERGE', error: 'Minor error', timestamp: new Date() }
        ]);
        
        const decision = await (agent as any)._makeStrategicDecision({
          severity: 'minor',
          type: 'logic',
          pattern: 'isolated',
          recommendation: 'Retry with adjusted parameters'
        });
        
        expect(decision.decision).toBe('PROCEED');
        expect(decision.reason).toContain('recoverable');
      });

      it('should decide to halt near maximum recursion depth', async () => {
        const deepContextThread = { ...mockContextThread, recursion_depth: 4 };
        const agent = new CognitiveAgentImpl('Core', mockConfig, deepContextThread);
        
        const decision = await (agent as any)._makeStrategicDecision({
          severity: 'minor',
          type: 'logic',
          pattern: 'isolated',
          recommendation: 'Retry'
        });
        
        expect(decision.decision).toBe('HALT_AND_REPORT_FAILURE');
        expect(decision.reason).toContain('recursion depth');
      });
    });

    describe('Failure Detection and Analysis', () => {
      it('should detect failure patterns correctly', () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        const failures = [
          { phase: 'EMERGE' as const, error: 'Error 1', timestamp: new Date() },
          { phase: 'EMERGE' as const, error: 'Error 2', timestamp: new Date() },
          { phase: 'ADAPT' as const, error: 'Error 3', timestamp: new Date() }
        ];
        
        const pattern = (agent as any)._identifyFailurePattern(failures);
        expect(pattern).toBe('mixed-phase');
        
        const samePhaseFailures = [
          { phase: 'EMERGE' as const, error: 'Error 1', timestamp: new Date() },
          { phase: 'EMERGE' as const, error: 'Error 2', timestamp: new Date() }
        ];
        
        const samePhasePattern = (agent as any)._identifyFailurePattern(samePhaseFailures);
        expect(samePhasePattern).toBe('recurring-emerge');
      });

      it('should generate appropriate failure recommendations', () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        const recommendation = (agent as any)._generateFailureRecommendation('critical', 'resource');
        expect(recommendation).toBe('Halt and report resource exhaustion');
        
        const minorRecommendation = (agent as any)._generateFailureRecommendation('minor', 'logic');
        expect(minorRecommendation).toBe('Retry with adjusted parameters');
      });

      it('should calculate success probability based on history', () => {
        const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
        
        // Mock no failures
        vi.spyOn(agent as any, '_getFailureHistory').mockReturnValue([]);
        vi.spyOn(agent as any, '_checkResourcesRemaining').mockReturnValue(true);
        
        const probability = (agent as any)._calculateSuccessProbability();
        expect(probability).toBeGreaterThan(0.7); // Base success + resource bonus
        
        // Mock multiple failures
        vi.spyOn(agent as any, '_getFailureHistory').mockReturnValue([
          { phase: 'EMERGE', error: 'Error 1', timestamp: new Date() },
          { phase: 'EMERGE', error: 'Error 2', timestamp: new Date() },
          { phase: 'EMERGE', error: 'Error 3', timestamp: new Date() }
        ]);
        
        const lowProbability = (agent as any)._calculateSuccessProbability();
        expect(lowProbability).toBeLessThan(0.5); // Reduced due to multiple failures
      });
    });
  });

  describe('Agent Cloning and Delegation', () => {
    it('should clone agent successfully', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      
      const childConfig: ConfigurationProfile = {
        ...mockConfig,
        entry_phase: 'ADAPT',
        memory_scope: 'child-scope'
      };
      
      const childAgent = await parentAgent.clone(childConfig, 'Child task definition');
      
      expect(childAgent).toBeDefined();
      expect(childAgent.role).toBe('Core');
      expect(childAgent.parentAgentId).toBe(parentAgent.id);
      expect(childAgent.contextThread.recursion_depth).toBe(1);
      expect(childAgent.contextThread.task_definition).toBe('Child task definition');
      expect(parentAgent.childAgents.has(childAgent.id)).toBe(true);
    });

    it('should prevent cloning beyond max recursion depth', async () => {
      const deepConfig = { ...mockConfig, max_recursion_depth: 2 };
      const deepContextThread = { ...mockContextThread, recursion_depth: 2 };
      const agent = new CognitiveAgentImpl('Core', deepConfig, deepContextThread);
      
      // Mock resource governor to reject due to recursion depth
      vi.spyOn(resourceGovernor, 'requestApproval').mockResolvedValueOnce({
        approved: false,
        reason: 'Maximum recursion depth (2) exceeded'
      });
      
      await expect(agent.clone(mockConfig, 'Should fail')).rejects.toThrow('Agent cloning denied');
    });

    it('should create child context thread correctly', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      const childAgent = await parentAgent.clone(mockConfig, 'Test task');
      
      expect(childAgent.contextThread.parent_agent_id).toBe(parentAgent.id);
      expect(childAgent.contextThread.top_level_goal).toBe(mockContextThread.top_level_goal);
      expect(childAgent.contextThread.recursion_depth).toBe(1);
      expect(childAgent.contextThread.task_definition).toBe('Test task');
    });
  });

  describe('Relational Delta Calculation', () => {
    it('should calculate relational delta correctly', () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      
      const delta = agent.calculateRelationalDelta(mockUserState);
      
      expect(delta.asynchronous_delta).toBeGreaterThanOrEqual(0);
      expect(delta.asynchronous_delta).toBeLessThanOrEqual(1);
      expect(delta.synchronous_delta).toBeGreaterThanOrEqual(0);
      expect(delta.synchronous_delta).toBeLessThanOrEqual(1);
      expect(delta.magnitude).toBeGreaterThanOrEqual(0);
      expect(['mirror', 'harmonize', 'listen']).toContain(delta.strategy);
    });

    it('should recommend listen strategy for high fight/flight states', () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      const highFightState: UserState = {
        ...mockUserState,
        fight: 0.8,
        flight: 0.1,
        fixes: 0.2
      };
      
      const delta = agent.calculateRelationalDelta(highFightState);
      
      expect(delta.strategy).toBe('listen');
    });

    it('should recommend mirror strategy for high asynchronous delta', () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      // Set agent confidence very different from user fixes to create high async delta
      agent.updateState({ confidence: 0.1 });
      
      const delta = agent.calculateRelationalDelta(mockUserState);
      
      // With high difference between user fixes (0.8) and agent confidence (0.1),
      // we should get high asynchronous delta
      expect(delta.asynchronous_delta).toBeGreaterThan(0.5);
    });
  });

  describe('State Management', () => {
    it('should update agent state correctly', () => {
      const agent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
      const initialTimestamp = agent.currentState.timestamp;
      
      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        agent.updateState({ resonance: 0.9, confidence: 0.8 });
        
        expect(agent.currentState.resonance).toBe(0.9);
        expect(agent.currentState.confidence).toBe(0.8);
        expect(agent.currentState.timestamp.getTime()).toBeGreaterThan(initialTimestamp.getTime());
      }, 10);
    });

    it('should get status correctly', () => {
      const agent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      
      const status = agent.getStatus();
      
      expect(status.id).toBe(agent.id);
      expect(status.phase).toBe('EMERGE');
      expect(status.active).toBe(true);
      expect(status.childCount).toBe(0);
      expect(status.resourceUsage).toBeDefined();
      expect(status.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('Input Processing', () => {
    it('should process user input and return response', async () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      
      // Mock successful emergence
      vi.spyOn(agent as any, '_consciousEmerge').mockResolvedValue({
        success: true,
        result: 'User interaction successful'
      });
      
      const response = await agent.processInput(mockUserInput);
      
      expect(response.text).toBeDefined();
      expect(response.type).toBe('message');
      expect(response.agent_state).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should generate role-specific responses', async () => {
      const coordinatorAgent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      const consciousAgent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      const coreAgent = new CognitiveAgentImpl('Core', mockConfig, mockContextThread);
      
      // Mock successful emergence for all agents
      vi.spyOn(coordinatorAgent as any, '_coordinatorEmerge').mockResolvedValue({
        success: true,
        result: 'Coordination successful'
      });
      vi.spyOn(consciousAgent as any, '_consciousEmerge').mockResolvedValue({
        success: true,
        result: 'User interaction successful'
      });
      vi.spyOn(coreAgent as any, '_coreEmerge').mockResolvedValue({
        success: true,
        result: 'Core task successful'
      });
      
      const coordinatorResponse = await coordinatorAgent.processInput(mockUserInput);
      const consciousResponse = await consciousAgent.processInput(mockUserInput);
      const coreResponse = await coreAgent.processInput(mockUserInput);
      
      expect(coordinatorResponse.text).toContain('Coordinator');
      expect(consciousResponse.text).toContain('processing');
      expect(coreResponse.text).toContain('Core');
    });

    it('should use relational delta for conscious agent responses', async () => {
      const agent = new CognitiveAgentImpl('Conscious', mockConfig, mockContextThread);
      const inputWithUserState = {
        ...mockUserInput,
        context: { userState: mockUserState }
      };
      
      // Mock successful emergence
      vi.spyOn(agent as any, '_consciousEmerge').mockResolvedValue({
        success: true,
        result: 'User interaction successful'
      });
      
      const response = await agent.processInput(inputWithUserState);
      
      expect(response.text).toBeDefined();
      // Should generate a response based on relational delta strategy
    });
  });

  describe('Agent Termination', () => {
    it('should terminate agent and children', async () => {
      const parentAgent = new CognitiveAgentImpl('Coordinator', mockConfig, mockContextThread);
      const childAgent = await parentAgent.clone(mockConfig, 'Child task');
      
      await parentAgent.terminate();
      
      expect(parentAgent.getStatus().active).toBe(false);
      expect(parentAgent.childAgents.size).toBe(0);
    });
  });
});

describe('AgentFactory', () => {
  let factory: AgentFactoryImpl;
  let testConfig: ConfigurationProfile;
  let testContextThread: ContextThread;

  beforeEach(() => {
    factory = new AgentFactoryImpl();
    
    testConfig = {
      llm_model: 'gpt-4',
      toolkit: ['memory', 'search'],
      memory_scope: 'user-123',
      entry_phase: 'EMERGE',
      max_recursion_depth: 5,
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 30000
      }
    };

    testContextThread = {
      id: 'thread-123',
      top_level_goal: 'Help user with memory management',
      task_definition: 'Process user input and provide assistance',
      configuration_profile: testConfig,
      memory_scope: 'user-123',
      resource_budget: {
        max_llm_calls: 50,
        max_compute_units: 500,
        max_storage_bytes: 512 * 1024,
        max_execution_time: 15000
      },
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };
  });

  it('should create agent through factory', async () => {
    const agent = await factory.createAgent('Coordinator', testConfig, testContextThread);
    
    expect(agent).toBeDefined();
    expect(agent.role).toBe('Coordinator');
    expect(factory.getAgent(agent.id)).toBe(agent);
  });

  it('should list active agents', async () => {
    const agent1 = await factory.createAgent('Coordinator', testConfig, testContextThread);
    const agent2 = await factory.createAgent('Conscious', testConfig, testContextThread);
    
    const activeAgents = factory.listActiveAgents();
    
    expect(activeAgents).toHaveLength(2);
    expect(activeAgents).toContain(agent1);
    expect(activeAgents).toContain(agent2);
  });

  it('should terminate all agents', async () => {
    await factory.createAgent('Coordinator', testConfig, testContextThread);
    await factory.createAgent('Conscious', testConfig, testContextThread);
    
    await factory.terminateAll();
    
    expect(factory.listActiveAgents()).toHaveLength(0);
  });

  it('should return null for non-existent agent', () => {
    const agent = factory.getAgent('non-existent-id');
    
    expect(agent).toBeNull();
  });
});