"use client";

import React, { useState } from "react";
import {
  Film,
  ChevronDown,
  ChevronUp,
  Volume2,
  Camera,
  Scissors,
  Type,
  AlertCircle,
  Clock,
  Activity,
  Heart,
  Sparkles,
} from "lucide-react";
import type { TrailerCritic } from "@/domain";
import { Badge } from "../ui/Badge";

interface TrailerCriticViewProps {
  critic: TrailerCritic;
}

export function TrailerCriticView({ critic }: TrailerCriticViewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section aria-label="Trailer Critic Analysis" className="border-3 border-ink bg-paper shadow-ticket-lift overflow-hidden">
      
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-6 py-5 flex items-center justify-between bg-paper hover:bg-field-paper transition-colors text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-acid-yellow border-2 border-ink flex items-center justify-center text-ink font-bold">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline text-3xl font-normal uppercase text-ink">
                TRAILER CRITIC BREAKDOWN
              </h3>
              <Badge variant="blue">GEMINI 3.7 FLASH MULTIMODAL</Badge>
            </div>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase mt-0.5">
              Independent video craft, sound design, and narrative beat analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-extrabold uppercase text-signal-coral">
          <span>{isOpen ? "COLLAPSE ANALYSIS" : "EXPAND BREAKDOWN"}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t-2 border-ink space-y-6 bg-paper">
          
          {/* Summary & Form Hook */}
          <div className="p-5 bg-field-paper border-2 border-ink space-y-3 font-mono shadow-selected-lift">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink pb-2">
              <span className="text-xs uppercase font-extrabold text-signal-coral flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {critic.genreAndForm}
              </span>
              <span className="text-[10px] text-muted-ink uppercase font-bold">
                ANALYZED VIA {critic.model || "GEMINI-3.7-FLASH"}
              </span>
            </div>
            <p className="text-sm font-sans text-ink leading-relaxed font-medium">
              {critic.summary}
            </p>
            <div className="pt-2 border-t border-ink/20">
              <span className="text-[11px] font-extrabold text-ink uppercase block mb-1">
                WHY IT MAY CONNECT WITH AUDIENCES:
              </span>
              <p className="text-xs text-muted-ink font-sans leading-relaxed">
                {critic.whyItMayConnect}
              </p>
            </div>
          </div>

          {/* Critic Matrix (1-10 Scores) */}
          <div className="space-y-3">
            <h4 className="font-headline text-3xl uppercase text-ink flex items-center gap-2">
              <Activity className="w-6 h-6 text-signal-coral" />
              CRAFT & AUDIENCE IMPACT MATRIX
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="p-4 bg-field-paper border-2 border-ink text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-ink block">
                  CLARITY
                </span>
                <span className="font-headline text-4xl text-ink">
                  {critic.criticMatrix.clarity}
                </span>
                <span className="text-[10px] font-mono text-muted-ink block">/ 10</span>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-ink block">
                  TONE CONSISTENCY
                </span>
                <span className="font-headline text-4xl text-electric-blue">
                  {critic.criticMatrix.toneConsistency}
                </span>
                <span className="text-[10px] font-mono text-muted-ink block">/ 10</span>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-ink block">
                  VISUAL ORIGINALITY
                </span>
                <span className="font-headline text-4xl text-signal-coral">
                  {critic.criticMatrix.visualOriginality}
                </span>
                <span className="text-[10px] font-mono text-muted-ink block">/ 10</span>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink text-center space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-ink block">
                  NARRATIVE TENSION
                </span>
                <span className="font-headline text-4xl text-ink">
                  {critic.criticMatrix.narrativeTension}
                </span>
                <span className="text-[10px] font-mono text-muted-ink block">/ 10</span>
              </div>

            </div>
          </div>

          {/* Timestamped Narrative & Craft Beats */}
          <div className="space-y-3">
            <h4 className="font-headline text-3xl uppercase text-ink flex items-center gap-2">
              <Clock className="w-6 h-6 text-signal-coral" />
              TIMESTAMPTED BEAT BREAKDOWN
            </h4>
            <div className="border-2 border-ink bg-field-paper divide-y-2 divide-ink">
              {critic.timestampedBeats.map((beat, i) => (
                <div key={i} className="p-4 flex items-start gap-4 text-xs font-mono">
                  <span className="px-2 py-1 bg-acid-yellow border border-ink text-ink font-extrabold flex-shrink-0">
                    {beat.timestampFormatted}
                  </span>
                  <div className="space-y-1 flex-1">
                    <strong className="text-ink uppercase block text-sm font-bold">
                      {beat.label}
                    </strong>
                    <p className="text-muted-ink font-sans text-xs leading-relaxed">
                      {beat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Craft Technical Breakdown (4 Columns) */}
          <div className="space-y-3">
            <h4 className="font-headline text-3xl uppercase text-ink flex items-center gap-2">
              <Camera className="w-6 h-6 text-signal-coral" />
              TECHNICAL CRAFT EVALUATION
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 bg-field-paper border-2 border-ink space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-signal-coral font-bold uppercase pb-1 border-b border-ink/20">
                  <Camera className="w-4 h-4" />
                  Cinematography & Framing
                </div>
                <p className="text-ink font-sans leading-relaxed pt-1">
                  {critic.craftAnalysis.cinematography}
                </p>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-electric-blue font-bold uppercase pb-1 border-b border-ink/20">
                  <Volume2 className="w-4 h-4" />
                  Sound Design & Score
                </div>
                <p className="text-ink font-sans leading-relaxed pt-1">
                  {critic.craftAnalysis.soundAndScore}
                </p>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-ink font-bold uppercase pb-1 border-b border-ink/20">
                  <Scissors className="w-4 h-4" />
                  Editing & Rhythmic Pacing
                </div>
                <p className="text-ink font-sans leading-relaxed pt-1">
                  {critic.craftAnalysis.editingAndPacing}
                </p>
              </div>

              <div className="p-4 bg-field-paper border-2 border-ink space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-muted-ink font-bold uppercase pb-1 border-b border-ink/20">
                  <Type className="w-4 h-4" />
                  Graphics & Title Typography
                </div>
                <p className="text-ink font-sans leading-relaxed pt-1">
                  {critic.craftAnalysis.graphicsAndText}
                </p>
              </div>

            </div>
          </div>

          {/* Emotional & Persuasion Arc */}
          <div className="space-y-3">
            <h4 className="font-headline text-3xl uppercase text-ink flex items-center gap-2">
              <Heart className="w-6 h-6 text-signal-coral" />
              EMOTIONAL & RHETORICAL ARC
            </h4>
            <div className="p-5 bg-field-paper border-2 border-ink space-y-2 text-xs font-mono shadow-selected-lift">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-ink">
                <span>TARGET PERSONA: <strong className="text-ink uppercase">{critic.persuasionAndEmotion.targetPersona}</strong></span>
                <span>CALL TO ACTION: <strong className="text-signal-coral uppercase">{critic.persuasionAndEmotion.callToAction}</strong></span>
              </div>
              <p className="text-ink font-sans text-sm leading-relaxed pt-1">
                {critic.persuasionAndEmotion.emotionalArc}
              </p>
            </div>
          </div>

          {/* Limitations Disclaimer */}
          <div className="p-4 bg-acid-yellow border-2 border-ink text-ink text-xs font-mono font-bold flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-signal-coral mt-0.5" />
            <p>
              <strong>EVALUATION DISCLAIMER:</strong> {critic.limitations}
            </p>
          </div>

        </div>
      )}
    </section>
  );
}
