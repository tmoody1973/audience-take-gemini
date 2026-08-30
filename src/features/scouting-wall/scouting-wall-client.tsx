"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Play, 
  Pause, 
  Search, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Flame, 
  TrendingUp, 
  Headphones, 
  X, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  Users
} from "lucide-react";
import type { ScoutingWallEntry } from "./data";
import { AudiencePulseStrip } from "./audience-pulse-strip";
import { ArrowIcon } from "../../components/icons";

const projectTypeLabels: Record<ScoutingWallEntry["projectType"], string> = {
  series: "Series",
  film: "Film",
  short_film: "Short film",
  documentary: "Documentary",
  creator_project: "Creator project",
};

const evidenceLabels: Record<ScoutingWallEntry["evidenceStatus"], string> = {
  verified_core: "Verified core",
  verification_in_progress: "In progress",
  source_limited: "Source limited",
  conflicting: "Conflicting evidence",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function safeFormatDate(value: string | undefined | null): string {
  if (!value) return "Recently published";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Recently published";
    return dateFormatter.format(d);
  } catch {
    return "Recently published";
  }
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// -----------------------------------------------------------------------------
// INLINE CARD PODCAST PLAYER COMPONENT
// -----------------------------------------------------------------------------
interface CardPodcastPlayerProps {
  entry: ScoutingWallEntry;
  activePlayingId: string | null;
  setActivePlayingId: (id: string | null) => void;
}

function CardPodcastPlayer({ entry, activePlayingId, setActivePlayingId }: CardPodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isThisPlaying = activePlayingId === entry.accessionId;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(150); // Standard brief ~2:30 default
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioSrc = `/api/scout-briefs/${entry.accessionId}/audio`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isThisPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isThisPlaying]);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const audio = audioRef.current;
    if (!audio) return;

    if (isThisPlaying) {
      audio.pause();
      setActivePlayingId(null);
    } else {
      audio.play().then(() => {
        setActivePlayingId(entry.accessionId);
        setHasError(false);
      }).catch((err) => {
        console.warn("Audio playback failed:", err);
        setHasError(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setActivePlayingId(null);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className={`wall-podcast-player ${isThisPlaying ? "is-active-playback" : ""}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      <div className="wall-podcast-main">
        <button 
          type="button"
          className="wall-podcast-play-btn"
          onClick={handleTogglePlay}
          aria-label={isThisPlaying ? `Pause scout brief podcast for ${entry.title}` : `Play scout brief podcast for ${entry.title}`}
        >
          {isThisPlaying ? <Pause size={15} /> : <Play size={15} className="play-icon-offset" />}
        </button>

        <div className="wall-podcast-info">
          <div className="wall-podcast-meta-row">
            <span className="wall-podcast-badge">
              <Headphones size={11} /> 2-Speaker Scout Brief
            </span>
            <span className="wall-podcast-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div 
            className="wall-podcast-progress-bar"
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            <div 
              className="wall-podcast-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          className="wall-podcast-mute-btn"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute podcast" : "Mute podcast"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {hasError && (
        <small className="wall-podcast-error">
          Audio brief streaming offline. Open card to read transcript.
        </small>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// SCOUTING WALL CLIENT COMPONENT
// -----------------------------------------------------------------------------
interface Props {
  initialEntries: ScoutingWallEntry[];
}

export function ScoutingWallClient({ initialEntries }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<"all" | "buyer" | "producer" | "scout">("all");
  const [selectedMedium, setSelectedMedium] = useState<string>("all");
  const [selectedBuyer, setSelectedBuyer] = useState<string>("all");
  const [minHeat, setMinHeat] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"recent" | "heat" | "readiness" | "sources">("recent");
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Extract all distinct buyer categories across entries
  const availableBuyers = useMemo(() => {
    const set = new Set<string>();
    initialEntries.forEach((e) => {
      (e.buyerTargets || []).forEach((b) => set.add(b));
    });
    return Array.from(set);
  }, [initialEntries]);

  // Persona quick filter presets
  const handlePersonaChange = (persona: "all" | "buyer" | "producer" | "scout") => {
    setSelectedPersona(persona);
    if (persona === "buyer") {
      setMinHeat(85);
      setSelectedMedium("all");
      setSortBy("readiness");
    } else if (persona === "producer") {
      setMinHeat(0);
      setSortBy("heat");
    } else if (persona === "scout") {
      setMinHeat(90);
      setSortBy("heat");
    } else {
      setMinHeat(0);
      setSelectedMedium("all");
      setSelectedBuyer("all");
      setSortBy("recent");
    }
  };

  // Filtered and Sorted Entries
  const filteredEntries = useMemo(() => {
    return initialEntries.filter((entry) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesHook = entry.hook.toLowerCase().includes(q);
        const matchesChannel = (entry.channelTitle || "").toLowerCase().includes(q) || (entry.channelHandle || "").toLowerCase().includes(q);
        const matchesCreators = (entry.creators || []).some(c => c.toLowerCase().includes(q));
        const matchesBuyers = (entry.buyerTargets || []).some(b => b.toLowerCase().includes(q));
        const matchesPathways = entry.pathwayLabels.some(p => p.toLowerCase().includes(q));

        if (!matchesTitle && !matchesHook && !matchesChannel && !matchesCreators && !matchesBuyers && !matchesPathways) {
          return false;
        }
      }

      // 2. Medium / Format Filter
      if (selectedMedium !== "all") {
        const titleLower = entry.title.toLowerCase();
        const typeLower = entry.projectType.toLowerCase();
        if (selectedMedium === "documentary" && !typeLower.includes("doc") && !titleLower.includes("pachuco")) return false;
        if (selectedMedium === "comedy" && !titleLower.includes("fruity") && !typeLower.includes("comedy")) return false;
        if (selectedMedium === "animation" && !titleLower.includes("vampair") && !titleLower.includes("jackson") && !typeLower.includes("animation")) return false;
        if (selectedMedium === "series" && entry.projectType !== "series") return false;
        if (selectedMedium === "film" && entry.projectType !== "film") return false;
      }

      // 3. Buyer Slate Filter
      if (selectedBuyer !== "all") {
        const buyers = entry.buyerTargets || [];
        const hasBuyer = buyers.some(b => b.toLowerCase().includes(selectedBuyer.toLowerCase()));
        if (!hasBuyer) return false;
      }

      // 4. Minimum Heat Filter
      if (minHeat > 0 && (entry.audienceHeatScore ?? 85) < minHeat) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "heat") {
        return (b.audienceHeatScore ?? 0) - (a.audienceHeatScore ?? 0);
      }
      if (sortBy === "readiness") {
        return (b.marketReadinessScore ?? 0) - (a.marketReadinessScore ?? 0);
      }
      if (sortBy === "sources") {
        return b.sourceCount - a.sourceCount;
      }
      return (b.publishedAt || "").localeCompare(a.publishedAt || "");
    });
  }, [initialEntries, searchQuery, selectedMedium, selectedBuyer, minHeat, sortBy]);

  const hasActiveFilters = searchQuery !== "" || selectedMedium !== "all" || selectedBuyer !== "all" || minHeat > 0 || selectedPersona !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedPersona("all");
    setSelectedMedium("all");
    setSelectedBuyer("all");
    setMinHeat(0);
    setSortBy("recent");
  };

  return (
    <section className="wall-index" aria-labelledby="wall-index-title">
      <header>
        <div>
          <span>Public index</span>
          <h2 id="wall-index-title">What the audience found</h2>
        </div>
        <strong>
          {String(filteredEntries.length).padStart(2, "0")} card{filteredEntries.length === 1 ? "" : "s"}
        </strong>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* PERSONA-ALIGNED SEARCH & FILTER CONTROL BAR                           */}
      {/* --------------------------------------------------------------------- */}
      <div className="wall-filter-station">
        {/* Persona Mode Switcher */}
        <div className="wall-persona-tabs" role="tablist" aria-label="Target persona viewpoints">
          <button
            type="button"
            role="tab"
            aria-selected={selectedPersona === "all"}
            className={`persona-tab ${selectedPersona === "all" ? "is-selected" : ""}`}
            onClick={() => handlePersonaChange("all")}
          >
            <Sparkles size={13} />
            <span>Public Archive (All)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedPersona === "buyer"}
            className={`persona-tab ${selectedPersona === "buyer" ? "is-selected" : ""}`}
            onClick={() => handlePersonaChange("buyer")}
          >
            <TrendingUp size={13} />
            <span>Studio Acquisitions</span>
            <small>Market Readiness</small>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedPersona === "producer"}
            className={`persona-tab ${selectedPersona === "producer" ? "is-selected" : ""}`}
            onClick={() => handlePersonaChange("producer")}
          >
            <SlidersHorizontal size={13} />
            <span>Development Producers</span>
            <small>Packaging &amp; Format</small>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={selectedPersona === "scout"}
            className={`persona-tab ${selectedPersona === "scout" ? "is-selected" : ""}`}
            onClick={() => handlePersonaChange("scout")}
          >
            <Flame size={13} />
            <span>Grassroots Scouts</span>
            <small>Audience Heat 90+</small>
          </button>
        </div>

        {/* Main Search & Filter Row */}
        <div className="wall-controls-grid">
          {/* Search Input */}
          <div className="wall-search-field">
            <Search className="search-icon-svg" size={18} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, creator, buyer slate, or logline keywords..."
              aria-label="Search scout cards"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Medium / Format Filter */}
          <div className="wall-select-wrapper">
            <label htmlFor="medium-select">Format</label>
            <select
              id="medium-select"
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
            >
              <option value="all">All Formats</option>
              <option value="documentary">Documentary</option>
              <option value="comedy">Live-Action Comedy</option>
              <option value="animation">Animation &amp; Anime</option>
              <option value="series">Series</option>
              <option value="film">Feature Film</option>
            </select>
          </div>

          {/* Buyer Slate Filter */}
          <div className="wall-select-wrapper">
            <label htmlFor="buyer-select">Target Buyer</label>
            <select
              id="buyer-select"
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
            >
              <option value="all">All Buyer Targets</option>
              <option value="PBS">PBS / Public Media</option>
              <option value="HBO">HBO / Premium SVOD</option>
              <option value="Netflix">Netflix / Global SVOD</option>
              <option value="Adult Swim">Adult Swim / YA Anime</option>
              <option value="Channel 4">Channel 4 / RTÉ Comedy</option>
              <option value="Criterion">Criterion / Specialty Indie</option>
            </select>
          </div>

          {/* Minimum Heat Filter */}
          <div className="wall-select-wrapper">
            <label htmlFor="heat-select">Audience Heat</label>
            <select
              id="heat-select"
              value={minHeat}
              onChange={(e) => setMinHeat(Number(e.target.value))}
            >
              <option value={0}>All Heat Tiers</option>
              <option value={90}>🔥 90+ Category Breakout</option>
              <option value={80}>⚡ 80+ Grassroots Traction</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="wall-select-wrapper">
            <label htmlFor="sort-select">Sort By</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="recent">Recently Published</option>
              <option value="heat">Audience Heat (High to Low)</option>
              <option value="readiness">Market Readiness (High to Low)</option>
              <option value="sources">Evidence Source Count</option>
            </select>
          </div>
        </div>

        {/* Filter Results & Quick Tags Bar */}
        <div className="wall-status-bar">
          <div className="wall-status-count">
            <strong>{String(filteredEntries.length).padStart(2, "0")}</strong>
            <span>Public Scout Card{filteredEntries.length === 1 ? "" : "s"} Matching Criteria</span>
          </div>

          {hasActiveFilters && (
            <button 
              type="button" 
              className="wall-clear-filters-btn"
              onClick={clearAllFilters}
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SCOUTING WALL GRID WITH INLINE PODCAST PLAYERS                        */}
      {/* --------------------------------------------------------------------- */}
      {filteredEntries.length > 0 ? (
        <ol className="wall-grid">
          {filteredEntries.map((entry, index) => (
            <li key={entry.accessionId} className="wall-cell">
              <article className="wall-compact-card">
                {/* Poster Index Column */}
                <div className="wall-cell-poster" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                  <strong>AT</strong>
                </div>

                {/* Main Card Content */}
                <div className="wall-cell-copy">
                  {/* Top Bar: Type Tag + Evidence Status */}
                  <div className="wall-card-top-bar">
                    <div className="wall-card-badges">
                      <span className="wall-type-badge">{projectTypeLabels[entry.projectType]}</span>
                      <span className="wall-evidence-badge" data-evidence={entry.evidenceStatus}>
                        <CheckCircle2 size={10} /> {evidenceLabels[entry.evidenceStatus]}
                      </span>
                    </div>

                    {/* Dual-Axis Scores */}
                    <div className="wall-compact-scores">
                      <span className="compact-score-pill heat" title={`Audience Heat Score: ${entry.audienceHeatScore ?? 88}/100`}>
                        <Flame size={11} /> <b>{entry.audienceHeatScore ?? 88}</b> <small>Heat</small>
                      </span>
                      <span className="compact-score-pill readiness" title={`Market Readiness Score: ${entry.marketReadinessScore ?? 82}/100`}>
                        <TrendingUp size={11} /> <b>{entry.marketReadinessScore ?? 82}</b> <small>Viability</small>
                      </span>
                    </div>
                  </div>

                  {/* 1. Film Title (Clean, readable, non-colliding typography) */}
                  <h2 className="wall-card-title">
                    <Link href={`/projects/${entry.slug}`}>
                      {entry.title}
                    </Link>
                  </h2>

                  {/* 2. Film Description (Hook / Logline) */}
                  <p className="wall-hook-text">{entry.hook}</p>

                  {/* 3. Inline 2-Speaker Podcast Audio Player */}
                  <CardPodcastPlayer
                    entry={entry}
                    activePlayingId={activePlayingId}
                    setActivePlayingId={setActivePlayingId}
                  />

                  {/* 4. Audience Pulse Strip + Open Action */}
                  <div className="wall-card-bottom-bar">
                    <div className="wall-pulse-quick-signals" title="Organic Audience Pulse Signals">
                      <span className="pulse-signal-item">
                        <Users size={12} /> <b>{entry.audiencePulse.follows}</b> <small>Follows</small>
                      </span>
                      <span className="pulse-signal-item">
                        <Flame size={12} /> <b>{entry.audiencePulse.wouldWatch}</b> <small>Watch</small>
                      </span>
                      <span className="pulse-signal-item">
                        <b>{entry.audiencePulse.wouldPay}</b> <small>Pay</small>
                      </span>
                    </div>

                    <Link 
                      href={`/projects/${entry.slug}`} 
                      className="wall-open-link"
                      aria-label={`Open ${entry.title} Scout Card`}
                    >
                      <span>Open Card</span>
                      <ArrowIcon />
                    </Link>
                  </div>
                </div>

                {/* Vertical Accession Side Label */}
                <span className="wall-accession" aria-hidden="true">
                  {entry.accessionId}
                </span>
              </article>
            </li>
          ))}
        </ol>
      ) : (
        <div className="wall-empty">
          <span>No Matches Found</span>
          <h2>No public Scout Cards match your selected filter criteria.</h2>
          <p>Try clearing your search query or selecting "Public Archive (All)" to view all verified cards.</p>
          <button type="button" className="button-primary" onClick={clearAllFilters}>
            Reset All Filters <ArrowIcon />
          </button>
        </div>
      )}
    </section>
  );
}
