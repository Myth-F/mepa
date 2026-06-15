import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  hashSessionToken,
  safeEqualHex,
} from "./crypto";

describe("identity crypto", () => {
  it("hashes and verifies a password", async () => {
    const h = await hashPassword("correct horse battery staple");
    expect(h).not.toContain("correct horse");
    expect(await verifyPassword(h, "correct horse battery staple")).toBe(true);
    expect(await verifyPassword(h, "wrong password")).toBe(false);
  });

  it("returns false for a malformed stored hash instead of throwing", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
  });

  it("generates unique tokens and stable hashes", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toEqual(b);
    expect(hashSessionToken(a)).toEqual(hashSessionToken(a));
    expect(hashSessionToken(a)).not.toEqual(hashSessionToken(b));
  });

  it("compares hex hashes in constant time", () => {
    const h = hashSessionToken("token");
    expect(safeEqualHex(h, h)).toBe(true);
    expect(safeEqualHex(h, hashSessionToken("other"))).toBe(false);
    expect(safeEqualHex(h, "ab")).toBe(false);
  });
});
