# Antigravity CLI Handoff — Build Audio Scout Brief

Work in:

`/Users/tarikmoody/Documents/Projects/AudienceTake/audience-take`

## Objective

Implement the Gemini-powered **Scout Brief** feature: a failure-isolated, three-to-five-minute, two-speaker audio briefing attached to each eligible immutable Scout Card version. Complete local implementation and verification, then stop before any live Gemini call, cloud mutation, deployment, queue operation, commit, or push.

## Authoritative feature documents

Read these completely before changing code:

1. `docs/hackathon-build/audio-scout-brief-prd.md`
2. `docs/hackathon-build/audio-scout-brief-tech-spec.md`

Then read the existing architecture and current state they reference:

- `docs/hackathon-build/spec.md`
- `docs/hackathon-build/prd.md`
- `docs/hackathon-build/checklist.md`
- `docs/hackathon-build/session-handoff.md`
- `apps/web/AGENTS.md`

Do not replace or rewrite the project-wide PRD/spec. The two feature documents are the implementation contract.

## Start with read-only inspection

Run:

```bash
git status --short --branch
git diff -- services/agents/src/audience_take_agents/http_app.py
git diff -- services/agents/src/audience_take_agents/orchestrator.py
git diff -- services/agents/src/audience_take_agents/runtime/service.py
git diff -- services/agents/src/audience_take_agents/publication
git diff -- services/agents/tests
```

The worktree is already dirty. Known modified files include `http_app.py`, `orchestrator.py`, `runtime/service.py`, publication modules, and related tests. Untracked work exists under `docs/product-history/`. Preserve all user work, understand overlapping diffs before editing, and never reset/revert unrelated changes.

## Non-negotiable architecture

- Generate audio only after a Scout Card is successfully published.
- Store audio/transcript as a separate sidecar artifact keyed to exact `cardVersionId`; do not make audio a required Scout Card field.
- Use exactly two speaker roles: `Scout` and `Analyst`.
- Gemini TTS performs a validated transcript; it does not research or qualify evidence.
- Transcript input is closed-world public Scout Card data only.
- Every factual transcript segment maps to valid card claim/source IDs.
- Include all three pathways in order, uncertainty, fan-nomination status when applicable, and the published next experiment.
- Never autoplay. Require a full transcript, disclosure, duration, accessible controls, and source links.
- Audio/script failure must not change card completeness, publication status, research provider proof, or project pointer.
- Replays must reuse persisted stages and avoid accidental duplicate paid provider requests.
- Historical cards without audio remain valid.

Current official Gemini documentation, verified while writing the spec, shows `gemini-3.1-flash-tts-preview`, an Interactions API request with `response_format.type: audio`, up to two speaker mappings, and base64 PCM output. Re-run the repository-required Context7 lookup before coding; do not guess if the preview contract changed.

## Implementation shape

Follow the file map and order in the technical spec. In summary:

1. Canonical Scout Brief JSON Schema and fixtures.
2. Strict Python task/transcript/artifact models.
3. Closed-world script builder and evidence validator.
4. Mockable Gemini script provider.
5. Dedicated Gemini Developer API TTS client; do not disturb the existing Vertex client.
6. PCM validation, mono 24 kHz/16-bit WAV wrapping, duration/size/checksum limits.
7. Private Firestore job lease/state plus immutable public artifact and Storage object.
8. Authenticated private `/tasks/scout-brief` route and deterministic post-publication dispatch.
9. Strict server-side web loader.
10. Accessible Scout Card player and transcript.
11. Rules, configuration, infrastructure declarations, and complete tests.

Also implement the spec's dry-run reconciliation report for eligible historical cards missing audio. Do not enqueue a bulk backfill; the only permitted provider smoke after approval is the explicitly selected demo card.

Before editing Next.js code, read the relevant installed guide under `apps/web/node_modules/next/dist/docs/` as required by `apps/web/AGENTS.md`.

## Provider and environment boundary

- Do not call Gemini during development or tests.
- Do not provision a key, secret, API, queue, bucket, or IAM role.
- Add configuration names only to `.env.example`.
- Keep `GEMINI_API_KEY` server-only and separate from the existing Vertex/ADK authentication.
- Reject moving `latest` aliases.
- Use synthetic/recorded PCM and provider envelopes locally.
- After every local gate passes, request explicit approval for one script call and one TTS call against one eligible demo card.

## Verification and receipt

Run the targeted commands and repository gates listed in the technical spec. Do not weaken a test because of an environment failure; classify the blocker accurately.

Return an implementation receipt containing outcome, files changed, exact model/request/artifact contracts, versioning and failure behavior, accessibility behavior, tests and commands, blockers, residual risks, and confirmation that no unauthorized provider/cloud/deployment/queue/commit/push action occurred.

## Suggested skills

- `find-docs` for current Gemini and installed Next.js documentation
- `coding-agent` or `incremental-implementation` for bounded implementation
- `api-and-interface-design` for task/artifact contracts
- `accessibility` for the audio player and transcript
- `debugging-and-error-recovery` for lease/replay/crash-window behavior
- `best-practices` for the final verification pass

Stop rather than guessing if the official TTS contract is unavailable, the SDK requires an unreviewed upgrade, only a browser-exposed key would work, immutable card compatibility breaks, or dirty overlapping work cannot be safely preserved.
