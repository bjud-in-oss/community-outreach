// Memory system factory for initializing dual RAG architecture

import { MemoryAssistantImpl, GraphRAG, SemanticRAG } from './index';
import { MemoryAssistant } from '../../types/memory';

/**
 * Configuration for memory system initialization
 */
export interface MemoryConfig {
  /** Neo4j connection configuration */
  neo4j: {
    uri: string;
    username: string;
    password: string;
  };
  
  /** Semantic RAG configuration */
  semantic: {
    /** Embedding dimension */
    embeddingDimension: number;
    
    /** Default similarity threshold */
    defaultThreshold: number;
    
    /** Maximum entries to keep in memory */
    maxEntries?: number;
  };
  
  /** Memory management configuration */
  management: {
    /** STM context expiration time in minutes */
    stmExpirationMinutes: number;
    
    /** Cleanup interval in minutes */
    cleanupIntervalMinutes: number;
    
    /** Maximum concurrent transactions */
    maxConcurrentTransactions: number;
  };
}

/**
 * Factory class for creating and managing memory system components
 */
export class MemoryFactory {
  private static instance: MemoryFactory | null = null;
  private memoryAssistant: MemoryAssistant | null = null;
  private graphRAG: GraphRAG | null = null;
  private semanticRAG: SemanticRAG | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  /**
   * Get singleton instance of MemoryFactory
   */
  static getInstance(): MemoryFactory {
    if (!MemoryFactory.instance) {
      MemoryFactory.instance = new MemoryFactory();
    }
    return MemoryFactory.instance;
  }

  /**
   * Initialize the memory system with configuration
   */
  async initialize(config: MemoryConfig): Promise<MemoryAssistant> {
    if (this.memoryAssistant) {
      throw new Error('Memory system already initialized');
    }

    try {
      // Initialize Graph RAG with Neo4j
      this.graphRAG = new GraphRAG(
        config.neo4j.uri,
        config.neo4j.username,
        config.neo4j.password
      );

      // Initialize Semantic RAG
      this.semanticRAG = new SemanticRAG();

      // Create Memory Assistant
      this.memoryAssistant = new MemoryAssistantImpl(this.graphRAG, this.semanticRAG);

      // Setup periodic cleanup
      this.setupCleanup(config.management.cleanupIntervalMinutes);

      // Verify connections
      await this.verifyConnections();

      return this.memoryAssistant;
    } catch (error) {
      await this.cleanup();
      throw new Error(`Failed to initialize memory system: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the initialized memory assistant
   */
  getMemoryAssistant(): MemoryAssistant {
    if (!this.memoryAssistant) {
      throw new Error('Memory system not initialized. Call initialize() first.');
    }
    return this.memoryAssistant;
  }

  /**
   * Get the Graph RAG instance
   */
  getGraphRAG(): GraphRAG {
    if (!this.graphRAG) {
      throw new Error('Memory system not initialized. Call initialize() first.');
    }
    return this.graphRAG;
  }

  /**
   * Get the Semantic RAG instance
   */
  getSemanticRAG(): SemanticRAG {
    if (!this.semanticRAG) {
      throw new Error('Memory system not initialized. Call initialize() first.');
    }
    return this.semanticRAG;
  }

  /**
   * Create default configuration for development
   */
  static createDefaultConfig(): MemoryConfig {
    return {
      neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'password'
      },
      semantic: {
        embeddingDimension: 1536, // OpenAI text-embedding-ada-002 dimension
        defaultThreshold: 0.7,
        maxEntries: 10000
      },
      management: {
        stmExpirationMinutes: 30,
        cleanupIntervalMinutes: 15,
        maxConcurrentTransactions: 100
      }
    };
  }

  /**
   * Create configuration for testing
   */
  static createTestConfig(): MemoryConfig {
    return {
      neo4j: {
        uri: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'test'
      },
      semantic: {
        embeddingDimension: 128, // Smaller for testing
        defaultThreshold: 0.5,
        maxEntries: 1000
      },
      management: {
        stmExpirationMinutes: 5,
        cleanupIntervalMinutes: 1,
        maxConcurrentTransactions: 10
      }
    };
  }

  /**
   * Create configuration for production
   */
  static createProductionConfig(): MemoryConfig {
    return {
      neo4j: {
        uri: process.env.NEO4J_URI || 'bolt://neo4j:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || ''
      },
      semantic: {
        embeddingDimension: 1536,
        defaultThreshold: 0.75,
        maxEntries: 100000
      },
      management: {
        stmExpirationMinutes: 60,
        cleanupIntervalMinutes: 30,
        maxConcurrentTransactions: 500
      }
    };
  }

  /**
   * Setup periodic cleanup of expired contexts and transactions
   */
  private setupCleanup(intervalMinutes: number): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      if (this.memoryAssistant) {
        (this.memoryAssistant as MemoryAssistantImpl).cleanupExpiredContexts();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Verify all connections are working
   */
  private async verifyConnections(): Promise<void> {
    if (!this.graphRAG || !this.semanticRAG || !this.memoryAssistant) {
      throw new Error('Components not initialized');
    }

    // Test Graph RAG connection
    try {
      const testScope = {
        id: 'test',
        user_ids: [],
        project_ids: [],
        contact_ids: [],
        permissions: { read: true, write: false, delete: false }
      };

      await this.graphRAG.query({
        type: 'cypher',
        query: 'RETURN 1 as test',
        limit: 1
      }, testScope);
    } catch (error) {
      throw new Error(`Graph RAG connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Semantic RAG (no external dependencies to verify)
    const entryCount = this.semanticRAG.getEntryCount();
    if (typeof entryCount !== 'number') {
      throw new Error('Semantic RAG initialization failed');
    }
  }

  /**
   * Cleanup and shutdown the memory system
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.graphRAG) {
      await this.graphRAG.close();
      this.graphRAG = null;
    }

    if (this.semanticRAG) {
      this.semanticRAG.clear();
      this.semanticRAG = null;
    }

    this.memoryAssistant = null;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  static reset(): void {
    if (MemoryFactory.instance) {
      MemoryFactory.instance.cleanup();
      MemoryFactory.instance = null;
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): MemoryHealthStatus {
    if (!this.memoryAssistant) {
      return {
        status: 'not_initialized',
        components: {
          graphRAG: 'not_initialized',
          semanticRAG: 'not_initialized',
          memoryAssistant: 'not_initialized'
        },
        metrics: {
          activeTransactions: 0,
          stmContexts: 0,
          semanticEntries: 0
        }
      };
    }

    const memoryAssistantImpl = this.memoryAssistant as MemoryAssistantImpl;

    return {
      status: 'healthy',
      components: {
        graphRAG: 'healthy',
        semanticRAG: 'healthy',
        memoryAssistant: 'healthy'
      },
      metrics: {
        activeTransactions: memoryAssistantImpl.getActiveTransactionCount(),
        stmContexts: memoryAssistantImpl.getSTMContextCount(),
        semanticEntries: this.semanticRAG?.getEntryCount() || 0
      }
    };
  }
}

/**
 * Memory system health status
 */
export interface MemoryHealthStatus {
  /** Overall system status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'not_initialized';
  
  /** Component-level status */
  components: {
    graphRAG: 'healthy' | 'degraded' | 'unhealthy' | 'not_initialized';
    semanticRAG: 'healthy' | 'degraded' | 'unhealthy' | 'not_initialized';
    memoryAssistant: 'healthy' | 'degraded' | 'unhealthy' | 'not_initialized';
  };
  
  /** System metrics */
  metrics: {
    activeTransactions: number;
    stmContexts: number;
    semanticEntries: number;
  };
}

/**
 * Convenience function to initialize memory system with default config
 */
export async function initializeMemorySystem(config?: Partial<MemoryConfig>): Promise<MemoryAssistant> {
  const factory = MemoryFactory.getInstance();
  const fullConfig = {
    ...MemoryFactory.createDefaultConfig(),
    ...config
  };
  
  return await factory.initialize(fullConfig);
}

/**
 * Convenience function to get initialized memory assistant
 */
export function getMemoryAssistant(): MemoryAssistant {
  return MemoryFactory.getInstance().getMemoryAssistant();
}