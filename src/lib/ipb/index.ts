import { UserInput, UserState } from '@/types';
import { initialTriage, TriageResult } from './initial-triage';
import { plae, PLAEResult } from './plae';

/**
 * Complete IPB (Initial Perception & Assessment) result
 */
export interface IPBResult {
  /** Whether the input was handled by triage (trivial) or required PLAE analysis */
  handledByTriage: boolean;
  
  /** Triage result (always present) */
  triageResult: TriageResult;
  
  /** PLAE result (only present if not handled by triage) */
  plaeResult?: PLAEResult;
  
  /** Final User_State vector (from PLAE if available, otherwise derived from triage) */
  userState: UserState;
  
  /** Immediate response if trivial, null otherwise */
  immediateResponse: string | null;
  
  /** Total processing time in milliseconds */
  totalProcessingTime: number;
  
  /** Whether the IPB process completed successfully */
  success: boolean;
  
  /** Error message if IPB failed */
  error?: string;
}

/**
 * Initial Perception & Assessment (IPB) System
 * Implements Requirements 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 * 
 * Two-step process:
 * 1. Initial Triage - fast triviality detection
 * 2. PLAE - deep psycho-linguistic analysis for non-trivial inputs
 */
export class IPBSystem {
  /**
   * Process user input through the complete IPB pipeline
   */
  async processInput(input: UserInput): Promise<IPBResult> {
    const startTime = Date.now();
    
    try {
      // Step 1: Initial Triage
      const triageResult = await initialTriage.performTriage(input);
      
      if (triageResult.isTrivial) {
        // Trivial input - return immediate response
        const userState = this.createTrivialUserState(input.timestamp);
        
        const totalProcessingTime = Date.now() - startTime;
        return {
          handledByTriage: true,
          triageResult,
          userState,
          immediateResponse: triageResult.immediateResponse,
          totalProcessingTime: Math.max(1, totalProcessingTime),
          success: true
        };
      }
      
      // Step 2: PLAE Analysis for non-trivial input
      const plaeResult = await plae.performAnalysis(input);
      
      if (!plaeResult.success) {
        // PLAE failed - return fallback result
        const fallbackUserState = this.createFallbackUserState(input.timestamp);
        
        const totalProcessingTime = Date.now() - startTime;
        return {
          handledByTriage: false,
          triageResult,
          plaeResult,
          userState: fallbackUserState,
          immediateResponse: null,
          totalProcessingTime: Math.max(1, totalProcessingTime),
          success: false,
          error: `PLAE analysis failed: ${plaeResult.error}`
        };
      }
      
      // Success - return complete analysis
      const totalProcessingTime = Date.now() - startTime;
      return {
        handledByTriage: false,
        triageResult,
        plaeResult,
        userState: plaeResult.userState,
        immediateResponse: null,
        totalProcessingTime: Math.max(1, totalProcessingTime),
        success: true
      };
      
    } catch (error) {
      // Complete IPB failure
      const fallbackUserState = this.createFallbackUserState(input.timestamp);
      const fallbackTriageResult: TriageResult = {
        isTrivial: false,
        confidence: 0.1,
        immediateResponse: null,
        reasoning: 'IPB system error',
        processingTime: 0
      };
      
      const totalProcessingTime = Date.now() - startTime;
      return {
        handledByTriage: false,
        triageResult: fallbackTriageResult,
        userState: fallbackUserState,
        immediateResponse: null,
        totalProcessingTime: Math.max(1, totalProcessingTime),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown IPB error'
      };
    }
  }

  /**
   * Create User_State for trivial inputs
   * Trivial inputs typically indicate neutral, low-engagement state
   */
  private createTrivialUserState(timestamp: Date): UserState {
    return {
      fight: 0.1,    // Very low aggression
      flight: 0.2,   // Slight disengagement (trivial interaction)
      fixes: 0.3,    // Low problem-solving intent
      timestamp,
      confidence: 0.8 // High confidence for trivial classification
    };
  }

  /**
   * Create fallback User_State when analysis fails
   */
  private createFallbackUserState(timestamp: Date): UserState {
    return {
      fight: 0.3,    // Neutral
      flight: 0.3,   // Neutral
      fixes: 0.4,    // Slight bias toward problem-solving
      timestamp,
      confidence: 0.2 // Low confidence fallback
    };
  }

  /**
   * Get processing statistics for monitoring
   */
  getProcessingStats(): {
    triageEnabled: boolean;
    plaeEnabled: boolean;
    version: string;
  } {
    return {
      triageEnabled: true,
      plaeEnabled: true,
      version: '1.0.0'
    };
  }
}

/**
 * Singleton instance for global access
 */
export const ipbSystem = new IPBSystem();

// Re-export components for direct access if needed
export { initialTriage, plae };
export type { TriageResult, PLAEResult };