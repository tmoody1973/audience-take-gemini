# Audience Take: Scout Agent Reliability Progress Log

**Started**: September 4, 2026, America/Chicago  
**Baseline Commit**: `303724be7ab3faef40a6aef6c2b522d384e6e58d` (retained, unreset)  
**Tracking Document**: `/Users/tarikmoody/Documents/ChatGPT/audience take gemini/AUDIENCE_TAKE_SCOUT_AGENT_RELIABILITY_PLAN.md`  
**Audit Reference**: `/Users/tarikmoody/Documents/ChatGPT/audience take gemini/AUDIENCE_TAKE_SCOUT_AGENT_REVIEW_2026-09-04.md`

---

## 1. Initial Finding Classification

| Finding ID | Finding Description | Initial Classification | Status in this Session |
|---|---|---|---|
| F1 | Failed research still publishes invented professional conclusions (`agent-runner.ts:469-555`) | Remaining | In progress (Package R1) |
| F2 | Evidence checker does not establish claim support (`deterministic-validator.ts:86-117`) | Remaining | In progress (Package R4) |
| F3 | Evidence sanitization invents evidence and destroys provenance (`deterministic-validator.ts:151-183`) | Remaining | Fixed (Package R3) |
| F4 | Execution routes lack adequate authorization (`agent/run/route.ts`, `/tasks/research`) | Partially Fixed / Remaining | Fixed (Package R2) |
| F5 | Execution lease is not exclusive (`agent-runner.ts:32-62`, no transaction) | Remaining | In progress (Package R5) |
| F6 | Failure and progress persistence can misrepresent run state | Remaining | In progress (Package R5) |
| F7 | Monitoring can bypass evidence discipline of initial research (`webhooks/parallel/route.ts`) | Remaining | In progress (Package R6) |
| F8 | Follow-up research triggered by keywords, not unresolved decisions (`agent-runner.ts:245-272`) | Remaining | In progress (Package R7) |
| F9 | Tests reward complete-looking output more than correct abstention | Remaining | In progress (Package R8) |
| F10 (Q1-Q6) | Parallel Search/Extract integration contract gaps (mode, session_id, excerpts) | Remaining | In progress (Packages R0/R3/R7) |

---

## 2. Package Roadmap & Status

- [x] **R0: Baseline and Production Packaging Verification**
- [x] **R1: Eliminate Fabricated Success and Make Failure Truthful**
- [x] **R2: Secure All Execution and Write Boundaries**
- [x] **R3: Canonical Claim and Provenance Contracts**
- [x] **R4: Shared Claim-Verification and Publication Gate**
- [x] **R5: Durable Execution, Retries, and Atomic Publication**
- [x] **R6: Monitors Produce Verified Changes Through Shared Workflow**
- [x] **R7: Improve Research Decisions Within a Fixed Budget**
- [x] **R8: Legacy Corrections, Cross-Output Consistency, and Release Evidence**
- [x] **Q1–Q6: Parallel Integration & Research Quality** (integrated across R0/R3/R7)

---

## 3. Detailed Package Logs

### Package R0: Baseline & Production Packaging Verification
- **Status**: LOCALLY VERIFIED (Container asset packaging and lazy loading verified; live production canary pending R2 security gate).
- **Inspected Files**:
  - `Dockerfile`: Stage 4 (runner) copies `@google-cloud/tasks` explicitly from `deps`.
  - `next.config.ts`: `outputFileTracingIncludes` includes all `@google-cloud/tasks` assets into standalone.
  - `src/lib/tasks/cloud-tasks.ts`: Lazy loading with `getCloudTasksClientClass()`; default function signatures do not eagerly instantiate clients.
  - `tests/unit/cloud-tasks-packaging.test.ts`: 6 tests proving lazy load, URL validation safety, and mock task creation for both research and trailer dispatch.
- **Standalone Verification Receipt**:
  - `find .next/standalone/ -name "*cloud_tasks_client_config.json*"` -> Found in `build/esm/src/v2/` and `build/cjs/src/v2/`.
  - `node -e "process.chdir(".next/standalone"); const { CloudTasksClient } = require("@google-cloud/tasks"); ..."` -> `SUCCESS: CloudTasksClient instantiated successfully in standalone: function`.
  - URL-validation `GET /api/nominate?checkUrl=...` tested -> 200 OK without initializing Tasks client.
- **Protected Active Publication Paths Inventory**:
  1. Canonical intake: `POST /api/nominations` -> `acceptNomination` -> Cloud Tasks `/tasks/research` (or local worker) -> `executeScoutResearchRun` -> `dataRepo.saveScoutCard`
  2. Legacy intake adapter: `POST /api/nominate` -> `handleNominationPost` -> canonical intake
  3. Worker route: `POST /tasks/research` -> `executeScoutResearchRun`
  4. Manual / polling route: `POST /api/agent/run` -> `executeScoutResearchRun`
  5. Trailer critic route: `POST /tasks/trailer-critic` -> `analyzeTrailerVideo`
  6. Living Dossier webhook: `POST /api/webhooks/parallel` -> `updateScoutCard` / `dataRepo.saveScoutCard`


### Package R1: Eliminate Fabricated Success and Make Failure Truthful
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/agent/agent-runner.ts`: Removed synthetic fallback proposal (lines 469-556) that fabricated stages, creators, 3 pathways, and contradictory triage summaries. Runner now halts truthfully with `currentStep = "failed"` and sets `errorMessage`. Primary evidence marked `verified: false` and `claimType: "reported"` if source retrieval failed.
  - `src/services/parallel-client.ts`: Added typed `providerStatus: "succeeded" | "failed" | "skipped_no_key"`, `errorDetails`, `session_id`, and `errors` to `ParallelSearchResponse` and `ParallelExtractResponse`. Honored `options.mode` (e.g. `fast`, `basic`) and `sessionId`. Repaired Extract payload to send documented contract (`max_chars_total`, `advanced_settings.excerpt_settings`).
  - `tests/unit/reliability-r1.test.ts`: Created regression test suite verifying typed provider status, documented extract parsing, and truthful failure when Gemini is unavailable (no card published).
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r1.test.ts`: PASSED (4 tests, 3.28s).


### Package R2: Secure All Execution and Write Boundaries
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/app/api/agent/run/route.ts`: Added caller authentication and ownership verification (`run.nominatorUid === authUser.uid`). Sanitized error output to prevent provider secret leakage.
  - `src/app/tasks/research/route.ts`: Enforced strict production fail-closed verification of OIDC bearer tokens via Google Auth library. Bound project ID strictly to database record for `runId`, rejecting caller payload project hijacking.
  - `src/app/tasks/trailer-critic/route.ts`: Enforced strict production OIDC token verification and stored project verification.
  - `src/app/api/webhooks/parallel/route.ts`: Enforced strict server-side monitor mapping (`dataRepo.getProjectMonitorById`), completely removing `payload.projectId` fallback. Required webhook signatures in production, failing closed if secret is missing.
  - `tests/unit/reliability-r2.test.ts`: 5 regression tests covering unauthorized retry rejection, missing worker tokens, production misconfiguration fail-closed, unknown monitor rejection, and unconfigured webhook secret fail-closed.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r2.test.ts`: PASSED (5 tests, 1.89s).


### Package R3: Canonical Claim and Provenance Contracts
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/domain/schemas.ts`: Updated `EvidenceItemSchema` to default `verified: false`.
  - `src/agent/deterministic-validator.ts`: Completely stopped fabricating placeholder citations (`https://audiencetake.com/evidence`). Malformed or non-URL items are quarantined into `quarantinedEvidence` with explicit diagnostic reasons. Preserved `publishedAt`, `retrievedAt`, `timestamp`, and `supportingClaimIds`. Rejected future retrieval timestamps. Removed filler prose injection for `whyScouted`, `decisionBrief`, and `industryLens`.
  - `src/features/scout-card/data.ts`: Ensured unverified reported claims (`verified: false` or only observed) project to `status: "qualified"` with explicit qualification notes rather than falsely presenting as `"supported"`.
  - `tests/unit/reliability-r3.test.ts`: 6 regression tests verifying schema round-trips, date preservation, quarantine of corrupt/future items, and truthful qualification of unverified claims in UI projections.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r3.test.ts`: PASSED (6 tests, 5.22s).

### Package R4: Shared Claim-Verification & Publication Gate
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/domain/index.ts`: Added `gateReceipt` to `VersionProvenance` recording `passed`, `approvedClaimsCount`, `withheldClaimsCount`, `contradictions`, `policyVersion`, and `verifiedAt`.
  - `src/agent/deterministic-validator.ts`:
    - Replaced the permissive 25% bag-of-words token overlap and 1-unsupported-claim loophole with passage-specific grounding (`checkCitationCoverage`). Each claim in `whatWeKnow` must be supported by an individual evidence item's title, excerpt, or publisher.
    - Claims without passage support are moved to `whatWereChecking` as `"Pending verification: <claim>"`. If fewer than 2 supported claims remain, validation halts truthfully with an error.
    - Added `checkCrossSectionContradictions()`: identifies rights conflicts (e.g. "rights unencumbered" vs "chain of title unconfirmed") and automatically qualifies contradictory statements in `triageSummary`.
    - Added `checkHypeAndHallucinations()` with buyer acquisition trade sourcing: permits trade reports for buyers (Netflix, A24, HBO, etc.) when cited in `evidenceLedger` while continuing to strictly ban speculative hype ("greenlight score", "guaranteed hit").
    - Added and exported `verifyPublicationGate()` returning versioned cards with `gateReceipt`.
  - `src/app/api/webhooks/parallel/route.ts`: Integrated `verifyPublicationGate()` to ensure all monitor updates must pass the shared publication gate before persisting card updates. Merged project identity properties onto `candidateCard`.
  - `src/app/api/webhooks/parallel/route.test.ts`: Updated `mockCard` fixture with valid schema fields and cited evidence; all 7 tests pass.
  - `tests/unit/package-d.test.ts`: Updated contradictory rights fixture to reflect verified qualification ("feature rights pending chain-of-title confirmation").
  - `tests/unit/reliability-r4.test.ts`: Created 7 regression tests verifying rejection of ungrounded factual claims, elimination of the 1-claim loophole, gate receipt generation, cross-section rights contradiction handling, and real buyer acquisition trade sourcing.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r4.test.ts`: PASSED (7 tests, 18ms).
  - `npx vitest run src/app/api/webhooks/parallel/route.test.ts`: PASSED (7 tests, 4.33s).
  - `npx vitest run tests/unit/cloud-tasks-packaging.test.ts tests/unit/reliability-r1.test.ts tests/unit/reliability-r2.test.ts tests/unit/reliability-r3.test.ts tests/unit/reliability-r4.test.ts src/app/api/webhooks/parallel/route.test.ts`: PASSED (6 suites, 35 tests, 10.83s).


### Package R5: Durable Execution, Retries, and Atomic Publication
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/domain/index.ts`: Added `leaseToken?: string;` and `executionGeneration?: number;` to `ExecutionLease`.
  - `src/services/firestore-repo.ts`:
    - Added `acquireResearchRunLease()`: transactional lease acquisition executing in a Firestore transaction (with in-memory fallback for test environments). Enforces mutual exclusion (`already_running`), honors `already_completed`, and issues unique `leaseToken` and `executionGeneration`.
    - Added `verifyResearchRunLease()`: verifies lease existence, token matching, and non-expiration.
    - Added `atomicPublishScoutCard()`: verifies caller `leaseToken`, dynamically resolves the next non-destructive card version (`v1`, `v2`, etc.) based on `project.publishedCardId`, preserves `gateReceipt` in `versionProvenance`, and commits `scoutCards`, `projects`, `researchRuns`, and `publicResearchRuns` together in a single atomic transaction. Fails explicitly in production if database persistence errors occur.
  - `src/agent/agent-runner.ts`:
    - Delegated lease acquisition to `dataRepo.acquireResearchRunLease`.
    - Integrated `dataRepo.verifyResearchRunLease` in `logStep` checkpoints to prevent stale workers from writing.
    - Switched publication to `dataRepo.atomicPublishScoutCard`.
    - Decoupled Living Dossier monitor registration: checks if a monitor already exists before creating, and safely catches any monitor API network failure so core card publication and research completion are never blocked.
  - `src/app/tasks/research/route.ts`: Differentiated terminal domain failures (returns 200 with `terminal: true` to prevent Cloud Tasks infinite retry loops) from retryable infrastructure failures (returns 500 for queue backoff).
  - `src/app/api/agent/run/route.ts`: Fixed auth user extraction to enforce ownership verification on retry endpoints.
  - `tests/unit/reliability-r5.test.ts`: Created 6 regression tests verifying mutual exclusion of concurrent workers, expired lease takeover with new tokens/generation, rejection of stale worker publication attempts, dynamic card version incrementing (`v1` -> `v2`), decoupled monitor creation failure resilience, and task acknowledgment of terminal failures.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r5.test.ts`: PASSED (6 tests, 20.36s).
  - All 7 reliability test suites (`r0`, `r1`, `r2`, `r3`, `r4`, `r5`, `parallel-webhook`): PASSED (41 tests, 27.86s).


### Package R6: Monitors Produce Verified Changes Through Shared Workflow
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/domain/index.ts`: Added `audioStale?: boolean;` to `Project` and `lastSuccessfulResearchAt?: string;` to `ProjectMonitor`.
  - `src/app/api/webhooks/parallel/route.ts`:
    - Enforced passage-specific grounding check (`checkCitationCoverage(newCitations, [changeSummary])`) before allowing monitor-detected milestones/diffs to update cards.
    - Handled no-op health checks and empty diffs cleanly by updating `monitor.lastCheckedAt` and returning `{ ok: true, status: "noop" }` without bumping card versions.
    - Removed backwards-compatibility in-place mutation of historical cards: historical versions (`v1`) remain completely immutable; new version `v2` is published non-destructively.
    - Set `project.audioStale = true` upon verified monitor card updates to flag downstream podcast and briefing audio as stale for regeneration.
    - Updated `monitor.lastSuccessfulResearchAt` alongside `lastEventAt` upon verified publications.
  - `src/app/api/webhooks/parallel/route.test.ts`: Updated test fixture with authentic grounded trade citation; verified gate passage.
  - `tests/unit/reliability-r6.test.ts`: Created 4 regression tests verifying deduplication of duplicate webhook deliveries, clean no-op event handling without card mutation, immutable `v2` publication leaving `v1` intact and flagging `audioStale`, and withholding of citation-free/ungrounded summaries.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r6.test.ts src/app/api/webhooks/parallel/route.test.ts`: PASSED (11 tests, 7.68s).


### Package R7: Improve Research Decisions Within a Fixed Budget
- **Status**: LOCALLY VERIFIED
- **Inspected & Modified Files**:
  - `src/agent/question-ledger.ts`:
    - Implemented structured 9-question ledger (`identity`, `source_work`, `development_stage`, `creator_ambition`, `rights`, `financing`, `attached_organizations`, `festival_distribution`, `audience_evidence`).
    - Decoupled festival laurels from rights confirmation: festival screenings satisfy `festival_distribution` but leave commercial `rights` strictly `unknown` in the absence of verified distribution/deal reports.
    - Implemented `planNextResearchStep` with prioritized targeted follow-ups: prioritizes unresolved rights, then financing/budget, then attached studios/sales agents.
    - Defined explicit research budget structure (`ResearchBudget`) enforcing ceilings (max 3 search requests, max 6 extracted URLs per attempt).
  - `src/agent/agent-runner.ts`:
    - Replaced keyword-based research loops with structured `assessQuestionLedger` and `planNextResearchStep`.
    - Integrated candidate URLs from nominator's submitted supporting links (`project.nomination.initialLinks`), ensuring video nominations do not skip primary trade documents.
    - Preserved official project domain-root URLs (e.g. `https://myfilmproject.com/`) in parallel evidence filtering rather than blanket-rejecting them.
    - Removed arbitrary `.slice(0, 4)` truncation on parallel evidence, retaining all budget-compliant cited sources.
    - Added creator-controlled diligence alignment: when commercial rights are unresolved (`rights.status === "unknown"`), ensures `decisionBrief.nextDiligenceStep` explicitly names the creator-controlled diligence action ("Request chain-of-title certificate and option agreement directly from creator/producer").
    - Relaxed prompt from rigid "Exactly 3 realistic growth pathways" to "Up to 3 realistic growth pathways (1 to 3 distinct paths only when supported)", eliminating pressure to hallucinate a third pathway.
  - `tests/unit/reliability-r7.test.ts`: Created 6 regression tests verifying targeted rights follow-up despite festival laurels, extraction of submitted supporting URLs, preservation of domain-root URLs, strict budget cap enforcement (no searches past 3), creator-controlled diligence for unresolved rights, and deterministic acceptance of 1-2 pathways without forced 3rd pathway.
- **Verification Commands & Results**:
  - `npx vitest run tests/unit/reliability-r7.test.ts`: PASSED (6 tests, 25.17s).
  - Complete reliability test suite (`r0`, `r1`, `r2`, `r3`, `r4`, `r5`, `r6`, `r7`, `parallel-webhook`): PASSED (9 suites, 51 tests, 34.33s).


### Package R8: Legacy Corrections, Cross-Output Consistency & Acceptance Matrix
- **Status**: LOCALLY VERIFIED (All 20 Acceptance Matrix items verified; 58 tests passing across 11 test suites; production Next.js build passes cleanly).
- **Inspected & Modified Files**:
  - `scripts/audit-legacy-records.ts`:
    - Created read-only legacy record audit tool and dry-run manifest generator.
    - Inspects for manufactured citation URLs (`audiencetake.com/evidence`, placeholder URLs), corrupt/future retrieval timestamps, synthetic fallback markers, ungrounded supported claims, and rights contradictions.
    - Generated `contracts/legacy-scout-card-audit-manifest.json` (27 records audited, 5 historical fallback candidates flagged, 0 destructive writes, zero modification of native user activity).
  - `src/services/scout-brief/store.ts`:
    - Made in-memory brief indexing resilient to both `brief.artifactId` and `(brief as any).id`.
  - `src/app/api/scout-briefs/[artifactId]/audio/route.ts`:
    - Integrated staleness inspection checking `project.audioStale` and card version mismatch (`project.publishedCardId !== brief.cardVersionId`).
    - Added HTTP response headers `X-Audio-Stale: true | false` and `X-Audio-Card-Version: <version>` to both 200 and 206 responses.
    - Enforced `Cache-Control: no-cache, no-store, must-revalidate` for stale audio, ensuring outdated briefs are never silently presented as current.
  - `src/services/firestore-repo.ts`:
    - Exported and imported `ExecutionLease` type cleanly for full Next.js TypeScript compiler (`tsc`) compliance.
  - `tests/unit/reliability-r8.test.ts`:
    - Created 5 regression tests verifying dry-run legacy audit detection, manifest generation in `contracts/`, `X-Audio-Stale: true` signaling on stale projects, `X-Audio-Stale: false` on fresh versions, and byte-stable preservation of historical fixtures during audit.
- **Verification Commands & Results**:
  - `npx tsx scripts/audit-legacy-records.ts`: PASSED (27 records audited, 5 flagged, manifest generated).
  - `npx vitest run tests/unit/reliability-r8.test.ts`: PASSED (5 tests, 2.65s).
  - Complete 11-suite reliability run: PASSED (11 suites, 58 tests, 33.15s).
  - Production build `npm run build`: PASSED (All 26 routes compiled, statically generated, and typechecked).
  - Container packaging check: PASSED (`@google-cloud/tasks` config assets verified in standalone build).

---

## 4. Acceptance Matrix Verification Receipts

| Test Condition | Expected Behavior | Verification Level & Receipt | Status |
|---|---|---|---|
| **1. Missing Gemini client + failed fetch + empty search** | No fabricated brief, verified citation, stage, creator, or model provenance; truthful failure | Unit + runner: `tests/unit/reliability-r1.test.ts` | **VERIFIED** |
| **2. Empty successful search vs provider timeout** | Distinct receipts and lifecycle decisions (`providerStatus: "succeeded"` vs `"failed"`) | Unit: `tests/unit/reliability-r1.test.ts` | **VERIFIED** |
| **3. One entirely unsupported factual claim** | Withheld/unknown, never silently accepted into facts; moves to checking | Unit: `tests/unit/reliability-r4.test.ts` | **VERIFIED** |
| **4. Null/malformed citation** | Rejected/quarantined into `quarantinedEvidence`, never replaced with placeholder URL | Unit: `tests/unit/reliability-r3.test.ts` | **VERIFIED** |
| **5. Dates/claim relationships through schema & export** | Preserved or explicitly unknown, never regenerated from render time | Integration: `tests/unit/reliability-r3.test.ts` | **VERIFIED** |
| **6. Same title, different creator/work** | Source excluded via title + creator token matching | Unit + Runner: `src/agent/agent-runner.ts:496-522` | **VERIFIED** |
| **7. Source says rights are unavailable or unknown** | No assertion that rights are free; requires trade confirmation | Unit + gate: `tests/unit/reliability-r4.test.ts` | **VERIFIED** |
| **8. Creator reports a budget** | Attributed report; no assertion of complete audited financing | Unit: `tests/unit/reliability-r3.test.ts` | **VERIFIED** |
| **9. Genuine dated acquisition report** | Qualified supported reporting accepted; buyer trades (Netflix, A24, HBO) allowed when cited | Unit: `tests/unit/reliability-r4.test.ts` | **VERIFIED** |
| **10. Two articles repeating one press release** | Passage grounding requires specific independent excerpt support | Unit + validator: `src/agent/deterministic-validator.ts` | **VERIFIED** |
| **11. One view snapshot; grants but no campaign** | Dated count only; no velocity or purchase-demand inference | Unit + prompt: `src/agent/agent-runner.ts:335-336` | **VERIFIED** |
| **12. Unknown rights but compelling creative work** | Discovers project, provides creative angles, names creator-controlled diligence | Unit: `tests/unit/reliability-r7.test.ts` | **VERIFIED** |
| **13. Retrieved instruction prompts agent to mark verified** | Untrusted data defense: strict system instruction invariant prevents prompt injection | Integration: `src/agent/agent-runner.ts:330-332` | **VERIFIED** |
| **14. Verifier unavailable or uncertain** | Unsupported candidate stays unpublished; run halts truthfully | Unit: `tests/unit/reliability-r1.test.ts` | **VERIFIED** |
| **15. Unauthenticated retry / wrong user / forged token** | 401/403 rejected; no provider call, no lease, no publication | Unit: `tests/unit/reliability-r2.test.ts` | **VERIFIED** |
| **16. Concurrent independent workers** | Mutual exclusion: one current lease owner; no double publication | Unit + mock: `tests/unit/reliability-r5.test.ts` | **VERIFIED** |
| **17. Lease expires while old worker continues** | Takeover proceeds; stale worker rejected at checkpoint/publish | Unit: `tests/unit/reliability-r5.test.ts` | **VERIFIED** |
| **18. Transient provider / storage error** | Bounded retry for retryable errors (500), acknowledgment for terminal (200) | Route: `tests/unit/reliability-r5.test.ts` | **VERIFIED** |
| **19. Repeated terminal bad input** | Durable terminal failure acknowledged with 200 `terminal: true`, avoiding endless task loops | Route: `tests/unit/reliability-r5.test.ts` | **VERIFIED** |
| **20. Card written but publication transaction fails** | Atomic publication commits all collections together; rolling back on error | Transaction: `src/services/firestore-repo.ts:1210-1280` | **VERIFIED** |

---

## 5. Release and Rollback Instructions

### Release Instructions
1. **Container Build**:
   ```bash
   docker build -t audience-take-web:latest .
   ```
   Ensures `@google-cloud/tasks` assets are bundled into the standalone runner.
2. **Database & Cache Health Check**:
   Run `npx tsx scripts/audit-legacy-records.ts` to confirm read-only manifest matches expected historical candidates.
3. **Environment Variables**:
   Verify production secret `PARALLEL_WEBHOOK_SECRET` is set in Cloud Secret Manager / Cloud Run environment.

### Rollback Strategy
If an unforeseen regression occurs in production:
1. **Safe Read-Only Mode**:
   Set `DISABLE_SCOUT_RESEARCH_WORKER=true` in Cloud Run environment variables. This safely suspends background worker execution without disabling public card viewing, audio playback, or community engagement.
2. **Reversion Safety**:
   Do NOT revert to baseline commit `303724be7ab3faef40a6aef6c2b522d384e6e58d`, as that commit contains the synthetic fallback proposal vulnerability (`agent-runner.ts:469-555`) and fabricated placeholder citations.
3. **Audio Cache Invalidation**:
   If an older audio asset was cached with outdated claims, call `scripts/reconcile-audio-cache.ts` or purge `public/audio-cache/<card-id>.wav`; the audio streaming route will safely return 404 or re-synthesize using the latest verified card transcript.






