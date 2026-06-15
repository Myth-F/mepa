import { describe, it, expect } from "vitest";
import { assembleSearchBody } from "./search-document";

describe("assembleSearchBody", () => {
  it("projects and joins block text in order, skipping empty projections", () => {
    const body = assembleSearchBody([
      { type: "rich_text", payload: { markdown: "Les biais viennent des données." } },
      { type: "image", payload: { mediaId: "m", alt: "", decorative: true } }, // projects to ""
      {
        type: "quiz",
        payload: {
          question: "D'où vient un biais ?",
          options: [
            { key: "a", label: "Des données", correct: true },
            { key: "b", label: "De la couleur", correct: false },
          ],
        },
      },
    ]);
    expect(body).toContain("Les biais viennent des données.");
    expect(body).toContain("D'où vient un biais ?");
    expect(body.split("\n\n")).toHaveLength(2); // empty image projection skipped
  });

  it("returns empty string for no projectable content", () => {
    expect(assembleSearchBody([])).toBe("");
  });
});
