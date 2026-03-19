import { describe, it, expect } from "vitest";
import {
  getNextReading,
  advanceReading,
  getTotalChapters,
} from "@/lib/reading-plan";

describe("reading-plan", () => {
  describe("getNextReading", () => {
    it("returns first chapter of first book at start", () => {
      const reading = getNextReading("1-nephi", 1);
      expect(reading).toEqual({ book: "1-nephi", bookName: "1 Nephi", chapter: 1 });
    });

    it("returns correct chapter mid-book", () => {
      const reading = getNextReading("1-nephi", 15);
      expect(reading).toEqual({ book: "1-nephi", bookName: "1 Nephi", chapter: 15 });
    });
  });

  describe("advanceReading", () => {
    it("advances to next chapter in same book", () => {
      const next = advanceReading("1-nephi", 1);
      expect(next).toEqual({ book: "1-nephi", chapter: 2, cycleCompleted: false });
    });

    it("advances to next book at end of current book", () => {
      const next = advanceReading("1-nephi", 22);
      expect(next).toEqual({ book: "2-nephi", chapter: 1, cycleCompleted: false });
    });

    it("cycles back to 1 Nephi after last book", () => {
      const next = advanceReading("joseph-smith-history", 1);
      expect(next).toEqual({ book: "1-nephi", chapter: 1, cycleCompleted: true });
    });
  });

  describe("getTotalChapters", () => {
    it("returns total chapters across all standard works", () => {
      const total = getTotalChapters();
      expect(total).toBeGreaterThan(1000);
    });
  });
});
