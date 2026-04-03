/**
 * Steward Fixes — 2026-04-03
 *
 * Tests for:
 * 1. recordWorkflowRun() — success tracking, failure tracking, duration, error messages
 * 2. recordWorkflowRun() — success rate calculation across multiple runs
 * 3. recordWorkflowRun() — input validation and error handling
 * 4. Examples: onboarding-automation and release-manager README existence
 * 5. Examples index (examples/README.md) existence and content
 * 6. TypeScript definition for recordWorkflowRun()
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');
const RegistryManager = require('../lib/registry-manager');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`    FAIL: ${name}: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.error(`    FAIL: ${name}: ${err.message}`);
  }
}

/** Create a temp RegistryManager with a department and workflow pre-loaded. */
async function createTestRegistry() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
  const registry = new RegistryManager(tmpDir);

  // Create required directories
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });

  // Minimal department agent template
  fs.writeFileSync(
    path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'),
    '# {{name}}\n{{description}}'
  );

  await registry.load();

  // Manually insert a department and workflow to avoid template generation
  registry.departments.departments['test-dept'] = {
    name: 'test-dept',
    displayName: 'Test Dept',
    description: 'Test department',
    created: new Date().toISOString(),
    status: 'active',
    version: '1.0.0',
    agents: [],
    workflows: ['test-workflow'],
    integrations: [],
    responsibilities: []
  };

  registry.workflows.workflows['test-dept-test-workflow'] = {
    name: 'test-workflow',
    displayName: 'Test Workflow',
    department: 'test-dept',
    description: 'A workflow for testing',
    orchestrator: 'test-dept-orchestrator',
    agents: [],
    trigger: { type: 'manual', enabled: true },
    output: { type: 'console', destination: null },
    estimatedDuration: 'unknown',
    created: new Date().toISOString(),
    version: '1.0.0',
    lastRun: null,
    runCount: 0,
    successRate: 1.0
  };

  registry.departments.metadata.totalDepartments = 1;
  registry.workflows.metadata.totalWorkflows = 1;

  await registry.save();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function runTests() {
  const repoRoot = path.join(__dirname, '..');

  // ==========================================
  // recordWorkflowRun() — basic success
  // ==========================================

  await testAsync('recordWorkflowRun: records a successful run', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow');
      assert.strictEqual(result.runCount, 1);
      assert.strictEqual(result.successRate, 1.0);
      assert.ok(result.lastRun, 'lastRun should be set');
      assert.ok(!result.lastError, 'lastError should not be set on success');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: records a successful run with duration', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: true,
        durationMs: 1500
      });
      assert.strictEqual(result.runCount, 1);
      assert.strictEqual(result.lastDurationMs, 1500);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: defaults to success when no result provided', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {});
      assert.strictEqual(result.successRate, 1.0);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // recordWorkflowRun() — failure tracking
  // ==========================================

  await testAsync('recordWorkflowRun: records a failed run', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: false,
        error: 'API timeout'
      });
      assert.strictEqual(result.runCount, 1);
      assert.strictEqual(result.successRate, 0);
      assert.strictEqual(result.lastError, 'API timeout');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: clears lastError on subsequent success', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: false,
        error: 'Network error'
      });
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: true
      });
      assert.strictEqual(result.lastError, undefined);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // recordWorkflowRun() — success rate calculation
  // ==========================================

  await testAsync('recordWorkflowRun: calculates correct success rate over multiple runs', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: false });
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      assert.strictEqual(result.runCount, 4);
      // 3 successes out of 4 = 0.75
      assert.ok(Math.abs(result.successRate - 0.75) < 0.01, `Expected ~0.75, got ${result.successRate}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: tracks 0% success rate for all failures', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: false });
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: false });
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: false });
      assert.strictEqual(result.runCount, 3);
      assert.strictEqual(result.successRate, 0);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: tracks 100% success rate for all successes', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', { success: true });
      assert.strictEqual(result.runCount, 3);
      assert.strictEqual(result.successRate, 1.0);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // recordWorkflowRun() — persistence
  // ==========================================

  await testAsync('recordWorkflowRun: persists run data to disk', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: true,
        durationMs: 2000
      });

      // Re-load from disk and verify
      const registry2 = new RegistryManager(tmpDir);
      await registry2.load();
      const workflow = registry2.getWorkflow('test-dept', 'test-workflow');
      assert.strictEqual(workflow.runCount, 1);
      assert.strictEqual(workflow.lastDurationMs, 2000);
      assert.ok(workflow.lastRun);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // recordWorkflowRun() — input validation
  // ==========================================

  await testAsync('recordWorkflowRun: throws on missing department', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.recordWorkflowRun('', 'test-workflow'),
        /Department name is required/
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: throws on missing workflow name', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.recordWorkflowRun('test-dept', ''),
        /Workflow name is required/
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: throws on non-existent workflow', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.recordWorkflowRun('test-dept', 'nonexistent'),
        /not found/
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: throws on null department', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.recordWorkflowRun(null, 'test-workflow'),
        /Department name is required/
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: throws on numeric name', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.recordWorkflowRun('test-dept', 123),
        /Workflow name is required/
      );
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // recordWorkflowRun() — edge cases
  // ==========================================

  await testAsync('recordWorkflowRun: handles undefined durationMs gracefully', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: true
      });
      assert.strictEqual(result.lastDurationMs, undefined);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: overwrites duration on subsequent run', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await registry.recordWorkflowRun('test-dept', 'test-workflow', { durationMs: 1000 });
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', { durationMs: 500 });
      assert.strictEqual(result.lastDurationMs, 500);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('recordWorkflowRun: failure without error message does not set lastError', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const result = await registry.recordWorkflowRun('test-dept', 'test-workflow', {
        success: false
      });
      assert.strictEqual(result.successRate, 0);
      assert.strictEqual(result.lastError, undefined);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Example READMEs exist
  // ==========================================

  test('onboarding-automation example has README.md', () => {
    const readmePath = path.join(repoRoot, 'examples', 'onboarding-automation', 'README.md');
    assert.ok(fs.existsSync(readmePath), `Missing: ${readmePath}`);
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(content.includes('Employee Onboarding'), 'README should mention onboarding');
    assert.ok(content.includes('document-collector'), 'README should mention agents');
  });

  test('release-manager example has README.md', () => {
    const readmePath = path.join(repoRoot, 'examples', 'release-manager', 'README.md');
    assert.ok(fs.existsSync(readmePath), `Missing: ${readmePath}`);
    const content = fs.readFileSync(readmePath, 'utf8');
    assert.ok(content.includes('Release Manager'), 'README should mention release manager');
    assert.ok(content.includes('version-bumper'), 'README should mention agents');
  });

  // ==========================================
  // Examples index exists and lists all 13
  // ==========================================

  test('examples/README.md index exists', () => {
    const indexPath = path.join(repoRoot, 'examples', 'README.md');
    assert.ok(fs.existsSync(indexPath), `Missing: ${indexPath}`);
  });

  test('examples/README.md references all 13 examples', () => {
    const indexPath = path.join(repoRoot, 'examples', 'README.md');
    const content = fs.readFileSync(indexPath, 'utf8');
    const expectedExamples = [
      'daily-briefing', 'content-pipeline', 'code-review', 'devops-monitoring',
      'programmatic-usage', 'research-assistant', 'customer-support', 'data-pipeline',
      'release-manager', 'meeting-notes', 'ci-pipeline', 'onboarding-automation',
      'notification-router'
    ];
    for (const example of expectedExamples) {
      assert.ok(content.includes(example), `Index should reference ${example}`);
    }
  });

  // ==========================================
  // TypeScript definitions
  // ==========================================

  test('index.d.ts includes recordWorkflowRun', () => {
    const dtsPath = path.join(repoRoot, 'index.d.ts');
    const content = fs.readFileSync(dtsPath, 'utf8');
    assert.ok(content.includes('recordWorkflowRun'), 'Should export recordWorkflowRun');
    assert.ok(content.includes('durationMs'), 'Should include durationMs param');
  });

  // ==========================================
  // Report
  // ==========================================

  console.log(`\nTotal: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.log('  Failures:');
    failures.forEach(f => console.log(`    - ${f.name}: ${f.error}`));
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});
