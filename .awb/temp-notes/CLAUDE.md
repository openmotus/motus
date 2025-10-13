# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Important: Fresh Installation State

**If working with a fresh/cloned Motus installation, read this first:**

### Current State
- ✅ **Framework installed** - Core libraries, templates, creator agents ready
- ⚠️ **Registries are empty** - No departments/agents/workflows exist yet
- ⚠️ **Configuration needed** - `.env` must be configured with user values
- ⚠️ **`.claude/commands/motus.md` has example data** - Contains hardcoded paths and non-existent agents

### What Works Immediately
These commands work on fresh install:
- `/motus init` - Initialize system and create .env
- `/motus help` - Show available commands
- `/motus department create [name]` - Create first department
- `/motus oauth` - Launch OAuth Manager

### What Needs Setup First
These commands will fail until user creates departments/agents:
- ❌ Any department-specific commands (life, marketing, etc.)
- ❌ Workflow execution commands
- ❌ Agent-specific commands (weather-fetcher, calendar-fetcher, etc.)

**Why:** The framework ships empty by design. Users build their own departments/agents through creation wizards.

### First-Time Setup Flow
1. Run `/motus init` - Sets up .env file
2. Edit `.env` with user's actual values (timezone, API keys, paths)
3. Edit `config.json` - Set user's timezone (line 7)
4. Create first department: `/motus department create tasks`
5. Follow wizard to create agents and workflows
6. Now department-specific commands work

### Known Issue: `.claude/commands/motus.md`
This file contains example configurations from the original developer:
- Hardcoded paths: `/Users/ianwinscom/motus/`
- Hardcoded config: Chiang Mai weather, Asia/Bangkok timezone
- References to agents that don't exist in fresh install

**Don't blindly execute commands from this file.** Check registries first to see what actually exists.

---

## Commands to Build, Test, and Run

### Core Commands
```bash
# Install dependencies
npm install

# Run main Motus command
./motus [command] [options]

# Creation system commands (used within Claude Code)
/motus department create [name]      # Create new department
/motus [dept] agent create [name]    # Create new agent in department
/motus [dept] workflow create [name] # Create new workflow in department
/motus docs update                   # Regenerate all documentation

# OAuth Manager
./start-oauth-manager.sh   # Launch OAuth Manager at localhost:3001

# Your custom commands will be created as:
/motus [department] [workflow]       # Run department workflows
```

### Environment Configuration
Copy `.env.example` to `.env` and configure with your API keys and service credentials.

**Example variables** (add what you need for your integrations):
- `YOUR_API_KEY` - API keys for services you integrate
- `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET` - OAuth credentials
- `SERVICE_TOKEN` - Service-specific tokens
- `FILE_PATH` - Paths to local resources

See `.env.example` for the template structure.

## Architecture Overview

### System Architecture
Motus is a framework for building department-based AI automation systems within Claude Code:

1. **Command Entry Point** (`/motus` command in `.claude/commands/motus.md`)
   - Routes commands to department handlers
   - Uses Task tool for parallel agent execution when appropriate
   - Delegates to agents defined in `.claude/agents/`

2. **Three-Layer Structure**
   - **Departments**: Organizational units (e.g., Tasks, Marketing, Finance)
   - **Agents**: AI assistants that perform specific functions
     - **Orchestrators**: Coordinate workflows and other agents
     - **Data Fetchers**: Retrieve information from external sources
     - **Specialists**: Analyze data, make decisions, create content
   - **Workflows**: Automated processes combining multiple agents

3. **Creator Agents** (in `.claude/agents/`)
   - `department-creator` - Interactive wizard for creating departments
   - `agent-creator` - Generates agent definitions and implementation templates
   - `workflow-creator` - Builds workflow configurations
   - `documentation-updater` - Auto-generates documentation from registries

### Agent Types and Patterns

**Orchestrator Agents**
- Coordinate multiple agents
- Manage workflow execution
- Aggregate results from sub-agents
- Example: A "daily-report" orchestrator that runs data-fetchers in parallel

**Data Fetcher Agents**
- Single-purpose data retrieval
- Execute quickly and independently
- Return structured data
- Example: Weather fetcher, calendar fetcher, API data retriever

**Specialist Agents**
- Analyze and process data
- Make decisions or create content
- May use Claude's intelligence
- Example: Content analyzer, report generator, task prioritizer

### Execution Patterns

**Parallel Execution** (for independent tasks):
- Use Claude Code Task tool
- Run multiple agents simultaneously
- Ideal for data collection from multiple sources

**Sequential Execution** (for dependent tasks):
- One task completes before next starts
- Used when later steps need earlier results
- Common for analysis → decision → action workflows

**Hybrid Execution**:
- Parallel data collection
- Sequential analysis and action
- Most efficient for complex workflows

## Standardized Creation System ✅ Phase 2 Complete

Motus includes a wizard-driven system for consistently creating departments, agents, and workflows:

### Creation Commands
```bash
# Department Management
/motus department create [name]      # Interactive wizard creates full department
/motus department list               # Show all departments
/motus department info [name]        # Department details

# Agent Management (within departments)
/motus [dept] agent create [name]    # Create agent in department
/motus [dept] agent list             # List department agents
/motus [dept] agent info [name]      # Agent details

# Workflow Management
/motus [dept] workflow create [name] # Create workflow in department
/motus [dept] workflow list          # List workflows
/motus [dept] workflow info [name]   # Workflow details

# Documentation (auto-generated)
/motus docs update                   # Regenerate all docs from registries
/motus docs show                     # Display command reference
```

### Phase 2 Components (Completed)
**Libraries:**
- ✅ **Template Engine** (`/lib/template-engine.js`) - Handlebars with 20+ helpers, schema validation
- ✅ **Registry Manager** (`/lib/registry-manager.js`) - CRUD for departments, agents, workflows with validation
- ✅ **Validator** (`/lib/validator.js`) - Name validation, type detection, context validation

**Creator Agents:**
- ✅ **department-creator** (`.claude/agents/department-creator.md`) - Interactive wizard, auto-suggests agents/workflows
- ✅ **agent-creator** (`.claude/agents/agent-creator.md`) - Auto-detects type (data-fetcher/orchestrator/specialist)
- ✅ **workflow-creator** (`.claude/agents/workflow-creator.md`) - Step builder with parallel/sequential detection
- ✅ **documentation-updater** (`.claude/agents/documentation-updater.md`) - Auto-generates all docs from registries

**Templates:** (11 total)
- Department: `department-agent.md`, `orchestrator-agent.md`
- Agents: `data-fetcher-agent.md`, `data-fetcher-script.js`, `orchestrator-agent.md`, `specialist-agent.md`
- Workflows: `workflow-config.json`, `workflow-trigger.sh`
- Documentation: `commands-reference.md`, `department-docs.md`
- Schema: `agent-schema.json`

**Testing:**
- ✅ 3 test suites: `test-template-engine.js`, `test-phase2-components.js`, `test-phase3-integration.js`
- ⚠️ Comprehensive test coverage recommended for production use

### Registry Files
- `config/registries/departments.json` - All departments with metadata
- `config/registries/agents.json` - All agents organized by department
- `config/registries/workflows.json` - All workflows with execution data

### Auto-Generated Documentation
- `org-docs/COMMANDS_REFERENCE.md` - Master command reference
- `org-docs/departments/[dept].md` - Per-department documentation
- This file (CLAUDE.md) - Architecture updates

See `docs/STANDARDIZED-CREATION-SYSTEM-PLAN.md` for complete implementation plan.

## Working Directory Structure
```
/path/to/motus/
├── .claude/
│   ├── agents/           # Creator agents (4 agents)
│   │   ├── department-creator.md
│   │   ├── agent-creator.md
│   │   ├── workflow-creator.md
│   │   └── documentation-updater.md
│   └── commands/         # Command configurations
│       └── motus.md      # Main /motus command
├── templates/            # Handlebars templates for creation system
│   ├── department/       # Department templates
│   ├── agent/           # Agent templates (by type)
│   ├── workflow/        # Workflow templates
│   ├── docs/            # Documentation templates
│   └── schemas/         # JSON schemas
├── config/
│   └── registries/      # Central registry system
│       ├── departments.json  # Empty by default
│       ├── agents.json       # Empty by default
│       └── workflows.json    # Empty by default
├── lib/                 # Core libraries (5 libraries)
│   ├── template-engine.js    # Template rendering
│   ├── registry-manager.js   # Registry CRUD
│   ├── validator.js          # Validation system
│   ├── oauth-registry.js     # OAuth management
│   └── doc-generator.js      # Auto-doc generation
├── oauth-manager/       # OAuth Manager server
│   ├── server.js
│   └── public/         # Web UI
├── org-docs/            # Auto-generated documentation
│   ├── COMMANDS_REFERENCE.md
│   └── departments/    # Created as you add departments
├── public-docs/         # User-facing documentation (16 files)
├── docs/                # Technical documentation
│   ├── STANDARDIZED-CREATION-SYSTEM-PLAN.md
│   ├── PROJECT_OVERVIEW.md
│   └── GAP-REPORT.md
├── tests/               # Test suites (3 files)
├── .env.example         # Environment template
├── motus                # Main CLI executable
└── CLAUDE.md           # This file
```

**Your departments will be created at:**
- `.claude/agents/[department-name]-[agent-name].md` - Agent definitions
- Custom directories you create for implementations

## Development Notes
- Node.js 18+ required
- Uses Commander for CLI parsing
- Axios for HTTP requests
- Handlebars for templating
- JSON-based registries for state management
- OAuth2 integration support via OAuth Manager
- Extensible architecture for custom integrations

