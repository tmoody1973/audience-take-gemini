const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    let candidate: string | null = null;

    if (hostname === "youtu.be") candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"].includes(hostname)) {
      candidate = url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] ?? null;
    }

    return candidate && YOUTUBE_VIDEO_ID.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function privacyEnhancedYouTubeEmbed(value: string): string | null {
  const videoId = youtubeVideoId(value);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}

export type YouTubeMetadata = {
  title: string;
  authorName: string;
  authorUrl: string;
  thumbnailUrl?: string;
  videoId: string;
};

export async function fetchYouTubeMetadata(value: string): Promise<YouTubeMetadata | null> {
  const videoId = youtubeVideoId(value);
  if (!videoId) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
    };
    return {
      title: typeof data.title === "string" ? data.title : "",
      authorName: typeof data.author_name === "string" ? data.author_name : "",
      authorUrl: typeof data.author_url === "string" ? data.author_url : "",
      thumbnailUrl: typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
      videoId,
    };
  } catch {
    return null;
  }
}

