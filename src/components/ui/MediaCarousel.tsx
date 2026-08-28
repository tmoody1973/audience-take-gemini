"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { YouTubeEmbed } from "./YouTubeEmbed";
import type { SourceMedia } from "@/domain";

interface MediaCarouselProps {
  media: SourceMedia[];
}

export function MediaCarousel({ media }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Active Media Container */}
      <div className="relative aspect-video w-full bg-field-paper border-3 border-ink overflow-hidden flex items-center justify-center">
        {currentItem.type === "youtube_embed" ? (
          <YouTubeEmbed url={currentItem.url} title={currentItem.caption || "Trailer Video"} />
        ) : (
          <Image
            src={currentItem.url}
            alt={currentItem.caption || "Source Media"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          />
        )}

        {/* Carousel Prev/Next Overlay Buttons */}
        {media.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-paper/90 border-2 border-ink text-ink hover:bg-acid-yellow transition-colors focus:outline-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-paper/90 border-2 border-ink text-ink hover:bg-acid-yellow transition-colors focus:outline-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Caption & Thumbnail Film Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
        <p className="text-ink font-bold uppercase truncate max-w-md">
          {currentItem.caption || `ASSET ${currentIndex + 1} OF ${media.length}`}
        </p>

        {media.length > 1 && (
          <div className="flex items-center gap-2">
            {media.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-14 h-9 border-2 border-ink relative overflow-hidden transition-all ${
                  currentIndex === idx
                    ? "ring-2 ring-signal-coral scale-105"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              >
                {item.type === "youtube_embed" ? (
                  <div className="w-full h-full bg-paper flex items-center justify-center text-signal-coral">
                    <Play className="w-4 h-4" />
                  </div>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.caption || "Thumb"}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
