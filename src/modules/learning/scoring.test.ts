import { describe, it, expect } from "vitest";
import { scoreQuiz } from "./scoring";

const quiz = {
  question: "Quelles affirmations sont vraies ?",
  options: [
    { key: "a", label: "Les modèles apprennent de données", correct: true },
    { key: "b", label: "Les modèles sont infaillibles", correct: false },
    { key: "c", label: "Les biais peuvent se propager", correct: true },
  ],
};

describe("scoreQuiz", () => {
  it("scores a fully correct multi-answer response", () => {
    const r = scoreQuiz(quiz, ["a", "c"]);
    expect(r.passed).toBe(true);
    expect(r.score).toBe(1);
    expect(r.correctKeys.sort()).toEqual(["a", "c"]);
  });

  it("fails a partial response", () => {
    expect(scoreQuiz(quiz, ["a"]).passed).toBe(false);
  });

  it("fails when an incorrect option is included", () => {
    expect(scoreQuiz(quiz, ["a", "b", "c"]).passed).toBe(false);
  });
});
