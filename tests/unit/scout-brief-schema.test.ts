import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { ScoutBriefSchema } from "../../src/features/scout-brief/schema";

describe("Scout Brief Canonical Contract & Fixtures", () => {
  it("validates junichiro-scout-brief.json against ScoutBriefSchema", () => {
    const fixturePath = path.resolve(process.cwd(), "contracts/fixtures/junichiro-scout-brief.json");
    const content = fs.readFileSync(fixturePath, "utf-8");
    const json = JSON.parse(content);

    const result = ScoutBriefSchema.safeParse(json);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.speakers.length).toBe(2);
      expect(result.data.speakers[0].speaker).toBe("Scout");
      expect(result.data.speakers[1].speaker).toBe("Analyst");
      expect(result.data.transcript.segments.length).toBe(6);
      expect(result.data.mimeType).toBe("audio/wav");
      expect(result.data.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
  });
});
