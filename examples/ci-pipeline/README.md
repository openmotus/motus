# Example: CI Pipeline

A department that models a continuous integration pipeline. A lint checker and test runner execute in parallel, then a coverage reporter analyzes results, and finally a deploy notifier announces the outcome.

## What This Shows

- **Parallel quality gates** (lint + tests) that run simultaneously
- **Sequential reporting** that depends on prior results
- **Conditional deploy notification** based on pass/fail status
- How to model a CI/CD pipeline with Motus

## Structure

```
ci-pipeline/
  agents/
    lint-checker.md         # Specialist — runs linting on source files
    lint-checker.js         # Implementation script
    test-runner.md          # Data-fetcher — executes test suites
    coverage-reporter.md    # Specialist — analyzes coverage from test output
    deploy-notifier.md      # Specialist — sends pass/fail notification
  workflows/
    ci-check.json           # 3-step workflow config
```

## How It Works

1. **Step 1 (parallel)**: `lint-checker` scans for style violations while `test-runner` executes the test suite
2. **Step 2 (sequential)**: `coverage-reporter` analyzes test results and computes coverage metrics
3. **Step 3 (sequential)**: `deploy-notifier` sends a summary (pass/fail, coverage %, lint warnings) to the configured channel

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/ci-pipeline departments/
   ```

2. Run the workflow:
   ```bash
   /motus ci-pipeline ci-check
   ```

## Adapting This Example

**Add security scanning** — insert a parallel agent for dependency auditing:
```bash
/motus ci-pipeline agent create security-scanner
```
Then update `ci-check.json` step 1 to include it in the parallel group.

**Add build verification** — insert a step between testing and notification:
```bash
/motus ci-pipeline agent create build-verifier
```

**Change notification target** — modify `deploy-notifier.md` to post to Slack, Discord, email, or a GitHub PR comment instead of the console.
