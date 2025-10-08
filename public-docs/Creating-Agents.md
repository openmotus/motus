# Creating Agents

Learn how to create specialized AI agents in /Motus. Agents are the workers that perform tasks within your departments.

> **💡 Note**: This guide uses examples like "weather-fetcher" and "calendar-fetcher" to illustrate concepts. These are examples of agents you can build - Motus creates the agent structure and templates, you implement the actual logic.

## Understanding Agents

Agents are AI assistants that live inside Claude Code and perform specific tasks. Each agent has:
- **A clear purpose** - One specific job
- **Tools** - Access to specific Claude Code tools
- **Type** - Orchestrator, Data Fetcher, or Specialist
- **Model** - Which Claude model to use (Sonnet or Opus)

## Agent Types

### 1. Orchestrator Agents

**Purpose**: Coordinate other agents and manage workflows

**When to use**:
- You need to run multiple agents in a workflow
- Complex multi-step processes
- Parallel or sequential execution needed

**Key Tool**: `Task` - Can invoke other agents

**Example Use Cases**:
- Daily briefing coordinator
- Marketing campaign manager  
- Multi-step data processing

**Example**:
```markdown
Name: marketing-orchestrator
Type: Orchestrator
Tools: Task, Read, Write
Purpose: Coordinate daily marketing workflows
```

### 2. Data Fetcher Agents

**Purpose**: Retrieve information from APIs and external services

**When to use**:
- Calling external APIs
- Running scripts to get data
- Fetching from databases

**Key Tool**: `Bash` - Can execute scripts

**Example Use Cases**:
- Weather data retrieval
- Social media metrics
- Calendar events
- Email processing

**Example**:
```markdown
Name: weather-fetcher
Type: Data Fetcher
Tools: Bash, Read
Purpose: Get current weather from WeatherAPI
```

When you create this agent, the wizard generates the agent definition file and optionally creates a script template at `<department>/agents/weather-fetcher.js` that you would implement.

### 3. Specialist Agents

**Purpose**: Analyze, process, or create content

**When to use**:
- Data analysis needed
- Content generation required
- Decision making
- Report creation

**Key Tools**: `Read`, `Write`, `WebFetch`

**Example Use Cases**:
- Sentiment analysis
- Article summarization
- Report generation
- Content creation

**Example**:
```markdown
Name: sentiment-analyzer
Type: Specialist
Tools: Read, Write, Task
Purpose: Analyze social media sentiment and brand perception
```

## Creating Your First Agent

### Step 1: Open Claude Code

Make sure you're in Claude Code CLI - all agent creation happens here.

### Step 2: Use the Creation Wizard

```
/motus <department> agent create <agent-name>
```

**Example - Creating a bookmark analyzer**:

```
/motus research agent create bookmark-analyzer
```

### Step 3: Answer the Wizard Questions

The interactive wizard will ask:

**1. Display Name**
```
Display Name: Bookmark Analyzer
```
Human-readable name for the agent.

**2. Description**
```
Description: Analyzes bookmarked articles and categorizes them by topic
```
What does this agent do?

**3. Agent Type**
```
Agent Type:
  1. Orchestrator - Coordinates workflows
  2. Data Fetcher - Gets data from APIs  
  3. Specialist - Analyzes or creates content

Choose type (1-3): 3
```
Select the type that matches your need.

**4. Tools**
```
Available tools:
  - Read: Read files
  - Write: Write files
  - Bash: Run scripts
  - Task: Call other agents
  - WebFetch: Fetch web pages
  - WebSearch: Search the web
  - Edit: Edit files
  - Glob: Find files
  - Grep: Search file contents

Enter tools (comma-separated): Read, Write, WebFetch
```
Choose only the tools this agent needs.

**5. Model**
```
Model:
  1. Sonnet (fast, efficient, recommended)
  2. Opus (powerful, expensive)

Choose model (1-2): 1
```
Sonnet is usually sufficient.

**6. Script (for Data Fetchers only)**
```
Generate implementation script? (y/n): y
```
Creates a `.js` file for API calls.

**7. Confirm**
```
Review:
  Name: bookmark-analyzer
  Display Name: Bookmark Analyzer
  Type: Specialist
  Tools: Read, Write, WebFetch
  Model: Sonnet
  Department: research

Create agent? (y/n): y
```

### Step 4: Verify Creation

Check that your agent was created:

```
/motus research agent list
```

You should see your new agent in the list!

## What Gets Created

When you create an agent, Motus automatically generates:

### 1. Agent Definition File

Location: `.claude/agents/<agent-name>.md`

```markdown
---
name: bookmark-analyzer
description: Analyzes bookmarked articles and categorizes them by topic
tools: Read, Write, WebFetch
model: sonnet
---

You are the Bookmark Analyzer agent, a specialist for article analysis.

## Primary Responsibilities

1. **Article Analysis**
   - Fetch bookmark URLs
   - Extract main topics
   - Categorize by subject
   - Identify key themes

## Capabilities

- URL content fetching
- Natural language processing
- Topic categorization
- Summary generation

## Output Standards

Always provide:
- Clear categorization
- Topic tags
- Brief summary
- Related bookmarks suggestions
```

### 2. Registry Entry

Location: `config/registries/agents.json`

```json
{
  "bookmark-analyzer": {
    "name": "bookmark-analyzer",
    "displayName": "Bookmark Analyzer",
    "department": "research",
    "type": "specialist",
    "description": "Analyzes bookmarked articles...",
    "tools": ["Read", "Write", "WebFetch"],
    "model": "sonnet",
    "created": "2025-10-08T10:00:00.000Z",
    "version": "1.0.0",
    "usedInWorkflows": []
  }
}
```

### 3. Implementation Script (Data Fetchers Only)

Location: `<department>/agents/<agent-name>.js`

```javascript
#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function bookmarkFetcher() {
  try {
    const apiKey = process.env.BOOKMARK_API_KEY;
    
    const response = await axios.get('https://api.example.com/bookmarks', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return {
      bookmarks: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

if (require.main === module) {
  bookmarkFetcher().then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(console.error);
}

module.exports = { bookmarkFetcher };
```

## Agent Design Best Practices

### ✅ Good Agent Design

**Single Responsibility**
```
✅ article-fetcher: Just fetches articles
✅ article-analyzer: Just analyzes content
✅ article-summarizer: Just creates summaries
```

**Clear Naming**
```
✅ weather-fetcher
✅ sentiment-analyzer
✅ report-creator
```

**Appropriate Tools**
```
✅ Data Fetcher: Bash, Read
✅ Specialist: Read, Write, WebFetch
✅ Orchestrator: Task, Read, Write
```

### ❌ Poor Agent Design

**Too Many Responsibilities**
```
❌ article-processor: Fetches, analyzes, summarizes, posts
   (Should be 4 separate agents)
```

**Vague Naming**
```
❌ helper
❌ processor
❌ agent1
```

**Wrong Tools**
```
❌ Data Fetcher with Task tool (should be Orchestrator)
❌ Orchestrator without Task tool (can't coordinate)
```

## Example Agents

### Example 1: Email Prioritizer (Specialist)

**Purpose**: Analyze emails and prioritize by importance

```
/motus life agent create email-prioritizer
```

**Configuration**:
- Type: Specialist
- Tools: Read, Write
- Model: Sonnet

**What it does**:
1. Reads email data
2. Analyzes urgency and importance
3. Assigns priority scores
4. Returns sorted list

### Example 2: Calendar Fetcher (Data Fetcher)

**Purpose**: Get today's calendar events from Google Calendar

```
/motus life agent create calendar-fetcher
```

**Configuration**:
- Type: Data Fetcher
- Tools: Bash, Read
- Script: Yes
- Model: Sonnet

**What it does**:
1. Runs script to call Google Calendar API
2. Fetches today's events
3. Returns structured event data

### Example 3: Daily Coordinator (Orchestrator)

**Purpose**: Coordinate morning briefing workflow

```
/motus life agent create daily-coordinator
```

**Configuration**:
- Type: Orchestrator
- Tools: Task, Read, Write
- Model: Sonnet

**What it does**:
1. Invokes weather-fetcher (parallel)
2. Invokes calendar-fetcher (parallel)
3. Invokes email-prioritizer (parallel)
4. Compiles all data into briefing

## Managing Agents

### List All Agents

See all agents in a department:

```
/motus <department> agent list
```

Example:
```
/motus research agent list
```

Output:
```
🤖 Research Department Agents (4):

Orchestrators:
  - research-admin

Data Fetchers:
  - bookmark-fetcher
  - article-fetcher

Specialists:
  - bookmark-analyzer
  - article-summarizer
```

### View Agent Details

```
/motus <department> agent info <agent-name>
```

Example:
```
/motus research agent info bookmark-analyzer
```

Output:
```
🤖 Bookmark Analyzer

Type: Specialist
Department: Research
Description: Analyzes bookmarked articles and categorizes them by topic
Tools: Read, Write, WebFetch
Model: Sonnet
Created: 2025-10-08
Version: 1.0.0

Used in workflows:
  - article-review
  - weekly-digest
```

### Update Agent

```
/motus <department> agent update <agent-name>
```

Example:
```
/motus research agent update bookmark-analyzer --description "New description"
```

### Delete Agent

```
/motus <department> agent delete <agent-name>
```

⚠️ **Warning**: This will remove the agent from all workflows!

## Testing Your Agent

### Test Directly in Claude Code

You can test agents by invoking them directly:

```
Tell the bookmark-analyzer agent to analyze this URL: https://example.com/article
```

Claude Code will invoke your agent and show the results.

### Test in a Workflow

Create a simple test workflow:

```
/motus research workflow create test-bookmark-analyzer
```

Then run it:

```
/motus research test-bookmark-analyzer
```

## Advanced Agent Patterns

### Pattern 1: Parallel Data Fetchers

Create multiple data fetchers that an orchestrator runs in parallel:

```
Orchestrator: daily-briefing-coordinator
├─ weather-fetcher (parallel)
├─ calendar-fetcher (parallel)  
└─ news-fetcher (parallel)
```

### Pattern 2: Sequential Processors

Create agents that process data in sequence:

```
article-fetcher → article-analyzer → article-summarizer → note-creator
```

### Pattern 3: Analyzer + Creator

Pair an analyzer with a creator:

```
sentiment-analyzer → content-creator
(analyzes mood) → (creates content matching mood)
```

## Troubleshooting

### Agent Not Found

**Issue**: `/motus research agent info my-agent` returns "not found"

**Solution**:
1. Check agent name spelling
2. Verify it's in the right department
3. List all agents: `/motus research agent list`

### Agent Fails to Run

**Issue**: Agent returns errors when invoked

**Solution**:
1. Check agent definition file exists: `.claude/agents/<name>.md`
2. Verify tools are correctly specified
3. For data fetchers, check script exists
4. Review agent logs for specific error

### Wrong Tools

**Issue**: Agent can't perform its task

**Solution**:
1. Review which tools the agent needs
2. Update agent with correct tools
3. Orchestrators need `Task` tool
4. Data fetchers need `Bash` tool

## Next Steps

After creating agents:

1. **[Create Workflows](Creating-Workflows.md)** - Combine agents into workflows
2. **[Setup Integrations](Setup-Integrations.md)** - Connect external services  
3. **[Examples](Examples.md)** - See complete agent examples

---

**Previous**: [Creating Departments](Creating-Departments.md) | **Next**: [Creating Workflows →](Creating-Workflows.md)
