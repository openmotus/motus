#!/usr/bin/env node

/**
 * Documentation Generator
 *
 * Generates all Motus documentation from registries:
 * - COMMANDS_REFERENCE.md (master command list)
 * - Department documentation (one per department)
 * - Updates CLAUDE.md statistics
 */

const fs = require('fs').promises;
const path = require('path');
const RegistryManager = require('./registry-manager');

class DocGenerator {
  constructor() {
    this.basePath = path.join(__dirname, '..');
    this.registry = new RegistryManager();
    this.docsPath = path.join(this.basePath, 'org-docs');
    this.deptDocsPath = path.join(this.docsPath, 'departments');
  }

  async generate() {
    console.log('📚 Generating documentation from registries...\n');

    // Load registries
    await this.registry.load();

    // Ensure directories exist
    await fs.mkdir(this.docsPath, { recursive: true });
    await fs.mkdir(this.deptDocsPath, { recursive: true });

    // Generate all docs
    await this.generateCommandsReference();
    await this.generateDepartmentDocs();
    await this.updateClaudeMd();

    console.log('\n✅ Documentation generation complete!');
  }

  async generateCommandsReference() {
    console.log('Generating COMMANDS_REFERENCE.md...');

    const departments = await this.registry.listDepartments();
    const stats = await this.registry.getStatistics();

    let content = `# Motus Commands Reference

Auto-generated from registries on ${new Date().toISOString()}

## System Overview

- **Total Departments**: ${stats.departments.total}
- **Total Agents**: ${stats.agents.total}
- **Total Workflows**: ${stats.workflows.total}

## Quick Start Commands

\`\`\`bash
# Daily commands
/motus daily-brief          # Morning briefing
/motus daily-notion         # Briefing to Notion
/motus evening-report       # Evening summary

# Life management
/motus life calendar        # Today's schedule
/motus life emails          # Important emails
/motus life tasks           # Prioritized tasks

# Creation commands
/motus department create    # New department
/motus [dept] agent create  # New agent
/motus [dept] workflow create # New workflow
\`\`\`

## Departments

`;

    for (const dept of departments) {
      const agents = await this.registry.listAgentsByDepartment(dept.name);
      const workflows = await this.registry.listWorkflowsByDepartment(dept.name);

      content += `### ${dept.displayName}\n\n`;
      content += `${dept.description}\n\n`;
      content += `- **Agents**: ${agents.length}\n`;
      content += `- **Workflows**: ${workflows.length}\n`;
      content += `- **Status**: ${dept.status}\n\n`;

      if (workflows.length > 0) {
        content += `**Available Workflows:**\n`;
        for (const workflow of workflows) {
          content += `- \`/motus ${dept.name} ${workflow.name}\` - ${workflow.description}\n`;
        }
        content += '\n';
      }

      content += `[View full documentation](departments/${dept.name}-department.md)\n\n`;
    }

    content += `## Creation Commands

### Department Management

\`\`\`bash
/motus department create [name]    # Create new department
/motus department list              # List all departments
/motus department info [name]       # Department details
\`\`\`

### Agent Management

\`\`\`bash
/motus [dept] agent create [name]   # Create new agent
/motus [dept] agent list            # List department agents
/motus [dept] agent info [name]     # Agent details
\`\`\`

### Workflow Management

\`\`\`bash
/motus [dept] workflow create [name]  # Create new workflow
/motus [dept] workflow list           # List department workflows
/motus [dept] workflow info [name]    # Workflow details
\`\`\`

### Documentation

\`\`\`bash
/motus docs update                  # Regenerate all documentation
/motus docs show                    # Display this reference
\`\`\`

## Agent Types

### Data Fetchers (${stats.agents.byType['data-fetcher'] || 0})
Retrieve data from APIs and external sources

### Orchestrators (${stats.agents.byType['orchestrator'] || 0})
Coordinate multiple agents in workflows

### Specialists (${stats.agents.byType['specialist'] || 0})
Perform specialized analysis and processing

---

*This document is auto-generated from \`config/registries/\`. Do not edit manually.*
*Last updated: ${new Date().toISOString()}*
`;

    const outputPath = path.join(this.docsPath, 'COMMANDS_REFERENCE.md');
    await fs.writeFile(outputPath, content);
    console.log(`  ✓ Created ${outputPath}`);
  }

  async generateDepartmentDocs() {
    const departments = await this.registry.listDepartments();

    for (const dept of departments) {
      console.log(`Generating ${dept.name}-department.md...`);

      const agents = await this.registry.listAgentsByDepartment(dept.name);
      const workflows = await this.registry.listWorkflowsByDepartment(dept.name);

      let content = `# ${dept.displayName}

${dept.description}

**Created**: ${new Date(dept.created).toLocaleDateString()}
**Status**: ${dept.status}
**Version**: ${dept.version}

## Overview

- **Total Agents**: ${agents.length}
- **Total Workflows**: ${workflows.length}
- **Integrations**: ${dept.integrations?.length || 0}

## Responsibilities

`;

      if (dept.responsibilities && dept.responsibilities.length > 0) {
        for (const resp of dept.responsibilities) {
          content += `### ${resp.title}\n\n`;
          for (const task of resp.tasks) {
            content += `- ${task}\n`;
          }
          content += '\n';
        }
      }

      content += `## Agents (${agents.length})

`;

      const agentsByType = {
        'orchestrator': agents.filter(a => a.type === 'orchestrator'),
        'data-fetcher': agents.filter(a => a.type === 'data-fetcher'),
        'specialist': agents.filter(a => a.type === 'specialist')
      };

      for (const [type, typeAgents] of Object.entries(agentsByType)) {
        if (typeAgents.length > 0) {
          content += `### ${type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (${typeAgents.length})\n\n`;
          for (const agent of typeAgents) {
            content += `#### ${agent.displayName}\n`;
            content += `- **Name**: \`${agent.name}\`\n`;
            content += `- **Description**: ${agent.description}\n`;
            content += `- **Tools**: ${agent.tools.join(', ')}\n`;
            if (agent.usedInWorkflows.length > 0) {
              content += `- **Used in workflows**: ${agent.usedInWorkflows.join(', ')}\n`;
            }
            content += '\n';
          }
        }
      }

      content += `## Workflows (${workflows.length})

`;

      for (const workflow of workflows) {
        content += `### ${workflow.displayName}\n\n`;
        content += `${workflow.description}\n\n`;
        content += `- **Trigger**: ${workflow.trigger.type}`;
        if (workflow.trigger.schedule) {
          content += ` (${workflow.trigger.schedule})`;
        }
        content += '\n';
        content += `- **Agents**: ${workflow.agents.length}\n`;
        content += `- **Estimated Duration**: ${workflow.estimatedDuration}\n`;
        content += `- **Output**: ${workflow.output.type}`;
        if (workflow.output.destination) {
          content += ` → ${workflow.output.destination}`;
        }
        content += '\n\n';

        if (workflow.steps && workflow.steps.length > 0) {
          content += `**Steps:**\n\n`;
          for (const step of workflow.steps) {
            const stepNum = step.group;
            const execType = step.parallel ? 'Parallel' : 'Sequential';
            content += `${stepNum}. **${execType} Execution**\n`;
            for (const agent of step.agents) {
              content += `   - \`${agent.name}\`: ${agent.prompt}\n`;
            }
            content += '\n';
          }
        } else {
          content += `**Agents:** ${workflow.agents.join(', ')}\n\n`;
        }

        content += `**Run this workflow:**\n\`\`\`bash\n/motus ${dept.name} ${workflow.name}\n\`\`\`\n\n`;
      }

      if (dept.integrations && dept.integrations.length > 0) {
        content += `## Integrations

This department requires the following integrations to function properly:

`;
        for (const integration of dept.integrations) {
          content += this.generateIntegrationDocs(integration, dept.name);
        }

        content += `### Setup Verification

After configuring integrations, verify they work:

\`\`\`bash
# Test all integrations for this department
/motus ${dept.name} test-integrations

# Or test specific workflows that use integrations
${workflows.filter(w => w.trigger.type === 'manual').slice(0, 1).map(w => `/motus ${dept.name} ${w.name}`).join('\n')}
\`\`\`

`;
      }

      content += `---

*This document is auto-generated from \`config/registries/\`. Do not edit manually.*
*Last updated: ${new Date().toISOString()}*
`;

      const outputPath = path.join(this.deptDocsPath, `${dept.name}-department.md`);
      await fs.writeFile(outputPath, content);
      console.log(`  ✓ Created ${outputPath}`);
    }
  }

  generateIntegrationDocs(integration, departmentName) {
    let content = `### ${integration.name}\n\n`;

    // OAuth2 integrations
    if (integration.type === 'oauth2') {
      content += `**Type:** OAuth 2.0 (Automatic Authorization)\n\n`;
      content += `#### Quick Setup (Recommended)\n\n`;
      content += `1. **Start the OAuth Manager**\n`;
      content += `   \`\`\`bash\n`;
      content += `   ./start-oauth-manager.sh\n`;
      content += `   \`\`\`\n\n`;
      content += `2. **Open in your browser:** http://localhost:3001\n\n`;
      content += `3. **Click "Connect"** on the ${integration.name} card\n\n`;
      content += `4. **Authorize the application** when redirected\n\n`;
      content += `5. **Verify connection** by clicking "Test" button\n\n`;

      content += `#### Manual Setup (Advanced)\n\n`;
      content += `If you prefer manual configuration:\n\n`;
      content += `1. **Get OAuth Credentials**\n`;
      content += `   - ${integration.setup}\n`;
      content += `   - You'll need a Client ID and Client Secret\n\n`;
      content += `2. **Add to .env file**\n`;
      content += `   \`\`\`bash\n`;
      for (const envVar of integration.envVars) {
        content += `   ${envVar}=your_${envVar.toLowerCase().replace(/_/g, '_')}_here\n`;
      }
      content += `   \`\`\`\n\n`;
      content += `3. **Restart OAuth Manager** to pick up new credentials\n\n`;
      content += `4. **Follow Quick Setup steps** above to authorize\n\n`;

      // API key integrations
    } else if (integration.type === 'api-key') {
      content += `**Type:** API Key\n\n`;
      content += `#### Setup Instructions\n\n`;
      content += `1. **Get your API key**\n`;
      content += `   - ${integration.setup}\n`;
      if (integration.setupUrl) {
        content += `   - ${integration.setupUrl}\n`;
      }
      content += `\n`;
      content += `2. **Add to .env file**\n`;
      content += `   \`\`\`bash\n`;
      for (const envVar of integration.envVars) {
        content += `   ${envVar}=your_api_key_here\n`;
      }
      content += `   \`\`\`\n\n`;
      content += `3. **Verify the API key works**\n`;
      content += `   \`\`\`bash\n`;
      content += `   # Test that the environment variable is set\n`;
      content += `   echo $${integration.envVars[0]}\n`;
      content += `   \`\`\`\n\n`;
    }

    content += `**Required Environment Variables:**\n`;
    for (const envVar of integration.envVars) {
      content += `- \`${envVar}\`\n`;
    }
    content += `\n`;

    // Common troubleshooting
    content += `**Troubleshooting:**\n`;
    content += `- Make sure .env file is in the project root: \`/Users/ianwinscom/motus/.env\`\n`;
    content += `- Restart any running services after updating .env\n`;
    content += `- Check that environment variables are loaded: \`node -e "require('dotenv').config(); console.log(process.env.${integration.envVars[0]})"\`\n`;
    if (integration.type === 'oauth2') {
      content += `- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager\n`;
      content += `- Check token file exists: \`~/.motus/${integration.name.toLowerCase().replace(/\s/g, '-')}-token.json\`\n`;
    }
    content += `\n`;

    return content;
  }

  async updateClaudeMd() {
    console.log('Updating CLAUDE.md statistics...');

    const stats = await this.registry.getStatistics();
    const claudePath = path.join(this.basePath, 'CLAUDE.md');

    // For now, just log that we would update it
    // In a real implementation, we'd use Edit operations to update specific sections
    console.log(`  ℹ  CLAUDE.md statistics:`);
    console.log(`     - Departments: ${stats.departments.total}`);
    console.log(`     - Agents: ${stats.agents.total}`);
    console.log(`     - Workflows: ${stats.workflows.total}`);
    console.log(`  ℹ  (CLAUDE.md auto-update not implemented yet - update manually if needed)`);
  }
}

// CLI execution
if (require.main === module) {
  const generator = new DocGenerator();
  generator.generate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error generating documentation:', error);
      process.exit(1);
    });
}

module.exports = DocGenerator;
