import { prisma } from "../src/shared/db/prisma";
import { awardPoints, recomputeScore } from "../src/modules/gamification/service";

const backfill = process.argv.includes("--backfill");

async function backfillEvents() {
  for (const completion of await prisma.moduleCompletion.findMany()) {
    await awardPoints(prisma, {
      learnerId: completion.learnerId,
      moduleVersionId: completion.moduleVersionId,
      kind: "MODULE_COMPLETED",
      sourceId: completion.id,
    });
  }
  for (const vote of await prisma.dilemmaVote.findMany()) {
    await awardPoints(prisma, {
      learnerId: vote.learnerId,
      moduleVersionId: vote.moduleVersionId,
      kind: "DILEMMA_VOTED",
      sourceId: vote.id,
    });
  }
  const attempts = await prisma.quizAttempt.findMany({
    orderBy: [{ learnerId: "asc" }, { blockId: "asc" }, { createdAt: "asc" }],
  });
  const seen = new Set<string>();
  for (const attempt of attempts) {
    const key = `${attempt.learnerId}:${attempt.blockId}`;
    const first = !seen.has(key);
    seen.add(key);
    if (attempt.score !== attempt.maxScore) continue;
    await awardPoints(prisma, {
      learnerId: attempt.learnerId,
      moduleVersionId: attempt.moduleVersionId,
      kind: "QUIZ_PASSED",
      sourceId: attempt.blockId,
    });
    if (first) {
      await awardPoints(prisma, {
        learnerId: attempt.learnerId,
        moduleVersionId: attempt.moduleVersionId,
        kind: "QUIZ_FIRST_TRY_BONUS",
        sourceId: attempt.blockId,
      });
    }
  }
}

async function main() {
  if (backfill) await backfillEvents();
  const learners = await prisma.learner.findMany({ select: { id: true } });
  for (const learner of learners) await recomputeScore(prisma, learner.id);
  console.log(`Recomputed ${learners.length} learner score(s)${backfill ? " with backfill" : ""}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
