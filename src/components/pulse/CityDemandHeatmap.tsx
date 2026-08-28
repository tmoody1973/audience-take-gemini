"use client";

import React, { useState } from "react";
import { MapPin, Plus, Download, Globe, CheckCircle2, ChevronRight, TrendingUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

interface CityDemandHeatmapProps {
  projectId: string;
  projectTitle: string;
  cities: Record<string, number>;
  onAddCity: (city: string) => void;
  userCity?: string | null;
}

const POPULAR_METROS = [
  "Seattle",
  "Portland",
  "Austin",
  "Chicago",
  "New York",
  "Los Angeles",
  "Atlanta",
  "Milwaukee",
  "Minneapolis",
  "San Francisco",
  "Toronto",
  "London"
];

export function CityDemandHeatmap({
  projectId,
  projectTitle,
  cities = {},
  onAddCity,
  userCity
}: CityDemandHeatmapProps) {
  const [customCity, setCustomCity] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const cityEntries = Object.entries(cities).sort((a, b) => b[1] - a[1]);
  const totalPledges = cityEntries.reduce((acc, [, count]) => acc + count, 0);
  const maxPledges = cityEntries.length > 0 ? Math.max(...cityEntries.map(([, c]) => c)) : 1;

  const handleCitySubmit = (cityToSubmit: string) => {
    const trimmed = cityToSubmit.trim();
    if (!trimmed) return;
    onAddCity(trimmed);
    setCustomCity("");
    setIsAdding(false);
    setNotification(`Theatrical screening demand pledged for ${trimmed}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const exportTerritoryBrief = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["City / Metro,Pledged Theatrical Demand,Share of Total", ...cityEntries.map(([c, count]) => `"${c}",${count},${((count / (totalPledges || 1)) * 100).toFixed(1)}%`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${projectTitle.toLowerCase().replace(/\s+/g, "-")}-theatrical-demand-brief.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="border-3 border-ink bg-paper p-6 space-y-6 shadow-selected-lift">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-dashed border-ink/30 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-headline text-3xl uppercase text-ink">
              THEATRICAL SCREENING DEMAND
            </h4>
            <Badge variant="yellow">{totalPledges} PLEDGES</Badge>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink uppercase mt-0.5">
            Geographic density of audience commitments to buy in-person cinema tickets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cityEntries.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportTerritoryBrief}
              className="text-xs font-mono gap-1.5"
              title="Download CSV for distributor pitch"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TERRITORY BRIEF</span>
            </Button>
          )}
          <Button
            variant={userCity ? "outline" : "primary"}
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="text-xs font-mono gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{userCity ? `PLEDGED (${userCity})` : "+ REQUEST YOUR CITY"}</span>
          </Button>
        </div>
      </div>

      {/* Inline City Addition Drawer */}
      {isAdding && (
        <div className="p-4 bg-field-paper border-2 border-ink space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-extrabold uppercase text-ink">
              SELECT OR ENTER YOUR METRO AREA:
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs font-mono font-bold text-muted-ink hover:text-ink"
            >
              CANCEL
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_METROS.map((metro) => (
              <button
                key={metro}
                type="button"
                onClick={() => handleCitySubmit(metro)}
                className={`text-xs font-mono font-bold uppercase px-2.5 py-1 border border-ink transition-colors ${
                  userCity === metro
                    ? "bg-electric-blue text-white"
                    : "bg-paper hover:bg-acid-yellow text-ink"
                }`}
              >
                {metro}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Or enter city name (e.g. Madison, WI)"
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCitySubmit(customCity)}
              className="flex-1 px-3 py-1.5 border-2 border-ink bg-white font-mono text-xs text-ink focus:outline-none"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCitySubmit(customCity)}
              disabled={!customCity.trim()}
              className="text-xs font-mono"
            >
              SUBMIT
            </Button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {notification && (
        <div className="p-3 bg-evidence-mint border-2 border-ink flex items-center gap-2 text-xs font-mono font-bold text-ink animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-electric-blue flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* City Demand Breakdown Bars */}
      {cityEntries.length > 0 ? (
        <div className="space-y-3">
          {cityEntries.map(([city, count], idx) => {
            const pct = Math.round((count / maxPledges) * 100);
            const isUserSelection = userCity === city;

            return (
              <div key={city} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-muted-ink w-5 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-extrabold text-ink uppercase flex items-center gap-1.5">
                      {city}
                      {isUserSelection && (
                        <span className="px-1.5 py-0.2 bg-acid-yellow text-[10px] border border-ink">
                          YOUR PLEDGE
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="font-extrabold text-ink">
                    {count} {count === 1 ? "pledge" : "pledges"} ({Math.round((count / totalPledges) * 100)}%)
                  </span>
                </div>

                {/* Demand Bar */}
                <div className="h-4 w-full bg-field-paper border-2 border-ink p-0.5 overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      idx === 0
                        ? "bg-signal-coral"
                        : idx === 1
                        ? "bg-acid-yellow"
                        : "bg-electric-blue"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 bg-field-paper border-2 border-ink text-center space-y-2">
          <Globe className="w-8 h-8 text-muted-ink mx-auto" />
          <p className="font-mono text-xs font-bold text-ink uppercase">
            NO THEATRICAL DEMAND PLEDGED YET
          </p>
          <p className="text-xs text-muted-ink font-serif max-w-sm mx-auto">
            Be the first to request an independent cinema screening in your city to signal theatrical viability.
          </p>
        </div>
      )}

      {/* Distributor Footnote */}
      <div className="flex items-center justify-between pt-2 border-t border-ink/20 text-[11px] font-mono font-bold text-muted-ink">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-signal-coral" />
          DEMAND DATA RECORDED ANONYMOUSLY & IMMUTABLY
        </span>
        <span className="uppercase text-ink">FOR THEATRICAL BOOKERS & DISTRIBUTORS</span>
      </div>
    </div>
  );
}
