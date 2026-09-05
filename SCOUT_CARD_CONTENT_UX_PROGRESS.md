# Audience Take — Scout Card Content & Audience UX Progress Log

Tracking implementation against `/Users/tarikmoody/Downloads/ANTIGRAVITY_SCOUT_CARD_CONTENT_UX_PROMPT.md`.

## 1. Recommendation Classification Matrix

| Recommendation | Classification | Current State / Verification Note |
| :--- | :--- | :--- |
| **1. Dual presentation (Discover + Professional brief)** | **Completed** | Dual-view toggle (`Discover` vs `Professional Brief`) exists with deep-linkable `?view=` URL param and keyboard arrow navigation. |
| **2. Single shared evidence record** | **Completed** | Canonical `ScoutCard` model with single `cardVersionId` and shared `sourceLedger` powers both views without diverging facts. |
| **3. Remove forced 3-pathway constraint (support 1–3)** | **Completed** | Relaxed schemas (`data.ts`, `domain/schemas.ts`, `domain/index.ts`), validators (`deterministic-validator.ts`), and UI (`scout-card.tsx`, `professional-brief-view.tsx`) to `min(1).max(3)`. Verified with unit tests. |
| **4. Replace "Why should it grow?" with "What should happen next?"** | **Completed** | Updated `PathwayVotingSection`, `ScoutSocialPanel`, and Take editor to "What should happen next?" with non-expansion/screening options supported. |
| **5. Present creator's stated ambition before AI alternatives** | **Completed** | `PathwayVotingSection` displays creator's stated ambition first, or explicitly notes if undocumented before presenting scout hypotheses. |
| **6. Remove mystery scores (Audience Heat & Market Viability 0-100)** | **Completed** | Removed arbitrary 0–100 score cells from `ProjectHeader` while retaining evidence and structure status badges. |
| **7. Clean up Discover view layout around 6 core questions** | **Completed** | Restructured Discover view in exact order: 1. What is this? 2. What can I watch now? 3. Why did someone notice it? 4. How can I participate? 5. What happens next? 6. Where can I learn more? (progressive disclosure). |
| **8. Rename Trailer Critic to Creative Notes with AI disclosure** | **Completed** | Component renamed to "Creative notes" with explicit AI interpretation disclosure and sampled audiovisual analysis limitations. |
| **9. Simplify native participation & remove zero walls** | **Completed** | Added structured Take button in action strip, clarified native interest signals, and eliminated misleading zero-wall blocks. |
| **10. Explain Follow benefit concretely** | **Completed** | Added explicit badge & notice: "Following alerts you to verified updates and release milestones · Audience signals remain non-commercial". |
| **11. Clarify "Bring to my city" and "I would pay"** | **Completed** | Disclaimed that city signal is an expression of interest (not authorized tour/booking), and payment is non-binding intent (not a commercial transaction). |
| **12. Remove internal schema completeness & artifact IDs from copy** | **Completed** | Cleaned up primary headers and banners to remove raw schema chips and internal artifact hashes. |
| **13. Keep Production Scenarios specialist & non-invasive** | **Completed** | Production Scenarios remains scoped to Professional brief as an expandable tool, bound to manifest hash with separate private scenario storage. |
| **14. Keep audio player compact & versioned** | **Completed** | Repaired `ScoutBriefPlayer` uses canonical `cardVersionId` and separate `discover` vs `pro` scripts with human-readable source titles and ±15s seeking. |
| **15. Professional brief lead structure (5 elements)** | **Completed** | Leads with 60s Triage, Stage & Availability Audit, Production Scenarios, Deduplicated Pathways (shared prerequisites/limitations shown once), and Evidence Ledger. Next diligence step begins with action verb. |

---

## 2. Implementation Packages

- [x] **Package A: Shared Editorial Contracts & Variable Pathway Relaxation**
  - [x] Relax `pathways` schema from strict `3` to `min(1).max(3)` in `src/features/scout-card/data.ts`
  - [x] Update domain schema in `src/domain/schemas.ts` and `src/domain/index.ts`
  - [x] Update deterministic validator in `src/agent/deterministic-validator.ts` and runner in `src/agent/agent-runner.ts`
  - [x] Remove `length !== 3` runtime check in `src/features/scout-card/scout-card.tsx`
  - [x] Update unit tests verifying 1, 2, or 3 pathways are valid (`tests/unit/package-e.test.tsx`)
- [x] **Package B: Discover View Editorial Hierarchy (6 Questions)**
  - [x] Remove mystery score cells (`AUDIENCE HEAT`, `MARKET VIABILITY`) from `ProjectHeader`
  - [x] Add creator attribution (`card.creatorContext.displayName`) and actual work status to header
  - [x] Enhance media section with clear asset label (distinguishing available teaser/poc from target format)
  - [x] Surface nominator reason and scout attribution from `card.provenance`
  - [x] Reorganize Discover view structure: What is this -> What can I watch -> Why noticed -> Participate -> What happens next -> Learn more
- [x] **Package C: Participation, Creative Notes & Professional Deduplication**
  - [x] Update `PathwayVotingSection`: "What should happen next?" with inclusive options (screenings, recognition)
  - [x] Update `AudienceActionStrip` & social panel: clear Follow benefits, honest non-zero phrasing, transparent city interest disclaimer
  - [x] Rename Trailer Critic to "Creative notes" with AI interpretation and media sample disclosure
  - [x] In `ProfessionalBriefView`, deduplicate pathway comparison cards (share common limitations once)
  - [x] Ensure next diligence step in pro brief uses actionable verb + object + prerequisites
- [x] **Package D: Regression, Accessibility & Visual Verification**
  - [x] Full test suite execution across all test files (85/85 test files, 355/355 tests passed)
  - [x] Next.js production build (`npm run build`, 48/48 routes compiled cleanly)
  - [ ] Capture desktop and mobile before/after screenshots
  - [ ] Deploy to Cloud Run and verify live endpoints
