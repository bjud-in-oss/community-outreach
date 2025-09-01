import { 
  AgentFactory,
  CognitiveAgent,
  AgentRole,
  ConfigurationProfile,
  ContextThread
} from '@/types';
import { CognitiveAgentImpl } from './cognitive-agent';

/**
 * Factory for creating and managing CognitiveAgent instances
 */
export class AgentFactoryImpl implements AgentFactory {
  private _agents: Map<string, CognitiveAgent> = new Map();

  /**
   * Create a new cognitive agent with simplified interface
   */
  async createAgent(
    config: ConfigurationProfile,
    role: AgentRole
  ): Promise<CognitiveAgent> {
    // Create a basic context thread
    const contextThread: ContextThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      top_level_goal: 'Process user input',
      task_definition: 'Handle user request',
      configuration_profile: config,
      memory_scope: config.memory_scope,
      resource_budget: config.resource_budget || {
        max_llm_calls: 10,
        max_compute_units: 100,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 30000
      },
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    };

    const agent = new CognitiveAgentImpl(role, config, contextThread);
    this._agents.set(agent.id, agent);
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): CognitiveAgent | null {
    return this._agents.get(id) || null;
  }

  /**
   * List all active agents
   */
  listActiveAgents(): CognitiveAgent[] {
    return Array.from(this._agents.values()).filter(agent => 
      agent.getStatus().active
    );
  }

  /**
   * Get count of active agents
   */
  getActiveAgentCount(): number {
    return this.listActiveAgents().length;
  }

  /**
   * Terminate all agents
   */
  async terminateAll(): Promise<void> {
    const terminationPromises = Array.from(this._agents.values()).map(agent => 
      agent.terminate()
    );
    
    await Promise.all(terminationPromises);
    this._agents.clear();
  }
}

// Export singleton instance
export const agentFactory = new AgentFactoryImpl();