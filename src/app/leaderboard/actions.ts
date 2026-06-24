"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";

const REASONS = new Set(["injurieux", "discriminatoire", "usurpation", "autre"]);

export async function reportUsernameAction(formData: FormData): Promise<void> {
  const reporter = await requireLearner();
  const subjectLearnerId = String(formData.get("learnerId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  if (!subjectLearnerId || subjectLearnerId === reporter.id || !REASONS.has(reason)) {
    redirect("/leaderboard?report=invalid");
  }
  const subject = await prisma.learner.findFirst({
    where: { id: subjectLearnerId, deletedAt: null, score: { leaderboardOptIn: true } },
    select: { displayName: true },
  });
  if (!subject) redirect("/leaderboard?report=invalid");
  const existing = await prisma.usernameReport.findFirst({
    where: { reporterLearnerId: reporter.id, subjectLearnerId, status: "PENDING" },
    select: { id: true },
  });
  if (!existing) {
    await prisma.usernameReport.create({
      data: {
        reporterLearnerId: reporter.id,
        subjectLearnerId,
        reportedName: subject.displayName,
        reason,
      },
    });
  }
  revalidatePath("/admin/username-reports");
  redirect("/leaderboard?report=sent");
}
