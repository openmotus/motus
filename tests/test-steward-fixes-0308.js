#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-08
 *
 * Tests for improvements made in the March 8 stewardship cycle:
 * - addWorkflow() agents array validation
 * - updateWorkflow() null/type check for updates parameter
 * - research-assistant example validation
 * - web-researcher.js exports and classifySource function
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

async function runTests() {
  console.log('Steward Fixes — 2026-03-08');
  console.log('='.repeat(60) + '\n');

  // ============================================================
  // addWorkflow() agents validation
  // ============================================================
  console.log('addWorkflow() agents array validation\n');

  const tmpDir = path.join(__dirname, '__tmp_0308__');
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });

  // Copy minimal template for department creation
  const templateSrc = path.join(__dirname, '..', 'templates', 'department', 'department-agent.md.hbs');
  if (fs.existsSync(templateSrc)) {
    fs.copyFileSync(templateSrc, path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'));
  } else {
    fs.writeFileSync(path.join(tmpDir, 'templates', 'department', 'department-agent.md.hbs'), '---\nname: {{name}}\n---\n');
  }

  const registry = new RegistryManager(tmpDir);
  await registry.load();
  await registry.addDepartment({
    name: 'test-dept',
    displayName: 'Test Department',
    description: 'A department for testing workflow validation'
  });

  // Test: string agents should throw
  await assertThrowsAsync(
    () => registry.addWorkflow({
      name: 'bad-workflow',
      displayName: 'Bad Workflow',
      department: 'test-dept',
      description: 'Workflow with string agents instead of array',
      agents: 'single-agent'
    }),
    'addWorkflow() rejects string agents',
    'must be an array'
  );

  // Test: number agents should throw
  await assertThrowsAsync(
    () => registry.addWorkflow({
      name: 'bad-workflow-2',
      displayName: 'Bad Workflow 2',
      department: 'test-dept',
      description: 'Workflow with number agents',
      agents: 42
    }),
    'addWorkflow() rejects number agents',
    'must be an array'
  );

  // Test: object agents should throw
  await assertThrowsAsync(
    () => registry.addWorkflow({
      name: 'bad-workflow-3',
      displayName: 'Bad Workflow 3',
      department: 'test-dept',
      description: 'Workflow with object agents',
      agents: { agent: 'test' }
    }),
    'addWorkflow() rejects object agents',
    'must be an array'
  );

  // Test: null agents should be allowed (defaults to [])
  const nullResult = await registry.addWorkflow({
    name: 'null-agents-wf',
    displayName: 'Null Agents',
    department: 'test-dept',
    description: 'Workflow with null agents is allowed',
    agents: null
  });
  assert(Array.isArray(nullResult.agents) && nullResult.agents.length === 0,
    'addWorkflow() accepts null agents (defaults to [])');

  // Test: undefined agents should be allowed (defaults to [])
  const undefResult = await registry.addWorkflow({
    name: 'undef-agents-wf',
    displayName: 'Undef Agents',
    department: 'test-dept',
    description: 'Workflow with undefined agents is allowed'
  });
  assert(Array.isArray(undefResult.agents) && undefResult.agents.length === 0,
    'addWorkflow() accepts undefined agents (defaults to [])');

  // Test: valid array agents should work
  const goodResult = await registry.addWorkflow({
    name: 'good-workflow',
    displayName: 'Good Workflow',
    department: 'test-dept',
    description: 'Workflow with proper array agents',
    agents: ['agent-a', 'agent-b']
  });
  assert(Array.isArray(goodResult.agents) && goodResult.agents.length === 2,
    'addWorkflow() accepts valid array agents');

  // Test: empty array agents should work
  const emptyResult = await registry.addWorkflow({
    name: 'empty-agents-wf',
    displayName: 'Empty Agents',
    department: 'test-dept',
    description: 'Workflow with empty array agents',
    agents: []
  });
  assert(Array.isArray(emptyResult.agents) && emptyResult.agents.length === 0,
    'addWorkflow() accepts empty array agents');

  // ============================================================
  // updateWorkflow() null check
  // ============================================================
  console.log('\nupdateWorkflow() null/type validation\n');

  await assertThrowsAsync(
    () => registry.updateWorkflow('test-dept', 'good-workflow', null),
    'updateWorkflow() rejects null updates',
    'non-null object'
  );

  await assertThrowsAsync(
    () => registry.updateWorkflow('test-dept', 'good-workflow', undefined),
    'updateWorkflow() rejects undefined updates',
    'non-null object'
  );

  await assertThrowsAsync(
    () => registry.updateWorkflow('test-dept', 'good-workflow', 'string'),
    'updateWorkflow() rejects string updates',
    'non-null object'
  );

  await assertThrowsAsync(
    () => registry.updateWorkflow('test-dept', 'good-workflow', 42),
    'updateWorkflow() rejects number updates',
    'non-null object'
  );

  // Test: valid update should work
  const updated = await registry.updateWorkflow('test-dept', 'good-workflow', { description: 'Updated description' });
  assert(updated.description === 'Updated description',
    'updateWorkflow() accepts valid object updates');

  assert(updated.updated !== undefined,
    'updateWorkflow() sets updated timestamp');

  // ============================================================
  // research-assistant example validation
  // ============================================================
  console.log('\nresearch-assistant example validation\n');

  const exDir = path.join(__dirname, '..', 'examples', 'research-assistant');

  assert(fs.existsSync(path.join(exDir, 'README.md')),
    'research-assistant: README.md exists');

  assert(fs.existsSync(path.join(exDir, 'agents', 'web-researcher.md')),
    'research-assistant: web-researcher.md exists');

  assert(fs.existsSync(path.join(exDir, 'agents', 'web-researcher.js')),
    'research-assistant: web-researcher.js exists');

  assert(fs.existsSync(path.join(exDir, 'agents', 'academic-searcher.md')),
    'research-assistant: academic-searcher.md exists');

  assert(fs.existsSync(path.join(exDir, 'agents', 'source-evaluator.md')),
    'research-assistant: source-evaluator.md exists');

  assert(fs.existsSync(path.join(exDir, 'agents', 'report-synthesizer.md')),
    'research-assistant: report-synthesizer.md exists');

  assert(fs.existsSync(path.join(exDir, 'workflows', 'deep-research.json')),
    'research-assistant: deep-research.json exists');

  // Validate workflow JSON
  const workflow = JSON.parse(fs.readFileSync(path.join(exDir, 'workflows', 'deep-research.json'), 'utf8'));

  assert(workflow.name === 'deep-research',
    'research-assistant: workflow name is deep-research');

  assert(workflow.department === 'research-assistant',
    'research-assistant: workflow department is research-assistant');

  assert(Array.isArray(workflow.steps) && workflow.steps.length === 3,
    'research-assistant: workflow has 3 steps');

  assert(workflow.steps[0].parallel === true,
    'research-assistant: step 1 is parallel (source gathering)');

  assert(workflow.steps[0].agents.length === 2,
    'research-assistant: step 1 has 2 parallel agents');

  assert(workflow.steps[1].parallel === false,
    'research-assistant: step 2 is sequential (evaluation)');

  assert(workflow.steps[2].parallel === false,
    'research-assistant: step 3 is sequential (synthesis)');

  // Verify step groups are sequential
  for (let i = 0; i < workflow.steps.length; i++) {
    assert(workflow.steps[i].group === i + 1,
      `research-assistant: step ${i + 1} has group ${i + 1}`);
  }

  // Verify all workflow agents have corresponding .md files
  const agentNames = workflow.steps.flatMap(s => s.agents.map(a => a.name));
  for (const name of agentNames) {
    assert(fs.existsSync(path.join(exDir, 'agents', `${name}.md`)),
      `research-assistant: agent file ${name}.md exists for workflow reference`);
  }

  // Validate agent .md files have frontmatter
  for (const name of agentNames) {
    const content = fs.readFileSync(path.join(exDir, 'agents', `${name}.md`), 'utf8');
    assert(content.startsWith('---'),
      `research-assistant: ${name}.md has frontmatter`);
    assert(content.includes(`name: ${name}`),
      `research-assistant: ${name}.md frontmatter has correct name`);
  }

  // Validate README content
  const readme = fs.readFileSync(path.join(exDir, 'README.md'), 'utf8');
  assert(readme.includes('Research Assistant'),
    'research-assistant: README mentions Research Assistant');
  assert(readme.includes('deep-research'),
    'research-assistant: README mentions deep-research workflow');
  assert(readme.includes('web-researcher') && readme.includes('academic-searcher'),
    'research-assistant: README mentions both data-fetcher agents');
  assert(readme.includes('source-evaluator') && readme.includes('report-synthesizer'),
    'research-assistant: README mentions both specialist agents');

  // ============================================================
  // web-researcher.js module validation
  // ============================================================
  console.log('\nweb-researcher.js module validation\n');

  const { searchWeb, classifySource } = require(path.join(exDir, 'agents', 'web-researcher.js'));

  assert(typeof searchWeb === 'function',
    'web-researcher.js: exports searchWeb function');

  assert(typeof classifySource === 'function',
    'web-researcher.js: exports classifySource function');

  // Test classifySource
  assert(classifySource('https://github.com/openmotus/motus') === 'documentation',
    'classifySource: github.com → documentation');

  assert(classifySource('https://docs.anthropic.com/guide') === 'documentation',
    'classifySource: docs.* → documentation');

  assert(classifySource('https://news.ycombinator.com/item') === 'news',
    'classifySource: news site → news');

  assert(classifySource('https://reddit.com/r/programming') === 'forum',
    'classifySource: reddit → forum');

  assert(classifySource('https://stackoverflow.com/questions/123') === 'forum',
    'classifySource: stackoverflow → forum');

  assert(classifySource('https://example.gov/report') === 'official',
    'classifySource: .gov → official');

  assert(classifySource('https://mit.edu/paper') === 'official',
    'classifySource: .edu → official');

  assert(classifySource('https://myblog.com/post') === 'blog',
    'classifySource: generic URL → blog');

  assert(classifySource('') === 'unknown',
    'classifySource: empty string → unknown');

  assert(classifySource(null) === 'unknown',
    'classifySource: null → unknown');

  // Test searchWeb without API key (should return template)
  const noKeyResult = await searchWeb('test query');
  assert(noKeyResult.query === 'test query',
    'searchWeb: returns query in result');
  assert(Array.isArray(noKeyResult.sources),
    'searchWeb: returns sources array');
  assert(noKeyResult.note && noKeyResult.note.includes('No SEARCH_API_KEY'),
    'searchWeb: notes when no API key is set');

  // ============================================================
  // Cleanup
  // ============================================================
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
