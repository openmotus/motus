# Changelog

All notable changes to Motus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
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
