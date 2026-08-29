import type { SourceLedgerEntry } from "./types";

export function extractSourcePublisher(source: { title?: string; url?: string }): string {
  const url = source.url || "";
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("kickstarter.com")) return "Kickstarter";
    if (hostname.includes("indiegogo.com")) return "Indiegogo";
    if (hostname.includes("animationmagazine.net")) return "Animation Magazine";
    if (hostname.includes("c21media.net")) return "C21Media";
    if (hostname.includes("variety.com")) return "Variety";
    if (hostname.includes("deadline.com")) return "Deadline";
    if (hostname.includes("hollywoodreporter.com")) return "The Hollywood Reporter";
    if (hostname.includes("wikipedia.org") || hostname.includes("grokipedia.org")) return "Wikipedia";
    if (hostname.includes("patreon.com")) return "Patreon";
    if (hostname.includes("vimeo.com")) return "Vimeo";
    if (hostname.includes("cartoonbrew.com")) return "Cartoon Brew";
    if (hostname.includes("kidscreen.com")) return "Kidscreen";
    if (hostname.includes("screendaily.com")) return "Screen Daily";
    if (hostname.includes("catsuka.com")) return "Catsuka";
    if (hostname.includes("imdb.com")) return "IMDb";
    if (hostname.includes("rottentomatoes.com")) return "Rotten Tomatoes";
    if (hostname.includes("letterboxd.com")) return "Letterboxd";
    if (hostname.includes("instagram.com")) return "Instagram";
    if (hostname.includes("tiktok.com")) return "TikTok";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "X";

    const namePart = hostname.split(".")[0];
    if (namePart && namePart.length > 2) {
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    }
  } catch {
    // fallback
  }

  if (source.title) {
    if (source.title.length <= 20) return source.title;
    const parts = source.title.split(/[:|–—-]/);
    if (parts[0] && parts[0].trim().length <= 20) return parts[0].trim();
  }
  return "Source";
}

export function createCitationLabels(sources: SourceLedgerEntry[]) {
  const labels = new Map<string, string>();
  sources.forEach((source, index) => {
    const publisher = extractSourcePublisher(source);
    labels.set(source.id, `S${index + 1} · ${publisher}`);
  });
  return labels;
}

export function citationText(ids: string[], labels: Map<string, string>): string {
  const citations = ids.map((id) => labels.get(id)).filter((label): label is string => Boolean(label));
  return citations.length ? citations.map((label) => `[${label}]`).join(" ") : "No cited source";
}
