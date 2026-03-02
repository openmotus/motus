# DevOps Monitoring Example

A multi-agent pipeline that monitors service health, analyzes logs, and sends alerts. Demonstrates parallel data fetching, sequential analysis, and real-world API integration.

## Agents

| Agent | Type | Purpose |
|-------|------|---------|
| `uptime-checker` | data-fetcher | Pings endpoints and reports HTTP status, latency, SSL expiry |
| `log-analyzer` | specialist | Scans recent logs for error patterns and anomalies |
| `alert-sender` | specialist | Sends notifications via Slack/email when issues are found |

## Workflow: `health-check`

```
Step 1 (parallel):  uptime-checker + log-analyzer
Step 2 (sequential): alert-sender (only if issues found)
```

## Setup

1. Create the department:
   ```bash
   /motus department create devops
   ```

2. Copy agents into the department:
   ```bash
   cp examples/devops-monitoring/agents/* departments/devops/agents/
   cp examples/devops-monitoring/workflows/* departments/devops/workflows/
   ```

3. Configure environment variables:
   ```bash
   # .env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   MONITORED_URLS=https://api.example.com,https://app.example.com
   LOG_DIR=/var/log/myapp
   ```

4. Run the workflow:
   ```bash
   /motus devops health-check
   ```

## How It Works

**uptime-checker.js** hits each URL in `MONITORED_URLS`, records status codes, response times, and SSL certificate expiry dates. It returns structured JSON that the alert-sender can act on.

**log-analyzer.md** reads the most recent log files from `LOG_DIR`, searches for error patterns (5xx codes, uncaught exceptions, OOM kills), and produces a severity-ranked summary.

**alert-sender.md** receives the combined output from both fetchers. If any service is down or error rates exceed thresholds, it posts a formatted alert to Slack with actionable details.

## Scheduling

The workflow config includes a cron schedule for every 15 minutes:

```json
"trigger": { "type": "scheduled", "schedule": "every 15m" }
```

Adjust the schedule in `workflows/health-check.json` to match your monitoring needs.
