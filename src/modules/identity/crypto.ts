import { hash, verify } from "@node-rs/argon2";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";

// Low-level cryptographic helpers shared by the staff and learner identity
// modules. They are deliberately identity-agnostic: each identity keeps its own
// repository, cookie name, and authorization policy and only reuses these.

// OWASP-recommended Argon2id parameters (memory 19 MiB, 2 iterations, 1 lane).
const ARGON2_OPTS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}

/** Generate a random, URL-safe session token. The raw token is given to the
 *  client; only its hash is persisted. */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Deterministic hash of a session token for storage and lookup. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two hex-encoded hashes. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
