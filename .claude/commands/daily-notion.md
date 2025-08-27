---
description: Daily briefing to Notion - Sends data to multiple Notion databases (Daily Journal, Tasks, Health Tracker, Projects)
allowed-tools: Read, Write, Edit, MultiEdit, Bash, WebFetch, WebSearch, TodoWrite, Glob, Grep, LS, Task
argument-hint: Run daily briefing and distribute to all relevant Notion databases
---

# Daily Notion Command

You are the Motus Notion orchestrator. Process the command to create a daily briefing in Notion with multi-database distribution.

## EXECUTION ORDER (MANDATORY)

When the user runs `/motus daily-notion`, you MUST follow this EXACT sequence:

### Step 1: Data Collection (PARALLEL EXECUTION - ALL AT ONCE)
Run ALL these agents simultaneously using Task tool:
```
- Task(subagent_type: 'weather-fetcher', prompt: 'Get weather for Chiang Mai')
- Task(subagent_type: 'calendar-fetcher', prompt: 'Get today's calendar events')  
- Task(subagent_type: 'email-processor', prompt: 'Process important emails')
- Task(subagent_type: 'task-compiler', prompt: 'Compile and prioritize all tasks')
- Task(subagent_type: 'oura-fetcher', prompt: 'Get Oura ring sleep data')
- Task(subagent_type: 'quote-fetcher', prompt: 'Get inspirational quote')
```

### Step 2: Analysis (AFTER Step 1 completes)
```
- Task(subagent_type: 'insight-generator', prompt: 'Generate insights from: [include all data from Step 1]')
```

### Step 3: Database Distribution (AFTER Step 2 completes)
```
- Task(subagent_type: 'notion-creator', prompt: 'Create entries in ALL databases with: [include all collected data]')
```

The notion-creator will automatically:
- Create full briefing in Daily Journal
- Add each task to Tasks database with correct priority
- Record health metrics in Health Tracker
- Update related projects in Projects database

## CRITICAL Rules

- MUST use Task tool for parallel execution (not Bash)
- MUST run Step 1 agents in parallel (all at once)
- Wait for all parallel tasks to complete before Step 2
- Pass all collected data to notion-creator agent

## Expected Output

After successful completion:
1. Display summary of collected data
2. Show Notion page URL
3. Confirm successful creation

## Error Handling

If any agent fails:
- Continue with other agents
- Report which agents failed
- Create Notion entry with available data

Example success message:
```
✅ Daily Notion Brief Complete!

📊 Data Distributed:
- Daily Journal: Full briefing created
- Tasks Database: 8 tasks added (2 high, 4 medium, 2 low)
- Health Tracker: Sleep metrics recorded (75/100)
- Projects: 2 projects updated

📝 Main Briefing URL: https://notion.so/...

📈 Key Metrics:
- Sleep Score: 75/100
- Readiness: 68/100
- Weather: 27°C, Partly cloudy
- Calendar: 3 events today
```