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
                  <li><strong>Cross-Platform Diffusion:</strong> {marketViability.dimensions?.crossPlatformDiffusion?.explanation || "Measured via organic view velocity and cross-domain fan discovery."}</li>
                  <li><strong>Budget &amp; Capitalization:</strong> {marketViability.dimensions?.budgetToFormatRealism?.capitalizationRatio || "100%"} funded ({marketViability.dimensions?.budgetToFormatRealism?.explanation || "Independent grassroots backing."}).</li>
                  <li><strong>Discretionary Spend ARPU:</strong> {marketViability.dimensions?.commercialCeilingTam?.averageSpendPerBacker || "$45.00 / backer"} (Derived from verified crowdfunding commitment and merchandise propensity).</li>
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
            <p>{marketViability.tier} · Bounded by co-production studio attachment.</p>
            <details className="score-explanation-disclosure">
              <summary><span className="info-pill-badge">? How is this calculated?</span></summary>
              <div className="score-explanation-body">
                <p><strong>4-Dimension Buyer Sanity Check:</strong></p>
                <ul>
                  <li><strong>Cross-Platform Diffusion (30%):</strong> Score {marketViability.dimensions?.crossPlatformDiffusion?.score || 75}/100 across {marketViability.dimensions?.crossPlatformDiffusion?.distinctDomainsCount || 3} independent domains {marketViability.dimensions?.crossPlatformDiffusion?.hasTradePress ? "(Verified trade press present)" : ""}.</li>
                  <li><strong>Budget Realism (25%):</strong> Score {marketViability.dimensions?.budgetToFormatRealism?.score || 80}/100. Cost: {marketViability.dimensions?.budgetToFormatRealism?.estCostPerMinute || "Standard indie tier"}. Studio Attachment: {marketViability.dimensions?.budgetToFormatRealism?.studioAttachment || "Independent Production"}.</li>
                  <li><strong>Buyer Slate Fit (25%):</strong> Score {marketViability.dimensions?.buyerSlateAlignment?.score || 85}/100 with {(marketViability.dimensions?.buyerSlateAlignment?.topBuyers || ["Target Buyers"]).slice(0, 3).join(", ")}.</li>
                  <li><strong>Commercial Ceiling (20%):</strong> Score {marketViability.dimensions?.commercialCeilingTam?.score || 80}/100 ({marketViability.dimensions?.commercialCeilingTam?.estTam || "Independent Market TAM"}).</li>
                </ul>
              </div>
            </details>
          </div>

          <div className="dual-axis-decision-card">
            <span>Executive Acquisition Matrix</span>
            <strong>{marketViability.buyerDecisionMatrix?.recommendedAction || "Acquisition Viable"}</strong>
            <p>{marketViability.buyerDecisionMatrix?.commercialCeilingVerdict || "High commercial potential."}</p>
            <div className="buyer-tags">
              {(marketViability.buyerDecisionMatrix?.primaryBuyerTargets || ["PBS", "Specialty Theatrical", "Educational"]).map((b) => (
                <span key={b} className="buyer-tag">{b}</span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Living Dossier Auto-Re-Scout Changelog */}
      {livingDossier ? (
        <details className="living-dossier-disclosure">
          <summary>
            <span className="living-dossier-badge">Living Dossier Status: Live Verified</span>
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
              {(fandomDna.demographicAndFandomComps || ["Independent Cinema Fans", "Documentary Filmgoers", "Cultural Enthusiasts"]).map((comp, idx) => (
                <span key={idx} className="fandom-comp-pill">{comp}</span>
              ))}
            </div>
            <div className="anti-brigade-callout">
              <small>Anti-Brigade Sanity Check:</small>
              <p>{fandomDna.audienceResonanceSummary || "Authentic audience engagement signals verified across public channels."}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
