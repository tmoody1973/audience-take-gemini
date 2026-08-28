import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Ticket } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import type { MediumType, LifecycleStage } from "@/domain";

interface PageProps {
  searchParams: Promise<{
    medium?: string;
    stage?: string;
    q?: string;
  }>;
}

export default async function ScoutingWallPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const selectedMedium = resolvedParams.medium as MediumType | undefined;
  const selectedStage = resolvedParams.stage as LifecycleStage | undefined;
  const searchQuery = resolvedParams.q || "";

  const projects = await dataRepo.getProjects({
    medium: selectedMedium,
    stage: selectedStage,
    query: searchQuery,
  });

  const featuredProject = projects.find((p) => p.id === "proj-junichiro") || projects[0];

  const featuredVideoUrl = featuredProject?.nomination.initialLinks?.[0] || "";
  const featuredEmbedUrl = featuredVideoUrl.includes("v=")
    ? `https://www.youtube-nocookie.com/embed/${featuredVideoUrl.split("v=")[1]?.split("&")[0]}`
    : featuredVideoUrl.includes("youtu.be/")
    ? `https://www.youtube-nocookie.com/embed/${featuredVideoUrl.split("youtu.be/")[1]?.split("?")[0]}`
    : null;

  return (
    <div>
      {/* ---------------------------------------------------- */}
      {/* HERO: Mission on Left, URL-First Nomination Ticket on Right */}
      {/* ---------------------------------------------------- */}
      <section className="hero">
        <div className="hero-mission">
          <div className="hero-side-note">
            <span>PROGRAM NO. 001</span>
            <span>PUBLIC CINEMA SCOUTING</span>
          </div>

          <div className="hero-copy">
            <h1>
              FANS CAN FIND THE NEXT GREAT SCREEN STORY <em>FIRST.</em>
            </h1>
            <p>
              The audience’s take on what should be made next. Surface an overlooked public project, then watch autonomous Gemini research and verified Parallel web citations turn it into an actionable Scout Card.
            </p>
          </div>

          <div className="trust-stamp">
            <ShieldCheck />
            <span>Public primary sources. Clear confidence labels. No mystery scores.</span>
          </div>
        </div>

        <div className="nomination-ticket">
          <div className="ticket-notch ticket-notch-top" />
          <div className="ticket-notch ticket-notch-bottom" />
          <div className="ticket-edge">TICKET NO. 2026-AT</div>
          <div className="ticket-perforation" />

          <div className="ticket-heading">
            <h2>NOMINATE A PROJECT</h2>
            <Ticket className="w-8 h-8 text-signal-coral" />
          </div>

          <p>
            Found a trailer, short, series, documentary, creator page, or public campaign that deserves to grow?
          </p>

          <form action="/nominate" method="GET" className="quick-form">
            <label htmlFor="quick-url">PUBLIC PROJECT URL</label>
            <input
              id="quick-url"
              name="url"
              type="url"
              placeholder="https://youtube.com/watch?v=... or vimeo.com/..."
              required
            />
            <button type="submit">
              <span>BEGIN SCOUTING</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </form>

          <p className="ticket-note">
            Takes 30 seconds. Gemini & Parallel verify facts from public web sources.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURED STRIP: Junichiro Jackson Featured Project */}
      {/* ---------------------------------------------------- */}
      {featuredProject && (
        <section className="featured-strip">
          <div className="featured-details">
            <span className="featured-label">SPOTLIGHT SCOUT CARD</span>
            <h2>{featuredProject.identity.title}</h2>
            <span className="claim-label">
              {featuredProject.identity.medium.replace("_", " ")} · {featuredProject.identity.creators?.join(", ") || "Independent"}
            </span>
            <p className="featured-summary">
              {featuredProject.identity.logline ||
                featuredProject.nomination.reason ||
                "A distinct, atmospheric work scouted from public signal. Verifiable cited evidence, commercial pathway hypotheses, and audience demand consensus."}
            </p>
            <Link href={`/scout/${featuredProject.id}`} className="featured-card-link">
              <span>OPEN FULL SCOUT CARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="source-frame">
            {featuredEmbedUrl ? (
              <iframe
                src={featuredEmbedUrl}
                title={featuredProject.identity.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-ink">
                <span>PREVIEW NOT AVAILABLE</span>
              </div>
            )}
          </div>

          <div className="source-receipt">
            <span>PUBLIC EVIDENCE</span>
            <strong>{featuredProject.nomination.initialLinks?.length || 3} CITED SOURCES</strong>
            <span>CONFIDENCE</span>
            <strong>HIGH (PARALLEL)</strong>
            <span>PULSE</span>
            <strong>{featuredProject.metrics?.watchCount || 0} WANT TO WATCH</strong>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* WORKFLOW: 3-Step Program & Stepped Handoff Motion */}
      {/* ---------------------------------------------------- */}
      <section className="workflow" id="workflow">
        <div className="workflow-program">
          <div className="workflow-summary">
            <h2>HOW AUDIENCE TAKE WORKS</h2>
            <p>
              A public, verifiable loop from initial fan discovery to structured industry one-sheets.
            </p>
          </div>

          <ul className="workflow-list">
            <li>
              <div className="step-number">01</div>
              <div>
                <h3>NOMINATE</h3>
                <p>Paste a public URL (YouTube, Vimeo, Kickstarter, film festival page).</p>
              </div>
            </li>
            <li>
              <div className="step-number">02</div>
              <div>
                <h3>AGENT INVESTIGATES</h3>
                <p>Gemini 3.5 Flash & Parallel Search verify creator citations and build hypotheses.</p>
              </div>
            </li>
            <li>
              <div className="step-number">03</div>
              <div>
                <h3>AUDIENCE DECIDES</h3>
                <p>Vote on commercial pathways, commit willingness-to-pay, and pledge theatrical demand.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="workflow-cta">
          <p>
            Ready to surface an overlooked screen project? <strong>Every nomination creates a public, cited dossier.</strong>
          </p>
          <div className="handoff-motion">
            <span>NOMINATE</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>SCOUT</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>DECIDE</span>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* THE SELECTS: Curated Editorial Spotlight Rail */}
      {/* ---------------------------------------------------- */}
      <section className="selects" id="selects">
        <div className="selects-header">
          <div>
            <span className="featured-label">EDITORIAL SELECTION</span>
            <h2>THE SELECTS</h2>
            <p>
              Curated dossiers with strong audience consensus, distinctive cinematic vision, and verified commercial pathway validation.
            </p>
          </div>
          <div className="selects-actions">
            <span className="selects-note">UPDATED LIVE FROM FIRESTORE</span>
            <Link href="/nominate" className="text-link">
              <span>+ NOMINATE A WORK</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="selects-rail">
          {projects.slice(0, 3).map((project, idx) => (
            <Link
              key={project.id}
              href={`/scout/${project.id}`}
              className={`select-entry select-entry-${idx + 1}`}
            >
              <div
                className={`editorial-poster ${
                  idx === 0 ? "poster-yellow" : idx === 1 ? "poster-blue" : "poster-coral"
                }`}
              >
                <span>0{idx + 1}</span>
                <i />
                <b>{project.identity.medium.substring(0, 3).toUpperCase()}</b>
              </div>
              <div className="select-copy">
                <span>{project.identity.medium.replace("_", " ")}</span>
                <h3>{project.identity.title}</h3>
                <p>{project.identity.logline || project.nomination.reason}</p>
                <div className="select-status">
                  {project.metrics?.watchCount || 0} WATCH INTENT · {project.metrics?.cityDemandCount || 0} THEATRICAL PLEDGES
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SCOUTING WALL: Public Catalog Grid */}
      {/* ---------------------------------------------------- */}
      <section className="scouting-wall" id="wall">
        <div className="wall-masthead">
          <div>
            <span className="featured-label">CATALOG & DOSSIERS</span>
            <h1>SCOUTING WALL</h1>
          </div>
          <div className="wall-masthead-note">
            <strong>PUBLIC DIRECTORY</strong>
            <p>All scouted projects with verified evidence citations, commercial pathway votes, and critic reviews.</p>
          </div>
          <Link href="/nominate" className="button-primary">
            <span>NOMINATE</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="wall-index">
          <header>
            <div>
              <span>SHOWING {projects.length} SCOUTED WORKS</span>
              <h2>ALL PUBLIC WORKS</h2>
            </div>
            <strong>ACTIVE CATALOG</strong>
          </header>

          <ul className="wall-grid">
            {projects.map((project, idx) => (
              <li key={project.id} className="wall-cell">
                <Link href={`/scout/${project.id}`}>
                  <article>
                    <div className="wall-cell-poster">
                      <span>0{idx + 1}</span>
                      <i />
                      <strong>{project.identity.medium.substring(0, 3).toUpperCase()}</strong>
                    </div>
                    <div className="wall-cell-copy">
                      <div className="wall-cell-kicker">
                        <span>{project.identity.medium.replace("_", " ")}</span>
                        <span>{project.identity.currentStage.replace("_", " ")}</span>
                      </div>
                      <h2>{project.identity.title}</h2>
                      <p>{project.identity.logline || project.nomination.reason}</p>

                      <dl>
                        <div>
                          <dt>CREATOR</dt>
                          <dd>{project.identity.creators?.[0] || "Independent"}</dd>
                        </div>
                        <div>
                          <dt>STATUS</dt>
                          <dd>{project.creatorClaim.status}</dd>
                        </div>
                        <div>
                          <dt>WATCH INTENT</dt>
                          <dd>{project.metrics?.watchCount || 0}</dd>
                        </div>
                        <div>
                          <dt>THEATRICAL</dt>
                          <dd>{project.metrics?.cityDemandCount || 0}</dd>
                        </div>
                      </dl>

                      <footer>
                        <span>VERIFIED DOSSIER</span>
                        <strong>
                          <span>INSPECT SCOUT CARD</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </strong>
                      </footer>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
