import { UserInput } from '@/types';

/**
 * Result of initial triage assessment
 */
export interface TriageResult {
  /** Whether the request is trivial and can be handled immediately */
  isTrivial: boolean;
  
  /** Confidence level of the triage decision (0-1) */
  confidence: number;
  
  /** Immediate response if trivial, null otherwise */
  immediateResponse: string | null;
  
  /** Reasoning for the triage decision */
  reasoning: string;
  
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Initial Triage component for fast triviality detection
 * Implements Requirements 5.2, 5.3
 */
export class InitialTriage {
  private static readonly TRIVIAL_PATTERNS = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/i,
    /^(thanks?|thank you|thx)$/i,
    /^(yes|no|ok|okay|sure)$/i,
    /^(bye|goodbye|see you|talk later)$/i,
    /^(how are you|what's up|how's it going)$/i,
  ];

  private static readonly COMPLEX_INDICATORS = [
    /\b(help|problem|issue|error|bug|broken|fix|solve|analyze|explain|why|how)\b/i,
    /\b(create|build|make|develop|implement|design)\b/i,
    /\b(remember|recall|find|search|look up)\b/i,
    /\?.*\?/,  // Multiple question marks
    /[.!]{2,}/, // Multiple punctuation
  ];

  /**
   * Perform initial triage on user input
   * Single low-latency assessment for triviality detection
   */
  async performTriage(input: UserInput): Promise<TriageResult> {
    const startTime = Date.now();
    
    try {
      // Quick pattern-based assessment
      const patternResult = this.assessByPatterns(input.text);
      
      if (patternResult.isTrivial || patternResult.confidence >= 0.8) {
        // Return immediately for high-confidence decisions (trivial or non-trivial)
        const processingTime = Date.now() - startTime;
        return {
          ...patternResult,
          processingTime: Math.max(1, processingTime)
        };
      }

      // If not obviously trivial and low confidence, perform lightweight LLM assessment
      const llmResult = await this.performLightweightLLMAssessment(input);
      
      const processingTime = Date.now() - startTime;
      return {
        ...llmResult,
        processingTime: Math.max(1, processingTime)
      };
    } catch (error) {
      // On error, default to non-trivial to ensure proper processing
      const processingTime = Date.now() - startTime;
      return {
        isTrivial: false,
        confidence: 0.5,
        immediateResponse: null,
        reasoning: `Triage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: Math.max(1, processingTime) // Ensure at least 1ms
      };
    }
  }

  /**
   * Fast pattern-based assessment
   */
  private assessByPatterns(text: string): Omit<TriageResult, 'processingTime'> {
    const trimmedText = text.trim();
    
    // Check for trivial patterns
    for (const pattern of InitialTriage.TRIVIAL_PATTERNS) {
      if (pattern.test(trimmedText)) {
        return {
          isTrivial: true,
          confidence: 0.9,
          immediateResponse: this.generateTrivialResponse(trimmedText),
          reasoning: `Matched trivial pattern: ${pattern.source}`
        };
      }
    }

    // Check for complex indicators
    for (const pattern of InitialTriage.COMPLEX_INDICATORS) {
      if (pattern.test(trimmedText)) {
        return {
          isTrivial: false,
          confidence: 0.85,
          immediateResponse: null,
          reasoning: `Matched complex pattern: ${pattern.source}`
        };
      }
    }

    // Length-based heuristics
    if (trimmedText.length < 10) {
      return {
        isTrivial: true,
        confidence: 0.7,
        immediateResponse: this.generateGenericResponse(trimmedText),
        reasoning: 'Very short input, likely trivial'
      };
    }

    if (trimmedText.length > 100) {
      return {
        isTrivial: false,
        confidence: 0.8,
        immediateResponse: null,
        reasoning: 'Long input, likely complex'
      };
    }

    // Default to uncertain, requires LLM assessment
    return {
      isTrivial: false,
      confidence: 0.5,
      immediateResponse: null,
      reasoning: 'Pattern assessment inconclusive'
    };
  }

  /**
   * Lightweight LLM assessment for edge cases
   * Single, optimized call for triviality detection
   */
  private async performLightweightLLMAssessment(input: UserInput): Promise<Omit<TriageResult, 'processingTime'>> {
    // Simulate LLM call with optimized prompt for triviality detection
    // In real implementation, this would be a single, fast LLM API call
    
    const prompt = this.buildTriagePrompt(input.text);
    
    try {
      // Simulate LLM response processing
      const llmResponse = await this.simulateLLMCall(prompt);
      return this.parseLLMTriageResponse(llmResponse, input.text);
    } catch (error) {
      // Fallback to conservative assessment
      return {
        isTrivial: false,
        confidence: 0.3,
        immediateResponse: null,
        reasoning: `LLM assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Build optimized prompt for triviality assessment
   */
  private buildTriagePrompt(text: string): string {
    return `Assess if this user input is trivial (simple greeting, acknowledgment, or basic social interaction) or requires deeper processing:

Input: "${text}"

Respond with:
TRIVIAL: [yes/no]
CONFIDENCE: [0.0-1.0]
RESPONSE: [immediate response if trivial, or "NONE"]
REASON: [brief explanation]

Keep response under 100 tokens.`;
  }

  /**
   * Simulate LLM call for development/testing
   * In production, this would be replaced with actual LLM API call
   */
  private async simulateLLMCall(prompt: string): Promise<string> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Simple simulation based on prompt content
    const input = prompt.match(/Input: "(.+)"/)?.[1] || '';
    
    if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
      return `TRIVIAL: yes
CONFIDENCE: 0.95
RESPONSE: Hello! How can I help you today?
REASON: Simple greeting`;
    }
    
    if (input.toLowerCase().includes('help') || input.includes('?')) {
      return `TRIVIAL: no
CONFIDENCE: 0.85
RESPONSE: NONE
REASON: Request for help or contains question`;
    }
    
    // Check if input is very long
    if (input.length > 100) {
      return `TRIVIAL: no
CONFIDENCE: 0.85
RESPONSE: NONE
REASON: Long input, likely complex`;
    }
    
    return `TRIVIAL: no
CONFIDENCE: 0.6
RESPONSE: NONE
REASON: Uncertain, requires deeper analysis`;
  }

  /**
   * Parse LLM response for triage decision
   */
  private parseLLMTriageResponse(response: string, originalText: string): Omit<TriageResult, 'processingTime'> {
    try {
      const lines = response.split('\n');
      const trivialMatch = lines.find(l => l.startsWith('TRIVIAL:'))?.split(':')[1]?.trim().toLowerCase();
      const confidenceMatch = lines.find(l => l.startsWith('CONFIDENCE:'))?.split(':')[1]?.trim();
      const responseMatch = lines.find(l => l.startsWith('RESPONSE:'))?.split(':')[1]?.trim();
      const reasonMatch = lines.find(l => l.startsWith('REASON:'))?.split(':')[1]?.trim();

      const isTrivial = trivialMatch === 'yes';
      const confidence = parseFloat(confidenceMatch || '0.5');
      const immediateResponse = responseMatch === 'NONE' ? null : responseMatch || null;
      const reasoning = reasonMatch || 'LLM assessment completed';

      return {
        isTrivial,
        confidence: Math.max(0, Math.min(1, confidence)),
        immediateResponse,
        reasoning
      };
    } catch (error) {
      // Fallback parsing
      return {
        isTrivial: false,
        confidence: 0.4,
        immediateResponse: null,
        reasoning: `Failed to parse LLM response: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate appropriate response for trivial inputs
   */
  private generateTrivialResponse(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('good morning') || lowerText.includes('good afternoon') || lowerText.includes('good evening')) {
      return 'Hello! How can I help you today?';
    }
    
    if (lowerText.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('see you') || lowerText.includes('talk later')) {
      return 'Goodbye! Feel free to come back anytime.';
    }
    
    if (lowerText.includes('how are you') || lowerText.includes("what's up") || lowerText.includes("how's it going")) {
      return "I'm doing well, thank you for asking! How are you doing today?";
    }
    
    return this.generateGenericResponse(text);
  }

  /**
   * Generate generic response for unclear trivial inputs
   */
  private generateGenericResponse(text: string): string {
    return "I understand. Is there something specific I can help you with?";
  }
}

/**
 * Singleton instance for global access
 */
export const initialTriage = new InitialTriage();