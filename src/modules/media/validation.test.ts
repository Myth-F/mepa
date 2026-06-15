import { describe, it, expect } from "vitest";
import { validateUpload, generateObjectKey, MAX_UPLOAD_BYTES } from "./validation";

describe("media validation", () => {
  it("accepts a supported image within the size limit", () => {
    expect(validateUpload("image/png", 1024)).toEqual({ ok: true, extension: "png" });
  });

  it("rejects an unsupported / executable type", () => {
    expect(validateUpload("application/x-msdownload", 10).ok).toBe(false);
    expect(validateUpload("text/html", 10).ok).toBe(false);
  });

  it("rejects oversized and empty files", () => {
    expect(validateUpload("image/png", MAX_UPLOAD_BYTES + 1).ok).toBe(false);
    expect(validateUpload("image/png", 0).ok).toBe(false);
  });

  it("generates a server-side key with the right extension and no client input", () => {
    const key = generateObjectKey("image/jpeg");
    expect(key).toMatch(/^media\/\d{4}\/\d{2}\/[0-9a-f]{32}\.jpg$/);
  });
});
