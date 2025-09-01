// Integration tests for dual RAG architecture

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GraphRAG, SemanticRAG } from '../../lib/memory';
import { 
  GraphQuery, 
  SemanticQuery, 
  GraphData, 
  SemanticData,
  Transaction 
} from '../../types/memory';
import { UserState, MemoryScope } from '../../types';

// Mock Neo4j driver for testing
const mockNeo4jDriver = {
  session: vi.fn(),
  close: vi.fn()
};

const mockSession = {
  run: vi.fn(),
  close: vi.fn(),
  beginTransaction: vi.fn()
};

const mockTransaction = {
  run: vi.fn(),
  commit: vi.fn(),
  rollback: vi.fn(),
  close: vi.fn()
};

// Mock neo4j module
vi.mock('neo4j-driver', () => ({
  default: {
    driver: vi.fn(() => mockNeo4jDriver),
    auth: {
      basic: vi.fn()
    }
  }
}));

describe('Dual RAG Architecture Integration', () => {
  let graphRAG: GraphRAG;
  let semanticRAG: SemanticRAG;
  let testScope: MemoryScope;
  let testUserState: UserState;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initialize RAG systems
    graphRAG = new GraphRAG('bolt://localhost:7687', 'neo4j', 'password');
    semanticRAG = new SemanticRAG();
    
    // Setup mocks
    mockNeo4jDriver.session.mockReturnValue(mockSession);
    mockSession.beginTransaction.mockReturnValue(mockTransaction);
    
    testScope = {
      id: 'test-scope',
      user_ids: ['user1'],
      project_ids: ['project1'],
      contact_ids: ['contact1'],
      permissions: {
        read: true,
        write: true,
        delete: false
      }
    };

    testUserState = {
      fight: 0.2,
      flight: 0.1,
      fixes: 0.8,
      timestamp: new Date(),
      confidence: 0.9
    };
  });

  afterEach(async () => {
    await graphRAG.close();
    semanticRAG.clear();
    vi.restoreAllMocks();
  });

  describe('Graph RAG Operations', () => {
    it('should execute structured queries successfully', async () => {
      const mockRecords = [
        {
          keys: ['n'],
          _fields: [{
            identity: { toString: () => 'node1' },
            labels: ['User'],
            properties: { name: 'Test User', _version: 1 }
          }]
        }
      ];

      mockSession.run.mockResolvedValue({ records: mockRecords });

      const query: GraphQuery = {
        type: 'structured',
        query: {
          nodeTypes: ['User'],
          relationshipTypes: [],
          filters: [
            {
              property: 'name',
              operator: 'equals',
              value: 'Test User'
            }
          ],
          returnFields: ['n']
        }
      };

      const results = await graphRAG.query(query, testScope);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('node');
      expect(results[0].metadata.labels).toContain('User');
      expect(results[0].data.name).toBe('Test User');
    });

    it('should execute Cypher queries successfully', async () => {
      const mockRecords = [
        {
          keys: ['u', 'count'],
          _fields: [
            {
              identity: { toString: () => 'user1' },
              labels: ['User'],
              properties: { name: 'Test User' }
            },
            5
          ]
        }
      ];

      mockSession.run.mockResolvedValue({ records: mockRecords });

      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (u:User) RETURN u, count(*) as count',
        parameters: {}
      };

      const results = await graphRAG.query(query, testScope);

      expect(results).toHaveLength(1);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User)'),
        expect.any(Object)
      );
    });

    it('should store graph data with ACID compliance', async () => {
      const transaction: Transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active',
        operations: []
      };

      mockTransaction.run.mockResolvedValue({
        records: [{ get: () => 'node1' }]
      });

      const data: GraphData = {
        nodes: [
          {
            labels: ['User'],
            properties: { name: 'New User', email: 'user@example.com' }
          }
        ],
        relationships: [],
        operation: 'create'
      };

      await graphRAG.beginTransaction(transaction);
      const result = await graphRAG.store(data, transaction);

      expect(result.success).toBe(true);
      expect(result.entityIds).toHaveLength(1);
      expect(mockTransaction.run).toHaveBeenCalledWith(
        expect.stringContaining('CREATE'),
        expect.objectContaining({
          properties: expect.objectContaining({
            name: 'New User',
            email: 'user@example.com',
            _version: 1
          })
        })
      );
    });

    it('should handle optimistic concurrency control conflicts', async () => {
      const transaction: Transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active',
        operations: []
      };

      const graphResult = {
        type: 'node' as const,
        data: { name: 'Updated User' },
        metadata: {
          id: 'user1',
          labels: ['User'],
          properties: { _version: 1 }
        }
      };

      // Simulate version conflict
      mockTransaction.run.mockResolvedValue({ records: [] });

      await graphRAG.beginTransaction(transaction);

      await expect(graphRAG.updateEntity(graphResult, transaction))
        .rejects.toThrow('Optimistic concurrency control conflict');
    });

    it('should apply scope filtering to queries', async () => {
      const restrictedScope: MemoryScope = {
        id: 'restricted-scope',
        user_ids: ['user2'],
        project_ids: [],
        contact_ids: [],
        permissions: { read: true, write: false, delete: false }
      };

      mockSession.run.mockResolvedValue({ records: [] });

      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (n:User) RETURN n'
      };

      await graphRAG.query(query, restrictedScope);

      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('n0.userId IN $scope_user_ids'),
        expect.any(Object)
      );
    });
  });

  describe('Semantic RAG Operations', () => {
    it('should store and retrieve semantic data with embeddings', async () => {
      const data: SemanticData = {
        content: 'This is a test document about machine learning',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
        metadata: {
          source: 'test-document',
          tags: ['ml', 'test'],
          timestamp: new Date()
        }
      };

      const storeResult = await semanticRAG.store(data, testUserState, testScope);

      expect(storeResult.success).toBe(true);
      expect(storeResult.entityId).toBeDefined();

      // Query for similar content
      const query: SemanticQuery = {
        text: 'machine learning document',
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Identical embedding for perfect match
        threshold: 0.8,
        limit: 5
      };

      const results = await semanticRAG.query(query, testScope);

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe(data.content);
      expect(results[0].similarity).toBe(1.0); // Perfect similarity
      expect(results[0].userState).toEqual(testUserState);
    });

    it('should filter results by similarity threshold', async () => {
      // Store multiple documents with different embeddings
      const documents = [
        {
          content: 'Document about cats',
          embedding: [1.0, 0.0, 0.0, 0.0, 0.0],
          metadata: { source: 'doc1', tags: ['animals'], timestamp: new Date() }
        },
        {
          content: 'Document about dogs',
          embedding: [0.0, 1.0, 0.0, 0.0, 0.0],
          metadata: { source: 'doc2', tags: ['animals'], timestamp: new Date() }
        },
        {
          content: 'Document about programming',
          embedding: [0.0, 0.0, 1.0, 0.0, 0.0],
          metadata: { source: 'doc3', tags: ['tech'], timestamp: new Date() }
        }
      ];

      for (const doc of documents) {
        await semanticRAG.store(doc, testUserState, testScope);
      }

      // Query for cats (should match first document closely)
      const query: SemanticQuery = {
        text: 'cats',
        embedding: [0.9, 0.1, 0.0, 0.0, 0.0],
        threshold: 0.5,
        limit: 10
      };

      const results = await semanticRAG.query(query, testScope);

      // Should return documents above threshold, sorted by similarity
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('cats');
      
      // Results should be sorted by similarity (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].similarity).toBeGreaterThanOrEqual(results[i].similarity);
      }
    });

    it('should filter by user state similarity', async () => {
      const happyUserState: UserState = {
        fight: 0.1,
        flight: 0.1,
        fixes: 0.9,
        timestamp: new Date(),
        confidence: 0.8
      };

      const angryUserState: UserState = {
        fight: 0.9,
        flight: 0.1,
        fixes: 0.2,
        timestamp: new Date(),
        confidence: 0.8
      };

      // Store documents with different emotional contexts
      await semanticRAG.store({
        content: 'Happy content',
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5],
        metadata: { source: 'happy', tags: ['positive'], timestamp: new Date() }
      }, happyUserState, testScope);

      await semanticRAG.store({
        content: 'Angry content',
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5],
        metadata: { source: 'angry', tags: ['negative'], timestamp: new Date() }
      }, angryUserState, testScope);

      // Query with happy user state filter
      const query: SemanticQuery = {
        text: 'content',
        embedding: [0.5, 0.5, 0.5, 0.5, 0.5],
        threshold: 0.1,
        limit: 10,
        userStateFilter: happyUserState
      };

      const results = await semanticRAG.query(query, testScope);

      // Should prefer content with similar emotional context
      expect(results.length).toBeGreaterThan(0);
      // The happy content should be first due to better emotional state match
      expect(results[0].content).toBe('Happy content');
    });

    it('should handle scope-based access control', async () => {
      const userScope: MemoryScope = {
        id: 'user-scope',
        user_ids: ['user1'],
        project_ids: [],
        contact_ids: [],
        permissions: { read: true, write: true, delete: false }
      };

      const restrictedScope: MemoryScope = {
        id: 'restricted-scope',
        user_ids: ['user2'],
        project_ids: [],
        contact_ids: [],
        permissions: { read: true, write: false, delete: false }
      };

      // Store data with user1 scope
      await semanticRAG.store({
        content: 'User1 private content',
        embedding: [0.1, 0.2, 0.3],
        metadata: { source: 'private', tags: ['user:user1'], timestamp: new Date() }
      }, testUserState, userScope);

      // Query with user2 scope (should not see user1's content)
      const query: SemanticQuery = {
        text: 'private content',
        embedding: [0.1, 0.2, 0.3],
        threshold: 0.1
      };

      const results = await semanticRAG.query(query, restrictedScope);

      expect(results).toHaveLength(0);
    });
  });

  describe('Emotional Context Storage', () => {
    it('should store and retrieve User_State vectors with content', async () => {
      const emotionalContent = {
        content: 'I feel really excited about this new project!',
        embedding: [0.8, 0.1, 0.9, 0.2, 0.7],
        metadata: {
          source: 'user-journal',
          tags: ['emotion', 'excitement'],
          timestamp: new Date()
        }
      };

      const excitedUserState: UserState = {
        fight: 0.1,
        flight: 0.0,
        fixes: 0.9,
        timestamp: new Date(),
        confidence: 0.95
      };

      const result = await semanticRAG.store(emotionalContent, excitedUserState, testScope);
      expect(result.success).toBe(true);

      // Retrieve and verify emotional context is preserved
      const entry = semanticRAG.getEntry(result.entityId);
      expect(entry).toBeDefined();
      expect(entry!.userState).toEqual(excitedUserState);
      expect(entry!.content).toBe(emotionalContent.content);
    });

    it('should enable emotional context-based retrieval', async () => {
      // Store multiple entries with different emotional contexts
      const contexts = [
        {
          content: 'Frustrated with the bug',
          userState: { fight: 0.7, flight: 0.2, fixes: 0.3, timestamp: new Date(), confidence: 0.8 }
        },
        {
          content: 'Excited about the solution',
          userState: { fight: 0.1, flight: 0.1, fixes: 0.9, timestamp: new Date(), confidence: 0.9 }
        },
        {
          content: 'Worried about the deadline',
          userState: { fight: 0.2, flight: 0.8, fixes: 0.4, timestamp: new Date(), confidence: 0.7 }
        }
      ];

      for (let i = 0; i < contexts.length; i++) {
        await semanticRAG.store({
          content: contexts[i].content,
          embedding: new Array(5).fill(0).map(() => Math.random()),
          metadata: {
            source: `context-${i}`,
            tags: ['emotion'],
            timestamp: new Date()
          }
        }, contexts[i].userState, testScope);
      }

      // Query for content with similar emotional state (excited/positive)
      const query: SemanticQuery = {
        text: 'solution',
        embedding: new Array(5).fill(0).map(() => Math.random()),
        threshold: 0.1,
        userStateFilter: { fight: 0.1, flight: 0.1, fixes: 0.9, timestamp: new Date(), confidence: 0.9 }
      };

      const results = await semanticRAG.query(query, testScope);

      // Should find entries with similar emotional context
      expect(results.length).toBeGreaterThan(0);
      
      // Verify emotional similarity in results
      const excitedResults = results.filter(r => 
        r.userState && r.userState.fixes > 0.7 && r.userState.fight < 0.3
      );
      expect(excitedResults.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Between Graph and Semantic RAG', () => {
    it('should maintain consistency between structured and associative data', async () => {
      // Store structured data in Graph RAG
      const transaction: Transaction = {
        id: 'integration-tx',
        scope: testScope,
        startTime: new Date(),
        status: 'active',
        operations: []
      };

      mockTransaction.run.mockResolvedValue({
        records: [{ get: () => 'event1' }]
      });

      const eventData: GraphData = {
        nodes: [
          {
            labels: ['Event'],
            properties: {
              title: 'Project Meeting',
              description: 'Weekly team sync about the new feature',
              timestamp: new Date().toISOString(),
              userId: 'user1'
            }
          }
        ],
        relationships: [],
        operation: 'create'
      };

      await graphRAG.beginTransaction(transaction);
      const graphResult = await graphRAG.store(eventData, transaction);
      await graphRAG.commitTransaction(transaction);

      // Store related associative data in Semantic RAG
      const semanticData: SemanticData = {
        content: 'Weekly team sync about the new feature. Discussed progress and next steps.',
        embedding: [0.2, 0.8, 0.6, 0.4, 0.9],
        metadata: {
          source: 'event1', // Reference to graph entity
          tags: ['meeting', 'project', 'team'],
          timestamp: new Date()
        }
      };

      const meetingUserState: UserState = {
        fight: 0.1,
        flight: 0.2,
        fixes: 0.8,
        timestamp: new Date(),
        confidence: 0.85
      };

      const semanticResult = await semanticRAG.store(semanticData, meetingUserState, testScope);

      // Verify both stores succeeded
      expect(graphResult.success).toBe(true);
      expect(semanticResult.success).toBe(true);

      // Verify cross-references work
      const semanticEntry = semanticRAG.getEntry(semanticResult.entityId);
      expect(semanticEntry!.source).toBe('event1');
      expect(semanticEntry!.userState).toEqual(meetingUserState);
    });

    it('should support complex queries across both RAG systems', async () => {
      // This test would demonstrate how the MemoryAssistant coordinates
      // queries across both RAG systems, but since we're testing the RAG
      // systems in isolation here, we'll verify they can work together
      
      // Store related data in both systems
      const userId = 'user1';
      const projectId = 'project1';

      // Graph RAG: Store user and project relationship
      const transaction: Transaction = {
        id: 'complex-query-tx',
        scope: testScope,
        startTime: new Date(),
        status: 'active',
        operations: []
      };

      mockTransaction.run.mockResolvedValue({
        records: [{ get: () => 'rel1' }]
      });

      const relationshipData: GraphData = {
        nodes: [],
        relationships: [
          {
            fromNodeId: userId,
            toNodeId: projectId,
            type: 'WORKS_ON',
            properties: {
              role: 'developer',
              startDate: new Date().toISOString()
            }
          }
        ],
        operation: 'create'
      };

      await graphRAG.beginTransaction(transaction);
      await graphRAG.store(relationshipData, transaction);
      await graphRAG.commitTransaction(transaction);

      // Semantic RAG: Store project-related thoughts
      await semanticRAG.store({
        content: 'Really enjoying working on this project. The team is great!',
        embedding: [0.9, 0.1, 0.8, 0.3, 0.7],
        metadata: {
          source: 'user-thoughts',
          tags: [`project:${projectId}`, `user:${userId}`],
          timestamp: new Date()
        }
      }, testUserState, testScope);

      // Verify data can be retrieved with appropriate scope
      const projectScope: MemoryScope = {
        id: 'project-scope',
        user_ids: [userId],
        project_ids: [projectId],
        contact_ids: [],
        permissions: { read: true, write: true, delete: false }
      };

      const semanticQuery: SemanticQuery = {
        text: 'project team',
        embedding: [0.8, 0.2, 0.7, 0.4, 0.6],
        threshold: 0.3
      };

      const semanticResults = await semanticRAG.query(semanticQuery, projectScope);
      expect(semanticResults.length).toBeGreaterThan(0);
      expect(semanticResults[0].content).toContain('project');
    });
  });
});