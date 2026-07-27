import { selectExercise } from "./exercises/exerciseSelector";
import { scheduleFsrsReview } from "./fsrs/fsrsScheduler";
import { applyAnswerToMastery } from "./mastery/masteryEngine";
import type { ExerciseType, FsrsGrade, WordModel, WordLearningStats } from "./types";

export interface SubmitAnswerInput { word: WordModel; stats: WordLearningStats; exerciseType: ExerciseType; correct: boolean; responseTimeMs: number; }
export interface SubmitAnswerResult { updatedStats: WordLearningStats; nextExercise: ReturnType<typeof selectExercise>; }

export function submitAnswer(input: SubmitAnswerInput, grade:FsrsGrade): SubmitAnswerResult {
  let updatedStats = applyAnswerToMastery(input.stats, input);
  const fsrsResult = scheduleFsrsReview(input.stats.fsrsCard, new Date(), grade);
  updatedStats = { ...updatedStats, fsrsCard: fsrsResult.card, nextReviewAt: fsrsResult.nextReviewAt, updatedAt: new Date() };
  return { updatedStats, nextExercise: selectExercise(input.word, updatedStats) };
}
