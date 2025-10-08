# Installation

Install Motus in 2 minutes and start automating your life.

## Prerequisites

Before installing Motus, ensure you have:

**Required:**
- **Claude Code CLI** - Motus runs exclusively in Claude Code
  - Download: [claude.com/claude-code](https://claude.com/claude-code)
- **Node.js** (v18+) - [nodejs.org](https://nodejs.org/)
- **Git** - [git-scm.com](https://git-scm.com/)

**Optional:**
- **Obsidian** - For daily notes features
- **Notion** - For Notion integration

## Installation

### Step 1: Clone and Install

In your terminal, run:

```bash
git clone https://github.com/openmotus/motus.git
cd motus
npm install
```

That's it! The installation is complete.

### Step 2: Open in Claude Code

1. Open Claude Code CLI
2. Navigate to the motus directory
3. You're ready to use Motus!

### Step 3: Verify Installation

In Claude Code, run:

```
/motus --version
```

You should see the Motus version number. If you do, installation succeeded!

## What Got Installed

Your Motus directory contains:

```
motus/
├── .claude/                 # Claude Code configuration
│   ├── agents/             # Agent definitions
│   └── commands/           # Motus commands
├── config/registries/      # Departments, agents, workflows
├── lib/                    # Core libraries
├── templates/              # Creation templates
├── oauth-manager/          # OAuth server
├── public-docs/            # This documentation
└── motus                   # Main executable
```

## Initial Setup (Optional)

You can start using Motus immediately without any configuration. To add integrations later:

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your API keys when ready (see [Setup Environment](Setup-Environment.md))

**Note:** You don't need API keys to create departments and agents!

## Quick Test

Verify everything works by creating a test department in Claude Code:

```
/motus department create test
```

If the wizard starts, you're all set! Press `Ctrl+C` to cancel.

## Common Issues

### "npm install" fails

Try:
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### "node: command not found"

Install Node.js from [nodejs.org](https://nodejs.org/)

### Need more help?

See [Troubleshooting](Troubleshooting.md) for detailed solutions.

## Next Steps

Now that Motus is installed, choose your path:

**Quick Start (Recommended)**
- **[Quick Start Guide](Quick-Start.md)** - Create your first department in 5 minutes

**Learn More**
- **[Concepts](Concepts.md)** - Understand how Motus works
- **[Setup Environment](Setup-Environment.md)** - Configure integrations
- **[Examples](Examples.md)** - See real-world implementations

**Start Building**
- **[Creating Departments](Creating-Departments.md)** - Build your first department
- **[Creating Agents](Creating-Agents.md)** - Create powerful agents
- **[Creating Workflows](Creating-Workflows.md)** - Automate with workflows

## Getting Help

- **Documentation**: [docs.motus.sh](https://docs.motus.sh/)
- **Issues**: [GitHub Issues](https://github.com/openmotus/motus/issues)
- **FAQ**: [FAQ.md](FAQ.md)

---

**Next**: [Quick Start →](Quick-Start.md)
