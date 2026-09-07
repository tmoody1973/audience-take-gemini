/**
 * Audience Take — Firestore Repository Adapter
 * Clean-room repository providing strongly-typed access to Projects, Scout Cards,
 * Research Runs, Pulse Metrics, and Community Trust Artifacts.
 */

import type {
  Project,
  ScoutCard,
  TrailerCritic,
  ResearchRunState,
  UserEngagementRecord,
  Take,
  Reply,
  EvidenceLead,
  CreatorClaim,
  CreatorUpdate,
  Report,
  Correction,
  MediumType,
  LifecycleStage,
  ProjectMonitor,
  WebhookReceipt,
  ExecutionLease,
} from "@/domain";
import { getAdminFirestore } from "@/lib/firebase/admin";

class InMemoryStore {
  projects = new Map<string, Project>();
  scoutCards = new Map<string, ScoutCard>();
  trailerCritics = new Map<string, TrailerCritic>();
  researchRuns = new Map<string, ResearchRunState>();
  userEngagements = new Map<string, UserEngagementRecord>();
  takes = new Map<string, Take>();
  replies = new Map<string, Reply>();
  evidenceLeads = new Map<string, EvidenceLead>();
  creatorClaims = new Map<string, CreatorClaim>();
  creatorUpdates = new Map<string, CreatorUpdate>();
  reports = new Map<string, Report>();
  corrections = new Map<string, Correction>();
  projectMonitors = new Map<string, ProjectMonitor>();
  webhookReceipts = new Map<string, WebhookReceipt>();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // ---------------------------------------------------------
    // Project 1: Junichiro Jackson (Adult Animated Pilot / POC)
    // ---------------------------------------------------------
    const p1Id = "proj-junichiro";
    const c1Id = "card-junichiro-v1";
    const tc1Id = "tc-junichiro-v1";

    const p1Card: ScoutCard = {
      id: c1Id,
      projectId: p1Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Proof-of-concept animation created by Chaz Bottoms (CBC Studios) in collaboration with TeamTO animation studio and Martian Blueberry with music by Coast Contra.",
        "Set in near-future Brooklyn, following high school junior Junichiro navigating supernatural challenges scored to hip-hop.",
        "Funded a successful grassroots manga universe companion with over 1,200 fan backers."
      ],
      whatWereChecking: [
        "Linear vs streaming network development exclusivity terms.",
        "Licensing status of the original hip-hop soundtrack and artist collaborations."
      ],
      whyScouted: "A groundbreaking fusion of Japanese anime craft and Brooklyn urban storytelling that already has a dedicated fanbase.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=s8G7425lfKs",
          verified: true,
          caption: "TeamTO Official Proof of Concept Animation"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-jj-0",
          sourceUrl: "https://www.jjseries.com/",
          title: "Junichiro Jackson Official Series Website",
          publisher: "Chaz Bottoms & TeamTO",
          claimType: "observation",
          excerpt: "Created by Chaz Bottoms, TeamTO, and Martian Blueberry with music by Coast Contra, the series follows Junichiro, an ambitious high school junior in near-future Brooklyn.",
          verified: true
        },
        {
          id: "ev-jj-1",
          sourceUrl: "https://variety.com/2026/film/news/junichiro-jackson-animated-spotlight",
          title: "Variety: Chaz Bottoms Unveils Junichiro Jackson Proof of Concept",
          publisher: "Variety",
          claimType: "reported",
          excerpt: "Director Chaz Bottoms teams with TeamTO and Martian Blueberry to deliver a striking hip-hop anime pilot set in near-future Brooklyn with music by Coast Contra.",
          verified: true
        },
        {
          id: "ev-jj-2",
          sourceUrl: "https://kickstarter.com/projects/chazbottoms/junichiro-jackson-vol1",
          title: "Junichiro Jackson Manga Universe Campaign",
          publisher: "Kickstarter",
          claimType: "observation",
          excerpt: "Over 1,200 fan backers funded Volume 1 of the manga companion, proving multi-format audience demand.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Premium Adult Animated Series",
          mediumFitRationale: "The episodic rhythm and rich rogue gallery naturally support a 10-episode half-hour animated season for platforms like Adult Swim or Netflix.",
          targetAudience: "Fans of Cowboy Bebop, The Boondocks, and Cyberpunk: Edgerunners.",
          risksAndUncertainties: ["High per-episode animation budget ($1M - $1.8M/ep) requiring major co-production backing."],
          nextBoundedExperiment: {
            name: "Episode 1 Animatic Table Read",
            description: "Host live community table read of pilot script with voice actors to test comedic timing.",
            successMetric: "Over 500 live stream attendees and 80%+ positive Take consensus."
          }
        },
        {
          title: "Independent Animated Feature Film",
          mediumFitRationale: "Concentrating the narrative into an 85-minute standalone theatrical feature allows festival prestige (Annecy, Sundance) before global VOD.",
          targetAudience: "Indie animation cinephiles and festival attendees.",
          risksAndUncertainties: ["Longer production timeline with delayed monetization."],
          nextBoundedExperiment: {
            name: "Annecy MIFA Work-in-Progress Showcase",
            description: "Pitch feature treatment at international animation markets.",
            successMetric: "Secure 2 or more European co-production distribution inquiries."
          }
        },
        {
          title: "Creator-Direct Serialized Manga & Web Franchise",
          mediumFitRationale: "Expanding the manga releases while dropping self-contained 2-minute animated shorts directly to fans builds an unassailable independent IP base.",
          targetAudience: "Direct-to-creator anime enthusiasts and manga collectors.",
          risksAndUncertainties: ["Requires ongoing creator velocity and physical fulfillment logistics."],
          nextBoundedExperiment: {
            name: "Micro-Short Crowdfunder Test",
            description: "Run digital pre-order campaign for 3-minute standalone animated short.",
            successMetric: "Reach $50k funding threshold in under 14 days."
          }
        }
      ],
      decisionBrief: {
        logline: "In a neon-drenched near-future Brooklyn, an ambitious high school junior named Junichiro must navigate supernatural challenges while balancing everyday ambitions.",
        coreHook: "High-octane anime action scored to original hip-hop by Coast Contra set across a stylized near-future Brooklyn.",
        comparativeTitles: ["The Boondocks", "Cowboy Bebop", "Afro Samurai", "Spider-Man: Into the Spider-Verse"],
        primaryRisk: "High animation production costs necessitate strategic international studio co-production."
      },
      industryLens: {
        marketContext: "Surging global demand for adult anime with authentic multicultural voices; proven IP crossover with manga readers.",
        comparables: ["Castlevania ($1.5M/ep)", "Yasuke ($1.2M/ep)"],
        realisticConstraints: "Retain IP ownership by partnering with co-production studios rather than signing away all franchise rights."
      },
      trailerCriticId: tc1Id,
      versionProvenance: {
        generatedAt: "2026-08-28T10:00:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Clean-room verified publication"
      }
    };

    const p1Critic: TrailerCritic = {
      id: tc1Id,
      projectId: p1Id,
      sourceVideoUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
      summary: "A kinetic demonstration of 2D anime timing, dynamic perspective shifts, and authentic Brooklyn landmarks set to a driving boom-bap rhythm.",
      genreAndForm: "Adult Animated Action / Cyberpunk Comedy Proof-of-Concept",
      whyItMayConnect: "Captures the sweet spot between nostalgic 90s hand-drawn anime flair and fresh urban cultural identity.",
      timestampedBeats: [
        { timestampSeconds: 0, timestampFormatted: "0:00", label: "Skyline Establishing Hook", description: "Subway elevated train rattling above holographic Brooklyn street art with heavy vinyl crackle." },
        { timestampSeconds: 12, timestampFormatted: "0:12", label: "Courier in Motion", description: "Junichiro maneuvers through tight alleys with fluid 2D keyframing." },
        { timestampSeconds: 28, timestampFormatted: "0:28", label: "Syndicate Ambush", description: "Robotic enforcers surround the vehicle; beat drops into heavy brass bassline." },
        { timestampSeconds: 45, timestampFormatted: "0:45", label: "Climax Stunt", description: "Mid-air acrobatic dodge with perspective shift and stylized neon impact frames." }
      ],
      craftAnalysis: {
        cinematography: "Dynamic camera angles simulating 35mm anime lenses with motion blur and lens flares.",
        soundAndScore: "Diegetic city rumble transitioning into high-energy hip-hop beats with crisp foley sound effects.",
        editingAndPacing: "Masterful rhythmic cutting synced to downbeats; expansive hold frames during comedic pauses.",
        graphicsAndText: "Japanese katakana subtitles blended with retro arcade font typography."
      },
      persuasionAndEmotion: {
        emotionalArc: "Curiosity -> Kinetic Rush -> Comedic Relief -> Anticipation.",
        targetPersona: "Anime enthusiasts, hip-hop culture fans, adult animation audiences.",
        callToAction: "Rallies audience to demand an episodic series greenlight."
      },
      criticMatrix: {
        clarity: 9.2,
        toneConsistency: 9.4,
        visualOriginality: 9.5,
        narrativeTension: 8.9
      },
      limitations: "Analyzed from proof-of-concept animation clip and teaser materials.",
      model: "gemini-2.5-pro",
      analyzedAt: "2026-08-28T10:15:00Z"
    };

    const p1: Project = {
      id: p1Id,
      identity: {
        title: "Junichiro Jackson",
        normalizedUrl: "https://teamto.com/projects/junichiro-jackson",
        originalUrl: "https://teamto.com/projects/junichiro-jackson",
        medium: "proof_of_concept",
        currentStage: "concept",
        logline: "In a neon-drenched near-future Brooklyn, high school junior Junichiro must navigate supernatural challenges while balancing everyday ambitions.",
        creators: ["Chaz Bottoms", "CBC Studios", "TeamTO", "Martian Blueberry"]
      },
      publishedCardId: c1Id,
      publicationStatus: "published",
      latestCardVersionId: c1Id,
      nomination: {
        submittedByUid: "user-fan-101",
        nominatorRole: "fan",
        reason: "The proof-of-concept animation from TeamTO and Chaz Bottoms is pure fire. The world needs this animated series immediately.",
        initialLinks: ["https://teamto.com/projects/junichiro-jackson", "https://youtube.com/watch?v=s8G7425lfKs"],
        createdAt: "2026-08-28T09:30:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 842,
        payCount: 420,
        cityDemandCount: 310,
        backCount: 265,
        pathwayVotes: [512, 180, 150],
        cities: { "Chicago": 145, "Atlanta": 62, "New York": 48, "Los Angeles": 35, "London": 20 }
      },
      createdAt: "2026-08-28T09:30:00Z",
      updatedAt: "2026-08-28T10:15:00Z"
    };

    // ---------------------------------------------------------
    // Project 2: American Pachuco (Historical Arts Documentary)
    // ---------------------------------------------------------
    const p2Id = "proj-pachuco";
    const c2Id = "card-pachuco-v1";
    const tc2Id = "tc-pachuco-v1";

    const p2Card: ScoutCard = {
      id: c2Id,
      projectId: p2Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Feature documentary tracking the artistic and social impact of Luis Valdez and the founding of El Teatro Campesino during the United Farm Workers movement.",
        "Includes restored 16mm archival footage from 1968 agricultural strikes and original theatrical performances.",
        "Directed by veteran Chicano cinema historians with full cooperation of the Valdez family archives."
      ],
      whatWereChecking: [
        "PBS / Independent Lens national broadcast window clearance.",
        "Institutional educational licensing distribution agreements with university Chicano Studies departments."
      ],
      whyScouted: "Crucial American cultural history that reframes theatrical activism and the Chicano civil rights movement for a new generation.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=MXESsS8Uskc",
          verified: true,
          caption: "Official Retrospective & Festival Acclaim Trailer"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-ap-1",
          sourceUrl: "https://deadline.com/2026/08/american-pachuco-documentary-luis-valdez",
          title: "Deadline: American Pachuco Doc Celebrates Theatrical Pioneer Luis Valdez",
          publisher: "Deadline Hollywood",
          claimType: "reported",
          excerpt: "A sweeping chronicle of El Teatro Campesino and the cultural birth of Zoot Suit.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Festival & Theatrical Expansion",
          mediumFitRationale: "Historical arts documentaries thrive in curated festival retrospectives (Sundance, Tribeca, Los Angeles Latino International Film Festival) followed by regional arthouse runs.",
          targetAudience: "Chicano cinema scholars, theatre historians, and Latinx cultural audiences.",
          risksAndUncertainties: ["Arthouse theatrical screen scarcity in non-major metropolitan markets."],
          nextBoundedExperiment: {
            name: "LALIFF Opening Night Premiere Outreach",
            description: "Submit to major Latinx film festivals and coordinate alumni panel.",
            successMetric: "Official festival selection and standing ovation gala screening."
          }
        },
        {
          title: "Public Media & Educational Licensing",
          mediumFitRationale: "Peer-reviewed historical docs are prime candidates for PBS broadcast (POV / Voces) and university streaming packages (Kanopy, Criterion).",
          targetAudience: "Public television audiences, universities, and high school history curricula.",
          risksAndUncertainties: ["Strict broadcast runtime editing requirements (56m standard)."],
          nextBoundedExperiment: {
            name: "University Curriculum Guide Pilot",
            description: "Distribute 20-page educator guide alongside 30-minute classroom cut to 15 colleges.",
            successMetric: "10 paid institutional educational license commitments."
          }
        },
        {
          title: "Community Impact Screening Tour",
          mediumFitRationale: "Screening directly in farmworker communities, cultural centers, and union halls honors the grassroots ethos of El Teatro Campesino.",
          targetAudience: "Community organizers, labor union members, and agricultural communities.",
          risksAndUncertainties: ["Logistical coordination of mobile projection systems in rural regions."],
          nextBoundedExperiment: {
            name: "Central Valley Farmworker Hall Tour",
            description: "Schedule 6 free community screenings in Delano, Salinas, and Fresno.",
            successMetric: "Over 1,000 community attendees across the tour."
          }
        }
      ],
      decisionBrief: {
        logline: "How a visionary dramatist and striking farmworkers used flatbed trucks as stages to ignite an indelible American cultural and civil rights revolution.",
        coreHook: "Unseen archival recordings paired with passionate contemporary retrospectives on the birth of Chicano theatre.",
        comparativeTitles: ["Dolores", "The Times of Harvey Milk", "Zoot Suit"],
        primaryRisk: "Niche historical framing requires active educational and cultural institution outreach."
      },
      industryLens: {
        marketContext: "High institutional demand for authoritative civil rights and arts retrospectives; strong evergreen educational license longevity.",
        comparables: ["Dolores (PBS / ITVS)", "I Am Not Your Negro ($8M theatrical)"],
        realisticConstraints: "Broadcast licensing combined with educational sales yields predictable non-theatrical profitability."
      },
      trailerCriticId: tc2Id,
      versionProvenance: {
        generatedAt: "2026-08-28T10:00:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Documentary-native pathway correction applied"
      }
    };

    const p2Critic: TrailerCritic = {
      id: tc2Id,
      projectId: p2Id,
      sourceVideoUrl: "https://www.youtube.com/watch?v=MXESsS8Uskc",
      summary: "An evocative archival journey that juxtaposes high-contrast black-and-white strike footage with vibrant stage performances and resonant acoustic guitar.",
      genreAndForm: "Historical Arts Documentary / Biographical Retrospective",
      whyItMayConnect: "Honors living American legends whose grassroots cultural art directly transformed labor history.",
      timestampedBeats: [
        { timestampSeconds: 0, timestampFormatted: "0:00", label: "Dust & Megaphones", description: "Archival footage of Delano grape strike with striking farmworkers chanting in Spanish." },
        { timestampSeconds: 15, timestampFormatted: "0:15", label: "The Truck Stage", description: "Young Luis Valdez hops onto the flatbed of a pickup truck with wooden masks." },
        { timestampSeconds: 32, timestampFormatted: "0:32", label: "Zoot Suit Breakthrough", description: "Broadway premiere marquee flashing under orchestral mambo rhythms." },
        { timestampSeconds: 50, timestampFormatted: "0:50", label: "Enduring Legacy", description: "Contemporary Valdez speaking on the power of myth, dignity, and the human spirit." }
      ],
      craftAnalysis: {
        cinematography: "Painstakingly restored 16mm celluloid interspersed with intimate 4K interview close-ups.",
        soundAndScore: "Acoustic corridos, archival strike chants, and warm analog voiceover narration.",
        editingAndPacing: "Graceful transitions between historical urgency and theatrical exuberance.",
        graphicsAndText: "Authentic woodblock and screen-printed poster typography."
      },
      persuasionAndEmotion: {
        emotionalArc: "Struggle -> Creative Spark -> Cultural Pride -> Reverence.",
        targetPersona: "History buffs, theatre lovers, documentary cinephiles, and cultural advocates.",
        callToAction: "Inspires viewers to bring screenings to their local community halls."
      },
      criticMatrix: {
        clarity: 9.5,
        toneConsistency: 9.6,
        visualOriginality: 8.8,
        narrativeTension: 9.0
      },
      limitations: "Analyzed from official 2-minute festival retrospective preview.",
      analyzedAt: "2026-08-28T10:20:00Z",
      model: "gemini-3.7-flash"
    };

    const p2: Project = {
      id: p2Id,
      identity: {
        title: "American Pachuco",
        normalizedUrl: "https://americanpachuco.film",
        originalUrl: "https://americanpachuco.film",
        medium: "documentary",
        currentStage: "festival_circuit",
        logline: "How a visionary dramatist and striking farmworkers used flatbed trucks as stages to ignite an indelible American cultural revolution.",
        creators: ["Luis Valdez", "El Teatro Campesino Film Collective"]
      },
      publishedCardId: c2Id,
      publicationStatus: "published",
      latestCardVersionId: c2Id,
      nomination: {
        submittedByUid: "user-fan-102",
        nominatorRole: "fan",
        reason: "This film captures the soul of El Teatro Campesino and Luis Valdez with archival footage that took my breath away.",
        initialLinks: ["https://americanpachuco.film", "https://youtube.com/watch?v=MXESsS8Uskc"],
        createdAt: "2026-08-28T09:40:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 620,
        payCount: 290,
        cityDemandCount: 215,
        backCount: 190,
        pathwayVotes: [340, 180, 100],
        cities: { "Los Angeles": 82, "San Francisco": 54, "San Antonio": 38, "Fresno": 26, "Albuquerque": 15 }
      },
      createdAt: "2026-08-28T09:40:00Z",
      updatedAt: "2026-08-28T10:20:00Z"
    };

    // ---------------------------------------------------------
    // Project 3: CYCLE (Investigative Documentary)
    // ---------------------------------------------------------
    const p3Id = "proj-cycle";
    const c3Id = "card-cycle-v1";

    const p3Card: ScoutCard = {
      id: c3Id,
      projectId: p3Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Feature documentary directed by Laura Dyan Kezman (Lion Art Media) with producers Vianca Fuster and Michelle Craig.",
        "Investigates the fatal police shooting of 18-year-old Ty'Rese West in Mount Pleasant, Wisconsin, and his family's pursuit of accountability.",
        "Extensively reported and cited by Milwaukee Journal Sentinel, Racine County Eye, WUWM 89.7, and PBS Wisconsin."
      ],
      whatWereChecking: [
        "Midwest regional film festival tour premiere dates (Milwaukee Film Festival, Beloit International Film Festival).",
        "Public screening licenses for Wisconsin civic impact and community justice forums."
      ],
      whyScouted: "A rigorous, empathetic investigative documentary centering family grief, systemic transparency, and community-led civil rights advocacy in southeastern Wisconsin.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=k8bM9qaPXLU",
          verified: true,
          caption: "Official Proof-of-Concept Trailer"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-cy-1",
          sourceUrl: "https://wuwm.com/2026/08/cycle-documentary-milwaukee-lion-art",
          title: "WUWM 89.7: Independent Documentary CYCLE Explores Justice and Accountability in Racine County",
          publisher: "WUWM Milwaukee NPR",
          claimType: "reported",
          excerpt: "Director Laura Dyan Kezman and Lion Art Media chronicle the aftermath of Ty'Rese West's death and a community demanding systemic reform.",
          verified: true
        },
        {
          id: "ev-cy-2",
          sourceUrl: "https://racinecountyeye.com/cycle-documentary-investigation",
          title: "Racine County Eye: Investigative Documentary Examines Mount Pleasant Police Shooting",
          publisher: "Racine County Eye",
          claimType: "reported",
          excerpt: "CYCLE brings extensive local investigative reporting into focus through the lived experience of the West family.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Civic Impact & Community Hall Screenings",
          mediumFitRationale: "Investigative social justice documentaries achieve deepest impact through community forums, civil rights symposiums, and university campus tours.",
          targetAudience: "Community organizers, civil rights advocates, legal scholars, and affected families.",
          risksAndUncertainties: ["Community outreach coordination and sensitive topic moderation."],
          nextBoundedExperiment: {
            name: "Wisconsin Civic Forum Screening Tour",
            description: "Host 4 moderated community screenings across Racine, Kenosha, and Milwaukee with Q&A panels.",
            successMetric: "Over 400 attendees across 4 community venues."
          }
        },
        {
          title: "Regional Public Broadcast & PBS Feature",
          mediumFitRationale: "Midwest public television networks have dedicated slots (PBS Wisconsin, POV) for rigorous regional investigative journalism.",
          targetAudience: "Public television subscribers, investigative journalism supporters, and regional civic leaders.",
          risksAndUncertainties: ["Navigating public broadcast programming standards and legal clearance."],
          nextBoundedExperiment: {
            name: "PBS Wisconsin Programming Submission",
            description: "Submit 58-minute broadcast master to PBS Wisconsin acquisition panel.",
            successMetric: "Broadcast premiere slot confirmed with educational companion guide."
          }
        },
        {
          title: "Arthouse & Regional Festival Circuit",
          mediumFitRationale: "Premiering at Midwest festivals (Milwaukee Film Festival, Beloit) builds critical acclaim before national impact distribution.",
          targetAudience: "Independent documentary cinephiles, festival programmers, and journalists.",
          risksAndUncertainties: ["Festival submission timing and premiere exclusivity constraints."],
          nextBoundedExperiment: {
            name: "Milwaukee Film Festival Premiere Outreach",
            description: "Submit rough cut to festival programmers for Cream City Cinema centerpiece consideration.",
            successMetric: "Official festival selection."
          }
        }
      ],
      decisionBrief: {
        logline: "An investigative documentary examining the fatal police shooting of 18-year-old Ty'Rese West in Mount Pleasant, Wisconsin, centering his family's pursuit of accountability and systemic reform.",
        coreHook: "Intimate family testimony paired with rigorous investigative reporting and community-led accountability.",
        comparativeTitles: ["13th", "Strong Island", "3 1/2 Minutes, Ten Bullets"],
        primaryRisk: "Sensitive real-world legal subject matter requires rigorous factual verification and institutional legal review."
      },
      industryLens: {
        marketContext: "Sustained national relevance for localized investigative nonfiction; philanthropic grant funding potential from documentary funds (Field of Vision, Sundance Impact).",
        comparables: ["Strong Island (Netflix / Yance Ford)", "The Sentence (HBO / Rudy Valdez)"],
        realisticConstraints: "Impact distribution model combined with public media licensing provides sustainable pathway without relying on commercial theatrical box office."
      },
      trailerCriticId: null,
      versionProvenance: {
        generatedAt: "2026-08-28T10:00:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Stage 5 documentary pathway recovery applied; verified reporting basis updated"
      }
    };

    const p3: Project = {
      id: p3Id,
      identity: {
        title: "CYCLE",
        normalizedUrl: "https://lionart.media/cycle",
        originalUrl: "https://lionart.media/cycle",
        medium: "documentary",
        currentStage: "production",
        logline: "An investigative documentary examining the fatal police shooting of 18-year-old Ty'Rese West in Mount Pleasant, Wisconsin, centering his family's pursuit of accountability and systemic reform.",
        creators: ["Laura Dyan Kezman", "Lion Art Media", "Vianca Fuster", "Michelle Craig"]
      },
      publishedCardId: c3Id,
      publicationStatus: "published",
      latestCardVersionId: c3Id,
      nomination: {
        submittedByUid: "user-fan-103",
        nominatorRole: "fan",
        reason: "Laura Dyan Kezman and Lion Art Media are telling Ty'Rese West's story with profound care, rigorous reporting, and deep respect for the family.",
        initialLinks: ["https://lionart.media/cycle", "https://youtube.com/watch?v=k8bM9qaPXLU"],
        createdAt: "2026-08-28T09:50:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 415,
        payCount: 178,
        cityDemandCount: 160,
        backCount: 142,
        pathwayVotes: [210, 120, 85],
        cities: { "Milwaukee": 110, "Racine": 45, "Madison": 28, "Chicago": 22 }
      },
      createdAt: "2026-08-28T09:50:00Z",
      updatedAt: "2026-08-28T10:25:00Z"
    };

    // ---------------------------------------------------------
    // Project 4: Signal in the Pines (Sci-Fi Short)
    // ---------------------------------------------------------
    const p4Id = "proj-signal-in-the-pines";
    const c4Id = "card-signal-pines-v1";
    const tc4Id = "tc-signal-pines-v1";

    const p4Card: ScoutCard = {
      id: c4Id,
      projectId: p4Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Shot entirely on 16mm celluloid in the Pacific Northwest over 12 days.",
        "Premiered at the 2025 Northwest Film Forum, winning Best Sound Design.",
        "Complete 14-minute runtime with original analog synthesizer score by Marcus Cruz."
      ],
      whatWereChecking: [
        "Registration status of the 90-minute feature adaptation treatment with WGA.",
        "European genre festival premiere rights and VOD distribution terms."
      ],
      whyScouted: "A masterclass in analog atmosphere and tension that crafts genuine sci-fi dread without CGI.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          verified: true,
          caption: "Official Festival Teaser (14 min short)"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-sp-1",
          sourceUrl: "https://nwfilmforum.org/awards/2025-winners",
          title: "Northwest Film Forum 2025 Festival Awards",
          publisher: "Northwest Film Forum",
          claimType: "reported",
          excerpt: "Best Sound Design awarded to Signal in the Pines, directed by Elena Vance with score by Marcus Cruz.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Micro-Budget Feature Expansion",
          mediumFitRationale: "The 14-minute short establishes a rich tactile lore that expands cleanly into a contained 90-minute thriller.",
          targetAudience: "Fans of slow-burn analog sci-fi (The Vast of Night, Primer).",
          risksAndUncertainties: ["Maintaining suspense across 90 minutes with a single protagonist."],
          nextBoundedExperiment: {
            name: "Feature Outline Scout Feedback",
            description: "Share 10-page treatment with trusted scouts to gauge crowdfunding appetite.",
            successMetric: "150 'Back the next chapter' commitments on Audience Take."
          }
        },
        {
          title: "Curated Genre Festival Tour & VOD",
          mediumFitRationale: "Short films thrive on genre circuits before entering curated platforms like Omeleto.",
          targetAudience: "Genre cinephiles and festival programmers.",
          risksAndUncertainties: ["Festival submission fees and geographic screening locks."],
          nextBoundedExperiment: {
            name: "Tier-1 Genre Festival Submissions",
            description: "Submit to Fantasia, Fantastic Fest, and Beyond Fest.",
            successMetric: "Official selection at 1 or more Tier-1 genre festivals."
          }
        },
        {
          title: "Anthology Episode Pilot",
          mediumFitRationale: "The narrative functions as a self-contained story suitable for an episodic sci-fi anthology series.",
          targetAudience: "Audience of Black Mirror and Twilight Zone.",
          risksAndUncertainties: ["Anthology buyers typically favor established showrunners."],
          nextBoundedExperiment: {
            name: "Sanitized Pitch Bible Review",
            description: "Publish pitch overview for community review.",
            successMetric: "75% positive take consensus from verified Fan Scouts."
          }
        }
      ],
      decisionBrief: {
        logline: "A lone forest ranger intercepts an encoded radio transmission on an analog monitor that repeats her childhood memories.",
        coreHook: "Tactile 16mm aesthetic paired with spatial audio design creating tension with zero CGI.",
        comparativeTitles: ["The Vast of Night", "Beyond the Black Rainbow", "Enys Men"],
        primaryRisk: "Niche aesthetic requires targeted genre audience activation."
      },
      industryLens: {
        marketContext: "Elevated indie sci-fi shorts with strong audio identity have high conversion rates for director representation.",
        comparables: ["The Vast of Night ($700k budget)", "Skinamarink ($15k budget)"],
        realisticConstraints: "Feature budget should remain under $1.5M to preserve creative autonomy."
      },
      trailerCriticId: tc4Id,
      versionProvenance: {
        generatedAt: "2026-08-28T10:00:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Initial Scout Card publication and verified evidence check"
      }
    };

    const p4Critic: TrailerCritic = {
      id: tc4Id,
      projectId: p4Id,
      sourceVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      summary: "A deliberate, audio-driven teaser that relies on radio static, analog needle drops, and evocative framing to build palpable claustrophobia.",
      genreAndForm: "Analog Sci-Fi / Psychological Thriller Short",
      whyItMayConnect: "It treats sound as the primary monster, tapping into retro-analog fascination without feeling derivative.",
      timestampedBeats: [
        { timestampSeconds: 0, timestampFormatted: "0:00", label: "Cold Static Opening", description: "Close-up of vintage frequency dial sweeping across distorted voice." },
        { timestampSeconds: 4, timestampFormatted: "0:04", label: "Tower Isolation", description: "Wide establishing shot of lone fire lookout tower at twilight." },
        { timestampSeconds: 10, timestampFormatted: "0:10", label: "Audio Anomaly", description: "Ranger records repetitive rhythmic acoustic tapping that matches human heartbeat." },
        { timestampSeconds: 18, timestampFormatted: "0:18", label: "Title Climax", description: "Abrupt cut to black with overlapping frequency sirens." }
      ],
      craftAnalysis: {
        cinematography: "Grain-heavy 16mm textures with practical halogen lighting and shallow depth of field.",
        soundAndScore: "Diegetic radio frequencies layered over low sub-bass drone pulses; absence of conventional orchestral music enhances tension.",
        editingAndPacing: "Long unbroken takes in the first half followed by rapid micro-cuts during the frequency spike.",
        graphicsAndText: "Minimalist phosphor-green CRT typeface."
      },
      persuasionAndEmotion: {
        emotionalArc: "Curiosity -> Unease -> Paranoia -> Cliffhanger shock.",
        targetPersona: "Cinephiles who value tactile atmosphere and sonic storytelling.",
        callToAction: "Leaves the audience desperate to decipher the source of the broadcast."
      },
      criticMatrix: {
        clarity: 8.5,
        toneConsistency: 9.8,
        visualOriginality: 9.0,
        narrativeTension: 9.5
      },
      limitations: "Analysis based on multimodal video sampling of the 24-second festival teaser.",
      analyzedAt: "2026-08-28T10:15:00Z",
      model: "gemini-3.7-flash"
    };

    const p4: Project = {
      id: p4Id,
      identity: {
        title: "Signal in the Pines",
        normalizedUrl: "https://elenavance.film/signal",
        originalUrl: "https://elenavance.film/signal",
        medium: "short",
        currentStage: "festival_circuit",
        logline: "A lone forest ranger intercepts an encoded radio transmission on an analog monitor that repeats her childhood memories.",
        creators: ["Elena Vance", "Marcus Cruz"]
      },
      publishedCardId: c4Id,
      publicationStatus: "published",
      latestCardVersionId: c4Id,
      nomination: {
        submittedByUid: "user-fan-104",
        nominatorRole: "fan",
        reason: "Discovered this at NWFF. The sound design alone blew everyone away in the auditorium.",
        initialLinks: ["https://elenavance.film/signal", "https://nwfilmforum.org/awards/2025-winners"],
        createdAt: "2026-08-28T09:30:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 142,
        payCount: 68,
        cityDemandCount: 45,
        backCount: 38,
        pathwayVotes: [82, 24, 18],
        cities: { "Seattle": 22, "Portland": 14, "Vancouver": 9 }
      },
      createdAt: "2026-08-28T09:30:00Z",
      updatedAt: "2026-08-28T10:15:00Z"
    };

    // ---------------------------------------------------------
    // Project 5: River of Copper (Investigative Documentary)
    // ---------------------------------------------------------
    const p5Id = "proj-river-of-copper";
    const c5Id = "card-copper-v1";

    const p5Card: ScoutCard = {
      id: c5Id,
      projectId: p5Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Three-year investigative documentary covering illegal copper runoff in Appalachian watershed communities.",
        "Funded via 600+ micro-donors on Kickstarter reaching 140% of its initial $35,000 goal.",
        "Features exclusive water testing data verified by independent environmental toxicologists."
      ],
      whatWereChecking: [
        "Final post-production color grading schedule and PBS distribution pitch.",
        "Release dates for educational impact screening packages."
      ],
      whyScouted: "Vital environmental investigative journalism told through intimate community testimony rather than dry statistics.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          verified: true,
          caption: "Kickstarter Impact Preview"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-201",
          sourceUrl: "https://kickstarter.com/projects/appalachia-media/river-of-copper",
          title: "River of Copper Kickstarter Campaign",
          publisher: "Kickstarter",
          claimType: "observation",
          excerpt: "$49,200 raised from 612 backers to document watershed health in eastern Kentucky.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Community Town Hall Screening Tour",
          mediumFitRationale: "Impact documentaries build grassroots momentum through civic and library screening tours.",
          targetAudience: "Regional environmental advocates, affected rural communities, and public policy students.",
          risksAndUncertainties: ["Logistics and travel costs across rural county venues."],
          nextBoundedExperiment: {
            name: "Pilot 5-City Community Tour Pledges",
            description: "Map Audience Take city demand to schedule 5 community hall screenings.",
            successMetric: "Over 50 RSVP commitments per targeted county."
          }
        },
        {
          title: "Public Television & Educational Licensing",
          mediumFitRationale: "Documentaries with peer-reviewed data fit public television slots (POV, Independent Lens).",
          targetAudience: "Public television viewers and educational institutions.",
          risksAndUncertainties: ["Long broadcast acquisition review cycles."],
          nextBoundedExperiment: {
            name: "University Impact Package Pre-Orders",
            description: "Offer university environmental science departments early preview access.",
            successMetric: "10 institutional screening commitments."
          }
        },
        {
          title: "Investigative Podcast & Audio Companion",
          mediumFitRationale: "Extensive unused audio interviews provide raw material for an investigative podcast companion series.",
          targetAudience: "True crime and investigative journalism podcast listeners.",
          risksAndUncertainties: ["Requires separate audio editing and narration production."],
          nextBoundedExperiment: {
            name: "3-Episode Audio Teaser Release",
            description: "Publish 15-minute audio excerpt for community feedback.",
            successMetric: "Top 20% engagement rate among documentary scouts."
          }
        }
      ],
      decisionBrief: {
        logline: "When toxic runoff turns their mountain creek orange, a coal country grandmother and a high school chemist team up to hold industrial polluters accountable.",
        coreHook: "Combines citizen science data with emotional character-driven storytelling.",
        comparativeTitles: ["Erin Brockovich", "The Devil We Know", "Harlan County, USA"],
        primaryRisk: "Requires active distribution outside traditional commercial theatrical lanes."
      },
      industryLens: {
        marketContext: "High demand for authentic regional investigative nonfiction with ready-to-activate impact campaigns.",
        comparables: ["The Devil We Know (Netflix / Doc NYC)"],
        realisticConstraints: "Impact screening model provides higher direct revenue than low-ball streaming licenses."
      },
      trailerCriticId: null,
      versionProvenance: {
        generatedAt: "2026-08-28T10:30:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Initial Scout Card publication"
      }
    };

    const p5: Project = {
      id: p5Id,
      identity: {
        title: "River of Copper",
        normalizedUrl: "https://kickstarter.com/projects/appalachia-media/river-of-copper",
        originalUrl: "https://kickstarter.com/projects/appalachia-media/river-of-copper",
        medium: "documentary",
        currentStage: "post_production",
        logline: "When toxic runoff turns their mountain creek orange, a coal country grandmother and a high school chemist team up to hold industrial polluters accountable.",
        creators: ["Hannah Morgan", "Caleb Hayes"]
      },
      publishedCardId: c5Id,
      publicationStatus: "published",
      latestCardVersionId: c5Id,
      nomination: {
        submittedByUid: "user-fan-202",
        nominatorRole: "fan",
        reason: "Backed this on Kickstarter 2 years ago. The citizen science water testing is genuinely groundbreaking.",
        initialLinks: ["https://kickstarter.com/projects/appalachia-media/river-of-copper"],
        createdAt: "2026-08-28T09:45:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 289,
        payCount: 114,
        cityDemandCount: 92,
        backCount: 78,
        pathwayVotes: [142, 61, 35],
        cities: { "Lexington": 38, "Louisville": 29, "Knoxville": 25 }
      },
      createdAt: "2026-08-28T09:45:00Z",
      updatedAt: "2026-08-28T10:30:00Z"
    };

    // ---------------------------------------------------------
    // Project 6: The Vampair Series (Indie Animated Musical)
    // ---------------------------------------------------------
    const p6Id = "proj-vampair";
    const c6Id = "card-vampair-v1";

    const p6Card: ScoutCard = {
      id: c6Id,
      projectId: p6Id,
      version: 1,
      status: "published",
      whatWeKnow: [
        "Independent gothic animated musical franchise created, directed, and designed by Daria Cohen.",
        "Successfully raised over $286,000 across Kickstarter and Indiegogo specifically to finance the 11-minute musical pilot episode.",
        "Daria Cohen retains 100% intellectual property ownership and creative control across all narrative and musical assets."
      ],
      whatWereChecking: [
        "Co-production studio partnership model for the full $1.5M - $2.0M multi-episode episodic series budget.",
        "Original voice cast contracts and musical soundtrack distribution agreements."
      ],
      whyScouted: "A powerhouse creator-owned gothic animated musical with proven grassroots crowdfunding validation ($286k pilot) and an intensely dedicated global fanbase.",
      sourceMedia: [
        {
          type: "youtube_embed",
          url: "https://www.youtube.com/watch?v=qPq8E4LdCqE",
          verified: true,
          caption: "The Vampair Series — Official Pilot Teaser"
        }
      ],
      evidenceLedger: [
        {
          id: "ev-va-1",
          sourceUrl: "https://www.kickstarter.com/projects/dariacohen/the-vampair-series-pilot",
          title: "Kickstarter: The Vampair Series — Official 11-Minute Musical Pilot",
          publisher: "Kickstarter",
          claimType: "observation",
          excerpt: "$286,400 raised from 4,100+ backers to fully fund the independent animated pilot episode.",
          verified: true
        },
        {
          id: "ev-va-2",
          sourceUrl: "https://www.animationmagazine.net/2025/daria-cohen-vampair-breakout",
          title: "Animation Magazine: Indie Animator Daria Cohen Explores New Frontiers in Gothic Musicals",
          publisher: "Animation Magazine",
          claimType: "reported",
          excerpt: "Daria Cohen's viral animated shorts transition into an ambitious episodic narrative while maintaining 100% creator IP retention.",
          verified: true
        }
      ],
      pathways: [
        {
          title: "Creator-Owned Studio Co-Production",
          mediumFitRationale: "Partnering with specialized independent animation studios (e.g., Glitch, SpindleHorse) allows scaling to full episodic quality while retaining IP ownership.",
          targetAudience: "Global indie animation enthusiasts, gothic subculture fans, and musical theatre lovers.",
          risksAndUncertainties: ["Negotiating co-production terms that preserve creator final cut and merchandise rights."],
          nextBoundedExperiment: {
            name: "Studio Co-Production Pitch Deck Review",
            description: "Present episodic production schedule and pilot metrics to 3 target independent animation studios.",
            successMetric: "At least 1 formal co-production term sheet with creator IP retention."
          }
        },
        {
          title: "Direct-to-Consumer Episodic Subscription (Patreon / BackerKit)",
          mediumFitRationale: "With an existing 4,000+ crowdfunder base, a dedicated creator subscription model can sustain episode-by-episode production autonomously.",
          targetAudience: "Die-hard community supporters and animation art collectors.",
          risksAndUncertainties: ["Maintaining steady episode delivery intervals to prevent backer churn."],
          nextBoundedExperiment: {
            name: "Episodic Backer Tier Conversion Test",
            description: "Launch recurring patron tiers offering behind-the-scenes animatics and voice-acting commentary.",
            successMetric: "Reach $25,000/month recurring production commitments."
          }
        },
        {
          title: "Non-Exclusive SVOD Windowing",
          mediumFitRationale: "Releasing episodes first on YouTube for community reach, followed by curated high-definition streaming platforms.",
          targetAudience: "Streaming audiences looking for adult animation beyond traditional broadcast comedy.",
          risksAndUncertainties: ["Platform windowing exclusivity conflicts."],
          nextBoundedExperiment: {
            name: "Digital Festival Premiere Package",
            description: "Submit completed pilot to Annecy MIFA and Ottawa International Animation Festival.",
            successMetric: "Festival selection in indie episodic showcase category."
          }
        }
      ],
      decisionBrief: {
        logline: "An eccentric human becomes entangled in the darkly comedic, high-stakes rivalry between two theatrical vampire aristocrats.",
        coreHook: "High-octane musical numbers combined with fluid expressive 2D animation and gothic romance satire.",
        comparativeTitles: ["Hazbin Hotel", "Helluva Boss", "Castlevania", "The Nightmare Before Christmas"],
        primaryRisk: "The full episodic budget ($1.5M - $2.0M) requires strategic co-production without diluting creator ownership.",
        triageSummary: "Creator-owned gothic musical animation with verified $286k pilot crowdfunding and 100% creator IP retention by Daria Cohen. Full multi-episode season ($1.5M–$2.0M) requires studio co-production partner without diluting creator rights.",
        materialUncertainty: "Co-production studio partner terms and full episodic series financing without IP dilution.",
        nextDiligenceStep: "Review target co-production term sheet with creator representative and evaluate pilot animatics."
      },
      industryLens: {
        marketContext: "Explosive growth in direct-to-creator independent animation with high merchandise and music streaming monetization.",
        comparables: ["Hazbin Hotel ($2M pilot to Amazon series)", "Lackadaisy ($2M BackerKit campaign)"],
        realisticConstraints: "Pilot was funded at $286k; full series will require phased milestone financing or an indie studio co-production partner."
      },
      trailerCriticId: null,
      versionProvenance: {
        generatedAt: "2026-08-28T10:30:00Z",
        model: "gemini-2.5-pro",
        changeReason: "Initial Scout Card publication with verified funding and IP structure"
      }
    };

    const p6: Project = {
      id: p6Id,
      identity: {
        title: "The Vampair Series",
        normalizedUrl: "https://youtube.com/c/DariaCohen",
        originalUrl: "https://youtube.com/c/DariaCohen",
        medium: "series",
        currentStage: "crowdfunding",
        logline: "An eccentric human becomes entangled in the darkly comedic, high-stakes rivalry between two theatrical vampire aristocrats.",
        creators: ["Daria Cohen"]
      },
      publishedCardId: c6Id,
      publicationStatus: "published",
      latestCardVersionId: c6Id,
      nomination: {
        submittedByUid: "user-fan-301",
        nominatorRole: "fan",
        reason: "Daria Cohen's Vampair musical animation has over 100 million views on YouTube and raised $286k for the pilot. It represents the future of independent creator-owned animation.",
        initialLinks: ["https://youtube.com/c/DariaCohen", "https://kickstarter.com/projects/dariacohen/the-vampair-series-pilot"],
        createdAt: "2026-08-28T10:00:00Z"
      },
      creatorClaim: {
        status: "unclaimed"
      },
      metrics: {
        watchCount: 520,
        payCount: 240,
        cityDemandCount: 180,
        backCount: 215,
        pathwayVotes: [310, 180, 110],
        cities: { "Los Angeles": 65, "New York": 52, "London": 34, "Toronto": 28 }
      },
      createdAt: "2026-08-28T10:00:00Z",
      updatedAt: "2026-08-28T10:45:00Z"
    };

    // Store All Projects
    this.projects.set(p1Id, p1);
    this.scoutCards.set(c1Id, p1Card);
    this.trailerCritics.set(tc1Id, p1Critic);

    this.projects.set(p2Id, p2);
    this.scoutCards.set(c2Id, p2Card);
    this.trailerCritics.set(tc2Id, p2Critic);

    this.projects.set(p3Id, p3);
    this.scoutCards.set(c3Id, p3Card);

    this.projects.set(p4Id, p4);
    this.scoutCards.set(c4Id, p4Card);
    this.trailerCritics.set(tc4Id, p4Critic);

    this.projects.set(p5Id, p5);
    this.scoutCards.set(c5Id, p5Card);

    this.projects.set(p6Id, p6);
    this.scoutCards.set(c6Id, p6Card);
  }
}

const store = new InMemoryStore();

function cleanFirestoreObject<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const dataRepo = {
  // Projects
  async getProjects(filters?: { medium?: MediumType; stage?: LifecycleStage; query?: string }): Promise<Project[]> {
    let list = Array.from(store.projects.values());
    if (filters?.medium) {
      list = list.filter((p) => p.identity.medium === filters.medium);
    }
    if (filters?.stage) {
      list = list.filter((p) => p.identity.currentStage === filters.stage);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (p) =>
          p.identity.title.toLowerCase().includes(q) ||
          p.identity.logline?.toLowerCase().includes(q) ||
          p.identity.creators?.some((c) => c.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getProjectById(id: string): Promise<Project | null> {
    if (!id) return null;
    const direct = store.projects.get(id);
    if (direct) return direct;

    // Check alias or title slug match in memory store
    for (const proj of store.projects.values()) {
      if (
        proj.id === id ||
        proj.identity.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === id ||
        (proj.id === "proj-junichiro" && (id === "junichiro-jackson" || id === "junichiro-live-project"))
      ) {
        return proj;
      }
    }

    // Check Firestore directly
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("projects").doc(id).get();
      if (doc.exists) {
        const raw = doc.data() as any;
        const p: Project = {
          id: raw.id || doc.id,
          identity: raw.identity || {
            title: raw.title || "Project under research",
            normalizedUrl: raw.canonicalSourceUrl || "",
            originalUrl: raw.canonicalSourceUrl || "",
            medium: raw.projectType || "short",
            currentStage: "concept",
            logline: raw.logline || "",
            creators: raw.creators || [],
          },
          publishedCardId: raw.publishedCardId || raw.latestCardVersionId || null,
          publicationStatus: raw.publicationStatus || (raw.publishedCardId ? "published" : "draft"),
          latestCardVersionId: raw.latestCardVersionId || raw.publishedCardId || null,
          nomination: raw.nomination || {
            submittedByUid: raw.nominatorUid || "anonymous-scout",
            nominatorRole: raw.submissionType || "fan",
            reason: raw.whyItShouldGrow || "",
            initialLinks: raw.canonicalSourceUrl ? [raw.canonicalSourceUrl] : [],
            createdAt: raw.createdAt || new Date().toISOString(),
          },
          creatorClaim: raw.creatorClaim || {
            status: raw.claimStatus || "unclaimed",
          },
          metrics: raw.metrics || {
            watchCount: raw.followerCount || 0,
            payCount: 0,
            cityDemandCount: 0,
            backCount: 0,
            pathwayVotes: [0, 0, 0],
            cities: {},
          },
          createdAt: raw.createdAt || new Date().toISOString(),
          updatedAt: raw.updatedAt || new Date().toISOString(),
        };
        store.projects.set(p.id, p);
        return p;
      }
    } catch {}
    
    // Alias / slug mapping support
    for (const p of store.projects.values()) {
      if (p.id.toLowerCase() === id.toLowerCase()) return p;
      if (id.toLowerCase().includes("junichiro") && p.id.includes("junichiro")) return p;
      if (p.identity.title.toLowerCase().replace(/[^a-z0-9]/g, "-").includes(id.toLowerCase())) return p;
    }
    return null;
  },

  async getProjectByNormalizedUrl(url: string): Promise<Project | null> {
    for (const p of store.projects.values()) {
      if (p.identity.normalizedUrl === url) return p;
    }
    try {
      const db = getAdminFirestore();
      const snapshot = await db.collection("projects").where("identity.normalizedUrl", "==", url).limit(1).get();
      if (!snapshot.empty) {
        const p = snapshot.docs[0].data() as Project;
        store.projects.set(p.id, p);
        return p;
      }
    } catch {}
    return null;
  },

  async createProject(project: Project): Promise<void> {
    store.projects.set(project.id, project);
    try {
      const db = getAdminFirestore();
      const payload = cleanFirestoreObject({
        ...project,
        slug: project.id,
        publicationStatus: project.publishedCardId ? "published" : "draft",
        latestCardVersionId: project.publishedCardId || null,
        claimStatus: project.creatorClaim?.status || "unclaimed",
        updatedAt: project.updatedAt || new Date().toISOString(),
      });
      await db.collection("projects").doc(project.id).set(payload, { merge: true });
    } catch (err) {
      console.warn("Could not persist project to Firestore:", err);
    }
  },

  // Scout Cards
  async getScoutCardById(cardId: string): Promise<ScoutCard | null> {
    const memory = store.scoutCards.get(cardId);
    if (memory) return memory;
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("scoutCards").doc(cardId).get();
      if (doc.exists) {
        const c = doc.data() as ScoutCard;
        store.scoutCards.set(c.id, c);
        return c;
      }
    } catch {}
    return null;
  },

  async publishScoutCard(card: ScoutCard): Promise<void> {
    store.scoutCards.set(card.id, card);
    const project = store.projects.get(card.projectId);
    if (project) {
      project.publishedCardId = card.id;
      project.publicationStatus = "published";
      project.latestCardVersionId = card.id;
      project.updatedAt = new Date().toISOString();
    }
    try {
      const db = getAdminFirestore();
      await db.collection("scoutCards").doc(card.id).set(cleanFirestoreObject({
        ...card,
        visibility: "public",
      }), { merge: true });
      await db.collection("projects").doc(card.projectId).set(cleanFirestoreObject({
        publishedCardId: card.id,
        latestCardVersionId: card.id,
        publicationStatus: "published",
        updatedAt: new Date().toISOString(),
      }), { merge: true });
    } catch (err) {
      console.warn("Could not persist scout card to Firestore:", err);
      if (process.env.NODE_ENV === "production" || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error(`Database error: failed to persist scout card: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  },

  // Trailer Critics
  async getTrailerCriticById(criticId: string): Promise<TrailerCritic | null> {
    const memory = store.trailerCritics.get(criticId);
    if (memory) return memory;
    for (const critic of store.trailerCritics.values()) {
      if (critic.projectId === criticId || critic.id.includes(criticId)) return critic;
    }
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("videoAnalyses").doc(criticId).get();
      if (doc.exists) {
        const tc = doc.data() as TrailerCritic;
        store.trailerCritics.set(tc.id, tc);
        return tc;
      }
      const projectQuery = await db.collection("videoAnalyses").where("projectId", "==", criticId).limit(1).get();
      if (!projectQuery.empty) {
        const tc = projectQuery.docs[0].data() as TrailerCritic;
        store.trailerCritics.set(tc.id, tc);
        return tc;
      }
    } catch {}
    return null;
  },

  async saveTrailerCritic(critic: TrailerCritic): Promise<void> {
    store.trailerCritics.set(critic.id, critic);
    try {
      const db = getAdminFirestore();
      await db.collection("videoAnalyses").doc(critic.id).set(cleanFirestoreObject(critic), { merge: true });
    } catch (err) {
      console.warn("Could not persist trailer critic to Firestore:", err);
    }
  },

  // Research Runs
  async getResearchRunById(runId: string): Promise<ResearchRunState | null> {
    const memory = store.researchRuns.get(runId);
    if (memory) return memory;
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("researchRuns").doc(runId).get();
      if (doc.exists) {
        const raw = doc.data() as any;
        const r: ResearchRunState = {
          id: raw.id || doc.id,
          projectId: raw.projectId || "",
          nominatorUid: raw.nominatorUid || raw.requestedByUid || "anonymous-scout",
          sourceUrl: raw.sourceUrl || raw.canonicalSourceUrl || "",
          currentStep: raw.currentStep || (raw.status === "complete" ? "complete" : raw.status === "failed" ? "failed" : "fetching"),
          progressPercent: raw.progressPercent ?? (raw.status === "complete" ? 100 : 10),
          stepLogs: Array.isArray(raw.stepLogs) && raw.stepLogs.length > 0 ? raw.stepLogs : [
            {
              timestamp: new Date().toISOString(),
              step: "intake",
              message: "Research run queued.",
              status: "done",
            },
          ],
          cardId: raw.cardId,
          partialCard: raw.partialCard,
          errorMessage: raw.errorMessage || raw.publicFailureMessage,
          completedAt: raw.completedAt,
          lease: raw.lease || null,
          attempt: raw.attempt || raw.attemptCount || 1,
        };
        store.researchRuns.set(r.id, r);
        return r;
      }
    } catch {}
    return null;
  },

  async saveResearchRun(run: ResearchRunState, leaseToken?: string): Promise<void> {
    const now = Date.now();
    const token = leaseToken || run.lease?.leaseToken;

    // Validate lease ownership in-memory if existing run has lease and token is provided
    const memRun = store.researchRuns.get(run.id);
    if (memRun?.lease && token) {
      if (memRun.lease.leaseToken !== token) {
        throw new Error("Execution lease lost: another worker took over lease during run");
      }
      if (new Date(memRun.lease.expiresAt).getTime() <= now) {
        throw new Error("Execution lease expired: lease time exceeded");
      }
    }

    try {
      const db = getAdminFirestore();
      if (db) {
        await db.runTransaction(async (transaction) => {
          const runRef = db.collection("researchRuns").doc(run.id);
          const snap = await transaction.get(runRef);
          if (snap.exists) {
            const data = snap.data() as any;
            if (data.lease?.leaseToken && token && data.lease.leaseToken !== token) {
              throw new Error("Execution lease lost: another worker took over lease during run");
            }
            if (data.lease && token && new Date(data.lease.expiresAt).getTime() <= now) {
              throw new Error("Execution lease expired: lease time exceeded");
            }
          }
          transaction.set(runRef, cleanFirestoreObject(run), { merge: true });
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("Execution lease")) {
        throw err;
      }
      console.warn("Could not persist research run to Firestore:", err);
      if (process.env.NODE_ENV === "production" || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error(`Database error: failed to persist research run: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    store.researchRuns.set(run.id, run);
  },

  async acquireResearchRunLease(
    runId: string,
    workerId: string,
    options: { leaseDurationMs?: number; forceRetry?: boolean } = {}
  ): Promise<{
    acquired: boolean;
    reason?: "already_completed" | "already_running" | "not_found";
    run?: ResearchRunState;
    leaseToken?: string;
  }> {
    const leaseDurationMs = options.leaseDurationMs ?? 15 * 60 * 1000;
    const now = Date.now();
    const leaseToken = `tok_${now}_${Math.random().toString(36).slice(2, 9)}`;

    try {
      const db = getAdminFirestore();
      if (db) {
        return await db.runTransaction(async (transaction) => {
          const runRef = db.collection("researchRuns").doc(runId);
          const snap = await transaction.get(runRef);
          if (!snap.exists) {
            return { acquired: false, reason: "not_found" as const };
          }
          const data = snap.data() as any;
          if (data.currentStep === "complete" && !options.forceRetry) {
            const run = { ...data, id: snap.id };
            store.researchRuns.set(runId, run);
            return { acquired: false, reason: "already_completed" as const, run };
          }
          if (
            !options.forceRetry &&
            data.lease &&
            new Date(data.lease.expiresAt).getTime() > now &&
            data.currentStep !== "failed"
          ) {
            const run = { ...data, id: snap.id };
            store.researchRuns.set(runId, run);
            return { acquired: false, reason: "already_running" as const, run };
          }

          const nextAttempt = (data.attempt || 0) + 1;
          const newLease: ExecutionLease = {
            workerId,
            acquiredAt: new Date(now).toISOString(),
            expiresAt: new Date(now + leaseDurationMs).toISOString(),
            attempt: nextAttempt,
            leaseToken,
            executionGeneration: nextAttempt,
          };
          const updatedRun: ResearchRunState = {
            ...data,
            id: snap.id,
            lease: newLease,
            attempt: nextAttempt,
            currentStep: (data.currentStep === "failed" && options.forceRetry) ? "fetching" : (data.currentStep || "fetching"),
            errorMessage: (data.currentStep === "failed" && options.forceRetry) ? undefined : data.errorMessage,
          };

          transaction.set(runRef, cleanFirestoreObject(updatedRun), { merge: true });
          store.researchRuns.set(runId, updatedRun);
          return { acquired: true, run: updatedRun, leaseToken };
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production" || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        throw new Error(`Database error: failed to acquire research run lease: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // In-memory atomic lease acquisition for testing/offline
    const memRun = store.researchRuns.get(runId);
    if (!memRun) return { acquired: false, reason: "not_found" };

    if (memRun.currentStep === "complete" && !options.forceRetry) {
      return { acquired: false, reason: "already_completed", run: memRun };
    }

    if (
      !options.forceRetry &&
      memRun.lease &&
      new Date(memRun.lease.expiresAt).getTime() > now &&
      memRun.currentStep !== "failed"
    ) {
      return { acquired: false, reason: "already_running", run: memRun };
    }

    const nextAttempt = (memRun.attempt || 0) + 1;
    const newLease: ExecutionLease = {
      workerId,
      acquiredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + leaseDurationMs).toISOString(),
      attempt: nextAttempt,
      leaseToken,
      executionGeneration: nextAttempt,
    };
    memRun.lease = newLease;
    memRun.attempt = nextAttempt;
    if (memRun.currentStep === "failed" && options.forceRetry) {
      memRun.currentStep = "fetching";
      memRun.errorMessage = undefined;
    }
    store.researchRuns.set(runId, memRun);
    return { acquired: true, run: memRun, leaseToken };
  },

  async verifyResearchRunLease(
    runId: string,
    leaseToken: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const run = await this.getResearchRunById(runId);
    if (!run) return { valid: false, reason: "run_not_found" };
    if (!run.lease || run.lease.leaseToken !== leaseToken) {
      return { valid: false, reason: "lease_token_mismatch_or_taken_over" };
    }
    if (new Date(run.lease.expiresAt).getTime() <= Date.now()) {
      return { valid: false, reason: "lease_expired" };
    }
    return { valid: true };
  },

  async renewResearchRunLease(
    runId: string,
    leaseToken: string,
    extendDurationMs: number = 10 * 60 * 1000
  ): Promise<{ renewed: boolean; expiresAt?: string; reason?: string }> {
    const now = Date.now();
    try {
      const db = getAdminFirestore();
      if (db) {
        return await db.runTransaction(async (transaction) => {
          const runRef = db.collection("researchRuns").doc(runId);
          const snap = await transaction.get(runRef);
          if (!snap.exists) {
            return { renewed: false, reason: "not_found" };
          }
          const data = snap.data() as any;
          if (!data.lease || data.lease.leaseToken !== leaseToken) {
            return { renewed: false, reason: "lease_token_mismatch_or_taken_over" };
          }
          if (new Date(data.lease.expiresAt).getTime() <= now) {
            return { renewed: false, reason: "lease_expired" };
          }
          const nextExpiresAt = new Date(now + extendDurationMs).toISOString();
          transaction.update(runRef, {
            "lease.expiresAt": nextExpiresAt,
            updatedAt: new Date(now).toISOString(),
          });
          const memRun = store.researchRuns.get(runId);
          if (memRun?.lease) {
            memRun.lease.expiresAt = nextExpiresAt;
          }
          return { renewed: true, expiresAt: nextExpiresAt };
        });
      }
    } catch (err) {
      console.warn("Could not renew lease in Firestore, checking store:", err);
    }

    const memRun = store.researchRuns.get(runId);
    if (!memRun) return { renewed: false, reason: "not_found" };
    if (!memRun.lease || memRun.lease.leaseToken !== leaseToken) {
      return { renewed: false, reason: "lease_token_mismatch_or_taken_over" };
    }
    if (new Date(memRun.lease.expiresAt).getTime() <= now) {
      return { renewed: false, reason: "lease_expired" };
    }
    const nextExpiresAt = new Date(now + extendDurationMs).toISOString();
    memRun.lease.expiresAt = nextExpiresAt;
    return { renewed: true, expiresAt: nextExpiresAt };
  },

  async atomicPublishScoutCard(params: {
    card: ScoutCard;
    project: Project;
    run: ResearchRunState;
    leaseToken?: string;
  }): Promise<{
    publishedCard: ScoutCard;
    project: Project;
    run: ResearchRunState;
  }> {
    const { card, project, run, leaseToken } = params;

    // Verify lease if token provided
    if (leaseToken) {
      const leaseStatus = await this.verifyResearchRunLease(run.id, leaseToken);
      if (!leaseStatus.valid) {
        throw new Error(`Execution lease invalid: ${leaseStatus.reason}`);
      }
    } else {
      const memRun = store.researchRuns.get(run.id);
      if (memRun?.lease && new Date(memRun.lease.expiresAt).getTime() > Date.now()) {
        throw new Error("Execution lease invalid: missing_lease_token_for_leased_run");
      }
    }

    // Version resolution: dynamically determine the next version number
    let currentVersion = 0;
    if (project.publishedCardId) {
      const match = project.publishedCardId.match(/-v(\d+)$/);
      if (match) {
        currentVersion = parseInt(match[1], 10);
      }
    }
    const resolvedVersion = Math.max(currentVersion + 1, card.version || 1);
    const resolvedCardId = `card-${project.id}-v${resolvedVersion}`;

    card.id = resolvedCardId;
    card.version = resolvedVersion;
    card.status = card.status || "published";

    project.publishedCardId = resolvedCardId;
    project.publicationStatus = "published";
    project.latestCardVersionId = resolvedCardId;
    project.updatedAt = new Date().toISOString();

    run.currentStep = "complete";
    run.progressPercent = 100;
    run.cardId = resolvedCardId;
    run.completedAt = new Date().toISOString();

    try {
      const db = getAdminFirestore();
      if (db) {
        await db.runTransaction(async (transaction) => {
          // Re-verify project in transaction for concurrent safety
          const projRef = db.collection("projects").doc(project.id);
          const projSnap = await transaction.get(projRef);
          let txVersion = resolvedVersion;
          let txCardId = resolvedCardId;

          if (projSnap.exists) {
            const currentProj = projSnap.data() as any;
            if (currentProj.publishedCardId) {
              const txMatch = currentProj.publishedCardId.match(/-v(\d+)$/);
              if (txMatch) {
                const latestNum = parseInt(txMatch[1], 10);
                if (latestNum >= txVersion) {
                  txVersion = latestNum + 1;
                  txCardId = `card-${project.id}-v${txVersion}`;
                  card.id = txCardId;
                  card.version = txVersion;
                  project.publishedCardId = txCardId;
                  run.cardId = txCardId;
                }
              }
            }
          }

          // Verify lease token inside transaction if provided
          if (leaseToken) {
            const runRef = db.collection("researchRuns").doc(run.id);
            const runSnap = await transaction.get(runRef);
            if (runSnap.exists) {
              const runData = runSnap.data() as any;
              if (runData.lease?.leaseToken && runData.lease.leaseToken !== leaseToken) {
                throw new Error("Execution lease lost: another worker took over lease during run");
              }
              if (runData.lease && new Date(runData.lease.expiresAt).getTime() <= Date.now()) {
                throw new Error("Execution lease expired: lease time exceeded before atomic publication");
              }
            }
          }

          // Atomic batch writes in transaction
          transaction.set(
            db.collection("scoutCards").doc(card.id),
            cleanFirestoreObject({ ...card, visibility: "public" })
          );
          transaction.set(
            projRef,
            cleanFirestoreObject({
              ...project,
              publishedCardId: card.id,
              latestCardVersionId: card.id,
              publicationStatus: "published",
              updatedAt: project.updatedAt,
            }),
            { merge: true }
          );
          transaction.set(
            db.collection("researchRuns").doc(run.id),
            cleanFirestoreObject(run),
            { merge: true }
          );
          transaction.set(
            db.collection("publicResearchRuns").doc(run.id),
            {
              status: "complete",
              cardUrl: `/projects/${project.id}`,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        });
      }
    } catch (err) {
      console.error("Could not execute atomic card publication in Firestore:", err);
      throw new Error(`Database error: atomic card publication failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Update in-memory store
    store.scoutCards.set(card.id, card);
    store.projects.set(project.id, project);
    store.researchRuns.set(run.id, run);

    return {
      publishedCard: card,
      project,
      run,
    };
  },

  // Audience Pulse & Engagements
  async getUserEngagement(projectId: string, uid: string): Promise<UserEngagementRecord | null> {
    const key = `${projectId}_${uid}`;
    return store.userEngagements.get(key) || null;
  },

  async updatePulseEngagement(
    projectId: string,
    uid: string,
    action: "toggle_watch" | "toggle_pay" | "set_city" | "toggle_back" | "vote_pathway",
    city?: string,
    pathwayIndex?: number
  ): Promise<{ metrics: Project["metrics"]; userRecord: UserEngagementRecord }> {
    const project = store.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const key = `${projectId}_${uid}`;
    let userRecord = store.userEngagements.get(key);
    if (!userRecord) {
      userRecord = {
        uid,
        projectId,
        watch: false,
        pay: false,
        city: null,
        back: false,
        votedPathwayIndex: null,
        updatedAt: new Date().toISOString(),
      };
    }

    if (action === "toggle_watch") {
      userRecord.watch = !userRecord.watch;
      project.metrics.watchCount += userRecord.watch ? 1 : -1;
    } else if (action === "toggle_pay") {
      userRecord.pay = !userRecord.pay;
      project.metrics.payCount += userRecord.pay ? 1 : -1;
    } else if (action === "toggle_back") {
      userRecord.back = !userRecord.back;
      project.metrics.backCount += userRecord.back ? 1 : -1;
    } else if (action === "set_city" && city) {
      const prevCity = userRecord.city;
      if (prevCity && project.metrics.cities[prevCity]) {
        project.metrics.cities[prevCity] -= 1;
        if (project.metrics.cities[prevCity] <= 0) delete project.metrics.cities[prevCity];
      }
      userRecord.city = city.trim();
      project.metrics.cities[userRecord.city] = (project.metrics.cities[userRecord.city] || 0) + 1;
      if (!prevCity) {
        project.metrics.cityDemandCount += 1;
      }
    } else if (action === "vote_pathway" && typeof pathwayIndex === "number" && pathwayIndex >= 0 && pathwayIndex <= 2) {
      const prevVote = userRecord.votedPathwayIndex;
      if (prevVote !== null && typeof prevVote === "number" && prevVote >= 0 && prevVote <= 2) {
        project.metrics.pathwayVotes[prevVote] = Math.max(0, project.metrics.pathwayVotes[prevVote] - 1);
      }
      if (prevVote === pathwayIndex) {
        // Deselect vote
        userRecord.votedPathwayIndex = null;
      } else {
        userRecord.votedPathwayIndex = pathwayIndex;
        project.metrics.pathwayVotes[pathwayIndex] = (project.metrics.pathwayVotes[pathwayIndex] || 0) + 1;
      }
    }

    // Invariant: Non-negative counts
    project.metrics.watchCount = Math.max(0, project.metrics.watchCount);
    project.metrics.payCount = Math.max(0, project.metrics.payCount);
    project.metrics.cityDemandCount = Math.max(0, project.metrics.cityDemandCount);
    project.metrics.backCount = Math.max(0, project.metrics.backCount);

    userRecord.updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    store.userEngagements.set(key, userRecord);
    store.projects.set(projectId, project);

    return { metrics: project.metrics, userRecord };
  },

  // Takes & Replies
  async getTakesByProject(projectId: string): Promise<Take[]> {
    return Array.from(store.takes.values())
      .filter((t) => t.projectId === projectId && t.status !== "withdrawn")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createTake(take: Take): Promise<void> {
    store.takes.set(take.id, take);
  },

  async updateTake(takeId: string, authorUid: string, body: string, status?: Take["status"]): Promise<Take> {
    const take = store.takes.get(takeId);
    if (!take || take.authorUid !== authorUid) throw new Error("Unauthorized or take not found");
    take.body = body;
    if (status) take.status = status;
    take.updatedAt = new Date().toISOString();
    store.takes.set(takeId, take);
    return take;
  },

  async getRepliesByTake(takeId: string): Promise<Reply[]> {
    return Array.from(store.replies.values())
      .filter((r) => r.takeId === takeId && r.status !== "withdrawn")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async createReply(reply: Reply): Promise<void> {
    store.replies.set(reply.id, reply);
  },

  // Evidence Leads
  async getEvidenceLeads(projectId: string): Promise<EvidenceLead[]> {
    return Array.from(store.evidenceLeads.values()).filter((e) => e.projectId === projectId);
  },

  async createEvidenceLead(lead: EvidenceLead): Promise<void> {
    store.evidenceLeads.set(lead.id, lead);
  },

  // Creator Claims & Updates
  async createCreatorClaim(claim: CreatorClaim): Promise<void> {
    store.creatorClaims.set(claim.id, claim);
    const project = store.projects.get(claim.projectId);
    if (project) {
      project.creatorClaim.status = "pending";
      project.creatorClaim.claimedByUid = claim.claimedByUid;
    }
  },

  async getCreatorUpdates(projectId: string): Promise<CreatorUpdate[]> {
    return Array.from(store.creatorUpdates.values())
      .filter((u) => u.projectId === projectId)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async createCreatorUpdate(update: CreatorUpdate): Promise<void> {
    store.creatorUpdates.set(update.id, update);
  },

  // Reports & Corrections
  async createReport(report: Report): Promise<void> {
    store.reports.set(report.id, report);
  },

  async getCorrections(projectId: string): Promise<Correction[]> {
    return Array.from(store.corrections.values())
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },

  async createCorrection(correction: Correction): Promise<void> {
    store.corrections.set(correction.id, correction);
  },

  async getLivingUpdatesForProject(projectId: string) {
    try {
      const db = getAdminFirestore();
      const snapshot = await db
        .collection("projectLivingUpdates")
        .where("projectId", "==", projectId)
        .get();

      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: String(data.id || doc.id),
          projectId: String(data.projectId),
          summary: String(data.summary),
          eventDate: typeof data.eventDate === "string" ? data.eventDate : null,
          citations: Array.isArray(data.citations) ? data.citations : [],
          confidence: typeof data.confidence === "string" ? data.confidence : null,
          detectedAt: typeof data.detectedAt === "string" ? data.detectedAt : new Date().toISOString(),
        };
      });

      return items.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 20);
    } catch {
      return [];
    }
  },

  async saveProjectMonitor(monitor: ProjectMonitor): Promise<void> {
    try {
      const db = getAdminFirestore();
      await db.collection("projectMonitors").doc(monitor.id).set(monitor);
    } catch {}
    store.projectMonitors.set(monitor.id, monitor);
  },

  async getProjectMonitorById(monitorId: string): Promise<ProjectMonitor | null> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("projectMonitors").doc(monitorId).get();
      if (doc.exists) {
        const data = doc.data() as ProjectMonitor;
        return {
          id: doc.id,
          projectId: String(data.projectId),
          queryScope: String(data.queryScope || ""),
          providerState: data.providerState || "active",
          registrationState: data.registrationState,
          lastExecutionResult: data.lastExecutionResult,
          lastSuccessfulCheckAt: data.lastSuccessfulCheckAt,
          lastMaterialChangeAt: data.lastMaterialChangeAt,
          createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
          lastCheckedAt: data.lastCheckedAt,
          lastEventAt: data.lastEventAt,
          targetUrl: data.targetUrl,
        };
      }
    } catch {}
    return store.projectMonitors.get(monitorId) || null;
  },

  async listProjectMonitors(projectId: string): Promise<ProjectMonitor[]> {
    try {
      const db = getAdminFirestore();
      const snap = await db.collection("projectMonitors").where("projectId", "==", projectId).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => {
          const data = doc.data() as ProjectMonitor;
          return {
            id: doc.id,
            projectId: String(data.projectId),
            queryScope: String(data.queryScope || ""),
            providerState: data.providerState || "active",
            registrationState: data.registrationState,
            lastExecutionResult: data.lastExecutionResult,
            lastSuccessfulCheckAt: data.lastSuccessfulCheckAt,
            lastMaterialChangeAt: data.lastMaterialChangeAt,
            createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
            lastCheckedAt: data.lastCheckedAt,
            lastEventAt: data.lastEventAt,
            targetUrl: data.targetUrl,
          };
        });
      }
    } catch {}
    return Array.from(store.projectMonitors.values()).filter((m) => m.projectId === projectId);
  },

  async getProjectMonitorByProjectId(projectId: string): Promise<ProjectMonitor | null> {
    const monitors = await this.listProjectMonitors(projectId);
    if (!monitors || monitors.length === 0) return null;
    const active = monitors.find((m) => m.providerState === "active");
    if (active) return active;
    return monitors[monitors.length - 1];
  },

  async atomicPublishMonitorCardUpdate(params: {
    projectId: string;
    expectedBaseVersion: number;
    newCard: ScoutCard;
    monitorId: string;
    receipt: WebhookReceipt;
    monitorUpdates?: Partial<ProjectMonitor>;
    livingUpdate?: {
      summary: string;
      citations?: any[];
      category?: string;
    };
  }): Promise<{ card: ScoutCard; project: Project }> {
    const { projectId, expectedBaseVersion, newCard, monitorId, receipt, monitorUpdates, livingUpdate } = params;
    const project = await this.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found for monitor card update`);
    }

    if (project.publishedCardId) {
      const currentCard = await this.getScoutCardById(project.publishedCardId);
      const currentVersion = currentCard?.version || 1;
      if (currentVersion !== expectedBaseVersion) {
        throw new Error(
          `Concurrency conflict: current card version is ${currentVersion}, expected base was ${expectedBaseVersion}`
        );
      }
    }

    const now = new Date().toISOString();
    project.publishedCardId = newCard.id;
    project.audioStale = true;
    project.updatedAt = now;

    const monitor = await this.getProjectMonitorById(monitorId);
    if (monitor) {
      monitor.lastCheckedAt = now;
      monitor.lastEventAt = now;
      monitor.lastSuccessfulCheckAt = now;
      monitor.lastMaterialChangeAt = now;
      monitor.lastExecutionResult = "detected_change";
      if (monitorUpdates) {
        Object.assign(monitor, monitorUpdates);
      }
    }

    try {
      const db = getAdminFirestore();
      if (db) {
        await db.runTransaction(async (transaction) => {
          const projRef = db.collection("projects").doc(projectId);
          const projSnap = await transaction.get(projRef);
          if (!projSnap.exists) {
            throw new Error(`Project ${projectId} not found in Firestore`);
          }
          const projData = projSnap.data() as any;
          if (projData?.publishedCardId) {
            const cardSnap = await transaction.get(db.collection("scoutCards").doc(projData.publishedCardId));
            const currentVer = cardSnap.data()?.version || 1;
            if (currentVer !== expectedBaseVersion) {
              throw new Error(
                `Concurrency conflict: current card version is ${currentVer}, expected base was ${expectedBaseVersion}`
              );
            }
          }
          const receiptRef = db.collection("webhookReceipts").doc(receipt.webhookId);
          const receiptSnap = await transaction.get(receiptRef);
          if (receiptSnap.exists) {
            // Already processed idempotently
            return;
          }

          transaction.set(db.collection("scoutCards").doc(newCard.id), cleanFirestoreObject(newCard));
          transaction.set(
            projRef,
            cleanFirestoreObject({
              publishedCardId: newCard.id,
              audioStale: true,
              updatedAt: now,
            }),
            { merge: true }
          );
          if (monitor) {
            transaction.set(db.collection("projectMonitors").doc(monitor.id), cleanFirestoreObject(monitor), { merge: true });
          }
          transaction.set(receiptRef, cleanFirestoreObject(receipt));
          if (livingUpdate) {
            const updateId = `update-${Date.now()}`;
            transaction.set(db.collection("projectLivingUpdates").doc(updateId), {
              id: updateId,
              projectId,
              summary: livingUpdate.summary,
              eventDate: now,
              citations: livingUpdate.citations || [],
              confidence: "high",
              detectedAt: now,
              category: livingUpdate.category || "production",
            });
          }
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`Database error in atomicPublishMonitorCardUpdate: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    store.scoutCards.set(newCard.id, newCard);
    store.projects.set(projectId, project);
    if (monitor) {
      store.projectMonitors.set(monitor.id, monitor);
    }
    store.webhookReceipts.set(receipt.webhookId, receipt);

    return { card: newCard, project };
  },


  async recordWebhookReceipt(receipt: WebhookReceipt): Promise<void> {
    try {
      const db = getAdminFirestore();
      await db.collection("webhookReceipts").doc(receipt.webhookId).set(receipt);
    } catch {}
    store.webhookReceipts.set(receipt.webhookId, receipt);
  },

  async hasWebhookReceipt(webhookId: string): Promise<boolean> {
    try {
      const db = getAdminFirestore();
      const doc = await db.collection("webhookReceipts").doc(webhookId).get();
      if (doc.exists) return true;
    } catch {}
    return store.webhookReceipts.has(webhookId);
  },
};
