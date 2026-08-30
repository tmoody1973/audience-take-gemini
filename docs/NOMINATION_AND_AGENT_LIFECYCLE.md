# Audience Take — Nomination & Autonomous Agent Lifecycle

This document provides a comprehensive, step-by-step technical breakdown of how a nominee moves from user submission to autonomous research, multimodal verification, dual-axis scoring, and published scout card with studio voice podcasts.

---

## 1. High-Level Architecture Overview

```
                                  NOMINATION & AGENT PIPELINE
                                  
  [User Submission] ──▶ [URL & Anti-SSRF Validation] ──▶ [Firestore Project Created]
                                                                  │
  ┌───────────────────────────────────────────────────────────────┘
  ▼
[AGENT STEP 1] Media & Web Scraping (YouTube Metadata, Channel Gravity, Safe Web Text)
  │
  ▼
[AGENT STEP 2] Parallel Search API (Live Web Discovery, Trade Press, Reviews, Crowdfunding)
  │
  ▼
[AGENT STEP 3] Gemini 3.5 Flash Synthesis (Logline, What We Know, 3 Growth Pathways)
  │
  ▼
[AGENT STEP 4] Multimodal Video Critic (Timestamped Narrative Beats, Craft & Sound Matrix)
  │
  ▼
[AGENT STEP 5] Audience Comment NLP Engine (Fan Obsessions, Sentiment Score, Fandom Comps)
  │
  ▼
[AGENT STEP 6] Dual-Axis Scoring Engine (Audience Heat 0-100 & Market Readiness 0-100)
  │
  ▼
[AGENT STEP 7] Deterministic TypeScript Validation & Publishing (Firestore `scoutCards`)
  │
  ▼
[AGENT STEP 8] Multi-Speaker Audio Synthesis (Google Cloud Journey Studio Voices)
```

---

## 2. Step-by-Step Pipeline Details

### Step 1: User Submits Nomination
- **User Action**: The nominator navigates to `/nominate` and submits:
  - `sourceUrl`: YouTube trailer/pilot, Kickstarter link, or official creator landing page.
  - `reason`: Contextual reason explaining why the project warrants scouting.
  - `formatNotes` & `audienceNotes` (Optional): Creator notes (e.g., *"Historical documentary"*, *"Irish sapphic comedy"*, *"Cyberpunk anime"*).
- **Backend Validation** (`src/app/api/nominations/route.ts`):
  - Enforces domain whitelist policy (`youtube.com`, `youtu.be`, `kickstarter.com`, `vimeo.com`, `substack.com`) via `src/lib/nomination/url-policy.ts`.
  - Computes SHA-256 fingerprint of the URL to prevent spam duplication.
  - Creates a new project in Firestore (`projects/{projectId}`) with status `in_research` and initial tracking run (`researchRuns/{runId}`).

---

### Step 2: Safe Public Metadata & Web Scraping (Agent Step 1)
- **YouTube Metadata Extraction** (`src/lib/media/youtube.ts`):
  - Fetches creator channel title, handle, subscriber count, total universe catalog views, video title, description, and high-resolution thumbnail.
- **Anti-SSRF Web Scraping** (`src/services/ssrf-guard.ts`):
  - Safely extracts raw text from the primary source URL.
  - Blocks internal IP ranges (127.0.0.1, 10.0.0.0/8, 169.254.169.254) and limits response size to 10 KB to prevent prompt injection or denial-of-service.

---

### Step 3: Real-Time Web Intelligence via Parallel Search API (Agent Step 2)
- **Live Discovery Search** (`src/services/parallel-client.ts`):
  - Dispatches 3 objective-driven search queries:
    1. `"<Project Title> film series director synopsis"`
    2. `"<Project Title> festival premiere reviews"`
    3. `"<Project Title> production crowdfunding webseries"`
  - Gathers live trade press citations (e.g., *Variety*, *Deadline*, *PBS American Masters*, *GCN*), film festival awards, critic reviews (Rotten Tomatoes), and crowdfunding metrics.

---

### Step 4: Gemini 3.5 Flash Clean-Room Synthesis (Agent Step 3)
- **Model Invocation** (`src/agent/agent-runner.ts`):
  - Inputs the primary video metadata, safe web text, and Parallel Search excerpts to `gemini-3.5-flash`.
- **Enforced Invariants**:
  1. *Zero Greenlight Speculation*: Never promises commercial success or predicts guaranteed ROI.
  2. *No Fake Studio Bidding*: Cites only verified attachments found in source citations.
  3. *Medium-Concordant Pathways*: Documentary pathways focus on educational/public broadcasting; web comedies focus on digital retention and linear half-hour expansion; animation focuses on co-production.
  4. *Clean Text Formatting*: Strips raw markdown headers, links, or navigation boilerplate into clear 1–2 sentence factual bullet points.
- **Synthesized Fields**:
  - `decisionBrief`: Logline, core hook, comparative titles, primary risk.
  - `whatWeKnow`: 4–5 verified factual points about creators, premiere status, and team.
  - `whatWereChecking`: Specific open questions regarding rights, financing, or distribution.
  - `pathways`: Exactly 3 grounded development options, each with a concrete *Next Bounded Experiment* and measurable success metric.

---

### Step 5: Multimodal Video Understanding (Trailer Critic)
- **Visual & Sound Analysis** (`src/critic/trailer-critic-engine.ts`):
  - Uses Gemini Video Understanding to sample and inspect video frames.
  - **Timestamped Narrative Beats**: Maps chronological storytelling beats (e.g., `0:00 Visual Hook`, `0:38 Audio Climax`).
  - **Technical Craft Assessment**: Evaluates cinematography, sound design/original score, editing rhythm, and graphics.
  - **Critic Matrix Scores (1–10)**: Generates quantitative ratings for *Clarity*, *Tone Consistency*, *Visual Originality*, and *Narrative Tension*.

---

### Step 6: Audience Comment NLP & Fandom DNA
- **Comment Stream Analysis** (`src/critic/audience-comment-analyzer.ts`):
  - Analyzes public YouTube comments using Gemini 3.5 Flash.
  - Extracts **Character & Lore Obsessions** (what fans discuss and rewatch).
  - Identifies **Merchandise Demand Signals** (vinyl OST requests, art books, live screenings).
  - Determines **Demographic Comps** and scores **Community Sentiment (0–100)**.

---

### Step 7: Dual-Axis Scoring & Living Dossier Initialization
- **Scoring Formulas** (`src/critic/market-viability-engine.ts`):
  - **Audience Heat Score (0–100)**:
    $$\text{Audience Heat} = \text{Log10(Views)} \times 10 + \text{Capitalization Ratio Factor} + \text{Discretionary Spend ARPU Factor}$$
  - **Market Readiness Score (0–100)**:
    $$\text{Market Readiness} = (0.30 \times \text{Diffusion}) + (0.25 \times \text{Budget Realism}) + (0.25 \times \text{Buyer Slate Fit}) + (0.20 \times \text{Commercial TAM})$$
  - **Dynamic Buyer Slate Selection**: Dynamically matches buyers according to genre:
    - *Documentary*: PBS / POV / American Masters, HBO Docs, Criterion, Latino Public Broadcasting.
    - *Live-Action Comedy*: Channel 4 / BBC Three, RTÉ Storyland, Hulu / FX Comedy, CBC Gem.
    - *Gothic Animation*: Adult Swim / Max, A24 / SpindleHorse, Netflix YA Animation.
    - *Action Anime*: Adult Swim / Toonami, Crunchyroll / Sony, Netflix Anime.
    - *General Indie Film*: A24, Neon, MUBI, Hulu / Searchlight, Netflix Independent.
- **Living Dossier Sensor** (`src/services/re-scout-engine.ts`):
  - Initializes the automated sensor changelog to track future view milestones, awards, and trade announcements.

---

### Step 8: Deterministic Validation & Publishing
- **Schema & Policy Verification** (`src/agent/deterministic-validator.ts`):
  - Validates output against strict TypeScript Zod/interface schemas.
  - Writes the published `ScoutCard` (Version 1) directly to Firestore (`scoutCards/card-{projectId}-v1`).
  - Updates project status in `projects/{projectId}` from `in_research` to `published`.

---

### Step 9: Multi-Speaker Spoken Audio Podcast Generation
- **Podcast Script Synthesis** (`src/services/scout-brief/gemini-script-generator.ts`):
  - Formats card data into an engaging dialogue between **Scout** (cultural/creative lead) and **Analyst** (commercial/unit economics lead).
- **Google Cloud Journey Multi-Speaker TTS**:
  - Synthesizes spoken audio using Google Cloud Text-to-Speech:
    - **`en-US-Journey-F`** (Scout)
    - **`en-US-Journey-D`** (Analyst)
  - Packages and caches the master `.wav` file (`public/audio-cache/*.wav`), streaming directly to the client's Scout Brief audio player.

---

## 3. Core Source Files Reference

| Pipeline Stage | Primary Source Files |
| :--- | :--- |
| **Nomination & API** | [`src/app/nominate/nomination-form.tsx`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/app/nominate/nomination-form.tsx), [`src/app/api/nominations/route.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/app/api/nominations/route.ts) |
| **Autonomous Runner** | [`src/agent/agent-runner.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/agent/agent-runner.ts), [`src/agent/deterministic-validator.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/agent/deterministic-validator.ts) |
| **Web & Media Fetching** | [`src/lib/media/youtube.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/lib/media/youtube.ts), [`src/services/ssrf-guard.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/services/ssrf-guard.ts), [`src/services/parallel-client.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/services/parallel-client.ts) |
| **Multimodal Critic** | [`src/critic/trailer-critic-engine.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/critic/trailer-critic-engine.ts) |
| **Comment NLP Engine** | [`src/critic/audience-comment-analyzer.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/critic/audience-comment-analyzer.ts) |
| **Market Viability** | [`src/critic/market-viability-engine.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/critic/market-viability-engine.ts) |
| **Living Dossier** | [`src/services/re-scout-engine.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/services/re-scout-engine.ts) |
| **Voice Podcast TTS** | [`src/services/scout-brief/gemini-script-generator.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/services/scout-brief/gemini-script-generator.ts), [`src/app/api/scout-briefs/[artifactId]/audio/route.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/app/api/scout-briefs/[artifactId]/audio/route.ts) |
