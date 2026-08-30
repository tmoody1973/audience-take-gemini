import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, TrendingUp, MapPin, Eye, Sparkles, BarChart3, Radio, FileText, ArrowRight } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CityDemandHeatmap } from "@/components/pulse/CityDemandHeatmap";
import { SiteHeader } from "@/components/site-header";

export default async function CreatorDeskPage() {
  const projects = await dataRepo.getProjects();

  // Aggregate telemetry
  const totalProjects = projects.length;
  const verifiedProjects = projects.filter((p) => p.creatorClaim.status === "verified").length;
  const totalWatchIntent = projects.reduce((acc, p) => acc + (p.metrics?.watchCount || 0), 0);
  const totalTheatricalPledges = projects.reduce((acc, p) => acc + (p.metrics?.cityDemandCount || 0), 0);
  const totalPayCommitments = projects.reduce((acc, p) => acc + (p.metrics?.payCount || 0), 0);

  return (
    <div className="site-wrapper">
      <SiteHeader />
      <div className="space-y-10 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Header Banner */}
      <div className="border-3 border-ink bg-paper p-8 shadow-ticket relative overflow-hidden">
        <div className="ticket-notch -left-4 top-1/2 -translate-y-1/2" />
        <div className="ticket-notch -right-4 top-1/2 -translate-y-1/2" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-ink/30 pb-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-evidence-mint text-ink border-2 border-ink font-mono text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
            OFFICIAL FILMMAKER & CREATOR DESK
          </div>
          <span className="font-mono text-xs font-bold text-muted-ink uppercase">
            PROGRAM VERIFICATION REVISION 2.0
          </span>
        </div>

        <h1 className="font-headline text-5xl sm:text-7xl font-normal uppercase text-ink tracking-tight leading-none mb-3">
          CREATOR DESK & ANALYTICS
        </h1>
        <p className="text-muted-ink text-base max-w-2xl font-serif leading-relaxed">
          Claim verified stewardship of your scouted screen work, monitor authentic audience theatrical commitments, and access territory demand briefs for distributor pitch decks.
        </p>
      </div>

      {/* Program Telemetry High-Contrast Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-5 bg-paper border-3 border-ink space-y-1 shadow-selected-lift">
          <div className="flex items-center justify-between text-muted-ink text-xs font-extrabold uppercase">
            <span>ACTIVE DOSSIERS</span>
            <FileText className="w-4 h-4 text-electric-blue" />
          </div>
          <p className="font-headline text-5xl text-ink leading-none">{totalProjects}</p>
          <p className="text-[10px] text-muted-ink uppercase font-bold">{verifiedProjects} VERIFIED STEWARDS</p>
        </div>

        <div className="p-5 bg-paper border-3 border-ink space-y-1 shadow-selected-lift">
          <div className="flex items-center justify-between text-muted-ink text-xs font-extrabold uppercase">
            <span>WATCH INTENT</span>
            <Eye className="w-4 h-4 text-signal-coral" />
          </div>
          <p className="font-headline text-5xl text-signal-coral leading-none">{totalWatchIntent}</p>
          <p className="text-[10px] text-muted-ink uppercase font-bold">TOTAL FAN SIGNALS</p>
        </div>

        <div className="p-5 bg-paper border-3 border-ink space-y-1 shadow-selected-lift">
          <div className="flex items-center justify-between text-muted-ink text-xs font-extrabold uppercase">
            <span>THEATRICAL DEMAND</span>
            <MapPin className="w-4 h-4 text-acid-yellow" />
          </div>
          <p className="font-headline text-5xl text-ink leading-none">{totalTheatricalPledges}</p>
          <p className="text-[10px] text-muted-ink uppercase font-bold">IN-PERSON CINEMA TICKETS</p>
        </div>

        <div className="p-5 bg-paper border-3 border-ink space-y-1 shadow-selected-lift">
          <div className="flex items-center justify-between text-muted-ink text-xs font-extrabold uppercase">
            <span>WTP COMMITMENTS</span>
            <Sparkles className="w-4 h-4 text-electric-blue" />
          </div>
          <p className="font-headline text-5xl text-electric-blue leading-none">{totalPayCommitments}</p>
          <p className="text-[10px] text-muted-ink uppercase font-bold">PRE-RELEASE BACKERS</p>
        </div>
      </div>

      {/* Trust & Independence Governance Policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-5 bg-field-paper border-3 border-ink space-y-2 shadow-selected-lift">
          <span className="text-electric-blue font-extrabold flex items-center gap-1.5 uppercase text-xs">
            <ShieldCheck className="w-4 h-4" /> WHAT VERIFIED CREATORS CAN DO
          </span>
          <ul className="text-muted-ink space-y-1 list-disc list-inside font-bold">
            <li>Publish timestamped creator production logs & updates</li>
            <li>Inspect geographic density maps for theatrical screening pitches</li>
            <li>Directly propose verified YouTube trailers for Gemini 3.7 critique</li>
            <li>Respond to audience takes with verified creator badge</li>
          </ul>
        </div>

        <div className="p-5 bg-field-paper border-3 border-ink space-y-2 shadow-selected-lift">
          <span className="text-signal-coral font-extrabold flex items-center gap-1.5 uppercase text-xs">
            <Lock className="w-4 h-4" /> INDEPENDENCE INVARIANTS
          </span>
          <ul className="text-muted-ink space-y-1 list-disc list-inside font-bold">
            <li>Creators cannot alter independent research citations or fact ledgers</li>
            <li>Private identity documents remain in secure server storage</li>
            <li>Evidence conflicts trigger public, transparent version records</li>
            <li>All commercial pathway votes remain open and public</li>
          </ul>
        </div>
      </div>

      {/* Projects Claim Status & Telemetry List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono border-b-2 border-ink pb-2">
          <h2 className="font-headline text-3xl font-normal uppercase text-ink">
            SCOUTED SCREEN DOSSIERS ({projects.length})
          </h2>
          <span className="text-xs font-bold text-muted-ink uppercase">
            SELECT A PROJECT TO INSPECT DEMAND
          </span>
        </div>

        <div className="space-y-4">
          {projects.map((project) => {
            const isVerified = project.creatorClaim.status === "verified";
            const isPending = project.creatorClaim.status === "pending";

            return (
              <div
                key={project.id}
                className="p-6 bg-paper border-3 border-ink flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-selected-lift hover:bg-field-paper transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge medium={project.identity.medium}>{project.identity.medium.replace("_", " ")}</Badge>
                    <Badge stage={project.identity.currentStage}>{project.identity.currentStage.replace("_", " ")}</Badge>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-evidence-mint text-ink font-mono text-[10px] font-extrabold uppercase border border-ink">
                        <ShieldCheck className="w-3 h-3 text-electric-blue" />
                        VERIFIED CREATOR
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-acid-yellow text-ink font-mono text-[10px] font-extrabold uppercase border border-ink">
                        CLAIM PENDING REVIEW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-field-paper text-muted-ink font-mono text-[10px] font-bold uppercase border border-ink">
                        UNCLAIMED
                      </span>
                    )}
                  </div>

                  <h3 className="font-headline text-4xl font-normal uppercase text-ink leading-tight">
                    {project.identity.title}
                  </h3>

                  {project.identity.creators && project.identity.creators.length > 0 && (
                    <p className="font-mono text-xs font-bold text-muted-ink uppercase">
                      CREATOR(S): <strong className="text-ink">{project.identity.creators.join(", ")}</strong>
                    </p>
                  )}

                  {/* Micro Pulse Indicators */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
                    <span className="flex items-center gap-1 text-ink font-bold">
                      <Eye className="w-3.5 h-3.5 text-signal-coral" />
                      {project.metrics?.watchCount || 0} Watch Intent
                    </span>
                    <span className="flex items-center gap-1 text-ink font-bold">
                      <MapPin className="w-3.5 h-3.5 text-electric-blue" />
                      {project.metrics?.cityDemandCount || 0} Theatrical Demands
                    </span>
                    <span className="flex items-center gap-1 text-ink font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-signal-coral" />
                      {project.metrics?.payCount || 0} WTP Pledges
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <Link href={`/scout/${project.id}`} className="w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="w-full text-xs font-mono gap-1">
                      <span>VIEW DOSSIER</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <Link href={`/critic`} className="w-full sm:w-auto">
                    <Button variant="secondary" size="sm" className="w-full text-xs font-mono gap-1">
                      <span>CRITIC STUDIO</span>
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
    </div>
  );
}
