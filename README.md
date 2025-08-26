# 🎯 Motus for Claude Code

> Run your entire life and business through AI agents with 98% autonomous operation

## What is Motus?

Motus is an AI-powered life and business automation system that runs entirely within Claude Code. It enables a single person to manage their entire life and business through simple `/motus` commands, with AI agents handling execution.

## ✨ Features

- **🏠 Life Department**: Manage personal life, health, finances, and goals
- **🤖 AI Agents**: Specialized agents for different tasks (planner, health tracker, finance manager, etc.)
- **🔄 Workflows**: Automated routines like morning briefings and weekly planning
- **💯 Autonomous**: 98% self-managing with minimal human intervention
- **🔒 Private**: Everything runs locally on your machine
- **⚡ Instant Setup**: Get started in under 5 minutes

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Morning Briefing
```bash
/motus daily-brief
```

## 📋 Available Commands

### Core Commands
- `/motus init` - Initialize system
- `/motus status` - Check system status
- `/motus help` - Get help

### Life Department
- `/motus life briefing` - Morning briefing
- `/motus life review` - Evening review
- `/motus life plan [day/week/month]` - Planning sessions
- `/motus life track [habit/goal/health]` - Track progress
- `/motus life finance [budget/bills]` - Financial management
- `/motus life health [workout/meals]` - Health tracking

### Workflows
- `/motus run morning-briefing` - Start your day
- `/motus run evening-review` - End of day review
- `/motus run weekly-planning` - Weekly planning session
- `/motus workflow list` - See all workflows
- `/motus workflow create` - Create new workflow

### Agents
- `/motus agent list` - List all agents
- `/motus agent status` - Check agent status
- `/motus agent create` - Create new agent

## 🏗️ Architecture

```
Motus System
├── Life Department
│   ├── Daily Planner Agent
│   ├── Health Tracker Agent
│   ├── Finance Manager Agent
│   ├── Personal Assistant Agent
│   ├── Goal Tracker Agent
│   └── Content Curator Agent
├── Workflows
│   ├── Morning Briefing
│   ├── Evening Review
│   ├── Weekly Planning
│   └── Custom Workflows
└── Data Storage
    ├── Briefings
    ├── Reviews
    ├── Plans
    └── Tracking Data
```

## 🎯 Life Department Agents

### Daily Planner
- Schedule optimization
- Task prioritization
- Time blocking
- Calendar management

### Health Tracker
- Fitness tracking
- Nutrition monitoring
- Sleep analysis
- Wellness recommendations

### Finance Manager
- Budget tracking
- Bill reminders
- Investment monitoring
- Expense analysis

### Personal Assistant
- Email drafts
- Appointment scheduling
- Reminders
- Task management

### Goal Tracker
- Progress monitoring
- Milestone tracking
- Motivation
- Achievement celebration

### Content Curator
- Weather updates
- News digest
- Learning resources
- Entertainment recommendations

## 🔄 Daily Workflows

### Morning Briefing (8:00 AM)
1. Weather forecast
2. Calendar review
3. Daily priorities
4. Health check
5. Budget status
6. News digest

### Evening Review (9:00 PM)
1. Daily accomplishments
2. Tomorrow's preparation
3. Health summary
4. Gratitude reflection

### Weekly Planning (Sunday 10:00 AM)
1. Goal progress review
2. Week ahead planning
3. Fitness schedule
4. Budget allocation

## 📊 Data Storage

All data is stored locally in `~/.motus-claude/`:
- Configuration: `config.json`
- Departments: `departments/`
- Workflows: `workflows/`
- Personal Data: `data/life/`

## 🔮 Future Departments

Coming soon:
- **💼 Business Department**: Sales, Marketing, Operations
- **💰 Finance Department**: Advanced investing, taxes, accounting
- **🎨 Creative Department**: Content creation, design, writing
- **📚 Learning Department**: Skill development, course management
- **🏠 Home Department**: Household management, maintenance

## 🛠️ Customization

### Create Custom Department
```bash
/motus department create
```

### Create Custom Workflow
```bash
/motus workflow create
```

### Add Custom Agent
```bash
/motus agent create
```

## 🤝 Integration with Claude Code

Motus leverages Claude Code's powerful features:
- **Task Tool**: Sub-agent orchestration
- **MCP Servers**: External integrations
- **Hooks**: Automation triggers
- **Settings**: User preferences
- **CLAUDE.md**: Long-term memory

## 📈 Roadmap

- [ ] Week 1: Life Department ✅
- [ ] Week 2: Interactive wizards
- [ ] Week 3: Business departments
- [ ] Week 4: Full automation
- [ ] Month 2: Cross-department workflows
- [ ] Month 3: 100% autonomous operation

## 💡 Philosophy

Motus is built on the belief that one person should be able to run their entire life and business through AI automation. By delegating execution to AI agents while maintaining human creativity and decision-making, we enable unprecedented personal productivity and business scale.

## 📝 License

MIT

---

*Built with ❤️ for Claude Code by the Motus team*