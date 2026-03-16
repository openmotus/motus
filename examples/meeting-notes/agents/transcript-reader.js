#!/usr/bin/env node

/**
 * Transcript Reader — parses meeting transcripts into structured sections
 *
 * Supports three formats:
 *   - Markdown with speaker headings (## Speaker Name)
 *   - Labeled turns ("Speaker: text")
 *   - SRT subtitles (numbered blocks with timestamps)
 *
 * Usage:
 *   node transcript-reader.js path/to/transcript.md
 */

/**
 * Detect the transcript format based on content patterns.
 *
 * @param {string} content - Raw transcript text.
 * @returns {'srt'|'markdown'|'labeled'} Detected format.
 */
function detectFormat(content) {
  // SRT: blocks like "1\n00:00:01,000 --> 00:00:04,000\nText"
  if (/^\d+\r?\n\d{2}:\d{2}:\d{2}/.test(content.trim())) {
    return 'srt';
  }
  // Markdown: speaker headings
  if (/^##\s+\w+/m.test(content)) {
    return 'markdown';
  }
  // Default: labeled turns ("Speaker: text")
  return 'labeled';
}

/**
 * Parse a labeled transcript ("Speaker: text" format).
 *
 * @param {string} content - Raw transcript text.
 * @returns {Array<{speaker: string, text: string}>} Parsed sections.
 */
function parseLabeledTranscript(content) {
  const sections = [];
  const lines = content.split(/\r?\n/);
  // Match "Speaker Name: text" or "[Speaker Name]: text" or "Speaker Name (HH:MM): text"
  const speakerPattern = /^\[?([A-Z][A-Za-z\s.'-]+?)\]?\s*(?:\((\d{1,2}:\d{2}(?::\d{2})?)\))?\s*:\s*(.+)/;

  let current = null;

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      if (current) sections.push(current);
      current = {
        speaker: match[1].trim(),
        timestamp: match[2] || null,
        text: match[3].trim()
      };
    } else if (current && line.trim()) {
      current.text += ' ' + line.trim();
    }
  }
  if (current) sections.push(current);

  return sections;
}

/**
 * Parse an SRT-format transcript.
 *
 * @param {string} content - SRT transcript text.
 * @returns {Array<{speaker: string, timestamp: string, text: string}>} Parsed sections.
 */
function parseSrtTranscript(content) {
  const blocks = content.trim().split(/\r?\n\r?\n/);
  const sections = [];

  for (const block of blocks) {
    const lines = block.split(/\r?\n/);
    if (lines.length < 3) continue;

    // Line 0: sequence number, Line 1: timestamp range, Line 2+: text
    const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2})/);
    const text = lines.slice(2).join(' ').trim();

    // Try to extract speaker from "<v Speaker>text</v>" or "Speaker: text"
    const voiceTag = text.match(/^<v\s+(.+?)>(.+?)(?:<\/v>)?$/);
    const labeledSpeaker = text.match(/^([A-Z][A-Za-z\s.'-]+?):\s*(.+)/);

    if (voiceTag) {
      sections.push({
        speaker: voiceTag[1].trim(),
        timestamp: timeMatch ? timeMatch[1] : null,
        text: voiceTag[2].trim()
      });
    } else if (labeledSpeaker) {
      sections.push({
        speaker: labeledSpeaker[1].trim(),
        timestamp: timeMatch ? timeMatch[1] : null,
        text: labeledSpeaker[2].trim()
      });
    } else {
      sections.push({
        speaker: 'Unknown',
        timestamp: timeMatch ? timeMatch[1] : null,
        text
      });
    }
  }

  return sections;
}

/**
 * Extract unique attendee names from parsed sections.
 *
 * @param {Array<{speaker: string}>} sections - Parsed transcript sections.
 * @returns {string[]} Sorted unique speaker names (excludes "Unknown").
 */
function extractAttendees(sections) {
  const names = new Set();
  for (const s of sections) {
    if (s.speaker && s.speaker !== 'Unknown') {
      names.add(s.speaker);
    }
  }
  return [...names].sort();
}

/**
 * Estimate meeting duration from timestamps in sections.
 *
 * @param {Array<{timestamp: string|null}>} sections - Parsed sections with timestamps.
 * @returns {string} Human-readable duration estimate, or "unknown" if no timestamps.
 */
function estimateDuration(sections) {
  const timestamps = sections
    .map(s => s.timestamp)
    .filter(Boolean)
    .map(ts => {
      const parts = ts.split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    });

  if (timestamps.length < 2) return 'unknown';

  const durationSec = Math.max(...timestamps) - Math.min(...timestamps);
  const minutes = Math.round(durationSec / 60);

  if (minutes < 1) return 'less than 1 minute';
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Parse a transcript string into structured meeting data.
 *
 * @param {string} content - Raw transcript content.
 * @param {string} [title] - Optional meeting title override.
 * @returns {{title: string, attendees: string[], sections: Array, duration: string, metadata: Object}}
 */
function parseTranscript(content, title) {
  const format = detectFormat(content);

  let sections;
  if (format === 'srt') {
    sections = parseSrtTranscript(content);
  } else {
    sections = parseLabeledTranscript(content);
  }

  const attendees = extractAttendees(sections);
  const wordCount = sections.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);

  return {
    title: title || 'Untitled Meeting',
    attendees,
    sections,
    duration: estimateDuration(sections),
    metadata: {
      format,
      wordCount,
      sectionCount: sections.length
    }
  };
}

// CLI entry point
if (require.main === module) {
  const fs = require('fs');
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('Usage: node transcript-reader.js <transcript-file>');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const result = parseTranscript(content, process.argv[3]);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { detectFormat, parseLabeledTranscript, parseSrtTranscript, extractAttendees, estimateDuration, parseTranscript };
