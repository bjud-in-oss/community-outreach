/**
 * Minnenas Bok Service - Memory Discovery and Connection
 * Implements requirements 21.1-21.4
 */

import { 
  MemoryLink, 
  ConversationStarter, 
  ThematicAnalysisResult, 
  MemoryDiscoveryConsent,
  DiscoveryTask 
} from '../types/minnenas-bok';
import { CognitiveAgent } from '../lib/cognitive-agent';
import { MemoryAssistant } from '../lib/memory/memory-assistant';

export class MinnenasBookService {
  private memoryAssistant: MemoryAssistant;
  private coordinatorAgent: CognitiveAgent;

  constructor(memoryAssistant: MemoryAssistant, coordinatorAgent: CognitiveAgent) {
    this.memoryAssistant = memoryAssistant;
    this.coordinatorAgent = coordinatorAgent;
  }

  /**
   * Requirement 21.1: Verify mutual consent for memory sharing
   */
  async verifyMutualConsent(userA: string, userB: string): Promise<boolean> {
    try {
      // Query Graph RAG for mutual consent nodes
      const consentQuery = `
        MATCH (userA:User {id: $userA})-[:HAS_GIVEN]->(consentA:Consent {scope: 'share:memories_for_connection', status: 'active'})
        MATCH (userB:User {id: $userB})-[:HAS_GIVEN]->(consentB:Consent {scope: 'share:memories_for_connection', status: 'active'})
        MATCH (consentA)-[:APPLIES_TO]->(userB)
        MATCH (consentB)-[:APPLIES_TO]->(userA)
        RETURN consentA, consentB
      `;

      const result = await this.memoryAssistant.queryGraphRAG(consentQuery, { userA, userB });
      return result.length > 0;
    } catch (error) {
      console.error('Error verifying mutual consent:', error);
      return false;
    }
  }

  /**
   * Requirement 21.2: Initiate background thematic analysis in Autonomous Mode
   */
  async initiateDiscoveryTask(targetUsers: string[]): Promise<DiscoveryTask> {
    // Verify all users have mutual consent
    const consentVerified = await this.verifyAllMutualConsent(targetUsers);
    if (!consentVerified) {
      throw new Error('Mutual consent not verified for all target users');
    }

    const task: DiscoveryTask = {
      id: `discovery_${Date.now()}`,
      initiatedBy: this.coordinatorAgent.id,
      targetUsers,
      status: 'pending',
      priority: 'low', // Background task
      discoveredLinks: [],
      createdAt: new Date()
    };

    // Start background analysis
    this.performThematicAnalysis(task);
    
    return task;
  }

  /**
   * Requirement 21.2: Perform thematic analysis to find linked memories
   */
  private async performThematicAnalysis(task: DiscoveryTask): Promise<void> {
    try {
      task.status = 'analyzing';

      // Query for events from all target users with shared themes
      const themeQuery = `
        MATCH (user:User)-[:PARTICIPATED_IN]->(event:Event)-[:RELATES_TO]->(theme:Theme)
        WHERE user.id IN $userIds
        AND event.visibility <> 'private'
        RETURN event, theme, user.id as userId, event.emotionalContext as emotion
        ORDER BY theme.id, event.createdAt
      `;

      const events = await this.memoryAssistant.queryGraphRAG(themeQuery, { 
        userIds: task.targetUsers 
      });

      // Group events by theme
      const themeGroups = this.groupEventsByTheme(events);

      // Analyze each theme group for connections
      for (const [themeId, themeEvents] of themeGroups.entries()) {
        if (themeEvents.length >= 2) {
          const links = await this.findMemoryLinks(themeId, themeEvents);
          task.discoveredLinks.push(...links);
        }
      }

      task.status = 'completed';
      task.completedAt = new Date();

    } catch (error) {
      console.error('Error in thematic analysis:', error);
      task.status = 'failed';
    }
  }

  /**
   * Requirement 21.3: Find strong thematic links between events
   */
  private async findMemoryLinks(themeId: string, events: any[]): Promise<MemoryLink[]> {
    const links: MemoryLink[] = [];

    // Compare each pair of events from different users
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const eventA = events[i];
        const eventB = events[j];

        // Skip if same user (no self-linking)
        if (eventA.userId === eventB.userId) continue;

        // Calculate emotional similarity
        const emotionalSimilarity = this.calculateEmotionalSimilarity(
          eventA.emotion, 
          eventB.emotion
        );

        // Only create link if similarity is above threshold
        if (emotionalSimilarity > 0.7) {
          const link: MemoryLink = {
            id: `link_${eventA.event.id}_${eventB.event.id}`,
            sourceEventId: eventA.event.id,
            targetEventId: eventB.event.id,
            sharedThemeId: themeId,
            linkStrength: emotionalSimilarity,
            emotionalSimilarity,
            discoveredAt: new Date(),
            participants: [eventA.userId, eventB.userId]
          };

          links.push(link);
        }
      }
    }

    return links;
  }

  /**
   * Requirement 21.4: Generate conversation starters from memory links
   */
  async generateConversationStarter(memoryLink: MemoryLink): Promise<ConversationStarter> {
    // Get event details
    const eventQuery = `
      MATCH (event:Event)-[:RELATES_TO]->(theme:Theme)
      WHERE event.id IN [$sourceId, $targetId]
      RETURN event, theme.name as themeName
    `;

    const events = await this.memoryAssistant.queryGraphRAG(eventQuery, {
      sourceId: memoryLink.sourceEventId,
      targetId: memoryLink.targetEventId
    });

    // Use Mirror & Harmonize strategy for tactful presentation
    const tactfulPresentation = await this.createTactfulPresentation(
      memoryLink, 
      events
    );

    const conversationStarter: ConversationStarter = {
      id: `starter_${memoryLink.id}`,
      memoryLink,
      sharedTheme: events[0]?.themeName || 'shared experience',
      tactfulPresentation,
      suggestedContext: [
        'family gathering',
        'quiet conversation',
        'reminiscing together'
      ],
      createdAt: new Date()
    };

    return conversationStarter;
  }

  /**
   * Requirement 21.4: Create tactful presentation following Mirror & Harmonize
   */
  private async createTactfulPresentation(
    memoryLink: MemoryLink, 
    events: any[]
  ): Promise<string> {
    // Mirror: Acknowledge the shared experience
    const mirrorPhrase = `I noticed you both have meaningful memories about ${events[0]?.themeName}`;
    
    // Harmonize: Suggest gentle connection
    const harmonizePhrase = `Would you like to share those experiences with each other? Sometimes discovering these connections can bring families closer together.`;

    return `${mirrorPhrase}. ${harmonizePhrase}`;
  }

  /**
   * Helper: Calculate emotional similarity between two emotion vectors
   */
  private calculateEmotionalSimilarity(emotionA: number[], emotionB: number[]): number {
    if (!emotionA || !emotionB || emotionA.length !== emotionB.length) {
      return 0;
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < emotionA.length; i++) {
      dotProduct += emotionA[i] * emotionB[i];
      normA += emotionA[i] * emotionA[i];
      normB += emotionB[i] * emotionB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Helper: Group events by theme
   */
  private groupEventsByTheme(events: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();

    for (const event of events) {
      const themeId = event.theme.id;
      if (!groups.has(themeId)) {
        groups.set(themeId, []);
      }
      groups.get(themeId)!.push(event);
    }

    return groups;
  }

  /**
   * Helper: Verify mutual consent for all users
   */
  private async verifyAllMutualConsent(users: string[]): Promise<boolean> {
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const hasConsent = await this.verifyMutualConsent(users[i], users[j]);
        if (!hasConsent) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Requirement 21.5: Enforce no transitive sharing
   */
  async getAuthorizedConnections(userId: string): Promise<string[]> {
    const query = `
      MATCH (user:User {id: $userId})-[:HAS_GIVEN]->(consent:Consent {scope: 'share:memories_for_connection', status: 'active'})
      MATCH (consent)-[:APPLIES_TO]->(otherUser:User)
      MATCH (otherUser)-[:HAS_GIVEN]->(mutualConsent:Consent {scope: 'share:memories_for_connection', status: 'active'})
      MATCH (mutualConsent)-[:APPLIES_TO]->(user)
      RETURN DISTINCT otherUser.id as connectedUserId
    `;

    const result = await this.memoryAssistant.queryGraphRAG(query, { userId });
    return result.map(r => r.connectedUserId);
  }
}