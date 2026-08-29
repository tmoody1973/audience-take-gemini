import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeVideoDetails } from "@/lib/media/youtube-api";
import { dataRepo } from "@/services/firestore-repo";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { youtubeVideoId } from "@/lib/media/youtube";

export async function handleProjectMediaPost(
  request: NextRequest,
  projectId: string
) {
  try {
    const body = await request.json();
    const { url, title: customTitle, assetType } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, message: "A valid video URL is required." }, { status: 400 });
    }

    const videoId = youtubeVideoId(url);
    if (!videoId) {
      return NextResponse.json({ success: false, message: "Please provide a valid YouTube video URL." }, { status: 400 });
    }

    // Extract real YouTube details
    const ytDetails = await fetchYouTubeVideoDetails(videoId);
    const resolvedTitle = customTitle || ytDetails?.title || `YouTube Video (${videoId})`;

    // Append to dynamic repo
    const project = await dataRepo.getProjectById(projectId);
    if (project) {
      const card = await dataRepo.getScoutCardById(project.publishedCardId || `card-${projectId}-v1`);
      if (card) {
        card.sourceMedia = card.sourceMedia || [];
        card.sourceMedia.push({
          url,
          type: "youtube_embed",
          verified: true,
          caption: resolvedTitle,
        });
        await dataRepo.publishScoutCard(card);
      }
    }

    // Also attempt Firestore update if database is connected
    try {
      const db = getAdminFirestore();
      if (db) {
        const projectRef = db.collection("projects").doc(projectId);
        const doc = await projectRef.get();
        if (doc.exists) {
          const cardId = doc.data()?.latestCardVersionId;
          if (cardId) {
            const cardRef = db.collection("scoutCards").doc(cardId);
            const cardDoc = await cardRef.get();
            if (cardDoc.exists) {
              const currentLedger = cardDoc.data()?.sourceLedger || [];
              currentLedger.push({
                id: `source-media-${Date.now()}`,
                origin: "submitted",
                title: resolvedTitle,
                url,
                publishedAt: ytDetails?.publishedAt || new Date().toISOString(),
                retrievedAt: new Date().toISOString(),
                availability: "available",
                verificationStatus: "verified",
                supportsClaimIds: [],
                externalCommentary: false,
              });
              await cardRef.update({ sourceLedger: currentLedger });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Firestore update skipped or fallback used:", e);
    }

    return NextResponse.json({
      success: true,
      title: resolvedTitle,
      url,
      assetType: assetType || "devlog",
      views: ytDetails?.viewCount || 0,
      likes: ytDetails?.likeCount || 0,
    });
  } catch (error: any) {
    console.error("Error adding project media:", error);
    return NextResponse.json({ success: false, message: error?.message || "Internal server error" }, { status: 500 });
  }
}
