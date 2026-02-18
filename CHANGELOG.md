# Changelog

All notable changes to Motus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- CI workflow with Node.js 18/20/22 matrix testing
- CI badge on README
- OAuth-registry test suite (77 tests) covering config generation, integration management, standard configs
- Doc-generator test suite (22 tests) covering integration docs, command reference, edge cases
- Comprehensive validator test suite (70 tests) covering name validation, type detection, context schemas
- Error-handling test suite (21 tests) covering edge cases and improved error messages
- Community health files: Code of Conduct, Security Policy, issue/PR templates
- Troubleshooting table in README for quick problem resolution
- CHANGELOG.md
- Repository/homepage/bugs URLs in package.json

### Changed
- Added JSDoc documentation to all 20 Handlebars template helpers with usage examples
- Overhauled README with concrete daily-briefing example, architecture diagram, and cleaner structure
- Improved error messages in registry-manager.js (missing fields listed individually, available departments shown)
- Improved error messages in template-engine.js (suggests checking templates/ directory)
- Updated CONTRIBUTING.md with actual GitHub URL and all test suite details
- Total test count: 48 → 267 across 7 suites

### Fixed
- Fixed hardcoded user path in test-template-engine.js (used `path.join` instead of absolute path)
- Fixed hardcoded user path in doc-generator.js troubleshooting output
- Fixed CONTRIBUTING.md placeholder `<repository-url>` with actual GitHub URL
- Updated dependencies and fixed axios DoS vulnerability

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
