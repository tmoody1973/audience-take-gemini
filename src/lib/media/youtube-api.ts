export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  tags: string[];
}

export interface YouTubeCommentItem {
  id: string;
  authorName: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  replyCount: number;
}

export async function fetchYouTubeVideoDetails(
  videoId: string,
  apiKey: string = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
): Promise<YouTubeVideoDetails | null> {
  if (!videoId) return null;

  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const item = data.items?.[0];
        if (item) {
          return {
            videoId,
            title: item.snippet?.title || "",
            description: item.snippet?.description || "",
            channelTitle: item.snippet?.channelTitle || "",
            viewCount: parseInt(item.statistics?.viewCount || "0", 10),
            likeCount: parseInt(item.statistics?.likeCount || "0", 10),
            commentCount: parseInt(item.statistics?.commentCount || "0", 10),
            publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
            tags: item.snippet?.tags || [],
          };
        }
      }
    } catch (err) {
      console.warn("YouTube API video details fetch failed:", err);
    }
  }

  return null;
}

export interface YouTubeCommentsOutcome {
  status: "available" | "unavailable" | "disabled" | "failed";
  comments: YouTubeCommentItem[];
  reason?: string;
  totalRetrieved: number;
}

export async function fetchYouTubeCommentsStructured(
  videoId: string,
  maxResults: number = 50,
  apiKey: string = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
): Promise<YouTubeCommentsOutcome> {
  if (!videoId) {
    return { status: "unavailable", comments: [], reason: "No video ID provided", totalRetrieved: 0 };
  }
  if (!apiKey) {
    return { status: "unavailable", comments: [], reason: "No YouTube API key configured", totalRetrieved: 0 };
  }
  try {
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=${Math.min(100, maxResults)}&order=relevance&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 403) {
        return { status: "disabled", comments: [], reason: "Comments disabled or restricted on this video", totalRetrieved: 0 };
      }
      return { status: "failed", comments: [], reason: `YouTube API returned status ${res.status}`, totalRetrieved: 0 };
    }
    const data = await res.json();
    if (Array.isArray(data.items)) {
      const comments: YouTubeCommentItem[] = data.items.map((item: any) => {
        const top = item.snippet?.topLevelComment?.snippet;
        return {
          id: item.id || String(Math.random()),
          authorName: top?.authorDisplayName || "Viewer",
          text: top?.textDisplay || top?.textOriginal || "",
          likeCount: parseInt(top?.likeCount || "0", 10),
          publishedAt: top?.publishedAt || new Date().toISOString(),
          replyCount: parseInt(item.snippet?.totalReplyCount || "0", 10),
        };
      });
      return {
        status: comments.length > 0 ? "available" : "unavailable",
        comments,
        totalRetrieved: comments.length,
      };
    }
    return { status: "unavailable", comments: [], reason: "No comment threads returned", totalRetrieved: 0 };
  } catch (err: unknown) {
    return { status: "failed", comments: [], reason: err instanceof Error ? err.message : "Network error", totalRetrieved: 0 };
  }
}

export async function fetchYouTubeTopComments(
  videoId: string,
  maxResults: number = 50,
  apiKey: string = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ""
): Promise<YouTubeCommentItem[]> {
  const result = await fetchYouTubeCommentsStructured(videoId, maxResults, apiKey);
  return result.comments;
}
