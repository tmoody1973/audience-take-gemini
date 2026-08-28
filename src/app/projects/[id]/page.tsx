import React from "react";
import { notFound } from "next/navigation";
import { dataRepo } from "@/services/firestore-repo";
import { ScoutCardView } from "@/components/card/ScoutCardView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  const project = await dataRepo.getProjectById(projectId);
  if (!project || !project.publishedCardId) {
    notFound();
  }

  const card = await dataRepo.getScoutCardById(project.publishedCardId);
  if (!card) {
    notFound();
  }

  const critic = card.trailerCriticId ? await dataRepo.getTrailerCriticById(card.trailerCriticId) : null;
  const userEngagement = await dataRepo.getUserEngagement(project.id, "guest-fan");
  const takes = await dataRepo.getTakesByProject(project.id);
  const corrections = await dataRepo.getCorrections(project.id);

  return (
    <ScoutCardView
      project={project}
      card={card}
      critic={critic}
      userEngagement={userEngagement}
      initialTakes={takes}
      corrections={corrections}
    />
  );
}
