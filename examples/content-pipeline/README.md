# Example: Content Pipeline

A department that automates content creation with a 3-step workflow: research a topic, draft an article, and review it for quality.

## What This Shows

- A **3-step workflow** (vs 2 steps in the daily-briefing example)
- **Specialist** agents for analysis and content generation
- **Data-fetcher** agents for gathering source material
- Combining **parallel research** with **sequential writing and review**
- How agents pass output between workflow steps

## Structure

```
content-pipeline/
  agents/
    topic-researcher.md     # Data-fetcher — searches for sources
    topic-researcher.js     # Implementation script
    article-writer.md       # Specialist — drafts the article
    quality-reviewer.md     # Specialist — reviews and scores
  workflows/
    publish-article.json    # 3-step workflow config
```

## How It Works

1. **Step 1 (parallel)**: `topic-researcher` gathers sources and key points from the web
2. **Step 2 (sequential)**: `article-writer` takes the research and drafts a structured article
3. **Step 3 (sequential)**: `quality-reviewer` scores the draft for clarity, accuracy, and SEO

Each step receives the combined output of all previous steps, so the writer sees the research and the reviewer sees both.

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/content-pipeline departments/
   ```

2. Set your API keys in `.env`:
   ```bash
   SEARCH_API_KEY=your_search_api_key   # Any search API (SerpAPI, Tavily, etc.)
   ```

3. Run the workflow:
   ```bash
   /motus content-pipeline publish-article
   ```

## Adapting This Example

**Add more research agents** — run multiple sources in parallel:
```bash
/motus content-pipeline agent create news-fetcher
/motus content-pipeline agent create competitor-analyzer
```

Then update `publish-article.json` step 1 to include them in the parallel group.

**Add publishing** — create a specialist that posts to your CMS:
```bash
/motus content-pipeline agent create cms-publisher
```

**Change the output format** — modify `article-writer.md` to output markdown, HTML, or plain text.
