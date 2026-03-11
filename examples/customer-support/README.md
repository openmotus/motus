# Example: Customer Support Triage

A department that automates support ticket routing with parallel analysis agents and an intelligent response drafter. Each agent evaluates a different dimension of the incoming ticket.

## What This Shows

- **Data-fetcher** agent that parses and normalizes incoming tickets
- **Parallel specialist agents** scoring sentiment, category, and priority independently
- A **response drafter** that synthesizes all analysis into a customer-appropriate reply
- How to model a multi-factor decision pipeline in Motus

## Structure

```
customer-support/
  agents/
    ticket-intake.md        # Data-fetcher — parses incoming ticket
    ticket-intake.js        # Implementation script
    sentiment-analyzer.md   # Specialist — scores customer sentiment
    category-classifier.md  # Specialist — classifies ticket topic
    priority-scorer.md      # Specialist — assigns priority level
    response-drafter.md     # Specialist — drafts customer reply
  workflows/
    triage-ticket.json      # 3-step workflow config
```

## How It Works

1. **Step 1 (sequential)**: `ticket-intake` normalizes the raw ticket into structured data
2. **Step 2 (parallel)**: `sentiment-analyzer`, `category-classifier`, and `priority-scorer` each evaluate the ticket independently
3. **Step 3 (sequential)**: `response-drafter` combines all scores into a prioritized reply with routing recommendation

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/customer-support departments/
   ```

2. Run the workflow:
   ```bash
   /motus customer-support triage-ticket
   ```

## Adapting This Example

**Add an escalation detector** — flag tickets that should skip the queue:
```bash
/motus customer-support agent create escalation-detector
```

**Add a knowledge-base searcher** — find relevant help articles:
```bash
/motus customer-support agent create kb-searcher
```

Then update `triage-ticket.json` step 2 to include them in the parallel group.

**Integrate with a helpdesk** — modify `ticket-intake.js` to fetch tickets from Zendesk, Freshdesk, or Intercom APIs.
