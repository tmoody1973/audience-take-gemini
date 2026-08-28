---
name: parallel-web-search
description: Fast, LLM-optimized web search for current events, trade announcements, fact-checking, and lookups using Parallel CLI.
---

# Parallel Web Search Skill

Use this skill when you need fast, high-quality, up-to-date web search results optimized for LLM reasoning and agent workflows.

## CLI Usage

```bash
# Natural language search (fast mode, ~700ms - recommended for agents)
parallel-cli search "Find director, festival awards, and reviews for River of Copper" --mode fast --json

# Keyword search with specific query flags
parallel-cli search "Indie film distribution" -q "film festival premiere" -q "audience award" --json

# Search within specific domains (e.g. Variety, Deadline, Hollywood Reporter)
parallel-cli search "Sundance film reviews" --include-domains variety.com,deadline.com --json

# Filter by publication date
parallel-cli search "Independent cinema box office" --after-date 2026-01-01 --json
```

## Modes
- `turbo` (~250ms): Ultra-fast search for simple lookups
- `fast` (~700ms): Recommended for agentic workflows (high quality with fast response)
- `advanced` (~3s): Exhaustive multi-source query synthesis
