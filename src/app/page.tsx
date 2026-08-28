import React from "react";
import Link from "next/link";
import { Search, PlusCircle, Film, Sparkles, Compass } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import { ProjectCard } from "@/components/card/ProjectCard";
import { Button } from "@/components/ui/Button";
import type { MediumType, LifecycleStage } from "@/domain";

interface PageProps {
  searchParams: Promise<{
    medium?: string;
    stage?: string;
    q?: string;
  }>;
}

const MEDIUMS: { label: string; value?: MediumType }[] = [
  { label: "ALL FORMATS", value: undefined },
  { label: "SHORTS", value: "short" },
  { label: "FEATURES", value: "feature" },
  { label: "DOCS", value: "documentary" },
  { label: "SERIES / PILOTS", value: "series" },
  { label: "PROOFS OF CONCEPT", value: "proof_of_concept" },
];

export default async function ScoutingWallPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const selectedMedium = resolvedParams.medium as MediumType | undefined;
  const selectedStage = resolvedParams.stage as LifecycleStage | undefined;
  const searchQuery = resolvedParams.q || "";

  const projects = await dataRepo.getProjects({
    medium: selectedMedium,
    stage: selectedStage,
    query: searchQuery,
  });

  return (
    <div className="space-y-10">
      
      {/* 1.08fr/0.92fr Mission & Ticket Hero Split */}
      <section className="border-3 border-ink bg-paper p-6 sm:p-10 shadow-ticket-lift">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Mission & Editorial Declaration */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-acid-yellow text-ink border-2 border-ink font-mono text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-signal-coral" />
              THE AUDIENCE'S TAKE ON WHAT SHOULD BE MADE NEXT
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-normal uppercase tracking-tight text-ink leading-[0.78]">
              THE PUBLIC SCOUTING PROGRAM
            </h1>

            <p className="text-base sm:text-lg text-ink font-sans leading-relaxed max-w-xl">
              Transforming public screen projects, unproduced scripts, and proofs-of-concept into cited, evidence-bounded Scout Cards. Powered by Google Gemini and authentic audience commitments.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link href="/nominate">
                <Button variant="coral" size="lg" className="gap-2">
                  <PlusCircle className="w-5 h-5" />
                  <span>NOMINATE SCREEN PROJECT</span>
                </Button>
              </Link>
              <Link href="/creator">
                <Button variant="outline" size="lg">
                  CREATOR DESK
                </Button>
              </Link>
            </div>
          </div>

          {/* Signature Live Ticket Handbill */}
          <div className="lg:col-span-5 bg-field-paper border-3 border-ink p-6 space-y-4 shadow-selected-lift">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2 font-mono text-xs font-bold uppercase">
              <span className="text-signal-coral">PROGRAM HANDBILL</span>
              <span>ACCESSION NO. 2026-AT</span>
            </div>

            <div className="space-y-2">
              <h3 className="font-headline text-3xl font-normal uppercase tracking-tight text-ink leading-tight">
                SCOUT. CITE. COMMIT.
              </h3>
              <p className="text-xs font-mono text-muted-ink leading-relaxed">
                Every nomination is investigated by our autonomous Gemini research agent, verified against primary sources, and bound to exactly three realistic growth pathways.
              </p>
            </div>

            <div className="p-3 bg-acid-yellow border-2 border-ink font-mono text-xs font-bold space-y-1">
              <div className="flex justify-between">
                <span>ACTIVE DOSSIERS:</span>
                <span className="text-signal-coral">{projects.length} PROJECTS</span>
              </div>
              <div className="flex justify-between">
                <span>COMMUNITY COMMITMENTS:</span>
                <span>WATCH • PAY • BACK</span>
              </div>
            </div>

            <Link href="/nominate" className="block">
              <button className="w-full h-[48px] bg-electric-blue text-white font-headline text-2xl uppercase tracking-wider border-2 border-ink hover:bg-ink transition-colors">
                ENTER PUBLIC OPEN-CALL
              </button>
            </Link>
          </div>

        </div>
      </section>

      {/* Filter & Search Bar: Ruled Continuous Strip */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-paper p-4 border-3 border-ink shadow-selected-lift">
          
          {/* Format / Medium Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {MEDIUMS.map((m) => {
              const isActive = selectedMedium === m.value;
              const href = m.value ? `/?medium=${m.value}` : "/";
              return (
                <Link
                  key={m.label}
                  href={href}
                  className={`px-3 py-2 text-xs font-mono font-extrabold uppercase whitespace-nowrap transition-all border-2 border-ink ${
                    isActive
                      ? "bg-acid-yellow text-ink shadow-selected-lift"
                      : "bg-field-paper text-muted-ink hover:bg-paper hover:text-ink"
                  }`}
                >
                  {m.label}
                </Link>
              );
            })}
          </div>

          {/* Search Form */}
          <form method="GET" action="/" className="w-full lg:w-80 flex items-center relative">
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="SEARCH TITLE OR CREATOR..."
              className="w-full bg-field-paper border-2 border-ink px-3 py-2 pl-9 text-xs font-mono font-bold text-ink placeholder:text-muted-ink/60 focus:outline-none"
            />
            <Search className="w-4 h-4 text-ink absolute left-3 pointer-events-none" />
          </form>
        </div>

        {/* Results Metadata */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-muted-ink px-1 uppercase">
          <span>
            SHOWING <strong className="text-ink">{projects.length}</strong> ACTIVE SCOUT DOSSIERS
          </span>
          {selectedMedium && (
            <span>FORMAT: <span className="text-signal-coral">{selectedMedium.replace("_", " ")}</span></span>
          )}
        </div>
      </section>

      {/* Project Grid */}
      {projects.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      ) : (
        <div className="bg-paper border-3 border-ink p-12 text-center space-y-4 max-w-lg mx-auto shadow-card-lift">
          <Film className="w-12 h-12 text-ink mx-auto opacity-50" />
          <h3 className="font-headline text-4xl font-normal uppercase text-ink">NO DOSSIERS FOUND</h3>
          <p className="text-sm text-muted-ink font-sans">
            No active scout dossiers matched your filter. Be the first to nominate a project in this category!
          </p>
          <Link href="/nominate">
            <Button variant="coral" size="md">
              NOMINATE A SCREEN PROJECT
            </Button>
          </Link>
        </div>
      )}

    </div>
  );
}
