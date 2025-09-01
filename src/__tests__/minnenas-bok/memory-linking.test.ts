/**
 * Unit tests for Minnenas Bok memory linking algorithms
 * Tests requirements 21.1-21.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MinnenasBookService } from '../../services/minnenas-bok-service';
import { MemoryAssistant } from '../../lib/memory/memory-assistant';
import { CognitiveAgent } from '../../lib/cognitive-agent';
import { MemoryLink, ConversationStarter } from '../../types/minnenas-bok';

// Mock dependencies
const mockMemoryAssistant = {
  queryGraphRAG: vi.fn()
} as unknown as MemoryAssistant;

const mockCoordinatorAgent = {
  id: 'test-coordinator-agent'
} as CognitiveAgent;

describe('MinnenasBookService', () => {
  let service: MinnenasBookService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MinnenasBookService(mockMemoryAssistant, mockCoordinatorAgent);
  });

  describe('Requirement 21.1: Mutual consent verification', () => {
    it('should verify mutual consent between two users', async () => {
      // Mock successful consent query
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([
        { consentA: { scope: 'share:memories_for_connection' }, consentB: { scope: 'share:memories_for_connection' } }
      ]);

      const result = await service.verifyMutualConsent('user1', 'user2');
      
      expect(result).toBe(true);
      expect(mockMemoryAssistant.queryGraphRAG).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (userA:User {id: $userA})'),
        { userA: 'user1', userB: 'user2' }
      );
    });

    it('should return false when mutual consent is missing', async () => {
      // Mock empty result (no mutual consent)
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([]);

      const result = await service.verifyMutualConsent('user1', 'user2');
      
      expect(result).toBe(false);
    });

    it('should handle consent verification errors gracefully', async () => {
      // Mock database error
      (mockMemoryAssistant.queryGraphRAG as any).mockRejectedValue(new Error('Database error'));

      const result = await service.verifyMutualConsent('user1', 'user2');
      
      expect(result).toBe(false);
    });
  });

  describe('Requirement 21.2: Background thematic analysis', () => {
    it('should initiate discovery task with verified consent', async () => {
      // Mock successful consent verification
      vi.spyOn(service as any, 'verifyAllMutualConsent').mockResolvedValue(true);
      vi.spyOn(service as any, 'performThematicAnalysis').mockResolvedValue(undefined);

      const task = await service.initiateDiscoveryTask(['user1', 'user2']);

      expect(task.targetUsers).toEqual(['user1', 'user2']);
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('low');
      expect(task.initiatedBy).toBe('test-coordinator-agent');
    });

    it('should reject discovery task without mutual consent', async () => {
      // Mock failed consent verification
      vi.spyOn(service as any, 'verifyAllMutualConsent').mockResolvedValue(false);

      await expect(service.initiateDiscoveryTask(['user1', 'user2']))
        .rejects.toThrow('Mutual consent not verified for all target users');
    });
  });

  describe('Requirement 21.3: Memory linking algorithm', () => {
    it('should calculate emotional similarity correctly', async () => {
      const emotionA = [0.8, 0.2, 0.1, 0.9]; // Happy, excited memory
      const emotionB = [0.7, 0.3, 0.2, 0.8]; // Similar emotional pattern
      const emotionC = [0.1, 0.9, 0.8, 0.2]; // Very different emotional pattern

      // Access private method for testing
      const calculateSimilarity = (service as any).calculateEmotionalSimilarity.bind(service);

      const similarityAB = calculateSimilarity(emotionA, emotionB);
      const similarityAC = calculateSimilarity(emotionA, emotionC);

      expect(similarityAB).toBeGreaterThan(0.8); // High similarity
      expect(similarityAC).toBeLessThan(0.5);    // Low similarity
      expect(similarityAB).toBeGreaterThan(similarityAC);
    });

    it('should handle invalid emotion vectors', async () => {
      const calculateSimilarity = (service as any).calculateEmotionalSimilarity.bind(service);

      expect(calculateSimilarity(null, [1, 2, 3])).toBe(0);
      expect(calculateSimilarity([1, 2], [1, 2, 3])).toBe(0);
      expect(calculateSimilarity([], [])).toBe(0);
    });

    it('should find memory links with high emotional similarity', async () => {
      const themeEvents = [
        {
          event: { id: 'event1' },
          userId: 'user1',
          emotion: [0.8, 0.2, 0.1, 0.9]
        },
        {
          event: { id: 'event2' },
          userId: 'user2',
          emotion: [0.7, 0.3, 0.2, 0.8]
        },
        {
          event: { id: 'event3' },
          userId: 'user1',
          emotion: [0.1, 0.9, 0.8, 0.2] // Different user, should be skipped
        }
      ];

      const findLinks = (service as any).findMemoryLinks.bind(service);
      const links = await findLinks('theme1', themeEvents);

      expect(links).toHaveLength(1);
      expect(links[0].sourceEventId).toBe('event1');
      expect(links[0].targetEventId).toBe('event2');
      expect(links[0].participants).toEqual(['user1', 'user2']);
      expect(links[0].emotionalSimilarity).toBeGreaterThan(0.7);
    });
  });

  describe('Requirement 21.4: Conversation starter generation', () => {
    it('should generate tactful conversation starter', async () => {
      const memoryLink: MemoryLink = {
        id: 'link1',
        sourceEventId: 'event1',
        targetEventId: 'event2',
        sharedThemeId: 'theme1',
        linkStrength: 0.85,
        emotionalSimilarity: 0.85,
        discoveredAt: new Date(),
        participants: ['user1', 'user2']
      };

      // Mock event details query
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([
        { event: { id: 'event1' }, themeName: 'childhood summers' },
        { event: { id: 'event2' }, themeName: 'childhood summers' }
      ]);

      const starter = await service.generateConversationStarter(memoryLink);

      expect(starter.memoryLink).toBe(memoryLink);
      expect(starter.sharedTheme).toBe('childhood summers');
      expect(starter.tactfulPresentation).toContain('childhood summers');
      expect(starter.tactfulPresentation).toContain('meaningful memories');
      expect(starter.suggestedContext).toContain('family gathering');
    });

    it('should follow Mirror & Harmonize strategy in presentation', async () => {
      const memoryLink: MemoryLink = {
        id: 'link1',
        sourceEventId: 'event1',
        targetEventId: 'event2',
        sharedThemeId: 'theme1',
        linkStrength: 0.85,
        emotionalSimilarity: 0.85,
        discoveredAt: new Date(),
        participants: ['user1', 'user2']
      };

      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([
        { event: { id: 'event1' }, themeName: 'family traditions' }
      ]);

      const starter = await service.generateConversationStarter(memoryLink);

      // Should contain Mirror element (acknowledgment)
      expect(starter.tactfulPresentation).toContain('I noticed');
      expect(starter.tactfulPresentation).toContain('meaningful memories');
      
      // Should contain Harmonize element (gentle suggestion)
      expect(starter.tactfulPresentation).toContain('Would you like to share');
      expect(starter.tactfulPresentation).toContain('closer together');
    });
  });

  describe('Requirement 21.5: No transitive sharing enforcement', () => {
    it('should only return direct mutual connections', async () => {
      // Mock query for authorized connections
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([
        { connectedUserId: 'user2' },
        { connectedUserId: 'user3' }
      ]);

      const connections = await service.getAuthorizedConnections('user1');

      expect(connections).toEqual(['user2', 'user3']);
      expect(mockMemoryAssistant.queryGraphRAG).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (user:User {id: $userId})'),
        { userId: 'user1' }
      );
    });

    it('should return empty array when no mutual connections exist', async () => {
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([]);

      const connections = await service.getAuthorizedConnections('user1');

      expect(connections).toEqual([]);
    });
  });

  describe('Requirement 21.6: Private memory exclusion', () => {
    it('should exclude private memories from analysis', async () => {
      // This is tested implicitly in the thematic analysis query
      // which includes "AND event.visibility <> 'private'"
      const performAnalysis = vi.spyOn(service as any, 'performThematicAnalysis');
      
      // Mock the internal query to verify it excludes private events
      (mockMemoryAssistant.queryGraphRAG as any).mockResolvedValue([]);
      
      const task = {
        id: 'test',
        targetUsers: ['user1', 'user2'],
        status: 'pending' as const,
        discoveredLinks: []
      };

      await (service as any).performThematicAnalysis(task);

      expect(mockMemoryAssistant.queryGraphRAG).toHaveBeenCalledWith(
        expect.stringContaining("event.visibility <> 'private'"),
        expect.any(Object)
      );
    });
  });
});