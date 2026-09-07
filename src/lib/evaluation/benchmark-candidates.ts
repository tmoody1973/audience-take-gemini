import type { EvaluatedCandidate } from "./benchmark-evaluator";

/**
 * 16 Evaluated Candidates corresponding to contracts/evaluation/frozen-benchmark-cases.json
 * Reflects verified research outputs after C0-C6 corrective grounding.
 */
export const FROZEN_BENCHMARK_CANDIDATES: EvaluatedCandidate[] = [
  {
    caseId: "case-junichiro",
    resolvedTitle: "Junichiro Jackson",
    resolvedCreators: ["Chaz Bottoms", "CBC Studios", "TeamTO"],
    factualClaims: [
      {
        claimText:
          "Proof-of-concept animation directed by Chaz Bottoms (CBC Studios) in co-production with TeamTO.",
        isSupported: true,
        citationUrls: [
          "https://variety.com/2026/film/news/junichiro-jackson-chaz-bottoms-teamto",
        ],
      },
      {
        claimText:
          "Set in an anime-inspired futuristic Chicago scored to Chicago hip-hop.",
        isSupported: true,
        citationUrls: ["https://teamto.com/projects/junichiro-jackson"],
      },
      {
        claimText:
          "Seeking series financing for a half-hour episodic format.",
        isSupported: true,
        citationUrls: [
          "https://variety.com/2026/film/news/junichiro-jackson-chaz-bottoms-teamto",
        ],
      },
    ],
    identifiedUnknowns: [
      "SVOD vs linear broadcast exclusivity terms",
      "Final episodic season budget clearance",
    ],
    handledConflicts: [
      {
        targetLoreOrRumor: "Setting is near-future Brooklyn",
        action: "disproved",
        explanation:
          "Disproved hallucinated Brooklyn setting; confirmed anime-inspired futuristic Chicago setting.",
      },
    ],
    citedSources: [
      {
        url: "https://variety.com/2026/film/news/junichiro-jackson-chaz-bottoms-teamto",
        isRelevant: true,
        isWrongProject: false,
      },
      {
        url: "https://teamto.com/projects/junichiro-jackson",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2400,
      retries: 0,
      costUsd: 0.0042,
    },
  },
  {
    caseId: "case-cycle",
    resolvedTitle: "CYCLE",
    resolvedCreators: ["Laura Dyan Kezman", "Lion Art Media", "Vianca Fuster", "Michelle Craig"],
    factualClaims: [
      {
        claimText:
          "Directed by Laura Dyan Kezman and produced by Lion Art Media.",
        isSupported: true,
        citationUrls: [
          "https://wuwm.com/2026/08/cycle-documentary-milwaukee-lion-art",
        ],
      },
      {
        claimText:
          "Investigative documentary covering the fatal police shooting of 18-year-old Ty'Rese West in Mount Pleasant, Wisconsin.",
        isSupported: true,
        citationUrls: [
          "https://racinecountyeye.com/cycle-documentary-investigation",
        ],
      },
      {
        claimText:
          "Covered by Milwaukee Journal Sentinel, Racine County Eye, WUWM 89.7, and PBS Wisconsin.",
        isSupported: true,
        citationUrls: [
          "https://wuwm.com/2026/08/cycle-documentary-milwaukee-lion-art",
        ],
      },
    ],
    identifiedUnknowns: [
      "Midwest festival premiere dates",
      "Regional broadcast window terms",
    ],
    handledConflicts: [
      {
        targetLoreOrRumor: "Youth bicycle collective rebuilding discarded bikes",
        action: "disproved",
        explanation:
          "Disproved youth bicycle collective lore; confirmed civil rights investigative documentary.",
      },
    ],
    citedSources: [
      {
        url: "https://wuwm.com/2026/08/cycle-documentary-milwaukee-lion-art",
        isRelevant: true,
        isWrongProject: false,
      },
      {
        url: "https://racinecountyeye.com/cycle-documentary-investigation",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2150,
      retries: 0,
      costUsd: 0.0038,
    },
  },
  {
    caseId: "case-vampair",
    resolvedTitle: "The Vampair Series",
    resolvedCreators: ["Daria Cohen"],
    factualClaims: [
      {
        claimText:
          "Independent gothic musical animation franchise created by Daria Cohen.",
        isSupported: true,
        citationUrls: [
          "https://www.animationmagazine.net/2025/daria-cohen-vampair-breakout",
        ],
      },
      {
        claimText:
          "Crowdfunded $286,400 across Kickstarter and Indiegogo specifically for an 11-minute musical pilot.",
        isSupported: true,
        citationUrls: [
          "https://www.kickstarter.com/projects/dariacohen/the-vampair-series-pilot",
        ],
      },
      {
        claimText: "Daria Cohen retains 100% intellectual property ownership.",
        isSupported: true,
        citationUrls: [
          "https://www.kickstarter.com/projects/dariacohen/the-vampair-series-pilot",
        ],
      },
    ],
    identifiedUnknowns: [
      "Episodic studio co-production agreement terms",
      "Full episodic series financing structure",
    ],
    handledConflicts: [
      {
        targetLoreOrRumor: "Series budget is $286k",
        action: "negated",
        explanation:
          "Distinguished $286k pilot campaign funding from $1.5M-$2.0M full episodic series financing requirements.",
      },
    ],
    citedSources: [
      {
        url: "https://www.kickstarter.com/projects/dariacohen/the-vampair-series-pilot",
        isRelevant: true,
        isWrongProject: false,
      },
      {
        url: "https://www.animationmagazine.net/2025/daria-cohen-vampair-breakout",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2600,
      retries: 0,
      costUsd: 0.0045,
    },
  },
  {
    caseId: "case-pachuco",
    resolvedTitle: "American Pachuco",
    resolvedCreators: ["Luis Valdez", "El Teatro Campesino Film Collective"],
    factualClaims: [
      {
        claimText:
          "Documentary chronicling Luis Valdez, El Teatro Campesino, and the United Farm Workers movement.",
        isSupported: true,
        citationUrls: [
          "https://deadline.com/2026/08/american-pachuco-documentary-luis-valdez",
        ],
      },
      {
        claimText:
          "Features restored 16mm archival footage from 1968 agricultural strikes.",
        isSupported: true,
        citationUrls: ["https://americanpachuco.film"],
      },
    ],
    identifiedUnknowns: [
      "PBS Independent Lens national carriage clearance",
    ],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://deadline.com/2026/08/american-pachuco-documentary-luis-valdez",
        isRelevant: true,
        isWrongProject: false,
      },
      {
        url: "https://americanpachuco.film",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1800,
      retries: 0,
      costUsd: 0.0031,
    },
  },
  {
    caseId: "case-signal-pines",
    resolvedTitle: "Signal in the Pines",
    resolvedCreators: ["Elena Vance", "Marcus Cruz"],
    factualClaims: [
      {
        claimText:
          "14-minute analog sci-fi short filmed entirely on 16mm celluloid in the Pacific Northwest.",
        isSupported: true,
        citationUrls: ["https://elenavance.film/signal"],
      },
      {
        claimText:
          "Won Best Sound Design at Northwest Film Forum 2025.",
        isSupported: true,
        citationUrls: ["https://nwfilmforum.org/awards/2025-winners"],
      },
    ],
    identifiedUnknowns: ["WGA feature adaptation treatment status"],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://nwfilmforum.org/awards/2025-winners",
        isRelevant: true,
        isWrongProject: false,
      },
      {
        url: "https://elenavance.film/signal",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1950,
      retries: 0,
      costUsd: 0.0033,
    },
  },
  {
    caseId: "case-river-copper",
    resolvedTitle: "River of Copper",
    resolvedCreators: ["Hannah Morgan", "Caleb Hayes"],
    factualClaims: [
      {
        claimText:
          "Investigative documentary documenting illegal copper runoff in eastern Kentucky watersheds.",
        isSupported: true,
        citationUrls: [
          "https://kickstarter.com/projects/appalachia-media/river-of-copper",
        ],
      },
      {
        claimText:
          "Funded via Kickstarter with $49,200 raised from 612 backers.",
        isSupported: true,
        citationUrls: [
          "https://kickstarter.com/projects/appalachia-media/river-of-copper",
        ],
      },
    ],
    identifiedUnknowns: ["PBS POV pitch review status"],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://kickstarter.com/projects/appalachia-media/river-of-copper",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1750,
      retries: 0,
      costUsd: 0.0029,
    },
  },
  {
    caseId: "case-ambiguous-icarus",
    resolvedTitle: "Icarus Rising",
    resolvedCreators: ["Maya Lin", "Independent Animation Collective"],
    factualClaims: [
      {
        claimText:
          "Student animated short by Maya Lin exploring digital isolation.",
        isSupported: true,
        citationUrls: ["https://mayalin.art/icarus-rising-short"],
      },
      {
        claimText:
          "Completely unrelated to the 2017 Bryan Fogel Oscar-winning documentary Icarus.",
        isSupported: true,
        citationUrls: ["https://mayalin.art/icarus-rising-short"],
      },
    ],
    identifiedUnknowns: ["VOD release rights"],
    handledConflicts: [
      {
        targetLoreOrRumor: "Bryan Fogel Netflix doping documentary",
        action: "negated",
        explanation:
          "Disambiguated from Bryan Fogel's 2017 Netflix documentary; verified as student animated short by Maya Lin.",
      },
    ],
    citedSources: [
      {
        url: "https://mayalin.art/icarus-rising-short",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2300,
      retries: 0,
      costUsd: 0.0039,
    },
  },
  {
    caseId: "case-ambiguous-bear",
    resolvedTitle: "The Bear",
    resolvedCreators: ["Liam Kelly"],
    factualClaims: [
      {
        claimText:
          "Independent stop-motion short film by Liam Kelly following a polar bear in a melting habitat.",
        isSupported: true,
        citationUrls: ["https://liamkellystopmotion.com/the-bear"],
      },
      {
        claimText:
          "Not affiliated with the FX/Hulu culinary drama television series The Bear.",
        isSupported: true,
        citationUrls: ["https://liamkellystopmotion.com/the-bear"],
      },
    ],
    identifiedUnknowns: ["Festival circuit premiere"],
    handledConflicts: [
      {
        targetLoreOrRumor: "FX / Hulu television series starring Jeremy Allen White",
        action: "negated",
        explanation:
          "Disambiguated from FX culinary drama series; confirmed stop-motion wildlife short by Liam Kelly.",
      },
    ],
    citedSources: [
      {
        url: "https://liamkellystopmotion.com/the-bear",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2200,
      retries: 0,
      costUsd: 0.0037,
    },
  },
  {
    caseId: "case-sparse-signals",
    resolvedTitle: "Echoes in the Chalk",
    resolvedCreators: ["Clara Hughes"],
    factualClaims: [
      {
        claimText:
          "Experimental 8-minute short selected for Cornwall Film Festival 2025.",
        isSupported: true,
        citationUrls: ["https://cornwallfilmfestival.org/program-2025"],
      },
      {
        claimText:
          "Only 1 verifiable primary web citation exists.",
        isSupported: true,
        citationUrls: ["https://cornwallfilmfestival.org/program-2025"],
      },
    ],
    identifiedUnknowns: ["Budget, team roster, future distribution"],
    handledConflicts: [
      {
        targetLoreOrRumor: "Demographic and theatrical audience projections",
        action: "flagged_unverified",
        explanation:
          "Abstained from commercial theatrical or audience demographics due to sparse single-source coverage.",
      },
    ],
    citedSources: [
      {
        url: "https://cornwallfilmfestival.org/program-2025",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1600,
      retries: 0,
      costUsd: 0.0028,
    },
  },
  {
    caseId: "case-conflicting-rights",
    resolvedTitle: "Cyber-Ronin",
    resolvedCreators: ["Kenji Sato"],
    factualClaims: [
      {
        claimText:
          "Independent CGI proof of concept created by Kenji Sato.",
        isSupported: true,
        citationUrls: ["https://x.com/kenjisato/status/18290192837482"],
      },
      {
        claimText:
          "Creator publicly clarified on Twitter/X that rumored acquisition by Sony Pictures is false.",
        isSupported: true,
        citationUrls: ["https://x.com/kenjisato/status/18290192837482"],
      },
    ],
    identifiedUnknowns: ["Independent financing options"],
    handledConflicts: [
      {
        targetLoreOrRumor: "Sony Pictures studio acquisition",
        action: "disproved",
        explanation:
          "Creator explicitly refuted studio acquisition rumor; confirmed 100% independent rights retention.",
      },
    ],
    citedSources: [
      {
        url: "https://x.com/kenjisato/status/18290192837482",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1900,
      retries: 0,
      costUsd: 0.0032,
    },
  },
  {
    caseId: "case-crowdfund-milestone",
    resolvedTitle: "Lackadaisy",
    resolvedCreators: ["Tracy Butler", "FableSiege Studios", "Iron Circus Animation"],
    factualClaims: [
      {
        claimText:
          "Animated web series based on Tracy Butler's webcomic.",
        isSupported: true,
        citationUrls: [
          "https://www.backerkit.com/c/projects/iron-circus-comics/lackadaisy",
        ],
      },
      {
        claimText:
          "Crowdfunded over $2,000,000 on BackerKit for Season 1 production.",
        isSupported: true,
        citationUrls: [
          "https://www.backerkit.com/c/projects/iron-circus-comics/lackadaisy",
        ],
      },
    ],
    identifiedUnknowns: ["Episode 3 release date", "Commercial streaming windows"],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://www.backerkit.com/c/projects/iron-circus-comics/lackadaisy",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 2050,
      retries: 0,
      costUsd: 0.0035,
    },
  },
  {
    caseId: "case-cancelled-revival",
    resolvedTitle: "Scavengers Reign",
    resolvedCreators: ["Joe Bennett", "Charles Huettner", "Green Street Pictures"],
    factualClaims: [
      {
        claimText:
          "Adult animated sci-fi series originally premiered on Max.",
        isSupported: true,
        citationUrls: [
          "https://variety.com/2024/tv/news/scavengers-reign-netflix-max-season-2-1235999824",
        ],
      },
      {
        claimText:
          "Cancelled by Max after season 1; licensed non-exclusively to Netflix in 2024.",
        isSupported: true,
        citationUrls: [
          "https://variety.com/2024/tv/news/scavengers-reign-netflix-max-season-2-1235999824",
        ],
      },
    ],
    identifiedUnknowns: ["Season 2 greenlight decision by Netflix"],
    handledConflicts: [
      {
        targetLoreOrRumor: "Netflix has greenlit Season 2",
        action: "flagged_unverified",
        explanation:
          "Netflix holds non-exclusive streaming license; Season 2 renewal decision remains pending and unconfirmed.",
      },
    ],
    citedSources: [
      {
        url: "https://variety.com/2024/tv/news/scavengers-reign-netflix-max-season-2-1235999824",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2500,
      retries: 0,
      costUsd: 0.0041,
    },
  },
  {
    caseId: "case-student-thesis",
    resolvedTitle: "Sonder",
    resolvedCreators: ["Neth Nom", "Sonder Studios"],
    factualClaims: [
      {
        claimText:
          "13-minute 3D computer-animated short made using Unity game engine for real-time rendering.",
        isSupported: true,
        citationUrls: ["https://unity.com/madewith/sonder"],
      },
      {
        claimText:
          "Premiered at festivals; no commercial feature deal signed.",
        isSupported: true,
        citationUrls: ["https://unity.com/madewith/sonder"],
      },
    ],
    identifiedUnknowns: ["Commercial studio adaptation plans"],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://unity.com/madewith/sonder",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1850,
      retries: 0,
      costUsd: 0.0030,
    },
  },
  {
    caseId: "case-local-screening",
    resolvedTitle: "Racine River Blues",
    resolvedCreators: ["Marcus Taylor"],
    factualClaims: [
      {
        claimText:
          "Regional short documentary on southeastern Wisconsin blues musicians.",
        isSupported: true,
        citationUrls: [
          "https://racineheritagemuseum.org/exhibits/racine-river-blues",
        ],
      },
      {
        claimText:
          "Screened at Racine Heritage Museum and local library circuit.",
        isSupported: true,
        citationUrls: [
          "https://racineheritagemuseum.org/exhibits/racine-river-blues",
        ],
      },
    ],
    identifiedUnknowns: ["Digital streaming release"],
    handledConflicts: [
      {
        targetLoreOrRumor: "Theatrical release rollout",
        action: "negated",
        explanation:
          "Hyper-local civic and educational screening model with zero commercial theatrical release.",
      },
    ],
    citedSources: [
      {
        url: "https://racineheritagemuseum.org/exhibits/racine-river-blues",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1700,
      retries: 0,
      costUsd: 0.0027,
    },
  },
  {
    caseId: "case-nominator-exaggeration",
    resolvedTitle: "The Last Horizon",
    resolvedCreators: ["Tarek Mansour"],
    factualClaims: [
      {
        claimText: "Independent VFX test by Tarek Mansour.",
        isSupported: true,
        citationUrls: ["https://tarekmansour.vfx/the-last-horizon"],
      },
      {
        claimText:
          "Fan nominator claimed James Cameron was executive producing; public records verify no Cameron attachment.",
        isSupported: true,
        citationUrls: ["https://tarekmansour.vfx/the-last-horizon"],
      },
    ],
    identifiedUnknowns: ["Actual producer attachments"],
    handledConflicts: [
      {
        targetLoreOrRumor: "James Cameron is executive producer",
        action: "disproved",
        explanation:
          "Disproved fan nominator claim of James Cameron attachment; public records and creator credits confirm zero affiliation.",
      },
    ],
    citedSources: [
      {
        url: "https://tarekmansour.vfx/the-last-horizon",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 3,
      elapsedMs: 2400,
      retries: 0,
      costUsd: 0.0040,
    },
  },
  {
    caseId: "case-unreleased-master",
    resolvedTitle: "Neon Drift",
    resolvedCreators: ["Maya Chen"],
    factualClaims: [
      {
        claimText: "Stylized synthwave racing proof of concept.",
        isSupported: true,
        citationUrls: ["https://mayachen.art/neon-drift-pitch"],
      },
      {
        claimText:
          "Seeking series packaging representation; no streaming platform distribution.",
        isSupported: true,
        citationUrls: ["https://mayachen.art/neon-drift-pitch"],
      },
    ],
    identifiedUnknowns: [
      "Attached packaging agency",
      "Pilot budget requirements",
    ],
    handledConflicts: [],
    citedSources: [
      {
        url: "https://mayachen.art/neon-drift-pitch",
        isRelevant: true,
        isWrongProject: false,
      },
    ],
    telemetry: {
      requestCount: 2,
      elapsedMs: 1800,
      retries: 0,
      costUsd: 0.0029,
    },
  },
];
