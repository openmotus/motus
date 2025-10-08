# Motus - AI Automation Framework

**A framework for building department-based AI automation systems with Claude Code CLI**

---

## What is Motus?

Motus is a **framework**, not a pre-built automation system. It provides the infrastructure to build your own AI-powered automation through departments, agents, and workflows.

**Think of it like this:**
- Rails is a web framework → You build your own web apps
- Motus is an automation framework → You build your own automation systems

---

## What You Get

### The Creation System
```bash
/motus department create [name]    # Create a department
/motus [dept] agent create [name]  # Create an agent
/motus [dept] workflow create [name] # Create a workflow
```

### Core Infrastructure
- **Registry System** - Tracks departments, agents, workflows
- **Template Engine** - 11 Handlebars templates for code generation
- **4 Creator Agents** - Wizards that build departments/agents/workflows
- **OAuth Manager** - Web UI for managing API integrations
- **Documentation Generator** - Auto-generates docs from registry

### What You DON'T Get
- ❌ Pre-built departments (empty state)
- ❌ Pre-configured agents (you create them)
- ❌ Working automations (you implement them)
- ❌ API integrations (you add them via OAuth Manager)

**You provide the implementation. Motus provides the structure.**

---

## Architecture

### The Corporate Org Chart Analogy

Think of Motus like a corporate organization:

```
┌─────────────────────────────────────────────┐
│           /Motus CLI (Command Center)        │
│        Entry point for all operations        │
└──────────────────┬──────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
┌─────▼────────┐      ┌────────▼─────┐
│ Department 1 │      │ Department 2 │
│ (e.g., HR)   │      │ (e.g., Sales)│
└──────┬───────┘      └──────┬───────┘
       │                     │
   ┌───┴────┐           ┌────┴────┐
   │        │           │         │
   │  Orchestrator      │    Orchestrator
   │  (Department Head) │    (Department Head)
   │        │           │         │
   │  ┌─────┴─────┐    │   ┌─────┴─────┐
   │  │           │    │   │           │
   │  Agents       │   │   Agents      │
   │  (Workers)    │   │   (Workers)   │
   │  │           │    │   │           │
   │  Workflows    │   │   Workflows   │
   │  (Processes)  │   │   (Processes) │
   └──────┬────────┘   └───────┬───────┘
          │                    │
    ┌─────▼────────────────────▼─────┐
    │    External Integrations        │
    │    (APIs, databases, services)  │
    └─────────────────────────────────┘
```

**Key Concepts:**

1. **Departments** = Organizational units (HR, Sales, Marketing, Finance, etc.)
2. **Orchestrator** = Department head that coordinates workers
3. **Agents** = Workers that execute specific tasks
4. **Workflows** = Business processes that combine multiple agents
5. **Integrations** = External systems the department connects to

---

## Agent Types

Motus supports three types of agents:

### 1. Orchestrator Agents
**Role:** Department head - coordinates other agents

**Example Use Cases:**
- `hr-admin` - Coordinates all HR department operations
- `sales-pipeline-manager` - Orchestrates sales workflow
- `marketing-campaign-orchestrator` - Runs marketing campaigns

**Characteristics:**
- Calls other agents (doesn't do work itself)
- Manages workflow execution
- Coordinates parallel/sequential operations
- Returns aggregated results

**Template:** `templates/agent/orchestrator-agent.md.hbs`

---

### 2. Data Fetcher Agents
**Role:** Retrieve data from external sources

**Example Use Cases:**
- `api-data-fetcher` - Gets data from REST APIs
- `database-query-agent` - Queries databases
- `file-reader-agent` - Reads files from disk
- `web-scraper-agent` - Scrapes web pages

**Characteristics:**
- Single responsibility (one data source)
- Returns structured data
- Handles errors gracefully
- Stateless operations

**Template:** `templates/agent/data-fetcher-agent.md.hbs`

---

### 3. Specialist Agents
**Role:** Analyze data, make decisions, create content

**Example Use Cases:**
- `data-analyzer-agent` - Analyzes data and generates insights
- `report-generator-agent` - Creates formatted reports
- `decision-maker-agent` - Makes decisions based on rules
- `content-writer-agent` - Generates text content

**Characteristics:**
- Receives input from other agents
- Applies logic/analysis
- Produces output (reports, decisions, content)
- May use AI/ML for intelligence

**Template:** `templates/agent/specialist-agent.md.hbs`

---

## Workflow Patterns

### Sequential Workflow
Tasks run one after another (B waits for A to complete):

```
Agent A → Agent B → Agent C → Result
  (3s)      (4s)      (2s)     = 9 seconds
```

**Use When:**
- Agent B needs Agent A's output
- Order matters
- Dependencies exist

**Example:**
```
1. Fetch user data from database
2. Analyze user behavior
3. Generate recommendations based on analysis
```

---

### Parallel Workflow
Tasks run simultaneously (all start at once):

```
Agent A (3s) ┐
Agent B (4s) ├─→ Combine → Result
Agent C (2s) ┘     = 4 seconds (longest)
```

**Use When:**
- Agents are independent
- No dependencies
- Speed is important

**Example:**
```
Simultaneously:
1. Fetch weather data
2. Fetch calendar events
3. Fetch email summary
Then combine all three into dashboard
```

---

### Hybrid Workflow
Combination of parallel and sequential:

```
Step 1 (Parallel):
  Agent A ┐
  Agent B ├─→ Agent D (Analyzer)
  Agent C ┘

Step 2 (Sequential):
  Agent D → Agent E (Reporter) → Result
```

**Use When:**
- Complex multi-stage processes
- Some steps independent, others dependent

**Example:**
```
1. Parallel: Gather data from 3 APIs
2. Sequential: Analyze combined data
3. Sequential: Generate report from analysis
```

---

## Parallel Execution (Technical)

### How It Works

Motus uses Claude Code's Task tool to run agents in parallel:

```javascript
// Theoretical example (you would implement this)
async function runWorkflow() {
  // Launch all agents simultaneously
  const [weather, calendar, emails] = await Promise.all([
    runAgent('weather-fetcher'),
    runAgent('calendar-fetcher'),
    runAgent('email-fetcher')
  ]);

  // Combine results
  return combineData(weather, calendar, emails);
}
```

**Performance Benefits:**
- 3 agents × 5 seconds sequential = 15 seconds
- 3 agents in parallel = 5 seconds (longest agent)
- **67% time reduction**

**When to Use:**
- Independent data collection
- No inter-agent dependencies
- I/O-bound operations (API calls, database queries)

**When NOT to Use:**
- Agent B needs Agent A's result
- Shared resource conflicts
- Order-dependent operations

---

## The Creation System

### How Departments are Created

```bash
$ /motus department create tasks

# Wizard asks:
# - Department name: tasks
# - Description: Task management department
# - Suggested agents: task-admin, task-fetcher, task-analyzer
# - Suggested workflows: daily-tasks, weekly-review

# Creates:
# 1. .claude/agents/task-admin.md (orchestrator)
# 2. config/registries/departments.json (updated)
# 3. org-docs/departments/tasks-department.md (docs)
```

---

### How Agents are Created

```bash
$ /motus tasks agent create task-fetcher

# Wizard asks:
# - Agent name: task-fetcher
# - Agent type: data-fetcher (auto-detected from name)
# - Description: Fetches tasks from various sources
# - Data sources: Todoist, Google Tasks, Notion

# Creates:
# 1. .claude/agents/task-fetcher.md (agent definition)
# 2. config/registries/agents.json (updated)
# 3. tasks/agents/task-fetcher.js (implementation scaffold)
```

**You must implement:** The actual `.js` file logic to fetch tasks.

---

### How Workflows are Created

```bash
$ /motus tasks workflow create daily-tasks

# Wizard asks:
# - Workflow name: daily-tasks
# - Trigger: manual or scheduled
# - Steps: Which agents to run
# - Execution: parallel or sequential

# Creates:
# 1. config/workflows/daily-tasks.json (configuration)
# 2. triggers/daily-tasks.sh (execution script)
# 3. config/registries/workflows.json (updated)
```

**You must implement:** The actual agent logic called by the workflow.

---

## Template System

Motus includes 11 Handlebars templates:

### Agent Templates (4)
- `specialist-agent.md.hbs` - For analysis/decision agents
- `data-fetcher-agent.md.hbs` - For data retrieval agents
- `orchestrator-agent.md.hbs` - For coordinator agents
- `data-fetcher-script.js.hbs` - JavaScript implementation scaffold

### Department Templates (3)
- `department-agent.md.hbs` - Main department orchestrator
- `orchestrator-agent.md.hbs` - Department-level coordinator
- `department-readme.md.hbs` - Department documentation

### Workflow Templates (2)
- `workflow-config.json.hbs` - Workflow configuration
- `workflow-trigger.sh.hbs` - Execution script

### Documentation Templates (2)
- `commands-reference.md.hbs` - Auto-generated command docs
- `department-docs.md.hbs` - Department documentation

---

## Registry System

The registry tracks everything you create:

### departments.json
```json
{
  "departments": {
    "tasks": {
      "name": "tasks",
      "displayName": "Task Management",
      "description": "Manages tasks from multiple sources",
      "agents": ["task-admin", "task-fetcher", "task-analyzer"],
      "workflows": ["daily-tasks", "weekly-review"],
      "created": "2025-10-08T00:00:00.000Z"
    }
  }
}
```

### agents.json
```json
{
  "agents": {
    "task-fetcher": {
      "name": "task-fetcher",
      "type": "data-fetcher",
      "department": "tasks",
      "description": "Fetches tasks from Todoist, Google Tasks",
      "implementation": "tasks/agents/task-fetcher.js",
      "created": "2025-10-08T00:00:00.000Z"
    }
  }
}
```

### workflows.json
```json
{
  "workflows": {
    "daily-tasks": {
      "name": "daily-tasks",
      "department": "tasks",
      "trigger": "manual",
      "agents": ["task-fetcher", "task-analyzer"],
      "execution": "sequential",
      "created": "2025-10-08T00:00:00.000Z"
    }
  }
}
```

---

## OAuth Manager

Web-based interface for managing API integrations.

```bash
$ ./start-oauth-manager.sh
# Opens http://localhost:3001
```

**Supports:**
- Google (Calendar, Gmail, Drive, etc.)
- Notion
- Oura Ring
- Twitter
- Any OAuth2-compatible service

**Features:**
- Guided OAuth flow
- Token management
- Token refresh automation
- Secure token storage

---

## Project Structure

```
motus/
├── .claude/
│   ├── agents/                    # Agent definitions (.md files)
│   │   ├── department-creator.md  # ✅ Creator wizard
│   │   ├── agent-creator.md       # ✅ Creator wizard
│   │   ├── workflow-creator.md    # ✅ Creator wizard
│   │   └── documentation-updater.md # ✅ Doc generator
│   └── commands/
│       └── motus.md               # Main CLI command
│
├── config/
│   └── registries/                # Central registry
│       ├── departments.json       # All departments
│       ├── agents.json            # All agents
│       └── workflows.json         # All workflows
│
├── lib/                           # Core libraries
│   ├── registry-manager.js        # ✅ CRUD for registries
│   ├── template-engine.js         # ✅ Template rendering
│   ├── validator.js               # ✅ Name/type validation
│   ├── oauth-registry.js          # ✅ OAuth management
│   └── doc-generator.js           # ✅ Auto documentation
│
├── templates/                     # 11 Handlebars templates
│   ├── agent/                     # Agent templates
│   ├── department/                # Department templates
│   ├── workflow/                  # Workflow templates
│   └── docs/                      # Documentation templates
│
├── oauth-manager/                 # OAuth Manager server
│   ├── server.js                  # Express server
│   └── public/index.html          # Web UI
│
├── public-docs/                   # User documentation
│   ├── Introduction.md
│   ├── Creating-Departments.md
│   ├── Creating-Agents.md
│   └── Creating-Workflows.md
│
├── org-docs/                      # Auto-generated docs
│   └── departments/               # (empty until you create departments)
│
├── .env.example                   # Environment template
├── motus                          # Main executable
└── README.md                      # Quick start
```

---

## Building Your First Department

### Example: Task Management Department

**Step 1: Create Department**
```bash
/motus department create tasks
```

**Step 2: Create Orchestrator Agent**
```bash
/motus tasks agent create task-admin
# Type: orchestrator
# Coordinates all task operations
```

**Step 3: Create Data Fetcher Agent**
```bash
/motus tasks agent create task-fetcher
# Type: data-fetcher
# Fetches tasks from Todoist API
```

**Step 4: Implement Agent Logic**
```javascript
// tasks/agents/task-fetcher.js
const axios = require('axios');

module.exports = async function fetchTasks() {
  const response = await axios.get('https://api.todoist.com/rest/v2/tasks', {
    headers: { 'Authorization': `Bearer ${process.env.TODOIST_API_KEY}` }
  });

  return response.data;
};
```

**Step 5: Create Workflow**
```bash
/motus tasks workflow create daily-tasks
# Agents: task-fetcher, task-analyzer
# Execution: sequential
# Trigger: manual
```

**Step 6: Run Workflow**
```bash
/motus tasks daily-tasks
# Executes: task-fetcher → task-analyzer → result
```

---

## Key Principles

### 1. Framework, Not Product
Motus provides structure. You provide implementation.

### 2. Single Responsibility
Each agent does ONE thing well. No multi-purpose agents.

### 3. Declarative Configuration
Agents defined in markdown, workflows in JSON. Easy to read, modify, create.

### 4. Template-Driven
Consistent code generation from templates. Modify templates to change output.

### 5. Registry-Centric
Everything tracked in registries. Single source of truth for system state.

### 6. Extensible by Design
Add new agent types, templates, integrations without modifying core.

---

## What You Need to Provide

### For Each Agent
1. **Definition** (.md file) - Created by wizard ✅
2. **Implementation** (.js file) - **YOU WRITE THIS**
3. **Dependencies** (APIs, libraries) - **YOU CONFIGURE THIS**

### For Each Workflow
1. **Configuration** (.json file) - Created by wizard ✅
2. **Agent implementations** - **YOU WRITE THIS**
3. **Integration setup** - **YOU CONFIGURE THIS**

### For Each Department
1. **Structure** (agents, workflows) - Created by wizard ✅
2. **Business logic** - **YOU IMPLEMENT THIS**
3. **API credentials** - **YOU PROVIDE THIS**

---

## Technology Stack

**Core:**
- Node.js 18+
- Claude Code CLI (Task tool for agent orchestration)
- Commander.js (CLI parsing)

**Template Engine:**
- Handlebars 4.7+
- Custom helpers for code generation

**Registry:**
- JSON-based storage
- File system persistence

**OAuth:**
- Express server
- Socket.io for real-time updates
- Secure token management

---

## Comparison: Framework vs Implementation

| Aspect | Framework Provides | You Implement |
|--------|-------------------|---------------|
| **Structure** | Departments, agents, workflows | Business logic |
| **Templates** | 11 code generation templates | Custom templates (optional) |
| **Registry** | Tracking system | Data in registry |
| **OAuth** | Manager UI + flow | API credentials |
| **Documentation** | Auto-generation | Content |
| **CLI** | Creation commands | Execution logic |
| **Agents** | Definitions (.md files) | Implementations (.js files) |
| **Workflows** | Configuration | Agent logic |

---

## Use Cases (What You CAN Build)

### Personal Automation
- Daily briefing system (weather, calendar, tasks)
- Health tracking dashboard (Oura, Fitbit, Apple Health)
- Finance management (expense tracking, budgets)
- Learning system (course progress, flashcards)

### Business Automation
- CRM integration (sales pipeline, lead tracking)
- Marketing automation (campaigns, analytics)
- HR system (onboarding, reviews, time tracking)
- Operations dashboard (metrics, KPIs, alerts)

### Content Creation
- Social media management (scheduling, analytics)
- Blog automation (research, drafts, publishing)
- Newsletter system (content curation, sending)
- Video workflow (scripts, editing notes, publishing)

### Development Workflow
- CI/CD monitoring (build status, deployments)
- Code review automation (PR checks, comments)
- Issue management (triage, assignment, notifications)
- Documentation generation (API docs, changelogs)

---

## Getting Started

**1. Clone Repository**
```bash
git clone https://github.com/openmotus/motus.git
cd motus
npm install
```

**2. Copy Environment Template**
```bash
cp .env.example .env
# Edit .env with your settings
```

**3. Create Your First Department**
```bash
/motus department create [your-department]
```

**4. Create Agents**
```bash
/motus [dept] agent create [agent-name]
```

**5. Implement Agent Logic**
```javascript
// Write your implementation in generated .js files
```

**6. Create Workflow**
```bash
/motus [dept] workflow create [workflow-name]
```

**7. Run Workflow**
```bash
/motus [dept] [workflow-name]
```

---

## Documentation

- **[Creating Departments](../public-docs/Creating-Departments.md)** - Department creation guide
- **[Creating Agents](../public-docs/Creating-Agents.md)** - Agent types and creation
- **[Creating Workflows](../public-docs/Creating-Workflows.md)** - Workflow patterns
- **[Setup Environment](../public-docs/Setup-Environment.md)** - Environment configuration
- **[OAuth Manager](../public-docs/OAuth-Manager.md)** - OAuth integration guide
- **[API Reference](../public-docs/API-Reference.md)** - Core library API

---

## Philosophy

**Motus is infrastructure, not implementation.**

Like Ruby on Rails doesn't build your web app for you, Motus doesn't build your automation for you. It provides:
- Proven patterns
- Code generation
- Organization structure
- Integration framework
- Documentation automation

You bring:
- Your use case
- Your API integrations
- Your business logic
- Your workflows
- Your domain knowledge

Together: **A powerful, custom automation system tailored to YOUR needs.**

---

## License

MIT - See LICENSE file

---

## Credits

Built exclusively for Claude Code CLI by Anthropic

---

**Motus**: Latin for "motion, movement, impulse"

*A framework for building automation systems that move as fast as you think.*
