"use client";

import React, { useState } from "react";
import type { ScoutCard, ScoutPathway } from "./types";

export type PathwayVotingSectionProps = {
  card: ScoutCard;
  onVote?: (pathwayId: string) => void;
};

export function PathwayVotingSection({ card, onVote }: PathwayVotingSectionProps) {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState<string | null>(null);

  const handleVote = (pathway: ScoutPathway) => {
    setSelectedPathwayId(pathway.id);
    setVoteSubmitted(pathway.label);
    if (onVote) {
      onVote(pathway.id);
    }
  };

  return (
    <section
      className="pathway-voting-section"
      aria-labelledby="pathway-voting-title"
    >
      <div className="pathway-voting-heading">
        <span className="pathway-voting-kicker">COMMUNITY PREFERENCE</span>
        <h2 id="pathway-voting-title">How would you like this story to grow?</h2>
        <p className="pathway-voting-desc">
          Vote for the development direction you would most want to watch or support.
          Voting expresses audience preference; it does not direct the creator or promise production.
        </p>
      </div>

      <div className="pathway-voting-grid">
        {card.pathways.map((pathway, idx) => {
          const isSelected = selectedPathwayId === pathway.id;
          return (
            <article
              key={pathway.id}
              className={`pathway-vote-card ${isSelected ? "is-selected" : ""}`}
            >
              <div className="pathway-vote-header">
                <span className="pathway-order-pill">PATHWAY {String(idx + 1).padStart(2, "0")}</span>
                <span className="pathway-format-pill">{pathway.format || pathway.label}</span>
              </div>

              <h3 className="pathway-vote-title">{pathway.label}</h3>

              <p className="pathway-vote-rationale">
                {pathway.rationale}
              </p>

              <div className="pathway-vote-implication">
                <small>AUDIENCE TARGET</small>
                <span>{pathway.audience || "Independent screen audience"}</span>
              </div>

              <button
                type="button"
                className={`pathway-vote-btn ${isSelected ? "is-voted" : ""}`}
                onClick={() => handleVote(pathway)}
                aria-pressed={isSelected}
                aria-label={`Vote for pathway ${pathway.label}`}
              >
                {isSelected ? "✓ Preference recorded" : "Vote for this pathway"}
              </button>
            </article>
          );
        })}
      </div>

      {voteSubmitted ? (
        <div className="pathway-vote-confirmation" role="status" aria-live="polite">
          <span>✓ You selected: <strong>{voteSubmitted}</strong>. Thank you for contributing your signal!</span>
        </div>
      ) : null}
    </section>
  );
}
