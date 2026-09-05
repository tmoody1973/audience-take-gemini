import React from "react";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { loadPublishedScoutCard } from "@/features/scout-card/data";
import { ScoutCard } from "@/features/scout-card/scout-card";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ view?: string }>;
}

export default async function ScoutCardPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialView =
    resolvedSearchParams?.view === "pro" || resolvedSearchParams?.view === "professional"
      ? "pro"
      : "discover";

  const projectId = resolvedParams.id;

  const card = await loadPublishedScoutCard(projectId);
  if (!card) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <ScoutCard card={card} initialView={initialView} />
    </>
  );
}
