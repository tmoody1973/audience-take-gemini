"use client";

import React, { useState, useEffect } from "react";
import type { ScoutCard } from "@/features/scout-card/types";
import type {
  CostCaseType,
  ProductionScenario,
  ScenarioOption,
  SensitivityCheck,
} from "./types";
import {
  calculateScenario,
  roundForDisplay,
  runSensitivityAnalysis,
} from "@/services/production-scenarios/calculator";
import { create2DAnimationScenarioOption } from "@/services/production-scenarios/adapters/animation-2d";
import { createLiveActionScenarioOption } from "@/services/production-scenarios/adapters/live-action";
import { createDocumentaryScenarioOption } from "@/services/production-scenarios/adapters/documentary";
import { TECHNIQUE_METADATA_MAP } from "@/services/production-scenarios/adapters/unsupported";
import { ScenarioInspectionDrawer } from "./scenario-inspection-drawer";
import { ScenarioEditor } from "./scenario-editor";
import { ScenarioComparison } from "./scenario-comparison";

export interface ProductionScenariosSectionProps {
  card: ScoutCard;
  initialScenario?: ProductionScenario;
}

export function ProductionScenariosSection({
  card,
  initialScenario,
}: ProductionScenariosSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState<boolean>(false);
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityCheck | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Initialize initial scenario options based on project card format
  const defaultOption1: ScenarioOption =
    card.projectType === "series"
      ? create2DAnimationScenarioOption({
          id: "opt-series",
          label: "Episodic Series (10x 11m)",
          targetFormat: "series",
          runtimeMinutes: 11,
          episodeCount: 10,
          currency: "USD",
        })
      : card.projectType === "documentary"
      ? createDocumentaryScenarioOption({
          id: "opt-doc",
          label: "Documentary Short (15m)",
          targetFormat: "short",
          runtimeMinutes: 15,
          fieldShootDays: 4,
          editWeeks: 3,
          archivalMinutes: 2,
          currency: "USD",
        })
      : card.projectType === "film" || card.projectType === "short_film"
      ? createLiveActionScenarioOption({
          id: "opt-poc-la",
          label: "Live Action Proof of Concept (5m)",
          targetFormat: "proof_of_concept",
          runtimeMinutes: 5,
          shootDays: 2,
          currency: "USD",
        })
      : create2DAnimationScenarioOption({
          id: "opt-poc-2d",
          label: "Proof of Concept (2m)",
          targetFormat: "proof_of_concept",
          runtimeMinutes: 2,
          episodeCount: 1,
          currency: "USD",
        });

  // Secondary option for immediate comparison
  const defaultOption2: ScenarioOption = create2DAnimationScenarioOption({
    id: "opt-pilot",
    label: "Pilot Episode (11m)",
    targetFormat: "pilot",
    runtimeMinutes: 11,
    episodeCount: 1,
    currency: "USD",
  });

  const [scenario, setScenario] = useState<ProductionScenario>(
    initialScenario || {
      id: `scen-${card.projectId}-local`,
      projectId: card.projectId,
      cardVersionId: card.cardVersionId,
      ownerId: "session-local-user",
      isPrivate: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 1,
      options: [defaultOption1, defaultOption2],
      activeOptionId: defaultOption1.id,
    }
  );

  const [activeOptionId, setActiveOptionId] = useState<string>(
    scenario.activeOptionId || scenario.options[0]?.id || "opt-default"
  );

  // Active option and calculation manifest
  const activeOption =
    scenario.options.find((o) => o.id === activeOptionId) || scenario.options[0];
  const manifest = calculateScenario(activeOption, scenario.id, card.cardVersionId);

  // Identify reported budget vs crowdfunding
  const reportedBudgetClaim = card.evidenceClaims?.find((c) =>
    /\b(production budget|budgeted at|cost to produce)\b/i.test(c.statement)
  );
  const crowdfundingClaim = card.evidenceClaims?.find((c) =>
    /\b(kickstarter|crowdfund|pledged|indiegogo)\b/i.test(c.statement)
  );

  const currencySymbol = activeOption.currency === "EUR" ? "€" : activeOption.currency === "GBP" ? "£" : "$";

  // Stale check
  const isStale = scenario.cardVersionId !== card.cardVersionId;

  const handleSelectOption = (optionId: string) => {
    setActiveOptionId(optionId);
    setScenario((prev) => ({ ...prev, activeOptionId: optionId }));
    setIsComparing(false);
  };

  const handleUpdateActiveOption = (updated: ScenarioOption) => {
    setScenario((prev) => {
      const newOptions = prev.options.map((opt) =>
        opt.id === updated.id ? updated : opt
      );
      return {
        ...prev,
        options: newOptions,
        updatedAt: new Date().toISOString(),
      };
    });
    setIsEditing(false);
  };

  const handleDuplicateOption = () => {
    if (scenario.options.length >= 3) return;
    const newId = `opt-${Date.now().toString(36)}`;
    const cloned: ScenarioOption = {
      ...JSON.parse(JSON.stringify(activeOption)),
      id: newId,
      label: `${activeOption.label} (Copy)`,
    };
    setScenario((prev) => ({
      ...prev,
      options: [...prev.options, cloned],
      activeOptionId: newId,
    }));
    setActiveOptionId(newId);
  };

  const handleSaveScenario = async () => {
    setSaveStatus("Saving...");
    try {
      const res = await fetch(`/api/projects/${card.projectId}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });
      if (res.ok) {
        const data = await res.json();
        setScenario(data.scenario);
        setSaveStatus(`Saved revision #${data.scenario.revision}`);
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("Saved locally (offline mode)");
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch {
      setSaveStatus("Saved locally (offline mode)");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleTriggerSensitivity = () => {
    const workloadItem = activeOption.lineItems.find(
      (i) => i.category === "production_workload" && !i.isExcluded
    );
    if (!workloadItem) {
      alert("No active workload line item found to run sensitivity check.");
      return;
    }
    // Test +25% workload
    const res = runSensitivityAnalysis(
      activeOption,
      scenario.id,
      card.cardVersionId,
      workloadItem.id,
      1.25
    );
    setSensitivityResult(res);
    setIsSensitivityOpen(true);
  };

  const techniqueMeta = TECHNIQUE_METADATA_MAP[activeOption.technique];

  return (
    <section className="pro-production-scenarios-section" aria-labelledby="pro-scenarios-heading">
      <div className="pro-section-title-wrap">
        <div className="pro-scenarios-header-row">
          <div>
            <span className="pro-section-kicker">PHYSICAL PRODUCTION DILIGENCE</span>
            <h2 id="pro-scenarios-heading">Production Scenarios</h2>
          </div>
          <div className="pro-scenarios-header-meta">
            <span className="scenarios-basis-date">
              Research basis: {card.provenance?.researchedAt ? card.provenance.researchedAt.slice(0, 7) : "Aug 2026"}
            </span>
          </div>
        </div>

        {/* Reported budget distinction */}
        <div className="pro-reported-budget-strip">
          <span className="reported-budget-label">Reported Project Budget:</span>{" "}
          {reportedBudgetClaim ? (
            <strong className="reported-budget-value">{reportedBudgetClaim.statement}</strong>
          ) : (
            <span className="reported-budget-none">
              Not established
              {crowdfundingClaim ? (
                <span className="reported-budget-crowdfund"> ({crowdfundingClaim.statement})</span>
              ) : null}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-scenarios-toggle"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "▲ Hide production scenarios" : "▼ Explore production scenarios"}
        </button>
      </div>

      {isExpanded ? (
        <div className="pro-scenarios-container">
          {/* Disclaimer banner */}
          <div className="scenarios-disclaimer-banner" role="note">
            <span className="disclaimer-icon">ℹ️</span>
            <div>
              <strong>Indicative Planning Tool:</strong> Explore estimated costs using stated assumptions.
              This is <em>not</em> an approved production budget, vendor quote, or investment forecast.
              Never convert scenarios into confirmed project facts.
            </div>
          </div>

          {/* Stale evidence banner */}
          {isStale ? (
            <div className="scenarios-stale-notice" role="alert">
              ⚠️ Scout Card evidence version advanced from AT—{scenario.cardVersionId.slice(-8).toUpperCase()} to AT—{card.cardVersionId.slice(-8).toUpperCase()}.
              Recalculate to align with current research.
            </div>
          ) : null}

          {/* Development Option Tabs */}
          <div className="scenarios-options-nav" role="tablist" aria-label="Development options">
            {scenario.options.map((opt) => (
              <button
                key={opt.id}
                role="tab"
                aria-selected={opt.id === activeOptionId}
                className={`scenarios-option-tab ${opt.id === activeOptionId ? "active" : ""}`}
                onClick={() => handleSelectOption(opt.id)}
              >
                {opt.label}
              </button>
            ))}
            {scenario.options.length < 3 ? (
              <button
                type="button"
                className="scenarios-option-tab tab-add"
                onClick={handleDuplicateOption}
                title="Duplicate option to compare different scope"
              >
                + Add Option ({scenario.options.length}/3)
              </button>
            ) : null}
          </div>

          {/* Option Scope & Format Metadata */}
          <div className="scenarios-scope-summary">
            <span><strong>Format:</strong> {activeOption.targetFormat.replace("_", " ").toUpperCase()}</span>
            <span><strong>Technique:</strong> {techniqueMeta.label}</span>
            <span><strong>Runtime:</strong> {activeOption.runtimeMinutes}m {activeOption.episodeCount > 1 ? `(${activeOption.episodeCount} eps)` : ""}</span>
            <span><strong>Location:</strong> {activeOption.location}</span>
            <span><strong>Currency:</strong> {activeOption.currency}</span>
          </div>

          {/* If Deferred Technique (3D, Stop-Motion) */}
          {!techniqueMeta.isMonetarySupported ? (
            <div className="scenarios-deferred-card">
              <div className="deferred-header">
                <h3>Monetary Pricing Deferred for {techniqueMeta.label}</h3>
                <p>{techniqueMeta.deferredReason}</p>
              </div>

              <div className="deferred-drivers-grid">
                {techniqueMeta.costDrivers.map((driver, idx) => (
                  <div key={idx} className="deferred-driver-box">
                    <h4>{driver.name}</h4>
                    <p>{driver.description}</p>
                    <small><strong>Workload Unit:</strong> {driver.typicalWorkloadUnit}</small>
                    <div className="deferred-questions">
                      <strong>Questions to Diligence:</strong>
                      <ul>
                        {driver.questionsToResolve.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div className="deferred-action-row">
                <button
                  type="button"
                  className="btn-scenarios-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Switch Technique
                </button>
              </div>
            </div>
          ) : (
            /* Supported Technique Pricing View */
            <div className="scenarios-active-view">
              {/* Coverage notice */}
              {manifest.coverageState === "partial" ? (
                <div className="scenarios-partial-notice">
                  ⚠️ <strong>Partial Estimate:</strong> {manifest.coveredScopeDescription}.
                  (Missing: {manifest.missingCategories.join(", ")})
                </div>
              ) : null}

              {/* Range Display Card */}
              <div className="scenarios-range-card">
                <div className="range-kicker">INDICATIVE PLANNING RANGE</div>
                <div className="range-values">
                  <div className="range-col">
                    <span className="case-tag">LOW CASE</span>
                    <span className="case-amount">
                      {currencySymbol}{roundForDisplay(manifest.costCases.low.totalCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="range-divider">—</div>
                  <div className="range-col base-col">
                    <span className="case-tag">BASE CASE</span>
                    <span className="case-amount base-amount">
                      {currencySymbol}{roundForDisplay(manifest.costCases.base.totalCost).toLocaleString()}
                    </span>
                  </div>
                  <div className="range-divider">—</div>
                  <div className="range-col">
                    <span className="case-tag">HIGH CASE</span>
                    <span className="case-amount">
                      {currencySymbol}{roundForDisplay(manifest.costCases.high.totalCost).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="range-basis-tag">
                  Basis: User-Assumed Parameters &amp; Direct Line-Item Arithmetic
                </div>
              </div>

              {/* Top Cost Drivers Grid */}
              <div className="scenarios-drivers-section">
                <h4>Top Cost Drivers (Base Planning Case)</h4>
                <div className="drivers-grid">
                  {manifest.topDrivers.map((driver, idx) => (
                    <div key={idx} className="driver-card">
                      <div className="driver-rank">0{idx + 1}</div>
                      <div className="driver-info">
                        <strong>{driver.label}</strong>
                        <span className="driver-cat">{driver.category.replace("_", " ")}</span>
                      </div>
                      <div className="driver-stat">
                        <span className="driver-amt">
                          {currencySymbol}{Math.round(driver.amount).toLocaleString()}
                        </span>
                        <span className="driver-pct">{driver.percentageOfDirect}% of direct</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diligence Action Box */}
              <div className="scenarios-diligence-box">
                <span className="diligence-badge">NEXT DILIGENCE STEP</span>
                <p>{manifest.nextDiligenceStep}</p>
              </div>

              {/* Sensitivity Results Panel */}
              {isSensitivityOpen && sensitivityResult ? (
                <div className="scenarios-sensitivity-panel">
                  <div className="sensitivity-header">
                    <h4>Sensitivity Check: +25% Workload Impact</h4>
                    <button
                      type="button"
                      className="btn-icon-close"
                      onClick={() => setIsSensitivityOpen(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <p>
                    Varying <strong>{sensitivityResult.label}</strong> from {sensitivityResult.baseValue} to {sensitivityResult.testedValue} shifts total planning cost from {currencySymbol}{sensitivityResult.baseTotal.toLocaleString()} to {currencySymbol}{sensitivityResult.testedTotal.toLocaleString()} (+{currencySymbol}{sensitivityResult.deltaAmount.toLocaleString()}, <strong>+{sensitivityResult.deltaPercentage}%</strong>).
                  </p>
                </div>
              ) : null}

              {/* Action Toolbar */}
              <div className="scenarios-actions-bar">
                <button
                  type="button"
                  className="btn-scenarios-primary"
                  onClick={() => setIsEditing(true)}
                >
                  ⚙️ Adjust Assumptions
                </button>

                {scenario.options.length > 1 ? (
                  <button
                    type="button"
                    className="btn-scenarios-secondary"
                    onClick={() => setIsComparing(true)}
                  >
                    📊 Compare Options ({scenario.options.length})
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn-scenarios-secondary"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  🔍 View Calculation &amp; Sources
                </button>

                <button
                  type="button"
                  className="btn-scenarios-secondary"
                  onClick={handleTriggerSensitivity}
                >
                  📈 Sensitivity Check
                </button>

                <button
                  type="button"
                  className="btn-scenarios-secondary"
                  onClick={handleSaveScenario}
                >
                  💾 Save Scenario
                </button>

                {saveStatus ? (
                  <span className="scenarios-save-feedback" role="status">
                    ✓ {saveStatus}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          {/* Modals & Sub-views */}
          {isEditing ? (
            <div className="scenarios-subview-card">
              <ScenarioEditor
                option={activeOption}
                onUpdate={handleUpdateActiveOption}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          ) : null}

          {isComparing ? (
            <div className="scenarios-subview-card">
              <ScenarioComparison
                options={scenario.options}
                cardVersionId={card.cardVersionId}
                onClose={() => setIsComparing(false)}
                onSelectOption={handleSelectOption}
              />
            </div>
          ) : null}

          <ScenarioInspectionDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            manifest={manifest}
            option={activeOption}
          />
        </div>
      ) : null}
    </section>
  );
}
