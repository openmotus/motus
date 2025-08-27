#!/bin/bash

# Wrapper script to run Motus commands through Claude Code
# This ensures the proper agent orchestration runs

# Set up environment
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export HOME="/Users/ianwinscom"
cd /Users/ianwinscom/slashmotus

# Command to run (passed as first argument)
COMMAND=$1
LOGFILE="/Users/ianwinscom/slashmotus/logs/automation-$(date +%Y%m%d).log"

# Create logs directory if it doesn't exist
mkdir -p /Users/ianwinscom/slashmotus/logs

# Log execution start
echo "=================================================" >> "$LOGFILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting: $COMMAND" >> "$LOGFILE"

# Execute the workflow
case "$COMMAND" in
    "daily-brief")
        echo "Running Daily Brief workflow..." >> "$LOGFILE"
        # Run the daily brief workflow
        node /Users/ianwinscom/slashmotus/run-automated-workflow.js daily-brief >> "$LOGFILE" 2>&1
        ;;
    "evening-report")
        echo "Running Evening Report workflow..." >> "$LOGFILE"
        # Run the evening report workflow
        node /Users/ianwinscom/slashmotus/run-automated-workflow.js evening-report >> "$LOGFILE" 2>&1
        ;;
    *)
        echo "Unknown command: $COMMAND" >> "$LOGFILE"
        exit 1
        ;;
esac

# Log completion
RESULT=$?
if [ $RESULT -eq 0 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Completed successfully: $COMMAND" >> "$LOGFILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Failed with exit code $RESULT: $COMMAND" >> "$LOGFILE"
fi
echo "" >> "$LOGFILE"

exit $RESULT