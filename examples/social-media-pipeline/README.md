# Social Media Pipeline

Takes source content — a blog post, article URL, or raw text — and produces platform-optimized social media posts for Twitter/X and LinkedIn, along with a posting schedule.

## Structure

```
social-media-pipeline/
├── agents/
│   ├── content-analyzer.md      # Reads source content, extracts key messages and tone
│   ├── twitter-writer.md        # Writes Twitter/X posts (thread or single tweet)
│   ├── linkedin-writer.md       # Writes LinkedIn posts
│   ├── platform-formatter.js    # Utility: char limits, hashtag helpers, thread splitter
│   └── post-scheduler.md        # Assembles final schedule with optimal timing
└── workflows/
    └── distribute-content.json  # 3-step pipeline: analyze → write (parallel) → schedule
```

## How It Works

**Step 1 — Analyze** (`content-analyzer`): Reads the source content and returns structured analysis: core message, key takeaways, tone, target audience, quotable lines, and CTA.

**Step 2 — Write in parallel** (`twitter-writer` + `linkedin-writer`): Both agents receive the same analysis and write platform-appropriate posts simultaneously:
- Twitter: decides between single tweet vs. thread, respects 280-char limit, 2 hashtags max
- LinkedIn: writes 150–300 word professional post with hook line, whitespace-friendly paragraphs, 3–5 hashtags

**Step 3 — Schedule** (`post-scheduler`): Assembles both outputs into a final JSON package with recommended posting days and times, staggered to avoid cannibalization.

## Platform Formatter Module

`platform-formatter.js` is a shared utility with no external dependencies:

```javascript
const {
  PLATFORM_LIMITS,    // { twitter: {...}, linkedin: {...} }
  normaliseHashtag,   // "#claude code" → "#ClaudeCode"
  prepareHashtags,    // deduplicate + limit by platform
  twitterCharCount,   // counts URLs as 23 chars
  checkFit,           // { fits, chars, limit, overage }
  splitIntoThread,    // splits long text into numbered tweets
  getOptimalTiming    // { day, time, rationale } by platform + slot
} = require('./agents/platform-formatter');
```

## Usage

```bash
# In Claude Code
/motus social-media-pipeline distribute-content

# Provide source content as:
# - A URL: "https://myblog.com/my-post"
# - A file path: "drafts/article.md"
# - Raw text pasted into the prompt
```

Output is saved to `output/social-schedules/social-schedule-{date}.json`.
