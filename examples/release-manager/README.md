# Example: Release Manager

Automates the release process: run tests, validate the changelog, bump the version, and generate release notes.

## What This Shows

- **Sequential pipeline** where each step gates the next
- **Specialist agents** for changelog and release note generation
- **Helper script** (`version-checker.js`) for semver operations
- A practical CI/CD automation pattern

## Structure

```
release-manager/
  agents/
    test-runner.md              # Runs test suite, reports results
    changelog-validator.md      # Checks CHANGELOG format and completeness
    version-bumper.md           # Bumps semver in package.json
    release-notes-generator.md  # Generates release notes from changelog
  workflow.json                 # Sequential release pipeline
  version-checker.js            # Semver helper (parse, bump, compare)
```

## How It Works

1. **Step 1**: `test-runner` executes the test suite — pipeline stops on failure
2. **Step 2**: `changelog-validator` checks that CHANGELOG.md has an `[Unreleased]` section with entries
3. **Step 3**: `version-bumper` determines the next version and updates `package.json`
4. **Step 4**: `release-notes-generator` compiles a formatted release note from the changelog

## Customization

- Edit `test-runner.md` to use your project's test command
- Adjust `version-bumper.md` for your versioning strategy (semver, calver, etc.)
- Modify `release-notes-generator.md` to match your release note format
