#!/bin/bash

# Check for scheduled tasks when Claude stops responding
# This ensures scheduled tasks aren't forgotten

INPUT=$(cat)
CURRENT_HOUR=$(date +%H)
CURRENT_MIN=$(date +%M)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)

# Don't run if already in a stop hook to prevent infinite loops
if [[ "$STOP_HOOK_ACTIVE" == "true" ]]; then
    exit 0
fi

# Check if daily brief should have run (after 6:10 AM)
if [[ "$CURRENT_HOUR" -ge "06" ]] && [[ "$CURRENT_HOUR" -lt "12" ]]; then
    TODAY=$(date +%Y-%m-%d)
    DAILY_NOTE="/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/$(date '+%b %d, %Y').md"
    
    if [[ ! -f "$DAILY_NOTE" ]]; then
        # Daily note doesn't exist yet - suggest running daily brief
        echo "Reminder: Daily brief hasn't run yet today. Consider running: /motus daily-brief" >&2
        exit 2  # Block stop and inform Claude
    fi
fi

# Check if evening report should have run (after 9:10 PM)
if [[ "$CURRENT_HOUR" -ge "21" ]] || [[ "$CURRENT_HOUR" -le "01" ]]; then
    DAILY_NOTE="/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/$(date '+%b %d, %Y').md"
    
    if [[ -f "$DAILY_NOTE" ]]; then
        # Check if evening report section exists
        if ! grep -q "## 🌙 Evening Report" "$DAILY_NOTE" 2>/dev/null && ! grep -q "## Evening Report" "$DAILY_NOTE" 2>/dev/null; then
            echo "Reminder: Evening report hasn't been added to today's note. Consider running: /motus evening-report" >&2
            exit 2  # Block stop and inform Claude
        fi
    fi
fi

exit 0