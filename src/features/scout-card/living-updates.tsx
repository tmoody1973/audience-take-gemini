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
  category?: "funding" | "festival" | "production" | "press" | "community";
};

export type MonitorHealth = {
  status: "active" | "pending" | "disabled" | "unmonitored";
  lastSuccessfulResearchAt?: string | null;
  lastCheckedAt?: string | null;
};

export type LivingUpdatesProps = {
  updates: ProjectLivingUpdate[];
  monitorHealth?: MonitorHealth;
};

export function LivingUpdates({ updates, monitorHealth }: LivingUpdatesProps) {
  if (!updates || updates.length === 0) {
    return null;
  }

  const isLive = monitorHealth?.status === "active";
  const isDisabled = monitorHealth?.status === "disabled";
  const isPending = monitorHealth?.status === "pending";

  return (
    <section className="living-updates" aria-labelledby="living-updates-title">
      <div className="living-updates-header">
        <div className={`living-updates-badge${isDisabled ? " paused" : ""}`}>
          {isLive ? (
            <>
              <span className="live-indicator active" aria-hidden="true" />
              <span>Active Monitoring</span>
            </>
          ) : isDisabled ? (
            <>
              <span className="live-indicator disabled" aria-hidden="true" />
              <span>Recorded Updates (Monitoring paused)</span>
            </>
          ) : isPending ? (
            <>
              <span className="live-indicator pending" aria-hidden="true" />
              <span>Monitoring Pending</span>
            </>
          ) : (
            <span>Recorded Updates</span>
          )}
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
              {update.category && (
                <span className="update-category-pill" data-category={update.category}>
                  {update.category}
                </span>
              )}
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
