/**
 * Tests for Test Automation System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestAutomationEngine, AutomationConfig } from '../../lib/testing/test-automation';
import { TestExecutionPipeline } from '../../lib/testing/test-execution-pipeline';
import { HierarchicalTDDFramework } from '../../lib/testing/hierarchical-tdd-framework';

describe('TestAutomationEngine', () => {
  let automationEngine: TestAutomationEngine;
  let mockPipeline: TestExecutionPipeline;
  let mockTDDFramework: HierarchicalTDDFramework;
  let config: AutomationConfig;

  beforeEach(() => {
    config = {
      watchPatterns: ['src/**/*.ts'],
      excludePatterns: ['**/*.test.ts'],
      testTimeout: 30000,
      retryAttempts: 2,
      parallelExecution: false,
      slackNotifications: true,
      emailNotifications: false
    };

    mockPipeline = {
      executeBatch: vi.fn().mockResolvedValue({
        id: 'test-report-1',
        totalTests: 5,
        passed: 5,
        failed: 0,
        skipped: 0,
        coverage: 85,
        failures: [],
        duration: 1000,
        timestamp: new Date()
      })
    } as any;

    mockTDDFramework = {
      getAllMissions: vi.fn().mockReturnValue([
        { id: 'mission-1', title: 'Test Mission 1' },
        { id: 'mission-2', title: 'Test Mission 2' }
      ]),
      executeMission: vi.fn().mockResolvedValue(true)
    } as any;

    automationEngine = new TestAutomationEngine(config, mockPipeline, mockTDDFramework);
  });

  describe('Engine Lifecycle', () => {
    it('should start and stop successfully', async () => {
      await automationEngine.start();
      expect(automationEngine['isRunning']).toBe(true);

      await automationEngine.stop();
      expect(automationEngine['isRunning']).toBe(false);
    });

    it('should throw error when starting already running engine', async () => {
      await automationEngine.start();
      
      await expect(automationEngine.start()).rejects.toThrow(
        'Automation engine is already running'
      );
    });
  });

  describe('Trigger Management', () => {
    it('should register custom triggers', () => {
      const customTrigger = {
        id: 'custom-trigger',
        type: 'manual' as const,
        patterns: ['**/*.custom'],
        testSuites: ['custom'],
        enabled: true
      };

      automationEngine.registerTrigger(customTrigger);
      
      const triggers = automationEngine['triggers'];
      expect(triggers.has('custom-trigger')).toBe(true);
      expect(triggers.get('custom-trigger')).toEqual(customTrigger);
    });

    it('should have default triggers registered', () => {
      const triggers = automationEngine['triggers'];
      
      expect(triggers.has('file_change')).toBe(true);
      expect(triggers.has('git_commit')).toBe(true);
      expect(triggers.has('pull_request')).toBe(true);
      expect(triggers.has('nightly')).toBe(true);
    });
  });

  describe('Trigger Execution', () => {
    it('should execute file change trigger successfully', async () => {
      const report = await automationEngine.executeTrigger('file_change', {
        changedFiles: ['src/components/Button.ts']
      });

      expect(report.triggerId).toBe('file_change');
      expect(report.totalTests).toBe(5);
      expect(report.passed).toBe(5);
      expect(report.failed).toBe(0);
      expect(report.deploymentReady).toBe(true);
      expect(mockPipeline.executeBatch).toHaveBeenCalled();
    });

    it('should execute git commit trigger successfully', async () => {
      const report = await automationEngine.executeTrigger('git_commit', {
        commitHash: 'abc123'
      });

      expect(report.triggerId).toBe('git_commit');
      expect(report.deploymentReady).toBe(true);
    });

    it('should execute pull request trigger successfully', async () => {
      const report = await automationEngine.executeTrigger('pull_request', {
        prNumber: 42
      });

      expect(report.triggerId).toBe('pull_request');
      expect(report.approvalRequired).toBe(true); // PR always requires approval
    });

    it('should throw error for non-existent trigger', async () => {
      await expect(
        automationEngine.executeTrigger('non-existent')
      ).rejects.toThrow('Trigger non-existent not found');
    });

    it('should throw error for disabled trigger', async () => {
      const disabledTrigger = {
        id: 'disabled-trigger',
        type: 'manual' as const,
        patterns: ['**/*'],
        testSuites: ['unit'],
        enabled: false
      };

      automationEngine.registerTrigger(disabledTrigger);

      await expect(
        automationEngine.executeTrigger('disabled-trigger')
      ).rejects.toThrow('Trigger disabled-trigger is disabled');
    });
  });

  describe('Test Failure Handling', () => {
    it('should handle test failures correctly', async () => {
      // Mock pipeline to return failures
      mockPipeline.executeBatch = vi.fn().mockResolvedValue({
        id: 'test-report-fail',
        totalTests: 5,
        passed: 3,
        failed: 2,
        skipped: 0,
        coverage: 60,
        failures: [
          { testId: 'test-1', testTitle: 'Failing Test 1', error: 'Assertion failed' },
          { testId: 'test-2', testTitle: 'Failing Test 2', error: 'Timeout' }
        ],
        duration: 2000,
        timestamp: new Date()
      });

      const report = await automationEngine.executeTrigger('file_change');

      expect(report.failed).toBe(2);
      expect(report.deploymentReady).toBe(false); // Should be false due to failures
      expect(report.approvalRequired).toBe(true); // Should require approval due to failures
    });

    it('should handle low coverage correctly', async () => {
      // Mock pipeline to return low coverage
      mockPipeline.executeBatch = vi.fn().mockResolvedValue({
        id: 'test-report-low-coverage',
        totalTests: 5,
        passed: 5,
        failed: 0,
        skipped: 0,
        coverage: 70, // Below 80% threshold
        failures: [],
        duration: 1000,
        timestamp: new Date()
      });

      const report = await automationEngine.executeTrigger('file_change');

      expect(report.passed).toBe(5);
      expect(report.failed).toBe(0);
      expect(report.coverage).toBe(70);
      expect(report.deploymentReady).toBe(false); // Should be false due to low coverage
    });
  });

  describe('Mission Execution', () => {
    it('should execute all TDD missions successfully', async () => {
      const report = await automationEngine.executeAllMissions();

      expect(report.triggerId).toBe('all_missions');
      expect(report.totalTests).toBe(2); // 2 missions
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(0);
      expect(report.deploymentReady).toBe(true);
      expect(mockTDDFramework.getAllMissions).toHaveBeenCalled();
      expect(mockTDDFramework.executeMission).toHaveBeenCalledTimes(2);
    });

    it('should handle mission failures', async () => {
      // Mock one mission to fail
      mockTDDFramework.executeMission = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const report = await automationEngine.executeAllMissions();

      expect(report.totalTests).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.deploymentReady).toBe(false);
      expect(report.approvalRequired).toBe(true);
    });

    it('should handle mission execution errors', async () => {
      // Mock mission to throw error
      mockTDDFramework.executeMission = vi.fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Mission execution failed'));

      const report = await automationEngine.executeAllMissions();

      expect(report.totalTests).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.deploymentReady).toBe(false);
    });
  });

  describe('Report Management', () => {
    it('should store and retrieve reports', async () => {
      await automationEngine.executeTrigger('file_change');
      await automationEngine.executeTrigger('git_commit');

      const reports = automationEngine.getReports();
      expect(reports).toHaveLength(2);

      const latestReport = automationEngine.getLatestReport();
      expect(latestReport).toBe(reports[1]);
      expect(latestReport?.triggerId).toBe('git_commit');
    });

    it('should return null for latest report when no reports exist', () => {
      const latestReport = automationEngine.getLatestReport();
      expect(latestReport).toBeNull();
    });
  });

  describe('Notification System', () => {
    it('should send notifications for successful runs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await automationEngine.executeTrigger('file_change');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slack notification:')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ PASSED')
      );

      consoleSpy.mockRestore();
    });

    it('should send notifications for failed runs', async () => {
      // Mock pipeline to return failures
      mockPipeline.executeBatch = vi.fn().mockResolvedValue({
        id: 'test-report-fail',
        totalTests: 5,
        passed: 3,
        failed: 2,
        skipped: 0,
        coverage: 60,
        failures: [],
        duration: 2000,
        timestamp: new Date()
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await automationEngine.executeTrigger('file_change');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ FAILED')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Deployment Status', () => {
    it('should approve deployment for successful tests', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await automationEngine.executeTrigger('file_change');

      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Deployment approved - all tests passed'
      );

      consoleSpy.mockRestore();
    });

    it('should block deployment for failed tests', async () => {
      // Mock pipeline to return failures
      mockPipeline.executeBatch = vi.fn().mockResolvedValue({
        id: 'test-report-fail',
        totalTests: 5,
        passed: 3,
        failed: 2,
        skipped: 0,
        coverage: 60,
        failures: [],
        duration: 2000,
        timestamp: new Date()
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await automationEngine.executeTrigger('file_change');

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Deployment blocked - tests failed or approval required'
      );

      consoleSpy.mockRestore();
    });
  });
});