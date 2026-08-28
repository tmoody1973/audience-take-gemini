"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
} from "lucide-react";
import type { ResearchRunState } from "@/domain";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ResearchProgressPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [run, setRun] = useState<ResearchRunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchRunStatus = async () => {
      try {
        const res = await fetch(`/api/agent/run?runId=${runId}`);
        const data = await res.json();
        if (res.ok && data.run) {
          setRun(data.run);

          if (data.run.currentStep === "fetching" && !isRunning && data.run.progressPercent <= 10) {
            setIsRunning(true);
            fetch("/api/agent/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ runId }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.run) setRun(d.run);
                setIsRunning(false);
              })
              .catch((e) => {
                setError(e.message);
                setIsRunning(false);
              });
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      }
    };

    fetchRunStatus();
    intervalId = setInterval(fetchRunStatus, 2000);

    return () => clearInterval(intervalId);
  }, [runId, isRunning]);

  const stepOrder = [
    { key: "fetching", label: "READING SOURCE", desc: "Discovering and reviewing trusted sources." },
    { key: "validating", label: "MAPPING STORY", desc: "Extracting key narratives and building a map." },
    { key: "searching", label: "PARALLEL SEARCH", desc: "Searching public web with Parallel." },
    { key: "synthesizing", label: "CHECKING EVIDENCE", desc: "Verifying facts and cross-checking claims." },
    { key: "pathways", label: "THREE PATHWAYS", desc: "Sorting findings into confirms, contradicts, or unclear." },
    { key: "complete", label: "PUBLISHING CARD", desc: "Packaging findings into a public Scout Card." },
  ];

  const currentIdx = run
    ? stepOrder.findIndex((s) => s.key === run.currentStep)
    : 0;

  return (
    <div className="research-page max-w-7xl mx-auto my-4 border-3 border-ink shadow-ticket-lift">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP LIVE BANNER (Acid Yellow) */}
      {/* ---------------------------------------------------- */}
      <div className="research-banner">
        <div>
          <h1>LIVE SCOUTING RUN</h1>
        </div>
        <div className="research-banner-status">
          <span>A RESEARCH RUN IN PROGRESS.</span>
          <strong>PUBLIC. TRACEABLE. USEFUL.</strong>
          <span className="text-[10px]">⌖ ACC-ID: {runId}</span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. WORKBENCH: 6-Frame Contact Strip + Public Receipts */}
      {/* ---------------------------------------------------- */}
      <div className="research-workbench">
        
        {/* Left: 35mm Contact Strip */}
        <div className="filmstrip-region">
          <div className="film-perforations">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>

          <ul className="research-filmstrip">
            {stepOrder.map((step, idx) => {
              const isPassed = currentIdx > idx || run?.currentStep === "complete";
              const isActive = currentIdx === idx && run?.currentStep !== "complete";
              const state = isPassed ? "complete" : isActive ? "active" : "incomplete";

              return (
                <li
                  key={step.key}
                  className="research-frame"
                  data-state={state}
                >
                  <div className="frame-heading">
                    <span>0{idx + 1}</span>
                    <h3>{step.label}</h3>
                  </div>

                  <div className={`stage-art stage-art-${idx + 1}`}>
                    <span />
                    <span />
                    <span />
                    <b>0{idx + 1}A</b>
                  </div>

                  <p>{step.desc}</p>

                  <div className="stage-stamp">
                    {isPassed ? "COMPLETE" : isActive ? "IN PROGRESS" : "PENDING"}
                  </div>

                  {isActive && (
                    <div className="parallel-chase">
                      <i /><i /><i /><i /><i /><i />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="film-perforations">
            <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
          </div>
        </div>

        {/* Right: Public Receipts Ledger */}
        <div className="receipt-ledger">
          <ul className="receipt-category-spine">
            <li>SAFE SOURCES</li>
            <li>QUERY RECEIPTS</li>
            <li>EVIDENCE LOG</li>
          </ul>

          <div className="receipt-ledger-content">
            <div className="ledger-heading">
              <h2>PUBLIC RECEIPTS</h2>
              <ArrowRight className="w-6 h-6 text-signal-coral" />
            </div>

            <div className="space-y-4 pt-3 font-mono text-xs">
              {/* Safe Sources Summary */}
              <div className="border-b border-ink/40 pb-3">
                <span className="text-[10px] font-extrabold text-muted-ink uppercase block mb-1">
                  SOURCE DOMAIN VERIFICATION
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <strong>YOUTUBE / PRIMARY VIDEO</strong>
                    <span className="text-electric-blue font-bold">SUBMITTED</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>PARALLEL SEARCH ENGINE</strong>
                    <span className="text-acid-yellow bg-ink px-1 font-bold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between">
                    <strong>PUBLIC WEB ARCHIVES</strong>
                    <span className="text-evidence-mint font-bold">GROUNDED</span>
                  </div>
                </div>
              </div>

              {/* Query Receipts */}
              <div className="border-b border-ink/40 pb-3">
                <span className="text-[10px] font-extrabold text-muted-ink uppercase block mb-1">
                  ACTIVE AGENT QUERIES
                </span>
                <ul className="space-y-1 text-[10px]">
                  <li>▸ History and creator background</li>
                  <li>▸ Festival distribution track record</li>
                  <li>▸ Comparable title commercial benchmarks</li>
                </ul>
              </div>

              {/* Evidence Log */}
              <div className="space-y-1 text-[10px]">
                <span className="font-extrabold text-muted-ink uppercase block">
                  EVIDENCE LEDGER
                </span>
                <p className="text-ink">
                  ✓ Collected from verified public sources.
                </p>
                <p className="text-ink">
                  ✓ Cross-checked across independent references.
                </p>
                <p className="text-ink">
                  ✓ Prepared for immutable Scout Card publication.
                </p>
              </div>

              <div className="pt-2 border-t border-ink/30 text-[10px] text-muted-ink flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>All receipts are public and viewable by anyone. No private data.</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. BOTTOM DESTINATION TEAR-OFF BAR */}
      {/* ---------------------------------------------------- */}
      <div className="card-destination">
        <div className="destination-code">AT-RUN</div>
        <div>
          <h2>COMPLETION DESTINATION</h2>
          <p>
            {run?.currentStep === "complete"
              ? "Investigation complete! Your verified Scout Card is now published and active."
              : "Your Scout Card is currently being assembled with primary citations and commercial pathway hypotheses."}
          </p>
        </div>

        {run?.currentStep === "complete" && run.projectId ? (
          <Link href={`/scout/${run.projectId}`} className="card-tearoff-action">
            <span>OPEN SCOUT CARD</span>
            <ArrowRight />
          </Link>
        ) : (
          <div className="card-tearoff-waiting">
            <span>SCOUTING IN PROGRESS...</span>
          </div>
        )}
      </div>

    </div>
  );
}
