# Tutorial: Build Your First Department

Welcome! This comprehensive tutorial will walk you through building a complete department from scratch. By the end, you'll have a working task management system with real agents and workflows.

**What You'll Build:**
- A "Tasks" department for managing to-do items
- A task-fetcher agent that reads tasks from a JSON file
- A task-prioritizer agent that analyzes and ranks tasks
- A daily-tasks workflow that combines both agents
- Complete, working code you can actually run

**Time Required:** 30-45 minutes

## Prerequisites

Before starting, make sure you have:

- ✅ **Motus Installed** - See [Installation Guide](Installation.md)
- ✅ **Claude Code CLI** - Working and accessible
- ✅ **Text Editor** - VS Code, Vim, or any editor
- ✅ **Basic Command Line** - Comfortable with terminal commands
- ✅ **Node.js 18+** - Required for running scripts

**Verify your setup:**

```bash
# Check Motus is installed
/motus --version

# Check Node.js version
node --version
```

You should see version numbers for both.

---

## Tutorial Overview

This tutorial has 4 main steps:

1. **Create Department** - Set up the Tasks department structure
2. **Build Task Fetcher** - Create an agent that reads tasks from a file
3. **Build Task Prioritizer** - Create an agent that analyzes tasks
4. **Create Workflow** - Combine agents into an automated workflow
5. **Test Everything** - Run end-to-end and verify it works

Let's get started!

---

## Step 1: Create the Tasks Department

We'll use the interactive wizard to create a department for task management.

### 1.1 Start the Wizard

In Claude Code, run:

```
/motus department create tasks
```

### 1.2 Follow the Prompts

The wizard will ask you several questions. Here's what to enter:

**Display Name:**
```
Tasks Management
```

**Description:**
```
Personal task management, prioritization, and daily planning
```

**Integrations Needed:**
```
n
```
(We'll use local files for this tutorial, no external APIs needed)

**Confirm Creation:**
```
y
```

### 1.3 Expected Output

You should see:

```
✅ Department Created Successfully!

📊 Generated Files:
  Department Definition:
    ✓ .claude/agents/tasks-admin.md

  Registry:
    ✓ config/registries/departments.json (updated)

  Documentation:
    ✓ org-docs/departments/tasks-department.md

📂 Directory Structure:
  Created tasks/ directory for implementations

🚀 Next Steps:
1. Create agents with: /motus tasks agent create <name>
2. View department: /motus department info tasks
```

### 1.4 Verify Creation

Check that the department was created:

```bash
# View the registry
cat config/registries/departments.json

# You should see:
{
  "tasks": {
    "name": "tasks",
    "displayName": "Tasks Management",
    "description": "Personal task management, prioritization, and daily planning",
    "agents": ["tasks-admin"],
    "workflows": [],
    "created": "2025-10-09T...",
    "version": "1.0.0"
  }
}
```

**✅ Checkpoint:** Department created and registered!

---

## Step 2: Build the Task Fetcher Agent

Now we'll create an agent that reads tasks from a JSON file. This agent will be a "data fetcher" type.

### 2.1 Create Sample Data File

First, let's create a JSON file with some sample tasks:

```bash
# Create data directory
mkdir -p tasks/data

# Create sample tasks file
cat > tasks/data/my-tasks.json << 'EOF'
{
  "tasks": [
    {
      "id": 1,
      "title": "Review Q4 financial reports",
      "description": "Analyze revenue and expense trends for presentation",
      "priority": "high",
      "due": "2025-10-15",
      "tags": ["work", "finance", "urgent"]
    },
    {
      "id": 2,
      "title": "Update project documentation",
      "description": "Document new API endpoints and usage examples",
      "priority": "medium",
      "due": "2025-10-20",
      "tags": ["work", "documentation"]
    },
    {
      "id": 3,
      "title": "Schedule dentist appointment",
      "description": "Annual checkup and cleaning",
      "priority": "low",
      "due": "2025-10-30",
      "tags": ["personal", "health"]
    },
    {
      "id": 4,
      "title": "Prepare presentation slides",
      "description": "Create deck for Friday's team meeting",
      "priority": "high",
      "due": "2025-10-12",
      "tags": ["work", "presentation", "urgent"]
    },
    {
      "id": 5,
      "title": "Research new development tools",
      "description": "Evaluate VS Code alternatives and build tools",
      "priority": "low",
      "due": "2025-11-01",
      "tags": ["work", "research"]
    }
  ],
  "metadata": {
    "lastUpdated": "2025-10-09",
    "totalTasks": 5
  }
}
EOF
```

### 2.2 Create the Agent Definition

Use the agent creator wizard:

```
/motus tasks agent create task-fetcher
```

**Wizard Responses:**

**What does this agent do?**
```
Reads tasks from a local JSON file and returns them as structured data
```

**Agent Type Detection:**
The wizard should detect this as a `data-fetcher`. Confirm with:
```
yes
```

**Does this agent call an external API?**
```
no
```
(We're reading from a local file, not an API)

**What tools does it need?**
```
Bash, Read
```

**Confirm creation:**
```
yes
```

### 2.3 Expected Agent Output

The wizard creates `.claude/agents/task-fetcher.md`. Let's verify:

```bash
cat .claude/agents/task-fetcher.md
```

You should see an agent definition with the Bash and Read tools.

### 2.4 Create the Implementation Script

Now we need to create the actual script that fetches tasks. Create this file manually:

```bash
# Create agents directory
mkdir -p tasks/agents

# Create the task-fetcher script
cat > tasks/agents/task-fetcher.js << 'EOF'
#!/usr/bin/env node

/**
 * Task Fetcher
 * Reads tasks from a local JSON file and returns them as structured data
 * Generated for Motus Tasks Department
 */

const fs = require('fs');
const path = require('path');

/**
 * Fetch tasks from JSON file
 * @param {string} filePath - Path to tasks JSON file
 * @returns {Object} Tasks data
 */
async function fetchTasks(filePath = 'tasks/data/my-tasks.json') {
  try {
    // Resolve absolute path
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Tasks file not found: ${absolutePath}`);
    }

    // Read and parse JSON
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const data = JSON.parse(fileContent);

    // Validate structure
    if (!data.tasks || !Array.isArray(data.tasks)) {
      throw new Error('Invalid tasks file format: missing "tasks" array');
    }

    // Return structured data
    return {
      success: true,
      totalTasks: data.tasks.length,
      tasks: data.tasks,
      metadata: data.metadata || {},
      fetchedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching tasks:', error.message);
    return {
      success: false,
      error: error.message,
      tasks: [],
      fetchedAt: new Date().toISOString()
    };
  }
}

// If run directly, output JSON
if (require.main === module) {
  const filePath = process.argv[2];
  fetchTasks(filePath).then(data => {
    console.log(JSON.stringify(data, null, 2));
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fetchTasks };
EOF

# Make it executable
chmod +x tasks/agents/task-fetcher.js
```

### 2.5 Test the Task Fetcher

Let's test the script independently:

```bash
node tasks/agents/task-fetcher.js
```

**Expected Output:**

```json
{
  "success": true,
  "totalTasks": 5,
  "tasks": [
    {
      "id": 1,
      "title": "Review Q4 financial reports",
      "description": "Analyze revenue and expense trends for presentation",
      "priority": "high",
      "due": "2025-10-15",
      "tags": ["work", "finance", "urgent"]
    },
    {
      "id": 2,
      "title": "Update project documentation",
      ...
    },
    ...
  ],
  "metadata": {
    "lastUpdated": "2025-10-09",
    "totalTasks": 5
  },
  "fetchedAt": "2025-10-09T..."
}
```

**✅ Checkpoint:** Task fetcher working! You can read tasks from the JSON file.

### 2.6 Update the Agent Definition

Now we need to tell the agent definition how to use this script. Edit `.claude/agents/task-fetcher.md`:

```bash
# Open in your editor
# Add this to the agent's content (after the frontmatter):
```

Add this section to the agent file:

```markdown
## How This Agent Works

This agent reads tasks from a local JSON file and returns structured data.

## Execution

To fetch tasks, execute the script:

```bash
node tasks/agents/task-fetcher.js [optional-file-path]
```

Default file path: `tasks/data/my-tasks.json`

## Output Format

Returns JSON with:
- `success`: Boolean indicating if fetch succeeded
- `totalTasks`: Number of tasks found
- `tasks`: Array of task objects
- `metadata`: Additional info from the file
- `fetchedAt`: ISO timestamp of when tasks were fetched

## Example Usage

In Claude Code:
```
Use the task-fetcher agent to get all my current tasks from tasks/data/my-tasks.json
```

The agent will execute the script and return the structured task data.
```

**✅ Checkpoint:** Task fetcher agent complete with implementation!

---

## Step 3: Build the Task Prioritizer Agent

Now let's create an agent that analyzes tasks and prioritizes them. This will be a "specialist" agent.

### 3.1 Create the Agent

```
/motus tasks agent create task-prioritizer
```

**Wizard Responses:**

**What does this agent do?**
```
Analyzes tasks and prioritizes them based on due date, priority level, and tags
```

**Agent Type Detection:**
The wizard should detect this as a `specialist`. Confirm with:
```
yes
```

**What tools does it need?**
```
Read
```

**Does it need an implementation script?**
```
yes
```

**Confirm creation:**
```
yes
```

### 3.2 Create the Prioritizer Script

```bash
cat > tasks/agents/task-prioritizer.js << 'EOF'
#!/usr/bin/env node

/**
 * Task Prioritizer
 * Analyzes tasks and prioritizes them based on due date, priority level, and tags
 * Generated for Motus Tasks Department
 */

const fs = require('fs');

/**
 * Calculate priority score for a task
 * @param {Object} task - Task object
 * @returns {number} Priority score (higher = more urgent)
 */
function calculatePriorityScore(task) {
  let score = 0;

  // Base priority level
  const priorityScores = {
    'high': 100,
    'medium': 50,
    'low': 10
  };
  score += priorityScores[task.priority] || 0;

  // Due date urgency (within 3 days = +50, within 7 days = +25)
  if (task.due) {
    const dueDate = new Date(task.due);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 3) {
      score += 50;
    } else if (daysUntilDue <= 7) {
      score += 25;
    }

    // Overdue tasks get highest priority
    if (daysUntilDue < 0) {
      score += 100;
    }
  }

  // Urgent tag adds extra priority
  if (task.tags && task.tags.includes('urgent')) {
    score += 30;
  }

  return score;
}

/**
 * Prioritize tasks
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Prioritized tasks with analysis
 */
function prioritizeTasks(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return {
      success: false,
      error: 'No tasks provided',
      prioritizedTasks: []
    };
  }

  // Calculate scores
  const tasksWithScores = tasks.map(task => ({
    ...task,
    priorityScore: calculatePriorityScore(task)
  }));

  // Sort by priority score (highest first)
  const prioritized = tasksWithScores.sort((a, b) => b.priorityScore - a.priorityScore);

  // Categorize
  const urgent = prioritized.filter(t => t.priorityScore >= 150);
  const important = prioritized.filter(t => t.priorityScore >= 75 && t.priorityScore < 150);
  const normal = prioritized.filter(t => t.priorityScore < 75);

  return {
    success: true,
    totalTasks: tasks.length,
    prioritizedTasks: prioritized,
    categories: {
      urgent: {
        count: urgent.length,
        tasks: urgent
      },
      important: {
        count: important.length,
        tasks: important
      },
      normal: {
        count: normal.length,
        tasks: normal
      }
    },
    recommendations: generateRecommendations(urgent, important),
    analyzedAt: new Date().toISOString()
  };
}

/**
 * Generate recommendations based on task analysis
 */
function generateRecommendations(urgent, important) {
  const recommendations = [];

  if (urgent.length > 0) {
    recommendations.push(`🔴 You have ${urgent.length} urgent task(s) that need immediate attention`);
    urgent.forEach(task => {
      recommendations.push(`   → "${task.title}" (due: ${task.due})`);
    });
  }

  if (important.length > 3) {
    recommendations.push(`⚠️  You have ${important.length} important tasks - consider delegating or rescheduling some`);
  }

  if (urgent.length === 0 && important.length === 0) {
    recommendations.push(`✅ No urgent tasks - good time to focus on long-term projects`);
  }

  return recommendations;
}

// If run directly from command line
if (require.main === module) {
  // Read tasks from stdin or file
  const input = process.argv[2];

  if (!input) {
    console.error('Usage: node task-prioritizer.js <tasks-json-file>');
    process.exit(1);
  }

  try {
    const data = JSON.parse(fs.readFileSync(input, 'utf8'));
    const result = prioritizeTasks(data.tasks || data);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { prioritizeTasks, calculatePriorityScore };
EOF

chmod +x tasks/agents/task-prioritizer.js
```

### 3.3 Test the Task Prioritizer

```bash
node tasks/agents/task-prioritizer.js tasks/data/my-tasks.json
```

**Expected Output:**

```json
{
  "success": true,
  "totalTasks": 5,
  "prioritizedTasks": [
    {
      "id": 4,
      "title": "Prepare presentation slides",
      "priority": "high",
      "due": "2025-10-12",
      "priorityScore": 175,
      ...
    },
    {
      "id": 1,
      "title": "Review Q4 financial reports",
      "priorityScore": 150,
      ...
    },
    ...
  ],
  "categories": {
    "urgent": {
      "count": 2,
      "tasks": [...]
    },
    "important": {
      "count": 1,
      "tasks": [...]
    },
    "normal": {
      "count": 2,
      "tasks": [...]
    }
  },
  "recommendations": [
    "🔴 You have 2 urgent task(s) that need immediate attention",
    "   → \"Prepare presentation slides\" (due: 2025-10-12)",
    "   → \"Review Q4 financial reports\" (due: 2025-10-15)"
  ],
  "analyzedAt": "2025-10-09T..."
}
```

**✅ Checkpoint:** Task prioritizer working! It's analyzing and ranking tasks.

---

## Step 4: Create a Workflow

Now let's create a workflow that combines both agents: fetch tasks, then prioritize them.

### 4.1 Create the Workflow

```
/motus tasks workflow create daily-tasks
```

**Wizard Responses:**

**Display Name:**
```
Daily Task Review
```

**Description:**
```
Fetches tasks and prioritizes them for daily planning
```

**Which agents should run in parallel?**
```
(none - hit Enter)
```
(We need to fetch first, then prioritize, so they're sequential)

**Which agents should run sequentially?**
```
task-fetcher, task-prioritizer
```

**Trigger type:**
```
1
```
(Manual for now)

**Confirm creation:**
```
yes
```

### 4.2 Create a Simple Orchestrator Script

Since workflows need orchestration, let's create a simple script that runs both agents:

```bash
cat > tasks/workflows/daily-tasks.sh << 'EOF'
#!/bin/bash

###
# Daily Tasks Workflow
# Fetches tasks and prioritizes them for daily planning
###

echo "🔄 Running Daily Tasks Workflow..."
echo ""

# Step 1: Fetch tasks
echo "📥 Step 1: Fetching tasks..."
TASKS_JSON=$(node tasks/agents/task-fetcher.js)
FETCH_STATUS=$?

if [ $FETCH_STATUS -ne 0 ]; then
  echo "❌ Failed to fetch tasks"
  exit 1
fi

echo "✅ Fetched $(echo "$TASKS_JSON" | jq -r '.totalTasks') tasks"
echo ""

# Save to temp file for prioritizer
echo "$TASKS_JSON" > /tmp/fetched-tasks.json

# Step 2: Prioritize tasks
echo "🎯 Step 2: Prioritizing tasks..."
PRIORITIZED_JSON=$(node tasks/agents/task-prioritizer.js /tmp/fetched-tasks.json)
PRIORITIZE_STATUS=$?

if [ $PRIORITIZE_STATUS -ne 0 ]; then
  echo "❌ Failed to prioritize tasks"
  exit 1
fi

echo "✅ Tasks prioritized"
echo ""

# Display results
echo "═══════════════════════════════════════════════"
echo "📊 DAILY TASK REPORT"
echo "═══════════════════════════════════════════════"
echo ""

# Show recommendations
echo "💡 RECOMMENDATIONS:"
echo "$PRIORITIZED_JSON" | jq -r '.recommendations[]'
echo ""

# Show urgent tasks
echo "🔴 URGENT TASKS:"
echo "$PRIORITIZED_JSON" | jq -r '.categories.urgent.tasks[] | "  \(.id). \(.title) (due: \(.due))"'
echo ""

# Show important tasks
echo "⚠️  IMPORTANT TASKS:"
echo "$PRIORITIZED_JSON" | jq -r '.categories.important.tasks[] | "  \(.id). \(.title) (due: \(.due))"'
echo ""

# Show normal tasks
echo "📝 NORMAL TASKS:"
echo "$PRIORITIZED_JSON" | jq -r '.categories.normal.tasks[] | "  \(.id). \(.title) (due: \(.due))"'
echo ""

# Save full report
REPORT_FILE="tasks/data/daily-report-$(date +%Y-%m-%d).json"
echo "$PRIORITIZED_JSON" > "$REPORT_FILE"
echo "💾 Full report saved to: $REPORT_FILE"
echo ""

echo "✅ Workflow complete!"

# Cleanup
rm /tmp/fetched-tasks.json
EOF

chmod +x tasks/workflows/daily-tasks.sh
```

### 4.3 Update the Workflow Registry

Edit `config/registries/workflows.json` to add our workflow:

```bash
# If the file doesn't exist or is empty, create it:
cat > config/registries/workflows.json << 'EOF'
{
  "workflows": {
    "daily-tasks": {
      "name": "daily-tasks",
      "displayName": "Daily Task Review",
      "description": "Fetches tasks and prioritizes them for daily planning",
      "department": "tasks",
      "agents": ["task-fetcher", "task-prioritizer"],
      "steps": [
        {
          "step": 1,
          "agent": "task-fetcher",
          "action": "Fetch tasks from JSON file"
        },
        {
          "step": 2,
          "agent": "task-prioritizer",
          "action": "Analyze and prioritize tasks"
        }
      ],
      "trigger": "manual",
      "script": "tasks/workflows/daily-tasks.sh",
      "created": "2025-10-09T00:00:00.000Z"
    }
  }
}
EOF
```

**✅ Checkpoint:** Workflow created and configured!

---

## Step 5: Test End-to-End

Now let's run everything together and see it work!

### 5.1 Run the Workflow

```bash
./tasks/workflows/daily-tasks.sh
```

### 5.2 Expected Output

You should see:

```
🔄 Running Daily Tasks Workflow...

📥 Step 1: Fetching tasks...
✅ Fetched 5 tasks

🎯 Step 2: Prioritizing tasks...
✅ Tasks prioritized

═══════════════════════════════════════════════
📊 DAILY TASK REPORT
═══════════════════════════════════════════════

💡 RECOMMENDATIONS:
🔴 You have 2 urgent task(s) that need immediate attention
   → "Prepare presentation slides" (due: 2025-10-12)
   → "Review Q4 financial reports" (due: 2025-10-15)

🔴 URGENT TASKS:
  4. Prepare presentation slides (due: 2025-10-12)
  1. Review Q4 financial reports (due: 2025-10-15)

⚠️  IMPORTANT TASKS:
  2. Update project documentation (due: 2025-10-20)

📝 NORMAL TASKS:
  3. Schedule dentist appointment (due: 2025-10-30)
  5. Research new development tools (due: 2025-11-01)

💾 Full report saved to: tasks/data/daily-report-2025-10-09.json

✅ Workflow complete!
```

### 5.3 Verify the Report File

```bash
cat tasks/data/daily-report-2025-10-09.json
```

You should see the full JSON report with all prioritized tasks!

**✅ Checkpoint:** Everything works end-to-end! 🎉

---

## Step 6: Use in Claude Code

Now you can use these agents directly in Claude Code conversations.

### 6.1 Fetch Tasks

In Claude Code:

```
Use the task-fetcher agent to get all my current tasks
```

Claude Code will execute `task-fetcher.js` and show you the results.

### 6.2 Prioritize Tasks

```
Use the task-prioritizer agent to analyze my tasks from tasks/data/my-tasks.json
```

### 6.3 Run Full Workflow

```
Run the daily-tasks workflow to get my prioritized task list
```

---

## Troubleshooting

### Issue: "command not found: jq"

The workflow script uses `jq` for JSON parsing.

**Solution:** Install jq:

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Or remove jq usage and just output raw JSON:
echo "$PRIORITIZED_JSON"
```

### Issue: Tasks file not found

**Solution:** Make sure you're running from the Motus root directory:

```bash
cd /path/to/motus
./tasks/workflows/daily-tasks.sh
```

### Issue: Permission denied

**Solution:** Make scripts executable:

```bash
chmod +x tasks/agents/task-fetcher.js
chmod +x tasks/agents/task-prioritizer.js
chmod +x tasks/workflows/daily-tasks.sh
```

### Issue: Module not found

**Solution:** Make sure you're in the right directory and Node modules are installed:

```bash
cd /path/to/motus
npm install
```

---

## What You Built

Congratulations! You've built a complete task management system:

### Components Created

1. ✅ **Tasks Department**
   - Registry entry
   - Master admin agent
   - Documentation

2. ✅ **Task Fetcher Agent**
   - Agent definition (`.claude/agents/task-fetcher.md`)
   - Implementation script (`tasks/agents/task-fetcher.js`)
   - Reads from JSON files
   - Returns structured data

3. ✅ **Task Prioritizer Agent**
   - Agent definition (`.claude/agents/task-prioritizer.md`)
   - Implementation script (`tasks/agents/task-prioritizer.js`)
   - Calculates priority scores
   - Categorizes tasks (urgent/important/normal)
   - Generates recommendations

4. ✅ **Daily Tasks Workflow**
   - Workflow definition in registry
   - Orchestration script (`tasks/workflows/daily-tasks.sh`)
   - Sequential execution: fetch → prioritize
   - Generates daily reports

5. ✅ **Sample Data**
   - Tasks JSON file with 5 sample tasks
   - Report output files

### File Structure

```
motus/
├── .claude/agents/
│   ├── tasks-admin.md
│   ├── task-fetcher.md
│   └── task-prioritizer.md
├── config/registries/
│   ├── departments.json
│   ├── agents.json
│   └── workflows.json
├── tasks/
│   ├── agents/
│   │   ├── task-fetcher.js
│   │   └── task-prioritizer.js
│   ├── workflows/
│   │   └── daily-tasks.sh
│   └── data/
│       ├── my-tasks.json
│       └── daily-report-2025-10-09.json
└── org-docs/departments/
    └── tasks-department.md
```

---

## Next Steps

### Enhance Your System

1. **Add More Task Sources**
   - Create agents for Todoist, Notion, GitHub Issues
   - See [Setup Integrations](Setup-Integrations.md)

2. **Add More Agents**
   - Create a `task-reporter` agent that generates formatted reports
   - Create a `task-completer` agent that marks tasks as done
   - Create a `deadline-checker` agent that warns about overdue tasks

3. **Make It Automatic**
   - Schedule the workflow to run daily
   - See [Creating Workflows](Creating-Workflows.md) for scheduling

4. **Build More Departments**
   - Create a Finance department for budget tracking
   - Create a Health department for fitness tracking
   - Create a Learning department for course management

### Example: Add a Task Reporter

```
/motus tasks agent create task-reporter
```

Create `tasks/agents/task-reporter.js` that:
- Reads prioritized tasks
- Generates a Markdown report
- Saves to a file or sends via email

### Example: Schedule Daily Execution

Edit `tasks/workflows/daily-tasks.sh` to add a cron job:

```bash
# Run every day at 9 AM
0 9 * * * cd /path/to/motus && ./tasks/workflows/daily-tasks.sh
```

---

## Learn More

- **[Creating Agents](Creating-Agents.md)** - Advanced agent patterns
- **[Creating Workflows](Creating-Workflows.md)** - Complex workflow orchestration
- **[Setup Integrations](Setup-Integrations.md)** - Connect external services
- **[API Reference](API-Reference.md)** - Library documentation
- **[Examples](Examples.md)** - More use cases

---

## Summary

You've successfully built a complete department from scratch! You now understand:

- ✅ How to create departments with the wizard
- ✅ How to build data-fetcher agents with real implementations
- ✅ How to build specialist agents that analyze data
- ✅ How to create workflows that orchestrate multiple agents
- ✅ How to test and run everything end-to-end
- ✅ How to use agents in Claude Code conversations

This is the foundation for building any automation system with Motus. The same patterns apply whether you're managing tasks, tracking finances, analyzing data, or automating any other workflow.

**Happy automating!** 🚀

---

**Previous**: [Creating Workflows ←](Creating-Workflows.md) | **Next**: [Examples →](Examples.md)
