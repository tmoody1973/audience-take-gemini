"use client";

import React, { useEffect, useRef } from "react";
import type { EvidenceClaim, SourceLedgerEntry } from "./types";
import {
  claimEvidenceState,
  evidenceStateLabel,
  sourcePresentation,
} from "./evidence-display";

function formatDate(value: string | undefined | null): string {
  if (!value) return "Not recorded";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Not recorded";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(d);
  } catch {
    return "Not recorded";
  }
}

export type CitationDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  source: SourceLedgerEntry | null;
  claim?: EvidenceClaim | null;
  sourceLabels: Map<string, string>;
  returnFocusEl?: HTMLElement | null;
};

export function CitationDrawer({
  isOpen,
  onClose,
  source,
  claim,
  sourceLabels,
  returnFocusEl,
}: CitationDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      returnFocusEl?.focus();
    };
  }, [isOpen, onClose, returnFocusEl]);

  if (!isOpen || !source) return null;

  const label = sourceLabels.get(source.id) || "[S]";
  const presentation = sourcePresentation(source);
  const claimState = claim ? claimEvidenceState(claim, [source]) : null;

  return (
    <div
      className="citation-drawer-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <aside
        ref={drawerRef}
        className="citation-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citation-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="citation-drawer-header">
          <div className="citation-drawer-title-wrap">
            <span className="citation-drawer-badge">{label}</span>
            <h3 id="citation-drawer-title">Citation &amp; Source Evidence</h3>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="citation-drawer-close-btn"
            onClick={onClose}
            aria-label="Close citation details"
          >
            ✕
          </button>
        </header>

        <div className="citation-drawer-body">
          {/* Claim Section */}
          {claim ? (
            <section className="citation-claim-block" aria-labelledby="cited-claim-heading">
              <div className="citation-block-subheading">
                <span id="cited-claim-heading" className="citation-kicker">CITED STATEMENT</span>
                {claimState ? (
                  <span className={`evidence-state evidence-state-${claimState}`}>
                    {evidenceStateLabel(claimState)}
                  </span>
                ) : null}
              </div>
              <p className="citation-claim-text">{claim.statement}</p>
              {claim.qualification ? (
                <p className="citation-qualification-note">
                  <strong>Qualification:</strong> {claim.qualification}
                </p>
              ) : null}
              {claim.status === "conflicting" ? (
                <div className="citation-conflict-alert" role="alert">
                  <strong>Conflict detected:</strong> Public sources report contradictory information for this claim.
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Passage Excerpt */}
          <section className="citation-excerpt-block" aria-labelledby="passage-excerpt-heading">
            <span id="passage-excerpt-heading" className="citation-kicker">RELEVANT SOURCE PASSAGE</span>
            {source.excerpt ? (
              <blockquote className="citation-passage-quote">
                “{source.excerpt}”
              </blockquote>
            ) : (
              <p className="citation-passage-empty">
                No direct excerpt was preserved for this record. Inspect the original source below.
              </p>
            )}
          </section>

          {/* Source Metadata */}
          <section className="citation-source-metadata" aria-labelledby="source-metadata-heading">
            <span id="source-metadata-heading" className="citation-kicker">SOURCE RECORD</span>
            <h4 className="citation-source-title">{source.title}</h4>
            <dl className="citation-metadata-grid">
              <div>
                <dt>ROLE</dt>
                <dd>{presentation.role}</dd>
              </div>
              <div>
                <dt>TIER</dt>
                <dd>{presentation.tier}</dd>
              </div>
              <div>
                <dt>STATUS</dt>
                <dd>{source.verificationStatus.toUpperCase()}</dd>
              </div>
              <div>
                <dt>AVAILABILITY</dt>
                <dd>{source.availability.toUpperCase()}</dd>
              </div>
              <div>
                <dt>PUBLISHED</dt>
                <dd>{formatDate(source.publishedAt)}</dd>
              </div>
              <div>
                <dt>RETRIEVED</dt>
                <dd>{formatDate(source.retrievedAt)}</dd>
              </div>
            </dl>

            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="citation-source-external-link"
            >
              Open external source ↗
            </a>
          </section>
        </div>
      </aside>
    </div>
  );
}
