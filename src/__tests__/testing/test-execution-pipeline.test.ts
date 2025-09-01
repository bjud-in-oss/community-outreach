/**
 * Tests for the Test Execution Pipeline
 * 
 * Validates the test execution pipeline functionality including
 * test runners, reporting, and failure handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  TestExecutionPipeline, 
  TestRunner, 
  TestReport,
  PipelineConfig 
} from '../../lib/testing/test-execution-pipeline';
import { TestDefinition } from '../../lib/testing/hierarchical-tdd-framework';

describe('TestExecutionPipeline', () => {
  let pipeline: TestExecutionPipeline;
  let mockRunner: TestRunner;

  beforeEach(() => {
    pipeline = new TestExecutionPipeline({
      maxRetries: 2,
      timeoutMs: 5000,
      parallelExecution: false,
      failFast: true,
      reportingEnabled: true
    });

    // Clear default runners
    (pipeline as any).runners.clear();

    mockRunner = {
      name: 'mock-runner',
      supports: ['unit', 'integration', 'e2e'],
      execute: vi.fn().mockResolvedValue({
        success: true,
        duration: 100,
        coverage: 85,
        logs: ['Test executed'],
        timestamp: new Date()
      })
    };

    pipeline.registerRunner(mockRunner);
  });

  describe('Runner Registration', () => {
    it('should register test runners', () => {
      const customRunner: TestRunner = {
        name: 'custom-runner',
        supports: ['unit'],
        execute: vi.fn()
      };

      pipeline.registerRunner(customRunner);
      
      // Verify runner is registered by attempting to use it
      expect(() => pipeline.registerRunner(customRunner)).not.toThrow();
    });
  });

  describe('Test Execution', () => {
    it('should execute single test successfully', async () => {
      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Sample Unit Test',
        description: 'Test description',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'test code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const report = await pipeline.executeBatch([test]);

      expect(report.totalTests).toBe(1);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(0);
      expect(report.failures).toHaveLength(0);
      expect(mockRunner.execute).toHaveBeenCalledWith(test);
    });

    it('should handle test execution failure', async () => {
      const failingRunner: TestRunner = {
        name: 'failing-runner',
        supports: ['unit'],
        execute: vi.fn().mockResolvedValue({
          success: false,
          duration: 50,
          error: 'Test assertion failed',
          logs: ['Test failed'],
          timestamp: new Date()
        })
      };

      pipeline.registerRunner(failingRunner);

      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Failing Test',
        description: 'This test will fail',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'failing test code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const report = await pipeline.executeBatch([test]);

      expect(report.totalTests).toBe(1);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
      expect(report.failures).toHaveLength(1);
      expect(report.failures[0].error).toBe('Test assertion failed');
      expect(report.failures[0].testTitle).toBe('Failing Test');
    });

    it('should execute multiple tests sequentially', async () => {
      const tests: TestDefinition[] = [
        {
          id: 'test-1',
          type: 'unit',
          title: 'Test 1',
          description: 'First test',
          agentRole: 'Core',
          requirements: ['REQ-1'],
          testCode: 'test 1 code',
          status: 'pending',
          createdBy: 'core-agent-1',
          createdAt: new Date()
        },
        {
          id: 'test-2',
          type: 'integration',
          title: 'Test 2',
          description: 'Second test',
          agentRole: 'Core',
          requirements: ['REQ-2'],
          testCode: 'test 2 code',
          status: 'pending',
          createdBy: 'core-agent-2',
          createdAt: new Date()
        }
      ];

      const report = await pipeline.executeBatch(tests);

      expect(report.totalTests).toBe(2);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(0);
      expect(mockRunner.execute).toHaveBeenCalledTimes(2);
    });

    it('should stop execution on first failure when failFast is enabled', async () => {
      const failingRunner: TestRunner = {
        name: 'mixed-runner',
        supports: ['unit'],
        execute: vi.fn()
          .mockResolvedValueOnce({
            success: false,
            duration: 50,
            error: 'First test failed',
            timestamp: new Date()
          })
          .mockResolvedValueOnce({
            success: true,
            duration: 100,
            timestamp: new Date()
          })
      };

      pipeline.registerRunner(failingRunner);

      const tests: TestDefinition[] = [
        {
          id: 'test-1',
          type: 'unit',
          title: 'Failing Test',
          description: 'This will fail',
          agentRole: 'Core',
          requirements: ['REQ-1'],
          testCode: 'failing code',
          status: 'pending',
          createdBy: 'core-agent-1',
          createdAt: new Date()
        },
        {
          id: 'test-2',
          type: 'unit',
          title: 'Passing Test',
          description: 'This would pass',
          agentRole: 'Core',
          requirements: ['REQ-2'],
          testCode: 'passing code',
          status: 'pending',
          createdBy: 'core-agent-2',
          createdAt: new Date()
        }
      ];

      const report = await pipeline.executeBatch(tests);

      expect(report.totalTests).toBe(2);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(1);
      expect(failingRunner.execute).toHaveBeenCalledTimes(1); // Should stop after first failure
    });
  });

  describe('Parallel Execution', () => {
    it('should execute tests in parallel when enabled', async () => {
      const parallelPipeline = new TestExecutionPipeline({
        parallelExecution: true,
        failFast: false
      });

      const parallelRunner: TestRunner = {
        name: 'parallel-runner',
        supports: ['unit'],
        execute: vi.fn().mockImplementation(async (test) => {
          // Simulate async execution
          await new Promise(resolve => setTimeout(resolve, 10));
          return {
            success: true,
            duration: 10,
            timestamp: new Date()
          };
        })
      };

      parallelPipeline.registerRunner(parallelRunner);

      const tests: TestDefinition[] = Array.from({ length: 3 }, (_, i) => ({
        id: `test-${i}`,
        type: 'unit',
        title: `Test ${i}`,
        description: `Test ${i} description`,
        agentRole: 'Core',
        requirements: [`REQ-${i}`],
        testCode: `test ${i} code`,
        status: 'pending',
        createdBy: `core-agent-${i}`,
        createdAt: new Date()
      }));

      const startTime = Date.now();
      const report = await parallelPipeline.executeBatch(tests);
      const endTime = Date.now();

      expect(report.totalTests).toBe(3);
      expect(report.passed).toBe(3);
      expect(parallelRunner.execute).toHaveBeenCalledTimes(3);
      
      // Parallel execution should be faster than sequential
      expect(endTime - startTime).toBeLessThan(100); // Much less than 3 * 10ms
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed tests up to maxRetries', async () => {
      const retryRunner: TestRunner = {
        name: 'retry-runner',
        supports: ['unit'],
        execute: vi.fn()
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockResolvedValueOnce({
            success: true,
            duration: 100,
            timestamp: new Date()
          })
      };

      pipeline.registerRunner(retryRunner);

      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Retry Test',
        description: 'Test with retry',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'retry test code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const report = await pipeline.executeBatch([test]);

      expect(report.passed).toBe(1);
      expect(retryRunner.execute).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should fail after exhausting all retries', async () => {
      const alwaysFailingRunner: TestRunner = {
        name: 'always-failing-runner',
        supports: ['unit'],
        execute: vi.fn().mockRejectedValue(new Error('Always fails'))
      };

      pipeline.registerRunner(alwaysFailingRunner);

      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Always Failing Test',
        description: 'This always fails',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'always failing code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const report = await pipeline.executeBatch([test]);

      expect(report.failed).toBe(1);
      expect(alwaysFailingRunner.execute).toHaveBeenCalledTimes(2); // maxRetries = 2
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running tests', async () => {
      const slowRunner: TestRunner = {
        name: 'slow-runner',
        supports: ['unit'],
        execute: vi.fn().mockImplementation(async () => {
          // Simulate a test that takes longer than timeout
          await new Promise(resolve => setTimeout(resolve, 10000));
          return { success: true, duration: 10000, timestamp: new Date() };
        })
      };

      const timeoutPipeline = new TestExecutionPipeline({
        timeoutMs: 100,
        maxRetries: 1
      });
      timeoutPipeline.registerRunner(slowRunner);

      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Slow Test',
        description: 'This test is too slow',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'slow test code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const report = await timeoutPipeline.executeBatch([test]);

      expect(report.failed).toBe(1);
      expect(report.failures[0].error).toContain('timed out');
    });
  });

  describe('Test Reporting', () => {
    it('should generate comprehensive test report', async () => {
      const tests: TestDefinition[] = [
        {
          id: 'test-1',
          type: 'unit',
          title: 'Passing Test',
          description: 'This passes',
          agentRole: 'Core',
          requirements: ['REQ-1'],
          testCode: 'passing code',
          status: 'pending',
          createdBy: 'core-agent-1',
          createdAt: new Date()
        },
        {
          id: 'test-2',
          type: 'unit',
          title: 'Failing Test',
          description: 'This fails',
          agentRole: 'Core',
          requirements: ['REQ-2'],
          testCode: 'failing code',
          status: 'pending',
          createdBy: 'core-agent-2',
          createdAt: new Date()
        }
      ];

      // Mock one success and one failure
      const mixedRunner: TestRunner = {
        name: 'mixed-runner',
        supports: ['unit'],
        execute: vi.fn()
          .mockResolvedValueOnce({
            success: true,
            duration: 100,
            coverage: 90,
            timestamp: new Date()
          })
          .mockResolvedValueOnce({
            success: false,
            duration: 50,
            error: 'Assertion failed',
            coverage: 60,
            timestamp: new Date()
          })
      };

      const reportingPipeline = new TestExecutionPipeline({
        failFast: false,
        reportingEnabled: true
      });
      reportingPipeline.registerRunner(mixedRunner);

      const report = await reportingPipeline.executeBatch(tests);

      expect(report.totalTests).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.coverage).toBe(75); // Average of 90 and 60
      expect(report.failures).toHaveLength(1);
      expect(report.failures[0].testTitle).toBe('Failing Test');
      expect(report.summary).toContain('1/2 tests passed (50.0%)');
    });

    it('should store and retrieve reports', async () => {
      const test: TestDefinition = {
        id: 'test-1',
        type: 'unit',
        title: 'Test',
        description: 'Description',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      await pipeline.executeBatch([test]);

      const reports = pipeline.getReports();
      expect(reports).toHaveLength(1);

      const latestReport = pipeline.getLatestReport();
      expect(latestReport).toBe(reports[0]);
    });
  });

  describe('Runner Selection', () => {
    it('should select appropriate runner for test type', async () => {
      const unitRunner: TestRunner = {
        name: 'unit-runner',
        supports: ['unit'],
        execute: vi.fn().mockResolvedValue({
          success: true,
          duration: 50,
          timestamp: new Date()
        })
      };

      const e2eRunner: TestRunner = {
        name: 'e2e-runner',
        supports: ['e2e'],
        execute: vi.fn().mockResolvedValue({
          success: true,
          duration: 2000,
          timestamp: new Date()
        })
      };

      pipeline.registerRunner(unitRunner);
      pipeline.registerRunner(e2eRunner);

      const unitTest: TestDefinition = {
        id: 'unit-test',
        type: 'unit',
        title: 'Unit Test',
        description: 'Unit test',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'unit code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      const e2eTest: TestDefinition = {
        id: 'e2e-test',
        type: 'e2e',
        title: 'E2E Test',
        description: 'E2E test',
        agentRole: 'Coordinator',
        requirements: ['REQ-1'],
        testCode: 'e2e code',
        status: 'pending',
        createdBy: 'coordinator-agent-1',
        createdAt: new Date()
      };

      await pipeline.executeBatch([unitTest, e2eTest]);

      expect(unitRunner.execute).toHaveBeenCalledWith(unitTest);
      expect(e2eRunner.execute).toHaveBeenCalledWith(e2eTest);
    });

    it('should fail if no suitable runner found', async () => {
      const unsupportedTest: TestDefinition = {
        id: 'unsupported-test',
        type: 'integration', // No runner supports this
        title: 'Unsupported Test',
        description: 'No runner for this',
        agentRole: 'Core',
        requirements: ['REQ-1'],
        testCode: 'unsupported code',
        status: 'pending',
        createdBy: 'core-agent-1',
        createdAt: new Date()
      };

      // Remove default runners that support integration
      const emptyPipeline = new TestExecutionPipeline();

      const report = await emptyPipeline.executeBatch([unsupportedTest]);

      expect(report.failed).toBe(1);
      expect(report.failures[0].error).toContain('No suitable test runner found');
    });
  });
});