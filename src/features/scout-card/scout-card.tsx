"use client";

import React, { useEffect, useRef, useState } from "react";
import { IndustryLens } from "../industry-lens/industry-lens";
import { citationText, createCitationLabels } from "./citation-labels";
import { DecisionBrief } from "./decision-brief";
import {
  claimEvidenceState,
  evidenceStateLabel,
  evidenceStatusLabel,
  sourcePresentation,
  structureStatus,
} from "./evidence-display";
import type {
  EvidenceClaim,
  ScoutCard as ScoutCardModel,
  SourceLedgerEntry,
} from "./types";
import type { ProjectLivingUpdate } from "./living-updates";
import { LivingUpdates } from "./living-updates";
import { ScoutSocialPanel } from "../social/scout-social-panel";
import { ScoutTrustPanel } from "../trust/scout-trust-panel";
import { SourceVideoCarousel } from "./source-video-carousel";
import { TrailerCritic } from "./trailer-critic";
import { FandomDnaSection } from "./fandom-dna-section";
import type { ScoutBrief } from "../scout-brief/types";
import { ScoutBriefPlayer } from "../scout-brief/scout-brief-player";
import { CitationDrawer } from "./citation-drawer";
import { AudienceActionStrip } from "./audience-action-strip";
import { PathwayVotingSection } from "./pathway-voting-section";
import { ProfessionalBriefView } from "./professional-brief-view";

function formatDate(value: string | undefined | null): string {
  if (!value) return "Recently published";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Recently published";
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(d);
  } catch {
    return "Recently published";
  }
}

function SourceMarks({
  sourceIds,
  labels,
  onOpenCitation,
  allSources,
  claim,
}: {
  sourceIds: string[];
  labels: Map<string, string>;
  onOpenCitation?: (source: SourceLedgerEntry, claim?: EvidenceClaim, el?: HTMLElement) => void;
  allSources?: SourceLedgerEntry[];
  claim?: EvidenceClaim;
}) {
  if (!sourceIds || sourceIds.length === 0) return null;
  const uniqueSourceIds = [...new Set(sourceIds)];
  const visible = uniqueSourceIds.slice(0, 3);

  return (
    <span className="citation-marks-group" aria-label={`Citations ${citationText(uniqueSourceIds, labels)}`}>
      {visible.map((id) => {
        const label = labels.get(id) || "[S]";
        const source = allSources?.find((s) => s.id === id);

        return (
          <a
            key={id}
            href={`#source-${id.replace(/^source-/, "")}`}
            className="citation-badge"
            title={`View source ${label}`}
            aria-label={`View source citation ${label}`}
            onClick={(e) => {
              if (onOpenCitation && source) {
                e.preventDefault();
                onOpenCitation(source, claim, e.currentTarget);
              }
            }}
          >
            {label}
          </a>
        );
      })}
      {uniqueSourceIds.length > 3 ? (
        <span className="citation-badge-overflow" title={`${uniqueSourceIds.length - 3} more sources in source ledger`}>
          +{uniqueSourceIds.length - 3}
        </span>
      ) : null}
    </span>
  );
}

function ScoutMediaContent({ card }: { card: ScoutCardModel }) {
  const { media } = card;
  if (media.state === "authorized_embed" && media.embedUrl) {
    return <SourceVideoCarousel card={card} />;
  }
  if (media.state === "authorized_image" && media.imageUrl) {
    return (
      <figure className="scout-media-frame">
        {/* The authorized source URL is contract data and cannot be constrained to Next Image remote patterns. */}
        <img src={media.imageUrl} alt={media.title} />
        <figcaption>{media.attribution}</figcaption>
      </figure>
    );
  }
  return (
    <div className="scout-media-unavailable" role="img" aria-label={media.title}>
      <span>Media state / {media.state.replace("_", " ")}</span>
      <strong>{media.accessibleFallback}</strong>
      <p>{media.attribution}</p>
    </div>
  );
}

function ScoutMedia({ card }: { card: ScoutCardModel }) {
  const assetType = card.storyContext.currentFormat || "Proof of concept / Teaser";
  return (
    <section className="scout-start-here" aria-labelledby="start-here-title">
      <div className="scout-start-here-heading">
        <span className="scout-media-badge">WATCH NOW · {assetType.toUpperCase()}</span>
        <h2 id="start-here-title">Watch before you judge</h2>
        <p className="scout-media-sub">
          Available sample: <strong>{assetType}</strong> · Intended target format: <strong>{card.projectType.replace("_", " ")}</strong>
        </p>
      </div>
      <ScoutMediaContent card={card} />
    </section>
  );
}

function claimSourceIds(card: ScoutCardModel, claimIds: string[]): string[] {
  return [...new Set(claimIds.flatMap(
    (claimId) => card.evidenceClaims.find((claim) => claim.id === claimId)?.sourceIds ?? [],
  ))];
}

function ProjectHeader({
  card,
  cardStructureStatus,
  cardEvidenceLabel,
}: {
  card: ScoutCardModel;
  cardStructureStatus: string;
  cardEvidenceLabel: string;
}) {
  const creatorName = card.creatorContext.displayName || "Independent creators";
  const claimStatusLabel =
    card.claimStatus === "approved"
      ? "Creator verified"
      : "Unclaimed on Audience Take (rights remain with creators)";

  return (
    <header className="scout-header-module">
      <div className="scout-header-top">
        <h1 id="scout-card-title" className="scout-header-title">{card.title}</h1>
        <dl className="scout-header-metadata">
          <div><dt>FORMAT</dt><dd>{card.projectType.replace("_", " ")}</dd></div>
          <div><dt>CREATOR</dt><dd>{creatorName}</dd></div>
          <div><dt>CLAIM</dt><dd>{claimStatusLabel}</dd></div>
          <div><dt>PUBLISHED</dt><dd>{formatDate(card.publishedAt)}</dd></div>
        </dl>
      </div>

      <p className="scout-header-hook">{card.hook}</p>
      {card.identity?.relationshipStatus === "unresolved" ? (
        <p className="identity-caution">Identity relationship remains unresolved; similar names are not silently merged.</p>
      ) : null}

      <div className="scout-header-scores-strip" aria-label="Scout Card status">
        <div className="score-cell">
          <span className="score-icon score-icon-structure" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <div className="score-cell-text">
            <small>STRUCTURE</small>
            <strong>{cardStructureStatus}</strong>
          </div>
        </div>

        <div className="score-cell">
          <span className="score-icon score-icon-evidence" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </span>
          <div className="score-cell-text">
            <small>EVIDENCE</small>
            <strong>{cardEvidenceLabel}</strong>
          </div>
        </div>

        <div className="score-cell">
          <span className="score-icon score-icon-work" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
          </span>
          <div className="score-cell-text">
            <small>AVAILABLE ASSET</small>
            <strong>{card.storyContext.currentFormat || "Proof of Concept / Teaser"}</strong>
          </div>
        </div>

        <div className="score-cell">
          <span className="score-icon score-icon-creator" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </span>
          <div className="score-cell-text">
            <small>CREATOR ATTRIBUTION</small>
            <strong>{creatorName}</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

function ScoutingStatusPanel({
  card,
  sourceLabels,
  onOpenCitation,
}: {
  card: ScoutCardModel;
  sourceLabels: Map<string, string>;
  onOpenCitation?: (source: SourceLedgerEntry, claim?: EvidenceClaim, el?: HTMLElement) => void;
}) {
  const observationSourceIds = claimSourceIds(card, card.storyContext.claimIds).slice(0, 2);
  const hooks = card.storyContext.audienceHooks.slice(0, 3);
  const checking = card.industryLens.unresolvedQuestions.slice(0, 2);
  const activeQuestion = checking[0] ?? card.limitations[0] ?? "What is the primary viability question?";

  return (
    <section className="scouting-status-panel" aria-labelledby="scouting-status-title">
      <div className="scouting-status-header">
        <h2 id="scouting-status-title">SCOUTING STATUS</h2>
      </div>

      {/* SECTION A: WHY SOMEONE NOTICED IT (HUMAN NOMINATOR CONTEXT) */}
      <div className="scouting-status-section scout-nomination-section">
        <div className="section-subheading-row">
          <h3>WHY SOMEONE NOTICED IT</h3>
          <span className="evidence-state evidence-state-reported">COMMUNITY SCOUT</span>
        </div>
        <div className="scout-nomination-content">
          <p className="scout-nominator-quote">
            “{card.provenance.nominationLabel || "Distinctive independent work nominated for community scouting."}”
          </p>
          <span className="scout-nominator-attribution">
            Nominated by {card.provenance.nominatedByLabel || "Community scout"} · Human perspective (distinct from AI analysis below)
          </span>
        </div>
      </div>

      {/* SECTION B: WHY THIS SURFACED (AI OBSERVATIONS) */}
      <div className="scouting-status-section why-surfaced-section">
        <div className="section-subheading-row">
          <h3>WHY THIS SURFACED</h3>
          <span className="evidence-state evidence-state-inferred">INFERRED</span>
        </div>
        <ul className="signals-bullet-list">
          {hooks.map((hook) => (
            <li key={hook}>
              <span className="signal-bullet" aria-hidden="true" />
              <div className="signal-content">
                <span className="signal-text">{hook}</span>
                <SourceMarks
                  sourceIds={observationSourceIds}
                  labels={sourceLabels}
                  onOpenCitation={onOpenCitation}
                  allSources={card.sourceLedger}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION C: NEEDS VERIFICATION */}
      <div className="scouting-status-section needs-verification-section">
        <div className="section-subheading-row">
          <h3>NEEDS VERIFICATION</h3>
        </div>
        <ul className="verification-bullet-list">
          {checking.map((question) => (
            <li key={question}>
              <span className="signal-bullet verification-bullet" aria-hidden="true" />
              <span className="verification-text">{question}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* SECTION D: PRIMARY OPEN QUESTION */}
      <div className="scouting-status-section primary-open-q-section">
        <span className="open-q-label">PRIMARY OPEN QUESTION</span>
        <p className="open-q-text">{activeQuestion}</p>
        <a href="#audience-pulse" className="open-q-cta">
          ADD YOUR INFORMED TAKE →
        </a>
      </div>
    </section>
  );
}

function EvidenceLedgerPanel({
  card,
  sourceLabels,
  onOpenCitation,
}: {
  card: ScoutCardModel;
  sourceLabels: Map<string, string>;
  onOpenCitation?: (source: SourceLedgerEntry, claim?: EvidenceClaim, el?: HTMLElement) => void;
}) {
  const knownClaims = card.evidenceClaims.filter(
    (claim) => claimEvidenceState(claim, card.sourceLedger) !== "unknown",
  ).slice(0, 4);

  return (
    <section className="evidence-ledger-panel" aria-labelledby="evidence-ledger-title">
      <div className="evidence-ledger-header">
        <h2 id="evidence-ledger-title">WHAT WE KNOW</h2>
        <span className="evidence-ledger-sub">EVIDENCE LEDGER</span>
      </div>

      <div className="evidence-ledger-body">
        {knownClaims.length ? (
          <ul className="ledger-entries-list">
            {knownClaims.map((claim) => {
              const state = claimEvidenceState(claim, card.sourceLedger);
              return (
                <li key={claim.id} className="ledger-entry-item">
                  <div className="ledger-tag-col">
                    <span className={`evidence-state evidence-state-${state}`}>
                      {evidenceStateLabel(state)}
                    </span>
                  </div>
                  <div className="ledger-content-col">
                    <p className="ledger-statement-text">{claim.statement}</p>
                    <SourceMarks
                      sourceIds={claim.sourceIds}
                      labels={sourceLabels}
                      onOpenCitation={onOpenCitation}
                      allSources={card.sourceLedger}
                      claim={claim}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="ledger-empty-text">No public claim has enough usable source support yet.</p>
        )}
      </div>
    </section>
  );
}

function PathwayHypothesesPanel({
  card,
  sourceLabels,
  onOpenCitation,
}: {
  card: ScoutCardModel;
  sourceLabels: Map<string, string>;
  onOpenCitation?: (source: SourceLedgerEntry, claim?: EvidenceClaim, el?: HTMLElement) => void;
}) {
  return (
    <section className="pathway-hypotheses-panel" aria-labelledby="pathway-hypotheses-title">
      <div className="pathway-hypotheses-header">
        <h2 id="pathway-hypotheses-title">PATHWAY HYPOTHESES</h2>
        <span className="pathway-hypotheses-sub">THREE BOUNDED DIRECTIONS</span>
      </div>

      <div className="pathway-cards-stack">
        {card.pathways.map((pathway) => (
          <article key={pathway.id} className="pathway-decision-card">
            <div className="pathway-card-main-grid">
              <div className="pathway-card-info-col">
                <div className="pathway-card-title-row">
                  <span className="pathway-number-badge">{String(pathway.order).padStart(2, "0")}</span>
                  <h3 className="pathway-card-title">{pathway.label}</h3>
                </div>
                <p className="pathway-card-rationale">{pathway.rationale}</p>
                <dl className="pathway-card-meta-list">
                  <div>
                    <dt>FORMAT</dt>
                    <dd>{pathway.format || pathway.label}</dd>
                  </div>
                  <div>
                    <dt>AUDIENCE</dt>
                    <dd>{pathway.audience || "Independent screen audience"}</dd>
                  </div>
                </dl>
              </div>

              <div className="pathway-card-evidence-col">
                <div className="pathway-evidence-meta-block">
                  <span className="meta-label">EVIDENCE</span>
                  <div className="pathway-evidence-pills-row">
                    <SourceMarks
                      sourceIds={(pathway.supportingClaimIds || []).flatMap(
                        (claimId) => (card.evidenceClaims || []).find((claim) => claim.id === claimId)?.sourceIds ?? [],
                      )}
                      labels={sourceLabels}
                      onOpenCitation={onOpenCitation}
                      allSources={card.sourceLedger}
                    />
                  </div>
                </div>
                <div className="pathway-readiness-meta-block">
                  <span className="meta-label">READINESS</span>
                  <strong className="pathway-readiness-value">{readinessLabel(pathway.confidence || "high")}</strong>
                </div>
              </div>
            </div>

            <div className="pathway-next-experiment-row">
              <strong className="experiment-label">NEXT EXPERIMENT:</strong>
              <span className="experiment-value">
                {pathway.nextExperiment?.title || "Audience Demand Validation"} / {pathway.nextExperiment?.timebox || "14 days"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function readinessLabel(confidence: ScoutCardModel["pathways"][number]["confidence"]): string {
  return {
    low: "Early evidence basis",
    medium: "Developing evidence basis",
    high: "Stronger evidence basis",
  }[confidence];
}

function CardStatus({ card }: { card: ScoutCardModel }) {
  if (card.fallbackUsed) {
    return <div className="card-state-banner card-state-fallback" role="status"><strong>Saved Scout Card</strong><span>{card.fallbackLabel}</span></div>;
  }
  if (card.completeness === "partial") {
    return <div className="card-state-banner card-state-partial" role="status"><strong>Partial Scout Card</strong><span>Published with named missing sections and retained limitations.</span></div>;
  }
  return null;
}

export function ScoutCard({
  card,
  livingUpdates,
  scoutBrief,
  initialView = "discover",
}: {
  card: ScoutCardModel;
  livingUpdates?: ProjectLivingUpdate[];
  scoutBrief?: ScoutBrief | null;
  initialView?: "discover" | "pro";
}) {
  if (!card.pathways || card.pathways.length < 1 || card.pathways.length > 3) {
    throw new Error("A Scout Card requires between one and three pathways.");
  }

  const [view, setView] = useState<"discover" | "pro">(initialView);
  const [activeCitationSource, setActiveCitationSource] = useState<SourceLedgerEntry | null>(null);
  const [activeCitationClaim, setActiveCitationClaim] = useState<EvidenceClaim | null>(null);
  const [citationReturnFocusEl, setCitationReturnFocusEl] = useState<HTMLElement | null>(null);

  const tabDiscoverRef = useRef<HTMLButtonElement>(null);
  const tabProRef = useRef<HTMLButtonElement>(null);

  const sourceLabels = createCitationLabels(card.sourceLedger);
  const cardStructureStatus = structureStatus(card);
  const cardEvidenceLabel = evidenceStatusLabel(card);

  // Read URL query parameter on mount if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlView = searchParams.get("view");
      if (urlView === "pro" || urlView === "professional") {
        setView("pro");
      } else if (urlView === "discover") {
        setView("discover");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleViewChange = (newView: "discover" | "pro") => {
    setView(newView);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("view", newView);
        window.history.replaceState(null, "", url.toString());
      } catch {
        /* ignore */
      }
    }
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent,
    currentTab: "discover" | "pro"
  ) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const nextTab = currentTab === "discover" ? "pro" : "discover";
      handleViewChange(nextTab);
      if (nextTab === "discover") {
        tabDiscoverRef.current?.focus();
      } else {
        tabProRef.current?.focus();
      }
    }
  };

  const handleOpenCitation = (
    source: SourceLedgerEntry,
    claim?: EvidenceClaim,
    el?: HTMLElement
  ) => {
    setActiveCitationSource(source);
    setActiveCitationClaim(claim || null);
    if (el) setCitationReturnFocusEl(el);
  };

  const handleCloseCitation = () => {
    setActiveCitationSource(null);
    setActiveCitationClaim(null);
  };

  return (
    <main className="scout-card-page paper-texture">
      {/* Top Release Strip */}
      <div className="scout-release-strip" aria-label={`${cardStructureStatus} structure; ${cardEvidenceLabel}`}>
        <strong>
          Scout Card — public evidence summary
          <span className="tear-holes" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </span>
        </strong>
        <span className="tear-label">
          Scout Card tear-off
          <span className="tear-dashes" aria-hidden="true" />
          <i className="fold-wedge" aria-hidden="true" />
        </span>
        <span>AT—{card.cardVersionId.slice(-8).toUpperCase()}</span>
      </div>

      <CardStatus card={card} />

      {/* Role-Based Dual Audience Toggle Bar */}
      <div className="scout-view-switcher-bar">
        <div
          className="scout-view-tabs"
          role="tablist"
          aria-label="Scout Card audience perspective"
        >
          <button
            ref={tabDiscoverRef}
            type="button"
            id="tab-discover"
            role="tab"
            aria-selected={view === "discover"}
            aria-controls="scout-view-discover"
            tabIndex={view === "discover" ? 0 : -1}
            className={`scout-tab-btn ${view === "discover" ? "is-active" : ""}`}
            onClick={() => handleViewChange("discover")}
            onKeyDown={(e) => handleTabKeyDown(e, "discover")}
          >
            <span className="scout-tab-badge">AUDIENCE</span>
            <span className="scout-tab-label">DISCOVER</span>
            <span className="scout-tab-sub">Fans &amp; Community</span>
          </button>

          <button
            ref={tabProRef}
            type="button"
            id="tab-pro"
            role="tab"
            aria-selected={view === "pro"}
            aria-controls="scout-view-pro"
            tabIndex={view === "pro" ? 0 : -1}
            className={`scout-tab-btn ${view === "pro" ? "is-active" : ""}`}
            onClick={() => handleViewChange("pro")}
            onKeyDown={(e) => handleTabKeyDown(e, "pro")}
          >
            <span className="scout-tab-badge">INDUSTRY</span>
            <span className="scout-tab-label">PROFESSIONAL BRIEF</span>
            <span className="scout-tab-sub">Development &amp; Triage</span>
          </button>
        </div>

        <div className="scout-view-meta">
          <span className="scout-shared-facts-note">
            Single Evidence Record · Canonical Card Version
          </span>
        </div>
      </div>

      {/* VIEW 1: DISCOVER (FANS & AUDIENCE) */}
      {view === "discover" ? (
        <div
          id="scout-view-discover"
          role="tabpanel"
          aria-labelledby="tab-discover"
        >
          <article className="scout-dossier-redesign" aria-labelledby="scout-card-title">
            {/* 1. Full-Width Project Header */}
            <ProjectHeader
              card={card}
              cardStructureStatus={cardStructureStatus}
              cardEvidenceLabel={cardEvidenceLabel}
            />

            {/* 2. Primary Grid (Video + Scouting Status) */}
            <div className="scout-primary-grid">
              <div className="scout-video-column">
                <ScoutMedia card={card} />
              </div>
              <div className="scout-status-column">
                <ScoutingStatusPanel
                  card={card}
                  sourceLabels={sourceLabels}
                  onOpenCitation={handleOpenCitation}
                />
              </div>
            </div>

            {/* 3. Compact Audience Action Strip (Question 4: How can I participate?) */}
            <AudienceActionStrip card={card} />

            {/* 4. Latest Updates & What Happens Next (Question 5) */}
            {livingUpdates && livingUpdates.length > 0 ? (
              <LivingUpdates updates={livingUpdates} />
            ) : null}

            <PathwayVotingSection card={card} />
          </article>

          {/* 5. Progressive Disclosure: Learn More (Question 6) */}
          <section className="scout-learn-more-section" aria-labelledby="learn-more-title">
            <div className="section-heading-line">
              <div>
                <span className="route-label">Progressive Disclosure</span>
                <h2 id="learn-more-title">Where can I learn more?</h2>
              </div>
              <span>Takes, creative notes, and evidence ledger</span>
            </div>

            {scoutBrief && (
              <ScoutBriefPlayer
                brief={scoutBrief}
                unclaimed={card.claimStatus === "unclaimed"}
                sources={card.sourceLedger}
                onOpenCitation={handleOpenCitation}
                audienceMode={view}
              />
            )}

            <TrailerCritic analyses={card.trailerCritiques ?? []} sourceLabels={sourceLabels} />

            <ScoutSocialPanel card={card} />

            {/* Research Grid (Evidence Ledger + Pathway Hypotheses) */}
            <div className="scout-research-grid">
              <div className="scout-evidence-ledger-column">
                <EvidenceLedgerPanel
                  card={card}
                  sourceLabels={sourceLabels}
                  onOpenCitation={handleOpenCitation}
                />
              </div>
              <div className="scout-hypotheses-column">
                <PathwayHypothesesPanel
                  card={card}
                  sourceLabels={sourceLabels}
                  onOpenCitation={handleOpenCitation}
                />
              </div>
            </div>

            <FandomDnaSection
              fandomDna={card.fandomDna}
              marketViability={card.marketViability}
              livingDossier={card.livingDossier}
              channelEcosystem={card.channelEcosystem}
            />

            <DecisionBrief card={card} />
            <IndustryLens card={card} />
            <ScoutTrustPanel card={card} />

            <section className="evidence-section" aria-labelledby="evidence-title">
              <div className="section-heading-line"><h2 id="evidence-title">Evidence &amp; citations</h2><span>Claims stay qualified</span></div>
              <div className="evidence-grid">
                <div className="claim-ledger">
                  <h3>Claim ledger</h3>
                  {card.evidenceClaims.map((claim) => (
                    <article key={claim.id}>
                      <span className={`evidence-state evidence-state-${claimEvidenceState(claim, card.sourceLedger)}`}>{evidenceStateLabel(claimEvidenceState(claim, card.sourceLedger))}</span>
                      <p>{claim.statement} <SourceMarks sourceIds={claim.sourceIds} labels={sourceLabels} onOpenCitation={handleOpenCitation} allSources={card.sourceLedger} claim={claim} /></p>
                      {claim.qualification ? <small>{claim.qualification}</small> : null}
                    </article>
                  ))}
                </div>
                <div className="source-ledger-public">
                  <h3>Source ledger</h3>
                  <ol>
                    {card.sourceLedger.map((source) => (
                      <li key={source.id} id={`source-${source.id.replace(/^source-/, "")}`}>
                        <span className="source-index">{sourceLabels.get(source.id)}</span>
                        <div>
                          <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                          {source.excerpt ? (
                            <p className="source-passage-excerpt">“{source.excerpt}”</p>
                          ) : null}
                          <p>{sourcePresentation(source).role} / {sourcePresentation(source).tier} / {source.availability}</p>
                          <small>{source.publishedAt ? `Published ${formatDate(source.publishedAt)} · ` : ""}Retrieved {formatDate(source.retrievedAt)}</small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            <section className="external-signals" aria-labelledby="signals-title">
              <div><h2 id="signals-title">External signals</h2><p>Public-web observations remain separate from Audience Take-native participation.</p></div>
              {card.externalSignals.length ? <ul>{card.externalSignals.map((signal) => <li key={signal.label}><strong>{signal.label}</strong><p>{signal.analysis}</p><small>Not an Audience Take-native count.</small></li>)}</ul> : <p className="signals-empty">No external signals were included in this Scout Card. No native audience count is claimed.</p>}
            </section>

            <section className="scout-limitations" aria-labelledby="limitations-title">
              <h2 id="limitations-title">What this card cannot establish</h2>
              <ul>{card.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
              {card.missingSections.length ? <div><strong>Missing sections</strong><p>{card.missingSections.map((item) => item.replaceAll("_", " ")).join(" / ")}</p></div> : null}
            </section>
          </section>
        </div>
      ) : (
        /* VIEW 2: PROFESSIONAL BRIEF (INDUSTRY & DEVELOPMENT) */
        <div
          id="scout-view-pro"
          role="tabpanel"
          aria-labelledby="tab-pro"
        >
          <ProfessionalBriefView
            card={card}
            sourceLabels={sourceLabels}
            livingUpdates={livingUpdates}
            scoutBrief={scoutBrief}
            onOpenCitation={handleOpenCitation}
          />
        </div>
      )}

      {/* Interactive Citation Drawer */}
      <CitationDrawer
        isOpen={Boolean(activeCitationSource)}
        onClose={handleCloseCitation}
        source={activeCitationSource}
        claim={activeCitationClaim}
        sourceLabels={sourceLabels}
        returnFocusEl={citationReturnFocusEl}
      />
    </main>
  );
}
