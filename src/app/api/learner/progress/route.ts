import { NextResponse } from "next/server";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { getLearnerProgress } from "@/modules/learning/progress";

export async function GET() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  return NextResponse.json(await getLearnerProgress(prisma, learner.id));
}

export async function DELETE() {
  const learner = await getCurrentLearner();
  if (!learner) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  await prisma.$transaction([
    prisma.pointEvent.deleteMany({ where: { learnerId: learner.id } }),
    prisma.quizAttempt.deleteMany({ where: { learnerId: learner.id } }),
    prisma.dilemmaVote.deleteMany({ where: { learnerId: learner.id } }),
    prisma.moduleCompletion.deleteMany({ where: { learnerId: learner.id } }),
    prisma.learnerScore.deleteMany({ where: { learnerId: learner.id } }),
  ]);
  return NextResponse.json({ message: "Votre progression a été supprimée." });
}
