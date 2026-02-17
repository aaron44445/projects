import { describe, it, expect } from "vitest";
import { calculateDistanceMiles } from "../../services/distance";

describe("DistanceCalculation", () => {
  it("calculates distance between two known airports", () => {
    // JFK to LGA is roughly 11 miles
    const distance = calculateDistanceMiles(40.6413, -73.7781, 40.7769, -73.8740);
    expect(distance).toBeGreaterThan(8);
    expect(distance).toBeLessThan(15);
  });

  it("returns 0 for same location", () => {
    const distance = calculateDistanceMiles(40.6413, -73.7781, 40.6413, -73.7781);
    expect(distance).toBe(0);
  });
});
