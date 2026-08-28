# Audience Take — Product and Feature Inventorynpx skills add parallel-web/parallel-agent-skills --all --global

**Snapshot date:** August 28, 2026  
**Repository:** `tmoody1973/audiencetake`  
**Public application:** <https://audiencetake.vercel.app>  
**Purpose:** Historical reference describing what has been designed, implemented, tested, deployed, demonstrated, or deferred as of the snapshot date.

> **Development-provenance and hackathon-use warning**
>
> This is a Codex-assisted historical record of the existing Audience Take implementation. Codex also provided coding assistance during development. The Agentic Cinema hackathon organizer has stated that only Gemini CLI, Gemini Code Assist, or Google's AntiGravity suite may provide coding assistance throughout the development workflow. Therefore, do **not** copy this document, its technical implementation details, or the existing code into a purported clean hackathon rebuild unless the organizer explicitly confirms that doing so is permitted. The existing project must not be represented as compliant with that tooling rule without a written organizer ruling.

## 1. Status legend

| Status | Meaning |
| --- | --- |
| **Live / production-verified** | The feature or artifact was recorded as deployed and checked on the public application or production backend. |
| **Implemented / repository** | The feature exists in the current repository and has test coverage, but this document does not claim that every part is active in the current production environment. |
| **Local only / not deployed** | The change exists in the current working tree and passed local verification, but has not been deployed. |
| **Demo / fallback** | A clearly labeled demonstration, preview, seed, or saved fallback rather than proof of a live provider result. |
| **Planned / deferred** | Product direction recorded in requirements or planning, but not implemented. |

Production state can change independently of this dated document. Queue state, feature flags, Firebase console settings, Vercel environment variables, and cloud revisions require a fresh live check before making a current operational claim.

## 2. What Audience Take is

Audience Take is a fan-first social scouting platform for overlooked films, series, documentaries, shorts, proof-of-concept videos, and creator projects. A fan or creator begins with a public project URL. A research workflow builds an evidence-linked Scout Card, while the audience can express demand and discuss the project without turning the page into an opaque popularity score.

The product serves four main groups:

- **Fan scouts** discover projects, nominate public work, inspect evidence, follow projects, make commitments, vote on pathways, and publish structured Takes.
- **Creators** can submit work, request a verified claim, publish creator updates after approval, and receive audience signals without being allowed to rewrite research evidence.
- **Industry readers** get a decision brief, provenance, risks, bounded pathway hypotheses, comparables, and evidence limitations.
- **Public visitors** can browse the Scouting Wall and published Scout Cards without signing in.

The editorial direction is a film-festival program crossed with an underground magazine: high-contrast, evidence-forward, and intentionally different from a generic SaaS dashboard. Fans encounter the Audience Pulse before the more professional Industry Lens.

## 3. End-to-end product journey

1. A visitor finds a public project, campaign, trailer, creator page, or proof-of-concept.
2. A signed-in fan or creator submits the public project URL, an optional YouTube video, a reason the work should grow, and up to five supporting links.
3. The server authenticates the person, validates App Check in production, rate-limits the request, canonicalizes URLs, blocks unsafe network targets, checks for duplicates, and creates the project, nomination, and research run atomically.
4. A deterministic Cloud Task invokes the private Google ADK research service on Cloud Run.
5. The six-stage Scout Agent reads the submitted source, maps story and creator context, runs one bounded Parallel Search batch, qualifies evidence, creates three project-native pathway hypotheses, and publishes an immutable Scout Card.
6. The public research page reports persisted stage progress and safe receipts. It never displays hidden reasoning or raw model output.
7. The finished card appears on the Scouting Wall and exposes its source media, evidence brief, pathways, decision brief, Audience Pulse, Industry Lens, Trailer Critic when available, and trust controls.
8. Later community evidence, creator updates, reports, and corrections go through separate review and immutable history paths rather than silently rewriting the original research.

## 4. Public website and navigation

| Capability | Status | Notes |
| --- | --- | --- |
| Marketing home page | **Implemented / repository** | Explains the mission, the three-step flow, and provides nomination and Scouting Wall entry points. The featured Junichiro selection is static editorial demonstration content. |
| Scouting Wall at `/projects` | **Live / production-verified** | Dynamic catalog of moderation-clear, published Scout Cards; newest items first. Each wall card shows project type, evidence state, completeness, source count, claim state, three pathway labels, and an organic Audience Pulse strip. |
| Scout Card at `/projects/[slug]` | **Live / production-verified** | Loads the immutable current card through the project's trusted pointer and fails closed for unpublished, moderated, invalid, or pointer-mismatched data. |
| Research progress at `/research/[runId]` | **Implemented / repository** | Shows the six persisted stages, ordered public receipts, partial/failed messaging, retry eligibility, and the published card destination. |
| Public Scout profile at `/scouts/[handle]` | **Implemented / repository** | Displays profile identity, picks, optionally public follows/commitments, and published Takes. |
| Creator management at `/projects/[slug]/manage` | **Implemented / repository** | Approved project creators can publish, edit, or withdraw creator updates and attach a validated image. |
| Claim receipt at `/claims/[claimId]` | **Implemented / repository** | Gives the requester a private view of a creator-claim request and its status. |
| Responsive header and signed-in state | **Implemented / repository** | Shows navigation, authenticated account state, sign-out, and safe return-to behavior. |
| Search | **Planned / deferred** | A search label appears in the visual language, but there is no complete searchable catalog experience. |
| Scouting Wall pagination/filtering | **Planned / deferred** | The loader bounds its query and display; there are no public pagination or filtering controls yet. |

## 5. Authentication and participation access

- Firebase Authentication supports email/password sign-in and account creation.
- Google popup sign-in is implemented behind `NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED === "true"`; it also depends on the Firebase Google provider and authorized production domain being configured correctly.
- The sign-in flow validates a safe internal return destination, then returns the person to the page that required participation.
- Public browsing does not require an account. Consequential actions—nominations, follows, commitments, votes, Takes, replies, evidence suggestions, claims, creator updates, uploads, and reports—use authenticated server routes.
- Production command routes verify Firebase ID tokens and App Check tokens; production code cannot silently turn App Check enforcement off.
- The repository contains a profile GET/PUT route, but a complete profile onboarding/editor interface has not been built.

## 6. Nomination experience and intake

### Fan-facing form

- Choose **Nominate a Project** or **Submit My Project**; provenance is kept distinct.
- Required public project or campaign URL.
- Optional separate YouTube trailer or proof-of-concept URL for the Scout Card player.
- Required 20–600 character explanation of why the project should grow.
- Optional “what could it become?” and intended-audience notes.
- Up to five optional fan-supplied supporting links.
- Creator declaration when submitting one's own project; this labels provenance but does not grant creator control.
- Review-before-submit screen.
- Failed submission preserves the entered nomination and presents an actionable error.
- A YouTube project URL can serve both as the submitted source and media; a matching optional media/supporting link is deduplicated.
- A non-YouTube campaign such as Kickstarter can remain the research/provenance source while a separate YouTube URL provides the embedded video.

### Server-side intake and safety

- Strict request contracts and a 16 KB JSON request-body ceiling.
- Firebase Authentication and App Check verification.
- Per-account and trusted-IP burst/daily rate limiting.
- URL canonicalization, tracking-parameter removal, and deterministic SHA-256 fingerprints.
- Protocol, credential, port, DNS, private-network, redirect, response-size, and content-type checks.
- Every redirect target is revalidated. A later correction preserves the original source path while checking redirects, fixing the CYCLE nomination's redirect-loop failure mode.
- Transactional duplicate detection across canonical nominations.
- Atomic creation of nomination, project shell, research run, public run projection, and private ownership records.
- Deterministic Cloud Task dispatch with a durable retryable dispatch-failure state.
- Supporting links remain `community_lead` records and do not become verified evidence merely because a fan submitted them.

## 7. Six-stage Scout Agent

The Scout Agent is a private Google ADK service. Its inspectable `SequentialAgent` graph mirrors the workflow, while the orchestrator and Firestore stage records provide the durable execution boundary.

| Stage | Function | Main safeguards |
| --- | --- | --- |
| **1. Source intake** | Reads the bounded submitted public source. | SSRF/DNS-rebinding defense, redirect rechecks, vetted IP pinning, 2 MB wire cap, 32,000-character model projection, bounded content types and timeout. |
| **2. Source and story analysis** | Gemini maps the work, story, creator context, medium, form, and lifecycle. | Separates directly observed material from assertions; uses strict structured output. |
| **3. Public research** | Gemini plans 2–3 queries and the Web Researcher makes exactly one bounded Parallel Search batch. | One tool owner, no open-ended search loop, at most 10 results, 12,000 total characters, normalized provenance receipt. |
| **4. Evidence editing** | Gemini drafts evidence; the deterministic Evidence Editor qualifies claims, comparables, and external signals. | Exact source IDs, explicit qualification, no external signal promoted into native activity, no unsupported platform-interest claims. |
| **5. Pathway hypotheses** | Produces exactly three evidence-linked, project-native directions. | Distinct bounded strategies, medium compatibility, qualified support required for any cross-format adaptation, exact known claim/source IDs. |
| **6. Publication** | Deterministically assembles and atomically publishes the Scout Card and its related artifacts. | No redundant card-generation model call, immutable version IDs, attempt-scoped decisions, idempotent replay, complete/partial/failed policy. |

Additional behavior:

- Research uses the pinned `gemini-3.5-flash` model.
- Structured-output collection accepts only the target agent's final response and classifies token exhaustion before JSON parsing.
- Fixed identities, IDs, order, project medium, and policy values are injected by application code rather than invented by the model.
- Completed stages are reused after interruption, so continuation does not repeat earlier Gemini or Parallel work.
- Cloud Tasks retries with `retry_count > 0` are suppressed before provider clients are constructed.
- Safe logs and public receipts exclude prompts, raw model text, secrets, authorization values, and chain-of-thought.

## 8. Scout Card experience

The Scout Card is an immutable, versioned, public research artifact rather than a mutable profile page.

### Identity and evidence framing

- Accession/card ID, publication time, research version, completeness, and evidence state.
- Fan-nominated versus creator-submitted provenance.
- Creator claim state without allowing unverified ownership to overwrite the research.
- Project title, hook, medium/form profile, and explicit source limitations.
- Separate structural completeness and evidence strength; no opaque “greenlight score.”

### Source media

- Full-width responsive `16:9` YouTube presentation in the media column.
- Privacy-enhanced YouTube embeds with no autoplay.
- Accessible carousel for up to five deduplicated, reviewed YouTube sources.
- Per-source title, role, tier, verification state, and external link.
- Honest image, unavailable-media, saved-fallback, and no-media states.
- Audience Take embeds public media; it does not claim to own, download, or rehost the source video.

### Evidence brief

- **What We Know:** source-linked reported/observed claims.
- **What We're Checking:** unresolved questions and conflicting or incomplete evidence.
- **Why It Was Scouted:** the fan/creator nomination context.
- Citations resolve to exact source-ledger records.

### Three pathway hypotheses

- Exactly three bounded directions, not forecasts or acquisition recommendations.
- Each includes label, rationale, format, audience, cited evidence, evidence readiness, risks/questions, and a bounded next experiment.
- Project medium is enforced. A documentary cannot silently receive animation pathways; a cross-format adaptation must be explicit and supported by a qualified claim.
- The same pathway identities feed the Scout Card and Industry Lens.

### Decision Brief and Industry Lens

- Decision Brief covers identity, primary work, evidence level, unresolved stage/financing/buyer facts, and the recommended next follow-up.
- Expandable Industry Lens compares all three pathways across audience/format, evidence, risks, questions, signal limitations, creator-claim state, comparables, and next experiments.
- Submitted sources, Parallel discoveries, inference, and external signals remain visibly distinct.

### Ordering and accessibility

- Source and evidence arrive before judgment.
- Audience Pulse appears before Industry Lens so the fan experience leads the professional interpretation.
- Component tests protect the intended document order.
- Interactive sections use semantic controls, keyboard-accessible carousel/disclosures, focusable error states, and responsive layouts toward the WCAG 2.2 AA target.

## 9. Trailer Critic

Trailer Critic is a **separate, independently versioned workflow**, not another stage of the six-stage Scout Agent.

- Uses pinned `gemini-3.7-flash` through the Vertex global endpoint.
- Sends one canonical public YouTube URL directly to Vertex video understanding; it does not download or rehost the video.
- Includes only bounded public Scout Card context.
- Produces timestamped structural/narrative beats, technical-craft analysis, marketing/persuasion analysis, emotional/rhetorical analysis, and a fixed six-row critic matrix.
- Includes citations, model/version/date provenance, and explicit limitations explaining that the analysis is sampled and not frame-perfect.
- Collapsed by default into a fan-first scan of genre, form, and why the work may connect; expands into the detailed analysis.
- Public `videoAnalyses` artifacts are create-only and independently versioned by project, YouTube video, and analysis version.
- Private `videoAnalysisJobs` keep job state and lease identity.
- The Scout Card loader renders an artifact only when it matches the current project and an exact reviewed source/video identity.
- A later verified community video can schedule the isolated critic job without rerunning Parallel or changing the research/card version.
- When there is no matching artifact, the current UI renders no Trailer Critic section; a pending/empty placeholder remains a UX gap.

### Production-verified critic artifacts

| Project | Video | Artifact | Result |
| --- | --- | --- | --- |
| Junichiro Jackson | `s8G7425lfKs` | `video-analysis-2c32e95e5b61766219b44498-v1` | Completed once; four ordered beats, six matrix categories, cited sources, and limitations. |
| American Pachuco | `MXESsS8Uskc` | `video-analysis-3066eb22fd27fb3a262032d2-v1` | Completed once; five ordered beats, documentary framing, six matrix categories, cited sources, and limitations. |

Each approved critic run used one deterministic Cloud Task, returned successfully, did not retry, did not run the six-stage agent, and did not alter claims, pathways, source ledger, or research version.

## 10. Audience Pulse and social features

### Project actions

- **Follow this project** participation signal.
- Four reversible commitments:
  - **I would watch**
  - **I would pay**
  - **Bring it to my city** (requires a city)
  - **Back the next chapter**
- One current pathway vote per person.
- One structured Take per person, with edit and withdraw behavior.
- Flat replies to Takes, with edit and withdraw behavior.
- Firestore listeners update the public Audience Pulse in real time.
- Transactional deterministic action IDs make repeat submissions idempotent and prevent negative or inflated counters.
- Organic and seeded/demo activity use separate fields and are separately labeled in the interface.

### Scouting Wall signals

- Wall cards expose compact organic counts for follows, the four commitments, votes, Takes, and replies.
- These signals help a visitor understand audience activity before opening the full card.
- Follows are currently signals only; there is no notification or inbox system.

### Commitment interaction correction

The production commitment bug was traced to the client sending no body while the server expected a strict JSON object. Non-city commitments now send `{}`; the server returns the authoritative count and bucket, the UI updates immediately, and saving/saved/removed/error feedback appears beside the affected control. This correction was deployed and covered by regression tests.

## 11. Scout profiles

- Public handle, avatar, display name, and biography.
- Picks and project-grouped activity.
- Optional visibility for follows and commitments.
- Published Takes and contribution counts.
- Demo identities and demo activity remain explicitly labeled.
- The API supports reading/updating the signed-in profile, but a polished profile editor/onboarding flow is still missing.

## 12. Community evidence and trust controls

### Suggest Evidence

- A signed-in person can submit a public evidence lead with an optional note.
- A lead can propose that a reviewed YouTube URL become Scout Card media.
- Safe URL intake, canonical fingerprints, project-scoped transactional dedupe, and rate limits are reused.
- Five terminal review outcomes are supported: verified and incorporated, relevant but not incorporated, conflicts with current card, could not verify/access, and rejected as irrelevant/unsafe.
- Public suggestion projections contain only public-safe fields; ownership and reviewer details are private.
- Review events are append-only.
- Unreviewed, rejected, conflicting, or inaccessible leads do not alter claims, pathways, cards, or confidence.
- Verified incorporation links or creates a normalized `community_lead` source and publishes a new immutable correction/card version rather than patching the existing card in place.

### Creator claims and updates

- A creator or authorized representative can request to claim a project.
- Claim requests support pending, approved, and rejected states with a private requester receipt.
- Approved project roles are stored in server-private assignments, not trusted from public project fields.
- Approved creators can publish, edit, and withdraw project updates.
- Public update content is separated from private ownership records.

### Creator media uploads

- JPEG, PNG, and WebP only.
- Declared MIME must match file magic bytes.
- Maximum 4 MB server-mediated payload, below Vercel's 4.5 MB function-body ceiling.
- Content checksum, deterministic object path, UUID idempotency key, and Firestore reservation prevent duplicate or conflicting saves.
- Direct client writes to Storage remain denied.
- A short-lived signed direct-to-Firebase-Storage upload and finalize flow is the recommended long-term improvement, but it is not implemented.

### Reports and moderation

- Signed-in users can report a project, Take, reply, evidence suggestion, or creator update.
- Reports use deterministic reporter/target cases and append-only private events/reviews.
- Reporter-visible status is public-safe; raw report context, reviewer identity, and moderation internals stay private.
- Reporting does not automatically hide or mutate the target.
- Admin review APIs exist, but there is no full moderation dashboard UI.

### Corrections

- Corrections preserve the old immutable card and publish a new immutable version/pointer.
- Public correction history exposes safe from/to/source information without actor identity.
- Private audit records retain the operator.
- Correction tools default to dry-run, require explicit apply intent, compare the current pointer, and treat exact replay as a no-op.

## 13. Data integrity, privacy, and responsible AI

- Shared JSON Schemas define nomination, source analysis, research bundle, evidence claims/ledger, pathway, public progress, publication, Scout Card, source, and video-analysis contracts.
- Representative fixtures are validated across TypeScript and Python.
- Trusted research, evidence, publication, counter, claim, moderation, role, ownership, and job records cannot be written directly by clients.
- Public documents use exact or bounded allowlists so reviewer identities, account UIDs, IP/rate-limit keys, raw report context, and private authorization data are not exposed.
- Storage allows public reads only in public paths, owner reads in user-private paths, and denies direct client writes.
- Firebase server work uses Application Default Credentials. The Vercel runtime exchanges a short-lived Vercel OIDC token through Google Workload Identity Federation; no downloaded service-account JSON key is required.
- Models propose structured content; deterministic application code enforces provenance, identities, evidence relationships, medium compatibility, publication policy, and public/private boundaries.
- External comments, crowdfunding totals, press attention, and other off-platform signals never become native Audience Take engagement counts.
- The product does not claim investment advice, acquisition probability, creator ownership, rights clearance, platform interest, or commercial certainty without direct evidence.

## 14. Architecture and infrastructure

### Web and data plane

- Next.js App Router, React, TypeScript, Zod, and Vitest.
- Vercel hosts the public Next.js application.
- Firebase Authentication handles accounts.
- Firestore stores public projections, immutable artifacts, private workflow state, social activity, and trust records.
- Firebase Storage stores validated public and creator-private media.
- Firebase App Check protects production command routes.

### Agent plane

- Python 3.12 service using FastAPI, Google ADK `2.7.1`, Google Gen AI `2.20.0`, Pydantic `2.13.4`, Firestore, and JSON Schema.
- Private-by-IAM Cloud Run service `audience-take-agents`.
- Cloud Tasks OIDC delivery through queue `audience-take-research`.
- Vertex AI Gemini models for research and independent Trailer Critic work.
- Parallel Search key in Secret Manager.
- Artifact Registry images and Terraform-managed IAM/runtime resources.
- Cloud Run is configured for scale-to-zero, maximum one instance, and concurrency one; the queue is bounded to one concurrent dispatch and one dispatch per second with one Cloud Tasks attempt.
- A project-scoped $10 monthly billing budget sends threshold alerts; it is not a hard spending cap.

### Hosting history

Firebase App Hosting was attempted first. Its builds exposed lockfile, Next.js adapter lifecycle, standalone trace, runtime dependency-closure, and streamed source-upload failures. The backend never became the serving web host. The Next.js layer was moved to Vercel; Firebase and Google Cloud remained the backend. This is a normal hybrid deployment: Vercel for the web app, Firebase/Google Cloud for auth, data, storage, tasks, and agents.

### Recorded production backend

- Cloud Run revision: `audience-take-agents-00022-bg8`
- Image tag: `trailer-critic-20260828-v1`
- Image digest: `sha256:e07b372f7e73207bfe8a96b30f21f6a088e98c1c30fe764e53f0f06b46a1669b`
- Research model: `gemini-3.5-flash`
- Trailer Critic model: `gemini-3.7-flash`

This is the last recorded deployed agent revision, not a promise that every local change below is live.

## 15. Verified project history

### Junichiro Jackson

- Primary demonstration project, labeled **Fan nomination — unclaimed by creator**.
- Durable six-stage run `run-junichiro-live-20260826-1918` completed on attempt 15.
- Exactly one successful Parallel request was preserved across retries.
- Final publication contains ten sources, four qualified claims, three pathways, and a complete Scout Card.
- Three approved directions: premium adult animated series, independent animated feature, and creator-direct serialized franchise combining animation and publishing.
- A provider-free immutable correction added the reviewed TeamTO proof-of-concept as `primary_work / platform_metadata / observed`, retained the original submitted video as commentary/community, and exposed a two-video carousel.
- The original card remains unchanged; the project points to correction card `card-junichiro-live-20260826-1918-v1-correction-5ea5f36d0447`.
- The Kickstarter is described only as evidence for the manga/wider project universe, not as proven film financing.
- Independent Trailer Critic artifact is live.

### American Pachuco

- A provider-free immutable correction replaced erroneous animation pathways with documentary-native directions:
  1. Festival and theatrical expansion.
  2. Public media and educational licensing.
  3. Community impact screenings.
- The original card remains unchanged; the project points to `card-vSU2DLAPidOArl8MbA5E-v1-correction-b8983b06ad45`.
- The Scout Card and Industry Lens share the corrected pathway identities.
- Independent Trailer Critic artifact is live and identifies the work as an arts/historical documentary and biographical retrospective/festival-acclaim trailer.

### CYCLE

- Nomination combines public project source `https://lionart.media/cycle/Trailer`, YouTube proof-of-concept `k8bM9qaPXLU`, and three fan-supplied supporting links from PBS, Racine County Eye, and WUWM.
- The initial source redirect-loop failure was fixed in the repository/deployment branch by preserving the source path while validating redirects.
- Research run `CFNuwqpmhs01G3u4D96V` durably completed stages 1–4.
- Stage 4 correctly classifies the project as a feature documentary and contains five qualified claims.
- Stage 5 reached Gemini, parsed a Pydantic-valid draft, then failed the stricter deterministic pathway contract with `SemanticContractError` before stage-5 persistence.
- The exact rejected draft was intentionally not logged or persisted and cannot be reconstructed. The leading mismatch is duplicate cross-path strategy or format values; the model-facing list constraints were also looser than the canonical contract.
- The Cloud Task is gone. The saved public state remained misleadingly `queued`; the run is **not still processing and will not resume automatically**.
- No retry has been prepared or run after this failure.

## 16. Local-only fixes not deployed

The current working tree contains a tested backend correction that is **not part of recorded production revision `00022-bg8`**:

1. If stage 5 produces a semantic pathway rejection, the orchestrator constructs three conservative, low-confidence, project-medium-native pathways from the durable qualified/inference evidence, validates them through the normal strategist, and publishes an explicitly **partial** card with `generated_pathway_draft` recorded as missing. It does not invent evidence or silently authorize adaptations.
2. On the configured final task delivery, a failed run is terminalized as `failed` and retry-eligible instead of being released back to a stale `queued` state.
3. Focused regressions cover the CYCLE-shaped documentary profile, native documentary fallbacks, invented evidence rejection, and final-attempt failure state.

Local verification recorded 110 passing agent tests plus Ruff and strict mypy. These changes have not been deployed, and they do not retroactively repair CYCLE. A deployment and any CYCLE retry/reconciliation would be separate actions requiring the appropriate current authorization and compliance decision.

## 17. Demonstrations, previews, and fallbacks

- The home page's featured Junichiro content is static editorial demonstration material.
- The research UI can show a clearly labeled local Junichiro stage-three fallback if Firebase configuration/run data is unavailable; that is not provider completion evidence.
- Only the Junichiro route has an exact saved-card fallback on Firestore loading failure. Other failed card loads return not found.
- Scout Card JSON fixtures support tests and local previews; they are not the live route source.
- `TrailerCriticPreview` is a component-state preview and is not a public route.
- Seeded role/demo activity is stored but labeled and excluded from organic totals.

## 18. Testing and verification inventory

The repository contains coverage for:

- Nomination contracts, URL safety, canonicalization, duplicate handling, persistence, dispatch, and routes.
- Authentication verification, App Check enforcement, return-to handling, and roles.
- Source-reader SSRF defense, DNS pinning, redirects, content bounds, and timeouts.
- Parallel request bounds, provenance, and single-tool ownership.
- Structured-output event selection, finish reasons, token exhaustion, and schema bounds.
- Runtime leases, duplicate delivery, expiry, retries, event sequence, and public/private counters.
- Evidence qualification, truth rules, pathways, project-medium compatibility, and cross-format rejection.
- Atomic publication, failure injection, version identity, and idempotency.
- Trailer Critic request shape, schema, identity matching, job idempotency, and rendering.
- Scouting Wall, Scout Card, evidence display, Decision Brief, Industry Lens, source carousel, and responsive disclosure behavior.
- Follow, commitments, pathway votes, Takes, replies, live counts, and demo/organic separation.
- Evidence suggestions, claims, creator updates, reports, corrections, authorization, rate limits, and uploads.
- Firestore and Storage rule behavior, where the Firebase emulator/JDK is available.
- Cross-runtime JSON contract fixtures.
- Terraform formatting and production Next.js builds.

Recorded gates changed as features were added. The most recent deployed/social web record reported 209 passing web tests; the Trailer Critic deployment record reported 104 Python tests, 206 web tests, and 21 contract fixtures. The current local, undeployed stage-5 correction reported 110 passing Python tests. These are dated verification snapshots, not a fresh full-suite execution performed while writing this inventory.

## 19. Known gaps and deferred work

- **Hackathon eligibility:** unresolved because non-Google coding assistance was used. Obtain written organizer guidance before submission or reuse in a clean build.
- **CYCLE recovery:** current production run is stalled after stage 5; the local fix is not deployed and no retry has been run.
- **YouTube Data API:** view counts and aggregate comment/theme analysis are recorded as a desired enhancement but are not implemented. Before enabling, complete the required YouTube audit/derived-metrics permission, privacy/retention disclosures, bounded sampling, provenance, deletion, and refresh controls.
- **Direct uploads:** creator images still pass through the Vercel function and are capped at 4 MB; signed direct upload plus server-side finalize validation is deferred.
- **Admin UI:** protected review routes exist, but there is no complete moderation/review dashboard.
- **Profile editing:** API exists; polished onboarding/editor UI is absent.
- **Trailer Critic pending state:** no artifact currently means no section rather than a visible pending/unavailable explanation.
- **Search/discovery:** no complete search, filtering, or pagination experience.
- **Notifications:** follows do not deliver project-update notifications or an inbox.
- **Fallback coverage:** only Junichiro has a saved-card fallback; other Firestore failures fail closed.
- **Deployment reproducibility:** the Python service uses pinned core AI packages but the container install is not locked by a checked-in full dependency lock.
- **Observability:** Grafana Studio Monitor remains a stretch idea; project budget alerts exist, but no additional service-scoped Cloud Monitoring alert policies were verified.
- **Industry Slate View:** the current Decision Brief and Industry Lens are implemented; a larger professional Slate View remains gated/deferred.
- **Production scale:** Cloud Run and task throughput are intentionally low and cost-controlled for the demo, not configured for high availability.

## 20. Main public routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and nomination entry point. |
| `/sign-in` | Email/password and optionally Google authentication. |
| `/nominate` | Fan or creator project nomination. |
| `/research/[runId]` | Public-safe six-stage research progress. |
| `/projects` | Public Scouting Wall. |
| `/projects/[slug]` | Published immutable Scout Card. |
| `/projects/[slug]/manage` | Approved creator update desk. |
| `/scouts/[handle]` | Public Scout profile. |
| `/claims/[claimId]` | Private creator-claim receipt. |

## 21. Main server capabilities

| API area | Capability |
| --- | --- |
| `/api/nominations` | Validate, dedupe, persist, and dispatch a nomination. |
| `/api/projects/[projectId]/follow` | Follow/unfollow a published clear project. |
| `/api/projects/[projectId]/commitments/[type]` | Toggle one of four commitments; city validation where required. |
| `/api/projects/[projectId]/pathway-vote` | Set or withdraw one current pathway vote. |
| `/api/projects/[projectId]/take` | Publish/edit/withdraw the user's structured Take. |
| `/api/takes/[takeId]/reply` | Publish/edit/withdraw a flat reply. |
| `/api/projects/[projectId]/evidence-suggestions` | Submit a community evidence lead. |
| `/api/evidence-suggestions/[suggestionId]` | Admin review and optional immutable incorporation. |
| `/api/projects/[projectId]/claim-requests` | Submit a creator-claim request. |
| `/api/claim-requests/[claimId]` | Review a claim request. |
| `/api/projects/[projectId]/creator-updates` | Publish an approved creator update. |
| `/api/creator-updates/[updateId]` | Edit or withdraw an update. |
| `/api/uploads` | Validate and reserve a bounded creator image upload. |
| `/api/reports` | Submit a report without mutating the target. |
| `/api/admin/reports/[reportId]` | Review a report and append a private audit event. |
| `/api/projects/[projectId]/corrections` | Publish a reviewed immutable correction. |
| `/api/auth/profile` | Read or update the authenticated Scout profile. |

## 22. Reference map

- Product overview: [`PRODUCT.md`](../../PRODUCT.md)
- Repository guide: [`README.md`](../../README.md)
- Product requirements: [`docs/hackathon-build/prd.md`](../hackathon-build/prd.md)
- Technical specification: [`docs/hackathon-build/spec.md`](../hackathon-build/spec.md)
- Build checklist: [`docs/hackathon-build/checklist.md`](../hackathon-build/checklist.md)
- Detailed session/deployment history: [`docs/hackathon-build/session-handoff.md`](../hackathon-build/session-handoff.md)
- Shared contracts: [`contracts/README.md`](../../contracts/README.md)
- Infrastructure guide: [`infra/README.md`](../../infra/README.md)
- End-to-end test guide: [`tests/e2e/README.md`](../../tests/e2e/README.md)

## 23. One-sentence state of the project

Audience Take has a substantial, publicly deployed fan-first scouting product—nomination, immutable evidence-backed Scout Cards, a Scouting Wall, social audience signals, community trust workflows, and independently versioned Gemini Trailer Critic artifacts—backed by Firebase and a private Google ADK service, while the current CYCLE research run remains stalled at stage 5, its robust fix is local-only, several product enhancements remain deferred, and hackathon eligibility requires an explicit organizer ruling because Codex provided coding assistance.
