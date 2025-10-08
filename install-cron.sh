#!/bin/bash

echo "🤖 Installing Motus Automation via Crontab"
echo "=========================================="

# Create the crontab entries
CRON_ENTRIES="# Motus Life Admin Automation
# Daily Brief at 6:00 AM every day
0 6 * * * /Users/ianwinscom/motus/run-motus-command.sh daily-brief

# Evening Report at 9:00 PM every day
0 21 * * * /Users/ianwinscom/motus/run-motus-command.sh evening-report"

# Backup existing crontab
echo "Backing up existing crontab..."
crontab -l > /tmp/crontab.backup.$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Get current crontab (if it exists) and remove old Motus entries
crontab -l 2>/dev/null | grep -v "Motus Life Admin Automation" | grep -v "run-motus-command.sh" | grep -v "^# Daily Brief" | grep -v "^# Evening Report" > /tmp/new_crontab || true

# Add new entries
echo "" >> /tmp/new_crontab
echo "$CRON_ENTRIES" >> /tmp/new_crontab

# Install the new crontab
crontab /tmp/new_crontab

echo "✅ Crontab installed successfully!"
echo ""
echo "Scheduled tasks:"
echo "  📅 Daily Brief: Every day at 6:00 AM"
echo "  🌙 Evening Report: Every day at 9:00 PM"
echo ""
echo "To verify installation:"
echo "  crontab -l"
echo ""
echo "To test manually:"
echo "  ./run-motus-command.sh daily-brief"
echo "  ./run-motus-command.sh evening-report"
echo ""
echo "Logs are saved to: /Users/ianwinscom/motus/logs/"
echo ""
echo "To uninstall:"
echo "  crontab -l | grep -v 'run-motus-command.sh' | crontab -"