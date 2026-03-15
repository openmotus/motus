#!/usr/bin/env node

/**
 * Steward Fixes Test Suite — 2026-03-15
 *
 * Tests:
 * - DocGenerator basePath parameter (consistency with RegistryManager)
 * - Release-manager example structure and file validation
 * - version-checker.js module tests (parseSemver, bumpVersion, parseUnreleasedSection, determineBumpType)
 */

const fs = require('fs');
const path = require('path');
const DocGenerator = require('../lib/doc-generator');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples', 'release-manager');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('');

  // =============================================
  // DocGenerator basePath parameter
  // =============================================
  console.log('DocGenerator basePath parameter:');

  test('constructor accepts basePath', () => {
    const gen = new DocGenerator('/tmp/test-project');
    assert(gen.basePath === '/tmp/test-project', `Expected /tmp/test-project, got ${gen.basePath}`);
  });

  test('constructor defaults basePath when not provided', () => {
    const gen = new DocGenerator();
    const expected = path.join(__dirname, '..');
    assert(gen.basePath === expected, `Expected ${expected}, got ${gen.basePath}`);
  });

  test('docsPath is derived from basePath', () => {
    const gen = new DocGenerator('/tmp/test-project');
    assert(gen.docsPath === path.join('/tmp/test-project', 'org-docs'),
      `Expected org-docs under basePath, got ${gen.docsPath}`);
  });

  test('deptDocsPath is derived from basePath', () => {
    const gen = new DocGenerator('/tmp/test-project');
    assert(gen.deptDocsPath === path.join('/tmp/test-project', 'org-docs', 'departments'),
      `Expected departments under docsPath, got ${gen.deptDocsPath}`);
  });

  test('registry receives basePath', () => {
    const gen = new DocGenerator('/tmp/test-project');
    assert(gen.registry.basePath === '/tmp/test-project',
      `Expected registry basePath to match, got ${gen.registry.basePath}`);
  });

  test('constructor with null falls back to default', () => {
    const gen = new DocGenerator(null);
    const expected = path.join(__dirname, '..');
    assert(gen.basePath === expected, `Expected ${expected}, got ${gen.basePath}`);
  });

  test('constructor with undefined falls back to default', () => {
    const gen = new DocGenerator(undefined);
    const expected = path.join(__dirname, '..');
    assert(gen.basePath === expected, `Expected ${expected}, got ${gen.basePath}`);
  });

  // =============================================
  // Release-manager example structure
  // =============================================
  console.log('\nRelease-manager example structure:');

  test('example directory exists', () => {
    assert(fs.existsSync(EXAMPLES_DIR), 'examples/release-manager/ not found');
  });

  test('agents directory exists', () => {
    assert(fs.existsSync(path.join(EXAMPLES_DIR, 'agents')), 'agents/ not found');
  });

  test('workflow.json exists', () => {
    assert(fs.existsSync(path.join(EXAMPLES_DIR, 'workflow.json')), 'workflow.json not found');
  });

  test('version-checker.js exists', () => {
    assert(fs.existsSync(path.join(EXAMPLES_DIR, 'version-checker.js')), 'version-checker.js not found');
  });

  const expectedAgents = ['test-runner.md', 'changelog-validator.md', 'version-bumper.md', 'release-notes-generator.md'];
  for (const agent of expectedAgents) {
    test(`agent ${agent} exists`, () => {
      assert(fs.existsSync(path.join(EXAMPLES_DIR, 'agents', agent)), `agents/${agent} not found`);
    });
  }

  test('workflow.json is valid JSON', () => {
    const content = fs.readFileSync(path.join(EXAMPLES_DIR, 'workflow.json'), 'utf8');
    const workflow = JSON.parse(content);
    assert(workflow.name === 'release-pipeline', `Expected name release-pipeline, got ${workflow.name}`);
  });

  test('workflow.json has correct steps structure', () => {
    const workflow = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'workflow.json'), 'utf8'));
    assert(workflow.steps.length === 3, `Expected 3 steps, got ${workflow.steps.length}`);
    assert(workflow.steps[0].parallel === true, 'Step 1 should be parallel');
    assert(workflow.steps[1].parallel === false, 'Step 2 should be sequential');
    assert(workflow.steps[2].parallel === false, 'Step 3 should be sequential');
  });

  test('workflow.json step 1 runs test-runner and changelog-validator in parallel', () => {
    const workflow = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'workflow.json'), 'utf8'));
    const step1Agents = workflow.steps[0].agents;
    assert(step1Agents.includes('test-runner'), 'Step 1 missing test-runner');
    assert(step1Agents.includes('changelog-validator'), 'Step 1 missing changelog-validator');
  });

  test('workflow.json agents reference valid agent files', () => {
    const workflow = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'workflow.json'), 'utf8'));
    const allAgents = workflow.steps.flatMap(s => s.agents);
    for (const agent of allAgents) {
      const agentPath = path.join(EXAMPLES_DIR, 'agents', `${agent}.md`);
      assert(fs.existsSync(agentPath), `Workflow references agent '${agent}' but ${agentPath} not found`);
    }
  });

  test('agent files have frontmatter', () => {
    for (const agent of expectedAgents) {
      const content = fs.readFileSync(path.join(EXAMPLES_DIR, 'agents', agent), 'utf8');
      assert(content.startsWith('---'), `${agent} missing frontmatter opening`);
      const secondDash = content.indexOf('---', 3);
      assert(secondDash > 0, `${agent} missing frontmatter closing`);
    }
  });

  // =============================================
  // version-checker.js module tests
  // =============================================
  console.log('\nversion-checker.js module tests:');

  const { parseSemver, bumpVersion, parseUnreleasedSection, determineBumpType } = require(path.join(EXAMPLES_DIR, 'version-checker.js'));

  // parseSemver
  test('parseSemver: standard version', () => {
    const result = parseSemver('1.2.3');
    assert(result.major === 1 && result.minor === 2 && result.patch === 3, 'Wrong parse');
    assert(result.prerelease === null, 'Should have no prerelease');
  });

  test('parseSemver: with prerelease', () => {
    const result = parseSemver('2.0.0-beta');
    assert(result.major === 2 && result.minor === 0 && result.patch === 0, 'Wrong parse');
    assert(result.prerelease === 'beta', `Expected beta, got ${result.prerelease}`);
  });

  test('parseSemver: zero version', () => {
    const result = parseSemver('0.0.0');
    assert(result.major === 0 && result.minor === 0 && result.patch === 0, 'Wrong parse');
  });

  test('parseSemver: invalid string returns null', () => {
    assert(parseSemver('not-a-version') === null, 'Should return null');
  });

  test('parseSemver: partial version returns null', () => {
    assert(parseSemver('1.2') === null, 'Should return null for partial version');
  });

  // bumpVersion
  test('bumpVersion: patch bump', () => {
    assert(bumpVersion('1.2.3', 'patch') === '1.2.4', 'Wrong patch bump');
  });

  test('bumpVersion: minor bump resets patch', () => {
    assert(bumpVersion('1.2.3', 'minor') === '1.3.0', 'Wrong minor bump');
  });

  test('bumpVersion: major bump resets minor and patch', () => {
    assert(bumpVersion('1.2.3', 'major') === '2.0.0', 'Wrong major bump');
  });

  test('bumpVersion: invalid version returns original', () => {
    assert(bumpVersion('bad', 'patch') === 'bad', 'Should return original on invalid');
  });

  test('bumpVersion: unknown bump type returns original', () => {
    assert(bumpVersion('1.0.0', 'unknown') === '1.0.0', 'Should return original on unknown type');
  });

  // parseUnreleasedSection
  test('parseUnreleasedSection: basic changelog', () => {
    const content = `# Changelog\n\n## [Unreleased]\n\n### Added\n- Feature one\n- Feature two\n\n### Fixed\n- Bug fix\n\n## [1.0.0] - 2026-01-01\n`;
    const sections = parseUnreleasedSection(content);
    assert(sections.length === 2, `Expected 2 sections, got ${sections.length}`);
    assert(sections[0].section === 'Added', `Expected Added, got ${sections[0].section}`);
    assert(sections[0].entries.length === 2, `Expected 2 entries, got ${sections[0].entries.length}`);
    assert(sections[1].section === 'Fixed', `Expected Fixed, got ${sections[1].section}`);
    assert(sections[1].entries.length === 1, `Expected 1 entry, got ${sections[1].entries.length}`);
  });

  test('parseUnreleasedSection: empty unreleased section', () => {
    const content = `# Changelog\n\n## [Unreleased]\n\n## [1.0.0] - 2026-01-01\n`;
    const sections = parseUnreleasedSection(content);
    assert(sections.length === 0, `Expected 0 sections, got ${sections.length}`);
  });

  test('parseUnreleasedSection: stops at next version header', () => {
    const content = `## [Unreleased]\n\n### Added\n- New thing\n\n## [2.0.0] - 2026-02-01\n\n### Added\n- Old thing\n`;
    const sections = parseUnreleasedSection(content);
    assert(sections.length === 1, 'Should only get unreleased entries');
    assert(sections[0].entries.length === 1, 'Should have 1 entry');
    assert(sections[0].entries[0] === 'New thing', 'Wrong entry content');
  });

  test('parseUnreleasedSection: ignores non-entry lines', () => {
    const content = `## [Unreleased]\n\n### Changed\n- Real entry\nThis is just text, not an entry\n  - Indented sub-item (ignored)\n- Another entry\n`;
    const sections = parseUnreleasedSection(content);
    assert(sections[0].entries.length === 2, `Expected 2 entries, got ${sections[0].entries.length}`);
  });

  // determineBumpType
  test('determineBumpType: Added = minor', () => {
    const sections = [{ section: 'Added', entries: ['Feature'] }];
    assert(determineBumpType(sections) === 'minor', 'Added should be minor bump');
  });

  test('determineBumpType: Fixed only = patch', () => {
    const sections = [{ section: 'Fixed', entries: ['Bug'] }];
    assert(determineBumpType(sections) === 'patch', 'Fixed should be patch bump');
  });

  test('determineBumpType: Removed = major', () => {
    const sections = [{ section: 'Removed', entries: ['Feature'] }];
    assert(determineBumpType(sections) === 'major', 'Removed should be major bump');
  });

  test('determineBumpType: breaking in entry = major', () => {
    const sections = [{ section: 'Changed', entries: ['BREAKING: changed API'] }];
    assert(determineBumpType(sections) === 'major', 'Breaking change should be major');
  });

  test('determineBumpType: Added + Fixed = minor (highest wins)', () => {
    const sections = [
      { section: 'Added', entries: ['Feature'] },
      { section: 'Fixed', entries: ['Bug'] }
    ];
    assert(determineBumpType(sections) === 'minor', 'Added should override Fixed');
  });

  test('determineBumpType: empty sections = patch', () => {
    assert(determineBumpType([]) === 'patch', 'Empty should default to patch');
  });

  test('determineBumpType: Security = patch', () => {
    const sections = [{ section: 'Security', entries: ['Patched vuln'] }];
    assert(determineBumpType(sections) === 'patch', 'Security should be patch');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
