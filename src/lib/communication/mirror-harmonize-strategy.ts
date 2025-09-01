import { UserState, AgentState, RelationalDelta, UserInput, AgentResponse } from '../../types';
import { DeltaCalculator, DeltaUtils } from './delta-calculator';

/**
 * Mirror & Harmonize Communication Strategy
 * Implements the two-step communication approach based on requirements 6.3, 6.4, 6.5, 6.6
 */
export class MirrorHarmonizeStrategy {
  /**
   * Generate response using Mirror & Harmonize strategy
   * @param input User input to respond to
   * @param userState Current user state
   * @param agentState Current agent state
   * @returns Generated response with strategy applied
   */
  static generateResponse(
    input: UserInput,
    userState: UserState,
    agentState: AgentState
  ): AgentResponse {
    // Calculate relational delta to determine strategy
    const delta = DeltaCalculator.calculateRelationalDelta(userState, agentState);
    
    // Generate response based on strategy
    let responseText: string;
    let responseType: 'message' | 'action' | 'suggestion' = 'message';
    
    switch (delta.strategy) {
      case 'listen':
        responseText = this.generateListeningResponse(input, userState, delta);
        responseType = 'message';
        break;
      case 'mirror':
        responseText = this.generateMirroringResponse(input, userState, delta);
        responseType = 'message';
        break;
      case 'harmonize':
        responseText = this.generateHarmonizingResponse(input, userState, delta);
        responseType = 'suggestion';
        break;
    }
    
    // Update agent state based on interaction
    const updatedAgentState = this.updateAgentStateAfterResponse(agentState, delta, userState);
    
    return {
      text: responseText,
      type: responseType,
      agent_state: updatedAgentState,
      timestamp: new Date()
    };
  }

  /**
   * Generate listening response for high emotional states
   * Focus on validation without problem-solving
   */
  private static generateListeningResponse(
    input: UserInput,
    userState: UserState,
    delta: RelationalDelta
  ): string {
    const emotionalValidation = this.generateEmotionalValidation(userState);
    const encouragement = this.generateEncouragement(userState);
    
    // Adjust response based on input context and delta severity
    const contextualPhrase = input.context ? 
      "about this situation" : 
      "about what you're experiencing";
    
    const urgencyLevel = delta.magnitude > 0.7 ? 
      "I'm completely focused on understanding you right now." :
      "I'm here to listen.";
    
    return `${emotionalValidation} ${encouragement} ${urgencyLevel} Please tell me more ${contextualPhrase}.`;
  }

  /**
   * Generate mirroring response to validate user's perceived state
   * Establishes resonance before attempting guidance
   */
  private static generateMirroringResponse(
    input: UserInput,
    userState: UserState,
    delta: RelationalDelta
  ): string {
    const stateReflection = this.generateStateReflection(userState);
    const validationPhrase = this.generateValidationPhrase(userState);
    
    // Adjust mirroring intensity based on delta magnitude
    const clarificationLevel = delta.asynchronous_delta > 0.6 ?
      "Let me make sure I fully understand what you're going through." :
      "I want to make sure I understand what you're experiencing.";
    
    // Reference input content if available
    const inputReference = input.text.length > 50 ?
      "Based on what you've shared, " :
      "";
    
    return `${inputReference}${stateReflection} ${validationPhrase} ${clarificationLevel}`;
  }

  /**
   * Generate harmonizing response to guide toward constructive state
   * Used when good understanding exists and can provide guidance
   */
  private static generateHarmonizingResponse(
    input: UserInput,
    userState: UserState,
    delta: RelationalDelta
  ): string {
    const acknowledgment = this.generateAcknowledgment(userState);
    const constructiveGuidance = this.generateConstructiveGuidance(input, userState);
    
    // Adjust confidence level based on synchronous delta
    const confidenceLevel = delta.synchronous_delta > 0.7 ?
      "I'm confident we can find a good path forward." :
      "I believe we can work through this together.";
    
    return `${acknowledgment} ${constructiveGuidance} ${confidenceLevel}`;
  }

  /**
   * Generate emotional validation based on user state
   */
  private static generateEmotionalValidation(userState: UserState): string {
    if (userState.fight > 0.7) {
      return "I can sense you're feeling frustrated or upset right now.";
    } else if (userState.flight > 0.7) {
      return "I understand you might be feeling overwhelmed or wanting to step back.";
    } else if (userState.fixes > 0.7) {
      return "I see you're focused on finding solutions.";
    } else {
      return "I hear what you're saying.";
    }
  }

  /**
   * Generate encouragement based on user state
   */
  private static generateEncouragement(userState: UserState): string {
    if (userState.confidence < 0.3) {
      return "Your feelings are completely valid.";
    } else if (userState.confidence < 0.6) {
      return "It's okay to feel uncertain about this.";
    } else {
      return "I appreciate you sharing this with me.";
    }
  }

  /**
   * Generate state reflection for mirroring
   */
  private static generateStateReflection(userState: UserState): string {
    const dominantState = this.identifyDominantState(userState);
    
    switch (dominantState) {
      case 'fight':
        return "It sounds like this situation is really bothering you.";
      case 'flight':
        return "This seems like something that's making you feel uncomfortable.";
      case 'fixes':
        return "I can tell you're thinking through how to handle this.";
      default:
        return "I'm picking up on what you're experiencing.";
    }
  }

  /**
   * Generate validation phrase for mirroring
   */
  private static generateValidationPhrase(userState: UserState): string {
    if (userState.confidence > 0.7) {
      return "You seem clear about what you're feeling.";
    } else if (userState.confidence > 0.4) {
      return "These feelings make complete sense.";
    } else {
      return "It's natural to feel uncertain in situations like this.";
    }
  }

  /**
   * Generate acknowledgment for harmonizing
   */
  private static generateAcknowledgment(userState: UserState): string {
    return "I understand where you're coming from, and I think we can work through this together.";
  }

  /**
   * Generate constructive guidance for harmonizing
   */
  private static generateConstructiveGuidance(input: UserInput, userState: UserState): string {
    // Consider input type for guidance approach
    const isEditContext = input.type === 'edit';
    const isCommandContext = input.type === 'command';
    
    if (userState.fixes > 0.6) {
      if (isEditContext) {
        return "Let's focus on refining your content to achieve what you're looking for.";
      } else if (isCommandContext) {
        return "I can help you find the right approach to accomplish this task.";
      } else {
        return "Let's explore some approaches that might help you move forward.";
      }
    } else if (userState.fight > 0.5) {
      return "Perhaps we can find a way to channel that energy into something productive.";
    } else if (userState.flight > 0.5) {
      return "We can take this step by step, at whatever pace feels comfortable for you.";
    } else {
      return "What would feel most helpful to you right now?";
    }
  }

  /**
   * Identify the dominant emotional state
   */
  private static identifyDominantState(userState: UserState): 'fight' | 'flight' | 'fixes' | 'balanced' {
    const states = [
      { name: 'fight' as const, value: userState.fight },
      { name: 'flight' as const, value: userState.flight },
      { name: 'fixes' as const, value: userState.fixes }
    ];
    
    const dominant = states.reduce((max, current) => 
      current.value > max.value ? current : max
    );
    
    // Only consider it dominant if significantly higher than others
    if (dominant.value > 0.6 && dominant.value > Math.max(...states.filter(s => s.name !== dominant.name).map(s => s.value)) + 0.2) {
      return dominant.name;
    }
    
    return 'balanced';
  }

  /**
   * Update agent state after generating response
   */
  private static updateAgentStateAfterResponse(
    currentState: AgentState,
    delta: RelationalDelta,
    userState: UserState
  ): AgentState {
    // Adjust resonance based on strategy used
    let newResonance = currentState.resonance;
    
    switch (delta.strategy) {
      case 'listen':
        // Listening increases resonance by showing empathy
        newResonance = Math.min(1.0, currentState.resonance + 0.1);
        break;
      case 'mirror':
        // Mirroring moderately increases resonance
        newResonance = Math.min(1.0, currentState.resonance + 0.05);
        break;
      case 'harmonize':
        // Harmonizing maintains or slightly adjusts resonance
        newResonance = currentState.resonance;
        break;
    }
    
    // Adjust confidence based on delta magnitude
    let newConfidence = currentState.confidence;
    if (delta.magnitude < 0.3) {
      // Low delta increases confidence
      newConfidence = Math.min(1.0, currentState.confidence + 0.05);
    } else if (delta.magnitude > 0.7) {
      // High delta decreases confidence
      newConfidence = Math.max(0.1, currentState.confidence - 0.1);
    }
    
    return {
      ...currentState,
      resonance: newResonance,
      confidence: newConfidence,
      timestamp: new Date()
    };
  }

  /**
   * Check if high delta requires ADAPT phase triggering
   */
  static shouldTriggerAdaptPhase(delta: RelationalDelta): boolean {
    return DeltaUtils.requiresAdaptPhase(delta);
  }

  /**
   * Generate ADAPT phase trigger information
   */
  static generateAdaptTrigger(delta: RelationalDelta, userState: UserState): AdaptTriggerInfo {
    const reason = this.determineAdaptReason(delta, userState);
    const recommendations = this.generateAdaptRecommendations(delta, userState);
    
    return {
      triggered: true,
      reason,
      delta_magnitude: delta.magnitude,
      asynchronous_delta: delta.asynchronous_delta,
      synchronous_delta: delta.synchronous_delta,
      recommendations,
      timestamp: new Date()
    };
  }

  /**
   * Determine reason for ADAPT phase trigger
   */
  private static determineAdaptReason(delta: RelationalDelta, userState: UserState): string {
    if (delta.magnitude > 0.8) {
      return 'Critical relational delta detected - major misalignment between user and agent states';
    } else if (delta.asynchronous_delta > 0.7) {
      return 'High asynchronous delta - significant misunderstanding detected';
    } else if (userState.fight > 0.8 && delta.synchronous_delta < 0.3) {
      return 'High user agitation with poor emotional resonance';
    } else if (userState.flight > 0.8 && delta.synchronous_delta < 0.3) {
      return 'High user withdrawal with poor emotional connection';
    } else {
      return 'Relational delta threshold exceeded - communication strategy adjustment needed';
    }
  }

  /**
   * Generate recommendations for ADAPT phase
   */
  private static generateAdaptRecommendations(delta: RelationalDelta, userState: UserState): string[] {
    const recommendations: string[] = [];
    
    if (delta.asynchronous_delta > 0.6) {
      recommendations.push('Focus on understanding and clarification before proceeding');
      recommendations.push('Use more mirroring and validation techniques');
    }
    
    if (delta.synchronous_delta < 0.4) {
      recommendations.push('Improve emotional resonance through active listening');
      recommendations.push('Reduce problem-solving focus, increase empathy');
    }
    
    if (userState.fight > 0.7) {
      recommendations.push('Switch to pure listening mode - avoid solutions');
      recommendations.push('Validate user frustration without defensiveness');
    }
    
    if (userState.flight > 0.7) {
      recommendations.push('Create safe space for user expression');
      recommendations.push('Reduce pressure and allow user to set pace');
    }
    
    if (userState.confidence < 0.3) {
      recommendations.push('Build user confidence through validation');
      recommendations.push('Avoid overwhelming with options or complexity');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Review communication approach and adjust strategy');
    }
    
    return recommendations;
  }
}

/**
 * Information about ADAPT phase trigger
 */
export interface AdaptTriggerInfo {
  /** Whether ADAPT phase should be triggered */
  triggered: boolean;
  
  /** Reason for triggering ADAPT phase */
  reason: string;
  
  /** Delta magnitude that triggered adaptation */
  delta_magnitude: number;
  
  /** Asynchronous delta component */
  asynchronous_delta: number;
  
  /** Synchronous delta component */
  synchronous_delta: number;
  
  /** Recommendations for adaptation */
  recommendations: string[];
  
  /** Timestamp of trigger */
  timestamp: Date;
}

/**
 * Communication strategy utilities
 */
export class CommunicationUtils {
  /**
   * Analyze communication effectiveness over time
   */
  static analyzeEffectiveness(responses: AgentResponse[], deltas: RelationalDelta[]): EffectivenessAnalysis {
    if (responses.length !== deltas.length || responses.length === 0) {
      return {
        overall_effectiveness: 0,
        strategy_distribution: { listen: 0, mirror: 0, harmonize: 0 },
        improvement_trend: 0,
        recommendations: ['Insufficient data for analysis']
      };
    }
    
    // Calculate strategy distribution
    const strategyCount = { listen: 0, mirror: 0, harmonize: 0 };
    deltas.forEach(delta => {
      strategyCount[delta.strategy]++;
    });
    
    const total = deltas.length;
    const strategy_distribution = {
      listen: strategyCount.listen / total,
      mirror: strategyCount.mirror / total,
      harmonize: strategyCount.harmonize / total
    };
    
    // Calculate overall effectiveness (inverse of average delta magnitude)
    const avgMagnitude = deltas.reduce((sum, delta) => sum + delta.magnitude, 0) / deltas.length;
    const overall_effectiveness = Math.max(0, 1 - avgMagnitude);
    
    // Calculate improvement trend
    const magnitudes = deltas.map(d => d.magnitude);
    const improvement_trend = this.calculateTrend(magnitudes) * -1; // Negative trend = improvement
    
    // Generate recommendations
    const recommendations = this.generateEffectivenessRecommendations(
      overall_effectiveness,
      strategy_distribution,
      improvement_trend
    );
    
    return {
      overall_effectiveness,
      strategy_distribution,
      improvement_trend,
      recommendations
    };
  }

  /**
   * Calculate linear trend from values
   */
  private static calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  /**
   * Generate effectiveness recommendations
   */
  private static generateEffectivenessRecommendations(
    effectiveness: number,
    distribution: { listen: number; mirror: number; harmonize: number },
    trend: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (effectiveness < 0.3) {
      recommendations.push('Communication effectiveness is low - review strategy selection');
    } else if (effectiveness < 0.6) {
      recommendations.push('Moderate effectiveness - fine-tune approach based on user feedback');
    } else {
      recommendations.push('Good communication effectiveness - maintain current approach');
    }
    
    if (distribution.listen > 0.7) {
      recommendations.push('High listening mode usage - ensure progression to problem-solving when appropriate');
    } else if (distribution.listen < 0.1) {
      recommendations.push('Low listening mode usage - may need more empathy in high-emotion situations');
    }
    
    if (distribution.harmonize > 0.6 && effectiveness < 0.5) {
      recommendations.push('High harmonizing with low effectiveness - may be rushing to solutions');
    }
    
    if (trend > 0.1) {
      recommendations.push('Positive improvement trend - continue current strategy');
    } else if (trend < -0.1) {
      recommendations.push('Declining effectiveness - consider strategy adjustment');
    }
    
    return recommendations;
  }
}

/**
 * Communication effectiveness analysis
 */
export interface EffectivenessAnalysis {
  /** Overall effectiveness score (0-1) */
  overall_effectiveness: number;
  
  /** Distribution of strategies used */
  strategy_distribution: {
    listen: number;
    mirror: number;
    harmonize: number;
  };
  
  /** Trend in improvement (positive = improving) */
  improvement_trend: number;
  
  /** Recommendations for improvement */
  recommendations: string[];
}