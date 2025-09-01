// Graph RAG implementation with Neo4j backend

import neo4j, { Driver, Session, Transaction as Neo4jTransaction } from 'neo4j-driver';
import { v4 as uuidv4 } from 'uuid';
import {
  GraphQuery,
  GraphResult,
  GraphData,
  Transaction,
  TransactionResult,
  ConflictError,
  StructuredQuery
} from '../../types/memory';
import { MemoryScope } from '../../types';

/**
 * Graph RAG implementation using Neo4j
 * Provides structured data storage with ACID compliance
 */
export class GraphRAG {
  private driver: Driver;
  private activeTransactions: Map<string, Neo4jTransaction> = new Map();

  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  /**
   * Query the graph database
   */
  async query(query: GraphQuery, scope: MemoryScope): Promise<GraphResult[]> {
    const session = this.driver.session();
    
    try {
      let cypherQuery: string;
      let parameters: Record<string, any> = query.parameters || {};

      if (query.type === 'cypher') {
        cypherQuery = query.query as string;
      } else {
        cypherQuery = this.buildCypherFromStructured(query.query as StructuredQuery);
      }

      // Add scope filtering to the query
      cypherQuery = this.addScopeFiltering(cypherQuery, scope);

      const result = await session.run(cypherQuery, parameters);
      
      return this.convertNeo4jResults(result.records);
    } catch (error) {
      throw new Error(`Graph query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await session.close();
    }
  }

  /**
   * Store data in the graph database
   */
  async store(data: GraphData, transaction: Transaction): Promise<TransactionResult> {
    const neo4jTx = this.activeTransactions.get(transaction.id);
    if (!neo4jTx) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    try {
      const entityIds: string[] = [];

      // Process nodes
      for (const node of data.nodes) {
        const nodeId = await this.storeNode(node, neo4jTx, data.operation);
        entityIds.push(nodeId);
      }

      // Process relationships
      for (const relationship of data.relationships) {
        const relId = await this.storeRelationship(relationship, neo4jTx, data.operation);
        entityIds.push(relId);
      }

      return {
        transactionId: transaction.id,
        success: true,
        entityIds
      };
    } catch (error) {
      return {
        transactionId: transaction.id,
        success: false,
        entityIds: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Begin a new transaction
   */
  async beginTransaction(transaction: Transaction): Promise<void> {
    const session = this.driver.session();
    const neo4jTx = session.beginTransaction();
    
    this.activeTransactions.set(transaction.id, neo4jTx);
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(transaction: Transaction): Promise<void> {
    const neo4jTx = this.activeTransactions.get(transaction.id);
    if (!neo4jTx) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    try {
      await neo4jTx.commit();
    } finally {
      this.activeTransactions.delete(transaction.id);
      await neo4jTx.close();
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(transaction: Transaction): Promise<void> {
    const neo4jTx = this.activeTransactions.get(transaction.id);
    if (!neo4jTx) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    try {
      await neo4jTx.rollback();
    } finally {
      this.activeTransactions.delete(transaction.id);
      await neo4jTx.close();
    }
  }

  /**
   * Update an entity during STM consolidation
   */
  async updateEntity(graphResult: GraphResult, transaction: Transaction): Promise<void> {
    const neo4jTx = this.activeTransactions.get(transaction.id);
    if (!neo4jTx) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    try {
      if (graphResult.type === 'node') {
        await this.updateNode(graphResult, neo4jTx);
      } else if (graphResult.type === 'relationship') {
        await this.updateRelationship(graphResult, neo4jTx);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('version')) {
        throw new ConflictError(
          'Optimistic concurrency control conflict',
          graphResult.metadata.id,
          graphResult.metadata.properties._version || 0,
          graphResult.metadata.properties._version + 1 || 1
        );
      }
      throw error;
    }
  }

  /**
   * Build Cypher query from structured query
   */
  private buildCypherFromStructured(structured: StructuredQuery): string {
    let cypher = 'MATCH ';
    
    // Build node patterns
    const nodePatterns = structured.nodeTypes.map((type, index) => 
      `(n${index}:${type})`
    ).join(', ');
    
    cypher += nodePatterns;

    // Build relationship patterns if specified
    if (structured.relationshipTypes.length > 0) {
      const relPatterns = structured.relationshipTypes.map((type, index) => 
        `-[r${index}:${type}]-`
      ).join('');
      cypher += relPatterns;
    }

    // Add WHERE clause for filters
    if (structured.filters.length > 0) {
      cypher += ' WHERE ';
      const filterClauses = structured.filters.map(filter => 
        this.buildFilterClause(filter)
      ).join(' AND ');
      cypher += filterClauses;
    }

    // Add RETURN clause
    cypher += ' RETURN ';
    if (structured.returnFields.length > 0) {
      cypher += structured.returnFields.join(', ');
    } else {
      cypher += '*';
    }

    return cypher;
  }

  /**
   * Build filter clause for structured query
   */
  private buildFilterClause(filter: any): string {
    const property = `n0.${filter.property}`;
    
    switch (filter.operator) {
      case 'equals':
        return `${property} = $${filter.property}`;
      case 'contains':
        return `${property} CONTAINS $${filter.property}`;
      case 'startsWith':
        return `${property} STARTS WITH $${filter.property}`;
      case 'endsWith':
        return `${property} ENDS WITH $${filter.property}`;
      case 'greaterThan':
        return `${property} > $${filter.property}`;
      case 'lessThan':
        return `${property} < $${filter.property}`;
      default:
        return `${property} = $${filter.property}`;
    }
  }

  /**
   * Add scope filtering to Cypher query
   */
  private addScopeFiltering(cypher: string, scope: MemoryScope): string {
    // Add WHERE clause for scope filtering
    const scopeFilters: string[] = [];

    if (scope.user_ids.length > 0) {
      scopeFilters.push(`n0.userId IN $scope_user_ids`);
    }

    if (scope.project_ids.length > 0) {
      scopeFilters.push(`n0.projectId IN $scope_project_ids`);
    }

    if (scope.contact_ids.length > 0) {
      scopeFilters.push(`n0.contactId IN $scope_contact_ids`);
    }

    if (scopeFilters.length > 0) {
      const whereClause = scopeFilters.join(' OR ');
      if (cypher.includes('WHERE')) {
        cypher += ` AND (${whereClause})`;
      } else {
        cypher += ` WHERE (${whereClause})`;
      }
    }

    return cypher;
  }

  /**
   * Convert Neo4j results to GraphResult format
   */
  private convertNeo4jResults(records: any[]): GraphResult[] {
    return records.map(record => {
      const keys = record.keys;
      const values = record._fields;
      
      // Determine result type and extract data
      let type: 'node' | 'relationship' | 'path' = 'node';
      let data: any = {};
      let metadata: any = {};

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];

        if (value && typeof value === 'object') {
          if (value.labels) {
            // This is a node
            type = 'node';
            metadata = {
              id: value.identity.toString(),
              labels: value.labels,
              properties: value.properties
            };
            data = value.properties;
          } else if (value.type) {
            // This is a relationship
            type = 'relationship';
            metadata = {
              id: value.identity.toString(),
              type: value.type,
              properties: value.properties
            };
            data = value.properties;
          }
        }
      }

      return {
        type,
        data,
        metadata
      };
    });
  }

  /**
   * Store a node in the database
   */
  private async storeNode(node: any, transaction: Neo4jTransaction, operation: string): Promise<string> {
    const nodeId = node.id || uuidv4();
    const labels = node.labels.join(':');
    
    let cypher: string;
    const parameters = {
      nodeId,
      properties: {
        ...node.properties,
        _id: nodeId,
        _version: 1,
        _created: new Date().toISOString(),
        _updated: new Date().toISOString()
      }
    };

    switch (operation) {
      case 'create':
        cypher = `CREATE (n:${labels} $properties) RETURN n._id as id`;
        break;
      case 'update':
        cypher = `MATCH (n {_id: $nodeId}) SET n += $properties, n._updated = datetime() RETURN n._id as id`;
        break;
      case 'merge':
        cypher = `MERGE (n:${labels} {_id: $nodeId}) SET n += $properties, n._updated = datetime() RETURN n._id as id`;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    const result = await transaction.run(cypher, parameters);
    return result.records[0]?.get('id') || nodeId;
  }

  /**
   * Store a relationship in the database
   */
  private async storeRelationship(relationship: any, transaction: Neo4jTransaction, operation: string): Promise<string> {
    const relId = relationship.id || uuidv4();
    
    const cypher = `
      MATCH (from {_id: $fromNodeId}), (to {_id: $toNodeId})
      CREATE (from)-[r:${relationship.type} $properties]->(to)
      RETURN r._id as id
    `;

    const parameters = {
      fromNodeId: relationship.fromNodeId,
      toNodeId: relationship.toNodeId,
      properties: {
        ...relationship.properties,
        _id: relId,
        _version: 1,
        _created: new Date().toISOString(),
        _updated: new Date().toISOString()
      }
    };

    const result = await transaction.run(cypher, parameters);
    return result.records[0]?.get('id') || relId;
  }

  /**
   * Update a node with optimistic concurrency control
   */
  private async updateNode(graphResult: GraphResult, transaction: Neo4jTransaction): Promise<void> {
    const currentVersion = graphResult.metadata.properties._version || 0;
    const newVersion = currentVersion + 1;

    const cypher = `
      MATCH (n {_id: $nodeId})
      WHERE n._version = $currentVersion
      SET n += $properties, n._version = $newVersion, n._updated = datetime()
      RETURN n._version as version
    `;

    const parameters = {
      nodeId: graphResult.metadata.id,
      currentVersion,
      newVersion,
      properties: graphResult.data
    };

    const result = await transaction.run(cypher, parameters);
    
    if (result.records.length === 0) {
      throw new Error(`Optimistic concurrency control conflict for node ${graphResult.metadata.id}`);
    }
  }

  /**
   * Update a relationship with optimistic concurrency control
   */
  private async updateRelationship(graphResult: GraphResult, transaction: Neo4jTransaction): Promise<void> {
    const currentVersion = graphResult.metadata.properties._version || 0;
    const newVersion = currentVersion + 1;

    const cypher = `
      MATCH ()-[r {_id: $relId}]-()
      WHERE r._version = $currentVersion
      SET r += $properties, r._version = $newVersion, r._updated = datetime()
      RETURN r._version as version
    `;

    const parameters = {
      relId: graphResult.metadata.id,
      currentVersion,
      newVersion,
      properties: graphResult.data
    };

    const result = await transaction.run(cypher, parameters);
    
    if (result.records.length === 0) {
      throw new Error(`Optimistic concurrency control conflict for relationship ${graphResult.metadata.id}`);
    }
  }

  /**
   * Close the driver connection
   */
  async close(): Promise<void> {
    await this.driver.close();
  }
}