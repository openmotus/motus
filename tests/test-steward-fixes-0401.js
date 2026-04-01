/**
 * Steward Fixes — 2026-04-01
 *
 * Tests for:
 * 1. getDepartmentSummary() dynamic trigger counting (was hardcoded to manual/scheduled)
 * 2. validate() agent type validity checks
 * 3. validate() usedInWorkflows consistency checks
 * 4. validate() reverse workflow-agent consistency
 * 5. notification-router example validation
 * 6. alert-router.js module tests (parseAlert, classifySeverity, resolveChannels, formatForChannel, buildDispatchPlan)
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-0401-'));

  // ============================================
  // getDepartmentSummary() dynamic trigger counting
  // ============================================

  await testAsync('getDepartmentSummary counts event triggers dynamically', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'Test department' });
    await registry.addAgent({ name: 'test-agent', displayName: 'Test Agent', department: 'test-dept', type: 'specialist', description: 'Test' });

    // Add workflows with different trigger types
    await registry.addWorkflow({ name: 'wf-manual', displayName: 'Manual', department: 'test-dept', description: 'Manual', trigger: { type: 'manual' } });
    await registry.addWorkflow({ name: 'wf-event', displayName: 'Event', department: 'test-dept', description: 'Event', trigger: { type: 'event' } });
    await registry.addWorkflow({ name: 'wf-cron', displayName: 'Cron', department: 'test-dept', description: 'Cron', trigger: { type: 'cron' } });
    await registry.addWorkflow({ name: 'wf-webhook', displayName: 'Webhook', department: 'test-dept', description: 'Webhook', trigger: { type: 'webhook' } });

    const summary = await registry.getDepartmentSummary('test-dept');

    assertEquals(summary.workflowsByTrigger.manual, 1, 'manual count');
    assertEquals(summary.workflowsByTrigger.event, 1, 'event count');
    assertEquals(summary.workflowsByTrigger.cron, 1, 'cron count');
    assertEquals(summary.workflowsByTrigger.webhook, 1, 'webhook count');
  });

  await testAsync('getDepartmentSummary counts custom trigger types', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'custom-dept', displayName: 'Custom', description: 'Custom triggers' });
    await registry.addWorkflow({ name: 'wf-custom', displayName: 'Custom', department: 'custom-dept', description: 'Custom', trigger: { type: 'github-pr' } });
    await registry.addWorkflow({ name: 'wf-custom2', displayName: 'Custom2', department: 'custom-dept', description: 'Custom2', trigger: { type: 'github-pr' } });

    const summary = await registry.getDepartmentSummary('custom-dept');
    assertEquals(summary.workflowsByTrigger['github-pr'], 2, 'custom trigger count');
  });

  await testAsync('getDepartmentSummary handles missing triggers as unknown', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'no-trig', displayName: 'No Trigger', description: 'Missing triggers' });
    await registry.addWorkflow({ name: 'wf-notrig', displayName: 'No Trigger', department: 'no-trig', description: 'Missing' });

    // Manually corrupt the trigger to null to simulate imported data
    const wfId = 'no-trig-wf-notrig';
    registry.workflows.workflows[wfId].trigger = null;

    const summary = await registry.getDepartmentSummary('no-trig');
    assertEquals(summary.workflowsByTrigger.unknown, 1, 'unknown trigger count');
  });

  await testAsync('getDepartmentSummary returns empty trigger map for department with no workflows', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'empty-dept', displayName: 'Empty', description: 'No workflows' });

    const summary = await registry.getDepartmentSummary('empty-dept');
    assertDeepEquals(summary.workflowsByTrigger, {}, 'empty trigger map');
  });

  // ============================================
  // validate() agent type validity
  // ============================================

  await testAsync('validate detects invalid agent type', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'val-dept', displayName: 'Val', description: 'Validation' });
    await registry.addAgent({ name: 'good-agent', displayName: 'Good', department: 'val-dept', type: 'specialist', description: 'Valid' });

    // Manually corrupt agent type to simulate imported data
    registry.agents.agents['good-agent'].type = 'invalid-type';

    const result = await registry.validate();
    assertEquals(result.valid, false, 'should be invalid');
    assert.ok(result.errors.some(e => e.includes('invalid type') && e.includes('invalid-type')), 'should mention invalid type');
  });

  await testAsync('validate accepts all three valid agent types', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'types-dept', displayName: 'Types', description: 'Test types' });
    await registry.addAgent({ name: 'fetcher-one', displayName: 'Fetcher', department: 'types-dept', type: 'data-fetcher', description: 'Fetches' });
    await registry.addAgent({ name: 'orch-one', displayName: 'Orch', department: 'types-dept', type: 'orchestrator', description: 'Orchestrates' });
    await registry.addAgent({ name: 'spec-one', displayName: 'Spec', department: 'types-dept', type: 'specialist', description: 'Specializes' });

    const result = await registry.validate();
    const typeErrors = result.errors.filter(e => e.includes('invalid type'));
    assertEquals(typeErrors.length, 0, 'no type errors for valid types');
  });

  // ============================================
  // validate() usedInWorkflows consistency
  // ============================================

  await testAsync('validate detects stale usedInWorkflows reference', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'stale-dept', displayName: 'Stale', description: 'Stale refs' });
    await registry.addAgent({ name: 'stale-agent', displayName: 'Stale', department: 'stale-dept', type: 'specialist', description: 'Has stale ref' });

    // Manually inject a stale usedInWorkflows reference
    registry.agents.agents['stale-agent'].usedInWorkflows = ['stale-dept-nonexistent-workflow'];

    const result = await registry.validate();
    assertEquals(result.valid, false, 'should be invalid');
    assert.ok(result.errors.some(e => e.includes('stale usedInWorkflows')), 'should mention stale reference');
  });

  await testAsync('validate passes when usedInWorkflows references exist', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'valid-dept', displayName: 'Valid', description: 'Valid refs' });
    await registry.addAgent({ name: 'valid-agent', displayName: 'Valid', department: 'valid-dept', type: 'specialist', description: 'Valid' });
    await registry.addWorkflow({ name: 'valid-wf', displayName: 'Valid WF', department: 'valid-dept', description: 'Valid', agents: ['valid-agent'] });

    const result = await registry.validate();
    const staleErrors = result.errors.filter(e => e.includes('stale usedInWorkflows'));
    assertEquals(staleErrors.length, 0, 'no stale reference errors');
  });

  // ============================================
  // validate() reverse workflow-agent consistency
  // ============================================

  await testAsync('validate detects workflow listing agent that does not have reciprocal usedInWorkflows', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'rev-dept', displayName: 'Reverse', description: 'Reverse check' });
    await registry.addAgent({ name: 'rev-agent', displayName: 'Reverse', department: 'rev-dept', type: 'specialist', description: 'Rev' });
    await registry.addWorkflow({ name: 'rev-wf', displayName: 'Reverse WF', department: 'rev-dept', description: 'Rev', agents: ['rev-agent'] });

    // Manually clear the agent's usedInWorkflows to simulate desync
    registry.agents.agents['rev-agent'].usedInWorkflows = [];

    const result = await registry.validate();
    assertEquals(result.valid, false, 'should be invalid');
    assert.ok(result.errors.some(e => e.includes('usedInWorkflows does not include')), 'should mention missing reverse reference');
  });

  await testAsync('validate passes with consistent bidirectional references', async () => {
    const registry = new RegistryManager(tmpDir);
    await registry.load();
    await registry.reset();
    await registry.addDepartment({ name: 'bi-dept', displayName: 'Bidir', description: 'Bidirectional' });
    await registry.addAgent({ name: 'bi-agent', displayName: 'Bidir', department: 'bi-dept', type: 'specialist', description: 'Bidir' });
    await registry.addWorkflow({ name: 'bi-wf', displayName: 'Bidir WF', department: 'bi-dept', description: 'Bidir', agents: ['bi-agent'] });

    const result = await registry.validate();
    const reverseErrors = result.errors.filter(e => e.includes('usedInWorkflows does not include'));
    assertEquals(reverseErrors.length, 0, 'no reverse consistency errors');
  });

  // ============================================
  // notification-router example validation
  // ============================================

  const exampleDir = path.join(__dirname, '..', 'examples', 'notification-router');

  test('notification-router example directory exists', () => {
    assert.ok(fs.existsSync(exampleDir), 'example dir exists');
  });

  test('notification-router has README.md', () => {
    assert.ok(fs.existsSync(path.join(exampleDir, 'README.md')), 'README exists');
  });

  test('notification-router has agents directory with 4 agents + utility', () => {
    const agentsDir = path.join(exampleDir, 'agents');
    assert.ok(fs.existsSync(agentsDir), 'agents dir exists');
    const files = fs.readdirSync(agentsDir);
    assert.ok(files.includes('alert-classifier.md'), 'has alert-classifier');
    assert.ok(files.includes('channel-resolver.md'), 'has channel-resolver');
    assert.ok(files.includes('message-formatter.md'), 'has message-formatter');
    assert.ok(files.includes('dispatch-sender.md'), 'has dispatch-sender');
    assert.ok(files.includes('alert-router.js'), 'has alert-router utility');
  });

  test('notification-router has workflow config', () => {
    const wfPath = path.join(exampleDir, 'workflows', 'route-alert.json');
    assert.ok(fs.existsSync(wfPath), 'workflow config exists');
    const wf = JSON.parse(fs.readFileSync(wfPath, 'utf8'));
    assertEquals(wf.name, 'route-alert', 'workflow name');
    assertEquals(wf.department, 'notification-router', 'workflow department');
    assert.ok(wf.steps.length === 4, 'has 4 steps');
    assertEquals(wf.trigger.type, 'event', 'event trigger');
  });

  test('notification-router agent files have valid frontmatter', () => {
    const agentsDir = path.join(exampleDir, 'agents');
    const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
    for (const file of agentFiles) {
      const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
      assert.ok(content.startsWith('---'), `${file} starts with frontmatter`);
      assert.ok(content.includes('name:'), `${file} has name`);
      assert.ok(content.includes('description:'), `${file} has description`);
    }
  });

  // ============================================
  // alert-router.js module tests
  // ============================================

  const { parseAlert, classifySeverity, resolveChannels, formatForChannel, buildDispatchPlan, SEVERITY_LEVELS, CHANNEL_FORMATS } = require('../examples/notification-router/agents/alert-router');

  // parseAlert tests
  test('parseAlert parses object payload', () => {
    const result = parseAlert({ title: 'CPU High', source: 'datadog', message: 'CPU at 95%' });
    assertEquals(result.title, 'CPU High', 'title');
    assertEquals(result.source, 'datadog', 'source');
    assertEquals(result.message, 'CPU at 95%', 'message');
  });

  test('parseAlert parses JSON string payload', () => {
    const result = parseAlert(JSON.stringify({ title: 'Memory Low', source: 'cloudwatch' }));
    assertEquals(result.title, 'Memory Low', 'title');
    assertEquals(result.source, 'cloudwatch', 'source');
  });

  test('parseAlert treats plain text as simple alert', () => {
    const result = parseAlert('Server is down');
    assertEquals(result.title, 'Server is down', 'title');
    assertEquals(result.message, 'Server is down', 'message');
  });

  test('parseAlert throws on null', () => {
    try { parseAlert(null); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('required')); }
  });

  test('parseAlert throws on number', () => {
    try { parseAlert(42); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('Invalid')); }
  });

  test('parseAlert uses fallback field names', () => {
    const result = parseAlert({ subject: 'Alert Subject', origin: 'pagerduty', body: 'Alert body' });
    assertEquals(result.title, 'Alert Subject', 'subject → title');
    assertEquals(result.source, 'pagerduty', 'origin → source');
    assertEquals(result.message, 'Alert body', 'body → message');
  });

  test('parseAlert defaults to Untitled Alert', () => {
    const result = parseAlert({});
    assertEquals(result.title, 'Untitled Alert', 'default title');
    assertEquals(result.source, 'unknown', 'default source');
  });

  // classifySeverity tests
  test('classifySeverity returns existing valid severity', () => {
    const result = classifySeverity({ severity: 'critical', title: '', message: '' });
    assertEquals(result.severity, 'critical', 'uses existing severity');
    assertEquals(result.matchedKeywords.length, 0, 'no keywords matched');
  });

  test('classifySeverity classifies by keywords', () => {
    const result = classifySeverity({ title: 'Server is down', message: 'Production outage detected' });
    assertEquals(result.severity, 'critical', 'should be critical');
    assert.ok(result.matchedKeywords.includes('down'), 'matched "down"');
    assert.ok(result.matchedKeywords.includes('outage'), 'matched "outage"');
  });

  test('classifySeverity returns medium by default', () => {
    const result = classifySeverity({ title: 'Something happened', message: '' });
    assertEquals(result.severity, 'medium', 'default is medium');
  });

  test('classifySeverity detects info level', () => {
    const result = classifySeverity({ title: 'Issue resolved', message: 'Service recovered' });
    // info keywords: resolved, recovered
    assertEquals(result.severity, 'info', 'should be info');
  });

  test('classifySeverity throws on null', () => {
    try { classifySeverity(null); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('required')); }
  });

  test('classifySeverity normalizes severity case', () => {
    const result = classifySeverity({ severity: 'HIGH', title: '', message: '' });
    assertEquals(result.severity, 'high', 'lowercased');
  });

  // resolveChannels tests
  test('resolveChannels matches severity rule', () => {
    const rules = [{ severity: 'critical', channels: [{ type: 'sms', target: '+1234' }, { type: 'slack', target: '#ops' }] }];
    const result = resolveChannels('critical', null, rules);
    assertEquals(result.channels.length, 2, 'two channels');
    assertEquals(result.matchedRules, 1, 'one rule matched');
  });

  test('resolveChannels matches wildcard severity', () => {
    const rules = [{ severity: '*', channels: [{ type: 'webhook', target: 'https://...' }] }];
    const result = resolveChannels('low', null, rules);
    assertEquals(result.channels.length, 1, 'wildcard matches');
  });

  test('resolveChannels matches category', () => {
    const rules = [{ severity: 'high', category: 'security', channels: [{ type: 'email', target: 'sec@x.com' }] }];
    const result = resolveChannels('high', 'security', rules);
    assertEquals(result.channels.length, 1, 'category match');
  });

  test('resolveChannels deduplicates channels', () => {
    const rules = [
      { severity: 'critical', channels: [{ type: 'slack', target: '#ops' }] },
      { severity: '*', channels: [{ type: 'slack', target: '#ops' }] }
    ];
    const result = resolveChannels('critical', null, rules);
    assertEquals(result.channels.length, 1, 'deduplicated');
    assertEquals(result.matchedRules, 2, 'both rules matched');
  });

  test('resolveChannels returns empty for non-matching severity', () => {
    const rules = [{ severity: 'critical', channels: [{ type: 'sms', target: '+1234' }] }];
    const result = resolveChannels('info', null, rules);
    assertEquals(result.channels.length, 0, 'no match');
  });

  test('resolveChannels throws on non-array rules', () => {
    try { resolveChannels('critical', null, 'not-array'); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('array')); }
  });

  test('resolveChannels handles null severity', () => {
    const rules = [{ severity: 'critical', channels: [{ type: 'sms' }] }];
    const result = resolveChannels(null, null, rules);
    assertEquals(result.channels.length, 0, 'null severity returns nothing');
  });

  test('resolveChannels skips null rules in array', () => {
    const rules = [null, { severity: '*', channels: [{ type: 'slack', target: '#gen' }] }];
    const result = resolveChannels('high', null, rules);
    assertEquals(result.channels.length, 1, 'skips null rules');
  });

  // formatForChannel tests
  test('formatForChannel formats slack with emoji', () => {
    const result = formatForChannel({ title: 'Test', severity: 'critical', source: 'test', message: 'body', timestamp: '2026-01-01' }, 'slack');
    assert.ok(result.formatted.includes(':rotating_light:'), 'has critical emoji');
    assert.ok(result.formatted.includes('*CRITICAL*'), 'has severity');
  });

  test('formatForChannel formats email with subject', () => {
    const result = formatForChannel({ title: 'Test', severity: 'high', source: 'test' }, 'email');
    assertEquals(result.formatted.subject, '[HIGH] Test', 'email subject');
    assert.ok(result.formatted.body.includes('<h2>Test</h2>'), 'has HTML body');
  });

  test('formatForChannel truncates SMS to 160 chars', () => {
    const longTitle = 'A'.repeat(200);
    const result = formatForChannel({ title: longTitle, severity: 'low' }, 'sms');
    assert.ok(result.formatted.length <= 160, 'SMS within limit');
    assertEquals(result.truncated, true, 'marked as truncated');
  });

  test('formatForChannel returns JSON for webhook', () => {
    const result = formatForChannel({ title: 'Test', severity: 'medium', source: 'x', message: 'msg', timestamp: 'ts' }, 'webhook');
    assertEquals(result.formatted.severity, 'medium', 'webhook severity');
    assertEquals(result.formatted.title, 'Test', 'webhook title');
  });

  test('formatForChannel returns JSON for unknown channel', () => {
    const result = formatForChannel({ title: 'Test' }, 'telegram');
    assert.ok(typeof result.formatted === 'string', 'stringified for unknown');
  });

  test('formatForChannel throws on null alert', () => {
    try { formatForChannel(null, 'slack'); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('required')); }
  });

  test('formatForChannel throws on null channel', () => {
    try { formatForChannel({ title: 'x' }, null); assert.fail('should throw'); } catch (e) { assert.ok(e.message.includes('required')); }
  });

  test('formatForChannel uses correct emoji for each severity', () => {
    const emojis = {
      critical: ':rotating_light:',
      high: ':warning:',
      medium: ':large_yellow_circle:',
      low: ':information_source:',
      info: ':white_check_mark:'
    };
    for (const [sev, emoji] of Object.entries(emojis)) {
      const result = formatForChannel({ title: 'T', severity: sev, source: 's', message: '', timestamp: 't' }, 'slack');
      assert.ok(result.formatted.includes(emoji), `${sev} has ${emoji}`);
    }
  });

  // buildDispatchPlan tests
  test('buildDispatchPlan builds complete plan', () => {
    const rules = [{ severity: '*', channels: [{ type: 'slack', target: '#alerts' }] }];
    const plan = buildDispatchPlan({ title: 'Disk Full', message: 'Server crash imminent' }, rules);
    assertEquals(plan.alert.title, 'Disk Full', 'alert title');
    assert.ok(plan.classification.severity, 'has severity');
    assert.ok(plan.channels.length > 0, 'has channels');
    assert.ok(plan.messages.length > 0, 'has messages');
    assertEquals(plan.messages[0].channel, 'slack', 'slack message');
  });

  test('buildDispatchPlan with no matching rules yields empty messages', () => {
    const rules = [{ severity: 'critical', channels: [{ type: 'sms', target: '+1' }] }];
    const plan = buildDispatchPlan({ title: 'Minor notice', severity: 'info' }, rules);
    assertEquals(plan.messages.length, 0, 'no messages for non-matching');
  });

  // SEVERITY_LEVELS and CHANNEL_FORMATS exports
  test('SEVERITY_LEVELS has 5 levels in order', () => {
    assertEquals(SEVERITY_LEVELS.length, 5, '5 levels');
    assertEquals(SEVERITY_LEVELS[0], 'critical', 'critical first');
    assertEquals(SEVERITY_LEVELS[4], 'info', 'info last');
  });

  test('CHANNEL_FORMATS has 4 channel types', () => {
    assert.ok(CHANNEL_FORMATS.slack, 'has slack');
    assert.ok(CHANNEL_FORMATS.email, 'has email');
    assert.ok(CHANNEL_FORMATS.sms, 'has sms');
    assert.ok(CHANNEL_FORMATS.webhook, 'has webhook');
    assertEquals(CHANNEL_FORMATS.sms.maxLength, 160, 'SMS limit is 160');
  });

  // ============================================
  // Report
  // ============================================

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nTotal: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failures.length > 0) {
    console.log('  Failures:');
    failures.forEach(f => console.log(`    - ${f.name}: ${f.error}`));
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
