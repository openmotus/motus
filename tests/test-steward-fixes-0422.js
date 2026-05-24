/**
 * Steward Fixes — 2026-04-22
 *
 * Tests for:
 * 1. getAgentUsage() — unused agents (no workflow references)
 * 2. getAgentUsage() — low usage (1 workflow)
 * 3. getAgentUsage() — medium usage (2–4 workflows)
 * 4. getAgentUsage() — high usage (5+ workflows)
 * 5. getAgentUsage() — department filter
 * 6. getAgentUsage() — type filter
 * 7. getAgentUsage() — usage filter
 * 8. getAgentUsage() — combined filters
 * 9. getAgentUsage() — summary counts (usage levels, byType, byDepartment)
 * 10. getAgentUsage() — workflow references carry {id, name, department}
 * 11. getAgentUsage() — empty registry returns zeros
 * 12. getAgentUsage() — uses live workflow.agents (not stale usedInWorkflows)
 * 13. TypeScript definitions for AgentUsageResult
 * 14. follow-redirects vulnerability resolved (npm audit clean)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');
const { execSync } = require('child_process');
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

/**
 * Create a temp RegistryManager with agents in all usage states:
 *   - unused-agent (dept-a, specialist) — no workflow references
 *   - used-once (dept-a, data-fetcher) — 1 workflow
 *   - used-twice (dept-a, orchestrator) — 2 workflows (medium)
 *   - used-heavily (dept-b, data-fetcher) — 5 workflows (high)
 *   - cross-dept (dept-b, specialist) — 1 workflow (low)
 */
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

  registry.departments.departments['dept-a'] = {
    name: 'dept-a', displayName: 'Dept A', description: 'First dept',
    created: new Date().toISOString(), status: 'active', version: '1.0.0',
    agents: ['unused-agent', 'used-once', 'used-twice'],
    workflows: ['wf-1', 'wf-2', 'wf-3'],
    integrations: [], responsibilities: []
  };

  registry.departments.departments['dept-b'] = {
    name: 'dept-b', displayName: 'Dept B', description: 'Second dept',
    created: new Date().toISOString(), status: 'active', version: '1.0.0',
    agents: ['used-heavily', 'cross-dept'],
    workflows: ['wf-4', 'wf-5', 'wf-6', 'wf-7', 'wf-8'],
    integrations: [], responsibilities: []
  };

  const now = new Date().toISOString();
  const baseAgent = { created: now, version: '1.0.0', tools: [], model: 'sonnet', script: null };

  registry.agents.agents['unused-agent'] = {
    ...baseAgent, name: 'unused-agent', displayName: 'Unused', department: 'dept-a',
    type: 'specialist', description: 'Never referenced', usedInWorkflows: []
  };
  registry.agents.agents['used-once'] = {
    ...baseAgent, name: 'used-once', displayName: 'Used Once', department: 'dept-a',
    type: 'data-fetcher', description: 'Referenced by a single workflow',
    usedInWorkflows: ['dept-a-wf-1']
  };
  registry.agents.agents['used-twice'] = {
    ...baseAgent, name: 'used-twice', displayName: 'Used Twice', department: 'dept-a',
    type: 'orchestrator', description: 'Referenced by two workflows',
    usedInWorkflows: ['dept-a-wf-1', 'dept-a-wf-2']
  };
  registry.agents.agents['used-heavily'] = {
    ...baseAgent, name: 'used-heavily', displayName: 'Used Heavily', department: 'dept-b',
    type: 'data-fetcher', description: 'Referenced by five workflows',
    usedInWorkflows: ['dept-b-wf-4', 'dept-b-wf-5', 'dept-b-wf-6', 'dept-b-wf-7', 'dept-b-wf-8']
  };
  registry.agents.agents['cross-dept'] = {
    ...baseAgent, name: 'cross-dept', displayName: 'Cross', department: 'dept-b',
    type: 'specialist', description: 'Referenced by one dept-a workflow',
    usedInWorkflows: ['dept-a-wf-3']
  };

  const baseWorkflow = {
    trigger: { type: 'manual', enabled: true },
    output: { type: 'console', destination: null },
    estimatedDuration: 'unknown', version: '1.0.0',
    created: now, lastRun: null, runCount: 0, successRate: 1.0
  };

  registry.workflows.workflows['dept-a-wf-1'] = {
    ...baseWorkflow, name: 'wf-1', displayName: 'WF 1', department: 'dept-a',
    description: 'Uses used-once + used-twice',
    orchestrator: 'used-twice', agents: ['used-once', 'used-twice']
  };
  registry.workflows.workflows['dept-a-wf-2'] = {
    ...baseWorkflow, name: 'wf-2', displayName: 'WF 2', department: 'dept-a',
    description: 'Uses used-twice',
    orchestrator: 'used-twice', agents: ['used-twice']
  };
  registry.workflows.workflows['dept-a-wf-3'] = {
    ...baseWorkflow, name: 'wf-3', displayName: 'WF 3', department: 'dept-a',
    description: 'Uses cross-dept agent',
    orchestrator: 'cross-dept', agents: ['cross-dept']
  };
  for (let i = 4; i <= 8; i++) {
    registry.workflows.workflows[`dept-b-wf-${i}`] = {
      ...baseWorkflow, name: `wf-${i}`, displayName: `WF ${i}`, department: 'dept-b',
      description: 'Uses used-heavily',
      orchestrator: 'used-heavily', agents: ['used-heavily']
    };
  }

  registry.departments.metadata.totalDepartments = 2;
  registry.agents.metadata.totalAgents = 5;
  registry.workflows.metadata.totalWorkflows = 8;

  await registry.save();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function runTests() {
  const repoRoot = path.join(__dirname, '..');

  // ==========================================
  // getAgentUsage() — usage classification
  // ==========================================

  await testAsync('getAgentUsage: returns all agents with no filters', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      assert.strictEqual(usage.agents.length, 5);
      assert.strictEqual(usage.summary.total, 5);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: unused agent is flagged with usage=unused', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const unused = usage.agents.find(a => a.name === 'unused-agent');
      assert.ok(unused, 'unused agent should be present');
      assert.strictEqual(unused.usage, 'unused');
      assert.strictEqual(unused.workflowCount, 0);
      assert.deepStrictEqual(unused.workflows, []);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: low usage for single-workflow agents', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const low = usage.agents.find(a => a.name === 'used-once');
      assert.ok(low, 'low agent should be present');
      assert.strictEqual(low.usage, 'low');
      assert.strictEqual(low.workflowCount, 1);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: medium usage for 2-workflow agents', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const medium = usage.agents.find(a => a.name === 'used-twice');
      assert.ok(medium);
      assert.strictEqual(medium.usage, 'medium');
      assert.strictEqual(medium.workflowCount, 2);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: high usage for 5-workflow agents', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const high = usage.agents.find(a => a.name === 'used-heavily');
      assert.ok(high);
      assert.strictEqual(high.usage, 'high');
      assert.strictEqual(high.workflowCount, 5);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — summary counts
  // ==========================================

  await testAsync('getAgentUsage: summary counts are correct', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      assert.strictEqual(usage.summary.total, 5);
      assert.strictEqual(usage.summary.unused, 1);
      assert.strictEqual(usage.summary.low, 2);   // used-once + cross-dept
      assert.strictEqual(usage.summary.medium, 1); // used-twice
      assert.strictEqual(usage.summary.high, 1);   // used-heavily
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: byType summary is correct', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      assert.strictEqual(usage.summary.byType['data-fetcher'], 2);
      assert.strictEqual(usage.summary.byType['specialist'], 2);
      assert.strictEqual(usage.summary.byType['orchestrator'], 1);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: byDepartment summary is correct', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      assert.strictEqual(usage.summary.byDepartment['dept-a'], 3);
      assert.strictEqual(usage.summary.byDepartment['dept-b'], 2);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — department filter
  // ==========================================

  await testAsync('getAgentUsage: filters by department', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ department: 'dept-a' });
      assert.strictEqual(usage.agents.length, 3);
      assert.ok(usage.agents.every(a => a.department === 'dept-a'));
      assert.strictEqual(usage.summary.total, 3);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: non-existent department returns empty', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ department: 'nope' });
      assert.strictEqual(usage.agents.length, 0);
      assert.strictEqual(usage.summary.total, 0);
      assert.deepStrictEqual(usage.summary.byType, {});
      assert.deepStrictEqual(usage.summary.byDepartment, {});
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — type filter
  // ==========================================

  await testAsync('getAgentUsage: filters by type=data-fetcher', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ type: 'data-fetcher' });
      assert.strictEqual(usage.agents.length, 2);
      assert.ok(usage.agents.every(a => a.type === 'data-fetcher'));
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: filters by type=orchestrator', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ type: 'orchestrator' });
      assert.strictEqual(usage.agents.length, 1);
      assert.strictEqual(usage.agents[0].name, 'used-twice');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — usage filter
  // ==========================================

  await testAsync('getAgentUsage: filters by usage=unused', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ usage: 'unused' });
      assert.strictEqual(usage.agents.length, 1);
      assert.strictEqual(usage.agents[0].name, 'unused-agent');
      assert.strictEqual(usage.summary.unused, 1);
      assert.strictEqual(usage.summary.total, 1);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: filters by usage=high', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ usage: 'high' });
      assert.strictEqual(usage.agents.length, 1);
      assert.strictEqual(usage.agents[0].name, 'used-heavily');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — combined filters
  // ==========================================

  await testAsync('getAgentUsage: combined department + type + usage', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({
        department: 'dept-a', type: 'specialist', usage: 'unused'
      });
      assert.strictEqual(usage.agents.length, 1);
      assert.strictEqual(usage.agents[0].name, 'unused-agent');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — workflow references
  // ==========================================

  await testAsync('getAgentUsage: workflows array contains {id, name, department}', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const twice = usage.agents.find(a => a.name === 'used-twice');
      assert.strictEqual(twice.workflows.length, 2);
      for (const ref of twice.workflows) {
        assert.ok(ref.id && typeof ref.id === 'string', 'workflow ref must have id');
        assert.ok(ref.name && typeof ref.name === 'string', 'workflow ref must have name');
        assert.ok(ref.department && typeof ref.department === 'string', 'workflow ref must have department');
      }
      const ids = twice.workflows.map(w => w.id).sort();
      assert.deepStrictEqual(ids, ['dept-a-wf-1', 'dept-a-wf-2']);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: cross-department usage is correctly tracked', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage();
      const cross = usage.agents.find(a => a.name === 'cross-dept');
      assert.strictEqual(cross.workflowCount, 1);
      // cross-dept lives in dept-b but is used by a dept-a workflow
      assert.strictEqual(cross.department, 'dept-b');
      assert.strictEqual(cross.workflows[0].department, 'dept-a');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — live lookup vs stale refs
  // ==========================================

  await testAsync('getAgentUsage: uses live workflow.agents (ignores stale usedInWorkflows)', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      // Simulate drift: agent claims it's used but no workflow references it.
      registry.agents.agents['unused-agent'].usedInWorkflows = ['dept-a-wf-1', 'dept-a-wf-2'];
      await registry.save();

      const usage = await registry.getAgentUsage();
      const unused = usage.agents.find(a => a.name === 'unused-agent');
      assert.strictEqual(unused.usage, 'unused', 'should be unused despite stale usedInWorkflows');
      assert.strictEqual(unused.workflowCount, 0);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // getAgentUsage() — empty registry
  // ==========================================

  await testAsync('getAgentUsage: empty registry returns zeros', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registry = new RegistryManager(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
    await registry.load();
    try {
      const usage = await registry.getAgentUsage();
      assert.strictEqual(usage.agents.length, 0);
      assert.strictEqual(usage.summary.total, 0);
      assert.strictEqual(usage.summary.unused, 0);
      assert.strictEqual(usage.summary.low, 0);
      assert.strictEqual(usage.summary.medium, 0);
      assert.strictEqual(usage.summary.high, 0);
      assert.deepStrictEqual(usage.summary.byType, {});
      assert.deepStrictEqual(usage.summary.byDepartment, {});
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: filter returning empty set yields consistent summary', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const usage = await registry.getAgentUsage({ usage: 'unused', department: 'dept-b' });
      assert.strictEqual(usage.agents.length, 0);
      assert.strictEqual(usage.summary.total, 0);
      assert.strictEqual(usage.summary.unused, 0);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('getAgentUsage: ignores workflows with missing/non-array agents field', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      // Corrupt a workflow's agents field — should not crash
      registry.workflows.workflows['dept-a-wf-1'].agents = undefined;
      await registry.save();
      const usage = await registry.getAgentUsage();
      // used-once had only wf-1 — now it should be unused
      const once = usage.agents.find(a => a.name === 'used-once');
      assert.strictEqual(once.usage, 'unused');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // TypeScript definitions
  // ==========================================

  test('TypeScript: index.d.ts declares AgentUsageResult and related types', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(dts.includes('AgentUsageResult'), 'AgentUsageResult should be declared');
    assert.ok(dts.includes('AgentUsageEntry'), 'AgentUsageEntry should be declared');
    assert.ok(dts.includes('AgentUsageLevel'), 'AgentUsageLevel should be declared');
    assert.ok(dts.includes("AgentUsageLevel = 'unused' | 'low' | 'medium' | 'high'"),
      'AgentUsageLevel should enumerate all four levels');
    assert.ok(dts.includes('getAgentUsage'), 'getAgentUsage method should be declared');
    assert.ok(dts.includes('AgentUsageWorkflowRef'), 'AgentUsageWorkflowRef should be declared');
  });

  test('TypeScript: AgentUsageResult.summary includes byType and byDepartment', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(/byType:\s*Record<string,\s*number>/.test(dts), 'byType should be typed as Record');
    assert.ok(/byDepartment:\s*Record<string,\s*number>/.test(dts), 'byDepartment should be typed as Record');
  });

  // ==========================================
  // follow-redirects vulnerability
  // ==========================================

  test('follow-redirects: npm audit reports no unexpected high/critical vulnerabilities', () => {
    let audit;
    try {
      audit = execSync('npm audit --json', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
    } catch (err) {
      // npm audit returns non-zero when vulns exist — still capture stdout
      audit = err.stdout ? err.stdout.toString() : '';
    }
    const parsed = JSON.parse(audit);
    const vulns = parsed.metadata && parsed.metadata.vulnerabilities;
    assert.ok(vulns, 'audit metadata should include vulnerabilities');
    // Known exception: uuid transitive via googleapis (<11.1.1) requires breaking googleapis@172 update.
    // All remaining vulns are in this dependency chain (uuid/gaxios/googleapis-common/googleapis).
    // High and critical must always be zero.
    assert.strictEqual(vulns.high, 0, `high vulns should be 0, got ${vulns.high}`);
    assert.strictEqual(vulns.critical, 0, `critical vulns should be 0, got ${vulns.critical}`);
    // Moderate must be only the known googleapis transitive chain (max 4)
    const knownModerate = (parsed.vulnerabilities && Object.keys(parsed.vulnerabilities)
      .filter(pkg => ['uuid', 'gaxios', 'googleapis-common', 'googleapis'].includes(pkg)).length) || 0;
    const unexpectedModerate = vulns.moderate - knownModerate;
    assert.strictEqual(unexpectedModerate, 0, `unexpected moderate vulns: ${unexpectedModerate} (total ${vulns.moderate}, known ${knownModerate})`);
  });

  // ==========================================
  // Report
  // ==========================================

  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

runTests();
