# API Reference

Complete reference for the Motus library API. All modules are exported from `index.js` for programmatic use.

```javascript
const { RegistryManager, TemplateEngine, Validator, DocGenerator, OAuthRegistry } = require('./index');
```

## RegistryManager

Central registry for departments, agents, and workflows. Persists data as JSON files in `config/registries/`.

**Location**: `lib/registry-manager.js`

```javascript
const registry = new RegistryManager('/path/to/motus');
await registry.load();  // Required before any operations
```

### Lifecycle

| Method | Description |
|--------|-------------|
| `load()` | Load registries from disk. Creates directory if missing. **Must be called first.** |
| `save()` | Persist all registries to disk. Called automatically after mutations. |
| `reset()` | Clear all in-memory data (does not delete files). |
| `ensureLoaded()` | Throws if `load()` hasn't been called yet. |

### Departments

| Method | Returns | Description |
|--------|---------|-------------|
| `addDepartment(data)` | `Department` | Create a department. Validates name (kebab-case), generates admin agent file. |
| `getDepartment(name)` | `Department \| null` | Look up a department by name. |
| `updateDepartment(name, updates)` | `Department` | Merge updates into a department. Cannot rename. |
| `listDepartments(filters?)` | `Department[]` | List departments, optionally filtered by `{ status }`. |
| `departmentExists(name)` | `boolean` | Check if a department exists. |
| `getDepartmentSummary(name)` | `DepartmentSummary` | Full summary: agents, workflows, type breakdowns, integration count. |
| `removeDepartment(name, opts?)` | `RemoveResult` | Remove a department. Cascade-deletes agents/workflows by default. Pass `{ cascade: false }` to block if children exist. |

```javascript
// Create a department
await registry.addDepartment({
  name: 'analytics',
  displayName: 'Analytics',
  description: 'Data analysis and reporting pipelines'
});

// Get a summary with agent breakdown
const summary = await registry.getDepartmentSummary('analytics');
console.log(`${summary.agents.length} agents, ${summary.workflows.length} workflows`);

// Remove a department and all its agents/workflows
const { department, removedAgents, removedWorkflows } = await registry.removeDepartment('analytics');
console.log(`Removed ${removedAgents.length} agents, ${removedWorkflows.length} workflows`);
console.log(`By type: ${summary.agentsByType['data-fetcher']} fetchers`);
```

### Agents

| Method | Returns | Description |
|--------|---------|-------------|
| `addAgent(data)` | `Agent` | Register a new agent. Validates name and type. |
| `getAgent(name)` | `Agent \| null` | Look up an agent by name. |
| `updateAgent(name, updates)` | `Agent` | Merge updates into an agent. Cannot rename. |
| `listAgents(filters?)` | `Agent[]` | List agents, optionally filtered by `{ department, type }`. |
| `listAgentsByDepartment(dept)` | `Agent[]` | List agents in a specific department. |
| `agentExists(name)` | `boolean` | Check if an agent exists. |
| `removeAgent(name)` | `RemoveResult` | Remove an agent. Cleans up department lists and workflow references. |

```javascript
await registry.addAgent({
  name: 'metrics-collector',
  displayName: 'Metrics Collector',
  department: 'analytics',
  type: 'data-fetcher',          // 'data-fetcher' | 'orchestrator' | 'specialist'
  description: 'Collects metrics from monitoring APIs',
  tools: ['Bash', 'Read'],
  model: 'claude-sonnet-4'
});
```

### Workflows

| Method | Returns | Description |
|--------|---------|-------------|
| `addWorkflow(data)` | `Workflow` | Register a new workflow. Warns if agents don't exist yet. |
| `getWorkflow(dept, name)` | `Workflow \| null` | Look up a workflow by department and name. |
| `updateWorkflow(dept, name, updates)` | `Workflow` | Merge updates into a workflow. Cannot rename. |
| `listWorkflows(filters?)` | `Workflow[]` | List workflows, optionally filtered by `{ department }`. |
| `listWorkflowsByDepartment(dept)` | `Workflow[]` | List workflows in a specific department. |
| `getWorkflowsByAgent(agentName)` | `Workflow[]` | Find all workflows that use a given agent. |
| `workflowExists(dept, name)` | `boolean` | Check if a workflow exists. |
| `removeWorkflow(dept, name)` | `RemoveResult` | Remove a workflow. Cleans up department lists and agent usage tracking. |

```javascript
await registry.addWorkflow({
  name: 'daily-report',
  displayName: 'Daily Report',
  department: 'analytics',
  description: 'Generates daily analytics report',
  agents: ['metrics-collector', 'report-writer'],
  trigger: { type: 'scheduled', schedule: '0 9 * * *' },
  output: { type: 'file', path: 'reports/' }
});

// Find workflows that depend on an agent
const workflows = await registry.getWorkflowsByAgent('metrics-collector');
```

### Workflow Run Tracking & Health

| Method | Returns | Description |
|--------|---------|-------------|
| `recordWorkflowRun(dept, name, result?)` | `Workflow` | Record a workflow execution. Tracks `lastRun`, `runCount`, `successRate`, and optionally `lastDurationMs`/`lastError`. |
| `getWorkflowHealth(filters?)` | `WorkflowHealthResult` | Analyze workflow health across all or filtered workflows. Returns per-workflow status (`healthy`, `degraded`, `failing`, `idle`) and summary counts. |

```javascript
// Record workflow executions
await registry.recordWorkflowRun('analytics', 'daily-report', { success: true, durationMs: 4500 });
await registry.recordWorkflowRun('analytics', 'daily-report', { success: false, error: 'API timeout' });

// Check health across all workflows
const health = await registry.getWorkflowHealth();
console.log(`${health.summary.healthy} healthy, ${health.summary.failing} failing`);

// Filter by department
const deptHealth = await registry.getWorkflowHealth({ department: 'analytics' });

// Filter by status — find all failing workflows
const failing = await registry.getWorkflowHealth({ status: 'failing' });
failing.workflows.forEach(w => console.log(`${w.name}: ${w.lastError}`));
```

**Health status grades:**
- `healthy` — success rate >= 90% and ran within the last 7 days
- `degraded` — success rate 50-90%, or no runs in 7+ days
- `failing` — success rate below 50%
- `idle` — never been run

### Agent Usage Analytics

| Method | Returns | Description |
|--------|---------|-------------|
| `getAgentUsage(filters?)` | `AgentUsageResult` | Analyze agent usage across workflows. Returns per-agent usage level (`unused`, `low`, `medium`, `high`), workflow count, and back-references. Summary includes `byType` and `byDepartment` breakdowns. |

```javascript
// Overview — spot unused agents and bottlenecks
const usage = await registry.getAgentUsage();
console.log(`${usage.summary.unused} unused, ${usage.summary.high} overused`);

// Agents nobody uses — removal candidates
const dead = await registry.getAgentUsage({ usage: 'unused' });
dead.agents.forEach(a => console.log(`  ${a.department}/${a.name}`));

// Which workflows use a given agent
const withRefs = await registry.getAgentUsage({ department: 'analytics' });
withRefs.agents.forEach(a => {
  console.log(`${a.name} (${a.usage}) — used by:`);
  a.workflows.forEach(w => console.log(`  - ${w.department}/${w.name}`));
});

// Filter by type — unused data-fetchers only
const unusedFetchers = await registry.getAgentUsage({
  type: 'data-fetcher',
  usage: 'unused'
});
```

**Usage levels:**
- `unused` — not referenced by any workflow (safe to remove)
- `low` — referenced by exactly 1 workflow
- `medium` — referenced by 2–4 workflows
- `high` — referenced by 5+ workflows (potential bottleneck)

The lookup uses the live `workflow.agents` field as the source of truth, so drifted `usedInWorkflows` references cannot mask a truly unused agent.

### Search & Query

| Method | Returns | Description |
|--------|---------|-------------|
| `search(query)` | `SearchResults` | Full-text search across departments, agents, and workflows. |
| `getStatistics()` | `Statistics` | System-wide counts, type breakdowns, department sizes. |
| `validate()` | `ValidationReport` | Check registry integrity: cross-references, metadata counters. |
| `validateFiles()` | `FileValidation` | Verify registry JSON files are valid and in sync. |

```javascript
// Search across everything
const results = await registry.search('metrics');
console.log(`${results.agents.length} agents, ${results.workflows.length} workflows`);

// System overview
const stats = await registry.getStatistics();
console.log(`${stats.agents.total} agents across ${stats.departments.total} departments`);
```

### Import/Export

| Method | Returns | Description |
|--------|---------|-------------|
| `export()` | `object` | Export all registries as a single JSON-serializable object. |
| `import(data)` | `void` | Import registries from an exported object. Validates structure. |
| `exportMermaid(options?)` | `string` | Render the registry as a [Mermaid](https://mermaid.js.org/) flowchart. |

```javascript
// Backup
const backup = await registry.export();
fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));

// Restore
const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'));
await registry.import(data);

// Visualize — Mermaid flowchart with each department in its own subgraph,
// agents as nodes, workflows as ovals, and agent→workflow edges
const diagram = await registry.exportMermaid({
  direction: 'LR',
  title: 'My AI Org'
});
fs.writeFileSync('org-chart.mmd', diagram);
```

**`exportMermaid()` options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `direction` | `'TD' \| 'TB' \| 'BT' \| 'LR' \| 'RL'` | `'LR'` | Flowchart layout direction. |
| `department` | `string` | _(all)_ | Restrict diagram to one department. Suppresses the Orphans subgraph. |
| `includeAgents` | `boolean` | `true` | Render agent nodes (and edges into workflows). |
| `includeWorkflows` | `boolean` | `true` | Render workflow nodes (and incoming edges from agents). |
| `includeOrphans` | `boolean` | `true` | Surface agents/workflows whose declared department doesn't exist under a "⚠️ Orphans" subgraph. |
| `title` | `string` | _(none)_ | Optional Mermaid front-matter title rendered above the flowchart. |

Node shapes/icons:

| Symbol | Meaning |
|--------|---------|
| 📥 | data-fetcher agent |
| 🎯 | orchestrator agent |
| 🛠️ | specialist agent |
| ⚡ | workflow |
| 📁 | department subgraph |
| ⚠️ | orphans subgraph |

---

## TemplateEngine

Handlebars-based template rendering with 21 custom helpers and template caching.

**Location**: `lib/template-engine.js`

```javascript
const engine = new TemplateEngine();  // Auto-resolves templates/ directory
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `render(templateName, context)` | `string` | Render a template with the given context. |
| `renderToFile(templateName, context, outputPath)` | `void` | Render a template and write to a file. |
| `loadTemplate(templateName)` | `Function` | Load and compile a template (cached). |
| `resolveTemplatePath(templateName)` | `string` | Resolve a template name to its file path. |
| `listTemplates(type?)` | `string[]` | List available templates, optionally filtered by type (`agent`, `workflow`, `docs`). |
| `validateContext(templateName, context)` | `ValidationResult` | Validate context against a template's JSON schema. |
| `clearCache()` | `void` | Clear the compiled template cache. |

```javascript
// Render a template
const output = await engine.render('agent/data-fetcher-agent.md', {
  name: 'weather-fetcher',
  description: 'Fetches weather data from WeatherAPI'
});

// Render directly to a file
await engine.renderToFile('agent/data-fetcher-agent.md', context, '/output/agent.md');

// List available agent templates
const templates = await engine.listTemplates('agent');
```

### Built-in Helpers

| Helper | Example | Output |
|--------|---------|--------|
| `kebabCase` | `{{kebabCase "My Agent"}}` | `my-agent` |
| `pascalCase` | `{{pascalCase "my-agent"}}` | `MyAgent` |
| `camelCase` | `{{camelCase "my-agent"}}` | `myAgent` |
| `capitalize` | `{{capitalize "hello"}}` | `Hello` |
| `lowercase` | `{{lowercase "HELLO"}}` | `hello` |
| `uppercase` | `{{uppercase "hello"}}` | `HELLO` |
| `timestamp` | `{{timestamp}}` | `2026-03-23T...` |
| `formatDate` | `{{formatDate createdAt}}` | ISO 8601 string |
| `join` | `{{join tools ", "}}` | `Bash, Read, Write` |
| `eq` | `{{#eq type "specialist"}}...{{/eq}}` | Conditional block |
| `contains` | `{{#contains tools "Bash"}}...{{/contains}}` | Conditional block |
| `pluralize` | `{{pluralize count "agent" "agents"}}` | `agent` or `agents` |
| `indent` | `{{indent text 4}}` | Indented text |
| `docComment` | `{{docComment "Description"}}` | JSDoc block |
| `agentList` | `{{agentList agents}}` | Bulleted agent list |
| `toolList` | `{{toolList tools}}` | Comma-separated tools |
| `envBlock` | `{{envBlock vars}}` | Environment variable block |
| `array` | `{{join (array "a" "b") ", "}}` | `a, b` |
| `ifNotEmpty` | `{{#ifNotEmpty list}}...{{/ifNotEmpty}}` | Conditional block |
| `json` | `{{json data}}` | Pretty-printed JSON |
| `default` | `{{default value "fallback"}}` | Value or fallback |

---

## Validator

Validates names, types, descriptions, schedules, URLs, and agent contexts. All methods are instance methods.

**Location**: `lib/validator.js`

```javascript
const validator = new Validator();
```

### Name Validation

| Method | Returns | Description |
|--------|---------|-------------|
| `validateDepartmentName(name)` | `{valid, errors}` | Check kebab-case, length 3-30. |
| `validateAgentName(name)` | `{valid, errors, suggestions}` | Check kebab-case, action-noun pattern. |
| `validateWorkflowName(name)` | `{valid, errors}` | Check kebab-case, length 3-50. |
| `validateEnvVarName(name)` | `{valid, errors}` | Check UPPER_SNAKE_CASE format. |

```javascript
const result = validator.validateAgentName('weather-fetcher');
// { valid: true, errors: [] }

const bad = validator.validateAgentName('My Agent');
// { valid: false, errors: ['Agent name must be in kebab-case...'], suggestions: ['my-agent'] }
```

### Content Validation

| Method | Returns | Description |
|--------|---------|-------------|
| `validateDescription(desc, min?, max?)` | `{valid, errors}` | Length and quality checks. |
| `validateUrl(url)` | `{valid, errors}` | HTTP/HTTPS URL format. |
| `validateSchedule(schedule)` | `{valid, errors}` | Cron expression or natural language schedule. |

### Detection & Suggestion

| Method | Returns | Description |
|--------|---------|-------------|
| `detectAgentType(description)` | `{type, confidence, scores}` | Detect agent type from description keywords. |
| `detectParallelExecution(desc)` | `{shouldBeParallel, actionCount, confidence}` | Detect if a step should run in parallel. |
| `suggestAgentName(name)` | `string[]` | Suggest kebab-case alternatives for an invalid name. |
| `suggestTools(agentType, needsApi?)` | `string[]` | Suggest tools based on agent type. |
| `suggestEnvVarName(dept, service)` | `string` | Generate an env var name from department and service. |

```javascript
const detection = validator.detectAgentType('Fetches weather data from an API endpoint');
// { type: 'data-fetcher', confidence: 0.8, scores: {...} }
```

### Context Validation

| Method | Returns | Description |
|--------|---------|-------------|
| `validateAgentContext(context)` | `{valid, errors}` | Validate a full agent creation context. |
| `validateDepartmentContext(context)` | `{valid, errors}` | Validate a full department creation context. |
| `validateWorkflowContext(context)` | `{valid, errors}` | Validate a full workflow creation context. |

---

## DocGenerator

Generates documentation from registry data.

**Location**: `lib/doc-generator.js`

```javascript
const generator = new DocGenerator('/path/to/motus');  // Optional basePath
await generator.generate();  // Generates all docs
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `generate()` | `void` | Generate all documentation (commands reference + department docs + CLAUDE.md stats). |
| `generateCommandsReference()` | `void` | Generate `COMMANDS_REFERENCE.md` with system overview. |
| `generateDepartmentDocs()` | `void` | Generate per-department documentation files. |
| `updateClaudeMd()` | `void` | Update CLAUDE.md statistics via `<!-- stats:start/end -->` markers. |

---

## OAuthRegistry

Manages OAuth2 service configurations for API integrations.

**Location**: `lib/oauth-registry.js`

```javascript
const oauth = new OAuthRegistry('/path/to/motus');
await oauth.load();
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `load()` | `void` | Parse OAuth configs from `oauth-manager/server.js`. |
| `addIntegration(integration)` | `void` | Add a new OAuth service configuration. |
| `generateEnvConfig(integrations)` | `string` | Generate `.env` template for required API keys. |

---

## TypeScript Support

Motus ships TypeScript definitions in `index.d.ts`. Key types:

```typescript
type AgentType = 'data-fetcher' | 'orchestrator' | 'specialist';
type TriggerType = 'manual' | 'scheduled' | 'event' | 'webhook' | 'cron' | (string & {});
type WorkflowHealthStatus = 'healthy' | 'degraded' | 'failing' | 'idle';
type AgentUsageLevel = 'unused' | 'low' | 'medium' | 'high';
type MermaidDirection = 'TD' | 'TB' | 'BT' | 'LR' | 'RL';

interface Department { name, displayName, description, agents, workflows, ... }
interface Agent { name, displayName, department, type, description, tools, ... }
interface Workflow { name, displayName, department, agents, trigger, steps, ... }
interface Statistics { departments: { total }, agents: { total, byType }, workflows: { total } }
interface SearchResults { departments: Department[], agents: Agent[], workflows: Workflow[] }
interface DepartmentSummary { department, agents, workflows, agentsByType, integrationCount }
interface WorkflowHealthResult { summary: { total, healthy, degraded, failing, idle }, workflows }
interface AgentUsageResult { summary: { total, unused, low, medium, high, byType, byDepartment }, agents }
interface MermaidExportOptions { direction?, department?, includeAgents?, includeWorkflows?, includeOrphans?, title? }
```

See `index.d.ts` for complete type definitions.

---

## Registry File Format

Registries are stored as JSON in `config/registries/`.

### departments.json

```json
{
  "departments": {
    "analytics": {
      "name": "analytics",
      "displayName": "Analytics",
      "description": "Data analysis and reporting",
      "created": "2026-01-15T10:00:00.000Z",
      "status": "active",
      "version": "1.0.0",
      "agents": ["metrics-collector", "report-writer"],
      "workflows": ["daily-report"],
      "integrations": [],
      "responsibilities": []
    }
  },
  "metadata": { "totalDepartments": 1, "lastUpdated": "..." }
}
```

### agents.json

```json
{
  "agents": {
    "metrics-collector": {
      "name": "metrics-collector",
      "displayName": "Metrics Collector",
      "department": "analytics",
      "type": "data-fetcher",
      "description": "Collects metrics from monitoring APIs",
      "tools": ["Bash", "Read"],
      "model": "claude-sonnet-4",
      "script": "analytics/agents/metrics-collector.js",
      "created": "2026-01-15T10:00:00.000Z",
      "version": "1.0.0",
      "usedInWorkflows": ["analytics/daily-report"]
    }
  },
  "metadata": { "totalAgents": 1, "lastUpdated": "..." }
}
```

### workflows.json

```json
{
  "workflows": {
    "analytics": {
      "daily-report": {
        "name": "daily-report",
        "displayName": "Daily Report",
        "department": "analytics",
        "description": "Generates daily analytics report",
        "orchestrator": "analytics-orchestrator",
        "agents": ["metrics-collector", "report-writer"],
        "trigger": { "type": "scheduled", "schedule": "0 9 * * *" },
        "output": { "type": "file", "path": "reports/" },
        "estimatedDuration": "5m",
        "created": "2026-01-15T10:00:00.000Z",
        "version": "1.0.0",
        "lastRun": null,
        "runCount": 0,
        "successRate": 0
      }
    }
  },
  "metadata": { "totalWorkflows": 1, "lastUpdated": "..." }
}
```

---

**Previous**: [Examples](Examples.md) | **Next**: [Contributing](Contributing.md)
