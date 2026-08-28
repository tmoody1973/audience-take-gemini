import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="site-footer">
      <strong>Audience Take</strong>
      <p>Scout Cards stay project-centered, inspectable, and free of opaque ranking scores.</p>
      <Link href="/nominate">
        Nominate a project <ArrowRight className="w-4 h-4 ml-1" />
      </Link>
    </footer>
  );
}
