# Example: Daily Briefing System

A complete department that delivers a morning briefing with weather, calendar events, and a compiled summary.

## What This Shows

- Creating a **department** with multiple agents
- Using **data-fetcher** agents for API calls
- Using a **specialist** agent to compile results
- A **workflow** that runs agents in parallel, then sequentially
- How agent definition files (`.md`) connect to implementation scripts (`.js`)

## Structure

```
daily-briefing/
  agents/
    weather-fetcher.md      # Agent definition (Claude Code reads this)
    weather-fetcher.js      # Implementation (agent executes this)
    calendar-fetcher.md
    calendar-fetcher.js
    briefing-creator.md     # Specialist — compiles all data
  workflows/
    morning-briefing.json   # Workflow config
```

## How It Works

1. The **workflow** (`morning-briefing.json`) declares two steps:
   - Step 1 (parallel): `weather-fetcher` and `calendar-fetcher` run simultaneously
   - Step 2 (sequential): `briefing-creator` takes the combined output and formats it

2. Each **data-fetcher** has two files:
   - `.md` — tells Claude Code what the agent does, what tools it has
   - `.js` — the actual script that calls the API and returns data

3. The **specialist** (`briefing-creator`) receives all fetcher outputs and creates the final briefing.

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/daily-briefing departments/
   ```

2. Set your API keys in `.env`:
   ```bash
   WEATHER_API_KEY=your_weatherapi_key    # https://weatherapi.com (free tier)
   GOOGLE_CALENDAR_ID=primary              # or your calendar ID
   ```

3. Run the workflow:
   ```bash
   /motus daily-briefing morning-briefing
   ```

## Adapting This Example

**Add more agents** — email, tasks, news:
```bash
/motus daily-briefing agent create email-fetcher
/motus daily-briefing agent create task-compiler
```

**Change the schedule** — edit `workflows/morning-briefing.json`:
```json
"trigger": { "type": "scheduled", "schedule": "daily 8:00" }
```

**Change the output** — modify `briefing-creator.md` to output to Notion, Obsidian, or Slack instead of the console.
