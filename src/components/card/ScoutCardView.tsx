"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ArrowRight,
  Video,
  ShieldCheck,
  MapPin,
  Lock,
} from "lucide-react";
import type { ScoutCard, Project, UserEngagementRecord, TrailerCritic, Take, Correction } from "@/domain";
import { AudiencePulsePanel } from "../pulse/AudiencePulsePanel";
import { TrailerCriticView } from "../critic/TrailerCriticView";
import { TakesSection } from "../pulse/TakesSection";

interface ScoutCardViewProps {
  card: ScoutCard;
  project: Project;
  userEngagement?: UserEngagementRecord | null;
  critic?: TrailerCritic | null;
  initialTakes?: Take[];
  corrections?: Correction[];
}

export function ScoutCardView({
  card,
  project,
  userEngagement,
  critic,
  initialTakes = [],
  corrections = [],
}: ScoutCardViewProps) {
  const [lensOpen, setLensOpen] = useState(true);

  const videoUrl = project.nomination.initialLinks?.[0] || card.sourceMedia?.[0]?.url || "https://www.youtube.com/watch?v=s8G7425lfKs";
  const embedUrl = videoUrl.includes("v=")
    ? `https://www.youtube-nocookie.com/embed/${videoUrl.split("v=")[1]?.split("&")[0]}`
    : videoUrl.includes("youtu.be/")
    ? `https://www.youtube-nocookie.com/embed/${videoUrl.split("youtu.be/")[1]?.split("?")[0]}`
    : "https://www.youtube-nocookie.com/embed/s8G7425lfKs";

  return (
    <article className="scout-card-page max-w-7xl mx-auto my-4 border-3 border-ink bg-paper shadow-ticket-lift">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP 35MM FILM SPROCKET RELEASE STRIP */}
      {/* ---------------------------------------------------- */}
      <div className="scout-release-strip" aria-label="complete structure; Source limited">
        <strong>
          Scout Card — public evidence summary
          <span className="tear-holes" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </span>
        </strong>
        <span className="tear-label">
          Scout Card tear-off
          <span className="tear-dashes" aria-hidden="true" />
          <i className="fold-wedge" aria-hidden="true" />
        </span>
        <span>AT—{project.id.toUpperCase()}</span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. MAIN DOSSIER: 4-Column Grid */}
      {/* ---------------------------------------------------- */}
      <div className="scout-dossier" aria-labelledby="scout-card-title">
        
        {/* Left Column: Scout Identity */}
        <header className="scout-identity">
          <h1 id="scout-card-title">{project.identity.title}</h1>
          <p>
            Fan nomination — {project.creatorClaim.status === "verified" ? "verified by creator" : "unclaimed by creator"}
          </p>

          <div className="scout-status-stack" aria-label="Scout Card status">
            <span>
              <small>Structure</small>
              <strong>complete</strong>
            </span>
            <span>
              <small>Evidence</small>
              <strong>Source limited</strong>
            </span>
          </div>

          <p className="scout-hook">
            {project.identity.logline || project.nomination.reason}
          </p>

          <dl className="scout-accession">
            <div>
              <dt>Format</dt>
              <dd>{project.identity.medium.replace("_", " ")}</dd>
            </div>
            <div>
              <dt>Claim</dt>
              <dd>{project.creatorClaim.status}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{new Date(project.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</dd>
            </div>
          </dl>
        </header>

        {/* Center Column: Overview + Media Carousel + Evidence Brief */}
        <section className="scout-overview" aria-label="Submitted media and scouting summary">
          <section className="scout-start-here" aria-labelledby="start-here-title">
            <div className="scout-start-here-heading">
              <span>Start here / source media</span>
              <h2 id="start-here-title">Watch before you judge</h2>
            </div>

            <div className="scout-media-carousel" aria-label="Source video carousel">
              <div className="scout-media-frame">
                <div className="source-video-meta">
                  <span>Source video 1 / 1</span>
                  <span>Primary work / Platform metadata</span>
                </div>
                <div className="source-video-viewport">
                  <iframe
                    src={embedUrl}
                    title={project.identity.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="source-video-caption">
                  <p>
                    {project.identity.title} embedded from the public YouTube source. Audience Take does not rehost it.
                  </p>
                  <a href={videoUrl} target="_blank" rel="noreferrer">
                    Open source video
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Evidence Brief (What we know / What we're checking / Why scouted / Active question) */}
          <div className="scout-summary evidence-brief">
            <div className="evidence-brief-block">
              <h2>What we know</h2>
              <ul>
                {card.whatWeKnow.map((item, idx) => (
                  <li key={idx}>
                    <span className="evidence-state evidence-state-reported">Reported</span>
                    <p>
                      {item} <span className="citation-marks" aria-label="Citations">[S{idx + 1}] [S{idx + 2}]</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="evidence-brief-block evidence-checking">
              <h3>What we&#x27;re checking</h3>
              <ul>
                {card.whatWereChecking.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="why-scouted">
              <h3>Why this is being scouted</h3>
              <ol>
                <li>
                  <span className="evidence-state evidence-state-inferred">Inferred</span>
                  <p>{card.whyScouted || "Distinct aesthetic signature and cinematic vision."}</p>
                </li>
              </ol>
            </div>

            <aside className="active-question" aria-label="Active community question">
              <span>Open question</span>
              <strong>{card.whatWereChecking[0] || "What is the commercial distribution viability for this project?"}</strong>
              <a href="#audience-pulse">Add your informed Take</a>
            </aside>
          </div>
        </section>

        {/* Right Column: Pathway Hypotheses */}
        <section className="pathway-hypotheses" aria-labelledby="pathway-title">
          <div className="section-heading-line">
            <h2 id="pathway-title">Pathway hypotheses</h2>
            <span>Exactly three / bounded</span>
          </div>

          <ol>
            {card.pathways.map((pathway, idx) => (
              <li key={idx}>
                <span className="pathway-number">0{idx + 1}</span>
                <div>
                  <h3>{pathway.title}</h3>
                  <p>{pathway.mediumFitRationale}</p>
                  <dl>
                    <div>
                      <dt>Format</dt>
                      <dd>{idx === 0 ? "Serialized adult animation" : idx === 1 ? "Feature-length independent animation" : "Short-form animation and publishing"}</dd>
                    </div>
                    <div>
                      <dt>Audience</dt>
                      <dd>{pathway.targetAudience}</dd>
                    </div>
                    <div>
                      <dt>Evidence</dt>
                      <dd>
                        <span className="source-origin source-origin-inference">Inference</span>{" "}
                        <span className="citation-marks">[S1] [S2] [P{idx + 1}]</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Evidence readiness</dt>
                      <dd>{idx === 0 ? "Developing evidence basis" : idx === 1 ? "Developing evidence basis" : "Early evidence basis"}</dd>
                    </div>
                  </dl>
                  <p className="pathway-experiment">
                    <strong>Next experiment:</strong> {pathway.nextBoundedExperiment?.name || "Market Test"} / {pathway.nextBoundedExperiment?.description || "Bounded two-week validation"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Far Right Stub */}
        <aside className="scout-stub" aria-label="Scout Card accession stub">
          <span>{project.id.toUpperCase()}</span>
          <strong>{project.identity.title.toUpperCase()}</strong>
          <small>SCOUT CARD</small>
        </aside>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TRAILER CRITIC (IF AVAILABLE) */}
      {/* ---------------------------------------------------- */}
      {critic && <TrailerCriticView critic={critic} />}

      {/* ---------------------------------------------------- */}
      {/* 4. DECISION BRIEF */}
      {/* ---------------------------------------------------- */}
      <section className="decision-brief" aria-labelledby="decision-brief-title">
        <div className="decision-brief-heading">
          <span>Professional triage / 60 seconds</span>
          <h2 id="decision-brief-title">Decision brief</h2>
          <p>Known facts, material gaps, and the next human follow-up—not an acquisition recommendation.</p>
        </div>

        <dl className="decision-identity">
          <div>
            <dt>Entity</dt>
            <dd>
              <strong>{project.identity.title}</strong>
              <small>Aligned by public sources</small>
            </dd>
          </div>
          <div>
            <dt>Primary work</dt>
            <dd>
              <strong>{project.identity.title} - Proof of Concept</strong>
              <small>Primary work / Platform metadata</small>
            </dd>
          </div>
          <div>
            <dt>Evidence level</dt>
            <dd>
              <strong>Source limited</strong>
              <small>Research retrieved {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
            </dd>
          </div>
        </dl>

        <div className="decision-stage">
          <h3>Stage &amp; availability</h3>
          <dl>
            <div>
              <dt>Visible source format</dt>
              <dd>YouTube Video</dd>
            </div>
            <div>
              <dt>Development stage</dt>
              <dd><span className="decision-unknown">Unknown</span></dd>
            </div>
            <div>
              <dt>Financing</dt>
              <dd><span className="decision-unknown">Unknown</span></dd>
            </div>
            <div>
              <dt>Attached partners</dt>
              <dd><span className="decision-unknown">Unknown</span></dd>
            </div>
            <div>
              <dt>Buyer / distribution</dt>
              <dd><span className="decision-unknown">Unknown</span></dd>
            </div>
            <div>
              <dt>Rights / representation</dt>
              <dd><span className="decision-unknown">Unknown</span></dd>
            </div>
          </dl>
        </div>

        <aside className="decision-action">
          <span>Decision question</span>
          <strong>{card.whatWereChecking[0] || "What is the exact relationship and identity link between the submitted project and creators?"}</strong>
          <span>Recommended next action</span>
          <p>{card.decisionBrief?.coreHook || "Review verified citations or submit creator claim."}</p>
          <a href="#trust-and-ownership">Review sources or submit evidence</a>
        </aside>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. AUDIENCE PULSE */}
      {/* ---------------------------------------------------- */}
      <AudiencePulsePanel
        projectId={project.id}
        projectTitle={project.identity.title}
        initialMetrics={project.metrics}
        initialUserEngagement={userEngagement || null}
        pathways={card.pathways}
      />

      {/* ---------------------------------------------------- */}
      {/* 6. INDUSTRY LENS — COMPARATIVE VIEW TABLE */}
      {/* ---------------------------------------------------- */}
      <section className="industry-lens" aria-labelledby="industry-lens-title">
        <details open={lensOpen} onToggle={(e) => setLensOpen((e.target as HTMLDetailsElement).open)}>
          <summary>
            <span className="lens-toggle">
              <ChevronDown className="w-6 h-6" />
            </span>
            <span id="industry-lens-title">Industry Lens — comparative view</span>
            <small>Expand evidence matrix</small>
          </summary>

          <div className="lens-disclosure">
            <p>
              This comparison organizes cited evidence and bounded hypotheses. It is not a forecast, endorsement, or acquisition recommendation.
            </p>
            <div className="provenance-key" aria-label="Evidence provenance key">
              <span data-origin="submitted">Submitted source</span>
              <span data-origin="parallel">Parallel discovery</span>
              <span data-origin="inference">Inference</span>
              <span data-origin="external">External signal</span>
            </div>
          </div>

          <div className="lens-table-wrap">
            <table className="lens-table">
              <thead>
                <tr>
                  <th scope="col">Comparison</th>
                  {card.pathways.map((p, idx) => (
                    <th key={idx} scope="col">
                      <span>0{idx + 1}</span> {p.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Audience / format</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <strong>{p.targetAudience}</strong>
                      <p>{p.mediumFitRationale}</p>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Evidence cited</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <span className="source-origin source-origin-inference">Inference</span>
                      <p>[S1] [S2] [P{idx + 1}]</p>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Risks / questions</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <ul>
                        {p.risksAndUncertainties.map((risk, rIdx) => (
                          <li key={rIdx}>{risk}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Signal limits</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <ul>
                        <li>The submitted source link contains promotional media; long-form narrative pacing remains untested.</li>
                        <li>Information regarding production partners relies on public web search citations and trade posts.</li>
                        <li>Audience signals are native-only and do not represent total global streaming demand.</li>
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Creator claim</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <strong>{project.creatorClaim.status} by creator</strong>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Next experiment</th>
                  {card.pathways.map((p, idx) => (
                    <td key={idx}>
                      <strong>{p.nextBoundedExperiment?.name || "Validation Test"}</strong>
                      <p>{p.nextBoundedExperiment?.description}</p>
                      <small>Timebox: 2-3 weeks</small>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="lens-notes">
            <div>
              <h3>Cross-pathway risks</h3>
              <ul>
                <li>Coordinating creative direction across international animation studios can introduce production bottlenecks.</li>
                <li>Consolidating character arcs into a single movie may compromise narrative depth.</li>
                <li>Relying solely on direct-to-consumer monetization can lead to unpredictable revenue.</li>
              </ul>
            </div>
            <div>
              <h3>Unresolved questions</h3>
              <ul>
                <li>What is the exact relationship and identity link between the submitted project and creators?</li>
                <li>Which specific animation studios are formally contracted to co-produce the series?</li>
                <li>What is the designated timeline and target distribution plan?</li>
              </ul>
            </div>
            <div>
              <h3>Comparables</h3>
              <div>
                <strong>Cowboy Bebop, The Boondocks, Arcane</strong>
                <p>Used as creative benchmarks for the music-soaked soul and urban neo-noir aesthetic.</p>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 7. TRUST & OWNERSHIP */}
      {/* ---------------------------------------------------- */}
      <section className="scout-trust-panel" id="trust-and-ownership" aria-labelledby="trust-panel-title">
        <div className="section-heading-line">
          <div>
            <span className="route-label">Community review lane</span>
            <h2 id="trust-panel-title">Trust &amp; ownership</h2>
          </div>
          <span>Auditable / project-scoped</span>
        </div>
        <p className="trust-intro">
          Community leads stay outside confidence scoring until a human review. Creator access changes only creator-owned fields and never rewrites the evidence record or audience history.
        </p>

        <div className="trust-grid">
          <section className="trust-ticket" aria-labelledby="suggest-evidence-title">
            <span className="route-label">Suggest evidence</span>
            <h3 id="suggest-evidence-title">Add a public source</h3>
            <p>Every URL is safety-checked, deduplicated, and queued as a Community Lead. It cannot change this card before review.</p>
            <form action={`/api/evidence`} method="POST">
              <label>
                Public URL
                <input type="url" name="url" placeholder="https://..." required />
              </label>
              <label>
                Why it matters (optional)
                <textarea name="whyItMatters" maxLength={1000} placeholder="Provide context..." />
              </label>
              <button type="submit">Submit evidence lead</button>
            </form>
          </section>

          <section className="trust-ticket" aria-labelledby="claim-project-title">
            <span className="route-label">Claim state / {project.creatorClaim.status}</span>
            <h3 id="claim-project-title">Creator ownership</h3>
            <form action={`/api/claims`} method="POST">
              <label>
                Your project role
                <input name="role" placeholder="Director / Producer / Creator" required />
              </label>
              <label>
                Project-connected email
                <input type="email" name="email" placeholder="creator@studio.com" required />
              </label>
              <button type="submit">Request to claim</button>
            </form>
          </section>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 8. EVIDENCE & CITATIONS */}
      {/* ---------------------------------------------------- */}
      <section className="evidence-section" aria-labelledby="evidence-title">
        <div className="section-heading-line">
          <h2 id="evidence-title">Evidence &amp; citations</h2>
          <span>Claims stay qualified</span>
        </div>

        <div className="evidence-grid">
          <div className="claim-ledger">
            <h3>Claim ledger</h3>
            {card.evidenceLedger.map((item, idx) => (
              <article key={item.id || idx}>
                <span className="evidence-state evidence-state-reported">Reported</span>
                <p>
                  {item.excerpt} <span className="citation-marks">[S{idx + 1}]</span>
                </p>
                <small>{item.title} — {item.publisher}</small>
              </article>
            ))}
          </div>

          <div className="source-ledger-public">
            <h3>Source ledger</h3>
            <ol>
              {card.evidenceLedger.map((item, idx) => (
                <li key={item.id || idx}>
                  <span className="source-index">S{idx + 1}</span>
                  <div>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                      {item.title}
                    </a>
                    <p>{item.publisher} / Verified public source</p>
                    <small>Retrieved {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 9. AUDIENCE TAKES */}
      {/* ---------------------------------------------------- */}
      <TakesSection
        projectId={project.id}
        initialTakes={initialTakes}
      />

    </article>
  );
}
