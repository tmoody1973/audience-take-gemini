"use client";

import React, { useState } from "react";
import { PlusCircle, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

interface SuggestEvidenceModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SuggestEvidenceModal({ projectId, isOpen, onClose }: SuggestEvidenceModalProps) {
  const [sourceUrl, setSourceUrl] = useState("");
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sourceUrl: sourceUrl.trim(),
          title: title.trim(),
          publisher: publisher.trim(),
          excerpt: excerpt.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit evidence lead");
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70">
      <div className="bg-paper border-3 border-ink w-full max-w-lg shadow-ticket-lift p-6 sm:p-8 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 border-2 border-ink bg-field-paper hover:bg-acid-yellow text-ink"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 pb-4 border-b-2 border-ink">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-3xl sm:text-4xl uppercase text-ink">
              SUGGEST EVIDENCE LEAD
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-electric-blue text-white border border-ink">
              CITATIONS
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink uppercase">
            Submit a verified public citation, festival program, or trade report.
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center py-4 font-mono">
            <div className="w-12 h-12 bg-evidence-mint border-2 border-ink flex items-center justify-center text-ink mx-auto">
              <CheckCircle2 className="w-7 h-7 text-electric-blue" />
            </div>
            <h4 className="font-headline text-3xl uppercase text-ink">EVIDENCE LEAD RECORDED</h4>
            <p className="text-xs text-muted-ink leading-relaxed">
              Thank you for strengthening this Scout Card. The source will be audited for safe publication.
            </p>
            <Button variant="coral" size="md" onClick={onClose}>
              DONE
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-error-red text-white border-2 border-ink text-xs font-mono font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Source URL *"
              type="url"
              required
              placeholder="https://variety.com/article/... or https://festival.org/film"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Article / Page Title *"
                required
                placeholder="e.g. Festival Lineup Announcement"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                label="Publisher / Outlet *"
                required
                placeholder="e.g. Variety, Deadline, Tribeca"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>

            <Textarea
              label="Relevant Excerpt / Citation Quote *"
              required
              rows={3}
              placeholder="Paste the relevant sentence or quote verifying this claim..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-ink">
              <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isLoading}>
                CANCEL
              </Button>
              <Button variant="coral" size="md" type="submit" isLoading={isLoading}>
                SUBMIT EVIDENCE
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
