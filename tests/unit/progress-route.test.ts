import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentLearner = vi.fn();
const getLearnerProgress = vi.fn();
vi.mock("@/shared/auth/learner-session", () => ({ getCurrentLearner }));
vi.mock("@/shared/db/prisma", () => ({ prisma: {} }));
vi.mock("@/modules/learning/progress", () => ({ getLearnerProgress }));

describe("GET /api/learner/progress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication", async () => {
    getCurrentLearner.mockResolvedValue(null);
    const { GET } = await import("@/app/api/learner/progress/route");
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns the authenticated learner projection", async () => {
    getCurrentLearner.mockResolvedValue({ id: "learner-1" });
    getLearnerProgress.mockResolvedValue({ points: 42, modules: [] });
    const { GET } = await import("@/app/api/learner/progress/route");
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ points: 42, modules: [] });
    expect(getLearnerProgress).toHaveBeenCalledWith({}, "learner-1");
  });
});
