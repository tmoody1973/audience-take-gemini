"use client";

import React, { useState } from "react";
import type { EvidenceClaim, ScoutCard, SourceLedgerEntry } from "./types";
import {
  claimEvidenceState,
  evidenceStateLabel,
  evidenceStatusLabel,
  sourcePresentation,
} from "./evidence-display";
import { citationText } from "./citation-labels";
import type { ProjectLivingUpdate } from "./living-updates";
import { LivingUpdates } from "./living-updates";
import { IndustryLens } from "../industry-lens/industry-lens";
import { TrailerCritic } from "./trailer-critic";
import { FandomDnaSection } from "./fandom-dna-section";
import type { ScoutBrief } from "../scout-brief/types";
import { ScoutBriefPlayer } from "../scout-brief/scout-brief-player";
import { ProductionScenariosSection } from "../production-scenarios/production-scenarios-section";

function formatDate(value: string | undefined | null): string {
  if (!value) return "Recently published";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Recently published";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "Recently published";
  }
}

function relationshipLabel(card: ScoutCard): string {
  return {
    unresolved: "Relationship unresolved",
    source_aligned: "Aligned by public sources",
    creator_confirmed: "Creator confirmed",
    disputed: "Relationship disputed",
  }[card.identity?.relationshipStatus ?? "unresolved"];
}

function UnknownPill() {
  return <span className="decision-unknown">Unknown</span>;
}

export type ProfessionalBriefViewProps = {
  card: ScoutCard;
  sourceLabels: Map<string, string>;
  livingUpdates?: ProjectLivingUpdate[];
  scoutBrief?: ScoutBrief | null;
  onOpenCitation: (source: SourceLedgerEntry, claim?: EvidenceClaim) => void;
};

export function ProfessionalBriefView({
  card,
  sourceLabels,
  livingUpdates,
  scoutBrief,
  onOpenCitation,
}: ProfessionalBriefViewProps) {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const primaryWork = card.primaryWorkSourceId
    ? card.sourceLedger.find((source) => source.id === card.primaryWorkSourceId)
    : undefined;

  const triageSummary =
    card.decisionBrief?.triageSummary ||
    card.storyContext.summary ||
    "Independent creative work with distinctive voice requiring commercial triage.";

  const materialUncertainty =
    card.decisionBrief?.materialUncertainty ||
    card.industryLens?.risks?.[0] ||
    "Production financing, distribution rights exclusivity, and cross-format adaptation scale.";

  const nextDiligenceStep =
    (card.identity?.relationshipStatus === "unresolved" && !card.decisionBrief?.nextDiligenceStep)
      ? "Verify creator identity and primary work provenance before initiating commercial discussions."
      : card.decisionBrief?.nextDiligenceStep ||
        card.industryLens?.unresolvedQuestions?.[0] ||
        "Confirm creator representation status and underlying chain of title before proceeding.";

  const supportedClaims = card.evidenceClaims.filter((c) => c.status === "supported" || c.status === "qualified");

  const financingClaim = supportedClaims.find((c) =>
    /\b(kickstarter|crowdfund|pledged|funded|budget|grant|raised)\b/i.test(c.statement)
  );
  const financingSource = financingClaim?.sourceIds?.[0]
    ? card.sourceLedger.find((s) => s.id === financingClaim.sourceIds[0])
    : undefined;

  const partnerClaim = supportedClaims.find((c) =>
    /\b(teamto|studio|partner|co-production|cbc studios|production company)\b/i.test(c.statement)
  );
  const partnerSource = partnerClaim?.sourceIds?.[0]
    ? card.sourceLedger.find((s) => s.id === partnerClaim.sourceIds[0])
    : undefined;

  const distributionClaim = supportedClaims.find((c) =>
    /\b(sundance|festival|selection|screening|annecy|broadcast|pbs|theatrical|distribution|award)\b/i.test(c.statement)
  );
  const distributionSource = distributionClaim?.sourceIds?.[0]
    ? card.sourceLedger.find((s) => s.id === distributionClaim.sourceIds[0])
    : undefined;

  const stageClaim = supportedClaims.find((c) =>
    /\b(proof of concept|pilot|development|pre-production|production|post-production|festival circuit)\b/i.test(c.statement)
  );
  const stageSource = stageClaim?.sourceIds?.[0]
    ? card.sourceLedger.find((s) => s.id === stageClaim.sourceIds[0])
    : undefined;

  const handleCopyBrief = async () => {
    const text = `AUDIENCE TAKE — PROFESSIONAL SCOUT BRIEF
Project: ${card.title}
Format: ${card.projectType.replace("_", " ").toUpperCase()}
Research Date: ${formatDate(card.provenance.researchedAt)}
Card Version: ${card.cardVersionId}
Verification: ${evidenceStatusLabel(card)}

1. TRIAGE SUMMARY
${triageSummary}

2. MATERIAL UNCERTAINTY
${materialUncertainty}

3. NEXT DILIGENCE STEP
${nextDiligenceStep}

4. STRUCTURED STATUS
- Primary Work: ${primaryWork ? primaryWork.title : "Unknown / Unverified"}
- Development Stage: ${stageClaim ? stageClaim.statement : card.storyContext.currentFormat || "Not publicly reported"}
- Public Financing: ${financingClaim ? financingClaim.statement : "Not publicly reported"}
- Attached Partners: ${partnerClaim ? partnerClaim.statement : "Not publicly reported"}
- Rights / Representation: ${card.claimStatus === "approved" ? "Creator claim approved; representation unverified" : "Unknown"}

5. PATHWAYS UNDER CONSIDERATION
${card.pathways.map((p, i) => `${i + 1}. ${p.label}: ${p.rationale}`).join("\n")}

Sources: ${card.sourceLedger.map((s) => `${s.title} (${s.url})`).join(", ")}
Source Link: ${typeof window !== "undefined" ? window.location.href : `/projects/${card.slug}?view=pro`}
`;
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(text);
        setCopyFeedback("Brief copied to clipboard!");
        setTimeout(() => setCopyFeedback(null), 3000);
      }
    } catch {
      setCopyFeedback("Unable to copy automatically.");
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleViewSources = () => {
    const el = document.getElementById("pro-source-ledger");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Decision-relevant claims
  const decisionClaims = card.evidenceClaims.slice(0, 5);

  return (
    <article className="pro-brief-container" aria-labelledby="pro-brief-heading">
      {/* 1. Header Toolbar */}
      <header className="pro-brief-header-module">
        <div className="pro-brief-identity-row">
          <div>
            <span className="pro-kicker">PROFESSIONAL DOSSIER · CONFIDENTIAL EVALUATION RECORD</span>
            <h1 id="pro-brief-heading" className="pro-brief-title">{card.title}</h1>
            <p className="pro-brief-hook">{card.hook}</p>
          </div>

          <div className="pro-brief-actions-bar">
            <button
              type="button"
              className="pro-action-btn pro-action-copy"
              onClick={handleCopyBrief}
              aria-label="Copy professional brief to clipboard"
            >
              <span>📋</span>
              <strong>Copy brief</strong>
            </button>
            <button
              type="button"
              className="pro-action-btn pro-action-print"
              onClick={handlePrint}
              aria-label="Print professional brief"
            >
              <span>🖨</span>
              <strong>Print brief</strong>
            </button>
            <button
              type="button"
              className="pro-action-btn pro-action-sources"
              onClick={handleViewSources}
              aria-label="Scroll to source ledger"
            >
              <span>🔍</span>
              <strong>View sources</strong>
            </button>
          </div>
        </div>

        {copyFeedback ? (
          <div className="pro-copy-feedback" role="status" aria-live="polite">
            ✓ {copyFeedback}
          </div>
        ) : null}

        <dl className="pro-brief-meta-strip">
          <div>
            <dt>FORMAT</dt>
            <dd>{card.projectType.replace("_", " ")}</dd>
          </div>
          <div>
            <dt>EVIDENCE LEVEL</dt>
            <dd>{evidenceStatusLabel(card)}</dd>
          </div>
          <div>
            <dt>IDENTITY STATUS</dt>
            <dd>{relationshipLabel(card)}</dd>
          </div>
          <div>
            <dt>RESEARCH DATE</dt>
            <dd>{formatDate(card.provenance.researchedAt)}</dd>
          </div>
          <div>
            <dt>CARD VERSION</dt>
            <dd>AT—{card.cardVersionId.slice(-8).toUpperCase()}</dd>
          </div>
        </dl>
      </header>

      {/* 2. Triage Summary */}
      <section className="pro-triage-section" aria-labelledby="pro-triage-heading">
        <div className="pro-section-title-wrap">
          <span className="pro-section-kicker">EXECUTIVE SUMMARY / 60 SECONDS</span>
          <h2 id="pro-triage-heading">Development Triage</h2>
          <p className="pro-disclaimer">
            Evidence-grounded triage of known facts, material gaps, and the next diligence step.
            Not an acquisition recommendation derived from an artificial score.
          </p>
        </div>

        <div className="pro-triage-grid">
          <div className="pro-triage-card pro-triage-why">
            <span className="pro-card-label">1. WHY INVESTIGATE</span>
            <p className="pro-card-content">{triageSummary}</p>
          </div>

          <div className="pro-triage-card pro-triage-uncertainty">
            <span className="pro-card-label">2. MATERIAL UNCERTAINTY</span>
            <p className="pro-card-content">{materialUncertainty}</p>
          </div>

          <div className="pro-triage-card pro-triage-next-step">
            <span className="pro-card-label">3. NEXT DILIGENCE STEP</span>
            <p className="pro-card-content">{nextDiligenceStep}</p>
          </div>
        </div>
      </section>

      {/* 3. Structured Status Table */}
      <section className="pro-status-section" aria-labelledby="pro-status-heading">
        <div className="pro-section-title-wrap">
          <span className="pro-section-kicker">STATUS AUDIT</span>
          <h2 id="pro-status-heading">Stage &amp; Availability Audit</h2>
        </div>

        <div className="pro-table-wrapper">
          <table className="pro-status-table" aria-label="Project stage and availability audit">
            <thead>
              <tr>
                <th scope="col">DIMENSION</th>
                <th scope="col">CURRENT KNOWN STATUS</th>
                <th scope="col">EVIDENCE BASIS</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Entity &amp; Primary Work</th>
                <td>
                  <strong>{card.title}</strong>
                  {primaryWork ? <div><small>{primaryWork.title}</small></div> : null}
                </td>
                <td>
                  {primaryWork ? (
                    <button
                      type="button"
                      className="pro-citation-link-btn"
                      onClick={() => onOpenCitation(primaryWork)}
                    >
                      {sourcePresentation(primaryWork).role} / {sourcePresentation(primaryWork).tier} [{sourceLabels.get(primaryWork.id) || "S"}]
                    </button>
                  ) : (
                    <UnknownPill />
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Development Stage</th>
                <td>
                  {card.storyContext.currentFormat ? (
                    <span>{card.storyContext.currentFormat}</span>
                  ) : stageClaim ? (
                    <strong>{stageClaim.statement}</strong>
                  ) : (
                    <UnknownPill />
                  )}
                </td>
                <td>
                  {stageSource ? (
                    <button
                      type="button"
                      className="pro-citation-link-btn"
                      onClick={() => onOpenCitation(stageSource, stageClaim)}
                    >
                      {sourcePresentation(stageSource).role} [{sourceLabels.get(stageSource.id) || "S"}]
                    </button>
                  ) : (
                    <span className="pro-muted-note">Observed from submitted format</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Publicly Reported Financing</th>
                <td>
                  {financingClaim ? (
                    <strong>{financingClaim.statement}</strong>
                  ) : (
                    <UnknownPill />
                  )}
                </td>
                <td>
                  {financingSource ? (
                    <button
                      type="button"
                      className="pro-citation-link-btn"
                      onClick={() => onOpenCitation(financingSource, financingClaim)}
                    >
                      {sourcePresentation(financingSource).role} [{sourceLabels.get(financingSource.id) || "S"}]
                    </button>
                  ) : (
                    <span className="pro-muted-note">No public budget or capitalization filing confirmed</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Attached Production Partners</th>
                <td>
                  {partnerClaim ? (
                    <strong>{partnerClaim.statement}</strong>
                  ) : (
                    <UnknownPill />
                  )}
                </td>
                <td>
                  {partnerSource ? (
                    <button
                      type="button"
                      className="pro-citation-link-btn"
                      onClick={() => onOpenCitation(partnerSource, partnerClaim)}
                    >
                      {sourcePresentation(partnerSource).role} [{sourceLabels.get(partnerSource.id) || "S"}]
                    </button>
                  ) : (
                    <span className="pro-muted-note">No verified studio or co-production partner confirmed</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Public Distribution / Festival Slate</th>
                <td>
                  {distributionClaim ? (
                    <strong>{distributionClaim.statement}</strong>
                  ) : (
                    <UnknownPill />
                  )}
                </td>
                <td>
                  {distributionSource ? (
                    <button
                      type="button"
                      className="pro-citation-link-btn"
                      onClick={() => onOpenCitation(distributionSource, distributionClaim)}
                    >
                      {sourcePresentation(distributionSource).role} [{sourceLabels.get(distributionSource.id) || "S"}]
                    </button>
                  ) : (
                    <span className="pro-muted-note">No public theatrical or streaming window announced</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Rights &amp; Representation</th>
                <td>
                  {card.claimStatus === "approved"
                    ? "Creator claim approved; representation remains unverified."
                    : <UnknownPill />}
                </td>
                <td>
                  {card.claimStatus === "approved" ? (
                    <span className="evidence-state evidence-state-reported">Reported</span>
                  ) : (
                    <span className="pro-muted-note">Independent/unverified</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
 
      {/* 3B. Production Scenarios (Physical Production Diligence) */}
      <ProductionScenariosSection card={card} />

      {/* 4. Evidence that Matters */}
      <section className="pro-evidence-section" aria-labelledby="pro-evidence-heading">
        <div className="pro-section-title-wrap">
          <span className="pro-section-kicker">QUALIFIED FACT BASE</span>
          <h2 id="pro-evidence-heading">Evidence That Matters</h2>
          <p className="pro-disclaimer">
            Decision-relevant statements supported by extracted passages. Contradictions or unverified claims are surfaced explicitly.
          </p>
        </div>

        <div className="pro-claims-list">
          {decisionClaims.map((claim) => {
            const state = claimEvidenceState(claim, card.sourceLedger);
            const firstSourceId = claim.sourceIds[0];
            const firstSource = firstSourceId
              ? card.sourceLedger.find((s) => s.id === firstSourceId)
              : null;

            return (
              <article key={claim.id} className="pro-claim-card">
                <div className="pro-claim-badge-col">
                  <span className={`evidence-state evidence-state-${state}`}>
                    {evidenceStateLabel(state)}
                  </span>
                </div>

                <div className="pro-claim-content-col">
                  <p className="pro-claim-statement">{claim.statement}</p>
                  {claim.qualification ? (
                    <p className="pro-claim-qualification">
                      <strong>Qualification:</strong> {claim.qualification}
                    </p>
                  ) : null}
                  {claim.status === "conflicting" ? (
                    <div className="pro-claim-conflict-notice" role="alert">
                      <strong>Conflict Note:</strong> Public trade and community sources report contradictory facts regarding this statement.
                    </div>
                  ) : null}

                  {/* Deduplicated Citation Buttons */}
                  <div className="pro-claim-sources-row">
                    <span className="pro-citations-label">Sources:</span>
                    {claim.sourceIds.length > 0 ? (
                      [...new Set(claim.sourceIds)].map((sid) => {
                        const s = card.sourceLedger.find((entry) => entry.id === sid);
                        if (!s) return null;
                        const label = sourceLabels.get(s.id) || "[S]";
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className="citation-badge"
                            onClick={() => onOpenCitation(s, claim)}
                            aria-label={`View source citation ${label}`}
                          >
                            {label}
                          </button>
                        );
                      })
                    ) : (
                      <span className="pro-no-citations">No direct source passage linked</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 5. Comparable Pathways (Variable 1 to 3 Options) */}
      <section className="pro-pathways-section" aria-labelledby="pro-pathways-heading">
        <div className="pro-section-title-wrap">
          <span className="pro-section-kicker">DEVELOPMENT HYPOTHESES</span>
          <h2 id="pro-pathways-heading">Comparable Pathways</h2>
          <p className="pro-disclaimer">
            Presented as comparable options ({card.pathways.length} grounded {card.pathways.length === 1 ? "pathway" : "pathways"}). Pathway ranking does not imply commercial probability.
          </p>
        </div>

        {/* Shared Context: Deduplicated Prerequisites, Limitations & Creator Status */}
        <div className="pro-pathways-shared-context">
          <div className="pro-shared-item">
            <span className="pro-shared-label">SHARED PREREQUISITES &amp; CREATOR STATUS</span>
            <p>
              {card.claimStatus === "approved"
                ? "Creator identity verified on Audience Take. Underlying rights, chain of title, and representation status apply across all potential pathways."
                : "Unclaimed on Audience Take (creator identity/representation not verified). Chain of title and rights clearance remain essential prerequisites before pursuing any development pathway."}
            </p>
          </div>
          {card.limitations && card.limitations.length > 0 ? (
            <div className="pro-shared-item">
              <span className="pro-shared-label">CROSS-PATHWAY LIMITATION</span>
              <p>{card.limitations[0]}</p>
            </div>
          ) : null}
        </div>

        <div className="pro-pathways-grid">
          {card.pathways.map((pathway, idx) => (
            <article key={pathway.id} className="pro-pathway-card">
              <header className="pro-pathway-card-header">
                <span className="pro-pathway-idx">OPTION {idx + 1}</span>
                <h3 className="pro-pathway-title">{pathway.label}</h3>
                <span className="pro-pathway-format">{pathway.format || pathway.label}</span>
              </header>

              <div className="pro-pathway-body">
                <div>
                  <h4 className="pro-sub-kicker">RATIONALE</h4>
                  <p>{pathway.rationale}</p>
                </div>

                {pathway.prerequisites && pathway.prerequisites.length > 0 ? (
                  <div>
                    <h4 className="pro-sub-kicker">PATHWAY-SPECIFIC PREREQUISITES</h4>
                    <p>{pathway.prerequisites.join("; ")}</p>
                  </div>
                ) : null}

                {pathway.blockers && pathway.blockers.length > 0 ? (
                  <div>
                    <h4 className="pro-sub-kicker">KNOWN BLOCKERS</h4>
                    <p>{pathway.blockers.join("; ")}</p>
                  </div>
                ) : null}

                <div>
                  <h4 className="pro-sub-kicker">NEXT BOUNDED EXPERIMENT</h4>
                  <p>
                    <strong>{pathway.nextExperiment.title}</strong> ({pathway.nextExperiment.timebox}): {pathway.nextExperiment.signal}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 6. External Signals vs Native Interest */}
      <section className="pro-signals-section" aria-labelledby="pro-signals-heading">
        <div className="pro-section-title-wrap">
          <span className="pro-section-kicker">COMMERCIAL &amp; AUDIENCE INTELLIGENCE</span>
          <h2 id="pro-signals-heading">Market &amp; Fandom Signals</h2>
          <p className="pro-disclaimer">
            Public-web commentary is separated from Audience Take-native interest signals.
          </p>
        </div>

        <div className="pro-signals-split">
          <div className="pro-signal-block">
            <h3>External Observations</h3>
            {card.externalSignals.length ? (
              <ul className="pro-external-signals-list">
                {card.externalSignals.map((sig) => (
                  <li key={sig.label}>
                    <strong>{sig.label}</strong>
                    <p>{sig.analysis}</p>
                    <small>External observation · Not a native platform count.</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="pro-empty-notice">No external commercial signals verified for this project.</p>
            )}
          </div>

          <div className="pro-signal-block">
            <h3>Native Audience Take Signals</h3>
            <p className="pro-empty-notice">
              Independent non-binding community intent. Detailed in Discover view.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Changes, Audio Brief, & Methodology */}
      {scoutBrief && (
        <ScoutBriefPlayer
          brief={scoutBrief}
          unclaimed={card.claimStatus === "unclaimed"}
          sources={card.sourceLedger}
          onOpenCitation={onOpenCitation}
          audienceMode="professional"
        />
      )}

      <TrailerCritic analyses={card.trailerCritiques ?? []} sourceLabels={sourceLabels} />
      <FandomDnaSection
        fandomDna={card.fandomDna}
        marketViability={card.marketViability}
        livingDossier={card.livingDossier}
        channelEcosystem={card.channelEcosystem}
      />
      <IndustryLens card={card} />
      <LivingUpdates updates={livingUpdates ?? []} />

      {/* Source Ledger Section */}
      <section id="pro-source-ledger" className="evidence-section" aria-labelledby="pro-ledger-title">
        <div className="section-heading-line">
          <h2 id="pro-ledger-title">Full Source Ledger &amp; Methodology</h2>
          <span>Immutable citations</span>
        </div>

        <div className="source-ledger-public">
          <ol>
            {card.sourceLedger.map((source) => (
              <li key={source.id} id={`pro-source-${source.id.replace(/^source-/, "")}`}>
                <span className="source-index">{sourceLabels.get(source.id)}</span>
                <div>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  {source.excerpt ? (
                    <blockquote className="source-passage-excerpt">“{source.excerpt}”</blockquote>
                  ) : null}
                  <p>
                    {sourcePresentation(source).role} / {sourcePresentation(source).tier} / {source.availability}
                  </p>
                  <small>
                    {source.publishedAt ? `Published ${formatDate(source.publishedAt)} · ` : ""}
                    Retrieved {formatDate(source.retrievedAt)}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Limitations Section */}
      <section className="scout-limitations" aria-labelledby="pro-limitations-title">
        <h2 id="pro-limitations-title">What this brief cannot establish</h2>
        <ul>
          {card.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
        {card.missingSections.length ? (
          <div>
            <strong>Missing sections:</strong>
            <p>{card.missingSections.map((item) => item.replaceAll("_", " ")).join(" / ")}</p>
          </div>
        ) : null}
      </section>
    </article>
  );
}
