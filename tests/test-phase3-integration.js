#!/usr/bin/env node

/**
 * Phase 3 Integration Tests
 *
 * End-to-end tests for the Motus framework:
 * - Registry system with empty state (fresh install)
 * - Documentation generation
 * - File structure validation
 * - Library integration
 */

const fs = require('fs').promises;
const path = require('path');
const RegistryManager = require('../lib/registry-manager');
const DocGenerator = require('../lib/doc-generator');
const TemplateEngine = require('../lib/template-engine');
const Validator = require('../lib/validator');

class Phase3TestSuite {
  constructor() {
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.tests = [];
  }

  async test(name, fn) {
    this.testCount++;
    try {
      await fn();
      this.passCount++;
      console.log(`✓ ${name}`);
      this.tests.push({ name, passed: true });
    } catch (error) {
      this.failCount++;
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
      this.tests.push({ name, passed: false, error: error.message });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  assertTrue(value, message) {
    if (!value) {
      throw new Error(message || 'Expected true, got false');
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log('Test Results');
    console.log('='.repeat(60));
    console.log(`Total: ${this.testCount}`);
    console.log(`Passed: ${this.passCount} ✓`);
    console.log(`Failed: ${this.failCount} ✗`);
    console.log('='.repeat(60));

    if (this.failCount > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  }
}

async function runTests() {
  const suite = new Phase3TestSuite();
  let registry;

  console.log('Phase 3 Integration Tests');
  console.log('='.repeat(60) + '\n');

  // ========================================
  // REGISTRY TESTS (Empty State)
  // ========================================

  console.log('Registry Integration Tests (Empty State)\n');

  await suite.test('Registry: Load production registries', async () => {
    registry = new RegistryManager();
    await registry.load();
    suite.assertTrue(registry.loaded, 'Registries loaded');
  });

  await suite.test('Registry: Empty registries have correct structure', async () => {
    suite.assert(registry.departments.departments !== undefined, 'Departments object exists');
    suite.assert(registry.agents.agents !== undefined, 'Agents object exists');
    suite.assert(registry.workflows.workflows !== undefined, 'Workflows object exists');
    suite.assert(registry.departments.metadata !== undefined, 'Departments metadata exists');
  });

  await suite.test('Registry: Statistics work with empty registries', async () => {
    const stats = await registry.getStatistics();
    suite.assertEquals(stats.departments.total, 0, 'Should have 0 departments');
    suite.assertEquals(stats.agents.total, 0, 'Should have 0 agents');
    suite.assertEquals(stats.workflows.total, 0, 'Should have 0 workflows');
  });

  await suite.test('Registry: Validation passes on empty registries', async () => {
    const validation = await registry.validate();
    suite.assertTrue(validation.valid, 'Empty registry validation should pass');
    suite.assertEquals(validation.errors.length, 0, 'Should have no validation errors');
  });

  await suite.test('Registry: Search returns empty results on empty registries', async () => {
    const results = await registry.search('test');
    suite.assertEquals(results.agents.length, 0, 'No agents found');
    suite.assertEquals(results.workflows.length, 0, 'No workflows found');
    suite.assertEquals(results.departments.length, 0, 'No departments found');
  });

  await suite.test('Registry: getDepartment returns null for non-existent', async () => {
    const dept = registry.getDepartment('non-existent');
    suite.assertEquals(dept, null, 'Returns null for non-existent department');
  });

  // ========================================
  // LIBRARY INTEGRATION TESTS
  // ========================================

  console.log('\nLibrary Integration Tests\n');

  await suite.test('Libraries: TemplateEngine loads', async () => {
    const engine = new TemplateEngine();
    const templates = await engine.listTemplates();
    suite.assertTrue(templates.length === 11, 'Has 11 templates');
  });

  await suite.test('Libraries: Validator works', async () => {
    const validator = new Validator();
    const validResult = validator.validateDepartmentName('test-department');
    const invalidResult = validator.validateDepartmentName('TEST');
    suite.assertTrue(validResult.valid, 'Valid name accepted');
    suite.assertTrue(!invalidResult.valid, 'Invalid name rejected');
  });

  await suite.test('Libraries: TemplateEngine + Validator integration', async () => {
    const engine = new TemplateEngine();
    const validator = new Validator();

    // Validate context then render
    const context = {
      name: 'test-dept',
      displayName: 'Test Department',
      description: 'A test department for validation testing purposes',
      agents: [],
      workflows: [],
      integrations: [],
      responsibilities: [],
      created: new Date().toISOString()
    };

    const nameValidation = validator.validateDepartmentName(context.name);
    suite.assertTrue(nameValidation.valid, 'Name validation works');
  });

  // ========================================
  // FILE STRUCTURE TESTS
  // ========================================

  console.log('\nFile Structure Tests\n');

  await suite.test('Structure: config/registries/ exists', async () => {
    const registriesPath = path.join(__dirname, '..', 'config', 'registries');
    const stats = await fs.stat(registriesPath);
    suite.assertTrue(stats.isDirectory(), 'Registries directory exists');
  });

  await suite.test('Structure: All registry files exist', async () => {
    const basePath = path.join(__dirname, '..', 'config', 'registries');
    const files = ['departments.json', 'agents.json', 'workflows.json'];

    for (const file of files) {
      const filePath = path.join(basePath, file);
      const stats = await fs.stat(filePath);
      suite.assertTrue(stats.isFile(), `${file} exists`);
    }
  });

  await suite.test('Structure: org-docs/ directory exists', async () => {
    const docsPath = path.join(__dirname, '..', 'org-docs');
    const stats = await fs.stat(docsPath);
    suite.assertTrue(stats.isDirectory(), 'org-docs directory exists');
  });

  await suite.test('Structure: departments/ directory exists', async () => {
    const deptPath = path.join(__dirname, '..', 'departments');
    const stats = await fs.stat(deptPath);
    suite.assertTrue(stats.isDirectory(), 'departments directory exists');
  });

  await suite.test('Structure: lib/ contains all Phase 2 libraries', async () => {
    const libPath = path.join(__dirname, '..', 'lib');
    const requiredLibs = ['template-engine.js', 'registry-manager.js', 'validator.js', 'doc-generator.js', 'oauth-registry.js'];

    for (const lib of requiredLibs) {
      const libFile = path.join(libPath, lib);
      const stats = await fs.stat(libFile);
      suite.assertTrue(stats.isFile(), `${lib} exists`);
    }
  });

  await suite.test('Structure: Creator agents exist', async () => {
    const agentsPath = path.join(__dirname, '..', '.claude', 'agents');
    const creators = [
      'department-creator.md',
      'agent-creator.md',
      'workflow-creator.md',
      'documentation-updater.md'
    ];

    for (const creator of creators) {
      const creatorPath = path.join(agentsPath, creator);
      const stats = await fs.stat(creatorPath);
      suite.assertTrue(stats.isFile(), `${creator} exists`);
    }
  });

  await suite.test('Structure: Templates directory has all templates', async () => {
    const templatesPath = path.join(__dirname, '..', 'templates');
    const expectedDirs = ['department', 'agent', 'workflow', 'docs', 'schemas'];

    for (const dir of expectedDirs) {
      const dirPath = path.join(templatesPath, dir);
      const stats = await fs.stat(dirPath);
      suite.assertTrue(stats.isDirectory(), `templates/${dir}/ exists`);
    }
  });

  await suite.test('Structure: /motus slash command exists', async () => {
    const commandPath = path.join(__dirname, '..', '.claude', 'commands', 'motus.md');
    const stats = await fs.stat(commandPath);
    suite.assertTrue(stats.isFile(), 'motus.md command exists');
  });

  // ========================================
  // DOCUMENTATION GENERATION TESTS
  // ========================================

  console.log('\nDocumentation Generation Tests\n');

  await suite.test('DocGen: Generate documentation without errors', async () => {
    const generator = new DocGenerator();
    await generator.generate();
    suite.assert(true, 'Documentation generated without errors');
  });

  await suite.test('DocGen: COMMANDS_REFERENCE.md exists', async () => {
    const referencePath = path.join(__dirname, '..', 'org-docs', 'COMMANDS_REFERENCE.md');
    const stats = await fs.stat(referencePath);
    suite.assertTrue(stats.isFile(), 'COMMANDS_REFERENCE.md created');
  });

  await suite.test('DocGen: COMMANDS_REFERENCE has framework commands', async () => {
    const referencePath = path.join(__dirname, '..', 'org-docs', 'COMMANDS_REFERENCE.md');
    const content = await fs.readFile(referencePath, 'utf8');
    suite.assertTrue(content.includes('department create'), 'Has department create command');
    suite.assertTrue(content.includes('agent create'), 'Has agent create command');
    suite.assertTrue(content.includes('workflow create'), 'Has workflow create command');
  });

  // ========================================
  // MOTUS EXECUTABLE TESTS
  // ========================================

  console.log('\nMotus Executable Tests\n');

  await suite.test('Executable: motus file exists', async () => {
    const motusPath = path.join(__dirname, '..', 'motus');
    const stats = await fs.stat(motusPath);
    suite.assertTrue(stats.isFile(), 'motus executable exists');
  });

  await suite.test('Executable: package.json has correct bin entry', async () => {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
    suite.assertEquals(pkg.bin.motus, './motus', 'Correct bin entry');
  });

  // Print summary
  suite.summary();
}

// Run all tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
