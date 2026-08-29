# Audio Scout Brief — Technical Specification

Status: Implementation specification for Antigravity CLI  
Feature name: **Scout Brief**  
Product requirements: [`audio-scout-brief-prd.md`](./audio-scout-brief-prd.md)  
Parent architecture: [`spec.md`](./spec.md)  
Current runtime handoff: [`session-handoff.md`](./session-handoff.md)

## Overview

Implement a failure-isolated, post-publication pipeline that creates one versioned two-speaker audio briefing for each eligible immutable Scout Card.

The feature has two Gemini operations:

1. A pinned structured-output Gemini text model creates a bounded, source-linked transcript from the published Scout Card.
2. A pinned Gemini multi-speaker TTS model performs that approved transcript using two configured voices.

The TTS operation does not research, summarize raw webpages, or decide what is true. Parallel and the existing Evidence Editor remain responsible for research and qualification. The Scout Brief only narrates the public, validated card artifact.

Generation begins after successful card publication, runs outside the foreground web request, and never changes the research run's complete/partial/failed result. A missing or failed audio artifact must leave the Scout Card fully usable.

## Locked Product Decisions

- Public name: **Scout Brief**.
- Target duration: 180–300 seconds.
- Target script length: 500–650 words.
- Exactly two speaker roles: `Scout` and `Analyst`.
- One audio artifact per `cardVersionId` and `generationVersion`.
- No autoplay.
- Full transcript is required for a ready artifact.
- Audio is generated after publication and never on Play.
- MVP storage format: PCM wrapped as mono 24 kHz, 16-bit WAV.
- No background music, film audio, cloned voice, or sound effects.
- No card mutation to attach audio; audio is a separate sidecar artifact.
- No live-provider call during local tests or implementation verification.
- One explicitly approved provider smoke generation is sufficient for the hackathon proof.

## Current Gemini Contract

The implementation must re-check official documentation immediately before coding because the selected TTS model is preview software.

Current official documentation as checked on 2026-08-29 states:

- Multi-speaker generation is available through `POST https://generativelanguage.googleapis.com/v1beta/interactions`.
- `generation_config.speech_config` accepts up to two `{speaker, voice}` mappings.
- Configured speaker names must match the names in the dialogue prompt.
- `response_format.type` is `audio`.
- The response contains base64-encoded PCM audio.
- The documented WAV example uses mono, 24,000 Hz, 16-bit samples.
- `gemini-3.1-flash-tts-preview` has an 8,192-token input limit and a 16,384-token output limit.
- The model supports the Batch API, but the MVP uses one normal asynchronous request per card rather than a batch job.

Official references:

- [Gemini speech generation](https://ai.google.dev/gemini-api/docs/speech-generation)
- [Gemini 3.1 Flash TTS Preview](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-tts-preview)
- [Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Developer API and Vertex AI client selection](https://ai.google.dev/gemini-api/docs/migrate-to-cloud)

Do not assume the existing Vertex-configured `genai.Client()` can call the documented Interactions TTS endpoint. Use a dedicated provider boundary with an explicit Gemini Developer API client and server-only `GEMINI_API_KEY`, unless current official documentation confirms the same TTS model and Interactions contract on the project's Vertex backend. Never change process-wide `GOOGLE_GENAI_USE_VERTEXAI` behavior to make TTS work.

## Stack

Reuse the existing stack:

- Python 3.12 Cloud Run agent service
- `google-genai` with a pinned compatible version
- Existing Gemini structured-output provider patterns
- Cloud Tasks and authenticated private Cloud Run task routes
- Firestore for job state, transcript metadata, and immutable artifact records
- Firebase Storage for public immutable audio objects
- Next.js Scout Card page and React client player
- Canonical JSON Schema fixtures shared across Python and TypeScript
- Pytest, Ruff, mypy, Vitest, Firebase Emulator tests, and Playwright

Do not create a second application, database, queue, or public audio microservice.

Product scope is every eligible Scout Card, including cards that predate the feature. Automatic post-publication dispatch covers future cards. Add a guarded reconciliation/backfill command that defaults to a read-only report of eligible cards missing artifacts; it may enqueue an explicit bounded allowlist only after user approval. Never trigger a repository-wide paid backfill as part of deployment or migration.

## Architecture

```text
Successful immutable Scout Card publication
                    │
                    ▼
Post-publication Scout Brief dispatcher
                    │ deterministic Cloud Task
                    ▼
POST /tasks/scout-brief on private Cloud Run
                    │
                    ▼
Lease/idempotency + load exact cardVersionId
                    │
                    ▼
Eligibility and closed-world input builder
                    │
                    ▼
Gemini structured transcript generation
                    │
                    ▼
Transcript contract and evidence validation
                    │
                    ▼
Gemini two-speaker TTS
                    │
                    ▼
Decode PCM → validate → wrap WAV → checksum
                    │
                    ▼
Firebase Storage immutable public object
                    │
                    ▼
Firestore scoutBriefs/{artifactId} ready record
                    │
                    ▼
Scout Card server loader → accessible audio player
```

The generated artifact is downstream of publication. The project pointer continues to identify the latest Scout Card, not the latest audio job. The web loader derives the deterministic Scout Brief ID from the card version it already loaded.

## PRD Epic Mapping

| PRD epic | Technical components |
| --- | --- |
| Discover and play | Scout Brief loader, player, public Storage object |
| Two clear roles | Script schema, prompt builder, TTS speaker configuration |
| Trust every statement | Closed-world input, transcript validator, source mapping |
| Preserve history | Deterministic artifact ID, card-version binding, immutable path |
| Accessibility | Native audio semantics, keyboard controls, transcript and sources |
| Respect creators | Eligibility rules, disclosures, no voice cloning or source audio |
| Demonstrate Gemini | Persisted model receipt, real approved smoke artifact, demo script |

## File Structure

Antigravity should confirm existing conventions before creating files. Preferred changes:

```text
contracts/
  schemas/
    scout-brief.schema.json                 # Canonical public-ready artifact contract
  fixtures/
    junichiro-scout-brief.json              # Contract-valid ready fixture
    manifest.json                           # Register fixture

services/agents/src/audience_take_agents/
  scout_brief/
    __init__.py
    models.py                               # Strict Pydantic task/script/artifact models
    script.py                               # Closed-world prompt and transcript validation
    tts.py                                  # Gemini Interactions TTS client and PCM parsing
    audio.py                                # WAV wrapping, duration, checksum, byte limits
    store.py                                # Firestore lease/state + Storage publication
    service.py                              # Eligibility and durable generation workflow
  app.py                                    # Pinned settings and service construction
  http_app.py                               # Private POST /tasks/scout-brief
  orchestrator.py                           # Post-publication dispatch boundary only
  runtime/models.py                         # ScoutBriefTaskRequest if shared here

services/agents/tests/
  test_scout_brief.py                       # Script, TTS, audio, store, replay tests
  test_http_app.py                          # OIDC/task route tests
  test_app.py                               # Settings/client construction tests
  test_orchestrator_agents.py               # Publication-to-dispatch failure isolation

apps/web/
  features/scout-brief/
    data.ts                                 # Strict server-side artifact parser/loader
    data.test.ts
    scout-brief-player.tsx                  # Accessible player and transcript
    scout-brief-player.test.tsx
  features/scout-card/
    scout-card.tsx                          # Place player in card hierarchy
    scout-card.test.tsx
  app/projects/[slug]/page.tsx              # Load exact matching artifact
  lib/tasks/cloud-tasks.ts                  # Only if dispatch remains web-owned

firebase/
  firestore.rules                           # Deny client writes; public-read decision
  storage.rules                             # Public read under immutable audio path

infra/terraform/
  main.tf or existing module files          # Secret, IAM, env, optional task settings

docs/hackathon-build/
  audio-scout-brief-prd.md
  audio-scout-brief-tech-spec.md
  session-handoff.md                        # Update only after verified implementation
```

Prefer keeping dispatch in the Python post-publication boundary because publication completes there. Do not add a browser-visible endpoint to trigger paid generation.

## Canonical Data Contracts

### Task request

The private Cloud Task payload must be strict and smaller than the existing task-body cap:

```json
{
  "taskName": "scout-brief-card-project-01-v1-g1",
  "artifactId": "scout-brief-card-project-01-v1-g1",
  "projectId": "project-01",
  "cardVersionId": "card-project-01-v1",
  "runId": "run-01",
  "researchVersion": 1,
  "generationVersion": 1
}
```

Validate safe IDs, exact task-name binding, integer ranges, and Cloud Tasks transport headers using the same private-route pattern as research and Trailer Critic.

### Transcript contract

Gemini script generation returns strict structured JSON before TTS is called:

```json
{
  "title": "Junichiro Jackson — Scout Brief",
  "language": "en-US",
  "pathwayIds": ["pathway-1", "pathway-2", "pathway-3"],
  "segments": [
    {
      "order": 1,
      "section": "hook",
      "speaker": "Scout",
      "text": "...",
      "claimIds": ["claim-1"],
      "sourceIds": ["source-1"]
    },
    {
      "order": 2,
      "section": "evidence",
      "speaker": "Analyst",
      "text": "...",
      "claimIds": ["claim-2"],
      "sourceIds": ["source-2"]
    }
  ],
  "limitations": ["..."],
  "disclosure": "AI-generated Scout Brief based on the cited Scout Card."
}
```

Required enums:

- `speaker`: `Scout | Analyst`
- `section`: `hook | project | evidence | uncertainty | pathways | next_move`
- `language`: `en-US` for the MVP

Required bounds:

- 8–18 ordered segments
- 500–650 words after deterministic application-side counting
- 30,000 characters maximum before the TTS prompt wrapper
- Both speakers present with at least two turns each
- All six sections present in the required order
- `pathwayIds` exactly equal the card's three ordered pathway IDs
- At least one non-empty limitation
- No duplicate segment order, claim ID, source ID, or pathway ID where uniqueness applies

### Ready artifact

Store the public-ready artifact at `scoutBriefs/{artifactId}`:

```json
{
  "artifactId": "scout-brief-card-project-01-v1-g1",
  "projectId": "project-01",
  "cardVersionId": "card-project-01-v1",
  "runId": "run-01",
  "researchVersion": 1,
  "generationVersion": 1,
  "status": "ready",
  "visibility": "public",
  "language": "en-US",
  "title": "Project Title — Scout Brief",
  "durationMs": 224000,
  "wordCount": 574,
  "scriptModelId": "pinned-model-id",
  "ttsModelId": "gemini-3.1-flash-tts-preview",
  "speakers": [
    { "speaker": "Scout", "voice": "Kore" },
    { "speaker": "Analyst", "voice": "Puck" }
  ],
  "transcript": { "segments": [], "limitations": [], "disclosure": "..." },
  "sourceIds": ["source-1", "source-2"],
  "claimIds": ["claim-1", "claim-2"],
  "pathwayIds": ["pathway-1", "pathway-2", "pathway-3"],
  "storagePath": "public/projects/project-01/scout-briefs/card-project-01-v1/g1.wav",
  "audioUrl": "https://firebasestorage.googleapis.com/...",
  "mimeType": "audio/wav",
  "sizeBytes": 10752044,
  "sha256": "...",
  "generatedAt": "2026-08-29T12:00:00Z"
}
```

The JSON Schema must use `additionalProperties: false`, bounded strings/arrays, exact enums, ISO date-time formats, HTTPS URLs, non-negative sizes, and an `if/then` rule that only permits `visibility: public` with `status: ready`.

Private job fields such as leases, provider request timing, retry state, safe failure code, and raw response metadata must not appear in the public artifact. Use a separate private job document or private-only nested fields that public readers cannot access. Prefer a separate `scoutBriefJobs/{artifactId}` document.

## Firestore Collections

### `scoutBriefJobs/{artifactId}` — private

Suggested fields:

- Identity: `artifactId`, `projectId`, `cardVersionId`, `runId`, `researchVersion`, `generationVersion`
- State: `queued | generating_script | script_ready | generating_audio | uploading | complete | failed`
- Lease: `leaseOwner`, `leaseExpiresAt`, `attempt`, `taskName`
- High-water markers: `scriptRequestStartedAt`, `scriptCompletedAt`, `ttsRequestStartedAt`, `ttsCompletedAt`
- Safe failure: `failureCode`, `retryEligible`, `updatedAt`
- Persisted validated transcript after `script_ready`
- Never store an API key, authorization header, raw prompt containing unnecessary data, raw provider error, or chain-of-thought

### `scoutBriefs/{artifactId}` — public-ready artifact

- Written only after transcript, audio bytes, Storage object, checksum, duration, and card-version relationship validate.
- Immutable after `ready` except an explicit moderation/takedown field managed by trusted code.
- Direct client writes denied.
- The server-side Scout Card loader reads the deterministic artifact ID for the current card.

Do not add audio fields as new required properties on `scoutCards`. Historical Scout Card fixtures and deployed cards must remain valid without audio.

## Artifact Identity and Versioning

Use a deterministic ID derived from:

```text
scout-brief:{cardVersionId}:generation:{generationVersion}
```

Normalize it to the repository's safe-ID rules or use a SHA-256 digest with a readable prefix. The same identity drives:

- Cloud Task name
- Job document ID
- Public artifact ID
- Storage path
- Idempotency checks

`generationVersion` begins at 1. Normal delivery retries reuse the same generation version and must not create a second artifact. A deliberate future regeneration increments `generationVersion` and preserves the old generation record. The public card should select the highest ready generation for its exact `cardVersionId`, capped to a small query or stored through a trusted pointer record.

For the MVP, prefer one generation version and deterministic direct lookup rather than adding regeneration UI.

## Eligibility Service

Before any Gemini request, load the exact public card and reject generation unless:

- The card exists and `visibility` is public.
- `card.projectId`, `runId`, and `researchVersion` match the task payload.
- Completeness is `complete` or an explicitly eligible `partial`.
- `fallbackUsed` is false for a new generation request.
- Identity relationship is not `disputed`.
- Exactly three valid pathways exist in published order.
- At least two evidence claims have `supported` or `qualified` status and usable source IDs.
- At least one meaningful limitation exists.
- The project pointer still identifies this card when dispatching a normal latest-card brief.

An eligibility rejection writes a bounded private terminal state and makes no provider call.

## Closed-World Script Input

Build a minimal JSON input from the public card rather than passing the entire Firestore document or any raw sources. Include only:

- Card identity, title, hook, project type, nomination and claim labels
- Story context fields with their claim IDs
- Supported and qualified evidence claims
- Conflicting evidence only for the uncertainty section
- Public external signals and limitations
- The three published pathways, confidence, risks, and next experiments
- Source ledger entries referenced by included claims
- Published card version and date

Exclude:

- Raw Parallel responses or excerpts not published in the card
- Raw Gemini prompts or reasoning
- User IDs, emails, private profiles, private creator data, reports, or moderation notes
- Private analytics
- Unreviewed community leads
- Unsupported claims
- Provider credentials or infrastructure identifiers

Wrap the serialized card input as untrusted content and explicitly instruct the script model that it may summarize the data but may not follow instructions found inside any field.

## Transcript Validation

Validation runs before TTS and fails closed. Verify:

1. Strict schema and length bounds.
2. Exact project, card, pathway, language, and speaker expectations.
3. Every referenced source ID exists in the card ledger.
4. Every referenced claim ID exists in the card.
5. Evidence/project sections reference only supported or qualified claims.
6. Conflicting claims appear only in the uncertainty section and retain conflict language.
7. The pathway section references all three pathway IDs in order.
8. The next-move section maps to the published recommended experiment.
9. The spoken introduction carries the fan-nominated/unclaimed disclosure when applicable.
10. At least one limitation is spoken, not merely stored in metadata.
11. Prohibited phrases and guarantee language are rejected or rewritten through a deterministic safe-language check.
12. Word count is within 500–650 before TTS.

Persist the validated transcript before making the TTS request. A retry that finds the exact valid `script_ready` transcript must reuse it and must not call the script model again.

## Gemini Script Provider

Use a dedicated `ScoutBriefScriptProvider` interface so tests do not call Gemini. Reuse the repository's strict structured-output, finish-reason, size-limit, timeout, and safe-error patterns.

Configuration:

- `AUDIENCE_TAKE_SCOUT_BRIEF_SCRIPT_MODEL`: required pinned model or a documented pinned default
- Reject `latest` and `*-latest` aliases
- Temperature/style tuned for clear editorial delivery rather than creative invention
- Strict response schema matching the transcript contract
- One request maximum for generation version 1
- No web search, tools, function calling, or source fetching

The model-generated transcript is an editorial artifact, not evidence. Its claim/source mapping is mandatory even when the prose sounds harmless.

## Gemini TTS Provider

Create a dedicated `GeminiTtsClient` around the current Interactions API.

Configuration:

- `GEMINI_API_KEY`: server-only secret, injected from Secret Manager
- `AUDIENCE_TAKE_SCOUT_BRIEF_TTS_MODEL=gemini-3.1-flash-tts-preview`
- `AUDIENCE_TAKE_SCOUT_VOICE=Kore`
- `AUDIENCE_TAKE_ANALYST_VOICE=Puck`
- Reject moving `latest` aliases
- Never log the key, request header, full provider error, base64 response, or hidden prompt

Request shape:

```json
{
  "model": "gemini-3.1-flash-tts-preview",
  "input": "Read exactly the following two-speaker Scout Brief... Scout: ... Analyst: ...",
  "response_format": { "type": "audio" },
  "generation_config": {
    "speech_config": [
      { "speaker": "Scout", "voice": "Kore" },
      { "speaker": "Analyst", "voice": "Puck" }
    ]
  }
}
```

The prompt must tell the model to:

- Read the supplied dialogue without adding facts or commentary
- Use a clear, calm, engaged professional tone
- Keep The Scout warm and curious
- Keep The Analyst measured and precise
- Preserve uncertainty and avoid ad-libbed banter
- Never imitate a named real person

Validate the documented response envelope before decoding `output_audio.data`. Treat missing audio, invalid base64, unknown shapes, oversized payloads, 4xx, 429, 5xx, timeouts, and transport ambiguity as typed failures.

Do not automatically fall back to a different model or voice without recording a new generation attempt and reviewing the change. Preview-model retirement must fail safely rather than silently altering the public artifact.

## Audio Processing

The provider returns raw PCM according to the documented example. The audio processor must:

1. Strictly base64-decode with validation.
2. Reject empty or oversized decoded data.
3. Require even byte length for 16-bit samples.
4. Calculate duration as `pcmBytes / (24000 * 1 * 2)` seconds.
5. Reject duration outside a safe publication tolerance of 150–330 seconds.
6. Wrap PCM in a standard mono, 24 kHz, 16-bit WAV container.
7. Calculate SHA-256 over the final file.
8. Enforce a final file cap of 20 MiB.
9. Never use shell commands or temporary files when Python's standard `wave` and `io.BytesIO` are sufficient.

The target remains 180–300 seconds. The wider validation tolerance catches model pacing variance without publishing obviously incorrect output.

WAV is intentionally chosen for the MVP to avoid adding an ffmpeg system dependency during the hackathon. A post-hackathon optimization may transcode to Opus or AAC while retaining the canonical transcript and source contract.

## Storage Publication

Use this deterministic path:

```text
public/projects/{projectId}/scout-briefs/{cardVersionId}/g{generationVersion}.wav
```

Upload with:

- `Content-Type: audio/wav`
- `Cache-Control: public,max-age=31536000,immutable`
- Metadata: `artifactId`, `projectId`, `cardVersionId`, `generationVersion`, `sha256`
- Non-resumable upload is acceptable under the 20 MiB cap
- Provider bytes never pass through the browser or Firestore

Perform no network call inside a Firestore transaction. The safe order is:

1. Acquire/update private job lease transaction.
2. Run script provider outside transaction.
3. Persist validated transcript transaction.
4. Mark TTS high-water before request.
5. Run TTS outside transaction.
6. Validate and upload deterministic Storage object outside transaction.
7. In one transaction, confirm job identity/lease/object metadata and create the immutable ready artifact.

If upload succeeds but final persistence fails, a retry checks the deterministic object metadata and may finalize without re-calling Gemini.

## Dispatch and Runtime

### Post-publication dispatch

After the publication store has successfully committed a complete or partial card and advanced the project pointer, call an injected `ScoutBriefDispatcher`.

- Dispatch must occur after publication, never inside the publication transaction.
- Dispatch failure is logged safely and recorded as an audio-specific failure; it does not roll back or relabel the Scout Card.
- Deterministic Cloud Task naming makes repeated dispatch safe.
- If the feature flag is disabled or the card is ineligible, do nothing.

Because `orchestrator.py` currently has unrelated local modifications, Antigravity must inspect and preserve the existing diff before adding this boundary.

### Private task route

Add `POST /tasks/scout-brief` using the same controls as the existing research and Trailer Critic routes:

- Cloud Run IAM/OIDC authorization
- Required Cloud Tasks headers
- Exact task-name/payload binding
- Bounded retry-count parsing
- Strict Pydantic payload
- Safe application-owned error codes only
- No raw payload, script, API key, provider body, or provider error in logs

### Retry and provider high-water policy

- Delivery retries may reacquire an expired lease.
- Persisted eligible/validated/script-ready stages are reused.
- Once a TTS request is marked as possibly sent, an ambiguous crash must not blindly issue a second paid call.
- A confirmed provider rejection before audio generation may follow the bounded task retry policy.
- Unknown post-send state becomes `provider_outcome_unknown` and requires a deliberate new generation version or reviewed reconciliation.
- The MVP permits at most one script-provider request and one TTS-provider request for generation version 1.

## Web Data Loading

Extend the server-side Scout Card loader after it has validated the card:

1. Derive the deterministic generation-1 artifact ID from `card.cardVersionId`.
2. Read `scoutBriefs/{artifactId}` with Admin Firestore.
3. Parse with a strict Zod schema matching the canonical contract.
4. Require `status: ready`, `visibility: public`, exact `projectId`, exact `cardVersionId`, HTTPS `audioUrl`, supported MIME type, safe duration, and bounded transcript.
5. Cross-check transcript claim/source/pathway IDs against the loaded card.
6. Return `null` on any mismatch and log only bounded safe diagnostics.

Do not make the entire page fail because the audio artifact is invalid or unavailable. Historical cards without Scout Briefs remain readable.

## Player Component

Create `ScoutBriefPlayer` as a focused client component receiving already-validated public data.

Required behavior:

- Use the native HTML `<audio>` element as the playback engine.
- Set `preload="metadata"`; never set `autoplay`.
- Display Play/Pause, seek state, elapsed/total time, and speed options `0.75×`, `1×`, `1.25×`, `1.5×`, and `2×`.
- Preserve native keyboard and assistive-technology semantics.
- Announce loading and playback errors in a restrained `aria-live` region.
- Provide an adjacent expandable transcript using semantic headings and speaker labels.
- Resolve transcript source IDs to descriptive links from the card source ledger.
- Show “AI-generated Scout Brief,” card version, generation date, and duration.
- State “Fan nomination — unclaimed by creator” when applicable.
- Use no autoplay, animated waveform, pulsing status, or color-only speaker distinction.
- Respect `prefers-reduced-motion`.
- Avoid global keyboard shortcuts that interfere with page or assistive technology navigation.

Recommended placement: after the Scout Card hook/provenance block and before the detailed evidence/Industry Lens sections. The player should be easy to discover without displacing the written card.

Before implementing the Next.js component, read the relevant installed documentation under `apps/web/node_modules/next/dist/docs/` as required by `apps/web/AGENTS.md`.

## Firestore and Storage Rules

- Deny all direct client writes to `scoutBriefJobs` and `scoutBriefs`.
- Prefer denying direct client reads of private jobs entirely.
- Permit public artifact reads only if the selected data architecture requires direct Firestore access; the recommended SSR loader uses Admin Firestore and needs no new client read permission.
- Existing Storage rules already allow public reads under `public/**` and deny client writes. Add explicit tests for the Scout Brief path rather than broadening the rule.
- Moderation/takedown must remove the player through the card publication state and delete or quarantine the public object according to existing media policy.

## Configuration

Add names only to `.env.example`; never add values:

```text
AUDIENCE_TAKE_SCOUT_BRIEF_ENABLED
AUDIENCE_TAKE_SCOUT_BRIEF_SCRIPT_MODEL
AUDIENCE_TAKE_SCOUT_BRIEF_TTS_MODEL
AUDIENCE_TAKE_SCOUT_VOICE
AUDIENCE_TAKE_ANALYST_VOICE
GEMINI_API_KEY
```

Rules:

- Feature defaults off unless the implementation phase explicitly approves otherwise.
- All model IDs are pinned and reject moving aliases.
- `GEMINI_API_KEY` remains server-only in Secret Manager and is never available to Next.js public environment variables.
- The dedicated Developer API client must not alter the existing Vertex/ADK client's environment or authentication.
- Do not provision or rotate secrets, enable APIs, or change production infrastructure without explicit user approval.

## Observability

Emit bounded structured logs and private job metadata for:

- `scout_brief_dispatched`
- `scout_brief_lease_acquired`
- `scout_brief_script_validated`
- `scout_brief_tts_completed`
- `scout_brief_audio_uploaded`
- `scout_brief_ready`
- `scout_brief_failed`

Safe dimensions:

- `artifactId`, `cardVersionId`, `projectId`, `generationVersion`
- stage, duration bucket, byte count, latency, configured model ID
- fixed application-owned failure code

Never log transcript text, provider base64, prompts, authorization headers, API keys, raw provider errors, private user data, or chain-of-thought.

Suggested failure codes:

- `ineligible_card`
- `script_contract_invalid`
- `script_evidence_mismatch`
- `script_length_invalid`
- `tts_auth_failed`
- `tts_rate_limited`
- `tts_provider_failed`
- `tts_response_invalid`
- `provider_outcome_unknown`
- `audio_too_large`
- `audio_duration_invalid`
- `storage_upload_failed`
- `artifact_finalize_failed`

## Failure Policy

| Failure | Required behavior |
| --- | --- |
| Script model unavailable | Preserve card, no player, bounded private failure |
| Script contract invalid | Do not call TTS; preserve card |
| Evidence mapping invalid | Do not call TTS; preserve card |
| TTS 4xx/auth validation | Terminal audio failure; no fallback model |
| TTS 429/5xx before confirmed generation | Follow bounded task policy |
| Ambiguous post-send transport failure | Mark unknown; do not blindly repeat paid call |
| Invalid/oversized base64 or PCM | Reject; do not upload or publish |
| Duration outside safe tolerance | Reject artifact; preserve transcript privately |
| Storage upload failure | Retry storage without repeating TTS if validated bytes are durably available; otherwise fail safely |
| Final Firestore write failure after upload | Reconcile deterministic object metadata; do not repeat providers |
| Public artifact/card mismatch | Web loader hides player and logs safe diagnostic |
| Browser playback failure | Show text fallback and transcript when available |

Audio failure never changes card completeness, evidence status, publication status, provider proof for research, or the project's latest card pointer.

## Test Strategy

### Contract tests

- Add a canonical valid ready fixture.
- Validate the fixture against JSON Schema in JavaScript and Python.
- Reject extra properties, wrong IDs, non-HTTPS URL, invalid duration, more/fewer than two speakers, missing transcript, and non-ready public artifacts.
- Ensure historical Scout Card fixtures remain valid without audio fields.

### Script tests

- Closed-world input excludes private and unsupported data.
- Untrusted card text cannot alter system instructions.
- Exact six-section order and both speakers are required.
- Exactly three card pathway IDs appear in order.
- Unknown claim/source IDs fail.
- Qualified and conflicting claims retain appropriate language/placement.
- Unclaimed nomination disclosure is required when applicable.
- Word and character limits are enforced before TTS.
- Prohibited guarantee/platform-interest language fails safely.

### TTS client tests

- Uses configured pinned model.
- Sends `response_format: {type: "audio"}`.
- Sends exactly two speaker mappings whose names match the dialogue.
- Uses a dedicated Developer API client and server-only key.
- Parses the documented output field and strict base64.
- Handles missing audio, malformed envelope, invalid base64, timeouts, 4xx, 429, and 5xx as typed failures.
- Never leaks key, full prompt, transcript, raw response, or provider error.
- Never makes a live call in normal tests.

### Audio tests

- Wraps known PCM fixture into a valid mono 24 kHz, 16-bit WAV.
- Calculates duration and size correctly.
- Rejects odd byte length, empty data, oversized data, and out-of-range duration.
- Produces deterministic SHA-256 for the same bytes.

### Store/runtime tests

- Deterministic task/artifact/storage identity.
- Concurrent workers produce one ready artifact.
- Completed stages are reused on delivery retry.
- Provider high-water prevents accidental duplicate calls.
- Existing deterministic Storage object can finalize after a Firestore crash.
- No provider or Storage network call occurs inside a transaction.
- Audio dispatch failure does not change successful card publication.
- Ineligible card produces zero provider requests.
- Card v2 gets a distinct artifact while Card v1 remains unchanged.
- Failed refresh produces no fake audio for an unpublished card.

### Web tests

- Ready matching artifact renders the player.
- Missing, invalid, wrong-card, wrong-project, or non-ready artifact renders no broken player.
- No `autoplay`; `preload` is `metadata`.
- Play/pause, seeking, speed, keyboard access, focus, and error announcement work.
- Full transcript and speaker labels render.
- Source links resolve only to the card ledger.
- AI, version, and unclaimed-nomination disclosures render.
- Reduced-motion behavior contains no essential animation.

### Firebase tests

- Anonymous users cannot write jobs or artifacts.
- Authenticated users cannot write jobs or artifacts.
- Private job documents are not client-readable.
- Public audio path is readable.
- Client writes to the public audio path are denied.
- Private/non-public audio paths are denied.

### Critical journey

1. Open the primary published Scout Card.
2. Verify the page and written evidence render before audio interaction.
3. Start the Scout Brief manually.
4. Hear both voices.
5. Change playback speed and seek.
6. Open the transcript.
7. Follow one cited source from the transcript.
8. Confirm the AI, fan-nomination, and card-version disclosures.
9. Disable or break the audio fixture and confirm the Scout Card remains usable.

## Local Verification Commands

Run targeted checks first:

```bash
uv run --project services/agents ruff check services/agents/src services/agents/tests
uv run --project services/agents mypy services/agents/src
uv run --project services/agents pytest services/agents/tests/test_scout_brief.py services/agents/tests/test_http_app.py services/agents/tests/test_app.py services/agents/tests/test_orchestrator_agents.py
npm run test:contracts
npm run test --workspace @audience-take/web -- features/scout-brief features/scout-card/scout-card.test.tsx
```

Then run relevant repository gates:

```bash
npm run check
npm run build
npm run test:python
```

Run Firebase emulator tests only when prerequisites are available. Use recorded or synthetic PCM fixtures for every local test. Do not call Gemini merely to make a test pass.

## Provider Smoke Gate

A live Gemini TTS generation is a paid/external action and requires explicit user approval after local verification passes.

The approved smoke should:

1. Use one eligible immutable demo Scout Card.
2. Make at most one script request and one TTS request.
3. Persist safe model/request receipts without secrets.
4. Produce one versioned audio artifact and transcript.
5. Receive a human listening review for factual fidelity, pacing, pronunciation, speaker distinction, and respectful tone.
6. Record the artifact ID, card version, duration, safe logs, and screenshot in the demo runbook.

Do not run bulk generation for every existing card during the smoke gate.

## Accessibility and Performance Gate

- Keyboard-only interaction passes.
- Screen-reader names and state are meaningful.
- Transcript provides equivalent content.
- No autoplay occurs under any navigation or hydration state.
- Page render does not await audio bytes.
- Browser requests metadata rather than preloading the entire WAV.
- Mobile layout remains usable at the existing project breakpoints.
- WAV object stays below 20 MiB.
- Audio generation does not extend or invalidate the Scout Card publication transaction.

## Security and Privacy Gate

- No secret reaches Firestore, Storage metadata, browser bundles, logs, fixtures, or error messages.
- No private creator/user data enters either Gemini request.
- No raw web source or unreviewed community lead enters script generation.
- All public source URLs come from the matching card ledger.
- Direct client writes remain denied.
- Task route requires trusted Cloud Tasks delivery metadata and OIDC.
- TTS voices are stock configured voices and do not impersonate a real person.
- Public object takedown behavior is documented and tested.

## Demo and Submission Flow

Recommended demo moment:

1. Reveal the evidence-backed Scout Card.
2. Explain: “Parallel found and inspected the current public evidence. Gemini organized it into this card.”
3. Press **Listen to the Scout Brief**.
4. Play 20–30 seconds containing The Scout's hook and The Analyst's evidence caveat.
5. Open the transcript and show source links.
6. Show the three pathways and recommended experiment below.
7. State that every new immutable card version receives its own immutable audio brief.

The entire demo should not wait for live TTS generation. Use the real previously generated and version-matched artifact, and retain a written-card fallback.

## Risks and Verification

| Risk | Response | Verification |
| --- | --- | --- |
| Sounds like gimmicky AI banter | Fixed professional roles and bounded script | Human editorial review |
| Spoken hallucination | Closed-world card input and claim/source validation | Script fixture and manual audit |
| Preview model changes | Pinned config and fail-closed provider abstraction | Startup/config tests and docs re-check |
| Developer API conflicts with Vertex env | Dedicated explicit client | Construction tests |
| Audio blocks publication | Separate post-publication task | Failure-isolation test |
| Audio/card mismatch | Deterministic `cardVersionId` binding | Loader and versioning tests |
| Large WAV hurts mobile | Metadata preload, 20 MiB cap, future Opus/AAC | Network and size inspection |
| Duplicate paid calls after crash | Lease, persisted stages, provider high-water | Replay/crash-window tests |
| Creator feels impersonated | Stock roles, disclosure, no cloned voices | Copy and content review |
| Takedown leaves direct audio URL | Storage lifecycle/moderation procedure | Rules and moderation test |
| Poor pronunciation | Human smoke review; future pronunciation controls | Demo checklist |

## Implementation Order

1. Re-read current dirty diffs and current official Gemini TTS docs.
2. Add canonical Scout Brief schema, fixture, and cross-runtime validation.
3. Implement strict task, transcript, and artifact Pydantic models.
4. Implement closed-world input builder and transcript validator with fixtures.
5. Implement mocked Gemini script provider boundary.
6. Implement Gemini TTS client with recorded response fixtures only.
7. Implement PCM/WAV validation and deterministic Storage artifact logic.
8. Implement Firestore job lease/state/replay behavior.
9. Add private task route and post-publication dispatcher.
10. Implement web loader and accessible player/transcript.
11. Update Firebase rules tests, environment template, and infrastructure declarations.
12. Run targeted tests, then repository gates.
13. Perform manual desktop/mobile/accessibility review with local fixture audio.
14. Stop and request approval before any live Gemini, cloud, deployment, queue, commit, or push action.

For pre-existing cards, add and test the dry-run reconciliation report during local implementation. Do not execute its enqueue mode during this handoff. The hackathon provider smoke targets only the approved primary demo card.

## Acceptance Criteria

Implementation is complete only when:

1. A successful eligible Scout Card publication can enqueue one deterministic Scout Brief task without depending on the browser.
2. Audio generation failure cannot roll back, relabel, or corrupt the Scout Card.
3. The transcript is strict, 500–650 words, two-speaker, six-section, three-pathway, and evidence-linked.
4. The TTS request uses a pinned model, exactly two matching speaker mappings, and no private data.
5. Returned audio is safely decoded, duration/size validated, WAV-wrapped, checksummed, and uploaded to an immutable path.
6. The ready artifact is bound to one exact immutable card version and remains optional for historical cards.
7. The web loader hides all invalid or mismatched artifacts without failing the page.
8. The player never autoplays, is keyboard accessible, provides speed/seek controls, and includes the full transcript and disclosures.
9. Claims, sources, pathways, limitations, nomination state, and next experiment match the published card.
10. Delivery replay and crash-window tests prevent accidental duplicate provider calls or duplicate public artifacts.
11. All targeted and relevant repository checks pass.
12. No live Gemini call, cloud mutation, deployment, queue operation, secret change, commit, or push occurs without explicit approval.

## Stop Conditions

Stop and report rather than guessing when:

- Current official Gemini TTS request/response fields cannot be confirmed.
- The configured model or voice is unavailable.
- The installed SDK cannot use the documented Interactions API without an unreviewed upgrade.
- Only a browser-exposed API key would make the feature work.
- The implementation would require making audio a required Scout Card field.
- The existing dirty work conflicts with post-publication dispatch or immutable publication semantics.
- Historical Scout Cards cannot remain readable.
- Script validation cannot prevent unsupported claims from reaching TTS.
- A relevant verification command fails twice after one reasonable scoped fix.
- Completion requires a live provider, cloud, queue, deployment, commit, or push action that the user has not explicitly approved.

## Required Implementation Receipt

Antigravity must return:

- Plain-English outcome
- Files changed and why
- Final script and TTS model IDs
- Exact request and artifact contracts
- Versioning and failure-isolation behavior
- Accessibility behavior
- Tests added or changed
- Exact commands and results
- Environmental blockers
- Residual crash-window, preview-model, pronunciation, bandwidth, and moderation risks
- Confirmation that no unauthorized provider/cloud/deployment/queue/commit/push action occurred
- A request for explicit approval before the single live Gemini smoke generation
