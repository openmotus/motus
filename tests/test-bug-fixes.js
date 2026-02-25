#!/usr/bin/env node

/**
 * Bug Fix Verification Tests
 *
 * Tests for specific bugs fixed in the 2026-02-25 stewardship cycle:
 * - Agent type validation in RegistryManager.addAgent()
 * - Template fallback for unknown agent types
 * - resolveTemplatePath() error on unsupported extensions
 * - OAuthRegistry._generateInitFunction() with single envVar
 * - OAuthRegistry.addIntegration() regex mismatch fix
 */

const path = require('path');
const fs = require('fs').promises;
const RegistryManager = require('../lib/registry-manager');
const TemplateEngine = require('../lib/template-engine');
const OAuthRegistry = require('../lib/oauth-registry');

// Simple test framework
const suite = {
  total: 0,
  passed: 0,
  failed: 0,

  assert(condition, testName) {
    this.total++;
    if (condition) {
      this.passed++;
      console.log(`\u2713 ${testName}`);
    } else {
      this.failed++;
      console.log(`\u2717 ${testName}`);
    }
  },

  async assertThrows(fn, expectedMessage, testName) {
    this.total++;
    try {
      await fn();
      this.failed++;
      console.log(`\u2717 ${testName} (did not throw)`);
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        this.failed++;
        console.log(`\u2717 ${testName} (wrong error: "${error.message}")`);
      } else {
        this.passed++;
        console.log(`\u2713 ${testName}`);
      }
    }
  },

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.total}`);
    console.log(`Passed: ${this.passed} \u2713`);
    console.log(`Failed: ${this.failed} \u2717`);
    console.log('='.repeat(60));
    if (this.failed === 0) {
      console.log('\n\ud83c\udf89 All tests passed!');
    }
    return this.failed;
  }
};

async function runTests() {
  console.log('Bug Fix Verification Tests\n');

  // Setup: create temp registry dir
  const tmpDir = path.join(__dirname, '..', '.test-bug-fixes-' + Date.now());
  const registriesDir = path.join(tmpDir, 'config', 'registries');
  const agentsDir = path.join(tmpDir, '.claude', 'agents');
  const templatesDir = path.join(tmpDir, 'templates');
  await fs.mkdir(registriesDir, { recursive: true });
  await fs.mkdir(agentsDir, { recursive: true });

  // Copy templates dir so RegistryManager can render agent files
  await fs.cp(path.join(__dirname, '..', 'templates'), templatesDir, { recursive: true });

  // Also create oauth-manager dir with a mock server.js
  const oauthDir = path.join(tmpDir, 'oauth-manager');
  await fs.mkdir(oauthDir, { recursive: true });
  await fs.writeFile(path.join(oauthDir, 'server.js'), `const OAUTH_CONFIGS = {
  google: {
    name: 'Google',
    icon: '\ud83d\udd37',
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    tokenFile: '/tmp/google-token.json'
  }
  // Future services can be added here
  // slack: { ... },
};

const oauthClients = {};

function initGoogleOAuth() {
  return null;
}

oauthClients.oura = initOuraOAuth();
`);

  // ==========================================
  // 1. Agent Type Validation
  // ==========================================
  console.log('\nAgent Type Validation\n');

  const registry = new RegistryManager(tmpDir);
  await registry.load();

  // Create a department first
  await registry.addDepartment({
    name: 'test-dept',
    displayName: 'Test Department',
    description: 'A department for testing'
  });

  // Valid types should work
  for (const validType of ['data-fetcher', 'orchestrator', 'specialist']) {
    try {
      await registry.addAgent({
        name: `test-${validType}`,
        displayName: `Test ${validType}`,
        department: 'test-dept',
        type: validType,
        description: `A ${validType} agent for testing purposes`
      });
      suite.assert(true, `addAgent: accepts valid type '${validType}'`);
    } catch (error) {
      suite.assert(false, `addAgent: accepts valid type '${validType}' (error: ${error.message})`);
    }
  }

  // Invalid type should throw
  await suite.assertThrows(
    () => registry.addAgent({
      name: 'test-invalid',
      displayName: 'Test Invalid',
      department: 'test-dept',
      type: 'custom',
      description: 'An agent with invalid type'
    }),
    'Invalid agent type',
    "addAgent: rejects invalid type 'custom'"
  );

  await suite.assertThrows(
    () => registry.addAgent({
      name: 'test-admin',
      displayName: 'Test Admin',
      department: 'test-dept',
      type: 'admin',
      description: 'An agent with admin type'
    }),
    'Invalid agent type',
    "addAgent: rejects invalid type 'admin'"
  );

  // Error message should list valid types
  try {
    await registry.addAgent({
      name: 'test-bad',
      displayName: 'Test Bad',
      department: 'test-dept',
      type: 'unknown',
      description: 'An agent with unknown type'
    });
    suite.assert(false, 'addAgent: error lists valid types');
  } catch (error) {
    suite.assert(
      error.message.includes('data-fetcher') &&
      error.message.includes('orchestrator') &&
      error.message.includes('specialist'),
      'addAgent: error lists valid types'
    );
  }

  // ==========================================
  // 2. Template Engine: resolveTemplatePath
  // ==========================================
  console.log('\nTemplate Path Resolution\n');

  const engine = new TemplateEngine();

  // type/name format should work as before
  const agentPath = engine.resolveTemplatePath('agent/data-fetcher-agent.md');
  suite.assert(agentPath.includes('agent') && agentPath.endsWith('.hbs'), 'resolveTemplatePath: type/name format works');

  // Supported extensions should work
  const mdPath = engine.resolveTemplatePath('test-agent.md');
  suite.assert(mdPath.includes('agent'), 'resolveTemplatePath: .md extension resolves to agent dir');

  const jsPath = engine.resolveTemplatePath('test-script.js');
  suite.assert(jsPath.includes('agent'), 'resolveTemplatePath: .js extension resolves to agent dir');

  const jsonPath = engine.resolveTemplatePath('test-config.json');
  suite.assert(jsonPath.includes('workflow'), 'resolveTemplatePath: .json extension resolves to workflow dir');

  const shPath = engine.resolveTemplatePath('test-trigger.sh');
  suite.assert(shPath.includes('workflow'), 'resolveTemplatePath: .sh extension resolves to workflow dir');

  // Unsupported extension should throw
  await suite.assertThrows(
    () => { engine.resolveTemplatePath('test-file.yaml'); },
    'Unsupported template extension',
    'resolveTemplatePath: throws on unsupported .yaml extension'
  );

  await suite.assertThrows(
    () => { engine.resolveTemplatePath('test-file.txt'); },
    'Unsupported template extension',
    'resolveTemplatePath: throws on unsupported .txt extension'
  );

  // ==========================================
  // 3. OAuthRegistry: _generateInitFunction
  // ==========================================
  console.log('\nOAuth Init Function Generation\n');

  const oauth = new OAuthRegistry(tmpDir);

  // Single env var should not produce undefined
  const singleEnvResult = oauth._generateInitFunction({
    id: 'single-env',
    name: 'Single Env Service',
    envVars: ['SINGLE_API_KEY'],
    authUrl: 'https://example.com/auth',
    tokenUrl: 'https://example.com/token'
  });
  suite.assert(!singleEnvResult.includes('process.env.undefined'), '_generateInitFunction: single envVar does not produce undefined');
  suite.assert(singleEnvResult.includes('SINGLE_API_KEY'), '_generateInitFunction: single envVar is used in check');

  // Two env vars should work as before
  const twoEnvResult = oauth._generateInitFunction({
    id: 'two-env',
    name: 'Two Env Service',
    envVars: ['CLIENT_ID', 'CLIENT_SECRET'],
    authUrl: 'https://example.com/auth',
    tokenUrl: 'https://example.com/token'
  });
  suite.assert(twoEnvResult.includes('CLIENT_ID') && twoEnvResult.includes('CLIENT_SECRET'), '_generateInitFunction: two envVars both present');

  // Three env vars should only check first two
  const threeEnvResult = oauth._generateInitFunction({
    id: 'three-env',
    name: 'Three Env Service',
    envVars: ['ID', 'SECRET', 'EXTRA'],
    authUrl: 'https://example.com/auth',
    tokenUrl: 'https://example.com/token'
  });
  suite.assert(threeEnvResult.includes('process.env.ID') && threeEnvResult.includes('process.env.SECRET'), '_generateInitFunction: three envVars checks first two');

  // ==========================================
  // 4. OAuthRegistry: addIntegration regex fix
  // ==========================================
  console.log('\nOAuth addIntegration Regex Fix\n');

  // The mock server.js has "// Future services can be added here" which the
  // fixed regex should now match
  const addResult = await oauth.addIntegration({
    id: 'testservice',
    name: 'Test Service',
    icon: '\ud83e\uddea',
    envVars: ['TEST_CLIENT_ID', 'TEST_CLIENT_SECRET'],
    authUrl: 'https://test.example.com/auth',
    tokenUrl: 'https://test.example.com/token',
    scopes: ['read', 'write']
  });
  suite.assert(addResult === true, 'addIntegration: returns true with fixed regex');

  // Verify the service was actually added to server.js
  const updatedServer = await fs.readFile(path.join(oauthDir, 'server.js'), 'utf8');
  suite.assert(updatedServer.includes('testservice'), 'addIntegration: service config written to server.js');
  suite.assert(updatedServer.includes('Test Service'), 'addIntegration: service name appears in server.js');

  // ==========================================
  // 5. VALID_AGENT_TYPES constant
  // ==========================================
  console.log('\nVALID_AGENT_TYPES constant\n');

  // The constant should be used in error messages
  try {
    await registry.addAgent({
      name: 'type-check-agent',
      displayName: 'Type Check',
      department: 'test-dept',
      type: 'invalid-type',
      description: 'Tests constant is used in validation'
    });
    suite.assert(false, 'VALID_AGENT_TYPES: validation rejects invalid type');
  } catch (error) {
    suite.assert(
      error.message.includes('data-fetcher, orchestrator, specialist'),
      'VALID_AGENT_TYPES: error message contains all valid types'
    );
  }

  // ==========================================
  // Cleanup
  // ==========================================
  console.log('\nCleanup\n');
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
    suite.assert(true, 'cleanup: removed temp directory');
  } catch (error) {
    suite.assert(true, 'cleanup: temp directory removal (best effort)');
  }

  // ==========================================
  // Summary
  // ==========================================
  const failed = suite.summary();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
