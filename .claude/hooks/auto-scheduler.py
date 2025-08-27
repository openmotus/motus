#!/usr/bin/env python3

"""
Claude Code Auto-Scheduler Hook
Automatically suggests running scheduled tasks at the right time
"""

import json
import sys
import os
from datetime import datetime, time
from pathlib import Path

# Configuration
SCHEDULE = {
    'daily_brief': {
        'time': time(6, 0),  # 6:00 AM
        'command': '/motus daily-brief',
        'marker_file': 'last-daily-brief',
        'check_file': lambda: f"/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/{datetime.now().strftime('%b %d, %Y')}.md",
        'check_content': '## 🌤️ Weather'
    },
    'evening_report': {
        'time': time(21, 0),  # 9:00 PM
        'command': '/motus evening-report',
        'marker_file': 'last-evening-report',
        'check_file': lambda: f"/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/{datetime.now().strftime('%b %d, %Y')}.md",
        'check_content': '## 🌙 Evening Report'
    }
}

def should_run_task(task_name, task_config):
    """Check if a scheduled task should run"""
    now = datetime.now()
    scheduled_time = task_config['time']
    
    # Check if we're within 5 minutes of scheduled time
    current_time = now.time()
    time_diff = abs(
        (current_time.hour * 60 + current_time.minute) - 
        (scheduled_time.hour * 60 + scheduled_time.minute)
    )
    
    if time_diff > 5:
        return False
    
    # Check if already run today
    marker_path = Path.home() / '.claude' / task_config['marker_file']
    today_str = now.strftime('%Y-%m-%d')
    
    if marker_path.exists():
        last_run = marker_path.read_text().strip()
        if last_run == today_str:
            return False
    
    # Check if the task output already exists
    check_file = task_config['check_file']()
    if Path(check_file).exists():
        with open(check_file, 'r') as f:
            content = f.read()
            if task_config['check_content'] in content:
                # Mark as complete for today
                marker_path.write_text(today_str)
                return False
    
    return True

def main():
    try:
        # Read hook input
        input_data = json.load(sys.stdin)
        hook_event = input_data.get('hook_event_name', '')
        
        # Only process on UserPromptSubmit
        if hook_event != 'UserPromptSubmit':
            sys.exit(0)
        
        # Check all scheduled tasks
        suggestions = []
        for task_name, task_config in SCHEDULE.items():
            if should_run_task(task_name, task_config):
                emoji = '🌅' if 'daily' in task_name else '🌙'
                suggestions.append(f"{emoji} It's time for your {task_name.replace('_', ' ')}! Run: {task_config['command']}")
        
        # If there are suggestions, add them as context
        if suggestions:
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": "\n".join(suggestions) + f"\nCurrent time: {datetime.now().strftime('%I:%M %p')}"
                }
            }
            print(json.dumps(output))
        
    except Exception as e:
        # Log errors but don't block
        error_log = Path.home() / '.claude' / 'hook-errors.log'
        with open(error_log, 'a') as f:
            f.write(f"{datetime.now()}: {str(e)}\n")
    
    sys.exit(0)

if __name__ == "__main__":
    main()