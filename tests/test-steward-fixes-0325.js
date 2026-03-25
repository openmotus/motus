/**
 * Steward fixes — 2026-03-25
 *
 * Tests for:
 * 1. export() returns deep copies (mutation safety)
 * 2. search('') returns empty results
 * 3. validate() detects orphan agents/workflows
 * 4. Examples.md references all 11 examples
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const RegistryManager = require('../lib/registry-manager');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    console.error(`  FAIL: ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

// Helper: create a temp directory with a registry manager
async function createTempRegistry() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
  const templatesDir = path.join(tmpDir, 'templates', 'department');
  const agentsDir = path.join(tmpDir, '.claude', 'agents');
  fs.mkdirSync(templatesDir, { recursive: true });
  fs.mkdirSync(agentsDir, { recursive: true });

  // Minimal department template so renderToFile doesn't fail
  fs.writeFileSync(
    path.join(templatesDir, 'department-agent.md.hbs'),
    '---\nname: {{name}}\n---\n{{description}}'
  );

  const registry = new RegistryManager(tmpDir);
  await registry.load();
  return { registry, tmpDir };
}

function cleanupTmp(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    // ignore cleanup errors
  }
}

async function runTests() {
  console.log('Running steward-fixes-0325 tests...\n');

  // ============================================================
  // 1. export() mutation safety
  // ============================================================

  await asyncTest('export() returns deep copies — modifying exported departments does not affect registry', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for export' });
      const exported = await registry.export();

      // Mutate the exported data
      exported.departments.departments['test-dept'].displayName = 'MUTATED';

      // Original should be unchanged
      const dept = registry.getDepartment('test-dept');
      assert.strictEqual(dept.displayName, 'Test', 'Internal state should not be mutated by export modification');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('export() returns deep copies — modifying exported agents does not affect registry', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for export' });
      await registry.addAgent({
        name: 'test-fetcher',
        displayName: 'Test Fetcher',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Fetches test data from APIs'
      });
      const exported = await registry.export();

      // Mutate exported agent
      exported.agents.agents['test-fetcher'].description = 'MUTATED';

      // Original should be unchanged
      const agent = registry.getAgent('test-fetcher');
      assert.strictEqual(agent.description, 'Fetches test data from APIs');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('export() returns deep copies — modifying exported workflows does not affect registry', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for export' });
      await registry.addWorkflow({
        name: 'test-flow',
        displayName: 'Test Flow',
        department: 'test-dept',
        description: 'A test workflow for export'
      });
      const exported = await registry.export();

      // Mutate exported workflow
      exported.workflows.workflows['test-dept-test-flow'].description = 'MUTATED';

      // Original should be unchanged
      const wf = registry.getWorkflow('test-dept', 'test-flow');
      assert.strictEqual(wf.description, 'A test workflow for export');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('export() returns deep copies — deleting exported keys does not affect registry', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for export' });
      const exported = await registry.export();

      // Delete from exported
      delete exported.departments.departments['test-dept'];

      // Original should still exist
      const dept = registry.getDepartment('test-dept');
      assert.ok(dept, 'Department should still exist after deleting from export');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('export() returns deep copies — nested array mutations do not propagate', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for export' });
      await registry.addAgent({
        name: 'test-fetcher',
        displayName: 'Test Fetcher',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Fetches test data from APIs',
        tools: ['Bash', 'Read']
      });
      const exported = await registry.export();

      // Mutate nested array in exported data
      exported.agents.agents['test-fetcher'].tools.push('INJECTED');

      // Original should be unchanged
      const agent = registry.getAgent('test-fetcher');
      assert.ok(!agent.tools.includes('INJECTED'), 'Nested array should not be mutated');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  // ============================================================
  // 2. search('') returns empty results
  // ============================================================

  await asyncTest('search("") returns empty results', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for search' });
      const results = await registry.search('');
      assert.strictEqual(results.departments.length, 0);
      assert.strictEqual(results.agents.length, 0);
      assert.strictEqual(results.workflows.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('search("  ") returns empty results (whitespace only)', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for search' });
      const results = await registry.search('   ');
      assert.strictEqual(results.departments.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('search(null) returns empty results', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for search' });
      const results = await registry.search(null);
      assert.strictEqual(results.departments.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('search(undefined) returns empty results', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for search' });
      const results = await registry.search(undefined);
      assert.strictEqual(results.departments.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('search with valid query still works', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for search' });
      const results = await registry.search('test');
      assert.strictEqual(results.departments.length, 1);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  // ============================================================
  // 3. validate() orphan detection
  // ============================================================

  await asyncTest('validate() detects orphan agent not in department agents list', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for validate' });
      await registry.addAgent({
        name: 'test-fetcher',
        displayName: 'Test Fetcher',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Fetches test data from APIs'
      });

      // Manually remove agent from department's list to simulate orphan
      registry.departments.departments['test-dept'].agents = [];

      const result = await registry.validate();
      assert.strictEqual(result.valid, false, 'Should be invalid with orphan agent');
      assert.ok(
        result.errors.some(e => e.includes('test-fetcher') && e.includes('not in the department')),
        'Should report the orphan agent'
      );
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('validate() detects orphan workflow not in department workflows list', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for validate' });
      await registry.addWorkflow({
        name: 'test-flow',
        displayName: 'Test Flow',
        department: 'test-dept',
        description: 'A test workflow for validate'
      });

      // Manually remove workflow from department's list to simulate orphan
      registry.departments.departments['test-dept'].workflows = [];

      const result = await registry.validate();
      assert.strictEqual(result.valid, false, 'Should be invalid with orphan workflow');
      assert.ok(
        result.errors.some(e => e.includes('test-flow') && e.includes('not in the department')),
        'Should report the orphan workflow'
      );
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('validate() passes when no orphans exist', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for validate' });
      await registry.addAgent({
        name: 'test-fetcher',
        displayName: 'Test Fetcher',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Fetches test data from APIs'
      });
      await registry.addWorkflow({
        name: 'test-flow',
        displayName: 'Test Flow',
        department: 'test-dept',
        description: 'A test workflow for validate',
        agents: ['test-fetcher']
      });

      const result = await registry.validate();
      assert.strictEqual(result.valid, true, `Should be valid, but got errors: ${result.errors.join(', ')}`);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('validate() detects multiple orphans simultaneously', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for validate' });
      await registry.addAgent({
        name: 'fetcher-one',
        displayName: 'Fetcher One',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'First fetcher for orphan detection test'
      });
      await registry.addAgent({
        name: 'fetcher-two',
        displayName: 'Fetcher Two',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Second fetcher for orphan detection test'
      });

      // Remove both from department
      registry.departments.departments['test-dept'].agents = [];

      const result = await registry.validate();
      assert.strictEqual(result.valid, false);
      const orphanErrors = result.errors.filter(e => e.includes('not in the department'));
      assert.strictEqual(orphanErrors.length, 2, 'Should detect both orphan agents');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  // ============================================================
  // 4. Examples.md references all 11 examples
  // ============================================================

  test('Examples.md exists', () => {
    const examplesPath = path.join(__dirname, '..', 'public-docs', 'Examples.md');
    assert.ok(fs.existsSync(examplesPath), 'public-docs/Examples.md should exist');
  });

  test('Examples.md references all 11 example directories', () => {
    const examplesPath = path.join(__dirname, '..', 'public-docs', 'Examples.md');
    const content = fs.readFileSync(examplesPath, 'utf8');

    const expectedExamples = [
      'daily-briefing',
      'content-pipeline',
      'code-review',
      'devops-monitoring',
      'research-assistant',
      'customer-support',
      'data-pipeline',
      'release-manager',
      'meeting-notes',
      'ci-pipeline',
      'programmatic-usage'
    ];

    for (const example of expectedExamples) {
      assert.ok(
        content.includes(`examples/${example}/`),
        `Examples.md should reference examples/${example}/`
      );
    }
  });

  test('Examples.md includes pattern summary table', () => {
    const examplesPath = path.join(__dirname, '..', 'public-docs', 'Examples.md');
    const content = fs.readFileSync(examplesPath, 'utf8');
    assert.ok(content.includes('Patterns at a Glance'), 'Should include pattern summary section');
    assert.ok(content.includes('Fan-out/fan-in'), 'Should include fan-out/fan-in pattern');
    assert.ok(content.includes('Sequential pipeline'), 'Should include sequential pipeline pattern');
  });

  test('Examples.md includes running instructions', () => {
    const examplesPath = path.join(__dirname, '..', 'public-docs', 'Examples.md');
    const content = fs.readFileSync(examplesPath, 'utf8');
    assert.ok(content.includes('Running an Example'), 'Should include running instructions');
  });

  test('All referenced example directories actually exist', () => {
    const examplesDir = path.join(__dirname, '..', 'examples');
    const expectedDirs = [
      'daily-briefing',
      'content-pipeline',
      'code-review',
      'devops-monitoring',
      'research-assistant',
      'customer-support',
      'data-pipeline',
      'release-manager',
      'meeting-notes',
      'ci-pipeline',
      'programmatic-usage'
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(examplesDir, dir);
      assert.ok(
        fs.existsSync(dirPath),
        `Example directory ${dir}/ should exist`
      );
    }
  });

  // ============================================================
  // 5. Edge cases for search
  // ============================================================

  await asyncTest('search(0) returns empty results (number input)', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department' });
      const results = await registry.search(0);
      assert.strictEqual(results.departments.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('search(false) returns empty results (boolean input)', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department' });
      const results = await registry.search(false);
      assert.strictEqual(results.departments.length, 0);
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  // ============================================================
  // 6. Export includes timestamp
  // ============================================================

  await asyncTest('export() includes exported timestamp', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      const exported = await registry.export();
      assert.ok(exported.exported, 'Should include exported timestamp');
      assert.ok(typeof exported.exported === 'string', 'Timestamp should be a string');
      // Should be a valid ISO date
      assert.ok(!isNaN(Date.parse(exported.exported)), 'Should be a valid ISO date');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  await asyncTest('export() roundtrip — import after export preserves data', async () => {
    const { registry, tmpDir } = await createTempRegistry();
    try {
      await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for roundtrip' });
      await registry.addAgent({
        name: 'test-fetcher',
        displayName: 'Test Fetcher',
        department: 'test-dept',
        type: 'data-fetcher',
        description: 'Fetches test data from APIs'
      });

      const exported = await registry.export();

      // Create a new registry and import
      const registry2 = new RegistryManager(tmpDir);
      await registry2.load();
      await registry2.import(exported);

      const dept = registry2.getDepartment('test-dept');
      assert.ok(dept, 'Department should exist after import');
      assert.strictEqual(dept.displayName, 'Test');

      const agent = registry2.getAgent('test-fetcher');
      assert.ok(agent, 'Agent should exist after import');
      assert.strictEqual(agent.description, 'Fetches test data from APIs');
    } finally {
      cleanupTmp(tmpDir);
    }
  });

  // ============================================================
  // Results
  // ============================================================

  console.log(`\nTotal: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
