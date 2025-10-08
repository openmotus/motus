# Introduction to /Motus

Welcome to **Motus** - an AI-powered life and business automation framework built exclusively for [Claude Code](https://claude.com/claude-code).

## What is Motus?

Motus is a sophisticated automation system that helps you organize your life and business through AI-powered **departments**, **agents**, and **workflows**. Think of it as your personal AI organization that runs 24/7, handling everything from daily briefings to marketing campaigns.

### Core Concepts

**Departments** 🏢
Organized sections of your life or business (e.g., Life, Marketing, Finance). Each department has its own agents and workflows.

**Agents** 🤖
Specialized AI assistants that perform specific tasks. There are three types:
- **Orchestrators**: Coordinate multiple agents and workflows
- **Data Fetchers**: Retrieve information from APIs and services
- **Specialists**: Perform analysis, create content, or make decisions

**Workflows** 🔄
Automated processes that combine multiple agents to accomplish complex tasks. Can run on schedules or manually.

**Integrations** 🔌
Connections to external services like Google Calendar, Gmail, Notion, Twitter, and more.

## What Can Motus Do?

### Real-World Examples

**Life Management**
- 📅 Generate daily briefings with weather, calendar, emails, and tasks
- 📊 Track health metrics from Oura Ring
- 📝 Create and update Obsidian daily notes
- 🎯 Monitor goals and habits

**Marketing Automation**
- 📈 Analyze trending topics on social media
- ✍️ Generate content ideas and copy
- 📱 Monitor social media sentiment
- 📊 Create campaign performance reports

**Business Operations**
- 💰 Track expenses and budgets
- 📧 Process and prioritize emails
- 📅 Manage meeting schedules
- 📈 Generate business reports

## How It Works

```mermaid
graph LR
    A[You] --> B[/Motus CLI]
    B --> C[Departments]
    C --> D[Agents]
    D --> E[Workflows]
    E --> F[Integrations]
    F --> G[External Services]
    G --> H[Results]
    H --> A
```

1. **You** interact with Motus through simple CLI commands
2. **Departments** organize your automation into logical groups
3. **Agents** perform specialized tasks
4. **Workflows** orchestrate multiple agents
5. **Integrations** connect to external services
6. **Results** are delivered back to you automatically

## Key Features

✅ **Fully Automated** - Set it and forget it
✅ **AI-Powered** - Leverages Claude's intelligence
✅ **Modular** - Create departments, agents, and workflows as needed
✅ **Extensible** - Easy to add new integrations and capabilities
✅ **Template-Based** - Consistent, professional outputs
✅ **Open Source** - Free to use and customize

## Who Is Motus For?

- **Productivity Enthusiasts** - Automate your daily routines
- **Marketers** - Manage campaigns and content creation
- **Business Owners** - Streamline operations and reporting
- **Developers** - Build custom automation workflows
- **Knowledge Workers** - Organize and process information efficiently

## Technology Stack

- **Platform**: Claude Code CLI (exclusive)
- **Language**: Node.js / JavaScript
- **Templating**: Handlebars
- **APIs**: Google, Notion, Twitter, Weather, Oura, and more
- **Storage**: Local JSON files and external services

## Getting Started

Ready to automate your life? Here's what to do next:

1. **[Installation](Installation.md)** - Set up Motus on your machine
2. **[Quick Start](Quick-Start.md)** - Create your first department in 5 minutes
3. **[Concepts](Concepts.md)** - Understand the architecture
4. **[Creating Departments](Creating-Departments.md)** - Build your first department

## Community & Support

- **Documentation**: [https://docs.motus.sh/](https://docs.motus.sh/)
- **Website**: [https://motus.sh](https://motus.sh)
- **GitHub**: [https://github.com/openmotus/motus](https://github.com/openmotus/motus)
- **Issues**: Report bugs and request features on GitHub

## License

Motus is open source and free to use under the MIT License.

---

**Next Steps**: [Installation →](Installation.md)
