# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands to Build, Test, and Run

### Core Commands
```bash
# Install dependencies
npm install

# Run main Motus command
./motus [command] [options]

# Core life automation commands
./motus daily-brief        # Generate morning briefing with weather, calendar, emails, tasks
./motus daily-notion       # Create daily briefing in Notion database
./motus evening-report     # Generate evening accomplishment report
./motus life review        # Interactive evening review
./motus life calendar      # Check today's calendar
./motus life emails        # Review important emails
./motus life tasks         # View prioritized tasks

# OAuth and authentication
./start-oauth-manager.sh   # Launch OAuth Manager at localhost:3001

# Automation setup
./setup-automation.sh      # Configure automated workflows
./install-cron.sh          # Install scheduled tasks
```

### Environment Configuration
Copy `.env.example` to `.env` and configure:
- `WEATHER_API_KEY` - WeatherAPI.com key for weather data
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth credentials
- `NOTION_API_KEY`, `NOTION_DATABASE_ID` - Notion integration tokens
- `OBSIDIAN_VAULT_PATH` - Path to Obsidian vault (usually `/Users/username/Library/Mobile Documents/iCloud~md~obsidian/Documents`)

## Architecture Overview

### System Architecture
The Motus system is a Claude Code automation framework that orchestrates specialized AI agents for life and business management:

1. **Command Entry Point** (`/motus` command in `.claude/commands/motus.md`)
   - Routes commands to appropriate handlers
   - MUST use Task tool for parallel agent execution (never sequential)
   - Delegates to specialized agents defined in `.claude/agents/`

2. **Agent Orchestration Pattern**
   - **Parallel Execution**: Data collection agents (weather, calendar, email, tasks) run simultaneously
   - **Sequential Processing**: Analysis and creation agents run after data collection
   - **Specialized Agents**: Each agent has a single responsibility (weather fetching, calendar reading, etc.)

3. **Key Agents** (in `.claude/agents/`)
   - `weather-fetcher` - Gets weather from WeatherAPI
   - `calendar-fetcher` - Retrieves Google Calendar events  
   - `email-processor` - Processes Gmail for important emails
   - `task-compiler` - Compiles and prioritizes tasks
   - `oura-fetcher` - Gets Oura ring sleep data
   - `insight-generator` - Analyzes data and generates insights
   - `note-creator` - Creates/updates Obsidian daily notes
   - `notion-creator` - Creates Notion Daily Journal entries

### Integration Points
- **Obsidian**: Daily notes in vault at `OBSIDIAN_VAULT_PATH/Daily/`
- **Notion**: Daily Journal database via Notion API
- **Google Services**: Calendar and Gmail via OAuth2
- **WeatherAPI**: Current and forecast weather data
- **Oura Ring**: Sleep and health metrics via API

### Data Flow for Daily Brief
1. Parallel data collection from all sources
2. Data aggregation and insight generation
3. Note creation in Obsidian or Notion
4. User receives formatted summary

## Critical Implementation Rules

### Agent Execution
- **ALWAYS** use Task tool for agent delegation, never Bash
- **ALWAYS** run data collection agents in parallel (weather, calendar, email, tasks)
- **NEVER** use sequential execution for independent data sources
- **USE** specific agents from `.claude/agents/`, not generic scripts

### API Integration
- Use actual API integrations (Weather, Google, Notion), never mock data
- Store credentials securely in `.env` file
- Use OAuth2 for Google services via OAuth Manager

### Daily Note Format
- Obsidian notes use markdown with checkboxes and sections
- Notion pages use database properties and content blocks
- Email items must be formatted as checkable tasks (☐ prefix)

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

**Templates:** (14 templates)
- Department: `department-agent.md`, `orchestrator-agent.md`
- Agents: `data-fetcher-agent.md`, `data-fetcher-script.js`, `orchestrator-agent.md`, `specialist-agent.md`
- Workflows: `workflow-config.json`, `workflow-trigger.sh`
- Documentation: `commands-reference.md`, `department-docs.md`

**Testing:**
- ✅ Template engine tests (7/7 passing)
- ✅ Phase 2 components tests (48/48 passing)

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
/Users/ianwinscom/motus/
├── .claude/
│   ├── agents/           # Specialized agent definitions (26 existing)
│   └── commands/         # Command configurations
├── templates/            # Handlebars templates for creation system
│   ├── department/       # Department templates
│   ├── agent/           # Agent templates (by type)
│   ├── workflow/        # Workflow templates
│   └── docs/            # Documentation templates
├── config/
│   └── registries/      # Central registry system
│       ├── departments.json
│       ├── agents.json
│       └── workflows.json
├── lib/                 # Core libraries
│   ├── template-engine.js    # Template rendering
│   ├── registry-manager.js   # Registry CRUD
│   ├── validator.js          # Validation system
│   └── doc-generator.js      # Auto-doc generation
├── org-docs/            # Auto-generated documentation
│   ├── COMMANDS_REFERENCE.md
│   └── departments/
├── life-admin/
│   ├── departments/     # Organized by department
│   │   └── life/
│   │       ├── agents/
│   │       └── workflows/
│   └── [existing scripts...]
├── data/                # Local data storage
├── docs/                # Master documentation
│   ├── STANDARDIZED-CREATION-SYSTEM-PLAN.md
│   ├── PROJECT_OVERVIEW.md
│   └── AGENT_DEVELOPMENT_GUIDE.md
├── motus                # Main executable
└── CLAUDE.md           # This file (persistent memory)
```

## Development Notes
- Node.js 18+ required
- Uses Commander for CLI parsing
- Axios for HTTP requests
- Google APIs and Notion SDK for integrations
- All timestamps in user's configured timezone (default: Asia/Bangkok)

## Personal Configuration

### User Preferences
- Prefer concise summaries
- Priority on health and fitness
- Financial conservative approach
- Learning focus on tech and languages

### Current Goals
- [ ] Exercise 4x per week
- [ ] Read 2 books per month
- [ ] Save 20% of income

### Tracked Habits
- Meditation
- Exercise
- Reading
- Water intake (8 glasses)
- Sleep (7+ hours)

### Health Metrics
- Target Steps: 10,000/day
- Target Calories: 2,200/day
- Sleep Goal: 7.5 hours
- Water Goal: 8 glasses