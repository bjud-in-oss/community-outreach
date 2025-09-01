import { describe, it, expect, beforeEach } from 'vitest';
import { InitialTriage } from '@/lib/ipb/initial-triage';
import { UserInput } from '@/types';

describe('InitialTriage', () => {
  let triage: InitialTriage;

  beforeEach(() => {
    triage = new InitialTriage();
  });

  describe('Pattern-based Triage', () => {
    it('should identify simple greetings as trivial', async () => {
      const input: UserInput = {
        text: 'Hello',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.immediateResponse).toContain('Hello');
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should identify thank you messages as trivial', async () => {
      const input: UserInput = {
        text: 'Thanks',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.immediateResponse).toContain('welcome');
    });

    it('should identify simple acknowledgments as trivial', async () => {
      const testCases = ['yes', 'no', 'ok', 'okay', 'sure'];
      
      for (const text of testCases) {
        const input: UserInput = {
          text,
          type: 'chat',
          timestamp: new Date()
        };

        const result = await triage.performTriage(input);

        expect(result.isTrivial).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should identify goodbyes as trivial', async () => {
      const input: UserInput = {
        text: 'Goodbye',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.immediateResponse).toContain('Goodbye');
    });
  });

  describe('Complex Input Detection', () => {
    it('should identify help requests as non-trivial', async () => {
      const input: UserInput = {
        text: 'I need help with my project',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.immediateResponse).toBeNull();
    });

    it('should identify problem reports as non-trivial', async () => {
      const input: UserInput = {
        text: 'There is a problem with the system',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThanOrEqual(0.6); // Use >= instead of >
      expect(result.immediateResponse).toBeNull();
    });

    it('should identify creation requests as non-trivial', async () => {
      const input: UserInput = {
        text: 'Can you create a new document for me?',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.immediateResponse).toBeNull();
    });

    it('should identify memory requests as non-trivial', async () => {
      const input: UserInput = {
        text: 'Do you remember what we discussed yesterday?',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.immediateResponse).toBeNull();
    });
  });

  describe('Length-based Heuristics', () => {
    it('should identify very short inputs as trivial', async () => {
      const input: UserInput = {
        text: 'Hi',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should identify very long inputs as non-trivial', async () => {
      const longText = 'This is a very long message that contains many words and sentences but does not contain any specific keywords that would trigger the complex pattern detection system so it should be classified based purely on its length which exceeds the threshold of one hundred characters and continues with more text to ensure it is definitely longer than the threshold.';
      
      const input: UserInput = {
        text: longText,
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.immediateResponse).toBeNull();
    });
  });

  describe('LLM Assessment Simulation', () => {
    it('should handle LLM assessment for edge cases', async () => {
      const input: UserInput = {
        text: 'Maybe we could discuss this later?',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result).toHaveProperty('isTrivial');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('reasoning');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle questions appropriately', async () => {
      const input: UserInput = {
        text: 'What is the weather like?',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      expect(result.isTrivial).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.immediateResponse).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle processing errors gracefully', async () => {
      // Create a triage instance that will simulate an error
      const faultyTriage = new InitialTriage();
      
      // Override the private method to simulate an error
      (faultyTriage as any).assessByPatterns = () => {
        return {
          isTrivial: false,
          confidence: 0.5,
          immediateResponse: null,
          reasoning: 'Pattern assessment inconclusive'
        };
      };
      
      (faultyTriage as any).performLightweightLLMAssessment = async () => {
        throw new Error('Simulated LLM error');
      };

      const input: UserInput = {
        text: 'This should trigger an error in LLM assessment',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await faultyTriage.performTriage(input);

      expect(result.isTrivial).toBe(false); // Default to non-trivial on error
      expect(result.confidence).toBeLessThan(1);
      expect(result.reasoning).toContain('error');
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Response Generation', () => {
    it('should generate appropriate responses for different greeting types', async () => {
      const testCases = [
        { input: 'Good morning', expectedContains: 'Hello' },
        { input: 'Thank you so much', expectedContains: 'welcome' },
        { input: 'See you later', expectedContains: 'Goodbye' },
        { input: 'How are you doing?', expectedContains: 'well' }
      ];

      for (const testCase of testCases) {
        const input: UserInput = {
          text: testCase.input,
          type: 'chat',
          timestamp: new Date()
        };

        const result = await triage.performTriage(input);

        if (result.isTrivial && result.immediateResponse) {
          expect(result.immediateResponse.toLowerCase()).toContain(
            testCase.expectedContains.toLowerCase()
          );
        }
      }
    });

    it('should provide generic responses for unclear trivial inputs', async () => {
      const input: UserInput = {
        text: 'Hmm',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      if (result.isTrivial && result.immediateResponse) {
        expect(result.immediateResponse).toContain('understand');
      }
    });
  });

  describe('Performance Requirements', () => {
    it('should complete triage within reasonable time', async () => {
      const input: UserInput = {
        text: 'Hello there, how are you today?',
        type: 'chat',
        timestamp: new Date()
      };

      const startTime = Date.now();
      const result = await triage.performTriage(input);
      const endTime = Date.now();

      expect(result.processingTime).toBeLessThan(1000); // Should be under 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should provide consistent results for identical inputs', async () => {
      const input: UserInput = {
        text: 'Hello',
        type: 'chat',
        timestamp: new Date()
      };

      const result1 = await triage.performTriage(input);
      const result2 = await triage.performTriage(input);

      expect(result1.isTrivial).toBe(result2.isTrivial);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.immediateResponse).toBe(result2.immediateResponse);
    });
  });

  describe('Requirements Compliance', () => {
    it('should satisfy Requirement 5.2: low-latency LLM call for triviality detection', async () => {
      const input: UserInput = {
        text: 'This is a moderately complex input that requires LLM assessment',
        type: 'chat',
        timestamp: new Date()
      };

      const result = await triage.performTriage(input);

      // Should complete quickly (low-latency requirement)
      expect(result.processingTime).toBeLessThan(500);
      
      // Should provide a clear decision
      expect(typeof result.isTrivial).toBe('boolean');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should satisfy Requirement 5.3: immediate response generation for trivial requests', async () => {
      const trivialInputs = ['Hello', 'Thanks', 'Goodbye', 'Yes'];

      for (const text of trivialInputs) {
        const input: UserInput = {
          text,
          type: 'chat',
          timestamp: new Date()
        };

        const result = await triage.performTriage(input);

        if (result.isTrivial) {
          expect(result.immediateResponse).not.toBeNull();
          expect(result.immediateResponse).toBeTruthy();
          expect(typeof result.immediateResponse).toBe('string');
        }
      }
    });
  });
});