#!/usr/bin/env node

/**
 * Steward Fixes Tests (2026-02-27)
 *
 * Tests for bugs fixed and coverage gaps filled in this stewardship cycle:
 * - validateWorkflowContext fall-through on non-array steps
 * - validateSchedule time range validation (hours 0-23, minutes 0-59)
 * - resolveTemplatePath double-extension bug for name.ext format
 * - listTemplates only swallows ENOENT, not other errors
 * - import() null/malformed data guard
 * - updateDepartment/updateAgent null updates guard
 * - listTemplates basic functionality
 */

const path = require('path');
const fs = require('fs').promises;
const RegistryManager = require('../lib/registry-manager');
const TemplateEngine = require('../lib/template-engine');
const Validator = require('../lib/validator');

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
      console.log(`\u2717 FAIL: ${testName}`);
    }
  },

  async assertThrows(fn, testName) {
    this.total++;
    try {
      await fn();
      this.failed++;
      console.log(`\u2717 FAIL: ${testName} (no error thrown)`);
    } catch (error) {
      this.passed++;
      console.log(`\u2713 ${testName}`);
      return error;
    }
  },

  report() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.total}`);
    console.log(`Passed: ${this.passed} \u2713`);
    console.log(`Failed: ${this.failed} \u2717`);
    console.log('='.repeat(60));

    if (this.failed === 0) {
      console.log('\n\ud83c\udf89 All tests passed!');
    } else {
      console.log(`\n\u274c ${this.failed} test(s) failed!`);
      process.exit(1);
    }
  }
};

async function run() {
  console.log('Steward Fixes Tests (2026-02-27)\n');

  const validator = new Validator();
  const engine = new TemplateEngine();

  // ============================================================
  // validateWorkflowContext: non-array steps
  // ============================================================
  console.log('\nvalidateWorkflowContext: non-array steps\n');

  // Should not throw TypeError when steps is a string
  const resultStringSteps = validator.validateWorkflowContext({
    name: 'test-workflow',
    displayName: 'Test',
    description: 'A test workflow for validation checking purposes',
    department: 'test-dept',
    steps: 'not-an-array'
  });
  suite.assert(!resultStringSteps.valid, 'rejects non-array steps (string)');
  suite.assert(resultStringSteps.errors.some(e => e.includes('Steps must be an array')), 'error says steps must be array');

  // Should not throw TypeError when steps is a number
  const resultNumberSteps = validator.validateWorkflowContext({
    name: 'test-workflow',
    displayName: 'Test',
    description: 'A test workflow for validation checking purposes',
    department: 'test-dept',
    steps: 42
  });
  suite.assert(!resultNumberSteps.valid, 'rejects non-array steps (number)');

  // Should not throw TypeError when steps is an object
  const resultObjSteps = validator.validateWorkflowContext({
    name: 'test-workflow',
    displayName: 'Test',
    description: 'A test workflow for validation checking purposes',
    department: 'test-dept',
    steps: { foo: 'bar' }
  });
  suite.assert(!resultObjSteps.valid, 'rejects non-array steps (object)');

  // Valid steps should still work
  const resultValidSteps = validator.validateWorkflowContext({
    name: 'test-workflow',
    displayName: 'Test',
    description: 'A test workflow for validation checking purposes',
    department: 'test-dept',
    steps: [
      { agents: [{ name: 'test-agent', prompt: 'do stuff' }] }
    ]
  });
  suite.assert(resultValidSteps.valid, 'accepts valid array steps');

  // ============================================================
  // validateSchedule: time range validation
  // ============================================================
  console.log('\nvalidateSchedule: time range validation\n');

  // Valid times
  suite.assert(validator.validateSchedule('daily 0:00').valid, 'accepts daily 0:00');
  suite.assert(validator.validateSchedule('daily 23:59').valid, 'accepts daily 23:59');
  suite.assert(validator.validateSchedule('daily 9:00').valid, 'accepts daily 9:00');
  suite.assert(validator.validateSchedule('daily 12:30').valid, 'accepts daily 12:30');
  suite.assert(validator.validateSchedule('weekly monday 8:00').valid, 'accepts weekly monday 8:00');

  // Invalid hours
  const result24 = validator.validateSchedule('daily 24:00');
  suite.assert(!result24.valid, 'rejects daily 24:00');
  suite.assert(result24.errors.some(e => e.includes('Invalid hour')), 'error mentions invalid hour for 24');

  const result25 = validator.validateSchedule('daily 25:00');
  suite.assert(!result25.valid, 'rejects daily 25:00');

  const result99h = validator.validateSchedule('daily 99:00');
  suite.assert(!result99h.valid, 'rejects daily 99:00');

  // Invalid minutes
  const result60m = validator.validateSchedule('daily 9:60');
  suite.assert(!result60m.valid, 'rejects daily 9:60');
  suite.assert(result60m.errors.some(e => e.includes('Invalid minutes')), 'error mentions invalid minutes for 60');

  const result99m = validator.validateSchedule('daily 9:99');
  suite.assert(!result99m.valid, 'rejects daily 9:99');

  // Weekly with invalid time
  const weeklyBad = validator.validateSchedule('weekly monday 25:99');
  suite.assert(!weeklyBad.valid, 'rejects weekly with out-of-range time');

  // Monthly with invalid time
  const monthlyBad = validator.validateSchedule('monthly 1st 24:60');
  suite.assert(!monthlyBad.valid, 'rejects monthly with out-of-range time');

  // Formats without times should still work
  suite.assert(validator.validateSchedule('hourly').valid, 'accepts hourly (no time)');
  suite.assert(validator.validateSchedule('every 4 hours').valid, 'accepts every 4 hours (no time)');

  // ============================================================
  // resolveTemplatePath: double-extension fix
  // ============================================================
  console.log('\nresolveTemplatePath: double-extension fix\n');

  // name.ext format should produce baseName.hbs, NOT name.ext.hbs
  const mdPath = engine.resolveTemplatePath('test-agent.md');
  suite.assert(mdPath.endsWith('test-agent.hbs'), 'name.md resolves to baseName.hbs (no double extension)');
  suite.assert(!mdPath.includes('.md.hbs'), 'no .md.hbs double extension');

  const jsPath = engine.resolveTemplatePath('test-script.js');
  suite.assert(jsPath.endsWith('test-script.hbs'), 'name.js resolves to baseName.hbs');
  suite.assert(!jsPath.includes('.js.hbs'), 'no .js.hbs double extension');

  const jsonPath = engine.resolveTemplatePath('test-config.json');
  suite.assert(jsonPath.endsWith('test-config.hbs'), 'name.json resolves to baseName.hbs');
  suite.assert(!jsonPath.includes('.json.hbs'), 'no .json.hbs double extension');

  const shPath = engine.resolveTemplatePath('test-script.sh');
  suite.assert(shPath.endsWith('test-script.hbs'), 'name.sh resolves to baseName.hbs');

  // type/name format should still work unchanged
  const typePath = engine.resolveTemplatePath('agent/data-fetcher-agent.md');
  suite.assert(typePath.endsWith('data-fetcher-agent.md.hbs'), 'type/name format unchanged');

  // ============================================================
  // listTemplates: basic functionality
  // ============================================================
  console.log('\nlistTemplates: basic functionality\n');

  const allTemplates = await engine.listTemplates();
  suite.assert(Array.isArray(allTemplates), 'listTemplates returns an array');
  suite.assert(allTemplates.length > 0, 'listTemplates finds templates in templates/ dir');
  suite.assert(allTemplates.every(t => t.name && t.type && t.path), 'each template has name, type, and path');

  // Filter by type
  const agentTemplates = await engine.listTemplates('agent');
  suite.assert(Array.isArray(agentTemplates), 'listTemplates("agent") returns an array');
  suite.assert(agentTemplates.every(t => t.type === 'agent'), 'all filtered templates are type "agent"');

  // Non-existent type returns empty (ENOENT swallowed)
  const noTemplates = await engine.listTemplates('nonexistent-type');
  suite.assert(Array.isArray(noTemplates), 'listTemplates for non-existent type returns array');
  suite.assert(noTemplates.length === 0, 'listTemplates for non-existent type returns empty');

  // ============================================================
  // import(): null/malformed data
  // ============================================================
  console.log('\nimport(): null/malformed data\n');

  const tempDir = path.join(__dirname, '..', '.test-steward-0227-' + Date.now());
  await fs.mkdir(path.join(tempDir, 'config', 'registries'), { recursive: true });
  await fs.mkdir(path.join(tempDir, '.claude', 'agents'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'templates', 'department'), { recursive: true });
  await fs.mkdir(path.join(tempDir, 'templates', 'agent'), { recursive: true });

  // Copy necessary template files
  const srcTemplates = path.join(__dirname, '..', 'templates');
  const dstTemplates = path.join(tempDir, 'templates');

  // Copy department template
  try {
    const deptTemplate = await fs.readFile(path.join(srcTemplates, 'department', 'department-agent.md.hbs'), 'utf8');
    await fs.writeFile(path.join(dstTemplates, 'department', 'department-agent.md.hbs'), deptTemplate);
  } catch (e) { /* template may not exist in all setups */ }

  const registry = new RegistryManager(tempDir);
  await registry.load();

  const nullErr = await suite.assertThrows(
    () => registry.import(null),
    'import(null) throws'
  );
  if (nullErr) {
    suite.assert(nullErr.message.includes('non-null object'), 'import(null) error mentions non-null object');
  }

  await suite.assertThrows(
    () => registry.import(undefined),
    'import(undefined) throws'
  );

  await suite.assertThrows(
    () => registry.import('string'),
    'import("string") throws'
  );

  await suite.assertThrows(
    () => registry.import(42),
    'import(42) throws'
  );

  // Valid empty object should work (no-op)
  await registry.import({});
  suite.assert(true, 'import({}) does not throw');

  // ============================================================
  // updateDepartment/updateAgent: null updates guard
  // ============================================================
  console.log('\nupdateDepartment/updateAgent: null updates guard\n');

  // Set up a department and agent for update tests
  await registry.addDepartment({
    name: 'test-dept',
    displayName: 'Test Dept',
    description: 'A department for testing update validation'
  });

  const updateNullErr = await suite.assertThrows(
    () => registry.updateDepartment('test-dept', null),
    'updateDepartment with null throws'
  );
  if (updateNullErr) {
    suite.assert(updateNullErr.message.includes('non-null object'), 'updateDepartment null error mentions non-null');
  }

  await suite.assertThrows(
    () => registry.updateDepartment('test-dept', undefined),
    'updateDepartment with undefined throws'
  );

  await suite.assertThrows(
    () => registry.updateDepartment('test-dept', 'string'),
    'updateDepartment with string throws'
  );

  // Valid update should work
  const updatedDept = await registry.updateDepartment('test-dept', { description: 'Updated description for testing' });
  suite.assert(updatedDept.description === 'Updated description for testing', 'updateDepartment with valid object works');

  // Now test updateAgent
  await registry.addAgent({
    name: 'test-agent',
    displayName: 'Test Agent',
    department: 'test-dept',
    type: 'specialist',
    description: 'An agent for testing update validation'
  });

  await suite.assertThrows(
    () => registry.updateAgent('test-agent', null),
    'updateAgent with null throws'
  );

  await suite.assertThrows(
    () => registry.updateAgent('test-agent', undefined),
    'updateAgent with undefined throws'
  );

  // Valid update should work
  const updatedAgent = await registry.updateAgent('test-agent', { description: 'Updated agent description' });
  suite.assert(updatedAgent.description === 'Updated agent description', 'updateAgent with valid object works');

  // ============================================================
  // validate(): department agent/workflow list cross-check
  // ============================================================
  console.log('\nvalidate(): department list cross-check\n');

  // Inject a non-existent agent into department's agent list
  registry.departments.departments['test-dept'].agents.push('phantom-agent');
  const validationResult = await registry.validate();
  suite.assert(!validationResult.valid, 'validate detects phantom agent in department list');
  suite.assert(
    validationResult.errors.some(e => e.includes("lists non-existent agent 'phantom-agent'")),
    'validate error names the phantom agent'
  );

  // Clean up phantom and inject phantom workflow
  registry.departments.departments['test-dept'].agents.pop();
  registry.departments.departments['test-dept'].workflows.push('phantom-workflow');
  const valResult2 = await registry.validate();
  suite.assert(!valResult2.valid, 'validate detects phantom workflow in department list');
  suite.assert(
    valResult2.errors.some(e => e.includes("lists non-existent workflow 'phantom-workflow'")),
    'validate error names the phantom workflow'
  );

  // ============================================================
  // search(): edge cases
  // ============================================================
  console.log('\nsearch(): edge cases\n');

  // Search with empty string should return empty results (safety fix)
  const emptySearch = await registry.search('');
  suite.assert(emptySearch.departments.length === 0, 'search("") returns empty departments');
  suite.assert(emptySearch.agents.length === 0, 'search("") returns empty agents');

  // Search with non-matching query
  const noMatch = await registry.search('zzzznonexistent');
  suite.assert(noMatch.departments.length === 0, 'search for non-existent returns empty departments');
  suite.assert(noMatch.agents.length === 0, 'search for non-existent returns empty agents');

  // ============================================================
  // Cleanup
  // ============================================================
  console.log('\nCleanup\n');

  await fs.rm(tempDir, { recursive: true, force: true });
  suite.assert(true, 'cleaned up temp directory');

  suite.report();
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
