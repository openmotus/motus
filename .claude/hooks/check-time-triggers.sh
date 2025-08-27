#!/bin/bash

# Check if it's time to run scheduled tasks based on user prompts
# This hook runs on every user prompt to check if scheduled tasks should trigger

# Read input from stdin
INPUT=$(cat)
CURRENT_HOUR=$(date +%H)
CURRENT_MIN=$(date +%M)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""' 2>/dev/null)

# Check if prompt mentions checking time or status
if [[ "$PROMPT" =~ (time|status|schedule|what.*now) ]]; then
    # Add context about scheduled tasks
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Scheduled Tasks:\n• Daily Brief runs at 6:00 AM\n• Evening Report runs at 9:00 PM\nCurrent time: $(date '+%I:%M %p')"
  }
}
EOF
fi

# Check if it's time for daily brief (6:00-6:05 AM)
if [[ "$CURRENT_HOUR" == "06" ]] && [[ "$CURRENT_MIN" -le "05" ]]; then
    # Check if daily brief was already run today
    LAST_RUN_FILE="$HOME/.claude/last-daily-brief"
    TODAY=$(date +%Y-%m-%d)
    
    if [[ ! -f "$LAST_RUN_FILE" ]] || [[ "$(cat $LAST_RUN_FILE 2>/dev/null)" != "$TODAY" ]]; then
        # Suggest running daily brief
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "🌅 It's 6 AM - time for your daily brief! You can run: /motus daily-brief"
  }
}
EOF
        echo "$TODAY" > "$LAST_RUN_FILE"
    fi
fi

# Check if it's time for evening report (9:00-9:05 PM)
if [[ "$CURRENT_HOUR" == "21" ]] && [[ "$CURRENT_MIN" -le "05" ]]; then
    # Check if evening report was already run today
    LAST_RUN_FILE="$HOME/.claude/last-evening-report"
    TODAY=$(date +%Y-%m-%d)
    
    if [[ ! -f "$LAST_RUN_FILE" ]] || [[ "$(cat $LAST_RUN_FILE 2>/dev/null)" != "$TODAY" ]]; then
        # Suggest running evening report
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "🌙 It's 9 PM - time for your evening report! You can run: /motus evening-report"
  }
}
EOF
        echo "$TODAY" > "$LAST_RUN_FILE"
    fi
fi

exit 0