import {
  calculateMastery,
  determineWordState,
  getWeakestSkill,
  updateSkillScore,
} from "./masteryCalculator";
import type { ExerciseType, WordLearningStats } from "../types";

export interface ApplyAnswerInput {
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
}
export function applyAnswerToMastery(
  stats: WordLearningStats,
  input: ApplyAnswerInput,
): WordLearningStats {
  const skills = { ...stats.skills };
  skills[input.exerciseType] = updateSkillScore(
    skills[input.exerciseType],
    input.correct,
    input.responseTimeMs,
  );
  const attempts = stats.attempts + 1;
  const now = new Date();
  const mastery = calculateMastery(skills);

  return {
    ...stats,
    skills,
    mastery: mastery,
    weakestSkill: getWeakestSkill(skills),
    attempts,
    correctAnswers: stats.correctAnswers + (input.correct ? 1 : 0),
    wrongAnswers: stats.wrongAnswers + (input.correct ? 0 : 1),
    correctStreak: input.correct ? stats.correctStreak + 1 : 0,
    averageResponseTimeMs:
      (stats.averageResponseTimeMs * stats.attempts + input.responseTimeMs) /
      attempts,
    lastExerciseType: input.exerciseType,
    lastCorrect: input.correct,
    state: determineWordState(mastery, attempts),
    lastReviewedAt: now,
    updatedAt: now,
  };
}
