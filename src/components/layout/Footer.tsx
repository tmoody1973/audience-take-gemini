import React from "react";
import Link from "next/link";
import { Shield, Sparkles, BookOpen, AlertCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t-3 border-ink bg-paper mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-4xl font-normal text-ink uppercase tracking-tight">
                AUDIENCE TAKE
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
                Program Receipt
              </span>
            </div>
            <p className="text-sm text-muted-ink max-w-md leading-relaxed font-sans">
              The audience's take on what should be made next. Transforming public screen projects into inspectable, cited Scout Cards powered by Google Gemini and authentic fan commitments.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-ink bg-evidence-mint px-2 py-1 border-2 border-ink">
              <Sparkles className="w-3.5 h-3.5 text-electric-blue" />
              <span>Built with Google Antigravity & Gemini Enterprise Platform</span>
            </div>
          </div>

          {/* Col 2: Product Truth Principles */}
          <div className="space-y-2 font-mono text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-ink border-b-2 border-ink pb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-signal-coral" />
              Program Rules
            </h4>
            <ul className="space-y-1.5 text-muted-ink font-bold">
              <li>• Zero opaque greenlight scores</li>
              <li>• Strict primary citation grounding</li>
              <li>• Medium concordance enforcement</li>
              <li>• Immutable version receipts</li>
              <li>• Native pulse vs external hype separation</li>
            </ul>
          </div>

          {/* Col 3: Navigation & Trust */}
          <div className="space-y-2 font-mono text-xs">
            <h4 className="font-extrabold uppercase tracking-wider text-ink border-b-2 border-ink pb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-electric-blue" />
              Index
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/" className="text-ink hover:bg-acid-yellow px-1 transition-colors">
                  01 Public Scouting Wall
                </Link>
              </li>
              <li>
                <Link href="/creator" className="text-ink hover:bg-acid-yellow px-1 transition-colors">
                  02 Creator Desk & Claims
                </Link>
              </li>
              <li>
                <Link href="/nominate" className="text-ink hover:bg-acid-yellow px-1 transition-colors">
                  03 Nominate a Project
                </Link>
              </li>
              <li className="flex items-center gap-1 text-muted-ink pt-1">
                <AlertCircle className="w-3 h-3 text-signal-coral" />
                <span>WCAG 2.2 AA Compliant</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t-2 border-ink mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-ink font-mono font-bold">
          <p>© {new Date().getFullYear()} AUDIENCE TAKE. OPEN CLEAN-ROOM PROVENANCE ARCHITECTURE.</p>
          <p className="mt-2 sm:mt-0">ALL CLAIMS BOUNDED BY PRIMARY CITATIONS.</p>
        </div>
      </div>
    </footer>
  );
}
