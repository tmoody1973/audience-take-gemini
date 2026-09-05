"use client";

import React from "react";
import type { CalculationManifest, ScenarioOption } from "./types";
import { calculateScenario } from "@/services/production-scenarios/calculator";

export interface ScenarioComparisonProps {
  options: ScenarioOption[];
  cardVersionId: string;
  onClose: () => void;
  onSelectOption: (optionId: string) => void;
}

export function ScenarioComparison({
  options,
  cardVersionId,
  onClose,
  onSelectOption,
}: ScenarioComparisonProps) {
  // Precalculate manifests for each option
  const manifests = options.map((opt) => ({
    option: opt,
    manifest: calculateScenario(opt, "comparison", cardVersionId),
  }));

  const currencySymbol = options[0]?.currency === "EUR" ? "€" : options[0]?.currency === "GBP" ? "£" : "$";

  return (
    <div className="scenarios-comparison-panel" role="region" aria-label="Development options comparison">
      <div className="comparison-header">
        <div>
          <h3>Development Scope Comparison</h3>
          <p className="comparison-subtext">
            Side-by-side analysis of up to 3 development pathways.
            Lower cost indicates reduced scope or duration, not commercial superiority.
          </p>
        </div>
        <button
          type="button"
          className="scenarios-btn-icon-close"
          onClick={onClose}
          aria-label="Close comparison view"
        >
          ✕
        </button>
      </div>

      <div className="comparison-table-wrapper">
        <table className="scenarios-comparison-table" aria-label="Options comparison table">
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              {manifests.map(({ option }) => (
                <th key={option.id} scope="col">
                  <strong>{option.label}</strong>
                  <div>
                    <small>{option.targetFormat.replace("_", " ").toUpperCase()}</small>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Technique</th>
              {manifests.map(({ option }) => (
                <td key={option.id}>{option.technique.replace("_", " ")}</td>
              ))}
            </tr>
            <tr>
              <th scope="row">Finished Duration</th>
              {manifests.map(({ option }) => (
                <td key={option.id}>
                  {option.runtimeMinutes} min
                  {option.episodeCount > 1 ? ` (${option.episodeCount} eps)` : ""}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Planning Range (Low — High)</th>
              {manifests.map(({ option, manifest }) => (
                <td key={option.id}>
                  {manifest.coverageState === "insufficient" ? (
                    <span className="scenarios-text-muted">Insufficient Data</span>
                  ) : (
                    <strong>
                      {currencySymbol}{manifest.costCases.low.totalCost.toLocaleString()} —{" "}
                      {currencySymbol}{manifest.costCases.high.totalCost.toLocaleString()}
                    </strong>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Base Planning Total</th>
              {manifests.map(({ option, manifest }) => (
                <td key={option.id}>
                  {manifest.coverageState === "insufficient" ? (
                    "—"
                  ) : (
                    <span className="scenarios-cost-highlight">
                      {currencySymbol}{manifest.costCases.base.totalCost.toLocaleString()}
                    </span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Top Cost Driver</th>
              {manifests.map(({ option, manifest }) => (
                <td key={option.id}>
                  {manifest.topDrivers[0] ? (
                    <span>
                      {manifest.topDrivers[0].label} ({manifest.topDrivers[0].percentageOfDirect}%)
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Coverage Status</th>
              {manifests.map(({ option, manifest }) => (
                <td key={option.id}>
                  <span className={`scenarios-badge-coverage coverage-${manifest.coverageState}`}>
                    {manifest.coverageState}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Action</th>
              {manifests.map(({ option }) => (
                <td key={option.id}>
                  <button
                    type="button"
                    className="btn-scenarios-secondary btn-sm"
                    onClick={() => onSelectOption(option.id)}
                  >
                    Select Option
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
