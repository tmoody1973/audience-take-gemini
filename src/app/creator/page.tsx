import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { dataRepo } from "@/services/firestore-repo";
import { Button } from "@/components/ui/Button";

export default async function CreatorDeskPage() {
  const projects = await dataRepo.getProjects();

  return (
    <div className="space-y-10 max-w-4xl mx-auto py-4">
      {/* Header */}
      <div className="space-y-3 pb-6 border-b-3 border-ink">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-evidence-mint text-ink border-2 border-ink font-mono text-xs font-extrabold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-electric-blue" />
          OFFICIAL CREATOR DESK
        </div>
        <h1 className="font-display text-5xl sm:text-7xl font-normal uppercase text-ink leading-[0.78]">
          CREATOR VERIFICATION & LOGS
        </h1>
        <p className="text-sm sm:text-base text-ink font-sans leading-relaxed">
          Claim ownership of your scouted screen project, inspect authentic fan commitments, and publish official production logs directly to your Scout Card.
        </p>
      </div>

      {/* Trust & Separation Policy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
        <div className="p-5 bg-field-paper border-3 border-ink space-y-2 shadow-selected-lift">
          <span className="text-electric-blue font-extrabold flex items-center gap-1.5 uppercase text-xs">
            <ShieldCheck className="w-4 h-4" /> WHAT VERIFIED CREATORS CAN DO
          </span>
          <ul className="text-muted-ink space-y-1 list-disc list-inside font-bold">
            <li>Publish timestamped creator logs & behind-the-scenes media</li>
            <li>Receive real-time Audience Pulse commitment digests</li>
            <li>Directly propose verified YouTube trailers & teasers</li>
          </ul>
        </div>

        <div className="p-5 bg-field-paper border-3 border-ink space-y-2 shadow-selected-lift">
          <span className="text-signal-coral font-extrabold flex items-center gap-1.5 uppercase text-xs">
            <Lock className="w-4 h-4" /> INDEPENDENCE INVARIANTS
          </span>
          <ul className="text-muted-ink space-y-1 list-disc list-inside font-bold">
            <li>Creators cannot rewrite independent research evidence</li>
            <li>Private identity documents remain in locked server storage</li>
            <li>Evidence conflicts trigger public, transparent version records</li>
          </ul>
        </div>
      </div>

      {/* Projects Claim Status List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between font-mono">
          <h3 className="font-headline text-3xl font-normal uppercase text-ink">
            ACTIVE SCOUTED WORKS ({projects.length})
          </h3>
          <span className="text-xs font-bold text-muted-ink uppercase">
            SELECT A DOSSIER TO CLAIM OR INSPECT
          </span>
        </div>

        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-6 bg-paper border-3 border-ink flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-selected-lift hover:bg-field-paper transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-headline text-3xl font-normal uppercase text-ink">
                    {project.identity.title}
                  </h4>
                  <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 bg-acid-yellow text-ink border border-ink">
                    {project.identity.medium.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs font-mono font-bold text-muted-ink uppercase">
                  STATUS:{" "}
                  <strong className="text-ink">
                    {project.creatorClaim.status}
                  </strong>{" "}
                  • WATCH COMMITMENTS: <strong className="text-signal-coral">{project.metrics.watchCount}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href={`/scout/${project.id}`}>
                  <Button variant="coral" size="sm">
                    OPEN SCOUT CARD
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
