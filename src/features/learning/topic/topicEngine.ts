import { MASTERY_THRESHOLDS } from "../constants";
import type { WordLearningStats } from "../types";

export function canUnlockNextWave(words: WordLearningStats[]): boolean {
  const canunlock =
    words.length > 0 &&
    words.filter((word) => word.mastery >= MASTERY_THRESHOLDS.consolidating)
      .length /
      words.length >=
      0.8;

  return canunlock;
}
