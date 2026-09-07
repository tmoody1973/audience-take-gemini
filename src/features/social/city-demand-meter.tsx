"use client";

import React from "react";

export type CityDemandMeterProps = {
  cities?: Record<string, number>;
  threshold?: number;
  outreachActive?: boolean;
};

export function CityDemandMeter({
  cities = {},
  threshold = 100,
  outreachActive = false,
}: CityDemandMeterProps) {
  const cityEntries = Object.entries(cities)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="city-demand-meter" aria-labelledby="city-demand-title">
      <div className="city-demand-header">
        <h4 id="city-demand-title">Community Screening Demand</h4>
        <p className="city-demand-subtitle">
          Indie screening threshold: {threshold} signals to activate local cinema partner outreach.
        </p>
      </div>

      {cityEntries.length === 0 ? (
        <p className="city-demand-empty">
          No city signals recorded yet. Enter your city above to help activate a local screening!
        </p>
      ) : (
        <div className="city-demand-list">
          {cityEntries.slice(0, 5).map(([city, count]) => {
            const percent = Math.min(100, Math.round((count / threshold) * 100));
            const reached = count >= threshold;
            const remaining = threshold - count;

            return (
              <div key={city} className="city-demand-item">
                <div className="city-demand-item-header">
                  <span className="city-name">{city}</span>
                  <span className="city-signals-count">{count} / {threshold} signals</span>
                </div>

                <div
                  className="city-progress-bar"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${city} screening progress`}
                >
                  <div
                    className={`city-progress-fill ${reached ? "city-progress-reached" : ""}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="city-demand-footer">
                  {reached ? (
                    <span className={`threshold-reached-badge${outreachActive ? " active" : ""}`}>
                      {outreachActive
                        ? "✓ Threshold reached — Partner outreach in progress"
                        : "✓ Threshold reached — Community interest goal met"}
                    </span>
                  ) : (
                    <span className="signals-needed-label">
                      {remaining} more needed to activate
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
