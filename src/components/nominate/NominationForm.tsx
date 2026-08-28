"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

export function NominationForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<{ exists: boolean; projectId?: string; title?: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State (Retained across steps & errors)
  const [role, setRole] = useState<"fan" | "creator">("fan");
  const [projectUrl, setProjectUrl] = useState("");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState("");
  const [reason, setReason] = useState("");
  const [audienceNotes, setAudienceNotes] = useState("");
  const [formatNotes, setFormatNotes] = useState("");
  const [supportingLinks, setSupportingLinks] = useState<string[]>([""]);

  const addSupportingLink = () => {
    if (supportingLinks.length < 5) {
      setSupportingLinks([...supportingLinks, ""]);
    }
  };

  const updateSupportingLink = (index: number, val: string) => {
    const next = [...supportingLinks];
    next[index] = val;
    setSupportingLinks(next);
  };

  const removeSupportingLink = (index: number) => {
    setSupportingLinks(supportingLinks.filter((_, i) => i !== index));
  };

  const checkDuplicatesAndProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setDuplicateAlert(null);

    if (!projectUrl.trim()) {
      setFormError("Please provide a valid project URL.");
      return;
    }
    if (reason.trim().length < 10) {
      setFormError("Please share at least 10 characters explaining why this project should grow.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/nominate?checkUrl=${encodeURIComponent(projectUrl.trim())}`);
      const data = await res.json();

      if (res.ok && data.exists) {
        setDuplicateAlert({
          exists: true,
          projectId: data.projectId,
          title: data.title,
        });
        setIsLoading(false);
        return;
      }

      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    setIsLoading(true);
    setFormError(null);

    const filteredSupportingLinks = supportingLinks.map((s) => s.trim()).filter((s) => s.length > 0);

    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectUrl: projectUrl.trim(),
          youtubeVideoUrl: youtubeVideoUrl.trim() || undefined,
          reason: reason.trim(),
          nominatorRole: role,
          audienceNotes: audienceNotes.trim() || undefined,
          formatNotes: formatNotes.trim() || undefined,
          supportingLinks: filteredSupportingLinks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit nomination");
      }

      // Redirect to Research Run
      router.push(`/research/${data.runId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setFormError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Step Indicator: Hard Seam Progress */}
      <div className="grid grid-cols-2 border-3 border-ink bg-paper font-mono text-xs font-bold uppercase shadow-selected-lift">
        <div className={`p-3 flex items-center gap-2 border-r-2 border-ink ${step === 1 ? "bg-acid-yellow text-ink" : "bg-field-paper text-muted-ink"}`}>
          <span className="w-5 h-5 bg-ink text-white flex items-center justify-center">1</span>
          <span>PROJECT INTAKE TICKET</span>
        </div>
        <div className={`p-3 flex items-center gap-2 ${step === 2 ? "bg-acid-yellow text-ink" : "bg-field-paper text-muted-ink"}`}>
          <span className="w-5 h-5 bg-ink text-white flex items-center justify-center">2</span>
          <span>REVIEW & AGENT DISPATCH</span>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-error-red text-white border-3 border-ink text-xs font-mono font-bold flex items-start gap-2 shadow-selected-lift">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong className="block text-sm uppercase">SUBMISSION BLOCKED:</strong>
            {formError}
          </div>
        </div>
      )}

      {duplicateAlert && (
        <div className="p-6 bg-acid-yellow border-3 border-ink text-ink space-y-3 font-mono text-xs shadow-ticket-lift">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 text-signal-coral" />
            <div>
              <h4 className="font-headline text-3xl font-normal uppercase text-ink leading-tight">
                PROJECT ALREADY SCOUTED!
              </h4>
              <p className="text-muted-ink mt-1 text-sm font-sans font-medium">
                "{duplicateAlert.title}" is already live on the Scouting Wall. You can participate in its Audience Pulse or suggest additional evidence leads on its card.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link href={`/scout/${duplicateAlert.projectId}`}>
              <Button variant="coral" size="sm">
                OPEN EXISTING SCOUT CARD
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setDuplicateAlert(null)}>
              EDIT URL
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={checkDuplicatesAndProceed} className="space-y-6 bg-paper p-6 sm:p-10 border-3 border-ink shadow-ticket-lift">
          
          {/* Ticket Masthead */}
          <div className="border-b-3 border-ink pb-4 flex items-center justify-between font-mono text-xs font-bold uppercase">
            <span className="text-signal-coral">OFFICIAL INTAKE TICKET</span>
            <span>OPEN-CALL SUBMISSION</span>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-extrabold uppercase tracking-wider text-ink">
              YOUR RELATIONSHIP TO THE WORK *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("fan")}
                className={`p-4 border-2 border-ink text-left font-mono text-xs transition-all ${
                  role === "fan"
                    ? "bg-acid-yellow text-ink shadow-selected-lift"
                    : "bg-field-paper text-muted-ink hover:bg-paper"
                }`}
              >
                <span className="block font-headline text-2xl uppercase text-ink mb-1">
                  FAN SCOUT
                </span>
                I discovered this public work and want to see it grow.
              </button>

              <button
                type="button"
                onClick={() => setRole("creator")}
                className={`p-4 border-2 border-ink text-left font-mono text-xs transition-all ${
                  role === "creator"
                    ? "bg-acid-yellow text-ink shadow-selected-lift"
                    : "bg-field-paper text-muted-ink hover:bg-paper"
                }`}
              >
                <span className="block font-headline text-2xl uppercase text-ink mb-1">
                  CREATOR / PRODUCER
                </span>
                I made or produced this work and want audience signals.
              </button>
            </div>
          </div>

          {/* Project URL */}
          <Input
            label="Public Project or Campaign URL *"
            type="url"
            required
            placeholder="https://kickstarter.com/... or https://myfilm.com or https://vimeo.com/..."
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            helperText="The primary public landing page, crowdfunding page, or portfolio site."
          />

          {/* Optional YouTube Video */}
          <Input
            label="YouTube Trailer / Proof-of-Concept URL (Optional)"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeVideoUrl}
            onChange={(e) => setYoutubeVideoUrl(e.target.value)}
            helperText="Enables multimodal Trailer Critic analysis and card video embed."
          />

          {/* Why Scouted Reason */}
          <Textarea
            label="Why should this project grow? *"
            required
            rows={4}
            placeholder="Describe what makes this story, aesthetic, or proof of concept stand out..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            helperText="Minimum 10 characters. This reason will be cited directly on the Scout Card."
          />

          {/* Optional Format & Audience notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Format / Medium Ideas (Optional)"
              placeholder="e.g. Feature expansion, 6-part docuseries"
              value={formatNotes}
              onChange={(e) => setFormatNotes(e.target.value)}
            />
            <Input
              label="Target Audience (Optional)"
              placeholder="e.g. A24 horror fans, anime enthusiasts"
              value={audienceNotes}
              onChange={(e) => setAudienceNotes(e.target.value)}
            />
          </div>

          {/* Supporting Links */}
          <div className="space-y-3 pt-3 border-t-2 border-ink">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-extrabold uppercase tracking-wider text-ink">
                Supporting Public Links (Up to 5)
              </label>
              {supportingLinks.length < 5 && (
                <button
                  type="button"
                  onClick={addSupportingLink}
                  className="text-xs font-mono font-bold text-electric-blue hover:text-ink inline-flex items-center gap-1 uppercase"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Link
                </button>
              )}
            </div>
            <p className="text-xs font-mono text-muted-ink">
              Press mentions, festival programs, social announcements, or creator credits.
            </p>

            {supportingLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder={`https://press-article-${idx + 1}.org`}
                  value={link}
                  onChange={(e) => updateSupportingLink(idx, e.target.value)}
                  className="w-full bg-field-paper border-2 border-ink px-3.5 py-2.5 text-xs font-mono text-ink placeholder:text-muted-ink/60 focus:outline-none"
                />
                {supportingLinks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupportingLink(idx)}
                    className="p-2 border-2 border-ink bg-field-paper text-muted-ink hover:text-error-red hover:bg-error-red/10"
                    aria-label="Remove link"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-ink flex justify-end">
            <Button variant="coral" size="lg" type="submit" isLoading={isLoading} className="gap-2">
              <span>REVIEW NOMINATION TICKET</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-6 bg-paper p-6 sm:p-10 border-3 border-ink shadow-ticket-lift">
          <div className="space-y-2 pb-4 border-b-3 border-ink">
            <h3 className="font-headline text-4xl sm:text-5xl font-normal uppercase tracking-tight text-ink leading-tight">
              REVIEW BEFORE DISPATCHING AGENT
            </h3>
            <p className="text-xs font-mono font-bold text-muted-ink uppercase">
              Verify your submitted information before our Gemini research agent begins investigation.
            </p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-field-paper border-2 border-ink">
              <span className="text-muted-ink block text-[10px] uppercase font-bold">Nominator Role</span>
              <span className="text-ink font-bold uppercase">{role === "fan" ? "Fan Scout" : "Creator / Producer"}</span>
            </div>

            <div className="p-3 bg-field-paper border-2 border-ink">
              <span className="text-muted-ink block text-[10px] uppercase font-bold">Project URL</span>
              <span className="text-electric-blue font-bold break-all">{projectUrl}</span>
            </div>

            {youtubeVideoUrl && (
              <div className="p-3 bg-field-paper border-2 border-ink">
                <span className="text-muted-ink block text-[10px] uppercase font-bold">Trailer Link</span>
                <span className="text-signal-coral font-bold break-all">{youtubeVideoUrl}</span>
              </div>
            )}

            <div className="p-3 bg-field-paper border-2 border-ink">
              <span className="text-muted-ink block text-[10px] uppercase font-bold">Why It Should Grow</span>
              <p className="text-ink font-sans text-sm mt-1 leading-relaxed">{reason}</p>
            </div>

            {supportingLinks.filter((s) => s.trim().length > 0).length > 0 && (
              <div className="p-3 bg-field-paper border-2 border-ink space-y-1">
                <span className="text-muted-ink block text-[10px] uppercase font-bold">Supporting Evidence Leads</span>
                <ul className="list-disc list-inside text-ink space-y-0.5">
                  {supportingLinks.filter((s) => s.trim().length > 0).map((l, i) => (
                    <li key={i} className="break-all">{l}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-4 bg-acid-yellow border-2 border-ink text-ink text-xs font-mono font-bold flex items-center gap-3">
            <Sparkles className="w-6 h-6 flex-shrink-0 text-signal-coral" />
            <div>
              <strong>WHAT HAPPENS NEXT:</strong> Our autonomous Gemini 2.5 research agent will inspect public sources, construct an evidence ledger, synthesize 3 bounded pathways, and publish an inspectable Scout Card.
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t-2 border-ink">
            <Button variant="secondary" size="md" onClick={() => setStep(1)} disabled={isLoading} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>BACK & EDIT</span>
            </Button>
            <Button variant="coral" size="lg" onClick={handleSubmitFinal} isLoading={isLoading} className="gap-2">
              <Sparkles className="w-5 h-5" />
              <span>DISPATCH SCOUT AGENT</span>
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
