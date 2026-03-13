#!/usr/bin/env node

/**
 * CSV Extractor — Data Fetcher Implementation
 *
 * Reads a CSV file and emits structured row objects.
 * Handles quoted fields, empty values, and common encoding issues.
 */

/**
 * Parse a CSV string into an array of row objects.
 * @param {string} csvContent - Raw CSV text
 * @param {Object} [options] - Parse options
 * @param {string} [options.delimiter=','] - Field delimiter
 * @param {boolean} [options.trimValues=true] - Trim whitespace from values
 * @returns {Object} Parsed result with columns, rows, and warnings
 */
function parseCsv(csvContent, options = {}) {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('csvContent must be a non-empty string');
  }

  const delimiter = options.delimiter || ',';
  const trimValues = options.trimValues !== false;
  const lines = csvContent.trim().split(/\r?\n/);
  const warnings = [];

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header
  const columns = splitCsvLine(lines[0], delimiter).map(col =>
    trimValues ? col.trim() : col
  );

  if (columns.length === 0) {
    throw new Error('CSV header row has no columns');
  }

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // skip blank lines

    const values = splitCsvLine(lines[i], delimiter);

    if (values.length !== columns.length) {
      warnings.push(`Row ${i}: expected ${columns.length} fields, got ${values.length}`);
    }

    const row = {};
    for (let j = 0; j < columns.length; j++) {
      const value = j < values.length ? values[j] : '';
      row[columns[j]] = trimValues ? value.trim() : value;

      if (row[columns[j]] === '') {
        warnings.push(`Row ${i}: missing ${columns[j]} field`);
      }
    }
    rows.push(row);
  }

  return { columns, rows, rowCount: rows.length, warnings };
}

/**
 * Split a single CSV line respecting quoted fields.
 * @param {string} line - CSV line
 * @param {string} delimiter - Field delimiter
 * @returns {string[]} Array of field values
 */
function splitCsvLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'; // escaped quote
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}

/**
 * Detect the delimiter used in a CSV string by checking the first line.
 * @param {string} firstLine - First line of the CSV
 * @returns {string} Detected delimiter
 */
function detectDelimiter(firstLine) {
  const candidates = [',', '\t', ';', '|'];
  let best = ',';
  let maxCount = 0;

  for (const delim of candidates) {
    const count = splitCsvLine(firstLine, delim).length;
    if (count > maxCount) {
      maxCount = count;
      best = delim;
    }
  }

  return best;
}

// CLI execution
if (require.main === module) {
  const fs = require('fs');
  const inputFile = process.argv[2];

  if (!inputFile) {
    // Use sample data
    const sample = `id,first_name,last_name,email,signup_date
1,Alice,Smith,alice@example.com,2025-01-15
2,Bob,Jones,bob@example.com,2025-02-20
3,Charlie,Brown,,2025-03-10
4,"O'Brien, Dana",Lee,dana@example.com,2025-04-05`;

    const result = parseCsv(sample);
    console.log(JSON.stringify({ source: 'sample', ...result }, null, 2));
  } else {
    const raw = fs.readFileSync(inputFile, 'utf8');
    const delimiter = detectDelimiter(raw.split(/\r?\n/)[0]);
    const result = parseCsv(raw, { delimiter });
    console.log(JSON.stringify({ source: inputFile, ...result }, null, 2));
  }
}

module.exports = { parseCsv, splitCsvLine, detectDelimiter };
