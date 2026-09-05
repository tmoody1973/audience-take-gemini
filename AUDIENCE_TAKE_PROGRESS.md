# Audience Take Implementation & Quality Progress Log

Tracking implementation progress against `/Users/tarikmoody/Downloads/AUDIENCE_TAKE_IMPROVEMENT_PLAN.md`.

## Master Status

| Work Package | Description | Status | Verification & Receipts |
| :--- | :--- | :--- | :--- |
| **Package A** | Contain misleading outputs & establish truthful baseline | **Completed** | EI-1 and EI-4 fallbacks eliminated; clean build & tests verified |
| **Package B** | Make evidence a single shared data contract | **Completed** | EI-2 passage mapping, order invariance, deduplication & real dates verified |
| **Package C** | Repair nomination, execution, and persistence | **Completed** | Execution lease, idempotent worker, Cloud Tasks endpoints, browser-trigger elimination verified |
| **Package D** | Make Parallel research decision-focused | **Completed** | Query generation with triage focus, bounded queries (max 3 searches, 6 extracts), `decisionBrief` fields (`whyInvestigate`, `materialUncertainty`, `nextDiligenceStep`) |
| **Package F** | Repair Parallel Monitor API & signed webhooks | **Completed** | Standard Webhooks HMAC-SHA256 verification (`svix-timestamp`, `svix-signature`), monitor registration v1 contract, living updates stream |
| **Package E** | Reorganize Scout Card for Fans & Professionals | **Completed** | Dual-audience role toggle (Discover vs Professional Brief), Action Strip, Pathway Voting, Citation Drawer, responsive typography, `@media print` |
| **Package G** | Repair optional media & audience analysis | **Completed** | Media states (`authorized_embed`, `editorial_fallback`, `missing`), empty-beats notice, comment sampling metadata (`sampleSize`, `samplingLimitations`) |
| **Package H** | Evaluate held-out projects, card corrections & release | **Completed** | Resolved Junichiro Chicago provenance (Variety / TeamTO), eliminated Vampair crossover, dynamic audit table, full test suite (79/79 files, 311 tests passing), production build 0 errors |

---

## Evidence-Integrity Release Gates (Mandatory Blockers)

| Gate | Description | Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **EI-1** | Eliminate hardcoded commercial/audience inputs and false precision | **Completed** | Removed title/slug branches, score floors, and fake buyers in `data.ts`, `market-viability-engine.ts`, `scouting-wall`, and `re-scout-engine.ts` |
| **EI-2** | Replace positional citations and fabricated freshness with explicit passages | **Completed** | Eliminated modulo `%` citations in `data.ts`; implemented deterministic `findSupportingSourceIds` with order invariance; preserved real `publishedAt` and `retrievedAt` timestamps |
| **EI-3** | Resolve Junichiro and Vampair contradictions via shared evidence record | **Completed** | Reconciled Junichiro to its true Chicago setting from Variety & TeamTO reporting in `firestore-repo.ts` and card records; eliminated Vampair trailer crossover; added identity gating when relationship status is unresolved |
| **EI-4** | Eliminate canned fandom conclusions and invented video scenes/timestamps | **Completed** | Removed canned lookout tower and fake fandom comps in `trailer-critic-engine.ts` and `audience-comment-analyzer.ts`; replaced artificial scores with truthful zero/unavailable states; removed Gothic horror fallbacks |

---

## Change Log

### Session 1 (2026-09-04)
- Verified baseline commit `f9ab54730ebdf3f752a4fc335ede518a03bb3bf0` against current checkout.
- Mapped active nomination-to-publication path; confirmed architectural bifurcation and browser-triggered execution leaks.
- Initiated and completed **Package A**:
  - Eliminated title/slug branching, fallback financial amounts, fabricated studio attachments, and score floors in `market-viability-engine.ts`.
  - Removed hardcoded `dynIsDoc`, `dynIsComedy`, `dynIsGoth` branches in `src/features/scout-card/data.ts`.
  - Removed canned comments, fake merchandise demand signals, and fabricated demographic comps in `src/critic/audience-comment-analyzer.ts`.
  - Eliminated invented fire lookout tower beats, fake timestamps, and manufactured critic matrix scores in `src/critic/trailer-critic-engine.ts`.
  - Removed simulated active monitor registrations (`monitor_mock_*`) in `src/services/parallel-client.ts`.
  - Removed manufactured score pills (`88 Heat`, `82 Viability`) on unrated entries in `src/features/scouting-wall/data.ts` and `scouting-wall-client.tsx`.
  - Preserved non-video extracted text from Parallel Extract in primary evidence citations in `src/agent/agent-runner.ts`.
  - Verified with full Next.js production build (`npm run build`: 24/24 routes static/dynamic compile clean) and Vitest suite passing.

### Session 2 (2026-09-04)
- Initiated and completed **Package B (Shared Evidence Contract & Grounded Citations - EI-2)**:
  - Extended domain schemas (`EvidenceItemSchema`, `EvidenceItem`, `sourceLedgerSchema`, `SourceLedgerEntry`) with `publishedAt`, `retrievedAt`, `supportingClaimIds`, and `excerpt`.
  - Removed all positional modulo arithmetic citation assignments in `src/features/scout-card/data.ts` (`s1`, `s2`, `assignedSourceId`, and comparables).
  - Implemented `canonicalizeUrl` to deduplicate citations to the same canonical resource without inflating source counts.
  - Implemented `findSupportingSourceIds` for deterministic, order-invariant keyword, phrase, and entity matching against source excerpts, titles, and URLs.
  - Implemented truthful claim abstention: claims lacking matching source passages are classified as `"inference"` with `sourceIds: []` and an explicit qualification message.
  - Eliminated date fabrication on render: cards now preserve real `publishedAt` and `retrievedAt` timestamps from evidence records or run metadata instead of calling `new Date().toISOString()`.
  - Cleaned remaining fallback fandom and living dossier metric fabrications in `readPublishedScoutCard`.
  - Preserved actual publication dates from Parallel Search (`publish_date`) and real retrieval timestamps in `src/agent/agent-runner.ts`.
  - Enhanced public source ledger UI in `src/features/scout-card/scout-card.tsx` and `globals.css` to display formatted passage excerpts and publication dates.
  - Verified with Vitest suite (74/74 test files passed, 283 passed tests) and full Next.js production build (`npm run build`: 24/24 static/dynamic routes compiled clean).

### Session 3 (2026-09-04)
- Initiated and completed **Package C (Nomination, Execution, and Persistence)**:
  - Added `ExecutionLease` interface and `lease`, `attempt` tracking to `ResearchRunState` in `src/domain/index.ts`.
  - Implemented atomic execution lease (`acquireExecutionLease`) with 15-minute expiration, idempotency for completed runs, and release on complete/failed in `src/agent/agent-runner.ts`.
  - Created Cloud Tasks worker route handlers at `src/app/tasks/research/route.ts` and `src/app/tasks/trailer-critic/route.ts`.
  - Completely eliminated browser-triggered automatic execution in `src/features/research-progress/research-progress.tsx` (removed uncoordinated `fetch("/api/agent/run")` on mount; added explicit retry control on failure).
  - Unified nomination form submission in `src/app/nominate/nomination-form.tsx` to `/api/nominations` without unawaited client-side execution triggers or silent downgrade fallbacks.
  - Reconciled nomination store models in `src/lib/nomination/store.ts` and defensive normalization in `src/services/firestore-repo.ts` (`getProjectById`, `getResearchRunById`, `publishScoutCard`).
  - Added SSRF URL safety validation to `src/app/api/critic/run/route.ts`.
  - Adapted `src/app/api/nominate/route.ts` to delegate directly to canonical handler with Guest Scout demo auth mapping.
  - Verified with 5 dedicated tests in `tests/unit/package-c.test.ts`, full Vitest test suite (75/75 test files passed, 288 passed tests), and full Next.js production build (`npm run build`: 26/26 static/dynamic routes compiled clean with exit code 0).

### Session 4 (2026-09-04)
- Initiated and completed **Package D (Decision-Focused Parallel Research)**:
  - Directed research queries toward factual triage targets: creator identity, rights ownership, festival history, development stage, and fan traction.
  - Implemented hard-budget execution bounds: maximum 3 targeted Parallel Search calls and maximum 6 Parallel Extract page calls per run.
  - Synthesized structured `decisionBrief` fields: `whyInvestigate`, `materialUncertainty`, and `nextDiligenceStep`.
  - Verified with dedicated tests in `tests/unit/package-d.test.ts`.

- Initiated and completed **Package F (Parallel Monitor Repair & Signed Webhooks)**:
  - Implemented Standard Webhooks HMAC-SHA256 signature verification (`src/lib/webhooks/signature.ts`) supporting `svix-timestamp` and `svix-signature` headers with replay protection (5-minute tolerance).
  - Upgraded Parallel Monitor creation in `src/services/parallel-client.ts` to use contract v1 payload (`query`, `webhook_url`, `event_types`).
  - Implemented append-only Living Updates processing in `src/app/api/webhooks/parallel/route.ts`.

- Initiated and completed **Package E (Dual-Audience Scout Card UX & Hallmark Polish)**:
  - Built unified role-based toggle (Discover view for Fans vs Professional Brief view for Film Professionals) powered by a single shared canonical Scout Card.
  - Built `AudienceActionStrip` with fan actions (Follow Project, Add Community Take, Suggest Evidence, Share).
  - Built `PathwayVotingSection` with optimistic voting and local persistence.
  - Built accessible, keyboard-trapped `CitationDrawer` with deep-linking to source passages.
  - Implemented `ProfessionalBriefView` with 60-Second Triage, Stage & Availability Audit, Qualified Evidence Ledger, Pathway Matrix, and Source Ledger.
  - Added full print stylesheet (`@media print`) and responsive typography with WCAG AA compliance.

- Initiated and completed **Package G (Repair Optional Media & Audience Analysis - EI-4)**:
  - Neutralized Gothic horror/vampire fallbacks in `src/features/scout-card/data.ts`.
  - Re-architected `createFallbackTranscript` in `src/services/scout-brief/gemini-script-generator.ts` to strictly draw from card data without hardcoded Junichiro Kickstarter or 2D animation costs.
  - Added empty-beats notice in `src/features/scout-card/trailer-critic.tsx`.
  - Added `sampleSize` and `samplingLimitations` to `src/critic/audience-comment-analyzer.ts`.
  - Verified with 3 tests in `tests/unit/package-g.test.tsx`.

- Initiated and completed **Package H (Evaluation & Release Gate Verification - EI-3)**:
  - Reconciled *Junichiro Jackson* to its genuine Chicago source provenance (*Variety* trade report and *TeamTO* proof-of-concept animation `s8G7425lfKs`) in `firestore-repo.ts` with slug alias matching.
  - Replaced hardcoded unknowns in `ProfessionalBriefView`: dynamically derives status rows from verified evidence claims with source citations.
  - Added prerequisite identity gating for next diligence step when project identity is unresolved.
  - Added null-safe optional chaining across `industry-lens.tsx`.
  - Purged synthetic milestones in `src/services/re-scout-engine.ts`.
  - Verified with 5 tests in `tests/unit/package-h.test.tsx`.
  - Ran full test suite: **79 test files passed, 311 tests passed, 1 skipped**.
  - Ran production build: **All 46 routes built cleanly with zero type or lint errors**.
