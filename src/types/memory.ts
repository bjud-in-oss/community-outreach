// Memory Management Unit types and interfaces

import { UserState, MemoryScope } from './index';

/**
 * Memory Management Unit - centralized API for all long-term memory operations
 */
export interface MemoryAssistant {
  /**
   * Load context into Short-Term Memory for an agent
   * @param contextThread Context thread defining memory scope
   * @param query Query to filter relevant context
   * @returns Promise resolving to loaded STM context
   */
  loadSTM(contextThread: string, query: string): Promise<STMContext>;
  
  /**
   * Consolidate Short-Term Memory back into Long-Term Memory
   * @param contextThread Context thread identifier
   * @param stmContext STM context to consolidate
   * @returns Promise resolving when consolidation is complete
   */
  consolidateSTM(contextThread: string, stmContext: STMContext): Promise<void>;
  
  /**
   * Query the Graph RAG for structured data
   * @param query Cypher query or structured query object
   * @param scope Memory scope for access control
   * @returns Promise resolving to query results
   */
  queryGraphRAG(query: GraphQuery, scope: MemoryScope): Promise<GraphResult[]>;
  
  /**
   * Query the Semantic RAG for associative data
   * @param query Semantic query with embedding
   * @param scope Memory scope for access control
   * @returns Promise resolving to semantic results
   */
  querySemanticRAG(query: SemanticQuery, scope: MemoryScope): Promise<SemanticResult[]>;
  
  /**
   * Store data in Graph RAG with ACID compliance
   * @param data Data to store
   * @param scope Memory scope for access control
   * @returns Promise resolving to transaction result
   */
  storeGraphRAG(data: GraphData, scope: MemoryScope): Promise<TransactionResult>;
  
  /**
   * Store data in Semantic RAG with emotional context
   * @param data Data to store with embeddings
   * @param userState Associated user state vector
   * @param scope Memory scope for access control
   * @returns Promise resolving to storage result
   */
  storeSemanticRAG(data: SemanticData, userState: UserState, scope: MemoryScope): Promise<StorageResult>;
  
  /**
   * Begin a new transaction for ACID compliance
   * @param scope Memory scope for the transaction
   * @returns Promise resolving to transaction handle
   */
  beginTransaction(scope: MemoryScope): Promise<Transaction>;
  
  /**
   * Commit a transaction
   * @param transaction Transaction to commit
   * @returns Promise resolving when commit is complete
   */
  commitTransaction(transaction: Transaction): Promise<void>;
  
  /**
   * Rollback a transaction
   * @param transaction Transaction to rollback
   * @returns Promise resolving when rollback is complete
   */
  rollbackTransaction(transaction: Transaction): Promise<void>;
}

/**
 * Short-Term Memory context for agent operations
 */
export interface STMContext {
  /** Context thread identifier */
  contextThread: string;
  
  /** Loaded graph data */
  graphData: GraphResult[];
  
  /** Loaded semantic data */
  semanticData: SemanticResult[];
  
  /** Associated user states */
  userStates: UserState[];
  
  /** Context creation timestamp */
  createdAt: Date;
  
  /** Context expiration timestamp */
  expiresAt: Date;
  
  /** Whether this context has been modified */
  modified: boolean;
}

/**
 * Graph RAG query structure
 */
export interface GraphQuery {
  /** Query type */
  type: 'cypher' | 'structured';
  
  /** Query string or structured query object */
  query: string | StructuredQuery;
  
  /** Query parameters */
  parameters?: Record<string, any>;
  
  /** Maximum results to return */
  limit?: number;
}

/**
 * Structured query for Graph RAG
 */
export interface StructuredQuery {
  /** Node types to match */
  nodeTypes: string[];
  
  /** Relationship types to traverse */
  relationshipTypes: string[];
  
  /** Property filters */
  filters: PropertyFilter[];
  
  /** Return fields */
  returnFields: string[];
}

/**
 * Property filter for structured queries
 */
export interface PropertyFilter {
  /** Property name */
  property: string;
  
  /** Filter operator */
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  
  /** Filter value */
  value: any;
}

/**
 * Graph RAG query result
 */
export interface GraphResult {
  /** Result type */
  type: 'node' | 'relationship' | 'path';
  
  /** Result data */
  data: any;
  
  /** Result metadata */
  metadata: {
    id: string;
    labels?: string[];
    type?: string;
    properties: Record<string, any>;
  };
}

/**
 * Semantic RAG query structure
 */
export interface SemanticQuery {
  /** Query text */
  text: string;
  
  /** Query embedding vector */
  embedding: number[];
  
  /** Similarity threshold */
  threshold?: number;
  
  /** Maximum results to return */
  limit?: number;
  
  /** Filter by user state similarity */
  userStateFilter?: UserState;
}

/**
 * Semantic RAG query result
 */
export interface SemanticResult {
  /** Result content */
  content: string;
  
  /** Content embedding */
  embedding: number[];
  
  /** Similarity score */
  similarity: number;
  
  /** Associated user state */
  userState?: UserState;
  
  /** Result metadata */
  metadata: {
    id: string;
    timestamp: Date;
    source: string;
    tags: string[];
  };
}

/**
 * Graph data for storage
 */
export interface GraphData {
  /** Nodes to create/update */
  nodes: GraphNode[];
  
  /** Relationships to create/update */
  relationships: GraphRelationship[];
  
  /** Operation type */
  operation: 'create' | 'update' | 'delete' | 'merge';
}

/**
 * Graph node structure
 */
export interface GraphNode {
  /** Node ID (optional for creation) */
  id?: string;
  
  /** Node labels */
  labels: string[];
  
  /** Node properties */
  properties: Record<string, any>;
}

/**
 * Graph relationship structure
 */
export interface GraphRelationship {
  /** Relationship ID (optional for creation) */
  id?: string;
  
  /** Source node ID */
  fromNodeId: string;
  
  /** Target node ID */
  toNodeId: string;
  
  /** Relationship type */
  type: string;
  
  /** Relationship properties */
  properties: Record<string, any>;
}

/**
 * Semantic data for storage
 */
export interface SemanticData {
  /** Content to store */
  content: string;
  
  /** Content embedding */
  embedding: number[];
  
  /** Content metadata */
  metadata: {
    source: string;
    tags: string[];
    timestamp: Date;
  };
}

/**
 * Transaction handle for ACID operations
 */
export interface Transaction {
  /** Transaction ID */
  id: string;
  
  /** Transaction scope */
  scope: MemoryScope;
  
  /** Transaction start time */
  startTime: Date;
  
  /** Transaction status */
  status: 'active' | 'committed' | 'rolled_back' | 'failed';
  
  /** Operations performed in this transaction */
  operations: TransactionOperation[];
}

/**
 * Transaction operation record
 */
export interface TransactionOperation {
  /** Operation type */
  type: 'create' | 'update' | 'delete';
  
  /** Target entity type */
  entityType: 'node' | 'relationship';
  
  /** Entity ID */
  entityId: string;
  
  /** Operation data */
  data: any;
  
  /** Operation timestamp */
  timestamp: Date;
}

/**
 * Transaction result
 */
export interface TransactionResult {
  /** Transaction ID */
  transactionId: string;
  
  /** Success status */
  success: boolean;
  
  /** Created/updated entity IDs */
  entityIds: string[];
  
  /** Error message if failed */
  error?: string;
}

/**
 * Storage result for semantic data
 */
export interface StorageResult {
  /** Storage success status */
  success: boolean;
  
  /** Stored entity ID */
  entityId: string;
  
  /** Storage timestamp */
  timestamp: Date;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Conflict error for Optimistic Concurrency Control
 */
export class ConflictError extends Error {
  constructor(
    message: string,
    public readonly conflictingEntityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Memory access violation error
 */
export class MemoryAccessError extends Error {
  constructor(
    message: string,
    public readonly requestedScope: MemoryScope,
    public readonly requiredPermissions: string[]
  ) {
    super(message);
    this.name = 'MemoryAccessError';
  }
}