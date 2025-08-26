# /motus

AI Life & Business Automation System - Run your entire life through AI agents

## Usage
```
/motus [subcommand] [options]
```

## Subcommands

### Core
- `init` - Initialize Motus system
- `status` - Show system status
- `help` - Display help

### Life Department
- `life briefing` - Morning briefing with weather, calendar, priorities
- `life review` - Evening review and tomorrow prep
- `life plan [day|week|month]` - Planning sessions
- `life track [habit|goal|health] [data]` - Track personal metrics
- `life finance [budget|bills|invest]` - Financial management
- `life health [workout|nutrition|sleep]` - Health tracking

### Departments
- `department create [name]` - Create new department
- `department list` - List all departments
- `department [name] [command]` - Run department command

### Workflows
- `run [workflow-name]` - Execute a workflow
- `workflow list` - List available workflows
- `workflow create` - Create new workflow (interactive)
- `workflow schedule [name] [time]` - Schedule workflow

### Agents
- `agent list` - List all agents
- `agent create [name] [type]` - Create new agent
- `agent status [name]` - Check agent status

## Examples
```
/motus init
/motus life briefing
/motus run morning-routine
/motus life track habit "30 min meditation"
/motus department create business
```

## Configuration
Settings stored in CLAUDE.md for persistence across sessions.