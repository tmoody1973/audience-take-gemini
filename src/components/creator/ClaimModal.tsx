"use client";

import React, { useState } from "react";
import { ShieldCheck, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

interface ClaimModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimModal({ projectId, projectTitle, isOpen, onClose }: ClaimModalProps) {
  const [roleTitle, setRoleTitle] = useState("");
  const [proofUrl, setProofUrl] = useState("");
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
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          roleTitle: roleTitle.trim(),
          proofUrl: proofUrl.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Claim verification request failed");
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
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 border-2 border-ink bg-field-paper hover:bg-acid-yellow text-ink"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Masthead */}
        <div className="space-y-1 pb-4 border-b-2 border-ink">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-3xl sm:text-4xl uppercase text-ink">
              CLAIM PROJECT LEADERSHIP
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-evidence-mint text-ink border border-ink">
              VERIFICATION
            </span>
          </div>
          <p className="text-xs font-mono font-bold text-muted-ink uppercase">
            TARGET: <strong className="text-ink">{projectTitle}</strong>
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4 text-center py-4 font-mono">
            <div className="w-12 h-12 bg-evidence-mint border-2 border-ink flex items-center justify-center text-ink mx-auto">
              <CheckCircle2 className="w-7 h-7 text-electric-blue" />
            </div>
            <h4 className="font-headline text-3xl uppercase text-ink">CLAIM SUBMITTED FOR REVIEW</h4>
            <p className="text-xs text-muted-ink leading-relaxed">
              Your claim receipt has been recorded. Once verified via your public credit or proof URL, your official Creator Desk will be activated.
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
              label="Your Credit / Role on Project *"
              required
              placeholder="e.g. Director, Screenwriter, Lead Producer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />

            <Input
              label="Public Proof or Verification URL *"
              type="url"
              required
              placeholder="https://imdb.com/name/nm... or personal website credit"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              helperText="Must show your name and affiliation with this specific project."
            />

            <Textarea
              label="Additional Notes (Optional)"
              rows={3}
              placeholder="Any context regarding upcoming festival premieres or development status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className="p-3 bg-field-paper border-2 border-ink text-xs font-mono text-muted-ink">
              <strong>CREATOR PRIVACY:</strong> Your identity documents are stored in server-isolated records.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-ink">
              <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isLoading}>
                CANCEL
              </Button>
              <Button variant="coral" size="md" type="submit" isLoading={isLoading}>
                SUBMIT CLAIM
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
