#!/usr/bin/env node

/**
 * Steward Fixes — 2026-03-13
 *
 * Tests for:
 * - DocGenerator.updateClaudeMd() — marker-based stats update, missing markers, missing file
 * - data-pipeline example file structure and content validation
 * - csv-extractor.js module exports and parsing (CSV, quoted fields, delimiter detection)
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

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
  console.log('🧪 Steward Fixes — 2026-03-13\n');

  // ============================================
  // DocGenerator.updateClaudeMd() tests
  // ============================================
  console.log('  DocGenerator.updateClaudeMd()');

  const DocGenerator = require('../lib/doc-generator');

  await testAsync('updateClaudeMd returns false when CLAUDE.md has no markers', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registriesDir = path.join(tmpDir, 'config', 'registries');
    fs.mkdirSync(registriesDir, { recursive: true });

    // Create minimal registries
    fs.writeFileSync(path.join(registriesDir, 'departments.json'), JSON.stringify({ departments: {}, metadata: { totalDepartments: 0 } }));
    fs.writeFileSync(path.join(registriesDir, 'agents.json'), JSON.stringify({ agents: {}, metadata: { totalAgents: 0 } }));
    fs.writeFileSync(path.join(registriesDir, 'workflows.json'), JSON.stringify({ workflows: {}, metadata: { totalWorkflows: 0 } }));

    // Create CLAUDE.md without markers
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# My Project\n\nSome content.\n');

    const gen = new DocGenerator();
    gen.basePath = tmpDir;
    gen.registry.basePath = tmpDir;
    gen.registry.registriesPath = registriesDir;
    gen.registry.paths = {
      departments: path.join(registriesDir, 'departments.json'),
      agents: path.join(registriesDir, 'agents.json'),
      workflows: path.join(registriesDir, 'workflows.json')
    };

    await gen.registry.load();
    const result = await gen.updateClaudeMd();
    assertEquals(result, false, 'Should return false when no markers');

    // File should be unchanged
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert(content.includes('# My Project'), 'Content should be unchanged');
    assert(!content.includes('Auto-updated'), 'Should not have added stats');

    fs.rmSync(tmpDir, { recursive: true });
  });

  await testAsync('updateClaudeMd updates stats when markers are present', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registriesDir = path.join(tmpDir, 'config', 'registries');
    fs.mkdirSync(registriesDir, { recursive: true });

    // Create registries with some data
    fs.writeFileSync(path.join(registriesDir, 'departments.json'), JSON.stringify({
      departments: { marketing: { name: 'marketing', status: 'active', agents: [], workflows: [], integrations: [] } },
      metadata: { totalDepartments: 1 }
    }));
    fs.writeFileSync(path.join(registriesDir, 'agents.json'), JSON.stringify({
      agents: {
        'trend-analyzer': { name: 'trend-analyzer', type: 'specialist', department: 'marketing' },
        'data-fetcher-1': { name: 'data-fetcher-1', type: 'data-fetcher', department: 'marketing' }
      },
      metadata: { totalAgents: 2 }
    }));
    fs.writeFileSync(path.join(registriesDir, 'workflows.json'), JSON.stringify({
      workflows: { 'marketing-daily': { name: 'daily', department: 'marketing', trigger: { type: 'scheduled' }, agents: [] } },
      metadata: { totalWorkflows: 1 }
    }));

    // Create CLAUDE.md WITH markers
    const claudeContent = `# My Project

## Stats

<!-- stats:start -->
- old stats here
<!-- stats:end -->

## Other
`;
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), claudeContent);

    const gen = new DocGenerator();
    gen.basePath = tmpDir;
    gen.registry.basePath = tmpDir;
    gen.registry.registriesPath = registriesDir;
    gen.registry.paths = {
      departments: path.join(registriesDir, 'departments.json'),
      agents: path.join(registriesDir, 'agents.json'),
      workflows: path.join(registriesDir, 'workflows.json')
    };

    await gen.registry.load();
    const result = await gen.updateClaudeMd();
    assertEquals(result, true, 'Should return true when markers present');

    const updated = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert(updated.includes('**Departments**: 1'), 'Should show 1 department');
    assert(updated.includes('**Agents**: 2'), 'Should show 2 agents');
    assert(updated.includes('**Workflows**: 1'), 'Should show 1 workflow');
    assert(updated.includes('1 data-fetchers'), 'Should show agent type breakdown');
    assert(updated.includes('1 specialists'), 'Should show specialist count');
    assert(updated.includes('Auto-updated'), 'Should have auto-update timestamp');
    assert(!updated.includes('old stats here'), 'Old stats should be replaced');
    assert(updated.includes('## Other'), 'Content after markers should be preserved');

    fs.rmSync(tmpDir, { recursive: true });
  });

  await testAsync('updateClaudeMd returns false when CLAUDE.md does not exist', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registriesDir = path.join(tmpDir, 'config', 'registries');
    fs.mkdirSync(registriesDir, { recursive: true });

    fs.writeFileSync(path.join(registriesDir, 'departments.json'), JSON.stringify({ departments: {}, metadata: {} }));
    fs.writeFileSync(path.join(registriesDir, 'agents.json'), JSON.stringify({ agents: {}, metadata: {} }));
    fs.writeFileSync(path.join(registriesDir, 'workflows.json'), JSON.stringify({ workflows: {}, metadata: {} }));

    const gen = new DocGenerator();
    gen.basePath = tmpDir;
    gen.registry.basePath = tmpDir;
    gen.registry.registriesPath = registriesDir;
    gen.registry.paths = {
      departments: path.join(registriesDir, 'departments.json'),
      agents: path.join(registriesDir, 'agents.json'),
      workflows: path.join(registriesDir, 'workflows.json')
    };

    await gen.registry.load();
    const result = await gen.updateClaudeMd();
    assertEquals(result, false, 'Should return false when file missing');

    fs.rmSync(tmpDir, { recursive: true });
  });

  await testAsync('updateClaudeMd preserves content outside markers', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-test-'));
    const registriesDir = path.join(tmpDir, 'config', 'registries');
    fs.mkdirSync(registriesDir, { recursive: true });

    fs.writeFileSync(path.join(registriesDir, 'departments.json'), JSON.stringify({ departments: {}, metadata: {} }));
    fs.writeFileSync(path.join(registriesDir, 'agents.json'), JSON.stringify({ agents: {}, metadata: {} }));
    fs.writeFileSync(path.join(registriesDir, 'workflows.json'), JSON.stringify({ workflows: {}, metadata: {} }));

    const before = 'BEFORE_MARKER';
    const after = 'AFTER_MARKER';
    const claudeContent = `${before}\n<!-- stats:start -->\nold\n<!-- stats:end -->\n${after}`;
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), claudeContent);

    const gen = new DocGenerator();
    gen.basePath = tmpDir;
    gen.registry.basePath = tmpDir;
    gen.registry.registriesPath = registriesDir;
    gen.registry.paths = {
      departments: path.join(registriesDir, 'departments.json'),
      agents: path.join(registriesDir, 'agents.json'),
      workflows: path.join(registriesDir, 'workflows.json')
    };

    await gen.registry.load();
    await gen.updateClaudeMd();

    const updated = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert(updated.includes(before), 'Content before markers should be preserved');
    assert(updated.includes(after), 'Content after markers should be preserved');
    assert(!updated.includes('old'), 'Old stats content should be gone');

    fs.rmSync(tmpDir, { recursive: true });
  });

  // ============================================
  // data-pipeline example structure tests
  // ============================================
  console.log('\n  data-pipeline example structure');

  const exampleDir = path.join(__dirname, '..', 'examples', 'data-pipeline');

  test('data-pipeline example directory exists', () => {
    assert(fs.existsSync(exampleDir), 'examples/data-pipeline should exist');
  });

  test('data-pipeline has README.md', () => {
    const readme = path.join(exampleDir, 'README.md');
    assert(fs.existsSync(readme), 'README.md should exist');
    const content = fs.readFileSync(readme, 'utf8');
    assert(content.includes('Data Pipeline'), 'README should mention Data Pipeline');
    assert(content.includes('ETL'), 'README should mention ETL');
    assert(content.includes('csv-extractor'), 'README should mention csv-extractor');
  });

  const expectedAgents = [
    'csv-extractor.md',
    'csv-extractor.js',
    'data-cleaner.md',
    'data-enricher.md',
    'schema-validator.md',
    'db-loader.md'
  ];

  test('data-pipeline has all expected agent files', () => {
    for (const file of expectedAgents) {
      const filePath = path.join(exampleDir, 'agents', file);
      assert(fs.existsSync(filePath), `agents/${file} should exist`);
    }
  });

  test('data-pipeline has workflow config', () => {
    const wfPath = path.join(exampleDir, 'workflows', 'etl-pipeline.json');
    assert(fs.existsSync(wfPath), 'workflows/etl-pipeline.json should exist');
  });

  test('etl-pipeline.json has valid structure', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
    assertEquals(wf.name, 'etl-pipeline', 'Workflow name');
    assertEquals(wf.department, 'data-pipeline', 'Workflow department');
    assert(Array.isArray(wf.steps), 'Steps should be an array');
    assertEquals(wf.steps.length, 4, 'Should have 4 steps');
  });

  test('etl-pipeline step 1 is sequential csv-extractor', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
    assertEquals(wf.steps[0].parallel, false, 'Step 1 should be sequential');
    assertEquals(wf.steps[0].agents.length, 1, 'Step 1 should have 1 agent');
    assertEquals(wf.steps[0].agents[0].name, 'csv-extractor', 'Step 1 agent should be csv-extractor');
  });

  test('etl-pipeline step 2 has 2 parallel agents', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
    assertEquals(wf.steps[1].parallel, true, 'Step 2 should be parallel');
    assertEquals(wf.steps[1].agents.length, 2, 'Step 2 should have 2 agents');
    const names = wf.steps[1].agents.map(a => a.name).sort();
    assert(names.includes('data-cleaner'), 'Should include data-cleaner');
    assert(names.includes('data-enricher'), 'Should include data-enricher');
  });

  test('etl-pipeline steps 3 and 4 are sequential', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
    assertEquals(wf.steps[2].parallel, false, 'Step 3 should be sequential');
    assertEquals(wf.steps[2].agents[0].name, 'schema-validator', 'Step 3 agent');
    assertEquals(wf.steps[3].parallel, false, 'Step 4 should be sequential');
    assertEquals(wf.steps[3].agents[0].name, 'db-loader', 'Step 4 agent');
  });

  test('etl-pipeline has scheduled trigger', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
    assertEquals(wf.trigger.type, 'scheduled', 'Trigger type should be scheduled');
    assertEquals(wf.trigger.schedule, 'daily 2:00', 'Schedule should be daily 2:00');
  });

  test('all workflow agents have matching .md files', () => {
    const wf = JSON.parse(fs.readFileSync(path.join(exampleDir, 'workflows', 'etl-pipeline.json'), 'utf8'));
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
  // csv-extractor.js module tests
  // ============================================
  console.log('\n  csv-extractor.js module tests');

  const { parseCsv, splitCsvLine, detectDelimiter } = require('../examples/data-pipeline/agents/csv-extractor');

  test('parseCsv parses simple CSV', () => {
    const csv = 'name,age,city\nAlice,30,Austin\nBob,25,Denver';
    const result = parseCsv(csv);
    assertEquals(result.columns.length, 3, 'Should have 3 columns');
    assertEquals(result.rowCount, 2, 'Should have 2 rows');
    assertEquals(result.rows[0].name, 'Alice', 'First row name');
    assertEquals(result.rows[0].age, '30', 'First row age');
    assertEquals(result.rows[1].city, 'Denver', 'Second row city');
  });

  test('parseCsv handles quoted fields with commas', () => {
    const csv = 'name,address\n"Smith, John","123 Main St, Apt 4"';
    const result = parseCsv(csv);
    assertEquals(result.rows[0].name, 'Smith, John', 'Should preserve comma inside quotes');
    assertEquals(result.rows[0].address, '123 Main St, Apt 4', 'Should preserve quoted address');
  });

  test('parseCsv handles escaped quotes', () => {
    const csv = 'name,note\n"O\'Brien","""Hello"" said Bob"';
    const result = parseCsv(csv);
    assertEquals(result.rows[0].note, '"Hello" said Bob', 'Should unescape double quotes');
  });

  test('parseCsv reports warnings for missing fields', () => {
    const csv = 'name,email,role\nAlice,,admin\nBob,bob@test.com,';
    const result = parseCsv(csv);
    assert(result.warnings.length > 0, 'Should have warnings for empty fields');
    assert(result.warnings.some(w => w.includes('missing email')), 'Should warn about missing email');
  });

  test('parseCsv reports warnings for column count mismatch', () => {
    const csv = 'a,b,c\n1,2\n3,4,5';
    const result = parseCsv(csv);
    assert(result.warnings.some(w => w.includes('expected 3 fields, got 2')), 'Should warn about column mismatch');
  });

  test('parseCsv throws on empty input', () => {
    let threw = false;
    try { parseCsv(''); } catch (e) { threw = true; }
    assert(threw, 'Should throw on empty input');
  });

  test('parseCsv throws on non-string input', () => {
    let threw = false;
    try { parseCsv(123); } catch (e) { threw = true; }
    assert(threw, 'Should throw on non-string input');
  });

  test('parseCsv skips blank lines', () => {
    const csv = 'name\nAlice\n\nBob\n\n';
    const result = parseCsv(csv);
    assertEquals(result.rowCount, 2, 'Should skip blank lines');
  });

  test('parseCsv handles CRLF line endings', () => {
    const csv = 'name,age\r\nAlice,30\r\nBob,25';
    const result = parseCsv(csv);
    assertEquals(result.rowCount, 2, 'Should handle CRLF');
    assertEquals(result.rows[0].name, 'Alice', 'First row name with CRLF');
  });

  test('parseCsv respects custom delimiter', () => {
    const csv = 'name\tage\nAlice\t30';
    const result = parseCsv(csv, { delimiter: '\t' });
    assertEquals(result.columns.length, 2, 'Should parse tab-delimited');
    assertEquals(result.rows[0].age, '30', 'Should parse tab values');
  });

  test('parseCsv trimValues option', () => {
    const csv = 'name , age\n Alice , 30 ';
    const trimmed = parseCsv(csv, { trimValues: true });
    assertEquals(trimmed.columns[0], 'name', 'Should trim column names');
    assertEquals(trimmed.rows[0].name, 'Alice', 'Should trim values');

    const untrimmed = parseCsv(csv, { trimValues: false });
    assertEquals(untrimmed.columns[0], 'name ', 'Should not trim when disabled');
  });

  test('splitCsvLine handles simple fields', () => {
    const result = splitCsvLine('a,b,c', ',');
    assertEquals(result.length, 3, 'Should split into 3 fields');
    assertEquals(result[0], 'a', 'First field');
  });

  test('splitCsvLine handles empty trailing field', () => {
    const result = splitCsvLine('a,b,', ',');
    assertEquals(result.length, 3, 'Should include empty trailing field');
    assertEquals(result[2], '', 'Trailing field should be empty');
  });

  test('detectDelimiter detects comma', () => {
    assertEquals(detectDelimiter('name,age,city'), ',', 'Should detect comma');
  });

  test('detectDelimiter detects tab', () => {
    assertEquals(detectDelimiter('name\tage\tcity'), '\t', 'Should detect tab');
  });

  test('detectDelimiter detects semicolon', () => {
    assertEquals(detectDelimiter('name;age;city'), ';', 'Should detect semicolon');
  });

  test('detectDelimiter detects pipe', () => {
    assertEquals(detectDelimiter('name|age|city'), '|', 'Should detect pipe');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

run().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
