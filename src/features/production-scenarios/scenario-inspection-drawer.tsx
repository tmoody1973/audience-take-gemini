"use client";

import React, { useEffect } from "react";
import type {
  CalculationManifest,
  ScenarioOption,
} from "./types";
import { createDeterministicExplanation } from "@/services/production-scenarios/gemini-explainer";

export interface ScenarioInspectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: CalculationManifest | null;
  option: ScenarioOption | null;
}

export function ScenarioInspectionDrawer({
  isOpen,
  onClose,
  manifest,
  option,
}: ScenarioInspectionDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !manifest || !option) return null;

  const baseCase = manifest.costCases.base;
  const currencySymbol = option.currency === "USD" ? "$" : option.currency === "EUR" ? "€" : "£";
  const narrative = createDeterministicExplanation(manifest, option);

  return (
    <div
      className="scenarios-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={onClose}
    >
      <div
        className="scenarios-drawer-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="scenarios-drawer-header">
          <div>
            <span className="scenarios-kicker">CALCULATION AUDIT &amp; EVIDENCE</span>
            <h2 id="drawer-title">Scenario Breakdown: {option.label}</h2>
            <p className="scenarios-meta-note">
              Engine v{manifest.engineVersion} · Hash: <code>{manifest.inputHash.slice(0, 12)}</code>
            </p>
          </div>
          <button
            type="button"
            className="scenarios-drawer-close-btn"
            onClick={onClose}
            aria-label="Close calculation audit drawer"
          >
            ✕
          </button>
        </header>

        <div className="scenarios-drawer-content">
          {/* 1. Executive Narrative */}
          <section className="scenarios-drawer-section">
            <h3>Executive Diligence Summary</h3>
            <div className="scenarios-narrative-box">
              {narrative.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {/* 2. Itemized Breakdown Table */}
          <section className="scenarios-drawer-section">
            <h3>Itemized Line Items (Base Case)</h3>
            <div className="scenarios-table-wrap">
              <table className="scenarios-audit-table" aria-label="Itemized line items table">
                <thead>
                  <tr>
                    <th scope="col">Line Item</th>
                    <th scope="col">Category</th>
                    <th scope="col">Qty</th>
                    <th scope="col">Unit Rate</th>
                    <th scope="col">Subtotal</th>
                    <th scope="col">Basis</th>
                  </tr>
                </thead>
                <tbody>
                  {baseCase.itemizedResults.map((item) => (
                    <tr key={item.lineItemId} className={item.isExcluded ? "row-excluded" : ""}>
                      <th scope="row">
                        {item.label}
                        {item.isExcluded ? <span className="scenarios-badge-excluded"> (Excluded)</span> : null}
                      </th>
                      <td>{item.category.replace("_", " ")}</td>
                      <td>{item.quantity > 0 ? item.quantity : "—"}</td>
                      <td>{item.unitRate > 0 ? `${currencySymbol}${item.unitRate.toLocaleString()}` : "—"}</td>
                      <td>
                        <strong>{currencySymbol}{item.subtotal.toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className={`scenarios-badge-prov scenarios-prov-${item.provenance}`}>
                          {item.provenance.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={4}>Direct Production Cost</th>
                    <td colSpan={2}>
                      <strong>{currencySymbol}{baseCase.directCost.toLocaleString()}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 3. Allowances Table */}
          {baseCase.allowanceResults.length > 0 ? (
            <section className="scenarios-drawer-section">
              <h3>Allowances &amp; Reserves</h3>
              <div className="scenarios-table-wrap">
                <table className="scenarios-audit-table" aria-label="Allowances table">
                  <thead>
                    <tr>
                      <th scope="col">Allowance</th>
                      <th scope="col">Rate</th>
                      <th scope="col">Eligible Base</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseCase.allowanceResults.map((a) => (
                      <tr key={a.allowanceId}>
                        <th scope="row">{a.label}</th>
                        <td>{a.ratePercent}%</td>
                        <td>{currencySymbol}{a.baseAmount.toLocaleString()}</td>
                        <td>
                          <strong>{currencySymbol}{a.amount.toLocaleString()}</strong>
                        </td>
                        <td><small>{a.rationale}</small></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={3}>All-In Planning Case Total</th>
                      <td colSpan={2}>
                        <strong className="scenarios-total-highlight">
                          {currencySymbol}{baseCase.totalCost.toLocaleString()}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          ) : null}

          {/* 4. Package Conflicts or Warnings */}
          {manifest.warnings.length > 0 ? (
            <section className="scenarios-drawer-section">
              <h3>Integrity Notices &amp; Warnings</h3>
              <ul className="scenarios-warnings-list">
                {manifest.warnings.map((w, idx) => (
                  <li key={idx} className="scenarios-warning-item">
                    ⚠️ {w}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
