# Standardized Department, Agent & Workflow Creation System - Master Plan

**Created:** October 08, 2025
**Status:** Ready for Implementation
**Goal:** Fully automated, wizard-driven system for consistently generating departments, agents, and workflows with zero manual file editing required.

---

## Table of Contents

1. [Overview](#overview)
2. [Command Structure](#command-structure)
3. [Architecture Design](#architecture-design)
4. [Implementation Phases](#implementation-phases)
5. [File Structure](#file-structure)
6. [Example Workflows](#example-workflows)
7. [Template Specifications](#template-specifications)
8. [Registry System](#registry-system)
9. [Validation Rules](#validation-rules)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### The Problem
Currently, creating new departments, agents, and workflows requires:
- Manual file creation and editing
- Deep knowledge of file structure
- Copying and modifying existing files
- Updating multiple files (commands, registries, docs)
- High risk of inconsistency and errors

### The Solution
A fully automated creation system with:
- **Interactive wizards** that ask smart questions
- **Template-based generation** ensuring consistency
- **Intelligent defaults** based on department type
- **Automatic validation** before saving
- **Self-updating documentation**
- **Registry tracking** of all components

### Key Principles
1. **Zero Manual Editing** - Everything auto-generated from wizards
2. **Intelligent Defaults** - System suggests relevant agents/workflows
3. **Validation First** - Test before saving
4. **Self-Documenting** - Docs update automatically
5. **Type-Aware** - Different templates for different agent types
6. **Registry-Driven** - Central source of truth

---

## Command Structure

### Department Management Commands
```bash
/motus department create [name]           # Interactive wizard creates full department
/motus department list                    # Show all departments with stats
/motus department info [name]             # Show department details and components
/motus department delete [name]           # Remove department (with confirmation)
```

### Agent Management Commands
```bash
/motus [department] agent create [name]   # Wizard creates agent in department
/motus [department] agent list            # List department's agents
/motus [department] agent info [name]     # Show agent details
/motus [department] agent edit [name]     # Edit agent definition
/motus [department] agent delete [name]   # Remove agent (with confirmation)
```

### Workflow Management Commands
```bash
/motus [department] workflow create [name] # Wizard creates workflow
/motus [department] workflow list          # List department workflows
/motus [department] workflow info [name]   # Show workflow details
/motus [department] workflow edit [name]   # Edit workflow definition
/motus [department] workflow delete [name] # Remove workflow
```

### Documentation Commands
```bash
/motus docs update                         # Regenerate all documentation
/motus docs show                           # Display command reference
/motus docs export                         # Export docs to markdown
```

---

## Architecture Design

### Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│              COMMAND LAYER                      │
│         (/motus [command] [action])             │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│           CREATOR AGENTS LAYER                  │
│  (Interactive wizards with validation)          │
│  - department-creator                           │
│  - agent-creator                                │
│  - workflow-creator (enhanced)                  │
│  - documentation-updater                        │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         TEMPLATE ENGINE LAYER                   │
│  (Handlebars with smart helpers)                │
│  - Renders templates with context               │
│  - Applies naming conventions                   │
│  - Validates generated content                  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│            REGISTRY LAYER                       │
│  (Central source of truth)                      │
│  - departments.json                             │
│  - agents.json                                  │
│  - workflows.json                               │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│          VALIDATION LAYER                       │
│  (Ensures quality before saving)                │
│  - Syntax validation                            │
│  - Naming convention checks                     │
│  - Dependency verification                      │
│  - Test execution                               │
└─────────────────────────────────────────────────┘
```

### Data Flow: Creating a Department

```
User: /motus department create marketing
    │
    ▼
┌─────────────────────────────────────────┐
│  motus.md routes to department-creator  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    Interactive Wizard Questions:        │
│  1. Department purpose?                 │
│  2. Main workflows?                     │
│  3. Required integrations?              │
│  4. Starter agents needed?              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│   Template Engine Renders:              │
│  - marketing-admin.md                   │
│  - marketing-orchestrator.md            │
│  - trend-analyzer.md                    │
│  - content-creator.md                   │
│  - campaign-tracker.md                  │
│  - analytics-fetcher.md + .js           │
│  - daily-trends.json workflow           │
│  - content-pipeline.json workflow       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Validation Checks:               │
│  ✓ Syntax valid                         │
│  ✓ Naming conventions followed          │
│  ✓ No duplicate names                   │
│  ✓ Required fields present              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│        Files Saved:                      │
│  .claude/agents/ (5 agents)             │
│  life-admin/departments/marketing/      │
│  triggers/motus-marketing-*.sh          │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│       Registry Updated:                  │
│  config/registries/departments.json     │
│  config/registries/agents.json          │
│  config/registries/workflows.json       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    Documentation Generated:              │
│  org-docs/departments/marketing.md      │
│  org-docs/COMMANDS_REFERENCE.md updated │
│  CLAUDE.md updated                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Confirmation Message to User:           │
│  ✅ Marketing Department Created         │
│  - 5 agents generated                    │
│  - 2 workflows configured                │
│  - Documentation updated                 │
│  - Ready to use!                         │
│                                          │
│  Try: /motus marketing daily-trends      │
└─────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Template System Foundation (Week 1)

**Objective:** Build the template engine and create all necessary templates

#### Tasks:
1. **Install Handlebars**
   ```bash
   npm install handlebars
   ```

2. **Create Template Engine** (`/lib/template-engine.js`)
   - Load and compile Handlebars templates
   - Custom helpers for:
     - `kebabCase` - Convert to kebab-case
     - `pascalCase` - Convert to PascalCase
     - `camelCase` - Convert to camelCase
     - `capitalize` - Capitalize first letter
     - `timestamp` - Current ISO timestamp
     - `agentList` - Format agent arrays
   - Context merging and variable substitution
   - Error handling for missing variables

3. **Create Template Files**

   **Department Templates** (`/templates/department/`):
   - `department-agent.md.hbs` - Main department master agent
   - `orchestrator-agent.md.hbs` - Department orchestrator
   - `department-readme.md.hbs` - Department documentation

   **Agent Templates** (`/templates/agent/`):
   - `data-fetcher-agent.md.hbs` - Simple data collection agent
   - `data-fetcher-script.js.hbs` - Corresponding Node.js script
   - `orchestrator-agent.md.hbs` - Workflow orchestrator
   - `specialist-agent.md.hbs` - Complex department agent
   - `specialist-script.js.hbs` - Complex implementation script

   **Workflow Templates** (`/templates/workflow/`):
   - `workflow-config.json.hbs` - Workflow definition
   - `workflow-trigger.sh.hbs` - Trigger script for automation

   **Documentation Templates** (`/templates/docs/`):
   - `department-docs.md.hbs` - Per-department documentation
   - `commands-reference.md.hbs` - Master command reference

4. **Create Template Variables Schema** (`/templates/schemas/`)
   - `department-schema.json` - Required variables for departments
   - `agent-schema.json` - Required variables for agents
   - `workflow-schema.json` - Required variables for workflows

#### Deliverables:
- ✅ Template engine with helpers
- ✅ 10+ template files
- ✅ Schema definitions
- ✅ Template rendering tests

---

### Phase 2: Creator Agents (Week 2)

**Objective:** Build the 4 specialized creator agents

#### 2.1 Department Creator Agent

**File:** `/.claude/agents/department-creator.md`

**Capabilities:**
- Interactive wizard with smart questions
- Department type detection (business, creative, technical, operational)
- Auto-suggests agents based on type
- Auto-suggests workflows based on type
- Validates department name (unique, kebab-case)
- Generates complete department structure

**Wizard Flow:**
```
1. "What is the department name?"
   → Validates: lowercase, no spaces, unique

2. "What is the primary purpose of this department?"
   → Analyzes to determine type

3. "What external services will this department integrate with?"
   → Examples: Google Analytics, Twitter, Stripe, etc.
   → Suggests relevant API environment variables

4. "What are the main workflows for this department?"
   → Auto-suggests based on type:
     - Business: pipeline-review, performance-metrics, client-updates
     - Creative: content-pipeline, trend-analysis, campaign-planning
     - Technical: code-review, deployment-tracking, bug-analysis
   → User can accept, modify, or add custom

5. "Which starter agents should be created?"
   → Auto-suggests based on workflows:
     - For pipeline-review: crm-fetcher, deal-analyzer
     - For content-pipeline: content-creator, trend-analyzer
   → Shows ~5 suggestions, user selects

6. "Generate department now?"
   → Shows summary of what will be created
   → Confirms before generation
```

**Generated Files:**
```
.claude/agents/
  ├── [dept]-admin.md
  ├── [dept]-orchestrator.md
  ├── [agent1].md
  ├── [agent2].md
  └── ...

life-admin/departments/[dept]/
  ├── agents/
  │   ├── [agent1].js
  │   └── [agent2].js
  └── workflows/
      ├── [workflow1].json
      └── [workflow2].json

triggers/
  ├── motus-[dept]-[workflow1].sh
  └── motus-[dept]-[workflow2].sh

org-docs/departments/
  └── [dept]-department.md
```

**Post-Generation Actions:**
- Updates `config/registries/departments.json`
- Updates `config/registries/agents.json`
- Updates `config/registries/workflows.json`
- Updates `.claude/commands/motus.md` with new commands
- Triggers `documentation-updater` agent
- Returns confirmation with next steps

#### 2.2 Agent Creator Agent

**File:** `/.claude/agents/agent-creator.md`

**Capabilities:**
- Auto-detects agent type (fetcher/orchestrator/specialist)
- Generates agent definition
- Generates implementation script (if needed)
- Updates department orchestrator to include new agent
- Validates no naming conflicts

**Wizard Flow:**
```
1. "Which department is this agent for?"
   → Lists available departments
   → Validates department exists

2. "What is the agent name?"
   → Suggests format: [action]-[noun] (e.g., trend-analyzer)
   → Validates: unique within department, kebab-case

3. "What does this agent do?" (description)
   → Analyzes to determine agent type:
     - Contains "fetch", "get", "retrieve" → Data Fetcher
     - Contains "orchestrate", "coordinate" → Orchestrator
     - Complex description → Specialist

4. "Does this agent need to call an external API?"
   → If YES: "Which API?" → Suggests environment variables needed
   → If NO: Skip script generation (agent uses other tools)

5. "What tools does this agent need?"
   → Auto-suggests based on type:
     - Data Fetcher: Bash, Read
     - Orchestrator: Task, Read, Write
     - Specialist: Task, Read, Write, Edit, Bash, WebSearch
   → User can modify

6. "Generate agent now?"
   → Shows summary
   → Confirms before generation
```

**Type Detection Logic:**
```javascript
function detectAgentType(description) {
  const lowerDesc = description.toLowerCase();

  // Data Fetcher patterns
  if (lowerDesc.match(/\b(fetch|get|retrieve|pull|read)\b.*\b(data|info|from|api)\b/)) {
    return 'data-fetcher';
  }

  // Orchestrator patterns
  if (lowerDesc.match(/\b(orchestrate|coordinate|manage|combine)\b.*\b(agents|workflow|process)\b/)) {
    return 'orchestrator';
  }

  // Default to specialist for complex tasks
  return 'specialist';
}
```

**Generated Files:**
```
.claude/agents/
  └── [agent-name].md

life-admin/departments/[dept]/agents/
  └── [agent-name].js (if API integration)
```

**Post-Generation Actions:**
- Updates `config/registries/agents.json`
- Updates `[dept]-orchestrator.md` to include agent in workflow options
- Updates department documentation
- Triggers `documentation-updater`
- Returns confirmation

#### 2.3 Enhanced Workflow Creator Agent

**File:** `/.claude/agents/workflow-creator.md` (enhanced version)

**New Capabilities:**
- Visual step builder
- Agent selection from department's registered agents
- Parallel vs sequential auto-detection
- Dependency validation
- Scheduling configuration
- Trigger script generation

**Wizard Flow:**
```
1. "Which department is this workflow for?"
   → Lists departments

2. "What is the workflow name?"
   → Validates: unique, kebab-case

3. "What is the workflow's purpose?"
   → Records description

4. "How should this workflow be triggered?"
   → Options:
     a) Manual - run on demand
     b) Scheduled - specific time
     c) Event-based - calendar/condition
   → If scheduled: "When? (e.g., 'daily 9am', 'weekly Monday 10am')"

5. "Let's build the workflow steps..."

   For each step:
   a) "What should step X accomplish?"
   b) "Which agent should handle this?"
      → Shows department's agents
      → Can select from list or describe new agent
   c) "What specific action?"
      → Records prompt for agent
   d) "Can this run in parallel with previous steps?"
      → If YES: Add to current parallel group
      → If NO: Start new sequential step

   e) "Add another step?"
      → If YES: Repeat
      → If NO: Continue

6. "What should the workflow output?"
   → Options: Obsidian note, Notion page, Console, Email

7. "Generate workflow now?"
   → Shows visual diagram
   → Confirms
```

**Parallel Detection:**
```javascript
function canRunInParallel(currentStep, previousSteps) {
  // Check if current step depends on any previous step's output
  const dependencies = analyzeDependencies(currentStep, previousSteps);
  return dependencies.length === 0;
}
```

**Generated Files:**
```
life-admin/departments/[dept]/workflows/
  └── [workflow-name].json

triggers/
  └── motus-[dept]-[workflow].sh (if scheduled)
```

**Workflow JSON Format:**
```json
{
  "name": "workflow-name",
  "department": "department-name",
  "description": "What this workflow does",
  "trigger": {
    "type": "scheduled|manual|event",
    "schedule": "daily 9:00" // if scheduled
  },
  "steps": [
    {
      "group": 1,
      "parallel": true,
      "agents": [
        {
          "name": "agent-1",
          "prompt": "Specific instruction for agent"
        },
        {
          "name": "agent-2",
          "prompt": "Specific instruction for agent"
        }
      ]
    },
    {
      "group": 2,
      "parallel": false,
      "agents": [
        {
          "name": "processor-agent",
          "prompt": "Process combined data from group 1"
        }
      ]
    }
  ],
  "output": {
    "type": "obsidian|notion|console",
    "destination": "path/to/output"
  }
}
```

**Post-Generation Actions:**
- Updates `config/registries/workflows.json`
- Updates department documentation
- If scheduled: Adds to cron via `install-cron.sh`
- Triggers `documentation-updater`
- Returns confirmation with run command

#### 2.4 Documentation Updater Agent

**File:** `/.claude/agents/documentation-updater.md`

**Capabilities:**
- Monitors registry changes
- Generates department-specific docs
- Updates master command reference
- Updates CLAUDE.md
- Validates all documentation links

**Process:**
```
1. Read all registries:
   - departments.json
   - agents.json
   - workflows.json

2. For each department:
   - Generate /org-docs/departments/[dept].md
   - Include: purpose, agents list, workflows, commands, examples

3. Generate master reference:
   - /org-docs/COMMANDS_REFERENCE.md
   - Table of contents
   - Grouped by department
   - All available commands with descriptions

4. Update CLAUDE.md:
   - Add new departments to architecture section
   - Add new agents to key agents list
   - Update command examples

5. Validate:
   - Check all internal links
   - Verify file paths
   - Test example commands

6. Return summary of updated files
```

**Generated Files:**
```
org-docs/
  ├── COMMANDS_REFERENCE.md
  └── departments/
      ├── life-department.md
      ├── marketing-department.md
      └── [other-departments].md

CLAUDE.md (updated)
```

#### Deliverables:
- ✅ 4 creator agents fully implemented
- ✅ All wizards tested
- ✅ Documentation auto-generation working
- ✅ Registry updates automated

---

### Phase 3: Registry & Validation System (Week 3)

**Objective:** Build the central registry system and validation framework

#### 3.1 Registry Structure

**File:** `/config/registries/departments.json`

```json
{
  "departments": {
    "life": {
      "name": "Life Department",
      "displayName": "Life Management",
      "description": "Personal life automation - health, calendar, tasks, goals",
      "created": "2025-08-26T00:00:00Z",
      "createdBy": "system",
      "version": "1.0.0",
      "status": "active",
      "agents": [
        "life-admin",
        "daily-planner",
        "health-tracker",
        "finance-manager",
        "goal-tracker",
        "content-curator"
      ],
      "workflows": [
        "morning-briefing",
        "evening-review",
        "weekly-planning",
        "monthly-review"
      ],
      "integrations": [
        {
          "name": "Google Calendar",
          "type": "oauth2",
          "envVars": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]
        },
        {
          "name": "WeatherAPI",
          "type": "api-key",
          "envVars": ["WEATHER_API_KEY", "WEATHER_API_URL"]
        },
        {
          "name": "Obsidian",
          "type": "file-system",
          "envVars": ["OBSIDIAN_VAULT_PATH"]
        },
        {
          "name": "Notion",
          "type": "api-key",
          "envVars": ["NOTION_API_KEY", "NOTION_DATABASE_ID"]
        }
      ],
      "commands": [
        "/motus life briefing",
        "/motus life review",
        "/motus life calendar",
        "/motus life tasks"
      ]
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2025-10-08T19:20:00Z",
    "totalDepartments": 1
  }
}
```

**File:** `/config/registries/agents.json`

```json
{
  "agents": {
    "weather-fetcher": {
      "name": "weather-fetcher",
      "displayName": "Weather Data Fetcher",
      "department": "life",
      "type": "data-fetcher",
      "description": "Fetches current weather and forecast from WeatherAPI",
      "created": "2025-08-26T00:00:00Z",
      "version": "1.0.0",
      "status": "active",
      "tools": ["Bash", "Read"],
      "model": "sonnet",
      "script": "/life-admin/weather-fetcher.js",
      "requiredEnvVars": ["WEATHER_API_KEY", "WEATHER_API_URL", "WEATHER_LOCATION"],
      "integrations": ["WeatherAPI"],
      "usedInWorkflows": ["morning-briefing", "daily-notion"],
      "parallelCompatible": true
    },
    "daily-brief-orchestrator": {
      "name": "daily-brief-orchestrator",
      "displayName": "Daily Briefing Orchestrator",
      "department": "life",
      "type": "orchestrator",
      "description": "Coordinates parallel execution of morning briefing agents",
      "created": "2025-08-26T00:00:00Z",
      "version": "1.0.0",
      "status": "active",
      "tools": ["Task", "Read", "Write"],
      "model": "sonnet",
      "script": null,
      "orchestrates": [
        "weather-fetcher",
        "calendar-fetcher",
        "email-processor",
        "task-compiler",
        "oura-fetcher"
      ],
      "usedInWorkflows": ["morning-briefing"],
      "parallelCompatible": false
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2025-10-08T19:20:00Z",
    "totalAgents": 26,
    "byType": {
      "data-fetcher": 12,
      "orchestrator": 4,
      "specialist": 10
    },
    "byDepartment": {
      "life": 26
    }
  }
}
```

**File:** `/config/registries/workflows.json`

```json
{
  "workflows": {
    "morning-briefing": {
      "name": "morning-briefing",
      "displayName": "Morning Briefing",
      "department": "life",
      "description": "Complete morning briefing with weather, calendar, emails, tasks",
      "created": "2025-08-26T00:00:00Z",
      "version": "1.0.0",
      "status": "active",
      "orchestrator": "daily-brief-orchestrator",
      "agents": [
        "weather-fetcher",
        "calendar-fetcher",
        "email-processor",
        "task-compiler",
        "oura-fetcher",
        "insight-generator",
        "note-creator"
      ],
      "trigger": {
        "type": "scheduled",
        "schedule": "daily 06:00",
        "timezone": "Asia/Bangkok",
        "enabled": true
      },
      "output": {
        "type": "obsidian",
        "path": "${OBSIDIAN_VAULT_PATH}/Daily/"
      },
      "estimatedDuration": "8-10 seconds",
      "lastRun": "2025-10-08T06:00:00Z",
      "runCount": 43,
      "successRate": 0.98
    }
  },
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2025-10-08T19:20:00Z",
    "totalWorkflows": 8,
    "byDepartment": {
      "life": 8
    },
    "byTriggerType": {
      "scheduled": 4,
      "manual": 4
    }
  }
}
```

#### 3.2 Registry Manager

**File:** `/lib/registry-manager.js`

```javascript
/**
 * Registry Manager - CRUD operations for all registries
 */

const fs = require('fs').promises;
const path = require('path');

class RegistryManager {
  constructor() {
    this.registryDir = path.join(__dirname, '..', 'config', 'registries');
    this.departments = null;
    this.agents = null;
    this.workflows = null;
  }

  // Load all registries
  async load() {
    const [departments, agents, workflows] = await Promise.all([
      this.loadJSON('departments.json'),
      this.loadJSON('agents.json'),
      this.loadJSON('workflows.json')
    ]);

    this.departments = departments;
    this.agents = agents;
    this.workflows = workflows;
  }

  // Department operations
  async addDepartment(departmentData) {
    if (!this.departments) await this.load();

    const id = departmentData.name;
    if (this.departments.departments[id]) {
      throw new Error(`Department ${id} already exists`);
    }

    this.departments.departments[id] = {
      ...departmentData,
      created: new Date().toISOString(),
      version: '1.0.0',
      status: 'active'
    };

    this.departments.metadata.totalDepartments++;
    this.departments.metadata.lastUpdated = new Date().toISOString();

    await this.saveJSON('departments.json', this.departments);
    return this.departments.departments[id];
  }

  async getDepartment(name) {
    if (!this.departments) await this.load();
    return this.departments.departments[name];
  }

  async listDepartments() {
    if (!this.departments) await this.load();
    return Object.values(this.departments.departments);
  }

  async updateDepartment(name, updates) {
    if (!this.departments) await this.load();

    if (!this.departments.departments[name]) {
      throw new Error(`Department ${name} not found`);
    }

    this.departments.departments[name] = {
      ...this.departments.departments[name],
      ...updates,
      updated: new Date().toISOString()
    };

    this.departments.metadata.lastUpdated = new Date().toISOString();
    await this.saveJSON('departments.json', this.departments);
    return this.departments.departments[name];
  }

  // Agent operations
  async addAgent(agentData) {
    if (!this.agents) await this.load();

    const id = agentData.name;
    if (this.agents.agents[id]) {
      throw new Error(`Agent ${id} already exists`);
    }

    this.agents.agents[id] = {
      ...agentData,
      created: new Date().toISOString(),
      version: '1.0.0',
      status: 'active'
    };

    this.agents.metadata.totalAgents++;
    this.agents.metadata.byType[agentData.type]++;
    this.agents.metadata.byDepartment[agentData.department]++;
    this.agents.metadata.lastUpdated = new Date().toISOString();

    await this.saveJSON('agents.json', this.agents);

    // Also update department's agent list
    await this.addAgentToDepartment(agentData.department, id);

    return this.agents.agents[id];
  }

  async getAgent(name) {
    if (!this.agents) await this.load();
    return this.agents.agents[name];
  }

  async listAgentsByDepartment(department) {
    if (!this.agents) await this.load();
    return Object.values(this.agents.agents)
      .filter(agent => agent.department === department);
  }

  // Workflow operations
  async addWorkflow(workflowData) {
    if (!this.workflows) await this.load();

    const id = workflowData.name;
    if (this.workflows.workflows[id]) {
      throw new Error(`Workflow ${id} already exists`);
    }

    this.workflows.workflows[id] = {
      ...workflowData,
      created: new Date().toISOString(),
      version: '1.0.0',
      status: 'active',
      lastRun: null,
      runCount: 0,
      successRate: 1.0
    };

    this.workflows.metadata.totalWorkflows++;
    this.workflows.metadata.byDepartment[workflowData.department]++;
    this.workflows.metadata.byTriggerType[workflowData.trigger.type]++;
    this.workflows.metadata.lastUpdated = new Date().toISOString();

    await this.saveJSON('workflows.json', this.workflows);

    // Also update department's workflow list
    await this.addWorkflowToDepartment(workflowData.department, id);

    return this.workflows.workflows[id];
  }

  // Helper methods
  async loadJSON(filename) {
    const filepath = path.join(this.registryDir, filename);
    try {
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Create default structure if file doesn't exist
        return this.createDefaultRegistry(filename);
      }
      throw error;
    }
  }

  async saveJSON(filename, data) {
    const filepath = path.join(this.registryDir, filename);
    await fs.mkdir(this.registryDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  createDefaultRegistry(filename) {
    const defaults = {
      'departments.json': {
        departments: {},
        metadata: { version: '1.0.0', lastUpdated: new Date().toISOString(), totalDepartments: 0 }
      },
      'agents.json': {
        agents: {},
        metadata: { version: '1.0.0', lastUpdated: new Date().toISOString(), totalAgents: 0, byType: {}, byDepartment: {} }
      },
      'workflows.json': {
        workflows: {},
        metadata: { version: '1.0.0', lastUpdated: new Date().toISOString(), totalWorkflows: 0, byDepartment: {}, byTriggerType: {} }
      }
    };
    return defaults[filename] || {};
  }

  async addAgentToDepartment(deptName, agentName) {
    const dept = await this.getDepartment(deptName);
    if (!dept.agents.includes(agentName)) {
      dept.agents.push(agentName);
      await this.updateDepartment(deptName, { agents: dept.agents });
    }
  }

  async addWorkflowToDepartment(deptName, workflowName) {
    const dept = await this.getDepartment(deptName);
    if (!dept.workflows.includes(workflowName)) {
      dept.workflows.push(workflowName);
      await this.updateDepartment(deptName, { workflows: dept.workflows });
    }
  }
}

module.exports = RegistryManager;
```

#### 3.3 Validator

**File:** `/lib/validator.js`

```javascript
/**
 * Validator - Validates generated files before saving
 */

const fs = require('fs').promises;
const path = require('path');

class Validator {
  // Validate agent definition
  static validateAgentDefinition(content, name) {
    const errors = [];

    // Check frontmatter exists
    if (!content.startsWith('---')) {
      errors.push('Missing frontmatter');
    }

    // Extract frontmatter
    const frontmatterMatch = content.match(/---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      errors.push('Invalid frontmatter format');
      return { valid: false, errors };
    }

    const frontmatter = frontmatterMatch[1];

    // Required fields
    const requiredFields = ['name', 'description', 'tools'];
    requiredFields.forEach(field => {
      if (!frontmatter.includes(`${field}:`)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate name matches filename
    const nameMatch = frontmatter.match(/name:\s*(.+)/);
    if (nameMatch && nameMatch[1].trim() !== name) {
      errors.push(`Name in frontmatter (${nameMatch[1].trim()}) doesn't match filename (${name})`);
    }

    // Check for placeholder text
    const placeholders = ['TODO', 'FIXME', '[INSERT', 'PLACEHOLDER'];
    placeholders.forEach(placeholder => {
      if (content.includes(placeholder)) {
        errors.push(`Contains placeholder text: ${placeholder}`);
      }
    });

    // Validate tools
    const validTools = ['Bash', 'Read', 'Write', 'Edit', 'Task', 'WebFetch', 'WebSearch', 'Glob', 'Grep', 'TodoWrite'];
    const toolsMatch = frontmatter.match(/tools:\s*(.+)/);
    if (toolsMatch) {
      const tools = toolsMatch[1].split(',').map(t => t.trim());
      tools.forEach(tool => {
        if (!validTools.includes(tool)) {
          errors.push(`Invalid tool: ${tool}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate JavaScript file
  static validateJavaScript(content, name) {
    const errors = [];

    // Check for required elements
    if (!content.includes('require(\'dotenv\').config()')) {
      errors.push('Missing dotenv configuration');
    }

    if (!content.includes('module.exports')) {
      errors.push('Missing module.exports');
    }

    // Check for basic structure
    if (!content.includes('async function')) {
      errors.push('No async functions found (expected for API calls)');
    }

    // Check for error handling
    if (!content.includes('try') && !content.includes('catch')) {
      errors.push('Missing error handling (try/catch)');
    }

    // Check for placeholder text
    const placeholders = ['TODO', 'FIXME', 'YOUR_API_KEY', 'PLACEHOLDER'];
    placeholders.forEach(placeholder => {
      if (content.includes(placeholder)) {
        errors.push(`Contains placeholder text: ${placeholder}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate workflow JSON
  static validateWorkflow(workflowData) {
    const errors = [];

    // Required fields
    const requiredFields = ['name', 'department', 'description', 'steps'];
    requiredFields.forEach(field => {
      if (!(field in workflowData)) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate steps
    if (workflowData.steps) {
      workflowData.steps.forEach((step, index) => {
        if (!step.agents || step.agents.length === 0) {
          errors.push(`Step ${index + 1} has no agents`);
        }
        if (step.parallel === undefined) {
          errors.push(`Step ${index + 1} missing parallel flag`);
        }
      });
    }

    // Validate trigger if scheduled
    if (workflowData.trigger && workflowData.trigger.type === 'scheduled') {
      if (!workflowData.trigger.schedule) {
        errors.push('Scheduled workflow missing schedule');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Validate naming conventions
  static validateNaming(name, type) {
    const errors = [];

    // Check kebab-case
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      errors.push('Name must be lowercase kebab-case (e.g., my-agent-name)');
    }

    // Check length
    if (name.length < 3) {
      errors.push('Name too short (minimum 3 characters)');
    }

    if (name.length > 50) {
      errors.push('Name too long (maximum 50 characters)');
    }

    // Type-specific rules
    if (type === 'agent' && !name.includes('-')) {
      errors.push('Agent names should include action-noun pattern (e.g., weather-fetcher)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Master validation function
  static async validate(type, name, content) {
    let result;

    switch (type) {
      case 'agent-md':
        result = this.validateAgentDefinition(content, name);
        break;
      case 'agent-js':
        result = this.validateJavaScript(content, name);
        break;
      case 'workflow':
        result = this.validateWorkflow(content);
        break;
      case 'naming':
        result = this.validateNaming(name, content);
        break;
      default:
        result = { valid: false, errors: ['Unknown validation type'] };
    }

    return result;
  }
}

module.exports = Validator;
```

#### Deliverables:
- ✅ Registry system with 3 registries
- ✅ Registry manager with full CRUD
- ✅ Validator with comprehensive checks
- ✅ All existing components registered

---

### Phase 4: Command System Integration (Week 4)

**Objective:** Update the command system to route to creator agents

#### 4.1 Update motus.md Command File

**File:** `/.claude/commands/motus.md`

Add new command sections:

```markdown
### Department Management Commands

- `department create [name]` - Create new department with wizard
- `department list` - Show all departments
- `department info [name]` - Show department details
- `department delete [name]` - Remove department

### For `department create [name]`:
1. Validate department name (must be kebab-case, unique)
2. Use Task tool: Task(subagent_type: 'department-creator', prompt: 'Create department: [name]')
3. Department creator runs interactive wizard
4. Generates all files from templates
5. Updates registries
6. Updates documentation
7. Returns confirmation with next steps

### For `department list`:
1. Read config/registries/departments.json
2. Display formatted list of all departments with stats
3. Show: name, agent count, workflow count, status

### For `department info [name]`:
1. Read config/registries/departments.json
2. Read config/registries/agents.json (filter by department)
3. Read config/registries/workflows.json (filter by department)
4. Display comprehensive department information

---

### Agent Management Commands

- `[department] agent create [name]` - Create agent in department
- `[department] agent list` - List department's agents
- `[department] agent info [name]` - Show agent details
- `[department] agent edit [name]` - Edit agent

### For `[department] agent create [name]`:
1. Validate department exists (check registry)
2. Validate agent name (kebab-case, unique in department)
3. Use Task tool: Task(subagent_type: 'agent-creator', prompt: 'Create agent [name] in [department]')
4. Agent creator runs interactive wizard
5. Generates agent files (md + js if needed)
6. Updates department orchestrator
7. Updates registries
8. Updates documentation
9. Returns confirmation

### For `[department] agent list`:
1. Read config/registries/agents.json
2. Filter agents by department
3. Display formatted list with type, description, status

---

### Workflow Management Commands

- `[department] workflow create [name]` - Create workflow
- `[department] workflow list` - List department workflows
- `[department] workflow info [name]` - Show workflow details
- `[department] workflow edit [name]` - Edit workflow

### For `[department] workflow create [name]`:
1. Validate department exists
2. Validate workflow name (kebab-case, unique in department)
3. Use Task tool: Task(subagent_type: 'workflow-creator', prompt: 'Create workflow [name] in [department]')
4. Workflow creator runs interactive wizard
5. Generates workflow config and trigger script
6. Updates registries
7. Updates documentation
8. If scheduled: Updates cron
9. Returns confirmation with run command

### For `[department] workflow list`:
1. Read config/registries/workflows.json
2. Filter workflows by department
3. Display formatted list with trigger type, schedule, last run

---

### Documentation Commands

- `docs update` - Regenerate all documentation
- `docs show` - Display command reference

### For `docs update`:
1. Use Task tool: Task(subagent_type: 'documentation-updater')
2. Documentation updater reads all registries
3. Regenerates all docs in org-docs/
4. Updates CLAUDE.md
5. Returns summary of updated files

### For `docs show`:
1. Read org-docs/COMMANDS_REFERENCE.md
2. Display formatted command reference
```

#### 4.2 Create Command Router Logic

The routing is handled by Claude Code's natural language understanding in motus.md, but we can add helper scripts:

**File:** `/lib/command-router.js`

```javascript
/**
 * Command Router - Helper for parsing and routing commands
 */

class CommandRouter {
  static parse(args) {
    const [mainCommand, subCommand, ...params] = args;

    // Department management commands
    if (mainCommand === 'department') {
      return {
        type: 'department',
        action: subCommand, // create, list, info, delete
        params
      };
    }

    // Check if mainCommand is a department name
    const departments = this.getDepartments(); // Read from registry
    if (departments.includes(mainCommand)) {
      // Department-specific command: /motus [dept] [resource] [action] [params]
      const [resource, action, ...resourceParams] = [subCommand, ...params];

      if (resource === 'agent' || resource === 'workflow') {
        return {
          type: resource,
          department: mainCommand,
          action,
          params: resourceParams
        };
      }

      // Department workflow execution: /motus [dept] [workflow-name]
      return {
        type: 'workflow-run',
        department: mainCommand,
        workflow: subCommand
      };
    }

    // Global commands
    if (mainCommand === 'docs') {
      return {
        type: 'docs',
        action: subCommand,
        params
      };
    }

    // Legacy/existing commands
    return {
      type: 'legacy',
      command: mainCommand,
      subCommand,
      params
    };
  }

  static getDepartments() {
    // This would read from registry
    // Simplified for example
    return ['life', 'marketing', 'finance', 'business'];
  }
}

module.exports = CommandRouter;
```

#### Deliverables:
- ✅ Updated motus.md with all new commands
- ✅ Command routing logic
- ✅ Validation on all command inputs
- ✅ Clear error messages

---

### Phase 5: Documentation System (Week 5)

**Objective:** Auto-generate comprehensive documentation

#### 5.1 Commands Reference Generator

**File:** `/lib/doc-generator.js`

```javascript
/**
 * Documentation Generator
 * Auto-generates documentation from registries
 */

const fs = require('fs').promises;
const path = require('path');
const RegistryManager = require('./registry-manager');

class DocGenerator {
  constructor() {
    this.registry = new RegistryManager();
    this.docsDir = path.join(__dirname, '..', 'org-docs');
  }

  async generateAll() {
    await this.registry.load();

    const results = {
      commandsReference: await this.generateCommandsReference(),
      departmentDocs: await this.generateDepartmentDocs(),
      claudeMd: await this.updateClaudeMd()
    };

    return results;
  }

  async generateCommandsReference() {
    const departments = await this.registry.listDepartments();

    let markdown = `# Motus Command Reference (Auto-Generated)

**Last Updated:** ${new Date().toLocaleString()}
**Total Departments:** ${departments.length}
**Total Agents:** ${this.registry.agents.metadata.totalAgents}
**Total Workflows:** ${this.registry.workflows.metadata.totalWorkflows}

---

## Table of Contents

${departments.map(d => `- [${d.displayName}](#${d.name}-department)`).join('\n')}
- [System Commands](#system-commands)

---

`;

    // For each department
    for (const dept of departments) {
      const agents = await this.registry.listAgentsByDepartment(dept.name);
      const workflows = Object.values(this.registry.workflows.workflows)
        .filter(w => w.department === dept.name);

      markdown += `## ${dept.displayName}\n\n`;
      markdown += `**Description:** ${dept.description}\n\n`;

      // Agents section
      markdown += `### Agents (${agents.length})\n\n`;
      agents.forEach(agent => {
        markdown += `#### \`${agent.name}\`\n`;
        markdown += `- **Type:** ${agent.type}\n`;
        markdown += `- **Description:** ${agent.description}\n`;
        if (agent.tools) markdown += `- **Tools:** ${agent.tools.join(', ')}\n`;
        markdown += `\n`;
      });

      // Workflows section
      markdown += `### Workflows (${workflows.length})\n\n`;
      workflows.forEach(workflow => {
        markdown += `#### \`${workflow.name}\`\n`;
        markdown += `- **Description:** ${workflow.description}\n`;
        markdown += `- **Command:** \`/motus ${dept.name} ${workflow.name}\`\n`;
        if (workflow.trigger.type === 'scheduled') {
          markdown += `- **Schedule:** ${workflow.trigger.schedule}\n`;
        }
        markdown += `- **Agents Used:** ${workflow.agents.join(', ')}\n`;
        markdown += `\n`;
      });

      // Commands section
      markdown += `### Available Commands\n\n`;
      markdown += '```bash\n';
      dept.commands.forEach(cmd => {
        markdown += `${cmd}\n`;
      });
      markdown += '```\n\n';
      markdown += '---\n\n';
    }

    // System commands
    markdown += `## System Commands\n\n`;
    markdown += `### Department Management\n`;
    markdown += '```bash\n';
    markdown += '/motus department create [name]    # Create new department\n';
    markdown += '/motus department list             # List all departments\n';
    markdown += '/motus department info [name]      # Show department details\n';
    markdown += '```\n\n';

    markdown += `### Agent Management\n`;
    markdown += '```bash\n';
    markdown += '/motus [dept] agent create [name]  # Create agent\n';
    markdown += '/motus [dept] agent list           # List agents\n';
    markdown += '/motus [dept] agent info [name]    # Show agent details\n';
    markdown += '```\n\n';

    markdown += `### Workflow Management\n`;
    markdown += '```bash\n';
    markdown += '/motus [dept] workflow create [name]  # Create workflow\n';
    markdown += '/motus [dept] workflow list           # List workflows\n';
    markdown += '/motus [dept] workflow info [name]    # Show workflow details\n';
    markdown += '```\n\n';

    markdown += `### Documentation\n`;
    markdown += '```bash\n';
    markdown += '/motus docs update    # Regenerate documentation\n';
    markdown += '/motus docs show      # Display this reference\n';
    markdown += '```\n\n';

    // Save
    const filepath = path.join(this.docsDir, 'COMMANDS_REFERENCE.md');
    await fs.mkdir(this.docsDir, { recursive: true });
    await fs.writeFile(filepath, markdown);

    return filepath;
  }

  async generateDepartmentDocs() {
    const departments = await this.registry.listDepartments();
    const deptDocsDir = path.join(this.docsDir, 'departments');
    await fs.mkdir(deptDocsDir, { recursive: true });

    const generatedDocs = [];

    for (const dept of departments) {
      const agents = await this.registry.listAgentsByDepartment(dept.name);
      const workflows = Object.values(this.registry.workflows.workflows)
        .filter(w => w.department === dept.name);

      let markdown = `# ${dept.displayName}\n\n`;
      markdown += `**Description:** ${dept.description}\n\n`;
      markdown += `**Created:** ${new Date(dept.created).toLocaleDateString()}\n`;
      markdown += `**Status:** ${dept.status}\n`;
      markdown += `**Version:** ${dept.version}\n\n`;

      markdown += `## Overview\n\n`;
      markdown += `This department manages ${dept.description.toLowerCase()}.\n\n`;

      markdown += `## Statistics\n\n`;
      markdown += `- **Agents:** ${agents.length}\n`;
      markdown += `- **Workflows:** ${workflows.length}\n`;
      markdown += `- **Integrations:** ${dept.integrations.length}\n\n`;

      // Integrations
      markdown += `## Integrations\n\n`;
      dept.integrations.forEach(integration => {
        markdown += `### ${integration.name}\n`;
        markdown += `- **Type:** ${integration.type}\n`;
        markdown += `- **Environment Variables:** ${integration.envVars.join(', ')}\n`;
        markdown += `\n`;
      });

      // Agents
      markdown += `## Agents\n\n`;
      agents.forEach(agent => {
        markdown += `### ${agent.displayName}\n`;
        markdown += `**Name:** \`${agent.name}\`  \n`;
        markdown += `**Type:** ${agent.type}  \n`;
        markdown += `**Description:** ${agent.description}\n\n`;

        if (agent.script) {
          markdown += `**Implementation:** ${agent.script}\n\n`;
        }

        if (agent.usedInWorkflows.length > 0) {
          markdown += `**Used in Workflows:** ${agent.usedInWorkflows.join(', ')}\n\n`;
        }
      });

      // Workflows
      markdown += `## Workflows\n\n`;
      workflows.forEach(workflow => {
        markdown += `### ${workflow.displayName}\n`;
        markdown += `**Name:** \`${workflow.name}\`  \n`;
        markdown += `**Description:** ${workflow.description}\n\n`;

        markdown += `**Run Command:**\n\`\`\`bash\n/motus ${dept.name} ${workflow.name}\n\`\`\`\n\n`;

        if (workflow.trigger.type === 'scheduled') {
          markdown += `**Schedule:** ${workflow.trigger.schedule} (${workflow.trigger.timezone})\n\n`;
        }

        markdown += `**Agents:** ${workflow.agents.join(', ')}\n\n`;
        markdown += `**Estimated Duration:** ${workflow.estimatedDuration || 'Unknown'}\n\n`;

        if (workflow.runCount > 0) {
          markdown += `**Statistics:**\n`;
          markdown += `- Total Runs: ${workflow.runCount}\n`;
          markdown += `- Success Rate: ${(workflow.successRate * 100).toFixed(1)}%\n`;
          markdown += `- Last Run: ${new Date(workflow.lastRun).toLocaleString()}\n\n`;
        }
      });

      // Quick Start
      markdown += `## Quick Start\n\n`;
      markdown += `### Run Morning Workflow\n`;
      markdown += '```bash\n';
      markdown += `/motus ${dept.name} ${workflows[0]?.name || 'workflow-name'}\n`;
      markdown += '```\n\n';

      markdown += `### Create New Agent\n`;
      markdown += '```bash\n';
      markdown += `/motus ${dept.name} agent create my-new-agent\n`;
      markdown += '```\n\n';

      markdown += `### Create New Workflow\n`;
      markdown += '```bash\n';
      markdown += `/motus ${dept.name} workflow create my-workflow\n`;
      markdown += '```\n\n';

      // Save
      const filepath = path.join(deptDocsDir, `${dept.name}-department.md`);
      await fs.writeFile(filepath, markdown);
      generatedDocs.push(filepath);
    }

    return generatedDocs;
  }

  async updateClaudeMd() {
    const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
    const currentContent = await fs.readFile(claudeMdPath, 'utf8');

    const departments = await this.registry.listDepartments();

    // Generate new architecture section
    let newArchSection = `## Architecture Overview\n\n`;
    newArchSection += `### System Architecture\n`;
    newArchSection += `The Motus system is a Claude Code automation framework that orchestrates specialized AI agents for life and business management:\n\n`;

    newArchSection += `1. **Command Entry Point** (\`/motus\` command in \`.claude/commands/motus.md\`)\n`;
    newArchSection += `   - Routes commands to appropriate handlers\n`;
    newArchSection += `   - MUST use Task tool for parallel agent execution (never sequential)\n`;
    newArchSection += `   - Delegates to specialized agents defined in \`.claude/agents/\`\n\n`;

    newArchSection += `2. **Agent Orchestration Pattern**\n`;
    newArchSection += `   - **Parallel Execution**: Data collection agents run simultaneously\n`;
    newArchSection += `   - **Sequential Processing**: Analysis and creation agents run after data collection\n`;
    newArchSection += `   - **Specialized Agents**: Each agent has a single responsibility\n\n`;

    newArchSection += `3. **Active Departments** (${departments.length})\n`;
    departments.forEach(dept => {
      newArchSection += `   - **${dept.displayName}**: ${dept.agents.length} agents, ${dept.workflows.length} workflows\n`;
    });
    newArchSection += `\n`;

    // Replace architecture section
    const updatedContent = currentContent.replace(
      /## Architecture Overview[\s\S]*?(?=##|$)/,
      newArchSection
    );

    await fs.writeFile(claudeMdPath, updatedContent);
    return claudeMdPath;
  }
}

module.exports = DocGenerator;
```

#### Deliverables:
- ✅ Commands reference auto-generated
- ✅ Department docs auto-generated
- ✅ CLAUDE.md auto-updated
- ✅ Documentation triggered after every creation

---

### Phase 6: Testing & Validation (Week 6)

**Objective:** Comprehensive testing of the entire system

#### 6.1 Test Plan

**Unit Tests:**
- Template rendering with all variable types
- Registry CRUD operations
- Validation for all file types
- Naming convention checks

**Integration Tests:**
- Department creation end-to-end
- Agent creation in each type
- Workflow creation and registration
- Documentation generation

**System Tests:**
- Create 3 test departments (Marketing, Finance, Operations)
- Create 10+ agents across departments
- Create 5+ workflows
- Verify all docs update correctly
- Test command routing
- Verify registry integrity

**Performance Tests:**
- Department creation time (target: <30 seconds)
- Agent creation time (target: <10 seconds)
- Workflow creation time (target: <15 seconds)
- Documentation generation (target: <5 seconds)

#### 6.2 Test Scripts

**File:** `/tests/test-creation-system.js`

```javascript
/**
 * Test suite for standardized creation system
 */

const RegistryManager = require('../lib/registry-manager');
const Validator = require('../lib/validator');
const TemplateEngine = require('../lib/template-engine');
const assert = require('assert');

async function runTests() {
  console.log('Starting Creation System Tests...\n');

  // Test 1: Registry Operations
  console.log('Test 1: Registry Operations');
  const registry = new RegistryManager();
  await registry.load();

  // Add test department
  const testDept = await registry.addDepartment({
    name: 'test-dept',
    displayName: 'Test Department',
    description: 'Test department for validation',
    agents: [],
    workflows: [],
    integrations: [],
    commands: []
  });
  assert(testDept.name === 'test-dept', 'Department creation failed');
  console.log('✅ Registry operations work\n');

  // Test 2: Validation
  console.log('Test 2: Validation');
  const validName = Validator.validateNaming('my-agent', 'agent');
  assert(validName.valid, 'Valid name rejected');

  const invalidName = Validator.validateNaming('MyAgent', 'agent');
  assert(!invalidName.valid, 'Invalid name accepted');
  console.log('✅ Validation works\n');

  // Test 3: Template Rendering
  console.log('Test 3: Template Rendering');
  const engine = new TemplateEngine();
  const rendered = engine.render('test-template', {
    name: 'test-agent',
    description: 'Test agent',
    department: 'test'
  });
  assert(rendered.includes('test-agent'), 'Template rendering failed');
  console.log('✅ Template rendering works\n');

  // Cleanup
  console.log('Cleaning up test data...');
  // Remove test department from registry
  console.log('✅ Tests complete!\n');
}

runTests().catch(console.error);
```

#### Deliverables:
- ✅ All unit tests passing
- ✅ Integration tests passing
- ✅ System tests passing
- ✅ Performance benchmarks met
- ✅ Test documentation

---

## File Structure After Implementation

```
/motus/
├── templates/                          # NEW - All Handlebars templates
│   ├── department/
│   │   ├── department-agent.md.hbs
│   │   ├── orchestrator-agent.md.hbs
│   │   └── department-readme.md.hbs
│   ├── agent/
│   │   ├── data-fetcher-agent.md.hbs
│   │   ├── data-fetcher-script.js.hbs
│   │   ├── orchestrator-agent.md.hbs
│   │   ├── specialist-agent.md.hbs
│   │   └── specialist-script.js.hbs
│   ├── workflow/
│   │   ├── workflow-config.json.hbs
│   │   └── workflow-trigger.sh.hbs
│   ├── docs/
│   │   ├── department-docs.md.hbs
│   │   └── commands-reference.md.hbs
│   └── schemas/
│       ├── department-schema.json
│       ├── agent-schema.json
│       └── workflow-schema.json
│
├── config/                             # NEW - Configuration and registries
│   └── registries/
│       ├── departments.json
│       ├── agents.json
│       └── workflows.json
│
├── lib/                                # ENHANCED - Core libraries
│   ├── template-engine.js             # NEW
│   ├── registry-manager.js            # NEW
│   ├── validator.js                   # NEW
│   └── doc-generator.js               # NEW
│
├── org-docs/                           # NEW - Auto-generated documentation
│   ├── COMMANDS_REFERENCE.md
│   └── departments/
│       ├── life-department.md
│       ├── marketing-department.md
│       └── [future-departments].md
│
├── .claude/
│   ├── agents/
│   │   ├── department-creator.md      # NEW
│   │   ├── agent-creator.md           # NEW
│   │   ├── workflow-creator.md        # ENHANCED
│   │   ├── documentation-updater.md   # NEW
│   │   └── [existing 26 agents...]
│   └── commands/
│       └── motus.md                   # ENHANCED
│
├── life-admin/
│   ├── departments/                   # NEW - Organized by department
│   │   ├── life/
│   │   │   ├── agents/
│   │   │   └── workflows/
│   │   └── [future-departments]/
│   └── [existing scripts...]
│
├── triggers/                           # ENHANCED
│   ├── motus-life-*.sh
│   └── [auto-generated triggers]
│
├── tests/                              # NEW - Test suite
│   ├── test-creation-system.js
│   ├── test-templates.js
│   └── test-validators.js
│
├── docs/                               # ENHANCED
│   ├── STANDARDIZED-CREATION-SYSTEM-PLAN.md  # This document
│   ├── PROJECT_OVERVIEW.md
│   ├── AGENT_DEVELOPMENT_GUIDE.md
│   └── [existing docs...]
│
├── package.json                        # UPDATED - Add handlebars
├── CLAUDE.md                          # AUTO-UPDATED
└── README.md                          # UPDATED
```

---

## Example Workflows

### Example 1: Creating Marketing Department

**User executes:**
```bash
/motus department create marketing
```

**System interaction:**
```
🎯 Department Creator Wizard

Let's create a new department!

1. Department name: marketing ✓
2. What is the primary purpose of this department?
   > "Manage social media marketing, content creation, and campaign analytics"

3. What external services will integrate with this department?
   Available: Twitter API, Facebook API, Google Analytics, Buffer, Hootsuite
   > Twitter API, Google Analytics

4. Main workflows for this department?
   Suggested workflows based on "marketing":
   ✓ daily-trends (monitor trending topics)
   ✓ content-pipeline (manage content creation flow)
   ✓ campaign-analytics (track campaign performance)

   Accept suggestions? (y/n) > y

5. Starter agents to create?
   Suggested agents:
   ✓ trend-analyzer (fetch and analyze trending topics)
   ✓ content-creator (AI content generation helper)
   ✓ campaign-tracker (track campaign metrics)
   ✓ analytics-fetcher (get Google Analytics data)
   ✓ social-poster (post to social media)

   Select agents (1-5): > 1,2,3,4

📋 Summary:
   Department: marketing
   Purpose: Social media marketing and analytics
   Integrations: Twitter API, Google Analytics
   Agents: 4 agents
   Workflows: 3 workflows

Generate department? (y/n) > y

⚙️  Generating department...
✓ Created marketing-admin.md
✓ Created marketing-orchestrator.md
✓ Created trend-analyzer.md + trend-analyzer.js
✓ Created content-creator.md
✓ Created campaign-tracker.md + campaign-tracker.js
✓ Created analytics-fetcher.md + analytics-fetcher.js
✓ Created workflows: daily-trends.json, content-pipeline.json, campaign-analytics.json
✓ Updated registries
✓ Generated documentation

✅ Marketing Department Created!

📊 Stats:
   - 5 agents generated (4 data-fetchers, 1 orchestrator)
   - 3 workflows configured
   - Documentation updated

🚀 Next Steps:
   1. Configure API keys in .env:
      - TWITTER_API_KEY
      - TWITTER_API_SECRET
      - GOOGLE_ANALYTICS_ID

   2. Try your first workflow:
      /motus marketing daily-trends

   3. Create custom agent:
      /motus marketing agent create sentiment-analyzer
```

### Example 2: Creating Custom Agent

**User executes:**
```bash
/motus marketing agent create sentiment-analyzer
```

**System interaction:**
```
🤖 Agent Creator Wizard

Creating agent in Marketing Department

1. Agent name: sentiment-analyzer ✓

2. What does this agent do?
   > "Analyzes sentiment of social media mentions and customer feedback"

   Detected type: Data Fetcher ✓

3. Does this agent need to call an external API?
   > yes

   Which API/service?
   > Twitter API, OpenAI API

   Required environment variables:
   - TWITTER_API_KEY (already configured)
   - OPENAI_API_KEY (needs setup)

4. What tools does this agent need?
   Suggested: Bash, Read
   Modify? (y/n) > n

📋 Summary:
   Agent: sentiment-analyzer
   Type: Data Fetcher
   Department: marketing
   APIs: Twitter API, OpenAI API
   Script: Yes (sentiment-analyzer.js)

Generate agent? (y/n) > y

⚙️  Generating agent...
✓ Created sentiment-analyzer.md
✓ Created sentiment-analyzer.js
✓ Updated marketing-orchestrator.md
✓ Updated registry
✓ Updated documentation

✅ Agent Created!

🚀 Next Steps:
   1. Add to .env:
      OPENAI_API_KEY=your_key_here

   2. Test the agent:
      # In Claude Code CLI
      Use the sentiment-analyzer agent to analyze recent tweets

   3. Add to workflow:
      /motus marketing workflow edit daily-trends
```

### Example 3: Creating Workflow

**User executes:**
```bash
/motus marketing workflow create weekly-report
```

**System interaction:**
```
📊 Workflow Creator Wizard

Creating workflow in Marketing Department

1. Workflow name: weekly-report ✓

2. What is the workflow's purpose?
   > "Generate comprehensive weekly marketing report with metrics and insights"

3. How should this workflow be triggered?
   a) Manual
   b) Scheduled
   c) Event-based
   > b

   Schedule (e.g., 'daily 9am', 'weekly Monday 10am'):
   > weekly Sunday 6pm

4. Let's build the workflow steps...

   Step 1:
   What should this step accomplish?
   > Fetch this week's campaign data

   Which agent?
   Available agents: trend-analyzer, content-creator, campaign-tracker, analytics-fetcher, sentiment-analyzer
   > campaign-tracker

   Can this run in parallel with previous steps? (first step, auto-yes)

   Add another step? > y

   Step 2:
   What should this step accomplish?
   > Get Google Analytics metrics

   Which agent?
   > analytics-fetcher

   Can run in parallel? > y (compatible with step 1)

   Add another step? > y

   Step 3:
   What should this step accomplish?
   > Analyze sentiment of customer feedback

   Which agent?
   > sentiment-analyzer

   Can run in parallel? > y

   Add another step? > y

   Step 4:
   What should this step accomplish?
   > Generate insights from all collected data

   Which agent?
   Available: marketing-orchestrator, insight-generator
   > insight-generator

   Can run in parallel? > n (depends on steps 1-3)

   Add another step? > y

   Step 5:
   What should this step accomplish?
   > Create weekly report document

   Which agent?
   > note-creator

   Can run in parallel? > n (depends on step 4)

   Add another step? > n

5. What should the workflow output?
   a) Obsidian note
   b) Notion page
   c) Console
   d) Email
   > b (Notion page)

📋 Workflow Summary:

   weekly-report
   "Generate comprehensive weekly marketing report"

   Trigger: Scheduled (weekly Sunday 6pm)

   Execution Plan:
   ┌─────────────────────────────────────┐
   │  Group 1 (Parallel - 3 agents)      │
   │  ├─ campaign-tracker                │
   │  ├─ analytics-fetcher               │
   │  └─ sentiment-analyzer              │
   └──────────────┬──────────────────────┘
                  │
   ┌──────────────▼──────────────────────┐
   │  Group 2 (Sequential)                │
   │  └─ insight-generator                │
   └──────────────┬──────────────────────┘
                  │
   ┌──────────────▼──────────────────────┐
   │  Group 3 (Sequential)                │
   │  └─ note-creator                     │
   └─────────────────────────────────────┘

   Output: Notion page
   Estimated time: 15-20 seconds

Generate workflow? (y/n) > y

⚙️  Generating workflow...
✓ Created weekly-report.json
✓ Created trigger script: motus-marketing-weekly-report.sh
✓ Updated registry
✓ Updated cron schedule
✓ Updated documentation

✅ Workflow Created!

🚀 Next Steps:
   1. Test manually first:
      /motus marketing weekly-report

   2. Check scheduled execution:
      Next run: Sunday, Oct 13 at 6:00 PM

   3. View workflow details:
      /motus marketing workflow info weekly-report
```

---

## Template Specifications

### Agent Template Variables

All templates use these standard variables:

```javascript
{
  // Required
  name: 'agent-name',                    // kebab-case
  displayName: 'Agent Display Name',     // Human readable
  description: 'What this agent does',   // Full description
  department: 'department-name',         // Parent department

  // Optional
  type: 'data-fetcher|orchestrator|specialist',
  tools: ['Bash', 'Read'],              // Array of tools
  model: 'sonnet|haiku|opus',           // Default: sonnet
  color: 'cyan|green|yellow',           // Terminal color
  script: '/path/to/script.js',         // If has implementation
  integrations: ['API Name'],           // External APIs
  envVars: ['ENV_VAR_NAME'],           // Required env vars

  // Timestamps
  created: '2025-10-08T19:20:00Z',
  version: '1.0.0'
}
```

### Workflow Template Variables

```javascript
{
  name: 'workflow-name',
  displayName: 'Workflow Display Name',
  description: 'What this workflow accomplishes',
  department: 'department-name',

  steps: [
    {
      group: 1,
      parallel: true,
      agents: [
        { name: 'agent-1', prompt: 'instruction' },
        { name: 'agent-2', prompt: 'instruction' }
      ]
    },
    {
      group: 2,
      parallel: false,
      agents: [
        { name: 'processor', prompt: 'process results' }
      ]
    }
  ],

  trigger: {
    type: 'scheduled|manual|event',
    schedule: 'daily 9:00',  // if scheduled
    timezone: 'Asia/Bangkok'
  },

  output: {
    type: 'obsidian|notion|console',
    destination: 'path/or/database'
  }
}
```

---

## Registry System Details

### Registry Update Flow

```
Creation Event
      │
      ▼
┌─────────────────┐
│ Registry Manager│
│   .addX()       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validate Data  │
│  - Name unique  │
│  - Format valid │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Registry │
│   JSON File     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Parent   │
│  (Department)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Trigger Doc     │
│    Updater      │
└─────────────────┘
```

### Registry Queries

Common registry queries:

```javascript
// Get all agents in a department
const agents = await registry.listAgentsByDepartment('marketing');

// Get workflow by name
const workflow = await registry.workflows.workflows['morning-briefing'];

// Get department stats
const dept = await registry.getDepartment('life');
console.log(`${dept.agents.length} agents, ${dept.workflows.length} workflows`);

// Find agents that use specific API
const weatherAgents = Object.values(registry.agents.agents)
  .filter(a => a.integrations.includes('WeatherAPI'));
```

---

## Validation Rules

### Naming Conventions

| Type | Format | Example | Regex |
|------|--------|---------|-------|
| Department | lowercase-kebab | `marketing`, `sales` | `^[a-z][a-z0-9-]{2,30}$` |
| Agent | action-noun | `trend-analyzer`, `content-creator` | `^[a-z][a-z0-9-]{2,50}$` |
| Workflow | description-type | `daily-trends`, `weekly-report` | `^[a-z][a-z0-9-]{2,50}$` |
| File (agent) | name.md | `trend-analyzer.md` | - |
| File (script) | name.js | `trend-analyzer.js` | - |

### Required Fields Validation

**Agent:**
- ✅ name (kebab-case, unique)
- ✅ description (min 10 chars)
- ✅ tools (valid tool names)
- ✅ department (exists in registry)

**Workflow:**
- ✅ name (kebab-case, unique)
- ✅ description (min 10 chars)
- ✅ steps (at least 1)
- ✅ agents exist in department
- ✅ department exists

**Department:**
- ✅ name (kebab-case, unique)
- ✅ description (min 20 chars)
- ✅ displayName

---

## Testing Strategy

### Test Scenarios

#### Scenario 1: Happy Path Department Creation
1. User: `/motus department create finance`
2. System: Runs wizard
3. User: Answers all questions correctly
4. System: Generates all files
5. Verify:
   - ✅ 5+ files created
   - ✅ Registry updated
   - ✅ Docs generated
   - ✅ No errors

#### Scenario 2: Invalid Name Rejection
1. User: `/motus department create MyDept` (wrong case)
2. System: Rejects with error
3. Verify: No files created

#### Scenario 3: Parallel Workflow Execution
1. Create workflow with 3 parallel agents
2. Run workflow
3. Verify:
   - ✅ Agents launch simultaneously
   - ✅ Total time ≈ slowest agent (not sum)
   - ✅ All data collected before next step

#### Scenario 4: Documentation Updates
1. Create new department
2. Check COMMANDS_REFERENCE.md
3. Verify:
   - ✅ New department listed
   - ✅ All agents documented
   - ✅ Commands shown

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Template engine renders all templates without errors
- ✅ All helpers work correctly
- ✅ Templates validated against schemas

### Phase 2 Complete When:
- ✅ Can create full department via wizard
- ✅ Can create agent via wizard
- ✅ Can create workflow via wizard
- ✅ All registries update correctly

### Phase 3 Complete When:
- ✅ Registry CRUD works for all types
- ✅ Validators catch all error cases
- ✅ No invalid data can be saved

### Phase 4 Complete When:
- ✅ All commands route correctly
- ✅ Error messages are clear
- ✅ User can discover features easily

### Phase 5 Complete When:
- ✅ Docs auto-generate after every change
- ✅ COMMANDS_REFERENCE.md is accurate
- ✅ Department docs are complete

### Phase 6 Complete When:
- ✅ All tests pass
- ✅ Performance meets targets
- ✅ System is production-ready

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1. Templates | Week 1 | Template engine + 10 templates |
| 2. Creator Agents | Week 2 | 4 creator agents fully functional |
| 3. Registries | Week 3 | Registry system + validation |
| 4. Commands | Week 4 | Command routing integrated |
| 5. Documentation | Week 5 | Auto-doc generation |
| 6. Testing | Week 6 | Full test suite + validation |

**Total: 6 weeks to full implementation**

---

## Next Steps

1. ✅ Review and approve this plan
2. ✅ Begin Phase 1: Create template system
3. ✅ Create first department using system (test it early)
4. ✅ Iterate based on learnings
5. ✅ Complete all phases
6. ✅ Launch system for daily use

---

**Document Version:** 1.0.0
**Last Updated:** October 08, 2025
**Status:** Ready for Implementation
