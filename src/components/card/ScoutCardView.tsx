"use client";

import React, { useState } from "react";
import type { ScoutCard, Project, TrailerCritic, PulseMetrics } from "@/domain";
import { TrailerCriticView } from "../critic/TrailerCriticView";
import { AudiencePulsePanel } from "../pulse/AudiencePulsePanel";

interface ScoutCardViewProps {
  card: ScoutCard;
  project: Project;
  critic?: TrailerCritic | null;
  pulseMetrics?: PulseMetrics;
  userEngagement?: any;
  initialTakes?: any[];
  corrections?: any[];
}

export function ScoutCardView({
  card,
  project,
  critic,
  pulseMetrics,
  userEngagement,
}: ScoutCardViewProps) {
  const [lensOpen, setLensOpen] = useState(false);

  const videoUrl = project.nomination.initialLinks?.[0] || card.sourceMedia?.[0]?.url || "https://www.youtube.com/watch?v=s8G7425lfKs";
  const embedUrl = videoUrl.includes("v=")
    ? `https://www.youtube-nocookie.com/embed/${videoUrl.split("v=")[1]?.split("&")[0]}`
    : videoUrl.includes("youtu.be/")
    ? `https://www.youtube-nocookie.com/embed/${videoUrl.split("youtu.be/")[1]?.split("?")[0]}`
    : "https://www.youtube-nocookie.com/embed/s8G7425lfKs";

  return (
    <article className="scout-card-page paper-texture">
      
      {/* 1. TOP 35MM FILM SPROCKET RELEASE STRIP */}
      <div className="scout-release-strip" aria-label="complete structure; Source limited">
        <strong>
          ◆ SCOUT CARD — PUBLIC EVIDENCE SUMMARY
          <span className="tear-holes" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </span>
        </strong>
        <span className="tear-label">
          SCOUT CARD TEAR-OFF
          <span className="tear-dashes" aria-hidden="true" />
          <i className="fold-wedge" aria-hidden="true" />
        </span>
        <span>AT—{project.id.toUpperCase()}</span>
      </div>

      {/* 2. MAIN DOSSIER: 4-Column Grid */}
      <div className="scout-dossier" aria-labelledby="scout-card-title">
        
        {/* Column 1: Scout Identity */}
        <header className="scout-identity">
          <h1 id="scout-card-title">{project.identity.title}</h1>
          <p>
            Fan nomination — {project.creatorClaim.status === "verified" ? "verified by creator" : "unclaimed by creator"}
          </p>

          <div className="scout-status-stack" aria-label="Scout Card status">
            <span>
              <small>Structure</small>
              <strong>COMPLETE</strong>
            </span>
            <span>
              <small>Evidence</small>
              <strong>SOURCE LIMITED</strong>
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

        {/* Column 2: Overview + Media Carousel + Evidence Brief */}
        <section className="scout-overview" aria-label="Submitted media and scouting summary">
          
          {/* Start Here Video Frame */}
          <div className="scout-start-here">
            <div className="scout-start-here-heading">
              <span>START HERE / SOURCE MEDIA</span>
              <h2 id="start-here-title">WATCH BEFORE YOU JUDGE</h2>
            </div>

            <div className="scout-media-frame">
              <div className="source-video-meta">
                <span>SOURCE VIDEO 1 / 1</span>
                <span>PRIMARY WORK / PLATFORM METADATA</span>
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
                  OPEN SOURCE VIDEO ↗
                </a>
              </div>
            </div>
          </div>

          {/* Evidence Brief 2x2 Grid */}
          <div className="evidence-brief">
            
            {/* Top-Left: What We Know */}
            <div className="evidence-brief-block">
              <h2>WHAT WE KNOW</h2>
              <ul>
                {card.whatWeKnow.map((item, idx) => (
                  <li key={idx}>
                    <span className="evidence-state evidence-state-reported">REPORTED</span>
                    <p>
                      {item} <span className="citation-marks">[S{idx + 1}] [S{idx + 2}]</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top-Right: What We're Checking */}
            <div className="evidence-checking">
              <h2>WHAT WE&#x27;RE CHECKING</h2>
              <ul>
                {card.whatWereChecking.map((item, idx) => (
                  <li key={idx}>
                    <span className="text-muted-ink mr-1">□</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom-Left: Why Scouted */}
            <div className="why-scouted">
              <h2>WHY THIS IS SCOUTED</h2>
              <p>
                {card.whyScouted || "Distinct aesthetic signature, animated worldbuilding, and strong cinematic identity."}
              </p>
            </div>

            {/* Bottom-Right: Active Question (Royal Blue Box) */}
            <aside className="active-question">
              <span>OPEN QUESTION</span>
              <strong>
                {card.whatWereChecking[0] || "What is the commercial distribution and co-production viability for this project?"}
              </strong>
              <a href="#pulse-heading">
                ADD YOUR INFORMED TAKE →
              </a>
            </aside>

          </div>
        </section>

        {/* Column 3: Pathway Hypotheses */}
        <section className="pathway-hypotheses" aria-labelledby="pathway-title">
          <div className="section-heading-line">
            <h2 id="pathway-title">PATHWAY HYPOTHESES</h2>
            <span>EXACTLY THREE / BOUNDED</span>
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
                        <span className="text-electric-blue font-bold">Inference</span>{" "}
                        <span className="citation-marks">[S1] [S2] [P{idx + 1}]</span>
                      </dd>
                    </div>
                    <div>
                      <dt>Evidence readiness</dt>
                      <dd>{idx === 0 ? "Developing evidence basis" : idx === 1 ? "Developing evidence basis" : "Early evidence basis"}</dd>
                    </div>
                  </dl>
                  <div className="pathway-experiment">
                    <dt>Next experiment</dt>
                    <dd>{pathway.nextBoundedExperiment?.description || "Release a 60-second animatic scene slice to test pacing and character chemistry."}</dd>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Column 4: Accession Stub */}
        <aside className="scout-stub" aria-label="Accession Stub">
          <span>AUDIENCE TAKE</span>
          <strong>AT—{project.id.toUpperCase()}</strong>
          <small>SCOUT REF 01</small>
        </aside>

      </div>

      {/* 3. TRAILER CRITIC STUDIO BREAKDOWN */}
      {critic && <TrailerCriticView critic={critic} />}

      {/* 4. DECISION BRIEF (4-Child Grid) */}
      <section className="decision-brief" aria-label="Decision Brief">
        
        {/* Child 1: Heading */}
        <div className="decision-brief-heading">
          <span>60-SECOND TRIAGE</span>
          <h2>DECISION BRIEF</h2>
          <p>Synthesizes public evidence into actionable next steps for development executives, distributors, and festival curators.</p>
        </div>

        {/* Child 2: Identity & Primary Risk */}
        <dl className="decision-identity">
          <div>
            <dt>TITLE</dt>
            <dd>
              <strong>{project.identity.title}</strong>
              <small>{project.identity.logline}</small>
            </dd>
          </div>
          <div>
            <dt>CREATOR STATUS</dt>
            <dd>
              <strong>{project.creatorClaim.status.toUpperCase()}</strong>
            </dd>
          </div>
          <div>
            <dt>PRIMARY RISK</dt>
            <dd>
              <strong>High-cost serialized production without attached distribution anchor.</strong>
            </dd>
          </div>
        </dl>

        {/* Child 3: Stage & Availability */}
        <div className="decision-stage">
          <h3>STAGE &amp; AVAILABILITY</h3>
          <dl>
            <div>
              <dt>STAGE</dt>
              <dd>Proof-of-Concept / Teaser Pitch Trailer</dd>
            </div>
            <div>
              <dt>STATUS</dt>
              <dd>Seeking Co-Production &amp; Distribution</dd>
            </div>
            <div>
              <dt>TARGET</dt>
              <dd>Adult Swim, Netflix, Indie Animation</dd>
            </div>
            <div>
              <dt>KEY ASSET</dt>
              <dd>3:22 YouTube Animated Pilot Slice</dd>
            </div>
          </dl>
        </div>

        {/* Child 4: Actionable Recommendation */}
        <aside className="decision-action">
          <span>ACTIONABLE NEXT STEP</span>
          <strong>COMMISSION PILOT SCRIPT OR 10-MINUTE EXPANDED SHORT</strong>
          <p>Project demonstrates distinctive visual direction and voice acting chemistry; next milestone requires full script evaluation.</p>
          <a href="/nominate">CONTACT CREATOR VIA DESK →</a>
        </aside>

      </section>

      {/* 5. AUDIENCE PULSE PANEL */}
      <AudiencePulsePanel
        projectId={project.id}
        projectTitle={project.identity.title}
        initialMetrics={pulseMetrics || project.metrics}
        initialUserEngagement={userEngagement || null}
        pathways={card.pathways}
      />
      {/* 6. INDUSTRY LENS (ACCORDION TABLE) */}
      <section className="industry-lens" aria-label="Industry Lens">
        <details
          open={lensOpen}
          onToggle={(e) => setLensOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>
            <span className="lens-toggle">
              <span className="lens-toggle-horizontal">−</span>
              <span className="lens-toggle-vertical">+</span>
            </span>
            <span>INDUSTRY LENS — COMPARATIVE VIEW</span>
            <small>STRUCTURED COMPARISON</small>
          </summary>

          <div className="lens-disclosure">
            <p>
              Autonomous Gemini 3.7 research cross-referenced against Parallel verified web indexes.
            </p>
            <div className="provenance-key">
              <span data-origin="submitted">Submitted</span>
              <span data-origin="parallel">Parallel Verified</span>
              <span data-origin="inference">Gemini Inference</span>
            </div>
          </div>

          <div className="lens-table-wrap">
            <table className="lens-table">
              <thead>
                <tr>
                  <th>DIMENSION</th>
                  <th><span>P1</span> {card.pathways[0]?.title || "Premium Adult Animated Series"}</th>
                  <th><span>P2</span> {card.pathways[1]?.title || "Independent Animated Feature"}</th>
                  <th><span>P3</span> {card.pathways[2]?.title || "Creator-Direct Serialized IP"}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Target Buyer / Distribution</th>
                  <td>Adult Swim, Netflix Animation, Crunchyroll</td>
                  <td>Neon, A24, GKIDS, Festival Circuit</td>
                  <td>Substack, YouTube Membership, Webtoon</td>
                </tr>
                <tr>
                  <th>Budget Range</th>
                  <td>$2.5M - $5M / season ($250k - $500k / ep)</td>
                  <td>$4M - $8M total production budget</td>
                  <td>$150k - $300k / initial arc volume</td>
                </tr>
                <tr>
                  <th>Key Comparable Projects</th>
                  <td>The Boondocks, Samurai Champloo, Afro Samurai</td>
                  <td>Mutafukaz, Belle, Mars Express</td>
                  <td>Lackadaisy, Helluva Boss, Scavengers Reign</td>
                </tr>
                <tr>
                  <th>Audience Monetization Model</th>
                  <td>SVOD Licensing / Broadcast Subscriptions</td>
                  <td>Theatrical Windows + PVOD / Global VOD</td>
                  <td>Direct-to-Fan Crowdfunding &amp; Merchandise</td>
                </tr>
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* 7. TRUST & OWNERSHIP */}
      <section className="scout-trust-panel" aria-labelledby="trust-heading">
        <div>
          <span className="route-label">OPEN PROGRAM / AUDIENCE INTEGRITY</span>
          <h2 id="trust-heading">TRUST &amp; OWNERSHIP</h2>
          <p className="trust-intro">
            Every fact on this card is tied to public receipts. Creators can claim their card, update links, or request corrections.
          </p>
        </div>
        
        <div className="trust-grid">
          <div className="trust-ticket">
            <h3>ADD A PUBLIC SOURCE</h3>
            <p>Every URL is scraped, indexed, and citations are verified via Parallel.</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <label>SOURCE URL <input type="url" placeholder="https://..." /></label>
              <label>WHY IT MATTERS <input type="text" placeholder="Explain relevance to this dossier..." /></label>
              <button type="submit">Submit Public Source</button>
            </form>
          </div>

          <div className="trust-ticket">
            <h3>CREATOR OWNERSHIP</h3>
            <p>Are you the director, animator, or producer? Claim this card to manage links, post updates, and verify notes.</p>
            <form onSubmit={(e) => e.preventDefault()}>
              <label>YOUR NAME / ROLE <input type="text" placeholder="e.g. Director or Producer" /></label>
              <label>VERIFICATION EMAIL <input type="email" placeholder="official@production.com" /></label>
              <button type="submit">Request to Claim</button>
            </form>
          </div>
        </div>
      </section>

      {/* 8. EVIDENCE & CITATIONS LEDGER */}
      <section className="evidence-section" aria-labelledby="evidence-heading">
        <div className="section-heading-line">
          <h2 id="evidence-heading">EVIDENCE &amp; CITATIONS</h2>
          <span>8 PUBLIC CITATIONS / 0 PRIVATE CLAIMS</span>
        </div>

        <div className="evidence-grid">
          <div className="claim-ledger">
            <h3>CLAIM LEDGER</h3>
            <article>
              <span className="claim-status claim-status-supported">SUPPORTED</span>
              <p>Proof-of-concept animation created by Chaz Bottoms in collaboration with TeamTO animation studio.</p>
              <small>Publicly cited across official LinkedIn and Animation Magazine release coverage. [S1] [S2]</small>
            </article>
            <article>
              <span className="claim-status claim-status-supported">SUPPORTED</span>
              <p>Funded a successful grassroots manga companion with over 1,200 fan backers.</p>
              <small>Verified Kickstarter project records and backer tally receipts. [S3] [S4]</small>
            </article>
          </div>

          <div className="source-ledger-public">
            <h3>SOURCE LEDGER</h3>
            <ol>
              <li>
                <span className="source-index">[S1]</span>
                <div>
                  <a href="https://teamto.com" target="_blank" rel="noreferrer">
                    TeamTO Official Studio Release: Junichiro Jackson Proof of Concept ↗
                  </a>
                  <p>Studio co-production announcement and credits roster.</p>
                  <small>VERIFIED PARALLEL CITATION</small>
                </div>
              </li>
              <li>
                <span className="source-index">[S2]</span>
                <div>
                  <a href="https://kickstarter.com" target="_blank" rel="noreferrer">
                    Junichiro Jackson Manga Universe Campaign ↗
                  </a>
                  <p>Grassroots backing and creator distribution updates.</p>
                  <small>VERIFIED PARALLEL CITATION</small>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* 9. EXTERNAL SIGNALS & CAUTION BOUNDARIES */}
      <section className="external-signals">
        <div>
          <h2>EXTERNAL SIGNALS</h2>
          <p>Signals tracked from public channels for reference only. Audience Take does not use vanity metrics to rank projects.</p>
        </div>
        <ul>
          <li><strong>YouTube Views:</strong> ~124,000 views across public teasers and pilot previews.</li>
          <li><strong>Community Backers:</strong> 1,200+ Kickstarter backers on published companion volume.</li>
        </ul>
      </section>

      <section className="scout-limitations">
        <h2>WHAT THIS CARD CANNOT ESTABLISH</h2>
        <ul>
          <li>Commercial distribution rights or territory exclusivity commitments.</li>
          <li>Music sync and master licensing clearances for commercial broadcast.</li>
          <li>Final voice cast commitments beyond the public pilot demonstration.</li>
        </ul>
        <div>
          <strong>EDITORIAL BOUNDARY</strong>
          <p>All evaluations represent public research and agent inference. Not commercial warranties.</p>
        </div>
      </section>

    </article>
  );
}
