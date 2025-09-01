import { useState, useEffect, useCallback } from 'react';
import { 
  EmpatibrygganService, 
  EmotionalResponsePrediction, 
  MessageSuggestion 
} from '../services/empatibryggan-service';
import { MemoryAssistantService } from '../lib/memory/memory-assistant';
import { ConsentVerificationService } from '../lib/security/consent-verification';

/**
 * Hook for managing Empatibryggan communication coaching functionality
 * 
 * Provides state management and methods for:
 * - Checking availability between users
 * - Analyzing messages for emotional impact
 * - Managing suggestions and interventions
 */
export function useEmpatibryggan(senderId: string, recipientId: string) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<EmotionalResponsePrediction | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<MessageSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize service
  const [empatibrygganService] = useState(() => {
    const memoryAssistant = new MemoryAssistantService();
    const consentService = new ConsentVerificationService();
    return new EmpatibrygganService(memoryAssistant, consentService);
  });

  // Check availability on mount and when users change
  useEffect(() => {
    checkAvailability();
  }, [senderId, recipientId]);

  /**
   * Check if Empatibryggan is available for the current user pair
   */
  const checkAvailability = useCallback(async () => {
    if (!senderId || !recipientId) {
      setIsAvailable(false);
      setIsEnabled(false);
      return;
    }

    try {
      const available = await empatibrygganService.isEmpatibrygganAvailable(senderId, recipientId);
      setIsAvailable(available);
      setIsEnabled(available); // Auto-enable if available
      setError(null);
    } catch (err) {
      console.error('Error checking Empatibryggan availability:', err);
      setError('Failed to check Empatibryggan availability');
      setIsAvailable(false);
      setIsEnabled(false);
    }
  }, [senderId, recipientId, empatibrygganService]);

  /**
   * Analyze a message for emotional impact and generate suggestions
   */
  const analyzeMessage = useCallback(async (message: string): Promise<{
    prediction: EmotionalResponsePrediction | null;
    suggestions: MessageSuggestion[];
  }> => {
    if (!isEnabled || !message.trim()) {
      return { prediction: null, suggestions: [] };
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Predict emotional response
      const prediction = await empatibrygganService.predictEmotionalResponse(
        message,
        senderId,
        recipientId
      );

      setCurrentPrediction(prediction);

      // Generate suggestions if intervention is needed
      let suggestions: MessageSuggestion[] = [];
      if (prediction.intervention_level !== 'none') {
        suggestions = await empatibrygganService.generateMessageSuggestions(
          message,
          prediction,
          senderId,
          recipientId
        );
      }

      setCurrentSuggestions(suggestions);

      return { prediction, suggestions };
    } catch (err) {
      console.error('Error analyzing message:', err);
      setError('Failed to analyze message');
      return { prediction: null, suggestions: [] };
    } finally {
      setIsAnalyzing(false);
    }
  }, [isEnabled, senderId, recipientId, empatibrygganService]);

  /**
   * Toggle Empatibryggan on/off (only if available)
   */
  const toggleEnabled = useCallback(() => {
    if (isAvailable) {
      setIsEnabled(prev => !prev);
      if (!isEnabled) {
        // Clear state when disabling
        setCurrentPrediction(null);
        setCurrentSuggestions([]);
      }
    }
  }, [isAvailable, isEnabled]);

  /**
   * Clear current analysis state
   */
  const clearAnalysis = useCallback(() => {
    setCurrentPrediction(null);
    setCurrentSuggestions([]);
    setError(null);
  }, []);

  /**
   * Get intervention status for UI display
   */
  const getInterventionStatus = useCallback(() => {
    if (!currentPrediction) return null;

    return {
      level: currentPrediction.intervention_level,
      hasSuggestions: currentSuggestions.length > 0,
      confidence: currentPrediction.confidence,
      deltamagnitude: currentPrediction.predicted_delta.magnitude
    };
  }, [currentPrediction, currentSuggestions]);

  /**
   * Get summary of analysis for display
   */
  const getAnalysisSummary = useCallback(() => {
    if (!currentPrediction) return null;

    const { predicted_delta, intervention_level, confidence } = currentPrediction;
    
    let summary = '';
    let color = 'green';

    switch (intervention_level) {
      case 'high':
        summary = 'This message might cause significant misunderstanding or emotional reaction';
        color = 'red';
        break;
      case 'medium':
        summary = 'This message could be improved for better reception';
        color = 'yellow';
        break;
      case 'low':
        summary = 'Minor adjustments might help this message';
        color = 'blue';
        break;
      default:
        summary = 'This message looks good to send';
        color = 'green';
    }

    return {
      summary,
      color,
      confidence: Math.round(confidence * 100),
      details: {
        misunderstanding_risk: Math.round(predicted_delta.asynchronous_delta * 100),
        emotional_harmony: Math.round(predicted_delta.synchronous_delta * 100),
        overall_impact: Math.round(predicted_delta.magnitude * 100)
      }
    };
  }, [currentPrediction]);

  /**
   * Check if message needs review before sending
   */
  const needsReview = useCallback(() => {
    return currentPrediction?.intervention_level !== 'none' && currentSuggestions.length > 0;
  }, [currentPrediction, currentSuggestions]);

  /**
   * Get statistics about Empatibryggan usage
   */
  const getUsageStats = useCallback(() => {
    // This would typically come from stored analytics
    // For now, returning mock data
    return {
      messages_analyzed: 0,
      suggestions_accepted: 0,
      conflicts_prevented: 0,
      improvement_rate: 0
    };
  }, []);

  return {
    // State
    isAvailable,
    isEnabled,
    isAnalyzing,
    currentPrediction,
    currentSuggestions,
    error,

    // Actions
    checkAvailability,
    analyzeMessage,
    toggleEnabled,
    clearAnalysis,

    // Computed values
    getInterventionStatus,
    getAnalysisSummary,
    needsReview,
    getUsageStats,

    // Convenience flags
    hasActivePrediction: !!currentPrediction,
    hasSuggestions: currentSuggestions.length > 0,
    requiresIntervention: currentPrediction?.intervention_level !== 'none'
  };
}

export type EmpatibrygganHook = ReturnType<typeof useEmpatibryggan>;