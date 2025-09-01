/**
 * Tests for CI/CD Pipeline System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CICDPipelineManager } from '../../lib/testing/ci-cd-pipeline';
import { TestAutomationEngine } from '../../lib/testing/test-automation';

describe('CICDPipelineManager', () => {
  let pipelineManager: CICDPipelineManager;
  let mockAutomationEngine: TestAutomationEngine;

  beforeEach(() => {
    mockAutomationEngine = {
      executeTrigger: vi.fn().mockResolvedValue({
        id: 'automation-report-1',
        triggerId: 'file_change',
        totalTests: 10,
        passed: 10,
        failed: 0,
        skipped: 0,
        coverage: 85,
        deploymentReady: true,
        approvalRequired: false
      })
    } as any;

    pipelineManager = new CICDPipelineManager(mockAutomationEngine);
  });

  describe('Pipeline Execution Creation', () => {
    it('should create pipeline execution for development environment', async () => {
      const execution = await pipelineManager.createExecution(
        'main-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      expect(execution.pipelineId).toBe('main-pipeline');
      expect(execution.triggeredBy).toBe('user-123');
      expect(execution.triggerType).toBe('commit');
      expect(execution.deploymentTargets).toEqual(['development']);
      expect(execution.status).toBe('running');
      expect(execution.stages.size).toBeGreaterThan(0);
    });

    it('should create pipeline execution for multiple environments', async () => {
      const execution = await pipelineManager.createExecution(
        'multi-env-pipeline',
        'user-456',
        'pull_request',
        ['development', 'staging']
      );

      expect(execution.deploymentTargets).toEqual(['development', 'staging']);
      expect(execution.stages.has('deploy_development')).toBe(true);
      expect(execution.stages.has('deploy_staging')).toBe(true);
    });

    it('should create stages in correct dependency order', async () => {
      const execution = await pipelineManager.createExecution(
        'test-pipeline',
        'user-789',
        'manual',
        ['development']
      );

      const unitTests = execution.stages.get('unit_tests');
      const integrationTests = execution.stages.get('integration_tests');
      const build = execution.stages.get('build');
      const security = execution.stages.get('security');

      expect(unitTests?.dependencies).toEqual([]);
      expect(integrationTests?.dependencies).toEqual(['unit_tests']);
      expect(build?.dependencies).toEqual(['integration_tests']);
      expect(security?.dependencies).toEqual(['build']);
    });
  });

  describe('Stage Execution', () => {
    it('should execute test stages successfully', async () => {
      const execution = await pipelineManager.createExecution(
        'test-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockAutomationEngine.executeTrigger).toHaveBeenCalled();
      expect(execution.testReports.length).toBeGreaterThan(0);
    });

    it('should handle test stage failures', async () => {
      // Mock automation engine to return failures
      mockAutomationEngine.executeTrigger = vi.fn().mockResolvedValue({
        id: 'automation-report-fail',
        triggerId: 'file_change',
        totalTests: 10,
        passed: 8,
        failed: 2,
        skipped: 0,
        coverage: 70,
        deploymentReady: false,
        approvalRequired: true
      });

      const execution = await pipelineManager.createExecution(
        'failing-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(execution.status).toBe('failed');
    });

    it('should execute build stages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await pipelineManager.createExecution(
        'build-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('Building application...');
      expect(consoleSpy).toHaveBeenCalledWith('Build completed successfully');

      consoleSpy.mockRestore();
    });

    it('should execute security stages', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await pipelineManager.createExecution(
        'security-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('Running security scans...');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Security scans completed - no vulnerabilities found'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Deployment Stages', () => {
    it('should deploy to development without approval', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await pipelineManager.createExecution(
        'dev-deploy-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith('Deploying to Development...');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Deployment to Development completed'
      );

      consoleSpy.mockRestore();
    });

    it('should require approval for staging deployment', async () => {
      const execution = await pipelineManager.createExecution(
        'staging-pipeline',
        'user-123',
        'pull_request',
        ['staging']
      );

      // Wait for execution to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const deployStage = execution.stages.get('deploy_staging');
      expect(deployStage?.status).toBe('waiting_approval');
      expect(execution.approvalGates.size).toBeGreaterThan(0);
    });

    it('should require approval for production deployment', async () => {
      const execution = await pipelineManager.createExecution(
        'prod-pipeline',
        'user-123',
        'manual',
        ['production']
      );

      // Wait for execution to start
      await new Promise(resolve => setTimeout(resolve, 100));

      const deployStage = execution.stages.get('deploy_production');
      expect(deployStage?.status).toBe('waiting_approval');
      
      const approvalGates = Array.from(execution.approvalGates.values());
      const prodApproval = approvalGates.find(gate => 
        gate.stageId === 'deploy_production'
      );
      expect(prodApproval?.requiredApprovals).toBe(2); // Production requires 2 approvals
    });
  });

  describe('Approval System', () => {
    it('should process approval successfully', async () => {
      const execution = await pipelineManager.createExecution(
        'approval-pipeline',
        'user-123',
        'pull_request',
        ['staging']
      );

      // Wait for approval gate to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const approvalGates = Array.from(execution.approvalGates.keys());
      const approvalGateId = approvalGates[0];

      await pipelineManager.processApproval(
        approvalGateId,
        'senior-dev-1',
        'approve',
        'Looks good to deploy'
      );

      const approvalGate = pipelineManager['approvalGates'].get(approvalGateId);
      expect(approvalGate?.status).toBe('approved');
      expect(approvalGate?.approvals).toHaveLength(1);
      expect(approvalGate?.approvals[0].decision).toBe('approve');
    });

    it('should reject deployment on rejection', async () => {
      const execution = await pipelineManager.createExecution(
        'rejection-pipeline',
        'user-123',
        'pull_request',
        ['staging']
      );

      // Wait for approval gate to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const approvalGates = Array.from(execution.approvalGates.keys());
      const approvalGateId = approvalGates[0];

      await pipelineManager.processApproval(
        approvalGateId,
        'senior-dev-1',
        'reject',
        'Security concerns'
      );

      const approvalGate = pipelineManager['approvalGates'].get(approvalGateId);
      expect(approvalGate?.status).toBe('rejected');
    });

    it('should require multiple approvals for production', async () => {
      const execution = await pipelineManager.createExecution(
        'prod-approval-pipeline',
        'user-123',
        'manual',
        ['production']
      );

      // Wait for approval gate to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const approvalGates = Array.from(execution.approvalGates.keys());
      const approvalGateId = approvalGates[0];

      // First approval
      await pipelineManager.processApproval(
        approvalGateId,
        'architect-1',
        'approve'
      );

      let approvalGate = pipelineManager['approvalGates'].get(approvalGateId);
      expect(approvalGate?.status).toBe('pending'); // Still pending, needs 2 approvals

      // Second approval
      await pipelineManager.processApproval(
        approvalGateId,
        'architect-2',
        'approve'
      );

      approvalGate = pipelineManager['approvalGates'].get(approvalGateId);
      expect(approvalGate?.status).toBe('approved'); // Now approved
    });

    it('should throw error for unauthorized approver', async () => {
      const execution = await pipelineManager.createExecution(
        'unauthorized-pipeline',
        'user-123',
        'pull_request',
        ['staging']
      );

      // Wait for approval gate to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const approvalGates = Array.from(execution.approvalGates.keys());
      const approvalGateId = approvalGates[0];

      await expect(
        pipelineManager.processApproval(
          approvalGateId,
          'unauthorized-user',
          'approve'
        )
      ).rejects.toThrow('User unauthorized-user is not authorized to approve this gate');
    });

    it('should throw error for duplicate approval', async () => {
      const execution = await pipelineManager.createExecution(
        'duplicate-pipeline',
        'user-123',
        'pull_request',
        ['staging']
      );

      // Wait for approval gate to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const approvalGates = Array.from(execution.approvalGates.keys());
      const approvalGateId = approvalGates[0];

      // First approval
      await pipelineManager.processApproval(
        approvalGateId,
        'senior-dev-1',
        'approve'
      );

      // Duplicate approval
      await expect(
        pipelineManager.processApproval(
          approvalGateId,
          'senior-dev-1',
          'approve'
        )
      ).rejects.toThrow('User senior-dev-1 has already provided approval');
    });
  });

  describe('Pipeline Status and Reporting', () => {
    it('should track execution status', async () => {
      const execution = await pipelineManager.createExecution(
        'status-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      const retrievedExecution = pipelineManager.getExecution(execution.id);
      expect(retrievedExecution).toBe(execution);
    });

    it('should list all executions', async () => {
      await pipelineManager.createExecution(
        'pipeline-1',
        'user-123',
        'commit',
        ['development']
      );
      await pipelineManager.createExecution(
        'pipeline-2',
        'user-456',
        'pull_request',
        ['staging']
      );

      const allExecutions = pipelineManager.getAllExecutions();
      expect(allExecutions).toHaveLength(2);
    });

    it('should list pending approvals', async () => {
      await pipelineManager.createExecution(
        'pending-pipeline-1',
        'user-123',
        'pull_request',
        ['staging']
      );
      await pipelineManager.createExecution(
        'pending-pipeline-2',
        'user-456',
        'manual',
        ['production']
      );

      // Wait for approval gates to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      const pendingApprovals = pipelineManager.getPendingApprovals();
      expect(pendingApprovals.length).toBeGreaterThan(0);
      expect(pendingApprovals.every(gate => gate.status === 'pending')).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should run health checks after deployment', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await pipelineManager.createExecution(
        'health-check-pipeline',
        'user-123',
        'commit',
        ['development']
      );

      // Wait for execution to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Running health checks for Development...'
      );
      expect(consoleSpy).toHaveBeenCalledWith('✓ API Health - OK');
      expect(consoleSpy).toHaveBeenCalledWith('✓ Database Connection - OK');

      consoleSpy.mockRestore();
    });
  });
});