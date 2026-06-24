import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("HTTP security headers", () => {
  it("applies the baseline headers to every route without unsafe-eval", async () => {
    const rules = await nextConfig.headers?.();
    const global = rules?.find((rule) => rule.source === "/(.*)");
    const headers = new Map(global?.headers.map((header) => [header.key, header.value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(headers.get("Content-Security-Policy")).toContain("script-src 'self'");
    expect(headers.get("Content-Security-Policy")).not.toContain("unsafe-eval");
  });
});
