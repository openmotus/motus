# Life Department

Personal life management including daily briefings, calendar, email, health tracking, finance management, and goal tracking

**Created**: 1/1/2025
**Status**: active
**Version**: 1.0.0

## Overview

- **Total Agents**: 23
- **Total Workflows**: 4
- **Integrations**: 6

## Responsibilities

### Daily Management

- Generate daily briefings with weather, calendar, emails, tasks
- Create and update Obsidian daily notes
- Process and prioritize emails
- Compile and organize tasks

### Health & Wellness

- Track exercise and fitness metrics
- Monitor sleep quality via Oura Ring
- Manage nutrition and water intake
- Track health goals and habits

### Financial Management

- Track expenses and budgets
- Monitor investments and savings
- Manage bill payments
- Generate financial reports

### Goal Tracking

- Set and monitor personal goals
- Track habit formation
- Celebrate milestones
- Provide progress insights

### Evening Review

- Analyze daily accomplishments
- Review completed tasks
- Prepare tomorrow's plan
- Generate evening summary

## Agents (23)

### Orchestrator (3)

#### Life Admin
- **Name**: `life-admin`
- **Description**: Primary Life Department orchestrator for daily briefings, calendar management, email processing, and Obsidian note creation
- **Tools**: Task, Read, Write, Edit, WebFetch, WebSearch, Bash, Glob, Grep, LS, TodoWrite
- **Used in workflows**: daily-brief, evening-report, daily-notion

#### Daily Brief Orchestrator
- **Name**: `daily-brief-orchestrator`
- **Description**: Master orchestrator for daily briefing - coordinates parallel execution of sub-agents and compiles outputs into final daily note
- **Tools**: Task, Read, Write
- **Used in workflows**: daily-brief

#### Evening Report Orchestrator
- **Name**: `evening-report-orchestrator`
- **Description**: Master orchestrator for evening report - coordinates reading today's note, analyzing accomplishments, and generating summary
- **Tools**: Task, Read
- **Used in workflows**: evening-report

### Data Fetcher (8)

#### Weather Fetcher
- **Name**: `weather-fetcher`
- **Description**: Retrieves current weather information by executing weather-fetcher.js script
- **Tools**: Bash, Read, BashOutput
- **Used in workflows**: daily-brief

#### Calendar Fetcher
- **Name**: `calendar-fetcher`
- **Description**: Retrieves today's calendar events from Google Calendar
- **Tools**: Bash, Read
- **Used in workflows**: daily-brief

#### Tomorrow Calendar
- **Name**: `tomorrow-calendar`
- **Description**: Retrieves tomorrow's calendar events from Google Calendar
- **Tools**: Bash
- **Used in workflows**: evening-report

#### Tomorrow Weather
- **Name**: `tomorrow-weather`
- **Description**: Retrieves tomorrow's weather forecast from WeatherAPI
- **Tools**: Bash
- **Used in workflows**: evening-report

#### Email Processor
- **Name**: `email-processor`
- **Description**: Retrieves and processes important emails from Gmail
- **Tools**: Bash, Read
- **Used in workflows**: daily-brief

#### Quote Fetcher
- **Name**: `quote-fetcher`
- **Description**: Gets an inspirational quote for the daily briefing
- **Tools**: Bash
- **Used in workflows**: daily-brief

#### Oura Fetcher
- **Name**: `oura-fetcher`
- **Description**: Fetches Oura ring sleep data and formats for daily notes
- **Tools**: Bash, Read
- **Used in workflows**: daily-brief

#### Note Reader
- **Name**: `note-reader`
- **Description**: Reads today's Obsidian daily note and extracts contents for analysis
- **Tools**: Read, Bash
- **Used in workflows**: evening-report

### Specialist (12)

#### Daily Planner
- **Name**: `daily-planner`
- **Description**: Schedule optimization and task prioritization specialist for calendar management, time blocking, and daily planning
- **Tools**: Task, Read, Write, Bash, TodoWrite

#### Health Tracker
- **Name**: `health-tracker`
- **Description**: Health and wellness monitoring specialist - tracks fitness, nutrition, sleep, and overall well-being
- **Tools**: Task, Read, Write, Bash, TodoWrite

#### Finance Manager
- **Name**: `finance-manager`
- **Description**: Personal finance and budget management specialist - tracks spending, manages budgets, monitors investments
- **Tools**: Task, Read, Write, Bash, TodoWrite

#### Goal Tracker
- **Name**: `goal-tracker`
- **Description**: Goal setting and progress monitoring specialist - tracks personal and professional goals, celebrates milestones
- **Tools**: Task, Read, Write, Bash, TodoWrite

#### Content Curator
- **Name**: `content-curator`
- **Description**: Information gathering specialist for weather, news, learning resources, and relevant content curation
- **Tools**: Task, WebFetch, WebSearch, Read, Bash

#### Task Compiler
- **Name**: `task-compiler`
- **Description**: Compiles and prioritizes tasks from various sources (calendar, emails, existing task lists) into unified priority list
- **Tools**: Read, Bash
- **Used in workflows**: daily-brief

#### Insight Generator
- **Name**: `insight-generator`
- **Description**: Generates actionable insights and recommendations based on daily briefing data (weather, calendar, tasks, emails)
- **Tools**: Read
- **Used in workflows**: daily-brief

#### Accomplishment Analyzer
- **Name**: `accomplishment-analyzer`
- **Description**: Analyzes today's daily note and extracts completed tasks, accomplishments, and progress metrics
- **Tools**: Read
- **Used in workflows**: evening-report

#### Note Creator
- **Name**: `note-creator`
- **Description**: Creates or updates Obsidian daily note with all compiled briefing information
- **Tools**: Read, Write, Edit, Bash
- **Used in workflows**: daily-brief

#### Note Appender
- **Name**: `note-appender`
- **Description**: Appends evening report to today's Obsidian daily note with accomplishments and tomorrow's info
- **Tools**: Read, Edit, Bash
- **Used in workflows**: evening-report

#### Notion Creator
- **Name**: `notion-creator`
- **Description**: Creates or updates daily briefing in Notion Daily Journal database
- **Tools**: Bash, Read
- **Used in workflows**: daily-notion

#### Evening Review Agent
- **Name**: `evening-review-agent`
- **Description**: Interactive evening review agent that guides through reflection and updates daily notes
- **Tools**: Read, Edit, Bash
- **Used in workflows**: evening-review

## Workflows (4)

### Daily Briefing

Generate comprehensive daily briefing with weather, calendar, emails, tasks, and Oura sleep data

- **Trigger**: scheduled (daily 8:00)
- **Agents**: 8
- **Estimated Duration**: 10 seconds
- **Output**: obsidian-note → Daily/{{date}}.md

**Steps:**

1. **Parallel Execution**
   - `weather-fetcher`: Get current weather and 3-day forecast
   - `calendar-fetcher`: Retrieve today's calendar events
   - `email-processor`: Get important emails from last 24 hours
   - `task-compiler`: Compile and prioritize tasks
   - `oura-fetcher`: Get last night's sleep data
   - `quote-fetcher`: Get inspirational quote

2. **Sequential Execution**
   - `insight-generator`: Analyze collected data and generate actionable insights

3. **Sequential Execution**
   - `note-creator`: Create comprehensive Obsidian daily note with all data

**Run this workflow:**
```bash
/motus life daily-brief
```

### Evening Report

Analyze today's accomplishments and prepare tomorrow's briefing with weather and calendar

- **Trigger**: manual
- **Agents**: 5
- **Estimated Duration**: 8 seconds
- **Output**: obsidian-note → Daily/{{date}}.md

**Steps:**

1. **Parallel Execution**
   - `note-reader`: Read today's daily note
   - `tomorrow-weather`: Get tomorrow's weather forecast
   - `tomorrow-calendar`: Get tomorrow's calendar events

2. **Sequential Execution**
   - `accomplishment-analyzer`: Analyze completed tasks and accomplishments from today's note

3. **Sequential Execution**
   - `note-appender`: Append evening summary with accomplishments and tomorrow's preview to today's note

**Run this workflow:**
```bash
/motus life evening-report
```

### Daily Notion Briefing

Create daily briefing in Notion Daily Journal database with weather, calendar, and tasks

- **Trigger**: manual
- **Agents**: 5
- **Estimated Duration**: 8 seconds
- **Output**: notion-page → {{NOTION_DATABASE_ID}}

**Steps:**

1. **Parallel Execution**
   - `weather-fetcher`: Get current weather
   - `calendar-fetcher`: Get today's calendar events
   - `email-processor`: Get important emails
   - `task-compiler`: Compile tasks

2. **Sequential Execution**
   - `notion-creator`: Create Notion daily journal entry with all collected data

**Run this workflow:**
```bash
/motus life daily-notion
```

### Evening Review

Interactive evening review with guided reflection and daily note updates

- **Trigger**: manual
- **Agents**: 1
- **Estimated Duration**: 5 minutes (interactive)
- **Output**: obsidian-note → Daily/{{date}}.md

**Steps:**

1. **Sequential Execution**
   - `evening-review-agent`: Guide user through evening reflection and update daily note

**Run this workflow:**
```bash
/motus life evening-review
```

## Integrations

This department requires the following integrations to function properly:

### Google Calendar

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the Google Calendar card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Configure via OAuth Manager at localhost:3001
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLIENT_ID)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/google-calendar-token.json`

### Gmail

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the Gmail card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Configure via OAuth Manager at localhost:3001
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.GOOGLE_CLIENT_ID)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/gmail-token.json`

### WeatherAPI

**Type:** API Key

#### Setup Instructions

1. **Get your API key**
   - Get API key from weatherapi.com

2. **Add to .env file**
   ```bash
   WEATHER_API_KEY=your_api_key_here
   ```

3. **Verify the API key works**
   ```bash
   # Test that the environment variable is set
   echo $WEATHER_API_KEY
   ```

**Required Environment Variables:**
- `WEATHER_API_KEY`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.WEATHER_API_KEY)"`

### Notion

**Type:** API Key

#### Setup Instructions

1. **Get your API key**
   - Create integration at notion.so/my-integrations

2. **Add to .env file**
   ```bash
   NOTION_API_KEY=your_api_key_here
   NOTION_DATABASE_ID=your_api_key_here
   ```

3. **Verify the API key works**
   ```bash
   # Test that the environment variable is set
   echo $NOTION_API_KEY
   ```

**Required Environment Variables:**
- `NOTION_API_KEY`
- `NOTION_DATABASE_ID`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.NOTION_API_KEY)"`

### Oura Ring

**Type:** OAuth 2.0 (Automatic Authorization)

#### Quick Setup (Recommended)

1. **Start the OAuth Manager**
   ```bash
   ./start-oauth-manager.sh
   ```

2. **Open in your browser:** http://localhost:3001

3. **Click "Connect"** on the Oura Ring card

4. **Authorize the application** when redirected

5. **Verify connection** by clicking "Test" button

#### Manual Setup (Advanced)

If you prefer manual configuration:

1. **Get OAuth Credentials**
   - Configure via OAuth Manager at localhost:3001
   - You'll need a Client ID and Client Secret

2. **Add to .env file**
   ```bash
   OURA_ACCESS_TOKEN=your_oura_access_token_here
   ```

3. **Restart OAuth Manager** to pick up new credentials

4. **Follow Quick Setup steps** above to authorize

**Required Environment Variables:**
- `OURA_ACCESS_TOKEN`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.OURA_ACCESS_TOKEN)"`
- If OAuth fails, try disconnecting and reconnecting in the OAuth Manager
- Check token file exists: `~/.motus/oura-ring-token.json`

### Obsidian

**Required Environment Variables:**
- `OBSIDIAN_VAULT_PATH`

**Troubleshooting:**
- Make sure .env file is in the project root: `/Users/ianwinscom/motus/.env`
- Restart any running services after updating .env
- Check that environment variables are loaded: `node -e "require('dotenv').config(); console.log(process.env.OBSIDIAN_VAULT_PATH)"`

### Setup Verification

After configuring integrations, verify they work:

```bash
# Test all integrations for this department
/motus life test-integrations

# Or test specific workflows that use integrations
/motus life evening-report
```

---

*This document is auto-generated from `config/registries/`. Do not edit manually.*
*Last updated: 2025-10-08T05:39:47.442Z*
