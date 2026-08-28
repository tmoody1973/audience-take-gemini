import React from "react";
import Link from "next/link";
import { Eye, MapPin, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "../ui/Badge";
import type { Project } from "@/domain";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { identity, metrics, creatorClaim } = project;
  const isClaimed = creatorClaim.status === "verified";
  const totalPathwayVotes = metrics.pathwayVotes.reduce((a, b) => a + b, 0);

  return (
    <article className="group bg-paper border-3 border-ink hover:bg-field-paper transition-all duration-100 flex flex-col justify-between p-6 rounded-none shadow-card-lift">
      {/* Top Header: Medium & Stage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 border-b-2 border-ink pb-3">
          <Badge medium={identity.medium}>{identity.medium.replace("_", " ")}</Badge>
          <div className="flex items-center gap-2">
            {isClaimed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-extrabold text-ink bg-evidence-mint px-1.5 py-0.5 border border-ink">
                <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
                VERIFIED
              </span>
            )}
            <Badge stage={identity.currentStage}>{identity.currentStage.replace("_", " ")}</Badge>
          </div>
        </div>

        {/* Title & Creators */}
        <div>
          <Link href={`/scout/${project.id}`} className="focus:outline-none block">
            <h3 className="font-headline text-4xl sm:text-5xl font-normal uppercase tracking-tight text-ink group-hover:text-signal-coral transition-colors leading-[0.85] line-clamp-2">
              {identity.title}
            </h3>
          </Link>
          {identity.creators && identity.creators.length > 0 && (
            <p className="text-xs font-mono font-bold text-muted-ink mt-2 uppercase">
              CREATORS: {identity.creators.join(", ")}
            </p>
          )}
        </div>

        {/* Logline */}
        {identity.logline && (
          <p className="text-sm text-ink font-sans leading-relaxed line-clamp-3 pt-1">
            {identity.logline}
          </p>
        )}
      </div>

      {/* Bottom Section: Audience Signals & Action */}
      <div className="pt-5 mt-5 border-t-2 border-ink space-y-4">
        
        {/* Audience Pulse Snapshot */}
        <div className="grid grid-cols-3 gap-0 bg-field-paper border-2 border-ink text-center font-mono text-xs">
          <div className="p-2 flex flex-col items-center border-r-2 border-ink">
            <span className="text-muted-ink text-[10px] font-extrabold uppercase flex items-center gap-1">
              <Eye className="w-3 h-3 text-signal-coral" /> WATCH
            </span>
            <span className="text-ink font-extrabold text-sm mt-0.5">{metrics.watchCount}</span>
          </div>

          <div className="p-2 flex flex-col items-center border-r-2 border-ink">
            <span className="text-muted-ink text-[10px] font-extrabold uppercase flex items-center gap-1">
              <MapPin className="w-3 h-3 text-electric-blue" /> CITIES
            </span>
            <span className="text-ink font-extrabold text-sm mt-0.5">{metrics.cityDemandCount}</span>
          </div>

          <div className="p-2 flex flex-col items-center">
            <span className="text-muted-ink text-[10px] font-extrabold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-acid-yellow" /> BACK
            </span>
            <span className="text-ink font-extrabold text-sm mt-0.5">{metrics.backCount}</span>
          </div>
        </div>

        {/* Pathway Distribution Mini-Bar */}
        {totalPathwayVotes > 0 && (
          <div className="space-y-1 font-mono text-[10px]">
            <div className="flex justify-between font-bold text-muted-ink">
              <span>PATHWAY CONSENSUS</span>
              <span>{totalPathwayVotes} VOTES</span>
            </div>
            <div className="w-full h-2 bg-field-paper border-2 border-ink flex overflow-hidden">
              <div
                style={{ width: `${(metrics.pathwayVotes[0] / totalPathwayVotes) * 100}%` }}
                className="bg-signal-coral"
                title="Pathway 1"
              />
              <div
                style={{ width: `${(metrics.pathwayVotes[1] / totalPathwayVotes) * 100}%` }}
                className="bg-electric-blue"
                title="Pathway 2"
              />
              <div
                style={{ width: `${(metrics.pathwayVotes[2] / totalPathwayVotes) * 100}%` }}
                className="bg-acid-yellow"
                title="Pathway 3"
              />
            </div>
          </div>
        )}

        {/* CTA Link */}
        <Link
          href={`/scout/${project.id}`}
          className="w-full h-[46px] bg-ink text-white font-headline text-2xl uppercase tracking-wider flex items-center justify-between px-4 hover:bg-signal-coral transition-colors"
        >
          <span>INSPECT SCOUT CARD</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </article>
  );
}
