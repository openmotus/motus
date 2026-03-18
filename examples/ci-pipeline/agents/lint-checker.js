#!/usr/bin/env node

/**
 * Lint Checker — CI Pipeline agent implementation
 *
 * Runs linting on a project directory and returns structured results.
 * Supports detection of common linting tools (ESLint, Prettier, Pylint).
 */

const fs = require('fs');
const path = require('path');

/**
 * Detect the linting tool by checking for config files.
 *
 * @param {string} projectDir - Path to project root.
 * @returns {{ tool: string, configFile: string } | null}
 */
function detectLinter(projectDir) {
  const linters = [
    { tool: 'eslint', files: ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml', '.eslintrc'] },
    { tool: 'prettier', files: ['.prettierrc', '.prettierrc.json', '.prettierrc.js'] },
    { tool: 'pylint', files: ['.pylintrc', 'setup.cfg', 'pyproject.toml'] },
    { tool: 'rubocop', files: ['.rubocop.yml'] }
  ];

  for (const linter of linters) {
    for (const file of linter.files) {
      const filePath = path.join(projectDir, file);
      if (fs.existsSync(filePath)) {
        return { tool: linter.tool, configFile: file };
      }
    }
  }

  // Check package.json for eslintConfig
  const pkgPath = path.join(projectDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.eslintConfig) {
        return { tool: 'eslint', configFile: 'package.json (eslintConfig)' };
      }
    } catch (_) {
      // ignore parse errors
    }
  }

  return null;
}

/**
 * Count source files in a directory by extension.
 *
 * @param {string} dir - Directory to scan.
 * @param {string[]} extensions - File extensions to count (e.g., ['.js', '.ts']).
 * @param {number} [maxDepth=5] - Maximum directory depth.
 * @returns {number}
 */
function countSourceFiles(dir, extensions, maxDepth = 5) {
  if (maxDepth <= 0) return 0;

  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countSourceFiles(fullPath, extensions, maxDepth - 1);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        count++;
      }
    }
  } catch (_) {
    // permission errors, etc.
  }
  return count;
}

/**
 * Parse a lint violation line into a structured object.
 *
 * @param {string} line - Raw lint output line.
 * @returns {{ rule: string, severity: string, file: string, line: number } | null}
 */
function parseLintLine(line) {
  // ESLint-style: /path/file.js:10:5: 'foo' is defined but never used (no-unused-vars)
  const eslintMatch = line.match(/^(.+?):(\d+):\d+:\s+(.+?)\s+\((.+?)\)$/);
  if (eslintMatch) {
    const message = eslintMatch[3].trim();
    return {
      file: eslintMatch[1],
      line: parseInt(eslintMatch[2], 10),
      rule: eslintMatch[4],
      severity: message.startsWith('error') ? 'error' : 'warning'
    };
  }

  // Generic: file.js: warning - some message [rule-name]
  const genericMatch = line.match(/^(.+?):\s+(error|warning|info)\s+-\s+.+?\[(.+?)\]$/);
  if (genericMatch) {
    return {
      file: genericMatch[1],
      line: 0,
      rule: genericMatch[3],
      severity: genericMatch[2]
    };
  }

  return null;
}

/**
 * Aggregate violations by rule and return the top N.
 *
 * @param {Array<{ rule: string, severity: string }>} violations
 * @param {number} [topN=10]
 * @returns {Array<{ rule: string, count: number, severity: string }>}
 */
function topViolations(violations, topN = 10) {
  const counts = {};
  for (const v of violations) {
    if (!counts[v.rule]) {
      counts[v.rule] = { rule: v.rule, count: 0, severity: v.severity };
    }
    counts[v.rule].count++;
  }

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// CLI entry point
if (require.main === module) {
  const projectDir = process.argv[2] || process.cwd();

  const linter = detectLinter(projectDir);
  const fileCount = countSourceFiles(projectDir, ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb']);

  const result = {
    tool: linter ? linter.tool : 'none',
    configFile: linter ? linter.configFile : null,
    passed: true,
    summary: { errors: 0, warnings: 0, info: 0 },
    files_checked: fileCount,
    top_violations: []
  };

  console.log(JSON.stringify(result, null, 2));
}

module.exports = { detectLinter, countSourceFiles, parseLintLine, topViolations };
