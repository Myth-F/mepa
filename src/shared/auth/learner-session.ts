import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/shared/config/env";
import {
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/modules/identity/crypto";

export const LEARNER_SESSION_COOKIE = "mepa_learner_session";

export interface CurrentLearner {
  id: string;
  displayName: string;
}

export async function getCurrentLearner(): Promise<CurrentLearner | null> {
  const token = (await cookies()).get(LEARNER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.learnerSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { learner: true },
  });

  if (!session || session.expiresAt <= new Date() || session.learner.deletedAt) return null;
  return { id: session.learner.id, displayName: session.learner.displayName };
}

export async function requireLearner(): Promise<CurrentLearner> {
  const learner = await getCurrentLearner();
  if (!learner) redirect("/account/sign-in");
  return learner;
}

async function setLearnerSession(learnerId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.learnerSession.create({
    data: { learnerId, tokenHash: hashSessionToken(token), expiresAt },
  });

  (await cookies()).set(LEARNER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function signInLearner(email: string, password: string): Promise<boolean> {
  const learner = await prisma.learner.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!learner || learner.deletedAt || !(await verifyPassword(learner.passwordHash, password))) {
    return false;
  }
  await setLearnerSession(learner.id);
  return true;
}

export async function registerLearner(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<"created" | "duplicate" | "invalid"> {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  if (!email.includes("@") || input.password.length < 12 || displayName.length < 1) {
    return "invalid";
  }
  if (await prisma.learner.findUnique({ where: { email } })) return "duplicate";

  const learner = await prisma.learner.create({
    data: {
      email,
      displayName,
      passwordHash: await hashPassword(input.password),
    },
  });
  await setLearnerSession(learner.id);
  return "created";
}

export async function deleteLearnerSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LEARNER_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.learnerSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  }
  cookieStore.delete(LEARNER_SESSION_COOKIE);
}

export async function deleteCurrentLearner(): Promise<void> {
  const learner = await requireLearner();
  await prisma.learner.delete({ where: { id: learner.id } });
  (await cookies()).delete(LEARNER_SESSION_COOKIE);
}
