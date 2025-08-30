# Motus Trigger Scripts

These scripts allow external applications to trigger Motus commands through Claude CLI.

## Available Scripts

- `motus-daily-brief.sh` - Generate morning briefing with weather, calendar, emails, tasks
- `motus-daily-notion.sh` - Create daily briefing in Notion database
- `motus-evening-report.sh` - Generate evening accomplishment report
- `motus-life-calendar.sh` - Display today's calendar events
- `motus-life-emails.sh` - Show important emails summary
- `motus-life-tasks.sh` - Display prioritized task dashboard
- `motus-life-health.sh` - Show health metrics from Oura

## Usage Examples

### From Node.js
```javascript
const { exec } = require('child_process');

// Trigger daily briefing
exec('/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log('Daily Briefing:', stdout);
});

// Get calendar events
exec('/Users/ianwinscom/slashmotus/triggers/motus-life-calendar.sh', (error, stdout, stderr) => {
  console.log('Calendar:', stdout);
});
```

### From Python
```python
import subprocess

# Trigger daily briefing
result = subprocess.run(
    ['/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh'],
    capture_output=True,
    text=True
)
print("Daily Briefing:", result.stdout)

# Get health metrics
result = subprocess.run(
    ['/Users/ianwinscom/slashmotus/triggers/motus-life-health.sh'],
    capture_output=True,
    text=True
)
print("Health Metrics:", result.stdout)
```

### From AppleScript/Shortcuts
```applescript
-- Trigger daily briefing
do shell script "/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh"

-- Get calendar
do shell script "/Users/ianwinscom/slashmotus/triggers/motus-life-calendar.sh"
```

### From Cron
```bash
# Add to crontab with: crontab -e

# Daily briefing at 6 AM
0 6 * * * /Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh

# Evening report at 9 PM
0 21 * * * /Users/ianwinscom/slashmotus/triggers/motus-evening-report.sh

# Health check every 4 hours
0 */4 * * * /Users/ianwinscom/slashmotus/triggers/motus-life-health.sh
```

### From Raycast
Create a Raycast script command:
```bash
#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Daily Briefing
# @raycast.mode fullOutput

/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh
```

### From Alfred Workflow
1. Create a new workflow
2. Add a "Run Script" action
3. Set script to: `/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh`
4. Connect to a keyword trigger

### From Keyboard Maestro
1. Create a new macro
2. Add "Execute Shell Script" action
3. Set script path to any trigger script
4. Assign a hotkey or trigger

### From iOS Shortcuts (via SSH)
```
Run Script Over SSH:
Host: your-mac.local
Script: /Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh
```

### From Swift/macOS App
```swift
import Foundation

let task = Process()
task.launchPath = "/bin/bash"
task.arguments = ["-c", "/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh"]

let pipe = Pipe()
task.standardOutput = pipe
task.launch()

let data = pipe.fileHandleForReading.readDataToEndOfFile()
let output = String(data: data, encoding: .utf8)
print(output ?? "")
```

### From Go
```go
package main

import (
    "fmt"
    "os/exec"
)

func main() {
    cmd := exec.Command("/Users/ianwinscom/slashmotus/triggers/motus-daily-brief.sh")
    output, err := cmd.Output()
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(string(output))
}
```

## Notes

- All scripts use the `--print` flag for non-interactive output
- Scripts automatically change to the slashmotus directory for proper context
- Claude CLI must be installed and configured
- Ensure your Claude session has necessary permissions and API keys configured

## Troubleshooting

If a script doesn't work:
1. Check that Claude CLI is installed: `which claude`
2. Verify the script is executable: `ls -la /Users/ianwinscom/slashmotus/triggers/`
3. Test Claude directly: `claude /motus life calendar --print`
4. Check Claude configuration: `~/.claude/config.json`