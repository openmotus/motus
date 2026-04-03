# Example: Employee Onboarding Automation

Automates new hire onboarding with parallel document collection and account provisioning, followed by training scheduling and a welcome package.

## What This Shows

- **Event-triggered** workflow (fires on `new-hire` event, not on a schedule)
- **Parallel execution** of independent tasks (documents + accounts)
- **Sequential follow-up** steps that depend on prior results
- **Helper script** (`onboarding-checklist.js`) for tracking completion state

## Structure

```
onboarding-automation/
  agents/
    document-collector.md     # Gathers HR docs, contracts, policies
    account-provisioner.md    # Creates email, Slack, GitHub accounts
    training-scheduler.md     # Books orientation sessions
    welcome-sender.md         # Compiles welcome package
  workflows/
    new-hire-onboarding.json  # Event-triggered workflow config
  onboarding-checklist.js     # Checklist helper (create, update, summarize)
```

## How It Works

1. An event triggers the workflow (e.g., HR system posts `new-hire` event)
2. **Step 1 (parallel)**: `document-collector` and `account-provisioner` run simultaneously
3. **Step 2 (sequential)**: `training-scheduler` books sessions using the new accounts
4. **Step 3 (sequential)**: `welcome-sender` compiles everything into a welcome package

## Checklist Helper API

```javascript
const { createChecklist, updateDocumentStatus, updateAccountStatus,
        calculateCompletion, getPendingSummary } = require('./onboarding-checklist');

const checklist = createChecklist('Jane Doe', 'Engineering');
updateDocumentStatus(checklist, 'contract', true);
updateAccountStatus(checklist, 'github', true);
console.log(calculateCompletion(checklist)); // e.g. 25
console.log(getPendingSummary(checklist));    // remaining items
```

## Customization

- Edit agent `.md` files to integrate with your HR system (BambooHR, Workday, etc.)
- Adjust the workflow trigger type for your event source
- Add/remove checklist items in `onboarding-checklist.js`
