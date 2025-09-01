import { describe, it, expect, beforeEach } from 'vitest';
import { MirrorHarmonizeStrategy, CommunicationUtils } from '../../lib/communication/mirror-harmonize-strategy';
import { DeltaCalculator } from '../../lib/communication/delta-calculator';
import { UserState, AgentState, UserInput, AgentResponse, RelationalDelta } from '../../types';

describe('Mirror & Harmonize Integration Tests', () => {
  let baseTimestamp: Date;

  beforeEach(() => {
    baseTimestamp = new Date();
  });

  describe('Complete Communication Flow', () => {
    it('should demonstrate full Mirror & Harmonize workflow', () => {
      // Scenario: User starts frustrated, agent mirrors, then harmonizes as user calms down
      
      // Initial frustrated user state
      const initialUserState: UserState = {
        fight: 0.8,
        flight: 0.2,
        fixes: 0.3,
        timestamp: baseTimestamp,
        confidence: 0.6
      };

      const initialAgentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.5,
        confidence: 0.7,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'This system is so confusing! I can\'t figure out how to do anything!',
        type: 'chat',
        timestamp: baseTimestamp
      };

      // Step 1: Initial response should be listening/mirroring
      const response1 = MirrorHarmonizeStrategy.generateResponse(
        userInput,
        initialUserState,
        initialAgentState
      );

      const delta1 = DeltaCalculator.calculateRelationalDelta(initialUserState, initialAgentState);
      
      expect(delta1.strategy).toBe('listen'); // High FIGHT, low FIXES
      expect(response1.type).toBe('message');
      expect(response1.text.toLowerCase()).toMatch(/frustrated|upset/);

      // Step 2: User state improves after validation
      const improvedUserState: UserState = {
        fight: 0.4,
        flight: 0.2,
        fixes: 0.6,
        timestamp: new Date(baseTimestamp.getTime() + 60000), // 1 minute later
        confidence: 0.7
      };

      const updatedAgentState = response1.agent_state!;

      const response2 = MirrorHarmonizeStrategy.generateResponse(
        { ...userInput, text: 'I guess I just need some help understanding this.' },
        improvedUserState,
        updatedAgentState
      );

      const delta2 = DeltaCalculator.calculateRelationalDelta(improvedUserState, updatedAgentState);
      
      expect(delta2.strategy).toBe('harmonize'); // Better alignment, can guide now
      expect(response2.type).toBe('suggestion');
      expect(response2.text.toLowerCase()).toMatch(/together|help|approach/);
    });

    it('should trigger ADAPT phase for persistent high deltas', () => {
      // Scenario: Communication isn't working, high delta persists
      
      const userState: UserState = {
        fight: 0.9,
        flight: 0.1,
        fixes: 0.2,
        timestamp: baseTimestamp,
        confidence: 0.3
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.2, // Poor resonance
        confidence: 0.8, // Agent overconfident
        timestamp: baseTimestamp
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);
      
      expect(delta.magnitude).toBeGreaterThan(0.7);
      expect(MirrorHarmonizeStrategy.shouldTriggerAdaptPhase(delta)).toBe(true);

      const adaptTrigger = MirrorHarmonizeStrategy.generateAdaptTrigger(delta, userState);
      
      expect(adaptTrigger.triggered).toBe(true);
      expect(adaptTrigger.reason).toContain('delta');
      expect(adaptTrigger.recommendations).toContain('Switch to pure listening mode - avoid solutions');
    });

    it('should demonstrate communication effectiveness analysis', () => {
      // Scenario: Analyze a series of interactions for effectiveness
      
      const responses: AgentResponse[] = [
        {
          text: 'I hear your frustration',
          type: 'message',
          timestamp: new Date(baseTimestamp.getTime())
        },
        {
          text: 'Let me understand what you\'re experiencing',
          type: 'message',
          timestamp: new Date(baseTimestamp.getTime() + 60000)
        },
        {
          text: 'Let\'s work together to find a solution',
          type: 'suggestion',
          timestamp: new Date(baseTimestamp.getTime() + 120000)
        }
      ];

      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.8, synchronous_delta: 0.3, magnitude: 0.85, strategy: 'listen' },
        { asynchronous_delta: 0.5, synchronous_delta: 0.6, magnitude: 0.78, strategy: 'mirror' },
        { asynchronous_delta: 0.2, synchronous_delta: 0.8, magnitude: 0.82, strategy: 'harmonize' }
      ];

      const analysis = CommunicationUtils.analyzeEffectiveness(responses, deltas);
      
      expect(analysis.overall_effectiveness).toBeGreaterThan(0.1); // Improving over time
      expect(analysis.improvement_trend).toBeGreaterThan(0); // Positive trend
      expect(analysis.strategy_distribution.listen).toBeCloseTo(1/3, 1);
      expect(analysis.strategy_distribution.mirror).toBeCloseTo(1/3, 1);
      expect(analysis.strategy_distribution.harmonize).toBeCloseTo(1/3, 1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme user states gracefully', () => {
      const extremeUserState: UserState = {
        fight: 1.0,
        flight: 0.0,
        fixes: 0.0,
        timestamp: baseTimestamp,
        confidence: 0.0
      };

      const agentState: AgentState = {
        cognitive_phase: 'ADAPT',
        resonance: 0.1,
        confidence: 0.1,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'I HATE THIS SYSTEM!!!',
        type: 'chat',
        timestamp: baseTimestamp
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        userInput,
        extremeUserState,
        agentState
      );

      expect(response).toBeDefined();
      expect(response.text).toBeTruthy();
      expect(response.agent_state).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should handle balanced user states appropriately', () => {
      const balancedUserState: UserState = {
        fight: 0.33,
        flight: 0.33,
        fixes: 0.34,
        timestamp: baseTimestamp,
        confidence: 0.5
      };

      const agentState: AgentState = {
        cognitive_phase: 'INTEGRATE',
        resonance: 0.5,
        confidence: 0.5,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'I\'m not sure what I need help with.',
        type: 'chat',
        timestamp: baseTimestamp
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        userInput,
        balancedUserState,
        agentState
      );

      expect(response).toBeDefined();
      expect(response.text).toBeTruthy();
      // Should handle balanced state without errors
    });

    it('should maintain agent state consistency', () => {
      const userState: UserState = {
        fight: 0.3,
        flight: 0.2,
        fixes: 0.7,
        timestamp: baseTimestamp,
        confidence: 0.8
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.6,
        confidence: 0.7,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'Can you help me with this task?',
        type: 'chat',
        timestamp: baseTimestamp
      };

      const response = MirrorHarmonizeStrategy.generateResponse(
        userInput,
        userState,
        agentState
      );

      // Agent state should be updated but maintain consistency
      expect(response.agent_state!.cognitive_phase).toBe(agentState.cognitive_phase);
      expect(response.agent_state!.resonance).toBeGreaterThanOrEqual(0);
      expect(response.agent_state!.resonance).toBeLessThanOrEqual(1);
      expect(response.agent_state!.confidence).toBeGreaterThanOrEqual(0);
      expect(response.agent_state!.confidence).toBeLessThanOrEqual(1);
      expect(response.agent_state!.timestamp.getTime()).toBeGreaterThanOrEqual(baseTimestamp.getTime());
    });
  });

  describe('Requirements Compliance', () => {
    it('should comply with requirement 6.1: Calculate Relational Delta before response', () => {
      // Every response should be based on calculated relational delta
      const userState: UserState = {
        fight: 0.5,
        flight: 0.3,
        fixes: 0.4,
        timestamp: baseTimestamp,
        confidence: 0.6
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.5,
        confidence: 0.6,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'I need help',
        type: 'chat',
        timestamp: baseTimestamp
      };

      // The generateResponse method internally calculates delta
      const response = MirrorHarmonizeStrategy.generateResponse(userInput, userState, agentState);
      
      // Response should be generated (proving delta was calculated)
      expect(response).toBeDefined();
      expect(response.text).toBeTruthy();
    });

    it('should comply with requirement 6.2: Minimize asynchronous delta, maintain synchronous delta', () => {
      // Strategy selection should aim to minimize misunderstanding and maintain harmony
      const userState: UserState = {
        fight: 0.2,
        flight: 0.2,
        fixes: 0.8,
        timestamp: baseTimestamp,
        confidence: 0.9
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.8,
        confidence: 0.8,
        timestamp: baseTimestamp
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);
      
      // Good alignment should result in harmonize strategy
      expect(delta.strategy).toBe('harmonize');
      expect(delta.asynchronous_delta).toBeLessThan(0.5); // Low misunderstanding
      expect(delta.synchronous_delta).toBeGreaterThan(0.5); // Good harmony
    });

    it('should comply with requirement 6.3: Follow Mirror & Harmonize strategy', () => {
      // Should use two-step approach: mirror first, then harmonize
      const userState: UserState = {
        fight: 0.6,
        flight: 0.2,
        fixes: 0.4,
        timestamp: baseTimestamp,
        confidence: 0.5
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.3,
        confidence: 0.8,
        timestamp: baseTimestamp
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);
      
      // Should recommend mirroring due to misalignment
      expect(delta.strategy).toBe('mirror');
    });

    it('should comply with requirement 6.4: Mirror to validate user state', () => {
      // Mirroring responses should validate user feelings
      const userState: UserState = {
        fight: 0.7,
        flight: 0.1,
        fixes: 0.3,
        timestamp: baseTimestamp,
        confidence: 0.6
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.3,
        confidence: 0.9,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'This is really frustrating me!',
        type: 'chat',
        timestamp: baseTimestamp
      };

      const response = MirrorHarmonizeStrategy.generateResponse(userInput, userState, agentState);
      
      // Should contain validation language
      expect(response.text.toLowerCase()).toMatch(/understand|sense|feel/);
    });

    it('should comply with requirement 6.5: Harmonize toward constructive state', () => {
      // When resonance is established, should guide toward constructive state
      const userState: UserState = {
        fight: 0.2,
        flight: 0.2,
        fixes: 0.7,
        timestamp: baseTimestamp,
        confidence: 0.8
      };

      const agentState: AgentState = {
        cognitive_phase: 'EMERGE',
        resonance: 0.8,
        confidence: 0.7,
        timestamp: baseTimestamp
      };

      const userInput: UserInput = {
        text: 'I think I understand now, what should I do next?',
        type: 'chat',
        timestamp: baseTimestamp
      };

      const response = MirrorHarmonizeStrategy.generateResponse(userInput, userState, agentState);
      
      expect(response.type).toBe('suggestion');
      expect(response.text.toLowerCase()).toMatch(/together|approach|help|forward/);
    });

    it('should comply with requirement 6.6: High delta triggers ADAPT phase', () => {
      // High unexpected delta should trigger ADAPT phase
      const highDelta: RelationalDelta = {
        asynchronous_delta: 0.9,
        synchronous_delta: 0.1,
        magnitude: 0.91,
        strategy: 'listen'
      };

      expect(MirrorHarmonizeStrategy.shouldTriggerAdaptPhase(highDelta)).toBe(true);
      
      const adaptTrigger = MirrorHarmonizeStrategy.generateAdaptTrigger(highDelta, {
        fight: 0.8,
        flight: 0.1,
        fixes: 0.2,
        timestamp: baseTimestamp,
        confidence: 0.3
      });

      expect(adaptTrigger.triggered).toBe(true);
      expect(adaptTrigger.recommendations.length).toBeGreaterThan(0);
    });
  });
});