/**
 * Steward Fixes — 2026-05-24
 *
 * Tests for:
 *  1–4.   qs vulnerability resolved (npm audit fix applied)
 *  5.     social-media-pipeline example structure is valid
 *  6.     social-media-pipeline/workflows/distribute-content.json is parseable
 *  7.     distribute-content workflow has 3 sequential/parallel steps
 *  8.     step 2 is parallel (twitter-writer + linkedin-writer run together)
 *  9.     all 4 agent .md files exist and have valid YAML front-matter
 * 10.     platform-formatter.js is a valid Node module (require() succeeds)
 * 11.     normaliseHashtag: single-word tags go lowercase
 * 12.     normaliseHashtag: multi-word tags go CamelCase
 * 13.     normaliseHashtag: strips leading # and cleans punctuation
 * 14.     normaliseHashtag: empty/non-string input returns empty string
 * 15.     prepareHashtags: deduplicates and respects platform limit
 * 16.     prepareHashtags: twitter limit is 2; linkedin limit is 5
 * 17.     prepareHashtags: non-array input returns empty array
 * 18.     twitterCharCount: URLs count as 23 chars
 * 19.     twitterCharCount: plain text is counted character-for-character
 * 20.     twitterCharCount: non-string returns 0
 * 21.     checkFit: twitter 280 limit correctly detected
 * 22.     checkFit: tweet over 280 chars returns fits=false with overage
 * 23.     checkFit: withLink reduces twitter limit by 23
 * 24.     checkFit: linkedin 3000 limit allows long posts
 * 25.     checkFit: unknown platform returns fits=true (non-breaking)
 * 26.     splitIntoThread: single short sentence is a 1-tweet array
 * 27.     splitIntoThread: long text is split into multiple tweets
 * 28.     splitIntoThread: each tweet in a multi-tweet thread is numbered
 * 29.     splitIntoThread: empty / non-string input returns empty array
 * 30.     splitIntoThread: no tweet exceeds 280 chars (after numbering)
 * 31.     getOptimalTiming: returns day/time/rationale for twitter morning
 * 32.     getOptimalTiming: returns day/time/rationale for linkedin morning
 * 33.     getOptimalTiming: unknown platform/slot returns a default (non-null)
 * 34.     PLATFORM_LIMITS: twitter and linkedin keys present with maxChars
 * 35–36.  audit gate: no unexpected high/critical vulns remain
 */

'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { execSync } = require('child_process');

const repoRoot = path.join(__dirname, '..');
const exampleDir = path.join(repoRoot, 'examples', 'social-media-pipeline');
const formatterPath = path.join(exampleDir, 'agents', 'platform-formatter.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`    FAIL: ${name}: ${err.message}`);
  }
}

// ─── Example structure ────────────────────────────────────────────────────────

test('social-media-pipeline: agents/ directory exists', () => {
  assert.ok(fs.existsSync(path.join(exampleDir, 'agents')), 'agents/ missing');
});

test('social-media-pipeline: workflows/ directory exists', () => {
  assert.ok(fs.existsSync(path.join(exampleDir, 'workflows')), 'workflows/ missing');
});

test('social-media-pipeline: README.md exists', () => {
  assert.ok(fs.existsSync(path.join(exampleDir, 'README.md')), 'README.md missing');
});

test('social-media-pipeline: distribute-content.json is valid JSON', () => {
  const p = path.join(exampleDir, 'workflows', 'distribute-content.json');
  assert.ok(fs.existsSync(p), 'distribute-content.json missing');
  const wf = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.strictEqual(wf.name, 'distribute-content');
  assert.strictEqual(wf.department, 'social-media-pipeline');
  assert.ok(Array.isArray(wf.steps), 'steps must be an array');
});

test('social-media-pipeline: workflow has exactly 3 steps', () => {
  const wf = JSON.parse(fs.readFileSync(
    path.join(exampleDir, 'workflows', 'distribute-content.json'), 'utf8'
  ));
  assert.strictEqual(wf.steps.length, 3, `expected 3 steps, got ${wf.steps.length}`);
});

test('social-media-pipeline: step 2 is parallel (twitter + linkedin write together)', () => {
  const wf = JSON.parse(fs.readFileSync(
    path.join(exampleDir, 'workflows', 'distribute-content.json'), 'utf8'
  ));
  const step2 = wf.steps[1];
  assert.strictEqual(step2.parallel, true, 'step 2 should be parallel');
  const names = step2.agents.map(a => a.name);
  assert.ok(names.includes('twitter-writer'), 'twitter-writer missing from step 2');
  assert.ok(names.includes('linkedin-writer'), 'linkedin-writer missing from step 2');
});

test('social-media-pipeline: all 4 agent .md files exist', () => {
  const expected = [
    'content-analyzer.md',
    'twitter-writer.md',
    'linkedin-writer.md',
    'post-scheduler.md'
  ];
  for (const f of expected) {
    assert.ok(
      fs.existsSync(path.join(exampleDir, 'agents', f)),
      `${f} missing`
    );
  }
});

test('social-media-pipeline: all agent .md files have front-matter name field', () => {
  const agents = ['content-analyzer.md', 'twitter-writer.md', 'linkedin-writer.md', 'post-scheduler.md'];
  for (const f of agents) {
    const content = fs.readFileSync(path.join(exampleDir, 'agents', f), 'utf8');
    assert.ok(content.startsWith('---'), `${f} should start with YAML front-matter`);
    assert.ok(/^name:\s*\S/m.test(content), `${f} front-matter missing name field`);
  }
});

test('social-media-pipeline: platform-formatter.js exists', () => {
  assert.ok(fs.existsSync(formatterPath), 'platform-formatter.js missing');
});

// ─── platform-formatter module ────────────────────────────────────────────────

let fmt;
test('platform-formatter: require() succeeds', () => {
  fmt = require(formatterPath);
  assert.strictEqual(typeof fmt, 'object');
  assert.ok(fmt !== null);
});

test('platform-formatter: normaliseHashtag — single word goes lowercase', () => {
  assert.strictEqual(fmt.normaliseHashtag('AI'), '#ai');
  assert.strictEqual(fmt.normaliseHashtag('automation'), '#automation');
});

test('platform-formatter: normaliseHashtag — multi-word tags go CamelCase', () => {
  assert.strictEqual(fmt.normaliseHashtag('claude code'), '#ClaudeCode');
  assert.strictEqual(fmt.normaliseHashtag('open source'), '#OpenSource');
});

test('platform-formatter: normaliseHashtag — strips leading # and cleans punctuation', () => {
  assert.strictEqual(fmt.normaliseHashtag('#Claude Code'), '#ClaudeCode');
  assert.strictEqual(fmt.normaliseHashtag('##ai-agents!'), '#aiagents');
});

test('platform-formatter: normaliseHashtag — empty/non-string returns empty string', () => {
  assert.strictEqual(fmt.normaliseHashtag(''), '');
  assert.strictEqual(fmt.normaliseHashtag(null), '');
  assert.strictEqual(fmt.normaliseHashtag(42), '');
  assert.strictEqual(fmt.normaliseHashtag('   '), '');
});

test('platform-formatter: prepareHashtags — deduplicates tags', () => {
  const result = fmt.prepareHashtags(['#AI', 'AI', 'ai'], 'linkedin');
  assert.strictEqual(result.length, 1, `expected 1 unique tag, got ${result.length}`);
});

test('platform-formatter: prepareHashtags — twitter limit is 2', () => {
  const result = fmt.prepareHashtags(['tag1', 'tag2', 'tag3', 'tag4'], 'twitter');
  assert.ok(result.length <= 2, `expected at most 2 tags for twitter, got ${result.length}`);
});

test('platform-formatter: prepareHashtags — linkedin limit is 5', () => {
  const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'];
  const result = fmt.prepareHashtags(tags, 'linkedin');
  assert.ok(result.length <= 5, `expected at most 5 tags for linkedin, got ${result.length}`);
});

test('platform-formatter: prepareHashtags — non-array input returns empty array', () => {
  assert.deepStrictEqual(fmt.prepareHashtags('not-an-array', 'twitter'), []);
  assert.deepStrictEqual(fmt.prepareHashtags(null, 'linkedin'), []);
  assert.deepStrictEqual(fmt.prepareHashtags(undefined, 'twitter'), []);
});

test('platform-formatter: twitterCharCount — URLs count as 23 chars', () => {
  const text = 'Check this out https://example.com/very/long/path/that/exceeds/23/chars extra';
  const count = fmt.twitterCharCount(text);
  // "Check this out " = 15, URL = 23, " extra" = 6  → 44
  assert.strictEqual(count, 44);
});

test('platform-formatter: twitterCharCount — plain text is counted literally', () => {
  assert.strictEqual(fmt.twitterCharCount('hello world'), 11);
  assert.strictEqual(fmt.twitterCharCount(''), 0);
});

test('platform-formatter: twitterCharCount — non-string returns 0', () => {
  assert.strictEqual(fmt.twitterCharCount(null), 0);
  assert.strictEqual(fmt.twitterCharCount(42), 0);
});

test('platform-formatter: checkFit — tweet within 280 chars fits', () => {
  const result = fmt.checkFit('Short tweet', 'twitter');
  assert.strictEqual(result.fits, true);
  assert.strictEqual(result.overage, 0);
});

test('platform-formatter: checkFit — tweet over 280 chars returns fits=false', () => {
  const longText = 'a'.repeat(281);
  const result = fmt.checkFit(longText, 'twitter');
  assert.strictEqual(result.fits, false);
  assert.ok(result.overage > 0, 'overage should be positive');
});

test('platform-formatter: checkFit — withLink option reduces twitter limit by 23', () => {
  // 257 chars should fit with link, 258 should not
  const text257 = 'a'.repeat(257);
  const text258 = 'a'.repeat(258);
  assert.strictEqual(fmt.checkFit(text257, 'twitter', { withLink: true }).fits, true);
  assert.strictEqual(fmt.checkFit(text258, 'twitter', { withLink: true }).fits, false);
});

test('platform-formatter: checkFit — linkedin allows long posts up to 3000', () => {
  const long = 'word '.repeat(200).trim(); // ~1000 chars
  const result = fmt.checkFit(long, 'linkedin');
  assert.strictEqual(result.fits, true);
});

test('platform-formatter: checkFit — unknown platform returns fits=true', () => {
  const result = fmt.checkFit('some text', 'tiktok');
  assert.strictEqual(result.fits, true);
});

test('platform-formatter: splitIntoThread — short text produces a 1-tweet array', () => {
  const result = fmt.splitIntoThread('This is short.');
  assert.strictEqual(result.length, 1);
  assert.ok(result[0].includes('This is short'));
});

test('platform-formatter: splitIntoThread — long text splits into multiple tweets', () => {
  const long = 'First sentence here. '.repeat(15).trim();
  const result = fmt.splitIntoThread(long);
  assert.ok(result.length > 1, `expected thread, got ${result.length} tweet(s)`);
});

test('platform-formatter: splitIntoThread — multi-tweet threads are numbered', () => {
  const long = 'Sentence. '.repeat(20).trim();
  const result = fmt.splitIntoThread(long);
  if (result.length > 1) {
    assert.ok(result[0].startsWith('1/'), `first tweet should start with "1/", got: ${result[0].substring(0, 10)}`);
    assert.ok(result[1].startsWith('2/'), `second tweet should start with "2/"`);
  }
});

test('platform-formatter: splitIntoThread — empty/non-string input returns empty array', () => {
  assert.deepStrictEqual(fmt.splitIntoThread(''), []);
  assert.deepStrictEqual(fmt.splitIntoThread(null), []);
  assert.deepStrictEqual(fmt.splitIntoThread(undefined), []);
  assert.deepStrictEqual(fmt.splitIntoThread('   '), []);
});

test('platform-formatter: splitIntoThread — no tweet exceeds 280 chars', () => {
  const long = 'This is a reasonably long sentence that we will repeat to force splitting. '.repeat(10);
  const result = fmt.splitIntoThread(long);
  for (const tweet of result) {
    assert.ok(
      fmt.twitterCharCount(tweet) <= 280,
      `tweet exceeds 280 chars: "${tweet.substring(0, 30)}..." (${fmt.twitterCharCount(tweet)})`
    );
  }
});

test('platform-formatter: getOptimalTiming — twitter morning returns day/time/rationale', () => {
  const timing = fmt.getOptimalTiming('twitter', 'morning');
  assert.ok(timing.day && typeof timing.day === 'string', 'day missing');
  assert.ok(timing.time && typeof timing.time === 'string', 'time missing');
  assert.ok(timing.rationale && typeof timing.rationale === 'string', 'rationale missing');
});

test('platform-formatter: getOptimalTiming — linkedin morning returns correct fields', () => {
  const timing = fmt.getOptimalTiming('linkedin', 'morning');
  assert.ok(timing.day, 'day should be set');
  assert.ok(timing.time, 'time should be set');
});

test('platform-formatter: getOptimalTiming — unknown platform returns non-null default', () => {
  const timing = fmt.getOptimalTiming('tiktok', 'morning');
  assert.ok(timing !== null && timing !== undefined);
  assert.ok(typeof timing === 'object');
});

test('platform-formatter: PLATFORM_LIMITS has twitter and linkedin keys', () => {
  assert.ok(fmt.PLATFORM_LIMITS.twitter, 'twitter limits missing');
  assert.ok(fmt.PLATFORM_LIMITS.linkedin, 'linkedin limits missing');
  assert.strictEqual(fmt.PLATFORM_LIMITS.twitter.maxChars, 280);
  assert.strictEqual(fmt.PLATFORM_LIMITS.linkedin.maxChars, 3000);
});

// ─── Audit gate ───────────────────────────────────────────────────────────────

test('npm audit: no unexpected high/critical vulnerabilities', () => {
  let audit;
  try {
    audit = execSync('npm audit --json', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  } catch (err) {
    audit = err.stdout ? err.stdout.toString() : '';
  }
  const parsed = JSON.parse(audit);
  const vulns = parsed.metadata && parsed.metadata.vulnerabilities;
  assert.ok(vulns, 'audit metadata should include vulnerabilities');
  assert.strictEqual(vulns.high, 0, `high vulns should be 0, got ${vulns.high}`);
  assert.strictEqual(vulns.critical, 0, `critical vulns should be 0, got ${vulns.critical}`);
});

test('npm audit: moderate vulns are only the known googleapis/uuid transitive chain', () => {
  let audit;
  try {
    audit = execSync('npm audit --json', { cwd: repoRoot, stdio: ['pipe', 'pipe', 'pipe'] }).toString();
  } catch (err) {
    audit = err.stdout ? err.stdout.toString() : '';
  }
  const parsed = JSON.parse(audit);
  const vulns = parsed.metadata && parsed.metadata.vulnerabilities;
  const knownModerate = (parsed.vulnerabilities && Object.keys(parsed.vulnerabilities)
    .filter(pkg => ['uuid', 'gaxios', 'googleapis-common', 'googleapis'].includes(pkg)).length) || 0;
  const unexpectedModerate = (vulns.moderate || 0) - knownModerate;
  assert.strictEqual(unexpectedModerate, 0,
    `unexpected moderate vulns: ${unexpectedModerate} (total ${vulns.moderate}, known ${knownModerate})`);
});

// ─── Report ───────────────────────────────────────────────────────────────────

console.log(`  Total:  ${passed + failed}`);
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failed > 0) process.exit(1);
