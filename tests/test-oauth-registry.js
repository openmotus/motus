#!/usr/bin/env node

/**
 * Test OAuth Registry
 * Tests OAuth configuration generation, integration management, and standard configs
 */

const OAuthRegistry = require('../lib/oauth-registry');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

let testDir;
let passed = 0;
let failed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`✓ ${message}`);
  } else {
    failed++;
    console.log(`✗ ${message}`);
  }
}

async function setup() {
  // Create a temporary directory with a mock oauth-manager/server.js
  testDir = path.join(os.tmpdir(), `motus-oauth-test-${Date.now()}`);
  const oauthDir = path.join(testDir, 'oauth-manager');
  await fs.mkdir(oauthDir, { recursive: true });
}

async function createMockServerFile(content) {
  const serverPath = path.join(testDir, 'oauth-manager', 'server.js');
  await fs.writeFile(serverPath, content || getMockServerContent());
}

function getMockServerContent() {
  return `const path = require('path');
const PORT = 3456;

const OAUTH_CONFIGS = {
  google: {
    name: 'Google',
    icon: '🔵',
    scopes: ['calendar.readonly', 'gmail.readonly'],
    requiredEnvVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    tokenFile: path.join(process.env.HOME, '.motus', 'google-token.json')
  },
  oura: {
    name: 'Oura Ring',
    icon: '💍',
    scopes: ['daily'],
    requiredEnvVars: ['OURA_CLIENT_ID', 'OURA_CLIENT_SECRET'],
    tokenFile: path.join(process.env.HOME, '.motus', 'oura-token.json')
  }
  // Future services
};

const oauthClients = {};

function initGoogleOAuth() {
  return { clientId: 'test' };
}

function initOuraOAuth() {
  return { clientId: 'test' };
}

oauthClients.google = initGoogleOAuth();
oauthClients.oura = initOuraOAuth();

app.get('/connect/:service', (req, res) => {
  const { service } = req.params;
  if (service === 'google') {
    const authUrl = 'https://accounts.google.com/o/oauth2/auth';
    res.json({ authUrl });
  }
});

app.get('/callback/:service', async (req, res) => {
  const { service } = req.params;
  const { code } = req.query;
  if (service === 'google') {
    res.redirect('/?success=true');
  } else if (service === 'oura' && oauthClients.oura) {
    try {
      res.redirect('/?success=true');
    } catch (error) {
      console.error('Oura OAuth callback error:', error);
      res.redirect('/?error=token_exchange_failed');
    }
  }
});
`;
}

async function cleanup() {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch (e) {
    // ignore cleanup errors
  }
}

async function runTests() {
  console.log('🧪 Testing OAuth Registry\n');

  await setup();

  // ============================================
  // Constructor Tests
  // ============================================
  console.log('\nConstructor\n');

  (() => {
    const registry = new OAuthRegistry('/some/path');
    assert(registry.basePath === '/some/path', 'constructor: uses provided basePath');
    assert(registry.serverPath === path.join('/some/path', 'oauth-manager', 'server.js'),
      'constructor: sets correct serverPath');
    assert(typeof registry.oauthConfigs === 'object', 'constructor: initializes oauthConfigs');
  })();

  (() => {
    const registry = new OAuthRegistry();
    assert(registry.basePath === path.join(__dirname, '..'),
      'constructor: defaults basePath to parent of lib/');
  })();

  // ============================================
  // load() Tests
  // ============================================
  console.log('\nload()\n');

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    const result = await registry.load();
    assert(result === true, 'load: returns true when server.js exists');
  })();

  await (async () => {
    const registry = new OAuthRegistry(path.join(testDir, 'nonexistent'));
    const result = await registry.load();
    assert(result === false, 'load: returns false when server.js is missing');
  })();

  await (async () => {
    // Server file without OAUTH_CONFIGS
    await createMockServerFile('const x = 1;');
    const registry = new OAuthRegistry(testDir);
    const result = await registry.load();
    assert(result === true, 'load: succeeds even without OAUTH_CONFIGS block');
  })();

  // ============================================
  // integrationExists() Tests
  // ============================================
  console.log('\nintegrationExists()\n');

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    const exists = await registry.integrationExists('google');
    assert(exists === true, 'integrationExists: finds existing integration');
  })();

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    const exists = await registry.integrationExists('facebook');
    assert(exists === false, 'integrationExists: returns false for missing integration');
  })();

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    const exists = await registry.integrationExists('oura');
    assert(exists === true, 'integrationExists: finds oura integration');
  })();

  // ============================================
  // _generateServiceConfig() Tests
  // ============================================
  console.log('\n_generateServiceConfig()\n');

  (() => {
    const registry = new OAuthRegistry(testDir);
    const config = registry._generateServiceConfig({
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      envVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'],
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['channels:read', 'chat:write']
    });
    assert(config.includes('slack:'), 'generateServiceConfig: uses id as key');
    assert(config.includes("name: 'Slack'"), 'generateServiceConfig: includes name');
    assert(config.includes("icon: '💬'"), 'generateServiceConfig: includes icon');
    assert(config.includes("'channels:read'"), 'generateServiceConfig: includes scopes');
    assert(config.includes("'SLACK_CLIENT_ID'"), 'generateServiceConfig: includes envVars');
    assert(config.includes('slack-token.json'), 'generateServiceConfig: generates token file path');
  })();

  (() => {
    const registry = new OAuthRegistry(testDir);
    const config = registry._generateServiceConfig({
      id: 'google-analytics',
      name: 'Google Analytics',
      envVars: ['GA_ID', 'GA_SECRET']
    });
    assert(config.includes("'google-analytics':"), 'generateServiceConfig: quotes hyphenated keys');
  })();

  (() => {
    const registry = new OAuthRegistry(testDir);
    const config = registry._generateServiceConfig({
      id: 'simple',
      name: 'Simple Service',
      envVars: ['KEY']
    });
    assert(config.includes("icon: '🔗'"), 'generateServiceConfig: defaults icon to link emoji');
    assert(!config.includes('scopes:'), 'generateServiceConfig: omits scopes when empty');
    assert(!config.includes('authorizationBaseUrl:'), 'generateServiceConfig: omits authUrl when undefined');
    assert(!config.includes('tokenUrl:'), 'generateServiceConfig: omits tokenUrl when undefined');
  })();

  // ============================================
  // _generateInitFunction() Tests
  // ============================================
  console.log('\n_generateInitFunction()\n');

  (() => {
    const registry = new OAuthRegistry(testDir);
    const func = registry._generateInitFunction({
      id: 'slack',
      name: 'Slack API',
      envVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'],
      authUrl: 'https://slack.com/oauth',
      tokenUrl: 'https://slack.com/token'
    });
    assert(func.includes('function initSlackOAuth()'), 'generateInitFunction: creates PascalCase function name');
    assert(func.includes('process.env.SLACK_CLIENT_ID'), 'generateInitFunction: checks first env var');
    assert(func.includes('process.env.SLACK_CLIENT_SECRET'), 'generateInitFunction: checks second env var');
    assert(func.includes('return null'), 'generateInitFunction: returns null when env vars missing');
    assert(func.includes('/callback/slack'), 'generateInitFunction: sets redirect URI with id');
    assert(func.includes('authorizationBaseUrl:'), 'generateInitFunction: includes authUrl when provided');
    assert(func.includes('tokenUrl:'), 'generateInitFunction: includes tokenUrl when provided');
  })();

  (() => {
    const registry = new OAuthRegistry(testDir);
    const func = registry._generateInitFunction({
      id: 'my-service',
      name: 'My Service',
      envVars: ['MY_ID', 'MY_SECRET']
    });
    assert(func.includes('function initMyServiceOAuth()'), 'generateInitFunction: handles hyphenated ids');
    assert(!func.includes('authorizationBaseUrl:'), 'generateInitFunction: omits authUrl when undefined');
    assert(!func.includes('tokenUrl:'), 'generateInitFunction: omits tokenUrl when undefined');
  })();

  // ============================================
  // _generateConnectHandler() Tests
  // ============================================
  console.log('\n_generateConnectHandler()\n');

  (() => {
    const registry = new OAuthRegistry(testDir);
    const handler = registry._generateConnectHandler({
      id: 'slack',
      authUrl: 'https://slack.com/oauth/v2/authorize',
      scopes: ['channels:read', 'chat:write']
    });
    assert(handler.includes("service === 'slack'"), 'generateConnectHandler: checks service id');
    assert(handler.includes('oauthClients.slack'), 'generateConnectHandler: references oauth client');
    assert(handler.includes('scope=channels:read,chat:write'), 'generateConnectHandler: includes scopes');
    assert(handler.includes('response_type=code'), 'generateConnectHandler: uses code response type');
  })();

  (() => {
    const registry = new OAuthRegistry(testDir);
    const handler = registry._generateConnectHandler({
      id: 'notion',
      authUrl: 'https://api.notion.com/v1/oauth/authorize'
    });
    assert(!handler.includes('scope='), 'generateConnectHandler: omits scope when no scopes');
  })();

  // ============================================
  // _generateCallbackHandler() Tests
  // ============================================
  console.log('\n_generateCallbackHandler()\n');

  (() => {
    const registry = new OAuthRegistry(testDir);
    const handler = registry._generateCallbackHandler({
      id: 'slack',
      name: 'Slack API'
    });
    assert(handler.includes("service === 'slack'"), 'generateCallbackHandler: checks service id');
    assert(handler.includes('grant_type: \'authorization_code\''), 'generateCallbackHandler: uses authorization_code grant');
    assert(handler.includes('oauthClients.slack.clientId'), 'generateCallbackHandler: passes client id');
    assert(handler.includes('oauthClients.slack.clientSecret'), 'generateCallbackHandler: passes client secret');
    assert(handler.includes('oauthClients.slack.redirectUri'), 'generateCallbackHandler: passes redirect uri');
    assert(handler.includes('oauthClients.slack.tokenUrl'), 'generateCallbackHandler: calls token endpoint');
    assert(handler.includes("res.redirect('/?success=true')"), 'generateCallbackHandler: redirects on success');
    assert(handler.includes("res.redirect('/?error=token_exchange_failed')"), 'generateCallbackHandler: redirects on error');
    assert(handler.includes('Slack API OAuth callback error'), 'generateCallbackHandler: logs error with service name');
  })();

  // ============================================
  // _pascalCase() Tests
  // ============================================
  console.log('\n_pascalCase()\n');

  (() => {
    const registry = new OAuthRegistry(testDir);
    assert(registry._pascalCase('slack') === 'Slack', 'pascalCase: simple word');
    assert(registry._pascalCase('google-analytics') === 'GoogleAnalytics', 'pascalCase: hyphenated');
    assert(registry._pascalCase('my_service') === 'MyService', 'pascalCase: underscored');
    assert(registry._pascalCase('a-b-c') === 'ABC', 'pascalCase: multiple segments');
  })();

  // ============================================
  // getStandardConfig() Tests
  // ============================================
  console.log('\ngetStandardConfig()\n');

  (() => {
    const fb = OAuthRegistry.getStandardConfig('Facebook API');
    assert(fb !== null, 'getStandardConfig: returns config for Facebook API');
    assert(fb.id === 'facebook', 'getStandardConfig: Facebook id is correct');
    assert(fb.icon === '📘', 'getStandardConfig: Facebook icon is correct');
    assert(fb.authUrl.includes('facebook.com'), 'getStandardConfig: Facebook authUrl is correct');
    assert(fb.tokenUrl.includes('graph.facebook.com'), 'getStandardConfig: Facebook tokenUrl is correct');
    assert(fb.scopes.includes('email'), 'getStandardConfig: Facebook has email scope');
  })();

  (() => {
    const li = OAuthRegistry.getStandardConfig('LinkedIn API');
    assert(li !== null, 'getStandardConfig: returns config for LinkedIn API');
    assert(li.id === 'linkedin', 'getStandardConfig: LinkedIn id is correct');
    assert(li.scopes.includes('r_liteprofile'), 'getStandardConfig: LinkedIn has profile scope');
  })();

  (() => {
    const ga = OAuthRegistry.getStandardConfig('Google Analytics');
    assert(ga !== null, 'getStandardConfig: returns config for Google Analytics');
    assert(ga.id === 'google-analytics', 'getStandardConfig: GA id uses hyphen');
    assert(ga.scopes[0].includes('analytics'), 'getStandardConfig: GA has analytics scope');
  })();

  (() => {
    const slack = OAuthRegistry.getStandardConfig('Slack');
    assert(slack !== null, 'getStandardConfig: returns config for Slack');
    assert(slack.id === 'slack', 'getStandardConfig: Slack id is correct');
  })();

  (() => {
    const notion = OAuthRegistry.getStandardConfig('Notion');
    assert(notion !== null, 'getStandardConfig: returns config for Notion');
    assert(notion.scopes.length === 0, 'getStandardConfig: Notion has empty scopes');
  })();

  (() => {
    const twitter = OAuthRegistry.getStandardConfig('Twitter API');
    assert(twitter === null, 'getStandardConfig: returns null for API-key-only services (Twitter)');
  })();

  (() => {
    const buffer = OAuthRegistry.getStandardConfig('Buffer');
    assert(buffer === null, 'getStandardConfig: returns null for API-key-only services (Buffer)');
  })();

  (() => {
    const unknown = OAuthRegistry.getStandardConfig('Unknown Service');
    assert(unknown === null, 'getStandardConfig: returns null for unknown services');
  })();

  // ============================================
  // addIntegration() Tests
  // ============================================
  console.log('\naddIntegration()\n');

  await (async () => {
    try {
      const registry = new OAuthRegistry(testDir);
      await registry.addIntegration({});
      assert(false, 'addIntegration: throws on missing fields');
    } catch (e) {
      assert(e.message.includes('Missing required'), 'addIntegration: throws on missing fields');
    }
  })();

  await (async () => {
    try {
      const registry = new OAuthRegistry(testDir);
      await registry.addIntegration({ id: 'test', name: 'Test' });
      assert(false, 'addIntegration: throws when envVars missing');
    } catch (e) {
      assert(e.message.includes('Missing required'), 'addIntegration: throws when envVars missing');
    }
  })();

  await (async () => {
    try {
      const registry = new OAuthRegistry(testDir);
      await registry.addIntegration({ id: 'test', name: 'Test', envVars: [] });
      assert(false, 'addIntegration: throws when envVars empty');
    } catch (e) {
      assert(e.message.includes('Missing required'), 'addIntegration: throws when envVars empty');
    }
  })();

  await (async () => {
    // Test with a server file that doesn't have the insertion point
    await createMockServerFile('const x = 1;');
    const registry = new OAuthRegistry(testDir);
    const result = await registry.addIntegration({
      id: 'test',
      name: 'Test Service',
      envVars: ['TEST_ID', 'TEST_SECRET'],
      authUrl: 'https://test.com/auth',
      tokenUrl: 'https://test.com/token',
      scopes: ['read']
    });
    assert(result === false, 'addIntegration: returns false when insertion point not found');
  })();

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    const result = await registry.addIntegration({
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      envVars: ['SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET'],
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['channels:read']
    });
    assert(result === true, 'addIntegration: returns true on successful integration');

    // Verify the file was modified
    const content = await fs.readFile(
      path.join(testDir, 'oauth-manager', 'server.js'), 'utf8'
    );
    assert(content.includes("name: 'Slack'"), 'addIntegration: adds service config to file');
    assert(content.includes('initSlackOAuth'), 'addIntegration: adds init function to file');
  })();

  // ============================================
  // Full Integration Round-Trip Test
  // ============================================
  console.log('\nIntegration\n');

  await (async () => {
    await createMockServerFile();
    const registry = new OAuthRegistry(testDir);
    await registry.load();
    const existsBefore = await registry.integrationExists('slack');
    assert(existsBefore === false, 'integration: slack does not exist before adding');

    await registry.addIntegration({
      id: 'slack',
      name: 'Slack',
      icon: '💬',
      envVars: ['SLACK_ID', 'SLACK_SECRET'],
      authUrl: 'https://slack.com/oauth',
      tokenUrl: 'https://slack.com/token',
      scopes: ['read']
    });

    const existsAfter = await registry.integrationExists('slack');
    assert(existsAfter === true, 'integration: slack exists after adding');
  })();

  // ============================================
  // Cleanup & Summary
  // ============================================
  await cleanup();

  console.log('\n' + '='.repeat(60));
  console.log('Test Results');
  console.log('='.repeat(60));
  console.log(`Total: ${total}`);
  console.log(`Passed: ${passed} ✓`);
  console.log(`Failed: ${failed} ✗`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
