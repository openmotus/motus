# Changelog

All notable changes to Motus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- `array` Handlebars helper in `TemplateEngine` — creates arrays from variadic arguments for use with `join`, `contains`, and other collection helpers (e.g. `{{join (array "a" "b" "c") ", "}}`)
- Input safety guards on `TemplateEngine.loadTemplate()`, `resolveTemplatePath()`, and `render()` — non-string or empty template names now throw a descriptive error instead of crashing on `.split()` or `.includes()`
- Type guard on `Validator.validateDescription()` — non-string inputs (numbers, booleans, objects, arrays) now return a validation error instead of crashing on `.length` or `.toLowerCase()`
- Steward fixes test suite (89 tests) covering TemplateEngine input safety (null/undefined/number/empty/boolean/array inputs), `array` helper with `join`/`contains`, `renderToFile` edge cases, `clearCache`, `listTemplates` by type, `validateDescription` non-string safety, `validateUrl` non-string safety, `getDepartmentSummary` edge cases, search edge cases, and export/import roundtrip
- TypeScript type definitions (`index.d.ts`) — comprehensive types for all 5 exported classes (`RegistryManager`, `TemplateEngine`, `Validator`, `DocGenerator`, `OAuthRegistry`), including interfaces for `Department`, `Agent`, `Workflow`, `Statistics`, `SearchResults`, `DepartmentSummary`, and all input/output types
- Name validation in `addDepartment()`, `addAgent()`, and `addWorkflow()` — uses existing Validator to reject invalid names (non-kebab-case, too short, uppercase, etc.) before creating registry entries
- Agent existence warnings in `addWorkflow()` — logs a `console.warn` when workflow references agents not yet registered, suggesting `addAgent()` to enable usage tracking
- Steward fixes test suite (48 tests) covering TypeScript definition structure and method coverage, name validation in CRUD methods (rejection and acceptance), agent existence warnings, validator integration, and error message quality

### Changed
- Total test count: 1033 → 1122 across 22 suites
- `package.json` now includes `types` field pointing to `index.d.ts` and includes the file in `files` array for npm publish

### Previously Added
- `getDepartmentSummary(name)` method on `RegistryManager` — returns department info, agents, workflows, type breakdowns, and integration count in a single call
- Complete working example: `examples/ci-pipeline/` — CI quality check pipeline with lint checker, test runner (parallel), coverage reporter, and deploy notifier (4 agents, 1 workflow, implementation script with `detectLinter`, `countSourceFiles`, `parseLintLine`, `topViolations` utilities)
- Steward fixes test suite (50 tests) covering `detectParallelExecution()` null/non-string safety, `validateEnvVarName()` type guard, `suggestEnvVarName()` null safety, `generateIntegrationDocs()` envVars guard, `getDepartmentSummary()` comprehensive tests, ci-pipeline example validation, and `lint-checker.js` module tests

### Previously Fixed
- `detectParallelExecution()` crash on null, undefined, number, boolean, or object input — now returns `{ shouldBeParallel: false, actionCount: 0, confidence: 0 }`
- `validateEnvVarName()` crash on non-string input (number, boolean, object) — now returns validation error
- `suggestEnvVarName()` crash on null/undefined/non-string department or service — now returns empty string
- `generateIntegrationDocs()` crash when `integration.envVars` is undefined or empty — now guards all array iterations and conditional `echo` command

### Previously Added
- Complete working example: `examples/meeting-notes/` — post-meeting pipeline with transcript reader, parallel action and decision extractors, summary writer, and follow-up drafter (5 agents, 1 workflow, implementation script with `detectFormat`, `parseLabeledTranscript`, `parseSrtTranscript`, `extractAttendees`, `estimateDuration`, `parseTranscript` utilities)
- Steward fixes test suite (114 tests) covering `search()` null safety, `import()` structure validation, `suggestTools()` mutation prevention, `detectAgentType()` type safety, meeting-notes example validation, and `transcript-reader.js` module tests
- Complete working example: `examples/release-manager/` — release pipeline with test runner, changelog validator, version bumper, and release notes generator (4 agents, 1 workflow, implementation script with `parseSemver`, `bumpVersion`, `parseUnreleasedSection`, `determineBumpType` utilities)
- Steward fixes test suite (41 tests) covering `DocGenerator` basePath parameter, release-manager example validation, and `version-checker.js` module tests (semver parsing, version bumping, changelog parsing, bump type determination)
- Complete working example: `examples/data-pipeline/` — ETL pipeline with CSV extractor, parallel data cleaner and enricher, schema validator, and database loader (5 agents, 1 workflow, implementation script with `parseCsv`, `splitCsvLine`, `detectDelimiter` utilities)
- Steward fixes test suite (32 tests) covering `updateClaudeMd()` marker-based updates, data-pipeline example validation, and `csv-extractor.js` module tests (CSV parsing, quoted fields, delimiter detection, edge cases)
- Complete working example: `examples/customer-support/` — ticket triage pipeline with intake parser, parallel sentiment/category/priority analysis, and response drafter (5 agents, 1 workflow, implementation script with `parseTicket`, `parseCustomer`, `stripHtml` utilities)
- Steward fixes test suite (35 tests) covering `listWorkflows`/`getStatistics` crash safety with missing trigger fields, `usedInWorkflows` workflow ID format, `getWorkflowsByAgent` cross-department, and customer-support example validation with `ticket-intake.js` module tests
- `getWorkflowsByAgent(agentName)` method on `RegistryManager` — returns all workflows that include a specific agent, useful for impact analysis before modifying or removing agents
- Metadata counter consistency checks in `validate()` — detects when `totalDepartments`, `totalAgents`, or `totalWorkflows` metadata counters drift from actual registry counts
- Steward fixes test suite (36 tests) covering update rename prevention, metadata validation, `getWorkflowsByAgent()`, and edge cases
- Complete working example: `examples/research-assistant/` — multi-step research workflow with parallel web and academic source gathering, source quality evaluation, and report synthesis (4 agents, 1 workflow, implementation script with `classifySource` utility)
- Steward fixes test suite (61 tests) covering `addWorkflow()` agents array validation, `updateWorkflow()` null guard, research-assistant example validation, and `web-researcher.js` module tests
- Complete working example: `examples/code-review/` — PR review pipeline with diff collector, parallel security/style/logic analysis, and review summarizer (5 agents, 1 workflow)
- Code-review example validation tests in end-to-end suite (file structure, agent-workflow cross-reference, JSON schema, parseDiff unit tests)
- Test runner (`tests/run-all.js`) — auto-discovers test suites, continues on failure, reports per-suite and grand totals, supports `--filter` for running subsets
- Complete working example: `examples/devops-monitoring/` — multi-agent monitoring pipeline with uptime checker, log analyzer, and alert sender
- Steward cycle test suite (41 tests) covering CLI flag ordering, validateContext error handling, programmatic example validation, and JSDoc presence verification
- Complete working example: `examples/programmatic-usage/` — creates a department, agents, and workflows entirely from code with registry search, validation, and export
- Steward fixes test suite (59 tests) covering schedule time-range validation, workflow context fall-through, template path double-extension fix, import/update guards, listTemplates, search edge cases, and validate cross-checks
- `files` field in package.json to whitelist published files (lib/, templates/, index.js, motus, README.md, LICENSE, CHANGELOG.md)
- Prominent Claude Code prerequisite note at top of Quick Start section
- Bug-fix verification test suite (22 tests) covering agent type validation, template path resolution, OAuth regex fix, and init function guard
- Complete working example: `examples/content-pipeline/` — 3-step content creation workflow with topic researcher, article writer, and quality reviewer agents
- End-to-end workflow test suite (52 tests) covering full lifecycle (department → agents → workflow → validate → search → export/import), cross-module interop (RegistryManager + Validator + TemplateEngine), multi-department scenarios, example directory validation, and error scenarios
- `index.js` library entry point — all modules (`RegistryManager`, `TemplateEngine`, `Validator`, `DocGenerator`, `OAuthRegistry`) exported for programmatic use
- Registry-manager test suite (82 tests) covering CRUD operations, multi-department workflows, search, import/export, validation, file-sync checking, and edge cases
- Programmatic Usage section in README with code examples
- CI workflow with Node.js 18/20/22 matrix testing
- CI security audit job (npm audit at moderate level)
- CI badge on README
- Complete working example: `examples/daily-briefing/` with weather fetcher, calendar fetcher, briefing creator, and workflow config
- Template-helpers test suite (87 tests) covering all 20 Handlebars helpers, template caching, path resolution, renderToFile, and edge cases
- OAuth-registry test suite (77 tests) covering config generation, integration management, standard configs
- Doc-generator test suite (22 tests) covering integration docs, command reference, edge cases
- Comprehensive validator test suite (70 tests) covering name validation, type detection, context schemas
- Error-handling test suite (21 tests) covering edge cases and improved error messages
- Community health files: Code of Conduct, Security Policy, issue/PR templates
- Troubleshooting table in README for quick problem resolution
- CHANGELOG.md
- Repository/homepage/bugs URLs in package.json

### Changed
- `search()` now returns empty results for `null`, `undefined`, or non-string queries instead of crashing with TypeError — empty string still matches everything (existing behavior)
- `import()` now validates the structure of each registry section (`{ departments: {}, metadata: {} }` shape) before overwriting — previously accepted corrupt data like `{ departments: "string" }` which would silently break all subsequent operations
- `suggestTools()` now returns a fresh copy of the tool array on each call — previously mutated the internal template array, causing `Bash` to accumulate on repeated calls with `needsApi=true`
- `detectAgentType()` now returns `null` for non-string inputs (numbers, booleans, objects, arrays) instead of crashing on `.toLowerCase()` — already returned `null` for `null`/`undefined`
- Total test count: 821 → 935 across 19 suites
- `DocGenerator` constructor now accepts an optional `basePath` parameter — previously hardcoded to `path.join(__dirname, '..')`, now consistent with `RegistryManager`'s constructor API. The internal `RegistryManager` instance also receives this path, enabling programmatic doc generation from any project root.
- Fixed stale JSDoc in `DocGenerator` — updated `updateClaudeMd` description from "stub — not yet implemented" to reflect the actual marker-based implementation
- Total test count: 780 → 821 across 18 suites
- `DocGenerator.updateClaudeMd()` now actually updates CLAUDE.md when `<!-- stats:start -->` / `<!-- stats:end -->` markers are present — previously was a stub that only logged stats without modifying the file. Returns `false` gracefully when markers are absent or file is missing.
- Total test count: 748 → 780 across 17 suites
- `addWorkflow()` now stores workflow ID (`${department}-${name}`) in agent `usedInWorkflows` instead of bare workflow name — prevents ambiguity when multiple departments have workflows with the same name
- `listWorkflows()` type filter now safely handles workflows with missing `trigger` field — previously crashed with TypeError on imported/corrupted data
- `getStatistics()` workflow type counting now safely handles workflows with missing `trigger` field — same crash prevention as `listWorkflows()`
- Total test count: 713 → 748 across 16 suites
- `updateDepartment()` now rejects updates that attempt to change the `name` field — previously silently desynced the registry key from the stored object value
- `updateAgent()` now rejects updates that attempt to change the `name` field — same key desync prevention
- `updateWorkflow()` now rejects updates that attempt to change the `name` or `department` fields — prevents key desync since workflow IDs are `${department}-${name}`
- Total test count: 677 → 713 across 15 suites
- `addWorkflow()` now validates that `agents` parameter is an array when provided — previously passing a string would crash with an unguarded TypeError on `forEach`
- `updateWorkflow()` now validates that `updates` parameter is a non-null object — matches existing guards on `updateDepartment()` and `updateAgent()`
- `updateWorkflow()` now has full JSDoc with `@param`, `@returns`, `@throws` documentation
- Total test count: 616 → 677 across 14 suites
- Replaced fragile `&&`-chained npm test script with auto-discovering test runner — new test suites are picked up automatically
- CLI: `--version` and `--help` flags now exit immediately without printing the boxen info message — enables clean output for scripts and CI
- CLI: `--oauth` spawn now has error handling with helpful message if `start-oauth-manager.sh` is missing or not executable
- CLI: Version flag changed from `-v` to `-V` to avoid conflict with common `-v` verbose convention
- `validateContext()` now only swallows ENOENT errors when schema is missing; permission and parse errors are re-thrown instead of silently returning valid
- Added comprehensive `@param`, `@returns`, `@throws` JSDoc to all public methods across all 5 lib/ modules (RegistryManager, TemplateEngine, Validator, DocGenerator, OAuthRegistry)
- Total test count: 610 → 616 across 13 suites
- `validateSchedule()` now validates time ranges (hours 0-23, minutes 0-59) — previously accepted `daily 25:99` as valid
- `updateDepartment()` and `updateAgent()` now validate the updates parameter is a non-null object
- `import()` now validates input is a non-null object before overwriting registry state
- `listTemplates()` now only swallows ENOENT errors, re-throwing permission and other errors
- `renderToFile()` now wraps write errors with contextual message including the output path
- Total test count: 510 → 569 across 12 suites
- Added class-level JSDoc with `@example` blocks to all 5 lib/ modules (RegistryManager, TemplateEngine, Validator, DocGenerator, OAuthRegistry)
- Agent type validation: `addAgent()` now rejects invalid types with a clear error listing valid options
- Replaced placeholder import paths in README and index.js (`'./path/to/motus'` → `'./index'`)
- Updated CONTRIBUTING.md: fixed stale `docs/` directory reference, updated helper line-number references to method names
- Removed 3 unused dependencies: `socket.io`, `@octokit/rest`, `node-cron` (never imported in any source file)
- Total test count: 488 → 510 across 11 suites
- Added JSDoc documentation to all 20 Handlebars template helpers with usage examples
- Overhauled README with concrete daily-briefing example, architecture diagram, and cleaner structure
- Improved error messages in registry-manager.js (missing fields listed individually, available departments shown)
- Improved error messages in template-engine.js (suggests checking templates/ directory)
- Updated CONTRIBUTING.md with actual GitHub URL and all test suite details
- Updated GitHub topics: replaced misleading "typescript" with "javascript" and "nodejs"
- Updated package.json `main` field to `index.js` for library usage
- Total test count: 48 → 488 across 10 suites

### Fixed
- Fixed CLI printing boxen message before `--version`/`--help` output — scripted usage now gets clean, parseable output
- Fixed `validateContext()` swallowing all schema errors (EISDIR, EACCES, JSON parse) — now only swallows ENOENT
- Fixed README troubleshooting entry for OAuth insertion marker (was `// Future services`, correct is `// Future services can be added here`)
- Fixed `validateWorkflowContext()` falling through to `forEach` on non-array `steps`, which would throw an unguarded TypeError
- Fixed `resolveTemplatePath()` producing double-extension paths (e.g. `test-agent.md.hbs` instead of `test-agent.hbs`) when using `name.ext` format
- Fixed `OAuthRegistry.addIntegration()` regex that never matched `server.js` comment (`// Future services can be added here` vs `// Future services`)
- Fixed `TemplateEngine.resolveTemplatePath()` producing garbled paths with `undefined` for unsupported extensions — now throws a clear error
- Fixed `OAuthRegistry._generateInitFunction()` accessing `envVars[1]` when only one env var provided — now guards against short arrays
- Fixed `RegistryManager._generateAgentFiles()` falling through to non-existent `generic-agent.md` template for unknown types — now throws explicit error
- Fixed hardcoded user path in test-template-engine.js (used `path.join` instead of absolute path)
- Fixed hardcoded user path in doc-generator.js troubleshooting output
- Fixed CONTRIBUTING.md placeholder `<repository-url>` with actual GitHub URL
- Updated dependencies and fixed axios DoS vulnerability
- Fixed qs transitive dependency vulnerability (express → qs arrayLimit bypass)

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
