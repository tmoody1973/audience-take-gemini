import type { Metadata } from "next";
import Link from "next/link";

import { ArrowIcon } from "../../components/icons";
import { SiteHeader } from "../../components/site-header";
import {
  loadScoutingWallEntries,
} from "../../features/scouting-wall/data";
import { ScoutingWallClient } from "../../features/scouting-wall/scouting-wall-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scouting Wall",
  description: "Browse published Audience Take Scout Cards and inspect their evidence status, pathways, and public sources.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const entries = await loadScoutingWallEntries();

  return (
    <>
      <SiteHeader />
      <main className="scouting-wall paper-texture">
        <header className="wall-masthead">
          <div>
            <span className="route-label">Audience Take / public program 02</span>
            <h1>Scouting Wall</h1>
          </div>
          <div className="wall-masthead-note">
            <strong>Public Intelligence Wall</strong>
            <p>Direct access to evidence-backed scout cards, two-speaker audio briefs, and buyer decision matrices.</p>
          </div>
          <Link className="button-primary" href="/nominate">
            Put a project on the wall <ArrowIcon />
          </Link>
        </header>

        <ScoutingWallClient initialEntries={entries} />
      </main>
      <footer className="site-footer">
        <strong>Audience Take</strong>
        <p>Scout Cards stay project-centered, inspectable, and free of opaque ranking algorithms.</p>
        <Link href="/nominate">Nominate a project <ArrowIcon /></Link>
      </footer>
    </>
  );
}
