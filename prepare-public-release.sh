#!/bin/bash

##############################################################################
# Motus Public Release Cleanup Script
# Based on: docs/PUBLIC-RELEASE-PLAN.md
# Purpose: Remove personal implementation, keep only the creation system
##############################################################################

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Motus Public Release Cleanup Script                     ║${NC}"
echo -e "${BLUE}║   Removes personal implementation, keeps creation system   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# STEP 1: CREATE BACKUP
##############################################################################

echo -e "${YELLOW}[1/10] Creating backup...${NC}"
BACKUP_FILE="$HOME/motus-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    . 2>/dev/null || true

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

##############################################################################
# STEP 2: REMOVE PERSONAL DIRECTORIES
##############################################################################

echo -e "${YELLOW}[2/10] Removing personal directories...${NC}"

declare -a DIRS_TO_REMOVE=(
    "life-admin"
    "marketing"
    "data"
    "archive"
)

for dir in "${DIRS_TO_REMOVE[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo -e "${GREEN}  ✓ Removed: $dir/${NC}"
    else
        echo -e "  ⊘ Not found: $dir/"
    fi
done

##############################################################################
# STEP 3: REMOVE PERSONAL AGENT FILES
##############################################################################

echo -e "${YELLOW}[3/10] Removing personal agent files...${NC}"

# Agents to KEEP (creation system)
declare -a KEEP_AGENTS=(
    "department-creator.md"
    "agent-creator.md"
    "workflow-creator.md"
    "documentation-updater.md"
)

# Remove all agents except the ones we keep
cd .claude/agents/
for agent_file in *.md; do
    KEEP=false
    for keep_agent in "${KEEP_AGENTS[@]}"; do
        if [ "$agent_file" == "$keep_agent" ]; then
            KEEP=true
            break
        fi
    done

    if [ "$KEEP" == false ]; then
        rm -f "$agent_file"
        echo -e "${GREEN}  ✓ Removed: .claude/agents/$agent_file${NC}"
    fi
done

echo -e "${BLUE}  ℹ Kept creator agents: ${KEEP_AGENTS[*]}${NC}"
cd "$SCRIPT_DIR"

##############################################################################
# STEP 4: CLEAN REGISTRIES
##############################################################################

echo -e "${YELLOW}[4/10] Cleaning registries to empty state...${NC}"

# departments.json
cat > config/registries/departments.json << 'EOF'
{
  "departments": {},
  "metadata": {
    "totalDepartments": 0,
    "lastUpdated": "2025-10-08T00:00:00.000Z",
    "version": "1.0.0"
  }
}
EOF
echo -e "${GREEN}  ✓ Cleaned: config/registries/departments.json${NC}"

# agents.json
cat > config/registries/agents.json << 'EOF'
{
  "agents": {},
  "metadata": {
    "totalAgents": 0,
    "lastUpdated": "2025-10-08T00:00:00.000Z",
    "version": "1.0.0"
  }
}
EOF
echo -e "${GREEN}  ✓ Cleaned: config/registries/agents.json${NC}"

# workflows.json
cat > config/registries/workflows.json << 'EOF'
{
  "workflows": {},
  "metadata": {
    "totalWorkflows": 0,
    "lastUpdated": "2025-10-08T00:00:00.000Z",
    "version": "1.0.0"
  }
}
EOF
echo -e "${GREEN}  ✓ Cleaned: config/registries/workflows.json${NC}"

##############################################################################
# STEP 5: CREATE .env.example
##############################################################################

echo -e "${YELLOW}[5/10] Creating .env.example...${NC}"

cat > .env.example << 'EOF'
# Motus Environment Configuration Template
# Copy this file to .env and fill in your actual values
# DO NOT commit .env to git!

# ============================================================================
# WEATHER API
# ============================================================================
# Get free API key from: https://www.weatherapi.com/
WEATHER_API_KEY=your_weather_api_key_here
WEATHER_LOCATION=Your_City_Name

# ============================================================================
# GOOGLE SERVICES (Calendar, Gmail)
# ============================================================================
# Setup: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=auto_generated_after_oauth

# ============================================================================
# NOTION
# ============================================================================
# Setup: https://www.notion.so/my-integrations
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_database_id

# ============================================================================
# OBSIDIAN
# ============================================================================
# Path to your Obsidian vault
OBSIDIAN_VAULT_PATH=/path/to/your/obsidian/vault
OBSIDIAN_DAILY_NOTES_FOLDER=Daily

# ============================================================================
# OURA RING
# ============================================================================
# Setup via OAuth Manager at localhost:3001
OURA_CLIENT_ID=your_oura_client_id
OURA_CLIENT_SECRET=your_oura_client_secret
OURA_ACCESS_TOKEN=auto_generated_after_oauth

# ============================================================================
# SYSTEM
# ============================================================================
TIMEZONE=America/New_York
DATA_DIR=./data
LOG_LEVEL=info
EOF

echo -e "${GREEN}  ✓ Created: .env.example${NC}"

##############################################################################
# STEP 6: REMOVE GENERATED DOCUMENTATION
##############################################################################

echo -e "${YELLOW}[6/10] Removing generated documentation...${NC}"

if [ -d "org-docs/departments" ]; then
    rm -rf org-docs/departments/*.md 2>/dev/null || true
    echo -e "${GREEN}  ✓ Removed: org-docs/departments/*.md${NC}"
fi

if [ -f "org-docs/COMMANDS_REFERENCE.md" ]; then
    rm -f org-docs/COMMANDS_REFERENCE.md
    echo -e "${GREEN}  ✓ Removed: org-docs/COMMANDS_REFERENCE.md${NC}"
fi

# Keep directory structure with .gitkeep
touch org-docs/departments/.gitkeep
echo -e "${GREEN}  ✓ Added: org-docs/departments/.gitkeep${NC}"

##############################################################################
# STEP 7: UPDATE .gitignore
##############################################################################

echo -e "${YELLOW}[7/10] Updating .gitignore...${NC}"

# Check if entries already exist
if ! grep -q "# Personal Data - DO NOT COMMIT" .gitignore 2>/dev/null; then
    cat >> .gitignore << 'EOF'

# ============================================================================
# Personal Data - DO NOT COMMIT
# ============================================================================
.env
.env.local
data/
life-admin/
marketing/
org-docs/departments/*.md
!docs/examples/
~/.motus/
.motus/

# Keep example files
!.env.example
!org-docs/departments/.gitkeep
EOF
    echo -e "${GREEN}  ✓ Updated: .gitignore${NC}"
else
    echo -e "${BLUE}  ℹ .gitignore already has personal data section${NC}"
fi

##############################################################################
# STEP 8: SANITIZE CLAUDE.md
##############################################################################

echo -e "${YELLOW}[8/10] Sanitizing CLAUDE.md (removing personal content)...${NC}"

# Create backup of CLAUDE.md
cp CLAUDE.md CLAUDE.md.backup

# Remove personal sections (we'll keep architecture, remove personal prefs)
# This is a simplified version - you may want to manually review
if grep -q "Personal Configuration" CLAUDE.md; then
    # Remove from "## Personal Configuration" to end of file
    sed -i.bak '/## Personal Configuration/,$d' CLAUDE.md
    echo -e "${GREEN}  ✓ Removed personal configuration section${NC}"
fi

##############################################################################
# STEP 9: REMOVE .env FILE
##############################################################################

echo -e "${YELLOW}[9/10] Removing .env file (keeping .env.example)...${NC}"

if [ -f ".env" ]; then
    rm -f .env
    echo -e "${GREEN}  ✓ Removed: .env${NC}"
    echo -e "${BLUE}  ℹ Backed up in: $BACKUP_FILE${NC}"
else
    echo -e "  ⊘ .env not found (already clean)"
fi

##############################################################################
# STEP 10: SUMMARY
##############################################################################

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    CLEANUP COMPLETE                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Cleanup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}BACKUP LOCATION:${NC}"
echo -e "  $BACKUP_FILE"
echo ""
echo -e "${YELLOW}WHAT WAS REMOVED:${NC}"
echo -e "  • Personal directories: life-admin/, marketing/, data/, archive/"
echo -e "  • Personal agent files (kept only 4 creator agents)"
echo -e "  • Registries cleaned to empty state"
echo -e "  • Generated documentation removed"
echo -e "  • .env file removed (use .env.example as template)"
echo ""
echo -e "${YELLOW}WHAT WAS KEPT (THE PRODUCT):${NC}"
echo -e "  ✓ lib/ (registry-manager, template-engine, etc.)"
echo -e "  ✓ templates/ (all templates)"
echo -e "  ✓ oauth-manager/ (OAuth Manager server)"
echo -e "  ✓ .claude/agents/ (creator agents only)"
echo -e "  ✓ config/ (empty registries)"
echo -e "  ✓ public-docs/ (user documentation)"
echo -e "  ✓ README.md"
echo -e "  ✓ package.json"
echo -e "  ✓ motus executable"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "  1. Review changes: git status"
echo -e "  2. Test creation system: /motus department create test-dept"
echo -e "  3. Copy .env.example to .env and configure"
echo -e "  4. Review and update PROJECT_OVERVIEW.md"
echo -e "  5. Commit: git add . && git commit -m 'Prepare for public release'"
echo ""
echo -e "${BLUE}To restore backup if needed:${NC}"
echo -e "  tar -xzf $BACKUP_FILE -C /path/to/restore/"
echo ""

##############################################################################
# VALIDATION
##############################################################################

echo -e "${YELLOW}VALIDATION:${NC}"
echo -e "  Remaining agent files: $(ls -1 .claude/agents/*.md 2>/dev/null | wc -l)"
echo -e "  Expected: 4 (department-creator, agent-creator, workflow-creator, documentation-updater)"
echo ""

# Count what's left
AGENT_COUNT=$(ls -1 .claude/agents/*.md 2>/dev/null | wc -l)
if [ "$AGENT_COUNT" -eq 4 ]; then
    echo -e "${GREEN}✓ Agent count correct!${NC}"
else
    echo -e "${RED}⚠ Expected 4 agents, found $AGENT_COUNT${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Motus is now ready for public release!${NC}"
echo ""
