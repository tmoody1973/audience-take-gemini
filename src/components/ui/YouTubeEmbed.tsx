"use client";

import React, { useMemo } from "react";
import { clsx } from "clsx";
import { Film } from "lucide-react";

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.replace("/embed/", "").split("?")[0] || null;
      }
      return parsed.searchParams.get("v") || null;
    }
  } catch {
    // If not standard URL format
  }
  return null;
}

export function YouTubeEmbed({
  url,
  title = "YouTube Video Player",
  className,
}: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractYouTubeVideoId(url), [url]);

  if (!videoId) {
    return (
      <div
        className={clsx(
          "w-full aspect-video rounded bg-surface-muted border border-surface-border flex flex-col items-center justify-center p-6 text-center text-text-muted",
          className
        )}
      >
        <Film className="w-8 h-8 text-text-muted mb-2 opacity-60" />
        <p className="text-sm font-mono">Invalid or unsupported video URL</p>
        <p className="text-xs text-text-muted mt-1 max-w-sm truncate">{url}</p>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative w-full aspect-video rounded overflow-hidden bg-black border border-surface-border shadow-editorial",
        className
      )}
    >
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
