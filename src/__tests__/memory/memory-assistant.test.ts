// Unit tests for MemoryAssistant API

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryAssistantImpl, GraphRAG, SemanticRAG } from '../../lib/memory';
import { 
  MemoryAssistant, 
  ConflictError, 
  MemoryAccessError,
  GraphQuery,
  SemanticQuery,
  GraphData,
  SemanticData
} from '../../types/memory';
import { UserState, MemoryScope } from '../../types';

// Mock implementations
const mockGraphRAG = {
  query: vi.fn(),
  store: vi.fn(),
  beginTransaction: vi.fn(),
  commitTransaction: vi.fn(),
  rollbackTransaction: vi.fn(),
  updateEntity: vi.fn(),
  close: vi.fn()
} as unknown as GraphRAG;

const mockSemanticRAG = {
  query: vi.fn(),
  store: vi.fn(),
  getEntry: vi.fn(),
  deleteEntry: vi.fn(),
  clear: vi.fn()
} as unknown as SemanticRAG;

describe('MemoryAssistant', () => {
  let memoryAssistant: MemoryAssistant;
  let testScope: MemoryScope;
  let testUserState: UserState;

  beforeEach(() => {
    vi.clearAllMocks();
    
    memoryAssistant = new MemoryAssistantImpl(mockGraphRAG, mockSemanticRAG);
    
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadSTM', () => {
    it('should load STM context successfully', async () => {
      const mockGraphResults = [
        {
          type: 'node' as const,
          data: { content: 'test content', timestamp: new Date() },
          metadata: {
            id: 'node1',
            labels: ['Event'],
            properties: { content: 'test content', userState: testUserState }
          }
        }
      ];

      const mockSemanticResults = [
        {
          content: 'semantic content',
          embedding: [0.1, 0.2, 0.3],
          similarity: 0.8,
          userState: testUserState,
          metadata: {
            id: 'semantic1',
            timestamp: new Date(),
            source: 'test',
            tags: ['test']
          }
        }
      ];

      vi.mocked(mockGraphRAG.query).mockResolvedValue(mockGraphResults);
      vi.mocked(mockSemanticRAG.query).mockResolvedValue(mockSemanticResults);

      const context = await memoryAssistant.loadSTM('test-context', 'test query');

      expect(context).toBeDefined();
      expect(context.contextThread).toBe('test-context');
      expect(context.graphData).toEqual(mockGraphResults);
      expect(context.semanticData).toEqual(mockSemanticResults);
      expect(context.userStates).toHaveLength(2); // One from graph, one from semantic
      expect(context.modified).toBe(false);
    });

    it('should return existing STM context if not expired', async () => {
      // First call to create context
      vi.mocked(mockGraphRAG.query).mockResolvedValue([]);
      vi.mocked(mockSemanticRAG.query).mockResolvedValue([]);

      const context1 = await memoryAssistant.loadSTM('test-context', 'test query');
      const context2 = await memoryAssistant.loadSTM('test-context', 'test query');

      expect(context1).toBe(context2);
      expect(mockGraphRAG.query).toHaveBeenCalledTimes(1);
      expect(mockSemanticRAG.query).toHaveBeenCalledTimes(1);
    });

    it('should handle query errors gracefully', async () => {
      vi.mocked(mockGraphRAG.query).mockRejectedValue(new Error('Graph query failed'));

      await expect(memoryAssistant.loadSTM('test-context', 'test query'))
        .rejects.toThrow('Failed to load STM context: Graph RAG query failed: Graph query failed');
    });
  });

  describe('consolidateSTM', () => {
    it('should skip consolidation if context not modified', async () => {
      const stmContext = {
        contextThread: 'test-context',
        graphData: [],
        semanticData: [],
        userStates: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        modified: false
      };

      await memoryAssistant.consolidateSTM('test-context', stmContext);

      expect(mockGraphRAG.beginTransaction).not.toHaveBeenCalled();
    });

    it('should consolidate modified STM context', async () => {
      const mockTransaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      const stmContext = {
        contextThread: 'test-context',
        graphData: [
          {
            type: 'node' as const,
            data: { content: 'modified content' },
            metadata: {
              id: 'node1',
              labels: ['Event'],
              properties: { _modified: true }
            }
          }
        ],
        semanticData: [
          {
            content: 'modified semantic content',
            embedding: [0.1, 0.2, 0.3],
            similarity: 0.8,
            metadata: {
              id: 'semantic1',
              timestamp: new Date(),
              source: 'test',
              tags: ['_modified']
            }
          }
        ],
        userStates: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        modified: true
      };

      vi.mocked(mockGraphRAG.beginTransaction).mockResolvedValue(undefined);
      vi.mocked(mockGraphRAG.commitTransaction).mockResolvedValue(undefined);
      vi.mocked(mockGraphRAG.updateEntity).mockResolvedValue(undefined);
      vi.mocked(mockSemanticRAG.store).mockResolvedValue({
        success: true,
        entityId: 'semantic1',
        timestamp: new Date()
      });

      // Mock the beginTransaction method to return our test transaction
      const beginTransactionSpy = vi.spyOn(memoryAssistant as any, 'beginTransaction')
        .mockResolvedValue(mockTransaction);

      await memoryAssistant.consolidateSTM('test-context', stmContext);

      expect(beginTransactionSpy).toHaveBeenCalled();
      expect(mockGraphRAG.updateEntity).toHaveBeenCalledWith(
        stmContext.graphData[0],
        mockTransaction
      );
      expect(mockSemanticRAG.store).toHaveBeenCalled();
      expect(mockGraphRAG.commitTransaction).toHaveBeenCalledWith(mockTransaction);
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      const stmContext = {
        contextThread: 'test-context',
        graphData: [
          {
            type: 'node' as const,
            data: { content: 'modified content' },
            metadata: {
              id: 'node1',
              labels: ['Event'],
              properties: { _modified: true }
            }
          }
        ],
        semanticData: [],
        userStates: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        modified: true
      };

      const beginTransactionSpy = vi.spyOn(memoryAssistant as any, 'beginTransaction')
        .mockResolvedValue(mockTransaction);
      const rollbackTransactionSpy = vi.spyOn(memoryAssistant as any, 'rollbackTransaction')
        .mockResolvedValue(undefined);

      vi.mocked(mockGraphRAG.updateEntity).mockRejectedValue(new Error('Update failed'));

      await expect(memoryAssistant.consolidateSTM('test-context', stmContext))
        .rejects.toThrow('Failed to consolidate STM: Update failed');

      expect(rollbackTransactionSpy).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('queryGraphRAG', () => {
    it('should query Graph RAG successfully', async () => {
      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (n:User) RETURN n',
        parameters: { userId: 'user1' }
      };

      const expectedResults = [
        {
          type: 'node' as const,
          data: { name: 'Test User' },
          metadata: {
            id: 'user1',
            labels: ['User'],
            properties: { name: 'Test User' }
          }
        }
      ];

      vi.mocked(mockGraphRAG.query).mockResolvedValue(expectedResults);

      const results = await memoryAssistant.queryGraphRAG(query, testScope);

      expect(results).toEqual(expectedResults);
      expect(mockGraphRAG.query).toHaveBeenCalledWith(query, testScope);
    });

    it('should validate memory access permissions', async () => {
      const readOnlyScope = {
        ...testScope,
        permissions: { read: false, write: false, delete: false }
      };

      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (n:User) RETURN n'
      };

      await expect(memoryAssistant.queryGraphRAG(query, readOnlyScope))
        .rejects.toThrow(MemoryAccessError);
    });

    it('should handle query errors', async () => {
      const query: GraphQuery = {
        type: 'cypher',
        query: 'INVALID CYPHER'
      };

      vi.mocked(mockGraphRAG.query).mockRejectedValue(new Error('Invalid query'));

      await expect(memoryAssistant.queryGraphRAG(query, testScope))
        .rejects.toThrow('Graph RAG query failed: Invalid query');
    });
  });

  describe('querySemanticRAG', () => {
    it('should query Semantic RAG successfully', async () => {
      const query: SemanticQuery = {
        text: 'test query',
        embedding: [0.1, 0.2, 0.3],
        threshold: 0.7,
        limit: 10
      };

      const expectedResults = [
        {
          content: 'test content',
          embedding: [0.1, 0.2, 0.3],
          similarity: 0.8,
          metadata: {
            id: 'semantic1',
            timestamp: new Date(),
            source: 'test',
            tags: ['test']
          }
        }
      ];

      vi.mocked(mockSemanticRAG.query).mockResolvedValue(expectedResults);

      const results = await memoryAssistant.querySemanticRAG(query, testScope);

      expect(results).toEqual(expectedResults);
      expect(mockSemanticRAG.query).toHaveBeenCalledWith(query, testScope);
    });

    it('should validate memory access permissions', async () => {
      const readOnlyScope = {
        ...testScope,
        permissions: { read: false, write: false, delete: false }
      };

      const query: SemanticQuery = {
        text: 'test query',
        embedding: [0.1, 0.2, 0.3]
      };

      await expect(memoryAssistant.querySemanticRAG(query, readOnlyScope))
        .rejects.toThrow(MemoryAccessError);
    });
  });

  describe('storeGraphRAG', () => {
    it('should store Graph RAG data successfully', async () => {
      const data: GraphData = {
        nodes: [
          {
            labels: ['User'],
            properties: { name: 'Test User' }
          }
        ],
        relationships: [],
        operation: 'create'
      };

      const expectedResult = {
        transactionId: 'tx1',
        success: true,
        entityIds: ['node1']
      };

      const mockTransaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      const beginTransactionSpy = vi.spyOn(memoryAssistant as any, 'beginTransaction')
        .mockResolvedValue(mockTransaction);
      const commitTransactionSpy = vi.spyOn(memoryAssistant as any, 'commitTransaction')
        .mockResolvedValue(undefined);

      vi.mocked(mockGraphRAG.store).mockResolvedValue(expectedResult);

      const result = await memoryAssistant.storeGraphRAG(data, testScope);

      expect(result).toEqual(expectedResult);
      expect(beginTransactionSpy).toHaveBeenCalledWith(testScope);
      expect(mockGraphRAG.store).toHaveBeenCalledWith(data, mockTransaction);
      expect(commitTransactionSpy).toHaveBeenCalledWith(mockTransaction);
    });

    it('should validate write permissions', async () => {
      const readOnlyScope = {
        ...testScope,
        permissions: { read: true, write: false, delete: false }
      };

      const data: GraphData = {
        nodes: [],
        relationships: [],
        operation: 'create'
      };

      await expect(memoryAssistant.storeGraphRAG(data, readOnlyScope))
        .rejects.toThrow(MemoryAccessError);
    });

    it('should rollback transaction on store error', async () => {
      const data: GraphData = {
        nodes: [],
        relationships: [],
        operation: 'create'
      };

      const mockTransaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      const beginTransactionSpy = vi.spyOn(memoryAssistant as any, 'beginTransaction')
        .mockResolvedValue(mockTransaction);
      const rollbackTransactionSpy = vi.spyOn(memoryAssistant as any, 'rollbackTransaction')
        .mockResolvedValue(undefined);

      vi.mocked(mockGraphRAG.store).mockRejectedValue(new Error('Store failed'));

      await expect(memoryAssistant.storeGraphRAG(data, testScope))
        .rejects.toThrow('Store failed');

      expect(rollbackTransactionSpy).toHaveBeenCalledWith(mockTransaction);
    });
  });

  describe('storeSemanticRAG', () => {
    it('should store Semantic RAG data successfully', async () => {
      const data: SemanticData = {
        content: 'test content',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          source: 'test',
          tags: ['test'],
          timestamp: new Date()
        }
      };

      const expectedResult = {
        success: true,
        entityId: 'semantic1',
        timestamp: new Date()
      };

      vi.mocked(mockSemanticRAG.store).mockResolvedValue(expectedResult);

      const result = await memoryAssistant.storeSemanticRAG(data, testUserState, testScope);

      expect(result).toEqual(expectedResult);
      expect(mockSemanticRAG.store).toHaveBeenCalledWith(data, testUserState, testScope);
    });

    it('should validate write permissions', async () => {
      const readOnlyScope = {
        ...testScope,
        permissions: { read: true, write: false, delete: false }
      };

      const data: SemanticData = {
        content: 'test content',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          source: 'test',
          tags: ['test'],
          timestamp: new Date()
        }
      };

      await expect(memoryAssistant.storeSemanticRAG(data, testUserState, readOnlyScope))
        .rejects.toThrow(MemoryAccessError);
    });
  });

  describe('transaction management', () => {
    it('should begin transaction successfully', async () => {
      vi.mocked(mockGraphRAG.beginTransaction).mockResolvedValue(undefined);

      const transaction = await memoryAssistant.beginTransaction(testScope);

      expect(transaction).toBeDefined();
      expect(transaction.scope).toEqual(testScope);
      expect(transaction.status).toBe('active');
      expect(mockGraphRAG.beginTransaction).toHaveBeenCalledWith(transaction);
    });

    it('should commit transaction successfully', async () => {
      const transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      vi.mocked(mockGraphRAG.commitTransaction).mockResolvedValue(undefined);

      await memoryAssistant.commitTransaction(transaction);

      expect(transaction.status).toBe('committed');
      expect(mockGraphRAG.commitTransaction).toHaveBeenCalledWith(transaction);
    });

    it('should rollback transaction successfully', async () => {
      const transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      vi.mocked(mockGraphRAG.rollbackTransaction).mockResolvedValue(undefined);

      await memoryAssistant.rollbackTransaction(transaction);

      expect(transaction.status).toBe('rolled_back');
      expect(mockGraphRAG.rollbackTransaction).toHaveBeenCalledWith(transaction);
    });

    it('should handle commit errors', async () => {
      const transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'active' as const,
        operations: []
      };

      vi.mocked(mockGraphRAG.commitTransaction).mockRejectedValue(new Error('Commit failed'));

      await expect(memoryAssistant.commitTransaction(transaction))
        .rejects.toThrow('Transaction commit failed: Commit failed');

      expect(transaction.status).toBe('failed');
    });

    it('should prevent operations on inactive transactions', async () => {
      const transaction = {
        id: 'tx1',
        scope: testScope,
        startTime: new Date(),
        status: 'committed' as const,
        operations: []
      };

      await expect(memoryAssistant.commitTransaction(transaction))
        .rejects.toThrow('Cannot commit transaction tx1: status is committed');

      await expect(memoryAssistant.rollbackTransaction(transaction))
        .rejects.toThrow('Cannot rollback transaction tx1: status is committed');
    });
  });

  describe('memory access control', () => {
    it('should allow access with proper permissions', async () => {
      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (n:User) RETURN n'
      };

      vi.mocked(mockGraphRAG.query).mockResolvedValue([]);

      await expect(memoryAssistant.queryGraphRAG(query, testScope))
        .resolves.toBeDefined();
    });

    it('should deny read access without permission', async () => {
      const noReadScope = {
        ...testScope,
        permissions: { read: false, write: true, delete: true }
      };

      const query: GraphQuery = {
        type: 'cypher',
        query: 'MATCH (n:User) RETURN n'
      };

      await expect(memoryAssistant.queryGraphRAG(query, noReadScope))
        .rejects.toThrow(MemoryAccessError);
    });

    it('should deny write access without permission', async () => {
      const noWriteScope = {
        ...testScope,
        permissions: { read: true, write: false, delete: true }
      };

      const data: GraphData = {
        nodes: [],
        relationships: [],
        operation: 'create'
      };

      await expect(memoryAssistant.storeGraphRAG(data, noWriteScope))
        .rejects.toThrow(MemoryAccessError);
    });
  });
});