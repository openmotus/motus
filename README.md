# Motus

**The automation framework for Claude Code — organize AI workflows into departments, agents, and templates.**

[![CI](https://github.com/openmotus/motus/actions/workflows/ci.yml/badge.svg)](https://github.com/openmotus/motus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-5A67D8)](https://claude.com/claude-code)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)

Motus gives Claude Code a management layer. Instead of loose scripts and ad-hoc prompts, you get **departments** (logical groups), **agents** (AI workers with defined roles), and **workflows** (multi-step automations that combine agents). Creation wizards scaffold everything — you customize the generated templates to match your needs.

```
You say: /motus department create marketing

Motus creates:
  departments/marketing/
    agents/
      marketing-admin.md          ← department coordinator
      marketing-orchestrator.md   ← workflow runner
      trend-analyzer.md           ← data-fetcher agent (template)
      content-creator.md          ← specialist agent (template)
      campaign-tracker.md         ← specialist agent (template)
    workflows/
      daily-trends.json           ← workflow config (template)
      content-pipeline.json       ← workflow config (template)
    docs/
      README.md                   ← auto-generated docs

You say: /motus marketing daily-trends
→ Agents run in parallel, compile results, output a report.
```

## Why Motus?

**Without Motus**, Claude Code automations are scattered files, undocumented agents, and manual orchestration. You forget what agents exist, how they connect, or what APIs they use.

**With Motus**, every automation lives in a structured hierarchy. Agents have defined types (data-fetcher, orchestrator, specialist). Workflows declare their steps, schedules, and outputs. A registry tracks everything. Documentation generates automatically.

Think of it as **Rails for AI automation** — you bring the business logic, Motus provides the architecture.

## Quick Start

### Prerequisites

- [Claude Code CLI](https://claude.ai/download) installed and authenticated
- Node.js 18+

### Install

```bash
git clone https://github.com/openmotus/motus.git
cd motus
npm install
```

### Create Your First Department

Open Claude Code CLI in the motus directory:

```bash
# Interactive wizard — creates agents, workflows, and docs
/motus department create tasks

# Add a custom agent to the department
/motus tasks agent create deadline-tracker

# Create a workflow combining multiple agents
/motus tasks workflow create daily-plan

# Run the workflow
/motus tasks daily-plan
```

The wizard generates working templates. You edit `departments/tasks/agents/*.md` to add your specific logic — API calls, data processing, output formatting. See [Creating Agents](public-docs/Creating-Agents.md) for details.

> **Important**: `/motus` commands run inside Claude Code CLI, not a regular terminal.

## What's Included

| Component | Description |
|-----------|-------------|
| **4 Creation Wizards** | Interactive generators for departments, agents, workflows, and docs |
| **11 Handlebars Templates** | Agent definitions, workflow configs, scripts, documentation |
| **20+ Template Helpers** | String transforms (kebabCase, pascalCase), conditionals, iterators |
| **Registry System** | JSON-based tracking of all departments, agents, and workflows |
| **OAuth Manager** | Web UI for managing OAuth2 connections to any service |
| **Doc Generator** | Auto-generates command reference and department docs from registries |
| **Validator** | Name checking, type detection, schema validation, format verification |

## Architecture

```
/motus [department] [command]
         │
         ▼
    ┌─────────────┐     ┌──────────────┐
    │ Departments  │────→│   Agents     │
    │ (groups)     │     │ (AI workers) │
    └─────────────┘     └──────┬───────┘
                               │
    ┌─────────────┐     ┌──────▼───────┐
    │Integrations │←────│  Workflows   │
    │ (APIs)      │     │ (pipelines)  │
    └─────────────┘     └──────────────┘
```

**Agent types:**
- **Orchestrator** — coordinates multi-agent workflows, decides execution order
- **Data Fetcher** — retrieves data from APIs (weather, calendar, email, etc.)
- **Specialist** — analyzes data, generates content, creates reports

**Workflow execution** supports parallel agent execution (fetch weather + calendar simultaneously) and sequential steps (compile results → create report).

## Example: Building a Daily Briefing

This walks through creating a real automation from scratch.

### 1. Create the department

```bash
/motus department create life
# Wizard generates: life-admin, life-orchestrator, + suggested agents
```

### 2. Add a weather agent

```bash
/motus life agent create weather-fetcher
# Type: data-fetcher
# Integration: WeatherAPI
```

The wizard generates `departments/life/agents/weather-fetcher.md` and `departments/life/agents/weather-fetcher.js`. The JS file is a template you fill in:

```javascript
// departments/life/agents/weather-fetcher.js (generated, then customized)
const axios = require('axios');

async function fetchWeather() {
  const API_KEY = process.env.WEATHER_API_KEY;
  const response = await axios.get(
    `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=Austin&days=1`
  );
  return {
    temp: response.data.current.temp_f,
    condition: response.data.current.condition.text,
    forecast: response.data.forecast.forecastday[0].day
  };
}
```

### 3. Add more agents

```bash
/motus life agent create calendar-fetcher    # Google Calendar events
/motus life agent create task-compiler       # Todoist/Notion tasks
/motus life agent create briefing-creator    # Compiles everything into a note
```

### 4. Create the workflow

```bash
/motus life workflow create morning-briefing
# Schedule: daily 7:00 AM
# Steps:
#   1. [parallel] weather-fetcher, calendar-fetcher, task-compiler
#   2. [sequential] briefing-creator
```

This generates a workflow config:

```json
{
  "name": "morning-briefing",
  "department": "life",
  "steps": [
    {
      "parallel": true,
      "agents": ["weather-fetcher", "calendar-fetcher", "task-compiler"]
    },
    {
      "parallel": false,
      "agents": ["briefing-creator"]
    }
  ],
  "trigger": { "type": "scheduled", "schedule": "daily 7:00" }
}
```

### 5. Run it

```bash
/motus life morning-briefing
```

All data-fetcher agents execute in parallel, then the briefing-creator compiles results into your preferred format (Obsidian note, Notion page, terminal output).

## Project Structure

```
motus/
├── .claude/commands/motus.md    # The /motus slash command
├── .claude/agents/              # Creator wizard agents
├── config/registries/           # Department/agent/workflow registries (JSON)
├── departments/                 # Your created departments live here
├── lib/                         # Core libraries
│   ├── registry-manager.js      #   CRUD for departments, agents, workflows
│   ├── template-engine.js       #   Handlebars rendering + 20 custom helpers
│   ├── validator.js             #   Name, type, and schema validation
│   ├── doc-generator.js         #   Auto-doc generation from registries
│   └── oauth-registry.js        #   OAuth2 service management
├── templates/                   # 11 Handlebars templates
├── oauth-manager/               # OAuth Manager web server
├── public-docs/                 # User documentation
├── org-docs/                    # Auto-generated reference docs
└── tests/                       # Test suite (48 tests)
```

## Documentation

| Guide | Description |
|-------|-------------|
| [Introduction](public-docs/Introduction.md) | What Motus is and how it works |
| [Quick Start](public-docs/Quick-Start.md) | Get running in 5 minutes |
| [Concepts](public-docs/Concepts.md) | Departments, agents, workflows explained |
| [Creating Departments](public-docs/Creating-Departments.md) | Department wizard walkthrough |
| [Creating Agents](public-docs/Creating-Agents.md) | Agent types and customization |
| [Creating Workflows](public-docs/Creating-Workflows.md) | Workflow configuration and scheduling |
| [Examples](public-docs/Examples.md) | Real-world use cases |
| [OAuth Manager](public-docs/OAuth-Manager.md) | Setting up OAuth2 integrations |
| [API Reference](public-docs/API-Reference.md) | Library API documentation |
| [Troubleshooting](public-docs/Troubleshooting.md) | Common issues and fixes |

## Contributing

```bash
git clone https://github.com/openmotus/motus.git
cd motus
npm install
npm test   # 48 tests across 3 suites
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines, or check [open issues](https://github.com/openmotus/motus/issues) for ways to help.

## Roadmap

- [ ] Plugin system for community-shared departments and agents
- [ ] Web dashboard for monitoring workflow runs
- [ ] Slack and Todoist integrations
- [ ] Workflow execution history and analytics
- [ ] npm package distribution (`npx create-motus`)

## License

MIT - see [LICENSE](LICENSE).

---

**Created by** [Ian Borders](https://x.com/OpenMotus) | **Built for** [Claude Code](https://claude.com/claude-code) | **Powered by** [Claude](https://claude.ai)
