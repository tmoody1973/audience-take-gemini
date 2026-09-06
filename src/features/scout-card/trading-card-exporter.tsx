"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { youtubeVideoId } from "@/lib/media/youtube";
import type { ScoutCard } from "./types";

export type TradingCardExporterProps = {
  card: ScoutCard;
};

/**
 * Extracts the best available visual asset for the Scout Card:
 * 1. Direct media.imageUrl
 * 2. YouTube thumbnail from media.sourceUrl or media.embedUrl
 * 3. YouTube thumbnail from provenance.submittedSourceUrl
 * 4. YouTube thumbnail from sourceLedger entries
 */
export function getCardThumbnailUrl(card: ScoutCard): string | null {
  if (card.media?.imageUrl) {
    return card.media.imageUrl;
  }
  const ytFromMedia = youtubeVideoId(card.media?.sourceUrl || "") ?? youtubeVideoId(card.media?.embedUrl || "");
  if (ytFromMedia) {
    return `https://img.youtube.com/vi/${ytFromMedia}/hqdefault.jpg`;
  }
  const submittedUrl = card.provenance?.submittedSourceUrl;
  const ytFromSubmitted = submittedUrl ? youtubeVideoId(submittedUrl) : null;
  if (ytFromSubmitted) {
    return `https://img.youtube.com/vi/${ytFromSubmitted}/hqdefault.jpg`;
  }
  for (const source of card.sourceLedger || []) {
    const ytFromSource = youtubeVideoId(source.url || "");
    if (ytFromSource) {
      return `https://img.youtube.com/vi/${ytFromSource}/hqdefault.jpg`;
    }
  }
  return null;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + "...", x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0 && lineCount < maxLines) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export function TradingCardExporter({ card }: TradingCardExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const drawCard = useCallback((thumbnailImg: HTMLImageElement | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Graceful fallback for environments without 2d context (e.g. jsdom)

    // 1. Dark editorial background (#101114)
    ctx.fillStyle = "#101114";
    ctx.fillRect(0, 0, 1200, 630);

    // Hallmark border framing (#282a30)
    ctx.strokeStyle = "#282a30";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, 1200 - 72, 630 - 72);

    // Subtle inner corner accents
    ctx.strokeStyle = "#40434f";
    ctx.lineWidth = 1;
    ctx.strokeRect(44, 44, 1200 - 88, 630 - 88);

    // 2. Top branding: "AUDIENCE TAKE SCOUT CARD" + projectType badge pill
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
    ctx.fillStyle = "#e59500";
    ctx.fillText("AUDIENCE TAKE SCOUT CARD", 64, 88);

    const brandingWidth = ctx.measureText("AUDIENCE TAKE SCOUT CARD").width;
    const typeLabel = (card.projectType || "PROJECT").replace("_", " ").toUpperCase();

    // Project Type Pill
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const typeMetrics = ctx.measureText(typeLabel);
    const pillX = 64 + brandingWidth + 24;
    const pillY = 70;
    const pillW = typeMetrics.width + 24;
    const pillH = 26;

    ctx.fillStyle = "#1e2026";
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 13);
    ctx.fill();
    ctx.strokeStyle = "#383a45";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#e4e4e7";
    ctx.fillText(typeLabel, pillX + 12, pillY + 17);

    // Project ID watermark right side
    const cardIdLabel = `AT—${(card.cardVersionId || card.projectId || "00000000").slice(-8).toUpperCase()}`;
    ctx.font = "14px monospace";
    ctx.fillStyle = "#52525b";
    const cardIdWidth = ctx.measureText(cardIdLabel).width;
    ctx.fillText(cardIdLabel, 1200 - 64 - cardIdWidth, 88);

    const hasImage = Boolean(thumbnailImg);
    const textMaxWidth = hasImage ? 590 : 1072;

    // 3. Title: bold crisp text
    ctx.font = hasImage
      ? "bold 38px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#f4f4f5";
    const titleMetrics = ctx.measureText(card.title);
    let titleY = 155;
    if (titleMetrics.width > textMaxWidth) {
      ctx.font = hasImage
        ? "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        : "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      titleY = wrapText(ctx, card.title, 64, 150, textMaxWidth, 38, 2);
    } else {
      ctx.fillText(card.title, 64, titleY);
      titleY += 12;
    }

    // 4. Hook: clean typography with line breaks / word wrap
    ctx.font = hasImage
      ? "italic 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Georgia, serif"
      : "italic 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Georgia, serif";
    ctx.fillStyle = "#a1a1aa";
    wrapText(ctx, `"${card.hook}"`, 64, titleY + 36, textMaxWidth, 30, hasImage ? 4 : 3);

    // 5. Draw Artwork Thumbnail if present
    if (hasImage && thumbnailImg) {
      const imgX = 696;
      const imgY = 135;
      const imgW = 440;
      const imgH = 250;

      // Draw rounded clipped thumbnail
      ctx.save();
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 10);
      ctx.clip();

      const iw = thumbnailImg.naturalWidth || thumbnailImg.width || 480;
      const ih = thumbnailImg.naturalHeight || thumbnailImg.height || 360;
      const scale = Math.max(imgW / iw, imgH / ih);
      const sw = imgW / scale;
      const sh = imgH / scale;
      const sx = (iw - sw) / 2;
      const sy = (ih - sh) / 2;
      ctx.drawImage(thumbnailImg, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
      ctx.restore();

      // Artwork border frame
      ctx.strokeStyle = "#383a45";
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 10);
      ctx.stroke();

      // Subtle badge pill in corner of artwork
      const badgeText = "▶ SOURCE TEASER";
      ctx.font = "bold 11px monospace";
      const badgeW = ctx.measureText(badgeText).width + 16;
      const badgeH = 22;
      const badgeX = imgX + imgW - badgeW - 12;
      const badgeY = imgY + imgH - badgeH - 12;
      ctx.fillStyle = "rgba(16, 17, 20, 0.88)";
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fill();
      ctx.strokeStyle = "#e59500";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.fillText(badgeText, badgeX + 8, badgeY + 15);
    }

    // 6. Metrics / Signal summary: Heat signal (would watch / interest) and Primary Pathway name
    const metricsY = 425;
    const boxWidth = 524;
    const boxHeight = 105;

    // Box 1: Heat signal / Audience pulse
    ctx.fillStyle = "#15171c";
    drawRoundedRect(ctx, 64, metricsY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.strokeStyle = "#272a33";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("AUDIENCE HEAT SIGNAL", 84, metricsY + 32);

    const wouldWatchCount = card.audiencePulse?.wouldWatch ?? 0;
    const followsCount = card.audiencePulse?.follows ?? 0;
    const heatText = wouldWatchCount > 0 || followsCount > 0
      ? `${wouldWatchCount} Watch Intents · ${followsCount} Followers`
      : "Active Community Scouting";

    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#fafafa";
    ctx.fillText(heatText, 84, metricsY + 68);

    // Box 2: Primary Pathway
    const box2X = 64 + boxWidth + 24;
    ctx.fillStyle = "#15171c";
    drawRoundedRect(ctx, box2X, metricsY, boxWidth, boxHeight, 8);
    ctx.fill();
    ctx.strokeStyle = "#272a33";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("PRIMARY PATHWAY", box2X + 20, metricsY + 32);

    const primaryPathway = card.pathways?.[0]?.label || "Independent Exploration";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#fafafa";

    // truncate if too long
    let pathwayText = primaryPathway;
    if (ctx.measureText(pathwayText).width > boxWidth - 40) {
      while (pathwayText.length > 0 && ctx.measureText(pathwayText + "...").width > boxWidth - 40) {
        pathwayText = pathwayText.slice(0, -1);
      }
      pathwayText += "...";
    }
    ctx.fillText(pathwayText, box2X + 20, metricsY + 68);

    // 7. Footer: "Discover and back independent screen storytelling at audiencetake.com"
    ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace";
    ctx.fillStyle = "#71717a";
    ctx.fillText("Discover and back independent screen storytelling at audiencetake.com", 64, 578);

    // Subtle creator attribution right footer
    if (card.creatorContext?.displayName) {
      const creatorAttribution = `Creator: ${card.creatorContext.displayName}`;
      const creatorWidth = ctx.measureText(creatorAttribution).width;
      ctx.fillText(creatorAttribution, 1200 - 64 - creatorWidth, 578);
    }
  }, [card]);

  useEffect(() => {
    if (isOpen) {
      const thumbUrl = getCardThumbnailUrl(card);
      if (thumbUrl && typeof window !== "undefined") {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = thumbUrl;
        img.onload = () => {
          imageRef.current = img;
          drawCard(img);
        };
        img.onerror = () => {
          imageRef.current = null;
          drawCard(null);
        };
      } else {
        drawCard(null);
      }
    }
  }, [isOpen, card, drawCard]);

  // Handle Escape key and backdrop close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const triggerDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${card.slug || "project"}-scout-card.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) {
            const url = canvas.toDataURL("image/png");
            triggerDownload(url);
            return;
          }
          const url = URL.createObjectURL(blob);
          triggerDownload(url);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      } else {
        const url = canvas.toDataURL("image/png");
        triggerDownload(url);
      }
    } catch (err) {
      console.warn("Canvas PNG export failed:", err);
    }
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (
        canvas.toBlob &&
        typeof ClipboardItem !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.write
      ) {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setCopyStatus("Could not create image blob");
            setTimeout(() => setCopyStatus(null), 3000);
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            setCopyStatus("Copied to clipboard!");
            setTimeout(() => setCopyStatus(null), 3000);
          } catch (e) {
            setCopyStatus("Failed to copy image to clipboard");
            setTimeout(() => setCopyStatus(null), 3000);
          }
        }, "image/png");
      } else {
        setCopyStatus("Clipboard image write not supported");
        setTimeout(() => setCopyStatus(null), 3000);
      }
    } catch (err) {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(null), 3000);
    }
  };

  return (
    <>
      <button
        type="button"
        className="trading-card-trigger"
        onClick={() => setIsOpen(true)}
      >
        Export Trading Card
      </button>

      {isOpen && (
        <div
          className="trading-card-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            ref={modalRef}
            className="trading-card-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Scout Trading Card Preview"
          >
            <div className="trading-card-header">
              <div className="trading-card-header-titles">
                <span className="trading-card-header-badge">COMMUNITY EXPORT</span>
                <h3 className="trading-card-title">Scout Trading Card Preview</h3>
              </div>
              <button
                type="button"
                className="trading-card-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                ✕ Close
              </button>
            </div>

            <div className="trading-card-preview-area">
              <canvas
                ref={canvasRef}
                width={1200}
                height={630}
                className="trading-card-canvas"
                aria-label={`${card.title} Trading Card Preview`}
              />
            </div>

            <div className="trading-card-footer">
              <p className="trading-card-hint">
                1200×630 PNG formatted for Discord embeds, Twitter/X, and social shares.
              </p>
              <div className="trading-card-actions">
                {copyStatus && (
                  <span className="trading-card-status" role="status">
                    {copyStatus}
                  </span>
                )}
                <button
                  type="button"
                  className="trading-card-btn trading-card-copy-btn"
                  onClick={handleCopyImage}
                >
                  Copy Image
                </button>
                <button
                  type="button"
                  className="trading-card-btn trading-card-download-btn"
                  onClick={handleDownload}
                >
                  Download PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
