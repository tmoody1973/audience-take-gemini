"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import type { ScoutBrief } from "./types";
import { Play, Pause, Volume2, VolumeX, Sparkles, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface SourceItem {
  id: string;
  title: string;
  url?: string;
  excerpt?: string;
}

interface Props {
  brief: ScoutBrief;
  unclaimed?: boolean;
  sources?: SourceItem[];
  onOpenCitation?: (source: any) => void;
  audienceMode?: "discover" | "professional";
}

export function ScoutBriefPlayer({
  brief,
  unclaimed,
  sources = [],
  onOpenCitation,
  audienceMode,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(brief.durationMs ? brief.durationMs / 1000 : 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");

  const fallbackAudioSrc = `/api/scout-briefs/${brief.artifactId}/audio`;
  const initialAudioSrc = brief.audioUrl?.startsWith("http") && !brief.audioUrl.includes("/api/")
    ? fallbackAudioSrc
    : (brief.audioUrl || fallbackAudioSrc);

  const [currentAudioSrc, setCurrentAudioSrc] = useState(initialAudioSrc);

  // Map source IDs to human-readable metadata
  const sourceMap = useMemo(() => {
    const map = new Map<string, SourceItem>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  // Safe reset when switching project, version, or brief variant
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch {}
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentAudioSrc(initialAudioSrc);
    setErrorStatus(null);
    setSrAnnouncement("Loaded new audio briefing");
  }, [brief.artifactId, initialAudioSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => syncDuration();
    const handleDurationChange = () => syncDuration();
    const handleCanPlay = () => syncDuration();
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(audio.duration || currentTime);
      setSrAnnouncement("Audio briefing finished");
    };
    const handleError = () => {
      if (currentAudioSrc !== fallbackAudioSrc) {
        setCurrentAudioSrc(fallbackAudioSrc);
        if (audioRef.current) {
          audioRef.current.src = fallbackAudioSrc;
          audioRef.current.load();
        }
      } else {
        setIsPlaying(false);
        setErrorStatus("Audio stream playback unavailable. You can read the full transcript below.");
        setSrAnnouncement("Audio stream unavailable");
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentAudioSrc, fallbackAudioSrc, currentTime]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setSrAnnouncement("Audio briefing paused");
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setErrorStatus(null);
        setSrAnnouncement("Playing audio briefing");
      }).catch((err) => {
        console.warn("[ScoutBrief] Audio play failed:", err);
        if (currentAudioSrc !== fallbackAudioSrc) {
          setCurrentAudioSrc(fallbackAudioSrc);
          audio.src = fallbackAudioSrc;
          audio.load();
          audio.play().then(() => {
            setIsPlaying(true);
            setErrorStatus(null);
            setSrAnnouncement("Playing audio briefing");
          }).catch(() => {
            setErrorStatus("Audio stream playback unavailable. You can read the full transcript below.");
            setSrAnnouncement("Audio stream unavailable");
          });
        } else {
          setErrorStatus("Playback error. You can read the full transcript below.");
          setSrAnnouncement("Playback error");
        }
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const seekRelative = (deltaSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(duration || 300, audio.currentTime + deltaSeconds));
    audio.currentTime = target;
    setCurrentTime(target);
    setSrAnnouncement(deltaSeconds > 0 ? `Seeked forward ${deltaSeconds} seconds` : `Seeked back ${Math.abs(deltaSeconds)} seconds`);
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    setSrAnnouncement(`Playback speed set to ${rate}x`);
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
    setSrAnnouncement(next ? "Audio muted" : "Audio unmuted");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  const variantLabel = brief.variant === "discover"
    ? "Discovery Brief (Fans)"
    : "Professional Diligence (Industry)";

  return (
    <section className="scout-brief-player-container" aria-label="Audio Scout Briefing">
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        preload="metadata"
      />

      <div className="scout-brief-header">
        <div className="brief-title-stack">
          <div className="flex items-center gap-2">
            <div className="brief-pill">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>2-Speaker AI Scout Brief</span>
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-stone-400 bg-stone-100 text-stone-700">
              {variantLabel}
            </span>
          </div>
          <h3 className="brief-heading">{brief.title}</h3>
          <p className="brief-subheading">
            {brief.speakers[0].speaker} (Culture &amp; Creative) &amp; {brief.speakers[1].speaker} (Market Diligence &amp; Risk)
          </p>
        </div>

        <div className="brief-meta-badges">
          <span className="brief-meta-item">
            <strong>Duration:</strong> {formatTime(duration || brief.durationMs / 1000)}
          </span>
          <span className="brief-meta-item">
            <strong>Words:</strong> {brief.wordCount}
          </span>
          {unclaimed && (
            <span className="brief-unclaimed-badge">Fan Nomination · Unclaimed</span>
          )}
        </div>
      </div>

      {errorStatus && (
        <div className="brief-error-banner" role="alert">
          {errorStatus}
        </div>
      )}

      {/* Audio Controls Bar */}
      <div className="brief-controls-bar">
        <button
          type="button"
          onClick={togglePlayPause}
          className="brief-play-btn"
          aria-label={isPlaying ? "Pause audio briefing" : "Play audio briefing"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Relative Seek Controls: -15s / +15s */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => seekRelative(-15)}
            className="brief-seek-btn"
            aria-label="Seek back 15 seconds"
            title="Seek back 15s"
          >
            -15s
          </button>
          <button
            type="button"
            onClick={() => seekRelative(15)}
            className="brief-seek-btn"
            aria-label="Seek forward 15 seconds"
            title="Seek forward 15s"
          >
            +15s
          </button>
        </div>

        <div className="brief-scrubber-group">
          <span className="brief-time-label" aria-label="Current elapsed time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="brief-scrubber"
            aria-label="Seek audio position"
          />
          <span className="brief-time-label" aria-label="Total duration">{formatTime(duration)}</span>
        </div>

        {/* Speed Selector */}
        <div className="brief-speed-group" aria-label="Playback speed controls">
          {speedOptions.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={`brief-speed-btn ${playbackRate === rate ? "active" : ""}`}
              aria-pressed={playbackRate === rate}
            >
              {rate}×
            </button>
          ))}
        </div>

        {/* Mute Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          className="brief-mute-btn"
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Transcript Toggle */}
        <button
          type="button"
          onClick={() => setShowTranscript(!showTranscript)}
          className={`brief-transcript-btn ${showTranscript ? "active" : ""}`}
          aria-expanded={showTranscript}
          aria-controls="scout-brief-transcript-drawer"
        >
          <FileText className="w-4 h-4" />
          <span>Transcript</span>
          {showTranscript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Transcript Drawer */}
      {showTranscript && (
        <div id="scout-brief-transcript-drawer" className="brief-transcript-drawer">
          <div className="transcript-header-row">
            <h4>AI Scout Briefing Transcript</h4>
            <div className="text-xs text-stone-500 max-w-xl text-right">
              {brief.transcript.disclosure || "AI-generated dialogue synthesized from published Scout Card evidence records."}
            </div>
          </div>

          <div className="transcript-dialogue-flow">
            {brief.transcript.segments.map((seg) => (
              <div key={seg.order} className={`transcript-segment-card speaker-${seg.speaker.toLowerCase()}`}>
                <div className="segment-speaker-header">
                  <span className={`speaker-tag speaker-${seg.speaker.toLowerCase()}`}>
                    {seg.speaker}
                  </span>
                  <span className="section-tag">{seg.section.replace("_", " ").toUpperCase()}</span>
                </div>
                <p className="segment-text">{seg.text}</p>
                {seg.sourceIds && seg.sourceIds.length > 0 && (
                  <div className="segment-citations">
                    <small className="font-semibold text-stone-600 mr-1">Supporting Sources:</small>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {seg.sourceIds.map((sid) => {
                        const src = sourceMap.get(sid);
                        const label = src?.title || sid;
                        return (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => {
                              if (onOpenCitation) {
                                const fullSource = sources.find((s) => s.id === sid) || src || { id: sid, title: sid };
                                onOpenCitation(fullSource);
                              } else if (src?.url) {
                                window.open(src.url, "_blank", "noopener,noreferrer");
                              }
                            }}
                            className="segment-source-pill group"
                            title={src?.title ? `View supporting source: ${src.title}` : `Source ID: ${sid}`}
                          >
                            <span>{label}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {brief.transcript.limitations && brief.transcript.limitations.length > 0 && (
            <div className="transcript-limitations-box">
              <strong>Declared Limitations &amp; Diligence Prerequisites:</strong>
              <ul>
                {brief.transcript.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Screen reader live region - updates on events, NOT every second */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {srAnnouncement}
      </div>
    </section>
  );
}
