# Contributing to Motus

Thank you for your interest in contributing to Motus! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [How to Add New Templates](#how-to-add-new-templates)
- [How to Add New Creator Agents](#how-to-add-new-creator-agents)

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Claude Code**: This framework is designed to work within Claude Code (claude.ai/code)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd motus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your API keys and credentials
   # See .env.example for all available configuration options
   ```

4. **Verify installation**
   ```bash
   # Run the test suite
   npm test

   # Test the CLI
   ./motus --version
   ```

### Project Structure

```
motus/
├── .claude/
│   ├── agents/              # Creator agents and department agents
│   └── commands/            # Command configurations
├── lib/                     # Core libraries
│   ├── template-engine.js   # Handlebars template rendering
│   ├── registry-manager.js  # Registry CRUD operations
│   ├── validator.js         # Validation system
│   ├── oauth-registry.js    # OAuth management
│   └── doc-generator.js     # Auto-documentation
├── templates/               # Handlebars templates (.hbs files)
│   ├── agent/              # Agent templates by type
│   ├── department/         # Department templates
│   ├── workflow/           # Workflow templates
│   ├── docs/               # Documentation templates
│   └── schemas/            # JSON schemas for validation
├── config/
│   └── registries/         # Central registry system
├── tests/                  # Test suites
├── oauth-manager/          # OAuth server
├── public-docs/            # User-facing documentation
├── org-docs/               # Auto-generated documentation
└── docs/                   # Technical documentation
```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests to ensure everything works
4. Commit your changes with clear messages
5. Push to your fork and submit a pull request

## Code Style Guidelines

### JavaScript

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes for strings, template literals for interpolation
- **Semicolons**: Always use semicolons
- **Line Length**: Aim for 80-100 characters, max 120
- **Naming Conventions**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes
  - `UPPER_SNAKE_CASE` for constants
  - `kebab-case` for file names and agent names

### Code Organization

```javascript
/**
 * Class description with JSDoc
 */
class ExampleClass {
  constructor() {
    this.property = value;
  }

  /**
   * Method description
   * @param {string} param - Parameter description
   * @returns {Object} Return value description
   */
  async methodName(param) {
    // Implementation
  }
}
```

### Best Practices

1. **Error Handling**: Always use try-catch for async operations
   ```javascript
   try {
     const result = await someOperation();
   } catch (error) {
     throw new Error(`Failed to perform operation: ${error.message}`);
   }
   ```

2. **Documentation**: Add JSDoc comments for all public methods and classes

3. **Modularity**: Keep functions focused and single-purpose

4. **Async/Await**: Prefer async/await over promises chains

5. **Validation**: Validate inputs early and provide clear error messages

### Template Conventions

- **File Extension**: Use `.hbs` for all Handlebars templates
- **Naming**: Match the output file type (e.g., `agent-name.md.hbs` for markdown)
- **Helpers**: Use provided Handlebars helpers (see `lib/template-engine.js:18-153`)
  - `kebabCase`, `camelCase`, `pascalCase` for case conversion
  - `capitalize`, `uppercase`, `lowercase` for text formatting
  - `join`, `ifNotEmpty` for array/object handling
  - `timestamp`, `formatDate` for dates

### Agent File Structure

Agent definition files (`.claude/agents/*.md`) must include:

```markdown
---
name: agent-name
description: Clear description of agent purpose
tools: Tool1, Tool2, Tool3
model: sonnet
color: blue
---

Agent content here...
```

## Pull Request Process

### Before Submitting

1. **Run Tests**: Ensure all tests pass
   ```bash
   npm test
   ```

2. **Update Documentation**: Update relevant docs if you've:
   - Added new features
   - Changed APIs or interfaces
   - Added new templates or creator agents
   - Modified configuration options

3. **Check Code Style**: Ensure your code follows the style guidelines

4. **Test Manually**: Test your changes in a real Claude Code environment

### PR Guidelines

1. **Title Format**: Use clear, descriptive titles
   - `feat: Add new template for workflow triggers`
   - `fix: Resolve registry validation error`
   - `docs: Update CONTRIBUTING.md with testing guide`
   - `refactor: Improve template engine performance`

2. **Description**: Include:
   - What changes were made
   - Why the changes were necessary
   - Any breaking changes
   - Testing steps
   - Related issues/PRs

3. **Commit Messages**:
   - Use conventional commit format
   - Be descriptive but concise
   - Reference issues when applicable

   ```
   feat: Add specialist agent template

   - Created new template for specialist agents
   - Added validation for specialist-specific fields
   - Updated registry manager to handle specialist type

   Closes #123
   ```

### Review Process

1. PRs require at least one approving review
2. All CI checks must pass
3. Address reviewer feedback promptly
4. Keep PRs focused and reasonably sized
5. Squash commits before merging (if requested)

## Testing Requirements

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
node tests/test-template-engine.js
node tests/test-phase2-components.js
node tests/test-phase3-integration.js
```

### Test Coverage

All new features should include tests that cover:

1. **Happy Path**: Normal, expected usage
2. **Edge Cases**: Boundary conditions
3. **Error Handling**: Invalid inputs, missing data
4. **Integration**: How it works with existing components

### Writing Tests

Follow the existing test patterns in `tests/`:

```javascript
#!/usr/bin/env node

/**
 * Test Description
 */

const ComponentToTest = require('../lib/component');

async function testComponent() {
  console.log('🧪 Testing Component\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Feature Name
  console.log('Test 1: Feature Name');
  try {
    // Setup
    const instance = new ComponentToTest();

    // Execute
    const result = await instance.method();

    // Verify
    if (result.includes('expected')) {
      console.log('✅ Test passed\n');
      results.passed++;
      results.tests.push({ name: 'Feature Name', status: 'passed' });
    } else {
      throw new Error('Unexpected result');
    }
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}\n`);
    results.failed++;
    results.tests.push({ name: 'Feature Name', status: 'failed', error: error.message });
  }

  // Summary
  console.log('='.repeat(50));
  console.log('Test Summary');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);

  process.exit(results.failed > 0 ? 1 : 0);
}

testComponent().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
```

### Test Requirements by Component Type

**Templates**: Test rendering with sample context data
- Verify all placeholders are filled
- Check conditional logic works correctly
- Validate output structure

**Libraries**: Test all public methods
- Constructor initialization
- Method inputs/outputs
- Error conditions
- Edge cases

**Creator Agents**: Integration testing
- Verify file generation
- Check registry updates
- Validate documentation updates

## How to Add New Templates

Templates are Handlebars files that generate agent definitions, workflows, and documentation. Here's how to add new templates:

### Step 1: Choose Template Type and Location

Templates are organized by type:
- `templates/agent/` - Agent definition templates
- `templates/department/` - Department templates
- `templates/workflow/` - Workflow configuration templates
- `templates/docs/` - Documentation templates
- `templates/schemas/` - JSON schemas for validation

### Step 2: Create Template File

Create a new `.hbs` file in the appropriate directory:

```bash
# Example: New agent type template
touch templates/agent/new-agent-type.md.hbs
```

### Step 3: Write Template

Use Handlebars syntax with available helpers:

```handlebars
---
name: {{kebabCase name}}
description: {{description}}
tools: {{join tools ", "}}
model: {{model}}
color: {{color}}
---

# {{capitalize name}} Agent

{{description}}

## Responsibilities

{{#each responsibilities}}
### {{this.title}}
{{#each this.tasks}}
- {{this}}
{{/each}}
{{/each}}

## Usage

Execute this agent with:
```bash
/motus {{department}} {{kebabCase name}}
```

Created: {{timestamp}}
```

### Step 4: Create Schema (Optional)

Add validation schema in `templates/schemas/`:

```json
{
  "required": ["name", "description", "department"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "minLength": 3
    },
    "description": {
      "type": "string",
      "minLength": 10
    },
    "department": {
      "type": "string"
    },
    "tools": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

Save as `templates/schemas/agent-schema.json` or `templates/schemas/[type]-schema.json`.

### Step 5: Test Template

Create a test case in `tests/test-template-engine.js`:

```javascript
console.log('Test N: New Template');
try {
  const context = {
    name: 'test-agent',
    description: 'Test agent for validation',
    department: 'test',
    tools: ['Bash', 'Read'],
    model: 'sonnet',
    color: 'blue'
  };

  const rendered = await engine.render('agent/new-agent-type.md', context);

  if (rendered.includes('test-agent') && rendered.includes('Test agent')) {
    console.log('✅ New template renders correctly\n');
    results.passed++;
  } else {
    throw new Error('Template output missing expected content');
  }
} catch (error) {
  console.log(`❌ New template failed: ${error.message}\n`);
  results.failed++;
}
```

### Step 6: Update Creator Agents

If the template should be used by creator agents, update the relevant agent definition in `.claude/agents/`:

```markdown
### 2. Generate Definition File
```bash
node -e "
const TemplateEngine = require('./lib/template-engine');
const engine = new TemplateEngine();
const context = { ... };

engine.renderToFile(
  'agent/new-agent-type.md',  // Your new template
  context,
  outputPath
);
"
```
```

### Available Handlebars Helpers

Reference `lib/template-engine.js:18-153` for all helpers:

- **Case Conversion**: `kebabCase`, `camelCase`, `pascalCase`
- **String Manipulation**: `capitalize`, `uppercase`, `lowercase`, `indent`
- **Arrays**: `join`, `contains`
- **Conditionals**: `eq`, `ifNotEmpty`
- **Dates**: `timestamp`, `formatDate`
- **Custom**: `agentList`, `toolsList`, `frontmatter`, `commentHeader`

## How to Add New Creator Agents

Creator agents are specialized agents that help users create departments, agents, and workflows. They follow a specific pattern.

### Step 1: Understand Creator Agent Types

There are four main creator agents (see `.claude/agents/`):

1. **department-creator** - Creates new departments
2. **agent-creator** - Creates agents within departments
3. **workflow-creator** - Creates workflows
4. **documentation-updater** - Regenerates documentation

New creator agents should follow similar patterns.

### Step 2: Define Agent Purpose

Creator agents should:
- Guide users through interactive wizards
- Validate inputs before generation
- Use templates to generate files
- Update registries
- Trigger documentation updates
- Provide clear success/error messages

### Step 3: Create Agent Definition

Create a new file in `.claude/agents/`:

```markdown
---
name: my-creator
description: Interactive wizard for creating [something]. Use when user runs '/motus [command]'.
tools: Task, Read, Write, Edit, Bash
model: sonnet
color: purple
---

You are the [Name] Creator Agent. Your role is to guide users through creating [something] through an interactive wizard.

## Primary Responsibility

Create a complete [thing] including:
1. [Output file 1]
2. [Output file 2]
3. Update registries
4. Regenerate documentation

## Interactive Wizard Process

### Step 1: Validate Prerequisites
```
Received: [input parameters]

Validate:
1. [Check 1] (check source)
   → If not: "Error message and suggestion"

2. [Check 2]:
   - [Validation rule 1]
   - [Validation rule 2]
   - [Validation rule 3]

If invalid: explain error and suggest correction
If valid: proceed to Step 2
```

### Step 2: Gather Information
```
Ask: "Question about what to create?"

Expected: Clear description (validation rules)

Examples:
- "Example 1"
- "Example 2"

Process response and validate...
```

### Step 3: [Next Step]
...

## Generation Process

### 1. Prepare Context
```javascript
const context = {
  name: "example",
  description: "Description",
  // All required template variables
};
```

### 2. Generate Files
```bash
node -e "
const TemplateEngine = require('./lib/template-engine');
const engine = new TemplateEngine();

engine.renderToFile(
  'type/template-name',
  context,
  outputPath
).then(() => console.log('✓ Created file'));
"
```

### 3. Update Registries
```bash
node -e "
const RegistryManager = require('./lib/registry-manager');
const registry = new RegistryManager();

registry.addThing({
  // Registry data
}).then(() => console.log('✓ Registry updated'));
"
```

### 4. Trigger Documentation Update
```bash
Task(documentation-updater, prompt: "Thing created, regenerate documentation")
```

## Output to User

```
✅ [Thing] Created Successfully!

📊 Generated Files:
  ✓ file1.md
  ✓ file2.js

🔧 Next Steps:
1. Step one
2. Step two
```

## Intelligence Features

1. **Feature 1**: Description
2. **Feature 2**: Description

## Error Handling

Common errors and solutions:
- **Error type** → Solution
- **Error type** → Solution

## Validation Rules

Before generation:
- ✅ Check 1
- ✅ Check 2
- ✅ Check 3

## Example Interactions

### Example 1: [Scenario]
```
User: command

You: question

User: answer

[... wizard flow ...]

You: [Output]
```

## Notes

- **Always validate inputs** before generation
- **Use Task tool** to delegate to other agents
- **Generate working code** that can be used immediately
- **Be conversational but efficient**
- **Provide clear feedback** at each step
```

### Step 4: Test Creator Agent

Test the agent by:

1. **Manual Testing**: Use it within Claude Code
   ```
   User message that triggers the agent
   ```

2. **Verify Outputs**: Check that all files are created correctly

3. **Validate Registry Updates**: Ensure registries are updated

4. **Check Documentation**: Verify auto-generated docs are correct

### Step 5: Register Agent

Update `config/registries/agents.json`:

```json
{
  "creator-agents": {
    "agents": [
      {
        "name": "my-creator",
        "description": "Creates [something]",
        "type": "creator",
        "tools": ["Task", "Read", "Write", "Edit", "Bash"],
        "triggers": ["/motus [command]"]
      }
    ]
  }
}
```

### Step 6: Update Documentation

Run the documentation updater:

```bash
/motus docs update
```

Or trigger it programmatically from your creator agent using the Task tool.

### Best Practices for Creator Agents

1. **Interactive Wizards**: Guide users step-by-step with clear questions
2. **Auto-Detection**: Analyze inputs to suggest defaults (like agent-creator's type detection)
3. **Validation First**: Validate all inputs before generating anything
4. **Atomic Operations**: If generation fails, rollback changes
5. **Clear Output**: Show exactly what was created and what to do next
6. **Error Messages**: Provide actionable error messages with suggestions
7. **Template Usage**: Always use templates for file generation (don't hardcode)
8. **Registry Updates**: Always update registries for tracking
9. **Documentation**: Trigger documentation-updater at the end
10. **Testing**: Provide example interactions in the agent definition

### Required Creator Agent Sections

All creator agents must include:

- ✅ Primary Responsibility
- ✅ Interactive Wizard Process (step-by-step)
- ✅ Generation Process (with code examples)
- ✅ Output to User (success message format)
- ✅ Error Handling (common errors and solutions)
- ✅ Validation Rules (what to check before generation)
- ✅ Example Interactions (at least one complete flow)

---

## Getting Help

- **Documentation**: See `/public-docs` for user guides
- **Technical Docs**: See `/docs` for architecture details
- **Issues**: Check existing issues or create a new one
- **Questions**: Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

Thank you for contributing to Motus!
