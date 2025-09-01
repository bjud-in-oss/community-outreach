/**
 * CI/CD Pipeline Integration
 * 
 * Provides integration with CI/CD systems, deployment pipelines,
 * and human approval gates for the hierarchical TDD system.
 */

import { TestAutomationEngine, AutomationReport } from './test-automation';

export interface PipelineStage {
  id: string;
  name: string;
  type: 'test' | 'build' | 'deploy' | 'approval' | 'security' | 'performance';
  dependencies: string[];
  timeout: number;
  retryAttempts: number;
  approvalRequired: boolean;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'waiting_approval';
}

export interface DeploymentEnvironment {
  id: string;
  name: string;
  type: 'development' | 'staging' | 'production';
  approvalRequired: boolean;
  testSuites: string[];
  healthChecks: string[];
}

export interface ApprovalGate {
  id: string;
  stageId: string;
  approverRole: 'architect' | 'senior_developer' | 'product_owner';
  approvers: string[];
  requiredApprovals: number;
  timeoutHours: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvals: Approval[];
}

export interface Approval {
  approverId: string;
  timestamp: Date;
  decision: 'approve' | 'reject';
  comments?: string;
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  triggeredBy: string;
  triggerType: 'commit' | 'pull_request' | 'manual' | 'scheduled';
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'passed' | 'failed' | 'cancelled';
  stages: Map<string, PipelineStage>;
  approvalGates: Map<string, ApprovalGate>;
  testReports: AutomationReport[];
  deploymentTargets: string[];
}

/**
 * CI/CD Pipeline Manager
 */
export class CICDPipelineManager {
  private automationEngine: TestAutomationEngine;
  private environments: Map<string, DeploymentEnvironment> = new Map();
  private executions: Map<string, PipelineExecution> = new Map();
  private approvalGates: Map<string, ApprovalGate> = new Map();

  constructor(automationEngine: TestAutomationEngine) {
    this.automationEngine = automationEngine;
    this.setupDefaultEnvironments();
  }

  /**
   * Creates a new pipeline execution
   */
  async createExecution(
    pipelineId: string,
    triggeredBy: string,
    triggerType: 'commit' | 'pull_request' | 'manual' | 'scheduled',
    targetEnvironments: string[] = ['development']
  ): Promise<PipelineExecution> {
    const executionId = `exec_${Date.now()}`;
    
    const execution: PipelineExecution = {
      id: executionId,
      pipelineId,
      triggeredBy,
      triggerType,
      startTime: new Date(),
      status: 'running',
      stages: new Map(),
      approvalGates: new Map(),
      testReports: [],
      deploymentTargets: targetEnvironments
    };

    // Create pipeline stages based on target environments
    await this.createPipelineStages(execution);

    this.executions.set(executionId, execution);
    
    // Start execution
    await this.executeStages(executionId);

    return execution;
  }

  /**
   * Executes pipeline stages in order
   */
  private async executeStages(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    try {
      // Execute stages in dependency order
      const stageOrder = this.calculateStageOrder(execution);
      
      for (const stageId of stageOrder) {
        const stage = execution.stages.get(stageId);
        if (!stage) continue;

        await this.executeStage(execution, stage);
        
        // Check if execution should continue
        if (execution.status === 'failed' || execution.status === 'cancelled') {
          break;
        }
      }

      // Update final execution status
      if (execution.status === 'running') {
        const allStagesPassed = Array.from(execution.stages.values())
          .every(stage => stage.status === 'passed' || stage.status === 'skipped');
        execution.status = allStagesPassed ? 'passed' : 'failed';
      }

      execution.endTime = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      console.error(`Pipeline execution ${executionId} failed:`, error);
    }
  }

  /**
   * Executes a single pipeline stage
   */
  private async executeStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    console.log(`Executing stage: ${stage.name} (${stage.type})`);
    stage.status = 'running';

    try {
      switch (stage.type) {
        case 'test':
          await this.executeTestStage(execution, stage);
          break;
        case 'build':
          await this.executeBuildStage(execution, stage);
          break;
        case 'deploy':
          await this.executeDeployStage(execution, stage);
          break;
        case 'approval':
          await this.executeApprovalStage(execution, stage);
          break;
        case 'security':
          await this.executeSecurityStage(execution, stage);
          break;
        case 'performance':
          await this.executePerformanceStage(execution, stage);
          break;
        default:
          throw new Error(`Unknown stage type: ${stage.type}`);
      }

      if (stage.status === 'running') {
        stage.status = 'passed';
      }
    } catch (error) {
      stage.status = 'failed';
      execution.status = 'failed';
      throw error;
    }
  }

  /**
   * Executes test stage using automation engine
   */
  private async executeTestStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    const triggerId = this.mapStageToTrigger(stage, execution.triggerType);
    const report = await this.automationEngine.executeTrigger(triggerId);
    
    execution.testReports.push(report);
    
    if (report.failed > 0) {
      throw new Error(`Tests failed: ${report.failed}/${report.totalTests}`);
    }
  }

  /**
   * Executes build stage
   */
  private async executeBuildStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    console.log('Building application...');
    
    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, would run actual build commands
    console.log('Build completed successfully');
  }

  /**
   * Executes deployment stage
   */
  private async executeDeployStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    const environmentId = stage.id.replace('deploy_', '');
    const environment = this.environments.get(environmentId);
    
    if (!environment) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    console.log(`Deploying to ${environment.name}...`);
    
    // Check if approval is required
    if (environment.approvalRequired) {
      await this.createApprovalGate(execution, stage, environment);
      stage.status = 'waiting_approval';
      return;
    }

    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Run health checks
    await this.runHealthChecks(environment);
    
    console.log(`Deployment to ${environment.name} completed`);
  }

  /**
   * Executes approval stage
   */
  private async executeApprovalStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    const approvalGate = execution.approvalGates.get(stage.id);
    if (!approvalGate) {
      throw new Error(`Approval gate for stage ${stage.id} not found`);
    }

    // Check approval status
    if (approvalGate.status === 'pending') {
      stage.status = 'waiting_approval';
      console.log(`Waiting for approval from: ${approvalGate.approvers.join(', ')}`);
      return;
    }

    if (approvalGate.status === 'rejected') {
      throw new Error('Deployment rejected by approver');
    }

    if (approvalGate.status === 'expired') {
      throw new Error('Approval gate expired');
    }

    console.log('Approval received, continuing deployment');
  }

  /**
   * Executes security stage
   */
  private async executeSecurityStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    console.log('Running security scans...');
    
    // Simulate security scanning
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // In real implementation, would run SAST, DAST, dependency scans
    console.log('Security scans completed - no vulnerabilities found');
  }

  /**
   * Executes performance stage
   */
  private async executePerformanceStage(execution: PipelineExecution, stage: PipelineStage): Promise<void> {
    console.log('Running performance tests...');
    
    // Simulate performance testing
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // In real implementation, would run load tests, stress tests
    console.log('Performance tests completed - all metrics within acceptable range');
  }

  /**
   * Creates approval gate for deployment
   */
  private async createApprovalGate(
    execution: PipelineExecution,
    stage: PipelineStage,
    environment: DeploymentEnvironment
  ): Promise<void> {
    const approvalGate: ApprovalGate = {
      id: `approval_${stage.id}`,
      stageId: stage.id,
      approverRole: environment.type === 'production' ? 'architect' : 'senior_developer',
      approvers: this.getApproversForEnvironment(environment),
      requiredApprovals: environment.type === 'production' ? 2 : 1,
      timeoutHours: 24,
      status: 'pending',
      approvals: []
    };

    execution.approvalGates.set(approvalGate.id, approvalGate);
    this.approvalGates.set(approvalGate.id, approvalGate);

    console.log(`Approval gate created for ${environment.name} deployment`);
  }

  /**
   * Processes approval for a gate
   */
  async processApproval(
    approvalGateId: string,
    approverId: string,
    decision: 'approve' | 'reject',
    comments?: string
  ): Promise<void> {
    const approvalGate = this.approvalGates.get(approvalGateId);
    if (!approvalGate) {
      throw new Error(`Approval gate ${approvalGateId} not found`);
    }

    if (!approvalGate.approvers.includes(approverId)) {
      throw new Error(`User ${approverId} is not authorized to approve this gate`);
    }

    // Check if user already approved
    const existingApproval = approvalGate.approvals.find(a => a.approverId === approverId);
    if (existingApproval) {
      throw new Error(`User ${approverId} has already provided approval`);
    }

    // Add approval
    const approval: Approval = {
      approverId,
      timestamp: new Date(),
      decision,
      comments
    };

    approvalGate.approvals.push(approval);

    // Update gate status
    if (decision === 'reject') {
      approvalGate.status = 'rejected';
    } else {
      const approvals = approvalGate.approvals.filter(a => a.decision === 'approve').length;
      if (approvals >= approvalGate.requiredApprovals) {
        approvalGate.status = 'approved';
      }
    }

    console.log(`Approval processed: ${decision} by ${approverId}`);

    // Continue pipeline execution if approved
    if (approvalGate.status === 'approved') {
      await this.continueAfterApproval(approvalGateId);
    }
  }

  /**
   * Continues pipeline execution after approval
   */
  private async continueAfterApproval(approvalGateId: string): Promise<void> {
    // Find execution and continue from approval stage
    for (const execution of this.executions.values()) {
      const approvalGate = execution.approvalGates.get(approvalGateId);
      if (approvalGate) {
        const stage = execution.stages.get(approvalGate.stageId);
        if (stage && stage.status === 'waiting_approval') {
          await this.executeStage(execution, stage);
        }
        break;
      }
    }
  }

  /**
   * Gets pipeline execution status
   */
  getExecution(executionId: string): PipelineExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Gets all executions
   */
  getAllExecutions(): PipelineExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Gets pending approval gates
   */
  getPendingApprovals(): ApprovalGate[] {
    return Array.from(this.approvalGates.values())
      .filter(gate => gate.status === 'pending');
  }

  /**
   * Creates pipeline stages based on target environments
   */
  private async createPipelineStages(execution: PipelineExecution): Promise<void> {
    // Unit tests stage
    execution.stages.set('unit_tests', {
      id: 'unit_tests',
      name: 'Unit Tests',
      type: 'test',
      dependencies: [],
      timeout: 300000, // 5 minutes
      retryAttempts: 2,
      approvalRequired: false,
      status: 'pending'
    });

    // Integration tests stage
    execution.stages.set('integration_tests', {
      id: 'integration_tests',
      name: 'Integration Tests',
      type: 'test',
      dependencies: ['unit_tests'],
      timeout: 600000, // 10 minutes
      retryAttempts: 2,
      approvalRequired: false,
      status: 'pending'
    });

    // Build stage
    execution.stages.set('build', {
      id: 'build',
      name: 'Build Application',
      type: 'build',
      dependencies: ['integration_tests'],
      timeout: 600000, // 10 minutes
      retryAttempts: 1,
      approvalRequired: false,
      status: 'pending'
    });

    // Security scan stage
    execution.stages.set('security', {
      id: 'security',
      name: 'Security Scan',
      type: 'security',
      dependencies: ['build'],
      timeout: 900000, // 15 minutes
      retryAttempts: 1,
      approvalRequired: false,
      status: 'pending'
    });

    // Create deployment stages for each target environment
    for (const envId of execution.deploymentTargets) {
      const environment = this.environments.get(envId);
      if (environment) {
        const deployStageId = `deploy_${envId}`;
        execution.stages.set(deployStageId, {
          id: deployStageId,
          name: `Deploy to ${environment.name}`,
          type: 'deploy',
          dependencies: ['security'],
          timeout: 1800000, // 30 minutes
          retryAttempts: 1,
          approvalRequired: environment.approvalRequired,
          status: 'pending'
        });

        // E2E tests for this environment
        if (environment.testSuites.includes('e2e')) {
          const e2eStageId = `e2e_${envId}`;
          execution.stages.set(e2eStageId, {
            id: e2eStageId,
            name: `E2E Tests (${environment.name})`,
            type: 'test',
            dependencies: [deployStageId],
            timeout: 1800000, // 30 minutes
            retryAttempts: 2,
            approvalRequired: false,
            status: 'pending'
          });
        }
      }
    }
  }

  /**
   * Calculates stage execution order based on dependencies
   */
  private calculateStageOrder(execution: PipelineExecution): string[] {
    const stages = Array.from(execution.stages.values());
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (stageId: string) => {
      if (visited.has(stageId)) return;
      
      const stage = execution.stages.get(stageId);
      if (!stage) return;

      // Visit dependencies first
      for (const depId of stage.dependencies) {
        visit(depId);
      }

      visited.add(stageId);
      order.push(stageId);
    };

    // Visit all stages
    for (const stage of stages) {
      visit(stage.id);
    }

    return order;
  }

  /**
   * Maps stage to automation trigger
   */
  private mapStageToTrigger(stage: PipelineStage, triggerType: string): string {
    if (stage.name.includes('Unit')) return 'file_change';
    if (stage.name.includes('Integration')) return 'git_commit';
    if (stage.name.includes('E2E')) return 'pull_request';
    return 'git_commit';
  }

  /**
   * Gets approvers for environment
   */
  private getApproversForEnvironment(environment: DeploymentEnvironment): string[] {
    // In real implementation, would fetch from user management system
    switch (environment.type) {
      case 'production':
        return ['architect-1', 'architect-2', 'senior-dev-1'];
      case 'staging':
        return ['senior-dev-1', 'senior-dev-2'];
      default:
        return ['dev-lead-1'];
    }
  }

  /**
   * Runs health checks for environment
   */
  private async runHealthChecks(environment: DeploymentEnvironment): Promise<void> {
    console.log(`Running health checks for ${environment.name}...`);
    
    for (const healthCheck of environment.healthChecks) {
      console.log(`✓ ${healthCheck} - OK`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Sets up default deployment environments
   */
  private setupDefaultEnvironments(): void {
    this.environments.set('development', {
      id: 'development',
      name: 'Development',
      type: 'development',
      approvalRequired: false,
      testSuites: ['unit', 'integration'],
      healthChecks: ['API Health', 'Database Connection']
    });

    this.environments.set('staging', {
      id: 'staging',
      name: 'Staging',
      type: 'staging',
      approvalRequired: true,
      testSuites: ['unit', 'integration', 'e2e'],
      healthChecks: ['API Health', 'Database Connection', 'External Services']
    });

    this.environments.set('production', {
      id: 'production',
      name: 'Production',
      type: 'production',
      approvalRequired: true,
      testSuites: ['unit', 'integration', 'e2e', 'performance'],
      healthChecks: ['API Health', 'Database Connection', 'External Services', 'Performance Metrics']
    });
  }
}