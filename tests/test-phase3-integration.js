#!/usr/bin/env node

/**
 * Phase 3 Integration Tests
 *
 * End-to-end tests for:
 * - Registry system with Life department
 * - Documentation generation
 * - Command routing verification
 * - File structure validation
 */

const fs = require('fs').promises;
const path = require('path');
const RegistryManager = require('../lib/registry-manager');
const DocGenerator = require('../lib/doc-generator');

class Phase3TestSuite {
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
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(value, message) {
    if (!value) {
      throw new Error(message || 'Expected true, got false');
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
  const suite = new Phase3TestSuite();
  let registry;

  console.log('Phase 3 Integration Tests');
  console.log('='.repeat(60) + '\n');

  // ========================================
  // REGISTRY TESTS
  // ========================================

  console.log('Registry Integration Tests\n');

  await suite.test('Registry: Load production registries', async () => {
    registry = new RegistryManager();
    await registry.load();
    suite.assertTrue(registry.loaded, 'Registries loaded');
  });

  await suite.test('Registry: Life department exists', async () => {
    const dept = registry.getDepartment('life');
    suite.assert(dept, 'Life department found');
    suite.assertEquals(dept.name, 'life', 'Department name correct');
  });

  await suite.test('Registry: Life department has agents', async () => {
    const dept = registry.getDepartment('life');
    suite.assertTrue(dept.agents.length > 0, 'Life has agents');
    suite.assertTrue(dept.agents.length >= 23, 'Life has at least 23 agents');
  });

  await suite.test('Registry: Life department has workflows', async () => {
    const dept = registry.getDepartment('life');
    suite.assertTrue(dept.workflows.length > 0, 'Life has workflows');
    suite.assertTrue(dept.workflows.includes('daily-brief'), 'Life has daily-brief workflow');
  });

  await suite.test('Registry: All Life agents exist in agents registry', async () => {
    const dept = registry.getDepartment('life');
    for (const agentName of dept.agents) {
      const agent = registry.getAgent(agentName);
      suite.assert(agent, `Agent ${agentName} exists in registry`);
      suite.assertEquals(agent.department, 'life', `Agent ${agentName} belongs to life`);
    }
  });

  await suite.test('Registry: All Life workflows exist in workflows registry', async () => {
    const dept = registry.getDepartment('life');
    for (const workflowName of dept.workflows) {
      const workflow = registry.getWorkflow('life', workflowName);
      suite.assert(workflow, `Workflow ${workflowName} exists in registry`);
      suite.assertEquals(workflow.department, 'life', `Workflow ${workflowName} belongs to life`);
    }
  });

  await suite.test('Registry: Statistics are correct', async () => {
    const stats = await registry.getStatistics();
    suite.assertEquals(stats.departments.total, 2, 'Should have 2 departments (life + system)');
    suite.assertTrue(stats.agents.total >= 27, 'Should have at least 27 agents');
    suite.assertEquals(stats.workflows.total, 4, 'Should have 4 workflows');
  });

  await suite.test('Registry: Validation passes', async () => {
    const validation = await registry.validate();
    suite.assertTrue(validation.valid, 'Registry validation should pass');
    suite.assertEquals(validation.errors.length, 0, 'Should have no validation errors');
  });

  await suite.test('Registry: Search works', async () => {
    const results = await registry.search('weather');
    suite.assertTrue(results.agents.length > 0, 'Should find weather agents');
  });

  await suite.test('Registry: List agents by department', async () => {
    const agents = await registry.listAgentsByDepartment('life');
    suite.assertTrue(agents.length >= 23, 'Should have at least 23 Life agents');
  });

  await suite.test('Registry: List workflows by department', async () => {
    const workflows = await registry.listWorkflowsByDepartment('life');
    suite.assertEquals(workflows.length, 4, 'Should have 4 Life workflows');
  });

  // ========================================
  // DOCUMENTATION GENERATION TESTS
  // ========================================

  console.log('\nDocumentation Generation Tests\n');

  await suite.test('DocGen: Generate all documentation', async () => {
    const generator = new DocGenerator();
    await generator.generate();
    suite.assert(true, 'Documentation generated without errors');
  });

  await suite.test('DocGen: COMMANDS_REFERENCE.md exists', async () => {
    const referencePath = path.join(__dirname, '..', 'org-docs', 'COMMANDS_REFERENCE.md');
    const stats = await fs.stat(referencePath);
    suite.assertTrue(stats.isFile(), 'COMMANDS_REFERENCE.md created');
  });

  await suite.test('DocGen: Life department doc exists', async () => {
    const deptDocPath = path.join(__dirname, '..', 'org-docs', 'departments', 'life-department.md');
    const stats = await fs.stat(deptDocPath);
    suite.assertTrue(stats.isFile(), 'life-department.md created');
  });

  await suite.test('DocGen: COMMANDS_REFERENCE contains Life department', async () => {
    const referencePath = path.join(__dirname, '..', 'org-docs', 'COMMANDS_REFERENCE.md');
    const content = await fs.readFile(referencePath, 'utf8');
    suite.assertTrue(content.includes('Life Department'), 'Reference includes Life Department');
    suite.assertTrue(content.includes('daily-brief'), 'Reference includes daily-brief');
  });

  await suite.test('DocGen: Life department doc has agents section', async () => {
    const deptDocPath = path.join(__dirname, '..', 'org-docs', 'departments', 'life-department.md');
    const content = await fs.readFile(deptDocPath, 'utf8');
    suite.assertTrue(content.includes('## Agents'), 'Includes Agents section');
    suite.assertTrue(content.includes('weather-fetcher'), 'Includes weather-fetcher agent');
  });

  await suite.test('DocGen: Life department doc has workflows section', async () => {
    const deptDocPath = path.join(__dirname, '..', 'org-docs', 'departments', 'life-department.md');
    const content = await fs.readFile(deptDocPath, 'utf8');
    suite.assertTrue(content.includes('## Workflows'), 'Includes Workflows section');
    suite.assertTrue(content.includes('daily-brief'), 'Includes daily-brief workflow');
  });

  // ========================================
  // FILE STRUCTURE TESTS
  // ========================================

  console.log('\nFile Structure Tests\n');

  await suite.test('Structure: config/registries/ exists', async () => {
    const registriesPath = path.join(__dirname, '..', 'config', 'registries');
    const stats = await fs.stat(registriesPath);
    suite.assertTrue(stats.isDirectory(), 'Registries directory exists');
  });

  await suite.test('Structure: All registry files exist', async () => {
    const basePath = path.join(__dirname, '..', 'config', 'registries');
    const files = ['departments.json', 'agents.json', 'workflows.json'];

    for (const file of files) {
      const filePath = path.join(basePath, file);
      const stats = await fs.stat(filePath);
      suite.assertTrue(stats.isFile(), `${file} exists`);
    }
  });

  await suite.test('Structure: org-docs/ directory exists', async () => {
    const docsPath = path.join(__dirname, '..', 'org-docs');
    const stats = await fs.stat(docsPath);
    suite.assertTrue(stats.isDirectory(), 'org-docs directory exists');
  });

  await suite.test('Structure: org-docs/departments/ exists', async () => {
    const deptDocsPath = path.join(__dirname, '..', 'org-docs', 'departments');
    const stats = await fs.stat(deptDocsPath);
    suite.assertTrue(stats.isDirectory(), 'departments directory exists');
  });

  await suite.test('Structure: lib/ contains all Phase 2 libraries', async () => {
    const libPath = path.join(__dirname, '..', 'lib');
    const requiredLibs = ['template-engine.js', 'registry-manager.js', 'validator.js', 'doc-generator.js'];

    for (const lib of requiredLibs) {
      const libFile = path.join(libPath, lib);
      const stats = await fs.stat(libFile);
      suite.assertTrue(stats.isFile(), `${lib} exists`);
    }
  });

  await suite.test('Structure: Creator agents exist', async () => {
    const agentsPath = path.join(__dirname, '..', '.claude', 'agents');
    const creators = [
      'department-creator.md',
      'agent-creator.md',
      'workflow-creator.md',
      'documentation-updater.md'
    ];

    for (const creator of creators) {
      const creatorPath = path.join(agentsPath, creator);
      const stats = await fs.stat(creatorPath);
      suite.assertTrue(stats.isFile(), `${creator} exists`);
    }
  });

  // ========================================
  // AGENT TYPE DISTRIBUTION TESTS
  // ========================================

  console.log('\nAgent Type Distribution Tests\n');

  await suite.test('Agents: Has data-fetchers', async () => {
    const agents = await registry.listAgents({ type: 'data-fetcher' });
    suite.assertTrue(agents.length > 0, 'Has data-fetcher agents');
    const hasWeather = agents.some(a => a.name === 'weather-fetcher');
    suite.assertTrue(hasWeather, 'Has weather-fetcher');
  });

  await suite.test('Agents: Has orchestrators', async () => {
    const agents = await registry.listAgents({ type: 'orchestrator' });
    suite.assertTrue(agents.length > 0, 'Has orchestrator agents');
    const hasDailyBrief = agents.some(a => a.name === 'daily-brief-orchestrator');
    suite.assertTrue(hasDailyBrief, 'Has daily-brief-orchestrator');
  });

  await suite.test('Agents: Has specialists', async () => {
    const agents = await registry.listAgents({ type: 'specialist' });
    suite.assertTrue(agents.length > 0, 'Has specialist agents');
    const hasInsight = agents.some(a => a.name === 'insight-generator');
    suite.assertTrue(hasInsight, 'Has insight-generator');
  });

  // ========================================
  // WORKFLOW STRUCTURE TESTS
  // ========================================

  console.log('\nWorkflow Structure Tests\n');

  await suite.test('Workflow: daily-brief has correct structure', async () => {
    const workflow = registry.getWorkflow('life', 'daily-brief');
    suite.assert(workflow, 'daily-brief workflow exists');
    suite.assertTrue(workflow.steps.length > 0, 'Has steps');
    suite.assertTrue(workflow.steps[0].parallel, 'First step is parallel');
    suite.assertTrue(workflow.agents.length >= 6, 'Has at least 6 agents');
  });

  await suite.test('Workflow: evening-report has correct structure', async () => {
    const workflow = registry.getWorkflow('life', 'evening-report');
    suite.assert(workflow, 'evening-report workflow exists');
    suite.assertTrue(workflow.steps.length > 0, 'Has steps');
    suite.assertEquals(workflow.trigger.type, 'manual', 'Is manual trigger');
  });

  // Print summary
  suite.summary();
}

// Run all tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
