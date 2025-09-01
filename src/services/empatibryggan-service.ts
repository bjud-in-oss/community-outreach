import { 
  UserState, 
  AgentState, 
  RelationalDelta, 
  UserInput,
  Contact,
  ConsentScope 
} from '../types';
import { DeltaCalculator } from '../lib/communication/delta-calculator';
import { MirrorHarmonizeStrategy } from '../lib/communication/mirror-harmonize-strategy';
import { ConsentVerificationService } from '../lib/security/consent-verification';
import { MemoryAssistantService } from '../lib/memory/memory-assistant';

/**
 * Empatibryggan Communication Coaching Service
 * 
 * Implements Requirements 22.1-22.4:
 * - Emotional response prediction using Cortex-mode simulation
 * - Proactive intervention for high negative Relational_Delta
 * - Suggestion system with sender control
 * - Privacy protection (no recipient psychological model details)
 */
export class EmpatibrygganService {
  private memoryAssistant: MemoryAssistantService;
  private consentService: ConsentVerificationService;

  constructor(
    memoryAssistant: MemoryAssistantService,
    consentService: ConsentVerificationService
  ) {
    this.memoryAssistant = memoryAssistant;
    this.consentService = consentService;
  }

  /**
   * Requirement 22.1: Check if Empatibryggan is available for two users
   */
  async isEmpatibrygganAvailable(
    senderId: string, 
    recipientId: string
  ): Promise<boolean> {
    try {
      // Check mutual consent with scope 'enable:empathy_bridge'
      const senderConsent = await this.consentService.verifyConsent(
        senderId,
        recipientId,
        'enable:empathy_bridge'
      );

      const recipientConsent = await this.consentService.verifyConsent(
        recipientId,
        senderId,
        'enable:empathy_bridge'
      );

      return senderConsent && recipientConsent;
    } catch (error) {
      console.error('Error checking Empatibryggan availability:', error);
      return false;
    }
  }

  /**
   * Requirement 22.2: Predict emotional response using Cortex-mode simulation
   */
  async predictEmotionalResponse(
    messageText: string,
    senderId: string,
    recipientId: string
  ): Promise<EmotionalResponsePrediction> {
    // Verify Empatibryggan is enabled
    const isAvailable = await this.isEmpatibrygganAvailable(senderId, recipientId);
    if (!isAvailable) {
      throw new Error('Empatibryggan not available for these users');
    }

    // Handle edge cases
    if (!messageText || messageText.trim().length === 0) {
      return {
        predicted_user_state: {
          fight: 0.1,
          flight: 0.1,
          fixes: 0.2,
          confidence: 0.2,
          timestamp: new Date()
        },
        predicted_delta: {
          asynchronous_delta: 0.3,
          synchronous_delta: 0.4,
          magnitude: 0.5,
          strategy: 'mirror'
        },
        intervention_level: 'low',
        confidence: 0.2,
        timestamp: new Date()
      };
    }

    if (!senderId || !recipientId) {
      return {
        predicted_user_state: {
          fight: 0.2,
          flight: 0.2,
          fixes: 0.3,
          confidence: 0.2,
          timestamp: new Date()
        },
        predicted_delta: {
          asynchronous_delta: 0.4,
          synchronous_delta: 0.3,
          magnitude: 0.5,
          strategy: 'mirror'
        },
        intervention_level: 'medium',
        confidence: 0.2,
        timestamp: new Date()
      };
    }

    try {
      // Get communication patterns from Graph RAG for both users
      const senderPatterns = await this.getCommunicationPatterns(senderId);
      const recipientPatterns = await this.getCommunicationPatterns(recipientId);

      // Simulate recipient's likely emotional state response
      const predictedUserState = await this.simulateRecipientResponse(
        messageText,
        senderPatterns,
        recipientPatterns
      );

      // Calculate predicted relational delta
      const currentAgentState = await this.getCurrentAgentState(senderId);
      const predictedDelta = DeltaCalculator.calculateRelationalDelta(
        predictedUserState,
        currentAgentState
      );

      // Determine intervention level
      const interventionLevel = this.determineInterventionLevel(predictedDelta);

      return {
        predicted_user_state: predictedUserState,
        predicted_delta: predictedDelta,
        intervention_level: interventionLevel,
        confidence: this.calculatePredictionConfidence(senderPatterns, recipientPatterns),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error predicting emotional response:', error);
      throw new Error('Failed to predict emotional response');
    }
  }

  /**
   * Requirement 22.3: Proactive intervention with alternative phrasing suggestions
   */
  async generateMessageSuggestions(
    originalMessage: string,
    prediction: EmotionalResponsePrediction,
    senderId: string,
    recipientId: string
  ): Promise<MessageSuggestion[]> {
    // Only intervene if high negative delta is predicted
    if (prediction.intervention_level === 'none') {
      return [];
    }

    try {
      const suggestions: MessageSuggestion[] = [];

      // Get sender's communication patterns for personalized suggestions
      const senderPatterns = await this.getCommunicationPatterns(senderId);

      // Generate alternative phrasings based on predicted issues
      if (prediction.predicted_delta.asynchronous_delta > 0.6) {
        // High misunderstanding risk - suggest clarity improvements
        const clarityImprovement = await this.generateClarityImprovement(
          originalMessage,
          senderPatterns
        );
        suggestions.push(clarityImprovement);
      }

      if (prediction.predicted_delta.synchronous_delta < 0.3) {
        // Low emotional resonance - suggest empathy improvements
        const empathyImprovement = await this.generateEmpathyImprovement(
          originalMessage,
          senderPatterns
        );
        suggestions.push(empathyImprovement);
      }

      if (prediction.predicted_user_state.fight > 0.7 || prediction.predicted_user_state.flight > 0.7) {
        // High emotional reaction predicted - suggest gentler approach
        const gentlerApproach = await this.generateGentlerApproach(
          originalMessage,
          senderPatterns
        );
        suggestions.push(gentlerApproach);
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating message suggestions:', error);
      return [];
    }
  }

  /**
   * Get communication patterns from Graph RAG without exposing psychological details
   */
  private async getCommunicationPatterns(userId: string): Promise<CommunicationPatterns> {
    try {
      // Query Graph RAG for communication-related events
      const communicationEvents = await this.memoryAssistant.queryGraphRAG(
        `MATCH (u:User {id: $userId})-[:PARTICIPATED_IN]->(e:Event)
         WHERE e.type = 'communication'
         RETURN e.emotional_context, e.outcome, e.timestamp
         ORDER BY e.timestamp DESC
         LIMIT 50`,
        { userId }
      );

      // Analyze patterns without exposing individual psychological details
      return this.analyzeCommunicationPatterns(communicationEvents);
    } catch (error) {
      console.error('Error getting communication patterns:', error);
      return this.getDefaultCommunicationPatterns();
    }
  }

  /**
   * Simulate recipient's emotional response using Cortex-mode
   */
  private async simulateRecipientResponse(
    messageText: string,
    senderPatterns: CommunicationPatterns,
    recipientPatterns: CommunicationPatterns
  ): Promise<UserState> {
    // This would typically involve a Cortex-mode LLM call
    // For now, implementing a simplified simulation based on patterns
    
    // Analyze message tone and content
    const messageTone = this.analyzeMessageTone(messageText);
    const messageContent = this.analyzeMessageContent(messageText);

    // Predict emotional response based on recipient patterns and message characteristics
    const predictedFight = this.predictFightResponse(messageTone, messageContent, recipientPatterns);
    const predictedFlight = this.predictFlightResponse(messageTone, messageContent, recipientPatterns);
    const predictedFixes = this.predictFixesResponse(messageTone, messageContent, recipientPatterns);
    
    // Calculate confidence based on pattern reliability
    const confidence = Math.min(
      recipientPatterns.reliability,
      senderPatterns.reliability
    );

    return {
      fight: predictedFight,
      flight: predictedFlight,
      fixes: predictedFixes,
      confidence: confidence,
      timestamp: new Date()
    };
  }

  /**
   * Analyze communication patterns from events
   */
  private analyzeCommunicationPatterns(events: any[]): CommunicationPatterns {
    if (events.length === 0) {
      return this.getDefaultCommunicationPatterns();
    }

    // Analyze emotional contexts and outcomes
    const emotionalContexts = events.map(e => e.emotional_context);
    const outcomes = events.map(e => e.outcome);

    // Calculate pattern metrics
    const avgEmotionalIntensity = this.calculateAverageEmotionalIntensity(emotionalContexts);
    const conflictSensitivity = this.calculateConflictSensitivity(outcomes);
    const communicationStyle = this.determineCommunicationStyle(emotionalContexts, outcomes);

    return {
      emotional_intensity: avgEmotionalIntensity,
      conflict_sensitivity: conflictSensitivity,
      communication_style: communicationStyle,
      reliability: Math.min(1.0, events.length / 20), // More events = higher reliability
      pattern_count: events.length
    };
  }

  /**
   * Generate clarity improvement suggestion
   */
  private async generateClarityImprovement(
    originalMessage: string,
    senderPatterns: CommunicationPatterns
  ): Promise<MessageSuggestion> {
    // Analyze message for clarity issues
    const clarityIssues = this.identifyClarityIssues(originalMessage);
    
    // Generate improved version
    const improvedMessage = this.improveClarityInMessage(originalMessage, clarityIssues);
    
    return {
      type: 'clarity',
      original_message: originalMessage,
      suggested_message: improvedMessage,
      explanation: 'This version might be clearer and reduce potential misunderstandings.',
      confidence: 0.8,
      reasoning: 'neutral_communication_guidance' // No psychological details exposed
    };
  }

  /**
   * Generate empathy improvement suggestion
   */
  private async generateEmpathyImprovement(
    originalMessage: string,
    senderPatterns: CommunicationPatterns
  ): Promise<MessageSuggestion> {
    // Add empathetic elements to the message
    const empathyElements = this.identifyEmpathyOpportunities(originalMessage);
    const improvedMessage = this.addEmpathyToMessage(originalMessage, empathyElements);
    
    return {
      type: 'empathy',
      original_message: originalMessage,
      suggested_message: improvedMessage,
      explanation: 'This approach might help the recipient feel more understood.',
      confidence: 0.7,
      reasoning: 'neutral_communication_guidance'
    };
  }

  /**
   * Generate gentler approach suggestion
   */
  private async generateGentlerApproach(
    originalMessage: string,
    senderPatterns: CommunicationPatterns
  ): Promise<MessageSuggestion> {
    // Soften the message tone
    const gentlerMessage = this.softenMessageTone(originalMessage);
    
    return {
      type: 'tone',
      original_message: originalMessage,
      suggested_message: gentlerMessage,
      explanation: 'A gentler approach might be better received in this context.',
      confidence: 0.75,
      reasoning: 'neutral_communication_guidance'
    };
  }

  // Helper methods for message analysis and improvement
  private analyzeMessageTone(message: string): MessageTone {
    // Simplified tone analysis
    const lowerMessage = message.toLowerCase();
    
    let directness = 0.5;
    let emotionalIntensity = 0.3;
    let positivity = 0.5;

    // Check for direct language
    if (lowerMessage.includes('you should') || lowerMessage.includes('you need to')) {
      directness += 0.3;
    }
    
    // Check for emotional intensity markers
    if (lowerMessage.includes('!') || lowerMessage.includes('really') || lowerMessage.includes('very')) {
      emotionalIntensity += 0.2;
    }
    
    // Check for positive/negative language
    const positiveWords = ['please', 'thank', 'appreciate', 'understand', 'help'];
    const negativeWords = ['wrong', 'bad', 'terrible', 'awful', 'hate'];
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) positivity += 0.1;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) positivity -= 0.2;
    });

    return {
      directness: Math.max(0, Math.min(1, directness)),
      emotional_intensity: Math.max(0, Math.min(1, emotionalIntensity)),
      positivity: Math.max(0, Math.min(1, positivity))
    };
  }

  private analyzeMessageContent(message: string): MessageContent {
    const lowerMessage = message.toLowerCase();
    
    return {
      is_request: lowerMessage.includes('can you') || lowerMessage.includes('could you') || lowerMessage.includes('please'),
      is_criticism: lowerMessage.includes('wrong') || lowerMessage.includes('bad') || lowerMessage.includes('should'),
      is_emotional: lowerMessage.includes('feel') || lowerMessage.includes('upset') || lowerMessage.includes('frustrated'),
      is_urgent: lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('immediately'),
      word_count: message.split(' ').length
    };
  }

  private predictFightResponse(
    tone: MessageTone, 
    content: MessageContent, 
    patterns: CommunicationPatterns
  ): number {
    let fightPrediction = 0.2; // Base level
    
    // High directness can trigger fight response in sensitive individuals
    if (tone.directness > 0.7 && patterns.conflict_sensitivity > 0.6) {
      fightPrediction += 0.3;
    }
    
    // Criticism often triggers fight response
    if (content.is_criticism) {
      fightPrediction += 0.4;
    }
    
    // Low positivity with high emotional intensity
    if (tone.positivity < 0.4 && tone.emotional_intensity > 0.6) {
      fightPrediction += 0.2;
    }
    
    return Math.max(0, Math.min(1, fightPrediction));
  }

  private predictFlightResponse(
    tone: MessageTone, 
    content: MessageContent, 
    patterns: CommunicationPatterns
  ): number {
    let flightPrediction = 0.1; // Base level
    
    // High emotional intensity can trigger flight in sensitive individuals
    if (tone.emotional_intensity > 0.7 && patterns.emotional_intensity > 0.6) {
      flightPrediction += 0.3;
    }
    
    // Urgent requests can be overwhelming
    if (content.is_urgent) {
      flightPrediction += 0.2;
    }
    
    // Very long messages can be overwhelming
    if (content.word_count > 100) {
      flightPrediction += 0.1;
    }
    
    return Math.max(0, Math.min(1, flightPrediction));
  }

  private predictFixesResponse(
    tone: MessageTone, 
    content: MessageContent, 
    patterns: CommunicationPatterns
  ): number {
    let fixesPrediction = 0.4; // Base level
    
    // Requests often trigger problem-solving mode
    if (content.is_request) {
      fixesPrediction += 0.3;
    }
    
    // Moderate directness with positive tone encourages fixes
    if (tone.directness > 0.4 && tone.directness < 0.8 && tone.positivity > 0.5) {
      fixesPrediction += 0.2;
    }
    
    return Math.max(0, Math.min(1, fixesPrediction));
  }

  // Additional helper methods would be implemented here...
  private determineInterventionLevel(delta: RelationalDelta): InterventionLevel {
    if (delta.magnitude > 0.7 || delta.asynchronous_delta > 0.6) {
      return 'high';
    } else if (delta.magnitude > 0.5 || delta.asynchronous_delta > 0.4) {
      return 'medium';
    } else if (delta.magnitude > 0.3) {
      return 'low';
    } else {
      return 'none';
    }
  }

  private calculatePredictionConfidence(
    senderPatterns: CommunicationPatterns,
    recipientPatterns: CommunicationPatterns
  ): number {
    return Math.min(senderPatterns.reliability, recipientPatterns.reliability);
  }

  private getCurrentAgentState(userId: string): Promise<AgentState> {
    // This would get the current agent state for the user
    // For now, returning a default state
    return Promise.resolve({
      confidence: 0.7,
      resonance: 0.6,
      focus: 0.8,
      timestamp: new Date()
    });
  }

  private getDefaultCommunicationPatterns(): CommunicationPatterns {
    return {
      emotional_intensity: 0.5,
      conflict_sensitivity: 0.5,
      communication_style: 'balanced',
      reliability: 0.3,
      pattern_count: 0
    };
  }

  private calculateAverageEmotionalIntensity(contexts: any[]): number {
    if (contexts.length === 0) return 0.5;
    
    const intensities = contexts.map(ctx => {
      if (ctx && typeof ctx === 'object') {
        return Math.max(ctx.fight || 0, ctx.flight || 0, ctx.fixes || 0);
      }
      return 0.5;
    });
    
    return intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
  }

  private calculateConflictSensitivity(outcomes: string[]): number {
    if (outcomes.length === 0) return 0.5;
    
    const negativeOutcomes = outcomes.filter(outcome => 
      outcome && (outcome.includes('conflict') || outcome.includes('misunderstanding'))
    ).length;
    
    return negativeOutcomes / outcomes.length;
  }

  private determineCommunicationStyle(contexts: any[], outcomes: string[]): CommunicationStyle {
    // Simplified style determination
    const avgIntensity = this.calculateAverageEmotionalIntensity(contexts);
    const conflictRate = this.calculateConflictSensitivity(outcomes);
    
    if (avgIntensity > 0.7) return 'direct';
    if (conflictRate > 0.6) return 'cautious';
    return 'balanced';
  }

  private identifyClarityIssues(message: string): string[] {
    const issues: string[] = [];
    
    if (message.length > 200) {
      issues.push('message_too_long');
    }
    
    if (message.split('.').length > 5) {
      issues.push('too_many_points');
    }
    
    if (message.includes('maybe') || message.includes('perhaps') || message.includes('might')) {
      issues.push('uncertain_language');
    }
    
    return issues;
  }

  private improveClarityInMessage(message: string, issues: string[]): string {
    let improved = message;
    
    if (issues.includes('message_too_long')) {
      // Suggest breaking into shorter sentences
      improved = improved.replace(/,\s+/g, '. ');
    }
    
    if (issues.includes('uncertain_language')) {
      improved = improved.replace(/maybe|perhaps|might/gi, '');
      improved = improved.replace(/\s+/g, ' ').trim();
    }
    
    return improved;
  }

  private identifyEmpathyOpportunities(message: string): string[] {
    const opportunities: string[] = [];
    
    if (!message.toLowerCase().includes('understand')) {
      opportunities.push('add_understanding');
    }
    
    if (!message.toLowerCase().includes('feel')) {
      opportunities.push('acknowledge_feelings');
    }
    
    return opportunities;
  }

  private addEmpathyToMessage(message: string, opportunities: string[]): string {
    let improved = message;
    
    if (opportunities.includes('add_understanding')) {
      improved = `I understand this might be important to you. ${improved}`;
    }
    
    if (opportunities.includes('acknowledge_feelings')) {
      improved = improved.replace(/\.$/, ', and I appreciate how you might be feeling about this.');
    }
    
    return improved;
  }

  private softenMessageTone(message: string): string {
    let softened = message;
    
    // Replace direct commands with requests
    softened = softened.replace(/You should/gi, 'You might consider');
    softened = softened.replace(/You need to/gi, 'It might help to');
    softened = softened.replace(/You must/gi, 'It would be great if you could');
    
    // Add softening phrases
    if (!softened.toLowerCase().includes('please')) {
      softened = softened.replace(/\.$/, ', please.');
    }
    
    return softened;
  }
}

// Type definitions for Empatibryggan
export interface EmotionalResponsePrediction {
  predicted_user_state: UserState;
  predicted_delta: RelationalDelta;
  intervention_level: InterventionLevel;
  confidence: number;
  timestamp: Date;
}

export interface MessageSuggestion {
  type: 'clarity' | 'empathy' | 'tone';
  original_message: string;
  suggested_message: string;
  explanation: string;
  confidence: number;
  reasoning: 'neutral_communication_guidance'; // Always neutral to protect privacy
}

export interface CommunicationPatterns {
  emotional_intensity: number;
  conflict_sensitivity: number;
  communication_style: CommunicationStyle;
  reliability: number;
  pattern_count: number;
}

export type InterventionLevel = 'none' | 'low' | 'medium' | 'high';
export type CommunicationStyle = 'direct' | 'cautious' | 'balanced';

export interface MessageTone {
  directness: number;
  emotional_intensity: number;
  positivity: number;
}

export interface MessageContent {
  is_request: boolean;
  is_criticism: boolean;
  is_emotional: boolean;
  is_urgent: boolean;
  word_count: number;
}