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
import {
  displayNameError,
  isValidPassword,
  normalizeDisplayName,
} from "@/modules/identity/validation";

export const LEARNER_SESSION_COOKIE = "mepa_learner_session";

export interface CurrentLearner {
  id: string;
  displayName: string;
  sessionStartedAt: Date;
  sessionExpiresAt: Date;
  sessionAgeMinutes: number;
}

export async function getCurrentLearner(): Promise<CurrentLearner | null> {
  const token = (await cookies()).get(LEARNER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.learnerSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { learner: true },
  });

  const now = new Date();
  if (!session || session.expiresAt <= now || session.learner.deletedAt) return null;
  return {
    id: session.learner.id,
    displayName: session.learner.displayName,
    sessionStartedAt: session.createdAt,
    sessionExpiresAt: session.expiresAt,
    sessionAgeMinutes: Math.max(
      0,
      Math.floor((now.getTime() - session.createdAt.getTime()) / 60_000),
    ),
  };
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
  const normalizedEmail = email.trim().toLowerCase();
  const learner = await prisma.learner.findUnique({
    where: { email: normalizedEmail },
  });

  if (learner && !learner.deletedAt && (await verifyPassword(learner.passwordHash, password))) {
    await setLearnerSession(learner.id);
    return true;
  }

  const staff = await prisma.staffUser.findUnique({
    where: { email: normalizedEmail },
  });
  if (!staff || !staff.active || !(await verifyPassword(staff.passwordHash, password))) {
    return false;
  }

  const staffLearner = await prisma.learner.upsert({
    where: { email: normalizedEmail },
    update: {
      displayName: staff.name,
      passwordHash: staff.passwordHash,
      deletedAt: null,
    },
    create: {
      email: normalizedEmail,
      displayName: staff.name,
      passwordHash: staff.passwordHash,
    },
  });
  await setLearnerSession(staffLearner.id);
  return true;
}

export async function registerLearner(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<"created" | "duplicate" | "invalid"> {
  const email = input.email.trim().toLowerCase();
  const displayName = normalizeDisplayName(input.displayName);
  if (!email.includes("@") || !isValidPassword(input.password) || displayNameError(displayName)) {
    return "invalid";
  }
  if (await prisma.learner.findUnique({ where: { email } })) return "duplicate";
  if (
    await prisma.learner.findFirst({
      where: { displayName: { equals: displayName, mode: "insensitive" } },
      select: { id: true },
    })
  ) {
    return "invalid";
  }

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
