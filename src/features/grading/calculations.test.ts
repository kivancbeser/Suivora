import { describe, expect, it } from "vitest";

import {
  calculateAnnualQuizAverage,
  calculateSemesterSuggestion,
  getEvolution,
  getPerformanceBand,
  roundForDisplay,
} from "./calculations";

describe("grading calculations", () => {
  it("requires every score while preserving zero as an entered score", () => {
    expect(calculateSemesterSuggestion([0, 50, 75, 100])).toBe(56.25);
    expect(calculateSemesterSuggestion([null, 50, 75, 100])).toBeNull();
    expect(calculateAnnualQuizAverage([60, 70, 80, 90, 70, 80, 90, 100])).toBe(80);
  });

  it("rejects out-of-range and over-precise entered values", () => {
    expect(() => calculateSemesterSuggestion([-1, 50, 75, 100])).toThrow(RangeError);
    expect(() => calculateSemesterSuggestion([10.001, 50, 75, 100])).toThrow(RangeError);
  });

  it("uses raw continuous performance boundaries", () => {
    expect(getPerformanceBand(85)).toBe("EXCELLENT");
    expect(getPerformanceBand(84.999)).toBe("GOOD");
    expect(getPerformanceBand(70)).toBe("GOOD");
    expect(getPerformanceBand(50)).toBe("AVERAGE");
    expect(getPerformanceBand(49.999)).toBe("NEEDS_REINFORCEMENT");
  });

  it("uses strict three-point evolution thresholds", () => {
    expect(getEvolution(70, 73)).toBe("STABLE");
    expect(getEvolution(70, 73.01)).toBe("PROGRESSION");
    expect(getEvolution(70, 67)).toBe("STABLE");
    expect(getEvolution(70, 66.99)).toBe("DECLINE");
  });

  it("rounds for display without changing calculation inputs", () => {
    expect(roundForDisplay(84.999)).toBe(85);
    expect(getPerformanceBand(84.999)).toBe("GOOD");
  });
});
