# Motus Distribution Strategy

## Problem Identified

Motus has a **framework vs. clone** architecture issue:

**Files Users NEED (framework core):**
- `lib/` - Core libraries
- `templates/` - Handlebars templates
- `.claude/agents/` - Creator wizards
- `.claude/commands/` - Command definitions
- `oauth-manager/` - OAuth server
- `config/` - Empty registries (starting point)
- `.env.example` - Config template
- `package.json` - Dependencies
- `motus` - CLI executable

**Files Users DON'T need (project infrastructure):**
- `.github/` - Motus project CI/CD (not user's)
- `CONTRIBUTING.md` - For contributing to Motus itself
- `public-docs/` - Should be hosted at docs.motus.sh
- `tests/` - Framework tests, not user tests
- `CLAUDE.md` - Has hardcoded /Users/ianwinscom paths
- `org-docs/` - Auto-generated, starts empty anyway

**Files with Issues:**
- `README.md` - About Motus project, not user's system
- `.claudecode/` - Minimal reference, possibly redundant
- `config.json` - Has "Life" department hardcoded

---

## Distribution Options

### Option 1: `npx create-motus-app my-automation`
- Like `create-react-app`
- Copies only framework files
- Generates blank user README
- Can degit do subsets? **Yes, but it's manual**

### Option 2: `degit` with `.degitignore`
```bash
# User runs:
npx degit openmotus/motus my-automation

# .degitignore excludes:
.github
public-docs
tests
CONTRIBUTING.md
org-docs
```

### Option 3: Separate Repos
- `motus-framework` (the core)
- `motus` (example implementation)

---

## Expected User Experience

When you scaffold, you should get:
```
my-automation/
├── lib/                 # Framework (read-only-ish)
├── templates/           # Framework (read-only-ish)
├── .claude/            # Framework (read-only-ish)
├── config/             # YOUR data (empty start)
├── .env               # YOUR keys
├── README.md          # About YOUR system
└── package.json       # YOUR dependencies
```

---

## Current State Findings

### `init` Command Status
- ✅ Mentioned in `.claude/commands/motus.md` (line 51)
- ❌ **NOT IMPLEMENTED** - The `motus` CLI references classes that don't exist:
  - `MotusCommand` (no file)
  - `MotusLife` (no file)
  - `EnhancedLifeDepartment` (no file)

### Scaffolding System
- ❌ No `npx create-motus` exists
- ❌ No `degit` setup exists
- ❌ No initialization wizard

**Current setup = Clone and hope it works** (but has missing dependencies!)

---

## Recommendations

### Phase 1 (Immediate): Document Reality

1. **Fix Installation.md** to explain:
   - This is a framework, not a ready-to-run app
   - Missing files are intentional (you implement them)
   - The registries/config start empty

2. **Add clear separation in README.md**:
   ```markdown
   ## Two Ways to Use Motus

   ### Option A: Use as Example (clone)
   - Clone this repo
   - Study the structure
   - Copy patterns to your own repo

   ### Option B: Framework-only (coming soon)
   - `npx create-motus my-automation`
   - Gets only framework files
   - Clean slate for your implementation
   ```

### Phase 2 (Near Future): Build Proper Scaffolding

Create `create-motus` package:
```bash
npx create-motus my-automation
```

**What it should INCLUDE:**
```
✅ lib/                 # Core framework
✅ templates/           # Templates
✅ .claude/agents/      # Creator wizards
✅ .claude/commands/    # Commands
✅ oauth-manager/       # OAuth server
✅ config/             # Empty registries
✅ .env.example        # Config template
✅ package.json        # Core dependencies only
```

**What it should EXCLUDE:**
```
❌ .github/            # Project CI/CD
❌ public-docs/        # Host online instead
❌ tests/              # Framework tests
❌ Hardcoded examples  # No /Users/ianwinscom paths
❌ Pre-built departments
```

**What it should GENERATE:**
```
✨ README.md           # About YOUR automation
✨ .gitignore         # Your ignore rules
✨ docs/              # Your documentation folder
```

---

## Decision

**Recommended Path: Option 1 (create-motus package)**

This provides:
- Clean separation between framework and user implementation
- Familiar developer experience (like create-react-app, create-next-app)
- Ability to version the framework separately
- Generated user files that are truly theirs

Phase 1 documentation updates should happen immediately to avoid user confusion with current state.

---

## The Prompt Configuration Problem

### Issue Discovered
`.claude/commands/motus.md` contains hardcoded user-specific configuration that makes it non-portable:

**Hardcoded values (doesn't work for other users):**
```
Line 11: /Users/ianwinscom/motus/.claude/agents/
Line 138: /Users/ianwinscom/motus/.claude/agents/
Line 204-223: /Users/ianwinscom/motus/life-admin/workflow-system.js
Line 322: Weather Location: Chiang Mai, TH
Line 323: Timezone: Asia/Bangkok
Line 324: Obsidian Vault: /Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents
```

### The Constraint

**This is NOT traditional code** - it's a prompt file (markdown) that Claude Code interprets.
- No variables like `$HOME` or `${USER}`
- No JavaScript/programming logic
- Can't do conditional `if/else`
- It's declarative, not imperative

Think: **CSS vs JavaScript problem**
- CSS = Declarative (limited logic)
- JavaScript = Imperative (full logic)
- Prompts = Declarative + AI inference

### Potential Solutions (Prompt-Based Paradigm)

#### Option 1: Reference External Config Files
**Approach:** Instruct Claude to read configuration from machine-readable files

```markdown
## Environment Configuration
IMPORTANT: Read configuration from these files:
1. Read `.env` for API keys and user paths
2. Read `config.json` for system settings
3. Use values from these files, NOT hardcoded values

Example:
- Weather location: Read from `.env` WEATHER_LOCATION
- Timezone: Read from `config.json` settings.timezone
- Obsidian vault: Read from `.env` OBSIDIAN_VAULT_PATH
```

**Pros:**
- ✅ Works within LLM capabilities (Claude can read files)
- ✅ Separates config from logic
- ✅ Standard pattern developers understand

**Cons:**
- ❌ Adds overhead (file reads on every command)
- ❌ Relies on Claude following instructions correctly
- ❌ Still requires user to configure .env properly

#### Option 2: Dynamic Path Detection
**Approach:** Instruct Claude to detect the current environment

```markdown
## Path Configuration
NEVER use hardcoded paths. Instead:
1. Detect current working directory with `pwd`
2. Use relative paths: `.claude/agents/`, `./config/registries/`
3. For user home: Use `echo $HOME` to detect dynamically

Example:
- Agent path: `$(pwd)/.claude/agents/`
- Config path: `$(pwd)/config/registries/`
```

**Pros:**
- ✅ Works automatically for any user
- ✅ No configuration required
- ✅ Relative paths are portable

**Cons:**
- ❌ Assumes user runs commands from project root
- ❌ Breaks if working directory changes
- ❌ Doesn't solve timezone/location config

#### Option 3: Registry-First + Graceful Degradation
**Approach:** Check what exists, fail gracefully if missing

```markdown
## Agent Discovery
DO NOT assume agents exist. Instead:
1. Check `config/registries/agents.json` for available agents
2. If empty, guide user: "No agents found. Create with: /motus department create [name]"
3. Only reference agents that exist in the registry

## Configuration
If config values are missing:
1. Check `.env` first
2. If not found, use generic defaults or prompt user
3. Never fail silently with wrong values
```

**Pros:**
- ✅ Fails gracefully for new users
- ✅ Self-documenting (tells user what's missing)
- ✅ Works with empty registries

**Cons:**
- ❌ More verbose prompts
- ❌ Requires smarter prompt logic
- ❌ User experience depends on Claude's inference

#### Option 4: Templated Prompts (Meta-Prompts)
**Approach:** Generate the prompt file from a template on init

```markdown
# Template: .claude/commands/motus.md.hbs
Environment Configuration (generated from .env):
- Weather Location: {{WEATHER_LOCATION}}
- Timezone: {{TIMEZONE}}
- Obsidian Vault: {{OBSIDIAN_VAULT_PATH}}
```

Run on `/motus init`:
1. Read `.env` values
2. Process Handlebars template
3. Generate personalized `motus.md`

**Pros:**
- ✅ Clean separation: template vs generated
- ✅ Fast (no runtime file reads)
- ✅ User gets a personalized prompt file

**Cons:**
- ❌ Requires template processing system
- ❌ Must regenerate if config changes
- ❌ More complex build step

#### Option 5: Two-Tier Command System
**Approach:** Split generic commands from configured features

```
.claude/commands/
├── motus-core.md        # Generic: init, help, department create
├── motus-life.md        # Life-specific (requires config)
├── motus-marketing.md   # Marketing-specific (requires config)
```

Generic commands work out-of-box.
Department commands generated by wizards.

**Pros:**
- ✅ Core always works
- ✅ Department commands are user-created
- ✅ Natural separation of concerns

**Cons:**
- ❌ More command files to manage
- ❌ Requires clear docs on which commands need setup
- ❌ More complex architecture

### Recommended Hybrid Solution

**Combine Options 2 + 3 + 5:**

1. **Use relative paths everywhere** (Option 2)
   - No hardcoded absolute paths
   - Works from project root

2. **Registry-first logic** (Option 3)
   - Check registries before assuming agents exist
   - Graceful failure with helpful messages

3. **Two-tier commands** (Option 5)
   - Core commands in `motus.md` (init, department create, help)
   - Department-specific commands generated by wizards
   - Each department gets its own command file after creation

4. **Reference .env where needed** (Option 1)
   - For API keys and personal paths
   - Prompt instructs Claude to read .env explicitly
   - Example: "Read WEATHER_LOCATION from .env"

### Implementation Notes

**What this means for the framework:**

1. **Clean .claude/commands/motus.md**
   - Remove all hardcoded paths
   - Remove specific agent references
   - Remove personal config (Chiang Mai, etc.)
   - Keep only generic creation commands

2. **Move Life department to example**
   - `examples/life-department/` folder
   - Show users how to build one
   - NOT included in core framework

3. **Documentation changes**
   - Explain: Framework is empty by design
   - First step: Create your first department
   - Department creation generates its command files

4. **Template updates**
   - Department wizard generates department command file
   - Command file references only that department's agents
   - Each user builds their own command structure

This is a **declarative configuration problem** solved through AI inference + smart defaults, not traditional programming.

---

## Preparation for Fresh Conversations ✅

**Date:** 2025-10-12

**Changes made to prepare CLAUDE.md for future sessions:**

### 1. Added "Fresh Installation State" Section to CLAUDE.md
- ✅ Warns about empty registries
- ✅ Lists what works immediately vs what needs setup
- ✅ Provides first-time setup flow
- ✅ Warns about `.claude/commands/motus.md` having hardcoded example data
- ✅ Tells future Claude sessions to check registries before executing commands

### 2. Configured User-Specific Values
**`.env`**
- ✅ Set `WEATHER_LOCATION=Bangkok`
- ✅ Set `TIMEZONE=Asia/Bangkok`
- ⚠️ Other API keys still need user to add (intentional)

**`config.json`**
- ✅ Set `timezone: Asia/Bangkok`
- ✅ Removed Ian's "life" department section
- ✅ Clean JSON, ready for user's departments

### 3. Known Issues Documented
**`.claude/commands/motus.md`** - NOT fixed (too large, 329 lines)
- Contains 7+ hardcoded `/Users/ianwinscom/` paths
- References non-existent agents (weather-fetcher, etc.)
- Has Chiang Mai/Bangkok config
- **Decision:** Leave as-is, CLAUDE.md warns future sessions about it

### What Future Claude Sessions Will Know
1. Registries start empty by design
2. Must create departments before department commands work
3. Don't trust all commands in motus.md
4. Check what exists before executing
5. User is David (Bangkok, Asia/Bangkok timezone)

### What User Still Needs to Do
1. Add API keys to `.env` as needed
2. Set Obsidian vault path if using Obsidian
3. Create first department: `/motus department create [name]`
4. Build their automation from there

**Status:** Ready for fresh conversation sessions ✅
