import type { Prisma, PrismaClient } from "@/generated/prisma";
import { getPointRule, levelForPoints, type PointKind } from "./rules";

export type GamificationDb = PrismaClient | Prisma.TransactionClient;

export async function awardPoints(
  db: GamificationDb,
  input: { learnerId: string; moduleVersionId: string; kind: PointKind; sourceId: string },
): Promise<{ awarded: number; totalPoints: number; level: number }> {
  const rule = getPointRule(input.kind);
  const inserted = await db.pointEvent.createMany({
    data: { ...input, points: rule.points, ruleVersion: rule.ruleVersion },
    skipDuplicates: true,
  });

  if (inserted.count === 0) {
    const score = await db.learnerScore.findUnique({ where: { learnerId: input.learnerId } });
    return { awarded: 0, totalPoints: score?.totalPoints ?? 0, level: score?.level ?? 1 };
  }

  const score = await db.learnerScore.upsert({
    where: { learnerId: input.learnerId },
    create: {
      learnerId: input.learnerId,
      totalPoints: rule.points,
      level: levelForPoints(rule.points),
    },
    update: { totalPoints: { increment: rule.points } },
  });
  const level = levelForPoints(score.totalPoints);
  if (level !== score.level) {
    await db.learnerScore.update({ where: { learnerId: input.learnerId }, data: { level } });
  }
  return { awarded: rule.points, totalPoints: score.totalPoints, level };
}

export async function recomputeScore(
  db: GamificationDb,
  learnerId: string,
): Promise<{ totalPoints: number; level: number }> {
  const result = await db.pointEvent.aggregate({ where: { learnerId }, _sum: { points: true } });
  const totalPoints = result._sum.points ?? 0;
  const level = levelForPoints(totalPoints);
  await db.learnerScore.upsert({
    where: { learnerId },
    create: { learnerId, totalPoints, level },
    update: { totalPoints, level },
  });
  return { totalPoints, level };
}
