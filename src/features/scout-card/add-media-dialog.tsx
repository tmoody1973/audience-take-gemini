"use client";

import React, { useState } from "react";

export function AddMediaDialog({
  projectId,
  onMediaAdded,
}: {
  projectId: string;
  onMediaAdded?: (newMedia: { title: string; url: string; assetType: string }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<"devlog" | "pilot" | "lore_short" | "pitch">("devlog");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsSubmitting(true);
    setStatusMsg("Validating URL and extracting YouTube metadata...");

    try {
      const res = await fetch(`/api/projects/${projectId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, assetType }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg("✓ Media successfully added to project dossier!");
        if (onMediaAdded) {
          onMediaAdded({ title: data.title || title || "New Media Asset", url, assetType });
        }
        setTimeout(() => {
          setIsOpen(false);
          setStatusMsg(null);
          setUrl("");
          setTitle("");
          window.location.reload();
        }, 1200);
      } else {
        setStatusMsg(`Error: ${data.message || "Failed to add media asset"}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err?.message || "Network error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-media-container">
      <button
        type="button"
        className="add-media-trigger-btn"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        + Suggest a source
      </button>

      {isOpen && (
        <div className="add-media-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="add-media-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-media-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="add-media-header">
              <h3 id="add-media-title">Suggest a Project Source</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="add-media-desc">
              Suggest a verified video or primary source URL to support this project&apos;s dossier. 
              Community source submissions enter review and will not alter the published Scout Card until approved.
            </p>

            <form onSubmit={handleSubmit} className="add-media-form">
              <div className="form-group">
                <label htmlFor="media-url">YouTube Video URL *</label>
                <input
                  id="media-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="asset-type">Asset Classification *</label>
                <select
                  id="asset-type"
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                >
                  <option value="devlog">Production Devlog / Behind-the-Scenes</option>
                  <option value="pilot">Official Pilot / Teaser</option>
                  <option value="lore_short">Lore Origin / Backstory Short</option>
                  <option value="pitch">Crowdfunding / Kickstarter Pitch</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="media-title">Custom Title (Optional — auto-fetched if blank)</label>
                <input
                  id="media-title"
                  type="text"
                  placeholder="e.g., Voice Cast Recording & Storyboard Animatic"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {statusMsg && <div className="add-media-status">{statusMsg}</div>}

              <div className="add-media-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting || !url}
                >
                  {isSubmitting ? "Adding..." : "Add to Living Dossier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
