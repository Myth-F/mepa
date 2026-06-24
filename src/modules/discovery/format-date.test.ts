import { describe, expect, it } from "vitest";
import { dateInputValue, formatPublishedDate } from "./format-date";

describe("publication date formatting", () => {
  it("formats dates in French", () => {
    expect(formatPublishedDate(new Date("2025-06-12T08:00:00Z"))).toBe("Publié le 12 juin 2025");
  });

  it("formats date inputs without a timezone shift", () => {
    expect(dateInputValue(new Date("2025-06-12T23:00:00Z"))).toBe("2025-06-12");
    expect(dateInputValue(null)).toBe("");
  });
});
