# Archive Folder

This folder contains files from the Motus project that are no longer actively used but are preserved for reference or potential future use.

## Archive Structure

### `/terminal-app/`
- **What it was**: Beautiful localhost web-based terminal emulator
- **Why archived**: Automation now runs via cron/LaunchAgents, no need for interactive terminal
- **Contains**: Express server, Socket.io implementation, HTML/CSS/JS frontend

### `/old-scripts/`
- **What they were**: Original Motus implementation before slash commands
- **Why archived**: Replaced by `/motus` slash command system
- **Contains**: motus.sh, motus-command.js, motus-life-cli.js, etc.

### `/test-files/`
- **What they were**: Development and debugging test scripts
- **Why archived**: Testing complete, not needed for production
- **Contains**: test-enhanced.js, test-google-connection.js, etc.

### `/old-departments/`
- **What it was**: Original department-based architecture
- **Why archived**: Simplified to focus on Life department only
- **Contains**: Department handler files

### `/old-lib/`
- **What they were**: Library files for old architecture
- **Why archived**: Functionality moved to life-admin scripts
- **Contains**: integrations.js, life-department-enhanced.js

### `/old-workflows/`
- **What they were**: Original workflow implementations
- **Why archived**: Replaced by agent-based orchestration
- **Contains**: Old workflow definition files

### `/old-life-admin/`
- **What they were**: Duplicate or superseded versions of life-admin scripts
- **Why archived**: Using newer versions or consolidated functionality
- **Contains**: cli-dashboard.js, simple-dashboard.js, old parsers, etc.

### `/old-docs/`
- **What they were**: Documentation from development phases
- **Why archived**: Superseded by WORKFLOW-ORCHESTRATION-MASTER.md
- **Contains**: PLAN.md, setup guides, old documentation

### `/old-hooks/`
- **What they were**: Shell script based scheduling hooks
- **Why archived**: Using crontab and LaunchAgents instead
- **Contains**: life-department-hooks.sh

### `/old-data/`
- **What it was**: Old data structures and memory storage
- **Why archived**: Using simpler data structure now
- **Contains**: Old workflow data, memory stores

## Active System Components

The following remain active and in use:

### Core System
- `.claude/` - Claude Code commands and agents
- `life-admin/` - Core automation scripts (except archived items)
- `.env` - Environment configuration

### Automation
- `run-motus-command.sh` - Automation wrapper
- `run-automated-workflow.js` - Workflow runner
- `install-cron.sh` - Crontab installer
- `setup-automation.sh` - Automation setup
- LaunchAgent plist files

### Documentation
- `README.md` - Main project readme
- `WORKFLOW-ORCHESTRATION-MASTER.md` - Master system documentation
- `CLAUDE.md` - Claude-specific documentation

### Data
- `data/briefings/` - Daily briefing storage
- `data/life/` - Life data storage
- `logs/` - Automation logs

## Restoration

To restore any archived file:
```bash
# Single file
mv archive/[category]/[filename] .

# Entire category
mv archive/[category]/* .
```

## Archive Date

Files archived on: August 27, 2025

## Note

These files are preserved in case any functionality needs to be referenced or restored. The archive maintains the original structure and can be easily restored if needed.