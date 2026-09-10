export type PerformanceBand =
  | "EXCELLENT"
  | "GOOD"
  | "AVERAGE"
  | "NEEDS_REINFORCEMENT";

export type Evolution = "PROGRESSION" | "DECLINE" | "STABLE";

function toHundredths(score: number): number {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("Score must be between 0 and 100.");
  }

  const hundredths = Math.round(score * 100);
  if (Math.abs(score * 100 - hundredths) > Number.EPSILON * 100) {
    throw new RangeError("Score must have at most two decimal places.");
  }

  return hundredths;
}

export function calculateCompleteAverage(
  scores: readonly (number | null)[],
  requiredScoreCount: 4 | 8,
): number | null {
  const enteredScores = scores.filter((score): score is number => score !== null);
  if (scores.length !== requiredScoreCount || enteredScores.length !== requiredScoreCount) {
    return null;
  }

  const totalHundredths = enteredScores.reduce(
    (total, score) => total + toHundredths(score),
    0,
  );
  return totalHundredths / requiredScoreCount / 100;
}

export function calculateSemesterSuggestion(
  scores: readonly (number | null)[],
): number | null {
  return calculateCompleteAverage(scores, 4);
}

export function calculateAnnualQuizAverage(
  scores: readonly (number | null)[],
): number | null {
  return calculateCompleteAverage(scores, 8);
}

export function getPerformanceBand(average: number): PerformanceBand {
  if (!Number.isFinite(average) || average < 0 || average > 100) {
    throw new RangeError("Average must be between 0 and 100.");
  }
  if (average >= 85) return "EXCELLENT";
  if (average >= 70) return "GOOD";
  if (average >= 50) return "AVERAGE";
  return "NEEDS_REINFORCEMENT";
}

export function getEvolution(semester1: number, semester2: number): Evolution {
  const difference = semester2 - semester1;
  if (difference > 3) return "PROGRESSION";
  if (difference < -3) return "DECLINE";
  return "STABLE";
}

export function roundForDisplay(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
