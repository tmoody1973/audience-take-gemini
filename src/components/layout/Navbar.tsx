"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Menu, X, PlusCircle, User, LogOut } from "lucide-react";

interface NavbarProps {
  user?: { displayName: string; email?: string } | null;
  onSignOut?: () => void;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-paper border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand: Reticle + AUDIENCE TAKE */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl text-ink font-bold leading-none select-none">⌖</span>
          <Link href="/" className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-ink uppercase leading-none hover:text-signal-coral transition-colors">
            AUDIENCE TAKE
          </Link>
        </div>

        {/* Numbered Program Navigation */}
        <nav className="hidden lg:flex items-center text-[11px] font-mono font-bold uppercase h-16">
          <Link
            href="/creator"
            className="px-4 h-full flex flex-col justify-center border-l border-ink text-ink hover:bg-acid-yellow transition-colors leading-tight"
          >
            <span className="text-[9px] text-electric-blue font-extrabold">01</span>
            <span>PROGRAM</span>
          </Link>
          <Link
            href="/"
            className="px-4 h-full flex flex-col justify-center border-l border-ink text-ink hover:bg-acid-yellow transition-colors leading-tight"
          >
            <span className="text-[9px] text-muted-ink font-extrabold">02</span>
            <span>SCOUTING WALL</span>
          </Link>
          <Link
            href="/#selects"
            className="px-4 h-full flex flex-col justify-center border-l border-ink text-ink hover:bg-acid-yellow transition-colors leading-tight"
          >
            <span className="text-[9px] text-muted-ink font-extrabold">03</span>
            <span>THE SELECTS</span>
          </Link>
          <Link
            href="/critic"
            className="px-4 h-full flex flex-col justify-center border-l border-ink text-ink hover:bg-acid-yellow transition-colors leading-tight"
          >
            <span className="text-[9px] text-muted-ink font-extrabold">04</span>
            <span>HOW IT WORKS</span>
          </Link>
          <Link
            href="/nominate"
            className="px-4 h-full flex flex-col justify-center border-l border-r border-ink text-ink hover:bg-acid-yellow transition-colors leading-tight"
          >
            <span className="text-[9px] text-muted-ink font-extrabold">05</span>
            <span>ABOUT</span>
          </Link>
        </nav>

        {/* Action Group: SEARCH, SIGN IN, SIGN UP */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-ink hover:text-signal-coral px-2 py-1"
          >
            <span>SEARCH</span>
            <Search className="w-3.5 h-3.5" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-field-paper border border-ink text-xs font-mono font-bold text-ink">
                <User className="w-3.5 h-3.5 text-signal-coral" />
                <span className="max-w-[100px] truncate">{user.displayName}</span>
              </div>
              {onSignOut && (
                <button onClick={onSignOut} className="p-1.5 border border-ink hover:bg-acid-yellow">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-mono font-bold uppercase px-4 py-2 text-ink bg-paper hover:bg-field-paper border border-ink"
            >
              SIGN IN
            </Link>
          )}

          <Link
            href="/nominate"
            className="text-xs font-mono font-bold uppercase px-4 py-2 text-white bg-electric-blue hover:bg-ink border border-ink flex items-center gap-1.5 shadow-action-lift"
          >
            <span>SIGN UP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-2">
          <Link
            href="/nominate"
            className="text-xs font-mono font-bold uppercase px-3 py-1.5 text-white bg-electric-blue border border-ink shadow-action-lift"
          >
            NOMINATE
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border border-ink bg-field-paper"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Search Drawer */}
      {searchOpen && (
        <div className="border-t border-ink bg-field-paper p-3 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-ink" />
            <input
              type="text"
              placeholder="SEARCH BY TITLE, CREATOR, FORMAT, OR EVIDENCE URL..."
              className="w-full bg-transparent font-mono text-xs text-ink focus:outline-none uppercase"
              autoFocus
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="text-xs font-mono font-bold text-muted-ink hover:text-ink px-2"
            >
              [ESC]
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-ink bg-paper divide-y divide-ink font-mono text-xs font-bold uppercase">
          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-6 py-3 hover:bg-acid-yellow"
          >
            <span className="text-electric-blue mr-2">01</span> PROGRAM / CREATOR DESK
          </Link>
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-6 py-3 hover:bg-acid-yellow"
          >
            <span className="text-muted-ink mr-2">02</span> SCOUTING WALL
          </Link>
          <Link
            href="/#selects"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-6 py-3 hover:bg-acid-yellow"
          >
            <span className="text-muted-ink mr-2">03</span> THE SELECTS
          </Link>
          <Link
            href="/critic"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-6 py-3 hover:bg-acid-yellow"
          >
            <span className="text-muted-ink mr-2">04</span> TRAILER CRITIC STUDIO
          </Link>
          <Link
            href="/nominate"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-6 py-3 hover:bg-acid-yellow"
          >
            <span className="text-muted-ink mr-2">05</span> NOMINATE FILM / ABOUT
          </Link>
        </div>
      )}
    </header>
  );
}
