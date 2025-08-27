# DO NOT ARCHIVE - Required Files

The following files in `life-admin/` are REQUIRED dependencies for the system to work:

## Essential life-admin files (DO NOT REMOVE):
- `life-admin-agent.js` - Main orchestrator
- `daily-note-updater.js` - Updates daily notes
- `supplement-manager.js` - Manages supplements
- `supplement-parser-v2.js` - Parses supplement schedules
- `calendar-supplement-creator.js` - Creates calendar events
- `calendar-supplement-creator-v2.js` - Updated calendar creator
- `cli-dashboard.js` - CLI dashboard display
- `simple-dashboard.js` - Simple dashboard display
- `weather-fetcher.js` - Fetches weather data
- `tomorrow-weather-fetcher.js` - Tomorrow's weather
- `gmail-processor.js` - Processes emails
- `setup-google-oauth.js` - OAuth setup
- `evening-review.js` - Interactive evening review
- `workflow-system.js` - Workflow management
- `health-update.js` - Health tracking
- `health-checkin.js` - Health check-in

## Files that CAN be archived:
- `evening-review-simple.js` - Simplified version (not used)
- `health-checkin-interactive.js` - Duplicate of health-checkin
- `workflows.js` - Old workflow handler (replaced by workflow-system)
- `workflow-executor.js` - Old executor (replaced by workflow-system)

## Important Note:
Even though some files like `cli-dashboard.js` and `simple-dashboard.js` aren't directly used in the automated workflows, they are REQUIRED as dependencies in `life-admin-agent.js`. The agent imports them at the top of the file:

```javascript
const CLIDashboard = require('./cli-dashboard');
const SimpleDashboard = require('./simple-dashboard');
const SupplementParserV2 = require('./supplement-parser-v2');
const { createSupplementCalendarEvents } = require('./calendar-supplement-creator');
```

If these files are missing, the entire system will fail with module not found errors.