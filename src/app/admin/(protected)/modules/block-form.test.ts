import { describe, expect, it } from "vitest";
import { parseDraftBlocksFromForm } from "./block-form";

describe("admin block form parser", () => {
  it("builds ordered draft blocks and skips disabled slots", () => {
    const form = new FormData();
    form.set("blockSlotCount", "3");

    form.set("block-0-enabled", "on");
    form.set("block-0-order", "2");
    form.set("block-0-type", "rich_text");
    form.set("block-0-markdown", "Deuxième texte");

    form.set("block-1-enabled", "on");
    form.set("block-1-order", "1");
    form.set("block-1-type", "quiz");
    form.set("block-1-question", "Quelle réponse ?");
    form.set("block-1-options", "Faux\nVrai *");
    form.set("block-1-explanation", "Parce que.");

    form.set("block-2-order", "3");
    form.set("block-2-type", "dilemma");
    form.set("block-2-prompt", "Ignoré");

    const result = parseDraftBlocksFromForm(form);

    expect(result.errors).toEqual([]);
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0]?.type).toBe("quiz");
    expect(result.blocks[1]?.type).toBe("rich_text");
    expect(result.blocks[0]?.payload).toMatchObject({
      question: "Quelle réponse ?",
      options: [
        { key: "a", label: "Faux", correct: false },
        { key: "b", label: "Vrai", correct: true },
      ],
      explanation: "Parce que.",
    });
  });

  it("reports invalid block types", () => {
    const form = new FormData();
    form.set("blockSlotCount", "1");
    form.set("block-0-enabled", "on");
    form.set("block-0-type", "video");

    const result = parseDraftBlocksFromForm(form);

    expect(result.blocks).toEqual([]);
    expect(result.errors[0]).toContain("type de bloc invalide");
  });
});
