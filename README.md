# /Motus

**AI-Powered Life & Business Automation Framework for Claude Code**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-5A67D8)](https://claude.com/claude-code)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)

> Automate your life and business with AI-powered departments, agents, and workflows built exclusively for Claude Code CLI.

## 🚀 What is Motus?

Motus is a sophisticated automation **framework** that provides the structure to organize your life and business through AI-powered **departments**, **agents**, and **workflows**. You build your personal AI organization using Motus's creation system and templates—you provide the implementation, Motus provides the architecture.

### What You Get ✅

- **Creation System** - Wizards to generate departments, agents, and workflows
- **Template Engine** - 11 Handlebars templates for consistent code generation
- **Registry System** - Centralized tracking of all your departments, agents, and workflows
- **OAuth Manager** - Web UI to manage API integrations with any OAuth2 service
- **Documentation Generator** - Auto-generates docs from your setup
- **Project Structure** - Organized directory layout for departments and agents

### What You DON'T Get ❌

- Pre-built departments (Life, Marketing, etc.) - You create your own
- Implemented agents - You write the implementation logic
- Pre-configured integrations - You add your own API keys and services
- Ready-to-run workflows - You define the workflow steps

**Think of it like this:**
- **Rails** is a web framework → You build your own web apps
- **Motus** is an automation framework → You build your own automation systems

### Key Features

- ✨ **AI-Powered Automation** - Leverages Claude's intelligence for smart automation
- 🏢 **Department-Based Organization** - Organize automation into logical units (Life, Marketing, Finance, etc.)
- 🤖 **Specialized AI Agents** - Orchestrators, Data Fetchers, and Specialists working together
- 🔄 **Flexible Workflows** - Manual or scheduled, simple or complex
- 🔌 **Extensible Integrations** - Google, Notion, Twitter, Weather, Oura, and more
- 📝 **Template System** - Consistent, professional outputs every time
- 🛠️ **Built for Claude Code** - Exclusive integration with Claude Code CLI
- 📚 **Auto-Documentation** - Generates comprehensive docs automatically

## 📸 Quick Look

```bash
# Create a department
/motus department create marketing

# Add an agent
/motus marketing agent create trend-analyzer

# Create a workflow
/motus marketing workflow create daily-trends

# Run it
/motus marketing daily-trends
```

## 🎯 Use Cases

> **Note**: These are examples of what you **can build** with Motus, not pre-built features. Motus provides the framework—you implement the functionality.

### Life Management
- 📅 Daily briefings with weather, calendar, and tasks
- 📊 Health tracking with Oura Ring integration
- 📝 Obsidian note management
- 🎯 Goal and habit tracking

### Marketing Automation
- 📈 Social media trend analysis
- ✍️ Content creation and ideation
- 📱 Sentiment monitoring
- 📊 Campaign reporting

### Business Operations
- 💰 Expense and budget tracking
- 📧 Email processing and prioritization
- 📅 Calendar management
- 📈 Business intelligence reports

## 🏃 Quick Start

### Prerequisites

- [Claude Code CLI](https://claude.com/claude-code) installed
- Node.js 18+ installed
- Git installed

### Installation

```bash
# Clone the repository
git clone https://github.com/openmotus/motus.git
cd motus

# Install dependencies
npm install

# Make executable
chmod +x motus

# Verify installation
./motus --version
```

### Your First Department

```bash
# Create a Tasks department
/motus department create tasks

# Create an agent
/motus tasks agent create task-fetcher

# Create a workflow
/motus tasks workflow create daily-tasks
```

**What just happened?** Motus created the department structure, agent definition, and workflow configuration.

**Next step**: Implement your agent's logic by editing the generated files. Motus provides the structure and templates—you add the actual functionality. See the [Creating Agents](public-docs/Creating-Agents.md) guide for implementation details.

## 📚 Documentation

Comprehensive documentation is available at **[docs.motus.sh](https://docs.motus.sh/)**

### Core Guides

- **[Introduction](public-docs/Introduction.md)** - What is Motus?
- **[Quick Start](public-docs/Quick-Start.md)** - Get running in 5 minutes
- **[Installation](public-docs/Installation.md)** - Detailed setup guide
- **[Concepts](public-docs/Concepts.md)** - Understanding the architecture

### Building with Motus

- **[Creating Departments](public-docs/Creating-Departments.md)** - Organize your automation
- **[Creating Agents](public-docs/Creating-Agents.md)** - Build AI assistants
- **[Creating Workflows](public-docs/Creating-Workflows.md)** - Automate complex tasks

### Configuration

- **[Setup Environment](public-docs/Setup-Environment.md)** - Configure API keys
- **[Setup Integrations](public-docs/Setup-Integrations.md)** - Connect services
- **[OAuth Manager](public-docs/OAuth-Manager.md)** - Manage OAuth connections

### Resources

- **[Examples](public-docs/Examples.md)** - Real-world implementations
- **[API Reference](public-docs/API-Reference.md)** - Library documentation
- **[Troubleshooting](public-docs/Troubleshooting.md)** - Common issues
- **[FAQ](public-docs/FAQ.md)** - Frequently asked questions

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│              /Motus CLI                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Departments   │
        └────────┬───────┘
                 │
         ┌───────┴───────┐
         │               │
    ┌────▼────┐    ┌────▼────┐
    │ Agents  │    │Workflows│
    └────┬────┘    └────┬────┘
         │               │
         └───────┬───────┘
                 │
           ┌─────▼──────┐
           │Integrations│
           └────────────┘
```

### Core Components

- **Departments** - Organizational units (Life, Marketing, Finance)
- **Agents** - AI assistants that perform tasks
  - **Orchestrators** - Coordinate workflows
  - **Data Fetchers** - Retrieve information from APIs
  - **Specialists** - Analyze data and create content
- **Workflows** - Automated processes combining multiple agents
- **Integrations** - Connections to external services

## 🔧 Technology Stack

- **Platform**: Claude Code CLI (exclusive)
- **Runtime**: Node.js 18+
- **Templates**: Handlebars
- **Storage**: JSON registries
- **APIs**: Google, Notion, Twitter, Weather, Oura, Buffer, and more

## 📦 Project Structure

```
motus/
├── .claude/              # Claude Code configuration
│   ├── agents/          # Agent definitions
│   └── commands/        # CLI commands
├── config/              # System configuration
│   └── registries/      # Department/agent/workflow registries
├── lib/                 # Core libraries
│   ├── registry-manager.js
│   ├── template-engine.js
│   ├── oauth-registry.js
│   └── doc-generator.js
├── templates/           # Handlebars templates
├── oauth-manager/       # OAuth Manager server
├── public-docs/         # User documentation
├── org-docs/            # Auto-generated docs
├── motus                # Main CLI executable
└── package.json         # Dependencies
```

## 🤝 Contributing

We welcome contributions! Motus is open source and built by the community.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Contributing Guide](public-docs/Contributing.md) for details.

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/motus.git
cd motus

# Install dependencies
npm install

# Run tests
npm test

# Make your changes
# ...

# Test your changes
./motus department create test-dept
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Built exclusively for [Claude Code](https://claude.com/claude-code)
- Powered by Anthropic's Claude AI
- Inspired by the need for intelligent automation

## 🔗 Links

- **Website**: [https://motus.sh](https://motus.sh)
- **Documentation**: [https://docs.motus.sh](https://docs.motus.sh)
- **GitHub**: [https://github.com/openmotus/motus](https://github.com/openmotus/motus)
- **Issues**: [Report bugs or request features](https://github.com/openmotus/motus/issues)

## 🆘 Support

Need help?

- 📖 Check the [Documentation](https://docs.motus.sh/)
- 🐛 Report issues on [GitHub](https://github.com/openmotus/motus/issues)
- 💬 Ask questions in [Discussions](https://github.com/openmotus/motus/discussions)

## 🎯 Roadmap

- [ ] Additional integrations (Slack, Todoist, Spotify)
- [ ] Web dashboard for monitoring workflows
- [ ] Community marketplace for sharing departments/agents
- [ ] Mobile notifications for workflow completion
- [ ] Advanced analytics and insights

## 📊 What's Included

- **Creator Agents**: 4 wizards (department, agent, workflow, documentation)
- **Templates**: 11 Handlebars templates for code generation
- **Template Helpers**: 20+ helpers for complex logic
- **Integration Framework**: OAuth Manager (supports any OAuth2 service)
- **Core Libraries**: 5 libraries (registry, template engine, validator, OAuth, doc generator)

---

**Built with ❤️ for [Claude Code](https://claude.com/claude-code)**

*Automate everything. Live better.*