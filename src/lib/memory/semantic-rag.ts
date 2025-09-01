// Semantic RAG implementation for associative data storage

import { v4 as uuidv4 } from 'uuid';
import {
  SemanticQuery,
  SemanticResult,
  SemanticData,
  StorageResult
} from '../../types/memory';
import { UserState, MemoryScope } from '../../types';

/**
 * Semantic RAG implementation for associative data storage
 * Provides embedding-based similarity search with emotional context
 */
export class SemanticRAG {
  private embeddings: Map<string, SemanticEntry> = new Map();
  private userStateIndex: Map<string, string[]> = new Map(); // userId -> entryIds

  constructor() {
    // Initialize the semantic memory store
  }

  /**
   * Query the semantic memory for associative data
   */
  async query(query: SemanticQuery, scope: MemoryScope): Promise<SemanticResult[]> {
    const results: SemanticResult[] = [];
    const queryEmbedding = query.embedding;
    const threshold = query.threshold || 0.7;
    const limit = query.limit || 10;

    // Get entries within scope
    const scopedEntries = this.getScopedEntries(scope);

    // Calculate similarities and collect results
    const similarities: Array<{ entry: SemanticEntry; similarity: number }> = [];

    for (const entry of scopedEntries) {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, entry.embedding);
      
      if (similarity >= threshold) {
        similarities.push({ entry, similarity });
      }
    }

    // Sort by similarity (descending) and apply limit
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, limit);

    // Filter by user state if specified
    const filteredResults = query.userStateFilter 
      ? this.filterByUserState(topResults, query.userStateFilter)
      : topResults;

    // Convert to SemanticResult format
    for (const { entry, similarity } of filteredResults) {
      results.push({
        content: entry.content,
        embedding: entry.embedding,
        similarity,
        userState: entry.userState,
        metadata: {
          id: entry.id,
          timestamp: entry.timestamp,
          source: entry.source,
          tags: entry.tags
        }
      });
    }

    return results;
  }

  /**
   * Store data in semantic memory with emotional context
   */
  async store(data: SemanticData, userState: UserState | undefined, scope: MemoryScope): Promise<StorageResult> {
    try {
      const entryId = uuidv4();
      const timestamp = new Date();

      const entry: SemanticEntry = {
        id: entryId,
        content: data.content,
        embedding: data.embedding,
        userState,
        source: data.metadata.source,
        tags: data.metadata.tags,
        timestamp,
        scope: scope.id,
        userId: scope.user_ids[0] || 'system' // Use first user ID or system
      };

      // Store the entry
      this.embeddings.set(entryId, entry);

      // Update user state index
      if (entry.userId) {
        const userEntries = this.userStateIndex.get(entry.userId) || [];
        userEntries.push(entryId);
        this.userStateIndex.set(entry.userId, userEntries);
      }

      return {
        success: true,
        entityId: entryId,
        timestamp
      };
    } catch (error) {
      return {
        success: false,
        entityId: '',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get entries within the specified scope
   */
  private getScopedEntries(scope: MemoryScope): SemanticEntry[] {
    const entries: SemanticEntry[] = [];

    for (const entry of Array.from(this.embeddings.values())) {
      // Check if entry is within scope
      if (this.isEntryInScope(entry, scope)) {
        entries.push(entry);
      }
    }

    return entries;
  }

  /**
   * Check if an entry is within the specified scope
   */
  private isEntryInScope(entry: SemanticEntry, scope: MemoryScope): boolean {
    // Check user access
    if (scope.user_ids.length > 0 && !scope.user_ids.includes(entry.userId)) {
      return false;
    }

    // Check project access (if entry has project context)
    if (scope.project_ids.length > 0 && entry.tags.some(tag => tag.startsWith('project:'))) {
      const entryProjectIds = entry.tags
        .filter(tag => tag.startsWith('project:'))
        .map(tag => tag.substring(8));
      
      if (!entryProjectIds.some(projectId => scope.project_ids.includes(projectId))) {
        return false;
      }
    }

    // Check contact access (if entry has contact context)
    if (scope.contact_ids.length > 0 && entry.tags.some(tag => tag.startsWith('contact:'))) {
      const entryContactIds = entry.tags
        .filter(tag => tag.startsWith('contact:'))
        .map(tag => tag.substring(8));
      
      if (!entryContactIds.some(contactId => scope.contact_ids.includes(contactId))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Filter results by user state similarity
   */
  private filterByUserState(
    results: Array<{ entry: SemanticEntry; similarity: number }>,
    targetUserState: UserState
  ): Array<{ entry: SemanticEntry; similarity: number }> {
    return results.filter(({ entry }) => {
      if (!entry.userState) return true; // Include entries without user state

      // Calculate user state similarity
      const stateSimilarity = this.calculateUserStateSimilarity(entry.userState, targetUserState);
      
      // Keep entries with similar emotional context (threshold: 0.5)
      return stateSimilarity >= 0.5;
    });
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) return 0;
    
    return dotProduct / magnitude;
  }

  /**
   * Calculate similarity between user states
   */
  private calculateUserStateSimilarity(state1: UserState, state2: UserState): number {
    // Calculate Euclidean distance in the 3D space (fight, flight, fixes)
    const fightDiff = state1.fight - state2.fight;
    const flightDiff = state1.flight - state2.flight;
    const fixesDiff = state1.fixes - state2.fixes;
    
    const distance = Math.sqrt(fightDiff * fightDiff + flightDiff * flightDiff + fixesDiff * fixesDiff);
    
    // Convert distance to similarity (0-1 scale)
    // Assuming max distance is sqrt(3) for normalized states
    const maxDistance = Math.sqrt(3);
    const similarity = 1 - (distance / maxDistance);
    
    return Math.max(0, similarity);
  }

  /**
   * Get entries by user ID
   */
  getEntriesByUser(userId: string): SemanticEntry[] {
    const entryIds = this.userStateIndex.get(userId) || [];
    return entryIds.map(id => this.embeddings.get(id)).filter(Boolean) as SemanticEntry[];
  }

  /**
   * Get entry by ID
   */
  getEntry(entryId: string): SemanticEntry | undefined {
    return this.embeddings.get(entryId);
  }

  /**
   * Delete entry by ID
   */
  deleteEntry(entryId: string): boolean {
    const entry = this.embeddings.get(entryId);
    if (!entry) return false;

    // Remove from main storage
    this.embeddings.delete(entryId);

    // Remove from user index
    if (entry.userId) {
      const userEntries = this.userStateIndex.get(entry.userId) || [];
      const updatedEntries = userEntries.filter(id => id !== entryId);
      
      if (updatedEntries.length === 0) {
        this.userStateIndex.delete(entry.userId);
      } else {
        this.userStateIndex.set(entry.userId, updatedEntries);
      }
    }

    return true;
  }

  /**
   * Get total number of entries
   */
  getEntryCount(): number {
    return this.embeddings.size;
  }

  /**
   * Get entries by tag
   */
  getEntriesByTag(tag: string): SemanticEntry[] {
    const entries: SemanticEntry[] = [];
    
    for (const entry of Array.from(this.embeddings.values())) {
      if (entry.tags.includes(tag)) {
        entries.push(entry);
      }
    }
    
    return entries;
  }

  /**
   * Update entry tags
   */
  updateEntryTags(entryId: string, newTags: string[]): boolean {
    const entry = this.embeddings.get(entryId);
    if (!entry) return false;

    entry.tags = newTags;
    return true;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.embeddings.clear();
    this.userStateIndex.clear();
  }
}

/**
 * Internal semantic entry structure
 */
interface SemanticEntry {
  id: string;
  content: string;
  embedding: number[];
  userState?: UserState;
  source: string;
  tags: string[];
  timestamp: Date;
  scope: string;
  userId: string;
}