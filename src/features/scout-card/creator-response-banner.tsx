"use client";

import React from "react";
import type { ScoutCard } from "./types";

function formatDate(value: string | undefined | null): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "";
  }
}

export function CreatorResponseBanner({ card }: { card: ScoutCard }) {
  const claimStatus = card.claimStatus || card.creatorContext?.claimStatus || "unclaimed";
  const statementText = card.creatorStatement?.statementText || card.creatorContext?.summary;
  const authorName = card.creatorStatement?.authorName;
  const verifiedDate = formatDate(card.creatorStatement?.verifiedAt);

  if (claimStatus === "approved") {
    return (
      <section
        className="creator-response-banner is-verified"
        role="region"
        aria-label="Creator verification and statement"
      >
        <div className="creator-banner-header">
          <div className="creator-banner-meta-row">
            <span className="creator-badge creator-badge-verified">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Creator Verified
            </span>
            {authorName && (
              <span className="creator-statement-author">{authorName}</span>
            )}
            {verifiedDate && (
              <time
                className="creator-verified-date"
                dateTime={card.creatorStatement?.verifiedAt}
              >
                {verifiedDate}
              </time>
            )}
          </div>
        </div>
        {statementText && (
          <p className="creator-statement-text">{statementText}</p>
        )}
      </section>
    );
  }

  if (claimStatus === "pending") {
    return (
      <section
        className="creator-response-banner is-pending"
        role="region"
        aria-label="Creator verification pending"
      >
        <div className="creator-banner-header">
          <div className="creator-banner-meta-row">
            <span className="creator-badge creator-badge-pending">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Creator verification pending
            </span>
          </div>
        </div>
        <p className="creator-banner-notice">
          A creator claim for this project is currently undergoing verification by our team. Independent community scouting analysis remains accessible below.
        </p>
      </section>
    );
  }

  // Default: unclaimed (or rejected)
  return (
    <section
      className="creator-response-banner is-unclaimed"
      role="region"
      aria-label="Creator claim status"
    >
      <div className="creator-banner-header">
        <div className="creator-banner-meta-row">
          <span className="creator-badge creator-badge-unclaimed">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Discovery Signal
          </span>
        </div>
      </div>
      <p className="creator-banner-notice">
        Unclaimed by creator — scouted from public discovery signals. Creative direction and pathway estimates represent independent community research.
      </p>
    </section>
  );
}
