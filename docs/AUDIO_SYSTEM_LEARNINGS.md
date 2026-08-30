# Scout Brief Audio System: Architecture, Learnings & Guardrails

## 1. Executive Summary

This document captures the root cause analysis, architecture decisions, and operational guardrails established while building and stabilizing the **Scout Brief Audio System** and its integration with the **Scouting Wall** and **Scout Card** detail views in *Audience Take*.

---

## 2. Architecture Overview

```
                          ┌────────────────────────────┐
                          │  Scout Card Dossier Data   │
                          │   (Firestore / Fixtures)   │
                          └─────────────┬──────────────┘
                                        │
                                        ▼
                          ┌────────────────────────────┐
                          │    Script Builder Engine   │
                          │  (2-Speaker Dialogue Gen)  │
                          └─────────────┬──────────────┘
                                        │
                                        ▼
                          ┌────────────────────────────┐
                          │   Neural Voice Synthesis   │
                          │   Google Cloud Journey     │
                          │  • Scout: en-US-Journey-F  │
                          │  • Analyst: en-US-Journey-D│
                          └─────────────┬──────────────┘
                                        │
                                        ▼
                          ┌────────────────────────────┐
                          │  WAV Wrapping & Packaging  │
                          │ (24kHz 16-bit Linear PCM)  │
                          └─────────────┬──────────────┘
                                        │
         ┌──────────────────────────────┴──────────────────────────────┐
         ▼                                                             ▼
┌─────────────────────────────────┐                   ┌─────────────────────────────────┐
│     Scouting Wall Player        │                   │     Detail Scout Card Player    │
│  (Singleton Audio Controller)   │                   │       (ScoutBriefPlayer)        │
│  • Reads durationSeconds        │                   │  • Reads brief.durationMs       │
│  • Shared lookup key            │                   │  • Shared lookup key            │
└─────────────────────────────────┘                   └─────────────────────────────────┘
```

---

## 3. Root Cause Analysis of Past Issues

### Issue 1: Synthetic Sine Tone (440Hz) Played Instead of Spoken Voices
- **Root Cause**: An offline testing fallback (`generateSyntheticPcm`) was designed to produce a 440Hz sine wave beep when external TTS APIs failed. When the preview TTS model returned an error, the pipeline silently caught the error, generated the 440Hz test tone buffer, and cached it to disk and Firestore as the "ready" audio asset.
- **Impact**: Both the detail card and scouting wall streamed flat sine beeps instead of dialogue.
- **Resolution**: 
  1. Replaced preview model calls with authenticated Google Cloud Text-to-Speech using Journey neural voices (`en-US-Journey-F` for Scout, `en-US-Journey-D` for Analyst).
  2. Pre-rendered and cached high-fidelity 24kHz WAV buffers for all published project dossiers.

---

### Issue 2: Token / API Call Waste via On-The-Fly Regeneration
- **Root Cause**: The detail Scout Card stored audio under `scout-brief-${cardVersionId}-g1.wav`, while the Scouting Wall requested `/api/scout-briefs/${cardVersionId}/audio`. Because the filename keys did not match, the streaming route concluded the audio was missing and triggered a fresh on-the-fly synthesis call on every play click.
- **Impact**: Wasted API calls and execution time generating audio that already existed under a sibling key.
- **Resolution**: 
  - Standardized the audio route lookup in [`src/app/api/scout-briefs/[artifactId]/audio/route.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/app/api/scout-briefs/[artifactId]/audio/route.ts) to check direct IDs, prefixed IDs (`scout-brief-${id}-g1`), and disk caches before ever touching generation.
  - Removed auto-regeneration from the public streaming endpoint.

---

### Issue 3: Hardcoded Audio Durations (`2:30` on All Cards)
- **Root Cause**: The Scouting Wall client component (`CardPodcastPlayer`) had a fallback display duration of `150` seconds (`2:30`) and was not receiving the true duration from each card's Scout Brief.
- **Impact**: All cards displayed `0:00 / 2:30` regardless of whether the actual podcast was 1 minute or 4 minutes long, mismatching the detail card.
- **Resolution**:
  - Added `durationSeconds` to `ScoutingWallEntry` in [`src/features/scouting-wall/data.ts`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/features/scouting-wall/data.ts), loaded directly from the card's `scoutBriefs` document.
  - Updated [`src/features/scouting-wall/scouting-wall-client.tsx`](file:///Users/tarikmoody/Documents/Projects/audience-take-gemini/src/features/scouting-wall/scouting-wall-client.tsx) to display `entry.durationSeconds` (e.g. `1:21`, `4:06`, `2:30`, `4:07`).

---

### Issue 4: `AbortError: The play() request was interrupted by a call to pause()`
- **Root Cause**: Rendering individual `<audio>` DOM elements inside 20+ separate card components caused sibling re-renders to pause and destroy active audio promises when state changed.
- **Impact**: Browser console threw unhandled `AbortError` and audio stopped playing immediately upon click.
- **Resolution**:
  - Re-architected `ScoutingWallClient` to use a **Singleton Audio Controller** with one single top-level `<audio>` element.
  - Converted card players into pure presentation components that dispatch play/pause/seek events to the singleton parent.

---

## 4. Key Rules & Guardrails for Future Media Features

1. **Never Fall Back to Synthetic Tones in Production**:
   - Fallbacks must either serve a pre-rendered real audio asset or display an explicit disabled/offline state. Never cache sine tones to persistent storage.
2. **Never Generate Media on Audio Playback Requests**:
   - Audio playback routes (`GET /api/.../audio`) must be pure streaming endpoints that read pre-generated assets. Background generation jobs must be decoupled and run ahead of publication.
3. **Always Sync Metadata at Ingestion Time**:
   - Audio duration (`durationMs`), file size (`sizeBytes`), and checksums (`sha256`) must be written to the database at synthesis time so UI components never have to guess or hardcode time estimates.
4. **Use Singleton Audio Elements for Multi-Card Grids**:
   - Whenever an interface has multiple playable media cards, manage audio playback via a single global/parent audio element to prevent race conditions, memory leaks, and browser `AbortError` exceptions.
