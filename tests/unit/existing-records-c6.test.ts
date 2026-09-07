import { describe, expect, it } from "vitest";
import { dataRepo } from "@/services/firestore-repo";
import { FALLBACK_RELATED_PROJECTS } from "@/features/scout-card/data";
import fs from "node:fs";
import path from "node:path";

describe("Package C6: Existing Record Repair & Truthful Grounding", () => {
  it("verifies Junichiro Jackson is grounded in Chicago with Chaz Bottoms and TeamTO", async () => {
    const project = await dataRepo.getProjectById("proj-junichiro");
    expect(project).toBeDefined();
    expect(project?.identity.title).toBe("Junichiro Jackson");
    expect(project?.identity.creators).toContain("Chaz Bottoms");
    expect(project?.identity.creators).toContain("TeamTO");
    expect(project?.identity.logline?.toLowerCase()).toContain("chicago");
    expect(project?.identity.logline?.toLowerCase()).not.toContain("brooklyn");

    const card = await dataRepo.getScoutCardById("card-junichiro-v1");
    expect(card).toBeDefined();
    expect(card?.decisionBrief.logline.toLowerCase()).toContain("chicago");
    expect(card?.decisionBrief.logline.toLowerCase()).not.toContain("brooklyn");
  });

  it("verifies CYCLE contains zero bicycle collective lore and is grounded in Laura Dyan Kezman's Ty'Rese West documentary", async () => {
    const project = await dataRepo.getProjectById("proj-cycle");
    expect(project).toBeDefined();
    expect(project?.identity.title).toBe("CYCLE");
    expect(project?.identity.creators).toContain("Laura Dyan Kezman");
    expect(project?.identity.creators).toContain("Lion Art Media");
    expect(project?.identity.logline).toContain("Ty'Rese West");
    expect(project?.identity.logline).toContain("Mount Pleasant, Wisconsin");

    // Must have zero bicycle / bike references
    const projectJson = JSON.stringify(project).toLowerCase();
    expect(projectJson).not.toContain("bicycle");
    expect(projectJson).not.toContain("bike");
    expect(projectJson).not.toContain("mechanic");

    const card = await dataRepo.getScoutCardById("card-cycle-v1");
    expect(card).toBeDefined();
    expect(card?.decisionBrief.logline).toContain("Ty'Rese West");
    expect(card?.whatWeKnow.some((w) => w.includes("Laura Dyan Kezman"))).toBe(true);

    const cardJson = JSON.stringify(card).toLowerCase();
    expect(cardJson).not.toContain("bicycle");
    expect(cardJson).not.toContain("bike");
    expect(cardJson).not.toContain("mechanic");

    // Verifies journalism sources
    const publishers = card?.evidenceLedger.map((e) => e.publisher);
    expect(publishers).toContain("WUWM Milwaukee NPR");
    expect(publishers).toContain("Racine County Eye");
  });

  it("verifies The Vampair Series has a canonical seed card distinguishing pilot ($286k) from series ($1.5M-$2M) and noting creator IP", async () => {
    const project = await dataRepo.getProjectById("proj-vampair");
    expect(project).toBeDefined();
    expect(project?.identity.title).toBe("The Vampair Series");
    expect(project?.identity.creators).toContain("Daria Cohen");

    const card = await dataRepo.getScoutCardById("card-vampair-v1");
    expect(card).toBeDefined();
    expect(card?.projectId).toBe("proj-vampair");
    expect(card?.status).toBe("published");

    // What we know must document $286k pilot crowdfunding and 100% IP retention
    const whatWeKnowJoined = (card?.whatWeKnow || []).join(" ");
    expect(whatWeKnowJoined).toContain("286,000");
    expect(whatWeKnowJoined).toContain("pilot");
    expect(whatWeKnowJoined.toLowerCase()).toContain("intellectual property");

    // Industry lens and checking must distinguish full episodic budget ($1.5M - $2.0M)
    const checkingJoined = (card?.whatWereChecking || []).join(" ");
    expect(checkingJoined).toContain("1.5M");
    expect(card?.industryLens.realisticConstraints).toContain("286k");

    // Evidence ledger records Kickstarter pilot campaign
    const publishers = card?.evidenceLedger.map((e) => e.publisher);
    expect(publishers).toContain("Kickstarter");
    expect(publishers).toContain("Animation Magazine");
  });

  it("verifies FALLBACK_RELATED_PROJECTS includes truthful entries for all projects", () => {
    const slugs = FALLBACK_RELATED_PROJECTS.map((p) => p.slug);
    expect(slugs).toContain("signal-in-the-pines");
    expect(slugs).toContain("american-pachuco");
    expect(slugs).toContain("cycle");
    expect(slugs).toContain("vampair");

    const cycleEntry = FALLBACK_RELATED_PROJECTS.find((p) => p.slug === "cycle");
    expect(cycleEntry?.hook).toContain("Ty'Rese West");
    expect(cycleEntry?.hook.toLowerCase()).not.toContain("bicycle");
  });

  it("validates dry-run correction manifest contracts/c6-correction-manifest.json", () => {
    const manifestPath = path.resolve(process.cwd(), "contracts/c6-correction-manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(content.isDryRun).toBe(true);
    expect(Array.isArray(content.corrections)).toBe(true);
    expect(content.corrections.length).toBeGreaterThanOrEqual(3);

    const projectSlugs = content.corrections.map((c: { slug: string }) => c.slug);
    expect(projectSlugs).toContain("junichiro-jackson");
    expect(projectSlugs).toContain("cycle");
    expect(projectSlugs).toContain("vampair");

    for (const correction of content.corrections) {
      expect(correction.targetRecord).toBeTruthy();
      expect(correction.inaccurateField).toBeTruthy();
      expect(correction.newSourceBasis).toBeTruthy();
      expect(correction.proposedChange).toBeTruthy();
      expect(Array.isArray(correction.dependentArtifacts)).toBe(true);
      expect(correction.rollbackMethod).toBeTruthy();
    }
  });
});
