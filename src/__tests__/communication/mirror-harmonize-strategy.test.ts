import { describe, it, expect, beforeEach } from 'vitest';
import { MirrorHarmonizeStrategy, AdaptTriggerInfo, CommunicationUtils } from '../../lib/communication/mirror-harmonize-strategy';
import { UserState, AgentState, UserInput, AgentResponse, RelationalDelta } from '../../types';

describe('MirrorHarmonizeStrategy', () => {
  let baseUserState: UserState;
  let baseAgentState: AgentState;
  let baseUserInput: UserInput;
  let baseTimestamp: Date;

  beforeEach(() => {
    baseTimestamp = new Date();
    
    baseUserState = {
      fight: 0.3,
      flight: 0.2,
      fixes: 0.7,
      timestamp: baseTimestamp,
      confidence: 0.8
    };

    baseAgentState = {
      cognitive_phase: 'EMERGE',
      resonance: 0.6,
      confidence: 0.7,
      timestamp: baseTimestamp
    };

    baseUserInput = {
      text: 'I need help with something',
      type: 'chat',
      timestamp: baseTimestamp
    };
  });

  describe('generateResponse', () => {
    it('should generate listening response for high FIGHT state with low FIXES', () => {
      // Requirement 6.3: Strategic Listening for high emotional states
      const userState: UserState = {
        ...baseUserState,
        fight: 0.8,
        flight: 0.1,
        fixes: 0.3,
        confidence: 0.7
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      expect(response.type).toBe('message');
      expect(response.text).toContain('frustrated');
      expect(response.text.toLowerCase()).toMatch(/listen|focused.*understanding/);
      expect(response.agent_state).toBeDefined();
      expect(response.agent_state!.resonance).toBeGreaterThan(baseAgentState.resonance);
    });

    it('should generate listening response for high FLIGHT state with low FIXES', () => {
      // Requirement 6.3: Strategic Listening for high emotional states
      const userState: UserState = {
        ...baseUserState,
        fight: 0.1,
        flight: 0.8,
        fixes: 0.3,
        confidence: 0.7
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      expect(response.type).toBe('message');
      expect(response.text).toContain('overwhelmed');
      expect(response.text.toLowerCase()).toMatch(/listen|focused.*understanding/);
      expect(response.agent_state).toBeDefined();
    });

    it('should generate mirroring response for high asynchronous delta', () => {
      // Requirement 6.4: Mirror to validate user's perceived state
      const userState: UserState = {
        ...baseUserState,
        fixes: 0.9,
        confidence: 0.9
      };

      const agentState: AgentState = {
        ...baseAgentState,
        confidence: 0.2,
        resonance: 0.3
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        agentState
      );

      expect(response.type).toBe('message');
      expect(response.text).toContain('understand');
      expect(response.agent_state).toBeDefined();
    });

    it('should generate harmonizing response for good alignment', () => {
      // Requirement 6.5: Harmonize to guide toward constructive state
      const userState: UserState = {
        ...baseUserState,
        fixes: 0.7,
        confidence: 0.8
      };

      const agentState: AgentState = {
        ...baseAgentState,
        confidence: 0.7,
        resonance: 0.8
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        agentState
      );

      expect(response.type).toBe('suggestion');
      expect(response.text).toContain('together');
      expect(response.agent_state).toBeDefined();
    });

    it('should update agent state appropriately after response', () => {
      // Verify agent state updates based on interaction
      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        baseUserState,
        baseAgentState
      );

      expect(response.agent_state).toBeDefined();
      expect(response.agent_state!.timestamp).toBeInstanceOf(Date);
      expect(response.agent_state!.cognitive_phase).toBe(baseAgentState.cognitive_phase);
    });

    it('should include timestamp in response', () => {
      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        baseUserState,
        baseAgentState
      );

      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.timestamp.getTime()).toBeGreaterThanOrEqual(baseTimestamp.getTime());
    });
  });

  describe('shouldTriggerAdaptPhase', () => {
    it('should trigger ADAPT phase for high magnitude delta', () => {
      // Requirement 6.6: High delta triggers ADAPT phase
      const highDelta: RelationalDelta = {
        asynchronous_delta: 0.6,
        synchronous_delta: 0.6,
        magnitude: 0.85,
        strategy: 'mirror'
      };

      expect(MirrorHarmonizeStrategy.shouldTriggerAdaptPhase(highDelta)).toBe(true);
    });

    it('should trigger ADAPT phase for high asynchronous delta', () => {
      // Requirement 6.6: High asynchronous delta triggers ADAPT phase
      const highAsyncDelta: RelationalDelta = {
        asynchronous_delta: 0.8,
        synchronous_delta: 0.3,
        magnitude: 0.85,
        strategy: 'mirror'
      };

      expect(MirrorHarmonizeStrategy.shouldTriggerAdaptPhase(highAsyncDelta)).toBe(true);
    });

    it('should not trigger ADAPT phase for low deltas', () => {
      const lowDelta: RelationalDelta = {
        asynchronous_delta: 0.3,
        synchronous_delta: 0.7,
        magnitude: 0.76,
        strategy: 'harmonize'
      };

      expect(MirrorHarmonizeStrategy.shouldTriggerAdaptPhase(lowDelta)).toBe(false);
    });
  });

  describe('generateAdaptTrigger', () => {
    it('should generate comprehensive ADAPT trigger information', () => {
      const highDelta: RelationalDelta = {
        asynchronous_delta: 0.8,
        synchronous_delta: 0.2,
        magnitude: 0.82,
        strategy: 'mirror'
      };

      const userState: UserState = {
        ...baseUserState,
        fight: 0.9,
        confidence: 0.3
      };

      const trigger = MirrorHarmonizeStrategy.generateAdaptTrigger(highDelta, userState);

      expect(trigger.triggered).toBe(true);
      expect(trigger.reason).toContain('delta');
      expect(trigger.delta_magnitude).toBe(0.82);
      expect(trigger.asynchronous_delta).toBe(0.8);
      expect(trigger.synchronous_delta).toBe(0.2);
      expect(trigger.recommendations).toBeInstanceOf(Array);
      expect(trigger.recommendations.length).toBeGreaterThan(0);
      expect(trigger.timestamp).toBeInstanceOf(Date);
    });

    it('should provide specific recommendations for high FIGHT state', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.5,
        synchronous_delta: 0.2,
        magnitude: 0.54,
        strategy: 'listen'
      };

      const userState: UserState = {
        ...baseUserState,
        fight: 0.8,
        confidence: 0.4
      };

      const trigger = MirrorHarmonizeStrategy.generateAdaptTrigger(delta, userState);

      expect(trigger.recommendations).toContain('Switch to pure listening mode - avoid solutions');
      expect(trigger.recommendations).toContain('Validate user frustration without defensiveness');
    });

    it('should provide specific recommendations for high FLIGHT state', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.5,
        synchronous_delta: 0.2,
        magnitude: 0.54,
        strategy: 'listen'
      };

      const userState: UserState = {
        ...baseUserState,
        flight: 0.8,
        confidence: 0.4
      };

      const trigger = MirrorHarmonizeStrategy.generateAdaptTrigger(delta, userState);

      expect(trigger.recommendations).toContain('Create safe space for user expression');
      expect(trigger.recommendations).toContain('Reduce pressure and allow user to set pace');
    });

    it('should provide recommendations for low confidence', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.5,
        synchronous_delta: 0.2,
        magnitude: 0.54,
        strategy: 'mirror'
      };

      const userState: UserState = {
        ...baseUserState,
        confidence: 0.2
      };

      const trigger = MirrorHarmonizeStrategy.generateAdaptTrigger(delta, userState);

      expect(trigger.recommendations).toContain('Build user confidence through validation');
      expect(trigger.recommendations).toContain('Avoid overwhelming with options or complexity');
    });
  });

  describe('emotional validation and state reflection', () => {
    it('should validate high FIGHT state appropriately', () => {
      const userState: UserState = {
        ...baseUserState,
        fight: 0.8,
        flight: 0.1,
        fixes: 0.2
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      expect(response.text).toContain('frustrated');
    });

    it('should validate high FLIGHT state appropriately', () => {
      const userState: UserState = {
        ...baseUserState,
        fight: 0.1,
        flight: 0.8,
        fixes: 0.2
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      expect(response.text).toContain('overwhelmed');
    });

    it('should acknowledge high FIXES state appropriately', () => {
      const userState: UserState = {
        ...baseUserState,
        fight: 0.1,
        flight: 0.1,
        fixes: 0.8
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      // Should contain problem-solving or solution-oriented language
      expect(response.text.toLowerCase()).toMatch(/solution|approach|help|work.*together/);
    });
  });

  describe('agent state updates', () => {
    it('should increase resonance when using listening strategy', () => {
      const userState: UserState = {
        ...baseUserState,
        fight: 0.8,
        fixes: 0.2
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        baseAgentState
      );

      expect(response.agent_state!.resonance).toBeGreaterThan(baseAgentState.resonance);
    });

    it('should adjust confidence based on delta magnitude', () => {
      // Test with low delta (should maintain or increase confidence)
      const userState: UserState = {
        ...baseUserState,
        fixes: 0.7,
        confidence: 0.8
      };

      const agentState: AgentState = {
        ...baseAgentState,
        confidence: 0.7,
        resonance: 0.9
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        baseUserInput,
        userState,
        agentState
      );

      // Agent state should be updated with new timestamp
      expect(response.agent_state!.timestamp).toBeInstanceOf(Date);
      expect(response.agent_state!.confidence).toBeGreaterThan(0);
      expect(response.agent_state!.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('CommunicationUtils', () => {
  describe('analyzeEffectiveness', () => {
    it('should analyze communication effectiveness correctly', () => {
      const responses: AgentResponse[] = [
        {
          text: 'Response 1',
          type: 'message',
          timestamp: new Date()
        },
        {
          text: 'Response 2',
          type: 'suggestion',
          timestamp: new Date()
        },
        {
          text: 'Response 3',
          type: 'message',
          timestamp: new Date()
        }
      ];

      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.8, synchronous_delta: 0.3, magnitude: 0.85, strategy: 'mirror' },
        { asynchronous_delta: 0.4, synchronous_delta: 0.7, magnitude: 0.81, strategy: 'harmonize' },
        { asynchronous_delta: 0.2, synchronous_delta: 0.8, magnitude: 0.82, strategy: 'harmonize' }
      ];

      const analysis = CommunicationUtils.analyzeEffectiveness(responses, deltas);

      expect(analysis.overall_effectiveness).toBeGreaterThan(0);
      expect(analysis.overall_effectiveness).toBeLessThanOrEqual(1);
      expect(analysis.strategy_distribution.mirror).toBeCloseTo(1/3, 1);
      expect(analysis.strategy_distribution.harmonize).toBeCloseTo(2/3, 1);
      expect(analysis.strategy_distribution.listen).toBe(0);
      expect(analysis.improvement_trend).toBeDefined();
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should handle insufficient data gracefully', () => {
      const analysis = CommunicationUtils.analyzeEffectiveness([], []);

      expect(analysis.overall_effectiveness).toBe(0);
      expect(analysis.strategy_distribution.listen).toBe(0);
      expect(analysis.strategy_distribution.mirror).toBe(0);
      expect(analysis.strategy_distribution.harmonize).toBe(0);
      expect(analysis.improvement_trend).toBe(0);
      expect(analysis.recommendations).toContain('Insufficient data for analysis');
    });

    it('should detect high listening mode usage', () => {
      const responses: AgentResponse[] = Array(5).fill({
        text: 'Listening response',
        type: 'message',
        timestamp: new Date()
      });

      const deltas: RelationalDelta[] = Array(5).fill({
        asynchronous_delta: 0.3,
        synchronous_delta: 0.7,
        magnitude: 0.76,
        strategy: 'listen'
      });

      const analysis = CommunicationUtils.analyzeEffectiveness(responses, deltas);

      expect(analysis.strategy_distribution.listen).toBe(1);
      expect(analysis.recommendations).toContain(
        'High listening mode usage - ensure progression to problem-solving when appropriate'
      );
    });

    it('should detect low listening mode usage', () => {
      const responses: AgentResponse[] = Array(5).fill({
        text: 'Harmonizing response',
        type: 'suggestion',
        timestamp: new Date()
      });

      const deltas: RelationalDelta[] = Array(5).fill({
        asynchronous_delta: 0.2,
        synchronous_delta: 0.8,
        magnitude: 0.82,
        strategy: 'harmonize'
      });

      const analysis = CommunicationUtils.analyzeEffectiveness(responses, deltas);

      expect(analysis.strategy_distribution.listen).toBe(0);
      expect(analysis.recommendations).toContain(
        'Low listening mode usage - may need more empathy in high-emotion situations'
      );
    });

    it('should detect high harmonizing with low effectiveness', () => {
      const responses: AgentResponse[] = Array(5).fill({
        text: 'Harmonizing response',
        type: 'suggestion',
        timestamp: new Date()
      });

      const deltas: RelationalDelta[] = Array(5).fill({
        asynchronous_delta: 0.7,
        synchronous_delta: 0.4,
        magnitude: 0.81,
        strategy: 'harmonize'
      });

      const analysis = CommunicationUtils.analyzeEffectiveness(responses, deltas);

      expect(analysis.strategy_distribution.harmonize).toBe(1);
      expect(analysis.overall_effectiveness).toBeLessThan(0.5);
      expect(analysis.recommendations).toContain(
        'High harmonizing with low effectiveness - may be rushing to solutions'
      );
    });
  });
});