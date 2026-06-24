"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { requireLearner } from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import {
  recordDilemmaVote,
  recordModuleCompletion,
  recordQuizAttempt,
} from "@/modules/learning/record-actions";

function resultUrl(
  slug: string,
  result: string,
  points: number,
  focus?: string,
  answers: string[] = [],
): Route {
  const focusQuery = focus ? `&focus=${encodeURIComponent(focus)}` : "";
  const answerQuery = answers.map((answer) => `&answer=${encodeURIComponent(answer)}`).join("");
  const hash = focus ? `#feedback-${encodeURIComponent(focus)}` : "";
  return `/modules/${slug}?result=${result}&points=${points}${focusQuery}${answerQuery}${hash}` as Route;
}

export async function submitQuizAction(formData: FormData): Promise<void> {
  const learner = await requireLearner();
  const blockId = String(formData.get("blockId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const selectedKeys = formData.getAll("answer").map(String);
  const result = await recordQuizAttempt(prisma, { learnerId: learner.id, blockId, selectedKeys });
  revalidatePath(`/modules/${slug}`);
  redirect(
    resultUrl(
      slug,
      result.passed ? "quiz-passed" : "quiz-failed",
      result.awarded,
      blockId,
      selectedKeys,
    ),
  );
}

export async function submitDilemmaAction(formData: FormData): Promise<void> {
  const learner = await requireLearner();
  const blockId = String(formData.get("blockId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const choice = String(formData.get("choice") ?? "");
  if (!choice) redirect(resultUrl(slug, "choice-required", 0, blockId));
  const result = await recordDilemmaVote(prisma, { learnerId: learner.id, blockId, choice });
  revalidatePath(`/modules/${slug}`);
  redirect(resultUrl(slug, "vote-recorded", result.awarded, blockId));
}

export async function completeModuleAction(formData: FormData): Promise<void> {
  const learner = await requireLearner();
  const moduleVersionId = String(formData.get("moduleVersionId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const result = await recordModuleCompletion(prisma, { learnerId: learner.id, moduleVersionId });
  revalidatePath(`/modules/${slug}`);
  revalidatePath("/account");
  redirect(resultUrl(slug, "module-completed", result.awarded));
}
