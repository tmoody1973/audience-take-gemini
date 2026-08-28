import React from "react";
import Link from "next/link";
import { Search, PlusCircle, Film, Sparkles, ArrowRight, Eye, CheckCircle2, ShieldCheck, Ticket } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import { ProjectCard } from "@/components/card/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

  const featuredProject = projects.find((p) => p.id === "proj-junichiro") || projects[0];
  const featuredCard = featuredProject?.publishedCardId
    ? await dataRepo.getScoutCardById(featuredProject.publishedCardId)
    : null;

  return (
    <div className="space-y-12">
      
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION: 2-Field Mission & Quick Nomination Ticket */}
      {/* ---------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border-3 border-ink bg-paper shadow-ticket-lift overflow-hidden">
        
        {/* Left Field: Mission Declaration on Acid Yellow */}
        <div className="lg:col-span-7 bg-acid-yellow p-6 sm:p-10 lg:p-12 border-b-3 lg:border-b-0 lg:border-r-3 border-ink flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-ink text-white font-mono text-xs font-black uppercase tracking-wider">
                PROGRAM NO. 001
              </span>
              <span className="font-mono text-xs font-black text-ink uppercase">
                PUBLIC CINEMA SCOUTING
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-normal uppercase text-ink leading-[0.78] tracking-tight">
              FANS CAN FIND THE NEXT GREAT SCREEN STORY <em className="text-electric-blue not-italic">FIRST.</em>
            </h1>

            <p className="text-base sm:text-lg font-sans text-ink font-semibold leading-snug max-w-xl">
              The audience’s take on what should be made next. Surface an overlooked public project, then watch autonomous Gemini research and verified Parallel web citations turn it into an actionable Scout Card.
            </p>
          </div>

          <div className="pt-4 border-t-2 border-ink/30 flex items-center gap-3 font-mono text-xs font-bold text-ink uppercase">
            <ShieldCheck className="w-5 h-5 text-signal-coral flex-shrink-0" />
            <span>Public primary sources. Clear confidence labels. No mystery scores.</span>
          </div>
        </div>

        {/* Right Field: Nomination Ticket Handbill */}
        <div className="lg:col-span-5 bg-paper p-6 sm:p-10 flex flex-col justify-between space-y-6 relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="font-display text-3xl sm:text-4xl text-signal-coral uppercase">
                NOMINATE A PROJECT
              </h2>
              <Ticket className="w-6 h-6 text-signal-coral" />
            </div>

            <p className="text-xs font-mono font-medium text-muted-ink leading-relaxed">
              Found a trailer, short, series, documentary, creator page, or public campaign that deserves to grow?
            </p>

            <form action="/nominate" method="GET" className="space-y-3 pt-2">
              <label htmlFor="quick-url" className="block text-[11px] font-mono font-black uppercase text-ink">
                PUBLIC PROJECT URL
              </label>
              <input
                id="quick-url"
                name="url"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                required
                className="w-full h-12 bg-field-paper border-2 border-ink px-3 text-xs font-mono font-bold text-ink focus:outline-none placeholder:text-muted-ink/50"
              />
              <button
                type="submit"
                className="w-full h-14 bg-signal-coral text-white font-display text-2xl uppercase tracking-wider border-2 border-ink shadow-selected-lift hover:bg-electric-blue transition-colors flex items-center justify-between px-6 cursor-pointer"
              >
                <span>START A NOMINATION</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </form>
          </div>

          <p className="text-[11px] font-mono text-muted-ink border-t border-ink/20 pt-3">
            Takes ~2 minutes. Visible autonomous research begins immediately.
          </p>
        </div>

      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURED STRIP: Dark Contact-Strip Anchor */}
      {/* ---------------------------------------------------- */}
      {featuredProject && (
        <section className="bg-ink text-paper p-6 sm:p-8 border-3 border-ink shadow-ticket-lift space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Left: Metadata and Hook */}
            <div className="lg:col-span-4 space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-acid-yellow text-ink font-mono text-[10px] font-black uppercase">
                FEATURED NOMINATION · SOURCE 01
              </div>

              <div>
                <h2 className="font-display text-4xl sm:text-5xl uppercase text-white leading-[0.8]">
                  {featuredProject.identity.title}
                </h2>
                <p className="text-xs font-mono font-bold text-acid-yellow uppercase mt-1">
                  FAN NOMINATION — UNCLAIMED BY CREATOR
                </p>
              </div>

              <p className="text-xs font-sans text-paper/80 leading-relaxed">
                {featuredProject.identity.logline}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link href={`/scout/${featuredProject.id}`}>
                  <Button variant="coral" size="sm" className="gap-1.5">
                    <span>OPEN SCOUT CARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a
                  href={featuredProject.identity.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-paper/40 text-paper hover:bg-paper hover:text-ink font-mono text-xs font-extrabold uppercase transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>OPEN PUBLIC SOURCE</span>
                </a>
              </div>
            </div>

            {/* Center: Video Viewport Frame */}
            <div className="lg:col-span-6 bg-black border-2 border-paper/30 overflow-hidden aspect-video relative shadow-selected-lift">
              {featuredCard?.sourceMedia[0]?.url ? (
                <iframe
                  src={featuredCard.sourceMedia[0].url}
                  title={`${featuredProject.identity.title} video`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-mono text-xs text-muted-ink">
                  [FEATURED VIDEO FEED]
                </div>
              )}
            </div>

            {/* Right: Receipt Strip */}
            <div className="lg:col-span-2 border-t-2 lg:border-t-0 lg:border-l-2 border-paper/20 lg:pl-6 space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-paper/60 uppercase block">PRIMARY SOURCE</span>
                <strong className="text-acid-yellow uppercase">YouTube Video</strong>
              </div>
              <div>
                <span className="text-[10px] text-paper/60 uppercase block">CARD STATUS</span>
                <strong className="text-evidence-mint uppercase">Published V1</strong>
              </div>
              <div>
                <span className="text-[10px] text-paper/60 uppercase block">RESEARCH ENGINE</span>
                <strong className="text-white uppercase">Gemini 3.5 / 3.7</strong>
              </div>
              <div>
                <span className="text-[10px] text-paper/60 uppercase block">WEB DISCOVERY</span>
                <strong className="text-electric-blue uppercase">Parallel Search</strong>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3-STEP WORKFLOW PROGRAM */}
      {/* ---------------------------------------------------- */}
      <section className="border-3 border-ink bg-paper shadow-ticket-lift overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y-3 md:divide-y-0 md:divide-x-3 divide-ink">
          
          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="w-8 h-8 bg-acid-yellow border-2 border-ink flex items-center justify-center font-black text-sm">
                01
              </span>
              <span className="text-xs font-black uppercase text-signal-coral">INTAKE</span>
            </div>
            <h3 className="font-display text-3xl uppercase text-ink">NOMINATE</h3>
            <p className="text-xs font-sans text-muted-ink leading-relaxed">
              Share one public project link and state why the screen story deserves a wider look.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-3 bg-field-paper">
            <div className="flex items-center justify-between font-mono">
              <span className="w-8 h-8 bg-electric-blue text-white border-2 border-ink flex items-center justify-center font-black text-sm">
                02
              </span>
              <span className="text-xs font-black uppercase text-electric-blue">AGENTS SCOUT</span>
            </div>
            <h3 className="font-display text-3xl uppercase text-ink">VISIBLE RESEARCH</h3>
            <p className="text-xs font-sans text-muted-ink leading-relaxed">
              Visible agents read the source, query Parallel Search API, verify citations, and bound 3 realistic growth pathways.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center justify-between font-mono">
              <span className="w-8 h-8 bg-evidence-mint border-2 border-ink flex items-center justify-center font-black text-sm">
                03
              </span>
              <span className="text-xs font-black uppercase text-ink">ACTION</span>
            </div>
            <h3 className="font-display text-3xl uppercase text-ink">AUDIENCE PULSE</h3>
            <p className="text-xs font-sans text-muted-ink leading-relaxed">
              Fans register screening demand, commit to watch or pay, vote on pathway hypotheses, and publish structured takes.
            </p>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* THE SELECTS: Editorial Scouting Rail */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4" id="selects">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 border-b-3 border-ink pb-3">
          <div>
            <h2 className="font-display text-4xl sm:text-6xl uppercase text-ink leading-none">
              THE SELECTS
            </h2>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase mt-1">
              Curated editorial program showcasing evidence-bounded screen projects
            </p>
          </div>
          <span className="px-3 py-1 bg-field-paper border-2 border-ink font-mono text-xs font-black uppercase text-ink">
            PUBLISHED EDITORIAL DOSSIERS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((proj, idx) => {
            const posterColors = ["bg-acid-yellow text-ink", "bg-electric-blue text-white", "bg-signal-coral text-white"];
            return (
              <Link
                key={proj.id}
                href={`/scout/${proj.id}`}
                className="group border-3 border-ink bg-field-paper p-5 space-y-4 shadow-selected-lift hover:shadow-card-lift transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-14 border-2 border-ink flex flex-col justify-between p-1 font-display ${posterColors[idx % 3]}`}>
                    <span className="text-sm font-bold leading-none">0{idx + 1}</span>
                    <span className="text-xl font-bold leading-none self-end">AT</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-black uppercase text-signal-coral block">
                      {proj.identity.medium.replace("_", " ")}
                    </span>
                    <h3 className="font-display text-2xl sm:text-3xl uppercase text-ink leading-tight group-hover:text-electric-blue transition-colors">
                      {proj.identity.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs font-sans text-muted-ink line-clamp-2">
                  {proj.identity.logline}
                </p>

                <div className="pt-2 border-t border-ink/20 flex items-center justify-between text-[10px] font-mono font-extrabold uppercase text-ink">
                  <span>3 BOUNDED PATHWAYS</span>
                  <span className="flex items-center gap-1 text-signal-coral group-hover:translate-x-1 transition-transform">
                    DOSSIER <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* THE SCOUTING WALL: Complete Catalogue & Search Filters */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-6" id="wall">
        
        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-paper p-4 border-3 border-ink shadow-selected-lift">
          
          {/* Format Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
            {MEDIUMS.map((m) => {
              const isActive = selectedMedium === m.value;
              const href = m.value ? `/?medium=${m.value}#wall` : "/#wall";
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
          <form method="GET" action="/#wall" className="w-full lg:w-80 flex items-center relative">
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

        {/* Results Count Bar */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-muted-ink px-1 uppercase">
          <span>
            SHOWING <strong className="text-ink">{projects.length}</strong> ACTIVE SCOUT DOSSIERS
          </span>
          {selectedMedium && (
            <span>FORMAT: <span className="text-signal-coral">{selectedMedium.replace("_", " ")}</span></span>
          )}
        </div>

        {/* Project Grid */}
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
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

      </section>

    </div>
  );
}
