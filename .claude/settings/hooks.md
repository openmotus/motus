# Claude Code Hooks Configuration

## Scheduled Hooks

These hooks run automatically at specified times using Claude Code's scheduling system.

### Daily Briefing - 6:00 AM
```yaml
trigger: schedule
cron: "0 6 * * *"
command: /motus daily-brief
description: Generate comprehensive morning briefing with weather, calendar, emails, and tasks
timezone: Asia/Bangkok
enabled: true
```

### Evening Report - 9:00 PM  
```yaml
trigger: schedule
cron: "0 21 * * *"
command: /motus evening-report
description: Generate evening report with accomplishments and tomorrow's preview
timezone: Asia/Bangkok
enabled: true
```

## Setup Instructions

1. **Enable Hooks in Claude Code**:
   ```bash
   claude-code hooks enable
   ```

2. **Register the Scheduled Hooks**:
   ```bash
   claude-code hooks add daily-brief --schedule "0 6 * * *" --command "/motus daily-brief"
   claude-code hooks add evening-report --schedule "0 21 * * *" --command "/motus evening-report"
   ```

3. **Verify Hooks are Active**:
   ```bash
   claude-code hooks list
   ```

4. **Manual Trigger for Testing**:
   ```bash
   claude-code hooks trigger daily-brief
   claude-code hooks trigger evening-report
   ```

## Alternative: System Cron Setup

If Claude Code hooks are not available, use system crontab:

1. Open crontab editor:
   ```bash
   crontab -e
   ```

2. Add these lines:
   ```cron
   # Daily Brief at 6:00 AM
   0 6 * * * cd /Users/ianwinscom/motus && /usr/local/bin/claude-code run "/motus daily-brief" >> /Users/ianwinscom/motus/logs/daily-brief.log 2>&1
   
   # Evening Report at 9:00 PM
   0 21 * * * cd /Users/ianwinscom/motus && /usr/local/bin/claude-code run "/motus evening-report" >> /Users/ianwinscom/motus/logs/evening-report.log 2>&1
   ```

3. Save and exit the editor

## Hook Execution Flow

### Daily Brief (6:00 AM)
1. Launches daily-brief-orchestrator
2. Parallel execution of:
   - weather-fetcher
   - calendar-fetcher
   - email-processor
   - task-compiler
   - quote-fetcher
3. Runs insight-generator
4. Creates/updates Obsidian daily note

### Evening Report (9:00 PM)
1. Launches evening-report-orchestrator
2. Parallel execution of:
   - note-reader
   - tomorrow-weather
   - tomorrow-calendar
3. Runs accomplishment-analyzer
4. Appends report to daily note

## Monitoring

Check hook execution logs:
```bash
# Claude Code logs
claude-code hooks logs daily-brief
claude-code hooks logs evening-report

# Or check system logs
tail -f /Users/ianwinscom/motus/logs/daily-brief.log
tail -f /Users/ianwinscom/motus/logs/evening-report.log
```

## Troubleshooting

- **Hook not firing**: Check timezone settings and Claude Code daemon status
- **Authentication errors**: Ensure Google OAuth tokens are valid
- **File not found**: Verify all paths are absolute
- **Date format issues**: Check that agents use "Month Day, Year" format