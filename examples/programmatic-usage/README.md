# Programmatic Usage Example

Use Motus as a Node.js library to create departments, agents, and workflows from your own scripts.

## Run

```bash
cd examples/programmatic-usage
node setup-department.js
```

## What it does

1. Creates a `devops` department with monitoring responsibilities
2. Adds three agents: a data-fetcher, a specialist, and an orchestrator
3. Registers a workflow combining all three agents
4. Searches the registry and prints statistics
5. Exports the full registry as JSON

## Output

The script creates files under a temporary directory (cleaned up on exit) so it does not modify your real Motus installation.
