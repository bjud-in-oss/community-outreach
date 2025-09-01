import { UserState, AgentState, RelationalDelta } from '../../types';

/**
 * Relational Delta Calculator
 * Implements the core logic for calculating relational deltas between user and agent states
 * Based on requirements 6.1 and 6.2
 */
export class DeltaCalculator {
  /**
   * Calculate relational delta between user and agent states
   * @param userState Current user state vector
   * @param agentState Current agent state vector
   * @returns Calculated relational delta with strategy recommendation
   */
  static calculateRelationalDelta(userState: UserState, agentState: AgentState): RelationalDelta {
    // Calculate temporal weight based on state timestamps
    const temporalWeight = this.calculateTemporalWeight(userState.timestamp, agentState.timestamp);
    
    // Calculate asynchronous delta (misunderstanding)
    const asynchronous_delta = this.calculateAsynchronousDelta(userState, agentState, temporalWeight);
    
    // Calculate synchronous delta (harmony)
    const synchronous_delta = this.calculateSynchronousDelta(userState, agentState, temporalWeight);
    
    // Calculate overall magnitude
    const magnitude = Math.sqrt(asynchronous_delta ** 2 + synchronous_delta ** 2);
    
    // Determine communication strategy
    const strategy = this.determineStrategy(userState, asynchronous_delta, synchronous_delta);
    
    return {
      asynchronous_delta,
      synchronous_delta,
      magnitude,
      strategy
    };
  }

  /**
   * Calculate temporal weight based on time difference between states
   * More recent states have higher weight
   */
  private static calculateTemporalWeight(userTimestamp: Date, agentTimestamp: Date): number {
    const timeDiff = Math.abs(userTimestamp.getTime() - agentTimestamp.getTime());
    const decayConstant = 1000 * 60 * 5; // 5-minute decay constant
    return Math.exp(-timeDiff / decayConstant);
  }

  /**
   * Calculate asynchronous delta (misunderstanding component)
   * Based on cognitive alignment between user and agent
   */
  private static calculateAsynchronousDelta(
    userState: UserState, 
    agentState: AgentState, 
    temporalWeight: number
  ): number {
    // Calculate cognitive alignment based on problem-solving orientation
    const cognitiveAlignment = this.calculateCognitiveAlignment(userState, agentState);
    
    // Asynchronous delta represents misunderstanding
    const rawDelta = 1 - cognitiveAlignment;
    
    // Apply temporal weight
    return rawDelta * temporalWeight;
  }

  /**
   * Calculate synchronous delta (harmony component)
   * Based on emotional resonance between user and agent
   */
  private static calculateSynchronousDelta(
    userState: UserState, 
    agentState: AgentState, 
    temporalWeight: number
  ): number {
    // Calculate emotional resonance
    const emotionalResonance = this.calculateEmotionalResonance(userState, agentState);
    
    // Apply temporal weight
    return emotionalResonance * temporalWeight;
  }

  /**
   * Calculate cognitive alignment between user and agent
   * Higher values indicate better understanding
   */
  private static calculateCognitiveAlignment(userState: UserState, agentState: AgentState): number {
    // Compare problem-solving orientations
    const userProblemSolving = userState.fixes;
    const agentProblemSolving = agentState.confidence;
    
    // Calculate alignment (1.0 = perfect alignment, 0.0 = complete misalignment)
    const alignment = 1 - Math.abs(userProblemSolving - agentProblemSolving);
    
    // Factor in user confidence
    const confidenceWeight = userState.confidence;
    
    return alignment * confidenceWeight;
  }

  /**
   * Calculate emotional resonance between user and agent
   * Higher values indicate better emotional harmony
   */
  private static calculateEmotionalResonance(userState: UserState, agentState: AgentState): number {
    // Agent's resonance represents its ability to match user's emotional state
    const baseResonance = agentState.resonance;
    
    // Adjust based on user's emotional intensity
    const userEmotionalIntensity = Math.max(userState.fight, userState.flight);
    const intensityFactor = 1 - (userEmotionalIntensity * 0.3); // High intensity reduces resonance
    
    return baseResonance * intensityFactor;
  }

  /**
   * Determine communication strategy based on delta analysis
   * Implements the Mirror & Harmonize strategy selection logic
   */
  private static determineStrategy(
    userState: UserState, 
    asynchronousDelta: number, 
    synchronousDelta: number
  ): 'mirror' | 'harmonize' | 'listen' {
    // Strategic Listening: High FIGHT/FLIGHT with low FIXES (prioritize emotional support)
    if ((userState.fight > 0.6 || userState.flight > 0.6) && userState.fixes < 0.4) {
      return 'listen';
    }
    
    // Mirror: High asynchronous delta indicates misunderstanding
    if (asynchronousDelta > 0.5) {
      return 'mirror';
    }
    
    // Harmonize: Good understanding, can guide toward constructive state
    return 'harmonize';
  }

  /**
   * Analyze delta trends over time
   * Useful for detecting patterns and adjusting strategy
   */
  static analyzeDeltaTrends(deltas: RelationalDelta[]): DeltaTrendAnalysis {
    if (deltas.length < 2) {
      return {
        trend: 'insufficient_data',
        magnitude_trend: 0,
        strategy_stability: 1,
        recommendations: ['Collect more data points for trend analysis']
      };
    }

    // Calculate magnitude trend
    const magnitudes = deltas.map(d => d.magnitude);
    const magnitudeTrend = this.calculateTrend(magnitudes);
    
    // Calculate strategy stability
    const strategies = deltas.map(d => d.strategy);
    const strategyChanges = strategies.slice(1).filter((s, i) => s !== strategies[i]).length;
    const strategyStability = 1 - (strategyChanges / (strategies.length - 1));
    
    // Determine overall trend
    let trend: 'improving' | 'degrading' | 'stable' | 'volatile';
    
    // Prioritize volatility detection first
    if (strategyStability < 0.6) {
      trend = 'volatile';
    } else if (Math.abs(magnitudeTrend) < 0.02 && strategyStability > 0.8) {
      trend = 'stable';
    } else if (magnitudeTrend < -0.005) {
      trend = 'improving';
    } else if (magnitudeTrend > 0.005) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }
    
    // Generate recommendations
    const recommendations = this.generateTrendRecommendations(trend, magnitudeTrend, strategyStability);
    
    return {
      trend,
      magnitude_trend: magnitudeTrend,
      strategy_stability: strategyStability,
      recommendations
    };
  }

  /**
   * Calculate linear trend from a series of values
   */
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    // Linear regression slope
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  /**
   * Generate recommendations based on trend analysis
   */
  private static generateTrendRecommendations(
    trend: string, 
    magnitudeTrend: number, 
    strategyStability: number
  ): string[] {
    const recommendations: string[] = [];
    
    switch (trend) {
      case 'improving':
        recommendations.push('Continue current approach - relationship is strengthening');
        break;
      case 'degrading':
        recommendations.push('Consider switching to listening strategy');
        recommendations.push('Review recent interactions for potential misunderstandings');
        break;
      case 'volatile':
        recommendations.push('Focus on consistency in communication approach');
        recommendations.push('May need to enter ADAPT phase for strategy adjustment');
        break;
      case 'stable':
        recommendations.push('Relationship is stable - maintain current strategy');
        break;
    }
    
    if (strategyStability < 0.5) {
      recommendations.push('High strategy volatility detected - consider deeper user state analysis');
    }
    
    if (magnitudeTrend > 0.3) {
      recommendations.push('Rapidly increasing delta - immediate attention required');
    }
    
    return recommendations;
  }
}

/**
 * Delta trend analysis result
 */
export interface DeltaTrendAnalysis {
  /** Overall trend classification */
  trend: 'improving' | 'degrading' | 'stable' | 'volatile' | 'insufficient_data';
  
  /** Magnitude trend slope (negative = improving, positive = degrading) */
  magnitude_trend: number;
  
  /** Strategy stability (1.0 = no changes, 0.0 = constant changes) */
  strategy_stability: number;
  
  /** Actionable recommendations */
  recommendations: string[];
}

/**
 * Utility functions for delta calculation
 */
export class DeltaUtils {
  /**
   * Check if delta indicates high misunderstanding requiring ADAPT phase
   */
  static requiresAdaptPhase(delta: RelationalDelta): boolean {
    return delta.magnitude > 0.8 || delta.asynchronous_delta > 0.7;
  }

  /**
   * Check if delta indicates successful communication
   */
  static indicatesSuccess(delta: RelationalDelta): boolean {
    return delta.magnitude < 0.3 && delta.synchronous_delta > 0.6;
  }

  /**
   * Get human-readable delta interpretation
   */
  static interpretDelta(delta: RelationalDelta): string {
    if (delta.magnitude < 0.2) {
      return 'Excellent alignment - strong understanding and harmony';
    } else if (delta.magnitude < 0.4) {
      return 'Good alignment - minor adjustments may help';
    } else if (delta.magnitude < 0.6) {
      return 'Moderate misalignment - focus on clarity and empathy';
    } else if (delta.magnitude < 0.8) {
      return 'Significant misalignment - consider strategy change';
    } else {
      return 'Critical misalignment - immediate intervention required';
    }
  }
}