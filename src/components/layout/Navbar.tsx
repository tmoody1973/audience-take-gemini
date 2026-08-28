"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 5l7 7-7 7" />
    </svg>
  );
}

interface NavbarProps {
  user?: { displayName: string; email?: string } | null;
  onSignOut?: () => void;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const homeIsCurrent = pathname === "/";
  const wallIsCurrent = pathname === "/projects";

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      if (onSignOut) {
        await onSignOut();
      }
    } finally {
      setSigningOut(false);
    }
  };

  const authAction = user ? (
    <button
      className="sign-in-link"
      type="button"
      onClick={() => void handleSignOut()}
      disabled={signingOut}
    >
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
  ) : (
    <Link className="sign-in-link" href="/auth/login">
      Sign in
    </Link>
  );

  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Audience Take home">
        Audience Take
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/" aria-current={homeIsCurrent ? "page" : undefined}>
          <span>01</span> Home
        </Link>
        <Link href="/projects" aria-current={wallIsCurrent ? "page" : undefined}>
          <span>02</span> Scouting Wall
        </Link>
        <Link href="/#the-selects">
          <span>03</span> The Selects
        </Link>
      </nav>
      <div className="header-actions">
        {authAction}
        <Link className="header-nominate" href="/nominate">
          Nominate <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}
