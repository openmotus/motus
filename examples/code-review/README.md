# Example: Code Review Pipeline

A department that automates code review with parallel analysis agents and a final summary agent. Each agent examines different aspects of a pull request.

## What This Shows

- **Parallel specialist agents** analyzing code from different angles
- **Data-fetcher** agent that collects the diff/files to review
- A **summary agent** that combines all findings into one actionable report
- How to model a real-world developer workflow in Motus

## Structure

```
code-review/
  agents/
    diff-collector.md       # Data-fetcher — gathers the PR diff
    diff-collector.js       # Implementation script
    security-scanner.md     # Specialist — checks for security issues
    style-checker.md        # Specialist — checks conventions and style
    logic-reviewer.md       # Specialist — reviews logic and edge cases
    review-summarizer.md    # Specialist — compiles final review
  workflows/
    review-pr.json          # 3-step workflow config
```

## How It Works

1. **Step 1 (sequential)**: `diff-collector` gathers the changed files and diff
2. **Step 2 (parallel)**: `security-scanner`, `style-checker`, and `logic-reviewer` each analyze the diff from their perspective
3. **Step 3 (sequential)**: `review-summarizer` combines all findings into a single review with severity ratings

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/code-review departments/
   ```

2. Run the workflow:
   ```bash
   /motus code-review review-pr
   ```

## Adapting This Example

**Add a test coverage checker** — analyze whether new code has tests:
```bash
/motus code-review agent create test-coverage-checker
```

**Add a performance reviewer** — flag potential performance issues:
```bash
/motus code-review agent create perf-reviewer
```

Then update `review-pr.json` step 2 to include them in the parallel group.

**Integrate with GitHub** — modify `diff-collector.js` to fetch diffs from the GitHub API using `gh pr diff`.
