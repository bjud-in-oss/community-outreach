import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  EmpatibrygganService, 
  EmotionalResponsePrediction, 
  MessageSuggestion 
} from '../../services/empatibryggan-service';
import { MemoryAssistantService } from '../../lib/memory/memory-assistant';
import { ConsentVerificationService } from '../../lib/security/consent-verification';
import { UserState, AgentState, RelationalDelta } from '../../types';

// Mock dependencies
vi.mock('../../lib/memory/memory-assistant');
vi.mock('../../lib/security/consent-verification');

describe('EmpatibrygganService', () => {
  let empatibrygganService: EmpatibrygganService;
  let mockMemoryAssistant: any;
  let mockConsentService: any;

  const mockUserState: UserState = {
    fight: 0.3,
    flight: 0.2,
    fixes: 0.6,
    confidence: 0.7,
    timestamp: new Date()
  };

  const mockAgentState: AgentState = {
    confidence: 0.8,
    resonance: 0.7,
    focus: 0.9,
    timestamp: new Date()
  };

  const mockRelationalDelta: RelationalDelta = {
    asynchronous_delta: 0.4,
    synchronous_delta: 0.6,
    magnitude: 0.5,
    strategy: 'harmonize'
  };

  beforeEach(() => {
    mockMemoryAssistant = {
      queryGraphRAG: vi.fn().mockResolvedValue([])
    };
    
    mockConsentService = {
      verifyConsent: vi.fn().mockResolvedValue(true)
    };

    empatibrygganService = new EmpatibrygganService(
      mockMemoryAssistant,
      mockConsentService
    );
  });

  describe('Requirement 22.1: Mutual consent verification', () => {
    it('should return true when both users have given consent', async () => {
      mockConsentService.verifyConsent.mockResolvedValue(true);

      const result = await empatibrygganService.isEmpatibrygganAvailable('user1', 'user2');
      
      expect(result).toBe(true);
      expect(mockConsentService.verifyConsent).toHaveBeenCalledWith(
        'user1', 
        'user2', 
        'enable:empathy_bridge'
      );
    });

    it('should return false when sender has not given consent', async () => {
      mockConsentService.verifyConsent
        .mockResolvedValueOnce(false) // sender consent
        .mockResolvedValueOnce(true);  // recipient consent

      const result = await empatibrygganService.isEmpatibrygganAvailable('user1', 'user2');
      
      expect(result).toBe(false);
    });

    it('should return false when recipient has not given consent', async () => {
      mockConsentService.verifyConsent
        .mockResolvedValueOnce(true)  // sender consent
        .mockResolvedValueOnce(false); // recipient consent

      const result = await empatibrygganService.isEmpatibrygganAvailable('user1', 'user2');
      
      expect(result).toBe(false);
    });

    it('should handle consent verification errors gracefully', async () => {
      mockConsentService.verifyConsent.mockRejectedValue(new Error('Consent check failed'));

      const result = await empatibrygganService.isEmpatibrygganAvailable('user1', 'user2');
      
      expect(result).toBe(false);
    });
  });

  describe('Requirement 22.2: Emotional response prediction', () => {
    beforeEach(() => {
      // Mock consent as available
      mockConsentService.verifyConsent.mockResolvedValue(true);
      
      // Mock communication patterns
      mockMemoryAssistant.queryGraphRAG.mockResolvedValue([
        {
          emotional_context: { fight: 0.2, flight: 0.3, fixes: 0.5 },
          outcome: 'positive',
          timestamp: new Date()
        }
      ]);
    });

    it('should predict emotional response for a message', async () => {
      const message = "You need to fix this immediately!";
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        message, 
        'user1', 
        'user2'
      );

      expect(prediction).toBeDefined();
      expect(prediction.predicted_user_state).toBeDefined();
      expect(prediction.predicted_delta).toBeDefined();
      expect(['none', 'low', 'medium', 'high']).toContain(prediction.intervention_level);
      expect(prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
    });

    it('should predict high fight response for aggressive messages', async () => {
      const aggressiveMessage = "You're completely wrong and you need to fix this now!";
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        aggressiveMessage, 
        'user1', 
        'user2'
      );

      // Should predict some level of fight response
      expect(prediction.predicted_user_state.fight).toBeGreaterThan(0.3);
      expect(prediction.intervention_level).not.toBe('none');
    });

    it('should predict flight response for overwhelming messages', async () => {
      const overwhelmingMessage = "This is extremely urgent and critical and you must handle all of these complex requirements immediately with perfect execution or everything will fail catastrophically!";
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        overwhelmingMessage, 
        'user1', 
        'user2'
      );

      // Should predict some level of flight response due to overwhelming nature
      expect(prediction.predicted_user_state.flight).toBeGreaterThan(0.2);
    });

    it('should predict fixes response for clear requests', async () => {
      const clearRequest = "Could you please help me understand how to approach this task?";
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        clearRequest, 
        'user1', 
        'user2'
      );

      // Should predict problem-solving orientation
      expect(prediction.predicted_user_state.fixes).toBeGreaterThan(0.4);
      // Note: intervention level may still be triggered due to other factors
    });

    it('should throw error when Empatibryggan is not available', async () => {
      // Create a new service instance with consent denied
      const mockConsentServiceDenied = {
        verifyConsent: vi.fn().mockResolvedValue(false)
      };
      const empatibrygganServiceDenied = new EmpatibrygganService(
        mockMemoryAssistant,
        mockConsentServiceDenied
      );

      await expect(
        empatibrygganServiceDenied.predictEmotionalResponse("Test message", 'user1', 'user2')
      ).rejects.toThrow('Empatibryggan not available for these users');
    });
  });

  describe('Requirement 22.3: Proactive intervention with suggestions', () => {
    let mockPrediction: EmotionalResponsePrediction;

    beforeEach(() => {
      mockPrediction = {
        predicted_user_state: {
          fight: 0.8,
          flight: 0.2,
          fixes: 0.3,
          confidence: 0.6,
          timestamp: new Date()
        },
        predicted_delta: {
          asynchronous_delta: 0.7,
          synchronous_delta: 0.2,
          magnitude: 0.8,
          strategy: 'mirror'
        },
        intervention_level: 'high',
        confidence: 0.7,
        timestamp: new Date()
      };
    });

    it('should generate no suggestions when intervention level is none', async () => {
      const lowRiskPrediction = {
        ...mockPrediction,
        intervention_level: 'none' as const
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "Nice message",
        lowRiskPrediction,
        'user1',
        'user2'
      );

      expect(suggestions).toHaveLength(0);
    });

    it('should generate clarity suggestions for high asynchronous delta', async () => {
      const clarityPrediction = {
        ...mockPrediction,
        predicted_delta: {
          ...mockPrediction.predicted_delta,
          asynchronous_delta: 0.7
        },
        intervention_level: 'high' as const
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "Maybe you should perhaps consider possibly doing this thing",
        clarityPrediction,
        'user1',
        'user2'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      const claritySuggestion = suggestions.find(s => s.type === 'clarity');
      expect(claritySuggestion).toBeDefined();
      expect(claritySuggestion?.explanation).toContain('clearer');
    });

    it('should generate empathy suggestions for low synchronous delta', async () => {
      const empathyPrediction = {
        ...mockPrediction,
        predicted_delta: {
          ...mockPrediction.predicted_delta,
          synchronous_delta: 0.2
        },
        intervention_level: 'medium' as const
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "Fix this problem now",
        empathyPrediction,
        'user1',
        'user2'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      const empathySuggestion = suggestions.find(s => s.type === 'empathy');
      expect(empathySuggestion).toBeDefined();
      expect(empathySuggestion?.explanation).toContain('understood');
    });

    it('should generate tone suggestions for high emotional reactions', async () => {
      const tonePrediction = {
        ...mockPrediction,
        predicted_user_state: {
          ...mockPrediction.predicted_user_state,
          fight: 0.8
        },
        intervention_level: 'high' as const
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "You must do this right now!",
        tonePrediction,
        'user1',
        'user2'
      );

      expect(suggestions.length).toBeGreaterThan(0);
      const toneSuggestion = suggestions.find(s => s.type === 'tone');
      expect(toneSuggestion).toBeDefined();
      expect(toneSuggestion?.explanation).toContain('gentler');
    });

    it('should provide multiple suggestion types when multiple issues detected', async () => {
      const multiIssuePrediction = {
        ...mockPrediction,
        predicted_delta: {
          asynchronous_delta: 0.7, // High misunderstanding
          synchronous_delta: 0.2,   // Low empathy
          magnitude: 0.8,
          strategy: 'mirror' as const
        },
        predicted_user_state: {
          fight: 0.8, // High emotional reaction
          flight: 0.1,
          fixes: 0.2,
          confidence: 0.5,
          timestamp: new Date()
        },
        intervention_level: 'high' as const
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "You're wrong and you need to fix this mess immediately!",
        multiIssuePrediction,
        'user1',
        'user2'
      );

      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      
      const suggestionTypes = suggestions.map(s => s.type);
      expect(suggestionTypes).toContain('clarity');
      expect(suggestionTypes).toContain('empathy');
      expect(suggestionTypes).toContain('tone');
    });
  });

  describe('Requirement 22.4: Sender control over suggestions', () => {
    it('should always provide reasoning as neutral communication guidance', async () => {
      const mockPrediction: EmotionalResponsePrediction = {
        predicted_user_state: mockUserState,
        predicted_delta: mockRelationalDelta,
        intervention_level: 'medium',
        confidence: 0.7,
        timestamp: new Date()
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "Test message",
        mockPrediction,
        'user1',
        'user2'
      );

      suggestions.forEach(suggestion => {
        expect(suggestion.reasoning).toBe('neutral_communication_guidance');
        expect(suggestion.explanation).not.toContain('psychological');
        expect(suggestion.explanation).not.toContain('recipient feels');
        expect(suggestion.explanation).not.toContain('their personality');
      });
    });

    it('should provide clear explanations without exposing recipient psychology', async () => {
      const mockPrediction: EmotionalResponsePrediction = {
        predicted_user_state: mockUserState,
        predicted_delta: mockRelationalDelta,
        intervention_level: 'high',
        confidence: 0.8,
        timestamp: new Date()
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "You always mess things up!",
        mockPrediction,
        'user1',
        'user2'
      );

      suggestions.forEach(suggestion => {
        expect(suggestion.explanation).toBeDefined();
        expect(suggestion.explanation.length).toBeGreaterThan(10);
        
        // Should not expose recipient's psychological details
        expect(suggestion.explanation).not.toMatch(/they are|they feel|their psychology|their emotional/i);
        
        // Should focus on general communication principles
        expect(suggestion.explanation).toMatch(/might|could|communication|better received/i);
      });
    });

    it('should include confidence scores for all suggestions', async () => {
      const mockPrediction: EmotionalResponsePrediction = {
        predicted_user_state: mockUserState,
        predicted_delta: mockRelationalDelta,
        intervention_level: 'medium',
        confidence: 0.6,
        timestamp: new Date()
      };

      const suggestions = await empatibrygganService.generateMessageSuggestions(
        "This needs to be done",
        mockPrediction,
        'user1',
        'user2'
      );

      suggestions.forEach(suggestion => {
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
        expect(suggestion.confidence).toBeLessThanOrEqual(1);
        expect(typeof suggestion.confidence).toBe('number');
      });
    });
  });

  describe('Requirement 22.6: Message draft privacy', () => {
    it('should not save message drafts to long-term memory', async () => {
      // Mock a save method to verify it's not called
      const saveSpy = vi.fn();
      mockMemoryAssistant.saveToLTM = saveSpy;

      await empatibrygganService.predictEmotionalResponse(
        "This is a private draft message",
        'user1',
        'user2'
      );

      // Verify that no save operations were called
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should handle message analysis without persisting content', async () => {
      const sensitiveMessage = "This contains private information about my feelings";
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        sensitiveMessage,
        'user1',
        'user2'
      );

      expect(prediction).toBeDefined();
      
      // The prediction should be generated without the message being saved
      expect(prediction.predicted_user_state).toBeDefined();
      expect(prediction.predicted_delta).toBeDefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle empty messages gracefully', async () => {
      // Empty messages should still be processed but may have low confidence
      const prediction = await empatibrygganService.predictEmotionalResponse("", 'user1', 'user2');
      expect(prediction).toBeDefined();
      expect(prediction.confidence).toBeLessThan(0.5);
    });

    it('should handle very long messages', async () => {
      const longMessage = "A".repeat(10000);
      
      const prediction = await empatibrygganService.predictEmotionalResponse(
        longMessage,
        'user1',
        'user2'
      );

      expect(prediction).toBeDefined();
      expect(prediction.intervention_level).toBeDefined();
    });

    it('should handle network errors gracefully', async () => {
      // Create service with failing memory assistant
      const failingMemoryAssistant = {
        queryGraphRAG: vi.fn().mockRejectedValue(new Error('Network error'))
      };
      const empatibrygganServiceWithError = new EmpatibrygganService(
        failingMemoryAssistant,
        mockConsentService
      );

      // Should still provide predictions using default patterns
      const prediction = await empatibrygganServiceWithError.predictEmotionalResponse(
        "Test message",
        'user1',
        'user2'
      );

      expect(prediction).toBeDefined();
      expect(prediction.confidence).toBeLessThan(0.5); // Lower confidence due to missing data
    });

    it('should validate user IDs', async () => {
      // Empty user IDs should be handled gracefully
      const prediction1 = await empatibrygganService.predictEmotionalResponse("Test", '', 'user2');
      expect(prediction1.confidence).toBeLessThan(0.3);

      const prediction2 = await empatibrygganService.predictEmotionalResponse("Test", 'user1', '');
      expect(prediction2.confidence).toBeLessThan(0.3);
    });
  });

  describe('Integration with existing communication system', () => {
    it('should integrate with RelationalDelta calculation', async () => {
      const prediction = await empatibrygganService.predictEmotionalResponse(
        "Test message",
        'user1',
        'user2'
      );

      expect(prediction.predicted_delta).toBeDefined();
      expect(prediction.predicted_delta.asynchronous_delta).toBeGreaterThanOrEqual(0);
      expect(prediction.predicted_delta.synchronous_delta).toBeGreaterThanOrEqual(0);
      expect(prediction.predicted_delta.magnitude).toBeGreaterThanOrEqual(0);
      expect(['mirror', 'harmonize', 'listen']).toContain(prediction.predicted_delta.strategy);
    });

    it('should use Mirror & Harmonize strategy principles', async () => {
      const prediction = await empatibrygganService.predictEmotionalResponse(
        "I'm really frustrated with this situation",
        'user1',
        'user2'
      );

      // Should recognize emotional content and suggest appropriate strategy
      expect(['mirror', 'listen']).toContain(prediction.predicted_delta.strategy);
    });
  });
});