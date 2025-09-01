// Core cognitive agent exports
export { CognitiveAgentImpl } from './cognitive-agent';
export { AgentFactoryImpl, agentFactory } from './agent-factory';

// Re-export types for convenience
export type {
  CognitiveAgent,
  AgentFactory,
  AgentStatus,
  ConfigurationProfile,
  ContextThread,
  UserInput,
  AgentResponse,
  UserState,
  AgentState,
  RelationalDelta,
  AgentRole,
  CognitivePhase
} from '@/types';