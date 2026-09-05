/* Hallmark · post-browser critique: P5 H5 E4 S5 R5 V5 */
/* Hallmark · component: Trailer Critic disclosure · genre: editorial · theme: Audience Take / Public Scouting Program
 * states: default · hover · focus · active · disabled · loading · error · success
 * contrast: pass; locked project ink/paper and accent pairs
 */

import { citationText } from "./citation-labels";
import type { TrailerCriticAnalysis } from "./types";

export type TrailerCriticState =
  | "default"
  | "hover"
  | "focus"
  | "active"
  | "disabled"
  | "loading"
  | "error"
  | "success";

type TrailerCriticProps = {
  analyses: TrailerCriticAnalysis[];
  sourceLabels: Map<string, string>;
  idPrefix?: string;
  previewState?: TrailerCriticState;
};

const stateMessages: Partial<Record<TrailerCriticState, string>> = {
  loading: "Loading critique",
  error: "Analysis unavailable",
  success: "Analysis ready",
};

function formatDate(value: string | undefined | null): string {
  if (!value) return "Recently analyzed";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Recently analyzed";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
    }).format(d);
  } catch {
    return "Recently analyzed";
  }
}

function SourceMarks({ sourceIds, labels }: { sourceIds: string[]; labels: Map<string, string> }) {
  if (!sourceIds || sourceIds.length === 0) return null;
  const visible = sourceIds.slice(0, 3);
  return (
    <span className="citation-marks-group" aria-label={`Citations ${citationText(sourceIds, labels)}`}>
      {visible.map((id) => {
        const label = labels.get(id) || "[S]";
        const cleanId = `source-${id.replace(/^source-/, "")}`;
        return (
          <a
            key={id}
            href={`#${cleanId}`}
            className="citation-badge"
            title={`View source ${label}`}
          >
            {label}
          </a>
        );
      })}
      {sourceIds.length > 3 ? (
        <a
          href="#evidence-title"
          className="citation-badge-overflow"
          title={`${sourceIds.length - 3} more sources in source ledger`}
        >
          +{sourceIds.length - 3}
        </a>
      ) : null}
    </span>
  );
}

function compact(value: string, limit = 132): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= limit) return normalized;
  const bounded = normalized.slice(0, limit + 1).replace(/\s+\S*$/, "");
  return `${bounded || normalized.slice(0, limit)}…`;
}

function matrixValue(analysis: TrailerCriticAnalysis, category: TrailerCriticAnalysis["matrix"][number]["category"]): string {
  return analysis.matrix.find((row) => row.category === category)?.analysis ?? "Not stated in this analysis.";
}

function ScanItem({ label, value }: { label: string; value: string }) {
  return <span className="trailer-critic-scan-item"><small>{label}</small><strong>{compact(value)}</strong></span>;
}

export function TrailerCritic({
  analyses,
  sourceLabels,
  idPrefix = "trailer-critic",
  previewState = "default",
}: TrailerCriticProps) {
  if (!analyses.length) return null;
  const stateMessage = stateMessages[previewState];

  return (
    <section className="trailer-critic" aria-labelledby={`${idPrefix}-title`} data-state={previewState}>
      <header className="section-heading-line trailer-critic-heading">
        <div>
          <span>Creative notes · Sampled audiovisual reading</span>
          <h2 id={`${idPrefix}-title`}>Creative notes</h2>
          <p className="trailer-critic-disclaimer">
            Descriptive AI interpretation of sampled audiovisual pacing, craft, and tone. This is an editorial observation and not a frame-perfect technical audit or commercial judgment.
          </p>
        </div>
        <strong>{analyses.length} {analyses.length === 1 ? "video" : "videos"} analyzed</strong>
      </header>

      <div className="trailer-critic-list">
        {analyses.map((analysis, analysisIndex) => {
          const disabled = previewState === "disabled";
          const previewClass = ["hover", "focus", "active"].includes(previewState)
            ? `is-${previewState}`
            : undefined;
          return (
            <details
              key={analysis.artifactId}
              className={`trailer-critic-artifact${previewClass ? ` ${previewClass}` : ""}`}
              data-state={previewState}
              aria-busy={previewState === "loading" || undefined}
            >
              <summary aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : undefined}>
                <span className="trailer-critic-number">{String(analysisIndex + 1).padStart(2, "0")}</span>
                <span className="trailer-critic-summary-copy">
                  <span className="trailer-critic-summary-kicker">Critic read / source video</span>
                  <span className="trailer-critic-scan">
                    <ScanItem label="Genre" value={matrixValue(analysis, "genre")} />
                    <ScanItem label="Form" value={analysis.structuralNarrative.trailerType} />
                    <ScanItem label="Why it may connect" value={analysis.marketingPersuasion.uniqueSellingProposition || analysis.emotionalRhetorical.emotionalHook} />
                  </span>
                </span>
                <span className="trailer-critic-toggle" aria-hidden="true">
                  <span className="trailer-critic-toggle-open">Show full analysis</span>
                  <span className="trailer-critic-toggle-close">Close analysis</span>
                  <b>+</b>
                </span>
                {stateMessage ? <span className="trailer-critic-state-label" role="status">{stateMessage}</span> : null}
              </summary>

              <div className="trailer-critic-body">
                <div className="trailer-critic-meta">
                  <span>Source video {String(analysisIndex + 1).padStart(2, "0")}</span>
                  <a href={analysis.youtubeUrl} target="_blank" rel="noreferrer">Open analyzed video</a>
                  <small>Model {analysis.modelId} / version {analysis.analysisVersion} / {formatDate(analysis.analyzedAt)}</small>
                </div>

                <div className="trailer-critic-grid">
                  <section className="trailer-critic-structure">
                    <h3>Structural &amp; narrative timeline</h3>
                    <dl className="trailer-critic-facts-horizontal">
                      <div><dt>Genre signaling</dt><dd>{analysis.structuralNarrative.genreSignaling}</dd></div>
                      <div><dt>Trailer format</dt><dd>{analysis.structuralNarrative.trailerType}</dd></div>
                      <div className="trailer-narrative-summary"><dt>Narrative delivery</dt><dd>{analysis.structuralNarrative.narrativeDelivery}</dd></div>
                    </dl>
                    <div className="trailer-beats-wrap">
                      <span className="trailer-beats-kicker">Timestamped narrative beats</span>
                      {analysis.structuralNarrative.beats.length > 0 ? (
                        <ol className="trailer-beats">
                          {analysis.structuralNarrative.beats.map((beat) => (
                            <li key={`${beat.start}-${beat.end}-${beat.label}`}>
                              <span>{beat.start}–{beat.end}</span>
                              <div><strong>{beat.label}</strong><p>{beat.observation}</p><small>{beat.modality}</small></div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="trailer-beats-empty" style={{ padding: "0.75rem 0", color: "var(--ink-subtle, #737373)", fontStyle: "italic", fontSize: "0.875rem" }}>
                          No audiovisual timestamped beats available for this media source.
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="trailer-critic-craft">
                    <h3>Technical craft</h3>
                    <dl className="trailer-critic-craft-grid">
                      <div><dt>Editing &amp; pace</dt><dd>{analysis.technicalCraft.editingAndPace}</dd></div>
                      <div><dt>Cinematography</dt><dd>{analysis.technicalCraft.cinematographyAndFraming}</dd></div>
                      <div><dt>Sound &amp; score</dt><dd>{analysis.technicalCraft.soundAndScore}</dd></div>
                      <div><dt>Graphics &amp; titles</dt><dd>{analysis.technicalCraft.graphicsAndTitles}</dd></div>
                    </dl>
                  </section>

                  <section className="trailer-critic-emotion">
                    <h3>Emotional &amp; rhetorical arc</h3>
                    <dl className="trailer-critic-emotion-grid">
                      <div><dt>Emotional hook</dt><dd>{analysis.emotionalRhetorical.emotionalHook}</dd></div>
                      <div><dt>Tone &amp; mood</dt><dd>{analysis.emotionalRhetorical.toneAndMoodBalance}</dd></div>
                      <div><dt>Persuasive argument</dt><dd>{analysis.emotionalRhetorical.persuasiveArgument}</dd></div>
                    </dl>
                  </section>

                  <section className="trailer-critic-marketing">
                    <h3>Marketing, audience &amp; positioning</h3>
                    <dl className="trailer-critic-marketing-grid">
                      <div><dt>Unique Selling Proposition</dt><dd>{analysis.marketingPersuasion.uniqueSellingProposition}</dd></div>
                      <div><dt>Audience hypothesis</dt><dd>{analysis.marketingPersuasion.targetAudienceHypothesis}</dd></div>
                      <div><dt>Concept vs. star</dt><dd>{analysis.marketingPersuasion.conceptVsStarEmphasis}</dd></div>
                      <div><dt>Representation caveat</dt><dd>{analysis.marketingPersuasion.representationCaveat}</dd></div>
                    </dl>
                  </section>
                </div>

                <section className="critic-matrix" aria-labelledby={`${idPrefix}-${analysisIndex}-matrix-title`}>
                  <h3 id={`${idPrefix}-${analysisIndex}-matrix-title`}>Critic&apos;s breakdown matrix</h3>
                  <dl>{analysis.matrix.map((row) => <div key={row.category}><dt>{row.category.replaceAll("_", " / ")}</dt><dd>{row.analysis}</dd></div>)}</dl>
                </section>

                <footer>
                  <div><strong>Analysis limits</strong><ul>{analysis.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul></div>
                  {analysis.sourceIds.length
                    ? <p>Public context citations <SourceMarks sourceIds={analysis.sourceIds} labels={sourceLabels} /></p>
                    : <p>Audiovisual observations are grounded by timestamps; no additional card facts were imported.</p>}
                </footer>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
