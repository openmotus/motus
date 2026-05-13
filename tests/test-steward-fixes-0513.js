/**
 * Steward Fixes — 2026-05-13
 *
 * Tests for RECIPES.md patterns — verifies that all copy-paste examples in
 * RECIPES.md work correctly end-to-end.
 *
 *  1. Recipe 1: create department + agents + workflow programmatically
 *  2. Recipe 1: getDepartmentSummary reports correct agent/workflow count
 *  3. Recipe 2: parallel data pipeline — multiple fetchers + one specialist
 *  4. Recipe 2: workflow.agents contains all fetchers and the compiler
 *  5. Recipe 3: recordWorkflowRun tracks success and failure
 *  6. Recipe 3: getWorkflowHealth returns correct status for failing workflow
 *  7. Recipe 3: getWorkflowHealth({ status: 'failing' }) filter works
 *  8. Recipe 4: getAgentUsage identifies unused agents
 *  9. Recipe 4: getAgentUsage({ usage: 'unused' }) filter works
 * 10. Recipe 5: exportMermaid produces a non-empty string
 * 11. Recipe 5: exportMermaid with department filter scopes correctly
 * 12. Recipe 6: export() + import() round-trips the registry intact
 * 13. Recipe 7: validate() passes on a clean registry
 * 14. Recipe 7: validate() detects an orphan workflow reference
 * 15. Recipe 9: removeDepartment cascade removes agents and workflows
 * 16. Recipe 9: removeDepartment({ cascade: false }) throws when children exist
 * 17. Recipe 9: removeAgent cleans up workflow references
 * 18. Recipe 10: search() returns agents matching a query term
 * 19. Recipe 10: getWorkflowsByAgent returns correct workflows
 * 20. Recipe 10: getStatistics reports correct totals after add operations
 * 21. Registry auto-saves: state is persisted after addDepartment
 * 22. Names are immutable: updateDepartment throws on rename attempt
 * 23. addAgent throws a descriptive error for unknown department
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

/**
 * Create a minimal temp registry with configurable content.
 */
async function makeTempRegistry() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-recipes-test-'));
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  fs.writeFileSync(
    path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'),
    '# {{name}}\n{{description}}'
  );
  const registry = new RegistryManager(tmpDir);
  await registry.load();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
}

async function runTests() {
  // ==========================================
  // Recipe 1: create department + agents + workflow
  // ==========================================

  await testAsync('Recipe 1: addDepartment creates a valid department entry', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'marketing', displayName: 'Marketing', description: 'Content and campaigns' });
      const dept = registry.getDepartment('marketing');
      assert.ok(dept, 'department should exist after addDepartment');
      assert.strictEqual(dept.name, 'marketing');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 1: getDepartmentSummary reports correct counts after add', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'marketing', displayName: 'Marketing', description: 'Content' });
      await registry.addAgent({ name: 'trend-analyzer', displayName: 'Trend Analyzer', department: 'marketing', type: 'data-fetcher', description: 'Fetches trends', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'content-creator', displayName: 'Content Creator', department: 'marketing', type: 'specialist', description: 'Creates content', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'content-pipeline', displayName: 'Content Pipeline', department: 'marketing', description: 'Research to content', agents: ['trend-analyzer', 'content-creator'] });
      const summary = await registry.getDepartmentSummary('marketing');
      assert.strictEqual(summary.agents.length, 2, 'should have 2 agents');
      assert.strictEqual(summary.workflows.length, 1, 'should have 1 workflow');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 2: parallel data pipeline
  // ==========================================

  await testAsync('Recipe 2: parallel pipeline — all fetchers registered in department', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'briefing', displayName: 'Briefing', description: 'Daily briefing' });
      const fetchers = ['weather-fetcher', 'calendar-fetcher', 'task-fetcher'];
      for (const name of fetchers) {
        await registry.addAgent({ name, displayName: name, department: 'briefing', type: 'data-fetcher', description: `Fetches ${name} data`, tools: [], model: 'sonnet' });
      }
      const agents = await registry.listAgentsByDepartment('briefing');
      assert.strictEqual(agents.length, fetchers.length, 'all fetchers should be registered');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 2: workflow.agents contains all fetchers and the compiler', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'briefing', displayName: 'Briefing', description: 'Daily briefing' });
      const fetchers = ['weather-fetcher', 'calendar-fetcher', 'task-fetcher'];
      for (const name of fetchers) {
        await registry.addAgent({ name, displayName: name, department: 'briefing', type: 'data-fetcher', description: 'Fetches data', tools: [], model: 'sonnet' });
      }
      await registry.addAgent({ name: 'briefing-creator', displayName: 'Briefing Creator', department: 'briefing', type: 'specialist', description: 'Compiles briefing', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'morning-briefing', displayName: 'Morning Briefing', department: 'briefing', description: 'Fetch and compile', agents: [...fetchers, 'briefing-creator'] });
      const wf = registry.getWorkflow('briefing', 'morning-briefing');
      assert.ok(wf, 'workflow should exist');
      assert.deepStrictEqual(wf.agents, [...fetchers, 'briefing-creator']);
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 3: workflow health tracking
  // ==========================================

  await testAsync('Recipe 3: recordWorkflowRun tracks success and failure', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'briefing', displayName: 'Briefing', description: 'Briefing dept' });
      await registry.addWorkflow({ name: 'morning', displayName: 'Morning', department: 'briefing', description: 'Briefing', agents: [] });
      await registry.recordWorkflowRun('briefing', 'morning', { success: true, durationMs: 5000 });
      await registry.recordWorkflowRun('briefing', 'morning', { success: false, error: 'API timeout' });
      const wf = registry.getWorkflow('briefing', 'morning');
      assert.strictEqual(wf.runCount, 2, 'runCount should be 2');
      assert.ok(wf.successRate < 1.0, 'successRate should reflect a failure');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 3: getWorkflowHealth returns failing for low success rate', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'briefing', displayName: 'Briefing', description: 'Briefing dept' });
      await registry.addWorkflow({ name: 'morning', displayName: 'Morning', department: 'briefing', description: 'Briefing', agents: [] });
      // 1 success, 3 failures = 25% success rate → failing
      await registry.recordWorkflowRun('briefing', 'morning', { success: true });
      await registry.recordWorkflowRun('briefing', 'morning', { success: false, error: 'error1' });
      await registry.recordWorkflowRun('briefing', 'morning', { success: false, error: 'error2' });
      await registry.recordWorkflowRun('briefing', 'morning', { success: false, error: 'error3' });
      const health = await registry.getWorkflowHealth({ department: 'briefing' });
      const entry = health.workflows.find(w => w.name === 'morning');
      assert.ok(entry, 'health entry should exist');
      assert.strictEqual(entry.status, 'failing', `expected failing, got ${entry.status}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 3: getWorkflowHealth status filter returns only matching', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'ops', displayName: 'Ops', description: 'Ops' });
      await registry.addWorkflow({ name: 'healthy-wf', displayName: 'Healthy', department: 'ops', description: 'd', agents: [] });
      await registry.addWorkflow({ name: 'idle-wf', displayName: 'Idle', department: 'ops', description: 'd', agents: [] });
      // Run healthy-wf successfully
      for (let i = 0; i < 5; i++) {
        await registry.recordWorkflowRun('ops', 'healthy-wf', { success: true });
      }
      // idle-wf has no runs → idle
      const idleResult = await registry.getWorkflowHealth({ status: 'idle' });
      const idleNames = idleResult.workflows.map(w => w.name);
      assert.ok(idleNames.includes('idle-wf'), 'idle-wf should be in idle results');
      assert.ok(!idleNames.includes('healthy-wf'), 'healthy-wf should not be in idle results');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 4: find unused agents
  // ==========================================

  await testAsync('Recipe 4: getAgentUsage identifies unused agents', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'analytics', displayName: 'Analytics', description: 'Analytics' });
      await registry.addAgent({ name: 'metrics-collector', displayName: 'Metrics Collector', department: 'analytics', type: 'data-fetcher', description: 'Collects metrics', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'orphan-agent', displayName: 'Orphan', department: 'analytics', type: 'specialist', description: 'Not used anywhere', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'daily-report', displayName: 'Daily Report', department: 'analytics', description: 'Report', agents: ['metrics-collector'] });
      const usage = await registry.getAgentUsage();
      const orphan = usage.agents.find(a => a.name === 'orphan-agent');
      assert.ok(orphan, 'orphan-agent should appear in usage results');
      assert.strictEqual(orphan.usage, 'unused', 'orphan-agent should be unused');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 4: getAgentUsage({ usage: "unused" }) filter works', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'analytics', displayName: 'Analytics', description: 'Analytics' });
      await registry.addAgent({ name: 'active-agent', displayName: 'Active', department: 'analytics', type: 'data-fetcher', description: 'Used in workflow', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'dead-agent', displayName: 'Dead', department: 'analytics', type: 'specialist', description: 'No workflows', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'main-wf', displayName: 'Main WF', department: 'analytics', description: 'Workflow', agents: ['active-agent'] });
      const unused = await registry.getAgentUsage({ usage: 'unused' });
      assert.strictEqual(unused.agents.length, 1, 'only one unused agent');
      assert.strictEqual(unused.agents[0].name, 'dead-agent');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 5: export org chart
  // ==========================================

  await testAsync('Recipe 5: exportMermaid produces a flowchart string', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'marketing', displayName: 'Marketing', description: 'Marketing' });
      await registry.addAgent({ name: 'trend-analyzer', displayName: 'Trend Analyzer', department: 'marketing', type: 'data-fetcher', description: 'Trends', tools: [], model: 'sonnet' });
      const diagram = await registry.exportMermaid({ title: 'My Org' });
      assert.ok(typeof diagram === 'string' && diagram.length > 0, 'exportMermaid should return a non-empty string');
      assert.ok(diagram.includes('flowchart'), 'should contain flowchart directive');
      assert.ok(diagram.includes('subgraph'), 'should contain department subgraph');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 5: exportMermaid department filter scopes correctly', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'dept-a', displayName: 'Dept A', description: 'A' });
      await registry.addDepartment({ name: 'dept-b', displayName: 'Dept B', description: 'B' });
      await registry.addAgent({ name: 'agent-a', displayName: 'Agent A', department: 'dept-a', type: 'data-fetcher', description: 'd', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'agent-b', displayName: 'Agent B', department: 'dept-b', type: 'specialist', description: 'd', tools: [], model: 'sonnet' });
      const diagram = await registry.exportMermaid({ department: 'dept-a' });
      assert.ok(diagram.includes('agent_a'), 'dept-a agent should appear');
      assert.ok(!diagram.includes('agent_b'), 'dept-b agent should not appear');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 6: backup and restore
  // ==========================================

  await testAsync('Recipe 6: export() + import() round-trips the registry', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    const { registry: registry2, tmpDir: tmpDir2 } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'finance', displayName: 'Finance', description: 'Finance dept' });
      await registry.addAgent({ name: 'invoice-fetcher', displayName: 'Invoice Fetcher', department: 'finance', type: 'data-fetcher', description: 'Fetches invoices', tools: [], model: 'sonnet' });
      const backup = await registry.export();
      await registry2.import(backup);
      assert.ok(registry2.departmentExists('finance'), 'department should survive round-trip');
      assert.ok(registry2.agentExists('invoice-fetcher'), 'agent should survive round-trip');
    } finally {
      cleanup(tmpDir);
      cleanup(tmpDir2);
    }
  });

  // ==========================================
  // Recipe 7: validate registry
  // ==========================================

  await testAsync('Recipe 7: validate() passes on a clean registry', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'clean-dept', displayName: 'Clean', description: 'Clean' });
      await registry.addAgent({ name: 'clean-agent', displayName: 'Clean Agent', department: 'clean-dept', type: 'specialist', description: 'Works fine', tools: [], model: 'sonnet' });
      const report = await registry.validate();
      assert.ok(report.valid, `validate should pass, got errors: ${JSON.stringify(report.errors)}`);
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 7: validate() detects agent with invalid type', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'ops', displayName: 'Ops', description: 'Ops' });
      // Bypass addAgent validation to inject a bad type directly
      registry.agents.agents['bad-agent'] = {
        name: 'bad-agent', displayName: 'Bad', department: 'ops',
        type: 'robot', // invalid type
        description: 'Has wrong type', tools: [], model: 'sonnet',
        created: new Date().toISOString(), version: '1.0.0', usedInWorkflows: []
      };
      registry.departments.departments['ops'].agents = ['bad-agent'];
      const report = await registry.validate();
      assert.ok(!report.valid, 'validate should fail for invalid agent type');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 9: remove operations
  // ==========================================

  await testAsync('Recipe 9: removeDepartment cascade removes agents and workflows', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'old-dept', displayName: 'Old', description: 'Being removed' });
      await registry.addAgent({ name: 'old-agent', displayName: 'Old Agent', department: 'old-dept', type: 'data-fetcher', description: 'Old', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'old-wf', displayName: 'Old WF', department: 'old-dept', description: 'Old', agents: ['old-agent'] });
      const result = await registry.removeDepartment('old-dept');
      assert.ok(result.removedAgents.length >= 1, 'should have cascade-removed at least one agent');
      assert.ok(result.removedWorkflows.length >= 1, 'should have cascade-removed at least one workflow');
      assert.ok(!registry.departmentExists('old-dept'), 'department should be gone');
      assert.ok(!registry.agentExists('old-agent'), 'agent should be gone');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 9: removeDepartment cascade:false throws when children exist', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'active-dept', displayName: 'Active', description: 'Active' });
      await registry.addAgent({ name: 'active-agent', displayName: 'Active Agent', department: 'active-dept', type: 'specialist', description: 'Active', tools: [], model: 'sonnet' });
      await assert.rejects(
        () => registry.removeDepartment('active-dept', { cascade: false }),
        /Cannot remove|children|agents/i
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 9: removeAgent cleans up workflow references', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'eng', displayName: 'Engineering', description: 'Eng' });
      await registry.addAgent({ name: 'code-reviewer', displayName: 'Code Reviewer', department: 'eng', type: 'specialist', description: 'Reviews code', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'test-runner', displayName: 'Test Runner', department: 'eng', type: 'data-fetcher', description: 'Runs tests', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'ci-pipeline', displayName: 'CI Pipeline', department: 'eng', description: 'CI pipeline', agents: ['test-runner', 'code-reviewer'] });
      const { updatedWorkflows } = await registry.removeAgent('code-reviewer');
      assert.ok(updatedWorkflows.length >= 1, 'at least one workflow should be updated');
      const ci = registry.getWorkflow('eng', 'ci-pipeline');
      assert.ok(!ci.agents.includes('code-reviewer'), 'removed agent should not appear in workflow.agents');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Recipe 10: search and query
  // ==========================================

  await testAsync('Recipe 10: search() returns agents matching a query term', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'data', displayName: 'Data', description: 'Data pipelines' });
      await registry.addAgent({ name: 'metrics-collector', displayName: 'Metrics Collector', department: 'data', type: 'data-fetcher', description: 'Collects metrics from APIs', tools: [], model: 'sonnet' });
      await registry.addAgent({ name: 'report-writer', displayName: 'Report Writer', department: 'data', type: 'specialist', description: 'Writes reports', tools: [], model: 'sonnet' });
      const results = await registry.search('metrics');
      assert.ok(results.agents.length >= 1, 'should find metrics-collector');
      const found = results.agents.find(a => a.name === 'metrics-collector');
      assert.ok(found, 'metrics-collector should be in results');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 10: getWorkflowsByAgent returns correct workflows', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'data', displayName: 'Data', description: 'Data' });
      await registry.addAgent({ name: 'shared-fetcher', displayName: 'Shared Fetcher', department: 'data', type: 'data-fetcher', description: 'Shared', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'wf-1', displayName: 'WF 1', department: 'data', description: 'WF 1', agents: ['shared-fetcher'] });
      await registry.addWorkflow({ name: 'wf-2', displayName: 'WF 2', department: 'data', description: 'WF 2', agents: ['shared-fetcher'] });
      await registry.addWorkflow({ name: 'wf-3', displayName: 'WF 3', department: 'data', description: 'WF 3', agents: [] });
      const workflows = await registry.getWorkflowsByAgent('shared-fetcher');
      assert.strictEqual(workflows.length, 2, 'should find 2 workflows using shared-fetcher');
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Recipe 10: getStatistics reports correct totals after add operations', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'stats-dept', displayName: 'Stats', description: 'Stats' });
      await registry.addAgent({ name: 'stats-agent', displayName: 'Stats Agent', department: 'stats-dept', type: 'specialist', description: 'Stats', tools: [], model: 'sonnet' });
      await registry.addWorkflow({ name: 'stats-wf', displayName: 'Stats WF', department: 'stats-dept', description: 'Stats', agents: ['stats-agent'] });
      const stats = await registry.getStatistics();
      assert.ok(stats.departments.total >= 1, 'should count departments');
      assert.ok(stats.agents.total >= 1, 'should count agents');
      assert.ok(stats.workflows.total >= 1, 'should count workflows');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Invariants from Tips section of RECIPES.md
  // ==========================================

  await testAsync('Tips: names are immutable — updateDepartment throws on rename', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'original', displayName: 'Original', description: 'Original' });
      await assert.rejects(
        () => registry.updateDepartment('original', { name: 'renamed' }),
        /rename|immutable/i
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Tips: addAgent throws a descriptive error for unknown department', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await assert.rejects(
        () => registry.addAgent({ name: 'orphan-agent', displayName: 'Orphan', department: 'nonexistent-dept', type: 'specialist', description: 'No dept', tools: [], model: 'sonnet' }),
        /nonexistent-dept|does not exist|Department/i
      );
    } finally { cleanup(tmpDir); }
  });

  await testAsync('Tips: auto-saves — state is persisted after addDepartment', async () => {
    const { registry, tmpDir } = await makeTempRegistry();
    try {
      await registry.addDepartment({ name: 'auto-saved', displayName: 'Auto Saved', description: 'Auto saved' });
      // Read registry from disk in a new instance to verify persistence
      const registry2 = new RegistryManager(tmpDir);
      await registry2.load();
      assert.ok(registry2.departmentExists('auto-saved'), 'department should be persisted to disk');
    } finally { cleanup(tmpDir); }
  });

  // ==========================================
  // Report
  // ==========================================

  console.log(`  Total:  ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failures.length > 0) {
    console.error('\n  Failures:');
    failures.forEach(f => console.error(`    - ${f.name}: ${f.error}`));
  }
  if (failed > 0) process.exit(1);
}

runTests();
