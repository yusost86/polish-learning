import { MASTERY_THRESHOLDS, SKILL_WEIGHTS } from "../constants";
import type { ExerciseType, SkillScores, WordState } from "../types";

export function clamp(value: number, min = 0, max = 1): number { return Math.max(min, Math.min(max, value)); }
export function calculateMastery(skills: SkillScores): number {
  return skills.recognition * SKILL_WEIGHTS.recognition + skills.recall * SKILL_WEIGHTS.recall + skills.production * SKILL_WEIGHTS.production + skills.context * SKILL_WEIGHTS.context;
}
export function getWeakestSkill(skills: SkillScores): ExerciseType {
  return (Object.entries(skills) as [ExerciseType, number][]).sort((a, b) => a[1] - b[1])[0][0];
}
export function updateSkillScore(current: number, correct: boolean, responseTimeMs: number): number {
  const speedPenalty = responseTimeMs > 10_000 ? 0.1 : responseTimeMs > 6_000 ? 0.05 : 0;
  return clamp(current * 0.7 + Math.max(0, (correct ? 1 : 0) - speedPenalty) * 0.3);
}
export function determineWordState(mastery: number, attempts: number): WordState {
  if (attempts === 0) return "new";
  if (mastery < MASTERY_THRESHOLDS.INTRODUCED) return "introduced";
  if (mastery < MASTERY_THRESHOLDS.LEARNING) return "learning";
  if (mastery < MASTERY_THRESHOLDS.CONSOLIDATING) return "consolidating";
  return "mature";
}
