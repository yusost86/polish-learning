import { ExerciseType } from "../domain/enums/ExerciseType";
import { WordState } from "../domain/enums/WordState";
import type { LearningWord } from "../domain/models/LearningWordModel";

/** Streak within a state before switching to the second exercise phase (Learning / Consolidating). */
const PHASE_THRESHOLD = 2;

/** Production exercises shown in Relearning, in round-robin order. */
const RELEARNING_CYCLE = [
  ExerciseType.PutLettersInCorrectOrder,
  ExerciseType.PutMissingLettersInGaps,
  ExerciseType.InputFullWord,
] as const;

function selectByStreak(
  consecutiveCorrect: number,
  threshold: number,
  beforeThreshold: ExerciseType,
  fromThreshold: ExerciseType,
): ExerciseType {
  return consecutiveCorrect < threshold ? beforeThreshold : fromThreshold;
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
 * Learning / Consolidating use `consecutiveCorrect` for two-phase selection (2 + 2 = 4 to advance).
 */
export function selectExerciseType(progress: LearningWord): ExerciseType {
  switch (progress.state) {
    case WordState.New:
      return ExerciseType.Flashcard;
    case WordState.Learning:
      return selectByStreak(
        progress.consecutiveCorrect,
        PHASE_THRESHOLD,
        ExerciseType.ForeignMultipleChoice,
        ExerciseType.NativeMultipleChoice,
      );
    case WordState.Consolidating:
      return selectByStreak(
        progress.consecutiveCorrect,
        PHASE_THRESHOLD,
        ExerciseType.PutMissingLettersInGaps,
        ExerciseType.PutLettersInCorrectOrder,
      );
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
