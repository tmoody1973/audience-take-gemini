"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b-3 border-ink">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs font-extrabold uppercase">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-acid-yellow text-ink border-2 border-ink tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-signal-coral" />
            AUTONOMOUS SCOUT RESEARCH PIPELINE
          </div>
          <Badge variant="coral">GEMINI 3.5 FLASH</Badge>
          <Badge variant="blue">PARALLEL SEARCH</Badge>
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-normal uppercase text-ink leading-[0.78]">
          INVESTIGATING PROJECT DOSSIER
        </h1>
        <p className="text-xs font-mono font-bold text-muted-ink uppercase">
          RUN ID: <span className="text-ink">{runId}</span>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-error-red text-white border-3 border-ink text-xs font-mono font-bold">
          <strong>AGENT ERROR:</strong> {error}
        </div>
      )}

      {/* Progress Bar & Current Status */}
      <div className="bg-paper p-6 sm:p-8 border-3 border-ink shadow-ticket-lift space-y-5">
        <div className="flex items-center justify-between font-mono text-xs font-extrabold">
          <div className="flex items-center gap-2 uppercase">
            {run?.currentStep === "complete" ? (
              <CheckCircle2 className="w-5 h-5 text-signal-coral" />
            ) : run?.currentStep === "failed" ? (
              <AlertTriangle className="w-5 h-5 text-error-red" />
            ) : (
              <Loader2 className="w-5 h-5 text-electric-blue animate-spin" />
            )}
            <span className="text-sm text-ink">
              STAGE: <strong className="text-signal-coral">{run?.currentStep || "INITIALIZING"}</strong>
            </span>
          </div>
          <span className="text-ink font-mono text-base font-extrabold">
            {run?.progressPercent || 0}%
          </span>
        </div>

        {/* Stepped Progress Bar */}
        <div className="w-full h-4 bg-paper border-2 border-ink overflow-hidden flex">
          <div
            style={{ width: `${run?.progressPercent || 5}%` }}
            className="h-full bg-signal-coral transition-all duration-500 ease-out border-r-2 border-ink"
          />
        </div>

        {/* 6-Stage Checkpoints */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2 text-[10px] font-mono font-extrabold uppercase">
          {[
            { id: "fetching", label: "01 Source" },
            { id: "classifying", label: "02 Context" },
            { id: "extracting_evidence", label: "03 Evidence" },
            { id: "pathways", label: "04 Pathways" },
            { id: "validating", label: "05 Validation" },
            { id: "complete", label: "06 Published" },
          ].map((stage, idx) => {
            const isCurrent = run?.currentStep === stage.id;
            const isDone = run?.progressPercent && run.progressPercent >= (idx + 1) * 16.6;

            return (
              <div
                key={stage.id}
                className={`p-2 border-2 border-ink text-center transition-all ${
                  isCurrent
                    ? "bg-acid-yellow font-black shadow-selected-lift"
                    : isDone
                    ? "bg-evidence-mint text-ink"
                    : "bg-field-paper text-muted-ink"
                }`}
              >
                {stage.label}
              </div>
            );
          })}
        </div>

        {/* Completion CTA */}
        {run?.currentStep === "complete" && (
          <div className="pt-4 border-t-2 border-ink flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink">
              <ShieldCheck className="w-5 h-5 text-signal-coral" />
              <span>Dossier verified & immutable Scout Card generated.</span>
            </div>
            <Link href={`/scout/${run.projectId}`} className="w-full sm:w-auto">
              <Button variant="coral" size="md" className="w-full">
                OPEN SCOUT CARD
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Failure Explanation */}
        {run?.currentStep === "failed" && (
          <div className="p-4 bg-error-red/10 border-2 border-error-red text-error-red font-mono text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase">
              <AlertTriangle className="w-5 h-5" />
              <span>RESEARCH RUN HALTED HONESTLY</span>
            </div>
            <p className="text-ink font-sans">{run.errorMessage || "Validation failed safe publication rules."}</p>
            <div className="pt-2">
              <Link href="/nominate">
                <Button variant="outline" size="sm">
                  TRY ANOTHER NOMINATION
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Step Logs */}
      <div className="bg-paper border-3 border-ink shadow-ticket-lift space-y-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b-2 border-ink bg-field-paper font-mono">
          <span className="flex items-center gap-2 text-xs font-extrabold text-ink uppercase">
            <Terminal className="w-4 h-4 text-signal-coral" />
            INSPECTABLE AGENT EXECUTION TRACE
          </span>
          <span className="text-[10px] font-bold text-muted-ink">
            {run?.stepLogs?.length || 0} EVENTS RECORDED
          </span>
        </div>

        <div className="p-6 font-mono text-xs space-y-3 max-h-96 overflow-y-auto bg-field-paper">
          {run?.stepLogs?.map((log, index) => (
            <div key={index} className="flex items-start gap-3 border-b border-ink/10 pb-2">
              <span className="text-muted-ink text-[10px] flex-shrink-0 mt-0.5 font-bold">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-start gap-2 flex-1">
                {log.status === "done" && <CheckCircle2 className="w-4 h-4 text-signal-coral flex-shrink-0 mt-0.5" />}
                {log.status === "in_progress" && <Loader2 className="w-4 h-4 text-electric-blue animate-spin flex-shrink-0 mt-0.5" />}
                {log.status === "warning" && <AlertTriangle className="w-4 h-4 text-acid-yellow flex-shrink-0 mt-0.5" />}
                {log.status === "error" && <AlertTriangle className="w-4 h-4 text-error-red flex-shrink-0 mt-0.5" />}
                <p className="leading-relaxed text-ink">
                  <strong className="uppercase text-[10px] text-signal-coral mr-2">[{log.step}]</strong>
                  {log.message}
                </p>
              </div>
            </div>
          ))}

          {(!run?.stepLogs || run.stepLogs.length === 0) && (
            <p className="text-muted-ink italic">Connecting to agent worker...</p>
          )}
        </div>
      </div>

    </div>
  );
}
