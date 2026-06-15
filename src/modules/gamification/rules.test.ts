import { describe, expect, it } from "vitest";
import { POINT_RULES, labelForLevel, levelForPoints, nextLevelThreshold } from "./rules";

describe("gamification rules", () => {
  it("uses the documented point values and versions", () => {
    expect(POINT_RULES.MODULE_COMPLETED).toMatchObject({ points: 50, ruleVersion: 1 });
    expect(POINT_RULES.QUIZ_PASSED).toMatchObject({ points: 20, ruleVersion: 1 });
    expect(POINT_RULES.QUIZ_FIRST_TRY_BONUS).toMatchObject({ points: 10, ruleVersion: 1 });
    expect(POINT_RULES.DILEMMA_VOTED).toMatchObject({ points: 5, ruleVersion: 1 });
  });

  it.each([
    [-1, 1],
    [0, 1],
    [99, 1],
    [100, 2],
    [249, 2],
    [250, 3],
    [500, 4],
    [1000, 5],
    [1749, 5],
    [1750, 6],
  ])("derives level for %i points", (points, expected) => {
    expect(levelForPoints(points)).toBe(expected);
  });

  it("exposes labels and next thresholds", () => {
    expect(labelForLevel(2)).toBe("Observateur");
    expect(labelForLevel(8)).toBe("Niveau 8");
    expect(nextLevelThreshold(99)).toBe(100);
    expect(nextLevelThreshold(1750)).toBe(2500);
  });
});
