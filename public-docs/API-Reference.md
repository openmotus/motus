# API Reference

Developer reference for building custom agents and extending Motus.

## Core Libraries

### TemplateEngine

Renders Handlebars templates for agent and workflow creation.

**Location**: `lib/template-engine.js`

**Usage**:
```javascript
const TemplateEngine = require('./lib/template-engine');
const engine = new TemplateEngine('/path/to/templates');

// Render template
const output = await engine.render('agent/data-fetcher-agent.md', {
  name: 'weather-fetcher',
  description: 'Fetches weather data'
});

// Render to file
await engine.renderToFile(
  'agent/data-fetcher-agent.md',
  context,
  '/path/to/output.md'
);
```

**Methods**:

- `render(templatePath, context)` - Render template to string
- `renderToFile(templatePath, context, outputPath)` - Render to file
- `validate(context, schema)` - Validate context against schema

**Helpers**:
- `{{lowercase text}}` - Convert to lowercase
- `{{uppercase text}}` - Convert to uppercase
- `{{capitalize text}}` - Capitalize first letter
- `{{kebabCase text}}` - Convert to kebab-case
- `{{camelCase text}}` - Convert to camelCase
- `{{eq a b}}` - Equality check
- `{{join array separator}}` - Join array
- Plus 20+ more helpers

### RegistryManager

Manages departments, agents, and workflows in registry files.

**Location**: `lib/registry-manager.js`

**Usage**:
```javascript
const RegistryManager = require('./lib/registry-manager');
const registry = new RegistryManager('/project/path');

// Add department
await registry.addDepartment({
  name: 'marketing',
  displayName: 'Marketing',
  description: 'Marketing automation',
  integrations: ['twitter', 'facebook']
});

// Add agent
await registry.addAgent({
  name: 'trend-analyzer',
  displayName: 'Trend Analyzer',
  department: 'marketing',
  type: 'data-fetcher',
  description: 'Analyzes trending topics',
  integrations: ['twitter'],
  tools: ['Bash', 'Read'],
  model: 'claude-sonnet-4'
});

// Add workflow
await registry.addWorkflow({
  name: 'social-analytics',
  displayName: 'Social Analytics',
  department: 'marketing',
  type: 'scheduled',
  schedule: '0 9 * * *',
  agents: ['trend-analyzer', 'report-creator'],
  executionPattern: 'sequential'
});
```

**Methods**:

**Departments**:
- `addDepartment(data)` - Add new department
- `getDepartment(name)` - Get department
- `listDepartments()` - List all departments
- `updateDepartment(name, updates)` - Update department
- `deleteDepartment(name)` - Delete department

**Agents**:
- `addAgent(data)` - Add new agent
- `getAgent(name)` - Get agent
- `listAgents(department)` - List agents in department
- `updateAgent(name, updates)` - Update agent
- `deleteAgent(name)` - Delete agent

**Workflows**:
- `addWorkflow(data)` - Add new workflow
- `getWorkflow(name)` - Get workflow
- `listWorkflows(department)` - List workflows
- `updateWorkflow(name, updates)` - Update workflow
- `deleteWorkflow(name)` - Delete workflow

**Utilities**:
- `save()` - Save registries to disk
- `load()` - Load registries from disk
- `validateFiles()` - Check registry-file sync

### Validator

Validates names, types, and data structures.

**Location**: `lib/validator.js`

**Usage**:
```javascript
const Validator = require('./lib/validator');

// Validate name
Validator.validateName('my-agent'); // ✓
Validator.validateName('My Agent'); // ✗ (spaces not allowed)

// Detect agent type
const type = Validator.detectAgentType('weather-fetcher'); // 'data-fetcher'

// Validate schema
const valid = Validator.validateSchema(data, {
  name: 'string',
  type: ['data-fetcher', 'orchestrator', 'specialist']
});
```

**Methods**:
- `validateName(name)` - Check name is valid
- `validateType(type)` - Check type is valid
- `validateSchema(data, schema)` - Validate data structure
- `detectAgentType(name)` - Auto-detect agent type from name
- `detectContext(name)` - Determine department context

### DocGenerator

Generates documentation from registries.

**Location**: `lib/doc-generator.js`

**Usage**:
```javascript
const DocGenerator = require('./lib/doc-generator');
const generator = new DocGenerator(registryManager);

// Generate department docs
await generator.generateDepartmentDocs('marketing');

// Generate command reference
await generator.generateCommandReference();

// Generate integration docs
const docs = generator.generateIntegrationDocs(integration, 'marketing');
```

**Methods**:
- `generateDepartmentDocs(department)` - Create department docs
- `generateCommandReference()` - Create master command list
- `generateIntegrationDocs(integration, dept)` - Create setup instructions
- `updateCLAUDEmd()` - Update CLAUDE.md with latest info

## Agent Development

### Agent Structure

**Definition File** (`.claude/agents/agent-name.md`):
```markdown
---
subagent_type: data-fetcher
description: Short description
tools: Bash, Read
model: claude-sonnet-4
---

Instructions for the agent...

Use the Bash tool to execute:
path/to/script.js

Return the results in this format:
{
  "data": ...,
  "timestamp": ...
}
```

**Implementation Script** (for data-fetchers):
```javascript
#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

async function fetchData() {
  try {
    const response = await axios.get(API_ENDPOINT, {
      headers: { Authorization: `Bearer ${process.env.API_KEY}` }
    });
    
    const data = {
      results: response.data,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchData();
```

### Agent Types

**Data Fetcher**:
- Purpose: Fetch data from APIs
- Has implementation script
- Returns JSON data
- Tools: Bash, Read

**Specialist**:
- Purpose: Analysis, transformation, creation
- No implementation script
- Uses Claude Code tools
- Tools: Read, Write, Edit, Task

**Orchestrator**:
- Purpose: Coordinate other agents
- Manages workflow execution
- Uses Task tool
- Tools: Task, Read, Write

### Creating Custom Agent

**Step 1**: Design agent
- What does it do?
- What data does it need?
- What does it output?

**Step 2**: Choose type
- API calls? → Data Fetcher
- Analysis/content? → Specialist  
- Coordination? → Orchestrator

**Step 3**: Create agent
```
/motus <dept> agent create <name>
```

**Step 4**: Implement script (if data-fetcher)
Edit generated script in `<dept>/agents/<name>.js`

**Step 5**: Test agent
```
/motus <dept> test-agent <name>
```

### API Integration Template

```javascript
#!/usr/bin/env node

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE = 'https://api.example.com';
const API_KEY = process.env.YOUR_API_KEY;

async function fetchFromAPI() {
  try {
    // Validate environment
    if (!API_KEY) {
      throw new Error('API_KEY not set in environment');
    }

    // Make API request
    const response = await axios.get(`${API_BASE}/endpoint`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        // Query parameters
      }
    });

    // Process response
    const data = {
      status: 'success',
      results: response.data,
      count: response.data.length,
      timestamp: new Date().toISOString()
    };

    // Output JSON
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    // Error handling
    const errorData = {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
    console.error(JSON.stringify(errorData, null, 2));
    process.exit(1);
  }
}

// Execute
fetchFromAPI();
```

## Workflow Development

### Workflow Definition Template

```markdown
---
name: workflow-name
description: What this workflow does
department: dept-name
type: manual | scheduled
schedule: 0 9 * * * (if scheduled)
---

Execute the workflow:

1. Invoke agent-1 to fetch data
2. Wait for results from agent-1
3. Invoke agent-2 with data from agent-1
4. Create final output
5. Return summary
```

### Parallel Execution Pattern

```markdown
Execute agents in parallel:

1. Invoke agent-1, agent-2, agent-3 simultaneously
2. Wait for all agents to complete
3. Compile all results
4. Create combined output
```

### Sequential Execution Pattern

```markdown
Execute agents sequentially:

1. Invoke agent-1, wait for completion
2. Pass agent-1 results to agent-2, wait for completion
3. Pass agent-2 results to agent-3, wait for completion
4. Create final output with all data
```

## Registry File Formats

### departments.json

```json
{
  "marketing": {
    "name": "marketing",
    "displayName": "Marketing",
    "description": "Marketing automation and analytics",
    "integrations": ["twitter", "facebook", "linkedin"],
    "created": "2025-10-08T10:00:00.000Z",
    "agentCount": 5,
    "workflowCount": 3
  }
}
```

### agents.json

```json
{
  "agents": {
    "trend-analyzer": {
      "name": "trend-analyzer",
      "displayName": "Trend Analyzer",
      "department": "marketing",
      "type": "data-fetcher",
      "description": "Analyzes trending topics on Twitter",
      "integrations": ["twitter"],
      "tools": ["Bash", "Read"],
      "model": "claude-sonnet-4",
      "script": "marketing/agents/trend-analyzer.js",
      "created": "2025-10-08T10:00:00.000Z"
    }
  }
}
```

### workflows.json

```json
{
  "social-analytics": {
    "name": "social-analytics",
    "displayName": "Social Media Analytics",
    "department": "marketing",
    "type": "scheduled",
    "schedule": "0 9 * * *",
    "description": "Daily social media performance report",
    "agents": ["trend-analyzer", "social-fetcher", "report-creator"],
    "executionPattern": "sequential",
    "output": "/marketing/reports/social-YYYY-MM-DD.md",
    "created": "2025-10-08T10:00:00.000Z",
    "lastRun": "2025-10-08T09:00:00.000Z",
    "runCount": 45
  }
}
```

## Environment Variables

### Required for Core

```bash
TIMEZONE=America/Los_Angeles        # Your timezone
```

### Integration Variables

```bash
# Weather
WEATHER_API_KEY=your_key

# Google
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/oauth/google/callback

# Notion
NOTION_API_KEY=secret_your_key
NOTION_DATABASE_ID=database_id

# Oura
OURA_ACCESS_TOKEN=your_token

# Social Media
TWITTER_BEARER_TOKEN=your_token
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
FACEBOOK_APP_ID=your_id
FACEBOOK_APP_SECRET=your_secret
```

## Error Handling

### In Agent Scripts

```javascript
try {
  const data = await fetchData();
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  const errorResponse = {
    status: 'error',
    message: error.message,
    code: error.code,
    timestamp: new Date().toISOString()
  };
  console.error(JSON.stringify(errorResponse, null, 2));
  process.exit(1);
}
```

### In Agent Definitions

```markdown
If the script fails:
1. Log the error message
2. Return partial results if available
3. Suggest fallback action to user
```

## Testing

### Test Agent

Run the agent directly in Claude Code:
```
/motus <dept> <agent-name>
```

Or execute the implementation script manually:
```bash
node departments/<dept>/agents/<agent-name>.js
```

### Test Workflow

Run the workflow and verify output:
```
/motus <dept> <workflow-name>
```

### Test Integration

Run an agent that uses the integration to verify connectivity.

## Next Steps

- **[Examples](Examples.md)** - See real implementations
- **[Contributing](Contributing.md)** - Contribute to Motus
- **[FAQ](FAQ.md)** - Common questions

---

**Previous**: [Examples ←](Examples.md) | **Next**: [Contributing →](Contributing.md)
