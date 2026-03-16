#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-16
 *
 * Tests for:
 * - search() null/undefined safety (registry-manager.js)
 * - import() structure validation (registry-manager.js)
 * - suggestTools() mutation prevention (validator.js)
 * - detectAgentType() non-string safety (validator.js)
 * - meeting-notes example validation
 * - transcript-reader.js module tests
 */

const path = require('path');
const fs = require('fs');

const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples', 'meeting-notes');

// Simple test harness
const suite = {
  passed: 0,
  failed: 0,
  assert(condition, name) {
    if (condition) {
      console.log(`\u2713 ${name}`);
      this.passed++;
    } else {
      console.log(`\u2717 FAIL: ${name}`);
      this.failed++;
    }
  },
  async assertThrows(fn, pattern, name) {
    try {
      await fn();
      console.log(`\u2717 FAIL: ${name} (no error thrown)`);
      this.failed++;
    } catch (e) {
      if (pattern && !pattern.test(e.message)) {
        console.log(`\u2717 FAIL: ${name} (wrong error: ${e.message})`);
        this.failed++;
      } else {
        console.log(`\u2713 ${name}`);
        this.passed++;
      }
    }
  }
};

async function runTests() {
  console.log('Steward Fixes — 2026-03-16\n');

  // ============================================================
  // search() null safety
  // ============================================================
  console.log('search(): null/undefined safety\n');

  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'motus-test-0316-'));
  const registry = new RegistryManager(tmpDir);
  await registry.load();

  // Add some data to search against
  await registry.addDepartment({ name: 'test-dept', displayName: 'Test', description: 'A test department for validation' });
  await registry.addAgent({ name: 'test-fetcher', displayName: 'Test Fetcher', department: 'test-dept', type: 'data-fetcher', description: 'Fetches test data from APIs' });

  const nullResult = await registry.search(null);
  suite.assert(nullResult.departments.length === 0, 'search(null) returns empty departments');
  suite.assert(nullResult.agents.length === 0, 'search(null) returns empty agents');
  suite.assert(nullResult.workflows.length === 0, 'search(null) returns empty workflows');

  const undefinedResult = await registry.search(undefined);
  suite.assert(undefinedResult.departments.length === 0, 'search(undefined) returns empty departments');
  suite.assert(undefinedResult.agents.length === 0, 'search(undefined) returns empty agents');

  const numberResult = await registry.search(42);
  suite.assert(numberResult.departments.length === 0, 'search(42) returns empty results for non-string');

  const boolResult = await registry.search(true);
  suite.assert(boolResult.departments.length === 0, 'search(true) returns empty results for boolean');

  // Empty string should still work (matches everything)
  const emptyResult = await registry.search('');
  suite.assert(emptyResult.departments.length > 0, 'search("") still returns all departments');
  suite.assert(emptyResult.agents.length > 0, 'search("") still returns all agents');

  // Normal search still works
  const normalResult = await registry.search('test');
  suite.assert(normalResult.departments.length > 0, 'search("test") still works normally');

  // ============================================================
  // import() structure validation
  // ============================================================
  console.log('\nimport(): structure validation\n');

  const importRegistry = new RegistryManager(tmpDir);
  await importRegistry.load();

  await suite.assertThrows(
    () => importRegistry.import({ departments: 'not an object' }),
    /Invalid departments data/,
    'import() rejects string departments'
  );

  await suite.assertThrows(
    () => importRegistry.import({ departments: { departments: {} } }),
    /Invalid departments data/,
    'import() rejects departments missing metadata'
  );

  await suite.assertThrows(
    () => importRegistry.import({ agents: null }),
    /Invalid agents data/,
    'import() rejects null agents'
  );

  await suite.assertThrows(
    () => importRegistry.import({ agents: { agents: {}, metadata: 'string' } }),
    /Invalid agents data/,
    'import() rejects agents with non-object metadata'
  );

  await suite.assertThrows(
    () => importRegistry.import({ workflows: { workflows: 123, metadata: {} } }),
    /Invalid workflows data/,
    'import() rejects workflows with non-object workflows'
  );

  await suite.assertThrows(
    () => importRegistry.import({ workflows: [] }),
    /Invalid workflows data/,
    'import() rejects array workflows'
  );

  // Valid import should still work
  const validImport = {
    departments: { departments: { eng: { name: 'eng', displayName: 'Eng', description: 'Engineering' } }, metadata: { totalDepartments: 1 } },
    agents: { agents: {}, metadata: { totalAgents: 0 } },
    workflows: { workflows: {}, metadata: { totalWorkflows: 0 } }
  };
  let importOk = false;
  try {
    await importRegistry.import(validImport);
    importOk = true;
  } catch (e) {
    // should not throw
  }
  suite.assert(importOk, 'import() accepts valid structure');
  suite.assert(importRegistry.getDepartment('eng') !== null, 'import() correctly sets department data');

  // Import with only some keys should work (partial import)
  const partialRegistry = new RegistryManager(tmpDir);
  await partialRegistry.load();
  let partialOk = false;
  try {
    await partialRegistry.import({ agents: { agents: { x: { name: 'x' } }, metadata: { totalAgents: 1 } } });
    partialOk = true;
  } catch (e) {
    // should not throw
  }
  suite.assert(partialOk, 'import() accepts partial data (agents only)');

  // ============================================================
  // suggestTools() mutation prevention
  // ============================================================
  console.log('\nsuggestTools(): mutation prevention\n');

  const validator = new Validator();

  // Call suggestTools multiple times with needsApi=true for the same type
  const first = validator.suggestTools('orchestrator', true);
  const second = validator.suggestTools('orchestrator', true);
  const third = validator.suggestTools('orchestrator', false);

  suite.assert(first.length === second.length, 'suggestTools() returns same length on repeated calls');
  suite.assert(first[0] === 'Bash', 'suggestTools(orchestrator, true) prepends Bash');
  suite.assert(second[0] === 'Bash', 'suggestTools(orchestrator, true) second call also has Bash first');
  suite.assert(second.filter(t => t === 'Bash').length === 1, 'suggestTools() does not accumulate duplicate Bash entries');
  suite.assert(third[0] === 'Task', 'suggestTools(orchestrator, false) returns original order without Bash');
  suite.assert(third.length === 3, 'suggestTools(orchestrator, false) returns original array length');

  // Specialist type mutation check
  const specApi1 = validator.suggestTools('specialist', true);
  const specApi2 = validator.suggestTools('specialist', true);
  const specNoApi = validator.suggestTools('specialist', false);
  suite.assert(specApi1.length === specApi2.length, 'suggestTools(specialist) no mutation across calls');
  suite.assert(specNoApi.length === 3, 'suggestTools(specialist, false) original length preserved');

  // Unknown type returns default
  const unknownTools = validator.suggestTools('unknown-type', true);
  suite.assert(unknownTools.includes('Read') && unknownTools.includes('Write'), 'suggestTools() falls back to [Read, Write] for unknown type');
  suite.assert(unknownTools[0] === 'Bash', 'suggestTools(unknown, true) prepends Bash to default');

  // ============================================================
  // detectAgentType() non-string safety
  // ============================================================
  console.log('\ndetectAgentType(): non-string safety\n');

  suite.assert(validator.detectAgentType(null) === null, 'detectAgentType(null) returns null');
  suite.assert(validator.detectAgentType(undefined) === null, 'detectAgentType(undefined) returns null');
  suite.assert(validator.detectAgentType(42) === null, 'detectAgentType(42) returns null');
  suite.assert(validator.detectAgentType(true) === null, 'detectAgentType(true) returns null');
  suite.assert(validator.detectAgentType({}) === null, 'detectAgentType({}) returns null');
  suite.assert(validator.detectAgentType([]) === null, 'detectAgentType([]) returns null');
  suite.assert(validator.detectAgentType('') === null, 'detectAgentType("") returns null (no keywords)');

  // Valid descriptions still work
  const fetchResult = validator.detectAgentType('Fetches data from API endpoints');
  suite.assert(fetchResult !== null && fetchResult.type === 'data-fetcher', 'detectAgentType() still works for valid "data-fetcher" description');

  const orchestrateResult = validator.detectAgentType('Coordinates multiple agents in a workflow');
  suite.assert(orchestrateResult !== null && orchestrateResult.type === 'orchestrator', 'detectAgentType() still works for valid "orchestrator" description');

  // ============================================================
  // meeting-notes example validation
  // ============================================================
  console.log('\nmeeting-notes example: file structure\n');

  suite.assert(fs.existsSync(path.join(EXAMPLES_DIR, 'README.md')), 'README.md exists');
  suite.assert(fs.existsSync(path.join(EXAMPLES_DIR, 'agents')), 'agents/ directory exists');
  suite.assert(fs.existsSync(path.join(EXAMPLES_DIR, 'workflows')), 'workflows/ directory exists');

  // Agent files
  const expectedAgents = ['transcript-reader.md', 'transcript-reader.js', 'action-extractor.md', 'decision-extractor.md', 'summary-writer.md', 'followup-drafter.md'];
  for (const file of expectedAgents) {
    suite.assert(fs.existsSync(path.join(EXAMPLES_DIR, 'agents', file)), `agents/${file} exists`);
  }

  // Workflow files
  suite.assert(fs.existsSync(path.join(EXAMPLES_DIR, 'workflows', 'post-meeting.json')), 'workflows/post-meeting.json exists');

  // Validate workflow JSON
  const workflow = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'workflows', 'post-meeting.json'), 'utf8'));
  suite.assert(workflow.name === 'post-meeting', 'workflow name is "post-meeting"');
  suite.assert(workflow.department === 'meeting-notes', 'workflow department is "meeting-notes"');
  suite.assert(workflow.steps.length === 3, 'workflow has 3 steps');
  suite.assert(workflow.steps[0].parallel === false, 'step 1 is sequential');
  suite.assert(workflow.steps[1].parallel === true, 'step 2 is parallel');
  suite.assert(workflow.steps[1].agents.length === 2, 'step 2 has 2 parallel agents');
  suite.assert(workflow.steps[2].parallel === false, 'step 3 is sequential');
  suite.assert(workflow.steps[2].agents.length === 2, 'step 3 has 2 agents');

  // Agent-workflow cross-reference
  const allWorkflowAgents = workflow.steps.flatMap(s => s.agents.map(a => a.name));
  suite.assert(allWorkflowAgents.includes('transcript-reader'), 'workflow references transcript-reader');
  suite.assert(allWorkflowAgents.includes('action-extractor'), 'workflow references action-extractor');
  suite.assert(allWorkflowAgents.includes('decision-extractor'), 'workflow references decision-extractor');
  suite.assert(allWorkflowAgents.includes('summary-writer'), 'workflow references summary-writer');
  suite.assert(allWorkflowAgents.includes('followup-drafter'), 'workflow references followup-drafter');

  // Check agent .md files have frontmatter
  for (const md of expectedAgents.filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(EXAMPLES_DIR, 'agents', md), 'utf8');
    suite.assert(content.startsWith('---\n'), `${md} has YAML frontmatter`);
    suite.assert(content.includes('name:'), `${md} has name field`);
    suite.assert(content.includes('description:'), `${md} has description field`);
    suite.assert(content.includes('tools:'), `${md} has tools field`);
  }

  // ============================================================
  // transcript-reader.js module tests
  // ============================================================
  console.log('\ntranscript-reader.js: module tests\n');

  const { detectFormat, parseLabeledTranscript, parseSrtTranscript, extractAttendees, estimateDuration, parseTranscript } = require(path.join(EXAMPLES_DIR, 'agents', 'transcript-reader.js'));

  // detectFormat
  suite.assert(detectFormat('Alice: Hello\nBob: Hi') === 'labeled', 'detectFormat() identifies labeled format');
  suite.assert(detectFormat('1\n00:00:01,000 --> 00:00:04,000\nHello') === 'srt', 'detectFormat() identifies SRT format');
  suite.assert(detectFormat('## Alice\nSome text') === 'markdown', 'detectFormat() identifies markdown format');
  suite.assert(detectFormat('some plain text without markers') === 'labeled', 'detectFormat() defaults to labeled');

  // parseLabeledTranscript
  const labeled = parseLabeledTranscript('Alice: Hello everyone\nBob: Hi Alice, how are you?\nAlice: Great, let\'s start');
  suite.assert(labeled.length === 3, 'parseLabeledTranscript() parses 3 turns');
  suite.assert(labeled[0].speaker === 'Alice', 'first speaker is Alice');
  suite.assert(labeled[1].speaker === 'Bob', 'second speaker is Bob');
  suite.assert(labeled[0].text === 'Hello everyone', 'first text is correct');

  // Labeled with timestamps
  const withTime = parseLabeledTranscript('Alice (0:05): Opening remarks\nBob (1:30): Response');
  suite.assert(withTime.length === 2, 'parseLabeledTranscript() handles timestamps');
  suite.assert(withTime[0].timestamp === '0:05', 'timestamp extracted correctly');
  suite.assert(withTime[1].timestamp === '1:30', 'second timestamp extracted');

  // Multi-line continuation
  const multiLine = parseLabeledTranscript('Alice: This is a long statement\nthat continues on the next line\nBob: Response');
  suite.assert(multiLine.length === 2, 'parseLabeledTranscript() merges continuation lines');
  suite.assert(multiLine[0].text.includes('continues'), 'continuation text is merged');

  // parseSrtTranscript
  const srt = parseSrtTranscript('1\n00:00:01,000 --> 00:00:04,000\nAlice: Hello everyone\n\n2\n00:00:05,000 --> 00:00:08,000\nBob: Hi there');
  suite.assert(srt.length === 2, 'parseSrtTranscript() parses 2 SRT blocks');
  suite.assert(srt[0].speaker === 'Alice', 'SRT first speaker is Alice');
  suite.assert(srt[0].timestamp === '00:00:01', 'SRT timestamp extracted');
  suite.assert(srt[1].speaker === 'Bob', 'SRT second speaker is Bob');

  // SRT without speaker labels
  const srtNoSpeaker = parseSrtTranscript('1\n00:00:01,000 --> 00:00:04,000\nJust some text\n\n2\n00:00:05,000 --> 00:00:08,000\nMore text');
  suite.assert(srtNoSpeaker[0].speaker === 'Unknown', 'SRT without speaker defaults to Unknown');

  // extractAttendees
  const attendees = extractAttendees([
    { speaker: 'Alice' }, { speaker: 'Bob' }, { speaker: 'Alice' },
    { speaker: 'Unknown' }, { speaker: 'Carol' }
  ]);
  suite.assert(attendees.length === 3, 'extractAttendees() returns 3 unique speakers');
  suite.assert(!attendees.includes('Unknown'), 'extractAttendees() excludes Unknown');
  suite.assert(attendees[0] === 'Alice', 'extractAttendees() is sorted alphabetically');

  // estimateDuration
  suite.assert(estimateDuration([]) === 'unknown', 'estimateDuration() returns unknown for empty');
  suite.assert(estimateDuration([{ timestamp: null }]) === 'unknown', 'estimateDuration() returns unknown for null timestamps');
  suite.assert(estimateDuration([{ timestamp: '00:00' }, { timestamp: '45:00' }]).includes('45'), 'estimateDuration() calculates minutes from MM:SS');
  suite.assert(estimateDuration([{ timestamp: '00:00:00' }, { timestamp: '01:30:00' }]).includes('90'), 'estimateDuration() calculates from HH:MM:SS');
  suite.assert(estimateDuration([{ timestamp: '00:00' }, { timestamp: '00:00' }]) === 'less than 1 minute', 'estimateDuration() handles zero duration');

  // parseTranscript integration
  const transcript = parseTranscript('Alice: We need to ship by Friday\nBob: Agreed, I\'ll handle testing\nAlice: Thanks Bob', 'Product Sync');
  suite.assert(transcript.title === 'Product Sync', 'parseTranscript() uses provided title');
  suite.assert(transcript.attendees.length === 2, 'parseTranscript() extracts 2 attendees');
  suite.assert(transcript.sections.length === 3, 'parseTranscript() has 3 sections');
  suite.assert(transcript.metadata.format === 'labeled', 'parseTranscript() detects labeled format');
  suite.assert(transcript.metadata.sectionCount === 3, 'parseTranscript() reports section count');
  suite.assert(transcript.metadata.wordCount > 0, 'parseTranscript() counts words');

  // parseTranscript defaults
  const defaultTranscript = parseTranscript('Alice: Hello');
  suite.assert(defaultTranscript.title === 'Untitled Meeting', 'parseTranscript() defaults to Untitled Meeting');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${suite.passed + suite.failed}`);
  console.log(`Passed: ${suite.passed} \u2713`);
  console.log(`Failed: ${suite.failed} \u2717`);
  console.log('='.repeat(50));

  if (suite.failed > 0) {
    console.log(`\n\u274C ${suite.failed} test(s) failed!`);
    process.exit(1);
  } else {
    console.log('\n\uD83C\uDF89 All tests passed!');
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Test suite crashed:', error);
  process.exit(1);
});
