# /Motus

**AI-Powered Life & Business Automation Framework for Claude Code**

[![CI](https://github.com/openmotus/motus/actions/workflows/ci.yml/badge.svg)](https://github.com/openmotus/motus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Built%20for-Claude%20Code-5A67D8)](https://claude.com/claude-code)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)

> Automate your life and business with AI-powered departments, agents, and workflows built exclusively for Claude Code CLI.

## 🚀 What is Motus?

Motus is a sophisticated automation **framework** that provides the structure to organize your life and business through AI-powered **departments**, **agents**, and **workflows**. You build your personal AI organization using Motus's creation system and templates—you provide the implementation, Motus provides the architecture.

### What You Get ✅

- **Creation Wizards** - Interactive wizards that generate complete departments with:
  - Department master and orchestrator agents
  - 3-5 starter agents (auto-suggested based on department type)
  - 2-3 workflow templates (ready to customize)
  - Implementation skeletons for all agents
- **Template Engine** - 11 Handlebars templates for consistent code generation
- **Registry System** - Centralized tracking of all your departments, agents, and workflows
- **OAuth Manager** - Web UI to manage API integrations with any OAuth2 service
- **Documentation Generator** - Auto-generates comprehensive docs from your setup
- **Project Structure** - Organized directory layout for everything

### What You DON'T Get ❌

- Pre-built departments (Life, Marketing, etc.) - Wizards help you create your own
- Fully-implemented agents - You get editable templates, you add your specific logic
- Pre-configured API keys - You add your own credentials
- Production-ready workflows - You get starter templates to customize

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

- [Claude Code CLI](https://claude.ai/download) installed and working
- Node.js 18+ installed
- Git installed

### Installation

```bash
# Clone the repository
git clone https://github.com/openmotus/motus.git
cd motus

# Install dependencies
npm install

# Verify installation (optional - shows usage info)
./motus --version
```

> **Important**: Motus commands run inside Claude Code CLI, not in a regular terminal. After installation, open Claude Code in the motus directory to use `/motus` commands.

### Your First Department

Open Claude Code CLI in the motus directory, then:

```bash
# Create a department with interactive wizard
/motus department create tasks

# The wizard will:
# 1. Ask about the department's purpose
# 2. Suggest integrations based on your needs
# 3. Auto-generate 3-5 starter agents (editable templates)
# 4. Create 2-3 workflows (ready to customize)
# 5. Generate all documentation
```

**What you get:**
- Department master agent (`tasks-admin.md`)
- Department orchestrator (`tasks-orchestrator.md`)
- 3-5 starter agents with implementation templates
- 2-3 workflow configurations
- Complete documentation

**Next step**: Customize the generated agents and workflows for your specific use case. The wizard creates working templates—you edit them to match your exact needs. See the [Creating Agents](public-docs/Creating-Agents.md) guide for customization details.

## 📚 Documentation

Comprehensive documentation is available in the **[public-docs/](public-docs/)** directory.

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
│              /Motus CLI                     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  Departments   │
        └────────┬───────┘
                 │
         ┌───────┴──────┐
         │              │
    ┌────▼────┐    ┌────▼────┐
    │  Agents │    │Workflows│
    └────┬────┘    └────┬────┘
         │              │
         └───────┬──────┘
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
│   ├── agents/          # Agent definitions (creator wizards)
│   └── commands/        # Slash commands (/motus)
├── config/              # System configuration
│   └── registries/      # Department/agent/workflow registries
├── departments/         # Your created departments go here
├── lib/                 # Core libraries
│   ├── registry-manager.js
│   ├── template-engine.js
│   ├── validator.js
│   ├── oauth-registry.js
│   └── doc-generator.js
├── templates/           # Handlebars templates (11 templates)
├── oauth-manager/       # OAuth Manager server
├── public-docs/         # User documentation
├── org-docs/            # Auto-generated docs
├── motus                # Usage info (actual commands run inside Claude Code)
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
git clone https://github.com/openmotus/motus.git
cd motus

# Install dependencies
npm install

# Run tests
npm test

# Make your changes
# ...

# Test your changes in Claude Code CLI
# Open Claude Code in the motus directory, then run:
/motus department create test-dept
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- **Created by**: [Ian Borders](https://x.com/OpenMotus)
- Built exclusively for [Claude Code](https://claude.com/claude-code)
- Powered by Anthropic's Claude AI
- Inspired by the need for intelligent automation

## 🔗 Links

- **GitHub**: [https://github.com/openmotus/motus](https://github.com/openmotus/motus)
- **Documentation**: [public-docs/](public-docs/)
- **Issues**: [Report bugs or request features](https://github.com/openmotus/motus/issues)

## 🆘 Support

Need help?

- 📖 Check the [Documentation](public-docs/)
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
