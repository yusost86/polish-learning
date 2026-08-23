import { EXERCISE_MASTERY_THRESHOLDS, WEAK_SKILL_EXERCISE_THRESHOLD } from "../domain/constants";
import { ExerciseType } from "../domain/enums/ExerciseType";
import { SkillType } from "../domain/enums/SkillType";
import { WordState } from "../domain/enums/WordState";
import type { WordProgress } from "../domain/models/WordProgress";
import { calculateMastery, getSkillMasteries, getWeakestSkill, type SkillMasteries } from "./MasteryService";

function skillToExercise(skill: SkillType): ExerciseType {
  switch (skill) {
    case SkillType.Recognition:
      return ExerciseType.Recognition;
    case SkillType.Recall:
      return ExerciseType.Recall;
    case SkillType.Production:
      return ExerciseType.Production;
    case SkillType.Context:
      return ExerciseType.Context;
  }
}

function skillValue(skills: SkillMasteries, skill: SkillType): number {
  switch (skill) {
    case SkillType.Recognition:
      return skills.recognition;
    case SkillType.Recall:
      return skills.recall;
    case SkillType.Production:
      return skills.production;
    case SkillType.Context:
      return skills.context;
  }
}

function exerciseFromMasteryBand(mastery: number): ExerciseType {
  if (mastery >= EXERCISE_MASTERY_THRESHOLDS.mixedRecall) {
    return ExerciseType.MixedRecall;
  }
  if (mastery >= EXERCISE_MASTERY_THRESHOLDS.production) {
    return ExerciseType.Production;
  }
  if (mastery >= EXERCISE_MASTERY_THRESHOLDS.context) {
    return ExerciseType.Context;
  }
  if (mastery >= EXERCISE_MASTERY_THRESHOLDS.recall) {
    return ExerciseType.Recall;
  }
  return ExerciseType.Recognition;
}

export function selectExerciseType(progress: WordProgress): ExerciseType {
  const skills = getSkillMasteries(progress);
  const mastery = calculateMastery(skills);

  if (progress.state === WordState.New || progress.totalAttempts === 0) {
    return ExerciseType.Recognition;
  }

  if (mastery >= EXERCISE_MASTERY_THRESHOLDS.mixedRecall) {
    return ExerciseType.MixedRecall;
  }

  const weakest = getWeakestSkill(skills);
  const weakestMastery = skillValue(skills, weakest);
  if (weakestMastery < WEAK_SKILL_EXERCISE_THRESHOLD) {
    return skillToExercise(weakest);
  }

  return exerciseFromMasteryBand(mastery);
}

export class ExerciseSelector {
  select(progress: WordProgress): ExerciseType {
    return selectExerciseType(progress);
  }
}
