"use server";

import { redirect } from "next/navigation";
import {
  deleteCurrentLearner,
  registerLearner,
  requireLearner,
  signInLearner,
} from "@/shared/auth/learner-session";
import { prisma } from "@/shared/db/prisma";
import { refresh, revalidatePath } from "next/cache";

export async function signInLearnerAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/account/sign-in?error=missing");
  if (!(await signInLearner(email, password))) redirect("/account/sign-in?error=invalid");
  redirect("/account");
}

export async function registerLearnerAction(formData: FormData): Promise<void> {
  const result = await registerLearner({
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (result !== "created") redirect(`/account/register?error=${result}`);
  redirect("/account");
}

export async function deleteLearnerAction(): Promise<void> {
  await deleteCurrentLearner();
  redirect("/");
}

export async function updateLeaderboardParticipationAction(formData: FormData): Promise<void> {
  const learner = await requireLearner();
  const optIn = formData.get("leaderboardOptIn") === "on";
  await prisma.learnerScore.upsert({
    where: { learnerId: learner.id },
    create: { learnerId: learner.id, leaderboardOptIn: optIn },
    update: { leaderboardOptIn: optIn },
  });
  revalidatePath("/account");
  revalidatePath("/leaderboard", "page");
  revalidatePath("/", "layout");
  refresh();
  redirect(`/account?ranking=${optIn ? "joined" : "left"}`);
}
