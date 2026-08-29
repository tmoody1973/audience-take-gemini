"use client";

import React, { useRef, useState, useEffect } from "react";
import type { ScoutBrief, ScoutBriefSegment } from "./types";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  brief: ScoutBrief;
  unclaimed?: boolean;
}

export function ScoutBriefPlayer({ brief, unclaimed }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(brief.durationMs ? brief.durationMs / 1000 : 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fallbackAudioSrc = `/api/scout-briefs/${brief.artifactId}/audio`;
  const initialAudioSrc = brief.audioUrl?.startsWith("http") && !brief.audioUrl.includes("/api/")
    ? fallbackAudioSrc
    : (brief.audioUrl || fallbackAudioSrc);

  const [currentAudioSrc, setCurrentAudioSrc] = useState(initialAudioSrc);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      if (currentAudioSrc !== fallbackAudioSrc) {
        // Fallback to local audio API endpoint
        setCurrentAudioSrc(fallbackAudioSrc);
        if (audioRef.current) {
          audioRef.current.src = fallbackAudioSrc;
          audioRef.current.load();
        }
      } else {
        setIsPlaying(false);
        setErrorStatus("Audio stream playback unavailable. You can read the full transcript below.");
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [currentAudioSrc, fallbackAudioSrc]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setErrorStatus(null);
      }).catch((err) => {
        console.warn("[ScoutBrief] Audio play failed:", err);
        if (currentAudioSrc !== fallbackAudioSrc) {
          setCurrentAudioSrc(fallbackAudioSrc);
          audio.src = fallbackAudioSrc;
          audio.load();
          audio.play().then(() => {
            setIsPlaying(true);
            setErrorStatus(null);
          }).catch(() => {
            setErrorStatus("Audio stream playback unavailable. You can read the full transcript below.");
          });
        } else {
          setErrorStatus("Playback error. You can read the full transcript below.");
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

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? "0" : ""}${rem}`;
  };

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];

  return (
    <section className="scout-brief-player-container" aria-label="Audio Scout Briefing">
      <audio
        ref={audioRef}
        src={currentAudioSrc}
        preload="metadata"
      />

      <div className="scout-brief-header">
        <div className="brief-title-stack">
          <div className="brief-pill">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>2-Speaker AI Scout Brief</span>
          </div>
          <h3 className="brief-heading">{brief.title}</h3>
          <p className="brief-subheading">
            {brief.speakers[0].speaker} (Culture & Resonance) &amp; {brief.speakers[1].speaker} (Market Economics &amp; Risk)
          </p>
        </div>

        <div className="brief-meta-badges">
          <span className="brief-meta-item">
            <strong>Duration:</strong> {formatTime(duration || brief.durationMs / 1000)}
          </span>
          <span className="brief-meta-item">
            <strong>Word Count:</strong> {brief.wordCount} words
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
            <h4>Verified Dialogue Transcript</h4>
            <small className="transcript-disclosure">{brief.transcript.disclosure}</small>
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
                    <small>Citations:</small>
                    {seg.sourceIds.map((sid) => (
                      <span key={sid} className="segment-source-pill">
                        {sid}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {brief.transcript.limitations && brief.transcript.limitations.length > 0 && (
            <div className="transcript-limitations-box">
              <strong>Declared Limitations &amp; Risks:</strong>
              <ul>
                {brief.transcript.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Accessibility live region */}
      <div className="sr-only" aria-live="polite">
        {isPlaying ? `Playing Scout Brief at ${playbackRate}x speed` : "Scout Brief paused"}
      </div>
    </section>
  );
}
