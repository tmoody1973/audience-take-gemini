---
name: parallel-deep-research
description: Conduct exhaustive, multi-source deep research reports on complex topics and industry intelligence using Parallel CLI.
---

# Parallel Deep Research Skill

Use this skill when an open-ended question requires multi-page synthesis, exhaustive verification, or market intelligence across dozens of sources.

## CLI Usage

```bash
# Run deep research report
parallel-cli research run "Analyze hybrid theatrical and digital release models for micro-budget indie films in 2026" --json

# Using ultra processor tier
parallel-cli research run "Comparative market study of independent sci-fi proofs-of-concept" --processor ultra --json

# Async launch with polling
parallel-cli research run "Filmmaker grants and residency deadlines" --no-wait --json
parallel-cli research poll <TASK_ID> --json
```
