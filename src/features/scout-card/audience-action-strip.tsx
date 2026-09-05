"use client";

import React, { useEffect, useState } from "react";
import type { ScoutCard } from "./types";
import { hasFirebaseClientConfig } from "../../lib/firebase/config";
import { getClientAuth } from "../../lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { socialCommand } from "../social/client";

export type AudienceActionStripProps = {
  card: ScoutCard;
  onWatchClick?: () => void;
};

export function AudienceActionStrip({ card, onWatchClick }: AudienceActionStripProps) {
  const [uid, setUid] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [wouldWatch, setWouldWatch] = useState(false);
  const [wouldWatchCount, setWouldWatchCount] = useState(0);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [followFeedback, setFollowFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!hasFirebaseClientConfig()) return;
    let unsubscribe: () => void = () => undefined;
    try {
      unsubscribe = onAuthStateChanged(getClientAuth(), (user) => setUid(user?.uid ?? null));
    } catch {
      /* local/test mode */
    }
    return unsubscribe;
  }, []);

  const handleWatchClick = () => {
    if (onWatchClick) {
      onWatchClick();
      return;
    }
    const mediaEl = document.querySelector(".scout-start-here");
    if (mediaEl) {
      mediaEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFollowToggle = async () => {
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    if (nextState) {
      setFollowFeedback("Following! Updates will appear in your Living Dossier in-app.");
    } else {
      setFollowFeedback("Project unfollowed.");
    }
    setTimeout(() => setFollowFeedback(null), 4000);

    if (uid) {
      try {
        await socialCommand(
          `/api/projects/${card.projectId}/follow`,
          nextState ? "PUT" : "DELETE"
        );
      } catch (err) {
        // Revert on failure
        setIsFollowing(!nextState);
        setFollowerCount((prev) => Math.max(0, prev + (nextState ? -1 : 1)));
        setFollowFeedback("Could not update follow status.");
      }
    }
  };

  const handleWouldWatchToggle = async () => {
    const nextState = !wouldWatch;
    setWouldWatch(nextState);
    setWouldWatchCount((prev) => Math.max(0, prev + (nextState ? 1 : -1)));

    if (uid) {
      try {
        await socialCommand(
          `/api/projects/${card.projectId}/commitments/would_watch`,
          nextState ? "PUT" : "DELETE"
        );
      } catch (err) {
        setWouldWatch(!nextState);
        setWouldWatchCount((prev) => Math.max(0, prev + (nextState ? -1 : 1)));
      }
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback("Card link copied to clipboard!");
        setTimeout(() => setShareFeedback(null), 3000);
      }
    } catch {
      setShareFeedback("Could not copy link automatically.");
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  return (
    <section className="audience-action-strip" aria-label="Audience actions">
      <div className="audience-action-buttons">
        <button
          type="button"
          className="action-btn action-watch"
          onClick={handleWatchClick}
          aria-label={`Watch ${card.title} source`}
        >
          <span className="action-icon" aria-hidden="true">▶</span>
          <strong>Watch source</strong>
        </button>

        <button
          type="button"
          className={`action-btn action-follow ${isFollowing ? "is-active" : ""}`}
          onClick={handleFollowToggle}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? `Following ${card.title}` : `Follow ${card.title}`}
        >
          <span className="action-icon" aria-hidden="true">{isFollowing ? "✓" : "+"}</span>
          <strong>{isFollowing ? "Following" : "Follow project"}</strong>
          {followerCount > 0 ? (
            <span className="action-counter" aria-label={`${followerCount} followers`}>
              {followerCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className={`action-btn action-would-watch ${wouldWatch ? "is-active" : ""}`}
          onClick={handleWouldWatchToggle}
          aria-pressed={wouldWatch}
          aria-label="I'd watch this"
        >
          <span className="action-icon" aria-hidden="true">{wouldWatch ? "★" : "☆"}</span>
          <strong>I&apos;d watch this</strong>
          {wouldWatchCount > 0 ? (
            <span className="action-counter" aria-label={`${wouldWatchCount} audience signals`}>
              {wouldWatchCount}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          className="action-btn action-share"
          onClick={handleShare}
          aria-label="Share this Scout Card"
        >
          <span className="action-icon" aria-hidden="true">↗</span>
          <strong>Share card</strong>
        </button>
      </div>

      <div className="action-feedback-row" aria-live="polite">
        {followFeedback ? (
          <span className="action-feedback-msg feedback-follow">{followFeedback}</span>
        ) : null}
        {shareFeedback ? (
          <span className="action-feedback-msg feedback-share">{shareFeedback}</span>
        ) : null}
        {!followFeedback && !shareFeedback ? (
          <span className="action-semantics-note">
            {wouldWatchCount === 0 && followerCount === 0
              ? "No Audience Take interest signals yet — add yours above."
              : `Signals: ${followerCount} followers · ${wouldWatchCount} watch intents (non-binding).`}
          </span>
        ) : null}
      </div>
    </section>
  );
}
