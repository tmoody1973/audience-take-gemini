# Fan Experience Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 7 key fan-experience enhancements to transform Audience Take and the Scout Card from a static research dossier into a living, community-driven discovery ecosystem for independent screen storytelling.

**Architecture:** 
- Augment existing Scout Card features with lightweight, client-synchronized components (Living Updates timeline pills, Creator Response banner, Related Scout rail, Trading Card canvas exporter, and City Demand threshold meter).
- Extend the social Firestore data layer with Take upvoting and podcast RSS feed generation.
- Maintain strict zero-breaking-change backwards compatibility and deterministic test coverage.

**Tech Stack:** Next.js 15 App Router, React 19 Client/Server components, Firebase Admin & Client SDK, Vitest, HTML5 Canvas API, RSS 2.0 XML.

---

## Global Constraints
- Preserve existing Scout Card schema contracts (`ScoutCard`, `Project`, `SourceLedgerEntry`).
- Strict truthful failure behavior: never display fabricated milestones or unverified creator statements.
- All new components must include accessible semantic HTML (`aria-label`, `role`, keyboard navigation).
- All new routes and components must have accompanying unit/integration tests with >= 80% coverage.
- Next.js production build (`npm run build`) and full test suite (`npm test`) must remain completely green.

---

## File Structure & Module Organization

```
src/
  app/
    api/
      feed/
        audio-briefs/
          route.ts                         # Podcast RSS 2.0 feed generator
      takes/
        [takeId]/
          upvote/
            route.ts                       # Take upvote social endpoint
  features/
    scout-card/
      living-updates.tsx                   # Enhanced milestone timeline with category pills
      creator-response-banner.tsx          # Verified creator statement and claim banner
      related-scout-rail.tsx               # Related scout cards clustered by storyworld DNA
      trading-card-exporter.tsx            # Client Canvas exporter for Discord/social
      data.ts                              # Extended with related cards loader
    social/
      scout-social-panel.tsx               # Enhanced with Take upvoting & Top Signal sort
      city-demand-meter.tsx                # Visual threshold meter for "Bring to my city"
  lib/
    social/
      store.ts                             # Extended with take upvote transaction logic
tests/
  unit/
    fan-improvements/
      creator-response-banner.test.tsx
      trading-card-exporter.test.tsx
      podcast-feed.test.ts
      related-scout-rail.test.tsx
      take-upvote.test.ts
      city-demand-meter.test.tsx
```

---

## Tasks

### Task 1: Enhanced Living Updates Timeline & Category Pills

**Files:**
- Modify: `src/features/scout-card/living-updates.tsx`
- Test: `tests/unit/fan-improvements/living-updates-enhancement.test.tsx`

**Interfaces:**
- Consumes: `ProjectLivingUpdate`
- Produces: `category?: "funding" | "festival" | "production" | "press"` on `ProjectLivingUpdate`

- [ ] **Step 1: Write the failing unit test**

```tsx
// tests/unit/fan-improvements/living-updates-enhancement.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LivingUpdates, type ProjectLivingUpdate } from "@/features/scout-card/living-updates";

describe("LivingUpdates Timeline Enhancement", () => {
  it("renders category pill badges and milestone timeline elements", () => {
    const updates: ProjectLivingUpdate[] = [
      {
        id: "up-1",
        projectId: "proj-1",
        summary: "Patreon campaign reached $15,000 monthly production budget.",
        eventDate: "2026-09-01",
        citations: [{ url: "https://patreon.com/example", title: "Patreon" }],
        confidence: "high",
        detectedAt: "2026-09-01T12:00:00Z",
        category: "funding",
      },
    ];

    render(<LivingUpdates updates={updates} />);
    expect(screen.getByText(/Funding/i)).toBeInTheDocument();
    expect(screen.getByText(/Patreon campaign reached/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/living-updates-enhancement.test.tsx`
Expected: FAIL (category not recognized or badge not rendered).

- [ ] **Step 3: Update `src/features/scout-card/living-updates.tsx`**
Add `category` to `ProjectLivingUpdate` and render category pill badge (`funding`, `festival`, `production`, `press`) with distinct CSS styling.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/living-updates-enhancement.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/scout-card/living-updates.tsx tests/unit/fan-improvements/living-updates-enhancement.test.tsx
git commit -m "feat(scout-card): add category badge pills to living updates timeline"
```

---

### Task 2: Creator Verification & Statement Banner

**Files:**
- Create: `src/features/scout-card/creator-response-banner.tsx`
- Modify: `src/features/scout-card/scout-card.tsx`
- Test: `tests/unit/fan-improvements/creator-response-banner.test.tsx`

**Interfaces:**
- Consumes: `card.claimStatus`, `card.creatorContext`, `card.creatorStatement`
- Produces: `<CreatorResponseBanner card={card} />`

- [ ] **Step 1: Write failing unit test**

```tsx
// tests/unit/fan-improvements/creator-response-banner.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreatorResponseBanner } from "@/features/scout-card/creator-response-banner";
import { getScoutCardFixture } from "@/features/scout-card/data";

describe("CreatorResponseBanner", () => {
  it("renders verified creator statement when claimStatus is approved", () => {
    const card = {
      ...getScoutCardFixture("complete"),
      claimStatus: "approved" as const,
      creatorStatement: {
        authorName: "RubberGum Studio",
        statementText: "We are actively developing the 6-part pilot based on community pathway signals.",
        verifiedAt: "2026-09-02T10:00:00Z",
      },
    };

    render(<CreatorResponseBanner card={card} />);
    expect(screen.getByText(/Creator Verified/i)).toBeInTheDocument();
    expect(screen.getByText(/We are actively developing the 6-part pilot/i)).toBeInTheDocument();
  });

  it("renders honest unclaimed banner when creator has not claimed", () => {
    const card = {
      ...getScoutCardFixture("complete"),
      claimStatus: "unclaimed" as const,
    };

    render(<CreatorResponseBanner card={card} />);
    expect(screen.getByText(/Unclaimed by creator/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/creator-response-banner.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/features/scout-card/creator-response-banner.tsx`**
Create component with verified checkmark, quote callout, and verified date badge. Integrate into `src/features/scout-card/scout-card.tsx` right below the main hook.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/creator-response-banner.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/scout-card/creator-response-banner.tsx src/features/scout-card/scout-card.tsx tests/unit/fan-improvements/creator-response-banner.test.tsx
git commit -m "feat(scout-card): add creator verification and response banner"
```

---

### Task 3: Tastemaker Takes & Take Upvoting

**Files:**
- Modify: `src/lib/social/store.ts`
- Create: `src/app/api/takes/[takeId]/upvote/route.ts`
- Modify: `src/features/social/scout-social-panel.tsx`
- Test: `tests/unit/fan-improvements/take-upvote.test.ts`

**Interfaces:**
- Consumes: `takeId`, `uid`
- Produces: `POST /api/takes/[takeId]/upvote -> { active: boolean, upvoteCount: number }`

- [ ] **Step 1: Write failing store and API test**

```ts
// tests/unit/fan-improvements/take-upvote.test.ts
import { describe, expect, it } from "vitest";
import { createSocialStore } from "@/lib/social/store";

describe("Take Upvoting Store", () => {
  it("increments and decrements upvote counts atomically", async () => {
    // Test that store.upvoteTake increments take upvotes and records user upvote doc
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/take-upvote.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `upvoteTake` in `src/lib/social/store.ts` & route**
Add transaction in `createSocialStore` for upvoting a Take (`takeUpvotes/${takeId}_${uid}`). Create `src/app/api/takes/[takeId]/upvote/route.ts`. Add upvote counter and "Top Signal" sort in `src/features/social/scout-social-panel.tsx`.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/take-upvote.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/social/store.ts src/app/api/takes/[takeId]/upvote/route.ts src/features/social/scout-social-panel.tsx tests/unit/fan-improvements/take-upvote.test.ts
git commit -m "feat(social): add take upvoting and top-signal curation"
```

---

### Task 4: Storyworld DNA & Related Scout Rail

**Files:**
- Create: `src/features/scout-card/related-scout-rail.tsx`
- Modify: `src/features/scout-card/data.ts`
- Modify: `src/features/scout-card/scout-card.tsx`
- Test: `tests/unit/fan-improvements/related-scout-rail.test.tsx`

**Interfaces:**
- Consumes: `currentCard: ScoutCard`
- Produces: `<RelatedScoutRail relatedCards={cards} />`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/fan-improvements/related-scout-rail.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelatedScoutRail } from "@/features/scout-card/related-scout-rail";

describe("RelatedScoutRail", () => {
  it("renders related projects by storyworld DNA", () => {
    const related = [
      {
        slug: "project-omega",
        title: "Project Omega",
        hook: "A deep-space salvage crew discovers a living derelict.",
        projectType: "series",
        sharedThemes: ["hard sci-fi", "survival"],
      },
    ];

    render(<RelatedScoutRail related={related} />);
    expect(screen.getByText(/Similar Storyworld DNA/i)).toBeInTheDocument();
    expect(screen.getByText("Project Omega")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/related-scout-rail.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `RelatedScoutRail` and helper in `data.ts`**
Cluster cards by overlapping themes, format, and medium. Render a responsive recommendation rail at the base of the Scout Card.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/related-scout-rail.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/scout-card/related-scout-rail.tsx src/features/scout-card/data.ts src/features/scout-card/scout-card.tsx tests/unit/fan-improvements/related-scout-rail.test.tsx
git commit -m "feat(scout-card): add related storyworld DNA rail"
```

---

### Task 5: Discord & Social "Trading Card" PNG Exporter

**Files:**
- Create: `src/features/scout-card/trading-card-exporter.tsx`
- Modify: `src/features/scout-card/scout-card.tsx`
- Test: `tests/unit/fan-improvements/trading-card-exporter.test.tsx`

**Interfaces:**
- Consumes: `card: ScoutCard`
- Produces: Client Canvas renderer returning PNG Blob for clipboard and download.

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/fan-improvements/trading-card-exporter.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TradingCardExporter } from "@/features/scout-card/trading-card-exporter";
import { getScoutCardFixture } from "@/features/scout-card/data";

describe("TradingCardExporter", () => {
  it("renders export button and modal trigger", () => {
    render(<TradingCardExporter card={getScoutCardFixture("complete")} />);
    expect(screen.getByRole("button", { name: /Export Trading Card/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/trading-card-exporter.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement Canvas card generator**
Generate an editorial 1200x630 graphic with Title, Hook, Medium Pill, Audience Heat Score, and AudienceTake branding. Include buttons: "Copy Image" (via Clipboard API) and "Download PNG".

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/trading-card-exporter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/scout-card/trading-card-exporter.tsx src/features/scout-card/scout-card.tsx tests/unit/fan-improvements/trading-card-exporter.test.tsx
git commit -m "feat(scout-card): add social trading card image exporter"
```

---

### Task 6: Audience Take Radio (Podcast RSS Feed)

**Files:**
- Create: `src/app/api/feed/audio-briefs/route.ts`
- Test: `tests/unit/fan-improvements/podcast-feed.test.ts`

**Interfaces:**
- Consumes: Published scout cards with audio briefs from `dataRepo`
- Produces: `GET /api/feed/audio-briefs -> Content-Type: application/rss+xml`

- [ ] **Step 1: Write failing route test**

```ts
// tests/unit/fan-improvements/podcast-feed.test.ts
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/feed/audio-briefs/route";

describe("Podcast RSS Feed Route", () => {
  it("generates valid RSS 2.0 with audio enclosure tags", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("xml");
    const xml = await res.text();
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("<enclosure");
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/podcast-feed.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/app/api/feed/audio-briefs/route.ts`**
Query published cards with audio briefs, construct clean RSS 2.0 XML with iTunes tags (`itunes:summary`, `itunes:author`, `itunes:duration`), and return response with caching headers.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/podcast-feed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/app/api/feed/audio-briefs/route.ts tests/unit/fan-improvements/podcast-feed.test.ts
git commit -m "feat(feed): add podcast RSS 2.0 feed for scout audio briefs"
```

---

### Task 7: "Bring to My City" Screening Demand Meter

**Files:**
- Create: `src/features/social/city-demand-meter.tsx`
- Modify: `src/features/social/scout-social-panel.tsx`
- Test: `tests/unit/fan-improvements/city-demand-meter.test.tsx`

**Interfaces:**
- Consumes: `cities: Record<string, number>`, `threshold?: number` (default: 100)
- Produces: `<CityDemandMeter cities={cities} threshold={100} />`

- [ ] **Step 1: Write failing test**

```tsx
// tests/unit/fan-improvements/city-demand-meter.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CityDemandMeter } from "@/features/social/city-demand-meter";

describe("CityDemandMeter", () => {
  it("renders top cities and progress towards screening threshold", () => {
    const cities = { "Chicago": 45, "New York": 80, "Austin": 20 };
    render(<CityDemandMeter cities={cities} threshold={100} />);
    expect(screen.getByText(/Community Screening Demand/i)).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
    expect(screen.getByText("80 / 100 signals")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify failure**
Run: `npx vitest run tests/unit/fan-improvements/city-demand-meter.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `CityDemandMeter`**
Render top 3 cities ordered by demand with animated progress bar, remaining signals needed, and an indie theater partner badge. Integrate into the "Bring to my city" section of `src/features/social/scout-social-panel.tsx`.

- [ ] **Step 4: Run test to verify pass**
Run: `npx vitest run tests/unit/fan-improvements/city-demand-meter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/social/city-demand-meter.tsx src/features/social/scout-social-panel.tsx tests/unit/fan-improvements/city-demand-meter.test.tsx
git commit -m "feat(social): add screening demand progress meter for cities"
```

---

## Verification & Quality Gates

After completing all tasks:
1. Run `npm test` to verify that all 94+ suites pass without regressions.
2. Run `npm run build` to confirm full Next.js App Router route compilation.
3. Test end-to-end workflow on sample cards (`/projects/junichiro-live-20260826-1918`).
