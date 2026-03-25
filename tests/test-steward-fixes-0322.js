#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-22
 *
 * Tests for:
 * - TemplateEngine input safety (null/undefined/number/empty template names)
 * - TemplateEngine `array` helper
 * - Validator `validateDescription()` non-string safety
 * - Validator `validateUrl()` non-string safety
 * - RegistryManager getDepartmentSummary edge cases
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

// ============================================================
// TemplateEngine input safety
// ============================================================

async function testTemplateEngineInputSafety() {
  console.log('  TemplateEngine input safety');

  const TemplateEngine = require('../lib/template-engine');
  const engine = new TemplateEngine();

  // loadTemplate with null
  try {
    await engine.loadTemplate(null);
    assert(false, 'loadTemplate(null) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate(null) throws descriptive error');
  }

  // loadTemplate with undefined
  try {
    await engine.loadTemplate(undefined);
    assert(false, 'loadTemplate(undefined) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate(undefined) throws descriptive error');
  }

  // loadTemplate with number
  try {
    await engine.loadTemplate(42);
    assert(false, 'loadTemplate(42) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate(42) throws descriptive error');
    assert(e.message.includes('number'), 'loadTemplate(42) mentions the type received');
  }

  // loadTemplate with empty string
  try {
    await engine.loadTemplate('');
    assert(false, 'loadTemplate("") should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate("") throws descriptive error');
    assert(e.message.includes('empty string'), 'loadTemplate("") mentions empty string');
  }

  // loadTemplate with boolean
  try {
    await engine.loadTemplate(true);
    assert(false, 'loadTemplate(true) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate(true) throws descriptive error');
  }

  // loadTemplate with array
  try {
    await engine.loadTemplate(['agent', 'foo']);
    assert(false, 'loadTemplate([]) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'loadTemplate([]) throws descriptive error');
  }

  // resolveTemplatePath with null
  try {
    engine.resolveTemplatePath(null);
    assert(false, 'resolveTemplatePath(null) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'resolveTemplatePath(null) throws descriptive error');
  }

  // resolveTemplatePath with number
  try {
    engine.resolveTemplatePath(99);
    assert(false, 'resolveTemplatePath(99) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'resolveTemplatePath(99) throws descriptive error');
  }

  // resolveTemplatePath with empty string
  try {
    engine.resolveTemplatePath('');
    assert(false, 'resolveTemplatePath("") should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'resolveTemplatePath("") throws descriptive error');
  }

  // render with null template name
  try {
    await engine.render(null, {});
    assert(false, 'render(null, {}) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'render(null) propagates loadTemplate error');
  }

  // render with undefined template name
  try {
    await engine.render(undefined);
    assert(false, 'render(undefined) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'render(undefined) propagates loadTemplate error');
  }

  // render with number template name
  try {
    await engine.render(123, { name: 'test' });
    assert(false, 'render(123, ctx) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'render(123) propagates loadTemplate error');
  }

  // resolveTemplatePath with valid type/name format returns expected path
  const resolved = engine.resolveTemplatePath('agent/data-fetcher-agent.md');
  assert(resolved.endsWith('data-fetcher-agent.md.hbs'), 'resolveTemplatePath type/name adds .hbs');
  assert(resolved.includes(path.join('templates', 'agent')), 'resolveTemplatePath routes to correct dir');

  // resolveTemplatePath with name.ext format routes correctly
  const resolvedExt = engine.resolveTemplatePath('data-fetcher-agent.md');
  assert(resolvedExt.includes(path.join('templates', 'agent')), 'resolveTemplatePath .md with "agent" in name goes to agent/');

  // resolveTemplatePath with .json routes to workflow/
  const resolvedJson = engine.resolveTemplatePath('workflow-config.json');
  assert(resolvedJson.includes(path.join('templates', 'workflow')), 'resolveTemplatePath .json routes to workflow/');

  // resolveTemplatePath with .sh routes to workflow/
  const resolvedSh = engine.resolveTemplatePath('workflow-trigger.sh');
  assert(resolvedSh.includes(path.join('templates', 'workflow')), 'resolveTemplatePath .sh routes to workflow/');

  // resolveTemplatePath with unsupported extension throws
  try {
    engine.resolveTemplatePath('foo.yaml');
    assert(false, 'resolveTemplatePath(.yaml) should throw');
  } catch (e) {
    assert(e.message.includes('Unsupported template extension'), 'resolveTemplatePath(.yaml) throws');
  }

  // resolveTemplatePath bare name (no slash, no dot) defaults to agent/
  const resolvedBare = engine.resolveTemplatePath('my-template');
  assert(resolvedBare.includes(path.join('templates', 'agent')), 'resolveTemplatePath bare name defaults to agent/');
}

// ============================================================
// TemplateEngine array helper
// ============================================================

async function testArrayHelper() {
  console.log('  TemplateEngine array helper');

  const TemplateEngine = require('../lib/template-engine');
  const Handlebars = require('handlebars');
  const engine = new TemplateEngine(); // registers helpers

  // Test array helper creates an array
  const template1 = Handlebars.compile('{{join (array "a" "b" "c") ", "}}');
  const result1 = template1({});
  assert(result1 === 'a, b, c', `array helper produces "a, b, c", got "${result1}"`);

  // Test array helper with single element
  const template2 = Handlebars.compile('{{join (array "solo") "-"}}');
  const result2 = template2({});
  assert(result2 === 'solo', `array helper single element: "solo", got "${result2}"`);

  // Test array helper with numbers (they become strings in template)
  const template3 = Handlebars.compile('{{join (array "x" "y") ":"}}');
  const result3 = template3({});
  assert(result3 === 'x:y', `array helper with colon sep: "x:y", got "${result3}"`);

  // Test array helper with empty — no args means empty array
  const template4 = Handlebars.compile('{{join (array) ", "}}');
  const result4 = template4({});
  assert(result4 === '', `array helper no args produces empty string, got "${result4}"`);

  // Test contains with array helper
  const template5 = Handlebars.compile('{{#contains (array "Bash" "Read") "Bash"}}yes{{else}}no{{/contains}}');
  const result5 = template5({});
  assert(result5 === 'yes', `array + contains: "yes", got "${result5}"`);

  const template6 = Handlebars.compile('{{#contains (array "Bash" "Read") "Write"}}yes{{else}}no{{/contains}}');
  const result6 = template6({});
  assert(result6 === 'no', `array + contains missing: "no", got "${result6}"`);
}

// ============================================================
// TemplateEngine renderToFile
// ============================================================

async function testRenderToFile() {
  console.log('  TemplateEngine renderToFile');

  const TemplateEngine = require('../lib/template-engine');
  const engine = new TemplateEngine();

  // renderToFile with null template name
  try {
    await engine.renderToFile(null, {}, '/tmp/test.md');
    assert(false, 'renderToFile(null) should throw');
  } catch (e) {
    assert(e.message.includes('non-empty string'), 'renderToFile(null) propagates error');
  }

  // renderToFile with valid template creates file
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'motus-test-'));
  const outPath = path.join(tmpDir, 'nested', 'output.md');
  try {
    const result = await engine.renderToFile('department/department-agent.md', {
      name: 'test-dept',
      description: 'Test department for steward test',
      responsibilities: [],
      integrations: [],
      agents: []
    }, outPath);
    assert(result === outPath, 'renderToFile returns output path');
    const content = await fs.readFile(outPath, 'utf8');
    assert(content.includes('test-dept'), 'renderToFile writes content with context');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// ============================================================
// TemplateEngine clearCache
// ============================================================

async function testClearCache() {
  console.log('  TemplateEngine clearCache');

  const TemplateEngine = require('../lib/template-engine');
  const engine = new TemplateEngine();

  // Load a template to populate cache
  await engine.loadTemplate('department/department-agent.md');
  assert(engine.compiledTemplates.size > 0, 'cache populated after loadTemplate');

  // Clear cache
  engine.clearCache();
  assert(engine.compiledTemplates.size === 0, 'cache empty after clearCache');

  // Can reload after clear
  await engine.loadTemplate('department/department-agent.md');
  assert(engine.compiledTemplates.size > 0, 'cache repopulated after reload');
}

// ============================================================
// TemplateEngine listTemplates
// ============================================================

async function testListTemplates() {
  console.log('  TemplateEngine listTemplates');

  const TemplateEngine = require('../lib/template-engine');
  const engine = new TemplateEngine();

  // List all templates
  const all = await engine.listTemplates();
  assert(all.length >= 10, `at least 10 templates found (got ${all.length})`);
  assert(all.every(t => t.name && t.type && t.path), 'all templates have name, type, path');

  // List by type
  const agents = await engine.listTemplates('agent');
  assert(agents.length >= 3, `at least 3 agent templates (got ${agents.length})`);
  assert(agents.every(t => t.type === 'agent'), 'filtered templates all have type agent');

  const workflows = await engine.listTemplates('workflow');
  assert(workflows.length >= 1, `at least 1 workflow template (got ${workflows.length})`);

  // List non-existent type returns empty
  const none = await engine.listTemplates('nonexistent');
  assert(none.length === 0, 'nonexistent type returns empty array');
}

// ============================================================
// Validator validateDescription non-string safety
// ============================================================

async function testValidateDescriptionSafety() {
  console.log('  Validator validateDescription non-string safety');

  const Validator = require('../lib/validator');
  const validator = new Validator();

  // null
  const r1 = validator.validateDescription(null);
  assert(!r1.valid, 'validateDescription(null) is invalid');
  assert(r1.errors.length > 0, 'validateDescription(null) has errors');

  // undefined
  const r2 = validator.validateDescription(undefined);
  assert(!r2.valid, 'validateDescription(undefined) is invalid');

  // number — previously crashed
  const r3 = validator.validateDescription(42);
  assert(!r3.valid, 'validateDescription(42) is invalid');
  assert(r3.errors.some(e => e.includes('string')), 'validateDescription(42) mentions string requirement');

  // boolean
  const r4 = validator.validateDescription(true);
  assert(!r4.valid, 'validateDescription(true) is invalid');
  assert(r4.errors.some(e => e.includes('string')), 'validateDescription(true) mentions string');

  // array
  const r5 = validator.validateDescription(['hello', 'world']);
  assert(!r5.valid, 'validateDescription([]) is invalid');

  // object
  const r6 = validator.validateDescription({ text: 'hello' });
  assert(!r6.valid, 'validateDescription({}) is invalid');

  // empty string (falsy)
  const r7 = validator.validateDescription('');
  assert(!r7.valid, 'validateDescription("") is invalid');
  assert(r7.errors.some(e => e.includes('required')), 'validateDescription("") says required');

  // valid string
  const r8 = validator.validateDescription('This is a valid description for testing purposes');
  assert(r8.valid, 'validateDescription(valid string) passes');

  // too short
  const r9 = validator.validateDescription('Short');
  assert(!r9.valid, 'validateDescription("Short") too short');

  // generic/placeholder
  const r10 = validator.validateDescription('This thing does stuff and handles things');
  assert(!r10.valid, 'validateDescription with placeholder text is invalid');

  // custom min/max
  const r11 = validator.validateDescription('OK', 1, 10);
  assert(r11.valid, 'validateDescription with custom minLength=1 accepts "OK"');
  const r12 = validator.validateDescription('This is way too long for the limit', 1, 10);
  assert(!r12.valid, 'validateDescription exceeding maxLength is invalid');
}

// ============================================================
// Validator validateUrl non-string safety
// ============================================================

async function testValidateUrlSafety() {
  console.log('  Validator validateUrl non-string safety');

  const Validator = require('../lib/validator');
  const validator = new Validator();

  // null
  const r1 = validator.validateUrl(null);
  assert(!r1.valid, 'validateUrl(null) invalid');

  // number — should not crash
  const r2 = validator.validateUrl(42);
  assert(!r2.valid, 'validateUrl(42) invalid');

  // valid URL
  const r3 = validator.validateUrl('https://example.com');
  assert(r3.valid, 'validateUrl(https://example.com) valid');

  // invalid format
  const r4 = validator.validateUrl('not-a-url');
  assert(!r4.valid, 'validateUrl("not-a-url") invalid');
}

// ============================================================
// RegistryManager getDepartmentSummary edge cases
// ============================================================

async function testGetDepartmentSummaryEdgeCases() {
  console.log('  RegistryManager getDepartmentSummary edge cases');

  const RegistryManager = require('../lib/registry-manager');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'motus-reg-'));

  try {
    const registry = new RegistryManager(tmpDir);
    await registry.load();

    // Non-existent department returns null
    const result = await registry.getDepartmentSummary('nonexistent');
    assert(result === null, 'getDepartmentSummary for nonexistent returns null');

    // Department with no agents/workflows
    await registry.addDepartment({
      name: 'empty-dept',
      displayName: 'Empty Dept',
      description: 'A department with nothing in it'
    });
    const summary = await registry.getDepartmentSummary('empty-dept');
    assert(summary !== null, 'getDepartmentSummary for existing dept returns object');
    assert(summary.agents.length === 0, 'empty dept has 0 agents');
    assert(summary.workflows.length === 0, 'empty dept has 0 workflows');
    assert(summary.agentsByType['data-fetcher'] === 0, 'agentsByType all zero');
    assert(summary.agentsByType['orchestrator'] === 0, 'agentsByType all zero');
    assert(summary.agentsByType['specialist'] === 0, 'agentsByType all zero');
    assert(summary.workflowsByTrigger.manual === 0, 'workflowsByTrigger all zero');
    assert(summary.workflowsByTrigger.scheduled === 0, 'workflowsByTrigger all zero');
    assert(summary.integrationCount === 0, 'integrationCount zero');

    // Department with agents of different types
    await registry.addAgent({
      name: 'test-fetcher',
      displayName: 'Test Fetcher',
      department: 'empty-dept',
      type: 'data-fetcher',
      description: 'Fetches test data from API'
    });
    await registry.addAgent({
      name: 'test-analyzer',
      displayName: 'Test Analyzer',
      department: 'empty-dept',
      type: 'specialist',
      description: 'Analyzes test results'
    });
    const summary2 = await registry.getDepartmentSummary('empty-dept');
    assert(summary2.agents.length === 2, 'dept with 2 agents');
    assert(summary2.agentsByType['data-fetcher'] === 1, '1 data-fetcher');
    assert(summary2.agentsByType['specialist'] === 1, '1 specialist');
    assert(summary2.agentsByType['orchestrator'] === 0, '0 orchestrators');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// ============================================================
// RegistryManager search edge cases
// ============================================================

async function testSearchEdgeCases() {
  console.log('  RegistryManager search edge cases');

  const RegistryManager = require('../lib/registry-manager');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'motus-search-'));

  try {
    const registry = new RegistryManager(tmpDir);
    await registry.load();

    // Search with empty registry
    const r1 = await registry.search('anything');
    assert(r1.departments.length === 0, 'search empty registry returns 0 departments');
    assert(r1.agents.length === 0, 'search empty registry returns 0 agents');
    assert(r1.workflows.length === 0, 'search empty registry returns 0 workflows');

    // Search with empty string matches everything
    await registry.addDepartment({
      name: 'test-dept',
      displayName: 'Test Dept',
      description: 'Test department'
    });
    const r2 = await registry.search('');
    assert(r2.departments.length === 0, 'empty string search returns empty results');

    // Case-insensitive search
    const r3 = await registry.search('TEST');
    assert(r3.departments.length === 1, 'case-insensitive search works');

    // Search by description keyword
    const r4 = await registry.search('department');
    assert(r4.departments.length === 1, 'search by description keyword works');

    // Search with no matches
    const r5 = await registry.search('zzzzz-nonexistent');
    assert(r5.departments.length === 0, 'no-match search returns empty');
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// ============================================================
// RegistryManager export/import roundtrip
// ============================================================

async function testExportImportRoundtrip() {
  console.log('  RegistryManager export/import roundtrip');

  const RegistryManager = require('../lib/registry-manager');
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'motus-eximp-'));

  try {
    const registry = new RegistryManager(tmpDir);
    await registry.load();

    // Add data
    await registry.addDepartment({
      name: 'roundtrip-dept',
      displayName: 'Roundtrip Dept',
      description: 'Department for roundtrip testing'
    });
    await registry.addAgent({
      name: 'roundtrip-agent',
      displayName: 'Roundtrip Agent',
      department: 'roundtrip-dept',
      type: 'specialist',
      description: 'Analyzes roundtrip data'
    });

    // Export
    const exported = await registry.export();
    assert(exported.departments !== undefined, 'export has departments');
    assert(exported.agents !== undefined, 'export has agents');
    assert(exported.workflows !== undefined, 'export has workflows');
    assert(exported.exported !== undefined, 'export has timestamp');

    // Import into fresh registry
    const registry2 = new RegistryManager(tmpDir);
    await registry2.load();
    await registry2.reset(); // clear
    const stats0 = await registry2.getStatistics();
    assert(stats0.departments.total === 0, 'reset registry has 0 departments');

    await registry2.import(exported);
    const stats1 = await registry2.getStatistics();
    assert(stats1.departments.total === 1, 'imported registry has 1 department');
    assert(stats1.agents.total === 1, 'imported registry has 1 agent');

    // Import with invalid data throws
    try {
      await registry2.import('not an object');
      assert(false, 'import(string) should throw');
    } catch (e) {
      assert(e.message.includes('non-null object'), 'import(string) throws descriptive error');
    }

    try {
      await registry2.import({ departments: 'bad' });
      assert(false, 'import(bad structure) should throw');
    } catch (e) {
      assert(e.message.includes('Invalid departments'), 'import(bad) throws structure error');
    }
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

// ============================================================
// Main runner
// ============================================================

async function main() {
  console.log('Running steward-fixes-0322 tests...\n');

  await testTemplateEngineInputSafety();
  await testArrayHelper();
  await testRenderToFile();
  await testClearCache();
  await testListTemplates();
  await testValidateDescriptionSafety();
  await testValidateUrlSafety();
  await testGetDepartmentSummaryEdgeCases();
  await testSearchEdgeCases();
  await testExportImportRoundtrip();

  console.log(`\nTotal Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
