import { describe, it, expect } from "vitest";
import { validateBlock, projectBlockText, getBlockDefinition } from "./registry";

describe("block registry validation", () => {
  it("accepts a valid rich_text block", () => {
    const r = validateBlock("rich_text", 1, { markdown: "Bonjour" });
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown block type with an actionable error", () => {
    const r = validateBlock("video", 1, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("inconnu");
  });

  it("rejects an unsupported schema version", () => {
    const r = validateBlock("rich_text", 99, { markdown: "x" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("schéma");
  });

  it("requires alt text for a meaningful image", () => {
    const bad = validateBlock("image", 1, { mediaId: "m1", alt: "", decorative: false });
    expect(bad.ok).toBe(false);
    const ok = validateBlock("image", 1, { mediaId: "m1", alt: "Un graphique", decorative: false });
    expect(ok.ok).toBe(true);
    const decorative = validateBlock("image", 1, { mediaId: "m1", alt: "", decorative: true });
    expect(decorative.ok).toBe(true);
  });

  it("requires a quiz to have at least one correct option", () => {
    const r = validateBlock("quiz", 1, {
      question: "2+2 ?",
      options: [
        { key: "a", label: "3", correct: false },
        { key: "b", label: "4", correct: false },
      ],
    });
    expect(r.ok).toBe(false);
  });

  it("projects a quiz block to normalized text", () => {
    const text = projectBlockText("quiz", {
      question: "2+2 ?",
      options: [
        { key: "a", label: "3", correct: false },
        { key: "b", label: "4", correct: true },
      ],
    });
    expect(text).toContain("2+2 ?");
    expect(text).toContain("4");
  });

  it("marks quiz and dilemma blocks as interactive", () => {
    expect(getBlockDefinition("quiz")?.interaction).toBe("quiz");
    expect(getBlockDefinition("dilemma")?.interaction).toBe("dilemma");
    expect(getBlockDefinition("rich_text")?.interaction).toBe("none");
  });
});
