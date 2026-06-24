import { describe, expect, it } from "vitest";
import { mediaUploadInputSchema } from "./upload-input";

describe("media upload input", () => {
  it("requires alternative text for a meaningful image", () => {
    const result = mediaUploadInputSchema.safeParse({
      mimeType: "image/png",
      sizeBytes: 512,
      altText: "",
      isDecorative: false,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain("Décrivez");
  });

  it("accepts a decorative supported image without alternative text", () => {
    expect(
      mediaUploadInputSchema.safeParse({
        mimeType: "image/webp",
        sizeBytes: 512,
        isDecorative: true,
      }).success,
    ).toBe(true);
  });
});
