import type { PrismaClient } from "@/generated/prisma";
import { labelForLevel } from "@/modules/gamification/rules";

export type ModuleProgressStatus = "not_started" | "in_progress" | "completed";

export interface LearnerModuleProgress {
  id: string;
  slug: string;
  title: string;
  status: ModuleProgressStatus;
  quizScore: number | null;
}

export interface LearnerProgress {
  points: number;
  level: number;
  levelLabel: string;
  leaderboardOptIn: boolean;
  rank: number | null;
  modulesStarted: number;
  modulesCompleted: number;
  modules: LearnerModuleProgress[];
}

export async function getLearnerProgress(
  db: PrismaClient,
  learnerId: string,
): Promise<LearnerProgress> {
  const [versions, completions, attempts, score] = await Promise.all([
    db.moduleVersion.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "asc" }, { title: "asc" }],
      select: { id: true, title: true, module: { select: { slug: true } } },
    }),
    db.moduleCompletion.findMany({ where: { learnerId }, select: { moduleVersionId: true } }),
    db.quizAttempt.findMany({
      where: { learnerId },
      orderBy: { createdAt: "desc" },
      select: { moduleVersionId: true, score: true, maxScore: true },
    }),
    db.learnerScore.findUnique({ where: { learnerId } }),
  ]);

  const completedIds = new Set(completions.map((item) => item.moduleVersionId));
  const bestScores = new Map<string, number>();
  for (const attempt of attempts) {
    const percentage =
      attempt.maxScore > 0 ? Math.round((attempt.score / attempt.maxScore) * 100) : 0;
    bestScores.set(
      attempt.moduleVersionId,
      Math.max(bestScores.get(attempt.moduleVersionId) ?? 0, percentage),
    );
  }

  const modules = versions.map((version) => {
    const status: ModuleProgressStatus = completedIds.has(version.id)
      ? "completed"
      : bestScores.has(version.id)
        ? "in_progress"
        : "not_started";
    return {
      id: version.id,
      slug: version.module.slug,
      title: version.title,
      status,
      quizScore: bestScores.get(version.id) ?? null,
    };
  });

  let rank: number | null = null;
  if (score?.leaderboardOptIn) {
    rank =
      (await db.learnerScore.count({
        where: {
          leaderboardOptIn: true,
          learner: { deletedAt: null },
          OR: [
            { totalPoints: { gt: score.totalPoints } },
            {
              totalPoints: score.totalPoints,
              firstReachedAt: { lt: score.firstReachedAt },
            },
          ],
        },
      })) + 1;
  }

  const level = score?.level ?? 1;
  return {
    points: score?.totalPoints ?? 0,
    level,
    levelLabel: labelForLevel(level),
    leaderboardOptIn: score?.leaderboardOptIn ?? false,
    rank,
    modulesStarted: modules.filter((module) => module.status !== "not_started").length,
    modulesCompleted: modules.filter((module) => module.status === "completed").length,
    modules,
  };
}
