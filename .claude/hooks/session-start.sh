#!/bin/bash

# Session start hook - loads context when Claude Code starts
# Provides information about the Motus system and scheduled tasks

INPUT=$(cat)
SOURCE=$(echo "$INPUT" | jq -r '.source // "startup"' 2>/dev/null)

# Generate context based on session start type
case "$SOURCE" in
    "startup")
        CONTEXT="Welcome to Motus Life & Business Automation System!

Available commands:
• /motus daily-brief - Generate morning briefing (scheduled for 6 AM)
• /motus evening-report - Generate evening report (scheduled for 9 PM)
• /motus terminal - Launch web interface
• /motus help - Show all commands

Today's date: $(date '+%B %d, %Y')
Current time: $(date '+%I:%M %p')"
        ;;
    "resume")
        CONTEXT="Resuming Motus session...
Current time: $(date '+%I:%M %p')"
        ;;
    "clear")
        CONTEXT="Session cleared. Motus system ready.
Current time: $(date '+%I:%M %p')"
        ;;
    *)
        CONTEXT=""
        ;;
esac

if [[ -n "$CONTEXT" ]]; then
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$CONTEXT"
  }
}
EOF
fi

exit 0