import { Suspense } from "react";
import type { Metadata } from "next";

import { MyNominationsClient } from "./my-nominations-client";

export const metadata: Metadata = {
  title: "My Nominations — Audience Take",
  description: "Manage your nominated independent screen projects, track autonomous research runs, and view your scout portfolio.",
};

export default function MyNominationsPage() {
  return (
    <Suspense
      fallback={
        <main className="my-nominations-page paper-texture">
          <div className="nominations-loading">Loading your scout dossier…</div>
        </main>
      }
    >
      <MyNominationsClient />
    </Suspense>
  );
}
