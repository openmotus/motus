#!/usr/bin/env node

/**
 * Phase 2 Component Tests
 *
 * Tests for:
 * - RegistryManager (CRUD operations, validation, statistics)
 * - Validator (name validation, type detection, context validation)
 * - Integration between components
 */

const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');
const fs = require('fs').promises;
const path = require('path');

class Phase2TestSuite {
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

  assertFalse(value, message) {
    if (value) {
      throw new Error(message || 'Expected false, got true');
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
  const suite = new Phase2TestSuite();
  let registry, validator;

  console.log('Phase 2 Component Tests');
  console.log('='.repeat(60) + '\n');

  // ========================================
  // VALIDATOR TESTS
  // ========================================

  console.log('Validator Tests\n');

  await suite.test('Validator: Create instance', async () => {
    validator = new Validator();
    suite.assert(validator, 'Validator instance created');
  });

  await suite.test('Validator: Valid department name', async () => {
    const result = validator.validateDepartmentName('marketing');
    suite.assertTrue(result.valid, 'marketing should be valid');
  });

  await suite.test('Validator: Invalid department name (uppercase)', async () => {
    const result = validator.validateDepartmentName('Marketing');
    suite.assertFalse(result.valid, 'Marketing should be invalid');
  });

  await suite.test('Validator: Invalid department name (too short)', async () => {
    const result = validator.validateDepartmentName('ab');
    suite.assertFalse(result.valid, 'ab should be invalid');
  });

  await suite.test('Validator: Valid agent name', async () => {
    const result = validator.validateAgentName('trend-analyzer');
    suite.assertTrue(result.valid, 'trend-analyzer should be valid');
  });

  await suite.test('Validator: Invalid agent name (single word)', async () => {
    const result = validator.validateAgentName('analyzer');
    suite.assertFalse(result.valid, 'analyzer should be invalid (no action-noun)');
  });

  await suite.test('Validator: Detect agent type (data-fetcher)', async () => {
    const result = validator.detectAgentType('Fetches trending topics from Twitter API');
    suite.assertEquals(result.type, 'data-fetcher', 'Should detect data-fetcher');
  });

  await suite.test('Validator: Detect agent type (orchestrator)', async () => {
    const result = validator.detectAgentType('Orchestrates multiple agents to generate daily report');
    suite.assertEquals(result.type, 'orchestrator', 'Should detect orchestrator');
  });

  await suite.test('Validator: Detect agent type (specialist)', async () => {
    const result = validator.detectAgentType('Analyzes sentiment and generates insights');
    suite.assertEquals(result.type, 'specialist', 'Should detect specialist');
  });

  await suite.test('Validator: Detect parallel execution', async () => {
    const result = validator.detectParallelExecution('Fetch weather and calendar data');
    suite.assertTrue(result.shouldBeParallel, 'Should detect parallel execution');
  });

  await suite.test('Validator: Valid schedule format (daily)', async () => {
    const result = validator.validateSchedule('daily 9:00');
    suite.assertTrue(result.valid, 'daily 9:00 should be valid');
  });

  await suite.test('Validator: Valid schedule format (weekly)', async () => {
    const result = validator.validateSchedule('weekly monday 10:00');
    suite.assertTrue(result.valid, 'weekly monday 10:00 should be valid');
  });

  await suite.test('Validator: Invalid schedule format', async () => {
    const result = validator.validateSchedule('whenever');
    suite.assertFalse(result.valid, 'whenever should be invalid');
  });

  await suite.test('Validator: Valid environment variable name', async () => {
    const result = validator.validateEnvVarName('TWITTER_API_KEY');
    suite.assertTrue(result.valid, 'TWITTER_API_KEY should be valid');
  });

  await suite.test('Validator: Invalid environment variable name', async () => {
    const result = validator.validateEnvVarName('twitter-api-key');
    suite.assertFalse(result.valid, 'twitter-api-key should be invalid');
  });

  await suite.test('Validator: Valid URL', async () => {
    const result = validator.validateUrl('https://api.twitter.com/v1');
    suite.assertTrue(result.valid, 'https://api.twitter.com/v1 should be valid');
  });

  await suite.test('Validator: Invalid URL', async () => {
    const result = validator.validateUrl('not-a-url');
    suite.assertFalse(result.valid, 'not-a-url should be invalid');
  });

  await suite.test('Validator: Validate agent context (valid)', async () => {
    const context = {
      name: 'trend-analyzer',
      description: 'Analyzes trending topics from Twitter API',
      department: 'marketing',
      type: 'data-fetcher',
      tools: ['Bash', 'Read']
    };
    const result = validator.validateAgentContext(context);
    suite.assertTrue(result.valid, 'Valid agent context should pass');
  });

  await suite.test('Validator: Validate agent context (missing fields)', async () => {
    const context = {
      name: 'trend-analyzer'
    };
    const result = validator.validateAgentContext(context);
    suite.assertFalse(result.valid, 'Incomplete agent context should fail');
    suite.assertTrue(result.errors.length > 0, 'Should have error messages');
  });

  await suite.test('Validator: Suggest tools for data-fetcher', async () => {
    const tools = validator.suggestTools('data-fetcher', true);
    suite.assertTrue(tools.includes('Bash'), 'Should suggest Bash for API calls');
  });

  await suite.test('Validator: Suggest environment variable name', async () => {
    const envVar = validator.suggestEnvVarName('marketing', 'twitter-api');
    suite.assertEquals(envVar, 'MARKETING_TWITTER_API_KEY', 'Should format correctly');
  });

  // ========================================
  // REGISTRY MANAGER TESTS
  // ========================================

  console.log('\nRegistry Manager Tests\n');

  await suite.test('RegistryManager: Create instance', async () => {
    const testDir = path.join(__dirname, '..', 'test-registries');
    registry = new RegistryManager(testDir);
    suite.assert(registry, 'RegistryManager instance created');
  });

  await suite.test('RegistryManager: Initialize/Load empty registries', async () => {
    await registry.load();
    suite.assertTrue(registry.loaded, 'Registries loaded');
  });

  await suite.test('RegistryManager: Add department', async () => {
    const dept = await registry.addDepartment({
      name: 'marketing',
      displayName: 'Marketing Department',
      description: 'Social media marketing and content creation',
      integrations: [
        {
          name: 'Twitter API',
          type: 'api-key',
          envVars: ['TWITTER_API_KEY']
        }
      ]
    });

    suite.assert(dept, 'Department created');
    suite.assertEquals(dept.name, 'marketing', 'Department name correct');
  });

  await suite.test('RegistryManager: Department exists check', async () => {
    suite.assertTrue(registry.departmentExists('marketing'), 'marketing should exist');
    suite.assertFalse(registry.departmentExists('finance'), 'finance should not exist');
  });

  await suite.test('RegistryManager: Get department', async () => {
    const dept = registry.getDepartment('marketing');
    suite.assert(dept, 'Department retrieved');
    suite.assertEquals(dept.displayName, 'Marketing Department', 'Display name correct');
  });

  await suite.test('RegistryManager: Add agent', async () => {
    const agent = await registry.addAgent({
      name: 'trend-analyzer',
      displayName: 'Trend Analyzer',
      department: 'marketing',
      type: 'data-fetcher',
      description: 'Analyzes trending topics from Twitter API',
      tools: ['Bash', 'Read']
    });

    suite.assert(agent, 'Agent created');
    suite.assertEquals(agent.name, 'trend-analyzer', 'Agent name correct');
  });

  await suite.test('RegistryManager: Agent added to department', async () => {
    const dept = registry.getDepartment('marketing');
    suite.assertTrue(dept.agents.includes('trend-analyzer'), 'Agent should be in department');
  });

  await suite.test('RegistryManager: Agent exists check', async () => {
    suite.assertTrue(registry.agentExists('trend-analyzer'), 'trend-analyzer should exist');
    suite.assertFalse(registry.agentExists('fake-agent'), 'fake-agent should not exist');
  });

  await suite.test('RegistryManager: List agents by department', async () => {
    const agents = await registry.listAgentsByDepartment('marketing');
    suite.assertEquals(agents.length, 1, 'Should have 1 agent');
    suite.assertEquals(agents[0].name, 'trend-analyzer', 'Agent name correct');
  });

  await suite.test('RegistryManager: Add another agent', async () => {
    await registry.addAgent({
      name: 'sentiment-analyzer',
      displayName: 'Sentiment Analyzer',
      department: 'marketing',
      type: 'specialist',
      description: 'Analyzes sentiment of social media mentions',
      tools: ['Read', 'Write', 'Task']
    });

    const agents = await registry.listAgentsByDepartment('marketing');
    suite.assertEquals(agents.length, 2, 'Should have 2 agents');
  });

  await suite.test('RegistryManager: Add workflow', async () => {
    const workflow = await registry.addWorkflow({
      name: 'daily-trends',
      displayName: 'Daily Trends Analysis',
      department: 'marketing',
      description: 'Analyze daily trending topics and sentiment',
      agents: ['trend-analyzer', 'sentiment-analyzer'],
      trigger: {
        type: 'scheduled',
        schedule: 'daily 9:00',
        timezone: 'Asia/Bangkok',
        enabled: true
      },
      output: {
        type: 'obsidian-note',
        destination: 'Daily/{{date}}.md'
      },
      estimatedDuration: '10 seconds'
    });

    suite.assert(workflow, 'Workflow created');
    suite.assertEquals(workflow.name, 'daily-trends', 'Workflow name correct');
  });

  await suite.test('RegistryManager: Workflow added to department', async () => {
    const dept = registry.getDepartment('marketing');
    suite.assertTrue(dept.workflows.includes('daily-trends'), 'Workflow should be in department');
  });

  await suite.test('RegistryManager: Workflow exists check', async () => {
    suite.assertTrue(registry.workflowExists('marketing', 'daily-trends'), 'daily-trends should exist');
    suite.assertFalse(registry.workflowExists('marketing', 'fake-workflow'), 'fake-workflow should not exist');
  });

  await suite.test('RegistryManager: Agent workflow tracking updated', async () => {
    const agent = registry.getAgent('trend-analyzer');
    suite.assertTrue(agent.usedInWorkflows.includes('daily-trends'), 'Agent should track workflow usage');
  });

  await suite.test('RegistryManager: Get statistics', async () => {
    const stats = await registry.getStatistics();
    suite.assertEquals(stats.departments.total, 1, 'Should have 1 department');
    suite.assertEquals(stats.agents.total, 2, 'Should have 2 agents');
    suite.assertEquals(stats.workflows.total, 1, 'Should have 1 workflow');
  });

  await suite.test('RegistryManager: Validate registries', async () => {
    const validation = await registry.validate();
    suite.assertTrue(validation.valid, 'Registries should be valid');
    suite.assertEquals(validation.errors.length, 0, 'Should have no errors');
  });

  await suite.test('RegistryManager: Search registries', async () => {
    const results = await registry.search('trend');
    suite.assertTrue(results.agents.length > 0, 'Should find trend-analyzer');
    suite.assertTrue(results.workflows.length > 0, 'Should find daily-trends workflow');
  });

  await suite.test('RegistryManager: Update department', async () => {
    await registry.updateDepartment('marketing', {
      description: 'Updated description for marketing'
    });

    const dept = registry.getDepartment('marketing');
    suite.assertEquals(dept.description, 'Updated description for marketing', 'Description updated');
  });

  await suite.test('RegistryManager: Update agent', async () => {
    await registry.updateAgent('trend-analyzer', {
      description: 'Updated agent description'
    });

    const agent = registry.getAgent('trend-analyzer');
    suite.assertEquals(agent.description, 'Updated agent description', 'Description updated');
  });

  await suite.test('RegistryManager: Save registries', async () => {
    await registry.save();
    // Verify files were created
    const deptPath = path.join(registry.registriesPath, 'departments.json');
    const stats = await fs.stat(deptPath);
    suite.assertTrue(stats.isFile(), 'Registry file created');
  });

  await suite.test('RegistryManager: Export registries', async () => {
    const exported = await registry.export();
    suite.assert(exported.departments, 'Departments exported');
    suite.assert(exported.agents, 'Agents exported');
    suite.assert(exported.workflows, 'Workflows exported');
    suite.assert(exported.exported, 'Export timestamp present');
  });

  await suite.test('RegistryManager: Error handling - duplicate department', async () => {
    try {
      await registry.addDepartment({
        name: 'marketing',
        displayName: 'Marketing',
        description: 'Duplicate'
      });
      suite.assert(false, 'Should have thrown error');
    } catch (error) {
      suite.assertTrue(error.message.includes('already exists'), 'Should error on duplicate');
    }
  });

  await suite.test('RegistryManager: Error handling - agent without department', async () => {
    try {
      await registry.addAgent({
        name: 'orphan-agent',
        displayName: 'Orphan',
        department: 'nonexistent',
        type: 'specialist',
        description: 'Test'
      });
      suite.assert(false, 'Should have thrown error');
    } catch (error) {
      suite.assertTrue(error.message.includes('does not exist'), 'Should error on missing department');
    }
  });

  // ========================================
  // INTEGRATION TESTS
  // ========================================

  console.log('\nIntegration Tests\n');

  await suite.test('Integration: Validator + Registry - Validate before add', async () => {
    // Validate agent context
    const agentContext = {
      name: 'report-creator',
      description: 'Creates formatted marketing reports',
      department: 'marketing',
      type: 'specialist',
      tools: ['Read', 'Write']
    };

    const validation = validator.validateAgentContext(agentContext);
    suite.assertTrue(validation.valid, 'Context should be valid');

    // Add to registry
    const agent = await registry.addAgent({
      ...agentContext,
      displayName: 'Report Creator'
    });

    suite.assert(agent, 'Agent added after validation');
  });

  await suite.test('Integration: Type detection and registry', async () => {
    const description = 'Fetches customer data from Salesforce API';
    const detected = validator.detectAgentType(description);

    suite.assertEquals(detected.type, 'data-fetcher', 'Should detect data-fetcher');

    const suggestedTools = validator.suggestTools(detected.type, true);
    suite.assertTrue(suggestedTools.includes('Bash'), 'Should suggest Bash');
  });

  await suite.test('Integration: Workflow validation + registry', async () => {
    const workflowContext = {
      name: 'weekly-report',
      displayName: 'Weekly Report',
      description: 'Generate weekly marketing performance report',
      department: 'marketing',
      steps: [
        {
          parallel: true,
          agents: [
            { name: 'trend-analyzer', prompt: 'Analyze weekly trends' },
            { name: 'sentiment-analyzer', prompt: 'Analyze sentiment' }
          ]
        },
        {
          parallel: false,
          agents: [
            { name: 'report-creator', prompt: 'Create formatted report' }
          ]
        }
      ],
      trigger: {
        type: 'scheduled',
        schedule: 'weekly monday 10:00'
      }
    };

    const validation = validator.validateWorkflowContext(workflowContext);
    suite.assertTrue(validation.valid, 'Workflow context should be valid');
  });

  // Cleanup
  await suite.test('Cleanup: Remove test registries', async () => {
    const testDir = path.join(__dirname, '..', 'test-registries');
    await fs.rm(testDir, { recursive: true, force: true });
    console.log('  Test registries cleaned up');
  });

  // Print summary
  suite.summary();
}

// Run all tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
