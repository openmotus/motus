/**
 * Steward Fixes — 2026-03-30
 *
 * Tests for:
 * 1. import() mutation safety — imported data is deep-copied
 * 2. getStatistics() dynamic trigger type counting
 * 3. TypeScript TriggerType flexibility
 * 4. onboarding-automation example validation
 * 5. onboarding-checklist.js module tests
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

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-0330-'));

  // ============================================
  // import() mutation safety
  // ============================================
  console.log('\n  import() mutation safety');

  await testAsync('import() deep copies departments — source mutation does not affect registry', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    const sourceData = {
      departments: {
        departments: {
          'test-dept': {
            name: 'test-dept',
            displayName: 'Test',
            description: 'A test department',
            created: '2026-01-01T00:00:00.000Z',
            status: 'active',
            version: '1.0.0',
            agents: [],
            workflows: [],
            integrations: [],
            responsibilities: []
          }
        },
        metadata: { totalDepartments: 1, lastUpdated: '2026-01-01T00:00:00.000Z' }
      },
      agents: { agents: {}, metadata: { totalAgents: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } },
      workflows: { workflows: {}, metadata: { totalWorkflows: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } }
    };

    await registry.import(sourceData);

    // Mutate the source — should NOT affect the registry
    sourceData.departments.departments['test-dept'].displayName = 'MUTATED';
    sourceData.departments.departments['injected'] = { name: 'injected' };

    const dept = registry.getDepartment('test-dept');
    assertEquals(dept.displayName, 'Test', 'Source mutation should not affect registry');
    assertEquals(registry.getDepartment('injected'), null, 'Injected key should not appear');
  });

  await testAsync('import() deep copies agents — source mutation does not affect registry', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    const sourceData = {
      departments: { departments: {}, metadata: { totalDepartments: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } },
      agents: {
        agents: {
          'test-agent': {
            name: 'test-agent',
            displayName: 'Test Agent',
            department: 'some-dept',
            type: 'specialist',
            description: 'A test',
            tools: ['Read'],
            model: 'sonnet',
            script: null,
            created: '2026-01-01T00:00:00.000Z',
            version: '1.0.0',
            usedInWorkflows: []
          }
        },
        metadata: { totalAgents: 1, lastUpdated: '2026-01-01T00:00:00.000Z' }
      },
      workflows: { workflows: {}, metadata: { totalWorkflows: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } }
    };

    await registry.import(sourceData);

    // Mutate the source
    sourceData.agents.agents['test-agent'].tools.push('INJECTED');

    const agent = registry.getAgent('test-agent');
    assertEquals(agent.tools.length, 1, 'Source mutation should not add tools');
    assertEquals(agent.tools[0], 'Read', 'Original tool preserved');
  });

  await testAsync('import() deep copies workflows — source mutation does not affect registry', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    const sourceData = {
      departments: { departments: {}, metadata: { totalDepartments: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } },
      agents: { agents: {}, metadata: { totalAgents: 0, lastUpdated: '2026-01-01T00:00:00.000Z' } },
      workflows: {
        workflows: {
          'dept-wf': {
            name: 'wf',
            displayName: 'WF',
            department: 'dept',
            description: 'A workflow',
            agents: ['a', 'b'],
            trigger: { type: 'manual', enabled: true },
            output: { type: 'console', destination: null },
            created: '2026-01-01T00:00:00.000Z',
            version: '1.0.0'
          }
        },
        metadata: { totalWorkflows: 1, lastUpdated: '2026-01-01T00:00:00.000Z' }
      }
    };

    await registry.import(sourceData);

    // Mutate the source
    sourceData.workflows.workflows['dept-wf'].agents.push('INJECTED');
    sourceData.workflows.workflows['dept-wf'].description = 'MUTATED';

    const wf = registry.getWorkflow('dept', 'wf');
    assertEquals(wf.agents.length, 2, 'Source mutation should not add agents');
    assertEquals(wf.description, 'A workflow', 'Description should not be mutated');
  });

  // ============================================
  // getStatistics() dynamic trigger type counting
  // ============================================
  console.log('\n  getStatistics() dynamic trigger type counting');

  await testAsync('getStatistics() counts event trigger type', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'Test department' });
    await registry.addWorkflow({
      name: 'event-wf',
      displayName: 'Event WF',
      department: 'test-dept',
      description: 'Event-triggered workflow',
      trigger: { type: 'event', event: 'new-hire', enabled: true }
    });

    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.byType.event, 1, 'Should count event trigger type');
    assertEquals(stats.workflows.byType.manual, undefined, 'No manual workflows');
  });

  await testAsync('getStatistics() counts multiple trigger types dynamically', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    await registry.addDepartment({ name: 'multi-dept', displayName: 'Multi', description: 'Multiple triggers' });
    await registry.addWorkflow({
      name: 'manual-wf', displayName: 'Manual', department: 'multi-dept',
      description: 'Manual workflow', trigger: { type: 'manual' }
    });
    await registry.addWorkflow({
      name: 'scheduled-wf', displayName: 'Scheduled', department: 'multi-dept',
      description: 'Scheduled workflow', trigger: { type: 'scheduled', schedule: 'daily 9:00' }
    });
    await registry.addWorkflow({
      name: 'webhook-wf', displayName: 'Webhook', department: 'multi-dept',
      description: 'Webhook workflow', trigger: { type: 'webhook', url: '/hooks/deploy' }
    });
    await registry.addWorkflow({
      name: 'cron-wf', displayName: 'Cron', department: 'multi-dept',
      description: 'Cron workflow', trigger: { type: 'cron', expression: '0 */6 * * *' }
    });

    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.total, 4, 'Total workflows');
    assertEquals(stats.workflows.byType.manual, 1, 'One manual');
    assertEquals(stats.workflows.byType.scheduled, 1, 'One scheduled');
    assertEquals(stats.workflows.byType.webhook, 1, 'One webhook');
    assertEquals(stats.workflows.byType.cron, 1, 'One cron');
  });

  await testAsync('getStatistics() counts workflows with missing trigger as unknown', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    await registry.addDepartment({ name: 'no-trig', displayName: 'No Trig', description: 'No trigger test' });

    // Import a workflow with null trigger to simulate corrupted data
    await registry.import({
      departments: registry.departments,
      agents: registry.agents,
      workflows: {
        workflows: {
          'no-trig-wf': {
            name: 'wf', displayName: 'WF', department: 'no-trig',
            description: 'No trigger', agents: [], trigger: null,
            created: '2026-01-01T00:00:00.000Z', version: '1.0.0'
          }
        },
        metadata: { totalWorkflows: 1, lastUpdated: '2026-01-01T00:00:00.000Z' }
      }
    });

    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.byType.unknown, 1, 'Null trigger counted as unknown');
  });

  await testAsync('getStatistics() returns empty byType when no workflows exist', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();

    await registry.addDepartment({ name: 'empty-dept', displayName: 'Empty', description: 'No workflows' });

    const stats = await registry.getStatistics();
    assertEquals(stats.workflows.total, 0, 'No workflows');
    assertDeepEquals(stats.workflows.byType, {}, 'Empty byType object');
  });

  // ============================================
  // TypeScript definitions
  // ============================================
  console.log('\n  TypeScript definitions');

  test('index.d.ts TriggerType includes event and webhook', () => {
    const dts = fs.readFileSync(path.join(__dirname, '..', 'index.d.ts'), 'utf8');
    assert(dts.includes("'event'"), 'TriggerType should include event');
    assert(dts.includes("'webhook'"), 'TriggerType should include webhook');
    assert(dts.includes("'cron'"), 'TriggerType should include cron');
    assert(dts.includes('(string & {})'), 'TriggerType should allow arbitrary strings');
  });

  // ============================================
  // import/export roundtrip with mutation safety
  // ============================================
  console.log('\n  import/export roundtrip mutation safety');

  await testAsync('export then import roundtrip preserves data and both are mutation-safe', async () => {
    const registry1 = new RegistryManager(tmpDir);
    await registry1.load();
    await registry1.reset();

    await registry1.addDepartment({ name: 'roundtrip', displayName: 'Roundtrip', description: 'Test' });
    await registry1.addAgent({
      name: 'rt-agent', displayName: 'RT Agent', department: 'roundtrip',
      type: 'specialist', description: 'Roundtrip test agent'
    });

    const exported = await registry1.export();

    // Mutate export — should not affect registry1
    exported.departments.departments.roundtrip.displayName = 'MUTATED-EXPORT';

    const dept1 = registry1.getDepartment('roundtrip');
    assertEquals(dept1.displayName, 'Roundtrip', 'Export mutation should not affect source registry');

    // Import into registry2
    const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-0330b-'));
    const registry2 = new RegistryManager(tmpDir2);
    await registry2.load();
    await registry2.import(exported);

    // Mutate exported again — should not affect registry2
    exported.agents.agents['rt-agent'].description = 'MUTATED-AGAIN';

    const agent2 = registry2.getAgent('rt-agent');
    assertEquals(agent2.description, 'Roundtrip test agent', 'Post-import mutation should not affect target registry');

    // Cleanup
    fs.rmSync(tmpDir2, { recursive: true, force: true });
  });

  // ============================================
  // onboarding-automation example validation
  // ============================================
  console.log('\n  onboarding-automation example validation');

  const exampleDir = path.join(__dirname, '..', 'examples', 'onboarding-automation');

  test('onboarding-automation directory exists', () => {
    assert(fs.existsSync(exampleDir), 'Example directory should exist');
  });

  test('onboarding-automation has agents directory with 4 agents', () => {
    const agentsDir = path.join(exampleDir, 'agents');
    assert(fs.existsSync(agentsDir), 'agents/ directory should exist');
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    assertEquals(agents.length, 4, 'Should have 4 agent files');
  });

  test('onboarding-automation agents have valid frontmatter', () => {
    const agentsDir = path.join(exampleDir, 'agents');
    const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    agents.forEach(file => {
      const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
      assert(content.startsWith('---'), `${file} should start with frontmatter`);
      assert(content.includes('name:'), `${file} should have name field`);
      assert(content.includes('description:'), `${file} should have description field`);
      assert(content.includes('tools:'), `${file} should have tools field`);
      assert(content.includes('model:'), `${file} should have model field`);
    });
  });

  test('onboarding-automation has workflow config', () => {
    const wfPath = path.join(exampleDir, 'workflows', 'new-hire-onboarding.json');
    assert(fs.existsSync(wfPath), 'Workflow config should exist');

    const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    assertEquals(wf.name, 'new-hire-onboarding', 'Workflow name');
    assertEquals(wf.department, 'onboarding', 'Workflow department');
    assertEquals(wf.steps.length, 3, 'Should have 3 steps');
    assertEquals(wf.steps[0].parallel, true, 'First step is parallel');
    assertEquals(wf.steps[0].agents.length, 2, 'First step has 2 agents');
    assertEquals(wf.trigger.type, 'event', 'Trigger type is event');
  });

  test('onboarding-automation has utility module', () => {
    const utilPath = path.join(exampleDir, 'onboarding-checklist.js');
    assert(fs.existsSync(utilPath), 'Utility module should exist');
  });

  // ============================================
  // onboarding-checklist.js module tests
  // ============================================
  console.log('\n  onboarding-checklist.js module tests');

  const {
    REQUIRED_DOCUMENTS,
    STANDARD_ACCOUNTS,
    createChecklist,
    parseDate,
    updateDocumentStatus,
    updateAccountStatus,
    calculateCompletion,
    getPendingSummary
  } = require(path.join(exampleDir, 'onboarding-checklist.js'));

  test('REQUIRED_DOCUMENTS has expected entries', () => {
    assert(Array.isArray(REQUIRED_DOCUMENTS), 'Should be an array');
    assert(REQUIRED_DOCUMENTS.length >= 8, 'Should have at least 8 documents');
    assert(REQUIRED_DOCUMENTS.every(d => d.id && d.name && d.category), 'Each should have id, name, category');
  });

  test('STANDARD_ACCOUNTS has expected entries', () => {
    assert(Array.isArray(STANDARD_ACCOUNTS), 'Should be an array');
    assert(STANDARD_ACCOUNTS.length >= 5, 'Should have at least 5 accounts');
    assert(STANDARD_ACCOUNTS.every(a => a.id && a.name && a.priority), 'Each should have id, name, priority');
  });

  test('createChecklist creates valid checklist', () => {
    const cl = createChecklist({ name: 'Jane Doe', role: 'Engineer', department: 'Engineering', startDate: '2026-04-01' });
    assertEquals(cl.employee.name, 'Jane Doe', 'Employee name');
    assertEquals(cl.employee.role, 'Engineer', 'Employee role');
    assertEquals(cl.employee.department, 'Engineering', 'Employee department');
    assertEquals(cl.employee.startDate, '2026-04-01', 'Start date');
    assertEquals(cl.documents.length, REQUIRED_DOCUMENTS.length, 'All documents included');
    assertEquals(cl.accounts.length, STANDARD_ACCOUNTS.length, 'All accounts included');
    assertEquals(cl.completionPct, 0, 'Starts at 0%');
  });

  test('createChecklist defaults department to unassigned', () => {
    const cl = createChecklist({ name: 'John', role: 'Intern' });
    assertEquals(cl.employee.department, 'unassigned', 'Default department');
  });

  test('createChecklist throws on null input', () => {
    assert.throws(() => createChecklist(null), /non-null object/);
  });

  test('createChecklist throws on missing name', () => {
    assert.throws(() => createChecklist({ role: 'Engineer' }), /name is required/);
  });

  test('createChecklist throws on missing role', () => {
    assert.throws(() => createChecklist({ name: 'John' }), /role is required/);
  });

  test('parseDate parses ISO string', () => {
    const d = parseDate('2026-04-01T00:00:00.000Z');
    assertEquals(d.getFullYear(), 2026, 'Year');
    assertEquals(d.getMonth(), 3, 'Month (0-indexed)');
    assertEquals(d.getDate(), 1, 'Day');
  });

  test('parseDate parses YYYY-MM-DD', () => {
    const d = parseDate('2026-06-15');
    assertEquals(d.getFullYear(), 2026, 'Year');
  });

  test('parseDate returns current date for null', () => {
    const d = parseDate(null);
    const now = new Date();
    assertEquals(d.getFullYear(), now.getFullYear(), 'Current year');
  });

  test('parseDate throws on non-string', () => {
    assert.throws(() => parseDate(12345), /must be a string/);
  });

  test('parseDate throws on unparseable string', () => {
    assert.throws(() => parseDate('not-a-date'), /Cannot parse date/);
  });

  test('updateDocumentStatus updates correctly', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    updateDocumentStatus(cl, 'contract', 'submitted');
    const doc = cl.documents.find(d => d.id === 'contract');
    assertEquals(doc.status, 'submitted', 'Status updated');
  });

  test('updateDocumentStatus throws on invalid status', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    assert.throws(() => updateDocumentStatus(cl, 'contract', 'invalid'), /Invalid status/);
  });

  test('updateDocumentStatus throws on unknown document', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    assert.throws(() => updateDocumentStatus(cl, 'nonexistent', 'approved'), /not found/);
  });

  test('updateAccountStatus updates correctly', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    updateAccountStatus(cl, 'email', 'provisioned', { user: 'test@company.com' });
    const acct = cl.accounts.find(a => a.id === 'email');
    assertEquals(acct.status, 'provisioned', 'Status updated');
    assertEquals(acct.credentials.user, 'test@company.com', 'Credentials stored');
  });

  test('updateAccountStatus throws on invalid status', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    assert.throws(() => updateAccountStatus(cl, 'email', 'invalid'), /Invalid status/);
  });

  test('updateAccountStatus throws on unknown account', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    assert.throws(() => updateAccountStatus(cl, 'nonexistent', 'provisioned'), /not found/);
  });

  test('calculateCompletion returns 0 for fresh checklist', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    assertEquals(calculateCompletion(cl), 0, 'Fresh checklist is 0%');
  });

  test('calculateCompletion returns correct percentage', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    // Approve all documents
    cl.documents.forEach(d => { d.status = 'approved'; });
    const expected = Math.round((cl.documents.length / (cl.documents.length + cl.accounts.length)) * 100);
    assertEquals(calculateCompletion(cl), expected, 'Partial completion');
  });

  test('calculateCompletion returns 100 when everything done', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    cl.documents.forEach(d => { d.status = 'approved'; });
    cl.accounts.forEach(a => { a.status = 'provisioned'; });
    assertEquals(calculateCompletion(cl), 100, 'Fully complete');
  });

  test('getPendingSummary returns all items for fresh checklist', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    const summary = getPendingSummary(cl);
    assertEquals(summary.pendingDocs.length, cl.documents.length, 'All docs pending');
    assertEquals(summary.pendingAccounts.length, cl.accounts.length, 'All accounts pending');
    assert(summary.blockers.length > 0, 'Should have blockers (legal docs + critical accounts)');
  });

  test('getPendingSummary blockers include legal docs and critical accounts', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    const summary = getPendingSummary(cl);
    const docBlockers = summary.blockers.filter(b => b.type === 'document');
    const acctBlockers = summary.blockers.filter(b => b.type === 'account');
    assert(docBlockers.length > 0, 'Legal docs are blockers');
    assert(acctBlockers.length > 0, 'Critical accounts are blockers');
  });

  test('getPendingSummary updates after completion', () => {
    const cl = createChecklist({ name: 'Test', role: 'Dev' });
    cl.documents.forEach(d => { d.status = 'approved'; });
    cl.accounts.forEach(a => { a.status = 'provisioned'; });
    cl.completionPct = calculateCompletion(cl);
    const summary = getPendingSummary(cl);
    assertEquals(summary.pendingDocs.length, 0, 'No pending docs');
    assertEquals(summary.pendingAccounts.length, 0, 'No pending accounts');
    assertEquals(summary.blockers.length, 0, 'No blockers');
    assertEquals(summary.completionPct, 100, '100% complete');
  });

  // Cleanup
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  // Report (format expected by run-all.js test runner)
  console.log(`\nTotal: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.error('\n  Failures:');
    failures.forEach(f => console.error(`    - ${f.name}: ${f.error}`));
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
