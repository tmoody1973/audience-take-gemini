import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { ArrowIcon } from "@/components/icons";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About — Public Scouting for Screen Stories",
  description:
    "Audience Take helps fans, creators, and industry professionals discover overlooked films and series, connect their public evidence, and identify a credible next step.",
  alternates: {
    canonical: "/about",
  },
};

const PROOF_POINTS = [
  {
    metric: "13.8% of TV watch-time",
    description:
      "Went to YouTube in May 2026—more than any other media distributor Nielsen measured.",
    sourceLabel: "Nielsen Gauge (May 2026)",
    sourceUrl: "https://content.nielsen.com/gauge-and-glossary",
  },
  {
    metric: "56% of Gen Z",
    description:
      "Surveyed by Deloitte said social media content was more relevant to them than traditional television and movies.",
    sourceLabel: "Deloitte Digital Media Trends (2025)",
    sourceUrl:
      "https://www.deloitte.com/us/en/insights/industry/technology/digital-media-trends-consumption-habits-survey/2025.html",
  },
  {
    metric: "13,900+ Funded Projects",
    description:
      "Have been successfully funded according to Kickstarter's film page, demonstrating the scale of public participation in getting screen work made.",
    sourceLabel: "Kickstarter Film (Platform-Reported)",
    sourceUrl: "https://www.kickstarter.com/pages/film",
    note: "Platform-reported historical totals, not a live market count.",
  },
];

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Someone finds the project",
    body: "A fan or creator submits public links from YouTube, Kickstarter, Seed&Spark, a festival page, or creator site—and explains why it deserves attention.",
  },
  {
    num: "02",
    title: "Research agents connect evidence",
    body: "Parallel searches the current public web and reads the supplied sources. Gemini helps organize findings, qualify what is supported, and identify material unknowns.",
  },
  {
    num: "03",
    title: "Scout Card makes project legible",
    body: "The public card brings provenance, citations, limitations, audience fit, public signals, and three realistic pathways into one versioned record.",
  },
  {
    num: "04",
    title: "People contribute more than a like",
    body: "Scouts publish reasoned Takes, follow projects, suggest missing evidence, express pathway preferences, or make defined commitments like 'Would Watch' or 'Bring It to My City.'",
  },
  {
    num: "05",
    title: "The project builds a history",
    body: "Creator updates, reviewed evidence, audience experiments, and documented outcomes accumulate over time without erasing who found the project or what was known earlier.",
  },
];

const AI_STAGES = [
  {
    num: "01",
    title: "Read the source",
    desc: "Inspects submitted public URLs, creator text, and video metadata.",
  },
  {
    num: "02",
    title: "Search with Parallel",
    desc: "Searches the live public web for festival listings, reviews, and trade coverage.",
  },
  {
    num: "03",
    title: "Organize with Gemini",
    desc: "Qualifies findings, separates facts from inference, and structures 3 pathways.",
  },
  {
    num: "04",
    title: "Review creative material",
    desc: "Multimodal vision & audio inspection of public trailers and animatics when supported.",
  },
  {
    num: "05",
    title: "Validate evidence & policy",
    desc: "Enforces citation safety, SSRF protection, and schema validation.",
  },
  {
    num: "06",
    title: "Publish versioned Card",
    desc: "Emits the public Scout Card with open provenance and citation ledger.",
  },
  {
    num: "07",
    title: "Audio Brief & Updates",
    desc: "Produces optional multi-speaker audio dossier and monitors milestone developments.",
  },
];

const SOCIAL_SIGNALS = [
  {
    name: "Nomination",
    meaning: "“This public project deserves a closer look.”",
    notProof: "Creator approval or production readiness",
  },
  {
    name: "Structured Take",
    meaning: "A person's reasoned opinion about the work and its possibilities",
    notProof: "A verified research finding",
  },
  {
    name: "Community Lead",
    meaning: "A public source suggested for research review",
    notProof: "That the source is verified until reviewed",
  },
  {
    name: "Commitment",
    meaning: "A defined, voluntary expression of intent (e.g. Would Watch, Bring to My City)",
    notProof: "A purchase, ticket sale, turnout, or guaranteed demand forecast",
  },
  {
    name: "Creator Update",
    meaning: "Information published by a verified creator representative",
    notProof: "Independent verification of every claim",
  },
  {
    name: "Audience Pulse",
    meaning: "A summary of native participation with sample limits and time window",
    notProof: "The complete audience or outside-platform activity",
  },
  {
    name: "Outcome",
    meaning: "A documented milestone (festival selection, distribution, next chapter)",
    notProof: "Proof that one earlier signal caused it",
  },
];

const COMMITMENTS = [
  "The project comes before the personality.",
  "Early insight matters more than follower count.",
  "Evidence, opinion, intent, and outcomes keep separate labels.",
  "Missing information stays unknown; it is not filled with confidence theater.",
  "Creators retain their voice and can correct creator-owned information without erasing history.",
  "AI supports research and reasoning; people make creative and professional decisions.",
  "No project receives a mystery greenlight score.",
];

export default function AboutPage() {
  return (
    <div className="site-wrapper">
      <SiteHeader />
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <main id="main-content" className={`${styles.page} paper-texture`}>
        {/* 1. HERO SECTION */}
        <section className={styles.heroSection} aria-label="About Audience Take overview">
          <div className={styles.heroLeft}>
            <div>
              <span className={styles.eyebrow}>PUBLIC SCOUTING FOR SCREEN STORIES</span>
              <h1 className={styles.heroH1}>The next great screen story may already be online.</h1>
              <p className={styles.heroSub}>
                Audience Take helps people find overlooked films, series, shorts, documentaries, and
                creator-led projects—then turns their scattered public story into one cited Scout
                Card people can understand and act on.
              </p>
            </div>
            <div>
              <div className={styles.heroCtas}>
                <Link href="/nominate" className={styles.primaryCta}>
                  Scout a project <ArrowIcon />
                </Link>
                <Link href="/projects" className={styles.secondaryCta}>
                  Explore the Scouting Wall
                </Link>
              </div>
              <div className={styles.heroTrustLine}>
                Public sources. Clear labels. No mystery score.
              </div>
            </div>
          </div>

          {/* Persona In-Page Navigation Directory */}
          <div className={styles.heroRight}>
            <span className={styles.directoryLabel}>FIND YOUR WAY IN</span>
            <nav className={styles.personaDirectory} aria-label="About page persona directory">
              <a href="#public-visitor" className={styles.directoryLink}>
                <span>I want to discover</span>
                <span>→</span>
              </a>
              <a href="#fan-scout" className={styles.directoryLink}>
                <span>I found something</span>
                <span>→</span>
              </a>
              <a href="#creator" className={styles.directoryLink}>
                <span>I made something</span>
                <span>→</span>
              </a>
              <a href="#industry" className={styles.directoryLink}>
                <span>I scout emerging work</span>
                <span>→</span>
              </a>
            </nav>
          </div>
        </section>

        {/* 2. RESEARCH PROOF STRIP */}
        <section className={styles.shiftSection} aria-labelledby="shift-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>THE AUDIENCE IS ALREADY LOOKING</span>
            <h2 id="shift-title" className={styles.sectionH2}>
              Attention moved. Discovery should move with it.
            </h2>
            <p className={styles.sectionIntro}>
              Promising filmmakers no longer wait for one doorway. They release proof-of-concept
              shorts on YouTube, build series in public, gather early supporters on Kickstarter and
              Seed&Spark, and develop an audience one project at a time. The problem is not a lack
              of talent. It is that the evidence is fragmented—and the right people may never see
              the whole picture. Audience Take gives that work somewhere credible to go.
            </p>
          </div>

          <div className={styles.proofGrid}>
            {PROOF_POINTS.map((proof, idx) => (
              <div key={idx} className={styles.proofCard}>
                <div>
                  <div className={styles.proofMetric}>{proof.metric}</div>
                  <p>{proof.description}</p>
                </div>
                <div>
                  <a
                    href={proof.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.proofSource}
                  >
                    Source: {proof.sourceLabel} ↗
                  </a>
                  {proof.note ? <div className={styles.proofNote}>{proof.note}</div> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. MISSION SECTION */}
        <section className={styles.missionSection} aria-labelledby="mission-title">
          <div>
            <span className={styles.sectionLabel}>WHY WE EXIST</span>
            <h2 id="mission-title" className={styles.sectionH2}>
              Discovery should not begin with permission.
            </h2>
            <p className={styles.sectionIntro}>
              Audiences often recognize an original voice before an institution does. They share the
              short, back the campaign, follow the series, and tell someone else, “You need to see
              this.” But that early belief usually disappears into views, comments, campaign pages,
              and disconnected links. It rarely becomes a record that helps the project move forward.
              Audience Take turns that moment of discovery into something durable: a public scouting
              record showing what the project is, why someone cared, what the evidence supports, how
              people are responding, and what could be tested next.
            </p>
          </div>
          <blockquote className={styles.missionQuote}>
            “Great filmmakers are already creating in public. Their audiences often recognize them
            before the industry does.”
          </blockquote>
        </section>

        {/* 4. FIVE-STEP PROCESS */}
        <section className={styles.processSection} aria-labelledby="process-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>FROM ONE LINK TO A CREDIBLE NEXT STEP</span>
            <h2 id="process-title" className={styles.sectionH2}>
              One discovery. A clearer story.
            </h2>
          </div>

          <ol className={styles.processList}>
            {PROCESS_STEPS.map((step) => (
              <li key={step.num} className={styles.processItem}>
                <span className={styles.processStepNum}>STAGE {step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>

          <div className={styles.processTrustNote}>
            AI helps organize the public record. It does not decide which story deserves to exist.
          </div>
        </section>

        {/* 5. FOUR PERSONA BANDS */}
        <section className={styles.personasContainer} aria-label="Persona paths">
          {/* Persona 1: Public Visitor */}
          <article id="public-visitor" className={`${styles.personaBand} ${styles.isVisitor}`}>
            <div className={styles.personaContent}>
              <div>
                <span className={styles.sectionLabel}>I&apos;M HERE TO DISCOVER</span>
                <h2 className={styles.sectionH2}>Browse before you believe.</h2>
                <p className={styles.sectionIntro}>
                  Explore emerging screen projects without signing in. Open the original sources,
                  inspect the citations, compare three possible pathways, listen to a Scout Brief
                  when available, and see exactly where the evidence ends. You do not have to trust
                  a ranking or an unexplained recommendation. Audience Take shows its work.
                </p>
                <div className={styles.personaFooter}>
                  <Link href="/projects" className={styles.secondaryCta}>
                    Browse Scout Cards →
                  </Link>
                  <span className={styles.personaSupportLine}>
                    No sign-in required to explore public cards.
                  </span>
                </div>
              </div>
              <div className={styles.personaFeatures}>
                <h4>What you get</h4>
                <ul>
                  <li>A direct path back to the original project</li>
                  <li>Cited facts separated from inference and fan opinion</li>
                  <li>Visible creator-claim and project-status labels</li>
                  <li>Honest gaps when the public record is incomplete</li>
                </ul>
              </div>
            </div>
          </article>

          {/* Persona 2: Fan Scout */}
          <article id="fan-scout" className={`${styles.personaBand} ${styles.isFan}`}>
            <div className={styles.personaContent}>
              <div>
                <span className={styles.sectionLabel}>I FOUND SOMETHING</span>
                <h2 className={styles.sectionH2}>You found it early. Help it get a fair look.</h2>
                <p className={styles.sectionIntro}>
                  Maybe it was a short with a world bigger than its runtime. A web series with a
                  devoted following. A crowdfunding campaign with a story that stayed with you.
                  Audience Take gives your discovery more weight than a repost. Nominate the public
                  project, explain what you noticed, and help build a useful record around what it
                  could become. Your value is not how many followers you have. It is the care,
                  context, evidence, and early conviction you contribute.
                </p>
                <div className={styles.personaFooter}>
                  <Link href="/nominate" className={styles.primaryCta}>
                    Nominate what you found <ArrowIcon />
                  </Link>
                  <span className={styles.personaSupportLine}>
                    Fans scout. Creators speak for their own projects.
                  </span>
                </div>
              </div>
              <div className={styles.personaFeatures}>
                <h4>What you can do</h4>
                <ul>
                  <li>Nominate a film, series, short, documentary, or campaign</li>
                  <li>Explain why it deserves attention and who might care</li>
                  <li>Add a structured Take instead of a disposable comment</li>
                  <li>Suggest missing public evidence citations</li>
                  <li>Make an honest, clearly defined audience commitment</li>
                  <li>Build a visible track record of projects you recognized early</li>
                </ul>
              </div>
            </div>
          </article>

          {/* Persona 3: Filmmakers & Creators */}
          <article id="creator" className={`${styles.personaBand} ${styles.isCreator}`}>
            <div className={styles.personaContent}>
              <div>
                <span className={styles.sectionLabel}>I MADE SOMETHING</span>
                <h2 className={styles.sectionH2}>
                  Bring the whole public story of your project into focus.
                </h2>
                <p className={styles.sectionIntro}>
                  Your work may already live across a trailer, a campaign, festival coverage,
                  social posts, interviews, and supportive comments. You should not have to rebuild
                  that history every time someone asks what the project is—or why it matters. An
                  Audience Take Scout Card connects the public evidence while keeping your voice,
                  ownership, and project status clearly labeled. Claiming a card lets you correct
                  creator-owned information, add authorized context, and share updates without
                  erasing the fan who found the work or the evidence that came before.
                </p>
                <div className={styles.personaFooter}>
                  <Link href="/creator" className={styles.secondaryCta}>
                    Visit the Creator Desk →
                  </Link>
                  <span className={styles.personaSupportLine}>
                    An unclaimed card never implies creator approval or participation.
                  </span>
                </div>
              </div>
              <div className={styles.personaFeatures}>
                <h4>What you get</h4>
                <ul>
                  <li>One credible home for a fragmented public project history</li>
                  <li>
                    Clear separation between statements, evidence, opinion, and AI inference
                  </li>
                  <li>Three bounded pathways—not a fake prediction of success</li>
                  <li>Meaningful audience signals shown with definitions and limitations</li>
                  <li>Transparent corrections and version history</li>
                  <li>A next experiment designed to produce useful evidence</li>
                </ul>
              </div>
            </div>
          </article>

          {/* Persona 4: Industry Professionals */}
          <article id="industry" className={`${styles.personaBand} ${styles.isIndustry}`}>
            <div className={styles.personaContent}>
              <div>
                <span className={styles.sectionLabel}>I&apos;M LOOKING FOR EMERGING WORK</span>
                <h2 className={styles.sectionH2}>
                  Find emerging projects with the receipts attached.
                </h2>
                <p className={styles.sectionIntro}>
                  The next distinctive filmmaker may already be testing a voice, format, world, or
                  audience in public. Audience Take helps producers, development teams,
                  programmers, distributors, exhibitors, managers, and researchers examine that
                  work without mistaking online attention for readiness. Each Scout Card separates
                  what is observed from what is inferred. You can see source history, creator-claim
                  status, strongest evidence, contradictions, audience signals, and open questions
                  before deciding whether deeper human attention is warranted.
                </p>
                <div className={styles.personaFooter}>
                  <Link
                    href="/projects/junichiro-live-project#industry-lens-title"
                    className={styles.secondaryCta}
                  >
                    Open the Industry Lens →
                  </Link>
                  <span className={styles.personaSupportLine}>
                    Audience Take supports diligence. It does not predict deals or rights availability.
                  </span>
                </div>
              </div>
              <div className={styles.personaFeatures}>
                <h4>What you get</h4>
                <ul>
                  <li>A concise project and provenance brief</li>
                  <li>Current public-web research with direct citations</li>
                  <li>Audience signals separated by meaning, sample, and source</li>
                  <li>Material unknowns highlighted instead of synthetic certainty</li>
                  <li>Three pathways with evidence, risks, and next questions</li>
                  <li>A bounded experiment that can reduce uncertainty</li>
                </ul>
              </div>
            </div>
          </article>
        </section>

        {/* 6. WHAT A SCOUT CARD IS / IS NOT */}
        <section className={styles.ledgerSection} aria-labelledby="ledger-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>THE SHARED OBJECT</span>
            <h2 id="ledger-title" className={styles.sectionH2}>
              A project record, not a popularity contest.
            </h2>
            <p className={styles.sectionIntro}>
              A Scout Card brings different kinds of information together without pretending they
              mean the same thing.
            </p>
          </div>

          <div className={styles.ledgerGrid}>
            <div className={`${styles.ledgerCol} ${styles.isShows}`}>
              <h3>A Scout Card shows:</h3>
              <ul>
                <li>Published public evidence and where it came from</li>
                <li>Creator-provided information when the creator is verified</li>
                <li>Agent-supported synthesis and clearly marked inference</li>
                <li>Audience Take-native Takes, preferences, and commitments</li>
                <li>Missing, conflicting, or unresolved information</li>
                <li>Three realistic development or release pathways</li>
                <li>The most useful next experiment</li>
              </ul>
            </div>

            <div className={`${styles.ledgerCol} ${styles.isDoesNot}`}>
              <h3>A Scout Card does not claim:</h3>
              <ul>
                <li>That likes, views, or pledges equal market demand</li>
                <li>That a fan nomination represents the creator</li>
                <li>That AI can greenlight a film or series</li>
                <li>That a studio or streamer is interested without direct evidence</li>
                <li>That public info answers private questions about rights or financing</li>
              </ul>
            </div>
          </div>

          <div className={styles.pullQuoteBar}>
            “Popularity can attract attention. Evidence helps people decide what attention is worth.”
          </div>
        </section>

        {/* 7. AI AGENTS CONTACT STRIP & BOUNDARIES */}
        <section className={styles.aiSection} aria-labelledby="ai-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>AGENTS WITH CLEAR JOBS</span>
            <h2 id="ai-title" className={styles.sectionH2}>
              AI does the legwork. People make the call.
            </h2>
            <p className={styles.sectionIntro}>
              Audience Take does not ask one chatbot to decide whether a film deserves to be made.
              It uses a team of focused agents to turn a public nomination into a research record
              people can inspect. Each agent has a bounded job.
            </p>
          </div>

          <div className={styles.aiContactStrip} role="list" aria-label="AI agent investigation stages">
            {AI_STAGES.map((stage) => (
              <div key={stage.num} className={styles.aiStageFrame} role="listitem">
                <span className={styles.aiStageNum}>
                  <span className={styles.registrationMark} aria-hidden="true" />
                  STAGE {stage.num}
                </span>
                <h3 className={styles.aiStageTitle}>{stage.title}</h3>
                <p className={styles.aiStageDesc}>{stage.desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.aiBoundariesBlock}>
            <h3>WHAT AI DOES NOT DO</h3>
            <ul>
              <li>Decide which film or series deserves to exist</li>
              <li>Create a secret greenlight, audience-heat, or market-readiness score</li>
              <li>Treat views, comments, pledges, or commitments as guaranteed demand</li>
              <li>Claim a creator&apos;s participation, rights position, or approval</li>
              <li>Invent buyer, streamer, festival, financier, or distributor interest</li>
              <li>Replace creative review, rights diligence, financial analysis, or human decisions</li>
            </ul>
          </div>
        </section>

        {/* 8. SOCIAL LAYER TWO-LEDGER EXPLANATION */}
        <section className={styles.socialSection} aria-labelledby="social-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>PARTICIPATION WITH A PURPOSE</span>
            <h2 id="social-title" className={styles.sectionH2}>
              A project becomes more useful when people contribute more than attention.
            </h2>
            <p className={styles.sectionIntro}>
              Audience Take is built around projects, not follower counts. Every nomination, Take,
              commitment, and evidence suggestion attaches directly to the Scout Card.
            </p>
          </div>

          {/* Two-Ledger Rail Diagram */}
          <div className={styles.twoLedgerDiagram}>
            <div className={`${styles.ledgerRail} ${styles.isMint}`}>
              <div className={styles.railTitle}>PUBLIC WEB EVIDENCE → RESEARCH LEDGER</div>
              <p>
                YouTube metadata, Kickstarter backer numbers, press reviews, and citations collected
                from the open web.
              </p>
            </div>

            <div className={styles.diagramIntersection}>
              SCOUT CARD
            </div>

            <div className={`${styles.ledgerRail} ${styles.isYellow}`}>
              <div className={styles.railTitle}>AUDIENCE TAKE ACTIONS → PULSE LEDGER</div>
              <p>
                Structured Takes, voluntary commitments (Would Watch, Bring to City), and pathway
                votes submitted by community members.
              </p>
            </div>
          </div>

          {/* Social Loop */}
          <div className={styles.socialLoop} aria-label="Social loop progression">
            <div className={styles.loopStep}>Nominate <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Research <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Take <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Commit <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Validate <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Update <span className={styles.loopArrow}>→</span></div>
            <div className={styles.loopStep}>Outcome</div>
          </div>

          {/* Social Signals Table */}
          <table className={styles.signalsTable} aria-label="Social signal definitions">
            <thead>
              <tr>
                <th scope="col">Signal</th>
                <th scope="col">Meaning</th>
                <th scope="col">What it does not prove</th>
              </tr>
            </thead>
            <tbody>
              {SOCIAL_SIGNALS.map((sig, idx) => (
                <tr key={idx}>
                  <td className={styles.signalName}>{sig.name}</td>
                  <td>{sig.meaning}</td>
                  <td>{sig.notProof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 9. PRINCIPLES BAND */}
        <section className={styles.principlesSection} aria-labelledby="principles-title">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>WHAT WE BELIEVE</span>
            <h2 id="principles-title" className={styles.sectionH2}>
              Widen discovery. Keep judgment human.
            </h2>
            <p className={styles.sectionIntro}>
              We believe audiences can help surface work that traditional pipelines miss. We also
              know audience attention can be biased, manipulated, and shaped by platform algorithms.
              So Audience Take does not simply reward the largest following. It is designed to make
              early discovery more useful, evidence more inspectable, uncertainty more visible, and
              participation more meaningful.
            </p>
          </div>

          <div className={styles.commitmentsGrid}>
            {COMMITMENTS.map((comm, idx) => (
              <div key={idx} className={styles.commitmentItem}>
                <span className={styles.commitmentBullet}>—</span>
                <span>{comm}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 10. FINAL NOMINATION TICKET */}
        <section className={styles.finalTicketSection} aria-labelledby="final-title">
          <span className={styles.eyebrow}>JOIN THE PUBLIC SCOUTING PROGRAM</span>
          <h2 id="final-title" className={styles.finalTitle}>
            What did you find before everyone else?
          </h2>
          <p className={styles.finalBody}>
            Share the public project. Tell us what you saw in it. Help give the next screen story a
            credible next step.
          </p>

          <div className={styles.finalCtas}>
            <Link href="/nominate" className={styles.primaryCta}>
              Start a nomination <ArrowIcon />
            </Link>
            <Link href="/projects" className={styles.secondaryCta}>
              Explore projects first
            </Link>
          </div>

          <div className={styles.closingLine}>
            Audience Take—the audience&apos;s take on what should be made next.
          </div>
        </section>
      </main>
    </div>
  );
}
