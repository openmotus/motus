#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-11
 *
 * Tests for:
 * - listWorkflows() / getStatistics() crash safety with missing trigger field
 * - usedInWorkflows stores workflow ID (department-name) instead of bare name
 * - customer-support example file structure and content validation
 * - ticket-intake.js module exports and parsing
 */

const path = require('path');
const fs = require('fs');
const RegistryManager = require('../lib/registry-manager');

const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    results.passed++;
    results.tests.push({ name, status: 'passed' });
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message || 'Not equal'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function run() {
  console.log('🧪 Steward Fixes — 2026-03-11\n');

  // ============================================
  // listWorkflows / getStatistics crash safety
  // ============================================
  console.log('  listWorkflows / getStatistics crash safety');

  const tmpDir = path.join(__dirname, '..', 'test-tmp-0311');
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'department'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'templates', 'agent'), { recursive: true });

  // Copy required templates
  const srcTemplates = path.join(__dirname, '..', 'templates');
  const dstTemplates = path.join(tmpDir, 'templates');
  for (const subdir of ['department', 'agent']) {
    const srcDir = path.join(srcTemplates, subdir);
    const dstDir = path.join(dstTemplates, subdir);
    if (fs.existsSync(srcDir)) {
      for (const f of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, f), path.join(dstDir, f));
      }
    }
  }

  const registry = new RegistryManager(tmpDir);
  await registry.load();

  // Create a department + workflow with trigger
  await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'Test department' });
  await registry.addWorkflow({
    name: 'normal-wf',
    displayName: 'Normal Workflow',
    department: 'test-dept',
    description: 'Has a trigger',
    trigger: { type: 'scheduled', schedule: 'daily 9:00' }
  });

  // Manually inject a workflow WITHOUT a trigger field (simulates imported/corrupted data)
  registry.workflows.workflows['test-dept-no-trigger'] = {
    name: 'no-trigger',
    displayName: 'No Trigger WF',
    department: 'test-dept',
    description: 'Missing trigger field',
    agents: [],
    created: new Date().toISOString()
    // NOTE: no trigger field
  };

  await testAsync('listWorkflows with type filter does not crash on missing trigger', async () => {
    const scheduled = await registry.listWorkflows({ type: 'scheduled' });
    assertEquals(scheduled.length, 1, 'Should find 1 scheduled workflow');
    assertEquals(scheduled[0].name, 'normal-wf', 'Should be the normal workflow');
  });

  await testAsync('listWorkflows with type filter skips workflows with null trigger', async () => {
    const manual = await registry.listWorkflows({ type: 'manual' });
    assertEquals(manual.length, 0, 'No manual workflows');
  });

  await testAsync('listWorkflows without filter returns all workflows', async () => {
    const all = await registry.listWorkflows();
    assertEquals(all.length, 2, 'Should find both workflows');
  });

  await testAsync('getStatistics does not crash on missing trigger', async () => {
    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.total, 2, 'Should count both workflows');
    assertEquals(stats.workflows.byType.scheduled, 1, 'Should count 1 scheduled');
    assertEquals(stats.workflows.byType.manual || 0, 0, 'Missing trigger is not manual');
    assertEquals(stats.workflows.byType.unknown, 1, 'Workflow with no trigger counted as unknown');
  });

  // ============================================
  // usedInWorkflows stores workflow ID
  // ============================================
  console.log('\n  usedInWorkflows stores workflow ID');

  const registry2 = new RegistryManager(tmpDir);
  await registry2.load();
  await registry2.reset();

  await registry2.addDepartment({ name: 'dept-a', displayName: 'Dept A', description: 'First dept' });
  await registry2.addDepartment({ name: 'dept-b', displayName: 'Dept B', description: 'Second dept' });

  await registry2.addAgent({
    name: 'shared-agent',
    displayName: 'Shared Agent',
    department: 'dept-a',
    type: 'data-fetcher',
    description: 'Used by workflows in both departments'
  });

  await registry2.addWorkflow({
    name: 'pipeline',
    displayName: 'Pipeline A',
    department: 'dept-a',
    description: 'Uses shared agent',
    agents: ['shared-agent']
  });

  await registry2.addWorkflow({
    name: 'pipeline',
    displayName: 'Pipeline B',
    department: 'dept-b',
    description: 'Also uses shared agent',
    agents: ['shared-agent']
  });

  await testAsync('usedInWorkflows contains workflow IDs, not bare names', async () => {
    const agent = registry2.getAgent('shared-agent');
    assert(agent.usedInWorkflows.includes('dept-a-pipeline'), 'Should contain dept-a-pipeline');
    assert(agent.usedInWorkflows.includes('dept-b-pipeline'), 'Should contain dept-b-pipeline');
    assertEquals(agent.usedInWorkflows.length, 2, 'Should have 2 unique entries');
  });

  await testAsync('usedInWorkflows does not contain bare workflow name', async () => {
    const agent = registry2.getAgent('shared-agent');
    assert(!agent.usedInWorkflows.includes('pipeline'), 'Should NOT contain bare name "pipeline"');
  });

  await testAsync('getWorkflowsByAgent returns both workflows', async () => {
    const workflows = await registry2.getWorkflowsByAgent('shared-agent');
    assertEquals(workflows.length, 2, 'Should find 2 workflows using shared-agent');
    const names = workflows.map(w => `${w.department}-${w.name}`).sort();
    assertEquals(names[0], 'dept-a-pipeline', 'First workflow ID');
    assertEquals(names[1], 'dept-b-pipeline', 'Second workflow ID');
  });

  // ============================================
  // customer-support example validation
  // ============================================
  console.log('\n  customer-support example validation');

  const exampleDir = path.join(__dirname, '..', 'examples', 'customer-support');

  test('customer-support directory exists', () => {
    assert(fs.existsSync(exampleDir), 'examples/customer-support/ should exist');
  });

  test('customer-support has README.md', () => {
    const readme = fs.readFileSync(path.join(exampleDir, 'README.md'), 'utf8');
    assert(readme.includes('Customer Support'), 'README should mention Customer Support');
    assert(readme.includes('triage-ticket'), 'README should mention triage-ticket workflow');
  });

  const expectedAgents = [
    'ticket-intake.md',
    'ticket-intake.js',
    'sentiment-analyzer.md',
    'category-classifier.md',
    'priority-scorer.md',
    'response-drafter.md'
  ];

  for (const agentFile of expectedAgents) {
    test(`customer-support has agents/${agentFile}`, () => {
      const filePath = path.join(exampleDir, 'agents', agentFile);
      assert(fs.existsSync(filePath), `agents/${agentFile} should exist`);
    });
  }

  test('customer-support has workflows/triage-ticket.json', () => {
    const filePath = path.join(exampleDir, 'workflows', 'triage-ticket.json');
    assert(fs.existsSync(filePath), 'workflows/triage-ticket.json should exist');
  });

  test('triage-ticket.json is valid JSON with correct structure', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'triage-ticket.json'), 'utf8'));
    assertEquals(wf.name, 'triage-ticket', 'Workflow name');
    assertEquals(wf.department, 'customer-support', 'Workflow department');
    assertEquals(wf.steps.length, 3, 'Should have 3 steps');
    assertEquals(wf.steps[0].parallel, false, 'Step 1 is sequential');
    assertEquals(wf.steps[1].parallel, true, 'Step 2 is parallel');
    assertEquals(wf.steps[2].parallel, false, 'Step 3 is sequential');
  });

  test('triage-ticket step 2 has 3 parallel agents', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'triage-ticket.json'), 'utf8'));
    assertEquals(wf.steps[1].agents.length, 3, 'Step 2 should have 3 parallel agents');
    const names = wf.steps[1].agents.map(a => a.name).sort();
    assert(names.includes('category-classifier'), 'Should include category-classifier');
    assert(names.includes('priority-scorer'), 'Should include priority-scorer');
    assert(names.includes('sentiment-analyzer'), 'Should include sentiment-analyzer');
  });

  test('all workflow agents have matching .md files', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'triage-ticket.json'), 'utf8'));
    for (const step of wf.steps) {
      for (const agent of step.agents) {
        const mdPath = path.join(exampleDir, 'agents', `${agent.name}.md`);
        assert(fs.existsSync(mdPath), `Agent ${agent.name} should have a .md file`);
      }
    }
  });

  test('agent .md files have frontmatter with name and description', () => {
    for (const agentFile of expectedAgents.filter(f => f.endsWith('.md'))) {
      const content = fs.readFileSync(path.join(exampleDir, 'agents', agentFile), 'utf8');
      assert(content.startsWith('---'), `${agentFile} should start with frontmatter`);
      assert(content.includes('name:'), `${agentFile} should have name in frontmatter`);
      assert(content.includes('description:'), `${agentFile} should have description in frontmatter`);
      assert(content.includes('tools:'), `${agentFile} should have tools in frontmatter`);
    }
  });

  // ============================================
  // ticket-intake.js module tests
  // ============================================
  console.log('\n  ticket-intake.js module tests');

  const { parseTicket, parseCustomer, stripHtml, detectChannel } = require('../examples/customer-support/agents/ticket-intake');

  test('parseTicket parses email-format ticket', () => {
    const raw = `From: Jane Smith <jane@example.com>
Subject: Cannot access billing
Date: 2026-03-11T10:00:00Z

I cannot access the billing portal. Please help!`;
    const result = parseTicket(raw);
    assert(result.ticket, 'Should return ticket object');
    assertEquals(result.ticket.subject, 'Cannot access billing', 'Subject');
    assertEquals(result.ticket.customer.name, 'Jane Smith', 'Customer name');
    assertEquals(result.ticket.customer.email, 'jane@example.com', 'Customer email');
    assert(result.ticket.body.includes('billing portal'), 'Body should contain message');
    assertEquals(result.ticket.channel, 'email', 'Channel should be email');
  });

  test('parseTicket handles plain text (no headers)', () => {
    const raw = 'My account is locked and I need to get in urgently.';
    const result = parseTicket(raw);
    assert(result.ticket.body.includes('account is locked'), 'Body should be the full text');
    assertEquals(result.ticket.channel, 'web', 'Default channel should be web');
  });

  test('parseTicket throws on empty input', () => {
    let threw = false;
    try {
      parseTicket('');
    } catch (e) {
      threw = true;
      assert(e.message.includes('non-empty string'), 'Error should mention non-empty string');
    }
    assert(threw, 'Should throw on empty input');
  });

  test('parseTicket throws on non-string input', () => {
    let threw = false;
    try {
      parseTicket(42);
    } catch (e) {
      threw = true;
    }
    assert(threw, 'Should throw on non-string input');
  });

  test('parseTicket detects attachments', () => {
    const raw = 'Subject: Help\n\nPlease see [attachment: screenshot.png]';
    const result = parseTicket(raw);
    assertEquals(result.ticket.hasAttachments, true, 'Should detect attachment');
  });

  test('parseTicket reports no attachments when none present', () => {
    const raw = 'Subject: Help\n\nJust a text message, no files.';
    const result = parseTicket(raw);
    assertEquals(result.ticket.hasAttachments, false, 'Should not detect attachment');
  });

  test('parseCustomer parses email format "Name <email>"', () => {
    const customer = parseCustomer('John Doe <john@example.com>');
    assertEquals(customer.name, 'John Doe', 'Name');
    assertEquals(customer.email, 'john@example.com', 'Email');
  });

  test('parseCustomer parses bare email', () => {
    const customer = parseCustomer('john@example.com');
    assertEquals(customer.email, 'john@example.com', 'Email');
  });

  test('parseCustomer handles plain name', () => {
    const customer = parseCustomer('Unknown User');
    assertEquals(customer.name, 'Unknown User', 'Name');
  });

  test('stripHtml removes HTML tags', () => {
    assertEquals(stripHtml('<p>Hello <b>world</b></p>'), 'Hello world');
  });

  test('stripHtml handles &nbsp; and &amp;', () => {
    assertEquals(stripHtml('A&nbsp;B&amp;C'), 'A B&C');
  });

  test('detectChannel returns email when from header present', () => {
    assertEquals(detectChannel({ from: 'test@example.com' }), 'email');
  });

  test('detectChannel returns web as default', () => {
    assertEquals(detectChannel({}), 'web');
  });

  test('parseTicket generates valid ticket ID format', () => {
    const result = parseTicket('Test ticket');
    assert(/^T-\d{4}-\d{4}$/.test(result.ticket.id), `ID should match T-YYYY-NNNN format, got: ${result.ticket.id}`);
  });

  test('parseTicket accepts metadata override for channel', () => {
    const result = parseTicket('Test ticket', { channel: 'slack' });
    assertEquals(result.ticket.channel, 'slack', 'Should use metadata channel');
  });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

run().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
