import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma";
import { getLearnerProgress } from "./progress";

function databaseFixture(withProgress: boolean) {
  return {
    moduleVersion: {
      findMany: vi.fn().mockResolvedValue([
        { id: "v1", title: "Module un", module: { slug: "module-un" } },
        { id: "v2", title: "Module deux", module: { slug: "module-deux" } },
      ]),
    },
    moduleCompletion: {
      findMany: vi.fn().mockResolvedValue(withProgress ? [{ moduleVersionId: "v1" }] : []),
    },
    quizAttempt: {
      findMany: vi
        .fn()
        .mockResolvedValue(withProgress ? [{ moduleVersionId: "v1", score: 2, maxScore: 2 }] : []),
    },
    learnerScore: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          withProgress
            ? { totalPoints: 120, level: 2, leaderboardOptIn: true, firstReachedAt: new Date() }
            : null,
        ),
      count: vi.fn().mockResolvedValue(3),
    },
  } as unknown as PrismaClient;
}

describe("learner progress", () => {
  it("returns statuses, quiz score, points, level and rank", async () => {
    const progress = await getLearnerProgress(databaseFixture(true), "learner-1");
    expect(progress).toMatchObject({
      points: 120,
      level: 2,
      rank: 4,
      modulesStarted: 1,
      modulesCompleted: 1,
    });
    expect(progress.modules).toEqual([
      expect.objectContaining({ slug: "module-un", status: "completed", quizScore: 100 }),
      expect.objectContaining({ slug: "module-deux", status: "not_started", quizScore: null }),
    ]);
  });

  it("returns a clean empty progression", async () => {
    const progress = await getLearnerProgress(databaseFixture(false), "learner-1");
    expect(progress).toMatchObject({
      points: 0,
      level: 1,
      rank: null,
      modulesStarted: 0,
      modulesCompleted: 0,
    });
    expect(progress.modules.every((module) => module.status === "not_started")).toBe(true);
  });
});
