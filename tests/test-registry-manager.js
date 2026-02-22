#!/usr/bin/env node

/**
 * Registry Manager Test Suite
 *
 * Comprehensive tests for RegistryManager covering:
 * - Multi-department CRUD operations
 * - Workflow CRUD and cross-references
 * - Search, import/export, reset
 * - validateFiles() file-sync checking
 * - Filter operations (listAgents, listWorkflows, listDepartments)
 * - Error handling for all operations
 * - ensureLoaded guard
 * - Module entry point (index.js)
 */

const RegistryManager = require('../lib/registry-manager');
const fs = require('fs').promises;
const path = require('path');

let testCount = 0;
let passCount = 0;
let failCount = 0;
const failedTests = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function test(name, fn) {
  testCount++;
  try {
    await fn();
    passCount++;
    console.log(`\u2713 ${name}`);
  } catch (error) {
    failCount++;
    console.error(`\u2717 ${name}`);
    console.error(`  Error: ${error.message}`);
    failedTests.push({ name, error: error.message });
  }
}

async function runTests() {
  console.log('Registry Manager Test Suite');
  console.log('='.repeat(60) + '\n');

  const testDir = path.join(__dirname, '..', 'test-registry-manager');

  // ========================================
  // MODULE ENTRY POINT
  // ========================================

  console.log('Module Entry Point\n');

  await test('index.js: exports RegistryManager', async () => {
    const motus = require('../index');
    assert(motus.RegistryManager, 'RegistryManager should be exported');
    assert(typeof motus.RegistryManager === 'function', 'RegistryManager should be a constructor');
  });

  await test('index.js: exports TemplateEngine', async () => {
    const motus = require('../index');
    assert(motus.TemplateEngine, 'TemplateEngine should be exported');
  });

  await test('index.js: exports Validator', async () => {
    const motus = require('../index');
    assert(motus.Validator, 'Validator should be exported');
  });

  await test('index.js: exports DocGenerator', async () => {
    const motus = require('../index');
    assert(motus.DocGenerator, 'DocGenerator should be exported');
  });

  await test('index.js: exports OAuthRegistry', async () => {
    const motus = require('../index');
    assert(motus.OAuthRegistry, 'OAuthRegistry should be exported');
  });

  await test('index.js: RegistryManager is usable', async () => {
    const { RegistryManager: RM } = require('../index');
    const r = new RM(testDir);
    assert(r instanceof RM, 'Should create instance from exported class');
  });

  // ========================================
  // ENSURE LOADED GUARD
  // ========================================

  console.log('\nensureLoaded Guard\n');

  await test('ensureLoaded: throws before load()', async () => {
    const r = new RegistryManager(testDir);
    try {
      r.getDepartment('test');
      assert(false, 'Should have thrown');
    } catch (e) {
      assert(e.message.includes('not loaded'), 'Should mention not loaded');
      assert(e.message.includes('registry.load()'), 'Should suggest calling load()');
    }
  });

  await test('ensureLoaded: departmentExists throws before load', async () => {
    const r = new RegistryManager(testDir);
    try {
      r.departmentExists('test');
      assert(false, 'Should have thrown');
    } catch (e) {
      assert(e.message.includes('not loaded'), 'Should mention not loaded');
    }
  });

  await test('ensureLoaded: agentExists throws before load', async () => {
    const r = new RegistryManager(testDir);
    try {
      r.agentExists('test');
      assert(false, 'Should have thrown');
    } catch (e) {
      assert(e.message.includes('not loaded'), 'Should mention not loaded');
    }
  });

  await test('ensureLoaded: workflowExists throws before load', async () => {
    const r = new RegistryManager(testDir);
    try {
      r.workflowExists('dept', 'test');
      assert(false, 'Should have thrown');
    } catch (e) {
      assert(e.message.includes('not loaded'), 'Should mention not loaded');
    }
  });

  // ========================================
  // MISSING FIELDS ERRORS
  // ========================================

  console.log('\nMissing Fields Validation\n');

  let registry;

  await test('load: initializes empty registries', async () => {
    await fs.rm(testDir, { recursive: true, force: true });
    registry = new RegistryManager(testDir);
    await registry.load();
    assert(registry.loaded, 'Should be loaded');
  });

  await test('addDepartment: missing name throws', async () => {
    try {
      await registry.addDepartment({ displayName: 'Test', description: 'Test dept' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('name'), 'Should mention missing name');
    }
  });

  await test('addDepartment: missing displayName throws', async () => {
    try {
      await registry.addDepartment({ name: 'test', description: 'Test dept' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('displayName'), 'Should mention missing displayName');
    }
  });

  await test('addDepartment: missing description throws', async () => {
    try {
      await registry.addDepartment({ name: 'test', displayName: 'Test' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('description'), 'Should mention missing description');
    }
  });

  await test('addDepartment: multiple missing fields listed', async () => {
    try {
      await registry.addDepartment({});
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('name'), 'Should list name');
      assert(e.message.includes('displayName'), 'Should list displayName');
      assert(e.message.includes('description'), 'Should list description');
    }
  });

  // Set up a department for agent/workflow tests
  await test('setup: create test department', async () => {
    await registry.addDepartment({
      name: 'test-dept',
      displayName: 'Test Department',
      description: 'Department for testing',
      integrations: []
    });
    assert(registry.departmentExists('test-dept'), 'Department created');
  });

  await test('addAgent: missing name throws', async () => {
    try {
      await registry.addAgent({
        displayName: 'X', department: 'test-dept', type: 'specialist', description: 'x'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('name'), 'Should mention missing name');
    }
  });

  await test('addAgent: missing type throws', async () => {
    try {
      await registry.addAgent({
        name: 'test-agent', displayName: 'X', department: 'test-dept', description: 'x'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('type'), 'Should mention missing type');
    }
  });

  await test('addAgent: multiple missing fields listed', async () => {
    try {
      await registry.addAgent({});
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('name'), 'Should list name');
      assert(e.message.includes('department'), 'Should list department');
      assert(e.message.includes('type'), 'Should list type');
      assert(e.message.includes('description'), 'Should list description');
    }
  });

  await test('addWorkflow: missing fields throws', async () => {
    try {
      await registry.addWorkflow({});
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('name'), 'Should list name');
      assert(e.message.includes('department'), 'Should list department');
      assert(e.message.includes('description'), 'Should list description');
    }
  });

  // ========================================
  // DUPLICATE ERRORS
  // ========================================

  console.log('\nDuplicate Entry Errors\n');

  await test('addAgent: duplicate name throws', async () => {
    await registry.addAgent({
      name: 'data-fetcher',
      displayName: 'Data Fetcher',
      department: 'test-dept',
      type: 'data-fetcher',
      description: 'Fetches data from APIs'
    });
    try {
      await registry.addAgent({
        name: 'data-fetcher',
        displayName: 'Duplicate',
        department: 'test-dept',
        type: 'specialist',
        description: 'Duplicate agent'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('already exists'), 'Should mention already exists');
    }
  });

  await test('addWorkflow: duplicate name throws', async () => {
    await registry.addWorkflow({
      name: 'test-flow',
      displayName: 'Test Flow',
      department: 'test-dept',
      description: 'A test workflow'
    });
    try {
      await registry.addWorkflow({
        name: 'test-flow',
        displayName: 'Duplicate',
        department: 'test-dept',
        description: 'Duplicate workflow'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('already exists'), 'Should mention already exists');
    }
  });

  await test('addAgent: nonexistent department shows available', async () => {
    try {
      await registry.addAgent({
        name: 'orphan-test',
        displayName: 'Orphan',
        department: 'nonexistent',
        type: 'specialist',
        description: 'Test orphan agent'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('does not exist'), 'Should say dept does not exist');
      assert(e.message.includes('test-dept'), 'Should show available departments');
    }
  });

  await test('addWorkflow: nonexistent department shows available', async () => {
    try {
      await registry.addWorkflow({
        name: 'orphan-flow',
        displayName: 'Orphan',
        department: 'nonexistent',
        description: 'Test orphan workflow'
      });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('does not exist'), 'Should say dept does not exist');
      assert(e.message.includes('test-dept'), 'Should show available departments');
    }
  });

  // ========================================
  // MULTI-DEPARTMENT OPERATIONS
  // ========================================

  console.log('\nMulti-Department Operations\n');

  await test('addDepartment: create second department', async () => {
    await registry.addDepartment({
      name: 'engineering',
      displayName: 'Engineering',
      description: 'Software engineering and DevOps automation'
    });
    assert(registry.departmentExists('engineering'), 'engineering should exist');
  });

  await test('addAgent: add agent to second department', async () => {
    await registry.addAgent({
      name: 'build-runner',
      displayName: 'Build Runner',
      department: 'engineering',
      type: 'data-fetcher',
      description: 'Fetches build status from CI pipeline'
    });
    const agent = registry.getAgent('build-runner');
    assertEquals(agent.department, 'engineering', 'Agent in correct department');
  });

  await test('addAgent: add orchestrator to second department', async () => {
    await registry.addAgent({
      name: 'deploy-coordinator',
      displayName: 'Deploy Coordinator',
      department: 'engineering',
      type: 'orchestrator',
      description: 'Coordinates deployment workflow across agents'
    });
    const agent = registry.getAgent('deploy-coordinator');
    assertEquals(agent.type, 'orchestrator', 'Type correct');
  });

  await test('listAgents: filter by department', async () => {
    const eng = await registry.listAgents({ department: 'engineering' });
    assertEquals(eng.length, 2, 'engineering should have 2 agents');
    eng.forEach(a => assertEquals(a.department, 'engineering', 'All agents in engineering'));
  });

  await test('listAgents: filter by type', async () => {
    const fetchers = await registry.listAgents({ type: 'data-fetcher' });
    assert(fetchers.length >= 2, 'Should have at least 2 data-fetchers');
    fetchers.forEach(a => assertEquals(a.type, 'data-fetcher', 'All should be data-fetcher'));
  });

  await test('listAgents: no filter returns all', async () => {
    const all = await registry.listAgents();
    assert(all.length >= 3, 'Should have at least 3 agents total');
  });

  await test('listDepartments: no filter returns all', async () => {
    const depts = await registry.listDepartments();
    assert(depts.length >= 2, 'Should have at least 2 departments');
  });

  await test('listDepartments: filter by status', async () => {
    const active = await registry.listDepartments({ status: 'active' });
    active.forEach(d => assertEquals(d.status, 'active', 'All should be active'));
  });

  await test('listDepartments: filter by non-existent status returns empty', async () => {
    const archived = await registry.listDepartments({ status: 'archived' });
    assertEquals(archived.length, 0, 'No archived departments');
  });

  // ========================================
  // WORKFLOW OPERATIONS
  // ========================================

  console.log('\nWorkflow Operations\n');

  await test('addWorkflow: with agent cross-refs', async () => {
    const wf = await registry.addWorkflow({
      name: 'deploy-pipeline',
      displayName: 'Deploy Pipeline',
      department: 'engineering',
      description: 'Full deployment pipeline with build and deploy',
      agents: ['build-runner', 'deploy-coordinator'],
      trigger: { type: 'manual', enabled: true },
      estimatedDuration: '5 minutes'
    });
    assertEquals(wf.agents.length, 2, 'Should have 2 agents');
    assertEquals(wf.trigger.type, 'manual', 'Trigger type correct');
  });

  await test('getWorkflow: retrieves by dept and name', async () => {
    const wf = registry.getWorkflow('engineering', 'deploy-pipeline');
    assert(wf, 'Workflow should exist');
    assertEquals(wf.displayName, 'Deploy Pipeline', 'Display name correct');
  });

  await test('getWorkflow: returns null for nonexistent', async () => {
    const wf = registry.getWorkflow('engineering', 'nonexistent');
    assertEquals(wf, null, 'Should return null');
  });

  await test('getWorkflow: returns null for wrong department', async () => {
    const wf = registry.getWorkflow('test-dept', 'deploy-pipeline');
    assertEquals(wf, null, 'Should return null for wrong dept');
  });

  await test('updateWorkflow: updates fields', async () => {
    const updated = await registry.updateWorkflow('engineering', 'deploy-pipeline', {
      estimatedDuration: '3 minutes'
    });
    assertEquals(updated.estimatedDuration, '3 minutes', 'Duration updated');
    assert(updated.updated, 'Should have updated timestamp');
  });

  await test('updateWorkflow: nonexistent throws', async () => {
    try {
      await registry.updateWorkflow('engineering', 'nonexistent', { description: 'x' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('not found'), 'Should mention not found');
    }
  });

  await test('updateDepartment: nonexistent throws', async () => {
    try {
      await registry.updateDepartment('nonexistent', { description: 'x' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('not found'), 'Should mention not found');
    }
  });

  await test('updateAgent: nonexistent throws', async () => {
    try {
      await registry.updateAgent('nonexistent', { description: 'x' });
      assert(false, 'Should throw');
    } catch (e) {
      assert(e.message.includes('not found'), 'Should mention not found');
    }
  });

  await test('listWorkflows: filter by department', async () => {
    const eng = await registry.listWorkflows({ department: 'engineering' });
    assertEquals(eng.length, 1, 'engineering should have 1 workflow');
    assertEquals(eng[0].department, 'engineering', 'Correct department');
  });

  await test('listWorkflows: filter by trigger type', async () => {
    const manual = await registry.listWorkflows({ type: 'manual' });
    manual.forEach(w => assertEquals(w.trigger.type, 'manual', 'All should be manual'));
  });

  await test('listWorkflowsByDepartment: returns correct workflows', async () => {
    const wfs = await registry.listWorkflowsByDepartment('test-dept');
    assertEquals(wfs.length, 1, 'test-dept has 1 workflow');
    assertEquals(wfs[0].name, 'test-flow', 'Correct workflow');
  });

  await test('listWorkflowsByDepartment: empty for dept with no workflows', async () => {
    await registry.addDepartment({
      name: 'empty-dept',
      displayName: 'Empty',
      description: 'Department with no workflows'
    });
    const wfs = await registry.listWorkflowsByDepartment('empty-dept');
    assertEquals(wfs.length, 0, 'Should have no workflows');
  });

  // ========================================
  // STATISTICS
  // ========================================

  console.log('\nStatistics\n');

  await test('getStatistics: correct totals', async () => {
    const stats = await registry.getStatistics();
    assertEquals(stats.departments.total, 3, '3 departments');
    assert(stats.agents.total >= 3, 'At least 3 agents');
    assert(stats.workflows.total >= 2, 'At least 2 workflows');
  });

  await test('getStatistics: agents by type', async () => {
    const stats = await registry.getStatistics();
    assert(stats.agents.byType['data-fetcher'] >= 2, 'At least 2 data-fetchers');
    assert(stats.agents.byType['orchestrator'] >= 1, 'At least 1 orchestrator');
  });

  await test('getStatistics: agents by department', async () => {
    const stats = await registry.getStatistics();
    assert(stats.agents.byDepartment['engineering'] >= 2, 'engineering has agents');
    assert(stats.agents.byDepartment['test-dept'] >= 1, 'test-dept has agents');
  });

  await test('getStatistics: workflows by type', async () => {
    const stats = await registry.getStatistics();
    assert(stats.workflows.byType.manual >= 1, 'At least 1 manual workflow');
  });

  await test('getStatistics: workflows by department', async () => {
    const stats = await registry.getStatistics();
    assert(stats.workflows.byDepartment['engineering'] >= 1, 'engineering has workflows');
  });

  await test('getStatistics: active vs inactive departments', async () => {
    const stats = await registry.getStatistics();
    assertEquals(stats.departments.active, 3, 'All departments active');
    assertEquals(stats.departments.inactive, 0, 'None inactive');
  });

  // ========================================
  // SEARCH
  // ========================================

  console.log('\nSearch\n');

  await test('search: finds departments by name', async () => {
    const results = await registry.search('engineering');
    assert(results.departments.length >= 1, 'Should find engineering');
  });

  await test('search: finds departments by description', async () => {
    const results = await registry.search('DevOps');
    assert(results.departments.length >= 1, 'Should find engineering by description');
  });

  await test('search: finds agents by name', async () => {
    const results = await registry.search('build');
    assert(results.agents.length >= 1, 'Should find build-runner');
  });

  await test('search: finds workflows', async () => {
    const results = await registry.search('deploy');
    assert(results.workflows.length >= 1, 'Should find deploy-pipeline');
  });

  await test('search: case insensitive', async () => {
    const results = await registry.search('ENGINEERING');
    assert(results.departments.length >= 1, 'Should find despite case');
  });

  await test('search: no results for nonsense', async () => {
    const results = await registry.search('zzzzzzz');
    assertEquals(results.departments.length, 0, 'No departments');
    assertEquals(results.agents.length, 0, 'No agents');
    assertEquals(results.workflows.length, 0, 'No workflows');
  });

  // ========================================
  // VALIDATE
  // ========================================

  console.log('\nValidation\n');

  await test('validate: clean registries are valid', async () => {
    const result = await registry.validate();
    assert(result.valid, 'Should be valid');
    assertEquals(result.errors.length, 0, 'No errors');
  });

  await test('validate: detects orphaned agent references', async () => {
    // Manually inject an invalid reference
    registry.departments.departments['test-dept'].agents.push('nonexistent-agent');
    const result = await registry.validate();
    assert(!result.valid, 'Should be invalid');
    assert(result.errors.some(e => e.includes('nonexistent-agent')), 'Should mention orphaned agent');
    // Clean up
    const agents = registry.departments.departments['test-dept'].agents;
    registry.departments.departments['test-dept'].agents = agents.filter(a => a !== 'nonexistent-agent');
  });

  await test('validate: detects orphaned workflow references', async () => {
    registry.departments.departments['test-dept'].workflows.push('nonexistent-workflow');
    const result = await registry.validate();
    assert(!result.valid, 'Should be invalid');
    assert(result.errors.some(e => e.includes('nonexistent-workflow')), 'Should mention orphaned workflow');
    const workflows = registry.departments.departments['test-dept'].workflows;
    registry.departments.departments['test-dept'].workflows = workflows.filter(w => w !== 'nonexistent-workflow');
  });

  // ========================================
  // EXPORT / IMPORT
  // ========================================

  console.log('\nExport / Import\n');

  await test('export: returns complete data', async () => {
    const data = await registry.export();
    assert(data.departments.departments['test-dept'], 'Has test-dept');
    assert(data.departments.departments['engineering'], 'Has engineering');
    assert(data.agents.agents['build-runner'], 'Has build-runner agent');
    assert(data.workflows.workflows['engineering-deploy-pipeline'], 'Has deploy-pipeline');
    assert(data.exported, 'Has export timestamp');
  });

  await test('import: restores from exported data', async () => {
    const exported = await registry.export();

    // Create a new registry and import into it
    const newDir = path.join(testDir, 'import-test');
    const newRegistry = new RegistryManager(newDir);
    await newRegistry.load();

    // Verify empty
    const emptyDepts = await newRegistry.listDepartments();
    assertEquals(emptyDepts.length, 0, 'New registry should be empty');

    // Import
    await newRegistry.import(exported);
    assert(newRegistry.departmentExists('engineering'), 'Imported engineering');
    assert(newRegistry.agentExists('build-runner'), 'Imported build-runner');
    assert(newRegistry.workflowExists('engineering', 'deploy-pipeline'), 'Imported workflow');

    // Clean up
    await fs.rm(newDir, { recursive: true, force: true });
  });

  // ========================================
  // RESET
  // ========================================

  console.log('\nReset\n');

  await test('reset: clears all data', async () => {
    // Use a separate registry for reset test to avoid disrupting other tests
    const resetDir = path.join(testDir, 'reset-test');
    const resetRegistry = new RegistryManager(resetDir);
    await resetRegistry.load();
    await resetRegistry.addDepartment({
      name: 'temp-dept',
      displayName: 'Temporary',
      description: 'Will be reset'
    });
    assert(resetRegistry.departmentExists('temp-dept'), 'Dept exists before reset');

    await resetRegistry.reset();
    assert(!resetRegistry.departmentExists('temp-dept'), 'Dept gone after reset');

    const stats = await resetRegistry.getStatistics();
    assertEquals(stats.departments.total, 0, 'No departments after reset');
    assertEquals(stats.agents.total, 0, 'No agents after reset');
    assertEquals(stats.workflows.total, 0, 'No workflows after reset');

    await fs.rm(resetDir, { recursive: true, force: true });
  });

  // ========================================
  // VALIDATE FILES
  // ========================================

  console.log('\nvalidateFiles\n');

  await test('validateFiles: passes when files exist', async () => {
    // addDepartment/addAgent auto-generate agent files, so they should exist
    const result = await registry.validateFiles();
    assert(result.valid, 'Should be valid when files were auto-generated');
  });

  await test('validateFiles: detects missing agent definition file', async () => {
    // Manually register an agent without generating its file
    registry.agents.agents['phantom-agent'] = {
      name: 'phantom-agent',
      displayName: 'Phantom',
      department: 'test-dept',
      type: 'specialist',
      description: 'Agent with no file'
    };
    const result = await registry.validateFiles();
    assert(!result.valid, 'Should be invalid');
    assert(result.errors.some(e => e.includes('phantom-agent')), 'Should mention phantom-agent');
    // Clean up
    delete registry.agents.agents['phantom-agent'];
  });

  await test('validateFiles: detects missing department agent file', async () => {
    // Manually register a department without generating its file
    registry.departments.departments['phantom-dept'] = {
      name: 'phantom-dept',
      displayName: 'Phantom Dept',
      description: 'Dept with no file',
      status: 'active',
      agents: [],
      workflows: []
    };
    const result = await registry.validateFiles();
    assert(result.errors.some(e => e.includes('phantom-dept')), 'Should mention phantom-dept');
    // Clean up
    delete registry.departments.departments['phantom-dept'];
  });

  // ========================================
  // PERSISTENCE
  // ========================================

  console.log('\nPersistence\n');

  await test('save + reload: data persists', async () => {
    await registry.save();

    // Create new instance pointing to same directory
    const registry2 = new RegistryManager(testDir);
    await registry2.load();

    assert(registry2.departmentExists('engineering'), 'engineering should persist');
    assert(registry2.agentExists('build-runner'), 'build-runner should persist');
    assert(registry2.workflowExists('engineering', 'deploy-pipeline'), 'workflow should persist');

    const dept = registry2.getDepartment('engineering');
    assertEquals(dept.displayName, 'Engineering', 'Display name persisted');
  });

  await test('save: updates metadata timestamps', async () => {
    const before = registry.departments.metadata.lastUpdated;
    // Small delay to ensure timestamp changes
    await new Promise(r => setTimeout(r, 10));
    await registry.save();
    const after = registry.departments.metadata.lastUpdated;
    assert(after >= before, 'Timestamp should be updated');
  });

  // ========================================
  // EDGE CASES
  // ========================================

  console.log('\nEdge Cases\n');

  await test('getDepartment: returns null for nonexistent', async () => {
    const d = registry.getDepartment('nonexistent');
    assertEquals(d, null, 'Should return null');
  });

  await test('getAgent: returns null for nonexistent', async () => {
    const a = registry.getAgent('nonexistent');
    assertEquals(a, null, 'Should return null');
  });

  await test('addDepartment: defaults status to active', async () => {
    const dept = registry.getDepartment('test-dept');
    assertEquals(dept.status, 'active', 'Default status is active');
  });

  await test('addDepartment: defaults version to 1.0.0', async () => {
    const dept = registry.getDepartment('test-dept');
    assertEquals(dept.version, '1.0.0', 'Default version is 1.0.0');
  });

  await test('addAgent: defaults model to sonnet', async () => {
    const agent = registry.getAgent('data-fetcher');
    assertEquals(agent.model, 'sonnet', 'Default model is sonnet');
  });

  await test('addAgent: defaults usedInWorkflows to empty', async () => {
    const agent = registry.getAgent('data-fetcher');
    assert(Array.isArray(agent.usedInWorkflows), 'usedInWorkflows is array');
  });

  await test('addWorkflow: defaults to manual trigger', async () => {
    const wf = registry.getWorkflow('test-dept', 'test-flow');
    assertEquals(wf.trigger.type, 'manual', 'Default trigger is manual');
  });

  await test('addWorkflow: tracks runCount as 0', async () => {
    const wf = registry.getWorkflow('test-dept', 'test-flow');
    assertEquals(wf.runCount, 0, 'Run count starts at 0');
  });

  await test('addWorkflow: tracks successRate as 1.0', async () => {
    const wf = registry.getWorkflow('test-dept', 'test-flow');
    assertEquals(wf.successRate, 1.0, 'Success rate starts at 1.0');
  });

  await test('addWorkflow: agent not in registry still added to list', async () => {
    // Agents referenced in workflow don't need to exist in agent registry
    const wf = await registry.addWorkflow({
      name: 'with-unknown-agents',
      displayName: 'Unknown Agents Flow',
      department: 'test-dept',
      description: 'Workflow referencing non-registered agents',
      agents: ['unknown-agent-1', 'unknown-agent-2']
    });
    assertEquals(wf.agents.length, 2, 'Agents listed even if not in registry');
  });

  await test('metadata: totalDepartments updates correctly', async () => {
    const total = registry.departments.metadata.totalDepartments;
    assertEquals(total, Object.keys(registry.departments.departments).length, 'Count matches');
  });

  await test('metadata: totalAgents updates correctly', async () => {
    const total = registry.agents.metadata.totalAgents;
    assertEquals(total, Object.keys(registry.agents.agents).length, 'Count matches');
  });

  await test('metadata: totalWorkflows updates correctly', async () => {
    const total = registry.workflows.metadata.totalWorkflows;
    assertEquals(total, Object.keys(registry.workflows.workflows).length, 'Count matches');
  });

  // ========================================
  // CLEANUP
  // ========================================

  await test('cleanup: remove test directory', async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  // ========================================
  // SUMMARY
  // ========================================

  console.log('\n' + '='.repeat(60));
  console.log('Test Results');
  console.log('='.repeat(60));
  console.log(`Total: ${testCount}`);
  console.log(`Passed: ${passCount} \u2713`);
  console.log(`Failed: ${failCount} \u2717`);
  console.log('='.repeat(60));

  if (failCount > 0) {
    console.log('\nFailed Tests:');
    failedTests.forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    process.exit(1);
  } else {
    console.log('\n\uD83C\uDF89 All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
