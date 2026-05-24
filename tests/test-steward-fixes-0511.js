/**
 * Steward Fixes — 2026-05-11
 *
 * Tests for:
 *  1. exportMermaid() — renders a Mermaid flowchart string
 *  2. exportMermaid() — default direction is LR
 *  3. exportMermaid() — direction option works for TD/TB/BT/RL
 *  4. exportMermaid() — invalid direction throws
 *  5. exportMermaid() — wraps each department in a labelled subgraph
 *  6. exportMermaid() — renders an agent node for each agent
 *  7. exportMermaid() — renders a workflow node for each workflow
 *  8. exportMermaid() — draws agent → workflow edges from workflow.agents
 *  9. exportMermaid() — type icons differ by agent type
 * 10. exportMermaid() — department filter scopes to one department
 * 11. exportMermaid() — includeWorkflows=false omits workflows and edges
 * 12. exportMermaid() — includeAgents=false omits agents and edges
 * 13. exportMermaid() — orphan agents/workflows surface under an Orphans subgraph
 * 14. exportMermaid() — includeOrphans=false suppresses the Orphans subgraph
 * 15. exportMermaid() — department filter ignores orphans (no orphan subgraph)
 * 16. exportMermaid() — title prepends a Mermaid front-matter title block
 * 17. exportMermaid() — empty registry produces a header-only diagram
 * 18. exportMermaid() — escapes special characters in node labels
 * 19. exportMermaid() — de-duplicates repeated edges
 * 20. exportMermaid() — tolerates workflows with missing/non-array agents
 * 21. TypeScript definitions: exportMermaid on RegistryManager
 * 22. TypeScript definitions: MermaidExportOptions interface
 * 23. axios vulnerability resolved (npm audit clean)
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
 * Build a registry with:
 *   - dept-a: agents [fetcher-a (data-fetcher), orch-a (orchestrator), spec-a (specialist)]
 *             workflows [wf-1 uses fetcher-a + spec-a, wf-2 uses fetcher-a]
 *   - dept-b: agents [fetcher-b]
 *             workflows [wf-3 uses fetcher-b]
 *   - orphan-agent (department=ghost-dept), orphan-wf (department=ghost-dept) — points to no department
 */
async function createTestRegistry({ withOrphans = true } = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-mermaid-test-'));
  const registry = new RegistryManager(tmpDir);

  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'),
    '# {{name}}\n{{description}}'
  );

  await registry.load();

  const now = new Date().toISOString();

  registry.departments.departments['dept-a'] = {
    name: 'dept-a', displayName: 'Marketing "Ops"', description: 'A',
    created: now, status: 'active', version: '1.0.0',
    agents: ['fetcher-a', 'orch-a', 'spec-a'],
    workflows: ['dept-a-wf-1', 'dept-a-wf-2'],
    integrations: [], responsibilities: []
  };
  registry.departments.departments['dept-b'] = {
    name: 'dept-b', displayName: 'Dept B', description: 'B',
    created: now, status: 'active', version: '1.0.0',
    agents: ['fetcher-b'],
    workflows: ['dept-b-wf-3'],
    integrations: [], responsibilities: []
  };

  const baseAgent = { created: now, version: '1.0.0', tools: [], model: 'sonnet', script: null, usedInWorkflows: [] };
  registry.agents.agents['fetcher-a'] = { ...baseAgent, name: 'fetcher-a', displayName: 'Fetcher A', department: 'dept-a', type: 'data-fetcher', description: 'd' };
  registry.agents.agents['orch-a'] = { ...baseAgent, name: 'orch-a', displayName: 'Orch A', department: 'dept-a', type: 'orchestrator', description: 'd' };
  registry.agents.agents['spec-a'] = { ...baseAgent, name: 'spec-a', displayName: 'Spec A', department: 'dept-a', type: 'specialist', description: 'd' };
  registry.agents.agents['fetcher-b'] = { ...baseAgent, name: 'fetcher-b', displayName: 'Fetcher B', department: 'dept-b', type: 'data-fetcher', description: 'd' };

  const baseWorkflow = {
    trigger: { type: 'manual', enabled: true },
    output: { type: 'console', destination: null },
    estimatedDuration: 'unknown', version: '1.0.0',
    created: now, lastRun: null, runCount: 0, successRate: 1.0
  };
  registry.workflows.workflows['dept-a-wf-1'] = { ...baseWorkflow, name: 'wf-1', displayName: 'WF 1', department: 'dept-a', description: 'd', orchestrator: 'orch-a', agents: ['fetcher-a', 'spec-a', 'fetcher-a'] };
  registry.workflows.workflows['dept-a-wf-2'] = { ...baseWorkflow, name: 'wf-2', displayName: 'WF 2', department: 'dept-a', description: 'd', orchestrator: 'orch-a', agents: ['fetcher-a'] };
  registry.workflows.workflows['dept-b-wf-3'] = { ...baseWorkflow, name: 'wf-3', displayName: 'WF 3', department: 'dept-b', description: 'd', orchestrator: null, agents: ['fetcher-b'] };

  if (withOrphans) {
    registry.agents.agents['orphan-agent'] = { ...baseAgent, name: 'orphan-agent', displayName: 'Orphan Agent', department: 'ghost-dept', type: 'specialist', description: 'd' };
    registry.workflows.workflows['orphan-wf'] = { ...baseWorkflow, name: 'orphan-wf', displayName: 'Orphan WF', department: 'ghost-dept', description: 'd', orchestrator: null, agents: ['orphan-agent'] };
  }

  registry.departments.metadata.totalDepartments = 2;
  registry.agents.metadata.totalAgents = withOrphans ? 5 : 4;
  registry.workflows.metadata.totalWorkflows = withOrphans ? 4 : 3;

  await registry.save();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function runTests() {
  const repoRoot = path.join(__dirname, '..');

  // ==========================================
  // exportMermaid() — core rendering
  // ==========================================

  await testAsync('exportMermaid: returns a string starting with flowchart header', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const out = await registry.exportMermaid();
      assert.strictEqual(typeof out, 'string');
      assert.ok(/^flowchart\s+LR/m.test(out), `expected "flowchart LR" header, got:\n${out}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: default direction is LR', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('flowchart LR'));
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: respects direction option', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      for (const dir of ['TD', 'TB', 'BT', 'RL']) {
        const out = await registry.exportMermaid({ direction: dir });
        assert.ok(out.includes(`flowchart ${dir}`), `expected direction ${dir}`);
      }
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: invalid direction throws', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      await assert.rejects(
        () => registry.exportMermaid({ direction: 'XYZ' }),
        /Invalid direction/
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: wraps each department in a subgraph', async () => {
    const { registry, tmpDir } = await createTestRegistry();
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('subgraph dept_dept_a'), 'dept-a subgraph missing');
      assert.ok(out.includes('subgraph dept_dept_b'), 'dept-b subgraph missing');
      // Closes with `end`
      const endCount = (out.match(/^\s*end$/gm) || []).length;
      assert.ok(endCount >= 2, `expected at least 2 subgraph closings, got ${endCount}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: renders an agent node for each agent', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid();
      for (const name of ['fetcher-a', 'orch-a', 'spec-a', 'fetcher-b']) {
        assert.ok(out.includes(`agent_${name.replace(/-/g, '_')}`), `agent ${name} missing`);
      }
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: renders a workflow node for each workflow', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('wf_dept_a_wf_1'), 'wf-1 missing');
      assert.ok(out.includes('wf_dept_a_wf_2'), 'wf-2 missing');
      assert.ok(out.includes('wf_dept_b_wf_3'), 'wf-3 missing');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: draws agent → workflow edges from workflow.agents', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('agent_fetcher_a --> wf_dept_a_wf_1'), 'fetcher-a → wf-1 edge missing');
      assert.ok(out.includes('agent_spec_a --> wf_dept_a_wf_1'), 'spec-a → wf-1 edge missing');
      assert.ok(out.includes('agent_fetcher_a --> wf_dept_a_wf_2'), 'fetcher-a → wf-2 edge missing');
      assert.ok(out.includes('agent_fetcher_b --> wf_dept_b_wf_3'), 'fetcher-b → wf-3 edge missing');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: type icons differ by agent type', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('📥 fetcher-a'), 'data-fetcher icon missing');
      assert.ok(out.includes('🎯 orch-a'), 'orchestrator icon missing');
      assert.ok(out.includes('🛠️ spec-a'), 'specialist icon missing');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: department filter scopes to one department', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid({ department: 'dept-a' });
      assert.ok(out.includes('subgraph dept_dept_a'));
      assert.ok(!out.includes('subgraph dept_dept_b'), 'dept-b should be filtered out');
      assert.ok(!out.includes('agent_fetcher_b'), 'dept-b agent should not appear');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: includeWorkflows=false omits workflows and edges', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid({ includeWorkflows: false });
      assert.ok(out.includes('agent_fetcher_a'), 'agents should still be present');
      assert.ok(!out.includes('wf_dept_a_wf_1'), 'workflows should be omitted');
      assert.ok(!out.includes('-->'), 'no edges expected without workflows');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: includeAgents=false omits agents and edges', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid({ includeAgents: false });
      assert.ok(!out.includes('agent_fetcher_a'), 'agents should be omitted');
      assert.ok(out.includes('wf_dept_a_wf_1'), 'workflows should still be present');
      assert.ok(!out.includes('-->'), 'no edges expected without agents');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: orphan agents/workflows surface under an Orphans subgraph', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: true });
    try {
      const out = await registry.exportMermaid();
      assert.ok(out.includes('subgraph orphans'), 'Orphans subgraph missing');
      assert.ok(out.includes('agent_orphan_agent'), 'orphan agent missing');
      assert.ok(out.includes('wf_ghost_dept_orphan_wf'), 'orphan workflow missing');
      assert.ok(out.includes('agent_orphan_agent --> wf_ghost_dept_orphan_wf'), 'orphan edge missing');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: includeOrphans=false suppresses Orphans subgraph', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: true });
    try {
      const out = await registry.exportMermaid({ includeOrphans: false });
      assert.ok(!out.includes('subgraph orphans'), 'Orphans subgraph should be suppressed');
      assert.ok(!out.includes('agent_orphan_agent'), 'orphan agent should not appear');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: department filter ignores orphans', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: true });
    try {
      const out = await registry.exportMermaid({ department: 'dept-a' });
      assert.ok(!out.includes('subgraph orphans'), 'Orphans subgraph should not appear when filtering');
      assert.ok(!out.includes('orphan-agent'), 'orphan agent should not appear');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: title prepends a front-matter title block', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid({ title: 'My Org' });
      const lines = out.split('\n');
      assert.strictEqual(lines[0], '---');
      assert.strictEqual(lines[1], 'title: My Org');
      assert.strictEqual(lines[2], '---');
      assert.ok(lines[3].startsWith('flowchart'));
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: empty registry produces a header-only diagram', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-mermaid-empty-'));
    try {
      fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'), '#');
      const registry = new RegistryManager(tmpDir);
      await registry.load();
      const out = await registry.exportMermaid();
      assert.ok(out.includes('flowchart LR'));
      assert.ok(!out.includes('subgraph'), 'empty registry should not produce subgraphs');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: escapes special characters in node labels', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      // dept-a has displayName: Marketing "Ops"
      const out = await registry.exportMermaid();
      assert.ok(out.includes('&quot;Ops&quot;'), 'expected display-name quote to be HTML-escaped');
      assert.ok(!/Marketing "Ops"/.test(out), 'raw quotes should not appear in node label');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: de-duplicates repeated edges', async () => {
    // dept-a-wf-1 has agents ['fetcher-a', 'spec-a', 'fetcher-a'] — duplicate
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      const out = await registry.exportMermaid();
      const matches = out.match(/agent_fetcher_a --> wf_dept_a_wf_1/g) || [];
      assert.strictEqual(matches.length, 1, `expected dedup edge once, got ${matches.length}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('exportMermaid: tolerates workflows with missing/non-array agents', async () => {
    const { registry, tmpDir } = await createTestRegistry({ withOrphans: false });
    try {
      registry.workflows.workflows['dept-a-wf-1'].agents = undefined;
      registry.workflows.workflows['dept-a-wf-2'].agents = 'not-an-array';
      const out = await registry.exportMermaid();
      // Should still render workflows, just with no edges from them
      assert.ok(out.includes('wf_dept_a_wf_1'));
      assert.ok(out.includes('wf_dept_a_wf_2'));
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // TypeScript definitions
  // ==========================================

  test('TypeScript: exportMermaid declared on RegistryManager', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(/exportMermaid\(options\?:\s*MermaidExportOptions\)/.test(dts),
      'exportMermaid signature missing from index.d.ts');
  });

  test('TypeScript: MermaidExportOptions interface declared', () => {
    const dts = fs.readFileSync(path.join(repoRoot, 'index.d.ts'), 'utf8');
    assert.ok(/export interface MermaidExportOptions/.test(dts), 'MermaidExportOptions missing');
    assert.ok(/export type MermaidDirection/.test(dts), 'MermaidDirection missing');
  });

  // ==========================================
  // axios vulnerability
  // ==========================================

  test('axios: npm audit reports no unexpected high/critical vulnerabilities', () => {
    let audit;
    try {
      audit = execSync('npm audit --json', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
    } catch (err) {
      audit = err.stdout ? err.stdout.toString() : '';
    }
    const parsed = JSON.parse(audit);
    const vulns = parsed.metadata && parsed.metadata.vulnerabilities;
    assert.ok(vulns, 'audit metadata should include vulnerabilities');
    // Known exception: uuid transitive via googleapis (<11.1.1) requires breaking googleapis@172 update.
    // All remaining moderate vulns are in: uuid/gaxios/googleapis-common/googleapis.
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
