#!/usr/bin/env node

/**
 * Error Handling & Edge Case Tests
 *
 * Tests for:
 * - Actionable error messages on missing fields
 * - Department-not-found includes available departments
 * - Duplicate detection
 * - Unloaded registry guard
 * - Template engine error paths
 * - Validator edge cases
 */

const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');
const TemplateEngine = require('../lib/template-engine');
const fs = require('fs').promises;
const path = require('path');

class TestSuite {
  constructor() {
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.tests = [];
  }

  async test(name, fn) {
    this.testCount++;
    try {
      await fn();
      this.passCount++;
      console.log(`✓ ${name}`);
      this.tests.push({ name, passed: true });
    } catch (error) {
      this.failCount++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      this.tests.push({ name, passed: false, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
  }

  assertThrows(fn, expectedSubstring, message) {
    let threw = false;
    let actualMessage = '';
    try {
      fn();
    } catch (e) {
      threw = true;
      actualMessage = e.message;
    }
    if (!threw) throw new Error(message || 'Expected function to throw');
    if (expectedSubstring && !actualMessage.includes(expectedSubstring)) {
      throw new Error(`Expected error to contain "${expectedSubstring}", got: "${actualMessage}"`);
    }
  }

  async assertThrowsAsync(fn, expectedSubstring, message) {
    let threw = false;
    let actualMessage = '';
    try {
      await fn();
    } catch (e) {
      threw = true;
      actualMessage = e.message;
    }
    if (!threw) throw new Error(message || 'Expected function to throw');
    if (expectedSubstring && !actualMessage.includes(expectedSubstring)) {
      throw new Error(`Expected error to contain "${expectedSubstring}", got: "${actualMessage}"`);
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.testCount}`);
    console.log(`Passed: ${this.passCount} ✓`);
    console.log(`Failed: ${this.failCount} ✗`);
    console.log('='.repeat(60));

    if (this.failCount > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }
}

async function runTests() {
  const suite = new TestSuite();

  console.log('Error Handling & Edge Case Tests');
  console.log('='.repeat(60));
  console.log();

  // --- Registry Manager Error Messages ---
  console.log('Registry Manager Error Messages\n');

  const testDir = path.join(__dirname, '..', 'test-error-registries');
  await fs.mkdir(testDir, { recursive: true });

  const registry = new RegistryManager(testDir);
  await registry.load();

  await suite.test('addDepartment: missing name shows which fields are missing', async () => {
    await suite.assertThrowsAsync(
      () => registry.addDepartment({ displayName: 'Test', description: 'test' }),
      'name',
      'Should mention missing "name" field'
    );
  });

  await suite.test('addDepartment: missing multiple fields lists all of them', async () => {
    await suite.assertThrowsAsync(
      () => registry.addDepartment({}),
      'name, displayName, description',
      'Should list all missing fields'
    );
  });

  await suite.test('addDepartment: error includes usage hint', async () => {
    await suite.assertThrowsAsync(
      () => registry.addDepartment({}),
      'addDepartment()',
      'Should include method name in hint'
    );
  });

  await suite.test('addDepartment: duplicate department gives clear error', async () => {
    await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'test department' });
    await suite.assertThrowsAsync(
      () => registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'test department' }),
      "already exists",
      'Should say department already exists'
    );
  });

  await suite.test('addAgent: missing fields lists exactly which ones', async () => {
    await suite.assertThrowsAsync(
      () => registry.addAgent({ name: 'my-agent' }),
      'displayName, department, type, description',
      'Should list all missing fields'
    );
  });

  await suite.test('addAgent: error includes usage hint', async () => {
    await suite.assertThrowsAsync(
      () => registry.addAgent({}),
      'addAgent()',
      'Should include method name in hint'
    );
  });

  await suite.test('addAgent: non-existent department lists available ones', async () => {
    await suite.assertThrowsAsync(
      () => registry.addAgent({
        name: 'my-agent',
        displayName: 'My Agent',
        department: 'nonexistent',
        type: 'data-fetcher',
        description: 'test agent'
      }),
      'test-dept',
      'Should list available departments'
    );
  });

  await suite.test('addWorkflow: missing fields lists exactly which ones', async () => {
    await suite.assertThrowsAsync(
      () => registry.addWorkflow({ name: 'my-wf', department: 'test-dept' }),
      'displayName, description',
      'Should list missing fields'
    );
  });

  await suite.test('addWorkflow: non-existent department lists available ones', async () => {
    await suite.assertThrowsAsync(
      () => registry.addWorkflow({
        name: 'my-wf',
        displayName: 'My Workflow',
        department: 'nonexistent',
        description: 'test workflow'
      }),
      'test-dept',
      'Should list available departments'
    );
  });

  // --- Unloaded Registry Guard ---
  console.log('\nUnloaded Registry Guard\n');

  await suite.test('ensureLoaded: error tells you how to fix it', () => {
    const freshRegistry = new RegistryManager(testDir);
    suite.assertThrows(
      () => freshRegistry.ensureLoaded(),
      'await registry.load()',
      'Should tell user to call load()'
    );
  });

  // --- Template Engine Error Paths ---
  console.log('\nTemplate Engine Error Paths\n');

  const engine = new TemplateEngine();

  await suite.test('render: non-existent template gives helpful error', async () => {
    await suite.assertThrowsAsync(
      () => engine.render('nonexistent/template.md', {}),
      'templates/ directory',
      'Should suggest checking templates directory'
    );
  });

  // --- Validator Edge Cases ---
  console.log('\nValidator Edge Cases\n');

  const validator = new Validator();

  await suite.test('validateDepartmentName: empty string is invalid', () => {
    const result = validator.validateDepartmentName('');
    suite.assert(!result.valid, 'Empty string should be invalid');
  });

  await suite.test('validateDepartmentName: null is invalid', () => {
    const result = validator.validateDepartmentName(null);
    suite.assert(!result.valid, 'null should be invalid');
  });

  await suite.test('validateDepartmentName: number is invalid', () => {
    const result = validator.validateDepartmentName(123);
    suite.assert(!result.valid, 'Number should be invalid');
  });

  await suite.test('validateAgentName: uppercase rejected with kebab-case hint', () => {
    const result = validator.validateAgentName('MyAgent');
    suite.assert(!result.valid, 'Uppercase should be invalid');
    suite.assert(result.errors.some(e => e.includes('kebab-case')), 'Should mention kebab-case format');
  });

  await suite.test('validateAgentName: spaces rejected with suggestion', () => {
    const result = validator.validateAgentName('my agent');
    suite.assert(!result.valid, 'Spaces should be invalid');
  });

  await suite.test('validateAgentName: too short rejected', () => {
    const result = validator.validateAgentName('ab');
    suite.assert(!result.valid, 'Two-char name should be invalid');
  });

  await suite.test('detectAgentType: fetcher detected from description', () => {
    const result = validator.detectAgentType('Fetches data from the weather API endpoint');
    suite.assert(result.type === 'data-fetcher', `Should detect data-fetcher, got ${result.type}`);
  });

  await suite.test('detectAgentType: orchestrator detected from description', () => {
    const result = validator.detectAgentType('Orchestrates and coordinates multiple agents in parallel workflow steps');
    suite.assert(result.type === 'orchestrator', `Should detect orchestrator, got ${result.type}`);
  });

  await suite.test('detectAgentType: specialist detected from description', () => {
    const result = validator.detectAgentType('Analyzes sentiment and generates detailed content reports');
    suite.assert(result.type === 'specialist', `Should detect specialist, got ${result.type}`);
  });

  // --- Cleanup ---
  await suite.test('Cleanup: Remove test registries', async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('  Test registries cleaned up');
  });

  suite.summary();
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
