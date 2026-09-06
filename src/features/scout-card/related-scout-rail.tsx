import React from "react";
import Link from "next/link";

export type RelatedScoutProject = {
  slug: string;
  title: string;
  hook: string;
  projectType: string;
  sharedThemes: string[];
  thumbnailUrl?: string;
};

export function RelatedScoutRail({
  related,
}: {
  related?: RelatedScoutProject[];
}) {
  if (!related || related.length === 0) {
    return null;
  }

  return (
    <section
      className="related-scout-rail"
      aria-labelledby="related-scout-title"
    >
      <div className="section-heading-line">
        <div>
          <span className="route-label">Storyworld DNA</span>
          <h2 id="related-scout-title">Similar Storyworld DNA</h2>
        </div>
        <span className="related-scout-subtitle">
          Projects exploring connected themes, tone, and narrative universes
        </span>
      </div>

      <div className="related-scout-grid">
        {related.map((item) => (
          <Link
            key={item.slug}
            href={`/projects/${item.slug}`}
            className="related-scout-card"
          >
            {item.thumbnailUrl ? (
              <div className="related-scout-thumb-container">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="related-scout-thumb"
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="related-scout-card-body">
              <div className="related-scout-card-header">
                <span className="related-scout-badge">
                  {item.projectType.replace(/_/g, " ")}
                </span>
              </div>
              <h3 className="related-scout-card-title">{item.title}</h3>
              <p className="related-scout-card-hook">{item.hook}</p>
              {item.sharedThemes && item.sharedThemes.length > 0 ? (
                <div className="related-scout-themes" aria-label="Shared themes">
                  {item.sharedThemes.map((theme, i) => (
                    <span key={i} className="related-scout-theme-tag">
                      {theme}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
