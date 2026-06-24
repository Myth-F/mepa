import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const REQUIRED = {
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "test-media",
  S3_ACCESS_KEY_ID: "test",
  S3_SECRET_ACCESS_KEY: "test-secret",
};

describe("environment parsing", () => {
  it("uses the Coolify public URL and ignores empty optional email values", () => {
    const parsed = parseEnv({
      ...REQUIRED,
      APP_URL: "",
      COOLIFY_URL: "https://mepa.example.org",
      EMAIL_WEBHOOK_URL: "",
      EMAIL_WEBHOOK_TOKEN: "",
    });

    expect(parsed.APP_URL).toBe("https://mepa.example.org");
    expect(parsed.EMAIL_WEBHOOK_URL).toBeUndefined();
    expect(parsed.EMAIL_WEBHOOK_TOKEN).toBeUndefined();
  });

  it("normalizes the protocol-relative URL injected by Coolify during builds", () => {
    const parsed = parseEnv({
      ...REQUIRED,
      APP_URL: "",
      COOLIFY_URL: "//mepa.example.org",
    });

    expect(parsed.APP_URL).toBe("https://mepa.example.org");
  });

  it("keeps rejecting a non-empty malformed URL", () => {
    expect(() => parseEnv({ ...REQUIRED, APP_URL: "not-a-url" })).toThrow("APP_URL");
  });
});
