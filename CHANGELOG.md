# Changelog

All notable changes to Motus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

**Core Features:**
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

**Examples (11 complete working examples):**
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

**Input Safety Guards:**
- `TemplateEngine.loadTemplate()`, `resolveTemplatePath()`, and `render()` — non-string or empty template names now throw descriptive errors
- `Validator.validateDescription()` — non-string inputs return a validation error instead of crashing
- `detectParallelExecution()` — null, undefined, number, boolean, or object input returns safe defaults
- `validateEnvVarName()` — non-string input returns validation error
- `suggestEnvVarName()` — null/undefined/non-string inputs return empty string
- `generateIntegrationDocs()` — guards `envVars` iterations when undefined or empty

**Test Suites (1122 tests across 22 auto-discovered suites):**
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
- Auto-discovering test runner (`tests/run-all.js`) with `--filter` support

### Changed
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
