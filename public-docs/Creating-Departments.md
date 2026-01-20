# Creating Departments

Learn how to create and manage departments in /Motus.

## What is a Department?

A department is an organizational unit that groups related agents, workflows, and integrations. Think of it as a container for automation focused on a specific area of your life or business.

## Creating Your First Department

### Using the Interactive Wizard

```
/motus department create <name>
```

**Example: Creating a Research Department**

```
/motus department create research
```

The wizard will prompt you for:

1. **Display Name**: Human-readable name
   ```
   Display Name: Research & Learning
   ```

2. **Description**: What the department does
   ```
   Description: Academic research, article summarization, and knowledge management
   ```

3. **Integrations**: External services needed
   ```
   Integrations needed? (y/n): y
   
   Available integrations:
   - Google Drive
   - Notion
   - Pocket
   
   Select integrations (comma-separated): notion
   ```

4. **Responsibilities**: Areas of focus
   ```
   Add responsibilities? (y/n): y
   
   Responsibility 1 Title: Article Collection
   Tasks (comma-separated): Save articles, Organize by topic, Tag content
   
   Responsibility 2 Title: Summarization
   Tasks (comma-separated): Summarize articles, Extract key points, Create notes
   
   Add more? (y/n): n
   ```

5. **Confirmation**
   ```
   Review:
   Name: research
   Display Name: Research & Learning
   Agents: 0 (will be added)
   Workflows: 0 (will be added)
   Integrations: 1
   
   Create department? (y/n): y
   ```

### What Gets Created

When you create a department, Motus automatically generates:

1. **Registry Entry** - `config/registries/departments.json`
   ```json
   {
     "research": {
       "name": "research",
       "displayName": "Research & Learning",
       "description": "Academic research...",
       "agents": [],
       "workflows": [],
       "integrations": [...]
     }
   }
   ```

2. **Master Agent** - `.claude/agents/research-admin.md`
   - Department orchestrator
   - Manages all department operations

3. **Documentation** - `org-docs/departments/research-department.md`
   - Auto-generated department guide
   - Lists all agents and workflows
   - Integration setup instructions

4. **Directory Structure**
   ```
   departments/
   └── research/
       ├── agents/        # Implementation scripts
       ├── workflows/     # Workflow scripts
       ├── data/          # Workflow outputs
       └── README.md      # Department overview
   ```

## Department Structure

### Complete Example

```json
{
  "name": "research",
  "displayName": "Research & Learning",
  "description": "Academic research, article summarization, and knowledge management",
  "created": "2025-10-08T10:00:00.000Z",
  "status": "active",
  "version": "1.0.0",
  "agents": [
    "research-admin",
    "article-fetcher",
    "summarizer",
    "note-creator"
  ],
  "workflows": [
    "daily-reading",
    "article-summary"
  ],
  "integrations": [
    {
      "name": "Notion",
      "type": "oauth2",
      "envVars": ["NOTION_API_KEY", "NOTION_DATABASE_ID"],
      "setup": "Get API key from notion.so/my-integrations"
    }
  ],
  "responsibilities": [
    {
      "title": "Article Collection",
      "tasks": ["Save articles", "Organize by topic", "Tag content"]
    }
  ]
}
```

## Best Practices

### Naming Conventions

✅ **Good Names:**
- `marketing` - Clear, concise
- `finance` - Single word, focused
- `research` - Descriptive

❌ **Bad Names:**
- `my-stuff` - Too vague
- `marketing-and-sales-and-content` - Too long
- `dept1` - Not descriptive

### Department Scope

**Keep departments focused:**
- ✅ One clear purpose
- ✅ 3-10 agents
- ✅ 1-5 workflows

**Avoid:**
- ❌ Too many responsibilities
- ❌ Mixing unrelated concerns
- ❌ Duplicate functionality

### Integration Planning

Before creating a department, identify required integrations:

```bash
Research Department Integrations:
✓ Notion (for notes)
✓ Pocket (for article collection)
✓ Google Drive (for PDFs)
```

## Managing Departments

### List All Departments

```
/motus department list
```

Output:
```
📦 Departments (3):
  - life: Life Management
  - marketing: Marketing Department
  - research: Research & Learning
```

### View Department Details

```
/motus department info research
```

Output:
```
📦 Research & Learning

Description: Academic research, article summarization, knowledge management
Status: active
Version: 1.0.0
Created: 2025-10-08

Agents (4):
  - research-admin (orchestrator)
  - article-fetcher (data-fetcher)
  - summarizer (specialist)
  - note-creator (specialist)

Workflows (2):
  - daily-reading
  - article-summary

Integrations (3):
  - Notion (oauth2)
  - Pocket (api-key)
  - Google Drive (oauth2)
```

### Update Department

To update a department, edit its entry in the registry directly or use Claude Code:
```
Update the research department description in the registries
```

The department registry is at `config/registries/departments.json`.

### Delete Department

To delete a department:
1. Remove the department entry from `config/registries/departments.json`
2. Remove related agents from `config/registries/agents.json`
3. Remove related workflows from `config/registries/workflows.json`
4. Delete the agent definition files from `.claude/agents/`
5. Delete the department directory from `departments/`
6. Run `/motus docs update` to regenerate documentation

⚠️ **Warning**: This will remove all agents, workflows, and data associated with the department!

## Example Departments

### 1. Bookmarks Department

**Purpose**: Manage and organize bookmarks

```
/motus department create bookmarks
```

**Agents**:
- `bookmark-fetcher` - Get bookmarks from browser
- `bookmark-categorizer` - Auto-categorize by topic
- `bookmark-cleaner` - Remove dead links

**Workflows**:
- `daily-cleanup` - Remove dead links daily
- `weekly-report` - Summary of new bookmarks

### 2. Fitness Department

**Purpose**: Track workouts and nutrition

```
/motus department create fitness
```

**Agents**:
- `workout-tracker` - Log workouts
- `nutrition-analyzer` - Track meals
- `progress-reporter` - Generate reports

**Workflows**:
- `daily-log` - Log today's activity
- `weekly-analysis` - Analyze progress

### 3. Learning Department

**Purpose**: Manage courses and study materials

```
/motus department create learning
```

**Agents**:
- `course-tracker` - Track progress
- `note-summarizer` - Summarize lectures
- `quiz-generator` - Create practice questions

**Workflows**:
- `study-session` - Review materials
- `progress-check` - Track completion

## Next Steps

After creating a department:

1. **[Create Agents](Creating-Agents.md)** - Add agents to your department
2. **[Create Workflows](Creating-Workflows.md)** - Build automation
3. **[Setup Integrations](Setup-Integrations.md)** - Connect services

---

**Previous**: [Concepts](Concepts.md) | **Next**: [Creating Agents →](Creating-Agents.md)
