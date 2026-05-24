/**
 * platform-formatter.js
 *
 * Utility module for social-media-pipeline.
 * Provides platform-specific formatting rules, character limits, and
 * hashtag normalisation helpers used by the writer agents.
 */

'use strict';

// ─── Platform limits ──────────────────────────────────────────────────────────

const PLATFORM_LIMITS = {
  twitter: {
    maxChars: 280,
    maxCharsWithLink: 257,   // 280 – 23 (t.co URL length)
    maxHashtags: 2,
    threadMaxTweets: 25,
    optimalWordCount: { min: 15, max: 60 }
  },
  linkedin: {
    maxChars: 3000,
    hookMaxChars: 210,       // approx characters visible before "see more"
    maxHashtags: 5,
    optimalWordCount: { min: 150, max: 300 }
  }
};

// ─── Hashtag helpers ──────────────────────────────────────────────────────────

/**
 * Normalise a hashtag string to the canonical #PascalCase or #lowercase form.
 * Strips spaces, punctuation, and leading # symbols, then re-prefixes.
 *
 * @param {string} tag - Raw tag text (e.g. "claude code", "#ClaudeCode", "AI agents")
 * @returns {string} Normalised hashtag (e.g. "#ClaudeCode", "#aiagents")
 */
function normaliseHashtag(tag) {
  if (typeof tag !== 'string' || !tag.trim()) return '';
  // Strip leading # and whitespace
  const stripped = tag.replace(/^#+\s*/, '').trim();
  // Remove anything that isn't alphanumeric or a space
  const clean = stripped.replace(/[^a-zA-Z0-9 ]/g, '');
  if (!clean) return '';
  // CamelCase multi-word tags, lowercase single-word tags
  const words = clean.split(/\s+/).filter(Boolean);
  const normalised = words.length > 1
    ? words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
    : clean.toLowerCase();
  return `#${normalised}`;
}

/**
 * Deduplicate and limit hashtags for a given platform.
 *
 * @param {string[]} tags - Array of raw hashtag strings
 * @param {string} platform - 'twitter' | 'linkedin'
 * @returns {string[]} Cleaned, deduplicated, limited hashtags
 */
function prepareHashtags(tags, platform) {
  if (!Array.isArray(tags)) return [];
  const limit = (PLATFORM_LIMITS[platform] || {}).maxHashtags || 5;
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    const norm = normaliseHashtag(tag);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
      if (result.length >= limit) break;
    }
  }
  return result;
}

// ─── Character counting ───────────────────────────────────────────────────────

/**
 * Count the effective Twitter character length of a string.
 * URLs (http:// or https://) count as 23 characters regardless of length.
 *
 * @param {string} text
 * @returns {number}
 */
function twitterCharCount(text) {
  if (typeof text !== 'string') return 0;
  const URL_RE = /https?:\/\/\S+/g;
  const cleaned = text.replace(URL_RE, match => 'x'.repeat(23));
  return cleaned.length;
}

/**
 * Check whether a text fits within a platform's character limit.
 *
 * @param {string} text
 * @param {string} platform - 'twitter' | 'linkedin'
 * @param {{ withLink?: boolean }} [options]
 * @returns {{ fits: boolean, chars: number, limit: number, overage: number }}
 */
function checkFit(text, platform, options = {}) {
  if (typeof text !== 'string') {
    return { fits: false, chars: 0, limit: 0, overage: 0 };
  }
  const cfg = PLATFORM_LIMITS[platform];
  if (!cfg) return { fits: true, chars: text.length, limit: Infinity, overage: 0 };

  let chars;
  let limit;
  if (platform === 'twitter') {
    chars = twitterCharCount(text);
    limit = options.withLink ? cfg.maxCharsWithLink : cfg.maxChars;
  } else {
    chars = text.length;
    limit = cfg.maxChars;
  }
  return {
    fits: chars <= limit,
    chars,
    limit,
    overage: Math.max(0, chars - limit)
  };
}

// ─── Thread splitter ──────────────────────────────────────────────────────────

/**
 * Split a long text into a Twitter thread, respecting the 280-char limit.
 * Numbers each tweet (1/, 2/, …) and leaves room for the numbering suffix.
 *
 * @param {string} text - Full text to split
 * @param {number} [maxTweets=10] - Maximum number of tweets
 * @returns {string[]} Array of tweet strings
 */
function splitIntoThread(text, maxTweets = 10) {
  if (typeof text !== 'string' || !text.trim()) return [];

  const MAX_TWEET = 270;   // 280 - ~10 chars for " N/" suffix
  const sentences = text.match(/[^.!?]+[.!?]+|\S[^.!?]*/g) || [text];
  const tweets = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence.trim()}` : sentence.trim();
    if (twitterCharCount(candidate) <= MAX_TWEET) {
      current = candidate;
    } else {
      if (current) tweets.push(current.trim());
      current = sentence.trim();
    }
    if (tweets.length >= maxTweets - 1) break;
  }
  if (current.trim()) tweets.push(current.trim());

  // Add numbering suffix
  if (tweets.length > 1) {
    return tweets.map((t, i) => `${i + 1}/ ${t}`);
  }
  return tweets;
}

// ─── Optimal timing ───────────────────────────────────────────────────────────

/**
 * Return the recommended posting time for a given platform.
 *
 * @param {string} platform - 'twitter' | 'linkedin'
 * @param {'morning' | 'midday' | 'evening'} [slot='morning']
 * @returns {{ day: string, time: string, rationale: string }}
 */
function getOptimalTiming(platform, slot = 'morning') {
  const schedule = {
    twitter: {
      morning: { day: 'Tuesday', time: '9:00 AM', rationale: 'Peak commute + morning news consumption' },
      midday:  { day: 'Wednesday', time: '12:00 PM', rationale: 'Lunch break scroll peak' },
      evening: { day: 'Thursday', time: '5:00 PM', rationale: 'End-of-workday engagement spike' }
    },
    linkedin: {
      morning: { day: 'Tuesday', time: '8:30 AM', rationale: 'Professionals check feed before meetings' },
      midday:  { day: 'Wednesday', time: '12:00 PM', rationale: 'Lunch break professional browsing' },
      evening: { day: 'Thursday', time: '5:30 PM', rationale: 'End-of-day industry news check' }
    }
  };
  return (schedule[platform] && schedule[platform][slot]) || { day: 'Tuesday', time: '9:00 AM', rationale: 'Default' };
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  PLATFORM_LIMITS,
  normaliseHashtag,
  prepareHashtags,
  twitterCharCount,
  checkFit,
  splitIntoThread,
  getOptimalTiming
};
