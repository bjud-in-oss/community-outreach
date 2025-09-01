import { describe, it, expect, beforeEach } from 'vitest';
import { DeltaCalculator, DeltaUtils, DeltaTrendAnalysis } from '@/lib/communication/delta-calculator';
import { UserState, AgentState, RelationalDelta } from '../../types';

describe('DeltaCalculator', () => {
  let baseUserState: UserState;
  let baseAgentState: AgentState;
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
  });

  describe('calculateRelationalDelta', () => {
    it('should calculate delta with perfect alignment', () => {
      // Perfect alignment: user and agent have matching problem-solving orientation
      const userState: UserState = {
        ...baseUserState,
        fixes: 0.7,
        confidence: 1.0
      };

      const agentState: AgentState = {
        ...baseAgentState,
        confidence: 0.7,
        resonance: 0.9
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);

      expect(delta.asynchronous_delta).toBeLessThan(0.1);
      expect(delta.synchronous_delta).toBeGreaterThan(0.8);
      expect(delta.strategy).toBe('harmonize');
    });

    it('should detect high misunderstanding and recommend mirroring', () => {
      // High misunderstanding: user wants problem-solving, agent has low confidence
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

      const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);

      expect(delta.asynchronous_delta).toBeGreaterThan(0.6);
      expect(delta.strategy).toBe('mirror');
    });

    it('should recommend listening for high emotional states', () => {
      // High FIGHT state with low problem-solving orientation
      const userState: UserState = {
        ...baseUserState,
        fight: 0.8,
        flight: 0.1,
        fixes: 0.2,
        confidence: 0.7
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, baseAgentState);

      expect(delta.strategy).toBe('listen');
    });

    it('should recommend listening for high FLIGHT state', () => {
      // High FLIGHT state with low problem-solving orientation
      const userState: UserState = {
        ...baseUserState,
        fight: 0.1,
        flight: 0.8,
        fixes: 0.2,
        confidence: 0.7
      };

      const delta = DeltaCalculator.calculateRelationalDelta(userState, baseAgentState);

      expect(delta.strategy).toBe('listen');
    });

    it('should apply temporal weight correctly', () => {
      // States with different timestamps
      const oldTimestamp = new Date(baseTimestamp.getTime() - 10 * 60 * 1000); // 10 minutes ago
      
      const userState: UserState = {
        ...baseUserState,
        timestamp: oldTimestamp
      };

      const delta1 = DeltaCalculator.calculateRelationalDelta(userState, baseAgentState);
      const delta2 = DeltaCalculator.calculateRelationalDelta(baseUserState, baseAgentState);

      // Recent states should have higher delta values due to temporal weight
      expect(delta2.magnitude).toBeGreaterThan(delta1.magnitude);
    });

    it('should calculate magnitude correctly', () => {
      const delta = DeltaCalculator.calculateRelationalDelta(baseUserState, baseAgentState);

      // Magnitude should be the Euclidean distance of async and sync deltas
      const expectedMagnitude = Math.sqrt(
        delta.asynchronous_delta ** 2 + delta.synchronous_delta ** 2
      );

      expect(delta.magnitude).toBeCloseTo(expectedMagnitude, 5);
    });
  });

  describe('analyzeDeltaTrends', () => {
    it('should detect insufficient data', () => {
      const deltas: RelationalDelta[] = [{
        asynchronous_delta: 0.5,
        synchronous_delta: 0.6,
        magnitude: 0.78,
        strategy: 'harmonize'
      }];

      const analysis = DeltaCalculator.analyzeDeltaTrends(deltas);

      expect(analysis.trend).toBe('insufficient_data');
      expect(analysis.recommendations).toContain('Collect more data points for trend analysis');
    });

    it('should detect improving trend', () => {
      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.8, synchronous_delta: 0.3, magnitude: 0.85, strategy: 'mirror' },
        { asynchronous_delta: 0.6, synchronous_delta: 0.5, magnitude: 0.78, strategy: 'mirror' },
        { asynchronous_delta: 0.4, synchronous_delta: 0.7, magnitude: 0.81, strategy: 'harmonize' },
        { asynchronous_delta: 0.2, synchronous_delta: 0.8, magnitude: 0.82, strategy: 'harmonize' }
      ];

      const analysis = DeltaCalculator.analyzeDeltaTrends(deltas);

      expect(analysis.trend).toBe('improving');
      expect(analysis.magnitude_trend).toBeLessThan(0);
      expect(analysis.recommendations).toContain('Continue current approach - relationship is strengthening');
    });

    it('should detect degrading trend', () => {
      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.2, synchronous_delta: 0.8, magnitude: 0.82, strategy: 'harmonize' },
        { asynchronous_delta: 0.4, synchronous_delta: 0.7, magnitude: 0.81, strategy: 'harmonize' },
        { asynchronous_delta: 0.6, synchronous_delta: 0.5, magnitude: 0.78, strategy: 'mirror' },
        { asynchronous_delta: 0.8, synchronous_delta: 0.3, magnitude: 0.85, strategy: 'mirror' }
      ];

      const analysis = DeltaCalculator.analyzeDeltaTrends(deltas);

      expect(analysis.trend).toBe('degrading');
      expect(analysis.magnitude_trend).toBeGreaterThan(0);
      expect(analysis.recommendations).toContain('Consider switching to listening strategy');
    });

    it('should detect stable trend', () => {
      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.3, synchronous_delta: 0.7, magnitude: 0.76, strategy: 'harmonize' },
        { asynchronous_delta: 0.32, synchronous_delta: 0.68, magnitude: 0.75, strategy: 'harmonize' },
        { asynchronous_delta: 0.31, synchronous_delta: 0.69, magnitude: 0.76, strategy: 'harmonize' },
        { asynchronous_delta: 0.29, synchronous_delta: 0.71, magnitude: 0.77, strategy: 'harmonize' }
      ];

      const analysis = DeltaCalculator.analyzeDeltaTrends(deltas);

      expect(analysis.trend).toBe('stable');
      expect(Math.abs(analysis.magnitude_trend)).toBeLessThan(0.1);
      expect(analysis.strategy_stability).toBeGreaterThan(0.8);
    });

    it('should detect volatile trend', () => {
      const deltas: RelationalDelta[] = [
        { asynchronous_delta: 0.2, synchronous_delta: 0.8, magnitude: 0.82, strategy: 'harmonize' },
        { asynchronous_delta: 0.7, synchronous_delta: 0.4, magnitude: 0.81, strategy: 'mirror' },
        { asynchronous_delta: 0.3, synchronous_delta: 0.7, magnitude: 0.76, strategy: 'listen' },
        { asynchronous_delta: 0.6, synchronous_delta: 0.5, magnitude: 0.78, strategy: 'mirror' }
      ];

      const analysis = DeltaCalculator.analyzeDeltaTrends(deltas);

      expect(analysis.trend).toBe('volatile');
      expect(analysis.strategy_stability).toBeLessThan(0.5);
      expect(analysis.recommendations).toContain('Focus on consistency in communication approach');
    });
  });
});

describe('DeltaUtils', () => {
  describe('requiresAdaptPhase', () => {
    it('should require ADAPT phase for high magnitude delta', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.6,
        synchronous_delta: 0.6,
        magnitude: 0.85,
        strategy: 'mirror'
      };

      expect(DeltaUtils.requiresAdaptPhase(delta)).toBe(true);
    });

    it('should require ADAPT phase for high asynchronous delta', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.8,
        synchronous_delta: 0.3,
        magnitude: 0.85,
        strategy: 'mirror'
      };

      expect(DeltaUtils.requiresAdaptPhase(delta)).toBe(true);
    });

    it('should not require ADAPT phase for low deltas', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.3,
        synchronous_delta: 0.7,
        magnitude: 0.76,
        strategy: 'harmonize'
      };

      expect(DeltaUtils.requiresAdaptPhase(delta)).toBe(false);
    });
  });

  describe('indicatesSuccess', () => {
    it('should indicate success for low magnitude and high synchronous delta', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.1,
        synchronous_delta: 0.8,
        magnitude: 0.2,
        strategy: 'harmonize'
      };

      expect(DeltaUtils.indicatesSuccess(delta)).toBe(true);
    });

    it('should not indicate success for high magnitude', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.5,
        synchronous_delta: 0.8,
        magnitude: 0.5,
        strategy: 'harmonize'
      };

      expect(DeltaUtils.indicatesSuccess(delta)).toBe(false);
    });

    it('should not indicate success for low synchronous delta', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.1,
        synchronous_delta: 0.4,
        magnitude: 0.2,
        strategy: 'mirror'
      };

      expect(DeltaUtils.indicatesSuccess(delta)).toBe(false);
    });
  });

  describe('interpretDelta', () => {
    it('should interpret excellent alignment', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.05,
        synchronous_delta: 0.9,
        magnitude: 0.1,
        strategy: 'harmonize'
      };

      const interpretation = DeltaUtils.interpretDelta(delta);
      expect(interpretation).toContain('Excellent alignment');
    });

    it('should interpret critical misalignment', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.8,
        synchronous_delta: 0.2,
        magnitude: 0.9,
        strategy: 'listen'
      };

      const interpretation = DeltaUtils.interpretDelta(delta);
      expect(interpretation).toContain('Critical misalignment');
    });

    it('should interpret moderate misalignment', () => {
      const delta: RelationalDelta = {
        asynchronous_delta: 0.4,
        synchronous_delta: 0.4,
        magnitude: 0.5,
        strategy: 'mirror'
      };

      const interpretation = DeltaUtils.interpretDelta(delta);
      expect(interpretation).toContain('Moderate misalignment');
    });
  });
});