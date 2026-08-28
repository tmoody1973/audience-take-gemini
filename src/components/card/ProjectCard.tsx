import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Eye, DollarSign, MapPin } from "lucide-react";
import type { Project } from "@/domain";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { identity, metrics, creatorClaim } = project;
  const isClaimed = creatorClaim.status === "verified";

  // Safe metrics fallback
  const watchCount = metrics?.watchCount ?? 0;
  const payCount = metrics?.payCount ?? 0;
  const cityCount = metrics?.cityDemandCount ?? 0;

  return (
    <article className="bg-[#fffdf7] border-3 border-ink flex flex-col justify-between p-5 sm:p-6 shadow-card-lift">
      {/* 1. TOP BAR: Format Badge (Yellow) + Stage (Mint/Light) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-2.5">
          <span className="px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink font-mono text-[11px] font-black uppercase tracking-wider">
            {identity.medium.replace("_", " ")}
          </span>
          <div className="flex items-center gap-1.5">
            {isClaimed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-ink bg-evidence-mint px-1.5 py-0.5 border border-ink">
                <ShieldCheck className="w-3 h-3 text-electric-blue" />
                VERIFIED
              </span>
            )}
            <span className="px-2 py-0.5 bg-[#e4dfd2] text-ink border border-ink font-mono text-[10px] font-bold uppercase">
              {identity.currentStage.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* 2. TITLE & METADATA */}
        <div>
          <Link href={`/scout/${project.id}`} className="block focus:outline-none group">
            <h3 className="font-display text-4xl sm:text-5xl font-normal uppercase tracking-tight text-ink group-hover:text-signal-coral transition-colors leading-[0.82]">
              {identity.title}
            </h3>
          </Link>
          <p className="text-[11px] font-mono font-bold text-muted-ink mt-2 uppercase">
            CREATOR: {identity.creators?.join(", ") || "INDEPENDENT"}
          </p>
        </div>

        {/* 3. LOGLINE / SUMMARY */}
        <p className="text-xs text-ink font-sans leading-relaxed line-clamp-3 pt-1 font-medium">
          {identity.logline || project.nomination.reason}
        </p>
      </div>

      {/* 4. METRICS & CTA BUTTON */}
      <div className="pt-4 mt-4 border-t-2 border-ink space-y-3">
        {/* 3-Cell Metrics Grid */}
        <div className="grid grid-cols-3 border-2 border-ink bg-paper font-mono text-center">
          <div className="p-1.5 border-r-2 border-ink flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-signal-coral flex items-center gap-0.5">
              <Eye className="w-2.5 h-2.5" /> WATCH
            </span>
            <span className="font-display text-lg leading-tight text-ink font-normal">{watchCount}</span>
          </div>

          <div className="p-1.5 border-r-2 border-ink flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-electric-blue flex items-center gap-0.5">
              <DollarSign className="w-2.5 h-2.5" /> PAY
            </span>
            <span className="font-display text-lg leading-tight text-ink font-normal">{payCount}</span>
          </div>

          <div className="p-1.5 flex flex-col items-center">
            <span className="text-[9px] font-black uppercase text-ink flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" /> CITY
            </span>
            <span className="font-display text-lg leading-tight text-ink font-normal">{cityCount}</span>
          </div>
        </div>

        {/* Tri-color Accent Bar */}
        <div className="w-full h-1.5 border border-ink flex overflow-hidden">
          <div className="w-1/3 bg-signal-coral" />
          <div className="w-1/3 bg-electric-blue" />
          <div className="w-1/3 bg-acid-yellow" />
        </div>

        {/* Black Inspect Button */}
        <Link
          href={`/scout/${project.id}`}
          className="w-full min-h-[44px] bg-ink hover:bg-signal-coral text-white font-mono text-xs font-black uppercase flex items-center justify-between px-4 transition-colors border-2 border-ink shadow-action-lift"
        >
          <span>INSPECT SCOUT CARD</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  );
}
