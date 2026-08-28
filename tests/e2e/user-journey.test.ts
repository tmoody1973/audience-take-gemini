import { test, expect } from "@playwright/test";

test.describe("Audience Take — Core User Journeys", () => {
  test("1. Public visitor browses Scouting Wall and filters by format", async ({ page }) => {
    await page.goto("/");

    // Verify Brand & Hero
    await expect(page.locator("h1")).toContainText("The Scouting Wall");
    await expect(page.getByText("Public Scouting Dossier")).toBeVisible();

    // Verify Seeded Projects are rendered
    await expect(page.getByText("Signal in the Pines")).toBeVisible();
    await expect(page.getByText("River of Copper")).toBeVisible();

    // Filter by Short Films
    await page.getByRole("link", { name: "Short Films" }).click();
    await expect(page.getByText("Signal in the Pines")).toBeVisible();
  });

  test("2. Visitor inspects a full Scout Card dossier", async ({ page }) => {
    await page.goto("/scout/proj-signal-in-the-pines");

    // Header & Identity
    await expect(page.locator("h1")).toContainText("Signal in the Pines");
    await expect(page.getByText("What We Know")).toBeVisible();
    await expect(page.getByText("What We're Checking")).toBeVisible();
    await expect(page.getByText("Why It Was Scouted")).toBeVisible();

    // Evidence Ledger
    await expect(page.getByText("Evidence Ledger & Citations")).toBeVisible();
    await expect(page.getByText("Northwest Film Forum 2025 Festival Awards")).toBeVisible();

    // Exactly 3 Pathways
    await expect(page.getByText("Three Bounded Pathway Hypotheses")).toBeVisible();
    await expect(page.getByText("Micro-Budget Feature Expansion")).toBeVisible();
    await expect(page.getByText("Curated Genre Festival Tour & VOD")).toBeVisible();
    await expect(page.getByText("Anthology Episode Pilot")).toBeVisible();

    // Decision Brief & Audience Pulse
    await expect(page.getByText("Decision Brief")).toBeVisible();
    await expect(page.getByText("Audience Pulse")).toBeVisible();
    await expect(page.getByRole("button", { name: /I would watch/i })).toBeVisible();
  });

  test("3. Fan Scout completes Nomination multi-step form", async ({ page }) => {
    await page.goto("/nominate");

    await expect(page.locator("h1")).toContainText("Nominate a Screen Project");

    // Fill Step 1
    await page.fill('input[placeholder*="https://kickstarter.com"]', "https://vimeo.com/channels/staffpicks/987654321");
    await page.fill('textarea[placeholder*="Describe what makes this story"]', "A breathtaking 10-minute stop-motion fable about an orphaned clockmaker in Prague.");

    // Click Review Before Submit
    await page.getByRole("button", { name: /Review Nomination/i }).click();

    // Step 2 Review Screen
    await expect(page.getByText("Review Before Dispatching Agent")).toBeVisible();
    await expect(page.getByText("https://vimeo.com/channels/staffpicks/987654321")).toBeVisible();
  });
});
