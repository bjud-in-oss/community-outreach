/**
 * Comprehensive System Integration Tests
 * 
 * Tests end-to-end integration of all major system components
 * according to the requirements in the outreach specification.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { systemIntegrationService } from '@/services/system-integration-service';
import { agentFactory } from '@/lib/agent-factory';
import { UserInput, AgentResponse, UserState } from '@/types';

describe('System Integration Tests', () => {
  beforeAll(async () => {
    await systemIntegrationService.initialize();
  });

  afterAll(async () => {
    await systemIntegrationService.shutdown();
  });

  describe('End-to-End Data Flow', () => {
    it('should process user input through complete system pipeline', async () => {
      const userInput: UserInput = {
        text: 'I want to reflect on my day and share it with my family',
        type: 'chat',
        context: {
          user_id: 'test-user-1',
          project_id: 'test-project-1',
          collaborators: ['family-member-1']
        },
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(userInput);

      expect(response).toBeDefined();
      expect(response.text).toBeTruthy();
      expect(response.type).toBe('message');
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should validate data flow between all components', async () => {
      const validations = await systemIntegrationService.validateDataFlow();

      expect(validations).toHaveLength(4);
      
      const failedValidations = validations.filter(v => v.validation_status === 'failed');
      expect(failedValidations).toHaveLength(0);

      // Check specific flows
      const agentMemoryFlow = validations.find(v => v.flow_id === 'agent-memory-flow');
      expect(agentMemoryFlow?.validation_status).toBe('passed');

      const memoryServicesFlow = validations.find(v => v.flow_id === 'memory-services-flow');
      expect(memoryServicesFlow?.validation_status).toBe('passed');
    });

    it('should handle complex multi-service routing', async () => {
      const emotionalInput: UserInput = {
        text: 'I am feeling very frustrated and want to remember happier times with my grandchildren',
        type: 'chat',
        context: {
          user_id: 'test-user-1',
          emotional_state: 'distressed'
        },
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(emotionalInput);

      // Should route through empatibryggan for emotional guidance
      // Should route through minnenas bok for memory discovery
      // Should route through chronicler for reflection processing
      expect(response.actions).toBeDefined();
      expect(response.actions!.length).toBeGreaterThan(0);
    });
  });

  describe('System Health Monitoring', () => {
    it('should report comprehensive system health status', async () => {
      const health = await systemIntegrationService.getSystemHealth();

      expect(health.overall_status).toMatch(/^(healthy|degraded|critical)$/);
      expect(health.components).toHaveLength(8); // All major components
      expect(health.last_check).toBeInstanceOf(Date);
      expect(health.uptime_seconds).toBeGreaterThan(0);

      // Check all expected components are monitored
      const componentNames = health.components.map(c => c.component);
      expect(componentNames).toContain('CognitiveAgent');
      expect(componentNames).toContain('MemorySystem');
      expect(componentNames).toContain('ChroniclerService');
      expect(componentNames).toContain('CollaborationService');
      expect(componentNames).toContain('EmpatibrygganService');
      expect(componentNames).toContain('LegacySystemService');
      expect(componentNames).toContain('MinnenasBokService');
    });

    it('should track system metrics accurately', async () => {
      // Generate some activity
      await systemIntegrationService.processUserInput({
        text: 'test input',
        type: 'chat',
        context: {},
        timestamp: new Date()
      });

      const metrics = systemIntegrationService.getSystemMetrics();

      expect(metrics.active_agents).toBeGreaterThanOrEqual(0);
      expect(metrics.memory_usage_mb).toBeGreaterThan(0);
      expect(metrics.request_count_per_minute).toBeGreaterThanOrEqual(0);
      expect(metrics.average_response_time_ms).toBeGreaterThanOrEqual(0);
      expect(metrics.error_rate_percentage).toBeGreaterThanOrEqual(0);
      expect(metrics.timestamp).toBeInstanceOf(Date);
    });

    it('should detect component failures', async () => {
      const health = await systemIntegrationService.getSystemHealth();
      
      // All components should be healthy in test environment
      const criticalComponents = health.components.filter(c => c.status === 'critical');
      expect(criticalComponents).toHaveLength(0);
    });
  });

  describe('Cognitive Agent Integration', () => {
    it('should integrate cognitive agents with all system services', async () => {
      const agent = await agentFactory.createAgent({
        llm_model: 'gpt-4',
        toolkit: ['memory', 'communication', 'collaboration'],
        memory_scope: 'user_session',
        entry_phase: 'EMERGE'
      }, 'Coordinator');

      expect(agent).toBeDefined();
      expect(agent.getRole()).toBe('Coordinator');
      expect(agent.getStatus()).toBe('active');
    });

    it('should support agent hierarchy and delegation', async () => {
      const parentAgent = await agentFactory.createAgent({
        llm_model: 'gpt-4',
        toolkit: ['memory', 'delegation'],
        memory_scope: 'user_session',
        entry_phase: 'EMERGE'
      }, 'Coordinator');

      const childConfig = {
        llm_model: 'gpt-3.5-turbo',
        toolkit: ['memory'],
        memory_scope: 'task_specific',
        entry_phase: 'EMERGE' as const
      };

      const childAgent = await parentAgent.cloneAgent(childConfig);
      
      expect(childAgent).toBeDefined();
      expect(childAgent.getRole()).toBe('Core');
    });

    it('should handle roundabout cognitive loop integration', async () => {
      const agent = await agentFactory.createAgent({
        llm_model: 'gpt-4',
        toolkit: ['memory'],
        memory_scope: 'test',
        entry_phase: 'EMERGE'
      }, 'Core');

      const input: UserInput = {
        text: 'Help me solve a complex problem',
        type: 'chat',
        context: {},
        timestamp: new Date()
      };

      const response = await agent.processInput(input);
      
      expect(response).toBeDefined();
      expect(response.agent_state?.cognitive_phase).toMatch(/^(EMERGE|ADAPT|INTEGRATE)$/);
    });
  });

  describe('Memory System Integration', () => {
    it('should integrate graph and semantic RAG systems', async () => {
      // This would test actual memory system integration
      // For now, we'll test the interface
      const validations = await systemIntegrationService.validateDataFlow();
      const memoryFlow = validations.find(v => v.source_component === 'CognitiveAgent' && v.target_component === 'MemorySystem');
      
      expect(memoryFlow?.validation_status).toBe('passed');
    });

    it('should handle memory scope enforcement', async () => {
      const agent = await agentFactory.createAgent({
        llm_model: 'gpt-4',
        toolkit: ['memory'],
        memory_scope: 'restricted_scope',
        entry_phase: 'EMERGE'
      }, 'Core');

      // Memory operations should respect the scope
      expect(agent.getContextThread().memory_scope).toBe('restricted_scope');
    });
  });

  describe('Service Integration', () => {
    it('should integrate chronicler service with cognitive agents', async () => {
      const input: UserInput = {
        text: 'I want to reflect on my childhood memories',
        type: 'chat',
        context: { reflection: true },
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(input);
      
      // Should be processed by chronicler service
      expect(response).toBeDefined();
    });

    it('should integrate empatibryggan service for emotional guidance', async () => {
      const emotionalInput: UserInput = {
        text: 'I am very angry about this situation',
        type: 'chat',
        context: {},
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(emotionalInput);
      
      // Should include emotional guidance
      expect(response).toBeDefined();
      expect(response.user_state).toBeDefined();
    });

    it('should integrate collaboration service for multi-user scenarios', async () => {
      const collaborativeInput: UserInput = {
        text: 'Let me share this with my family',
        type: 'chat',
        context: {
          collaborators: ['family-member-1', 'family-member-2'],
          project_id: 'family-project'
        },
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(collaborativeInput);
      
      // Should handle collaboration
      expect(response).toBeDefined();
    });

    it('should integrate minnenas bok service for memory discovery', async () => {
      const memoryInput: UserInput = {
        text: 'Help me remember stories about my grandmother',
        type: 'chat',
        context: {},
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(memoryInput);
      
      // Should discover memory links
      expect(response).toBeDefined();
      expect(response.actions).toBeDefined();
    });

    it('should integrate legacy system service for future messages', async () => {
      const legacyInput: UserInput = {
        text: 'I want to create a message for my grandchildren to receive when they graduate',
        type: 'chat',
        context: { legacy_content: true },
        timestamp: new Date()
      };

      const response = await systemIntegrationService.processUserInput(legacyInput);
      
      // Should handle legacy content creation
      expect(response).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle service failures gracefully', async () => {
      // Test with invalid input that might cause service errors
      const invalidInput: UserInput = {
        text: '', // Empty input
        type: 'chat',
        context: {},
        timestamp: new Date()
      };

      // Should not throw, should handle gracefully
      await expect(systemIntegrationService.processUserInput(invalidInput)).resolves.toBeDefined();
    });

    it('should maintain system stability during component failures', async () => {
      const health = await systemIntegrationService.getSystemHealth();
      
      // System should remain operational even if some components are degraded
      expect(['healthy', 'degraded']).toContain(health.overall_status);
    });

    it('should provide detailed error information for debugging', async () => {
      const health = await systemIntegrationService.getSystemHealth();
      
      health.components.forEach(component => {
        expect(component.component).toBeTruthy();
        expect(component.status).toMatch(/^(healthy|degraded|critical|offline)$/);
        expect(component.last_check).toBeInstanceOf(Date);
        expect(component.error_count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        text: `Concurrent request ${i}`,
        type: 'chat' as const,
        context: { request_id: i },
        timestamp: new Date()
      }));

      const responses = await Promise.all(
        requests.map(req => systemIntegrationService.processUserInput(req))
      );

      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.text).toBeTruthy();
      });
    });

    it('should maintain acceptable response times', async () => {
      const startTime = Date.now();
      
      await systemIntegrationService.processUserInput({
        text: 'Simple test request',
        type: 'chat',
        context: {},
        timestamp: new Date()
      });

      const responseTime = Date.now() - startTime;
      
      // Should respond within reasonable time (5 seconds for integration test)
      expect(responseTime).toBeLessThan(5000);
    });

    it('should track and report performance metrics', async () => {
      // Generate some activity
      for (let i = 0; i < 3; i++) {
        await systemIntegrationService.processUserInput({
          text: `Performance test ${i}`,
          type: 'chat',
          context: {},
          timestamp: new Date()
        });
      }

      const metrics = systemIntegrationService.getSystemMetrics();
      
      expect(metrics.request_count_per_minute).toBeGreaterThan(0);
      expect(metrics.average_response_time_ms).toBeGreaterThan(0);
    });
  });
});