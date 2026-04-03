# Motus Examples

Complete, working examples demonstrating different automation patterns with Motus. Each example includes agent definitions, workflow configs, and implementation scripts.

## Examples by Category

### Data & Reporting

| Example | Description | Agents | Pattern |
|---------|-------------|--------|---------|
| [daily-briefing](daily-briefing/) | Weather + calendar + tasks compiled into a morning briefing | 3 | Parallel fetch, sequential compile |
| [data-pipeline](data-pipeline/) | ETL pipeline: extract CSV, clean/enrich, validate, load | 4 | Parallel transform, sequential validate |
| [research-assistant](research-assistant/) | Multi-source research with quality evaluation | 3 | Parallel gather, sequential evaluate |

### DevOps & CI/CD

| Example | Description | Agents | Pattern |
|---------|-------------|--------|---------|
| [ci-pipeline](ci-pipeline/) | Lint + test (parallel), coverage report, deploy notification | 4 | Mixed parallel/sequential |
| [devops-monitoring](devops-monitoring/) | Uptime + log analysis pipeline with alerting | 3 | Parallel monitor, sequential alert |
| [release-manager](release-manager/) | Test, validate changelog, bump version, generate notes | 4 | Sequential gates |

### Content & Communication

| Example | Description | Agents | Pattern |
|---------|-------------|--------|---------|
| [content-pipeline](content-pipeline/) | Research, write, and review articles | 3 | Sequential pipeline |
| [meeting-notes](meeting-notes/) | Transcript to actions, decisions, summary, follow-ups | 4 | Sequential extraction |
| [notification-router](notification-router/) | Classify alerts, resolve channels, format, dispatch | 4 | Sequential routing |

### Operations

| Example | Description | Agents | Pattern |
|---------|-------------|--------|---------|
| [code-review](code-review/) | PR diff collection, parallel security/style/logic analysis | 4 | Parallel analysis |
| [customer-support](customer-support/) | Ticket triage with sentiment, category, priority analysis | 3 | Sequential classification |
| [onboarding-automation](onboarding-automation/) | New hire docs + accounts (parallel), training, welcome | 4 | Event-triggered, mixed |

### Library Usage

| Example | Description |
|---------|-------------|
| [programmatic-usage](programmatic-usage/) | Use Motus as a Node.js library — create departments, agents, workflows from code |

## Common Patterns

- **Parallel fetch, sequential compile**: Multiple data-fetchers run simultaneously, then a specialist compiles the results (daily-briefing, data-pipeline)
- **Sequential pipeline**: Each step feeds into the next (content-pipeline, release-manager)
- **Parallel analysis**: One input analyzed by multiple specialists in parallel (code-review)
- **Event-triggered**: Workflow fires on an external event, not a schedule (onboarding-automation)

## Getting Started

1. Pick an example that matches your use case
2. Copy the example directory into your Motus `departments/` folder
3. Edit the agent `.md` files to add your specific logic and API keys
4. Run the workflow: `/motus [department] [workflow-name]`

See the [main README](../README.md) for full setup instructions.
