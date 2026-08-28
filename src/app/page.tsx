import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Ticket, Search, Video, Sparkles, ExternalLink } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import { ProjectCard } from "@/components/card/ProjectCard";
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

  const featuredVideoUrl = featuredProject?.nomination.initialLinks?.[0] || "https://www.youtube.com/watch?v=s8G7425lfKs";
  const featuredEmbedUrl = featuredVideoUrl.includes("v=")
    ? `https://www.youtube-nocookie.com/embed/${featuredVideoUrl.split("v=")[1]?.split("&")[0]}`
    : featuredVideoUrl.includes("youtu.be/")
    ? `https://www.youtube-nocookie.com/embed/${featuredVideoUrl.split("youtu.be/")[1]?.split("?")[0]}`
    : "https://www.youtube-nocookie.com/embed/s8G7425lfKs";

  return (
    <div className="max-w-7xl mx-auto my-6 space-y-10 px-4 sm:px-6 lg:px-8">
      
      {/* ---------------------------------------------------- */}
      {/* 1. HERO SECTION: 2-Field Mission & Quick Nomination Ticket */}
      {/* ---------------------------------------------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-12 border-3 border-ink shadow-ticket-lift overflow-hidden">
        
        {/* Left Field: Mission Declaration on Acid Yellow */}
        <div className="lg:col-span-7 bg-acid-yellow p-6 sm:p-10 lg:p-12 border-b-3 lg:border-b-0 lg:border-r-3 border-ink flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2">
              <span className="px-2.5 py-1 bg-ink text-white font-mono text-[11px] font-black uppercase tracking-wider">
                PROGRAM NO. 001
              </span>
              <span className="font-mono text-xs font-black text-ink uppercase">
                PUBLIC CINEMA SCOUTING
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-7xl lg:text-[5.5rem] font-normal uppercase text-ink leading-[0.78] tracking-tight">
              FANS CAN FIND THE NEXT GREAT SCREEN STORY <span className="text-electric-blue">FIRST.</span>
            </h1>

            <p className="text-sm sm:text-base font-sans text-ink font-semibold leading-snug max-w-xl">
              The audience’s take on what should be made next. Surface an overlooked public project, then watch autonomous Gemini research and verified Parallel web citations turn it into an actionable Scout Card.
            </p>
          </div>

          <div className="pt-4 border-t-2 border-ink/40 flex items-center gap-2.5 font-mono text-xs font-black text-ink uppercase">
            <span className="text-lg leading-none">⌖</span>
            <span>PUBLIC PRIMARY SOURCES · CLEAR CONFIDENCE LABELS · NO MYSTERY SCORES.</span>
          </div>
        </div>

        {/* Right Field: Nomination Ticket Handbill */}
        <div className="lg:col-span-5 bg-[#fffdf7] p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2">
              <h2 className="font-display text-3xl sm:text-4xl text-signal-coral uppercase">
                NOMINATE A PROJECT
              </h2>
              <span className="text-signal-coral font-mono text-xl">⤤</span>
            </div>

            <p className="text-xs font-mono font-medium text-muted-ink leading-relaxed">
              Found a trailer, short, series, documentary, creator page, or public campaign that deserves to grow?
            </p>

            <form action="/nominate" method="GET" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="quick-url" className="block text-[11px] font-mono font-black uppercase text-ink">
                  PUBLIC PROJECT URL
                </label>
                <input
                  id="quick-url"
                  name="url"
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or vimeo.com/..."
                  required
                  className="w-full min-h-[50px] px-3.5 bg-paper border-2 border-ink font-mono text-xs text-ink placeholder:text-muted-ink focus:outline-none focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[56px] bg-signal-coral hover:bg-ink text-white font-mono text-sm font-black uppercase flex items-center justify-between px-6 transition-colors border-2 border-ink shadow-action-lift"
              >
                <span>START A NOMINATION</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          <p className="text-[11px] font-mono text-muted-ink pt-2">
            Takes 30 seconds. Gemini & Parallel verify facts from public web sources.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 2. FEATURED STRIP: Spotlight Scout Card (Black Bar) */}
      {/* ---------------------------------------------------- */}
      {featuredProject && (
        <section className="bg-ink text-paper border-3 border-ink p-6 sm:p-8 shadow-card-lift grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Details */}
          <div className="lg:col-span-5 space-y-4">
            <span className="inline-block px-2.5 py-1 bg-acid-yellow text-ink font-mono text-[10px] font-black uppercase tracking-wider">
              SPOTLIGHT SCOUT CARD
            </span>

            <h2 className="font-display text-4xl sm:text-6xl uppercase tracking-tight leading-[0.8] text-white">
              {featuredProject.identity.title}
            </h2>

            <p className="text-xs font-mono font-bold text-acid-yellow uppercase">
              {featuredProject.identity.medium.replace("_", " ")} · {featuredProject.identity.creators?.join(", ") || "INDEPENDENT ANIMATION"}
            </p>

            <p className="text-xs text-[#d7d1c6] font-sans leading-relaxed line-clamp-3">
              {featuredProject.identity.logline ||
                featuredProject.nomination.reason ||
                "A groundbreaking fusion of Japanese anime craft and Midwest urban storytelling that already has a dedicated fanbase."}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/scout/${featuredProject.id}`}
                className="px-5 py-2.5 bg-signal-coral hover:bg-electric-blue text-white font-mono text-xs font-black uppercase inline-flex items-center gap-2 transition-colors border border-white"
              >
                <span>OPEN SCOUT CARD</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/research/${featuredProject.id}`}
                className="px-4 py-2.5 bg-transparent hover:bg-paper/10 text-acid-yellow font-mono text-xs font-bold uppercase inline-flex items-center gap-1.5 border border-acid-yellow transition-colors"
              >
                <span>⌖ RESEARCH LEDGER</span>
              </Link>
            </div>
          </div>

          {/* Center Video Frame */}
          <div className="lg:col-span-4 aspect-video bg-black border-2 border-[#7b776c] overflow-hidden">
            <iframe
              src={featuredEmbedUrl}
              title={featuredProject.identity.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Right Verification Receipts */}
          <div className="lg:col-span-3 border-l lg:border-l border-[#615e56] pl-0 lg:pl-6 space-y-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-[#aaa69e] uppercase block font-bold">PUBLIC EVIDENCE</span>
              <strong className="text-acid-yellow text-sm font-black uppercase">
                {featuredProject.nomination.initialLinks?.length || 2} CITED SOURCES
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-[#aaa69e] uppercase block font-bold">CONFIDENCE</span>
              <strong className="text-white text-sm font-black uppercase">HIGH (PARALLEL)</strong>
            </div>
            <div>
              <span className="text-[10px] text-[#aaa69e] uppercase block font-bold">COMMERCIAL FIT</span>
              <strong className="text-acid-yellow text-sm font-black uppercase">PREMIUM ADULT SERIES</strong>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. WORKFLOW: 3 Side-by-Side Steps */}
      {/* ---------------------------------------------------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="how-it-works">
        {/* Step 1 */}
        <div className="bg-[#fffdf7] border-3 border-ink p-6 shadow-card-lift space-y-3">
          <div className="w-9 h-9 bg-acid-yellow text-ink border-2 border-ink flex items-center justify-center font-mono text-sm font-black">
            01
          </div>
          <h3 className="font-display text-3xl uppercase text-signal-coral leading-none">
            NOMINATE
          </h3>
          <p className="text-xs text-ink font-medium leading-relaxed">
            Paste a public URL (YouTube, Vimeo, Kickstarter, film festival page).
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-[#fffdf7] border-3 border-ink p-6 shadow-card-lift space-y-3">
          <div className="w-9 h-9 bg-electric-blue text-white border-2 border-ink flex items-center justify-center font-mono text-sm font-black">
            02
          </div>
          <h3 className="font-display text-3xl uppercase text-electric-blue leading-none">
            VISIBLE RESEARCH
          </h3>
          <p className="text-xs text-ink font-medium leading-relaxed">
            Watch autonomous agents investigate public sources, extract facts, and ground citations.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-[#fffdf7] border-3 border-ink p-6 shadow-card-lift space-y-3">
          <div className="w-9 h-9 bg-evidence-mint text-ink border-2 border-ink flex items-center justify-center font-mono text-sm font-black">
            03
          </div>
          <h3 className="font-display text-3xl uppercase text-ink leading-none">
            AUDIENCE PULSE
          </h3>
          <p className="text-xs text-ink font-medium leading-relaxed">
            Vote on commercial pathways, commit willingness to pay, and pledge theatrical city demand.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. THE SELECTS: Curated Spotlight Rail */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4" id="the-selects">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-3 border-ink pb-3">
          <div>
            <h2 className="font-display text-5xl sm:text-6xl text-ink uppercase leading-none">
              THE SELECTS
            </h2>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase mt-1">
              CURATED EDITORIAL SELECTION · THREE COMPELLING CANDIDATES
            </p>
          </div>
          <span className="px-3 py-1 bg-paper border-2 border-ink font-mono text-xs font-black uppercase text-ink w-fit">
            CURATED EDITORIAL PROGRAM
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.slice(0, 3).map((project, idx) => (
            <Link
              key={project.id}
              href={`/scout/${project.id}`}
              className="bg-[#fffdf7] border-3 border-ink p-5 hover:bg-acid-yellow/20 transition-all flex flex-col justify-between shadow-card-lift"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 border-2 border-ink flex items-center justify-center font-mono text-sm font-black ${
                      idx === 0 ? "bg-acid-yellow text-ink" : idx === 1 ? "bg-electric-blue text-white" : "bg-signal-coral text-white"
                    }`}
                  >
                    0{idx + 1}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-muted-ink block">
                      {project.identity.medium.replace("_", " ")}
                    </span>
                    <h3 className="font-display text-3xl sm:text-4xl text-ink uppercase leading-none">
                      {project.identity.title}
                    </h3>
                  </div>
                </div>
                <p className="text-xs text-ink font-sans leading-relaxed line-clamp-3">
                  {project.identity.logline || project.nomination.reason}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-ink/40 flex items-center justify-between font-mono text-[11px] font-black text-ink">
                <span>INSPECT DOSSIER</span>
                <ArrowRight className="w-3.5 h-3.5 text-signal-coral" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. FILTER BAR & SCOUTING WALL GRID */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-6 pt-4" id="scouting-wall">
        
        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {MEDIUMS.map((med) => {
              const isActive = selectedMedium === med.value;
              return (
                <Link
                  key={med.label}
                  href={med.value ? `/?medium=${med.value}#scouting-wall` : "/#scouting-wall"}
                  className={`px-3 py-1.5 font-mono text-xs font-black uppercase border-2 border-ink transition-colors ${
                    isActive
                      ? "bg-acid-yellow text-ink shadow-action-lift"
                      : "bg-[#fffdf7] text-ink hover:bg-acid-yellow"
                  }`}
                >
                  {med.label}
                </Link>
              );
            })}
          </div>

          <form action="/#scouting-wall" method="GET" className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <input
                type="text"
                name="q"
                defaultValue={searchQuery}
                placeholder="Search by title, creator, or keyword..."
                className="w-full px-3 py-1.5 bg-[#fffdf7] border-2 border-ink font-mono text-xs text-ink focus:outline-none focus:bg-white"
              />
              <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-muted-ink" />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 bg-ink text-white font-mono text-xs font-bold uppercase hover:bg-signal-coral border-2 border-ink"
            >
              FILTER
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between font-mono text-xs font-bold uppercase text-muted-ink">
          <span>SHOWING {projects.length} ACTIVE SCOUT DOSSIERS</span>
        </div>

        {/* 3-Column Scouting Wall Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

    </div>
  );
}
