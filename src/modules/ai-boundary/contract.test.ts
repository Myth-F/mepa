import { describe, it, expect } from "vitest";
import { FakeTutorProvider } from "./fake-provider";
import { isTutorEnabled, getConfiguredTutorProvider } from "./flag";
import type { ModuleContext, TutorProvider } from "./contracts";

const sampleContext: ModuleContext = {
  moduleVersionId: "v1",
  moduleSlug: "biais-algorithmiques",
  title: "Biais algorithmiques",
  summary: "Introduction",
  content: "Les systèmes apprennent de données historiques.",
  sources: [{ id: "s1", label: "CNIL", url: "https://www.cnil.fr" }],
};

describe("tutor contract", () => {
  it("a conforming provider returns an answer and used source ids", async () => {
    const provider: TutorProvider = new FakeTutorProvider();
    const res = await provider.generate({ question: "Qu'est-ce qu'un biais ?", context: sampleContext });
    expect(res.answer).toContain("Biais algorithmiques");
    expect(res.usedSourceIds).toEqual(["s1"]);
  });

  it("swapping a provider keeps the same request/response contract", async () => {
    const a: TutorProvider = new FakeTutorProvider();
    const b: TutorProvider = new FakeTutorProvider();
    const reqShape = { question: "x", context: sampleContext };
    const ra = await a.generate(reqShape);
    const rb = await b.generate(reqShape);
    expect(Object.keys(ra).sort()).toEqual(Object.keys(rb).sort());
  });

  it("is disabled by default: no provider configured", () => {
    expect(getConfiguredTutorProvider()).toBeNull();
    expect(isTutorEnabled(getConfiguredTutorProvider() !== null)).toBe(false);
  });
});
