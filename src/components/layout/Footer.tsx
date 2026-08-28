import React from "react";
import Link from "next/link";
import { Shield, Sparkles, BookOpen, AlertCircle, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t-3 border-ink bg-ink text-paper mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl font-normal text-white uppercase tracking-tight">
                AUDIENCE TAKE
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-acid-yellow text-ink border border-ink">
                PUBLIC PROGRAM
              </span>
            </div>
            <p className="text-sm text-paper/80 max-w-md leading-relaxed font-sans">
              The audience’s take on what should be made next. Find an overlooked screen story, nominate its public URL, and watch autonomous Gemini agents turn public evidence into an actionable Scout Card.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-ink bg-acid-yellow px-2.5 py-1 border border-ink">
              <Sparkles className="w-3.5 h-3.5 text-signal-coral" />
              <span>Powered by Gemini 3.5/3.7 & Parallel Web Systems</span>
            </div>
          </div>

          {/* Col 2: Product Truth Principles */}
          <div className="space-y-2 font-mono text-xs text-paper/90">
            <h4 className="font-extrabold uppercase tracking-wider text-acid-yellow border-b border-paper/30 pb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-signal-coral" />
              Program Invariants
            </h4>
            <ul className="space-y-1.5 text-paper/70 font-medium">
              <li>• Zero opaque greenlight scores</li>
              <li>• Strict primary citation grounding</li>
              <li>• Medium concordance enforcement</li>
              <li>• Immutable version receipts</li>
              <li>• Native pulse vs external hype separation</li>
            </ul>
          </div>

          {/* Col 3: Navigation & Index */}
          <div className="space-y-2 font-mono text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-acid-yellow border-b border-paper/30 pb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-electric-blue" />
              Directory
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="text-paper hover:text-acid-yellow transition-colors flex items-center gap-1">
                  <span>01 Public Scouting Wall</span>
                </Link>
              </li>
              <li>
                <Link href="/#selects" className="text-paper hover:text-acid-yellow transition-colors flex items-center gap-1">
                  <span>02 The Selects</span>
                </Link>
              </li>
              <li>
                <Link href="/nominate" className="text-paper hover:text-acid-yellow transition-colors flex items-center gap-1">
                  <span>03 Nominate a Project</span>
                </Link>
              </li>
              <li>
                <Link href="/creator" className="text-paper hover:text-acid-yellow transition-colors flex items-center gap-1">
                  <span>04 Creator Desk</span>
                </Link>
              </li>
              <li>
                <Link href="/critic" className="text-paper hover:text-acid-yellow transition-colors flex items-center gap-1">
                  <span>05 Trailer Critic</span>
                </Link>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-paper/20 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-paper/60 font-mono font-bold">
          <p>© {new Date().getFullYear()} AUDIENCE TAKE. THE PUBLIC SCOUTING PROGRAM FOR CINEMA.</p>
          <p className="mt-2 sm:mt-0 text-acid-yellow">ALL CLAIMS BOUNDED BY VERIFIED CITATIONS.</p>
        </div>
      </div>
    </footer>
  );
}
