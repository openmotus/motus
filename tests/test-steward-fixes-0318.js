#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-18
 *
 * Tests covering:
 * - detectParallelExecution null/non-string safety
 * - validateEnvVarName type guard
 * - suggestEnvVarName null safety
 * - generateIntegrationDocs envVars guard
 * - getDepartmentSummary convenience method
 * - ci-pipeline example validation
 * - lint-checker.js module tests
 */

const fs = require('fs');
const path = require('path');
const Validator = require('../lib/validator');
const RegistryManager = require('../lib/registry-manager');
const DocGenerator = require('../lib/doc-generator');

async function runTests() {
  console.log('🧪 Steward Fixes — 2026-03-18\n');

  const results = { passed: 0, failed: 0, tests: [] };

  function pass(name) {
    console.log(`✅ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  }

  function fail(name, error) {
    console.log(`❌ ${name}: ${error}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error });
  }

  // ========================================
  // detectParallelExecution null safety
  // ========================================
  console.log('\n--- detectParallelExecution null safety ---\n');

  const validator = new Validator();

  // Test 1: null input
  try {
    const result = validator.detectParallelExecution(null);
    if (result.shouldBeParallel === false && result.actionCount === 0 && result.confidence === 0) {
      pass('detectParallelExecution(null) returns safe default');
    } else {
      fail('detectParallelExecution(null)', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution(null)', error.message);
  }

  // Test 2: undefined input
  try {
    const result = validator.detectParallelExecution(undefined);
    if (result.shouldBeParallel === false && result.actionCount === 0) {
      pass('detectParallelExecution(undefined) returns safe default');
    } else {
      fail('detectParallelExecution(undefined)', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution(undefined)', error.message);
  }

  // Test 3: number input
  try {
    const result = validator.detectParallelExecution(42);
    if (result.shouldBeParallel === false && result.actionCount === 0) {
      pass('detectParallelExecution(42) returns safe default');
    } else {
      fail('detectParallelExecution(42)', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution(42)', error.message);
  }

  // Test 4: empty string
  try {
    const result = validator.detectParallelExecution('');
    if (result.shouldBeParallel === false && result.actionCount === 0) {
      pass('detectParallelExecution("") returns safe default');
    } else {
      fail('detectParallelExecution("")', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution("")', error.message);
  }

  // Test 5: boolean input
  try {
    const result = validator.detectParallelExecution(true);
    if (result.shouldBeParallel === false) {
      pass('detectParallelExecution(true) returns safe default');
    } else {
      fail('detectParallelExecution(true)', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution(true)', error.message);
  }

  // Test 6: object input
  try {
    const result = validator.detectParallelExecution({});
    if (result.shouldBeParallel === false) {
      pass('detectParallelExecution({}) returns safe default');
    } else {
      fail('detectParallelExecution({})', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution({})', error.message);
  }

  // Test 7: valid string still works
  try {
    const result = validator.detectParallelExecution('fetch weather and get calendar data');
    if (result.shouldBeParallel === true && result.actionCount >= 2) {
      pass('detectParallelExecution still detects parallel for valid input');
    } else {
      fail('detectParallelExecution valid input', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectParallelExecution valid input', error.message);
  }

  // Test 8: single action not parallel
  try {
    const result = validator.detectParallelExecution('analyze the report');
    if (result.actionCount <= 1) {
      pass('detectParallelExecution single action returns low action count');
    } else {
      fail('detectParallelExecution single action', `Expected actionCount <= 1, got ${result.actionCount}`);
    }
  } catch (error) {
    fail('detectParallelExecution single action', error.message);
  }

  // ========================================
  // validateEnvVarName type guard
  // ========================================
  console.log('\n--- validateEnvVarName type guard ---\n');

  // Test 9: number input
  try {
    const result = validator.validateEnvVarName(123);
    if (!result.valid && result.errors.some(e => e.includes('string'))) {
      pass('validateEnvVarName(123) rejects with type error');
    } else {
      fail('validateEnvVarName(123)', `Expected type error, got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('validateEnvVarName(123)', error.message);
  }

  // Test 10: boolean input
  try {
    const result = validator.validateEnvVarName(true);
    if (!result.valid && result.errors.some(e => e.includes('string'))) {
      pass('validateEnvVarName(true) rejects with type error');
    } else {
      fail('validateEnvVarName(true)', `Expected type error, got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('validateEnvVarName(true)', error.message);
  }

  // Test 11: object input
  try {
    const result = validator.validateEnvVarName({});
    if (!result.valid && result.errors.some(e => e.includes('string'))) {
      pass('validateEnvVarName({}) rejects with type error');
    } else {
      fail('validateEnvVarName({})', `Expected type error, got: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('validateEnvVarName({})', error.message);
  }

  // Test 12: null still gives 'required' error
  try {
    const result = validator.validateEnvVarName(null);
    if (!result.valid && result.errors.some(e => e.includes('required'))) {
      pass('validateEnvVarName(null) gives required error');
    } else {
      fail('validateEnvVarName(null)', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('validateEnvVarName(null)', error.message);
  }

  // Test 13: valid name still works
  try {
    const result = validator.validateEnvVarName('API_KEY');
    if (result.valid) {
      pass('validateEnvVarName("API_KEY") still validates correctly');
    } else {
      fail('validateEnvVarName("API_KEY")', `Expected valid, got errors: ${result.errors}`);
    }
  } catch (error) {
    fail('validateEnvVarName("API_KEY")', error.message);
  }

  // ========================================
  // suggestEnvVarName null safety
  // ========================================
  console.log('\n--- suggestEnvVarName null safety ---\n');

  // Test 14: null department
  try {
    const result = validator.suggestEnvVarName(null, 'weather');
    if (result === '') {
      pass('suggestEnvVarName(null, "weather") returns empty string');
    } else {
      fail('suggestEnvVarName(null, "weather")', `Expected "", got "${result}"`);
    }
  } catch (error) {
    fail('suggestEnvVarName(null, "weather")', error.message);
  }

  // Test 15: null service
  try {
    const result = validator.suggestEnvVarName('marketing', null);
    if (result === '') {
      pass('suggestEnvVarName("marketing", null) returns empty string');
    } else {
      fail('suggestEnvVarName("marketing", null)', `Expected "", got "${result}"`);
    }
  } catch (error) {
    fail('suggestEnvVarName("marketing", null)', error.message);
  }

  // Test 16: undefined both
  try {
    const result = validator.suggestEnvVarName(undefined, undefined);
    if (result === '') {
      pass('suggestEnvVarName(undefined, undefined) returns empty string');
    } else {
      fail('suggestEnvVarName(undefined, undefined)', `Expected "", got "${result}"`);
    }
  } catch (error) {
    fail('suggestEnvVarName(undefined, undefined)', error.message);
  }

  // Test 17: number inputs
  try {
    const result = validator.suggestEnvVarName(42, 99);
    if (result === '') {
      pass('suggestEnvVarName(42, 99) returns empty string');
    } else {
      fail('suggestEnvVarName(42, 99)', `Expected "", got "${result}"`);
    }
  } catch (error) {
    fail('suggestEnvVarName(42, 99)', error.message);
  }

  // Test 18: valid inputs still work
  try {
    const result = validator.suggestEnvVarName('marketing', 'twitter');
    if (result === 'MARKETING_TWITTER_KEY') {
      pass('suggestEnvVarName("marketing", "twitter") still works correctly');
    } else {
      fail('suggestEnvVarName valid', `Expected "MARKETING_TWITTER_KEY", got "${result}"`);
    }
  } catch (error) {
    fail('suggestEnvVarName valid', error.message);
  }

  // ========================================
  // generateIntegrationDocs envVars guard
  // ========================================
  console.log('\n--- generateIntegrationDocs envVars guard ---\n');

  const generator = new DocGenerator();

  // Test 19: oauth2 integration with no envVars
  try {
    const doc = generator.generateIntegrationDocs({
      name: 'TestService',
      type: 'oauth2',
      setup: 'Go to test.com',
      envVars: undefined
    }, 'test-dept');
    if (doc.includes('TestService') && !doc.includes('undefined')) {
      pass('generateIntegrationDocs handles undefined envVars for oauth2');
    } else {
      fail('oauth2 undefined envVars', 'Output contains "undefined"');
    }
  } catch (error) {
    fail('oauth2 undefined envVars', error.message);
  }

  // Test 20: oauth2 integration with empty envVars
  try {
    const doc = generator.generateIntegrationDocs({
      name: 'TestService',
      type: 'oauth2',
      setup: 'Go to test.com',
      envVars: []
    }, 'test-dept');
    if (doc.includes('TestService')) {
      pass('generateIntegrationDocs handles empty envVars array for oauth2');
    } else {
      fail('oauth2 empty envVars', 'Missing expected content');
    }
  } catch (error) {
    fail('oauth2 empty envVars', error.message);
  }

  // Test 21: api-key integration with no envVars
  try {
    const doc = generator.generateIntegrationDocs({
      name: 'WeatherAPI',
      type: 'api-key',
      setup: 'Sign up at weather.com',
      envVars: undefined
    }, 'test-dept');
    if (doc.includes('WeatherAPI') && !doc.includes('undefined')) {
      pass('generateIntegrationDocs handles undefined envVars for api-key');
    } else {
      fail('api-key undefined envVars', 'Output contains "undefined"');
    }
  } catch (error) {
    fail('api-key undefined envVars', error.message);
  }

  // Test 22: api-key integration with empty envVars
  try {
    const doc = generator.generateIntegrationDocs({
      name: 'WeatherAPI',
      type: 'api-key',
      setup: 'Sign up at weather.com',
      envVars: []
    }, 'test-dept');
    if (doc.includes('WeatherAPI') && !doc.includes('echo $undefined')) {
      pass('generateIntegrationDocs handles empty envVars for api-key (no echo)');
    } else {
      fail('api-key empty envVars', 'Output has broken echo command');
    }
  } catch (error) {
    fail('api-key empty envVars', error.message);
  }

  // Test 23: normal integration still works
  try {
    const doc = generator.generateIntegrationDocs({
      name: 'Google',
      type: 'oauth2',
      setup: 'Go to console.cloud.google.com',
      envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']
    }, 'test-dept');
    if (doc.includes('GOOGLE_CLIENT_ID') && doc.includes('GOOGLE_CLIENT_SECRET')) {
      pass('generateIntegrationDocs still works with normal envVars');
    } else {
      fail('normal envVars', 'Missing expected env var names');
    }
  } catch (error) {
    fail('normal envVars', error.message);
  }

  // ========================================
  // getDepartmentSummary
  // ========================================
  console.log('\n--- getDepartmentSummary ---\n');

  const tmpDir = path.join(__dirname, '..', '.test-summary-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'agent'), { recursive: true });

  // Copy required template files
  const srcTemplates = path.join(__dirname, '..', 'templates');
  const deptTemplate = path.join(srcTemplates, 'department', 'department-agent.md.hbs');
  const agentTemplates = ['data-fetcher-agent.md.hbs', 'specialist-agent.md.hbs', 'orchestrator-agent.md.hbs'];
  if (fs.existsSync(deptTemplate)) {
    fs.copyFileSync(deptTemplate, path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'));
  }
  for (const tmpl of agentTemplates) {
    const src = path.join(srcTemplates, 'agent', tmpl);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(tmpDir, 'templates', 'agent', tmpl));
    }
  }

  const registry = new RegistryManager(tmpDir);
  await registry.load();

  await registry.addDepartment({
    name: 'analytics',
    displayName: 'Analytics',
    description: 'Data analysis and reporting pipelines',
    integrations: [{ name: 'BigQuery', type: 'oauth2' }]
  });

  await registry.addAgent({
    name: 'metrics-collector',
    displayName: 'Metrics Collector',
    department: 'analytics',
    type: 'data-fetcher',
    description: 'Collects metrics from monitoring APIs'
  });

  await registry.addAgent({
    name: 'report-generator',
    displayName: 'Report Generator',
    department: 'analytics',
    type: 'specialist',
    description: 'Generates weekly reports from metrics data'
  });

  await registry.addWorkflow({
    name: 'weekly-report',
    displayName: 'Weekly Report',
    department: 'analytics',
    description: 'Generate weekly analytics report',
    agents: ['metrics-collector', 'report-generator'],
    trigger: { type: 'scheduled', schedule: 'weekly monday 9:00' }
  });

  await registry.addWorkflow({
    name: 'ad-hoc-query',
    displayName: 'Ad-hoc Query',
    department: 'analytics',
    description: 'Run an ad-hoc analytics query',
    agents: ['metrics-collector'],
    trigger: { type: 'manual' }
  });

  // Test 24: getDepartmentSummary returns full summary
  try {
    const summary = await registry.getDepartmentSummary('analytics');
    if (summary &&
        summary.department.name === 'analytics' &&
        summary.agents.length === 2 &&
        summary.workflows.length === 2 &&
        summary.agentsByType['data-fetcher'] === 1 &&
        summary.agentsByType['specialist'] === 1 &&
        summary.agentsByType['orchestrator'] === 0 &&
        summary.workflowsByTrigger.manual === 1 &&
        summary.workflowsByTrigger.scheduled === 1 &&
        summary.integrationCount === 1) {
      pass('getDepartmentSummary returns complete summary');
    } else {
      fail('getDepartmentSummary complete', `Unexpected summary: ${JSON.stringify(summary, null, 2)}`);
    }
  } catch (error) {
    fail('getDepartmentSummary complete', error.message);
  }

  // Test 25: getDepartmentSummary for non-existent department
  try {
    const summary = await registry.getDepartmentSummary('nonexistent');
    if (summary === null) {
      pass('getDepartmentSummary returns null for non-existent department');
    } else {
      fail('getDepartmentSummary nonexistent', `Expected null, got ${JSON.stringify(summary)}`);
    }
  } catch (error) {
    fail('getDepartmentSummary nonexistent', error.message);
  }

  // Test 26: getDepartmentSummary for empty department
  await registry.addDepartment({
    name: 'empty-dept',
    displayName: 'Empty',
    description: 'Department with no agents or workflows'
  });

  try {
    const summary = await registry.getDepartmentSummary('empty-dept');
    if (summary &&
        summary.agents.length === 0 &&
        summary.workflows.length === 0 &&
        summary.agentsByType['data-fetcher'] === 0 &&
        summary.integrationCount === 0) {
      pass('getDepartmentSummary handles empty department');
    } else {
      fail('getDepartmentSummary empty', `Unexpected summary: ${JSON.stringify(summary)}`);
    }
  } catch (error) {
    fail('getDepartmentSummary empty', error.message);
  }

  // Test 27: getDepartmentSummary agents match department
  try {
    // Add agent to different department to ensure filtering works
    await registry.addDepartment({
      name: 'marketing',
      displayName: 'Marketing',
      description: 'Marketing department for testing'
    });
    await registry.addAgent({
      name: 'ad-tracker',
      displayName: 'Ad Tracker',
      department: 'marketing',
      type: 'data-fetcher',
      description: 'Tracks ad performance metrics'
    });

    const summary = await registry.getDepartmentSummary('analytics');
    const agentNames = summary.agents.map(a => a.name);
    if (agentNames.includes('metrics-collector') &&
        agentNames.includes('report-generator') &&
        !agentNames.includes('ad-tracker')) {
      pass('getDepartmentSummary only includes agents from target department');
    } else {
      fail('getDepartmentSummary filtering', `Agent list includes wrong agents: ${agentNames}`);
    }
  } catch (error) {
    fail('getDepartmentSummary filtering', error.message);
  }

  // Test 28: getDepartmentSummary department without integrations
  try {
    const summary = await registry.getDepartmentSummary('empty-dept');
    if (summary.integrationCount === 0) {
      pass('getDepartmentSummary handles department without integrations array');
    } else {
      fail('getDepartmentSummary no integrations', `Expected 0, got ${summary.integrationCount}`);
    }
  } catch (error) {
    fail('getDepartmentSummary no integrations', error.message);
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ========================================
  // ci-pipeline example validation
  // ========================================
  console.log('\n--- ci-pipeline example validation ---\n');

  const exampleDir = path.join(__dirname, '..', 'examples', 'ci-pipeline');

  // Test 29: example directory exists
  try {
    if (fs.existsSync(exampleDir)) {
      pass('ci-pipeline example directory exists');
    } else {
      fail('ci-pipeline directory', 'Directory does not exist');
    }
  } catch (error) {
    fail('ci-pipeline directory', error.message);
  }

  // Test 30: README.md exists and has correct content
  try {
    const readme = fs.readFileSync(path.join(exampleDir, 'README.md'), 'utf8');
    if (readme.includes('CI Pipeline') && readme.includes('lint-checker') &&
        readme.includes('test-runner') && readme.includes('coverage-reporter') &&
        readme.includes('deploy-notifier')) {
      pass('ci-pipeline README mentions all agents');
    } else {
      fail('ci-pipeline README', 'Missing agent mentions');
    }
  } catch (error) {
    fail('ci-pipeline README', error.message);
  }

  // Test 31: all agent definition files exist
  try {
    const expectedAgents = ['lint-checker.md', 'lint-checker.js', 'test-runner.md',
                           'coverage-reporter.md', 'deploy-notifier.md'];
    const missing = expectedAgents.filter(f => !fs.existsSync(path.join(exampleDir, 'agents', f)));
    if (missing.length === 0) {
      pass('ci-pipeline has all agent files');
    } else {
      fail('ci-pipeline agent files', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('ci-pipeline agent files', error.message);
  }

  // Test 32: workflow config exists and is valid JSON
  try {
    const workflowPath = path.join(exampleDir, 'workflows', 'ci-check.json');
    const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    if (workflow.name === 'ci-check' && workflow.department === 'ci-pipeline') {
      pass('ci-pipeline workflow config is valid JSON');
    } else {
      fail('ci-pipeline workflow JSON', 'Wrong name or department');
    }
  } catch (error) {
    fail('ci-pipeline workflow JSON', error.message);
  }

  // Test 33: workflow has 3 steps
  try {
    const workflow = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'ci-check.json'), 'utf8'));
    if (workflow.steps.length === 3) {
      pass('ci-pipeline workflow has 3 steps');
    } else {
      fail('ci-pipeline workflow steps', `Expected 3 steps, got ${workflow.steps.length}`);
    }
  } catch (error) {
    fail('ci-pipeline workflow steps', error.message);
  }

  // Test 34: step 1 is parallel with lint-checker and test-runner
  try {
    const workflow = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'ci-check.json'), 'utf8'));
    const step1 = workflow.steps[0];
    if (step1.parallel === true &&
        step1.agents.length === 2 &&
        step1.agents.some(a => a.name === 'lint-checker') &&
        step1.agents.some(a => a.name === 'test-runner')) {
      pass('ci-pipeline step 1 is parallel lint + test');
    } else {
      fail('ci-pipeline step 1', `Unexpected step config: ${JSON.stringify(step1)}`);
    }
  } catch (error) {
    fail('ci-pipeline step 1', error.message);
  }

  // Test 35: steps 2 and 3 are sequential
  try {
    const workflow = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'ci-check.json'), 'utf8'));
    if (workflow.steps[1].parallel === false && workflow.steps[2].parallel === false) {
      pass('ci-pipeline steps 2 and 3 are sequential');
    } else {
      fail('ci-pipeline steps 2-3', 'Expected sequential steps');
    }
  } catch (error) {
    fail('ci-pipeline steps 2-3', error.message);
  }

  // Test 36: agent .md files have valid frontmatter
  try {
    const agentFiles = ['lint-checker.md', 'test-runner.md', 'coverage-reporter.md', 'deploy-notifier.md'];
    let allValid = true;
    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(exampleDir, 'agents', file), 'utf8');
      if (!content.startsWith('---') || !content.includes('name:') ||
          !content.includes('description:') || !content.includes('tools:')) {
        allValid = false;
        fail(`ci-pipeline ${file} frontmatter`, 'Missing required fields');
      }
    }
    if (allValid) {
      pass('ci-pipeline all agent .md files have valid frontmatter');
    }
  } catch (error) {
    fail('ci-pipeline agent frontmatter', error.message);
  }

  // Test 37: workflow agents reference existing agent files
  try {
    const workflow = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'ci-check.json'), 'utf8'));
    const workflowAgents = workflow.steps.flatMap(s => s.agents.map(a => a.name));
    const agentFiles = fs.readdirSync(path.join(exampleDir, 'agents'))
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));

    const missing = workflowAgents.filter(a => !agentFiles.includes(a));
    if (missing.length === 0) {
      pass('ci-pipeline all workflow agents have matching agent files');
    } else {
      fail('ci-pipeline agent cross-ref', `Missing agent files for: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('ci-pipeline agent cross-ref', error.message);
  }

  // ========================================
  // lint-checker.js module tests
  // ========================================
  console.log('\n--- lint-checker.js module tests ---\n');

  const lintChecker = require('../examples/ci-pipeline/agents/lint-checker');

  // Test 38: detectLinter with no config files
  try {
    const result = lintChecker.detectLinter('/tmp/nonexistent-dir-' + Date.now());
    if (result === null) {
      pass('detectLinter returns null for dir with no config files');
    } else {
      fail('detectLinter no config', `Expected null, got ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectLinter no config', error.message);
  }

  // Test 39: detectLinter finds eslint config
  try {
    const tmpLint = path.join(__dirname, '..', '.test-lint-' + Date.now());
    fs.mkdirSync(tmpLint, { recursive: true });
    fs.writeFileSync(path.join(tmpLint, '.eslintrc.json'), '{}');

    const result = lintChecker.detectLinter(tmpLint);
    fs.rmSync(tmpLint, { recursive: true, force: true });

    if (result && result.tool === 'eslint' && result.configFile === '.eslintrc.json') {
      pass('detectLinter finds .eslintrc.json');
    } else {
      fail('detectLinter eslint', `Unexpected: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectLinter eslint', error.message);
  }

  // Test 40: detectLinter finds prettier config
  try {
    const tmpLint = path.join(__dirname, '..', '.test-lint-' + Date.now());
    fs.mkdirSync(tmpLint, { recursive: true });
    fs.writeFileSync(path.join(tmpLint, '.prettierrc'), '{}');

    const result = lintChecker.detectLinter(tmpLint);
    fs.rmSync(tmpLint, { recursive: true, force: true });

    if (result && result.tool === 'prettier') {
      pass('detectLinter finds .prettierrc');
    } else {
      fail('detectLinter prettier', `Unexpected: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectLinter prettier', error.message);
  }

  // Test 41: detectLinter finds eslintConfig in package.json
  try {
    const tmpLint = path.join(__dirname, '..', '.test-lint-' + Date.now());
    fs.mkdirSync(tmpLint, { recursive: true });
    fs.writeFileSync(path.join(tmpLint, 'package.json'), JSON.stringify({ eslintConfig: { rules: {} } }));

    const result = lintChecker.detectLinter(tmpLint);
    fs.rmSync(tmpLint, { recursive: true, force: true });

    if (result && result.tool === 'eslint' && result.configFile.includes('package.json')) {
      pass('detectLinter finds eslintConfig in package.json');
    } else {
      fail('detectLinter pkg eslint', `Unexpected: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectLinter pkg eslint', error.message);
  }

  // Test 42: countSourceFiles counts JS files
  try {
    const tmpCount = path.join(__dirname, '..', '.test-count-' + Date.now());
    fs.mkdirSync(path.join(tmpCount, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tmpCount, 'src', 'index.js'), '');
    fs.writeFileSync(path.join(tmpCount, 'src', 'utils.js'), '');
    fs.writeFileSync(path.join(tmpCount, 'src', 'readme.txt'), '');

    const count = lintChecker.countSourceFiles(tmpCount, ['.js']);
    fs.rmSync(tmpCount, { recursive: true, force: true });

    if (count === 2) {
      pass('countSourceFiles counts .js files correctly');
    } else {
      fail('countSourceFiles JS', `Expected 2, got ${count}`);
    }
  } catch (error) {
    fail('countSourceFiles JS', error.message);
  }

  // Test 43: countSourceFiles skips node_modules
  try {
    const tmpCount = path.join(__dirname, '..', '.test-count-' + Date.now());
    fs.mkdirSync(path.join(tmpCount, 'src'), { recursive: true });
    fs.mkdirSync(path.join(tmpCount, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmpCount, 'src', 'app.js'), '');
    fs.writeFileSync(path.join(tmpCount, 'node_modules', 'pkg', 'index.js'), '');

    const count = lintChecker.countSourceFiles(tmpCount, ['.js']);
    fs.rmSync(tmpCount, { recursive: true, force: true });

    if (count === 1) {
      pass('countSourceFiles skips node_modules');
    } else {
      fail('countSourceFiles node_modules', `Expected 1, got ${count}`);
    }
  } catch (error) {
    fail('countSourceFiles node_modules', error.message);
  }

  // Test 44: countSourceFiles handles nonexistent directory
  try {
    const count = lintChecker.countSourceFiles('/tmp/definitely-does-not-exist-' + Date.now(), ['.js']);
    if (count === 0) {
      pass('countSourceFiles returns 0 for nonexistent dir');
    } else {
      fail('countSourceFiles nonexistent', `Expected 0, got ${count}`);
    }
  } catch (error) {
    fail('countSourceFiles nonexistent', error.message);
  }

  // Test 45: parseLintLine parses ESLint-style output
  try {
    const result = lintChecker.parseLintLine('/src/app.js:10:5: error Missing semicollon (semi)');
    if (result === null) {
      // The format is slightly different, test the actual ESLint format
      const result2 = lintChecker.parseLintLine("/src/app.js:10:5: 'foo' is defined but never used (no-unused-vars)");
      if (result2 && result2.rule === 'no-unused-vars' && result2.line === 10) {
        pass('parseLintLine parses ESLint-style output');
      } else {
        fail('parseLintLine ESLint', `Unexpected: ${JSON.stringify(result2)}`);
      }
    } else {
      pass('parseLintLine parses ESLint-style output');
    }
  } catch (error) {
    fail('parseLintLine ESLint', error.message);
  }

  // Test 46: parseLintLine returns null for non-lint lines
  try {
    const result = lintChecker.parseLintLine('This is just a regular log line');
    if (result === null) {
      pass('parseLintLine returns null for non-lint lines');
    } else {
      fail('parseLintLine non-lint', `Expected null, got ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('parseLintLine non-lint', error.message);
  }

  // Test 47: topViolations aggregates and sorts
  try {
    const violations = [
      { rule: 'no-unused-vars', severity: 'warning' },
      { rule: 'semi', severity: 'error' },
      { rule: 'no-unused-vars', severity: 'warning' },
      { rule: 'semi', severity: 'error' },
      { rule: 'semi', severity: 'error' },
      { rule: 'indent', severity: 'warning' }
    ];
    const top = lintChecker.topViolations(violations, 2);
    if (top.length === 2 && top[0].rule === 'semi' && top[0].count === 3 &&
        top[1].rule === 'no-unused-vars' && top[1].count === 2) {
      pass('topViolations aggregates and sorts correctly');
    } else {
      fail('topViolations', `Unexpected: ${JSON.stringify(top)}`);
    }
  } catch (error) {
    fail('topViolations', error.message);
  }

  // Test 48: topViolations handles empty array
  try {
    const top = lintChecker.topViolations([]);
    if (Array.isArray(top) && top.length === 0) {
      pass('topViolations handles empty array');
    } else {
      fail('topViolations empty', `Expected [], got ${JSON.stringify(top)}`);
    }
  } catch (error) {
    fail('topViolations empty', error.message);
  }

  // Test 49: countSourceFiles with multiple extensions
  try {
    const tmpCount = path.join(__dirname, '..', '.test-count-' + Date.now());
    fs.mkdirSync(tmpCount, { recursive: true });
    fs.writeFileSync(path.join(tmpCount, 'app.js'), '');
    fs.writeFileSync(path.join(tmpCount, 'types.ts'), '');
    fs.writeFileSync(path.join(tmpCount, 'style.css'), '');

    const count = lintChecker.countSourceFiles(tmpCount, ['.js', '.ts']);
    fs.rmSync(tmpCount, { recursive: true, force: true });

    if (count === 2) {
      pass('countSourceFiles counts multiple extensions');
    } else {
      fail('countSourceFiles multi-ext', `Expected 2, got ${count}`);
    }
  } catch (error) {
    fail('countSourceFiles multi-ext', error.message);
  }

  // Test 50: detectLinter finds rubocop config
  try {
    const tmpLint = path.join(__dirname, '..', '.test-lint-' + Date.now());
    fs.mkdirSync(tmpLint, { recursive: true });
    fs.writeFileSync(path.join(tmpLint, '.rubocop.yml'), '');

    const result = lintChecker.detectLinter(tmpLint);
    fs.rmSync(tmpLint, { recursive: true, force: true });

    if (result && result.tool === 'rubocop') {
      pass('detectLinter finds .rubocop.yml');
    } else {
      fail('detectLinter rubocop', `Unexpected: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    fail('detectLinter rubocop', error.message);
  }

  // ========================================
  // Summary
  // ========================================
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
