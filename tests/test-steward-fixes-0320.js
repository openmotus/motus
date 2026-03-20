#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-20
 *
 * Tests covering:
 * - TypeScript type definitions file existence and structure
 * - Name validation in addDepartment (rejects invalid names)
 * - Name validation in addAgent (rejects invalid names)
 * - Name validation in addWorkflow (rejects invalid names)
 * - Agent existence warnings in addWorkflow
 * - package.json types field
 */

const fs = require('fs');
const path = require('path');
const RegistryManager = require('../lib/registry-manager');

async function runTests() {
  console.log('🧪 Steward Fixes — 2026-03-20\n');

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
  // TypeScript type definitions
  // ========================================
  console.log('\n--- TypeScript type definitions ---\n');

  // Test 1: index.d.ts exists
  try {
    const dtsPath = path.join(__dirname, '..', 'index.d.ts');
    if (fs.existsSync(dtsPath)) {
      pass('index.d.ts file exists');
    } else {
      fail('index.d.ts file exists', 'File not found');
    }
  } catch (error) {
    fail('index.d.ts file exists', error.message);
  }

  // Test 2: index.d.ts exports RegistryManager
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export class RegistryManager')) {
      pass('index.d.ts exports RegistryManager class');
    } else {
      fail('index.d.ts exports RegistryManager class', 'Missing RegistryManager export');
    }
  } catch (error) {
    fail('index.d.ts exports RegistryManager class', error.message);
  }

  // Test 3: index.d.ts exports TemplateEngine
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export class TemplateEngine')) {
      pass('index.d.ts exports TemplateEngine class');
    } else {
      fail('index.d.ts exports TemplateEngine class', 'Missing TemplateEngine export');
    }
  } catch (error) {
    fail('index.d.ts exports TemplateEngine class', error.message);
  }

  // Test 4: index.d.ts exports Validator
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export class Validator')) {
      pass('index.d.ts exports Validator class');
    } else {
      fail('index.d.ts exports Validator class', 'Missing Validator export');
    }
  } catch (error) {
    fail('index.d.ts exports Validator class', error.message);
  }

  // Test 5: index.d.ts exports DocGenerator
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export class DocGenerator')) {
      pass('index.d.ts exports DocGenerator class');
    } else {
      fail('index.d.ts exports DocGenerator class', 'Missing DocGenerator export');
    }
  } catch (error) {
    fail('index.d.ts exports DocGenerator class', error.message);
  }

  // Test 6: index.d.ts exports OAuthRegistry
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export class OAuthRegistry')) {
      pass('index.d.ts exports OAuthRegistry class');
    } else {
      fail('index.d.ts exports OAuthRegistry class', 'Missing OAuthRegistry export');
    }
  } catch (error) {
    fail('index.d.ts exports OAuthRegistry class', error.message);
  }

  // Test 7: index.d.ts defines AgentType
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes("export type AgentType = 'data-fetcher' | 'orchestrator' | 'specialist'")) {
      pass('index.d.ts defines AgentType union');
    } else {
      fail('index.d.ts defines AgentType union', 'Missing AgentType definition');
    }
  } catch (error) {
    fail('index.d.ts defines AgentType union', error.message);
  }

  // Test 8: index.d.ts defines Department interface
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface Department')) {
      pass('index.d.ts defines Department interface');
    } else {
      fail('index.d.ts defines Department interface', 'Missing Department interface');
    }
  } catch (error) {
    fail('index.d.ts defines Department interface', error.message);
  }

  // Test 9: index.d.ts defines Agent interface
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface Agent')) {
      pass('index.d.ts defines Agent interface');
    } else {
      fail('index.d.ts defines Agent interface', 'Missing Agent interface');
    }
  } catch (error) {
    fail('index.d.ts defines Agent interface', error.message);
  }

  // Test 10: index.d.ts defines Workflow interface
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface Workflow')) {
      pass('index.d.ts defines Workflow interface');
    } else {
      fail('index.d.ts defines Workflow interface', 'Missing Workflow interface');
    }
  } catch (error) {
    fail('index.d.ts defines Workflow interface', error.message);
  }

  // Test 11: index.d.ts defines Statistics interface
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface Statistics')) {
      pass('index.d.ts defines Statistics interface');
    } else {
      fail('index.d.ts defines Statistics interface', 'Missing Statistics interface');
    }
  } catch (error) {
    fail('index.d.ts defines Statistics interface', error.message);
  }

  // Test 12: index.d.ts defines SearchResults interface
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface SearchResults')) {
      pass('index.d.ts defines SearchResults interface');
    } else {
      fail('index.d.ts defines SearchResults interface', 'Missing SearchResults interface');
    }
  } catch (error) {
    fail('index.d.ts defines SearchResults interface', error.message);
  }

  // Test 13: package.json has types field
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    if (pkg.types === 'index.d.ts') {
      pass('package.json types field points to index.d.ts');
    } else {
      fail('package.json types field points to index.d.ts', `Got: ${pkg.types}`);
    }
  } catch (error) {
    fail('package.json types field points to index.d.ts', error.message);
  }

  // Test 14: package.json files array includes index.d.ts
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    if (pkg.files && pkg.files.includes('index.d.ts')) {
      pass('package.json files array includes index.d.ts');
    } else {
      fail('package.json files array includes index.d.ts', `files: ${JSON.stringify(pkg.files)}`);
    }
  } catch (error) {
    fail('package.json files array includes index.d.ts', error.message);
  }

  // Test 15: index.d.ts defines all RegistryManager methods
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    const requiredMethods = [
      'load()', 'save()', 'addDepartment(', 'updateDepartment(', 'getDepartment(',
      'listDepartments(', 'departmentExists(', 'getDepartmentSummary(',
      'addAgent(', 'updateAgent(', 'getAgent(', 'listAgents(',
      'addWorkflow(', 'updateWorkflow(', 'getWorkflow(', 'listWorkflows(',
      'getWorkflowsByAgent(', 'getStatistics()', 'validate()', 'validateFiles()',
      'search(', 'reset()', 'export()', 'import('
    ];
    const missing = requiredMethods.filter(m => !dtsContent.includes(m));
    if (missing.length === 0) {
      pass('index.d.ts declares all RegistryManager methods');
    } else {
      fail('index.d.ts declares all RegistryManager methods', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('index.d.ts declares all RegistryManager methods', error.message);
  }

  // ========================================
  // Name validation in addDepartment
  // ========================================
  console.log('\n--- addDepartment name validation ---\n');

  // Create a temp directory for isolated registry tests
  const tmpDir = path.join(__dirname, '..', '.tmp-test-0320-' + Date.now());
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  // Create a minimal department-agent.md.hbs template
  fs.writeFileSync(path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'), '# {{name}}');

  const registry = new RegistryManager(tmpDir);
  await registry.load();

  // Test 16: addDepartment rejects uppercase name
  try {
    await registry.addDepartment({ name: 'MARKETING', displayName: 'Marketing', description: 'Handles marketing automation tasks' });
    fail('addDepartment rejects uppercase name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid department name') && error.message.includes('kebab-case')) {
      pass('addDepartment rejects uppercase name');
    } else {
      fail('addDepartment rejects uppercase name', `Wrong error: ${error.message}`);
    }
  }

  // Test 17: addDepartment rejects name with spaces
  try {
    await registry.addDepartment({ name: 'my dept', displayName: 'My Dept', description: 'Handles department tasks well' });
    fail('addDepartment rejects name with spaces', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid department name')) {
      pass('addDepartment rejects name with spaces');
    } else {
      fail('addDepartment rejects name with spaces', `Wrong error: ${error.message}`);
    }
  }

  // Test 18: addDepartment rejects too-short name
  try {
    await registry.addDepartment({ name: 'ab', displayName: 'AB', description: 'Short name department test' });
    fail('addDepartment rejects too-short name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid department name')) {
      pass('addDepartment rejects too-short name');
    } else {
      fail('addDepartment rejects too-short name', `Wrong error: ${error.message}`);
    }
  }

  // Test 19: addDepartment accepts valid kebab-case name
  try {
    const dept = await registry.addDepartment({ name: 'marketing', displayName: 'Marketing', description: 'Handles marketing automation tasks' });
    if (dept.name === 'marketing') {
      pass('addDepartment accepts valid kebab-case name');
    } else {
      fail('addDepartment accepts valid kebab-case name', `Got: ${dept.name}`);
    }
  } catch (error) {
    fail('addDepartment accepts valid kebab-case name', error.message);
  }

  // Test 20: addDepartment accepts valid hyphenated name
  try {
    const dept = await registry.addDepartment({ name: 'customer-success', displayName: 'Customer Success', description: 'Customer success operations dept' });
    if (dept.name === 'customer-success') {
      pass('addDepartment accepts valid hyphenated name');
    } else {
      fail('addDepartment accepts valid hyphenated name', `Got: ${dept.name}`);
    }
  } catch (error) {
    fail('addDepartment accepts valid hyphenated name', error.message);
  }

  // ========================================
  // Name validation in addAgent
  // ========================================
  console.log('\n--- addAgent name validation ---\n');

  // Create agent templates
  fs.mkdirSync(path.join(tmpDir, 'templates', 'agent'), { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'templates', 'agent', 'data-fetcher-agent.md.hbs'), '# {{name}}');
  fs.writeFileSync(path.join(tmpDir, 'templates', 'agent', 'specialist-agent.md.hbs'), '# {{name}}');
  fs.writeFileSync(path.join(tmpDir, 'templates', 'agent', 'orchestrator-agent.md.hbs'), '# {{name}}');

  // Test 21: addAgent rejects uppercase name
  try {
    await registry.addAgent({ name: 'WeatherFetcher', displayName: 'Weather Fetcher', department: 'marketing', type: 'data-fetcher', description: 'Fetches weather data from API' });
    fail('addAgent rejects uppercase name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid agent name') && error.message.includes('kebab-case')) {
      pass('addAgent rejects uppercase name');
    } else {
      fail('addAgent rejects uppercase name', `Wrong error: ${error.message}`);
    }
  }

  // Test 22: addAgent rejects single-word name (action-noun required)
  try {
    await registry.addAgent({ name: 'fetcher', displayName: 'Fetcher', department: 'marketing', type: 'data-fetcher', description: 'Fetches data from API' });
    fail('addAgent rejects single-word name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid agent name') && error.message.includes('action-noun')) {
      pass('addAgent rejects single-word name');
    } else {
      fail('addAgent rejects single-word name', `Wrong error: ${error.message}`);
    }
  }

  // Test 23: addAgent rejects name with underscores
  try {
    await registry.addAgent({ name: 'weather_fetcher', displayName: 'Weather Fetcher', department: 'marketing', type: 'data-fetcher', description: 'Fetches weather data from API' });
    fail('addAgent rejects name with underscores', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid agent name')) {
      pass('addAgent rejects name with underscores');
    } else {
      fail('addAgent rejects name with underscores', `Wrong error: ${error.message}`);
    }
  }

  // Test 24: addAgent accepts valid kebab-case action-noun name
  try {
    const agent = await registry.addAgent({ name: 'weather-fetcher', displayName: 'Weather Fetcher', department: 'marketing', type: 'data-fetcher', description: 'Fetches weather data from API' });
    if (agent.name === 'weather-fetcher') {
      pass('addAgent accepts valid kebab-case action-noun name');
    } else {
      fail('addAgent accepts valid kebab-case action-noun name', `Got: ${agent.name}`);
    }
  } catch (error) {
    fail('addAgent accepts valid kebab-case action-noun name', error.message);
  }

  // Test 25: addAgent accepts multi-hyphenated name
  try {
    const agent = await registry.addAgent({ name: 'trend-data-analyzer', displayName: 'Trend Data Analyzer', department: 'marketing', type: 'specialist', description: 'Analyzes trend data and generates reports' });
    if (agent.name === 'trend-data-analyzer') {
      pass('addAgent accepts multi-hyphenated name');
    } else {
      fail('addAgent accepts multi-hyphenated name', `Got: ${agent.name}`);
    }
  } catch (error) {
    fail('addAgent accepts multi-hyphenated name', error.message);
  }

  // ========================================
  // Name validation in addWorkflow
  // ========================================
  console.log('\n--- addWorkflow name validation ---\n');

  // Test 26: addWorkflow rejects uppercase name
  try {
    await registry.addWorkflow({ name: 'DailyBrief', displayName: 'Daily Brief', department: 'marketing', description: 'Daily briefing workflow for team' });
    fail('addWorkflow rejects uppercase name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid workflow name') && error.message.includes('kebab-case')) {
      pass('addWorkflow rejects uppercase name');
    } else {
      fail('addWorkflow rejects uppercase name', `Wrong error: ${error.message}`);
    }
  }

  // Test 27: addWorkflow rejects name with spaces
  try {
    await registry.addWorkflow({ name: 'daily brief', displayName: 'Daily Brief', department: 'marketing', description: 'Daily briefing workflow for team' });
    fail('addWorkflow rejects name with spaces', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid workflow name')) {
      pass('addWorkflow rejects name with spaces');
    } else {
      fail('addWorkflow rejects name with spaces', `Wrong error: ${error.message}`);
    }
  }

  // Test 28: addWorkflow rejects too-short name
  try {
    await registry.addWorkflow({ name: 'ab', displayName: 'AB', department: 'marketing', description: 'Short name workflow for testing' });
    fail('addWorkflow rejects too-short name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid workflow name')) {
      pass('addWorkflow rejects too-short name');
    } else {
      fail('addWorkflow rejects too-short name', `Wrong error: ${error.message}`);
    }
  }

  // Test 29: addWorkflow accepts valid kebab-case name
  try {
    const wf = await registry.addWorkflow({ name: 'daily-brief', displayName: 'Daily Brief', department: 'marketing', description: 'Daily briefing workflow for team' });
    if (wf.name === 'daily-brief') {
      pass('addWorkflow accepts valid kebab-case name');
    } else {
      fail('addWorkflow accepts valid kebab-case name', `Got: ${wf.name}`);
    }
  } catch (error) {
    fail('addWorkflow accepts valid kebab-case name', error.message);
  }

  // Test 30: addWorkflow accepts multi-hyphenated name
  try {
    const wf = await registry.addWorkflow({ name: 'weekly-status-report', displayName: 'Weekly Status Report', department: 'marketing', description: 'Weekly status report generation for team' });
    if (wf.name === 'weekly-status-report') {
      pass('addWorkflow accepts multi-hyphenated name');
    } else {
      fail('addWorkflow accepts multi-hyphenated name', `Got: ${wf.name}`);
    }
  } catch (error) {
    fail('addWorkflow accepts multi-hyphenated name', error.message);
  }

  // ========================================
  // Agent existence warnings in addWorkflow
  // ========================================
  console.log('\n--- addWorkflow agent existence warnings ---\n');

  // Test 31: addWorkflow with existing agents tracks usedInWorkflows
  try {
    const wf = await registry.addWorkflow({
      name: 'agent-workflow',
      displayName: 'Agent Workflow',
      department: 'marketing',
      description: 'Workflow that uses existing agents',
      agents: ['weather-fetcher']
    });
    const agent = registry.getAgent('weather-fetcher');
    if (agent.usedInWorkflows.includes('marketing-agent-workflow')) {
      pass('addWorkflow with existing agent updates usedInWorkflows');
    } else {
      fail('addWorkflow with existing agent updates usedInWorkflows', `usedInWorkflows: ${JSON.stringify(agent.usedInWorkflows)}`);
    }
  } catch (error) {
    fail('addWorkflow with existing agent updates usedInWorkflows', error.message);
  }

  // Test 32: addWorkflow with non-existent agents still succeeds (warns but doesn't throw)
  try {
    // Capture console.warn output
    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (msg) => { warnMessage = msg; };

    const wf = await registry.addWorkflow({
      name: 'missing-agents-workflow',
      displayName: 'Missing Agents Workflow',
      department: 'marketing',
      description: 'Workflow that references missing agents',
      agents: ['nonexistent-fetcher', 'weather-fetcher']
    });

    console.warn = originalWarn;

    if (wf.name === 'missing-agents-workflow') {
      pass('addWorkflow with non-existent agents succeeds');
    } else {
      fail('addWorkflow with non-existent agents succeeds', 'Workflow not created');
    }
  } catch (error) {
    fail('addWorkflow with non-existent agents succeeds', error.message);
  }

  // Test 33: addWorkflow with non-existent agents produces warning
  try {
    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (msg) => { warnMessage = msg; };

    await registry.addWorkflow({
      name: 'warn-test-workflow',
      displayName: 'Warn Test Workflow',
      department: 'marketing',
      description: 'Workflow to test warning messages',
      agents: ['totally-fake-agent']
    });

    console.warn = originalWarn;

    if (warnMessage.includes('totally-fake-agent') && warnMessage.includes('not yet in registry')) {
      pass('addWorkflow warns about non-existent agents');
    } else {
      fail('addWorkflow warns about non-existent agents', `Warning: "${warnMessage}"`);
    }
  } catch (error) {
    fail('addWorkflow warns about non-existent agents', error.message);
  }

  // Test 34: addWorkflow with all-existing agents produces no warning
  try {
    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (msg) => { warnMessage = msg; };

    await registry.addWorkflow({
      name: 'no-warn-workflow',
      displayName: 'No Warn Workflow',
      department: 'marketing',
      description: 'Workflow with only existing agents',
      agents: ['weather-fetcher', 'trend-data-analyzer']
    });

    console.warn = originalWarn;

    if (warnMessage === '') {
      pass('addWorkflow with all-existing agents produces no warning');
    } else {
      fail('addWorkflow with all-existing agents produces no warning', `Unexpected warning: "${warnMessage}"`);
    }
  } catch (error) {
    fail('addWorkflow with all-existing agents produces no warning', error.message);
  }

  // Test 35: addWorkflow with empty agents array produces no warning
  try {
    const originalWarn = console.warn;
    let warnMessage = '';
    console.warn = (msg) => { warnMessage = msg; };

    await registry.addWorkflow({
      name: 'empty-agents-workflow',
      displayName: 'Empty Agents Workflow',
      department: 'marketing',
      description: 'Workflow with no agents specified',
      agents: []
    });

    console.warn = originalWarn;

    if (warnMessage === '') {
      pass('addWorkflow with empty agents array produces no warning');
    } else {
      fail('addWorkflow with empty agents array produces no warning', `Unexpected warning: "${warnMessage}"`);
    }
  } catch (error) {
    fail('addWorkflow with empty agents array produces no warning', error.message);
  }

  // ========================================
  // RegistryManager has validator instance
  // ========================================
  console.log('\n--- RegistryManager validator integration ---\n');

  // Test 36: RegistryManager has validator property
  try {
    const reg = new RegistryManager(tmpDir);
    if (reg.validator && typeof reg.validator.validateDepartmentName === 'function') {
      pass('RegistryManager has validator with validateDepartmentName');
    } else {
      fail('RegistryManager has validator with validateDepartmentName', 'Missing validator or method');
    }
  } catch (error) {
    fail('RegistryManager has validator with validateDepartmentName', error.message);
  }

  // Test 37: RegistryManager validator has validateAgentName
  try {
    const reg = new RegistryManager(tmpDir);
    if (typeof reg.validator.validateAgentName === 'function') {
      pass('RegistryManager validator has validateAgentName');
    } else {
      fail('RegistryManager validator has validateAgentName', 'Missing method');
    }
  } catch (error) {
    fail('RegistryManager validator has validateAgentName', error.message);
  }

  // Test 38: RegistryManager validator has validateWorkflowName
  try {
    const reg = new RegistryManager(tmpDir);
    if (typeof reg.validator.validateWorkflowName === 'function') {
      pass('RegistryManager validator has validateWorkflowName');
    } else {
      fail('RegistryManager validator has validateWorkflowName', 'Missing method');
    }
  } catch (error) {
    fail('RegistryManager validator has validateWorkflowName', error.message);
  }

  // ========================================
  // Edge cases: validation error messages
  // ========================================
  console.log('\n--- Validation error message quality ---\n');

  // Test 39: addDepartment error includes the invalid name
  try {
    await registry.addDepartment({ name: 'BAD_NAME', displayName: 'Bad', description: 'Testing invalid department name handling' });
    fail('addDepartment error includes invalid name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('BAD_NAME')) {
      pass('addDepartment error includes invalid name');
    } else {
      fail('addDepartment error includes invalid name', `Error: ${error.message}`);
    }
  }

  // Test 40: addAgent error includes the invalid name
  try {
    await registry.addAgent({ name: 'Bad Agent', displayName: 'Bad', department: 'marketing', type: 'specialist', description: 'Testing invalid agent name handling' });
    fail('addAgent error includes invalid name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Bad Agent')) {
      pass('addAgent error includes invalid name');
    } else {
      fail('addAgent error includes invalid name', `Error: ${error.message}`);
    }
  }

  // Test 41: addWorkflow error includes the invalid name
  try {
    await registry.addWorkflow({ name: 'Bad_Workflow!', displayName: 'Bad', department: 'marketing', description: 'Testing invalid workflow name handling' });
    fail('addWorkflow error includes invalid name', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Bad_Workflow!')) {
      pass('addWorkflow error includes invalid name');
    } else {
      fail('addWorkflow error includes invalid name', `Error: ${error.message}`);
    }
  }

  // Test 42: name validation happens before duplicate check
  try {
    // 'marketing' already exists, but 'MARKETING' should fail name validation first
    await registry.addDepartment({ name: 'MARKETING', displayName: 'Marketing', description: 'Testing validation order priority' });
    fail('name validation before duplicate check', 'Should have thrown');
  } catch (error) {
    if (error.message.includes('Invalid department name')) {
      pass('name validation before duplicate check (rejects bad name, not duplicate)');
    } else {
      fail('name validation before duplicate check', `Got error: ${error.message}`);
    }
  }

  // Test 43: addDepartment accepts name with numbers
  try {
    const dept = await registry.addDepartment({ name: 'team42-ops', displayName: 'Team 42 Ops', description: 'Operations for team 42 division' });
    if (dept.name === 'team42-ops') {
      pass('addDepartment accepts name with numbers');
    } else {
      fail('addDepartment accepts name with numbers', `Got: ${dept.name}`);
    }
  } catch (error) {
    fail('addDepartment accepts name with numbers', error.message);
  }

  // ========================================
  // TypeScript definitions: Validator methods
  // ========================================
  console.log('\n--- TypeScript definitions: method coverage ---\n');

  // Test 44: index.d.ts declares all Validator methods
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    const requiredMethods = [
      'validateDepartmentName(', 'validateAgentName(', 'validateWorkflowName(',
      'validateEnvVarName(', 'detectAgentType(', 'detectParallelExecution(',
      'validateDescription(', 'validateUrl(', 'validateSchedule(',
      'validateFilePath(', 'validateAgentContext(', 'validateDepartmentContext(',
      'validateWorkflowContext(', 'suggestAgentName(', 'suggestTools(',
      'suggestEnvVarName('
    ];
    const missing = requiredMethods.filter(m => !dtsContent.includes(m));
    if (missing.length === 0) {
      pass('index.d.ts declares all Validator methods');
    } else {
      fail('index.d.ts declares all Validator methods', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('index.d.ts declares all Validator methods', error.message);
  }

  // Test 45: index.d.ts declares TemplateEngine methods
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    const requiredMethods = [
      'loadTemplate(', 'resolveTemplatePath(', 'render(', 'renderToFile(',
      'clearCache()', 'listTemplates(', 'validateContext('
    ];
    const missing = requiredMethods.filter(m => !dtsContent.includes(m));
    if (missing.length === 0) {
      pass('index.d.ts declares all TemplateEngine methods');
    } else {
      fail('index.d.ts declares all TemplateEngine methods', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('index.d.ts declares all TemplateEngine methods', error.message);
  }

  // Test 46: index.d.ts declares DocGenerator methods
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    const requiredMethods = [
      'generate()', 'generateCommandsReference()', 'generateDepartmentDocs()',
      'generateIntegrationDocs(', 'updateClaudeMd()'
    ];
    const missing = requiredMethods.filter(m => !dtsContent.includes(m));
    if (missing.length === 0) {
      pass('index.d.ts declares all DocGenerator methods');
    } else {
      fail('index.d.ts declares all DocGenerator methods', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('index.d.ts declares all DocGenerator methods', error.message);
  }

  // Test 47: index.d.ts declares input types (AddDepartmentData, AddAgentData, AddWorkflowData)
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    const requiredTypes = ['AddDepartmentData', 'AddAgentData', 'AddWorkflowData'];
    const missing = requiredTypes.filter(t => !dtsContent.includes(`export interface ${t}`));
    if (missing.length === 0) {
      pass('index.d.ts declares all input types');
    } else {
      fail('index.d.ts declares all input types', `Missing: ${missing.join(', ')}`);
    }
  } catch (error) {
    fail('index.d.ts declares all input types', error.message);
  }

  // Test 48: index.d.ts declares DepartmentSummary
  try {
    const dtsContent = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    if (dtsContent.includes('export interface DepartmentSummary')) {
      pass('index.d.ts declares DepartmentSummary interface');
    } else {
      fail('index.d.ts declares DepartmentSummary interface', 'Missing DepartmentSummary');
    }
  } catch (error) {
    fail('index.d.ts declares DepartmentSummary interface', error.message);
  }

  // ========================================
  // Cleanup
  // ========================================
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ========================================
  // Results
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
