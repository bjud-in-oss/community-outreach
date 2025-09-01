import { describe, it, expect } from 'vitest'
import type { 
  ConfigurationProfile, 
  ContextThread, 
  UserState, 
  AgentState,
  CognitiveAgent 
} from '@/types'

describe('Core Types', () => {
  it('should define ConfigurationProfile interface correctly', () => {
    const config: ConfigurationProfile = {
      llm_model: 'gpt-4',
      toolkit: ['memory', 'search'],
      memory_scope: 'user-123',
      entry_phase: 'EMERGE',
      max_recursion_depth: 5,
      resource_budget: {
        max_llm_calls: 100,
        max_compute_units: 1000,
        max_storage_bytes: 1024 * 1024,
        max_execution_time: 30000
      }
    }
    
    expect(config.llm_model).toBe('gpt-4')
    expect(config.entry_phase).toBe('EMERGE')
    expect(config.toolkit).toContain('memory')
  })

  it('should define ContextThread interface correctly', () => {
    const contextThread: ContextThread = {
      id: 'thread-123',
      top_level_goal: 'Help user with memory management',
      task_definition: 'Process user input and provide assistance',
      configuration_profile: {
        llm_model: 'gpt-4',
        toolkit: ['memory'],
        memory_scope: 'user-123',
        entry_phase: 'EMERGE'
      },
      memory_scope: 'user-123',
      resource_budget: {
        max_llm_calls: 50,
        max_compute_units: 500,
        max_storage_bytes: 512 * 1024,
        max_execution_time: 15000
      },
      recursion_depth: 0,
      workspace_branch: 'main',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    expect(contextThread.id).toBe('thread-123')
    expect(contextThread.recursion_depth).toBe(0)
  })

  it('should define UserState interface correctly', () => {
    const userState: UserState = {
      fight: 0.2,
      flight: 0.1,
      fixes: 0.8,
      timestamp: new Date(),
      confidence: 0.9
    }
    
    expect(userState.fight).toBe(0.2)
    expect(userState.fixes).toBe(0.8)
    expect(userState.confidence).toBe(0.9)
  })

  it('should define AgentState interface correctly', () => {
    const agentState: AgentState = {
      cognitive_phase: 'EMERGE',
      resonance: 0.7,
      confidence: 0.8,
      timestamp: new Date()
    }
    
    expect(agentState.cognitive_phase).toBe('EMERGE')
    expect(agentState.resonance).toBe(0.7)
  })
})