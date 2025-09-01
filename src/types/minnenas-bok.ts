/**
 * Types for the "Minnenas Bok" memory discovery application
 * Implements requirements 21.1-21.4
 */

export interface MemoryLink {
  id: string;
  sourceEventId: string;
  targetEventId: string;
  sharedThemeId: string;
  linkStrength: number; // 0-1 scale
  emotionalSimilarity: number; // 0-1 scale
  discoveredAt: Date;
  participants: string[]; // User IDs involved
}

export interface ConversationStarter {
  id: string;
  memoryLink: MemoryLink;
  sharedTheme: string;
  tactfulPresentation: string;
  suggestedContext: string[];
  createdAt: Date;
  usedAt?: Date;
}

export interface ThematicAnalysisResult {
  themeId: string;
  themeName: string;
  relatedEvents: Array<{
    eventId: string;
    userId: string;
    emotionalContext: number[];
    relevanceScore: number;
  }>;
  connectionStrength: number;
}

export interface MemoryDiscoveryConsent {
  userId: string;
  scope: 'share:memories_for_connection';
  status: 'active' | 'revoked';
  mutualConnections: string[]; // User IDs with mutual consent
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoveryTask {
  id: string;
  initiatedBy: string; // Agent ID
  targetUsers: string[];
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  discoveredLinks: MemoryLink[];
  createdAt: Date;
  completedAt?: Date;
}