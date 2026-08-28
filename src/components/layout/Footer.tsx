import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-ink text-paper border-t-3 border-ink mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl sm:text-5xl font-normal text-white uppercase tracking-tight">
                AUDIENCE TAKE
              </span>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-acid-yellow text-ink border border-ink">
                PUBLIC PROGRAM
              </span>
            </div>
            
            <p className="text-xs text-[#d7d1c6] max-w-md leading-relaxed font-sans font-normal">
              The audience’s take on what should be made next. Surface an overlooked public project, then watch autonomous Gemini research and verified Parallel web citations turn it into an actionable Scout Card.
            </p>

            <div className="p-2.5 bg-paper/5 border border-[#615e56] text-xs font-mono font-bold text-acid-yellow inline-flex items-center gap-2 max-w-md">
              <Sparkles className="w-3.5 h-3.5 text-signal-coral flex-shrink-0" />
              <span>An open-source research initiative powered by Google Gemini & Parallel.</span>
            </div>
          </div>

          {/* Col 2: Program Directory */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <h4 className="font-black uppercase tracking-wider text-acid-yellow border-b border-[#615e56] pb-1">
              ✦ PROGRAM DIRECTORY
            </h4>
            <ul className="space-y-1.5 text-[#d7d1c6]">
              <li>
                <Link href="/#scouting-wall" className="hover:text-acid-yellow transition-colors">
                  ▸ 01 Scouting Wall
                </Link>
              </li>
              <li>
                <Link href="/#the-selects" className="hover:text-acid-yellow transition-colors">
                  ▸ 02 The Selects
                </Link>
              </li>
              <li>
                <Link href="/critic" className="hover:text-acid-yellow transition-colors">
                  ▸ 03 Trailer Critic Studio
                </Link>
              </li>
              <li>
                <Link href="/nominate" className="hover:text-acid-yellow transition-colors">
                  ▸ 04 Nominate a Project
                </Link>
              </li>
              <li>
                <Link href="/creator" className="hover:text-acid-yellow transition-colors">
                  ▸ 05 Creator Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Connect & Documentation */}
          <div className="md:col-span-3 space-y-3 font-mono text-xs">
            <h4 className="font-black uppercase tracking-wider text-electric-blue border-b border-[#615e56] pb-1">
              ✦ CONNECT
            </h4>
            <ul className="space-y-1.5 text-[#d7d1c6]">
              <li>
                <a href="https://github.com/tmoody1973/audience-take-gemini" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  ▸ GitHub Repository
                </a>
              </li>
              <li>
                <Link href="/creator" className="hover:text-white transition-colors">
                  ▸ Filmmaker Policy & Trust
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  ▸ Autonomous Agent Pipeline
                </a>
              </li>
              <li>
                <a href="https://parallel.ai" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  ▸ Parallel Search API
                </a>
              </li>
              <li>
                <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  ▸ Google Gemini Models
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="border-t border-[#615e56] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#aaa69e] font-mono font-bold">
          <p>© {new Date().getFullYear()} AUDIENCE TAKE · ALL RIGHTS RESERVED · PUBLIC RESEARCH DATA</p>
          <p className="mt-2 sm:mt-0 text-acid-yellow uppercase font-black">
            ALL CITED SOURCES VERIFIED VIA PARALLEL SEARCH.
          </p>
        </div>
      </div>
    </footer>
  );
}
