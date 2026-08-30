import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { dataRepo } from "@/services/firestore-repo";
import { SiteHeader } from "@/components/site-header";
import { ArrowIcon } from "@/components/icons";
import styles from "./creator.module.css";

export const metadata: Metadata = {
  title: "Creator Desk — Audience Take",
  description:
    "Find your scouted project, request verified stewardship, and turn audience signals into a clearer next move.",
  alternates: {
    canonical: "/creator",
  },
};

const CLAIMING_STEPS = [
  {
    step: "01",
    title: "FIND THE SCOUT CARD",
    body: "Match the public project to work you created or officially represent.",
  },
  {
    step: "02",
    title: "REQUEST STEWARDSHIP",
    body: "Share a project-connected email or public professional link for human review.",
  },
  {
    step: "03",
    title: "PUBLISH CREATOR UPDATES",
    body: "Add official progress and authorized media while the independent evidence record remains intact.",
  },
];

const PERMISSIONS_LIST = [
  "Publish official production updates and authorized media",
  "Inspect location-based audience requests for screening outreach",
  "Propose public trailers and supporting evidence for review",
  "Join audience conversations with a verified creator label",
];

const INDEPENDENCE_LIST = [
  "Creators cannot rewrite independent citations or research findings",
  "Private identity documents remain in secure server storage",
  "Material corrections create a visible version record",
  "Audience commitments and pathway votes remain separate and public",
];

export default async function CreatorDeskPage() {
  const projects = await dataRepo.getProjects();

  // Aggregate signals
  const totalProjects = projects.length;
  const verifiedProjects = projects.filter((p) => p.creatorClaim?.status === "verified").length;
  const totalWatchIntent = projects.reduce((acc, p) => acc + (p.metrics?.watchCount || 0), 0);
  const totalCityRequests = projects.reduce((acc, p) => acc + (p.metrics?.cityDemandCount || 0), 0);
  const totalPayIntent = projects.reduce((acc, p) => acc + (p.metrics?.payCount || 0), 0);

  return (
    <div className="site-wrapper">
      <SiteHeader />
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <main id="main-content" className={`${styles.page} paper-texture`}>
        {/* 1. CREATOR DESK HERO */}
        <section className={styles.heroBanner} aria-label="Creator Desk Overview">
          <span className={styles.heroEyebrow}>CREATOR STEWARDSHIP PROGRAM</span>
          <h1 className={styles.heroH1}>CREATOR DESK</h1>
          <p className={styles.heroBody}>
            Find your project, request verified stewardship, and turn audience signals into a clearer
            next move. The independent Scout Card stays independent.
          </p>

          <div className={styles.heroCtas}>
            <a href="#creator-projects" className={styles.primaryCta}>
              FIND YOUR PROJECT <ArrowIcon />
            </a>
            <a href="#creator-access" className={styles.secondaryCta}>
              HOW CLAIMING WORKS
            </a>
          </div>
        </section>

        {/* 2. HOW CLAIMING WORKS */}
        <section id="creator-access" className={styles.claimingSection} aria-labelledby="claiming-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>CREATOR ACCESS WORKFLOW</span>
            <h2 id="claiming-title" className={styles.sectionH2}>
              YOUR WORK. YOUR VERIFIED VOICE.
            </h2>
          </div>

          <div className={styles.claimingGrid}>
            {CLAIMING_STEPS.map((item) => (
              <div key={item.step} className={styles.claimingCard}>
                <span className={styles.stepBadge}>STEP {item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. COMMUNITY SIGNAL SNAPSHOT */}
        <section className={styles.signalsSnapshotSection} aria-labelledby="signals-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>AUDIENCE TELEMETRY</span>
            <h2 id="signals-title" className={styles.sectionH2}>
              WHAT AUDIENCES ARE SIGNALING
            </h2>
          </div>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>SCOUT CARDS</span>
              <span className={styles.metricValue}>{totalProjects}</span>
              <span className={styles.metricSublabel}>{verifiedProjects} creator-verified</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>WOULD WATCH</span>
              <span className={styles.metricValue}>{totalWatchIntent}</span>
              <span className={styles.metricSublabel}>Audience intent signals</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>BRING TO MY CITY</span>
              <span className={styles.metricValue}>{totalCityRequests}</span>
              <span className={styles.metricSublabel}>Location-based requests</span>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>WOULD PAY</span>
              <span className={styles.metricValue}>{totalPayIntent}</span>
              <span className={styles.metricSublabel}>Intent, not purchases</span>
            </div>
          </div>

          <div className={styles.signalQualificationBar}>
            Required notice: These are voluntary Audience Take intentions—not purchases, ticket
            sales, turnout guarantees, or a demand forecast.
          </div>
        </section>

        {/* 4. CREATOR PERMISSIONS & INDEPENDENCE BOUNDARIES */}
        <section className={styles.ledgerSection} aria-label="Governance and permissions">
          <div className={`${styles.ledgerPanel} ${styles.isPermissions}`}>
            <h3>AFTER VERIFICATION</h3>
            <ul>
              {PERMISSIONS_LIST.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={`${styles.ledgerPanel} ${styles.isIndependence}`}>
            <h3>THE SCOUT CARD STAYS INDEPENDENT</h3>
            <ul>
              {INDEPENDENCE_LIST.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. SCOUTED PROJECT DIRECTORY */}
        <section id="creator-projects" className={styles.directorySection} aria-labelledby="directory-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>SCOUTED PROJECT DIRECTORY</span>
            <h2 id="directory-title" className={styles.sectionH2}>
              FIND THE WORK YOU REPRESENT
            </h2>
            <p className={styles.heroBody} style={{ margin: "4px 0 0" }}>
              Open a Scout Card to inspect its evidence. If the project is yours, request stewardship
              from the Trust &amp; Ownership section.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateTitle}>NO SCOUTED PROJECTS YET</div>
              <p className={styles.emptyStateText}>
                No projects are currently published on the Scouting Wall. You can start the public
                record by nominating your work.
              </p>
              <Link href="/nominate" className={styles.primaryCta}>
                NOMINATE A PROJECT <ArrowIcon />
              </Link>
            </div>
          ) : (
            <div className={styles.projectList}>
              {projects.map((project) => {
                const claimStatus = project.creatorClaim?.status || "unclaimed";
                const isVerified = claimStatus === "verified";
                const isPending = claimStatus === "pending";

                const primaryHref = isVerified
                  ? `/projects/${project.id}/manage`
                  : `/scout/${project.id}#trust-and-ownership`;
                const primaryLabel = isVerified
                  ? "MANAGE UPDATES"
                  : isPending
                    ? "OPEN CLAIM SECTION"
                    : "REQUEST TO CLAIM";

                const mediumFormatted = (project.identity.medium || "film").replace(/_/g, " ");
                const stageFormatted = (project.identity.currentStage || "in_development").replace(
                  /_/g,
                  " ",
                );

                return (
                  <article key={project.id} className={styles.projectRow}>
                    <div className={styles.projectMain}>
                      <div className={styles.badgeGroup}>
                        <span className={styles.metaBadge}>{mediumFormatted}</span>
                        <span className={styles.metaBadge}>{stageFormatted}</span>

                        {isVerified ? (
                          <span className={`${styles.statusBadge} ${styles.statusVerified}`}>
                            VERIFIED CREATOR
                          </span>
                        ) : isPending ? (
                          <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                            CLAIM UNDER REVIEW
                          </span>
                        ) : (
                          <span className={`${styles.statusBadge} ${styles.statusUnclaimed}`}>
                            UNCLAIMED
                          </span>
                        )}
                      </div>

                      <h3 className={styles.projectTitle}>{project.identity.title}</h3>

                      {project.identity.creators && project.identity.creators.length > 0 && (
                        <div className={styles.creatorsLine}>
                          CREATOR(S): {project.identity.creators.join(", ")}
                        </div>
                      )}

                      {project.identity.logline && (
                        <p className={styles.logline}>{project.identity.logline}</p>
                      )}

                      <div className={styles.projectSignals}>
                        <div className={styles.signalItem}>
                          <span className={styles.signalDot} />
                          <span>{project.metrics?.watchCount || 0} Would Watch</span>
                        </div>
                        <div className={styles.signalItem}>
                          <span className={styles.signalDot} />
                          <span>{project.metrics?.payCount || 0} Would Pay</span>
                        </div>
                        <div className={styles.signalItem}>
                          <span className={styles.signalDot} />
                          <span>{project.metrics?.cityDemandCount || 0} Bring to City</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.projectActions}>
                      <Link
                        href={primaryHref}
                        className={`${styles.actionPrimary} ${
                          isVerified ? styles.actionPrimaryVerified : ""
                        }`}
                      >
                        {primaryLabel} <ArrowIcon />
                      </Link>
                      <Link href={`/scout/${project.id}`} className={styles.actionSecondary}>
                        VIEW SCOUT CARD
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Dedicated secondary tool callout for Trailer Critic */}
          <div className={styles.toolCallout}>
            <div className={styles.toolCalloutText}>
              CREATOR TOOL: Analyze public trailers and animatics with the multimodal engine.
            </div>
            <Link href="/critic" className={styles.toolCalloutLink}>
              Open Trailer Critic Studio →
            </Link>
          </div>
        </section>

        {/* 6. CLOSING NOMINATION CTA TICKET */}
        <section className={styles.closingTicket} aria-labelledby="closing-title">
          <span className={styles.closingEyebrow}>DO NOT SEE YOUR WORK?</span>
          <h2 id="closing-title" className={styles.closingH2}>
            GIVE IT A PUBLIC STARTING POINT.
          </h2>
          <p className={styles.closingBody}>
            Submit a public trailer, campaign, festival page, or creator site. Research begins before
            the claim, so the record stays independent.
          </p>
          <Link href="/nominate" className={styles.primaryCta}>
            NOMINATE YOUR PROJECT <ArrowIcon />
          </Link>
        </section>
      </main>
    </div>
  );
}
