#!/usr/bin/env node

/**
 * Version Checker — determines the appropriate version bump from changelog entries.
 *
 * Reads CHANGELOG.md, parses the [Unreleased] section, classifies entries
 * by section (Added/Changed/Fixed/etc.), and returns a recommended semver bump.
 *
 * Usage:
 *   node version-checker.js                 # prints JSON result
 *   node version-checker.js --current-only  # prints current version only
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse a semver string into its components.
 *
 * @param {string} version - Semver string (e.g. "1.2.3" or "1.2.3-beta").
 * @returns {{ major: number, minor: number, patch: number, prerelease: string|null }}
 */
function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null
  };
}

/**
 * Bump a semver version by the given type.
 *
 * @param {string} current - Current semver string.
 * @param {'major'|'minor'|'patch'} bumpType - Type of bump.
 * @returns {string} The bumped version string.
 */
function bumpVersion(current, bumpType) {
  const parsed = parseSemver(current);
  if (!parsed) return current;

  switch (bumpType) {
    case 'major':
      return `${parsed.major + 1}.0.0`;
    case 'minor':
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case 'patch':
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      return current;
  }
}

/**
 * Extract the [Unreleased] section entries from changelog content.
 *
 * @param {string} content - Full CHANGELOG.md content.
 * @returns {{ section: string, entries: string[] }[]} Parsed sections with their entries.
 */
function parseUnreleasedSection(content) {
  const lines = content.split('\n');
  const sections = [];
  let inUnreleased = false;
  let currentSection = null;

  for (const line of lines) {
    // Detect [Unreleased] header
    if (/^## \[Unreleased\]/i.test(line)) {
      inUnreleased = true;
      continue;
    }

    // Stop at the next version header
    if (inUnreleased && /^## \[\d+\.\d+\.\d+\]/.test(line)) {
      break;
    }

    if (!inUnreleased) continue;

    // Detect section headers (### Added, ### Changed, etc.)
    const sectionMatch = line.match(/^### (\w+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections.push({ section: currentSection, entries: [] });
      continue;
    }

    // Collect entries (lines starting with "- ")
    if (currentSection && /^- /.test(line)) {
      sections[sections.length - 1].entries.push(line.substring(2));
    }
  }

  return sections;
}

/**
 * Determine the recommended semver bump type from parsed sections.
 *
 * @param {{ section: string, entries: string[] }[]} sections - Parsed changelog sections.
 * @returns {'major'|'minor'|'patch'} Recommended bump type.
 */
function determineBumpType(sections) {
  const sectionNames = sections.map(s => s.section.toLowerCase());

  // Breaking changes = major
  if (sectionNames.includes('removed') ||
      sections.some(s => s.entries.some(e => /breaking/i.test(e)))) {
    return 'major';
  }

  // New features = minor
  if (sectionNames.includes('added')) {
    return 'minor';
  }

  // Everything else = patch
  return 'patch';
}

/**
 * Read the current version from a package.json file.
 *
 * @param {string} projectRoot - Path to the project root.
 * @returns {string|null} The version string, or null if not found.
 */
function readCurrentVersion(projectRoot) {
  try {
    const pkgPath = path.join(projectRoot, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version || null;
  } catch {
    return null;
  }
}

// CLI entry point
if (require.main === module) {
  const projectRoot = process.argv[2] || process.cwd();
  const currentOnly = process.argv.includes('--current-only');

  const currentVersion = readCurrentVersion(projectRoot);

  if (currentOnly) {
    console.log(currentVersion || 'unknown');
    process.exit(0);
  }

  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');

  try {
    const content = fs.readFileSync(changelogPath, 'utf8');
    const sections = parseUnreleasedSection(content);
    const totalEntries = sections.reduce((sum, s) => sum + s.entries.length, 0);
    const bumpType = determineBumpType(sections);
    const nextVersion = currentVersion ? bumpVersion(currentVersion, bumpType) : null;

    console.log(JSON.stringify({
      currentVersion,
      bumpType,
      nextVersion,
      totalEntries,
      sections: sections.map(s => ({ section: s.section, count: s.entries.length })),
      reason: `${bumpType} bump: ${sections.map(s => `${s.entries.length} ${s.section}`).join(', ')}`
    }, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  parseSemver,
  bumpVersion,
  parseUnreleasedSection,
  determineBumpType,
  readCurrentVersion
};
