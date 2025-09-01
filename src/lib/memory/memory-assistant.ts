// Memory Management Unit - MemoryAssistant implementation

import { v4 as uuidv4 } from 'uuid';
import { 
  MemoryAssistant, 
  STMContext, 
  GraphQuery, 
  SemanticQuery, 
  GraphResult, 
  SemanticResult, 
  GraphData, 
  SemanticData, 
  Transaction, 
  TransactionResult, 
  StorageResult,
  ConflictError,
  MemoryAccessError
} from '../../types/memory';
import { UserState, MemoryScope } from '../../types';
import { GraphRAG } from './graph-rag';
import { SemanticRAG } from './semantic-rag';

/**
 * Implementation of the Memory Management Unit
 * Provides centralized API for all long-term memory operations
 */
export class MemoryAssistantImpl implements MemoryAssistant {
  private graphRAG: GraphRAG;
  private semanticRAG: SemanticRAG;
  private activeTransactions: Map<string, Transaction> = new Map();
  private stmContexts: Map<string, STMContext> = new Map();

  constructor(graphRAG: GraphRAG, semanticRAG: SemanticRAG) {
    this.graphRAG = graphRAG;
    this.semanticRAG = semanticRAG;
  }

  /**
   * Load context into Short-Term Memory for an agent
   */
  async loadSTM(contextThread: string, query: string): Promise<STMContext> {
    // Check if STM context already exists
    const existingContext = this.stmContexts.get(contextThread);
    if (existingContext && existingContext.expiresAt > new Date()) {
      return existingContext;
    }

    // Create new STM context
    const context: STMContext = {
      contextThread,
      graphData: [],
      semanticData: [],
      userStates: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      modified: false
    };

    // Load relevant data based on query
    try {
      // Query graph RAG for structured data
      const graphQuery: GraphQuery = {
        type: 'structured',
        query: {
          nodeTypes: ['Event', 'Theme', 'User', 'Contact'],
          relationshipTypes: ['PARTICIPATED_IN', 'RELATES_TO', 'OWNS_CONTACT'],
          filters: [
            {
              property: 'content',
              operator: 'contains',
              value: query
            }
          ],
          returnFields: ['id', 'content', 'timestamp', 'userState']
        },
        limit: 50
      };

      // Note: We'll need to get the memory scope from the context thread
      // For now, creating a basic scope - this should be passed in
      const basicScope: MemoryScope = {
        id: contextThread,
        user_ids: [],
        project_ids: [],
        contact_ids: [],
        permissions: { read: true, write: false, delete: false }
      };

      context.graphData = await this.queryGraphRAG(graphQuery, basicScope);

      // Query semantic RAG for associative data
      const semanticQuery: SemanticQuery = {
        text: query,
        embedding: await this.generateEmbedding(query),
        threshold: 0.7,
        limit: 20
      };

      context.semanticData = await this.querySemanticRAG(semanticQuery, basicScope);

      // Extract user states from results
      context.userStates = this.extractUserStates(context.graphData, context.semanticData);

      // Store context
      this.stmContexts.set(contextThread, context);

      return context;
    } catch (error) {
      throw new Error(`Failed to load STM context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Consolidate Short-Term Memory back into Long-Term Memory
   */
  async consolidateSTM(contextThread: string, stmContext: STMContext): Promise<void> {
    if (!stmContext.modified) {
      // No changes to consolidate
      return;
    }

    const transaction = await this.beginTransaction({
      id: contextThread,
      user_ids: [],
      project_ids: [],
      contact_ids: [],
      permissions: { read: true, write: true, delete: false }
    });

    try {
      // Consolidate graph data changes
      for (const graphResult of stmContext.graphData) {
        if (graphResult.metadata.properties._modified) {
          await this.updateGraphEntity(graphResult, transaction);
        }
      }

      // Consolidate semantic data changes
      for (const semanticResult of stmContext.semanticData) {
        if (semanticResult.metadata.tags.includes('_modified')) {
          await this.updateSemanticEntity(semanticResult, transaction);
        }
      }

      await this.commitTransaction(transaction);

      // Remove STM context
      this.stmContexts.delete(contextThread);
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw new Error(`Failed to consolidate STM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query the Graph RAG for structured data
   */
  async queryGraphRAG(query: GraphQuery, scope: MemoryScope): Promise<GraphResult[]> {
    this.validateMemoryAccess(scope, ['read']);
    
    try {
      return await this.graphRAG.query(query, scope);
    } catch (error) {
      throw new Error(`Graph RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Query the Semantic RAG for associative data
   */
  async querySemanticRAG(query: SemanticQuery, scope: MemoryScope): Promise<SemanticResult[]> {
    this.validateMemoryAccess(scope, ['read']);
    
    try {
      return await this.semanticRAG.query(query, scope);
    } catch (error) {
      throw new Error(`Semantic RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store data in Graph RAG with ACID compliance
   */
  async storeGraphRAG(data: GraphData, scope: MemoryScope): Promise<TransactionResult> {
    this.validateMemoryAccess(scope, ['write']);
    
    const transaction = await this.beginTransaction(scope);
    
    try {
      const result = await this.graphRAG.store(data, transaction);
      await this.commitTransaction(transaction);
      return result;
    } catch (error) {
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Store data in Semantic RAG with emotional context
   */
  async storeSemanticRAG(data: SemanticData, userState: UserState, scope: MemoryScope): Promise<StorageResult> {
    this.validateMemoryAccess(scope, ['write']);
    
    try {
      return await this.semanticRAG.store(data, userState, scope);
    } catch (error) {
      throw new Error(`Semantic RAG storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Begin a new transaction for ACID compliance
   */
  async beginTransaction(scope: MemoryScope): Promise<Transaction> {
    const transaction: Transaction = {
      id: uuidv4(),
      scope,
      startTime: new Date(),
      status: 'active',
      operations: []
    };

    this.activeTransactions.set(transaction.id, transaction);
    
    // Initialize transaction in Graph RAG
    await this.graphRAG.beginTransaction(transaction);
    
    return transaction;
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(transaction: Transaction): Promise<void> {
    if (transaction.status !== 'active') {
      throw new Error(`Cannot commit transaction ${transaction.id}: status is ${transaction.status}`);
    }

    try {
      await this.graphRAG.commitTransaction(transaction);
      transaction.status = 'committed';
    } catch (error) {
      transaction.status = 'failed';
      throw new Error(`Transaction commit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.activeTransactions.delete(transaction.id);
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transaction: Transaction): Promise<void> {
    if (transaction.status !== 'active') {
      throw new Error(`Cannot rollback transaction ${transaction.id}: status is ${transaction.status}`);
    }

    try {
      await this.graphRAG.rollbackTransaction(transaction);
      transaction.status = 'rolled_back';
    } catch (error) {
      transaction.status = 'failed';
      throw new Error(`Transaction rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.activeTransactions.delete(transaction.id);
    }
  }

  /**
   * Validate memory access permissions
   */
  private validateMemoryAccess(scope: MemoryScope, requiredPermissions: string[]): void {
    for (const permission of requiredPermissions) {
      if (permission === 'read' && !scope.permissions.read) {
        throw new MemoryAccessError('Read access denied', scope, requiredPermissions);
      }
      if (permission === 'write' && !scope.permissions.write) {
        throw new MemoryAccessError('Write access denied', scope, requiredPermissions);
      }
      if (permission === 'delete' && !scope.permissions.delete) {
        throw new MemoryAccessError('Delete access denied', scope, requiredPermissions);
      }
    }
  }

  /**
   * Generate embedding for text (placeholder implementation)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // This is a placeholder - in a real implementation, this would call
    // an embedding service like OpenAI's text-embedding-ada-002
    const hash = this.simpleHash(text);
    const embedding = new Array(1536).fill(0).map((_, i) => 
      Math.sin(hash + i) * 0.1
    );
    return embedding;
  }

  /**
   * Simple hash function for placeholder embedding
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Extract user states from query results
   */
  private extractUserStates(graphData: GraphResult[], semanticData: SemanticResult[]): UserState[] {
    const userStates: UserState[] = [];

    // Extract from graph data
    for (const result of graphData) {
      if (result.metadata.properties.userState) {
        userStates.push(result.metadata.properties.userState);
      }
    }

    // Extract from semantic data
    for (const result of semanticData) {
      if (result.userState) {
        userStates.push(result.userState);
      }
    }

    return userStates;
  }

  /**
   * Update graph entity during consolidation
   */
  private async updateGraphEntity(graphResult: GraphResult, transaction: Transaction): Promise<void> {
    const operation = {
      type: 'update' as const,
      entityType: graphResult.type as 'node' | 'relationship',
      entityId: graphResult.metadata.id,
      data: graphResult.data,
      timestamp: new Date()
    };

    transaction.operations.push(operation);
    await this.graphRAG.updateEntity(graphResult, transaction);
  }

  /**
   * Update semantic entity during consolidation
   */
  private async updateSemanticEntity(semanticResult: SemanticResult, transaction: Transaction): Promise<void> {
    // For semantic RAG, we typically create new entries rather than update
    // This maintains the associative nature of the semantic memory
    const semanticData: SemanticData = {
      content: semanticResult.content,
      embedding: semanticResult.embedding,
      metadata: {
        source: semanticResult.metadata.source,
        tags: semanticResult.metadata.tags.filter(tag => tag !== '_modified'),
        timestamp: new Date()
      }
    };

    await this.semanticRAG.store(semanticData, semanticResult.userState, transaction.scope);
  }

  /**
   * Get active transaction count (for monitoring)
   */
  getActiveTransactionCount(): number {
    return this.activeTransactions.size;
  }

  /**
   * Get STM context count (for monitoring)
   */
  getSTMContextCount(): number {
    return this.stmContexts.size;
  }

  /**
   * Cleanup expired STM contexts
   */
  cleanupExpiredContexts(): void {
    const now = new Date();
    for (const [contextThread, context] of Array.from(this.stmContexts.entries())) {
      if (context.expiresAt <= now) {
        this.stmContexts.delete(contextThread);
      }
    }
  }
}