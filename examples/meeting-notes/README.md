# Example: Meeting Notes

A department that automates post-meeting workflows. A transcript reader ingests raw meeting text, parallel agents extract action items and key decisions, a summary writer compiles the final notes, and a follow-up drafter prepares emails.

## What This Shows

- **Data-fetcher** agent that reads and parses meeting transcripts
- **Parallel specialist agents** extracting different insights from the same source
- **Sequential synthesis** that combines parallel outputs into final deliverables
- How to model a fan-out/fan-in workflow with Motus

## Structure

```
meeting-notes/
  agents/
    transcript-reader.md      # Data-fetcher — reads raw transcript
    transcript-reader.js      # Implementation script
    action-extractor.md       # Specialist — extracts action items with owners
    decision-extractor.md     # Specialist — identifies key decisions
    summary-writer.md         # Specialist — writes structured meeting summary
    followup-drafter.md       # Specialist — drafts follow-up emails
  workflows/
    post-meeting.json         # 3-step workflow config
```

## How It Works

1. **Step 1 (sequential)**: `transcript-reader` ingests the raw transcript and outputs structured sections with speaker labels and timestamps
2. **Step 2 (parallel)**: `action-extractor` identifies action items with owners and deadlines while `decision-extractor` captures key decisions and their rationale
3. **Step 3 (sequential)**: `summary-writer` combines the transcript, actions, and decisions into formatted meeting notes, then `followup-drafter` prepares emails to attendees

## Setup

1. Copy this example into your Motus installation:
   ```bash
   cp -r examples/meeting-notes departments/
   ```

2. Run the workflow:
   ```bash
   /motus meeting-notes post-meeting
   ```

## Adapting This Example

**Add a sentiment tracker** — insert a parallel agent that gauges team sentiment throughout the meeting:
```bash
/motus meeting-notes agent create sentiment-tracker
```

**Connect to calendar** — add a data-fetcher that pulls attendee lists from Google Calendar to auto-address follow-up emails.

**Change output format** — modify `summary-writer.md` to emit Confluence pages, Notion blocks, or Slack messages instead of markdown.
