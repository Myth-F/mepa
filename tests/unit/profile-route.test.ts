import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentLearner = vi.fn();
const findFirst = vi.fn();
const transaction = vi.fn();
vi.mock("@/shared/auth/learner-session", () => ({ getCurrentLearner }));
vi.mock("@/shared/db/prisma", () => ({
  prisma: {
    learner: { findFirst, update: vi.fn() },
    learnerScore: { upsert: vi.fn() },
    $transaction: transaction,
  },
}));

describe("PATCH /api/learner/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentLearner.mockResolvedValue({ id: "learner-1" });
    findFirst.mockResolvedValue(null);
    transaction.mockResolvedValue([]);
  });

  it("returns an explicit validation error", async () => {
    const { PATCH } = await import("@/app/api/learner/profile/route");
    const response = await PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "<x>", leaderboardOptIn: false }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining("uniquement") }),
    );
  });

  it("rejects a pseudonym already in use", async () => {
    findFirst.mockResolvedValue({ id: "other" });
    const { PATCH } = await import("@/app/api/learner/profile/route");
    const response = await PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Camille", leaderboardOptIn: true }),
      }),
    );
    expect(response.status).toBe(409);
  });

  it("updates the pseudonym and privacy choice together", async () => {
    const { PATCH } = await import("@/app/api/learner/profile/route");
    const response = await PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify({ displayName: "Nouveau nom", leaderboardOptIn: false }),
      }),
    );
    expect(response.status).toBe(200);
    expect(transaction).toHaveBeenCalledOnce();
  });
});
