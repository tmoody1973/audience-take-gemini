# Audience Take — Audio Verification & Inspection Guide

This guide provides a plain-English, step-by-step walkthrough to inspect and verify all audio improvements implemented in accordance with `AUDIENCE_TAKE_AUDIO_ANTIGRAVITY_HANDOFF.md`.

Live Cloud Run Service: [https://audience-take-web-866111144888.us-central1.run.app](https://audience-take-web-866111144888.us-central1.run.app)

---

## 1. What Was Fixed (Summary of Changes)

| Area | Before Fix | After Fix |
| :--- | :--- | :--- |
| **Integrity & Failures** | Missing or short scripts silently substituted Junichiro Jackson fixtures or generated a 440Hz sine tone. | **Truthful failure**: Missing audio returns `HTTP 404`. Zero fixture injection. Zero synthetic sine tone fallbacks in production. |
| **Audio File Encoding** | Bundled WAV files had a double `RIFF` header (a WAV header wrapped inside another WAV header at byte 44). | **Single clean RIFF header**: Pure PCM extraction before WAV wrapping. All 16 cached files migrated and validated (`contracts/audio-migration-manifest.json`). |
| **Audio Streaming** | Audio route served files only as monolithic blobs with no byte-range support. | **HTTP 206 Partial Content**: Full support for `Range: bytes=start-end` headers, enabling fast browser seeking and low-latency playback. |
| **Script Quality & Audience Fit** | 4–5 minute monologue with "Audience Heat" metrics, 3 mechanical pathways, and manufactured €/min costs. | **Tailored Dual-Audience Variants**: <br>• **Discovery Brief (Fans)**: 60–90s, 130–190 words, leads directly with project hook and where to follow.<br>• **Professional Diligence (Industry)**: 90–150s, 190–320 words, grounded in verified evidence, highlights material uncertainties, and delivers **ONE** concrete next diligence step. |
| **Voice Generation** | Synthetic beep generator was active in place of speech. | **Real Google Speech**: Generated using `@google/genai` audio modality (`gemini-2.5-flash-preview-tts`), featuring distinct voices for **Scout (Kore)** and **Analyst (Puck)**. |
| **Player UX & Transparency** | Labeled as "VERIFIED DIALOGUE TRANSCRIPT", raw source IDs (`source-parallel-...`), no seek controls. | **Accessible ScoutBriefPlayer**: Clear "AI Scout Briefing Transcript" badge, `-15s` and `+15s` seek buttons, keyboard accessibility, and human-readable clickable citation links. |

---

## 2. Live Verification Test Cases

### Test Case 1: Junichiro Jackson (`/projects/junichiro-live-project`)

Direct link: [https://audience-take-web-866111144888.us-central1.run.app/projects/junichiro-live-project](https://audience-take-web-866111144888.us-central1.run.app/projects/junichiro-live-project)

**Objective**: Verify dual-audience script brevity, natural pacing, and absence of fake metrics.

1. **Discovery View (Fans)**:
   - Navigate to the project page.
   - Check the **Scout Brief Player** at the top of the card.
   - Note the badge: `Discovery Brief (Fans)`.
   - Press **Play**:
     - The dialogue starts immediately with the project title and hook (*"Junichiro Jackson is in public development from creator Chaz Bottoms..."*).
     - **No** robotic introductory monologue (*"Welcome to Audience Take..."* is gone).
     - **No** mechanical lists of three commercial pathways.
     - Duration is concise (~60–90 seconds).
2. **Professional View (Industry)**:
   - Switch the card view to **Professional Brief**.
   - Note the player badge: `Professional Diligence (Industry)`.
   - Play the audio:
     - Discussion centers on verified milestones (TeamTO pilot partnership, Kickstarter pledges).
     - Discloses execution risks honestly rather than making false claims.
     - Concludes with **ONE** specific next diligence action (*"Animatic Table Read to validate comedic timing"*).
     - **No** manufactured unit costs (e.g., no *"twenty thousand euros per minute"*).

---

### Test Case 2: The Vampair Series (`/scout/the-vampair-series`)

**Objective**: Verify that uncertain projects preserve material risk and do not claim false certainty.

1. **Check Professional View**:
   - Inspect the transcript and audio:
     - Grounds the project in verified audience traction (15+ million YouTube views).
     - Explicitly acknowledges material uncertainties: creator rights ownership and commercial availability remain unverified.
     - **Does NOT** claim the project is a *"de-risked institutional opportunity"*.
     - **Does NOT** cite conflicting overall project scores.
     - Recommends a clear next diligence step: confirming creator rights ownership and representation.

---

### Test Case 3: Unfamiliar / Evidence-Poor Projects

**Objective**: Verify truthful behavior when evidence is limited.

1. **Transcript & Script**:
   - Open any newly submitted or evidence-poor project card.
   - The script generator acknowledges unconfirmed metrics truthfully:
     > *"Looking at the current evidence record, verified commercial metrics and financing figures remain unconfirmed at this stage of scouting. The project relies primarily on creative proof of concept and emerging community interest."*
   - **Crucial check**: The project **never** injects Junichiro Jackson names, TeamTO references, or Kickstarter numbers. It stays strictly scoped to its own title and premise.

---

## 4. Player Usability & Accessibility Inspection

1. **Relative Seek Controls**:
   - Click the **-15s** button: Audio steps back 15 seconds.
   - Click the **+15s** button: Audio advances 15 seconds.
   - Test with keyboard: Use `Tab` to focus on the buttons and press `Enter` or `Space` to trigger.
2. **Citations in Transcript**:
   - Scroll through the transcript below the player.
   - Citations appear as clean badges (e.g., `Variety: Chaz Bottoms Teams with TeamTO`, `Kickstarter Campaign`).
   - Clicking a citation opens the primary source URL directly in a new tab or triggers the evidence drawer.
   - Raw database IDs like `source-parallel-1787999939817` are completely eliminated.
3. **AI Disclosure**:
   - Look at the transcript header: It clearly displays **"AI Scout Briefing Transcript"** with an informational disclosure:
     > *"AI-generated Scout Brief based on verified public evidence from the published Scout Card."*

---

## 5. Technical & Network Verification

### Verifying Single RIFF Audio Containment
Inspect `contracts/audio-migration-manifest.json`. All 16 legacy audio files have been quarantined and re-encoded so that:
- Every file starts with bytes `52 49 46 46` (`RIFF`).
- Bytes 44 through 48 contain the PCM data chunk `64 61 74 61` (`data`), **not** a secondary `RIFF` header.
- Clean duration and SHA256 checksums are cataloged in the manifest.

### Verifying Truthful Error Behavior (No Fake Audio)
To verify that missing audio fails honestly:
```bash
curl -i "http://localhost:3000/api/scout-briefs/non-existent-id/audio"
```
**Expected Response**:
- Status: `HTTP/1.1 404 Not Found`
- Body: `{"error":"Audio brief not found"}`
- Confirms: **No** fallback Junichiro audio is served. **No** synthetic beep tone is generated.

### Verifying HTTP 206 Partial Content (Byte-Range Seeking)
```bash
curl -i -H "Range: bytes=0-1023" "http://localhost:3000/api/scout-briefs/card-junichiro-live-20260826-1918-v1-correction-5ea5f36d0447/audio"
```
**Expected Response**:
- Status: `HTTP/1.1 206 Partial Content`
- Header: `Content-Range: bytes 0-1023/<total-length>`
- Header: `Accept-Ranges: bytes`
- Header: `Content-Type: audio/wav`

---

## 6. Automated Verification Summary

To re-run the complete test suite locally:
```bash
# Run audio-specific verification matrix
npx vitest run tests/unit/audio-verification-matrix.test.ts

# Run TTS client tests
npx vitest run src/services/scout-brief/gemini-tts-client.test.ts

# Run player component tests
npx vitest run src/features/scout-brief/scout-brief-player.test.tsx

# Run full project test suite
npm test

# Run Next.js production build check
npm run build
```
All automated tests pass cleanly with zero warnings.
