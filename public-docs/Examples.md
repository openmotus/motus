# Examples

Motus ships with **11 complete working examples** in the [`examples/`](../examples/) directory. Each example is a self-contained department with agents, workflows, and (where relevant) utility modules you can study and adapt.

## Working Examples

### 1. Daily Briefing

**Path:** [`examples/daily-briefing/`](../examples/daily-briefing/)

A morning briefing system that fetches weather and calendar data in parallel, then compiles them into a summary.

**Pattern:** Parallel data fetchers &rarr; sequential compiler

**Agents:**
- `weather-fetcher` (data-fetcher) &mdash; calls WeatherAPI for current conditions and forecast
- `calendar-fetcher` (data-fetcher) &mdash; retrieves today's Google Calendar events
- `briefing-creator` (specialist) &mdash; compiles fetched data into a formatted note

**Key concept:** Two data-fetcher agents run simultaneously, then a specialist combines their output.

---

### 2. Content Pipeline

**Path:** [`examples/content-pipeline/`](../examples/content-pipeline/)

A 3-step content creation workflow: research a topic, draft an article, then review it for quality.

**Pattern:** Research &rarr; write &rarr; review (3 sequential steps)

**Agents:**
- `topic-researcher` (data-fetcher) &mdash; gathers source material
- `article-writer` (specialist) &mdash; drafts the article
- `quality-reviewer` (specialist) &mdash; reviews for accuracy and style

**Key concept:** Multi-step sequential workflow where each step depends on the previous output.

---

### 3. Code Review

**Path:** [`examples/code-review/`](../examples/code-review/)

Automated PR review with parallel analysis agents examining different aspects of a changeset.

**Pattern:** Collect diff &rarr; parallel analysis (security, style, logic) &rarr; summarize

**Agents:**
- `diff-collector` (data-fetcher) &mdash; gathers the PR diff and changed files
- `security-analyzer` (specialist) &mdash; checks for vulnerabilities
- `style-analyzer` (specialist) &mdash; checks code style and conventions
- `logic-analyzer` (specialist) &mdash; reviews business logic correctness
- `review-summarizer` (specialist) &mdash; combines all findings into one review

**Key concept:** Fan-out/fan-in pattern with one collector feeding three parallel analyzers.

---

### 4. DevOps Monitoring

**Path:** [`examples/devops-monitoring/`](../examples/devops-monitoring/)

A monitoring pipeline that checks service health, analyzes logs, and sends alerts.

**Pattern:** Parallel data collection &rarr; alert notification

**Agents:**
- `uptime-checker` (data-fetcher) &mdash; pings endpoints for status, latency, SSL expiry
- `log-analyzer` (specialist) &mdash; scans recent logs for error patterns
- `alert-sender` (specialist) &mdash; routes alerts based on severity

**Key concept:** Real-world API integration with health checks and log analysis.

---

### 5. Research Assistant

**Path:** [`examples/research-assistant/`](../examples/research-assistant/)

Deep research on any topic with parallel source gathering and quality evaluation.

**Pattern:** Parallel gathering &rarr; evaluate &rarr; synthesize report

**Agents:**
- `web-gatherer` (data-fetcher) &mdash; collects sources from the web
- `academic-gatherer` (data-fetcher) &mdash; collects academic/scholarly sources
- `source-evaluator` (specialist) &mdash; scores and ranks source credibility
- `report-synthesizer` (specialist) &mdash; produces a structured research report

**Key concept:** Multiple data-fetcher agents gathering from different source types in parallel.

---

### 6. Customer Support Triage

**Path:** [`examples/customer-support/`](../examples/customer-support/)

Automated ticket routing with parallel multi-factor analysis.

**Pattern:** Parse ticket &rarr; parallel scoring (sentiment, category, priority) &rarr; draft response

**Agents:**
- `ticket-intake` (data-fetcher) &mdash; parses and normalizes incoming tickets
- `sentiment-scorer` (specialist) &mdash; evaluates customer emotion
- `category-classifier` (specialist) &mdash; classifies the issue type
- `priority-assessor` (specialist) &mdash; determines urgency
- `response-drafter` (specialist) &mdash; drafts an appropriate reply

**Includes:** `ticket-intake.js` utility with `parseTicket()`, `parseCustomer()`, `stripHtml()`, and `detectChannel()` functions.

**Key concept:** Multi-factor decision pipeline where parallel specialists each score one dimension.

---

### 7. Data Pipeline (ETL)

**Path:** [`examples/data-pipeline/`](../examples/data-pipeline/)

A classic Extract-Transform-Load pipeline for CSV data.

**Pattern:** Extract &rarr; parallel transform (clean + enrich) &rarr; validate &rarr; load

**Agents:**
- `csv-extractor` (data-fetcher) &mdash; reads and parses source CSV files
- `data-cleaner` (specialist) &mdash; normalizes and deduplicates records
- `data-enricher` (specialist) &mdash; augments records with additional data
- `schema-validator` (specialist) &mdash; checks data integrity against a schema
- `db-loader` (specialist) &mdash; writes validated data to the destination

**Includes:** `csv-extractor.js` utility with `parseCsv()`, `splitCsvLine()`, `detectDelimiter()` functions.

**Key concept:** Parallel transformers operating on the same dataset independently.

---

### 8. Release Manager

**Path:** [`examples/release-manager/`](../examples/release-manager/)

Automates the release process: run tests, validate changelog, bump version, generate release notes.

**Pattern:** Test &rarr; validate &rarr; bump &rarr; generate notes (sequential)

**Agents:**
- `test-runner` (data-fetcher) &mdash; runs the test suite and reports results
- `changelog-validator` (specialist) &mdash; checks changelog format and completeness
- `version-bumper` (specialist) &mdash; determines and applies the version bump
- `notes-generator` (specialist) &mdash; creates release notes from changelog

**Includes:** `version-checker.js` utility with `parseSemver()`, `bumpVersion()`, `parseUnreleasedSection()`, and `determineBumpType()` functions.

**Key concept:** Strict sequential pipeline where each step must pass before proceeding.

---

### 9. Meeting Notes

**Path:** [`examples/meeting-notes/`](../examples/meeting-notes/)

Post-meeting automation: read transcript, extract action items and decisions, write summary, draft follow-ups.

**Pattern:** Read transcript &rarr; parallel extraction (actions + decisions) &rarr; summary &rarr; follow-ups

**Agents:**
- `transcript-reader` (data-fetcher) &mdash; ingests and parses meeting transcripts
- `action-extractor` (specialist) &mdash; identifies action items with owners and deadlines
- `decision-extractor` (specialist) &mdash; captures key decisions and their rationale
- `summary-writer` (specialist) &mdash; compiles the final meeting notes
- `followup-drafter` (specialist) &mdash; prepares follow-up emails

**Includes:** `transcript-reader.js` utility with `detectFormat()`, `parseLabeledTranscript()`, `parseSrtTranscript()`, `extractAttendees()`, and `estimateDuration()` functions.

**Key concept:** Fan-out/fan-in with parallel extraction from the same source document.

---

### 10. CI Pipeline

**Path:** [`examples/ci-pipeline/`](../examples/ci-pipeline/)

A continuous integration quality check pipeline.

**Pattern:** Parallel quality gates (lint + tests) &rarr; coverage report &rarr; deploy notification

**Agents:**
- `lint-checker` (data-fetcher) &mdash; runs linters and reports violations
- `test-runner` (data-fetcher) &mdash; executes tests and reports results
- `coverage-reporter` (specialist) &mdash; analyzes code coverage
- `deploy-notifier` (specialist) &mdash; announces build results

**Includes:** `lint-checker.js` utility with `detectLinter()`, `countSourceFiles()`, `parseLintLine()`, and `topViolations()` functions.

**Key concept:** Parallel quality gates that must both pass before sequential reporting.

---

### 11. Programmatic Usage

**Path:** [`examples/programmatic-usage/`](../examples/programmatic-usage/)

Uses Motus as a Node.js library (not slash commands) to create departments, agents, and workflows from code.

**Run it:**
```bash
cd examples/programmatic-usage
node setup-department.js
```

**Key concept:** Everything the `/motus` commands do can also be done via the JavaScript API.

---

## Patterns at a Glance

| Pattern | Examples | Description |
|---------|----------|-------------|
| **Parallel fetch &rarr; compile** | Daily Briefing, DevOps | Multiple data-fetchers run simultaneously, one specialist compiles |
| **Fan-out/fan-in** | Code Review, Customer Support, Meeting Notes | One collector feeds N parallel analyzers, then one summarizer |
| **Sequential pipeline** | Content Pipeline, Release Manager | Each step feeds the next in strict order |
| **Parallel transform** | Data Pipeline, CI Pipeline | Multiple agents process the same data independently |
| **Gather &rarr; evaluate &rarr; synthesize** | Research Assistant | Parallel sources, quality scoring, final synthesis |

## Running an Example

Each example is a reference implementation &mdash; it shows the directory structure, agent definitions, and workflow configs you would create when building a similar system with Motus.

1. Browse the example directory to understand the structure
2. Read the `README.md` in each example for details
3. Use the agent `.md` files as templates for your own agents
4. Adapt the workflow config to your use case

To create a similar department in your own project:

```bash
# Example: recreate the code-review pipeline
/motus department create code-review
/motus code-review agent create diff-collector
/motus code-review agent create security-analyzer
/motus code-review agent create style-analyzer
/motus code-review agent create logic-analyzer
/motus code-review agent create review-summarizer
/motus code-review workflow create pr-review
```

## Next Steps

- **[API Reference](API-Reference.md)** &mdash; Library API for programmatic use
- **[Creating Agents](Creating-Agents.md)** &mdash; Agent types and customization
- **[Creating Workflows](Creating-Workflows.md)** &mdash; Workflow configuration and scheduling

---

**Previous**: [Troubleshooting &larr;](Troubleshooting.md) | **Next**: [API Reference &rarr;](API-Reference.md)
