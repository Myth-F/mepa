import { describe, expect, it, vi } from "vitest";
import {
  PASSWORD_RESET_TTL_MS,
  applyPasswordReset,
  hashResetToken,
  requestPasswordReset,
  validateResetToken,
  type PasswordResetStore,
} from "./password-reset";

function memoryStore(): PasswordResetStore & {
  token: {
    id: string;
    learnerId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
  } | null;
  passwordHash: string | null;
} {
  return {
    token: null,
    passwordHash: null,
    async findLearnerByEmail(email) {
      return email === "learner@example.org" ? { id: "learner-1", email } : null;
    },
    async invalidateActiveTokens(_learnerId, usedAt) {
      if (this.token && !this.token.usedAt) this.token.usedAt = usedAt;
    },
    async createToken(input) {
      this.token = { id: "reset-1", ...input, usedAt: null };
    },
    async findToken(tokenHash) {
      return this.token?.tokenHash === tokenHash ? this.token : null;
    },
    async applyPassword(input) {
      if (!this.token || this.token.id !== input.tokenId || this.token.usedAt) return false;
      this.token.usedAt = input.usedAt;
      this.passwordHash = input.passwordHash;
      return true;
    },
  };
}

describe("password reset", () => {
  const now = new Date("2026-06-23T12:00:00.000Z");

  it("creates a hashed 15-minute token and sends the raw link by email", async () => {
    const store = memoryStore();
    const sendEmail = vi.fn(async () => undefined);
    await requestPasswordReset(" Learner@Example.org ", {
      store,
      sendEmail,
      now,
      token: "raw-secret-token",
      appUrl: "https://mepa.example.org",
    });

    expect(store.token?.tokenHash).toBe(hashResetToken("raw-secret-token"));
    expect(store.token?.tokenHash).not.toContain("raw-secret-token");
    expect(store.token?.expiresAt.getTime()).toBe(now.getTime() + PASSWORD_RESET_TTL_MS);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "learner@example.org",
        text: expect.stringContaining("raw-secret-token"),
      }),
    );
  });

  it("returns no account signal for an unknown email", async () => {
    const sendEmail = vi.fn(async () => undefined);
    await requestPasswordReset("unknown@example.org", { store: memoryStore(), sendEmail, now });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects expired and already-used tokens", async () => {
    const store = memoryStore();
    store.token = {
      id: "reset-1",
      learnerId: "learner-1",
      tokenHash: hashResetToken("raw"),
      expiresAt: new Date(now.getTime() - 1),
      usedAt: null,
    };
    await expect(validateResetToken("raw", { store, now })).resolves.toBe(false);
    store.token.expiresAt = new Date(now.getTime() + 1_000);
    store.token.usedAt = now;
    await expect(validateResetToken("raw", { store, now })).resolves.toBe(false);
  });

  it("updates the password once and invalidates the token", async () => {
    const store = memoryStore();
    store.token = {
      id: "reset-1",
      learnerId: "learner-1",
      tokenHash: hashResetToken("raw"),
      expiresAt: new Date(now.getTime() + 1_000),
      usedAt: null,
    };
    await expect(applyPasswordReset("raw", "new-password-strong", { store, now })).resolves.toBe(
      "updated",
    );
    expect(store.passwordHash).toMatch(/^\$argon2/);
    await expect(applyPasswordReset("raw", "other-password-strong", { store, now })).resolves.toBe(
      "invalid-token",
    );
  });
});
