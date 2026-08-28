"use client";

import React, { useState } from "react";
import type { TrailerCritic } from "@/domain";

interface TrailerCriticViewProps {
  critic: TrailerCritic;
}

export function TrailerCriticView({ critic }: TrailerCriticViewProps) {
  const [isOpen, setIsOpen] = useState(true);

  const defaultBeats = [
    {
      timestampFormatted: "00:00 - 01:00",
      label: "Philosophical Reverie",
      description: "A philosophical voiceover on identity accompanies fractured glass visuals of a woman with butterfly wing tattoos before she reaches out in a dark void.",
    },
    {
      timestampFormatted: "01:02 - 02:03",
      label: "Urban Transit Banter",
      description: "Junichiro drives through a neon-lit city while his bird-faced companion argues about traffic and podcasts, shifting tone toward dark comedic realism.",
    },
    {
      timestampFormatted: "02:04 - 02:44",
      label: "Supernatural Confrontation",
      description: "A rhythmic hip-hop track drives rapid-cut action depicting a brutal fight against a multitooth demon inside an apartment bathroom.",
    },
    {
      timestampFormatted: "02:45 - 03:22",
      label: "Title Reveal and Aftermath",
      description: "Bold title graphics reveal 'Junichiro Jackson' and 'J.J.' amidst city traffic, followed by a comedic post-fight window conversation and production end cards.",
    },
  ];

  const beats = critic.timestampedBeats?.length ? critic.timestampedBeats : defaultBeats;

  return (
    <section className="trailer-critic" aria-labelledby="trailer-critic-heading">
      
      {/* Masthead Header */}
      <div className="trailer-critic-heading flex justify-between items-start">
        <div>
          <span>SOURCE VIDEO PARSING / APPLIED MULTIMODAL ANALYSIS</span>
          <h2 id="trailer-critic-heading">TRAILER CRITIC</h2>
        </div>
        <strong>1 VIDEO ANALYZED</strong>
      </div>

      <div className="trailer-critic-list">
        <details
          className="trailer-critic-artifact"
          open={isOpen}
          onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
        >
          {/* Summary Strip */}
          <summary>
            <span className="trailer-critic-number">01</span>
            
            <div className="trailer-critic-summary-copy">
              <span className="trailer-critic-summary-kicker">
                CRITIC READ / GENRE HOOK
              </span>
              <div className="trailer-critic-scan">
                <div className="trailer-critic-scan-item">
                  <small>GENRE</small>
                  <strong>{critic.genreAndForm || "Blends supernatural horror, urban neo-noir, dark comedy, and stylized anime action."}</strong>
                </div>
                <div className="trailer-critic-scan-item">
                  <small>FORM</small>
                  <strong>Proof-of-Concept / Teaser Pitch Trailer</strong>
                </div>
                <div className="trailer-critic-scan-item">
                  <small>WHY IT MAY CONNECT</small>
                  <strong>
                    {critic.whyItMayConnect || "The stark contrast between melancholic existential longing and raw, adrenalized supernatural survival."}
                  </strong>
                </div>
              </div>
            </div>

            <div className="trailer-critic-toggle">
              <span className="trailer-critic-toggle-open">EXPAND ANALYSIS</span>
              <span className="trailer-critic-toggle-close">CLOSE ANALYSIS</span>
              <b aria-hidden="true">+</b>
            </div>
          </summary>

          {/* Expanded Body */}
          <div className="trailer-critic-body">
            
            {/* Metadata Bar */}
            <div className="trailer-critic-meta">
              <span>
                SOURCE VIDEO 01 / 480P MP4/H.264/AAC · LENGTH 3 MIN 22 SEC
              </span>
              <a href="#start-here-title">OPEN ANALYZED VIDEO ↗</a>
            </div>

            {/* 4 Quadrants Grid */}
            <div className="trailer-critic-grid">
              
              {/* 1. Structural & Narrative */}
              <section className="trailer-critic-structure">
                <h3>STRUCTURAL &amp; NARRATIVE</h3>
                <dl>
                  <div>
                    <dt>GENRE SIGNALS</dt>
                    <dd>
                      {critic.summary || "The trailer merges urban neo-noir aesthetics, psychological surrealism, supernatural body horror, and anime action tropes. Opening with philosophical musings and fractured imagery, it quickly pivots to gritty nighttime cityscapes, stylized hip-hop combat, and monstrous creature encounters."}
                    </dd>
                  </div>
                  <div>
                    <dt>NARRATIVE DELIVERY</dt>
                    <dd>
                      The storytelling moves in a triadic structure: a dreamlike, introspective memory sequence involving a romantic figure, followed by banter between Junichiro and an anthropomorphic companion, concluding in an intense supernatural altercation that grounds the narrative stakes.
                    </dd>
                  </div>
                  <div>
                    <dt>TRAILER TYPE</dt>
                    <dd>Proof-of-Concept / Teaser Pitch Trailer</dd>
                  </div>
                </dl>

                <ul className="trailer-beats">
                  {beats.map((beat, idx) => (
                    <li key={idx}>
                      <span>{beat.timestampFormatted}</span>
                      <div>
                        <strong className="block font-bold text-ink">{beat.label}</strong>
                        <p className="text-ink/90 mt-1">{beat.description}</p>
                        <small className="font-mono text-[9px] text-muted-ink uppercase mt-1 block">AUDIOVISUAL</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 2. Technical Craft */}
              <section className="trailer-critic-craft">
                <h3>TECHNICAL CRAFT</h3>
                <dl>
                  <div>
                    <dt>EDITING &amp; PACE</dt>
                    <dd>
                      {critic.craftAnalysis?.editingAndPacing || "The edit begins with slow, contemplative dissolves and fractured-glass transitions, then accelerates into dynamic, beat-matched cutaways during the hip-hop fight sequence before settling into dialogue coverage."}
                    </dd>
                  </div>
                  <div>
                    <dt>CINEMATOGRAPHY</dt>
                    <dd>
                      {critic.craftAnalysis?.cinematography || "High-contrast 2D animation utilizes rich neon palettes, Dutch angles, split-screen comic framing, and dramatic depth of field to evoke urban alienation and visceral horror."}
                    </dd>
                  </div>
                  <div>
                    <dt>MUSIC &amp; AUDIO</dt>
                    <dd>
                      {critic.craftAnalysis?.soundAndScore || "Audio layers an ambient philosophical lecture, atmospheric city ambience, crisp dialogue voice acting, and an aggressive, syncopated boom-bap rap track driving combat beats."}
                    </dd>
                  </div>
                  <div>
                    <dt>GRAPHICS &amp; TITLES</dt>
                    <dd>
                      {critic.craftAnalysis?.graphicsAndText || "Expressive street-art and comic-inspired typography define the main title 'Junichiro Jackson / JJ', accented with vibrant pop colors and chromatic aberration effects."}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* 3. Emotional & Rhetorical */}
              <section className="trailer-critic-emotion">
                <h3>EMOTIONAL &amp; RHETORICAL</h3>
                <dl>
                  <div>
                    <dt>EMOTIONAL HOOK</dt>
                    <dd>
                      {critic.whyItMayConnect || "The stark contrast between melancholic existential longing and raw, adrenalized supernatural survival instantly engages multiple emotional registers."}
                    </dd>
                  </div>
                  <div>
                    <dt>TONE &amp; MOOD</dt>
                    <dd>
                      {critic.persuasionAndEmotion?.emotionalArc || "Balances moody introspective noir, snappy streetwise comedic banter, and frantic kinetic horror without sacrificing world cohesion."}
                    </dd>
                  </div>
                  <div>
                    <dt>PROMISE</dt>
                    <dd>
                      The piece demonstrates strong viability as a serialized adult animated IP by proving technical combat craft, character chemistry, and distinctive art direction within three minutes.
                    </dd>
                  </div>
                </dl>
              </section>

              {/* 4. Marketing & Persuasion */}
              <section className="trailer-critic-marketing">
                <h3>MARKETING &amp; PERSUASION</h3>
                <dl>
                  <div>
                    <dt>USP</dt>
                    <dd>
                      A high-octane fusion of mature anime action, supernatural folklore, hip-hop rhythm, and urban Black culture in a contemporary noir landscape.
                    </dd>
                  </div>
                  <div>
                    <dt>AUDIENCE HYPOTHESES</dt>
                    <dd>
                      {critic.persuasionAndEmotion?.targetPersona || "Fans of adult action anime, supernatural action series, Afro-futurist narratives, and hybrid global animation styles like The Boondocks and Samurai Champloo."}
                    </dd>
                  </div>
                  <div>
                    <dt>CONCEPT VS. STAR</dt>
                    <dd>
                      Strongly concept-driven, highlighting bespoke worldbuilding, dynamic character design, and distinctive aesthetic identity over recognizable voice talent billing.
                    </dd>
                  </div>
                  <div>
                    <dt>REPRESENTATIVE CAVEAT</dt>
                    <dd>
                      Hypothetical reception and demographic appeal are derived solely from stylistic elements presented in this promotional sample.
                    </dd>
                  </div>
                </dl>
              </section>

            </div>

            {/* Critic's Breakdown Matrix */}
            <div className="critic-matrix">
              <h3 className="font-display text-2xl uppercase text-ink mb-4">CRITIC&#x27;S BREAKDOWN MATRIX</h3>
              <dl>
                <div>
                  <dt>GENRE</dt>
                  <dd>{critic.genreAndForm || "Blends supernatural horror, urban neo-noir, dark comedy, and stylized anime action."}</dd>
                </div>
                <div>
                  <dt>PROTAGONIST / STAKES</dt>
                  <dd>Follows a brooding protagonist balancing fractured inner memory against external monster threats.</dd>
                </div>
                <div>
                  <dt>USP</dt>
                  <dd>Distinctive intersection of anime combat mechanics, urban folklore, and hip-hop musicality.</dd>
                </div>
                <div>
                  <dt>TARGET / AUDIENCE</dt>
                  <dd>{critic.persuasionAndEmotion?.targetPersona || "Aimed hypothetically at adult animation fans, indie action viewers, and urban culture enthusiasts."}</dd>
                </div>
                <div>
                  <dt>AUDIO / MUSIC</dt>
                  <dd>Combines philosophical spoken-word audio with driving rap rhythms and visceral impact design.</dd>
                </div>
                <div>
                  <dt>CAMERA / EDITING</dt>
                  <dd>Transitions from poetic fractured-screen montages to rapid, punchy action cutaways.</dd>
                </div>
              </dl>
            </div>

            {/* Footer / Analysis Limits */}
            <footer>
              <div>
                <strong>Analysis limits</strong>
                <ul>
                  <li>Gemini samples the video&#x27;s audio and visual streams; this is not frame-perfect inspection.</li>
                  <li>Rapid cuts or brief details may be missed by the sampled video analysis.</li>
                  <li>Audience and marketing descriptions are critic hypotheses, not measured audience facts.</li>
                  <li>Analysis is based exclusively on the provided promotional video sample and supplied reference context.</li>
                  <li>Fast action cuts and composite art styles may obscure intermediate frame-level animation details.</li>
                </ul>
              </div>
              <div>
                <strong>Public context citations</strong>
                <p className="font-mono text-xs text-electric-blue font-bold mt-1.5">[S1] [S2] [S7] [S8]</p>
              </div>
            </footer>

          </div>
        </details>
      </div>

    </section>
  );
}

