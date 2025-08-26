# 🎯 Motus for Claude Code - Implementation Guide

## How Motus Works in Claude Code

Motus leverages Claude Code's native features to create a truly integrated life and business automation system.

## 🔧 Core Components

### 1. Slash Commands (`/motus`)
The `/motus` command is defined in `.claudecode/commands/motus.md` and provides the primary interface for all interactions.

### 2. Sub-Agents (Task Tool)
Each Life Department agent is implemented using Claude's Task tool for specialized operations:

```javascript
// Example: Morning Briefing using sub-agent
await Task({
  subagent_type: 'general-purpose',
  description: 'Morning Briefing',
  prompt: 'Generate comprehensive morning briefing with weather, schedule, priorities...'
})
```

### 3. MCP Integrations
- **filesystem-mcp**: Store briefings, reviews, and tracking data
- **sqlite-mcp**: Structured data for habits, goals, finances
- **github-mcp**: Project and code management
- **gdrive-mcp**: Document storage and retrieval

### 4. Hooks for Automation
Automated triggers defined in `.claudecode/hooks/motus-hooks.json`:
- Morning briefing at 8 AM
- Evening review at 9 PM
- Weekly planning on Sundays
- Health reminders every 2 hours

### 5. Persistent Memory (CLAUDE.md)
System configuration and user preferences stored in CLAUDE.md for persistence across sessions.

## 📋 Available Commands

### Life Department Commands

#### Morning Briefing
```
/motus life briefing
```
Generates comprehensive morning overview using sub-agents for:
- Weather analysis
- Calendar review
- Priority setting
- Health check
- Financial status
- News curation

#### Evening Review
```
/motus life review
```
Reflects on the day and prepares for tomorrow:
- Accomplishment tracking
- Tomorrow's preparation
- Health summary
- Gratitude practice

#### Planning Sessions
```
/motus life plan [day|week|month]
```
Strategic planning at different time scales:
- Daily: Task prioritization
- Weekly: Goal alignment
- Monthly: Progress review

#### Tracking
```
/motus life track [type] [data]
```
Track any personal metric:
- `/motus life track habit "30 min meditation"`
- `/motus life track goal "Completed chapter 3"`
- `/motus life track health "8 glasses water"`

## 🤖 Life Department Agents

### 1. Daily Planner Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Schedule optimization',
  prompt: 'Review calendar, identify time blocks, optimize schedule...'
})
```

### 2. Health Tracker Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Health monitoring',
  prompt: 'Analyze fitness, nutrition, sleep data. Provide recommendations...'
})
```

### 3. Finance Manager Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Financial analysis',
  prompt: 'Review budget, track expenses, monitor investments...'
})
```

### 4. Personal Assistant Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Task management',
  prompt: 'Draft emails, schedule appointments, set reminders...'
})
```

### 5. Goal Tracker Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Progress monitoring',
  prompt: 'Track goal progress, identify milestones, provide motivation...'
})
```

### 6. Content Curator Agent
```javascript
Task({
  subagent_type: 'general-purpose',
  description: 'Information gathering',
  prompt: 'Curate news, weather, learning resources...'
})
```

## 🔄 Workflow Examples

### Morning Routine Workflow
1. Weather check (Content Curator)
2. Calendar review (Daily Planner)
3. Priority setting (Goal Tracker)
4. Health status (Health Tracker)
5. Finance check (Finance Manager)
6. News digest (Content Curator)

### Weekly Planning Workflow
1. Goal progress review (Goal Tracker)
2. Week ahead scheduling (Daily Planner)
3. Fitness planning (Health Tracker)
4. Budget allocation (Finance Manager)
5. Learning resources (Content Curator)

## 💾 Data Persistence

### Using filesystem-mcp
```javascript
// Save briefing
await mcp.filesystem.write('/data/briefings/2025-08-26.json', briefingData)

// Load previous briefing
const previous = await mcp.filesystem.read('/data/briefings/2025-08-25.json')
```

### Using sqlite-mcp
```javascript
// Track habit
await mcp.sqlite.execute(
  'INSERT INTO habits (date, type, data) VALUES (?, ?, ?)',
  [new Date(), 'exercise', '30 minutes cardio']
)

// Query progress
const progress = await mcp.sqlite.query(
  'SELECT * FROM habits WHERE date >= ? AND type = ?',
  [weekAgo, 'exercise']
)
```

## ⚙️ Configuration

### CLAUDE.md Structure
- System state and version
- Department configurations
- Agent settings
- User preferences
- Goal and habit tracking
- Workflow history

### Hooks Configuration
- Scheduled triggers (cron format)
- Event-based triggers
- Command mappings
- Automation rules

### MCP Configuration
- Active servers
- Authentication credentials
- Data paths
- Integration settings

## 🚀 Usage Patterns

### Daily Usage
1. **Morning**: `/motus life briefing`
2. **Throughout Day**: `/motus life track [activities]`
3. **Evening**: `/motus life review`

### Weekly Usage
1. **Sunday Planning**: `/motus life plan week`
2. **Daily Briefings**: Automated via hooks
3. **Progress Tracking**: `/motus life track goal [progress]`

### Monthly Usage
1. **Finance Review**: `/motus life finance review`
2. **Goal Assessment**: `/motus life goals review`
3. **Health Summary**: `/motus life health monthly`

## 🔮 Advanced Features

### Custom Workflows
Create custom workflows by chaining sub-agents:
```javascript
// Custom productivity workflow
const productivityFlow = async () => {
  const priorities = await Task({...}) // Get priorities
  const schedule = await Task({...})    // Optimize schedule
  const focus = await Task({...})       // Generate focus plan
  return combinedPlan
}
```

### Cross-Department Communication
When additional departments are added:
```javascript
// Life ↔ Business integration
const integratedPlanning = async () => {
  const personal = await lifeAgent.getPriorities()
  const business = await businessAgent.getTasks()
  const integrated = await plannerAgent.merge(personal, business)
  return integrated
}
```

### Autonomous Operations
System can run independently:
- Auto-adjusts schedules based on patterns
- Learns from tracking data
- Optimizes routines over time
- Alerts only for important items

## 📝 Best Practices

1. **Use Sub-Agents for Complex Tasks**: Leverage Task tool for specialized operations
2. **Store Data with MCPs**: Use filesystem/sqlite for persistence
3. **Configure Hooks for Automation**: Set up scheduled triggers
4. **Update CLAUDE.md Regularly**: Keep preferences and state current
5. **Chain Agents for Workflows**: Combine multiple agents for complex operations

## 🎯 Next Steps

1. **Customize Settings**: Edit CLAUDE.md with your preferences
2. **Set Up Hooks**: Configure automation schedules
3. **Track Consistently**: Build data for insights
4. **Expand Departments**: Add Business, Finance, Creative departments
5. **Create Custom Workflows**: Design your perfect routines

---

*Motus for Claude Code - Your AI Life Operating System*