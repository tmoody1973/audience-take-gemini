"use client";

import React, { useState } from "react";
import {
  Eye,
  DollarSign,
  MapPin,
  Sparkles,
  Vote,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../ui/Button";
import type { PulseMetrics, UserEngagementRecord, PathwayHypothesis } from "@/domain";
import { clsx } from "clsx";

interface AudiencePulsePanelProps {
  projectId: string;
  initialMetrics: PulseMetrics;
  initialUserEngagement: UserEngagementRecord | null;
  pathways: [PathwayHypothesis, PathwayHypothesis, PathwayHypothesis];
}

export function AudiencePulsePanel({
  projectId,
  initialMetrics,
  initialUserEngagement,
  pathways,
}: AudiencePulsePanelProps) {
  const [metrics, setMetrics] = useState<PulseMetrics>(initialMetrics);
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

  const [isCityPromptOpen, setIsCityPromptOpen] = useState(false);
  const [cityInput, setCityInput] = useState(engagement.city || "");

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

  const totalVotes = metrics.pathwayVotes.reduce((a, b) => a + b, 0);

  return (
    <section aria-label="Audience Pulse" className="border-3 border-ink bg-paper p-6 sm:p-8 shadow-ticket-lift space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-ink font-mono">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-4xl font-normal uppercase text-ink">
              AUDIENCE PULSE
            </h3>
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 bg-signal-coral text-white border-2 border-ink">
              NATIVE COMMITMENTS
            </span>
          </div>
          <p className="text-xs font-bold text-muted-ink mt-1 uppercase">
            Real fan commitments and pathway voting. Kept strictly separate from external hype metrics.
          </p>
        </div>
      </div>

      {/* Commitment Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* 1. Watch */}
        <button
          type="button"
          onClick={() => handleAction("toggle_watch")}
          className={clsx(
            "p-4 border-2 border-ink text-center transition-all flex flex-col items-center justify-center space-y-2",
            engagement.watch
              ? "bg-signal-coral text-white font-bold shadow-selected-lift translate-x-[1px] translate-y-[1px]"
              : "bg-field-paper text-ink hover:bg-paper shadow-action-lift"
          )}
        >
          <Eye className="w-6 h-6" />
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider">I WOULD WATCH</span>
          <span className="font-headline text-3xl">{metrics.watchCount}</span>
        </button>

        {/* 2. Pay */}
        <button
          type="button"
          onClick={() => handleAction("toggle_pay")}
          className={clsx(
            "p-4 border-2 border-ink text-center transition-all flex flex-col items-center justify-center space-y-2",
            engagement.pay
              ? "bg-electric-blue text-white font-bold shadow-selected-lift translate-x-[1px] translate-y-[1px]"
              : "bg-field-paper text-ink hover:bg-paper shadow-action-lift"
          )}
        >
          <DollarSign className="w-6 h-6" />
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider">I WOULD PAY</span>
          <span className="font-headline text-3xl">{metrics.payCount}</span>
        </button>

        {/* 3. City Demand */}
        <button
          type="button"
          onClick={() => setIsCityPromptOpen(!isCityPromptOpen)}
          className={clsx(
            "p-4 border-2 border-ink text-center transition-all flex flex-col items-center justify-center space-y-2",
            engagement.city
              ? "bg-acid-yellow text-ink font-bold shadow-selected-lift translate-x-[1px] translate-y-[1px]"
              : "bg-field-paper text-ink hover:bg-paper shadow-action-lift"
          )}
        >
          <MapPin className="w-6 h-6" />
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider">BRING TO CITY</span>
          <span className="font-headline text-3xl">{metrics.cityDemandCount}</span>
        </button>

        {/* 4. Back Next Chapter */}
        <button
          type="button"
          onClick={() => handleAction("toggle_back")}
          className={clsx(
            "p-4 border-2 border-ink text-center transition-all flex flex-col items-center justify-center space-y-2",
            engagement.back
              ? "bg-evidence-mint text-ink font-bold shadow-selected-lift translate-x-[1px] translate-y-[1px]"
              : "bg-field-paper text-ink hover:bg-paper shadow-action-lift"
          )}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider">BACK CHAPTER</span>
          <span className="font-headline text-3xl">{metrics.backCount}</span>
        </button>

      </div>

      {/* City Demand Input Prompt */}
      {isCityPromptOpen && (
        <div className="p-4 bg-field-paper border-2 border-ink space-y-3 font-mono text-xs shadow-selected-lift">
          <div className="flex items-center justify-between">
            <span className="text-ink font-extrabold flex items-center gap-1.5 uppercase">
              <MapPin className="w-4 h-4 text-signal-coral" />
              Register Screening Demand in Your City
            </span>
            <span className="text-[10px] text-muted-ink uppercase">Requires city name</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Seattle, WA or London, UK"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="flex-1 bg-paper border-2 border-ink px-3 py-2 text-ink font-bold focus:outline-none"
            />
            <Button
              variant="coral"
              size="sm"
              onClick={() => {
                if (cityInput.trim()) {
                  handleAction("set_city", cityInput.trim());
                  setIsCityPromptOpen(false);
                }
              }}
            >
              CONFIRM CITY
            </Button>
          </div>
          {engagement.city && (
            <p className="text-ink font-bold text-[11px] pt-1">
              CURRENTLY COMMITTED TO: <strong className="text-signal-coral">{engagement.city}</strong>
            </p>
          )}
        </div>
      )}

      {/* Top Requested Cities Badge List */}
      {Object.keys(metrics.cities || {}).length > 0 && (
        <div className="space-y-1.5 pt-2 font-mono">
          <span className="text-[10px] uppercase tracking-wider text-muted-ink font-extrabold">
            Top City Screening Demand
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metrics.cities).map(([city, count]) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-field-paper border-2 border-ink text-xs font-bold text-ink"
              >
                <MapPin className="w-3.5 h-3.5 text-signal-coral" />
                {city}: <strong className="text-signal-coral">{count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pathway Voting Section */}
      <div className="pt-6 border-t-2 border-ink space-y-4">
        <div className="flex items-center justify-between font-mono">
          <h4 className="font-headline text-3xl font-normal uppercase text-ink flex items-center gap-2">
            <Vote className="w-6 h-6 text-signal-coral" />
            VOTE ON GROWTH PATHWAY CONSENSUS
          </h4>
          <span className="text-xs font-extrabold text-muted-ink">
            {totalVotes} TOTAL VOTES CAST
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pathways.map((pathway, idx) => {
            const isVoted = engagement.votedPathwayIndex === idx;
            const voteCount = metrics.pathwayVotes[idx] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            return (
              <div
                key={idx}
                className={clsx(
                  "p-5 border-2 border-ink flex flex-col justify-between space-y-3 transition-all",
                  isVoted
                    ? "bg-acid-yellow shadow-selected-lift"
                    : "bg-field-paper hover:bg-paper"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-headline uppercase text-signal-coral font-bold">
                      PATHWAY 0{idx + 1}
                    </span>
                    {isVoted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold text-ink bg-evidence-mint px-1.5 py-0.5 border border-ink">
                        <CheckCircle2 className="w-3 h-3 text-electric-blue" /> YOUR VOTE
                      </span>
                    )}
                  </div>
                  <h5 className="font-headline text-2xl font-normal uppercase text-ink leading-tight">
                    {pathway.title}
                  </h5>
                  <p className="text-xs text-muted-ink font-sans leading-relaxed line-clamp-3">
                    {pathway.mediumFitRationale}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t-2 border-ink font-mono">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>{percentage}% CONSENSUS</span>
                    <span>{voteCount} VOTES</span>
                  </div>
                  <div className="w-full h-2.5 bg-paper border-2 border-ink overflow-hidden flex">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={clsx("h-full", idx === 0 ? "bg-signal-coral" : idx === 1 ? "bg-electric-blue" : "bg-ink")}
                    />
                  </div>

                  <Button
                    variant={isVoted ? "secondary" : "coral"}
                    size="sm"
                    className="w-full text-lg mt-1"
                    onClick={() => handleAction("vote_pathway", undefined, idx)}
                  >
                    {isVoted ? "WITHDRAW VOTE" : `VOTE PATHWAY ${idx + 1}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}
