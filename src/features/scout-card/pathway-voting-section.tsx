"use client";

import React, { useState } from "react";
import type { ScoutCard, ScoutPathway } from "./types";

export type PathwayVotingSectionProps = {
  card: ScoutCard;
  onVote?: (pathwayId: string) => Promise<void> | void;
};

export function PathwayVotingSection({ card, onVote }: PathwayVotingSectionProps) {
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (pathway: ScoutPathway) => {
    if (isSubmitting) return;
    setVoteError(null);
    setIsSubmitting(true);
    const prevSelected = selectedPathwayId;
    const prevSubmitted = voteSubmitted;

    // Optimistically record selection for instant user feedback
    setSelectedPathwayId(pathway.id);
    setVoteSubmitted(pathway.label);

    try {
      if (onVote) {
        await onVote(pathway.id);
      } else {
        const { socialCommand } = await import("../social/client");
        await socialCommand(`/api/projects/${card.projectId}/vote`, "PUT", {
          pathwayId: pathway.id,
          active: true,
        });
      }
    } catch (err: unknown) {
      setSelectedPathwayId(prevSelected);
      setVoteSubmitted(prevSubmitted);
      setVoteError(err instanceof Error ? err.message : "Unable to save vote. Sign in may be required.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreatorVerified = card.claimStatus === "approved";
  const creatorAmbition = isCreatorVerified
    ? (card.creatorStatement?.statementText || card.creatorContext?.summary || null)
    : null;

  return (
    <section
      className="pathway-voting-section"
      aria-labelledby="pathway-voting-title"
    >
      <div className="pathway-voting-heading">
        <span className="pathway-voting-kicker">COMMUNITY PREFERENCE</span>
        <h2 id="pathway-voting-title">What should happen next?</h2>
        <p className="pathway-voting-desc">
          Vote for the development or release direction you would most want to watch or support.
          Voting expresses community perspective; it does not direct the creator or guarantee production.
        </p>

        {creatorAmbition ? (
          <div className="creator-ambition-banner">
            <span className="creator-ambition-tag">CREATOR&apos;S VERIFIED STATEMENT</span>
            <p className="creator-ambition-text">{creatorAmbition}</p>
          </div>
        ) : (
          <div className="creator-ambition-banner is-undocumented">
            <span className="creator-ambition-tag">CREATOR&apos;S DIRECT AMBITION</span>
            <p className="creator-ambition-text">
              Not yet documented by creator. The options below represent independent community and scout hypotheses.
            </p>
          </div>
        )}
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

      {voteError ? (
        <div className="pathway-vote-error" role="alert">
          <span>{voteError}</span>
        </div>
      ) : null}
    </section>
  );
}
