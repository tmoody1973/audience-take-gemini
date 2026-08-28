export const validSciFiShortProposal = {
  projectTitle: "Signal in the Pines",
  medium: "short" as const,
  stage: "festival_circuit" as const,
  creators: ["Elena Vance", "Marcus Cruz"],
  whatWeKnow: [
    "Shot on 16mm film in the Pacific Northwest over 12 days in 2025.",
    "Premiered at the 2025 Northwest Film Forum and won Best Sound Design.",
    "Features a complete 14-minute runtime with original analog synthesizer score by Marcus Cruz."
  ],
  whatWereChecking: [
    "Whether the feature script draft is registered with WGA.",
    "Status of international festival distribution rights."
  ],
  whyScouted: "A masterclass in tension and analog audio craft that creates an eerie sci-fi atmosphere with minimal VFX.",
  sourceMedia: [
    {
      type: "youtube_embed" as const,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      verified: true,
      caption: "Official Festival Teaser (14 min short film)"
    }
  ],
  evidenceLedger: [
    {
      id: "ev-1",
      sourceUrl: "https://nwfilmforum.org/awards/2025-winners",
      title: "Northwest Film Forum 2025 Festival Awards",
      publisher: "Northwest Film Forum",
      claimType: "reported" as const,
      excerpt: "Best Sound Design awarded to Signal in the Pines, directed by Elena Vance with score by Marcus Cruz.",
      verified: true
    },
    {
      id: "ev-2",
      sourceUrl: "https://elenavance.film/signal-press",
      title: "Signal in the Pines Production Notes",
      publisher: "Elena Vance Cinema",
      claimType: "observation" as const,
      excerpt: "Completed in 2025 on 16mm film with a 14-minute runtime in the Pacific Northwest forests.",
      verified: true
    }
  ],
  pathways: [
    {
      title: "Micro-Budget Feature Expansion",
      mediumFitRationale: "The 14-minute proof of concept establishes a claustrophobic lore that naturally expands into a contained 90-minute thriller.",
      targetAudience: "Fans of slow-burn analog sci-fi such as The Vast of Night and Primer.",
      risksAndUncertainties: ["Maintaining narrative momentum across a 90-minute feature runtime with a limited cast."],
      nextBoundedExperiment: {
        name: "Feature Outline Audience Read & Pulse Poll",
        description: "Share the 10-page treatment with trusted scouts and measure willingness to back a localized crowdfunding campaign.",
        successMetric: "At least 150 'Back the next chapter' commitments on Audience Take."
      }
    },
    {
      title: "Curated Sci-Fi Festival & VOD Showcase",
      mediumFitRationale: "Short films benefit from targeted genre festivals like Fantasia and Fantastic Fest before entering curated platforms like Omeleto.",
      targetAudience: "Short film cinephiles and genre festival attendees.",
      risksAndUncertainties: ["Festival submission entry fee costs and exclusivity embargoes."],
      nextBoundedExperiment: {
        name: "Fantastic Fest & Beyond Fest Submission Campaign",
        description: "Submit to top 5 North American genre festivals.",
        successMetric: "Official selection at 1 or more Tier-1 genre festivals."
      }
    },
    {
      title: "Anthology Episode Adaptation",
      mediumFitRationale: "The concept functions cleanly as a standalone installment in an episodic sci-fi/horror anthology series.",
      targetAudience: "Audience of Twilight Zone, Black Mirror, and Cabinet of Curiosities.",
      risksAndUncertainties: ["Anthology buyers typically require packaged IP or established showrunners."],
      nextBoundedExperiment: {
        name: "Pitch Deck Pitch-to-Scouts Session",
        description: "Publish a sanitized anthology pitch bible for community review.",
        successMetric: "75% positive take consensus from verified Fan Scouts."
      }
    }
  ] as [any, any, any],
  decisionBrief: {
    logline: "A lone forest ranger intercepts an encoded radio transmission on an analog monitor that repeats her childhood memories.",
    coreHook: "Tactile 16mm aesthetic paired with spatial audio design that creates dread without CGI.",
    comparativeTitles: ["The Vast of Night", "Beyond the Black Rainbow", "Enys Men"],
    primaryRisk: "Niche aesthetic requires targeted genre audience activation."
  },
  industryLens: {
    marketContext: "Elevated indie sci-fi shorts with strong audio identity have high conversion rates for director representation.",
    comparables: ["The Vast of Night ($700k budget)", "Skinamarink ($15k budget)"],
    realisticConstraints: "Feature budget should remain under $1.5M to preserve creative autonomy."
  }
};

export const hypeViolatingProposal = {
  ...validSciFiShortProposal,
  whatWeKnow: [
    "Greenlight Score: 95% indicates certain commercial success.",
    "Netflix is bidding $5M for worldwide exclusive rights."
  ]
};

export const mediumMismatchDocProposal = {
  ...validSciFiShortProposal,
  medium: "documentary" as const,
  pathways: [
    {
      title: "3D Animated Series Adaptation",
      mediumFitRationale: "Turn this documentary into a kids 3D animated series.",
      targetAudience: "Children ages 6-11.",
      risksAndUncertainties: ["Animation production costs."],
      nextBoundedExperiment: {
        name: "Animation Demo",
        description: "Render a 30s teaser.",
        successMetric: "Views."
      }
    },
    validSciFiShortProposal.pathways[1],
    validSciFiShortProposal.pathways[2]
  ] as [any, any, any]
};
