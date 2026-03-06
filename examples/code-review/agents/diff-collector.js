#!/usr/bin/env node

/**
 * Diff Collector — Data Fetcher Implementation
 *
 * Collects git diff data for code review.
 * Supports local changes (staged/unstaged) or PR diffs via GitHub CLI.
 */

const { execSync } = require('child_process');

/**
 * Collect diff data from git.
 * @param {Object} options - Collection options
 * @param {string} [options.base] - Base branch to diff against (default: main)
 * @param {number} [options.prNumber] - PR number to fetch diff from GitHub
 * @returns {Object} Structured diff data
 */
function collectDiff(options = {}) {
  const { base = 'main', prNumber } = options;

  let rawDiff;
  if (prNumber) {
    rawDiff = execSync(`gh pr diff ${prNumber}`, { encoding: 'utf8' });
  } else {
    rawDiff = execSync(`git diff ${base}...HEAD`, { encoding: 'utf8' });
  }

  const files = parseDiff(rawDiff);
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return {
    files,
    summary: {
      totalFiles: files.length,
      totalAdditions,
      totalDeletions
    }
  };
}

/**
 * Parse a unified diff into structured file objects.
 * @param {string} rawDiff - Raw unified diff output
 * @returns {Array<Object>} Parsed file diffs
 */
function parseDiff(rawDiff) {
  const files = [];
  const fileSections = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const section of fileSections) {
    const pathMatch = section.match(/^a\/(.+?) b\//);
    if (!pathMatch) continue;

    const filePath = pathMatch[1];

    // Skip binary and lock files
    if (/\.(png|jpg|gif|ico|woff|ttf|lock)$/.test(filePath)) continue;
    if (filePath === 'package-lock.json') continue;

    const additions = (section.match(/^\+[^+]/gm) || []).length;
    const deletions = (section.match(/^-[^-]/gm) || []).length;

    const status = additions > 0 && deletions > 0 ? 'modified'
      : additions > 0 ? 'added'
      : 'deleted';

    files.push({
      path: filePath,
      status,
      additions,
      deletions,
      diff: section.length > 5000
        ? section.slice(0, 5000) + '\n... (truncated)'
        : section
    });
  }

  return files;
}

// CLI execution
if (require.main === module) {
  const prNumber = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
  const base = process.argv[3] || 'main';

  try {
    const result = collectDiff({ base, prNumber: isNaN(prNumber) ? undefined : prNumber });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Diff collection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { collectDiff, parseDiff };
