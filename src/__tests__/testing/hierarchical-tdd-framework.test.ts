/**
 * Tests for the Hierarchical TDD Framework
 * 
 * These tests validate the testing framework itself, ensuring it correctly
 * implements the hierarchical TDD methodology.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  HierarchicalTDDFramework, 
  TDDMission, 
  TestSuite, 
  TestDefinition 
} from '../../lib/testing/hierarchical-tdd-framework';

describe('HierarchicalTDDFramework', () => {
  let framework: HierarchicalTDDFramework;

  beforeEach(() => {
    framework = new HierarchicalTDDFramework();
  });

  describe('Mission Creation', () => {
    it('should create a new TDD mission with E2E test', async () => {
      const mission = await framework.createMission(
        'User Authentication',
        'Implement secure user login system',
        ['REQ-1.1', 'REQ-1.2'],
        'coordinator-agent-1'
      );

      expect(mission).toBeDefined();
      expect(mission.title).toBe('User Authentication');
      expect(mission.description).toBe('Implement secure user login system');
      expect(mission.requirements).toEqual(['REQ-1.1', 'REQ-1.2']);
      expect(mission.coordinatorAgent).toBe('coordinator-agent-1');
      expect(mission.status).toBe('planning');
      expect(mission.e2eTest).toBeDefined();
      expect(mission.e2eTest.type).toBe('e2e');
      expect(mission.e2eTest.agentRole).toBe('Coordinator');
    });

    it('should generate unique mission IDs', async () => {
      const mission1 = await framework.createMission(
        'Feature A', 'Description A', ['REQ-A'], 'agent-1'
      );
      const mission2 = await framework.createMission(
        'Feature B', 'Description B', ['REQ-B'], 'agent-2'
      );

      expect(mission1.id).not.toBe(mission2.id);
    });
  });

  describe('Sub-task Suite Management', () => {
    it('should add sub-task suite to existing mission', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Test Description', ['REQ-1'], 'coordinator-1'
      );

      const suite = await framework.addSubTaskSuite(
        mission.id,
        'Authentication Suite',
        'Tests for authentication components',
        'core-agent-1',
        ['REQ-1.1']
      );

      expect(suite).toBeDefined();
      expect(suite.name).toBe('Authentication Suite');
      expect(suite.description).toBe('Tests for authentication components');
      expect(suite.status).toBe('pending');

      const updatedMission = framework.getMissionStatus(mission.id);
      expect(updatedMission?.subTasks).toHaveLength(1);
      expect(updatedMission?.subTasks[0]).toBe(suite);
    });

    it('should throw error for non-existent mission', async () => {
      await expect(
        framework.addSubTaskSuite(
          'non-existent-mission',
          'Test Suite',
          'Description',
          'agent-1',
          ['REQ-1']
        )
      ).rejects.toThrow('Mission non-existent-mission not found');
    });
  });

  describe('Test Management', () => {
    it('should add test to existing suite', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Description', ['REQ-1'], 'coordinator-1'
      );
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1']
      );

      const test = await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Test Login Function',
        description: 'Unit test for login validation',
        agentRole: 'Core',
        requirements: ['REQ-1.1'],
        testCode: 'test code here',
        status: 'pending',
        createdBy: 'core-agent-1'
      });

      expect(test).toBeDefined();
      expect(test.title).toBe('Test Login Function');
      expect(test.type).toBe('unit');
      expect(test.agentRole).toBe('Core');
      expect(suite.tests).toHaveLength(1);
      expect(suite.tests[0]).toBe(test);
    });

    it('should throw error for non-existent suite', async () => {
      await expect(
        framework.addTestToSuite('non-existent-suite', {
          type: 'unit',
          title: 'Test',
          description: 'Description',
          agentRole: 'Core',
          requirements: ['REQ-1'],
          testCode: 'code',
          status: 'pending',
          createdBy: 'agent-1'
        })
      ).rejects.toThrow('Test suite non-existent-suite not found');
    });
  });

  describe('Test Execution', () => {
    it('should execute single test successfully', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Description', ['REQ-1'], 'coordinator-1'
      );

      // Mock the runTestCode method to return success
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: true,
          coverage: 85,
          logs: ['Test executed successfully']
        });

      const result = await framework.executeTest(mission.e2eTest);

      expect(result.success).toBe(true);
      expect(result.coverage).toBe(85);
      expect(result.logs).toEqual(['Test executed successfully']);
      expect(mission.e2eTest.status).toBe('passed');
      expect(mission.e2eTest.executionResults).toBe(result);

      mockRunTestCode.mockRestore();
    });

    it('should handle test execution failure', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Description', ['REQ-1'], 'coordinator-1'
      );

      // Mock the runTestCode method to return failure
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: false,
          error: 'Test assertion failed'
        });

      const result = await framework.executeTest(mission.e2eTest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test assertion failed');
      expect(mission.e2eTest.status).toBe('failed');

      mockRunTestCode.mockRestore();
    });

    it('should execute test suite in correct order', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Description', ['REQ-1'], 'coordinator-1'
      );
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1']
      );

      // Add multiple tests to suite
      await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Unit Test 1',
        description: 'First unit test',
        agentRole: 'Core',
        requirements: ['REQ-1.1'],
        testCode: 'unit test 1',
        status: 'pending',
        createdBy: 'core-1'
      });

      await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Unit Test 2',
        description: 'Second unit test',
        agentRole: 'Core',
        requirements: ['REQ-1.2'],
        testCode: 'unit test 2',
        status: 'pending',
        createdBy: 'core-1'
      });

      // Mock successful test execution
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: true,
          coverage: 90
        });

      const result = await framework.executeTestSuite(suite.id);

      expect(result).toBe(true);
      expect(suite.status).toBe('passed');
      expect(suite.tests.every(test => test.status === 'passed')).toBe(true);

      mockRunTestCode.mockRestore();
    });

    it('should fail suite if any test fails', async () => {
      const mission = await framework.createMission(
        'Test Mission', 'Description', ['REQ-1'], 'coordinator-1'
      );
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1']
      );

      await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Failing Test',
        description: 'This test will fail',
        agentRole: 'Core',
        requirements: ['REQ-1.1'],
        testCode: 'failing test',
        status: 'pending',
        createdBy: 'core-1'
      });

      // Mock failing test execution
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: false,
          error: 'Test failed'
        });

      const result = await framework.executeTestSuite(suite.id);

      expect(result).toBe(false);
      expect(suite.status).toBe('failed');

      mockRunTestCode.mockRestore();
    });
  });

  describe('Mission Execution', () => {
    it('should execute complete mission successfully', async () => {
      const mission = await framework.createMission(
        'Complete Mission', 'Full mission test', ['REQ-1'], 'coordinator-1'
      );
      
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Sub Task', 'Description', 'core-1', ['REQ-1.1']
      );

      await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Unit Test',
        description: 'Unit test',
        agentRole: 'Core',
        requirements: ['REQ-1.1'],
        testCode: 'unit test',
        status: 'pending',
        createdBy: 'core-1'
      });

      // Mock successful test execution
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: true,
          coverage: 95
        });

      const result = await framework.executeMission(mission.id);

      expect(result).toBe(true);
      expect(mission.status).toBe('completed');
      expect(suite.status).toBe('passed');
      expect(mission.e2eTest.status).toBe('passed');

      mockRunTestCode.mockRestore();
    });

    it('should fail mission if sub-task fails', async () => {
      const mission = await framework.createMission(
        'Failing Mission', 'Mission with failing sub-task', ['REQ-1'], 'coordinator-1'
      );
      
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Failing Sub Task', 'Description', 'core-1', ['REQ-1.1']
      );

      await framework.addTestToSuite(suite.id, {
        type: 'unit',
        title: 'Failing Unit Test',
        description: 'This will fail',
        agentRole: 'Core',
        requirements: ['REQ-1.1'],
        testCode: 'failing test',
        status: 'pending',
        createdBy: 'core-1'
      });

      // Mock failing test execution
      const mockRunTestCode = vi.spyOn(framework as any, 'runTestCode')
        .mockResolvedValue({
          success: false,
          error: 'Sub-task test failed'
        });

      const result = await framework.executeMission(mission.id);

      expect(result).toBe(false);
      expect(mission.status).toBe('failed');

      mockRunTestCode.mockRestore();
    });
  });

  describe('Mission Validation', () => {
    it('should validate mission completion correctly', async () => {
      const mission = await framework.createMission(
        'Validation Test', 'Test validation', ['REQ-1'], 'coordinator-1'
      );
      
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1.1']
      );

      // Set all tests to passed
      suite.status = 'passed';
      mission.e2eTest.status = 'passed';

      const isComplete = await framework.validateMissionCompletion(mission.id);
      expect(isComplete).toBe(true);
    });

    it('should fail validation if E2E test not passed', async () => {
      const mission = await framework.createMission(
        'Validation Test', 'Test validation', ['REQ-1'], 'coordinator-1'
      );
      
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1.1']
      );

      // Sub-tasks pass but E2E fails
      suite.status = 'passed';
      mission.e2eTest.status = 'failed';

      const isComplete = await framework.validateMissionCompletion(mission.id);
      expect(isComplete).toBe(false);
    });

    it('should fail validation if sub-tasks not passed', async () => {
      const mission = await framework.createMission(
        'Validation Test', 'Test validation', ['REQ-1'], 'coordinator-1'
      );
      
      const suite = await framework.addSubTaskSuite(
        mission.id, 'Test Suite', 'Description', 'core-1', ['REQ-1.1']
      );

      // E2E passes but sub-task fails
      suite.status = 'failed';
      mission.e2eTest.status = 'passed';

      const isComplete = await framework.validateMissionCompletion(mission.id);
      expect(isComplete).toBe(false);
    });
  });

  describe('Framework State Management', () => {
    it('should track all missions', async () => {
      const mission1 = await framework.createMission(
        'Mission 1', 'Description 1', ['REQ-1'], 'coordinator-1'
      );
      const mission2 = await framework.createMission(
        'Mission 2', 'Description 2', ['REQ-2'], 'coordinator-2'
      );

      const allMissions = framework.getAllMissions();
      expect(allMissions).toHaveLength(2);
      expect(allMissions).toContain(mission1);
      expect(allMissions).toContain(mission2);
    });

    it('should retrieve mission status', async () => {
      const mission = await framework.createMission(
        'Status Test', 'Test status retrieval', ['REQ-1'], 'coordinator-1'
      );

      const status = framework.getMissionStatus(mission.id);
      expect(status).toBe(mission);
      expect(status?.title).toBe('Status Test');
    });

    it('should return undefined for non-existent mission status', () => {
      const status = framework.getMissionStatus('non-existent');
      expect(status).toBeUndefined();
    });
  });
});