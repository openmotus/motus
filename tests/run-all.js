#!/usr/bin/env node

/**
 * Test Runner — discovers and runs all test-*.js files in this directory.
 *
 * Features:
 *   - Auto-discovers test files (no manual list to maintain)
 *   - Continues running even if a suite fails
 *   - Reports per-suite and grand totals
 *   - Exits with code 1 if any suite fails
 *
 * Usage:
 *   node tests/run-all.js           # Run all suites
 *   node tests/run-all.js --filter template  # Run suites matching "template"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = __dirname;
const filterArg = process.argv.find((a, i) => process.argv[i - 1] === '--filter');

// Discover test files
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.js') && f !== 'run-all.js')
  .filter(f => !filterArg || f.includes(filterArg))
  .sort();

if (testFiles.length === 0) {
  console.log('No test files found' + (filterArg ? ` matching "${filterArg}"` : '') + '.');
  process.exit(0);
}

console.log('============================================================');
console.log(`  Motus Test Runner — ${testFiles.length} suite${testFiles.length === 1 ? '' : 's'} discovered`);
console.log('============================================================\n');

let grandTotal = 0;
let grandPassed = 0;
let grandFailed = 0;
const suiteResults = [];
const startTime = Date.now();

for (const file of testFiles) {
  const filePath = path.join(testsDir, file);
  const suiteName = file.replace(/^test-/, '').replace(/\.js$/, '');

  process.stdout.write(`  Running ${suiteName}...`);
  const suiteStart = Date.now();

  try {
    const output = execSync(`node "${filePath}"`, {
      encoding: 'utf8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Parse test counts from output
    const totalMatch = output.match(/Total(?:\s+Tests)?:\s*(\d+)/);
    const passedMatch = output.match(/Passed:\s*(\d+)/);
    const failedMatch = output.match(/Failed:\s*(\d+)/);

    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const passed = passedMatch ? parseInt(passedMatch[1]) : total;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const elapsed = Date.now() - suiteStart;

    grandTotal += total;
    grandPassed += passed;
    grandFailed += failed;

    suiteResults.push({ name: suiteName, total, passed, failed, elapsed, status: 'pass' });
    console.log(` ${total} tests passed (${elapsed}ms)`);
  } catch (error) {
    const elapsed = Date.now() - suiteStart;
    const output = (error.stdout || '') + (error.stderr || '');

    // Try to parse counts even from failed runs
    const totalMatch = output.match(/Total(?:\s+Tests)?:\s*(\d+)/);
    const passedMatch = output.match(/Passed:\s*(\d+)/);
    const failedMatch = output.match(/Failed:\s*(\d+)/);

    const total = totalMatch ? parseInt(totalMatch[1]) : 0;
    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : total || 1;

    grandTotal += total;
    grandPassed += passed;
    grandFailed += failed || 1;

    suiteResults.push({ name: suiteName, total, passed, failed, elapsed, status: 'FAIL' });
    console.log(` FAILED (${elapsed}ms)`);

    // Show failure details
    const lines = output.split('\n').filter(l => l.includes('FAIL') || l.includes('Error') || l.startsWith('✗'));
    if (lines.length > 0) {
      lines.slice(0, 5).forEach(l => console.log(`    ${l.trim()}`));
    }
  }
}

const totalElapsed = Date.now() - startTime;
const failedSuites = suiteResults.filter(s => s.status === 'FAIL');

console.log('\n============================================================');
console.log('  Results');
console.log('============================================================');
console.log(`  Suites:  ${suiteResults.length - failedSuites.length} passed, ${failedSuites.length} failed, ${suiteResults.length} total`);
console.log(`  Tests:   ${grandPassed} passed, ${grandFailed} failed, ${grandTotal} total`);
console.log(`  Time:    ${(totalElapsed / 1000).toFixed(1)}s`);
console.log('============================================================');

if (failedSuites.length > 0) {
  console.log('\n  Failed suites:');
  failedSuites.forEach(s => console.log(`    - ${s.name} (${s.failed} failed)`));
}

console.log('');
process.exit(failedSuites.length > 0 ? 1 : 0);
