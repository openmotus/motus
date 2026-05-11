# Changelog

All notable changes to Motus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

**Core Features:**
- `exportMermaid(options?)` method on `RegistryManager` — renders the entire registry as a [Mermaid](https://mermaid.js.org/) flowchart. Departments become labelled subgraphs; agents and workflows become nodes with type-specific icons (📥 data-fetcher, 🎯 orchestrator, 🛠️ specialist, ⚡ workflow); `workflow.agents` references render as edges. Supports `direction` (`TD`/`TB`/`BT`/`LR`/`RL`), `department` filter, `includeAgents`/`includeWorkflows`/`includeOrphans` toggles, and an optional `title`. Orphan agents/workflows (whose declared department is missing) surface in a separate "⚠️ Orphans" subgraph by default. Output is paste-ready for GitHub READMEs.
- TypeScript types: `MermaidDirection`, `MermaidExportOptions`
- `getAgentUsage(filters?)` method on `RegistryManager` — analyzes agent usage across all workflows, returning per-agent usage level (`unused`, `low`, `medium`, `high`), workflow count, and back-references to using workflows. Supports `department`, `type`, and `usage` filters. Summary includes `byType` and `byDepartment` breakdowns. Uses live `workflow.agents` as source of truth so drifted `usedInWorkflows` fields can't mask unused agents.
- TypeScript types: `AgentUsageLevel`, `AgentUsageEntry`, `AgentUsageWorkflowRef`, `AgentUsageResult`
- `getWorkflowHealth(filters?)` method on `RegistryManager` — analyzes workflow health across all or filtered workflows, returning per-workflow status (`healthy`, `degraded`, `failing`, `idle`) based on success rate, run recency, and run count. Supports `department` and `status` filters. Includes summary counts.
- TypeScript types: `WorkflowHealthStatus`, `WorkflowHealthEntry`, `WorkflowHealthResult`
- `recordWorkflowRun(department, name, result?)` method on `RegistryManager` — tracks workflow execution history by updating `lastRun`, `runCount`, `successRate`, and optionally `lastDurationMs`/`lastError`. Enables programmatic monitoring of workflow health.
- `getDepartmentSummary()` now dynamically counts all trigger types — previously hardcoded to only count `manual` and `scheduled`, now consistent with `getStatistics()` behavior
- `validate()` now checks agent type validity — detects agents with invalid types (e.g. from corrupted imports)
- `validate()` now checks `usedInWorkflows` consistency — detects stale workflow references in agents and missing reverse references from workflows to agents
- `import()` now deep copies all imported data via JSON roundtrip — prevents external mutation from corrupting registry state (same class of fix as `export()` mutation safety from 2026-03-25)
- `getStatistics()` now dynamically counts all trigger types — previously only counted `manual` and `scheduled`, missing `event`, `webhook`, `cron`, and custom types
- TypeScript `TriggerType` extended to include `'event' | 'webhook' | 'cron'` plus arbitrary string support via `(string & {})`
- `removeDepartment(name, options?)` method on `RegistryManager` — removes a department with cascade-delete of its agents and workflows by default; pass `{ cascade: false }` to block removal when children exist
- `removeAgent(name)` method on `RegistryManager` — removes an agent, cleaning up the owning department's agent list and any workflow agent references
- `removeWorkflow(department, name)` method on `RegistryManager` — removes a workflow, cleaning up the owning department's workflow list and agent `usedInWorkflows` arrays
- TypeScript definitions for all three remove methods in `index.d.ts`
- `index.js` library entry point — all modules (`RegistryManager`, `TemplateEngine`, `Validator`, `DocGenerator`, `OAuthRegistry`) exported for programmatic use
- TypeScript type definitions (`index.d.ts`) — comprehensive types for all 5 exported classes, including interfaces for `Department`, `Agent`, `Workflow`, `Statistics`, `SearchResults`, `DepartmentSummary`, and all input/output types
- `getDepartmentSummary(name)` method on `RegistryManager` — returns department info, agents, workflows, type breakdowns, and integration count in a single call
- `getWorkflowsByAgent(agentName)` method on `RegistryManager` — returns all workflows that include a specific agent, useful for impact analysis
- `array` Handlebars helper in `TemplateEngine` — creates arrays from variadic arguments (e.g. `{{join (array "a" "b" "c") ", "}}`)
- Metadata counter consistency checks in `validate()` — detects when metadata counters drift from actual registry counts
- Name validation in `addDepartment()`, `addAgent()`, and `addWorkflow()` — uses existing Validator to reject invalid names before creating registry entries
- Agent existence warnings in `addWorkflow()` — logs a `console.warn` when workflow references agents not yet registered
- `files` field in `package.json` to whitelist published files
- Prominent Claude Code prerequisite note at top of Quick Start section
- Programmatic Usage section in README with code examples
- CI workflow with Node.js 18/20/22 matrix testing and security audit job
- CI badge on README
- Repository/homepage/bugs URLs in `package.json`
- Community health files: Code of Conduct, Security Policy, issue/PR templates, CHANGELOG

**Examples (13 complete working examples):**
- `examples/daily-briefing/` — weather fetcher, calendar fetcher, briefing creator, and workflow config
- `examples/content-pipeline/` — 3-step content creation workflow with topic researcher, article writer, and quality reviewer
- `examples/code-review/` — PR review pipeline with diff collector, parallel security/style/logic analysis, and review summarizer
- `examples/devops-monitoring/` — multi-agent monitoring pipeline with uptime checker, log analyzer, and alert sender
- `examples/programmatic-usage/` — creates department, agents, and workflows entirely from code
- `examples/research-assistant/` — multi-step research workflow with parallel source gathering and quality evaluation
- `examples/customer-support/` — ticket triage pipeline with sentiment/category/priority analysis
- `examples/data-pipeline/` — ETL pipeline with CSV extractor, parallel cleaner/enricher, schema validator, and loader
- `examples/release-manager/` — release pipeline with test runner, changelog validator, version bumper, and notes generator
- `examples/meeting-notes/` — post-meeting pipeline with transcript reader, action/decision extractors, and follow-up drafter
- `examples/ci-pipeline/` — CI quality check pipeline with lint checker, test runner (parallel), coverage reporter, and deploy notifier
- `examples/onboarding-automation/` — new employee onboarding pipeline with document collector and account provisioner (parallel), training scheduler, and welcome sender (4 agents, 1 event-triggered workflow, onboarding-checklist.js with createChecklist/updateDocumentStatus/updateAccountStatus/calculateCompletion/getPendingSummary)
- `examples/notification-router/` — alert routing pipeline with alert classifier, channel resolver, message formatter, and dispatch sender (4 agents, 1 event-triggered workflow, alert-router.js with parseAlert/classifySeverity/resolveChannels/formatForChannel/buildDispatchPlan)

**Documentation:**
- `examples/README.md` — comprehensive index of all 13 examples with categories, agent counts, and common patterns
- `examples/onboarding-automation/README.md` — structure, how it works, checklist helper API
- `examples/release-manager/README.md` — structure, sequential pipeline walkthrough

**Input Safety Guards:**
- `TemplateEngine.loadTemplate()`, `resolveTemplatePath()`, and `render()` — non-string or empty template names now throw descriptive errors
- `Validator.validateDescription()` — non-string inputs return a validation error instead of crashing
- `detectParallelExecution()` — null, undefined, number, boolean, or object input returns safe defaults
- `validateEnvVarName()` — non-string input returns validation error
- `suggestEnvVarName()` — null/undefined/non-string inputs return empty string
- `generateIntegrationDocs()` — guards `envVars` iterations when undefined or empty

**Test Suites (1357 tests across 30 auto-discovered suites):**
- `test-steward-fixes-0511.js` — exportMermaid() rendering, filters, orphans, dedup, type defs; axios advisory clean (23 tests)
- `test-steward-fixes-0422.js` — getAgentUsage() analytics, follow-redirects advisory clean (24 tests)
- `test-steward-fixes-0410.js` — getWorkflowHealth() analytics (28 tests)
- `test-template-engine.js` — Template rendering (7 tests)
- `test-phase2-components.js` — Validator + registry + integration (48 tests)
- `test-phase3-integration.js` — File structure + doc generation (22 tests)
- `test-error-handling.js` — Error messages + edge cases (21 tests)
- `test-validator.js` — Comprehensive validator coverage (70 tests)
- `test-doc-generator.js` — Doc generator + integration docs (22 tests)
- `test-oauth-registry.js` — OAuth registry + config generation (77 tests)
- `test-template-helpers.js` — Template helpers + engine methods (87 tests)
- `test-registry-manager.js` — Registry CRUD, search, import/export, validation (82 tests)
- `test-end-to-end.js` — Full lifecycle, cross-module, examples (56 tests)
- `test-bug-fixes.js` — Bug fix verification: type validation, regex, paths (22 tests)
- `test-steward-fixes-0227.js` — Schedule validation, import guards, template paths (59 tests)
- `test-steward-fixes-0301.js` — CLI flags, validateContext ENOENT, JSDoc verification (43 tests)
- `test-steward-fixes-0308.js` — Workflow validation, updateWorkflow guard (61 tests)
- `test-steward-fixes-0309.js` — Update rename prevention, metadata validation (36 tests)
- `test-steward-fixes-0311.js` — Trigger crash safety, usedInWorkflows IDs (35 tests)
- `test-steward-fixes-0313.js` — updateClaudeMd implementation, data-pipeline example (32 tests)
- `test-steward-fixes-0315.js` — DocGenerator basePath, release-manager example (41 tests)
- `test-steward-fixes-0316.js` — search/import/suggestTools/detectAgentType fixes (114 tests)
- `test-steward-fixes-0318.js` — detectParallelExecution/envVar safety, getDepartmentSummary (50 tests)
- `test-steward-fixes-0320.js` — TypeScript definitions, name validation in CRUD (48 tests)
- `test-steward-fixes-0322.js` — TemplateEngine input safety, array helper, validateDescription guard (89 tests)
- `test-steward-fixes-0325.js` — export() mutation safety, search('') fix, validate() orphan detection (23 tests)
- `test-steward-fixes-0327.js` — removeDepartment, removeAgent, removeWorkflow with cascade, cross-references, edge cases (30 tests)
- `test-steward-fixes-0330.js` — import() mutation safety, getStatistics() dynamic trigger types, TypeScript definitions, onboarding-automation example validation, onboarding-checklist.js module tests (38 tests)
- `test-steward-fixes-0401.js` — getDepartmentSummary dynamic trigger counting, validate() agent type and usedInWorkflows consistency checks, notification-router example validation, alert-router.js module tests (48 tests)
- `test-steward-fixes-0403.js` — recordWorkflowRun success/failure/rate tracking, persistence, input validation, edge cases, example README validation, examples index (22 tests)
- Auto-discovering test runner (`tests/run-all.js`) with `--filter` support

### Changed
- `getDepartmentSummary()` `workflowsByTrigger` now dynamically counts all trigger types present — previously only counted `manual` and `scheduled`, now uses the same dynamic counting as `getStatistics()`
- `import()` now deep copies all imported data — prevents external mutation from corrupting internal registry state (mirrors the `export()` fix)
- `getStatistics()` `workflows.byType` now dynamically counts all trigger types present (e.g. `event`, `webhook`, `cron`) instead of only `manual`/`scheduled`
- Updated TypeScript `TriggerType` to accept custom trigger types beyond `manual`/`scheduled`
- `export()` now returns deep copies of registry data — modifying exported objects no longer mutates internal state
- `search('')` now returns empty results instead of matching everything — empty/whitespace-only queries are treated as no-ops
- `validate()` now detects orphan agents and workflows — entries in the registry whose parent department doesn't list them
- Overhauled `public-docs/Examples.md` — complete rewrite showcasing all 11 working examples with code patterns, agent breakdowns, and a patterns-at-a-glance table
- `search()` now returns empty results for null/undefined/non-string queries instead of crashing
- `import()` now validates structure of each registry section before overwriting
- `suggestTools()` now returns a fresh copy of the tool array on each call (no mutation)
- `detectAgentType()` now returns `null` for non-string inputs instead of crashing
- `DocGenerator` constructor now accepts an optional `basePath` parameter
- `DocGenerator.updateClaudeMd()` now actually updates CLAUDE.md when stat markers are present
- `addWorkflow()` now stores workflow ID (`${department}-${name}`) in agent `usedInWorkflows` instead of bare name
- `listWorkflows()` and `getStatistics()` safely handle workflows with missing `trigger` field
- `updateDepartment()`, `updateAgent()`, `updateWorkflow()` now reject attempts to rename via update
- `addWorkflow()` validates that `agents` parameter is an array
- `updateWorkflow()` validates that `updates` parameter is a non-null object
- Replaced fragile `&&`-chained npm test script with auto-discovering test runner
- CLI: `--version` and `--help` flags now exit immediately without printing boxen message
- CLI: `--oauth` spawn now has error handling with helpful message
- CLI: Version flag changed from `-v` to `-V` to avoid conflict with verbose convention
- `validateContext()` now only swallows ENOENT errors; permission and parse errors are re-thrown
- `validateSchedule()` validates time ranges (hours 0-23, minutes 0-59)
- Added comprehensive JSDoc with `@param`, `@returns`, `@throws` to all public methods across all 5 lib/ modules
- `package.json` now includes `types` field pointing to `index.d.ts`
- Agent type validation: `addAgent()` rejects invalid types with clear error listing valid options
- Removed 3 unused dependencies: `socket.io`, `@octokit/rest`, `node-cron`
- Updated GitHub topics: replaced misleading "typescript" with "javascript" and "nodejs"
- Overhauled README with concrete daily-briefing example, architecture diagram, and cleaner structure
- Improved error messages across registry-manager.js and template-engine.js

### Fixed
- CLI printing boxen message before `--version`/`--help` output
- `validateContext()` swallowing all schema errors (EISDIR, EACCES, JSON parse)
- `validateWorkflowContext()` falling through to `forEach` on non-array `steps`
- `resolveTemplatePath()` producing double-extension paths (e.g. `test-agent.md.hbs`)
- `OAuthRegistry.addIntegration()` regex that never matched `server.js` comment
- `TemplateEngine.resolveTemplatePath()` producing garbled paths with `undefined`
- `OAuthRegistry._generateInitFunction()` accessing `envVars[1]` when only one env var provided
- `RegistryManager._generateAgentFiles()` falling through to non-existent template for unknown types
- Hardcoded user paths in test-template-engine.js and doc-generator.js
- CONTRIBUTING.md placeholder `<repository-url>` with actual GitHub URL
- axios DoS vulnerability and qs transitive dependency vulnerability
- `follow-redirects` moderate vulnerability (GHSA-r4q5-vmmm-2653 — auth header leakage on cross-domain redirect) patched via `npm audit fix`

## [1.0.0] - 2025-10-15

### Added
- Initial open-source release
- Department creation wizard with AI-powered agent suggestions
- Template engine with 11 Handlebars templates
- Registry system for departments, agents, and workflows
- OAuth Manager with web UI
- Documentation generator
- Comprehensive public documentation
- CONTRIBUTING.md guide
- MIT License

[Unreleased]: https://github.com/openmotus/motus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/openmotus/motus/releases/tag/v1.0.0
