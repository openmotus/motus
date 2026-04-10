/**
 * Steward Fixes — 2026-04-10
 *
 * Tests for:
 * 1. getWorkflowHealth() — idle workflows (never run)
 * 2. getWorkflowHealth() — healthy workflows (high success rate, recent run)
 * 3. getWorkflowHealth() — degraded workflows (low success rate or stale)
 * 4. getWorkflowHealth() — failing workflows (success rate < 0.5)
 * 5. getWorkflowHealth() — department filter
 * 6. getWorkflowHealth() — status filter
 * 7. getWorkflowHealth() — summary counts
 * 8. getWorkflowHealth() — empty registry
 * 9. getWorkflowHealth() — lastError and lastDurationMs propagation
 * 10. TypeScript definitions for WorkflowHealthResult
 * 11. axios version >= 1.15.0 (SSRF fix)
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

/** Create a temp RegistryManager with multiple workflows in various states. */
async function createTestRegistry() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
  const registry = new RegistryManager(tmpDir);

  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });

  fs.writeFileSync(
    path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'),
    '# {{name}}\n{{description}}'
  );

  await registry.load();

  // Department A
  registry.departments.departments['dept-a'] = {
    name: 'dept-a', displayName: 'Dept A', description: 'First dept',
    created: new Date().toISOString(), status: 'active', version: '1.0.0',
    agents: [], workflows: ['idle-wf', 'healthy-wf', 'degraded-wf', 'failing-wf'],
    integrations: [], responsibilities: []
  };

  // Department B
  registry.departments.departments['dept-b'] = {
    name: 'dept-b', displayName: 'Dept B', description: 'Second dept',
    created: new Date().toISOString(), status: 'active', version: '1.0.0',
    agents: [], workflows: ['other-wf'],
    integrations: [], responsibilities: []
  };

  const now = new Date();
  const recentRun = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
  const staleRun = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago

  const baseWorkflow = {
    orchestrator: 'test-orchestrator', agents: [],
    trigger: { type: 'manual', enabled: true },
    output: { type: 'console', destination: null },
    estimatedDuration: 'unknown', version: '1.0.0'
  };

  // Idle workflow — never run
  registry.workflows.workflows['dept-a-idle-wf'] = {
    ...baseWorkflow, name: 'idle-wf', displayName: 'Idle WF',
    department: 'dept-a', description: 'Never been run',
    created: now.toISOString(), lastRun: null, runCount: 0, successRate: 1.0
  };

  // Healthy workflow — high success rate, recent run
  registry.workflows.workflows['dept-a-healthy-wf'] = {
    ...baseWorkflow, name: 'healthy-wf', displayName: 'Healthy WF',
    department: 'dept-a', description: 'Running well',
    created: now.toISOString(), lastRun: recentRun, runCount: 10, successRate: 0.95,
    lastDurationMs: 3200
  };

  // Degraded workflow — success rate between 0.5 and 0.9
  registry.workflows.workflows['dept-a-degraded-wf'] = {
    ...baseWorkflow, name: 'degraded-wf', displayName: 'Degraded WF',
    department: 'dept-a', description: 'Intermittent failures',
    created: now.toISOString(), lastRun: recentRun, runCount: 20, successRate: 0.7,
    lastError: 'API timeout'
  };

  // Failing workflow — success rate < 0.5
  registry.workflows.workflows['dept-a-failing-wf'] = {
    ...baseWorkflow, name: 'failing-wf', displayName: 'Failing WF',
    department: 'dept-a', description: 'Mostly failing',
    created: now.toISOString(), lastRun: recentRun, runCount: 8, successRate: 0.25,
    lastError: 'Connection refused', lastDurationMs: 150
  };

  // Other dept workflow — healthy but stale (degraded due to >7 days)
  registry.workflows.workflows['dept-b-other-wf'] = {
    ...baseWorkflow, name: 'other-wf', displayName: 'Other WF',
    department: 'dept-b', description: 'Stale but was healthy',
    created: now.toISOString(), lastRun: staleRun, runCount: 5, successRate: 1.0
  };

  registry.departments.metadata.totalDepartments = 2;
  registry.workflows.metadata.totalWorkflows = 5;

  await registry.save();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function runTests() {
  const repoRoot = path.join(__dirname, '..');

  // ==========================================
  // getWorkflowHealth() — basic operation
  // ==========================================

  await testAsync('getWorkflowHealth: returns all workflows with no filters', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      assert.strictEqual(health.workflows.length, 5);
      assert.strictEqual(health.summary.total, 5);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: idle status for never-run workflow', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      const idle = health.workflows.find(w => w.name === 'idle-wf');
      assert.ok(idle, 'idle workflow should be present');
      assert.strictEqual(idle.status, 'idle');
      assert.strictEqual(idle.runCount, 0);
      assert.strictEqual(idle.lastRun, null);
      assert.strictEqual(idle.daysSinceLastRun, null);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: healthy status for high success rate + recent run', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      const healthy = health.workflows.find(w => w.name === 'healthy-wf');
      assert.ok(healthy, 'healthy workflow should be present');
      assert.strictEqual(healthy.status, 'healthy');
      assert.strictEqual(healthy.runCount, 10);
      assert.strictEqual(healthy.successRate, 0.95);
      assert.strictEqual(healthy.lastDurationMs, 3200);
      assert.ok(healthy.daysSinceLastRun !== null && healthy.daysSinceLastRun < 3, 'should be recent');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: degraded status for low success rate (0.5-0.9)', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      const degraded = health.workflows.find(w => w.name === 'degraded-wf');
      assert.ok(degraded, 'degraded workflow should be present');
      assert.strictEqual(degraded.status, 'degraded');
      assert.strictEqual(degraded.successRate, 0.7);
      assert.strictEqual(degraded.lastError, 'API timeout');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: degraded status for stale run (>7 days)', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      const stale = health.workflows.find(w => w.name === 'other-wf');
      assert.ok(stale, 'stale workflow should be present');
      assert.strictEqual(stale.status, 'degraded');
      assert.strictEqual(stale.successRate, 1.0);
      assert.ok(stale.daysSinceLastRun > 7, 'should be older than 7 days');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: failing status for success rate < 0.5', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      const failing = health.workflows.find(w => w.name === 'failing-wf');
      assert.ok(failing, 'failing workflow should be present');
      assert.strictEqual(failing.status, 'failing');
      assert.strictEqual(failing.successRate, 0.25);
      assert.strictEqual(failing.lastError, 'Connection refused');
      assert.strictEqual(failing.lastDurationMs, 150);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — summary counts
  // ==========================================

  await testAsync('getWorkflowHealth: summary counts are correct', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      assert.strictEqual(health.summary.total, 5);
      assert.strictEqual(health.summary.healthy, 1);
      assert.strictEqual(health.summary.degraded, 2); // degraded-wf + stale other-wf
      assert.strictEqual(health.summary.failing, 1);
      assert.strictEqual(health.summary.idle, 1);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — department filter
  // ==========================================

  await testAsync('getWorkflowHealth: filters by department', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ department: 'dept-a' });
      assert.strictEqual(health.workflows.length, 4);
      assert.ok(health.workflows.every(w => w.department === 'dept-a'), 'all should be from dept-a');
      assert.strictEqual(health.summary.total, 4);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: filters by dept-b', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ department: 'dept-b' });
      assert.strictEqual(health.workflows.length, 1);
      assert.strictEqual(health.workflows[0].name, 'other-wf');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: returns empty for non-existent department', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ department: 'nope' });
      assert.strictEqual(health.workflows.length, 0);
      assert.strictEqual(health.summary.total, 0);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — status filter
  // ==========================================

  await testAsync('getWorkflowHealth: filters by status=healthy', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'healthy' });
      assert.strictEqual(health.workflows.length, 1);
      assert.strictEqual(health.workflows[0].name, 'healthy-wf');
      assert.strictEqual(health.summary.healthy, 1);
      assert.strictEqual(health.summary.total, 1);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: filters by status=failing', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'failing' });
      assert.strictEqual(health.workflows.length, 1);
      assert.strictEqual(health.workflows[0].name, 'failing-wf');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: filters by status=idle', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'idle' });
      assert.strictEqual(health.workflows.length, 1);
      assert.strictEqual(health.workflows[0].name, 'idle-wf');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: combined department + status filter', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ department: 'dept-a', status: 'degraded' });
      assert.strictEqual(health.workflows.length, 1);
      assert.strictEqual(health.workflows[0].name, 'degraded-wf');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — empty registry
  // ==========================================

  await testAsync('getWorkflowHealth: empty registry returns zeros', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registry = new RegistryManager(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
    await registry.load();
    try {
      const health = await registry.getWorkflowHealth();
      assert.strictEqual(health.workflows.length, 0);
      assert.strictEqual(health.summary.total, 0);
      assert.strictEqual(health.summary.healthy, 0);
      assert.strictEqual(health.summary.degraded, 0);
      assert.strictEqual(health.summary.failing, 0);
      assert.strictEqual(health.summary.idle, 0);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — field correctness
  // ==========================================

  await testAsync('getWorkflowHealth: daysSinceLastRun is null for idle workflows', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'idle' });
      assert.strictEqual(health.workflows[0].daysSinceLastRun, null);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: daysSinceLastRun is a number for run workflows', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'healthy' });
      assert.strictEqual(typeof health.workflows[0].daysSinceLastRun, 'number');
      assert.ok(health.workflows[0].daysSinceLastRun >= 0, 'daysSinceLastRun should be non-negative');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: lastError is null when no error', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'healthy' });
      assert.strictEqual(health.workflows[0].lastError, null);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: lastDurationMs is null when not tracked', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth({ status: 'idle' });
      assert.strictEqual(health.workflows[0].lastDurationMs, null);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: successRate is rounded to 3 decimal places', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health = await registry.getWorkflowHealth();
      health.workflows.forEach(w => {
        const str = w.successRate.toString();
        const decimals = str.includes('.') ? str.split('.')[1].length : 0;
        assert.ok(decimals <= 3, `successRate ${w.successRate} has too many decimals`);
      });
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getWorkflowHealth() — edge cases
  // ==========================================

  await testAsync('getWorkflowHealth: workflow at exactly 0.5 success rate is degraded (not failing)', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registry = new RegistryManager(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
    await registry.load();
    registry.departments.departments['edge'] = {
      name: 'edge', displayName: 'Edge', description: 'Edge case dept',
      created: new Date().toISOString(), status: 'active', version: '1.0.0',
      agents: [], workflows: ['half'], integrations: [], responsibilities: []
    };
    registry.workflows.workflows['edge-half'] = {
      name: 'half', displayName: 'Half', department: 'edge',
      description: 'Exactly 50%', orchestrator: 'test', agents: [],
      trigger: { type: 'manual', enabled: true },
      output: { type: 'console', destination: null },
      estimatedDuration: 'unknown', created: new Date().toISOString(), version: '1.0.0',
      lastRun: new Date().toISOString(), runCount: 10, successRate: 0.5
    };
    registry.loaded = true;
    await registry.save();
    try {
      const health = await registry.getWorkflowHealth();
      assert.strictEqual(health.workflows[0].status, 'degraded');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: workflow at exactly 0.9 success rate is healthy', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registry = new RegistryManager(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
    await registry.load();
    registry.departments.departments['edge2'] = {
      name: 'edge2', displayName: 'Edge2', description: 'Edge case dept 2',
      created: new Date().toISOString(), status: 'active', version: '1.0.0',
      agents: [], workflows: ['ninety'], integrations: [], responsibilities: []
    };
    registry.workflows.workflows['edge2-ninety'] = {
      name: 'ninety', displayName: 'Ninety', department: 'edge2',
      description: 'Exactly 90%', orchestrator: 'test', agents: [],
      trigger: { type: 'manual', enabled: true },
      output: { type: 'console', destination: null },
      estimatedDuration: 'unknown', created: new Date().toISOString(), version: '1.0.0',
      lastRun: new Date().toISOString(), runCount: 10, successRate: 0.9
    };
    registry.loaded = true;
    await registry.save();
    try {
      const health = await registry.getWorkflowHealth();
      assert.strictEqual(health.workflows[0].status, 'healthy');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getWorkflowHealth: default empty filters behaves like no argument', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const health1 = await registry.getWorkflowHealth();
      const health2 = await registry.getWorkflowHealth({});
      assert.strictEqual(health1.workflows.length, health2.workflows.length);
      assert.strictEqual(health1.summary.total, health2.summary.total);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // TypeScript definitions
  // ==========================================

  test('TypeScript: index.d.ts exports WorkflowHealthResult', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(dts.includes('WorkflowHealthResult'), 'Should export WorkflowHealthResult');
    assert.ok(dts.includes('WorkflowHealthEntry'), 'Should export WorkflowHealthEntry');
    assert.ok(dts.includes('WorkflowHealthStatus'), 'Should export WorkflowHealthStatus');
  });

  test('TypeScript: getWorkflowHealth method signature exists', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(dts.includes('getWorkflowHealth'), 'Should have getWorkflowHealth method');
    assert.ok(dts.includes('WorkflowHealthResult'), 'Return type should be WorkflowHealthResult');
  });

  test('TypeScript: WorkflowHealthStatus includes all four statuses', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(dts.includes("'healthy'"), 'Should include healthy');
    assert.ok(dts.includes("'degraded'"), 'Should include degraded');
    assert.ok(dts.includes("'failing'"), 'Should include failing');
    assert.ok(dts.includes("'idle'"), 'Should include idle');
  });

  // ==========================================
  // axios version check (SSRF fix)
  // ==========================================

  test('axios: version >= 1.15.0 (SSRF vulnerability fix)', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const axiosDep = pkg.dependencies.axios;
    // Extract version number from semver range (^1.15.0 → 1.15.0)
    const version = axiosDep.replace(/^[\^~>=<]*/, '');
    const [major, minor] = version.split('.').map(Number);
    assert.ok(
      major > 1 || (major === 1 && minor >= 15),
      `axios version ${axiosDep} should be >= 1.15.0 to fix SSRF vulnerability`
    );
  });

  test('axios: installed version is >= 1.15.0', () => {
    const installedPkg = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'node_modules', 'axios', 'package.json'), 'utf8')
    );
    const [major, minor] = installedPkg.version.split('.').map(Number);
    assert.ok(
      major > 1 || (major === 1 && minor >= 15),
      `Installed axios ${installedPkg.version} should be >= 1.15.0`
    );
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
