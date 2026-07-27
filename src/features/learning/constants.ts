import type { ExerciseType, WordState } from "./types";

export const MASTERY_THRESHOLDS: Record<WordState, number> = {
  introduced: 0.15,
  learning: 0.4,
  consolidating: 0.65,
  mature: 0.85,
  new: 0,
};
export const SKILL_WEIGHTS: Record<ExerciseType, number> = {
  recognition: 0.2,
  recall: 0.3,
  production: 0.3,
  context: 0.2,
};
