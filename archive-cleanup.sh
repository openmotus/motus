#!/bin/bash

# Archive Cleanup Script
# Moves unused files to archive folder while preserving active system

echo "🗂️  Motus Archive Cleanup"
echo "========================="
echo "This will move unused files to an archive folder."
echo "All active components will remain untouched."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Create archive structure
echo "Creating archive folders..."
mkdir -p archive/terminal-app
mkdir -p archive/old-scripts
mkdir -p archive/test-files
mkdir -p archive/old-departments
mkdir -p archive/old-workflows
mkdir -p archive/old-life-admin
mkdir -p archive/old-docs
mkdir -p archive/old-hooks
mkdir -p archive/old-data

# Archive terminal app
if [ -d "terminal-app" ]; then
    echo "Archiving terminal app..."
    mv terminal-app/* archive/terminal-app/ 2>/dev/null
    rm -rf terminal-app
    mv start-terminal.sh archive/terminal-app/ 2>/dev/null
fi

# Archive old Motus scripts
echo "Archiving old scripts..."
[ -f "motus.sh" ] && mv motus.sh archive/old-scripts/
[ -L "motus" ] && mv motus archive/old-scripts/
[ -f "motus-command.js" ] && mv motus-command.js archive/old-scripts/
[ -f "motus-life-cli.js" ] && mv motus-life-cli.js archive/old-scripts/
[ -f "motus-life.js" ] && mv motus-life.js archive/old-scripts/
[ -f "life-department.js" ] && mv life-department.js archive/old-scripts/

# Archive test files
echo "Archiving test files..."
[ -f "test-enhanced.js" ] && mv test-enhanced.js archive/test-files/
[ -f "test-google-connection.js" ] && mv test-google-connection.js archive/test-files/
[ -f "test-google-full-access.js" ] && mv test-google-full-access.js archive/test-files/

# Archive old department structure
if [ -d "departments" ]; then
    echo "Archiving departments folder..."
    mv departments/* archive/old-departments/ 2>/dev/null
    rmdir departments 2>/dev/null
fi

# Archive old lib files
if [ -d "lib" ]; then
    echo "Archiving lib folder..."
    mkdir -p archive/old-lib
    mv lib/* archive/old-lib/ 2>/dev/null
    rmdir lib 2>/dev/null
fi

# Archive old setup scripts
echo "Archiving old setup scripts..."
[ -f "oauth-setup.js" ] && mv oauth-setup.js archive/old-scripts/
[ -f "setup-google-oauth-manual.sh" ] && mv setup-google-oauth-manual.sh archive/old-scripts/

# Archive duplicate/old life-admin scripts
echo "Archiving old life-admin scripts..."
[ -f "life-admin/cli-dashboard.js" ] && mv life-admin/cli-dashboard.js archive/old-life-admin/
[ -f "life-admin/simple-dashboard.js" ] && mv life-admin/simple-dashboard.js archive/old-life-admin/
[ -f "life-admin/health-checkin-interactive.js" ] && mv life-admin/health-checkin-interactive.js archive/old-life-admin/
[ -f "life-admin/evening-review-simple.js" ] && mv life-admin/evening-review-simple.js archive/old-life-admin/
[ -f "life-admin/calendar-supplement-creator.js" ] && mv life-admin/calendar-supplement-creator.js archive/old-life-admin/
[ -f "life-admin/supplement-parser-v2.js" ] && mv life-admin/supplement-parser-v2.js archive/old-life-admin/
[ -f "life-admin/workflows.js" ] && mv life-admin/workflows.js archive/old-life-admin/
[ -f "life-admin/workflow-executor.js" ] && mv life-admin/workflow-executor.js archive/old-life-admin/

# Archive old root workflows folder (if exists and different from life-admin/workflows)
if [ -d "workflows" ]; then
    echo "Archiving root workflows folder..."
    mv workflows/* archive/old-workflows/ 2>/dev/null
    rmdir workflows 2>/dev/null
fi

# Archive old documentation
echo "Archiving old documentation..."
[ -f "PLAN.md" ] && mv PLAN.md archive/old-docs/
[ -f "MOTUS_SETUP_COMPLETE.md" ] && mv MOTUS_SETUP_COMPLETE.md archive/old-docs/
[ -f "LIFE_DEPARTMENT_COMPLETE.md" ] && mv LIFE_DEPARTMENT_COMPLETE.md archive/old-docs/
[ -f "GOOGLE_OAUTH_SETUP.md" ] && mv GOOGLE_OAUTH_SETUP.md archive/old-docs/
[ -f "FINAL_SETUP.md" ] && mv FINAL_SETUP.md archive/old-docs/
if [ -d "docs" ]; then
    [ -f "docs/MOTUS_CLAUDE_CODE_GUIDE.md" ] && mv docs/MOTUS_CLAUDE_CODE_GUIDE.md archive/old-docs/
    [ -f "docs/PLAN.md" ] && mv docs/PLAN.md archive/old-docs/
    rmdir docs 2>/dev/null
fi

# Archive old hooks
echo "Archiving old hooks..."
if [ -d "hooks" ]; then
    mv hooks/* archive/old-hooks/ 2>/dev/null
    rmdir hooks 2>/dev/null
fi

# Archive old data (but keep current briefings and life data)
echo "Archiving old data..."
if [ -d "data/life-workflows" ]; then
    mv data/life-workflows archive/old-data/ 2>/dev/null
fi
if [ -d "data/memory" ]; then
    mv data/memory archive/old-data/ 2>/dev/null
fi

# Check if config.json is being used
echo "Checking config.json..."
if [ -f "config.json" ]; then
    echo "  Note: config.json exists - verify if it's being used before removing"
    # Not moving automatically - let user decide
fi

# Clean up empty directories
echo "Cleaning up empty directories..."
find . -type d -empty -not -path "./archive/*" -not -path "./.git/*" -delete 2>/dev/null

# Create a summary
echo ""
echo "📊 Archive Summary"
echo "=================="
echo "Files have been moved to the 'archive' folder."
echo ""
echo "✅ Active System Preserved:"
echo "  • /motus slash command system"
echo "  • .claude/ folder (commands & agents)"
echo "  • life-admin/ core scripts"
echo "  • Automation scripts (run-motus-command.sh, etc.)"
echo "  • LaunchAgent plists"
echo "  • Environment files (.env)"
echo "  • Master documentation"
echo ""
echo "📦 Archived Categories:"
echo "  • Terminal app → archive/terminal-app/"
echo "  • Old scripts → archive/old-scripts/"
echo "  • Test files → archive/test-files/"
echo "  • Old departments → archive/old-departments/"
echo "  • Old lib files → archive/old-lib/"
echo "  • Old workflows → archive/old-workflows/"
echo "  • Old life-admin → archive/old-life-admin/"
echo "  • Old docs → archive/old-docs/"
echo "  • Old hooks → archive/old-hooks/"
echo ""
echo "💡 To restore any file:"
echo "  mv archive/[category]/[filename] ."
echo ""
echo "✅ Cleanup complete!"