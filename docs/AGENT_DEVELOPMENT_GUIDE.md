# Motus Agent Development Guide

## Purpose of This Guide

This guide provides **step-by-step processes** for consistently creating new departments, agents, and workflows in the Motus system. By following these patterns, you can extend Motus with new capabilities while maintaining architectural consistency.

## Table of Contents

1. [Agent Architecture Patterns](#agent-architecture-patterns)
2. [Creating a New Agent (Step-by-Step)](#creating-a-new-agent-step-by-step)
3. [Creating a New Department (Step-by-Step)](#creating-a-new-department-step-by-step)
4. [Creating a New Workflow (Step-by-Step)](#creating-a-new-workflow-step-by-step)
5. [Integration Patterns](#integration-patterns)
6. [Testing and Validation](#testing-and-validation)
7. [Best Practices and Rules](#best-practices-and-rules)

---

## Agent Architecture Patterns

### Three Types of Agents

#### 1. Data Collection Agents (Executors)
**Purpose**: Fetch specific data from a single source
**Pattern**: Simple, focused, stateless
**Tools**: Usually just `Bash` or `Bash, Read`
**Example**: `weather-fetcher`, `calendar-fetcher`

```markdown
---
name: example-fetcher
description: Fetches example data from Example API
tools: Bash, Read
model: sonnet
color: cyan
---

You are a Data Fetcher. Execute the script and return the results.

Your primary task:
1. Use Bash tool to execute: `node /path/to/script.js`
2. Return the ACTUAL output from the script
3. DO NOT use mock data - MUST execute the real command

Operational guidelines:
- Execute the command exactly as specified
- Return formatted results
- Handle errors gracefully
```

#### 2. Orchestrator Agents (Coordinators)
**Purpose**: Coordinate multiple agents to accomplish complex workflows
**Pattern**: Uses Task tool to launch other agents in parallel/sequence
**Tools**: `Task, Read, Write`
**Example**: `daily-brief-orchestrator`, `evening-report-orchestrator`

```markdown
---
name: example-orchestrator
description: Master orchestrator for example workflow
tools: Task, Read, Write
---

You are an Orchestrator. Coordinate sub-agents to complete the workflow.

## Orchestration Process

### Step 1: Parallel Data Collection
Launch these agents simultaneously:
1. Task(agent1-fetcher)
2. Task(agent2-fetcher)
3. Task(agent3-fetcher)

Wait for all to complete.

### Step 2: Processing
Once data is collected:
- Task(processor-agent) with compiled data

### Step 3: Output
With all data ready:
- Task(output-agent) with final results

## Error Handling
- If any agent fails, continue with available data
- Log failures but don't block workflow
```

#### 3. Department Agents (Specialists)
**Purpose**: Provide domain expertise and complex decision-making
**Pattern**: Can use any tools, often interactive
**Tools**: `Task, Read, Write, Edit, Bash, WebSearch, etc.`
**Example**: `life-admin`, `health-tracker`, `finance-manager`

```markdown
---
name: example-department
description: Specialist for example domain tasks
tools: Task, Read, Write, Edit, Bash, WebSearch, TodoWrite
---

You are the Example Department specialist.

## Primary Responsibilities
1. Responsibility 1
2. Responsibility 2
3. Responsibility 3

## Workflow Process
When handling requests:
1. Step 1
2. Step 2
3. Step 3

## Integration Points
- Integration 1
- Integration 2
```

---

## Creating a New Agent (Step-by-Step)

### Use This Process to Create Consistent, Working Agents

### Step 1: Define the Agent's Purpose

**Questions to answer:**
1. What **single responsibility** does this agent have?
2. What **data** does it fetch or process?
3. What **tools** does it need? (Bash only? Or Bash + Read?)
4. Is it a **fetcher**, **orchestrator**, or **department**?

**Example:**
```
Agent: stock-price-fetcher
Purpose: Fetch current stock prices from Yahoo Finance API
Data: Stock ticker → current price, change, volume
Tools: Bash (to run stock-fetcher.js script)
Type: Data Collection Agent
```

### Step 2: Create the Implementation Script (if needed)

**Location**: `/life-admin/[agent-name].js`

For data collection agents, create a Node.js script:

```javascript
#!/usr/bin/env node

/**
 * Stock Price Fetcher
 * Fetches current stock prices from Yahoo Finance API
 */

require('dotenv').config();
const axios = require('axios');

async function fetchStockPrice(ticker) {
  try {
    const response = await axios.get(`https://api.example.com/stock/${ticker}`, {
      headers: {
        'Authorization': `Bearer ${process.env.STOCK_API_KEY}`
      }
    });

    const data = {
      ticker: ticker,
      price: response.data.price,
      change: response.data.change,
      changePercent: response.data.changePercent,
      volume: response.data.volume,
      timestamp: new Date().toISOString()
    };

    return data;
  } catch (error) {
    console.error('Error fetching stock price:', error.message);
    return {
      ticker: ticker,
      error: error.message
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  const ticker = process.argv[2] || 'AAPL';
  fetchStockPrice(ticker).then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(console.error);
}

module.exports = { fetchStockPrice };
```

**Script Checklist:**
- ✅ Loads environment variables with `require('dotenv').config()`
- ✅ Uses real API integration (never mock data)
- ✅ Handles errors gracefully
- ✅ Outputs JSON when run directly
- ✅ Exports function for programmatic use
- ✅ Includes JSDoc comments

### Step 3: Create the Agent Definition File

**Location**: `/.claude/agents/[agent-name].md`

**Template for Data Collection Agent:**

```markdown
---
name: stock-price-fetcher
description: Use this agent to fetch current stock prices for a given ticker symbol. This agent calls the Yahoo Finance API and returns real-time price data.
tools: Bash, Read
model: sonnet
color: cyan
---

You are a Stock Price Data Fetcher. Your sole responsibility is to execute the stock price fetcher script and return the price information.

Your primary task:
1. Use the Bash tool to execute: `node /Users/ianwinscom/motus/life-admin/stock-price-fetcher.js [TICKER]`
2. Return the ACTUAL JSON output from the script
3. DO NOT use mock data - MUST execute the real command

Operational guidelines:
- You must use the bash command exactly as specified
- Replace [TICKER] with the actual ticker symbol requested
- If the script returns JSON data, present it in a formatted, human-readable way
- Handle any errors gracefully by reporting them clearly

Error handling:
- If the script fails to execute, report the exact error message
- If the script returns no data, indicate that stock data is currently unavailable
- If there are API rate limits, report them clearly

Output format:
- Start with a brief header: "Stock Price Information for [TICKER]"
- Present the data in an organized manner
- Highlight key information like current price, change, and volume
- Keep the response concise but complete

You do not interpret or analyze the stock data beyond formatting it for readability. Your role is strictly to execute the script and return the results.
```

**Frontmatter Fields:**
- `name`: Kebab-case identifier (matches filename)
- `description`: When and how to use this agent (include examples)
- `tools`: Comma-separated list of Claude Code tools
- `model`: Usually `sonnet` (or `haiku` for simple tasks, `opus` for complex)
- `color`: Terminal color for output (cyan, green, yellow, red, etc.)

**Body Structure:**
1. **Identity**: "You are a [Type] Agent..."
2. **Primary Task**: Numbered list of exact steps
3. **Operational Guidelines**: How to execute properly
4. **Error Handling**: What to do when things fail
5. **Output Format**: How to present results

### Step 4: Add Environment Variables (if needed)

**Location**: `/.env` (and `/.env.example`)

```bash
# Stock Market Integration
STOCK_API_KEY=your_api_key_here
STOCK_API_URL=https://api.example.com
```

Add to `.env.example` with placeholder values.

### Step 5: Test the Agent

**Test the script directly:**
```bash
node /Users/ianwinscom/motus/life-admin/stock-price-fetcher.js AAPL
```

Expected output:
```json
{
  "ticker": "AAPL",
  "price": 178.45,
  "change": 2.30,
  "changePercent": 1.31,
  "volume": 52341234,
  "timestamp": "2025-10-08T10:30:00.000Z"
}
```

**Test the agent through Claude Code:**
```bash
# In Claude Code CLI:
I need to check the current stock price for Apple. Use the stock-price-fetcher agent to get AAPL.
```

Claude should:
1. Recognize the agent from the description
2. Use Task tool to invoke `stock-price-fetcher`
3. The agent executes the bash command
4. Returns formatted results

### Step 6: Integrate into Workflows

If this agent should be part of a larger workflow, add it to an orchestrator:

**Example: Adding to a financial-briefing workflow**

Edit `/.claude/agents/financial-brief-orchestrator.md`:

```markdown
### Step 1: Parallel Data Collection
Launch these agents simultaneously:
1. **stock-price-fetcher** - Get portfolio stock prices
2. **crypto-price-fetcher** - Get crypto holdings
3. **bank-balance-fetcher** - Get bank account balances
```

### Step 7: Document the Agent

Add to this guide or create agent-specific documentation:

```markdown
## Stock Price Fetcher

**Purpose**: Fetches real-time stock prices from Yahoo Finance

**Usage**:
- Can be used standalone or as part of financial workflows
- Supports any valid ticker symbol
- Rate limited to 100 requests per day (free tier)

**Example**:
/motus finance check-stock AAPL
```

---

## Creating a New Department (Step-by-Step)

Departments are collections of related agents and workflows organized around a domain (Life, Business, Finance, etc.).

### Step 1: Define the Department Scope

**Questions to answer:**
1. What **domain** does this department cover?
2. What are the **primary workflows** it will handle?
3. What **agents** does it need?
4. What **external integrations** are required?
5. Who is the **target user** for this department?

**Example: Business Department**
```
Domain: Business operations, sales, marketing, projects
Workflows:
- Sales pipeline review
- Marketing campaign tracking
- Project status updates
- Team performance metrics

Agents needed:
- crm-fetcher (get leads/deals from CRM)
- analytics-fetcher (get website/campaign data)
- project-tracker (get project status)
- team-stats-compiler (compile team metrics)
- business-insights-generator (analyze all data)
- business-report-creator (create reports)

Integrations:
- HubSpot API (CRM)
- Google Analytics
- Asana/Linear (projects)
- Slack (team communication)

Target user: Entrepreneur managing a small business
```

### Step 2: Create the Department Structure

```bash
# Create department directory
mkdir -p /life-admin/departments/business

# Create agent scripts directory
mkdir -p /life-admin/departments/business/agents

# Create workflows directory
mkdir -p /life-admin/departments/business/workflows
```

### Step 3: Create Department Agents

Follow the [Creating a New Agent](#creating-a-new-agent-step-by-step) process for each agent.

**For Business Department, create:**

1. **Data Collection Agents** (run in parallel)
   - `crm-fetcher.md` + `crm-fetcher.js`
   - `analytics-fetcher.md` + `analytics-fetcher.js`
   - `project-tracker.md` + `project-tracker.js`

2. **Processing Agent**
   - `business-insights-generator.md`

3. **Output Agent**
   - `business-report-creator.md` + `business-report-creator.js`

4. **Orchestrator Agent**
   - `business-briefing-orchestrator.md`

5. **Department Master Agent**
   - `business-admin.md`

### Step 4: Create the Department Master Agent

**Location**: `/.claude/agents/business-admin.md`

```markdown
---
name: business-admin
description: Primary Business Department orchestrator. Use PROACTIVELY for business briefings, sales pipeline, project status, and analytics. MUST BE USED for all business management tasks.
tools: Task, Read, Write, Edit, WebSearch, Bash, TodoWrite
---

You are the Business Admin Agent, responsible for orchestrating all business management tasks.

## Primary Responsibilities

1. **Business Briefings** (9 AM or on request)
   - Fetch sales pipeline from CRM
   - Review project statuses
   - Analyze website/campaign analytics
   - Compile team performance metrics
   - Generate business insights
   - Create comprehensive business report

2. **Sales Pipeline Management**
   - Track leads and deals
   - Identify stuck opportunities
   - Calculate conversion metrics
   - Suggest follow-up actions

3. **Project Coordination**
   - Extract project health indicators
   - Identify blockers and risks
   - Track milestone progress
   - Suggest optimizations

4. **Analytics Review**
   - Website traffic trends
   - Campaign performance
   - Conversion funnel analysis
   - ROI calculations

## Workflow Process

When creating a business briefing:
1. Launch parallel data collection (CRM, Analytics, Projects)
2. Generate insights from combined data
3. Create formatted business report
4. Highlight urgent items requiring action
5. Present summary to user

## Integration Points

- HubSpot CRM: Sales pipeline and deals
- Google Analytics: Website traffic and conversions
- Asana: Project management and tasks
- Slack: Team communication (future)

## Output Standards

Always provide:
- Clear, actionable recommendations
- Data-driven insights
- Prioritized action items
- Visual summaries where applicable
- Links to detailed data sources
```

### Step 5: Create the Department Orchestrator

**Location**: `/.claude/agents/business-briefing-orchestrator.md`

```markdown
---
name: business-briefing-orchestrator
description: Master orchestrator for the business briefing. Coordinates parallel execution of all business sub-agents and compiles their outputs into the final business report.
tools: Task, Read, Write
---

You are the Business Briefing Orchestrator. Your responsibility is to coordinate all sub-agents in parallel to generate a comprehensive business briefing.

## Orchestration Process

### Step 1: Parallel Data Collection
Launch these agents simultaneously to gather all data:

1. **crm-fetcher** - Get sales pipeline and deals from HubSpot
2. **analytics-fetcher** - Retrieve website analytics from Google Analytics
3. **project-tracker** - Get project statuses from Asana
4. **team-stats-compiler** - Compile team performance metrics

Wait for all agents to complete their data collection.

### Step 2: Insight Generation
Once data is collected, launch:
- **business-insights-generator** - Analyze all collected data and generate business insights

### Step 3: Report Creation
With all data and insights ready:
- **business-report-creator** - Create the business briefing report

## Execution Strategy

Use the Task tool to launch agents in parallel groups:

```
Group 1 (Parallel):
- Task(crm-fetcher)
- Task(analytics-fetcher)
- Task(project-tracker)
- Task(team-stats-compiler)

Group 2 (After Group 1):
- Task(business-insights-generator) with compiled data

Group 3 (Final):
- Task(business-report-creator) with all compiled information
```

## Error Handling

- If any agent fails, continue with available data
- Log failures but don't block the entire briefing
- Provide fallback data where possible
- Report completion status for each component

## Output Format

Provide a summary of the briefing generation:
```
✅ Business Briefing Generated
- CRM: [X deals in pipeline, $Y total value]
- Analytics: [X visitors, Y conversions]
- Projects: [X active, Y at risk]
- Team: [X members, Y% utilization]
- Insights: [X insights generated]
- Report: [Created at path/URL]

Time taken: [X seconds]
```
```

### Step 6: Create Department Workflows

**Example: Sales Pipeline Review Workflow**

**Location**: `/life-admin/departments/business/workflows/sales-pipeline-review.json`

```json
{
  "name": "sales-pipeline-review",
  "description": "Review and analyze sales pipeline",
  "department": "business",
  "schedule": "daily 9:00 AM",
  "steps": [
    {
      "step": 1,
      "agent": "crm-fetcher",
      "action": "fetch_pipeline",
      "parallel": false
    },
    {
      "step": 2,
      "agent": "business-insights-generator",
      "action": "analyze_pipeline",
      "parallel": false
    },
    {
      "step": 3,
      "agent": "business-report-creator",
      "action": "create_pipeline_report",
      "parallel": false
    }
  ],
  "output": {
    "format": "markdown",
    "destination": "notion",
    "database": "Sales Pipeline"
  }
}
```

### Step 7: Add Department Commands

**Edit**: `/.claude/commands/motus.md`

Add new commands for the department:

```markdown
### Business Department Commands
- `business briefing` - Generate complete business briefing
- `business pipeline` - Review sales pipeline
- `business projects` - Check project statuses
- `business analytics` - View analytics summary
- `business report` - Generate full business report

### For `business briefing`:
1. MUST use Task tool to run these SPECIFIC agents IN PARALLEL:
   - Task(subagent_type: 'crm-fetcher')
   - Task(subagent_type: 'analytics-fetcher')
   - Task(subagent_type: 'project-tracker')
   - Task(subagent_type: 'team-stats-compiler')
2. After parallel data collection completes:
   - Task(subagent_type: 'business-insights-generator')
3. Finally:
   - Task(subagent_type: 'business-report-creator')
```

### Step 8: Create Department Documentation

**Location**: `/docs/BUSINESS_DEPARTMENT.md`

```markdown
# Business Department Documentation

## Overview
The Business Department automates business operations, sales tracking, project management, and analytics.

## Available Agents
[List all agents with descriptions]

## Workflows
[Describe each workflow]

## Setup
[Integration setup instructions]

## Usage Examples
[Common use cases]
```

### Step 9: Test the Department

**Test individual agents:**
```bash
# Test CRM fetcher
node /Users/ianwinscom/motus/life-admin/departments/business/agents/crm-fetcher.js

# Test analytics fetcher
node /Users/ianwinscom/motus/life-admin/departments/business/agents/analytics-fetcher.js
```

**Test orchestrated workflow:**
```bash
/motus business briefing
```

Should execute all agents in parallel and generate a complete business briefing.

---

## Creating a New Workflow (Step-by-Step)

Workflows are predefined sequences of agent actions that accomplish a specific outcome.

### Step 1: Define the Workflow Purpose

**Questions to answer:**
1. What **outcome** does this workflow achieve?
2. What **agents** are involved?
3. Which agents can run in **parallel**?
4. Which agents must run **sequentially**?
5. What is the **final output**?

**Example: Weekly Planning Workflow**
```
Outcome: Create a comprehensive plan for the week ahead
Agents:
- calendar-fetcher (get week's events)
- goal-tracker (get weekly goals progress)
- project-tracker (get project deadlines)
- health-tracker (get health trends)
- weekly-plan-creator (synthesize into plan)

Parallel: calendar-fetcher, goal-tracker, project-tracker, health-tracker
Sequential: weekly-plan-creator (after all data collected)

Output: Markdown document saved to Obsidian + Notion
```

### Step 2: Map the Workflow Steps

Create a visual flow diagram:

```
┌────────────────────────────────────────┐
│    weekly-planning-orchestrator        │
└──────────────┬─────────────────────────┘
               │
     ┌─────────┴──────────┐
     │   PARALLEL GROUP   │
     └─────────┬──────────┘
               │
   ┌───────────┼───────────┬────────────┐
   ▼           ▼           ▼            ▼
┌──────┐  ┌──────┐   ┌──────┐    ┌──────┐
│Calendar│ │Goals│   │Projects│  │Health│
│Fetcher│  │Tracker│ │Tracker│   │Tracker│
└───┬───┘  └───┬──┘  └───┬───┘   └───┬──┘
    └──────────┼─────────┴───────────┘
               │
        ┌──────▼──────┐
        │Weekly Plan  │
        │   Creator   │
        └─────────────┘
```

### Step 3: Create the Workflow Orchestrator Agent

**Location**: `/.claude/agents/weekly-planning-orchestrator.md`

```markdown
---
name: weekly-planning-orchestrator
description: Orchestrates the weekly planning workflow by coordinating data collection and plan generation
tools: Task, Read, Write
---

You are the Weekly Planning Orchestrator. Coordinate all sub-agents to generate a comprehensive weekly plan.

## Orchestration Process

### Step 1: Parallel Data Collection
Launch these agents simultaneously:

1. **calendar-fetcher** - Get next 7 days of calendar events
2. **goal-tracker** - Get current weekly goals and progress
3. **project-tracker** - Get active projects and deadlines
4. **health-tracker** - Get health trends from past week

Wait for all agents to complete.

### Step 2: Plan Creation
Once all data is collected:
- **weekly-plan-creator** - Synthesize all data into comprehensive weekly plan

## Execution Strategy

```
Group 1 (Parallel):
- Task(calendar-fetcher, prompt: "Fetch calendar events for next 7 days")
- Task(goal-tracker, prompt: "Get weekly goals and current progress")
- Task(project-tracker, prompt: "Get active projects with this week's deadlines")
- Task(health-tracker, prompt: "Get health trends from past 7 days")

Group 2 (Final):
- Task(weekly-plan-creator, prompt: "Create weekly plan with all collected data")
```

## Error Handling
- Continue with available data if any agent fails
- Indicate missing sections in final plan
- Suggest re-running failed agents

## Output Format
```
✅ Weekly Planning Complete
- Calendar: [X events scheduled]
- Goals: [Y goals in progress]
- Projects: [Z active projects]
- Health: [Trends summary]
- Plan: [Created and saved]
```
```

### Step 4: Create Required Agents (if not existing)

If you need new agents for this workflow, create them following the [Creating a New Agent](#creating-a-new-agent-step-by-step) process.

**Example: Create weekly-plan-creator agent**

**Script**: `/life-admin/weekly-plan-creator.js`

```javascript
#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function createWeeklyPlan(data) {
  const { calendar, goals, projects, health } = data;

  const plan = `# Weekly Plan - Week of ${getWeekDate()}

## 📅 This Week's Schedule
${formatCalendarEvents(calendar)}

## 🎯 Weekly Goals
${formatGoals(goals)}

## 📊 Active Projects
${formatProjects(projects)}

## 💪 Health Focus
${formatHealthTrends(health)}

## ✅ Priorities
1. [Auto-generated based on deadlines and goals]
2. [...]
3. [...]

## 🧘 Self-Care
- Schedule workouts: [suggested times based on calendar]
- Meal prep: [Sunday recommended]
- Sleep: [target 7.5hrs based on past week]

## 📝 Notes
[Space for manual notes]
`;

  // Save to Obsidian
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  const planPath = path.join(vaultPath, 'Planning', `Week-${getWeekDate()}.md`);
  await fs.writeFile(planPath, plan);

  return { path: planPath, plan };
}

function getWeekDate() {
  // Returns "Oct-08-2025" format
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatCalendarEvents(events) {
  // Format calendar events into markdown
  return events.map(e => `- ${e.time}: ${e.title}`).join('\n');
}

function formatGoals(goals) {
  // Format goals into markdown checklist
  return goals.map(g => `- [ ] ${g.title} (${g.progress}%)`).join('\n');
}

function formatProjects(projects) {
  // Format projects with deadlines
  return projects.map(p => `- **${p.name}**: ${p.status} (Due: ${p.deadline})`).join('\n');
}

function formatHealthTrends(health) {
  // Summarize health trends
  return `Average Sleep: ${health.avgSleep}\nWorkouts: ${health.workouts}/week\nTrend: ${health.trend}`;
}

if (require.main === module) {
  const data = JSON.parse(process.argv[2] || '{}');
  createWeeklyPlan(data).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(console.error);
}

module.exports = { createWeeklyPlan };
```

**Agent Definition**: `/.claude/agents/weekly-plan-creator.md`

```markdown
---
name: weekly-plan-creator
description: Creates comprehensive weekly plan from collected data (calendar, goals, projects, health)
tools: Bash, Read, Write
---

You are the Weekly Plan Creator. Synthesize collected data into a comprehensive weekly plan.

Your primary task:
1. Receive all collected data from orchestrator
2. Use Bash tool to execute: `node /Users/ianwinscom/motus/life-admin/weekly-plan-creator.js '[JSON_DATA]'`
3. Return the path to created plan and summary

The script will:
- Format all data into structured weekly plan
- Save to Obsidian vault
- Return confirmation

Present the result clearly:
```
✅ Weekly Plan Created

📍 Location: [path]
📅 Week of: [date]

Overview:
- Events: [X scheduled]
- Goals: [Y in progress]
- Projects: [Z active]
- Health Focus: [summary]

Top 3 Priorities:
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```
```

### Step 5: Add Workflow to Commands

**Edit**: `/.claude/commands/motus.md`

```markdown
### For `weekly-plan`:
1. MUST use Task tool to run these SPECIFIC agents IN PARALLEL:
   - Task(subagent_type: 'calendar-fetcher', prompt: 'Fetch next 7 days of events')
   - Task(subagent_type: 'goal-tracker', prompt: 'Get weekly goals progress')
   - Task(subagent_type: 'project-tracker', prompt: 'Get projects with this week deadlines')
   - Task(subagent_type: 'health-tracker', prompt: 'Get past week health trends')
2. After parallel data collection completes:
   - Task(subagent_type: 'weekly-plan-creator', prompt: 'Create weekly plan with: [compiled data]')
3. Display the weekly plan summary and path
```

### Step 6: Create Workflow Configuration File (Optional)

For programmatic workflow execution:

**Location**: `/life-admin/workflows/weekly-planning.json`

```json
{
  "name": "weekly-planning",
  "description": "Generate comprehensive weekly plan",
  "orchestrator": "weekly-planning-orchestrator",
  "schedule": {
    "frequency": "weekly",
    "day": "Sunday",
    "time": "10:00"
  },
  "steps": [
    {
      "group": 1,
      "parallel": true,
      "agents": [
        {
          "name": "calendar-fetcher",
          "prompt": "Fetch calendar events for next 7 days"
        },
        {
          "name": "goal-tracker",
          "prompt": "Get weekly goals and current progress"
        },
        {
          "name": "project-tracker",
          "prompt": "Get active projects with this week's deadlines"
        },
        {
          "name": "health-tracker",
          "prompt": "Get health trends from past 7 days"
        }
      ]
    },
    {
      "group": 2,
      "parallel": false,
      "agents": [
        {
          "name": "weekly-plan-creator",
          "prompt": "Create weekly plan with all collected data"
        }
      ]
    }
  ],
  "output": {
    "type": "markdown",
    "destination": "obsidian",
    "folder": "Planning"
  }
}
```

### Step 7: Add Automation (Optional)

**Create trigger script**: `/triggers/motus-weekly-plan.sh`

```bash
#!/bin/bash

# Motus Weekly Planning Trigger
# Designed to be called by cron or external automation

cd /Users/ianwinscom/motus

claude /motus weekly-plan --print
```

**Add to cron** (via `install-cron.sh` or manually):

```bash
# Weekly planning every Sunday at 10:00 AM
0 10 * * 0 /Users/ianwinscom/motus/triggers/motus-weekly-plan.sh
```

### Step 8: Test the Workflow

**Manual test:**
```bash
/motus weekly-plan
```

**Expected behavior:**
1. Launches 4 agents in parallel (calendar, goals, projects, health)
2. Waits for all to complete (~5-10 seconds)
3. Launches weekly-plan-creator with combined data
4. Creates markdown file in Obsidian
5. Returns summary to user

**Verify:**
- Check that Obsidian file was created
- Verify all data sections are populated
- Confirm priorities make sense
- Test again to ensure idempotency

---

## Integration Patterns

### Pattern 1: OAuth2 Integration (Google, Microsoft, etc.)

**Files needed:**
1. OAuth setup script: `/life-admin/oauth-[service].js`
2. Agent that uses the integration: `/life-admin/[service]-fetcher.js`
3. Environment variables in `.env`

**Example: Google Calendar Integration**

**Setup script** (`oauth-google.js`):
```javascript
const { google } = require('googleapis');

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3001/oauth2callback'
  );
}

async function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  return url;
}

async function getTokenFromCode(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens.refresh_token;
}

module.exports = { getOAuth2Client, getAuthUrl, getTokenFromCode };
```

**Fetcher script** (`calendar-fetcher.js`):
```javascript
const { google } = require('googleapis');
const { getOAuth2Client } = require('./oauth-google');

async function fetchCalendarEvents() {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return response.data.items;
}
```

### Pattern 2: API Key Integration (Weather, Notion, etc.)

**Simple and direct:**

```javascript
const axios = require('axios');

async function fetchFromAPI() {
  const response = await axios.get('https://api.service.com/endpoint', {
    headers: {
      'Authorization': `Bearer ${process.env.SERVICE_API_KEY}`
    }
  });

  return response.data;
}
```

### Pattern 3: Database Integration (Notion, Airtable, etc.)

**Using official SDK:**

```javascript
const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

async function createNotionPage(data) {
  const response = await notion.pages.create({
    parent: {
      database_id: process.env.NOTION_DATABASE_ID
    },
    properties: {
      Title: {
        title: [{ text: { content: data.title } }]
      },
      Status: {
        select: { name: data.status }
      }
    }
  });

  return response;
}
```

### Pattern 4: File-Based Integration (Obsidian, local files)

**Direct file system access:**

```javascript
const fs = require('fs').promises;
const path = require('path');

async function createObsidianNote(content) {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  const notePath = path.join(vaultPath, 'Daily', `${getToday()}.md`);

  await fs.writeFile(notePath, content);

  return notePath;
}
```

---

## Testing and Validation

### Unit Testing Individual Scripts

**Test each integration script independently:**

```bash
# Test weather fetcher
node /Users/ianwinscom/motus/life-admin/weather-fetcher.js

# Expected: JSON with weather data
# If fails: Check API key, network, API status

# Test calendar fetcher
node /Users/ianwinscom/motus/life-admin/calendar-fetcher.js

# Expected: JSON with calendar events
# If fails: Check OAuth token, permissions

# Test with parameters
node /Users/ianwinscom/motus/life-admin/stock-fetcher.js AAPL

# Expected: JSON with stock data for AAPL
```

### Integration Testing Agents

**Test agents through Claude Code CLI:**

```
User message to Claude:
"Use the weather-fetcher agent to get current weather"

Expected Claude behavior:
1. Recognizes "weather-fetcher" agent from description
2. Uses Task tool to invoke agent
3. Agent uses Bash to execute script
4. Returns formatted weather data

Verify:
- Agent was invoked correctly
- Script executed
- Real data returned (not mock)
- Output is formatted properly
```

### End-to-End Workflow Testing

**Test complete orchestrated workflows:**

```bash
/motus daily-brief
```

**Validation checklist:**
- ✅ All agents launched in parallel (check logs/timing)
- ✅ Real data returned from all sources
- ✅ Insights generated from actual data
- ✅ Output created in correct location
- ✅ Output contains all expected sections
- ✅ Error handling works (test with broken API key)
- ✅ Idempotent (can run twice without issues)

### Performance Testing

**Measure parallel vs sequential execution:**

```bash
# Run with timestamp logging
time /motus daily-brief

# Expected: ~8-10 seconds for full briefing
# If > 30 seconds: Agents may be running sequentially (bug)
```

### Error Testing

**Test failure scenarios:**

```bash
# Test with invalid API key
export WEATHER_API_KEY="invalid"
/motus daily-brief

# Expected: Weather section shows error, rest continues

# Test with no internet
# Turn off WiFi
/motus daily-brief

# Expected: All API calls fail gracefully with error messages

# Test with missing Obsidian vault
export OBSIDIAN_VAULT_PATH="/invalid/path"
/motus daily-brief

# Expected: Error when trying to create note, but data still collected
```

---

## Best Practices and Rules

### Rule 1: Real Data Only
**Never use mock or fake data**

❌ **Wrong:**
```javascript
return {
  temp: '28°C',  // Hardcoded
  condition: 'Sunny'
};
```

✅ **Right:**
```javascript
const response = await axios.get(WEATHER_API_URL);
return {
  temp: response.data.current.temp_c,  // Real API data
  condition: response.data.current.condition.text
};
```

### Rule 2: Single Responsibility
**Each agent does ONE thing**

❌ **Wrong:** `life-manager-agent` that does weather, calendar, email, tasks

✅ **Right:**
- `weather-fetcher` - only weather
- `calendar-fetcher` - only calendar
- `email-processor` - only email
- `task-compiler` - only tasks

### Rule 3: Parallel First
**Data collection must be parallel**

❌ **Wrong (Sequential):**
```markdown
1. Task(weather-fetcher)
2. Wait for result
3. Task(calendar-fetcher)
4. Wait for result
5. Task(email-processor)
```

✅ **Right (Parallel):**
```markdown
1. Launch ALL simultaneously:
   - Task(weather-fetcher)
   - Task(calendar-fetcher)
   - Task(email-processor)
2. Wait for ALL to complete
3. Process combined results
```

### Rule 4: Error Handling
**Always handle errors gracefully**

❌ **Wrong:**
```javascript
const weather = await fetchWeather(); // Crashes if API fails
```

✅ **Right:**
```javascript
let weather;
try {
  weather = await fetchWeather();
} catch (error) {
  console.error('Weather fetch failed:', error.message);
  weather = {
    error: error.message,
    temp: 'N/A',
    condition: 'Unable to fetch'
  };
}
```

### Rule 5: Idempotency
**Operations should be repeatable safely**

❌ **Wrong:**
```javascript
// Creates duplicate note each time
fs.appendFile(notePath, content);
```

✅ **Right:**
```javascript
// Overwrites or updates existing note
if (await fs.exists(notePath)) {
  await fs.writeFile(notePath, content);  // Replace
} else {
  await fs.writeFile(notePath, content);  // Create
}
```

### Rule 6: Clear Documentation
**Every agent needs clear documentation**

❌ **Wrong:**
```markdown
---
name: fetcher
description: fetches stuff
---
```

✅ **Right:**
```markdown
---
name: weather-fetcher
description: Use this agent when you need to retrieve current weather information by executing the weather-fetcher.js script. This agent should be invoked whenever weather data is requested, weather conditions need to be checked, or weather information needs to be incorporated into other tasks.
---
```

### Rule 7: Type Safety in Scripts
**Use proper JSON parsing and validation**

❌ **Wrong:**
```javascript
const data = process.argv[2];  // Might be undefined
doSomething(data.field);  // Crashes
```

✅ **Right:**
```javascript
const input = process.argv[2] || '{}';
let data;
try {
  data = JSON.parse(input);
} catch (error) {
  console.error('Invalid JSON input');
  process.exit(1);
}

if (!data.field) {
  console.error('Missing required field');
  process.exit(1);
}

doSomething(data.field);
```

### Rule 8: Environment Variables
**Never hardcode credentials or paths**

❌ **Wrong:**
```javascript
const apiKey = 'abc123';  // Hardcoded
const vaultPath = '/Users/ian/Obsidian';  // Hardcoded
```

✅ **Right:**
```javascript
require('dotenv').config();
const apiKey = process.env.API_KEY;
const vaultPath = process.env.OBSIDIAN_VAULT_PATH;

if (!apiKey) {
  console.error('API_KEY not configured');
  process.exit(1);
}
```

### Rule 9: Consistent Naming
**Follow naming conventions**

- **Agents**: kebab-case (e.g., `weather-fetcher.md`)
- **Scripts**: kebab-case (e.g., `weather-fetcher.js`)
- **Functions**: camelCase (e.g., `fetchWeather()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_KEY`)
- **Classes**: PascalCase (e.g., `LifeAdminAgent`)

### Rule 10: JSON Output for Scripts
**CLI scripts should output JSON**

❌ **Wrong:**
```javascript
console.log('The weather is sunny and 28 degrees');
```

✅ **Right:**
```javascript
const weather = {
  temp: 28,
  condition: 'sunny',
  humidity: 60
};
console.log(JSON.stringify(weather, null, 2));
```

This allows agents to parse the output programmatically.

---

## Quick Reference Checklist

### Creating a New Data Collection Agent

- [ ] Define single responsibility
- [ ] Create implementation script in `/life-admin/`
- [ ] Script loads `.env` with `require('dotenv').config()`
- [ ] Script uses real API (no mock data)
- [ ] Script handles errors gracefully
- [ ] Script outputs JSON when run directly
- [ ] Script exports functions for programmatic use
- [ ] Create agent definition in `/.claude/agents/`
- [ ] Agent frontmatter includes name, description, tools, model, color
- [ ] Agent body has clear instructions
- [ ] Agent specifies exact bash command to execute
- [ ] Add environment variables to `.env` and `.env.example`
- [ ] Test script directly: `node /path/to/script.js`
- [ ] Test agent through Claude Code CLI
- [ ] Document in this guide or agent-specific docs

### Creating a New Orchestrator Agent

- [ ] Define workflow steps and data flow
- [ ] Identify which agents run in parallel
- [ ] Identify sequential dependencies
- [ ] Create orchestrator agent in `/.claude/agents/`
- [ ] Agent uses Task tool to launch sub-agents
- [ ] Parallel agents launched in Group 1
- [ ] Processing agents in Group 2 (after Group 1)
- [ ] Output agents in Group 3 (after Group 2)
- [ ] Error handling for failed agents
- [ ] Output summary format defined
- [ ] Test orchestration with `/motus [command]`
- [ ] Verify parallel execution (timing)
- [ ] Document workflow in guide

### Creating a New Department

- [ ] Define department scope and domain
- [ ] List primary workflows
- [ ] List required agents
- [ ] List external integrations
- [ ] Create department directory structure
- [ ] Create all data collection agents
- [ ] Create processing agents
- [ ] Create output agents
- [ ] Create orchestrator agent
- [ ] Create department master agent
- [ ] Add department commands to `/motus`
- [ ] Create department documentation
- [ ] Test each agent individually
- [ ] Test orchestrated workflows
- [ ] Add automation triggers (optional)

---

## Conclusion

By following these step-by-step processes, you can consistently create new departments, agents, and workflows in the Motus system while maintaining:

- **Architectural consistency**: All agents follow the same patterns
- **Parallel efficiency**: Data collection happens simultaneously
- **Real integrations**: Always use actual APIs, never mock data
- **Error resilience**: Graceful failures don't break entire workflows
- **Easy maintenance**: Clear structure makes modifications simple

The key principles:
1. **Single responsibility** per agent
2. **Parallel first** for data collection
3. **Real data only** from actual APIs
4. **Clear documentation** for every component
5. **Consistent naming** and structure

With these patterns established, extending Motus with new capabilities becomes straightforward and repeatable.
