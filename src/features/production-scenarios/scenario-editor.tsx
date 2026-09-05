"use client";

import React, { useState } from "react";
import type {
  Currency,
  ProductionTechnique,
  ScenarioOption,
  TargetFormat,
} from "./types";
import { create2DAnimationScenarioOption } from "@/services/production-scenarios/adapters/animation-2d";
import { createLiveActionScenarioOption } from "@/services/production-scenarios/adapters/live-action";
import { createDocumentaryScenarioOption } from "@/services/production-scenarios/adapters/documentary";

export interface ScenarioEditorProps {
  option: ScenarioOption;
  onUpdate: (updated: ScenarioOption) => void;
  onCancel: () => void;
}

export function ScenarioEditor({ option, onUpdate, onCancel }: ScenarioEditorProps) {
  const [label, setLabel] = useState(option.label);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>(option.targetFormat);
  const [technique, setTechnique] = useState<ProductionTechnique>(option.technique);
  const [runtimeMinutes, setRuntimeMinutes] = useState(option.runtimeMinutes);
  const [episodeCount, setEpisodeCount] = useState(option.episodeCount || 1);
  const [currency, setCurrency] = useState<Currency>(option.currency);

  // 2D animation params
  const [complexityTier, setComplexityTier] = useState<"limited" | "standard" | "high">(
    (option.inputs?.complexityTier?.value as any) || "standard"
  );

  // Live action params
  const [shootDays, setShootDays] = useState<number>(
    (option.inputs?.shootDays?.value as number) || Math.max(1, Math.round(runtimeMinutes / 2))
  );
  const [crewTier, setCrewTier] = useState<"indie_micro" | "tier_1_union" | "commercial_standard">(
    (option.inputs?.crewTier?.value as any) || "indie_micro"
  );

  // Documentary params
  const [fieldShootDays, setFieldShootDays] = useState<number>(
    (option.inputs?.fieldShootDays?.value as number) || 5
  );
  const [editWeeks, setEditWeeks] = useState<number>(
    (option.inputs?.editWeeks?.value as number) || 4
  );
  const [archivalMinutes, setArchivalMinutes] = useState<number>(
    (option.inputs?.archivalMinutes?.value as number) || 2
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let updatedOption: ScenarioOption;

    if (technique === "2d_animation") {
      updatedOption = create2DAnimationScenarioOption({
        id: option.id,
        label,
        targetFormat,
        runtimeMinutes: Math.max(0.5, runtimeMinutes),
        episodeCount: Math.max(1, episodeCount),
        currency,
        complexityTier,
      });
    } else if (technique === "live_action") {
      updatedOption = createLiveActionScenarioOption({
        id: option.id,
        label,
        targetFormat,
        runtimeMinutes: Math.max(1, runtimeMinutes),
        shootDays: Math.max(1, shootDays),
        currency,
        crewTier,
      });
    } else if (technique === "documentary") {
      updatedOption = createDocumentaryScenarioOption({
        id: option.id,
        label,
        targetFormat,
        runtimeMinutes: Math.max(1, runtimeMinutes),
        fieldShootDays: Math.max(1, fieldShootDays),
        editWeeks: Math.max(1, editWeeks),
        archivalMinutes: Math.max(0, archivalMinutes),
        currency,
      });
    } else {
      // Deferred technique (3D, Stop-motion)
      updatedOption = {
        ...option,
        label,
        targetFormat,
        technique,
        runtimeMinutes,
        episodeCount,
        currency,
        lineItems: [], // Deliberately empty; monetary adapter deferred
        allowances: [],
      };
    }

    onUpdate(updatedOption);
  };

  return (
    <form className="scenario-editor-form" onSubmit={handleSubmit}>
      <div className="editor-header">
        <h4>Edit Scenario Assumptions</h4>
        <p className="editor-subtext">
          Adjust stated parameters to see local, deterministic cost recalculation.
        </p>
      </div>

      <div className="editor-grid">
        <div className="editor-field">
          <label htmlFor="opt-label">Option Name</label>
          <input
            id="opt-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
        </div>

        <div className="editor-field">
          <label htmlFor="opt-format">Format</label>
          <select
            id="opt-format"
            value={targetFormat}
            onChange={(e) => setTargetFormat(e.target.value as TargetFormat)}
          >
            <option value="proof_of_concept">Proof of Concept</option>
            <option value="pilot">Pilot Episode</option>
            <option value="series">Episodic Series</option>
            <option value="short">Short Film</option>
            <option value="feature">Feature Film</option>
          </select>
        </div>

        <div className="editor-field">
          <label htmlFor="opt-technique">Technique</label>
          <select
            id="opt-technique"
            value={technique}
            onChange={(e) => setTechnique(e.target.value as ProductionTechnique)}
          >
            <option value="2d_animation">2D Animation (Supported)</option>
            <option value="live_action">Live Action (Supported)</option>
            <option value="documentary">Documentary (Supported)</option>
            <option value="3d_animation">3D CGI Animation (Monetary Deferred)</option>
            <option value="stop_motion">Stop-Motion Animation (Monetary Deferred)</option>
          </select>
        </div>

        <div className="editor-field">
          <label htmlFor="opt-runtime">Finished Runtime (Minutes)</label>
          <input
            id="opt-runtime"
            type="number"
            step="0.5"
            min="0.5"
            value={runtimeMinutes}
            onChange={(e) => setRuntimeMinutes(parseFloat(e.target.value) || 1)}
            required
          />
        </div>

        {targetFormat === "series" ? (
          <div className="editor-field">
            <label htmlFor="opt-episodes">Episodes Count</label>
            <input
              id="opt-episodes"
              type="number"
              min="2"
              max="50"
              value={episodeCount}
              onChange={(e) => setEpisodeCount(parseInt(e.target.value, 10) || 1)}
              required
            />
          </div>
        ) : null}

        <div className="editor-field">
          <label htmlFor="opt-currency">Currency</label>
          <select
            id="opt-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
          </select>
        </div>

        {/* Technique specific fields */}
        {technique === "2d_animation" ? (
          <div className="editor-field">
            <label htmlFor="opt-complexity">Animation Complexity</label>
            <select
              id="opt-complexity"
              value={complexityTier}
              onChange={(e) => setComplexityTier(e.target.value as any)}
            >
              <option value="limited">Limited (Dialogue-focused, simple rigs)</option>
              <option value="standard">Standard (Fluid full character animation)</option>
              <option value="high">High (Kinetic action, complex effects)</option>
            </select>
          </div>
        ) : null}

        {technique === "live_action" ? (
          <>
            <div className="editor-field">
              <label htmlFor="opt-shoot-days">Scheduled Shoot Days</label>
              <input
                id="opt-shoot-days"
                type="number"
                min="1"
                value={shootDays}
                onChange={(e) => setShootDays(parseInt(e.target.value, 10) || 1)}
                required
              />
              <small className="editor-hint">Shoot days cannot be inferred from runtime alone.</small>
            </div>
            <div className="editor-field">
              <label htmlFor="opt-crew-tier">Crew Staffing Tier</label>
              <select
                id="opt-crew-tier"
                value={crewTier}
                onChange={(e) => setCrewTier(e.target.value as any)}
              >
                <option value="indie_micro">Indie / Micro-Budget Package</option>
                <option value="tier_1_union">Tier 1 Union (Low Budget Agreement)</option>
                <option value="commercial_standard">Commercial / Standard Production</option>
              </select>
            </div>
          </>
        ) : null}

        {technique === "documentary" ? (
          <>
            <div className="editor-field">
              <label htmlFor="opt-doc-shoot">Field Shoot Days</label>
              <input
                id="opt-doc-shoot"
                type="number"
                min="1"
                value={fieldShootDays}
                onChange={(e) => setFieldShootDays(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <div className="editor-field">
              <label htmlFor="opt-doc-edit">Editorial Duration (Weeks)</label>
              <input
                id="opt-doc-edit"
                type="number"
                min="1"
                value={editWeeks}
                onChange={(e) => setEditWeeks(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <div className="editor-field">
              <label htmlFor="opt-doc-archival">Archival Footage (Minutes)</label>
              <input
                id="opt-doc-archival"
                type="number"
                min="0"
                value={archivalMinutes}
                onChange={(e) => setArchivalMinutes(parseFloat(e.target.value) || 0)}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="editor-actions">
        <button type="submit" className="btn-scenarios-primary">
          Apply &amp; Recalculate
        </button>
        <button type="button" className="btn-scenarios-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
