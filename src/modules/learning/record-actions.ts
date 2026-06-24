import type { PrismaClient } from "@/generated/prisma";
import { awardPoints } from "@/modules/gamification/service";
import { scoreQuiz } from "./scoring";

export class ModuleCompletionRequirementError extends Error {
  readonly statusCode = 422;
  constructor(
    readonly missingQuizCount: number,
    readonly missingDilemmaCount: number,
  ) {
    super("Répondez à tous les quiz et dilemmes avant de terminer le module.");
    this.name = "ModuleCompletionRequirementError";
  }
}

export async function recordQuizAttempt(
  db: PrismaClient,
  input: { learnerId: string; blockId: string; selectedKeys: string[] },
) {
  return db.$transaction(async (tx) => {
    const block = await tx.moduleBlock.findFirst({
      where: { id: input.blockId, type: "quiz", moduleVersion: { status: "PUBLISHED" } },
    });
    if (!block) throw new Error("Quiz publié introuvable.");

    const previousAttempts = await tx.quizAttempt.count({
      where: { learnerId: input.learnerId, blockId: block.id },
    });
    const result = scoreQuiz(block.payload, input.selectedKeys);
    await tx.quizAttempt.create({
      data: {
        learnerId: input.learnerId,
        moduleVersionId: block.moduleVersionId,
        blockId: block.id,
        score: result.score,
        maxScore: result.maxScore,
        answers: input.selectedKeys,
      },
    });

    let awarded = 0;
    if (result.passed) {
      awarded += (
        await awardPoints(tx, {
          learnerId: input.learnerId,
          moduleVersionId: block.moduleVersionId,
          kind: "QUIZ_PASSED",
          sourceId: block.id,
        })
      ).awarded;
      if (previousAttempts === 0) {
        awarded += (
          await awardPoints(tx, {
            learnerId: input.learnerId,
            moduleVersionId: block.moduleVersionId,
            kind: "QUIZ_FIRST_TRY_BONUS",
            sourceId: block.id,
          })
        ).awarded;
      }
    }
    return { passed: result.passed, awarded };
  });
}

export async function recordDilemmaVote(
  db: PrismaClient,
  input: { learnerId: string; blockId: string; choice: string },
) {
  return db.$transaction(async (tx) => {
    const block = await tx.moduleBlock.findFirst({
      where: { id: input.blockId, type: "dilemma", moduleVersion: { status: "PUBLISHED" } },
    });
    if (!block) throw new Error("Dilemme publié introuvable.");

    const existing = await tx.dilemmaVote.findUnique({
      where: { learnerId_blockId: { learnerId: input.learnerId, blockId: block.id } },
    });
    if (existing) return { awarded: 0 };

    const vote = await tx.dilemmaVote.create({
      data: {
        learnerId: input.learnerId,
        moduleVersionId: block.moduleVersionId,
        blockId: block.id,
        choice: input.choice,
      },
    });
    return awardPoints(tx, {
      learnerId: input.learnerId,
      moduleVersionId: block.moduleVersionId,
      kind: "DILEMMA_VOTED",
      sourceId: vote.id,
    });
  });
}

export async function recordModuleCompletion(
  db: PrismaClient,
  input: { learnerId: string; moduleVersionId: string },
) {
  return db.$transaction(async (tx) => {
    const version = await tx.moduleVersion.findFirst({
      where: { id: input.moduleVersionId, status: "PUBLISHED" },
      select: { id: true, blocks: { select: { id: true, type: true } } },
    });
    if (!version) throw new Error("Module publié introuvable.");

    const quizIds = version.blocks
      .filter((block) => block.type === "quiz")
      .map((block) => block.id);
    const dilemmaIds = version.blocks
      .filter((block) => block.type === "dilemma")
      .map((block) => block.id);
    const [answeredQuizzes, answeredDilemmas] = await Promise.all([
      tx.quizAttempt.findMany({
        where: { learnerId: input.learnerId, blockId: { in: quizIds } },
        distinct: ["blockId"],
        select: { blockId: true },
      }),
      tx.dilemmaVote.findMany({
        where: { learnerId: input.learnerId, blockId: { in: dilemmaIds } },
        select: { blockId: true },
      }),
    ]);
    const missingQuizCount = quizIds.length - answeredQuizzes.length;
    const missingDilemmaCount = dilemmaIds.length - answeredDilemmas.length;
    if (missingQuizCount > 0 || missingDilemmaCount > 0) {
      throw new ModuleCompletionRequirementError(missingQuizCount, missingDilemmaCount);
    }

    const existing = await tx.moduleCompletion.findUnique({
      where: {
        learnerId_moduleVersionId: {
          learnerId: input.learnerId,
          moduleVersionId: input.moduleVersionId,
        },
      },
    });
    if (existing) return { awarded: 0 };

    const completion = await tx.moduleCompletion.create({
      data: { learnerId: input.learnerId, moduleVersionId: input.moduleVersionId },
    });
    return awardPoints(tx, {
      learnerId: input.learnerId,
      moduleVersionId: input.moduleVersionId,
      kind: "MODULE_COMPLETED",
      sourceId: completion.id,
    });
  });
}
