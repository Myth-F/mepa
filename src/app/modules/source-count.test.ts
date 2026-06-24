import { describe, expect, it } from "vitest";
import { formatSourceCount } from "./source-count";

describe("source count", () => {
  it.each([
    [0, "0 sources"],
    [1, "1 source"],
    [5, "5 sources"],
  ])("formats %i with the correct plural", (count, expected) => {
    expect(formatSourceCount(count)).toBe(expected);
  });
});
