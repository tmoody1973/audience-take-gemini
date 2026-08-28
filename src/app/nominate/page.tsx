import React from "react";
import { NominationForm } from "@/components/nominate/NominationForm";
import { PlusCircle, ShieldCheck, Compass } from "lucide-react";

export default function NominatePage() {
  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cinema-gold/10 border border-cinema-gold/30 text-cinema-gold font-mono text-xs uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          Nomination Intake Desk
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
          Nominate a Screen Project
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed">
          Submit an overlooked film, documentary, series pitch, or crowdfunding campaign. Our Gemini research agent will build an inspectable, cited Scout Card.
        </p>
      </div>

      <NominationForm />
    </div>
  );
}
