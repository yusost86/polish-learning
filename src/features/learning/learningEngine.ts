import { scheduleFsrsReview } from "./fsrs/fsrsScheduler";
import { applyAnswerToMastery } from "./mastery/masteryEngine";
import type {
  ExerciseType,
  FsrsGrade,
  WordLearningStats,
} from "./types";

interface SubmitAnswerInput {
  stats: WordLearningStats;
  exerciseType: ExerciseType;
  correct: boolean;
  responseTimeMs: number;
}
export function submitAnswer(
  input: SubmitAnswerInput,
  grade: FsrsGrade,
): WordLearningStats {
  let updatedStats = applyAnswerToMastery(input.stats, input);
  const fsrsResult = scheduleFsrsReview(
    input.stats.fsrsCard,
    new Date(),
    grade,
  );
  updatedStats = {
    ...updatedStats,
    fsrsCard: fsrsResult.card,
    nextReviewAt: fsrsResult.nextReviewAt,
    updatedAt: new Date(),
  };
  return updatedStats;
}
