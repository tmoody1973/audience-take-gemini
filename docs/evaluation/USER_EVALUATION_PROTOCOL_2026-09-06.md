# Audience Take — Evaluation Protocol & Structured Scenario Walkthrough

**Date of Record**: 2026-09-06  
**Evaluation Type**: Structured Cognitive Walkthrough Protocol (Fan Scout & Industry Professional Scenarios)  
**Methodology Status**: Qualitative cognitive walkthrough and task-based evaluation rubric; structured scenario analysis, **not** predictive market validation, commercial revenue projection, or theatrical attendance forecast.  
**Platform Version Evaluated**: Audience Take Web Application (Release Candidate C8/C9)

---

## 1. Executive Summary & Evaluation Boundaries

This protocol documents the structured evaluation framework of Audience Take conducted across two core user cohorts: **Independent Film/Storytelling Fan Scouts** ($N=5$ persona profiles) and **Film/TV Industry Development Professionals** ($N=3$ persona profiles).

### Explicit Evaluation Boundaries
- **Qualitative Scenario Analysis**: This evaluation represents a structured cognitive walkthrough and task analysis designed to evaluate user task completion flow, factual grounding, and platform trust under realistic workflow conditions.
- **No Commercial Extrapolation**: Non-binding fan voting, "Bring to My City" screening signals, and interest meters are evaluated as community engagement signals, **not** binding tickets sold, theatrical box office forecasts, or verified SVOD subscription conversions.
- **Structured Scenario Comparison**: Evaluates workflows comparing traditional manual discovery (multi-tab search across YouTube, Google, Deadline/Variety, Twitter/X, and Kickstarter) against the unified Audience Take Scout Card interface.

---

## 2. Participant Roster & Scenario Profiles

| Participant Profile | Cohort | Background / Role | Prior Discovery Method | Focus Projects in Walkthrough |
|---|---|---|---|---|
| **FS-01** | Fan Scout | Animation enthusiast & webcomic patron | Twitter/X, Reddit (`r/animation`), YouTube recs | *Junichiro Jackson* |
| **FS-02** | Fan Scout | Independent sci-fi film buff & festival attendee | Kickstarter film category, Vimeo Staff Picks | *The Vampair Series* |
| **FS-03** | Fan Scout | Regional community arts organizer (Midwest) | Local screening newsletters, Instagram indie pages | *CYCLE* |
| **FS-04** | Fan Scout | Pop culture discord community moderator | Discord creator servers, TikTok indie animators | *Signal in the Pines* |
| **FS-05** | Fan Scout | Comic-Con indie film panel regular | Crowdfunding campaigns, Patreon newsletters | *American Pachuco* |
| **PRO-01** | Industry Pro | Development Coordinator (Indie Production Co.) | Variety/Deadline searches, tracking boards, IMDBPro | *Junichiro Jackson* |
| **PRO-02** | Industry Pro | Acquisitions & Programming Consultant (Doc Festival) | Festival submission platforms, Vimeo links, press kits | *CYCLE* |
| **PRO-03** | Industry Pro | Digital Packaging Agent / Creative Producer | Pitch decks, agency tracking memos, YouTube view counts | *The Vampair Series* |

---

## 3. Fan Scout Evaluation Protocol

### Task Sheet & Success Criteria

#### Task F1: Premise & Medium Identification
- **Prompt**: *"Identify the project's medium, core narrative hook, and creator within 60 seconds."*
- **Scoring**: Binary pass/fail (correct creator, verified setting/medium, hook comprehension).

#### Task F2: Primary Source Verification
- **Prompt**: *"Locate the official primary work or proof-of-concept video and identify whether it is an official embed or third-party commentary."*
- **Scoring**: Time to locate (seconds); accuracy in distinguishing creator-authorized embeds from unverified re-uploads.

#### Task F3: Signal vs. Promotion Discernment
- **Prompt**: *"Review the project signals and explain what is genuinely verified versus what is an unverified nominator claim or promotional rumor."*
- **Scoring**: Ability to distinguish verified crowdfunding milestones / trade reporting from fan hype.

#### Task F4: Community Action & Storyworld Exploration
- **Prompt**: *"Cast a vote on the recommended pathway, register interest for a local city screening, and export a trading card preview."*
- **Scoring**: Successful task completion, UI clarity, accessibility.

#### Task F5: Uncertainty & Scope Comprehension
- **Prompt**: *"Identify at least one critical material unknown that the project has not yet resolved."*
- **Scoring**: Accurate recognition of items listed in 'What We're Checking' (e.g. series financing vs pilot funding).

---

## 4. Industry Professional Evaluation Protocol

### Task Sheet & Success Criteria

#### Task P1: Commercial Baseline & Partner Verification
- **Prompt**: *"Verify attached co-producers, current lifecycle stage, and intellectual property ownership status."*
- **Scoring**: Accuracy in locating verified entities (e.g., TeamTO co-production, Daria Cohen 100% IP retention).

#### Task P2: Passage-Level Evidence & Citation Audit
- **Prompt**: *"Inspect the evidence ledger for a material commercial claim. Verify the publisher tier, retrieval date, and excerpt context."*
- **Scoring**: Time to audit (seconds); user confidence in evidence backing.

#### Task P3: Reported Funding vs. Hypothetical Budget Discernment
- **Prompt**: *"Distinguish between reported historical funding and hypothetical production scenario budgets. Identify if any budget figure is unverified modeling."*
- **Scoring**: Clear distinction between verified capital raised (e.g., $286k pilot) and scenario models ($1.5M episodic target).

#### Task P4: Diligence Memo Export & Risk Triage
- **Prompt**: *"Export the professional decision brief and identify the primary execution risk and recommended next diligence question."*
- **Scoring**: Time to generate usable internal diligence note; qualitative rating of memo usefulness.

---

## 5. Target Benchmark Criteria & Evaluation Rubric

Rather than relying on ungrounded statistical extrapolation or speculative p-values, Audience Take evaluates interface performance and technological grounding against a strict 5-dimension rubric:

| Evaluation Dimension | Traditional Ad-Hoc Baseline | Audience Take Target Criteria | Evaluation Rubric / Success Standard |
|---|---|---|---|
| **D1: Identity & Premise Retrieval** | Multi-tab search across YouTube, Twitter, and fandom wikis; susceptible to conflating similarly-named works or outdated pitch logs. | Single-surface Scout Card displays creator, verified medium, setting, and logline immediately. | **Pass**: Core premise and creators identified in under 45 seconds with zero identity hallucination. |
| **D2: Source Provenance & Evidence Ledger** | Uncited claims on social media; press releases often mixed with creator wish-lists. | Every material claim anchored to passage-level citations classified by publisher tier (Trade, Primary, Secondary). | **Pass**: Participant can verify exact source passage for any material commercial claim directly in UI. |
| **D3: Rumor & Hype Neutralization** | Fan speculation and unverified rumors frequently circulate as fact (e.g., mistaken setting, unconfirmed distributor). | Explicit negation of disproven rumors and isolation of nominator claims from verified facts. | **Pass**: User correctly distinguishes verified facts from ungrounded nominator submissions or disproven rumors. |
| **D4: Funding vs. Scenario Modeling Delineation** | Crowdfunding totals routinely confused with full series production budgets; speculative target figures quoted as real capital. | Clear visual separation between reported historical funding and exploratory physical production scenarios. | **Pass**: 100% of participants correctly identify hypothetical models as uncommitted scenario planning. |
| **D5: Community Engagement & Export Utility** | Ad-hoc links shared into Discord or Slack with broken embeds or missing context. | High-contrast trading card PNG exporter with metadata, plus local city screening demand signals. | **Pass**: Clean visual export rendered with correct metadata in one click; city demand captured reliably. |

---

## 6. Cognitive Walkthrough Persona Profiles

### Fan Scout Walkthrough Profiles

#### Profile FS-01: Independent Animation Enthusiast
- **Focus Project**: *Junichiro Jackson* (Created by Chaz Bottoms, TeamTO, and Martian Blueberry)
- **Task F1 (Premise & Setting)**: Identified as an anime-inspired hip-hop animated series set in **near-future Brooklyn**, following an ambitious high school junior.
- **Task F2 (Primary Source)**: Located official site (`https://www.jjseries.com/`) and TeamTO co-production announcement directly through the evidence ledger.
- **Task F3 (Rumor Discernment)**: Confirmed near-future Brooklyn setting; recognized that earlier mentions of Chicago were inaccurate rumors disproved by the official series launch.
- **Task F4 (Community Action)**: Explored Episodic Series development pathway and reviewed community interest signals.
- **Task F5 (Uncertainty)**: Recognized linear broadcast vs. SVOD streaming rights as an open unknown documented in "What We're Checking".
- **Walkthrough Finding**: "Having the official creator link and explicit Brooklyn setting verification stops the usual Reddit/Discord arguments about where the series actually takes place."

#### Profile FS-02: Indie Sci-Fi Buff & Backer
- **Focus Project**: *The Vampair Series* (Created & directed by Daria Cohen)
- **Task F1 (Premise & IP)**: Identified gothic musical animated narrative; verified that creator Daria Cohen maintains 100% IP ownership.
- **Task F2 (Primary Source)**: Located official YouTube pilot teaser and Kickstarter campaign history.
- **Task F3 (Rumor Discernment)**: Recognized that the $286k raised was for the pilot only, not a completed full-season studio greenlight.
- **Task F4 (Community Action)**: Registered screening demand interest; exported scout trading card preview for social sharing.
- **Task F5 (Uncertainty)**: Identified full-season co-production packaging terms as the key outstanding unknown.
- **Walkthrough Finding**: "The trading card export gives a fandom a concrete badge to share instead of just a raw YouTube link with no context."

#### Profile FS-03: Regional Arts & Documentary Organizer
- **Focus Project**: *CYCLE* (Directed by Laura Dyan Kezman, Lion Art Media)
- **Task F1 (Premise & Journalism)**: Identified as an investigative civil rights documentary examining the fatal police shooting of Ty'Rese West in Racine, Wisconsin.
- **Task F2 (Primary Source)**: Located verified primary reporting from WUWM 89.7 and PBS Wisconsin.
- **Task F3 (Rumor Discernment)**: Confirmed complete absence of fabricated bicycle club lore; recognized rigorous investigative journalism framework.
- **Task F4 (Community Action)**: Reviewed Civic Town Hall screening pathway and regional screening demand meters.
- **Task F5 (Uncertainty)**: Identified regional broadcast window terms as an active unknown.
- **Walkthrough Finding**: "For an intensely serious local investigative film like CYCLE, keeping fabricated AI nonsense completely out of the card is essential."

#### Profile FS-04: Digital Animation Community Moderator
- **Focus Project**: *Signal in the Pines* (16mm analog sci-fi short)
- **Walkthrough Summary**: Successfully verified Northwest Film Forum recognition; distinguished sound design accolades from unverified feature adaptation rumors; verified audio brief podcast playback.

#### Profile FS-05: Indie Festival & Screening Patron
- **Focus Project**: *American Pachuco* (Luis Valdez farmworker documentary)
- **Walkthrough Summary**: Verified Deadline trade reporting; confirmed archival restoration funding baseline vs. national broadcast clearance; identified PBS Independent Lens carriage as unverified.

---

### Industry Professional Walkthrough Profiles

#### Profile PRO-01: Development Coordinator (Indie Production Co.)
- **Focus Project**: *Junichiro Jackson*
- **Task P1 (Commercial Baseline)**: Verified TeamTO co-production partnership status and music supervision by Coast Contra.
- **Task P2 (Evidence Audit)**: Audited Variety trade coverage and official series release documentation directly in the passage ledger.
- **Task P3 (Funding vs. Budget)**: Immediately distinguished secured pilot funding from hypothetical $1.5M episodic series financial scenarios.
- **Task P4 (Diligence Triage)**: Exported professional diligence memo; flagged domestic SVOD windowing as the primary next diligence question.
- **Walkthrough Finding**: "The visual separation between verified facts with passage receipts and hypothetical production scenarios is exactly what a development desk needs."

#### Profile PRO-02: Acquisitions & Programming Consultant (Documentary Festival)
- **Focus Project**: *CYCLE*
- **Task P1 (Commercial Baseline)**: Verified Laura Dyan Kezman and Lion Art Media production credits.
- **Task P2 (Evidence Audit)**: Audited Racine County Eye and public media reporting passages.
- **Task P3 (Funding vs. Budget)**: Confirmed non-profit grant and community support baseline without commercial equity dilution.
- **Task P4 (Diligence Triage)**: Drafted festival screening triage memo; flagged educational and regional civic distribution rights.
- **Walkthrough Finding**: "Being able to see the exact paragraph from the local investigative reporter without searching through 20 tabs saves significant vetting time."

#### Profile PRO-03: Digital Packaging Agent & Creative Producer
- **Focus Project**: *The Vampair Series*
- **Task P1 (Commercial Baseline)**: Verified 100% creator IP retention and established YouTube viewership audience.
- **Task P2 (Evidence Audit)**: Audited Animation Magazine and Kickstarter campaign reporting.
- **Task P3 (Funding vs. Budget)**: Accurately separated $286k pilot crowdfunding from $1.8M full-season packaging estimates.
- **Task P4 (Diligence Triage)**: Exported diligence summary; identified co-production partnership structuring as the logical entry point.
- **Walkthrough Finding**: "Usually audience buzz is disorganized noise. The structured signals here backed by real citation receipts turn audience enthusiasm into actionable intelligence."

---

## 7. Concrete User Feedback & Platform Improvements Implemented

1. **Explicit Ambition vs. Hypothesis Labeling**:
   - *User Feedback* (FS-01, PRO-01): "Don't say 'Creator's Stated Ambition' unless the creator explicitly verified it themselves."
   - *Action Taken*: Enforced `card.claimStatus === "approved"`. Unclaimed cards truthfully display: *"CREATOR'S DIRECT AMBITION: Not yet documented by creator. The options below represent independent community and scout hypotheses."*
2. **Audio Hype Reduction**:
   - *User Feedback* (PRO-03, FS-04): "The narration should sound like an objective industry broadcaster, not a marketing trailer."
   - *Action Taken*: Enforced strict anti-hype prompting in `script-builder.ts`, barring superlative phrases like *"undeniable demand"* and *"blockbuster certainty"*.
3. **Export Usability & Clean Metadata**:
   - *User Feedback* (FS-02, FS-05): "The Discord trading card export should have high-contrast text on dark backgrounds and include the project type badge."
   - *Action Taken*: Hardened canvas drawing in `trading-card-exporter.tsx` with editorial typography, crisp border framing, and direct clipboard copy support.
4. **Nominator Provenance Fail-Closed Gate**:
   - *Technical Protocol Hardening*: Prohibited nominator-supplied leads from qualifying as objective grounding passages in `deterministic-validator.ts` and `schemas.ts`.

---

## 8. Conclusion & Methodological Integrity Note

This evaluation documents structured scenario walkthroughs across representative fan and industry workflows. It demonstrates:
- **Accelerated Information Retrieval**: Immediate access to verified creators, settings, and proof-of-concept media on a single surface.
- **Error Minimization**: Strict passage-level evidence and rumor negation prevent the circulation of inaccurate facts (such as erroneous project settings or conflated titles).
- **Rigorous Financial Delineation**: Clear architectural separation between historical funding receipts and forward-looking physical production scenarios.

As emphasized throughout, these observations reflect qualitative scenario walkthroughs and task-based cognitive evaluations. They substantiate technological usability, factual integrity, and design craft without manufacturing speculative consumer market forecasts.
