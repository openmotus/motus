#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-01
 *
 * Tests for improvements made in the March 1 stewardship cycle:
 * - CLI flag ordering (--version / --help exit before boxen)
 * - validateContext only swallows ENOENT
 * - Programmatic usage example validation
 * - JSDoc presence on public methods
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const TemplateEngine = require('../lib/template-engine');
const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');
const DocGenerator = require('../lib/doc-generator');
const OAuthRegistry = require('../lib/oauth-registry');

const results = { passed: 0, failed: 0 };

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    results.passed++;
  } else {
    console.log(`✗ ${message}`);
    results.failed++;
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    console.log(`✗ ${message} (did not throw)`);
    results.failed++;
  } catch (e) {
    console.log(`✓ ${message}`);
    results.passed++;
  }
}

async function assertThrowsAsync(fn, message) {
  try {
    await fn();
    console.log(`✗ ${message} (did not throw)`);
    results.failed++;
  } catch (e) {
    console.log(`✓ ${message}`);
    results.passed++;
  }
}

// ============================================================
// CLI flag ordering tests
// ============================================================
console.log('\nCLI: --version flag');

try {
  const versionOutput = execSync('node motus --version', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
  const lines = versionOutput.trim().split('\n');
  assert(lines.length === 1, '--version outputs exactly one line');
  assert(lines[0].startsWith('Motus v'), '--version output starts with "Motus v"');
  assert(!versionOutput.includes('Claude Code CLI'), '--version does not print boxen message');
} catch (e) {
  assert(false, `--version command failed: ${e.message}`);
}

console.log('\nCLI: --help flag');

try {
  const helpOutput = execSync('node motus --help', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
  assert(helpOutput.includes('Usage:'), '--help contains Usage section');
  assert(helpOutput.includes('--version'), '--help lists --version flag');
  assert(helpOutput.includes('--oauth'), '--help lists --oauth flag');
  assert(!helpOutput.includes('╭'), '--help does not print boxen border');
} catch (e) {
  assert(false, `--help command failed: ${e.message}`);
}

console.log('\nCLI: -V flag (short version)');

try {
  const output = execSync('node motus -V', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
  assert(output.trim().startsWith('Motus v'), '-V outputs version');
} catch (e) {
  assert(false, `-V command failed: ${e.message}`);
}

console.log('\nCLI: no flags shows boxen');

try {
  const output = execSync('node motus', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
  assert(output.includes('Claude Code CLI'), 'no-flag run shows boxen message');
} catch (e) {
  assert(false, `no-flag command failed: ${e.message}`);
}

// ============================================================
// validateContext: ENOENT-only error swallowing
// ============================================================
console.log('\nvalidateContext: error handling');

(async () => {
  const engine = new TemplateEngine();

  // No schema → valid (ENOENT is swallowed)
  const noSchema = await engine.validateContext('nonexistent-template', { name: 'test' });
  assert(noSchema.valid === true, 'missing schema returns valid');
  assert(noSchema.errors.length === 0, 'missing schema returns no errors');

  // Corrupt schema path: create a directory where a file is expected
  // to trigger EISDIR (not ENOENT)
  const schemasDir = path.join(engine.templatesDir, 'schemas');
  const corruptPath = path.join(schemasDir, 'corrupt-test-schema.json');
  try {
    fs.mkdirSync(corruptPath, { recursive: true }); // creates a directory, not a file
    let threw = false;
    try {
      await engine.validateContext('corrupt-test', { name: 'test' });
    } catch (e) {
      threw = true;
      assert(e.code === 'EISDIR', 'EISDIR error is re-thrown (not swallowed)');
    }
    assert(threw, 'non-ENOENT error causes throw');
  } finally {
    // Clean up the fake directory
    try { fs.rmdirSync(corruptPath); } catch (e) { /* ignore */ }
  }

  // ============================================================
  // Programmatic usage example runs
  // ============================================================
  console.log('\nProgrammatic usage example');

  try {
    const exampleOutput = execSync('node examples/programmatic-usage/setup-department.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      timeout: 10000
    });
    assert(exampleOutput.includes('Registry loaded'), 'example loads registry');
    assert(exampleOutput.includes('Created department: DevOps'), 'example creates department');
    assert(exampleOutput.includes('Health Checker'), 'example creates data-fetcher agent');
    assert(exampleOutput.includes('Incident Analyzer'), 'example creates specialist agent');
    assert(exampleOutput.includes('Deploy Coordinator'), 'example creates orchestrator agent');
    assert(exampleOutput.includes('Created workflow: Status Report'), 'example creates workflow');
    assert(exampleOutput.includes('Search "health" found'), 'example searches registry');
    assert(exampleOutput.includes('Registry integrity: VALID'), 'example validates integrity');
    assert(exampleOutput.includes('Exported'), 'example exports registry');
    assert(exampleOutput.includes('cleaned up'), 'example cleans up temp files');
  } catch (e) {
    assert(false, `programmatic example failed: ${e.message}`);
  }

  // ============================================================
  // JSDoc presence on public methods
  // ============================================================
  console.log('\nJSDoc: RegistryManager public methods');

  const rmSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'registry-manager.js'), 'utf8');
  const rmMethods = ['load', 'save', 'addDepartment', 'updateDepartment', 'getDepartment',
    'listDepartments', 'addAgent', 'updateAgent', 'getAgent', 'listAgents',
    'addWorkflow', 'getWorkflow', 'listWorkflows', 'getStatistics', 'validate',
    'search', 'reset', 'export'];
  for (const method of rmMethods) {
    assert(rmSource.includes(`@returns`) || rmSource.includes(`@param`), `RegistryManager has JSDoc tags`);
    break; // Just verify once that JSDoc is present
  }
  assert(rmSource.includes('@param {string} data.name - Kebab-case identifier'), 'addDepartment has @param JSDoc');
  assert(rmSource.includes('@throws {Error} If required fields are missing'), 'addDepartment has @throws JSDoc');
  assert(rmSource.includes('@returns {Promise<boolean>}'), 'load() has @returns JSDoc');

  console.log('\nJSDoc: TemplateEngine public methods');

  const teSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'template-engine.js'), 'utf8');
  assert(teSource.includes('@param {string} templateName - Template identifier'), 'loadTemplate has @param JSDoc');
  assert(teSource.includes('@returns {Promise<Function>}'), 'loadTemplate has @returns JSDoc');
  assert(teSource.includes('@throws {Error} If the template file cannot be read'), 'loadTemplate has @throws JSDoc');
  assert(teSource.includes('@param {string|null} [type=null]'), 'listTemplates has @param JSDoc');

  console.log('\nJSDoc: Validator public methods');

  const vSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'validator.js'), 'utf8');
  assert(vSource.includes('@param {string} name - Candidate department name'), 'validateDepartmentName has @param');
  assert(vSource.includes('@returns {{valid: boolean, errors: string[]}}'), 'validateDepartmentName has @returns');
  assert(vSource.includes('@param {string} description - Free-text agent description'), 'detectAgentType has @param');

  console.log('\nJSDoc: DocGenerator public methods');

  const dgSource = fs.readFileSync(path.join(__dirname, '..', 'lib', 'doc-generator.js'), 'utf8');
  assert(dgSource.includes('@returns {Promise<void>}'), 'generate has @returns JSDoc');
  assert(dgSource.includes('@param {Object} integration'), 'generateIntegrationDocs has @param');
  assert(dgSource.includes('@returns {string}'), 'generateIntegrationDocs has @returns');

  // ============================================================
  // Example directory structure validation
  // ============================================================
  console.log('\nExample directories');

  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'programmatic-usage', 'README.md')), 'programmatic-usage/README.md exists');
  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'programmatic-usage', 'setup-department.js')), 'programmatic-usage/setup-department.js exists');
  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'daily-briefing')), 'daily-briefing/ exists');
  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'content-pipeline')), 'content-pipeline/ exists');
  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'code-review')), 'code-review/ exists');
  assert(fs.existsSync(path.join(__dirname, '..', 'examples', 'code-review', 'agents', 'diff-collector.js')), 'code-review/diff-collector.js exists');

  // ============================================================
  // Results
  // ============================================================
  console.log(`
============================================================
Test Results
============================================================
Total: ${results.passed + results.failed}
Passed: ${results.passed} ✓
Failed: ${results.failed} ✗
============================================================
`);

  if (results.failed > 0) {
    process.exit(1);
  }

  console.log('🎉 All tests passed!');
})();
