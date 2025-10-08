# Quick Start Guide

Get up and running with /Motus in less than 5 minutes! This guide will help you create your first department, agent, and workflow.

## Prerequisites

Before starting, make sure you have:

- ✅ Claude Code CLI installed and running
- ✅ Motus installed ([Installation Guide](Installation.md))
- ✅ Basic understanding of command line

## Step 1: Verify Installation

Open Claude Code and verify Motus is installed:

```
/motus --version
```

You should see the Motus version number.

## Step 2: Create Your First Department

Let's create a simple "Tasks" department to manage your to-do lists.

```
/motus department create tasks
```

You'll see an interactive wizard. Here's what to enter:

```
📦 Department Name: tasks
📝 Display Name: Tasks Management
📄 Description: Personal task management and prioritization

🔌 Integrations needed? (y/n): n
  (We'll skip integrations for now)

✅ Confirm creation? (y/n): y
```

**Result:** Motus creates:
- ✅ Registry entry in `config/registries/departments.json`
- ✅ Master agent: `.claude/agents/tasks-admin.md`
- ✅ Documentation: `org-docs/departments/tasks-department.md`

## Step 3: Create Your First Agent

Now let's create an agent to fetch your tasks.

```
/motus tasks agent create task-fetcher
```

Follow the wizard:

```
🤖 Agent Name: task-fetcher
📝 Display Name: Task Fetcher
📄 Description: Retrieves tasks from various sources

🎯 Agent Type:
  1. Orchestrator - Coordinates workflows
  2. Data Fetcher - Gets data from APIs
  3. Specialist - Analyzes or creates content

Choose type (1-3): 2

🔧 Tools needed:
  Available: Read, Write, Bash, Task, WebFetch, WebSearch

Enter tools (comma-separated): Bash, Read

🤖 Model:
  1. Sonnet (fast, efficient)
  2. Opus (powerful, expensive)

Choose model (1-2): 1

✅ Confirm creation? (y/n): y
```

**Result:** Motus creates:
- ✅ Agent definition: `.claude/agents/task-fetcher.md`
- ✅ Implementation script: `tasks/agents/task-fetcher.js`
- ✅ Registry entry with department linkage

## Step 4: View Your Agent

Check that your agent was created:

```bash
cat .claude/agents/task-fetcher.md
```

You should see a fully-formed agent definition ready to use!

## Step 5: Create a Simple Workflow

Create a workflow that uses your agent:

```
/motus tasks workflow create daily-tasks
```

Follow the wizard:

```
🔄 Workflow Name: daily-tasks
📝 Display Name: Daily Task Review
📄 Description: Get and prioritize today's tasks

🤖 Agents in workflow:
  Available agents in tasks department:
    - tasks-admin
    - task-fetcher

Enter agent names (comma-separated): task-fetcher

⏰ Trigger type:
  1. Manual (run on demand)
  2. Scheduled (automatic)

Choose trigger (1-2): 1

✅ Confirm creation? (y/n): y
```

**Result:** Motus creates:
- ✅ Workflow entry in `config/registries/workflows.json`
- ✅ Links agents to workflow
- ✅ Updates documentation

## Step 6: Run Your Workflow

Now let's run the workflow you just created:

```
/motus tasks daily-tasks
```

The workflow will execute and your `task-fetcher` agent will run!

## Step 7: View Documentation

Check out the auto-generated documentation for your department:

```bash
cat org-docs/departments/tasks-department.md
```

You'll see a complete document with:
- Department overview
- List of agents
- List of workflows
- Usage instructions

## What You Just Built

In 5 minutes, you created:

1. ✅ **Tasks Department** - Organized structure
2. ✅ **Task Fetcher Agent** - Data retrieval agent
3. ✅ **Daily Tasks Workflow** - Automated process
4. ✅ **Complete Documentation** - Auto-generated

## Next Steps

### Add More Agents

Create additional agents for your department:

```bash
# Create a task prioritizer
/motus tasks agent create task-prioritizer

# Create a task reporter
/motus tasks agent create task-reporter
```

### Add Integrations

Connect external services:

```bash
# Add Todoist integration
/motus tasks integration add todoist
```

See [Setup Integrations](Setup-Integrations.md) for details.

### Create Complex Workflows

Build multi-agent workflows:

```bash
# Workflow that fetches, prioritizes, and reports
/motus tasks workflow create complete-task-flow
```

See [Creating Workflows](Creating-Workflows.md) for advanced workflows.

### Explore Examples

Check out example departments:

```bash
# View all departments
/motus department list

# View specific department
/motus department info tasks
```

## Common Commands Cheat Sheet

```bash
# Departments
/motus department create <name>          # Create department
/motus department list                   # List all departments
/motus department info <name>            # Department details

# Agents
/motus <dept> agent create <name>        # Create agent
/motus <dept> agent list                 # List department agents
/motus <dept> agent info <name>          # Agent details

# Workflows
/motus <dept> workflow create <name>     # Create workflow
/motus <dept> workflow list              # List workflows
/motus <dept> <workflow-name>            # Run workflow

# Documentation
/motus docs update                       # Regenerate docs
/motus docs show                         # Show reference
```

## Troubleshooting

**Issue:** Command not found
```bash
# Solution: Make sure motus is executable
chmod +x /path/to/motus/motus
```

**Issue:** Agent not working
```bash
# Solution: Check agent definition
cat .claude/agents/<agent-name>.md

# Validate registries
node lib/validator.js
```

**Issue:** Workflow fails
```bash
# Solution: Check workflow configuration
/motus <dept> workflow info <workflow-name>

# View logs
tail -f logs/motus.log  # if logging is enabled
```

For more help, see [Troubleshooting](Troubleshooting.md).

## Learn More

Now that you have the basics, dive deeper:

- **[Creating Departments](Creating-Departments.md)** - Advanced department creation
- **[Creating Agents](Creating-Agents.md)** - Build powerful agents
- **[Creating Workflows](Creating-Workflows.md)** - Complex automation
- **[Examples](Examples.md)** - Real-world use cases
- **[API Reference](API-Reference.md)** - Library documentation

## Example: Complete Task Management System

Here's a complete example you can build:

```bash
# 1. Create department
/motus department create tasks

# 2. Create agents
/motus tasks agent create task-fetcher       # Get tasks
/motus tasks agent create task-prioritizer   # Prioritize
/motus tasks agent create task-reporter      # Create report

# 3. Create workflow
/motus tasks workflow create morning-tasks

# 4. Run workflow
/motus tasks morning-tasks
```

This gives you a fully automated task management system!

---

**Next Steps**:
- [Installation →](Installation.md)
- [Concepts →](Concepts.md)
- [Creating Departments →](Creating-Departments.md)
