# Motus Public Release Plan

**Date Created:** 2025-10-08
**Status:** 📋 PLANNED (Not Executed)
**Purpose:** Prepare Motus codebase for public GitHub release as a starter template

---

## Overview

This plan outlines how to convert the current Motus implementation (which includes personal Life and Marketing departments) into a clean, public starter template that others can download and use to build their own departments, agents, and workflows.

**Goal:** Ship the **creation system** and **infrastructure**, not the **personal implementation**.

---

## ✅ KEEP (Core System - The Product)

These are the files and directories that make up the Motus framework - the actual product we're releasing.

### 1. Creation System

**Why:** This is the core value - the system that creates departments/agents/workflows

- `lib/registry-manager.js` - Registry management, CRUD operations
- `lib/template-engine.js` - Handlebars template rendering
- `lib/oauth-registry.js` - OAuth integration management
- `lib/doc-generator.js` - Automatic documentation generation
- `templates/` - **ALL** template files
  - `templates/agent/` - Agent definition templates
  - `templates/department/` - Department templates
  - `templates/workflow/` - Workflow templates
  - `templates/docs/` - Documentation templates
- `.claude/commands/motus.md` - Core CLI commands for department/agent/workflow creation
- `.claude/agents/department-creator.md` - Department creation wizard
- `.claude/agents/agent-creator.md` - Agent creation wizard
- `.claude/agents/workflow-creator.md` - Workflow creation wizard

### 2. Infrastructure

**Why:** Required for the system to function

- `oauth-manager/` - OAuth Manager server and UI
  - `oauth-manager/server.js` - Express server (keep only Google + Oura configs)
  - `oauth-manager/public/index.html` - OAuth Manager UI
- `start-oauth-manager.sh` - OAuth Manager launcher
- `setup-automation.sh` - Setup script (review for personal content first)
- `motus` - Main CLI executable
- `package.json` - Dependencies
- `package-lock.json` - Locked dependencies
- Node modules path: `.npm-global/` - (if needed for global install)

### 3. Documentation (Generic)

**Why:** Users need to understand the system

- `README.md` - **NEW** Project overview, installation, quick start
- `GETTING-STARTED.md` - **NEW** Tutorial: Create your first department
- `docs/STANDARDIZED-CREATION-SYSTEM-PLAN.md` - System architecture
- `docs/REGISTRY-FILE-SYNC-FIX.md` - Technical implementation details
- `docs/INTEGRATION-SYSTEM.md` - Integration documentation
- `docs/examples/example-department.md` - **NEW** Sample department configuration
- `CLAUDE.md` - **SANITIZED VERSION** (see below for what to remove)
- `LICENSE` - **NEW** (Add MIT or your preferred license)

### 4. Configuration (Empty/Example)

**Why:** Structure needed but no personal data

- `config/registries/departments.json` - **EMPTY** (just `{ "departments": {}, "metadata": {} }`)
- `config/registries/agents.json` - **EMPTY** (just `{ "agents": {}, "metadata": {} }`)
- `config/registries/workflows.json` - **EMPTY** (just `{ "workflows": {}, "metadata": {} }`)
- `.env.example` - **NEW** Template with placeholders, no real values

### 5. Testing/Validation

**Why:** Users can validate system works

- Test scripts (if generic and useful)
- Example configurations

---

## ❌ REMOVE (Personal Implementation)

These are YOUR specific departments, agents, and personal data that should not be in the public release.

### 1. Personal Department Directories

**Complete Removal:**

- `life-admin/` - **ENTIRE DIRECTORY**
  - All scripts inside (weather-fetcher.js, calendar-fetcher.js, etc.)
  - All data files
  - All configuration
- `marketing/` - **ENTIRE DIRECTORY**
  - `marketing/agents/` - All implementation scripts
  - Any marketing data
- `data/` - **ENTIRE DIRECTORY**
  - All personal data files
  - All generated reports
  - All workflow outputs

### 2. Personal Agent Files

**Remove these agent definitions from `.claude/agents/`:**

**Life Department Agents:**
- `weather-fetcher.md`
- `calendar-fetcher.md`
- `email-processor.md`
- `oura-fetcher.md`
- `quote-fetcher.md`
- `tomorrow-weather.md`
- `tomorrow-calendar.md`
- `task-compiler.md`
- `insight-generator.md`
- `note-creator.md`
- `note-reader.md`
- `note-appender.md`
- `accomplishment-analyzer.md`
- `notion-creator.md`
- `content-curator.md`
- `daily-planner.md`
- `evening-review-agent.md`
- `goal-tracker.md`
- `health-tracker.md`
- `finance-manager.md`
- `life-admin.md`
- `daily-brief-orchestrator.md`
- `evening-report-orchestrator.md`

**Marketing Department Agents:**
- `marketing-admin.md`
- `marketing-orchestrator.md`
- `trend-analyzer.md`
- `analytics-fetcher.md`
- `social-fetcher.md`
- `sentiment-analyzer.md`
- `content-creator.md`
- `campaign-analyzer.md`
- `report-creator.md`

**Keep Only:**
- `department-creator.md` - Creation wizard
- `agent-creator.md` - Creation wizard
- `workflow-creator.md` - Creation wizard

### 3. Generated Documentation

**Remove:**
- `org-docs/departments/life-department.md`
- `org-docs/departments/marketing-department.md`
- `org-docs/departments/system-department.md`
- `org-docs/COMMANDS_REFERENCE.md` - (will regenerate as empty)

**Keep Structure:**
- `org-docs/departments/` - Empty directory (with .gitkeep)
- `org-docs/` - Directory structure

### 4. Personal Configuration & Secrets

**Remove/Replace:**
- `.env` - **DELETE** (replace with .env.example)
- Any files with real API keys or tokens
- Any files with personal Obsidian vault paths
- Any files with personal Notion database IDs
- `~/.motus/` tokens - (these are outside repo anyway, but document in README to not commit)

**Personal Content in Existing Files:**
- `CLAUDE.md` - Remove personal preferences section:
  - Current goals (exercise, reading, saving)
  - Tracked habits
  - Health metrics
  - User preferences
  - Specific Obsidian vault paths
  - Keep: System architecture, agent types, workflow patterns, generic examples

### 5. Personal Scripts/Workflows

**Review and Remove if Personal:**
- `install-cron.sh` - If it has YOUR personal schedules
- `run-motus-command.sh` - If it has YOUR personal commands
- `archive/` - **ENTIRE DIRECTORY** (all old personal implementations)

---

## Proposed Approaches

### Option 1: Clean Current Repo (⭐ RECOMMENDED)

**Steps:**
1. Create backup of current state
2. Run cleanup script that removes personal files
3. Clean registries (keep structure, remove entries)
4. Create .env.example from .env (with placeholders)
5. Update CLAUDE.md to be generic
6. Create comprehensive README.md
7. Create GETTING-STARTED.md tutorial
8. Add example department in docs/examples/
9. Update .gitignore to prevent personal data commits
10. Test that system works with clean slate
11. Review cleaned state manually
12. Push to GitHub

**Pros:**
- Keeps git history
- Clean, straightforward process
- Easy to automate
- Can maintain personal version in different branch

**Cons:**
- Git history contains personal commits (can be squashed/rewritten if needed)

---

### Option 2: Fresh Repo from Core

**Steps:**
1. Create new empty repository
2. Copy only core files (lib/, templates/, oauth-manager/, etc.)
3. Create fresh empty registries
4. Write new documentation from scratch
5. Test system works
6. Push to GitHub

**Pros:**
- Clean git history
- No chance of personal data leaking
- Fresh start

**Cons:**
- More manual work
- Lose git history
- Have to maintain two repos

---

### Option 3: Separate Branch Strategy

**Steps:**
1. Create `public-release` branch
2. Remove personal files from that branch only
3. Maintain `main` branch for personal use
4. Merge core system updates from main → public-release
5. Push only public-release branch to GitHub

**Pros:**
- Keep personal version in main
- Clean public version in separate branch
- Can sync improvements between branches

**Cons:**
- More complex to maintain
- Risk of accidentally merging personal content
- Two branches to manage

---

## Recommended Approach: Option 1

**Use Option 1 with a cleanup script** that safely removes personal content while preserving the core system.

---

## Cleanup Script Requirements

### What the Script Should Do:

1. **Create Backup**
   ```bash
   # Create dated backup of entire repo
   tar -czf ~/motus-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
   ```

2. **Remove Personal Directories**
   ```bash
   rm -rf life-admin/
   rm -rf marketing/
   rm -rf data/
   rm -rf archive/
   ```

3. **Remove Personal Agent Files**
   ```bash
   # Remove all life department agents
   rm .claude/agents/weather-fetcher.md
   rm .claude/agents/calendar-fetcher.md
   # ... (all agents listed above)

   # Keep only creator agents
   # (department-creator, agent-creator, workflow-creator)
   ```

4. **Clean Registries**
   ```bash
   # Write empty registries
   echo '{"departments":{},"metadata":{"totalDepartments":0,"lastUpdated":"..."}}' > config/registries/departments.json
   echo '{"agents":{},"metadata":{"totalAgents":0,"lastUpdated":"..."}}' > config/registries/agents.json
   echo '{"workflows":{},"metadata":{"totalWorkflows":0,"lastUpdated":"..."}}' > config/registries/workflows.json
   ```

5. **Create .env.example**
   ```bash
   # Create from .env but with placeholder values
   cat > .env.example << 'EOF'
   # Weather API
   WEATHER_API_KEY=your_weather_api_key_here

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REFRESH_TOKEN=auto_generated_after_oauth

   # Notion
   NOTION_API_KEY=your_notion_api_key
   NOTION_DATABASE_ID=your_database_id

   # Obsidian
   OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault

   # Oura Ring
   OURA_CLIENT_ID=your_oura_client_id
   OURA_CLIENT_SECRET=your_oura_client_secret
   EOF
   ```

6. **Sanitize CLAUDE.md**
   - Remove "Personal Configuration" section
   - Remove "Current Goals" section
   - Remove "Tracked Habits" section
   - Remove "Health Metrics" section
   - Remove specific Obsidian vault paths
   - Keep: Architecture, agent types, system design

7. **Remove Generated Docs**
   ```bash
   rm -rf org-docs/departments/*.md
   rm org-docs/COMMANDS_REFERENCE.md
   ```

8. **Update .gitignore**
   ```bash
   cat >> .gitignore << 'EOF'

   # Personal Data - DO NOT COMMIT
   .env
   data/
   life-admin/
   marketing/
   /org-docs/departments/*.md
   ~/.motus/

   # Keep examples
   !docs/examples/
   EOF
   ```

9. **Regenerate Documentation**
   ```bash
   node lib/doc-generator.js
   ```

10. **Validation**
    - Check that registries are empty
    - Verify no personal agents exist
    - Confirm .env is not in repo
    - Test that creation wizards still work

---

## Files to Create (New Documentation)

### 1. README.md

Should include:
- Project title and description
- What is Motus?
- Key features
- Quick start (3-5 commands to get started)
- Installation instructions
- First department creation
- Link to documentation
- Contributing guidelines
- License

### 2. GETTING-STARTED.md

Tutorial that walks through:
- Installation
- Environment setup
- Creating first department (example: "Tasks" or "Bookmarks")
- Creating first agent
- Creating first workflow
- Testing it works
- Next steps

### 3. docs/examples/example-department.md

Sample department configuration showing:
```markdown
# Example: Tasks Department

## Overview
A simple department for managing personal tasks

## Agents
- task-admin - Department orchestrator
- task-fetcher - Gets tasks from various sources
- task-analyzer - Analyzes task priority

## Workflows
- daily-tasks - Get and prioritize today's tasks

## Integrations
- Todoist API (optional)
- Google Tasks (optional)

## Setup
...
```

### 4. .env.example

Template with all possible environment variables:
```bash
# Copy this to .env and fill in your values
# DO NOT commit .env to git

# Weather
WEATHER_API_KEY=

# Google Services
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ... etc
```

### 5. LICENSE

Suggest MIT License:
```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

## Updated .gitignore

Add these patterns:
```gitignore
# Environment
.env
.env.local

# Personal Data
data/
life-admin/
marketing/
org-docs/departments/*.md
!docs/examples/

# OAuth Tokens
.motus/
~/.motus/

# Node
node_modules/
npm-debug.log
.npm/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
```

---

## Validation Checklist

Before pushing to GitHub, verify:

- [ ] No .env file in repo
- [ ] .env.example exists with placeholders
- [ ] No personal agent files in `.claude/agents/`
- [ ] Only creator agents exist (department-creator, agent-creator, workflow-creator)
- [ ] No life-admin/ directory
- [ ] No marketing/ directory
- [ ] No data/ directory
- [ ] Registries are empty (just structure)
- [ ] CLAUDE.md has no personal preferences/goals
- [ ] README.md exists and is complete
- [ ] GETTING-STARTED.md exists
- [ ] docs/examples/ has at least one example
- [ ] .gitignore prevents personal data commits
- [ ] LICENSE file exists
- [ ] OAuth Manager works (can register new integrations)
- [ ] Can create a test department from scratch
- [ ] Can create a test agent from scratch
- [ ] Can create a test workflow from scratch
- [ ] Documentation generates correctly
- [ ] No personal API keys or tokens anywhere

---

## Testing the Clean Release

After cleanup, test that the system works:

```bash
# 1. Create a test department
/motus department create test-dept

# 2. Create a test agent
/motus test-dept agent create test-agent

# 3. Verify registry was updated
cat config/registries/departments.json

# 4. Verify agent file was created
ls .claude/agents/test-agent.md

# 5. Verify documentation generated
cat org-docs/departments/test-dept-department.md

# 6. Clean up test
# (manually delete test department, agent, docs)
```

If all tests pass, the release is ready!

---

## Git Commands for Release

### If Using Option 1 (Clean Current Repo):

```bash
# 1. Create backup branch
git checkout -b backup-personal
git push origin backup-personal

# 2. Return to main
git checkout main

# 3. Run cleanup script
./prepare-public-release.sh

# 4. Review changes
git status
git diff

# 5. Commit cleaned state
git add .
git commit -m "Prepare for public release - remove personal implementations"

# 6. Push to GitHub
git push origin main

# 7. Create release
gh release create v1.0.0 --title "Motus v1.0.0 - Initial Release" --notes "AI Life & Business Automation Framework"
```

### If Using Option 3 (Separate Branch):

```bash
# 1. Create public branch
git checkout -b public-release

# 2. Run cleanup script
./prepare-public-release.sh

# 3. Commit cleaned state
git add .
git commit -m "Public release version"

# 4. Push public branch only
git push origin public-release

# 5. On GitHub, set public-release as default branch
```

---

## Post-Release Tasks

After pushing to GitHub:

1. **Create GitHub Description**
   - Clear project description
   - Tags: automation, ai, claude, workflow, productivity

2. **Add Topics**
   - ai-automation
   - workflow-engine
   - productivity-tools
   - claude-ai
   - department-management

3. **Create Issues Templates**
   - Bug report template
   - Feature request template
   - Question template

4. **Set Up GitHub Pages** (optional)
   - Documentation site
   - Examples showcase

5. **Create CONTRIBUTING.md**
   - How to contribute
   - Code style
   - PR process

6. **Pin Important Issues/Discussions**
   - Getting started thread
   - Feature requests
   - Showcase implementations

---

## Maintenance Strategy

### Personal Version (Private/Branch):
- Keep `main` or `personal` branch with your implementations
- Regularly pull public improvements
- Never merge personal → public

### Public Version (GitHub):
- Accept PRs for core system improvements
- Review security issues
- Keep documentation updated
- Add more templates/examples

---

## Questions to Answer Before Execution

When ready to execute this plan, decide:

1. **Which option?** (Recommended: Option 1)
   - Option 1: Clean current repo
   - Option 2: Fresh repo
   - Option 3: Separate branch

2. **Include example department?**
   - YES: Include simple "Tasks" department as tutorial
   - NO: Ship completely empty

3. **CLAUDE.md sanitization level?**
   - Keep all technical architecture: YES
   - Remove personal goals: YES
   - Remove personal paths: YES
   - Keep generic examples: YES

4. **Cleanup script behavior?**
   - List files only (safe, manual deletion)
   - Create backup + auto-delete (recommended)
   - Auto-delete without backup (fast, risky)

5. **License?**
   - MIT (most permissive)
   - Apache 2.0 (more protective)
   - Other

6. **Repository visibility?**
   - Public from day 1
   - Private initially, then public
   - Private with invite-only access

---

## Estimated Time

- **Cleanup Script Writing:** 1-2 hours
- **Running Cleanup:** 5-10 minutes
- **Documentation Writing:** 2-3 hours
- **Testing:** 30-60 minutes
- **Review:** 30-60 minutes
- **Git Operations:** 15 minutes

**Total:** 4-7 hours

---

## Success Criteria

Release is successful when:
- ✅ Anyone can clone the repo
- ✅ Anyone can create their first department in <30 minutes
- ✅ Documentation is clear and complete
- ✅ No personal data is exposed
- ✅ All creator wizards work
- ✅ OAuth Manager works
- ✅ System generates documentation correctly

---

## Final Notes

**Before executing:**
1. Back up your current state
2. Review this plan line by line
3. Test in a separate directory first
4. Have rollback plan ready

**When ready to execute, tell Claude:**
"I'm ready to execute the public release plan. Let's use Option [1/2/3] with [preferences]."

---

**Document Status:** Ready for review and execution when needed
**Last Updated:** 2025-10-08
