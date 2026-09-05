# Audience Take — Production Scenarios Progress Log

Tracking implementation progress against `/Users/tarikmoody/Downloads/AUDIENCE_TAKE_PRODUCTION_SCENARIOS_PLAN.md`.

## 1. Dependency & Design Receipt (Package 1)

### Prerequisite Verification Matrix

| Prerequisite | Status | Verification Receipt |
| :--- | :--- | :--- |
| **Evidence & Claim Model** | **Verified** | `src/features/scout-card/data.ts` and `types.ts` enforce `supportsClaimIds`, `publishedAt`, `retrievedAt`, and excerpt support. No positional modulo citation assignment. Unprovenanced claims default to `inference` with `sourceIds: []`. |
| **Card Versioning & Corrections** | **Verified** | `cardVersionId` is stamped on all cards. `src/lib/trust/corrections.ts` tracks correction history. Saved scenarios bind to `cardVersionId` to detect stale evidence. |
| **Parallel Monitor & Runtime** | **Verified** | `src/services/parallel-client.ts` uses real Parallel Search & Extract with fallback/mock safety. Budget limits (max 3 searches, max 6 extracts) are strictly enforced. Fake active monitors removed. |
| **Audio Integrity & Versioning** | **Verified** | Audio briefs in `src/features/scout-brief/` and `src/services/scout-brief/` are bound to `cardVersionId` and `variant` (`discover` vs `pro`). Corrupted double RIFF headers eliminated (`contracts/audio-migration-manifest.json`). Missing audio truthfully returns HTTP 404. |

### Supported Adapter Scope

| Production Type | Status | Quantity & Rate Model | Qualification / Limitations |
| :--- | :--- | :--- | :--- |
| **2D Animation** | **Supported** | Fixed setup/asset creation + priced workload (per-minute or per-shot) + separately excluded finishing + explicit contingency | Technique complexity must be explicitly stated. Shared asset reuse discount must be justified, not assumed 100% free. No generic "action x 1.5" multipliers. |
| **Live Action** | **Supported** | Cast/crew day rates, equipment packages, location days, prep/wrap days, post-production line items | Shoot days cannot be inferred from runtime alone; requires schedule/shooting ratio input. Staffing tier and geography must be stated. |
| **Documentary** | **Supported** | Field production days, archival footage/music licensing units, edit duration (weeks), sound/color finishing | Short runtime does not imply short edit. Archival licensing scope must be explicitly quantified. |
| **3D Animation** | **Deferred** | Cost drivers & missing inputs only; **monetary rates explicitly withheld** | Never borrow 2D rates. Displays asset rigging, render farm, lighting, and pipeline drivers; prompts user for studio quotes. |
| **Stop-Motion** | **Deferred** | Cost drivers & missing inputs only; **monetary rates explicitly withheld** | Displays physical puppet fabrication, stage rental, frame-rate animation pacing drivers; prompts user for studio quotes. |
| **Unsupported Hybrids** | **Deferred** | Cost drivers & missing inputs only; **monetary rates explicitly withheld** | Prompts user to supply itemized quotes or separates into distinct component adapters. |

### Architecture & File Plan

- **Contracts & Types**: `src/features/production-scenarios/types.ts`, `src/features/production-scenarios/schema.ts`
- **Calculation Engine**: `src/services/production-scenarios/calculator.ts`
- **Domain Adapters**: `src/services/production-scenarios/adapters/` (`animation-2d.ts`, `live-action.ts`, `documentary.ts`, `unsupported.ts`)
- **Research & LLM Assist**: `src/services/production-scenarios/benchmark-service.ts`, `src/services/production-scenarios/gemini-explainer.ts`
- **Storage & Services**: `src/services/production-scenarios/store.ts`, `src/services/production-scenarios/service.ts`
- **UI Components**:
  - `src/features/production-scenarios/production-scenarios-section.tsx`
  - `src/features/production-scenarios/scenario-editor.tsx`
  - `src/features/production-scenarios/scenario-comparison.tsx`
  - `src/features/production-scenarios/scenario-inspection-drawer.tsx`
- **Integration**: Mount inside `src/features/scout-card/professional-brief-view.tsx`
- **API Routes**:
  - `src/app/api/projects/[projectId]/scenarios/route.ts`
  - `src/app/api/projects/[projectId]/scenarios/[scenarioId]/route.ts`
  - `src/app/api/projects/[projectId]/scenarios/research/route.ts`
- **Test Matrix**:
  - `tests/unit/production-scenarios/calculator.test.ts`
  - `tests/unit/production-scenarios/adapters.test.ts`
  - `tests/unit/production-scenarios/benchmark-service.test.ts`
  - `tests/unit/production-scenarios/gemini-explainer.test.ts`
  - `tests/unit/production-scenarios/acceptance-matrix.test.ts`

### Compact Wireframe (Existing Design System)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  PRODUCTION SCENARIOS                             Research basis: Aug 2026  │
│  Reported project budget: Not established (Kickstarter: $42,000 pledged)    │
├─────────────────────────────────────────────────────────────────────────────┤
│  [ Proof of Concept (2m) ]  [ Pilot Episode (11m) ]  [ Episodic Series (10x) ]│
│                                                                             │
│  Technique: 2D Animation (Digital Hand-Drawn)  ·  Location: US / Remote     │
│  Currency: USD ($)  ·  Price Date: Q3 2026                                  │
│                                                                             │
│  INDICATIVE PLANNING RANGE (Low — Base — High)                              │
│  $34,500 — $48,200 — $65,000   [ Mixed Basis: Sourced + User Assumed ]      │
│                                                                             │
│  TOP COST DRIVERS                                                           │
│  1. Keyframe Animation Workload (58% of direct)                             │
│  2. Character & Background Design Setup ($12,000 fixed)                     │
│  3. Post-Production Audio Mix & Finishing ($4,500)                          │
│                                                                             │
│  MATERIAL GAPS TO REFINE                                                    │
│  • Voice talent casting rate unconfirmed (assumed non-union SAG baseline)    │
│  • Music master licensing rights scope unverified                           │
│                                                                             │
│  [ Adjust Assumptions ]  [ View Calculation & Sources ]  [ Save Scenario ] │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implementation Checklist

- [x] **Package 1: Dependency and design receipt**
  - [x] Confirm earlier repairs and integration points
  - [x] Establish supported vs deferred adapter scope
  - [x] Map proposed files and architecture
  - [x] Compact wireframe adhering to Hallmark design
- [x] **Package 2: Contracts and calculator**
  - [x] Implement domain types and Zod schemas (`types.ts`, `schema.ts`)
  - [x] Implement decimal-safe, unit-aware calculator (`calculator.ts`)
  - [x] Implement adapters: 2D Animation, Live Action, Documentary, and Unsupported (withhold rates)
  - [x] Implement package double-counting detector and coverage validator
  - [x] Implement sensitivity analysis (single variable delta)
  - [x] Unit tests for arithmetic, fixtures, packages, and missing states
- [x] **Package 3: Benchmark evidence integration**
  - [x] Implement `BenchmarkSnapshot` contract with provenance, passage, currency, units, date
  - [x] Connect to bounded Parallel research client with strict query budgeting
  - [x] Implement Gemini candidate extraction and calculation explainer (`@google/genai`)
  - [x] Validate Gemini output against calculation manifest hash (prevent hallucinated numbers)
  - [x] Unit tests for research pipeline, candidate extraction, and stale evidence notices
- [x] **Package 4: Professional UI and persistence**
  - [x] Build `ProductionScenariosSection` component in Professional brief
  - [x] Progressive assumption editor with input provenance tags (Reported, Sourced, User-Assumed)
  - [x] Case comparison view (up to 3 options side-by-side, no commercial ranking)
  - [x] Inspection drawer showing exact formulas, line items, and source citations
  - [x] Stale evidence notice when underlying `cardVersionId` changes
  - [x] Implement Firestore private scenario store and API endpoints
  - [x] Server-side recalculation before saving to enforce integrity
- [x] **Package 5: Evaluation and release**
  - [x] Execute 14-point acceptance matrix test suite (`tests/unit/production-scenarios/acceptance-matrix.test.ts`)
  - [x] Feature flag configuration (`NEXT_PUBLIC_ENABLE_PRODUCTION_SCENARIOS`)
  - [x] Verification with real project card (`junichiro-jackson-and-the-vampair`)
  - [x] Plain-English inspection and release verification report

---

## 3. Verification & Acceptance Receipts

### Section 10 Acceptance Criteria Matrix

| Criterion | Requirement | Status | Verification Receipt |
| :--- | :--- | :--- | :--- |
| **1. Distinct Budget vs Indicative Scenario** | Kickstarter pledges or reported budgets are separated from planning scenarios | **Verified** | `acceptance-matrix.test.ts` Criterion 1: Reported budget states Kickstarter $42,000 pledged, while indicative scenario range ($34,500 - $65,000) is labeled planning cases with disclaimer. |
| **2. Mandatory Arithmetic Fixture** | Setup $10k, Workload 2x$5k, Finishing $3k, Contingency 10% = $25,300 (1 unit) and $36,300 (4 units) | **Verified** | `acceptance-matrix.test.ts` Criterion 2: Calculator produces exact cents $25,300.00 and $36,300.00 with zero drift. |
| **3. Technique Rate Isolation** | 3D, Stop-motion, and Hybrids do not borrow 2D animation rates | **Verified** | `acceptance-matrix.test.ts` Criterion 3: Unsupported adapters explicitly withhold rates (`directCost: null`), display qualitative cost drivers, and do not inherit 2D rates. |
| **4. Live-Action Shoot Days** | Cannot be inferred from runtime alone; requires explicit days or marks missing | **Verified** | `acceptance-matrix.test.ts` Criterion 4: Omission of shoot days sets `status: "missing_inputs"` with `directCost: null`. |
| **5. Documentary Edit Weeks** | Short runtime does not force low edit duration; requires explicit edit weeks | **Verified** | `acceptance-matrix.test.ts` Criterion 5: Edit duration is independent of runtime; missing edit weeks yields incomplete scenario. |
| **6. Package Overlap Suppression** | All-inclusive packages suppress itemized duplicates to prevent double-counting | **Verified** | `acceptance-matrix.test.ts` Criterion 6: Package covering finishing suppresses itemized sound and color lines, totaling $19,800 instead of $26,400. |
| **7. Multi-Unit Asset Reuse** | Shared setup assets cannot be 100% free across episodes without justification | **Verified** | `acceptance-matrix.test.ts` Criterion 7: Asset reuse discount is capped at 40% ($12,000 setup across 5 episodes yields $60,000 minus $24,000 = $36,000). |
| **8. Display Rounding with Exact Internals** | Calculations preserve cents; display rounds to nearest $100 | **Verified** | `acceptance-matrix.test.ts` Criterion 8: Internal exact cents $34,545.67 calculates display string "$34,500" without accumulating compounding errors. |
| **9. Parallel Search & Extract Limits** | Max 2 search queries, max 4 extracted pages per research run | **Verified** | `acceptance-matrix.test.ts` Criterion 9: Bounded benchmark search strictly enforces budget ceiling. |
| **10. Truthful Research Failure** | Provider failure yields empty candidates without fabricated benchmark rates | **Verified** | `acceptance-matrix.test.ts` Criterion 10: Network failure returns empty candidates array, truthful error warning, and never invents synthetic rates. |
| **11. Card Version Stale Invalidation** | Card version increment invalidates saved scenario until refreshed or re-saved | **Verified** | `acceptance-matrix.test.ts` Criterion 11: Updating card from `v1` to `v2` flags scenario as `isStale: true`. |
| **12. Server-Side Recalculation** | Saving scenario recalculates totals on server; client cannot submit altered sums | **Verified** | `acceptance-matrix.test.ts` Criterion 12: Server recomputes manifest hash and totals, overwriting tampered client values. |
| **13. Anti-Hallucination Number Guard** | LLM explainer rejects text containing monetary figures absent from calculation manifest | **Verified** | `acceptance-matrix.test.ts` Criterion 13: Rogue figure "$850,000" causes validation error and automatic fallback to deterministic templated explanation. |
| **14. Sensitivity Single-Variable Delta** | Sensitivity check tests one assumption in isolation and shows delta | **Verified** | `acceptance-matrix.test.ts` Criterion 14: Adjusting keyframe rate from $4,000 to $5,000 shifts base case from $48,200 to $50,400 (delta: +$2,200). |

### Test Suite Execution Receipt
- **Command**: `npx vitest run`
- **Result**: `85 passed (85 test files), 354 passed | 1 skipped (355 tests)`
- **Duration**: `60.67s`

### Build Verification Receipt
- **Command**: `npm run build`
- **Result**: Next.js 15.5.24 compiled successfully, static/dynamic route collection completed without errors (including `/api/projects/[projectId]/scenarios` and `/api/projects/[projectId]/scenarios/research`).

