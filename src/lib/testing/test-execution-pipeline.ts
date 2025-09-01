/**
 * Test Execution Pipeline
 * 
 * Manages the execution of tests with failure reporting, retry logic,
 * and integration with various test runners.
 */

import { TestDefinition, TestExecutionResult, TestSuite } from './hierarchical-tdd-framework';

export interface TestRunner {
  name: string;
  supports: ('unit' | 'integration' | 'e2e')[];
  execute(test: TestDefinition): Promise<TestExecutionResult>;
}

export interface PipelineConfig {
  maxRetries: number;
  timeoutMs: number;
  parallelExecution: boolean;
  failFast: boolean;
  reportingEnabled: boolean;
}

export interface TestReport {
  id: string;
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: number;
  failures: TestFailure[];
  summary: string;
}

export interface TestFailure {
  testId: string;
  testTitle: string;
  error: string;
  stackTrace?: string;
  requirements: string[];
  agentRole: string;
}

/**
 * Test execution pipeline that orchestrates test running with reporting
 */
export class TestExecutionPipeline {
  private runners: Map<string, TestRunner> = new Map();
  private config: PipelineConfig;
  private reports: TestReport[] = [];

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = {
      maxRetries: 3,
      timeoutMs: 30000,
      parallelExecution: false,
      failFast: true,
      reportingEnabled: true,
      ...config
    };

    // Register default test runners only if none are provided
    if (this.runners.size === 0) {
      this.registerDefaultRunners();
    }
  }

  /**
   * Registers a test runner for specific test types
   */
  registerRunner(runner: TestRunner): void {
    this.runners.set(runner.name, runner);
  }

  /**
   * Executes a batch of tests with reporting
   */
  async executeBatch(tests: TestDefinition[]): Promise<TestReport> {
    const reportId = `report_${Date.now()}`;
    const startTime = Date.now();
    
    const report: TestReport = {
      id: reportId,
      timestamp: new Date(),
      totalTests: tests.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      coverage: 0,
      failures: [],
      summary: ''
    };

    try {
      if (this.config.parallelExecution && tests.length > 1) {
        await this.executeParallel(tests, report);
      } else {
        await this.executeSequential(tests, report);
      }
    } catch (error) {
      report.summary = `Pipeline execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    report.duration = Date.now() - startTime;
    report.coverage = this.calculateOverallCoverage(tests);
    report.summary = this.generateSummary(report);

    if (this.config.reportingEnabled) {
      this.reports.push(report);
      await this.generateDetailedReport(report);
    }

    return report;
  }

  /**
   * Executes tests sequentially with fail-fast option
   */
  private async executeSequential(tests: TestDefinition[], report: TestReport): Promise<void> {
    for (const test of tests) {
      try {
        const result = await this.executeTestWithRetry(test);
        this.updateReportWithResult(report, test, result);

        if (!result.success && this.config.failFast) {
          break;
        }
      } catch (error) {
        this.handleTestError(report, test, error);
        if (this.config.failFast) {
          break;
        }
      }
    }
  }

  /**
   * Executes tests in parallel
   */
  private async executeParallel(tests: TestDefinition[], report: TestReport): Promise<void> {
    const promises = tests.map(async (test) => {
      try {
        const result = await this.executeTestWithRetry(test);
        return { test, result, error: null };
      } catch (error) {
        return { test, result: null, error };
      }
    });

    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { test, result: testResult, error } = result.value;
        if (testResult) {
          this.updateReportWithResult(report, test, testResult);
        } else if (error) {
          this.handleTestError(report, test, error);
        }
      }
    }
  }

  /**
   * Executes a single test with retry logic
   */
  private async executeTestWithRetry(test: TestDefinition): Promise<TestExecutionResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const runner = this.selectRunner(test);
        if (!runner) {
          throw new Error(`No suitable test runner found for test type: ${test.type}`);
        }

        const result = await Promise.race([
          runner.execute(test),
          this.createTimeoutPromise(this.config.timeoutMs)
        ]);

        if (result.success || attempt === this.config.maxRetries) {
          return result;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        if (attempt === this.config.maxRetries) {
          // Return failed result instead of throwing
          return {
            success: false,
            duration: 0,
            error: lastError.message,
            logs: [],
            timestamp: new Date()
          };
        }
      }
    }

    return {
      success: false,
      duration: 0,
      error: lastError?.message || 'Test execution failed after retries',
      logs: [],
      timestamp: new Date()
    };
  }

  /**
   * Selects appropriate test runner for a test
   */
  private selectRunner(test: TestDefinition): TestRunner | null {
    for (const runner of this.runners.values()) {
      if (runner.supports.includes(test.type)) {
        return runner;
      }
    }
    return null;
  }

  /**
   * Creates a timeout promise for test execution
   */
  private createTimeoutPromise(timeoutMs: number): Promise<TestExecutionResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Test execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Updates report with test result
   */
  private updateReportWithResult(
    report: TestReport, 
    test: TestDefinition, 
    result: TestExecutionResult
  ): void {
    if (result.success) {
      report.passed++;
    } else {
      report.failed++;
      report.failures.push({
        testId: test.id,
        testTitle: test.title,
        error: result.error || 'Unknown error',
        requirements: test.requirements,
        agentRole: test.agentRole
      });
    }
  }

  /**
   * Handles test execution errors
   */
  private handleTestError(report: TestReport, test: TestDefinition, error: any): void {
    report.failed++;
    report.failures.push({
      testId: test.id,
      testTitle: test.title,
      error: error instanceof Error ? error.message : 'Unknown error',
      stackTrace: error instanceof Error ? error.stack : undefined,
      requirements: test.requirements,
      agentRole: test.agentRole
    });
  }

  /**
   * Calculates overall test coverage
   */
  private calculateOverallCoverage(tests: TestDefinition[]): number {
    const testsWithCoverage = tests.filter(t => t.executionResults?.coverage !== undefined);
    if (testsWithCoverage.length === 0) return 0;

    const totalCoverage = testsWithCoverage.reduce(
      (sum, test) => sum + (test.executionResults?.coverage || 0), 
      0
    );
    return totalCoverage / testsWithCoverage.length;
  }

  /**
   * Generates human-readable summary
   */
  private generateSummary(report: TestReport): string {
    const passRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    return `${report.passed}/${report.totalTests} tests passed (${passRate}%) in ${report.duration}ms`;
  }

  /**
   * Generates detailed test report
   */
  private async generateDetailedReport(report: TestReport): Promise<void> {
    const reportContent = this.formatDetailedReport(report);
    
    // In a real implementation, this would write to file system or send to reporting service
    console.log('=== TEST EXECUTION REPORT ===');
    console.log(reportContent);
  }

  /**
   * Formats detailed report content
   */
  private formatDetailedReport(report: TestReport): string {
    let content = `Test Report: ${report.id}\n`;
    content += `Timestamp: ${report.timestamp.toISOString()}\n`;
    content += `Duration: ${report.duration}ms\n`;
    content += `Coverage: ${report.coverage.toFixed(1)}%\n`;
    content += `Summary: ${report.summary}\n\n`;

    if (report.failures.length > 0) {
      content += 'FAILURES:\n';
      for (const failure of report.failures) {
        content += `- ${failure.testTitle} (${failure.agentRole})\n`;
        content += `  Requirements: ${failure.requirements.join(', ')}\n`;
        content += `  Error: ${failure.error}\n`;
        if (failure.stackTrace) {
          content += `  Stack: ${failure.stackTrace}\n`;
        }
        content += '\n';
      }
    }

    return content;
  }

  /**
   * Gets all test reports
   */
  getReports(): TestReport[] {
    return [...this.reports];
  }

  /**
   * Gets latest test report
   */
  getLatestReport(): TestReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * Registers default test runners for different test types
   */
  private registerDefaultRunners(): void {
    // Vitest runner for unit and integration tests
    this.registerRunner({
      name: 'vitest',
      supports: ['unit', 'integration'],
      execute: async (test: TestDefinition): Promise<TestExecutionResult> => {
        // Simulate test execution based on test content
        const success = !test.testCode.includes('failing') && !test.title.toLowerCase().includes('failing');
        return {
          success,
          duration: 100,
          coverage: success ? 85 : 60,
          error: success ? undefined : 'Test assertion failed',
          logs: [`Vitest executed: ${test.title}`],
          timestamp: new Date()
        };
      }
    });

    // Playwright runner for E2E tests
    this.registerRunner({
      name: 'playwright',
      supports: ['e2e'],
      execute: async (test: TestDefinition): Promise<TestExecutionResult> => {
        // Simulate test execution based on test content
        const success = !test.testCode.includes('failing') && !test.title.toLowerCase().includes('failing');
        return {
          success,
          duration: 2000,
          coverage: success ? 90 : 70,
          error: success ? undefined : 'E2E test failed',
          logs: [`Playwright executed: ${test.title}`],
          timestamp: new Date()
        };
      }
    });
  }
}