# Audience Take — The Public Scouting Program for Cinema

> **Fan-First Film Discovery & Autonomous Social Scouting**  
> Powered by **Google Gemini 3.5 Flash**, **Gemini 3.7 Flash Video Understanding**, and **Parallel Web Systems**.

---

## 🌟 Overview

**Audience Take** is a fan-first social scouting platform for overlooked films, series, documentaries, shorts, proof-of-concept videos, and creator projects.

- **Fan Scouts**: Nominate public work, inspect evidence ledgers, register screening demand, cast pathway votes, and publish structured fan Takes.
- **Autonomous Research Agent**: A 6-stage pipeline powered by **Gemini 3.5 Flash** and **Parallel Search API / CLI** that synthesizes grounded Scout Cards with verified trade citations and realistic growth pathways.
- **Multimodal Trailer Critic**: Independent video understanding powered by **Gemini 3.7 Flash** providing timestamped narrative beats, craft scores (cinematography, sound design, rhythmic editing), and persuasion arcs.
- **Design System**: "The Public Scouting Program" — High-contrast festival aesthetic with League Gothic typography, warm paper ground, ink borders, and hard drop shadows.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, League Gothic AT, Lucide Icons
- **AI & Reasoning Models**:
  - **Scout Research Agent**: Google Gemini 3.5 Flash (`gemini-3.5-flash`)
  - **Trailer Critic**: Google Gemini 3.7 Flash Video Understanding (`gemini-3.7-flash`)
- **Web Intelligence**: Parallel Search API (`https://api.parallel.ai/v1/search`) & Parallel CLI (`parallel-cli` v0.9.3)
- **Agent Skills**: `parallel-web-search`, `parallel-web-extract`, `parallel-deep-research`, `parallel-data-enrichment`
- **Testing**: Vitest, Playwright (15/15 unit tests passing)

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Environment Variables
Configure `.env.local`:
```bash
GEMINI_API_KEY="your-google-gemini-api-key"
PARALLEL_API_KEY="your-parallel-api-key"
AUDIENCE_TAKE_GEMINI_MODEL="gemini-3.5-flash"
AUDIENCE_TAKE_CRITIC_MODEL="gemini-3.7-flash"
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to explore the Public Scouting Wall.

### 4. Running Tests
```bash
npm test
```

---

## 📂 Key Routes

- **`/`**: The Public Scouting Wall (featured projects, signal counters, and pathway strips)
- **`/nominate`**: Project intake ticket with URL validation and SSRF protection
- **`/research/[id]`**: Live 6-stage autonomous research trace and receipts
- **`/scout/[id]`**: Complete Scout Card dossier, Evidence Ledger, Audience Pulse, and Trailer Critic
- **`/creator`**: Creator Desk for project claims and creator updates

---

## 📜 Provenance

Autonomous architecture and code generated with **Google Antigravity**. See [`DEVELOPMENT_PROVENANCE.md`](./DEVELOPMENT_PROVENANCE.md) for detailed development timeline and receipts.
