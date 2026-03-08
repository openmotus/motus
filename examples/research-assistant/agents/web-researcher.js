#!/usr/bin/env node

/**
 * Web Researcher — Data Fetcher Implementation
 *
 * Searches the web for sources on a given topic.
 * Uses a search API if SEARCH_API_KEY is set, otherwise falls back
 * to returning a structured placeholder for the agent to fill via Bash.
 */

const https = require('https');

/**
 * Search the web for sources on a topic.
 * @param {string} query - Research topic or question
 * @param {Object} options - Search options
 * @param {number} [options.maxResults=10] - Maximum sources to return
 * @param {string} [options.recency] - Recency filter (e.g., 'month', 'year')
 * @returns {Promise<Object>} Structured search results
 */
async function searchWeb(query, options = {}) {
  const { maxResults = 10, recency = 'year' } = options;
  const apiKey = process.env.SEARCH_API_KEY;

  if (!apiKey) {
    // Return a template for the agent to fill manually via Bash tools
    return {
      sources: [],
      query,
      totalFound: 0,
      note: 'No SEARCH_API_KEY set. Agent should use Bash tool to search manually.'
    };
  }

  // Example: use a search API (replace with your preferred provider)
  const url = `https://api.search.example/v1/search?q=${encodeURIComponent(query)}&count=${maxResults}&freshness=${recency}`;

  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `Bearer ${apiKey}` } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const sources = (parsed.results || []).map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet || r.description || '',
            publishedDate: r.publishedDate || null,
            sourceType: classifySource(r.url)
          }));
          resolve({ sources, query, totalFound: parsed.totalEstimatedMatches || sources.length });
        } catch (err) {
          reject(new Error(`Failed to parse search results: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Classify a URL into a source type.
 * @param {string} url - Source URL
 * @returns {string} Source type
 */
function classifySource(url) {
  if (!url) return 'unknown';
  const lower = url.toLowerCase();
  if (lower.includes('github.com') || lower.includes('docs.')) return 'documentation';
  if (lower.includes('news') || lower.includes('reuters') || lower.includes('bbc')) return 'news';
  if (lower.includes('reddit.com') || lower.includes('stackoverflow')) return 'forum';
  if (lower.includes('tutorial') || lower.includes('learn')) return 'tutorial';
  if (lower.includes('.gov') || lower.includes('.edu')) return 'official';
  return 'blog';
}

// CLI execution
if (require.main === module) {
  const query = process.argv.slice(2).join(' ') || 'Claude Code automation framework';

  searchWeb(query)
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {
      console.error('Search failed:', error.message);
      process.exit(1);
    });
}

module.exports = { searchWeb, classifySource };
