# Frequently Asked Questions

Common questions about Motus.

## General Questions

### What is Motus?

Motus is an AI-powered automation system that runs inside Claude Code CLI. It helps you automate your life and business by orchestrating specialized AI agents.

### Does Motus work outside Claude Code?

No, Motus is exclusively designed for Claude Code CLI. It uses Claude Code's unique features like the Task tool and agent system.

### Is Motus free?

Yes, Motus is open source (MIT license). Some integrations may require paid API keys (like OpenAI), but many free options exist (Weather API, Google, etc.).

### Do I need coding experience?

No! Motus uses interactive wizards for creating departments, agents, and workflows. You can build powerful automation without writing code.

Advanced users can write custom agents if desired.

## Installation & Setup

### What are the requirements?

- Claude Code CLI
- Node.js 18+
- Git (for installation)

### How do I install Motus?

```bash
git clone https://github.com/openmotus/motus.git
cd motus
npm install
cp .env.example .env
```

Then in Claude Code, navigate to the motus directory and run:
```
/motus help
```

### Do I need all the integrations?

No! Only configure the integrations you want to use. Motus works fine with just a few.

### Where do I get API keys?

See [Setup Integrations](Setup-Integrations.md) for detailed instructions for each service.

## Using Motus

### How do I create my first department?

In Claude Code:
```
/motus department create life
```

Follow the interactive wizard!

### How do I run a workflow?

```
/motus <department> <workflow-name>
```

Example:
```
/motus life daily-brief
```

### Can I schedule workflows?

Yes! When creating a workflow, choose "Scheduled" type and provide a cron schedule.

### How do I test an agent?

Run the agent directly in Claude Code:
```
/motus <department> <agent-name>
```

Or ask Claude Code to execute the agent's script directly to check for errors.

### Where are my daily notes stored?

Obsidian notes: `OBSIDIAN_VAULT_PATH/Daily/`
Notion pages: Your configured Notion database

## Agents & Workflows

### What's the difference between agents and workflows?

- **Agent**: Single-purpose task (fetch weather, analyze data, create note)
- **Workflow**: Combines multiple agents to accomplish complex goal

### What are the agent types?

1. **Data Fetcher**: Calls APIs, returns data
2. **Specialist**: Analyzes, transforms, creates content  
3. **Orchestrator**: Coordinates other agents

### Can I use the same agent in multiple workflows?

Yes! Agents are reusable across workflows.

### How many agents can I have?

No limit! Create as many as you need.

### Can workflows call other workflows?

Not directly, but you can create a master orchestrator agent that coordinates multiple workflows.

## Integrations

### Which integrations are free?

- Weather API: 1M calls/month free
- Google Calendar/Gmail: Free
- Notion: Free
- Twitter: Free tier available
- LinkedIn: Free API access
- Facebook: Free for basic features

### Do I need OAuth Manager for all integrations?

Only for OAuth2 integrations (Google, LinkedIn, Facebook, Twitter). API key integrations (Weather, Notion) don't need it.

### How do OAuth tokens work?

Tokens are stored securely and automatically refresh when they expire. You just authorize once via OAuth Manager.

### Can I use multiple Google accounts?

Currently Motus supports one OAuth connection per service. For multiple accounts, you'd need separate .env configurations.

## Troubleshooting

### My workflow isn't running

Check:
1. Workflow name spelling
2. Department is correct
3. All agents exist
4. Integrations are configured in `.env`

### "Environment variable not set" error

1. Check `.env` file exists in project root
2. Verify variable name (exact match required)
3. No spaces around `=`
4. Restart Claude Code session

### OAuth authorization fails

1. Ensure OAuth Manager is running at `http://localhost:3001`
2. Check redirect URI matches in provider settings
3. Verify Client ID and Secret are correct in `.env`
4. Clear browser cookies and try again

### Agent returns no data

1. Check API credentials in `.env`
2. Test API key with a simple curl command
3. Check if data exists at the source
4. Look for errors in the agent output

## Customization

### Can I modify existing agents?

Yes! Edit the agent definition file in `.claude/agents/` or the script in `<department>/agents/`.

### Can I create custom templates?

Yes! Add new templates to `templates/` directory and reference them in your agent creator.

### Can I change the daily note format?

Yes! Modify the `note-creator` agent to change the format.

### Can I add my own integrations?

Yes! Create a custom data-fetcher agent that calls your API.

## Data & Privacy

### Where is my data stored?

All data stays on your local machine:
- `.env`: Credentials
- `data/`: Local data storage
- `oauth-manager/tokens/`: OAuth tokens
- Your Obsidian vault or Notion workspace

### Is my data sent to external servers?

Only to the services you configure (Weather API, Google, etc.). Motus itself doesn't send data anywhere.

### Can I back up my configuration?

Yes! Back up these files:
- `.env`: Credentials
- `config/registries/`: Departments, agents, workflows
- Custom agent scripts

### How do I delete all data?

Delete the project folder. Your Obsidian notes and Notion pages will remain.

## Performance

### How fast are workflows?

Depends on:
- Number of agents
- Execution pattern (parallel vs sequential)
- API response times

Parallel execution of independent agents is fastest.

### Can I run workflows offline?

Not for agents that call external APIs. Local-only agents (file manipulation, data analysis) work offline.

### Do workflows use a lot of memory?

No, workflows are lightweight. Each agent runs independently.

## Advanced Topics

### Can I use Motus for my team?

Yes, but each person needs their own Motus installation and API keys. Motus is designed for personal automation.

### Can I deploy Motus to a server?

Motus requires Claude Code CLI which runs locally. However, you could schedule workflows to run on your local machine.

### Can I contribute to Motus?

Yes! See [Contributing](Contributing.md) for guidelines.

### How do I build custom libraries?

Create JavaScript modules in `lib/` and require them in your agents.

## Comparison Questions

### Motus vs Zapier?

- **Motus**: Local, AI-powered, open source, Claude Code only
- **Zapier**: Cloud, rule-based, subscription, web interface

Motus is more flexible for complex AI-powered automation.

### Motus vs n8n?

- **Motus**: Simpler, AI-native, Claude Code
- **n8n**: More integrations, visual editor, self-hostable

Motus is better for AI-powered personal automation.

### Motus vs custom scripts?

Motus provides:
- Pre-built templates
- Agent orchestration
- Automatic documentation
- Integration management
- Interactive wizards

Faster than building from scratch.

## Getting Help

### Where can I get help?

1. Check this [FAQ](FAQ.md)
2. Read [documentation](README.md)
3. Search [issues](https://github.com/openmotus/motus/issues)
4. Ask in [discussions](https://github.com/openmotus/motus/discussions)

### How do I report bugs?

Create an issue on [GitHub](https://github.com/openmotus/motus/issues) with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs

### Can I request features?

Yes! Create a feature request issue on [GitHub](https://github.com/openmotus/motus/issues).

### Is there a community?

Join discussions on [GitHub Discussions](https://github.com/openmotus/motus/discussions).

## Still Have Questions?

Can't find your answer?

1. Search [existing issues](https://github.com/openmotus/motus/issues)
2. Ask in [Discussions](https://github.com/openmotus/motus/discussions)
3. Create new issue if needed

We're here to help! 🚀

---

**Previous**: [Contributing ←](Contributing.md) | **Home**: [Documentation Index](README.md)
