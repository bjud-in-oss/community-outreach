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
   * Create a new cognitive agent
   */
  async createAgent(
    role: AgentRole,
    config: ConfigurationProfile,
    contextThread: ContextThread
  ): Promise<CognitiveAgent> {
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