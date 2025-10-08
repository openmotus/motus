# Motus Workflow Orchestration System - Master Context Document

## Overview

The Motus system implements a sophisticated parallel agent orchestration architecture within Claude Code CLI, designed to automate life and business workflows through coordinated sub-agents that execute tasks simultaneously for optimal efficiency.

## Core Architecture

### 1. Command System (`/.claude/commands/`)

The entry point for all workflows is through Claude Code slash commands. Commands are defined in markdown files that specify how to invoke orchestrator agents.

**Example: `/motus daily-brief`**
```markdown
When user runs: /motus daily-brief
Execute: Task(daily-brief-orchestrator)
```

### 2. Agent System (`/.claude/agents/`)

Agents are specialized workers that perform specific tasks. They are defined in markdown files with:
- **name**: Unique identifier
- **description**: When/how to use the agent
- **tools**: Available Claude Code tools (Bash, Read, Write, Task, etc.)
- **instructions**: Specific operational guidelines

### 3. Parallel Execution Pattern

The key innovation is **parallel agent execution** - multiple agents run simultaneously to gather data efficiently, then subsequent agents process the combined results.

```
┌─────────────────────────────────────────────┐
│           ORCHESTRATOR AGENT                 │
│         (daily-brief-orchestrator)           │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │  PARALLEL GROUP 1 │
        │  (Data Collection) │
        └─────────┬─────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┬─────────────┐
    ▼             ▼             ▼             ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Weather │ │Calendar │ │  Email  │ │  Tasks  │ │  Quote  │
│ Fetcher │ │ Fetcher │ │Processor│ │Compiler │ │ Fetcher │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
    │             │             │             │             │
    └─────────────┼─────────────┴─────────────┴─────────────┘
                  │
        ┌─────────┴─────────┐
        │     GROUP 2        │
        │    (Analysis)      │
        └─────────┬─────────┘
                  │
            ┌─────▼─────┐
            │  Insight  │
            │ Generator │
            └─────┬─────┘
                  │
        ┌─────────┴─────────┐
        │     GROUP 3        │
        │    (Output)        │
        └─────────┬─────────┘
                  │
            ┌─────▼─────┐
            │   Note    │
            │  Creator  │
            └───────────┘
```

## Implementation Details

### Agent Types and Responsibilities

#### Data Collection Agents (Parallel Group 1)

1. **weather-fetcher**
   - Executes: `node /Users/ianwinscom/motus/life-admin/weather-fetcher.js`
   - Returns: Current weather from WeatherAPI
   - Tools: Bash

2. **calendar-fetcher**
   - Executes: `node /Users/ianwinscom/motus/life-admin/life-admin-agent.js get-calendar`
   - Returns: Today's Google Calendar events
   - Tools: Bash, Read

3. **email-processor**
   - Executes: `node /Users/ianwinscom/motus/life-admin/life-admin-agent.js get-emails`
   - Returns: Important Gmail messages
   - Tools: Bash, Read

4. **task-compiler**
   - Reads: Existing Obsidian daily note
   - Compiles: Tasks from multiple sources
   - Tools: Read, Bash

5. **quote-fetcher**
   - Executes: Node command with quote array
   - Returns: Random inspirational quote
   - Tools: Bash

#### Processing Agents (Sequential Group 2)

6. **insight-generator**
   - Analyzes: All collected data
   - Generates: Actionable insights and recommendations
   - Tools: Read

#### Output Agents (Sequential Group 3)

7. **note-creator**
   - Creates/Updates: Obsidian daily note
   - Format: Specific markdown structure with emojis
   - Tools: Read, Write, Edit, Bash

### Orchestrator Pattern

The **daily-brief-orchestrator** agent coordinates the entire process:

```markdown
Step 1: Launch ALL data collection agents SIMULTANEOUSLY
- Use Task tool to spawn all Group 1 agents in parallel
- Wait for all to complete

Step 2: Process combined results
- Launch insight-generator with compiled data

Step 3: Create final output
- Launch note-creator with all information
```

## Critical Implementation Rules

### 1. ALWAYS Use Real Data
```markdown
Your primary task:
1. Use Bash tool to execute: `[actual command here]`
2. Return the ACTUAL JSON/data output
3. DO NOT provide mock data - MUST execute the command
```

### 2. Parallel Execution is Mandatory
```markdown
CRITICAL: You must launch ALL data collection agents in PARALLEL (simultaneously) for efficiency.
```

### 3. Proper Error Handling
```markdown
Error handling:
- If [service] auth fails, report authentication issue
- If no [data] found, indicate "No [data] for today"
- Report API errors clearly
- Continue with available data if any agent fails
```

### 4. Consistent Output Format
Each agent must return data in a predictable format that subsequent agents can process.

## Workflow Creation Pattern

To create a new workflow, follow this structure:

### 1. Define the Command (`/.claude/commands/motus.md`)
```markdown
### workflow-name
When user runs: /motus workflow-name
You MUST:
1. Use Task tool to launch workflow-name-orchestrator agent
2. Do not attempt to execute the workflow directly
```

### 2. Create the Orchestrator (`/.claude/agents/workflow-name-orchestrator.md`)
```markdown
---
name: workflow-name-orchestrator
description: Master orchestrator for [workflow purpose]
tools: Task, Read, Write
---

Step 1: Parallel data collection
- Task(agent-1)
- Task(agent-2)
- Task(agent-3)

Step 2: Processing
- Task(processor-agent) with combined data

Step 3: Output
- Task(output-agent) with final data
```

### 3. Create Specialized Agents
Each agent should:
- Have a single, focused responsibility
- Execute real commands/scripts
- Return structured data
- Handle errors gracefully

## Example Workflow: Evening Review

```
User Input: /motus evening-review
    │
    ▼
┌──────────────────┐
│   Orchestrator   │
└────────┬─────────┘
         │
    Parallel Group
    ┌────┼────┬────┐
    ▼    ▼    ▼    ▼
[Daily] [Task] [Health] [Finance]
[Stats] [Review] [Track] [Summary]
    │    │    │    │
    └────┼────┴────┘
         │
    ┌────▼────┐
    │ Insight │
    │Analysis │
    └────┬────┘
         │
    ┌────▼────┐
    │  Update │
    │   Note  │
    └─────────┘
```

## Best Practices

### 1. Agent Design
- **Single Responsibility**: Each agent does ONE thing well
- **Real Data Only**: Always execute actual commands
- **Structured Output**: Return consistent, parseable formats
- **Error Resilience**: Handle failures gracefully

### 2. Orchestration Design
- **Maximize Parallelization**: Run independent tasks simultaneously
- **Minimize Sequential Steps**: Only serialize when data dependencies exist
- **Clear Dependencies**: Document what data flows between agents

### 3. Data Flow
```
Raw Data (Group 1) → Processed Data (Group 2) → Final Output (Group 3)
```

### 4. Testing Pattern
1. Test individual agents first
2. Test orchestrator with single agent
3. Test full parallel execution
4. Verify output format and data accuracy

## Integration Points

### External Services
- **WeatherAPI**: Weather data via API key
- **Google Calendar**: OAuth 2.0 authentication
- **Gmail API**: OAuth 2.0 authentication
- **Obsidian**: Local file system access

### File Locations
- Daily Notes: `/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/`
- Scripts: `/Users/ianwinscom/motus/life-admin/`
- Agents: `/Users/ianwinscom/motus/.claude/agents/`
- Commands: `/Users/ianwinscom/motus/.claude/commands/`

### Date Format
- Filename: "Aug 26, 2025" (Month Day, Year)
- Command: `date "+%b %d, %Y"`

## Extending the System

### Adding New Workflows

1. **Identify parallel tasks**: What can run simultaneously?
2. **Define data dependencies**: What needs to happen sequentially?
3. **Create agent hierarchy**: Orchestrator → Data → Process → Output
4. **Implement agents**: Start with data collection agents
5. **Wire orchestration**: Connect agents in orchestrator
6. **Test thoroughly**: Verify real data and parallel execution

### Adding New Data Sources

1. Create dedicated fetcher agent
2. Add to parallel Group 1 in orchestrator
3. Update processors to handle new data
4. Extend output formatters

### Performance Optimization

- **Parallel by default**: Always look for parallelization opportunities
- **Cache when possible**: Reuse data within workflow
- **Timeout handling**: Set appropriate timeouts for external calls
- **Batch operations**: Group similar operations

## Common Patterns

### 1. Data Fetcher Pattern
```markdown
Your primary task:
1. Use Bash tool to execute: `[command]`
2. Return the ACTUAL output
3. DO NOT provide mock data
```

### 2. Data Processor Pattern
```markdown
Your primary task:
1. Analyze provided data from [sources]
2. Extract [specific information]
3. Return structured format
```

### 3. Output Creator Pattern
```markdown
Your primary task:
1. Check if [output] exists
2. Create/Update with provided data
3. Use exact format specification
4. Ensure UTF-8 encoding for emojis
```

## Troubleshooting

### Issue: Mock Data Instead of Real Data
**Solution**: Ensure agents explicitly use Bash tool with actual commands

### Issue: Sequential Instead of Parallel
**Solution**: Launch all Group 1 agents in single Task tool call

### Issue: Emoji Encoding Problems
**Solution**: Use actual Unicode characters, not HTML entities or escapes

### Issue: Wrong Date Format
**Solution**: Use `date "+%b %d, %Y"` for consistent formatting

## Automation with Claude Code Hooks

### Scheduling Workflows

Claude Code hooks enable automatic workflow execution at specified times. This completes the automation loop, making workflows truly hands-free.

#### Hook Configuration

**Location**: `.claude/hooks.json` or `.claude/settings/hooks.md`

**Example Hook Configuration**:
```json
{
  "name": "daily-brief",
  "schedule": "0 6 * * *",
  "command": "/motus daily-brief",
  "description": "Run daily briefing every morning at 6:00 AM",
  "enabled": true
}
```

#### Implemented Scheduled Workflows

1. **Daily Brief (6:00 AM)**
   - Automatically generates morning briefing
   - Creates Obsidian daily note
   - No manual intervention required

2. **Evening Report (9:00 PM)**
   - Summarizes daily accomplishments
   - Prepares tomorrow's overview
   - Appends to existing daily note

#### Setup Methods

**Method 1: Claude Code Hooks**
```bash
claude-code hooks add daily-brief --schedule "0 6 * * *" --command "/motus daily-brief"
claude-code hooks add evening-report --schedule "0 21 * * *" --command "/motus evening-report"
```

**Method 2: macOS LaunchAgents**
- Uses `.plist` files in `~/Library/LaunchAgents/`
- Native macOS scheduling
- Survives system restarts

**Method 3: Unix Crontab**
```cron
0 6 * * * /usr/local/bin/claude-code run '/motus daily-brief'
0 21 * * * /usr/local/bin/claude-code run '/motus evening-report'
```

#### Automation Setup Script

Run `setup-automation.sh` to configure automatic execution:
```bash
./setup-automation.sh
```

This script:
- Creates necessary log directories
- Sets up LaunchAgents or crontab entries
- Verifies installation
- Provides manual trigger commands

#### Monitoring Automated Workflows

**Check Execution Logs**:
```bash
tail -f /Users/ianwinscom/motus/logs/daily-brief.log
tail -f /Users/ianwinscom/motus/logs/evening-report.log
```

**Verify Schedule**:
```bash
# LaunchAgents
launchctl list | grep motus

# Crontab
crontab -l
```

### Complete Automation Flow

```
6:00 AM → Daily Brief Trigger
    ↓
Parallel Agent Execution
    ↓
Obsidian Note Created
    ↓
[User Activities During Day]
    ↓
9:00 PM → Evening Report Trigger
    ↓
Parallel Agent Execution
    ↓
Note Updated with Report
    ↓
[Sleep]
    ↓
6:00 AM → Cycle Repeats
```

This creates a fully automated daily loop that requires zero manual intervention while keeping you organized and informed.

## Future Enhancements

1. **Dynamic Workflow Creation**: AI-generated workflows based on user needs
2. **Conditional Execution**: Agents that run based on conditions
3. **Cross-Workflow Communication**: Shared data between workflows
4. ~~**Workflow Scheduling**: Automatic execution at specified times~~ ✅ Implemented
5. **Workflow Templates**: Pre-built patterns for common scenarios
6. **Performance Metrics**: Track execution time and optimize bottlenecks
7. **Workflow Versioning**: Track changes and rollback capabilities
8. **Smart Scheduling**: Adjust timing based on calendar and habits
9. **Failure Recovery**: Automatic retry and notification systems
10. **Multi-User Support**: Workflows for teams and families

## Lessons Learned from Implementation

### Critical Implementation Issues and Solutions

#### 1. Authentication and Credentials
**Issue**: Agents failing with "credentials.json not found" errors
**Root Cause**: Incorrect credential paths or trying to use standalone auth
**Solution**: 
- Always use the same authentication method as the main script
- For Google services, use environment variables from `.env` file
- Call existing functions rather than reimplementing auth

**Best Practice**:
```javascript
// Good: Use existing authenticated functions
node /Users/ianwinscom/motus/life-admin/life-admin-agent.js get-calendar

// Bad: Trying to create new auth flow
const credentials = fs.readFileSync('/path/to/credentials.json')
```

#### 2. Mock Data Must Be Eliminated
**Issue**: Agents returning mock/fake data mixed with real data
**Root Cause**: Fallback to mock data when auth fails or errors occur
**Solution**:
- Return empty arrays/objects instead of mock data
- Never provide fallback fake data
- User prefers blank spaces over fake information

**Implementation**:
```javascript
// Before (BAD)
if (!this.oauth2Client) {
  return this.getMockCalendarEvents();
}

// After (GOOD)
if (!this.oauth2Client) {
  return []; // No auth, return empty array instead of mock data
}
```

#### 3. Date Format Consistency - CRITICAL ISSUE
**Issue**: Wrong date format creating files in incorrect locations (e.g., "2025-08-26.md" instead of "Aug 26, 2025.md")
**Root Cause**: Agents defaulting to ISO date format or not being explicit about format
**Solution**:
- ALWAYS use: `date "+%b %d, %Y"` format (e.g., "Aug 26, 2025")
- This format is used for Obsidian file names
- NEVER use ISO format (2025-08-26) for file operations
- File path MUST have spaces: "Aug 26, 2025.md" NOT "Aug-26-2025.md"
- Be EXTREMELY explicit in agent instructions about date format
- REPEAT the warning multiple times in agent instructions

**Critical Implementation**:
```markdown
CRITICAL FILE PATH RULES:
- NEVER use ISO date format (2025-08-26) for filenames
- ALWAYS use "Month Day, Year" format (Aug 26, 2025) for filenames  
- The file path MUST have spaces in the date: "Aug 26, 2025.md"
```

**Common Failure Points**:
- Agents trying to read "2025-08-26.md" instead of "Aug 26, 2025.md"
- Using JavaScript's default date formatting (ISO)
- Not explicitly using `date "+%b %d, %Y"` bash command
- Forgetting that the date has spaces in the filename

#### 4. Extending Existing Functions
**Issue**: Need new functionality (e.g., tomorrow's calendar)
**Root Cause**: Original functions only handle "today" scenarios
**Solution**:
- Add new methods to existing classes
- Follow the same pattern as existing methods
- Add new command line arguments to handle new cases

**Example**: Adding `fetchTomorrowCalendarEvents()` alongside `fetchCalendarEvents()`

#### 5. Agent Command Consistency
**Issue**: Agents using different command patterns
**Solution**:
- Standardize all agent commands to use the main script
- Pattern: `node /path/to/script.js [command]`
- Avoid complex inline Node.js execution strings

### Updated Best Practices

#### Agent Design Principles
1. **No Mock Data Ever**: Return empty results rather than fake data
2. **Consistent Commands**: Use the main script with command arguments
3. **Shared Authentication**: Reuse existing auth rather than reimplementing
4. **Clear Error Messages**: Report exact errors without fallback to mock data
5. **Date Format Standard**: Always use "Month DD, YYYY" format

#### Debugging Workflow Issues
1. **Test Individual Agents First**: Run each agent's command directly
2. **Check Authentication**: Ensure OAuth tokens are valid
3. **Verify Paths**: Confirm all file paths are absolute and correct
4. **Monitor Empty Returns**: Empty arrays are better than mock data
5. **Date Format Validation**: Check file names match expected format

#### Common Anti-Patterns to Avoid
- ❌ Creating new credential files or auth flows
- ❌ Returning mock data as fallback
- ❌ Using different date formats
- ❌ Complex inline JavaScript in Bash commands
- ❌ Reimplementing existing functionality

## Conclusion

This orchestration system provides a powerful, scalable framework for automating complex workflows through parallel agent execution. The key is maintaining clear separation of concerns, maximizing parallelization, and ensuring real data flow throughout the system.

The pattern established here - **Orchestrator → Parallel Data Collection → Processing → Output** - can be applied to any workflow, making it the foundation for comprehensive life and business automation within Claude Code.