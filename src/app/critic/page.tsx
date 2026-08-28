"use client";

import React, { useState } from "react";
import { Video, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TrailerCriticView } from "@/components/critic/TrailerCriticView";
import { YouTubeEmbed } from "@/components/ui/YouTubeEmbed";
import type { TrailerCritic } from "@/domain";

const PRESETS = [
  {
    title: "Signal in the Pines",
    medium: "short",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tagline: "Atmospheric 16mm analog sci-fi short"
  },
  {
    title: "Junichiro Jackson",
    medium: "feature",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tagline: "Neo-noir jazz-hop psychological thriller"
  },
  {
    title: "Midnight in Marais",
    medium: "documentary",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tagline: "Underground Parisian typography & sound art"
  }
];

export default function TrailerCriticPage() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [projectTitle, setProjectTitle] = useState("Signal in the Pines");
  const [medium, setMedium] = useState("short");
  const [loading, setLoading] = useState(false);
  const [criticResult, setCriticResult] = useState<TrailerCritic | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (urlToUse?: string, titleToUse?: string, mediumToUse?: string) => {
    const url = urlToUse || videoUrl;
    const title = titleToUse || projectTitle;
    const med = mediumToUse || medium;

    if (!url.trim()) {
      setError("Please provide a valid trailer URL");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/critic/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: url,
          title: title,
          medium: med,
          projectId: "adhoc"
        })
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setCriticResult(data.critic);
    } catch (err: any) {
      setError(err.message || "Failed to analyze trailer");
    } finally {
      setLoading(false);
    }
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setVideoUrl(preset.videoUrl);
    setProjectTitle(preset.title);
    setMedium(preset.medium);
    handleAnalyze(preset.videoUrl, preset.title, preset.medium);
  };

  return (
    <main className="min-h-screen bg-field-paper py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Ticket Banner */}
        <div className="border-3 border-ink bg-paper p-8 shadow-ticket relative overflow-hidden">
          <div className="ticket-notch -left-4 top-1/2 -translate-y-1/2" />
          <div className="ticket-notch -right-4 top-1/2 -translate-y-1/2" />

          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-dashed border-ink/30 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 bg-signal-coral inline-block animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-muted-ink">
                MULTIMODAL VIDEO INTELLIGENCE STUDIO
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="blue">GEMINI 3.7 FLASH</Badge>
              <Badge variant="yellow">PUBLIC CRITIC</Badge>
            </div>
          </div>

          <h1 className="font-headline text-5xl sm:text-7xl font-normal uppercase text-ink tracking-tight leading-none mb-3">
            TRAILER CRITIC ENGINE
          </h1>
          <p className="text-muted-ink text-base max-w-2xl font-serif leading-relaxed">
            Drop any YouTube or video trailer link to extract an objective, timestamped cinematic breakdown across pacing, sound design, visual grammar, emotional arc, and festival positioning.
          </p>
        </div>

        {/* Input & Preset Studio Controls */}
        <div className="border-3 border-ink bg-paper p-6 sm:p-8 shadow-ticket">
          <h2 className="font-headline text-3xl uppercase text-ink mb-4 flex items-center gap-2">
            <Video className="w-6 h-6 text-signal-coral" />
            ANALYZE A SCREEN TRAILER
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="TRAILER URL (YOUTUBE / DIRECT VIDEO)"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="PROJECT TITLE"
                  placeholder="e.g. Signal in the Pines"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-muted-ink">SAMPLE PRESETS:</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className="text-xs font-mono font-bold uppercase px-2.5 py-1 border border-ink/40 bg-field-paper hover:bg-acid-yellow hover:border-ink transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <Button
                variant="primary"
                onClick={() => handleAnalyze()}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    ANALYZING WITH GEMINI 3.7...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    RUN MULTIMODAL CRITIC
                  </span>
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-signal-coral text-signal-coral text-sm font-mono flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Video Player Preview */}
        {videoUrl && (
          <div className="border-3 border-ink bg-black p-2 shadow-ticket">
            <div className="aspect-video w-full bg-ink/90 overflow-hidden">
              <YouTubeEmbed url={videoUrl} title={projectTitle} />
            </div>
          </div>
        )}

        {/* Live Critic Breakdown Output */}
        {criticResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-4xl uppercase text-ink">
                CRITIC BREAKDOWN REPORT
              </h2>
              <Badge variant="mint">ANALYSIS READY</Badge>
            </div>
            <TrailerCriticView critic={criticResult} />
          </div>
        )}

      </div>
    </main>
  );
}
