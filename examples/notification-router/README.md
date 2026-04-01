# Notification Router Example

Routes incoming alerts and notifications to the right channels based on severity, type, and recipient preferences.

## Agents

| Agent | Type | Role |
|-------|------|------|
| `alert-classifier` | Specialist | Parses raw alerts and classifies severity/category |
| `channel-resolver` | Specialist | Determines which channels to use based on routing rules |
| `message-formatter` | Specialist | Formats the alert for each target channel |
| `dispatch-sender` | Specialist | Sends formatted messages to resolved channels |

## Workflow

**`route-alert`** — Event-triggered pipeline:

1. `alert-classifier` parses the incoming alert payload
2. `channel-resolver` looks up routing rules for the alert's severity and category
3. `message-formatter` formats the alert for each target channel (Slack, email, SMS)
4. `dispatch-sender` dispatches to all resolved channels

## Utility Module

**`alert-router.js`** provides:

- `parseAlert(raw)` — Extracts title, source, severity, category, and timestamp from raw alert data
- `classifySeverity(alert)` — Scores and classifies alerts as critical/high/medium/low/info
- `resolveChannels(severity, category, rules)` — Matches routing rules to determine target channels
- `formatForChannel(alert, channel)` — Formats an alert payload for a specific channel type
- `buildDispatchPlan(alert, rules)` — Combines classification, resolution, and formatting into a ready-to-send plan

## Running

```bash
# Test the utility module directly
node examples/notification-router/agents/alert-router.js

# Use in a Motus workflow
/motus notification-router route-alert
```
