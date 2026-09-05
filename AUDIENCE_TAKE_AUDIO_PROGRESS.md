# Audience Take — Audio Improvement & Quality Progress Log

Tracking implementation progress against `/Users/tarikmoody/Downloads/AUDIENCE_TAKE_AUDIO_ANTIGRAVITY_HANDOFF.md`.

## Finding Reconciliation (Baseline vs Current Code)

| Finding | Description | Status in Current Code | Root Cause & Resolution Plan |
| :--- | :--- | :--- | :--- |
| **1** | Junichiro: ~4:06 / 600 words, repeated premise, 3 pathways | **Resolved** | Implemented concise Discovery (130–190w, 60–90s) & Professional (190–320w, 90–150s) with 1 key next diligence action and no mechanical 3-pathway list. |
| **2** | Vampair: "de-risked institutional opportunity" with unresolved identity | **Resolved** | Card identity grounded in decision brief; scripts honestly present material uncertainties and avoid false certainty. |
| **3** | Vampair score disagreement (transcript 90 vs card 92) | **Resolved** | Suppressed opaque scores from audio scripts entirely; legacy cache quarantined and migrated. |
| **4** | "VERIFIED DIALOGUE TRANSCRIPT" blanket label | **Resolved** | Replaced with "AI Scout Briefing Transcript" and claim-level evidence badges plus explicit AI generation disclosure. |
| **5** | Raw source IDs (`source-parallel-...`) in transcript | **Resolved** | Mapped citation badges to human-readable source titles and interactive clickable drawer/link triggers. |
| **6** | TTS returns `generateSyntheticPcm(..., 440)` tone | **Resolved** | Implemented real Google Gemini speech generation via `@google/genai` (`gemini-2.5-flash-preview-tts`) with Kore (Scout) and Puck (Analyst) voices; production fails truthfully. |
| **7** | Missing/<350-word brief replaced by Junichiro fixture | **Resolved** | Removed cross-project fixture substitution entirely; missing briefs return HTTP 404. |
| **8** | Failure paths generate synthetic WAV tone | **Resolved** | Removed synthetic sine wave fallbacks from production route handlers and TTS clients. |
| **9** | Bundled WAV files contain double RIFF header | **Resolved** | Fixed containerization in `audio-processor.ts` (`extractPcmFromWav`); migrated all 16 cached WAVs to clean single RIFF containers. |

---

## Implementation Sequence

- [x] **P0: Stop False Output & Cross-Project Audio Substitution**
  - [x] Remove `junichiro-scout-brief.json` fallback in `src/app/api/scout-briefs/[artifactId]/audio/route.ts`
  - [x] Remove synthetic sine wave generation in production failure paths in `route.ts`
  - [x] Remove `generateSyntheticPcm` from production TTS client (`gemini-tts-client.ts`)
  - [x] Fix double RIFF header wrapping in `audio-processor.ts` (detect existing RIFF header)
  - [x] Quarantine/clean corrupted double-wrapped cached WAV files
- [x] **P1: Validated Script Input with Discovery & Professional Variants**
  - [x] Support `variant: "discover" | "pro"` in `gemini-script-generator.ts` and `script-builder.ts`
  - [x] Discovery script: 60–90s (130–190 words), premise → creative distinction → buzz/gap → where to watch/follow
  - [x] Professional script: 90–150s (190–320 words), stage → strongest evidence → limits → decisive uncertainty → ONE next diligence action
  - [x] Suppress opaque scores, monetary benchmarks absent from card, and mechanical 3-pathway lists
  - [x] Validate script word counts and claims strictly
- [x] **P2: Real Google Speech Generation via @google/genai**
  - [x] Implement `gemini-2.5-flash-preview-tts` / Gemini audio modality in `gemini-tts-client.ts` with `speechConfig` and distinct voices (Kore for Scout, Puck for Analyst)
  - [x] Return truthful unavailable state when API key is missing or call fails (no fake tones)
  - [x] Compute accurate duration, hash, and metadata
- [x] **P3: Durable Storage, Immutable Serving & Migration**
  - [x] Bind recordings to `projectId`, `cardVersionId`, `audience` variant, and transcript hash
  - [x] Route handler serves real audio or 404/503; supports HTTP Range requests for seeking
  - [x] Migration inventory for stale/corrupted audio artifacts (`contracts/audio-migration-manifest.json`)
- [x] **P4: Accessible Compact Player & Human-Readable Transcripts**
  - [x] Replace "Verified Dialogue Transcript" with AI disclosure and claim status
  - [x] Replace raw source IDs with clickable, human-readable source citations
  - [x] Add variant selector (Discovery / Professional) inside audio player
  - [x] Add seek ±15s buttons, accessible ARIA attributes, error banner
- [x] **P5: Multi-Project Verification & Plain-English Inspection Guide**
  - [x] Verify Junichiro, Vampair, and unfamiliar project scripts
  - [x] Run Vitest test suite and Next.js production build
  - [x] Write plain-English markdown testing guide for user (`AUDIENCE_TAKE_AUDIO_INSPECTION.md`)
