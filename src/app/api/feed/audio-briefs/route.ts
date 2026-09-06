import { dataRepo } from "@/services/firestore-repo";
import type { Project, ScoutCard } from "@/domain";

export const dynamic = "force-dynamic";

interface FeedItemData {
  title: string;
  slug: string;
  guid: string;
  pubDate: string;
  description: string;
  audioId: string;
  summary: string;
  duration?: number;
}

const FALLBACK_ITEMS: FeedItemData[] = [
  {
    title: "Junichiro Jackson — Scout Briefing",
    slug: "junichiro-live-project",
    guid: "scout-brief-card-junichiro-v1-pro-g1",
    audioId: "card-junichiro-v1",
    pubDate: "Fri, 28 Aug 2026 10:15:00 GMT",
    description:
      "In a neon-drenched retro-future Chicago, an easygoing courier must clear his name when a mysterious cybernetic package makes him the target of three rival syndicates. High-octane anime action scored to original boom-bap and trap beats with authentic Chicago voice acting.",
    summary:
      "High-octane anime action scored to original boom-bap and trap beats with authentic Chicago voice acting.",
    duration: 180,
  },
  {
    title: "Signal in the Pines — Scout Briefing",
    slug: "signal-in-the-pines",
    guid: "scout-brief-card-signal-in-the-pines-v1-pro-g1",
    audioId: "card-signal-in-the-pines-v1",
    pubDate: "Mon, 31 Aug 2026 14:00:00 GMT",
    description:
      "Deep-woods atmospheric tension blending found-footage horror with serialized conspiracy drama following an isolated forest ranger intercepting encrypted transmissions.",
    summary:
      "Deep-woods atmospheric tension blending found-footage horror with serialized conspiracy drama.",
    duration: 180,
  },
];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatCdata(text: string): string {
  return `<![CDATA[${text.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function renderItemXml(item: FeedItemData): string {
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>https://audiencetake.com/projects/${escapeXml(item.slug)}</link>
      <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
      <pubDate>${escapeXml(item.pubDate)}</pubDate>
      <description>${formatCdata(item.description)}</description>
      <enclosure url="https://audiencetake.com/api/scout-briefs/${encodeURIComponent(item.audioId)}/audio" length="2500000" type="audio/mpeg"/>
      <itunes:duration>${item.duration ?? 180}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      <itunes:summary>${escapeXml(item.summary)}</itunes:summary>
    </item>`;
}

export async function GET(_request: Request): Promise<Response> {
  let projects: Project[] = [];
  try {
    projects = await dataRepo.getProjects();
  } catch (err) {
    console.warn("[PodcastFeed] Failed to load projects:", err);
  }

  const publishedProjects = projects.filter(
    (p) => p.publicationStatus === "published"
  );

  let items: FeedItemData[] = [];

  for (const project of publishedProjects) {
    const slug =
      (project as any).slug ||
      (project.id === "proj-junichiro"
        ? "junichiro-live-project"
        : project.id.replace(/^proj-/, ""));

    const cardVersionId =
      project.publishedCardId ||
      project.latestCardVersionId ||
      `card-${slug}-v1`;

    let card: ScoutCard | null = null;
    if (project.publishedCardId) {
      try {
        card = await dataRepo.getScoutCardById(project.publishedCardId);
      } catch {}
    }

    const hook =
      card?.decisionBrief?.coreHook ||
      card?.whyScouted ||
      project.identity.logline ||
      "Executive scout intelligence and audience analysis.";

    const description = project.identity.logline
      ? `${project.identity.title}: ${project.identity.logline}${card?.decisionBrief?.coreHook ? ` — ${card.decisionBrief.coreHook}` : ""}`
      : hook;

    const pubDate = new Date(
      project.updatedAt || project.createdAt || Date.now()
    ).toUTCString();

    items.push({
      title: `${project.identity.title} — Scout Briefing`,
      slug,
      guid: `scout-brief-${cardVersionId}-g1`,
      pubDate,
      description,
      audioId: cardVersionId,
      summary: hook,
      duration: 180,
    });
  }

  // Fallback if no projects exist in the database
  if (items.length === 0) {
    items = FALLBACK_ITEMS;
  }

  const itemsXml = items.map(renderItemXml).join("\n");
  const buildDate = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Audience Take Radio</title>
    <link>https://audiencetake.com</link>
    <description>Daily 3-minute executive audio briefings and scout analyses on breakout creative projects, independent film, animation, and emerging IP.</description>
    <language>en-us</language>
    <atom:link href="https://audiencetake.com/api/feed/audio-briefs" rel="self" type="application/rss+xml"/>
    <itunes:image href="https://audiencetake.com/podcast-cover.png"/>
    <itunes:category text="Arts">
      <itunes:category text="Performing Arts"/>
    </itunes:category>
    <itunes:category text="TV &amp; Film"/>
    <itunes:author>Audience Take</itunes:author>
    <itunes:summary>Daily 3-minute executive audio briefings and scout analyses on breakout creative projects, independent film, animation, and emerging IP.</itunes:summary>
    <itunes:explicit>false</itunes:explicit>
    <itunes:owner>
      <itunes:name>Audience Take</itunes:name>
      <itunes:email>radio@audiencetake.com</itunes:email>
    </itunes:owner>
    <lastBuildDate>${buildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
