#!/usr/bin/env node

/**
 * Template Engine — Comprehensive Helper & Edge Case Tests
 *
 * Tests all 20 Handlebars helpers individually, template caching,
 * path resolution, renderToFile, and edge cases.
 */

const Handlebars = require('handlebars');
const TemplateEngine = require('../lib/template-engine');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`\u2713 ${name}`);
    passed++;
  } else {
    console.log(`\u2717 ${name}`);
    failed++;
  }
}

async function run() {
  const engine = new TemplateEngine();

  // Helper to compile and run a mini-template
  function h(template, context) {
    return Handlebars.compile(template)(context || {});
  }

  console.log('Template Engine — Comprehensive Helper & Edge Case Tests');
  console.log('=' .repeat(60));

  // ==========================================
  // Handlebars Helper Tests
  // ==========================================

  console.log('\nkebabCase Helper\n');

  assert(h('{{kebabCase val}}', { val: 'My Agent Name' }) === 'my-agent-name', 'kebabCase: spaces to hyphens');
  assert(h('{{kebabCase val}}', { val: 'CamelCase' }) === 'camelcase', 'kebabCase: strips uppercase');
  assert(h('{{kebabCase val}}', { val: '' }) === '', 'kebabCase: empty string');
  assert(h('{{kebabCase val}}', { val: null }) === '', 'kebabCase: null');
  assert(h('{{kebabCase val}}', { val: 'hello--world!!' }) === 'hello-world', 'kebabCase: special chars and double hyphens');
  assert(h('{{kebabCase val}}', { val: '---leading' }) === 'leading', 'kebabCase: strips leading hyphens');

  console.log('\npascalCase Helper\n');

  assert(h('{{pascalCase val}}', { val: 'my-agent-name' }) === 'MyAgentName', 'pascalCase: hyphens to PascalCase');
  assert(h('{{pascalCase val}}', { val: 'hello_world' }) === 'HelloWorld', 'pascalCase: underscores to PascalCase');
  assert(h('{{pascalCase val}}', { val: 'single' }) === 'Single', 'pascalCase: single word');
  assert(h('{{pascalCase val}}', { val: '' }) === '', 'pascalCase: empty string');
  assert(h('{{pascalCase val}}', { val: null }) === '', 'pascalCase: null');

  console.log('\ncamelCase Helper\n');

  assert(h('{{camelCase val}}', { val: 'my-agent-name' }) === 'myAgentName', 'camelCase: hyphens to camelCase');
  assert(h('{{camelCase val}}', { val: 'hello_world' }) === 'helloWorld', 'camelCase: underscores to camelCase');
  assert(h('{{camelCase val}}', { val: 'single' }) === 'single', 'camelCase: single word stays lowercase');
  assert(h('{{camelCase val}}', { val: '' }) === '', 'camelCase: empty string');
  assert(h('{{camelCase val}}', { val: null }) === '', 'camelCase: null');

  console.log('\ncapitalize Helper\n');

  assert(h('{{capitalize val}}', { val: 'hello' }) === 'Hello', 'capitalize: lowercase word');
  assert(h('{{capitalize val}}', { val: 'Hello' }) === 'Hello', 'capitalize: already capitalized');
  assert(h('{{capitalize val}}', { val: '' }) === '', 'capitalize: empty string');
  assert(h('{{capitalize val}}', { val: null }) === '', 'capitalize: null');

  console.log('\nuppercase / lowercase Helpers\n');

  assert(h('{{uppercase val}}', { val: 'hello' }) === 'HELLO', 'uppercase: converts to upper');
  assert(h('{{uppercase val}}', { val: null }) === '', 'uppercase: null returns empty');
  assert(h('{{lowercase val}}', { val: 'HELLO' }) === 'hello', 'lowercase: converts to lower');
  assert(h('{{lowercase val}}', { val: null }) === '', 'lowercase: null returns empty');

  console.log('\ntimestamp Helper\n');

  const ts = h('{{timestamp}}');
  assert(/^\d{4}-\d{2}-\d{2}T/.test(ts), 'timestamp: returns ISO format');

  console.log('\nformatDate Helper\n');

  const fd = h('{{formatDate val}}', { val: '2026-01-15' });
  assert(fd.startsWith('2026-01-15'), 'formatDate: formats date string');
  const fdNull = h('{{formatDate val}}', { val: null });
  assert(/^\d{4}-\d{2}-\d{2}T/.test(fdNull), 'formatDate: null falls back to current time');

  console.log('\njoin Helper\n');

  assert(h('{{join val ", "}}', { val: ['a', 'b', 'c'] }) === 'a, b, c', 'join: array with separator');
  assert(h('{{join val " | "}}', { val: ['x'] }) === 'x', 'join: single element');
  assert(h('{{join val ", "}}', { val: 'not-array' }) === '', 'join: non-array returns empty');
  // Note: calling {{join val}} without separator passes Handlebars options as 2nd arg,
  // so always provide a separator in real templates. Testing with explicit separator.
  assert(h('{{join val ", "}}', { val: ['a', 'b'] }) === 'a, b', 'join: explicit comma separator');

  console.log('\neq Helper (block)\n');

  assert(h('{{#eq a b}}yes{{else}}no{{/eq}}', { a: 'x', b: 'x' }) === 'yes', 'eq: equal values');
  assert(h('{{#eq a b}}yes{{else}}no{{/eq}}', { a: 'x', b: 'y' }) === 'no', 'eq: unequal values');
  assert(h('{{#eq a b}}yes{{else}}no{{/eq}}', { a: 1, b: '1' }) === 'no', 'eq: strict equality (number vs string)');

  console.log('\ncontains Helper (block)\n');

  assert(h('{{#contains arr val}}yes{{else}}no{{/contains}}', { arr: ['a', 'b'], val: 'a' }) === 'yes', 'contains: found');
  assert(h('{{#contains arr val}}yes{{else}}no{{/contains}}', { arr: ['a', 'b'], val: 'z' }) === 'no', 'contains: not found');
  assert(h('{{#contains arr val}}yes{{else}}no{{/contains}}', { arr: 'not-array', val: 'a' }) === 'no', 'contains: non-array');

  console.log('\npluralize Helper\n');

  assert(h('{{pluralize count "item" "items"}}', { count: 1 }) === 'item', 'pluralize: singular');
  assert(h('{{pluralize count "item" "items"}}', { count: 5 }) === 'items', 'pluralize: plural');
  assert(h('{{pluralize count "item" "items"}}', { count: 0 }) === 'items', 'pluralize: zero count is plural');

  console.log('\nindent Helper\n');

  assert(h('{{indent val 4}}', { val: 'line1\nline2' }) === '    line1\n    line2', 'indent: 4 spaces');
  assert(h('{{indent val 2}}', { val: 'line1' }) === '  line1', 'indent: explicit 2 spaces');
  assert(h('{{indent val 4}}', { val: '' }) === '', 'indent: empty string');
  assert(h('{{indent val 4}}', { val: null }) === '', 'indent: null');

  console.log('\nagentList Helper\n');

  assert(h('{{agentList val}}', { val: ['a', 'b'] }) === '   - a\n   - b', 'agentList: formats bullet list');
  assert(h('{{agentList val}}', { val: [] }) === '', 'agentList: empty array');
  assert(h('{{agentList val}}', { val: 'not-array' }) === '', 'agentList: non-array');

  console.log('\ntoolsList Helper\n');

  assert(h('{{toolsList val}}', { val: ['Bash', 'Read', 'Write'] }) === 'Bash, Read, Write', 'toolsList: comma-separated');
  assert(h('{{toolsList val}}', { val: [] }) === '', 'toolsList: empty array');
  assert(h('{{toolsList val}}', { val: 'not-array' }) === '', 'toolsList: non-array');

  console.log('\nifNotEmpty Helper (block)\n');

  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: ['a'] }) === 'yes', 'ifNotEmpty: non-empty array');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: [] }) === 'no', 'ifNotEmpty: empty array');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: 'hello' }) === 'yes', 'ifNotEmpty: non-empty string');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: '' }) === 'no', 'ifNotEmpty: empty string');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: '   ' }) === 'no', 'ifNotEmpty: whitespace-only string');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: { a: 1 } }) === 'yes', 'ifNotEmpty: non-empty object');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: {} }) === 'no', 'ifNotEmpty: empty object');
  assert(h('{{#ifNotEmpty val}}yes{{else}}no{{/ifNotEmpty}}', { val: null }) === 'no', 'ifNotEmpty: null');

  console.log('\nstepNumber Helper\n');

  assert(h('{{stepNumber val}}', { val: 0 }) === '1', 'stepNumber: 0 -> 1');
  assert(h('{{stepNumber val}}', { val: 4 }) === '5', 'stepNumber: 4 -> 5');

  console.log('\ncommentHeader Helper\n');

  const ch = h('{{commentHeader val}}', { val: 'Test Header' });
  assert(ch.startsWith('/**'), 'commentHeader: starts with block comment');
  assert(ch.includes('Test Header'), 'commentHeader: includes text');
  assert(ch.includes('Generated:'), 'commentHeader: includes timestamp');

  console.log('\nfrontmatter Helper\n');

  // frontmatter takes a data object — test by passing it directly via context
  // In real templates it uses (hash ...) sub-expression, but we can test the helper function directly
  Handlebars.registerHelper('testFrontmatter', function() {
    const frontmatterHelper = Handlebars.helpers.frontmatter;
    return frontmatterHelper({ name: 'test', model: 'sonnet' });
  });
  const fm = Handlebars.compile('{{{testFrontmatter}}}')({});
  assert(fm.includes('---'), 'frontmatter: includes delimiters');
  assert(fm.includes('name: test'), 'frontmatter: includes key-value pairs');
  assert(fm.includes('model: sonnet'), 'frontmatter: includes all fields');

  // ==========================================
  // Template Engine Method Tests
  // ==========================================

  console.log('\nTemplate Caching\n');

  // Load same template twice — second should come from cache
  await engine.loadTemplate('agent/data-fetcher-agent.md');
  assert(engine.compiledTemplates.has('agent/data-fetcher-agent.md'), 'cache: template stored after first load');
  const cached = await engine.loadTemplate('agent/data-fetcher-agent.md');
  assert(typeof cached === 'function', 'cache: cached template is a function');

  engine.clearCache();
  assert(engine.compiledTemplates.size === 0, 'clearCache: empties the cache');

  console.log('\nresolveTemplatePath\n');

  const agentPath = engine.resolveTemplatePath('agent/data-fetcher-agent.md');
  assert(agentPath.endsWith('agent/data-fetcher-agent.md.hbs'), 'resolveTemplatePath: type/name format');

  const mdPath = engine.resolveTemplatePath('my-agent.md');
  assert(mdPath.includes('/agent/'), 'resolveTemplatePath: .md with "agent" -> agent dir');

  const jsPath = engine.resolveTemplatePath('my-script.js');
  assert(jsPath.includes('/agent/'), 'resolveTemplatePath: .js -> agent dir');

  const jsonPath = engine.resolveTemplatePath('my-config.json');
  assert(jsonPath.includes('/workflow/'), 'resolveTemplatePath: .json -> workflow dir');

  const shPath = engine.resolveTemplatePath('my-trigger.sh');
  assert(shPath.includes('/workflow/'), 'resolveTemplatePath: .sh -> workflow dir');

  const defaultPath = engine.resolveTemplatePath('something');
  assert(defaultPath.includes('/agent/'), 'resolveTemplatePath: no extension -> agent dir');

  console.log('\nrender method\n');

  const rendered = await engine.render('agent/specialist-agent.md', {
    name: 'test-specialist',
    description: 'A test specialist agent',
    tools: ['Read', 'Write'],
    model: 'sonnet',
    color: 'green',
    department: 'testing'
  });
  assert(rendered.includes('test-specialist'), 'render: includes agent name');
  assert(rendered.includes('A test specialist agent'), 'render: includes description');

  console.log('\nrenderToFile method\n');

  const tmpDir = path.join(os.tmpdir(), `motus-test-${Date.now()}`);
  const outFile = path.join(tmpDir, 'test-output.md');
  await engine.renderToFile('agent/specialist-agent.md', {
    name: 'file-test-agent',
    description: 'Testing renderToFile output',
    tools: ['Bash'],
    model: 'haiku',
    color: 'red',
    department: 'testing'
  }, outFile);

  const fileContent = await fs.readFile(outFile, 'utf8');
  assert(fileContent.includes('file-test-agent'), 'renderToFile: file contains rendered content');
  assert(fileContent.includes('Testing renderToFile output'), 'renderToFile: file contains description');

  // Cleanup
  await fs.rm(tmpDir, { recursive: true });

  console.log('\nlistTemplates method\n');

  const allTemplates = await engine.listTemplates();
  assert(allTemplates.length >= 11, 'listTemplates: finds all templates (>= 11)');

  const agentTemplates = await engine.listTemplates('agent');
  assert(agentTemplates.every(t => t.type === 'agent'), 'listTemplates: filters by type');
  assert(agentTemplates.length >= 3, 'listTemplates: finds agent templates (>= 3)');

  const workflowTemplates = await engine.listTemplates('workflow');
  assert(workflowTemplates.every(t => t.type === 'workflow'), 'listTemplates: workflow type filter');

  console.log('\nError handling\n');

  try {
    await engine.loadTemplate('nonexistent/template');
    assert(false, 'loadTemplate: throws on missing template');
  } catch (e) {
    assert(e.message.includes('Failed to load template'), 'loadTemplate: error mentions template name');
    assert(e.message.includes('templates/ directory'), 'loadTemplate: error suggests checking templates/');
  }

  console.log('\nvalidateContext method\n');

  // Schema doesn't exist for most templates — should return valid
  const noSchema = await engine.validateContext('nonexistent-schema', { name: 'test' });
  assert(noSchema.valid === true, 'validateContext: missing schema returns valid');
  assert(noSchema.errors.length === 0, 'validateContext: missing schema has no errors');

  // ==========================================
  // Summary
  // ==========================================

  console.log('\n' + '=' .repeat(60));
  console.log('Test Results');
  console.log('=' .repeat(60));
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed} \u2713`);
  console.log(`Failed: ${failed} \u2717`);
  console.log('=' .repeat(60));

  if (failed > 0) {
    console.log('\n\u274c Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n\ud83c\udf89 All tests passed!');
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
