"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Menu, X } from "lucide-react";

interface NavbarProps {
  user?: { displayName: string; email?: string } | null;
  onSignOut?: () => void;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full bg-paper border-b-3 border-ink">
      <div className="max-w-7xl mx-auto flex items-stretch justify-between">
        
        {/* Brand: Stacked AUDIENCE TAKE */}
        <Link
          href="/"
          className="px-6 py-2 border-r-3 border-ink flex flex-col justify-center font-display text-4xl leading-[0.8] tracking-tight uppercase hover:text-signal-coral transition-colors"
        >
          <span>AUDIENCE</span>
          <span>TAKE</span>
        </Link>

        {/* Desktop Program Navigation */}
        <nav className="hidden lg:flex flex-1 items-stretch text-[11px] font-mono font-bold uppercase">
          <Link
            href="/"
            className="px-4 py-3 bg-acid-yellow border-r-2 border-ink flex items-center gap-1.5 text-ink leading-none font-black"
          >
            <span className="text-ink">01</span>
            <span>PUBLIC CINEMA SCOUTING</span>
          </Link>
          <Link
            href="/#scouting-wall"
            className="px-4 py-3 border-r-2 border-ink flex items-center gap-1.5 text-ink hover:bg-acid-yellow transition-colors leading-none"
          >
            <span className="text-muted-ink">02</span>
            <span>SCOUTING WALL</span>
          </Link>
          <Link
            href="/#the-selects"
            className="px-4 py-3 border-r-2 border-ink flex items-center gap-1.5 text-ink hover:bg-acid-yellow transition-colors leading-none"
          >
            <span className="text-muted-ink">03</span>
            <span>THE SELECTS</span>
          </Link>
          <Link
            href="/#how-it-works"
            className="px-4 py-3 border-r-2 border-ink flex items-center gap-1.5 text-ink hover:bg-acid-yellow transition-colors leading-none"
          >
            <span className="text-muted-ink">04</span>
            <span>HOW IT WORKS</span>
          </Link>
          <Link
            href="/creator"
            className="px-4 py-3 border-r-2 border-ink flex items-center gap-1.5 text-ink hover:bg-acid-yellow transition-colors leading-none"
          >
            <span className="text-muted-ink">05</span>
            <span>ABOUT</span>
          </Link>
        </nav>

        {/* Right Action Group: SEARCH & 06 NOMINATE */}
        <div className="hidden md:flex items-stretch font-mono text-xs font-bold uppercase">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="px-4 border-l-2 border-r-2 border-ink flex items-center gap-1.5 text-ink hover:bg-acid-yellow transition-colors"
          >
            <span>SEARCH</span>
            <Search className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/nominate"
            className="px-6 bg-signal-coral hover:bg-ink text-white font-black flex items-center gap-2 transition-colors"
          >
            <span>06</span>
            <span>NOMINATE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center px-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-ink bg-paper"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Expandable Search Drawer */}
      {searchOpen && (
        <div className="border-t-2 border-ink bg-[#fffdf7] p-4 max-w-7xl mx-auto flex items-center gap-3">
          <Search className="w-5 h-5 text-signal-coral flex-shrink-0" />
          <form action="/" method="GET" className="flex-1 flex gap-2">
            <input
              type="text"
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search public cinema dossiers, creators, or keywords..."
              className="flex-1 px-3 py-2 bg-paper border-2 border-ink font-mono text-xs text-ink focus:outline-none focus:bg-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-ink text-white font-mono text-xs font-bold uppercase hover:bg-signal-coral"
            >
              SEARCH
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-ink bg-paper p-4 space-y-2 font-mono text-xs font-bold uppercase">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2.5 bg-acid-yellow border border-ink text-ink"
          >
            01 PUBLIC CINEMA SCOUTING
          </Link>
          <Link
            href="/#scouting-wall"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2.5 bg-field-paper border border-ink text-ink hover:bg-acid-yellow"
          >
            02 SCOUTING WALL
          </Link>
          <Link
            href="/#the-selects"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2.5 bg-field-paper border border-ink text-ink hover:bg-acid-yellow"
          >
            03 THE SELECTS
          </Link>
          <Link
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2.5 bg-field-paper border border-ink text-ink hover:bg-acid-yellow"
          >
            04 HOW IT WORKS
          </Link>
          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-2.5 bg-field-paper border border-ink text-ink hover:bg-acid-yellow"
          >
            05 ABOUT
          </Link>
          <Link
            href="/nominate"
            onClick={() => setMobileMenuOpen(false)}
            className="block p-3 bg-signal-coral text-white text-center font-black border border-ink"
          >
            06 NOMINATE A PROJECT →
          </Link>
        </div>
      )}
    </header>
  );
}
