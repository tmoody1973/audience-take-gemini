"use client";

import React, { useState } from "react";
import type { PulseMetrics, UserEngagementRecord, PathwayHypothesis } from "@/domain";
import { clsx } from "clsx";

interface AudiencePulsePanelProps {
  projectId: string;
  projectTitle?: string;
  initialMetrics: PulseMetrics;
  initialUserEngagement: UserEngagementRecord | null;
  pathways: PathwayHypothesis[];
}

export function AudiencePulsePanel({
  projectId,
  initialMetrics,
  initialUserEngagement,
  pathways,
}: AudiencePulsePanelProps) {
  const [metrics, setMetrics] = useState<PulseMetrics>(initialMetrics);
  const [isFollowing, setIsFollowing] = useState(false);
  const [engagement, setEngagement] = useState<UserEngagementRecord>(
    initialUserEngagement || {
      uid: "guest-fan",
      projectId,
      watch: false,
      pay: false,
      city: null,
      back: false,
      votedPathwayIndex: null,
      updatedAt: new Date().toISOString(),
    }
  );

  const handleAction = async (
    action: "toggle_watch" | "toggle_pay" | "set_city" | "toggle_back" | "vote_pathway",
    city?: string,
    pathwayIndex?: number
  ) => {
    try {
      const res = await fetch("/api/pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action, city, pathwayIndex }),
      });
      const data = await res.json();
      if (res.ok && data.metrics && data.userRecord) {
        setMetrics(data.metrics);
        setEngagement(data.userRecord);
      }
    } catch (err) {
      console.error("Pulse update failed", err);
    }
  };

  return (
    <section className="scout-social-panel" aria-labelledby="pulse-heading">
      
      {/* Masthead Header */}
      <div>
        <span className="route-label">AUDIENCE TAKE NATIVE</span>
        <h2 id="pulse-heading">AUDIENCE PULSE</h2>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2">
          <p className="social-intro text-xs font-sans max-w-2xl">
            A public place to show what you would do next. Counts below are Audience Take-native and update live when available.
          </p>
          <small className="font-mono text-[10px] text-muted-ink uppercase font-bold tracking-wider">
            PARTICIPATION, NOT PREDICTION
          </small>
        </div>
      </div>

      {/* Red Follow Banner */}
      <div className="social-primary flex flex-col sm:flex-row items-start sm:items-center gap-4 my-6">
        <button
          type="button"
          onClick={() => setIsFollowing(!isFollowing)}
          className={clsx(
            "button-primary text-2xl font-display uppercase tracking-wider px-8 py-3 border-3 border-ink text-white cursor-pointer transition-colors",
            isFollowing ? "bg-ink" : "bg-signal-coral hover:bg-electric-blue"
          )}
        >
          {isFollowing ? "FOLLOWING PROJECT ✓" : "FOLLOW THIS PROJECT !"}
        </button>
        <small className="font-mono text-xs text-muted-ink">
          Follow is a lightweight signal that you want updates. Commitment signals are shown separately.
        </small>
      </div>

      {/* 2-Field Ticket Box */}
      <div className="social-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Field: Commitments */}
        <fieldset className="commitment-list p-5 border-2 border-ink bg-paper space-y-3">
          <legend className="font-display text-3xl uppercase px-2 text-ink">
            COMMITMENTS
          </legend>

          {/* 1. I would watch */}
          <div className="social-control border-b border-ink pb-3">
            <button
              type="button"
              onClick={() => handleAction("toggle_watch")}
              aria-pressed={engagement.watch}
              className={clsx(
                "w-full flex items-center justify-between p-3 border-2 border-ink text-left transition-all",
                engagement.watch ? "bg-acid-yellow font-black" : "bg-field-paper hover:bg-paper"
              )}
            >
              <div>
                <strong className="block font-mono text-xs uppercase text-ink">I would watch</strong>
                <small className="text-[10px] text-muted-ink font-sans">Signal intent to watch.</small>
              </div>
              <span className="font-display text-2xl text-ink font-bold">{metrics.watchCount}</span>
            </button>
          </div>

          {/* 2. I would pay */}
          <div className="social-control border-b border-ink pb-3">
            <button
              type="button"
              onClick={() => handleAction("toggle_pay")}
              aria-pressed={engagement.pay}
              className={clsx(
                "w-full flex items-center justify-between p-3 border-2 border-ink text-left transition-all",
                engagement.pay ? "bg-acid-yellow font-black" : "bg-field-paper hover:bg-paper"
              )}
            >
              <div>
                <strong className="block font-mono text-xs uppercase text-ink">I would pay</strong>
                <small className="text-[10px] text-muted-ink font-sans">Signal willingness to pay.</small>
              </div>
              <span className="font-display text-2xl text-ink font-bold">{metrics.payCount}</span>
            </button>
          </div>

          {/* 3. Bring it to my city */}
          <div className="social-control border-b border-ink pb-3">
            <button
              type="button"
              onClick={() => {
                const userCity = prompt("Enter your city name for screening demand:", engagement.city || "Milwaukee, WI");
                if (userCity) handleAction("set_city", userCity);
              }}
              aria-pressed={Boolean(engagement.city)}
              className={clsx(
                "w-full flex items-center justify-between p-3 border-2 border-ink text-left transition-all",
                engagement.city ? "bg-acid-yellow font-black" : "bg-field-paper hover:bg-paper"
              )}
            >
              <div>
                <strong className="block font-mono text-xs uppercase text-ink">
                  Bring it to my city {engagement.city && `(${engagement.city})`}
                </strong>
                <small className="text-[10px] text-muted-ink font-sans">Tell the team where to bring it.</small>
              </div>
              <span className="font-display text-2xl text-ink font-bold">{metrics.cityDemandCount}</span>
            </button>
          </div>

          {/* 4. Back next chapter */}
          <div className="social-control">
            <button
              type="button"
              onClick={() => handleAction("toggle_back")}
              aria-pressed={engagement.back}
              className={clsx(
                "w-full flex items-center justify-between p-3 border-2 border-ink text-left transition-all",
                engagement.back ? "bg-acid-yellow font-black" : "bg-field-paper hover:bg-paper"
              )}
            >
              <div>
                <strong className="block font-mono text-xs uppercase text-ink">Back next chapter</strong>
                <small className="text-[10px] text-muted-ink font-sans">Pledge interest in future crowdfunding or release.</small>
              </div>
              <span className="font-display text-2xl text-ink font-bold">{metrics.backCount}</span>
            </button>
          </div>
        </fieldset>

        {/* Right Field: Which Pathway Should Grow? */}
        <fieldset className="pathway-votes p-5 border-2 border-ink bg-paper flex flex-col justify-between">
          <div>
            <legend className="font-display text-3xl uppercase px-2 text-ink">
              WHICH PATHWAY SHOULD GROW?
            </legend>

            <div className="space-y-2 mt-2">
              {pathways.map((pathway, idx) => {
                const isSelected = engagement.votedPathwayIndex === idx;
                const voteCount = metrics.pathwayVotes[idx] || 0;

                return (
                  <label
                    key={idx}
                    onClick={() => handleAction("vote_pathway", undefined, idx)}
                    className={clsx(
                      "flex items-center justify-between p-3 border-2 border-ink cursor-pointer transition-colors",
                      isSelected ? "bg-acid-yellow font-bold" : "bg-field-paper hover:bg-paper"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold text-ink">
                        {isSelected ? "●" : "○"}
                      </span>
                      <span className="font-mono text-xs uppercase text-ink font-bold">
                        {pathway.title}
                      </span>
                    </div>
                    <small className="font-mono text-[10px] text-muted-ink uppercase font-bold">
                      {voteCount} organic {voteCount === 1 ? "vote" : "votes"}
                    </small>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleAction("vote_pathway", undefined, -1)}
            className="text-link text-xs font-mono font-bold text-muted-ink hover:text-signal-coral underline mt-4 self-start cursor-pointer"
          >
            CLEAR MY VOTE
          </button>
        </fieldset>

      </div>

    </section>
  );
}

