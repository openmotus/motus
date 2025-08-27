#!/bin/bash

# Post file change hook - tracks when Obsidian notes are modified

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""' 2>/dev/null)

# Check if this is an Obsidian daily note
if [[ "$FILE_PATH" =~ "Daily/" ]] && [[ "$FILE_PATH" =~ ".md" ]]; then
    # Log the modification
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Modified: $FILE_PATH" >> "$HOME/.claude/motus-activity.log"
    
    # Check if this was a daily brief or evening report
    if [[ "$FILE_PATH" =~ $(date '+%b %d, %Y').md ]]; then
        if grep -q "## 🌙 Evening Report" "$FILE_PATH" 2>/dev/null; then
            echo "$(date +%Y-%m-%d)" > "$HOME/.claude/last-evening-report"
        fi
        if grep -q "## 🌤️ Weather" "$FILE_PATH" 2>/dev/null; then
            echo "$(date +%Y-%m-%d)" > "$HOME/.claude/last-daily-brief"
        fi
    fi
fi

exit 0