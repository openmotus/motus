# Motus Commands Reference

Auto-generated from registries on 2025-10-08T05:39:47.416Z

## System Overview

- **Total Departments**: 3
- **Total Agents**: 36
- **Total Workflows**: 8

## Quick Start Commands

```bash
# Daily commands
/motus daily-brief          # Morning briefing
/motus daily-notion         # Briefing to Notion
/motus evening-report       # Evening summary

# Life management
/motus life calendar        # Today's schedule
/motus life emails          # Important emails
/motus life tasks           # Prioritized tasks

# Creation commands
/motus department create    # New department
/motus [dept] agent create  # New agent
/motus [dept] workflow create # New workflow
```

## Departments

### Life Department

Personal life management including daily briefings, calendar, email, health tracking, finance management, and goal tracking

- **Agents**: 23
- **Workflows**: 4
- **Status**: active

**Available Workflows:**
- `/motus life daily-brief` - Generate comprehensive daily briefing with weather, calendar, emails, tasks, and Oura sleep data
- `/motus life evening-report` - Analyze today's accomplishments and prepare tomorrow's briefing with weather and calendar
- `/motus life daily-notion` - Create daily briefing in Notion Daily Journal database with weather, calendar, and tasks
- `/motus life evening-review` - Interactive evening review with guided reflection and daily note updates

[View full documentation](departments/life-department.md)

### System Department

Meta-system agents for creating departments, agents, workflows, and managing documentation

- **Agents**: 4
- **Workflows**: 0
- **Status**: active

[View full documentation](departments/system-department.md)

### Marketing Department

Social media marketing, content creation, campaign analytics, and brand management

- **Agents**: 9
- **Workflows**: 4
- **Status**: active

**Available Workflows:**
- `/motus marketing daily-trends` - Analyze daily trending topics and social media sentiment
- `/motus marketing content-pipeline` - Content creation, review, and scheduling workflow
- `/motus marketing campaign-analytics` - Weekly campaign performance analysis and reporting
- `/motus marketing social-report` - Generate comprehensive social media performance report

[View full documentation](departments/marketing-department.md)

## Creation Commands

### Department Management

```bash
/motus department create [name]    # Create new department
/motus department list              # List all departments
/motus department info [name]       # Department details
```

### Agent Management

```bash
/motus [dept] agent create [name]   # Create new agent
/motus [dept] agent list            # List department agents
/motus [dept] agent info [name]     # Agent details
```

### Workflow Management

```bash
/motus [dept] workflow create [name]  # Create new workflow
/motus [dept] workflow list           # List department workflows
/motus [dept] workflow info [name]    # Workflow details
```

### Documentation

```bash
/motus docs update                  # Regenerate all documentation
/motus docs show                    # Display this reference
```

## Agent Types

### Data Fetchers (11)
Retrieve data from APIs and external sources

### Orchestrators (5)
Coordinate multiple agents in workflows

### Specialists (20)
Perform specialized analysis and processing

---

*This document is auto-generated from `config/registries/`. Do not edit manually.*
*Last updated: 2025-10-08T05:39:47.418Z*
