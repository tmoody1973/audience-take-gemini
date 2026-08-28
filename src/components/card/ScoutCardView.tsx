"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ExternalLink,
  PlusCircle,
  Flag,
  History,
  CheckCircle2,
  HelpCircle,
  Layers,
  TrendingUp,
  FileText,
  Briefcase,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { MediaCarousel } from "../ui/MediaCarousel";
import { TrailerCriticView } from "../critic/TrailerCriticView";
import { AudiencePulsePanel } from "../pulse/AudiencePulsePanel";
import { TakesSection } from "../pulse/TakesSection";
import { SuggestEvidenceModal } from "../evidence/SuggestEvidenceModal";
import { ClaimModal } from "../creator/ClaimModal";
import { ReportModal } from "../reports/ReportModal";
import type {
  Project,
  ScoutCard,
  TrailerCritic,
  UserEngagementRecord,
  Take,
  Correction,
} from "@/domain";

interface ScoutCardViewProps {
  project: Project;
  card: ScoutCard;
  critic: TrailerCritic | null;
  userEngagement: UserEngagementRecord | null;
  initialTakes?: Take[];
  corrections?: Correction[];
}

export function ScoutCardView({
  project,
  card,
  critic,
  userEngagement,
  initialTakes = [],
  corrections = [],
}: ScoutCardViewProps) {
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [reportState, setReportState] = useState<{
    isOpen: boolean;
    targetType: "project" | "take" | "reply" | "evidence" | "creator_update";
    targetId: string;
  }>({
    isOpen: false,
    targetType: "project",
    targetId: project.id,
  });

  const isVerifiedCreator = project.creatorClaim.status === "verified";

  return (
    <article className="space-y-10 max-w-5xl mx-auto py-2">
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-3 border-ink font-mono text-xs font-bold uppercase">
        <div className="flex items-center gap-2 text-muted-ink">
          <Link href="/" className="text-ink hover:bg-acid-yellow px-1">
            01 SCOUTING WALL
          </Link>
          <span>/</span>
          <span className="text-ink truncate max-w-[200px]">{project.identity.title}</span>
          <span className="px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
            VERSION {card.version}.0
          </span>
          <Badge status={card.status}>{card.status}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEvidenceModalOpen(true)}
            className="text-xs font-mono gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> SUGGEST EVIDENCE
          </Button>

          {!isVerifiedCreator && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsClaimModalOpen(true)}
              className="text-xs font-mono gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" /> CLAIM PROJECT
            </Button>
          )}

          <button
            onClick={() =>
              setReportState({ isOpen: true, targetType: "project", targetId: project.id })
            }
            className="p-2 border-2 border-ink bg-field-paper hover:bg-error-red hover:text-white"
            title="Report Issue"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Project Dossier Header */}
      <header className="space-y-4 bg-paper border-3 border-ink p-6 sm:p-8 shadow-ticket-lift">
        <div className="flex flex-wrap items-center gap-2">
          <Badge medium={project.identity.medium}>{project.identity.medium.replace("_", " ")}</Badge>
          <Badge stage={project.identity.currentStage}>{project.identity.currentStage.replace("_", " ")}</Badge>
          {isVerifiedCreator && (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-extrabold text-ink bg-evidence-mint px-2 py-0.5 border-2 border-ink">
              <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" /> VERIFIED CREATOR
            </span>
          )}
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-normal uppercase tracking-tight text-ink leading-[0.78]">
          {project.identity.title}
        </h1>

        {project.identity.creators && project.identity.creators.length > 0 && (
          <p className="font-mono text-xs font-extrabold text-muted-ink uppercase">
            CREATORS: <strong className="text-ink">{project.identity.creators.join(", ")}</strong>
          </p>
        )}

        {card.decisionBrief.logline && (
          <p className="text-base sm:text-lg text-ink font-sans leading-relaxed max-w-3xl pt-2">
            "{card.decisionBrief.logline}"
          </p>
        )}

        <div className="flex items-center gap-2 pt-2 text-xs font-mono font-bold text-muted-ink">
          <span>SOURCE DOSSIER:</span>
          <a
            href={project.identity.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-electric-blue hover:underline inline-flex items-center gap-1 truncate max-w-md"
          >
            {project.identity.normalizedUrl}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </header>

      {/* Section 1: Source Media & Trailer */}
      {card.sourceMedia && card.sourceMedia.length > 0 && (
        <section aria-label="Source Media" className="border-3 border-ink bg-paper p-4 shadow-selected-lift">
          <MediaCarousel media={card.sourceMedia} />
        </section>
      )}

      {/* Section 2: What We Know vs What We're Checking */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* What We Know */}
        <div className="p-6 bg-paper border-3 border-ink shadow-selected-lift space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-ink font-mono text-xs font-bold uppercase">
            <h3 className="font-headline text-3xl font-normal text-ink flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-signal-coral" />
              WHAT WE KNOW
            </h3>
            <span className="px-2 py-0.5 bg-evidence-mint text-ink border border-ink text-[10px]">
              VERIFIED FACTS
            </span>
          </div>

          <ul className="space-y-3 text-sm text-ink leading-relaxed font-sans">
            {card.whatWeKnow.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-signal-coral font-mono font-extrabold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What We're Checking */}
        <div className="p-6 bg-paper border-3 border-ink shadow-selected-lift space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-ink font-mono text-xs font-bold uppercase">
            <h3 className="font-headline text-3xl font-normal text-ink flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-electric-blue" />
              WHAT WE'RE CHECKING
            </h3>
            <span className="px-2 py-0.5 bg-acid-yellow text-ink border border-ink text-[10px]">
              OPEN LEADS
            </span>
          </div>

          <ul className="space-y-3 text-sm text-ink leading-relaxed font-sans">
            {card.whatWereChecking.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-electric-blue font-mono font-extrabold mt-0.5">?</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </section>

      {/* Section 3: Why It Was Scouted */}
      <section className="p-6 bg-acid-yellow border-3 border-ink shadow-selected-lift space-y-2">
        <div className="flex items-center justify-between pb-2 border-b-2 border-ink font-mono text-xs font-bold uppercase">
          <h3 className="font-headline text-3xl font-normal text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-signal-coral" />
            WHY IT WAS SCOUTED
          </h3>
          <span>NOMINATOR RATIONALE</span>
        </div>
        <p className="text-base text-ink leading-relaxed font-sans font-medium pt-1">
          "{card.whyScouted}"
        </p>
      </section>

      {/* Section 4: Evidence Ledger & Primary Citations */}
      <section aria-label="Evidence Ledger" className="p-6 bg-paper border-3 border-ink shadow-selected-lift space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
          <div>
            <h3 className="font-headline text-3xl font-normal text-ink uppercase flex items-center gap-2">
              <FileText className="w-6 h-6 text-electric-blue" />
              EVIDENCE LEDGER & PRIMARY CITATIONS ({card.evidenceLedger.length})
            </h3>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase">
              Transparent, primary sources bounding all substantive claims on this card.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-2 border-ink">
            <thead className="bg-field-paper">
              <tr className="border-b-2 border-ink text-ink text-[11px] font-extrabold uppercase">
                <th className="py-2.5 px-3 border-r-2 border-ink">Claim Type</th>
                <th className="py-2.5 px-3 border-r-2 border-ink">Title / Source</th>
                <th className="py-2.5 px-3 border-r-2 border-ink">Publisher</th>
                <th className="py-2.5 px-3 border-r-2 border-ink">Excerpt</th>
                <th className="py-2.5 px-3 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-ink bg-paper">
              {card.evidenceLedger.map((item) => (
                <tr key={item.id} className="hover:bg-field-paper transition-colors">
                  <td className="py-3 px-3 border-r-2 border-ink">
                    <Badge claimType={item.claimType}>{item.claimType}</Badge>
                  </td>
                  <td className="py-3 px-3 font-bold text-ink border-r-2 border-ink">{item.title}</td>
                  <td className="py-3 px-3 text-muted-ink border-r-2 border-ink">{item.publisher}</td>
                  <td className="py-3 px-3 text-ink font-sans text-xs max-w-xs truncate border-r-2 border-ink" title={item.excerpt}>
                    "{item.excerpt}"
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-signal-coral font-bold hover:underline inline-flex items-center gap-1"
                    >
                      <span>CITE</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5: Exactly 3 Bounded Pathway Hypotheses */}
      <section aria-label="Growth Pathway Hypotheses" className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-4xl sm:text-5xl font-normal uppercase text-ink">
              THREE BOUNDED PATHWAY HYPOTHESES
            </h3>
            <span className="text-[11px] font-mono font-extrabold uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
              CONCORDANT TO MEDIUM
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink uppercase">
            Realistic growth trajectories based on format, audience archetype, and actionable next experiments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {card.pathways.map((pathway, idx) => (
            <div
              key={idx}
              className="p-6 bg-paper border-3 border-ink shadow-selected-lift flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-ink pb-2">
                  <span className="text-sm font-headline uppercase text-signal-coral font-bold">
                    PATHWAY 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase text-muted-ink">HYPOTHESIS</span>
                </div>

                <h4 className="font-headline text-3xl font-normal uppercase text-ink leading-[0.85]">
                  {pathway.title}
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-muted-ink uppercase text-[10px] font-extrabold block">Medium-Fit Rationale</span>
                    <p className="text-ink font-sans text-xs leading-relaxed mt-0.5">
                      {pathway.mediumFitRationale}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-ink uppercase text-[10px] font-extrabold block">Target Audience Archetype</span>
                    <p className="text-ink font-sans text-xs leading-relaxed mt-0.5">
                      {pathway.targetAudience}
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-ink uppercase text-[10px] font-extrabold block">Key Uncertainties & Risks</span>
                    <ul className="list-disc list-inside text-muted-ink font-sans text-xs mt-0.5 space-y-0.5">
                      {pathway.risksAndUncertainties.map((r, rIdx) => (
                        <li key={rIdx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bounded Next Experiment */}
              <div className="p-4 bg-field-paper border-2 border-ink space-y-2 font-mono text-xs">
                <div className="flex items-center gap-1.5 text-signal-coral font-extrabold uppercase text-[10px]">
                  <TrendingUp className="w-3.5 h-3.5" /> NEXT BOUNDED EXPERIMENT
                </div>
                <h5 className="font-headline text-xl uppercase text-ink">
                  {pathway.nextBoundedExperiment.name}
                </h5>
                <p className="text-muted-ink font-sans text-xs leading-relaxed">
                  {pathway.nextBoundedExperiment.description}
                </p>
                <div className="pt-1 text-[11px] text-ink font-bold border-t border-ink">
                  <span>METRIC: </span>
                  <span className="text-electric-blue">{pathway.nextBoundedExperiment.successMetric}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Section 6: Decision Brief */}
      <section className="p-6 bg-paper border-3 border-ink shadow-selected-lift space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
          <h3 className="font-headline text-3xl font-normal uppercase text-ink flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-signal-coral" />
            DECISION BRIEF
          </h3>
          <span className="text-[10px] font-mono font-bold uppercase text-muted-ink">
            EXECUTIVE SUMMARY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 bg-field-paper border-2 border-ink space-y-1">
            <span className="text-muted-ink text-[10px] font-bold uppercase block">Core Hook</span>
            <p className="text-ink font-sans text-xs">{card.decisionBrief.coreHook}</p>
          </div>

          <div className="p-3 bg-field-paper border-2 border-ink space-y-1">
            <span className="text-muted-ink text-[10px] font-bold uppercase block">Comparatives</span>
            <p className="text-signal-coral font-sans text-xs font-bold">{card.decisionBrief.comparativeTitles.join(", ")}</p>
          </div>

          <div className="p-3 bg-field-paper border-2 border-ink space-y-1 sm:col-span-2">
            <span className="text-muted-ink text-[10px] font-bold uppercase block">Primary Execution Risk</span>
            <p className="text-error-red font-sans text-xs">{card.decisionBrief.primaryRisk}</p>
          </div>
        </div>
      </section>

      {/* Section 7: AUDIENCE PULSE (Placed BEFORE Industry Lens as requested!) */}
      <AudiencePulsePanel
        projectId={project.id}
        initialMetrics={project.metrics}
        initialUserEngagement={userEngagement}
        pathways={card.pathways}
      />

      {/* Section 8: Industry Lens */}
      <section className="p-6 bg-paper border-3 border-ink shadow-selected-lift space-y-4">
        <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
          <div>
            <h3 className="font-headline text-3xl font-normal uppercase text-ink flex items-center gap-2">
              <Layers className="w-6 h-6 text-electric-blue" />
              INDUSTRY LENS
            </h3>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase">
              Market context and realistic constraints for producers and distributors.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 bg-field-paper border-2 border-ink space-y-1 md:col-span-2">
            <span className="text-electric-blue uppercase text-[10px] font-extrabold block">Market Context</span>
            <p className="text-ink font-sans text-xs leading-relaxed pt-1">
              {card.industryLens.marketContext}
            </p>
          </div>

          <div className="p-4 bg-field-paper border-2 border-ink space-y-1">
            <span className="text-muted-ink uppercase text-[10px] font-extrabold block">Budget Constraints</span>
            <p className="text-ink font-sans text-xs leading-relaxed pt-1">
              {card.industryLens.realisticConstraints}
            </p>
          </div>
        </div>
      </section>

      {/* Section 9: Trailer Critic (If Available) */}
      {critic && <TrailerCriticView critic={critic} />}

      {/* Section 10: Audience Takes & Community Discussion */}
      <TakesSection
        projectId={project.id}
        initialTakes={initialTakes}
        onOpenReport={(type, id) => setReportState({ isOpen: true, targetType: type, targetId: id })}
      />

      {/* Section 11: Transparent Version & Provenance History */}
      <section className="p-5 bg-field-paper border-3 border-ink space-y-3 font-mono text-xs font-bold">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-ink uppercase">
            <History className="w-4 h-4 text-signal-coral" />
            PROVENANCE & VERSION LOG
          </span>
          <span className="text-muted-ink text-[10px]">
            GENERATED AT {new Date(card.versionProvenance.generatedAt).toLocaleString()}
          </span>
        </div>
        <p className="text-muted-ink">
          <strong>MODEL & ENGINE: </strong>{card.versionProvenance.model} • <strong>CHANGE REASON: </strong>{card.versionProvenance.changeReason}
        </p>

        {corrections.length > 0 && (
          <div className="pt-2 border-t-2 border-ink space-y-1 text-[11px]">
            <span className="text-signal-coral">PUBLIC CORRECTION AUDIT:</span>
            {corrections.map((corr) => (
              <p key={corr.id} className="text-ink">
                • Version {corr.cardVersionFrom} → {corr.cardVersionTo}: {corr.summary} ({new Date(corr.publishedAt).toLocaleDateString()})
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <SuggestEvidenceModal
        projectId={project.id}
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
      />

      <ClaimModal
        projectId={project.id}
        projectTitle={project.identity.title}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      <ReportModal
        targetType={reportState.targetType}
        targetId={reportState.targetId}
        isOpen={reportState.isOpen}
        onClose={() => setReportState({ ...reportState, isOpen: false })}
      />

    </article>
  );
}
