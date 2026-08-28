"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlusCircle, ShieldCheck, User, LogOut, Menu, X } from "lucide-react";
import { Button } from "../ui/Button";

interface NavbarProps {
  user?: { displayName: string; email?: string } | null;
  onSignOut?: () => void;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-paper border-b-3 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand: 3-Part Masthead */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-3 group focus:outline-none">
            <span className="font-display text-4xl sm:text-5xl font-normal tracking-tight text-ink uppercase group-hover:text-signal-coral transition-colors">
              AUDIENCE TAKE
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono font-extrabold uppercase tracking-widest px-2 py-0.5 bg-acid-yellow text-ink border-2 border-ink">
              PUBLIC SCOUTING PROGRAM
            </span>
          </Link>
        </div>

        {/* Numbered Program Navigation Links */}
        <nav className="hidden lg:flex items-center text-xs font-mono font-extrabold uppercase border-l-2 border-r-2 border-ink h-20">
          <Link
            href="/"
            className="px-5 h-full flex items-center gap-2 text-ink hover:bg-acid-yellow transition-colors border-r-2 border-ink"
          >
            <span className="text-muted-ink">01</span>
            <span>Scouting Wall</span>
          </Link>
          <Link
            href="/creator"
            className="px-5 h-full flex items-center gap-2 text-ink hover:bg-acid-yellow transition-colors border-r-2 border-ink"
          >
            <span className="text-muted-ink">02</span>
            <span>Creator Desk</span>
          </Link>
          <Link
            href="/nominate"
            className="px-5 h-full flex items-center gap-2 text-ink hover:bg-acid-yellow transition-colors border-r-2 border-ink"
          >
            <span className="text-muted-ink">03</span>
            <span>Nominate Work</span>
          </Link>
          <Link
            href="/critic"
            className="px-5 h-full flex items-center gap-2 text-ink hover:bg-acid-yellow transition-colors"
          >
            <span className="text-muted-ink">04</span>
            <span>Trailer Critic</span>
          </Link>
        </nav>

        {/* Action Group */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-field-paper border-2 border-ink text-xs font-mono font-bold text-ink">
                <User className="w-3.5 h-3.5 text-signal-coral" />
                <span className="max-w-[120px] truncate">{user.displayName}</span>
              </div>
              {onSignOut && (
                <button onClick={onSignOut} className="p-2 border-2 border-ink bg-field-paper hover:bg-acid-yellow" title="Sign Out">
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="text-xs font-mono font-extrabold uppercase px-3 py-2 text-ink hover:bg-acid-yellow border-2 border-ink">
              Sign In
            </Link>
          )}

          <Link href="/nominate">
            <button className="h-[48px] px-4 bg-signal-coral text-white font-headline text-2xl uppercase tracking-wider border-2 border-ink hover:bg-electric-blue active:translate-x-[1px] active:translate-y-[1px] shadow-action-lift flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>Nominate</span>
            </button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center gap-2">
          <Link href="/nominate">
            <button className="h-[38px] px-3 bg-signal-coral text-white font-headline text-xl uppercase tracking-wider border-2 border-ink shadow-action-lift">
              Nominate
            </button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 border-2 border-ink bg-field-paper text-ink hover:bg-acid-yellow focus:outline-none"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-ink bg-paper px-4 py-4 space-y-2 font-mono text-xs font-bold uppercase">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 border-2 border-ink bg-field-paper hover:bg-acid-yellow"
          >
            01 Scouting Wall
          </Link>
          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 border-2 border-ink bg-field-paper hover:bg-acid-yellow"
          >
            02 Creator Desk
          </Link>
          <Link
            href="/nominate"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 border-2 border-ink bg-field-paper hover:bg-acid-yellow"
          >
            03 Nominate Work
          </Link>
          <Link
            href="/critic"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 border-2 border-ink bg-acid-yellow text-ink hover:bg-white"
          >
            04 Trailer Critic
          </Link>
          <div className="pt-2">
            {user ? (
              <div className="flex items-center justify-between p-2 bg-field-paper border-2 border-ink">
                <span>{user.displayName}</span>
                {onSignOut && (
                  <button onClick={onSignOut} className="text-signal-coral">
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2 bg-acid-yellow text-ink border-2 border-ink uppercase">
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
