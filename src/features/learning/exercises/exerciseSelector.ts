import type {
  ExerciseSelection,
  ExerciseType,
  ExerciseVariant,
  WordModel,
  WordLearningStats,
} from "../types";

function selectExerciseType(stats: WordLearningStats): ExerciseType {
  if (stats.attempts === 0 || stats.skills.recognition < 0.75)
    return "recognition";
  if (stats.skills.recall < 0.7) return "recall";
  if (stats.skills.production < 0.7) return "production";
  if (stats.skills.context < 0.65) return "context";
  return "recall";
} function selectExerciseVariant(
  type: ExerciseType,
  stats?: WordLearningStats,
): ExerciseVariant {
  switch (type) {
    case "recognition":
      return "multiple-choice";
    case "recall":
      return stats && stats.mastery >= 0.85
        ? "mixed-recall"
        : "reverse-multiple-choice";
    case "production":
      return stats && stats.skills.production >= 0.85
        ? "translation"
        : "typing";
    case "context":
      return "sentence-completion";
  }
}
export function selectExercise(
  word: WordModel ,
  stats: WordLearningStats,
): ExerciseSelection {
  const type = selectExerciseType(stats);
  
  const exercise:ExerciseSelection =  {
    word,
    type,
    variant: selectExerciseVariant(type, stats),
    reason: `Weakest skill: ${stats.weakestSkill}`,
    priority: calculateExercisePriority(stats),
  };

    return exercise;
}
function calculateExercisePriority(stats: WordLearningStats): number {
  return (
    (1 - stats.mastery) * 0.5 +
    Math.min(stats.wrongAnswers / 5, 1) * 0.3 +
    (stats.nextReviewAt && stats.nextReviewAt.getTime() <= Date.now() ? 1 : 0) *
      0.2
  );
}
