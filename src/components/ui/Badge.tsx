import React from "react";
import { clsx } from "clsx";
import type { ClaimType, MediumType, LifecycleStage, CardStatus } from "@/domain";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "yellow" | "blue" | "coral" | "mint" | "outline" | "claim" | "medium" | "stage";
  claimType?: ClaimType;
  medium?: MediumType;
  stage?: LifecycleStage;
  status?: CardStatus;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  claimType,
  medium,
  stage,
  status,
  className,
}: BadgeProps) {
  let colorClasses = "bg-field-paper text-ink border-ink";

  if (claimType) {
    switch (claimType) {
      case "observation":
        colorClasses = "bg-evidence-mint text-ink border-ink";
        break;
      case "reported":
        colorClasses = "bg-electric-blue text-white border-ink";
        break;
      case "inference":
        colorClasses = "bg-acid-yellow text-ink border-ink";
        break;
      case "conflict":
        colorClasses = "bg-signal-coral text-white border-ink";
        break;
      case "unresolved":
        colorClasses = "bg-paper text-muted-ink border-ink border-dashed";
        break;
    }
  } else if (medium) {
    colorClasses = "bg-acid-yellow text-ink border-ink font-display tracking-wider uppercase text-sm";
  } else if (stage) {
    colorClasses = "bg-evidence-mint text-ink border-ink";
  } else if (status) {
    switch (status) {
      case "published":
        colorClasses = "bg-evidence-mint text-ink border-ink font-bold";
        break;
      case "partial":
        colorClasses = "bg-acid-yellow text-ink border-ink font-bold";
        break;
      case "draft":
        colorClasses = "bg-paper text-muted-ink border-ink";
        break;
      case "failed":
        colorClasses = "bg-error-red text-white border-ink font-bold";
        break;
      default:
        colorClasses = "bg-field-paper text-ink border-ink";
    }
  } else {
    switch (variant) {
      case "yellow":
        colorClasses = "bg-acid-yellow text-ink border-ink";
        break;
      case "blue":
        colorClasses = "bg-electric-blue text-white border-ink";
        break;
      case "coral":
        colorClasses = "bg-signal-coral text-white border-ink";
        break;
      case "mint":
        colorClasses = "bg-evidence-mint text-ink border-ink";
        break;
      case "outline":
        colorClasses = "bg-transparent text-ink border-ink";
        break;
    }
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[11px] font-mono font-extrabold border-2 uppercase tracking-wider",
        colorClasses,
        className
      )}
    >
      {children}
    </span>
  );
}
