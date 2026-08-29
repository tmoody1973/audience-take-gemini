export type ProjectLivingUpdateCitation = {
  url: string;
  title?: string;
};

export type ProjectLivingUpdate = {
  id: string;
  projectId: string;
  summary: string;
  eventDate: string | null;
  citations: ProjectLivingUpdateCitation[];
  confidence: string | null;
  detectedAt: string;
};

export type LivingUpdatesProps = {
  updates: ProjectLivingUpdate[];
};

export function LivingUpdates({ updates }: LivingUpdatesProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  return (
    <section className="living-updates" aria-labelledby="living-updates-title">
      <div className="living-updates-header">
        <div className="living-updates-badge">
          <span className="live-indicator" aria-hidden="true" />
          <span>Live Tracking</span>
        </div>
        <h2 id="living-updates-title">Living Updates</h2>
        <p className="living-updates-subtitle">
          Verified public announcements, press, and festival coverage detected since this project was scouted.
        </p>
      </div>

      <ol className="living-updates-list">
        {updates.map((update) => (
          <li key={update.id} className="living-update-item">
            <div className="update-meta">
              <span className="update-date">{update.eventDate || "Recent update"}</span>
              {update.confidence && (
                <span className="update-confidence" data-confidence={update.confidence}>
                  {update.confidence} confidence
                </span>
              )}
            </div>

            <p className="update-summary">{update.summary}</p>

            {update.citations && update.citations.length > 0 && (
              <ul className="update-citations" aria-label="Citations for this update">
                {update.citations.map((citation, citIndex) => (
                  <li key={`${citation.url}-${citIndex}`}>
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="update-citation-link"
                    >
                      {citation.title || new URL(citation.url).hostname}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
