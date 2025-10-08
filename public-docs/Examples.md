# Examples

Real-world examples of departments, agents, and workflows you can build with Motus.

> **💡 Important**: These are examples of systems you **CAN BUILD** with Motus, not pre-built features included in the framework. Motus provides the structure (departments, agents, workflows, templates) - you provide the implementation (the actual code for each agent). Each example below shows the commands to create the structure and describes what logic you would implement.

## Life Management Examples

### Example 1: Daily Briefing System

Complete morning briefing with weather, calendar, emails, and tasks.

**Department**: Life

**Agents**:
- `weather-fetcher` - Gets current/forecast weather
- `calendar-fetcher` - Retrieves today's events
- `email-processor` - Finds important emails
- `task-compiler` - Compiles prioritized tasks
- `note-creator` - Creates Obsidian daily note

**Workflow**: `daily-brief`

**How to Build**:

1. Create Life department (if not exists):
```
/motus department create life
```

2. Add weather agent:
```
/motus life agent create weather-fetcher
```
Configure as data-fetcher using WeatherAPI

3. Add calendar agent:
```
/motus life agent create calendar-fetcher
```
Configure as data-fetcher using Google Calendar

4. Add email agent:
```
/motus life agent create email-processor
```
Configure as specialist for email categorization

5. Add task agent:
```
/motus life agent create task-compiler
```
Configure as specialist for task prioritization

6. Add note creator:
```
/motus life agent create note-creator
```
Configure as specialist for Obsidian note creation

7. Create workflow:
```
/motus life workflow create daily-brief
```
- Type: Scheduled
- Schedule: Daily at 7:00 AM
- Agents: All 5 agents
- Pattern: Parallel fetch, sequential creation

**Run It**:
```
/motus life daily-brief
```

### Example 2: Evening Review

Reflect on accomplishments and plan tomorrow.

**Agents**:
- `accomplishment-analyzer` - Extract completed tasks
- `tomorrow-calendar` - Get tomorrow's events
- `tomorrow-weather` - Get tomorrow's forecast
- `note-appender` - Add evening report to note

**Workflow**: `evening-review`

**Schedule**: Daily at 8:00 PM

**Build It**:
```
/motus life workflow create evening-review
```

## Marketing Examples

### Example 3: Social Media Analytics

Daily social media performance report.

**Department**: Marketing

**Agents**:
- `trend-analyzer` - Gets trending topics (Twitter)
- `social-fetcher` - Gets engagement metrics
- `sentiment-analyzer` - Analyzes brand mentions
- `report-creator` - Creates analytics report

**Workflow**: `social-analytics`

**Build**:

1. Create Marketing department:
```
/motus department create marketing
```

2. Create Twitter trends agent:
```
/motus marketing agent create trend-analyzer
```
Uses Twitter API for trending topics

3. Create social metrics agent:
```
/motus marketing agent create social-fetcher
```
Fetches from Twitter, LinkedIn, Facebook

4. Create sentiment agent:
```
/motus marketing agent create sentiment-analyzer
```
Analyzes sentiment of social mentions

5. Create report agent:
```
/motus marketing agent create report-creator
```
Compiles data into formatted report

6. Create workflow:
```
/motus marketing workflow create social-analytics
```
- Type: Scheduled
- Schedule: Daily at 9:00 AM
- Pattern: Parallel data collection

**Output**: Daily report in `/marketing/reports/social-YYYY-MM-DD.md`

### Example 4: Content Creation Pipeline

Automated content ideation to publication.

**Agents**:
- `trend-analyzer` - Find trending topics
- `content-creator` - Generate content ideas
- `seo-optimizer` - Optimize for SEO
- `social-publisher` - Publish to platforms

**Workflow**: `content-pipeline`

**Type**: Manual (run on-demand)

**Build**:
```
/motus marketing workflow create content-pipeline
```

Sequential execution:
1. Get trends
2. Generate ideas
3. Optimize content
4. Publish

**Run**:
```
/motus marketing content-pipeline
```

## Health & Fitness Examples

### Example 5: Weekly Fitness Report

Oura Ring + workout data analysis.

**Department**: Fitness

**Agents**:
- `oura-fetcher` - Gets sleep and activity data
- `workout-analyzer` - Analyzes workout patterns
- `progress-tracker` - Tracks progress vs goals
- `report-creator` - Creates weekly summary

**Workflow**: `weekly-fitness-report`

**Schedule**: Every Monday at 9:00 AM

**Build**:

1. Create Fitness department:
```
/motus department create fitness
```

2. Create Oura agent:
```
/motus fitness agent create oura-fetcher
```

3. Create analysis agents:
```
/motus fitness agent create workout-analyzer
/motus fitness agent create progress-tracker
```

4. Create report agent:
```
/motus fitness agent create report-creator
```

5. Create workflow:
```
/motus fitness workflow create weekly-fitness-report
```

**Output**: Weekly summary with:
- Sleep quality trends
- Activity metrics
- Workout consistency
- Goal progress
- Recommendations

## Business Examples

### Example 6: Email Newsletter

Curated weekly newsletter from bookmarks and articles.

**Department**: Content

**Agents**:
- `bookmark-fetcher` - Gets saved bookmarks
- `article-summarizer` - Summarizes articles
- `category-organizer` - Groups by topic
- `newsletter-creator` - Creates formatted newsletter

**Workflow**: `weekly-newsletter`

**Schedule**: Every Friday at 10:00 AM

**Build**:
```
/motus department create content
/motus content agent create bookmark-fetcher
/motus content agent create article-summarizer
/motus content agent create category-organizer
/motus content agent create newsletter-creator
/motus content workflow create weekly-newsletter
```

### Example 7: Project Status Dashboard

Daily project metrics and team updates.

**Department**: Projects

**Agents**:
- `github-fetcher` - Gets PRs, issues, commits
- `slack-fetcher` - Gets important messages
- `calendar-fetcher` - Gets meetings
- `dashboard-creator` - Creates status dashboard

**Workflow**: `daily-status`

**Schedule**: Weekdays at 8:30 AM

**Output**: Daily dashboard in Notion or Obsidian

## Complete System Examples

### Example 8: Full Life Automation

Complete daily automation system.

**Departments**: Life, Health, Finance

**Morning Routine (7:00 AM)**:
```
/motus life daily-brief
```
- Weather
- Calendar
- Emails
- Tasks
- News highlights

**Midday Check (12:00 PM)**:
```
/motus life midday-check
```
- Lunch suggestions
- Afternoon schedule
- Task progress

**Evening Review (8:00 PM)**:
```
/motus life evening-review
```
- Accomplishments
- Tomorrow's prep
- Health metrics

**Weekly Reports**:
- Monday 9 AM: Fitness summary
- Friday 5 PM: Week review
- Sunday 7 PM: Week planning

### Example 9: Marketing Department

Complete marketing automation.

**Daily (9:00 AM)**:
- Social media analytics
- Trending topics analysis
- Competitor monitoring
- Content performance

**Weekly (Monday 10:00 AM)**:
- Weekly metrics report
- Content calendar planning
- Campaign performance review

**Monthly (1st at 9:00 AM)**:
- Monthly analytics dashboard
- ROI calculations
- Strategy recommendations

## Quick Start Templates

### Template 1: Personal Productivity

```
/motus department create life
/motus life agent create calendar-fetcher
/motus life agent create task-compiler
/motus life agent create note-creator
/motus life workflow create daily-plan
```

### Template 2: Content Marketing

```
/motus department create marketing
/motus marketing agent create trend-analyzer
/motus marketing agent create content-creator
/motus marketing agent create social-publisher
/motus marketing workflow create content-pipeline
```

### Template 3: Health Tracking

```
/motus department create health
/motus health agent create oura-fetcher
/motus health agent create fitness-tracker
/motus health agent create report-creator
/motus health workflow create daily-health-summary
```

## Integration Examples

### Example with Multiple Integrations

**Agents Using**:
- Google Calendar
- Gmail
- Weather API
- Oura Ring
- Notion

**Workflow**:
1. Fetch from all sources in parallel
2. Compile into unified briefing
3. Create in Notion and Obsidian
4. Send summary email (optional)

### Example API Usage

**Weather API**:
```javascript
// In weather-fetcher.js
const response = await axios.get(
  `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${LOCATION}&days=3`
);
```

**Google Calendar**:
```javascript
// In calendar-fetcher.js
const events = await calendar.events.list({
  calendarId: 'primary',
  timeMin: startOfDay,
  timeMax: endOfDay,
  singleEvents: true,
  orderBy: 'startTime'
});
```

**Notion**:
```javascript
// In notion-creator.js
await notion.pages.create({
  parent: { database_id: DATABASE_ID },
  properties: {
    Date: { date: { start: today } },
    Weather: { rich_text: [{ text: { content: weather } }] }
  }
});
```

## Customization Examples

### Custom Agent Example

Create a custom news aggregator:

```
/motus life agent create news-aggregator
```

In the agent script:
- Fetch from multiple news APIs
- Filter by interests
- Summarize articles
- Format for daily note

### Custom Workflow Example

Morning + Evening combined:

```
/motus life workflow create full-day-automation
```

Agents:
1. Morning: weather, calendar, emails, tasks
2. Evening: accomplishments, tomorrow prep, health check

## Real User Examples

### Example: Freelancer Workflow

**Morning**:
- Client emails summary
- Project deadlines
- Time tracking prep

**Afternoon**:
- Invoice reminders
- Project status updates

**Evening**:
- Time logged summary
- Tomorrow's client meetings

### Example: Student Workflow

**Morning**:
- Class schedule
- Assignment deadlines
- Study goals

**Evening**:
- Study time logged
- Assignment progress
- Tomorrow's prep

### Example: Manager Workflow

**Morning**:
- Team updates
- Meeting prep
- Priority tasks

**Afternoon**:
- Slack important messages
- GitHub PR reviews

**Evening**:
- Team accomplishments
- Tomorrow's 1-on-1s

## Next Steps

- **[API Reference](API-Reference.md)** - Build custom agents
- **[Contributing](Contributing.md)** - Share your examples
- **[FAQ](FAQ.md)** - Common questions

---

**Previous**: [Troubleshooting ←](Troubleshooting.md) | **Next**: [API Reference →](API-Reference.md)
