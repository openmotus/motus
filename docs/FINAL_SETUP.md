# 🎉 Motus Life Department - Final Setup

## ✅ Complete Implementation Status

### 1. Claude Code Slash Command System ✅
- **`/motus` command** properly configured in `.claude/commands/motus.md`
- Full tool access: Task, Read, Write, Edit, Bash, WebFetch, WebSearch, TodoWrite, etc.
- Uses `$ARGUMENTS` for proper parameter passing

### 2. Life Department Sub-Agents ✅
All agents created in `.claude/agents/` with proper tool access:
- **life-admin**: Primary orchestrator with full tool access including Bash
- **daily-planner**: Schedule optimization with Bash access
- **health-tracker**: Wellness monitoring with file access
- **finance-manager**: Budget tracking with system access
- **goal-tracker**: Progress monitoring with TodoWrite
- **content-curator**: Information gathering with web access

### 3. Obsidian Integration ✅
- **Correct date format**: "Aug 26, 2025"
- **Correct path**: `/Users/ianwinscom/Library/Mobile Documents/iCloud~md~obsidian/Documents/Daily/`
- **Automatic creation**: Daily notes created on each briefing

### 4. Weather Integration ✅
- **API Key**: Configured
- **Location**: Chiang Mai, TH
- **Real-time data**: Working in all briefings

## 🔧 Google OAuth Setup (Full Read/Write Access)

### Quick Setup Method
Run the manual setup script:
```bash
./setup-google-oauth-manual.sh
```

This will:
1. Show your Client ID and Secret
2. Guide you through OAuth Playground
3. Help you get the refresh token
4. Tell you where to paste it

### Manual Steps
1. Go to: https://developers.google.com/oauthplayground/
2. Click gear ⚙️ → "Use your own OAuth credentials"
3. Enter:
   - Client ID: `580582062962-g3bb67qrbtsmtbr21ui1eni14v8uq3n5.apps.googleusercontent.com`
   - Client Secret: `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`
4. Select BROADER scopes for full access:
   - Google Calendar API v3:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Gmail API v1:
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.send`
5. Click "Authorize APIs"
6. Click "Exchange authorization code for tokens"
7. Copy the "Refresh token"
8. Update `.env` file:
   ```
   GOOGLE_REFRESH_TOKEN=your_actual_refresh_token_here
   ```

### Test Full Access
After adding refresh token:
```bash
# Test basic connection
node test-google-connection.js

# Test full read/write access
node test-google-full-access.js
```

## 🚀 Using the System

### Primary Command (Claude Code Slash Command)
```
/motus daily-brief
```

This will:
1. Use life-admin agent to orchestrate
2. Fetch real Chiang Mai weather ✅
3. Get Google Calendar events (when OAuth setup) 
4. Process Gmail emails (when OAuth setup)
5. Create Obsidian daily note with proper format ✅
6. Present comprehensive briefing

### Other Commands
```
/motus life review          # Evening review
/motus life plan week       # Weekly planning
/motus life track habit "30 min meditation"
/motus life calendar        # Check calendar
/motus life emails          # Review emails
/motus life tasks           # Prioritized tasks
/motus life health          # Health status
/motus life finance         # Finance snapshot
```

## 📋 What's Working Now

| Feature | Status | Details |
|---------|--------|---------|
| `/motus` slash command | ✅ Working | Proper Claude Code integration |
| Sub-agents | ✅ Working | 6 specialized agents with tools |
| Weather API | ✅ Working | Real Chiang Mai data |
| Obsidian Notes | ✅ Working | Correct format & path |
| Google Calendar | 🔧 Ready | Needs refresh token (full access) |
| Gmail | 🔧 Ready | Needs refresh token (full access) |
| Task Management | ✅ Working | Prioritization active |
| Health Tracking | ✅ Working | Ready for data |
| Finance Tracking | ✅ Working | Ready for data |

## 🎯 Next Steps

1. **Enable Google Services**:
   ```bash
   ./setup-google-oauth-manual.sh
   ```
   Follow the steps to get refresh token and add to `.env`

2. **Test Full System**:
   ```
   /motus daily-brief
   ```
   Should show real calendar and emails after OAuth setup

3. **Set Up Daily Automation**:
   Add to crontab for 8 AM daily briefing:
   ```bash
   crontab -e
   # Add: 0 8 * * * /usr/bin/osascript -e 'tell application "Terminal" to do script "cd /Users/ianwinscom/motus && ./motus daily-brief"'
   ```

## 💡 Architecture Summary

```
/motus (slash command)
  ↓
life-admin (orchestrator agent)
  ↓
Delegates to specialized agents:
  • daily-planner (schedule)
  • health-tracker (wellness)
  • finance-manager (money)
  • goal-tracker (progress)
  • content-curator (info)
  ↓
Creates Obsidian Daily Note
```

## ✨ Your Vision Achieved

✅ **Zero-code operation** - Everything through `/motus` commands
✅ **AI agents** - 6 specialized agents for life management  
✅ **Local & private** - Runs on your machine
✅ **Real integrations** - Weather working, Google ready
✅ **Obsidian sync** - Daily notes in your vault
✅ **Claude Code native** - Proper slash commands and sub-agents

The system is ready for daily use! Just add your Google refresh token to enable calendar and email integration.

---

**Ready to go! Use:** `/motus daily-brief`