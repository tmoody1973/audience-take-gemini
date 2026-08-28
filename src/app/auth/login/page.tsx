"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
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
    <div className="max-w-md mx-auto py-10 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-acid-yellow border-3 border-ink flex items-center justify-center text-ink mx-auto shadow-selected-lift">
          <Film className="w-7 h-7" />
        </div>
        <h1 className="font-display text-5xl uppercase tracking-tight text-ink">
          {isRegister ? "JOIN FAN SCOUTS" : "SIGN IN TO AUDIENCE TAKE"}
        </h1>
        <p className="text-xs font-mono font-bold text-muted-ink uppercase">
          {isRegister
            ? "Create an account to commit, vote, and publish structured takes."
            : "Access your audience commitments and scout dossiers."}
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="bg-paper border-3 border-ink p-8 shadow-ticket-lift space-y-6">
        
        {/* Google Sign In Button */}
        <button
          onClick={handleInstantDemoLogin}
          disabled={isLoading}
          className="w-full h-[54px] bg-field-paper border-2 border-ink text-ink font-mono text-xs font-extrabold uppercase hover:bg-acid-yellow transition-all flex items-center justify-center gap-2 shadow-selected-lift"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>CONTINUE WITH GOOGLE</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t-2 border-ink" />
          <span className="bg-paper px-2 text-[10px] font-mono font-extrabold uppercase text-muted-ink absolute">
            OR WITH EMAIL
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="scout@cinema.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button variant="coral" size="lg" type="submit" isLoading={isLoading} className="w-full gap-2 text-2xl">
            <span>{isRegister ? "CREATE ACCOUNT" : "SIGN IN"}</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs font-mono font-bold text-muted-ink uppercase">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-signal-coral hover:underline"
          >
            {isRegister ? "Already have an account? Sign in" : "New to Audience Take? Create an account"}
          </button>
        </div>

      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 font-mono text-xs text-muted-ink">Loading auth...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
