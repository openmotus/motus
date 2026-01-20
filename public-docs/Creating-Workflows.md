# Creating Workflows

Learn how to create automated workflows that combine multiple agents into powerful automation sequences.

> **💡 Note**: This guide uses example workflows like "daily-briefing" and "content-pipeline" to illustrate concepts. These are examples of workflows you can build - Motus creates the workflow structure and configuration, you implement the agents that power them.

## Understanding Workflows

Workflows are automated processes that combine multiple agents to accomplish complex tasks. They can run manually on-demand or automatically on a schedule.

### What is a Workflow?

A workflow is a sequence of steps that:
- Coordinates multiple agents
- Processes data from multiple sources
- Executes actions in a specific order
- Can run in parallel or sequentially
- Produces a final output or result

### Workflow Components

Every workflow has:
- **Name** - Unique identifier (e.g., `daily-briefing`)
- **Description** - What the workflow does
- **Type** - Manual or scheduled
- **Schedule** - When to run (for scheduled workflows)
- **Agents** - Which agents participate
- **Execution Pattern** - Sequential or parallel
- **Output** - What gets created

## Workflow Types

### Manual Workflows

**Purpose**: Run on-demand when you need them

**When to use**:
- Ad-hoc analysis tasks
- One-off reports
- Testing new automation
- User-triggered actions

**How to run**:
```
/motus <department> <workflow-name>
```

**Example**:
```
/motus marketing content-ideas
```

### Scheduled Workflows

**Purpose**: Run automatically at specific times

**When to use**:
- Daily briefings
- Weekly reports
- Monthly summaries
- Recurring data collection

**Schedule Format**:
- Cron syntax: `0 8 * * *` (8 AM daily)
- Human-readable: `daily at 8am`
- Weekly: `0 9 * * 1` (Monday 9 AM)
- Monthly: `0 10 1 * *` (1st of month, 10 AM)

**Example**:
```
Daily briefing runs at 7:00 AM
Weekly report runs every Monday at 9:00 AM
```

## Creating Your First Workflow

### Step 1: Open Claude Code

Make sure you're in Claude Code CLI.

### Step 2: Use the Creation Wizard

```
/motus <department> workflow create <workflow-name>
```

**Example - Creating a content creation workflow**:

```
/motus marketing workflow create content-pipeline
```

### Step 3: Answer the Wizard Questions

**1. Display Name**
```
Display Name: Content Creation Pipeline
```
Human-readable name for the workflow.

**2. Description**
```
Description: Generates content ideas based on trending topics and creates draft posts
```
What does this workflow do?

**3. Workflow Type**
```
Workflow Type:
  1. Manual - Run on demand
  2. Scheduled - Run automatically

Choose type (1-2): 1
```

**4. Agents to Include**
```
Available agents in Marketing department:
  - trend-analyzer (Data Fetcher)
  - content-creator (Specialist)
  - sentiment-analyzer (Specialist)

Enter agents (comma-separated): trend-analyzer, content-creator
```
Select which agents this workflow uses.

**5. Execution Pattern**
```
Execution Pattern:
  1. Sequential - Run agents one after another
  2. Parallel - Run agents simultaneously

Choose pattern (1-2): 1
```

For this workflow, we need trends first, then content, so sequential.

**6. Schedule (for scheduled workflows only)**
```
Schedule: 0 8 * * *
```
Cron format for when to run.

**7. Output Location**
```
Output location: /marketing/content-ideas.md
```
Where to save the workflow results.

**8. Confirm**
```
Review:
  Name: content-pipeline
  Display Name: Content Creation Pipeline
  Type: Manual
  Department: Marketing
  Agents: trend-analyzer → content-creator
  Pattern: Sequential
  Output: /marketing/content-ideas.md

Create workflow? (y/n): y
```

### Step 4: Verify Creation

Check that your workflow was created:

```
/motus marketing workflow list
```

You should see your new workflow!

## What Gets Created

When you create a workflow, Motus generates:

### 1. Workflow Definition File

Location: `.claude/commands/<department>-<workflow-name>.md`

```markdown
---
name: content-pipeline
description: Generates content ideas based on trending topics
department: marketing
type: manual
---

Execute the Content Creation Pipeline workflow:

1. Invoke the trend-analyzer agent to fetch current trending topics
2. Wait for trends data
3. Invoke the content-creator agent with the trends data
4. Save the generated content ideas to /marketing/content-ideas.md
5. Return summary of content ideas created
```

### 2. Registry Entry

Location: `config/registries/workflows.json`

```json
{
  "content-pipeline": {
    "name": "content-pipeline",
    "displayName": "Content Creation Pipeline",
    "department": "marketing",
    "type": "manual",
    "description": "Generates content ideas...",
    "agents": ["trend-analyzer", "content-creator"],
    "executionPattern": "sequential",
    "output": "/marketing/content-ideas.md",
    "created": "2025-10-08T10:00:00.000Z",
    "lastRun": null,
    "runCount": 0
  }
}
```

### 3. Schedule Entry (for scheduled workflows)

Location: Cron job or scheduler configuration

```bash
0 8 * * * /motus marketing content-pipeline
```

## Execution Patterns

### Sequential Execution

**When to use**:
- One agent's output is needed by the next agent
- Steps must happen in a specific order
- Data transformation pipeline

**Example Flow**:
```
trend-analyzer → content-creator → note-creator
```

**How it works**:
1. Run trend-analyzer
2. Wait for completion
3. Pass results to content-creator
4. Wait for completion
5. Pass results to note-creator
6. Complete

**Claude Code Implementation**:
In your workflow definition, specify:
```markdown
Execute agents sequentially:
1. Invoke trend-analyzer, wait for results
2. Invoke content-creator with trends data, wait for results
3. Invoke note-creator with content data
```

### Parallel Execution

**When to use**:
- Agents don't depend on each other
- Data collection from multiple sources
- Maximum speed needed

**Example Flow**:
```
┌─ weather-fetcher
├─ calendar-fetcher
├─ email-processor
└─ task-compiler
```

**How it works**:
1. Launch all agents simultaneously
2. Wait for all to complete
3. Collect all results
4. Process combined data

**Claude Code Implementation**:
```markdown
Execute agents in parallel:
1. Invoke weather-fetcher, calendar-fetcher, email-processor, and task-compiler simultaneously
2. Wait for all agents to complete
3. Compile results into daily briefing
```

## Workflow Design Patterns

### Pattern 1: Data Collection → Analysis → Creation

**Use Case**: Gather data, analyze it, create output

**Example - Market Research**:
```
market-data-fetcher → sentiment-analyzer → report-creator
```

**Flow**:
1. Fetch market data from APIs
2. Analyze sentiment and trends
3. Create formatted report

### Pattern 2: Parallel Fetch → Single Processor

**Use Case**: Gather from multiple sources, process together

**Example - Daily Briefing**:
```
┌─ weather-fetcher ─┐
├─ calendar-fetcher ├─→ briefing-compiler → note-creator
└─ email-processor ─┘
```

**Flow**:
1. Fetch weather, calendar, emails in parallel
2. Compile all data into briefing
3. Create daily note

### Pattern 3: Fetch → Multiple Specialists

**Use Case**: One data source, multiple analyses

**Example - Content Analysis**:
```
                ┌─ sentiment-analyzer
article-fetcher ├─ keyword-extractor
                └─ summary-creator
```

**Flow**:
1. Fetch article
2. Run all analyzers in parallel
3. Combine insights

### Pattern 4: Conditional Branching

**Use Case**: Different paths based on data

**Example - Email Triage**:
```
email-fetcher → email-classifier → [urgent-handler OR routine-handler]
```

**Flow**:
1. Fetch emails
2. Classify by priority
3. Route to appropriate handler

## Example Workflows

### Example 1: Daily Marketing Briefing

**Purpose**: Morning briefing with trends, competitors, and content ideas

```
/motus marketing workflow create daily-briefing
```

**Configuration**:
- Type: Scheduled
- Schedule: Daily at 8:00 AM
- Agents:
  - trend-analyzer (parallel)
  - competitor-monitor (parallel)
  - content-ideas-generator (sequential)
- Pattern: Mixed (parallel data fetch, sequential analysis)
- Output: `/marketing/daily-briefing.md`

**Execution Flow**:
```
┌─ trend-analyzer ───────┐
└─ competitor-monitor ────┘
         ↓
  content-ideas-generator
         ↓
     note-creator
```

### Example 2: Weekly Fitness Report

**Purpose**: Weekly summary of workouts, sleep, and progress

```
/motus fitness workflow create weekly-report
```

**Configuration**:
- Type: Scheduled
- Schedule: Every Monday at 9:00 AM
- Agents:
  - oura-fetcher (data)
  - workout-analyzer (specialist)
  - progress-tracker (specialist)
  - report-creator (specialist)
- Pattern: Sequential
- Output: `/fitness/weekly-report.md`

**Execution Flow**:
```
oura-fetcher → workout-analyzer → progress-tracker → report-creator
```

### Example 3: Content Publication Pipeline

**Purpose**: Create, review, and publish content

```
/motus marketing workflow create publish-content
```

**Configuration**:
- Type: Manual
- Agents:
  - content-creator (specialist)
  - seo-optimizer (specialist)
  - social-publisher (orchestrator)
- Pattern: Sequential
- Output: Multiple (draft, published post, social posts)

**Execution Flow**:
```
content-creator → seo-optimizer → social-publisher
```

## Managing Workflows

### List All Workflows

See all workflows in a department:

```
/motus <department> workflow list
```

Example:
```
/motus marketing workflow list
```

Output:
```
📋 Marketing Department Workflows (3):

Manual Workflows:
  - content-pipeline - Content Creation Pipeline
  - competitor-analysis - Competitor Research Workflow

Scheduled Workflows:
  - daily-briefing - Daily Marketing Briefing (8:00 AM daily)
```

### View Workflow Details

```
/motus <department> workflow info <workflow-name>
```

Example:
```
/motus marketing workflow info content-pipeline
```

Output:
```
📋 Content Creation Pipeline

Type: Manual
Department: Marketing
Description: Generates content ideas based on trending topics

Agents (2):
  1. trend-analyzer (Data Fetcher)
  2. content-creator (Specialist)

Execution: Sequential
Output: /marketing/content-ideas.md

Statistics:
  Created: 2025-10-08
  Last Run: 2025-10-08 14:30
  Total Runs: 15
  Success Rate: 100%
```

### Run a Workflow

Execute a workflow manually:

```
/motus <department> <workflow-name>
```

Example:
```
/motus marketing content-pipeline
```

Claude Code will execute the workflow and show progress.

### Update a Workflow

To update a workflow, edit its definition file directly in `.claude/commands/` or ask Claude Code to modify it:
```
Update the content-pipeline workflow to run at 10 AM instead of 8 AM
```

### Delete a Workflow

To delete a workflow:
1. Remove the workflow definition from `.claude/commands/`
2. Remove the entry from `config/registries/workflows.json`
3. Run `/motus docs update` to regenerate documentation

⚠️ **Warning**: Make sure to update any workflows that depend on this one!

## Testing Your Workflow

### Test in Claude Code

Run the workflow and observe the output:

```
/motus marketing content-pipeline
```

Watch as each agent executes and provides results.

### Review Execution

Ask Claude Code for detailed output:
```
Run the content-pipeline workflow and show me what each agent returns
```

This helps you understand what's happening at each step.

## Best Practices

### ✅ Good Workflow Design

**Clear Purpose**
```
✅ daily-briefing: Compiles morning briefing
✅ weekly-report: Generates weekly summary
✅ content-pipeline: Creates content from trends
```

**Appropriate Granularity**
```
✅ Combine 2-5 related agents
✅ Focus on one outcome
✅ Reusable components
```

**Efficient Execution**
```
✅ Parallel data fetching
✅ Sequential for dependencies
✅ Minimize wait times
```

**Error Handling**
```
✅ Fallback for failed agents
✅ Partial results acceptable
✅ Clear error messages
```

### ❌ Poor Workflow Design

**Too Broad**
```
❌ do-everything: Tries to do marketing, fitness, finance
   (Should be 3 separate workflows)
```

**Too Narrow**
```
❌ just-fetch-weather: Only one agent
   (Just call the agent directly)
```

**Wrong Pattern**
```
❌ Sequential when parallel would work
❌ Parallel when order matters
```

**No Output**
```
❌ Workflow runs but produces nothing useful
```

## Advanced Workflow Features

### Conditional Execution

Execute agents based on conditions:

```markdown
1. Invoke email-classifier
2. If urgent emails found:
   - Invoke urgent-responder
3. Otherwise:
   - Invoke routine-processor
```

### Data Transformation

Pass transformed data between agents:

```markdown
1. Invoke data-fetcher
2. Transform results to {format: "summary", limit: 10}
3. Invoke analyzer with transformed data
```

### Error Recovery

Handle failures gracefully:

```markdown
1. Invoke primary-source
2. If fails:
   - Invoke backup-source
3. Continue with available data
```

### Workflow Chaining

One workflow triggers another:

```markdown
Daily briefing workflow →
  If mentions urgent items →
    Trigger urgent-handler workflow
```

## Troubleshooting

### Workflow Not Found

**Issue**: `/motus marketing content-pipeline` returns "workflow not found"

**Solution**:
1. Check workflow name spelling
2. Verify department is correct
3. List workflows: `/motus marketing workflow list`

### Agents Not Executing

**Issue**: Workflow runs but agents don't execute

**Solution**:
1. Verify agents exist: `/motus marketing agent list`
2. Check agent names in workflow definition
3. Ensure agents are in the same department

### Scheduled Workflow Not Running

**Issue**: Scheduled workflow doesn't run at scheduled time

**Solution**:
1. Check schedule syntax (cron format)
2. Verify workflow is enabled
3. Check system cron/scheduler is running
4. Review logs for errors

### Workflow Takes Too Long

**Issue**: Workflow execution is slow

**Solution**:
1. Use parallel execution for independent agents
2. Optimize individual agents
3. Remove unnecessary agents
4. Check for API rate limiting

### Partial Results

**Issue**: Some agents succeed, others fail

**Solution**:
1. Review error messages from failed agents
2. Check API credentials for failed integrations
3. Implement fallback logic
4. Accept partial results if acceptable

## Scheduling Workflows

### Add a Scheduled Workflow

When creating a workflow, choose "Scheduled" type:

```
/motus marketing workflow create daily-briefing
```

In the wizard, select "Scheduled" and provide a cron schedule.

### Common Schedules

```
Daily at 8 AM:     0 8 * * *
Every Monday 9 AM: 0 9 * * 1
First of month:    0 10 1 * *
Every 6 hours:     0 */6 * * *
Weekdays 7 AM:     0 7 * * 1-5
```

### Running Scheduled Workflows

To actually run workflows on a schedule, you'll need to set up a system cron job or scheduler that invokes Claude Code with the workflow command. This can be done with your operating system's scheduling tools (cron on Linux/macOS, Task Scheduler on Windows).

## Next Steps

After creating workflows:

1. **[Setup Integrations](Setup-Integrations.md)** - Connect external services
2. **[Examples](Examples.md)** - See complete workflow examples
3. **[Troubleshooting](Troubleshooting.md)** - Solve common issues

---

**Previous**: [Creating Agents ←](Creating-Agents.md) | **Next**: [Setup Environment →](Setup-Environment.md)
