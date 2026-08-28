---
name: parallel-web-extract
description: Extract clean, structured markdown content from web URLs, JavaScript-rendered apps, and PDF documents using Parallel CLI.
---

# Parallel Web Extract Skill

Use this skill when you need to extract readable markdown content, film festival programs, trade articles, or filmmaker portfolios from public URLs.

## CLI Usage

```bash
# Basic extraction to JSON
parallel-cli extract https://example.com/project-page --json

# Objective-focused extraction
parallel-cli extract https://example.com/project-page --objective "Extract film synopsis, director bio, and release history" --json

# Get full unsummarized page content
parallel-cli extract https://example.com/project-page --full-content --json
```
