"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, CornerDownRight, User, Flag } from "lucide-react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import type { Take, Reply } from "@/domain";
import { clsx } from "clsx";

interface TakesSectionProps {
  projectId: string;
  initialTakes?: Take[];
  onOpenReport?: (type: "take" | "reply", id: string) => void;
}

export function TakesSection({ projectId, initialTakes = [], onOpenReport }: TakesSectionProps) {
  const [takes, setTakes] = useState<Take[]>(initialTakes);
  const [takeBody, setTakeBody] = useState("");
  const [pathwayAlignment, setPathwayAlignment] = useState<number | null>(null);
  const [isSubmittingTake, setIsSubmittingTake] = useState(false);

  const [replyBodies, setReplyBodies] = useState<Record<string, string>>({});
  const [repliesMap, setRepliesMap] = useState<Record<string, Reply[]>>({});
  const [activeReplyTakeId, setActiveReplyTakeId] = useState<string | null>(null);

  const fetchTakes = useCallback(async () => {
    try {
      const res = await fetch(`/api/pulse?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok && data.takes) {
        setTakes(data.takes);
      }
    } catch (err) {
      console.error("Failed to load takes", err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTakes();
  }, [fetchTakes]);

  const handleSubmitTake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!takeBody.trim()) return;

    setIsSubmittingTake(true);
    try {
      const res = await fetch("/api/pulse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "take",
          projectId,
          body: takeBody.trim(),
          pathwayAlignment,
        }),
      });
      const data = await res.json();
      if (res.ok && data.take) {
        setTakes([data.take, ...takes]);
        setTakeBody("");
        setPathwayAlignment(null);
      }
    } catch (err) {
      console.error("Submit take error", err);
    } finally {
      setIsSubmittingTake(false);
    }
  };

  const handleSubmitReply = async (takeId: string) => {
    const body = replyBodies[takeId];
    if (!body || !body.trim()) return;

    try {
      const res = await fetch("/api/pulse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reply",
          takeId,
          projectId,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.reply) {
        setRepliesMap((prev) => ({
          ...prev,
          [takeId]: [...(prev[takeId] || []), data.reply],
        }));
        setReplyBodies((prev) => ({ ...prev, [takeId]: "" }));
        setActiveReplyTakeId(null);
      }
    } catch (err) {
      console.error("Submit reply error", err);
    }
  };

  return (
    <section aria-label="Audience Takes & Discussion" className="border-3 border-ink bg-paper p-6 sm:p-8 shadow-ticket-lift space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-ink font-mono">
        <div>
          <h3 className="font-headline text-4xl font-normal uppercase text-ink flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-signal-coral" />
            AUDIENCE TAKES ({takes.length})
          </h3>
          <p className="text-xs font-bold text-muted-ink mt-1 uppercase">
            Structured fan reviews and analysis. 1 published Take per verified scout.
          </p>
        </div>
      </div>

      {/* Author New Take Form */}
      <form onSubmit={handleSubmitTake} className="p-5 bg-field-paper border-2 border-ink space-y-4 shadow-selected-lift">
        <Textarea
          placeholder="Write your structured Take on this project's potential, craft, or pathways..."
          rows={3}
          value={takeBody}
          onChange={(e) => setTakeBody(e.target.value)}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono font-bold">
          {/* Optional Pathway Alignment */}
          <div className="flex items-center gap-2">
            <span className="text-muted-ink uppercase">ALIGN WITH:</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((pIdx) => (
                <button
                  type="button"
                  key={pIdx}
                  onClick={() => setPathwayAlignment(pathwayAlignment === pIdx ? null : pIdx)}
                  className={clsx(
                    "px-2.5 py-1 border-2 border-ink text-xs uppercase font-headline transition-all",
                    pathwayAlignment === pIdx
                      ? "bg-acid-yellow text-ink shadow-selected-lift"
                      : "bg-paper text-muted-ink hover:text-ink"
                  )}
                >
                  Pathway 0{pIdx + 1}
                </button>
              ))}
            </div>
          </div>

          <Button variant="coral" size="sm" type="submit" isLoading={isSubmittingTake} disabled={!takeBody.trim()} className="gap-1.5 text-xl">
            <Send className="w-4 h-4" />
            PUBLISH TAKE
          </Button>
        </div>
      </form>

      {/* Takes Feed */}
      <div className="space-y-4">
        {takes.map((take) => (
          <article key={take.id} className="p-5 bg-field-paper border-2 border-ink space-y-3 shadow-selected-lift">
            
            {/* Take Header */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-paper border-2 border-ink flex items-center justify-center text-signal-coral">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-extrabold uppercase text-ink">{take.authorDisplayName}</span>
                <span className="text-muted-ink font-bold">• {new Date(take.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-2">
                {take.pathwayAlignment !== null && (
                  <span className="px-2 py-0.5 bg-acid-yellow text-ink border border-ink text-[11px] font-extrabold uppercase">
                    ALIGNED: PATHWAY 0{take.pathwayAlignment + 1}
                  </span>
                )}
                {onOpenReport && (
                  <button
                    onClick={() => onOpenReport("take", take.id)}
                    className="p-1 border border-ink bg-paper hover:bg-error-red hover:text-white"
                    title="Report Take"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Take Body */}
            <p className="text-sm text-ink font-sans leading-relaxed">
              {take.body}
            </p>

            {/* Replies Section */}
            <div className="pt-2 border-t-2 border-ink space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveReplyTakeId(activeReplyTakeId === take.id ? null : take.id)}
                  className="text-ink hover:text-signal-coral font-bold flex items-center gap-1 focus:outline-none uppercase"
                >
                  <CornerDownRight className="w-3.5 h-3.5" />
                  REPLY TO TAKE
                </button>
              </div>

              {/* Reply Authoring Input */}
              {activeReplyTakeId === take.id && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="WRITE A CONCISE REPLY..."
                    value={replyBodies[take.id] || ""}
                    onChange={(e) => setReplyBodies({ ...replyBodies, [take.id]: e.target.value })}
                    className="flex-1 bg-paper border-2 border-ink px-3 py-2 text-xs font-mono text-ink placeholder:text-muted-ink/60 focus:outline-none"
                  />
                  <Button variant="coral" size="sm" onClick={() => handleSubmitReply(take.id)}>
                    SEND
                  </Button>
                </div>
              )}

              {/* Render Nested Replies */}
              {(repliesMap[take.id] || []).map((reply) => (
                <div key={reply.id} className="pl-6 border-l-3 border-ink py-1 space-y-0.5 text-xs">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-muted-ink">
                    <span className="text-ink uppercase">{reply.authorDisplayName}</span>
                    <span>• {new Date(reply.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-ink font-sans">{reply.body}</p>
                </div>
              ))}
            </div>

          </article>
        ))}

        {takes.length === 0 && (
          <div className="p-8 text-center text-muted-ink font-mono text-xs font-bold uppercase border-2 border-dashed border-ink bg-field-paper">
            NO TAKES PUBLISHED YET. BE THE FIRST SCOUT TO PUBLISH A STRUCTURED REVIEW!
          </div>
        )}
      </div>

    </section>
  );
}
