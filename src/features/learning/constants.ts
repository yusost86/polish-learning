import type { ExerciseType } from "./types";

export const MASTERY_THRESHOLDS = { INTRODUCED: 0.15, LEARNING: 0.4, CONSOLIDATING: 0.65, MATURE: 0.85 } as const;
export const SKILL_WEIGHTS: Record<ExerciseType, number> = { recognition: 0.2, recall: 0.3, production: 0.3, context: 0.2 };
export const EXERCISE_THRESHOLDS = { recognition: 0.75, recall: 0.7, production: 0.7, context: 0.65 } as const;
export const MAX_LEARNING_ATTEMPTS = 5;
