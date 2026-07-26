import { selectExercise } from "./exercises/exerciseSelector";
import { gradeMultipleChoice } from "./fsrs/fsrsAdapter";
import { scheduleFsrsReview } from "./fsrs/fsrsScheduler";
import { applyAnswerToMastery } from "./mastery/masteryEngine";
import type { ExerciseType, Word, WordLearningStats } from "./types";

export interface SubmitAnswerInput { word: Word; stats: WordLearningStats; exerciseType: ExerciseType; correct: boolean; responseTimeMs: number; }
export interface SubmitAnswerResult { updatedStats: WordLearningStats; nextExercise: ReturnType<typeof selectExercise>; }

export function submitAnswer(input: SubmitAnswerInput): SubmitAnswerResult {
  const grade = gradeMultipleChoice(input.correct, input.responseTimeMs, input.stats.correctStreak);
  let updatedStats = applyAnswerToMastery(input.stats, input);
  const fsrsResult = scheduleFsrsReview(input.stats.fsrsCard, new Date(), grade);
  updatedStats = { ...updatedStats, fsrsCard: fsrsResult.card, nextReviewAt: fsrsResult.nextReviewAt, updatedAt: new Date() };
  return { updatedStats, nextExercise: selectExercise(input.word, updatedStats) };
}
