import { describe, expect, it } from "vitest";
import { displayNameError, isValidPassword, passwordChecks } from "./validation";

describe("identity validation", () => {
  it("accepts universal pseudonyms while rejecting unsafe characters", () => {
    expect(displayNameError("Léo Martin-2")).toBeNull();
    expect(displayNameError("小林_7")).toBeNull();
    expect(displayNameError("<script>")).toMatch(/uniquement/);
    expect(displayNameError("x")).toMatch(/entre 2 et 40/);
  });

  it("requires a long password with a letter and a number or symbol", () => {
    expect(isValidPassword("test-password-strong")).toBe(true);
    expect(passwordChecks("onlyletterslong")).toEqual({
      longEnough: true,
      hasLetter: true,
      hasNumberOrSymbol: false,
    });
  });
});
