import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/shared/db/prisma";
import { env } from "@/shared/config/env";
import {
  sendTransactionalEmail,
  type SendTransactionalEmail,
} from "@/shared/email/transactional-email";
import { hashPassword } from "./crypto";
import { isValidPassword } from "./validation";

export const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface PasswordResetStore {
  findLearnerByEmail(email: string): Promise<{ id: string; email: string } | null>;
  invalidateActiveTokens(learnerId: string, usedAt: Date): Promise<void>;
  createToken(input: { learnerId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findToken(tokenHash: string): Promise<{
    id: string;
    learnerId: string;
    expiresAt: Date;
    usedAt: Date | null;
  } | null>;
  applyPassword(input: {
    tokenId: string;
    learnerId: string;
    passwordHash: string;
    usedAt: Date;
  }): Promise<boolean>;
}

const prismaPasswordResetStore: PasswordResetStore = {
  async findLearnerByEmail(email) {
    return prisma.learner.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true },
    });
  },
  async invalidateActiveTokens(learnerId, usedAt) {
    await prisma.passwordResetToken.updateMany({
      where: { learnerId, usedAt: null },
      data: { usedAt },
    });
  },
  async createToken(input) {
    await prisma.passwordResetToken.create({ data: input });
  },
  async findToken(tokenHash) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, learnerId: true, expiresAt: true, usedAt: true },
    });
  },
  async applyPassword(input) {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: {
          id: input.tokenId,
          learnerId: input.learnerId,
          usedAt: null,
          expiresAt: { gt: input.usedAt },
        },
        data: { usedAt: input.usedAt },
      });
      if (claimed.count !== 1) return false;
      await Promise.all([
        tx.learner.update({
          where: { id: input.learnerId },
          data: { passwordHash: input.passwordHash },
        }),
        tx.learnerSession.deleteMany({ where: { learnerId: input.learnerId } }),
        tx.passwordResetToken.updateMany({
          where: { learnerId: input.learnerId, usedAt: null },
          data: { usedAt: input.usedAt },
        }),
      ]);
      return true;
    });
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

export function passwordResetEmail(resetUrl: string) {
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Réinitialiser votre mot de passe Iavenir",
    text: `Vous avez demandé un nouveau mot de passe Iavenir. Ouvrez ce lien valable 15 minutes : ${resetUrl}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`,
    html: `<p>Vous avez demandé un nouveau mot de passe Iavenir.</p><p><a href="${safeUrl}">Choisir un nouveau mot de passe</a></p><p>Ce lien est valable 15 minutes et ne peut être utilisé qu'une fois.</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>`,
  };
}

export async function requestPasswordReset(
  email: string,
  dependencies: {
    store?: PasswordResetStore;
    sendEmail?: SendTransactionalEmail;
    now?: Date;
    token?: string;
    appUrl?: string;
  } = {},
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const store = dependencies.store ?? prismaPasswordResetStore;
  const learner = await store.findLearnerByEmail(normalizedEmail);
  if (!learner) {
    hashResetToken(randomBytes(32).toString("base64url"));
    return;
  }

  const now = dependencies.now ?? new Date();
  const token = dependencies.token ?? randomBytes(32).toString("base64url");
  await store.invalidateActiveTokens(learner.id, now);
  await store.createToken({
    learnerId: learner.id,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(now.getTime() + PASSWORD_RESET_TTL_MS),
  });

  const resetUrl = new URL("/account/reset-password", dependencies.appUrl ?? env.APP_URL);
  resetUrl.searchParams.set("token", token);
  await (dependencies.sendEmail ?? sendTransactionalEmail)({
    to: learner.email,
    ...passwordResetEmail(resetUrl.toString()),
  });
}

export async function validateResetToken(
  token: string,
  dependencies: { store?: PasswordResetStore; now?: Date } = {},
): Promise<boolean> {
  if (!token) return false;
  const record = await (dependencies.store ?? prismaPasswordResetStore).findToken(
    hashResetToken(token),
  );
  const now = dependencies.now ?? new Date();
  return Boolean(record && !record.usedAt && record.expiresAt > now);
}

export async function applyPasswordReset(
  token: string,
  newPassword: string,
  dependencies: { store?: PasswordResetStore; now?: Date } = {},
): Promise<"updated" | "invalid-token" | "invalid-password"> {
  if (!isValidPassword(newPassword)) return "invalid-password";
  const store = dependencies.store ?? prismaPasswordResetStore;
  const record = await store.findToken(hashResetToken(token));
  const now = dependencies.now ?? new Date();
  if (!record || record.usedAt || record.expiresAt <= now) return "invalid-token";

  const applied = await store.applyPassword({
    tokenId: record.id,
    learnerId: record.learnerId,
    passwordHash: await hashPassword(newPassword),
    usedAt: now,
  });
  return applied ? "updated" : "invalid-token";
}
