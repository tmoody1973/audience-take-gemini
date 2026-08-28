"use client";

import React, { useState } from "react";
import { Flag, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";

interface ReportModalProps {
  targetType: "project" | "take" | "reply" | "evidence" | "creator_update";
  targetId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, isOpen, onClose }: ReportModalProps) {
  const [category, setCategory] = useState<
    "spam" | "harassment" | "misinformation" | "copyright" | "other"
  >("misinformation");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          category,
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
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
            <h3 className="font-headline text-3xl sm:text-4xl uppercase text-ink flex items-center gap-2">
              <Flag className="w-6 h-6 text-signal-coral" />
              REPORT AUDIT CONCERN
            </h3>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink uppercase">
            TARGET: {targetType.toUpperCase()} #{targetId.slice(0, 8)}
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center py-4 font-mono">
            <div className="w-12 h-12 bg-evidence-mint border-2 border-ink flex items-center justify-center text-ink mx-auto">
              <CheckCircle2 className="w-7 h-7 text-electric-blue" />
            </div>
            <h4 className="font-headline text-3xl uppercase text-ink">REPORT RECEIVED</h4>
            <p className="text-xs text-muted-ink leading-relaxed">
              Thank you for keeping our public scouting program accurate and trustworthy.
            </p>
            <Button variant="coral" size="md" onClick={onClose}>
              DONE
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {error && (
              <div className="p-3 bg-error-red text-white border-2 border-ink font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-ink">
                REPORT CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value as "spam" | "harassment" | "misinformation" | "copyright" | "other"
                  )
                }
                className="w-full bg-field-paper border-2 border-ink p-3 text-xs font-mono font-bold text-ink uppercase focus:outline-none"
              >
                <option value="misinformation">MISINFORMATION / UNGROUNDED CLAIM</option>
                <option value="copyright">COPYRIGHT / ATTRIBUTION DISPUTE</option>
                <option value="harassment">HARASSMENT / ABUSIVE CONTENT</option>
                <option value="spam">SPAM / PROMOTIONAL ABUSE</option>
                <option value="other">OTHER CONCERN</option>
              </select>
            </div>

            <Textarea
              label="Explanation & Supporting Citation (Optional)"
              rows={4}
              placeholder="Provide context or links proving why this item requires correction or review..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-ink">
              <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isLoading}>
                CANCEL
              </Button>
              <Button variant="destructive" size="md" type="submit" isLoading={isLoading}>
                SUBMIT REPORT
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
