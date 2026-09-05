import React from "react";
import type { FandomDnaAnalysis } from "@/critic/audience-comment-analyzer";
import type { MarketViabilityReport } from "@/critic/market-viability-engine";
import type { LivingDossierRecord } from "@/services/re-scout-engine";

export function FandomDnaSection({
  fandomDna,
  marketViability,
  livingDossier,
  channelEcosystem,
}: {
  fandomDna?: FandomDnaAnalysis;
  marketViability?: MarketViabilityReport;
  livingDossier?: LivingDossierRecord;
  channelEcosystem?: {
    channelTitle: string;
    channelHandle?: string;
    subscribers: number;
    totalUniverseViews: number;
    universeVideoCount: number;
    activeRetentionRate: string;
    catalogLongevity: string;
  };
}) {
  if (!fandomDna && !marketViability && !channelEcosystem) return null;

  return (
    <section className="fandom-dna-section" aria-labelledby="fandom-dna-title">
      <div className="section-heading-line">
        <h2 id="fandom-dna-title">Audience Resonance &amp; Market Viability</h2>
        <span>Gemini 3.5 Flash · YouTube Comment NLP &amp; Buyer Sanity Check</span>
      </div>

      {/* Creator Channel Macro Banner */}
      {channelEcosystem ? (
        <div className="channel-macro-banner">
          <div className="channel-info-block">
            <span className="channel-badge">Creator Channel Gravity</span>
            <strong className="channel-title">
              {channelEcosystem.channelTitle}{" "}
              {channelEcosystem.channelHandle ? <small>{channelEcosystem.channelHandle}</small> : null}
            </strong>
          </div>
          <div className="channel-stats-row">
            <div className="channel-stat-item">
              <small>Channel Subscribers</small>
              <b>{(channelEcosystem.subscribers / 1000).toFixed(0)}K</b>
            </div>
            <div className="channel-stat-item">
              <small>Universe Catalog Views</small>
              <b>{(channelEcosystem.totalUniverseViews / 1000000).toFixed(1)}M</b>
            </div>
            <div className="channel-stat-item">
              <small>Active Fan Retention</small>
              <b>{channelEcosystem.activeRetentionRate}</b>
            </div>
            <div className="channel-stat-item">
              <small>Fandom Longevity</small>
              <b>{channelEcosystem.catalogLongevity}</b>
            </div>
          </div>
        </div>
      ) : null}

      {/* Dual Axis Scorecard */}
      {marketViability ? (
        <div className="dual-axis-banner">
          <div className="dual-axis-score-card">
            <div className="dual-axis-header">
              <span>Grassroots Momentum</span>
              <strong>Audience Heat</strong>
            </div>
            <div className="dual-axis-val">
              <b>{marketViability.audienceHeatScore}</b>
              <small>/100</small>
            </div>
            <p>High velocity community engagement with active crowdfunding backing.</p>
            <details className="score-explanation-disclosure">
              <summary><span className="info-pill-badge">? How is this calculated?</span></summary>
              <div className="score-explanation-body">
                <p><strong>Audience Heat Formula:</strong></p>
                <ul>
                  <li><strong>Cross-Platform Diffusion:</strong> {marketViability.dimensions?.crossPlatformDiffusion?.explanation || "Awaiting cross-domain diffusion metrics."}</li>
                  <li><strong>Budget &amp; Capitalization:</strong> {marketViability.dimensions?.budgetToFormatRealism?.capitalizationRatio ? `${marketViability.dimensions.budgetToFormatRealism.capitalizationRatio} funded` : "Capitalization unverified"} ({marketViability.dimensions?.budgetToFormatRealism?.explanation || "Awaiting budget data"}).</li>
                  <li><strong>Discretionary Spend ARPU:</strong> {marketViability.dimensions?.commercialCeilingTam?.averageSpendPerBacker || "N/A"} {marketViability.dimensions?.commercialCeilingTam?.averageSpendPerBacker ? "(Derived from verified crowdfunding commitment)" : "(No crowdfunding data)"}</li>
                </ul>
              </div>
            </details>
          </div>

          <div className="dual-axis-score-card market-readiness-card">
            <div className="dual-axis-header">
              <span>Buyer &amp; Industry Alignment</span>
              <strong>Market Viability</strong>
            </div>
            <div className="dual-axis-val">
              <b>{marketViability.marketReadinessScore}</b>
              <small>/100</small>
            </div>
            <p>{marketViability.tier} · {marketViability.buyerDecisionMatrix?.recommendedAction || "Evaluation in progress"}.</p>
            <details className="score-explanation-disclosure">
              <summary><span className="info-pill-badge">? How is this calculated?</span></summary>
              <div className="score-explanation-body">
                <p><strong>4-Dimension Buyer Sanity Check:</strong></p>
                <ul>
                  <li><strong>Cross-Platform Diffusion (30%):</strong> Score {marketViability.dimensions?.crossPlatformDiffusion?.score ?? 0}/100 across {marketViability.dimensions?.crossPlatformDiffusion?.distinctDomainsCount ?? 0} independent domains {marketViability.dimensions?.crossPlatformDiffusion?.hasTradePress ? "(Verified trade press present)" : "(No trade press verified)"}.</li>
                  <li><strong>Budget Realism (25%):</strong> Score {marketViability.dimensions?.budgetToFormatRealism?.score ?? 0}/100. Cost: {marketViability.dimensions?.budgetToFormatRealism?.estCostPerMinute || "Unverified"}. Studio Attachment: {marketViability.dimensions?.budgetToFormatRealism?.studioAttachment || "None verified"}.</li>
                  <li><strong>Buyer Slate Fit (25%):</strong> Score {marketViability.dimensions?.buyerSlateAlignment?.score ?? 0}/100 {marketViability.dimensions?.buyerSlateAlignment?.topBuyers && marketViability.dimensions.buyerSlateAlignment.topBuyers.length > 0 ? `with ${marketViability.dimensions.buyerSlateAlignment.topBuyers.slice(0, 3).join(", ")}` : "(No buyer attachments verified)"}.</li>
                  <li><strong>Commercial Ceiling (20%):</strong> Score {marketViability.dimensions?.commercialCeilingTam?.score ?? 0}/100 ({marketViability.dimensions?.commercialCeilingTam?.estTam || "TAM unquantified"}).</li>
                </ul>
              </div>
            </details>
          </div>

          <div className="dual-axis-decision-card">
            <span>Executive Acquisition Matrix</span>
            <strong>{marketViability.buyerDecisionMatrix?.recommendedAction || "Review Required"}</strong>
            <p>{marketViability.buyerDecisionMatrix?.commercialCeilingVerdict || "Commercial ceiling pending additional evidence."}</p>
            {marketViability.buyerDecisionMatrix?.primaryBuyerTargets && marketViability.buyerDecisionMatrix.primaryBuyerTargets.length > 0 ? (
              <div className="buyer-tags">
                {marketViability.buyerDecisionMatrix.primaryBuyerTargets.map((b) => (
                  <span key={b} className="buyer-tag">{b}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Living Dossier Auto-Re-Scout Changelog */}
      {livingDossier ? (
        <details className="living-dossier-disclosure">
          <summary>
            <span className="living-dossier-badge">Living Dossier: {livingDossier.status === "live_verified" ? "Monitored updates" : livingDossier.status === "milestone_triggered" ? "Milestone Triggered" : "Update Pending"}</span>
            <span className="living-dossier-milestone">Latest Milestone: {livingDossier.latestMilestone || "Initial Scout Verification"}</span>
            <span className="living-dossier-toggle">View auto-re-scouting changelog <b>+</b></span>
          </summary>
          <div className="living-dossier-body">
            <p className="living-dossier-desc">
              Audience Take automated sensors continuously monitor YouTube view milestones, crowdfunding progress, and industry trade news to ensure intelligence never rots.
            </p>
            <ul className="living-dossier-list">
              {(livingDossier.changelog || []).map((entry, i) => (
                <li key={i}>
                  <time>{entry.date}</time>
                  <div>
                    <strong>{entry.milestone}</strong>
                    <p>{entry.impact}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ) : null}

      {/* YouTube Fandom DNA Breakdown */}
      {fandomDna ? (
        <div className="fandom-dna-grid">
          <div className="fandom-card">
            <span className="fandom-card-kicker">Community Obsessions</span>
            <h3>Character &amp; Lore Focus</h3>
            <ul>
              {(fandomDna.characterAndLoreObsessions || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="fandom-card">
            <span className="fandom-card-kicker">Monetization Propensity</span>
            <h3>Merchandise &amp; Physical Demand</h3>
            <ul>
              {(fandomDna.merchandiseDemandSignals || []).map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="fandom-card">
            <span className="fandom-card-kicker">Critical Reception</span>
            <h3>Tone, Music &amp; Writing</h3>
            <div className="reception-block">
              <strong>Praise</strong>
              <ul>
                {(fandomDna.toneAndWritingReception?.praise || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              {(fandomDna.toneAndWritingReception?.critiques || []).length > 0 ? (
                <>
                  <strong className="critique-subheading">Constructive Notes</strong>
                  <ul>
                    {(fandomDna.toneAndWritingReception?.critiques || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>

          <div className="fandom-card">
            <span className="fandom-card-kicker">Audience Cohort Comps</span>
            <h3>Demographic Affinity</h3>
            <div className="comps-tags-wrap">
              {fandomDna.demographicAndFandomComps && fandomDna.demographicAndFandomComps.length > 0 ? (
                fandomDna.demographicAndFandomComps.map((comp, idx) => (
                  <span key={idx} className="fandom-comp-pill">{comp}</span>
                ))
              ) : (
                <small className="fandom-pending-note">No comparative cohorts identified from comment corpus.</small>
              )}
            </div>
            <div className="anti-brigade-callout">
              <small>Comment sample observations:</small>
              <p>{fandomDna.audienceResonanceSummary || "Observations limited to sampled public commentary."}</p>
              {fandomDna.samplingLimitations ? (
                <small style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-subtle, #737373)", fontStyle: "italic" }}>
                  {fandomDna.samplingLimitations}
                </small>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
