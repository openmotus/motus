#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-09
 *
 * Tests for improvements made in the March 9 stewardship cycle:
 * - updateDepartment() rejects name rename (key desync prevention)
 * - updateAgent() rejects name rename (key desync prevention)
 * - updateWorkflow() rejects name/department rename (key desync prevention)
 * - validate() checks metadata counter consistency
 * - getWorkflowsByAgent() convenience method
 */

const path = require('path');
const fs = require('fs');
const RegistryManager = require('../lib/registry-manager');

const results = { passed: 0, failed: 0 };

function assert(condition, message) {
  if (condition) {
    console.log(`\u2713 ${message}`);
    results.passed++;
  } else {
    console.log(`\u2717 ${message}`);
    results.failed++;
  }
}

async function assertThrowsAsync(fn, message, expectedSubstring) {
  try {
    await fn();
    console.log(`\u2717 ${message} (did not throw)`);
    results.failed++;
  } catch (e) {
    if (expectedSubstring && !e.message.includes(expectedSubstring)) {
      console.log(`\u2717 ${message} (threw but message did not include '${expectedSubstring}': ${e.message})`);
      results.failed++;
    } else {
      console.log(`\u2713 ${message}`);
      results.passed++;
    }
  }
}

async function setupRegistry() {
  const tmpDir = path.join(__dirname, '__tmp_0309__');
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'agent'), { recursive: true });

  // Copy minimal templates for department/agent creation
  const deptTemplateSrc = path.join(__dirname, '..', 'templates', 'department', 'department-agent.md.hbs');
  const deptTemplateDst = path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs');
  if (fs.existsSync(deptTemplateSrc)) {
    fs.copyFileSync(deptTemplateSrc, deptTemplateDst);
  } else {
    fs.writeFileSync(deptTemplateDst, '---\nname: {{name}}\n---\n# {{displayName}}\n');
  }

  const agentTemplates = ['data-fetcher-agent.md.hbs', 'specialist-agent.md.hbs', 'orchestrator-agent.md.hbs'];
  for (const tpl of agentTemplates) {
    const src = path.join(__dirname, '..', 'templates', 'agent', tpl);
    const dst = path.join(tmpDir, 'templates', 'agent', tpl);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    } else {
      fs.writeFileSync(dst, '---\nname: {{name}}\ntype: {{type}}\n---\n# {{displayName}}\n');
    }
  }

  const registry = new RegistryManager(tmpDir);
  await registry.load();
  return { registry, tmpDir };
}

function cleanup(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

async function runTests() {
  console.log('Steward Fixes — 2026-03-09');
  console.log('='.repeat(60) + '\n');

  let tmpDir;
  let registry;

  // ============================================================
  // updateDepartment() name rename prevention
  // ============================================================
  console.log('updateDepartment() name rename prevention\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'marketing',
    displayName: 'Marketing',
    description: 'Marketing automation department'
  });

  // Same name should be allowed (no-op)
  const updated = await registry.updateDepartment('marketing', { name: 'marketing', description: 'Updated description' });
  assert(updated.description === 'Updated description', 'updateDepartment allows same name in updates');

  // Different name should throw
  await assertThrowsAsync(
    () => registry.updateDepartment('marketing', { name: 'sales' }),
    'updateDepartment rejects different name',
    'Cannot rename department'
  );

  // Non-name updates still work
  const updated2 = await registry.updateDepartment('marketing', { status: 'inactive' });
  assert(updated2.status === 'inactive', 'updateDepartment allows non-name updates');
  assert(updated2.name === 'marketing', 'updateDepartment preserves original name');

  cleanup(tmpDir);

  // ============================================================
  // updateAgent() name rename prevention
  // ============================================================
  console.log('\nupdateAgent() name rename prevention\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'analytics',
    displayName: 'Analytics',
    description: 'Data analysis department'
  });

  await registry.addAgent({
    name: 'data-collector',
    displayName: 'Data Collector',
    department: 'analytics',
    type: 'data-fetcher',
    description: 'Collects metrics from monitoring APIs'
  });

  // Same name should be allowed
  const agentUpdated = await registry.updateAgent('data-collector', { name: 'data-collector', description: 'Updated collector' });
  assert(agentUpdated.description === 'Updated collector', 'updateAgent allows same name in updates');

  // Different name should throw
  await assertThrowsAsync(
    () => registry.updateAgent('data-collector', { name: 'metric-fetcher' }),
    'updateAgent rejects different name',
    'Cannot rename agent'
  );

  // Non-name updates still work
  const agentUpdated2 = await registry.updateAgent('data-collector', { model: 'opus' });
  assert(agentUpdated2.model === 'opus', 'updateAgent allows non-name updates');
  assert(agentUpdated2.name === 'data-collector', 'updateAgent preserves original name');

  cleanup(tmpDir);

  // ============================================================
  // updateWorkflow() name/department rename prevention
  // ============================================================
  console.log('\nupdateWorkflow() name/department rename prevention\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'ops',
    displayName: 'Operations',
    description: 'Operations automation department'
  });

  await registry.addDepartment({
    name: 'dev',
    displayName: 'Development',
    description: 'Development automation department'
  });

  await registry.addWorkflow({
    name: 'daily-check',
    displayName: 'Daily Check',
    department: 'ops',
    description: 'Daily operations health check'
  });

  // Same name should be allowed
  const wfUpdated = await registry.updateWorkflow('ops', 'daily-check', { name: 'daily-check', description: 'Updated check' });
  assert(wfUpdated.description === 'Updated check', 'updateWorkflow allows same name in updates');

  // Different name should throw
  await assertThrowsAsync(
    () => registry.updateWorkflow('ops', 'daily-check', { name: 'weekly-check' }),
    'updateWorkflow rejects different name',
    'Cannot rename workflow'
  );

  // Same department should be allowed
  const wfUpdated2 = await registry.updateWorkflow('ops', 'daily-check', { department: 'ops', estimatedDuration: '5min' });
  assert(wfUpdated2.estimatedDuration === '5min', 'updateWorkflow allows same department in updates');

  // Different department should throw
  await assertThrowsAsync(
    () => registry.updateWorkflow('ops', 'daily-check', { department: 'dev' }),
    'updateWorkflow rejects different department',
    'Cannot move workflow'
  );

  // Non-key updates still work
  const wfUpdated3 = await registry.updateWorkflow('ops', 'daily-check', { estimatedDuration: '10min' });
  assert(wfUpdated3.estimatedDuration === '10min', 'updateWorkflow allows non-key updates');
  assert(wfUpdated3.name === 'daily-check', 'updateWorkflow preserves original name');
  assert(wfUpdated3.department === 'ops', 'updateWorkflow preserves original department');

  cleanup(tmpDir);

  // ============================================================
  // validate() metadata counter consistency
  // ============================================================
  console.log('\nvalidate() metadata counter consistency\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'finance',
    displayName: 'Finance',
    description: 'Finance reporting and tracking'
  });

  await registry.addAgent({
    name: 'report-builder',
    displayName: 'Report Builder',
    department: 'finance',
    type: 'specialist',
    description: 'Builds financial summary reports'
  });

  await registry.addWorkflow({
    name: 'monthly-report',
    displayName: 'Monthly Report',
    department: 'finance',
    description: 'Generate monthly financial reports',
    agents: ['report-builder']
  });

  // Correct state should validate
  let validation = await registry.validate();
  assert(validation.valid === true, 'validate() passes with correct metadata');

  // Manually corrupt metadata counters
  registry.departments.metadata.totalDepartments = 99;
  validation = await registry.validate();
  assert(validation.valid === false, 'validate() fails when totalDepartments is wrong');
  assert(validation.errors.some(e => e.includes('totalDepartments')), 'validate() reports totalDepartments mismatch');

  // Fix departments, corrupt agents
  registry.departments.metadata.totalDepartments = 1;
  registry.agents.metadata.totalAgents = 0;
  validation = await registry.validate();
  assert(validation.valid === false, 'validate() fails when totalAgents is wrong');
  assert(validation.errors.some(e => e.includes('totalAgents')), 'validate() reports totalAgents mismatch');

  // Fix agents, corrupt workflows
  registry.agents.metadata.totalAgents = 1;
  registry.workflows.metadata.totalWorkflows = 5;
  validation = await registry.validate();
  assert(validation.valid === false, 'validate() fails when totalWorkflows is wrong');
  assert(validation.errors.some(e => e.includes('totalWorkflows')), 'validate() reports totalWorkflows mismatch');

  // Fix all — should pass again
  registry.workflows.metadata.totalWorkflows = 1;
  validation = await registry.validate();
  assert(validation.valid === true, 'validate() passes after fixing all metadata');

  // Missing metadata fields should not cause false positives
  delete registry.departments.metadata.totalDepartments;
  validation = await registry.validate();
  assert(validation.valid === true, 'validate() skips undefined metadata counters');

  cleanup(tmpDir);

  // ============================================================
  // getWorkflowsByAgent()
  // ============================================================
  console.log('\ngetWorkflowsByAgent()\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'content',
    displayName: 'Content',
    description: 'Content creation and management'
  });

  await registry.addAgent({
    name: 'topic-finder',
    displayName: 'Topic Finder',
    department: 'content',
    type: 'data-fetcher',
    description: 'Finds trending topics from social media APIs'
  });

  await registry.addAgent({
    name: 'article-writer',
    displayName: 'Article Writer',
    department: 'content',
    type: 'specialist',
    description: 'Writes articles based on given topics'
  });

  await registry.addAgent({
    name: 'seo-optimizer',
    displayName: 'SEO Optimizer',
    department: 'content',
    type: 'specialist',
    description: 'Optimizes content for search engines'
  });

  await registry.addWorkflow({
    name: 'blog-pipeline',
    displayName: 'Blog Pipeline',
    department: 'content',
    description: 'Full blog content creation pipeline',
    agents: ['topic-finder', 'article-writer', 'seo-optimizer']
  });

  await registry.addWorkflow({
    name: 'quick-post',
    displayName: 'Quick Post',
    department: 'content',
    description: 'Quick social media post creation',
    agents: ['topic-finder', 'article-writer']
  });

  await registry.addWorkflow({
    name: 'seo-audit',
    displayName: 'SEO Audit',
    department: 'content',
    description: 'Run SEO audit on existing content',
    agents: ['seo-optimizer']
  });

  // topic-finder is used in 2 workflows
  let wfs = await registry.getWorkflowsByAgent('topic-finder');
  assert(wfs.length === 2, 'getWorkflowsByAgent returns correct count for topic-finder (2)');
  assert(wfs.some(w => w.name === 'blog-pipeline'), 'getWorkflowsByAgent finds blog-pipeline for topic-finder');
  assert(wfs.some(w => w.name === 'quick-post'), 'getWorkflowsByAgent finds quick-post for topic-finder');

  // seo-optimizer is used in 2 workflows
  wfs = await registry.getWorkflowsByAgent('seo-optimizer');
  assert(wfs.length === 2, 'getWorkflowsByAgent returns correct count for seo-optimizer (2)');

  // article-writer is used in 2 workflows
  wfs = await registry.getWorkflowsByAgent('article-writer');
  assert(wfs.length === 2, 'getWorkflowsByAgent returns correct count for article-writer (2)');

  // Non-existent agent returns empty array
  wfs = await registry.getWorkflowsByAgent('nonexistent-agent');
  assert(wfs.length === 0, 'getWorkflowsByAgent returns empty for non-existent agent');

  cleanup(tmpDir);

  // ============================================================
  // Edge cases: update with same identity values
  // ============================================================
  console.log('\nEdge cases: updates with identity values\n');

  ({ registry, tmpDir } = await setupRegistry());

  await registry.addDepartment({
    name: 'testing',
    displayName: 'Testing',
    description: 'Testing department for edge cases'
  });

  await registry.addAgent({
    name: 'edge-tester',
    displayName: 'Edge Tester',
    department: 'testing',
    type: 'specialist',
    description: 'Tests edge cases in the system'
  });

  await registry.addWorkflow({
    name: 'test-workflow',
    displayName: 'Test Workflow',
    department: 'testing',
    description: 'Workflow for testing edge cases'
  });

  // Setting name to same value is a no-op and should not throw
  const d = await registry.updateDepartment('testing', { name: 'testing' });
  assert(d.name === 'testing', 'updateDepartment with identical name is a no-op');

  const a = await registry.updateAgent('edge-tester', { name: 'edge-tester' });
  assert(a.name === 'edge-tester', 'updateAgent with identical name is a no-op');

  const w = await registry.updateWorkflow('testing', 'test-workflow', { name: 'test-workflow', department: 'testing' });
  assert(w.name === 'test-workflow', 'updateWorkflow with identical name/department is a no-op');

  // Multiple fields with a rename attempt should still throw
  await assertThrowsAsync(
    () => registry.updateDepartment('testing', { name: 'other', description: 'trying to sneak a rename' }),
    'updateDepartment rejects rename even with other fields present',
    'Cannot rename department'
  );

  await assertThrowsAsync(
    () => registry.updateAgent('edge-tester', { name: 'renamed', model: 'haiku' }),
    'updateAgent rejects rename even with other fields present',
    'Cannot rename agent'
  );

  await assertThrowsAsync(
    () => registry.updateWorkflow('testing', 'test-workflow', { name: 'renamed', estimatedDuration: '1min' }),
    'updateWorkflow rejects rename even with other fields present',
    'Cannot rename workflow'
  );

  cleanup(tmpDir);

  // ============================================================
  // Results
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log(`\nTotal Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
