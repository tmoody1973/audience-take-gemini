"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(returnUrl);
    }, 400);
  };

  const handleInstantDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push(returnUrl);
    }, 300);
  };

  return (
    <main className="sign-in-page">
      <div className="sign-in-card">
        <span className="route-label">SCOUT IDENTITY / ACCESS</span>
        <h1>SIGN IN</h1>
        <p>Access your audience commitments, pathway votes, and scout card dossiers.</p>

        <form onSubmit={handleSubmit}>
          <label>
            EMAIL ADDRESS
            <input
              type="email"
              required
              placeholder="scout@audiencetake.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            className="header-nominate"
            style={{ width: "100%", marginTop: "14px", cursor: "pointer" }}
          >
            {isLoading ? "Signing in..." : "Continue with Email →"}
          </button>
        </form>

        <div className="sign-in-rule">
          <span>OR USE DEMO ACCESS</span>
        </div>

        <button
          type="button"
          onClick={handleInstantDemoLogin}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "14px",
            border: "2px solid var(--ink)",
            background: "var(--paper)",
            fontFamily: "var(--meta)",
            fontSize: "0.75rem",
            fontWeight: "800",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Instant Demo Scout Mode →
        </button>

        <small>
          Audience Take verifies community leads and retains immutable public audit history.
        </small>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<main className="sign-in-page"><p>Loading secure sign-in…</p></main>}>
      <SignInForm />
    </Suspense>
  );
}
