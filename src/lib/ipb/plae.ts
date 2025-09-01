import { UserInput, UserState } from '@/types';

/**
 * Analysis result for each PLAE dimension
 */
export interface DimensionAnalysis {
  /** Score for this dimension (0-1) */
  score: number;
  
  /** Confidence in this assessment (0-1) */
  confidence: number;
  
  /** Key indicators that influenced this score */
  indicators: string[];
  
  /** Processing time for this dimension in milliseconds */
  processingTime: number;
}

/**
 * Complete PLAE analysis result
 */
export interface PLAEResult {
  /** FIGHT dimension analysis */
  fight: DimensionAnalysis;
  
  /** FLIGHT dimension analysis */
  flight: DimensionAnalysis;
  
  /** FIXES dimension analysis */
  fixes: DimensionAnalysis;
  
  /** Synthesized User_State vector */
  userState: UserState;
  
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  
  /** Whether analysis completed successfully */
  success: boolean;
  
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Psycho-linguistic Analysis Engine (PLAE)
 * Implements Requirements 5.4, 5.5, 5.6, 5.7
 * 
 * Performs parallel analysis of FIGHT/FLIGHT/FIXES dimensions
 * and synthesizes results into User_State vector
 */
export class PLAE {
  private static readonly FIGHT_INDICATORS = [
    /\b(angry|mad|furious|rage|hate|stupid|idiot|damn|hell)\b/i,
    /\b(fight|attack|destroy|kill|crush|defeat)\b/i,
    /[!]{2,}/, // Multiple exclamation marks
    /\b[A-Z]{2,}\b/g, // ALL CAPS words
    /\b(no|never|stop|quit|enough)\b.*[!]/i, // Emphatic negation
  ];

  private static readonly FLIGHT_INDICATORS = [
    /\b(scared|afraid|worried|anxious|nervous|panic|fear)\b/i,
    /\b(escape|run|hide|avoid|leave|quit|give up)\b/i,
    /\b(can't|won't|unable|impossible|hopeless)\b/i,
    /\b(maybe|perhaps|might|possibly|uncertain)\b/i,
    /\?\?\?+/, // Multiple question marks indicating confusion
  ];

  private static readonly FIXES_INDICATORS = [
    /\b(solve|fix|repair|build|create|make|plan|strategy)\b/i,
    /\b(how|what|when|where|why|which)\b/i, // Question words (removed .*\? requirement)
    /\b(help|assist|support|guide|teach|learn)\b/i,
    /\b(try|attempt|work|effort|focus|goal)\b/i,
    /\b(solution|answer|idea|suggestion|option)\b/i,
  ];

  /**
   * Perform complete PLAE analysis on user input
   */
  async performAnalysis(input: UserInput): Promise<PLAEResult> {
    const startTime = Date.now();
    
    try {
      // Perform parallel analysis of all three dimensions
      const [fightAnalysis, flightAnalysis, fixesAnalysis] = await Promise.all([
        this.analyzeFightDimension(input),
        this.analyzeFlightDimension(input),
        this.analyzeFixesDimension(input)
      ]);

      // Synthesize User_State vector from dimension analyses
      const userState = this.synthesizeUserState(
        fightAnalysis,
        flightAnalysis,
        fixesAnalysis,
        input.timestamp
      );

      const totalProcessingTime = Date.now() - startTime;

      return {
        fight: fightAnalysis,
        flight: flightAnalysis,
        fixes: fixesAnalysis,
        userState,
        totalProcessingTime,
        success: true
      };
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      return {
        fight: this.createErrorAnalysis('FIGHT'),
        flight: this.createErrorAnalysis('FLIGHT'),
        fixes: this.createErrorAnalysis('FIXES'),
        userState: this.createFallbackUserState(input.timestamp),
        totalProcessingTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PLAE error'
      };
    }
  }

  /**
   * Analyze FIGHT dimension - aggression, confrontation
   */
  private async analyzeFightDimension(input: UserInput): Promise<DimensionAnalysis> {
    const startTime = Date.now();
    
    try {
      // Pattern-based analysis
      const patternScore = this.calculatePatternScore(input.text, PLAE.FIGHT_INDICATORS);
      
      // Contextual analysis
      const contextScore = this.analyzeContextualFight(input);
      
      // LLM-based analysis for nuanced understanding
      const llmScore = await this.performLLMFightAnalysis(input.text);
      
      // Combine scores with weighted average
      const finalScore = (patternScore * 0.4) + (contextScore * 0.3) + (llmScore * 0.3);
      
      // Calculate confidence based on score consistency
      const confidence = this.calculateConfidence([patternScore, contextScore, llmScore]);
      
      // Identify key indicators
      const indicators = this.identifyIndicators(input.text, PLAE.FIGHT_INDICATORS);
      
      return {
        score: Math.max(0, Math.min(1, finalScore)),
        confidence,
        indicators,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return this.createErrorAnalysis('FIGHT', Date.now() - startTime);
    }
  }

  /**
   * Analyze FLIGHT dimension - avoidance, withdrawal
   */
  private async analyzeFlightDimension(input: UserInput): Promise<DimensionAnalysis> {
    const startTime = Date.now();
    
    try {
      // Pattern-based analysis
      const patternScore = this.calculatePatternScore(input.text, PLAE.FLIGHT_INDICATORS);
      
      // Contextual analysis
      const contextScore = this.analyzeContextualFlight(input);
      
      // LLM-based analysis for nuanced understanding
      const llmScore = await this.performLLMFlightAnalysis(input.text);
      
      // Combine scores with weighted average
      const finalScore = (patternScore * 0.4) + (contextScore * 0.3) + (llmScore * 0.3);
      
      // Calculate confidence based on score consistency
      const confidence = this.calculateConfidence([patternScore, contextScore, llmScore]);
      
      // Identify key indicators
      const indicators = this.identifyIndicators(input.text, PLAE.FLIGHT_INDICATORS);
      
      return {
        score: Math.max(0, Math.min(1, finalScore)),
        confidence,
        indicators,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return this.createErrorAnalysis('FLIGHT', Date.now() - startTime);
    }
  }

  /**
   * Analyze FIXES dimension - problem-solving orientation
   */
  private async analyzeFixesDimension(input: UserInput): Promise<DimensionAnalysis> {
    const startTime = Date.now();
    
    try {
      // Pattern-based analysis
      const patternScore = this.calculatePatternScore(input.text, PLAE.FIXES_INDICATORS);
      
      // Contextual analysis
      const contextScore = this.analyzeContextualFixes(input);
      
      // LLM-based analysis for nuanced understanding
      const llmScore = await this.performLLMFixesAnalysis(input.text);
      
      // Combine scores with weighted average
      const finalScore = (patternScore * 0.4) + (contextScore * 0.3) + (llmScore * 0.3);
      
      // Calculate confidence based on score consistency
      const confidence = this.calculateConfidence([patternScore, contextScore, llmScore]);
      
      // Identify key indicators
      const indicators = this.identifyIndicators(input.text, PLAE.FIXES_INDICATORS);
      
      return {
        score: Math.max(0, Math.min(1, finalScore)),
        confidence,
        indicators,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      return this.createErrorAnalysis('FIXES', Date.now() - startTime);
    }
  }

  /**
   * Calculate pattern-based score for a dimension
   */
  private calculatePatternScore(text: string, patterns: RegExp[]): number {
    let score = 0;
    let matchCount = 0;
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matchCount++;
        // Weight by number of matches and pattern specificity
        score += matches.length * 0.3; // Increased weight
      }
    }
    
    // Normalize by pattern count with higher base score
    const normalizedScore = (score * 2) + (matchCount / patterns.length * 0.5);
    
    return Math.max(0, Math.min(1, normalizedScore));
  }

  /**
   * Analyze contextual FIGHT indicators
   */
  private analyzeContextualFight(input: UserInput): number {
    let score = 0;
    
    // Check input type context
    if (input.type === 'command') {
      score += 0.1; // Commands can indicate assertiveness
    }
    
    // Check for context clues
    if (input.context?.previousInteraction === 'frustrating') {
      score += 0.3;
    }
    
    // Analyze punctuation patterns
    const exclamationCount = (input.text.match(/!/g) || []).length;
    score += Math.min(0.5, exclamationCount * 0.15); // Increased weight
    
    // Check for ALL CAPS usage
    const capsWords = input.text.match(/\b[A-Z]{2,}\b/g) || [];
    score += Math.min(0.4, capsWords.length * 0.15); // Increased weight
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze contextual FLIGHT indicators
   */
  private analyzeContextualFlight(input: UserInput): number {
    let score = 0;
    
    // Check for uncertainty markers
    const uncertaintyWords = ['maybe', 'perhaps', 'might', 'possibly', 'not sure'];
    for (const word of uncertaintyWords) {
      if (input.text.toLowerCase().includes(word)) {
        score += 0.15;
      }
    }
    
    // Check for question marks indicating confusion
    const questionCount = (input.text.match(/\?/g) || []).length;
    if (questionCount > 1) {
      score += Math.min(0.3, questionCount * 0.1);
    }
    
    // Check for hesitation patterns
    if (input.text.includes('...') || input.text.includes('um') || input.text.includes('uh')) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze contextual FIXES indicators
   */
  private analyzeContextualFixes(input: UserInput): number {
    let score = 0;
    
    // Check for question patterns (problem-solving intent)
    if (input.text.includes('?')) {
      score += 0.2;
    }
    
    // Check for action-oriented language
    const actionWords = ['will', 'should', 'could', 'would', 'let me', 'i want to'];
    for (const word of actionWords) {
      if (input.text.toLowerCase().includes(word)) {
        score += 0.1;
      }
    }
    
    // Check for collaborative language
    const collaborativeWords = ['we', 'us', 'together', 'help', 'work'];
    for (const word of collaborativeWords) {
      if (input.text.toLowerCase().includes(word)) {
        score += 0.1;
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Perform LLM-based FIGHT analysis (simulated)
   */
  private async performLLMFightAnalysis(text: string): Promise<number> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Simulate LLM analysis based on text characteristics
    let score = 0;
    
    if (text.toLowerCase().includes('angry') || text.includes('!')) {
      score += 0.6;
    }
    
    if (text.toLowerCase().includes('hate') || text.toLowerCase().includes('stupid')) {
      score += 0.8;
    }
    
    if (text.match(/[A-Z]{3,}/)) {
      score += 0.4;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Perform LLM-based FLIGHT analysis (simulated)
   */
  private async performLLMFlightAnalysis(text: string): Promise<number> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Simulate LLM analysis based on text characteristics
    let score = 0;
    
    if (text.toLowerCase().includes('scared') || text.toLowerCase().includes('worried')) {
      score += 0.7;
    }
    
    if (text.toLowerCase().includes('can\'t') || text.toLowerCase().includes('impossible')) {
      score += 0.6;
    }
    
    if (text.includes('???')) {
      score += 0.5;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Perform LLM-based FIXES analysis (simulated)
   */
  private async performLLMFixesAnalysis(text: string): Promise<number> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 30));
    
    // Simulate LLM analysis based on text characteristics
    let score = 0;
    
    if (text.toLowerCase().includes('how') || text.toLowerCase().includes('what')) {
      score += 0.6;
    }
    
    if (text.toLowerCase().includes('help') || text.toLowerCase().includes('solve')) {
      score += 0.7;
    }
    
    if (text.includes('?')) {
      score += 0.4;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate confidence based on score consistency
   */
  private calculateConfidence(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Higher consistency (lower standard deviation) = higher confidence
    const consistency = Math.max(0, 1 - (standardDeviation * 2));
    
    // Also factor in the absolute values - extreme scores are more confident
    const extremeness = Math.max(...scores.map(s => Math.abs(s - 0.5))) * 2;
    
    return Math.max(0, Math.min(1, (consistency * 0.7) + (extremeness * 0.3)));
  }

  /**
   * Identify specific indicators that matched patterns
   */
  private identifyIndicators(text: string, patterns: RegExp[]): string[] {
    const indicators: string[] = [];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        indicators.push(...matches.map(match => match.toLowerCase()));
      }
    }
    
    // Remove duplicates and limit to top 5
    return Array.from(new Set(indicators)).slice(0, 5);
  }

  /**
   * Synthesize User_State vector from dimension analyses
   */
  private synthesizeUserState(
    fight: DimensionAnalysis,
    flight: DimensionAnalysis,
    fixes: DimensionAnalysis,
    timestamp: Date
  ): UserState {
    // Calculate overall confidence as weighted average
    const overallConfidence = (
      (fight.confidence * fight.score) +
      (flight.confidence * flight.score) +
      (fixes.confidence * fixes.score)
    ) / Math.max(0.1, fight.score + flight.score + fixes.score);

    return {
      fight: fight.score,
      flight: flight.score,
      fixes: fixes.score,
      timestamp,
      confidence: Math.max(0.1, Math.min(1, overallConfidence))
    };
  }

  /**
   * Create error analysis for a dimension
   */
  private createErrorAnalysis(dimension: string, processingTime: number = 0): DimensionAnalysis {
    return {
      score: 0.5, // Neutral score on error
      confidence: 0.1, // Very low confidence
      indicators: [`${dimension.toLowerCase()}_analysis_error`],
      processingTime
    };
  }

  /**
   * Create fallback User_State on complete analysis failure
   */
  private createFallbackUserState(timestamp: Date): UserState {
    return {
      fight: 0.3,
      flight: 0.3,
      fixes: 0.4, // Slight bias toward problem-solving
      timestamp,
      confidence: 0.2 // Low confidence fallback
    };
  }
}

/**
 * Singleton instance for global access
 */
export const plae = new PLAE();