#!/usr/bin/env node

/**
 * Doc Generator Test Suite
 *
 * Tests documentation generation, integration docs rendering,
 * and output formatting for the DocGenerator class.
 */

const fs = require('fs').promises;
const path = require('path');
const DocGenerator = require('../lib/doc-generator');
const RegistryManager = require('../lib/registry-manager');

class DocGeneratorTestSuite {
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
      console.log(`\u2713 ${name}`);
      this.tests.push({ name, passed: true });
    } catch (error) {
      this.failCount++;
      console.error(`\u2717 ${name}`);
      console.error(`  Error: ${error.message}`);
      this.tests.push({ name, passed: false, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.testCount}`);
    console.log(`Passed: ${this.passCount} \u2713`);
    console.log(`Failed: ${this.failCount} \u2717`);
    console.log('='.repeat(60));

    if (this.failCount > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n\ud83c\udf89 All tests passed!');
      process.exit(0);
    }
  }
}

async function runTests() {
  const suite = new DocGeneratorTestSuite();

  console.log('Doc Generator Test Suite');
  console.log('='.repeat(60) + '\n');

  // ========================================
  // CONSTRUCTOR TESTS
  // ========================================

  console.log('Constructor\n');

  await suite.test('constructor: creates instance with default paths', async () => {
    const gen = new DocGenerator();
    suite.assert(gen.basePath !== undefined, 'basePath is set');
    suite.assert(gen.registry instanceof RegistryManager, 'registry is RegistryManager instance');
    suite.assert(gen.docsPath.includes('org-docs'), 'docsPath includes org-docs');
    suite.assert(gen.deptDocsPath.includes('departments'), 'deptDocsPath includes departments');
  });

  await suite.test('constructor: docsPath is child of basePath', async () => {
    const gen = new DocGenerator();
    suite.assert(gen.docsPath.startsWith(gen.basePath), 'docsPath starts with basePath');
    suite.assert(gen.deptDocsPath.startsWith(gen.docsPath), 'deptDocsPath starts with docsPath');
  });

  // ========================================
  // INTEGRATION DOCS RENDERING
  // ========================================

  console.log('\nIntegration Docs Rendering\n');

  await suite.test('generateIntegrationDocs: renders OAuth2 integration', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Google Calendar',
      type: 'oauth2',
      setup: 'Go to Google Cloud Console and create OAuth credentials',
      envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    };

    const docs = gen.generateIntegrationDocs(integration, 'life');
    suite.assert(docs.includes('Google Calendar'), 'Contains integration name');
    suite.assert(docs.includes('OAuth 2.0'), 'Contains OAuth type');
    suite.assert(docs.includes('Quick Setup'), 'Contains Quick Setup section');
    suite.assert(docs.includes('Manual Setup'), 'Contains Manual Setup section');
    suite.assert(docs.includes('GOOGLE_CLIENT_ID'), 'Contains env var');
    suite.assert(docs.includes('GOOGLE_CLIENT_SECRET'), 'Contains secret env var');
    suite.assert(docs.includes('./start-oauth-manager.sh'), 'Contains OAuth Manager start command');
    suite.assert(docs.includes('Troubleshooting'), 'Contains troubleshooting section');
  });

  await suite.test('generateIntegrationDocs: renders API key integration', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Weather API',
      type: 'api-key',
      setup: 'Sign up at weatherapi.com',
      setupUrl: 'https://www.weatherapi.com/signup.aspx',
      envVars: ['WEATHER_API_KEY']
    };

    const docs = gen.generateIntegrationDocs(integration, 'life');
    suite.assert(docs.includes('Weather API'), 'Contains integration name');
    suite.assert(docs.includes('API Key'), 'Contains API Key type');
    suite.assert(docs.includes('Setup Instructions'), 'Contains setup section');
    suite.assert(docs.includes('WEATHER_API_KEY'), 'Contains env var');
    suite.assert(docs.includes('weatherapi.com/signup'), 'Contains setup URL');
    suite.assert(!docs.includes('OAuth Manager'), 'Does not contain OAuth Manager for API key');
  });

  await suite.test('generateIntegrationDocs: OAuth2 includes token file path', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Slack',
      type: 'oauth2',
      setup: 'Create a Slack app at api.slack.com',
      envVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET']
    };

    const docs = gen.generateIntegrationDocs(integration, 'comms');
    suite.assert(docs.includes('token file'), 'Mentions token file in troubleshooting');
    suite.assert(docs.includes('disconnect'), 'Mentions disconnect/reconnect tip');
  });

  await suite.test('generateIntegrationDocs: API key includes env check command', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Todoist',
      type: 'api-key',
      setup: 'Get API token from Todoist settings',
      envVars: ['TODOIST_API_TOKEN']
    };

    const docs = gen.generateIntegrationDocs(integration, 'tasks');
    suite.assert(docs.includes('echo $TODOIST_API_TOKEN'), 'Contains env check command');
    suite.assert(docs.includes('dotenv'), 'Contains dotenv check');
  });

  await suite.test('generateIntegrationDocs: multiple env vars all listed', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Custom OAuth',
      type: 'oauth2',
      setup: 'Set up OAuth app',
      envVars: ['CUSTOM_CLIENT_ID', 'CUSTOM_CLIENT_SECRET', 'CUSTOM_REDIRECT_URI']
    };

    const docs = gen.generateIntegrationDocs(integration, 'custom');
    suite.assert(docs.includes('CUSTOM_CLIENT_ID'), 'Lists first env var');
    suite.assert(docs.includes('CUSTOM_CLIENT_SECRET'), 'Lists second env var');
    suite.assert(docs.includes('CUSTOM_REDIRECT_URI'), 'Lists third env var');
  });

  // ========================================
  // COMMANDS REFERENCE GENERATION
  // ========================================

  console.log('\nCommands Reference Generation\n');

  await suite.test('generateCommandsReference: produces valid markdown', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    await gen.generateCommandsReference();

    const content = await fs.readFile(
      path.join(gen.docsPath, 'COMMANDS_REFERENCE.md'), 'utf8'
    );
    suite.assert(content.includes('# Motus Commands Reference'), 'Has title');
    suite.assert(content.includes('## System Overview'), 'Has overview section');
    suite.assert(content.includes('## Creation Commands'), 'Has creation commands');
    suite.assert(content.includes('## Agent Types'), 'Has agent types');
  });

  await suite.test('generateCommandsReference: includes statistics', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    await gen.generateCommandsReference();

    const content = await fs.readFile(
      path.join(gen.docsPath, 'COMMANDS_REFERENCE.md'), 'utf8'
    );
    suite.assert(content.includes('Total Departments'), 'Has department count');
    suite.assert(content.includes('Total Agents'), 'Has agent count');
    suite.assert(content.includes('Total Workflows'), 'Has workflow count');
  });

  await suite.test('generateCommandsReference: includes auto-gen footer', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    await gen.generateCommandsReference();

    const content = await fs.readFile(
      path.join(gen.docsPath, 'COMMANDS_REFERENCE.md'), 'utf8'
    );
    suite.assert(content.includes('auto-generated'), 'Has auto-generated notice');
    suite.assert(content.includes('Do not edit manually'), 'Has do-not-edit notice');
  });

  // ========================================
  // FULL GENERATION TESTS
  // ========================================

  console.log('\nFull Generation\n');

  await suite.test('generate: runs without errors on empty registries', async () => {
    const gen = new DocGenerator();
    await gen.generate();
    // If we get here, no errors were thrown
    suite.assert(true, 'Generation completed');
  });

  await suite.test('generate: creates org-docs directory', async () => {
    const gen = new DocGenerator();
    await gen.generate();

    const stats = await fs.stat(gen.docsPath);
    suite.assert(stats.isDirectory(), 'org-docs directory exists');
  });

  await suite.test('generate: creates departments subdirectory', async () => {
    const gen = new DocGenerator();
    await gen.generate();

    const stats = await fs.stat(gen.deptDocsPath);
    suite.assert(stats.isDirectory(), 'departments subdirectory exists');
  });

  // ========================================
  // EDGE CASES
  // ========================================

  console.log('\nEdge Cases\n');

  await suite.test('generateIntegrationDocs: handles missing setupUrl gracefully', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Minimal API',
      type: 'api-key',
      setup: 'Get an API key',
      envVars: ['MINIMAL_API_KEY']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    suite.assert(docs.includes('Minimal API'), 'Contains name');
    suite.assert(docs.includes('MINIMAL_API_KEY'), 'Contains env var');
    // Should not crash without setupUrl
  });

  await suite.test('generateIntegrationDocs: handles single env var', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Simple',
      type: 'api-key',
      setup: 'Get key',
      envVars: ['SIMPLE_KEY']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    suite.assert(docs.includes('SIMPLE_KEY'), 'Contains the env var');
  });

  await suite.test('generateIntegrationDocs: unknown type renders without error', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Unknown Type',
      type: 'webhook',
      setup: 'Configure webhook',
      envVars: ['WEBHOOK_URL']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    // Unknown types produce header + env vars section only
    suite.assert(docs.includes('Unknown Type'), 'Contains integration name');
    suite.assert(docs.includes('WEBHOOK_URL'), 'Contains env var');
  });

  await suite.test('generateCommandsReference: handles empty department list', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    // With fresh/empty registries, should still produce valid output
    await gen.generateCommandsReference();

    const content = await fs.readFile(
      path.join(gen.docsPath, 'COMMANDS_REFERENCE.md'), 'utf8'
    );
    suite.assert(content.length > 100, 'Produces non-trivial output');
  });

  await suite.test('generateDepartmentDocs: handles empty department list without error', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    // Should not error with no departments
    await gen.generateDepartmentDocs();
    suite.assert(true, 'Completes without error');
  });

  await suite.test('updateClaudeMd: runs without error', async () => {
    const gen = new DocGenerator();
    await gen.registry.load();
    await gen.updateClaudeMd();
    suite.assert(true, 'updateClaudeMd completes');
  });

  // ========================================
  // OUTPUT FORMAT TESTS
  // ========================================

  console.log('\nOutput Format\n');

  await suite.test('generateIntegrationDocs: OAuth2 output uses markdown headers', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Test OAuth',
      type: 'oauth2',
      setup: 'Set up at example.com',
      envVars: ['TEST_CLIENT_ID', 'TEST_CLIENT_SECRET']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    suite.assert(docs.includes('### Test OAuth'), 'Has H3 header for integration name');
    suite.assert(docs.includes('#### Quick Setup'), 'Has H4 for quick setup');
    suite.assert(docs.includes('#### Manual Setup'), 'Has H4 for manual setup');
  });

  await suite.test('generateIntegrationDocs: API key output uses markdown headers', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Test API',
      type: 'api-key',
      setup: 'Get key from dashboard',
      envVars: ['TEST_API_KEY']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    suite.assert(docs.includes('### Test API'), 'Has H3 header for integration name');
    suite.assert(docs.includes('#### Setup Instructions'), 'Has H4 for setup');
  });

  await suite.test('generateIntegrationDocs: includes code blocks for env vars', async () => {
    const gen = new DocGenerator();
    const integration = {
      name: 'Code Block Test',
      type: 'api-key',
      setup: 'Get key',
      envVars: ['CB_API_KEY']
    };

    const docs = gen.generateIntegrationDocs(integration, 'test');
    suite.assert(docs.includes('```bash'), 'Contains bash code block');
    suite.assert(docs.includes('```'), 'Contains code block closing');
  });

  // Print summary
  suite.summary();
}

// Run all tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
