import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPasswordReset = vi.fn();
const applyPasswordReset = vi.fn();
vi.mock("@/modules/identity/password-reset", () => ({ requestPasswordReset, applyPasswordReset }));

describe("password reset API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the same forgot-password response even when delivery fails", async () => {
    requestPasswordReset.mockRejectedValue(new Error("unknown or delivery failure"));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const response = await POST(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ email: "unknown@example.org" }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: expect.stringContaining("Si un compte correspond"),
    });
  });

  it("rejects a used or expired reset token", async () => {
    applyPasswordReset.mockResolvedValue("invalid-token");
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      new Request("http://test", {
        method: "POST",
        body: JSON.stringify({ token: "expired", password: "valid-password-1" }),
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: expect.stringContaining("expiré") });
  });
});
