import { describe, expect, it, vi } from "vitest";
import type { GamificationDb } from "./service";
import { awardPoints, recomputeScore } from "./service";

function fakeDb(options: { insertCount?: number; total?: number } = {}) {
  const score = { learnerId: "learner-1", totalPoints: options.total ?? 20, level: 1 };
  return {
    pointEvent: {
      createMany: vi.fn().mockResolvedValue({ count: options.insertCount ?? 1 }),
      aggregate: vi.fn().mockResolvedValue({ _sum: { points: options.total ?? 20 } }),
    },
    learnerScore: {
      findUnique: vi.fn().mockResolvedValue(score),
      upsert: vi.fn().mockResolvedValue(score),
      update: vi.fn().mockResolvedValue(score),
    },
  } as unknown as GamificationDb;
}

describe("gamification aggregation", () => {
  it("awards an event and increments the aggregate", async () => {
    const db = fakeDb({ insertCount: 1, total: 20 });
    const result = await awardPoints(db, {
      learnerId: "learner-1",
      moduleVersionId: "version-1",
      kind: "QUIZ_PASSED",
      sourceId: "attempt-1",
    });
    expect(result.awarded).toBe(20);
    expect(db.learnerScore.upsert).toHaveBeenCalledOnce();
  });

  it("does not increment when the event already exists", async () => {
    const db = fakeDb({ insertCount: 0, total: 20 });
    const result = await awardPoints(db, {
      learnerId: "learner-1",
      moduleVersionId: "version-1",
      kind: "QUIZ_PASSED",
      sourceId: "attempt-1",
    });
    expect(result.awarded).toBe(0);
    expect(db.learnerScore.upsert).not.toHaveBeenCalled();
  });

  it("recomputes total and level from event points", async () => {
    const db = fakeDb({ total: 275 });
    const result = await recomputeScore(db, "learner-1");
    expect(result).toEqual({ totalPoints: 275, level: 3 });
    expect(db.learnerScore.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { totalPoints: 275, level: 3 } }),
    );
  });
});
