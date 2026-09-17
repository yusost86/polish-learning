import { ExerciseType } from "../domain/enums/ExerciseType";
import { WordState } from "../domain/enums/WordState";
import type { LearningWord } from "../domain/models/LearningWordModel";

/** Consecutive correct answers of one exercise type before the selector advances to the next type. */
const STREAK_TO_ADVANCE = 2;

/** Production exercises shown in Relearning, in round-robin order. */
const RELEARNING_CYCLE = [
  ExerciseType.PutLettersInCorrectOrder,
  ExerciseType.PutMissingLettersInGaps,
  ExerciseType.InputFullWord,
] as const;

/**
 * True when the last `count` history entries of `exercise` are all correct.
 * Uses per-type history, not `consecutiveCorrect`, which is shared across all types.
 */
function hasConsecutiveCorrectStreak(
  progress: LearningWord,
  exercise: ExerciseType,
  count: number,
): boolean {
  const ofType = progress.wordProgressEntries.filter((entry) => entry.exercise === exercise);
  if (ofType.length < count) {
    return false;
  }
  return ofType.slice(-count).every((entry) => entry.isCorrect);
}

/** Next type in the Relearning cycle after the most recent history entry. */
function nextRelearningExercise(progress: LearningWord): ExerciseType {
  const entries = progress.wordProgressEntries;
  const last = entries.length === 0 ? undefined : entries[entries.length - 1].exercise;
  const lastIndex = RELEARNING_CYCLE.findIndex((exercise) => exercise === last);
  if (lastIndex === -1) {
    return RELEARNING_CYCLE[0];
  }
  return RELEARNING_CYCLE[(lastIndex + 1) % RELEARNING_CYCLE.length];
}

/**
 * Picks the next exercise from `WordState` (see comments on the enum).
 * Does not change state — graduation after streaks is the engine's job.
 */
export function selectExerciseType(progress: LearningWord): ExerciseType {
  switch (progress.state) {
    case WordState.New:
      return ExerciseType.Flashcard;
    case WordState.Learning:
      // Native MC (PL → UA) until two successes of that type, then Foreign MC (UA → PL).
      return hasConsecutiveCorrectStreak(progress, ExerciseType.NativeMultipleChoice, STREAK_TO_ADVANCE)
        ? ExerciseType.ForeignMultipleChoice
        : ExerciseType.NativeMultipleChoice;
    case WordState.Consolidating:
      // Letters until two successes of that type, then missing-letter gaps.
      return hasConsecutiveCorrectStreak(progress, ExerciseType.PutLettersInCorrectOrder, STREAK_TO_ADVANCE)
        ? ExerciseType.PutMissingLettersInGaps
        : ExerciseType.PutLettersInCorrectOrder;
    case WordState.Mature:
      return ExerciseType.InputFullWord;
    case WordState.Relearning:
      return nextRelearningExercise(progress);
    default: {
      const _exhaustive: never = progress.state;
      return _exhaustive;
    }
  }
}
