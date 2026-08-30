"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";

import { getClientAuth } from "@/lib/firebase/client";
import { hasFirebaseClientConfig } from "@/lib/firebase/config";
import type { UserNominationItem } from "../api/user/nominations/handler";

// Sample fixture data for demo / guest scout mode
const DEMO_NOMINATIONS: UserNominationItem[] = [
  {
    id: "demo-nom-1",
    projectId: "proj-junichiro-live",
    projectTitle: "Junichiro Jackson (JJ)",
    projectSlug: "junichiro-live-project",
    submittedUrl: "https://www.youtube.com/watch?v=M2djoKmnOTY",
    mediaUrl: "https://www.youtube.com/watch?v=M2djoKmnOTY",
    submissionType: "fan",
    whyItShouldGrow:
      "A visionary blend of occult afro-surrealism, 90s boom-bap rhythm, and kinetic 2D animation set in near-future Brooklyn. Has massive breakout fandom potential.",
    suggestedFormat: "Serialized Adult Animated Series",
    audienceFit: "Adult Swim & Prime Video adult animation viewers, hip-hop culture fans",
    supportingUrls: [
      "https://www.animationmagazine.net/2026/08/teamto-junichiro-jackson/",
      "https://www.tiktok.com/@junichirojackson/video/73910294821",
    ],
    status: "published",
    runId: "run-junichiro-1",
    currentStage: 6,
    researchUrl: "/research/run-junichiro-1",
    cardUrl: "/projects/junichiro-live-project",
    createdAt: "2026-08-26T14:30:00Z",
    updatedAt: "2026-08-28T18:00:00Z",
  },
  {
    id: "demo-nom-2",
    projectId: "proj-signal-pines",
    projectTitle: "Signal in the Pines",
    projectSlug: "signal-in-the-pines",
    submittedUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
    mediaUrl: "https://www.youtube.com/watch?v=s8G7425lfKs",
    submissionType: "creator",
    whyItShouldGrow:
      "Tactile 16mm folk horror with live-recorded binaural sound design in the Pacific Northwest. Authentic regional storytelling with strong festival appeal.",
    suggestedFormat: "Micro-Budget Feature Film",
    audienceFit: "A24 / Neon indie horror cinephiles and festival audiences",
    supportingUrls: ["https://kickstarter.com/projects/signal-pines/short-film"],
    status: "in_progress",
    runId: "run-signal-pines-1",
    currentStage: 4,
    researchUrl: "/research/run-signal-pines-1",
    cardUrl: "/projects/signal-in-the-pines",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function MyNominationsClient() {
  const firebaseConfigured = hasFirebaseClientConfig();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);
  const [nominations, setNominations] = useState<UserNominationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "published" | "withdrawn">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingNomination, setEditingNomination] = useState<UserNominationItem | null>(null);
  const [editWhy, setEditWhy] = useState("");
  const [editFormat, setEditFormat] = useState("");
  const [editAudience, setEditAudience] = useState("");
  const [editSupporting, setEditSupporting] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Withdraw Modal State
  const [withdrawingNomination, setWithdrawingNomination] = useState<UserNominationItem | null>(null);
  const [withdrawingBusy, setWithdrawingBusy] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(
      getClientAuth(),
      (currentUser) => {
        setUser(currentUser);
        setAuthReady(true);
      },
      () => {
        setUser(null);
        setAuthReady(true);
      },
    );
  }, [firebaseConfigured]);

  // Load nominations
  useEffect(() => {
    if (!authReady) return;

    async function fetchNominations() {
      setLoading(true);
      setError(null);

      // Check if user is in guest / demo mode
      const isDemoGuest =
        typeof window !== "undefined" &&
        window.localStorage?.getItem?.("audience_take_demo_user") === "guest-scout";

      if (!user && !isDemoGuest) {
        setNominations([]);
        setLoading(false);
        return;
      }

      if (!user && isDemoGuest) {
        // Use demo nominations for guest scout
        setNominations(DEMO_NOMINATIONS);
        setLoading(false);
        return;
      }

      try {
        const token = await user?.getIdToken();
        const response = await fetch("/api/user/nominations", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.status === 401) {
          setError("Sign in required to view your nominations.");
          setNominations([]);
          return;
        }

        const data = await response.json();
        const list = data?.data?.nominations || data?.nominations;
        if (data.ok && Array.isArray(list)) {
          if (list.length === 0 && isDemoGuest) {
            setNominations(DEMO_NOMINATIONS);
          } else {
            setNominations(list);
          }
        } else {
          setNominations(isDemoGuest ? DEMO_NOMINATIONS : []);
        }
      } catch (err) {
        if (isDemoGuest) {
          setNominations(DEMO_NOMINATIONS);
        } else {
          setError("Could not load nominations. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchNominations();
  }, [user, authReady]);

  // Handlers for Edit
  const openEditModal = (nom: UserNominationItem) => {
    setEditingNomination(nom);
    setEditWhy(nom.whyItShouldGrow || "");
    setEditFormat(nom.suggestedFormat || "");
    setEditAudience(nom.audienceFit || "");
    setEditSupporting(nom.supportingUrls ? nom.supportingUrls.join("\n") : "");
    setEditError("");
  };

  const handleSaveEdit = async () => {
    if (!editingNomination) return;
    setSavingEdit(true);
    setEditError("");

    const urls = editSupporting
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    try {
      if (user) {
        const token = await user.getIdToken();
        const res = await fetch(`/api/user/nominations/${editingNomination.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            whyItShouldGrow: editWhy,
            suggestedFormat: editFormat || undefined,
            audienceFit: editAudience || undefined,
            supportingUrls: urls,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to update nomination.");
        }
      }

      // Optimistic update
      setNominations((prev) =>
        prev.map((n) =>
          n.id === editingNomination.id
            ? {
                ...n,
                whyItShouldGrow: editWhy,
                suggestedFormat: editFormat,
                audienceFit: editAudience,
                supportingUrls: urls,
              }
            : n,
        ),
      );
      setEditingNomination(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Error updating nomination.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handlers for Withdraw
  const handleConfirmWithdraw = async () => {
    if (!withdrawingNomination) return;
    setWithdrawingBusy(true);

    try {
      if (user) {
        const token = await user.getIdToken();
        await fetch(`/api/user/nominations/${withdrawingNomination.id}`, {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      // Update state
      setNominations((prev) =>
        prev.map((n) =>
          n.id === withdrawingNomination.id ? { ...n, status: "withdrawn" } : n,
        ),
      );
      setWithdrawingNomination(null);
    } catch (err) {
      alert("Failed to withdraw nomination.");
    } finally {
      setWithdrawingBusy(false);
    }
  };

  // Metrics
  const totalCount = nominations.length;
  const inResearchCount = nominations.filter((n) => n.status === "in_progress" || n.status === "accepted").length;
  const publishedCount = nominations.filter((n) => n.status === "published").length;
  const withdrawnCount = nominations.filter((n) => n.status === "withdrawn").length;

  // Filtered list
  const filteredNominations = nominations.filter((nom) => {
    if (statusFilter === "in_progress" && nom.status !== "in_progress" && nom.status !== "accepted") return false;
    if (statusFilter === "published" && nom.status !== "published") return false;
    if (statusFilter === "withdrawn" && nom.status !== "withdrawn") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = nom.projectTitle?.toLowerCase().includes(q);
      const matchUrl = nom.submittedUrl?.toLowerCase().includes(q);
      const matchWhy = nom.whyItShouldGrow?.toLowerCase().includes(q);
      if (!matchTitle && !matchUrl && !matchWhy) return false;
    }
    return true;
  });

  if (!authReady) {
    return (
      <main className="my-nominations-page">
        <div className="nominations-loading">Checking your scout session…</div>
      </main>
    );
  }

  const isGuest =
    typeof window !== "undefined" &&
    window.localStorage?.getItem?.("audience_take_demo_user") === "guest-scout";
  const signedIn = Boolean(user || isGuest);

  if (!signedIn) {
    return (
      <main className="my-nominations-page">
        <div className="sign-in-prompt-card">
          <span className="route-label">Scout Identity Required</span>
          <h1>Sign in to manage your nominations</h1>
          <p>
            Track autonomous research runs, edit context notes, and build your public cultural tastemaker reputation.
          </p>
          <div className="prompt-actions">
            <Link className="button-primary" href="/sign-in?returnTo=/my-nominations">
              Sign In / Register →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="my-nominations-page paper-texture">
      {/* 1. SCOUT PORTFOLIO HERO */}
      <header className="scout-portfolio-header">
        <div className="portfolio-header-top">
          <div>
            <span className="portfolio-kicker">CULTURAL SCOUT DOSSIER & NOMINATION LEDGER</span>
            <h1 className="portfolio-title">
              {user?.displayName || user?.email?.split("@")[0] || (isGuest ? "Guest Scout (Demo)" : "Verified Scout")}
            </h1>
            <p className="portfolio-subtitle">
              Your active submissions, autonomous agent investigation runs, and published Scout Cards.
            </p>
          </div>
          <Link href="/nominate" className="button-primary nominate-cta">
            + NOMINATE NEW PROJECT →
          </Link>
        </div>

        {/* METRICS STRIP */}
        <div className="portfolio-metrics-strip" aria-label="Nomination portfolio metrics">
          <div className="metric-box">
            <small>TOTAL SCOUTED</small>
            <strong>{totalCount}</strong>
          </div>
          <div className="metric-box is-researching">
            <small>ACTIVE IN RESEARCH</small>
            <strong>{inResearchCount}</strong>
          </div>
          <div className="metric-box is-published">
            <small>PUBLISHED CARDS</small>
            <strong>{publishedCount}</strong>
          </div>
          <div className="metric-box is-withdrawn">
            <small>WITHDRAWN / ARCHIVED</small>
            <strong>{withdrawnCount}</strong>
          </div>
        </div>
      </header>

      {/* 2. CONTROL BAR (FILTER TABS & SEARCH) */}
      <section className="nominations-control-bar" aria-label="Nomination filters">
        <div className="status-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "all"}
            className={`status-tab ${statusFilter === "all" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            ALL <span>({totalCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "in_progress"}
            className={`status-tab ${statusFilter === "in_progress" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("in_progress")}
          >
            🟡 IN RESEARCH <span>({inResearchCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "published"}
            className={`status-tab ${statusFilter === "published" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("published")}
          >
            🟢 PUBLISHED <span>({publishedCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === "withdrawn"}
            className={`status-tab ${statusFilter === "withdrawn" ? "is-active" : ""}`}
            onClick={() => setStatusFilter("withdrawn")}
          >
            ⚪ WITHDRAWN <span>({withdrawnCount})</span>
          </button>
        </div>

        <div className="search-box">
          <input
            type="search"
            placeholder="Search nominations by title, URL, or rationale…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search nominations"
          />
        </div>
      </section>

      {/* 3. NOMINATIONS LEDGER LIST */}
      <section className="nominations-ledger" aria-label="Nomination submissions list">
        {loading ? (
          <div className="ledger-empty-state">
            <p>Loading your scout ledger…</p>
          </div>
        ) : filteredNominations.length === 0 ? (
          <div className="ledger-empty-state">
            {nominations.length === 0 ? (
              <div className="zero-state-onboarding">
                <span className="zero-state-badge">NO NOMINATIONS YET</span>
                <h2>Start building your scout portfolio</h2>
                <p>
                  Spot an emergent independent screen project on YouTube, Vimeo, or Kickstarter? Submit it to Audience Take. Our autonomous research agent analyzes the creative craft, verifies creator identity, checks unit economics, and synthesizes an evidence-backed Scout Card.
                </p>
                <div className="zero-state-steps">
                  <div className="step-item">
                    <span className="step-num">01</span>
                    <strong>Nominate Public URL</strong>
                    <small>Submit raw footage, pilot animatics, or proof-of-concept links.</small>
                  </div>
                  <div className="step-item">
                    <span className="step-num">02</span>
                    <strong>Autonomous Research</strong>
                    <small>Gemini multimodal vision & web scrapers investigate evidence.</small>
                  </div>
                  <div className="step-item">
                    <span className="step-num">03</span>
                    <strong>Published Scout Card</strong>
                    <small>Graduates to the public wall with buyer decision slates.</small>
                  </div>
                </div>
                <Link href="/nominate" className="button-primary zero-state-btn">
                  NOMINATE YOUR FIRST PROJECT →
                </Link>
              </div>
            ) : (
              <p>No nominations match your active filters.</p>
            )}
          </div>
        ) : (
          <div className="nomination-cards-grid">
            {filteredNominations.map((nom) => {
              const formattedDate = new Date(nom.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <article key={nom.id} className={`nomination-card is-${nom.status}`}>
                  {/* CARD TOP META BAR */}
                  <div className="nomination-card-top">
                    <div className="top-tags">
                      <span className={`submission-pill ${nom.submissionType === "creator" ? "is-creator" : "is-fan"}`}>
                        {nom.submissionType === "creator" ? "🎨 CREATOR PROVENANCE" : "🍿 FAN SCOUT"}
                      </span>
                      <span className="submitted-date">Submitted {formattedDate}</span>
                    </div>

                    <div className="status-badge-wrapper">
                      {nom.status === "published" ? (
                        <span className="status-pill is-published">
                          <span className="pill-dot">●</span> PUBLISHED SCOUT CARD
                        </span>
                      ) : nom.status === "in_progress" || nom.status === "accepted" ? (
                        <span className="status-pill is-researching">
                          <span className="pill-dot pulse">●</span> IN RESEARCH (STAGE {nom.currentStage || 1}/6)
                        </span>
                      ) : nom.status === "failed" ? (
                        <span className="status-pill is-failed">
                          <span className="pill-dot">●</span> INVESTIGATION BLOCKED
                        </span>
                      ) : (
                        <span className="status-pill is-withdrawn">
                          <span className="pill-dot">●</span> WITHDRAWN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CARD BODY */}
                  <div className="nomination-card-body">
                    <div className="project-headline">
                      <h2 className="project-title">{nom.projectTitle}</h2>
                      <a
                        href={nom.submittedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="submitted-url-link"
                      >
                        {nom.submittedUrl} ↗
                      </a>
                    </div>

                    <p className="nomination-rationale">
                      <strong>Scout Thesis:</strong> “{nom.whyItShouldGrow}”
                    </p>

                    {/* METADATA PILLS */}
                    <div className="nomination-meta-pills">
                      {nom.suggestedFormat ? (
                        <div className="meta-pill">
                          <span className="pill-kicker">FORMAT:</span> {nom.suggestedFormat}
                        </div>
                      ) : null}
                      {nom.audienceFit ? (
                        <div className="meta-pill">
                          <span className="pill-kicker">AUDIENCE:</span> {nom.audienceFit}
                        </div>
                      ) : null}
                    </div>

                    {/* SUPPORTING CITATIONS */}
                    {nom.supportingUrls && nom.supportingUrls.length > 0 ? (
                      <div className="supporting-citations-row">
                        <span className="citations-label">Supporting Links ({nom.supportingUrls.length}):</span>
                        <ul className="citations-list">
                          {nom.supportingUrls.map((url, idx) => (
                            <li key={idx}>
                              <a href={url} target="_blank" rel="noreferrer">
                                S{idx + 1} · {new URL(url).hostname.replace("www.", "")} ↗
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  {/* CARD FOOTER ACTIONS */}
                  <div className="nomination-card-footer">
                    <div className="footer-left-actions">
                      {nom.status === "published" && nom.cardUrl ? (
                        <Link href={nom.cardUrl} className="button-primary card-action-btn">
                          VIEW SCOUT CARD →
                        </Link>
                      ) : nom.researchUrl ? (
                        <Link href={nom.researchUrl} className="button-primary card-action-btn is-research">
                          VIEW LIVE AGENT RUN (STAGE {nom.currentStage || 1}/6) →
                        </Link>
                      ) : null}
                    </div>

                    <div className="footer-right-actions">
                      {nom.status !== "withdrawn" ? (
                        <>
                          <button
                            type="button"
                            className="button-secondary action-btn-small"
                            onClick={() => openEditModal(nom)}
                          >
                            Edit Context
                          </button>
                          <button
                            type="button"
                            className="button-destructive action-btn-small"
                            onClick={() => setWithdrawingNomination(nom)}
                          >
                            Withdraw
                          </button>
                        </>
                      ) : (
                        <span className="withdrawn-notice">Archived</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. EDIT CONTEXT MODAL */}
      {editingNomination ? (
        <div className="nomination-modal-backdrop" role="dialog" aria-labelledby="edit-modal-title">
          <div className="nomination-modal-card">
            <header className="modal-header">
              <h2 id="edit-modal-title">Edit Nomination Context</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setEditingNomination(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              <p className="modal-intro">
                Update your scout commentary and supporting evidence citations for <strong>{editingNomination.projectTitle}</strong>.
              </p>

              <label className="modal-field">
                <strong>Why This Should Grow (Scout Thesis)</strong>
                <textarea
                  rows={4}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  placeholder="Explain why this project deserves institutional backing..."
                />
              </label>

              <label className="modal-field">
                <strong>Suggested Production Format</strong>
                <input
                  type="text"
                  value={editFormat}
                  onChange={(e) => setEditFormat(e.target.value)}
                  placeholder="e.g. Serialized Adult Animation, Micro-Budget Feature"
                />
              </label>

              <label className="modal-field">
                <strong>Target Audience & Buyer Fit</strong>
                <input
                  type="text"
                  value={editAudience}
                  onChange={(e) => setEditAudience(e.target.value)}
                  placeholder="e.g. A24 / Neon indie horror, Adult Swim anime fans"
                />
              </label>

              <label className="modal-field">
                <strong>Supporting Links / Citations (One per line, up to 5)</strong>
                <textarea
                  rows={3}
                  value={editSupporting}
                  onChange={(e) => setEditSupporting(e.target.value)}
                  placeholder="https://trade-press.com/article&#10;https://kickstarter.com/project"
                />
              </label>

              {editError ? <p className="field-error">{editError}</p> : null}
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setEditingNomination(null)}
                disabled={savingEdit}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit || editWhy.trim().length < 10}
              >
                {savingEdit ? "Saving Changes…" : "Save Context Changes"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {/* 5. WITHDRAW CONFIRMATION MODAL */}
      {withdrawingNomination ? (
        <div className="nomination-modal-backdrop" role="dialog" aria-labelledby="withdraw-modal-title">
          <div className="nomination-modal-card is-danger">
            <header className="modal-header">
              <h2 id="withdraw-modal-title">Withdraw Nomination?</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setWithdrawingNomination(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </header>

            <div className="modal-body">
              <p>
                Are you sure you want to withdraw your nomination for <strong>{withdrawingNomination.projectTitle}</strong>?
              </p>
              <p className="modal-subtext">
                Withdrawing marks this submission as archived in your personal dossier. If research has already produced a public Scout Card, the card remains public on the Scouting Wall with provenance preserved.
              </p>
            </div>

            <footer className="modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setWithdrawingNomination(null)}
                disabled={withdrawingBusy}
              >
                Keep Nomination
              </button>
              <button
                type="button"
                className="button-destructive"
                onClick={() => void handleConfirmWithdraw()}
                disabled={withdrawingBusy}
              >
                {withdrawingBusy ? "Withdrawing…" : "Confirm Withdrawal"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </main>
  );
}
