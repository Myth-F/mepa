import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/shared/db/prisma";
import {
  recordDilemmaVote,
  recordModuleCompletion,
  recordQuizAttempt,
} from "@/modules/learning/record-actions";
import { recomputeScore } from "./service";

const run = process.env.RUN_DB_INTEGRATION === "true";
const suite = describe.runIf(run);
let learnerId = "";
let moduleId = "";
let moduleVersionId = "";
let quizId = "";
let dilemmaId = "";

suite("gamification database integration", () => {
  beforeAll(async () => {
    const learner = await prisma.learner.create({
      data: {
        email: `gamification-${randomUUID()}@example.test`,
        displayName: "Test gamification",
        passwordHash: "not-used",
      },
    });
    learnerId = learner.id;
    const learningModule = await prisma.module.create({
      data: {
        slug: `gamification-${randomUUID()}`,
        versions: {
          create: {
            versionNumber: 1,
            status: "PUBLISHED",
            title: "Module de test gamification",
            blocks: {
              create: [
                {
                  type: "quiz",
                  position: 0,
                  payload: {
                    question: "Réponse correcte ?",
                    options: [
                      { key: "yes", label: "Oui", correct: true },
                      { key: "no", label: "Non", correct: false },
                    ],
                  },
                },
                {
                  type: "dilemma",
                  position: 1,
                  payload: {
                    prompt: "Votre choix ?",
                    options: [
                      { key: "a", label: "Choix A" },
                      { key: "b", label: "Choix B" },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
      include: { versions: { include: { blocks: true } } },
    });
    moduleId = learningModule.id;
    moduleVersionId = learningModule.versions[0]!.id;
    quizId = learningModule.versions[0]!.blocks.find((block) => block.type === "quiz")!.id;
    dilemmaId = learningModule.versions[0]!.blocks.find((block) => block.type === "dilemma")!.id;
  });

  afterAll(async () => {
    if (learnerId) await prisma.learner.deleteMany({ where: { id: learnerId } });
    if (moduleId) await prisma.module.deleteMany({ where: { id: moduleId } });
  });

  it("awards each learning source once and keeps the aggregate recomputable", async () => {
    expect(
      (await recordQuizAttempt(prisma, { learnerId, blockId: quizId, selectedKeys: ["yes"] }))
        .awarded,
    ).toBe(30);
    expect(
      (await recordQuizAttempt(prisma, { learnerId, blockId: quizId, selectedKeys: ["yes"] }))
        .awarded,
    ).toBe(0);
    expect(
      (await recordDilemmaVote(prisma, { learnerId, blockId: dilemmaId, choice: "a" })).awarded,
    ).toBe(5);
    expect(
      (await recordDilemmaVote(prisma, { learnerId, blockId: dilemmaId, choice: "a" })).awarded,
    ).toBe(0);
    expect((await recordModuleCompletion(prisma, { learnerId, moduleVersionId })).awarded).toBe(50);
    expect((await recordModuleCompletion(prisma, { learnerId, moduleVersionId })).awarded).toBe(0);

    const score = await prisma.learnerScore.findUniqueOrThrow({ where: { learnerId } });
    expect(score.totalPoints).toBe(85);
    expect(await recomputeScore(prisma, learnerId)).toEqual({ totalPoints: 85, level: 1 });
  });

  it("cascades events and score when the learner is deleted", async () => {
    await prisma.learner.delete({ where: { id: learnerId } });
    expect(await prisma.pointEvent.count({ where: { learnerId } })).toBe(0);
    expect(await prisma.learnerScore.findUnique({ where: { learnerId } })).toBeNull();
    learnerId = "";
  });
});
