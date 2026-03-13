# Example: Data Pipeline (ETL)

A department that models a classic Extract-Transform-Load pipeline. A CSV extractor pulls raw data, parallel transformers clean and enrich it, a schema validator checks integrity, and a loader writes the results.

## What This Shows

- **Data-fetcher** agent that reads and parses source files
- **Parallel specialist agents** running independent transformations on the same dataset
- **Sequential validation** before the final load step
- How to model a multi-stage ETL pipeline with Motus

## Structure

```
data-pipeline/
  agents/
    csv-extractor.md        # Data-fetcher — reads and parses CSV files
    csv-extractor.js        # Implementation script
    data-cleaner.md         # Specialist — normalizes and deduplicates
    data-enricher.md        # Specialist — adds computed fields
    schema-validator.md     # Specialist — validates output schema
    db-loader.md            # Specialist — writes results to destination
  workflows/
    etl-pipeline.json       # 4-step workflow config
```

## How It Works

1. **Step 1 (sequential)**: `csv-extractor` reads the source CSV and outputs structured rows
2. **Step 2 (parallel)**: `data-cleaner` normalizes values and removes duplicates while `data-enricher` adds computed columns (e.g., full name, age bucket)
3. **Step 3 (sequential)**: `schema-validator` checks that every row matches the expected schema
4. **Step 4 (sequential)**: `db-loader` writes validated records to the destination (database, API, or file)

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/data-pipeline departments/
   ```

2. Run the workflow:
   ```bash
   /motus data-pipeline etl-pipeline
   ```

## Adapting This Example

**Add a source connector** — swap `csv-extractor` for a database reader or API fetcher:
```bash
/motus data-pipeline agent create api-extractor
```

**Add data quality scoring** — insert a parallel agent that scores row quality:
```bash
/motus data-pipeline agent create quality-scorer
```

Then update `etl-pipeline.json` step 2 to include it in the parallel group.

**Change the destination** — modify `db-loader.md` to write to PostgreSQL, BigQuery, S3, or a REST API instead of a local file.
