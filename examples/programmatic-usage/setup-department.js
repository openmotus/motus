#!/usr/bin/env node

/**
 * Programmatic Usage Example
 *
 * Demonstrates using Motus as a library to create departments, agents,
 * and workflows entirely from code — no Claude Code CLI needed.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { RegistryManager, Validator } = require('../../index');

async function main() {
  // Create a temporary working directory so we don't modify the real repo
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motus-example-'));
  console.log(`Working directory: ${tmpDir}\n`);

  // Ensure required subdirectories exist
  fs.mkdirSync(path.join(tmpDir, '.claude', 'agents'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'config', 'registries'), { recursive: true });

  // Copy templates from the project root so the template engine can find them
  const projectRoot = path.join(__dirname, '..', '..');
  copyDirSync(path.join(projectRoot, 'templates'), path.join(tmpDir, 'templates'));

  // ─── 1. Initialize the registry ───────────────────────────────
  const registry = new RegistryManager(tmpDir);
  await registry.load();
  console.log('Registry loaded.\n');

  // ─── 2. Validate names before creating ────────────────────────
  const validator = new Validator();

  const deptCheck = validator.validateDepartmentName('devops');
  console.log(`Department name "devops" valid: ${deptCheck.valid}`);

  const agentCheck = validator.validateAgentName('health-checker');
  console.log(`Agent name "health-checker" valid: ${agentCheck.valid}\n`);

  // ─── 3. Create a department ───────────────────────────────────
  const dept = await registry.addDepartment({
    name: 'devops',
    displayName: 'DevOps',
    description: 'Infrastructure monitoring, deployment automation, and incident response'
  });
  console.log(`Created department: ${dept.displayName}`);

  // ─── 4. Add agents ────────────────────────────────────────────
  const fetcher = await registry.addAgent({
    name: 'health-checker',
    displayName: 'Health Checker',
    department: 'devops',
    type: 'data-fetcher',
    description: 'Fetches health status from monitoring endpoints',
    tools: ['Bash', 'Read']
  });
  console.log(`  + Agent: ${fetcher.displayName} (${fetcher.type})`);

  const analyzer = await registry.addAgent({
    name: 'incident-analyzer',
    displayName: 'Incident Analyzer',
    department: 'devops',
    type: 'specialist',
    description: 'Analyzes incidents and suggests root causes',
    tools: ['Read', 'Write']
  });
  console.log(`  + Agent: ${analyzer.displayName} (${analyzer.type})`);

  const orchestrator = await registry.addAgent({
    name: 'deploy-coordinator',
    displayName: 'Deploy Coordinator',
    department: 'devops',
    type: 'orchestrator',
    description: 'Coordinates deployment across environments',
    tools: ['Task', 'Read', 'Write']
  });
  console.log(`  + Agent: ${orchestrator.displayName} (${orchestrator.type})\n`);

  // ─── 5. Create a workflow ─────────────────────────────────────
  const workflow = await registry.addWorkflow({
    name: 'status-report',
    displayName: 'Status Report',
    department: 'devops',
    description: 'Collects health data and produces an incident summary',
    agents: ['health-checker', 'incident-analyzer'],
    trigger: { type: 'scheduled', schedule: 'every 4 hours' },
    output: { type: 'file', destination: 'reports/status.md' },
    estimatedDuration: '2 minutes'
  });
  console.log(`Created workflow: ${workflow.displayName}`);
  console.log(`  Trigger: ${workflow.trigger.type} (${workflow.trigger.schedule})`);
  console.log(`  Agents: ${workflow.agents.join(', ')}\n`);

  // ─── 6. Search the registry ───────────────────────────────────
  const results = await registry.search('health');
  console.log(`Search "health" found:`);
  console.log(`  ${results.agents.length} agent(s): ${results.agents.map(a => a.name).join(', ')}`);
  console.log(`  ${results.workflows.length} workflow(s)`);
  console.log(`  ${results.departments.length} department(s)\n`);

  // ─── 7. Get statistics ────────────────────────────────────────
  const stats = await registry.getStatistics();
  console.log('Statistics:');
  console.log(`  Departments: ${stats.departments.total}`);
  console.log(`  Agents: ${stats.agents.total} (${stats.agents.byType['data-fetcher']} fetchers, ${stats.agents.byType['specialist']} specialists, ${stats.agents.byType['orchestrator']} orchestrators)`);
  console.log(`  Workflows: ${stats.workflows.total}\n`);

  // ─── 8. Validate integrity ────────────────────────────────────
  const validation = await registry.validate();
  console.log(`Registry integrity: ${validation.valid ? 'VALID' : 'ERRORS FOUND'}`);
  if (!validation.valid) {
    validation.errors.forEach(e => console.log(`  - ${e}`));
  }

  // ─── 9. Export ────────────────────────────────────────────────
  const exported = await registry.export();
  console.log(`\nExported ${Object.keys(exported.departments.departments).length} department(s), ${Object.keys(exported.agents.agents).length} agent(s), ${Object.keys(exported.workflows.workflows).length} workflow(s)`);

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('\nDone! Temp files cleaned up.');
}

/** Recursively copy a directory. */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
