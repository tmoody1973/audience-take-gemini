# Audience Take — Corrective Implementation & Verification Progress
**Date**: September 6, 2026  
**Starting Commit**: `bf8d9553ee0217246a0517b5cad4154dd7828b02`  
**Current HEAD**: `bf8d9553ee0217246a0517b5cad4154dd7828b02`  
**Active Cloud Run Revision**: `audience-take-web-00097-jtz` (100% traffic)  

---

## 1. Executive Summary & Tracking Matrix

| Package | Name | Primary Outcome | Status | Verification Tier |
|---|---|---|---|---|
| **C0** | Baseline & Contract Repair | Hermetic test environment, zero TS errors, progress log | COMPLETED | Local Mock / Pure Unit |
| **C1** | Truthful Surfaces | Eliminate fake city fallback, auto-outreach claims, false confidentiality | COMPLETED | Local & Staged |
| **C2** | Evidence & Publication Integrity | Provenance separation (nominator vs source), negation handling, full-surface gates | COMPLETED | Local & Adversarial |
| **C3** | Reliable Execution | Unexpired lease ownership, stale-worker defense, durable dispatch recovery | COMPLETED | Local & Firestore Emulator |
| **C4** | Parallel Research Quality | Identity-first resolution, eliminate placeholder queries, bounded receipts | COMPLETED | Local & Parallel Provider |
| **C5** | Parallel Monitor Repair | Lifecycle event alignment, HMAC signature, deduplication, versioned updates | PENDING | Local & Provider Webhook |
| **C6** | Existing Record Repair | Correction manifest for Junichiro, Vampair, CYCLE; reversible versioning | PENDING | Local & Production Dry-Run |
| **C7** | Purposeful Product Experience | Separated Fan/Pro journeys, grounded audio narration, responsive/a11y check | PENDING | Local & Chrome DevTools |
| **C8** | Final Image & Deployed Proof | 7-point Cloud Tasks image audit, smoke check, canonical canary trace | PENDING | Container Image & Cloud Run |
| **C9** | Demonstrated Impact & Submission | 16-case frozen benchmark evaluation, user testing protocol, demo script | PENDING | Human-Reviewed Benchmark |

---

## 2. Package Progress Logs

### C0 — Reproducible Baseline & Contract Repair: COMPLETED
- **Root Causes Identified & Repaired**:
  1. `scout-brief-player.test.tsx`: Missing `beforeEach` import from `vitest`.
  2. `gemini-tts-client.test.ts`: Readonly `process.env.NODE_ENV` assignment cast via `(process.env as any).NODE_ENV = ...`.
  3. `tests/unit/agent-api.test.ts`: Aligned `ParallelSearchResultItem` (removed non-schema `publisher`) and used `NextRequest`.
  4. `tests/unit/audio-verification-matrix.test.ts`: Added required `externalCommentary: false` to ledger entries, aligned `completeness: "partial"`, added `industryLens` and `media` mock.
  5. `tests/unit/fan-improvements/take-upvote.test.ts`: Standardized mock `NextResponse.json` returns to include `{ ok: true, data, error: null, requestId }`.
  6. `tests/unit/package-d.test.ts`, `parallel-e2e-workflow.test.ts`: Added `providerStatus: "succeeded"` and `extract_id` to mock Parallel returns.
  7. `tests/unit/package-g.test.tsx`: Corrected `sourceRole` from non-union `'festival_selection'` to `'trade_reporting'`, added `externalCommentary: false` and `industryLens`.
  8. `tests/unit/package-h.test.tsx`: Safely optional-chained `variety?.excerpt`, added `externalCommentary: false` and `industryLens`.
  9. `tests/unit/parallel-search.test.ts`: Cast fetch mocks with `as unknown as typeof fetch`, guarded `warnings?.some`.
  10. `tests/unit/production-scenarios/acceptance-matrix.test.ts` & `production-scenarios-section.test.tsx`: Added valid `industryLens` with `recommendedNextExperiment`.
  11. `src/domain/index.ts`: Exported `type ResearchRun = ResearchRunState;`.
  12. `tests/unit/reliability-r5.test.ts`: Added required `versionProvenance` and `extract_id`.
  13. `tests/unit/reliability-r7.test.ts`: Added `normalizedUrl`, updated nomination fields, populated full lease object (`acquiredAt`, `attempt`), called `executeScoutResearchRun(runId)`.
  14. `tests/unit/reliability-r8.test.ts`: Replaced `'development'` with `'concept'`, used `publicationStatus: "published"`.
- **Verification Commands Executed**:
  - `npx tsc --noEmit`: **0 errors** (all 62 compiler errors resolved).
  - Reliability suite (R1–R8): **8 files passed, 43/43 tests green**.
  - Secondary unit suite (18 files, 84 tests): **18 files passed, 84/84 tests green**.

### C1 — Truthful Surfaces & Operational Claims: COMPLETED
- **Root Causes Identified & Repaired**:
  1. `src/features/social/scout-social-panel.tsx`: Hardcoded fallback `{ "New York": 42, "Los Angeles": 31, "Chicago": 18 }` manufactured fake demand. Removed fallback and wired `counts.cityCounts || counts.cities || {}`.
  2. `src/features/social/city-demand-meter.tsx`: Threshold reached state automatically asserted `"Partner outreach active"` without recorded outreach. Changed to honest `"✓ Threshold reached — Community interest goal met"`, only displaying `"Partner outreach in progress"` when `outreachActive === true`. Empty state renders honest zero-signal notice.
  3. `src/lib/social/store.ts`: Added `normalizeCity` and `moveCityCommitmentCount` to aggregate `cityCounts` / `demoCityCounts` in `project` document transactions, guaranteeing project `bring_to_city` counts strictly reconcile with city totals upon new signals, city updates, and withdrawals.
  4. `src/features/scout-card/living-updates.tsx`: Pulsing green `"Live Tracking"` was displayed purely because historical updates existed. Added `MonitorHealth` interface; now renders `"Active Monitoring"` ONLY when `monitorHealth.status === "active"`, `"Recorded Updates (Monitoring paused)"` when disabled, or neutral `"Recorded Updates"` when unmonitored.
  5. `src/features/scout-card/professional-brief-view.tsx`: Removed `"CONFIDENTIAL EVALUATION RECORD"` label from public dossier views; kicker now reads `"PROFESSIONAL DOSSIER"`. Made `sourceLabels` safely fallback to auto-computed map when omitted.
  6. `src/features/scout-card/data.ts`: Corrected CYCLE related project description from fictional bicycle rebuilding to the authentic documentary about Ty'Rese West directed by Laura Dyan Kezman (LionArt Media).
- **Verification Commands Executed**:
  - `npx vitest run tests/unit/truthful-surfaces.test.tsx`: **11/11 tests passed**.
  - `npx vitest run tests/unit/fan-improvements/`: **8 files passed, 27/27 tests passed**.
  - `npx vitest run tests/unit/reliability-r*.test.ts`: **8 files passed, 43/43 tests passed**.
  - `npx tsc --noEmit`: **0 errors**.

### C2 — Evidence & Publication Integrity: COMPLETED
- **Root Causes Identified & Repaired**:
  1. `src/agent/agent-runner.ts`: Nominator context (`project.nomination.reason`) was previously concatenated directly into `primaryEvidence.excerpt`, allowing unverified nominator claims to inherit primary source verification. Removed nominator text concatenation and separated it into a distinct unverified lead item (`isNominatorLead: true`, `verified: false`).
  2. `src/agent/deterministic-validator.ts`: Substring and token overlap matching in `checkCitationCoverage` lacked negation detection, causing passages stating "Netflix has not acquired" to falsely verify "Netflix has acquired". Implemented `hasNegationContradiction(claim, passage)` to detect when passages deny or contradict affirmative claims.
  3. `src/agent/deterministic-validator.ts`: Added `isBuyerOrHypeClaim(claim)`. While general production facts can be grounded by unverified reported items (and projected to `qualified`), buyer acquisitions and multi-million dollar commercial claims strictly require verified trade/press coverage without negation.
  4. `src/agent/deterministic-validator.ts`: In `checkHypeAndHallucinations`, expanded buyer acquisition patterns to match bidirectional phrasing and enforced that buyer mentions must be supported by verified trade coverage free of negation contradictions.
- **Verification Commands Executed**:
  - `npx vitest run tests/unit/evidence-integrity-c2.test.ts`: **7/7 tests passed**.
  - `npx vitest run tests/unit/reliability-r*.test.ts`: **8 files passed, 43/43 tests passed**.
  - `npx tsc --noEmit`: **0 errors**.

### C3 — Reliable, Authenticated Execution: COMPLETED
- **Root Causes Identified & Repaired**:
  1. `src/services/firestore-repo.ts`: In `atomicPublishScoutCard`, database errors previously caught exceptions and fell back to updating in-memory store in non-production environments. Removed the production guard; now fails closed on all database errors. In the Firestore transaction, enforced both lease token matching and non-expiration checks (`new Date(runData.lease.expiresAt).getTime() > Date.now()`).
  2. `src/services/firestore-repo.ts`: Added `renewResearchRunLease(runId, leaseToken, extendDurationMs)` providing atomic lease extensions for active workers while rejecting renewals for expired or stolen leases.
  3. `src/services/firestore-repo.ts`: Updated `saveResearchRun(run, leaseToken)` to verify caller lease ownership before mutating state, preventing stale workers from overwriting a successor worker's progress.
  4. `src/agent/agent-runner.ts`: In `executeScoutResearchRun`, periodically renews the unexpired lease during lengthy provider operations. In the catch handler, if an `Execution lease` error occurs, the worker immediately aborts without wiping `run.lease = null` or overwriting the successor worker's run state.
  5. `src/lib/nomination/store.ts` & `src/lib/nomination/reconciler.ts`: Added `getPendingOrRetryableRuns`, `markTerminalDispatchFailure`, and `recordDispatchRetry` to `NominationStore`. Implemented `reconcilePendingDispatches` to boundedly recover `retryable_failed` nomination intents up to `maxAttempts` (default 3), transitioning to `dispatched` on success or `failed_terminal` with `retryEligible: false` upon retry exhaustion.
  6. `src/app/tasks/research/route.ts` & `src/app/tasks/trailer-critic/route.ts`: Enforced OIDC token verification whenever `AGENT_SERVICE_AUDIENCE` is configured or in production, and validated `CLOUD_TASKS_SERVICE_ACCOUNT` identity when specified.
  7. `src/app/api/agent/run/route.ts`: Routed user retries through the Cloud Tasks dispatcher when configured, preventing long synchronous work on web requests.
### C4 — Parallel Research Quality & Identity-First Resolution: COMPLETED
- **Root Causes Identified & Repaired**:
  1. `src/agent/agent-runner.ts`: Nominations initialize `project.identity.title` as `"Project under research"`. In Step 2, queries previously checked only `!startsWith("investigating")`, causing `"Project under research"` to be sent as literal search terms (e.g. `"Project under research development financing production budget"`). Implemented `isPlaceholderTitle()` and identity-first title resolution using clean YouTube titles, URL path slugs, and creator hints. If title is unresolved, objectives and queries are framed specifically around identity and disambiguation without placeholder terms.
  2. `src/services/parallel-client.ts`: When fewer than 2 queries were provided, `parallel-client.ts` previously concatenated `${cleanObjective} film series` to the queries, polluting searches with raw prompt instructions. Removed artificial concatenation and added query sanitization to strip placeholder tokens.
  3. `src/agent/question-ledger.ts`: In `planNextResearchStep`, sanitized `projectTitle` so placeholder text never enters follow-up queries or objectives.
- **Verification Commands Executed**:
  - `npx vitest run tests/unit/parallel-research-quality-c4.test.ts`: **5/5 tests passed**.
  - `npx vitest run tests/unit/reliable-execution-c3.test.ts tests/unit/parallel-research-quality-c4.test.ts tests/unit/reliability-r*.test.ts`: **10 files passed, 55/55 tests passed**.
  - `npx tsc --noEmit`: **0 errors**.


