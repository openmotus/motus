# Example: Research Assistant

A department that automates deep research on any topic. Parallel source-gathering agents feed into an analyst that synthesizes findings into a structured report.

## What This Shows

- **Multiple data-fetcher agents** gathering sources in parallel
- **Specialist agents** for evaluation and synthesis
- How to model a **research workflow** with gather → evaluate → synthesize stages
- Passing structured data between sequential workflow steps

## Structure

```
research-assistant/
  agents/
    web-researcher.md        # Data-fetcher — searches the web for sources
    web-researcher.js        # Implementation script
    academic-searcher.md     # Data-fetcher — searches academic/technical sources
    source-evaluator.md      # Specialist — scores source quality and relevance
    report-synthesizer.md    # Specialist — writes the final research report
  workflows/
    deep-research.json       # 3-step workflow config
```

## How It Works

1. **Step 1 (parallel)**: `web-researcher` and `academic-searcher` gather sources from different channels
2. **Step 2 (sequential)**: `source-evaluator` scores each source for relevance, credibility, and recency
3. **Step 3 (sequential)**: `report-synthesizer` combines the top-scored sources into a structured research report with citations

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/research-assistant departments/
   ```

2. Set your search API key (optional — the web researcher can also use `curl`):
   ```bash
   echo "SEARCH_API_KEY=your_key" >> .env
   ```

3. Run the workflow:
   ```bash
   /motus research-assistant deep-research
   ```

## Adapting This Example

**Add a competitor analysis agent** — compare findings against competitors:
```bash
/motus research-assistant agent create competitor-analyzer
```

**Add a fact-checker** — verify claims against known sources:
```bash
/motus research-assistant agent create fact-checker
```

Then update `deep-research.json` step 2 to include them in the evaluation stage.

**Change the output format** — modify `report-synthesizer.md` to produce Markdown, Notion pages, or slide outlines instead of JSON.
