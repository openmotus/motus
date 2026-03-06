#!/usr/bin/env node

/**
 * End-to-End Workflow Test Suite
 *
 * Tests the full lifecycle across all modules working together:
 * - Create department → add agents → add workflow → validate → search → stats → export
 * - RegistryManager + Validator + TemplateEngine + DocGenerator interop
 * - Example directory structure validation
 * - Realistic multi-department scenarios
 */

const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');
const TemplateEngine = require('../lib/template-engine');
const DocGenerator = require('../lib/doc-generator');
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

async function cleanup(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // ignore
  }
}

async function runTests() {
  console.log('End-to-End Workflow Test Suite');
  console.log('='.repeat(60) + '\n');

  const testDir = path.join(__dirname, '..', 'test-e2e-workspace');

  // Clean up from any previous run
  await cleanup(testDir);

  // ========================================
  // FULL LIFECYCLE
  // ========================================

  console.log('Full Lifecycle: Department → Agents → Workflow → Validate\n');

  const registry = new RegistryManager(testDir);

  await test('load: initializes empty registries from scratch', async () => {
    await registry.load();
    const stats = await registry.getStatistics();
    assertEquals(stats.departments.total, 0);
    assertEquals(stats.agents.total, 0);
    assertEquals(stats.workflows.total, 0);
  });

  await test('addDepartment: creates department with agent file', async () => {
    const dept = await registry.addDepartment({
      name: 'analytics',
      displayName: 'Analytics',
      description: 'Data analysis and reporting pipelines'
    });
    assert(dept.name === 'analytics');
    assert(dept.status === 'active');

    // Verify agent file was generated
    const agentFile = path.join(testDir, '.claude', 'agents', 'analytics-admin.md');
    const content = await fs.readFile(agentFile, 'utf8');
    assert(content.includes('Analytics'), 'Agent file should contain department name');
  });

  await test('addAgent: creates data-fetcher agent in department', async () => {
    const agent = await registry.addAgent({
      name: 'metrics-collector',
      displayName: 'Metrics Collector',
      department: 'analytics',
      type: 'data-fetcher',
      description: 'Collects metrics from monitoring APIs',
      tools: ['Bash', 'Read']
    });
    assert(agent.name === 'metrics-collector');
    assert(agent.department === 'analytics');
    assert(agent.type === 'data-fetcher');

    // Verify agent definition file was generated
    const agentFile = path.join(testDir, '.claude', 'agents', 'metrics-collector.md');
    const content = await fs.readFile(agentFile, 'utf8');
    assert(content.includes('metrics-collector'), 'Agent file should exist');
  });

  await test('addAgent: creates specialist agent in same department', async () => {
    const agent = await registry.addAgent({
      name: 'trend-analyzer',
      displayName: 'Trend Analyzer',
      department: 'analytics',
      type: 'specialist',
      description: 'Analyzes metric trends and generates insights',
      tools: ['Read', 'Write']
    });
    assert(agent.type === 'specialist');
  });

  await test('addAgent: creates orchestrator agent', async () => {
    const agent = await registry.addAgent({
      name: 'analytics-orchestrator',
      displayName: 'Analytics Orchestrator',
      department: 'analytics',
      type: 'orchestrator',
      description: 'Coordinates analytics workflow execution',
      tools: ['Task', 'Read', 'Write']
    });
    assert(agent.type === 'orchestrator');
  });

  await test('addWorkflow: creates workflow referencing agents', async () => {
    const workflow = await registry.addWorkflow({
      name: 'daily-metrics',
      displayName: 'Daily Metrics',
      department: 'analytics',
      description: 'Collects metrics and analyzes trends daily',
      agents: ['metrics-collector', 'trend-analyzer'],
      trigger: { type: 'scheduled', schedule: 'daily 9:00' },
      output: { type: 'file', destination: 'reports/' },
      estimatedDuration: '2 minutes'
    });
    assert(workflow.name === 'daily-metrics');
    assert(workflow.agents.length === 2);
    assert(workflow.trigger.type === 'scheduled');
    assert(workflow.runCount === 0);
    assert(workflow.successRate === 1.0);
  });

  await test('department tracks its agents and workflows', async () => {
    const dept = registry.getDepartment('analytics');
    assert(dept.agents.includes('metrics-collector'));
    assert(dept.agents.includes('trend-analyzer'));
    assert(dept.agents.includes('analytics-orchestrator'));
    assert(dept.workflows.includes('daily-metrics'));
    assertEquals(dept.agents.length, 3);
    assertEquals(dept.workflows.length, 1);
  });

  await test('agents track workflow usage', async () => {
    const collector = registry.getAgent('metrics-collector');
    const analyzer = registry.getAgent('trend-analyzer');
    const orchestrator = registry.getAgent('analytics-orchestrator');
    assert(collector.usedInWorkflows.includes('daily-metrics'));
    assert(analyzer.usedInWorkflows.includes('daily-metrics'));
    assertEquals(orchestrator.usedInWorkflows.length, 0, 'Orchestrator not in workflow agents list');
  });

  await test('statistics reflect full state', async () => {
    const stats = await registry.getStatistics();
    assertEquals(stats.departments.total, 1);
    assertEquals(stats.departments.active, 1);
    assertEquals(stats.agents.total, 3);
    assertEquals(stats.agents.byType['data-fetcher'], 1);
    assertEquals(stats.agents.byType['specialist'], 1);
    assertEquals(stats.agents.byType['orchestrator'], 1);
    assertEquals(stats.workflows.total, 1);
    assertEquals(stats.workflows.byType.scheduled, 1);
    assertEquals(stats.workflows.byDepartment.analytics, 1);
  });

  await test('validate: clean state passes validation', async () => {
    const result = await registry.validate();
    assert(result.valid, `Validation errors: ${result.errors.join(', ')}`);
  });

  await test('validateFiles: all generated files exist', async () => {
    const result = await registry.validateFiles();
    assert(result.valid, `Missing files: ${result.errors.join(', ')}`);
  });

  // ========================================
  // MULTI-DEPARTMENT SCENARIO
  // ========================================

  console.log('\nMulti-Department Scenario\n');

  await test('addDepartment: second department', async () => {
    await registry.addDepartment({
      name: 'marketing',
      displayName: 'Marketing',
      description: 'Content creation and campaign management'
    });
    const stats = await registry.getStatistics();
    assertEquals(stats.departments.total, 2);
  });

  await test('addAgent: agents in second department', async () => {
    await registry.addAgent({
      name: 'content-writer',
      displayName: 'Content Writer',
      department: 'marketing',
      type: 'specialist',
      description: 'Creates blog posts and social media content',
      tools: ['Read', 'Write']
    });
    await registry.addAgent({
      name: 'seo-analyzer',
      displayName: 'SEO Analyzer',
      department: 'marketing',
      type: 'specialist',
      description: 'Analyzes content for search engine optimization',
      tools: ['Bash', 'Read']
    });
    const stats = await registry.getStatistics();
    assertEquals(stats.agents.total, 5);
    assertEquals(stats.agents.byDepartment.marketing, 2);
  });

  await test('addWorkflow: workflow in second department', async () => {
    await registry.addWorkflow({
      name: 'content-review',
      displayName: 'Content Review',
      department: 'marketing',
      description: 'Reviews content for quality and SEO optimization',
      agents: ['content-writer', 'seo-analyzer'],
      trigger: { type: 'manual', enabled: true }
    });
    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.total, 2);
    assertEquals(stats.workflows.byDepartment.marketing, 1);
  });

  await test('listAgents: filter by department', async () => {
    const analyticsAgents = await registry.listAgents({ department: 'analytics' });
    const marketingAgents = await registry.listAgents({ department: 'marketing' });
    assertEquals(analyticsAgents.length, 3);
    assertEquals(marketingAgents.length, 2);
  });

  await test('listAgents: filter by type across departments', async () => {
    const specialists = await registry.listAgents({ type: 'specialist' });
    assertEquals(specialists.length, 3, 'Should find 3 specialists across both departments');
  });

  await test('listWorkflows: filter by department', async () => {
    const analyticsWf = await registry.listWorkflows({ department: 'analytics' });
    const marketingWf = await registry.listWorkflows({ department: 'marketing' });
    assertEquals(analyticsWf.length, 1);
    assertEquals(marketingWf.length, 1);
  });

  await test('listWorkflows: filter by trigger type', async () => {
    const scheduled = await registry.listWorkflows({ type: 'scheduled' });
    const manual = await registry.listWorkflows({ type: 'manual' });
    assertEquals(scheduled.length, 1);
    assertEquals(manual.length, 1);
  });

  // ========================================
  // CROSS-MODULE: VALIDATOR + REGISTRY
  // ========================================

  console.log('\nCross-Module: Validator + Registry\n');

  const validator = new Validator();

  await test('validator detects agent type from registry descriptions', async () => {
    const agents = await registry.listAgents();
    for (const agent of agents) {
      const detected = validator.detectAgentType(agent.description);
      if (detected) {
        // Detection should match or at least not be empty
        assert(detected.type, `Should detect type for: ${agent.description}`);
      }
    }
  });

  await test('validator accepts all registered department names', async () => {
    const depts = await registry.listDepartments();
    for (const dept of depts) {
      const result = validator.validateDepartmentName(dept.name);
      assert(result.valid, `Department name '${dept.name}' should be valid: ${result.errors.join(', ')}`);
    }
  });

  await test('validator accepts all registered agent names', async () => {
    const agents = await registry.listAgents();
    for (const agent of agents) {
      const result = validator.validateAgentName(agent.name);
      assert(result.valid, `Agent name '${agent.name}' should be valid: ${result.errors.join(', ')}`);
    }
  });

  await test('validator accepts all registered workflow names', async () => {
    const workflows = await registry.listWorkflows();
    for (const wf of workflows) {
      const result = validator.validateWorkflowName(wf.name);
      assert(result.valid, `Workflow name '${wf.name}' should be valid: ${result.errors.join(', ')}`);
    }
  });

  await test('validator accepts all registered descriptions', async () => {
    const agents = await registry.listAgents();
    for (const agent of agents) {
      const result = validator.validateDescription(agent.description);
      assert(result.valid, `Description for '${agent.name}' should be valid: ${result.errors.join(', ')}`);
    }
  });

  // ========================================
  // CROSS-MODULE: TEMPLATE ENGINE + REGISTRY
  // ========================================

  console.log('\nCross-Module: Template Engine + Registry\n');

  const engine = new TemplateEngine();

  await test('template engine lists all expected template types', async () => {
    const templates = await engine.listTemplates();
    const types = [...new Set(templates.map(t => t.type))];
    assert(types.includes('agent'), 'Should have agent templates');
    assert(types.includes('department'), 'Should have department templates');
    assert(types.includes('workflow'), 'Should have workflow templates');
    assert(types.includes('docs'), 'Should have docs templates');
  });

  await test('template engine renders agent template with registry data', async () => {
    const agent = registry.getAgent('metrics-collector');
    const rendered = await engine.render('agent/data-fetcher-agent.md', {
      name: agent.name,
      displayName: agent.displayName,
      description: agent.description,
      department: agent.department,
      type: agent.type,
      tools: agent.tools,
      model: agent.model
    });
    assert(rendered.includes('metrics-collector'), 'Should contain agent name');
    assert(rendered.includes('Metrics-collector'), 'Should contain capitalized name from template');
    assert(rendered.includes(agent.description), 'Should contain description');
  });

  await test('template engine renders specialist template with registry data', async () => {
    const agent = registry.getAgent('trend-analyzer');
    const rendered = await engine.render('agent/specialist-agent.md', {
      name: agent.name,
      displayName: agent.displayName,
      description: agent.description,
      department: agent.department,
      type: agent.type,
      tools: agent.tools,
      model: agent.model
    });
    assert(rendered.includes('trend-analyzer'), 'Should contain agent name');
  });

  await test('template engine renders orchestrator template with registry data', async () => {
    const agent = registry.getAgent('analytics-orchestrator');
    const rendered = await engine.render('agent/orchestrator-agent.md', {
      name: agent.name,
      displayName: agent.displayName,
      description: agent.description,
      department: agent.department,
      type: agent.type,
      tools: agent.tools,
      model: agent.model
    });
    assert(rendered.includes('analytics-orchestrator'), 'Should contain agent name');
  });

  // ========================================
  // SEARCH ACROSS DEPARTMENTS
  // ========================================

  console.log('\nSearch Across Departments\n');

  await test('search: finds agents by description keyword', async () => {
    const results = await registry.search('metrics');
    assert(results.agents.length >= 1, 'Should find metrics-collector');
    assert(results.agents.some(a => a.name === 'metrics-collector'));
  });

  await test('search: finds across entity types', async () => {
    const results = await registry.search('metrics');
    assert(results.agents.length >= 1, 'Should find metrics-collector agent');
    assert(results.workflows.length >= 1, 'Should find daily-metrics workflow');
  });

  await test('search: finds by department description', async () => {
    const results = await registry.search('content');
    assert(results.departments.length >= 1, 'Should find marketing (content creation)');
    assert(results.agents.length >= 1, 'Should find content-writer');
  });

  await test('search: case insensitive', async () => {
    const upper = await registry.search('ANALYTICS');
    const lower = await registry.search('analytics');
    assertEquals(upper.departments.length, lower.departments.length);
    assertEquals(upper.agents.length, lower.agents.length);
  });

  await test('search: no results for nonexistent term', async () => {
    const results = await registry.search('zzzznonexistent');
    assertEquals(results.departments.length, 0);
    assertEquals(results.agents.length, 0);
    assertEquals(results.workflows.length, 0);
  });

  // ========================================
  // UPDATE OPERATIONS
  // ========================================

  console.log('\nUpdate Operations\n');

  await test('updateDepartment: updates description', async () => {
    const updated = await registry.updateDepartment('analytics', {
      description: 'Advanced data analysis, ML pipelines, and reporting'
    });
    assert(updated.description.includes('ML pipelines'));
    assert(updated.updated, 'Should have updated timestamp');
  });

  await test('updateAgent: updates tools', async () => {
    const updated = await registry.updateAgent('metrics-collector', {
      tools: ['Bash', 'Read', 'WebFetch']
    });
    assertEquals(updated.tools.length, 3);
    assert(updated.tools.includes('WebFetch'));
  });

  await test('updateWorkflow: updates trigger', async () => {
    const updated = await registry.updateWorkflow('analytics', 'daily-metrics', {
      trigger: { type: 'scheduled', schedule: 'daily 8:00' }
    });
    assert(updated.trigger.schedule === 'daily 8:00');
  });

  // ========================================
  // EXPORT / IMPORT ROUNDTRIP
  // ========================================

  console.log('\nExport / Import Roundtrip\n');

  await test('export: captures complete state', async () => {
    const exported = await registry.export();
    assert(exported.departments, 'Should have departments');
    assert(exported.agents, 'Should have agents');
    assert(exported.workflows, 'Should have workflows');
    assert(exported.exported, 'Should have export timestamp');
    assertEquals(Object.keys(exported.departments.departments).length, 2);
    assertEquals(Object.keys(exported.agents.agents).length, 5);
    assertEquals(Object.keys(exported.workflows.workflows).length, 2);
  });

  await test('import: restores from export', async () => {
    const exported = await registry.export();

    // Create a fresh registry and import
    const testDir2 = path.join(__dirname, '..', 'test-e2e-import');
    await cleanup(testDir2);
    const registry2 = new RegistryManager(testDir2);
    await registry2.load();

    // Verify empty
    const emptyStats = await registry2.getStatistics();
    assertEquals(emptyStats.departments.total, 0);

    // Import
    await registry2.import(exported);

    // Verify restored
    const restoredStats = await registry2.getStatistics();
    assertEquals(restoredStats.departments.total, 2);
    assertEquals(restoredStats.agents.total, 5);
    assertEquals(restoredStats.workflows.total, 2);

    // Verify specific entities
    const dept = registry2.getDepartment('analytics');
    assert(dept, 'Should have analytics department');
    assert(dept.description.includes('ML pipelines'), 'Should have updated description');

    const agent = registry2.getAgent('metrics-collector');
    assert(agent, 'Should have metrics-collector agent');
    assert(agent.tools.includes('WebFetch'), 'Should have updated tools');

    await cleanup(testDir2);
  });

  // ========================================
  // PERSISTENCE
  // ========================================

  console.log('\nPersistence\n');

  await test('data survives save and reload', async () => {
    // Save current state
    await registry.save();

    // Create new instance pointing to same directory
    const registry2 = new RegistryManager(testDir);
    await registry2.load();

    const stats = await registry2.getStatistics();
    assertEquals(stats.departments.total, 2);
    assertEquals(stats.agents.total, 5);
    assertEquals(stats.workflows.total, 2);

    // Verify a specific agent survived
    const agent = registry2.getAgent('seo-analyzer');
    assert(agent, 'SEO analyzer should survive reload');
    assertEquals(agent.department, 'marketing');
  });

  // ========================================
  // EXAMPLE DIRECTORY VALIDATION
  // ========================================

  console.log('\nExample Directory Validation\n');

  const examplesDir = path.join(__dirname, '..', 'examples');

  await test('examples/daily-briefing: has required files', async () => {
    const dir = path.join(examplesDir, 'daily-briefing');
    const readme = await fs.readFile(path.join(dir, 'README.md'), 'utf8');
    assert(readme.includes('Daily Briefing'), 'Should have README');

    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'morning-briefing.json'), 'utf8'));
    assert(workflow.name === 'morning-briefing', 'Should have workflow config');
    assert(workflow.steps.length === 2, 'Should have 2 steps');
    assert(workflow.steps[0].parallel === true, 'Step 1 should be parallel');

    const weatherMd = await fs.readFile(path.join(dir, 'agents', 'weather-fetcher.md'), 'utf8');
    assert(weatherMd.includes('weather'), 'Should have weather agent definition');

    const weatherJs = await fs.readFile(path.join(dir, 'agents', 'weather-fetcher.js'), 'utf8');
    assert(weatherJs.includes('fetchWeather') || weatherJs.includes('weather'), 'Should have weather implementation');
  });

  await test('examples/content-pipeline: has required files', async () => {
    const dir = path.join(examplesDir, 'content-pipeline');
    const readme = await fs.readFile(path.join(dir, 'README.md'), 'utf8');
    assert(readme.includes('Content Pipeline'), 'Should have README');

    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'publish-article.json'), 'utf8'));
    assert(workflow.name === 'publish-article', 'Should have workflow config');
    assert(workflow.steps.length === 3, 'Should have 3 steps');

    const researcherMd = await fs.readFile(path.join(dir, 'agents', 'topic-researcher.md'), 'utf8');
    assert(researcherMd.includes('topic-researcher'), 'Should have researcher agent');

    const researcherJs = await fs.readFile(path.join(dir, 'agents', 'topic-researcher.js'), 'utf8');
    assert(researcherJs.includes('research'), 'Should have researcher implementation');

    const writerMd = await fs.readFile(path.join(dir, 'agents', 'article-writer.md'), 'utf8');
    assert(writerMd.includes('article-writer'), 'Should have writer agent');

    const reviewerMd = await fs.readFile(path.join(dir, 'agents', 'quality-reviewer.md'), 'utf8');
    assert(reviewerMd.includes('quality-reviewer'), 'Should have reviewer agent');
  });

  await test('examples/daily-briefing: workflow agents match agent files', async () => {
    const dir = path.join(examplesDir, 'daily-briefing');
    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'morning-briefing.json'), 'utf8'));

    const agentNames = workflow.steps.flatMap(s => s.agents.map(a => a.name));
    for (const name of agentNames) {
      const mdPath = path.join(dir, 'agents', `${name}.md`);
      try {
        await fs.access(mdPath);
      } catch {
        throw new Error(`Workflow references agent '${name}' but ${name}.md is missing`);
      }
    }
  });

  await test('examples/content-pipeline: workflow agents match agent files', async () => {
    const dir = path.join(examplesDir, 'content-pipeline');
    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'publish-article.json'), 'utf8'));

    const agentNames = workflow.steps.flatMap(s => s.agents.map(a => a.name));
    for (const name of agentNames) {
      const mdPath = path.join(dir, 'agents', `${name}.md`);
      try {
        await fs.access(mdPath);
      } catch {
        throw new Error(`Workflow references agent '${name}' but ${name}.md is missing`);
      }
    }
  });

  await test('examples/content-pipeline: workflow has valid JSON structure', async () => {
    const dir = path.join(examplesDir, 'content-pipeline');
    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'publish-article.json'), 'utf8'));

    assert(workflow.name, 'Should have name');
    assert(workflow.department, 'Should have department');
    assert(workflow.description, 'Should have description');
    assert(Array.isArray(workflow.steps), 'Steps should be array');
    assert(workflow.trigger, 'Should have trigger');
    assert(workflow.output, 'Should have output');

    // Verify step groups are sequential
    for (let i = 0; i < workflow.steps.length; i++) {
      assertEquals(workflow.steps[i].group, i + 1, `Step ${i} should have group ${i + 1}`);
    }
  });

  await test('examples/code-review: has required files', async () => {
    const dir = path.join(examplesDir, 'code-review');
    const readme = await fs.readFile(path.join(dir, 'README.md'), 'utf8');
    assert(readme.includes('Code Review'), 'Should have README');

    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'review-pr.json'), 'utf8'));
    assert(workflow.name === 'review-pr', 'Should have workflow config');
    assert(workflow.steps.length === 3, 'Should have 3 steps');
    assert(workflow.steps[1].parallel === true, 'Step 2 should be parallel');

    const diffMd = await fs.readFile(path.join(dir, 'agents', 'diff-collector.md'), 'utf8');
    assert(diffMd.includes('diff-collector'), 'Should have diff collector agent');

    const diffJs = await fs.readFile(path.join(dir, 'agents', 'diff-collector.js'), 'utf8');
    assert(diffJs.includes('collectDiff') || diffJs.includes('parseDiff'), 'Should have diff collector implementation');

    const securityMd = await fs.readFile(path.join(dir, 'agents', 'security-scanner.md'), 'utf8');
    assert(securityMd.includes('security-scanner'), 'Should have security scanner agent');

    const styleMd = await fs.readFile(path.join(dir, 'agents', 'style-checker.md'), 'utf8');
    assert(styleMd.includes('style-checker'), 'Should have style checker agent');

    const logicMd = await fs.readFile(path.join(dir, 'agents', 'logic-reviewer.md'), 'utf8');
    assert(logicMd.includes('logic-reviewer'), 'Should have logic reviewer agent');

    const summarizerMd = await fs.readFile(path.join(dir, 'agents', 'review-summarizer.md'), 'utf8');
    assert(summarizerMd.includes('review-summarizer'), 'Should have review summarizer agent');
  });

  await test('examples/code-review: workflow agents match agent files', async () => {
    const dir = path.join(examplesDir, 'code-review');
    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'review-pr.json'), 'utf8'));

    const agentNames = workflow.steps.flatMap(s => s.agents.map(a => a.name));
    for (const name of agentNames) {
      const mdPath = path.join(dir, 'agents', `${name}.md`);
      try {
        await fs.access(mdPath);
      } catch {
        throw new Error(`Workflow references agent '${name}' but ${name}.md is missing`);
      }
    }
  });

  await test('examples/code-review: workflow has valid JSON structure', async () => {
    const dir = path.join(examplesDir, 'code-review');
    const workflow = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'review-pr.json'), 'utf8'));

    assert(workflow.name, 'Should have name');
    assert(workflow.department, 'Should have department');
    assert(workflow.description, 'Should have description');
    assert(Array.isArray(workflow.steps), 'Steps should be array');
    assert(workflow.trigger, 'Should have trigger');
    assert(workflow.output, 'Should have output');

    for (let i = 0; i < workflow.steps.length; i++) {
      assertEquals(workflow.steps[i].group, i + 1, `Step ${i} should have group ${i + 1}`);
    }
  });

  await test('examples/code-review: diff-collector.js exports functions', async () => {
    const { collectDiff, parseDiff } = require(path.join(examplesDir, 'code-review', 'agents', 'diff-collector.js'));
    assert(typeof collectDiff === 'function', 'Should export collectDiff');
    assert(typeof parseDiff === 'function', 'Should export parseDiff');

    // Test parseDiff with a sample diff
    const sampleDiff = `a/lib/test.js b/lib/test.js
index abc..def
--- a/lib/test.js
+++ b/lib/test.js
@@ -1,3 +1,4 @@
 const x = 1;
+const y = 2;
 module.exports = x;
`;
    const files = parseDiff(sampleDiff);
    assert(files.length === 1, 'Should parse one file');
    assert(files[0].path === 'lib/test.js', 'Should extract file path');
    assert(files[0].additions >= 1, 'Should count additions');
  });

  // ========================================
  // ERROR SCENARIOS
  // ========================================

  console.log('\nError Scenarios\n');

  await test('addAgent: fails for nonexistent department', async () => {
    try {
      await registry.addAgent({
        name: 'orphan-agent',
        displayName: 'Orphan Agent',
        department: 'nonexistent',
        type: 'specialist',
        description: 'This should fail because the department does not exist'
      });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('does not exist'), 'Error should mention nonexistent department');
      assert(error.message.includes('analytics') || error.message.includes('marketing'),
        'Error should list available departments');
    }
  });

  await test('addDepartment: fails for duplicate name', async () => {
    try {
      await registry.addDepartment({
        name: 'analytics',
        displayName: 'Analytics Duplicate',
        description: 'This should fail because analytics already exists'
      });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('already exists'));
    }
  });

  await test('addAgent: fails for duplicate name', async () => {
    try {
      await registry.addAgent({
        name: 'metrics-collector',
        displayName: 'Duplicate Collector',
        department: 'analytics',
        type: 'data-fetcher',
        description: 'This should fail because metrics-collector already exists'
      });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('already exists'));
    }
  });

  await test('addWorkflow: fails for duplicate in same department', async () => {
    try {
      await registry.addWorkflow({
        name: 'daily-metrics',
        displayName: 'Duplicate Metrics',
        department: 'analytics',
        description: 'This should fail because daily-metrics already exists in analytics'
      });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('already exists'));
    }
  });

  await test('updateDepartment: fails for nonexistent', async () => {
    try {
      await registry.updateDepartment('nonexistent', { description: 'nope' });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not found'));
    }
  });

  await test('updateAgent: fails for nonexistent', async () => {
    try {
      await registry.updateAgent('nonexistent', { tools: [] });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not found'));
    }
  });

  await test('updateWorkflow: fails for nonexistent', async () => {
    try {
      await registry.updateWorkflow('analytics', 'nonexistent', { description: 'nope' });
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not found'));
    }
  });

  await test('ensureLoaded: fails when not loaded', async () => {
    const fresh = new RegistryManager(testDir);
    try {
      fresh.getDepartment('analytics');
      throw new Error('Should have thrown');
    } catch (error) {
      assert(error.message.includes('not loaded'));
    }
  });

  // ========================================
  // CLEANUP
  // ========================================

  console.log('\nCleanup\n');

  await test('cleanup: remove test directories', async () => {
    await cleanup(testDir);

    try {
      await fs.access(testDir);
      throw new Error('Test directory should be removed');
    } catch (error) {
      assert(error.code === 'ENOENT', 'Directory should not exist');
    }
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

  if (failedTests.length > 0) {
    console.log('\nFailed Tests:');
    failedTests.forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }

  if (failCount === 0) {
    console.log('\n\ud83c\udf89 All tests passed!');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
