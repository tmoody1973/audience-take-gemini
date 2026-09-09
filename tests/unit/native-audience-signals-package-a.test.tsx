import { describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { followId, commitmentId, voteId, takeId, socialCounterFields } from "../../src/lib/social/store";
import { loadRoleAssignment } from "../../src/lib/trust/authorization";
import { verifyAuthenticatedRequest } from "../../src/lib/auth/verify-request";
import { ProfessionalBriefView } from "../../src/features/scout-card/professional-brief-view";
import { getScoutCardFixture } from "../../src/features/scout-card/data";
import { createCitationLabels } from "../../src/features/scout-card/citation-labels";

describe("Package A: Native Audience Signals", () => {
  describe("1. Canonical Project Keying & Deterministic Activity IDs", () => {
    it("uses canonicalized IDs so slugs and project IDs target identical document keys", () => {
      const canonicalId = "proj-cycle";
      const uid = "user-123";
      expect(followId(canonicalId, uid)).toBe("proj-cycle_user-123");
      expect(commitmentId(canonicalId, uid, "would_watch")).toBe("proj-cycle_user-123_would_watch");
      expect(voteId(canonicalId, uid)).toBe("proj-cycle_user-123");
      expect(takeId(canonicalId, uid)).toBe("proj-cycle_user-123");
    });

    it("routes demo activity into isolated counter fields without mutating organic counters", () => {
      const organicFields = socialCounterFields(false);
      const demoFields = socialCounterFields(true);

      expect(organicFields.follower).toBe("followerCount");
      expect(demoFields.follower).toBe("demoFollowerCount");

      expect(organicFields.commitments).toBe("commitmentCounts");
      expect(demoFields.commitments).toBe("demoCommitmentCounts");

      expect(organicFields.votes).toBe("pathwayVoteCounts");
      expect(demoFields.votes).toBe("demoPathwayVoteCounts");

      expect(organicFields.takes).toBe("takeCount");
      expect(demoFields.takes).toBe("demoTakeCount");
    });
  });

  describe("2. Demo Role & Identity Isolation", () => {
    it("forces demoOnly: true for guest-scout-demo and demo- prefixed UIDs", async () => {
      const mockDb = {
        collection: vi.fn().mockReturnValue({
          doc: vi.fn().mockReturnValue({
            get: vi.fn().mockResolvedValue({ exists: false }),
          }),
        }),
      } as any;

      const guestAssignment = await loadRoleAssignment(mockDb, "guest-scout-demo");
      expect(guestAssignment.demoOnly).toBe(true);
      expect(guestAssignment.roles.fan).toBe(true);

      const demoUserAssignment = await loadRoleAssignment(mockDb, "demo-user-456");
      expect(demoUserAssignment.demoOnly).toBe(true);
      expect(demoUserAssignment.roles.fan).toBe(true);
    });

    it("rejects demo-scout-token in production unless ALLOW_DEMO_AUTH is enabled", async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEMO_AUTH;
      try {
        process.env.NODE_ENV = "production";
        delete process.env.ALLOW_DEMO_AUTH;

        const req = new Request("https://audiencetake.example/api/test", {
          headers: { authorization: "Bearer demo-scout-token" },
        });

        await expect(verifyAuthenticatedRequest(req, {} as any)).rejects.toThrow("Sign in is required.");
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalAllow) process.env.ALLOW_DEMO_AUTH = originalAllow;
        else delete process.env.ALLOW_DEMO_AUTH;
      }
    });
  });

  describe("3. Professional Brief View: Real Audience Pulse & Disclosure", () => {
    it("displays real follower and commitment metrics, required disclosure, and Discover view link", () => {
      const baseCard = getScoutCardFixture("complete");
      const card = {
        ...baseCard,
        followerCount: 142,
        commitmentCounts: {
          would_watch: 89,
          pay_to_fund: 34,
        },
      };

      const onViewAudienceMock = vi.fn();
      const sourceLabels = createCitationLabels(card.sourceLedger);

      render(
        <ProfessionalBriefView
          card={card}
          sourceLabels={sourceLabels}
          onViewAudienceParticipation={onViewAudienceMock}
        />
      );

      expect(screen.getByText("Native Audience Take Signals")).toBeInTheDocument();
      expect(screen.getByText("142")).toBeInTheDocument();
      expect(screen.getByText("Followers")).toBeInTheDocument();
      expect(screen.getByText("89")).toBeInTheDocument();
      expect(screen.getByText("Would Watch")).toBeInTheDocument();
      expect(screen.getByText("34")).toBeInTheDocument();
      expect(screen.getByText("Support Intent")).toBeInTheDocument();

      expect(
        screen.getByText("Expressions of interest, not purchases. The same person may appear in more than one count.")
      ).toBeInTheDocument();

      const navBtn = screen.getByRole("button", {
        name: /Inspect audience participation in Discover view/i,
      });
      expect(navBtn).toBeInTheDocument();
      fireEvent.click(navBtn);
      expect(onViewAudienceMock).toHaveBeenCalledTimes(1);
    });
  });
});
