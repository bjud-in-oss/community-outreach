/**
 * Tests for Agent Test Generators
 * 
 * Validates the test generation capabilities for Coordinator and Core agents.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  CoordinatorTestGenerator, 
  CoreTestGenerator, 
  TestTemplateLibrary,
  TestGenerationContext 
} from '../../lib/testing/agent-test-generators';

describe('CoordinatorTestGenerator', () => {
  let generator: CoordinatorTestGenerator;
  let context: TestGenerationContext;

  beforeEach(() => {
    generator = new CoordinatorTestGenerator();
    context = {
      requirements: ['REQ-1.1', 'REQ-1.2'],
      userStory: 'As a user, I want to login securely, so that I can access my account',
      acceptanceCriteria: [
        'WHEN user enters valid credentials THEN system SHALL authenticate successfully',
        'WHEN user enters invalid credentials THEN system SHALL reject with error message'
      ],
      technicalSpecs: ['Use JWT tokens', 'Implement rate limiting'],
      dependencies: ['AuthService', 'UserRepository']
    };
  });

  describe('E2E Test Generation', () => {
    it('should generate E2E test with proper structure', () => {
      const test = generator.generateE2ETest(
        'User Authentication',
        context,
        'coordinator-agent-1'
      );

      expect(test.type).toBe('e2e');
      expect(test.title).toBe('E2E: User Authentication');
      expect(test.agentRole).toBe('Coordinator');
      expect(test.requirements).toEqual(context.requirements);
      expect(test.createdBy).toBe('coordinator-agent-1');
      expect(test.status).toBe('pending');
      expect(test.testCode).toContain('import { test, expect } from \'@playwright/test\'');
      expect(test.testCode).toContain('User Authentication');
    });

    it('should include user story in test description', () => {
      const test = generator.generateE2ETest(
        'Login Feature',
        context,
        'coordinator-1'
      );

      expect(test.description).toContain(context.userStory);
    });

    it('should generate test code with Given-When-Then structure', () => {
      const test = generator.generateE2ETest(
        'Authentication Flow',
        context,
        'coordinator-1'
      );

      expect(test.testCode).toContain('// Given:');
      expect(test.testCode).toContain('// When:');
      expect(test.testCode).toContain('// Then:');
      expect(test.testCode).toContain('// Requirements validation:');
    });

    it('should include all acceptance criteria in test code', () => {
      const test = generator.generateE2ETest(
        'Login System',
        context,
        'coordinator-1'
      );

      context.acceptanceCriteria.forEach(criteria => {
        expect(test.testCode).toContain(criteria);
      });
    });
  });

  describe('Integration Test Generation', () => {
    it('should generate integration test for component interaction', () => {
      const test = generator.generateIntegrationTest(
        'AuthService',
        'UserRepository',
        'user authentication with database lookup',
        context,
        'coordinator-1'
      );

      expect(test.type).toBe('integration');
      expect(test.title).toBe('Integration: AuthService <-> UserRepository');
      expect(test.description).toBe('Integration test for: user authentication with database lookup');
      expect(test.agentRole).toBe('Coordinator');
      expect(test.testCode).toContain('AuthService');
      expect(test.testCode).toContain('UserRepository');
      expect(test.testCode).toContain('Integration');
    });

    it('should include both components in test code', () => {
      const test = generator.generateIntegrationTest(
        'PaymentService',
        'OrderService',
        'payment processing workflow',
        context,
        'coordinator-1'
      );

      expect(test.testCode).toContain('import { PaymentService }');
      expect(test.testCode).toContain('import { OrderService }');
      expect(test.testCode).toContain('paymentService');
      expect(test.testCode).toContain('orderService');
    });
  });
});

describe('CoreTestGenerator', () => {
  let generator: CoreTestGenerator;
  let context: TestGenerationContext;

  beforeEach(() => {
    generator = new CoreTestGenerator();
    context = {
      requirements: ['REQ-2.1', 'REQ-2.2'],
      userStory: 'As a developer, I want reliable validation, so that data integrity is maintained',
      acceptanceCriteria: [
        'WHEN valid input is provided THEN validation SHALL pass',
        'WHEN invalid input is provided THEN validation SHALL fail with specific error'
      ]
    };
  });

  describe('Unit Test Generation', () => {
    it('should generate unit test with proper structure', () => {
      const test = generator.generateUnitTest(
        'ValidationService',
        'validateEmail',
        context,
        'core-agent-1'
      );

      expect(test.type).toBe('unit');
      expect(test.title).toBe('Unit: ValidationService.validateEmail');
      expect(test.agentRole).toBe('Core');
      expect(test.requirements).toEqual(context.requirements);
      expect(test.createdBy).toBe('core-agent-1');
      expect(test.testCode).toContain('ValidationService');
      expect(test.testCode).toContain('validateEmail');
    });

    it('should include test cases for each acceptance criteria', () => {
      const test = generator.generateUnitTest(
        'UserValidator',
        'validate',
        context,
        'core-agent-1'
      );

      expect(test.testCode).toContain('should validate with');
      expect(test.testCode).toContain('testInput0');
      expect(test.testCode).toContain('testInput1');
      expect(test.testCode).toContain('expectedOutput0');
      expect(test.testCode).toContain('expectedOutput1');
    });

    it('should include error handling tests', () => {
      const test = generator.generateUnitTest(
        'Calculator',
        'divide',
        context,
        'core-agent-1'
      );

      expect(test.testCode).toContain('should handle edge cases and errors');
      expect(test.testCode).toContain('toThrow()');
      expect(test.testCode).toContain('null');
      expect(test.testCode).toContain('undefined');
    });
  });

  describe('Task Integration Test Generation', () => {
    it('should generate task integration test', () => {
      const test = generator.generateTaskIntegrationTest(
        'User Registration',
        ['UserService', 'EmailService', 'DatabaseService'],
        context,
        'core-agent-1'
      );

      expect(test.type).toBe('integration');
      expect(test.title).toBe('Task Integration: User Registration');
      expect(test.agentRole).toBe('Core');
      expect(test.testCode).toContain('User Registration Task Integration');
      expect(test.testCode).toContain('UserService');
      expect(test.testCode).toContain('EmailService');
      expect(test.testCode).toContain('DatabaseService');
    });

    it('should include all dependencies in imports', () => {
      const dependencies = ['AuthService', 'LoggingService'];
      const test = generator.generateTaskIntegrationTest(
        'Login Task',
        dependencies,
        context,
        'core-agent-1'
      );

      dependencies.forEach(dep => {
        expect(test.testCode).toContain(`import { ${dep} }`);
        expect(test.testCode).toContain(`let ${dep.toLowerCase()}: ${dep};`);
        expect(test.testCode).toContain(`${dep.toLowerCase()} = new ${dep}();`);
      });
    });

    it('should include failure handling test', () => {
      const test = generator.generateTaskIntegrationTest(
        'Data Processing',
        ['DataService'],
        context,
        'core-agent-1'
      );

      expect(test.testCode).toContain('should handle task failures gracefully');
    });
  });

  describe('Property-Based Test Generation', () => {
    it('should generate property-based test', () => {
      const test = generator.generatePropertyBasedTest(
        'MathUtils',
        'commutativeProperty',
        context,
        'core-agent-1'
      );

      expect(test.type).toBe('unit');
      expect(test.title).toBe('Property: MathUtils.commutativeProperty');
      expect(test.testCode).toContain('Property-based testing');
      expect(test.testCode).toContain('for (let i = 0; i < 100; i++)');
      expect(test.testCode).toContain('generateRandomInput');
      expect(test.testCode).toContain('verifyProperty');
    });

    it('should include property verification logic', () => {
      const test = generator.generatePropertyBasedTest(
        'StringUtils',
        'reversibility',
        context,
        'core-agent-1'
      );

      expect(test.testCode).toContain('should maintain reversibility invariant');
      expect(test.testCode).toContain('function generateRandomInput()');
      expect(test.testCode).toContain('function verifyProperty(result: any): boolean');
    });
  });
});

describe('TestTemplateLibrary', () => {
  let library: TestTemplateLibrary;

  beforeEach(() => {
    library = new TestTemplateLibrary();
  });

  describe('Cognitive Agent Template', () => {
    it('should provide cognitive agent test template', () => {
      const template = library.getCognitiveAgentTemplate();

      expect(template).toContain('CognitiveAgent');
      expect(template).toContain('Roundabout cognitive loop');
      expect(template).toContain('cloning and delegation');
      expect(template).toContain('EMERGE');
      expect(template).toContain('ADAPT');
      expect(template).toContain('INTEGRATE');
    });

    it('should include proper test structure', () => {
      const template = library.getCognitiveAgentTemplate();

      expect(template).toContain('describe(');
      expect(template).toContain('beforeEach(');
      expect(template).toContain('it(');
      expect(template).toContain('expect(');
    });
  });

  describe('Memory System Template', () => {
    it('should provide memory system test template', () => {
      const template = library.getMemorySystemTemplate();

      expect(template).toContain('MemoryAssistant');
      expect(template).toContain('memory scope restrictions');
      expect(template).toContain('concurrent access with OCC');
      expect(template).toContain('optimistic concurrency control');
    });
  });

  describe('UI Component Template', () => {
    it('should provide UI component test template', () => {
      const template = library.getUIComponentTemplate();

      expect(template).toContain('@testing-library/react');
      expect(template).toContain('render');
      expect(template).toContain('screen');
      expect(template).toContain('fireEvent');
      expect(template).toContain('should render correctly');
      expect(template).toContain('should handle user interactions');
    });

    it('should include React testing patterns', () => {
      const template = library.getUIComponentTemplate();

      expect(template).toContain('render(<ComponentName />)');
      expect(template).toContain('screen.getByRole');
      expect(template).toContain('toBeInTheDocument');
      expect(template).toContain('fireEvent.click');
    });
  });
});

describe('Test Generation Integration', () => {
  it('should generate complete test suite for a feature', () => {
    const coordinatorGenerator = new CoordinatorTestGenerator();
    const coreGenerator = new CoreTestGenerator();

    const context: TestGenerationContext = {
      requirements: ['REQ-3.1', 'REQ-3.2', 'REQ-3.3'],
      userStory: 'As a user, I want to manage my profile, so that my information is up to date',
      acceptanceCriteria: [
        'WHEN user updates profile THEN changes SHALL be saved',
        'WHEN user cancels edit THEN changes SHALL be discarded',
        'WHEN invalid data is entered THEN validation errors SHALL be shown'
      ]
    };

    // Generate E2E test (Coordinator responsibility)
    const e2eTest = coordinatorGenerator.generateE2ETest(
      'Profile Management',
      context,
      'coordinator-1'
    );

    // Generate integration test (Coordinator responsibility)
    const integrationTest = coordinatorGenerator.generateIntegrationTest(
      'ProfileService',
      'ValidationService',
      'profile update with validation',
      context,
      'coordinator-1'
    );

    // Generate unit tests (Core responsibility)
    const unitTest1 = coreGenerator.generateUnitTest(
      'ProfileService',
      'updateProfile',
      context,
      'core-1'
    );

    const unitTest2 = coreGenerator.generateUnitTest(
      'ValidationService',
      'validateProfile',
      context,
      'core-2'
    );

    // Verify all tests are properly structured
    expect(e2eTest.type).toBe('e2e');
    expect(e2eTest.agentRole).toBe('Coordinator');
    
    expect(integrationTest.type).toBe('integration');
    expect(integrationTest.agentRole).toBe('Coordinator');
    
    expect(unitTest1.type).toBe('unit');
    expect(unitTest1.agentRole).toBe('Core');
    
    expect(unitTest2.type).toBe('unit');
    expect(unitTest2.agentRole).toBe('Core');

    // All tests should reference the same requirements
    [e2eTest, integrationTest, unitTest1, unitTest2].forEach(test => {
      expect(test.requirements).toEqual(context.requirements);
    });
  });
});